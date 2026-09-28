(async()=>{
/* t1b：结构层冒烟 + 「② 探针页签删干净」的回归闸门（2026-09-28）
   ── 背景：用户反馈 ②「静电平衡的四个结论」与 ① 的「静电平衡的建立」重复，
      要求**整页删掉**。删一个页签极易"删一半"（控件没了但状态字段还在、
      或者反过来），所以这里分三层验：① 页签真没了 ② ② 独占的代码真清了 ③ 概念没丢。 */
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const P=(n,v)=>R.push('INFO|'+n+'|'+v);
canvas.setPointerCapture=()=>{}; canvas.releasePointerCapture=()=>{};

/* ── ① 幂等 + 深度无 NaN（两个页签） ───────────────────────────── */
for(const md of ['build','shield']){
  state.mode=md;
  prims=[]; buildScene(); const n1=prims.length;
  prims=[]; buildScene(); const n2=prims.length;
  T('幂等 '+md, n1===n2&&n1>0, n1+'/'+n2);
  const nan=prims.filter(p=>p.z==null||Number.isNaN(p.z)).length;
  T('z 无 NaN '+md, nan===0, 'nan='+nan+'/'+n1);
}
/* ── ② draw() 连画 3 次不增长（重绘叠加类 bug 的幂等探针） ─────────── */
state.mode='build'; let d1=0,d3=0;
try{ draw(); d1=prims.length; draw(); draw(); d3=prims.length; }catch(e){ d3=-1; }
T('draw 连画不增长', d1===d3&&d1>0, d1+'/'+d3);

/* ── ③ 「② 静电平衡的四个结论」页签已删：结构层 ─────────────────── */
const tabs=Array.from(document.querySelectorAll('#modeTabs button'));
const ks=tabs.map(b=>b.dataset.k);
T('页签只剩 2 个', tabs.length===2, 'n='+tabs.length);
T('页签 = [build, shield]（② concl 已删）', ks.join(',')==='build,shield', ks.join(','));
T('页签文案里没有「四个结论」', !/四个结论/.test(tabs.map(b=>b.textContent).join('|')),
  tabs.map(b=>b.textContent).join(' | '));
T('MT 常量只有 2 项且不含 concl',
  Array.isArray(MT)&&MT.length===2&&MT.every(m=>m.k!=='concl'), JSON.stringify(MT));
T('#probeNote 这个结论条节点已不存在', document.getElementById('probeNote')===null);
T('面板里没有「把 P 送到关键位置」这一节',
  !/把 P 送到关键位置/.test(document.getElementById('panel').innerText));
/* 点一遍两个页签：不能抛错，且 mode 只可能是那两种 */
let bad=0;
for(const k of ks){
  try{ const b=tabs.find(x=>x.dataset.k===k); b.click(); renderPanel();
    if(state.mode!==k) bad++; }catch(e){ bad++; }
}
T('两个页签都能切换且 renderPanel 不抛错', bad===0, 'bad='+bad);

/* ── ④ ② 独占的代码真的清了（裸 typeof：对不存在的标识符返回 undefined 而不抛错） ── */
const gone=n=>{ try{ return eval('typeof '+n)==='undefined'; }catch(e){ return 'ERR'; } };
const G1=['sceneConcl','drawEqui','drawProbe','chartVz','equiCurve','equiR',
          'probeInfo','probeNote','zoneWord','probeJac','overProbe','snapRp','clampRp','clampThp',
          'probeP','fieldAt','evec','RP_RANGE','TH_LIM','SWEEP_SPEED','P_HIT'];
T('② 独占的 21 个符号全部消失', G1.every(gone),
  G1.filter(n=>!gone(n)).join(',')||'全部 gone');
const K=['volt','fieldE','fieldT','eLen','sigma','drawInner','drawSurfaceCharge','facePH','faceCurves'];
T('该留的解析解本体一个都没少（'+K.join('/')+'）', K.every(n=>!gone(n)),
  K.filter(gone).join(',')||'全部在');
T('state 里 rp / thp / sweep 三个字段已删',
  !('rp' in state)&&!('thp' in state)&&!('sweep' in state),
  Object.keys(state).join(','));
T('state.show 里 equi / dec / vz 三个开关已删',
  !('equi' in state.show)&&!('dec' in state.show)&&!('vz' in state.show),
  Object.keys(state.show).join(','));
T('mode 只允许 build / shield', state.mode==='build'||state.mode==='shield', state.mode);
P('state 键', Object.keys(state).join(','));
P('show 键', Object.keys(state.show).join(','));

/* ── ⑤ 概念没丢：那"四个结论"仍然在 ① 里讲得出来 ─────────────────── */
T('① 的阶段④文案仍点出「等位体」', /等位体/.test(STAGE_NOTES[3]), STAGE_NOTES[3]);
T('stageOf() 仍能走到第 4 阶段（④ 静电平衡）',
  STAGE_NAMES.length===4 && (function(){ const g0=state.g,t0=state.t;
    state.g=1; state.t=1; const k=stageOf(); state.g=g0; state.t=t0; return k===3; })());
T('解析解仍给出 V(a,θ) ≡ 0（"等位体"的数学本体）',
  volt(A_C,0,state.E0)===0 && volt(A_C,1.2345,state.E0)===0 && volt(A_C,Math.PI*0.999,state.E0)===0);
/* ⚠️ 赤道不能写 `sigma(π/2,…)===0`：Math.cos(π/2)=6.1e-17 ≠ 0 ⇒ σ 是个 ~1.6e-14 的数
   （读数条上显示的 0.0 nC/m² 是**格式化**的结果，不是数值上的恒等）⇒ 必须给容差。 */
T('解析解仍给出表面 σ(θ) = 3ε₀E₀cosθ（赤道 → 0）',
  Math.abs(sigma(0,10,null)-SIG_K*10)<1e-12 && Math.abs(sigma(Math.PI/2,10,null))<1e-9,
  'σ(0°)='+sigma(0,10,null).toFixed(3)+' nC/m²　σ(90°)='+sigma(Math.PI/2,10,null).toExponential(1));

/* ── ⑥ DOM 轻检（全量扫查见 t1c） ───────────────────────────────── */
state.mode='build'; renderPanel(); updateAll();
const pn=document.getElementById('panel'), st=document.getElementById('coordStrip');
T('扫查覆盖：panel chip 数', pn.querySelectorAll('.chip').length>6, pn.querySelectorAll('.chip').length);
T('panel 无 @{ 泄漏', pn.innerText.indexOf('@{')<0);
T('panel 无 undefined', pn.innerText.indexOf('undefined')<0);
T('panel 无字面 **（richHTML 不认它）', pn.innerText.indexOf('**')<0);
T('读数条无 @{ 泄漏', st.innerText.indexOf('@{')<0, 'len='+st.innerText.length);
T('读数条非空', st.innerText.length>10, st.innerText.replace(/\n/g,' | ').slice(0,90));
state.mode='shield'; renderPanel(); updateAll();
T('③ 面板无 @{ / undefined / 字面 **',
  pn.innerText.indexOf('@{')<0 && pn.innerText.indexOf('undefined')<0 && pn.innerText.indexOf('**')<0);
T('③ 读数条报内外表面电荷', /内表面总电荷/.test(st.innerText)&&/外表面总电荷/.test(st.innerText),
  st.innerText.replace(/\n/g,' | ').slice(0,110));
state.mode='build'; renderPanel(); updateAll();
return R.join('\n')+'\nDONE';
})();
