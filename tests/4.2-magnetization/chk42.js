/* 4.2 磁介质的磁化 —— 页面内自检
   跑法：bash tests/run_suite.sh 4.2-magnetization.htm \
         "typeof state!=='undefined' && typeof CARDS!=='undefined'" \
         tests/4.2-magnetization/chk42.js tests/4.2-magnetization/vis42.js
   ⚠️ 断言条数只取实跑的 ^PASS| 行数（grep 'T(' 会命中 helper ⇒ 偏多）。
   ⚠️ 画在 canvas 上的串 innerText 抓不到 ⇒ ⑩ 用插桩扫 text/textScreen/txt。
   ⚠️ ④⑤ 移植自 tests/4.2-magnetization/field-check.js 的物理判据（跳变条件 /
      轴上闭式 / 镜像对称 / ∇·B=0），它们**不依赖数值真相**，只依赖物理定律。 */
(()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };
function clickTab(k){ const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k===k); if(b) b.click(); return !!b; }
const MODES=['molecular','nofield','poling'];
function restore(){
  clickTab('molecular');
  Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
  state.showReadout=true; stopAnim(); updateReadout(); needsRender=true;
}

/* ============ ① 定量链条恒等式（m → a → s → M → K_b → B′ → B → µ_r） ============ */
{
  const fails=[]; let n=0;
  const combos=[];
  for(const iC of [0.2,1.0,3.0]) for(const rC of [5,10,15]) for(const B0 of [5,50,100]){
    combos.push([iC,rC,B0,0]); combos.push([iC,rC,B0,0.5]); combos.push([iC,rC,B0,1]);
  }
  /* 确定性取 30 组（不要全跑：表构建 + 场线会拖慢） */
  for(let i=0;i<30;i++){
    const [iC,rC,B0,t]=combos[(i*7+3)%combos.length];
    n++;
    state.mode='poling'; state.iC=iC; state.rC=rC; state.B0=B0; state.t=t; state.g=animG(t); state.anim=null;
    const B0e=B0*state.g;
    const mExp=iC*1e-6*Math.PI*Math.pow(rC*1e-10,2);
    if(!near(mMol(),mExp)) fails.push('m iC='+iC+' rC='+rC+' → '+mMol()+' ≠ '+mExp);
    const aExp=mExp*(B0e*1e-3)/(KB*T_TEMP);
    if(!near(aParam(B0e),aExp)) fails.push('a iC='+iC+' B0e='+B0e+' → '+aParam(B0e)+' ≠ '+aExp);
    const sExp=Math.min(1,A_VIS*Math.max(0,aExp));
    if(!near(sVis(),sExp)) fails.push('s → '+sVis()+' ≠ '+sExp);
    const MExp=sExp*N_DENS*mExp;
    if(!near(Mval(),MExp)) fails.push('M → '+Mval()+' ≠ '+MExp);
    if(!near(KbVal(),Mval())) fails.push('K_b ≠ M');
    if(!near(BpMT(),MU0*MExp*1e3)) fails.push('B′ → '+BpMT()+' ≠ '+(MU0*MExp*1e3));
    if(!near(BtMT(),B0e+BpMT())) fails.push('B → '+BtMT()+' ≠ '+(B0e+BpMT()));
    if(B0e>1e-6 && !near(muR(),BtMT()/B0e)) fails.push('µ_r → '+muR()+' ≠ '+(BtMT()/B0e));
    if(!near(mMax(),N_DENS*mExp)) fails.push('M_max → '+mMax());
  }
  group('① m→a→s→M→K_b→B′→B→µ_r 全链条恒等式（30 组参数）', n, fails);
  /* DATA 行报的是**预设默认值**（不是循环留下的最后一组） */
  state.mode='poling'; Object.assign(state, JSON.parse(JSON.stringify(PRESET.poling))); clampState();
  R.push('DATA|① 默认参数|s_视='+(sVis()*100).toFixed(1)+'%  M='+(Mval()/1e3).toFixed(1)+' kA/m  B′='+BpMT().toFixed(1)+' mT  µ_r='+muR().toFixed(2));
}

