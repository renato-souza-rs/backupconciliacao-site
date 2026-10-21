#!/usr/bin/env python3
"""Verifica as páginas do site antes do merge (só biblioteca padrão).

Em todas as páginas:
  - todo JSON-LD é JSON válido;
  - o FAQ visível (#faq: <summary> e <p>) é IDÊNTICO ao JSON-LD FAQPage.
Nos guias (/guias/<slug>/):
  - title <= 60 e meta description <= 155 caracteres;
  - JSON-LD Article + BreadcrumbList + FAQPage, com 4 perguntas;
  - parágrafo-resposta no topo, 1 tabela ou lista numerada;
  - 900 a 1.400 palavras de conteúdo (resposta + artigo + FAQ);
  - links para /preco/, /conciliacao-3-way-postos/ e mais 2 guias;
  - formulário e botões do CTA final com data-origem="guia_<slug>";
  - presença no sitemap.xml e no llms.txt; nenhum emoji.
Nas operadoras (/operadoras/<slug>/): as mesmas regras, com JSON-LD Service no
  lugar de Article, data-origem="operadora_<slug>", links para 2 guias e sem
  faixa de palavras.
Em todas as páginas, também: nenhum link interno ("/...") quebrado.
Entre as operadoras: semelhança do texto do <main> (nome da operadora trocado
  por X, difflib.SequenceMatcher por palavras) de no máximo 60% entre duas páginas.

Uso: python3 scripts/verificar_paginas.py   (sai com código 1 se algo falhar)
"""
import glob, html, json, os, re, sys
from html.parser import HTMLParser

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://backupconciliacao.com.br"
EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2705\u274C\u26A0\u2B50]")  # pictogramas; o ☰ do menu não conta


def norm(s):
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


