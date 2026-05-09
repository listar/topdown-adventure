// 装备 / 道具系统
//
// 5 个装备位: weapon / armor / helmet / boots / ring
// stats: 基础属性加成 (atk / def / maxHp / maxMp / spd)
// affixes: 特殊词条 (critRate / stunRate / lifeSteal / reflect / dodge)

const Slots = ['weapon', 'armor', 'helmet', 'boots', 'ring'];

const SlotMeta = {
  weapon: { name: '武器',  glyph: '武', color: '#7c2018' }, // 朱砂红
  armor:  { name: '衣甲',  glyph: '甲', color: '#3a6a4a' }, // 翠绿
  helmet: { name: '头盔',  glyph: '盔', color: '#3a4a8a' }, // 靛蓝
  boots:  { name: '鞋履',  glyph: '靴', color: '#7a5a30' }, // 褐
  ring:   { name: '戒指',  glyph: '环', color: '#b59d5e' }, // 旧金
};

// 品质 (rarity)
const Rarity = {
  common: { name: '凡品', color: '#a5a098', stars: 1 },
  rare:   { name: '良品', color: '#5fa8e8', stars: 2 },
  epic:   { name: '珍品', color: '#c87aff', stars: 3 },
  legend: { name: '神品', color: '#ffd866', stars: 4 },
};

