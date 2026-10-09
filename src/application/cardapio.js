// Casos de uso do cardápio: trocar opção de refeição, alternar dia de treino, somar o dia
const CasosCardapio = {
  escolhas: Preferencias.ler('escolhasCardapio', {}),
  diaDeTreino: Preferencias.ler('diaDeTreino', true),

  // Quanto as porções devem mudar para o cardápio base bater a meta do perfil (diferenças < 3% são ignoradas)
  fator() {
    const f = Cardapio.fator(CasosPlano.refeicoes(), CasosMeta.atual().kcal);
    return Math.abs(f - 1) < 0.03 ? 1 : f;
  },

  refeicoes() {
    const horas = CasosRotina.horariosRefeicoes(this.diaDeTreino), fator = this.fator();
    return Cardapio.refeicoesDoDia(CasosPlano.refeicoes(), this.diaDeTreino)
      .map(m => {
        const opcao = Cardapio.opcao(m, this.escolhas);
        return { id: m.id, hora: horas[m.id], nome: m.n, itens: opcao.i, macros: Cardapio.escalar(opcao.m, fator) };
      });
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
    return Cardapio.total(CasosPlano.refeicoes(), this.escolhas, this.diaDeTreino, this.fator());
  }
};
