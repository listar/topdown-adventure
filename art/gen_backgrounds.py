"""
批量生成 10 个场景的背景图
  - art/scenes/bg-{scene}.png      → parallax 背景 (384×640)
  - art/assets/scene-{scene}.png  → 过场卡图 (384×384)
"""

from PIL import Image, ImageDraw, ImageFilter
import math, os, random

W, H = 384, 640   # parallax 尺寸
CW, CH = 384, 384  # 过场卡尺寸

os.makedirs("scenes",  exist_ok=True)
os.makedirs("assets",  exist_ok=True)

rng = random.Random(42)   # 固定种子, 保证每次相同

# ─── 通用工具 ──────────────────────────────────────────────────────────────

def lerp_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def v_gradient(img, colors, stops=None):
    """纵向渐变，colors = [(r,g,b), ...]，stops 可省略（均分）"""
    d = ImageDraw.Draw(img)
    w, h = img.size
    n = len(colors) - 1
    stops = stops or [i / n for i in range(len(colors))]
    for y in range(h):
        t = y / (h - 1)
        seg = 0
        for i in range(n):
            if t <= stops[i + 1]:
                seg = i
                break
            seg = n - 1
        lt = (t - stops[seg]) / max(1e-6, stops[seg + 1] - stops[seg])
        lt = max(0.0, min(1.0, lt))
        c = lerp_color(colors[seg], colors[seg + 1], lt)
        d.line([(0, y), (w, y)], fill=c)

def add_noise(img, amount=8, seed=0):
    r = random.Random(seed)
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            n = r.randint(-amount, amount)
            c = px[x, y]
            px[x, y] = tuple(max(0, min(255, v + n)) for v in c)

def stars(draw, n, w, h, seed=1, size=1, alpha_range=(160, 255)):
    r = random.Random(seed)
    for _ in range(n):
        x = r.randint(0, w - 1)
        y = r.randint(0, h - 1)
        a = r.randint(*alpha_range)
        c = (255, 255, 220, a)
        draw.ellipse([x - size, y - size, x + size, y + size], fill=c)

def mountain_silhouette(draw, w, h, n_peaks, y_base, peak_h, color, seed=0):
    r = random.Random(seed)
    xs = sorted([r.randint(0, w) for _ in range(n_peaks)])
    ys = [y_base - r.randint(int(peak_h * 0.5), peak_h) for _ in xs]
    pts = [(0, h), (0, ys[0])]
    for i in range(len(xs)):
        pts.append((xs[i], ys[i]))
    pts += [(w, ys[-1]), (w, h)]
    draw.polygon(pts, fill=color)

