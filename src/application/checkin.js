// Casos de uso do check-in: marcar uma área, consultar um dia, montar o resumo de constância.
// Junta as regras (domain) com o armazenamento (data) e avisa quem estiver ouvindo.
const CasosCheckin = {
  registros: CheckinRepositorio.carregar(),
  ouvintes: [],

  aoMudar(fn) { this.ouvintes.push(fn); },

  dia(key) { return this.registros[key] || {}; },

  pontos(key, filtro) { return Progresso.pontos(this.registros, key, filtro); },

  alternar(key, cat) {
    this.registros = Progresso.alternar(this.registros, key, cat);
    CheckinRepositorio.salvar(this.registros);
    this.ouvintes.forEach(fn => fn());
  },

  resumo(filtro) {
    const r = this.registros, hoje = today();
    return {
      sequenciaAtual: Progresso.sequenciaAtual(r, filtro, hoje),
      melhorSequencia: Progresso.melhorSequencia(r, filtro),
      ultimos30: Progresso.nosUltimos(r, 30, filtro, hoje),
      diasRegistrados: Object.keys(r).length,
      porCategoria: CATEGORIAS.map(c => ({ ...c, ultimos30: Progresso.nosUltimos(r, 30, c.id, hoje) }))
    };
  }
};
