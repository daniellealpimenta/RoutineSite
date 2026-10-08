// Salva e lê dados no navegador (localStorage), sem quebrar se estiver bloqueado
const store = {
  get(k, d) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
    catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  },

  // Tudo o que foi salvo com um prefixo, como objeto { chave: valor } (para exportar)
  todos(prefixo) {
    const r = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(prefixo)) r[k] = this.get(k);
      }
    } catch (e) {}
    return r;
  },

  // Apaga tudo com o prefixo e grava o que vier em dados (para importar ou zerar)
  substituir(prefixo, dados = {}) {
    try {
      Object.keys(this.todos(prefixo)).forEach(k => localStorage.removeItem(k));
      Object.entries(dados).forEach(([k, v]) => { if (k.startsWith(prefixo)) this.set(k, v); });
    } catch (e) {}
  }
};
