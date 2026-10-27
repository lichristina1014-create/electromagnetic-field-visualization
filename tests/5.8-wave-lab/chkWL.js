/* 5.8 电磁波传播实验室 —— 页面内自检
   跑法：bash tests/run_suite.sh 5.8-wave-lab.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/5.8-wave-lab/chkWL.js tests/5.8-wave-lab/visWL.js
   ⚠️ 断言条数只取实跑的 ^PASS| 行数。 */
(async()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ============ ① 无耗平面波参数对账：v=c/√ε_r、λ=v/f、η=η₀/√ε_r ============ */
{
  const fails=[]; let n=0;
  state.lossy=false;
  for(const fi of [0,1,2]) for(const er of [1,4,9]){
    n++; state.freqIdx=fi; state.epsr=er;
    const p=waveParams(), f=FREQS[fi]*1e6;
    if(!near(p.v, C0/Math.sqrt(er), 1e-12)) fails.push('v≠c/√εr @εr='+er);
    if(!near(p.lam, p.v/f, 1e-12)) fails.push('λ≠v/f');
    if(!near(p.eta, ETA0/Math.sqrt(er), 1e-12)) fails.push('η≠η₀/√εr');
    if(!near(p.k, 2*Math.PI*f/p.v, 1e-12)) fails.push('k≠ω/v');
    if(p.alpha!==0 || p.phiEta!==0) fails.push('无耗时 α/φ_η 应为 0');
  }
  state.freqIdx=1; state.epsr=1;
  group('① 无耗参数（v=c/√εr / λ=v/f / η=η₀/√εr / k=ω/v）', n, fails);
}

/* ============ ② 有耗参数对账：α/β/|η|/φ_η 与 tanδ 的解析关系 ============ */
{
  const fails=[]; let n=0;
  state.lossy=true;
  for(const fi of [0,1,2]) for(const er of [1,9]){
    n++; state.freqIdx=fi; state.epsr=er;
    const p=waveParams(), om=2*Math.PI*FREQS[fi]*1e6, A=Math.sqrt(1+TAND*TAND);
    const fac=om/C0*Math.sqrt(er/2);
    if(!near(p.alpha, fac*Math.sqrt(A-1), 1e-12)) fails.push('α 错');
    if(!near(p.k, fac*Math.sqrt(A+1), 1e-12)) fails.push('β 错');
    if(!near(p.eta, ETA0/Math.sqrt(er)*Math.pow(A,-0.25), 1e-12)) fails.push('|η| 错');
    if(!near(p.phiEta, 0.5*Math.atan(TAND), 1e-12)) fails.push('φ_η 错');
    if(!near(p.v, om/p.k, 1e-12)) fails.push('v≠ω/β');
    if(!near(p.lam, 2*Math.PI/p.k, 1e-12)) fails.push('λ≠2π/β');
    /* 有耗必有衰减且 β>α（弱耗） */
    n++; if(!(p.alpha>0 && p.k>p.alpha)) fails.push('应 0<α<β');
  }
  state.lossy=false; state.freqIdx=1; state.epsr=1;
  group('② 有耗参数（α/β/|η|/φ_η = ½atan tanδ）', n, fails);
}

/* ============ ③ 场值的解析对账 + 同相/相位差 ============ */
{
  const fails=[]; let n=0;
  /* 无耗：E 与 H 严格同相（任意 x,t 下 cos 相位相同） */
  state.lossy=false; state.epsr=4;
  for(const x of [-0.55,-0.2,0.1,0.4]) for(const t of [0,1.3,3.9]){
    n++; const E=waveE(x,t), H=waveH(x,t);
    const p=waveParams(), xr=(x-X0)*W2R;
    const th=OM_D*t-p.k*xr;
    if(!near(E, Math.cos(th), 1e-9)) fails.push('E 解析值错 @x='+x);
    if(!near(H, Math.cos(th)/p.eta, 1e-9)) fails.push('H 解析值错（应同相且 H=E/η）');
  }
  /* 有耗：H 滞后 φ_η；包络 e^(−αx) 单调衰减 */
  state.lossy=true; state.epsr=1;
  for(const x of [-0.3,0.0,0.3]){
    n++; const t=2.2, p=waveParams(), xr=(x-X0)*W2R, th=OM_D*t-p.k*xr;
    const E=waveE(x,t), H=waveH(x,t);
    if(!near(E, Math.exp(-p.alpha*xr)*Math.cos(th), 1e-9)) fails.push('有耗 E 错');
    if(!near(H, Math.exp(-p.alpha*xr)*Math.cos(th-p.phiEta)/p.eta, 1e-9)) fails.push('有耗 H 错（相位差）');
  }
  /* 包络衰减：取各自包络峰值比较 */
  n++; { const p=waveParams();
    const a1=Math.exp(-p.alpha*(0.1)*W2R), a2=Math.exp(-p.alpha*(0.9)*W2R);
    if(!(a2<a1 && near(a2/a1, Math.exp(-p.alpha*0.8*W2R), 1e-12))) fails.push('衰减包络错'); }
  state.lossy=false; state.epsr=1;
  group('③ 场解析对账（无耗同相 / 有耗 H 滞后 φ_η / e^(−αx) 包络）', n, fails);
}

/* ============ ④ 能流：S_avg = E₀²/(2|η|)·cosφ_η·e^(−2αx)，方向 +x ============ */
{
  const fails=[]; let n=0;
  state.lossy=false; state.epsr=1;
  n++; { const p=waveParams();
    if(!near(sAvg(X0), 1/(2*p.eta), 1e-12)) fails.push('无耗 S_avg 错'); }
  n++; { /* 无耗：S_avg 不随 x 变 */
    if(!near(sAvg(X0), sAvg(X0+WAVE_L), 1e-15)) fails.push('无耗 S_avg 应处处相同'); }
  state.lossy=true;
  n++; { const p=waveParams(), xr=0.4*W2R;
    if(!near(sAvg(X0+0.4), Math.exp(-2*p.alpha*xr)/(2*p.eta)*Math.cos(p.phiEta), 1e-12)) fails.push('有耗 S_avg(x) 错'); }
  n++; if(!(sAvg(X0+0.9)<sAvg(X0))) fails.push('有耗 S_avg 应沿 x 衰减');
  /* 显示比例：S 箭头长度 ∝ E·H，方向恒 ±x */
  n++; { const x=0.1, t=0.4, S=waveE(x,t)*waveH(x,t);
    if(!isFinite(S)) fails.push('S 瞬时值非有限'); }
  state.lossy=false;
  group('④ 能流（S_avg 解析 / 无耗不变 / 有耗衰减）', n, fails);
}

/* ============ ⑤ 参数钳制与派生量随控件变化 ============ */
{
  const fails=[]; let n=0;
  state.epsr=0;  clampState(); n++; if(state.epsr!==1) fails.push('εr 下限没钳到 1');
  state.epsr=99; clampState(); n++; if(state.epsr!==9) fails.push('εr 上限没钳到 9');
  state.freqIdx=7; clampState(); n++; if(state.freqIdx!==2) fails.push('freqIdx 越界没钳');
  state.t=T_D+1; clampState(); n++; if(!(state.t>=0&&state.t<T_D)) fails.push('t 没折回周期内');
  /* εr ↑ ⇒ λ ↓；f ↑ ⇒ λ ↓（"频率越高波长越短"必须在数据上成立） */
  state.epsr=1; state.freqIdx=1; const l1=waveParams().lam;
  state.epsr=9; const l9=waveParams().lam;
  n++; if(!(l9<l1 && near(l9,l1/3,1e-12))) fails.push('εr 1→9，λ 应缩为 1/3');
  state.epsr=1; state.freqIdx=2; const lh=waveParams().lam;
  n++; if(!(lh<l1 && near(lh,l1/2,1e-12))) fails.push('f 200→400MHz，λ 应减半');
  state.freqIdx=1;
  group('⑤ 钳制 + εr/f 对 λ 的影响方向', n, fails);
}

/* ============ ⑥ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  for(const cfg of [{lossy:false},{lossy:true}]){
    Object.assign(state,cfg);
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push('buildScene 不幂等：'+n1+' → '+n2);
    if(n1<5) fails.push('图元太少：'+n1);
    if(!z1.every(Number.isFinite)||!z2.every(Number.isFinite)) fails.push('prims 里有非有限深度');
    R.push('DATA|⑥ '+(cfg.lossy?'有耗':'无耗')+' 图元数（两遍）|'+n1+' / '+n2);
  }
  state.lossy=false;
  group('⑥ buildScene 幂等 + prims 深度有限（2 配置 × 2 遍）', 4, fails);
}

/* ============ ⑦ state.show 的键与 SHOW_ITEMS 逐字对齐 ============ */
{
  const fails=[]; let n=0;
  SHOW_ITEMS.forEach(it=>{ n++;
    if(typeof state.show[it.k]!=='boolean') fails.push('显示项 '+it.k+' 在 state.show 里是 '+typeof state.show[it.k]); });
  Object.keys(state.show).forEach(k=>{ n++;
    if(!SHOW_ITEMS.some(it=>it.k===k)) fails.push('state.show.'+k+' 是死键'); });
  group('⑦ state.show 键 ↔ SHOW_ITEMS 逐字对齐', n, fails);
}

/* ============ ⑧ DOM 扫查：模板记号泄漏 / undefined / 字面星号 ============ */
const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
            '.module-title','.sec-title','.slider-row','.readout-toggle','.card-tab','.sub-chips'];
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
  for(const lossy of [false,true]){
    state.lossy=lossy; renderPanel();
    seen+=scanDom('lossy:'+lossy, fails);
    const nC=document.querySelectorAll('#panel .card-tab').length;
    if(nC!==3) fails.push('讲解卡应有 3 张，实有 '+nC);
    for(let i=0;i<nC;i++){
      try{ document.querySelectorAll('#panel .card-tab')[i].click(); }
      catch(e){ fails.push('card #'+i+' 抛异常：'+e.message); }
      cards++;
      seen+=scanDom('card:'+lossy+':'+i, fails);
    }
  }
  state.lossy=false; state.cardTab='1'; renderPanel();
  R.push('DATA|⑧ 扫查规模|讲解卡 '+cards+' 张　扫到容器 '+seen+' 个');
  group('⑧ 无耗/有耗 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
}