/* ============ ② 进程时间轴：animG 纯度 + stepAnim 状态机 ============ */
{
  const fails=[]; let n=0;
  n++; if(animG(0)!==0) fails.push('animG(0)='+animG(0)+' ≠ 0');
  n++; if(animG(0.18)!==0) fails.push('animG(0.18)='+animG(0.18)+' ≠ 0（18% 前不该有外场）');
  n++; if(!near(animG(1),1)) fails.push('animG(1)='+animG(1));
  n++; if(!(animG(0.5)>0 && animG(0.5)<1)) fails.push('animG(0.5)='+animG(0.5)+' 不在 (0,1)');
  n++; if(!(animG(0.3)<animG(0.6)&&animG(0.6)<animG(0.9))) fails.push('animG 不单调');
  /* g 必须只依赖 t（切页签再切回来不能变） */
  const gA=animG(0.62); state.mode='nofield'; state.mode='poling';
  n++; if(animG(0.62)!==gA) fails.push('animG 不是 t 的纯函数');
  /* stepAnim */
  state.mode='poling';
  state.anim={u:0.2,playing:true};
  n++; const r1=stepAnim(1.0);
  if(r1!==true) fails.push('stepAnim(1.0) 应返回 true，得 '+r1);
  if(!near(state.t,0.2+1.0/ANIM_DUR,1e-6)) fails.push('t 推进错：'+state.t);
  if(!near(state.g,animG(state.t))) fails.push('g 与 animG(t) 不一致');
  state.anim={u:0.99,playing:true};
  n++; const r2=stepAnim(1.0);
  if(r2!=='end') fails.push('末尾应返回 end，得 '+r2);
  if(state.t!==1||state.g!==1||state.anim!==null) fails.push('结束后状态没复位：t='+state.t+' anim='+state.anim);
  state.anim={u:0.5,playing:false};
  state.t=0.5; state.g=animG(0.5);
  n++; const r3=stepAnim(1.0);
  if(r3!==false) fails.push('暂停时 stepAnim 应返回 false，得 '+r3);
  if(state.t!==0.5) fails.push('暂停时 t 被改动：'+state.t);
  stopAnim(); n++;
  if(state.anim!==null) fails.push('stopAnim 没清掉 anim');
  group('② 进程时间轴（animG 纯度 + stepAnim 播放/暂停/结束）', n, fails);
}

/* ============ ③ 朗之万函数（真实取向度，卡片里如实报告的那个） ============ */
{
  const fails=[]; let n=0;
  n++; if(langevin(0)!==0) fails.push('L(0)='+langevin(0));
  n++; if(!near(langevin(1e-4),1e-4/3*(1-1e-8/15),1e-6)) fails.push('L(1e-4) 级数段错：'+langevin(1e-4));
  n++; if(!near(langevin(1e-3),1e-3/3,1e-3)) fails.push('L(1e-3)='+langevin(1e-3)+' ≠ a/3='+(1e-3/3)+'（∞−∞ 没避开？）');
  n++; if(!near(langevin(1),1/Math.tanh(1)-1,1e-12)) fails.push('L(1) 错');
  n++; if(!near(langevin(3),1/Math.tanh(3)-1/3,1e-12)) fails.push('L(3) 错');
  n++; if(!near(langevin(10),1/Math.tanh(10)-0.1,1e-12)) fails.push('L(10) 错');
  n++; if(!(langevin(0.1)<langevin(0.5)&&langevin(0.5)<langevin(1)&&langevin(1)<langevin(2)&&langevin(2)<langevin(5)))
    fails.push('L 不单调');
  n++; if(!(langevin(5)<1)) fails.push('L 越界 >1');
  n++; if(!near(langevin(-0.7),-langevin(0.7),1e-12)) fails.push('L 不是奇函数');
  group('③ 朗之万 L(a)=coth(a)−1/a（0 / 级数段 / 大 a / 单调 / 奇函数）', n, fails);
}

