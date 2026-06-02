# 📦 Mini ERP de Treinamento – Centro de Produção (Stara)

Sistema de gestão de projetos, tarefas, materiais e ordens de produção (OP), com foco em **treinamento de funcionários em ambiente simulado de fábrica**.

Este sistema tem como objetivo funcionar como um **mini centro de treinamento ERP**, simulando o fluxo real de produção da empresa, permitindo que operadores e gestores aprendam processos de forma controlada.

---

# 🎯 Objetivo do Sistema

- Simular um ambiente real de produção industrial
- Treinar operadores em execução de tarefas sequenciais
- Treinar gestores no controle de ordens de produção (OP)
- Registrar eventos operacionais (execução, pausas, conclusões)
- Medir desempenho e tempo de execução
- Criar rastreabilidade completa do processo produtivo

---

# 🧩 Entidades do Sistema

## 📁 Projeto

Representa um produto ou processo de produção.

```ts
Projeto {
  id: number
  nome: string
}
```

Responsabilidades
Agrupar tarefas de produção
Agrupar materiais necessários
Servir como base para Ordens de Produção (OP)

## ✅ Tarefa

Representa uma etapa do processo produtivo.

Tarefa {
  id: number
  projeto_id: number
  ordem: number
  nome: string
  descricao: string
  links: string[]
}
Responsabilidades
Definir sequência operacional (ordem de execução)
Orientar o operador durante o processo
Conter instruções e referências visuais
Ser executada dentro de uma OP

## 🧱 Material

Itens necessários para execução de um projeto.

Material {
  id: number
  projeto_id: number
  nome: string
  quantidade: string
}
Responsabilidades
Listar insumos necessários para produção
Apoiar planejamento de execução
Servir como referência de consumo teórico

## 🏭 Ordem de Produção (OP)

Representa a execução prática de um projeto.

OP {
  id: number
  projeto_id: number
  status: "aberta" | "em andamento" | "finalizada"
  quantidade_total: number
  quantidade_realizada: number
}
Responsabilidades
Controlar execução real do projeto
Monitorar progresso de produção
Representar uma instância ativa de um projeto
Servir como base para rastreamento de eventos


## 👤 Usuário

Usuários do sistema com diferentes permissões.

Usuario {
  id: number
  nome: string
  senha_hash: string
  role: "gestor" | "operador"
  ativo: boolean
}

## 🔐 Segurança de Senha
As senhas NÃO são armazenadas em texto puro
Utiliza hash seguro (bcrypt ou equivalente) antes do armazenamento
Nunca é possível recuperar a senha original
Apenas validação por comparação de hash
Responsabilidades
Autenticação no sistema
Controle de acesso por função (role)
Restrição de ações por perfil

## 📊 Evento

Entidade responsável por registrar ações dentro da execução de uma OP.

Tipos de eventos:
conclusão de tarefa
pausa
retomada de execução
início de tarefa
Evento {
  id: number
  op_id: number
  tarefa_id: number

  tipo: "inicio" | "conclusao" | "pausa" | "retomada"

  timestamp_inicio: Date
  timestamp_fim: Date | null

  duracao_segundos: number

  observacao: string
}
Responsabilidades
Registrar histórico completo de execução
Medir tempo real de operação
Rastrear pausas e justificativas
Criar base de auditoria e análise de produtividade


## 🔗 Relacionamentos
Projeto → Tarefas
Relacionamento: 1:N
Um projeto contém várias tarefas
Projeto → Materiais
Relacionamento: 1:N
Um projeto define seus materiais
Projeto → OP
Relacionamento: 1:N
Várias ordens podem ser abertas para o mesmo projeto
OP → Eventos
Relacionamento: 1:N
Uma OP gera múltiplos eventos operacionais
Tarefa → Eventos
Relacionamento: 1:N
Cada tarefa pode ter múltiplos eventos de execução


## 👨‍🏭 Perfis de Usuário
## 🧑‍💼 Gestor

Responsável por:

Criar e gerenciar projetos
Definir tarefas e materiais
Gerenciar usuários do sistema
Abrir e acompanhar OPs
Analisar desempenho operacional

## 🧑‍🔧 Operador

Responsável por:

Executar tarefas da OP
Registrar conclusão de etapas
Pausar e retomar atividades
Seguir instruções do sistema
Reportar observações de execução


## ⚙️ Fluxo Operacional
Gestor cria um projeto
Define tarefas ordenadas e materiais
Abre uma Ordem de Produção (OP)
Operador inicia execução
Eventos são registrados:
início
pausa
retomada
conclusão
OP é atualizada conforme progresso
OP é finalizada ao atingir quantidade total
📊 Papel do sistema no treinamento

Este sistema simula um ambiente industrial real da Stara, permitindo:

Treinamento de operadores em fluxo real de produção
Treinamento de gestores em controle de produção
Simulação de situações reais de fábrica
Desenvolvimento de disciplina operacional
Análise de eficiência e tempo de execução
📌 Observações importantes
Eventos são a base de toda análise do sistema
O sistema prioriza rastreabilidade total da operação
A senha agora é armazenada com hash seguro (sem exceções)
O sistema é projetado como ambiente de treinamento, não produção real