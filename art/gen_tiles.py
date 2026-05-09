#!/usr/bin/env python3
"""生成游戏地图瓦片集 + 额外道具精灵"""

from PIL import Image, ImageDraw
import random, math, os

TILE = 32
OUT = os.path.dirname(__file__) + '/tiles/'
os.makedirs(OUT, exist_ok=True)

R = random.Random(42)  # 固定种子，每次输出相同

# ─── 工具函数 ──────────────────────────────────────────────────────────────────

def px(img, x, y, col):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), col)

def noise_fill(img, base_rgba, strength=20, count=120):
    """在图片上叠加像素噪声"""
    for _ in range(count):
        x, y = R.randint(0, img.width-1), R.randint(0, img.height-1)
        v = R.randint(-strength, strength)
        r_, g_, b_, a = base_rgba
        img.putpixel((x, y), (
            max(0, min(255, r_+v)),
            max(0, min(255, g_+v//2)),
            max(0, min(255, b_+v//3)),
            a
        ))

# ─── 11 种瓦片 (各 32×32, 不透明) ─────────────────────────────────────────────

def tile_grass():
    img = Image.new('RGBA', (TILE, TILE), (78, 148, 58, 255))
    d = ImageDraw.Draw(img)
    noise_fill(img, (78, 148, 58, 255), 22, 140)
    # 草茎
    for _ in range(10):
        bx, by = R.randint(2, 29), R.randint(3, 25)
        d.line([(bx, by+5), (bx, by+1)], fill=(50, 108, 38, 255))
        px(img, bx-1, by, (105, 172, 72, 255))
    # 浅色高光点
    for _ in range(6):
        px(img, R.randint(0,31), R.randint(0,31), (95, 165, 70, 255))
    return img

def tile_path():
    img = Image.new('RGBA', (TILE, TILE), (188, 155, 85, 255))
    d = ImageDraw.Draw(img)
    noise_fill(img, (188, 155, 85, 255), 30, 160)
    # 小砾石
    for _ in range(7):
        gx, gy = R.randint(2, 28), R.randint(2, 28)
        gc = R.randint(140, 170)
        d.ellipse([gx-1, gy-1, gx+1, gy+1], fill=(gc, gc-8, gc-18, 255))
    # 踩踏纹路
    for i in range(3):
        y = 9 + i*8
        d.line([(1, y), (30, y)], fill=(152, 122, 62, 100))
    return img

def tile_water():
    img = Image.new('RGBA', (TILE, TILE), (38, 98, 178, 255))
    noise_fill(img, (38, 98, 178, 255), 15, 80)
    # 涟漪条纹
    for i in range(4):
        y0 = 6 + i*7
        for x in range(0, 32):
            off = int(math.sin(x * 0.35 + i * 1.2) * 1.5)
            yy = y0 + off
            px(img, x, yy, (92, 158, 232, 200))
    # 高光闪点
    for _ in range(5):
        sx, sy = R.randint(1, 30), R.randint(1, 30)
        px(img, sx, sy, (220, 242, 255, 255))
    return img

def tile_tree():
    # 深绿色地面 + 树冠俯视
    img = Image.new('RGBA', (TILE, TILE), (36, 88, 30, 255))
    noise_fill(img, (36, 88, 30, 255), 12, 80)
    d = ImageDraw.Draw(img)
    # 投影
    d.ellipse([5, 23, 27, 31], fill=(0, 0, 0, 55))
    # 树干 (细, 居中)
    d.rectangle([14, 19, 18, 27], fill=(90, 52, 20, 255))
    # 树冠 — 三层渐亮
    d.ellipse([2, 2, 29, 24], fill=(32, 76, 28, 255))
    d.ellipse([4, 0, 27, 22], fill=(55, 116, 42, 255))
    d.ellipse([7, 2, 23, 17], fill=(78, 142, 58, 255))
    # 高光
    d.ellipse([10, 4, 19, 12], fill=(100, 168, 76, 220))
    px(img, 13, 6, (130, 195, 95, 200))
    return img

def tile_rock():
    img = Image.new('RGBA', (TILE, TILE), (92, 88, 80, 255))
    noise_fill(img, (92, 88, 80, 255), 15, 100)
    d = ImageDraw.Draw(img)
    # 投影
    d.ellipse([6, 24, 27, 31], fill=(0, 0, 0, 50))
    # 石块主体
    d.ellipse([3, 7, 29, 27], fill=(108, 100, 92, 255))
    d.ellipse([5, 5, 27, 25], fill=(130, 122, 112, 255))
    # 表面噪声
    for _ in range(20):
        rx, ry = R.randint(7, 24), R.randint(7, 23)
        v = R.randint(-14, 14)
        c = max(0, min(255, 125+v))
        px(img, rx, ry, (c, c-6, c-15, 255))
    # 高光
    d.ellipse([8, 7, 18, 15], fill=(158, 148, 136, 255))
    d.ellipse([10, 9, 15, 13], fill=(180, 170, 156, 200))
    # 裂缝
    d.line([(17, 14), (21, 21)], fill=(82, 75, 68, 160))
    return img

def tile_wall():
    img = Image.new('RGBA', (TILE, TILE), (46, 40, 32, 255))
    d = ImageDraw.Draw(img)
    brick_cols = [(86, 76, 60, 255), (94, 84, 66, 255), (76, 68, 54, 255)]
    bw, bh = 14, 7
    for row in range(5):
        y = row * bh
        ox = 7 if row % 2 == 1 else 0
        for col in range(-1, 4):
            x = col * bw + ox
            x1, y1 = max(0, x+1), max(0, y+1)
            x2, y2 = min(TILE-1, x+bw-2), min(TILE-1, y+bh-2)
            if x2 > x1 and y2 > y1:
                fill = R.choice(brick_cols)
                d.rectangle([x1, y1, x2, y2], fill=fill)
                d.line([(x1, y1), (x2, y1)], fill=(108, 96, 78, 255))
    return img

def tile_sand():
    img = Image.new('RGBA', (TILE, TILE), (212, 186, 118, 255))
    noise_fill(img, (212, 186, 118, 255), 28, 120)
    # 沙纹
    for i in range(5):
        y0 = 4 + i*6
        for x in range(0, 32, 2):
            off = int(math.sin(x*0.25 + i*0.8) * 1.2)
            yy = y0 + off
            px(img, x, yy, (182, 158, 92, 180))
    return img

def tile_house():
    # 屋顶瓦片俯视
    img = Image.new('RGBA', (TILE, TILE), (155, 65, 45, 255))
    d = ImageDraw.Draw(img)
    # 瓦行横线
    for i in range(8):
        y = i*4
        d.line([(0, y), (31, y)], fill=(118, 48, 30, 200))
    # 瓦列竖线 (奇偶行偏移)
    for row in range(9):
        y = row*4
        ox = 4 if row % 2 == 0 else 0
        for col in range(-1, 5):
            x = col*8 + ox
            if 0 <= x < TILE:
                d.line([(x, y), (x, min(TILE-1, y+3))], fill=(108, 44, 27, 160))
    # 屋脊
    d.rectangle([0, 14, TILE, 17], fill=(108, 43, 30, 255))
    # 顶部光晕
    for y in range(14):
        a = int(36 * (1 - y/14))
        d.line([(0, y), (31, y)], fill=(255, 200, 180, a))
    # 瓦片下边阴影
    for i in range(8):
        d.line([(0, i*4+3), (31, i*4+3)], fill=(98, 40, 26, 150))
    return img

def tile_wood():
    img = Image.new('RGBA', (TILE, TILE), (148, 98, 50, 255))
    d = ImageDraw.Draw(img)
    plank_cols = [(145,95,48,255), (158,106,55,255), (138,90,44,255), (152,100,52,255)]
    for row in range(4):
        y = row*8
        d.rectangle([0, y, 31, y+7], fill=plank_cols[row])
        # 板间分隔
        d.line([(0, y), (31, y)], fill=(88, 56, 20, 255))
        # 木纹
        for g in range(3):
            gy = y+2+g*2
            d.line([(1, gy), (30, gy)], fill=(168, 112, 62, R.randint(55,120)))
        # 木节
        if row in [1, 3]:
            kx = R.randint(6, 24)
            ky = y+4
            d.ellipse([kx-2, ky-2, kx+2, ky+2], fill=(90, 54, 18, 220))
    return img

def tile_flower():
    img = tile_grass()
    d = ImageDraw.Draw(img)
    flowers = [
        (7, 9, (255, 72, 118)),
        (21, 7, (255, 218, 52)),
        (5, 22, (152, 88, 255)),
        (25, 20, (255, 112, 42)),
        (15, 17, (255, 52, 92)),
        (27, 13, (72, 198, 255)),
        (12, 5, (255, 178, 58)),
    ]
    for (fx, fy, col) in flowers:
        for angle in range(0, 360, 72):
            rad = math.radians(angle)
            ppx = fx + int(math.cos(rad)*2)
            ppy = fy + int(math.sin(rad)*2)
            px(img, ppx, ppy, col+(255,))
        px(img, fx, fy, (255, 240, 158, 255))
    return img

def tile_well():
    img = Image.new('RGBA', (TILE, TILE), (142, 132, 116, 255))
    noise_fill(img, (142, 132, 116, 255), 18, 80)
    d = ImageDraw.Draw(img)
    # 石环
    d.ellipse([1, 1, 30, 30], fill=(96, 86, 74, 255))
    d.ellipse([3, 3, 28, 28], fill=(115, 105, 90, 255))
    # 水面
    d.ellipse([8, 8, 23, 23], fill=(30, 86, 162, 255))
    d.ellipse([10, 10, 21, 21], fill=(42, 104, 186, 255))
    # 水面反光
    d.ellipse([12, 11, 18, 16], fill=(85, 148, 220, 200))
    d.ellipse([13, 12, 16, 14], fill=(165, 212, 255, 180))
    # 石环高光
    d.arc([3, 3, 28, 28], 205, 330, fill=(158, 146, 130, 255), width=2)
    return img

# ─── 组装 tileset (11列 × 32px = 352×32) ────────────────────────────────────

TILE_MAKERS = [
    tile_grass, tile_path, tile_water, tile_tree, tile_rock,
    tile_wall, tile_sand, tile_house, tile_wood, tile_flower, tile_well,
]
TILE_NAMES = ['grass','path','water','tree','rock','wall','sand','house','wood','flower','well']

tileset = Image.new('RGBA', (TILE * len(TILE_MAKERS), TILE), (0,0,0,0))
for i, fn in enumerate(TILE_MAKERS):
    R = random.Random(42 + i)   # 每种瓦片独立种子
    t = fn()
    tileset.paste(t, (i*TILE, 0))
    t.save(OUT + f'tile-{TILE_NAMES[i]}.png')   # 同时单独保存
    print(f'  tile-{TILE_NAMES[i]}.png  {t.size}')

tileset.save(OUT + 'tileset.png')
print(f'tileset.png  {tileset.size}  (11 tiles × 32)')

# ─── 额外道具精灵 ─────────────────────────────────────────────────────────────

def prop_campfire():
    """营火 (36×30)"""
    W, H = 36, 30
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    # 地面炭灰圆
    d.ellipse([6, 20, 29, 28], fill=(55, 48, 40, 200))
    # 柴火交叉
    d.line([(8, 26), (28, 18)], fill=(120, 70, 22, 255), width=3)
    d.line([(8, 18), (28, 26)], fill=(100, 58, 18, 255), width=3)
    # 火焰 — 橙红渐变 (从宽到尖)
    fire_layers = [
        ([11, 14, 25, 26], (240, 100, 20, 220)),
        ([12, 10, 23, 22], (250, 140, 30, 210)),
        ([14, 6, 21, 17], (255, 190, 50, 200)),
        ([15, 2, 20, 12], (255, 230, 80, 180)),
        ([16, 0, 19, 8],  (255, 248, 150, 160)),
    ]
    for rect, col in fire_layers:
        d.ellipse(rect, fill=col)
    # 火星
    for fx, fy in [(10, 4), (25, 6), (8, 10), (28, 12)]:
        d.point((fx, fy), (255, 200, 80, 200))
    return img

def prop_torch():
    """火把 (10×28)"""
    W, H = 10, 28
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    # 杆
    d.rectangle([3, 12, 6, 27], fill=(110, 65, 22, 255))
    # 布缠绕纹
    for i in range(4):
        y = 13 + i*4
        d.line([(3, y), (6, y)], fill=(85, 45, 12, 200))
    # 火焰
    d.ellipse([2, 6, 7, 14], fill=(240, 110, 25, 220))
    d.ellipse([3, 3, 7, 10], fill=(255, 175, 45, 210))
    d.ellipse([3, 1, 6, 7],  fill=(255, 230, 80, 190))
    # 光晕圆 (柔和黄)
    glow = Image.new('RGBA', (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([0, 2, 9, 14], fill=(255, 200, 60, 50))
    img = Image.alpha_composite(glow, img)
    return img

def prop_mushroom():
    """蘑菇群 (34×26)"""
    W, H = 34, 26
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    def mushroom(cx, cy, r, col, white_dots=True):
        # 菌柄
        d.rectangle([cx-2, cy, cx+2, cy+7], fill=(230, 220, 205, 255))
        # 菌盖
        d.ellipse([cx-r, cy-r//2, cx+r, cy+4], fill=col)
        # 白色圆点
        if white_dots:
            for dx, dy in [(-r//2, -1), (r//3, -2), (0, r//4)]:
                px(img, cx+dx, cy+dy, (255, 255, 255, 220))
    mushroom(8,  14, 8,  (210, 45, 35, 255))
    mushroom(25, 16, 6,  (180, 35, 28, 255))
    mushroom(17, 10, 10, (225, 55, 40, 255))
    return img

def prop_crystal():
    """蓝色水晶 (20×40)"""
    W, H = 20, 40
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    # 阴影
    d.ellipse([2, 34, 17, 39], fill=(0,0,0,50))
    # 主晶体 (六边形近似)
    pts = [(10,0),(18,12),(16,32),(10,38),(4,32),(2,12)]
    d.polygon(pts, fill=(60, 100, 210, 230))
    # 内部高光面
    d.polygon([(10,0),(18,12),(14,25),(10,28)], fill=(100, 155, 255, 200))
    d.polygon([(10,0),(2,12),(6,25),(10,28)],  fill=(40, 80, 180, 200))
    # 高光线
    d.line([(10,2),(16,14)], fill=(200, 225, 255, 180), width=1)
    # 顶部光晕
    px(img, 10, 2,  (230, 245, 255, 255))
    px(img, 11, 4,  (200, 230, 255, 220))
    # 小晶体
    sub_pts = [(16,18),(19,25),(17,32),(16,33),(13,30),(13,22)]
    d.polygon(sub_pts, fill=(80, 120, 220, 210))
    return img

def prop_fence_h():
    """横向木栅栏 (96×18) — 3根柱子+2块横板"""
    W, H = 96, 18
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    wood_dark = (108, 68, 28, 255)
    wood_light= (155, 100, 50, 255)
    wood_mid  = (132, 85, 38, 255)
    # 横板
    for y in range(3, 9):
        d.line([(0, y), (W-1, y)], fill=wood_light if y==4 else wood_mid)
    for y in range(11, 17):
        d.line([(0, y), (W-1, y)], fill=wood_light if y==12 else wood_mid)
    # 竖柱 (3根，每32px一根)
    for cx in [0, 47, 95]:
        d.rectangle([cx-2, 0, cx+2, H-1], fill=wood_dark)
        d.line([(cx-2, 0), (cx-2, H-1)], fill=wood_light)
    # 木纹
    for x in range(8, W-8, 12):
        d.line([(x, 4), (x+4, 8)], fill=(88, 55, 18, 80))
    return img

def prop_fence_v():
    """纵向木栅栏 (18×96)"""
    img = prop_fence_h().transpose(Image.ROTATE_90)
    return img

def prop_flower_patch():
    """花田装饰 (56×28)"""
    W, H = 56, 28
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    flower_data = [
        (4,18,(255,75,120)),(14,20,(255,220,52)),(22,16,(152,88,255)),
        (30,20,(255,112,42)),(38,18,(255,52,92)),(46,20,(72,198,255)),
        (8,10,(255,178,58)),(18,8,(255,75,120)),(28,12,(255,220,52)),
        (36,10,(152,88,255)),(48,14,(255,112,42)),(52,10,(255,52,92)),
    ]
    # 绿叶底
    for (fx, fy, col) in flower_data:
        d.ellipse([fx-3, fy-1, fx+3, fy+5], fill=(60, 120, 45, 200))
    # 花朵
    for (fx, fy, col) in flower_data:
        for angle in range(0, 360, 60):
            rad = math.radians(angle)
            ppx = int(fx + math.cos(rad)*3)
            ppy = int(fy + math.sin(rad)*3)
            if 0<=ppx<W and 0<=ppy<H:
                img.putpixel((ppx, ppy), col+(255,))
        if 0<=fx<W and 0<=fy<H:
            img.putpixel((fx, fy), (255, 242, 160, 255))
    return img

# ─── 保存额外道具 ─────────────────────────────────────────────────────────────

props = [
    ('prop-campfire',    prop_campfire()),
    ('prop-torch',       prop_torch()),
    ('prop-mushroom',    prop_mushroom()),
    ('prop-crystal',     prop_crystal()),
    ('prop-fence-h',     prop_fence_h()),
    ('prop-fence-v',     prop_fence_v()),
    ('prop-flower-patch',prop_flower_patch()),
]

for name, img in props:
    path = OUT + name + '.png'
    img.save(path)
    print(f'  {name}.png  {img.size}')

print('\n全部生成完毕 →', OUT)
