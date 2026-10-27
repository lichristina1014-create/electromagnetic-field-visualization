/* ============================================================================
   5.1 变化的磁场激发电场 —— 物理模型与几何（引擎段与 2.1~2.5、3.x、4.2、5.8 同源）
   ----------------------------------------------------------------------------
   ★★ 教学主线（对应 LCL-第5章 PPT 第 4–12 页 = 5.1 法拉第电磁感应定律）：
       圆柱形磁区（半径 R）里 @{B}(t) 垂直纸面按正弦变化 ⇒ 空间激发
       **涡旋状感应电场** @{E}_i（同心圆、切向），导体环里出现感应电流。
       ★ 感应电场是**非保守场**：∮@{E}_i·d@{l} = −dΦ/dt ≠ 0
         （与 3.2 驻立电荷的库仑场 ∮=0 形成对照）。
       ★ 楞次定律：感应电流的效果总是**阻碍**磁通的变化。

   ★★ 物理（准静态，匀强 B 限在 r<R 的圆柱内，方向 ẑ）：
       E_φ(r) = −(r/2)·dB/dt        （r <  R，区内）
       E_φ(r) = −(R²/2r)·dB/dt      （r ≥ R，区外按 1/r 衰减）
       ℰ(环) = −dΦ/dt = −dB/dt·π·min(r_环, R)²
       I = ℰ / R_环阻
       ★ 环半径超过 R 后 ℰ 饱和（磁通被磁区截断）—— ③ 的演示点。

   ★ 单位制：B 用 T（B₀ 0.1~1）、f 用 Hz（0.2~2，慢到肉眼可跟）、长度 m、
     E 用 V/m、ℰ 用 V、I 用 mA。动画按 1:1 秒走。
     世界坐标 1:1 = 米（俯视 xy 平面，ẑ 指向读者）。
   ============================================================================ */

/* ============================== 几何尺度 ============================== */
const R_B   = 0.15;            /* 磁区半径 m */
const SCENE_R = 0.36;          /* 场景半径（世界 = m） */
const N_RING_PTS = 96;         /* 圆的离散段数 */

/* ============================== 状态 ============================== */
const state = {
  playing:true,
  t:0,                         /* 时间 s */
  B0:0.6,                      /* 磁感应强度幅值 T */
  fHz:1.0,                     /* 磁场变化频率 Hz（慢，肉眼可跟） */
  rLoop:0.22,                  /* 导体环半径 m（> R_B ⇒ 环套住整个磁区） */
  flow:0,                      /* 环上载流子的累计角位移 rad */
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  /* ⚠️⚠️ 键必须与 SHOW_ITEMS（page1.js）逐字对齐 */
  show:{ bfield:true, efield:true, ring:true, car:true, flux:true },
};
const B0_RANGE=[0.1,1.0], F_RANGE=[0.2,2], R_LOOP_RANGE=[0.05,0.35];
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.B0=cl(state.B0,B0_RANGE[0],B0_RANGE[1]);
  state.fHz=cl(state.fHz,F_RANGE[0],F_RANGE[1]);
  state.rLoop=cl(state.rLoop,R_LOOP_RANGE[0],R_LOOP_RANGE[1]);
  const T=periodT();
  state.t=((state.t%T)+T)%T;
  return state;
}
function periodT(){ return 1/state.fHz; }   /* 一个变化周期 s */

/* ============================== 物理量 ============================== */
function OM(){ return 2*Math.PI*state.fHz; }
function Bt(t){ return state.B0*Math.sin(OM()*t); }              /* T */
function dBdt(t){ return state.B0*OM()*Math.cos(OM()*t); }       /* T/s */
/* 感应电场 E_φ（V/m）：以 +φ（逆时针，从 +z 看）为正 */
function EiAt(r,t){
  const d=dBdt(t);
  return r<R_B ? -0.5*r*d : -0.5*R_B*R_B/(r)*d;
}
/* 穿过半径 r 环的磁通（Wb）与感应电动势（V） */
function fluxAt(r,t){ return Bt(t)*Math.PI*Math.pow(Math.min(r,R_B),2); }
function emfAt(r,t){ return -dBdt(t)*Math.PI*Math.pow(Math.min(r,R_B),2); }
const R_RES=2.0;             /* 环电阻 Ω（示意） */
function ringI(t){ return emfAt(state.rLoop,t)/R_RES; }          /* A */

/* ============================== 显示比例 ============================== */
/* E_i 箭头：线性 + 钳制（学 2.1 的 LE）；|dB/dt| 峰值 ≈ B₀·2πf ≤ 12.6 T/s，
   区内边缘 E ≈ 0.94 V/m ⇒ LE=0.13 时最长 0.122 */
const LE=0.13, LE_MIN=0.006, LE_MAX=0.13;
/* 环上载流子角速度显示比例：I 峰值 ~0.3 A ⇒ ω_disp = I·K_F，K_F=8 ⇒ ~2.4 rad/s */
const K_FLOW=8;
function clampLen(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
