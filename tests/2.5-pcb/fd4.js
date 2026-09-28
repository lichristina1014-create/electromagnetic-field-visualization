'use strict';
/* ============================================================================
   2.5 页面内嵌求解器：微带线对横截面的 2D 拉普拉斯有限差分（red-black SOR）
   —— 与 /tmp/pcb/fdm.py、fd3.js 同源，已交叉验证（逐位一致）。

   单位：长度以线宽 W 归一；y 从板底往上（y<=h 介质 / y>h 空气 / y<=t 回流平面）。
   固定计算域：板宽恒定 12.4W、驱动线钉在 x∈[0,W]，受害线随 gap 右移 ⇒
   网格与介电系数**不随 gap 改变**，只有导体掩码变 ⇒ 可继承上一帧的解做初值。
   ============================================================================ */
const EPS0 = 8.8541878128e-12;
const epsf = (a, b) => 2 * a * b / (a + b);

const PCB_GEO = { W: 1.0, h: 1.0, t: 0.175, er: 4.3, x0: -3.2, x1: 9.2, ytop: 5.0, nx: 280 };

function pcbGrid(o) {
  o = o || {};
  const W = o.W != null ? o.W : 1.0, h = o.h != null ? o.h : 1.0;
  const t = o.t != null ? o.t : 0.175, er = o.er != null ? o.er : 4.3;
  const x0 = o.x0 != null ? o.x0 : -3.2, x1 = o.x1 != null ? o.x1 : 9.2;
  const ytop = o.ytop != null ? o.ytop : 5.0, nx = o.nx != null ? o.nx : 280;
  const dx = (x1 - x0) / nx, ny = Math.round(ytop / dx), N = nx * ny;
  const Xs = new Float64Array(nx), Ys = new Float64Array(ny);
  for (let ix = 0; ix < nx; ix++) Xs[ix] = x0 + (ix + 0.5) * dx;
  for (let iy = 0; iy < ny; iy++) Ys[iy] = (iy + 0.5) * dx;
  const eps = new Float64Array(N);
  for (let iy = 0; iy < ny; iy++) {
    const air = Ys[iy] > h;
    for (let ix = 0; ix < nx; ix++) eps[iy * nx + ix] = air ? 1.0 : er;
  }
  const ex = new Float64Array(N), exm = new Float64Array(N),
        ey = new Float64Array(N), eym = new Float64Array(N), den = new Float64Array(N);
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const i = iy * nx + ix, e = eps[i];
    if (ix > 0) ex[i] = epsf(e, eps[i - 1]);
    if (ix < nx - 1) exm[i] = epsf(eps[i + 1], e);
    if (iy > 0) ey[i] = epsf(e, eps[i - nx]);
    if (iy < ny - 1) eym[i] = epsf(eps[i + nx], e);
    den[i] = ex[i] + exm[i] + ey[i] + eym[i];
  }
  const gnd = new Uint8Array(N);
  for (let iy = 0; iy < ny; iy++) if (Ys[iy] <= t) {
    const base = iy * nx;
    for (let ix = 0; ix < nx; ix++) gnd[base + ix] = 1;
  }
  return { nx, ny, N, dx, x0, x1, ytop, Xs, Ys, eps, ex, exm, ey, eym, den, gnd,
           W, h, t, er };
}

/* 两条走线的掩码（gap 是唯一自变量） */
function pcbMasks(g, gap) {
  const nx = g.nx, ny = g.ny, W = g.W, h = g.h, t = g.t;
  const drv = new Uint8Array(g.N), vic = new Uint8Array(g.N);
  for (let iy = 0; iy < ny; iy++) {
    const Y = g.Ys[iy];
    if (!(Y >= h && Y <= h + t)) continue;
    const base = iy * nx;
    for (let ix = 0; ix < nx; ix++) {
      const X = g.Xs[ix];
      if (X >= 0 && X <= W) drv[base + ix] = 1;
      if (X >= W + gap && X <= 2 * W + gap) vic[base + ix] = 1;
    }
  }
  return { drv, vic };
}

/* init 可传上一帧的解做初值（几何只微变时收敛极快） */
function pcbSolveField(g, fixed, init, sweeps, omega, tol) {
  sweeps = sweeps || 1500; omega = omega || 1.9; tol = tol || 1e-6;
  const nx = g.nx, ny = g.ny, N = g.N;
  const V = init && init.length === N ? init : new Float64Array(N);
  const free = new Uint8Array(N).fill(1);
  for (let k = 0; k < fixed.length; k++) {
    const m = fixed[k][0], val = fixed[k][1];
    for (let i = 0; i < N; i++) if (m[i]) { V[i] = val; free[i] = 0; }
  }
  const ex = g.ex, exm = g.exm, ey = g.ey, eym = g.eym, den = g.den;
  let s = 0;
  for (s = 0; s < sweeps; s++) {
    let dmax = 0;
    for (let par = 0; par < 2; par++) {
      for (let iy = 0; iy < ny; iy++) {
        let ix = ((iy & 1) === par) ? 0 : 1;
        for (; ix < nx; ix += 2) {
          const i = iy * nx + ix;
          if (!free[i] || den[i] <= 0) continue;
          const ir = (ix < nx - 1) ? i + 1 : iy * nx;
          const il = (ix > 0) ? i - 1 : iy * nx + nx - 1;
          const idn = (iy < ny - 1) ? i + nx : ix;
          const iup = (iy > 0) ? i - nx : (ny - 1) * nx + ix;
          const nv = (ex[i] * V[ir] + exm[i] * V[il] + ey[i] * V[idn] + eym[i] * V[iup]) / den[i];
          const diff = nv > V[i] ? nv - V[i] : V[i] - nv;
          if (diff > dmax) dmax = diff;
          V[i] += omega * (nv - V[i]);
        }
      }
    }
    if (dmax < tol) break;
  }
  return { V, sweeps: s + 1 };
}

