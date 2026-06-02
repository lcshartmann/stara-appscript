# Copilot instructions

## Build, test, lint
- No local build, test, or lint commands are defined in this repository.

## High-level architecture
- **Google Apps Script (V8)** project: all `.gs` files share a single global scope; ES modules are not available.
- **Layered structure** (per architecture guide):
  - `config`: global settings and constants
  - `db`: Drive-backed JSON persistence per entity
  - `services`: business rules (auth, OP flow, events, tokens)
  - `routes`: functions invoked by the UI
  - `ui`: HTML helpers and templates
  - `main.gs`: entry points / wiring
- **Drive JSON database**: one JSON file per entity inside a Drive folder (e.g., `projetos.json`, `tarefas.json`). Data is read fully, mutated in memory, then written back.
- **Concurrency control**: writes must use `LockService` to avoid simultaneous edits.
- **Core domain** centers on Projetos, Tarefas, Materiais, OPs, Usuários, and Eventos; Eventos drive operational tracking and analytics.

## Key conventions
- **Namespace modules via IIFE**; avoid loose global functions. Prefer `ProjetosDB.listar()` over `function listarProjetos()`.
- **No Drive access from UI**: UI calls routes/services, services call DB.
- **DB access patterns**: keep a `DB_FOLDER_ID` and resolve files through a single `getFile(name)` helper; prefer `DriveApp.getFileById(...)` and avoid `getFilesByName` in loops; cache/reuse file IDs.
- **Write discipline**: read → mutate → write JSON; wrap writes with `LockService.getScriptLock().waitLock(30000)` and always release in `finally`.
- **UI styling**: use the defined palette and Geist font; never create buttons without `.btn`, and use `.card`/`.panel` as base surfaces; avoid inline styles.
