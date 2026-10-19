/* ============================================================================
   4.2 磁介质的磁化 —— 物理模型与几何（引擎段与 2.1~2.4、3.1 同源）
   ----------------------------------------------------------------------------
   ★★ 本页的教学主线（三个页签，逐句对应用户给的定义）：
       ① 分子电流：磁介质由无数多的分子电流（小环流）组成，
          每个小环有磁矩 @{m} = i·S，方向按右手定则
       ② 无外场  ：分子电流杂乱无章排列 ⇒ 宏观磁化强度 M = 0，
          外表面没有宏观环流 ⇒ 不显磁性
       ③ 加外场  ：分子电流取向排列 ⇒ 内部相邻环流互相抵消、
          外表面合成一圈宏观环形电流（束缚电流 @{K}_b = M×n̂）⇒
          产生磁化磁场 @{B}′；空间总场 @{B} = @{B}₀ + @{B}′

   ★★ 定量链条（自检 chk42 对整条链做恒等式断言）：
       m = i·πr²            （分子磁矩，A·m²）
       M = n·m·s            （磁化强度，A/m；n = 10²⁸/m³，s = 取向度）
       K_b = M              （圆柱侧面束缚电流面密度，A/m；K_b = M×n̂，n̂=ρ̂ ⇒ φ̂ 向）
       B′ = µ₀·M            （磁化磁场；侧面电流即一个螺线管 ⇒ 内部沿 +z）
       B  = B₀ + B′         （总场；µ_r = B/B₀）
     画面读数全部由这条链算出，任意两个量都能互相验算。

   ★ 单位制：m 用 10⁻²⁴ A·m²（≈ 玻尔磁子量级）、M 用 kA/m、B 用 mT ——
     默认参数下 M ≈ 20 kA/m、B′ ≈ 25 mT，与 B₀ 同量级，叠加效果看得见。
   ⚠️ 这是"强磁性材料"的示意参数：真实顺磁质的取向度只有 ~10⁻⁵（朗之万函数），
     卡片里「真实取向度 L(a)」一行如实报告，画面取向度是示意放大（A_VIS）。
     铁磁质的磁畴机制不在本页展开。
   ============================================================================ */

/* ============================== 几何尺度 ============================== */
const A42  = 0.26;             /* 介质棒（圆柱）半径 m */
const L42  = 0.62;             /* 棒长 m（轴沿 z，中心在原点） */
const EXT_AX = 1.00;           /* 坐标轴长度（场线区到 ±1.1，轴略短不抢戏） */
const RCD  = 0.05;             /* ②③ 分子电流环的**画成**半径（示意；真实是原子尺度） */
const LOOP_Z = [-0.24,-0.12,0,0.12,0.24];   /* 5 层环（层距 0.12 > 2·RCD 的投影，不糊） */
const BIG_R = 0.17;            /* ① 放大的那个分子环半径（示意） */
/* ②③ 每层六方密排（环心距 = 2·RCD ⇒ 相邻环**相切**，接触点反向抵消才看得见） */
const LOOP_SP = 0.10;

/* ============================== 物理常数 ============================== */
const MU0 = 4*Math.PI*1e-7;    /* H/m */
const KB  = 1.380649e-23;      /* J/K */
const N_DENS = 1e28;           /* 分子数密度 /m³（典型固体原子密度量级，示意） */
const T_TEMP = 300;            /* K */
const A_VIS = 1.8e4;            /* 取向度示意放大系数：s_vis = min(1, A_VIS·a_phys)。
                                   ⚠️ 真实 a_phys = mB/kT 在默认参数下只有 ~3.8e-5（顺磁质）⇒
                                  不放大 ~2e4 倍根本看不见；放大后默认 s_vis ≈ 0.68、
                                  M ≈ 21 kA/m、B′ ≈ 27 mT，与 B₀ 同量级（"强磁性材料"示意）。
                                  卡片里「真实取向度 L(a)」一行按**未放大的真实值**如实报告。 */
const FIELD_N = 240;           /* 圆柱面电流的环堆叠数（实测 240 已收敛，见 field-check.js） */

/* ============================== 确定性伪随机 ============================== */
function mkRng(seed){
  let s=(seed>>>0)||1;
  return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
}

