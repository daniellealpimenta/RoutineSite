// Regras do cardápio: quais refeições valem no dia, quanto somam e como escalar para a meta
// escolhas = { idDaRefeicao: 0 ou 1 } (qual das duas opções foi escolhida)
const Cardapio = {
  refeicoesDoDia(refeicoes, diaDeTreino) {
    return refeicoes.filter(m => diaDeTreino || !m.train);
  },

  opcao(refeicao, escolhas) {
    return refeicao.o[escolhas[refeicao.id] || 0];
  },

  // Quanto as porções precisam crescer (>1) ou diminuir (<1) para o cardápio base bater a meta.
  // A referência é o dia de treino com as primeiras opções.
  fator(refeicoes, metaKcal) {
    const base = this.total(refeicoes, {}, true).kcal;
    return base ? metaKcal / base : 1;
  },

  // m = [kcal, p, c, f] multiplicado pelo fator
  escalar(m, fator = 1) {
    return m.map(v => Math.round(v * fator));
  },

  total(refeicoes, escolhas, diaDeTreino, fator = 1) {
    const s = { kcal: 0, p: 0, c: 0, f: 0 };
    this.refeicoesDoDia(refeicoes, diaDeTreino).forEach(m => {
      const [kcal, p, c, f] = this.escalar(this.opcao(m, escolhas).m, fator);
      s.kcal += kcal; s.p += p; s.c += c; s.f += f;
    });
    return s;
  }
};
