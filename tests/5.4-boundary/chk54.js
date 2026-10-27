/* 5.4 电磁场遇到介质边界会怎样 —— 页面内自检
   跑法：bash tests/run_suite.sh 5.4-media-boundary.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/5.4-boundary/chk54.js tests/5.4-boundary/vis54.js */
(async()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };
function clickTab(k){ const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k===k); if(b) b.click(); return !!b; }

/* ============ ① 衔接条件：E_t 连续 + D_n 跳 σ_s + ∮=0 恒成立 ============ */
{
  const fails=[]; let n=0;
  for(const e1 of [1,4]) for(const e2 of [1,9]) for(const sg of [0,0.6,1.5]) for(const th of [10,45,75]){
    n++; state.epsr1=e1; state.epsr2=e2; state.sigmaS=sg; state.th1=th;
    const {E1,E2}=bcFields();
    if(!near(E1.t,E2.t,1e-15)) fails.push('E_t 不连续');
    if(!near(e2*E2.n-e1*E1.n, sg, 1e-12)) fails.push('D_n 跳变 ≠ σ_s');
    if(Math.abs(loopCirc())>1e-15) fails.push('∮E·dl ≠ 0');
  }
  state.epsr1=1; state.epsr2=4; state.sigmaS=0.6; state.th1=35;
  group('① 衔接条件（E_t 连续 / D_n 跳 σ_s / ∮=0，3×2×3×3 参数网）', n, fails);
}

/* ============ ② 斯涅尔定律 + 菲涅尔系数 + 能量守恒 ============ */
{
  const fails=[]; let n=0;
  for(const e1 of [1,4]) for(const e2 of [1,9]) for(const pol of ['perp','para']){
    for(const th of [10,30,50]){
      n++; state.epsr1=e1; state.epsr2=e2; state.pol=pol; state.thI=th;
      const F=fresnel(th), sT=snellT(th);
      if(sT!==null){
        /* 斯涅尔：n₁sinθ_i = n₂sinθ_t */
        if(!near(nmed(1)*Math.sin(th*Math.PI/180), nmed(2)*Math.sin(sT*Math.PI/180), 1e-12))
          fails.push('斯涅尔不成立 @'+e1+'/'+e2+'/'+th);
        /* 能量守恒 R+T_能=1 */
        if(!near(F.R+F.Te, 1, 1e-9)) fails.push('R+T_能≠1 @'+e1+'/'+e2+'/'+pol+'/'+th+'：'+(F.R+F.Te));
        /* 正入射极限：θ→0 时 Γ⊥=(η₂−η₁)/(η₂+η₁) */
      }
    }
  }
  /* 正入射极限（θ_i=5° 接近 0） */
  n++; state.epsr1=1; state.epsr2=4; state.pol='perp'; state.thI=5;
  { const F=fresnel(5), w=(0.5-1)/(0.5+1);   /* η₂=1/n₂=0.5, η₁=1 */
    if(!near(F.G, w, 2e-2)) fails.push('近正入射 Γ 不趋 (η₂−η₁)/(η₂+η₁)：'+F.G+' vs '+w); }
  group('② 斯涅尔 + 菲涅尔 + 能量守恒（含正入射极限）', n, fails);
}