/* ============================== 状态 ============================== */
const state = {
  mode:'molecular',            /* molecular | nofield | poling */
  /* ①（③ 的 M 也由这两个量算出 ⇒ 跨页签联动，同 3.1 的 a/b） */
  iC:1.0,                      /* 分子电流 µA */
  rC:10,                       /* 分子环半径 Å */
  flip:false,                  /* ① 翻转电流方向（看 @{m} 反向） */
  /* ③ */
  B0:50,                       /* 外场终值 mT */
  t:1,                         /* ★ ③ 的"加场/取向进程" 0→1，可拖到任意时刻 */
  g:1,                         /* 当前外场建立度 = animG(t) */
  anim:null,                   /* 播放：null | {u:0→1, playing:bool} */
  /* ② 的随机取向种子（「重新随机」按钮 +1；默认值固定 ⇒ 截图可复现） */
  seed:20261022,
  /* ⚠️⚠️ 这些键**必须与 page1.js 的 SHOW_ITEMS 逐字对齐**（三页签并集的每个键）：
       loop/lat/fld = ① 的大环/陪衬小环/场线；mol/cur = ②③ 的分子点阵/表面束缚电流；
       bp/bt/b0 = ③ 的磁化场线/总场线/外场线；inset = 表层放大插图；box = 坐标轴。 */
  show:{ loop:true, lat:true, fld:true, mol:true, cur:true,
         bp:true, bt:true, b0:true, inset:true, box:true },
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
};
const IC_RANGE=[0.2,3.0], RC_RANGE=[5,15], B0_RANGE=[5,100];
const PRESET={
  molecular:{iC:1.0, rC:10, flip:false},
  nofield:  {},
  poling:   {B0:50, t:1, g:1},
};
/* ★ 防御：把 state 里所有"滑块量"夹回各自量程（防"按钮把量设到量程外"的静默不一致） */
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.iC=cl(state.iC,IC_RANGE[0],IC_RANGE[1]);
  state.rC=cl(state.rC,RC_RANGE[0],RC_RANGE[1]);
  state.B0=cl(state.B0,B0_RANGE[0],B0_RANGE[1]);
  state.t =cl(state.t ,0,1);
  return state;
}

/* ============================== 分子层面 ============================== */
function mMol(){ return state.iC*1e-6 * Math.PI*Math.pow(state.rC*1e-10,2); }   /* A·m² */
function mMax(){ return N_DENS*mMol(); }                                       /* A/m */
/* 朗之万函数 L(a) = coth(a) − 1/a（真实取向度 ⟨cosθ⟩）。
   ⚠️ a→0 必须走级数：coth(a)−1/a 是 ∞−∞，直接算会掉进 1e-16 的浮点噪声（2.3 的教训）。 */
function langevin(a){
  const A=Math.abs(a);
  if(A<1e-3) return a/3*(1-a*a/15);          /* L = a/3 − a³/45 + …（奇函数） */
  return 1/Math.tanh(a)-1/a;
}
function aParam(BmT){ return mMol()*(BmT*1e-3)/(KB*T_TEMP); }   /* a = mB/kT（B 用 T） */
function B0eff(){ return state.B0*state.g; }                     /* 当前外场 mT */
function sVis(){ return Math.min(1, A_VIS*Math.max(0,aParam(B0eff()))); }  /* 示意取向度 */
function sReal(){ return langevin(aParam(B0eff())); }            /* 真实取向度 */

/* ============================== 宏观层面 ============================== */
function Mval(){ return sVis()*mMax(); }        /* A/m */
function KbVal(){ return Mval(); }              /* A/m（= M，圆柱侧面） */
function BpMT(){ return MU0*Mval()*1e3; }       /* 磁化磁场 mT */
function BtMT(){ return B0eff()+BpMT(); }       /* 总场 mT */
function muR(){ return B0eff()>1e-6 ? BtMT()/B0eff() : NaN; }

/* ============================== 分子点阵（②③ 共用同一套几何） ==============================
   ★ ② 与 ③ 用的是**同一套圆心**，只有法矢不同 —— 这样从"无外场"切到"加外场"时
     点阵、盒子、相机一个像素都不动，变化只发生在"分子怎么转"上（2.3 的同款设计）。 */
