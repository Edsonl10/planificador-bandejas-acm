# PROJECT_STATE

Atualizado em 28/10/2026.

## Estado atual
- Produção: planificador ACM/metalon estático em Docker/Nginx no NAS, porta 8088; acesso observado em `http://192.168.1.36:8088/led.html`. Os arquivos corrigidos estão ativos no contêiner em execução. Uma imagem atualizada foi construída a partir da fonte sincronizada e marcada como `planificador-bandejas-acm-planificador-acm:latest` (ID `67ecf3408cdc`); a recriação do contêiner de produção não foi testada.
- Fonte no NAS: `/share/CACHEDEV1_DATA/docker/planificador-bandejas-acm`. A alteração local anterior do HTML foi preservada no stash `antes-led-20261023`; conteúdo já incorporado à versão no GitHub.
- Para futuras atualizações: verificar primeiro o estado da cópia no NAS; usar `git pull` e `docker compose up -d --build` nessa pasta, preservando alterações locais. Não reutilizar a imagem antiga de setembro. A cópia no NAS foi sincronizada no commit de código `f255128d`; esta atualização posterior do estado é apenas documental.
- GitHub é a fonte de verdade. Ler `AGENTS.md` e este arquivo antes de alterar o projeto.

## Correções preparadas em 28/10
- Um SVG real com letras formadas por contornos fechados e sem preenchimento revelou uma regressão: o cálculo dizia que o desenho estava vazio. A correção trata contornos fechados com traço como áreas quando não existe nenhuma forma preenchida visível; desenhos mistos mantêm contornos decorativos sem preenchimento. Os arquivos corrigidos estão ativos no contêiner; a fonte e a imagem ainda precisam ser sincronizadas.
- Modo central: formas que tocam a borda do viewBox também recebem uma distribuição central, com as margens preservadas.
- Importação: preserva estilos comuns de vetores do Corel, regra de preenchimento, linhas sem preenchimento e recortes locais; mantém bloqueio de scripts, imagens, textos editáveis e clones.
- A atribuição de LEDs manuais e movidos usa a forma efetivamente selecionada, inclusive letras sem LEDs automáticos. Reserva inválida, medidas fora dos limites e resultados desatualizados bloqueiam exportação.
- ACM: abas negativas, dimensões que não comportam o desconto do quadro e quantidades inválidas interrompem o cálculo com mensagem.
- Scripts do LED e do worker têm versão na URL para evitar que o navegador reutilize o código antigo após atualizar o NAS.
- PR #2 integrado ao `main`; código sincronizado no NAS e em execução. Os arquivos anteriores do contêiner foram preservados temporariamente em `/tmp/led-fix-20261028/backup`, que não sobrevive à recriação do contêiner. A aplicação auxiliar de construção `planificador-build-20261028` terminou e ficou parada, sem portas publicadas; foi solicitada a parada do auxiliar `planificador-led-manutencao`.

## Validação e limites
- Testes locais: `node tests/led.test.js`, `node tests/led-svg.test.js`, `node tests/led-ui.test.js` e `node tests/acm-validation.test.js` passaram. Uma renderização SVG local confirmou preenchimento, contorno sem preenchimento e elementos ocultos.
- No navegador do NAS, a versão corrigida gerou 42 módulos no exemplo central, 90 na borda, 96 no preenchimento e 8,45 m de fita; a reserva negativa e a aba lateral negativa foram rejeitadas. A confirmação dos arquivos baixados e o teste com SVG real seguem pendentes.
- Em renderização e cálculo locais, o SVG real de contornos passou de máscara vazia para 12 elementos: 134 módulos no centro, 338 na borda e 466 no preenchimento, sem elementos vazios. O arquivo do cliente não foi adicionado ao repositório.
- No navegador do NAS, o teste sintético de contornos passou com vazado e desenho misto preservados; o exemplo padrão gerou 42 módulos com a nova versão.
- Distribuição geométrica indicativa para orçamento/montagem; não dimensiona circuitos ou fontes nem garante uniformidade luminosa. A fita usa trechos retos no intervalo de corte; emendas/conectores não entram na metragem.

## Próximo passo
- Sincronizar a correção e reconstruir a imagem; conferir os arquivos exportados e repetir o teste com o SVG real no navegador após recarregá-lo. Verificar o funcionamento após qualquer recriação.
