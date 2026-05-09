// 简易回合制战斗系统
//
// 状态: 'menu' | 'skillList' | 'animating' | 'playerWin' | 'playerLose'
//
// 回合: 玩家选动作 -> 执行 + 动画 -> 敌人选动作 -> 执行 + 动画 -> 回到玩家
// 速度高的先出手 (这里简单比较 spd)

class Battle {
  constructor(player, enemyKey, opts = {}) {
    this.player = player;
    const tpl = MonsterTemplates[enemyKey];
    if (!tpl) throw new Error('Unknown monster: ' + enemyKey);
    this.enemyKey = enemyKey;
    this.enemy = {
      name: tpl.name, color: tpl.color,
      maxHp: tpl.hp, hp: tpl.hp,
      maxMp: tpl.mp, mp: tpl.mp,
      atk: tpl.atk, def: tpl.def, spd: tpl.spd,
      skills: tpl.skills || [],
      expReward: tpl.expReward, goldReward: tpl.goldReward,
      defending: false,
      stunned: false, // 被眩晕时跳过本回合
      shake: 0,
    };
    this.isBoss = !!opts.isBoss;

    this.playerVisual = { shake: 0 };
    this.playerDefending = false;

    this.state = 'menu';        // 当前 UI 状态
    this.log = [];              // 战斗日志, 末尾是最新一条
    this.queue = [];            // 行动队列, 每帧消化
    this.timer = 0;             // 当前队列项的剩余等待秒数

    this.onEnd = opts.onEnd || (() => {});
    this.startTurn();
  }

  pushLog(msg) {
    this.log.push(msg);
    if (this.log.length > 4) this.log.shift();
  }

  // 玩家先 / 敌人先
  startTurn() {
    if (this.player.spd >= this.enemy.spd) {
      this.state = 'menu';
    } else {
      this.state = 'animating';
      this.scheduleEnemyAction();
    }
  }

  // ------- 玩家选项 -------
  pickAttack() {
    if (this.state !== 'menu') return;
    this.state = 'animating';
    const aff = this.player.getAffixes();
    const isCrit = Math.random() < aff.critRate;
    const dmg = computeDamage(this.player.atk, this.enemy.def, isCrit ? 2 : 1, this.enemy.defending);
    this.queue.push({ t: 0.3, action: () => {
      this.pushLog(isCrit ? `${this.player.name} 暴击出击!` : `${this.player.name} 挥剑攻击!`);
    }});
    this.queue.push({ t: 0.5, action: () => {
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this.enemy.shake = 0.4;
      this.pushLog(`对 ${this.enemy.name} 造成 ${dmg} 点伤害${isCrit ? ' ⚡暴击' : ''}`);
      if (aff.lifeSteal > 0) {
        const heal = Math.max(1, Math.round(dmg * aff.lifeSteal));
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.pushLog(`吸血回复 ${heal} HP`);
      }
      if (!this.enemy.stunned && aff.stunRate > 0 && Math.random() < aff.stunRate) {
        this.enemy.stunned = true;
        this.pushLog(`${this.enemy.name} 陷入眩晕!`);
      }
    }});
    this.queue.push({ t: 0.4, action: () => this.afterPlayerAction() });
  }

  pickDefend() {
    if (this.state !== 'menu') return;
    this.state = 'animating';
    this.playerDefending = true;
    this.queue.push({ t: 0.3, action: () => this.pushLog(`${this.player.name} 摆出防御姿态`) });
    this.queue.push({ t: 0.4, action: () => this.afterPlayerAction() });
  }

  pickFlee() {
    if (this.state !== 'menu') return;
    this.state = 'animating';
    if (this.isBoss) {
      this.queue.push({ t: 0.4, action: () => this.pushLog('BOSS 战不能逃跑!') });
      this.queue.push({ t: 0.4, action: () => this.afterPlayerAction() });
      return;
    }
    const success = Math.random() < 0.6;
    if (success) {
      this.queue.push({ t: 0.4, action: () => this.pushLog('成功脱离了战斗') });
      this.queue.push({ t: 0.4, action: () => { this.state = 'fled'; this.onEnd({ result: 'flee' }); }});
    } else {
      this.queue.push({ t: 0.4, action: () => this.pushLog('逃跑失败!') });
      this.queue.push({ t: 0.4, action: () => this.afterPlayerAction() });
    }
  }

