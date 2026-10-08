"""Gera os dados do Monitor de mercado do site.

Saídas (lidas pelo monitor.js no navegador do visitante):
  dados/radar.json    manchetes curadas de petróleo/combustíveis, meios de
                      pagamento e tributos, com veículo, site e "repercute em N"
  dados/mercado.json  WTI, Brent, dólar oficial do BC e Brent em reais

Só biblioteca padrão (roda no GitHub Actions, sem instalar nada).
Uso: python scripts/monitor_mercado.py [--saida dados]

Curadoria (o que separa o feed do site de um agregador qualquer):
  - só veículos da lista aprovada, todos em pt-BR (domínio da fonte);
  - o título precisa ter termo do tema; política partidária é descartada;
  - a mesma notícia em vários veículos vira um item só, com "repercute em N";
  - no máximo 9 itens, com pelo menos 2 por tema quando houver.
Falha de rede nunca apaga o que já está publicado: se uma parte não vier,
o arquivo anterior daquela parte é mantido.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

BRT = timezone(timedelta(hours=-3))
UA = "Mozilla/5.0 (compatible; MonitorMercado/1.0; +https://backupconciliacao.com.br)"
MAX_ITENS = 9
JANELA_HORAS = 48

# Veículos aprovados: domínio -> peso (desempate na escolha do representante).
VEICULOS = {
    "valor.globo.com": 5, "folha.uol.com.br": 5, "estadao.com.br": 5, "oglobo.globo.com": 5,
    "g1.globo.com": 4, "infomoney.com.br": 4, "exame.com": 4, "cnnbrasil.com.br": 4,
    "bloomberglinea.com.br": 4, "jota.info": 4, "agenciabrasil.ebc.com.br": 4, "gov.br": 4,
    "poder360.com.br": 3, "braziljournal.com": 3, "neofeed.com.br": 3, "istoedinheiro.com.br": 3,
    "moneytimes.com.br": 3, "investnews.com.br": 3, "seudinheiro.com": 3, "timesbrasil.com.br": 3,
    "correiobraziliense.com.br": 3, "gazetadopovo.com.br": 3, "correiodopovo.com.br": 3,
    "uol.com.br": 3, "veja.abril.com.br": 3, "migalhas.com.br": 3, "conjur.com.br": 3,
    "contabeis.com.br": 3, "epbr.com.br": 4, "petronoticias.com.br": 3, "novacana.com": 3,
    "brasilpostos.com.br": 4, "fecombustiveis.org.br": 4, "finsidersbrasil.com.br": 4,
    "mobiletime.com.br": 3, "bmcnews.com.br": 2, "cnnbrasil.com.br/economia": 4,
}

TEMAS = {
    "comb": {
        "buscas": [
            '(petróleo OR Brent OR WTI OR OPEP OR barril) (preço OR alta OR queda OR produção)',
            'Petrobras (diesel OR gasolina OR preço OR refinaria OR reajuste)',
            '(ANP OR "postos de combustíveis" OR "preço da gasolina" OR "preço do diesel" OR etanol)',
        ],
        "chaves": ["petrol", "brent", "wti", "opep", "barril", "petrobras", "diesel", "gasolina",
                   "etanol", "combustiv", "anp", "posto", "refinaria", "gnv", "biodiesel"],
    },
    "pag": {
        "buscas": [
            '("meios de pagamento" OR adquirência OR adquirente OR maquininha OR MDR OR "taxa do cartão")',
            '(Pix OR "Banco Central" OR "cartão de crédito" OR "cartão de débito") (regra OR mudança OR novidade OR tarifa)',
            '("vale-refeição" OR "vale-alimentação" OR "VA e VR" OR PAT OR "cartão frota" OR Abecs)',
        ],
        "chaves": ["pix", "pagamento", "adquir", "maquininha", "cartao", "cartoes", "mdr", "abecs",
                   "vale-refeicao", "vale-alimentacao", "va e vr", "bandeira", "credito", "debito",
                   "banco central", "fintech", "recebiveis", "antecipacao"],
    },
    "trib": {
        "buscas": [
            '("reforma tributária" OR "split payment" OR IBS OR CBS OR "imposto seletivo")',
            '(ICMS OR "PIS/Cofins" OR CONFAZ OR monofásico) (combustível OR diesel OR gasolina OR crédito)',
            '("Receita Federal" OR "nota fiscal" OR NFC-e OR SPED OR "Simples Nacional") (regra OR prazo OR mudança)',
        ],
        "chaves": ["tribut", "split payment", "ibs", "cbs", "icms", "pis", "cofins", "confaz",
                   "receita federal", "nota fiscal", "nfc-e", "sped", "imposto", "simples nacional", "fiscal"],
    },
}

# Política partidária e assuntos fora do setor: fora do site, mesmo com termo do tema.
BLOQUEIO = re.compile(
    r"\b(bolsonaro|lula|eleic|eleitor|candidat|campanha|deputad|senador|vereador|prefeit|partido|"
    r"impeachment|cpi|preso|prisao|policia|crime|morte|morre|acidente|oktoberfest|chope|leilao da receita|"
    r"horoscopo|futebol|novela|bbb|emprego|vagas|opiniao|coluna|editorial|artigo|presidencia|destaques|"
    # resumo de bolsa/juros que só cita o petróleo de passagem
    r"ibovespa|prefixad|tesouro direto|wall street|nasdaq|dow jones|bolsas?|juros|no mercado|"
    # candidatos de 2026 citados só pelo primeiro nome
    r"flavio|tarcisio|caiado|ratinho|zema|boulos|ciro gomes)",
)
# Órgãos oficiais citados no título viram "dado citado".
ORGAOS = [("ANP", r"\banp\b"), ("STF", r"\bstf\b"), ("STJ", r"\bstj\b"), ("Banco Central", r"banco central|\bbc\b"),
          ("Receita Federal", r"receita federal"), ("CONFAZ", r"\bconfaz\b"), ("IBGE", r"\bibge\b"), ("ANEEL", r"\baneel\b")]

STOP = set("a o e de da do das dos em no na nos nas para por com sem um uma que se ao aos as os mais menos "
           "sobre apos entre como ate pelo pela pelos pelas seu sua diz afirma".split())


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def baixar(url: str, timeout: int = 20) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception as e:  # rede instável não derruba o job
        print(f"  falha: {url[:90]}… ({e.__class__.__name__})", file=sys.stderr)
        return None


def gnews(q: str, dias: int = 2) -> str:
    return ("https://news.google.com/rss/search?q=" + urllib.parse.quote(f"{q} when:{dias}d")
            + "&hl=pt-BR&gl=BR&ceid=BR:pt-419")


def dominio_aprovado(url: str) -> tuple[str, int] | None:
    host = urllib.parse.urlparse(url).netloc.lower().removeprefix("www.")
    for dom, peso in VEICULOS.items():
        d = dom.split("/")[0]
        if host == d or host.endswith("." + d):
            return host, peso
    return None


def tokens(t: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", sem_acento(t)) if len(w) > 3 and w not in STOP}


def coletar(agora: datetime) -> list[dict]:
    corte = agora - timedelta(hours=JANELA_HORAS)
    brutos: list[dict] = []
    for tema, cfg in TEMAS.items():
        for q in cfg["buscas"]:
            raw = baixar(gnews(q))
            if not raw:
                continue
            try:
                root = ET.fromstring(raw)
            except ET.ParseError:
                continue
            for it in root.iter("item"):
                titulo = (it.findtext("title") or "").strip()
                src = it.find("source")
                fonte = (src.text or "").strip() if src is not None else ""
                site_url = src.get("url", "") if src is not None else ""
                ok = dominio_aprovado(site_url)
                if not ok or not titulo:
                    continue
                if fonte and titulo.endswith(" - " + fonte):
                    titulo = titulo[: -len(" - " + fonte)].strip()
                try:
                    pub = parsedate_to_datetime(it.findtext("pubDate") or "").astimezone(BRT)
                except Exception:
                    continue
                if pub < corte or pub > agora + timedelta(minutes=10):
                    continue
                norm = sem_acento(titulo)
                if BLOQUEIO.search(norm):
                    continue
                if not any(k in norm for k in cfg["chaves"]):
                    continue
                brutos.append({"tema": tema, "titulo": titulo, "link": (it.findtext("link") or "").strip(),
                               "fonte": fonte or ok[0], "site": ok[0], "peso": ok[1], "publicado": pub,
                               "tok": tokens(titulo)})
    return brutos


def agrupar(brutos: list[dict]) -> list[dict]:
    """Mesma notícia em vários veículos vira um grupo (similaridade de palavras)."""
    def parecidas(x: dict, y: dict) -> bool:
        # mesma notícia: 3+ palavras em comum, ou 2 palavras longas (nome próprio,
        # evento) no mesmo tema e com até 24 h de diferença
        comum = x["tok"] & y["tok"]
        if len(comum) >= 3 and len(comum) / max(1, len(x["tok"] | y["tok"])) >= 0.34:
            return True
        longas = {w for w in comum if len(w) >= 6}
        perto = abs((x["publicado"] - y["publicado"]).total_seconds()) <= 24 * 3600
        return len(longas) >= 2 and perto and x["tema"] == y["tema"]

    grupos: list[list[dict]] = []
    for b in sorted(brutos, key=lambda x: x["publicado"], reverse=True):
        for g in grupos:
            if any(parecidas(x, b) for x in g):
                g.append(b)
                break
        else:
            grupos.append([b])
    itens = []
    for g in grupos:
        rep = max(g, key=lambda x: (x["peso"], x["publicado"]))
        veiculos = {x["site"] for x in g}
        tema = max(set(x["tema"] for x in g), key=lambda t: sum(1 for x in g if x["tema"] == t))
        norm = sem_acento(rep["titulo"])
        dado = next((nome for nome, rx in ORGAOS if re.search(rx, norm)), None)
        itens.append({"tema": tema, "titulo": rep["titulo"], "link": rep["link"], "fonte": rep["fonte"],
                      "site": rep["site"], "publicado": max(x["publicado"] for x in g),
                      "repercute": len(veiculos), "dado": dado})
    return itens


def escolher(itens: list[dict], agora: datetime) -> list[dict]:
    def score(i):
        horas = (agora - i["publicado"]).total_seconds() / 3600
        return (min(i["repercute"], 8) * 2.5) - horas * 0.35
    ordem = sorted(itens, key=score, reverse=True)
    escolha: list[dict] = []
    for tema in TEMAS:  # garante até 2 por tema
        escolha += [i for i in ordem if i["tema"] == tema][:2]
    for i in ordem:
        if len(escolha) >= MAX_ITENS:
            break
        if i not in escolha:
            escolha.append(i)
    escolha = escolha[:MAX_ITENS]
    escolha.sort(key=lambda i: i["publicado"], reverse=True)
    for i in escolha:
        i["publicado"] = i["publicado"].isoformat(timespec="minutes")
        if i["repercute"] < 3:
            i["repercute"] = None  # selo só a partir de 3 veículos
    return escolha


# ---------------------------------------------------------------- cotações
def yahoo(simbolo: str) -> dict | None:
    def chart(rng, itv):
        raw = baixar(f"https://query1.finance.yahoo.com/v8/finance/chart/{simbolo}?range={rng}&interval={itv}")
        return json.loads(raw)["chart"]["result"][0] if raw else None
    try:
        d = chart("10d", "1d")
        dia = chart("1d", "5m")
        if d is None:
            return None
        closes = [c for c in d["indicators"]["quote"][0]["close"] if c]
        meta = dia["meta"] if dia else d["meta"]
        ultimo = float(meta.get("regularMarketPrice") or closes[-1])
        anterior = float(meta.get("chartPreviousClose") or closes[-2])
        semana_ref = closes[-6] if len(closes) >= 6 else closes[0]
        q = dia["indicators"]["quote"][0] if dia else {}
        mins = [x for x in q.get("low", []) if x]
        maxs = [x for x in q.get("high", []) if x]
        return {"ultimo": ultimo, "anterior": anterior, "semana_ref": float(semana_ref),
                "min_dia": min(mins) if mins else None, "max_dia": max(maxs) if maxs else None}
    except Exception as e:
        print(f"  yahoo {simbolo}: {e.__class__.__name__}", file=sys.stderr)
        return None


def dolar_bc() -> dict | None:
    raw = baixar("https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/8?formato=json")
    try:
        serie = [float(x["valor"]) for x in json.loads(raw)] if raw else []
        if len(serie) < 2:
            return None
        return {"ultimo": serie[-1], "anterior": serie[-2], "semana_ref": serie[-6] if len(serie) >= 6 else serie[0],
                "min_dia": None, "max_dia": None}
    except Exception:
        return None


def completar(x: dict, casas: int = 2) -> dict:
    def r(v):
        return None if v is None else round(v, casas)
    var = x["ultimo"] - x["anterior"]
    sem = x["ultimo"] - x["semana_ref"]
    return {"ultimo": r(x["ultimo"]), "var_abs": r(var), "var_pct": round(var / x["anterior"] * 100, 2),
            "semana_abs": r(sem), "semana_pct": round(sem / x["semana_ref"] * 100, 2),
            "min_dia": r(x["min_dia"]), "max_dia": r(x["max_dia"])}


FAIXAS = {"wti": (20, 250), "brent": (20, 250), "usd": (2, 15)}


def mercado(anterior: dict, agora: datetime) -> dict:
    out: dict[str, Any] = {"atualizado": agora.isoformat(timespec="minutes")}
    fontes = {"wti": lambda: yahoo("CL=F"), "brent": lambda: yahoo("BZ=F"), "usd": dolar_bc}
    for chave, fn in fontes.items():
        x = fn()
        lo, hi = FAIXAS[chave]
        if x and lo <= x["ultimo"] <= hi and lo <= x["anterior"] <= hi:
            out[chave] = completar(x, 4 if chave == "usd" else 2)
        elif chave in anterior:
            out[chave] = anterior[chave]  # mantém o último valor bom
            print(f"  {chave}: mantido do arquivo anterior", file=sys.stderr)
    if "brent" in out and "usd" in out:
        b, u = out["brent"], out["usd"]
        ult = b["ultimo"] * u["ultimo"]
        ant = (b["ultimo"] - b["var_abs"]) * (u["ultimo"] - u["var_abs"])
        out["brent_brl"] = {"ultimo": round(ult, 2), "var_abs": round(ult - ant, 2),
                            "var_pct": round((ult - ant) / ant * 100, 2)}
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Gera dados/radar.json e dados/mercado.json")
    ap.add_argument("--saida", default=str(Path(__file__).resolve().parents[1] / "dados"))
    a = ap.parse_args()
    saida = Path(a.saida)
    saida.mkdir(parents=True, exist_ok=True)
    agora = datetime.now(BRT).replace(second=0, microsecond=0)

    itens = escolher(agrupar(coletar(agora)), agora)
    if len(itens) >= 3:
        (saida / "radar.json").write_text(json.dumps({"atualizado": agora.isoformat(timespec="minutes"), "itens": itens},
                                                     ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"radar.json: {len(itens)} manchetes")
    else:
        print(f"radar.json mantido: só {len(itens)} manchetes válidas nesta rodada", file=sys.stderr)

    arq = saida / "mercado.json"
    anterior = json.loads(arq.read_text(encoding="utf-8")) if arq.exists() else {}
    m = mercado(anterior, agora)
    if any(k in m for k in ("wti", "brent", "usd")):
        arq.write_text(json.dumps(m, ensure_ascii=False, indent=1), encoding="utf-8")
        print("mercado.json:", {k: m[k]["ultimo"] for k in ("wti", "brent", "usd", "brent_brl") if k in m})
    return 0


if __name__ == "__main__":
    sys.exit(main())
