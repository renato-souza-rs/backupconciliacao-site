# 6. Calendário de 8 semanas: LinkedIn e Instagram (Metricool)

Arquivo: [`06-calendario-metricool.csv`](06-calendario-metricool.csv). São 16 temas, 2 por
semana (terça e quinta), de 27/10 a 17/12/2026. Cada tema vira **2 linhas**: uma para
o LinkedIn (08:30, com o link do guia no texto) e outra para o Instagram (12:00, texto
curto e "link na bio"). Total: 32 linhas, abaixo do limite recomendado pelo Metricool
(50 por arquivo).

**Regra editorial:** cada post fala de um **sintoma** que o financeiro do posto reconhece
(a venda que não caiu, o reembolso menor, a taxa que ninguém confere), nunca do método
ou do sistema. O CTA leva sempre a um guia, a uma página de operadora ou ao preço.
Números só os permitidos, sem nome de cliente.

| # | Data | Tema (sintoma) | CTA |
|---|---|---|---|
| 1 | 27/10/2026 (ter) | Venda que não caiu | /guias/getnet-nao-pagou-venda-do-posto/ |
| 2 | 29/10/2026 (qui) | Quanto custa conferir | /guias/quanto-custa-conciliadora-para-postos/ |
| 3 | 03/11/2026 (ter) | Reembolso da frota menor | /guias/conferir-reembolso-ticketlog-posto/ |
| 4 | 05/11/2026 (qui) | Taxa acima do contrato | /guias/taxa-cielo-acima-do-contrato-posto/ |
| 5 | 10/11/2026 (ter) | Mesmo abastecimento duas vezes | /guias/duplicidade-cartao-e-frota-mesmo-abastecimento/ |
| 6 | 12/11/2026 (qui) | Vendas fora da maquininha | /guias/conferir-shellbox-semparar-ctf-posto/ |
| 7 | 17/11/2026 (ter) | Cinco portais por semana | /guias/conciliacao-cartao-frota-posto/ |
| 8 | 19/11/2026 (qui) | Operadoras que ninguém confere | /operadoras/ |
| 9 | 24/11/2026 (ter) | Crédito da Rede menor que as vendas | /operadoras/rede/ |
| 10 | 26/11/2026 (qui) | Antecipação parecendo taxa | /operadoras/cielo/ |
| 11 | 01/12/2026 (ter) | Vale da conveniência | /operadoras/pluxee/ |
| 12 | 03/12/2026 (qui) | Cobrar sem prova | /operadoras/getnet/ |
| 13 | 08/12/2026 (ter) | Abastecimento em contingência | /operadoras/ctf/ |
| 14 | 10/12/2026 (qui) | Transação de frota recusada | /operadoras/ticketlog/ |
| 15 | 15/12/2026 (ter) | Fechamento por posto | /preco/ |
| 16 | 17/12/2026 (qui) | Fechamento de fim de ano | /guias/ |

## Como importar

> O formato abaixo segue a ajuda do Metricool (Importar CSV:
> https://help.metricool.com/en/article/how-to-schedule-posts-in-batch-with-a-csv-file-in-metricool-3wihqx/
> e erros comuns:
> https://help.metricool.com/pt/common-troubleshooting-when-importing-csv-into-metricool-m2lcv).
> **A ordem exata das colunas do modelo oficial não pôde ser confirmada**, por isso o
> passo 2 é obrigatório.

1. [ ] No Metricool: **Planejamento › Calendário › menu "⋯" › Import CSV**. Baixe o
       **modelo oficial** e abra no Excel ou no Google Planilhas.
2. [ ] Copie do nosso arquivo **coluna por coluna, pelo nome**, para o modelo oficial:
       `Text`, `Date`, `Time`, `Draft`, `LinkedIn`, `Instagram`, `Picture Url 1`,
       `First Comment Text`, `Brand Name`. Nas colunas das outras redes do modelo
       (Facebook, X, etc.), preencha **FALSE** em todas as linhas. **Não apague, não
       acrescente e não mude a ordem das colunas do modelo.** Essa é a causa mais comum
       de erro na importação.
3. [ ] **Imagens (obrigatório para o Instagram):** o Instagram não publica só texto.
       Para cada linha do Instagram, crie a arte (sugestão: a frase principal do post
       em fundo azul `#0d3b66`, com o logo) e cole em `Picture Url 1` a **URL pública
       direta do arquivo** (.jpg ou .png), não a página de visualização. No Google
       Drive, a ajuda do Metricool pede compartilhamento como editor. Se o modelo
       tiver uma coluna de tipo de post do Instagram, use **POST**.
       No LinkedIn a imagem é opcional; o link do guia já gera a prévia.
4. [ ] Salve como **CSV UTF-8** (no Excel: "CSV UTF-8 (delimitado por vírgulas)").
       Sem UTF-8, os acentos quebram.
5. [ ] Na importação, escolha o formato de data **AAAA-MM-DD** e de hora **HH:MM:SS**
       (é o formato do arquivo).
6. [ ] `Draft` está **TRUE** em todas as linhas: os posts entram como **rascunho**.
       Revise cada um no calendário e só então agende.
7. [ ] `First Comment Text` está vazio de propósito (texto nessa coluna é publicado
       como comentário).
8. [ ] LinkedIn: confirme no Metricool qual conta está conectada à marca (página da
       empresa ou perfil pessoal). Recomendação: perfil do Renato até a página da
       empresa ter seguidores; depois, os dois.

## Depois de publicar

- [ ] Responder os comentários no mesmo dia.
- [ ] Toda segunda: GA4 › Origem por página de destino e Search Console (rotina do
      `README.md`, "Como medir"). Tema que gera clique mas não gera lead: trocar o
      guia de destino. Tema que gera lead: repetir o sintoma com outro ângulo.
