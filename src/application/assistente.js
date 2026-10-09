// Casos de uso do assistente: conversar, gerar novas versões da dieta e do treino
// e aplicar (ou ignorar) as mudanças que ele sugere na conversa.
// Toda chamada leva o contexto atualizado da pessoa (perfil, restrições, metas, rotina e plano atual).
const CasosAssistente = {
  mensagens: ConversaRepositorio.carregar(), // [{ role: 'user'|'assistant', content, acoes? }]
  ouvintes: [],
  HISTORICO: 12, // quantas mensagens anteriores vão em cada pedido (o modelo não lembra sozinho)
  ativo: false,

  async verificar() {
    this.ativo = await AssistenteApi.disponivel();
    return this.ativo;
  },

  aoMudar(fn) { this.ouvintes.push(fn); },
  avisar() { ConversaRepositorio.salvar(this.mensagens); this.ouvintes.forEach(fn => fn()); },

  // comAcoes = true na conversa (o modelo pode sugerir mudanças); false ao gerar planos em JSON
  sistema(comAcoes = false) {
    const contexto = Assistente.contexto({
      perfil: CasosPerfil.atual(),
      calculo: CasosMeta.calculo(),
      semana: CasosRotina.semana(),
      refeicoes: CasosPlano.refeicoes(),
      fichas: CasosPlano.fichas()
    });
    return { role: 'system', content: PROMPT_SISTEMA + (comAcoes ? '\n\n' + PROMPT_ACOES : '') + '\n\n' + contexto };
  },

  // Histórico no formato da API. As sugestões vão resumidas, com o que a pessoa decidiu.
  historico() {
    return this.mensagens.slice(-this.HISTORICO).map(m => ({
      role: m.role,
      content: m.acoes?.length ? `${m.content}\n\n[Sugestões feitas]\n${Acoes.resumo(m.acoes)}` : m.content
    }));
  },

  async enviar(texto, aoReceber, sinal) {
    this.mensagens.push({ role: 'user', content: texto });
    ConversaRepositorio.salvar(this.mensagens);
    const msgs = [this.sistema(true), ...this.historico()];
    // durante o stream, a tela mostra só o texto (o bloco de ações fica escondido)
    const mostrar = ({ texto: t, pensando }) => aoReceber({ texto: Acoes.extrair(t).texto, pensando });
    try {
      const resposta = await AssistenteApi.conversar(msgs, { tipo: 'chat', aoReceber: mostrar, sinal });
      if (!resposta) throw new Error('O assistente não respondeu. Tente de novo.');
      const { texto: limpo, brutas } = Acoes.extrair(resposta);
      const acoes = Acoes.validar(brutas, { fichas: CasosPlano.fichas(), refeicoes: CasosPlano.refeicoes(), perfil: CasosPerfil.atual() });
      this.mensagens.push({ role: 'assistant', content: limpo || 'Tenho uma sugestão pra você:', ...(acoes.length ? { acoes } : {}) });
    } catch (e) {
      this.mensagens.pop(); // não deixa pergunta sem resposta no histórico
      throw e;
    } finally {
      ConversaRepositorio.salvar(this.mensagens);
    }
  },

  // Pede um plano em JSON, valida e aplica. Deixa um registro curto na conversa.
  async gerar(tipo, pedidoExtra, aoReceber, sinal) {
    const pedido = tipo === 'dieta'
      ? Assistente.pedidoDieta(CasosMeta.atual(), pedidoExtra)
      : Assistente.pedidoTreino(pedidoExtra);
    const resposta = await AssistenteApi.conversar([this.sistema(), { role: 'user', content: pedido }], { tipo: 'plano', aoReceber, sinal });
    const obj = Assistente.extrairJson(resposta);
    if (tipo === 'dieta') CasosPlano.definirDieta(Assistente.validarDieta(obj));
    else CasosPlano.definirTreino(Assistente.validarTreino(obj));

    const extra = pedidoExtra ? ` (pedido: "${pedidoExtra}")` : '';
    this.mensagens.push(
      { role: 'user', content: `Gere ${tipo === 'dieta' ? 'um novo cardápio' : 'novas fichas de treino'} para mim${extra}.` },
      { role: 'assistant', content: `Pronto: ${tipo === 'dieta' ? 'o novo cardápio já está na aba Dieta' : 'as novas fichas já estão na aba Treino'}.` }
    );
    ConversaRepositorio.salvar(this.mensagens);
  },

  // Aplica uma sugestão do assistente. Valida de novo contra o plano atual (pode ter mudado).
  async aplicar(iMsg, iAcao) {
    const acao = this.mensagens[iMsg]?.acoes?.[iAcao];
    if (!acao || acao.estado !== 'pendente') return;
    acao.estado = 'aplicando';
    this.avisar();
    try {
      const p = CasosPerfil.atual();
      switch (acao.tipo) {
        case 'trocar_exercicio': case 'remover_exercicio': case 'adicionar_exercicio':
          CasosPlano.editarTreino(Acoes.aplicarTreino(CasosPlano.fichas(), acao), acao.ficha);
          break;
        case 'trocar_refeicao':
          CasosPlano.editarDieta(Acoes.aplicarDieta(CasosPlano.refeicoes(), acao));
          break;
        case 'salvar_restricao':
          CasosPerfil.atualizar({ restricoes: [...p.restricoes, { area: acao.area, texto: acao.texto }] });
          break;
        case 'atualizar_perfil':
          CasosPerfil.atualizar({ [acao.campo]: acao.valor });
          break;
        case 'regenerar':
          await this.gerar(acao.alvo, acao.pedido);
          break;
      }
      acao.estado = 'aplicada';
    } catch (e) {
      acao.estado = 'erro';
      acao.erro = e.message;
    }
    this.avisar();
  },

  ignorar(iMsg, iAcao) {
    const acao = this.mensagens[iMsg]?.acoes?.[iAcao];
    if (acao?.estado === 'pendente') { acao.estado = 'ignorada'; this.avisar(); }
  },

  async aplicarTodas(iMsg) {
    const acoes = this.mensagens[iMsg]?.acoes || [];
    for (let i = 0; i < acoes.length; i++) if (acoes[i].estado === 'pendente') await this.aplicar(iMsg, i);
  },

  limpar() {
    this.mensagens = [];
    ConversaRepositorio.salvar(this.mensagens);
  }
};
