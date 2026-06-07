function doGet(e) {
  return HtmlService.createTemplateFromFile('ui/App')
    .evaluate()
    .setTitle('Mini ERP - Treinamento');
}

function include(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

/**
 * Função chamada pelo frontend para autenticar usuário
 * @param {string} nome - Nome do usuário
 * @param {string} senha - Senha em texto plano
 * @returns {Object} { sucesso: boolean, usuario?: Object, erro?: string }
 */
function autenticar(nome, senha) {
  try {
    var usuario = AuthService.login(nome, senha);
    return {
      sucesso: true,
      usuario: usuario
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro.message
    };
  }
}

function getProjetos() {
  try {
    return { sucesso: true, projetos: ProjetosDB.listar() };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function getProjeto(id) {
  try {
    return { sucesso: true, projeto: ProjetosDB.getById(parseInt(id)) };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function criarProjeto(data) {
  try {
    // Validação de integridade
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('O nome do projeto é obrigatório.');
    }
    if (!data.materiais || data.materiais.length === 0) {
      throw new Error('O projeto deve ter no mínimo 1 material.');
    }
    if (!data.tarefas || data.tarefas.length === 0) {
      throw new Error('O projeto deve ter no mínimo 1 tarefa.');
    }

    // 1. Preparar o projeto com materiais e tarefas integrados
    var projetoParaCriar = {
      nome: data.nome,
      materiais: data.materiais || [],
      tarefas: (data.tarefas || []).map(function(tar, index) {
        return {
          id: Date.now() + index,
          nome: tar.nome,
          ordem: index + 1,
          descricao: tar.descricao,
          links: tar.links ? tar.links.split('\n').filter(function(l){ return l.trim() !== ''; }) : []
        };
      })
    };

    // 2. Escrita única (Atômica)
    var projeto = ProjetosDB.criar(projetoParaCriar);

    return { sucesso: true, projeto: projeto };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function getOps() {
  try {
    return { sucesso: true, ops: OpsDB.listar() };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function getEventos() {
  try {
    return { sucesso: true, eventos: EventosDB.listar() };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function getDadosRelatorio() {
  try {
    return {
      sucesso: true,
      eventos: EventosDB.listar(),
      ops: OpsDB.listar(),
      projetos: ProjetosDB.listar(),
      usuarios: UsuariosDB.listar()
    };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function criarOp(data) {
  try {
    var projeto = ProjetosDB.getById(parseInt(data.projeto_id));
    var op = OpsDB.criar({ 
      projeto_id: parseInt(data.projeto_id),
      nome_projeto: projeto.nome,
      quantidade_total: parseInt(data.quantidade),
      status: 'aberta',
      quantidade_realizada: 0 
    });
    return { sucesso: true, op: op };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function cancelarOp(opId) {
  try {
    var eventos = EventosDB.listar();
    var temEventos = eventos.some(function(e) { return e.op_id == opId; });
    
    if (temEventos) {
      return { sucesso: false, erro: 'Não é possível cancelar OP com eventos associados.' };
    }
    
    OpsDB.remover(parseInt(opId));
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * Funções de Gerenciamento de Usuários
 */

function getUsuarios() {
  try {
    return { sucesso: true, usuarios: UsuariosDB.listar() };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function criarUsuarioNovo(data) {
  try {
    var usuario = AuthService.criarUsuario(data.nome, data.senha, data.role);
    return { sucesso: true, usuario: usuario };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function alternarStatusUsuario(id, ativo) {
  try {
    UsuariosDB.atualizar(parseInt(id), { ativo: ativo });
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function removerUsuario(id) {
  try {
    UsuariosDB.remover(parseInt(id));
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * Registra um lote de eventos de uma só vez (Transacional)
 * @param {Array} eventos - Lista de eventos
 * @returns {Object} Resultado
 */
function registrarLoteEventos(eventos) {
  try {
    if (!eventos || eventos.length === 0) return { sucesso: true };

    var todosEventos = EventosDB.listar();
    var conclusao = null;

    eventos.forEach(function(e) {
      e.id = e.id || (Date.now() + Math.floor(Math.random() * 1000));
      if (e.tipo === 'conclusao') conclusao = e;
      todosEventos.push(e);
    });

    // Escrita única no Drive - Corrigido de EventosDB.write para DB.write
    DB.write('eventos', todosEventos);

    // Se houve conclusão no lote, atualizar progresso da OP
    if (conclusao) {
      var op = OpsDB.getById(parseInt(conclusao.op_id));
      var projeto = ProjetosDB.getById(op.projeto_id);
      
      if (projeto.tarefas && projeto.tarefas.length > 0) {
        var ultimaTarefa = projeto.tarefas[projeto.tarefas.length - 1];
        if (ultimaTarefa.id == conclusao.tarefa_id) {
          OpsDB.atualizar(op.id, { 
            quantidade_realizada: (op.quantidade_realizada || 0) + 1,
            status: (op.quantidade_realizada + 1 >= op.quantidade_total) ? 'finalizada' : 'em andamento'
          });
        } else if (op.status === 'aberta') {
          OpsDB.atualizar(op.id, { status: 'em andamento' });
        }
      }
    }

    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function registrarEvento(data) {
  return registrarLoteEventos([data]);
}

function limparEventos() {
  try {
    DB.write('eventos', []);
    return { sucesso: true, mensagem: 'Todos os eventos foram removidos.' };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function limparOps() {
  try {
    DB.write('ops', []);
    return { sucesso: true, mensagem: 'Todas as OPs foram removidas.' };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

function limparProjetos() {
  try {
    DB.write('projetos', []);
    return { sucesso: true, mensagem: 'Todos os projetos foram removidos.' };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * Função Utilitária para gerar dados de teste e visualizar o Dashboard
 */
function gerarDadosMock() {
  try {
    // ===== 1. Garantir operadores com diferentes perfis =====
    var usuarios = UsuariosDB.listar();
    var joao = usuarios.find(function(u) { return u.nome === 'João Silva'; }) || AuthService.criarUsuario('João Silva', '123', 'operador');
    var maria = usuarios.find(function(u) { return u.nome === 'Maria Santos'; }) || AuthService.criarUsuario('Maria Santos', '123', 'operador');
    var carlos = usuarios.find(function(u) { return u.nome === 'Carlos Oliveira'; }) || AuthService.criarUsuario('Carlos Oliveira', '123', 'operador');

    // ===== 2. Criar 2 Projetos =====
    var proj1 = criarProjeto({
      nome: '🚜 Montagem Trator ST-500',
      materiais: [
        { nome: 'Chassi Reforçado', quantidade: '1' },
        { nome: 'Motor Diesel 150cv', quantidade: '1' },
        { nome: 'Rodas Aro 32', quantidade: '4' }
      ],
      tarefas: [
        { nome: 'Preparação do Chassi', descricao: 'Limpeza e inspeção inicial.', links: '' },
        { nome: 'Instalação do Motor', descricao: 'Acoplamento e torque dos parafusos.', links: '' },
        { nome: 'Pintura e Acabamento', descricao: 'Aplicação de verniz protetivo.', links: '' }
      ]
    }).projeto;

    var proj2 = criarProjeto({
      nome: '🌾 Colheitadeira CX-2000',
      materiais: [
        { nome: 'Plataforma de Corte', quantidade: '1' },
        { nome: 'Sistema de Trilha', quantidade: '1' },
        { nome: 'Tanque Graneleiro', quantidade: '1' },
        { nome: 'Motor Diesel 250cv', quantidade: '1' }
      ],
      tarefas: [
        { nome: 'Montagem da Plataforma', descricao: 'Fixação da plataforma de corte.', links: '' },
        { nome: 'Instalação do Sistema de Trilha', descricao: 'Ajuste dos cilindros de trilha.', links: '' },
        { nome: 'Montagem do Tanque', descricao: 'Instalação do tanque graneleiro.', links: '' },
        { nome: 'Calibração Final', descricao: 'Testes e calibração dos sistemas.', links: '' }
      ]
    }).projeto;

    // ===== 3. Criar OPs =====
    var agora = Date.now();
    var DAY = 86400000;

    // OP1: Trator, 3 unidades — COMPLETA
    var op1 = criarOp({ projeto_id: proj1.id, quantidade: 3 }).op;
    // OP2: Trator, 2 unidades — EM ANDAMENTO
    var op2 = criarOp({ projeto_id: proj1.id, quantidade: 2 }).op;
    // OP3: Colheitadeira, 4 unidades — COMPLETA
    var op3 = criarOp({ projeto_id: proj2.id, quantidade: 4 }).op;
    // OP4: Colheitadeira, 5 unidades — ABERTA (sem eventos)
    criarOp({ projeto_id: proj2.id, quantidade: 5 });

    // ===== 4. Helper de evento =====
    function montarEvento(opId, tarefa, projetoId, usuario, tipo, timestamp, obs, duracao) {
      var e = {
        op_id: opId,
        tarefa_id: tarefa.id,
        tarefa_nome: tarefa.nome,
        projeto_id: projetoId,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        tipo: tipo,
        timestamp_inicio: new Date(timestamp).toISOString()
      };
      if (obs) e.observacao = obs;
      if (duracao != null) e.duracao_segundos = duracao;
      return e;
    }

    // ===== 5. Helper: ciclo completo de tarefas para uma unidade =====
    function cicloCompleto(opId, projeto, tarefas, usuario, timeStart, activeSec, hasPause) {
      var eventos = [];
      var t = timeStart;
      for (var i = 0; i < tarefas.length; i++) {
        var tarefa = tarefas[i];
        var pausar = hasPause && i > 0;

        eventos.push(montarEvento(opId, tarefa, projeto.id, usuario, 'inicio', t));

        if (pausar) {
          t += Math.round(activeSec * 0.4) * 1000;
          eventos.push(montarEvento(opId, tarefa, projeto.id, usuario, 'pausa', t, 'Pausa para ajuste técnico'));
          t += Math.round(activeSec * 0.2) * 1000;
          eventos.push(montarEvento(opId, tarefa, projeto.id, usuario, 'retomada', t));
          t += Math.round(activeSec * 0.6) * 1000;
        } else {
          t += activeSec * 1000;
        }

        eventos.push(montarEvento(opId, tarefa, projeto.id, usuario, 'conclusao', t, 'Execução concluída', activeSec));
        t += 120000; // 2 min gap entre tarefas
      }
      return eventos;
    }

    // ===== 6. Gerar eventos =====

    // -- OP1: Trator, 3 unidades, João, Maria, Carlos --
    var ciclos1 = [
      { usr: joao, sec: 700, pause: false, base: -7 * DAY },
      { usr: maria, sec: 1100, pause: true, base: -6.4 * DAY },
      { usr: carlos, sec: 2000, pause: true, base: -5.5 * DAY }
    ];
    for (var c1 = 0; c1 < ciclos1.length; c1++) {
      var cl = ciclos1[c1];
      var evts = cicloCompleto(op1.id, proj1, proj1.tarefas, cl.usr, agora + cl.base, cl.sec, cl.pause);
      registrarLoteEventos(evts);
    }

    // -- OP2: Trator, 2 unidades, unidade 1 = João (completa), unidade 2 = Carlos (travado) --
    // Unidade 1: João rápido, sem pausas
    var ciclo2a = cicloCompleto(op2.id, proj1, proj1.tarefas, joao, agora - 2.2 * DAY, 700, false);
    registrarLoteEventos(ciclo2a);
    // Unidade 2: Carlos começa apenas a primeira tarefa, pausa, e nunca retoma
    var t1 = proj1.tarefas[0];
    var eventosStuck = [
      montarEvento(op2.id, t1, proj1.id, carlos, 'inicio', agora - 0.8 * DAY),
      montarEvento(op2.id, t1, proj1.id, carlos, 'pausa', agora - 0.8 * DAY + 400000, 'Chamado para reunião de emergência')
    ];
    registrarLoteEventos(eventosStuck);

    // -- OP3: Colheitadeira, 4 unidades, intercalando Maria e João --
    var perfisOP3 = [
      { usr: maria, sec: 1100, pause: false, base: -6.5 * DAY },
      { usr: joao, sec: 750, pause: false, base: -5 * DAY },
      { usr: maria, sec: 1050, pause: true, base: -3.8 * DAY },
      { usr: joao, sec: 700, pause: false, base: -2.5 * DAY }
    ];
    for (var c3 = 0; c3 < perfisOP3.length; c3++) {
      var pf = perfisOP3[c3];
      var evts3 = cicloCompleto(op3.id, proj2, proj2.tarefas, pf.usr, agora + pf.base, pf.sec, pf.pause);
      registrarLoteEventos(evts3);
    }

    return { sucesso: true, mensagem: "Dados Mock gerados com sucesso! (João, Maria, Carlos)" };
  } catch (e) {
    return { sucesso: false, erro: e.message };
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  Logger.log(body);
}
