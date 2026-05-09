#!/usr/bin/env python3
"""生成 10 个新场景的地图 JS 代码 (24×30, 每行精确 24 字符)"""

def V(name, rows):
    assert len(rows) == 30, f"{name}: {len(rows)} rows"
    for i, r in enumerate(rows):
        assert len(r) == 24, f"{name}[{i}]: len={len(r)}: {r!r}"
    return rows

def B(ch='#', gap=None):
    r = list(ch * 24)
    if gap is not None: r[gap] = '-'
    return ''.join(r)

def sym(left, fill_ch, right, total=22):
    """left + fill_ch*(total-len(left)-len(right)) + right"""
    n = total - len(left) - len(right)
    if n < 0: raise ValueError(f"overflow: {left!r}+{right!r}={len(left)+len(right)}")
    if len(fill_ch) != 1: raise ValueError(f"fill_ch must be 1 char: {fill_ch!r}")
    return left + fill_ch * n + right

def I(c, b='#'):
    if len(c) != 22: raise ValueError(f"need 22 chars: len={len(c)}: {c!r}")
    return b + c + b

IR = lambda c: I(c, 'R')
IT = lambda c: I(c, 'T')
IS = lambda c: I(c, 's')

O22 = '.' * 22
S22 = 's' * 22

# ─── 云上仙宫 cloudPalace ─────────────────────────────────
# N col12 → 冰峰绝顶 | S col12 → 山顶观星台
cloudPalace = V('cloudPalace', [
    B(gap=12),                                    # 0 N
    I(O22),
    I(sym('W', '.', 'W')),                         # 柱
    I(O22),
    I('..##' + '.' * 10 + '##' + '.' * 6),        # 4  内墙
    I('..#' + '.' * 15 + '#...'),                  # 5
    I('..#' + '.' * 15 + '#...'),                  # 6
    I('..##' + '.' * 10 + '##' + '.' * 6),        # 7
    I(O22),
    I(sym('..f', '.', 'f..')),                     # 9
    I(O22),
    I(sym('W', '.', 'W')),                         # 11
    I(O22),
    I(sym('f', '.', 'f')),                         # 13
    I(O22),
    I(sym('W', '.', 'W')),                         # 15
    I(O22),
    I(sym('..f', '.', 'f..')),                     # 17
    I(O22),
    I('..##' + '.' * 10 + '##' + '.' * 6),        # 19
    I('..#' + '.' * 15 + '#...'),                  # 20
    I('..#' + '.' * 15 + '#...'),                  # 21
    I('..##' + '.' * 10 + '##' + '.' * 6),        # 22
    I(O22),
    I(sym('W', '.', 'W')),                         # 24
    I(O22),
    I(O22),
    I(O22),
    I(O22),
    B(gap=12),                                    # 29 S
])

# ─── 水底神殿 underwaterTemple ───────────────────────────
# S col12 → 晨雾渡口
_UW_OUT = sym('ss####', 's', '####ss')            # 6+10+6=22
_UW_MID = sym('ss#ss', '~', 'ss#ss')              # 5+12+5=22
_UW_IN  = sym('ss#s', '~', 's#ss')               # 4+14+4=22

underwaterTemple = V('underwaterTemple', [
    B(gap=12),                                    # 0
    I(S22), I(_UW_OUT), I(_UW_MID), I(_UW_IN),   # 1-4
    I(_UW_MID), I(_UW_OUT),                        # 5-6
    I(S22),
    I(sym('ssR', 's', 'Rss')),                    # 8
    I(S22),
    I(_UW_OUT), I(_UW_MID),
    I(_UW_IN), I(_UW_IN),                         # 12-13 中央
    I(_UW_MID), I(_UW_OUT),
    I(S22),
    I(sym('ssR', 's', 'Rss')),                    # 17
    I(S22),
    I(_UW_OUT), I(_UW_MID), I(_UW_IN),
    I(_UW_MID), I(_UW_OUT),
    I(S22),
    I(sym('ssR', 's', 'Rss')),                    # 25
    I(S22), I(S22), I(S22),
    B(gap=12),                                    # 29
])

