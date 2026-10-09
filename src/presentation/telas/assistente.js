// Tela "Assistente": gerar variações de dieta e treino e conversar com o modelo sobre o plano
const TelaAssistente = {
  ocupado: false, // gerando dieta ou treino

  montar() {
    $('tab-assistente').innerHTML = `
      <div class="stack-s">
        <h2>Assistente</h2>
        <p class="muted">Um modelo de linguagem que conhece seu perfil, suas metas e seu plano atual. Peça uma dieta ou um treino novo, ou tire dúvidas. Respostas curtas e diretas.</p>
      </div>

      <div class="note stack-s" id="as-offline" hidden>
        <h3>Assistente desligado</h3>
        <p>O assistente precisa de um servidor que guarde a chave da API. No computador: crie o arquivo <code>.env</code> com <code>NVIDIA_API_KEY=sua-chave</code>, rode <code>node server.js</code> e abra <code>http://localhost:8000</code>. No GitHub Pages: publique o Worker do Cloudflare (passo a passo no README).</p>
        <p class="small">O resto do site funciona normalmente sem ele.</p>
      </div>

      <div class="grid2" id="as-geradores">
        ${['dieta', 'treino'].map(tipo => `
        <div class="card stack-s gerador">
          <h3>${tipo === 'dieta' ? 'Variar a dieta' : 'Variar o treino'}</h3>
          <p class="small muted">${tipo === 'dieta'
            ? 'Gera um cardápio novo com 2 opções por refeição, na sua meta de calorias e proteína.'
            : 'Gera 4 fichas novas (A, B, C, D) respeitando seus dias, equipamento e limitações.'}</p>
          <input type="text" id="as-extra-${tipo}" maxlength="200" placeholder="${tipo === 'dieta' ? 'Opcional: sem lactose, mais barato, vegetariano…' : 'Opcional: treino em casa, dor no joelho, mais glúteo…'}">
          <div class="acoes">
            <button class="swap primario" data-gerar="${tipo}">Gerar ${tipo === 'dieta' ? 'nova dieta' : 'novo treino'}</button>
            <button class="swap" data-restaurar="${tipo}" hidden>Voltar ao padrão</button>
          </div>
          <p class="small muted" id="as-status-${tipo}" aria-live="polite"></p>
        </div>`).join('')}
      </div>

      <div class="card stack chat">
        <div class="chat-topo">
          <h3>Conversa</h3>
          <button class="swap" id="as-limpar">Limpar conversa</button>
        </div>
        <div class="chat-corpo" id="as-conversa"></div>
        <p class="small muted">O assistente pode errar e não substitui nutricionista, nutrólogo ou educador físico. Com condição de saúde, procure um profissional.</p>
      </div>`;

    Conversa.montar($('as-conversa'));
    $('as-limpar').onclick = () => Conversa.limpar();
    $('as-geradores').onclick = e => {
      const g = e.target.closest('[data-gerar]'), r = e.target.closest('[data-restaurar]');
      if (g) this.gerar(g.dataset.gerar);
      if (r) CasosPlano.restaurar(r.dataset.restaurar);
    };

    CasosAssistente.verificar().then(() => { this.render(); Conversa.render(); });
  },

  render() {
    const ativo = CasosAssistente.ativo;
    $('as-offline').hidden = ativo;
    ['dieta', 'treino'].forEach(tipo => {
      const data = CasosPlano.geradoEm(tipo);
      document.querySelector(`[data-restaurar="${tipo}"]`).hidden = !data;
      if (!this.ocupado) $('as-status-' + tipo).textContent = data ? `Em uso: versão gerada em ${fmtDate(parseKey(data)).replace(/\.$/, '')}.` : 'Em uso: plano padrão.';
    });
    this.travar(this.ocupado);
    Conversa.render();
  },

  travar(sim) {
    const ativo = CasosAssistente.ativo;
    document.querySelectorAll('#tab-assistente [data-gerar]').forEach(b => { b.disabled = sim || !ativo; });
  },

  async gerar(tipo) {
    if (this.ocupado || !CasosAssistente.ativo) return;
    this.ocupado = true; this.travar(true);
    const status = $('as-status-' + tipo), inicio = Date.now();
    const relogio = setInterval(() => {
      status.textContent = `Gerando… ${Math.round((Date.now() - inicio) / 1000)} s (o modelo pensa antes de responder, costuma levar de 30 s a 1 min).`;
    }, 1000);
    try {
      await CasosAssistente.gerar(tipo, $('as-extra-' + tipo).value.trim(), () => {});
      clearInterval(relogio);
      status.innerHTML = `Pronto! <button class="link" data-ir="${tipo}">Ver na aba ${tipo === 'dieta' ? 'Dieta' : 'Treino'}</button>`;
      $('as-extra-' + tipo).value = '';
    } catch (e) {
      clearInterval(relogio);
      status.textContent = e.message;
    } finally {
      this.ocupado = false;
      this.travar(false);
      Conversa.render();
      document.querySelector(`[data-restaurar="${tipo}"]`).hidden = !CasosPlano.geradoEm(tipo);
    }
  }
};