/* 导体净电荷（单位 ε₀·V），面介电常数取相邻两点算术平均（与参考实现同口径） */
function pcbCharge(V, g, mask) {
  const nx = g.nx, ny = g.ny, eps = g.eps;
  let Vc = 0;
  for (let i = 0; i < g.N; i++) if (mask[i]) { Vc = V[i]; break; }
  let tot = 0;
  for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
    const i = iy * nx + ix;
    if (!mask[i]) continue;
    const e = eps[i];
    if (ix < nx - 1 && !mask[i + 1]) tot += 0.5 * (e + eps[i + 1]) * (Vc - V[i + 1]);
    if (ix > 0 && !mask[i - 1]) tot += 0.5 * (e + eps[i - 1]) * (Vc - V[i - 1]);
    if (iy < ny - 1 && !mask[i + nx]) tot += 0.5 * (e + eps[i + nx]) * (Vc - V[i + nx]);
    if (iy > 0 && !mask[i - nx]) tot += 0.5 * (e + eps[i - nx]) * (Vc - V[i - nx]);
  }
  return tot;
}

/* 一次完整解：Cm(互容)、Cv(受害线对地电容)、Vv/Vdd（悬空受害线的电位比）
   ★ Vv = Cm/Cv —— 悬空导体净电荷为零 ⇒ −Cm·Vd + Cv·Vv = 0 */
function pcbCaps(g, gap, cache, tol) {
  const m = pcbMasks(g, gap);
  const A = pcbSolveField(g, [[m.drv, 1.0], [m.vic, 0.0], [g.gnd, 0.0]],
                          cache && cache.VA, 1500, 1.9, tol || 1e-6);
  const qvA = pcbCharge(A.V, g, m.vic);
  const B = pcbSolveField(g, [[m.drv, 0.0], [m.vic, 1.0], [g.gnd, 0.0]],
                          cache && cache.VB, 1500, 1.9, tol || 1e-6);
  const qvB = pcbCharge(B.V, g, m.vic);
  return { Cm: -qvA, Cv: qvB, Vv: -qvA / qvB, masks: m,
           s1: A.sweeps, s2: B.sweeps, VA: A.V, VB: B.V };
}

module.exports = { pcbGrid, pcbMasks, pcbSolveField, pcbCharge, pcbCaps, PCB_GEO, EPS0, epsf };

if (require.main === module) {
  let t0 = Date.now();
  const g = pcbGrid(PCB_GEO);
  console.log('网格 %dx%d (dx=%s, N=%d) 建立 %d ms', g.nx, g.ny, g.dx.toFixed(5), g.N, Date.now() - t0);
  console.log('gap/W    Cm_geo    Cv_geo   Vv/Vdd   Cm(pF/m)  Cv(pF/m)  sweeps   冷启动');
  let cache = null;
  for (const gap of [0.3, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0]) {
    t0 = Date.now(); const r = pcbCaps(g, gap, cache); const warm = Date.now() - t0;
    cache = { VA: r.VA, VB: r.VB };
    console.log('%s %s %s %s %s %s  %d/%d   %dms',
      gap.toFixed(1).padStart(5), r.Cm.toFixed(4).padStart(9), r.Cv.toFixed(4).padStart(9),
      r.Vv.toFixed(4).padStart(8), (r.Cm * EPS0 * 1e12).toFixed(3).padStart(9),
      (r.Cv * EPS0 * 1e12).toFixed(3).padStart(9), r.s1, r.s2, warm);
  }
  /* 增量拖动：从 gap=1 每次 +0.02，看单步耗时 */
  const r1 = pcbCaps(g, 1.0, null);
  let c = { VA: r1.VA, VB: r1.VB }, tAll = 0, n = 0;
  t0 = Date.now();
  for (let gap = 1.02; gap <= 2.001; gap += 0.02) {
    const rr = pcbCaps(g, gap, c); c = { VA: rr.VA, VB: rr.VB }; n++;
  }
  tAll = Date.now() - t0;
  console.log('\n增量拖动 %d 步：合计 %d ms，平均 %.1f ms/步（≈%.0f fps）',
              n, tAll, tAll / n, 1000 / (tAll / n));
  /* 对照：冷启动同一 gap 是否与热启动一致 */
  const a = pcbCaps(g, 1.5, null), b = pcbCaps(g, 1.5, { VA: a.VA, VB: a.VB });
  console.log('gap=1.5 冷/热：Cm %s vs %s ｜ Vv %s vs %s',
    a.Cm.toFixed(6), b.Cm.toFixed(6), a.Vv.toFixed(6), b.Vv.toFixed(6));
}
