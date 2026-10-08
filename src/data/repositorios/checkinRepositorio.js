// Onde os registros de check-in ficam guardados.
// Se um dia trocar localStorage por uma API ou banco, só este arquivo muda.
const CheckinRepositorio = {
  KEY: 'rd-checkin',
  carregar() { return store.get(this.KEY, {}); },
  salvar(registros) { store.set(this.KEY, registros); }
};
