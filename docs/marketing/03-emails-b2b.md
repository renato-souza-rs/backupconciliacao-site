# 3. Sequência de 4 e-mails B2B para redes de postos

Para quem: gerente financeiro, controller ou sócio de rede de postos (3 ou mais CNPJs).
Objetivo: uma resposta ou um clique em guia ou preço, e daí uma conversa no WhatsApp.
Tom: de gerente financeiro para gerente financeiro. Fala do **sintoma**, nunca do método.

Campos de mesclagem: `{{nome}}`, `{{rede}}`, `{{cidade}}`. Se não tiver o nome, use
"Olá, tudo bem?" e não invente.

## Regras de envio (LGPD e boa prática)

- [ ] **Base legal:** legítimo interesse (LGPD, art. 7º, IX) para contato B2B com
      profissionais de empresas, sobre assunto ligado à função deles. Use só e-mail
      corporativo, de fonte pública ou de contato direto, e **anote a origem de cada
      contato** (planilha: e-mail, empresa, onde foi obtido, data).
      Valide o texto com quem cuida do jurídico antes do primeiro disparo.
- [ ] **Descadastro em todos os e-mails**, com efeito imediato: link de descadastro da
      ferramenta de envio **ou** "responda SAIR". Quem pedir para sair entra numa lista
      de bloqueio e **nunca** recebe outro e-mail, nem desta sequência nem de outra.
- [ ] Identificação clara: nome, empresa, e-mail e site no rodapé.
- [ ] Sem compra de listas. Sem anexos. No máximo 2 links por e-mail.
- [ ] Envio a partir de `contato@backupconciliacao.com.br` ou `renatosouza@…`
      (Google Workspace, com SPF, DKIM e DMARC já configurados). Volume baixo:
      até ~30 e-mails novos por dia nas primeiras semanas, para não queimar o domínio.
- [ ] Parar a sequência assim que a pessoa responder (qualquer resposta).

Cadência: E1 no dia 0, E2 no dia 3, E3 no dia 7, E4 no dia 14. Terça a quinta, entre
8h e 10h.

---

## E1 — dia 0 · a venda que não caiu

**Assunto:** A venda passou na maquininha. O dinheiro caiu?
**Prévia:** Uma pergunta para o fechamento da {{rede}}.

> Olá, {{nome}}.
>
> Pergunta direta para quem fecha o caixa de uma rede de postos: na {{rede}}, alguém
> confere venda a venda se cada cartão que passou na maquininha virou dinheiro no banco?
>
> No fechamento do mês, o total das operadoras costuma ficar perto do total do caixa.
> Perto, mas não igual. E dentro dessa diferença podem estar vendas inteiras que não
> foram pagas.
>
> Escrevi um passo a passo de como achar essas vendas e juntar a prova para cobrar a
> operadora:
> https://backupconciliacao.com.br/guias/getnet-nao-pagou-venda-do-posto/
>
> Se fizer sentido conversar, é só responder este e-mail.
>
> Renato Souza
> Fundador · Backup Conciliação
> https://backupconciliacao.com.br

---

## E2 — dia 3 · o reembolso da frota

**Assunto:** O reembolso da frota veio inteiro?
**Prévia:** Um crédito no extrato pode esconder um abastecimento que ficou de fora.

> Olá, {{nome}}.
>
> No cartão frota, um único crédito no extrato representa muitos abastecimentos.
> Olhando só o total, não dá para ver se algum ficou de fora do reembolso, ou se a taxa
> descontada foi a combinada.
>
> Montei um roteiro para conferir o reembolso, etapa por etapa, do caixa ao banco:
> https://backupconciliacao.com.br/guias/conferir-reembolso-ticketlog-posto/
>
> Vale para TicketLog e para as outras operadoras de frota.
>
> Renato

---

## E3 — dia 7 · as operadoras que ninguém confere

**Assunto:** Quantas das suas operadoras entram na conferência?
**Prévia:** Em redes clientes, 10,9% do faturamento conferido estava fora da conciliadora.

> Olá, {{nome}}.
>
> Uma conta que vale fazer na {{rede}}: liste todas as formas de pagamento que o caixa
> aceita (adquirentes, vales, frota, aplicativos, tags) e compare com a lista do que a
> sua conciliação confere hoje.
>
> Nas redes que atendemos, medimos de abril a setembro de 2026: eram 36 operadoras no
> fluxo, contra 23 cobertas pela conciliadora tradicional, e 10,9% do faturamento
> conferido vinha das que ficavam de fora.
>
> Aqui está o que conferimos em cada operadora:
> https://backupconciliacao.com.br/operadoras/
>
> Renato

---

## E4 — dia 14 · último e-mail

**Assunto:** Encerro por aqui?
**Prévia:** Fica o preço e o convite, sem compromisso.

> Olá, {{nome}}.
>
> Não quero lotar sua caixa de entrada, então este é o último e-mail da sequência.
>
> Se um dia fizer sentido: a conferência de cartões custa até R$ 150 por posto (CNPJ)
> por mês, sem implantação e sem fidelidade, e a rede usa por 30 dias antes da primeira
> cobrança. O preço está publicado aqui: https://backupconciliacao.com.br/preco/
>
> Se preferir, me responda com o melhor horário e conversamos 15 minutos pelo WhatsApp.
>
> Obrigado pela atenção,
> Renato Souza

---

## Rodapé (igual em todos)

> Backup Conciliação · conciliação de cartões para redes de postos · São Paulo (SP)
> contato@backupconciliacao.com.br · https://backupconciliacao.com.br
> Você recebeu este e-mail porque trabalha na área financeira de uma rede de postos.
> Para não receber mais nenhum e-mail nosso, [clique aqui para se descadastrar] ou
> responda **SAIR**. Tratamos seus dados conforme a LGPD.

## O que não fazer

- Não citar cliente, rede ou cidade de cliente. Não usar número que não esteja no
  `README` do site (fatos permitidos).
- Não prometer recuperação de valor. A frase é: "a rede pleiteia; nós produzimos a prova".
- Não mencionar o "Raio-X" enquanto a oferta não for aprovada (ver
  `05-raio-x-proposta.md`).