def tree_silhouette(draw, x, y, h, w_ratio=0.55, color=(20, 40, 20)):
    hw = int(h * w_ratio / 2)
    trunk_w = max(2, hw // 4)
    draw.rectangle([x - trunk_w, y, x + trunk_w, y + int(h * 0.35)], fill=color)
    draw.ellipse([x - hw, y - int(h * 0.65), x + hw, y + 2], fill=color)

def fog_band(img, y, thickness, color, alpha=80):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for i in range(thickness):
        a_row = int(alpha * math.sin(math.pi * i / thickness))
        d.line([(0, y + i), (img.width, y + i)], fill=(*color, a_row))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def glow_circle(img, cx, cy, r, color, strength=120):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    steps = 12
    for i in range(steps, 0, -1):
        ri = r * i // steps
        a = int(strength * (1 - i / steps) ** 0.5)
        d.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], fill=(*color, a))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def cloud(draw, cx, cy, w, h, color=(240, 240, 255, 160)):
    for dx, dy, r in [(-w//3, 0, h//2), (0, -h//4, h//2), (w//3, 0, h//2), (0, h//4, h//3)]:
        draw.ellipse([cx + dx - r, cy + dy - r, cx + dx + r, cy + dy + r], fill=color)

def save_card(bg_img, path, title=""):
    card = bg_img.resize((CW, CH), Image.LANCZOS)
    d = ImageDraw.Draw(card)
    # 暗角
    for i in range(50):
        a = int(160 * (i / 50) ** 2)
        d.rectangle([i, i, CW - i, CH - i], outline=(0, 0, 0, a))
    return card.save(path)


# ═══════════════════════════════════════════════════════════════════════════════
#  1. 桃源村 (village) — 暖日黄昏, 远山, 云朵
# ═══════════════════════════════════════════════════════════════════════════════
def gen_village():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(255,200,120), (255,160,80), (200,100,60), (120,60,30), (60,30,15)],
               stops=[0, 0.25, 0.5, 0.75, 1.0])
    d = ImageDraw.Draw(img.convert("RGBA"))
    # 太阳
    img = glow_circle(img, W // 2, 160, 50, (255,220,100), strength=160)
    d = ImageDraw.Draw(img.convert("RGBA"))
    # 远山
    overlay = img.convert("RGBA")
    od = ImageDraw.Draw(overlay)
    mountain_silhouette(od, W, H, 8, 360, 120, (80, 50, 30, 200), seed=10)
    mountain_silhouette(od, W, H, 6, 420, 80,  (60, 35, 20, 220), seed=11)
    img = Image.alpha_composite(overlay, overlay).convert("RGB")
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 8, 360, 120, (80,50,30), seed=10)).convert("RGB")
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 6, 420, 80, (60,35,20), seed=11)).convert("RGB")
    # 云
    ci = Image.new("RGBA", (W, H), (0,0,0,0))
    cd = ImageDraw.Draw(ci)
    cloud(cd,  80, 80, 100, 30, (255,220,180,140))
    cloud(cd, 280, 60, 120, 32, (255,200,160,120))
    cloud(cd, 180, 110, 90, 26, (255,230,190,100))
    img = Image.alpha_composite(img.convert("RGBA"), ci).convert("RGB")
    add_noise(img, 6, seed=1)
    img.save("scenes/bg-village.png")
    save_card(img, "assets/scene-village.png")
    print("✓ village")

def _draw_mountains(w, h, n, yb, ph, color, seed=0):
    overlay = Image.new("RGBA", (w, h), (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    mountain_silhouette(d, w, h, n, yb, ph, (*color, 200), seed=seed)
    return overlay


# ═══════════════════════════════════════════════════════════════════════════════
#  2. 迷雾森林 (forest) — 深绿, 多层树影, 青白雾气
# ═══════════════════════════════════════════════════════════════════════════════
def gen_forest():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(40,60,30), (20,40,20), (10,25,15), (5,15,8), (0,8,4)],
               stops=[0, 0.3, 0.55, 0.8, 1.0])
    # 天空透一点光
    sky = Image.new("RGBA", (W, H), (0,0,0,0))
    sd = ImageDraw.Draw(sky)
    sd.rectangle([0,0,W,80], fill=(60,80,50,100))
    img = Image.alpha_composite(img.convert("RGBA"), sky).convert("RGB")
    # 三层树影
    for layer, (yb, ph, col, seed) in enumerate([
        (H, 220, (15,40,15), 20),
        (H, 160, (10,30,10), 21),
        (H, 100, (5,20,5),   22),
    ]):
        lo = _draw_mountains(W, H, 10+layer*2, yb, ph, col, seed=seed)
        img = Image.alpha_composite(img.convert("RGBA"), lo).convert("RGB")
    # 独立树
    d_over = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(d_over)
    for x, y, h in [(30,400,160),(100,380,180),(200,360,200),(300,370,190),(350,400,150)]:
        _tree_on_draw(d, x, y, h, (8,22,8))
    img = Image.alpha_composite(img.convert("RGBA"), d_over).convert("RGB")
    # 雾带
    img = fog_band(img, 450, 80, (180,220,200), alpha=100)
    img = fog_band(img, 550, 60, (180,220,200), alpha=80)
    add_noise(img, 6, seed=2)
    img.save("scenes/bg-forest.png")
    save_card(img, "assets/scene-forest.png")
    print("✓ forest")

