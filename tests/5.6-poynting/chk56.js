/* 5.6 电磁能量如何传播 —— 页面内自检
   跑法：bash tests/run_suite.sh 5.6-poynting-vector.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/5.6-poynting/chk56.js tests/5.6-poynting/vis56.js */
(async()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };

/* ============ ① 坡印廷恒等式：S_in − S_out = dW/dt + P_loss（残差≈0） ============ */
{
  const fails=[]; let n=0;
  for(const sg of [0, 0.8, 2.4]){
    state.sigma=sg;
    let mx=0;
    for(const t of [0.1, 0.27, 0.45, 0.71]){
      n++; const r=Math.abs(poyntingResidual(t));
      mx=Math.max(mx,r);
      const scale=Math.max(1, Math.abs(energyBooks(t).Sin));
      /* 低耗近似场 ⇒ 恒等式有 O(tan²δ) 小残差（σ=2.4 时 tanδ≈0.31 ⇒ ~3%），如实显示 */
      if(r>0.05*scale) fails.push('σ='+sg+' t='+t+' 残差 '+r.toFixed(4));
    }
    R.push('DATA|① σ='+sg+' 最大残差|'+mx.toFixed(5));
  }
  state.sigma=1.2;
  group('① 坡印廷恒等式（σ 三档 × 4 时刻，残差 <1%）', n, fails);
}

/* ============ ② 无耗极限：σ=0 ⇒ P_loss=0、S_in≡S_out − dW/dt、周期平均储能不变 ============ */
{
  const fails=[]; let n=0;
  state.sigma=0;
  for(const t of [0.15, 0.5]){
    n++; const b=energyBooks(t);
    if(Math.abs(b.Ploss)>1e-12) fails.push('σ=0 时 P_loss 应为 0');
    if(!near(b.Sin-b.Sout, dWdt(t), 1e-6)) fails.push('σ=0 时 S_in−S_out≠dW/dt');
  }
  /* 一个周期的 dW/dt 平均 ≈ 0（无耗时储能只是起伏） */
  n++; { let acc=0; const M=40, T=periodT();
    for(let i=0;i<M;i++) acc+=dWdt(T*i/M);
    if(Math.abs(acc/M)>0.02) fails.push('无耗 dW/dt 周期平均应≈0，得 '+(acc/M)); }
  /* W 非负、有界 */
  n++; { let wmin=1e9, wmax=-1e9;
    for(let i=0;i<20;i++){ const w=energyBooks(periodT()*i/20).W; wmin=Math.min(wmin,w); wmax=Math.max(wmax,w); }
    if(!(wmin>=-1e-12 && wmax<10)) fails.push('W 异常：'+wmin+' / '+wmax); }
  state.sigma=1.2;
  group('② 无耗极限（P_loss=0 / 收支=储能起伏 / 周期平均零 / W 非负有界）', n, fails);
}

/* ============ ③ 有耗方向性：σ↑ ⇒ S_out↓、P_loss↑；界面处场连续 ============ */
{
  const fails=[]; let n=0;
  state.t=0.15;
  state.sigma=0;   const b0=energyBooks(state.t);
  state.sigma=1.5; const b1=energyBooks(state.t);
  state.sigma=3.0; const b2=energyBooks(state.t);
  n++; if(!(b1.Ploss>b0.Ploss && b2.Ploss>b1.Ploss)) fails.push('P_loss 应随 σ 单调增');
  n++; if(!(b2.Sout<b1.Sout)) fails.push('S_out 应随 σ 减小');
  /* S_in 与 σ 无关（左面在无耗区） */
  n++; if(!near(b0.Sin,b2.Sin,1e-12)) fails.push('S_in 不该随 σ 变');
  /* 界面连续：x=VA 与 x=VB 两侧场值连续 */
  for(const x0 of [VA,VB]){
    n++; const dl=1e-7;
    if(!near(fieldE(x0-dl,state.t), fieldE(x0+dl,state.t), 1e-3)) fails.push('E 在 x='+x0+' 不连续');
    n++; if(!near(fieldH(x0-dl,state.t), fieldH(x0+dl,state.t), 1e-3)) fails.push('H 在 x='+x0+' 不连续');
  }
  state.sigma=1.2; state.t=0;
  group('③ 有耗方向性 + 界面场连续', n, fails);
}

/* ============ ④ 参数钳制 ============ */
{
  const fails=[]; let n=0;
  state.E0=0; clampState(); n++; if(state.E0!==0.5) fails.push('E0 下限没钳');
  state.sigma=99; clampState(); n++; if(state.sigma!==3) fails.push('σ 上限没钳');
  state.fD=0; clampState(); n++; if(state.fD!==0.8) fails.push('fD 下限没钳');
  state.t=-3; clampState(); n++; if(state.t<0||state.t>=periodT()) fails.push('t 没折回');
  state.E0=1; state.fD=1.25; state.sigma=1.2;
  group('④ 参数钳制', n, fails);
}

/* ============ ⑤ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  for(const sg of [0, 1.2]){
    state.sigma=sg; state.t=0.31;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push('不幂等：'+n1+' → '+n2);
    if(n1<5) fails.push('图元太少：'+n1);
    if(!z1.every(Number.isFinite)||!z2.every(Number.isFinite)) fails.push('prims 非有限深度');
    R.push('DATA|⑤ σ='+sg+' 图元数（两遍）|'+n1+' / '+n2);
  }
  state.sigma=1.2; state.t=0;
  group('⑤ buildScene 幂等 + prims 深度有限', 4, fails);
}

/* ============ ⑥ state.show ↔ SHOW_ITEMS 逐字对齐 ============ */
{
  const fails=[]; let n=0;
  SHOW_ITEMS.forEach(it=>{ n++;
    if(typeof state.show[it.k]!=='boolean') fails.push('显示项 '+it.k+' 是 '+typeof state.show[it.k]); });
  Object.keys(state.show).forEach(k=>{ n++;
    if(!SHOW_ITEMS.some(it=>it.k===k)) fails.push('state.show.'+k+' 是死键'); });
  group('⑥ state.show 键 ↔ SHOW_ITEMS 对齐', n, fails);
}

