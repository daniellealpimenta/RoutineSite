// Tela "Números": aviso, calculadora, macros e expectativas
const TelaNumeros = {
  montar() {
    $('tab-numeros').innerHTML = `
      <div class="note stack-s">
        <h3>A parte sincera primeiro</h3>
        <p>Seu peso está normal (IMC 23,8). Você não precisa emagrecer na balança, precisa trocar gordura por músculo. Como você está voltando a treinar, dá para fazer as duas coisas ao mesmo tempo comendo perto da manutenção, com proteína alta e treino de força.</p>
        <p>O que mais ameaça o plano é o sono, não a dieta. Dormindo 5 a 6h30 o corpo constrói menos músculo, a fome por lanche e salgado aumenta e o treino rende menos. A meta aqui é 7h por noite, e a rotina foi montada para isso caber.</p>
      </div>

      <div class="grid2">
        <div class="card stack">
          <h2>Calculadora</h2>
          <p class="small muted">Já preenchida com seus dados. Mude o peso conforme for evoluindo e as metas se recalculam.</p>
          <div class="form">
            <label>Peso (kg)<input id="in-peso" type="number" inputmode="decimal" value="72" min="40" max="160" step="0.5"></label>
            <label>Altura (cm)<input id="in-alt" type="number" inputmode="numeric" value="174" min="140" max="210"></label>
            <label>Idade<input id="in-idade" type="number" inputmode="numeric" value="21" min="16" max="80"></label>
            <label class="wide">Nível de atividade
              <select id="in-ativ">
                <option value="1.2">Hoje: sentado o dia todo, sem treino (×1,2)</option>
                <option value="1.375" selected>Com este plano: 4 treinos + caminhadas (×1,375)</option>
                <option value="1.55">Treino 5–6× e bastante movimento (×1,55)</option>
              </select>
            </label>
          </div>
        </div>
        <div class="card">
          <div class="rows">
            <div><span>Basal, Mifflin-St Jeor</span><b id="o-mif"></b></div>
            <div><span>Basal, Harris-Benedict</span><b id="o-har"></b></div>
            <div><span>Basal, média das duas</span><b id="o-bmr"></b></div>
            <div><span>Gasto total do dia</span><b id="o-tdee"></b></div>
            <div><span>Meta do plano (−8%)</span><b class="hl" id="o-goal"></b></div>
            <div><span>IMC</span><b id="o-imc"></b></div>
            <div><span>Água</span><b id="o-agua"></b></div>
          </div>
        </div>
      </div>

      <div class="card stack">
        <h2>Macros da meta</h2>
        <div class="bar" id="macro-bar" aria-hidden="true"></div>
        <div class="legend" id="macro-legend"></div>
        <p class="small muted">Proteína a 2,0 g por kg de peso, gordura a 0,85 g por kg, o resto em carboidrato para sustentar o treino. O déficit é pequeno de propósito: um corte grande com pouco sono faz você perder músculo.</p>
      </div>

      <div class="grid2">
        <div class="card stack-s">
          <h3>O que esperar em 12 semanas</h3>
          <ul>
            <li>Balança quase parada, entre 71 e 73 kg. Isso é o plano funcionando.</li>
            <li>Cintura 2 a 4 cm menor e roupa mais folgada na barriga.</li>
            <li>Cargas subindo quase toda semana no primeiro mês.</li>
            <li>Ganho de músculo visível a partir da 6ª a 8ª semana.</li>
          </ul>
        </div>
        <div class="card stack-s">
          <h3>Como acompanhar</h3>
          <ul>
            <li>Peso 2× por semana, em jejum, e olhe a média.</li>
            <li>Cintura na altura do umbigo a cada 2 semanas.</li>
            <li>Foto de frente e de lado 1× por mês, mesma luz.</li>
            <li>Se o peso cair mais de 0,5 kg por semana, some 150 kcal. Se subir e a cintura também, tire 150.</li>
          </ul>
        </div>
      </div>
      <p class="small muted">Fórmulas dão estimativas com margem de uns 10%. Use as duas primeiras semanas para calibrar. Se você tem alguma condição de saúde ou toma medicação, vale passar o plano por um médico ou nutricionista antes.</p>`;

    ['in-peso', 'in-alt', 'in-idade', 'in-ativ'].forEach(id => $(id).addEventListener('input', () => this.render()));
  },

  render() {
    const r = CasosMeta.recalcular({
      peso: +$('in-peso').value || 72,
      altura: +$('in-alt').value || 174,
      idade: +$('in-idade').value || 21,
      atividade: +$('in-ativ').value
    });
    const { kcal, p, c, f } = r.meta;

    $('o-mif').textContent = fmt(r.mif) + ' kcal';
    $('o-har').textContent = fmt(r.har) + ' kcal';
    $('o-bmr').textContent = fmt(r.bmr) + ' kcal';
    $('o-tdee').textContent = fmt(r.tdee) + ' kcal';
    $('o-goal').textContent = fmt(kcal) + ' kcal';
    $('o-imc').textContent = decimal(r.imc);
    $('o-agua').textContent = decimal(r.agua) + ' L por dia';

    // cabeçalho
    $('k-bmr').textContent = fmt(r.bmr);
    $('k-goal').textContent = fmt(kcal);
    $('k-prot').textContent = p + ' g';

    barraMacros($('macro-bar'), p, c, f);
    $('macro-legend').innerHTML = `<span class="p">Proteína <b>${p} g</b></span><span class="c">Carboidrato <b>${c} g</b></span><span class="f">Gordura <b>${f} g</b></span>`;
  }
};
