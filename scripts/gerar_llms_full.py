#!/usr/bin/env python3
"""Gera /llms-full.txt: o texto integral dos guias, das operadoras e do /sobre/,
em Markdown simples, para buscadores e assistentes de IA (só biblioteca padrão).

O conteúdo sai das próprias páginas HTML (a fonte é o HTML, não este script).
Depois de editar um guia, rode de novo:

    python3 scripts/gerar_llms_full.py

O scripts/verificar_paginas.py falha se o llms-full.txt estiver desatualizado.
"""
import html, os, re, sys
from html.parser import HTMLParser

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://backupconciliacao.com.br"
SAIDA = os.path.join(RAIZ, "llms-full.txt")

CABECALHO = """# Backup Conciliação — texto integral

> Texto integral dos guias práticos, das páginas por operadora e da página Sobre de
> https://backupconciliacao.com.br, para buscadores e assistentes de IA. Resumo do
> site em https://backupconciliacao.com.br/llms.txt. Exemplos com valores são
> ilustrativos e fictícios; prazos e regras de contestação dependem do contrato de
> cada posto com a operadora.
"""


class Extrator(HTMLParser):
    """Converte o <h1>, o .artigo e o #faq de uma página em Markdown simples."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = ""
        self.blocos = []          # linhas de Markdown
        self._pilha = []
        self._buf = None          # texto do bloco em construção
        self._prefixo = ""
        self._listas = []         # "ul" / "ol" com contador
        self._linha_tabela = None
        self._em_h1 = False
        self._pular = 0           # dentro de .relacionado, botões, formulário

    def _classes(self, a):
        return (a.get("class") or "").split()

    def _no_conteudo(self):
        return any("artigo" in self._classes(a) or a.get("id") == "faq" for _, a in self._pilha)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("img", "br", "input", "meta", "link"):
            return
        self._pilha.append((tag, a))
        c = self._classes(a)
        if tag == "h1":
            self._em_h1 = True
        if "relacionado" in c or "btn" in c or tag in ("form", "script"):
            self._pular += 1
        if self._pular or not self._no_conteudo():
            return
        if tag in ("h2", "h3", "p", "summary") or (tag == "li" and self._listas):
            self._buf = []
            if tag == "h2":
                self._prefixo = "## "
            elif tag == "h3":
                self._prefixo = "### "
            elif tag == "summary":
                self._prefixo = "### "
            elif tag == "li":
                tipo, n = self._listas[-1]
                if tipo == "ol":
                    self._listas[-1][1] += 1
                    self._prefixo = f"{self._listas[-1][1]}. "
                else:
                    self._prefixo = "- "
            else:
                self._prefixo = ""
        elif tag in ("ul", "ol"):
            self._listas.append([tag, 0])
            self.blocos.append("")
        elif tag == "tr":
            self._linha_tabela = []
        elif tag in ("td", "th"):
            self._buf = []

    def handle_endtag(self, tag):
        fechada = None
        for i in range(len(self._pilha) - 1, -1, -1):
            if self._pilha[i][0] == tag:
                fechada = self._pilha[i][1]
                del self._pilha[i:]
                break
        if tag == "h1":
            self._em_h1 = False
        if fechada is not None:
            c = self._classes(fechada)
            if "relacionado" in c or "btn" in c or tag in ("form", "script"):
                self._pular -= 1
                return
        if self._pular:
            return
        if tag in ("h2", "h3", "p", "summary", "li") and self._buf is not None:
            texto = re.sub(r"\s+", " ", "".join(self._buf)).strip()
            if texto:
                if tag in ("h2", "h3", "summary") or (tag == "p" and not self._listas):
                    self.blocos.append("")
                self.blocos.append(self._prefixo + texto)
            self._buf = None
        elif tag in ("ul", "ol") and self._listas:
            self._listas.pop()
        elif tag in ("td", "th") and self._buf is not None and self._linha_tabela is not None:
            self._linha_tabela.append(re.sub(r"\s+", " ", "".join(self._buf)).strip())
            self._buf = None
        elif tag == "tr" and self._linha_tabela is not None:
            primeira = not self.blocos or not self.blocos[-1].startswith("|")
            if primeira:
                self.blocos.append("")
            self.blocos.append("| " + " | ".join(self._linha_tabela) + " |")
            if primeira:  # a 1ª linha é o cabeçalho da tabela
                self.blocos.append("|" + "---|" * len(self._linha_tabela))
            self._linha_tabela = None

    def handle_data(self, d):
        if self._em_h1:
            self.h1 += d
        if self._buf is not None and not self._pular:
            self._buf.append(d)


def paginas():
    """Guias e operadoras na ordem dos índices, depois o /sobre/."""
    ordem = []
    for secao in ("guias", "operadoras"):
        indice = open(os.path.join(RAIZ, secao, "index.html"), encoding="utf-8").read()
        for slug in re.findall(r'class="gcard guia-card" href="/%s/([^/]+)/"' % secao, indice):
            ordem.append(f"{secao}/{slug}/")
    ordem.append("sobre/")
    return ordem


def gerar():
    partes = [CABECALHO]
    for rel in paginas():
        p = Extrator()
        p.feed(open(os.path.join(RAIZ, rel, "index.html"), encoding="utf-8").read())
        corpo = "\n".join(p.blocos).strip()
        corpo = re.sub(r"\n{3,}", "\n\n", corpo)
        titulo = re.sub(r"\s+", " ", html.unescape(p.h1)).strip()
        partes.append(f"\n---\n\n# {titulo}\n\nURL: {SITE}/{rel}\n\n{corpo}\n")
    return "".join(partes)


if __name__ == "__main__":
    texto = gerar()
    open(SAIDA, "w", encoding="utf-8").write(texto)
    print(f"llms-full.txt: {len(paginas())} páginas, {len(texto.split())} palavras")
    sys.exit(0)
