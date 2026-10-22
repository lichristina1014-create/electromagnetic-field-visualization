/* ============================================================================
   3.1 电流的分类 —— 物理模型与几何（引擎段与 2.1 / 2.2 / 2.3 / 2.4 同源）

   ★★ 本页的教学主线（三个页签，逐句对应用户给的定义）：
       电流按电荷分布的形态分三种，而**电流密度的定义口径完全一致**：
         「单位时间内，垂直穿过单位面积 / 单位长度 / 一个点 的电荷量」
       ① 体电流：电荷充满一块体积 ⇒ 穿过**横截面**（面积）⇒ J，单位 A/m²
       ② 面电流：电荷分布在一个面上 ⇒ 穿过**横截线**（长度）⇒ K，单位 A/m
       ③ 线电流：电荷分布在一条线上 ⇒ 穿过**一个点**          ⇒ I，单位 A

   ★★★ 单位制是**刻意选的**，目的是让三个页签共用同一个乘法式子：
       长度 m；ρ µC/m³、σ µC/m²、τ µC/m；漂移速度 u mm/s
         J = ρ·u  ⇒  (ρ·1e-6 C/m³)(u·1e-3 m/s) = ρu·1e-9 A/m² = **ρu nA/m²**
         K = σ·u  ⇒  (σ·1e-6 C/m²)(u·1e-3 m/s) = σu·1e-9 A/m  = **σu nA/m**
         I = τ·u  ⇒  (τ·1e-6 C/m )(u·1e-3 m/s) = τu·1e-9 A   = **τu nA**
       ⇒ 画面上三个读数**数值上就是 ρ·u / σ·u / τ·u**，一眼看出"同一个式子、三种量纲"。
       （这不是近似，是单位换算：1e-9 的因子被 nA 整个吸收掉了。）

   ★ 为什么用"载流子"来讲定义：把"单位时间垂直穿过的电荷量"落到**数得着的载流子**上。
       每个载流子的电荷 = 该分布下总电荷 / 载流子个数，于是
         "穿过面元的载流子数 / 秒 × 每个载流子的电荷" 与解析式 **严格相等**
       （自检 chk2 逐例对这件事做断言）。
   ============================================================================ */

/* ============================== 几何尺度 ==============================
   ★ 三个页签的尺寸刻意取成"同一根导体的三种压缩"：圆柱半径 a、壳半径 b、
     线长都落在同一量级，画面切换时尺度不跳。 */
const A_R0 = 0.30;              /* ① 导体（圆柱）半径 m */
const A_R_RANGE = [0.16, 0.34];
const A_L  = 0.55;              /* ① 圆柱长度 m（轴沿 z，中心在原点） */
const B_R0 = 0.34;              /* ② 导体（圆柱壳）半径 m */
const B_R_RANGE = [0.20, 0.40];
const B_L  = 0.45;              /* ② 壳长 m */
const C_L  = 0.60;              /* ③ 导线长度 m */
/* ★ 轴长刻意压到 0.62（比场景只大一圈）：① 的圆柱半长 0.275 + 半径 ≤0.34、
   ③ 的线长 0.60 ⇒ 0.62 刚好都盖住，又不把画面撑爆（2.3 用 1.06/1.30，那是给分子盒用的）。 */
const EXT_AX = 0.62;            /* 坐标轴长度（略大于场景，别抢戏） */

/* ============================== 确定性伪随机 ==============================
   ★ 引擎段（2.3 的 186..323 行）**不含** mkRng —— 它在 2.3 的 325~338 行，
     build.js 按 2.4 的先例**故意不切那一段**（那段还带着 randDir，本页用不到）。
   ⇒ 本文件必须自带一份，否则 unitCylinder() 一调用就 ReferenceError。
   ★ 为什么不用 Math.random()：截图与自检都要求"同一份代码画出同一个画面"，
     随机一旦每次刷新都变，幂等探针会假失败、截图无法对比。 */
function mkRng(seed){
  let s=(seed>>>0)||1;
  return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
}

/* ============================== 载流子 ============================== */
const NC_V = 96;                /* ① 体积里的载流子个数 */
const NC_S = 72;                /* ② 表面上的载流子个数 */
const NC_L = 26;                /* ③ 线上的载流子个数 */
/* 每个载流子的电荷 = 总电荷 / 个数。总电荷用各自的"电荷密度 × 几何量"算：
     ① ρ[µC/m³] × πa²L       ② σ[µC/m²] × 2πbL       ③ τ[µC/m] × L          */
