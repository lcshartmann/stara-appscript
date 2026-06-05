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

/**
 * Função Utilitária para gerar dados de teste e visualizar o Dashboard
 */
function gerarDadosMock() {
  try {
    // 1. Garantir que temos um operador para assinar os eventos
    var usuarios = UsuariosDB.listar();
    var operador = usuarios.find(u => u.role === 'operador') || usuarios[0];
    
    if (!operador) {
      operador = AuthService.criarUsuario('Operador Teste', '123', 'operador');
    }

    // 2. Criar um Projeto Robusto
    var projetoData = {
      nome: "🚜 Montagem Trator ST-500 (MOCK)",
      materiais: [
        { nome: "Chassi Reforçado", quantidade: "1" },
        { nome: "Motor Diesel 150cv", quantidade: "1" },
        { nome: "Rodas Aro 32", quantidade: "4" }
      ],
      tarefas: [
        { nome: "Preparação do Chassi", descricao: "Limpeza e inspeção inicial.", links: "" },
        { nome: "Instalação do Motor", descricao: "Acoplamento e torque dos parafusos.", links: "" },
        { nome: "Pintura e Acabamento", descricao: "Aplicação de verniz protetivo.", links: "" }
      ]
    };
    var resProjeto = criarProjeto(projetoData);
    var projeto = resProjeto.projeto;

    // 3. Criar 2 OPs
    var op1 = criarOp({ projeto_id: projeto.id, quantidade: 5 }).op;
    var op2 = criarOp({ projeto_id: projeto.id, quantidade: 2 }).op;

    // 4. Gerar Eventos para a OP 1 (Tarefa 1 Completa com Pausa)
    var agora = new Date();
    var t1 = projeto.tarefas[0];
    var t2 = projeto.tarefas[1];

    var eventosOP1 = [
      {
        op_id: op1.id, tarefa_id: t1.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'inicio', timestamp_inicio: new Date(agora.getTime() - 3600000).toISOString()
      },
      {
        op_id: op1.id, tarefa_id: t1.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'pausa', timestamp_inicio: new Date(agora.getTime() - 3000000).toISOString(), observacao: 'Ajuste de ferramenta'
      },
      {
        op_id: op1.id, tarefa_id: t1.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'retomada', timestamp_inicio: new Date(agora.getTime() - 2500000).toISOString()
      },
      {
        op_id: op1.id, tarefa_id: t1.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'conclusao', timestamp_inicio: new Date(agora.getTime() - 2000000).toISOString(), 
        duracao_segundos: 1600, observacao: 'Execução perfeita'
      },
      // Início da tarefa 2
      {
        op_id: op1.id, tarefa_id: t2.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'inicio', timestamp_inicio: new Date(agora.getTime() - 1500000).toISOString()
      }
    ];

    // 5. Gerar Eventos para a OP 2 (Tarefa 1 Direta)
    var eventosOP2 = [
      {
        op_id: op2.id, tarefa_id: t1.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'inicio', timestamp_inicio: new Date(agora.getTime() - 5000000).toISOString()
      },
      {
        op_id: op2.id, tarefa_id: t1.id, usuario_id: operador.id, usuario_nome: operador.nome,
        tipo: 'conclusao', timestamp_inicio: new Date(agora.getTime() - 4000000).toISOString(), 
        duracao_segundos: 1000
      }
    ];

    registrarLoteEventos(eventosOP1);
    registrarLoteEventos(eventosOP2);

    return { sucesso: true, mensagem: "Dados Mock gerados com sucesso para " + operador.nome };
  } catch (e) {
    return { sucesso: false, erro: e.message };
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  Logger.log(body);
}
