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


# ----------------------------------------------------------------------
#  4. EMOJI PERSONALIZATE (128x128, fundal transparent)
#     Nu cer niciun boost — 50 de sloturi sunt gratuite pe orice server.
# ----------------------------------------------------------------------
EMOJIS = [
    ('bxd',       'mono',    'BxD', BLOOD, DIAMOND),
    ('sange',     'drop',    None, BLOOD, (255, 140, 150)),
    ('diamant',   'diamond', None, DIAMOND, DIAMOND_LIGHT),
    ('gold',      'badge',   'G', (233, 196, 106), (120, 90, 20)),
    ('exp',       'badge',   'E', (231, 111, 81), (110, 40, 25)),
    ('mid',       'badge',   'M', (160, 108, 213), (70, 40, 110)),
    ('jungle',    'badge',   'J', (42, 157, 143), (15, 70, 65)),
    ('roam',      'badge',   'R', (72, 202, 228), (20, 90, 110)),
    ('win',       'badge',   'W', (34, 197, 94), (10, 70, 35)),
    ('loss',      'badge',   'L', (239, 68, 68), (90, 20, 20)),
    ('mvp',       'badge',   'MVP', (255, 215, 0), (110, 85, 0)),
    ('scrim',     'badge',   'VS', (193, 18, 31), (70, 8, 14)),
]


# ---- embleme de rank, in stilul progresiei din joc (desen propriu) ----
SS = 4  # desenam de 4x mai mare si micsoram, ca sa iasa marginile fine

def poly(d, pts, box, **kw):
    x, y, w, h = box
    d.polygon([(x + px * w, y + py * h) for px, py in pts], **kw)

def star(d, cx, cy, r, fill, outline=None, width=0, points=5, inner=0.44):
    pts = []
    for i in range(points * 2):
        ang = math.radians(-90 + i * 180 / points)
        rad = r if i % 2 == 0 else r * inner
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=fill, outline=outline, width=width)

def vgradient(size, c1, c2):
    w, h = size
    g = Image.new('RGB', (1, 64))
    for y in range(64):
        t = y / 63
        g.putpixel((0, y), tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    return g.resize(size, Image.BICUBIC)

def wing(d, cx, cy, size, direction, color, feathers=3):
    """Aripa stilizata: cateva pene care se desfasoara lateral."""
    for i in range(feathers):
        t = i / max(1, feathers - 1)
        length = size * (1.12 - 0.20 * t)
        thick = size * (0.34 - 0.07 * t)
        y = cy - size * 0.30 + size * 0.34 * t
        x0 = cx + direction * size * 0.10
        x1 = cx + direction * length
        d.polygon([
            (x0, y - thick * 0.5), (x1, y - thick * 0.16),
            (x1, y + thick * 0.30), (x0, y + thick * 0.62),
        ], fill=color)

def crown(d, cx, cy, size, color, outline):
    pts = [(cx - size, cy + size * 0.42), (cx - size, cy - size * 0.45),
           (cx - size * 0.5, cy + size * 0.05), (cx, cy - size * 0.68),
           (cx + size * 0.5, cy + size * 0.05), (cx + size, cy - size * 0.45),
           (cx + size, cy + size * 0.42)]
    d.polygon(pts, fill=color, outline=outline, width=max(2, int(size * 0.10)))

SHIELD = [(0.5, 0.0), (0.95, 0.17), (0.95, 0.56), (0.5, 1.0), (0.05, 0.56), (0.05, 0.17)]

def make_rank(key, spec, out_dir, size=128):
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S / 2
    c1, c2 = spec['colors']
    edge = spec['edge']

    # aura pentru rank-urile mari
    if spec.get('aura'):
        glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([S*0.06, S*0.06, S*0.94, S*0.94], fill=edge + (110,))
        img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(S * 0.07)))
        d = ImageDraw.Draw(img)

    # aripi
    if spec.get('wings'):
        for direction in (-1, 1):
            wing(d, c, c * 0.96, S * 0.50, direction, edge, spec['wings'])

    # scutul, cu gradient prin masca
    box = (S * 0.235, S * 0.115, S * 0.53, S * 0.70)
    mask = Image.new('L', (S, S), 0)
    poly(ImageDraw.Draw(mask), SHIELD, box, fill=255)
    grad = vgradient((S, S), c1, c2).convert('RGBA')
    img.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(img)
    poly(d, SHIELD, box, outline=edge, width=int(S * 0.030))

    # semnul din mijloc
    mx, my = c, S * 0.435
    mark = spec['mark']
    if mark == 'star':
        star(d, mx, my, S * 0.115, edge)
    elif mark == 'gem':
        d.polygon([(mx, my - S*0.13), (mx + S*0.10, my), (mx, my + S*0.15), (mx - S*0.10, my)],
                  fill=edge, outline=(255, 255, 255, 210), width=int(S*0.016))
    elif mark == 'flame':
        d.polygon([(mx, my - S*0.16), (mx + S*0.10, my + S*0.02), (mx + S*0.05, my + S*0.14),
                   (mx - S*0.05, my + S*0.14), (mx - S*0.10, my + S*0.02)], fill=edge)
        star(d, mx, my + S*0.03, S*0.055, (255, 255, 255, 220))
    elif mark == 'burst':
        for i in range(8):
            a = math.radians(i * 45)
            d.line([(mx, my), (mx + math.cos(a) * S*0.17, my + math.sin(a) * S*0.17)],
                   fill=edge, width=int(S*0.026))
        star(d, mx, my, S*0.095, (255, 255, 255, 235))

    # stelutele de sub scut
    n = spec.get('stars', 0)
    if n:
        span = S * 0.055 * (n - 1)
        for i in range(n):
            star(d, c - span + i * S * 0.110, S * 0.845, S * 0.052, edge)

    # coroana
    if spec.get('crown'):
        crown(d, c, S * 0.115, S * 0.135, edge, (255, 255, 255, 200))

    img = img.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(out_dir, f'emoji-{key}.png'), optimize=True)
    return f'emoji-{key}.png'

