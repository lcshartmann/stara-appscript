# 🧩 Stara AppScript - Mini ERP

Este projeto é um Mini ERP desenvolvido em **Google Apps Script (GAS)**, projetado para treinamento operacional na Stara. Ele utiliza uma arquitetura modular baseada em JavaScript puro e armazena dados em arquivos JSON no Google Drive.

---

## 🏗️ Arquitetura e Tecnologias

- **Linguagem:** JavaScript (Google Apps Script Runtime V8).
- **Tooling:** [clasp](https://github.com/google/clasp) para desenvolvimento local e sincronização.
- **Banco de Dados:** Document-based utilizando arquivos `.json` no Google Drive (Pasta `ERP_DB`).
- **Frontend:** HTML/CSS/JS processados pelo `HtmlService` do Apps Script.
- **Modularização:** Padrão IIFE (Immediately Invoked Function Expression) com namespaces globais para evitar colisão de nomes e poluição do escopo global.

---

## 📂 Estrutura de Pastas

```txt
/docs           # Documentação técnica detalhada (Arquitetura, DB, Estilos).
/src            # Código fonte do projeto.
  /db           # Camada de persistência (Módulos de acesso ao Drive).
  /services     # Regras de negócio e lógica de autenticação.
  /ui           # Templates HTML e arquivos de interface.
  main.gs       # Entry points (doGet, doPost) e funções globais.
  appsscript.json # Configuração do manifesto do Apps Script.
.clasp.json     # Configuração do clasp (ID do script, diretório raiz).
```

---

## 🛠️ Comandos Principais (clasp)

Como este projeto utiliza o `clasp`, os comandos abaixo são essenciais para o fluxo de trabalho:

- **Sincronizar local -> nuvem:** `clasp push`
- **Sincronizar nuvem -> local:** `clasp pull`
- **Abrir no editor do navegador:** `clasp open`
- **Fazer deploy de uma versão:** `clasp deploy`

---

## 🧠 Convenções de Desenvolvimento

Para manter a consistência e manutenibilidade, siga estas diretrizes:

1.  **Modularização:** Sempre encapsule novos módulos usando IIFE.
    ```javascript
    var MeuModulo = (function () {
      function privado() {}
      function publico() { return "olá"; }
      return { publico: publico };
    })();
    ```
2.  **Separação de Camadas:**
    -   **DB Layer:** Apenas leitura/escrita de dados (ex: `src/db/`).
    -   **Service Layer:** Regras de negócio, validações e orquestração (ex: `src/services/`).
    -   **UI Layer:** Apenas apresentação e chamadas simples ao backend.
3.  **Evite Funções Globais:** Exceto para `doGet`, `doPost` e funções chamadas diretamente pelo `google.script.run` no frontend, todas as funções devem residir dentro de um namespace.
4.  **Concorrência:** Ao realizar operações de escrita no "banco de dados" (Drive), utilize o `LockService` para evitar corrupção de arquivos JSON.
5.  **Namespaces Relevantes:**
    -   `DB`: Operações genéricas de leitura/escrita no Drive.
    -   `AuthService`: Login, permissões e sessões.
    -   `Router`: Navegação entre as telas do sistema.
    -   `[Entidade]DB`: (Ex: `ProjetosDB`) Métodos específicos para manipulação de uma entidade.

---

## 📝 Documentação Complementar

-   **Arquitetura:** Veja `docs/architeture.md` para detalhes sobre o padrão de módulos.
-   **Banco de Dados:** Veja `docs/db.md` para entender como os arquivos JSON são gerenciados no Drive.
-   **Rotas:** Veja `src/services/router.gs` para adicionar novas telas ao sistema.
