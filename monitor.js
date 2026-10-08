// Monitor de mercado: faixa de manchetes, "Petróleo hoje", seção Monitor,
// menu Radar e carrossel do hero. Lê os JSON de /dados/ gerados pelo
// GitHub Actions (scripts/monitor_mercado.py). Sem dado novo (> 24 h) ou
// sem rede, as partes dinâmicas simplesmente não aparecem.
(function () {
  "use strict";
  var VALIDADE_H = 24;
  var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // só http(s): um link "javascript:" vindo do feed nunca vira href
  function url(u) { return /^https?:\/\//i.test(String(u || "")) ? esc(u) : "#"; }
  function num(v, casas) { return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }); }
  function sinal(v, casas, pre) { return (v >= 0 ? "+" : "−") + (pre || "") + num(Math.abs(v), casas); }
  function pct(v) { return (v >= 0 ? "+" : "−") + num(Math.abs(v), 2) + "%"; }
  function dois(n) { return ("0" + n).slice(-2); }
  function quando(iso) {
    var d = new Date(iso), hoje = new Date(), ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
    var hm = dois(d.getHours()) + ":" + dois(d.getMinutes());
    if (d.toDateString() === hoje.toDateString()) return hm;
    if (d.toDateString() === ontem.toDateString()) return "Ontem " + hm;
    return dois(d.getDate()) + "/" + dois(d.getMonth() + 1) + " " + hm;
  }
  function dataHora(iso) { var d = new Date(iso); return dois(d.getDate()) + "/" + dois(d.getMonth() + 1) + "/" + d.getFullYear() + " · " + dois(d.getHours()) + ":" + dois(d.getMinutes()); }
  function fresco(iso) { return iso && (Date.now() - new Date(iso).getTime()) / 36e5 <= VALIDADE_H; }
  function carregar(arq) {
    return fetch("/dados/" + arq + "?v=" + Math.floor(Date.now() / 6e5), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  var TEMA = { comb: ["Petróleo", "mm-t-comb"], pag: ["Pagamentos", "mm-t-pag"], trib: ["Tributos", "mm-t-trib"] };

  // ---------------------------------------------------------- carrossel do hero
  function carrossel() {
    var box = document.getElementById("mm-slides"), dots = document.getElementById("mm-sdots");
    if (!box || !dots) return;
    var dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    var fech = [ // valores ilustrativos (como sempre foram no site)
      { erp: "184.230,50", op: "184.230,50", conc: "184.230,50", div: "R$ 0,00 ✓", cls: "ok", st: '<span class="pill ok">Conciliado</span>', obs: "" },
      { erp: "176.912,40", op: "175.627,50", conc: "176.912,40", div: "R$ 1.284,90", cls: "bad", st: '<span class="pill bad">Divergência apontada</span>', obs: "3 vendas no ERP sem pagamento da operadora." }
    ];
    var html = "", hoje = new Date();
    fech.forEach(function (f, i) {
      var d = new Date(hoje); d.setDate(hoje.getDate() - (i + 1));
      html += '<div class="card3 mm-slide" aria-hidden="' + (i ? "true" : "false") + '">'
        + '<div class="c-head"><b>Data – ' + dois(d.getDate()) + "/" + dois(d.getMonth() + 1) + "/" + d.getFullYear() + " – " + dias[d.getDay()] + "</b>" + f.st + "</div>"
        + '<div class="row3"><div class="src"><span class="dot erp"></span>ERP (caixa)</div><div class="val mono">R$ ' + f.erp + "</div></div>"
        + '<div class="row3"><div class="src"><span class="dot op"></span>Operadora</div><div class="val mono">R$ ' + f.op + "</div></div>"
        + '<div class="row3"><div class="src"><span class="dot conc"></span>Conciliadora</div><div class="val mono">R$ ' + f.conc + "</div></div>"
        + '<div class="delta ' + f.cls + '"><small>Divergência</small><b class="mono">' + f.div + "</b></div>"
        + (f.obs ? '<p class="mm-obs">' + f.obs + "</p>" : "") + "</div>";
    });
    [["/img/demo_resumo.webp", "Resumo do mês e evolução diária"], ["/img/demo_tabela.webp", "Conferência por adquirente"]].forEach(function (s) {
      html += '<figure class="card3 mm-slide mm-img" aria-hidden="true"><img src="' + s[0] + '" alt="Tela do sistema: ' + s[1] + ', com dados de demonstração" loading="lazy" data-zoom="/img/demo_tela.webp">'
        + "<figcaption><b>" + s[1] + "</b><span>Tela real, dados de demonstração</span></figcaption></figure>";
    });
    box.innerHTML = html;
    var S = box.children, n = S.length, atual = 0, timer = null;
    dots.innerHTML = Array.prototype.map.call(S, function (_, i) { return '<button type="button" aria-label="Ver item ' + (i + 1) + '" aria-current="' + (i ? "false" : "true") + '"></button>'; }).join("");
    function mostra(k) {
      atual = k;
      for (var i = 0; i < n; i++) { S[i].setAttribute("aria-hidden", i === k ? "false" : "true"); dots.children[i].setAttribute("aria-current", i === k ? "true" : "false"); }
    }
    var manual = false;
    Array.prototype.forEach.call(dots.children, function (b, i) { b.addEventListener("click", function () { manual = true; desliga(); mostra(i); }); });
    // troca a cada 30 s (pedido do owner); com "reduzir movimento" só esmaece
    function liga() { if (!manual && !timer) timer = setInterval(function () { mostra((atual + 1) % n); }, 30000); }
    function desliga() { clearInterval(timer); timer = null; }
    box.addEventListener("mouseenter", desliga); box.addEventListener("mouseleave", liga);
    liga();
  }

  // ---------------------------------------------------------- ampliar telas
  function zoom() {
    var z = document.createElement("div");
    z.className = "mm-zoom"; z.hidden = true; z.setAttribute("role", "dialog"); z.setAttribute("aria-label", "Tela ampliada");
    z.innerHTML = '<div><img alt=""><p>Tela real do sistema com dados de demonstração. Clique ou Esc para fechar.</p></div>';
    document.body.appendChild(z);
    var img = z.querySelector("img");
    document.addEventListener("click", function (e) {
      var alvo = e.target.closest && e.target.closest("img[data-zoom]");
      if (alvo) { img.src = alvo.getAttribute("data-zoom"); img.alt = alvo.alt; z.hidden = false; return; }
      if (!z.hidden && e.target.closest && e.target.closest(".mm-zoom")) z.hidden = true;
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") z.hidden = true; });
  }

  // ---------------------------------------------------------- faixa do topo
  function faixa(radar) {
    var itens = radar.itens.slice(0, 9);
    var t = itens.map(function (n) {
      return '<a href="' + url(n.link) + '" target="_blank" rel="nofollow noopener"><b class="mono">' + esc(quando(n.publicado)) + "</b>" + esc(n.titulo) + "<i>" + esc(n.fonte) + "</i></a>";
    }).join("");
    var f = document.createElement("div");
    f.className = "mm-faixa"; f.setAttribute("aria-label", "Últimas do mercado");
    f.innerHTML = '<span class="mm-lbl">Últimas do mercado</span><div class="mm-tk"><div class="mm-track">' + t + t + "</div></div>"
      + '<button type="button" class="mm-pausa" aria-pressed="false">Pausar</button><span class="mm-when mono">' + esc(quando(radar.atualizado)) + "</span>";
    document.body.insertBefore(f, document.body.firstChild);
    var b = f.querySelector(".mm-pausa");
    b.addEventListener("click", function () { var p = f.classList.toggle("parado"); b.setAttribute("aria-pressed", p); b.textContent = p ? "Retomar" : "Pausar"; });
    if (reduz) { // sem rolagem: uma manchete por vez, esmaecendo a cada 6 s
      f.classList.add("uma");
      var links = f.querySelectorAll(".mm-track a"), k = 0, total = itens.length;
      links[0].classList.add("on");
      setInterval(function () {
        if (f.classList.contains("parado") || f.matches(":hover")) return;
        links[k].classList.remove("on"); k = (k + 1) % total; links[k].classList.add("on");
      }, 6000);
    }
  }

  // ---------------------------------------------------------- petróleo hoje
  function petroleo(m) {
    var box = document.getElementById("petroleo-hoje");
    if (!box || !(m.wti || m.brent)) return;
    var cols = "", selo = [];
    [["wti", "WTI"], ["brent", "Brent"]].forEach(function (p) {
      var x = m[p[0]]; if (!x) return;
      cols += '<div class="mm-ph-col"><small>' + p[1] + '</small><b class="mono">US$ ' + num(x.ultimo, 2) + "</b>"
        + '<p><span class="' + (x.var_abs >= 0 ? "mm-up" : "mm-dn") + '">' + sinal(x.var_abs, 2, "US$ ") + " (" + pct(x.var_pct) + ")</span> de ontem para hoje</p>"
        + "<p>Na semana, " + sinal(x.semana_abs, 2, "US$ ") + "</p>"
        + (x.min_dia != null ? "<p>No dia, entre " + num(x.min_dia, 2) + " e " + num(x.max_dia, 2) + "</p>" : "") + "</div>";
      if (Math.abs(x.var_pct) >= 3) selo.push([p[1], (x.var_pct >= 0 ? "▲ " : "▼ ") + "Variação acima de 3% no dia"]);
      else if (Math.abs(x.semana_pct) >= 5) selo.push([p[1], (x.semana_pct >= 0 ? "▲ " : "▼ ") + "Variação acima de 5% na semana"]);
    });
    var s = selo.length ? '<div class="mm-ph-selo"><span>' + selo[0][1] + "</span><p>" + selo.map(function (x) { return x[0]; }).join(" e ") + "</p></div>" : "";
    box.innerHTML = '<div class="wrap mm-ph"><div class="mm-ph-lbl"><b>Petróleo hoje</b><span>Atualizado às ' + esc(quando(m.atualizado)) + "</span></div>" + cols + s + "</div>";
    box.hidden = false;
  }

  // ---------------------------------------------------------- seção Monitor
  function monitor(radar, m, pub) {
    var sec = document.getElementById("monitor");
    if (!sec) return;
    var lista = sec.querySelector(".mm-lista"), abas = sec.querySelectorAll(".mm-abas button");
    sec.querySelector(".mm-upd b").textContent = dataHora(radar.atualizado);
    function render(f) {
      var h = "";
      if (pub && pub.titulo) {
        h += '<a class="mm-item mm-semana" href="' + (pub.linkedin ? url(pub.linkedin) : "#monitor") + '"' + (pub.linkedin ? ' target="_blank" rel="noopener"' : "") + '>'
          + '<div class="mm-hr">' + esc(pub.data_curta || "") + "<i>Nossa publicação</i></div><div><h4>" + esc(pub.titulo) + "</h4>"
          + '<span class="mm-ft">Publicação da semana da <b>Backup Conciliação</b> · LinkedIn e Instagram</span></div></a>';
      }
      radar.itens.forEach(function (n) {
        if (f !== "todos" && n.tema !== f) return;
        var t = TEMA[n.tema] || ["", ""];
        h += '<a class="mm-item" href="' + url(n.link) + '" target="_blank" rel="nofollow noopener">'
          + '<div class="mm-hr mono">' + esc(quando(n.publicado)) + '<i class="' + t[1] + '">' + t[0] + "</i></div>"
          + "<div><h4>" + esc(n.titulo) + "</h4>"
          + (n.repercute ? '<span class="mm-rep">Repercute em ' + n.repercute + " veículos</span>" : "")
          + '<span class="mm-ft">Fonte: <b>' + esc(n.fonte) + "</b> · " + esc(n.site.replace(/^www\d?\./, "")) + (n.dado ? " · dado citado: " + esc(n.dado) : "") + "</span></div></a>";
      });
      lista.innerHTML = h;
    }
    Array.prototype.forEach.call(abas, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(abas, function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true"); render(b.getAttribute("data-f"));
      });
    });
    render("todos");
    var cot = sec.querySelector(".mm-cot");
    if (m && fresco(m.atualizado)) {
      var t = [];
      if (m.wti) t.push(["WTI", "US$ " + num(m.wti.ultimo, 2), m.wti.var_abs, m.wti.var_pct, 2, "US$ ", "Na semana, " + sinal(m.wti.semana_abs, 2, "US$ ")]);
      if (m.brent) t.push(["Brent", "US$ " + num(m.brent.ultimo, 2), m.brent.var_abs, m.brent.var_pct, 2, "US$ ", "Na semana, " + sinal(m.brent.semana_abs, 2, "US$ ")]);
      if (m.usd) t.push(["Dólar (BC)", "R$ " + num(m.usd.ultimo, 4), m.usd.var_abs, m.usd.var_pct, 4, "R$ ", "Cotação oficial do Banco Central"]);
      if (m.brent_brl) t.push(["Brent em R$", "R$ " + num(m.brent_brl.ultimo, 2), m.brent_brl.var_abs, m.brent_brl.var_pct, 2, "R$ ", "Brent × dólar do BC, por barril"]);
      cot.innerHTML = t.map(function (x) {
        return "<div><small>" + x[0] + '</small><b class="mono">' + x[1] + '</b><span class="mono ' + (x[2] >= 0 ? "mm-up" : "mm-dn") + '">' + sinal(x[2], x[4], x[5]) + " (" + pct(x[3]) + ")</span><p>" + x[6] + "</p></div>";
      }).join("");
    } else { cot.remove(); }
    sec.hidden = false;
  }

  // ---------------------------------------------------------- menu Radar
  function menuRadar(pub) {
    var drop = document.getElementById("mm-radar-drop");
    if (!drop || !pub || !pub.titulo) return;
    drop.innerHTML = '<div class="mm-post"><span class="mm-k">Publicação da semana' + (pub.data_longa ? " · " + esc(pub.data_longa) : "") + "</span>"
      + "<h5>" + esc(pub.titulo) + "</h5>" + (pub.resumo ? "<p>" + esc(pub.resumo) + "</p>" : "")
      + '<div class="mm-net">' + (pub.linkedin ? '<a href="' + url(pub.linkedin) + '" target="_blank" rel="noopener">LinkedIn ↗</a>' : "")
      + (pub.instagram ? '<a href="' + url(pub.instagram) + '" target="_blank" rel="noopener">Instagram ↗</a>' : "") + "</div></div>"
      + '<a class="mm-alt" href="/#monitor">Abrir o Monitor de mercado</a>';
    drop.parentNode.classList.add("tem-drop");
  }

  carrossel();
  zoom();
  Promise.all([carregar("radar.json"), carregar("mercado.json"), carregar("publicacao.json")]).then(function (r) {
    var radar = r[0], m = r[1], pub = r[2];
    menuRadar(pub);
    if (m && fresco(m.atualizado)) petroleo(m);
    if (radar && radar.itens && radar.itens.length && fresco(radar.atualizado)) {
      faixa(radar);
      monitor(radar, m, pub);
    }
  });
})();
