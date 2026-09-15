# -*- coding: utf-8 -*-
"""Gera o card de compartilhamento (og:image) 1200x630 do site Backup Conciliacao.

Paleta e tipografia espelham index.html: --azul #0d3b66, --azul2 #1d6fb8,
--ouro #BA7517, --ouro-claro #e0a93a.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
AZUL = (0x0d, 0x3b, 0x66)
AZUL2 = (0x1d, 0x6f, 0xb8)
OURO = (0xBA, 0x75, 0x17)
OURO_CLARO = (0xe0, 0xa9, 0x3a)
BRANCO = (0xff, 0xff, 0xff)

SEGOE_B = r"C:\Windows\Fonts\segoeuib.ttf"
SEGOE_R = r"C:\Windows\Fonts\segoeui.ttf"
SEGOE_SL = r"C:\Windows\Fonts\segoeuisl.ttf"


def f(path, size):
    return ImageFont.truetype(path, size)


# --- fundo: gradiente diagonal azul -> azul2 -------------------------------
img = Image.new("RGB", (W, H), AZUL)
px = img.load()
for y in range(H):
    for x in range(0, W, 2):
        t = (x / W) * 0.65 + (y / H) * 0.35
        c = (
            int(AZUL[0] + (AZUL2[0] - AZUL[0]) * t),
            int(AZUL[1] + (AZUL2[1] - AZUL[1]) * t),
            int(AZUL[2] + (AZUL2[2] - AZUL[2]) * t),
        )
        px[x, y] = c
        if x + 1 < W:
            px[x + 1, y] = c

d = ImageDraw.Draw(img, "RGBA")

# brilho suave no canto superior direito
for r in range(360, 0, -6):
    a = int(16 * (1 - r / 360))
    d.ellipse([W - 250 - r, -180 - r, W - 250 + r, -180 + r], fill=(255, 255, 255, a))

M = 82  # margem

# --- filete dourado --------------------------------------------------------
d.rounded_rectangle([M, 96, M + 74, 103], radius=4, fill=OURO_CLARO)

# --- marca -----------------------------------------------------------------
d.text((M, 128), "BACKUP CONCILIAÇÃO", font=f(SEGOE_B, 30), fill=OURO_CLARO)

# --- headline (3 linhas; a 3a em peso leve, como o gradiente do site) -------
LIMITE = W - 2 * M  # 1036 px uteis
linhas = [
    ("Conferência de cartões", SEGOE_B, BRANCO),
    ("no automático,", SEGOE_B, BRANCO),
    ("do portal ao centavo.", SEGOE_SL, (0xcf, 0xe0, 0xf0)),
]
TAM, ALTURA = 66, 78
y = 176
for texto, fonte, cor in linhas:
    ft = f(fonte, TAM)
    larg = d.textlength(texto, font=ft)
    # trava: nenhuma linha pode vazar a area util
    assert larg <= LIMITE, f"linha vaza {larg:.0f}px > {LIMITE}px: {texto!r}"
    print(f"  linha ok ({larg:.0f}/{LIMITE}px): {texto}")
    d.text((M, y), texto, font=ft, fill=cor)
    y += ALTURA

# --- subline ---------------------------------------------------------------
sub = "Toda transação comparada em três instâncias, para redes de postos."
ft_sub = f(SEGOE_R, 30)
assert d.textlength(sub, font=ft_sub) <= LIMITE, "subline vaza"
d.text((M, 442), sub, font=ft_sub, fill=(0xa9, 0xc0, 0xd4))

# --- chips 3-way -----------------------------------------------------------
chips = ["ERP", "OPERADORA", "CONCILIADORA"]
fx = f(SEGOE_B, 23)
x = M
for i, txt in enumerate(chips):
    w = d.textlength(txt, font=fx)
    d.rounded_rectangle([x, 486, x + w + 44, 540], radius=27, fill=(255, 255, 255, 26),
                        outline=(255, 255, 255, 60), width=2)
    d.text((x + 22, 501), txt, font=fx, fill=BRANCO)
    x += w + 44
    if i < len(chips) - 1:
        d.text((x + 16, 499), "×", font=f(SEGOE_SL, 30), fill=OURO_CLARO)
        x += 50
assert x <= W - M, f"fila de chips vaza: {x} > {W - M}"
print(f"  chips ok (termina em {x}px, limite {W - M}px)")

# --- rodape ----------------------------------------------------------------
d.line([M, 566, W - M, 566], fill=(255, 255, 255, 38), width=2)
d.text((M, 582), "backupconciliacao.com.br", font=f(SEGOE_B, 26), fill=BRANCO)

img.save(r"C:\Users\RenatoSouza88\Desktop\backupconciliacao-site\og-image.png",
         "PNG", optimize=True)
print("og-image.png gerado:", img.size)