# ─── 熔火山口 volcanoCrater ───────────────────────────────
# S col12 → 古战场
_VC_OUT = sym('sssssss####', 's', '####sssss')    # 11+2+9=22
_VC_MID = sym('ssssss#ss', '~', 'ss#sssss')       # 9+5+8=22
_VC_IN  = sym('sssss#', '~', '#sssss')            # 6+10+6=22
_VC_CEN = sym('sssssssss####', 's', '####sssss')  # 13+0+9=22
_VC_CM  = sym('ssssssss#ss', '~', 'ss#ssssss')    # 11+2+9=22? 11+9=20, fill=2 ✓
_VC_CI  = sym('ssssssss#s', '~', 's#sssssss')     # 10+3+9=22 ✓

volcanoCrater = V('volcanoCrater', [
    B('R', gap=12),                               # 0
    IR(S22),
    IR(sym('ssR', 's', 'Rss')),
    IR(_VC_OUT), IR(_VC_MID), IR(_VC_IN),         # 3-5
    IR(_VC_MID), IR(_VC_OUT),
    IR(S22),
    IR(sym('ssR', 's', 'Rss')),                   # 9
    IR(S22),
    IR(_VC_CEN),                                  # 11 中央岩浆坑
    IR(_VC_CM), IR(_VC_CI), IR(_VC_CI),
    IR(_VC_CM), IR(_VC_CEN),
    IR(S22),
    IR(sym('ssR', 's', 'Rss')),
    IR(S22),
    IR(_VC_OUT), IR(_VC_MID), IR(_VC_IN),
    IR(_VC_MID), IR(_VC_OUT),
    IR(S22), IR(S22), IR(S22), IR(S22),
    B('R', gap=12),                               # 29
])

# ─── 地底暗湖 undergroundLake ─────────────────────────────
# W row14 col0 → 幽暗洞穴
_UL_OUT = sym('sss####', 's', '####sss')          # 7+8+7=22
_UL_MID = sym('ssss#ss', '~', 'ss#ssss')          # 7+8+7=22
_UL_IN  = sym('ssss#s', '~', 's#sssss')           # 6+10+6=22

undergroundLake = V('undergroundLake', [
    B(),
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(_UL_OUT), I(_UL_MID),
    I(_UL_IN), I(_UL_IN), I(_UL_IN),             # 5-7 大湖
    I(_UL_MID), I(_UL_OUT),
    I(S22),
    I(_UL_OUT), I(_UL_MID), I(_UL_IN),
    '-' + S22 + '#',                              # 14 W → 洞穴
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(S22),
    I(_UL_OUT), I(_UL_MID), I(_UL_IN),
    I(_UL_MID), I(_UL_OUT),
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(S22), I(S22), I(S22), I(S22),
    B(),
])

# ─── 古籍楼 ancientLibrary ────────────────────────────────
# S col12 → 废弃小镇
_AL_SHF = '..HH....HH....HH....HH'               # 22 ✓
_AL_RM  = '....####' + '.' * 6 + '####....'      # 8+6+8=22 ✓
_AL_RR  = '....#' + '.' * 12 + '#....'           # 5+12+5=22 ✓
_AL_RF  = '....#' + sym('f', '.', 'f', 12) + '#....'  # 5+12+5=22 ✓

ancientLibrary = V('ancientLibrary', [
    B(gap=12),
    I(O22),
    I(_AL_SHF), I(_AL_SHF),
    I(O22),
    I(_AL_SHF), I(_AL_SHF),
    I(O22),
    I(_AL_SHF), I(_AL_SHF),
    I(O22),
    I(_AL_RM), I(_AL_RR), I(_AL_RF), I(_AL_RR), I(_AL_RM),  # 11-15
    I(O22),
    I(_AL_SHF), I(_AL_SHF),
    I(O22),
    I(_AL_SHF), I(_AL_SHF),
    I(O22),
    I(_AL_SHF), I(_AL_SHF),
    I(O22), I(O22), I(O22), I(O22),
    B(gap=12),                                   # 29
])

