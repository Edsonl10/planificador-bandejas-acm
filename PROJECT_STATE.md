# PROJECT_STATE

Atualizado em 09/11/2026.

## Estado atual
- Produção: planificador ACM/metalon estático em Docker/Nginx no NAS, porta 8088. A correção de travessas do commit `86f71e6` está ativa em `http://192.168.1.36:8088/`. A imagem `planificador-bandejas-acm-planificador-acm:latest` (ID `405b089a6c9e`) foi construída do mesmo commit e verificada pelo auxiliar `acm-build-travessas-20261109`, que terminou sem porta publicada. O contêiner de produção segue em execução com o HTML atualizado.
- Fonte no NAS: `/share/CACHEDEV1_DATA/docker/planificador-bandejas-acm`. A alteração local anterior do HTML foi preservada no stash `antes-led-20261023`; conteúdo já incorporado à versão no GitHub.
- Para futuras atualizações: verificar primeiro o estado da cópia no NAS; usar `git pull` e `docker compose up -d --build` nessa pasta, preservando alterações locais. Não reutilizar a imagem antiga de setembro. A última sincronização confirmada da cópia local no NAS foi no commit `5f57d123`. A imagem de 09/11 foi construída do arquivo compactado do GitHub; sincronizar o checkout antes de reconstruir a partir da pasta local.
- GitHub é a fonte de verdade. Ler `AGENTS.md` e este arquivo antes de alterar o projeto.

## Travessas do quadro ACM — 09/11
- A quantidade de centros das bandejas internas é uma preferência de posicionamento. Se houver menos centros do que travessas necessárias, o cálculo usa o comprimento do quadro, com vãos de até 150 cm e distância mínima de 5 cm das emendas.
- O teste de regressão de 955 × 170 cm, com bandejas verticais, gera 6 travessas verticais e 1 horizontal na chapa de 1,50 m. Na chapa de 1,22 m, mantém 7 verticais e 1 horizontal. Todos os testes locais passaram.
- Conferido no navegador do NAS com as duas chapas. Na chapa de 1,50 m, o maior vão do quadro de 954 × 169 cm foi de 137 cm. A cópia do HTML anterior ficou em `/tmp/acm-travessas.NkNieJ/index.html` no contêiner de produção.

## Correções preparadas em 28/10
- Um SVG real com letras formadas por contornos fechados e sem preenchimento revelou uma regressão: o cálculo dizia que o desenho estava vazio. A correção trata contornos fechados com traço como áreas quando não existe nenhuma forma preenchida visível; desenhos mistos mantêm contornos decorativos sem preenchimento. Os arquivos corrigidos estão ativos no contêiner, na fonte do NAS e na imagem construída.
- Modo central: formas que tocam a borda do viewBox também recebem uma distribuição central, com as margens preservadas.
- Importação: preserva estilos comuns de vetores do Corel, regra de preenchimento, linhas sem preenchimento e recortes locais; mantém bloqueio de scripts, imagens, textos editáveis e clones.
- A atribuição de LEDs manuais e movidos usa a forma efetivamente selecionada, inclusive letras sem LEDs automáticos. Reserva inválida, medidas fora dos limites e resultados desatualizados bloqueiam exportação.
- ACM: abas negativas, dimensões que não comportam o desconto do quadro e quantidades inválidas interrompem o cálculo com mensagem.
- Scripts do LED e do worker têm versão na URL para evitar que o navegador reutilize o código antigo após atualizar o NAS.
- PRs #2 e #3 integrados ao `main`; código sincronizado no NAS e em execução. Cópias anteriores dos arquivos foram preservadas temporariamente em `/tmp/led-fix-20261028/backup` e `/tmp/led-outline-backup-20261028`, que não sobrevivem à recriação. Os auxiliares de construção `planificador-build-20261028` e `led-build-contornos-20261028` terminaram e ficaram parados, sem portas publicadas; `planificador-led-manutencao` também foi parado.

## Validação e limites
- Testes locais: `node tests/led.test.js`, `node tests/led-svg.test.js`, `node tests/led-ui.test.js` e `node tests/acm-validation.test.js` passaram. Uma renderização SVG local confirmou preenchimento, contorno sem preenchimento e elementos ocultos.
- No navegador do NAS, a versão corrigida gerou 42 módulos no exemplo central, 90 na borda, 96 no preenchimento e 8,45 m de fita; a reserva negativa e a aba lateral negativa foram rejeitadas. A confirmação dos arquivos baixados e o teste com SVG real seguem pendentes.
- Em renderização e cálculo locais, o SVG real de contornos passou de máscara vazia para 12 elementos: 134 módulos no centro, 338 na borda e 466 no preenchimento, sem elementos vazios. O arquivo do cliente não foi adicionado ao repositório.
- No navegador do NAS, o teste sintético de contornos passou com vazado e desenho misto preservados; o exemplo padrão gerou 42 módulos com a nova versão.
- Distribuição geométrica indicativa para orçamento/montagem; não dimensiona circuitos ou fontes nem garante uniformidade luminosa. A fita usa trechos retos no intervalo de corte; emendas/conectores não entram na metragem.

## Próximo passo
- Recarregar a página, importar novamente o SVG real e testar o cálculo no navegador; conferir os arquivos exportados. Verificar o funcionamento após qualquer recriação do contêiner.
