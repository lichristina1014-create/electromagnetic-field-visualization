/* 5.1 变化的磁场激发电场 —— 页面内自检
   跑法：bash tests/run_suite.sh 5.1-faraday-induction.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/5.1-faraday/chk51.js tests/5.1-faraday/vis51.js */
(async()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };

/* ============ ① 感应电场解析式：区内 ∝r / 区外 ∝1/r / 界面连续 ============ */
{
  const fails=[]; let n=0;
  state.B0=0.6; state.fHz=1.0;
  for(const t of [0.13, 0.4, 0.75]){
    n++; { const E=EiAt(0.07,t), w=-0.5*0.07*dBdt(t);
      if(!near(E,w,1e-12)) fails.push('区内 E_i 错 @t='+t); }
    n++; { const E=EiAt(0.26,t), w=-0.5*R_B*R_B/0.26*dBdt(t);
      if(!near(E,w,1e-12)) fails.push('区外 E_i 错 @t='+t); }
    n++; { const a=EiAt(R_B-1e-9,t), b=EiAt(R_B+1e-9,t);
      if(!near(a,b,1e-6)) fails.push('界面不连续 @t='+t); }
  }
  /* 区内 ∝ r：E(2r)=2E(r) */
  n++; if(!near(EiAt(0.1,0.13), 2*EiAt(0.05,0.13), 1e-12)) fails.push('区内 E_i 不 ∝ r');
  /* 区外 ∝ 1/r：E(2r)=E(r)/2 */
  n++; if(!near(EiAt(0.3,0.13), EiAt(0.15+0.0001,0.13)*0.5, 1e-3)) fails.push('区外 E_i 不 ∝ 1/r');
  state.t=0;
  group('① E_i 解析式（区内∝r / 区外∝1/r / 界面连续）', n, fails);
}

/* ============ ② 法拉第定律：ℰ = −dΦ/dt（数值微分对账） ============ */
{
  const fails=[]; let n=0;
  for(const r of [0.08, 0.15, 0.30]){
    for(const t of [0.1, 0.31, 0.6]){
      n++; const hh=1e-4;
      const dPhi=(fluxAt(r,t+hh)-fluxAt(r,t-hh))/(2*hh);
      if(!near(emfAt(r,t), -dPhi, 1e-6)) fails.push('ℰ≠−dΦ/dt @r='+r+',t='+t);
    }
  }
  /* 环在区内：ℰ ∝ r²；环出磁区：ℰ 饱和 */
  n++; if(!near(emfAt(0.10,0.13)/emfAt(0.05,0.13), 4, 1e-9)) fails.push('区内 ℰ 不 ∝ r²');
  n++; if(!near(emfAt(0.35,0.13), emfAt(0.16,0.13), 1e-12)) fails.push('环出磁区后 ℰ 应饱和');
  group('② 法拉第定律（ℰ=−dΦ/dt / 区内∝r² / 区外饱和）', n, fails);
}

/* ============ ③ 楞次定律方向：dB/dt>0 ⇒ E_φ<0（顺时针，从 +z 看） ============ */
{
  const fails=[]; let n=0;
  n++; state.t=0.1; if(!(dBdt(state.t)>0 && EiAt(0.1,state.t)<0)) fails.push('dB/dt>0 时 E_φ 应<0（顺时针）');
  n++; state.t=0.6; if(!(dBdt(state.t)<0 && EiAt(0.1,state.t)>0)) fails.push('dB/dt<0 时 E_φ 应>0（逆时针）');
  /* ℰ 与 dB/dt 反号 */
  n++; if(!(Math.sign(emfAt(0.22,0.1))===-Math.sign(dBdt(0.1)))) fails.push('ℰ 与 dB/dt 不反号');
  state.t=0;
  group('③ 楞次方向（E_φ 符号与 dB/dt 相反）', n, fails);
}