function hexLayer(){
  const out=[], R=A42-RCD, s=LOOP_SP;
  out.push({x:0,y:0});
  for(let k=0;k<6;k++){ const a=Math.PI/3*k;         /* 第一环 6 个 */
    out.push({x:s*Math.cos(a), y:s*Math.sin(a)}); }
  for(let k=0;k<6;k++){ const a=Math.PI/3*k;         /* 第二环：√3·s 的 6 个 */
    const r=Math.sqrt(3)*s; out.push({x:r*Math.cos(a+Math.PI/6), y:r*Math.sin(a+Math.PI/6)}); }
  for(let k=0;k<6;k++){ const a=Math.PI/3*k;         /* 第二环：2s 的 6 个 */
    out.push({x:2*s*Math.cos(a), y:2*s*Math.sin(a)}); }
  return out.filter(p=>Math.hypot(p.x,p.y)<=R+1e-9);  /* 19 个（2s=0.20 ≤ R=0.21） */
}
const LATTICE=(()=>{ const pts=[]; LOOP_Z.forEach(z=>hexLayer().forEach(p=>pts.push({x:p.x,y:p.y,z}))); return pts; })();
/* 每个环的随机法矢（球面均匀分布；种子固定 ⇒ 截图可复现） */
function randNorms(seed){
  const rng=mkRng(seed);
  return LATTICE.map(()=>{
    const cz=rng()*2-1, ph=2*Math.PI*rng(), r=Math.sqrt(Math.max(0,1-cz*cz));
    return pt(r*Math.cos(ph), r*Math.sin(ph), cz);
  });
}
let _norms=null,_normsSeed=-1;
function loopNorms(){
  if(_normsSeed!==state.seed){ _norms=randNorms(state.seed); _normsSeed=state.seed; }
  return _norms;
}
/* n → ẑ 的球面插值（③ 的"取向排列"） */
function slerpZ(n,s){
  if(s<=0) return n;
  if(s>=1) return pt(0,0,1);
  const c=Math.max(-1,Math.min(1,n.z)), th=Math.acos(c), st=Math.sin(th);
  if(st<1e-9) return pt(0,0,1);
  const k1=Math.sin((1-s)*th)/st, k2=Math.sin(s*th)/st;
  return vnorm(pt(n.x*k1, n.y*k1, n.z*k1+k2));
}
function loopNormal(i,s){ return slerpZ(loopNorms()[i], s); }

/* ============================================================================
   磁场内核：有限长圆柱面电流（= 均匀磁化棒的束缚电流）的场
   ----------------------------------------------------------------------------
   ★★ 三个坑都在 tests/4.2-magnetization/field-check.js 里被数值实验钉死（25/25 通过）：
     ① 单环场用椭圆积分闭式（K/E 走 AGM；断点门限必须高于机器 stall 水平 1e-16，
        否则 E() 里 2^i 权重爆炸 —— 第一版 E(0.5) 算出 −4.6e27）。
     ② 奇极项 B_ρ ~ δ/2π(Δ²+δ²)：中点采样非对称时留 O(1) 残差（实测错 294%）⇒ 镜像采样。
     ③ 偶尖峰 B_z ~ −Δ/2π(Δ²+δ²)：洛伦兹型，镜像治不了 ⇒ **解析剥离**近场直线电流项
        （cell 积分闭式），余下光滑残差再用镜像中点。
     ④ 端线圈 (ρ=a, z=±L/2) 真场对数发散 ⇒ 建表网格必须绕开（见 buildTable）。
   精度：vs 直接 2D Biot-Savart 0.037%；自收敛 0.93%；跳变条件 B_z(out)−B_z(in) = −µ₀K
         （表单位 −1）验到 0.011；∇·B = 0 验到 0.47%；整表 build 47 ms。
   ============================================================================ */
