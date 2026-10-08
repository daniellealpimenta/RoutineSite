// Quem é a pessoa e como é a rotina dela. Tudo o que o plano usa para se adaptar.
// Os valores padrão são só um exemplo para a tela não começar vazia.
const PERFIL_PADRAO = {
  nome: '',
  sexo: 'm',               // 'm' ou 'f' (muda as fórmulas de gasto basal)
  idade: 21,
  peso: 72,                // kg
  altura: 174,             // cm
  atividade: 1.375,        // multiplicador do gasto basal
  objetivo: 'recompor',    // chave de OBJETIVOS
  acordar: '07:00',        // horário normal de acordar
  dormir: '22:45',
  inicioAtividades: '08:00', // trabalho, estudo, faculdade...
  fimAtividades: '22:00',
  diasTreino: [1, 3, 5, 6],  // Date.getDay(): 0 = domingo
  horarioTreino: 'antes',    // 'antes' ou 'depois' das atividades (fim de semana é sempre de manhã)
  sobreRotina: ''            // texto livre: deslocamentos, turnos, restrições...
};

// ajuste = quanto a meta de calorias muda em relação ao gasto total do dia
const OBJETIVOS = {
  perder:   { nome: 'Perder gordura',             resumo: 'perder gordura mantendo o músculo', ajuste: -0.15, proteina: 2.0 },
  recompor: { nome: 'Recomposição',               resumo: 'ganhar músculo e perder gordura',   ajuste: -0.08, proteina: 2.0 },
  ganhar:   { nome: 'Ganhar massa',               resumo: 'ganhar músculo com superávit leve', ajuste:  0.10, proteina: 1.8 }
};

const NIVEIS_ATIVIDADE = [
  { valor: 1.2,   nome: 'Sentado o dia todo, sem treino (×1,2)' },
  { valor: 1.375, nome: 'Treino 3–4× por semana + caminhadas (×1,375)' },
  { valor: 1.55,  nome: 'Treino 5–6× e bastante movimento (×1,55)' },
  { valor: 1.725, nome: 'Trabalho físico pesado ou treino diário intenso (×1,725)' }
];

const Perfil = {
  // Completa o que faltar com o padrão e corrige valores fora do lugar
  normalizar(p = {}) {
    const n = { ...PERFIL_PADRAO, ...p };
    const num = (v, min, max, padrao) => { v = +v; return v >= min && v <= max ? v : padrao; };
    n.idade = num(n.idade, 14, 100, PERFIL_PADRAO.idade);
    n.peso = num(n.peso, 30, 250, PERFIL_PADRAO.peso);
    n.altura = num(n.altura, 120, 230, PERFIL_PADRAO.altura);
    n.atividade = num(n.atividade, 1, 2.5, PERFIL_PADRAO.atividade);
    if (!OBJETIVOS[n.objetivo]) n.objetivo = PERFIL_PADRAO.objetivo;
    if (n.sexo !== 'f') n.sexo = 'm';
    if (n.horarioTreino !== 'depois') n.horarioTreino = 'antes';
    n.diasTreino = Array.isArray(n.diasTreino) ? [...new Set(n.diasTreino.map(Number).filter(d => d >= 0 && d <= 6))] : [];
    n.nome = String(n.nome || '').trim().slice(0, 40);
    return n;
  }
};
