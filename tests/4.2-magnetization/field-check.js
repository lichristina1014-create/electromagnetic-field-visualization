/* ============================================================================
   field-check.js —— 4.2「磁介质的磁化」磁场内核的**离线验证**（Node 跑，不进页面）
   ----------------------------------------------------------------------------
   要验证的对象（phys.js 里同名同式的核心，两边靠 chk42 页内自检兜底防漂移）：
     ① 完全椭圆积分 K(m)、E(m)（AGM）
     ② 单个圆电流环的场 B(ρ,z)（椭圆积分闭式）
     ③ 有限长圆柱面电流 = 环堆叠（中点规则 + 近片局部加密）
     ④ 与「直接 2D Biot-Savart 数值积分」交叉验证（真相源）
     ⑤ 轴上中心值闭式、镜像对称、∇·B = 0、计时

   ★ 为什么值得单写一个脚本：磁化场 @{B}′ 的画面（场线怎么弯）完全由这个内核决定，
     而它有三种可能的实现（环堆叠 / 2D 数值 / 偶极近似），精度与耗时差异巨大。
     在把代码抄进 phys.js **之前**先用 Node 把「堆叠 vs 真相」钉死。
   ============================================================================ */
'use strict';

/* ---------- ① 完全椭圆积分（AGM；参数 m = k²） ---------- */
function ellipK(m){
  if(m<0) throw new Error('m<0');
  if(m>=1) return Infinity;
  let a=1, b=Math.sqrt(1-m), c=Math.sqrt(m);
  /* ⚠️ 断点门限必须 ≥ 机器 stall 水平：a、b 收敛到同一个 double 后 (a−b)/2 会
     停在 ~1e-17 不再下降 ⇒ 用 1e-18 这类门限会**永不触发**，200 轮空转。
     （第一版就是 c<1e-18 配 E() 里 p*=2 ⇒ 权重炸到 2^199，E 算出 −4.6e27。） */
  for(let i=0;i<80;i++){
    const an=(a+b)/2, bn=Math.sqrt(a*b), cn=(a-b)/2;
    a=an; b=bn; c=cn;
    if(c<1e-16) break;
  }
  return Math.PI/(2*a);
}
function ellipE(m){
  if(m<0) throw new Error('m<0');
  if(m>=1) return 1;
  let a=1, b=Math.sqrt(1-m), c=Math.sqrt(m);
  let sum=0, p=0.5;                    /* Σ 2^{n-1} c_n²，c₀ = √m */
  for(let i=0;i<80;i++){
    sum+=p*c*c;
    const an=(a+b)/2, bn=Math.sqrt(a*b), cn=(a-b)/2;
    a=an; b=bn; c=cn; p*=2;
    if(c<1e-16) break;                 /* 同上：门限要高于 stall 水平 */
  }
  return ellipK(m)*(1-sum);
}

/* ---------- ② 圆电流环的场（半径 a、电流 I、环面 = xy 平面、考察点 (ρ,0,z)）----------
   返回除以 µ₀I 的 (Bρ, Bz)（单位 1/m），乘上 µ₀I 即得 tesla。
   k² = 4aρ/((a+ρ)²+z²)；
   Bρ = (1/2π)·z/(ρ·D)·[−K + (a²+ρ²+z²)/((a−ρ)²+z²)·E]
   Bz = (1/2π)·(1/D)·[K + (a²−ρ²−z²)/((a−ρ)²+z²)·E]，D=√((a+ρ)²+z²)
   ⚠️ ρ→0 走轴上闭式（否则 0/0）；ρ=a 且 z=0 是导线奇点（调用方保证不落在上面）。 */
function loopB(rho,z,a){
  if(rho<1e-12){                                   /* 轴上：Bz = µ₀Ia²/2(a²+z²)^{3/2} */
    const d2=a*a+z*z;
    return [0, a*a/(2*d2*Math.sqrt(d2))];
  }
  const D=Math.sqrt((a+rho)*(a+rho)+z*z);
  const m=4*a*rho/(D*D);
  const K=ellipK(m), E=ellipE(m);
  const den=(a-rho)*(a-rho)+z*z;
  const C1=(a*a+rho*rho+z*z)/den;                  /* Bρ 里的系数 */
  const C2=(a*a-rho*rho-z*z)/den;                  /* Bz 里的系数 */
  const Bz=(K+C2*E)/(2*Math.PI*D);
  const Br=(z/(rho*D))*(-K+C1*E)/(2*Math.PI);
  return [Br,Bz];
}

