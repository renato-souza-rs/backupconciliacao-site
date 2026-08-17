# Site institucional — Conciliação de Postos

Landing page estática de divulgação do serviço de **conferência de cartões e conciliação bancária para redes de postos de combustíveis**.

Publicado em **https://backupconciliacao.com.br** via GitHub Pages.

## Conteúdo

- `index.html` — página única (HTML + CSS + JS embutidos, sem dependências/build)
- `CNAME` — domínio customizado do GitHub Pages
- Todos os dados exibidos são **ilustrativos e fictícios** (LGPD) — nenhuma informação real de cliente.

## Como editar

1. Abra `index.html` em qualquer editor.
2. **Número do WhatsApp**: edite a constante `WHATSAPP` no `<script>` no fim do arquivo (formato `55DDDNUMERO`).
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

Os demais registros da zona (MX, SPF, DMARC e os 3 CNAME de DKIM `hostingermail-*`)
são do e-mail `contato@backupconciliacao.com.br` na Hostinger — **não remover**.

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
