/* ============================================================================
   5.2 变化的电场激发磁场 —— 物理模型与几何
   ----------------------------------------------------------------------------
   ★★ 教学主线（对应 LCL-第5章 PPT 第 13–27 页 = 5.2 位移电流与全电流定律）：
       平行板电容器充电：导线里是传导电流 I_c，极板间没有电荷穿过、
       只有随时间增长的电场 @{E}(t)。麦克斯韦把 ∂@{D}/∂t 叫位移电流密度 ——
       ★ 同一个安培环 L：曲面 S1（平盘，被导线穿过）算的是 I_c；
         曲面 S2（鼓起、从极板间穿过）算的是 I_d —— 两者**严格相等**，
         环上的 @{B} 才不自相矛盾。这就是"变化的电场激发磁场"。

   ★★ 物理（极板面积 S、间隙 d、极板间匀强 E(t)=E₀·sin(ωt)）：
       Q(t) = ε₀·E·S（极板电荷）
       I_c = dQ/dt = ε₀·S·dE/dt        （导线里的传导电流）
       I_d = J_d·S = ε₀·∂E/∂t·S ≡ I_c  （极板间的位移电流）
       环上 B(r) = μ₀·I / (2πr)         （两个环同一个 B）
       ⚠️ 数值很小（nA / pT 量级）—— 如实显示，这本身是教学点：
          "位移电流确实存在，但日常尺度下极其微弱"。

   ★ 世界坐标 1:1 = 米；导线沿 x 轴（y=z=0），左板 x=−PL_X、右板 +PL_X。
     相机 3/4 视角（B 环在 y-z 平面，要斜着才读得出"环"）。
   ============================================================================ */

/* ============================== 几何尺度 ============================== */
const PL_X   = 0.10;           /* 极板位置 x=∓PL_X / +PL_X（间隙 0.20 m） */
const PL_H   = 0.13;           /* 极板半高（y 方向） */
const WIRE_X = 0.50;           /* 导线端点 x=±0.5 */
const S_PLATE= 0.018;          /* 极板面积 m²（0.15×0.12 示意） */
const LOOP_X1= -0.30;          /* 安培环 L1：套导线 */
const LOOP_X2=  0.0;           /* 安培环 L2：套间隙 */
const N_LP   = 64;

/* ============================== 状态 ============================== */
const state = {
  playing:true,
  t:0,
  E0:100,                      /* 极板间场强幅值 kV/m */
  fHz:0.8,                     /* 充电（正弦）频率 Hz */
  rLoop:0.12,                  /* 安培环半径 m */
  surf:'S1',                   /* S1 平盘（套导线） | S2 鼓起（穿间隙） */
  flow:0,
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  /* ⚠️⚠️ 键必须与 SHOW_ITEMS（page1.js）逐字对齐 */
  show:{ wire:true, car:true, plate:true, egap:true, loop:true, surf:true },
};
const E0_RANGE=[50,200], F_RANGE=[0.2,2], R_LOOP_RANGE=[0.06,0.20];
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.E0=cl(state.E0,E0_RANGE[0],E0_RANGE[1]);
  state.fHz=cl(state.fHz,F_RANGE[0],F_RANGE[1]);
  state.rLoop=cl(state.rLoop,R_LOOP_RANGE[0],R_LOOP_RANGE[1]);
  const T=periodT();
  state.t=((state.t%T)+T)%T;
  return state;
}
function periodT(){ return 1/state.fHz; }

/* ============================== 物理量 ============================== */
const EPS0=8.854e-12, MU0=4e-7*Math.PI;
function OM(){ return 2*Math.PI*state.fHz; }
function gapE(t){ return state.E0*1e3*Math.sin(OM()*t); }        /* V/m */
function dEdt(t){ return state.E0*1e3*OM()*Math.cos(OM()*t); }   /* V/(m·s) */
function qPlate(t){ return EPS0*gapE(t)*S_PLATE; }               /* C */
function conductionI(t){ return EPS0*S_PLATE*dEdt(t); }          /* A */
function displaceI(t){ return EPS0*S_PLATE*dEdt(t); }            /* A（≡ I_c） */
function bLoop(r,t){ return MU0*conductionI(t)/(2*Math.PI*r); }  /* T */
/* 位移电流密度 J_d（A/m²） */
function jdAt(t){ return EPS0*dEdt(t); }

/* ============================== 显示比例 ============================== */
/* 间隙 E 箭头：E₀=200 kV/m ⇒ 最长 0.13；E 用相对值（E/E₀ 归一 × 0.13） */
const LE_K=0.13, LE_MIN=0.008;
/* B 箭头：B 峰值 ~ μ₀·I/(2πr) ~ 2e-13 T 量级 ⇒ 归一化到 0.10（注明是示意长度） */
const LB_K=0.10;
/* 载流子速度 ∝ I（I~nA ⇒ 归一化角速度），K_F 调到肉眼舒服 */
const K_FLOW=4e9;
function clampLen(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
/* 环上点：平面 x=x0、半径 r、角度 θ（y-z 平面） */
function loopPt(x0,r,th){ return pt(x0, r*Math.cos(th), r*Math.sin(th)); }
/* B 方向（右手定则，电流 +x）：d = (0, −sinθ, cosθ)·sign(I) */
function bDir(th,sgn){ return pt(0, -sgn*Math.sin(th), sgn*Math.cos(th)); }
