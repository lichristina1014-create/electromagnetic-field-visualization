/* ============================================================================
   2.4 高斯定理及其应用 —— 物理模型与几何图元（页面主体引擎与 2.1 / 2.2 / 2.3 同源）

   ★ 单位约定（本页特有，全页统一，与 2.1~2.3 同源）：
       长度 m　电荷 µC　场强 kV/m　通量 Φ = Q/ε₀ 用 kV·m
       E[kV/m]  = Q_KV · q[µC] / r[m]²,  Q_KV = 1e-6/(4πε₀)/1e3 = 8.9875517873…
       Φ[kV·m]  = PHI_KV · q[µC],        PHI_KV = 1e-6/ε₀/1e3  = 112.9410183…

   ★★ 本页的教学主线（三个页签，逐句对应）：
       ① 球内有电荷、改变电荷多少 ⇒ 穿过球面的矢量线根数跟着变
          （Φ = Q内/ε₀，而且"穿出−穿入"恰好 = Q内/q₀）
       ② 球外也有电荷、改变球外电荷 ⇒ 根数**不变**（穿出与穿入同步增大、互相抵消）
       ③ 无论球内球外，任意一点的电场都由**空间中所有电荷**共同决定
          （球面上 |E| 明明被球外电荷改得高低不平，Φ 却纹丝不动 —— 这就是高斯定理最反直觉的地方）

   ★★★ 数值可信度是本页的地基：读数条上"净穿出根数 × q₀ = Φ"必须**处处严格相等**，
        否则整个演示自相矛盾。为此做了两件事（都是实测调出来的，别随手改）：
       ① 追踪盒 BOX=3.0 / MAXSTEP=2500：球外电荷的场线要先绕远再折回，
          盒子太小会把"该折回来"的线提前切断 ⇒ 根数偏少（实测 BOX=1.52 时 5/14 例出错）。
       ② **格点旋转自校正**：把每条场线看成"一根通量管"（每根代表固定的 q₀ = 0.125 µC），
          但 Fibonacci 格点的离散方向只能**近似**均匀分球面 ⇒ 净根数会差 ±1 根。
          解法：预生成 64 组三轴随机旋转后的格点，按顺序试，取第一组"数出来的净根数 === Q内/q₀"
          的那一组；若一组都没有则取最接近的。实测 20/20 例精确命中，平均试 4 轮、最慢 6 ms。
          ⚠️ 只绕单轴旋转是不够的（20 例里有 2 例永远命不中）——必须是三轴合成旋转。
   ============================================================================ */

/* ============================== 物理常数 ============================== */
const EPS0   = 8.8541878128e-12;
const Q_KV   = 1e-6/(4*Math.PI*EPS0)/1e3;   /* 8.9875517873：q[µC]、r[m] ⇒ E[kV/m] */
const PHI_KV = 1e-6/EPS0/1e3;               /* 112.9410183：q[µC] ⇒ Φ=Q/ε₀ 的 kV·m 数值 */
/* ★★ 通量量子 q₀ 的选取是"教学可见性"逼出来的（0.25 试过，不合格）：
    球面上一点看球外电荷，那个电荷的场线要**穿进球面**才算数 —— 球面对 q₃ 张的立体角
      Ω/4π = (1−cos α)/2，  sin α = R/d。
    q₀=0.25 时 q₃=+2 只发 8 条线，8 × 0.10 ≈ 0.8 条 ⇒ 实测「穿入恒为 0」，
    「球外的线穿进去又穿出来」这句话在画面上**根本看不见**（自检 ② 就是这么抓出来的）。
    ⇒ 把 q₀ 减半到 0.125（每条线代表的电荷量少一半、线数翻倍），并把电荷挪近球面，
      才让"穿进又穿出"真的有 2~4 条线可看。⚠️ q₀ 必须能整除滑块步长 0.25，
      否则"净根数 × q₀ = Q内"就不再严格相等（0.125 整除 0.25，安全）。 */
const Q0     = 0.125;                       /* ★ 每条场线代表的电荷量 µC（通量量子） */
const V_LINE = Q0*PHI_KV;                   /* 每条场线代表的通量 kV·m = 14.1176273 */

