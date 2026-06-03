var DB = (function () {
  var DB_FOLDER_NAME = 'erp_treinamento';
  var FOLDER_ID_CACHE = null;
  var FILE_ID_CACHE = {};

  function getDbFolderId() {
    if (FOLDER_ID_CACHE) {
      return FOLDER_ID_CACHE;
    }

    var folders = DriveApp.getFoldersByName(DB_FOLDER_NAME);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DB_FOLDER_NAME);
    FOLDER_ID_CACHE = folder.getId();
    return FOLDER_ID_CACHE;
  }

  function getDbFolder() {
    var folderId = getDbFolderId();
    return DriveApp.getFolderById(folderId);
  }

  function getOrCreateFile(entityName) {
    var fileName = entityName + '.json';

    if (FILE_ID_CACHE[fileName]) {
      return DriveApp.getFileById(FILE_ID_CACHE[fileName]);
    }

    var folder = getDbFolder();
    var files = folder.getFilesByName(fileName);
    var file = files.hasNext() ? files.next() : folder.createFile(fileName, '[]', MimeType.PLAIN_TEXT);

    FILE_ID_CACHE[fileName] = file.getId();
    return file;
  }

  function read(entityName) {
    var file = getOrCreateFile(entityName);
    var content = file.getBlob().getDataAsString();

    if (!content || content.trim() === '') {
      return [];
    }

    var data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('DB.read: invalid JSON format for ' + entityName + ', expected array.');
    }

    return data;
  }

  function write(entityName, data) {
    //var lock = LockService.getScriptLock();
    //lock.waitLock(30000);

    try {
      var file = getOrCreateFile(entityName);
      file.setContent(JSON.stringify(data, null, 2));
    } finally {
      //lock.releaseLock();
    }
  }

  function initialDbSetup() {
    var seed = {
      projetos: [
        { id: 1, nome: 'Linha de Montagem A' },
        { id: 2, nome: 'Calibracao de Sensores' }
      ],
      tarefas: [
        { id: 1, projeto_id: 1, ordem: 1, nome: 'Preparar bancada', descricao: 'Separar ferramentas e EPIs.', links: [] },
        { id: 2, projeto_id: 1, ordem: 2, nome: 'Montar componente', descricao: 'Fixar componente no gabarito.', links: [] },
        { id: 3, projeto_id: 2, ordem: 1, nome: 'Checar sensores', descricao: 'Validar leitura inicial.', links: [] }
      ],
      materiais: [
        { id: 1, projeto_id: 1, nome: 'Parafuso M6', quantidade: '20' },
        { id: 2, projeto_id: 1, nome: 'Suporte metalico', quantidade: '4' },
        { id: 3, projeto_id: 2, nome: 'Sensor indutivo', quantidade: '2' }
      ],
      ops: [
        { id: 1, projeto_id: 1, status: 'aberta', quantidade_total: 10, quantidade_realizada: 0 },
        { id: 2, projeto_id: 2, status: 'em andamento', quantidade_total: 5, quantidade_realizada: 2 }
      ],
      usuarios: [
        { id: 1, nome: 'Gestor', senha_hash: 'hash_mock_gestor', role: 'gestor', ativo: true },
        { id: 2, nome: 'Operador', senha_hash: 'hash_mock_operador', role: 'operador', ativo: true }
      ],
      eventos: [
        {
          id: 1,
          op_id: 2,
          tarefa_id: 3,
          tipo: 'inicio',
          timestamp_inicio: new Date().toISOString(),
          timestamp_fim: null,
          duracao_segundos: 0,
          observacao: 'Inicio da operacao'
        }
      ]
    };

    Object.keys(seed).forEach(function (entityName) {
      var existing = read(entityName);
      if (existing.length === 0) {
        write(entityName, seed[entityName]);
      }
    });
  }

  return {
    read: read,
    write: write,
    initialDbSetup: initialDbSetup
  };
})();
