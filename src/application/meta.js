// Caso de uso da meta diária: recalcular a partir do perfil e guardar o resultado atual.
// A tela de dieta e o cabeçalho leem daqui.
const CasosMeta = {
  resultado: Calculadora.calcular(CasosPerfil.atual()),

  atual() { return this.resultado.meta; },

  calculo() { return this.resultado; },

  recalcular() {
    this.resultado = Calculadora.calcular(CasosPerfil.atual());
    return this.resultado;
  }
};
