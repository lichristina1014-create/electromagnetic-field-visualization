/* ============================================================================
   2.2 静电场中的导体 —— 页面主体（渲染引擎与 2.1 同源，见上方「向量工具 / 图元」段）

   ★ 单位约定（本页特有，全页统一）：
       长度 m　场强 kV/m　电位 kV　面电荷密度 nC/m²　腔内点电荷 µC
     为什么用 kV/m 而不是 2.1 的 V/m：导体在匀强场里的问题，外场量级就是 10³ V/m
     （10 kV/m 只是很普通的一个场），用 kV/m 读数才不至于满屏 4 个零。
     为什么腔内电荷用 µC：1 µC 在 1 m 处恰好产生 8.99 kV/m —— 与「外场 10 kV/m」同量级。
     若仍用 nC，电荷的场会比外场小 6 个量级，画在同一张图里整个被淹没。

   ★★ 全页用**严格解析解**，不做数值采样（这是本页最重要的技术决定）：
       导体球（半径 a）放进匀强外场 E₀ẑ，取导体电位为 0
         V(r,θ) = −E₀(r − a³/r²)·cosθ   (r ≥ a)      V ≡ 0  (r ≤ a)
         E_r    =  E₀(1 + 2a³/r³)·cosθ                E ≡ 0  (r ≤ a)
         E_θ    = −E₀(1 −   a³/r³)·sinθ
         σ(θ)   = ε₀·E_n|表面 = 3ε₀E₀·cosθ
       三条教学结论因此是**恒等式**而不是近似，自检可以直接钉死：
         ① r ≤ a 时 |E| ≡ 0（严格 0，不是"很小"）
         ② r = a 时 E_θ ≡ 0 ⇒ 表面场严格沿法向
         ③ V(a,θ) ≡ 0（任意 θ）⇒ 导体是等位体、表面是等位面
   ============================================================================ */

/* ============================== 目录 ============================== */
const NAV = [
  { ch:'第 1 章 · 矢量分析', items:[
    { id:'coord',  t:'1.1 三种常见坐标系', ready:true, href:'index.html' },
    { id:'ch1-2',  t:'1.2 矢量的代数运算', ready:true, href:'1.2-vector-algebra.html' },
    { id:'ch1-3',  t:'1.3 方向导数与梯度', ready:true, href:'1.3-directional-derivative.html' },
    { id:'ch1-4',  t:'1.4 通量与散度',     ready:true, href:'1.4-divergence-flux.html' },
    { id:'ch1-5',  t:'1.5 环量与旋度',     ready:true, href:'1.5-curl-circulation.html' },
  ]},
  { ch:'第 2 章 · 静电场', items:[
    { id:'ch2-1', t:'2.1 电场强度与电荷密度', ready:true, href:'2.1-field-charge-density.html' },
    { id:'ch2-2', t:'2.2 静电场中的导体', ready:true, active:true },
    { t:'2.3 高斯定理及其应用' },
    { t:'2.4 电介质与极化' },
  ]},
  { ch:'第 3 章 · 恒定磁场', items:[ {t:'3.1 比奥-萨伐尔定律'}, {t:'3.2 安培环路定理'} ]},
  { ch:'第 4 章 · 时变电磁场', items:[ {t:'4.1 麦克斯韦方程组'}, {t:'4.2 均匀平面波'} ]},
];

/* ============================== 物理常数与几何 ============================== */
const EPS0  = 8.8541878128e-12;          /* 真空介电常数 F/m */
const A_C   = 0.80;                      /* 导体球半径 m */
const B_C   = 0.52;                      /* 空腔球壳内半径 m（③ 静电屏蔽） */
/* σ[nC/m²] = 3ε₀E₀·cosθ，E₀ 取 kV/m ⇒ 3·8.854e-12·1e3·1e9 = 26.56256… */
const SIG_K = 3*EPS0*1e3*1e9;
/* 点电荷：q 取 µC、r 取 m ⇒ E[kV/m] = Q_KV·q/r²，Q_KV = 1e-6/(4πε₀)/1e3 = 8.9875517873… */
const Q_KV  = 1e-6/(4*Math.PI*EPS0)/1e3;
/* ★ E 矢量的显示长度（世界米）：**线性 + 上下限钳制**，与 2.1 的 LE 同构。
   ⚠️ 绝不能用固定的 "m per (kV/m)"：|E| 在球面上跨 0 → 3E₀（赤道 0、两极 30），
      固定比例下若要两极不超长，典型场点只剩 ~23 px（实测），箭头与箭头头一样大。
   取 EREF = 2E₀ ⇒ |E| = E₀（典型场点）约 0.45 m ≈ 70 px；|E| ≥ 1.8E₀ 封顶 0.90 m（≈1.1a）。
   注意 E / E_n / E_t 三者必须**共用同一个比例 s = eLen/L**，否则平行四边形分解不闭合。 */
const EARR_MAX = 0.90, EARR_GATE = 0.12;
const eLen = (mag,E0)=>Math.max(0.05, Math.min(EARR_MAX, mag/(2*E0)));
const FL_B  = [0, 0.45, 0.95, 1.32, 1.60, 1.723, 2.05, 2.60];   /* 场线瞄准距离（× A_C） */
const FL_PH = [0, Math.PI/2, Math.PI, 3*Math.PI/2];             /* 4 条子午面（= 2 个平面） */
/* ★ 临界瞄准距离 b_crit(t) = a·√(1+2t)：b < b_crit 的场线落在导体上，b > b_crit 的掠过。
   推导：球面上 ψ = E₀sin²θ(a²/2 + t·a²) ⇒ ψ_max = E₀a²(1/2+t) = E₀b²/2 ⇒ b_crit = a√(1+2t)。
   t=1（静电平衡）⇒ √3·a（与旧版一致）；t=0（"外场刚加上、电荷还没动"的匀强场）⇒ a，
   恰好就是"擦过赤道的那条直线" —— 于是**同一个公式贯穿整个动画**。 */
