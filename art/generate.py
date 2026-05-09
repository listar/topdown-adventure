"""
Cinnabar Apocrypha — visual expression of the design philosophy.

Generates 5 art pieces for the game "仙踪奇缘 / Cinnabar Apocrypha":
  1. logo.png       — title screen / hero banner          1920 x 1080
  2. characters.png — character roster as 'specimen plate' 1200 x 1600
  3. scene-village.png  / scene-forest.png / scene-cave.png  1200 x 1600 each
  4. app-icon.png   — single seal at high resolution       1024 x 1024
  5. battle-bg.png  — atmospheric battle backdrop          1920 x 1080

Plus: art-bible.pdf — bundled coffee-table presentation.

Aesthetic: Han-dynasty silk apocrypha, cinnabar seals, ink-wash mountains,
clinical taxonomic markers. The kind of artifact recovered from a tomb.
"""

import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageOps

random.seed(417)  # deterministic so refinements stay aligned

# ---------- paths ----------
ROOT = "/sessions/pensive-affectionate-mccarthy/mnt/games/topdown-adventure/art"
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(ASSETS, exist_ok=True)

FONT_DIR = "/sessions/pensive-affectionate-mccarthy/mnt/.claude/skills/canvas-design/canvas-fonts"
CJK_FONT = "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf"
F_DISPLAY  = os.path.join(FONT_DIR, "Italiana-Regular.ttf")
F_SERIF    = os.path.join(FONT_DIR, "Gloock-Regular.ttf")
F_BODY     = os.path.join(FONT_DIR, "CrimsonPro-Regular.ttf")
F_BODY_I   = os.path.join(FONT_DIR, "CrimsonPro-Italic.ttf")
F_PLEX     = os.path.join(FONT_DIR, "IBMPlexSerif-Regular.ttf")
F_PLEX_B   = os.path.join(FONT_DIR, "IBMPlexSerif-Bold.ttf")
F_MONO     = os.path.join(FONT_DIR, "DMMono-Regular.ttf")

def font(path, size):
    return ImageFont.truetype(path, size)

# ---------- palette (silk / ink / cinnabar / aged gold) ----------
PAPER_LIGHT = (236, 224, 198)   # warm silk highlight
PAPER       = (220, 204, 172)   # main silk body
PAPER_DARK  = (192, 173, 138)   # silk shadow / aged corner
INK         = (24, 20, 16)
INK_SOFT    = (60, 52, 44)
INK_MIST    = (120, 110, 96)
CINNABAR    = (172, 50, 38)     # the red of seals, the soul of the page
CINNABAR_D  = (130, 32, 24)
GOLD_OLD    = (170, 140, 80)
GOLD_DUST   = (130, 105, 60)


# ============================================================
# PRIMITIVES — the brush, the silk, the seal
# ============================================================

