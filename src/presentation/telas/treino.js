// Tela "Treino": ficha de cada dia com checkbox por exercício
const TelaTreino = {
  montar() {
    $('tab-treino').innerHTML = `
      <div class="stack-s">
        <h2 id="wk-h"></h2>
        <p class="muted" id="wk-intro"></p>
        <p class="small origem" id="wk-origem"></p>
      </div>
      <div class="seg" role="group" aria-label="Treino" id="wk-seg"></div>
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
          <h3>Cardio sem complicar</h3>
          <p>Nos dias de treino o cardio vai no fim da musculação, em ritmo que ainda dá para conversar (esteira inclinada ou bicicleta). Nos dias sem treino, 15 a 20 min de caminhada rápida.</p>
          <p>Para quem fica sentado o dia inteiro, andar mais ao longo do dia pesa mais que o cardio em si. Meta: 7 a 8 mil passos. Ir a pé ou descer um ponto antes do ônibus já ajuda.</p>
        </div>
      </div>
      <p class="small muted">Sem academia perto de casa? O mesmo esquema funciona em casa com um par de halteres ajustáveis e um banco: troque máquinas e polias pela versão com halteres.</p>`;

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

  renderOrigem() {
    const data = CasosPlano.geradoEm('treino');
    $('wk-origem').innerHTML = data
      ? `Versão gerada pelo assistente em ${fmtDate(parseKey(data)).replace(/\.$/, '')}. <button class="link" data-ir="assistente">Gerar outra ou voltar ao padrão</button>`
      : `Plano padrão. <button class="link" data-ir="assistente">Pedir uma variação ao assistente</button>`;
  },

  render() {
    this.renderOrigem();
    const opcoes = CasosTreino.opcoes(), n = CasosPerfil.atual().diasTreino.length;
    if (!opcoes.some(o => o.indice === CasosTreino.indice)) CasosTreino.selecionar(opcoes[0].indice);
    $('wk-h').textContent = n ? `Musculação ${n}× por semana` : 'Musculação: escolha seus dias no Perfil';
    $('wk-intro').textContent = n <= 2
      ? 'Com poucos dias, cada treino é de corpo inteiro para estimular todos os músculos. Cerca de 50 a 55 min de força e 12 a 15 min de cardio no fim.'
      : n === 3
        ? 'Divisão ABC: peito e ombros, pernas, costas. Cerca de 50 a 55 min de força e 12 a 15 min de cardio no fim.'
        : 'ABC + um treino de corpo inteiro curto, para cada músculo ser estimulado 2× por semana. Cerca de 50 a 55 min de força e 12 a 15 min de cardio no fim.';
    $('wk-seg').innerHTML = opcoes.map(o => `<button data-w="${o.indice}" aria-pressed="${o.indice === CasosTreino.indice}">${o.rotulo}</button>`).join('');

    const w = CasosTreino.atual(), dias = CasosTreino.diasDaFicha(CasosTreino.indice);
    $('wk-title').textContent = 'Treino ' + w.k + (dias ? ' (' + dias + ')' : '');
    $('wk-sub').textContent = w.s;
    $('wk-cardio').textContent = w.c;
    $('wk-body').innerHTML = CasosTreino.exercicios().map(({ id, nome, series, descanso, feito }) => `
      <tr class="${feito ? 'done' : ''}">
        <td><input class="chk" type="checkbox" id="ex-${id}" data-id="${id}" ${feito ? 'checked' : ''} aria-label="Concluído"></td>
        <td><label for="ex-${id}">${nome}</label></td>
        <td class="num">${series}</td><td class="num">${descanso}</td></tr>`).join('');
  }
};