const Bcr  = tv => A_C*Math.sqrt(1+2*(tv==null?1:tv));
const B_CRIT = A_C*Math.sqrt(3);        /* 兼容：静电平衡下的临界值 √3·a */

const E0_RANGE=[2,20];                   /* 外场 kV/m */
const RP_RANGE=[0.32,1.90];              /* 探针半径 m */
const QC_RANGE=[-2,2];                   /* 腔内电荷 µC */
const TH_LIM=[2,178];                    /* 探针极角的可用范围（避开极点退化） */

/* ============================== 状态 ============================== */
const state = {
  mode:'build',            /* build | concl | shield */
  E0:10,                   /* 外场 E₀ (kV/m) */
  t:1,                     /* ① 自由电荷的迁移进度 0→1 */
  g:1,                     /* ① 外加场的建立度 0→1（1 = 已建立；播放的"阶段②"期间被驱动） */
  anim:null,               /* ① 全过程播放：null | {u:0→1, playing:bool} */
  rp:1.15,                 /* ② 探针半径 r (m) */
  thp:55,                  /* ② 探针极角 θ (°) */
  qc:0,                    /* ③ 腔内电荷 (µC) */
  sweep:null,              /* ② 自动扫掠：'rad' | 'surf' */
  show:{box:true, lines:true, chg:true, inner:true, flow:true, equi:true, dec:true, vz:true},
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
};
const SWEEP_SPEED={rad:0.55, surf:34};   /* rad: m/s   surf: °/s */

/* ══════════ ① 的「全过程播放」时间轴 ══════════
   用户要的叙事：**一开始没有电场 → 加上外加场 → 导体里的自由电荷迁移 → 静电平衡**。
   用一条内部时间轴 u ∈ [0,1] 驱动两个物理量（g 外场建立度、t 电荷迁移进度），
   而不是把"没有外场"硬塞进 t 里 —— 那样 t 的物理含义（电荷迁移到哪一步）会被污染。
     u ∈ [0   , 0.12]  阶段①  无外加电场：g=0, t=0（外场幅值 E₀·g 恒为 0）
     u ∈ [0.12, 0.36]  阶段②  外加匀强场建立：g 0→1（光滑），t 仍为 0（电荷还没来得及动）
     u ∈ [0.36, 1   ]  阶段③  自由电荷迁移：g=1，t 0→1（表面电荷堆起来、内部场被抵消）
                        阶段④ = 阶段③的终点（t=1），不再单独占时间。
   ⚠️ 用 smoothstep 而不是线性：两头速度为 0 ⇒ 场线"由直变弯"的起止不会哏一下。 */
