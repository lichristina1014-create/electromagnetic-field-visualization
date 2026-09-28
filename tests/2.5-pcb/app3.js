/* ═════════════════════════════ 面板基础 ═════════════════════════════ */
const panelEl = document.getElementById('panel');
function h(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
function kchip(k, v, cls) {
  return '<span class="coord-chip ' + (cls || '') + '">' + richHTML(k) + '<b>' + v + '</b></span>';
}
function secEl(title) {
  const s = h('<div class="panel-sec"><div class="sec-title">' + richHTML(title) + '</div></div>').firstChild;
  panelEl.appendChild(s); return s;
}
function cardBody(html, cls) {
  return '<div class="card-body' + (cls || '') + '"><div class="ex-body">' + richHTML(html) + '</div></div>';
}
/* 滑块：d = {label,min,max,step,val,fmt,set,wide} —— ★ label 与 fmt 结果都要过 richHTML */
function mkRange(host, d) {
  const row = h('<div class="slider-row' + (d.wide ? ' w' : '') + '">'
    + '<label>' + richHTML(d.label) + '</label>'
    + '<input type="range" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + d.val + '">'
    + '<span class="val">' + richHTML(d.fmt(d.val)) + '</span></div>').firstChild;
  const inp = row.querySelector('input'), vEl = row.querySelector('.val');
  inp.oninput = () => { const v = parseFloat(inp.value); d.set(v); vEl.innerHTML = richHTML(d.fmt(v)); };
  d.el = inp; d.valEl = vEl; d.isRange = true;
  host.appendChild(row); return row;
}
function chipRow(host, items, onPick) {
  const box = h('<div class="sub-chips"></div>').firstChild;
  items.forEach(it => {
    const c = h('<button class="chip ' + (it.cls || '') + '">' + richHTML(it.t) + '</button>').firstChild;
    c.onclick = () => { onPick(it); box.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    box.appendChild(c);
  });
  host.appendChild(box); return box;
}
const sliders = [];
function addRange(host, d) { const r = mkRange(host, d); sliders.push(d); return r; }
function syncSliders() {
  for (const d of sliders) {
    if (!d.el) continue;
    const v = d.get();
    if (Math.abs(parseFloat(d.el.value) - v) > 1e-9) d.el.value = v;
    d.valEl.innerHTML = richHTML(d.fmt(v));
  }
}

/* ═════════════════════════════ 页签内容 ═════════════════════════════ */
const MT = [{ k: 'mutual', t: '① 看不见的元件' },
            { k: 'edge',   t: '② 直流无害，边沿现形' },
            { k: 'rescue', t: '③ 救活这块板' }];
const CARDS = {
  mutual: [
    { t: 'PCB / 走线 / 回流平面', b: 'PCB 就是印制电路板，铜箔嵌在绝缘板里。走线是传信号的那条铜笔。回流平面是铺满整层的铜——电流从走线出去，最终都要回到电源负极，这块铜板是它们的「回程高速公路」。' },
    { t: '边缘效应', b: '教科书里平行板电容公式旁边有一行小字：「忽略边缘效应」——假装场线全是笔直的平行线。<b>真实的场线到了边缘会向外「鼓」出去</b>，弯到板外的空间里。场线鼓出去，就意味着有电场漏到了你以为它不存在的地方。' },
    { t: '互容 C_m', b: '两条本不相连的导体，因为各自截获了对方的电场，形成一个原理图上找不到、却真实存在的电容——工程上叫<b>互容</b>。大一电路里的电容是你主动画进图纸的元件；互容是没人邀请、自己跑来的。' },
    { t: '3W 规则', b: 'W 指走线自身宽度。布线时让两条线的间隙至少拉到 3W，串扰能降到不伤大雅的水平。<b>它不是老师傅的戒律，它就是右边那幅场解的速记版。</b>' },
  ],
  edge: [
    { t: '边沿时间 t_r', b: '方波电压从底部爬到顶部所花的时间（严格定义：10% 爬到 90%）。<b>边沿越陡，t_r 越小，「快」不是时钟频率高，是爬坡陡。</b>现代 FPGA、内存芯片的边沿只有 0.2 ns——光才跑 6 厘米，电压已经从 0 爬到 3.3 伏。' },
    { t: '位移电流', b: '绝缘介质里没有电荷移动，但电场变化时效果上等价于有电流通过，麦克斯韦管它叫<b>位移电流</b> ∂D/∂t。这就是你背的 i = C·du/dt 的「场论出身」——电路课告诉你怎么算，电磁场课告诉你它为什么存在。' },
    { t: '噪声容限 / 误码', b: '数字电路靠电压高低判断 0 和 1。容限就是判断的安全余量：<b>超过它，1 会被误判成 0，这就叫误码。</b>3.3 V 逻辑的容限约 350 mV。' },
    { t: '为什么静态无害', b: '直流下受害线电位升上去就稳在那里，既不发热也不翻转逻辑电平。<b>真正干坏事的从来不是「高」，是「变化得快」。</b>' },
  ],
  rescue: [
    { t: '三条活路的场论翻译', b: '拉间隙——受害线截获的漏场更少，互容随间隙按幂律下降；放缓边沿——电压爬坡变缓，du/dt 变小；削平行长度——截获面积变小。<b>三个旋钮，每个都是在操纵「场」。</b>' },
    { t: '工程上还有两招', b: '<b>串联端接</b>：在芯片输出脚串一个几十欧姆的小电阻，把边沿磨缓——代价是信号变慢，所以叫「拿速度换安静」。<b>地屏蔽线</b>：在两条线之间多布一条接地的铜线，把漏过来的场线直接接走、引入大地——就是高中物理的静电屏蔽。' },
  ],
};

function cardsHTML(key) {
  const list = CARDS[key]; if (!list) return '';
  const cls = ['c1', 'c2', 'c3', 'c4'];
  const tabs = list.map((c, i) =>
    '<button class="card-tab ' + cls[i % 4] + (String(i + 1) === state.cardTab ? ' on' : '') + '" data-i="' + i + '">' + richHTML(c.t) + '</button>').join('');
  const cur = list[(parseInt(state.cardTab, 10) || 1) - 1] || list[0];
  const idx = sliceIdx(list, cur);
  return '<div class="card-tabs">' + tabs + '</div>'
       + '<div class="card-body ' + cls[idx % 4] + '"><div class="ex-title">' + richHTML(cur.t) + '</div>'
       + '<div class="ex-body">' + richHTML(cur.b) + '</div></div>';
}
const sliceIdx = (l, c) => { for (let i = 0; i < l.length; i++) if (l[i] === c) return i; return 0; };
function bindCards() {
  panelEl.querySelectorAll('.card-tab').forEach(b => {
    b.onclick = () => { state.cardTab = String(parseInt(b.dataset.i, 10) + 1); renderPanel(); needsRender = true; };
  });
}

/* ─────────── 页签 ①：互容（可控间隙） ─────────── */
function panelMutual() {
  const s = secEl('间隙 gap —— 拖它看受害线电位怎么变');
  addRange(s, { label: 'gap', min: 0.2, max: 4.0, step: 0.05, val: state.gap,
    fmt: v => v.toFixed(2) + ' W', get: () => state.gap,
    set: v => { state.gap = v; invalidateField(); updateAll(); } });
  const s2 = secEl('关键读数');
  s2.appendChild(h('<div id="liveRead"></div>').firstChild);
  const s3 = secEl('教学卡');
  s3.appendChild(h('<div id="liveCards">' + cardsHTML('mutual') + '</div>').firstChild);
  bindCards();
}
/* ─────────── 页签 ②：边沿 ─────────── */
function panelEdge() {
  const s = secEl('边沿时间 t_r —— 从 74 系列到现代芯片');
  addRange(s, { label: 't_r', min: 0, max: 40, step: 0.5, val: sliderFromTr(state.tr),
    fmt: k => trFromSlider(k) >= 1 ? trFromSlider(k).toFixed(2) + ' ns' : (trFromSlider(k) * 1e3).toFixed(0) + ' ps',
    get: () => sliderFromTr(state.tr),
    set: k => { state.tr = trFromSlider(k); updateAll(); } });
  const s2 = secEl('关键读数');
  s2.appendChild(h('<div id="liveRead"></div>').firstChild);
  const s3 = secEl('教学卡');
  s3.appendChild(h('<div id="liveCards">' + cardsHTML('edge') + '</div>').firstChild);
  bindCards();
}
const TR_MIN = 0.05, TR_MAX = 5.0, TR_N = 40;
const trFromSlider = k => TR_MIN * Math.pow(TR_MAX / TR_MIN, k / TR_N);
const sliderFromTr = v => Math.round(TR_N * Math.log(v / TR_MIN) / Math.log(TR_MAX / TR_MIN));

/* ─────────── 页签 ③：救活这块板 ─────────── */
const TRAILS = [
  { t: '间隙 → 3W', apply: () => { state.gap = 3.0; }, why: '受害线截获的漏场更少，互容下降' },
  { t: '边沿 → 1 ns', apply: () => { state.tr = 1.0; }, why: '电压爬坡变缓，du/dt 变小' },
  { t: '长度 → 5 cm', apply: () => { state.L = 5; }, why: '截获面积变小' },
];
function panelRescue() {
  const s = secEl('三个旋钮 —— 谁来把它救活？');
  addRange(s, { label: '间隙', wide: true, min: 0.2, max: 4.0, step: 0.05, val: state.gap,
    fmt: v => v.toFixed(2) + ' W', get: () => state.gap,
    set: v => { state.gap = v; invalidateField(); updateAll(); } });
  addRange(s, { label: '边沿 t_r', wide: true, min: 0, max: 40, step: 0.5, val: sliderFromTr(state.tr),
    fmt: k => trFromSlider(k) >= 1 ? trFromSlider(k).toFixed(2) + ' ns' : (trFromSlider(k) * 1e3).toFixed(0) + ' ps',
    get: () => sliderFromTr(state.tr), set: k => { state.tr = trFromSlider(k); updateAll(); } });
  addRange(s, { label: '平行长度', wide: true, min: 2, max: 20, step: 0.5, val: state.L,
    fmt: v => v.toFixed(1) + ' cm', get: () => state.L, set: v => { state.L = v; updateAll(); } });

  const s2 = secEl('一键试招（课件示意值 vs 本页严格场解）');
  const box = h('<div class="sub-chips" style="margin-bottom:8px"></div>').firstChild;
  TRAILS.forEach(tr => {
    const b = h('<button class="chip c on">' + richHTML(tr.t) + '</button>').firstChild;
    b.onclick = () => { tr.apply(); syncSliders(); invalidateField(); updateAll(); renderPanel(); toast(tr.t + '：' + tr.why); };
    box.appendChild(b);
  });
  s2.appendChild(box);
  s2.appendChild(h('<div id="liveRead"></div>').firstChild);
  s2.appendChild(h('<div id="trailTable"></div>').firstChild);

  const s3 = secEl('教学卡');
  s3.appendChild(h('<div id="liveCards">' + cardsHTML('rescue') + '</div>').firstChild);
  bindCards();
}

/* ═════════════════════════════ 读数与状态 ═════════════════════════════ */
function vvRow() {
  const vv = vvNow();
  const ratio = VvRatio(state.gap);
  return '<div class="kv"><span>受害线电位</span><b style="color:' + C.blue + '">' + vv.toFixed(3) + ' V</b></div>'
       + '<div class="kv"><span>耦合比 C_m / C_v</span><b>' + ratio.toFixed(4) + '</b></div>'
       + '<div class="kv"><span>互容 C_m</span><b>' + CmUnit(state.gap).toFixed(2) + ' pF/m</b></div>'
       + '<div class="kv"><span>受害线对地电容 C_v</span><b>' + CddUnit(state.gap).toFixed(1) + ' pF/m</b></div>';
}
function noiseHTML() {
  const nz = noiseOf();
  const over = nz.Vn > state.limit;
  const bad = over ? C.crimson : C.green;
  return '<div class="kv"><span>总互容 C_m·L</span><b>' + (nz.Cmt * 1e12).toFixed(3) + ' pF</b></div>'
       + '<div class="kv"><span>耦合电流 i = C·du/dt</span><b>' + (nz.i * 1e3).toFixed(2) + ' mA</b></div>'
       + '<div class="kv"><span>受害线噪声 V = i·Z₀/2</span><b style="color:' + bad + '">' + (nz.Vn * 1e3).toFixed(0) + ' mV</b></div>'
       + '<div class="kv"><span>噪声容限</span><b>' + (state.limit * 1e3).toFixed(0) + ' mV</b></div>'
       + '<div class="verdict ' + (over ? 'bad' : 'ok') + '">'
       + (over ? '⚠ 超容限 ' + ((nz.Vn - state.limit) * 1e3).toFixed(0) + ' mV —— 会误码'
               : '✓ 低于容限 ' + ((state.limit - nz.Vn) * 1e3).toFixed(0) + ' mV —— 安全') + '</div>';
}
function trailTableHTML() {
  const rows = [
    ['间隙 → 3W', '67 mV', v => { const o = state.gap; state.gap = 3.0; const r = noiseOf().Vn; state.gap = o; return r; }],
    ['边沿 → 1 ns', '50 mV', v => { const o = state.tr; state.tr = 1.0; const r = noiseOf().Vn; state.tr = o; return r; }],
    ['长度 → 5 cm', '165 mV', v => { const o = state.L; state.L = 5; const r = noiseOf().Vn; state.L = o; return r; }],
  ];
  let s = '<table class="trail"><tr><th>活路</th><th>课件示意</th><th>本页（其余不变）</th></tr>';
  for (const r of rows) s += '<tr><td>' + r[0] + '</td><td class="dim">' + r[1] + '</td><td class="me">' + (r[2]() * 1e3).toFixed(0) + ' mV</td></tr>';
  s += '</table><div class="ex-note">课件给的是教学示意值。本页每一格都是同一套场解当场算出来的：<b>边沿那一路精确吻合（50 mV）</b>；间隙与长度两路的绝对值和课件略有出入，因为互容随间隙是幂律下降（≈ gap<sup>-1.2</sup>）而不是线性的。</div>';
  return s;
}
function updateLivePanels() {
  const lr = document.getElementById('liveRead');
  if (lr) lr.innerHTML = state.mode === 'mutual' ? vvRow() : noiseHTML();
  const tt = document.getElementById('trailTable');
  if (tt) tt.innerHTML = trailTableHTML();
}
function updateReadout() {
  const strip = document.getElementById('coordStrip');
  if (!strip) return;
  const nz = noiseOf();
  const over = nz.Vn > state.limit;
  const chips = [
    kchip('间隙 gap', state.gap.toFixed(2) + ' W'),
    kchip('互容 C_m', CmUnit(state.gap).toFixed(2) + ' pF/m'),
    kchip('受害线电位', vvNow().toFixed(3) + ' V', 'acc'),
    kchip('边沿 t_r', state.tr >= 1 ? state.tr.toFixed(2) + ' ns' : (state.tr * 1e3).toFixed(0) + ' ps'),
    kchip('平行长度 L', state.L.toFixed(1) + ' cm'),
    kchip('耦合电流', (nz.i * 1e3).toFixed(2) + ' mA'),
    kchip('噪声电压', (nz.Vn * 1e3).toFixed(0) + ' mV', over ? 'warn' : 'acc'),
    kchip('容限', (state.limit * 1e3).toFixed(0) + ' mV'),
    kchip('状态', over ? '⚠ 超限' : '✓ 安全', over ? 'warn' : 'acc'),
  ];
  strip.innerHTML = chips.join('');
}
function updateModeTag() {
  const el = document.getElementById('modeTag'); if (!el) return;
  const nz = noiseOf();
  let s;
  if (state.mode === 'mutual') s = '受害线悬空 ⇒ 净电荷为零 ⇒ 电位被抬到 ' + vvNow().toFixed(2) + ' V';
  else if (state.mode === 'edge') s = '边沿 ' + (state.tr >= 1 ? state.tr.toFixed(2) + ' ns' : (state.tr * 1e3).toFixed(0) + ' ps')
    + ' ⇒ 噪声 ' + (nz.Vn * 1e3).toFixed(0) + ' mV（容限 ' + (state.limit * 1e3).toFixed(0) + ' mV）';
  else s = (nz.Vn > state.limit ? '⚠ 噪声 ' + (nz.Vn * 1e3).toFixed(0) + ' mV 超容限 '
                                : '✓ 噪声 ' + (nz.Vn * 1e3).toFixed(0) + ' mV 已降到容限下 ') + '· 动旋钮前先想清楚场的道理';
  el.innerHTML = richHTML(s);
  const lg = document.getElementById('lgTitle'), ln = document.getElementById('lgNote');
  if (lg) lg.textContent = state.mode === 'mutual' ? '互容 C_m' : '耦合噪声';
  if (ln) ln.innerHTML = richHTML(state.mode === 'mutual'
    ? '受害线悬空 · 净电荷为零 · V_v/V_dd = C_m/C_v'
    : 'i = C·du/dt · V_noise = i·Z₀/2 · 3.3 V 逻辑容限 ≈ 350 mV');
}
function toast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ═════════════════════════════ 场景/场解刷新 ═════════════════════════════ */
let solveDirty = true;
function invalidateField() { solveDirty = true; needsRender = true; }
function solveFieldNow() {
  const g = FAR.g; if (!g) return;
  const gap = state.gap;
  const m = pcbMasks(g, gap);
  const A = pcbSolveField(g, [[m.drv, 1.0], [m.vic, 0.0], [g.gnd, 0.0]], FAR.VA, 900, 1.9, 1e-4);
  FAR.VA = A.V; FAR.sweeps = A.sweeps;
  const B = pcbSolveField(g, [[m.drv, 0.0], [m.vic, 1.0], [g.gnd, 0.0]], FAR.VB, 900, 1.9, 1e-4);
  FAR.VB = B.V;
  const vv = VvRatio(gap);
  const V = new Float64Array(g.N);
  for (let i = 0; i < g.N; i++) V[i] = FAR.VA[i] + vv * (FAR.VB[i] - FAR.VA[i]);
  FAR.V = V; FAR.gap = gap;
  needsRender = true;
}

/* ═════════════════════════════ 渲染循环 ═════════════════════════════ */
let needsRender = true;
function draw() {
  setupCamera(); ctx.clearRect(0, 0, W, H);
  buildScene();
  prims.sort((a, b) => a.z - b.z);
  for (const p of prims) p.draw(ctx);
  drawOverlays();
  needsRender = false;
}
function tick() {
  try {
    if (solveDirty) { solveDirty = false; solveFieldNow(); updateLivePanels(); updateReadout(); }
    if (state.autoRotate) { cam.px += 0.35; needsRender = true; }
    if (needsRender) draw();
  } catch (err) { needsRender = false; console.error('draw/tick error:', err); }
  requestAnimationFrame(tick);
}
function updateAll() { needsRender = true; syncSliders(); updateLivePanels(); updateReadout(); updateModeTag(); }

/* ═════════════════════════════ 交互 ═════════════════════════════ */
const canvasEl = document.getElementById('cv');
ctx = canvasEl.getContext('2d');
let drag = null;
const localPos = ev => { const r = canvasEl.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
canvasEl.addEventListener('pointerdown', ev => {
  canvasEl.setPointerCapture(ev.pointerId);
  const m = localPos(ev); drag = { x: m.x, y: m.y }; ev.preventDefault();
});
canvasEl.addEventListener('pointermove', ev => {
  if (!drag) return;
  const m = localPos(ev), dx = m.x - drag.x, dy = m.y - drag.y;
  drag.x = m.x; drag.y = m.y;
  cam.px += dx; cam.py += dy; needsRender = true;
});
canvasEl.addEventListener('pointerup', () => { drag = null; });
canvasEl.addEventListener('pointercancel', () => { drag = null; });
canvasEl.addEventListener('contextmenu', e => e.preventDefault());
canvasEl.addEventListener('wheel', e => {
  e.preventDefault();
  cam.zoom = Math.max(0.5, Math.min(3.0, cam.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
  needsRender = true;
}, { passive: false });
document.getElementById('btnReset').onclick = () => {
  cam.zoom = 1; cam.px = 0; cam.py = 0; state.autoRotate = false; needsRender = true;
};
document.getElementById('btnRotate').onclick = e => {
  state.autoRotate = !state.autoRotate; e.target.classList.toggle('on', state.autoRotate);
};
document.getElementById('btnPanReset').onclick = () => { cam.px = 0; cam.py = 0; needsRender = true; };
function bindFold(bid, cls) {
  document.getElementById(bid).onclick = () => {
    document.body.classList.toggle(cls); setTimeout(resize, 60); setTimeout(resize, 260);
  };
}
bindFold('foldNav', 'nav-off'); bindFold('foldPanel', 'panel-off');
document.getElementById('tglNav').onclick = () => { document.body.classList.toggle('nav-off'); setTimeout(resize, 260); };
document.getElementById('tglPanel').onclick = () => { document.body.classList.toggle('panel-off'); setTimeout(resize, 260); };
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === '[') { document.body.classList.toggle('nav-off'); setTimeout(resize, 260); }
  if (e.key === ']') { document.body.classList.toggle('panel-off'); setTimeout(resize, 260); }
});
const modeTabsEl = document.getElementById('modeTabs');
MT.forEach(m => {
  const b = document.createElement('button'); b.textContent = m.t; b.dataset.k = m.k;
  b.onclick = () => {
    state.mode = m.k; state.cardTab = '1';
    state.show.scope = (m.k !== 'mutual');
    syncModeTabs(); cam.px = 0; cam.py = 0; cam.zoom = 1;
    renderPanel(); invalidateField(); updateAll();
  };
  modeTabsEl.appendChild(b);
});
function syncModeTabs() {
  Array.from(modeTabsEl.children).forEach(b => b.classList.toggle('on', b.dataset.k === state.mode));
}
function resize() {
  const r = canvasEl.getBoundingClientRect();
  const nw = Math.max(60, Math.round(r.width)), nh = Math.max(60, Math.round(r.height));
  DPR = Math.min(2, window.devicePixelRatio || 1);
  if (nw === W && nh === H && canvasEl.width === Math.round(nw * DPR)) return;
  W = nw; H = nh; canvasEl.width = Math.round(W * DPR); canvasEl.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); needsRender = true;
}
new ResizeObserver(() => resize()).observe(canvasEl);

/* ═════════════════════════════ 启动 ═════════════════════════════ */
const navEl = document.getElementById('nav');
NAV.forEach(gp => {
  navEl.appendChild(h('<div class="nav-ch">' + gp.ch + '</div>'));
  gp.items.forEach(it => {
    const cls = 'nav-item' + (it.active ? ' active' : '') + (it.ready ? '' : ' soon');
    navEl.appendChild(h('<a class="' + cls + '" ' + (it.href ? 'href="' + it.href + '"' : '') + '><span class="dot"></span>' + it.t + '</a>'));
  });
});

function renderPanel() {
  if (!panelEl) return;
  sliders.length = 0;
  panelEl.innerHTML = '';
  if (state.mode === 'mutual') panelMutual();
  else if (state.mode === 'edge') panelEdge();
  else panelRescue();
  updateLivePanels();
  syncSliders();
}
FAR.g = pcbGrid(PCB_GEO);
syncModeTabs();
resize();
renderPanel();
solveFieldNow();
updateAll();
tick();
