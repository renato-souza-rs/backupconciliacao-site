// Teste no navegador (Playwright + Chromium) de todas as páginas do site.
//
// Em 1366 e 390 px, para cada index.html:
//   - sem rolagem horizontal (scrollWidth <= largura da janela);
//   - sem erro de console nem erro de JavaScript;
//   - FAQ visível (#faq) idêntico ao JSON-LD FAQPage, no DOM já renderizado;
//   - nos guias e operadoras: formulário com Origem certa e evento GA4
//     "click_cta" disparado com a origem do botão do topo.
// Os scripts de terceiros (GA, Metricool) são bloqueados: o teste é do nosso código.
//
// Antes das páginas, o aviso de cookies (LGPD; Guia de Cookies da ANPD), nas duas larguras:
//   - sem escolha: aviso visível, NENHUMA chamada ao Google nem ao Metricool, sem gtag,
//     e os cookies _ga que já existiam são apagados;
//   - "Recusar" e "Aceitar" com o mesmo estilo; recusar grava a escolha e nada carrega;
//   - "Preferências de cookies" no rodapé reabre o aviso; aceitar carrega a medição;
//   - recusar depois de ter aceitado recarrega a página, apaga os cookies e nada carrega.
// As páginas em si são testadas com o aceite já dado (é ele que liga os eventos GA4).
//
// Uso (Playwright instalado; não precisa de package.json no site):
//   npm i -g playwright && npx playwright install chromium
//   NODE_PATH=$(npm root -g) node scripts/testar_paginas.js [pasta-dos-prints]
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const RAIZ = path.resolve(__dirname, "..");
const PRINTS = process.argv[2] || "";
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

// Servidor estático mínimo, igual ao GitHub Pages (pasta/ -> pasta/index.html).
function servidor() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    if (p.endsWith("/")) p += "index.html";
    const arq = path.join(RAIZ, p);
    if (!arq.startsWith(RAIZ) || !fs.existsSync(arq)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq)] || "application/octet-stream" });
    fs.createReadStream(arq).pipe(res);
  });
}

function paginas(dir = RAIZ, base = "/") {
  let out = [];
  for (const nome of fs.readdirSync(dir)) {
    if (nome.startsWith(".") || nome === "node_modules" || nome === "scripts") continue;
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) out = out.concat(paginas(p, base + nome + "/"));
    else if (nome === "index.html") out.push(base);
  }
  return out.sort();
}

