// Tela "Rotina": semana resumida, linha do tempo por tipo de dia e dicas de sono — gerada a partir do perfil
const TelaRotina = {
  tipo: null,

  montar() {
    $('tab-rotina').innerHTML = `
      <div class="stack-s">
        <h2>A semana</h2>
        <p class="muted">Montada com seus dias de treino, horários e bloco de atividades do Perfil. Treinos nunca dependem de sobrar tempo: eles têm horário fixo.</p>
      </div>
      <div class="week" id="rt-semana"></div>

      <div class="seg" role="group" aria-label="Tipo de dia" id="rt-seg"></div>
      <div class="card"><div class="tl" id="rt-body"></div></div>
      <p class="small muted" id="rt-sleep"></p>

      <div class="card stack-s" id="rt-notas" hidden>
        <h3>Suas anotações</h3>
        <p id="rt-notas-txt" class="pre"></p>
        <div><button class="swap" data-ir="perfil">Editar no Perfil</button></div>
      </div>

      <div class="card stack-s">
        <h3>Sono: o que fazer na última hora antes de dormir</h3>
        <ul>
          <li>Ceia e banho assim que chegar. Roupa de treino e mochila prontas para a manhã.</li>
          <li>Tela fora da cama. Se for usar o celular, brilho baixo e nada de trabalho.</li>
          <li>Horário de dormir fixo, inclusive nos dias em que dá para acordar mais tarde.</li>
          <li>Se uma noite for ruim (menos de 6h), troque o treino da manhã por dormir mais e faça no dia seguinte. Treinar sem dormir não compensa.</li>
        </ul>
      </div>`;

    $('rt-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      this.tipo = b.dataset.rt;
      this.render();
    };
  },

  render() {
    const { dias, grupos } = CasosRotina.semana(), p = CasosPerfil.atual();

    $('rt-semana').innerHTML = dias.map(d => {
      const txt = d.ficha != null ? `${WK[d.ficha].k}: ${WK[d.ficha].s.toLowerCase()}`
        : d.id === 0 ? 'Descanso e marmitas'
        : d.fds ? 'Descanso ativo'
        : 'Caminhada 15–20 min';
      return `<div class="${d.ficha != null ? 'on' : ''}"><b>${d.curto}</b>${txt}</div>`;
    }).join('');

    if (!grupos.some(g => g.tipo === this.tipo)) this.tipo = grupos[0].tipo;
    $('rt-seg').innerHTML = grupos.map(g => `<button data-rt="${g.tipo}" aria-pressed="${g.tipo === this.tipo}">${g.nome}</button>`).join('');

    const { dia } = grupos.find(g => g.tipo === this.tipo);
    $('rt-body').innerHTML = dia.itens.map(i => `<div class="${i.destaque ? 'k' : ''}"><time>${i.hora}</time><span>${i.texto}</span></div>`).join('');
    const h = dia.sono.horas;
    $('rt-sleep').textContent = `Sono nesses dias: ${fmtHora(dia.sono.dormir)} às ${fmtHora(dia.sono.acordar)}, cerca de ${decimal(h).replace(',0', '')}h. ` +
      (h < 7 ? 'Abaixo de 7h: é o mínimo aceitável, então compense nos outros dias.' : h >= 8 ? 'É aqui que você recupera as noites mais curtas.' : 'Dentro do ideal.') +
      dia.avisos.map(a => ' ' + a).join('');

    $('rt-notas').hidden = !p.sobreRotina;
    $('rt-notas-txt').textContent = p.sobreRotina;
  }
};
