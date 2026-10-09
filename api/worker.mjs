// Proxy do assistente no Cloudflare Workers, para o site publicado no GitHub Pages.
// A chave fica como secret do Worker (NVIDIA_API_KEY). Publicado pelo workflow .github/workflows/assistente.yml
//
// Camadas de proteção, da mais barata para a mais cara:
//   1. Método, caminho, origem, tamanho e Content-Type conferidos antes de qualquer outra coisa
//   2. Turnstile (opcional): prova de que é uma pessoa, trocada por uma sessão assinada de 2 h
//   3. Cotas num Durable Object: por minuto, por dia, simultâneas (por IP e por sessão) e um teto global diário
//   4. Pedido validado e com modelo, tamanho de resposta e tempo máximo fixos
import { DurableObject } from 'cloudflare:workers';
import { validarPedido, chamarModelo, acompanhar, Contador, limitesDe, hashCurto, LIMITE_CORPO } from './nucleo.mjs';

const DURACAO_SESSAO = 2 * 60 * 60 * 1000;

// Um único contador para o Worker inteiro: o Durable Object processa um pedido por vez,
// então as cotas não "vazam" com muitos pedidos chegando juntos.
export class Cotas extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.contador = new Contador(limitesDe(env), await ctx.storage.get('dia'));
    });
  }
  async consumir(chaves, peso) {
    const r = this.contador.consumir(chaves, peso);
    if (r.ok) await this.ctx.storage.put('dia', this.contador.dia);
    return r;
  }
  liberar(chaves, id) { this.contador.liberar(chaves, id); }
  async novaSessao(chaveIp) {
    const r = this.contador.novaSessao(chaveIp);
    if (r.ok) await this.ctx.storage.put('dia', this.contador.dia);
    return r;
  }
}

