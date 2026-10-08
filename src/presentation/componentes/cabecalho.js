// Cabeçalho e números-chave do topo, preenchidos a partir do perfil e da meta
const Cabecalho = {
  render() {
    const p = CasosPerfil.atual(), r = CasosMeta.calculo(), obj = OBJETIVOS[p.objetivo];
    const titulo = p.nome ? 'Plano de ' + p.nome : 'Seu plano';
    document.title = titulo;
    $('h-titulo').textContent = titulo;
    $('h-label').textContent = 'Plano de 12 semanas · ' + obj.resumo;
    const horas = `${fmtHora(p.inicioAtividades)} às ${fmtHora(p.fimAtividades)}`;
    $('h-who').textContent = `${p.idade} anos · ${p.peso.toLocaleString('pt-BR')} kg · ${(p.altura / 100).toFixed(2).replace('.', ',')} m · ocupado das ${horas}`;
    $('k-bmr').textContent = fmt(r.bmr);
    $('k-goal').textContent = fmt(r.meta.kcal);
    $('k-prot').textContent = r.meta.p + ' g';
    $('k-treinos').textContent = p.diasTreino.length + '×';
  }
};