  pickSkill(skillIdx) {
    if (this.state !== 'skillList') return;
    const skill = this.player.skills[skillIdx];
    if (!skill) return;
    if (this.player.mp < skill.mpCost) {
      this.pushLog('蓝量不够!');
      return;
    }
    this.state = 'animating';
    this.player.mp -= skill.mpCost;

    if (skill.heal) {
      const before = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + skill.heal);
      const healed = this.player.hp - before;
      this.queue.push({ t: 0.4, action: () => this.pushLog(`${this.player.name} 使用 [${skill.name}]`) });
      this.queue.push({ t: 0.4, action: () => this.pushLog(`恢复 ${healed} 点 HP`) });
    } else {
      const aff = this.player.getAffixes();
      const isCrit = Math.random() < aff.critRate;
      const dmg = computeDamage(this.player.atk, this.enemy.def, (skill.mult || 1) * (isCrit ? 1.5 : 1), this.enemy.defending);
      this.queue.push({ t: 0.3, action: () => this.pushLog(`${this.player.name} 释放 [${skill.name}]!`) });
      this.queue.push({ t: 0.5, action: () => {
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        this.enemy.shake = 0.5;
        this.pushLog(`造成 ${dmg} 点伤害${isCrit ? ' ⚡暴击' : ''}`);
        if (aff.lifeSteal > 0) {
          const heal = Math.max(1, Math.round(dmg * aff.lifeSteal));
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
          this.pushLog(`吸血回复 ${heal} HP`);
        }
        if (!this.enemy.stunned && aff.stunRate > 0 && Math.random() < aff.stunRate) {
          this.enemy.stunned = true;
          this.pushLog(`${this.enemy.name} 陷入眩晕!`);
        }
      }});
    }
    this.queue.push({ t: 0.4, action: () => this.afterPlayerAction() });
  }

  openSkills() {
    if (this.state === 'menu') this.state = 'skillList';
  }
  closeSkills() {
    if (this.state === 'skillList') this.state = 'menu';
  }

  // ------- 敌人 AI -------
  scheduleEnemyAction() {
    if (this.enemy.hp <= 0) { this.checkEnd(); return; }

    // 眩晕: 跳过本回合
    if (this.enemy.stunned) {
      this.enemy.stunned = false;
      this.queue.push({ t: 0.3, action: () => this.pushLog(`${this.enemy.name} 处于眩晕, 无法行动!`) });
      this.queue.push({ t: 0.4, action: () => this.afterEnemyAction() });
      return;
    }

    let useSkill = null;
    if (this.enemy.skills.length > 0 && Math.random() < 0.4) {
      const candidates = this.enemy.skills.filter(s => this.enemy.mp >= s.mpCost);
      if (candidates.length > 0) {
        useSkill = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    this.enemy.defending = false;
    this.queue.push({ t: 0.4, action: () => {} });

    const aff = this.player.getAffixes();

    if (useSkill) {
      this.enemy.mp -= useSkill.mpCost;
      this.queue.push({ t: 0.3, action: () => this.pushLog(`${this.enemy.name} 使出 [${useSkill.name}]!`) });
      if (useSkill.defBuff) {
        this.queue.push({ t: 0.4, action: () => {
          this.enemy.def += useSkill.defBuff;
          this.pushLog(`${this.enemy.name} 防御提升 ${useSkill.defBuff}`);
        }});
      } else if (useSkill.healSelf) {
        // 自我恢复技能
        this.queue.push({ t: 0.5, action: () => {
          const heal = Math.round(this.enemy.maxHp * useSkill.healSelf);
          this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + heal);
          this.pushLog(`${this.enemy.name} 恢复 ${heal} HP!`);
        }});
      } else {
        const dmg = computeDamage(this.enemy.atk, this.player.def, useSkill.mult || 1, this.playerDefending);
        this.queue.push({ t: 0.5, action: () => {
          if (aff.dodge > 0 && Math.random() < aff.dodge) {
            this.pushLog('你闪避了攻击!');
          } else {
            this.player.hp = Math.max(0, this.player.hp - dmg);
            this.playerVisual.shake = 0.4;
            this.pushLog(`你受到 ${dmg} 点伤害!`);
            if (aff.reflect > 0) {
              const ref = Math.max(1, Math.round(dmg * aff.reflect));
              this.enemy.hp = Math.max(0, this.enemy.hp - ref);
              this.pushLog(`反伤 ${ref} 点!`);
            }
          }
        }});
      }
    } else {
      const dmg = computeDamage(this.enemy.atk, this.player.def, 1, this.playerDefending);
      this.queue.push({ t: 0.3, action: () => this.pushLog(`${this.enemy.name} 发起攻击!`) });
      this.queue.push({ t: 0.5, action: () => {
        if (aff.dodge > 0 && Math.random() < aff.dodge) {
          this.pushLog('你闪避了攻击!');
        } else {
          this.player.hp = Math.max(0, this.player.hp - dmg);
          this.playerVisual.shake = 0.4;
          this.pushLog(`你受到 ${dmg} 点伤害`);
          if (aff.reflect > 0) {
            const ref = Math.max(1, Math.round(dmg * aff.reflect));
            this.enemy.hp = Math.max(0, this.enemy.hp - ref);
            this.pushLog(`反伤 ${ref} 点!`);
          }
        }
      }});
    }

    this.queue.push({ t: 0.4, action: () => this.afterEnemyAction() });
  }

  afterPlayerAction() {
    this.playerDefending = false; // 防御只持续到敌人下一次行动后清掉, 但简化处理
    if (this.checkEnd()) return;
    // 玩家行动完, 轮到敌人
    this.scheduleEnemyAction();
  }

  afterEnemyAction() {
    this.playerDefending = false; // 现在清掉防御
    if (this.checkEnd()) return;
    this.state = 'menu';
  }

  checkEnd() {
    if (this.enemy.hp <= 0) {
      this.state = 'playerWin';
      const exp = this.enemy.expReward;
      const gold = this.enemy.goldReward;
      this.player.gold += gold;
      const ups = this.player.gainExp(exp);
      this.pushLog(`击败 ${this.enemy.name}! +${exp} 经验 +${gold} 金`);
      if (ups > 0) this.pushLog(`✨ 升级! 现已等级 ${this.player.lvl}`);

      // 摇出装备掉落
      const drops = (typeof rollDrops === 'function') ? rollDrops(this.enemyKey) : [];
      const lootedDrops = [];
      const overflowDrops = [];
      for (const id of drops) {
        if (this.player.addItem(id)) {
          lootedDrops.push(id);
          this.pushLog(`✦ 拾得 [${Items[id].name}]`);
        } else {
          overflowDrops.push(id);
          this.pushLog(`(背包已满, [${Items[id].name}] 未拾取)`);
        }
      }

      this.queue.push({ t: 1.6, action: () => this.onEnd({
        result: 'win', exp, gold, levelUp: ups,
        drops: lootedDrops, dropsOverflow: overflowDrops,
      }) });
      return true;
    }
    if (this.player.hp <= 0) {
      this.state = 'playerLose';
      this.pushLog('你失去了意识...');
      this.queue.push({ t: 1.5, action: () => this.onEnd({ result: 'lose' }) });
      return true;
    }
    return false;
  }

  // 主循环每帧调用
  update(dt) {
    if (this.enemy.shake > 0) this.enemy.shake = Math.max(0, this.enemy.shake - dt);
    if (this.playerVisual.shake > 0) this.playerVisual.shake = Math.max(0, this.playerVisual.shake - dt);

    if (this.queue.length === 0) return;
    const cur = this.queue[0];
    this.timer += dt;
    if (this.timer >= cur.t) {
      cur.action();
      this.queue.shift();
      this.timer = 0;
    }
  }
}

// ------- 伤害公式 -------
function computeDamage(atk, def, mult, defending) {
  let base = (atk * (mult || 1)) - def * 0.6;
  if (defending) base *= 0.5;
  // 5% 随机浮动
  base *= (0.95 + Math.random() * 0.1);
  return Math.max(1, Math.round(base));
}
