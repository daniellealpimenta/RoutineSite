// Cardápio base (pensado para ~2.200 kcal). Cada refeição tem 2 opções. m = [kcal, proteína, carbo, gordura]
// train: true = só aparece em dia de treino. Os horários vêm da rotina do perfil (regras/rotina.js)
const MEALS = [
  {id:'pre', n:'Pré-treino', train:true, o:[
    {i:['1 banana','Café sem açúcar'], m:[90,1,23,0]},
    {i:['2 torradas integrais com geleia','Café sem açúcar'], m:[95,2,20,1]}]},
  {id:'cafe', n:'Café da manhã', o:[
    {i:['3 ovos mexidos','2 fatias de pão integral','1 fruta (mamão, maçã ou laranja)'], m:[410,24,43,17]},
    {i:['Tapioca (2 col. de sopa de goma) com 2 ovos e 1 fatia de queijo','1 fruta'], m:[405,19,44,17]}]},
  {id:'lm', n:'Lanche da manhã', o:[
    {i:['1 pote de iogurte natural (170 g)','3 col. de sopa de aveia'], m:[215,10,28,7]},
    {i:['Vitamina: 200 ml de leite, 1 banana, 1 col. de sopa de aveia'], m:[238,9,43,4]}]},
  {id:'alm', n:'Almoço', o:[
    {i:['150 g de arroz cozido (6 col. de sopa)','1 concha de feijão','120 g de frango grelhado','Salada e legumes à vontade','1 col. de chá de azeite'], m:[540,46,62,10]},
    {i:['150 g de arroz cozido','1 concha de feijão','120 g de patinho moído ou tilápia','Legumes assados'], m:[532,48,62,9]}]},
  {id:'lt', n:'Lanche da tarde', o:[
    {i:['Sanduíche: 2 fatias de pão integral com 1 fatia grossa de queijo','1 banana'], m:[315,14,47,9]},
    {i:['1 iogurte proteico','1 banana','1 punhado pequeno de amendoim (20 g)'], m:[325,21,34,12]}]},
  {id:'jan', n:'Jantar', o:[
    {i:['Marmita: 120 g de arroz, 1 concha de feijão, 100 g de frango ou carne magra, legumes'], m:[453,39,54,7]},
    {i:['Prato do restaurante: 4 col. de sopa de arroz, 1 concha de feijão, 1 bife ou filé do tamanho da palma, metade do prato de salada'], m:[480,36,58,10]}]},
  {id:'ceia', n:'Ceia leve', o:[
    {i:['1 pote de iogurte natural','1 col. de sopa de pasta de amendoim'], m:[190,10,11,13]},
    {i:['2 ovos cozidos','1 fruta'], m:[210,12,19,10]}]}
];