function qCarrierV(rho,a){ return rho*Math.PI*a*a*A_L/NC_V; }
function qCarrierS(sig,b){ return sig*2*Math.PI*b*B_L/NC_S; }
function qCarrierL(tau){ return tau*C_L/NC_L; }

/* 载流子的**相对**位置（单位圆柱 / 单位壳 / 单位线段）—— 固定种子 ⇒ 截图可复现。
   ⚠️ 半径是滑块量：位置按"单位半径"存、绘制时再乘 a/b，
      这样拖动半径时载流子**不会整批跳位**（若按每次重采样，画面会炸）。 */
function unitCylinder(n){
  const rng=mkRng(20261019), out=[];
  for(let i=0;i<n;i++){
    const r=Math.sqrt(rng()), ph=2*Math.PI*rng(), z=rng()*2-1;
    out.push({x:r*Math.cos(ph), y:r*Math.sin(ph), z});
  }
  return out;
}
function unitShell(n){
  const rng=mkRng(20261020), out=[];
  for(let i=0;i<n;i++){
    const ph=2*Math.PI*rng(), z=rng()*2-1;
    out.push({x:Math.cos(ph), y:Math.sin(ph), z});
  }
  return out;
}
/* ⚠️ 线段的 base **必须带 x:0,y:0**：carrierPos() 里是 base.x*b / base.y*b，
   漏了就是 undefined*0 = NaN ⇒ 载流子全飞到 NaN、prims 深度全是 NaN、
   而 prims.sort 对 NaN **静默失效**（退化成插入序，截图看着完全正常）。
   ⇒ 自检 chk31 ⑦ 对三种模式都断言"位置有限 + 径向不越界"。 */
function unitSegment(n){
  const rng=mkRng(20261021), out=[];
  for(let i=0;i<n;i++) out.push({x:0,y:0,z:rng()*2-1});
  return out;
}
const BASE_V = unitCylinder(NC_V);
const BASE_S = unitShell(NC_S);
const BASE_L = unitSegment(NC_L);

/* ============================== 状态 ============================== */
const state = {
  mode:'volume',               /* volume | surface | line */
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  /* ① 体电流 */
  rho:2.0,                     /* 体电荷密度 µC/m³ */
  /* ② 面电流 */
  sig:1.0,                     /* 面电荷密度 µC/m² */
  /* ③ 线电流 */
  tau:1.0,                     /* 线电荷密度 µC/m */
  /* 三个页签共用的漂移速度 */
  u:4.0,                       /* 漂移速度 mm/s */
  /* ① 的面元 */
  a:A_R0,                      /* 导体半径 m */
  dS:0.008,                    /* 面元面积 m² */
  th:0,                        /* 面元法矢与漂移方向的夹角（度）⇒ 只剩 cosθ 的分量算数 */
  /* ★ 面元在横截面内的**比例坐标**（× 半径 a ⇒ 世界坐标）：用比例而不是绝对值，
     拖半径滑块时面元跟着缩放、永不越盘（旧版 elemCenter=0.55a 就是 0.55 的特例）。
     指针拖动直接改这两个量（见 page2.js 的 drag.mode==='elem'），elemClampFrac 钳回盘内。 */
  elemFX:0.55, elemFY:0.0,
  /* ★ 放倒：① 的圆柱从"轴沿 z（竖放）"转成"轴沿 x（横放）"——PPT 里体电流图的样子。
     只作用于 ① 页签的场景几何（layT 内部有 mode 守卫），②③ 与坐标轴不动。 */
  lay:false,
  /* ② 的线元 */
  b:B_R0,                      /* 壳半径 m */
  dl:0.30,                     /* 线元长度 m（圆周上的一段） */
  drift:0,                     /* 载流子沿 z 的累计位移（世界 m） */
  /* ⚠️⚠️ 这些键**必须与 SHOW_ITEMS 逐字对齐**（page1.js）：
       sec = 横截面 S / 横截线 l、arc = 线元 dl、wire = ③ 的导线。
     曾经写成 {vol,car,elem,slab,nrm,box,line,dot,ladder} ⇒ sec/arc/wire 全是 undefined
     ⇒ 三个场景的**核心教学对象**（横截面、横截线、导线）一层都画不出来，
     而页面**不报任何错**。自检 chk_show 专门盯这条。 */
  show:{ vol:true, sec:true, elem:true, nrm:true, car:true, box:true,
         arc:true, wire:true, dot:true, ladder:true },
};
const RHO_RANGE=[0.2,4.0], SIG_RANGE=[0.2,4.0], TAU_RANGE=[0.2,4.0];
const U_RANGE=[1.0,8.0];
/* ⚠️ DS_RANGE 的上限 0.012 是**按最小半径 a=0.16 定死**的，不是随手取的：
   面元要整块落在横截面圆盘内（见 elemFits 的推导），dS ≤ 0.566a²，
   而 0.566·0.16² = 0.0145 > 0.012 ⇒ **整个量程内面元永远装得进圆盘**，
   于是滑块上限可以写死，不必随 a 动态改（动态改 max 正是"滑块显示 ≠ 真实状态"
   那类静默 bug 的温床）。 */
