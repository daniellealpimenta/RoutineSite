// Tela "Treino": ficha de cada dia com checkbox por exercício
const TelaTreino = {
  montar() {
    $('tab-treino').innerHTML = `
      <div class="stack-s">
        <h2>Musculação: ABC + corpo inteiro, 4× por semana</h2>
        <p class="muted">O ABC ocupa as três manhãs da semana e o sábado repete tudo de forma curta, para cada músculo ser estimulado 2× por semana. Cerca de 50 a 55 min de força e 12 a 15 min de cardio no fim.</p>
      </div>
      <div class="seg" role="group" aria-label="Treino" id="wk-seg">
        ${CasosTreino.treinos().map((w, i) => `<button data-w="${i}">${w.d} · ${w.k}</button>`).join('')}
      </div>
      <div class="card stack">
        <div>
          <h3 id="wk-title"></h3>
          <p class="small muted" id="wk-sub"></p>
        </div>
        <div class="scroll"><table>
          <thead><tr><th></th><th>Exercício</th><th>Séries × reps</th><th>Descanso</th></tr></thead>
          <tbody id="wk-body"></tbody>
        </table></div>
        <p class="small muted" id="wk-cardio"></p>
        <div><button class="swap" id="wk-reset">Limpar marcações deste treino</button></div>
      </div>

      <div class="grid2">
        <div class="card stack-s">
          <h3>Como progredir</h3>
          <ul>
            <li>Semanas 1 e 2: volte com uns 60 a 70% das cargas que você usava. A força retorna rápido, tendão e articulação demoram mais.</li>
            <li>Termine cada série sentindo que faria mais 1 a 3 repetições.</li>
            <li>Bateu o topo da faixa em todas as séries? Suba a carga no treino seguinte e volte ao início da faixa.</li>
            <li>Anote as cargas. Sem registro não há progressão.</li>
            <li>Faça 1 ou 2 séries leves de aquecimento só no primeiro exercício.</li>
          </ul>
        </div>
        <div class="card stack-s">
          <h3>Sobre o cardio de 15 min todo dia</h3>
          <p>Sua ideia funciona, com um ajuste: nos 4 dias de treino o cardio vai no fim da musculação, em ritmo que ainda dá para conversar (esteira inclinada ou bicicleta). Na terça e na quinta, 15 a 20 min de caminhada rápida no campus entre o trabalho e a aula.</p>
          <p>Para quem fica sentado o dia inteiro, andar mais ao longo do dia pesa mais que o cardio em si. Meta: 7 a 8 mil passos. O trajeto do ônibus já ajuda.</p>
        </div>
      </div>
      <p class="small muted">Sem academia perto de casa? O mesmo esquema funciona em casa com um par de halteres ajustáveis e um banco. Me peça a versão adaptada.</p>`;

    $('wk-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      CasosTreino.selecionar(+b.dataset.w);
      this.render();
    };
    $('wk-body').addEventListener('change', e => {
      const id = e.target.dataset.id;
      if (!id) return;
      CasosTreino.marcar(id, e.target.checked);
      e.target.closest('tr').classList.toggle('done', e.target.checked);
    });
    $('wk-reset').onclick = () => {
      CasosTreino.limparAtual();
      this.render();
    };
  },

  render() {
    const w = CasosTreino.atual();
    [...$('wk-seg').children].forEach((b, i) => b.setAttribute('aria-pressed', i === CasosTreino.indice));
    $('wk-title').textContent = 'Treino ' + w.k + ' (' + w.d + ')';
    $('wk-sub').textContent = w.s;
    $('wk-cardio').textContent = w.c;
    $('wk-body').innerHTML = CasosTreino.exercicios().map(({ id, nome, series, descanso, feito }) => `
      <tr class="${feito ? 'done' : ''}">
        <td><input class="chk" type="checkbox" id="ex-${id}" data-id="${id}" ${feito ? 'checked' : ''} aria-label="Concluído"></td>
        <td><label for="ex-${id}">${nome}</label></td>
        <td class="num">${series}</td><td class="num">${descanso}</td></tr>`).join('');
  }
};