/* ============ ④ 磁场内核：单环椭圆积分 vs 独立 Biot-Savart 直接积分 ============ */
{
  const fails=[]; let n=0;
  n++; if(!near(ellipK(0),Math.PI/2,1e-12)) fails.push('K(0)='+ellipK(0));
  n++; if(!near(ellipK(0.5),1.8540746773,1e-9)) fails.push('K(0.5)='+ellipK(0.5));
  n++; if(!near(ellipE(0),Math.PI/2,1e-12)) fails.push('E(0)='+ellipE(0));
  n++; if(!near(ellipE(0.5),1.3506438810,1e-9)) fails.push('E(0.5)='+ellipE(0.5));
  n++; if(ellipE(1)!==1) fails.push('E(1)='+ellipE(1));
  n++; if(ellipK(1)!==Infinity) fails.push('K(1) 应为 ∞');
  /* 独立的 2D Biot-Savart 数值积分（不走椭圆积分）。
     ⚠️ 采样点在 +x 轴上 ⇒ B_ρ ≡ B_x（**带符号**，不是 |B|）：早先写成 hypot
        把符号吞了，误报 loopB 符号错（其实幅值 15 位一致）。 */
  function loopBdirect(rho,z,a,N){
    let bx=0,bz=0; const h=2*Math.PI/N;
    for(let i=0;i<N;i++){
      const ph=(i+0.5)*h, cx=a*Math.cos(ph), cy=a*Math.sin(ph);
      const dlx=-a*Math.sin(ph)*h, dly=a*Math.cos(ph)*h;
      const rx=rho-cx, ry=-cy, rz=z, d=Math.pow(rx*rx+ry*ry+rz*rz,1.5);
      bx+=(dly*rz)/d; bz+=(dlx*ry-dly*rx)/d;
    }
    return [bx/(4*Math.PI), bz/(4*Math.PI)];
  }
  for(const [rho,z] of [[0.15,0.20],[0.30,-0.10],[0.05,0.40],[0.22,0.02]]){
    n++;
    const [br,bz]=loopB(rho,z,BIG_R);
    const [dr,dz]=loopBdirect(rho,z,BIG_R,20000);
    if(!near(br,dr,2e-5)) fails.push('B_ρ(ρ='+rho+',z='+z+') '+br+' ≠ 直接积分 '+dr);
    if(!near(bz,dz,2e-5)) fails.push('B_z(ρ='+rho+',z='+z+') '+bz+' ≠ 直接积分 '+dz);
  }
  /* 轴上闭式：ρ→0 时与 loopB 轴上分支一致 */
  n++;
  const [bAx,bAz]=loopB(1e-13,0.25,BIG_R);
  const axExp=BIG_R*BIG_R/(2*Math.pow(BIG_R*BIG_R+0.25*0.25,1.5));
  if(!near(bAz,axExp,1e-9)) fails.push('轴上 B_z '+bAz+' ≠ 闭式 '+axExp);
  group('④ 单环场：椭圆积分 vs 独立 Biot-Savart 直接积分（4 点 × 2 分量）', n, fails);
}

