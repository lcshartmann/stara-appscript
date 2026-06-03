var ProjetosDB = (function () {
  var ENTITY = 'projetos';

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
    throw new Error('ProjetosDB.getById: projeto nao encontrado: ' + id);
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
    throw new Error('ProjetosDB.atualizar: projeto nao encontrado: ' + id);
  }

  function remover(id) {
    var items = listar();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        var removido = items.splice(i, 1)[0];
        DB.write(ENTITY, items);
        return removido;
      }
    }
    throw new Error('ProjetosDB.remover: projeto nao encontrado: ' + id);
  }

  return {
    listar: listar,
    getById: getById,
    criar: criar,
    atualizar: atualizar,
    remover: remover
  };
})();
