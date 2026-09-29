(async()=>{
const R=[];
const T=(n,c,v)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(v===undefined?'':v));
const d0=state.d;

/* ══════ A. 流函数 W 与精确场 dipAt 的严格相容性 ══════
   E_r = Q_KV·(1/(r²sinθ))·∂W/∂θ,  E_θ = −Q_KV·(1/(r sinθ))·∂W/∂r
   W 记错一个符号、或 4πε₀ 的换算差一档，这里立刻炸。 */
function Wp(r,th,d){ return dipW(pt(r*Math.sin(th),0,r*Math.cos(th)),d); }
function cmpAt(r,th,d){
  const P=pt(r*Math.sin(th),0,r*Math.cos(th)), E=dipAt(P,d);
  const eR=pt(Math.sin(th),0,Math.cos(th)), eT=pt(Math.cos(th),0,-Math.sin(th));
  const Er=vdot(E,eR), Et=vdot(E,eT), h=1e-4;
  const dWdT=(Wp(r,th+h,d)-Wp(r,th-h,d))/(2*h);
  const dWdR=(Wp(r+h,th,d)-Wp(r-h,th,d))/(2*h);
  const Erp= Q_KV*dWdT/(r*r*Math.sin(th));
  const Etp=-Q_KV*dWdR/(r*Math.sin(th));
  const sc=Math.max(Math.hypot(Er,Et),1e-12);
  return Math.hypot(Er-Erp, Et-Etp)/sc;
}
let worst=0, wp='';
[[0.25,0.35],[0.25,1.10],[0.55,0.60],[0.90,0.30],[0.90,1.35],[d0*0.9,0.55]].forEach(([r,th])=>{
  if(r<=d0/2*1.02) return;
  const e=cmpAt(r,th,d0); if(e>worst){ worst=e; wp='r='+r.toFixed(2)+' θ='+th; }
});
T('ψ 的偏导数精确重建 @{E}（相对误差 < 1e-4）', worst<1e-4, 'worst='+worst.toExponential(2)+'  @'+wp);

let axisOk=true, axMax=0;
[0.30,0.50,0.90,1.40].forEach(r=>{
  const e=dipAt(pt(0,0,r),d0).z, a=dipEaxis(r,d0), rel=Math.abs(e-a)/Math.abs(a);
  axMax=Math.max(axMax,rel); if(rel>1e-12) axisOk=false;
});
T('轴线上 dipEaxis ≡ dipAt 的 z 分量', axisOk, 'max rel='+axMax.toExponential(2));

/* 赤道线的**严格闭式**：E(ρ,0,0) = −Q_KV·q·d/(ρ²+d²/4)^{3/2} ẑ（x 分量严格为 0） */
let eqMax=0, eqX=0;
[0.2,0.5,0.9,1.5].forEach(rho=>{
  const E=dipAt(pt(rho,0,0),d0);
  const ex=-Q_KV*DIP_Q*d0/Math.pow(rho*rho+d0*d0/4,1.5);
  eqMax=Math.max(eqMax, Math.abs(E.z-ex)/Math.abs(ex)); eqX=Math.max(eqX, Math.abs(E.x));
});
T('赤道线上 @{E} 有严格闭式（x 分量恒 0）', eqMax<1e-12 && eqX<1e-15,
  'max rel='+eqMax.toExponential(2)+'　|x|='+eqX.toExponential(2));

/* 对数斜率必须**从 2 那一侧逼近 3**（点电荷近场 1/r²、偶极子远场 1/r³） */
function expo(r){ const h=r*1e-3;
  return -(Math.log(dipEaxis(r+h,d0))-Math.log(dipEaxis(r-h,d0)))/(Math.log(r+h)-Math.log(r-h)); }
const p12=expo(1.2), p24=expo(2.4), p48=expo(4.8);
T('远处对数斜率 → 3（1/r³），且单调收敛', p12>p24 && p24>p48 && Math.abs(p48-3)<0.01,
  'p(1.2)='+p12.toFixed(4)+'  p(2.4)='+p24.toFixed(4)+'  p(4.8)='+p48.toFixed(4));

/* ══════ B. 场线的结构性质 ══════ */
const L=dipLines().filter(t=>!t.axis);
T('每条场线都从 +q 出发、落在 −q 上（通量必须闭合）',
  L.length===DIP_RMAX.length && L.every(t=>t.hit),
  L.filter(t=>t.hit).length+'/'+L.length+' 条（d='+d0.toFixed(2)+'）');
T('ψ 沿轨迹守恒（积分误差的相对漂移 < 1e-3）',
  L.every(t=>t.wdrift<1e-3), 'max='+Math.max.apply(null,L.map(t=>t.wdrift)).toExponential(2));
T('每条场线的远端极值确实命中目标 DIP_RMAX',
  L.every((t,i)=>{ let m=0; t.pts.forEach(p=>{const r=vlen(p); if(r>m)m=r;}); return Math.abs(m-DIP_RMAX[i])/DIP_RMAX[i]<0.02; }),
  L.map((t,i)=>{let m=0;t.pts.forEach(p=>{const r=vlen(p);if(r>m)m=r;});return m.toFixed(3)+'→'+DIP_RMAX[i];}).join(' '));
T('r_max(α) 单调递减（二分法反解的前提）',
  (()=>{ const as=[0.6,0.9,1.2,1.57,1.9,2.2].map(a=>dipRmax(a,d0));
    return as.every((v,i)=>i===0||v<as[i-1]); })(),
  [0.6,0.9,1.2,1.57,1.9,2.2].map(a=>dipRmax(a,d0).toFixed(3)).join(' > '));
/* ⚠️ 判"场线关于赤道面对称"，**三种错法全试过、全是假失败**，别再踩：
     · 逐序号比 pts[i] ↔ pts[n−1−i] ⇒ 偏差恰好 = d/2 = 0.11 m。
       因为第 0 个点是**发射点**（离 +q 有 ε=0.16d），末点却是"吸附到 −q"停下的，
       两端本来就不互为镜像。
     · 量"镜像点到原折线的最短距离"（全曲线）⇒ 偏差恰好 = ε = 0.16d = 0.0352 m。
       末端停在离 −q 有 ε·1.35 处，间隙被**端点空隙**支配（形状其实是对的）。
     · 按**弧长**配对（比 s* 与 S−s）⇒ 偏差又是 3.52e-2 = ε，同一个端点理由。
       弧长配对默认"起点与末点互为镜像"，而本页起点固定 ε、末点被赋成 −q 本身。
   ⇒ 真相是：**ψ(x,−z) ≡ ψ(x,z) 严格成立（解析残差实测 0.00e+0）**
     ⇒ 每个等值集（= 每条场线）必关于赤道面镜像对称，**这是构造性的，不靠数值**。
     ⇒ 分两条断言：① 解析判据必须**恰为 0**；② 折线几何上确实复现了它 ——
        用"镜像点到原折线的最短距离"、并**只取中段**（θ∈[0.35,π−0.35]）避开两极的
        参数化伪影；实测 2.7e-3 m 且**与窗口宽度无关**，就是 RK4 偏离等值线的漂移
        （wdrift~1e-4）的水平，与步长无关（h÷16 只从 2.51e-2 降到 1.36e-2，不收敛）。 */
let psiEven=0;
[[0.30,0.60],[0.50,0.90],[0.20,1.30],[0.70,0.25],[0.11,0.40],[0.35,1.10]].forEach(([x,z])=>{
  psiEven=Math.max(psiEven, Math.abs(dipW(pt(x,0,z),d0)-dipW(pt(x,0,-z),d0)));
});
T('ψ 在 z→−z 下严格偶对称 ⇒ 场线族逐条镜像对称（解析判据，残差必须为 0）',
  psiEven<1e-15, '解析残差='+psiEven.toExponential(2));
function mirrorDevWin(pts,w){
  const qs=[];
  pts.forEach(p=>{ const r=vlen(p), th=Math.acos(Math.max(-1,Math.min(1,p.z/r)));
    if(th>w && th<Math.PI-w) qs.push(pt(p.x,0,-p.z)); });
  if(qs.length<3) return NaN;
  let m=0;
  qs.forEach(q=>{ let best=1e9;
    for(let j=1;j<pts.length;j++){ const a=pts[j-1], b=pts[j], ab=vsub(b,a), aq=vsub(q,a);
      const L2=vdot(ab,ab); let u=L2>0? vdot(aq,ab)/L2 : 0; u=Math.max(0,Math.min(1,u));
      best=Math.min(best, vlen(vsub(q, vadd(a,vmul(ab,u))))); }
    m=Math.max(m,best); });
  return m;
}
const symMax=Math.max.apply(null,L.map(t=>mirrorDevWin(t.pts,0.35)));
T('轨迹折线确实复现了这份对称（镜像点到折线的最短距离，只取中段）',
  symMax<5e-3, 'max='+symMax.toExponential(2)+' m　（≈'+((symMax/0.9)*100).toFixed(2)+
  '% of 最大 r_max；RK4 漂移量级，与步长无关）');
T('赤道穿越半径 = 场线最大半径（→ 点偶极子的 C）',
  (()=>{ let ok=true;
    L.forEach(t=>{ let m=0,cross=NaN;
      t.pts.forEach(p=>{const r=vlen(p); if(r>m)m=r;});
      for(let i=1;i<t.pts.length;i++){ const A=t.pts[i-1],B=t.pts[i];
        if(A.z>0&&B.z<=0){ cross=A.x+(B.x-A.x)*((0-A.z)/(B.z-A.z)); break; } }
      if(!(Math.abs(cross-m)/m<0.03)) ok=false; });
    return ok; })(), 'ok');

/* ══════ C. 远区退化：d 越小，真实场线越贴合 r = C·sin²θ ══════ */
/* 判据统一用**绝对**尺度 r ≥ 0.35 m（两种 d 用同一把尺子）。
   若改用 r ≥ 3d 这种相对判据，d=0.34 时一个点都不满足 ⇒ 指标空转成 0 ⇒ 假通过。 */
function farDev(d){
  let m=0,n=0;
  DIP_RMAX.forEach(rm=>{
    const al=alphaForRmax(rm,d); if(!isFinite(al)) return;
    const t=dipTrace(al,d);
    let rmax=0; t.pts.forEach(p=>{const r=vlen(p); if(r>rmax)rmax=r;});
    t.pts.forEach(p=>{ const r=vlen(p); if(r<0.35) return;
      const s=Math.hypot(p.x,p.y)/r, rp=rmax*s*s; if(rp<0.10) return;
      m=Math.max(m, Math.abs(r-rp)/rp); n++; });
  });
  return {dev:m,n};
}
const fA=farDev(0.06), fB=farDev(d0), fC=farDev(0.34);
T('d 小 ⇒ 真实场线贴合点偶极子曲线 r=C·sin²θ', fA.dev<0.08,
  'dev(d=0.06)='+(fA.dev*100).toFixed(2)+'%  n='+fA.n);
T('d 大 ⇒ 明显偏离（"远区"不再成立）', fC.dev>2.5*fA.dev,
  'dev(0.34)='+(fC.dev*100).toFixed(2)+'%　dev(0.22)='+(fB.dev*100).toFixed(2)+'%　dev(0.06)='+(fA.dev*100).toFixed(2)+'%');

/* ══════ D. 朗之万函数与分子取向 ══════ */
T('L(0) = 0', Math.abs(langevin(0))<1e-15, 'L(0)='+langevin(0));
T('L 在小 a 处 = a/3（不能退化成 ∞−∞）',
  Math.abs(langevin(1e-6)-1e-6/3)<1e-12, 'L(1e-6)='+langevin(1e-6).toExponential(6));
T('L 单调递增', (()=>{ let p=-1; for(let a=0;a<=6;a+=0.05){ const v=langevin(a); if(v<p) return false; p=v; } return true; })(), 'a∈[0,6]');
T('L 趋于 1（L(a)=1−1/a 在大 a 下就是精确值）', Math.abs(langevin(200)-1)<0.01, 'L(200)='+langevin(200).toFixed(5));
T('L 是奇函数', Math.abs(langevin(2.5)+langevin(-2.5))<1e-15, 'L(2.5)='+langevin(2.5).toFixed(6));
T('真实水的 a 极小 ⇒ 永远在线性区',
  aReal(30)<1e-4 && Math.abs(langevin(aReal(30))/aReal(30)-1/3)<1e-6,
  'a(30 kV/m)='+aReal(30).toExponential(2)+'　L/(a/3)='+(langevin(aReal(30))/(aReal(30)/3)).toFixed(9));
const dirs=molDirs();
T('分子点阵数量 = 3×3×2 = 18 且两两镜像（Σz 严格为 0）',
  dirs.length===18 && Math.abs(dirs.reduce((a,u)=>a+u.z,0))<1e-15,
  'n='+dirs.length+'  Σz='+dirs.reduce((a,u)=>a+u.z,0).toExponential(2));
[0,0.3,0.62,1,3].forEach(sv=>{
  const s=langevin(sv);
  const mean=dirs.reduce((acc,u)=>acc+polarDir(u,s).z,0)/dirs.length;
  T('分子显示朝向的 ⟨cosθ⟩ ≡ L(a)（a='+sv+'）', Math.abs(mean-s)<1e-12,
    's='+s.toFixed(6)+'  mean='+mean.toFixed(6));
});
T('polarDir 在 s=0 时原样返回（不改动杂乱取向）',
  dirs.every(u=>{ const v=polarDir(u,0); return Math.abs(v.x-u.x)<1e-15 && Math.abs(v.z-u.z)<1e-15; }), 'ok');
T('polarDir 在 s=1 时全部指向 +z', dirs.every(u=>Math.abs(polarDir(u,1).z-1)<1e-12), 'ok');

/* ══════ E. 极化模型的恒等式 ══════ */
let maxE=0, maxP=0;
[0,3,10,20,30].forEach(E0=>[MAT.polar,MAT.nonpolar].forEach(m=>{
  const st=matState(m,E0);
  maxE=Math.max(maxE, Math.abs(st.Ein+st.Edep-E0)/Math.max(E0,1e-9));
  maxP=Math.max(maxP, Math.abs(st.Pn-SIGK*st.chi*st.Ein));
}));
T('场分解恒等式 @{E}内 + @{E}退 = @{E}₀（任意 E₀、任意介质）', maxE<1e-12, 'max rel='+maxE.toExponential(2));
T('σ_p = P = ε₀χ_e·@{E}内（本页唯一的宏观公式）', maxP<1e-9, 'max abs='+maxP.toExponential(2));
T('退化：@{E}₀=0 ⇒ @{P}=0、σ_p=0（② 页签的全部结论）',
  matState(MAT.polar,0).Pn===0 && matState(MAT.nonpolar,0).Pn===0, 'P=0');
T('水（ε_r=80.4）比 PE（2.25）把 @{E}内 压得更狠',
  matState(MAT.polar,10).Ein < matState(MAT.nonpolar,10).Ein,
  '水 '+matState(MAT.polar,10).Ein.toFixed(3)+' kV/m　PE '+matState(MAT.nonpolar,10).Ein.toFixed(3)+' kV/m');
T('削弱倍数恰好 = ε_r（ε_r 的定义式）',
  [MAT.polar,MAT.nonpolar].every(m=>Math.abs(20/matState(m,20).Ein-m.epsr)<1e-9), '水 80.4×　PE 2.25×');
T('退极化场与 @{P} 同号、与外场反向（σ_p 上正下负）',
  [MAT.polar,MAT.nonpolar].every(m=>{ const st=matState(m,20); return st.Edep>0 && st.Pn>0; }), 'ok');
T('@{P} = σ_p 的量纲自洽（SIGK = ε₀·1e12 而不是 2.2 的 3ε₀·1e3·1e9）',
  Math.abs(SIGK-EPS0*1e12)<1e-9 && Math.abs(SIGK-8.8541878128)<1e-9, 'SIGK='+SIGK.toFixed(10));
/* ⚠️ 别把常量写成硬编码小数去比：Q_KV 的**末位**取决于 ε₀ 取哪一版 CODATA。
   EPS0=8.8541878128e-12（2018 版）⇒ Q_KV = 8.9875517923…；
   而老式记法 8.9875517873 来自 ε₀=8.854187817e-12（旧版）。差在第 9 位有效数字。
   ⇒ 断言只钉**物理关系**（反解回去必须等于 EPS0），不钉小数写法。
   （顺带发现：2.2 的源文件里那条注释写的是 7873，是旧值 —— 仅注释错，计算走的是公式。） */
T('Q_KV 与 EPS0 严格互逆（=1e-6/(4πε₀)/1e3，与 2.2 同源）',
  Math.abs(1e-6/(4*Math.PI*Q_KV*1e3)-EPS0)<1e-26, 'Q_KV='+Q_KV.toFixed(10)+'　反解 ε₀='+(1e-6/(4*Math.PI*Q_KV*1e3)).toExponential(6));

return R.join('\n')+'\nDONE';
})()
