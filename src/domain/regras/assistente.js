// Regras do assistente: o que dizer ao modelo e como conferir o que ele devolve.
// Funções puras: recebem dados, devolvem texto ou objetos validados. Não fazem chamada nenhuma.
const IDS_REFEICOES = ['pre', 'cafe', 'lm', 'alm', 'lt', 'jan', 'ceia'];
const PAPEIS_FICHAS = [
  { k: 'A', papel: 'empurrar: peito, ombros e tríceps' },
  { k: 'B', papel: 'pernas completas (quadríceps, posteriores, glúteos, panturrilha) + core' },
  { k: 'C', papel: 'puxar: costas e bíceps' },
  { k: 'D', papel: 'corpo inteiro curto (segundo estímulo da semana, ou treino único quando há só 1–2 dias)' }
];

const PROMPT_SISTEMA = `Você é o assistente do RoutineSite: entende de nutrição esportiva e de treino como um nutricionista e um educador físico.

Seu jeito:
- Português do Brasil, casual e amigável, como aquele amigo que manja de treino e alimentação. Pode soltar um "bora", "show", "tranquilo", sem exagerar. No máximo 1 emoji por resposta, e só se combinar.
- Curto: 2 a 4 frases na maioria das vezes. Lista só quando tiver opções ou passos (até 4 itens). Explique mais só se a pessoa pedir ou se for importante para a segurança dela.
- Comece pela resposta. Nada de "Ótima pergunta!" nem repetir o que a pessoa disse.
- Destaque em **negrito** os números e as opções principais, para dar para ler batendo o olho.
- Números certos: use as metas, o plano e as restrições dos dados abaixo. Não invente dados; se faltar algo importante, pergunte.
- Comida brasileira comum, barata e que dá para levar na marmita, com quantidades em gramas ou medidas caseiras. Treino com exercícios comuns de academia (ou em casa, se a pessoa disser), com séries × repetições e descanso.

Segurança:
- Você não substitui consulta presencial. Se a pessoa citar doença, remédio, gravidez, dor, lesão ou histórico de transtorno alimentar, seja cuidadoso e recomende um profissional, numa frase.
- Nunca sugira dieta abaixo do gasto basal, jejum prolongado, anabolizantes, remédios para emagrecer ou suplementos sem evidência.
- Respeite SEMPRE as restrições salvas da pessoa.`;

// Só na conversa: como propor mudanças no plano (a pessoa confirma num botão)
const PROMPT_ACOES = `MUDANÇAS NO PLANO
Você pode propor mudanças no plano da pessoa. Ela vê cada uma com um botão "Aplicar" e decide.
Proponha quando ela pedir uma mudança, contar uma restrição (lesão, dor, alergia, equipamento, algo que não gosta) ou informar um dado novo (ex.: "pesei 70 kg"). Em conversa só de dúvida, não proponha nada.

Para propor, termine a resposta com um bloco exatamente neste formato (lista JSON válida):
\`\`\`acoes
[{"tipo":"...", ...}]
\`\`\`

Tipos:
- {"tipo":"trocar_exercicio","ficha":"C","de":"<nome do exercício atual>","para":{"nome":"...","series":"3 × 8–12","descanso":"90 s"}}
- {"tipo":"remover_exercicio","ficha":"C","nome":"<nome do exercício atual>"}
- {"tipo":"adicionar_exercicio","ficha":"B","exercicio":{"nome":"...","series":"3 × 10–12","descanso":"60 s"}}
- {"tipo":"trocar_refeicao","refeicao":"alm","opcao":1,"itens":["120 g de ...","..."],"kcal":0,"proteina":0,"carbo":0,"gordura":0}
- {"tipo":"salvar_restricao","area":"treino|dieta|geral","texto":"frase curta, ex.: Não fazer remada curvada (lombar)"}
- {"tipo":"atualizar_perfil","campo":"peso|idade|altura|objetivo|atividade","valor":71.5}
- {"tipo":"regenerar","alvo":"dieta|treino","pedido":"o que levar em conta"}

Regras:
- Use os nomes dos exercícios e os ids das refeições exatamente como aparecem no plano abaixo.
- Restrição nova: salve com salvar_restricao E já troque o que estiver em conflito no plano atual.
- Troca de refeição: mantenha calorias e proteína parecidas com a opção que sai.
- Sempre escreva pelo menos uma frase antes do bloco (ex.: comente o progresso quando a pessoa contar o peso), dizendo o que você está sugerindo. Quem aplica é a pessoa, no botão: escreva "sugiro", "que tal", "deixei pronto pra você aplicar", nunca "vou atualizar", "já salvei" ou "já troquei".
- No máximo 5 ações por resposta.`;

const Assistente = {
  // Resumo da pessoa e do plano atual, enviado junto com toda conversa
  contexto({ perfil: p, calculo: r, semana, refeicoes, fichas }) {
    const obj = OBJETIVOS[p.objetivo];
    const diasTreino = semana.dias.filter(d => d.ficha != null).map(d => `${d.nome} (ficha ${fichas[d.ficha].k})`);
    const cardapio = refeicoes.map(m =>
      `- [${m.id}] ${m.n}${m.train ? ' (só dia de treino)' : ''}: ` + m.o.map((o, i) => `opção ${i + 1}: ${o.i.join(', ')} [${o.m[0]} kcal, ${o.m[1]} g prot]`).join(' | ')
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
RESTRIÇÕES SALVAS (respeite sempre)
${p.restricoes.length ? p.restricoes.map(r => `- (${r.area}) ${r.texto}`).join('\n') : '- nenhuma'}

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
- Respeite TODAS as restrições salvas e as preferências que aparecem nos dados.
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
- Sessão de até ~55 min de força. Respeite TODAS as restrições salvas, lesões, equipamento disponível e preferências que aparecem nos dados.
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