/* ============ ⑤ 圆柱面电流：跳变条件 / Bρ 连续 / 轴上闭式 / 镜像 / 散度 / 端极绕避 ============ */
{
  const fails=[]; let n=0;
  if(!TBL.ok) buildTable();
  /* ⑤-a 电流片跳变条件：B_z(out) − B_z(in) = −1（表单位，µ₀K 已除掉）。
     ⚠️ 必须用 sheetBstack **直接算**：查表的 ρ 网格跨在 ρ=a 两侧（dr≈0.0256），
        双线性插值会把跳变抹平（实测抹成 −0.62）—— 那是网格的极限，不是内核的错。
     ⚠️ 采样 z 取 |z|≤0.2：实测剖面 z=0 → −0.988、±0.2 → −0.968、±0.25 → −0.939、
        ±0.30（棒端）→ −0.721，端部退化是 240 环堆叠的已知极限（见 field-check.js）。
        另外 z 必须落在电流片区 |z|<L42/2 内 —— 棒端之外没有电流片，跳变条件不适用。 */
  for(const z of [-0.2,-0.1,0,0.1,0.2]){
    n++;
    const out=sheetBstack(A42+0.012,z,A42,L42,FIELD_N)[1];
    const inn=sheetBstack(A42-0.012,z,A42,L42,FIELD_N)[1];
    if(!near(out-inn,-1,0.04)) fails.push('z='+z+' 跳变量 '+(out-inn).toFixed(4)+' ≠ −1');
  }
  /* ⑤-b B_ρ 跨面连续（同样走 sheetBstack 直接算） */
  for(const z of [-0.35,0,0.35]){
    n++;
    const o=sheetBstack(A42+0.012,z,A42,L42,FIELD_N)[0];
    const i2=sheetBstack(A42-0.012,z,A42,L42,FIELD_N)[0];
    if(Math.abs(o-i2)>0.02) fails.push('z='+z+' B_ρ 不连续：'+o+' vs '+i2);
  }
  /* ⑤-c 轴上中心闭式 T(0,0)=L/(2√(L²/4+a²))：内核精确值 + 查表值都要接近 */
  n++;
  const T00=L42/(2*Math.sqrt(L42*L42/4+A42*A42));
  if(!near(sheetBstack(0,0,A42,L42,FIELD_N)[1],T00,0.01)) fails.push('内核 T(0,0) '+sheetBstack(0,0,A42,L42,FIELD_N)[1]+' ≠ 闭式 '+T00);
  n++;
  if(!near(fieldAt(0,0)[1],T00,0.02)) fails.push('查表 T(0,0) '+fieldAt(0,0)[1]+' ≠ 闭式 '+T00);
  n++;
  if(Math.abs(fieldAt(0,0)[0])>1e-9) fails.push('轴上 B_ρ 应为 0，得 '+fieldAt(0,0)[0]);
  /* ⑤-d 镜像对称 z → −z：B_z 偶、B_ρ **奇**（B_ρ ∝ z，单环公式里带因子 z）
     ⚠️ 早先把 B_ρ 也当偶函数比 ⇒ 0.0474 vs −0.0474 误报。 */
  for(const [rho,z] of [[0.10,0.15],[0.20,0.25],[0.45,0.05],[0.70,0.30]]){
    n++;
    const p=fieldAt(rho,z), m=fieldAt(rho,-z);
    if(!near(p[0],-m[0],0.03)) fails.push('镜像 B_ρ(ρ='+rho+',±'+z+') '+p[0]+' vs '+(-m[0]));
    if(!near(p[1],m[1],0.03)) fails.push('镜像 B_z(ρ='+rho+',±'+z+') '+p[1]+' vs '+m[1]);
  }
  /* ⑤-e ∇·B = 0（表上有限差分；圆柱坐标 div = dBρ/dρ + Bρ/ρ + dBz/dz）。
     ⚠️ 只断言**内核干净**的区域（z=0 与 |z|≥0.45，实测误差 ≤0.001）：
        贴端部 z≈±0.2、ρ≈0.2 处镜像采样截断留下 ~7% 的**奇对称**残差
        （剖面：z=0 → 0.0000、±0.1 → 0.013、±0.2 → 0.073、±0.35 → 0.035、±0.5 → 0.0009），
        是 240 环堆叠的已知极限，对场线追踪无影响（线只跟方向走）。
        全网格最差值在 DATA 行如实报，不藏。 */
  {
    const h=0.03, f=(rho,z)=>fieldAt(rho,z);
    for(const rho of [0.10,0.20,0.45,0.70]) for(const z of [0,0.50,-0.50]){
      n++;
      const c=f(rho,z), pr2=f(rho+h,z), mr=f(Math.max(0,rho-h),z), pz=f(rho,z+h), mz=f(rho,z-h);
      const div=(pr2[0]-mr[0])/((rho+h)-Math.max(0,rho-h)) + c[0]/rho + (pz[1]-mz[1])/(2*h);
      const mag=Math.max(1,Math.hypot(c[0],c[1]));
      if(Math.abs(div)>0.005*mag) fails.push('∇·B(ρ='+rho+',z='+z+')='+div.toFixed(4)+'（|B|='+mag.toFixed(2)+'）');
    }
    /* 全网格最差扫描（只报数，不作为断言） */
    let worst=0, wt='';
    for(const rho of [0.10,0.20,0.45,0.70]) for(let z=-0.5;z<=0.5001;z+=0.1){
      const c=f(rho,z), pr2=f(rho+h,z), mr=f(Math.max(0,rho-h),z), pz=f(rho,z+h), mz=f(rho,z-h);
      const div=(pr2[0]-mr[0])/((rho+h)-Math.max(0,rho-h)) + c[0]/rho + (pz[1]-mz[1])/(2*h);
      if(Math.abs(div)>worst){ worst=Math.abs(div); wt='ρ='+rho+' z='+z.toFixed(1); }
    }
    R.push('DATA|⑤-e ∇·B 全网格最差|'+worst.toFixed(4)+'（'+wt+'，端部镜像截断残差，已知局限）');
  }
  /* ⑤-f 建表网格必须绕开端线圈 ±L42/2（真场对数发散） */
  n++;
  const nearEnd=TBL.zz.some(z=>Math.abs(Math.abs(z)-L42/2)<0.014);
  if(nearEnd) fails.push('z 网格有节点落在端线圈 0.014 内（会撞对数发散）');
  n++;
  if(!(TBL.ok&&TBL.br.length===TBL.nr*TBL.nz)) fails.push('表没建成');
  group('⑤ 圆柱面电流：跳变 −1 / Bρ 连续 / 轴心闭式 / 镜像 / ∇·B=0 / 端极绕避', n, fails);
  R.push('DATA|⑤ 表规模|'+TBL.nr+'×'+TBL.nz+'　T(0,0) 查表='+fieldAt(0,0)[1].toFixed(4)+' 内核='+sheetBstack(0,0,A42,L42,FIELD_N)[1].toFixed(4)+'（闭式 '+T00.toFixed(4)+'）');
}