const DS_RANGE=[0.004,0.012], TH_RANGE=[0,80];
/* ⚠️ DL_RANGE 的上限必须 < 2π·b_min = 1.257（横截线总共只有 2πb 长，
   超了"dl 占横截线"会 >100%）。"取半圈"按钮因此要显式 clamp。 */
const DL_RANGE=[0.05,1.20];
const PRESET={
  volume: {rho:2.0, u:4.0, a:A_R0, dS:0.008, th:0, elemFX:0.55, elemFY:0.0},
  surface:{sig:1.0, u:4.0, b:B_R0, dl:0.30},
  line:   {tau:1.0, u:4.0},
  /* ⚠️ lay 刻意不进 PRESET：切页签不重置"放倒"，用户的选择跨页签保持 */
};

/* ★ 防御：把 state 里所有"滑块量"夹回各自量程。
   预设 / 按钮一旦把某个量设到量程外，input[type=range] 会**自己 clamp 显示**、
   而 state 不 clamp ⇒ "滑块显示 ≠ 真实状态"且**不报任何错**（本项目的经典静默 bug）。
   ⇒ 在每个会整体改写 state 的入口（页签切换 / 预设装载）后面调用一次。 */
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.rho=cl(state.rho,RHO_RANGE[0],RHO_RANGE[1]);
  state.sig=cl(state.sig,SIG_RANGE[0],SIG_RANGE[1]);
  state.tau=cl(state.tau,TAU_RANGE[0],TAU_RANGE[1]);
  state.u  =cl(state.u,  U_RANGE[0],  U_RANGE[1]);
  state.a  =cl(state.a,  A_R_RANGE[0],A_R_RANGE[1]);
  state.b  =cl(state.b,  B_R_RANGE[0],B_R_RANGE[1]);
  state.dS =cl(state.dS, DS_RANGE[0], DS_RANGE[1]);
  state.th =cl(state.th, TH_RANGE[0], TH_RANGE[1]);
  state.dl =cl(state.dl, DL_RANGE[0], DL_RANGE[1]);
  elemClampFrac();               /* a / dS / θ 被钳后，面元位置也要重新钳回盘内 */
  return state;
}

/* ============================== 放倒（① 专用） ==============================
   ★ 绕 y 轴转 +90°：(x,y,z) → (z,y,−x)，于是 +z（漂移方向）→ +x，
     z=0 的横截圆盘 → x=0 的竖直圆盘（正对 +x 方向看就是正圆）。
   ★ 只作用于 ① 的场景几何：mode 守卫 ⇒ ② 面电流 / ③ 线电流与坐标轴都不动。
   ★ 旋转变换 ⇒ 对点和方向矢量通用；vcross/dot 等运算与变换可交换。 */
function layT(p){
  return (state.mode==='volume' && state.lay) ? pt(p.z, p.y, -p.x) : p;
}

