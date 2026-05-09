// 任务系统
//
// QuestDefs: 任务定义 (静态数据)
// QuestManager: 运行时任务状态管理

const QuestDefs = {
  elder_quest: {
    npcId: 'elder',
    title: '护卫桃源',
    objectives: [{ type: 'kill', target: 'slime', count: 3, label: '击退史莱姆' }],
    reward: { gold: 50, exp: 30 },
    dialogAccept: [
      '少年, 老夫有一事相托。',
      '南边的史莱姆侵扰村民, 近来愈发猖獗。',
      '若你愿意, 前往森林击退 3 只史莱姆,',
      '老夫必有酬谢。',
      '〔任务 · 护卫桃源  已接受〕',
    ],
    dialogProgress: (prog) => [
      '史莱姆还未全灭……',
      `已击退 ${prog[0]} / 3 只,`,
      '村民们还盼着你呢。',
    ],
    dialogReady: [
      '你回来了！史莱姆已被击退,',
      '村民们都松了一口气。',
      '这是应得的酬劳——50 金与修炼心得, 收下吧。',
      '〔任务 · 护卫桃源  已完成〕',
    ],
    dialogDone: [
      '多谢侠士护卫桃源。',
      '有你在, 村民们安心多了。',
    ],
  },

  child_quest: {
    npcId: 'child',
    title: '史莱姆果冻',
    objectives: [{ type: 'item', target: 'slime_jelly', count: 2, label: '收集史莱姆果冻' }],
    reward: { gold: 20, exp: 20, items: ['jade_ring'] },
    dialogAccept: [
      '哥哥/姐姐好！',
      '听说史莱姆身体里有好吃的果冻,',
      '可我不敢自己去……',
      '帮我带 2 块史莱姆果冻回来好不好？',
      '〔任务 · 史莱姆果冻  已接受〕',
    ],
    dialogProgress: (prog) => [
      '果冻还没带回来嘛～',
      `已有 ${prog[0]} / 2 个史莱姆果冻,`,
      '再去森林里找找吧！',
    ],
    dialogReady: [
      '哇！真的有果冻！好漂亮！',
      '小丫最喜欢这个了～',
      '这个碧玉环是娘亲留给我的, 送给你！',
      '〔任务 · 史莱姆果冻  已完成〕',
    ],
    dialogDone: [
      '谢谢哥哥/姐姐！',
      '果冻放在枕头边好漂亮！',
    ],
  },

  smith_quest: {
    npcId: 'smith',
    title: '锻造材料',
    objectives: [{ type: 'item', target: 'goblin_ear', count: 2, label: '收集哥布林耳饰' }],
    reward: { gold: 30, exp: 25, items: ['bronze_sword'] },
    dialogAccept: [
      '哎, 好钢难觅啊！',
      '不过老铁有个偏方——',
      '哥布林耳饰里含有稀有矿粉,',
      '若你能带 2 个来, 给你打把青铜剑！',
      '〔任务 · 锻造材料  已接受〕',
    ],
    dialogProgress: (prog) => [
      '耳饰还不够哟,',
      `现有 ${prog[0]} / 2 个哥布林耳饰,`,
      '去林子里再搜搜！',
    ],
    dialogReady: [
      '哎呀, 材料到手了！',
      '老铁手艺不含糊——',
      '青铜剑出炉！拿去用吧！',
      '〔任务 · 锻造材料  已完成〕',
    ],
    dialogDone: [
      '那把青铜剑用着顺手不？',
      '若是坏了, 再来找老铁！',
    ],
  },

  hermit_quest: {
    npcId: 'hermit',
    title: '药材采集',
    objectives: [{ type: 'item', target: 'wolf_fang', count: 2, label: '收集灰狼獠牙' }],
    reward: { gold: 0, exp: 40, heal: true },
    dialogAccept: [
      '咳咳……老朽有一味药要炼。',
      '需要灰狼獠牙 2 颗作药引,',
      '若你能带来, 老朽以医术相报,',
      '为你恢复元气！',
      '〔任务 · 药材采集  已接受〕',
    ],
    dialogProgress: (prog) => [
      '獠牙还没够……',
      `现有 ${prog[0]} / 2 颗灰狼獠牙,`,
      '南边狼群出没, 小心行事。',
    ],
    dialogReady: [
      '好, 正是老朽需要的。',
      '来, 老朽为你调理一番——',
      '元气尽复！',
      '〔任务 · 药材采集  已完成〕',
    ],
    dialogDone: [
      '药已炼成, 多谢侠士。',
      '若再受伤, 老朽还在此处。',
    ],
  },

  mystic_quest: {
    npcId: 'mystic',
    title: '封印守护',
    objectives: [{ type: 'kill', target: 'guardian', count: 1, label: '击败洞穴守护者' }],
    reward: { gold: 100, exp: 80, items: ['dragon_ring'], heal: true },
    dialogAccept: [
      '……来者何人?',
      '此洞深处封印着千年前的妖王。',
      '守护者镇守其上, 邪气已外溢……',
      '若你愿意, 替老朽将其击退！',
      '〔任务 · 封印守护  已接受〕',
    ],
    dialogProgress: () => [
      '守护者尚在洞穴深处,',
      '封印摇摇欲坠……',
      '快去一决胜负吧。',
    ],
    dialogReady: [
      '好……终于。',
      '封印得以延续, 多谢侠士出手！',
      '这枚盘龙戒是老朽留下的谢礼,',
      '愿它护佑你周全。元气也为你尽复！',
      '〔任务 · 封印守护  已完成〕',
    ],
    dialogDone: [
      '封印已固,',
      '老朽在此守候,',
      '多谢侠士。',
    ],
  },

  main_quest: {
    npcId: 'fate_envoy',
    title: '封印之路',
    objectives: [
      { type: 'kill', target: 'celestial_guardian', count: 1, label: '斩天界守护神' },
      { type: 'kill', target: 'sea_serpent',        count: 1, label: '斩海蛇古神' },
      { type: 'kill', target: 'lava_titan',         count: 1, label: '斩熔岩巨人' },
      { type: 'kill', target: 'cave_leviathan',     count: 1, label: '斩地底蛟龙' },
      { type: 'kill', target: 'cursed_scholar',     count: 1, label: '斩诅咒学者' },
      { type: 'kill', target: 'mirage_lord',        count: 1, label: '斩幻影城主' },
      { type: 'kill', target: 'ancient_treant',     count: 1, label: '斩太古树人' },
      { type: 'kill', target: 'wraith_king',        count: 1, label: '斩幽灵王' },
      { type: 'kill', target: 'frost_dragon',       count: 1, label: '斩冰霜龙' },
      { type: 'kill', target: 'heaven_sealer',      count: 1, label: '斩天帝封印' },
    ],
    reward: { gold: 5000, exp: 2000, heal: true },
    dialogAccept: [
      '吾乃天机使者, 奉命告知你一件要事。',
      '十处封印守护者已苏醒——',
      '云上仙宫、水底神殿、熔火山口、地底暗湖、',
      '古籍楼、幻影古城、太古密林、',
      '幽魂界域、冰峰绝顶……最终封印台。',
      '每处都有一名守护者坐镇。',
      '集齐十块封印碎片, 方能重铸天地封印。',
      '〔主线任务 · 封印之路  已接受〕',
    ],
    dialogProgress: (prog) => {
      const done = prog.filter(p => p >= 1).length;
      const names = [
        '天界守护神','海蛇古神','熔岩巨人','地底蛟龙','诅咒学者',
        '幻影城主','太古树人','幽灵王','冰霜龙','天帝封印',
      ];
      const remaining = names.filter((_, i) => prog[i] < 1);
      return [
        `封印碎片: ${done} / 10`,
        done < 10 ? `尚未击败: ${remaining.slice(0, 3).join('、')}${remaining.length > 3 ? '等' : ''}` : '所有守护者已被击败!',
        '继续探索十处封印之地吧。',
      ];
    },
    dialogReady: [
      '你做到了……',
      '十块封印碎片悉数归位!',
      '天地封印重铸, 混沌之力再度沉眠。',
      '你是这个时代最伟大的英雄。',
      '收下这 5000 金与传说经验——',
      '一切安宁, 拜托你了。',
      '〔主线任务 · 封印之路  已完成〕',
    ],
    dialogDone: [
      '封印已重铸, 世界恢复平静。',
      '你的名字将被永远铭记。',
    ],
  },
};

