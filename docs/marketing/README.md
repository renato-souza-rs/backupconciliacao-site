# Marketing fora do código — o que o owner faz

Tudo aqui é para o Renato executar fora do repositório. Nenhuma página do site aponta
para estes arquivos e eles não estão no `sitemap.xml`.

> **Atenção antes do merge no `main`:** o GitHub Pages publica o repositório inteiro. Sem
> configuração, estes `.md` ficariam acessíveis por URL direta
> (`backupconciliacao.com.br/docs/marketing/...`), inclusive a **proposta não aprovada**
> do Raio-X. Para não publicar, a solução é um arquivo `_config.yml` na raiz com
> `exclude: [docs]` (o Jekyll do Pages deixa de copiar a pasta), **ou** manter esta
> pasta fora do `main`. Decisão do owner; ver a descrição do PR.

Regras que valem para todos os textos: só os fatos permitidos (preço; "Use e pague após
30 dias. Garantia de 7 dias: se não servir, não há cobrança."; "36 operadoras no nosso fluxo";
"mais de R$ 800 milhões em vendas de cartão e mais de 9 milhões de transações conferidas
por ano, em mais de 50 empresas"); nada de comparação com conciliadora ou concorrente, nem
período da medição; nunca "teste", "grátis", "sem cobrança" ou "antes da primeira
cobrança"; robô pode, mas nunca dizer ou insinuar que o robô, a plataforma ou nós
acessamos o portal da operadora, nem como (login, senha, código de verificação); nenhum
cliente nomeado; nenhuma promessa de recuperação ("a rede pleiteia; nós produzimos a
prova"); nenhuma conciliadora citada pelo nome.

| # | Arquivo | O que é | Tempo |
|---|---|---|---|
| 1 | [01-search-console-e-bing.md](01-search-console-e-bing.md) | Search Console (TXT no Registro.br), sitemap, indexação, Bing e IndexNow | 40 min + espera do DNS |
| 2 | [02-perfis-e-diretorios.md](02-perfis-e-diretorios.md) | Perfil da Empresa no Google (com ponto de decisão), LinkedIn, B2B Stack, Capterra, G2, Reclame Aqui | 2 h |
| 3 | [03-emails-b2b.md](03-emails-b2b.md) | Sequência de 4 e-mails B2B, com regras de LGPD e descadastro | revisão 30 min |
| 4 | [04-roteiro-whatsapp.md](04-roteiro-whatsapp.md) | Roteiro para quem preencheu o formulário, com objeções | — |
| 5 | [05-raio-x-proposta.md](05-raio-x-proposta.md) | **PROPOSTA** da oferta "Raio-X de 1 posto × 1 operadora" (não publicar) | decisão |
| 6 | [06-calendario-metricool.md](06-calendario-metricool.md) + [CSV](06-calendario-metricool.csv) | 8 semanas de LinkedIn e Instagram, 2 por semana | 2 h (artes) |
| 7 | [07-imprensa-sindicatos-eventos.md](07-imprensa-sindicatos-eventos.md) | 10 veículos, sindicatos e eventos, com pauta para cada | contínuo |

## Ordem sugerida (primeiras 2 semanas)

1. [ ] Fazer o merge dos PRs do site (14 → 15 → 16 → 17), com squash.
2. [ ] Configurar o GA4 (dimensão `Origem` e `generate_lead` como evento principal;
       passos no `README.md` da raiz, "Como medir").
3. [ ] Search Console + sitemap + Bing (arquivo 1).
4. [ ] Página da empresa no LinkedIn e B2B Stack (arquivo 2).
5. [ ] Decidir sobre o Raio-X (arquivo 5) e sobre o Perfil da Empresa no Google (arquivo 2).
6. [ ] Criar as artes e importar o calendário no Metricool (arquivo 6).
7. [ ] Revisar os e-mails com o jurídico e começar com 10 a 20 redes por semana (arquivo 3).
8. [ ] Primeiro contato com Fecombustíveis e Brasil Postos (arquivo 7).
