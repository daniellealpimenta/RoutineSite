// Regras do assistente: o que dizer ao modelo e como conferir o que ele devolve.
// Funções puras: recebem dados, devolvem texto ou objetos validados. Não fazem chamada nenhuma.
const IDS_REFEICOES = ['pre', 'cafe', 'lm', 'alm', 'lt', 'jan', 'ceia'];
const PAPEIS_FICHAS = [
  { k: 'A', papel: 'empurrar: peito, ombros e tríceps' },
  { k: 'B', papel: 'pernas completas (quadríceps, posteriores, glúteos, panturrilha) + core' },
  { k: 'C', papel: 'puxar: costas e bíceps' },
  { k: 'D', papel: 'corpo inteiro curto (segundo estímulo da semana, ou treino único quando há só 1–2 dias)' }
];

const PROMPT_SISTEMA = `Você é o assistente do RoutineSite e atua como nutricionista esportivo/nutrólogo e educador físico.

Como responder:
- Português do Brasil, linguagem simples, direto ao ponto.
- Curto: até ~120 palavras, salvo se a pessoa pedir detalhes. Use listas curtas quando ajudar.
- Baseie tudo nos dados da pessoa abaixo (metas, rotina, plano atual). Não invente dados que não estão lá; se faltar algo importante, pergunte.
- Prefira comida brasileira comum, barata e fácil de levar em marmita. Dê quantidades em medidas caseiras ou gramas.
- Treino: exercícios comuns de academia (ou em casa, se a pessoa indicar), com séries × repetições e descanso.

Segurança:
- Você não substitui consulta presencial. Se a pessoa citar doença, remédio, gravidez, dor, lesão ou histórico de transtorno alimentar, responda com cautela e recomende um profissional.
- Nunca sugira dietas muito restritivas (abaixo do gasto basal), jejum prolongado, anabolizantes, remédios para emagrecer ou suplementos sem evidência.`;

