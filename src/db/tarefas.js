var TarefasDB = (function () {

  function listar() {
    var projetos = ProjetosDB.listar();
    var todasTarefas = [];
    projetos.forEach(function(p) {
      if (p.tarefas) {
        p.tarefas.forEach(function(t) {
          t.projeto_id = p.id;
          todasTarefas.push(t);
        });
      }
    });
    return todasTarefas;
  }

  function getByProjeto(projetoId) {
    var projeto = ProjetosDB.getById(projetoId);
    return projeto.tarefas || [];
  }

  return {
    listar: listar,
    getByProjeto: getByProjeto,
    criar: function() { throw new Error('Use ProjetosDB para criar tarefas integradas'); },
    criarMuitos: function() { throw new Error('Use ProjetosDB para criar tarefas integradas'); }
  };
})();
