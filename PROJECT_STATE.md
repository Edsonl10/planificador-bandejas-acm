# PROJECT_STATE

Atualizado em 28/10/2026.

## Estado atual
- Produção: planificador ACM/metalon estático em Docker/Nginx no NAS, porta 8088; acesso observado em `http://192.168.1.36:8088/led.html`. O código em produção ainda corresponde à versão anterior do módulo LED, integrada em `190645f2`.
- Fonte no NAS: `/share/CACHEDEV1_DATA/docker/planificador-bandejas-acm`. A alteração local anterior do HTML foi preservada no stash `antes-led-20261023`; conteúdo já incorporado à versão no GitHub.
- Para atualizar a instalação após integrar as correções: verificar primeiro o estado da cópia no NAS; usar `git pull` e `docker compose up -d --build` nessa pasta, preservando alterações locais. Não recriar a partir da imagem antiga de setembro. O auxiliar `planificador-led-manutencao` foi usado apenas para manutenção e deve ficar parado depois.
- GitHub é a fonte de verdade. Ler `AGENTS.md` e este arquivo antes de alterar o projeto.

## Correções preparadas em 28/10
- Modo central: formas que tocam a borda do viewBox também recebem uma distribuição central, com as margens preservadas.
- Importação: preserva estilos comuns de vetores do Corel, regra de preenchimento, linhas sem preenchimento e recortes locais; mantém bloqueio de scripts, imagens, textos editáveis e clones.
- A atribuição de LEDs manuais e movidos usa a forma efetivamente selecionada, inclusive letras sem LEDs automáticos. Reserva inválida, medidas fora dos limites e resultados desatualizados bloqueiam exportação.
- ACM: abas negativas, dimensões que não comportam o desconto do quadro e quantidades inválidas interrompem o cálculo com mensagem.
- Scripts do LED e do worker têm versão na URL para evitar que o navegador reutilize o código antigo após atualizar o NAS.
- As correções estão preparadas no branch `fix/led-svg-validacao-20261028`; ainda não foram instaladas nem verificadas no NAS. A sessão QNAP estava na tela de login e o Desktop Commander estava offline.

## Validação e limites
- Testes locais: `node tests/led.test.js`, `node tests/led-svg.test.js`, `node tests/led-ui.test.js` e `node tests/acm-validation.test.js` passaram. Uma renderização SVG local confirmou preenchimento, contorno sem preenchimento e elementos ocultos.
- No navegador do NAS, a versão anterior gerou 42 módulos no exemplo central, 90 na borda, 96 no preenchimento e 8,45 m de fita. A confirmação dos arquivos baixados e o teste da nova versão com SVG real seguem pendentes.
- Distribuição geométrica indicativa para orçamento/montagem; não dimensiona circuitos ou fontes nem garante uniformidade luminosa. A fita usa trechos retos no intervalo de corte; emendas/conectores não entram na metragem.

## Próximo passo
- Após acesso ao NAS, integrar e instalar a correção preservando o estado local, testar no navegador os modos e exportações, conferir com um SVG real e atualizar este estado.
