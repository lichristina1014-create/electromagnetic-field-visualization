(function () {
  const R = [];
  const P = (n, v, ok) => R.push((ok ? 'PASS' : 'FAIL') + '|' + n + '|' + v);
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  /* ── ① 定标：课件图A 1W 给 0.69 V ── */
  const vv1 = VvRatio(1.0);
  P('VvRatio(1.00W)', vv1.toFixed(5), near(vv1, 0.2090, 0.004));
  const vvN = vvNow();
  P('vvNow() V', vvN.toFixed(4), near(vvN, 0.690, 0.015));
  const cm1 = CmUnit(1.0);
  P('CmUnit(1.00W) pF/m', cm1.toFixed(4), near(cm1, 6.330, 0.20));
  const cv1 = CddUnit(1.0);
  P('CddUnit(1.00W) pF/m', cv1.toFixed(3), near(cv1, 36.61, 1.2));

  /* ── ② 单调性：gap ↑ ⇒ 互容 ↓（表本身单调） ── */
  let bad = 0, prev = CmUnit(0.2);
  for (let gp = 0.25; gp <= 4.0001; gp += 0.05) { const c = CmUnit(gp); if (c > prev + 1e-9) bad++; prev = c; }
  P('Cm 单调递减违例数', bad, bad === 0);
  P('Cm(0.5)>Cm(1)>Cm(3)>Cm(4)', [CmUnit(0.5), CmUnit(1), CmUnit(3), CmUnit(4)].map(x => x.toFixed(3)).join('>'),
    CmUnit(0.5) > CmUnit(1) && CmUnit(1) > CmUnit(3) && CmUnit(3) > CmUnit(4));

  /* ── ③ Cm 幂律指数 ≈ -1.2（教学卡里写的那个） ── */
  const k = Math.log(CmUnit(3) / CmUnit(1)) / Math.log(3);
  P('Cm 幂律指数', k.toFixed(3), near(k, -1.17, 0.22));

  /* ── ④ 动态公式（逐字稿 495 mV 那一页） ── */
  const nz = noiseOf();
  P('总互容 Cmt pF', (nz.Cmt * 1e12).toFixed(4), near(nz.Cmt * 1e12, 0.633, 0.02));
  P('耦合电流 i mA', (nz.i * 1e3).toFixed(3), near(nz.i * 1e3, 20.89, 0.6));
  P('噪声 Vn mV', (nz.Vn * 1e3).toFixed(2), near(nz.Vn * 1e3, 522, 10));
  P('超容限判定', String(nz.Vn > state.limit), nz.Vn > state.limit);

  /* ── ⑤ 噪声 ∝ 1/t_r ── */
  const sv = { gap: state.gap, tr: state.tr, L: state.L };
  state.tr = 0.1; const a1 = noiseOf().Vn;
  state.tr = 0.2; const a2 = noiseOf().Vn;
  state.tr = 0.4; const a3 = noiseOf().Vn;
  P('t_r ×2 ⇒ 噪声减半', (a1 / a2).toFixed(4), near(a1 / a2, 2, 0.02));
  P('t_r ×4 ⇒ 噪声四分之一', (a1 / a3).toFixed(4), near(a1 / a3, 4, 0.05));

  /* ── ⑥ 三条活路 ── */
  state.tr = sv.tr;                              /* ★ 先还原 t_r，否则活路数值被污染 */
  state.gap = 3.0; const t1 = noiseOf().Vn * 1e3;
  state.gap = sv.gap; state.tr = 1.0; const t2 = noiseOf().Vn * 1e3;
  state.tr = sv.tr; state.L = 5; const t3 = noiseOf().Vn * 1e3;
  state.L = sv.L;
  P('活路 间隙→3W mV', t1.toFixed(0), t1 > 130 && t1 < 155);
  P('活路 边沿→1ns mV', t2.toFixed(0), t2 > 46 && t2 < 58);
  P('活路 长度→5cm mV', t3.toFixed(0), t3 > 248 && t3 < 275);
  P('三条活路都进容限', [t1, t2, t3].every(v => v < state.limit * 1e3), [t1, t2, t3].every(v => v < state.limit * 1e3));

  /* ── ⑦ 状态还原 ── */
  P('状态已还原 gap/tr/L', [state.gap, state.tr, state.L].join('/'), state.gap === 1 && state.tr === 0.1 && state.L === 10);

  const f = R.filter(s => s.startsWith('FAIL')).length;
  return R.join('\n') + '\nFAILED=' + f + ' TOTAL=' + R.length + '\nDONE';
})()
