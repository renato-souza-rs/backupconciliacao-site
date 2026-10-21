# Site institucional — Conciliação de Postos

Landing page estática de divulgação do serviço de **conferência de cartões e conciliação bancária para redes de postos de combustíveis**.

Publicado em **https://backupconciliacao.com.br** via GitHub Pages.

## Conteúdo

- `index.html` — home (sem dependências/build)
- `conciliacao-3-way-postos/` e `conciliacao-bancaria-postos/` — páginas de serviço (SEO)
- `guias/` — guias práticos para o financeiro de redes de postos (índice + 1 pasta por guia)
- `operadoras/` — uma página por operadora (índice + 1 pasta por operadora)
- `sobre/` — quem está por trás (Organization + Person em JSON-LD)
- `estilo.css` / `site.js` — estilo e script **compartilhados** por todas as páginas
  (número do WhatsApp, menu mobile, eventos GA4 `click_whatsapp` / `click_email` /
  `click_cta` / `generate_lead`, todos com o parâmetro `origem`)
- `llms.txt` — resumo do site para buscadores de IA
- `llms-full.txt` — texto integral dos guias, operadoras e Sobre (gerado por
  `scripts/gerar_llms_full.py` a partir do HTML; rode de novo ao editar uma dessas páginas)
- `robots.txt` / `sitemap.xml` — indexação (robôs de IA liberados explicitamente)
- `9678734e48b55fdac521f9ea5d77ca23.txt` — chave IndexNow (Bing/Copilot); não apagar
- `CNAME` — domínio customizado do GitHub Pages

FAQ: o texto visível de cada `#faq` é **igual** ao JSON-LD `FAQPage` da mesma
página — ao editar um, edite o outro (o Google exige que batam).
Antes de abrir PR, rode:

- `python3 scripts/verificar_paginas.py` — FAQ visível = JSON-LD em todas as páginas, links
  internos, regras dos guias e das operadoras (title/description, JSON-LD, CTA), semelhança
  entre páginas de operadora (máx. 60%) e `llms-full.txt` atualizado.
- `NODE_PATH=$(npm root -g) node scripts/testar_paginas.js [pasta-dos-prints]` — Playwright
  em 1366 e 390 px: sem rolagem horizontal, sem erro de console, FAQ = JSON-LD no navegador,
  Origem do formulário e evento `click_cta` (requer `npm i -g playwright`).
- Todos os dados exibidos são **ilustrativos e fictícios** (LGPD) — nenhuma informação real de cliente.

## Como medir (Search Console + GA4)

Cada CTA tem um `data-origem` que identifica a página e a posição do botão:
`topo_guia_<slug>` / `guia_<slug>` nos guias, `topo_operadora_<slug>` / `operadora_<slug>`
nas operadoras, `sobre`, `cta_home`, `rodape` etc. O `site.js` envia essa origem em todos
os eventos:

| Evento GA4 | Quando dispara |
|---|---|
| `generate_lead` | formulário "30 dias sem cobrança" enviado com sucesso (o lead de verdade) |
| `click_whatsapp` | clique em qualquer link de WhatsApp |
| `click_email` | clique em qualquer link de e-mail |
| `click_cta` | clique nos demais botões com `data-origem` (ex.: "30 dias sem cobrança" do topo) |

Configuração única no GA4 (Administrador):

1. **Exibição de dados › Definições personalizadas › Criar dimensão personalizada**: nome
   `Origem`, escopo **Evento**, parâmetro `origem`. (Só vale para eventos a partir da criação.)
2. **Exibição de dados › Eventos**: marcar `generate_lead` como **evento principal**
   (key event). Opcional: `click_whatsapp` também.

Rotina mensal:

- **GA4 › Explorar › Formato livre**: linhas = `Origem` (e `Caminho da página`), valores =
  `Contagem de eventos`, filtro `Nome do evento` = `generate_lead`. Mostra quantos leads
  cada guia e cada operadora gerou. Repita com `click_whatsapp` e `click_cta`.
- **Search Console › Desempenho › Resultados da pesquisa**: filtro de página contendo
  `/guias/` (depois `/operadoras/`). Veja impressões, cliques e as consultas de cada página;
  consulta com muita impressão e pouco clique pede um title/description melhor.
- **Search Console › Inspeção de URL**: pedir indexação de cada página nova.
- Leads por guia (GA4) ÷ cliques do guia (Search Console) = taxa de conversão do guia.
  É ela que decide qual guia ganha o próximo esforço, não o tráfego.

