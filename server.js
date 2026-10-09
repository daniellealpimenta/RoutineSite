// Servidor opcional: serve o site e repassa as conversas do Assistente para a API da NVIDIA.
// A chave fica só aqui (variável de ambiente ou arquivo .env), nunca no navegador.
// Sem dependências: precisa só do Node 18+.  Uso: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

// .env simples: CHAVE=valor por linha
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const linha of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const CHAVE = process.env.NVIDIA_API_KEY;
const MODELO = process.env.NVIDIA_MODEL || undefined;
const API = process.env.NVIDIA_BASE_URL || undefined;
const PORTA = +process.env.PORT || 8000;
const HOST = process.env.HOST || '127.0.0.1';
const RAIZ = __dirname;
// Validação e chamada ao modelo ficam em api/nucleo.mjs (o mesmo código roda no Cloudflare Worker)
const nucleo = import('./api/nucleo.mjs');

const TIPOS_ARQUIVO = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8'
};
// Só isso é servido como arquivo (nada de .env, server.js, .git...)
const PUBLICO = /^\/(index\.html|src\/.+|docs\/.+)$/;

// Cabeçalhos de segurança em todas as respostas
const SEGURANCA = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };

function json(res, status, obj, extra = {}) {
  res.writeHead(status, { ...SEGURANCA, ...extra, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function lerCorpo(req, limite) {
  return new Promise((ok, erro) => {
    let tam = 0; const partes = [];
    req.on('data', c => { tam += c.length; if (tam > limite) { erro(new Error('Pedido grande demais')); req.destroy(); } else partes.push(c); });
    req.on('end', () => ok(Buffer.concat(partes).toString('utf8')));
    req.on('error', erro);
  });
}

let contador; // cotas em memória (as mesmas regras do Worker), criadas no primeiro uso

async function chat(req, res) {
  if (!CHAVE) return json(res, 503, { erro: 'Assistente desligado: defina NVIDIA_API_KEY no arquivo .env' });
  const { validarPedido, chamarModelo, LIMITE_CORPO, Contador, limitesDe, hashCurto } = await nucleo;

  // Só aceita pedidos feitos pelo próprio site (bloqueia outros sites usando seu servidor pelo navegador)
  if (req.headers.origin !== 'http://' + req.headers.host) return json(res, 403, { erro: 'Origem não permitida' });
  if (!(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { erro: 'Use JSON' });
  if (+(req.headers['content-length'] || 0) > LIMITE_CORPO) return json(res, 413, { erro: 'Pedido grande demais' });

  let pedido;
  try { pedido = validarPedido(JSON.parse(await lerCorpo(req, LIMITE_CORPO))); } catch (e) { pedido = null; }
  if (!pedido) return json(res, 400, { erro: 'Mensagens inválidas' });

  contador ||= new Contador(limitesDe(process.env));
  const chaves = ['ip:' + await hashCurto(req.socket.remoteAddress || '')];
  const vaga = contador.consumir(chaves, pedido.peso);
  if (!vaga.ok) return json(res, 429, { erro: vaga.erro }, { 'Retry-After': String(vaga.espera) });
  let liberado = false;
  const liberar = () => { if (!liberado) { liberado = true; contador.liberar(chaves, vaga.id); } };

  const controle = new AbortController();
  res.on('close', () => { controle.abort(); liberar(); }); // se a pessoa fechar a página, para de gerar
  let resp;
  try {
    resp = await chamarModelo({ chave: CHAVE, modelo: MODELO, base: API, pedido, sinal: controle.signal });
  } catch (e) {
    liberar();
    return json(res, 502, { erro: 'Não foi possível falar com o modelo agora. Tente de novo.' });
  }
  if (!resp.ok) {
    liberar();
    const txt = await resp.text().catch(() => '');
    console.error('API respondeu', resp.status, txt.slice(0, 300));
    return json(res, 502, { erro: `A API respondeu ${resp.status}. Confira a chave e o modelo.` });
  }
  // repassa o stream (Server-Sent Events) do jeito que chega
  res.writeHead(200, { ...SEGURANCA, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  try {
    for await (const pedaco of resp.body) res.write(pedaco);
  } catch (e) { /* conexão fechada no meio */ }
  liberar();
  res.end();
}

function arquivo(req, res) {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/') url = '/index.html';
  const alvo = path.normalize(path.join(RAIZ, url));
  if (!PUBLICO.test(url) || !alvo.startsWith(RAIZ + path.sep)) { res.writeHead(404); return res.end('Não encontrado'); }
  fs.readFile(alvo, (erro, dados) => {
    if (erro) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { ...SEGURANCA, 'Content-Type': TIPOS_ARQUIVO[path.extname(alvo)] || 'application/octet-stream' });
    res.end(dados);
  });
}

http.createServer((req, res) => {
  if (req.url === '/api/status') return json(res, 200, { ativo: !!CHAVE, turnstile: null });
  if (req.url === '/api/chat' && req.method === 'POST') return chat(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return arquivo(req, res);
  res.writeHead(405); res.end();
}).listen(PORTA, HOST, () => {
  console.log(`RoutineSite em http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORTA}`);
  console.log(CHAVE ? 'Assistente ligado' : 'Assistente desligado: crie um .env com NVIDIA_API_KEY=... (veja .env.example)');
});