class QuestManager {
  constructor() {
    // questId -> { status: 'active'|'ready'|'done', progress: number[] }
    this.quests = {};
  }

  status(questId) {
    return (this.quests[questId] || {}).status || 'none';
  }

  progress(questId) {
    return (this.quests[questId] || {}).progress || [];
  }

  // 有任何 ready 状态的任务
  hasReady() {
    return Object.values(this.quests).some(q => q.status === 'ready');
  }

  accept(questId) {
    if (this.quests[questId]) return;
    const def = QuestDefs[questId];
    if (!def) return;
    this.quests[questId] = {
      status: 'active',
      progress: def.objectives.map(() => 0),
    };
  }

  // 击杀怪物时更新击杀类型任务
  onKill(monsterType) {
    for (const [qid, q] of Object.entries(this.quests)) {
      if (q.status !== 'active') continue;
      const def = QuestDefs[qid];
      def.objectives.forEach((obj, i) => {
        if (obj.type === 'kill' && obj.target === monsterType) {
          q.progress[i] = Math.min(obj.count, q.progress[i] + 1);
        }
      });
      if (this._allMet(qid)) q.status = 'ready';
    }
  }

  // 背包变化时同步道具数量
  syncItems(player) {
    for (const [qid, q] of Object.entries(this.quests)) {
      if (q.status !== 'active') continue;
      const def = QuestDefs[qid];
      def.objectives.forEach((obj, i) => {
        if (obj.type === 'item') {
          q.progress[i] = player.inventory.filter(id => id === obj.target).length;
        }
      });
      if (this._allMet(qid)) q.status = 'ready';
    }
  }