/* ============================== 电荷库 ============================== */
/* ★ 位置**固定**，只有电荷量可调 —— 这样"球内 / 球外"这个定性事实在整段半径范围内都成立：
     q₁、q₂ 的最大模长 0.146 < R 下限 0.24；q₃、q₄ 的最小模长 0.477 > R 上限 0.38。
   ★★ 球外电荷**贴着**球面放（0.477 对 R 上限 0.38，只差 0.10）：球面对它张的立体角
      ≈ (1−cos 52.9°)/2 = 0.198 ⇒ q₃=+2 的 16 条线里有 3 条左右会穿进球面。
      放远一点"更清爽"但教学上就废了 —— 见上面 q₀ 那一段的实测。 */
const CHARGES = [
  {id:'q₁', sub:'1', pos:pt( 0.000, 0.000, 0.000), out:false},   /* 球心 */
  {id:'q₂', sub:'2', pos:pt( 0.112, 0.078,-0.052), out:false},
  {id:'q₃', sub:'3', pos:pt( 0.418, 0.216, 0.096), out:true },
  {id:'q₄', sub:'4', pos:pt(-0.372,-0.272, 0.121), out:true },
];
const NCH = CHARGES.length;
const CH_IN  = C.crimson;      /* 球内电荷：橙红 */
const CH_OUT = C.purple;       /* 球外电荷：紫   */
const CH_LINE_IN  = '#B8663C';   /* 由球内电荷发出的场线 */
const CH_LINE_OUT = '#8E76B8';   /* 由球外电荷发出的场线 */

const GS_R_RANGE = [0.24, 0.38], GS_R0 = 0.36;
/* ★ 电荷量程是"精度 × 速度"实测出来的（见 /tmp/p24/bench*.js）：
     q₁∈[0,2]、q₂∈[±1]、q₃/q₄∈[±2] ⇒ 场线最多 (2+2+2)/0.125 = 48 条。
     q₀ 减半之后线数翻倍，所以量程必须跟着收窄，否则 fieldLines() 的搜索耗时会起来。 */
const Q_IN_RANGE  = [0.00, 2.00], Q_IN0 = 2.00;    /* q₁ 范围（球心） */
const Q_IN2_RANGE = [-1.00, 1.00];                 /* q₂ 范围（球内偏置） */
const Q_OUT_RANGE = [-2.00, 2.00];                 /* q₃ / q₄ 范围（球外） */
const Q3_0 = 2.00, Q4_0 = -1.00;                   /* ②③ 的球外电荷默认值 */

/* ============================== 状态 ============================== */
const state = {
  mode:'inside',                 /* inside | outside | allfield */
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
  q:[Q_IN0, 0, 0, 0],            /* 4 个点电荷的电荷量 µC */
  R:GS_R0,                       /* 高斯面半径 m */
  /* ★ 默认 P 落在靠近球顶处（θ=24°）：那里离 q₃、q₄（都在 θ≈76° 的赤道附近）最远
     ⇒ |E_内| 明显大于 |E_外|，三支箭头**长度差异分明、方向也不共线**，
     "红 = 青 + 紫"的平行四边形关系一眼能读出来。
     ⚠️ 别把默认值取成 P 正对 q₃（θ=78.5°, φ=27°）：那时 E_外 与 E_内 近反向，
        红、紫两根长箭头几乎平行且反向 ⇒ 画面上像"一根穿过 P 的长线"，平行四边形读不出来。
        （那个"总场竟比球外分量还小"的反相抵消是很好的对照，已做成面板按钮。） */
  Pth:24, Pph:27,                /* 观察点 P 的球坐标（度）：极角 θ_P、方位角 φ_P */
  show:{ lines:true, cross:true, ball:true, chg:true, box:true, flux:false, dec:true },
};
/* ★ 固定地把电荷分成"球内 / 球外"两组（位置是常量，与 R 无关）：
   |q₁|=0、|q₂|=0.146 < 0.24 = min R；|q₃|=0.480、|q₄|=0.476 > 0.38 = max R。
   所以整段半径范围里"谁在内、谁在外"都不会变，③ 的 E = ΣEᵢ 分解才立得住。
   ⚠️ 球外电荷故意"贴着"球面放（只比 R 上限远 0.10）—— 放远画面更清爽，但球面对它们
      张的立体角会小到"一条线都穿不进球面"，② 的核心现象就看不见了。 */
const IDX_IN  = [0,1];
const IDX_OUT = [2,3];
function qInside(){ let s=0; for(let i=0;i<NCH;i++) if(!CHARGES[i].out && vlen(CHARGES[i].pos)<state.R) s+=state.q[i]; return s; }
function qOutside(){ let s=0; for(let i=0;i<NCH;i++) if(CHARGES[i].out || vlen(CHARGES[i].pos)>=state.R) s+=state.q[i]; return s; }
function isIn(i){ return vlen(CHARGES[i].pos) < state.R; }
/* 数值意义上的"零"：q₀ 的百分之一 */
function nearZero(v){ return Math.abs(v) < 1e-9; }
function sgnTxt(v,d){ return (v>0?'+':(v<0?'−':''))+Math.abs(v).toFixed(d==null?2:d); }

