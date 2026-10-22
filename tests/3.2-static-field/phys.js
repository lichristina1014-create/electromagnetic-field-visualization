/* ============================================================================
   3.2 恒定电场的特点 —— 物理模型与几何（引擎段与 2.1~2.5、3.1、4.2 同源）
   ----------------------------------------------------------------------------
   ★★ 本页的教学主线（三个页签，逐句对应用户给的需求：
       "说清楚什么是局外力和局外场强的动态变化过程，有电源和没电源"）：
       ① 没电源：充了电的极板接成回路 ⇒ 放电暂态
          Q、E、I 全部按 e^{−t/τ} 衰减 ⇒ 静电场是"一次性"的，电流转瞬即逝
       ② 有电源：电源内部的局外场强 @{E}_e（非静电起源）把正电荷
          从负极搬回正极 ⇒ 极板电荷、导线中的场、电流全都**恒定**
       ③ 环量：恒定电场由驻立电荷产生 ⇒ 与静电场一样是保守场：
          回路不经电源 ⇒ ∮@{E}·d@{l} = 0；
          回路穿过电源 ⇒ ∮(@{E}+@{E}_e)·d@{l} = ℰ（电动势全部来自局外场）

   ★★ 场模型：两块极板 = 一对**软化库仑点电荷** ±Q（软化半径 PL_EPS ≈ 板宽）。
     E 场 = −∇φ 严格保守 ⇒ ③ 的环路积分是**真积分**（不是贴出来的 0）。
     kQ 按"两极板间电位差 ≡ ℰ"标定 ⇒ ∫_电源段 E·dl = −ℰ 严格成立，
     ∫_电源段 E_e·dl = +ℰ 是局外场的定义 ⇒ ∮(E+E_e)·dl = ℰ 自动成立。

   ★ 单位制：ℰ 用 V、R 用 kΩ ⇒ I∞ = ℰ/R 用 mA；Q 用 µC（C = 0.5 µF）；
     E、E_e 用 V/m；时间常数 τ 用 s（示意值，动画按 1:1 秒走）。
   ============================================================================ */

/* ============================== 几何尺度 ==============================
   ★ 回路平放在 xy 平面（z=0）：相机近正对 +z 看下去就是 PPT 的电路图视角，
     学生也可以拖着转看立体关系。 */
const LP_W = 0.72;             /* 回路宽 m（x 方向） */
const LP_H = 0.50;             /* 回路高 m（y 方向） */
const SRC_H = 0.11;            /* 电源区半高 m（左边 y∈[−SRC_H, SRC_H]） */
const LP_L = 2*(LP_W+LP_H);    /* 回路总长 2.44 m */
const EXT_AX = 0.55;           /* 坐标轴长度（默认隐藏，电路图不需要轴） */
const PL_EPS = 0.06;           /* 极板软化半径 m（≈ 板半宽） */
const PL_HALF = 0.055;         /* 极板画成多长（半长 m） */

/* ============================== 确定性伪随机（同 3.1 自带一份） ============================== */
function mkRng(seed){
  let s=(seed>>>0)||1;
  return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
}

