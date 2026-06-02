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

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  Logger.log(body);
  AuthService.criarUsuario('lucas', 'lucas', 'gestor');
}
