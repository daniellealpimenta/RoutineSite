// Cálculo de gasto calórico e macros (Mifflin-St Jeor + Harris-Benedict)
// Função pura: recebe números, devolve números. Não sabe nada de tela nem de armazenamento.
const Calculadora = {
  calcular({ peso, altura, idade, atividade, sexo = 'm', objetivo = 'recompor' }) {
    const mulher = sexo === 'f';
    const mif = 10 * peso + 6.25 * altura - 5 * idade + (mulher ? -161 : 5);
    const har = mulher
      ? 447.593 + 9.247 * peso + 3.098 * altura - 4.330 * idade
      : 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade;
    const bmr = (mif + har) / 2;
    const tdee = bmr * atividade;
    const obj = OBJETIVOS[objetivo] || OBJETIVOS.recompor;
    const kcal = Math.round(tdee * (1 + obj.ajuste) / 10) * 10;
    const p = Math.round(peso * obj.proteina);
    const f = Math.round(peso * 0.85);
    const c = Math.round((kcal - p * 4 - f * 9) / 4);
    return {
      mif, har, bmr, tdee,
      ajuste: obj.ajuste,
      imc: peso / Math.pow(altura / 100, 2),
      agua: peso * 35 / 1000,
      meta: { kcal, p, c, f }
    };
  }
};
