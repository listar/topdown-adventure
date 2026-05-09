// 玩家角色
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 22;
    this.h = 22;
    this.speed = 130;
    this.dir = 'down';
    this.animTime = 0;
    this.moving = false;

    // ------- RPG 数值 (基础, 不含装备) -------
    this.name = '云逸';
    this.lvl = 1;
    this.exp = 0;
    this.expNext = 30;

    // 基础属性 (升级会涨), 装备加成另算
    this.baseMaxHp = 50;
    this.baseMaxMp = 20;
    this.baseAtk   = 10;
    this.baseDef   = 4;
    this.baseSpd   = 7;

    // 当前血/蓝
    this.hp = this.baseMaxHp;
    this.mp = this.baseMaxMp;
    this.gold = 0;

    // 装备槽 + 背包
    this.equipped = { weapon: null, armor: null, helmet: null, boots: null, ring: null };
    this.inventory = []; // item id 数组, 上限 12

    this.skills = [
      { name: '剑气斩', mpCost: 4, mult: 1.5, desc: '凝聚剑意, 造成 1.5 倍伤害' },
      { name: '回血术', mpCost: 6, mult: 0, heal: 25, desc: '恢复 25 点 HP' },
    ];

    // 临时 buff: [{ type:'atk'|'speed', value, endTime(ms) }]
    this.buffs = [];
  }

  // ----- 计算属性 (基础 + 装备) -----
  // 这些属性是 *动态 getter*, 任何使用 player.atk / player.maxHp 的地方都不需要变
  get maxHp() { return this.baseMaxHp + this._equipBonus('maxHp'); }
  get maxMp() { return this.baseMaxMp + this._equipBonus('maxMp'); }
  get atk()   { return this.baseAtk   + this._equipBonus('atk') + this.getBuff('atk'); }
  get def()   { return this.baseDef   + this._equipBonus('def'); }
  get spd()   { return this.baseSpd   + this._equipBonus('spd'); }

  // 返回某 type 所有有效 buff 的 value 之和 (过期自动忽略)
  getBuff(type) {
    const now = Date.now();
    return this.buffs
      .filter(b => b.type === type && b.endTime > now)
      .reduce((s, b) => s + b.value, 0);
  }

  // 添加/刷新 buff (同类型直接覆盖, 取更长的剩余时间)
  addBuff(type, value, durationSec) {
    const endTime = Date.now() + durationSec * 1000;
    const existing = this.buffs.find(b => b.type === type);
    if (existing) {
      existing.endTime = Math.max(existing.endTime, endTime);
      existing.value = value;
    } else {
      this.buffs.push({ type, value, endTime });
    }
  }

  // 返回指定 buff 的剩余秒数 (不存在或过期返回 0)
  buffRemain(type) {
    const now = Date.now();
    const b = this.buffs.find(b => b.type === type && b.endTime > now);
    return b ? Math.ceil((b.endTime - now) / 1000) : 0;
  }

  _equipBonus(stat) {
    let total = 0;
    for (const slot of Object.keys(this.equipped)) {
      const id = this.equipped[slot];
      if (!id) continue;
      const item = Items[id];
      if (item && item.stats && item.stats[stat]) total += item.stats[stat];
    }
    return total;
  }

  // 汇总所有装备词条, 返回 { critRate, stunRate, lifeSteal, reflect, dodge }
  getAffixes() {
    const aff = { critRate: 0, stunRate: 0, lifeSteal: 0, reflect: 0, dodge: 0 };
    for (const slot of Object.keys(this.equipped)) {
      const id = this.equipped[slot];
      if (!id) continue;
      const item = Items[id];
      if (!item || !item.affixes) continue;
      for (const [k, v] of Object.entries(item.affixes)) {
        if (k in aff) aff[k] += v;
      }
    }
    // 上限保护
    aff.critRate  = Math.min(1.0, aff.critRate);
    aff.stunRate  = Math.min(0.8, aff.stunRate);
    aff.lifeSteal = Math.min(0.5, aff.lifeSteal);
    aff.reflect   = Math.min(0.6, aff.reflect);
    aff.dodge     = Math.min(0.7, aff.dodge);
    return aff;
  }

  // ----- 装备操作 -----
  addItem(itemId) {
    if (!Items[itemId]) return false;
    if (this.inventory.length >= 100) return false;
    this.inventory.push(itemId);
    return true;
  }

  // 装上指定背包槽位的物品. 如果该装备位已有, 旧的进背包
  equip(invIdx) {
    const itemId = this.inventory[invIdx];
    if (!itemId) return false;
    const item = Items[itemId];
    if (!item || item.type === 'quest') return false; // 任务道具不可装备
    const slot = item.slot;
    const oldId = this.equipped[slot];
    // 移除背包里这格
    this.inventory.splice(invIdx, 1);
    this.equipped[slot] = itemId;
    if (oldId) this.inventory.push(oldId);
    // 装备后 hp/mp 不能超过新的上限
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (this.mp > this.maxMp) this.mp = this.maxMp;
    return true;
  }

  unequip(slot) {
    const itemId = this.equipped[slot];
    if (!itemId) return false;
    if (this.inventory.length >= 100) return false;
    this.inventory.push(itemId);
    this.equipped[slot] = null;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (this.mp > this.maxMp) this.mp = this.maxMp;
    return true;
  }

  dropItem(invIdx) {
    if (invIdx < 0 || invIdx >= this.inventory.length) return false;
    this.inventory.splice(invIdx, 1);
    return true;
  }

  // 使用药水/道具, 成功返回 item 定义 (recall 类由调用方处理传送), 失败返回 null
  useItem(invIdx) {
    const id = this.inventory[invIdx];
    if (!id) return null;
    const item = Items[id];
    if (!item || (item.type !== 'potion' && item.type !== 'item')) return null;
    const eff = item.effect || {};
    // 回城卷轴: 先消耗道具, 传送逻辑由 game.js 处理
    if (eff.recall) {
      this.inventory.splice(invIdx, 1);
      return item;
    }
    if (eff.hp) this.hp = Math.min(this.maxHp, this.hp + eff.hp);
    if (eff.mp) this.mp = Math.min(this.maxMp, this.mp + eff.mp);
    if (eff.speedBuff && eff.duration) this.addBuff('speed', eff.speedBuff, eff.duration);
    if (eff.atkBuff   && eff.duration) this.addBuff('atk',   eff.atkBuff,   eff.duration);
    this.inventory.splice(invIdx, 1);
    return item;
  }

  // ----- 等级 / 经验 -----
  recalcExpNext() {
    this.expNext = 30 + (this.lvl - 1) * 25;
  }

  gainExp(amount) {
    this.exp += amount;
    let leveled = 0;
    while (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.lvl += 1;
      this.baseMaxHp += 12;
      this.baseMaxMp += 4;
      this.baseAtk += 3;
      this.baseDef += 2;
      this.baseSpd += 1;
      // 升级满血满蓝 (用新的上限)
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      this.recalcExpNext();
      leveled++;
    }
    return leveled;
  }

  fullHeal() { this.hp = this.maxHp; this.mp = this.maxMp; }

  // ----- 存档 -----
  serialize() {
    return {
      name: this.name, lvl: this.lvl, exp: this.exp, expNext: this.expNext,
      baseMaxHp: this.baseMaxHp, baseMaxMp: this.baseMaxMp,
      baseAtk: this.baseAtk, baseDef: this.baseDef, baseSpd: this.baseSpd,
      hp: this.hp, mp: this.mp, gold: this.gold,
      equipped: { ...this.equipped },
      inventory: [...this.inventory],
    };
  }

  applySave(d) {
    if (!d) return;
    this.name = d.name || this.name;
    this.lvl = d.lvl || 1;
    this.exp = d.exp || 0;
    this.expNext = d.expNext || 30;
    this.baseMaxHp = d.baseMaxHp || 50;
    this.baseMaxMp = d.baseMaxMp || 20;
    this.baseAtk = d.baseAtk || 10;
    this.baseDef = d.baseDef || 4;
    this.baseSpd = d.baseSpd || 7;
    this.hp = d.hp || this.baseMaxHp;
    this.mp = d.mp || this.baseMaxMp;
    this.gold = d.gold || 0;
    this.equipped = Object.assign(
      { weapon: null, armor: null, helmet: null, boots: null, ring: null },
      d.equipped || {}
    );
    this.inventory = (d.inventory || []).filter(id => Items[id]); // 过滤无效 id
  }

  // ----- 移动 -----
  update(dt, scene) {
    const ax = Input.axis();
    this.moving = ax.x !== 0 || ax.y !== 0;

    // 基础速度 × 速度 buff 倍率, 水中再减半
    const speedMult = this.getBuff('speed') || 1;
    const tile = getTileAt(scene, this.x + this.w / 2, this.y + this.h / 2);
    const spd = (tile === T.WATER)
      ? this.speed * speedMult * 0.5
      : this.speed * speedMult;

    if (ax.x !== 0) {
      const nx = this.x + ax.x * spd * dt;
      if (!isBlocked(scene, nx, this.y, this.w, this.h)) this.x = nx;
    }
    if (ax.y !== 0) {
      const ny = this.y + ax.y * spd * dt;
      if (!isBlocked(scene, this.x, ny, this.w, this.h)) this.y = ny;
    }

    if (Math.abs(ax.x) > Math.abs(ax.y)) {
      this.dir = ax.x < 0 ? 'left' : 'right';
    } else if (ax.y !== 0) {
      this.dir = ax.y < 0 ? 'up' : 'down';
    }

    if (this.moving) this.animTime += dt;
  }

  draw(ctx) {
    drawHumanoid(ctx, this.x, this.y, this.w, this.h, {
      bodyColor: '#d24b4b', skinColor: '#f0c89b', hairColor: '#3a2412',
      hatColor: this.equipped.helmet ? '#5b3520' : null,
      dir: this.dir,
      animTime: this.animTime, moving: this.moving,
    });
  }
}

