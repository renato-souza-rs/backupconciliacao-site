// Script compartilhado da home e das paginas de servico.

// ----- Número do WhatsApp (TROCAR aqui) -----
// Formato internacional, só dígitos: 55 + DDD + número. Ex.: 5511999998888
var WHATSAPP = "5511918729780";
var WA_MSG = "Olá! Vim pelo site e gostaria de uma proposta de conciliação de cartões para a minha rede de postos.";
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
  }
});