/* ============ ③ 全反射：n₁>n₂ 且 θ_i>θ_c ⇒ 无透射、|Γ|=1 ============ */
{
  const fails=[]; let n=0;
  state.epsr1=9; state.epsr2=1;
  const thC=criticalDeg();
  n++; if(!near(thC, 19.471, 0.01)) fails.push('θ_c 应为 asin(1/3)=19.47°，得 '+thC);
  n++; { state.thI=thC-3; const F=fresnel(state.thI);
    if(F.tir||F.thT===null) fails.push('θ<θ_c 不该全反射'); }
  n++; { state.thI=thC+10; const F=fresnel(state.thI);
    if(!F.tir||F.thT!==null) fails.push('θ>θ_c 应全反射');
    if(!near(Math.abs(F.G),1,1e-12)||F.R!==1) fails.push('全反射 |Γ| 应=1'); }
  /* n₁<n₂ 时无临界角 */
  n++; state.epsr1=1; state.epsr2=9;
  if(criticalDeg()!==null) fails.push('n₁<n₂ 不该有临界角');
  /* n₁>n₂ 但 θ_i<θ_c 时能量守恒仍成立 */
  n++; state.epsr1=9; state.epsr2=1; state.thI=10;
  { const F=fresnel(10); if(!near(F.R+F.Te,1,1e-9)) fails.push('非全反射时 R+T_能≠1'); }
  state.epsr1=1; state.epsr2=4; state.thI=35;
  group('③ 全反射（临界角 / θ 两侧行为 / |Γ|=1）', n, fails);
}

/* ============ ④ 页签切换：preset 装载 + 相机复位 ============ */
{
  const fails=[]; let n=0;
  state.mode='bc'; state.th1=77; state.epsr1=9; cam.az=1.9; cam.px=80; state.cardTab='3';
  clickTab('rt'); n++;
  if(Math.abs(state.thI-PRESET.rt.thI)>1e-12) fails.push('切到 ② 后 θ_i 应装预设');
  if(state.cardTab!=='1') fails.push('cardTab 应复位为 1');
  if(Math.abs(cam.az-CAM0.az)>1e-12||cam.px!==0) fails.push('相机未复位');
  clickTab('bc'); n++;
  if(Math.abs(state.th1-PRESET.bc.th1)>1e-12) fails.push('切回 ① 后 θ₁ 应装预设');
  group('④ 页签切换：preset / cardTab / 相机复位', n, fails);
}

/* ============ ⑤ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  ['bc','rt'].forEach(m=>{
    state.mode=m;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push(m+' buildScene 不幂等：'+n1+' → '+n2);
    if(n1<4) fails.push(m+' 图元太少：'+n1);
    if(!z1.every(Number.isFinite)||!z2.every(Number.isFinite)) fails.push(m+' prims 非有限深度');
    R.push('DATA|⑤ '+m+' 图元数（两遍）|'+n1+' / '+n2);
  });
  group('⑤ buildScene 幂等 + prims 深度有限（2 页签 × 2 遍）', 4, fails);
}

/* ============ ⑥ state.show ↔ SHOW_ITEMS（两页签并集） ============ */
{
  const fails=[]; let n=0;
  const used=new Set();
  ['bc','rt'].forEach(m=>(SHOW_ITEMS[m]||[]).forEach(it=>{
    n++; used.add(it.k);
    if(typeof state.show[it.k]!=='boolean') fails.push(m+' 的显示项 '+it.k+' 是 '+typeof state.show[it.k]);
  }));
  Object.keys(state.show).forEach(k=>{ n++; if(!used.has(k)) fails.push('state.show.'+k+' 是死键'); });
  group('⑥ state.show 键 ↔ SHOW_ITEMS 对齐', n, fails);
}

/* ============ ⑦ DOM 扫查（两页签 × 全卡） ============ */
const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
            '.module-title','.sec-title','.slider-row','.readout-toggle','.card-tab','.sub-chips'];
{
  const fails=[]; let cards=0, seen=0;
  const scan=(tag)=>{
    CONT.forEach(sel=>{ document.querySelectorAll(sel).forEach(el=>{ seen++;
      const s=el.innerText||'';
      if(s.indexOf('@{')>=0) fails.push(tag+' '+sel+' 泄漏 @{');
      if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) fails.push(tag+' '+sel+' undefined → '+s.slice(0,50));
      if(s.indexOf('**')>=0) fails.push(tag+' '+sel+' 字面星号'); }); });
  };
  ['bc','rt'].forEach(m=>{
    clickTab(m); scan('tab:'+m);
    const nC=document.querySelectorAll('#panel .card-tab').length;
    if(nC!==3) fails.push('页签 '+m+' 讲解卡应有 3 张，实有 '+nC);
    for(let i=0;i<nC;i++){ try{ document.querySelectorAll('#panel .card-tab')[i].click(); }catch(e){ fails.push('card '+m+'#'+i+' 抛异常'); } cards++; scan('c'+m+i); }
  });
  R.push('DATA|⑦ 扫查规模|讲解卡 '+cards+' 张　容器 '+seen+' 个');
  group('⑦ 全页签 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
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
    ['bc','rt'].forEach(m=>{
      state.mode=m; state.thI=80; state.epsr1=9; state.epsr2=1;   /* 覆盖全反射支路 */
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      state.epsr1=1; state.epsr2=4; state.thI=35;
    });
    state.mode='bc';
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑧ 画布文本坏串|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑧ 画布文本无 undefined/NaN/字面星号（含全反射支路）', bad.length===0, bad.length+' 处');
}