const Assistente = {
  // Resumo da pessoa e do plano atual, enviado junto com toda conversa
  contexto({ perfil: p, calculo: r, semana, refeicoes, fichas }) {
    const obj = OBJETIVOS[p.objetivo];
    const diasTreino = semana.dias.filter(d => d.ficha != null).map(d => `${d.nome} (ficha ${fichas[d.ficha].k})`);
    const cardapio = refeicoes.map(m =>
      `- ${m.n}${m.train ? ' (só dia de treino)' : ''}: ` + m.o.map((o, i) => `opção ${i + 1}: ${o.i.join(', ')} [${o.m[0]} kcal, ${o.m[1]} g prot]`).join(' | ')
    ).join('\n');
    const treinos = fichas.map(w => `- Ficha ${w.k} (${w.s}): ` + w.x.map(x => `${x[0].replace(/<[^>]+>/g, '')} ${x[1]}`).join('; ')).join('\n');
    const rotina = semana.grupos.map(g => `- ${g.nome}: ` + g.dia.itens.map(i => `${i.hora} ${i.texto}`).join(', ')).join('\n');
    return `DADOS DA PESSOA
${p.nome ? 'Nome: ' + p.nome + '\n' : ''}Sexo: ${p.sexo === 'f' ? 'feminino' : 'masculino'} · ${p.idade} anos · ${p.peso} kg · ${p.altura} cm · IMC ${r.imc.toFixed(1)}
Objetivo: ${obj.nome} (${obj.resumo})
Gasto basal ~${Math.round(r.bmr)} kcal · gasto total ~${Math.round(r.tdee)} kcal
META DIÁRIA: ${r.meta.kcal} kcal · proteína ${r.meta.p} g · carboidrato ${r.meta.c} g · gordura ${r.meta.f} g
Acorda ${p.acordar}, dorme ${p.dormir}. Ocupado (trabalho/estudo) das ${p.inicioAtividades} às ${p.fimAtividades} nos dias úteis.
Treina ${diasTreino.length ? diasTreino.join(', ') : 'nenhum dia (só caminhadas)'}; em dia útil treina ${p.horarioTreino === 'antes' ? 'antes' : 'depois'} das atividades.
${p.sobreRotina ? 'Sobre a rotina, nas palavras da pessoa: "' + p.sobreRotina + '"\n' : ''}
ROTINA ATUAL
${rotina}

CARDÁPIO ATUAL
${cardapio}

TREINOS ATUAIS
${treinos}`;
  },

  pedidoDieta(meta, pedidoExtra) {
    return `Monte um NOVO cardápio para mim, diferente do atual, com comidas variadas.

Regras:
- 7 refeições, com exatamente estes ids e nesta ordem: pre (pré-treino leve, só em dia de treino), cafe, lm (lanche da manhã), alm (almoço), lt (lanche da tarde), jan (jantar), ceia.
- Cada refeição com exatamente 2 opções equivalentes em calorias.
- Somando a primeira opção de cada refeição: cerca de ${meta.kcal} kcal e pelo menos ${meta.p} g de proteína.
- Itens com quantidade (ex.: "120 g de frango grelhado", "2 col. de sopa de aveia"). No máximo 6 itens por opção.
- Respeite restrições e preferências que aparecem nos dados.
${pedidoExtra ? '- Pedido da pessoa: ' + pedidoExtra + '\n' : ''}
Responda APENAS com JSON válido, sem texto antes ou depois, neste formato:
{"refeicoes":[{"id":"pre","nome":"Pré-treino","opcoes":[{"itens":["..."],"kcal":0,"proteina":0,"carbo":0,"gordura":0},{"itens":["..."],"kcal":0,"proteina":0,"carbo":0,"gordura":0}]}]}`;
  },

  pedidoTreino(pedidoExtra) {
    return `Monte NOVAS fichas de musculação para mim, variando os exercícios em relação às atuais.

Regras:
- Exatamente 4 fichas, nesta ordem e com estes focos:
${PAPEIS_FICHAS.map(f => `  ${f.k}: ${f.papel}`).join('\n')}
- 5 a 8 exercícios por ficha; o primeiro é o principal (composto, 6–10 reps).
- "series" no formato "3 × 8–12"; "descanso" como "90 s" ou "2 min".
- "cardio": uma frase curta com o cardio do fim do treino (12 a 20 min, ritmo leve).
- Sessão de até ~55 min de força. Respeite lesões, equipamento disponível e preferências que aparecem nos dados.
${pedidoExtra ? '- Pedido da pessoa: ' + pedidoExtra + '\n' : ''}
Responda APENAS com JSON válido, sem texto antes ou depois, neste formato:
{"fichas":[{"letra":"A","foco":"Peito, ombros e tríceps","cardio":"...","exercicios":[{"nome":"...","series":"4 × 6–10","descanso":"2 min"}]}]}`;
  },

  // Pega o JSON mesmo que venha dentro de ```json ... ``` ou com texto em volta
  extrairJson(texto) {
    const ini = texto.indexOf('{'), fim = texto.lastIndexOf('}');
    if (ini < 0 || fim <= ini) throw new Error('O assistente não devolveu um plano no formato esperado. Tente de novo.');
    try { return JSON.parse(texto.slice(ini, fim + 1)); }
    catch (e) { throw new Error('O plano veio com erro de formatação. Tente de novo.'); }
  },

  // Converte a resposta para o formato de MEALS. Lança erro se algo estiver fora do esperado.
  validarDieta(obj) {
    const lista = obj && Array.isArray(obj.refeicoes) ? obj.refeicoes : null;
    if (!lista) throw new Error('Cardápio sem a lista de refeições.');
    return IDS_REFEICOES.map(id => {
      const r = lista.find(x => x && x.id === id);
      if (!r || !Array.isArray(r.opcoes) || r.opcoes.length < 2) throw new Error(`Refeição "${id}" faltando ou sem 2 opções.`);
      const base = MEALS.find(m => m.id === id);
      return {
        id, n: textoDoModelo(r.nome, 40) || base.n, train: id === 'pre',
        o: r.opcoes.slice(0, 2).map(o => {
          const itens = Array.isArray(o.itens) ? o.itens.map(i => textoDoModelo(i, 160)).filter(Boolean).slice(0, 8) : [];
          if (!itens.length) throw new Error(`Opção sem itens em "${id}".`);
          return { i: itens, m: [numeroDoModelo(o.kcal, 0, 2000), numeroDoModelo(o.proteina, 0, 200), numeroDoModelo(o.carbo, 0, 400), numeroDoModelo(o.gordura, 0, 200)] };
        })
      };
    });
  },

  // Converte a resposta para o formato de WK
  validarTreino(obj) {
    const lista = obj && Array.isArray(obj.fichas) ? obj.fichas : null;
    if (!lista || lista.length < 4) throw new Error('O treino precisa ter 4 fichas.');
    return PAPEIS_FICHAS.map((f, i) => {
      const w = lista.find(x => x && String(x.letra).toUpperCase() === f.k) || lista[i];
      const x = Array.isArray(w.exercicios) ? w.exercicios.slice(0, 10).map(e => [textoDoModelo(e.nome, 80), textoDoModelo(e.series, 24), textoDoModelo(e.descanso, 16)]).filter(e => e[0] && e[1]) : [];
      if (x.length < 3) throw new Error(`Ficha ${f.k} com poucos exercícios.`);
      return { k: f.k, s: textoDoModelo(w.foco, 90) || f.papel, c: textoDoModelo(w.cardio, 160) || 'Cardio: 12 a 15 min em ritmo leve.', x };
    });
  }
};

// Texto vindo do modelo: string curta e sem HTML (as telas usam innerHTML)
function textoDoModelo(v, max) {
  return typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[<>]/g, '').trim().slice(0, max) : '';
}
function numeroDoModelo(v, min, max) {
  const n = Math.round(+v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;
}
