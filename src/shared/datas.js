// Funções de data usadas por todas as camadas

// Data local no formato AAAA-MM-DD (sem usar UTC, para não "virar o dia" à noite)
function dateKey(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
// "qua, 8 de out."
function fmtDate(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Horários "HH:MM" ↔ minutos desde 00:00 (aceita passar da meia-noite: 1470 → "00:30")
function hm2min(hm) {
  const [h, m] = String(hm || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function min2hm(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(m / 60))}:${p(m % 60)}`;
}

// Dias da semana na ordem de exibição (segunda primeiro). id = Date.getDay()
const DIAS_SEMANA = [
  { id: 1, curto: 'Seg', nome: 'Segunda' },
  { id: 2, curto: 'Ter', nome: 'Terça' },
  { id: 3, curto: 'Qua', nome: 'Quarta' },
  { id: 4, curto: 'Qui', nome: 'Quinta' },
  { id: 5, curto: 'Sex', nome: 'Sexta' },
  { id: 6, curto: 'Sáb', nome: 'Sábado' },
  { id: 0, curto: 'Dom', nome: 'Domingo' }
];
