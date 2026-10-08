// Casos de uso do treino: escolher a ficha do dia e marcar exercícios feitos
const CasosTreino = {
  indice: Preferencias.ler('treinoAtual', 0),
  feitos: Preferencias.ler('exerciciosFeitos', {}),

  treinos() { return WK; },

  atual() { return WK[this.indice]; },

  selecionar(i) {
    this.indice = i;
    Preferencias.salvar('treinoAtual', i);
  },

  exercicios() {
    return this.atual().x.map(([nome, series, descanso], i) => {
      const id = this.indice + '-' + i;
      return { id, nome, series, descanso, feito: !!this.feitos[id] };
    });
  },

  marcar(id, feito) {
    this.feitos[id] = feito;
    Preferencias.salvar('exerciciosFeitos', this.feitos);
  },

  limparAtual() {
    this.atual().x.forEach((_, i) => delete this.feitos[this.indice + '-' + i]);
    Preferencias.salvar('exerciciosFeitos', this.feitos);
  }
};
