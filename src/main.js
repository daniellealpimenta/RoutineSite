// Ponto de partida: monta as telas e conecta as camadas.
// É o único arquivo que conhece todo mundo.
const TELAS = {
  numeros: TelaNumeros,
  dieta: TelaDieta,
  treino: TelaTreino,
  rotina: TelaRotina,
  progresso: TelaProgresso
};

// 1. Cada tela coloca seu HTML na página
Object.values(TELAS).forEach(t => t.montar());

// 2. Quando um caso de uso muda algo, as telas que dependem dele se redesenham
CasosMeta.aoMudar(() => TelaDieta.renderTotal());
CasosCheckin.aoMudar(() => {
  CheckinHoje.render();
  TelaProgresso.render();
});

// 3. Primeiro desenho
Object.values(TELAS).forEach(t => t.render());
CheckinComponente.ligar();
CheckinHoje.render();

// 4. Abas
Navegacao.iniciar(TELAS);
