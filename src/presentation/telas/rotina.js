// Tela "Rotina": semana resumida, linha do tempo por tipo de dia e dicas de sono
const TelaRotina = {
  tipo: 'treino',

  montar() {
    $('tab-rotina').innerHTML = `
      <div class="stack-s">
        <h2>A semana</h2>
        <p class="muted">A única janela livre nos dias úteis é antes das 8h. Por isso são só 3 manhãs de treino, nunca seguidas, e o quarto treino fica no sábado sem pressa.</p>
      </div>
      <div class="week">
        <div class="on"><b>Seg</b>A: peito, ombro, tríceps</div>
        <div><b>Ter</b>Caminhada 15–20 min</div>
        <div class="on"><b>Qua</b>B: pernas</div>
        <div><b>Qui</b>Caminhada 15–20 min</div>
        <div class="on"><b>Sex</b>C: costas, bíceps</div>
        <div class="on"><b>Sáb</b>D: corpo inteiro</div>
        <div><b>Dom</b>Descanso e marmitas</div>
      </div>

      <div class="seg" role="group" aria-label="Tipo de dia" id="rt-seg">
        <button data-rt="treino">Seg, qua, sex</button>
        <button data-rt="leve">Ter, qui</button>
        <button data-rt="fds">Sáb, dom</button>
      </div>
      <div class="card"><div class="tl" id="rt-body"></div></div>
      <p class="small muted" id="rt-sleep"></p>

      <div class="card stack-s">
        <h3>Sono: o que fazer entre 22h e 22h45</h3>
        <ul>
          <li>Ceia e banho assim que chegar. Roupa de treino e mochila prontas para a manhã.</li>
          <li>Tela fora da cama. Se for usar o celular, brilho baixo e nada de trabalho ou código.</li>
          <li>Horário de dormir fixo, inclusive ter e qui, quando dá para acordar às 7h.</li>
          <li>Se uma noite for ruim (menos de 6h), troque o treino da manhã por dormir mais e faça no dia seguinte. Treinar sem dormir não compensa.</li>
        </ul>
      </div>`;

    $('rt-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      this.tipo = b.dataset.rt;
      this.render();
    };
  },

  render() {
    const k = this.tipo;
    [...$('rt-seg').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.rt === k));
    $('rt-body').innerHTML = RT[k].r.map(r => `<div class="${r[2] ? 'k' : ''}"><time>${r[0]}</time><span>${r[1]}</span></div>`).join('');
    $('rt-sleep').textContent = RT[k].sleep;
  }
};
