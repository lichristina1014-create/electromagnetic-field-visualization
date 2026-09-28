(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const E0=10, a=A_C;
/* ① 内部 |E| 严格为 0（240 点） */
let mxi=0;
for(let i=0;i<12;i++) for(let j=0;j<20;j++){
  const r=0.05+(a-0.06)*i/11, th=(j+0.5)/20*Math.PI;
  const f=fieldE(r,th,E0); mxi=Math.max(mxi,Math.hypot(f.Er,f.Eth));
}
T('内部 |E| ≡ 0（240 点）', mxi===0, 'max='+mxi);
/* ② 表面：切向严格为 0、法向 = 3E0cosθ */
let mxt=0, mxr=0;
for(let j=0;j<180;j++){
  const th=(j+0.5)/180*Math.PI, f=fieldE(a,th,E0);
  mxt=Math.max(mxt,Math.abs(f.Eth));
  mxr=Math.max(mxr,Math.abs(f.Er-3*E0*Math.cos(th)));
}
T('表面 E_t ≡ 0（180 点）', mxt===0, 'max='+mxt);
T('表面 E_n = 3E₀cosθ', mxr<1e-12, 'maxΔ='+mxr.toExponential(2));
/* ③ 等位体 */
let mxv=0;
for(let j=0;j<180;j++){ const th=(j+0.5)/180*Math.PI; mxv=Math.max(mxv,Math.abs(volt(a,th,E0))); }
for(let i=0;i<20;i++) mxv=Math.max(mxv,Math.abs(volt(0.02+0.9*a*i/19,1.1,E0)));
T('V(a,θ) ≡ 0 且内部 V ≡ 0', mxv===0, 'max='+mxv);
/* ④ σ = ε₀E_n */
let mxs=0;
for(let j=0;j<160;j++){ const th=(j+0.5)/160*Math.PI;
  mxs=Math.max(mxs,Math.abs(sigma(th,E0,null)-fieldE(a,th,E0).Er*EPS0*1e12)); }
T('σ = ε₀E_n（数值）', mxs<1e-8, 'maxΔ='+mxs.toExponential(2));
/* ⑤ ★ 独立复算：直角坐标叠加法 E = E₀ẑ + E₀a³(3cosθ·r̂−ẑ)/r³（r>a） */
let mxd=0;
for(let i=0;i<26;i++) for(let j=0;j<14;j++) for(let k=0;k<4;k++){
  const r=a*1.02+3.0*i/25, th=(j+0.5)/14*Math.PI, ph=k*Math.PI/2;
  const f=fieldE(r,th,E0), Es=vadd(vmul(eR(th,ph),f.Er),vmul(eTh(th,ph),f.Eth));
  const k3=Math.pow(a/r,3), ct=Math.cos(th), st=Math.sin(th);
  const Ec=pt(E0*k3*3*ct*st*Math.cos(ph), E0*k3*3*ct*st*Math.sin(ph), E0+E0*(3*k3*ct*ct-k3));
  mxd=Math.max(mxd, vlen(vsub(Es,Ec))/Math.max(vlen(Ec),1e-9));
}
T('球坐标分量式 == 直角坐标叠加法', mxd<1e-12, 'relmax='+mxd.toExponential(2));
/* ⑥ 远场 → 匀强场（40a 处偶极项 < 1e-5） */
const rF=40*a, kF=Math.pow(a/rF,3);
T('远场 → E₀（40a，修正 3×10⁻⁵）', Math.abs(fieldE(rF,0,E0).Er-E0*(1+2*kF))<1e-12 && 2*kF<1e-4,
  '2(a/r)³='+(2*kF).toExponential(2));
T('远场 E_t = −E₀sinθ', Math.abs(fieldE(rF,Math.PI/2,E0).Eth+E0*(1-kF))<1e-12);
/* ⑦ 赤道表面 |E| ≈ 0（cos90° 在浮点下是 6e-17，不是精确 0） */
T('赤道表面 |E| ≈ 0', Math.hypot(fieldE(a,Math.PI/2,E0).Er,fieldE(a,Math.PI/2,E0).Eth)<1e-12,
  Math.hypot(fieldE(a,Math.PI/2,E0).Er,fieldE(a,Math.PI/2,E0).Eth).toExponential(2));
/* ⑧ t=1 == 严格解；t=0 球内 = 匀强场 */
let m1=0, m0=0;
for(let i=0;i<20;i++) for(let j=0;j<12;j++){
  const r=0.1+2.2*i/19, th=(j+0.5)/12*Math.PI;
  const A=fieldE(r,th,E0), B=fieldT(r,th,E0,1);
  m1=Math.max(m1,Math.abs(A.Er-B.Er)+Math.abs(A.Eth-B.Eth));
  if(r<a){ const C=fieldT(r,th,E0,0);
    m0=Math.max(m0,Math.abs(C.Er-E0*Math.cos(th))+Math.abs(C.Eth+E0*Math.sin(th))); }
}
T('t=1 与严格解逐点相同', m1===0, 'maxΔ='+m1);
T('t=0 球内 = 匀强场', m0===0, 'maxΔ='+m0);
/* ⑨ 场线：命中线终点恰在球面、掠过线两端都在 r=Zmax */
const segs=dipolarLines();
const Zmax=a*3.1;
let bad=0, ends=0;
segs.forEach(s=>{ const r=vlen(s[s.length-1]);
  if(r<a*0.9999) bad++; else if(Math.abs(r-a)<1e-9) ends++; });
T('命中线终点恰在球面', bad===0&&ends===12, 'bad='+bad+' ends='+ends+' segs='+segs.length);
const miss=segs.filter(s=>Math.abs(vlen(s[s.length-1])-Zmax)<1e-9);
T('掠过线两端都在 r=Zmax', miss.length===2, 'miss='+miss.length);
/* ⑩ 入射角 sinθ₀ = b/(√3a)：逐段量落点极角，与 b 的解析值配对 */
const hitB=[0,0.45,0.95,1.32,1.60,1.723].map(bm=>bm/Math.sqrt(3)).sort((x,y)=>x-y);
const got=segs.map(s=>s[s.length-1]).filter(p=>Math.abs(vlen(p)-a)<1e-9&&p.z>0)
              .map(p=>Math.sin(Math.acos(Math.min(1,p.z/a)))).sort((x,y)=>x-y);
let mxa=0;
if(got.length===hitB.length) hitB.forEach((v,i)=>{ mxa=Math.max(mxa,Math.abs(v-got[i])); });
else mxa=9;
T('入射角 sinθ₀=b/(√3a)', mxa<1e-9, 'maxΔ='+mxa.toExponential(2)+' n='+got.length);
/* ⑪ ③ 空腔壳三段场 + 电位 */
const qc=1.2;
T('腔内 E = Q_KVq/r²', Math.abs(shellField(0.3,0.7,E0,qc).Er-Q_KV*qc/0.09)<1e-12);
T('壳内 |E| ≡ 0', (()=>{const f=shellField(0.65,1.2,E0,qc);return f.Er===0&&f.Eth===0;})());
T('壳外 = 免球场 + q 场',
  Math.abs(shellField(1.6,0.4,E0,qc).Er-(E0*(1+2*Math.pow(a/1.6,3))*Math.cos(0.4)+Q_KV*qc/2.56))<1e-12);
T('壳（含内外表面）V ≡ 0', shellVolt(0.7,1.0,E0,qc)===0 && shellVolt(B_C,1.4,E0,qc)===0 && shellVolt(a,0.3,E0,qc)===0);
/* ⑫ 内/外表面总量 = ∓q（外表面补 dθ 因子） */
T('内表面总量 = −q', Math.abs(sigIn(qc)*4*Math.PI*B_C*B_C/1000+qc)<1e-9);
const N=4000; let so=0;
for(let j=0;j<N;j++){ const th=(j+0.5)/N*Math.PI; so+=sigOut(th,E0,qc)*Math.sin(th); }
so*=(2*Math.PI*a*a)*(Math.PI/N);
T('外表面总量 = +q', Math.abs(so/1000-qc)/qc<1e-5, so.toFixed(4)+' nC');
/* ⑬ ③ 的不变性 + 教学判据（2026-09-28 补，起因是"外壁是不是全是正电荷、外场会不会
   影响腔内"这一问）。⭐ 不变性一律用**逐位相等 `===`**，不用容差 —— 容差只能证明"差不多
   不受影响"，`===` 才证明"这个参数根本没参与运算"。
   ① 实心球 vs 空腔壳：`sceneBuild()`（①）从不引用 `B_C`，只有 `sceneShield()`（③）用 ⇒
      ① 是实心球、没有内壁；本节的"内壁量"只属于 ③。 */
const cav=[[0.15,0.4],[0.30,1.1],[0.50,2.6]].map(([r,th])=>({
  p:shellField(r,th,1,qc), q:shellField(r,th,1000,qc), s:shellField(r,th,-777,qc)}));
T('腔内 E 逐位不受 E₀ 影响（1 / 1000 / −777 kV/m，3 个位点）',
  cav.every(o=>o.p.Er===o.q.Er && o.q.Er===o.s.Er && o.p.Eth===o.q.Eth && o.q.Eth===o.s.Eth),
  'r=b/2 处 Er='+cav[1].p.Er.toFixed(9)+' kV/m');
T('腔内场是纯径向点电荷场（Eth ≡ 0）', cav.every(o=>o.p.Eth===0), 'Eth='+cav[0].p.Eth);
/* ⚠️ 用**函数元数**钉住"外场不许进入内壁公式"：`sigIn(qc)` 一旦被改成 `sigIn(qc,E0)`，
   元数立刻从 1 变成 2 ⇒ 这条会响。纯行为断言做不到这一点（值仍会相等）。 */
T('内壁 σ 只依赖 q（元数 = 1）且恒负、均匀',
  sigIn.length===1 && sigIn(qc)<0 && Math.abs(sigIn(qc)+qc*1000/(4*Math.PI*B_C*B_C))<1e-12,
  'arity='+sigIn.length+'　σ='+sigIn(qc).toFixed(2)+' nC/m²');
let sh=0; for(let j=0;j<N;j++){ const th=(j+0.5)/N*Math.PI; sh+=sigOut(th,E0,qc)*Math.sin(th)*2*Math.PI*a*a; }
sh*=Math.PI/N;
/* ⚠️ 净电荷只能按**相对容差**判，别写绝对 `1e-9`（我第一版就栽在这里）：
   外壁通量是 N=4000 的**中点法**积分。奇数项 `cosθ·sinθ` 被 θ↔π−θ 对称性**精确**消掉
   （所以 E₀ 那一项零误差），但常数项的通量 Σsin(θⱼ)Δθ = csc(π/2N)·(π/N) = 2 + π²/(12N²)
   ⇒ 系统性偏大 5.14e-8（相对 2.57e-8），×1200 nC = **3.08e-5 nC** —— 实测正是这个数。
   和 `sigma(π/2) ≠ 0`（`Math.cos(π/2)=6.1e-17`）属同一类：断言必须带**与分析相符**的容差。 */
const qIn=sigIn(qc)*4*Math.PI*B_C*B_C;            /* ≡ −qc·1000，代数恒等 */
const net=(qIn+sh)/1000;                           /* µC */
T('球壳净电荷 ≡ 0（内壁 −q ＋ 外壁 +q）', Math.abs(net)/qc<1e-6,
  net.toExponential(2)+' µC　相对 '+Math.abs(net/qc).toExponential(1));
/* 教学判据：外壁**不是**"全是正电荷"。σ_out = 3ε₀E₀cosθ + q/(4πa²)，两项同量级时
   背场一侧翻负。θ₀ = acos(−q/(4πa²·3ε₀E₀))。⚠️ 这条钉住的是"页面确实能画出负的外壁"。 */
const Amp=SIG_K*E0, Bq=qc*1000/(4*Math.PI*a*a);
const th0=Bq<Amp ? Math.acos(-Bq/Amp) : 0;
T('外壁并非全正：θ > θ₀ 的那一片翻负',
  th0>0 && sigOut(th0+0.05,E0,qc)<0 && sigOut(Math.max(0,th0-0.05),E0,qc)>0,
  'θ₀='+(th0*180/Math.PI).toFixed(1)+'°，θ=180° 处 '+sigOut(Math.PI,E0,qc).toFixed(0)+' nC/m²');
return R.join('\n')+'\nDONE';
})();
