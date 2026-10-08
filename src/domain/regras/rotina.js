// Monta a rotina a partir do perfil: dias de cada ficha, linha do tempo do dia e horários das refeições.
// Funções puras: recebem o perfil, devolvem dados. Horários internos em minutos desde 00:00.
const DURACAO_TREINO = 70; // musculação + cardio, em minutos
const r5 = m => Math.round(m / 5) * 5;

const Rotina = {
  // { idDoDia: índice da ficha em WK }. 1–2 dias: corpo inteiro (D); 3: ABC; 4+: ABCD em ciclo
  distribuirFichas(diasTreino) {
    const dias = DIAS_SEMANA.filter(d => diasTreino.includes(d.id));
    const ordem = dias.length <= 2 ? [3] : dias.length === 3 ? [0, 1, 2] : [0, 1, 2, 3];
    const mapa = {};
    dias.forEach((d, i) => { mapa[d.id] = ordem[i % ordem.length]; });
    return mapa;
  },

  // Linha do tempo de um tipo de dia. opcoes = { treino, fds, ficha, marmitas }
  gerarDia(p, { treino = false, fds = false, ficha = null, marmitas = false } = {}) {
    const base = hm2min(p.acordar);
    const inicio = hm2min(p.inicioAtividades), fim = hm2min(p.fimAtividades);
    let dormir = hm2min(p.dormir);
    if (dormir < 12 * 60) dormir += 24 * 60; // dormir depois da meia-noite
    const itens = [], avisos = [];
    const add = (min, texto, destaque = false) => itens.push({ min: r5(min), texto, destaque });

    let acordar = base, treinoIni = null, cafe;
    const manhaAntes = treino && !fds && p.horarioTreino === 'antes';

    if (fds) {
      // fim de semana: até 1h a mais de sono, mas sem passar das 9h
      acordar = Math.max(base, Math.min(base + 60, 9 * 60));
      cafe = acordar + 20;
      if (treino) treinoIni = cafe + 120;
    } else if (manhaAntes) {
      // acorda cedo o suficiente para treinar, tomar banho e comer antes das atividades
      acordar = Math.min(base, inicio - 30 - DURACAO_TREINO - 30);
      treinoIni = acordar + 25;
      cafe = treinoIni + DURACAO_TREINO + 5;
    } else {
      cafe = acordar + 30;
      if (treino) treinoIni = fim + 15;
    }

    // refeições: café e ceia nas pontas, as outras quatro espalhadas entre elas
    const ceia = dormir - 35;
    const passo = (ceia - cafe) / 5;
    const refeicoes = { cafe: r5(cafe), lm: r5(cafe + passo), alm: r5(cafe + 2 * passo), lt: r5(cafe + 3 * passo), jan: r5(cafe + 4 * passo), ceia: r5(ceia) };
    if (treino) refeicoes.pre = r5(manhaAntes ? acordar : treinoIni - 45);

    add(acordar, manhaAntes ? 'Acordar, banana e café' : fds ? 'Acordar sem despertador' : 'Acordar', fds);
    if (!fds) {
      add(inicio, 'Início do trabalho/estudo. Levante 2 min a cada hora');
      add(fim, 'Fim do trabalho/estudo');
    }
    MEALS.forEach(m => {
      if (refeicoes[m.id] == null || (m.id === 'pre' && manhaAntes)) return;
      add(refeicoes[m.id], m.id === 'cafe' && manhaAntes ? 'Banho e café da manhã' : m.n);
    });
    if (treino) {
      const nome = ficha != null ? `Treino ${WK[ficha].k}` : 'Treino';
      add(treinoIni, `${nome}: musculação + cardio (até ${min2hm(r5(treinoIni + DURACAO_TREINO))})`, true);
      if (treinoIni + DURACAO_TREINO > dormir - 60) avisos.push('O treino termina perto da hora de dormir, o que costuma atrapalhar o sono. Se der, mude para antes das atividades.');
    } else if (!fds) {
      add(refeicoes.alm + 45, 'Caminhada rápida de 15 a 20 min', true);
    }
    if (marmitas) add(17 * 60, 'Compras e 1h30 de marmitas para a semana', true);
    add(dormir, 'Dormir', true);

    itens.sort((a, b) => a.min - b.min);
    return {
      itens: itens.map(i => ({ hora: min2hm(i.min), texto: i.texto, destaque: i.destaque })),
      refeicoes: Object.fromEntries(Object.entries(refeicoes).map(([k, v]) => [k, min2hm(v)])),
      sono: { dormir: min2hm(dormir), acordar: min2hm(acordar), horas: (acordar + 1440 - dormir) / 60 },
      avisos
    };
  },

  // Agrupa os dias da semana que têm a mesma rotina (ex.: "Seg, qua, sex" = treino em dia útil)
  semana(p) {
    const fichas = this.distribuirFichas(p.diasTreino);
    const dias = DIAS_SEMANA.map(d => ({
      ...d,
      fds: d.id === 0 || d.id === 6,
      ficha: fichas[d.id] ?? null
    }));
    const grupos = [];
    dias.forEach(d => {
      const tipo = (d.ficha != null ? 'treino' : 'livre') + (d.fds ? '-fds' : '');
      let g = grupos.find(x => x.tipo === tipo);
      if (!g) grupos.push(g = { tipo, treino: d.ficha != null, fds: d.fds, dias: [] });
      g.dias.push(d);
    });
    grupos.forEach(g => {
      g.nome = g.dias.map((d, i) => i ? d.curto.toLowerCase() : d.curto).join(', ');
      const ficha = g.dias.length === 1 ? g.dias[0].ficha : null;
      const marmitas = !g.treino && g.dias.some(d => d.id === 0);
      g.dia = this.gerarDia(p, { treino: g.treino, fds: g.fds, ficha, marmitas });
    });
    return { dias, grupos };
  }
};
