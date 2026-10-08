// Casos de uso do perfil: ler, atualizar, exportar e importar os dados da pessoa.
// Quem depende do perfil (metas, rotina, cardápio, telas) ouve as mudanças.
const CasosPerfil = {
  perfil: Perfil.normalizar(PerfilRepositorio.carregar() || {}),
  salvo: !!PerfilRepositorio.carregar(),
  ouvintes: [],

  aoMudar(fn) { this.ouvintes.push(fn); },

  atual() { return this.perfil; },

  // false até a pessoa mexer no perfil pela primeira vez
  existe() { return this.salvo; },

  atualizar(parcial) {
    this.perfil = Perfil.normalizar({ ...this.perfil, ...parcial });
    this.salvo = true;
    PerfilRepositorio.salvar(this.perfil);
    this.ouvintes.forEach(fn => fn());
  },

  exportar() {
    return { app: 'RoutineSite', versao: 1, exportadoEm: new Date().toISOString(), dados: PerfilRepositorio.exportarTudo() };
  },

  // Substitui tudo pelo conteúdo do arquivo. Quem chamar deve recarregar a página.
  importar(json) {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    if (!obj || obj.app !== 'RoutineSite' || typeof obj.dados !== 'object') throw new Error('Arquivo não é um backup do RoutineSite');
    PerfilRepositorio.substituirTudo(obj.dados);
  },

  apagarTudo() { PerfilRepositorio.substituirTudo({}); }
};