/* ============ ⑥ 场线：B′ 线闭合 / 纯外场是直线 / 总场线初始朝上 ============ */
{
  const fails=[]; let n=0;
  const bp=bpLines();
  n++; if(bp.length!==4) fails.push('B′ 线应有 3 闭合 + 1 轴段，实有 '+bp.length);
  for(let i=0;i<3;i++){
    n++;
    const p=bp[i].pts, d=Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1]);
    if(d>0.08) fails.push('B′ 线 #'+i+' 不闭合（首尾距 '+d.toFixed(3)+'）');
  }
  n++; if(bp[3].pts.length!==2||bp[3].pts[0][0]!==0) fails.push('轴段应是 [[0,·],[0,·]]');
  /* 纯外场（λ=0）⇒ 场线必须是竖直线 */
  n++;
  const straight=traceMerid(0.30,-1.0,0,1,{B0:1,maxSteps:300});
  const maxDu=Math.max(...straight.map(p=>Math.abs(p[0]-0.30)));
  if(maxDu>1e-9) fails.push('λ=0 时场线应竖直，u 漂了 '+maxDu);
  /* 总场线：默认参数下非空，且每条初始方向朝上（防断线过滤生效） */
  state.mode='poling'; state.B0=50; state.t=1; state.g=1; state.anim=null;
  const tl=totalLines();
  n++; if(!tl||tl.length<4) fails.push('总场线应有 ≥4 条，实有 '+(tl?tl.length:'null'));
  if(tl) for(const L of tl){
    n++;
    if(L.pts.length<2) { fails.push('总场线种子 '+L.u0+' 只有 '+L.pts.length+' 点'); continue; }
    if(L.pts[1][1]-L.pts[0][1]<=0) fails.push('总场线种子 '+L.u0+' 初始方向朝下（会画出断线）');
  }
  /* B′ 线与 M 无关（永久缓存）：改 iC 不应改变 bpLines 内容 */
  const bpA=JSON.stringify(bpLines());
  state.iC=3.0;
  n++; if(JSON.stringify(bpLines())!==bpA) fails.push('B′ 线随 M 变了（应永久缓存）');
  state.iC=1.0;
  group('⑥ 场线：B′ 闭合 / 轴段直线 / 纯外场竖直 / 总场初始朝上 / B′ 与 M 无关', n, fails);
}

/* ============ ⑦ buildScene 幂等 + prims 深度有限 ============ */
{
  const fails=[]; let n=0;
  MODES.forEach(m=>{
    state.mode=m;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length;
    n+=2;
    if(n1!==n2) fails.push(m+' buildScene 不幂等：'+n1+' → '+n2+'（每次重绘叠了一层？）');
    if(n1<3) fails.push(m+' 图元太少：'+n1);
    if(!z1.every(Number.isFinite)) fails.push(m+' prims 里有非有限深度（裸 pt() 漏 .d ⇒ 排序静默失效）');
    R.push('DATA|⑦ '+m+' 图元数（两遍）|'+n1+' / '+n2);
  });
  group('⑦ buildScene 幂等 + prims 深度有限（3 页签 × 2 遍）', n, fails);
}

