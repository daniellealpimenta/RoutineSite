// Ações que o assistente pode propor no plano (trocar exercício, salvar restrição, atualizar peso...).
// O modelo escreve um bloco ```acoes [...]``` no fim da resposta; aqui ele é extraído, validado
// contra o plano atual e transformado em mudanças. Nada é aplicado sem a pessoa clicar em "Aplicar".
// Funções puras: recebem dados, devolvem dados novos (nunca alteram o que receberam).
const AREAS_RESTRICAO = { treino: 'Treino', dieta: 'Dieta', geral: 'Geral' };
const CAMPOS_PERFIL = {
  peso:      { nome: 'peso', unidade: ' kg', min: 30, max: 250 },
  idade:     { nome: 'idade', unidade: ' anos', min: 14, max: 100 },
  altura:    { nome: 'altura', unidade: ' cm', min: 120, max: 230 },
  objetivo:  { nome: 'objetivo' },
  atividade: { nome: 'nível de atividade' }
};
const MAX_ACOES = 5;
// Fechamento opcional: às vezes o modelo esquece o ``` final
const BLOCO_ACOES = /```(?:acoes|ações|json)?\s*(\[[\s\S]*\])\s*(?:```|$)/i;

// Nome comparável: sem HTML, acentos, maiúsculas e pontuação
function chaveNome(s) {
  return String(s).replace(/<[^>]+>/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const Acoes = {
  // Separa o texto da resposta do bloco de ações. Durante o stream, esconde o bloco ainda incompleto.
  extrair(texto) {
    const m = texto.match(BLOCO_ACOES);
    if (m && /"tipo"/.test(m[1])) {
      let brutas = [];
      try { brutas = JSON.parse(m[1]); } catch (e) { brutas = []; }
      return { texto: texto.replace(m[0], '').trim(), brutas: Array.isArray(brutas) ? brutas : [] };
    }
    // bloco ainda chegando (ex.: "```aco" ou "```acoes\n[{\"ti"): esconde a partir da cerca aberta
    const i = texto.lastIndexOf('```');
    if (i >= 0) {
      const resto = texto.slice(i + 3).trimStart().toLowerCase();
      if (!resto || ['acoes', 'ações', 'json', '['].some(a => a.startsWith(resto) || resto.startsWith(a))) {
        return { texto: texto.slice(0, i).trim(), brutas: [] };
      }
    }
    return { texto: texto.replace(/\n`{1,2}$/, '').trim(), brutas: [] }; // "``" no fim pode virar uma cerca
  },

  // Índice do exercício cujo nome bate (exato, depois "começa com", depois "contém"). -1 se nenhum ou ambíguo.
  acharExercicio(ficha, nome) {
    const alvo = chaveNome(nome);
    if (!alvo) return -1;
    const nomes = ficha.x.map(x => chaveNome(x[0]));
    for (const teste of [n => n === alvo, n => n.startsWith(alvo) || alvo.startsWith(n), n => n.includes(alvo) || alvo.includes(n)]) {
      const achados = nomes.map((n, i) => (teste(n) ? i : -1)).filter(i => i >= 0);
      if (achados.length === 1) return achados[0];
      if (achados.length > 1) return -1;
    }
    return -1;
  },

  exercicio(e) {
    if (!e || typeof e !== 'object') return null;
    const nome = textoDoModelo(e.nome, 80), series = textoDoModelo(e.series, 24);
    return nome && series ? [nome, series, textoDoModelo(e.descanso, 16) || '60 s'] : null;
  },

  // Confere cada ação contra o plano atual e devolve só as válidas, já com uma descrição para a tela
  validar(brutas, { fichas, refeicoes, perfil }) {
    const validas = [];
    for (const a of (brutas || []).slice(0, MAX_ACOES)) {
      const v = a && typeof a === 'object' ? this.validarUma(a, { fichas, refeicoes, perfil }) : null;
      if (v) validas.push({ ...v, estado: 'pendente' });
    }
    return validas;
  },

  validarUma(a, { fichas, refeicoes, perfil }) {
    const ficha = fichas.find(w => w.k === String(a.ficha || '').toUpperCase().trim());
    const limpo = n => n.replace(/<[^>]+>.*$/, '').trim(); // tira o <small> dos nomes padrão
    switch (a.tipo) {
      case 'trocar_exercicio': {
        const para = this.exercicio(a.para);
        const i = ficha ? this.acharExercicio(ficha, a.de) : -1;
        if (!para || i < 0) return null;
        const de = limpo(ficha.x[i][0]);
        return { tipo: a.tipo, ficha: ficha.k, de, para, descricao: `Ficha ${ficha.k}: trocar "${de}" por "${para[0]}" (${para[1]})` };
      }
      case 'remover_exercicio': {
        const i = ficha ? this.acharExercicio(ficha, a.nome) : -1;
        if (i < 0 || ficha.x.length <= 3) return null;
        const nome = limpo(ficha.x[i][0]);
        return { tipo: a.tipo, ficha: ficha.k, nome, descricao: `Ficha ${ficha.k}: tirar "${nome}"` };
      }
      case 'adicionar_exercicio': {
        const ex = this.exercicio(a.exercicio);
        if (!ficha || !ex || ficha.x.length >= 10) return null;
        return { tipo: a.tipo, ficha: ficha.k, exercicio: ex, descricao: `Ficha ${ficha.k}: adicionar "${ex[0]}" (${ex[1]})` };
      }
      case 'trocar_refeicao': {
        const r = refeicoes.find(m => m.id === a.refeicao);
        const opcao = +a.opcao === 2 ? 1 : 0;
        const itens = Array.isArray(a.itens) ? a.itens.map(i => textoDoModelo(i, 160)).filter(Boolean).slice(0, 8) : [];
        const m = [numeroDoModelo(a.kcal, 0, 2000), numeroDoModelo(a.proteina, 0, 200), numeroDoModelo(a.carbo, 0, 400), numeroDoModelo(a.gordura, 0, 200)];
        if (!r || !itens.length || !m[0]) return null;
        return { tipo: a.tipo, refeicao: r.id, opcao, itens, m, descricao: `${r.n}, opção ${opcao + 1}: ${itens.join(', ')} (${m[0]} kcal, ${m[1]} g de proteína)` };
      }
      case 'salvar_restricao': {
        const area = AREAS_RESTRICAO[a.area] ? a.area : 'geral';
        const texto = textoDoModelo(a.texto, 150);
        if (texto.length < 3 || (perfil.restricoes || []).some(r => chaveNome(r.texto) === chaveNome(texto))) return null;
        return { tipo: a.tipo, area, texto, descricao: `Lembrar sempre (${AREAS_RESTRICAO[area].toLowerCase()}): "${texto}"` };
      }
      case 'atualizar_perfil': {
        const campo = CAMPOS_PERFIL[a.campo];
        if (!campo) return null;
        let valor = a.valor, antes = perfil[a.campo], txt;
        if (a.campo === 'objetivo') {
          if (!OBJETIVOS[valor]) return null;
          txt = `${OBJETIVOS[antes]?.nome} → ${OBJETIVOS[valor].nome}`;
        } else if (a.campo === 'atividade') {
          const nivel = NIVEIS_ATIVIDADE.find(n => n.valor === +valor);
          if (!nivel) return null;
          valor = nivel.valor; txt = `×${String(antes).replace('.', ',')} → ×${String(valor).replace('.', ',')}`;
        } else {
          valor = Math.round(+valor * 10) / 10;
          if (!(valor >= campo.min && valor <= campo.max)) return null;
          txt = `${String(antes).replace('.', ',')} → ${String(valor).replace('.', ',')}${campo.unidade}`;
        }
        if (valor === antes) return null;
        return { tipo: a.tipo, campo: a.campo, valor, descricao: `Perfil, ${campo.nome}: ${txt}` };
      }
      case 'regenerar': {
        if (a.alvo !== 'dieta' && a.alvo !== 'treino') return null;
        const pedido = textoDoModelo(a.pedido, 200);
        return { tipo: a.tipo, alvo: a.alvo, pedido, descricao: `Gerar ${a.alvo === 'dieta' ? 'um cardápio novo' : 'fichas de treino novas'}${pedido ? ': ' + pedido : ''}` };
      }
    }
    return null;
  },

  // Devolve fichas novas com a ação aplicada. Lança erro se o plano mudou e o alvo não existe mais.
  aplicarTreino(fichas, a) {
    const novas = fichas.map(w => ({ ...w, x: w.x.map(x => [...x]) }));
    const ficha = novas.find(w => w.k === a.ficha);
    if (!ficha) throw new Error('Essa ficha não existe mais.');
    if (a.tipo === 'adicionar_exercicio') {
      ficha.x.push([...a.exercicio]);
    } else {
      const i = this.acharExercicio(ficha, a.tipo === 'trocar_exercicio' ? a.de : a.nome);
      if (i < 0) throw new Error('O plano mudou desde a sugestão: o exercício não está mais lá.');
      if (a.tipo === 'trocar_exercicio') ficha.x[i] = [...a.para];
      else ficha.x.splice(i, 1);
    }
    return novas;
  },

  aplicarDieta(refeicoes, a) {
    const novas = refeicoes.map(m => ({ ...m, o: m.o.map(o => ({ i: [...o.i], m: [...o.m] })) }));
    const r = novas.find(m => m.id === a.refeicao);
    if (!r || !r.o[a.opcao]) throw new Error('Essa refeição não existe mais.');
    r.o[a.opcao] = { i: [...a.itens], m: [...a.m] };
    return novas;
  },

  // Resumo para o histórico enviado ao modelo, para ele saber o que foi aceito
  resumo(acoes) {
    const estado = { pendente: 'aguardando', aplicada: 'aplicada', ignorada: 'ignorada', erro: 'falhou', aplicando: 'aplicando' };
    return acoes.map(a => `- ${a.descricao} [${estado[a.estado] || a.estado}]`).join('\n');
  }
};
