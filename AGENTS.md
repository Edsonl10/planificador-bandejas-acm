# AGENTS.md — Continuidade do projeto

## Protocolo obrigatório de continuidade

Este repositório pode ser trabalhado em computadores, chats e agentes diferentes. A continuidade é responsabilidade do agente, não do usuário.

### Antes de qualquer alteração
1. Confirme que está trabalhando sobre a versão mais recente do repositório/branch no GitHub.
2. Leia este `AGENTS.md` e todas as instruções permanentes específicas do projeto.
3. Leia `PROJECT_STATE.md` integralmente.
4. Inspecione o código e os arquivos diretamente relacionados ao pedido antes de editar.
5. Não peça ao usuário para lembrar onde o trabalho parou quando essa informação puder ser obtida do repositório.

### Ao concluir uma alteração relevante
1. Atualize `PROJECT_STATE.md` no mesmo ciclo da alteração.
2. Registre somente o estado útil para retomada: estado atual, mudanças relevantes, decisões aprovadas, pendências/bloqueios, validações realizadas e próximo passo.
3. Mantenha `PROJECT_STATE.md` curto e atual; ele não é um diário. O histórico detalhado pertence aos commits.
4. Não rediscuta decisões já registradas como aprovadas, salvo nova instrução explícita do usuário ou conflito técnico comprovado.
5. Nunca registre segredos, tokens, senhas ou dados sensíveis no arquivo de estado.

### Regra de handoff
Qualquer agente que assumir este projeto deve conseguir receber um pedido direto de alteração e se situar sozinho lendo o GitHub, as instruções permanentes e o `PROJECT_STATE.md`. O usuário não precisa dizer “continue de onde parou”.