/* ============================== 物理量 ============================== */
/* 三个"密度"在数值上就是电荷密度 × 速度（见文件头的单位制说明） */
function Jval(){ return state.rho*state.u; }          /* nA/m² */
function Kval(){ return state.sig*state.u; }          /* nA/m   */
function Ival(){ return state.tau *state.u; }         /* nA     */
/* ① 的总电流：I = ∬ J·dS = J·πa² */
function ItotV(){ return Jval()*Math.PI*state.a*state.a; }        /* nA */
/* ② 的总电流：I = ∮ K·dl = K·2πb */
function ItotS(){ return Kval()*2*Math.PI*state.b; }              /* nA */
/* 穿过①的面元的电流：J·dS⊥（只有垂直投影算数） */
function IelemV(){ return Jval()*state.dS*Math.cos(state.th*D2R); }
/* 穿过②的线元的电流：K·dl */
function IelemS(){ return Kval()*state.dl; }
/* ① 的"单位时间穿过整截面的载流子数" = NC_V·u[m/s]/L */
function rateV(){ return NC_V*(state.u*1e-3)/A_L; }
function rateS(){ return NC_S*(state.u*1e-3)/B_L; }
function rateL(){ return NC_L*(state.u*1e-3)/C_L; }
/* ① 里"落在面元上的载流子占比" = dS⊥/(πa²) */
function fracV(){ return state.dS*Math.cos(state.th*D2R)/(Math.PI*state.a*state.a); }
function fracS(){ return state.dl/(2*Math.PI*state.b); }

/* ============================== 面元 / 线元几何 ==============================
   ★ 面元是**有方向的**：法矢 n̂ 与漂移方向夹 θ 角，
     只有它的**垂直投影** dS⊥ = dS·cosθ 参与"穿过"的计数。
   ★ 面元位置 = 比例坐标 (elemFX, elemFY) × a，盘内任意拖动；
     所有"盘内"判定都在盘内坐标系做（与放倒与否无关，layT 只是最后一步的旋转）。 */
function elemN(){ const t=state.th*D2R; return layT(pt(Math.sin(t),0,Math.cos(t))); }
/* ★ 面元圆心：(elemFX·a, elemFY·a) —— 默认 (0.55a, 0) 与旧版完全一致。
   角点到轴距离² = (|fx|·a + s/2·|cosθ|)² + (|fy|·a + s/2)² ≤ a²（θ=0 时退化为旧推导） */
function elemCenter(){ return layT(pt(state.elemFX*state.a, state.elemFY*state.a, 0)); }
function elemSide(){ return Math.sqrt(state.dS); }
/* 盘内坐标下的"整块装进圆盘"判定（与 lay 无关 ⇒ 放倒后同样成立） */
function elemFits(){
  const h=elemSide()/2, c=Math.abs(Math.cos(state.th*D2R));
  return Math.hypot(Math.abs(state.elemFX)*state.a + h*c, Math.abs(state.elemFY)*state.a + h)
         <= state.a+1e-12;
}
/* ★ 拖动 / 钳制后的收尾：把比例坐标钳回"面元整块仍在盘内"。
   g(k) = 角点最大半径随缩放系数 k 单调 ⇒ 倍增回退必在有限步收敛；
   极端情况（都装不下）退回盘心 —— DS_RANGE 的上限保证 (0,0) 恒可行。 */
function elemClampFrac(){
  if(elemFits()) return;
  let k=0.95;
  for(let i=0;i<60 && k>1e-3;i++){
    const fx=state.elemFX*k, fy=state.elemFY*k;
    const h=elemSide()/2, c=Math.abs(Math.cos(state.th*D2R));
    if(Math.hypot(Math.abs(fx)*state.a + h*c, Math.abs(fy)*state.a + h)<=state.a+1e-12){
      state.elemFX=fx; state.elemFY=fy; return;
    }
    k*=0.9;
  }
  state.elemFX=0; state.elemFY=0;
}
/* 面元的两个面内方向：u₁ 沿 y，u₂ = n̂ × u₁（保证 n̂·u₂ = 0） */
function elemU1(){ return layT(pt(0,1,0)); }
function elemU2(){ const t=state.th*D2R; return layT(vcross(pt(Math.sin(t),0,Math.cos(t)),pt(0,1,0))); }
function elemCorners(){
  const c=elemCenter(), s=elemSide()/2, u1=elemU1(), u2=elemU2();
  return [ vadd(vadd(c,vmul(u1,-s)),vmul(u2,-s)),
           vadd(vadd(c,vmul(u1, s)),vmul(u2,-s)),
           vadd(vadd(c,vmul(u1, s)),vmul(u2, s)),
           vadd(vadd(c,vmul(u1,-s)),vmul(u2, s)) ];
}
/* 把世界点变换到面元的局部坐标（n̂, u₁, u₂）—— 判"这个载流子在不在面元里"用 */
function toElemLocal(p){
  const c=elemCenter(), d=vsub(p,c), n=elemN(), u1=elemU1(), u2=elemU2();
  return {n:vdot(d,n), a:vdot(d,u1), b:vdot(d,u2)};
}
/* ② 的横截线：圆周上一段弧，弧长 = dl */
function arcHalf(){ return state.dl/(2*state.b)/2; }   /* 半角（弧度） */
function arcEnds(){
  const h=arcHalf();
  return [pt(state.b*Math.cos(-h), state.b*Math.sin(-h), 0),
          pt(state.b*Math.cos( h), state.b*Math.sin( h), 0)];
}

