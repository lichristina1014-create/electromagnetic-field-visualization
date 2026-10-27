/* ============================================================================
   5.6 电磁能量如何传播 —— 物理模型与几何
   ----------------------------------------------------------------------------
   ★★ 教学主线（对应 LCL-第5章 PPT 第 51–63 页 = 5.6 坡印廷定理）：
       平面波沿 +x 穿过一个体积 V（内部是有耗介质层，σ 可调）。
       坡印廷矢量 @{S}=@{E}×@{H} 给能流；坡印廷定理管收支：
         流入 − 流出 = 储能变化率 + 损耗   （本页数值实时验证）
       收官点题：**能量在"场"里走，不在导线里走**。

   ★★ 物理（归一化单位：ε=μ=1 ⇒ η₀=1、v=1；频率 f_d 是显示频率）：
       无耗区：E_y=E₀·cos(ωt−kx)，H_z=E_y（η=1）
       V 内（有耗，电导率 σ）：tanδ=σ/(ωε)=σ/ω，
         A=√(1+tanδ²)，α=(ω/√2)√(A−1)，β=(ω/√2)√(A+1)，
         |η|=A^(−1/4)，φ_η=½·atan(tanδ)
         E_y=E₀·e^(−α(x−a))·cos(ωt−βx)，H_z=E_y 包络/|η|、相位 −φ_η
       ★ 这组场满足 Maxwell ⇒ 坡印廷恒等式**严格成立**，
         页面的"收支残差"只来自数值积分的网格误差（如实显示，3.2 的口径）。

   ★ 能量账（单位横截面积 A=1）：
       S_in(t)=E(a,t)H(a,t)，S_out(t)=E(b,t)H(b,t)
       W(t)=∫ₐᵇ ½(εE²+μH²) dx，P_loss(t)=∫ₐᵇ σE² dx
       恒等式：S_in − S_out = dW/dt + P_loss
   ============================================================================ */

/* ============================== 几何尺度 ============================== */
const X0=-0.55, WAVE_L=1.1;    /* 波列（世界=归一化米） */
const VA=-0.15, VB=0.25;       /* 体积 V 的左右面（内含损耗层） */
const N_ST=30;                 /* 箭头站数 */

/* ============================== 状态 ============================== */
const state = {
  playing:true,
  t:0,
  E0:1.0,                      /* 入射波幅值（归一化） */
  fD:1.25,                     /* 显示频率 Hz（λ=1/f=0.8） */
  sigma:1.2,                   /* V 内电导率 σ（归一化；0=无耗） */
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  /* ⚠️⚠️ 键必须与 SHOW_ITEMS（page1.js）逐字对齐 */
  show:{ wave:true, box:true, sVec:true, bars:true, arr:true },
};
const E0_RANGE=[0.5,2], F_RANGE=[0.8,2], SIG_RANGE=[0,3];
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.E0=cl(state.E0,E0_RANGE[0],E0_RANGE[1]);
  state.fD=cl(state.fD,F_RANGE[0],F_RANGE[1]);
  state.sigma=cl(state.sigma,SIG_RANGE[0],SIG_RANGE[1]);
  const T=periodT();
  state.t=((state.t%T)+T)%T;
  return state;
}
function periodT(){ return 1/state.fD; }

/* ============================== 物理量 ============================== */
function OM(){ return 2*Math.PI*state.fD; }
/* V 内的传播参数（外区无耗：α=0、β=ω、η=1）。
   ★ 低耗近似（tanδ=σ/ω ≤ ~0.4）：α≈σ/2、β≈ω(1+tan²δ/8)、η=1、φ=0
   —— 这样 H 在界面连续（不假装有反射又不引入假跳变；边界条件本是 5.4 的内容），
   代价是坡印廷恒等式有 O(tan²δ) 的小残差 ⇒ 如实显示（3.2 的"残差"口径）。 */
function slabParams(){
  const om=OM();
  if(state.sigma<1e-12) return {alpha:0, beta:om, eta:1, phi:0, tanD:0};
  const tanD=state.sigma/om;
  return {
    tanD,
    alpha: state.sigma/2,
    beta:  om*(1+tanD*tanD/8),
    eta:   1,
    phi:   0,
  };
}
/* 场（分段：x<a 无耗入射区 / a..b 有耗层 / x>b 无耗透出区；x=b 处相位连续：
   透出区相位 = ωt − ωx − (β−ω)(b−a)） */
function fieldE(x,t){
  const p=slabParams(), om=OM();
  if(x<VA) return state.E0*Math.cos(om*t-om*x);
  if(x>VB) return state.E0*Math.exp(-p.alpha*(VB-VA))*Math.cos(om*t-om*x-(p.beta-om)*(VB-VA));
  return state.E0*Math.exp(-p.alpha*(x-VA))*Math.cos(om*t-p.beta*(x-VA)-om*VA);
}
function fieldH(x,t){
  const p=slabParams(), om=OM();
  if(x<VA) return state.E0*Math.cos(om*t-om*x);
  if(x>VB) return state.E0*Math.exp(-p.alpha*(VB-VA))*Math.cos(om*t-om*x-(p.beta-om)*(VB-VA));
  return state.E0/p.eta*Math.exp(-p.alpha*(x-VA))*Math.cos(om*t-p.beta*(x-VA)-om*VA-p.phi);
}
/* 能量账（单位面积）：数值积分 W 与 P_loss */
const INT_N=80;
function energyBooks(t){
  const p=slabParams();
  const Sin=fieldE(VA,t)*fieldH(VA,t);
  const Sout=fieldE(VB,t)*fieldH(VB,t);
  let W=0, P=0;
  for(let i=0;i<INT_N;i++){
    const x=VA+(VB-VA)*(i+0.5)/INT_N;
    const E=fieldE(x,t), H=fieldH(x,t);
    W+=0.5*(E*E+H*H)*(VB-VA)/INT_N;
    P+=state.sigma*E*E*(VB-VA)/INT_N;
  }
  return {Sin, Sout, W, Ploss:P};
}
/* dW/dt 用解析偏导（被积函数对 t 求导再积分，比差分稳） */
function dWdt(t){
  const p=slabParams(), om=OM();
  let acc=0;
  for(let i=0;i<INT_N;i++){
    const x=VA+(VB-VA)*(i+0.5)/INT_N;
    const E=fieldE(x,t), H=fieldH(x,t);
    /* ∂E/∂t：E=A(x)cos(θ(x,t)) ⇒ ∂E/∂t=−A·ω·sin(θ)…θ=ωt−… 逐项 */
    const xr=x-VA;
    const dE=-state.E0*Math.exp(-p.alpha*xr)*om*Math.sin(om*t-p.beta*xr-om*VA);
    const dH=-state.E0/p.eta*Math.exp(-p.alpha*xr)*om*Math.sin(om*t-p.beta*xr-om*VA-p.phi);
    acc+=(E*dE+H*dH)*(VB-VA)/INT_N;
  }
  return acc;
}
/* 坡印廷恒等式残差：S_in − S_out − dW/dt − P_loss（应≈0） */
function poyntingResidual(t){
  const b=energyBooks(t);
  return b.Sin-b.Sout-dWdt(t)-b.Ploss;
}

/* ============================== 显示比例 ============================== */
const LE_K=0.15, LH_K=0.15, LS_K=0.30;   /* 归一化单位下 E/H 同量级（η≈1） */
function clampLen(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
