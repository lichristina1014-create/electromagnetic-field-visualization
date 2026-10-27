/* 5.2 变化的电场激发磁场 —— 页面内自检
   跑法：bash tests/run_suite.sh 5.2-displacement-current.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/5.2-displacement/chk52.js tests/5.2-displacement/vis52.js */
(async()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };

/* ============ ① 全电流自洽：I_c ≡ I_d（逐时刻严格相等） ============ */
{
  const fails=[]; let n=0;
  for(const E0 of [50,100,200]) for(const f of [0.2,0.8,2]){
    state.E0=E0; state.fHz=f;
    for(const t of [0, 0.31, 0.7]){
      n++; state.t=t;
      if(!near(conductionI(t), displaceI(t), 1e-15)) fails.push('I_c≠I_d');
    }
  }
  /* I_c = dQ/dt（数值微分对账） */
  state.E0=100; state.fHz=0.8;
  for(const t of [0.1, 0.5]){
    n++; const hh=1e-4;
    const dQ=(qPlate(t+hh)-qPlate(t-hh))/(2*hh);
    if(!near(conductionI(t), dQ, 1e-6)) fails.push('I_c≠dQ/dt @t='+t);
  }
  /* J_d = ε₀·dE/dt */
  n++; { const t=0.2;
    if(!near(jdAt(t), EPS0*dEdt(t), 1e-15)) fails.push('J_d≠ε₀·dE/dt'); }
  state.t=0;
  group('① 全电流自洽（I_c≡I_d / I_c=dQ/dt / J_d=ε₀∂E/∂t）', n, fails);
}

/* ============ ② 环上磁场：B = μ₀I/(2πr)，两个环同一个 B ============ */
{
  const fails=[]; let n=0;
  state.E0=100; state.fHz=0.8;
  for(const r of [0.06, 0.12, 0.20]) for(const t of [0.1, 0.55]){
    n++; state.rLoop=r; state.t=t;
    if(!near(bLoop(r,t), MU0*conductionI(t)/(2*Math.PI*r), 1e-15)) fails.push('B 公式错');
  }
  /* B ∝ 1/r */
  n++; if(!near(bLoop(0.20,0.1), bLoop(0.10,0.1)/2, 1e-12)) fails.push('B 不 ∝ 1/r');
  /* B 的方向：I>0 时 bDir 与右手定则一致（θ=0 处 B 沿 +z） */
  n++; { state.t=0.1; const sgn=Math.sign(conductionI(state.t));
    const d=bDir(0,sgn);
    if(!(sgn>0 ? d.z>0 : d.z<0)) fails.push('B 方向与右手定则相反'); }
  state.rLoop=0.12; state.t=0;
  group('② 环上磁场（B=μ₀I/2πr / ∝1/r / 右手定则）', n, fails);
}

/* ============ ③ 参数钳制 + 影响方向 ============ */
{
  const fails=[]; let n=0;
  state.E0=10; clampState(); n++; if(state.E0!==50) fails.push('E0 下限没钳');
  state.rLoop=0.5; clampState(); n++; if(state.rLoop!==0.20) fails.push('rLoop 上限没钳');
  state.fHz=0; clampState(); n++; if(state.fHz!==0.2) fails.push('fHz 下限没钳');
  state.t=-2; clampState(); n++; if(state.t<0||state.t>=periodT()) fails.push('t 没折回');
  /* E₀ 加倍 ⇒ I 峰值加倍；f 加倍 ⇒ I 峰值加倍 */
  state.E0=100; state.fHz=0.8; state.t=0; const i1=conductionI(0);
  state.E0=200; const i2=conductionI(0);
  n++; if(!near(i2/i1,2,1e-9)) fails.push('E₀ 加倍 I 没加倍');
  state.E0=100; state.fHz=1.6; const i3=conductionI(0);
  n++; if(!near(i3/i1,2,1e-9)) fails.push('f 加倍 I 没加倍');
  state.fHz=0.8; state.t=0;
  group('③ 钳制 + E₀/f 对 I 的影响', n, fails);
}

/* ============ ④ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  for(const surf of ['S1','S2']){
    state.surf=surf; state.t=0.31;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push(surf+' buildScene 不幂等：'+n1+' → '+n2);
    if(n1<5) fails.push(surf+' 图元太少：'+n1);
    if(!z1.every(Number.isFinite)||!z2.every(Number.isFinite)) fails.push(surf+' prims 非有限深度');
    R.push('DATA|④ '+surf+' 图元数（两遍）|'+n1+' / '+n2);
  }
  state.surf='S1'; state.t=0;
  group('④ buildScene 幂等 + prims 深度有限（S1/S2 × 2 遍）', 4, fails);
}

/* ============ ⑤ state.show ↔ SHOW_ITEMS 逐字对齐 ============ */
{
  const fails=[]; let n=0;
  SHOW_ITEMS.forEach(it=>{ n++;
    if(typeof state.show[it.k]!=='boolean') fails.push('显示项 '+it.k+' 是 '+typeof state.show[it.k]); });
  Object.keys(state.show).forEach(k=>{ n++;
    if(!SHOW_ITEMS.some(it=>it.k===k)) fails.push('state.show.'+k+' 是死键'); });
  group('⑤ state.show 键 ↔ SHOW_ITEMS 对齐', n, fails);
}

