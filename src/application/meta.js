// Caso de uso da meta diária: recalcular a partir dos dados pessoais e guardar a meta atual.
// A tela de dieta ouve as mudanças para atualizar o "Meta X kcal".
const CasosMeta = {
  meta: { kcal: 2200, p: 144, c: 269, f: 61 },
  ouvintes: [],

  aoMudar(fn) { this.ouvintes.push(fn); },

  atual() { return this.meta; },

  recalcular(dadosPessoais) {
    const resultado = Calculadora.calcular(dadosPessoais);
    this.meta = resultado.meta;
    this.ouvintes.forEach(fn => fn());
    return resultado;
  }
};
