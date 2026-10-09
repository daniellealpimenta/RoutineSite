// Componente de conversa com o assistente. Pode ser montado em mais de um lugar
// (aba Assistente e balão flutuante): todos mostram o mesmo histórico e o mesmo estado.
const SUGESTOES = [
  'O que comer antes de treinar de manhã cedo?',
  'Me dá 3 opções de lanche para levar na mochila',
  'Como trocar o almoço por uma opção sem carne?',
  'Estou sem tempo hoje: qual treino curto faço?'
];

const Conversa = {
  raizes: [],
  ocupado: false,
  pendente: null, // HTML da bolha que está sendo escrita (ou de erro)

  montar(raiz) {
    raiz.innerHTML = `
      <div class="c-offline note small" hidden>
        O assistente está desligado. Rode <code>node server.js</code> ou configure o Worker (veja o README).
      </div>
      <div class="chat-msgs c-msgs" aria-live="polite"></div>
      <div class="seg c-sugestoes">${SUGESTOES.map(s => `<button type="button">${esc(s)}</button>`).join('')}</div>
      <form class="chat-form c-form">
        <textarea class="c-texto" rows="2" maxlength="2000" placeholder="Pergunte sobre sua dieta, treino ou rotina…" aria-label="Mensagem"></textarea>
        <button class="swap primario c-enviar">Enviar</button>
      </form>`;
    const texto = raiz.querySelector('.c-texto');
    raiz.querySelector('.c-form').onsubmit = e => { e.preventDefault(); this.enviar(texto); };
    texto.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.enviar(texto); }
    });
    raiz.querySelector('.c-sugestoes').onclick = e => {
      const b = e.target.closest('button');
      if (b) { texto.value = b.textContent; this.enviar(texto); }
    };
    // botões das sugestões de mudança (Aplicar / Ignorar / Aplicar todas)
    raiz.querySelector('.c-msgs').onclick = e => {
      const b = e.target.closest('button[data-acao-fazer]');
      if (!b) return;
      const msg = +b.dataset.msg, acao = +b.dataset.acao;
      if (b.dataset.acaoFazer === 'aplicar') CasosAssistente.aplicar(msg, acao);
      else if (b.dataset.acaoFazer === 'ignorar') CasosAssistente.ignorar(msg, acao);
      else CasosAssistente.aplicarTodas(msg);
    };
    this.raizes.push(raiz);
  },

  bolha(role, conteudo, acoes, iMsg) {
    if (role === 'user') return `<div class="msg eu">${esc(conteudo)}</div>`;
    return `<div class="msg ia">${markdownSimples(conteudo)}${acoes?.length ? this.cartoes(acoes, iMsg) : ''}</div>`;
  },

  // Sugestões de mudança no plano: cada uma com Aplicar/Ignorar, ou o resultado
  cartoes(acoes, iMsg) {
    const ESTADOS = { aplicada: '✓ Aplicada', ignorada: 'Ignorada', aplicando: 'Aplicando…' };
    const pendentes = acoes.filter(a => a.estado === 'pendente').length;
    return `<div class="sugestoes-ia">
      ${acoes.map((a, i) => `
        <div class="sugestao ${a.estado}">
          <span class="sugestao-txt">${esc(a.descricao)}</span>
          ${a.estado === 'pendente' ? `
            <span class="sugestao-botoes">
              <button class="swap primario" data-acao-fazer="aplicar" data-msg="${iMsg}" data-acao="${i}">Aplicar</button>
              <button class="swap" data-acao-fazer="ignorar" data-msg="${iMsg}" data-acao="${i}">Ignorar</button>
            </span>`
          : `<span class="sugestao-estado">${a.estado === 'erro' ? 'Não deu: ' + esc(a.erro || 'erro') : ESTADOS[a.estado]}</span>`}
        </div>`).join('')}
      ${pendentes > 1 ? `<button class="link" data-acao-fazer="todas" data-msg="${iMsg}">Aplicar todas (${pendentes})</button>` : ''}
    </div>`;
  },

  render() {
    const ativo = CasosAssistente.ativo, msgs = CasosAssistente.mensagens;
    const html = msgs.map((m, i) => this.bolha(m.role, m.content, m.acoes, i));
    if (this.pendente) {
      // a Cloudflare pediu confirmação: avisa onde clicar em vez de só "Escrevendo…"
      html.push(Verificacao.interativo && this.ocupado
        ? '<div class="msg ia aviso-verificacao"><p>Antes de responder, confirme que você não é um robô: é só marcar o quadradinho <b>"Verify you are human"</b> no canto inferior esquerdo da tela.</p></div>'
        : this.pendente);
    }
    const conteudo = html.length ? html.join('')
      : '<p class="small muted vazio">Nenhuma mensagem ainda. Escolha uma sugestão ou escreva sua pergunta.</p>';
    this.raizes.forEach(r => {
      r.querySelector('.c-offline').hidden = ativo;
      const lista = r.querySelector('.c-msgs');
      // só desce até o fim se chegou mensagem nova ou se já estava lá embaixo
      const noFim = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
      const topo = lista.scrollTop;
      lista.innerHTML = conteudo;
      lista.scrollTop = noFim || html.length !== this.totalAnterior ? lista.scrollHeight : topo;
      r.querySelector('.c-sugestoes').hidden = msgs.length > 0 || !ativo;
      r.querySelectorAll('.c-enviar, .c-sugestoes button').forEach(b => { b.disabled = this.ocupado || !ativo; });
      r.querySelector('.c-texto').disabled = !ativo;
    });
    this.totalAnterior = html.length;
  },

  limpar() {
    CasosAssistente.limpar();
    this.pendente = null;
    this.render();
  },

  async enviar(campo) {
    const texto = campo.value.trim();
    if (!texto || this.ocupado || !CasosAssistente.ativo) return;
    campo.value = '';
    this.ocupado = true;
    // a pergunta entra no histórico na hora (CasosAssistente.enviar); aqui só a resposta em andamento
    const mostrar = ({ texto: t, pensando } = {}) => {
      this.pendente = t ? this.bolha('assistant', t) : `<div class="msg ia digitando">${pensando ? 'Pensando…' : 'Escrevendo…'}</div>`;
      this.render();
    };
    this.pendente = '<div class="msg ia digitando">Escrevendo…</div>';
    try {
      const resposta = CasosAssistente.enviar(texto, mostrar); // já põe a pergunta no histórico
      this.render();
      await resposta;
      this.pendente = null;
    } catch (e) {
      // em caso de erro a pergunta sai do histórico: mostra ela com o aviso e devolve o texto ao campo
      this.pendente = this.bolha('user', texto) + `<div class="msg ia erro">${esc(e.message)}</div>`;
      campo.value = texto;
    } finally {
      this.ocupado = false;
      this.render();
    }
  }
};

