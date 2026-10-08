// Ajudantes de interface usados por várias telas
const $ = id => document.getElementById(id);

// Barra de proporção dos macros (proteína, carbo, gordura)
function barraMacros(el, p, c, f) {
  const t = p * 4 + c * 4 + f * 9 || 1;
  el.innerHTML = `<i class="p" style="width:${p * 4 / t * 100}%"></i><i class="c" style="width:${c * 4 / t * 100}%"></i><i class="f" style="width:${f * 9 / t * 100}%"></i>`;
}