const ANIM_DUR = 5.6;                    /* 整段时长（秒） */
const PH_FIELD = [0.12, 0.36];           /* 阶段②的 u 区间 */
const PH_MIG   = [0.36, 1.00];           /* 阶段③的 u 区间 */
const PH_IDLE  = [0.00, 0.12];           /* 阶段①的 u 区间 */
const sstep = x => { x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
const animG = u => sstep((u-PH_FIELD[0])/(PH_FIELD[1]-PH_FIELD[0]));
const animT = u => sstep((u-PH_MIG[0])/(PH_MIG[1]-PH_MIG[0]));
const STAGE_NAMES=['① 无外加电场','② 外加匀强场建立','③ 自由电荷迁移','④ 静电平衡'];
const STAGE_NOTES=[
  '还没有外加电场：导体里的自由电荷均匀分布、宏观不显电，内部也没有场',
  '外加匀强场正在建立：电荷还没来得及动 ⇒ 场线笔直穿过导体',
  '自由电荷正在迁移：正电荷顺场线、负电荷逆场线 ⇒ 表面堆出感应电荷',
  '静电平衡：内部合场被抵消到 0、表面场垂直、导体是等位体',
];
/* 当前处于第几阶段（0~3）。没有动画在跑时由 (g,t) 反推 ⇒ 手动拖滑块也能正确显示阶段。
   ⚠️ 边界：g=1 但 t=0（外场已就位、电荷还没动）算**②的末尾**而不是③ —— 那时场线还是笔直的，
      正是 ② 的标志；若算成 ③，卡片会高亮"自由电荷迁移"而画面上什么都没迁。 */
function stageOf(){
  if(state.g<0.05) return 0;
  if(state.g<0.995) return 1;
  if(state.t<=0.02) return 1;
  if(state.t<0.995) return 2;
  return 3;
}
/* 时间轴反推（画进度条用）：没在播放时按当前 (g,t) 折算一个等效 u */
function animU(){
  if(state.anim) return state.anim.u;
  if(state.g<0.995) return PH_FIELD[0]+(PH_FIELD[1]-PH_FIELD[0])*state.g;
  return PH_MIG[0]+(PH_MIG[1]-PH_MIG[0])*state.t;
}
/* 步进一帧。返回 false（没在播）/ true（继续播）/ 'end'（刚播完）。 */
function stepAnim(dt){
  const A=state.anim;
  if(!A || !A.playing) return false;
  A.u=Math.min(1, A.u+dt/ANIM_DUR);
  state.g=animG(A.u); state.t=animT(A.u);
  if(A.u>=1){ state.g=1; state.t=1; state.anim=null; return 'end'; }
  return true;
}
/* 退出动画、回到"手动"模式（g 归 1：手动调的是电荷迁移进度，外场默认已建立） */
function stopAnim(){ state.anim=null; state.g=1; }

/* ============================== 球坐标 ⇄ 直角坐标 ============================== */
const sphPt=(r,th,ph)=>{const st=Math.sin(th);return pt(r*st*Math.cos(ph), r*st*Math.sin(ph), r*Math.cos(th));};
const eR  =(th,ph)=>pt(Math.sin(th)*Math.cos(ph), Math.sin(th)*Math.sin(ph), Math.cos(th));
const eTh =(th,ph)=>pt(Math.cos(th)*Math.cos(ph), Math.cos(th)*Math.sin(ph), -Math.sin(th));
const clamp1=v=>Math.max(-1,Math.min(1,v));

/* ============================== 解析场 ============================== */
/* 严格解（r ≥ a 用外解、r < a 严格为 0）；θ 自 +z 起算。返回 {Er,Eth}，单位 kV/m。
   ⚠️ 边界必须是**严格小于**：r = a（导体表面）属于"外部解"，那里 E_n = 3E₀cosθ、E_θ = 0。
      写成 r ≤ a 会把表面误判成内部而返回 0 —— 那样"表面场垂直且等于 σ/ε₀"这条结论
      在读数里就永远是 0（本页最早的一个 bug 就是这个）。 */
function fieldE(r,th,E0){
  if(r < A_C) return {Er:0,Eth:0};
  const k=A_C*A_C*A_C/(r*r*r);
  return {Er:E0*(1+2*k)*Math.cos(th), Eth:-E0*(1-k)*Math.sin(th)};
}
/* ① 的"建立过程"插值：
     t=0 → 纯匀强场（球内也照样穿过）　t=1 → 严格解（球内恰好被抵消干净）
   ⚠️ t<1 只是**过程示意**。真实的静电平衡在 ~10⁻¹⁸ s 内就完成了，
      物理上根本不存在"看到中间状态"的可能 —— 这里是为了把"为什么内部会变成 0"讲出来。 */
function fieldT(r,th,E0,t){
  if(r<A_C) return {Er:E0*(1-t)*Math.cos(th), Eth:-E0*(1-t)*Math.sin(th)};
  const k=A_C*A_C*A_C/(r*r*r);
  return {Er:E0*(1+2*t*k)*Math.cos(th), Eth:-E0*(1-t*k)*Math.sin(th)};
}
const fieldAt=(r,th,E0,t)=>(t==null?fieldE(r,th,E0):fieldT(r,th,E0,t));
function evec(r,th,ph,E0,t){
  const f=fieldAt(r,th,E0,t);
  return vadd(vmul(eR(th,ph),f.Er), vmul(eTh(th,ph),f.Eth));
}
/* 电位 kV。r ≤ a 恒为 0 ⇒ 导体是等位体（参考点取在导体上）。 */
function volt(r,th,E0){ return r<=A_C ? 0 : -E0*(r - A_C*A_C*A_C/(r*r))*Math.cos(th); }
/* 面电荷密度 nC/m²（t 为 ① 的建立进度，其余场景 t 传 null = 1） */
const sigma=(th,E0,t)=>(t==null?1:t)*SIG_K*E0*Math.cos(th);

/* ③ 空腔球壳：内半径 B_C、外半径 A_C。腔内中心放点电荷 qc(µC)。 */
function shellField(r,th,E0,qc){
  if(r<B_C)  return {Er:Q_KV*qc/(r*r), Eth:0};        /* 腔内：只由 q 决定，外场进不来 */
  if(r<=A_C) return {Er:0, Eth:0};                     /* 导体壳中：E ≡ 0 */
  const k=A_C*A_C*A_C/(r*r*r);                         /* 壳外：外表面等效为"匀强场中的球 + 总量 q" */
  return {Er:E0*(1+2*k)*Math.cos(th) + Q_KV*qc/(r*r), Eth:-E0*(1-k)*Math.sin(th)};
}
function shellVolt(r,th,E0,qc){
  if(r<B_C)  return Q_KV*qc*(1/r - 1/B_C);             /* 内表面 V=0（与导体同电位）*/
  if(r<=A_C) return 0;
  return -E0*(r - A_C*A_C*A_C/(r*r))*Math.cos(th) + Q_KV*qc*(1/r - 1/A_C);
}
/* 面电荷密度：内表面 −q/(4πb²) 均匀；外表面 = 外场诱导 + q/(4πa²) 均匀（nC/m²） */
const sigIn =(qc)=>-qc*1000/(4*Math.PI*B_C*B_C);
const sigOut=(th,E0,qc)=>SIG_K*E0*Math.cos(th) + qc*1000/(4*Math.PI*A_C*A_C);

/* ═══════════ ①② 的场线：解析流函数 ψ = E₀ sin²θ (r²/2 + t·a³/r) 的等值线 ═══════════
   ★★ 关键发现（整个"播放动画"就靠这一条）：**插值场也有精确流函数**。
     fieldT 给出的外场（r ≥ a）是  E_r = E₀(1+2t·a³/r³)cosθ、E_θ = −E₀(1−t·a³/r³)sinθ，
     把 a³/r³ 换成 k 后直接验证：
       (1/(r²sinθ))·∂ψ/∂θ = E₀cosθ(1+2t·a³/r³) = E_r          ✓
       −(1/(r sinθ))·∂ψ/∂r = −E₀sinθ(1−t·a³/r³) = E_θ          ✓
     于是 t 从 0 到 1 的**每一帧**，场线都是"给定 ψ 解 r(θ)"的精确等值线，不是数值积分近似：
       t = 1  ⇒  ψ = E₀sin²θ(r²/2 + a³/r)      （静电平衡，与旧版逐字相同）
       t = 0  ⇒  ψ = E₀ r²sin²θ/2              （匀强场 ⇒ r·sinθ = b，**精确的直线**）
     所以"场线随电荷迁移由直变弯"这件事也是解析的，而且 t→1 时与严格解**无缝衔接**。

   等值线方程（C = E₀b²/2，b 是远处的瞄准距离）：
     sin²θ(r²/2 + t·a³/r) = b²/2  ⇒  **r³ − (b²/sin²θ)·r + 2t·a³ = 0**（取最大正根）
   球面上 ψ = E₀a²sin²θ(1/2+t) ⇒ 等值线就是 θ=const ⇒ **场线垂直入射球面**（正是要讲的那条）。
   ⇒ 只有 b < a√(1+2t) 的线落在导体上（见 Bcr）。 */
function streamR(th,b,tv){
  const s=Math.max(Math.sin(th),1e-7);
  const P=b*b/(s*s), q=2*(tv==null?1:tv)*A_C*A_C*A_C, p=-P;
  /* 三个实根的条件 D=(q/2)²+(p/3)³ ≤ 0 ⇒ P ≥ 3·(q/2)^(2/3)。
     ⚠️ 写成 P ≥ 3a² 只对 t=1 成立；t=0 时 q=0（匀强场）**任何 b 都有正根**，
        用旧条件会把整片直线场线判成"无解"（动画第 1 帧就空白）。 */
  if(P < 3*Math.pow(Math.abs(q)/2, 2/3)*(1-1e-9)) return NaN;   /* 该 θ 上没有场线 */
  const D=(q/2)*(q/2)+(p/3)*(p/3)*(p/3);
  /* ⚠️ 数学上上面那个条件保证 D ≤ 0 ⇒ **永远走三实根这一支**。
     不能写 `if(D<0)` 把 D==0 丢给 Cardano：D=0 时三次方程是 (r−a)²(r+2a)=0，
     Cardano 公式只给出单根 −2a，**正好漏掉我们最需要的重根 r=a**（表面落点！）；
     浮点还会把 D 算成 ±1e-18 两边跳。所以给 D 留一个正容差，把边界一并收进三角支。 */
  if(D <= 1e-14*A_C*A_C*A_C*A_C*A_C*A_C){
    const m=2*Math.sqrt(P/3);
    const arg=Math.max(-1,Math.min(1,(3*q)/(2*p)*Math.sqrt(3/P)));
    const t0=Math.acos(arg)/3;
    let best=-1e9;
    for(let k2=0;k2<3;k2++){ const r=m*Math.cos(t0-2*Math.PI*k2/3); if(r>best) best=r; }
    if(best>0) return best;
  }
  const sD=Math.sqrt(Math.max(0,D)), r=Math.cbrt(-q/2+sD)+Math.cbrt(-q/2-sD);
  return r>0?r:NaN;
}
/* r(θ) 在 (0, 90°] 上单调递减 ⇒ 二分求"r = target"的角度 */
function thetaAtR(target,b,tv,thLo,thHi){
  let lo=thLo, hi=thHi;
  for(let i=0;i<46;i++){
    const m=(lo+hi)/2, r=streamR(m,b,tv);
    if(!isFinite(r)||r>target) lo=m; else hi=m;
  }
  return (lo+hi)/2;
}
/* 返回一批"xz 平面内的折线"（绕 z 轴转到各 φ 就是 3D 场线）。tv = 建立进度。 */
function dipolarLines(tv){
  const Zmax=A_C*3.1, segs=[], bc=Bcr(tv);
  FL_B.forEach(bm=>{
    const b=bm*A_C;
    if(b<1e-9){                                   /* b=0：沿 z 轴，上下各一段 */
      segs.push([pt(0,0,Zmax),pt(0,0,A_C)]);
      segs.push([pt(0,0,-Zmax),pt(0,0,-A_C)]);
      return;
    }
    const hit=(b < bc*0.999);
    const thEnd = hit ? Math.asin(Math.min(1,b/bc)) : Math.PI/2;
    const thSt  = thetaAtR(Zmax,b,tv,1e-4,thEnd*0.99999);
    const N=34, up=[];
    for(let i=0;i<=N;i++){
      const th=thSt+(thEnd-thSt)*i/N, r=streamR(th,b,tv);
      if(!isFinite(r)) break;
      up.push(pt(r*Math.sin(th),0,r*Math.cos(th)));
    }
    if(up.length<2) return;
    if(hit){                                      /* 上半落在球面 θ₀，下半镜像落在 180°−θ₀ */
      /* ★ 末点吸附到 r=a：θ₀ 处 ψ 方程的重根就是 r=a，但浮点会让它差 ~1e-9·a。
         "场线垂直入射球面"是本页要讲的结论，落点必须**精确**在表面上（截图与断言都看这个）。 */
      up[up.length-1]=vmul(vnorm(up[up.length-1]),A_C);
      segs.push(up.slice());
      /* 下半段：镜像后**保持**"从远端 (r=Zmax) 走向球面"的顺序，不要 reverse ——
         否则段的末点变成远端，读数/断言都会被带偏（本页最早的一版就踩了这个）。 */
      segs.push(up.map(p=>pt(p.x,0,-p.z)));
    } else {                                      /* 掠过导体：过赤道一次走通 */
      segs.push(up.concat(up.slice(0,-1).reverse().map(p=>pt(p.x,0,-p.z))));
    }
  });
  return segs;
}
/* ③ 空腔壳的外部场线：场是"匀强球场 + 点电荷场"的叠加，没有单一流函数 ⇒ 只能数值积分。
   用 **RK4**（不是欧拉）+ 更小步长，并把瞄准距离限制在 1.55a 以内（避开掠射的病态区）。 */
const FL_B_SHELL=[0, 0.55, 1.05, 1.55, 2.1];
function traceLineF(fFn,bm,dir){
  const Z=A_C*3.1, hs=0.03*A_C, MAXS=800;
  let p=pt(bm*A_C,0,dir>0?-Z:Z);
  const out=[p];
  const dirAt=q=>{
    const r=vlen(q); if(r<1e-9) return pt(0,0,0);
    const th=Math.acos(clamp1(q.z/r)), f=fFn(r,th);
    const d=vadd(vmul(eR(th,0),f.Er), vmul(eTh(th,0),f.Eth));
    const L=vlen(d);
    return L<1e-12 ? pt(0,0,0) : vmul(d,1/L);
  };
  for(let i=0;i<MAXS;i++){
    const r0=vlen(p), th0=Math.acos(clamp1(p.z/r0)), f0=fFn(r0,th0);
    if(Math.hypot(f0.Er,f0.Eth)<1e-9){            /* 场为零 ⇒ 线终止（导体壳内部） */
      if(r0<A_C*1.08) out.push(vmul(vnorm(p),A_C));
      break;
    }
    const u1=dirAt(p), u2=dirAt(vadd(p,vmul(u1,dir*hs*0.5)));
    const u3=dirAt(vadd(p,vmul(u2,dir*hs*0.5))), u4=dirAt(vadd(p,vmul(u3,dir*hs)));
    const u=vadd(vadd(u1,vmul(u2,2)),vadd(vmul(u3,2),u4));
    p=vadd(p, vmul(u, dir*hs/6));
    const r=vlen(p);
    if(r<A_C*1.003){ out.push(vmul(vnorm(p),A_C)); break; }
    if(Math.abs(p.z)>Z || r>3.3*A_C){ out.push(p); break; }
    out.push(p);
  }
  return out;
}
function fieldLines(E0,t){
  if(E0<1e-6) return [];                              /* 还没加外场 ⇒ 一条场线都没有 */
  /* ★★ 任意 t 都走**精确等值线**（不再退回数值积分）—— 因为插值场也有流函数（见上方推导）。
     旧版在 t<1 时用 RK4 是因为当时以为"球内有场 ⇒ 流函数不再是常量"；
     实际上我们只画球**外**那一段，而外侧的 E 始终有同一个 ψ 族（球内另行用 drawInner 表现）。 */
  return dipolarLines(t==null?1:t);
}
function shellLines(E0,qc){
  const fFn=(r,th)=>shellField(r,th,E0,qc);
  const segs=[];
  FL_B_SHELL.forEach(bm=>{
    if(bm*A_C < B_CRIT*0.998) { segs.push(traceLineF(fFn,bm,-1)); segs.push(traceLineF(fFn,bm,1)); }
    else segs.push(traceLineF(fFn,bm,1));
  });
  return segs;
}
/* 把 xz 平面内的折线绕 z 轴旋到 φ，得到一条子午线 */
const rotZ=(p,ph)=>pt(p.x*Math.cos(ph), p.x*Math.sin(ph), p.z);

/* ═══════════════ 等位面：V = V₀ 的曲面（xz 剖面内是一条"帽形"曲线） ═══════════════
   V = −E₀·cosθ·u(r)，u(r) = r − a³/r²（u 在 r>a 上严格递增，u(a)=0）
   ⇒ 给定 |V₀| 与 θ：u = |V₀|/(E₀|cosθ|) ⇒ 解 u(r)=K，牛顿迭代几轮即可。
   注意 V 的符号 = −sign(cosθ)：上半空间 V<0、下半空间 V>0 ⇒ 每个等位面只存在于一"半"。
   θ→90° 时 cosθ→0 ⇒ u→∞ ⇒ 等位面延伸向无穷远（这就是"远处又还原成水平面"）。 */
function equiR(K){
  let r=A_C+K;                                   /* r³−Kr²−a³=0，r=a 处为负、+∞ 处为正 ⇒ 唯一正根 */
  for(let i=0;i<26;i++){
    const g=r*r*r-K*r*r-A_C*A_C*A_C, gp=3*r*r-2*K*r;
    if(Math.abs(gp)<1e-12) break;
    const nr=r-g/gp;
    if(!isFinite(nr)||nr<=0) break;
    if(Math.abs(nr-r)<1e-12){ r=nr; break; }
    r=nr;
  }
  return r;
}
/* 返回半条等位面（θ 从 0 或 180 起、到能画得下的最大角为止）的剖面折线 */
function equiCurve(sign,E0,fac,Rmax){
  const V0=E0*fac;                               /* |V₀| = E₀·fac，fac 单位 m ⇒ 形状与 E₀ 无关 */
  const umax=Rmax - A_C*A_C*A_C/(Rmax*Rmax);
  const cmin=Math.min(1, V0/(E0*umax));          /* cosθ 的下限 */
  const thEnd=Math.acos(Math.max(0.02,cmin));
  const N=34, out=[];
  for(let i=0;i<=N;i++){
    const th=thEnd*i/N;
    const r=equiR(V0/(E0*Math.max(0.02,Math.cos(th))));
    const tc=sign>0 ? th : Math.PI-th;           /* 上半空间取 θ，下半空间取 180°−θ */
    out.push(sphPt(Math.min(r,Rmax),tc,0));
  }
  return out;
}

/* ══════════ ① 阶段①的"中性自由电荷" ══════════
   外场还没加上时，导体里的自由电荷是**均匀**的（正负各半、宏观不显电）。
   画在**赤道那一圈**：那里 σ 恒为 0（σ ∝ cosθ），所以它永远不会与后出现的感应电荷打架。
   alpha 随外场 g 淡出 ⇒ 阶段②一开始它就退场，换成两极的感应电荷。 */
function drawNeutralCharge(al){
  if(al<=0.02) return;
  const NV=8, rr=A_C*0.94;
  for(let j=0;j<NV;j++){
    const p=sphPt(rr,Math.PI/2,(j+0.42)/NV*2*Math.PI);
    text(p, j%2 ? '−' : '+', {color: j%2 ? '#6E9BB5' : '#C0807B',
      size:9, bold:true, align:'center', alpha:al*0.85});
  }
}

/* ============================== 绘制：共用元素 ============================== */
/* 匀强外场 E₀ 的"背景刻度"：短箭头，只标方向与大小，不参与严格解。
   传入的是**当前实际幅值** E₀·g ⇒ 播放时它是从 0 长出来的（阶段①一条都没有）。 */
function drawE0Hint(E0){
  if(E0<0.05){                                   /* 阶段①：还没有外加场 */
    text(pt(0,0,-A_C*2.5),'无外加电场',{color:'#9DB3BF',size:11.5,dy:16,align:'center'});
    return;
  }
  const s=0.16+0.055*E0;                         /* 箭头长度随 E₀ 增长（示意） */
  const G=A_C*1.75;
  for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){
    if(i===0&&j===0) continue;
    const x=i*G*0.86, y=j*G*0.86;
    arrow(pt(x,y,-A_C*2.5), pt(x,y,-A_C*2.5+s), {color:'#9DB3BF',w:1.6,headScale:.7,alpha:.75});
  }
  text(pt(0,0,-A_C*2.5), '@{E}₀ = '+E0.toFixed(1)+' kV/m', {color:'#7A8F9B',size:11.5,dy:16,align:'center'});
}

