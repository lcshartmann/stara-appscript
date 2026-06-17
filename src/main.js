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
 * Setup inicial: cadastra usuarios e projeto Reboke Ninja
 */
function setupInicial() {
  try {
    DB.write('usuarios', []);
    DB.write('projetos', []);
    DB.write('ops', []);
    DB.write('eventos', []);

    AuthService.criarUsuario('admin', 'admin', 'gestor');
    AuthService.criarUsuario('operador', 'operador', 'operador');

    var LINK = 'https://drive.google.com/file/d/1V7IiS5W6hecBlqbh3qNDoGUSM0Kk0yoE/view?usp=sharing';

    var projeto = criarProjeto({
      nome: 'Reboke Ninja',
      materiais: [
        { nome: 'P1 - Olhal de Fixacao', quantidade: '1' },
        { nome: 'P2 - Haste de Ligacao 1', quantidade: '1' },
        { nome: 'P4 - Haste de Ligacao 2', quantidade: '1' },
        { nome: 'P6 - Haste de Juncao', quantidade: '1' },
        { nome: 'P9/P10 - Suportes Articuladores', quantidade: '2' },
        { nome: 'P12 - Pneu', quantidade: '4' },
        { nome: 'P13 - Haste de Suporte', quantidade: '1' },
        { nome: 'P14 - Suporte Lateral Esquerdo', quantidade: '1' },
        { nome: 'P15 - Suporte Lateral Direito', quantidade: '1' },
        { nome: 'P17/P18/P21 - Chassi', quantidade: '3' },
        { nome: 'P23/P24 - Hastes de Ligacao Articuladas', quantidade: '2' },
        { nome: 'P26 - Chaparia Central', quantidade: '1' },
        { nome: 'P28 - Chaparia Lateral Esquerda', quantidade: '1' },
        { nome: 'P29 - Chaparia Lateral Direita', quantidade: '1' },
        { nome: 'P32 - Chaparia Superior Traseira', quantidade: '1' },
        { nome: 'P33 - Chaparia Superior Frontal', quantidade: '1' },
        { nome: 'P36 - Tubo Estagio 1', quantidade: '1' },
        { nome: 'P37 - Juncao de Tubos', quantidade: '1' },
        { nome: 'P39 - Tubo Estagio 2', quantidade: '1' },
        { nome: 'P41 - Boca do Tubo', quantidade: '1' },
        { nome: 'F1/F4/F7/F10 - Parafuso M10', quantidade: '5' },
        { nome: 'F2/F6/F9/F12 - Porca M10', quantidade: '5' },
        { nome: 'F3/F5/F8/F11 - Arruela M10', quantidade: '5' },
        { nome: 'F13/F14 - Porca e Arruela M8', quantidade: '4' },
        { nome: 'F15/F18/F21/F36 - Porca M8', quantidade: '8' },
        { nome: 'F16/F19/F22/F37 - Parafuso M8', quantidade: '8' },
        { nome: 'F17/F20/F23/F38 - Arruela M8', quantidade: '8' },
        { nome: 'F24/F27/F30 - Porca M4', quantidade: '14' },
        { nome: 'F25/F28/F31 - Parafuso M4', quantidade: '14' },
        { nome: 'F26/F29/F32 - Arruela M4', quantidade: '14' },
        { nome: 'F33/F41 - Arruela M5', quantidade: '6' },
        { nome: 'F34/F39 - Porca M5', quantidade: '6' },
        { nome: 'F35/F40 - Parafuso M5', quantidade: '6' }
      ],
      tarefas: [
        { nome: 'Centralizacao do Olhal na Haste', descricao: 'Pegue P1 (Olhal de Fixacao) e centralize em P2 (Haste de Ligacao 1), de modo que os furos fiquem coincidentes.', links: LINK },
        { nome: 'Fixacao com parafusos M10', descricao: 'Fixe P3 (Montagem Anterior = etapa 1) com F1 (Parafuso M10), F2 (Porca M10) e F3 (Arruela M10), em sentido horario ate o limite.', links: LINK },
        { nome: 'Juncao das Hastes de Ligacao', descricao: 'Junte P4 (Haste de Ligacao 2) e P5 (Montagem Anterior = etapas 1-2) de modo coincidente e centralizado, e fixe com F4 (Parafuso M10), F5 (Arruela M10) e F6 (Porca M10) no sentido horario ate o limite.', links: LINK },
        { nome: 'Juncao da Haste de Juncao', descricao: 'Junte P6 (Haste de Juncao) e P7 (Montagem Anterior = etapas 1-3) de forma centralizada, perpendicular e coincidente, e fixe com F7 (Parafuso M10), F8 (Arruela M10) e F9 (Porca M10) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem dos Suportes Articuladores', descricao: 'Posicione P9 e P10 (Suportes Articuladores) nas laterais de P8 (Montagem Anterior = etapas 1-4), e fixe com F10 (Parafuso M10, x2), F11 (Arruela M10, x2) e F12 (Porca M10, x2) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem dos Pneus (dianteira)', descricao: 'Posicione P12 (Pneu, x2) nas laterais de P11 (Montagem Anterior = etapas 1-5), e fixe com F13 (Porca e Arruela M8, x2) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem dos Suportes Laterais', descricao: 'Junte P14 (Suporte Lateral Esquerdo) e P15 (Suporte Lateral Direito) nas laterais de P13 (Haste de Suporte), de modo centralizado.', links: LINK },
        { nome: 'Montagem dos Pneus (traseira)', descricao: 'Posicione P12 (Pneu, x2) nas laterais de P16 (Montagem Anterior = etapa 7), e fixe com F14 (Porca e Arruela M8, x2) no sentido horario ate o limite.', links: LINK },
        { nome: 'Chassi', descricao: 'P17 (Chassi) — sem instrucoes adicionais.', links: LINK },
        { nome: 'Fixacao do primeiro Chassi', descricao: 'Posicione P18 (Chassi) acima de P19 (Montagem Anterior = etapas 1-6 e 8 combinadas), de modo centralizado, e fixe com F15 (Porca M8, x2), F16 (Parafuso M8, x2) e F17 (Arruela M8, x2) no sentido horario ate o limite.', links: LINK },
        { nome: 'Fixacao do segundo Chassi', descricao: 'Posicione P21 (Chassi) acima de P20 (Montagem Anterior = etapa 10), de modo centralizado, e fixe com F18 (Porca M8, x2), F19 (Parafuso M8, x2) e F20 (Arruela M8, x2) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem das Hastes de Ligacao Articuladas', descricao: 'Posicione P23 e P24 (Hastes de Ligacao Articuladas) de modo coincidente na parte frontal de P22 (Montagem Anterior = etapas 1-11), e fixe com F21 (Porca M8, x3), F22 (Parafuso M8, x3) e F23 (Arruela M8, x3) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem da Chaparia Central', descricao: 'Posicione P26 (Chaparia Central) acima de P25 (Montagem Anterior = etapas 1-12), de modo centralizado e coincidente, e fixe com F24 (Porca M4, x8), F25 (Parafuso M4, x8) e F26 (Arruela M4, x8) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem da Chaparia Lateral Esquerda', descricao: 'Posicione P28 (Chaparia Lateral Esquerda) na lateral esquerda de P27 (Montagem Anterior = etapas 1-13), de modo coincidente, e fixe com F27 (Porca M4, x3), F28 (Parafuso M4, x3) e F29 (Arruela M4, x3) no sentido horario ate o limite.', links: LINK },
        { nome: 'Montagem da Chaparia Lateral Direita', descricao: 'Posicione P29 (Chaparia Lateral Direita) na lateral direita de P30 (Montagem Anterior = etapas 1-14), de modo coincidente, e fixe com F30 (Porca M4, x3), F31 (Parafuso M4, x3) e F32 (Arruela M4, x3) no sentido horario ate o limite.', links: LINK },
        { nome: 'Encaixe da Chaparia Superior Traseira', descricao: 'Encaixe P32 (Chaparia Superior Traseira) acima de P31 (Montagem Anterior = etapas 1-15) na parte traseira.', links: LINK },
        { nome: 'Encaixe da Chaparia Superior Frontal', descricao: 'Encaixe P33 (Chaparia Superior Frontal) acima de P34 (Montagem Anterior = etapas 1-16) na parte frontal.', links: LINK },
        { nome: 'Montagem do Tubo Estagio 1', descricao: 'Encaixe P36 (Tubo Estagio 1) na parte frontal direita de P35 (Montagem Anterior = etapas 1-17), e fixe com F33 (Arruela M5, x3), F34 (Porca M5, x3) e F35 (Parafuso M5, x3) no sentido horario ate o limite.', links: LINK },
        { nome: 'Fixacao da Juncao de Tubos', descricao: 'Fixe P37 (Juncao de Tubos) em P38 (Montagem Anterior = etapa 18) com F36 (Porca M8), F37 (Parafuso M8) e F38 (Arruela M8) no sentido horario ate o limite.', links: LINK },
        { nome: 'Tubo Estagio 2', descricao: 'P39 (Tubo Estagio 2) em P40 (Montagem Anterior = etapa 19) — sem instrucoes adicionais.', links: LINK },
        { nome: 'Montagem da Boca do Tubo (Final)', descricao: 'Junte P41 (Boca do Tubo) em P42 (Montagem Anterior = etapa 20) de modo coincidente, e fixe com F39 (Porca M5, x3), F40 (Parafuso M5, x3) e F41 (Arruela M5, x3) no sentido horario ate o limite. Montagem finalizada.', links: LINK }
      ]
    }).projeto;

    criarOp({ projeto_id: projeto.id, quantidade: 1 });

    return { sucesso: true, mensagem: 'Setup inicial realizado com sucesso!' };
  } catch (e) {
    return { sucesso: false, erro: e.message };
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  Logger.log(body);
}