/* ============================== 状态 ============================== */
const state = {
  mode:'nosrc',                /* nosrc | source | loop */
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  /* 电路参数 */
  EMF:12,                      /* 电动势 ℰ V */
  RES:4,                       /* 回路电阻 R kΩ ⇒ I∞ = ℰ/R mA */
  Q0:4,                        /* ① 极板初始电荷 µC */
  TAU:1.4,                     /* 时间常数 s（① 放电 / ② 建立的示意值） */
  /* 过程进度 */
  t:0,                         /* ①② 的过程时间 s（滑块量程随 τ 走，见 clampState） */
  /* ③ 的试探路径 */
  s:0,                         /* 路径进度 [0,1] */
  path:'A',                    /* A = 不经电源的小环 / B = 沿导线一圈（穿过电源） */
  anim:null,                   /* 播放句柄（拖 t/s 滑块必须置 null，同 4.2 的教训） */
  flow:0,                      /* 载流子沿环的累计位移（弧长 m） */
  /* ⚠️⚠️ 键必须与 SHOW_ITEMS（page1.js）逐字对齐（3.1 踩过的坑） */
  show:{ wire:true, src:true, plate:true, car:true, fld:true, efe:true, path:true, box:false },
};
const EMF_RANGE=[3,24], RES_RANGE=[1,8], Q0_RANGE=[0.5,8], TAU_RANGE=[0.4,3];
const PRESET={
  nosrc: {Q0:4, TAU:1.4, t:0},
  source:{EMF:12, RES:4, TAU:1.4, t:0},
  loop:  {EMF:12, RES:4, s:0, path:'A'},
};
/* ★ 防御：滑块量钳制（预设/按钮把量设到量程外 ⇒ "滑块显示 ≠ 真实状态"的静默 bug） */
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.EMF=cl(state.EMF,EMF_RANGE[0],EMF_RANGE[1]);
  state.RES=cl(state.RES,RES_RANGE[0],RES_RANGE[1]);
  state.Q0 =cl(state.Q0, Q0_RANGE[0], Q0_RANGE[1]);
  state.TAU=cl(state.TAU,TAU_RANGE[0],TAU_RANGE[1]);
  state.t  =cl(state.t, 0, tMax());
  state.s  =cl(state.s, 0, 1);
  return state;
}
function tMax(){ return 4*state.TAU; }   /* ①② 的过程窗：4 个时间常数（e⁻⁴ ≈ 1.8%） */

/* ============================== 电学量 ============================== */
const C_CAP = 0.5;                     /* 极板等效电容 µF（示意） */
function qInf(){ return C_CAP*state.EMF; }                    /* 稳态极板电荷 µC */
function iInf(){ return state.EMF/state.RES; }                /* 稳态电流 mA */
/* 当前极板电荷：① 放电 e^{−t/τ}；② 建立 1−e^{−t/τ}；③ 已是稳态 */
function Qnow(){
  if(state.mode==='loop') return qInf();
  return state.mode==='nosrc' ? state.Q0*Math.exp(-state.t/state.TAU)
                              : qInf()*(1-Math.exp(-state.t/state.TAU));
}
/* 当前电流：① I = −dQ/dt = (Q₀/τ)e^{−t/τ}（µC/s = µA）；② I∞(1−e^{−t/τ})（mA） */
function Inow(){
  if(state.mode==='loop') return iInf();
  return state.mode==='nosrc' ? (state.Q0/state.TAU)*Math.exp(-state.t/state.TAU)
                              : iInf()*(1-Math.exp(-state.t/state.TAU));
}
/* 局外场强：只在电源内部，方向 − 极 → + 极（沿 +y），数值 = ℰ/d */
function EeVal(){ return state.EMF/(2*SRC_H); }               /* V/m */

/* ============================== 极板对的软化库仑场 ==============================
   E(p) = kQ·[ (p−p₊)/(|p−p₊|²+ε²)^{3/2} − (p−p₋)/(|p−p₋|²+ε²)^{3/2} ]
   ★ −∇φ 严格保守 ⇒ 任意闭合路径 ∮E·dl = 0（数值积分残差 ~1e-3·ℰ，如实显示）。
   ★ kQ 按"板间电位差 = ℰ"标定 ⇒ ∫_电源段 E·dl = −ℰ 严格成立。 */