/* 表面感应电荷：按 θ 分档布 ⊕/⊖ 符号 —— 字号与透明度 ∝ |cosθ|，
   于是"两极最密、赤道为零"是看出来的（也是 σ = 3ε₀E₀cosθ 的图形）。 */
/* 表面电荷符号：按 θ 分档布 ⊕/⊖ —— 字号与透明度 ∝ |σ(θ)|/max|σ|，
   于是"两极最密、赤道为零"是看出来的（正是 σ = 3ε₀E₀cosθ 的图形）。
   ★ 泛化成"按 σ 函数取值"，于是空腔壳（σ_out 可以是同号）也共用这一段。 */
/* ★ 把"要保护的画布文字"折算成**屏幕避让点串**（每 ~10px 一个点）。
   ⊕/⊖ 的避让必须用一串点而不是一个锚点 —— 一句注释 150+ px 宽，一个点挡不住。
   宽度估计：CJK 按 1.0×字号、其它按 0.55×字号（与实测误差 <15%，够用）。 */
function textWidth(str,size){
  let w=0; for(const ch of str) w += (ch.charCodeAt(0)>0x2E80 ? 1.0 : 0.55);
  return w*size;
}
/* 富文本标记对宽度估计是噪声（`@{E}` 会被算成 5 个字）⇒ 估宽前先把标记剥掉 */
const plainTxt = s => String(s).replace(/@\{([^}]*)\}/g,'$1').replace(/_([a-zA-Z0-9₀-₉])/g,'$1');
function avoidText(p0,str,size,dx,dy,align){
  const s=pr(p0), a=[], w=textWidth(str,size), st=Math.max(9,size*0.62);
  let x0=s.x+(dx||0);
  if(align==='center') x0-=w/2; else if(align==='right') x0-=w;
  const n=Math.max(2,Math.ceil(w/st));
  for(let k=0;k<=n;k++) a.push({x:x0+Math.min(k*st,w), y:s.y+(dy||0)});
  return a;
}
function drawSurfaceCharge(rr,sigFn,o){
  o=o||{};
  const al=(o.alpha==null?1:o.alpha);
  if(al<=0.01) return;
  const NU=o.nu||9, NV=o.nv||8, ths=[], mags=[];
  for(let i=0;i<NU;i++){ const th=(i+0.5)/NU*Math.PI; ths.push(th); mags.push(Math.abs(sigFn(th))); }
  const mx=Math.max.apply(null,mags.concat([1e-9]));
  /* ⚠️ 必须做**屏幕空间最小间距**过滤：两极附近 NV 个 φ 会投影到几乎同一个点
     （实测相邻两个 ⊕ 只差 0.5 px ⇒ 糊成一团）。以"先放先得"的方式丢弃过近的符号。
     ⚠️ o.share 让**多次调用共用同一张已放表** —— ③ 的内表面 −q 与外表面 +q 是两次调用，
        不共享时两者会在屏幕上叠在一起（实测 3 px）。 */
  const SEPS=Math.max(15, (o.sep||15));
  const placed = o.share || [];
  const w = o.avoidS || [];
  const gap = o.probeGap || 34;
  const rj = o.avoidRect;                       /* 屏幕矩形 [x,y,w,h]：卡片区域整体不布点 */
  for(let i=0;i<NU;i++){
    const th=ths[i], s=sigFn(th), mag=mags[i]/mx;
    if(mag<0.10) continue;
    for(let j=0;j<NV;j++){
      const ph=(j+0.42)/NV*2*Math.PI;
      const p=sphPt(rr,th,ph), sp=pr(p);
      if(rj && sp.x>rj[0]-6 && sp.x<rj[0]+rj[2]+6 && sp.y>rj[1]-6 && sp.y<rj[1]+rj[3]+6) continue;
      if(w.some(q=>Math.hypot(sp.x-q.x,sp.y-q.y)<gap)) continue;
      if(placed.some(q=>(q.x-sp.x)*(q.x-sp.x)+(q.y-sp.y)*(q.y-sp.y)<SEPS*SEPS)) continue;
      placed.push(sp);
      text(p, s>0?'+':'−', {color: s>0?C.crimson:'#2E7FA6',
        size:7.5+7.5*mag, bold:true, align:'center',
        alpha:(0.25+0.75*mag)*al});
    }
  }
}
/* ① 的"电荷迁移"弧箭头：正电荷顺场线往 +z 极跑、负电荷逆场线往 −z 极跑。
   ★ 弧所在子午面**跟着相机方位走**：φ = cam.az + 0.55。
     原先写死 φ = 0.42，而默认方位 az = 0.62 ⇒ 两者只差 0.20 rad(11°) ⇒ 那个平面几乎**侧对**相机，
     整条弧投影成一条穿球而过的**直线**（实测竖直跨度 h=376px、水平只有 w=78px，看不出是弧）。
     φ 跟着 az 走以后，任何机位下这条弧都"半开着"朝向观察者，而且深度恒为正（不会被球挡掉）。 */
