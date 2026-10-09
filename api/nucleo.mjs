// Núcleo do proxy do assistente, usado pelo server.js (local) e pelo worker.mjs (Cloudflare).
// Só aceita pedidos no formato do app, fixa modelo e limites e controla cotas de uso,
// para a chave não virar acesso livre (e ilimitado) à API.
export const MODELO_PADRAO = 'nvidia/nemotron-3-ultra-550b-a55b';
export const API_PADRAO = 'https://integrate.api.nvidia.com/v1';

// Conversa ou geração de plano (JSON grande). O modo "pensar" fica desligado:
// com ele, gerar um cardápio passava de 5 minutos.
const TIPOS = {
  chat:  { max_tokens: 2048, temperature: 0.6, top_p: 0.95, pensar: false, peso: 1 },
  plano: { max_tokens: 8192, temperature: 0.9, top_p: 0.95, pensar: false, peso: 4 }
};

export const LIMITE_CORPO = 120_000;   // bytes por pedido
const LIMITE_MENSAGENS = 30;
const LIMITE_TEXTO_TOTAL = 60_000;      // caracteres somando todas as mensagens
export const TEMPO_MAXIMO = 120_000;    // ms até desistir da resposta do modelo

// ── Validação ────────────────────────────────────────────────────────────────

// Formato aceito: no máximo uma mensagem "system" (a primeira), alternando user/assistant, terminando em user.
export function validarPedido(corpo) {
  const msgs = corpo && corpo.messages;
  if (!Array.isArray(msgs) || !msgs.length || msgs.length > LIMITE_MENSAGENS) return null;
  let total = 0;
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!m || typeof m.content !== 'string' || !m.content.trim()) return null;
    if (m.role === 'system' ? i !== 0 : !['user', 'assistant'].includes(m.role)) return null;
    total += m.content.length;
  }
  if (total > LIMITE_TEXTO_TOTAL || msgs[msgs.length - 1].role !== 'user') return null;
  const tipo = TIPOS[corpo.tipo] ? corpo.tipo : 'chat';
  return { messages: msgs.map(({ role, content }) => ({ role, content })), tipo, peso: TIPOS[tipo].peso };
}

// ── Chamada ao modelo ────────────────────────────────────────────────────────

// Chama a API em modo stream e devolve a Response original (o corpo é repassado como chega).
// Desiste sozinha depois de TEMPO_MAXIMO, para nenhuma conexão ficar presa.
export function chamarModelo({ chave, modelo = MODELO_PADRAO, base = API_PADRAO, pedido, sinal }) {
  const t = TIPOS[pedido.tipo];
  const limite = AbortSignal.timeout(TEMPO_MAXIMO);
  return fetch(base + '/chat/completions', {
    method: 'POST',
    signal: sinal ? AbortSignal.any([sinal, limite]) : limite,
    headers: { 'Authorization': 'Bearer ' + chave, 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({
      model: modelo, messages: pedido.messages, stream: true,
      max_tokens: t.max_tokens, temperature: t.temperature, top_p: t.top_p,
      chat_template_kwargs: { enable_thinking: t.pensar }
    })
  });
}

// ── Cotas de uso ─────────────────────────────────────────────────────────────
// Pedidos de chat valem 1 ponto, gerar dieta/treino vale 4 (respostas bem maiores).

export const LIMITES_PADRAO = {
  porMinuto: 6,      // pedidos por minuto, por pessoa (IP e sessão)
  porDia: 60,        // pontos por dia, por pessoa
  globalDia: 600,    // pontos por dia somando todo mundo: o teto do quanto a chave pode gastar
  simultaneos: 2,    // respostas em andamento ao mesmo tempo, por pessoa
  sessoesDia: 20     // verificações anti-robô aceitas por IP por dia
};

// Lê limites de variáveis de ambiente (LIMITE_POR_MINUTO etc.), caindo no padrão
export function limitesDe(env = {}) {
  const n = (v, padrao) => (Number.isFinite(+v) && +v > 0 ? +v : padrao);
  return {
    porMinuto: n(env.LIMITE_POR_MINUTO, LIMITES_PADRAO.porMinuto),
    porDia: n(env.LIMITE_POR_DIA, LIMITES_PADRAO.porDia),
    globalDia: n(env.LIMITE_GLOBAL_DIA, LIMITES_PADRAO.globalDia),
    simultaneos: n(env.LIMITE_SIMULTANEOS, LIMITES_PADRAO.simultaneos),
    sessoesDia: n(env.LIMITE_SESSOES_DIA, LIMITES_PADRAO.sessoesDia)
  };
}

const MINUTO = 60_000, PRESO = 3 * MINUTO; // resposta "em andamento" há mais de 3 min é considerada encerrada
const dataUTC = agora => new Date(agora).toISOString().slice(0, 10);
const ateMeiaNoiteUTC = agora => {
  const d = new Date(agora);
  return Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - agora) / 1000);
};

