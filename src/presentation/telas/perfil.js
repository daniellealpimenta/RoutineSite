// Tela "Perfil": dados pessoais e rotina. Tudo salva sozinho no navegador e o resto do plano se ajusta.
const TelaPerfil = {
  montar() {
    const opcoes = lista => lista.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
    $('tab-perfil').innerHTML = `
      <div class="note stack-s" id="pf-aviso">
        <h3>Comece por aqui</h3>
        <p>Os campos abaixo vêm com valores de exemplo. Troque pelos seus e o plano inteiro se ajusta: metas, porções do cardápio, horários das refeições, dias de treino e rotina. Tudo fica salvo só neste navegador.</p>
      </div>

      <form class="stack" id="pf-form">
        <div class="card stack">
          <h2>Você</h2>
          <div class="form">
            <label class="wide">Nome ou apelido (opcional)<input name="nome" type="text" maxlength="40" autocomplete="given-name" placeholder="Como quer ser chamado"></label>
            <label>Sexo biológico
              <select name="sexo">${opcoes([['m', 'Masculino'], ['f', 'Feminino']])}</select>
            </label>
            <label>Idade<input name="idade" type="number" inputmode="numeric" min="14" max="100"></label>
            <label>Peso (kg)<input name="peso" type="number" inputmode="decimal" min="30" max="250" step="0.1"></label>
            <label>Altura (cm)<input name="altura" type="number" inputmode="numeric" min="120" max="230"></label>
          </div>
          <p class="small muted">O sexo biológico só entra nas fórmulas de gasto basal, que são diferentes para homens e mulheres.</p>
        </div>

        <div class="card stack">
          <h2>Objetivo</h2>
          <div class="form">
            <label class="wide">O que você quer
              <select name="objetivo">${opcoes(Object.entries(OBJETIVOS).map(([k, o]) => [k, `${o.nome}: ${o.resumo}`]))}</select>
            </label>
            <label class="wide">Nível de atividade
              <select name="atividade">${opcoes(NIVEIS_ATIVIDADE.map(n => [n.valor, n.nome]))}</select>
            </label>
          </div>
        </div>

        <div class="card stack">
          <h2>Rotina</h2>
          <div class="form">
            <label>Costuma acordar<input name="acordar" type="time"></label>
            <label>Quer dormir às<input name="dormir" type="time"></label>
            <label>Treino em dia útil
              <select name="horarioTreino">${opcoes([['antes', 'Antes das atividades'], ['depois', 'Depois das atividades']])}</select>
            </label>
            <label>Atividades começam<input name="inicioAtividades" type="time"></label>
            <label>Atividades terminam<input name="fimAtividades" type="time"></label>
          </div>
          <p class="small muted">"Atividades" é o bloco ocupado do dia útil: trabalho, aula, estágio, deslocamento. O treino e as refeições são encaixados em volta dele.</p>
          <div class="stack-s">
            <span class="label">Dias de treino</span>
            <div class="seg dias" role="group" aria-label="Dias de treino" id="pf-dias">
              ${DIAS_SEMANA.map(d => `<button type="button" data-dia="${d.id}">${d.curto}</button>`).join('')}
            </div>
            <p class="small muted" id="pf-dias-dica"></p>
          </div>
        </div>

        <div class="card stack">
          <h2>Sobre sua rotina</h2>
          <label class="campo">Conte o que for importante: turnos, deslocamento, restrições alimentares, lesões, academia em casa…
            <textarea name="sobreRotina" rows="4" maxlength="1000" placeholder="Ex.: pego ônibus às 12h30, faculdade à noite, não como peixe."></textarea>
          </label>
          <p class="small muted">Esse texto aparece na aba Rotina como lembrete.</p>
        </div>
      </form>

      <div class="card stack">
        <div class="stack-s">
          <h2>Restrições e preferências</h2>
          <p class="small muted">Regras que o plano sempre respeita: o assistente leva em conta em toda conversa e ao gerar dieta ou treino. Ele também pode sugerir novas quando você contar algo no chat.</p>
        </div>
        <ul class="restricoes" id="pf-restricoes"></ul>
        <form class="restricao-nova" id="pf-restricao-form">
          <select id="pf-restricao-area" aria-label="Área">
            ${Object.entries(AREAS_RESTRICAO).map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}
          </select>
          <input id="pf-restricao-texto" type="text" maxlength="150" placeholder="Ex.: Sem remada curvada (lombar), sem lactose…" aria-label="Nova restrição">
          <button class="swap primario">Adicionar</button>
        </form>
      </div>

      <div class="card stack">
        <h2>Seus dados</h2>
        <p class="small muted">Tudo fica salvo só neste navegador (o assistente recebe seus dados apenas quando você conversa com ele). Para levar para outro celular ou computador, exporte um backup e importe lá.</p>
        <div class="acoes">
          <button class="swap" id="pf-exportar">Exportar backup</button>
          <label class="swap">Importar backup<input type="file" accept="application/json,.json" id="pf-importar" hidden></label>
          <button class="swap perigo" id="pf-apagar">Apagar tudo</button>
        </div>
      </div>`;

    const form = $('pf-form');
    form.onsubmit = e => e.preventDefault();
    form.addEventListener('input', e => {
      const el = e.target;
      if (!el.name || el.value === '') return; // não salva campo vazio no meio da digitação
      const v = el.type === 'number' || el.name === 'atividade' ? +el.value : el.value;
      CasosPerfil.atualizar({ [el.name]: v });
    });
    $('pf-dias').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const id = +b.dataset.dia, dias = CasosPerfil.atual().diasTreino;
      CasosPerfil.atualizar({ diasTreino: dias.includes(id) ? dias.filter(d => d !== id) : [...dias, id] });
    };

    $('pf-restricao-form').onsubmit = e => {
      e.preventDefault();
      const texto = $('pf-restricao-texto').value.trim();
      if (!texto) return;
      CasosPerfil.atualizar({ restricoes: [...CasosPerfil.atual().restricoes, { area: $('pf-restricao-area').value, texto }] });
      $('pf-restricao-texto').value = '';
    };
    $('pf-restricoes').onclick = e => {
      const b = e.target.closest('[data-remover]');
      if (b) CasosPerfil.atualizar({ restricoes: CasosPerfil.atual().restricoes.filter((_, i) => i !== +b.dataset.remover) });
    };

    $('pf-exportar').onclick = () => {
      const blob = new Blob([JSON.stringify(CasosPerfil.exportar(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `routinesite-backup-${dateKey(today())}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $('pf-importar').onchange = async e => {
      const arq = e.target.files[0];
      if (!arq) return;
      try {
        CasosPerfil.importar(await arq.text());
        location.reload();
      } catch (err) {
        alert('Não foi possível importar: ' + err.message);
      }
    };
    $('pf-apagar').onclick = () => {
      if (!confirm('Apagar perfil, check-ins e marcações deste navegador? Isso não pode ser desfeito.')) return;
      CasosPerfil.apagarTudo();
      location.reload();
    };
  },

  render() {
    const p = CasosPerfil.atual(), form = $('pf-form');
    $('pf-aviso').hidden = CasosPerfil.existe();
    // não sobrescreve o campo que a pessoa está editando
    [...form.elements].forEach(el => {
      if (el.name && el !== document.activeElement) el.value = p[el.name];
    });
    $('pf-restricoes').innerHTML = p.restricoes.length
      ? p.restricoes.map((r, i) => `<li><span class="tag">${AREAS_RESTRICAO[r.area]}</span><span>${esc(r.texto)}</span><button class="fechar" data-remover="${i}" aria-label="Remover restrição: ${esc(r.texto)}">×</button></li>`).join('')
      : '<li class="small muted vazio">Nenhuma ainda.</li>';
    [...$('pf-dias').children].forEach(b => b.setAttribute('aria-pressed', p.diasTreino.includes(+b.dataset.dia)));
    const n = p.diasTreino.length;
    $('pf-dias-dica').textContent =
      n === 0 ? 'Nenhum dia escolhido: o plano fica só com caminhadas.'
      : n <= 2 ? `${n} dia${n > 1 ? 's' : ''}: treino de corpo inteiro em cada um.`
      : n === 3 ? '3 dias: fichas A, B e C (divisão ABC).'
      : `${n} dias: fichas A, B, C e D${n > 4 ? ' em sequência' : ''}. O ideal são 3 a 4.`;
  }
};
