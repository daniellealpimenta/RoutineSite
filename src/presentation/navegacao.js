// Abas: mostra uma tela por vez e lembra a última aberta
const Navegacao = {
  telas: {},

  iniciar(telas) {
    this.telas = telas;
    this.botoes = [...document.querySelectorAll('nav button')];
    this.botoes.forEach(b => b.onclick = () => this.mostrar(b.dataset.tab));

    // aba inicial: #hash na URL ou a última aberta
    const h = location.hash.slice(1), salva = Preferencias.ler('aba');
    this.mostrar(telas[h] ? h : telas[salva] ? salva : 'numeros');
  },

  mostrar(nome) {
    this.botoes.forEach(b => {
      const on = b.dataset.tab === nome;
      b.setAttribute('aria-selected', on);
      $('tab-' + b.dataset.tab).hidden = !on;
    });
    Preferencias.salvar('aba', nome);
    const tela = this.telas[nome];
    if (tela.aoMostrar) tela.aoMostrar();
  }
};