// Aviso de cookies. Contexto novo, sem escolha gravada. Os pedidos a terceiros são
// abortados, mas a TENTATIVA fica registrada em `fora` — é ela que prova se o site
// chamou o Google ou o Metricool.
async function testarCookies(navegador, BASE, largura) {
  const problemas = [];
  const exigir = (ok, msg) => { if (!ok) problemas.push(msg); };
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
  const fora = [];
  await ctx.route(url => !url.href.startsWith(BASE), r => { fora.push(new URL(r.request().url()).hostname); return r.abort(); });
  const medicao = () => fora.filter(h => /googletagmanager|google-analytics|metricool/.test(h));
  // Cookies do GA deixados por uma visita de antes de o aviso existir.
  await ctx.addCookies([{ name: "_ga", value: "GA1.1.antigo", url: BASE }, { name: "_ga_WR2TJLGTL4", value: "GS1.1.antigo", url: BASE }]);
  const pg = await ctx.newPage();
  const estado = () => pg.evaluate(() => {
    const f = document.querySelector(".ck");
    let escolha = null;
    try { escolha = (JSON.parse(localStorage.getItem("bc_cookies")) || {}).escolha || null; } catch (_) { escolha = "erro"; }
    return { faixa: !!f && !f.hidden, gtag: typeof window.gtag, fila: (window.dataLayer || []).length, escolha,
             cookieGa: /(^|; )_ga/.test(document.cookie), sw: document.documentElement.scrollWidth,
             pref: !!document.querySelector("footer .copy .ck-pref") };
  });

  // 1) primeira visita, sem escolha
  await pg.goto(BASE + "/", { waitUntil: "load" });
  let e = await estado();
  exigir(e.faixa, "sem escolha: o aviso não apareceu");
  exigir(e.gtag === "undefined" && e.fila === 0, "sem escolha: gtag/dataLayer já existem");
  exigir(medicao().length === 0, "sem escolha: chamou " + medicao().join(", "));
  exigir(!e.cookieGa, "sem escolha: cookie _ga antigo não foi apagado");
  exigir(e.sw <= largura, `aviso causa rolagem horizontal (${e.sw}px)`);
  exigir(e.pref, 'rodapé sem "Preferências de cookies"');
  const iguais = await pg.evaluate(() => {
    const b = [...document.querySelectorAll(".ck [data-ck]")];
    const cara = el => { const c = getComputedStyle(el); return [c.backgroundColor, c.color, c.fontSize, c.fontWeight, c.padding, c.borderTopWidth, c.borderTopColor, Math.round(el.getBoundingClientRect().height)].join("|"); };
    return b.length === 2 && b[0].textContent === "Recusar" && b[1].textContent === "Aceitar" && cara(b[0]) === cara(b[1]);
  });
  exigir(iguais, '"Recusar" e "Aceitar" não têm o mesmo destaque');

  // 2) recusar: grava a escolha, some o aviso, nada carrega — nem depois de recarregar
  await pg.click('.ck [data-ck="recusado"]');
  e = await estado();
  exigir(!e.faixa && e.escolha === "recusado", "recusar: aviso continuou ou a escolha não foi gravada");
  await pg.reload({ waitUntil: "load" });
  e = await estado();
  exigir(!e.faixa, "recusado: o aviso voltou ao recarregar");
  exigir(e.gtag === "undefined" && medicao().length === 0, "recusado: a medição carregou");

  // 3) "Preferências de cookies" reabre; aceitar liga a medição, nesta e nas outras páginas
  await pg.click("footer .copy .ck-pref");
  e = await estado();
  exigir(e.faixa, "Preferências de cookies não reabriu o aviso");
  await pg.click('.ck [data-ck="aceito"]');
  e = await estado();
  exigir(!e.faixa && e.escolha === "aceito", "aceitar: aviso continuou ou a escolha não foi gravada");
  exigir(e.gtag === "function" && e.fila >= 2, "aceitar: gtag não foi ligado");
  exigir(medicao().some(h => /googletagmanager/.test(h)) && medicao().some(h => /metricool/.test(h)), "aceitar: não pediu o Google Analytics e o Metricool");
  fora.length = 0;
  await pg.goto(BASE + "/preco/", { waitUntil: "load" });
  e = await estado();
  exigir(!e.faixa && e.gtag === "function" && medicao().length >= 2, "aceito: a medição não carregou na página seguinte");

  // 4) mudar de ideia: recusar depois de aceitar recarrega, apaga os cookies e não carrega mais
  await pg.evaluate(() => { document.cookie = "_ga=GA1.1.novo; path=/"; });
  await pg.click("footer .copy .ck-pref");
  fora.length = 0;
  await Promise.all([pg.waitForEvent("load"), pg.click('.ck [data-ck="recusado"]')]);
  e = await estado();
  exigir(e.escolha === "recusado" && !e.faixa, "mudar para recusado: a escolha não ficou gravada");
  exigir(e.gtag === "undefined" && medicao().length === 0, "mudar para recusado: a medição continuou depois de recarregar");
  exigir(!e.cookieGa, "mudar para recusado: cookie _ga não foi apagado");
  await ctx.close();
  return problemas;
}