/* ============ ⑧ state.show ↔ SHOW_ITEMS 逐字对齐 + 点阵几何 ============ */
{
  const fails=[]; let n=0;
  MODES.forEach(m=>(SHOW_ITEMS[m]||[]).forEach(it=>{
    n++;
    if(typeof state.show[it.k]!=='boolean') fails.push(m+' 显示项 '+it.k+' 在 state.show 里是 '+typeof state.show[it.k]);
  }));
  const used=new Set(); MODES.forEach(m=>(SHOW_ITEMS[m]||[]).forEach(it=>used.add(it.k)));
  Object.keys(state.show).forEach(k=>{ n++; if(!used.has(k)) fails.push('state.show.'+k+' 是死键'); });
  /* 点阵：5 层 × 19 个 = 95，全部落在棒内、环心距 = 2·RCD（相切） */
  n++; if(LATTICE.length!==95) fails.push('点阵应有 95 个环，实有 '+LATTICE.length);
  n++; if(hexLayer().length!==19) fails.push('每层应有 19 个环，实有 '+hexLayer().length);
  n++;
  const maxR=Math.max(...LATTICE.map(p=>Math.hypot(p.x,p.y)));
  if(maxR>A42-RCD+1e-9) fails.push('有点环越出棒壁：maxR='+maxR+' > '+(A42-RCD));
  n++;
  const layer0=hexLayer();
  let minSp=1e9;
  for(let i=0;i<layer0.length;i++) for(let j=i+1;j<layer0.length;j++)
    minSp=Math.min(minSp,Math.hypot(layer0[i].x-layer0[j].x,layer0[i].y-layer0[j].y));
  if(!near(minSp,2*RCD,1e-9)) fails.push('最小环心距 '+minSp+' ≠ 2·RCD='+(2*RCD)+'（不相切就看不到接触点抵消）');
  n++;
  if(!LATTICE.every(p=>LOOP_Z.includes(p.z))) fails.push('有点环的 z 不在 LOOP_Z 里');
  /* 随机法矢：单位矢量、随 seed 变、同 seed 不变 */
  n++;
  const nA=loopNorms();
  if(!nA.every(v=>near(Math.hypot(v.x,v.y,v.z),1,1e-12))) fails.push('随机法矢不是单位矢量');
  const seedNow=state.seed;
  n++; if(loopNorms()!==nA) fails.push('同 seed 两次 loopNorms 不是同一份（缓存失效）');
  state.seed=seedNow+1; const nB=loopNorms();
  n++; if(nB===nA||nB[0].x===nA[0].x) fails.push('换 seed 后法矢没变');
  state.seed=seedNow;
  /* slerpZ：s=0 保持原矢、s=1 到 ẑ、中间归一 */
  n++;
  const n0=loopNorms()[3];
  const s0=slerpZ(n0,0), s1=slerpZ(n0,1), sh=slerpZ(n0,0.5);
  if(Math.hypot(s0.x-n0.x,s0.y-n0.y,s0.z-n0.z)>1e-12) fails.push('slerpZ(0) 应保持原矢');
  if(Math.abs(s1.z-1)>1e-12||Math.hypot(s1.x,s1.y)>1e-12) fails.push('slerpZ(1) 应到 ẑ');
  if(!near(Math.hypot(sh.x,sh.y,sh.z),1,1e-12)) fails.push('slerpZ 中间结果不归一');
  group('⑧ show 键对齐 + 95 环几何（相切 / 不越壁 / 层 z）+ 法矢缓存 + slerpZ', n, fails);
}

/* ============ ⑨ DOM 扫查：@{ 泄漏 / undefined / 字面星号（3 页签 × 3 张卡） ============ */
const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
            '.module-title','.sec-title','.slider-row','.readout-toggle','.card-tab','.sub-chips','.ex-note'];
