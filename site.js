// Script compartilhado da home e das paginas de servico.

// ----- Número do WhatsApp (TROCAR aqui) -----
// Formato internacional, só dígitos: 55 + DDD + número. Ex.: 5511999998888
var WHATSAPP = "5511918729780";
var WA_MSG = "Olá! Vim pelo site e gostaria de uma proposta de conciliação de cartões para a minha rede (postos ou varejo).";
var waLink = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(WA_MSG);
document.querySelectorAll("[data-wa]").forEach(function(a){ a.href = waLink; a.target = "_blank"; a.rel = "noopener"; });

// Ano no rodapé
var ano = document.getElementById("ano");
if (ano) ano.textContent = new Date().getFullYear();

// Menu mobile
var t = document.getElementById("toggle"), n = document.getElementById("nav");
if (t && n) {
  t.addEventListener("click", function(){ n.classList.toggle("open"); });
  n.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ n.classList.remove("open"); }); });
}

// Calculadora da rede (home e /preco/): preço cheio por empresa × CNPJs.
// Os preços são os de /preco/ — mudar lá = mudar aqui.
(function(){
  var campo = document.getElementById("pr-cnpjs");
  if (!campo) return;
  var PRECO = { v1: 150, v2: 100, v3: 250 };
  var saida = { v1: document.getElementById("pr-v1"), v2: document.getElementById("pr-v2"), v3: document.getElementById("pr-v3") };
  function moeda(v){ return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function calcular(){
    // Campo vazio ou inválido não zera a tela: mantém 1 como piso.
    var q = parseInt(campo.value, 10);
    if (!isFinite(q) || q < 1) q = 1;
    if (q > 999) q = 999;
    saida.v1.textContent = moeda(q * PRECO.v1);
    saida.v2.textContent = moeda(q * PRECO.v2);
    saida.v3.textContent = moeda(q * PRECO.v3);
  }
  campo.addEventListener("input", calcular);
  campo.addEventListener("change", calcular);
  calcular();
})();

// Formulário de contato (FormSubmit → e-mail para contato@). Com JS envia por
// fetch e mostra o retorno na própria página; sem JS o form posta direto e o
// FormSubmit devolve para ?enviado=1.
(function(){
  var f = document.getElementById("form-lead"), msg = document.getElementById("form-msg");
  if (!f || !msg) return;
  function aviso(cls, html){ msg.className = "cta-msg " + cls; msg.innerHTML = html; msg.hidden = false; }
  var OK = "Recebido! Retornamos pelo WhatsApp informado.";
  var FALHA = 'Não foi possível enviar agora. Fale com a gente pelo <a href="' + waLink + '" target="_blank" rel="noopener">WhatsApp</a>.';
  if (/[?&]enviado=1/.test(location.search)) aviso("ok", OK);
  f.addEventListener("submit", function(ev){
    if (!window.fetch || !window.FormData) return; // segue o POST tradicional
    ev.preventDefault();
    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    var dados = {};
    new FormData(f).forEach(function(v, k){ dados[k] = v; });
    fetch("https://formsubmit.co/ajax/contato@backupconciliacao.com.br", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(dados)
    })
      .then(function(r){ return r.json(); })
      .then(function(j){
        // Antes da ativação (1º envio) o FormSubmit responde success "false":
        // cai no aviso de falha com o WhatsApp, nunca em falso "recebido".
        if (String(j.success) !== "true") { aviso("erro", FALHA); return; }
        aviso("ok", OK);
        f.reset();
        if (typeof gtag === "function") gtag("event", "generate_lead", { origem: f.getAttribute("data-origem") || "form", page_path: location.pathname });
      })
      .catch(function(){ aviso("erro", FALHA); })
      .then(function(){ btn.disabled = false; });
  });
})();