def _tree_on_draw(d, x, y, h, color):
    hw = int(h * 0.28)
    trunk_w = max(2, hw // 3)
    d.rectangle([x-trunk_w, y, x+trunk_w, y+int(h*0.3)], fill=(*color, 220))
    d.ellipse([x-hw, y-int(h*0.7), x+hw, y+4], fill=(*color, 220))


# ═══════════════════════════════════════════════════════════════════════════════
#  3. 幽暗洞穴 (cave) — 蓝紫黑, 钟乳石, 荧光晶体
# ═══════════════════════════════════════════════════════════════════════════════
def gen_cave():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(15,5,30), (10,3,22), (5,0,15), (20,5,35), (8,0,18)],
               stops=[0, 0.3, 0.6, 0.8, 1.0])
    d_over = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(d_over)
    # 钟乳石 (顶部)
    r2 = random.Random(30)
    for i in range(16):
        x = int(W * i / 15)
        stalh = r2.randint(20, 80)
        hw = r2.randint(6, 18)
        d.polygon([(x-hw, 0),(x+hw, 0),(x, stalh)], fill=(30,10,50,220))
    # 石笋 (底部)
    for i in range(12):
        x = int(W * i / 11)
        stalh = r2.randint(15, 60)
        hw = r2.randint(5, 14)
        d.polygon([(x-hw,H),(x+hw,H),(x,H-stalh)], fill=(25,8,40,220))
    img = Image.alpha_composite(img.convert("RGBA"), d_over).convert("RGB")
    # 荧光晶体发光点
    for cx, cy, col in [(80,300,(0,150,255)),(200,450,(100,0,200)),(320,350,(0,200,150)),
                         (150,200,(50,100,255)),(280,250,(0,180,220))]:
        img = glow_circle(img, cx, cy, 18, col, strength=100)
    # 水面反光
    water = Image.new("RGBA", (W, H), (0,0,0,0))
    wd = ImageDraw.Draw(water)
    wd.ellipse([60, 520, 320, 600], fill=(0, 80, 160, 60))
    img = Image.alpha_composite(img.convert("RGBA"), water).convert("RGB")
    add_noise(img, 5, seed=3)
    img.save("scenes/bg-cave.png")
    save_card(img, "assets/scene-cave.png")
    print("✓ cave")


# ═══════════════════════════════════════════════════════════════════════════════
#  4. 山顶观星台 (mountaintop) — 深夜, 繁星, 银月, 雪山剪影
# ═══════════════════════════════════════════════════════════════════════════════
def gen_mountaintop():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(5,5,20),(10,10,40),(15,15,60),(5,5,20),(0,0,10)],
               stops=[0, 0.4, 0.65, 0.85, 1.0])
    # 星空
    star_layer = Image.new("RGBA", (W, H), (0,0,0,0))
    stars(ImageDraw.Draw(star_layer), 300, W, int(H*0.65), seed=40, size=1)
    stars(ImageDraw.Draw(star_layer), 60,  W, int(H*0.65), seed=41, size=2, alpha_range=(180,255))
    img = Image.alpha_composite(img.convert("RGBA"), star_layer).convert("RGB")
    # 月亮
    img = glow_circle(img, 300, 80, 35, (220,220,180), strength=140)
    md = Image.new("RGBA", (W, H), (0,0,0,0))
    ImageDraw.Draw(md).ellipse([265,45,335,115], fill=(240,240,200,240))
    img = Image.alpha_composite(img.convert("RGBA"), md).convert("RGB")
    # 雪山
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 7, H, 300, (60,70,90), seed=50)).convert("RGB")
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 5, H, 220, (140,160,180), seed=51)).convert("RGB")
    # 雪顶白
    snow = _draw_mountains(W, H, 5, H-180, 60, (220,230,240), seed=51)
    img = Image.alpha_composite(img.convert("RGBA"), snow).convert("RGB")
    add_noise(img, 5, seed=4)
    img.save("scenes/bg-mountaintop.png")
    save_card(img, "assets/scene-mountaintop.png")
    print("✓ mountaintop")


