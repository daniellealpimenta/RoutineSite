// Onde o perfil (dados pessoais e rotina) fica guardado.
// Também sabe exportar/importar tudo o que o app salvou (todas as chaves "rd-").
const PerfilRepositorio = {
  KEY: 'rd-perfil',
  PREFIXO: 'rd-',
  carregar() { return store.get(this.KEY, null); },
  salvar(perfil) { store.set(this.KEY, perfil); },
  exportarTudo() { return store.todos(this.PREFIXO); },
  substituirTudo(dados) { store.substituir(this.PREFIXO, dados); }
};
