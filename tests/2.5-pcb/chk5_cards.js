(function () {
  const R = [];
  const P = (n, v, ok) => R.push((ok ? 'PASS' : 'FAIL') + '|' + n + '|' + v);

  /* 卡片矩形（必须与 app 段② 里的取法一致） */
  const y0 = H - 126 - 14, y1 = H - 14;
  const CARD = {
    net: { x0: W - 212 - 14, x1: W - 14, y0: y0, y1: y1 },
    scope: { x0: Math.round((W - 240) / 2), x1: Math.round((W - 240) / 2) + 240, y0: y0, y1: y1 },
    stats: { x0: 14, x1: 204, y0: y0, y1: y1 },
  };

  /* 给 P_ 压进来的图元打「属于哪张卡」的标 */
  let cur = null; const tag = new Map();
  ['drawNet', 'drawScope', 'drawStats'].forEach(n => {
    const f = globalThis[n];
    globalThis[n] = function () { const pv = cur; cur = n; try { return f.apply(this, arguments); } finally { cur = pv; } };
  });
  const origP = globalThis.P_;
  globalThis.P_ = function (z, fn) { if (cur) tag.set(fn, cur); return origP(z, fn); };

  /* 捕获绘图坐标 */
  const pts = [];
  const methods = ['moveTo', 'lineTo', 'fillRect', 'strokeRect', 'rect', 'arc', 'quadraticCurveTo', 'ellipse', 'fillText'];
  const origs = {};
  let active = null;
  methods.forEach(m => {
    origs[m] = ctx[m];
    ctx[m] = function () {
      if (active) {
        const a = Array.prototype.slice.call(arguments);
        const nums = a.filter(x => typeof x === 'number');
        if (m === 'fillText' || m === 'lineTo' || m === 'moveTo' || m === 'arc' || m === 'ellipse') pts.push([m, nums[0], nums[1]]);
        else if (m === 'fillRect' || m === 'strokeRect' || m === 'rect') { pts.push([m, nums[0], nums[1]]); pts.push([m, nums[0] + nums[2], nums[1] + nums[3]]); }
        else if (m === 'quadraticCurveTo') { pts.push([m, nums[0], nums[1]]); pts.push([m, nums[2], nums[3]]); }
      }
      return origs[m].apply(ctx, arguments);
    };
  });

  prims = []; buildScene(); prims.sort((a, b) => a.z - b.z);
  R.push('INFO|卡片图元数|' + prims.filter(p => tag.has(p.draw)).length + ' / ' + prims.length);
  const bad = [];
  for (const p of prims) {
    const t = tag.get(p.draw); if (!t) continue;
    const c = CARD[t]; if (!c) continue;
    active = t; pts.length = 0; p.draw(ctx); active = null;
    for (const q of pts) {
      const m = 10;   /* 允许 10px 溢出（线宽/箭头/圆角） */
      if (q[1] < c.x0 - m || q[1] > c.x1 + m || q[2] < c.y0 - m || q[2] > c.y1 + m)
        bad.push(t + ':' + q[0] + '(' + q[1].toFixed(0) + ',' + q[2].toFixed(0) + ')');
    }
  }
  P('卡片坐标越界数', bad.length, bad.length === 0);
  if (bad.length) R.push('INFO|越界清单|' + bad.slice(0, 8).join(' ; '));

  /* 三张卡互不重叠 */
  const ks = Object.keys(CARD);
  let ov = [];
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const a = CARD[ks[i]], b = CARD[ks[j]];
    if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0)
      ov.push(ks[i] + '×' + ks[j]);
  }
  P('卡片互相重叠', ov.join(',') || '无', ov.length === 0);

  prims = [];
  return R.join('\n') + '\nFAILED=' + R.filter(s => s.startsWith('FAIL')).length + ' TOTAL=' + R.length + '\nDONE';
})()
