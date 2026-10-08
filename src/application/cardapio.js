// Casos de uso do cardápio: trocar opção de refeição, alternar dia de treino, somar o dia
const CasosCardapio = {
  escolhas: Preferencias.ler('escolhasCardapio', {}),
  diaDeTreino: Preferencias.ler('diaDeTreino', true),

  refeicoes() {
    return Cardapio.refeicoesDoDia(MEALS, this.diaDeTreino)
      .map(m => ({ id: m.id, hora: m.t, nome: m.n, opcao: Cardapio.opcao(m, this.escolhas) }));
  },

  trocar(id) {
    this.escolhas = { ...this.escolhas, [id]: this.escolhas[id] ? 0 : 1 };
    Preferencias.salvar('escolhasCardapio', this.escolhas);
  },

  definirDiaDeTreino(v) {
    this.diaDeTreino = v;
    Preferencias.salvar('diaDeTreino', v);
  },

  total() {
    return Cardapio.total(MEALS, this.escolhas, this.diaDeTreino);
  }
};