function scanDom(tag,fails){
  let seen=0;
  CONT.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      seen++;
      const s=el.innerText||'';
      if(s.indexOf('@{')>=0) fails.push(tag+' '+sel+' 泄漏字面 @{ → '+s.slice(0,60).replace(/\n/g,' '));
      if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) fails.push(tag+' '+sel+' 出现 undefined → '+s.slice(0,60).replace(/\n/g,' '));
      if(s.indexOf('**')>=0) fails.push(tag+' '+sel+' 出现字面星号 → '+s.slice(0,60).replace(/\n/g,' '));
    });
  });
  document.querySelectorAll('#panel .chip, #panel .card-tab').forEach(el=>{
    seen++;
    const t=(el.innerText||'').trim();
    if(t==='undefined'||t==='') fails.push(tag+' 按钮文本异常 → 「'+t+'」');
  });
  return seen;
}
{
  const fails=[]; let cards=0, seen=0;
  MODES.forEach(m=>{
    clickTab(m);
    seen+=scanDom('tab:'+m, fails);
    const n=document.querySelectorAll('#panel .card-tab').length;
    if(n!==3) fails.push('页签 '+m+' 讲解卡应有 3 张，实有 '+n);
    for(let i=0;i<n;i++){
      try{ document.querySelectorAll('#panel .card-tab')[i].click(); }
      catch(e){ fails.push('card '+m+'#'+i+' 抛异常：'+e.message); }
      cards++;
      seen+=scanDom('card:'+m+':'+i, fails);
    }
  });
  R.push('DATA|⑨ 扫查规模|讲解卡 '+cards+' 张　扫到容器 '+seen+' 个');
  group('⑨ 全页签 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
}

/* ============ ⑩ 画布文本插桩扫查 ============ */
{
  const bad=[];
  const O={text:text,textScreen:textScreen,txt:txt};
  function chk(str,where){ const s=String(str);
    if(s==='undefined'||s==='NaN'||s.indexOf('undefined')>=0||s.indexOf('**')>=0) bad.push(where+': '+s.slice(0,70));
    if(/\bNaN\b/.test(s)) bad.push(where+' NaN: '+s.slice(0,70)); }
  text      = function(p,str,o){ chk(str,'text');       return O.text(p,str,o); };
  textScreen= function(x,y,str,o){ chk(str,'textScreen'); return O.textScreen(x,y,str,o); };
  txt       = function(x,y,str,o){ chk(str,'txt');      return O.txt(x,y,str,o); };
  try{
    MODES.forEach(m=>{
      state.mode=m;
      Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
      state.iC=3.0; state.rC=15; state.B0=100; state.t=0.45; state.g=animG(0.45);   /* 极端读数 */
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
      state.iC=1.0; state.rC=10; state.B0=50; state.t=1; state.g=1;
    });
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑩ 画布文本扫到的坏串数量|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑩ 画布文本（text/textScreen/txt）无 undefined/NaN/字面星号', bad.length===0, bad.length+' 处');
}

/* ============ ⑪ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑪ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
  R.push('DATA|⑪ id 总数|'+ids.length);
}

/* ============ ⑫ 按钮取值不越界、且与滑块显示同步 ============ */
{
  const fails=[]; let n=0;
  const RG ={iC:IC_RANGE,rC:RC_RANGE,B0:B0_RANGE,t:[0,1]};
  const GET={iC:()=>state.iC,rC:()=>state.rC,B0:()=>state.B0,t:()=>state.t};
  MODES.forEach(m=>{
    clickTab(m);
    const btns=Array.from(document.querySelectorAll('#sliderSec button.chip'));
    if(btns.length<1) fails.push('页签 '+m+' 没有一个动作按钮');
    for(const b of btns){
      n++;
      const lab=(b.textContent||'').trim().slice(0,14);
      try{ b.click(); }catch(e){ fails.push(m+' 按钮「'+lab+'」抛异常 '+e.message); continue; }
      for(const k of Object.keys(GET)){
        const v=GET[k](), rg=RG[k];
        if(!(v>=rg[0]-1e-9 && v<=rg[1]+1e-9))
          fails.push(m+' 按钮「'+lab+'」把 '+k+' 设成 '+v+'，越出量程 ['+rg[0]+','+rg[1]+']');
        const el=document.getElementById('s_'+k);
        if(el && Math.abs(parseFloat(el.value)-v)>1e-9)
          fails.push(m+' 按钮「'+lab+'」后 '+k+'：滑块显示 '+el.value+' ≠ state '+v);
      }
    }
  });
  stopAnim();
  group('⑫ 按钮取值不越界、且与滑块显示同步（▶/⏮/⏭/翻转/默认/随机）', n, fails);
  R.push('DATA|⑫ 实际点击的按钮数|'+n);
}

/* ============ ⑬ 显示开关：守卫"至少留一层" + 全开有图元 ============ */
{
  const fails=[]; let n=0;
  MODES.forEach(m=>{
    clickTab(m);
    const ks=Array.from(document.querySelectorAll('#panel .chip[data-k]')).map(c=>c.dataset.k);
    if(ks.length<3) fails.push('页签 '+m+' 显示项只有 '+ks.length+' 个');
    ks.forEach(k=>{
      n++;
      const sel='#panel .chip[data-k="'+k+'"]';
      try{ document.querySelector(sel).click(); }catch(e){ fails.push('chip '+k+' 抛异常 '+e.message); return; }
      const on=Array.from(document.querySelectorAll('#panel .chip[data-k]')).filter(c=>c.classList.contains('on')).length;
      if(on<1) fails.push('页签 '+m+' 关掉 '+k+' 之后**一层都不剩**（画布会纯白）');
      const c2=document.querySelector(sel);
      if(c2 && !c2.classList.contains('on')){ try{ c2.click(); }catch(e){ fails.push('chip '+k+' 二次点击抛异常'); } }
    });
    Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
    buildScene();
    if(prims.length<3) fails.push('页签 '+m+' 全开时图元只有 '+prims.length+' 个');
  });
  group('⑬ 显示开关守卫（至少留一层）+ 全开有图元', n, fails);
}

/* ============ ⑭ 表层放大插图只在 ②③ 画 ============ */
{
  const fails=[]; const calls=[];
  const ODI=drawInset; drawInset=function(s){ calls.push(state.mode); return ODI(s); };
  try{
    MODES.forEach(m=>{ state.mode=m; Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; }); buildScene(); });
  } finally { drawInset=ODI; }
  MODES.forEach(m=>{
    const c=calls.filter(x=>x===m).length;
    if(m==='molecular'){ if(c>0) fails.push('① 页不该画插图，实际 '+c+' 次'); }
    else if(c<1) fails.push(m+' 页应画插图，实际 0 次');
  });
  group('⑭ 表层放大插图只在 ②③ 绘制', 3, fails);
  R.push('DATA|⑭ drawInset 调用|'+MODES.map(m=>m+':'+calls.filter(x=>x===m).length).join(' '));
}

