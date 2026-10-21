# 1. Google Search Console e Bing Webmaster Tools

Objetivo: o Google e o Bing (que alimenta o Copilot e parte do ChatGPT) passam a ler o
sitemap, indexar os guias e as páginas de operadora e mostrar as consultas que trazem
gerentes financeiros ao site. Tempo estimado: 30 a 40 minutos, mais a espera do DNS.

> **Antes de mexer no DNS, leia a seção "DNS e HTTPS" do `README.md` do repositório.**
> A zona tem registros do e-mail (Google Workspace) que **não podem ser removidos**:
> MX `1 smtp.google.com`, TXT SPF `v=spf1 include:_spf.google.com include:_spf.mail.hostinger.com ~all`,
> TXT `google._domainkey` (DKIM), TXT `_dmarc` e os 2 TXT `google-site-verification`
> que já existem, além dos 3 CNAME `hostingermail-*`. Apagar qualquer um deles derruba
> ou degrada o e-mail de `contato@` e `renatosouza@`.

---

## 1.1 Search Console: propriedade de domínio

A propriedade **de domínio** cobre `https://`, `http://`, com e sem `www` de uma vez.
Ela só é verificada por registro DNS (TXT).

- [ ] **Antes de tudo, veja se já existe.** Abra https://search.google.com/search-console
      com a conta do Google que vai administrar o site. Se `backupconciliacao.com.br`
      já aparecer na lista de propriedades como **Domínio** e verificada, pule para o 1.2.
      (A zona já tem 2 TXT `google-site-verification`; um deles pode ser de uma
      verificação anterior do Search Console ou do Workspace.)
- [ ] **Adicionar propriedade** › tipo **Domínio** › digite `backupconciliacao.com.br`
      (sem `https://` e sem `www`) › Continuar.
- [ ] O Google mostra um registro do tipo **TXT** com o valor
      `google-site-verification=XXXXXXXX…`. **Copie o valor inteiro.**
      - Se o valor for **igual** a um dos 2 TXT `google-site-verification` que já estão na
        zona, não precisa criar nada: clique em **Verificar**.
      - Se for diferente, siga o 1.1.1.

### 1.1.1 Criar o TXT no Registro.br (modo avançado)

- [ ] Entre em https://registro.br › **Painel** › clique no domínio
      `backupconciliacao.com.br` › **DNS** › **Configurar zona DNS**.
      A zona está em **modo avançado** (é o modo em uso; não troque).
- [ ] Clique em **Nova entrada** e preencha **só** esta linha:

  | Campo | Valor |
  |---|---|
  | Tipo | `TXT` |
  | Nome | deixe em branco (= o próprio `backupconciliacao.com.br`) |
  | Dados | `google-site-verification=XXXXXXXX…` (o valor copiado, sem aspas) |

- [ ] **Salve agora, antes de qualquer outra alteração.** O editor do Registro.br
      **rejeita salvar vários tipos de registro de uma vez** (dá erro HTTP 400 sem
      mensagem e perde tudo). Um tipo de registro por vez, sempre.
- [ ] **Não edite nenhuma linha existente.** O editor não deixa alterar o campo DADOS
      de uma linha: para mudar, é preciso **remover e recriar**. Para esta tarefa
      **não é preciso remover nada**; só **adicionar** a linha nova.
- [ ] Confira que o TXT do **SPF** (`v=spf1 …`) continua lá, intacto. O SPF também é um
      TXT na raiz; são duas linhas TXT diferentes e as duas devem existir.
- [ ] Confira que o resolvedor público já enxerga o registro (pode levar de minutos a
      algumas horas):
      - https://toolbox.googleapps.com/apps/dig/#TXT/backupconciliacao.com.br
      - ou, no terminal: `nslookup -type=TXT backupconciliacao.com.br 8.8.8.8`
      O valor novo deve aparecer **junto** com o SPF e os TXT antigos.
- [ ] Volte ao Search Console e clique em **Verificar**. Se falhar, espere 1 hora e
      tente de novo (não recrie o registro).

### 1.1.2 Se algo der errado no DNS

- E-mail parou de chegar: confira se o MX `1 smtp.google.com` ainda existe. Recrie-o
  se foi apagado (tipo MX, nome em branco, prioridade 1, dados `smtp.google.com`).
- Site fora do ar: confira os 4 registros A `185.199.108-111.153` e o CNAME do `www`
  (tabela no README). Recrie o que faltar, **um tipo por vez**.

---

## 1.2 Search Console: sitemap e indexação

- [ ] Menu **Sitemaps** › em "Adicionar um novo sitemap" digite `sitemap.xml` › **Enviar**.
      Status esperado em até alguns dias: **Concluído**, com 25 URLs descobertos.
- [ ] Menu **Inspeção de URL** › cole cada URL abaixo › **Solicitar indexação**
      (o Google limita alguns pedidos por dia; comece pelos de intenção de compra):
  - [ ] https://backupconciliacao.com.br/guias/quanto-custa-conciliadora-para-postos/
  - [ ] https://backupconciliacao.com.br/preco/
  - [ ] https://backupconciliacao.com.br/guias/getnet-nao-pagou-venda-do-posto/
  - [ ] https://backupconciliacao.com.br/guias/taxa-cielo-acima-do-contrato-posto/
  - [ ] https://backupconciliacao.com.br/guias/conferir-reembolso-ticketlog-posto/
  - [ ] https://backupconciliacao.com.br/guias/
  - [ ] https://backupconciliacao.com.br/operadoras/
  - [ ] https://backupconciliacao.com.br/sobre/
  - [ ] os demais guias e páginas de operadora, nos dias seguintes.
- [ ] **Configurações › Usuários e permissões**: adicione um segundo proprietário
      (outra conta sua) para não perder o acesso.

## 1.3 Bing Webmaster Tools (Bing, Copilot e parte do ChatGPT)

- [ ] Abra https://www.bing.com/webmasters e entre com uma conta Microsoft ou Google.
- [ ] Escolha **Importar do Google Search Console** (opção da tela inicial), autorize e
      marque `backupconciliacao.com.br`. O Bing importa a propriedade verificada e o
      sitemap; não precisa mexer no DNS de novo.
- [ ] Em **Sitemaps**, confirme que `https://backupconciliacao.com.br/sitemap.xml`
      aparece; se não, adicione.
- [ ] **IndexNow** (avisa o Bing na hora, sem esperar o robô): o site já tem a chave
      publicada em https://backupconciliacao.com.br/9678734e48b55fdac521f9ea5d77ca23.txt
      (**não apague este arquivo**). Depois de cada publicação, rode no terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "host": "backupconciliacao.com.br",
    "key": "9678734e48b55fdac521f9ea5d77ca23",
    "keyLocation": "https://backupconciliacao.com.br/9678734e48b55fdac521f9ea5d77ca23.txt",
    "urlList": [
      "https://backupconciliacao.com.br/guias/",
      "https://backupconciliacao.com.br/operadoras/",
      "https://backupconciliacao.com.br/sobre/",
      "https://backupconciliacao.com.br/llms-full.txt"
    ]
  }'
```

  Resposta `200` ou `202` = recebido. Inclua no `urlList` as páginas novas ou alteradas
  (os guias e as operadoras estão no `sitemap.xml`).

## 1.4 Depois de 2 a 4 semanas

- [ ] Search Console › **Páginas**: todos os guias e operadoras como "Indexada".
      Se algum aparecer como "Rastreada, mas não indexada", anote e me avise.
- [ ] Search Console › **Desempenho**: filtro de página contendo `/guias/`.
      É a rotina de medição descrita no `README.md` ("Como medir").
