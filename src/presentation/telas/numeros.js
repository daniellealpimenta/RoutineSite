// Tela "Números": aviso, calculadora, macros e expectativas — tudo a partir do perfil
const TelaNumeros = {
  montar() {
    $('tab-numeros').innerHTML = `
      <div class="note stack-s" id="n-nota"></div>

      <div class="grid2">
        <div class="card stack">
          <h2>Calculadora</h2>
          <p class="small muted">Calculada com os dados do seu perfil. Atualize o peso conforme for evoluindo e as metas se recalculam.</p>
          <div class="rows" id="n-perfil"></div>
          <div><button class="swap" data-ir="perfil">Editar perfil</button></div>
        </div>
        <div class="card">
          <div class="rows">
            <div><span>Basal, Mifflin-St Jeor</span><b id="o-mif"></b></div>
            <div><span>Basal, Harris-Benedict</span><b id="o-har"></b></div>
            <div><span>Basal, média das duas</span><b id="o-bmr"></b></div>
            <div><span>Gasto total do dia</span><b id="o-tdee"></b></div>
            <div><span id="o-goal-nome">Meta do plano</span><b class="hl" id="o-goal"></b></div>
            <div><span>IMC</span><b id="o-imc"></b></div>
            <div><span>Água</span><b id="o-agua"></b></div>
          </div>
        </div>
      </div>

      <div class="card stack">
        <h2>Macros da meta</h2>
        <div class="bar" id="macro-bar" aria-hidden="true"></div>
        <div class="legend" id="macro-legend"></div>
        <p class="small muted" id="n-macros-txt"></p>
      </div>

      <div class="grid2">
        <div class="card stack-s">
          <h3>O que esperar em 12 semanas</h3>
          <ul id="n-espera"></ul>
        </div>
        <div class="card stack-s">
          <h3>Como acompanhar</h3>
          <ul>
            <li>Peso 2× por semana, em jejum, e olhe a média.</li>
            <li>Cintura na altura do umbigo a cada 2 semanas.</li>
            <li>Foto de frente e de lado 1× por mês, mesma luz.</li>
            <li id="n-ajuste"></li>
          </ul>
        </div>
      </div>
      <p class="small muted">Fórmulas dão estimativas com margem de uns 10%. Use as duas primeiras semanas para calibrar. Se você tem alguma condição de saúde ou toma medicação, vale passar o plano por um médico ou nutricionista antes.</p>`;
  },

  render() {
    const p = CasosPerfil.atual(), r = CasosMeta.calculo(), obj = OBJETIVOS[p.objetivo];
    const { kcal, p: prot, c, f } = r.meta;

    $('n-nota').innerHTML = '<h3>A parte sincera primeiro</h3>' + this.textoNota(p, r).map(t => `<p>${t}</p>`).join('');

    $('n-perfil').innerHTML = [
      ['Sexo', p.sexo === 'f' ? 'Feminino' : 'Masculino'],
      ['Idade', p.idade + ' anos'],
      ['Peso', p.peso.toLocaleString('pt-BR') + ' kg'],
      ['Altura', p.altura + ' cm'],
      ['Objetivo', obj.nome],
      ['Atividade', '×' + String(p.atividade).replace('.', ',')]
    ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');

    const pct = Math.round(r.ajuste * 100);
    $('o-mif').textContent = fmt(r.mif) + ' kcal';
    $('o-har').textContent = fmt(r.har) + ' kcal';
    $('o-bmr').textContent = fmt(r.bmr) + ' kcal';
    $('o-tdee').textContent = fmt(r.tdee) + ' kcal';
    $('o-goal-nome').textContent = `Meta do plano (${pct > 0 ? '+' : '−'}${Math.abs(pct)}%)`;
    $('o-goal').textContent = fmt(kcal) + ' kcal';
    $('o-imc').textContent = decimal(r.imc);
    $('o-agua').textContent = decimal(r.agua) + ' L por dia';

    barraMacros($('macro-bar'), prot, c, f);
    $('macro-legend').innerHTML = `<span class="p">Proteína <b>${prot} g</b></span><span class="c">Carboidrato <b>${c} g</b></span><span class="f">Gordura <b>${f} g</b></span>`;
    $('n-macros-txt').textContent = `Proteína a ${decimal(obj.proteina)} g por kg de peso, gordura a 0,85 g por kg, o resto em carboidrato para sustentar o treino. ` + {
      perder: 'O déficit é moderado: cortar mais do que isso costuma levar músculo junto.',
      recompor: 'O déficit é pequeno de propósito: um corte grande com pouco sono faz você perder músculo.',
      ganhar: 'O superávit é pequeno de propósito: comer muito acima disso vira mais gordura, não mais músculo.'
    }[p.objetivo];

    $('n-espera').innerHTML = this.expectativas(p).map(t => `<li>${t}</li>`).join('');
    $('n-ajuste').textContent = {
      perder: 'Se o peso cair mais de 1% por semana, some 150 kcal. Se ficar parado por 3 semanas, tire 150.',
      recompor: 'Se o peso cair mais de 0,5 kg por semana, some 150 kcal. Se subir e a cintura também, tire 150.',
      ganhar: 'Se o peso não subir em 3 semanas, some 150 kcal. Se a cintura crescer rápido, tire 150.'
    }[p.objetivo];
  },

  textoNota(p, r) {
    const imc = r.imc;
    const faixa = imc < 18.5 ? 'abaixo do normal' : imc < 25 ? 'na faixa normal' : imc < 30 ? 'acima do normal (sobrepeso)' : 'na faixa de obesidade';
    const objetivo = {
      perder: 'O foco é perder gordura sem perder músculo: déficit moderado, proteína alta e treino de força para o corpo ter motivo de manter a massa magra.',
      recompor: 'Você não precisa mudar muito o número da balança, precisa trocar gordura por músculo. Quem está começando ou voltando a treinar consegue fazer as duas coisas ao mesmo tempo comendo perto da manutenção, com proteína alta e treino de força.',
      ganhar: 'Para ganhar músculo o corpo precisa de um pouco de sobra de energia. O superávit é leve para que a maior parte do ganho seja músculo, não gordura.'
    }[p.objetivo];
    const sono = CasosRotina.menorSono();
    const txtSono = sono < 7
      ? `O que mais ameaça o plano é o sono, não a dieta. Com a rotina atual, algumas noites ficam com ${decimal(sono)}h. Dormindo menos de 7h o corpo constrói menos músculo, a fome por lanche aumenta e o treino rende menos. Se der, adiante o horário de dormir no Perfil.`
      : `O sono está protegido: a rotina atual garante pelo menos ${decimal(sono)}h por noite. Mantenha o horário de dormir fixo, inclusive no fim de semana.`;
    return [`Seu IMC é ${decimal(imc)}, ${faixa}. ${objetivo}`, txtSono];
  },

  expectativas(p) {
    const kg = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return {
      perder: [
        `Peso entre ${kg(p.peso * 0.92)} e ${kg(p.peso * 0.95)} kg ao fim das 12 semanas, perdendo cerca de 0,5% por semana.`,
        'Cintura 4 a 8 cm menor.',
        'Força mantida ou subindo: sinal de que o músculo está sendo preservado.',
        'Fome maior nas primeiras 2 semanas, depois o corpo se acostuma.'
      ],
      recompor: [
        `Balança quase parada, entre ${kg(p.peso - 1)} e ${kg(p.peso + 1)} kg. Isso é o plano funcionando.`,
        'Cintura 2 a 4 cm menor e roupa mais folgada na barriga.',
        'Cargas subindo quase toda semana no primeiro mês.',
        'Ganho de músculo visível a partir da 6ª a 8ª semana.'
      ],
      ganhar: [
        `Peso entre ${kg(p.peso + 1)} e ${kg(p.peso + 3)} kg, ganhando no máximo 0,25 a 0,5 kg por semana.`,
        'Cintura praticamente igual. Se crescer mais de 2 cm, reduza um pouco as calorias.',
        'Cargas subindo toda semana.',
        'Braços, peito e coxas visivelmente maiores a partir da 6ª a 8ª semana.'
      ]
    }[p.objetivo];
  }
};
