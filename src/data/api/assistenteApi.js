// Fala com o servidor do assistente (server.js local ou o Cloudflare Worker), que repassa para o modelo.
// Sem servidor (ex.: index.html aberto direto), disponivel() devolve false e o resto do site segue normal.
const AssistenteApi = {
  siteKey: null,  // chave pública do Turnstile, quando o servidor exige verificação anti-robô
  sessao: null,   // { token, exp } devolvida pelo servidor depois da verificação
  renovando: null,

  url(caminho) { return (CONFIG.assistenteUrl ? CONFIG.assistenteUrl.replace(/\/$/, '') + '/' : '') + caminho; },

  async disponivel() {
    try {
      const r = await fetch(this.url('api/status'), { cache: 'no-store' });
      const j = r.ok ? await r.json() : {};
      this.siteKey = typeof j.turnstile === 'string' ? j.turnstile : null;
      return j.ativo === true;
    } catch (e) { return false; }
  },

  // Garante uma sessão válida (só quando o servidor usa Turnstile). Renova 1 min antes de expirar.
  // Pedidos simultâneos (conversa + gerar plano) compartilham a mesma renovação.
  async garantirSessao(forcar = false) {
    if (!this.siteKey) return null;
    if (!forcar && this.sessao && this.sessao.exp - Date.now() > 60_000) return this.sessao.token;
    this.renovando ||= (async () => {
      const token = await Verificacao.token(this.siteKey);
      const r = await fetch(this.url('api/sessao'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || 'Não foi possível iniciar o assistente.');
      this.sessao = { token: j.sessao, exp: j.exp };
      return this.sessao.token;
    })().finally(() => { this.renovando = null; });
    return this.renovando;
  },

  // Envia as mensagens e lê a resposta em stream. aoReceber({ texto, pensando }) é chamado a cada pedaço.
  // Se o modelo responder "sobrecarregado", tenta de novo até 2 vezes. Recusas do nosso servidor
  // (limite de uso, por exemplo) não são repetidas: insistir só pioraria.
  async conversar(messages, opcoes = {}) {
    for (let tentativa = 0; ; tentativa++) {
      try {
        return await this.umaVez(messages, opcoes);
      } catch (e) {
        if (!e.temporario || tentativa >= 2 || opcoes.sinal?.aborted) throw e;
        await new Promise(ok => setTimeout(ok, 2000 * (tentativa + 1)));
      }
    }
  },

  async umaVez(messages, { tipo = 'chat', aoReceber = () => {}, sinal } = {}) {
    const enviar = async sessao => fetch(this.url('api/chat'), {
      method: 'POST', signal: sinal,
      headers: { 'Content-Type': 'application/json', ...(sessao ? { 'X-Sessao': sessao } : {}) },
      body: JSON.stringify({ messages, tipo })
    });
    let r;
    try {
      r = await enviar(await this.garantirSessao());
      if (r.status === 401 && this.siteKey) r = await enviar(await this.garantirSessao(true)); // sessão expirou: renova uma vez
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new Error(e.message && !/fetch/i.test(e.message) ? e.message : 'Sem conexão com o servidor do assistente.');
    }
    if (!r.ok) {
      const corpo = await r.json().catch(() => ({}));
      throw new Error(corpo.erro || 'O assistente não respondeu (erro ' + r.status + ').');
    }

    const leitor = r.body.getReader(), dec = new TextDecoder();
    let buffer = '', texto = '';
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const linhas = buffer.split('\n');
      buffer = linhas.pop(); // linha incompleta fica para a próxima volta
      for (const linha of linhas) {
        if (!linha.startsWith('data:')) continue;
        const dado = linha.slice(5).trim();
        if (!dado || dado === '[DONE]') continue;
        let evento;
        try { evento = JSON.parse(dado); } catch (e) { continue; }
        if (evento.error) throw erroDaApi(evento.error);
        const delta = evento.choices?.[0]?.delta || {};
        if (delta.content) texto += delta.content;
        aoReceber({ texto, pensando: !!delta.reasoning_content && !texto });
      }
    }
    return texto.trim();
  }
};

// Erro que a API manda dentro do stream. 429/5xx são temporários (vale tentar de novo).
function erroDaApi(erro) {
  const codigo = +erro.code || 0;
  const temporario = codigo === 429 || codigo >= 500;
  const e = new Error(temporario
    ? 'O modelo está sobrecarregado agora. Tente de novo em alguns segundos.'
    : 'O modelo recusou o pedido: ' + (erro.message || 'erro desconhecido'));
  e.temporario = temporario;
  return e;
}

// Cloudflare Turnstile: verificação anti-robô, quase sempre invisível.
// Só aparece um quadradinho no canto quando a Cloudflare precisa de uma confirmação.
const Verificacao = {
  script: null,
  widget: null,
  pendente: null,

  carregar() {
    this.script ||= new Promise((ok, erro) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => ok(window.turnstile);
      s.onerror = () => { this.script = null; erro(new Error('Não foi possível carregar a verificação anti-robô. Confira sua conexão ou bloqueadores.')); };
      document.head.appendChild(s);
    });
    return this.script;
  },

  async token(siteKey) {
    const ts = await this.carregar();
    return new Promise((ok, erro) => {
      this.pendente = { ok, erro };
      if (this.widget === null) {
        const caixa = document.createElement('div');
        caixa.className = 'verificacao';
        document.body.appendChild(caixa);
        this.widget = ts.render(caixa, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: t => { this.pendente?.ok(t); this.pendente = null; },
          'error-callback': () => { this.pendente?.erro(new Error('A verificação anti-robô falhou. Recarregue a página.')); this.pendente = null; },
          'expired-callback': () => ts.reset(this.widget)
        });
      } else {
        ts.reset(this.widget); // um token por verificação: pede outro
      }
    });
  }
};