function drawFlow(E0,t){
  if(state.g<0.9) return;                        /* 外场还没建立，无从谈"顺/逆场线" */
  if(t<=0.02||t>=0.985) return;                  /* 两端都不画：还没动 / 已停稳 */
  const a=0.55*(1-Math.abs(2*t-1))*2.4;          /* 中途最亮 */
  const ph=cam.az+0.55, up=[], dn=[];
  for(let k=0;k<=16;k++){
    const th=Math.PI*0.50 - Math.PI*0.30*k/16;   /* 上半：赤道 → 接近 +z 极 */
    up.push(sphPt(A_C*1.16,th,ph-0.26));
    const th2=Math.PI*0.50 + Math.PI*0.28*k/16;  /* 下半：赤道 → 接近 −z 极（别过 140°，否则沉到球后面） */
    dn.push(sphPt(A_C*1.16,th2,ph+0.26));
  }
  curve(up,  {color:C.crimson,w:2.2,arrowEnd:true,alpha:Math.min(1,a)});
  curve(dn,  {color:'#2E7FA6',w:2.2,arrowEnd:true,alpha:Math.min(1,a)});
  text(up[up.length-1],'正电荷',{color:C.crimson,size:11,bold:true,dx:6,dy:-4,alpha:Math.min(1,a)});
  text(dn[dn.length-1],'负电荷',{color:'#2E7FA6',size:11,bold:true,dx:6,dy:10,alpha:Math.min(1,a)});
}
/* ① 的球内合场：箭头长度 ∝ (1−t)·E₀·g ⇒ t→1 时"肉眼可见地缩到 0"（阶段①整支不画）。
   ★ 刻意空出正中央一格 —— 那里要写"内部 |E| = ?"的读数，别叠字。 */
