// Formatação de números no padrão brasileiro
const fmt = n => Math.round(n).toLocaleString('pt-BR');       // 2200 → "2.200"
const decimal = n => n.toFixed(1).replace('.', ',');           // 23.8 → "23,8"
const fmtHora = hm => hm.replace(/^0(?=\d)/, '').replace(':00', 'h').replace(':', 'h'); // "08:00" → "8h", "22:45" → "22h45"
