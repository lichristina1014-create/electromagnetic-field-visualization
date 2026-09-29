/* ═══════════════════════════════════════════════════════════════════════════
   2.5 多导体系统的电容与串扰 —— 页面主体
   渲染引擎（向量工具 / 富文本 / 图元）从 2.2 原样继承，此处只做两件事：
     ① 用「正交剖面相机」覆盖 setupCamera / pr —— 让世界 x→屏幕右、世界 z→屏幕上，
        世界 y 退化为纯图层深度。于是 PCB 横截面可以用精确的屏幕空间绘制（写实），
        同时所有既有图元（line/arrow/curve/poly/text/dimLine）继续可用（标注）。
   ═══════════════════════════════════════════════════════════════════════════ */

/* 显示窗口（世界坐标）：板宽方向 x、高度方向 z。
   ⚠️ 横向**必须随 gap 自适应**：写死一个大 x 区间会让 gap 小时两条走线挤成一条细带、
   画面上下留出大片空白（实测剖面只占画布 15% 高）。纵向 z 区间固定。 */
const VIEW = { z0: -0.30, z1: 1.92, padL: 1.05, padR: 0.56 };
const VCZ0 = (VIEW.z0 + VIEW.z1) / 2;
let VCX = 1.25, VCZ = VCZ0;
let BX0 = -2.30, BX1 = 4.80;            /* 介质板横向范围：总比视野宽 ⇒ 呈"长条板" */
const CAM_MAX = 205;                    /* 放大上限：gap 很小时别把剖面顶到顶部 UI 上 */
function setupCamera() {
  const gp = isFinite(state.gap) ? state.gap : 1.0;
  const x0 = -VIEW.padL, x1 = 2 + gp + VIEW.padR;
  const vw = x1 - x0, vh = VIEW.z1 - VIEW.z0;
  VCX = (x0 + x1) / 2; VCZ = VCZ0;
  camScale = Math.min(W / (vw + 0.30), H / (vh + 0.22), CAM_MAX) * cam.zoom;
  BX0 = x0 - 1.25; BX1 = x1 + 1.25;
  CX2 = W / 2; CY = H / 2;
}
function pr(p) {
  return { x: CX2 + cam.px + camScale * (p.x - VCX),
           y: CY + cam.py - camScale * (p.z - VCZ), d: -p.y };
}
const SX = x => CX2 + cam.px + camScale * (x - VCX);
const SY = z => CY + cam.py - camScale * (z - VCZ);
/* 图层高度（越小越靠后） */
const Z = { board: -60, gnd: -55, sub: -50, trace: -40, mask: -34, pot: 0, field: 10,
            net: 20, ui: 1e6 };

/* ═══════════════════════════════════════════════════ 目录 ═════════════════ */
const NAV = [
  { ch:'第 1 章 · 矢量分析', items:[
    { id:'coord',  t:'1.1 三种常见坐标系', ready:true, href:'index.html?v=20260929r19' },
    { id:'ch1-2',  t:'1.2 矢量的代数运算', ready:true, href:'1.2-vector-algebra.html?v=20260929r19' },
    { id:'ch1-3',  t:'1.3 方向导数与梯度', ready:true, href:'1.3-directional-derivative.html?v=20260929r19' },
    { id:'ch1-4',  t:'1.4 通量与散度',     ready:true, href:'1.4-divergence-flux.html?v=20260929r19' },
    { id:'ch1-5',  t:'1.5 环量与旋度',     ready:true, href:'1.5-curl-circulation.html?v=20260929r19' },
  ]},
  { ch:'第 2 章 · 静电场', items:[
    { id:'ch2-1', t:'2.1 电场强度与电荷密度', ready:true, href:'2.1-field-charge-density.html?v=20260929r19' },
    /* ⚠️ 此处原来 6 条链接**全都没有 ?v=**（全站唯一漏掉版本戳的 NAV）⇒
       从 2.5 点过去时命中的是不带参数的 URL，改过的页面会读到旧缓存。
       2026-09-28 补齐，与其余各页 NAV 的写法一致（index.html 不带参数）。 */
    { id:'ch2-2', t:'2.2 静电场中的导体', ready:true, href:'2.2-conductor-electrostatic.html?v=20260929r19' },
    { id:'ch2-3',  t:'2.3 静电场中的电介质',   ready:true, href:'2.3-dielectric-polarization.html?v=20260929r19' },
    { t:'2.4 高斯定理及其应用' },
    { id:'ch2-5', t:'2.5 多导体系统的电容与串扰', ready:true, active:true },
  ]},
  { ch:'第 3 章 · 恒定磁场', items:[ {t:'3.1 比奥-萨伐尔定律'}, {t:'3.2 安培环路定理'} ]},
  { ch:'第 4 章 · 时变电磁场', items:[ {t:'4.1 麦克斯韦方程组'}, {t:'4.2 均匀平面波'} ]},
];

/* ═══════════════════════════════ 物理内核 ═══════════════════════════════ */
const EPS0 = 8.8541878128e-12;
const epsf = (a, b) => 2 * a * b / (a + b);
/* 计算域：板宽 12.4W 固定（周期侧边界），驱动线钉在 x∈[0,W]，受害线随 gap 右移。
   网格与介电系数**不随 gap 变** ⇒ 可继承上一帧的解做初值。 */
const PCB_GEO = { W: 1.0, h: 1.0, t: 0.175, er: 4.3, x0: -3.2, x1: 9.2, ytop: 5.0, nx: 280 };

