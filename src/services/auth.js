var AuthService = (function () {

  /**
   * Cria novo usuário com senha hasheada
   * @param {string} nome - Nome do usuário
   * @param {string} senha - Senha em texto plano
   * @param {string} role - Role do usuário ('gestor' ou 'operador')
   * @returns {Object} Usuário criado (sem senha_hash)
   * @throws {Error} Se usuário já existe ou role inválida
   */
  function criarUsuario(nome, senha, role) {
    if (!nome || !senha || !role) {
      throw new Error('AuthService.criarUsuario: nome, senha e role sao obrigatorios');
    }

    if (role !== 'gestor' && role !== 'operador') {
      throw new Error('AuthService.criarUsuario: role invalida. Use "gestor" ou "operador"');
    }

    var usuarios = UsuariosDB.listar();
    
    for (var i = 0; i < usuarios.length; i++) {
      if (usuarios[i].nome === nome) {
        throw new Error('AuthService.criarUsuario: usuario com este nome ja existe');
      }
    }

    var hashSenha = gerarHashSenha(senha);
    var novoUsuario = UsuariosDB.criar({
      nome: nome,
      senha_hash: hashSenha.hash + ':' + hashSenha.salt,
      role: role,
      ativo: true
    });

    return sanitizarUsuario(novoUsuario);
  }

  /**
   * Autentica usuário com nome e senha
   * @param {string} nome - Nome do usuário
   * @param {string} senha - Senha em texto plano
   * @returns {Object} Usuário autenticado (sem senha_hash)
   * @throws {Error} Se credenciais inválidas ou usuário inativo
   */
  function login(nome, senha) {
    if (!nome || !senha) {
      throw new Error('AuthService.login: nome e senha sao obrigatorios');
    }

    var usuarios = UsuariosDB.listar();
    var usuario = null;

    for (var i = 0; i < usuarios.length; i++) {
      if (usuarios[i].nome === nome) {
        usuario = usuarios[i];
        break;
      }
    }

    if (!usuario) {
      throw new Error('AuthService.login: usuario nao encontrado');
    }

    if (!usuario.ativo) {
      throw new Error('AuthService.login: usuario inativo');
    }

    if (!validarSenha(senha, usuario.senha_hash)) {
      throw new Error('AuthService.login: senha incorreta');
    }

    return sanitizarUsuario(usuario);
  }

  /**
   * Gera hash seguro para senha com salt
   * @param {string} senha - Senha em texto plano
   * @param {string} salt - Salt (opcional, gera novo se não fornecido)
   * @returns {Object} { hash: string, salt: string }
   */
  function gerarHashSenha(senha, salt) {
    salt = salt || Utilities.getUuid();
    var senhaComSalt = senha + salt;
    var hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, senhaComSalt);
    var hash = Utilities.base64Encode(hashBytes);
    
    return {
      hash: hash,
      salt: salt
    };
  }

  /**
   * Valida senha contra hash com salt
   * @private
   * @param {string} senha - Senha em texto plano
   * @param {string} hashArmazenado - Hash armazenado (formato: "hash:salt")
   * @returns {boolean} Senha válida
   */
  function validarSenha(senha, hashArmazenado) {
    if (!hashArmazenado || !hashArmazenado.includes(':')) {
      return false;
    }

    var partes = hashArmazenado.split(':');
    var hashEsperado = partes[0];
    var salt = partes[1];

    var hashCalculado = gerarHashSenha(senha, salt).hash;
    return hashCalculado === hashEsperado;
  }

  /**
   * Remove dados sensíveis do objeto usuário
   * @private
   * @param {Object} usuario - Usuário com senha_hash
   * @returns {Object} Usuário sanitizado
   */
  function sanitizarUsuario(usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      role: usuario.role,
      ativo: usuario.ativo
    };
  }

  /**
   * Verifica se usuário tem permissão para uma ação (por role)
   * @param {Object} usuario - Usuário logado
   * @param {string} acao - Identificador da ação
   * @returns {boolean} Tem permissão
   */
  function temPermissao(usuario, acao) {
    if (!usuario || !usuario.role) {
      return false;
    }

    var permissoes = {
      gestor: [
        'criar_projeto',
        'editar_projeto',
        'deletar_projeto',
        'criar_tarefa',
        'editar_tarefa',
        'deletar_tarefa',
        'criar_material',
        'editar_material',
        'deletar_material',
        'gerenciar_usuarios',
        'abrir_op',
        'consultar_relatorios'
      ],
      operador: [
        'iniciar_tarefa',
        'pausar_tarefa',
        'finalizar_tarefa',
        'consultar_op',
        'consultar_tarefas'
      ]
    };

    var acoesDoRole = permissoes[usuario.role] || [];
    return acoesDoRole.indexOf(acao) !== -1;
  }

  return {
    login: login,
    criarUsuario: criarUsuario,
    temPermissao: temPermissao,
    gerarHashSenha: gerarHashSenha
  };

})();