/* ============================== 载流子位置（含漂移） ==============================
   ★ 位移用**累计量** state.drift，不是直接用 u×t：
     拖动 u 滑块时位置不会跳（若是 u×t，u 一变所有载流子瞬移）。
   ★ 在 [−L/2, L/2) 上循环 ⇒ 画出"持续流过截面"的载流子流。 */
const HIT_V = 0.0055, HIT_S = 0.0055, HIT_L = 0.0050;   /* "正在穿过"的判定半厚 m */
function carrierPos(b, base, L){
  let z=base.z+state.drift;
  z=((z+0.5)%1+1)%1-0.5;                                /* 归一到 [−0.5,0.5) */
  return layT(pt(base.x*b, base.y*b, z*L));
}
/* ①：既要在面元的 footprint 里、又要贴着截面，才算"正穿过面元" */
function hitV(p){
  const l=toElemLocal(p);
  return Math.abs(l.n)<=HIT_V && Math.abs(l.a)<=elemSide()/2 && Math.abs(l.b)<=elemSide()/2;
}
/* ②：贴着截面、且方位角落在那段弧里 */
function hitS(p){
  if(Math.abs(p.z)>HIT_S) return false;
  const ph=Math.atan2(p.y,p.x), h=arcHalf();
  let d=ph; while(d> Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI;
  return Math.abs(d)<=h;
}
/* ③：贴着截面（"点"的判定就是一条线，导线本身已经退化成一个点） */
function hitL(p){ return Math.abs(p.z)<=HIT_L; }

/* ============================== 画图小工具 ============================== */
/* 半透明圆柱壳 / 圆柱体：逐"面片"填充 + 伪光照，fill 与 stroke 同色（同 2.3 介质盒） */
const GX_LX=-0.55, GX_LY=-0.83;
function cylShell(radius,h,hex,emph,alpha){
  const hh=h/2, N=40;
  for(let i=0;i<N;i++){
    const a0=2*Math.PI*i/N, a1=2*Math.PI*(i+1)/N;
    const p0=layT(pt(radius*Math.cos(a0), radius*Math.sin(a0),-hh));
    const p1=layT(pt(radius*Math.cos(a1), radius*Math.sin(a1),-hh));
    const p2=layT(pt(radius*Math.cos(a1), radius*Math.sin(a1), hh));
    const p3=layT(pt(radius*Math.cos(a0), radius*Math.sin(a0), hh));
    /* 伪光照：法矢（放倒后用**变换后**的法矢点屏幕光方向，光影跟着圆柱一起倒） */
    const nm=layT(pt(Math.cos((a0+a1)/2), Math.sin((a0+a1)/2), 0));
    const lam=Math.max(0,Math.min(1, Math.abs(nm.x*GX_LX+nm.y*GX_LY)));
    poly([p0,p1,p2,p3],{fill:hex, stroke:hex, w:1,
      fillAlpha:alpha*(0.55+0.85*lam), strokeAlpha:alpha*(0.55+0.85*lam)});
  }
}
function cylCap(radius,h,hex,alpha){
  const hh=h/2, N=40, ring=[];
  for(let i=0;i<N;i++){ const a=2*Math.PI*i/N; ring.push(pt(radius*Math.cos(a),radius*Math.sin(a),hh)); }
  poly(ring,{fill:hex,stroke:hex,w:1,fillAlpha:alpha,strokeAlpha:alpha});
}
/* 沿 z 的一段圆弧（横截线）；① 放倒时随场景一起转（layT 内有 mode 守卫，② 不受影响） */
function arcPts(radius,z,a0,a1,n){
  const out=[];
  for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; out.push(layT(pt(radius*Math.cos(a),radius*Math.sin(a),z))); }
  return out;
}
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supStr=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function fmtN(v,d){ d=(d==null)?2:d; if(!isFinite(v)) return '—';
  return (v<0?'−':'')+Math.abs(v).toFixed(d); }
function sgnTxt(v,d){ return (v>0?'+':(v<0?'−':''))+Math.abs(v).toFixed(d==null?2:d); }
