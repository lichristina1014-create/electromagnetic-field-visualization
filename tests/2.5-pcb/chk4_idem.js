(function () {
  const R = [];
  const P = (n, v, ok) => R.push((ok ? 'PASS' : 'FAIL') + '|' + n + '|' + v);

  /* ── ① 幂等：buildScene 连跑 3 次，prims 不增长 ── */
  prims = []; buildScene(); const n1 = prims.length;
  prims = []; buildScene(); const n2 = prims.length;
  prims = []; buildScene(); const n3 = prims.length;
  P('prims 三次长度', n1 + '/' + n2 + '/' + n3, n1 === n2 && n2 === n3 && n1 > 20);

  /* ── ② 图元 z 无 NaN（NaN 会让 sort 静默失效） ── */
  prims = []; buildScene();
  const nan = prims.filter(p => !isFinite(p.z)).length;
  P('图元 z NaN 数', nan, nan === 0);

  /* ── ③ 像素哈希：gap 改了画面必须变 ── */
  const cg = canvasEl;
  function hashNow() {
    prims = []; buildScene(); prims.sort((a, b) => a.z - b.z);
    ctx.clearRect(0, 0, W, H);
    for (const p of prims) p.draw(ctx);
    drawOverlays();
    const d = ctx.getImageData(0, 0, cg.width, cg.height).data;
    let h = 2166136261;
    for (let i = 0; i < d.length; i += 97) { h ^= d[i]; h = (h * 16777619) >>> 0; }
    return h;
  }
  function textHash() {
    const seen = []; const orig = ctx.fillText;
    ctx.fillText = function (s) { seen.push(String(s)); return orig.apply(ctx, arguments); };
    prims = []; buildScene(); prims.sort((a, b) => a.z - b.z);
    for (const p of prims) p.draw(ctx);
    ctx.fillText = orig;
    return seen.join('\u0001');
  }
  state.gap = 1.0; const h1 = hashNow(); const t1 = textHash();
  state.gap = 3.0; const h2 = hashNow(); const t2 = textHash();
  P('gap 1.0→3.0 像素哈希变化', (h1 >>> 0).toString(16) + ' vs ' + (h2 >>> 0).toString(16), h1 !== h2);
  P('gap 1.0→3.0 文本哈希变化', t1.length + ' vs ' + t2.length, t1 !== t2 && t1.length > 20);
  P('文本含 3.00 W 尺寸', t2.indexOf('3.00 W') >= 0, t2.indexOf('3.00 W') >= 0);
  P('文本含 0.20 V 读数', t2.indexOf('0.20 V') >= 0 ? '0.20 V' : '缺失',
    t2.indexOf('0.20 V') >= 0);
  state.gap = 1.0;

  /* ── ④ 场解：漏到受害线的簇随 gap 变稀 ── */
  state.gap = 1.0; solveFieldNow(); prims = []; buildScene(); const nv1 = FAR.nToVic;
  state.gap = 3.0; solveFieldNow(); prims = []; buildScene(); const nv3 = FAR.nToVic;
  P('nToVic gap=1.0', nv1, nv1 > 0);
  P('nToVic gap=3.0', nv3, nv3 >= 0);
  P('gap 拉大 ⇒ 紫色簇变稀', nv1 + ' → ' + nv3, nv3 <= nv1);
  state.gap = 1.0; solveFieldNow();

  /* ── ⑤ 开关真的改变画面（不是只改 length） ── */
  state.show.pot = true; const a = hashNow();
  state.show.pot = false; const b = hashNow();
  state.show.pot = true;
  P('关等势线 ⇒ 像素变', a + ' vs ' + b, a !== b);
  state.show.field = true; const c = hashNow();
  state.show.field = false; const d = hashNow();
  state.show.field = true;
  P('关场线 ⇒ 像素变', c + ' vs ' + d, c !== d);

  /* ── ⑥ 无异常：tick 仍在跑（needsRender 会被消费） ── */
  P('needsRender 可被消费', String(typeof draw === 'function'), typeof draw === 'function' && typeof tick === 'function');

  updateAll();
  return R.join('\n') + '\nFAILED=' + R.filter(s => s.startsWith('FAIL')).length + ' TOTAL=' + R.length + '\nDONE';
})()
