// Plano ativo: o padrão (domain/plano) ou o que o assistente gerou. Dieta e treino leem daqui.
const CasosPlano = {
  plano: PlanoRepositorio.carregar(),
  ouvintes: [],

  aoMudar(fn) { this.ouvintes.push(fn); },
  avisar() { PlanoRepositorio.salvar(this.plano); this.ouvintes.forEach(fn => fn()); },

  refeicoes() { return this.plano.dieta?.refeicoes || MEALS; },
  fichas() { return this.plano.treino?.fichas || WK; },

  // Data em que a dieta/o treino atual foi gerado, ou null se for o padrão
  geradoEm(tipo) { return this.plano[tipo]?.geradoEm || null; },

  definirDieta(refeicoes) {
    this.plano = { ...this.plano, dieta: { refeicoes, geradoEm: dateKey(today()) } };
    Preferencias.salvar('escolhasCardapio', {}); // as opções mudaram: volta para a primeira de cada
    CasosCardapio.escolhas = {};
    this.avisar();
  },

  definirTreino(fichas) {
    this.plano = { ...this.plano, treino: { fichas, geradoEm: dateKey(today()) } };
    CasosTreino.feitos = {}; // marcações eram dos exercícios antigos
    Preferencias.salvar('exerciciosFeitos', {});
    this.avisar();
  },

  // Edição pontual feita por uma ação do assistente (troca de exercício, de refeição...).
  // Diferente de definir*, não zera tudo: só as marcações da ficha que mudou.
  editarTreino(fichas, letraMudada) {
    const indice = fichas.findIndex(w => w.k === letraMudada);
    Object.keys(CasosTreino.feitos).filter(k => k.startsWith(indice + '-')).forEach(k => delete CasosTreino.feitos[k]);
    Preferencias.salvar('exerciciosFeitos', CasosTreino.feitos);
    this.plano = { ...this.plano, treino: { fichas, geradoEm: this.plano.treino?.geradoEm || dateKey(today()) } };
    this.avisar();
  },

  editarDieta(refeicoes) {
    this.plano = { ...this.plano, dieta: { refeicoes, geradoEm: this.plano.dieta?.geradoEm || dateKey(today()) } };
    this.avisar();
  },

  restaurar(tipo) {
    this.plano = { ...this.plano, [tipo]: null };
    if (tipo === 'dieta') { CasosCardapio.escolhas = {}; Preferencias.salvar('escolhasCardapio', {}); }
    else { CasosTreino.feitos = {}; Preferencias.salvar('exerciciosFeitos', {}); }
    this.avisar();
  }
};