def make_silk(w, h, base=PAPER, dark=PAPER_DARK, light=PAPER_LIGHT, seed=0):
    """A patient silk ground: subtle warp/weft, water-stains, edge-fade."""
    rnd = random.Random(seed)
    img = Image.new("RGB", (w, h), base)
    px = img.load()

    # 1. weft/warp grain — vertical and horizontal noise
    grain = Image.new("L", (w, h), 128)
    gp = grain.load()
    for y in range(h):
        # gentle horizontal banding
        v_band = int(8 * math.sin(y * 0.013) + 4 * math.sin(y * 0.041 + 1.3))
        for x in range(w):
            v_warp = int(6 * math.sin(x * 0.017 + 2.1))
            n = rnd.randint(-6, 6)
            gp[x, y] = max(0, min(255, 128 + v_band + v_warp + n))
    grain = grain.filter(ImageFilter.GaussianBlur(0.7))

    # apply grain by lightening / darkening
    out = img.load()
    g = grain.load()
    for y in range(h):
        for x in range(w):
            r, gc, b = out[x, y]
            d = (g[x, y] - 128) / 255.0
            out[x, y] = (
                max(0, min(255, int(r + d * 30))),
                max(0, min(255, int(gc + d * 28))),
                max(0, min(255, int(b + d * 22))),
            )

    # 2. soft water-stains (large blobs slightly darker)
    stain_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stain_layer)
    for _ in range(rnd.randint(3, 6)):
        cx = rnd.randint(-w // 8, w + w // 8)
        cy = rnd.randint(-h // 8, h + h // 8)
        rx = rnd.randint(w // 4, int(w * 0.8))
        ry = rnd.randint(h // 6, int(h * 0.6))
        alpha = rnd.randint(8, 22)
        sd.ellipse((cx - rx, cy - ry, cx + rx, cy + ry),
                   fill=(dark[0] - 30, dark[1] - 30, dark[2] - 30, alpha))
    stain_layer = stain_layer.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img.convert("RGBA"), stain_layer).convert("RGB")

    # 3. edge fade / vignette to dark
    vign = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vign)
    margin = max(w, h) // 16
    vd.rectangle((margin, margin, w - margin, h - margin), fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(margin * 0.9))
    out = Image.composite(img, Image.new("RGB", (w, h),
                                         (dark[0] - 25, dark[1] - 25, dark[2] - 25)),
                          vign)

    # 4. faint speckle (age spots, dust)
    speck = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(speck)
    for _ in range(int(w * h / 1800)):
        x = rnd.randint(0, w - 1); y = rnd.randint(0, h - 1)
        a = rnd.randint(10, 36)
        rr = rnd.choice([1, 1, 1, 2])
        c = (50, 38, 28) if rnd.random() < 0.7 else (110, 80, 40)
        sd.ellipse((x, y, x + rr, y + rr), fill=(*c, a))
    out = Image.alpha_composite(out.convert("RGBA"), speck).convert("RGB")

    # 5. one or two folds across the silk — subtle creases
    fold = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fold)
    for _ in range(rnd.randint(1, 2)):
        if rnd.random() < 0.5:
            x = rnd.randint(int(w * 0.2), int(w * 0.8))
            fd.line((x, -10, x + rnd.randint(-30, 30), h + 10),
                    fill=(40, 30, 20, 22), width=1)
        else:
            y = rnd.randint(int(h * 0.2), int(h * 0.8))
            fd.line((-10, y, w + 10, y + rnd.randint(-30, 30)),
                    fill=(40, 30, 20, 22), width=1)
    fold = fold.filter(ImageFilter.GaussianBlur(1.2))
    out = Image.alpha_composite(out.convert("RGBA"), fold).convert("RGB")
    return out


def cinnabar_seal(text_cjk, size=180, seed=0, weathered=True):
    """Square cinnabar stamp with carved characters. The single moment of red."""
    rnd = random.Random(seed)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # outer red frame, slightly off-square
    pad = max(2, size // 30)
    inner = pad
    # the body of the seal — solid cinnabar
    d.rectangle((inner, inner, size - inner, size - inner),
                fill=(*CINNABAR, 235),
                outline=(*CINNABAR_D, 255),
                width=max(2, size // 28))

    # carved characters in negative space (white-paper colour, slightly imperfect)
    n = len(text_cjk)
    if n == 0: return img
    if n == 1:
        # large single char
        font_size = int(size * 0.62)
        f = font(CJK_FONT, font_size)
        bbox = d.textbbox((0, 0), text_cjk, font=f)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx = (size - tw) // 2 - bbox[0]
        ty = (size - th) // 2 - bbox[1]
        d.text((tx, ty), text_cjk, fill=PAPER, font=f)
    else:
        # 2x2 grid (right-to-left, top-to-bottom — traditional reading)
        cell = (size - inner * 2) / 2
        font_size = int(cell * 0.78)
        f = font(CJK_FONT, font_size)
        positions = [(1, 0), (0, 0), (1, 1), (0, 1)]  # 右上, 左上, 右下, 左下
        for i, ch in enumerate(text_cjk[:4]):
            cx_idx, cy_idx = positions[i]
            cx = inner + cell * cx_idx + cell / 2
            cy = inner + cell * cy_idx + cell / 2
            bbox = d.textbbox((0, 0), ch, font=f)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
            tx = cx - tw / 2 - bbox[0]
            ty = cy - th / 2 - bbox[1]
            d.text((tx, ty), ch, fill=PAPER, font=f)

    if weathered:
        # punch holes — random transparent spots simulating worn ink
        worn = Image.new("L", (size, size), 255)
        wd = ImageDraw.Draw(worn)
        for _ in range(int(size * size / 220)):
            x = rnd.randint(0, size - 1)
            y = rnd.randint(0, size - 1)
            r = rnd.choice([1, 1, 2, 2, 3])
            wd.ellipse((x - r, y - r, x + r, y + r), fill=rnd.randint(150, 230))
        worn = worn.filter(ImageFilter.GaussianBlur(0.6))
        # multiply seal alpha by worn
        alpha = img.split()[3]
        new_alpha = ImageChops.multiply(alpha, worn)
        img.putalpha(new_alpha)

        # slight rotation — never perfectly square
        img = img.rotate(rnd.uniform(-2.5, 2.5), resample=Image.BICUBIC, expand=True)

    return img


def ink_stroke(draw, points, max_w=14, color=INK, taper=True):
    """Tapered brush stroke through points (list of (x,y))."""
    if len(points) < 2: return
    # interpolate
    n = len(points)
    for i in range(n - 1):
        p, q = points[i], points[i + 1]
        steps = max(2, int(math.hypot(q[0]-p[0], q[1]-p[1]) / 1.5))
        for s in range(steps):
            t = (i + s/steps) / (n - 1)
            x = p[0] + (q[0] - p[0]) * (s/steps)
            y = p[1] + (q[1] - p[1]) * (s/steps)
            if taper:
                # heavy in middle, light at ends
                w = max_w * (1 - (2*t - 1)**2)
            else:
                w = max_w
            r = max(0.6, w / 2)
            draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def _bezier(p0, p1, p2, p3, n=24):
    out = []
    for i in range(n + 1):
        t = i / n
        x = (1-t)**3 * p0[0] + 3*(1-t)**2*t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
        y = (1-t)**3 * p0[1] + 3*(1-t)**2*t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
        out.append((x, y))
    return out


def mountain_layer(w, h, color, base_y, peaks=5, peak_height=120, jitter=20, seed=0):
    """An ink-painted ridge — curved, asymmetric, natural. Not triangles."""
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # Walk the ridge as a sequence of cubic bezier segments with natural curvature.
    seg = w / max(peaks, 1)
    nodes = []
    nodes.append((-seg * 0.4, base_y + jitter))
    for i in range(peaks + 1):
        x = -seg * 0.3 + i * seg + rnd.uniform(-jitter, jitter)
        rise = peak_height * (0.5 + rnd.random() * 0.7) if i % 2 == 1 \
               else peak_height * (0.2 + rnd.random() * 0.4)
        y = base_y - rise
        nodes.append((x, y))
    nodes.append((w + seg * 0.4, base_y + jitter * 0.8))

    # Build a smooth path through the nodes using Catmull-Rom-ish bezier segs
    pts = []
    for i in range(len(nodes) - 1):
        p0 = nodes[max(0, i - 1)]
        p1 = nodes[i]
        p2 = nodes[i + 1]
        p3 = nodes[min(len(nodes) - 1, i + 2)]
        # control points
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        # add a little organic noise to control points
        c1 = (c1[0] + rnd.uniform(-jitter * 0.3, jitter * 0.3),
              c1[1] + rnd.uniform(-jitter * 0.5, jitter * 0.2))
        c2 = (c2[0] + rnd.uniform(-jitter * 0.3, jitter * 0.3),
              c2[1] + rnd.uniform(-jitter * 0.5, jitter * 0.2))
        pts.extend(_bezier(p1, c1, c2, p2, n=20))

    # close the polygon down off the canvas
    poly = pts + [(w + 50, h + 50), (-50, h + 50)]
    d = ImageDraw.Draw(layer)
    d.polygon(poly, fill=color)

    # add an upper-edge brush hint — slightly darker line riding the ridge,
    # painted with quick variable strokes
    edge = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge)
    edge_color = (color[0], color[1], color[2], min(255, color[3] + 40)) if len(color) == 4 \
                 else (color[0], color[1], color[2], 200)
    for i in range(len(pts) - 1):
        a = pts[i]
        b = pts[i + 1]
        # variable stroke width
        thickness = 1 + (math.sin(i * 0.1 + seed) + 1) * 0.5
        ed.line((a, b), fill=edge_color, width=int(round(thickness)))
    edge = edge.filter(ImageFilter.GaussianBlur(0.6))
    layer = Image.alpha_composite(layer, edge)
    return layer


def ink_mountains(w, h, top_y, palette_dark, fade_to_paper=True, seed=0):
    """A range of three or four mist-fading mountain layers."""
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rnd = random.Random(seed)
    layers = [
        # (color_alpha, base_y_ratio, peaks, peak_h, jitter)
        ((*INK_MIST, 70),  0.05, 4, h * 0.12, 50),
        ((*INK_MIST, 110), 0.18, 5, h * 0.16, 40),
        ((*INK_SOFT, 160), 0.32, 4, h * 0.20, 35),
        ((*palette_dark, 200), 0.46, 5, h * 0.22, 25),
    ]
    for col, by, peaks, ph, j in layers:
        ly = mountain_layer(w, h,
                            color=col,
                            base_y=top_y + by * h,
                            peaks=peaks, peak_height=ph,
                            jitter=j, seed=rnd.randint(0, 9999))
        ly = ly.filter(ImageFilter.GaussianBlur(0.6))
        base = Image.alpha_composite(base, ly)
    return base


def cloud(w, h, color=(*INK_MIST, 90), seed=0):
    """A wisp of horizontal cloud stripes — Han dynasty cloud iconography."""
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cy = h // 2
    # horizontal ribbons
    for i in range(rnd.randint(3, 5)):
        y = cy + (i - 2) * 8 + rnd.randint(-3, 3)
        x0 = rnd.randint(0, w // 4)
        x1 = w - rnd.randint(0, w // 4)
        # taper ends
        for x in range(x0, x1, 2):
            t = (x - x0) / max(1, x1 - x0)
            taper = math.sin(t * math.pi)
            r = 4 * taper
            if r > 0.5:
                d.ellipse((x - r, y - r, x + r, y + r), fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(0.8))
    return layer


def stipple(layer, n, color, w, h, seed=0):
    """Light dot stipple over a layer — astronomical / taxonomic."""
    rnd = random.Random(seed)
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x = rnd.randint(0, w - 1)
        y = rnd.randint(0, h - 1)
        r = rnd.choice([0.5, 1, 1, 1.5])
        d.ellipse((x - r, y - r, x + r, y + r), fill=color)


def small_constellation(layer, cx, cy, r, color, seed=0):
    """A few connected stars — adds the 'astronomical' Han silk feel."""
    rnd = random.Random(seed)
    d = ImageDraw.Draw(layer)
    n = rnd.randint(4, 7)
    pts = []
    for i in range(n):
        a = rnd.uniform(0, math.tau)
        d_ = rnd.uniform(0.3, 1.0) * r
        pts.append((cx + math.cos(a) * d_, cy + math.sin(a) * d_))
    # lines
    for i in range(len(pts) - 1):
        d.line((pts[i], pts[i + 1]), fill=color, width=1)
    # dots
    for x, y in pts:
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=color)
        d.ellipse((x - 0.5, y - 0.5, x + 0.5, y + 0.5), fill=PAPER_LIGHT)


def measure_text(d, text, f):
    bb = d.textbbox((0, 0), text, font=f)
    return bb[2] - bb[0], bb[3] - bb[1], bb[0], bb[1]


def vline(layer, x, y0, y1, color=INK, width=1, dots_at=None):
    d = ImageDraw.Draw(layer)
    d.line((x, y0, x, y1), fill=color, width=width)
    if dots_at:
        for y in dots_at:
            d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=color)


def hline(layer, x0, x1, y, color=INK, width=1):
    d = ImageDraw.Draw(layer)
    d.line((x0, y, x1, y), fill=color, width=width)


def draw_taxonomic_marker(layer, x, y, label, num,
                          orient="left", color=INK, accent=CINNABAR):
    """Tiny clinical reference marker — like a footnote on a Han silk diagram."""
    d = ImageDraw.Draw(layer)
    f_label = font(F_MONO, 11)
    f_num = font(F_MONO, 9)
    line_len = 60
    if orient == "left":
        d.line((x, y, x - line_len, y), fill=color, width=1)
        # cinnabar dot
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=accent)
        d.text((x - line_len, y - 16), num, fill=color, font=f_num)
        d.text((x - line_len, y + 4), label, fill=color, font=f_label)
    else:
        d.line((x, y, x + line_len, y), fill=color, width=1)
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=accent)
        d.text((x + line_len - 60, y - 16), num, fill=color, font=f_num)
        d.text((x + line_len - 60, y + 4), label, fill=color, font=f_label)


def vertical_text(layer, text, x, y, f, fill=INK, line_spacing=8):
    """Stack CJK characters vertically — traditional scroll layout."""
    d = ImageDraw.Draw(layer)
    cy = y
    for ch in text:
        bb = d.textbbox((0, 0), ch, font=f)
        cw = bb[2] - bb[0]
        ch_h = bb[3] - bb[1]
        d.text((x - cw / 2 - bb[0], cy - bb[1]), ch, fill=fill, font=f)
        cy += ch_h + line_spacing


# ============================================================
# COMPOSITION 1 — the title page
# ============================================================

def make_logo():
    W, H = 1920, 1080
    img = make_silk(W, H, seed=1)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Frame — three thin ink rules: a Han silk-page enclosure
    fx0, fy0, fx1, fy1 = 100, 80, W - 100, H - 80
    d.rectangle((fx0, fy0, fx1, fy1), outline=(*INK, 220), width=1)
    d.rectangle((fx0 + 14, fy0 + 14, fx1 - 14, fy1 - 14), outline=(*INK, 80), width=1)
    d.rectangle((fx0 + 22, fy0 + 22, fx1 - 22, fy1 - 22), outline=(*INK_MIST, 70), width=1)

    # cinnabar corner cuts — quiet seal-like markers on the frame
    for cx, cy in [(fx0, fy0), (fx1, fy0), (fx0, fy1), (fx1, fy1)]:
        d.line((cx - 18, cy, cx + 18, cy), fill=(*CINNABAR, 200), width=2)
        d.line((cx, cy - 18, cx, cy + 18), fill=(*CINNABAR, 200), width=2)

    # Distant ink mountains across the lower half — implied landscape
    mt = ink_mountains(W, H, top_y=H * 0.45, palette_dark=INK_SOFT, seed=11)
    overlay = Image.alpha_composite(overlay, mt)

    # Cloud band above the mountains
    cb = cloud(900, 80, color=(*INK_MIST, 80), seed=4)
    overlay.paste(cb, (W // 2 - 450, int(H * 0.36)), cb)
    cb2 = cloud(700, 60, color=(*INK_MIST, 60), seed=7)
    overlay.paste(cb2, (W // 2 - 350, int(H * 0.30)), cb2)

    # Stipple sky — a few stars
    star_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(star_layer)
    rnd = random.Random(31)
    for _ in range(36):
        x = rnd.randint(120, W - 120)
        y = rnd.randint(120, int(H * 0.32))
        r = rnd.choice([0.6, 1, 1.5])
        sd.ellipse((x - r, y - r, x + r, y + r), fill=(*INK, 140))
    overlay = Image.alpha_composite(overlay, star_layer)

    # ----- Title characters: 仙踪奇缘 — vertically arranged on the right -----
    # Vertical placement on right column lends the composition a scroll axis.
    # We treat the four characters with deliberate breath between them.
    title_x = int(W * 0.78)
    title_top = 130
    f_title = font(CJK_FONT, 168)
    # Each character set in a quiet square cell
    title_chars = "仙踪奇缘"
    cell_h = 200
    title_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(title_layer)
    for i, ch in enumerate(title_chars):
        cy = title_top + i * cell_h
        bb = td.textbbox((0, 0), ch, font=f_title)
        tw = bb[2] - bb[0]
        th = bb[3] - bb[1]
        td.text((title_x - tw / 2 - bb[0], cy + 90 - th / 2 - bb[1]),
                ch, fill=INK, font=f_title)
    overlay = Image.alpha_composite(overlay, title_layer)

    # main subtitle in serif — placed in the upper-left, with breathing room
    sd = ImageDraw.Draw(overlay)
    f_sub_serif = font(F_SERIF, 34)
    sd.text((230, 170), "an illustrated chronicle of",
            fill=INK_SOFT, font=font(F_BODY_I, 26))
    sd.text((230, 212), "Spirits, Mountains, and the",
            fill=INK, font=f_sub_serif)
    sd.text((230, 256), "Sealed Beasts of the Apocrypha",
            fill=INK, font=f_sub_serif)

    # Latin display title — sits in the lower left, large but light
    f_title_lat = font(F_DISPLAY, 96)
    sd.text((230, H - 320), "Cinnabar", fill=INK, font=f_title_lat)
    sd.text((230, H - 240), "Apocrypha", fill=INK, font=f_title_lat)

    # tiny spec line beneath the latin title
    f_mono = font(F_MONO, 13)
    sd.text((232, H - 132), "VOLUME · I  ·  MMXXVI", fill=INK_SOFT, font=f_mono)
    sd.text((232, H - 112), "FIELD MANUAL OF THE THREE REALMS", fill=INK_MIST, font=f_mono)

    # Single cinnabar focal seal at lower-left of title block
    seal = cinnabar_seal("仙踪", size=130, seed=2)
    overlay.paste(seal, (title_x - 220, title_top + 4 * cell_h - 90), seal)

    # Two tiny taxonomic markers — placed inside the central mountain image,
    # pointing at the cloud band and the highest ridge. Kept clear of all text.
    tx_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_taxonomic_marker(tx_layer, int(W * 0.50), int(H * 0.36),
                          "MIST · BAND",     "α", "right")
    draw_taxonomic_marker(tx_layer, int(W * 0.40), int(H * 0.62),
                          "MOUNTAIN · NEAR", "β", "left")
    overlay = Image.alpha_composite(overlay, tx_layer)

    # bottom-edge colophon
    f_col = font(F_MONO, 11)
    sd = ImageDraw.Draw(overlay)
    sd.text((fx0 + 30, fy1 - 40), "PRESSED & BROUND IN SILK · AN APOCRYPHAL EDITION", fill=INK_SOFT, font=f_col)
    sd.text((fx1 - 240, fy1 - 40), "PL. I  ·  仙踪奇缘", fill=INK_SOFT, font=f_col)

    out = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    out.save(os.path.join(ASSETS, "logo.png"))
    return out


# ============================================================
# COMPOSITION 2 — character "specimen plate"
# ============================================================

CHARACTERS = [
    # name_cn, name_en, role, palette
    ("云逸",   "YUN-YI",   "PROTAGONIST · WANDERING BLADE",   (180, 60, 60)),
    ("李长老", "LI ELDER", "VILLAGE · KEEPER OF THE GATE",    (140, 90, 160)),
    ("王掌柜", "WANG",     "VILLAGE · MERCHANT OF SMALL THINGS", (90, 110, 150)),
    ("小丫",   "XIAO-YA",  "VILLAGE · CHILD OF THE FIELDS",   (220, 150, 180)),
    ("云游道士", "DAO-SHI", "FOREST · ITINERANT TAOIST",       (190, 190, 190)),
    ("神秘老者", "MYSTIC",  "CAVE · KEEPER OF THE SEAL",       (90, 90, 130)),
]

def draw_figure(layer, cx, cy, scale, palette):
    """Stylised standing figure rendered as an ink specimen — long flowing
    robe, narrow shoulders, suggestion of a head, a single brush-line for
    the central seam. Kept abstract, not cartoony."""
    s = scale
    rnd = random.Random(int(cx * 7 + cy * 13))

    # robe silhouette — long, gently asymmetric, hand-drawn curve
    robe_layer = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(robe_layer)
    # build the robe as a closed bezier-ish polygon with two outward curves
    # left side
    left = []
    nL = 14
    for i in range(nL + 1):
        t = i / nL
        # widens from shoulder (narrow) to hem (wide)
        spread_x = -s * (0.55 + 1.20 * t**1.5) - rnd.uniform(0, 0.06) * s
        # length
        y = cy - s * 0.6 + s * 5.0 * t
        left.append((cx + spread_x, y))
    # right side
    right = []
    for i in range(nL + 1):
        t = i / nL
        spread_x = s * (0.55 + 1.20 * t**1.5) + rnd.uniform(0, 0.06) * s
        y = cy - s * 0.6 + s * 5.0 * t
        right.append((cx + spread_x, y))
    # hem — gentle wave
    hem = []
    nH = 10
    for i in range(nH + 1):
        t = i / nH
        x = right[-1][0] + (left[-1][0] - right[-1][0]) * t
        y = cy + s * 4.4 + math.sin(t * math.pi) * 6
        hem.append((x, y))
    # neckline
    neck = [
        (cx - s * 0.25, cy - s * 0.6),
        (cx, cy - s * 0.45),
        (cx + s * 0.25, cy - s * 0.6),
    ]

    poly = neck + right + hem + list(reversed(left))
    rd.polygon(poly, fill=(*palette, 175), outline=(*INK, 220))

    # subtle robe shadow on one side (makes it look painted, not flat)
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sd_ = ImageDraw.Draw(shadow)
    inside = []
    for (x, y) in left:
        inside.append((x + 6, y))
    inside_top = (cx, cy - s * 0.45)
    sd_.polygon([inside_top] + inside + [(cx, cy + s * 4.4)],
                fill=(*INK, 50))
    shadow = shadow.filter(ImageFilter.GaussianBlur(2.0))
    robe_layer = Image.alpha_composite(robe_layer, shadow)

    # belt — short cinnabar mark, off-center
    bd = ImageDraw.Draw(robe_layer)
    bd.line((cx - s * 0.35, cy + s * 1.6, cx + s * 0.35, cy + s * 1.6),
            fill=(*CINNABAR, 220), width=2)

    # central seam — quiet ink line
    bd.line((cx, cy - s * 0.45, cx, cy + s * 4.4), fill=(*INK, 100), width=1)

    layer.alpha_composite(robe_layer)

    # ----- head -----
    d = ImageDraw.Draw(layer)
    # head: a soft ellipse, slightly oblong
    head_w = s * 1.05
    head_h = s * 1.30
    hx0 = cx - head_w / 2
    hy0 = cy - s * 1.95
    d.ellipse((hx0, hy0, hx0 + head_w, hy0 + head_h),
              fill=(238, 220, 192), outline=(*INK, 240), width=1)

    # hair / cap — varies per palette to suggest different headwear
    hue = sum(palette) / 3
    cap_layer = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    cl = ImageDraw.Draw(cap_layer)
    if hue > 200:  # child / pink — small simple bun
        cl.ellipse((hx0 + head_w * 0.3, hy0 - s * 0.25,
                    hx0 + head_w * 0.7, hy0 + s * 0.05),
                   fill=(*INK, 230))
    elif hue > 150:  # mystic — flat scholar's cap
        cl.polygon([
            (hx0 - 4, hy0 + 2),
            (hx0 + head_w + 4, hy0 + 2),
            (hx0 + head_w * 0.95, hy0 + s * 0.30),
            (hx0 + head_w * 0.05, hy0 + s * 0.30),
        ], fill=(*INK, 240))
    else:  # elder / pointed hat
        cl.polygon([
            (hx0 + head_w * 0.5, hy0 - s * 0.55),
            (hx0 - 4, hy0 + s * 0.20),
            (hx0 + head_w + 4, hy0 + s * 0.20),
        ], fill=(*INK, 240))
    layer.alpha_composite(cap_layer)

    # eyes — single ink dot each
    d = ImageDraw.Draw(layer)
    eye_y = hy0 + head_h * 0.55
    d.ellipse((cx - s * 0.30, eye_y - 2, cx - s * 0.18, eye_y + 1), fill=INK)
    d.ellipse((cx + s * 0.18, eye_y - 2, cx + s * 0.30, eye_y + 1), fill=INK)

    # sleeves — sweeping tapers from shoulders
    sl = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sld = ImageDraw.Draw(sl)
    # left sleeve
    sld.polygon([
        (cx - s * 0.55, cy - s * 0.5),
        (cx - s * 1.85, cy + s * 1.6),
        (cx - s * 1.55, cy + s * 1.85),
        (cx - s * 0.40, cy + s * 0.9),
    ], fill=(*INK, 75))
    sld.polygon([
        (cx + s * 0.55, cy - s * 0.5),
        (cx + s * 1.85, cy + s * 1.6),
        (cx + s * 1.55, cy + s * 1.85),
        (cx + s * 0.40, cy + s * 0.9),
    ], fill=(*INK, 75))
    sl = sl.filter(ImageFilter.GaussianBlur(0.5))
    layer.alpha_composite(sl)


def make_characters():
    W, H = 1200, 1600
    img = make_silk(W, H, seed=2)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # frame
    fx0, fy0, fx1, fy1 = 80, 70, W - 80, H - 70
    d.rectangle((fx0, fy0, fx1, fy1), outline=(*INK, 220), width=1)
    d.rectangle((fx0 + 10, fy0 + 10, fx1 - 10, fy1 - 10), outline=(*INK, 60), width=1)

    # Plate head — heading
    f_h = font(F_DISPLAY, 60)
    f_sm = font(F_MONO, 14)
    f_sub = font(F_BODY_I, 28)
    d.text((fx0 + 40, fy0 + 40), "Specimens of the", fill=INK_SOFT, font=f_sub)
    d.text((fx0 + 40, fy0 + 80), "Three Realms", fill=INK, font=f_h)
    d.text((fx0 + 40, fy0 + 158), "PLATE · II  ·  DRAMATIS PERSONAE", fill=INK_SOFT, font=f_sm)

    # Vertical CJK heading on right
    f_cjk_h = font(CJK_FONT, 44)
    vertical_text(overlay, "三界人物图", fx1 - 70, fy0 + 60, f_cjk_h, fill=INK)

    # ornamental rule under heading
    d.line((fx0 + 40, fy0 + 200, fx1 - 200, fy0 + 200), fill=INK, width=1)
    d.ellipse((fx0 + 40, fy0 + 196, fx0 + 48, fy0 + 204), fill=CINNABAR)

    # 2 x 3 grid of figures
    grid_x0, grid_y0 = fx0 + 80, fy0 + 280
    cell_w, cell_h = 480, 370
    cols, rows = 2, 3

    for idx, (cn, en, role, pal) in enumerate(CHARACTERS):
        col = idx % cols
        row = idx // cols
        x0 = grid_x0 + col * cell_w
        y0 = grid_y0 + row * cell_h
        cx = x0 + cell_w / 2 - 40
        cy = y0 + 60
        # subtle cell frame
        d.rectangle((x0, y0, x0 + cell_w - 40, y0 + cell_h - 30),
                    outline=(*INK, 30), width=1)
        # figure
        draw_figure(overlay, cx, cy + 60, 36, pal)
        # cinnabar dot reference number
        d.ellipse((x0 + 20, y0 + 20, x0 + 32, y0 + 32), fill=CINNABAR)
        d.text((x0 + 38, y0 + 14), f"№ {idx+1:02d}", fill=INK, font=font(F_MONO, 16))
        # CJK name
        f_name_cjk = font(CJK_FONT, 30)
        d.text((x0 + 20, y0 + cell_h - 130), cn, fill=INK, font=f_name_cjk)
        # latin name
        d.text((x0 + 20, y0 + cell_h - 90), en, fill=INK, font=font(F_PLEX_B, 18))
        # role label
        d.text((x0 + 20, y0 + cell_h - 65), role, fill=INK_SOFT, font=font(F_MONO, 11))
        # tiny axis line
        d.line((x0 + 20, y0 + cell_h - 50, x0 + cell_w - 70, y0 + cell_h - 50),
               fill=(*INK, 80), width=1)
        # taxonomic marker beside head
        marker_x = cx + 90
        marker_y = cy + 30
        ImageDraw.Draw(overlay).line((cx + 30, cy + 10, marker_x, marker_y),
                                     fill=INK, width=1)
        ImageDraw.Draw(overlay).ellipse((cx + 28, cy + 8, cx + 34, cy + 14), fill=CINNABAR)
        ImageDraw.Draw(overlay).text((marker_x + 4, marker_y - 8), "a", fill=INK, font=font(F_MONO, 11))

    # bottom colophon
    f_col = font(F_MONO, 11)
    d.text((fx0 + 30, fy1 - 40), "OBSERVED & RECORDED · INK ON SILK · ITEM 仙-002",
           fill=INK_SOFT, font=f_col)
    d.text((fx1 - 200, fy1 - 40), "PL. II", fill=INK_SOFT, font=f_col)

    # cinnabar seal at bottom right corner
    seal = cinnabar_seal("观人", size=110, seed=22)
    overlay.paste(seal, (fx1 - 160, fy1 - 200), seal)

    out = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    out.save(os.path.join(ASSETS, "characters.png"))
    return out


# ============================================================
# COMPOSITION 3 — three scene plates
# ============================================================

SCENE_DEFS = [
    {
        "key": "village",
        "title_cjk": "桃源村",
        "title_en":  "VALLEY · OF · PEACH BLOSSOMS",
        "subtitle":  "the first plate · a dwelling of the meek",
        "plate_no":  "III",
        "palette":   PAPER,        # warm
        "ink_palette": INK_SOFT,
        "draw":      "village",
    },
    {
        "key": "forest",
        "title_cjk": "迷雾林",
        "title_en":  "FOREST · OF · SLEEPING MIST",
        "subtitle":  "the second plate · where the wandering watch",
        "plate_no":  "IV",
        "palette":   PAPER,
        "ink_palette": INK_SOFT,
        "draw":      "forest",
    },
    {
        "key": "cave",
        "title_cjk": "幽暗窟",
        "title_en":  "CAVERN · OF · THE SEALED THING",
        "subtitle":  "the third plate · the dark below the dark",
        "plate_no":  "V",
        "palette":   PAPER_DARK,   # darker silk for cave
        "ink_palette": INK,
        "draw":      "cave",
    },
]


def draw_village_scene(layer, x0, y0, w, h):
    """Soft mountain valley with two pavilions."""
    d = ImageDraw.Draw(layer)
    # gentle horizon line
    horizon_y = y0 + int(h * 0.55)

    # distant mountains
    mt = ink_mountains(w, h, top_y=h * 0.18, palette_dark=INK_SOFT, seed=42)
    layer.paste(mt, (x0, y0), mt)
    # cloud band
    cb = cloud(int(w * 0.7), 50, color=(*INK_MIST, 70), seed=14)
    layer.paste(cb, (x0 + int(w * 0.12), y0 + int(h * 0.30)), cb)

    # ground line
    d.line((x0 + 20, horizon_y, x0 + w - 20, horizon_y), fill=(*INK, 100), width=1)

    # two pavilions — Han / Tang style with sweeping curved eaves
    def pavilion(cx, cy, sz, pal):
        # base platform
        d.rectangle((cx - sz * 1.0, cy + sz * 1.05,
                     cx + sz * 1.0, cy + sz * 1.20),
                    fill=(*INK_SOFT, 220))
        # body
        d.rectangle((cx - sz * 0.65, cy + 2,
                     cx + sz * 0.65, cy + sz * 1.05),
                    fill=(*pal, 200), outline=(*INK, 230), width=1)
        # vertical column lines
        for col_x in [cx - sz * 0.65, cx, cx + sz * 0.65]:
            d.line((col_x, cy + 2, col_x, cy + sz * 1.05),
                   fill=(*INK, 200), width=1)
        # door
        d.rectangle((cx - sz * 0.18, cy + sz * 0.40,
                     cx + sz * 0.18, cy + sz * 1.04),
                    fill=(*INK, 220))
        d.line((cx, cy + sz * 0.40, cx, cy + sz * 1.04),
               fill=(*PAPER, 120), width=1)

        # roof — curving eaves with characteristic upturn at the corners
        # Build as a path with a bezier on each end
        n = 30
        eave_pts = []
        for i in range(n + 1):
            t = i / n
            # x goes from -1.4 to +1.4
            xt = (-1.4 + 2.8 * t) * sz
            # roof curve: shallow dish, with upturned corners
            yt = -sz * 0.20 - sz * 0.55 * (1 - 4 * (t - 0.5) ** 2)  # peaks in middle
            # add corner upturn
            corner = 0
            if t < 0.12:
                corner = -sz * 0.20 * (1 - t / 0.12) ** 2
            elif t > 0.88:
                corner = -sz * 0.20 * ((t - 0.88) / 0.12) ** 2
            eave_pts.append((cx + xt, cy + yt + corner))
        # close polygon along the underside of the roof
        eave_full = eave_pts + [(cx + sz * 1.4, cy), (cx - sz * 1.4, cy)]
        d.polygon(eave_full, fill=(*INK, 235))
        # roof ridge highlight
        d.line(eave_pts, fill=(*INK, 255), width=2)
        # tiny finial
        d.ellipse((cx - 3, cy - sz * 0.85,
                   cx + 3, cy - sz * 0.85 + 6),
                  fill=(*CINNABAR, 230))

    pavilion(x0 + int(w * 0.30), horizon_y - 10, 65, (180, 138, 102))
    pavilion(x0 + int(w * 0.68), horizon_y -  4, 56, (160, 122, 90))

    # trees — proper ink-trunk and brushed canopy
    def tree(cx, cy, h0):
        # trunk: variable thickness
        for k in range(int(h0)):
            t = k / max(1, h0)
            tw_ = 2 + (1 - t) * 1.5
            d.ellipse((cx - tw_ / 2, cy - k - 1, cx + tw_ / 2, cy - k + 1),
                      fill=(*INK, 240))
        # canopy — multiple soft ellipses for layered foliage
        canopy_layer = Image.new("RGBA", (60, 50), (0, 0, 0, 0))
        cd = ImageDraw.Draw(canopy_layer)
        cd.ellipse((4, 4, 56, 46), fill=(*INK_SOFT, 200))
        cd.ellipse((10, 12, 40, 36), fill=(*INK, 160))
        canopy_layer = canopy_layer.filter(ImageFilter.GaussianBlur(1.0))
        layer.paste(canopy_layer, (int(cx - 30), int(cy - h0 - 30)), canopy_layer)

    tree(x0 + int(w * 0.16), horizon_y, 50)
    tree(x0 + int(w * 0.50), horizon_y, 38)
    tree(x0 + int(w * 0.84), horizon_y - 4, 56)

    # ground stippling — softer texture
    rnd = random.Random(7)
    stipple_layer = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(stipple_layer)
    for _ in range(110):
        x = rnd.randint(x0 + 20, x0 + w - 20)
        y = rnd.randint(horizon_y + 8, y0 + h - 30)
        r = rnd.choice([0.5, 0.8, 1, 1.2])
        sd.ellipse((x - r, y - r, x + r, y + r), fill=(*INK_SOFT, 180))
    layer.alpha_composite(stipple_layer)


def draw_forest_scene(layer, x0, y0, w, h):
    d = ImageDraw.Draw(layer)
    rnd = random.Random(11)
    horizon_y = y0 + int(h * 0.65)

    # distant misty mountains
    mt = ink_mountains(w, h, top_y=h * 0.12, palette_dark=INK_MIST, seed=88)
    layer.paste(mt, (x0, y0), mt)

    # heavy mist band across middle
    mist = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    md = ImageDraw.Draw(mist)
    md.rectangle((0, int(h * 0.40), w, int(h * 0.55)),
                 fill=(*PAPER_LIGHT, 80))
    mist = mist.filter(ImageFilter.GaussianBlur(40))
    layer.paste(mist, (x0, y0), mist)

    # forest of vertical trunks — variable density and height
    for i in range(28):
        x = x0 + 30 + rnd.randint(0, w - 60)
        height_t = rnd.randint(80, 220)
        thickness = rnd.choice([2, 2, 3, 4])
        depth = rnd.uniform(0.0, 1.0)  # 0 = far / pale, 1 = near / dark
        col = (
            int(INK[0] * (0.4 + 0.6 * depth)),
            int(INK[1] * (0.4 + 0.6 * depth)),
            int(INK[2] * (0.4 + 0.6 * depth)),
            int(180 * (0.4 + 0.6 * depth)),
        )
        ty = horizon_y - rnd.randint(-20, 30)
        d.line((x, ty - height_t, x, ty), fill=col, width=thickness)
        # canopy — quiet smudge
        canopy = Image.new("RGBA", (90, 60), (0, 0, 0, 0))
        cd = ImageDraw.Draw(canopy)
        cd.ellipse((0, 0, 90, 60), fill=(col[0], col[1], col[2], 100))
        canopy = canopy.filter(ImageFilter.GaussianBlur(8))
        layer.paste(canopy, (x - 45, ty - height_t - 30), canopy)

    # small water glimmer at lower portion
    for j in range(3):
        y = horizon_y + 60 + j * 10
        d.line((x0 + 60, y, x0 + w - 60, y), fill=(*INK_MIST, 80), width=1)


def draw_cave_scene(layer, x0, y0, w, h):
    """The cave is rendered as a rough rock contour eaten out of ink — the cave
    mouth is hand-walked, not a perfect ellipse. Inside: a sealed talisman."""
    rnd = random.Random(99)

    # ground layer: deep ink with subtle warp
    inside = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    id_ = ImageDraw.Draw(inside)
    # paint the inside of the cave with a warm-dark gradient (paper still bleeds through)
    inner_grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ig = ImageDraw.Draw(inner_grad)
    for yy in range(h):
        t = yy / h
        col_a = (60, 50, 42)
        col_b = (28, 22, 18)
        c = (
            int(col_a[0] * (1 - t) + col_b[0] * t),
            int(col_a[1] * (1 - t) + col_b[1] * t),
            int(col_a[2] * (1 - t) + col_b[2] * t),
            230,
        )
        ig.line((0, yy, w, yy), fill=c)

    # build a rough cave-mouth silhouette as a closed polygon
    cx = w * 0.5
    cy_top = h * 0.05
    cy_bot = h + 30
    # left wall going down with rough zig-zag
    left_pts, right_pts = [], []
    n = 26
    for i in range(n + 1):
        t = i / n
        # base radius oscillates organically
        base_r = w * 0.30 + math.sin(t * 2.6 + 0.3) * w * 0.04
        # add roughness — bigger at the top, smaller at the floor
        rough = (math.sin(t * 8.5) + math.sin(t * 17.2) * 0.4) * w * 0.04 * (1.1 - t * 0.4)
        local_r = base_r + rough + rnd.uniform(-w * 0.012, w * 0.012)
        y = cy_top + (cy_bot - cy_top) * t
        left_pts.append((cx - local_r, y))
        right_pts.append((cx + local_r * (0.95 + rnd.uniform(-0.05, 0.05)), y))
    # ceiling: a curved arc at the top
    ceiling = []
    for i in range(11):
        t = i / 10
        a = math.pi * (1 - t)
        rx = (right_pts[0][0] - left_pts[0][0]) / 2
        cyy = cy_top + 4
        ceiling.append((cx + math.cos(a) * rx, cyy + math.sin(a) * rx * 0.35 - rx * 0.2))

    cave_poly = ceiling + right_pts + list(reversed(left_pts))

    # paste inner gradient masked by cave shape
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(cave_poly, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    layer.paste(inner_grad, (x0, y0), mask)

    # the surrounding rock — solid heavy ink, also mask-shaped
    surround = Image.new("RGBA", (w, h), (12, 9, 7, 250))
    inv_mask = ImageOps.invert(mask)
    layer.paste(surround, (x0, y0), inv_mask)

    # rocky inner contour: a few stipple/brushed dots ringing the cave wall
    contour = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(contour)
    for pt in cave_poly[::2]:
        # add small brush dots just inside the wall
        ang = math.atan2(pt[1] - h * 0.4, pt[0] - w * 0.5)
        for k in range(2):
            ox = pt[0] + math.cos(ang + math.pi) * (4 + rnd.uniform(0, 6))
            oy = pt[1] + math.sin(ang + math.pi) * (4 + rnd.uniform(0, 6))
            r = rnd.choice([0.7, 1.0, 1.4, 2.0])
            cd.ellipse((ox - r, oy - r, ox + r, oy + r), fill=(70, 55, 45, 200))
    layer.paste(contour, (x0, y0), contour)

    # stalactites — varied lengths, taper from the ceiling
    stal = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stal)
    for i in range(11):
        t = (i + 0.5) / 11
        # only place where the ceiling is over the cave
        sx = w * 0.26 + (w * 0.48) * t + rnd.uniform(-6, 6)
        sl = rnd.randint(18, 55)
        sw = rnd.uniform(3.5, 6.5)
        # taper polygon
        sd.polygon([
            (sx - sw, cy_top + 5),
            (sx + sw, cy_top + 5),
            (sx + sw * 0.4, cy_top + sl * 0.6),
            (sx, cy_top + sl),
            (sx - sw * 0.4, cy_top + sl * 0.6),
        ], fill=(*INK, 240))
    layer.paste(stal, (x0, y0), stal)

    # stalagmites rising from floor
    stag = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(stag)
    for i in range(7):
        sx = w * 0.30 + (w * 0.40) * (i / 6) + rnd.uniform(-6, 6)
        sh_ = rnd.randint(14, 36)
        sw = rnd.uniform(4, 7)
        gd.polygon([
            (sx - sw, h * 0.86),
            (sx + sw, h * 0.86),
            (sx + sw * 0.3, h * 0.86 - sh_ * 0.5),
            (sx, h * 0.86 - sh_),
            (sx - sw * 0.3, h * 0.86 - sh_ * 0.5),
        ], fill=(*INK, 220))
    layer.paste(stag, (x0, y0), stag)

    # scattered stones on floor
    rocks = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rocks)
    for _ in range(18):
        rx = rnd.randint(int(w * 0.25), int(w * 0.75))
        ry = rnd.randint(int(h * 0.65), int(h * 0.92))
        rr = rnd.randint(6, 22)
        rd.ellipse((rx - rr, ry - rr // 2, rx + rr, ry + rr // 2),
                   fill=(60, 45, 35, 220))
    layer.paste(rocks, (x0, y0), rocks)

    # the talisman — at the back of the cave, glowing softly
    t_w, t_h = 64, 96
    tx = w // 2 - t_w // 2
    ty = int(h * 0.34)
    glow = Image.new("RGBA", (t_w + 100, t_h + 100), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r, a in [(80, 18), (60, 35), (40, 55), (24, 80)]:
        gd.ellipse(((t_w + 100) // 2 - r, (t_h + 100) // 2 - r,
                    (t_w + 100) // 2 + r, (t_h + 100) // 2 + r),
                   fill=(*CINNABAR, a))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    layer.paste(glow, (x0 + tx - 50, y0 + ty - 50), glow)

    talisman = Image.new("RGBA", (t_w, t_h), (0, 0, 0, 0))
    td = ImageDraw.Draw(talisman)
    # talisman has a slight notch at the top — like a temple paper amulet
    td.polygon([
        (4, 6), (t_w // 2 - 6, 0), (t_w // 2 + 6, 0), (t_w - 4, 6),
        (t_w - 1, t_h - 1), (0, t_h - 1),
    ], fill=(*CINNABAR, 230), outline=(*CINNABAR_D, 255))
    f_t = font(CJK_FONT, 26)
    for ch, oy in [("封", 14), ("印", 50)]:
        bb = td.textbbox((0, 0), ch, font=f_t)
        tw_ = bb[2] - bb[0]
        td.text(((t_w - tw_) // 2 - bb[0], oy), ch, fill=PAPER_LIGHT, font=f_t)
    # faint vertical line down the talisman center (decorative)
    td.line((t_w // 2, 8, t_w // 2, t_h - 6), fill=(*PAPER_LIGHT, 60), width=1)
    layer.paste(talisman, (x0 + tx, y0 + ty), talisman)


def make_scene_plate(scene):
    W, H = 1200, 1600
    img = make_silk(W, H, base=scene["palette"], seed=hash(scene["key"]) % 100)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    fx0, fy0, fx1, fy1 = 80, 70, W - 80, H - 70

    # heading block (top quarter)
    head_box_y0 = fy0 + 30
    head_box_y1 = fy0 + 220
    f_h = font(F_DISPLAY, 56)
    f_sub_i = font(F_BODY_I, 26)
    f_mono = font(F_MONO, 13)

    d.text((fx0 + 40, head_box_y0), scene["subtitle"], fill=INK_SOFT, font=f_sub_i)
    d.text((fx0 + 40, head_box_y0 + 38), scene["title_en"], fill=INK, font=f_h)
    d.text((fx0 + 40, head_box_y0 + 130), f"PLATE · {scene['plate_no']}", fill=INK_SOFT, font=f_mono)

    # vertical CJK title on the right
    f_cjk_t = font(CJK_FONT, 56)
    vertical_text(overlay, scene["title_cjk"], fx1 - 70, fy0 + 60, f_cjk_t, fill=INK)

    # divider with cinnabar dot
    d.line((fx0 + 40, head_box_y1, fx1 - 200, head_box_y1), fill=INK, width=1)
    d.ellipse((fx0 + 40, head_box_y1 - 4, fx0 + 48, head_box_y1 + 4), fill=CINNABAR)

    # main scene area
    scene_x0 = fx0 + 40
    scene_y0 = head_box_y1 + 60
    scene_w = fx1 - fx0 - 80
    scene_h = 880
    # scene frame
    d.rectangle((scene_x0, scene_y0, scene_x0 + scene_w, scene_y0 + scene_h),
                outline=(*INK, 90), width=1)

    if scene["draw"] == "village":
        draw_village_scene(overlay, scene_x0, scene_y0, scene_w, scene_h)
    elif scene["draw"] == "forest":
        draw_forest_scene(overlay, scene_x0, scene_y0, scene_w, scene_h)
    elif scene["draw"] == "cave":
        draw_cave_scene(overlay, scene_x0, scene_y0, scene_w, scene_h)

    # taxonomic markers along edges
    tx = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if scene["draw"] == "village":
        draw_taxonomic_marker(tx, scene_x0, scene_y0 + 110, "MOUNTAINS · DISTANT", "α", "left")
        draw_taxonomic_marker(tx, scene_x0, scene_y0 + 480, "DWELLINGS · ROOFED", "β", "left")
        draw_taxonomic_marker(tx, scene_x0 + scene_w, scene_y0 + 700, "PASTURE · OPEN", "γ", "right")
    elif scene["draw"] == "forest":
        draw_taxonomic_marker(tx, scene_x0, scene_y0 + 200, "MIST · BAND", "α", "left")
        draw_taxonomic_marker(tx, scene_x0 + scene_w, scene_y0 + 350, "TRUNKS · DENSE", "β", "right")
        draw_taxonomic_marker(tx, scene_x0, scene_y0 + 700, "FLOOR · MOSS", "γ", "left")
    elif scene["draw"] == "cave":
        draw_taxonomic_marker(tx, scene_x0, scene_y0 + 180, "STALACTITES",      "α", "left")
        draw_taxonomic_marker(tx, scene_x0 + scene_w, scene_y0 + 380, "TALISMAN · CINNABAR", "β", "right")
        draw_taxonomic_marker(tx, scene_x0, scene_y0 + 720, "FLOOR · STONE",    "γ", "left")
    overlay = Image.alpha_composite(overlay, tx)

    # bottom annotation block
    f_body = font(F_BODY, 19)
    f_label = font(F_MONO, 12)
    annot_y = scene_y0 + scene_h + 50

    # one short italic line of recorded observation
    obs_lines = {
        "village": "the silence of midday lies heavy upon the rooftops; the old well does not speak.",
        "forest":  "between the trunks the watchers rest, and what was lost in the mist is found in the mist.",
        "cave":    "beyond the seal the breath of an older thing stirs slowly; the talisman has not failed.",
    }
    # render with small width wrap
    lines = wrap_text(d, obs_lines[scene["draw"]], f_body, fx1 - fx0 - 100)
    for i, ln in enumerate(lines):
        d.text((fx0 + 40, annot_y + i * 28), ln, fill=INK, font=font(F_BODY_I, 22))

    # bottom-left tiny ref line + cinnabar seal at bottom right
    seal_text = {"village": "桃源", "forest": "迷雾", "cave": "幽暗"}[scene["draw"]]
    seal = cinnabar_seal(seal_text, size=110, seed=hash(scene["key"]) % 99)
    overlay.paste(seal, (fx1 - 160, fy1 - 200), seal)

    f_col = font(F_MONO, 11)
    d.text((fx0 + 30, fy1 - 40),
           f"FIELD NOTE · ITEM 仙-{ord(scene['plate_no'][-1]):03d}  ·  RECORDED IN INK",
           fill=INK_SOFT, font=f_col)
    d.text((fx1 - 200, fy1 - 40), f"PL. {scene['plate_no']}", fill=INK_SOFT, font=f_col)

    # outer frame
    od = ImageDraw.Draw(overlay)
    od.rectangle((fx0, fy0, fx1, fy1), outline=(*INK, 220), width=1)
    od.rectangle((fx0 + 10, fy0 + 10, fx1 - 10, fy1 - 10), outline=(*INK, 60), width=1)

    out = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    out.save(os.path.join(ASSETS, f"scene-{scene['key']}.png"))
    return out


def wrap_text(d, text, f, max_w):
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textbbox((0, 0), test, font=f)[2] > max_w and cur:
            lines.append(cur)
            cur = w
        else:
            cur = test
    if cur: lines.append(cur)
    return lines


# ============================================================
# COMPOSITION 4 — App icon (1024x1024)
# ============================================================

def make_app_icon():
    """One iconic gesture: a large cinnabar seal alone on silk. Reads at any
    size from a launcher icon up to a wall print. Clutter is the enemy here."""
    S = 1024
    img = make_silk(S, S, seed=99)
    overlay = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # central giant cinnabar seal — "仙" — sized to feel inevitable, not crowded
    seal_size = 620
    seal = cinnabar_seal("仙", size=seal_size, seed=18)
    sw, sh = seal.size
    overlay.paste(seal, ((S - sw) // 2, (S - sh) // 2), seal)

    out = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    out.save(os.path.join(ASSETS, "app-icon.png"))
    return out


# ============================================================
# COMPOSITION 5 — battle background (1920×1080)
# ============================================================

def make_battle_bg():
    """A wide misty-mountain stage. Designed so character sprites can stand
    on the lower third without competing with the imagery."""
    W, H = 1920, 1080
    img = make_silk(W, H, seed=7)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # gentle frame
    fx0, fy0, fx1, fy1 = 60, 50, W - 60, H - 50
    d.rectangle((fx0, fy0, fx1, fy1), outline=(*INK, 220), width=1)
    d.rectangle((fx0 + 12, fy0 + 12, fx1 - 12, fy1 - 12), outline=(*INK, 60), width=1)

    # pale gold sun behind the mist — early-morning Han silk feel
    sun = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sun)
    sun_cx, sun_cy = int(W * 0.68), int(H * 0.20)
    for r, a in [(220, 30), (160, 50), (110, 70), (60, 100)]:
        sd.ellipse((sun_cx - r, sun_cy - r, sun_cx + r, sun_cy + r),
                   fill=(*GOLD_OLD, a))
    sun = sun.filter(ImageFilter.GaussianBlur(30))
    overlay = Image.alpha_composite(overlay, sun)

    # mountain layers — far to near, light to dark
    layers = [
        (H * 0.22, (*INK_MIST, 55),  3, 100, 70, 2.0),
        (H * 0.34, (*INK_MIST, 90),  4, 130, 50, 1.4),
        (H * 0.46, (*INK_SOFT, 130), 5, 170, 40, 0.8),
        (H * 0.58, (*INK,      180), 5, 210, 32, 0.5),
    ]
    seed = 2025
    for top, col, n, ph, j, blur in layers:
        ml = mountain_layer(W, H, color=col, base_y=top,
                            peaks=n, peak_height=ph, jitter=j, seed=seed)
        ml = ml.filter(ImageFilter.GaussianBlur(blur))
        overlay = Image.alpha_composite(overlay, ml)
        seed += 17

    # cloud ribbons — three at slightly different y to give depth
    for i, (cw, ch, y_ratio, alpha) in enumerate([
        (1300, 70, 0.22, 75),
        (1000, 55, 0.31, 65),
        (1400, 80, 0.44, 55),
    ]):
        cb = cloud(cw, ch, color=(*INK_MIST, alpha), seed=i * 9)
        overlay.paste(cb, (W // 2 - cw // 2 + (-60 + i * 40), int(H * y_ratio)), cb)

    # mist gradient over the base of the mountains, fading to silk at the
    # bottom — gives the figures a clean stage to stand on
    mist = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md = ImageDraw.Draw(mist)
    for yy in range(int(H * 0.55), H):
        t = (yy - H * 0.55) / (H - H * 0.55)
        a = int(220 * t)
        md.line((0, yy, W, yy), fill=(*PAPER, a))
    mist = mist.filter(ImageFilter.GaussianBlur(8))
    overlay = Image.alpha_composite(overlay, mist)

    # foreground stones — quiet horizon stage for fighters
    fd = ImageDraw.Draw(overlay)
    rnd = random.Random(8)
    for _ in range(14):
        sx = rnd.randint(120, W - 120)
        sy = H - 110 + rnd.randint(-12, 18)
        sw = rnd.randint(40, 130)
        fd.ellipse((sx - sw, sy - 8, sx + sw, sy + 14), fill=(*INK_SOFT, 180))
    # main stage line
    fd.line((140, H - 96, W - 140, H - 96), fill=(*INK, 100), width=1)

    # title block — anchored top-left, well inside the frame
    sd2 = ImageDraw.Draw(overlay)
    sd2.text((fx0 + 80, fy0 + 60), "PLATE · VI", fill=INK_SOFT, font=font(F_MONO, 14))
    sd2.text((fx0 + 80, fy0 + 88), "Stage of Combat", fill=INK, font=font(F_DISPLAY, 56))
    sd2.text((fx0 + 80, fy0 + 158), "the sixth plate · the breath before the strike",
             fill=INK_SOFT, font=font(F_BODY_I, 22))

    # vertical CJK title — placed inside the right margin, with paper backing
    # so it reads cleanly against the mountains
    cjk_panel_w = 90
    cjk_panel_x = fx1 - 130
    panel = Image.new("RGBA", (cjk_panel_w, 280), (*PAPER_LIGHT, 200))
    overlay.paste(panel, (cjk_panel_x, fy0 + 80), panel)
    f_cjk_t = font(CJK_FONT, 60)
    vertical_text(overlay, "临阵图", cjk_panel_x + cjk_panel_w // 2, fy0 + 100,
                  f_cjk_t, fill=INK)

    # taxonomic markers — placed on emptier areas
    tx = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_taxonomic_marker(tx, int(W * 0.30), int(H * 0.30), "MIST · DRIFT",     "i",   "right")
    draw_taxonomic_marker(tx, int(W * 0.55), int(H * 0.55), "RIDGE · IRON",     "ii",  "left")
    draw_taxonomic_marker(tx, int(W * 0.18), int(H * 0.78), "STAGE · OF BOUT",  "iii", "right")
    overlay = Image.alpha_composite(overlay, tx)

    # cinnabar seal — bottom right
    seal = cinnabar_seal("临阵", size=110, seed=44)
    overlay.paste(seal, (fx1 - 170, fy1 - 180), seal)

    # colophon
    sd2.text((fx0 + 30, fy1 - 30),
             "THE STAGE BEFORE THE BLOW · INK ON SILK · ITEM 仙-006",
             fill=INK_SOFT, font=font(F_MONO, 11))

    out = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    out.save(os.path.join(ASSETS, "battle-bg.png"))
    return out


# ============================================================
# OUTPUT — PNGs and bundled PDF
# ============================================================

def make_pdf(images, path):
    if not images: return
    images[0].save(path, save_all=True, append_images=images[1:],
                   resolution=200.0, quality=92)


if __name__ == "__main__":
    print("[1/5] logo …")
    p1 = make_logo()
    print("[2/5] characters …")
    p2 = make_characters()
    print("[3/5] scenes …")
    scenes = [make_scene_plate(s) for s in SCENE_DEFS]
    print("[4/5] app icon …")
    p4 = make_app_icon()
    print("[5/5] battle bg …")
    p5 = make_battle_bg()

    pdf_pages = [p1, p2, *scenes, p4, p5]
    make_pdf(pdf_pages, os.path.join(ROOT, "art-bible.pdf"))

    print("DONE")
    print("Outputs:")
    for f in sorted(os.listdir(ASSETS)):
        sz = os.path.getsize(os.path.join(ASSETS, f))
        print(f"  assets/{f}  ({sz//1024} KB)")
    pdf_path = os.path.join(ROOT, "art-bible.pdf")
    print(f"  art-bible.pdf  ({os.path.getsize(pdf_path)//1024} KB)")
