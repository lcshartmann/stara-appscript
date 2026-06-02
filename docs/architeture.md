# 🧩 Arquitetura JS Modular — Google Apps Script

Este documento define a estratégia de modularização do sistema ERP utilizando JavaScript puro no Google Apps Script.

---

# 🎯 Objetivo

Organizar o código em módulos reutilizáveis e desacoplados utilizando apenas recursos nativos do Google Apps Script.

O sistema utilizará:

* arquivos `.gs`
* namespaces globais
* módulos encapsulados com IIFE
* objetos globais organizados por responsabilidade

---

# ⚠️ Como o Apps Script funciona

No Google Apps Script:

* todos os arquivos compartilham o mesmo escopo global
* não existe suporte real a módulos ES (`import/export`)
* não existe runtime Node.js
* todos os arquivos são carregados juntos

Por isso, a modularização será feita através de objetos globais organizados.

---

# 🧠 Estratégia de Modularização

Cada módulo deve:

* encapsular lógica interna
* expor apenas métodos públicos
* evitar funções globais soltas

O padrão utilizado será:

```js
var NomeDoModulo = (function () {

  function metodoPrivado() {}

  function metodoPublico() {}

  return {
    metodoPublico: metodoPublico
  };

})();
```

---

# 📦 Estrutura de Pastas Recomendada

```txt
/config
  config.gs

/db
  db.gs
  projetos.gs
  tarefas.gs
  materiais.gs
  usuarios.gs
  ops.gs
  eventos.gs

/services
  auth.gs
  cache.gs
  tokens.gs
  op-service.gs
  eventos-service.gs

/routes
  admin.gs
  operador.gs

/ui
  html.gs

main.gs
```

---

# 📁 Descrição das Pastas

## `/config`

Configurações globais do sistema.

Exemplo:

* IDs de arquivos do Drive
* tempo de cache
* constantes do sistema

---

## `/db`

Camada de acesso aos dados.

Responsável por:

* leitura de JSON
* escrita no Drive
* cache
* persistência

Cada entidade possui seu próprio módulo.

---

## `/services`

Regras de negócio do sistema.

Exemplo:

* autenticação
* gerenciamento de OP
* eventos operacionais
* tokens

---

## `/routes`

Endpoints e funções chamadas pela interface.

Exemplo:

* adminGetProjetos()
* operadorIniciarOP()

---

## `/ui`

Helpers relacionados ao frontend HTML.

Exemplo:

* templates
* render helpers
* inclusão de partials

---

# 🧩 Padrão de Namespace

## ❌ Evitar

```js
function listarProjetos() {}
function criarProjeto() {}
```

Isso polui o escopo global e dificulta manutenção.

---

## ✅ Preferir

```js
ProjetosDB.listar()
ProjetosDB.criar()
```

---

# 📦 Exemplo — DB Module

```js
var ProjetosDB = (function () {

  function listar() {
    return DB.read('projetos');
  }

  function criar(nome) {
    var projetos = listar();

    projetos.push({
      id: Date.now(),
      nome: nome
    });

    DB.write('projetos', projetos);
  }

  return {
    listar: listar,
    criar: criar
  };

})();
```

---

# 📦 Exemplo — Core DB

```js
var DB = (function () {

  function read(key) {}

  function write(key, data) {}

  return {
    read: read,
    write: write
  };

})();
```

---

# 📦 Exemplo — Service Layer

```js
var AuthService = (function () {

  function login(usuario, senha) {}

  return {
    login: login
  };

})();
```

---

# 🔒 Encapsulamento com IIFE

O padrão:

```js
(function () {

})();
```

permite:

* esconder variáveis privadas
* evitar conflitos globais
* simular módulos
* organizar responsabilidades

---

# 🧱 Camadas do Sistema

## 📦 DB Layer

Responsável por:

* Drive
* cache
* persistência
* JSON

Exemplo:

```js
DB.read()
DB.write()
```

---

## ⚙️ Service Layer

Responsável por:

* regras de negócio
* autenticação
* eventos
* fluxo operacional

Exemplo:

```js
AuthService.login()
OPService.abrir()
```

---

## 🧩 Entity Modules

Responsável por:

* manipulação específica de entidades

Exemplo:

```js
ProjetosDB.listar()
MateriaisDB.criar()
```

---

# 🚀 Vantagens desta Arquitetura

* 100% compatível com Apps Script
* sem build step
* sem bundlers
* sem transpilers
* simples de manter
* fácil de debugar
* baixo acoplamento
* crescimento organizado

---

# ⚠️ Regras importantes

* evitar funções globais soltas
* usar namespaces por módulo
* nunca acessar Drive diretamente na UI
* separar persistência de regra de negócio
* reutilizar serviços sempre que possível

---

# 🎯 Conclusão

A modularização via namespaces globais + IIFE é a abordagem mais estável e compatível para sistemas médios no Google Apps Script.

Ela oferece:

* simplicidade operacional
* organização clara
* manutenção previsível
* compatibilidade total com o runtime do Apps Script

sendo ideal para o Mini ERP de Treinamento da Stara.
