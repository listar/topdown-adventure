// NPC 与怪物的运行时实例
// scene.npcs 和 scene.monsters 里的数据被实例化成这些对象, 方便绘制和交互

const NpcStyles = {
  elder:    { body: '#7a5a8a', skin: '#f0c89b', hair: '#dddddd', hat: '#5a3a8a' },
  merchant: { body: '#4a6a8a', skin: '#f0c89b', hair: '#3a2412', hat: '#2a3a5a' },
  child:    { body: '#e8a0c0', skin: '#f0c89b', hair: '#3a2412', hat: null },
  wanderer: { body: '#cccccc', skin: '#f0c89b', hair: '#3a2412', hat: '#666666' },
  mystic:   { body: '#3a4a6a', skin: '#f0c89b', hair: '#cccccc', hat: '#3a2a5a' },
};

class Npc {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.spriteKey = data.sprite || 'elder';
    this.x = data.x;
    this.y = data.y;
    this.w = 22;
    this.h = 22;
    this.lines = data.lines || [];
    this.onClose = data.onClose || null; // 'battle' | 'heal' | null
    this.battle = data.battle || null;   // 怪物模板 key
    this.questId = data.questId || null; // 关联任务 id
    this.type = data.type || null;       // 特殊类型: 'shop' | 'teleporter' | null
    this.dir = 'down';
    this.bobTime = Math.random() * 10;   // 站立呼吸动画相位
    this.talked = false;
  }

  update(dt, player) {
    this.bobTime += dt;
    // 头朝向玩家
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = dx < 0 ? 'left' : 'right';
    } else {
      this.dir = dy < 0 ? 'up' : 'down';
    }
  }

  draw(ctx) {
    const style = NpcStyles[this.spriteKey] || NpcStyles.elder;
    const animTime = this.bobTime;
    drawHumanoid(ctx, this.x, this.y, this.w, this.h, {
      bodyColor: style.body, skinColor: style.skin,
      hairColor: style.hair, hatColor: style.hat,
      dir: this.dir, animTime, moving: true,
    });

    const cx = this.x + this.w / 2;

    // 头顶名字标签
    ctx.save();
    ctx.font = 'bold 10px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameW = ctx.measureText(this.name).width + 10;
    const tagY = this.y - 18;
    const tx = cx - nameW / 2, tr = 3;
    ctx.fillStyle = 'rgba(10, 8, 7, 0.82)';
    ctx.beginPath();
    ctx.moveTo(tx + tr, tagY - 7);
    ctx.arcTo(tx + nameW, tagY - 7,  tx + nameW, tagY + 7,  tr);
    ctx.arcTo(tx + nameW, tagY + 7,  tx,         tagY + 7,  tr);
    ctx.arcTo(tx,         tagY + 7,  tx,         tagY - 7,  tr);
    ctx.arcTo(tx,         tagY - 7,  tx + nameW, tagY - 7,  tr);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(252, 211, 77, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(this.name, cx, tagY);
    ctx.restore();

    // 未对话时的感叹号 (名字标签上方)
    if (!this.talked) {
      const t = performance.now() / 200;
      const offset = Math.sin(t) * 1.5;
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', cx, this.y - 30 + offset);
    }
  }

  // 玩家中心是否在交互距离内
  canInteract(player) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy < 36 * 36;
  }
}