(async () => {
  const srv = servidor().listen(0, "127.0.0.1");
  await new Promise(r => srv.on("listening", r));
  const BASE = "http://127.0.0.1:" + srv.address().port;
  const navegador = await chromium.launch();
  let falhas = 0;
  for (const largura of [1366, 390]) {
    const pc = await testarCookies(navegador, BASE, largura);
    if (pc.length) falhas++;
    console.log(`${pc.length ? "ERR" : "OK "} ${largura}px aviso de cookies${pc.length ? "  " + pc.join("; ") : ""}`);
  }
  for (const largura of [1366, 390]) {
    const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
    // As páginas são testadas com o aceite dado: sem ele o site não define gtag e os
    // eventos click_cta não existem (o aviso em si é testado acima).
    await ctx.addInitScript(() => { try { localStorage.setItem("bc_cookies", JSON.stringify({ escolha: "aceito", em: Date.now() })); } catch (_) {} });
    await ctx.route(url => !url.href.startsWith(BASE), r => r.abort());
    for (const p of paginas()) {
      const pg = await ctx.newPage();
      const erros = [];
      pg.on("console", m => { if (m.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) erros.push(m.text()); });
      pg.on("pageerror", e => erros.push(String(e)));
      await pg.goto(BASE + p, { waitUntil: "load" });
      const r = await pg.evaluate(() => {
        const norm = s => s.replace(/\s+/g, " ").trim();
        const visivel = [...document.querySelectorAll("#faq details")].map(d => [norm(d.querySelector("summary").textContent), norm(d.querySelector("p").textContent)]);
        let ld = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
          const j = JSON.parse(s.textContent);
          if (j["@type"] === "FAQPage") ld = j.mainEntity.map(q => [norm(q.name), norm(q.acceptedAnswer.text)]);
        });
        const form = document.getElementById("form-lead");
        const campo = form && form.querySelector('input[name="Origem"]');
        return { sw: document.documentElement.scrollWidth, faqOk: JSON.stringify(visivel) === JSON.stringify(ld), nFaq: ld.length,
                 formOrigem: form && form.getAttribute("data-origem"), campoOrigem: campo && campo.value };
      });
      const problemas = [];
      if (r.sw > largura) problemas.push(`rolagem horizontal (${r.sw}px)`);
      if (erros.length) problemas.push("console: " + erros.join(" | "));
      if (!r.faqOk) problemas.push("FAQ visível difere do JSON-LD");
      const m = p.match(/^\/(guias|operadoras)\/([^/]+)\/$/);
      if (m) {
        const origem = (m[1] === "guias" ? "guia_" + m[2].replace(/-/g, "_") : "operadora_" + m[2]);
        if (r.formOrigem !== origem || r.campoOrigem !== origem) problemas.push(`formulário com origem ${r.formOrigem}/${r.campoOrigem} (esperado ${origem})`);
        // GA4: o clique no CTA do topo precisa gerar click_cta com a origem do botão
        await pg.click(`.page-hero a[data-origem="topo_${origem}"]`);
        const ev = await pg.evaluate(() => (window.dataLayer || []).map(a => Array.from(a)).filter(a => a[0] === "event" && a[1] === "click_cta").map(a => a[2].origem));
        if (!ev.includes("topo_" + origem)) problemas.push("evento click_cta não disparou");
      }
      if (problemas.length) falhas++;
      console.log(`${problemas.length ? "ERR" : "OK "} ${largura}px ${p}  FAQ=${r.nFaq}${problemas.length ? "  " + problemas.join("; ") : ""}`);
      if (PRINTS) {
        fs.mkdirSync(PRINTS, { recursive: true });
        const nome = (p.replace(/\//g, "_").replace(/^_|_$/g, "") || "home") + `-${largura}.jpg`;
        await pg.screenshot({ path: path.join(PRINTS, nome), fullPage: true, type: "jpeg", quality: 70 });
      }
      await pg.close();
    }
    await ctx.close();
  }
  await navegador.close();
  srv.close();
  console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
  process.exit(falhas ? 1 : 0);
})();