/* ============================== 场 ============================== */
/* 所有电荷在 P 点的叠加场，kV/m。用裸数字数组避免热循环里分配对象。 */
function fieldN(x,y,z,out){
  let ex=0,ey=0,ez=0;
  for(let i=0;i<NCH;i++){
    const q=state.q[i]; if(q===0) continue;
    const c=CHARGES[i].pos;
    const dx=x-c.x, dy=y-c.y, dz=z-c.z;
    const r2=dx*dx+dy*dy+dz*dz;
    if(r2<1e-9) continue;                       /* 落在电荷本体上：贡献记 0，避免除零 */
    const f=Q_KV*q/(r2*Math.sqrt(r2));
    ex+=f*dx; ey+=f*dy; ez+=f*dz;
  }
  out[0]=ex; out[1]=ey; out[2]=ez;
}
function Efield(P){ const o=[0,0,0]; fieldN(P.x,P.y,P.z,o); return pt(o[0],o[1],o[2]); }
function Emag(P){ const o=[0,0,0]; fieldN(P.x,P.y,P.z,o); return Math.hypot(o[0],o[1],o[2]); }
/* 只算"某一组电荷"贡献的场 —— ③ 页用来拆 E = Σ E_i */
function EfieldOf(idxs,P){
  let ex=0,ey=0,ez=0;
  for(const i of idxs){
    const q=state.q[i]; if(q===0) continue;
    const c=CHARGES[i].pos;
    const dx=P.x-c.x, dy=P.y-c.y, dz=P.z-c.z;
    const r2=dx*dx+dy*dy+dz*dz; if(r2<1e-9) continue;
    const f=Q_KV*q/(r2*Math.sqrt(r2));
    ex+=f*dx; ey+=f*dy; ez+=f*dz;
  }
  return pt(ex,ey,ez);
}
function Ppoint(){
  const th=state.Pth*D2R, ph=state.Pph*D2R;
  return pt(state.R*Math.sin(th)*Math.cos(ph), state.R*Math.sin(th)*Math.sin(ph), state.R*Math.cos(th));
}

/* ============================== 场线追踪 ============================== */
const LINE_STOP = 0.045;      /* 出发 / 终止判据：离电荷这么近就算"落在它身上" */
const LINE_HMIN = 0.0035, LINE_HMAX = 0.055;
const LINE_STEPMAX = 2500;    /* ⚠️ 别调小：球外电荷的线要先绕远再折回 */
const LINE_BOX = 3.00;        /* ⚠️ 别调小：1.52 时 5/14 例净根数算少（实测） */
const DISP_R = 0.70;          /* 只画到这个半径：更远的地方让线"淡出画面"。
                                 ⚠️ 这个值跟着本页的尺度走（电荷在 0.477、球面 ≤0.38），
                                    不是 2.1/2.3 那个 1.45 —— 别照抄。 */

const NLAT = 64;              /* 方向序列的长度上限（每条电荷最多发这么多条线，用完即止） */
/* ★★ 方向序列必须"**前缀嵌套**"：第 n 条线的方向只由 n 决定，与"一共发几条"无关。
   旧的 Fibonacci 均匀分球写法 z = 1−(2i+1)/N 做不到这件事 —— 总数一变，**整套方向全换掉**：
     ① "把 q₃ 往上拖"看到的不是"多出来一条线"，而是线段整体乱跳；
     ② 更致命的是"球外电荷有几条线穿进球面"会随 n 随机跳 0/3 ——
        实测 q₃ 从 0.25 拖到 1.75 画面上**一个变化都没有**，到 2.00 突然冒出 3 条线。
   ⇒ 改用低差异序列（加性黄金比递推）：任意长度的前缀都均匀铺满球面，而且**嵌套**。
   ⚠️ 两个无理数取不同的，是为了让 z 与方位角不相关（用同一个会出现螺旋条纹）。 */