class Monster {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.x = data.x;
    this.y = data.y;
    this.w = 22;
    this.h = 22;
    this.isBoss = !!data.isBoss;
    this.bobTime = Math.random() * 10;
    this.defeated = false;
  }

  update(dt) { this.bobTime += dt; }

  draw(ctx) {
    if (this.defeated) return;
    const tpl = MonsterTemplates[this.type];
    const c = tpl ? tpl.color : '#888';

    // 影子
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.w / 2, this.y + this.h - 1, this.w * 0.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = Math.sin(this.bobTime * 4) * 1.5;

    if (this.type === 'slime') {
      // 半圆果冻
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, this.y + this.h - 4 + bob, this.w / 2, 10, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(this.x + 6, this.y + 10 + bob, 2, 2);
      ctx.fillRect(this.x + this.w - 8, this.y + 10 + bob, 2, 2);
    } else if (this.type === 'bat') {
      // 蝙蝠 (有翅膀)
      const wing = Math.sin(this.bobTime * 12) * 4;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y + 10 + bob);
      ctx.lineTo(this.x - 4, this.y + 6 + bob - wing);
      ctx.lineTo(this.x + 2, this.y + 12 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y + 10 + bob);
      ctx.lineTo(this.x + this.w + 4, this.y + 6 + bob - wing);
      ctx.lineTo(this.x + this.w - 2, this.y + 12 + bob);
      ctx.closePath();
      ctx.fill();
      // 身体
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, this.y + 12 + bob, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // 眼睛
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(this.x + this.w / 2 - 3, this.y + 9 + bob, 2, 2);
      ctx.fillRect(this.x + this.w / 2 + 1, this.y + 9 + bob, 2, 2);
    } else if (this.type === 'guardian' || this.type === 'demon_lord' || this.isBoss) {
      // BOSS - 大方块加王冠
      ctx.fillStyle = c;
      ctx.fillRect(this.x - 2, this.y + 4 + bob, this.w + 4, this.h - 4);
      ctx.fillStyle = this.type === 'demon_lord' ? '#ff4444' : '#ffd866';
      ctx.beginPath();
      ctx.moveTo(this.x + 2,  this.y + 4 + bob);
      ctx.lineTo(this.x + 6,  this.y - 2 + bob);
      ctx.lineTo(this.x + this.w / 2, this.y + 2 + bob);
      ctx.lineTo(this.x + this.w - 6, this.y - 2 + bob);
      ctx.lineTo(this.x + this.w - 2, this.y + 4 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = this.type === 'demon_lord' ? '#ff8800' : '#ffff80';
      ctx.fillRect(this.x + 4,  this.y + 10 + bob, 4, 4);
      ctx.fillRect(this.x + this.w - 8, this.y + 10 + bob, 4, 4);
    } else if (this.type === 'eagle' || this.type === 'wind_sprite') {
      // 飞行系 - 菱形身体 + 翅膀
      const wing = Math.sin(this.bobTime * 10) * 5;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y + 4 + bob);
      ctx.lineTo(this.x - 5, this.y + 10 + bob - wing);
      ctx.lineTo(this.x + 2, this.y + 14 + bob);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y + 4 + bob);
      ctx.lineTo(this.x + this.w + 5, this.y + 10 + bob - wing);
      ctx.lineTo(this.x + this.w - 2, this.y + 14 + bob);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, this.y + 11 + bob, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + this.w / 2 - 3, this.y + 8 + bob, 2, 2);
      ctx.fillRect(this.x + this.w / 2 + 1, this.y + 8 + bob, 2, 2);
    } else if (this.type === 'skeleton' || this.type === 'ghost_knight') {
      // 骷髅 - 白色小人
      drawHumanoid(ctx, this.x, this.y, this.w, this.h, {
        bodyColor: c, skinColor: '#ddd8cc', hairColor: '#888880',
        hatColor: this.type === 'ghost_knight' ? c : null,
        dir: 'down', animTime: this.bobTime, moving: true,
      });
    } else if (this.type === 'demon' || this.type === 'shadow_beast') {
      // 恶魔 - 深色大方块 + 红眼
      const sz = this.type === 'shadow_beast' ? 2 : 0;
      ctx.fillStyle = c;
      ctx.fillRect(this.x - sz, this.y + 2 + bob, this.w + sz * 2, this.h - 2);
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(this.x + 4,  this.y + 8 + bob, 4, 3);
      ctx.fillRect(this.x + this.w - 8, this.y + 8 + bob, 4, 3);
    } else if (this.type === 'zombie') {
      drawHumanoid(ctx, this.x, this.y, this.w, this.h, {
        bodyColor: c, skinColor: '#8aaa6a', hairColor: '#556644',
        hatColor: null, dir: 'down', animTime: this.bobTime, moving: true,
      });
    } else if (this.type === 'fairy') {
      // 精灵 - 小圆球 + 翅膀
      const wing = Math.sin(this.bobTime * 14) * 3;
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2 - 7, this.y + 8 + bob - wing, 6, 4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2 + 7, this.y + 8 + bob - wing, 6, 4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + 12 + bob, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + this.w / 2 - 2, this.y + 10 + bob, 2, 2);
      ctx.fillRect(this.x + this.w / 2 + 1, this.y + 10 + bob, 2, 2);
    } else {
      // 哥布林等默认小人
      drawHumanoid(ctx, this.x, this.y, this.w, this.h, {
        bodyColor: c, skinColor: '#9adb6d', hairColor: '#3a2412',
        hatColor: null, dir: 'down', animTime: this.bobTime, moving: true,
      });
    }
  }

  canCollide(player) {
    if (this.defeated) return false;
    return rectsOverlap(
      this.x, this.y, this.w, this.h,
      player.x, player.y, player.w, player.h
    );
  }
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
