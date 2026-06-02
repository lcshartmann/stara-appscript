var TarefasDB = (function () {
  var ENTITY = 'tarefas';

  function listar() {
    return DB.read(ENTITY);
  }

  function getById(id) {
    var items = listar();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    throw new Error('TarefasDB.getById: tarefa nao encontrada: ' + id);
  }

  function criar(data) {
    var items = listar();
    var novo = data || {};
    if (novo.id == null) {
      novo.id = Date.now();
    }
    items.push(novo);
    DB.write(ENTITY, items);
    return novo;
  }

  function atualizar(id, updates) {
    var items = listar();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        var atual = items[i];
        items[i] = Object.assign({}, atual, updates, { id: atual.id });
        DB.write(ENTITY, items);
        return items[i];
      }
    }
    throw new Error('TarefasDB.atualizar: tarefa nao encontrada: ' + id);
  }

  function remover(id) {
    var items = listar();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        var removida = items.splice(i, 1)[0];
        DB.write(ENTITY, items);
        return removida;
      }
    }
    throw new Error('TarefasDB.remover: tarefa nao encontrada: ' + id);
  }

  return {
    listar: listar,
    getById: getById,
    criar: criar,
    atualizar: atualizar,
    remover: remover
  };
})();