# ─── 幻影古城 mirageCity ──────────────────────────────────
# E row14 col23 → 沙漠绿洲
_MC_H = 'ssHHssssHHssssHHssssHH'               # 22 ✓
_MC_P = 'ss--ss--ss--ss--ss--ss'               # 22 ✓

mirageCity = V('mirageCity', [
    B('s'),
    IS(S22), IS(_MC_H), IS(_MC_H), IS(S22),
    IS(_MC_P), IS(S22), IS(_MC_H), IS(_MC_H), IS(S22),
    IS(_MC_P), IS(S22),
    IS(sym('ssR', 's', 'Rss')),
    IS(S22),
    's' + S22 + '-',                             # 14 E → 绿洲
    IS(S22),
    IS(sym('ssR', 's', 'Rss')),
    IS(S22), IS(_MC_P), IS(S22),
    IS(_MC_H), IS(_MC_H), IS(S22), IS(_MC_P), IS(S22),
    IS(_MC_H), IS(_MC_H), IS(S22), IS(S22),
    B('s'),                                      # 29
])

# ─── 太古密林 ancientForest ───────────────────────────────
# N col16 → 秘密花园
ancientForest = V('ancientForest', [
    B('T', gap=16),                              # 0 N col16
    IT(O22),
    IT('..T..T....T....T..T..T'),
    IT(sym('....f', '.', 'f....')),
    IT('..T.....T......T.....T'),
    IT(sym('....f', '.', 'f....')),
    IT('..T....T' + '~' * 8 + 'T....T'),        # 6 湖
    IT('....T.T' + '~' * 8 + 'T.T....'),
    IT('..T.....' + '~' * 8 + '.....T'),
    IT(sym('......', '~', '......')),            # 9 湖心
    IT('..T.....' + '~' * 8 + '.....T'),
    IT('....T.T' + '~' * 8 + 'T.T....'),
    IT('..T....T' + '~' * 8 + 'T....T'),        # 12
    IT(sym('....f', '.', 'f....')),
    IT('..T...T..f.....f.T....'),
    IT('....T.....T...T...T...'),
    IT('..T....f.......f...T..'),
    IT('...T...T....T....T....'),
    IT('..T..f...........f.T..'),
    IT('....T.....T...T...T...'),
    IT('..T.................T.'),
    IT('....T.T..........T.T..'),
    IT('..T.....T......T.....T'),
    IT(sym('....f', '.', 'f....')),
    IT('..T.....T......T.....T'),
    IT(sym('....f', '.', 'f....')),
    IT('..T..T....T....T..T..T'),
    IT(O22), IT(O22),
    B('T'),                                      # 29
])

# ─── 幽魂界域 spiritRealm ─────────────────────────────────
# N col12 → 深渊洞口 | S col12 → 天地封印台
_SR_OUT = sym('sss####', 's', '####sss')         # 7+8+7=22
_SR_MID = sym('sss#sss', '~', 'sss#sss')         # 7+8+7=22
_SR_IN  = sym('sss#ss', '~', 'ss#sss')           # 6+10+6=22

spiritRealm = V('spiritRealm', [
    B(gap=12),                                   # 0 N
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(S22),
    I(_SR_OUT), I(_SR_MID), I(_SR_IN), I(_SR_IN), I(_SR_MID), I(_SR_OUT),
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(S22),
    I(_SR_OUT), I(_SR_MID), I(_SR_IN), I(_SR_IN), I(_SR_MID), I(_SR_OUT),
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(S22), I(S22), I(S22), I(S22),
    I(S22), I(S22), I(S22), I(S22),
    B(gap=12),                                   # 29 S
])

# ─── 冰峰绝顶 frozenPeak ──────────────────────────────────
# S col12 → 云上仙宫
_FP_T  = sym('ssssssss####', 's', '####ssssss')  # 12+0+10=22
_FP_TM = sym('sssssssss#', '~', '#sssssssss')    # 10+2+10=22
_FP_TI = sym('sssssssss#s', '~', 's#sssssss')    # 11+2+9=22

