// Abas: mostra uma tela por vez e lembra a última aberta
const Navegacao = {
  telas: {},

  // inicial = aba usada quando não há #hash nem aba salva (ou sempre, se forcar = true)
  iniciar(telas, inicial = 'numeros', forcar = false) {
    this.telas = telas;
    this.botoes = [...document.querySelectorAll('nav button')];
    this.botoes.forEach(b => b.onclick = () => this.mostrar(b.dataset.tab));

    // qualquer botão com data-ir="aba" leva até ela (ex.: "Editar perfil")
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-ir]');
      if (b) { this.mostrar(b.dataset.ir); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });

    // aba inicial: #hash na URL ou a última aberta
    const h = location.hash.slice(1), salva = Preferencias.ler('aba');
    this.mostrar(telas[h] ? h : !forcar && telas[salva] ? salva : inicial);
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
