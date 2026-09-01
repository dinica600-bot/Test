#!/usr/bin/env python3
"""
Generatorul de imagini pentru Blood×Diamonds.

Face iconul botului si banerele pentru fiecare categorie de canale.
Ruleaza cu:  python3 scripts/generate-assets.py
Ai nevoie de:  pip install pillow
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)

FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

BLOOD = (193, 18, 31)
BLOOD_DARK = (110, 8, 18)
DIAMOND = (56, 189, 248)
DIAMOND_LIGHT = (165, 233, 252)
INK = (11, 13, 18)
INK_WARM = (20, 6, 10)
WHITE = (245, 245, 250)
GREY = (150, 155, 170)


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def diagonal_gradient(size, c1, c2):
    """Fundal cu gradient pe diagonala."""
    w, h = size
    base = Image.new('RGB', (64, 64))
    px = base.load()
    for y in range(64):
        for x in range(64):
            px[x, y] = lerp(c1, c2, (x + y) / 126)
    return base.resize(size, Image.BICUBIC)


def hex_pattern(img, color, alpha=14, step=46):
    """Trama subtila de hexagoane — da textura fundalului."""
    w, h = img.size
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    r = step * 0.42
    for row, y in enumerate(range(-step, h + step, int(step * 0.86))):
        for x in range(-step, w + step, step):
            cx = x + (step // 2 if row % 2 else 0)
            pts = [(cx + r * math.cos(math.radians(60 * i - 30)),
                    y + r * math.sin(math.radians(60 * i - 30))) for i in range(6)]
            d.line(pts + [pts[0]], fill=color + (alpha,), width=1)
    return Image.alpha_composite(img.convert('RGBA'), layer)


def glow(img, box, color, radius=40, alpha=120):
    """Halou de lumina in spatele unui element."""
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius))
    return Image.alpha_composite(img.convert('RGBA'), layer)


def draw_diamond(d, cx, cy, size, fill, outline=None, width=3):
    """Diamant cu fatete."""
    top, bot = cy - size, cy + size * 1.25
    left, right = cx - size * 0.85, cx + size * 0.85
    shoulder = cy - size * 0.35
    pts = [(cx, top), (right, shoulder), (cx, bot), (left, shoulder)]
    d.polygon(pts, fill=fill, outline=outline, width=width)
    d.line([(left, shoulder), (right, shoulder)], fill=outline or fill, width=max(1, width - 1))
    d.line([(cx, top), (cx, bot)], fill=outline or fill, width=max(1, width - 1))


def draw_drop(d, cx, cy, size, fill, outline=None, width=3):
    """Picatura de sange — cercul si varful se imbina intr-o forma continua."""
    r = size
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)
    # baza triunghiului e o coarda in interiorul cercului, ca sa nu se vada imbinarea
    d.polygon([(cx, cy - r * 2.35), (cx - r * 0.87, cy + r * 0.20),
               (cx + r * 0.87, cy + r * 0.20)], fill=fill)
    if outline:
        d.arc([cx - r, cy - r, cx + r, cy + r], 25, 155, fill=outline, width=width)
        d.line([(cx, cy - r * 2.35), (cx - r * 0.92, cy + r * 0.08)], fill=outline, width=width)
        d.line([(cx, cy - r * 2.35), (cx + r * 0.92, cy + r * 0.08)], fill=outline, width=width)


def text_tracked(d, xy, text, fnt, fill, tracking=0):
    """Text cu spatiere intre litere (arata mult mai premium)."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + tracking
    return x


def tracked_width(d, text, fnt, tracking=0):
    return sum(d.textlength(c, font=fnt) + tracking for c in text) - tracking


def fit_font(d, text, path, max_width, start, tracking=0, minimum=8):
    """Micsoreaza fontul pana cand textul incape in latimea data."""
    size = start
    while size > minimum:
        f = font(path, size)
        if tracked_width(d, text, f, tracking) <= max_width:
            return f
        size -= 1
    return font(path, minimum)


def centered(d, text, fnt, fill, y, width, tracking=0):
    w = tracked_width(d, text, fnt, tracking)
    text_tracked(d, ((width - w) / 2, y), text, fnt, fill, tracking)


# ----------------------------------------------------------------------
#  1. ICONUL — pentru bot si pentru server
# ----------------------------------------------------------------------
def make_icon(size=512):
    img = diagonal_gradient((size, size), (30, 8, 15), INK).convert('RGBA')
    img = hex_pattern(img, (255, 255, 255), alpha=11, step=52)
    img = glow(img, (size * 0.02, size * 0.02, size * 0.62, size * 0.62), BLOOD, 80, 105)
    img = glow(img, (size * 0.42, size * 0.34, size * 1.02, size * 0.94), DIAMOND, 80, 75)

    d = ImageDraw.Draw(img)
    c = size / 2

    # emblema: picatura si diamantul, asezate simetric
    draw_drop(d, c - size * 0.165, c - size * 0.155, size * 0.120, BLOOD, (255, 140, 150), 4)
    draw_diamond(d, c + size * 0.175, c - size * 0.130, size * 0.125, DIAMOND, DIAMOND_LIGHT, 4)

    # monograma
    mono = font(FONT_BOLD, int(size * 0.30))
    centered(d, 'BxD', mono, WHITE, size * 0.50, size, size * 0.012)

    # numele complet, redus automat ca sa incapa
    label = 'BLOOD × DIAMONDS'
    f = fit_font(d, label, FONT_BOLD, size * 0.74, int(size * 0.085), size * 0.010)
    centered(d, label, f, (255, 105, 118), size * 0.815, size, size * 0.010)

    d.rounded_rectangle([size * 0.05, size * 0.05, size * 0.95, size * 0.95],
                        radius=int(size * 0.11), outline=(255, 255, 255, 30), width=3)
    img.convert('RGB').save(os.path.join(OUT, 'icon.png'))
    return 'icon.png'


