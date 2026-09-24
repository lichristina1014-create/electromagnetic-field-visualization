(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
canvas.setPointerCapture=()=>{}; canvas.releasePointerCapture=()=>{};
/* ① 三模式幂等 + 深度无 NaN */
for(const md of ['build','concl','shield']){
  state.mode=md;
  prims=[]; buildScene(); const n1=prims.length;
  prims=[]; buildScene(); const n2=prims.length;
  T('幂等 '+md, n1===n2&&n1>0, n1+'/'+n2);
  const nan=prims.filter(p=>p.z==null||Number.isNaN(p.z)).length;
  T('z 无 NaN '+md, nan===0, 'nan='+nan+'/'+n1);
}
/* ② draw() 连画 3 次不增长（重绘叠加类 bug 的幂等探针） */
state.mode='concl'; let d1=0,d3=0;
try{ draw(); d1=prims.length; draw(); draw(); d3=prims.length; }catch(e){ d3=-1; }
T('draw 连画不增长', d1===d3&&d1>0, d1+'/'+d3);
/* ③ 拖探针：用 probeJac 预测一步位移，看状态是否精确落位 */
state.mode='concl'; state.rp=1.35; state.thp=55; state.sweep=null;
renderPanel(); updateAll(); draw();
const J=probeJac();
T('雅可比非退化', !!J && Math.abs(J.det0)>=0.25*J.ref,
  J?('|det|/ref='+(Math.abs(J.det0)/J.ref).toFixed(3)):'null');
const rc=canvas.getBoundingClientRect();
const w0=pr(probeP()); const r0=state.rp, t0=state.thp;
const dr=0.10, dth=6;
const mx=J.P1.x*dr+J.P2.x*(dth*D2R), my=J.P1.y*dr+J.P2.y*(dth*D2R);
const ev=(tp,x,y)=>new PointerEvent(tp,{clientX:rc.left+x,clientY:rc.top+y,
  button:0,buttons:1,bubbles:true,pointerId:1});
canvas.dispatchEvent(ev('pointerdown',w0.x,w0.y));
canvas.dispatchEvent(ev('pointermove',w0.x+mx,w0.y+my));
canvas.dispatchEvent(ev('pointerup',w0.x+mx,w0.y+my));
T('拖探针 ⇒ Δr 复原', Math.abs(state.rp-(r0+dr))<1e-9, (state.rp-r0).toFixed(9)+' vs '+dr);
T('拖探针 ⇒ Δθ 复原', Math.abs(state.thp-(t0+dth))<1e-9, (state.thp-t0).toFixed(9)+' vs '+dth);
T('拖后 r/θ 仍在量程', state.rp>=RP_RANGE[0]&&state.rp<=RP_RANGE[1]&&
  state.thp>=TH_LIM[0]&&state.thp<=TH_LIM[1], state.rp.toFixed(3)+' / '+state.thp.toFixed(2));
T('pointerup 后 drag=null', drag===null);
/* ④ 表面吸附（本页最关键的位置） */
state.rp=0.803; snapRp(); T('snapRp 0.803 → a', Math.abs(state.rp-A_C)<1e-12, state.rp);
state.rp=A_C-1e-9; snapRp(); T('snapRp 0.799999999 → a', state.rp===A_C, state.rp);
state.rp=0.79; snapRp(); T('snapRp 不误吸 0.79', Math.abs(state.rp-0.79)<1e-12, state.rp);
/* ⑤ 越界夹紧 */
state.rp=9; clampRp(); const hi=state.rp; state.rp=-2; clampRp(); const lo=state.rp;
T('clampRp 双向夹紧', hi===RP_RANGE[1]&&lo===RP_RANGE[0], hi+'/'+lo);
state.thp=200; clampThp(); const th1=state.thp; state.thp=0; clampThp();
T('clampThp 双向夹紧', th1===TH_LIM[1]&&state.thp===TH_LIM[0], th1+'/'+state.thp);
/* ⑥ overProbe 只在 concl 且靠近 P 时为真 */
state.mode='concl'; state.rp=1.35; state.thp=55; draw();
const w1=pr(probeP());
T('overProbe 命中 P', overProbe({x:w1.x,y:w1.y})===true);
T('overProbe 远处为假', overProbe({x:w1.x+300,y:w1.y})===false);
const w2=pr(probeP()); state.mode='build'; draw();
T('overProbe 非 concl 恒假', overProbe({x:w2.x,y:w2.y})===false);
/* ⑦ DOM 轻检（全量扫查见 t1c） */
state.mode='concl'; renderPanel(); updateAll();
const pn=document.getElementById('panel'), st=document.getElementById('coordStrip');
T('扫查覆盖：panel chip 数', pn.querySelectorAll('.chip').length>6, pn.querySelectorAll('.chip').length);
T('panel 无 @{ 泄漏', pn.innerText.indexOf('@{')<0);
T('panel 无 undefined', pn.innerText.indexOf('undefined')<0);
T('读数条无 @{ 泄漏', st.innerText.indexOf('@{')<0, 'len='+st.innerText.length);
T('读数条非空', st.innerText.length>10, st.innerText.replace(/\n/g,' | ').slice(0,90));
return R.join('\n')+'\nDONE';
})();
