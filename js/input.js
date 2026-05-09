// 输入管理 - 同时支持键盘 (PC) 和触摸 (手机)
//
// 暴露的接口:
//   Input.axis()        -> {x, y}, 已归一化, 来自键盘或虚拟摇杆
//   Input.actionPressed -> 一次性的 "按下动作键" 触发, 读完就清掉
//   Input.consumeAction()
//   Input.bindCanvas(canvas)
//   Input.joystick      -> {active, baseX, baseY, knobX, knobY, radius} 给 UI 画
//   Input.actionBtn     -> 给 UI 画的按钮区域

const Input = (() => {
  const keys = {};
  let actionQueued = false;

  // ----- 键盘 -----
  const keyMap = {
    ArrowUp: 'up',     w: 'up',    W: 'up',
    ArrowDown: 'down', s: 'down',  S: 'down',
    ArrowLeft: 'left', a: 'left',  A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  };

  window.addEventListener('keydown', (e) => {
    const dir = keyMap[e.key];
    if (dir) {
      keys[dir] = true;
      if (e.key.startsWith('Arrow')) e.preventDefault();
    }
    // 空格 / 回车 / J 作为动作键
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'j' || e.key === 'J') {
      actionQueued = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = keyMap[e.key];
    if (dir) keys[dir] = false;
  });
  window.addEventListener('blur', () => {
    Object.keys(keys).forEach((k) => (keys[k] = false));
    joystick.active = false;
  });

  // ----- 虚拟摇杆 + 动作按钮 (画在 canvas 上, 用 touch / pointer 监听) -----
  // 摇杆放左下, 按钮放右下. 数值是基于 384x640 的内部坐标
  const joystick = {
    baseX: 78, baseY: 560,        // 摇杆中心
    radius: 50,                    // 摇杆活动半径
    knobX: 78, knobY: 560,        // 摇杆头位置
    active: false,
    pointerId: null,
    vx: 0, vy: 0,                  // 输出向量 -1..1
  };
  const actionBtn = {
    cx: 320, cy: 560,              // 按钮中心
    r: 42,
    pressed: false,
    pointerId: null,
  };
  // 动态额外按钮 (战斗/对话场景才显示, 由 UI 模块填充)
  // 形式: { id, cx, cy, w, h, label, onPress }
  let dynamicHotspots = [];
  function setHotspots(list) { dynamicHotspots = list || []; }

  // canvas 内部坐标转换
  let canvasEl = null;
  function bindCanvas(canvas) {
    canvasEl = canvas;
    const opts = { passive: false };

    // pointer events 同时支持鼠标 + 触摸 + 触控笔
    canvas.addEventListener('pointerdown', onDown, opts);
    canvas.addEventListener('pointermove', onMove, opts);
    canvas.addEventListener('pointerup',   onUp,   opts);
    canvas.addEventListener('pointercancel', onUp, opts);
    canvas.addEventListener('pointerleave', onUp,  opts);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function getCanvasPos(e) {
    if (!canvasEl) return { x: 0, y: 0 };
    const rect = canvasEl.getBoundingClientRect();
    const sx = canvasEl.width / rect.width;
    const sy = canvasEl.height / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  }

  function inActionBtn(p) {
    const dx = p.x - actionBtn.cx, dy = p.y - actionBtn.cy;
    return dx * dx + dy * dy <= actionBtn.r * actionBtn.r;
  }
  function inJoystickArea(p) {
    // 整个左下半区作为摇杆触发区, 体验更宽松
    return p.x < 192 && p.y > 440;
  }
  function inHotspot(hs, p) {
    return p.x >= hs.cx - hs.w / 2 && p.x <= hs.cx + hs.w / 2 &&
           p.y >= hs.cy - hs.h / 2 && p.y <= hs.cy + hs.h / 2;
  }

  function onDown(e) {
    e.preventDefault();
    const p = getCanvasPos(e);

    // 优先级: 动态热点 > 动作按钮 > 摇杆
    for (const hs of dynamicHotspots) {
      if (inHotspot(hs, p)) {
        if (hs.onPress) hs.onPress();
        return;
      }
    }
    if (inActionBtn(p)) {
      actionBtn.pressed = true;
      actionBtn.pointerId = e.pointerId;
      actionQueued = true;
      return;
    }
    if (inJoystickArea(p)) {
      joystick.active = true;
      joystick.pointerId = e.pointerId;
      joystick.baseX = p.x;
      joystick.baseY = p.y;
      joystick.knobX = p.x;
      joystick.knobY = p.y;
      joystick.vx = 0; joystick.vy = 0;
    }
  }
  function onMove(e) {
    if (!joystick.active || joystick.pointerId !== e.pointerId) return;
    e.preventDefault();
    const p = getCanvasPos(e);
    let dx = p.x - joystick.baseX;
    let dy = p.y - joystick.baseY;
    const len = Math.hypot(dx, dy);
    if (len > joystick.radius) {
      dx = dx / len * joystick.radius;
      dy = dy / len * joystick.radius;
    }
    joystick.knobX = joystick.baseX + dx;
    joystick.knobY = joystick.baseY + dy;
    // 死区
    const dead = 8;
    if (len < dead) {
      joystick.vx = 0; joystick.vy = 0;
    } else {
      joystick.vx = dx / joystick.radius;
      joystick.vy = dy / joystick.radius;
    }
  }
  function onUp(e) {
    if (joystick.pointerId === e.pointerId) {
      joystick.active = false;
      joystick.pointerId = null;
      joystick.vx = 0; joystick.vy = 0;
      joystick.knobX = joystick.baseX;
      joystick.knobY = joystick.baseY;
    }
    if (actionBtn.pointerId === e.pointerId) {
      actionBtn.pressed = false;
      actionBtn.pointerId = null;
    }
  }

  // ----- 输出 -----
  function axis() {
    let x = 0, y = 0;
    if (keys.left)  x -= 1;
    if (keys.right) x += 1;
    if (keys.up)    y -= 1;
    if (keys.down)  y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv; y *= inv;
    }
    if (joystick.active) {
      // 摇杆覆盖键盘
      x = joystick.vx;
      y = joystick.vy;
    }
    return { x, y };
  }

  function consumeAction() {
    if (actionQueued) {
      actionQueued = false;
      return true;
    }
    return false;
  }

  return {
    bindCanvas,
    axis,
    consumeAction,
    isDown: (dir) => !!keys[dir],
    joystick,
    actionBtn,
    setHotspots,
  };
})();