// 通用小人画法
function drawHumanoid(ctx, x, y, w, h, opt) {
  const {
    bodyColor = '#d24b4b',
    skinColor = '#f0c89b',
    hairColor = '#3a2412',
    hatColor = null,
    dir = 'down',
    animTime = 0,
    moving = false,
    cape = null,
  } = opt;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 1, w * 0.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = moving ? Math.sin(animTime * 14) * 1.2 : 0;
  const legSwing = moving ? Math.sin(animTime * 14) * 2.5 : 0;

  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(x + 4,  y + h - 7 + bob, 5, 7 + legSwing);
  ctx.fillRect(x + w - 9, y + h - 7 + bob, 5, 7 - legSwing);

  if (cape) {
    ctx.fillStyle = cape;
    ctx.fillRect(x + 2, y + 9 + bob, w - 4, 9);
  }

  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 3, y + 9 + bob, w - 6, 10);

  ctx.fillStyle = skinColor;
  ctx.fillRect(x + 5, y + 1 + bob, w - 10, 9);

  if (hatColor) {
    ctx.fillStyle = hatColor;
    ctx.fillRect(x + 3, y - 1 + bob, w - 6, 5);
    ctx.fillRect(x + 5, y - 3 + bob, w - 10, 3);
  } else {
    ctx.fillStyle = hairColor;
    ctx.fillRect(x + 5, y + 1 + bob, w - 10, 3);
  }

  ctx.fillStyle = '#000';
  const eyeY = y + 6 + bob;
  if (dir === 'down') {
    ctx.fillRect(x + 7,  eyeY, 2, 2);
    ctx.fillRect(x + w - 9, eyeY, 2, 2);
  } else if (dir === 'left') {
    ctx.fillRect(x + 6, eyeY, 2, 2);
  } else if (dir === 'right') {
    ctx.fillRect(x + w - 8, eyeY, 2, 2);
  }
}
