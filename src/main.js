// Ponto de partida: monta as telas e conecta as camadas.
// É o único arquivo que conhece todo mundo.
const TELAS = {
  numeros: TelaNumeros,
  dieta: TelaDieta,
  treino: TelaTreino,
  rotina: TelaRotina,
  progresso: TelaProgresso,
  assistente: TelaAssistente,
  perfil: TelaPerfil
};

// 1. Cada tela coloca seu HTML na página (e o botão de chat flutuante)
Object.values(TELAS).forEach(t => t.montar());
ChatFlutuante.montar();

// 2. Quando um caso de uso muda algo, as telas que dependem dele se redesenham
CasosPerfil.aoMudar(() => {
  CasosMeta.recalcular();
  Cabecalho.render();
  Object.values(TELAS).forEach(t => t.render());
});
CasosPlano.aoMudar(() => {
  TelaDieta.render();
  TelaTreino.render();
  TelaRotina.render();
  TelaAssistente.render();
});
CasosCheckin.aoMudar(() => {
  CheckinHoje.render();
  TelaProgresso.render();
});

// 3. Primeiro desenho
Cabecalho.render();
Object.values(TELAS).forEach(t => t.render());
CheckinComponente.ligar();
CheckinHoje.render();

// 4. Abas (no primeiro acesso, abre o Perfil)
Navegacao.iniciar(TELAS, CasosPerfil.existe() ? 'numeros' : 'perfil', !CasosPerfil.existe());