/* ---------- 真相源 A：单环的直接 Biot-Savart（绕 φ′ 一圈，1D 积分） ---------- */
function loopBdirect(rho,z,a,N=20000){
  let bx=0,bz=0;
  for(let i=0;i<N;i++){
    const ph=2*Math.PI*(i+0.5)/N;
    const cp=Math.cos(ph),sp=Math.sin(ph);
    /* 源点 (a·cp, a·sp, 0)，电流元 dl = a·dφ·(−sp, cp, 0) */
    const rx=rho-a*cp, ry=-a*sp, rz=z;
    const R2=rx*rx+ry*ry+rz*rz, R=Math.sqrt(R2);
    if(R<1e-12) continue;
    /* dl × r̂ / R² = a·dφ·(−sp,cp,0) × (rx,ry,rz)/R³ */
    const cx=(cp*rz-0*ry), cy=(0*rx-(-sp)*rz), cz=(-sp*ry-cp*rx);
    bx+=a*(2*Math.PI/N)*cx/(R*R2);
    bz+=a*(2*Math.PI/N)*cz/(R*R2);
  }
  /* 考察点在 (ρ,0,z)：B_x = B_ρ（ azimuth 0 处柱坐标径向 = x 向） */
  return [bx,bz];                                  /* 单位：1/m（已除掉 µ₀I 的 1/4π… 见下） */
}
/* ⚠️ 上面的 direct 少乘了 1/(4π)·(2π)?? 不：Biot-Savart B = µ₀I/4π ∮ dl×r̂/R²。
   上式累计的是 Σ a·dφ·(dl̂×r̂)/R² = ∮ dl×r̂/R² ⇒ 还要乘 1/(4π)。*/

/* ---------- 真相源 B：圆柱面电流的直接 2D Biot-Savart ----------
   面电流 K φ̂ 在 (a cosφ′, a sinφ′, z′)，dS′ = a dφ′ dz′：
     B_x = (Ka/4π)∬ cosφ′(z−z′)/R³ dφ′dz′
     B_z = (Ka/4π)∬ (a−ρcosφ′)/R³ dφ′dz′，  R²=(ρ−a cosφ′)²+a²sin²φ′+(z−z′)²
   （φ̂′×(r−r′) = (cosφ′(z−z′), sinφ′(z−z′), a−ρ cosφ′)，y 分量积分后为 0）
   返回除以 µ₀K 的 (Bρ,Bz)，单位 1/m。 */
function sheetBdirect(rho,z,a,L,NPH=720,NZ=2400){
  let bx=0,bz=0;
  const dphi=2*Math.PI/NPH, dz=L/NZ;
  for(let j=0;j<NZ;j++){
    const zp=-L/2+(j+0.5)*dz, dzc=z-zp;
    for(let i=0;i<NPH;i++){
      const ph=2*Math.PI*(i+0.5)/NPH;
      const cp=Math.cos(ph);
      const R2=(rho-a*cp)*(rho-a*cp)+a*a*(1-cp*cp)+dzc*dzc;
      const R3=R2*Math.sqrt(R2);
      bx+=dphi*dz*cp*dzc/R3;
      bz+=dphi*dz*(a-rho*cp)/R3;
    }
  }
  const f=a/(4*Math.PI);
  return [bx*f,bz*f];
}

/* ---------- ③ 环堆叠（解析近场剥离 + 镜像采样）----------
   N 个环均布在 [−L/2,L/2]，每环电流 I = K·(L/N)。
   ★★ 电流片附近有两个各自的"陷阱"，必须分开治（本轮实测：不治的话 B_ρ 错 294%、
      B_z 错 100%+，而且都**不报错**、画面只是"场线在片子附近歪一下"）：
     ① 奇极项 B_ρ ~ δ/2π(Δ²+δ²)（δ=z−z′，Δ=ρ−a）：
        奇数 ⇒ 主值积分为 0，但**非对称中点采样**留下 O(1) 残差（正负号都能反）。
        ⇒ **镜像采样**：每个采样点连同它关于 z 的镜像各按半权累加，奇项严格抵消。
     ② 偶尖峰 B_z ~ −Δ/2π(Δ²+δ²)：洛伦兹型，镜像治不了（它是偶的），
        中点规则对可积尖峰收敛慢（N=240 vs 960 差 32%）。
        ⇒ **解析剥离**：直线电流近场 B_sw=(δ,0,−Δ)/2π(Δ²+δ²) 的 cell 积分有闭式
           ∫B_sw,ρ = −(1/4π)ln(Δ²+u²)，∫B_sw,z = −(1/2π)arctan(u/Δ)（u=z′−z），
           逐 cell 解析累加；被积函数只剩光滑残差 loopB−B_sw，镜像中点二阶收敛。
   ⚠️ 仍要绕开 (ρ=a, z=±L/2)（端线圈，真场对数发散）——由建表网格负责。 */