// Botões "Enviar e-mail": o mailto: puro só funciona se o computador tiver um
// app de e-mail padrão configurado — quem usa Gmail/Outlook no navegador clica
// e nada acontece. Em vez de depender disso, abre uma janela com Gmail, Outlook,
// app de e-mail e "copiar endereço", já com destinatário, assunto e texto.
(function(){
  var caixa = null, link = null;
  function partes(href){
    var resto = href.slice(7), i = resto.indexOf("?");
    var p = new URLSearchParams(i < 0 ? "" : resto.slice(i + 1));
    return { para: decodeURIComponent(i < 0 ? resto : resto.slice(0, i)), assunto: p.get("subject") || "", corpo: p.get("body") || "" };
  }
  function montar(){
    caixa = document.createElement("div");
    caixa.className = "em-fundo";
    caixa.hidden = true;
    caixa.innerHTML =
      '<div class="em-caixa" role="dialog" aria-modal="true" aria-labelledby="em-titulo">' +
        '<button type="button" class="em-fechar" aria-label="Fechar">×</button>' +
        '<h3 id="em-titulo">Enviar e-mail</h3>' +
        '<p class="em-para"></p>' +
        '<div class="em-opcoes">' +
          '<a class="btn btn-primary" data-em="gmail" target="_blank" rel="noopener">Abrir no Gmail</a>' +
          '<a class="btn btn-ghost" data-em="outlook" target="_blank" rel="noopener">Abrir no Outlook</a>' +
          '<a class="btn btn-ghost" data-em="app">Usar o app de e-mail</a>' +
          '<button type="button" class="btn btn-ghost" data-em="copiar">Copiar endereço</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(caixa);
    caixa.addEventListener("click", function(ev){
      if (ev.target === caixa || ev.target.closest(".em-fechar")) { fechar(); return; }
      var op = ev.target.closest("[data-em]");
      if (!op) return;
      var opcao = op.getAttribute("data-em");
      if (typeof gtag === "function") gtag("event", "click_email_opcao", { opcao: opcao, origem: link.getAttribute("data-origem") || "link", page_path: location.pathname, transport_type: "beacon" });
      if (opcao === "copiar") { ev.preventDefault(); copiar(op); return; }
      setTimeout(fechar, 0);
    });
    document.addEventListener("keydown", function(ev){ if (ev.key === "Escape" && !caixa.hidden) fechar(); });
  }
  function copiar(botao){
    var email = partes(link.getAttribute("href")).para;
    function feito(){ botao.textContent = "Endereço copiado!"; }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(email).then(feito, function(){ selecionar(); }); }
    else selecionar();
    function selecionar(){
      var r = document.createRange(), s = window.getSelection();
      r.selectNodeContents(caixa.querySelector(".em-para b"));
      s.removeAllRanges(); s.addRange(r);
      botao.textContent = "Selecionado: tecle Ctrl+C";
    }
  }
  function abrir(a){
    if (!caixa) montar();
    link = a;
    var m = partes(a.getAttribute("href")), q = encodeURIComponent;
    caixa.querySelector(".em-para").innerHTML = "Para: <b></b>";
    caixa.querySelector(".em-para b").textContent = m.para;
    caixa.querySelector('[data-em="gmail"]').href = "https://mail.google.com/mail/?view=cm&fs=1&to=" + q(m.para) + "&su=" + q(m.assunto) + "&body=" + q(m.corpo);
    caixa.querySelector('[data-em="outlook"]').href = "https://outlook.live.com/mail/0/deeplink/compose?to=" + q(m.para) + "&subject=" + q(m.assunto) + "&body=" + q(m.corpo);
    caixa.querySelector('[data-em="app"]').href = a.getAttribute("href");
    caixa.querySelector('[data-em="copiar"]').textContent = "Copiar endereço";
    caixa.hidden = false;
    caixa.querySelector('[data-em="gmail"]').focus();
  }
  function fechar(){ caixa.hidden = true; if (link) link.focus(); }
  document.addEventListener("click", function(ev){
    var a = ev.target.closest ? ev.target.closest('a[href^="mailto:"]') : null;
    if (!a || (caixa && caixa.contains(a))) return;
    ev.preventDefault();
    abrir(a);
  });
})();

// Eventos GA4 de contato. Delegado no document porque os links do WhatsApp
// recebem o href só depois do carregamento (bloco acima).
document.addEventListener("click", function(ev){
  if (typeof gtag !== "function") return;
  var a = ev.target.closest ? ev.target.closest("a[href]") : null;
  if (!a) return;
  var href = a.getAttribute("href") || "";
  var origem = a.getAttribute("data-origem") || (a.classList.contains("wa-float") ? "botao_flutuante" : "link");
  if (href.indexOf("https://wa.me/") === 0) {
    gtag("event", "click_whatsapp", { link_url: "https://wa.me/" + WHATSAPP, origem: origem, page_path: location.pathname, transport_type: "beacon" });
  } else if (href.indexOf("mailto:") === 0) {
    gtag("event", "click_email", { link_url: href.split("?")[0], origem: origem, page_path: location.pathname, transport_type: "beacon" });
  } else if (a.hasAttribute("data-origem")) {
    // Demais CTAs com origem (ex.: "30 dias sem cobrança" no topo de guias e
    // operadoras, data-origem="topo_guia_<slug>"): mede o clique por página.
    gtag("event", "click_cta", { link_url: href, origem: origem, page_path: location.pathname, transport_type: "beacon" });
  }
});