  _allMet(qid) {
    const q = this.quests[qid];
    const def = QuestDefs[qid];
    return def.objectives.every((obj, i) => q.progress[i] >= obj.count);
  }

  // 完成任务：消耗道具，发放奖励
  complete(questId, player) {
    const q = this.quests[questId];
    const def = QuestDefs[questId];
    if (!q || q.status !== 'ready') return false;

    for (const obj of def.objectives) {
      if (obj.type === 'item') {
        let toRemove = obj.count;
        player.inventory = player.inventory.filter(id => {
          if (toRemove > 0 && id === obj.target) {
            toRemove--;
            return false;
          }
          return true;
        });
      }
    }

    const r = def.reward;
    if (r.gold) player.gold += r.gold;
    if (r.exp) player.gainExp(r.exp);
    if (r.heal) { player.hp = player.maxHp; player.mp = player.maxMp; }
    if (r.items) r.items.forEach(id => player.addItem(id));

    q.status = 'done';
    return true;
  }

  // 根据 NPC id 查找其 questId
  questForNpc(npcId) {
    for (const [qid, def] of Object.entries(QuestDefs)) {
      if (def.npcId === npcId) return qid;
    }
    return null;
  }

  // 根据当前任务状态构建对话内容
  buildDialogue(questId, player) {
    const def = QuestDefs[questId];
    if (!def) return null;
    const st = this.status(questId);

    if (st === 'none') {
      return { lines: def.dialogAccept, action: 'accept' };
    }
    if (st === 'active') {
      this.syncItems(player);
      if (this.status(questId) === 'ready') {
        return { lines: def.dialogReady, action: 'complete' };
      }
      const q = this.quests[questId];
      return { lines: def.dialogProgress(q.progress), action: null };
    }
    if (st === 'ready') {
      return { lines: def.dialogReady, action: 'complete' };
    }
    // done
    return { lines: def.dialogDone, action: null };
  }

  serialize() {
    return JSON.parse(JSON.stringify(this.quests));
  }

  deserialize(data) {
    if (data) this.quests = data;
  }

  reset() {
    this.quests = {};
  }
}
