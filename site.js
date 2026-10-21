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