class Leitor(HTMLParser):
    """Extrai JSON-LD, FAQ visível, links, data-origem e o texto do conteúdo."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.jsonld, self.faq, self.links, self.origens = [], [], [], []
        self.title = self.desc = ""
        self.tem_resposta = self.tem_tabela = self.tem_ol = False
        self.form_origem = None
        self.texto_conteudo = []
        self.texto_main = []      # todo o texto do <main> (semelhança entre páginas)
        self.nome_atual = ""     # último item da trilha (aria-current), ex.: nome da operadora
        self._em_atual = False
        self._pilha = []          # tags abertas (para saber se estamos no #faq / .artigo)
        self._script = None
        self._em_title = False
        self._faq_campo = None    # "q" ou "a"
        self._em_rel = 0

    def _dentro(self, cond):
        return any(cond(t, a) for t, a in self._pilha)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "li" and a.get("aria-current") == "page":
            self._em_atual = True
        classes = (a.get("class") or "").split()
        if tag not in ("meta", "link", "input", "img", "br", "hr"):
            self._pilha.append((tag, a))
        if tag == "script" and a.get("type") == "application/ld+json":
            self._script = []
        elif tag == "title":
            self._em_title = True
        elif tag == "meta" and a.get("name") == "description":
            self.desc = a.get("content", "")
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        if "data-origem" in a:
            self.origens.append((tag, a["data-origem"]))
        if tag == "form" and a.get("id") == "form-lead":
            self.form_origem = a.get("data-origem")
        if "resposta" in classes:
            self.tem_resposta = True
        if "relacionado" in classes:
            self._em_rel += 1
        if self._dentro(lambda t, x: "artigo" in (x.get("class") or "").split()):
            if tag == "table":
                self.tem_tabela = True
            if tag == "ol":
                self.tem_ol = True
        if self._dentro(lambda t, x: x.get("id") == "faq"):
            if tag == "summary":
                self.faq.append(["", ""])
                self._faq_campo = "q"
            elif tag == "p" and self._dentro(lambda t, x: t == "details"):
                self._faq_campo = "a"

    def handle_endtag(self, tag):
        if tag == "script" and self._script is not None:
            self.jsonld.append("".join(self._script))
            self._script = None
        if tag == "title":
            self._em_title = False
        if tag == "li":
            self._em_atual = False
        if tag in ("summary", "p"):
            self._faq_campo = None
        # fecha até a tag correspondente (HTML tolerante)
        for i in range(len(self._pilha) - 1, -1, -1):
            if self._pilha[i][0] == tag:
                fechada = self._pilha[i][1]
                if "relacionado" in (fechada.get("class") or "").split():
                    self._em_rel -= 1
                del self._pilha[i:]
                break

    def handle_data(self, d):
        if self._script is not None:
            self._script.append(d)
            return
        if self._em_atual:
            self.nome_atual += d
        if self._dentro(lambda t, x: t == "main"):
            self.texto_main.append(d)
        if self._em_title:
            self.title += d
        if self._faq_campo == "q":
            self.faq[-1][0] += d
        elif self._faq_campo == "a":
            self.faq[-1][1] += d
        artigo = self._dentro(lambda t, x: "artigo" in (x.get("class") or "").split())
        faq = self._dentro(lambda t, x: x.get("id") == "faq") and self._dentro(lambda t, x: t == "details")
        if (artigo and not self._em_rel) or faq:
            self.texto_conteudo.append(d)


def tipos(objs):
    out = {}
    for o in objs:
        for item in (o if isinstance(o, list) else [o]):
            out[item.get("@type")] = item
    return out


def verificar(caminho, erros, sitemap, llms):
    rel = os.path.relpath(caminho, RAIZ)
    p = Leitor()
    p.feed(open(caminho, encoding="utf-8").read())

    objs = []
    for bruto in p.jsonld:
        try:
            objs.append(json.loads(bruto))
        except json.JSONDecodeError as e:
            erros.append(f"{rel}: JSON-LD inválido ({e})")
    t = tipos(objs)

    # FAQ visível == JSON-LD FAQPage
    visivel = [(norm(q), norm(a)) for q, a in p.faq]
    ld = [(norm(x["name"]), norm(x["acceptedAnswer"]["text"])) for x in t.get("FAQPage", {}).get("mainEntity", [])]
    if visivel or ld:
        if visivel != ld:
            erros.append(f"{rel}: FAQ visível difere do JSON-LD FAQPage")
            for i, (v, j) in enumerate(zip(visivel, ld)):
                if v != j:
                    erros.append(f"   pergunta {i + 1}:\n     visível: {v}\n     JSON-LD: {j}")
            if len(visivel) != len(ld):
                erros.append(f"   quantidade: visível={len(visivel)} JSON-LD={len(ld)}")
        else:
            print(f"OK  {rel}: FAQ visível = JSON-LD ({len(ld)} perguntas)")

    # links internos: todo href "/..." precisa apontar para um arquivo existente
    for h in sorted(set(p.links)):
        if h.startswith("/") and not h.startswith("//"):
            alvo = h.split("#")[0].split("?")[0]
            if not alvo:
                continue
            arq = os.path.join(RAIZ, alvo.lstrip("/"), "index.html") if alvo.endswith("/") else os.path.join(RAIZ, alvo.lstrip("/"))
            if not os.path.exists(arq):
                erros.append(f"{rel}: link interno quebrado {h}")

    caminho_url = rel.replace(os.sep, "/")
    m = re.match(r"(guias|operadoras)/([^/]+)/index\.html$", caminho_url)
    if not m:
        return
    secao, slug = m.groups()
    url = f"{SITE}/{secao}/{slug}/"
    if secao == "guias":
        origem = "guia_" + slug.replace("-", "_")
        tipos_ld = ("Article", "BreadcrumbList", "FAQPage")
    else:
        origem = "operadora_" + slug
        tipos_ld = ("Service", "BreadcrumbList", "FAQPage")
    falhas = []
    if len(norm(p.title)) > 60:
        falhas.append(f"title com {len(norm(p.title))} caracteres (> 60)")
    if len(norm(p.desc)) > 155:
        falhas.append(f"description com {len(norm(p.desc))} caracteres (> 155)")
    for tipo in tipos_ld:
        if tipo not in t:
            falhas.append(f"sem JSON-LD {tipo}")
    if len(ld) != 4:
        falhas.append(f"FAQ com {len(ld)} perguntas (esperado 4)")
    if not p.tem_resposta:
        falhas.append("sem parágrafo-resposta (.resposta)")
    if not (p.tem_tabela or p.tem_ol):
        falhas.append("sem tabela nem lista numerada")
    palavras = len(norm(" ".join(p.texto_conteudo)).split())
    if secao == "guias" and not 900 <= palavras <= 1400:
        falhas.append(f"{palavras} palavras (esperado 900–1.400)")
    if "/preco/" not in p.links:
        falhas.append("sem link para /preco/")
    if "/conciliacao-3-way-postos/" not in p.links:
        falhas.append("sem link para /conciliacao-3-way-postos/")
    outros = {h for h in p.links if re.fullmatch(r"/guias/[^/]+/", h) and h != f"/guias/{slug}/"}
    if len(outros) < 2:
        falhas.append(f"só {len(outros)} link(s) para guias")
    if p.form_origem != origem:
        falhas.append(f"formulário com data-origem={p.form_origem!r} (esperado {origem!r})")
    cta = [o for tag, o in p.origens if o == origem]
    if len(cta) < 3:  # formulário + WhatsApp + e-mail
        falhas.append(f"CTA final com {len(cta)} elementos data-origem={origem!r} (esperado 3)")
    if url not in sitemap:
        falhas.append("fora do sitemap.xml")
    if url not in llms:
        falhas.append("fora do llms.txt")
    if EMOJI.search(open(caminho, encoding="utf-8").read()):
        falhas.append("contém emoji")
    if falhas:
        erros.extend(f"{rel}: {f}" for f in falhas)
    else:
        print(f"OK  {rel}: {palavras} palavras, title {len(norm(p.title))}, description {len(norm(p.desc))}")


LIMITE_SEMELHANCA = 0.60


def palavras_main(caminho):
    """Palavras do <main>, com o nome da operadora trocado por X."""
    p = Leitor()
    p.feed(open(caminho, encoding="utf-8").read())
    texto = norm(" ".join(p.texto_main))
    nome = norm(p.nome_atual)
    if nome:
        texto = re.sub(re.escape(nome), "X", texto, flags=re.I)
    return texto.split()


def semelhanca_operadoras(erros):
    """Matriz de semelhança (difflib, por palavras) entre as páginas de operadora."""
    from difflib import SequenceMatcher
    paginas = sorted(glob.glob(os.path.join(RAIZ, "operadoras", "*", "index.html")))
    nomes = [os.path.basename(os.path.dirname(c)) for c in paginas]
    textos = [palavras_main(c) for c in paginas]
    print("\nSemelhança entre páginas de operadora (máx. %d%%):" % round(LIMITE_SEMELHANCA * 100))
    print("           " + " ".join("%9s" % n[:9] for n in nomes))
    pior = 0
    for i, a in enumerate(nomes):
        linha = []
        for j, b in enumerate(nomes):
            if i == j:
                linha.append("        -")
                continue
            r = SequenceMatcher(None, textos[i], textos[j]).ratio()
            linha.append("%8d%%" % round(r * 100))
            if j > i:
                pior = max(pior, r)
                if r > LIMITE_SEMELHANCA:
                    erros.append(f"operadoras/{a} × operadoras/{b}: {r:.0%} de semelhança (máx. {LIMITE_SEMELHANCA:.0%})")
        print("%-10s " % a[:10] + " ".join(linha))
    if len(nomes) > 1:
        print("maior semelhança: %d%%" % round(pior * 100))


def main():
    sitemap = open(os.path.join(RAIZ, "sitemap.xml"), encoding="utf-8").read()
    llms = open(os.path.join(RAIZ, "llms.txt"), encoding="utf-8").read()
    erros = []
    paginas = sorted(glob.glob(os.path.join(RAIZ, "**", "index.html"), recursive=True))
    for caminho in paginas:
        verificar(caminho, erros, sitemap, llms)
    semelhanca_operadoras(erros)
    for indice in ("guias", "operadoras"):
        if f"{SITE}/{indice}/" not in sitemap:
            erros.append(f"sitemap.xml: sem /{indice}/")
    if erros:
        print("\nFALHAS:")
        print("\n".join(erros))
        sys.exit(1)
    print(f"\nTudo certo: {len(paginas)} páginas verificadas.")


if __name__ == "__main__":
    main()
