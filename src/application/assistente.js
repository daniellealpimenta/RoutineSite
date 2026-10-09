// Casos de uso do assistente: conversar e gerar novas versões da dieta e do treino.
// Toda chamada leva o contexto atualizado da pessoa (perfil, metas, rotina e plano atual).
const CasosAssistente = {
  mensagens: ConversaRepositorio.carregar(), // [{ role: 'user'|'assistant', content }]
  HISTORICO: 12, // quantas mensagens anteriores vão em cada pedido (o modelo não lembra sozinho)
  ativo: false,

  async verificar() {
    this.ativo = await AssistenteApi.disponivel();
    return this.ativo;
  },

  sistema() {
    const contexto = Assistente.contexto({
      perfil: CasosPerfil.atual(),
      calculo: CasosMeta.calculo(),
      semana: CasosRotina.semana(),
      refeicoes: CasosPlano.refeicoes(),
      fichas: CasosPlano.fichas()
    });
    return { role: 'system', content: PROMPT_SISTEMA + '\n\n' + contexto };
  },

  async enviar(texto, aoReceber, sinal) {
    this.mensagens.push({ role: 'user', content: texto });
    ConversaRepositorio.salvar(this.mensagens);
    const msgs = [this.sistema(), ...this.mensagens.slice(-this.HISTORICO)];
    try {
      const resposta = await AssistenteApi.conversar(msgs, { tipo: 'chat', aoReceber, sinal });
      if (!resposta) throw new Error('O assistente não respondeu. Tente de novo.');
      this.mensagens.push({ role: 'assistant', content: resposta });
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

  limpar() {
    this.mensagens = [];
    ConversaRepositorio.salvar(this.mensagens);
  }
};