RANKS = {
    'warrior':  dict(colors=((150, 105, 60), (92, 60, 30)),  edge=(214, 168, 106), mark='star',  stars=1),
    'elite':    dict(colors=((96, 150, 110), (44, 88, 60)),  edge=(150, 226, 170), mark='star',  stars=2),
    'master':   dict(colors=((70, 130, 190), (30, 70, 120)), edge=(140, 205, 250), mark='star',  stars=3),
    'gm':       dict(colors=((110, 95, 200), (55, 42, 120)), edge=(178, 165, 255), mark='gem',   stars=4, wings=2),
    'epic':     dict(colors=((160, 85, 210), (85, 35, 125)), edge=(215, 155, 255), mark='gem',   stars=5, wings=3),
    'legend':   dict(colors=((214, 110, 30), (130, 50, 10)), edge=(255, 190, 90),  mark='flame', stars=5, wings=3),
    'mythic':   dict(colors=((190, 40, 110), (95, 15, 60)),  edge=(255, 110, 180), mark='burst', wings=3, aura=True),
    'honor':    dict(colors=((205, 140, 40), (120, 70, 12)), edge=(255, 210, 110), mark='burst', wings=3, aura=True, crown=True),
    'glory':    dict(colors=((205, 55, 85), (110, 20, 40)),  edge=(255, 205, 120), mark='burst', wings=3, aura=True, crown=True),
    'immortal': dict(colors=((175, 45, 175), (70, 20, 120)), edge=(255, 130, 235), mark='burst', wings=3, aura=True, crown=True),
}



# ---- embleme de staff si de echipa (hexagon, ca sa nu se confunde cu rank-urile) ----
HEX = [(0.5, 0.0), (0.96, 0.26), (0.96, 0.74), (0.5, 1.0), (0.04, 0.74), (0.04, 0.26)]


def glyph_sword(d, cx, cy, r, color, light):
    d.polygon([(cx, cy - r * 1.05), (cx + r * 0.17, cy - r * 0.55),
               (cx + r * 0.13, cy + r * 0.45), (cx - r * 0.13, cy + r * 0.45),
               (cx - r * 0.17, cy - r * 0.55)], fill=light)
    d.rectangle([cx - r * 0.62, cy + r * 0.42, cx + r * 0.62, cy + r * 0.63], fill=color)
    d.rectangle([cx - r * 0.14, cy + r * 0.60, cx + r * 0.14, cy + r * 1.05], fill=color)


def glyph_shield(d, cx, cy, r, color, light):
    poly(d, SHIELD, (cx - r * 0.72, cy - r * 0.95, r * 1.44, r * 1.9), fill=light)
    star(d, cx, cy - r * 0.10, r * 0.34, color)


