# 4. Roteiro de WhatsApp para quem preencheu o formulário

O formulário "30 dias sem cobrança" chega por e-mail (FormSubmit) com: Nome, Rede,
quantidade de CNPJs, WhatsApp e **Origem** (a página onde a pessoa estava, por exemplo
`guia_taxa_cielo_acima_do_contrato_posto` ou `operadora_ticketlog`). Use a Origem para
abrir a conversa pelo assunto que trouxe a pessoa.

Meta da conversa: em até 2 dias, uma de duas coisas: **começar os 30 dias** ou
**marcar 20 minutos de conversa**.

## Regras

- [ ] Responder em até 1 hora no horário comercial (o lead esfria rápido).
- [ ] Mensagens curtas, uma pergunta por vez. Sem áudio na primeira mensagem.
- [ ] Usar só fatos permitidos (preço, 30 dias, 36 × 23, 10,9%, +4%, "mais de 50 postos
      já utilizam módulos do sistema"). Nada de nome de cliente.
- [ ] Não pedir senha por WhatsApp. Acessos a portais são combinados no início dos
      30 dias, pelo canal que você usa hoje para isso.
- [ ] Se a pessoa disser que não quer contato, agradecer e registrar. Não insistir.

---

## Mensagem 1 (até 1 hora depois do formulário)

> Oi, {{nome}}! Aqui é o Renato, da Backup Conciliação. Recebi seu contato pelo site
> sobre a {{rede}} ({{cnpjs}} postos). Obrigado!
>
> Vi que você estava lendo sobre {{assunto da Origem}}. Hoje, como vocês conferem isso:
> na mão, com planilha ou com alguma conciliadora?

`{{assunto da Origem}}`: "taxa da Cielo acima do contrato", "reembolso da TicketLog",
"venda não paga pela Getnet", "o preço da conciliação" etc. Se a Origem for `form_home`
ou `sobre`, troque por: "Qual é hoje a maior dor no fechamento dos cartões?"

## Perguntas de qualificação (uma por mensagem, conforme a resposta)

1. Quais operadoras o caixa aceita? (adquirentes, vales, frota, aplicativos)
2. Qual ERP ou sistema de caixa os postos usam?
3. Quem faz a conferência hoje e quanto tempo isso toma por semana?
4. Já aconteceu de descobrir uma venda não paga ou uma taxa errada só meses depois?

## Mensagem 2: próximo passo

**Se a dor ficou clara:**

> Faz sentido. O que fazemos é conferir cada venda entre o caixa, o portal da operadora
> e o banco, e mostrar a diferença por posto, com valor. A rede usa 30 dias antes de
> pagar, e o teto é R$ 150 por CNPJ/mês (sem implantação, sem fidelidade):
> https://backupconciliacao.com.br/preco/
>
> Para começar, preciso entender as operadoras e o ERP de 1 ou 2 postos. Podemos falar
> 20 minutos {{amanhã às 10h / quinta às 15h}}?

**Se a pessoa ainda está pesquisando:**

> Sem pressa. Deixo dois materiais que costumam ajudar no fechamento:
> https://backupconciliacao.com.br/guias/quanto-custa-conciliadora-para-postos/
> https://backupconciliacao.com.br/operadoras/
> Posso te chamar na semana que vem para ver se fez sentido?

## Respostas às objeções mais comuns

**"Já temos conciliadora."**
> Ótimo, então a gente não substitui: vira a terceira fonte. A conciliadora
> tradicional trabalha com o arquivo que a operadora envia; nós cruzamos com o caixa da
> rede e buscamos também no portal da operadora. Nas redes que atendemos, de abril a
> setembro de 2026, a busca no portal trouxe 4% a mais de transações do que o arquivo,
> e 10,9% do faturamento conferido vinha de operadoras fora da cobertura da conciliadora
> tradicional (36 operadoras no fluxo, contra 23).

**"E a segurança dos acessos aos portais?"**
> Os robôs só consultam e baixam relatórios. Não alteram, não cancelam e não contestam
> nada em nome da rede, e os dados são tratados conforme a LGPD.

**"Está caro" / "Não tenho orçamento agora."**
> O teto é R$ 150 por posto/mês, e vocês usam 30 dias antes de pagar. A conta é
> simples: se a conferência achar no mês uma venda de R$ 150 ou mais que a operadora não
> pagou, a mensalidade daquele posto está coberta.

**"Vocês recuperam o dinheiro?"**
> Quem pleiteia é a rede, junto à operadora; nós produzimos a prova (relatório e
> documentos de cada diferença). Na recuperação de perdas, cobramos 10% só do valor
> recuperado e comprovado pelo relatório da operadora. Não prometemos valor.

**"Não tenho tempo para implantar."**
> Não há implantação cobrada, e a coleta nos portais é feita por robôs, em rotina
> diária ou semanal. A equipe passa a olhar só o que diverge.

## Acompanhamento se não houver resposta

- **Dia +1:** "Oi, {{nome}}, conseguiu ver minha mensagem de ontem? Se preferir, me
  diga o melhor horário e eu te ligo."
- **Dia +3:** mande um guia ligado à Origem, com uma frase: "Lembrei de você com este
  passo a passo: {{link do guia}}".
- **Dia +7:** "Vou deixar seu contato em espera para não incomodar. Quando quiser
  retomar, é só me chamar aqui." Depois disso, só volte se a pessoa chamar.

## Registro

Para cada lead, anote numa planilha: data, Origem, rede, CNPJs, operadoras, ERP,
próximo passo e resultado (30 dias iniciados / reunião / sem interesse). Junto com o
GA4 (`generate_lead` por Origem), isso mostra quais guias trazem contrato, e não só
visita.
