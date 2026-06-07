var Router = (function () {

  /**
   * Mapa de rotas disponíveis e suas configurações
   */
  var rotas = {
    login: {
      pagina: 'ui/Login',
      permissao: null,
      requerAutenticacao: false
    },
    admin: {
      pagina: 'ui/Admin',
      permissao: null,
      requerAutenticacao: true
    },
    ops: {
      pagina: 'ui/Admin',
      permissao: null,
      requerAutenticacao: true
    },
    projetos: {
      pagina: 'ui/Admin',
      permissao: 'criar_projeto',
      requerAutenticacao: true
    },
    relatorios: {
      pagina: 'ui/Admin',
      permissao: 'consultar_relatorios',
      requerAutenticacao: true
    },
    usuarios: {
      pagina: 'ui/Admin',
      permissao: 'gerenciar_usuarios',
      requerAutenticacao: true
    },
    gerencial: {
      pagina: 'ui/Admin',
      permissao: null,
      requerAutenticacao: true
    }
  };

  /**
   * Valida se o usuário tem permissão para acessar uma rota
   * @private
   * @param {Object} usuario - Usuário logado
   * @param {string} rota - Nome da rota
   * @returns {boolean} Tem acesso
   */
  function temAcessoRota(usuario, rota) {
    var configuracao = rotas[rota];
    
    if (!configuracao) {
      return false;
    }

    if (configuracao.requerAutenticacao && !usuario) {
      return false;
    }

    if (configuracao.permissao && usuario) {
      return AuthService.temPermissao(usuario, configuracao.permissao);
    }

    return true;
  }

  /**
   * Obtém a página HTML para uma rota
   * @param {string} rota - Nome da rota (padrão: 'login')
   * @param {Object} usuario - Usuário logado (opcional)
   * @returns {HtmlOutput} HTML da página
   * @throws {Error} Se rota inválida ou sem permissão
   */
  function irPara(rota, usuario) {
    rota = rota || 'login';

    if (!rotas[rota]) {
      throw new Error('Router.irPara: rota invalida: ' + rota);
    }

    if (!temAcessoRota(usuario, rota)) {
      return irPara('login');
    }

    var configuracao = rotas[rota];
    var html = HtmlService.createHtmlOutputFromFile(configuracao.pagina);
    
    return html
      .setTitle('Mini ERP - ' + rota.charAt(0).toUpperCase() + rota.slice(1));
  }

  /**
   * Valida se uma rota existe
   * @param {string} rota - Nome da rota
   * @returns {boolean}
   */
  function rotaExiste(rota) {
    return rotas.hasOwnProperty(rota);
  }

  /**
   * Lista todas as rotas disponíveis para um usuário
   * @param {Object} usuario - Usuário logado
   * @returns {Array} Array com nomes das rotas acessíveis
   */
  function rotasDisponiveis(usuario) {
    var disponiveis = [];

    Object.keys(rotas).forEach(function (rota) {
      if (temAcessoRota(usuario, rota)) {
        disponiveis.push(rota);
      }
    });

    return disponiveis;
  }

  /**
   * Registra uma nova rota no sistema
   * @param {string} nome - Nome único da rota
   * @param {Object} config - { pagina, permissao, requerAutenticacao }
   */
  function registrarRota(nome, config) {
    if (rotas[nome]) {
      throw new Error('Router.registrarRota: rota ja existe: ' + nome);
    }

    rotas[nome] = {
      pagina: config.pagina,
      permissao: config.permissao || null,
      requerAutenticacao: config.requerAutenticacao !== false
    };
  }

  /**
   * Obtém informações sobre uma rota
   * @param {string} rota - Nome da rota
   * @returns {Object} Configuração da rota
   */
  function obterRota(rota) {
    if (!rotas[rota]) {
      throw new Error('Router.obterRota: rota nao encontrada: ' + rota);
    }

    return Object.assign({}, rotas[rota], { nome: rota });
  }

  return {
    irPara: irPara,
    rotaExiste: rotaExiste,
    rotasDisponiveis: rotasDisponiveis,
    registrarRota: registrarRota,
    obterRota: obterRota,
    temAcessoRota: temAcessoRota
  };

})();