function phiAt(p){
  const k=kQbase();
  const dp=Math.hypot(p.x-(-LP_W/2), p.y-SRC_H, p.z);
  const dm=Math.hypot(p.x-(-LP_W/2), p.y+SRC_H, p.z);
  return k*(1/Math.hypot(dp,PL_EPS) - 1/Math.hypot(dm,PL_EPS));
}
function kQbase(){
  /* Δφ = φ(上板中心) − φ(下板中心) = 2kQ·(1/ε − 1/√((2h)²+ε²)) ≡ ℰ */
  return state.EMF / (2*(1/PL_EPS - 1/Math.hypot(2*SRC_H,PL_EPS)));
}
/* 场的强度随极板电荷走（① 衰减 / ② 建立 / ③ 稳态） */
function kQnow(){ return kQbase() * (Qnow()/qInf()); }
function Efield(p){
  const k=kQnow();
  const out=pt(0,0,0);
  for(const sgn of [1,-1]){
    const cx=-LP_W/2, cy=sgn*SRC_H;
    const dx=p.x-cx, dy=p.y-cy, dz=p.z;
    const r2=dx*dx+dy*dy+dz*dz+PL_EPS*PL_EPS;
    const f=sgn*k/Math.pow(r2,1.5);
    out.x+=dx*f; out.y+=dy*f; out.z+=dz*f;
  }
  return out;
}
/* 板间（电源段中点）的 E：竖直向下（+ → −），读数用 */
function Eplates(){ return -Efield(pt(-LP_W/2,0,0)).y; }      /* V/m，取正数报 */

/* ============================== 回路参数化 ==============================
   ★ 沿电流正方向（稳态②）：电源内部 −→+（向上）→ 左上段向上 → 顶边向右 →
     右边向下 → 底边向左 → 左下段向上回到电源。
     s ∈ [0, LP_L) 弧长参数；段边界见 SEG。 */
const SEG=(()=>{
  const d=2*SRC_H, a=d+(LP_H/2-SRC_H), b=a+LP_W, c=b+LP_H, e=c+LP_W;
  return {d, a, b, c, e};                    /* 电源/左上/顶/右/底/左下 的分界 */
})();
function loopPt(s){
  s=((s%LP_L)+LP_L)%LP_L;
  const x0=-LP_W/2, x1=LP_W/2, yb=-LP_H/2, yt=LP_H/2;
  if(s<SEG.d)  return pt(x0, -SRC_H+s, 0);                    /* 电源段：向上 */
  if(s<SEG.a)  return pt(x0,  SRC_H+(s-SEG.d), 0);            /* 左上段：向上 */
  if(s<SEG.b)  return pt(x0+(s-SEG.a), yt, 0);                /* 顶边：向右 */
  if(s<SEG.c)  return pt(x1, yt-(s-SEG.b), 0);                /* 右边：向下 */
  if(s<SEG.e)  return pt(x1-(s-SEG.c), yb, 0);                /* 底边：向左 */
  return pt(x0, yb+(s-SEG.e), 0);                             /* 左下段：向上 */
}
function loopTan(s){
  s=((s%LP_L)+LP_L)%LP_L;
  if(s<SEG.a)  return pt(0,1,0);                              /* 电源段 + 左上段 */
  if(s<SEG.b)  return pt(1,0,0);
  if(s<SEG.c)  return pt(0,-1,0);
  if(s<SEG.e)  return pt(-1,0,0);
  return pt(0,1,0);
}
function inSource(s){ s=((s%LP_L)+LP_L)%LP_L; return s<SEG.d; }

/* ============================== 载流子 ============================== */
const NC_C = 56;
/* 载流子：均匀排在环上 + 随 flow 累计前移；流速 ∝ 当前电流（显示比例见 page2 DRIFT_K） */
function carrierAt(i){
  const s=(i*LP_L/NC_C + state.flow)%LP_L;
  return loopPt(s<0?s+LP_L:s);
}

/* ============================== ③ 的试探路径与环路积分 ============================== */
/* 路径 A：不经电源的小圆（回路内部空旷区，离极板 ≥0.45 m ⇒ 场光滑，数值积分准）
   ⚠️ 半径别超 0.13：再大会贴上 / 越过右边与顶边的导线 */
