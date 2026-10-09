// Ajudantes de interface usados por várias telas
const $ = id => document.getElementById(id);

// Barra de proporção dos macros (proteína, carbo, gordura)
function barraMacros(el, p, c, f) {
  const t = p * 4 + c * 4 + f * 9 || 1;
  el.innerHTML = `<i class="p" style="width:${p * 4 / t * 100}%"></i><i class="c" style="width:${c * 4 / t * 100}%"></i><i class="f" style="width:${f * 9 / t * 100}%"></i>`;
}

// Escapa texto para inserir com innerHTML sem virar HTML
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Markdown mínimo para as respostas do assistente: parágrafos, listas, **negrito**, *itálico* e títulos.
// Escapa tudo antes, então o texto do modelo nunca vira HTML de verdade.
function markdownSimples(md) {
  const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>');
  const blocos = [];
  let lista = null;
  const fecharLista = () => { if (lista) { blocos.push(`<${lista.tag}>${lista.itens.map(i => `<li>${i}</li>`).join('')}</${lista.tag}>`); lista = null; } };
  for (const bruta of md.split('\n')) {
    const linha = bruta.trim();
    const ul = linha.match(/^[-*•]\s+(.*)/), ol = linha.match(/^\d+[.)]\s+(.*)/), h = linha.match(/^#{1,4}\s+(.*)/);
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol';
      if (!lista || lista.tag !== tag) { fecharLista(); lista = { tag, itens: [] }; }
      lista.itens.push(inline((ul || ol)[1]));
      continue;
    }
    fecharLista();
    if (!linha) continue;
    blocos.push(h ? `<p><b>${inline(h[1])}</b></p>` : `<p>${inline(linha)}</p>`);
  }
  fecharLista();
  return blocos.join('');
}