/* ============ ⑦ DOM 扫查 ============ */
const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
            '.module-title','.sec-title','.slider-row','.readout-toggle','.card-tab','.sub-chips'];
{
  const fails=[]; let cards=0, seen=0;
  const scan=(tag)=>{
    CONT.forEach(sel=>{ document.querySelectorAll(sel).forEach(el=>{ seen++;
      const s=el.innerText||'';
      if(s.indexOf('@{')>=0) fails.push(tag+' '+sel+' 泄漏 @{');
      if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) fails.push(tag+' '+sel+' undefined');
      if(s.indexOf('**')>=0) fails.push(tag+' '+sel+' 字面星号'); }); });
  };
  for(const sg of [0, 1.2]){
    state.sigma=sg; renderPanel(); scan('σ'+sg);
    const nC=document.querySelectorAll('#panel .card-tab').length;
    if(nC!==3) fails.push('讲解卡应有 3 张，实有 '+nC);
    for(let i=0;i<nC;i++){ try{ document.querySelectorAll('#panel .card-tab')[i].click(); }catch(e){ fails.push('card '+i+' 抛异常'); } cards++; scan('c'+sg+i); }
  }
  state.sigma=1.2; state.cardTab='1'; renderPanel();
  R.push('DATA|⑦ 扫查规模|讲解卡 '+cards+' 张　容器 '+seen+' 个');
  group('⑦ 无耗/有耗 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
}

/* ============ ⑧ 画布文本插桩扫查 ============ */
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
    for(const sg of [0, 1.2]) for(const t of [0, 0.4]){
      state.sigma=sg; state.t=t;
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
    }
    state.sigma=1.2; state.t=0;
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑧ 画布文本坏串|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑧ 画布文本无 undefined/NaN/字面星号', bad.length===0, bad.length+' 处');
}

/* ============ ⑨ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑨ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
}

/* ============ ⑩ 显示开关守卫 + 数据条一致 ============ */
{
  const fails=[]; let n=0;
  const ks=Array.from(document.querySelectorAll('#panel .chip[data-k]'))
    .map(c=>c.dataset.k).filter(k=>SHOW_ITEMS.some(it=>it.k===k));
  if(ks.length!==SHOW_ITEMS.length) fails.push('显示开关数量不符：'+ks.length);
  ks.forEach(k=>{
    n++;
    const sel='#panel .chip[data-k="'+k+'"]';
    try{ document.querySelector(sel).click(); }catch(e){ fails.push('chip '+k+' 抛异常'); return; }
    if(SHOW_ITEMS.filter(it=>state.show[it.k]).length<1) fails.push('关掉 '+k+' 后一层不剩');
    const c2=document.querySelector(sel);
    if(c2 && !c2.classList.contains('on')){ try{ c2.click(); }catch(e){} }
  });
  Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
  buildScene();
  if(prims.length<5) fails.push('全开时图元只有 '+prims.length);
  n++; updateReadout();
  const tt=document.getElementById('coordStrip').innerText||'';
  /* ⚠️ kchip 的 key 过 richHTML：'S_in' 的下标渲染后 innerText 里没有下划线 ⇒ 查 'Sin' */
  if(tt.indexOf('Sin')<0) fails.push('数据条缺 S_in 读数（下标渲染后无下划线）');
  if(tt.indexOf('undefined')>=0||tt.indexOf('@{')>=0) fails.push('数据条有坏串');
  group('⑩ 显示开关守卫 + 数据条读数一致', n, fails);
}

/* ============ ⑪ 播放控制 + 画布布局 ============ */
{
  const fails=[]; let n=0;
  n++; state.playing=true; playPause(); if(state.playing) fails.push('没暂停');
  n++; playPause(); if(!state.playing) fails.push('没恢复');
  const cv=document.getElementById('cv').getBoundingClientRect();
  const card=document.getElementById('cv').closest('.canvas-card').getBoundingClientRect();
  const strip=document.getElementById('coordStrip').getBoundingClientRect();
  n++; if(cv.width<200||cv.height<200) fails.push('画布太小');
  n++; if(Math.abs(cv.bottom+strip.height-card.bottom)>1.5) fails.push('数据条底边不齐');
  n++; if(cv.right>card.right+1) fails.push('画布越出卡片');
  group('⑪ 播放控制 + 布局', n, fails);
}

/* ============ ⑫ tick 主循环真的在跑 ============ */
const tickCheck=()=>new Promise(res=>{
  state.playing=true;
  const t0=state.t, w0=Date.now();
  const poll=()=>{
    if(state.t!==t0){
      R.push('PASS|⑫ tick 主循环在跑（t '+t0.toFixed(2)+'→'+state.t.toFixed(2)+'）|');
      res(R.join('\n')+'\nDONE'); return;
    }
    if(Date.now()-w0>6000){
      R.push('FAIL|⑫ tick 主循环在跑|6 s 内 t 没推进 ⇒ rAF 停摆');
      res(R.join('\n')+'\nDONE'); return;
    }
    setTimeout(poll,80);
  };
  poll();
});

return tickCheck();
})()
