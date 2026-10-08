// Rotina por tipo de dia. r = [horário, atividade, destaque (1 = sim)]
const RT = {
  treino: {sleep:'Sono nesses dias: 22h45 às 5h50, cerca de 7h. É o mínimo aceitável, por isso são só 3 manhãs assim.', r:[
    ['05:50','Acordar, banana e café',0],['06:15','Academia: musculação + cardio (até 07:25)',1],['07:30','Banho e café da manhã',0],['08:00','Trabalho em casa. Levante 2 min a cada hora',0],
    ['10:00','Lanche da manhã',0],['11:45','Almoço',0],['12:30','Ônibus',0],['14:00','Trabalho na faculdade',0],['16:00','Lanche da tarde',0],
    ['18:10','Jantar',0],['19:00','Aula',0],['22:00','Casa: ceia, banho, mochila pronta',0],['22:45','Dormir',1]]},
  leve: {sleep:'Sono nesses dias: 22h45 às 7h, mais de 8h. É aqui que você recupera as manhãs de treino.', r:[
    ['07:00','Acordar sem pressa',1],['07:30','Café da manhã',0],['08:00','Trabalho em casa',0],['10:00','Lanche da manhã',0],['11:45','Almoço',0],
    ['12:30','Ônibus',0],['14:00','Trabalho na faculdade',0],['16:00','Lanche da tarde',0],['18:10','Jantar',0],['18:35','Caminhada rápida de 15 a 20 min pelo campus',1],
    ['19:00','Aula',0],['22:00','Casa: ceia e banho',0],['22:45','Dormir',1]]},
  fds: {sleep:'Fim de semana: durma 8h ou mais, mas não acorde depois das 9h para não bagunçar a segunda-feira.', r:[
    ['08:00','Acordar e café da manhã',0],['10:00','Sábado: treino D (corpo inteiro) + cardio, sem relógio',1],['12:30','Almoço',0],['16:00','Lanche',0],
    ['17:00','Domingo: compras e 1h30 de marmitas',1],['19:30','Jantar. Uma refeição livre no fim de semana cabe no plano',0],['22:45','Dormir',0]]}
};
