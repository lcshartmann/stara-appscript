var DB = (function () {
  var DB_FOLDER_NAME = 'erp_treinamento';
  var props = PropertiesService.getScriptProperties();
  var FILE_OBJ_CACHE = {}; // Cache de objetos de arquivo para a execução atual

  function getDbFolderId() {
    var folderId = props.getProperty('DB_FOLDER_ID');
    
    if (folderId) {
      try {
        // Valida se a pasta ainda existe e é acessível
        DriveApp.getFolderById(folderId);
        return folderId;
      } catch (e) {
        // ID inválido ou deletado, limpa e continua para busca nominal
        props.deleteProperty('DB_FOLDER_ID');
      }
    }

    var folders = DriveApp.getFoldersByName(DB_FOLDER_NAME);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DB_FOLDER_NAME);
    folderId = folder.getId();
    props.setProperty('DB_FOLDER_ID', folderId);
    return folderId;
  }

  function getDbFolder() {
    return DriveApp.getFolderById(getDbFolderId());
  }

  function getOrCreateFile(entityName) {
    if (FILE_OBJ_CACHE[entityName]) {
      return FILE_OBJ_CACHE[entityName];
    }

    var propKey = 'DB_FILE_ID_' + entityName;
    var fileId = props.getProperty(propKey);

    if (fileId) {
      try {
        var file = DriveApp.getFileById(fileId);
        FILE_OBJ_CACHE[entityName] = file;
        return file;
      } catch (e) {
        props.deleteProperty(propKey);
      }
    }

    var folder = getDbFolder();
    var fileName = entityName + '.json';
    var files = folder.getFilesByName(fileName);
    var file = files.hasNext() ? files.next() : folder.createFile(fileName, '[]', MimeType.PLAIN_TEXT);

    props.setProperty(propKey, file.getId());
    FILE_OBJ_CACHE[entityName] = file;
    return file;
  }

  function read(entityName) {
    var file = getOrCreateFile(entityName);
    var content = file.getBlob().getDataAsString();

    if (!content || content.trim() === '') {
      return [];
    }

    try {
      var data = JSON.parse(content);
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (e) {
      Logger.log('DB.read Error: ' + e.message);
      return [];
    }
  }

  function write(entityName, data) {
    var lock = LockService.getScriptLock();
    // Aumentado timeout para 5 segundos para maior segurança em concorrência
    lock.waitLock(5000);

    try {
      var file = getOrCreateFile(entityName);
      // Removida indentação (null, 2) para reduzir tamanho do arquivo e tempo de CPU
      file.setContent(JSON.stringify(data));
    } finally {
      lock.releaseLock();
    }
  }

  function clearFileIdCache() {
    var allProps = props.getProperties();
    for (var key in allProps) {
      if (key.indexOf('DB_FILE_ID_') === 0 || key === 'DB_FOLDER_ID') {
        props.deleteProperty(key);
      }
    }
  }

  function initialDbSetup() {
    var seed = {
      projetos: [
        { 
          id: 1, 
          nome: 'Linha de Montagem A',
          materiais: [
            { id: 1, nome: 'Parafuso M6', quantidade: '20' },
            { id: 2, nome: 'Suporte metalico', quantidade: '4' }
          ],
          tarefas: [
            { id: 1, ordem: 1, nome: 'Preparar bancada', descricao: 'Separar ferramentas e EPIs.', links: [] },
            { id: 2, ordem: 2, nome: 'Montar componente', descricao: 'Fixar componente no gabarito.', links: [] }
          ]
        },
        { 
          id: 2, 
          nome: 'Calibracao de Sensores',
          materiais: [
            { id: 3, nome: 'Sensor indutivo', quantidade: '2' }
          ],
          tarefas: [
            { id: 3, ordem: 1, nome: 'Checar sensores', descricao: 'Validar leitura inicial.', links: [] }
          ]
        }
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