def glyph_target(d, cx, cy, r, color, light):
    for i, rad in enumerate((r * 0.95, r * 0.62, r * 0.30)):
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad],
                  fill=light if i % 2 == 0 else color,
                  outline=light, width=int(r * 0.12))


def glyph_play(d, cx, cy, r, color, light):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=light, width=int(r * 0.20))
    d.polygon([(cx - r * 0.30, cy - r * 0.46), (cx + r * 0.52, cy),
               (cx - r * 0.30, cy + r * 0.46)], fill=light)


def glyph_trophy(d, cx, cy, r, color, light):
    d.polygon([(cx - r * 0.62, cy - r * 0.85), (cx + r * 0.62, cy - r * 0.85),
               (cx + r * 0.40, cy + r * 0.20), (cx - r * 0.40, cy + r * 0.20)], fill=light)
    for side in (-1, 1):
        d.arc([cx + side * r * 0.60 - r * 0.42, cy - r * 0.80,
               cx + side * r * 0.60 + r * 0.42, cy - r * 0.05],
              0, 360, fill=light, width=int(r * 0.15))
    d.rectangle([cx - r * 0.13, cy + r * 0.18, cx + r * 0.13, cy + r * 0.62], fill=light)
    d.rectangle([cx - r * 0.52, cy + r * 0.60, cx + r * 0.52, cy + r * 0.85], fill=light)


def glyph_swap(d, cx, cy, r, color, light):
    for side in (-1, 1):
        y = cy + side * r * 0.42
        d.rectangle([cx - r * 0.62, y - r * 0.11, cx + r * 0.40, y + r * 0.11], fill=light)
        tip = cx + side * r * 0.62
        d.polygon([(tip, y), (tip - side * r * 0.34, y - r * 0.30),
                   (tip - side * r * 0.34, y + r * 0.30)], fill=light)


def glyph_cap(d, cx, cy, r, color, light):
    d.polygon([(cx, cy - r * 0.78), (cx + r, cy - r * 0.20),
               (cx, cy + r * 0.34), (cx - r, cy - r * 0.20)], fill=light)
    d.polygon([(cx - r * 0.56, cy - r * 0.02), (cx + r * 0.56, cy - r * 0.02),
               (cx + r * 0.56, cy + r * 0.52), (cx - r * 0.56, cy + r * 0.52)], fill=light)
    d.line([(cx + r * 0.92, cy - r * 0.14), (cx + r * 0.92, cy + r * 0.60)],
           fill=light, width=int(r * 0.13))


def glyph_flask(d, cx, cy, r, color, light):
    d.rectangle([cx - r * 0.20, cy - r * 0.90, cx + r * 0.20, cy - r * 0.35], fill=light)
    d.polygon([(cx - r * 0.20, cy - r * 0.40), (cx + r * 0.20, cy - r * 0.40),
               (cx + r * 0.72, cy + r * 0.78), (cx - r * 0.72, cy + r * 0.78)], fill=light)
    d.ellipse([cx - r * 0.22, cy + r * 0.18, cx + r * 0.22, cy + r * 0.58], fill=color)


GLYPHS = {'crown': None, 'sword': glyph_sword, 'shield': glyph_shield, 'target': glyph_target,
          'play': glyph_play, 'trophy': glyph_trophy, 'swap': glyph_swap, 'cap': glyph_cap,
          'flask': glyph_flask}

STAFF = {
    'owner':    dict(colors=((200, 30, 45), (105, 8, 18)),   edge=(255, 170, 120), glyph='crown',  aura=True, rays=True),
    'coowner':  dict(colors=((60, 175, 235), (20, 80, 140)), edge=(180, 235, 255), glyph='crown',  aura=True),
    'admin':    dict(colors=((215, 45, 60), (110, 18, 28)),  edge=(255, 165, 110), glyph='sword'),
    'mod':      dict(colors=((235, 110, 110), (130, 45, 45)),edge=(255, 215, 150), glyph='shield'),
    'coach':    dict(colors=((225, 150, 75), (125, 70, 25)), edge=(255, 220, 160), glyph='target'),
    'creator':  dict(colors=((160, 90, 220), (85, 35, 125)), edge=(250, 170, 255), glyph='play'),
    'roster':   dict(colors=((225, 180, 40), (125, 90, 10)), edge=(255, 235, 150), glyph='trophy', aura=True),
    'sub':      dict(colors=((175, 185, 200), (95, 105, 120)),edge=(240, 245, 255), glyph='swap'),
    'academy':  dict(colors=((70, 180, 225), (25, 85, 135)), edge=(170, 230, 255), glyph='cap'),
    'tryout':   dict(colors=((120, 190, 110), (50, 100, 45)),edge=(190, 245, 175), glyph='flask'),
}


