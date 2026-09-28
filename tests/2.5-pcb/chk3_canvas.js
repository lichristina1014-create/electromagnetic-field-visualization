(function () {
  const R = [];
  const P = (n, v, ok) => R.push((ok ? 'PASS' : 'FAIL') + '|' + n + '|' + v);

  /* ⚠️ 卡片（drawNet/drawScope/drawStats）的绘制体是 P_ 压进来的**延迟闭包**，
     要到逐图元执行时才跑 ⇒ 不能"调用期打标"，必须**给图元打标**。 */
  let inCard = 0; const cardPrims = new Set();
  ['drawNet', 'drawScope', 'drawStats'].forEach(n => {
    const f = globalThis[n];
    globalThis[n] = function () { inCard++; try { return f.apply(this, arguments); } finally { inCard--; } };
  });
  const origP = globalThis.P_;
  globalThis.P_ = function (z, fn) { if (inCard > 0) cardPrims.add(fn); return origP(z, fn); };

  const seen = [];
  const orig = ctx.fillText;
  let scene = true;
  ctx.fillText = function (s, x, y) {
    if (scene) seen.push({ s: String(s), x: x, y: y, font: ctx.font, al: ctx.textAlign });
    return orig.apply(ctx, arguments);
  };
  prims = []; buildScene(); prims.sort((a, b) => a.z - b.z);
  for (const p of prims) { scene = !cardPrims.has(p.draw); p.draw(ctx); }
  ctx.fillText = orig;

  R.push('INFO|图元|总=' + prims.length + ' 卡片内=' + prims.filter(p => cardPrims.has(p.draw)).length + ' 画布=' + W + 'x' + H + ' camScale=' + camScale.toFixed(2));

  const fs = f => { const m = /(\d+(?:\.\d+)?)px/.exec(f || ''); return m ? parseFloat(m[1]) : 12; };
  const bx = t => {
    let w = 0; try { ctx.font = t.font; w = ctx.measureText(t.s).width; } catch (e) { w = t.s.length * fs(t.font) * 0.6; }
    const a = t.al || 'start', h = fs(t.font);
    const left = a === 'center' ? t.x - w / 2 : (a === 'right' || a === 'end') ? t.x - w : t.x;
    return { s: t.s, l: left, r: left + w, tp: t.y - 0.80 * h, bt: t.y + 0.22 * h, w: w, h: h };
  };
  const B = seen.map(bx).filter(b => b.s.trim().length > 0);
  R.push('INFO|场景文本|' + B.map(b => b.s + '@' + b.l.toFixed(0) + ',' + b.tp.toFixed(0)).join(' | '));

  P('场景文本条数', B.length, B.length >= 8 && B.length <= 20);
  const out = B.filter(b => b.l < -1 || b.r > W + 1 || b.tp < -1 || b.bt > H + 1);
  P('越界文本数', out.length, out.length === 0);
  if (out.length) R.push('INFO|越界明细|' + out.map(b => b.s + ' l=' + b.l.toFixed(1) + ' r=' + b.r.toFixed(1) + ' tp=' + b.tp.toFixed(1) + ' bt=' + b.bt.toFixed(1)).join(' ; '));

  /* 两两叠字（重叠面积 / 较小面积） */
  const pairs = [];
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], b = B[j];
    const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
    const oy = Math.min(a.bt, b.bt) - Math.max(a.tp, b.tp);
    if (ox <= 0 || oy <= 0) continue;
    pairs.push({ a: a.s, b: b.s, q: (ox * oy) / Math.min(a.w * a.h, b.w * b.h), ox: ox, oy: oy });
  }
  pairs.sort((x, y) => y.q - x.q);
  P('叠字对数(>35%)', pairs.filter(p => p.q > 0.35).length, pairs.filter(p => p.q > 0.35).length === 0);
  R.push('INFO|叠字 TOP4|' + (pairs.slice(0, 4).map(p => '"' + p.a + '"×"' + p.b + '" q=' + (p.q * 100).toFixed(0) + '%').join(' ; ') || '无'));

  /* 关键标注必须在场 */
  const all = B.map(b => b.s).join('\u0001');
  const must = ['驱动线', '受害线', '回流平面', 'FR4', 'W', 'h', 't', '1.00 W', '0.69 V'];
  const miss = must.filter(m => all.indexOf(m) < 0);
  P('关键标注缺失数', miss.length, miss.length === 0);
  if (miss.length) R.push('INFO|缺失标注|' + miss.join(','));

  /* 场景标注 vs 叠加卡 / 顶部 DOM UI 不得相交 */
  const cards = [
    { n: 'scope', x0: Math.round((W - 240) / 2), x1: Math.round((W - 240) / 2) + 240, y0: H - 140, y1: H - 14 },
    { n: 'net', x0: W - 226, x1: W - 14, y0: H - 140, y1: H - 14 },
  ];
  if (W >= 700) cards.push({ n: 'stats', x0: 14, x1: 204, y0: H - 140, y1: H - 14 });
  const cr = canvasEl.getBoundingClientRect();
  ['modeTag', 'viewToggles', 'panTag'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1) return;
    cards.push({ n: 'dom#' + id, x0: r.left - cr.left, x1: r.right - cr.left, y0: r.top - cr.top, y1: r.bottom - cr.top });
  });
  const hit = [];
  for (const b of B) for (const c of cards) {
    const ox = Math.min(b.r, c.x1) - Math.max(b.l, c.x0);
    const oy = Math.min(b.bt, c.y1) - Math.max(b.tp, c.y0);
    if (ox > 1 && oy > 1) hit.push('"' + b.s + '"×' + c.n);
  }
  P('场景标注压卡数', hit.length, hit.length === 0);
  if (hit.length) R.push('INFO|压卡清单|' + hit.join(' ; '));

  /* 走线必须占满画面宽度：间隙自适应取景的验收判据 */
  const drv = B.find(b => b.s === '驱动线'), vic = B.find(b => b.s === '受害线');
  P('两条走线标签都在', (drv ? 1 : 0) + '/' + (vic ? 1 : 0), !!drv && !!vic);
  if (drv && vic) {
    const span = vic.r - drv.l;
    P('剖面横向占比 %', (span / W * 100).toFixed(1), span / W > 0.42);
  }

  prims = [];
  return R.join('\n') + '\nFAILED=' + R.filter(s => s.startsWith('FAIL')).length + ' TOTAL=' + R.length + '\nDONE';
})()
