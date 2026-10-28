# PROJECT_STATE

Atualizado em 28/10/2026.

## Estado atual
- Produção: planificador ACM/metalon estático em Docker/Nginx no NAS, porta 8088; acesso observado em `http://192.168.1.36:8088/led.html`. Os arquivos corrigidos do branch foram copiados para o contêiner em execução; a imagem ainda precisa ser reconstruída a partir da fonte atualizada antes de recriar o contêiner.
- Fonte no NAS: `/share/CACHEDEV1_DATA/docker/planificador-bandejas-acm`. A alteração local anterior do HTML foi preservada no stash `antes-led-20261023`; conteúdo já incorporado à versão no GitHub.
- Para atualizar a instalação após integrar as correções: verificar primeiro o estado da cópia no NAS; usar `git pull` e `docker compose up -d --build` nessa pasta, preservando alterações locais. Não recriar a partir da imagem antiga de setembro. O auxiliar `planificador-led-manutencao` foi usado apenas para manutenção e deve ficar parado depois.
- GitHub é a fonte de verdade. Ler `AGENTS.md` e este arquivo antes de alterar o projeto.

## Correções preparadas em 28/10
- Modo central: formas que tocam a borda do viewBox também recebem uma distribuição central, com as margens preservadas.
- Importação: preserva estilos comuns de vetores do Corel, regra de preenchimento, linhas sem preenchimento e recortes locais; mantém bloqueio de scripts, imagens, textos editáveis e clones.
- A atribuição de LEDs manuais e movidos usa a forma efetivamente selecionada, inclusive letras sem LEDs automáticos. Reserva inválida, medidas fora dos limites e resultados desatualizados bloqueiam exportação.
- ACM: abas negativas, dimensões que não comportam o desconto do quadro e quantidades inválidas interrompem o cálculo com mensagem.
- Scripts do LED e do worker têm versão na URL para evitar que o navegador reutilize o código antigo após atualizar o NAS.
- As correções estão no branch `fix/led-svg-validacao-20261028` e nos arquivos do contêiner em execução. A sincronização da cópia Git no NAS e a reconstrução da imagem ainda precisam ser concluídas. Os arquivos anteriores do contêiner foram preservados em `/tmp/led-fix-20261028/backup`.

## Validação e limites
- Testes locais: `node tests/led.test.js`, `node tests/led-svg.test.js`, `node tests/led-ui.test.js` e `node tests/acm-validation.test.js` passaram. Uma renderização SVG local confirmou preenchimento, contorno sem preenchimento e elementos ocultos.
- No navegador do NAS, a versão corrigida gerou 42 módulos no exemplo central, 90 na borda, 96 no preenchimento e 8,45 m de fita; a reserva negativa e a aba lateral negativa foram rejeitadas. A confirmação dos arquivos baixados e o teste com SVG real seguem pendentes.
- Distribuição geométrica indicativa para orçamento/montagem; não dimensiona circuitos ou fontes nem garante uniformidade luminosa. A fita usa trechos retos no intervalo de corte; emendas/conectores não entram na metragem.

## Próximo passo
- Integrar a correção, sincronizar a cópia Git no NAS e reconstruir a imagem. Conferir os arquivos exportados e testar com um SVG real, depois atualizar este estado.