# ----------------------------------------------------------------------
#  2. BANERE DE CATEGORIE
# ----------------------------------------------------------------------
BANNERS = [
    ('portal', 'BLOOD × DIAMONDS', 'Bine ai venit. Verifica-te si intra in squad.', BLOOD, 'both'),
    ('info', 'INFO & ANUNTURI', 'Tot ce trebuie sa stii, intr-un singur loc.', (94, 106, 210), 'diamond'),
    ('community', 'COMUNITATE', 'Aici se aduna squad-ul cand nu e pe rank.', (34, 197, 94), 'drop'),
    ('mlbb', 'MOBILE LEGENDS', 'Eroi, build-uri, meta si tot ce tine de joc.', (245, 158, 11), 'both'),
    ('competitive', 'COMPETITIV & SCRIM', 'Program, line-up, VOD review, rezultate.', (255, 215, 0), 'diamond'),
    ('academy', 'ACADEMY & TRYOUT', 'De aici incep cei care vor in roster.', (76, 201, 240), 'drop'),
    ('support', 'SUPORT', 'Ai o problema? Deschide un ticket.', (148, 163, 184), 'diamond'),
    ('voice', 'VOICE', 'Intra pe canal si hai la un rank.', (168, 85, 247), 'both'),
    ('staff', 'STAFF', 'Zona de comanda a squad-ului.', (239, 68, 68), 'drop'),
]


def make_banner(key, title, subtitle, accent, glyph, w=1024, h=256):
    img = diagonal_gradient((w, h), INK_WARM, INK).convert('RGBA')
    img = hex_pattern(img, (255, 255, 255), alpha=12, step=44)
    img = glow(img, (-90, -120, 430, 300), accent, 90, 80)
    img = glow(img, (w - 380, h - 190, w + 120, h + 130), DIAMOND, 90, 42)

    d = ImageDraw.Draw(img)
    # bara de accent din stanga
    d.rounded_rectangle([44, 62, 52, h - 62], radius=4, fill=accent)

    gx, gy = 118, h // 2
    if glyph in ('drop', 'both'):
        draw_drop(d, gx, gy - 6, 26, BLOOD, (255, 130, 140), 3)
    if glyph in ('diamond', 'both'):
        off = 62 if glyph == 'both' else 0
        draw_diamond(d, gx + off, gy + 8, 24, DIAMOND, DIAMOND_LIGHT, 3)

    tx = 216 if glyph == 'both' else 176
    ft = fit_font(d, title, FONT_BOLD, w - tx - 90, 46, 3.5)
    fs = font(FONT_REG, 21)
    text_tracked(d, (tx, h // 2 - 46), title, ft, WHITE, 3.5)
    d.text((tx + 2, h // 2 + 16), subtitle, font=fs, fill=GREY)

    fm = font(FONT_BOLD, 15)
    mark = 'BxD'
    d.text((w - d.textlength(mark, font=fm) - 40, h - 40), mark, font=fm, fill=accent)
    d.rectangle([0, h - 4, w, h], fill=accent)

    name = f'banner-{key}.png'
    img.convert('RGB').save(os.path.join(OUT, name), optimize=True)
    return name


# ----------------------------------------------------------------------
#  3. BANER DE BUN VENIT
# ----------------------------------------------------------------------
def make_welcome(w=1024, h=320):
    img = diagonal_gradient((w, h), (34, 8, 16), INK).convert('RGBA')
    img = hex_pattern(img, (255, 255, 255), alpha=14, step=40)
    img = glow(img, (w * 0.30, -140, w * 0.72, 250), BLOOD, 110, 110)
    img = glow(img, (w * 0.05, h * 0.4, w * 0.45, h * 1.3), DIAMOND, 110, 55)

    d = ImageDraw.Draw(img)
    f1 = fit_font(d, 'BUN VENIT', FONT_BOLD, w * 0.7, 62, 8)
    centered(d, 'BUN VENIT', f1, WHITE, 72, w, 8)
    f3 = fit_font(d, 'BLOOD × DIAMONDS', FONT_BOLD, w * 0.62, 30, 6)
    centered(d, 'BLOOD × DIAMONDS', f3, (255, 95, 110), 152, w, 6)
    f2 = font(FONT_REG, 24)
    t3 = 'Citeste regulile  •  Verifica-te  •  Alege-ti lane-ul'
    d.text(((w - d.textlength(t3, font=f2)) / 2, 214), t3, font=f2, fill=GREY)

    draw_drop(d, 92, h // 2, 30, BLOOD, (255, 130, 140), 3)
    draw_diamond(d, w - 92, h // 2, 28, DIAMOND, DIAMOND_LIGHT, 3)
    d.rectangle([0, h - 5, w, h], fill=BLOOD)
    img.convert('RGB').save(os.path.join(OUT, 'welcome.png'), optimize=True)
    return 'welcome.png'


if __name__ == '__main__':
    made = [make_icon(), make_welcome()]
    for key, title, sub, accent, glyph in BANNERS:
        made.append(make_banner(key, title, sub, accent, glyph))
    for name in made:
        path = os.path.join(OUT, name)
        print(f'  {name:26s} {os.path.getsize(path) // 1024:4d} KB')
    print(f'\n{len(made)} imagini in assets/')
