(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const a=A_C;
/* 1. t=0 的场线必须是**精确直线** r·sinθ = b（匀强场） */
let m0=0,n0=0;
for(let k=1;k<=40;k++){ const th=k/41*Math.PI*0.96+0.01;
  for(const bm of [0.3,0.8,1.5,2.4]){ const b=bm*a, r=streamR(th,b,0);
    if(!isFinite(r)) continue; n0++; m0=Math.max(m0,Math.abs(r*Math.sin(th)-b)); } }
T('t=0 场线是直线 r·sinθ=b', m0<1e-12&&n0===160, 'maxΔ='+m0.toExponential(2)+' n='+n0);
/* 2. 任意 t 都是 ψ_t = sin²θ(r²/2 + t·a³/r) 的等值线 */
let m1=0,n1=0;
for(const tv of [0,0.25,0.5,0.75,1]) for(let k=1;k<=16;k++){ const th=k/17*Math.PI*0.96+0.01;
  for(const bm of [0.5,1.1,1.7,2.3]){ const b=bm*a, r=streamR(th,b,tv);
    if(!isFinite(r)) continue; n1++;
    const psi=r*r/2+tv*a*a*a/r, lhs=Math.sin(th)*Math.sin(th)*psi;
    m1=Math.max(m1,Math.abs(lhs-b*b/2)/(b*b/2)); } }
T('ψ_t 等值线（5 个 t × 64 点）', m1<1e-12, 'relmax='+m1.toExponential(2)+' n='+n1);
/* 3. 临界瞄准距离 b_crit(t) = a√(1+2t) */
T('b_crit(t)=a√(1+2t)', [0,0.5,1].every(tv=>Math.abs(Bcr(tv)-a*Math.sqrt(1+2*tv))<1e-15),
  [0,0.5,1].map(tv=>Bcr(tv).toFixed(4)).join('/'));
/* 4. 回归：dipolarLines(1) 与旧的无参调用逐点相同 */
const s1=dipolarLines(1), s0=dipolarLines();
let ms=0;
if(s1.length!==s0.length) ms=9;
else s1.forEach((sg,i)=>{ if(sg.length!==s0[i].length) ms=9;
  else sg.forEach((p,j)=>{ ms=Math.max(ms,Math.abs(p.x-s0[i][j].x)+Math.abs(p.z-s0[i][j].z)); }); });
T('dipolarLines(1) == 旧严格解', ms===0, 'maxΔ='+ms+' segs='+s1.length);
/* 5. 各 t 下线场：命中线终点恰在球面，落点 sinθ₀ = b/b_crit(t) */
for(const tv of [0,0.5,1]){
  const bc=Bcr(tv), segs=dipolarLines(tv);
  let bad=0;
  segs.forEach(sg=>{ const r0=vlen(sg[sg.length-1]); if(r0<a*0.9999) bad++;
    if(tv<0.5){ for(let j=0;j<sg.length;j++){ const r=vlen(sg[j]); if(r<a-1e-9) bad++; } } });
  const exp=FL_B.filter(bm=>bm*a<bc*0.999).map(bm=>bm*a/bc).sort((x,y)=>x-y);
  const got=segs.filter(sg=>{const p=sg[sg.length-1];return Math.abs(vlen(p)-a)<1e-9&&p.z>=0;})
                .map(sg=>{const p=sg[sg.length-1];return Math.sin(Math.acos(Math.min(1,p.z/a)));})
                .sort((x,y)=>x-y);
  let mg=0; if(got.length===exp.length) exp.forEach((v,i)=>mg=Math.max(mg,Math.abs(v-got[i]))); else mg=9;
  T('t='+tv+' 落点 sinθ₀=b/b_crit', bad===0&&mg<1e-9, 'bad='+bad+' maxΔ='+mg.toExponential(2)+' n='+got.length);
}
/* 6. t=0 的命中线**不**垂直入射；t=1 严格垂直入射（比较性判据，最稳） */
function incAng(tv,bm){
  const b=bm*a, bc=Bcr(tv), th0=Math.asin(b/bc), e=1e-4;
  const r=streamR(th0-e,b,tv); if(!isFinite(r)) return NaN;
  const pn=pt(a*Math.sin(th0),0,a*Math.cos(th0)), pp=pt(r*Math.sin(th0-e),0,r*Math.cos(th0-e));
  const tg=vsub(pn,pp); if(vlen(tg)<1e-12) return NaN;
  const nr=pt(Math.sin(th0),0,Math.cos(th0)), u=vmul(tg,1/vlen(tg));
  return Math.acos(Math.min(1,Math.abs(vdot(u,nr))))*R2D;
}
const A0=incAng(0,0.95), A5=incAng(0.5,0.95), A1=incAng(1,0.95);
T('t=0 命中线是斜入（不垂直）', A0>25, '夹角='+A0.toFixed(2)+'°');
T('t=1 命中线严格垂直入射', A1<0.8, '夹角='+A1.toFixed(3)+'°');
T('入射角随 t 单调变小', A0>A5&&A5>A1, A0.toFixed(1)+' → '+A5.toFixed(1)+' → '+A1.toFixed(3)+'°');
/* 7. t=0 时外场线一条都不能缺：E0=0 ⇒ 不画；E0>0 ⇒ 有 */
T('E0=0 时没有场线', fieldLines(0,0).length===0);
T('E0>0 时场线齐全', fieldLines(10,0).length===dipolarLines(0).length &&
  fieldLines(10,0.5).length===dipolarLines(0.5).length && fieldLines(10,0.5).length>=10,
  't0='+fieldLines(10,0).length+' t.5='+fieldLines(10,0.5).length+' t1='+fieldLines(10,1).length);
/* 8. 任意 t 全场线无 NaN、无负半径 */
let badp=0;
[0,0.25,0.5,0.75,1].forEach(tv=>dipolarLines(tv).forEach(sg=>sg.forEach(p=>{
  if(!isFinite(p.x)||!isFinite(p.z)) badp++; })));
T('5 个 t 的场线无 NaN', badp===0, 'bad='+badp);
/* 9. t→1 时场线形状连续（相邻 t 的对应点差 < 0.12a） */
const sa=dipolarLines(0.98), sb=dipolarLines(1.0);
let mj=0; if(sa.length===sb.length) sa.forEach((sg,i)=>{ if(sg.length===sb[i].length)
  sg.forEach((p,j)=>{ mj=Math.max(mj,Math.abs(p.x-sb[i][j].x)+Math.abs(p.z-sb[i][j].z)); }); });
T('t=0.98 与 t=1 形状连续', mj<0.12*a, 'maxΔ='+(mj/a).toFixed(4)+'a');
return R.join('\n')+'\nDONE';
})();
