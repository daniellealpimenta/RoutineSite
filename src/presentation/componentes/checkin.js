// Componente de check-in: três botões (dieta, rotina, treino) para um dia
// Usado no topo (sempre hoje) e na tela de progresso (dia escolhido no gráfico)
const CheckinComponente = {
  render(el, key, titulo) {
    const d = CasosCheckin.dia(key);
    el.innerHTML = `
      <div class="card checkin">
        <div class="top">
          <h3>${titulo}</h3>
          <span class="small muted">${CasosCheckin.pontos(key)} de ${CATEGORIAS.length} cumpridos</span>
        </div>
        <div class="opts">
          ${CATEGORIAS.map(c => `
            <button class="ck" data-key="${key}" data-cat="${c.id}" aria-pressed="${!!d[c.id]}">
              <span class="box" aria-hidden="true">✓</span>
              <span>${c.nome}<small>${c.dica}</small></span>
            </button>`).join('')}
        </div>
      </div>`;
  },

  // Um único listener cuida de qualquer botão de check-in na página
  ligar() {
    document.addEventListener('click', e => {
      const b = e.target.closest('.ck');
      if (b) CasosCheckin.alternar(b.dataset.key, b.dataset.cat);
    });
  }
};

// Card fixo do topo, sempre com o dia de hoje
const CheckinHoje = {
  render() {
    CheckinComponente.render($('checkin-hoje'), dateKey(today()), 'Hoje, ' + fmtDate(today()));
  }
};
