// Casos de uso da rotina: a semana e os horários do dia, sempre gerados a partir do perfil atual
const CasosRotina = {
  semana() { return Rotina.semana(CasosPerfil.atual()); },

  fichas() { return Rotina.distribuirFichas(CasosPerfil.atual().diasTreino); },

  // Horários das refeições num dia útil com ou sem treino
  horariosRefeicoes(diaDeTreino) {
    return Rotina.gerarDia(CasosPerfil.atual(), { treino: diaDeTreino }).refeicoes;
  },

  // Menor sono da semana (para o alerta da tela de números)
  menorSono() {
    return Math.min(...this.semana().grupos.map(g => g.dia.sono.horas));
  }
};
