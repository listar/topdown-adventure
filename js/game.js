// 游戏主入口 - 状态机 + 相机 + 资源 + 存档
//
// 状态:
//   'loading'      - 加载美术资源
//   'title'        - 标题屏 (有存档则显示"继续游戏"按钮)
//   'explore'      - 在场景中走动
//   'transition'   - 场景切换 (黑屏 + 过场卡)
//   'dialogue'     - 对话框
//   'battle'       - 回合战斗
//   'inventory'    - 装备 + 背包界面

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  Input.bindCanvas(canvas);

  const VIEW_W = canvas.width;   // 384
  const VIEW_H = canvas.height;  // 640

  // ============ 资源加载 ============
  const assets = {};
  const ASSETS = [
    ['logo',               'art/assets/logo.png'],
    ['battleBg',           'art/assets/battle-bg.png'],
    ['cardVillage',        'art/assets/scene-village.png'],
    ['cardForest',         'art/assets/scene-forest.png'],
    ['cardCave',           'art/assets/scene-cave.png'],
    ['cardMountaintop',    'art/assets/scene-mountaintop.png'],
    ['cardDocks',          'art/assets/scene-docks.png'],
    ['cardBattlefield',    'art/assets/scene-battlefield.png'],
    ['cardSecretGarden',   'art/assets/scene-garden.png'],
    ['cardOasis',          'art/assets/scene-oasis.png'],
    ['cardAbandonedTown',  'art/assets/scene-abandonedtown.png'],
    ['cardAbyss',          'art/assets/scene-abyss.png'],
  ];

  // 场景精灵 (背景 + 道具)
  const sprites = {};
  const SPRITES = [
    // 各场景专属 parallax 背景
    ['bgVillage',       'art/scenes/bg-village.png'],
    ['bgForest',        'art/scenes/bg-forest.png'],
    ['bgCave',          'art/scenes/bg-cave.png'],
    ['bgMountaintop',   'art/scenes/bg-mountaintop.png'],
    ['bgDocks',         'art/scenes/bg-docks.png'],
    ['bgBattlefield',   'art/scenes/bg-battlefield.png'],
    ['bgGarden',        'art/scenes/bg-garden.png'],
    ['bgOasis',         'art/scenes/bg-oasis.png'],
    ['bgAbandonedTown', 'art/scenes/bg-abandonedtown.png'],
    ['bgAbyss',         'art/scenes/bg-abyss.png'],
    // 旧背景 (保留兼容)
    ['sky',      'art/scenes/sky-background.png'],
    ['mountain', 'art/scenes/mountain-background.png'],
    ['rock',     'art/scenes/rock-background.png'],
    ['tree1',    'art/scenes/tree-1.png'],
    ['tree2',    'art/scenes/tree-2.png'],
    ['rock1',    'art/scenes/rock-1.png'],
    ['rock2',    'art/scenes/rock-2.png'],
    ['rock3',    'art/scenes/rock-3.png'],
    ['barrel',   'art/scenes/barrel.png'],
    ['crate1',   'art/scenes/crate-1.png'],
    ['cactus1',  'art/scenes/cactus-1.png'],
    ['cactus2',  'art/scenes/cactus-2.png'],
    ['cactus3',  'art/scenes/cactus-3.png'],
    ['grave1',   'art/scenes/grave-1.png'],
    ['grave2',   'art/scenes/grave-2.png'],
    ['grave3',   'art/scenes/grave-3.png'],
    ['skull',    'art/scenes/skull.png'],
    ['bone',     'art/scenes/bone.png'],
    ['bush',     'art/scenes/bush.png'],
    ['grass1',   'art/scenes/grass-1.png'],
    ['grass2',   'art/scenes/grass-2.png'],
    ['sign1',    'art/scenes/sign-1.png'],
    ['chest',    'art/scenes/chest.png'],
    ['ladder',   'art/scenes/ladder.png'],
    ['waterTrough',   'art/scenes/water-trough.png'],
    // 瓦片集 + 新道具
    ['tileset',       'art/tiles/tileset.png'],
    ['campfire',      'art/tiles/prop-campfire.png'],
    ['torch',         'art/tiles/prop-torch.png'],
    ['mushroom',      'art/tiles/prop-mushroom.png'],
    ['crystal',       'art/tiles/prop-crystal.png'],
    ['fenceH',        'art/tiles/prop-fence-h.png'],
    ['fenceV',        'art/tiles/prop-fence-v.png'],
    ['flowerPatch',   'art/tiles/prop-flower-patch.png'],
  ];

  let loadCount = 0;

  function preload(onDone) {
    const all = [...ASSETS, ...SPRITES];
    let pending = all.length;
    if (pending === 0) { onDone(); return; }
    for (const [key, src] of ASSETS) {
      const img = new Image();
      img.onload = () => { loadCount++; if (--pending === 0) onDone(); };
      img.onerror = () => { loadCount++; if (--pending === 0) onDone(); };
      img.src = src;
      assets[key] = img;
    }
    for (const [key, src] of SPRITES) {
      const img = new Image();
      img.onload = () => { loadCount++; if (--pending === 0) onDone(); };
      img.onerror = () => { loadCount++; if (--pending === 0) onDone(); };
      img.src = src;
      sprites[key] = img;
    }
  }

  // ============ 场景实例化 ============
  const sceneStates = {};
  for (const key of Object.keys(Scenes)) {
    const s = Scenes[key];
    sceneStates[key] = {
      def: s,
      npcs: (s.npcs || []).map((n) => new Npc(n)),
      monsters: (s.monsters || []).map((m) => new Monster(m)),
    };
  }

  let currentKey = 'village';
  const player = new Player(Scenes[currentKey].spawn.x, Scenes[currentKey].spawn.y);

  const questManager = new QuestManager();

  // ============ 状态 ============
  let state = 'loading';
  let titleTime = 0;
  let transition = null;
  let portalArmed = true;
  let monsterCooldown = 0;
  let dialogue = null;
  let battle = null;
  let bannerText = null, bannerTimer = 0;
  let inventoryView = { selected: null };
  let autoSaveTimer = 0;
  let shop = null;        // { tab, scroll, selected }
  let teleportState = null; // { scroll }

  // 商店商品目录
  const SHOP_CATALOG = {
    equip:  ['wood_sword','iron_sword','bronze_sword','jade_sword',
             'cloth_robe','leather_armor','iron_armor',
             'cloth_cap','iron_helm',
             'cloth_shoes','leather_boots','iron_boots',
             'jade_ring'],
    potion: ['hp_potion','mp_potion','hp_potion_lg','mp_potion_lg'],
    item:   ['recall_scroll','speed_potion','power_pill'],
  };

  // 传送目的地列表 (所有 20 个场景)
  const TELEPORT_LIST = Object.entries(Scenes).map(([key, s]) => ({ key, name: s.name }));

  // ============ 相机 ============
  const cam = { x: 0, y: 0 };
  function updateCamera(instant = false) {
    const targetX = player.x + player.w / 2 - VIEW_W / 2;
    const targetY = player.y + player.h / 2 - VIEW_H / 2;
    const maxX = Math.max(0, MAP_W - VIEW_W);
    const maxY = Math.max(0, MAP_H - VIEW_H);
    const cx = Math.max(0, Math.min(maxX, targetX));
    const cy = Math.max(0, Math.min(maxY, targetY));
    if (instant) {
      cam.x = cx; cam.y = cy;
    } else {
      cam.x += (cx - cam.x) * 0.15;
      cam.y += (cy - cam.y) * 0.15;
    }
  }

  function curScene() { return sceneStates[currentKey]; }
  function showBanner(text, ms = 1400) { bannerText = text; bannerTimer = ms / 1000; }

  function switchScene(key, spawn) {
    currentKey = key;
    player.x = spawn.x; player.y = spawn.y;
    // 进入场景时重置该场景所有怪物
    for (const m of sceneStates[key].monsters) m.defeated = false;
    updateCamera(true);
    portalArmed = false;
    monsterCooldown = 0.6;
    save();
  }

  // ============ 存档 / 读档 ============
  const SAVE_KEY = 'xianzong_save_v1';

  function save() {
    try {
      const data = {
        version: 1,
        timestamp: Date.now(),
        sceneKey: currentKey,
        pos: { x: player.x, y: player.y },
        player: player.serialize(),
        defeated: {},
        talked: {},
        quests: questManager.serialize(),
      };
      for (const k of Object.keys(sceneStates)) {
        data.defeated[k] = sceneStates[k].monsters.filter(m => m.defeated).map(m => m.id);
        data.talked[k]   = sceneStates[k].npcs.filter(n => n.talked).map(n => n.id);
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('save failed', e);
    }
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function applySave(d) {
    if (!d) return false;
    try {
      currentKey = d.sceneKey || 'village';
      player.applySave(d.player);
      if (d.pos) { player.x = d.pos.x; player.y = d.pos.y; }
      // 怪物已击败状态
      for (const k of Object.keys(sceneStates)) {
        const arr = (d.defeated && d.defeated[k]) || [];
        const set = new Set(arr);
        for (const m of sceneStates[k].monsters) m.defeated = set.has(m.id);
        const tarr = (d.talked && d.talked[k]) || [];
        const tset = new Set(tarr);
        for (const n of sceneStates[k].npcs) n.talked = tset.has(n.id);
      }
      if (d.quests) questManager.deserialize(d.quests);
      return true;
    } catch (e) {
      console.warn('apply save failed', e);
      return false;
    }
  }

  function deleteSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  // ============ 战斗 ============
  function startBattle(enemyKey, opts = {}) {
    state = 'battle';
    Input.setHotspots([]);
    battle = new Battle(player, enemyKey, {
      isBoss: !!opts.isBoss,
      onEnd: (res) => endBattle(res, opts.monsterRef),
    });
  }
  function endBattle(res, monsterRef) {
    Input.setHotspots([]);
    if (res.result === 'win') {
      if (monsterRef) {
        monsterRef.defeated = true;
        questManager.onKill(monsterRef.type); // 通知击杀类型任务
      }
      questManager.syncItems(player); // 同步道具类型任务
      let msg = `击败! +${res.exp}经验 +${res.gold}金`;
      if (res.drops && res.drops.length) {
        msg += `\n拾得 ${res.drops.length} 件装备`;
      }
      showBanner(msg, 1800);
    } else if (res.result === 'flee') {
      showBanner('已脱离战斗');
    } else if (res.result === 'lose') {
      currentKey = 'village';
      const s = Scenes.village;
      player.x = s.spawn.x; player.y = s.spawn.y;
      updateCamera(true);
      player.hp = Math.max(1, Math.floor(player.maxHp * 0.5));
      player.mp = Math.floor(player.maxMp * 0.5);
      showBanner('在村庄苏醒过来…', 2000);
    }
    battle = null;
    state = 'explore';
    monsterCooldown = 1.0;
    save();
  }

  // ============ 对话 ============
  function startDialogue(npc) {
    if (npc.type === 'shop') {
      shop = { tab: 'equip', scroll: 0, selected: null };
      state = 'shop';
      Input.setHotspots([]);
      return;
    }
    if (npc.type === 'teleporter') {
      teleportState = { scroll: 0 };
      state = 'teleport';
      Input.setHotspots([]);
      return;
    }
    state = 'dialogue';
    Input.setHotspots([]);

    let lines = npc.lines;
    let questAction = null;
    let questId = null;

    if (npc.questId) {
      questManager.syncItems(player);
      const qd = questManager.buildDialogue(npc.questId, player);
      if (qd) {
        lines = qd.lines;
        questAction = qd.action;
        questId = npc.questId;
      }
    }

    dialogue = { name: npc.name, lines, idx: 0, npc, questAction, questId };
  }

  function advanceDialogue() {
    if (!dialogue) return;
    dialogue.idx += 1;
    if (dialogue.idx >= dialogue.lines.length) {
      const npc = dialogue.npc;
      const questAction = dialogue.questAction;
      const questId = dialogue.questId;
      npc.talked = true;
      dialogue = null;
      state = 'explore';

      if (questAction === 'accept' && questId) {
        questManager.accept(questId);
        showBanner('接受任务: ' + QuestDefs[questId].title, 1500);
      } else if (questAction === 'complete' && questId) {
        const def = QuestDefs[questId];
        questManager.complete(questId, player);
        const r = def.reward;
        let msg = '任务完成: ' + def.title;
        if (r.gold) msg += `\n+${r.gold} 金`;
        if (r.exp) msg += `  +${r.exp} 经验`;
        if (r.heal) msg += '\n元气尽复';
        if (r.items && r.items.length) {
          msg += `\n获得: ${r.items.map(id => Items[id].name).join('、')}`;
        }
        showBanner(msg, 2200);
      } else {
        // 无任务动作时执行 NPC 原有 onClose
        const closeAction = npc.onClose;
        const battleKey = npc.battle;
        if (closeAction === 'battle' && battleKey) {
          startBattle(battleKey);
        } else if (closeAction === 'heal') {
          player.fullHeal();
          showBanner('元气尽复', 1500);
        }
      }
      save();
    }
  }

  function nearestNpc() {
    for (const npc of curScene().npcs) {
      if (npc.canInteract(player)) return npc;
    }
    return null;
  }

  function checkPortal() {
    if (transition) return;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    let touching = null;
    for (const p of Scenes[currentKey].portals) {
      if (px >= p.x && px <= p.x + p.w &&
          py >= p.y && py <= p.y + p.h) {
        touching = p; break;
      }
    }
    if (!portalArmed) {
      if (!touching) portalArmed = true;
      return;
    }
    if (!touching) return;
    const p = touching;
    const CARD_KEYS = {
      village: 'cardVillage', forest: 'cardForest', cave: 'cardCave',
      mountaintop: 'cardMountaintop', docks: 'cardDocks',
      battlefield: 'cardBattlefield', secretGarden: 'cardSecretGarden',
      oasis: 'cardOasis', abandonedTown: 'cardAbandonedTown', abyss: 'cardAbyss',
      // 新场景复用最接近的卡面
      cloudPalace: 'cardMountaintop', underwaterTemple: 'cardDocks',
      volcanoCrater: 'cardBattlefield', undergroundLake: 'cardCave',
      ancientLibrary: 'cardAbandonedTown', mirageCity: 'cardOasis',
      ancientForest: 'cardForest', spiritRealm: 'cardAbyss',
      frozenPeak: 'cardMountaintop', finalShrine: 'cardAbyss',
    };
    const cardKey = CARD_KEYS[p.target] || null;
    transition = {
      progress: 0, phase: 'out',
      target: p.target, spawn: p.spawn,
      card: assets[cardKey] || null,
      targetName: Scenes[p.target].name,
    };
    Input.setHotspots([]);
  }

  function checkMonsterContact() {
    if (monsterCooldown > 0) return;
    for (const m of curScene().monsters) {
      if (m.canCollide(player)) {
        startBattle(m.type, { isBoss: m.isBoss, monsterRef: m });
        return;
      }
    }
  }

  // ============ 场景道具 (世界坐标) ============
  // 每个 entry: { key: spriteKey, x, y, w, h }
  const SCENE_PROPS = {
    village: [
      { key: 'waterTrough', x: 8*TILE+4, y: 11*TILE, w: 40, h: 32 },
      { key: 'barrel',  x: 18*TILE+8, y:  7*TILE+8, w: 28, h: 36 },
      { key: 'barrel',  x: 19*TILE+8, y:  7*TILE+8, w: 28, h: 36 },
      { key: 'sign1',   x: 10*TILE,   y: 15*TILE-8, w: 32, h: 40 },
      { key: 'crate1',  x: 20*TILE+4, y: 17*TILE+4, w: 36, h: 32 },
    ],
    forest: [
      { key: 'tree1', x: 2*TILE, y: 8*TILE-16, w: 52, h: 72 },
      { key: 'tree2', x: 6*TILE, y: 3*TILE-16, w: 44, h: 80 },
      { key: 'tree2', x: 14*TILE, y: 20*TILE-16, w: 44, h: 80 },
      { key: 'bush',  x: 10*TILE+8, y: 20*TILE, w: 40, h: 28 },
      { key: 'bush',  x: 3*TILE+8,  y: 22*TILE, w: 40, h: 28 },
      { key: 'grass1', x: 7*TILE,   y: 16*TILE, w: 32, h: 24 },
      { key: 'grass2', x: 20*TILE,  y: 19*TILE, w: 32, h: 24 },
    ],
    cave: [
      { key: 'skull',  x:  6*TILE+8, y:  8*TILE+4,  w: 28, h: 24 },
      { key: 'bone',   x: 14*TILE+4, y: 10*TILE+8,  w: 36, h: 20 },
      { key: 'barrel', x:  3*TILE+4, y: 14*TILE+4,  w: 28, h: 36 },
      { key: 'ladder', x: 12*TILE+4, y: 22*TILE-8,  w: 28, h: 52 },
      { key: 'chest',  x: 18*TILE+4, y: 22*TILE+4,  w: 44, h: 36 },
    ],
    mountaintop: [
      { key: 'rock1', x:  3*TILE+4, y:  6*TILE+4, w: 40, h: 32 },
      { key: 'rock2', x: 18*TILE,   y:  3*TILE,   w: 44, h: 36 },
      { key: 'rock3', x: 10*TILE+4, y: 22*TILE+4, w: 36, h: 28 },
    ],
    docks: [
      { key: 'barrel',     x:  8*TILE+4, y:  5*TILE+4, w: 28, h: 36 },
      { key: 'crate1',     x: 16*TILE,   y:  9*TILE,   w: 36, h: 32 },
      { key: 'waterTrough',x:  5*TILE,   y: 12*TILE,   w: 40, h: 32 },
      { key: 'sign1',      x: 12*TILE,   y: 16*TILE-8, w: 32, h: 40 },
    ],
    battlefield: [
      { key: 'grave1', x:  4*TILE+8, y:  6*TILE,   w: 32, h: 44 },
      { key: 'grave2', x: 16*TILE,   y:  9*TILE,   w: 32, h: 44 },
      { key: 'grave3', x:  8*TILE+4, y: 17*TILE,   w: 32, h: 44 },
      { key: 'grave1', x: 19*TILE,   y: 22*TILE,   w: 32, h: 44 },
      { key: 'skull',  x: 12*TILE+8, y: 13*TILE+8, w: 28, h: 24 },
      { key: 'bone',   x:  6*TILE,   y: 21*TILE+8, w: 36, h: 20 },
      { key: 'bone',   x: 14*TILE+8, y:  4*TILE+8, w: 36, h: 20 },
    ],
    secretGarden: [
      { key: 'tree2', x:  5*TILE-4,  y:  4*TILE-16, w: 44, h: 80 },
      { key: 'tree2', x: 16*TILE,    y:  4*TILE-16, w: 44, h: 80 },
      { key: 'bush',  x:  9*TILE+8,  y: 10*TILE+4,  w: 40, h: 28 },
      { key: 'grass1',x:  4*TILE,    y: 18*TILE+4,  w: 32, h: 24 },
      { key: 'grass2',x: 18*TILE+8,  y: 21*TILE,    w: 32, h: 24 },
    ],
    oasis: [
      { key: 'cactus1', x:  3*TILE+4,  y:  4*TILE,    w: 32, h: 52 },
      { key: 'cactus2', x: 19*TILE,    y:  7*TILE,    w: 28, h: 56 },
      { key: 'cactus3', x:  6*TILE+4,  y: 21*TILE,    w: 36, h: 48 },
      { key: 'cactus1', x: 16*TILE+8,  y: 24*TILE,    w: 32, h: 52 },
      { key: 'barrel',  x: 11*TILE+4,  y:  8*TILE+4,  w: 28, h: 36 },
    ],
    abandonedTown: [
      { key: 'barrel',  x:  9*TILE+4, y: 10*TILE+4, w: 28, h: 36 },
      { key: 'crate1',  x: 17*TILE,   y:  4*TILE+4, w: 36, h: 32 },
      { key: 'sign1',   x:  5*TILE,   y:  5*TILE-8, w: 32, h: 40 },
    ],
    abyss: [
      { key: 'skull',  x:  6*TILE+8, y:  6*TILE+4,  w: 28, h: 24 },
      { key: 'bone',   x: 16*TILE,   y:  9*TILE+8,  w: 36, h: 20 },
      { key: 'ladder', x: 12*TILE+4, y:  2*TILE,    w: 28, h: 52 },
      { key: 'chest',  x:  4*TILE+4, y: 22*TILE+4,  w: 44, h: 36 },
      { key: 'chest',  x: 17*TILE+4, y: 22*TILE+4,  w: 44, h: 36 },
    ],
  };

  // ============ 渲染瓦片 ============
  function drawTile(x, y, type) {
    const ts = sprites.tileset;
    if (ts && ts.complete && ts.naturalWidth > 0) {
      // 从 tileset 取对应列 (列序与 T 常量顺序一致)
      ctx.drawImage(ts, type * TILE, 0, TILE, TILE, x, y, TILE, TILE);
      // 水面动态涟漪叠加
      if (type === T.WATER) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        const t = performance.now() / 600;
        const off = Math.sin(t + (x + y) * 0.05) * 1.5;
        ctx.fillRect(x + 4 + off,  y + 10, 8, 2);
        ctx.fillRect(x + 18 - off, y + 22, 8, 2);
      }
    } else {
      // 降级：程序化绘制
      ctx.fillStyle = TILE_COLORS[type] || '#000';
      ctx.fillRect(x, y, TILE, TILE);
      if (type === T.WATER) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        const t = performance.now() / 600;
        const off = Math.sin(t + (x + y) * 0.05) * 1.5;
        ctx.fillRect(x + 4 + off,  y + 10, 8, 2);
        ctx.fillRect(x + 18 - off, y + 22, 8, 2);
      }
    }
  }

  function drawScene(scene) {
    const map = scene.map;
    const tx0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    const ty0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const tx1 = Math.min(MAP_COLS - 1, Math.ceil((cam.x + VIEW_W) / TILE) + 1);
    const ty1 = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + VIEW_H) / TILE) + 1);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        drawTile(tx * TILE, ty * TILE, map[ty][tx]);
      }
    }
    // 道具精灵 (叠加在瓦片上)
    const props = SCENE_PROPS[currentKey];
    if (props) {
      for (const p of props) {
        if (p.x + p.w < cam.x || p.x > cam.x + VIEW_W) continue;
        if (p.y + p.h < cam.y || p.y > cam.y + VIEW_H) continue;
        const img = sprites[p.key];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, p.x, p.y, p.w, p.h);
        }
      }
    }
  }

  function drawPortals(scene) {
    const t = performance.now() / 400;
    for (const p of scene.portals) {
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      if (cx + 60 < cam.x || cx - 60 > cam.x + VIEW_W) continue;
      if (cy + 60 < cam.y || cy - 60 > cam.y + VIEW_H) continue;
      const radius = 11 + Math.sin(t) * 2;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
      grad.addColorStop(0, 'rgba(255, 240, 150, 0.9)');
      grad.addColorStop(0.5, 'rgba(255, 200, 80, 0.5)');
      grad.addColorStop(1, 'rgba(255, 200, 80, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.font = '10px sans-serif';
      const tw = ctx.measureText('→ ' + p.label).width + 8;
      UI.roundRect(ctx, cx - tw / 2, cy - radius - 18, tw, 14, 4); ctx.fill();
      ctx.fillStyle = '#ffd866';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('→ ' + p.label, cx, cy - radius - 11);
    }
  }

  function drawEntities(scene, sceneState) {
    const all = [];
    all.push({ y: player.y + player.h, draw: () => player.draw(ctx) });
    for (const npc of sceneState.npcs) {
      if (npc.x + 32 < cam.x || npc.x - 32 > cam.x + VIEW_W) continue;
      if (npc.y + 32 < cam.y || npc.y - 32 > cam.y + VIEW_H) continue;
      all.push({ y: npc.y + npc.h, draw: () => npc.draw(ctx) });
    }
    for (const m of sceneState.monsters) {
      if (m.defeated) continue;
      if (m.x + 32 < cam.x || m.x - 32 > cam.x + VIEW_W) continue;
      if (m.y + 32 < cam.y || m.y - 32 > cam.y + VIEW_H) continue;
      all.push({ y: m.y + m.h, draw: () => m.draw(ctx) });
    }
    all.sort((a, b) => a.y - b.y);
    for (const it of all) it.draw();
  }

  // ============ 进入 inventory 状态 ============
  const INV_VISIBLE_ROWS = 4;
  const INV_COLS = 4;
  const INV_MAX_ROWS = Math.ceil(100 / INV_COLS); // 25

  function openInventory() {
    state = 'inventory';
    inventoryView = { selected: null, scrollRow: 0 };
    Input.setHotspots([]);
  }
  function closeInventory() {
    state = 'explore';
    inventoryView = { selected: null, scrollRow: 0 };
    Input.setHotspots([]);
    save();
  }

  function invScroll(delta) {
    const maxScroll = INV_MAX_ROWS - INV_VISIBLE_ROWS;
    inventoryView.scrollRow = Math.max(0, Math.min(maxScroll, (inventoryView.scrollRow || 0) + delta));
  }

  // ============ 任务日志 ============
  function openQuestLog() {
    state = 'quest';
    Input.setHotspots([]);
  }
  function closeQuestLog() {
    state = 'explore';
    Input.setHotspots([]);
  }

  // ============ 主循环 ============
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (state === 'loading') {
      // 不动
    } else if (state === 'title') {
      titleTime += dt;
    } else if (state === 'explore') {
      if (!transition) {
        player.update(dt, Scenes[currentKey]);
        if (Input.consumeAction()) {
          const npc = nearestNpc();
          if (npc) startDialogue(npc);
        }
        checkPortal();
        checkMonsterContact();
      }
      for (const npc of curScene().npcs) npc.update(dt, player);
      for (const m of curScene().monsters) m.update(dt);
      updateCamera(false);
      if (monsterCooldown > 0) monsterCooldown -= dt;
      // 自动存档每 30s 一次
      autoSaveTimer += dt;
      if (autoSaveTimer >= 30) { autoSaveTimer = 0; save(); }
    } else if (state === 'dialogue') {
      if (Input.consumeAction()) advanceDialogue();
    } else if (state === 'battle') {
      battle.update(dt);
    } else if (state === 'inventory' || state === 'shop' || state === 'teleport') {
      // 静止状态; 由 hotspot 处理交互
    }

    if (transition) {
      transition.progress += dt * 1.6;
      if (transition.phase === 'out' && transition.progress >= 1) {
        switchScene(transition.target, transition.spawn);
        transition.phase = 'card'; transition.progress = 0;
      } else if (transition.phase === 'card' && transition.progress >= 1.4) {
        transition.phase = 'in'; transition.progress = 0;
      } else if (transition.phase === 'in' && transition.progress >= 1) {
        transition = null;
      }
    }

    if (bannerTimer > 0) {
      bannerTimer -= dt;
      if (bannerTimer <= 0) bannerText = null;
    }

    // ============ 渲染 ============
    if (state === 'loading') {
      UI.drawLoading(ctx, loadCount / (ASSETS.length + SPRITES.length));
    } else if (state === 'title') {
      UI.drawTitle(ctx, titleTime);
      const hasSave = !!loadSave();
      const hotspots = [];
      // 主按钮 - 新游戏 (重置成初始状态 + 装备一套新手装)
      hotspots.push({
        id: 'title-start',
        cx: VIEW_W / 2, cy: VIEW_H - 200,
        w: 200, h: 50,
        onPress: () => {
          // 重置玩家状态
          player.applySave({});
          questManager.reset();
          if (player.inventory.length === 0 && !player.equipped.weapon) {
            player.addItem('wood_sword'); player.equip(0);
            player.addItem('cloth_robe'); player.equip(0);
          }
          // 重置场景状态 (不删存档, 下次保存自然覆盖)
          for (const k of Object.keys(sceneStates)) {
            for (const m of sceneStates[k].monsters) m.defeated = false;
            for (const n of sceneStates[k].npcs) n.talked = false;
          }
          currentKey = 'village';
          const s = Scenes.village;
          player.x = s.spawn.x; player.y = s.spawn.y;
          state = 'explore';
          showBanner('· ' + Scenes[currentKey].name + ' ·', 1500);
          updateCamera(true);
        },
      });
      if (hasSave) {
        // 继续按钮
        hotspots.push({
          id: 'title-continue',
          cx: VIEW_W / 2, cy: VIEW_H - 145,
          w: 200, h: 50,
          onPress: () => {
            const s = loadSave();
            if (applySave(s)) {
              state = 'explore';
              updateCamera(true);
              showBanner('· ' + Scenes[currentKey].name + ' ·', 1500);
            }
          },
        });
        // 重置存档按钮
        hotspots.push({
          id: 'title-reset',
          cx: VIEW_W / 2, cy: 20,
          w: 100, h: 24,
          onPress: () => {
            if (window.confirm && !window.confirm('确认重置存档?')) return;
            deleteSave();
            // 重置游戏内存
            currentKey = 'village';
            player.applySave({});
            questManager.reset();
            for (const k of Object.keys(sceneStates)) {
              for (const m of sceneStates[k].monsters) m.defeated = false;
              for (const n of sceneStates[k].npcs) n.talked = false;
            }
            const s = Scenes.village;
            player.x = s.spawn.x; player.y = s.spawn.y;
            showBanner('存档已重置', 1500);
          },
        });
      }
      Input.setHotspots(hotspots);
      // 画 UI 上的额外按钮 (在 drawTitle 之后)
      drawTitleButtons(hasSave);
    } else if (state === 'battle' && battle) {
      UI.drawBattle(ctx, battle);
    } else if (state === 'quest') {
      const ui = UI.drawQuestLog(ctx, questManager);
      Input.setHotspots([{
        id: 'quest-close',
        cx: ui.closeBtn.cx, cy: ui.closeBtn.cy,
        w: ui.closeBtn.r * 2, h: ui.closeBtn.r * 2,
        onPress: () => closeQuestLog(),
      }]);
    } else if (state === 'inventory') {
      const ui = UI.drawInventory(ctx, player, inventoryView);
      const hotspots = [];
      // 关闭
      hotspots.push({
        id: 'inv-close',
        cx: ui.closeBtn.cx, cy: ui.closeBtn.cy,
        w: ui.closeBtn.r * 2, h: ui.closeBtn.r * 2,
        onPress: () => closeInventory(),
      });
      // 装备槽
      for (const eh of ui.eqHotspots) {
        hotspots.push({
          id: eh.id, cx: eh.cx, cy: eh.cy, w: eh.w, h: eh.h,
          onPress: () => {
            const id = player.equipped[eh.slot];
            if (id) inventoryView.selected = { type: 'eq', slot: eh.slot };
            else inventoryView.selected = null;
          },
        });
      }
      // 背包格子
      for (const ih of ui.invHotspots) {
        hotspots.push({
          id: ih.id, cx: ih.cx, cy: ih.cy, w: ih.w, h: ih.h,
          onPress: () => {
            const id = player.inventory[ih.idx];
            if (id) inventoryView.selected = { type: 'inv', idx: ih.idx };
            else inventoryView.selected = null;
          },
        });
      }
      // 操作按钮
      for (const ah of ui.actionHotspots) {
        hotspots.push({
          id: ah.id, cx: ah.cx, cy: ah.cy, w: ah.w, h: ah.h,
          onPress: () => {
            if (ah.id === 'inv-equip' && inventoryView.selected?.type === 'inv') {
              player.equip(inventoryView.selected.idx);
              inventoryView.selected = null;
              save();
            } else if (ah.id === 'inv-use' && inventoryView.selected?.type === 'inv') {
              const used = player.useItem(inventoryView.selected.idx);
              if (used) {
                const eff = used.effect || {};
                inventoryView.selected = null;
                if (eff.recall) {
                  state = 'explore';
                  const CARD_KEYS = {
                    village:'cardVillage', forest:'cardForest', cave:'cardCave',
                    mountaintop:'cardMountaintop', docks:'cardDocks', battlefield:'cardBattlefield',
                    secretGarden:'cardForest', oasis:'cardOasis', abandonedTown:'cardAbandonedTown',
                    abyss:'cardAbyss', cloudPalace:'cardMountaintop', underwaterTemple:'cardDocks',
                    volcanoCrater:'cardBattlefield', undergroundLake:'cardCave',
                    ancientLibrary:'cardAbandonedTown', mirageCity:'cardOasis',
                    ancientForest:'cardForest', spiritRealm:'cardAbyss',
                    frozenPeak:'cardMountaintop', finalShrine:'cardAbyss',
                  };
                  const villageScene = Scenes['village'];
                  transition = {
                    progress: 0, phase: 'out',
                    target: 'village', spawn: villageScene.spawn,
                    card: assets[CARD_KEYS['village']] || null,
                    targetName: villageScene.name,
                  };
                } else {
                  showBanner(
                    `使用 [${used.name}]` +
                    (eff.hp ? `  +${eff.hp} HP` : '') +
                    (eff.mp ? `  +${eff.mp} MP` : '') +
                    (eff.speedBuff ? `  速度×${eff.speedBuff} (${eff.duration/60}分钟)` : '') +
                    (eff.atkBuff ? `  攻击+${eff.atkBuff} (${eff.duration/60}分钟)` : ''),
                    1600);
                }
                save();
              }
            } else if (ah.id === 'inv-drop' && inventoryView.selected?.type === 'inv') {
              player.dropItem(inventoryView.selected.idx);
              inventoryView.selected = null;
              save();
            } else if (ah.id === 'eq-unequip' && inventoryView.selected?.type === 'eq') {
              player.unequip(inventoryView.selected.slot);
              inventoryView.selected = null;
              save();
            }
          },
        });
      }
      // 滚动按钮
      if (ui.scrollUp) hotspots.push({ id: 'inv-up', ...ui.scrollUp, onPress: () => invScroll(-1) });
      if (ui.scrollDn) hotspots.push({ id: 'inv-dn', ...ui.scrollDn, onPress: () => invScroll(1) });
      Input.setHotspots(hotspots);

    } else if (state === 'shop' && shop) {
      ctx.fillStyle = '#0a0807';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const ui = UI.drawShop(ctx, player, shop, SHOP_CATALOG);
      const hotspots = [];
      hotspots.push({ id: 'shop-close', cx: ui.closeBtn.cx, cy: ui.closeBtn.cy,
        w: ui.closeBtn.r * 2, h: ui.closeBtn.r * 2,
        onPress: () => { shop = null; state = 'explore'; } });
      for (const th of ui.tabHotspots) {
        hotspots.push({ id: 'shop-tab-' + th.key, cx: th.cx, cy: th.cy, w: th.w, h: th.h,
          onPress: () => { shop.tab = th.key; shop.scroll = 0; shop.selected = null; } });
      }
      for (const ih of ui.itemHotspots) {
        hotspots.push({ id: 'shop-item-' + ih.idx, cx: ih.cx, cy: ih.cy, w: ih.w, h: ih.h,
          onPress: () => { shop.selected = (shop.selected === ih.idx ? null : ih.idx); } });
      }
      for (const ah of ui.actionHotspots) {
        if (ah.id === 'shop-buy') {
          hotspots.push({ id: 'shop-buy', cx: ah.cx, cy: ah.cy, w: ah.w, h: ah.h,
            onPress: () => {
              if (shop.selected == null) return;
              const id = SHOP_CATALOG[shop.tab][shop.selected];
              const item = Items[id];
              if (!item) return;
              const price = item.value || 0;
              if (player.gold < price) { showBanner('金币不足!', 1000); return; }
              if (!player.addItem(id)) { showBanner('背包已满!', 1000); return; }
              player.gold -= price;
              showBanner(`购得 [${item.name}]`, 1000);
              save();
            },
          });
        }
      }
      if (ui.scrollUp) hotspots.push({ id: 'shop-up', ...ui.scrollUp,
        onPress: () => { if (shop.scroll > 0) shop.scroll--; } });
      if (ui.scrollDn) hotspots.push({ id: 'shop-dn', ...ui.scrollDn,
        onPress: () => { shop.scroll++; } });
      Input.setHotspots(hotspots);

    } else if (state === 'teleport' && teleportState) {
      ctx.fillStyle = '#0a0807';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const ui = UI.drawTeleport(ctx, teleportState, TELEPORT_LIST);
      const hotspots = [];
      hotspots.push({ id: 'tp-close', cx: ui.closeBtn.cx, cy: ui.closeBtn.cy,
        w: ui.closeBtn.r * 2, h: ui.closeBtn.r * 2,
        onPress: () => { teleportState = null; state = 'explore'; } });
      for (const rh of ui.rowHotspots) {
        hotspots.push({ id: 'tp-' + rh.key, cx: rh.cx, cy: rh.cy, w: rh.w, h: rh.h,
          onPress: () => {
            teleportState = null;
            state = 'explore';
            const targetScene = Scenes[rh.key];
            if (!targetScene) return;
            const CARD_KEYS = {
              village:'cardVillage', forest:'cardForest', cave:'cardCave',
              mountaintop:'cardMountaintop', docks:'cardDocks', battlefield:'cardBattlefield',
              secretGarden:'cardForest', oasis:'cardOasis', abandonedTown:'cardAbandonedTown',
              abyss:'cardAbyss', cloudPalace:'cardMountaintop', underwaterTemple:'cardDocks',
              volcanoCrater:'cardBattlefield', undergroundLake:'cardCave',
              ancientLibrary:'cardAbandonedTown', mirageCity:'cardOasis',
              ancientForest:'cardForest', spiritRealm:'cardAbyss',
              frozenPeak:'cardMountaintop', finalShrine:'cardAbyss',
            };
            transition = {
              progress: 0, phase: 'out',
              target: rh.key, spawn: targetScene.spawn,
              card: assets[CARD_KEYS[rh.key]] || null,
              targetName: targetScene.name,
            };
            Input.setHotspots([]);
          },
        });
      }
      if (ui.scrollUp) hotspots.push({ id: 'tp-up', ...ui.scrollUp,
        onPress: () => { if (teleportState.scroll > 0) teleportState.scroll--; } });
      if (ui.scrollDn) hotspots.push({ id: 'tp-dn', ...ui.scrollDn,
        onPress: () => { teleportState.scroll++; } });
      Input.setHotspots(hotspots);

    } else {
      // 探索 / 对话: 画世界 + UI
      const scene = Scenes[currentKey];
      ctx.fillStyle = scene.bg;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // 视差背景图 (屏幕空间, 在世界坐标之前)
      if (scene.bgKey && sprites[scene.bgKey] && sprites[scene.bgKey].complete && sprites[scene.bgKey].naturalWidth > 0) {
        const bg = sprites[scene.bgKey];
        const bw = VIEW_W, bh = Math.round(VIEW_W * bg.naturalHeight / bg.naturalWidth);
        const bx = 0;
        const by = Math.round(-cam.y * 0.12) % bh;
        ctx.globalAlpha = 0.55;
        ctx.drawImage(bg, bx, by, bw, bh);
        if (by + bh < VIEW_H) ctx.drawImage(bg, bx, by + bh, bw, bh);
        ctx.globalAlpha = 1;
      }

      ctx.save();
      ctx.translate(-Math.floor(cam.x), -Math.floor(cam.y));
      drawScene(scene);
      drawPortals(scene);
      drawEntities(scene, curScene());
      ctx.restore();

      if (state === 'explore') {
        const npc = nearestNpc();
        if (npc) UI.drawInteractHint(ctx, npc, Math.floor(cam.x), Math.floor(cam.y));
      }

      UI.drawExploreHud(ctx, player, scene.name);

      // 探索状态额外画"包"+"务"按钮 + 触屏控件
      let extraHotspots = [];
      if (state === 'explore' && !transition) {
        ctx.globalAlpha = 0.55;
        UI.drawTouchControls(ctx);
        ctx.globalAlpha = 1;
        const bagBtn = UI.drawBagButton(ctx);
        extraHotspots.push({
          id: 'open-inv', cx: bagBtn.cx, cy: bagBtn.cy,
          w: bagBtn.r * 2, h: bagBtn.r * 2,
          onPress: () => openInventory(),
        });
        const questBtn = UI.drawQuestButton(ctx, questManager.hasReady());
        extraHotspots.push({
          id: 'open-quest', cx: questBtn.cx, cy: questBtn.cy,
          w: questBtn.r * 2, h: questBtn.r * 2,
          onPress: () => openQuestLog(),
        });
      }

      if (state === 'dialogue' && dialogue) {
        UI.drawDialogue(ctx, dialogue);
        Input.setHotspots([{
          id: 'dlg-next', cx: VIEW_W / 2, cy: VIEW_H - 100,
          w: VIEW_W, h: 240, onPress: () => advanceDialogue(),
        }]);
      } else if (state === 'explore' && !transition) {
        Input.setHotspots(extraHotspots);
      }

      if (transition) {
        let alpha = 1;
        if (transition.phase === 'out') {
          alpha = transition.progress;
          ctx.fillStyle = `rgba(0,0,0,${alpha})`;
          ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        } else if (transition.phase === 'card') {
          const p = transition.progress;
          const cardA = p < 0.3 ? p / 0.3 : (p > 1.1 ? Math.max(0, 1 - (p - 1.1) / 0.3) : 1);
          UI.drawSceneCard(ctx, transition.targetName, cardA, transition.card);
        } else if (transition.phase === 'in') {
          alpha = 1 - transition.progress;
          ctx.fillStyle = `rgba(0,0,0,${alpha})`;
          ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        }
      }
    }

    // 居中横幅
    if (bannerText) {
      const alpha = Math.min(1, bannerTimer * 2);
      const lines = bannerText.split('\n');
      const blockH = 60 + lines.length * 14;
      ctx.fillStyle = `rgba(0, 0, 0, ${0.65 * alpha})`;
      ctx.fillRect(0, VIEW_H / 2 - blockH / 2, VIEW_W, blockH);
      ctx.fillStyle = `rgba(172, 50, 38, ${alpha})`;
      ctx.fillRect(0, VIEW_H / 2 - blockH / 2 - 2, VIEW_W, 2);
      ctx.fillRect(0, VIEW_H / 2 + blockH / 2, VIEW_W, 2);
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let by = VIEW_H / 2 - (lines.length - 1) * 7;
      for (const line of lines) {
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillText(line, VIEW_W / 2 + 2, by + 2);
        ctx.fillStyle = `rgba(236, 223, 200, ${alpha})`;
        ctx.fillText(line, VIEW_W / 2, by);
        by += 32;
        ctx.font = 'bold 16px "PingFang SC", sans-serif'; // 第二行起小一点
      }
    }

    requestAnimationFrame(loop);
  }

  // 标题屏的两个按钮 (新游戏 / 继续 / 重置)
  function drawTitleButtons(hasSave) {
    // 重置(右上, 仅当有存档)
    if (hasSave) {
      const rx = VIEW_W / 2 - 50, ry = 8, rw = 100, rh = 24;
      ctx.fillStyle = 'rgba(58, 44, 32, 0.85)';
      UI.roundRect(ctx, rx, ry, rw, rh, 6); ctx.fill();
      ctx.strokeStyle = UI.C.gold;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = UI.C.textSoft;
      ctx.font = '11px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('重置存档', rx + rw / 2, ry + rh / 2 + 1);
    }

    // 主按钮: 新游戏 (始终在). 大的朱砂按钮
    const sx = VIEW_W / 2 - 100, sy = VIEW_H - 225, sw = 200, sh = 50;
    const grad = ctx.createLinearGradient(0, sy, 0, sy + sh);
    grad.addColorStop(0, '#d04a3a');
    grad.addColorStop(1, '#7c2018');
    ctx.fillStyle = grad;
    UI.roundRect(ctx, sx, sy, sw, sh, 10); ctx.fill();
    ctx.strokeStyle = UI.C.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = UI.C.text;
    ctx.font = 'bold 18px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hasSave ? '新游戏' : '点击开始', sx + sw / 2, sy + sh / 2 + 1);

    // 继续按钮 (有存档时)
    if (hasSave) {
      const cx = VIEW_W / 2 - 100, cy = VIEW_H - 170, cw = 200, ch = 50;
      const g2 = ctx.createLinearGradient(0, cy, 0, cy + ch);
      g2.addColorStop(0, '#5a4838');
      g2.addColorStop(1, '#2a1f15');
      ctx.fillStyle = g2;
      UI.roundRect(ctx, cx, cy, cw, ch, 10); ctx.fill();
      ctx.strokeStyle = UI.C.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = UI.C.text;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText('继续游戏', cx + cw / 2, cy + ch / 2 + 1);
    }
  }

  // ============ 启动 ============
  preload(() => {
    UI.setLogo(assets.logo);
    UI.setBattleBg(assets.battleBg);
    state = 'title';
    titleTime = 0;
  });

  // 给玩家送一把入门木剑 + 布衣 (新存档专属)
  if (!loadSave()) {
    player.addItem('wood_sword');
    player.equip(0);
    player.addItem('cloth_robe');
    player.equip(0);
  }

  // 桌面鼠标滚轮滚动背包
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (state === 'inventory') invScroll(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  requestAnimationFrame((t) => { last = t; loop(t); });
})();
