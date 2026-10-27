/* ============================================================================
   5.8 电磁波传播实验室 —— 物理模型与几何（引擎段与 2.1~2.5、3.x、4.2 同源）
   ----------------------------------------------------------------------------
   ★★ 本页的教学主线（对应用户给的设计稿）：
       均匀平面电磁波沿 +x 传播：@{E} 沿 y（红）、@{H} 沿 z（蓝），
       三者互相垂直；无耗时 E/H 同相，能流方向 = @{E}×@{H}（橙）。
       ★ 核心辨析：电场/磁场箭头只在**各自位置原地振荡**，
         向前推进的是**相位**（紫点）与**能量** —— 不是箭头沿 x 跑。

   ★★ 物理（均匀平面波，μ_r=1）：
       无耗：v = c/√ε_r，λ = v/f，η = η₀/√ε_r（η₀=376.73 Ω），E/H 同相
       有耗（损耗角正切 tanδ 固定 0.3）：
         A = √(1+tanδ²)
         α = (ω/c)√(ε_r/2)·√(A−1)，β = (ω/c)√(ε_r/2)·√(A+1)
         |η| = η₀/√ε_r·A^(−1/4)，φ_η = ½·atan(tanδ)（H 滞后 E 的相位）
         E_y = E₀·e^(−αx)·cos(ωt−βx)，H_z = (E₀/|η|)·e^(−αx)·cos(ωt−βx−φ_η)
         S_avg(x) = E₀²·e^(−2αx)/(2|η|)·cos(φ_η)

   ★ 显示映射：波列世界长度 1.1（x∈[−0.55,+0.55]）≡ 真实 9 m
     （= f=100 MHz、ε_r=1、无耗时的 3 个波长）⇒ 频率/介电常数改变时
     **波长在画面上真的变密变疏**。时间动画用显示角速度 OM_D=1.2 rad/s
     （示意速率，读数一律按真实 f 算，与动画快慢无关 —— 3.1 的口径）。
   ============================================================================ */

/* ============================== 几何尺度 ============================== */
const WAVE_L  = 1.1;             /* 波列世界长度（x∈[−0.55,+0.55]） */
const X0      = -0.55;           /* 源面位置 */
const L_REAL  = 9.0;             /* 波列对应的真实长度 m */
const W2R     = L_REAL/WAVE_L;   /* 世界 → 真实 的比例（8.18 m/世界单位） */
const OM_D    = 1.2;             /* 显示角速度 rad/s（动画示意速率） */
const T_D     = 2*Math.PI/OM_D;  /* 显示周期 s（t 滑块量程） */
const EXT_AX  = 0.17;            /* 方向三脚架臂长（左下角） */

/* ============================== 状态 ============================== */
const state = {
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  freqIdx:1,                     /* 0/1/2 → 100/200/400 MHz */
  epsr:1,                        /* 相对介电常数 1..9（μ_r=1） */
  lossy:false,                   /* 无耗 | 有耗（tanδ=0.3） */
  playing:true,
  t:0,                           /* 显示时间 s（∈[0,T_D]） */
  /* ⚠️⚠️ 键必须与 SHOW_ITEMS（page1.js）逐字对齐 */
  show:{ eArr:true, hArr:true, wave:true, sVec:true, phase:true, prop:true, triad:true },
};
const EPSR_RANGE=[1,9];
const FREQS=[100,200,400];       /* MHz */
const TAND=0.3;                  /* 有耗介质的损耗角正切（固定） */

function clampState(){
  state.freqIdx=Math.max(0,Math.min(2,Math.round(state.freqIdx)));
  state.epsr=Math.max(EPSR_RANGE[0],Math.min(EPSR_RANGE[1],Math.round(state.epsr)));
  state.t=((state.t%T_D)+T_D)%T_D;
  return state;
}

/* ============================== 平面波物理量 ============================== */
const C0=3e8, ETA0=376.73, E0=1.0;    /* E₀ = 1 V/m */
function freqHz(){ return FREQS[state.freqIdx]*1e6; }
/* 一组派生量：无耗与有耗统一给出 k(β)、α、v、λ、η 模、相位差 φ_η */
function waveParams(){
  const om=2*Math.PI*freqHz(), er=state.epsr, fac=om/C0*Math.sqrt(er);
  if(!state.lossy){
    const k=fac;
    return {om, k, alpha:0, v:om/k, lam:2*Math.PI/k, eta:ETA0/Math.sqrt(er), phiEta:0};
  }
  return waveParamsLossy(om, er);
}
function waveParamsLossy(om, er){
  const fac=om/C0*Math.sqrt(er/2);
  const A=Math.sqrt(1+TAND*TAND);
  const alpha=fac*Math.sqrt(A-1), beta=fac*Math.sqrt(A+1);
  const etaAbs=ETA0/Math.sqrt(er)*Math.pow(A,-0.25);
  const phiEta=0.5*Math.atan(TAND);
  return {om, k:beta, alpha, v:om/beta, lam:2*Math.PI/beta, eta:etaAbs, phiEta};
}
/* 世界坐标里的波数与衰减常数（相位 = OM_D·t − kWorld·xRel，xRel = x−X0） */
function kWorld(){ return waveParams().k*W2R; }
function alphaWorld(){ return waveParams().alpha*W2R; }

/* 场：x 为世界坐标，t 为显示时间。返回真实物理单位的值 */
function waveE(x,t){
  const p=waveParams(), xr=(x-X0)*W2R;
  return E0*Math.exp(-p.alpha*xr)*Math.cos(OM_D*t - p.k*xr);
}
function waveH(x,t){
  const p=waveParams(), xr=(x-X0)*W2R;
  return (E0/p.eta)*Math.exp(-p.alpha*xr)*Math.cos(OM_D*t - p.k*xr - p.phiEta);
}
/* 平均能流密度 W/m²（随 x 衰减） */
function sAvg(x){
  const p=waveParams(), xr=(x-X0)*W2R;
  return E0*E0*Math.exp(-2*p.alpha*xr)/(2*p.eta)*Math.cos(p.phiEta);
}
/* 显示比例（线性 + 上下限钳制，学 2.1 的 LE）：
   E₀=1 ⇒ E 箭头最长 0.16；H 基准（ε_r=1 无耗）≈0.13，ε_r 大 ⇒ H 箭头更长（η 小） */
const LE_K=0.16, LE_MIN=0.012, LE_MAX=0.20;
const LH_K=50,   LH_MIN=0.012, LH_MAX=0.24;
const LS_K=45;                   /* S = E·H（W/m² 量级 1e-3） ⇒ 最长 ~0.12 */
function clampLen(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
