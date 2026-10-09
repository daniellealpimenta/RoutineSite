// Cardápio e fichas gerados pelo assistente. null = usar o plano padrão (domain/plano).
const PlanoRepositorio = {
  KEY: 'rd-plano-ia',
  carregar() { return store.get(this.KEY, { dieta: null, treino: null }); },
  salvar(plano) { store.set(this.KEY, plano); }
};

// Histórico da conversa com o assistente
const ConversaRepositorio = {
  KEY: 'rd-chat',
  LIMITE: 60, // guarda só as últimas mensagens
  carregar() { return store.get(this.KEY, []); },
  salvar(msgs) { store.set(this.KEY, msgs.slice(-this.LIMITE)); }
};
