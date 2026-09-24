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
/* ⑨ 等位面求根 */
let mxq=0;
[0.85,1.45,2.05].forEach(c=>{ for(let j=1;j<20;j++){
  const th=j/20*Math.PI/2, r=equiR(c/Math.cos(th));
  mxq=Math.max(mxq,Math.abs((r-a*a*a/(r*r))-c/Math.cos(th))); }});
T('等位面求根 u(r)=K', mxq<1e-9, 'maxΔ='+mxq.toExponential(2));
/* ⑩ 场线：命中线终点恰在球面、掠过线两端都在 r=Zmax */
const segs=dipolarLines();
const Zmax=a*3.1;
let bad=0, ends=0;
segs.forEach(s=>{ const r=vlen(s[s.length-1]);
  if(r<a*0.9999) bad++; else if(Math.abs(r-a)<1e-9) ends++; });
T('命中线终点恰在球面', bad===0&&ends===12, 'bad='+bad+' ends='+ends+' segs='+segs.length);
const miss=segs.filter(s=>Math.abs(vlen(s[s.length-1])-Zmax)<1e-9);
T('掠过线两端都在 r=Zmax', miss.length===2, 'miss='+miss.length);
/* ⑪ 入射角 sinθ₀ = b/(√3a)：逐段量落点极角，与 b 的解析值配对 */
const hitB=[0,0.45,0.95,1.32,1.60,1.723].map(bm=>bm/Math.sqrt(3)).sort((x,y)=>x-y);
const got=segs.map(s=>s[s.length-1]).filter(p=>Math.abs(vlen(p)-a)<1e-9&&p.z>0)
              .map(p=>Math.sin(Math.acos(Math.min(1,p.z/a)))).sort((x,y)=>x-y);
let mxa=0;
if(got.length===hitB.length) hitB.forEach((v,i)=>{ mxa=Math.max(mxa,Math.abs(v-got[i])); });
else mxa=9;
T('入射角 sinθ₀=b/(√3a)', mxa<1e-9, 'maxΔ='+mxa.toExponential(2)+' n='+got.length);
/* ⑫ ③ 空腔壳三段场 + 电位 */
const qc=1.2;
T('腔内 E = Q_KVq/r²', Math.abs(shellField(0.3,0.7,E0,qc).Er-Q_KV*qc/0.09)<1e-12);
T('壳内 |E| ≡ 0', (()=>{const f=shellField(0.65,1.2,E0,qc);return f.Er===0&&f.Eth===0;})());
T('壳外 = 免球场 + q 场',
  Math.abs(shellField(1.6,0.4,E0,qc).Er-(E0*(1+2*Math.pow(a/1.6,3))*Math.cos(0.4)+Q_KV*qc/2.56))<1e-12);
T('壳（含内外表面）V ≡ 0', shellVolt(0.7,1.0,E0,qc)===0 && shellVolt(B_C,1.4,E0,qc)===0 && shellVolt(a,0.3,E0,qc)===0);
/* ⑬ 内/外表面总量 = ∓q（外表面补 dθ 因子） */
T('内表面总量 = −q', Math.abs(sigIn(qc)*4*Math.PI*B_C*B_C/1000+qc)<1e-9);
const N=4000; let so=0;
for(let j=0;j<N;j++){ const th=(j+0.5)/N*Math.PI; so+=sigOut(th,E0,qc)*Math.sin(th); }
so*=(2*Math.PI*a*a)*(Math.PI/N);
T('外表面总量 = +q', Math.abs(so/1000-qc)/qc<1e-5, so.toFixed(4)+' nC');
return R.join('\n')+'\nDONE';
})();
