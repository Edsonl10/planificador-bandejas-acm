# Instalação no NAS — Planificador de Bandejas ACM

Esta configuração publica o Planificador de ACM dentro da rede local usando Docker e Nginx.

## Como funciona

- O sistema roda no NAS.
- Os PCs acessam pelo navegador.
- O Nginx aceita somente IPs privados de rede local (10.x, 172.16-31.x e 192.168.x).
- A porta padrão escolhida é 8088.
- Não é necessário instalar o sistema em cada PC.
- O GitHub continua sendo a origem do código.

## Instalação

1. No NAS, clone este repositório ou atualize a cópia existente.
2. Abra um terminal na pasta do projeto.
3. Execute:

```bash
docker compose up -d --build
```

4. Descubra o IP local do NAS, por exemplo: `192.168.1.50`.
5. Nos computadores da gráfica, abra:

```
http://IP-DO-NAS:8088
```

Exemplo:

```
http://192.168.1.50:8088
```

## Atualizações

Depois de publicar uma nova versão no GitHub:

```bash
git pull
docker compose up -d --build
```

Todos os PCs passam a usar a versão nova automaticamente.

## Segurança

- Não configure redirecionamento de porta no roteador para a porta 8088.
- Não exponha o container por Cloudflare Tunnel, reverse proxy público ou QuickConnect.
- O Nginx já bloqueia endereços que não pertençam às faixas privadas de rede.
- Se a rede da gráfica usa uma faixa mais específica, por exemplo `192.168.1.0/24`, podemos restringir ainda mais no `nginx.conf`.

## Próxima etapa

A próxima evolução é salvar os projetos em uma pasta compartilhada do próprio NAS e adicionar a tela de "Projetos recentes" com pesquisa por nome, cliente ou OS.