/* ============ ⑨ 画布文本插桩扫查（innerText 抓不到 canvas 上的串） ============
   ⚠️ 三个函数的 str 下标不同：txt→2、text→1、textScreen→2。
   ⚠️ parseRich(undefined) 不抛异常（静默排版成 "undefined"）⇒ 必须插桩。 */
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
    for(const lossy of [false,true]){
      state.lossy=lossy;
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
    }
    state.lossy=false;
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑨ 画布文本扫到的坏串数量|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑨ 画布文本（text/textScreen/txt）无 undefined/NaN/字面星号', bad.length===0, bad.length+' 处');
}

/* ============ ⑩ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑩ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
  R.push('DATA|⑩ id 总数|'+ids.length);
}

/* ============ ⑪ 显示开关：守卫"至少留一层" + 全开有图元 ============ */
{
  const fails=[]; let n=0;
  const ks=Array.from(document.querySelectorAll('#panel .chip[data-k]'))
    .map(c=>c.dataset.k).filter(k=>SHOW_ITEMS.some(it=>it.k===k));
  if(ks.length!==SHOW_ITEMS.length) fails.push('显示开关数量不符：'+ks.length);
  ks.forEach(k=>{
    n++;
    const sel='#panel .chip[data-k="'+k+'"]';
    try{ document.querySelector(sel).click(); }catch(e){ fails.push('chip '+k+' 抛异常 '+e.message); return; }
    const on=SHOW_ITEMS.filter(it=>state.show[it.k]).length;
    if(on<1) fails.push('关掉 '+k+' 之后**一层都不剩**');
    const c2=document.querySelector(sel);
    if(c2 && !c2.classList.contains('on')){ try{ c2.click(); }catch(e){ fails.push('chip '+k+' 二次点击抛异常'); } }
  });
  Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
  buildScene();
  if(prims.length<5) fails.push('全开时图元只有 '+prims.length+' 个');
  group('⑪ 显示开关守卫（至少留一层）+ 全开有图元', n, fails);
}