function ellipK(m){
  if(m<0) throw new Error('m<0');
  if(m>=1) return Infinity;
  let a=1, b=Math.sqrt(1-m), c=Math.sqrt(m);
  for(let i=0;i<80;i++){
    const an=(a+b)/2, bn=Math.sqrt(a*b), cn=(a-b)/2;
    a=an; b=bn; c=cn;
    if(c<1e-16) break;                 /* 门限高于 stall 水平（见文件头 ①） */
  }
  return Math.PI/(2*a);
}
function ellipE(m){
  if(m<0) throw new Error('m<0');
  if(m>=1) return 1;
  let a=1, b=Math.sqrt(1-m), c=Math.sqrt(m);
  let sum=0, p=0.5;
  for(let i=0;i<80;i++){
    sum+=p*c*c;
    const an=(a+b)/2, bn=Math.sqrt(a*b), cn=(a-b)/2;
    a=an; b=bn; c=cn; p*=2;
    if(c<1e-16) break;
  }
  return ellipK(m)*(1-sum);
}
/* 圆电流环（半径 a、环面 xy 平面、单位电流）在柱坐标点 (ρ,0,z) 的场，除掉 µ₀I，单位 1/m */
function loopB(rho,z,a){
  if(rho<1e-12){
    const d2=a*a+z*z;
    return [0, a*a/(2*d2*Math.sqrt(d2))];
  }
  const D=Math.sqrt((a+rho)*(a+rho)+z*z);
  const m=4*a*rho/(D*D);
  const K=ellipK(m), E=ellipE(m);
  const den=(a-rho)*(a-rho)+z*z;
  const C1=(a*a+rho*rho+z*z)/den;
  const C2=(a*a-rho*rho-z*z)/den;
  return [(z/(rho*D))*(-K+C1*E)/(2*Math.PI), (K+C2*E)/(2*Math.PI*D)];
}
/* ① 用：环面 xy 平面、单位电流，任意 3D 点的场（除掉 µ₀I） */
function loopB3(p,a){
  const rho=Math.hypot(p.x,p.y);
  const [br,bz]=loopB(rho,p.z,a);
  if(rho<1e-12) return pt(0,0,bz);
  return pt(br*p.x/rho, br*p.y/rho, bz);
}
/* 圆柱面电流（K φ̂，半径 a、长 L）的场，除掉 µ₀K，单位 1/m —— 环堆叠 + 解析近场 + 镜像采样 */
function sheetBstack(rho,z,a,L,N){
  const dz=L/N, out=[0,0], Delta=rho-a;
  for(let i=0;i<N;i++){
    const u0=-L/2+i*dz-z, u1=u0+dz;
    /* ① 解析近场（直线电流项 B_sw=(δ,0,−Δ)/2π(Δ²+δ²)）的 cell 积分 */
    if(Math.abs(Delta)>1e-7){
      out[0]+= -(1/(4*Math.PI))*Math.log((Delta*Delta+u1*u1)/(Delta*Delta+u0*u0));
      out[1]+= -(1/(2*Math.PI))*(Math.atan(u1/Delta)-Math.atan(u0/Delta));
    }else{
      const a0=Math.max(Math.abs(u0),1e-12), a1=Math.max(Math.abs(u1),1e-12);
      out[0]+= -(1/(2*Math.PI))*Math.log(a1/a0);
    }
    /* ② 光滑残差：镜像采样 */
    const zc=-L/2+(i+0.5)*dz, zm=2*z-zc;
    const acc=(zz,w)=>{
      const uu=zz-z, d2=Delta*Delta+uu*uu;
      const [br,bz]=loopB(rho,z-zz,a);
      let sr=br, sz=bz;
      if(d2>1e-20){ sr+=uu/(2*Math.PI*d2); sz+=Delta/(2*Math.PI*d2); }
      out[0]+=sr*w; out[1]+=sz*w;
    };
    if(zm>=-L/2 && zm<=L/2){ acc(zc,dz*0.5); acc(zm,dz*0.5); }
    else acc(zc,dz);
  }
  return out;
}

/* ---------- 查表（几何固定 ⇒ 只建一次；懒加载，首进 ③ 时算） ---------- */
const TBL={nr:44, nz:60, rmax:1.10, zmax:1.10, rho:null, zz:null, br:null, bz:null, ok:false};
function buildTable(){
  const rho=[], zz=[];
  for(let i=0;i<TBL.nr;i++) rho.push(TBL.rmax*i/(TBL.nr-1));
  for(let j=0;j<TBL.nz;j++){
    let z=-TBL.zmax+2*TBL.zmax*j/(TBL.nz-1);
    /* ⚠️ z 网格绕开 ±L42/2：端线圈处真场对数发散（解析近场也救不了边线极点） */
    for(const e of [L42/2,-L42/2]) if(Math.abs(z-e)<0.014) z=e+(z<e?-0.014:0.014);
    zz.push(z);
  }
  const br=new Float64Array(TBL.nr*TBL.nz), bz=new Float64Array(TBL.nr*TBL.nz);
  for(let i=0;i<TBL.nr;i++) for(let j=0;j<TBL.nz;j++){
    const t=sheetBstack(rho[i],zz[j],A42,L42,FIELD_N);
    br[i*TBL.nz+j]=t[0]; bz[i*TBL.nz+j]=t[1];
  }
  TBL.rho=rho; TBL.zz=zz; TBL.br=br; TBL.bz=bz; TBL.ok=true;
}
/* 双线性插值；越界返回 null（调用方负责不收尾） */
function fieldAt(rho,z){
  if(!TBL.ok) buildTable();
  const R=Math.abs(rho);
  if(!isFinite(R)||!isFinite(z)||R>TBL.rmax||z<-TBL.zmax||z>TBL.zmax) return null;
  const dr=TBL.rmax/(TBL.nr-1);
  const i=Math.max(0,Math.min(TBL.nr-2,Math.floor(R/dr)));
  let j=0; while(j<TBL.nz-2 && z>TBL.zz[j+1]) j++;
  const s=(R-TBL.rho[i])/(TBL.rho[i+1]-TBL.rho[i]);
  const t=(z-TBL.zz[j])/(TBL.zz[j+1]-TBL.zz[j]);
  const q=(ii,jj,k)=>k[ii*TBL.nz+jj];
  const br=(1-s)*(1-t)*q(i,j,TBL.br)+s*(1-t)*q(i+1,j,TBL.br)+(1-s)*t*q(i,j+1,TBL.br)+s*t*q(i+1,j+1,TBL.br);
  const bz=(1-s)*(1-t)*q(i,j,TBL.bz)+s*(1-t)*q(i+1,j,TBL.bz)+(1-s)*t*q(i,j+1,TBL.bz)+s*t*q(i+1,j+1,TBL.bz);
  return [br,bz];
}