function drawInner(Ea,t,Eref){
  if(!state.show.inner || t>=0.995) return;
  if(Ea*(1-t) < 0.02*Eref) return;               /* 场小到看不见 ⇒ 一支都不画（别剩秃箭头） */
  const L=eLen(Ea*(1-t), Eref), g=A_C*0.40;
  for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){
    if(i===0&&j===0) continue;
    const x=i*g, y=j*g, z0=-L*0.5;
    arrow(pt(x,y,z0), pt(x,y,z0+L), {color:'#7A8F9B',w:1.8,headScale:.75,alpha:.55+.35*(1-t),
      z:1e4+30});
  }
}
function drawFieldLines(E0,t){
  const segs=fieldLines(E0,t);
  if(!segs.length) return;
  const eq=(t==null||t>0.995);
  const col = eq ? '#2E7FA6' : '#8FB3C6';
  const al = (eq ? 0.62 : 0.50) * (t==null ? 1 : (0.30+0.70*state.g));   /* 阶段②里随外场一起淡入 */
  segs.forEach(sg=>{
    if(sg.length<2) return;
    FL_PH.forEach(ph=>curve(sg.map(p=>rotZ(p,ph)), {color:col,w:1.25,alpha:al}));
  });
}
function drawAxesFor(){ drawAxes(A_C*2.35); }