const PA_C = pt(0.13, 0.07, 0), PA_R = 0.13;
function pathPt(u){                       /* u ∈ [0,1) → 试探路径上的点 */
  u=((u%1)+1)%1;
  if(state.path==='A'){
    const a=2*Math.PI*u;
    return pt(PA_C.x+PA_R*Math.cos(a), PA_C.y+PA_R*Math.sin(a), 0);
  }
  return loopPt(u*LP_L);                  /* 路径 B：沿导线一圈（穿过电源） */
}
function pathTan(u){
  u=((u%1)+1)%1;
  if(state.path==='A'){
    const a=2*Math.PI*u;
    return pt(-Math.sin(a), Math.cos(a), 0);
  }
  return loopTan(u*LP_L);
}
function pathLen(){ return state.path==='A' ? 2*Math.PI*PA_R : LP_L; }
/* ★ 环路积分（数值）：∮E·dl 用中点规则。
   E 是保守场 ⇒ 真值是 0；残差如实显示（教学点：驻立电荷的场和静电场一样保守）。
   E_e 只在电源段：∫E_e·dl = EeVal·(2·SRC_H) = ℰ —— 这是局外场电动势的**定义**，解析给。 */
const INT_N = 720;
function intE(path){                       /* ∮E·dl（V） */
  let acc=0;
  if(path==='B'){
    /* 沿导线：保守场 ⇒ ∮ = 0 严格；为了把"≈0 是算出来的"演给学生看，仍数值积分。
       电源段近极板处 |E| 尖锐 ⇒ 该段单独加密（中点规则 600 段）。 */
    const N1=480;
    for(let i=0;i<N1;i++){
      const s0=SEG.d+(LP_L-SEG.d)*i/N1, s1=SEG.d+(LP_L-SEG.d)*(i+1)/N1;
      const m=loopPt((s0+s1)/2), t=loopTan((s0+s1)/2);
      acc+=vdot(Efield(m),t)*(s1-s0);
    }
    const N2=600;
    for(let i=0;i<N2;i++){
      const s0=SEG.d*i/N2, s1=SEG.d*(i+1)/N2;
      const m=loopPt((s0+s1)/2), t=loopTan((s0+s1)/2);
      acc+=vdot(Efield(m),t)*(s1-s0);
    }
    return acc;
  }
  for(let i=0;i<INT_N;i++){
    const u0=i/INT_N, u1=(i+1)/INT_N;
    const m=pathPt((u0+u1)/2), t=pathTan((u0+u1)/2);
    acc+=vdot(Efield(m),t)*pathLen()*(u1-u0);
  }
  return acc;
}
function intEe(path){ return path==='B' ? EeVal()*2*SRC_H : 0; }   /* ∫E_e·dl（V） */
/* 进度相关的"累计积分"：路径走到 s（[0,1]）时的累计值（给 ③ 的进度显示用） */
function intE_upto(uEnd){
  uEnd=Math.max(0,Math.min(1,uEnd));
  const N=Math.max(2,Math.round(INT_N*uEnd));
  let acc=0;
  if(state.path==='B'){
    /* B：近似按"保守场 ⇒ 累计 ≈ −(φ(P)−φ(P0))"显示（单调可知、无采样抖动） */
    const P0=loopPt(0), P=loopPt(uEnd*LP_L);
    return -(phiAt(P)-phiAt(P0));
  }
  for(let i=0;i<N;i++){
    const u0=i/INT_N, u1=(i+1)/INT_N;
    const m=pathPt((u0+u1)/2), t=pathTan((u0+u1)/2);
    acc+=vdot(Efield(m),t)*pathLen()*(u1-u0);
  }
  return acc;
}
/* E_e 的累计：只有路径 B 走进电源段才有 */
function intEe_upto(uEnd){
  if(state.path!=='B') return 0;
  const sIn=Math.max(0,Math.min(uEnd*LP_L, SEG.d));
  return EeVal()*sIn;
}