// Botão redondo no canto inferior direito que abre a conversa em qualquer aba
const ChatFlutuante = {
  montar() {
    const el = document.createElement('div');
    el.className = 'chat-flutuante';
    el.innerHTML = `
      <section class="chat-painel" id="cf-painel" role="dialog" aria-label="Conversa com o assistente" hidden>
        <header class="chat-topo">
          <h3>Assistente</h3>
          <div class="acoes">
            <button class="swap" id="cf-limpar">Limpar</button>
            <button class="fechar" id="cf-fechar" aria-label="Fechar conversa">×</button>
          </div>
        </header>
        <div class="chat-corpo" id="cf-conversa"></div>
      </section>
      <button class="chat-fab" id="cf-botao" aria-label="Abrir conversa com o assistente" aria-expanded="false" aria-controls="cf-painel">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.9 2 11.7c0 2.4 1.1 4.6 3 6.2L4.2 21.4c-.1.4.3.7.7.5l4-2c1 .3 2 .4 3.1.4 5.5 0 10-3.9 10-8.6S17.5 3 12 3Zm-4 9.9a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z"/></svg>
      </button>`;
    document.body.appendChild(el);
    Conversa.montar($('cf-conversa'));

    $('cf-botao').onclick = () => this.alternar();
    $('cf-fechar').onclick = () => this.alternar(false);
    $('cf-limpar').onclick = () => Conversa.limpar();
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('cf-painel').hidden) this.alternar(false); });
  },

  alternar(abrir = $('cf-painel').hidden) {
    $('cf-painel').hidden = !abrir;
    $('cf-botao').setAttribute('aria-expanded', abrir);
    document.body.classList.toggle('chat-aberto', abrir);
    if (abrir) {
      Conversa.render();
      const campo = $('cf-painel').querySelector('.c-texto');
      if (!campo.disabled) campo.focus();
    } else {
      $('cf-botao').focus();
    }
  }
};
