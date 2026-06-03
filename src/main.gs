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

function criarProjeto(data) {
  try {
    // 1. Criar o projeto base
    var projeto = ProjetosDB.criar({ nome: data.nome });
    
    // 2. Criar e associar materiais
    if (data.materiais) {
      data.materiais.forEach(function(mat) {
        MateriaisDB.criar({ 
          projeto_id: projeto.id, 
          nome: mat.nome, 
          quantidade: mat.quantidade 
        });
      });
    }
    
    // 3. Criar e associar tarefas
    if (data.tarefas) {
      data.tarefas.forEach(function(tar, index) {
        TarefasDB.criar({ 
          projeto_id: projeto.id, 
          nome: tar.nome, 
          ordem: index + 1,
          descricao: tar.descricao,
          links: tar.links ? tar.links.split('\n').filter(function(l){ return l.trim() !== ''; }) : []
        });
      });
    }

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

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  Logger.log(body);
  AuthService.criarUsuario('lucas', 'lucas', 'gestor');
}