// Contador em memória. "dia" pode ser salvo e restaurado (o Durable Object persiste; o server.js não precisa).
// Cada pessoa é identificada por uma ou mais chaves (hash do IP e, com Turnstile, a sessão):
// os limites valem para cada chave, então trocar de IP não zera a sessão e vice-versa.
export class Contador {
  constructor(limites = LIMITES_PADRAO, dia = null) {
    this.l = limites;
    this.dia = dia || { data: '', global: 0, pontos: {}, sessoes: {} };
    this.janela = { minuto: 0, pedidos: {} };
    this.ativos = {}; // chave → [{ id, inicio }]
  }

  virarDia(agora) {
    const hoje = dataUTC(agora);
    if (this.dia.data !== hoje) this.dia = { data: hoje, global: 0, pontos: {}, sessoes: {} };
    const minuto = Math.floor(agora / MINUTO);
    if (this.janela.minuto !== minuto) this.janela = { minuto, pedidos: {} };
    for (const k of Object.keys(this.ativos)) {
      this.ativos[k] = this.ativos[k].filter(a => agora - a.inicio < PRESO);
      if (!this.ativos[k].length) delete this.ativos[k];
    }
  }

  // Devolve { ok: true, id } ou { ok: false, erro, espera } (espera = segundos para o Retry-After)
  consumir(chaves, peso = 1, agora = Date.now()) {
    this.virarDia(agora);
    const recusa = (erro, espera) => ({ ok: false, erro, espera });
    const proxMinuto = Math.ceil((MINUTO - (agora % MINUTO)) / 1000);

    if (this.dia.global + peso > this.l.globalDia) {
      return recusa('O assistente atingiu o limite de uso de hoje. Ele volta amanhã.', ateMeiaNoiteUTC(agora));
    }
    for (const k of chaves) {
      if ((this.ativos[k] || []).length >= this.l.simultaneos) return recusa('Espere a resposta anterior terminar.', 5);
      if ((this.janela.pedidos[k] || 0) + 1 > this.l.porMinuto) return recusa('Muitas mensagens em pouco tempo. Espere um minuto.', proxMinuto);
      if ((this.dia.pontos[k] || 0) + peso > this.l.porDia) return recusa('Você atingiu o limite de uso do assistente por hoje. Volte amanhã.', ateMeiaNoiteUTC(agora));
    }

    const id = agora.toString(36) + Math.random().toString(36).slice(2, 8);
    this.dia.global += peso;
    for (const k of chaves) {
      this.janela.pedidos[k] = (this.janela.pedidos[k] || 0) + 1;
      this.dia.pontos[k] = (this.dia.pontos[k] || 0) + peso;
      (this.ativos[k] ||= []).push({ id, inicio: agora });
    }
    return { ok: true, id };
  }

  // Chamado quando a resposta termina (ou cai), liberando a vaga de "simultâneos"
  liberar(chaves, id) {
    for (const k of chaves) {
      if (!this.ativos[k]) continue;
      this.ativos[k] = this.ativos[k].filter(a => a.id !== id);
      if (!this.ativos[k].length) delete this.ativos[k];
    }
  }

  // Conta uma nova sessão anti-robô para o IP
  novaSessao(chaveIp, agora = Date.now()) {
    this.virarDia(agora);
    const n = this.dia.sessoes[chaveIp] || 0;
    if (n >= this.l.sessoesDia) return { ok: false, erro: 'Muitas verificações hoje. Tente amanhã.', espera: ateMeiaNoiteUTC(agora) };
    this.dia.sessoes[chaveIp] = n + 1;
    return { ok: true };
  }
}

// ── Utilidades ───────────────────────────────────────────────────────────────

// Guardamos só um hash curto do IP (não o IP em si)
export async function hashCurto(texto) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('routinesite:' + texto)));
  return [...bytes.slice(0, 12)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Repassa o stream do modelo. "terminou" resolve quando ele acaba (com sucesso, erro ou cancelado),
// para liberar a vaga de resposta em andamento.
export function acompanhar(corpo) {
  const { readable, writable } = new TransformStream();
  const terminou = corpo.pipeTo(writable).catch(() => {});
  return { stream: readable, terminou };
}