/* 互容 / 受害线对地电容的查找表（nx=400 收敛网格，周期侧边界，均匀介质简化）。
   ★ 标定核对：gap=1W ⇒ Vv/Vdd=0.209 ⇒ 3.3V×0.209=0.69V（与课件图A 的 0.69V 一致）；
     Cm=6.33 pF/m ⇒ 10cm 平行段 0.63 pF（逐字稿给 0.6 pF，量级一致）。 */
__GAP_TAB__
__CM_TAB__
__CV_TAB__
const N_TAB = GAP_TAB.length;
function tabAt(gp) {
  if (gp <= GAP_TAB[0]) return { Cm: CMT[0], Cv: CVT[0] };
  if (gp >= GAP_TAB[N_TAB - 1]) return { Cm: CMT[N_TAB - 1], Cv: CVT[N_TAB - 1] };
  let i = 0; while (GAP_TAB[i + 1] < gp) i++;
  const f = (gp - GAP_TAB[i]) / (GAP_TAB[i + 1] - GAP_TAB[i]);
  return { Cm: CMT[i] + (CMT[i + 1] - CMT[i]) * f, Cv: CVT[i] + (CVT[i + 1] - CVT[i]) * f };
}
const CmUnit = gp => tabAt(gp).Cm * EPS0 * 1e12;              /* pF/m */
const VvRatio = gp => { const t = tabAt(gp); return t.Cm / t.Cv; };
const CddUnit = gp => { const t = tabAt(gp); return (t.Cv + t.Cm) * EPS0 * 1e12; };

/* ---- 有限差分（red-black SOR，与 Python 原型逐位同源） ---- */
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
  return { nx, ny, N, dx, x0, x1, ytop, Xs, Ys, eps, ex, exm, ey, eym, den, gnd, W, h, t, er };
}
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
function pcbSolveField(g, fixed, init, sweeps, omega, tol) {
  sweeps = sweeps || 900; omega = omega || 1.9; tol = tol || 1e-4;
  const nx = g.nx, ny = g.ny, N = g.N;
  const V = (init && init.length === N) ? init : new Float64Array(N);
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

/* ---- 场：双线性插值取电位与 E ---- */
function fieldAt(g, V, x, z) {
  const fx = (x - g.x0) / g.dx - 0.5, fz = z / g.dx - 0.5;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  if (ix < 0 || iz < 0 || ix >= g.nx - 1 || iz >= g.ny - 1) return null;
  const tx = fx - ix, tz = fz - iz;
  const i00 = iz * g.nx + ix, i10 = i00 + 1, i01 = i00 + g.nx, i11 = i01 + 1;
  const v00 = V[i00], v10 = V[i10], v01 = V[i01], v11 = V[i11];
  const v = (v00 * (1 - tx) + v10 * tx) * (1 - tz) + (v01 * (1 - tx) + v11 * tx) * tz;
  const gx = ((v10 - v00) * (1 - tz) + (v11 - v01) * tz) / g.dx;
  const gz = ((v01 - v00) * (1 - tx) + (v11 - v10) * tx) / g.dx;
  return { v, ex: -gx, ez: -gz };
}
/* 从 (x,z) 逆着电位梯度（顺着 E）追一条电力线 */
function traceFieldLine(g, V, x, z, maxSteps) {
  const out = [];
  const step = g.dx * 0.85;
  let bad = 0;
  for (let k = 0; k < (maxSteps || 420); k++) {
    const e1 = fieldAt(g, V, x, z);
    if (!e1) break;
    let mx = e1.ex, mz = e1.ez;
    let m = Math.hypot(mx, mz);
    if (m < 1e-7) break;
    mx /= m; mz /= m;
    const xm = x + mx * step * 0.5, zm = z + mz * step * 0.5;
    const e2 = fieldAt(g, V, xm, zm);
    if (e2) {
      let ax = e2.ex, az = e2.ez;
      const m2 = Math.hypot(ax, az);
      if (m2 > 1e-7) { mx = ax / m2; mz = az / m2; }
    }
    out.push(pt(x, 0, z));
    x += mx * step; z += mz * step;
    if (x < g.x0 || x > g.x1 || z < 0.02 || z > g.ytop - 0.05) break;
  }
  out.push(pt(x, 0, z));
  return out;
}
/* marching squares：输出等值线段（世界坐标） */
function isoLines(g, V, level) {
  const nx = g.nx, ny = g.ny, segs = [];
  V_LOOP:
  for (let iz = 0; iz < ny - 1; iz++) {
    const b0 = iz * nx;
    for (let ix = 0; ix < nx - 1; ix++) {
      const i = b0 + ix;
      const v00 = V[i], v10 = V[i + 1], v01 = V[i + nx], v11 = V[i + nx + 1];
      const mn = Math.min(v00, v10, v01, v11), mx = Math.max(v00, v10, v01, v11);
      if (level < mn || level > mx) continue;
      const x0 = g.Xs[ix], x1 = g.Xs[ix + 1], z0 = g.Ys[iz], z1 = g.Ys[iz + 1];
      const ip = (a, b, xa, xb) => xa + (xb - xa) * ((level - a) / (b - a || 1e-12));
      const pts = [];
      if ((v00 - level) * (v10 - level) < 0) pts.push([ip(v00, v10, x0, x1), z0]);
      if ((v10 - level) * (v11 - level) < 0) pts.push([x1, ip(v10, v11, z0, z1)]);
      if ((v11 - level) * (v01 - level) < 0) pts.push([ip(v01, v11, x0, x1), z1]);
      if ((v01 - level) * (v00 - level) < 0) pts.push([x0, ip(v00, v01, z0, z1)]);
      if (pts.length >= 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
      if (segs.length > 6000) break V_LOOP;
    }
  }
  return segs;
}
