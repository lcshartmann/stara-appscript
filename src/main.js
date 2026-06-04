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

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  Logger.log(body);
}
