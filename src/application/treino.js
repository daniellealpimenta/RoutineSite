// Casos de uso do treino: escolher a ficha do dia e marcar exercícios feitos
const CasosTreino = {
  indice: Preferencias.ler('treinoAtual', 0),
  feitos: Preferencias.ler('exerciciosFeitos', {}),

  treinos() { return CasosPlano.fichas(); },

  // Botões da tela: um por dia de treino do perfil ("Seg · A"). Sem dias escolhidos, as 4 fichas.
  opcoes() {
    const fichas = CasosRotina.fichas();
    const dias = DIAS_SEMANA.filter(d => fichas[d.id] != null);
    if (!dias.length) return CasosPlano.fichas().map((w, i) => ({ indice: i, rotulo: 'Ficha ' + w.k }));
    return dias.map(d => ({ indice: fichas[d.id], rotulo: d.curto + ' · ' + CasosPlano.fichas()[fichas[d.id]].k }));
  },

  // Nomes dos dias em que a ficha cai ("Segunda e quinta")
  diasDaFicha(i) {
    const fichas = CasosRotina.fichas();
    const nomes = DIAS_SEMANA.filter(d => fichas[d.id] === i).map(d => d.nome.toLowerCase());
    if (!nomes.length) return '';
    const txt = nomes.length > 1 ? nomes.slice(0, -1).join(', ') + ' e ' + nomes.at(-1) : nomes[0];
    return txt[0].toUpperCase() + txt.slice(1);
  },

  atual() { return CasosPlano.fichas()[this.indice] || CasosPlano.fichas()[0]; },

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