# ═══════════════════════════════════════════════════════════════════════════════
#  5. 晨雾渡口 (docks) — 晨曦, 水面, 薄雾, 远帆
# ═══════════════════════════════════════════════════════════════════════════════
def gen_docks():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(255,230,180),(255,200,120),(180,200,220),(120,160,200),(60,100,160)],
               stops=[0, 0.2, 0.45, 0.65, 1.0])
    # 太阳升起
    img = glow_circle(img, W//2, 200, 40, (255,200,80), strength=180)
    sd = Image.new("RGBA", (W, H), (0,0,0,0))
    ImageDraw.Draw(sd).ellipse([W//2-22, 178, W//2+22, 222], fill=(255,240,150,230))
    img = Image.alpha_composite(img.convert("RGBA"), sd).convert("RGB")
    # 水面
    water = Image.new("RGBA", (W, H), (0,0,0,0))
    wd = ImageDraw.Draw(water)
    v_gradient_on(wd, W, H, 360, H, [(80,130,180,180),(40,80,140,220)])
    img = Image.alpha_composite(img.convert("RGBA"), water).convert("RGB")
    # 水面反光
    for yi in range(360, H, 6):
        t = (yi - 360) / (H - 360)
        a = int(60 * math.sin(math.pi * t))
        refl = Image.new("RGBA", (W, H), (0,0,0,0))
        ImageDraw.Draw(refl).line([(0,yi),(W,yi)], fill=(255,220,150,a))
        img = Image.alpha_composite(img.convert("RGBA"), refl).convert("RGB")
    # 薄雾
    img = fog_band(img, 330, 120, (200,220,240), alpha=90)
    # 远处帆船剪影
    sail = Image.new("RGBA", (W, H), (0,0,0,0))
    sd2 = ImageDraw.Draw(sail)
    _sailboat(sd2, 80, 340, 50, (40,50,60,180))
    _sailboat(sd2, 300, 355, 35, (40,50,60,140))
    img = Image.alpha_composite(img.convert("RGBA"), sail).convert("RGB")
    add_noise(img, 5, seed=5)
    img.save("scenes/bg-docks.png")
    save_card(img, "assets/scene-docks.png")
    print("✓ docks")

def v_gradient_on(d, w, h, y0, y1, colors):
    n = len(colors) - 1
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0 - 1)
        seg = min(int(t * n), n - 1)
        lt = t * n - seg
        c = tuple(int(a + (b-a)*lt) for a,b in zip(colors[seg], colors[seg+1]))
        d.line([(0,y),(w,y)], fill=c)

def _sailboat(d, cx, wy, size, color):
    d.polygon([(cx,wy-size),(cx-size//3,wy),(cx+size//3,wy)], fill=color)
    d.line([(cx,wy),(cx,wy+size//3)], fill=color, width=2)
    d.line([(cx-size//3,wy),(cx+size//3,wy)], fill=color, width=2)


# ═══════════════════════════════════════════════════════════════════════════════
#  6. 古战场 (battlefield) — 暗红天空, 烟尘, 废墟剪影
# ═══════════════════════════════════════════════════════════════════════════════
def gen_battlefield():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(60,10,5),(120,30,10),(80,20,5),(40,10,3),(15,5,2)],
               stops=[0, 0.25, 0.5, 0.75, 1.0])
    # 血月
    img = glow_circle(img, 280, 100, 40, (180,40,20), strength=150)
    moon_l = Image.new("RGBA", (W, H), (0,0,0,0))
    ImageDraw.Draw(moon_l).ellipse([258,78,302,122], fill=(200,80,40,220))
    img = Image.alpha_composite(img.convert("RGBA"), moon_l).convert("RGB")
    # 废墟/荒地剪影
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 6, H, 120, (20,8,5), seed=60)).convert("RGB")
    # 残垣断壁
    ruins = Image.new("RGBA", (W, H), (0,0,0,0))
    rd = ImageDraw.Draw(ruins)
    _ruin_wall(rd, 40,  460, 60, 120, (15,5,3,240))
    _ruin_wall(rd, 160, 490, 40,  90, (15,5,3,240))
    _ruin_wall(rd, 260, 470, 50, 110, (15,5,3,240))
    _ruin_wall(rd, 340, 480, 35,  80, (15,5,3,240))
    img = Image.alpha_composite(img.convert("RGBA"), ruins).convert("RGB")
    # 烟尘
    img = fog_band(img, 380, 140, (80,40,30), alpha=90)
    img = fog_band(img, 520, 80, (60,30,20), alpha=70)
    add_noise(img, 8, seed=6)
    img.save("scenes/bg-battlefield.png")
    save_card(img, "assets/scene-battlefield.png")
    print("✓ battlefield")

def _ruin_wall(d, x, y, w, h, color):
    d.rectangle([x, y-h, x+w, y], fill=color)
    # 断裂锯齿
    r2 = random.Random(x)
    for i in range(0, w, 8):
        ch = r2.randint(0, h//3)
        d.rectangle([x+i, y-h, x+i+8, y-h+ch], fill=(0,0,0,0))


# ═══════════════════════════════════════════════════════════════════════════════
#  7. 秘密花园 (secretGarden) — 翠绿仙境, 柔光, 花瓣
# ═══════════════════════════════════════════════════════════════════════════════
def gen_secret_garden():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(180,230,150),(120,190,100),(60,140,60),(30,90,40),(10,50,20)],
               stops=[0, 0.2, 0.5, 0.75, 1.0])
    # 光晕
    img = glow_circle(img, W//2, 80, 100, (220,255,180), strength=120)
    # 树影层
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 8, H, 200, (20,70,20), seed=70)).convert("RGB")
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 6, H, 130, (10,50,10), seed=71)).convert("RGB")
    # 独立树
    trees = Image.new("RGBA", (W, H), (0,0,0,0))
    td = ImageDraw.Draw(trees)
    for x, y_base, h, col in [(20,500,220,(15,60,15)),(360,490,200,(15,60,15)),
                                (160,480,180,(20,70,20)),(280,500,160,(10,50,10))]:
        _tree_on_draw(td, x, y_base, h, col)
    img = Image.alpha_composite(img.convert("RGBA"), trees).convert("RGB")
    # 花瓣粒子
    petals = Image.new("RGBA", (W, H), (0,0,0,0))
    pd = ImageDraw.Draw(petals)
    r2 = random.Random(70)
    for _ in range(80):
        px = r2.randint(0, W)
        py = r2.randint(100, H - 100)
        cr = r2.randint(2, 5)
        col = r2.choice([(255,180,200),(255,220,180),(255,255,150),(200,255,180)])
        pd.ellipse([px-cr, py-cr, px+cr, py+cr], fill=(*col, r2.randint(120,200)))
    img = Image.alpha_composite(img.convert("RGBA"), petals).convert("RGB")
    # 薄雾
    img = fog_band(img, 420, 80, (180,230,180), alpha=80)
    add_noise(img, 5, seed=7)
    img.save("scenes/bg-garden.png")
    save_card(img, "assets/scene-garden.png")
    print("✓ secretGarden")


# ═══════════════════════════════════════════════════════════════════════════════
#  8. 沙漠绿洲 (oasis) — 炙热天空, 沙丘, 绿洲点缀
# ═══════════════════════════════════════════════════════════════════════════════
def gen_oasis():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(255,230,120),(255,180,60),(220,130,30),(180,100,20),(120,70,10)],
               stops=[0, 0.2, 0.45, 0.7, 1.0])
    # 太阳
    img = glow_circle(img, W//2, 80, 55, (255,230,100), strength=180)
    sl = Image.new("RGBA", (W, H), (0,0,0,0))
    ImageDraw.Draw(sl).ellipse([W//2-28, 52, W//2+28, 108], fill=(255,250,200,240))
    img = Image.alpha_composite(img.convert("RGBA"), sl).convert("RGB")
    # 沙丘
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 5, H, 160, (180,120,40), seed=80)).convert("RGB")
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 4, H, 100, (200,140,60), seed=81)).convert("RGB")
    # 绿洲水面
    oasis_l = Image.new("RGBA", (W, H), (0,0,0,0))
    od = ImageDraw.Draw(oasis_l)
    od.ellipse([120, 460, 260, 520], fill=(60,130,180,200))
    od.ellipse([130, 465, 250, 515], fill=(80,160,210,100))
    img = Image.alpha_composite(img.convert("RGBA"), oasis_l).convert("RGB")
    # 棕榈树剪影
    palms = Image.new("RGBA", (W, H), (0,0,0,0))
    pd = ImageDraw.Draw(palms)
    _palm(pd, 80,  440, 100, (20,50,10,220))
    _palm(pd, 310, 450,  85, (20,50,10,200))
    _palm(pd, 190, 430,  90, (20,60,10,210))
    img = Image.alpha_composite(img.convert("RGBA"), palms).convert("RGB")
    # 热浪雾
    img = fog_band(img, 380, 80, (220,160,60), alpha=40)
    add_noise(img, 7, seed=8)
    img.save("scenes/bg-oasis.png")
    save_card(img, "assets/scene-oasis.png")
    print("✓ oasis")

