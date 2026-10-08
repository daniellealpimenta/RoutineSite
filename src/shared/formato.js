// Formatação de números no padrão brasileiro
const fmt = n => Math.round(n).toLocaleString('pt-BR');       // 2200 → "2.200"
const decimal = n => n.toFixed(1).replace('.', ',');           // 23.8 → "23,8"
