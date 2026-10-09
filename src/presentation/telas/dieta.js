// Tela "Dieta": cardápio com troca de opções e total do dia
const TelaDieta = {
  montar() {
    $('tab-dieta').innerHTML = `
      <div class="stack-s">
        <h2>Cardápio do dia</h2>
        <p class="muted">Comida comum, barata e que cabe em marmita. Cada refeição tem duas opções: toque em “trocar” e o total do dia se atualiza.</p>
        <p class="small origem" id="d-origem"></p>
      </div>
      <div class="seg" role="group" aria-label="Tipo de dia">
        <button id="d-treino" aria-pressed="true">Dia de treino</button>
        <button id="d-desc" aria-pressed="false">Dia sem treino</button>
      </div>
      <div class="note small" id="d-porcoes" hidden></div>
      <div class="card" id="meals"></div>
      <div class="total">
        <div class="line"><b>Total do dia</b><b id="t-kcal"></b></div>
        <div class="bar" id="t-bar" aria-hidden="true"></div>
        <div class="line small muted"><span id="t-mac"></span><span id="t-meta"></span></div>
      </div>

      <div class="grid2">
        <div class="card stack-s">
          <h3>Domingo: 1h30 que salva a semana</h3>
          <ul>
            <li>Cozinhe 1 kg de arroz e 500 g de feijão (rende a semana).</li>
            <li>Grelhe ou asse 1,5 kg de frango e 500 g de patinho moído.</li>
            <li>Asse uma forma de legumes: cenoura, abobrinha, brócolis.</li>
            <li>Monte 10 marmitas (almoço e jantar de seg a sex). Congele as de quinta e sexta.</li>
            <li>Cozinhe 10 ovos para ceia e emergências.</li>
          </ul>
        </div>
        <div class="card stack-s">
          <h3>Quando só tiver lanchonete</h3>
          <ul>
            <li>Sanduíche natural de frango ou atum no lugar do salgado frito.</li>
            <li>Salgado assado ganha do frito. Um, não dois.</li>
            <li>Iogurte, fruta, amendoim e ovo cozido cabem na mochila.</li>
            <li>Refrigerante e suco de caixinha são o corte mais fácil: troque por água ou zero.</li>
            <li>Um lanche fora do plano não estraga nada. Volte na refeição seguinte.</li>
          </ul>
        </div>
      </div>
      <div class="card stack-s">
        <h3>Suplementos: o que vale o dinheiro</h3>
        <ul>
          <li><b>Creatina, 3 a 5 g por dia</b>, qualquer horário, todo dia. É o único com efeito bem comprovado para força e massa.</li>
          <li><b>Whey</b> é praticidade, não obrigação. Um scoop (~24 g de proteína) substitui o lanche da tarde nos dias corridos.</li>
          <li><b>Café</b> antes do treino ajuda. Evite depois das 15h para não piorar o sono.</li>
          <li>Termogênico, BCAA e pré-treino caro: pode pular.</li>
        </ul>
      </div>`;

    $('meals').addEventListener('click', e => {
      const b = e.target.closest('.swap');
      if (!b) return;
      CasosCardapio.trocar(b.dataset.m);
      this.render();
    });
    $('d-treino').onclick = () => { CasosCardapio.definirDiaDeTreino(true); this.render(); };
    $('d-desc').onclick = () => { CasosCardapio.definirDiaDeTreino(false); this.render(); };
  },

  renderOrigem() {
    const data = CasosPlano.geradoEm('dieta');
    $('d-origem').innerHTML = data
      ? `Versão gerada pelo assistente em ${fmtDate(parseKey(data)).replace(/\.$/, '')}. <button class="link" data-ir="assistente">Gerar outra ou voltar ao padrão</button>`
      : `Plano padrão. <button class="link" data-ir="assistente">Pedir uma variação ao assistente</button>`;
  },

  render() {
    this.renderOrigem();
    const treino = CasosCardapio.diaDeTreino;
    $('d-treino').setAttribute('aria-pressed', treino);
    $('d-desc').setAttribute('aria-pressed', !treino);
    const fator = CasosCardapio.fator(), pct = Math.round((fator - 1) * 20) * 5; // arredonda para 5%
    $('d-porcoes').hidden = Math.abs(pct) < 5;
    $('d-porcoes').innerHTML = `<b>Sua meta é ${Math.abs(pct)}% ${pct > 0 ? 'maior' : 'menor'} que o cardápio base.</b> ` +
      `${pct > 0 ? 'Aumente' : 'Diminua'} as porções (arroz, pão, carnes, frutas) em cerca de ${Math.abs(pct)}%. Os números abaixo já estão ajustados.`;
    $('meals').innerHTML = CasosCardapio.refeicoes().map(({ id, hora, nome, itens, macros }) => `
      <div class="meal"><time>${hora}</time><div>
        <div class="head"><h3>${nome}</h3><button class="swap" data-m="${id}">Trocar opção</button></div>
        <ul>${itens.map(x => `<li>${x}</li>`).join('')}</ul>
        <div class="mac">${macros[0]} kcal · ${macros[1]} g proteína · ${macros[2]} g carbo · ${macros[3]} g gordura</div>
      </div></div>`).join('');
    this.renderTotal();
  },

  renderTotal() {
    const s = CasosCardapio.total(), meta = CasosMeta.atual();
    $('t-kcal').textContent = fmt(s.kcal) + ' kcal';
    barraMacros($('t-bar'), s.p, s.c, s.f);
    $('t-mac').textContent = `${s.p} g proteína · ${s.c} g carbo · ${s.f} g gordura`;
    const d = s.kcal - meta.kcal;
    $('t-meta').textContent = `Meta ${fmt(meta.kcal)} kcal (${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))})`;
  }
};