frozenPeak = V('frozenPeak', [
    B('R'),                                      # 0
    IR(S22),
    IR(sym('ssW', 's', 'Wss')),                  # 2 冰晶
    IR(S22),
    IR(sym('ssssRRR', 's', 'RRRssss')),          # 4
    IR(sym('sssRRRRR', 's', 'RRRRRsss')),        # 5
    IR(sym('ssssRRR', 's', 'RRRssss')),          # 6
    IR(S22),
    IR(sym('ssW', 's', 'Wss')),
    IR(S22),
    IR(sym('ssssRRR', 's', 'RRRssss')),
    IR(sym('sssRRRRR', 's', 'RRRRRsss')),
    IR(_FP_T), IR(_FP_TM), IR(_FP_TI),          # 12-14 冰神庙
    IR(_FP_TM), IR(_FP_T),
    IR(S22),
    IR(sym('ssW', 's', 'Wss')),
    IR(S22),
    IR(sym('ssssRRR', 's', 'RRRssss')),
    IR(sym('sssRRRRR', 's', 'RRRRRsss')),
    IR(sym('ssssRRR', 's', 'RRRssss')),
    IR(S22),
    IR(sym('ssW', 's', 'Wss')),
    IR(S22), IR(S22), IR(S22), IR(S22),
    B('R', gap=12),                              # 29
])

# ─── 天地封印台 finalShrine ───────────────────────────────
# N col12 → 幽魂界域
_FS_W1 = 'ss' + '#' * 20                        # 22 ✓
_FS_R1 = 'ss#' + 's' * 16 + '#ss'               # 22 ✓
_FS_W2 = 'ss#ss' + '#' * 12 + 'ss#ss'           # 5+12+5=22 ✓
_FS_R2 = 'ss#ss#' + 's' * 10 + '#ss#ss'         # 6+10+6=22 ✓
_FS_A1 = 'ss#ss#' + 'WW..WW....' + '#ss#ss'     # 6+10+6=22 ✓
_FS_A2 = 'ss#ss#' + 'W........W' + '#ss#ss'     # 6+10+6=22 ✓
_FS_IN = 'sss#' + '.' * 14 + '#sss'             # 4+14+4=22 ✓
_FS_O2 = sym('sss####', 's', '####sss')          # 7+8+7=22
_FS_O3 = sym('sss#sss', '.', 'sss#sss')          # 7+8+7=22

finalShrine = V('finalShrine', [
    B(gap=12),                                   # 0 N
    I(S22),
    I(_FS_W1), I(_FS_R1),                        # 2-3
    I(_FS_W2), I(_FS_R2),                        # 4-5
    I(_FS_A1), I(_FS_A2), I(_FS_A2), I(_FS_A1), # 6-9 BOSS 核心
    I(_FS_R2), I(_FS_W2),                        # 10-11
    I(_FS_R1), I(_FS_W1),                        # 12-13
    I(S22),
    I(sym('ssR', 's', 'Rss')),
    I(S22), I(S22),
    I(_FS_O2),                                   # 18
    I(_FS_O3), I(_FS_IN), I(_FS_IN), I(_FS_IN), I(_FS_O3),
    I(_FS_O2),                                   # 24
    I(S22), I(S22), I(S22), I(S22),
    B(),                                         # 29
])

# ─── 输出 JS ──────────────────────────────────────────────
SCENES = [
    ('cloudPalace',      cloudPalace),
    ('underwaterTemple', underwaterTemple),
    ('volcanoCrater',    volcanoCrater),
    ('undergroundLake',  undergroundLake),
    ('ancientLibrary',   ancientLibrary),
    ('mirageCity',       mirageCity),
    ('ancientForest',    ancientForest),
    ('spiritRealm',      spiritRealm),
    ('frozenPeak',       frozenPeak),
    ('finalShrine',      finalShrine),
]

import sys
lines = []
for name, rows in SCENES:
    lines.append(f"const {name}Map = parseMap([")
    for i, row in enumerate(rows):
        comma = '' if i == len(rows)-1 else ','
        comment = f"  // {i}" if i in (0, 29) else ''
        lines.append(f"  '{row}'{comma}{comment}")
    lines.append("]);\n")
print('\n'.join(lines))
print("// ✓ 10 个地图验证通过", file=sys.stderr)