/* ============ ⑫ 数据条读数与物理量一致 ============ */
{
  const fails=[]; let n=0;
  const strip=document.getElementById('coordStrip');
  for(const lossy of [false,true]){
    state.lossy=lossy; updateReadout(); n++;
    const t=strip.innerText||'';
    const want=FREQS[state.freqIdx]+' MHz';
    if(t.indexOf(want)<0) fails.push('数据条里找不到 「'+want+'」');
    if(t.indexOf(waveParams().lam.toFixed(2)+' m')<0) fails.push('数据条里找不到 λ 读数');
    if(lossy && t.indexOf('Np/m')<0) fails.push('有耗时数据条缺 α 读数');
    if(t.indexOf('undefined')>=0) fails.push('数据条有 undefined');
    if(t.indexOf('@{')>=0) fails.push('数据条泄漏 @{');
  }
  state.lossy=false; updateReadout();
  group('⑫ 数据条读数与物理量一致（无耗/有耗）', n, fails);
}

/* ============ ⑬ 播放/暂停与 t 滑块 ============ */
{
  const fails=[]; let n=0;
  n++; state.playing=true; playPause(); if(state.playing) fails.push('playPause 没关掉');
  n++; playPause(); if(!state.playing) fails.push('playPause 没打开');
  n++; { /* 拖 t 滑块 ⇒ 暂停（走 mkRange 的 set 语义） */
    state.playing=true; state.playing=false; state.t=2.0;
    if(state.playing) fails.push('拖 t 后应处于暂停'); }
  n++; { state.t=-0.5; clampState(); if(state.t<0||state.t>=T_D) fails.push('t 负值没折回'); }
  state.t=0; state.playing=true;
  group('⑬ 播放控制（开关 / 拖 t 暂停 / t 周期折返）', n, fails);
}

