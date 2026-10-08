// Tela "Progresso": gráfico de persistência estilo GitHub + números de constância
const TelaProgresso = {
  filtro: Preferencias.ler('filtroProgresso', 'tudo'),
  selecionado: dateKey(today()),
  SEMANAS: 53,

  montar() {
    $('tab-progresso').innerHTML = `
      <div class="stack-s">
        <h2>Persistência</h2>
        <p class="muted">Cada quadrado é um dia. Quanto mais escuro, mais coisas você cumpriu. Toque em um dia para ver ou corrigir o que marcou.</p>
      </div>

      <div class="seg" role="group" aria-label="Filtrar gráfico" id="pg-filtro">
        <button data-f="tudo">Tudo</button>
        ${CATEGORIAS.map(c => `<button data-f="${c.id}">${c.nome}</button>`).join('')}
      </div>

      <div class="stats" id="pg-stats"></div>

      <div class="card stack">
        <div class="heat-wrap" id="pg-wrap"><div class="heat" id="pg-heat"></div></div>
        <div class="heat-foot">
          <span id="pg-resumo"></span>
          <span class="heat-scale" aria-hidden="true">Menos
            <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i>
            <i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i>Mais</span>
        </div>
      </div>

      <div id="pg-dia"></div>

      <div class="card stack">
        <h3>Últimos 30 dias por área</h3>
        <div class="cat-bars" id="pg-cats"></div>
      </div>`;

    $('pg-filtro').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      this.filtro = b.dataset.f;
      Preferencias.salvar('filtroProgresso', this.filtro);
      this.render();
    };
    $('pg-heat').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      this.selecionado = b.dataset.k;
      this.render();
    });
  },

  // Chamado quando a aba fica visível: rola o gráfico para mostrar as semanas mais recentes
  aoMostrar() {
    const w = $('pg-wrap');
    w.scrollLeft = w.scrollWidth;
  },

  nivel(key) {
    const n = CasosCheckin.pontos(key, this.filtro);
    return this.filtro === 'tudo' ? n : n * 3; // filtro de uma área: 0 ou cor cheia
  },

  descricao(key) {
    const d = CasosCheckin.dia(key);
    return fmtDate(parseKey(key)) + ' · ' + CATEGORIAS.map(c => c.nome + (d[c.id] ? ' ✓' : ' ✗')).join(', ');
  },

  renderHeat() {
    const hoje = today();
    // começa numa segunda-feira, 52 semanas atrás
    const seg = addDays(hoje, -((hoje.getDay() + 6) % 7));
    const inicio = addDays(seg, -7 * (this.SEMANAS - 1));
    const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    let meses = '', cells = '', mesAnterior = -1;
    for (let s = 0; s < this.SEMANAS; s++) {
      const m = addDays(inicio, s * 7).getMonth();
      meses += `<span>${m !== mesAnterior ? MESES[m] : ''}</span>`;
      mesAnterior = m;
      for (let d = 0; d < 7; d++) {
        const dia = addDays(inicio, s * 7 + d);
        if (dia > hoje) { cells += '<span class="vazio"></span>'; continue; }
        const k = dateKey(dia);
        const desc = this.descricao(k);
        cells += `<button data-k="${k}" data-l="${this.nivel(k)}" class="${k === this.selecionado ? 'sel' : ''}" title="${desc}" aria-label="${desc}"></button>`;
      }
    }
    // grade 2×2: [vazio | meses] / [dias da semana | quadrados]
    $('pg-heat').innerHTML = `
      <span></span>
      <div class="months" aria-hidden="true">${meses}</div>
      <div class="days" aria-hidden="true"><span>seg</span><span></span><span>qua</span><span></span><span>sex</span><span></span><span>dom</span></div>
      <div class="grid">${cells}</div>`;
  },

  renderStats() {
    const f = this.filtro;
    const nome = f === 'tudo' ? 'dias perfeitos (3 de 3)' : CATEGORIAS.find(c => c.id === f).nome.toLowerCase();
    const r = CasosCheckin.resumo(f);
    $('pg-stats').innerHTML = `
      <div class="card"><b>${r.sequenciaAtual}</b><span>dia${r.sequenciaAtual === 1 ? '' : 's'} seguidos agora</span></div>
      <div class="card"><b>${r.melhorSequencia}</b><span>melhor sequência</span></div>
      <div class="card"><b>${Math.round(r.ultimos30 / 30 * 100)}%</b><span>dos últimos 30 dias</span></div>
      <div class="card"><b>${r.diasRegistrados}</b><span>dias registrados</span></div>`;
    $('pg-resumo').textContent = `Sequências contando ${nome}.`;

    $('pg-cats').innerHTML = r.porCategoria.map(c => {
      const n = c.ultimos30;
      return `<div class="stack-s">
        <div class="line"><span>${c.nome}</span><b class="num">${n} de 30</b></div>
        <div class="track"><i style="width:${n / 30 * 100}%"></i></div>
      </div>`;
    }).join('');
  },

  render() {
    [...$('pg-filtro').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.f === this.filtro));
    this.renderHeat();
    this.renderStats();
    const k = this.selecionado;
    const titulo = k === dateKey(today()) ? 'Hoje, ' + fmtDate(today()) : fmtDate(parseKey(k));
    CheckinComponente.render($('pg-dia'), k, titulo);
  }
};