function sheetBstack(rho,z,a,L,N){
  const dz=L/N, out=[0,0];
  const Delta=rho-a;
  for(let i=0;i<N;i++){
    const u0=-L/2+i*dz-z, u1=u0+dz;                 /* cell 相对考察点的 u 区间 */
    /* ① 解析近场（直线电流项）的 cell 积分 */
    if(Math.abs(Delta)>1e-7){
      out[0]+= -(1/(4*Math.PI))*Math.log((Delta*Delta+u1*u1)/(Delta*Delta+u0*u0));
      out[1]+= -(1/(2*Math.PI))*(Math.atan(u1/Delta)-Math.atan(u0/Delta));
    }else{                                            /* Δ=0：B_sw,z≡0，B_sw,ρ=−1/2πu */
      const a0=Math.max(Math.abs(u0),1e-12), a1=Math.max(Math.abs(u1),1e-12);
      out[0]+= -(1/(2*Math.PI))*Math.log(a1/a0);
    }
    /* ② 光滑残差：镜像采样（奇极项已由解析项接管，这里仍保镜像以消残余奇性） */
    const zc=-L/2+(i+0.5)*dz, zm=2*z-zc;
    const acc=(zz,w)=>{
      const uu=zz-z, d2=Delta*Delta+uu*uu;
      const [br,bz]=loopB(rho,z-zz,a);
      let sr=br, sz=bz;
      if(d2>1e-20){ sr-= -uu/(2*Math.PI*d2); sz-= -Delta/(2*Math.PI*d2); }
      out[0]+=sr*w; out[1]+=sz*w;
    };
    if(zm>=-L/2 && zm<=L/2){ acc(zc,dz*0.5); acc(zm,dz*0.5); }
    else acc(zc,dz);
  }
  return out;                                      /* 单位 1/m（除掉 µ₀K） */
}

/* ============================== 验证 ============================== */
let nPass=0,nFail=0;
function T(name,cond,detail){
  if(cond){ nPass++; console.log('PASS|'+name+'|'+detail); }
  else { nFail++; console.log('FAIL|'+name+'|'+detail); }
}
const close=(x,y,tol)=>Math.abs(x-y)<=tol*Math.max(1,Math.abs(y));

console.log('=== ① 椭圆积分 vs 已知值 ===');
T('K(0.5)',  close(ellipK(0.5),1.8540746773013719,1e-12), ellipK(0.5));
T('E(0.5)',  close(ellipE(0.5),1.3506438810476755,1e-12), ellipE(0.5));
T('K(0.25)', close(ellipK(0.25),1.6857503548125961,1e-12), ellipK(0.25));
T('E(0.25)', close(ellipE(0.25),1.4674622093394272,1e-12), ellipE(0.25));
T('K(0.9)',  close(ellipK(0.9),2.578092113348173,1e-10), ellipK(0.9));
T('K(0.99)', close(ellipK(0.99),3.6956373629898487,1e-8),  ellipK(0.99));
T('K(0)=π/2',close(ellipK(0),Math.PI/2,1e-15), ellipK(0));
T('E(0)=π/2',close(ellipE(0),Math.PI/2,1e-15), ellipE(0));
/* m→1 极限：K→∞、E→1 */
T('E(0.999999)→1', close(ellipE(0.999999),1,1e-5), ellipE(0.999999));
T('K(0.999999)大', ellipK(0.999999)>7, ellipK(0.999999));

console.log('=== ①b E(m) 与数值积分定义对照（∫₀^{π/2}√(1−m sin²θ)dθ，辛普森）===');
{
  const Eint=m=>{const n=200000,h=Math.PI/2/n;let s=0;for(let i=0;i<=n;i++){const t=i*h;const f=Math.sqrt(1-m*Math.sin(t)*Math.sin(t));s+=f*((i===0||i===n)?1:(i%2?4:2));}return s*h/3;};
  for(const m of [0.5,0.9,0.99,0.9999]){
    T('E('+m+') vs 积分定义', close(ellipE(m),Eint(m),1e-7), ellipE(m)+' vs '+Eint(m));
  }
}