const PHI2 = 0.6180339887498949, PSI2 = 0.7548776662466927;
function dirK(k){
  const z=1-2*((k*PHI2)%1), a=2*Math.PI*((k*PSI2)%1), r=Math.sqrt(Math.max(0,1-z*z));
  return pt(r*Math.cos(a), r*Math.sin(a), z);
}
const BASE_LAT = (()=>{ const o=[]; for(let k=0;k<NLAT;k++) o.push(dirK(k)); return o; })();
function mkRng(seed){ let s=(seed>>>0)||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function rotMatrix(ux,uy,uz,ang){
  const c=Math.cos(ang), s=Math.sin(ang), t=1-c;
  return [ t*ux*ux+c,     t*ux*uy-s*uz, t*ux*uz+s*uy,
           t*ux*uy+s*uz,  t*uy*uy+c,    t*uy*uz-s*ux,
           t*ux*uz-s*uy,  t*uy*uz+s*ux, t*uz*uz+c ];
}
/* ★ 必须用三轴合成旋转：只绕单轴扫不出足够的相对姿态（实测 20 例里 2 例永远命不中） */
const ROT_N = 64;
const LATTICES = (()=>{
  const rng=mkRng(20240924), arr=[];
  for(let k=0;k<ROT_N;k++){
    const u=2*rng()-1, ph=2*Math.PI*rng(), st=Math.sqrt(Math.max(0,1-u*u));
    const M=rotMatrix(st*Math.cos(ph), st*Math.sin(ph), u, 2*Math.PI*rng());
    /* ⚠️ BASE_LAT 的元素是 pt 对象（.x/.y/.z）**不是数组** —— 写成 v[0] 会得到 undefined ⇒
       整个 LATTICES 变成 NaN 方向 ⇒ 追踪起点 NaN ⇒ 一条线都画不出来（却完全不报错）。 */
    arr.push(BASE_LAT.map(v=>pt(M[0]*v.x+M[1]*v.y+M[2]*v.z,
                               M[3]*v.x+M[4]*v.y+M[5]*v.z,
                               M[6]*v.x+M[7]*v.y+M[8]*v.z)));
  }
  return arr;
})();
/* ★ 取"前缀"而不是"重抽样"：L 的前 n 项本身就是一组均匀方向（低差异序列的性质），
   而且 n 变大时**前面的方向不变** ⇒ 画面上是"一条一条多出来"，不是整族乱跳。 */
function latticePick(L,n){ return L.slice(0, Math.min(n, L.length)); }
/* ★★ 球外电荷的 **第 0 条线固定指向球心**（只替换这一个方向，其余照旧均匀）。
   只做前缀嵌套还不够：低差异序列里"哪几条方向恰好指向球面"是定死的运气 ——
   实测 q₃ 从 0 拖到 1.25 时穿入恒为 0，到 1.50 才突然变 1、2.00 变 3，中间半程毫无反应。
   钉住第一条之后，球外电荷只要不是 0 就**必定**有一条线穿进球面 ⇒ 读数从第一格起就响应。 */
const AIM_U = CHARGES.map(c => c.out ? vnorm(vmul(c.pos,-1)) : null);

const _fo=[0,0,0],_k1=[0,0,0],_k2=[0,0,0],_k3=[0,0,0],_k4=[0,0,0];
function unitDir(px,py,pz,sgn,out){
  fieldN(px,py,pz,_fo);
  const L=Math.hypot(_fo[0],_fo[1],_fo[2]);
  if(L<1e-12){ out[0]=out[1]=out[2]=0; return; }
  const g=sgn/L; out[0]=_fo[0]*g; out[1]=_fo[1]*g; out[2]=_fo[2]*g;
}
function traceLine(start,sgn){
  const pts=[start];
  let x=start.x, y=start.y, z=start.z;
  for(let s=0;s<LINE_STEPMAX;s++){
    let dmin=1e9;
    for(let i=0;i<NCH;i++){ const q=state.q[i]; if(!q) continue;
      const c=CHARGES[i].pos, d=Math.hypot(x-c.x,y-c.y,z-c.z); if(d<dmin) dmin=d; }
    if(!isFinite(dmin)||dmin<=0) break;
    /* ★ 自适应步长：离电荷越近步长越小（否则 1/r² 的奇点会让 RK4 失稳） */
    const h=Math.max(LINE_HMIN, Math.min(LINE_HMAX, 0.13*dmin));
    unitDir(x,y,z,sgn,_k1);
    unitDir(x+_k1[0]*h/2, y+_k1[1]*h/2, z+_k1[2]*h/2, sgn,_k2);
    unitDir(x+_k2[0]*h/2, y+_k2[1]*h/2, z+_k2[2]*h/2, sgn,_k3);
    unitDir(x+_k3[0]*h,   y+_k3[1]*h,   z+_k3[2]*h,   sgn,_k4);
    x+=(_k1[0]+2*_k2[0]+2*_k3[0]+_k4[0])*h/6;
    y+=(_k1[1]+2*_k2[1]+2*_k3[1]+_k4[1])*h/6;
    z+=(_k1[2]+2*_k2[2]+2*_k3[2]+_k4[2])*h/6;
    pts.push(pt(x,y,z));
    if(Math.hypot(x,y,z)>LINE_BOX) break;
    let hit=false;
    for(let i=0;i<NCH;i++){ const q=state.q[i]; if(!q) continue;
      const c=CHARGES[i].pos;
      if(Math.hypot(x-c.x,y-c.y,z-c.z)<LINE_STOP){ hit=true; break; } }
    if(hit) break;
  }
  return pts;
}
/* 发射哪一族：正电荷总量 ≥ 负电荷总量 ⇒ 每条场线都能从正电荷出发；
   反之（负的多）⇒ 改从负电荷**逆着 E**追，同样能覆盖到全部场线，且不会重复计数。 */
function emitSign(){
  let a=0,b=0;
  for(let i=0;i<NCH;i++){ const q=state.q[i]; if(q>0) a+=q; else if(q<0) b-=q; }
  return a>=b ? 1 : -1;
}
function traceAll(lat){
  const sgn=emitSign(), list=[];
  for(let i=0;i<NCH;i++){
    const q=state.q[i];
    if(sgn*q<=0) continue;                       /* 只从"与发射符号一致"的电荷出发 */
    const n=Math.min(Math.round(Math.abs(q)/Q0), lat.length);
    if(!n) continue;
    const aim=AIM_U[i], dirs=latticePick(lat,n);
    for(let k=0;k<n;k++){
      /* k=0 且是球外电荷 ⇒ 用"指向球心"那个方向（见 AIM_U 的说明） */
      const u=(k===0 && aim) ? aim : dirs[k];
      const st=pt(CHARGES[i].pos.x+u.x*LINE_STOP, CHARGES[i].pos.y+u.y*LINE_STOP, CHARGES[i].pos.z+u.z*LINE_STOP);
      list.push({src:i, sgn, pts:traceLine(st,sgn)});
    }
  }
  return list;
}
/* 带符号穿越计数：+1 = 沿 E 穿出球面，−1 = 沿 E 穿入。
   ★ sgn 是"这条折线的走向相对 E 的关系"：sgn=+1 沿 E 追、sgn=−1 逆 E 追。 */
function countCross(lines,R){
  let out=0, inn=0; const marks=[], R2=R*R;
  for(const L of lines){
    const P=L.pts, sg=L.sgn;
    for(let i=1;i<P.length;i++){
      const a=P[i-1], b=P[i];
      const fa=vdot(a,a)-R2, fb=vdot(b,b)-R2;
      if(fa===0||fb===0) continue;
      if((fa>0)===(fb>0)) continue;              /* 同侧：没穿越 */
      const outward = (fb>0) ? (sg>0) : (sg<0);
      if(outward) out++; else inn++;
      const t=fa/(fa-fb);
      marks.push({p:pt(a.x+(b.x-a.x)*t, a.y+(b.y-a.y)*t, a.z+(b.z-a.z)*t), outward, src:L.src});
    }
  }
  return {out, inn, net:out-inn, marks};
}
/* ★ 带自校正的场线缓存。缓存键必须**含 R**：旋转择优是"针对当前 R 让净根数命中"的，
   R 一变最优旋转可能就变了。代价是改 R 会重跑一次搜索（实测 ≈1~15 ms，滑块手感仍然顺）。
   ★★ 搜索顺序**从"上次命中的那个旋转"开始**（而不是永远从 0 号开始），有两个好处：
      ① 速度：小步调整时第一次就命中，省掉整轮扫描；
      ② **画面稳定**：旋转一换，整套方向就整体转一下 —— 而保持同一个旋转时，
         低差异序列的"前缀嵌套"才真正生效（已画出的线原地不动，新线一条条加进来）。 */
let _FL=null, _FLkey='', _lastRot=0;
function fieldLines(){
  const key=state.q.join(',')+'|'+state.R.toFixed(3);
  if(_FL && _FLkey===key) return _FL;
  const want=Math.round(qInside()/Q0);
  let best=null, bestList=null, bestRot=_lastRot, bestD=Infinity;
  for(let t=0;t<ROT_N;t++){
    const k=(_lastRot+t)%ROT_N;
    const list=traceAll(LATTICES[k]);
    const c=countCross(list,state.R);
    const d=Math.abs(c.net-want);
    if(d<bestD){ bestD=d; best=c; bestList=list; bestRot=k; }
    if(d===0) break;                              /* 精确命中就不必再试 */
  }
  _lastRot=bestRot;
  _FL={list:bestList, cross:best, rot:bestRot, exact:(bestD===0), want:want};
  _FLkey=key;
  return _FL;
}
function crossNow(){ return fieldLines().cross; }

/* ============================== 半透明球壳（同 2.1 / 1.3 的成熟配方） ==============================
   ★ 球面在正交投影下**恒是屏幕上的一个圆**（半径 R·camScale，与 az/el 完全无关）⇒
     不需要逐四边形铺色。★ 分前后两片取球面真实的前后极值（S.d ∓ R）⇒
     壳里的电荷与场线**自动落在两层之间**、被"罩在玻璃球里"；要始终看得清的标注用 o.z 抬到壳之上。
   ⚠️ 别改成"逐半透明小面片"：正交投影下前后两半球各盖满圆盘一次 ⇒ 复合透明度处处相等，
     屏幕上只剩一块均匀的色斑，正是用户投诉过的"看不出是球"。 */
function shellBall(c,R,hexBase,emph){
  if(R<=1e-6) return;
  const S=pr(c), rr=R*camScale;
  const aBody=emph?0.075:0.040, aRim=emph?0.42:0.26;
  /* ① 背面：极淡体色，越靠剪影越厚 */
  P_(S.d-R*1.02, ()=>{ ctx.save();
    const g=ctx.createRadialGradient(S.x,S.y,rr*0.05,S.x,S.y,rr);
    g.addColorStop(0,hexA(hexBase,aBody*0.50));
    g.addColorStop(1,hexA(hexBase,aBody*1.40));
    ctx.beginPath(); ctx.arc(S.x,S.y,rr,0,7); ctx.fillStyle=g; ctx.fill(); ctx.restore(); });
  /* ② 正面 */
  P_(S.d+R*1.02, ()=>{ ctx.save();
    const g=ctx.createRadialGradient(S.x-rr*0.32,S.y-rr*0.36,rr*0.06,S.x,S.y,rr*1.02);
    g.addColorStop(0,   'rgba(255,255,255,'+(emph?0.20:0.13)+')');
    g.addColorStop(0.44,hexA(hexBase,aBody*0.30));
    g.addColorStop(0.82,hexA(hexBase,aRim*0.30));
    g.addColorStop(1,   hexA(hexBase,aRim*0.82));
    ctx.beginPath(); ctx.arc(S.x,S.y,rr,0,7); ctx.fillStyle=g; ctx.fill();
    /* 斜向明暗：左上传光、右下背光 —— "圆"变"球"的关键一层 */
    const dl=ctx.createLinearGradient(S.x+SPH_LX*rr*0.95, S.y+SPH_LY*rr*0.95,
                                      S.x-SPH_LX*rr*0.95, S.y-SPH_LY*rr*0.95);
    dl.addColorStop(0,   'rgba(255,255,255,'+(emph?0.26:0.17)+')');
    dl.addColorStop(0.46,hexA(hexBase,aBody*0.14));
    dl.addColorStop(1,   hexA(hexBase,aBody*(emph?1.60:1.30)));
    ctx.beginPath(); ctx.arc(S.x,S.y,rr,0,7); ctx.fillStyle=dl; ctx.fill();
    /* 双瓣镜面高光 */
    const hx=S.x+SPH_LX*rr*0.40, hy=S.y+SPH_LY*rr*0.44, hr=rr*0.30;
    const gh=ctx.createRadialGradient(hx,hy,0,hx,hy,hr);
    gh.addColorStop(0,'rgba(255,255,255,'+(emph?0.50:0.32)+')');
    gh.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(hx,hy,hr,0,7); ctx.fillStyle=gh; ctx.fill();
    const hx2=S.x+SPH_LX*rr*0.52, hy2=S.y+SPH_LY*rr*0.56, hr2=rr*0.085;
    const gh2=ctx.createRadialGradient(hx2,hy2,0,hx2,hy2,hr2);
    gh2.addColorStop(0,'rgba(255,255,255,'+(emph?0.85:0.55)+')');
    gh2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(hx2,hy2,hr2,0,7); ctx.fillStyle=gh2; ctx.fill();
    /* 两段式轮廓：受光侧细而淡、背光侧粗而实 */
    const aL=Math.atan2(SPH_LY,SPH_LX);
    ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(S.x,S.y,rr,aL-Math.PI/2,aL+Math.PI/2);
    ctx.strokeStyle=hexA(hexBase,aRim*(emph?0.40:0.30)); ctx.lineWidth=emph?1.4:1.1; ctx.stroke();
    ctx.beginPath(); ctx.arc(S.x,S.y,rr,aL+Math.PI/2,aL+Math.PI*1.5);
    ctx.strokeStyle=hexA(hexBase,aRim*(emph?0.92:0.68)); ctx.lineWidth=emph?2.5:1.8; ctx.stroke();
    ctx.restore(); });
}


/* ============================== 画图小工具 ============================== */
function shade(hex,amt){       /* amt>0 提亮、<0 压暗 */
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  const f=t=>Math.max(0,Math.min(255, Math.round(amt>=0 ? t+(255-t)*amt : t*(1+amt))));
  return 'rgb('+f(r)+','+f(g)+','+f(b)+')';
}
const SPH_LX=-0.55, SPH_LY=-0.83;   /* 屏幕空间光方向（与 2.1 同一套） */

/* 实心小球（点电荷本体）：偏心径向渐变 + 镜面高光 + 白色描边（与场线分离） */
function chgBall(c,rad,hex,positive,alpha){
  const S=pr(c);
  P_(S.d+0.07, ()=>{ ctx.save();
    if(alpha!=null) ctx.globalAlpha=alpha;
    ctx.beginPath(); ctx.arc(S.x,S.y,rad+1.7,0,7);
    ctx.fillStyle='rgba(255,255,255,.93)'; ctx.fill();
    const g=ctx.createRadialGradient(S.x-rad*0.36, S.y-rad*0.42, rad*0.05, S.x, S.y, rad*1.06);
    g.addColorStop(0,   shade(hex,0.52));
    g.addColorStop(0.55,hex);
    g.addColorStop(1,   shade(hex,-0.38));
    ctx.beginPath(); ctx.arc(S.x,S.y,rad,0,7); ctx.fillStyle=g; ctx.fill();
    const hx=S.x-rad*0.40, hy=S.y-rad*0.44, hr=rad*0.34;
    const gh=ctx.createRadialGradient(hx,hy,0,hx,hy,hr);
    gh.addColorStop(0,'rgba(255,255,255,.78)'); gh.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(hx,hy,hr,0,7); ctx.fillStyle=gh; ctx.fill();
    if(rad>=8){                                  /* 太小就不画符号，免得糊成一团 */
      const lw=Math.max(1.5, rad*0.17), arm=rad*0.46;
      ctx.strokeStyle='#fff'; ctx.lineWidth=lw; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(S.x-arm,S.y); ctx.lineTo(S.x+arm,S.y); ctx.stroke();
      if(positive){ ctx.beginPath(); ctx.moveTo(S.x,S.y-arm); ctx.lineTo(S.x,S.y+arm); ctx.stroke(); }
    }
    ctx.restore(); });
}
function chgRadius(q){ return Math.max(6.2, 7 + 3.1*Math.sqrt(Math.abs(q))); }

/* 场线：屏幕空间等距的箭头 + 折线本体；sgn<0 时箭头反向（= 真实 E 方向） */
function flowLine(pts,sgn,o){
  if(pts.length<2) return;
  const S=pts.map(pr);
  let tot=0; const acc=[0];
  for(let i=1;i<S.length;i++){ tot+=Math.hypot(S[i].x-S[i-1].x, S[i].y-S[i-1].y); acc.push(tot); }
  if(tot<3) return;
  P_(o.z, ()=>{ ctx.save();
    ctx.globalAlpha=o.alpha!=null?o.alpha:0.72;
    ctx.strokeStyle=o.color; ctx.lineWidth=o.w||1.35;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(S[0].x,S[0].y);
    for(let i=1;i<S.length;i++) ctx.lineTo(S[i].x,S[i].y);
    ctx.stroke();
    const gap=o.gap||62;
    let next=gap*0.55;
    ctx.fillStyle=o.color;
    for(let i=1;i<S.length;i++){
      while(next<=acc[i]){
        const t=(next-acc[i-1])/Math.max(1e-6, acc[i]-acc[i-1]);
        const x=S[i-1].x+(S[i].x-S[i-1].x)*t, y=S[i-1].y+(S[i].y-S[i-1].y)*t;
        let dx=S[i].x-S[i-1].x, dy=S[i].y-S[i-1].y;
        if(sgn<0){ dx=-dx; dy=-dy; }
        const L=Math.hypot(dx,dy)||1; dx/=L; dy/=L;
        const hs=o.hs||5.2;
        ctx.beginPath();
        ctx.moveTo(x+dx*hs, y+dy*hs);
        ctx.lineTo(x-dx*hs*0.40-dy*hs*0.62, y-dy*hs*0.40+dx*hs*0.62);
        ctx.lineTo(x-dx*hs*0.40+dy*hs*0.62, y-dy*hs*0.40-dx*hs*0.62);
        ctx.closePath(); ctx.fill();
        next+=gap;
      }
    }
    ctx.restore(); });
}
/* 把一条折线切成"落在 DISP_R 内"的若干段（跑出画面再绕回来的线不会连成一条假直线） */
function flowRuns(pts){
  const runs=[]; let cur=null;
  for(const p of pts){
    if(Math.hypot(p.x,p.y,p.z)<=DISP_R){
      if(!cur){ cur={pts:[], zs:0}; }
      cur.pts.push(p); cur.zs+=vdot(p,camD);
    } else if(cur){ if(cur.pts.length>1) runs.push({pts:cur.pts, z:cur.zs/cur.pts.length}); cur=null; }
  }
  if(cur && cur.pts.length>1) runs.push({pts:cur.pts, z:cur.zs/cur.pts.length});
  return runs;
}

/* ============================== 通量 Φ ==============================
   Φ = Q内/ε₀。q 用 µC ⇒ Φ[V·m] = q·1e-6/ε₀（与页面其它量同源换算）。 */
const PHI_V = q => q*1e-6/EPS0;
const SUP = {'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supStr = n => String(n).split('').map(c=>SUP[c]||c).join('');
function fmtSci(v,d){ d=(d==null)?3:d; if(!isFinite(v)) return '—'; if(v===0) return '0';
  const s=v<0?'−':''; const e=Math.floor(Math.log10(Math.abs(v)));
  const m=Math.abs(v)/Math.pow(10,e); return s+m.toFixed(d)+'×10'+supStr(e); }

/* ══════════ 球面上的 @{E}·@{n} 采样（"通量云"） ══════════
   ★ 画 64 根（BASE_LAT）给人看；**求和的采样点数另取**，给人信。
     实测（收敛表）：R=0.38、q₃=+2 时球面上 |@{E}| 的 max/min 达 6.7 倍（近奇点），
     收敛很慢 —— N=1500 差 0.77%、N=4000 差 0.13%、N=8000 差 0.07%。
     ⇒ 取 8000（≈0.15 ms，可忽略）并把结果标成"≈"，别拿 64 个点的和去当读数。 */
const FLUX_N_SUM = 8000;
const FLUX_LMAX  = 0.22;          /* 每根采样箭头的最大世界长度（≈ 40 px） */
let _fluxC={key:'', v:0};
function fluxSumExact(){
  const key=state.q.join(',')+'|'+state.R.toFixed(3);
  if(_fluxC.key===key) return _fluxC.v;
  const N=FLUX_N_SUM, R=state.R, dS=4*Math.PI*R*R/N, o=[0,0,0];
  let s=0;
  for(let i=0;i<N;i++){
    const u=dirK(i);                       /* 低差异序列：任意 N 都均匀 */
    fieldN(R*u.x,R*u.y,R*u.z,o);
    s += (o[0]*u.x+o[1]*u.y+o[2]*u.z)*dS;
  }
  _fluxC={key, v:s*1e3};
  /* ⚠️ fieldN 给的是 **kV/m** ⇒ Σ(@{E}·@{n})ΔS 的自然单位是 **kV·m**，
     而页面统一用 V·m 报 Φ（PHI_V）⇒ 这里必须 ×1e3 才能对得上。
     （漏掉这一步就是整整 1000 倍的差：自检里表现成"离散通量误差 99.900%"。） */
  return _fluxC.v;
}
/* 64 个采样点上的 @{E}·@{n}（供作图；顺带回传最大模长用作定标） */
function fluxSamples(){
  const R=state.R, o=[0,0,0], out=[];
  let mx=0.5;
  for(const u of BASE_LAT){
    fieldN(R*u.x,R*u.y,R*u.z,o);
    const v=o[0]*u.x+o[1]*u.y+o[2]*u.z;
    out.push({u, v});
    if(Math.abs(v)>mx) mx=Math.abs(v);
  }
  return {list:out, mx};
}