/* ============ ⑥ DOM 扫查 ============ */
const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
            '.module-title','.sec-title','.slider-row','.readout-toggle','.card-tab','.sub-chips'];
{
  const fails=[]; let cards=0, seen=0;
  const scan=(tag)=>{
    CONT.forEach(sel=>{ document.querySelectorAll(sel).forEach(el=>{ seen++;
      const s=el.innerText||'';
      if(s.indexOf('@{')>=0) fails.push(tag+' '+sel+' 泄漏 @{ → '+s.slice(0,60));
      if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) fails.push(tag+' '+sel+' undefined');
      if(s.indexOf('**')>=0) fails.push(tag+' '+sel+' 字面星号'); }); });
  };
  for(const surf of ['S1','S2']){
    state.surf=surf; renderPanel(); scan('surf:'+surf);
    const nC=document.querySelectorAll('#panel .card-tab').length;
    if(nC!==3) fails.push('讲解卡应有 3 张，实有 '+nC);
    for(let i=0;i<nC;i++){ try{ document.querySelectorAll('#panel .card-tab')[i].click(); }catch(e){ fails.push('card '+i+' 抛异常'); } cards++; scan('card'+surf+i); }
  }
  state.surf='S1'; state.cardTab='1'; renderPanel();
  R.push('DATA|⑥ 扫查规模|讲解卡 '+cards+' 张　容器 '+seen+' 个');
  group('⑥ 两种曲面 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
}

/* ============ ⑦ 画布文本插桩扫查 ============ */
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
    for(const surf of ['S1','S2']) for(const t of [0, 0.31, 0.62]){
      state.surf=surf; state.t=t;
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
    }
    state.surf='S1'; state.t=0;
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑦ 画布文本坏串|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑦ 画布文本无 undefined/NaN/字面星号', bad.length===0, bad.length+' 处');
}

/* ============ ⑧ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑧ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
}

/* ============ ⑨ 显示开关守卫 + 数据条一致 ============ */
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
  if(tt.indexOf('nA')<0) fails.push('数据条缺电流读数');
  if(tt.indexOf('undefined')>=0||tt.indexOf('@{')>=0) fails.push('数据条有坏串');
  group('⑨ 显示开关守卫 + 数据条读数一致', n, fails);
}

/* ============ ⑩ 曲面切换真的换曲面 ============ */
{
  const fails=[]; let n=0;
  const btns=Array.from(document.querySelectorAll('#sliderSec .chip'));
  const b1=btns.find(b=>b.textContent.indexOf('平盘')>=0), b2=btns.find(b=>b.textContent.indexOf('鼓起')>=0);
  n++; if(!b1||!b2){ fails.push('找不到曲面切换按钮'); }
  else{
    b2.click(); if(state.surf!=='S2') fails.push('点 S_2 后 state.surf='+state.surf);
    n++; buildScene();
    if(prims.length<10) fails.push('S_2 鼓膜图元太少');
    b1.click(); n++; if(state.surf!=='S1') fails.push('点 S_1 后没换回');
  }
  group('⑩ 曲面 S_1/S_2 切换', n, fails);
}

/* ============ ⑪ 播放/暂停与 t 滑块 ============ */
{
  const fails=[]; let n=0;
  n++; state.playing=true; playPause(); if(state.playing) fails.push('没暂停');
  n++; playPause(); if(!state.playing) fails.push('没恢复');
  n++; { state.playing=false; state.t=0.2; if(state.playing) fails.push('拖 t 后应暂停'); }
  state.t=0; state.playing=true;
  group('⑪ 播放控制', n, fails);
}

/* ============ ⑫ 画布与数据条布局 ============ */
{
  const fails=[]; let n=0;
  const cv=document.getElementById('cv').getBoundingClientRect();
  const card=document.getElementById('cv').closest('.canvas-card').getBoundingClientRect();
  const strip=document.getElementById('coordStrip').getBoundingClientRect();
  n++; if(cv.width<200||cv.height<200) fails.push('画布太小');
  n++; if(Math.abs(cv.bottom+strip.height-card.bottom)>1.5) fails.push('数据条底边不齐');
  n++; if(strip.height<1) fails.push('数据条高 0');
  n++; if(cv.right>card.right+1) fails.push('画布越出卡片');
  group('⑫ 画布未被裁、数据条在卡片内', n, fails);
}

/* ============ ⑬ tick 主循环真的在跑 ============ */
const tickCheck=()=>new Promise(res=>{
  state.playing=true;
  const t0=state.t, w0=Date.now();
  const poll=()=>{
    if(state.t!==t0){
      R.push('PASS|⑬ tick 主循环在跑（t '+t0.toFixed(2)+'→'+state.t.toFixed(2)+'）|');
      state.playing=true;
      res(R.join('\n')+'\nDONE'); return;
    }
    if(Date.now()-w0>6000){
      R.push('FAIL|⑬ tick 主循环在跑|6 s 内 t 没推进 ⇒ rAF 停摆');
      res(R.join('\n')+'\nDONE'); return;
    }
    setTimeout(poll,80);
  };
  poll();
});

return tickCheck();
})()
