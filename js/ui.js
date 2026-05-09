// UI 渲染 - 深色金边版 (参考 UI1.png 设计稿)
//
// 主色调: 深底 + 金线 + 朱砂点缀
// 全部用 384x640 内部画布坐标.

const UI = (() => {
  const W = 384, H = 640;

  // ============ 主题色板 ============
  const C = {
    // 背景层
    bg0:        '#0a0807',         // 最深底
    bg1:        '#1a1410',         // 主面板
    bg2:        '#2a1f15',         // 次级面板 / hover
    bg3:        '#3a2c20',         // 高亮面板

    // 金色系 (主装饰色)
    gold:       '#fcd34d',         // 主金
    goldDk:     '#b59d5e',         // 暗金 / 描边
    goldDkr:    '#8a6f3e',         // 更暗金

    // 文字
    text:       '#f3e8d0',         // 主文字 (米白)
    textSoft:   '#b59d5e',         // 次文字 (旧金)
    textDim:    '#7a6c54',         // 弱文字

    // 朱砂点缀色 (重要操作 / 警示 / 主按钮)
    cinnabar:   '#b91c1c',
    cinnabarL:  '#dc2626',
    cinnabarD:  '#7c2018',

    // 状态条
    hp1:        '#ef4444', hp2: '#b91c1c',
    mp1:        '#3b82f6', mp2: '#1e40af',
    exp1:       '#f59e0b', exp2: '#b45309',

    // 品质 (rarity)
    rCommon:    '#a5a098',
    rRare:      '#5fa8e8',
    rEpic:      '#c87aff',
    rLegend:    '#fcd34d',
  };

  // ============ 通用工具 ============
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + amt);
    const g = Math.min(255, ((n >> 8)  & 0xff) + amt);
    const b = Math.min(255, ( n        & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  // 四角云纹装饰 - 给面板四角加金色点缀
  function cornerOrnament(ctx, x, y, size, corner) {
    // corner: 'tl' | 'tr' | 'bl' | 'br'
    ctx.save();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    let dx = 1, dy = 1;
    if (corner === 'tr') { dx = -1; }
    if (corner === 'bl') { dy = -1; }
    if (corner === 'br') { dx = -1; dy = -1; }

    // 短直角线
    ctx.beginPath();
    ctx.moveTo(x, y + dy * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * size, y);
    ctx.stroke();

    // 内层短线
    ctx.beginPath();
    ctx.moveTo(x + dx * 4, y + dy * (size - 2));
    ctx.lineTo(x + dx * 4, y + dy * 4);
    ctx.lineTo(x + dx * (size - 2), y + dy * 4);
    ctx.stroke();

    // 角点钻石
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.moveTo(x + dx * 7, y + dy * 7);
    ctx.lineTo(x + dx * 9, y + dy * 5);
    ctx.lineTo(x + dx * 11, y + dy * 7);
    ctx.lineTo(x + dx * 9, y + dy * 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 深色面板 - 主要面板风格
  function darkPanel(ctx, x, y, w, h, opts = {}) {
    const r = opts.r != null ? opts.r : 8;
    const fill = opts.fill || C.bg1;
    const ornaments = opts.ornaments !== false;
    // 阴影 (微微外发光)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, r); ctx.fill();
    ctx.restore();

    // 内描边深色
    ctx.strokeStyle = C.bg0;
    ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.stroke();

    // 金色细线
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 1;
    roundRect(ctx, x + 3.5, y + 3.5, w - 7, h - 7, Math.max(2, r - 3)); ctx.stroke();

    if (ornaments && w > 60 && h > 40) {
      cornerOrnament(ctx, x + 6, y + 6, 12, 'tl');
      cornerOrnament(ctx, x + w - 6, y + 6, 12, 'tr');
      cornerOrnament(ctx, x + 6, y + h - 6, 12, 'bl');
      cornerOrnament(ctx, x + w - 6, y + h - 6, 12, 'br');
    }
  }

  // 金边按钮 - 主按钮 (朱砂红) / 次按钮 (深蓝灰)
  function goldButton(ctx, x, y, w, h, label, opts = {}) {
    const variant = opts.variant || 'primary';
    const enabled = opts.enabled !== false;
    const pressed = !!opts.pressed;

    let topColor, botColor, borderColor, textColor;
    if (!enabled) {
      topColor = '#3a2c20'; botColor = '#1a1410';
      borderColor = C.goldDkr; textColor = C.textDim;
    } else if (variant === 'primary') {
      topColor = pressed ? '#a01818' : '#b91c1c';
      botColor = pressed ? '#5a1410' : '#7c2018';
      borderColor = C.gold; textColor = C.text;
    } else if (variant === 'secondary') {
      topColor = pressed ? '#2a1f15' : '#3a2c20';
      botColor = pressed ? '#0f0d0b' : '#1a1410';
      borderColor = C.goldDk; textColor = C.gold;
    } else if (variant === 'cinnabar') {
      topColor = pressed ? C.cinnabarD : C.cinnabarL;
      botColor = C.cinnabarD;
      borderColor = C.gold; textColor = C.text;
    } else if (variant === 'gold') {
      topColor = pressed ? C.goldDk : C.gold;
      botColor = C.goldDk;
      borderColor = C.bg0; textColor = C.bg0;
    }

    const r = opts.r != null ? opts.r : 6;
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, botColor);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, r); ctx.fill();

    // 金描边
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.stroke();

    // 顶部高光
    if (enabled) {
      const hl = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
      hl.addColorStop(0, 'rgba(255,255,255,0.18)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl;
      roundRect(ctx, x + 1, y + 1, w - 2, h * 0.5, r); ctx.fill();
    }

    // label
    if (label) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${opts.fontSize || 15}px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    }
  }

  // 圆形按钮 (战斗动作 / 浮动按钮)
  function circleButton(ctx, cx, cy, r, label, opts = {}) {
    const variant = opts.variant || 'primary';
    const pressed = !!opts.pressed;

    let fillColor, borderColor, textColor;
    if (variant === 'primary') {
      fillColor = pressed ? C.cinnabarD : C.cinnabar;
      borderColor = C.gold; textColor = C.text;
    } else if (variant === 'secondary') {
      fillColor = pressed ? C.bg0 : C.bg2;
      borderColor = C.goldDk; textColor = C.gold;
    } else if (variant === 'gold') {
      fillColor = pressed ? C.goldDk : C.gold;
      borderColor = C.bg0; textColor = C.bg0;
    }

    // 外圈金圈
    ctx.fillStyle = C.bg0;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.fill();

    // 主体
    const grad = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, lighten(fillColor, 25));
    grad.addColorStop(1, fillColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // 内圈细线
    ctx.strokeStyle = 'rgba(252, 211, 77, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();

    if (label) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${opts.fontSize || 18}px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy + 1);
    }
  }

  // 印章 (用在装备界面 / HUD 角)
  function sealBlock(ctx, x, y, size, text, opts = {}) {
    const variant = opts.variant || 'cinnabar';
    let fill, stroke, textColor;
    if (variant === 'cinnabar') {
      fill = C.cinnabar; stroke = C.gold; textColor = C.text;
    } else {
      fill = C.gold; stroke = C.bg0; textColor = C.bg0;
    }
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, size, size, size * 0.18); ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, size * 0.18); ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.floor(size * 0.6)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + size / 2, y + size / 2 + 1);
  }

  // 状态条 — 深底凹槽 + 渐变填充 + 圆头
  function bar(ctx, x, y, w, h, ratio, type = 'hp') {
    let c1, c2;
    if (type === 'hp')      { c1 = C.hp1;  c2 = C.hp2; }
    else if (type === 'mp') { c1 = C.mp1;  c2 = C.mp2; }
    else if (type === 'exp'){ c1 = C.exp1; c2 = C.exp2; }
    else                    { c1 = type;   c2 = type; }

    // 深底
    ctx.fillStyle = C.bg0;
    roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2); ctx.stroke();

    // 充能
    const fillW = Math.max(0, Math.min(1, ratio)) * (w - 2);
    if (fillW > 1) {
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, lighten(c1, 25));
      grad.addColorStop(0.6, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      roundRect(ctx, x + 1, y + 1, fillW, h - 2, (h - 2) / 2); ctx.fill();

      // 顶部高光
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      roundRect(ctx, x + 2, y + 1, fillW - 2, Math.max(1, (h - 2) / 3), (h - 2) / 2); ctx.fill();
    }
  }

  // 旧 silkPanel 接口保留,但内部用新 darkPanel
  function silkPanel(ctx, x, y, w, h, opts = {}) { darkPanel(ctx, x, y, w, h, opts); }

  // ============ 探索 HUD ============
  function drawExploreHud(ctx, player, sceneName) {
    // 顶部渐变阴影 (无实色背景, 保证文字可读)
    const topFade = ctx.createLinearGradient(0, 0, 0, 52);
    topFade.addColorStop(0, 'rgba(0,0,0,0.55)');
    topFade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, W, 52);

    // 等级印章
    sealBlock(ctx, 8, 8, 24, String(player.lvl), { variant: 'gold' });

    // HP / MP 条 (在阴影上下文之外, 避免条形图带阴影)
    bar(ctx, 38, 9,  168, 8, player.hp / player.maxHp, 'hp');
    bar(ctx, 38, 22, 168, 7, player.mp / player.maxMp, 'mp');

    // 所有文字 — 统一加阴影提高可读性
    ctx.save();
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3;

    // HP / MP 数值文字
    ctx.fillStyle = C.text;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(player.hp + '/' + player.maxHp, 41, 13);
    ctx.fillStyle = C.textSoft;
    ctx.fillText(player.mp + '/' + player.maxMp, 41, 26);

    // 金币 (右上)
    ctx.shadowBlur = 3;
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('◎ ' + player.gold, W - 10, 8);

    // 角色名 (右侧)
    ctx.fillStyle = C.textSoft;
    ctx.font = '9px "PingFang SC", sans-serif';
    ctx.fillText(player.name, W - 10, 23);

    // 场景名 (角色名下方，不遮挡血条)
    ctx.shadowBlur = 4;
    ctx.fillStyle = C.gold;
    ctx.font = '9px "PingFang SC", sans-serif';
    ctx.fillText(sceneName, W - 10, 35);
    ctx.restore();

    // Buff 指示器 (HP/MP 条右侧)
    const speedRemain = player.buffRemain('speed');
    const atkRemain   = player.buffRemain('atk');
    if (speedRemain > 0 || atkRemain > 0) {
      ctx.save();
      ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
      let buffX = 214;
      if (speedRemain > 0) {
        const mm = String(Math.floor(speedRemain / 60)).padStart(2, '0');
        const ss = String(speedRemain % 60).padStart(2, '0');
        ctx.fillStyle = '#60d0ff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(`⚡${mm}:${ss}`, buffX, 13);
        buffX += 54;
      }
      if (atkRemain > 0) {
        const mm = String(Math.floor(atkRemain / 60)).padStart(2, '0');
        const ss = String(atkRemain % 60).padStart(2, '0');
        ctx.fillStyle = '#ff9040';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(`⚔${mm}:${ss}`, buffX, 13);
      }
      ctx.restore();
    }

    // 经验条 - 屏幕最下方
    const expY = H - 10;
    const expH = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, expY - 2, W, expH + 3);
    bar(ctx, 0, expY, W, expH, player.exp / player.expNext, 'exp');
    ctx.save();
    ctx.shadowColor = '#000'; ctx.shadowBlur = 2;
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EXP  ' + player.exp + ' / ' + player.expNext, W / 2, expY + expH / 2);
    ctx.restore();
  }

  // ============ 触摸控件 ============
  function drawTouchControls(ctx) {
    const j = Input.joystick;
    const a = Input.actionBtn;

    // 摇杆底盘 (深色 + 金边 + 八方向小点)
    ctx.save();
    // 外晕
    const outerR = j.radius + 16;
    const g = ctx.createRadialGradient(j.baseX, j.baseY, 0, j.baseX, j.baseY, outerR);
    g.addColorStop(0, 'rgba(252, 211, 77, 0.18)');
    g.addColorStop(1, 'rgba(252, 211, 77, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(j.baseX, j.baseY, outerR, 0, Math.PI * 2); ctx.fill();

    // 底盘
    ctx.fillStyle = j.active ? 'rgba(15, 13, 11, 0.85)' : 'rgba(15, 13, 11, 0.7)';
    ctx.beginPath();
    ctx.arc(j.baseX, j.baseY, j.radius + 8, 0, Math.PI * 2); ctx.fill();

    // 双层金边
    ctx.strokeStyle = C.goldDk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(j.baseX, j.baseY, j.radius + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(252, 211, 77, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(j.baseX, j.baseY, j.radius + 4, 0, Math.PI * 2); ctx.stroke();

    // 八方向钻石小点
    for (let i = 0; i < 8; i++) {
      const a_ = (i / 8) * Math.PI * 2;
      const px = j.baseX + Math.cos(a_) * (j.radius);
      const py = j.baseY + Math.sin(a_) * (j.radius);
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.moveTo(px, py - 2);
      ctx.lineTo(px + 2, py);
      ctx.lineTo(px, py + 2);
      ctx.lineTo(px - 2, py);
      ctx.closePath(); ctx.fill();
    }

    // 摇杆头 - 金色发光球
    ctx.fillStyle = C.bg0;
    ctx.beginPath();
    ctx.arc(j.knobX, j.knobY, 24, 0, Math.PI * 2); ctx.fill();
    const kg = ctx.createRadialGradient(j.knobX - 6, j.knobY - 6, 2, j.knobX, j.knobY, 22);
    kg.addColorStop(0, '#fff7c8');
    kg.addColorStop(0.4, C.gold);
    kg.addColorStop(1, C.goldDk);
    ctx.fillStyle = kg;
    ctx.beginPath();
    ctx.arc(j.knobX, j.knobY, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.bg0;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(j.knobX, j.knobY, 22, 0, Math.PI * 2); ctx.stroke();

    // 动作按钮 - 大圆按钮 (主操作)
    circleButton(ctx, a.cx, a.cy, a.r, '动', { variant: 'primary', pressed: a.pressed, fontSize: 22 });
    ctx.restore();
  }

  // ============ NPC 头顶提示 ============
  function drawInteractHint(ctx, npc, camX, camY) {
    const x = npc.x + npc.w / 2 - camX;
    const y = npc.y - 18 - camY;
    if (y < 100 || x < 0 || x > W) return;
    const text = '按 动 对话';
    ctx.font = 'bold 11px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 16;
    // 深底气泡
    ctx.fillStyle = C.bg0;
    roundRect(ctx, x - w / 2, y - 9, w, 18, 9); ctx.fill();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    roundRect(ctx, x - w / 2 + 0.5, y - 8.5, w - 1, 17, 9); ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.fillText(text, x, y);
    // 小三角箭头
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 9);
    ctx.lineTo(x + 4, y + 9);
    ctx.lineTo(x, y + 13);
    ctx.closePath(); ctx.fill();
  }

  // ============ 对话框 - 木简卷轴 ============
  function drawDialogue(ctx, dialogue) {
    // 全屏遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    const px = 16, py = H - 220, pw = W - 32, ph = 196;

    // 主体深色
    ctx.fillStyle = C.bg1;
    roundRect(ctx, px, py, pw, ph, 10); ctx.fill();
    // 渐变光
    const grad = ctx.createLinearGradient(0, py, 0, py + ph);
    grad.addColorStop(0, 'rgba(252, 211, 77, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    roundRect(ctx, px, py, pw, ph, 10); ctx.fill();

    // 双层金边
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.5;
    roundRect(ctx, px + 0.5, py + 0.5, pw - 1, ph - 1, 10); ctx.stroke();
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 1;
    roundRect(ctx, px + 4.5, py + 4.5, pw - 9, ph - 9, 6); ctx.stroke();

    // 四角云纹
    cornerOrnament(ctx, px + 8, py + 8, 14, 'tl');
    cornerOrnament(ctx, px + pw - 8, py + 8, 14, 'tr');
    cornerOrnament(ctx, px + 8, py + ph - 8, 14, 'bl');
    cornerOrnament(ctx, px + pw - 8, py + ph - 8, 14, 'br');

    // 名牌 (顶部凸出, 朱砂色)
    const npx = px + 14, npy = py - 16, npw = 100, nph = 28;
    ctx.fillStyle = C.cinnabar;
    roundRect(ctx, npx, npy, npw, nph, 6); ctx.fill();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.5;
    roundRect(ctx, npx + 0.5, npy + 0.5, npw - 1, nph - 1, 6); ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 14px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dialogue.name, npx + npw / 2, npy + nph / 2 + 1);

    // 文字
    ctx.fillStyle = C.text;
    ctx.font = '15px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const text = dialogue.lines[dialogue.idx] || '';
    wrapText(ctx, text, px + 22, py + 30, pw - 44, 24);

    // 进度提示
    const remain = dialogue.lines.length - dialogue.idx - 1;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 11px "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(remain > 0 ? '▼ 续' : '▼ 终', px + pw - 18, py + ph - 22);
    ctx.globalAlpha = 1;

    // 页码
    ctx.fillStyle = C.textDim;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${dialogue.idx + 1} / ${dialogue.lines.length}`, px + 18, py + ph - 22);
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const chars = text.split('');
    let line = '';
    let yy = y;
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = ch;
        yy += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  // ============ 战斗 UI ============
  let battleBg = null;
  function setBattleBg(img) { battleBg = img; }

  function drawBattle(ctx, battle) {
    // 背景: 山水画 + 暗化
    if (battleBg && battleBg.complete) {
      const scale = H / battleBg.height;
      const sw = battleBg.width * scale;
      const sx = (sw - W) / 2;
      ctx.drawImage(battleBg, -sx, 0, sw, H);
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#2a1f15');
      bg.addColorStop(1, '#0a0807');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = 'rgba(10, 8, 7, 0.4)';
    ctx.fillRect(0, 0, W, H);

    // ===== 顶部敌人面板 =====
    darkPanel(ctx, 8, 8, W - 16, 76, { fill: 'rgba(15, 13, 11, 0.92)' });
    sealBlock(ctx, 18, 18, 28, '敌');
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 16px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(battle.enemy.name, 56, 18);
    bar(ctx, 56, 42, W - 84, 14, battle.enemy.hp / battle.enemy.maxHp, 'hp');
    ctx.fillStyle = C.text;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${battle.enemy.hp} / ${battle.enemy.maxHp}`, 60, 44);

    // ===== 敌人立绘 =====
    const eShake = battle.enemy.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    drawEnemyBig(ctx, W / 2 + eShake, 150, battle.enemy.color, battle.isBoss, battle.enemyKey);

    // ===== 玩家背身 =====
    const pShake = battle.playerVisual.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    drawPlayerBack(ctx, W / 2 + pShake, 290);

    // ===== 玩家状态面板 =====
    const py0 = 350;
    darkPanel(ctx, 8, py0, W - 16, 64, { fill: 'rgba(15, 13, 11, 0.92)' });
    sealBlock(ctx, 18, py0 + 12, 28, '己');
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 14px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${battle.player.lvl} ${battle.player.name}`, 56, py0 + 12);
    bar(ctx, 56, py0 + 32, W - 240, 12, battle.player.hp / battle.player.maxHp, 'hp');
    ctx.fillStyle = C.text;
    ctx.font = '9px sans-serif';
    ctx.fillText(`HP ${battle.player.hp}/${battle.player.maxHp}`, 60, py0 + 33);
    bar(ctx, 56, py0 + 48, W - 240, 8, battle.player.mp / battle.player.maxMp, 'mp');
    ctx.fillText(`MP ${battle.player.mp}/${battle.player.maxMp}`, 60, py0 + 47);

    // ===== 战斗日志 =====
    const ly = py0 + 74;
    darkPanel(ctx, 8, ly, W - 16, 56, { fill: 'rgba(10, 8, 7, 0.85)', ornaments: false });
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    const lines = battle.log.slice(-3);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === lines.length - 1 ? C.gold : C.textSoft;
      ctx.fillText('· ' + lines[i], 18, ly + 10 + i * 14);
    }

    // ===== 行动菜单 =====
    drawBattleMenu(ctx, battle);

    if (battle.state === 'playerWin') {
      drawCenterBanner(ctx, '胜  利', C.gold);
    } else if (battle.state === 'playerLose') {
      drawCenterBanner(ctx, '战  败', C.cinnabarL);
    } else if (battle.state === 'fled') {
      drawCenterBanner(ctx, '已脱身', C.textSoft);
    }
  }

  function drawCenterBanner(ctx, text, color) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 220, W, 100);
    ctx.fillStyle = C.gold;
    ctx.fillRect(0, 222, W, 1);
    ctx.fillRect(0, 318, W, 1);
    ctx.font = 'bold 56px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(text, W / 2 + 2, 272);
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, 270);
  }

  function drawEnemyBig(ctx, cx, cy, color, isBoss, type) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 50, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'slime') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 40, 50, 38, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx - 12, cy + 18, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 18, cy + 14, 6, 8);
      ctx.fillRect(cx + 12, cy + 14, 6, 8);
    } else if (type === 'bat') {
      ctx.fillStyle = color;
      const w = Math.sin(performance.now() / 100) * 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 60, cy - 20 - w);
      ctx.lineTo(cx - 20, cy + 20);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 60, cy - 20 - w);
      ctx.lineTo(cx + 20, cy + 20);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 18, 25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(cx - 9, cy + 4, 5, 5);
      ctx.fillRect(cx + 4, cy + 4, 5, 5);
    } else if (type === 'guardian' || isBoss) {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 50, cy - 30, 100, 80);
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 30);
      ctx.lineTo(cx - 30, cy - 50);
      ctx.lineTo(cx - 10, cy - 35);
      ctx.lineTo(cx,      cy - 55);
      ctx.lineTo(cx + 10, cy - 35);
      ctx.lineTo(cx + 30, cy - 50);
      ctx.lineTo(cx + 40, cy - 30);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffff80';
      ctx.fillRect(cx - 25, cy - 10, 12, 12);
      ctx.fillRect(cx + 13, cy - 10, 12, 12);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) {
        const tx = cx - 18 + i * 12;
        ctx.beginPath();
        ctx.moveTo(tx, cy + 20);
        ctx.lineTo(tx + 4, cy + 20);
        ctx.lineTo(tx + 2, cy + 28);
        ctx.closePath(); ctx.fill();
      }
    } else if (type === 'goblin') {
      ctx.fillStyle = '#9adb6d';
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(cx - 24, cy + 12, 48, 30);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 10, cy - 12, 5, 5);
      ctx.fillRect(cx + 5,  cy - 12, 5, 5);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 2); ctx.lineTo(cx, cy + 8); ctx.lineTo(cx + 4, cy + 2);
      ctx.fill();
    } else if (type === 'wolf') {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 32, cy + 5, 64, 30);
      ctx.beginPath();
      ctx.ellipse(cx + 28, cy + 5, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 22, cy - 16); ctx.lineTo(cx + 28, cy - 4); ctx.lineTo(cx + 16, cy - 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 38, cy - 18); ctx.lineTo(cx + 44, cy - 6); ctx.lineTo(cx + 32, cy - 6);
      ctx.fill();
      ctx.fillStyle = '#ffff80';
      ctx.fillRect(cx + 22, cy, 5, 4);
      ctx.fillRect(cx + 36, cy, 5, 4);
      ctx.fillStyle = color;
      ctx.fillRect(cx - 28, cy + 30, 7, 14);
      ctx.fillRect(cx - 12, cy + 30, 7, 14);
      ctx.fillRect(cx + 6,  cy + 30, 7, 14);
      ctx.fillRect(cx + 22, cy + 30, 7, 14);
      ctx.beginPath();
      ctx.moveTo(cx - 32, cy + 8);
      ctx.lineTo(cx - 50, cy - 4);
      ctx.lineTo(cx - 32, cy + 18);
      ctx.fill();
    } else if (type === 'shade') {
      const phase = performance.now() / 300;
      ctx.fillStyle = color;
      ctx.beginPath();
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r = 35 + Math.sin(a * 3 + phase) * 5;
        pts.push([cx + Math.cos(a) * r, cy + 10 + Math.sin(a) * r * 0.9]);
      }
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.cinnabarL;
      ctx.beginPath();
      ctx.arc(cx - 10, cy + 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 10, cy + 4, 4, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'wanderer') {
      ctx.fillStyle = '#f0c89b';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#666';
      ctx.fillRect(cx - 22, cy + 6, 44, 38);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 8, cy - 12, 4, 4);
      ctx.fillRect(cx + 4, cy - 12, 4, 4);
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 10);
      ctx.lineTo(cx, cy + 40);
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 30, cy - 20, 60, 60);
    }
  }

  function drawPlayerBack(ctx, cx, cy) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2412';
    ctx.fillRect(cx - 14, cy - 16, 28, 22);
    ctx.fillStyle = '#d24b4b';
    ctx.fillRect(cx - 16, cy + 6, 32, 22);
    ctx.fillStyle = C.gold;
    ctx.fillRect(cx - 16, cy + 14, 32, 3);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(cx - 12, cy + 28, 8, 14);
    ctx.fillRect(cx + 4,  cy + 28, 8, 14);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(cx + 18, cy - 6, 4, 28);
    ctx.fillStyle = C.gold;
    ctx.fillRect(cx + 16, cy + 18, 8, 4);
  }

  function drawBattleMenu(ctx, battle) {
    const my = 486;

    if (battle.state === 'skillList') {
      // 技能列表 - 单列大按钮
      const items = battle.player.skills.map((s, i) => ({
        id: 'sk' + i,
        label: `${s.name}  ·  MP ${s.mpCost}`,
        onPress: () => battle.pickSkill(i),
        canUse: battle.player.mp >= s.mpCost,
      }));
      const hotspots = [];
      // 顶部行动条
      darkPanel(ctx, 8, my, W - 16, 32, { fill: 'rgba(15,13,11,0.94)', ornaments: false, r: 6 });
      sealBlock(ctx, 14, my + 4, 22, '术');
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 13px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('选择术法', 42, my + 16);

      const startY = my + 40;
      const btnH = 34, btnGap = 6;
      for (let i = 0; i < items.length; i++) {
        const x = 12, y = startY + i * (btnH + btnGap), w = W - 24;
        goldButton(ctx, x, y, w, btnH, items[i].label, {
          variant: 'secondary',
          enabled: items[i].canUse,
          fontSize: 14,
        });
        hotspots.push({ id: items[i].id, cx: x + w / 2, cy: y + btnH / 2, w, h: btnH, onPress: items[i].onPress });
      }
      // 返回
      const backY = startY + items.length * (btnH + btnGap);
      goldButton(ctx, 12, backY, W - 24, btnH, '← 返 回', { variant: 'primary', fontSize: 14 });
      hotspots.push({ id: 'back', cx: W / 2, cy: backY + btnH / 2, w: W - 24, h: btnH, onPress: () => battle.closeSkills() });
      Input.setHotspots(hotspots);
    } else {
      // 主菜单 - 4 个圆形动作按钮 (参考 UI1.png 的 battle actions)
      darkPanel(ctx, 8, my, W - 16, 32, { fill: 'rgba(15,13,11,0.94)', ornaments: false, r: 6 });
      sealBlock(ctx, 14, my + 4, 22, '令');
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 13px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('请下令', 42, my + 16);

      const enabled = battle.state === 'menu';
      // 4 个圆按钮横排
      const bY = my + 90;
      const radii = 36;
      const xs = [W * 0.16, W * 0.38, W * 0.62, W * 0.84];
      const items = [
        { id: 'attack', label: '攻击', glyph: '⚔', variant: 'primary',  onPress: () => battle.pickAttack() },
        { id: 'skill',  label: '术法', glyph: '✦', variant: 'secondary', onPress: () => battle.openSkills() },
        { id: 'defend', label: '防御', glyph: '盾', variant: 'secondary', onPress: () => battle.pickDefend() },
        { id: 'flee',   label: '遁走', glyph: '走', variant: 'secondary', onPress: () => battle.pickFlee() },
      ];
      const hotspots = [];
      for (let i = 0; i < items.length; i++) {
        const cx = xs[i], cy = bY;
        circleButton(ctx, cx, cy, radii, items[i].glyph,
                    { variant: items[i].variant, fontSize: 22 });
        // label below circle
        ctx.fillStyle = enabled ? C.gold : C.textDim;
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(items[i].label, cx, cy + radii + 6);
        if (enabled) {
          hotspots.push({ id: items[i].id, cx, cy, w: radii * 2 + 8, h: radii * 2 + 8, onPress: items[i].onPress });
        }
      }
      Input.setHotspots(hotspots);
    }
  }

  // ============ 标题屏 ============
  let logoImg = null;
  function setLogo(img) { logoImg = img; }

  function drawTitle(ctx, t) {
    // 背景: logo image 暗化
    if (logoImg && logoImg.complete) {
      const sw = logoImg.width, sh = logoImg.height;
      const scale = Math.max(W / sw, H / sh);
      const dw = sw * scale, dh = sh * scale;
      ctx.drawImage(logoImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.fillStyle = 'rgba(10, 8, 7, 0.55)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = C.bg0;
      ctx.fillRect(0, 0, W, H);
    }

    // 顶部金线装饰
    ctx.fillStyle = C.gold;
    ctx.fillRect(W / 2 - 80, 90, 160, 1);
    // 五角钻石装饰
    for (let i = -2; i <= 2; i++) {
      const dx = i * 22;
      ctx.fillStyle = i === 0 ? C.gold : C.goldDk;
      ctx.beginPath();
      ctx.moveTo(W / 2 + dx, 86);
      ctx.lineTo(W / 2 + dx + 3, 90);
      ctx.lineTo(W / 2 + dx, 94);
      ctx.lineTo(W / 2 + dx - 3, 90);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = C.gold;
    ctx.fillRect(W / 2 - 80, 99, 160, 1);

    // 标题字 (大金字 + 阴影)
    ctx.font = 'bold 56px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText('仙踪奇缘', W / 2 + 3, 173);
    // 主字 - 金色渐变
    const titleGrad = ctx.createLinearGradient(0, 140, 0, 200);
    titleGrad.addColorStop(0, '#fff7c8');
    titleGrad.addColorStop(0.5, C.gold);
    titleGrad.addColorStop(1, C.goldDk);
    ctx.fillStyle = titleGrad;
    ctx.fillText('仙踪奇缘', W / 2, 170);

    // 副标题
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = C.gold;
    ctx.fillText('CINNABAR · APOCRYPHA', W / 2, 210);

    // 装饰金线
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 70, 230); ctx.lineTo(W / 2 - 12, 230);
    ctx.moveTo(W / 2 + 12, 230); ctx.lineTo(W / 2 + 70, 230);
    ctx.stroke();
    // 中央钻石
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.moveTo(W / 2, 226);
    ctx.lineTo(W / 2 + 4, 230);
    ctx.lineTo(W / 2, 234);
    ctx.lineTo(W / 2 - 4, 230);
    ctx.closePath(); ctx.fill();

    // 副副标题
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.fillStyle = C.textSoft;
    ctx.fillText('— 三界仙缘录 · 第一卷 —', W / 2, 252);

    // 提示
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 14px "PingFang SC", sans-serif';
    ctx.fillStyle = C.gold;
    ctx.fillText('点击屏幕  开始游戏', W / 2, H - 90);
    ctx.globalAlpha = 1;

    // 版本字样
    ctx.font = '10px sans-serif';
    ctx.fillStyle = C.textDim;
    ctx.fillText('VOLUME · I  ·  MMXXVI', W / 2, H - 30);
  }

  // ============ 加载屏 ============
  function drawLoading(ctx, ratio) {
    ctx.fillStyle = C.bg0;
    ctx.fillRect(0, 0, W, H);

    // 渐变光
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 250);
    g.addColorStop(0, 'rgba(252, 211, 77, 0.1)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 标题字
    const titleGrad = ctx.createLinearGradient(0, H / 2 - 40, 0, H / 2);
    titleGrad.addColorStop(0, '#fff7c8');
    titleGrad.addColorStop(1, C.goldDk);
    ctx.fillStyle = titleGrad;
    ctx.font = 'bold 40px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('仙踪奇缘', W / 2, H / 2 - 30);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = C.textSoft;
    ctx.fillText('磨墨 · 拭笔 · 点丹 · 展卷', W / 2, H / 2 + 10);

    bar(ctx, W / 2 - 80, H / 2 + 40, 160, 8, ratio, 'exp');
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(Math.floor(ratio * 100) + '%', W / 2, H / 2 + 65);
  }

  // ============ 场景过场卡 ============
  function drawSceneCard(ctx, sceneName, alpha, img) {
    ctx.fillStyle = `rgba(10, 8, 7, ${0.92 * alpha})`;
    ctx.fillRect(0, 0, W, H);
    if (img && img.complete) {
      const scale = Math.min(W / img.width, H / img.height) * 0.85;
      const dw = img.width * scale, dh = img.height * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2 - 30, dw, dh);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = alpha;
    // 装饰线 + 钻石
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, H - 88); ctx.lineTo(W - 60, H - 88);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.moveTo(W / 2, H - 92); ctx.lineTo(W / 2 + 4, H - 88);
    ctx.lineTo(W / 2, H - 84); ctx.lineTo(W / 2 - 4, H - 88);
    ctx.closePath(); ctx.fill();

    ctx.font = 'bold 28px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tg = ctx.createLinearGradient(0, H - 75, 0, H - 50);
    tg.addColorStop(0, '#fff7c8');
    tg.addColorStop(1, C.goldDk);
    ctx.fillStyle = tg;
    ctx.fillText(sceneName, W / 2, H - 60);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = C.textSoft;
    ctx.fillText('入  境', W / 2, H - 36);
    ctx.globalAlpha = 1;
  }

  // ============ 装备 + 背包界面 ============
  function drawInventory(ctx, player, view) {
    // 背景
    ctx.fillStyle = C.bg0;
    ctx.fillRect(0, 0, W, H);

    // 顶部标题栏
    darkPanel(ctx, 8, 8, W - 16, 56);
    sealBlock(ctx, 18, 20, 32, '装');
    const tg = ctx.createLinearGradient(0, 18, 0, 50);
    tg.addColorStop(0, '#fff7c8');
    tg.addColorStop(1, C.goldDk);
    ctx.fillStyle = tg;
    ctx.font = 'bold 18px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('装备 · 背包', 60, 28);
    ctx.fillStyle = C.textSoft;
    ctx.font = '11px sans-serif';
    ctx.fillText(`Lv.${player.lvl}  ${player.name}`, 60, 50);

    // 关闭按钮
    const closeR = 22;
    const closeX = W - 32, closeY = 36;
    circleButton(ctx, closeX, closeY, closeR, '关', { variant: 'primary', fontSize: 13 });

    // 状态面板 (左)
    const statY = 76;
    darkPanel(ctx, 8, statY, 184, 156, { fill: 'rgba(20, 16, 12, 0.94)' });
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 12px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('· 属 性 ·', 18, statY + 12);
    // 横线装饰
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, statY + 28); ctx.lineTo(174, statY + 28);
    ctx.stroke();

    const stats = [
      ['气血', player.hp + '/' + player.maxHp, player._equipBonus('maxHp')],
      ['法力', player.mp + '/' + player.maxMp, player._equipBonus('maxMp')],
      ['攻击', player.atk, player._equipBonus('atk')],
      ['防御', player.def, player._equipBonus('def')],
      ['速度', player.spd, player._equipBonus('spd')],
    ];
    for (let i = 0; i < stats.length; i++) {
      const y = statY + 38 + i * 22;
      const [label, val, bonus] = stats[i];
      ctx.fillStyle = C.textSoft;
      ctx.font = '12px "PingFang SC", sans-serif';
      ctx.fillText(label, 18, y);
      ctx.fillStyle = C.text;
      ctx.font = 'bold 13px "PingFang SC", sans-serif';
      ctx.fillText(String(val), 60, y);
      if (bonus > 0) {
        ctx.fillStyle = '#9be85a';
        ctx.font = '11px sans-serif';
        ctx.fillText(`(+${bonus})`, 110, y + 1);
      }
    }

    // 装备槽 (右)
    const eqY = 76;
    const eqX = 200;
    const eqW = W - eqX - 8;
    darkPanel(ctx, eqX, eqY, eqW, 156, { fill: 'rgba(20, 16, 12, 0.94)' });
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 12px "PingFang SC", sans-serif';
    ctx.fillText('· 装 备 ·', eqX + 12, eqY + 12);
    ctx.strokeStyle = C.goldDkr;
    ctx.beginPath();
    ctx.moveTo(eqX + 12, eqY + 28);
    ctx.lineTo(eqX + eqW - 12, eqY + 28);
    ctx.stroke();

    const slotH = 24;
    const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring'];
    const eqHotspots = [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const y = eqY + 36 + i * slotH;
      const itemId = player.equipped[slot];
      const meta = SlotMeta[slot];

      const isSelected = view.selected && view.selected.type === 'eq' && view.selected.slot === slot;
      if (isSelected) {
        ctx.fillStyle = 'rgba(252, 211, 77, 0.2)';
        ctx.fillRect(eqX + 4, y - 2, eqW - 8, slotH - 2);
      }

      // 槽位图标 (品质色)
      const iconX = eqX + 12, iconY = y;
      const item = itemId ? Items[itemId] : null;
      const iconColor = item ? (Rarity[item.rarity] ? Rarity[item.rarity].color : (item.color || C.textSoft)) : C.bg2;
      ctx.fillStyle = iconColor;
      roundRect(ctx, iconX, iconY, 18, 18, 3); ctx.fill();
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1;
      roundRect(ctx, iconX + 0.5, iconY + 0.5, 17, 17, 3); ctx.stroke();
      ctx.fillStyle = item ? C.bg0 : C.textDim;
      ctx.font = `bold 12px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item ? item.glyph : meta.glyph, iconX + 9, iconY + 10);

      ctx.fillStyle = item ? C.text : C.textDim;
      ctx.font = '11px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item ? item.name : `(空·${meta.name})`, iconX + 24, iconY + 9);

      eqHotspots.push({
        id: 'eq-' + slot,
        cx: eqX + eqW / 2, cy: y + 9,
        w: eqW - 8, h: slotH - 2,
        slot,
      });
    }

    // 背包面板
    const COLS = 4, CELL = 60, CELL_GAP = 8, ROW_H = CELL + CELL_GAP;
    const VISIBLE_ROWS = 4;
    const TOTAL_SLOTS = 100;
    const invY = 246;
    const invH = H - invY - 68; // 精确留出 4 行
    darkPanel(ctx, 8, invY, W - 16, invH);

    // 标题行
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 12px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`· 背 包 (${player.inventory.length}/${TOTAL_SLOTS}) ·`, 18, invY + 12);
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`◎ ${player.gold}`, W - 18, invY + 14);
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, invY + 30); ctx.lineTo(W - 18, invY + 30);
    ctx.stroke();

    // 格子参数
    const scrollRow = view.scrollRow || 0;
    const gridW = COLS * CELL + (COLS - 1) * CELL_GAP;  // 264
    const gridX = (W - gridW) / 2;                       // 60
    const gridY = invY + 40;
    const visibleH = VISIBLE_ROWS * ROW_H;               // 272

    // 裁剪到格子区域，防止超出
    ctx.save();
    ctx.beginPath();
    ctx.rect(gridX - 4, gridY, gridW + 8, visibleH);
    ctx.clip();

    const invHotspots = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      const visR = r - scrollRow; // 视口内行号
      if (visR < 0 || visR >= VISIBLE_ROWS) continue;
      const cx = gridX + c * (CELL + CELL_GAP);
      const cy = gridY + visR * ROW_H;

      const isSelected = view.selected && view.selected.type === 'inv' && view.selected.idx === i;

      // 单元格底
      ctx.fillStyle = C.bg2;
      roundRect(ctx, cx, cy, CELL, CELL, 6); ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
        roundRect(ctx, cx + 1, cy + 1, CELL - 2, CELL - 2, 6); ctx.stroke();
      } else {
        ctx.strokeStyle = C.goldDkr; ctx.lineWidth = 1;
        roundRect(ctx, cx + 0.5, cy + 0.5, CELL - 1, CELL - 1, 6); ctx.stroke();
      }

      const itemId = player.inventory[i];
      if (itemId) {
        const item = Items[itemId];
        if (item) {
          const isQuest = item.type === 'quest';
          const isConsumable = item.type === 'potion' || item.type === 'item';
          const rColor = isQuest ? '#7c3aed'
            : isConsumable ? (item.color || '#aaaaaa')
            : (Rarity[item.rarity] ? Rarity[item.rarity].color : '#aaaaaa');
          const rg = ctx.createRadialGradient(cx + CELL/2, cy + CELL/2, 4, cx + CELL/2, cy + CELL/2, CELL/2);
          rg.addColorStop(0, rColor);
          rg.addColorStop(1, lighten(rColor, -40));
          ctx.fillStyle = rg;
          roundRect(ctx, cx + 6, cy + 6, CELL - 12, CELL - 12, 4); ctx.fill();
          ctx.strokeStyle = C.bg0; ctx.lineWidth = 1;
          roundRect(ctx, cx + 6.5, cy + 6.5, CELL - 13, CELL - 13, 4); ctx.stroke();
          if (isQuest) {
            ctx.fillStyle = C.gold; ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'right'; ctx.textBaseline = 'top';
            ctx.fillText('任', cx + CELL - 6, cy + 7);
          }
          ctx.font = 'bold 22px "PingFang SC", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillText(item.glyph, cx + CELL / 2 + 1, cy + CELL / 2 + 1);
          ctx.fillStyle = C.text;
          ctx.fillText(item.glyph, cx + CELL / 2, cy + CELL / 2);
          if (!isQuest && !isConsumable && Rarity[item.rarity]) {
            const stars = Rarity[item.rarity].stars;
            for (let s = 0; s < stars; s++) {
              ctx.fillStyle = C.gold;
              ctx.beginPath();
              const sx = cx + 8 + s * 6, sy = cy + CELL - 10;
              ctx.moveTo(sx, sy - 2); ctx.lineTo(sx + 2, sy);
              ctx.lineTo(sx, sy + 2); ctx.lineTo(sx - 2, sy);
              ctx.closePath(); ctx.fill();
            }
          }
        }
      }

      invHotspots.push({
        id: 'inv-' + i,
        cx: cx + CELL / 2, cy: cy + CELL / 2,
        w: CELL, h: CELL,
        idx: i,
      });
    }

    ctx.restore(); // 结束格子裁剪区

    // 滚动指示器 + ▲/▼ 按钮 (格子右侧)
    const totalRows = Math.ceil(TOTAL_SLOTS / COLS);
    const maxScroll = totalRows - VISIBLE_ROWS;
    const btnCx = gridX + gridW + 22;
    const btnR = 16;

    // 进度轨道
    const trackTop = gridY + btnR + 4;
    const trackBot = gridY + visibleH - btnR - 4;
    ctx.fillStyle = C.bg2;
    roundRect(ctx, btnCx - 3, trackTop, 6, trackBot - trackTop, 3); ctx.fill();
    // 滑块
    if (maxScroll > 0) {
      const thumbH = Math.max(12, (VISIBLE_ROWS / totalRows) * (trackBot - trackTop));
      const thumbY = trackTop + (scrollRow / maxScroll) * (trackBot - trackTop - thumbH);
      ctx.fillStyle = C.goldDk;
      roundRect(ctx, btnCx - 3, thumbY, 6, thumbH, 3); ctx.fill();
    }

    // ▲ 按钮
    const upCanUse = scrollRow > 0;
    goldButton(ctx, btnCx - btnR, gridY, btnR * 2, btnR * 2, '▲', {
      variant: upCanUse ? 'secondary' : 'secondary', enabled: upCanUse, fontSize: 11, r: 4,
    });
    // ▼ 按钮
    const dnCanUse = scrollRow < maxScroll;
    goldButton(ctx, btnCx - btnR, gridY + visibleH - btnR * 2, btnR * 2, btnR * 2, '▼', {
      variant: 'secondary', enabled: dnCanUse, fontSize: 11, r: 4,
    });

    // 当前页文字
    ctx.fillStyle = C.textDim;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${scrollRow + 1}`, btnCx, gridY + visibleH / 2);

    const scrollUp = upCanUse ? { cx: btnCx, cy: gridY + btnR, w: btnR * 2, h: btnR * 2 } : null;
    const scrollDn = dnCanUse ? { cx: btnCx, cy: gridY + visibleH - btnR, w: btnR * 2, h: btnR * 2 } : null;

    // 详情 + 操作 (底部)
    const detailY = H - 68;
    darkPanel(ctx, 8, detailY, W - 16, 60, { fill: 'rgba(20, 16, 12, 0.94)' });

    let actionHotspots = [];
    if (view.selected) {
      const sel = view.selected;
      let item = null;
      if (sel.type === 'inv') item = Items[player.inventory[sel.idx]];
      else if (sel.type === 'eq') item = Items[player.equipped[sel.slot]];

      if (item) {
        const isQuest = item.type === 'quest';
        const isConsumable = item.type === 'potion' || item.type === 'item';
        const nameColor = isQuest ? '#a78bfa'
          : isConsumable ? (item.color || C.textSoft)
          : (Rarity[item.rarity] ? Rarity[item.rarity].color : C.textSoft);
        ctx.fillStyle = nameColor;
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(item.name, 18, detailY + 10);

        const btnY = detailY + 16, btnW = 50, btnH = 28;

        const isPotion = item.type === 'potion';
        if (isQuest) {
          // 任务道具
          ctx.fillStyle = C.textSoft;
          ctx.font = '10px "PingFang SC", sans-serif';
          ctx.fillText('【任务道具】', 18, detailY + 28);
          ctx.fillStyle = C.textSoft;
          ctx.font = '11px "PingFang SC", sans-serif';
          ctx.fillText(item.desc || '', 18, detailY + 42);
          if (sel.type === 'inv') {
            goldButton(ctx, W - btnW - 12, btnY, btnW, btnH, '丢弃', { variant: 'secondary', fontSize: 12 });
            actionHotspots.push({ id: 'inv-drop', cx: W - btnW - 12 + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH });
          }
        } else if (isPotion || item.type === 'item') {
          // 药水 / 消耗道具
          ctx.fillStyle = item.color || '#aaa';
          ctx.font = '10px "PingFang SC", sans-serif';
          ctx.fillText(item.type === 'item' ? '【道具】' : '【药水】', 18, detailY + 28);
          ctx.fillStyle = C.textSoft;
          ctx.font = '11px "PingFang SC", sans-serif';
          ctx.fillText(item.desc || '', 18, detailY + 42);
          if (sel.type === 'inv') {
            goldButton(ctx, W - btnW * 2 - 18, btnY, btnW, btnH, '使用', { variant: 'primary', fontSize: 12 });
            actionHotspots.push({ id: 'inv-use', cx: W - btnW * 2 - 18 + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH });
            goldButton(ctx, W - btnW - 12, btnY, btnW, btnH, '丢弃', { variant: 'secondary', fontSize: 12 });
            actionHotspots.push({ id: 'inv-drop', cx: W - btnW - 12 + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH });
          }
        } else {
          ctx.fillStyle = C.textSoft;
          ctx.font = '10px sans-serif';
          ctx.fillText(`【${Rarity[item.rarity].name} · ${SlotMeta[item.slot].name}】`, 18, detailY + 28);
          ctx.fillStyle = '#9be85a';
          ctx.font = '11px "PingFang SC", sans-serif';
          const statStrs = formatStats(item.stats, item.affixes).join('   ');
          ctx.fillText(statStrs, 18, detailY + 42);
          if (sel.type === 'inv') {
            goldButton(ctx, W - btnW * 2 - 18, btnY, btnW, btnH, '装备', { variant: 'primary', fontSize: 12 });
            actionHotspots.push({ id: 'inv-equip', cx: W - btnW * 2 - 18 + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH });
            goldButton(ctx, W - btnW - 12, btnY, btnW, btnH, '丢弃', { variant: 'secondary', fontSize: 12 });
            actionHotspots.push({ id: 'inv-drop', cx: W - btnW - 12 + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH });
          } else {
            goldButton(ctx, W - btnW - 12, btnY, btnW, btnH, '卸下', { variant: 'primary', fontSize: 12 });
            actionHotspots.push({ id: 'eq-unequip', cx: W - btnW - 12 + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH });
          }
        }
      }
    } else {
      ctx.fillStyle = C.textSoft;
      ctx.font = '12px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('点选装备 / 物品 进行操作', W / 2, detailY + 30);
    }

    return {
      closeBtn: { cx: closeX, cy: closeY, r: closeR },
      eqHotspots, invHotspots, actionHotspots,
      scrollUp, scrollDn,
    };
  }

  // ============ 浮动"包"按钮 ============
  function drawBagButton(ctx) {
    const cx = 354, cy = 110;
    circleButton(ctx, cx, cy, 22, '包', { variant: 'primary', fontSize: 16 });
    return { cx, cy, r: 22 };
  }

  // ============ 浮动"务"(任务)按钮 ============
  function drawQuestButton(ctx, hasReady) {
    const cx = 354, cy = 162;
    circleButton(ctx, cx, cy, 22, '务', { variant: hasReady ? 'gold' : 'secondary', fontSize: 16 });
    if (hasReady) {
      // 红点提示
      const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 250);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx + 14, cy - 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    return { cx, cy, r: 22 };
  }

  // ============ 任务日志界面 ============
  function drawQuestLog(ctx, questManager) {
    ctx.fillStyle = C.bg0;
    ctx.fillRect(0, 0, W, H);

    // 顶部标题栏
    darkPanel(ctx, 8, 8, W - 16, 56);
    sealBlock(ctx, 18, 20, 32, '务');
    const tg = ctx.createLinearGradient(0, 18, 0, 50);
    tg.addColorStop(0, '#fff7c8');
    tg.addColorStop(1, C.goldDk);
    ctx.fillStyle = tg;
    ctx.font = 'bold 18px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('任务日志', 60, 36);

    // 关闭按钮
    const closeR = 22;
    const closeX = W - 32, closeY = 36;
    circleButton(ctx, closeX, closeY, closeR, '关', { variant: 'primary', fontSize: 13 });

    // 任务列表
    const allDefs = Object.entries(QuestDefs);
    const listY = 76;
    let y = listY;

    // 说明文字（无任务时）
    const hasAny = allDefs.some(([qid]) => questManager.status(qid) !== 'none');
    if (!hasAny) {
      darkPanel(ctx, 8, y, W - 16, 100, { fill: 'rgba(20,16,12,0.94)', ornaments: false });
      ctx.fillStyle = C.textDim;
      ctx.font = '13px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('前往村庄与 NPC 对话, 接取任务', W / 2, y + 38);
      ctx.fillStyle = C.textDim;
      ctx.font = '11px sans-serif';
      ctx.fillText('当前无进行中的任务', W / 2, y + 60);
      y += 110;
    }

    for (const [qid, def] of allDefs) {
      const st = questManager.status(qid);
      if (st === 'none') continue;

      const cardH = 86;
      darkPanel(ctx, 8, y, W - 16, cardH, { fill: 'rgba(20,16,12,0.94)', ornaments: false });

      // 状态标签
      let stColor, stLabel;
      if (st === 'ready') { stColor = '#22c55e'; stLabel = '可交付'; }
      else if (st === 'done') { stColor = C.textDim; stLabel = '已完成'; }
      else { stColor = C.gold; stLabel = '进行中'; }

      // 任务标题
      ctx.fillStyle = st === 'done' ? C.textDim : C.text;
      ctx.font = 'bold 14px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(def.title, 20, y + 12);

      // 状态标签（右上）
      const lblW = 50, lblH = 18;
      ctx.fillStyle = stColor;
      ctx.globalAlpha = 0.18;
      roundRect(ctx, W - lblW - 16, y + 10, lblW, lblH, 4); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stColor;
      ctx.lineWidth = 1;
      roundRect(ctx, W - lblW - 16, y + 10, lblW, lblH, 4); ctx.stroke();
      ctx.fillStyle = stColor;
      ctx.font = 'bold 10px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stLabel, W - lblW / 2 - 16, y + 19);

      // 目标进度
      const q = questManager.quests[qid];
      ctx.textAlign = 'left';
      for (let i = 0; i < def.objectives.length; i++) {
        const obj = def.objectives[i];
        const prog = q ? (q.progress[i] || 0) : 0;
        const done = prog >= obj.count;
        const oy = y + 34 + i * 18;

        // 进度条底
        ctx.fillStyle = C.bg2;
        roundRect(ctx, 20, oy, W - 40, 12, 3); ctx.fill();
        // 进度条填充
        const ratio = Math.min(1, prog / obj.count);
        if (ratio > 0) {
          ctx.fillStyle = done ? '#22c55e' : C.gold;
          roundRect(ctx, 20, oy, (W - 40) * ratio, 12, 3); ctx.fill();
        }

        ctx.fillStyle = done ? '#22c55e' : C.text;
        ctx.font = '10px "PingFang SC", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${done ? '✓' : '·'} ${obj.label}`, 24, oy + 6);
        ctx.textAlign = 'right';
        ctx.fillText(`${prog} / ${obj.count}`, W - 24, oy + 6);
        ctx.textAlign = 'left';
      }

      // 奖励预览（右下小字，done 时隐藏）
      if (st !== 'done') {
        const r = def.reward;
        const parts = [];
        if (r.gold) parts.push(`◎${r.gold}`);
        if (r.exp) parts.push(`经验+${r.exp}`);
        if (r.items && r.items.length) parts.push(r.items.map(id => Items[id].name).join('、'));
        if (r.heal) parts.push('元气尽复');
        if (parts.length) {
          ctx.fillStyle = C.textDim;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('奖励: ' + parts.join('  '), W - 20, y + cardH - 10);
        }
      }

      y += cardH + 6;
    }

    // 底部提示
    if (y < H - 40) {
      ctx.fillStyle = C.textDim;
      ctx.font = '11px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`共 ${allDefs.length} 个任务 · 找 NPC 交付已完成的任务`, W / 2, H - 16);
    }

    return {
      closeBtn: { cx: closeX, cy: closeY, r: closeR },
    };
  }

  // ============ 商店 ============
  function drawShop(ctx, player, shopState, catalog) {
    // ── 尺寸规划 ──────────────────────────────────────────
    // 面板占全屏 (留 8px 边距)
    const PX = 8, PY = 8, PW = W - 16, PH = H - 16;
    darkPanel(ctx, PX, PY, PW, PH);

    // ── 顶栏：标题 + 金币 + 关闭 ─────────────────────────
    const HDR = 40; // 顶栏高度
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 15px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('王掌柜的店铺', W / 2, PY + HDR / 2);

    ctx.fillStyle = C.textSoft;
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 ${player.gold} 金`, PX + 10, PY + HDR / 2);

    const closeX = PX + PW - 22, closeY = PY + HDR / 2, closeR = 14;
    ctx.fillStyle = C.textSoft;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeX, closeY);

    // 顶栏分隔线
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PX + 8, PY + HDR);
    ctx.lineTo(PX + PW - 8, PY + HDR);
    ctx.stroke();

    // ── Tab 栏 ────────────────────────────────────────────
    const tabs = [{ key: 'equip', label: '⚔ 装备' }, { key: 'potion', label: '⚗ 药水' }, { key: 'item', label: '📦 道具' }];
    const TAB_H = 34, tabY = PY + HDR, tabW = PW / tabs.length;
    const tabHotspots = [];
    tabs.forEach((tab, i) => {
      const tx = PX + i * tabW;
      const active = shopState.tab === tab.key;
      ctx.fillStyle = active ? C.bg3 : C.bg2;
      ctx.fillRect(tx, tabY, tabW, TAB_H);
      ctx.strokeStyle = active ? C.gold : C.goldDkr;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 0.5, tabY + 0.5, tabW - 1, TAB_H - 1);
      ctx.fillStyle = active ? C.gold : C.textSoft;
      ctx.font = `${active ? 'bold ' : ''}13px "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tx + tabW / 2, tabY + TAB_H / 2);
      tabHotspots.push({ key: tab.key, cx: tx + tabW / 2, cy: tabY + TAB_H / 2, w: tabW, h: TAB_H });
    });

    // ── 详情区（底部固定 130px）─────────────────────────
    const DETAIL_H = 130;
    const detailY = PY + PH - DETAIL_H;

    // 详情区背景
    ctx.fillStyle = C.bg2;
    roundRect(ctx, PX + 4, detailY, PW - 8, DETAIL_H - 4, 6);
    ctx.fill();
    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 0.5;
    roundRect(ctx, PX + 4, detailY, PW - 8, DETAIL_H - 4, 6);
    ctx.stroke();

    const items = catalog[shopState.tab] || [];
    const actionHotspots = [];
    if (shopState.selected != null) {
      const selId = items[shopState.selected];
      const selItem = selId ? Items[selId] : null;
      if (selItem) {
        const rarityColor = (selItem.type === 'potion' || selItem.type === 'item') ? (selItem.color || C.textSoft) :
          (selItem.rarity ? Rarity[selItem.rarity].color : C.textSoft);

        ctx.fillStyle = rarityColor;
        ctx.font = 'bold 14px "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(selItem.name, PX + 14, detailY + 10);

        ctx.fillStyle = C.textSoft;
        ctx.font = '11px "PingFang SC", sans-serif';
        if (selItem.type === 'potion' || selItem.type === 'item') {
          ctx.fillText(selItem.desc || '', PX + 14, detailY + 32);
        } else {
          const strs = formatStats(selItem.stats, selItem.affixes).join('   ');
          ctx.fillText(strs, PX + 14, detailY + 32);
        }

        ctx.fillStyle = C.gold;
        ctx.font = 'bold 12px "PingFang SC", sans-serif';
        ctx.fillText(`价格: ${selItem.value || 0} 金`, PX + 14, detailY + 54);

        const canBuy = player.gold >= (selItem.value || 0) && player.inventory.length < 100;
        const buyW = 80, buyH = 34;
        const buyX = PX + PW - buyW - 20, buyY = detailY + DETAIL_H / 2 - buyH / 2 - 6;
        goldButton(ctx, buyX, buyY, buyW, buyH, '购 买', {
          variant: canBuy ? 'primary' : 'secondary', fontSize: 14,
        });
        actionHotspots.push({ id: 'shop-buy', cx: buyX + buyW / 2, cy: buyY + buyH / 2, w: buyW, h: buyH });

        if (!canBuy) {
          ctx.fillStyle = '#ef4444';
          ctx.font = '10px "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(player.gold < (selItem.value || 0) ? '金币不足' : '背包已满',
            buyX + buyW / 2, buyY + buyH + 4);
        }
      }
    } else {
      ctx.fillStyle = C.textDim;
      ctx.font = '12px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('点击商品查看详情', W / 2, detailY + DETAIL_H / 2);
    }

    // ── 商品列表区（Tab 下方 ~ 详情上方）──────────────────
    const listY = tabY + TAB_H + 4;
    const listH = detailY - listY - 4;   // 精确不超出
    const COLS = 3;
    const INNER_W = PW - 8;              // 去掉左右各4px内边距
    const cellW = Math.floor(INNER_W / COLS);
    const cellH = 76;
    const maxRows = Math.floor(listH / cellH);
    const visCount = maxRows * COLS;
    const scroll = shopState.scroll || 0;
    const startIdx = scroll * COLS;

    // 剪裁到列表区
    ctx.save();
    ctx.beginPath();
    ctx.rect(PX + 4, listY, INNER_W, listH);
    ctx.clip();

    const itemHotspots = [];
    for (let vi = 0; vi < visCount; vi++) {
      const idx = startIdx + vi;
      if (idx >= items.length) break;
      const id = items[idx];
      const item = Items[id];
      if (!item) continue;
      const col = vi % COLS, row = Math.floor(vi / COLS);
      const cx = PX + 4 + col * cellW;
      const cy = listY + row * cellH;
      const isSelected = shopState.selected === idx;

      ctx.fillStyle = isSelected ? C.bg3 : C.bg2;
      roundRect(ctx, cx + 3, cy + 3, cellW - 6, cellH - 6, 8);
      ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.5;
        roundRect(ctx, cx + 3, cy + 3, cellW - 6, cellH - 6, 8);
        ctx.stroke();
      }

      const cxMid = cx + cellW / 2, cyMid = cy + cellH / 2;
      const glyphColor = (item.type === 'potion' || item.type === 'item') ? (item.color || '#aaa') :
        (item.rarity ? Rarity[item.rarity].color : C.textSoft);

      ctx.fillStyle = glyphColor;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.glyph || '?', cxMid, cyMid - 12);

      ctx.fillStyle = C.text;
      ctx.font = '10px "PingFang SC", sans-serif';
      ctx.fillText(item.name, cxMid, cyMid + 10);

      ctx.fillStyle = C.gold;
      ctx.font = '10px sans-serif';
      ctx.fillText(`${item.value || 0} 金`, cxMid, cyMid + 26);

      itemHotspots.push({ idx, cx: cxMid, cy: cyMid, w: cellW - 6, h: cellH - 6 });
    }
    ctx.restore();

    // ── 滚动箭头（列表区右侧，不叠格子）──────────────────
    let scrollUp = null, scrollDn = null;
    const totalRows = Math.ceil(items.length / COLS);
    if (scroll > 0) {
      const bx = PX + PW - 36, by = listY + 4;
      goldButton(ctx, bx, by, 28, 26, '▲', { fontSize: 12 });
      scrollUp = { cx: bx + 14, cy: by + 13, w: 28, h: 26 };
    }
    if (scroll < totalRows - maxRows) {
      const bx = PX + PW - 36, by = listY + listH - 30;
      goldButton(ctx, bx, by, 28, 26, '▼', { fontSize: 12 });
      scrollDn = { cx: bx + 14, cy: by + 13, w: 28, h: 26 };
    }

    return { closeBtn: { cx: closeX, cy: closeY, r: closeR }, tabHotspots, itemHotspots, actionHotspots, scrollUp, scrollDn };
  }

  // ============ 传送界面 ============
  function drawTeleport(ctx, teleportState, sceneList) {
    // ── 尺寸规划 ──────────────────────────────────────────
    const PX = 8, PY = 8, PW = W - 16, PH = H - 16;
    darkPanel(ctx, PX, PY, PW, PH);

    // ── 顶栏 ──────────────────────────────────────────────
    const HDR = 44;
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 15px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ 传送阵 · 选择目的地 ✦', W / 2, PY + HDR / 2);

    const closeX = PX + PW - 22, closeY = PY + HDR / 2, closeR = 14;
    ctx.fillStyle = C.textSoft;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('×', closeX, closeY);

    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PX + 8, PY + HDR);
    ctx.lineTo(PX + PW - 8, PY + HDR);
    ctx.stroke();

    // ── 底部翻页区（固定 44px 高，完全独立）─────────────
    const FOOTER = 44;
    const footerY = PY + PH - FOOTER;

    ctx.strokeStyle = C.goldDkr;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PX + 8, footerY);
    ctx.lineTo(PX + PW - 8, footerY);
    ctx.stroke();

    const rowH = 46;
    const listY = PY + HDR + 2;
    const listH = footerY - listY - 2;
    const VISIBLE = Math.floor(listH / rowH);
    const scroll = teleportState.scroll || 0;
    const totalPages = Math.ceil(sceneList.length / VISIBLE);
    const curPage = Math.floor(scroll / VISIBLE);

    // 翻页按钮（放在 footer 正中）
    let scrollUp = null, scrollDn = null;
    const btnH = 30, btnW = 90;
    const btnY = footerY + (FOOTER - btnH) / 2;

    if (scroll > 0) {
      const bx = W / 2 - btnW - 6;
      goldButton(ctx, bx, btnY, btnW, btnH, '◀ 上一页', { fontSize: 12 });
      scrollUp = { cx: bx + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH };
    }
    if (scroll + VISIBLE < sceneList.length) {
      const bx = W / 2 + 6;
      goldButton(ctx, bx, btnY, btnW, btnH, '下一页 ▶', { fontSize: 12 });
      scrollDn = { cx: bx + btnW / 2, cy: btnY + btnH / 2, w: btnW, h: btnH };
    }

    // 页码提示
    ctx.fillStyle = C.textDim;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${curPage + 1} / ${totalPages}`, W / 2, footerY + FOOTER / 2);

    // ── 列表区（严格裁剪在 listY ~ footerY 之间）─────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(PX + 4, listY, PW - 8, listH);
    ctx.clip();

    const BTN_W = 62, BTN_H = 30;   // "传送"按钮固定宽高
    const rowHotspots = [];

    for (let i = 0; i < VISIBLE; i++) {
      const idx = scroll + i;
      if (idx >= sceneList.length) break;
      const { key, name } = sceneList[idx];
      const ry = listY + i * rowH;

      // 行背景
      ctx.fillStyle = i % 2 === 0 ? C.bg2 : C.bg1;
      roundRect(ctx, PX + 6, ry + 3, PW - 12, rowH - 6, 6);
      ctx.fill();

      // 序号
      ctx.fillStyle = C.textDim;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${idx + 1}`, PX + 16, ry + rowH / 2);

      // 场景名（居中，右侧留 BTN_W+16 空间给按钮）
      const nameMaxX = PX + PW - BTN_W - 20;
      ctx.fillStyle = C.text;
      ctx.font = '14px "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name, PX + 36, ry + rowH / 2);

      // "传送"按钮贴右边，垂直居中
      const btnX = PX + PW - BTN_W - 10;
      const btnY2 = ry + (rowH - BTN_H) / 2;
      goldButton(ctx, btnX, btnY2, BTN_W, BTN_H, '传 送', { fontSize: 12 });
      rowHotspots.push({ key, cx: btnX + BTN_W / 2, cy: btnY2 + BTN_H / 2, w: BTN_W, h: BTN_H });
    }

    ctx.restore();

    return { closeBtn: { cx: closeX, cy: closeY, r: closeR }, rowHotspots, scrollUp, scrollDn };
  }

  return {
    C, roundRect, bar, silkPanel, darkPanel, sealBlock, goldButton, circleButton, cornerOrnament,
    setBattleBg, setLogo,
    drawExploreHud,
    drawTouchControls,
    drawInteractHint,
    drawBagButton,
    drawQuestButton,
    drawDialogue,
    drawBattle,
    drawTitle,
    drawLoading,
    drawSceneCard,
    drawInventory,
    drawQuestLog,
    drawShop,
    drawTeleport,
  };
})();
