# PROJECT_STATE

Atualizado em 23/10/2026.

## Estado atual
- Produção existente: planificador ACM/metalon estático em Docker/Nginx no NAS, porta 8088. Código principal em `outputs/planificador-bandejas-acm.html`.
- Módulo LED instalado e operacional em `http://192.168.1.43:8088/led.html`. PR #1 integrado ao main; versão funcional `190645f2`.
- Fonte no NAS sincronizada em `/share/CACHEDEV1_DATA/docker/planificador-bandejas-acm`. Alteração local anterior do HTML preservada no stash `antes-led-20261023`; conteúdo já incorporado à versão atual.
- Instalação feita no contêiner existente, sem interromper os demais serviços. Para futuras recriações, usar `git pull` e `docker compose up -d --build` nessa pasta; não recriar a partir da imagem antiga de setembro.
- Auxiliar `planificador-led-manutencao` usado só para sincronizar a pasta do projeto; manter parado após o trabalho.
- Navegação ACM/Metalon ↔ Letreiros LED. Dockerfile passa a copiar os arquivos auxiliares de `outputs/`.

## Letreiros LED
- Importa SVG com textos convertidos em curvas, dimensões reais e vazados compostos; processamento local em Web Worker.
- Modos: central, contornos externos/internos e preenchimento por fileiras horizontais/verticais.
- Módulo: comprimento/largura, vão livre, margem mínima da borda. Fita: largura e intervalo de corte; trechos retos, totais em metros.
- Preenchimento: vão entre LEDs e vão entre fileiras independentes. Reserva configurável; fita arredondada em intervalos de corte.
- Arrastar, girar, adicionar por duplo clique, excluir; contagem por elemento com identificação editável; SVG/PNG/Imprimir-PDF.
- Alterações de geometria bloqueiam exportação até recalcular. Distâncias da borda referem-se à lateral do LED; curvas podem exigir afastamento maior.

## Validação
- `node tests/led.test.js`: central, borda/vazados, preenchimento, orientação, margens, folgas independentes e colisões.
- SVG real da Milimili: 12 elementos reconhecidos nos 3 modos; verificadas margens/vãos e renderizações dos SVGs. Harness de DOM simulado verificou importação, cálculo, metragem e bloqueio de resultado desatualizado.
- Chrome conectado ao NAS: exemplo central 42 módulos, borda 90, preenchimento 96 e fita 8,45 m/169 trechos. Sem erros no console. Aba ACM preenchida pelo usuário preservada.
- Confirmação dos arquivos baixados nas exportações ainda pendente; acionamento do PNG não apresentou erro na aplicação.

## Decisões e limites
- GitHub é a fonte de verdade; ler AGENTS.md e este arquivo antes de alterar.
- Distribuição geométrica indicativa para orçamento/montagem. Não dimensiona circuitos/fontes nem garante uniformidade luminosa.
- Fita representada por trechos retos no intervalo de corte; emendas/conectores fora da metragem. Importação não aceita imagens, clones ou textos editáveis.

## Próximo passo
- Uso operacional; conferir importação e arquivos exportados no navegador com os próximos projetos reais. Manter mudanças e estado no GitHub.
