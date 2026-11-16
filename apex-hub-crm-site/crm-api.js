/* Apex Hub CRM · conexão com o Supabase (ou modo prévia com dados de exemplo quando config.js está vazio) */
(function () {
  const CFG = window.ATLAS_CRM_CONFIG || {};
  const REAL = !!(CFG.supabaseUrl && CFG.supabaseAnon);
  const SB_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  let sb = null;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const agoraISO = () => new Date().toISOString();
  const local = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: (k) => { try { localStorage.removeItem(k); } catch {} } };

  function carregarScript(src) { return new Promise((ok, falha) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => falha(new Error('sem_conexao')); document.head.appendChild(s); }); }
  async function cliente() {
    if (!REAL) return null; if (sb) return sb;
    if (!window.supabase) await carregarScript(SB_JS);
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnon, { auth: { persistSession: true, storageKey: 'apexhub-crm-sessao' } });
    return sb;
  }
  const MSG = {
    sem_conexao: 'Sem conexão. Confira a internet e tente de novo.', sem_acesso: 'Esta conta não tem acesso ao CRM da Apex Hub.',
    login_invalido: 'E-mail ou senha incorretos.', responsavel_invalido: 'Escolha um responsável válido.', sem_permissao: 'Você não tem permissão para isso.',
    conta_sem_envio: 'Essa conta ainda não está ligada para enviar pelo CRM (veja o LEIA-ME).', limite_diario: 'Limite de segurança de 80 e-mails por dia nesta conta atingido. Continue amanhã.',
    limite_gmail: 'O Gmail atingiu o limite de envios de hoje. Tente amanhã.', gmail_indisponivel: 'Não consegui falar com o Gmail agora. Tente de novo em instantes.', falha_envio: 'O Gmail não aceitou o envio. Confira o e-mail do destinatário.',
    para_invalido: 'Confira o e-mail do destinatário.', assunto_obrigatorio: 'Coloque um assunto.', conversa_nao_encontrada: 'Essa conversa não foi encontrada no Gmail.', corpo_invalido: 'Escreva a mensagem.',
    senha_mestra_errada: 'Senha-mestra errada.', push_sem_suporte: 'Este navegador não recebe notificações. No iPhone, primeiro adicione o CRM à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá.',
    push_negado: 'As notificações foram bloqueadas. Libere nas configurações do navegador para este site.', push_indisponivel: 'O servidor de notificações ainda não está pronto. Tente de novo em 1 minuto.',
    ia_nao_configurada: 'A IA ainda não foi ligada: falta a chave da Anthropic nos segredos do Supabase (LEIA-ME).', ia_chave_invalida: 'A chave da IA está inválida. Confira nos segredos do Supabase.', ia_limite: 'A IA atingiu o limite de uso. Tente daqui a pouco.', ia_indisponivel: 'A IA não respondeu agora. Tente de novo.',
    arquivo_grande: 'Arquivo maior que 50 MB. Diminua o vídeo e tente de novo.', pasta_ciclo: 'Uma pasta não pode ficar dentro dela mesma.',
    login_necessario: 'Entre na sua conta para continuar.', email_nao_confirmado: 'Confirme o seu e-mail antes de entrar.',
  };
  function codigo(e) {
    const m = String(e?.message || e || '');
    for (const k of Object.keys(MSG)) if (m.includes(k)) return k;
    if (/invalid login credentials/i.test(m)) return 'login_invalido';
    if (/email not confirmed/i.test(m)) return 'email_nao_confirmado';
    if (/failed to fetch|network/i.test(m)) return 'sem_conexao';
    if (/row-level security|permission denied/i.test(m)) return 'sem_permissao';
    return '';
  }
  const mensagem = (e) => MSG[codigo(e)] || 'Algo deu errado. Tente de novo.';
  const falhar = (c) => { throw new Error(c); };

  // ================= modo prévia (dados de exemplo) =================
  const DEMO = 'apexhub-crm-demo';
  function semente() {
    const d = (n) => new Date(Date.now() - n * 864e5).toISOString(), dia = (n) => { const x = new Date(Date.now() + n * 864e5); return new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
    const C = (o) => ({ id: uid(), unidade: 'apex-hub', tipo: 'lead', interesses: [], tags: [], utm: {}, etapa: 'novo', moeda: 'BRL', arquivado: false, origem: 'formulario', criado_em: d(1), atualizado_em: d(1), ...o });
    const contatos = [
      C({ nome: 'Exemplo · Ana Prado', empresa: 'Studio Ana Nails', nicho: 'Salão de beleza', cidade: 'Itajaí', pais: 'Brasil', instagram: 'studio.ana.exemplo', telefone: '+5547900000001', email: 'ana@exemplo.com', idioma: 'pt-BR', interesses: ['site', 'sistema'], mensagem: 'Quero agendamento online.', contato_preferido: 'whatsapp', utm: { utm_source: 'instagram' }, criado_em: d(0.1), atualizado_em: d(0.1) }),
      C({ nome: 'Exemplo · João Lima', empresa: 'Lima Pizzaria', nicho: 'Pizzaria', cidade: 'Camboriú', pais: 'Brasil', telefone: '+5547900000002', idioma: 'pt-BR', interesses: ['cardapio'], etapa: 'em_contato', responsavel: 'enrico', proximo_contato: dia(0), criado_em: d(2), atualizado_em: d(1) }),
      C({ nome: 'Exemplo · Rita Sousa', empresa: 'Pastelaria Sousa', nicho: 'Pastelaria', cidade: 'Porto', pais: 'Portugal', email: 'rita@exemplo.pt', idioma: 'pt-PT', interesses: ['site'], etapa: 'proposta', valor: 450, moeda: 'EUR', responsavel: 'enrico', origem: 'email', criado_em: d(6), atualizado_em: d(2) }),
      C({ nome: 'Exemplo · Mike Brown', empresa: 'Brown Auto Repair', nicho: 'Auto repair', cidade: 'Orlando', pais: 'Estados Unidos', email: 'mike@example.com', idioma: 'en', interesses: ['site'], etapa: 'negociacao', valor: 900, moeda: 'USD', responsavel: 'enrico', origem: 'email', criado_em: d(9), atualizado_em: d(3) }),
      C({ nome: 'Exemplo · Carla Dias', empresa: 'Academia Força', nicho: 'Academia', cidade: 'Balneário Camboriú', pais: 'Brasil', telefone: '+5547900000005', interesses: ['site', 'social'], etapa: 'fechado', tipo: 'cliente', valor: 1800, responsavel: 'enrico', origem: 'instagram', criado_em: d(20), atualizado_em: d(5) }),
      C({ nome: 'Exemplo · Lucas Mendes', empresa: 'Mendes Contabilidade', nicho: 'Contabilidade', cidade: 'Florianópolis', pais: 'Brasil', email: 'lucas@exemplo.com', interesses: ['site'], etapa: 'perdido', motivo_perda: 'Achou caro agora', origem: 'manual', criado_em: d(30), atualizado_em: d(10) }),
      C({ nome: 'Exemplo · Pizzaria Nova', empresa: 'Pizzaria Nova', unidade: 'apex-hub', nicho: 'Pizzaria', cidade: 'Joinville', email: 'contato@pizzarianova.exemplo', interesses: ['sistema'], etapa: 'em_contato', origem: 'email', criado_em: d(1.5), atualizado_em: d(1) }),
    ];
    const atividades = [];
    contatos.forEach((c) => atividades.push({ id: uid(), contato_id: c.id, tipo: c.origem === 'formulario' ? 'formulario' : 'sistema', texto: c.origem === 'formulario' ? 'Formulário · quer: ' + c.interesses.join(', ') + (c.mensagem ? '\n' + c.mensagem : '') : 'Contato criado', autor: null, criado_em: c.criado_em }));
    const T = (o) => ({ id: uid(), status: 'aberta', prioridade: 'normal', checklist: [], criado_por: 'enrico', criado_em: d(1), atualizado_em: d(1), ordem: Date.now(), ...o });
    const tarefas = [
      T({ titulo: 'Ligar para a Lima Pizzaria', responsavel: 'enrico', prazo: dia(0), prioridade: 'alta', contato_id: contatos[1].id }),
      T({ titulo: 'Mandar proposta para a Pastelaria Sousa', responsavel: 'enrico', prazo: dia(1), contato_id: contatos[2].id, criado_por: 'enrico' }),
      T({ titulo: 'Gravar reel de exemplo para a Apex Hub', responsavel: 'enrico', prazo: dia(2), checklist: [{ t: 'Roteiro', f: true }, { t: 'Gravação', f: false }, { t: 'Edição', f: false }] }),
      T({ titulo: 'Revisar textos do site da Academia Força', responsavel: 'enrico', prazo: dia(-1), contato_id: contatos[4].id }),
      T({ titulo: 'Responder e-mail da Pizzaria Nova', responsavel: 'enrico', unidade: 'apex-hub', contato_id: contatos[6].id }),
      T({ titulo: 'Publicar o site da Academia Força', responsavel: 'enrico', status: 'feita', concluida_por: 'enrico', concluida_em: d(1), contato_id: contatos[4].id }),
    ];
    const projetos = [
      { id: uid(), nome: 'Site · Academia Força (exemplo)', unidade: 'apex-hub', contato_id: contatos[4].id, tipo: 'site', status: 'publicado', valor: 1800, moeda: 'BRL', responsavel: 'enrico', link_publicado: '', criado_em: d(18), atualizado_em: d(5) },
      { id: uid(), nome: 'Website · Pastelaria Sousa (exemplo)', unidade: 'apex-hub', contato_id: contatos[2].id, tipo: 'site', status: 'briefing', valor: 450, moeda: 'EUR', responsavel: 'enrico', prazo: dia(10), criado_em: d(2), atualizado_em: d(2) },
      { id: uid(), nome: 'Ortoo · lançamento', unidade: 'apex-hub', tipo: 'sistema', status: 'producao', responsavel: 'enrico', criado_em: d(25), atualizado_em: d(1) },
    ];
    const em = (o) => ({ id: uid(), conta: 'apex', unidade: 'apex-hub', message_id: uid(), lido: false, ...o });
    const emails = [
      em({ thread_id: 't1', direcao: 'enviado', de: 'contato@apexhub.exemplo', para: 'rita@exemplo.pt', assunto: 'Website para a sua pastelaria', trecho: 'Olá Rita, vi que a pastelaria ainda não tem website…', data: d(7), contato_id: contatos[2].id, lido: true }),
      em({ thread_id: 't1', direcao: 'recebido', de: 'Rita Sousa <rita@exemplo.pt>', de_nome: 'Rita Sousa', para: 'contato@apexhub.exemplo', assunto: 'Re: Website para a sua pastelaria', trecho: 'Olá! Tenho interesse, quanto custa?', corpo: 'Olá! Tenho interesse, quanto custa?\n\nRita', data: d(6), contato_id: contatos[2].id }),
      em({ thread_id: 't2', direcao: 'recebido', de: 'Mike Brown <mike@example.com>', de_nome: 'Mike Brown', para: 'contato@apexhub.exemplo', assunto: 'Re: A website for Brown Auto Repair', trecho: 'Sounds good, can we talk Monday?', corpo: 'Sounds good, can we talk Monday?\n\nMike', data: d(3), contato_id: contatos[3].id }),
      em({ thread_id: 't3', conta: 'ortoo', unidade: 'apex-hub', direcao: 'recebido', de: 'Pizzaria Nova <contato@pizzarianova.exemplo>', de_nome: 'Pizzaria Nova', assunto: 'Dúvida sobre os planos', trecho: 'O plano anual tem desconto?', corpo: 'Boa tarde! O plano anual tem desconto?', data: d(1), contato_id: contatos[6].id }),
    ];
    emails.forEach((e) => e.contato_id && atividades.push({ id: uid(), contato_id: e.contato_id, tipo: 'email', texto: (e.direcao === 'recebido' ? 'E-mail recebido: ' : 'E-mail enviado: ') + e.assunto, criado_em: e.data, dados: { email_id: e.id } }));
    return {
      eu: 'enrico',
      equipe: [{ apelido: 'enrico', nome: 'Enrico', email: 'enrico@exemplo.com', cor: '#5b8bc4', ativo: true }],
      unidades: [{ id: 'apex-hub', nome: 'Apex Hub', cor: '#5b8bc4', ordem: 1, ativo: true }, { id: 'pessoal', nome: 'Pessoal', cor: '#9aa4b2', ordem: 2, ativo: true }],
      objetivos: [
        { id: 'ob-1', titulo: 'Exemplo · Fechar os 10 primeiros clientes', descricao: 'Base para contratar ajuda e crescer a Apex Hub', prazo: dia(60), feito: false, criado_em: d(3), atualizado_em: d(3) },
        { id: 'ob-2', titulo: 'Exemplo · Notebook novo', descricao: 'Trabalhar melhor de qualquer lugar', prazo: dia(95), feito: false, criado_em: d(5), atualizado_em: d(5) },
        { id: 'ob-3', titulo: 'Exemplo · Abrir o CNPJ', descricao: 'Tudo no nome da empresa', prazo: dia(-2), feito: true, feito_em: d(2), criado_em: d(20), atualizado_em: d(2) }],
      planos: [
        { id: 'pl-1', nome: 'Exemplo · Lançamento da LeadScope 2.0', status: 'futuro', unidade: 'apex-hub', responsavel: 'enrico', data_inicio: dia(20), descricao: 'Nova versão com filtros por país.', ideias: 'Teste grátis de 7 dias\nVídeo de demonstração', passos: [{ t: 'Listar o que muda', f: true }, { t: 'Desenhar as telas', f: false }, { t: 'Definir preço', f: false }], criado_por: 'enrico', criado_em: d(3), atualizado_em: d(3), ordem: 1 },
        { id: 'pl-2', nome: 'Exemplo · Ortoo para restaurantes', status: 'rodando', unidade: 'apex-hub', responsavel: 'enrico', data_inicio: dia(-15), descricao: 'Primeiros clientes pagantes.', passos: [{ t: 'Publicar o site', f: true }, { t: 'Fechar 5 clientes', f: false }], criado_por: 'enrico', criado_em: d(20), atualizado_em: d(1), ordem: 2 },
        { id: 'pl-3', nome: 'Exemplo · Canal de vídeos curtos', status: 'ideia', unidade: 'apex-hub', ideias: 'Cortes de bastidores dos sites', passos: [], criado_por: 'enrico', criado_em: d(2), atualizado_em: d(2), ordem: 3 }],
      lembretes: [
        { id: 'lb-1', titulo: 'Exemplo · Ligar para a Pastelaria Sousa', nota: 'Confirmar se recebeu a proposta', quando: new Date(Date.now() + 3 * 36e5).toISOString(), para: 'enrico', repetir: 'nao', feito: false, criado_por: 'enrico', criado_em: d(1), atualizado_em: d(1) },
        { id: 'lb-2', titulo: 'Exemplo · Postar os stories do dia', quando: new Date(Date.now() + 26 * 36e5).toISOString(), para: 'enrico', repetir: 'diario', feito: false, criado_por: 'enrico', criado_em: d(1), atualizado_em: d(1) }],
      planilhas: [{ id: 'ph-1', nome: 'Exemplo · Contas de redes sociais', descricao: 'Logins das páginas (exemplo)', colunas: [{ id: 'c1', nome: 'Conta', tipo: 'texto' }, { id: 'c2', nome: 'E-mail', tipo: 'email' }, { id: 'c3', nome: 'Link', tipo: 'link' }, { id: 'c4', nome: 'Observação', tipo: 'nota' }], cofre: null, criado_por: 'enrico', criado_em: d(2), atualizado_em: d(2) }],
      planilha_linhas: [
        { id: 'pr-1', planilha_id: 'ph-1', valores: { c1: 'Instagram Apex Hub', c2: 'exemplo@apexhub.com', c3: 'https://instagram.com/apexhub', c4: 'Conta principal' }, ordem: 1 },
        { id: 'pr-2', planilha_id: 'ph-1', valores: { c1: 'TikTok', c2: 'exemplo2@apexhub.com', c3: '', c4: '' }, ordem: 2 }],
      modelos: [{ id: 'mod-1', titulo: 'Pedir mais detalhes', idioma: 'pt-BR', corpo: 'Olá, {nome}! Tudo bem?\n\nObrigado pelo retorno. Para montar a melhor proposta para a {empresa}, você pode me contar um pouco mais sobre o que precisa (site, cardápio digital ou sistema) e se já tem logo e fotos?\n\nFico no aguardo.', ordem: 1 },
        { id: 'mod-2', titulo: 'Marcar uma conversa', idioma: 'pt-BR', corpo: 'Olá, {nome}!\n\nQue bom que gostou da ideia. Podemos marcar uma conversa rápida por WhatsApp ou chamada de vídeo? Me diga o melhor dia e horário para você.\n\nAbraço!', ordem: 2 },
        { id: 'mod-3', titulo: 'Ask for details (English)', idioma: 'en', corpo: 'Hi {nome}, thanks for getting back to me!\n\nTo put together the best proposal for {empresa}, could you tell me a bit more about what you need (website, digital menu or custom system) and whether you already have a logo and photos?\n\nLooking forward to hearing from you.', ordem: 3 }],
      pastas: [{ id: 'pasta-exemplo', nome: 'Stories da semana (exemplo)', unidade: 'apex-hub', status: 'pendente', descricao: 'Exemplo: posto pelo celular e marco ✔', criado_por: 'enrico', criado_em: d(1), atualizado_em: d(1) }, { id: 'pasta-exemplo-2', nome: 'Materiais da Academia Força (exemplo)', unidade: 'apex-hub', projeto_id: projetos[0].id, status: 'feito', feito_por: 'enrico', feito_em: d(3), criado_por: 'enrico', criado_em: d(10), atualizado_em: d(3) }],
      arquivos: [['Story 01 · segunda', '#0f766e', 'feito'], ['Story 02 · terça', '#1d4ed8', 'feito'], ['Story 03 · quarta', '#7c3aed', 'pendente'], ['Story 04 · quinta', '#be123c', 'pendente'], ['Story 05 · sexta', '#b45309', 'duvida']].map(([n, cor, st], i) => ({ id: 'arq-ex-' + i, pasta_id: 'pasta-exemplo', nome: n.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png', caminho: 'demo/' + i, tipo: 'image/png', tamanho: 40000, status: st, nota: st === 'duvida' ? 'Confirmar o horário com o cliente antes de postar' : null, feito_por: st === 'feito' ? 'enrico' : null, feito_em: st === 'feito' ? d(1 - i * 0.2) : null, criado_por: 'enrico', criado_em: d(1), atualizado_em: d(1), demo: { texto: n, cor } })),
      contatos, atividades, tarefas, tarefa_historico: tarefas.map((t) => ({ id: uid(), tarefa_id: t.id, acao: 'criou', para: t.responsavel, autor: t.criado_por, em: t.criado_em })), projetos, emails,
    };
  }
  // guarda em memória também: se o navegador bloquear o armazenamento (prévias, aba anônima), a prévia continua funcionando
  let memoria = null;
  function finDemo() { const dia = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }; const ag = agoraISO();
    return [
      { id: 'fi-1', nome: 'Exemplo · Domínio rotastudioai.com', categoria: 'assinatura', valor: 59.99, moeda: 'BRL', vencimento: dia(2), recorrencia: 'anual', avisar_dias: 7, forma: 'Cartão', ativo: true, criado_por: 'enrico', criado_em: ag, atualizado_em: ag },
      { id: 'fi-2', nome: 'Exemplo · Ferramenta de design', categoria: 'ferramenta', valor: 20, moeda: 'USD', vencimento: dia(12), recorrencia: 'mensal', avisar_dias: 3, forma: 'Cartão', ativo: true, criado_por: 'enrico', criado_em: ag, atualizado_em: ag },
      { id: 'fi-3', nome: 'Exemplo · Internet', categoria: 'conta', valor: 120, moeda: 'BRL', vencimento: dia(-1), recorrencia: 'mensal', avisar_dias: 3, forma: 'Pix', ativo: true, criado_por: 'enrico', criado_em: ag, atualizado_em: ag }]; }
  function demo() { if (memoria) return memoria; let d = null; try { d = JSON.parse(local.get(DEMO) || 'null'); } catch {} if (!d) { d = semente(); local.set(DEMO, JSON.stringify(d)); } d.pastas = d.pastas || []; d.arquivos = d.arquivos || []; d.objetivos = d.objetivos || []; if (!d.financeiro) d.financeiro = finDemo(); if (!d.modelos) d.modelos = semente().modelos; if (!d.planos) { const sm = semente(); Object.assign(d, { planos: sm.planos, lembretes: sm.lembretes, planilhas: sm.planilhas, planilha_linhas: sm.planilha_linhas }); } return (memoria = d); }
  const salvarDemo = (d) => { memoria = d; local.set(DEMO, JSON.stringify(d)); };
  const ROT = { novo: 'Novo', em_contato: 'Em contato', proposta: 'Proposta enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };

  // regras que no banco real são feitas pelos gatilhos (histórico, conclusão)
  function regrasDemo(d, tabela, antes, depois) {
    const eu = d.eu, agora = agoraISO();
    if (tabela === 'contatos') {
      if (!antes) { if (!['formulario', 'email'].includes(depois.origem)) d.atividades.push({ id: uid(), contato_id: depois.id, tipo: 'sistema', texto: 'Contato criado', autor: eu, criado_em: agora }); }
      else {
        if (antes.etapa !== depois.etapa) { d.atividades.push({ id: uid(), contato_id: depois.id, tipo: 'etapa', texto: `Etapa: ${ROT[antes.etapa]} → ${ROT[depois.etapa]}`, autor: eu, criado_em: agora }); if (depois.etapa === 'fechado' && depois.tipo === 'lead') depois.tipo = 'cliente'; }
        if ((antes.responsavel || null) !== (depois.responsavel || null)) d.atividades.push({ id: uid(), contato_id: depois.id, tipo: 'sistema', texto: `Responsável: ${antes.responsavel || 'ninguém'} → ${depois.responsavel || 'ninguém'}`, autor: eu, criado_em: agora });
      }
      depois.atualizado_em = agora;
    }
    if (tabela === 'tarefas') {
      if (!antes) depois.criado_por = eu;
      if (depois.status === 'feita' && (!antes || antes.status !== 'feita')) { depois.concluida_por = eu; depois.concluida_em = agora; }
      if (depois.status !== 'feita') { depois.concluida_por = null; depois.concluida_em = null; }
      depois.atualizado_em = agora;
      const h = (acao, de, para) => d.tarefa_historico.push({ id: uid(), tarefa_id: depois.id, acao, de, para, autor: eu, em: agora });
      if (!antes) { h('criou', null, depois.responsavel); if (depois.contato_id) d.atividades.push({ id: uid(), contato_id: depois.contato_id, tipo: 'tarefa', texto: 'Tarefa criada: ' + depois.titulo, autor: eu, criado_em: agora }); }
      else {
        if (antes.responsavel !== depois.responsavel) h('passou', antes.responsavel, depois.responsavel);
        if (antes.status !== depois.status) { h(depois.status === 'feita' ? 'concluiu' : antes.status === 'feita' ? 'reabriu' : 'status', antes.status, depois.status); if (depois.status === 'feita' && depois.contato_id) d.atividades.push({ id: uid(), contato_id: depois.contato_id, tipo: 'tarefa', texto: 'Tarefa concluída: ' + depois.titulo, autor: eu, criado_em: agora }); }
      }
    }
    if (tabela === 'projetos') depois.atualizado_em = agora;
    if (['planos', 'lembretes', 'planilhas', 'planilha_linhas', 'financeiro'].includes(tabela)) { if (!antes) depois.criado_por = eu; depois.atualizado_em = agora; if (tabela === 'lembretes' && antes && antes.quando !== depois.quando) depois.enviado_em = null; }
    if (tabela === 'pastas' || tabela === 'arquivos') {
      if (!antes) { depois.criado_por = eu; depois.status = depois.status || 'pendente'; }
      if (depois.status === 'feito' && (!antes || antes.status !== 'feito')) { depois.feito_por = eu; depois.feito_em = agora; }
      if (depois.status !== 'feito') { depois.feito_por = null; depois.feito_em = null; }
      depois.atualizado_em = agora;
    }
    if (tabela === 'atividades') depois.autor = eu;
  }

  // ================= sessão =================
  async function sessao() {
    if (!REAL) return { user: { email: 'enrico@exemplo.com' } };
    const c = await cliente(); return (await c.auth.getSession()).data.session;
  }
  async function entrar(email, senha) {
    if (!REAL) { await espera(300); return; }
    const c = await cliente(); const { error } = await c.auth.signInWithPassword({ email, password: senha }); if (error) throw error;
    const { data, error: e2 } = await c.rpc('eu'); if (e2) throw e2;
    if (!data) { await c.auth.signOut(); falhar('sem_acesso'); }
  }
  async function sair() { if (REAL) { const c = await cliente(); await c.auth.signOut(); } }
  async function recuperar(email) { if (!REAL) { await espera(300); return; } const c = await cliente(); const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + '?nova=1' }); if (error) throw error; }
  async function novaSenha(s) { if (!REAL) return; const c = await cliente(); const { error } = await c.auth.updateUser({ password: s }); if (error) throw error; }

  // ================= dados =================
  const TABELAS = ['equipe', 'unidades', 'contatos', 'tarefas', 'projetos', 'emails', 'pastas', 'arquivos', 'modelos', 'planos', 'lembretes', 'planilhas', 'objetivos', 'financeiro'];
  async function carregar() {
    if (!REAL) { await espera(150); const d = demo(); return { eu: d.eu, equipe: d.equipe, unidades: d.unidades, contatos: d.contatos, tarefas: d.tarefas, projetos: d.projetos, emails: d.emails.slice().sort((a, b) => (a.data < b.data ? 1 : -1)), pastas: d.pastas || [], arquivos: d.arquivos || [], modelos: d.modelos || [], planos: d.planos || [], lembretes: d.lembretes || [], planilhas: d.planilhas || [], objetivos: d.objetivos || [], financeiro: d.financeiro || [] }; }
    const c = await cliente();
    const { data: eu, error: e0 } = await c.rpc('eu'); if (e0) throw e0; if (!eu) falhar('sem_acesso');
    const pedidos = await Promise.all([
      c.from('equipe').select('*').order('nome'), c.from('unidades').select('*').order('ordem'),
      c.from('contatos').select('*').order('atualizado_em', { ascending: false }).limit(5000),
      c.from('tarefas').select('*').order('ordem', { ascending: true }).limit(5000),
      c.from('projetos').select('*').order('atualizado_em', { ascending: false }).limit(2000),
      c.from('emails').select('id,conta,unidade,message_id,thread_id,direcao,de,de_nome,para,assunto,trecho,data,contato_id,lido,enviado_por').order('data', { ascending: false }).limit(800),
      c.from('pastas').select('*').order('nome').limit(2000), c.from('arquivos').select('*').order('nome').limit(10000),
      c.from('modelos').select('*').order('ordem').limit(200),
      c.from('planos').select('*').order('ordem').limit(500),
      c.from('lembretes').select('*').order('quando').limit(1000),
      c.from('planilhas').select('*').order('nome').limit(300),
      c.from('objetivos').select('*').order('prazo').limit(500),
      c.from('financeiro').select('*').order('vencimento').limit(1000),
    ]);
    const out = { eu };
    const novas = ['planos', 'lembretes', 'planilhas', 'objetivos', 'financeiro']; // se o banco ainda não foi atualizado, o resto do CRM continua funcionando
    pedidos.forEach((r, i) => { if (r.error) { if (novas.includes(TABELAS[i])) { console.warn('tabela ainda não criada:', TABELAS[i]); out[TABELAS[i]] = []; return; } throw r.error; } out[TABELAS[i]] = r.data || []; });
    return out;
  }
  async function salvar(tabela, row) {
    const novo = !row.id;
    if (!REAL) {
      await espera(80); const d = demo(); const lista = d[tabela];
      if (novo) { const r = { id: uid(), criado_em: agoraISO(), atualizado_em: agoraISO(), ...(tabela === 'contatos' ? { tipo: 'lead', etapa: 'novo', origem: 'manual', interesses: [], tags: [], utm: {}, moeda: 'BRL', arquivado: false, unidade: 'apex-hub' } : {}), ...(tabela === 'tarefas' ? { status: 'aberta', prioridade: 'normal', checklist: [], ordem: Date.now(), responsavel: 'ambos' } : {}), ...(tabela === 'projetos' ? { status: 'briefing', tipo: 'site', moeda: 'BRL', unidade: 'apex-hub' } : {}), ...row };
        if (r.responsavel && r.responsavel !== 'ambos' && !d.equipe.some((e) => e.apelido === r.responsavel)) falhar('responsavel_invalido');
        regrasDemo(d, tabela, null, r); lista.push(r); salvarDemo(d); return r; }
      const i = lista.findIndex((x) => x.id === row.id); if (i < 0) falhar('nao_encontrado');
      const antes = { ...lista[i] }, depois = { ...lista[i], ...row };
      if (depois.responsavel && depois.responsavel !== 'ambos' && !d.equipe.some((e) => e.apelido === depois.responsavel)) falhar('responsavel_invalido');
      regrasDemo(d, tabela, antes, depois); lista[i] = depois; salvarDemo(d); return depois;
    }
    const c = await cliente(); const { id, ...resto } = row;
    // campos que só o sistema preenche não são enviados
    ['criado_em', 'atualizado_em', 'criado_por', 'concluida_por', 'concluida_em', 'origem_hash'].forEach((k) => delete resto[k]);
    const q = novo ? c.from(tabela).insert(resto).select().single() : c.from(tabela).update(resto).eq('id', id).select().single();
    const { data, error } = await q; if (error) throw error; return data;
  }
  async function apagar(tabela, id) {
    if (!REAL) { const d = demo(); d[tabela] = d[tabela].filter((x) => x.id !== id); if (tabela === 'contatos') d.atividades = d.atividades.filter((a) => a.contato_id !== id); if (tabela === 'pastas') { const fora = new Set([id]); let mudou = true; while (mudou) { mudou = false; d.pastas.forEach((p) => { if (p.pai_id && fora.has(p.pai_id) && !fora.has(p.id)) { fora.add(p.id); mudou = true; } }); } d.pastas = d.pastas.filter((p) => !fora.has(p.id)); d.arquivos = d.arquivos.filter((a) => !fora.has(a.pasta_id)); } salvarDemo(d); return; }
    const c = await cliente(); const { error } = await c.from(tabela).delete().eq('id', id); if (error) throw error;
  }
  async function atividades(contatoId) {
    if (!REAL) { const d = demo(); return d.atividades.filter((a) => a.contato_id === contatoId).sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1)); }
    const c = await cliente(); const { data, error } = await c.from('atividades').select('*').eq('contato_id', contatoId).order('criado_em', { ascending: false }).limit(300); if (error) throw error; return data;
  }
  async function nota(contatoId, texto, tipo = 'nota') {
    if (!REAL) { const d = demo(); const a = { id: uid(), contato_id: contatoId, tipo, texto, criado_em: agoraISO() }; regrasDemo(d, 'atividades', null, a); d.atividades.push(a); salvarDemo(d); return a; }
    const c = await cliente(); const { data, error } = await c.from('atividades').insert({ contato_id: contatoId, tipo, texto }).select().single(); if (error) throw error; return data;
  }
  async function historicoTarefa(id) {
    if (!REAL) return demo().tarefa_historico.filter((h) => h.tarefa_id === id).sort((a, b) => (a.em < b.em ? -1 : 1));
    const c = await cliente(); const { data, error } = await c.from('tarefa_historico').select('*').eq('tarefa_id', id).order('em'); if (error) throw error; return data;
  }
  async function email(id) {
    if (!REAL) return demo().emails.find((e) => e.id === id);
    const c = await cliente(); const { data, error } = await c.from('emails').select('*').eq('id', id).single(); if (error) throw error; return data;
  }
  async function marcarLido(id, lido = true) {
    if (!REAL) { const d = demo(); const e = d.emails.find((x) => x.id === id); if (e) e.lido = lido; salvarDemo(d); return; }
    const c = await cliente(); const { error } = await c.from('emails').update({ lido }).eq('id', id); if (error) throw error;
  }
  async function ligarEmail(id, contatoId) {
    if (!REAL) { const d = demo(); const e = d.emails.find((x) => x.id === id); if (e) e.contato_id = contatoId; salvarDemo(d); return; }
    const c = await cliente(); const { error } = await c.from('emails').update({ contato_id: contatoId }).eq('id', id); if (error) throw error;
  }
  // tempo real: avisa quando chega lead, tarefa ou e-mail novo
  async function assinar(cb) {
    if (!REAL) return () => {};
    const c = await cliente();
    const canal = c.channel('crm');
    ['contatos', 'tarefas', 'emails', 'pastas', 'arquivos', 'planos', 'lembretes', 'planilhas', 'financeiro'].forEach((t) => canal.on('postgres_changes', { event: '*', schema: 'public', table: t }, (ev) => cb(t, ev.eventType, ev.new || {})));
    canal.subscribe();
    return () => c.removeChannel(canal);
  }
  // ================= arquivos (Storage) =================
  const BUCKET = 'arquivos', LIMITE = 50 * 1024 * 1024;
  // na prévia os arquivos ficam no navegador (IndexedDB); se bloqueado, só na memória
  const blobsMem = new Map();
  function idb() { return new Promise((ok, falha) => { try { const r = indexedDB.open('apexhub-crm-arquivos', 1); r.onupgradeneeded = () => r.result.createObjectStore('b'); r.onsuccess = () => ok(r.result); r.onerror = () => falha(r.error); } catch (e) { falha(e); } }); }
  async function idbPut(k, v) { blobsMem.set(k, v); try { const db = await idb(); await new Promise((ok, f) => { const t = db.transaction('b', 'readwrite'); t.objectStore('b').put(v, k); t.oncomplete = ok; t.onerror = () => f(t.error); }); } catch {} }
  async function idbGet(k) { if (blobsMem.has(k)) return blobsMem.get(k); try { const db = await idb(); return await new Promise((ok, f) => { const r = db.transaction('b').objectStore('b').get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => f(r.error); }); } catch { return null; } }
  async function idbDel(k) { blobsMem.delete(k); try { const db = await idb(); db.transaction('b', 'readwrite').objectStore('b').delete(k); } catch {} }
  function blobExemplo(a) { // imagem de exemplo desenhada na hora (formato story 9:16)
    return new Promise((ok) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d'); g.fillStyle = a.demo.cor; g.fillRect(0, 0, 360, 640); g.fillStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(300, 120, 140, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 30px Inter, sans-serif'; g.textAlign = 'center'; a.demo.texto.split(' · ').forEach((l, i) => g.fillText(l, 180, 300 + i * 44)); g.font = '16px Inter, sans-serif'; g.fillText('arquivo de exemplo', 180, 590); c.toBlob((b) => ok(b), 'image/png'); });
  }
  const limparNome = (n) => String(n || 'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'arquivo';
  async function subirArquivo(pastaId, file) {
    if (file.size > LIMITE) falhar('arquivo_grande');
    const caminho = `${pastaId}/${uid()}-${limparNome(file.name)}`;
    const linha = { pasta_id: pastaId, nome: String(file.name || 'arquivo').slice(0, 200), caminho, tipo: file.type || 'application/octet-stream', tamanho: file.size };
    if (!REAL) { await idbPut(caminho, file); return salvar('arquivos', linha); }
    const c = await cliente();
    const up = await c.storage.from(BUCKET).upload(caminho, file, { contentType: linha.tipo, upsert: false }); if (up.error) throw up.error;
    try { return await salvar('arquivos', linha); } catch (e) { await c.storage.from(BUCKET).remove([caminho]); throw e; }
  }
  const urls = new Map(); // caminho -> {url, ate}
  async function urlsArquivos(lista) { // lista de linhas de arquivos -> { caminho: url }
    const out = {}, falta = [];
    for (const a of lista) { const u = urls.get(a.caminho); if (u && u.ate > Date.now()) out[a.caminho] = u.url; else falta.push(a); }
    if (!falta.length) return out;
    if (!REAL) {
      for (const a of falta) { let b = await idbGet(a.caminho); if (!b && a.demo) { b = await blobExemplo(a); await idbPut(a.caminho, b); } if (b) { const url = URL.createObjectURL(b); urls.set(a.caminho, { url, ate: Infinity }); out[a.caminho] = url; } }
      return out;
    }
    const c = await cliente();
    for (let i = 0; i < falta.length; i += 100) {
      const { data, error } = await c.storage.from(BUCKET).createSignedUrls(falta.slice(i, i + 100).map((a) => a.caminho), 3600); if (error) throw error;
      (data || []).forEach((r) => { if (r.signedUrl) { urls.set(r.path, { url: r.signedUrl, ate: Date.now() + 50 * 6e4 }); out[r.path] = r.signedUrl; } });
    }
    return out;
  }
  async function blobArquivo(a) { // para baixar ou compartilhar (ex.: mandar direto para o Instagram no celular)
    if (!REAL) { let b = await idbGet(a.caminho); if (!b && a.demo) b = await blobExemplo(a); return b; }
    const c = await cliente(); const { data, error } = await c.storage.from(BUCKET).download(a.caminho); if (error) throw error; return data;
  }
  async function apagarArquivos(lista) { // apaga do Storage e do CRM
    if (!lista.length) return;
    if (!REAL) { for (const a of lista) await idbDel(a.caminho); const d = demo(); const ids = new Set(lista.map((a) => a.id)); d.arquivos = d.arquivos.filter((a) => !ids.has(a.id)); salvarDemo(d); return; }
    const c = await cliente();
    for (let i = 0; i < lista.length; i += 100) { const { error } = await c.storage.from(BUCKET).remove(lista.slice(i, i + 100).map((a) => a.caminho)); if (error) throw error; }
    const { error } = await c.from('arquivos').delete().in('id', lista.map((a) => a.id)); if (error) throw error;
  }
  // ================= enviar e-mail pelo CRM (sai do Gmail de verdade) =================
  let contasCache = null;
  async function contasEnvio() {
    if (!REAL) return ['apex'];
    if (contasCache) return contasCache;
    try { const c = await cliente(); const { data, error } = await c.functions.invoke('enviar-email', { method: 'GET' }); if (error) throw error; contasCache = data?.contas || []; }
    catch (e) { console.warn('envio indisponível', e); contasCache = []; }
    return contasCache;
  }
  async function enviarEmail(p) {
    if (!REAL) {
      await espera(400); const d = demo(); const agora = agoraISO(), id = uid();
      if (p.acao === 'enviar' && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(p.para || '')) falhar('para_invalido');
      const e = { id, conta: p.conta, unidade: p.unidade || null, message_id: id, gmail_id: id, thread_id: p.thread_id || 'th-' + id, direcao: 'enviado', de: 'contato@apexhub.exemplo', para: p.para, assunto: p.assunto, trecho: p.corpo.slice(0, 300), corpo: p.corpo, data: agora, contato_id: p.contato_id || (d.contatos.find((c) => c.email && c.email === p.para) || {}).id || null, lido: true, enviado_por: d.eu };
      d.emails.push(e); if (e.contato_id) d.atividades.push({ id: uid(), contato_id: e.contato_id, tipo: 'email', texto: 'E-mail enviado: ' + (p.assunto || ''), autor: d.eu, criado_em: agora, dados: { email_id: id } });
      salvarDemo(d); return { ok: true, email_id: id, contato_id: e.contato_id, thread_id: e.thread_id };
    }
    const c = await cliente();
    const { data, error } = await c.functions.invoke('enviar-email', { body: p });
    if (error) { let cod = ''; try { cod = (await error.context.json()).erro; } catch {} falhar(cod || 'falha_envio'); }
    return data;
  }
  // ================= formulários (planilhas) =================
  async function linhasPlanilha(pid) {
    if (!REAL) return (demo().planilha_linhas || []).filter((l) => l.planilha_id === pid).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    const c = await cliente(); const { data, error } = await c.from('planilha_linhas').select('*').eq('planilha_id', pid).order('ordem').limit(5000); if (error) throw error; return data;
  }
  // cofre: senhas criptografadas no navegador (AES-GCM 256, chave derivada da senha-mestra com PBKDF2 310 mil voltas)
  const cofre = {
    async chave(senha, salt, iter) { const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64d(salt), iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); },
    async cifrar(k, texto) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(texto))); return { iv: b64e(iv), ct: b64e(ct) }; },
    async decifrar(k, o) { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(o.iv) }, k, b64d(o.ct)); return new TextDecoder().decode(pt); },
    async criar(senha) { const salt = b64e(crypto.getRandomValues(new Uint8Array(16))), iter = 310000; const k = await cofre.chave(senha, salt, iter); return { info: { salt, iter, verificador: await cofre.cifrar(k, 'apex-hub-cofre-ok') }, k }; },
    async abrir(info, senha) { const k = await cofre.chave(senha, info.salt, info.iter); try { if ((await cofre.decifrar(k, info.verificador)) !== 'apex-hub-cofre-ok') throw 0; } catch { falhar('senha_mestra_errada'); } return k; },
  };
  function b64e(u) { let s = ''; u.forEach((b) => (s += String.fromCharCode(b))); return btoa(s); }
  function b64d(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }

  // ================= notificações no celular (lembretes) =================
  const pushSuportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  async function swReg() { return navigator.serviceWorker.register('sw.js'); }
  async function estadoPush() {
    if (!pushSuportado()) return 'sem_suporte';
    if (Notification.permission === 'denied') return 'bloqueado';
    try { const r = await navigator.serviceWorker.getRegistration(); const s = r && (await r.pushManager.getSubscription()); return s ? 'ligado' : 'desligado'; } catch { return 'desligado'; }
  }
  async function ligarPush() {
    if (!pushSuportado()) falhar('push_sem_suporte');
    if (!REAL) { const p = await Notification.requestPermission(); if (p !== 'granted') falhar('push_negado'); return; }
    const c = await cliente();
    let { data: pub, error } = await c.rpc('chave_push_publica'); if (error) throw error;
    if (!pub) { await c.functions.invoke('lembretes', { body: {} }); ({ data: pub } = await c.rpc('chave_push_publica')); } // cria as chaves na 1ª vez
    if (!pub) falhar('push_indisponivel');
    const perm = await Notification.requestPermission(); if (perm !== 'granted') falhar('push_negado');
    const reg = await swReg(); await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(pub.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((pub.length + 3) % 4)), (ch) => ch.charCodeAt(0)) });
    const j = sub.toJSON();
    const { error: e2 } = await c.from('push_inscricoes').upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, aparelho: navigator.userAgent.slice(0, 160) }, { onConflict: 'endpoint', ignoreDuplicates: true });
    if (e2 && !/duplicate/i.test(e2.message)) throw e2;
  }
  async function desligarPush() {
    const r = await navigator.serviceWorker.getRegistration(); const s = r && (await r.pushManager.getSubscription()); if (!s) return;
    if (REAL) { const c = await cliente(); await c.from('push_inscricoes').delete().eq('endpoint', s.endpoint); }
    await s.unsubscribe();
  }
  async function testarPush() {
    if (!REAL) { const r = await swReg(); await navigator.serviceWorker.ready; await r.showNotification('Apex Hub CRM', { body: 'Notificações ligadas neste aparelho ✔ (prévia)', icon: 'img/icone-512.png' }); return { enviados: 1 }; }
    const c = await cliente(); const { data, error } = await c.functions.invoke('lembretes', { body: { teste: true } }); if (error) throw error; return data;
  }

  // ================= assistente de IA =================
  async function ia(mensagens) {
    if (!REAL) { await espera(600); return { texto: 'Na prévia eu não converso de verdade. No CRM publicado, depois de colocar a chave da IA (LEIA-ME), é só pedir: "cria uma tarefa pra amanhã ligar pro Jota sexta", "me lembra amanhã 9h de mandar a proposta", "quais tarefas estão atrasadas?".', acoes: [] }; }
    const c = await cliente();
    const { data, error } = await c.functions.invoke('assistente', { body: { mensagens } });
    if (error) { let cod = ''; try { cod = (await error.context.json()).erro; } catch {} falhar(cod || 'ia_indisponivel'); }
    return data;
  }
  async function salvarUnidade(u, existe) {
    if (!REAL) { const d = demo(); const i = d.unidades.findIndex((x) => x.id === u.id); const r = i >= 0 ? { ...d.unidades[i], ...u } : { ativo: true, ...u }; if (i >= 0) d.unidades[i] = r; else d.unidades.push(r); salvarDemo(d); return r; }
    const c = await cliente(); const { id, ...resto } = u;
    const q = existe ? c.from('unidades').update(resto).eq('id', id).select().single() : c.from('unidades').insert(u).select().single();
    const { data, error } = await q; if (error) throw error; return data;
  }
  function resetarDemo() { memoria = null; local.del(DEMO); }

  window.CRM = { config: CFG, modoDemo: !REAL, local, mensagem, codigo, sessao, entrar, sair, recuperar, novaSenha, carregar, salvar, apagar, atividades, nota, historicoTarefa, email, marcarLido, ligarEmail, assinar, resetarDemo, ROT, contasEnvio, enviarEmail, salvarUnidade, linhasPlanilha, cofre, estadoPush, ligarPush, desligarPush, testarPush, ia, subirArquivo, urlsArquivos, blobArquivo, apagarArquivos, LIMITE };
})();