console.log('=== ② 单环闭式 vs 直接 Biot-Savart ===');
{
  const a=0.14;
  const cases=[[0.05,0.10],[0.10,0.05],[0.20,0.30],[0.05,-0.25],[0.28,0.02],[0.13,0.13],[0.40,-0.5],[0.02,0.6]];
  let worst=0;
  for(const [rho,z] of cases){
    const [br1,bz1]=loopB(rho,z,a);
    const [br2,bz2]=loopBdirect(rho,z,a);
    /* direct 少乘 1/(4π) */
    const br3=br2/(4*Math.PI), bz3=bz2/(4*Math.PI);
    const e=Math.max(Math.abs(br1-br3),Math.abs(bz1-bz3))/Math.max(1e-9,Math.hypot(br3,bz3));
    worst=Math.max(worst,e);
  }
  T('单环场最大相对误差<1e-3', worst<1e-3, 'worst='+worst.toExponential(2));
  /* 轴上闭式自检 */
  const [b0,bz0]=loopB(0,0.3,a);
  const exact=a*a/(2*Math.pow(a*a+0.09,1.5));
  T('轴上 Bz 闭式', close(bz0,exact,1e-12) && Math.abs(b0)<1e-15, bz0+' vs '+exact);
}

console.log('=== ③ 圆柱面电流：堆叠(镜像采样) vs 2D 直接积分 + 自收敛 ===');
{
  const a=0.26, L=0.62;
  /* 网格点：含近片点（ρ=a、z 落在两环之间 / 正对环）、内部、远端。
     ⚠️ 不探 (a, ±L/2)（端线圈，真场对数发散，只能靠网格绕开）。 */
  const N=240;
  const probe=[
    [0.00,0.00],[0.05,0.10],[0.13,-0.20],[0.20,0.31],[0.26,0.0129],[0.26,0.05],
    [0.255,0.31],[0.30,0.45],[0.50,0.60],[0.80,-0.9],[1.00,0.0],[0.26,-0.28],[0.10,0.60],
    [0.26,0.0129+0.0013],[0.261,0.05],[0.259,0.05],[0.26,0.30],[0.26,-0.05],
  ];
  let worstDir=0, worstSelf=0, worstAxis=0, worstJump=0, worstCont=0;
  const rows=[];
  for(const [rho,z] of probe){
    if(rho<1e-9){ /* 轴堆叠与 direct 比 */
      const truth=sheetBdirect(rho,z,a,L);
      const st=sheetBstack(rho,z,a,L,N);
      const e=Math.abs(st[1]-truth[1])/Math.max(1e-9,Math.abs(truth[1]));
      worstAxis=Math.max(worstAxis,e); continue;
    }
    const s1=sheetBstack(rho,z,a,L,N);
    const s4=sheetBstack(rho,z,a,L,960);       /* 4 倍环数自收敛 */
    const es=Math.max(Math.abs(s1[0]-s4[0]),Math.abs(s1[1]-s4[1]))/Math.max(1e-9,Math.hypot(s4[0],s4[1]));
    worstSelf=Math.max(worstSelf,es);
    let eDir=NaN;
    /* ⚠️ 直接 2D 积分只在 |ρ−a|≥0.02 时可信（它自己也被电流片的洛伦兹尖峰坑）。 */
    if(Math.abs(rho-a)>=0.02){
      const truth=sheetBdirect(rho,z,a,L);
      eDir=Math.max(Math.abs(s1[0]-truth[0]),Math.abs(s1[1]-truth[1]))/Math.max(1e-9,Math.hypot(truth[0],truth[1]));
      worstDir=Math.max(worstDir,eDir);
    }
    rows.push('ρ='+rho.toFixed(3)+' z='+z.toFixed(4)+
      '  st=('+s1[0].toFixed(4)+','+s1[1].toFixed(4)+')'+
      (isFinite(eDir)?' eDir='+(eDir*100).toFixed(2)+'%':' eDir=—(近片，direct 自身不准)')+
      '  eSelf='+(es*100).toFixed(2)+'%');
  }
  console.log(rows.join('\n'));
  T('堆叠(解析近场+镜像) vs 直接积分（|Δ|≥0.02）最大误差<1%', worstDir<0.01, 'worst='+(worstDir*100).toFixed(3)+'%');
  T('自收敛 N=240 vs 960（含近片点）最大偏差<1%', worstSelf<0.01, 'worst='+(worstSelf*100).toFixed(3)+'%');
  T('轴上堆叠 最大相对误差<0.5%', worstAxis<0.005, 'worst='+(worstAxis*100).toFixed(3)+'%');
  /* ⑥′ 电流片跳变条件（不依赖任何数值真相，直接验物理）：
        K = K φ̂ 的片面电流 ⇒ 法向 ρ̂ 两侧 B_z 跳变 −µ₀K（表中 −1），B_ρ 连续。 */
  for(const z of [-0.2,-0.05,0.05,0.2]){
    const pin =sheetBstack(a-0.004,z,a,L,N), pout=sheetBstack(a+0.004,z,a,L,N);
    const jump=pout[1]-pin[1];                       /* 期望 −1 */
    worstJump=Math.max(worstJump,Math.abs(jump+1));
    worstCont=Math.max(worstCont,Math.abs(pout[0]-pin[0]));
  }
  T('电流片跳变 B_z(out)−B_z(in) = −1（<3%）', worstJump<0.03, 'worst='+worstJump.toFixed(4));
  T('电流片 B_ρ 连续（<0.01）', worstCont<0.01, 'worst='+worstCont.toFixed(5));
  /* ④ 轴上中心闭式：T(0,0) = L/(2√(L²/4+a²)) */
  const Tc=L/(2*Math.sqrt(L*L/4+a*a));
  const st0=sheetBstack(0,0,a,L,N);
  T('轴上中心闭式', close(st0[1],Tc,2e-3), st0[1].toFixed(6)+' vs '+Tc.toFixed(6));
  /* ⑤ 镜像对称：Bz 偶、Bρ 奇 */
  let sym=0;
  for(const [rho,z] of [[0.13,0.21],[0.26,0.05],[0.4,0.3],[0.7,-0.5]]){
    const p=sheetBstack(rho,z,a,L,N), q=sheetBstack(rho,-z,a,L,N);
    sym=Math.max(sym,Math.abs(p[1]-q[1])/Math.max(1e-9,Math.abs(p[1])),Math.abs(p[0]+q[0])/Math.max(1e-9,Math.abs(p[0])));
  }
  T('z→−z 镜像对称', sym<1e-9, 'worst='+sym.toExponential(2));
}

