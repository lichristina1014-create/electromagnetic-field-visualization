/* ============================================================================
   5.4 电磁场遇到介质边界会怎样 —— 物理模型与几何
   ----------------------------------------------------------------------------
   ★★ 两个页签（对应 LCL-第5章 PPT 第 38–50 页 = 5.4 分界面衔接条件 + 扩展）：
       ① 衔接条件：跨界面小矩形回路（高 h 可压扁）⇒ ∮E·dl=(E_1t−E_2t)·l，
         而右端 −dΦ_B/dt·(l·h) 随 h→0 ⇒ **E_1t = E_2t**（切向连续）；
         高斯扁盒 ⇒ D_2n − D_1n = σ_s（法向跳变 = 自由面电荷）。
       ② 反射与透射（扩展）：斜入射平面波 ⇒ 反射角=入射角、
         斯涅尔定律定透射角、菲涅尔系数定幅值；n₁>n₂ 且 θ>θ_c ⇒ 全反射。

   ★★ 物理（μ_r=1，归一化阻抗 η_i = 1/n_i，n_i=√ε_ri）：
       斯涅尔：n₁·sinθ_i = n₂·sinθ_t
       垂直极化（E⊥入射面）：Γ⊥=(η₂cosθ_i−η₁cosθ_t)/(η₂cosθ_i+η₁cosθ_t)
                            T⊥=2η₂cosθ_i/(η₂cosθ_i+η₁cosθ_t)
       平行极化：Γ∥=(η₂cosθ_t−η₁cosθ_i)/(η₂cosθ_t+η₁cosθ_i)
       能量：R=|Γ|²，T_能=(n₂cosθ_t)/(n₁cosθ_i)·|T|²，R+T_能=1
       全反射：sinθ_t>1（n₁>n₂ 且 θ_i>θ_c=asin(n₂/n₁)）

   ★ 世界坐标：xy 平面侧视（y=界面法向，上=介质1，下=介质2），相机近俯视。
   ============================================================================ */

/* ============================== 状态 ============================== */
const state = {
  mode:'bc',                   /* bc 衔接条件 | rt 反射透射 */
  /* ① 的参数 */
  th1:35,                      /* 介质1 中 E_1 与界面的夹角 ° */
  hLoop:0.14,                  /* 小矩形回路高度 m（可压扁到 0.02） */
  epsr1:1, epsr2:4,            /* 两侧介电常数 */
  sigmaS:0.6,                  /* 界面自由面电荷 σ_s（归一化） */
  /* ② 的参数 */
  thI:35,                      /* 入射角 ° */
  pol:'perp',                  /* perp ⊥ | para ∥ */
  t:0, playing:true,
  anim:null,
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  /* ⚠️⚠️ 键必须与 SHOW_ITEMS（page1.js）逐字对齐（两页签取并集） */
  show:{ bc:true, dn:true, fronts:true },
};
const EPSR_RANGE=[1,9], TH1_RANGE=[5,80], H_RANGE=[0.02,0.2],
      THI_RANGE=[5,85], SIGS_RANGE=[0,1.5];
const PRESET={
  bc:{th1:35, hLoop:0.14, epsr1:1, epsr2:4, sigmaS:0.6},
  rt:{thI:35, epsr1:1, epsr2:4, pol:'perp'},
};
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.th1=cl(state.th1,TH1_RANGE[0],TH1_RANGE[1]);
  state.hLoop=cl(state.hLoop,H_RANGE[0],H_RANGE[1]);
  state.epsr1=cl(state.epsr1,EPSR_RANGE[0],EPSR_RANGE[1]);
  state.epsr2=cl(state.epsr2,EPSR_RANGE[0],EPSR_RANGE[1]);
  state.sigmaS=cl(state.sigmaS,SIGS_RANGE[0],SIGS_RANGE[1]);
  state.thI=cl(state.thI,THI_RANGE[0],THI_RANGE[1]);
  state.t=((state.t%1)+1)%1;         /* ② 的相位 ∈[0,1) */
  return state;
}

/* ============================== ① 衔接条件 ============================== */
/* 介质1 中 E_1 固定方向（与界面夹角 th1）；E_2 由衔接条件解出：
   E_2t = E_1t；ε₂E_2n = ε₁E_1n + σ_s（法向 D 跳变 = 自由面电荷） */
function bcFields(){
  const a=state.th1*Math.PI/180;
  const E1={t:Math.cos(a), n:-Math.sin(a)};      /* E_1 归一化幅值 1，法向朝下 */
  const E2={t:E1.t, n:(state.epsr1*E1.n+state.sigmaS)/state.epsr2};
  return {E1,E2};
}
/* 小矩形回路的 ∮E·dl（= (E_1t−E_2t)·l，与 h 无关 ⇒ h→0 时右端 −dΦ/dt·lh→0 ⇒ 连续） */
function loopCirc(){ const {E1,E2}=bcFields(); return (E1.t-E2.t)*0.3; }

/* ============================== ② 反射与透射 ============================== */
function nmed(i){ return Math.sqrt(i===1?state.epsr1:state.epsr2); }
/* 透射角（斯涅尔）；全反射时返回 null */
function snellT(thIdeg){
  const s=nmed(1)*Math.sin(thIdeg*Math.PI/180)/nmed(2);
  return Math.abs(s)<=1 ? Math.asin(s)*180/Math.PI : null;
}
function criticalDeg(){ return nmed(1)>nmed(2) ? Math.asin(nmed(2)/nmed(1))*180/Math.PI : null; }
/* 菲涅尔系数（场强比）；全反射 ⇒ Γ 模为 1 */
function fresnel(thIdeg){
  const thT=snellT(thIdeg);
  const n1=nmed(1), n2=nmed(2), eta1=1/n1, eta2=1/n2;
  const ci=Math.cos(thIdeg*Math.PI/180);
  if(thT===null) return {G:1, T:0, R:1, Te:0, thT:null, tir:true};
  const ct=Math.cos(thT*Math.PI/180);
  let G,T;
  if(state.pol==='perp'){ G=(eta2*ci-eta1*ct)/(eta2*ci+eta1*ct); T=2*eta2*ci/(eta2*ci+eta1*ct); }
  else { G=(eta2*ct-eta1*ci)/(eta2*ct+eta1*ci); T=2*eta2*ci/(eta2*ct+eta1*ci); }
  const R=G*G, Te=(n2*ct)/(n1*ci)*T*T;
  return {G,T,R,Te,thT,tir:false};
}
