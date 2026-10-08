// Fichas de treino. x = [exercício, séries × reps, descanso]
// Os dias de cada ficha vêm do perfil (Rotina.distribuirFichas)
const WK = [
  {k:'A', s:'Peito, ombros e tríceps', c:'Cardio: 12 a 15 min de esteira inclinada, ritmo de conversa.', x:[
    ['Supino reto com barra ou halteres','4 × 6–10','2 min'],['Supino inclinado com halteres','3 × 8–12','90 s'],['Crucifixo na máquina','2 × 12–15','60 s'],
    ['Desenvolvimento com halteres','3 × 8–12','90 s'],['Elevação lateral','3 × 12–15','60 s'],['Tríceps na corda','3 × 10–15','60 s'],['Tríceps francês','2 × 10–15','60 s']]},
  {k:'B', s:'Pernas completas', c:'Cardio: 12 a 15 min de bicicleta bem leve.', x:[
    ['Agachamento livre ou no hack','4 × 6–10','2 min'],['Leg press','3 × 10–12','90 s'],['Levantamento terra romeno','3 × 8–12','2 min'],
    ['Cadeira extensora','2 × 12–15','60 s'],['Mesa flexora','3 × 10–15','60 s'],['Panturrilha em pé','4 × 10–15','60 s'],['Prancha','3 × 30–45 s','45 s']]},
  {k:'C', s:'Costas e bíceps', c:'Cardio: 12 a 15 min de esteira inclinada, ritmo de conversa.', x:[
    ['Barra fixa ou puxada frente','4 × 6–10','2 min'],['Remada curvada com barra','3 × 8–12','90 s'],['Remada baixa na polia','3 × 8–12','90 s'],
    ['Pulldown com braços estendidos','2 × 12–15','60 s'],['Face pull na polia','2 × 12–15','60 s'],['Rosca direta','3 × 8–12','60 s'],['Rosca martelo','2 × 10–15','60 s']]},
  {k:'D', s:'Corpo inteiro curto, segundo estímulo da semana', c:'Cardio: 15 a 20 min, hoje sem relógio apertado. Pode ser uma corrida leve na rua.', x:[
    ['Supino com halteres ou na máquina','3 × 8–12','90 s'],['Agachamento búlgaro ou leg press','3 × 10–12','90 s'],['Elevação pélvica com barra','3 × 8–12','90 s'],
    ['Puxada frente leve <small>Se costas treinaram ontem, pare bem antes da falha</small>','2 × 10–12','90 s'],['Elevação lateral','2 × 12–15','60 s'],['Elevação de pernas (abdômen)','3 × 10–15','45 s']]}
];