/* 小图/小卡用的画布助手（与 2.1 同源） */
function txt(x,y,str,o={}){
  ctx.save();
  const lo=richLayout(ctx,parseRich(str),o.size||12,!!o.bold);
  richDraw(ctx,lo,x,y,o.align||'left',o.color||C.ink);
  ctx.restore();
}
function rrPath(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function crd(x,y,w,h){
  ctx.save();
  ctx.shadowColor='rgba(30,60,80,.10)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2;
  rrPath(x,y,w,h,10); ctx.fillStyle='rgba(255,255,255,.95)'; ctx.fill();
  ctx.restore(); ctx.save();
  rrPath(x,y,w,h,10); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke();
  ctx.restore();
}
const CARD_W=248, CARD_X=()=>W-CARD_W-16, CARD_Y=62;

/* ════════════ 小卡：电位沿 z 轴的剖面 —— "导体内部是一条水平线" ════════════
   这是"导体是等位体"最直接的证据：|z| < a 的一段严格平（V=0），出球面才弯。 */
function chartVz(){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W, h=150;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,'电位沿 z 轴的剖面　V(z)',{size:11.5,bold:true,color:'#1F3D4C'});
  const px0=x0+40, py0=y0+32, pw=w-56, ph=h-66;
  const E0=state.E0;
  const ZR=A_C*2.2;
  const Vmax=E0*(ZR-A_C*A_C*A_C/(ZR*ZR));        /* z=+ZR 处的 |V| 作为纵轴满量程 */
  const fx=z=>px0+pw*(z+ZR)/(2*ZR);
  const fy=v=>py0+ph*0.5-ph*0.45*(v/Vmax);
  /* 轴 */
  ctx.save(); ctx.strokeStyle='#EEF3F6'; ctx.lineWidth=1;
  [0.5,-0.5].forEach(k=>{const y=fy(k*Vmax); ctx.beginPath(); ctx.moveTo(px0,y); ctx.lineTo(px0+pw,y); ctx.stroke();});
  ctx.strokeStyle='#DCE6EB'; ctx.beginPath(); ctx.moveTo(px0,fy(0)); ctx.lineTo(px0+pw,fy(0)); ctx.stroke();
  ctx.restore();
  /* 导体那一段：粗绿线，标「等位」 */
  const xL=fx(-A_C), xR=fx(A_C), y0v=fy(0);
  ctx.save(); ctx.strokeStyle=C.green; ctx.lineWidth=3.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(xL,y0v); ctx.lineTo(xR,y0v); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.fillStyle='rgba(62,155,79,.10)';
  ctx.fillRect(xL,py0,xR-xL,ph); ctx.restore();
  /* V(z) 两条曲线：z>0 用 θ=0（V=−E₀u）、z<0 用 θ=180°（V=+E₀u） */
  ctx.save(); ctx.strokeStyle=C.blue; ctx.lineWidth=2.2; ctx.beginPath();
  let first=true;
  for(let i=0;i<=80;i++){
    const z=ZR*i/80, v=-E0*(z-A_C*A_C*A_C/(z*z||1e-9));
    const X=fx(Math.max(z,A_C)), Y=fy(z<=A_C?0:v);
    if(first){ctx.moveTo(X,Y);first=false;} else ctx.lineTo(X,Y);
  }
  ctx.stroke();
  ctx.beginPath(); first=true;
  for(let i=0;i<=80;i++){
    const z=-ZR*i/80, az=Math.abs(z), v=E0*(az-A_C*A_C*A_C/(az*az||1e-9));
    const X=fx(Math.min(z,-A_C)), Y=fy(z>=-A_C?0:v);
    if(first){ctx.moveTo(X,Y);first=false;} else ctx.lineTo(X,Y);
  }
  ctx.stroke(); ctx.restore();
  /* 探针位置竖线 */
  if(state.mode==='concl'){
    const P=sphPt(state.rp,state.thp*D2R,0);
    if(Math.abs(P.x)<1e-6){
      const zc=P.z; const v=volt(Math.abs(zc),zc>=0?0:Math.PI,E0)*Math.sign(zc||1);
      const X=fx(Math.max(-ZR,Math.min(ZR,zc)));
      ctx.save(); ctx.setLineDash([4,4]); ctx.strokeStyle='#B9CBD6'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(X,py0); ctx.lineTo(X,py0+ph); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(X,fy(v),4.2,0,7); ctx.fillStyle=C.purple; ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
    }
  }
  txt(px0-6,py0+4,'+'+(Vmax).toFixed(0),{size:10,color:'#7A8F9B',align:'right'});
  txt(px0-6,y0v+4,'0',{size:10,color:'#7A8F9B',align:'right'});
  txt(px0-6,py0+ph+4,'−'+(Vmax).toFixed(0),{size:10,color:'#7A8F9B',align:'right'});
  txt(xL,py0+ph+16,'−a',{size:10,color:'#7A8F9B',align:'center'});
  txt(xR,py0+ph+16,'+a',{size:10,color:'#7A8F9B',align:'center'});
  txt(x0+w/2,py0+ph+28,'导体内部（绿色段）严格水平 ⇒ 等位体（V 单位 kV）',{size:10,color:'#2C6B3B',align:'center'});
}
