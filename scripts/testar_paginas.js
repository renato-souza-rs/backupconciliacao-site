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

(async () => {
  const srv = servidor().listen(0, "127.0.0.1");
  await new Promise(r => srv.on("listening", r));
  const BASE = "http://127.0.0.1:" + srv.address().port;
  const navegador = await chromium.launch();
  let falhas = 0;
  for (const largura of [1366, 390]) {
    const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
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
