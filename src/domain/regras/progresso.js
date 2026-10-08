// Regras de constância. Todas são funções puras sobre os "registros":
// { "2026-10-08": { dieta: true, rotina: false, treino: true }, ... }
const Progresso = {
  // Quantas áreas foram cumpridas no dia (0 a 3), ou 0/1 se filtrar por uma só
  pontos(registros, key, filtro = 'tudo') {
    const d = registros[key] || {};
    if (filtro !== 'tudo') return d[filtro] ? 1 : 0;
    return CATEGORIAS.filter(c => d[c.id]).length;
  },

  // O dia conta na sequência? Com filtro: cumpriu aquela área. Em "tudo": cumpriu todas
  cumpriu(registros, key, filtro = 'tudo') {
    return filtro === 'tudo'
      ? this.pontos(registros, key) === CATEGORIAS.length
      : this.pontos(registros, key, filtro) === 1;
  },

  // Devolve um NOVO objeto de registros com a área do dia invertida
  alternar(registros, key, cat) {
    const novo = { ...registros };
    const dia = { ...(registros[key] || {}) };
    dia[cat] = !dia[cat];
    if (CATEGORIAS.some(c => dia[c.id])) novo[key] = dia;
    else delete novo[key];
    return novo;
  },

  // Sequência atual. Se hoje ainda não foi cumprido, conta a partir de ontem (o dia ainda não acabou)
  sequenciaAtual(registros, filtro, hoje) {
    let d = hoje;
    if (!this.cumpriu(registros, dateKey(d), filtro)) d = addDays(d, -1);
    let n = 0;
    while (this.cumpriu(registros, dateKey(d), filtro)) { n++; d = addDays(d, -1); }
    return n;
  },

  melhorSequencia(registros, filtro) {
    const dias = Object.keys(registros).filter(k => this.cumpriu(registros, k, filtro)).sort();
    let melhor = 0, atual = 0, anterior = null;
    for (const k of dias) {
      atual = anterior && dateKey(addDays(anterior, 1)) === k ? atual + 1 : 1;
      melhor = Math.max(melhor, atual);
      anterior = parseKey(k);
    }
    return melhor;
  },

  // Em quantos dos últimos N dias (incluindo hoje) a área foi cumprida
  nosUltimos(registros, n, filtro, hoje) {
    let total = 0, d = hoje;
    for (let i = 0; i < n; i++) {
      if (this.cumpriu(registros, dateKey(d), filtro)) total++;
      d = addDays(d, -1);
    }
    return total;
  }
};
