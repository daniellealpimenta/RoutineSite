// Escolhas da interface que precisam ser lembradas entre visitas.
// Os nomes à esquerda são usados no código; à direita, as chaves reais no navegador
// (mantidas iguais às da versão antiga para não perder o que já estava salvo).
const CHAVES_PREFERENCIAS = {
  aba: 'rd-tab',
  escolhasCardapio: 'rd-pick',
  diaDeTreino: 'rd-train',
  treinoAtual: 'rd-wk',
  exerciciosFeitos: 'rd-done2',
  filtroProgresso: 'rd-filtro'
};

const Preferencias = {
  ler(nome, padrao) { return store.get(CHAVES_PREFERENCIAS[nome], padrao); },
  salvar(nome, valor) { store.set(CHAVES_PREFERENCIAS[nome], valor); }
};
