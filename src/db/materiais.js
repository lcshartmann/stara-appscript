var MateriaisDB = (function () {
  
  function listar() {
    var projetos = ProjetosDB.listar();
    var todosMateriais = [];
    projetos.forEach(function(p) {
      if (p.materiais) {
        p.materiais.forEach(function(m) {
          m.projeto_id = p.id; // Mantém compatibilidade
          todosMateriais.push(m);
        });
      }
    });
    return todosMateriais;
  }

  function getByProjeto(projetoId) {
    var projeto = ProjetosDB.getById(projetoId);
    return projeto.materiais || [];
  }

  return {
    listar: listar,
    getByProjeto: getByProjeto,
    criar: function() { throw new Error('Use ProjetosDB para criar materiais integrados'); },
    criarMuitos: function() { throw new Error('Use ProjetosDB para criar materiais integrados'); }
  };
})();