## Como editar

1. Abra `index.html` em qualquer editor.
2. **Número do WhatsApp**: edite a constante `WHATSAPP` em `site.js` (formato `55DDDNUMERO`).
3. Commit + push para `main` → o GitHub Pages republica em ~1 min.

## Deploy

GitHub Pages a partir da branch `main` (raiz). Domínio configurado em Settings → Pages.

## DNS e HTTPS (configuração validada em 17/08/2026)

Zona DNS hospedada no **Registro.br** (servidores `a.sec.dns.br` / `c.sec.dns.br`),
tela "Configurar zona DNS" em **modo avançado**. Registros do site:

| Tipo | Nome | Dados |
|---|---|---|
| A | `backupconciliacao.com.br` | `185.199.108.153` |
| A | `backupconciliacao.com.br` | `185.199.109.153` |
| A | `backupconciliacao.com.br` | `185.199.110.153` |
| A | `backupconciliacao.com.br` | `185.199.111.153` |
| AAAA | `backupconciliacao.com.br` | `2606:50c0:8000::153` … `:8003::153` |
| CNAME | `www.backupconciliacao.com.br` | `renato-souza-rs.github.io` |

Os demais registros da zona são do **e-mail** do domínio — **não remover**. Desde
13/10/2026 o e-mail é **Google Workspace** (usuário `renatosouza@`, e `contato@` é
alias dele): MX `1 smtp.google.com`; TXT SPF `v=spf1 include:_spf.google.com
include:_spf.mail.hostinger.com ~all`; TXT `google._domainkey` (DKIM); TXT `_dmarc`
`v=DMARC1; p=none`; 2 TXT `google-site-verification`. Os 3 CNAME de DKIM
`hostingermail-*` e o include da Hostinger no SPF são da caixa Hostinger antiga
(`contato@`, que não recebe mais nada) e ficaram para permitir rollback: recriar
MX `5 mx1.hostinger.com` e `10 mx2.hostinger.com` devolve o e-mail à Hostinger.
O site não envia e-mail — a troca de MX não o afeta.

### O certificado não é emitido sozinho

Se o domínio customizado for adicionado ao Pages **antes** do DNS estar completo,
o GitHub não emite o certificado e **não sinaliza erro em lugar nenhum**: o site
continua no ar por HTTP e o Chrome mostra "Não seguro". Ficou assim de 20/06 a
16/08/2026 (57 dias). Corrigir o DNS depois **não** destrava sozinho.

Diagnóstico — o campo `https_certificate` simplesmente não existe na resposta:

```bash
gh api repos/renato-souza-rs/backupconciliacao-site/pages
```

Destravar (remove e re-adiciona o domínio; derruba o site por ~2 min):

```bash
# 1. remover
echo '{"cname":null,"source":{"branch":"main","path":"/"}}' \
  | gh api -X PUT repos/renato-souza-rs/backupconciliacao-site/pages --input -
# 2. aguardar ~60s e re-adicionar
gh api -X PUT repos/renato-souza-rs/backupconciliacao-site/pages \
  -f cname=backupconciliacao.com.br
# 3. após state=approved, forçar HTTPS (boolean exige --input; -f manda string e dá 422)
echo '{"https_enforced":true,"cname":"backupconciliacao.com.br","source":{"branch":"main","path":"/"}}' \
  | gh api -X PUT repos/renato-souza-rs/backupconciliacao-site/pages --input -
```

O remove/re-add gera 2 commits automáticos (`Delete CNAME` / `Create CNAME`) —
rodar `git pull` depois para não ficar atrás do remoto.

### Verificar

```bash
curl -s -o /dev/null -w "%{http_code} ssl=%{ssl_verify_result}\n" https://backupconciliacao.com.br/
```

Esperado: `200 ssl=0` (`ssl_verify_result=0` = cadeia válida). E `http://` deve
responder `301` para `https://`.

### Gotcha do Registro.br

O editor avançado **não permite editar o campo DADOS** de uma linha existente —
é preciso remover a linha e recriá-la. E ele **rejeita salvar vários tipos de
registro numa tacada só** (`POST freedns-advanced` → HTTP 400, sem mensagem na
tela e perdendo as alterações). Salvar em etapas: primeiro os A, depois os AAAA,
depois o CNAME.