/* ---------- 子午面 (u,z) 场线追踪（RK4） ----------
   ★ 只画**正对镜头**的那个子午面（φ = cam.az + π/2 ⇒ u 轴 ≡ camU）：
     平面无向、场线落在同一平面里才读得出一族线（2.3/2.2 的同款教训）。
   ★ 总场线的形状只依赖 λ = µ₀M/B₀e 一个比值 ⇒ 按 λ 缓存；B′ 线与 M 无关 ⇒ 永久缓存。 */
function traceMerid(u0,z0,lam,sgn,opt){
  opt=opt||{};
  const maxSteps=opt.maxSteps||1500, h=opt.h||0.012;
  const B=(u,z)=>{
    const T=fieldAt(Math.abs(u),z);
    if(!T) return null;
    const bp=lam;                                   /* 磁化场强（表单位 × λ） */
    return [bp*T[0]*(u<0?-1:1), (opt.B0||0)+bp*T[1]];
  };
  const dir=(u,z)=>{ const b=B(u,z); if(!b) return null; const l=Math.hypot(b[0],b[1]); return l<1e-12?null:[b[0]/l*sgn,b[1]/l*sgn]; };
  let u=u0,z=z0,len=0;
  const pts=[[u,z]];
  for(let k=0;k<maxSteps;k++){
    const k1=dir(u,z); if(!k1) break;
    const k2=dir(u+k1[0]*h*0.5, z+k1[1]*h*0.5); if(!k2) break;
    const k3=dir(u+k2[0]*h*0.5, z+k2[1]*h*0.5); if(!k3) break;
    const k4=dir(u+k3[0]*h,     z+k3[1]*h);     if(!k4) break;
    u+=h*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6;
    z+=h*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6;
    len+=h; pts.push([u,z]);
    if(opt.closeTo){ const du=u-opt.closeTo[0], dz=z-opt.closeTo[1];
      if(len>(opt.minLen||0.8) && du*du+dz*dz<opt.closeR*opt.closeR){ pts.push(opt.closeTo); break; } }
    if(Math.abs(z)>1.10||Math.abs(u)>1.06) break;
  }
  return pts;
}
/* ① 的单环场线（loopB3 直接算，不查表） */
function traceLoop(u0,z0,a,iAmp){
  const maxSteps=1600, h=0.010;
  const B=(u,z)=>{ const p=pt(u,0,z); const b=loopB3(p,a); return [b.x*iAmp,b.z*iAmp]; };
  const dir=(u,z)=>{ const b=B(u,z); const l=Math.hypot(b[0],b[1]); return l<1e-14?null:[b[0]/l,b[1]/l]; };
  let u=u0,z=z0,len=0; const pts=[[u,z]];
  for(let k=0;k<maxSteps;k++){
    const k1=dir(u,z); if(!k1) break;
    const k2=dir(u+k1[0]*h*0.5,z+k1[1]*h*0.5); if(!k2) break;
    const k3=dir(u+k2[0]*h*0.5,z+k2[1]*h*0.5); if(!k3) break;
    const k4=dir(u+k3[0]*h,z+k3[1]*h); if(!k4) break;
    u+=h*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6; z+=h*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6;
    len+=h; pts.push([u,z]);
    const du=u-u0, dz=z-z0;
    if(len>0.10 && du*du+dz*dz<0.0004){ pts.push([u0,z0]); break; }
    if(Math.abs(z)>0.62||Math.abs(u)>0.62) break;
  }
  return pts;
}