// ---- 装备库 ----
// stats 中的字段对应 player 的对应属性, 装备时 + 卸下时会重算
// type: 'quest' 的道具不可装备, 只能收集 / 丢弃
const Items = {
  // --- 药水 ---
  hp_potion:    { type: 'potion', name: '回气丹',   glyph: '红', color: '#e05050', desc: '恢复 60 HP',  effect: { hp: 60  }, value: 30 },
  mp_potion:    { type: 'potion', name: '聚灵丹',   glyph: '蓝', color: '#4488ee', desc: '恢复 50 MP',  effect: { mp: 50  }, value: 25 },
  hp_potion_lg: { type: 'potion', name: '大回气丹', glyph: '红', color: '#e05050', desc: '恢复 150 HP', effect: { hp: 150 }, value: 80 },
  mp_potion_lg: { type: 'potion', name: '大聚灵丹', glyph: '蓝', color: '#4488ee', desc: '恢复 120 MP', effect: { mp: 120 }, value: 70 },

  // --- 消耗道具 ---
  recall_scroll: { type: 'item', name: '回城卷轴', glyph: '卷', color: '#f0d080',
    desc: '立即传送回桃源村', effect: { recall: true }, value: 50 },
  speed_potion:  { type: 'item', name: '速度药水', glyph: '迅', color: '#60d0ff',
    desc: '5 分钟内移动速度 ×1.5', effect: { speedBuff: 1.5, duration: 300 }, value: 60 },
  power_pill:    { type: 'item', name: '大力丸',   glyph: '力', color: '#ff9040',
    desc: '5 分钟内攻击力 +20', effect: { atkBuff: 20, duration: 300 }, value: 80 },

  // --- 任务道具 ---
  slime_jelly:  { type: 'quest', name: '史莱姆果冻', glyph: '冻', desc: '史莱姆体内的透明果冻, 滑溜溜的' },
  goblin_ear:   { type: 'quest', name: '哥布林耳饰', glyph: '耳', desc: '哥布林最爱的耳饰, 含有稀有矿粉' },
  wolf_fang:    { type: 'quest', name: '灰狼獠牙',   glyph: '牙', desc: '从灰狼口中取下的利齿, 可作药材' },
  bat_wing:     { type: 'quest', name: '幽冥蝠翼',   glyph: '翼', desc: '幽冥蝙蝠的翅膀, 透出淡淡磷光' },
  cave_crystal: { type: 'quest', name: '洞穴晶石',   glyph: '晶', desc: '守护者身上的神秘晶石, 蕴含强大能量' },
  // 武器
  wood_sword:   { slot: 'weapon', name: '木剑',       glyph: '木', stats: { atk: 3 },                rarity: 'common', value: 12 },
  iron_sword:   { slot: 'weapon', name: '铁剑',       glyph: '铁', stats: { atk: 8 },                rarity: 'common', value: 35 },
  bronze_sword: { slot: 'weapon', name: '青铜剑',     glyph: '青', stats: { atk: 12, spd: 1 },        rarity: 'rare',   value: 80 },
  jade_sword:   { slot: 'weapon', name: '碧玉剑',     glyph: '碧', stats: { atk: 18, maxMp: 10 },     rarity: 'rare',   value: 160 },
  dragon_blade: { slot: 'weapon', name: '龙鳞斩',     glyph: '龍', stats: { atk: 30, maxHp: 30 },     rarity: 'epic',   value: 480 },
  // 高难 Boss 专属掉落 (含词条)
  soul_blade:    { slot: 'weapon', name: '魂噬之刃',   glyph: '魂', stats: { atk: 45 },                affixes: { critRate: 1.0 },            rarity: 'legend', value: 1500 },
  vampire_edge:  { slot: 'weapon', name: '嗜血刃',     glyph: '血', stats: { atk: 38, maxHp: 20 },     affixes: { lifeSteal: 0.35 },          rarity: 'epic',   value: 900 },

  // 衣甲
  cloth_robe:   { slot: 'armor', name: '布衣',        glyph: '布', stats: { def: 2, maxHp: 5 },       rarity: 'common', value: 10 },
  leather_armor:{ slot: 'armor', name: '皮甲',        glyph: '皮', stats: { def: 6, maxHp: 12 },      rarity: 'common', value: 30 },
  iron_armor:   { slot: 'armor', name: '铁甲',        glyph: '铁', stats: { def: 12, maxHp: 24 },     rarity: 'rare',   value: 120 },
  jade_armor:   { slot: 'armor', name: '玉鳞铠',      glyph: '玉', stats: { def: 22, maxHp: 50, maxMp: 10 }, rarity: 'epic', value: 420 },

  // 头盔
  cloth_cap:    { slot: 'helmet', name: '布巾',       glyph: '巾', stats: { def: 1, maxHp: 3 },       rarity: 'common', value: 8 },
  iron_helm:    { slot: 'helmet', name: '铁盔',       glyph: '盔', stats: { def: 5, maxHp: 15 },      rarity: 'rare',   value: 90 },
  phoenix_crown:{ slot: 'helmet', name: '凤翎冠',     glyph: '凤', stats: { def: 10, maxMp: 20 },     rarity: 'epic',   value: 280 },
  mirror_helm:   { slot: 'helmet', name: '镜魂战盔',   glyph: '镜', stats: { def: 15, maxHp: 30 },     affixes: { reflect: 0.3 },             rarity: 'epic',   value: 800 },

  // 鞋
  cloth_shoes:  { slot: 'boots', name: '草鞋',        glyph: '草', stats: { spd: 1 },                 rarity: 'common', value: 6 },
  leather_boots:{ slot: 'boots', name: '皮靴',        glyph: '皮', stats: { def: 2, spd: 2 },         rarity: 'common', value: 22 },
  iron_boots:   { slot: 'boots', name: '铁靴',        glyph: '铁', stats: { def: 4, spd: 3 },         rarity: 'rare',   value: 100 },
  wind_boots:   { slot: 'boots', name: '追风靴',      glyph: '风', stats: { def: 6, spd: 6 },         rarity: 'epic',   value: 300 },
  phantom_cloak: { slot: 'boots', name: '幻影轻甲',    glyph: '幻', stats: { def: 8, spd: 5 },          affixes: { dodge: 0.4 },               rarity: 'epic',   value: 850 },

  // 戒指
  jade_ring:    { slot: 'ring',  name: '碧玉环',      glyph: '碧', stats: { maxMp: 10, atk: 2 },      rarity: 'rare',   value: 70 },
  dragon_ring:  { slot: 'ring',  name: '盘龙戒',      glyph: '龍', stats: { atk: 5, def: 3, maxHp: 20 }, affixes: { lifeSteal: 0.12 }, rarity: 'epic', value: 360 },

  // 高级武器 (新场景掉落)
  ghost_blade:  { slot: 'weapon', name: '幽灵剑',     glyph: '幽', stats: { atk: 20, spd: 2 },        rarity: 'rare',  value: 220 },
  demon_fang:   { slot: 'weapon', name: '恶魔獠牙',   glyph: '魔', stats: { atk: 35, maxMp: 20 },     rarity: 'epic',  value: 560 },
  void_blade:   { slot: 'weapon', name: '虚空刃',     glyph: '虚', stats: { atk: 50, def: 5, maxHp: 40 }, affixes: { critRate: 0.4 }, rarity: 'legend', value: 999 },

  // 高级防具
  bone_armor:   { slot: 'armor', name: '枯骨甲',      glyph: '骨', stats: { def: 18, maxHp: 35 },     rarity: 'rare',  value: 200 },
  shadow_robe:  { slot: 'armor', name: '暗影袍',      glyph: '影', stats: { def: 28, maxHp: 60, maxMp: 20 }, rarity: 'epic', value: 550 },

  // 高级戒指
  spirit_ring:  { slot: 'ring',  name: '灵魂戒',      glyph: '灵', stats: { atk: 8, maxMp: 30 },      rarity: 'rare',  value: 160 },
  abyss_ring:   { slot: 'ring',  name: '深渊戒',      glyph: '渊', stats: { atk: 12, def: 8, maxHp: 50 }, affixes: { stunRate: 0.25 }, rarity: 'legend', value: 900 },
  thunder_ring:  { slot: 'ring',  name: '雷鸣之戒',    glyph: '雷', stats: { atk: 10, maxMp: 25 },     affixes: { stunRate: 0.5 },            rarity: 'legend', value: 1300 },
};