console.log('=== ⑥ ∇·B=0（柱坐标：(1/ρ)∂(ρBρ)/∂ρ + ∂Bz/∂z）===');
{
  const a=0.26,L=0.62,N=240,h=0.004;
  let worst=0;
  const pts=[[0.08,0.12],[0.16,-0.05],[0.24,0.20],[0.32,0.42],[0.5,-0.6],[0.1,0.3],[0.26,0.0]];
  for(const [rho,z] of pts){
    const p1=sheetBstack(rho+h,z,a,L,N), p2=sheetBstack(rho-h,z,a,L,N);
    const q1=sheetBstack(rho,z+h,a,L,N), q2=sheetBstack(rho,z-h,a,L,N);
    const div=((rho+h)*p1[0]-(rho-h)*p2[0])/(2*h*rho)+(q1[1]-q2[1])/(2*h);
    const mag=Math.hypot(p1[0],p1[1]);
    worst=Math.max(worst,Math.abs(div)/Math.max(1e-9,mag));
  }
  T('|∇·B|/|B| < 2%', worst<0.02, 'worst='+(worst*100).toFixed(3)+'%');
}

console.log('=== ⑦ 计时：整表 build（4.2 画布实际网格规模）===');
{
  const a=0.26,L=0.62,N=240;
  const NR=44,NZt=60;                              /* ρ∈[0,1.10] 44 点、z∈[−1.10,1.10] 60 点 */
  const t0=Date.now();
  let acc=0;
  for(let i=0;i<NR;i++){
    const rho=1.10*i/(NR-1);
    for(let j=0;j<NZt;j++){
      const z=-1.10+2.20*j/(NZt-1);
      const [br,bz]=sheetBstack(rho,z,a,L,N);
      acc+=br+bz;
    }
  }
  const ms=Date.now()-t0;
  T('整表 build < 1500 ms', ms<1500, ms+' ms（'+NR+'×'+NZt+'='+(NR*NZt)+' 点，校验和 '+acc.toFixed(3)+'）');
}

console.log('\n===== '+nPass+' PASS / '+nFail+' FAIL =====');
process.exit(nFail?1:0);