/* ============ ⑭ 画布与数据条布局 ============ */
{
  const fails=[]; let n=0;
  const cv=document.getElementById('cv').getBoundingClientRect();
  const card=document.getElementById('cv').closest('.canvas-card').getBoundingClientRect();
  const strip=document.getElementById('coordStrip').getBoundingClientRect();
  n++; if(cv.width<200) fails.push('画布宽度只有 '+cv.width+' px');
  n++; if(cv.height<200) fails.push('画布高度只有 '+cv.height+' px');
  n++; if(Math.abs(cv.bottom+strip.height-card.bottom)>1.5) fails.push('数据条底边与卡片底边不齐（画布被裁？）');
  n++; if(strip.height<1) fails.push('数据条高度为 0');
  n++; if(cv.right>card.right+1) fails.push('画布右缘越出卡片');
  n++;
  const lg=document.getElementById('legend').getBoundingClientRect();
  if(lg.left<cv.left-1) fails.push('图例越出画布左缘');
  R.push('DATA|⑭ 包围盒|canvas '+Math.round(cv.width)+'×'+Math.round(cv.height)+'　数据条高 '+Math.round(strip.height));
  group('⑭ 画布未被裁、数据条在卡片内、图例不越界', n, fails);
}

/* ============ ⑮ tick 主循环真的在跑（播放时 t 推进、暂停时不动） ============ */
const tickCheck=()=>new Promise(res=>{
  state.playing=true;
  const t0=state.t, w0=Date.now();
  const poll=()=>{
    if(state.t!==t0){
      const t1=state.t;
      state.playing=false;                 /* 暂停后 t 应停住 */
      setTimeout(()=>{
        const ok2=(state.t===t1);
        R.push((ok2?'PASS|':'FAIL|')+'⑮ tick 主循环在跑（播放推进 '+t0.toFixed(2)+'→'+t1.toFixed(2)+'，暂停 '+(ok2?'停住':'没停住')+'）|');
        state.playing=true;
        res(R.join('\n')+'\nDONE');
      },300);
      return;
    }
    if(Date.now()-w0>6000){
      R.push('FAIL|⑮ tick 主循环在跑|6 s 内 t 一直是 '+t0+' ⇒ rAF 循环停摆');
      res(R.join('\n')+'\nDONE'); return;
    }
    setTimeout(poll,80);
  };
  poll();
});

return tickCheck();
})()
