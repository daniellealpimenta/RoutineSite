// Cálculo de gasto calórico e macros (Mifflin-St Jeor + Harris-Benedict)
// Função pura: recebe números, devolve números. Não sabe nada de tela nem de armazenamento.
const Calculadora = {
  calcular({ peso, altura, idade, atividade }) {
    const mif = 10 * peso + 6.25 * altura - 5 * idade + 5;
    const har = 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade;
    const bmr = (mif + har) / 2;
    const tdee = bmr * atividade;
    const kcal = Math.round(tdee * 0.92 / 10) * 10; // déficit de 8%
    const p = Math.round(peso * 2);
    const f = Math.round(peso * 0.85);
    const c = Math.round((kcal - p * 4 - f * 9) / 4);
    return {
      mif, har, bmr, tdee,
      imc: peso / Math.pow(altura / 100, 2),
      agua: peso * 35 / 1000,
      meta: { kcal, p, c, f }
    };
  }
};
