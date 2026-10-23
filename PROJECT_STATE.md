# PROJECT_STATE

Atualizado em 23/10/2026.

## Estado atual
- Produção existente: planificador ACM/metalon estático em Docker/Nginx no NAS, porta 8088. Código principal em `outputs/planificador-bandejas-acm.html`.
- Novo módulo `outputs/led.html` preparado em branch de funcionalidade; instalação no NAS pendente. Acesso remoto disponível está offline.
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
- Conferência completa em navegador real pendente: Chromium indisponível e download bloqueado no ambiente atual.

## Decisões e limites
- GitHub é a fonte de verdade; ler AGENTS.md e este arquivo antes de alterar.
- Distribuição geométrica indicativa para orçamento/montagem. Não dimensiona circuitos/fontes nem garante uniformidade luminosa.
- Fita representada por trechos retos no intervalo de corte; emendas/conectores fora da metragem. Importação não aceita imagens, clones ou textos editáveis.

## Próximo passo
- Revisar/testar a tela no navegador real e instalar a branch aprovada no NAS. Não declarar implantação concluída antes disso.
