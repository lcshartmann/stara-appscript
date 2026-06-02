# 📁 Acesso a Dados no Google Apps Script (Drive JSON DB)

Este documento descreve como o sistema acessa e manipula dados armazenados no Google Drive, utilizado como banco de dados document-based.

O sistema é baseado no :contentReference[oaicite:0]{index=0} e utiliza o :contentReference[oaicite:1]{index=1} como camada persistente de armazenamento.

---

# 🧠 Visão Geral da Arquitetura

O sistema utiliza um modelo **document-based**, onde cada entidade é armazenada em um arquivo JSON separado dentro do Drive.

## 📦 Estrutura recomendada no Drive


ERP_DB/
projetos.json
tarefas.json
materiais.json
ops.json
usuarios.json
eventos.json


---

# 📌 Princípios do modelo

- 1 arquivo JSON por entidade
- Leitura rápida, escrita controlada
- Evitar múltiplas escritas concorrentes
- Dados sempre em memória (parse JSON)
- Persistência via Drive

---

# 📂 Acesso a arquivos no Drive

## 🔹 Buscar arquivo por ID (RECOMENDADO)

Mais rápido e confiável.

```js
const file = DriveApp.getFileById(FILE_ID);
🔹 Ler conteúdo do arquivo
const content = file.getBlob().getDataAsString();
const data = JSON.parse(content);
🔹 Escrever no arquivo
file.setContent(JSON.stringify(data, null, 2));
🔍 Buscar arquivos por nome
const files = DriveApp.getFilesByName("projetos.json");

if (files.hasNext()) {
  const file = files.next();
}

⚠️ Não recomendado para uso frequente (lento).

⚠️ Regras importantes de performance
❌ Evitar:
buscar arquivos por nome dentro de loops
múltiplas chamadas ao Drive em sequência
leitura repetida do mesmo arquivo
✅ Preferir:
armazenar FILE_ID ou usar cache
carregar dados uma vez e reutilizar
🧩 Funções base do sistema (DB Layer)
📖 Ler JSON
function readJson(name) {
  const file = getFile(name);
  const content = file.getBlob().getDataAsString();
  return JSON.parse(content);
}
💾 Escrever JSON
function writeJson(name, data) {
  const file = getFile(name);
  file.setContent(JSON.stringify(data, null, 2));
}
📁 Resolver arquivo dentro da pasta
const DB_FOLDER_ID = "SUA_PASTA_ID";

function getFile(name) {
  const folder = DriveApp.getFolderById(DB_FOLDER_ID);
  const files = folder.getFilesByName(name);

  if (!files.hasNext()) {
    throw new Error("Arquivo não encontrado: " + name);
  }

  return files.next();
}
🔒 Controle de concorrência (CRÍTICO)

Como múltiplos usuários podem escrever ao mesmo tempo, é necessário evitar corrupção de dados.

🔐 Lock de escrita
const lock = LockService.getScriptLock();

lock.waitLock(30000);

try {
  writeJson("projetos.json", data);
} finally {
  lock.releaseLock();
}
🧱 Padrão de uso do banco
📖 Leitura
const projetos = readJson("projetos.json");
✏️ Atualização
const projetos = readJson("projetos.json");

projetos.push({
  id: Date.now(),
  nome: "Novo Projeto"
});

writeJson("projetos.json", projetos);
⚙️ Camada de abstração recomendada

O ideal é encapsular o acesso ao Drive em uma camada única:

DB.projetos.listar()
DB.projetos.criar()
DB.projetos.atualizar()

Isso reduz:

duplicação de código
erros de leitura/escrita
complexidade do sistema