/* ============ ⑮ 数据条读数与物理量一致 + 开关 ============ */
{
  const fails=[]; let n=0;
  const strip=document.getElementById('coordStrip');
  const need={molecular:5, nofield:5, poling:9};
  MODES.forEach(m=>{
    clickTab(m); n++;
    const cnt=strip.querySelectorAll('.coord-chip').length;
    if(cnt<need[m]) fails.push('页签 '+m+' 数据条只有 '+cnt+' 个 chip（应 ≥'+need[m]+'）');
    const txt=strip.innerText||'';
    if(txt.indexOf('@{')>=0) fails.push('数据条泄漏字面 @{ → '+txt.slice(0,50));
  });
  n++;
  state.showReadout=false; updateReadout();
  if(strip.innerHTML!=='') fails.push('关掉数据条后 strip 不为空');
  state.showReadout=true; updateReadout();
  if(strip.querySelectorAll('.coord-chip').length<5) fails.push('恢复后数据条是空的');
  /* µ_r 与 B/B₀ 一致 */
  n++;
  state.mode='poling'; state.B0=60; state.t=1; state.g=1;
  updateReadout();
  if(!near(muR(),BtMT()/B0eff(),1e-9)) fails.push('µ_r 与 B/B₀ 不一致');
  state.B0=50;
  group('⑮ 数据条 chip 数 / 无 @{ 泄漏 / 开关 / µ_r 一致', n, fails);
}

/* ============ ⑯ 页签切换：预设生效 + cardTab 复位 + anim 停止 + clamp ============ */
{
  const fails=[]; let n=0;
  state.mode='poling'; state.B0=999; state.t=0.3; state.anim={u:0.3,playing:true};
  clickTab('poling'); n++;
  if(state.B0!==50) fails.push('poling 预设应把 B0 设回 50，实为 '+state.B0);
  if(state.t!==1||state.g!==1) fails.push('poling 预设应把 t/g 设回 1/1，实为 '+state.t+'/'+state.g);
  if(state.anim!==null) fails.push('切页签后 anim 没停');
  if(state.cardTab!=='1') fails.push('cardTab 没复位');
  state.mode='molecular'; state.iC=99; state.rC=1; state.flip=true;
  clickTab('molecular'); n++;
  if(state.iC!==1.0||state.rC!==10||state.flip!==false) fails.push('molecular 预设没生效：'+state.iC+'/'+state.rC+'/'+state.flip);
  clickTab('nofield'); n++;
  if(state.mode!=='nofield') fails.push('切到 nofield 失败');
  clickTab('poling'); n++;
  if(state.mode!=='poling'||state.B0!==50) fails.push('切回 poling 预设没生效');
  group('⑯ 页签预设 / cardTab 复位 / anim 停止 / clampState 兜底', n, fails);
}

/* ============ ⑰ 默认参数的物理 sane 度（画面必须看得见磁化） ============ */
{
  const fails=[]; let n=0;
  state.mode='poling'; Object.assign(state, JSON.parse(JSON.stringify(PRESET.poling))); clampState();
  n++;
  if(!(sVis()>=0.5&&sVis()<=0.85)) fails.push('默认 s_视='+sVis()+' 不在 [0.5,0.85]（磁化会看不见/过饱和）');
  n++;
  if(!(Mval()/1e3>=15&&Mval()/1e3<=30)) fails.push('默认 M='+(Mval()/1e3)+' kA/m 不在 [15,30]');
  n++;
  if(!(BpMT()>=20&&BpMT()<=35)) fails.push('默认 B′='+BpMT()+' mT 不在 [20,35]（与 B₀=50 不同量级就没得看）');
  n++;
  if(!(muR()>=1.3&&muR()<=1.8)) fails.push('默认 µ_r='+muR()+' 不在 [1.3,1.8]');
  n++;
  if(!(sReal()>0&&sReal()<1e-4)) fails.push('默认真实取向度 L(a)='+sReal()+' 应在 (0,1e-4)（顺磁质诚实线）');
  n++;
  const tl=totalLines();
  if(!tl||tl.length<4) fails.push('默认参数画不出总场线');
  group('⑰ 默认参数 sane 度（s/M/B′/µ_r 落在可见区 + 诚实线 L(a)）', n, fails);
  R.push('DATA|⑰ 默认|s_视='+(sVis()*100).toFixed(0)+'%  L(a)真实='+sReal().toExponential(2)+'  µ_r='+muR().toFixed(2)+'  总场线 '+(tl?tl.length:0)+' 条');
}

restore();
return R.join('\n')+'\nDONE';
})()
