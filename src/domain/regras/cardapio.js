// Regras do cardápio: quais refeições valem no dia e quanto somam
// escolhas = { idDaRefeicao: 0 ou 1 } (qual das duas opções foi escolhida)
const Cardapio = {
  refeicoesDoDia(refeicoes, diaDeTreino) {
    return refeicoes.filter(m => diaDeTreino || !m.train);
  },

  opcao(refeicao, escolhas) {
    return refeicao.o[escolhas[refeicao.id] || 0];
  },

  total(refeicoes, escolhas, diaDeTreino) {
    const s = { kcal: 0, p: 0, c: 0, f: 0 };
    this.refeicoesDoDia(refeicoes, diaDeTreino).forEach(m => {
      const [kcal, p, c, f] = this.opcao(m, escolhas).m;
      s.kcal += kcal; s.p += p; s.c += c; s.f += f;
    });
    return s;
  }
};