def _palm(d, cx, base, h, color):
    trunk_w = max(3, h // 20)
    d.line([(cx, base), (cx - h//10, base - h)], fill=color, width=trunk_w)
    # 叶子
    top_x = cx - h // 10
    top_y = base - h
    leaf_len = h // 3
    for angle_deg in range(-60, 61, 20):
        angle = math.radians(angle_deg - 90)
        ex = int(top_x + math.cos(angle) * leaf_len)
        ey = int(top_y + math.sin(angle) * leaf_len)
        d.line([(top_x, top_y), (ex, ey)], fill=color, width=max(2, trunk_w//2))


# ═══════════════════════════════════════════════════════════════════════════════
#  9. 废弃小镇 (abandonedTown) — 阴云, 废墟剪影, 压抑灰调
# ═══════════════════════════════════════════════════════════════════════════════
def gen_abandoned_town():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(80,80,90),(60,60,70),(40,40,50),(25,25,32),(10,10,15)],
               stops=[0, 0.3, 0.55, 0.75, 1.0])
    # 阴云
    clouds_l = Image.new("RGBA", (W, H), (0,0,0,0))
    cd = ImageDraw.Draw(clouds_l)
    r2 = random.Random(90)
    for _ in range(8):
        cx = r2.randint(0, W)
        cy = r2.randint(0, 200)
        cw = r2.randint(80, 180)
        ch = r2.randint(30, 60)
        cloud(cd, cx, cy, cw, ch, (50,50,60,100))
    img = Image.alpha_composite(img.convert("RGBA"), clouds_l).convert("RGB")
    # 废弃建筑剪影
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 4, H, 80, (20,20,25), seed=90)).convert("RGB")
    ruins = Image.new("RGBA", (W, H), (0,0,0,0))
    rd = ImageDraw.Draw(ruins)
    for rx, ry, rw, rh in [(20,350,50,180),(100,380,40,140),(180,340,70,200),
                             (280,360,45,160),(340,370,40,150)]:
        _ruin_wall(rd, rx, ry+rh, rw, rh, (15,15,18,240))
        # 窗洞
        _ruin_windows(rd, rx, ry, rw, rh)
    img = Image.alpha_composite(img.convert("RGBA"), ruins).convert("RGB")
    # 浓雾
    img = fog_band(img, 420, 120, (70,70,80), alpha=100)
    img = fog_band(img, 560, 80, (70,70,80), alpha=80)
    add_noise(img, 7, seed=9)
    img.save("scenes/bg-abandonedtown.png")
    save_card(img, "assets/scene-abandonedtown.png")
    print("✓ abandonedTown")

def _ruin_windows(d, rx, ry, rw, rh):
    r2 = random.Random(rx + ry)
    for _ in range(r2.randint(1, 3)):
        wx = rx + r2.randint(4, rw - 12)
        wy = ry + r2.randint(4, rh - 12)
        ws = r2.randint(6, 10)
        d.rectangle([wx, wy, wx+ws, wy+ws], fill=(0,0,0,0))


# ═══════════════════════════════════════════════════════════════════════════════
# 10. 深渊洞口 (abyss) — 地狱火焰, 深红, 熔岩裂缝
# ═══════════════════════════════════════════════════════════════════════════════
def gen_abyss():
    img = Image.new("RGB", (W, H))
    v_gradient(img, [(5,0,0),(20,3,0),(40,5,0),(80,10,5),(30,5,0)],
               stops=[0, 0.3, 0.55, 0.75, 1.0])
    # 熔岩光晕 (底部)
    img = glow_circle(img, W//2, H, 200, (200,50,0), strength=180)
    img = glow_circle(img, W//2, H, 120, (255,120,0), strength=150)
    # 岩石层
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 8, H, 250, (15,3,0), seed=100)).convert("RGB")
    img = Image.alpha_composite(img.convert("RGBA"),
          _draw_mountains(W, H, 6, H, 180, (8,2,0), seed=101)).convert("RGB")
    # 熔岩裂缝
    cracks = Image.new("RGBA", (W, H), (0,0,0,0))
    crd = ImageDraw.Draw(cracks)
    r2 = random.Random(100)
    for _ in range(6):
        x = r2.randint(20, W-20)
        y = r2.randint(H//2, H-50)
        _lava_crack(crd, x, y, r2)
    img = Image.alpha_composite(img.convert("RGBA"), cracks).convert("RGB")
    # 火焰粒子
    flames = Image.new("RGBA", (W, H), (0,0,0,0))
    fd = ImageDraw.Draw(flames)
    r2 = random.Random(101)
    for _ in range(40):
        fx = r2.randint(0, W)
        fy = r2.randint(H//2, H)
        fh = r2.randint(8, 25)
        fw = max(3, fh//3)
        col = r2.choice([(255,100,0),(255,60,0),(255,150,20)])
        fd.polygon([(fx,fy),(fx-fw,fy+fh),(fx+fw,fy+fh)], fill=(*col, r2.randint(80,160)))
    img = Image.alpha_composite(img.convert("RGBA"), flames).convert("RGB")
    # 钟乳石
    d_over = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(d_over)
    r2 = random.Random(102)
    for i in range(14):
        x = int(W * i / 13)
        sh = r2.randint(15, 70)
        hw = r2.randint(5, 15)
        d.polygon([(x-hw,0),(x+hw,0),(x,sh)], fill=(10,2,0,230))
    img = Image.alpha_composite(img.convert("RGBA"), d_over).convert("RGB")
    add_noise(img, 6, seed=10)
    img.save("scenes/bg-abyss.png")
    save_card(img, "assets/scene-abyss.png")
    print("✓ abyss")

def _lava_crack(d, x, y, r2):
    pts = [(x, y)]
    cx, cy = x, y
    for _ in range(r2.randint(3, 6)):
        cx += r2.randint(-20, 20)
        cy += r2.randint(5, 25)
        pts.append((cx, cy))
    for i in range(len(pts)-1):
        d.line([pts[i], pts[i+1]], fill=(255,80,0,180), width=r2.randint(1,3))
        # 光晕
        d.line([pts[i], pts[i+1]], fill=(255,160,0,60), width=r2.randint(3,7))


# ─── 运行 ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("生成中...")
    gen_village()
    gen_forest()
    gen_cave()
    gen_mountaintop()
    gen_docks()
    gen_battlefield()
    gen_secret_garden()
    gen_oasis()
    gen_abandoned_town()
    gen_abyss()
    print("\n全部完成! 共生成 20 张图片:")
    print("  scenes/bg-*.png       → parallax 背景图")
    print("  assets/scene-*.png   → 过场卡图")