// 怪物掉落表
const Drops = {
  slime: [
    { id: 'wood_sword',     chance: 0.05 },
    { id: 'cloth_robe',     chance: 0.18 },
    { id: 'cloth_cap',      chance: 0.12 },
    { id: 'slime_jelly',    chance: 0.65 },
    { id: 'hp_potion',      chance: 0.12 },
  ],
  goblin: [
    { id: 'iron_sword',     chance: 0.16 },
    { id: 'leather_armor',  chance: 0.10 },
    { id: 'cloth_shoes',    chance: 0.15 },
    { id: 'goblin_ear',     chance: 0.55 },
    { id: 'speed_potion',   chance: 0.08 },
  ],
  wolf: [
    { id: 'leather_boots',  chance: 0.30 },
    { id: 'leather_armor',  chance: 0.18 },
    { id: 'wolf_fang',      chance: 0.55 },
    { id: 'speed_potion',   chance: 0.10 },
  ],
  bat: [
    { id: 'cloth_cap',      chance: 0.30 },
    { id: 'leather_armor',  chance: 0.15 },
    { id: 'bat_wing',       chance: 0.50 },
    { id: 'recall_scroll',  chance: 0.06 },
  ],
  shade: [
    { id: 'iron_armor',     chance: 0.18 },
    { id: 'jade_ring',      chance: 0.12 },
    { id: 'iron_helm',      chance: 0.20 },
    { id: 'power_pill',     chance: 0.10 },
  ],
  guardian: [
    { id: 'dragon_blade',   chance: 1.0 },
    { id: 'jade_armor',     chance: 1.0 },
    { id: 'phoenix_crown',  chance: 1.0 },
    { id: 'wind_boots',     chance: 1.0 },
    { id: 'dragon_ring',    chance: 0.5 },
    { id: 'cave_crystal',   chance: 1.0 },
    { id: 'recall_scroll',  chance: 0.5 },
    { id: 'power_pill',     chance: 0.4 },
  ],
  wanderer: [
    { id: 'bronze_sword',   chance: 0.25 },
    { id: 'jade_ring',      chance: 0.30 },
    { id: 'recall_scroll',  chance: 0.12 },
  ],
  eagle: [
    { id: 'leather_boots',  chance: 0.35 },
    { id: 'iron_helm',      chance: 0.12 },
    { id: 'speed_potion',   chance: 0.12 },
  ],
  wind_sprite: [
    { id: 'jade_ring',      chance: 0.18 },
    { id: 'bronze_sword',   chance: 0.15 },
    { id: 'speed_potion',   chance: 0.15 },
  ],
  water_sprite: [
    { id: 'iron_armor',     chance: 0.15 },
    { id: 'jade_ring',      chance: 0.15 },
    { id: 'mp_potion',      chance: 0.15 },
  ],
  crab: [
    { id: 'iron_helm',      chance: 0.30 },
    { id: 'leather_armor',  chance: 0.20 },
    { id: 'hp_potion',      chance: 0.15 },
  ],
  skeleton: [
    { id: 'bone_armor',     chance: 0.20 },
    { id: 'iron_sword',     chance: 0.18 },
    { id: 'ghost_blade',    chance: 0.08 },
    { id: 'power_pill',     chance: 0.12 },
  ],
  ghost_knight: [
    { id: 'ghost_blade',    chance: 0.30 },
    { id: 'bone_armor',     chance: 0.25 },
    { id: 'spirit_ring',    chance: 0.15 },
    { id: 'recall_scroll',  chance: 0.15 },
    { id: 'power_pill',     chance: 0.15 },
  ],
  fairy: [
    { id: 'jade_ring',      chance: 0.30 },
    { id: 'jade_sword',     chance: 0.10 },
    { id: 'mp_potion',      chance: 0.20 },
    { id: 'speed_potion',   chance: 0.12 },
  ],
  plant_monster: [
    { id: 'jade_armor',     chance: 0.12 },
    { id: 'iron_armor',     chance: 0.20 },
    { id: 'hp_potion',      chance: 0.18 },
  ],
  sand_scorpion: [
    { id: 'leather_boots',  chance: 0.25 },
    { id: 'iron_boots',     chance: 0.15 },
    { id: 'ghost_blade',    chance: 0.10 },
    { id: 'speed_potion',   chance: 0.12 },
  ],
  desert_snake: [
    { id: 'iron_armor',     chance: 0.20 },
    { id: 'iron_boots',     chance: 0.15 },
  ],
  zombie: [
    { id: 'bone_armor',     chance: 0.22 },
    { id: 'iron_helm',      chance: 0.18 },
    { id: 'hp_potion',      chance: 0.12 },
  ],
  possessed: [
    { id: 'shadow_robe',    chance: 0.15 },
    { id: 'spirit_ring',    chance: 0.20 },
    { id: 'ghost_blade',    chance: 0.12 },
    { id: 'power_pill',     chance: 0.15 },
    { id: 'recall_scroll',  chance: 0.10 },
  ],
  demon: [
    { id: 'demon_fang',     chance: 0.15 },
    { id: 'shadow_robe',    chance: 0.18 },
    { id: 'abyss_ring',     chance: 0.08 },
    { id: 'power_pill',     chance: 0.18 },
  ],
  shadow_beast: [
    { id: 'demon_fang',     chance: 0.20 },
    { id: 'abyss_ring',     chance: 0.12 },
    { id: 'power_pill',     chance: 0.20 },
    { id: 'recall_scroll',  chance: 0.15 },
  ],
  demon_lord: [
    { id: 'void_blade',     chance: 1.0 },
    { id: 'abyss_ring',     chance: 1.0 },
    { id: 'shadow_robe',    chance: 1.0 },
    { id: 'recall_scroll',  chance: 1.0 },
    { id: 'power_pill',     chance: 0.8 },
    { id: 'speed_potion',   chance: 0.8 },
  ],
  // 高难隐藏 Boss 掉落
  death_knight: [
    { id: 'vampire_edge',   chance: 1.0 },
    { id: 'mirror_helm',    chance: 1.0 },
    { id: 'spirit_ring',    chance: 0.7 },
  ],
  chaos_titan: [
    { id: 'soul_blade',     chance: 1.0 },
    { id: 'thunder_ring',   chance: 0.9 },
    { id: 'jade_armor',     chance: 0.8 },
  ],
  void_emperor: [
    { id: 'phantom_cloak',  chance: 1.0 },
    { id: 'void_blade',     chance: 0.8 },
    { id: 'abyss_ring',     chance: 1.0 },
  ],
};

// 给定怪物类型, 摇出一组掉落 (返回 item id 数组)
function rollDrops(monsterType) {
  const table = Drops[monsterType];
  if (!table) return [];
  const out = [];
  for (const e of table) {
    if (Math.random() < e.chance) out.push(e.id);
  }
  return out;
}

const StatLabels = {
  atk:    '攻击', def:    '防御',
  maxHp:  '气血', maxMp:  '法力',
  spd:    '速度',
};

const AffixLabels = {
  critRate:  '✦必定暴击',
  stunRate:  '✦眩晕',
  lifeSteal: '✦吸血',
  reflect:   '✦反伤',
  dodge:     '✦闪避',
};

// stats: item.stats 对象; affixes: item.affixes 对象(可选)
function formatStats(stats, affixes) {
  const lines = Object.entries(stats || {}).map(
    ([k, v]) => `${StatLabels[k] || k} +${v}`
  );
  for (const [k, v] of Object.entries(affixes || {})) {
    const label = AffixLabels[k] || k;
    lines.push(`${label} ${Math.round(v * 100)}%`);
  }
  return lines;
}