def make_staff(key, spec, out_dir, size=128):
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S / 2
    c1, c2 = spec['colors']
    edge = spec['edge']

    if spec.get('aura'):
        glow_layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(glow_layer).ellipse([S*0.04, S*0.04, S*0.96, S*0.96], fill=edge + (110,))
        img = Image.alpha_composite(img, glow_layer.filter(ImageFilter.GaussianBlur(S * 0.065)))
        d = ImageDraw.Draw(img)

    if spec.get('rays'):
        for i in range(12):
            a = math.radians(i * 30 + 15)
            d.line([(c + math.cos(a) * S * 0.30, c + math.sin(a) * S * 0.30),
                    (c + math.cos(a) * S * 0.48, c + math.sin(a) * S * 0.48)],
                   fill=edge + (150,), width=int(S * 0.022))

    box = (S * 0.13, S * 0.09, S * 0.74, S * 0.82)
    mask = Image.new('L', (S, S), 0)
    poly(ImageDraw.Draw(mask), HEX, box, fill=255)
    img.paste(vgradient((S, S), c1, c2).convert('RGBA'), (0, 0), mask)
    d = ImageDraw.Draw(img)
    poly(d, HEX, box, outline=edge, width=int(S * 0.032))

    gx, gy, gr = c, S * 0.50, S * 0.20
    if spec['glyph'] == 'crown':
        crown(d, gx, gy + S * 0.03, gr * 1.15, edge, (255, 255, 255, 210))
    else:
        GLYPHS[spec['glyph']](d, gx, gy, gr, c2, edge)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(out_dir, f'emoji-{key}.png'), optimize=True)
    return f'emoji-{key}.png'


def make_emoji(key, kind, label, c1, c2, size=128):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = size / 2

    if kind == 'drop':
        draw_drop(d, c, c + size * 0.10, size * 0.34, c1, c2, 5)
    elif kind == 'diamond':
        draw_diamond(d, c, c - size * 0.04, size * 0.34, c1, c2, 5)
    elif kind == 'mono':
        # la 32px textul devine ilizibil, asa ca marca ramane doar din simboluri
        draw_drop(d, c - size * 0.20, c + size * 0.06, size * 0.26, c1, (255, 140, 150), 5)
        draw_diamond(d, c + size * 0.21, c - size * 0.02, size * 0.27, c2, DIAMOND_LIGHT, 5)
    else:  # badge — pastila colorata cu initiale
        d.rounded_rectangle([size * 0.06, size * 0.06, size * 0.94, size * 0.94],
                            radius=int(size * 0.30), fill=c2)
        d.rounded_rectangle([size * 0.06, size * 0.06, size * 0.94, size * 0.94],
                            radius=int(size * 0.30), outline=c1, width=6)
        f = fit_font(d, label, FONT_BOLD, size * 0.62, int(size * 0.52))
        bbox = d.textbbox((0, 0), label, font=f)
        d.text((c - (bbox[2] - bbox[0]) / 2 - bbox[0], c - (bbox[3] - bbox[1]) / 2 - bbox[1]),
               label, font=f, fill=c1)

    name = f'emoji-{key}.png'
    img.save(os.path.join(OUT, 'emoji', name), optimize=True)
    return name


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'emoji'), exist_ok=True)
    made = [make_icon(), make_welcome()]
    for key, title, sub, accent, glyph in BANNERS:
        made.append(make_banner(key, title, sub, accent, glyph))
    for name in made:
        path = os.path.join(OUT, name)
        print(f'  {name:26s} {os.path.getsize(path) // 1024:4d} KB')

    emojis = [make_emoji(*e) for e in EMOJIS]
    emojis += [make_rank(k, v, os.path.join(OUT, 'emoji')) for k, v in RANKS.items()]
    emojis += [make_staff(k, v, os.path.join(OUT, 'emoji')) for k, v in STAFF.items()]
    total = sum(os.path.getsize(os.path.join(OUT, 'emoji', n)) for n in emojis)
    print(f'  emoji/ ({len(emojis)} fisiere)      {total // 1024:4d} KB')
    print(f'\n{len(made)} imagini + {len(emojis)} emoji in assets/')
