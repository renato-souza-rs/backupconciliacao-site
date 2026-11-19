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

// ----- Medição de audiência só depois do aceite (LGPD; Guia de Cookies da ANPD) -----
// O Google Analytics 4 e o Metricool gravam cookies e identificadores que não são
// necessários para o site funcionar. Por isso nada deles carrega antes de a pessoa
// aceitar: os dois scripts saíram do <head> das páginas e só entram por aqui.
// "Recusar" tem o mesmo destaque de "Aceitar", e a escolha pode ser mudada a
// qualquer momento em "Preferências de cookies", no rodapé. A escolha fica só no
// navegador (localStorage "bc_cookies": aceitou ou recusou, e quando), sem
// identificar ninguém, e é perguntada de novo depois de 1 ano.
var GA_ID = "G-WR2TJLGTL4";
var METRICOOL_HASH = "495b648fc48a73d94cfd1a8396a95478";
(function(){
  var CHAVE = "bc_cookies", VALIDADE_DIAS = 365, ligado = false, faixa = null;

  function ler(){
    try {
      var e = JSON.parse(localStorage.getItem(CHAVE) || "null");
      if (!e || (e.escolha !== "aceito" && e.escolha !== "recusado")) return null;
      if (Date.now() - e.em > VALIDADE_DIAS * 864e5) return null;
      return e.escolha;
    } catch (_) { return null; }
  }
  function gravar(escolha){
    try { localStorage.setItem(CHAVE, JSON.stringify({ escolha: escolha, em: Date.now() })); } catch (_) {}
  }

  function ligarMedicao(){
    if (ligado) return;
    ligado = true;
    window.dataLayer = window.dataLayer || [];
    // O GA exige o objeto "arguments" na fila, não um array.
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(g);
    var m = document.createElement("script");
    m.async = true;
    m.src = "https://tracker.metricool.com/resources/be.js";
    m.onload = function(){ if (window.beTracker) window.beTracker.t({ hash: METRICOOL_HASH }); };
    document.head.appendChild(m);
  }

  // Apaga os cookies do Google Analytics deste site (_ga, _ga_<id>, _gid, _gat).
  function apagarCookiesDeMedicao(){
    var partes = location.hostname.split("."), dominios = [""];
    for (var i = 0; i < partes.length - 1; i++) dominios.push("." + partes.slice(i).join("."));
    document.cookie.split(";").forEach(function(c){
      var nome = c.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat)/.test(nome)) return;
      dominios.forEach(function(d){
        document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }

  function fechar(){ if (faixa) faixa.hidden = true; }
  function abrir(){
    if (!faixa) {
      faixa = document.createElement("div");
      faixa.className = "ck";
      faixa.setAttribute("role", "region");
      faixa.setAttribute("aria-label", "Aviso de cookies");
      faixa.innerHTML =
        '<p class="ck-txt">Este site usa ferramentas de medição de audiência (Google Analytics e Metricool), ' +
        'que gravam cookies e identificadores no seu navegador. Elas só são ativadas se você aceitar. ' +
        '<a href="/privacidade/">Política de privacidade</a></p>' +
        '<div class="ck-botoes">' +
          '<button type="button" class="ck-btn" data-ck="recusado">Recusar</button>' +
          '<button type="button" class="ck-btn" data-ck="aceito">Aceitar</button>' +
        '</div>';
      faixa.addEventListener("click", function(ev){
        var b = ev.target.closest ? ev.target.closest("[data-ck]") : null;
        if (b) escolher(b.getAttribute("data-ck"));
      });
      // Primeiro elemento da página: quem navega por teclado chega nele antes do menu.
      document.body.insertBefore(faixa, document.body.firstChild);
    }
    faixa.hidden = false;
  }
  function escolher(escolha){
    gravar(escolha);
    fechar();
    if (escolha === "aceito") { ligarMedicao(); return; }
    apagarCookiesDeMedicao();
    // Quem tinha aceitado e agora recusa: recarrega para tirar os scripts já ativos.
    if (ligado) location.reload();
  }

  // "Preferências de cookies" no rodapé de todas as páginas: reabre o aviso.
  var copy = document.querySelector("footer .copy");
  if (copy) {
    var pref = document.createElement("button");
    pref.type = "button";
    pref.className = "ck-pref";
    pref.textContent = "Preferências de cookies";
    pref.addEventListener("click", function(){
      abrir();
      var b = faixa.querySelector("[data-ck]");
      if (b) b.focus();
    });
    copy.appendChild(document.createTextNode(" · "));
    copy.appendChild(pref);
  }

  var escolha = ler();
  if (escolha === "aceito") ligarMedicao();
  else {
    // Sem aceite não fica cookie de medição: limpa os gravados antes de este
    // aviso existir e os de uma escolha que venceu.
    apagarCookiesDeMedicao();
    if (!escolha) abrir();
  }
})();

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
    // Demais CTAs com origem (ex.: "Use e pague após 30 dias" no topo de guias e
    // operadoras, data-origem="topo_guia_<slug>"): mede o clique por página.
    gtag("event", "click_cta", { link_url: href, origem: origem, page_path: location.pathname, transport_type: "beacon" });
  }
});