/* ============ ⑨ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑨ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
}

/* ============ ⑩ 显示开关守卫 + 数据条一致（两页签） ============ */
{
  const fails=[]; let n=0;
  ['bc','rt'].forEach(m=>{
    clickTab(m);
    const ks=Array.from(document.querySelectorAll('#panel .chip[data-k]'))
      .map(c=>c.dataset.k).filter(k=>(SHOW_ITEMS[m]||[]).some(it=>it.k===k));
    ks.forEach(k=>{
      n++;
      const sel='#panel .chip[data-k="'+k+'"]';
      try{ document.querySelector(sel).click(); }catch(e){ fails.push(m+' chip '+k+' 抛异常'); return; }
      const c2=document.querySelector(sel);
      if(c2 && !c2.classList.contains('on')){ try{ c2.click(); }catch(e){} }
    });
    Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
    buildScene();
    if(prims.length<4) fails.push(m+' 全开时图元只有 '+prims.length);
    n++; updateReadout();
    const tt=document.getElementById('coordStrip').innerText||'';
    if(tt.indexOf('undefined')>=0||tt.indexOf('@{')>=0) fails.push(m+' 数据条有坏串');
  });
  clickTab('bc');
  group('⑩ 显示开关 + 数据条（两页签）', n, fails);
}

/* ============ ⑪ 播放控制 + 布局 ============ */
{
  const fails=[]; let n=0;
  clickTab('rt');
  n++; state.playing=true; playPause(); if(state.playing) fails.push('没暂停');
  n++; playPause(); if(!state.playing) fails.push('没恢复');
  const cv=document.getElementById('cv').getBoundingClientRect();
  const card=document.getElementById('cv').closest('.canvas-card').getBoundingClientRect();
  const strip=document.getElementById('coordStrip').getBoundingClientRect();
  n++; if(cv.width<200||cv.height<200) fails.push('画布太小');
  n++; if(Math.abs(cv.bottom+strip.height-card.bottom)>1.5) fails.push('数据条底边不齐');
  n++; if(cv.right>card.right+1) fails.push('画布越出卡片');
  clickTab('bc');
  group('⑪ 播放控制 + 布局', n, fails);
}

/* ============ ⑫ tick 主循环真的在跑（② 的相位脉冲在动） ============ */
clickTab('rt'); state.playing=true; updateAll();
const tickCheck=()=>new Promise(res=>{
  const t0=state.t, w0=Date.now();
  const poll=()=>{
    if(state.t!==t0){
      R.push('PASS|⑫ tick 主循环在跑（相位 '+t0.toFixed(2)+'→'+state.t.toFixed(2)+'）|');
      res(R.join('\n')+'\nDONE'); return;
    }
    if(Date.now()-w0>6000){
      R.push('FAIL|⑫ tick 主循环在跑|6 s 内相位没推进 ⇒ rAF 停摆');
      res(R.join('\n')+'\nDONE'); return;
    }
    setTimeout(poll,80);
  };
  poll();
});

setTimeout(()=>{ clickTab('bc'); }, 0);
return tickCheck();
})()