export default {
  async fetch(req, env, ctx) {
    const origem = req.headers.get('Origin') || '';
    const permitidas = (env.ORIGENS_PERMITIDAS || '').split(',').map(s => s.trim()).filter(Boolean);
    const permitida = permitidas.includes(origem);
    const base = {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      ...(permitida ? { 'Access-Control-Allow-Origin': origem, 'Access-Control-Expose-Headers': 'Retry-After', 'Vary': 'Origin' } : {})
    };
    const json = (status, obj, extra = {}) =>
      new Response(JSON.stringify(obj), { status, headers: { ...base, ...extra, 'Content-Type': 'application/json; charset=utf-8' } });
    const recusa = r => json(429, { erro: r.erro }, { 'Retry-After': String(r.espera || 60) });
    const { pathname } = new URL(req.url);
    const turnstile = !!(env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY);

    // ── 1. Filtros baratos ──
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: permitida ? 204 : 403, headers: { ...base, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, X-Sessao', 'Access-Control-Max-Age': '86400' } });
    }
    if (pathname === '/api/status' && req.method === 'GET') {
      return json(200, { ativo: !!env.NVIDIA_API_KEY, turnstile: turnstile ? env.TURNSTILE_SITE_KEY : null });
    }
    const rotas = ['/api/chat', '/api/sessao'];
    if (!rotas.includes(pathname) || req.method !== 'POST') return json(404, { erro: 'Não encontrado' });
    // Só o site atende: pedidos de outras origens (ou sem origem, como curl) são recusados
    if (!permitida) return json(403, { erro: 'Origem não permitida' });
    if (!(req.headers.get('Content-Type') || '').startsWith('application/json')) return json(415, { erro: 'Use JSON' });
    if (+(req.headers.get('Content-Length') || 0) > LIMITE_CORPO) return json(413, { erro: 'Pedido grande demais' });
    if (!env.NVIDIA_API_KEY) return json(503, { erro: 'Assistente desligado: falta o secret NVIDIA_API_KEY no Worker' });

    let corpo;
    try {
      const texto = await req.text();
      if (texto.length > LIMITE_CORPO) return json(413, { erro: 'Pedido grande demais' });
      corpo = JSON.parse(texto);
    } catch (e) { return json(400, { erro: 'Pedido inválido' }); }

    const ip = req.headers.get('CF-Connecting-IP') || 'desconhecido';
    const chaveIp = 'ip:' + await hashCurto(ip);
    const cotas = env.COTAS.get(env.COTAS.idFromName('global'));

    // ── 2. Turnstile: troca o token do desafio por uma sessão assinada ──
    if (pathname === '/api/sessao') {
      if (!turnstile) return json(404, { erro: 'Não encontrado' });
      const limite = await cotas.novaSessao(chaveIp);
      if (!limite.ok) return recusa(limite);
      if (!(await verificarTurnstile(corpo.token, ip, env.TURNSTILE_SECRET))) return json(403, { erro: 'Não foi possível confirmar que você não é um robô. Recarregue a página.' });
      const exp = Date.now() + DURACAO_SESSAO;
      const sid = crypto.randomUUID();
      return json(200, { sessao: await assinar({ sid, exp }, env.TURNSTILE_SECRET), exp });
    }

    const chaves = [chaveIp];
    if (turnstile) {
      const sessao = await conferir(req.headers.get('X-Sessao'), env.TURNSTILE_SECRET);
      if (!sessao) return json(401, { erro: 'Sessão expirada', sessao: true });
      chaves.push('s:' + sessao.sid);
    }

    // ── 3. Validação e cotas ──
    const pedido = validarPedido(corpo);
    if (!pedido) return json(400, { erro: 'Mensagens inválidas' });
    const vaga = await cotas.consumir(chaves, pedido.peso);
    if (!vaga.ok) return recusa(vaga);
    const liberar = () => cotas.liberar(chaves, vaga.id);

    // ── 4. Chamada ao modelo ──
    let resp;
    try {
      resp = await chamarModelo({ chave: env.NVIDIA_API_KEY, modelo: env.NVIDIA_MODEL || undefined, pedido, sinal: req.signal });
    } catch (e) {
      ctx.waitUntil(liberar());
      return json(502, { erro: 'Não foi possível falar com o modelo agora. Tente de novo.' });
    }
    if (!resp.ok) {
      ctx.waitUntil(liberar());
      console.error('API respondeu', resp.status, (await resp.text().catch(() => '')).slice(0, 300));
      return json(502, { erro: resp.status === 429 ? 'O modelo está sobrecarregado agora. Tente de novo em instantes.' : 'O modelo não respondeu. Tente de novo.' });
    }
    const { stream, terminou } = acompanhar(resp.body);
    ctx.waitUntil(terminou.then(liberar));
    return new Response(stream, { headers: { ...base, 'Content-Type': 'text/event-stream; charset=utf-8' } });
  }
};

// ── Turnstile e sessão assinada (HMAC-SHA256) ──

async function verificarTurnstile(token, ip, segredo) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', segredo);
  form.append('response', token);
  form.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, signal: AbortSignal.timeout(10_000) });
    return (await r.json()).success === true;
  } catch (e) { return false; }
}

const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function chaveHmac(segredo) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode('sessao:' + segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function assinar(dados, segredo) {
  const corpo = b64(new TextEncoder().encode(JSON.stringify(dados)));
  const assinatura = await crypto.subtle.sign('HMAC', await chaveHmac(segredo), new TextEncoder().encode(corpo));
  return corpo + '.' + b64(assinatura);
}

async function conferir(token, segredo) {
  if (typeof token !== 'string' || token.length > 512 || !token.includes('.')) return null;
  const [corpo, assinatura] = token.split('.');
  try {
    const ok = await crypto.subtle.verify('HMAC', await chaveHmac(segredo), deB64(assinatura), new TextEncoder().encode(corpo));
    if (!ok) return null;
    const dados = JSON.parse(new TextDecoder().decode(deB64(corpo)));
    return dados.exp > Date.now() && typeof dados.sid === 'string' ? dados : null;
  } catch (e) { return null; }
}