/* ---------- ③ 的场线（带缓存） ---------- */
let _bpLines=null;
function bpLines(){
  if(_bpLines) return _bpLines;
  const lines=[];
  /* ⚠️ 种子必须取**贴壁**的 ρ₀（0.19~0.25）：实测只有贴壁的磁通管能在画面范围内闭合
     （r0=0.05/0.115 的管要从画面上方/右侧伸出表外，见表边界 ±1.10）。
     探过的 r0 → max|u|：0.19→0.98、0.21→0.78、0.225→0.71、0.245→0.60、0.25→0.57。 */
  [0.19,0.222,0.248].forEach(r0=>{
    lines.push({pts:traceMerid(r0,-0.26,1,1,{B0:0,closeTo:[r0,-0.26],closeR:0.04,minLen:1.2,maxSteps:1800}), axis:false});
  });
  lines.push({pts:[[0,-0.88],[0,0.88]], axis:true});   /* 轴：Ψ≡0 的退化线，直线段 */
  _bpLines=lines;
  return lines;
}
let _btCache={key:null,lines:null};
function totalLines(){
  const B0e=B0eff(), M=Mval();
  if(B0e<0.5||M<1) return null;                        /* 还没加场 ⇒ 没有总场线可画 */
  const lam=MU0*M*1e3/B0e, key=lam.toFixed(3);
  if(_btCache.key===key) return _btCache.lines;
  const lines=[];
  [-0.40,-0.24,-0.10,0.10,0.24,0.40].forEach(u0=>{
    const tr=traceMerid(u0,-1.02,lam,1,{B0:1,maxSteps:1500});
    /* ⚠️ 极端参数（M ≫ B₀e）下，靠外的种子处磁化场的回归磁通会朝下 ⇒ 这条线
       一出种子就往下扎、立刻出框（画成一截断线，像 bug）。物理上那里确实没有
       "从下面上来"的线 ⇒ 初始方向朝下的种子直接不画（靠近轴的种子不受影响）。 */
    if(tr.length<2) return;
    const dzAll=tr[1][1]-tr[0][1];
    if(dzAll<=0) return;
    lines.push({u0, pts:tr});
  });
  _btCache={key,lines};
  return lines;
}
/* 外场参考线（浅灰）：与总场线**同种子** ⇒ 直的就是"只有外场"、弯的就是"叠加了磁化场" */
const B0_SEEDS=[-0.40,-0.24,-0.10,0.10,0.24,0.40];
function b0Alpha(){ return Math.max(0,Math.min(1,B0eff()/12)); }

/* ============================== ③ 播放时间轴 ==============================
   t ∈ [0, 0.18]  阶段①  还没有外加场（g = 0）
   t ∈ [0.18, 1]  阶段②  外场建立 g 0→1：分子随之取向排列、表面电流与磁化场长出来
   ★ t 就是面板进度条的值，可停在任意时刻；g = animG(t) 是 t 的纯函数。 */
const ANIM_DUR = 4.6;
const PH_FIELD = [0.18, 1.00];
const animG = u => sstep((u-PH_FIELD[0])/(PH_FIELD[1]-PH_FIELD[0]));
function stepAnim(dt){
  const A=state.anim;
  if(!A || !A.playing) return false;
  A.u=Math.min(1, A.u+dt/ANIM_DUR);
  state.t=A.u; state.g=animG(A.u);
  if(A.u>=1){ state.t=1; state.g=1; state.anim=null; return 'end'; }
  return true;
}
function stopAnim(){ state.anim=null; }

/* ============================== 画图小工具 ============================== */
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supStr=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function fmtN(v,d){ d=(d==null)?2:d; if(!isFinite(v)) return '—';
  return (v<0?'−':'')+Math.abs(v).toFixed(d); }
/* 分子环的局部正交基 (u,v)，u×v = n */
function loopFrame(n){
  const a=Math.abs(n.z)<0.9 ? pt(0,0,1) : pt(1,0,0);
  const u=vnorm(vcross(a,n));
  return [u, vcross(n,u)];
}
function loopPts(c,n,r,N){
  const [u,v]=loopFrame(n), out=[];
  for(let i=0;i<=N;i++){ const t=2*Math.PI*i/N;
    out.push(vadd(c, vadd(vmul(u,r*Math.cos(t)), vmul(v,r*Math.sin(t))))); }
  return out;
}