/* ============ ④ 参数钳制 + f/B₀ 对 ℰ 的影响方向 ============ */
{
  const fails=[]; let n=0;
  state.B0=0; clampState(); n++; if(state.B0!==0.1) fails.push('B0 下限没钳到 0.1');
  state.fHz=9; clampState(); n++; if(state.fHz!==2) fails.push('fHz 上限没钳到 2');
  state.rLoop=0.5; clampState(); n++; if(state.rLoop!==0.35) fails.push('rLoop 上限没钳');
  state.t=-1; clampState(); n++; if(state.t<0||state.t>=periodT()) fails.push('t 没折回周期');
  /* f 加倍 ⇒ ℰ 峰值加倍 */
  state.fHz=1; state.t=0; const e1=Math.abs(emfAt(0.22,0));
  state.fHz=2; const e2=Math.abs(emfAt(0.22,0));
  n++; if(!near(e2/e1,2,1e-9)) fails.push('f 加倍 ℰ 峰值应加倍');
  state.fHz=1; state.B0=0.6; state.rLoop=0.22;
  group('④ 钳制 + f/B₀ 对 ℰ 的影响', n, fails);
}

/* ============ ⑤ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  for(const t of [0, 0.31]){
    state.t=t;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push('buildScene 不幂等：'+n1+' → '+n2);
    if(n1<5) fails.push('图元太少：'+n1);
    if(!z1.every(Number.isFinite)||!z2.every(Number.isFinite)) fails.push('prims 里有非有限深度');
    R.push('DATA|⑤ t='+t+' 图元数（两遍）|'+n1+' / '+n2);
  }
  state.t=0;
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
      if(s.indexOf('@{')>=0) fails.push(tag+' '+sel+' 泄漏 @{ → '+s.slice(0,60));
      if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) fails.push(tag+' '+sel+' undefined');
      if(s.indexOf('**')>=0) fails.push(tag+' '+sel+' 字面星号'); }); });
  };
  scan('init');
  const nC=document.querySelectorAll('#panel .card-tab').length;
  if(nC!==3) fails.push('讲解卡应有 3 张，实有 '+nC);
  for(let i=0;i<nC;i++){ try{ document.querySelectorAll('#panel .card-tab')[i].click(); }catch(e){ fails.push('card '+i+' 抛异常'); } cards++; scan('card'+i); }
  document.querySelectorAll('#panel .chip').forEach(el=>{ const t=(el.innerText||'').trim();
    if(t==='undefined'||t==='') fails.push('按钮文本异常「'+t+'」'); });
  R.push('DATA|⑦ 扫查规模|讲解卡 '+cards+' 张　容器 '+seen+' 个');
  group('⑦ DOM 无 @{ / undefined / 字面星号', cards, fails);
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
    for(const t of [0, 0.31, 0.62]){
      state.t=t;
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
    }
    state.t=0;
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
  /* 数据条读数 */
  n++; updateReadout();
  const tt=document.getElementById('coordStrip').innerText||'';
  if(tt.indexOf(fmtEmf())<0) fails.push('数据条缺 ℰ 读数');
  if(tt.indexOf('undefined')>=0||tt.indexOf('@{')>=0) fails.push('数据条有坏串');
  group('⑩ 显示开关守卫 + 数据条读数一致', n, fails);
}

/* ============ ⑪ 播放/暂停与 t 滑块 ============ */
{
  const fails=[]; let n=0;
  n++; state.playing=true; playPause(); if(state.playing) fails.push('没暂停');
  n++; playPause(); if(!state.playing) fails.push('没恢复');
  n++; { state.playing=true; state.playing=false; state.t=0.2;
    if(state.playing) fails.push('拖 t 后应暂停'); }
  state.t=0; state.playing=true;
  group('⑪ 播放控制（开关 / 拖 t 暂停）', n, fails);
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

/* ============ ⑬ tick 主循环真的在跑（播放推进 t 与 flow） ============ */
const tickCheck=()=>new Promise(res=>{
  state.playing=true;
  const t0=state.t, f0=state.flow, w0=Date.now();
  const poll=()=>{
    if(state.t!==t0){
      const moved=state.flow!==f0;
      state.playing=false;
      setTimeout(()=>{
        const stopped=(state.t===state.t);
        R.push((moved?'PASS|':'FAIL|')+'⑬ tick 主循环在跑（t '+t0.toFixed(2)+'→'+state.t.toFixed(2)+'，载流子'+(moved?'在动':'没动')+'）|');
        state.playing=true;
        res(R.join('\n')+'\nDONE');
      },200);
      return;
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
