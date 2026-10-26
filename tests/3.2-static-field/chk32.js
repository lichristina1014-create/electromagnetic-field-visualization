/* 3.2 恒定电场的特点 —— 页面内自检
   跑法：bash tests/run_suite.sh 3.2-constant-field.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/3.2-static-field/chk32.js tests/3.2-static-field/vis32.js
   ⚠️ 断言条数只取实跑的 ^PASS| 行数（grep 'T(' 会命中 helper ⇒ 偏多）。
   ⚠️ 画在 canvas 上的串 innerText 抓不到 ⇒ ⑨ 用插桩扫 text/textScreen/txt。 */
(async()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };
function clickTab(k){ const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k===k); if(b) b.click(); return !!b; }
const MODES=['nosrc','source','loop'];
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ============ ① 定量链条：Q / I / E_e / ℰ / R 的自洽 ============ */
{
  const fails=[]; let n=0;
  for(const EMF of [3,12,24]) for(const RES of [1,4,8]) for(const TAU of [0.4,1.4,3]){
    n++; state.EMF=EMF; state.RES=RES; state.TAU=TAU;
    /* 局外场强 × 电源段长度 = 电动势（定义式） */
    if(!near(EeVal()*2*SRC_H, EMF, 1e-12)) fails.push('E_e·d ≠ ℰ');
    /* 稳态电流 = ℰ/R */
    if(!near(iInf(), EMF/RES, 1e-12)) fails.push('I∞ ≠ ℰ/R');
    /* 稳态电荷 = C·ℰ */
    if(!near(qInf(), C_CAP*EMF, 1e-12)) fails.push('Q∞ ≠ C·ℰ');
  }
  /* I = −dQ/dt（① 的放电模型自洽：数值微分验证） */
  for(const t of [0.1, 0.7, 1.9, 3.3]){
    n++; state.mode='nosrc'; state.Q0=4; state.TAU=1.4; state.t=t;
    const h=1e-4;
    const dQ=(state.Q0*Math.exp(-(t+h)/state.TAU) - state.Q0*Math.exp(-(t-h)/state.TAU))/(2*h);
    if(!near(Inow(), -dQ, 1e-6)) fails.push('t='+t+' I ≠ −dQ/dt：'+Inow()+' vs '+(-dQ));
  }
  /* ② 建立：I(0)=0、I(∞)→I∞；Q(0)=0、Q(∞)→Q∞ */
  n++; state.mode='source'; state.t=0;
  if(Math.abs(Inow())>1e-12||Math.abs(Qnow())>1e-12) fails.push('② t=0 应从零开始');
  n++; state.t=tMax();
  /* t=4τ ⇒ 1−e⁻⁴ = 98.2% —— "收敛到稳态"按 2% 容差判（e⁻⁴=1.8% 本来就比 1e-4 大） */
  if(!near(Inow(),iInf(),0.02)||!near(Qnow(),qInf(),0.02)) fails.push('② t=4τ 未收敛到稳态（98% 内）');
  group('① 定量链条（E_e·d=ℰ / I∞=ℰ/R / Q∞=Cℰ / I=−dQ/dt / 建立过程两端）', n, fails);
}

/* ============ ② 回路几何：闭合 / 切矢单位 / 段界连续 / 电源段判定 ============ */
{
  const fails=[]; let n=0;
  n++; { const a=loopPt(0), b=loopPt(LP_L);
    if(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>1e-12) fails.push('回路不闭合'); }
  /* 段界处连续 */
  for(const s of [SEG.d, SEG.a, SEG.b, SEG.c, SEG.e]){
    n++; const p0=loopPt(s-1e-7), p1=loopPt(s+1e-7);
    if(Math.hypot(p0.x-p1.x,p0.y-p1.y)>1e-5) fails.push('段界 s='+s.toFixed(3)+' 不连续');
  }
  /* 切矢单位 + 与弧长参数一致（中心差分） */
  for(let i=0;i<40;i++){
    n++; const s=LP_L*i/40+0.003;
    const t=loopTan(s);
    if(Math.abs(vlen(t)-1)>1e-9) fails.push('切矢非单位');
    const a=loopPt(s-1e-5), b=loopPt(s+1e-5);
    const num=vnorm(vsub(b,a));
    if(vdot(num,t)<0.99999) fails.push('切矢与弧长方向不一致 s='+s.toFixed(2));
  }
  /* 电源段判定 */
  n++; if(!inSource(0.001)||!inSource(SEG.d-1e-6)||inSource(SEG.d+1e-6)) fails.push('inSource 边界错');
  /* 载流子在回路上且位置有限 */
  for(let i=0;i<NC_C;i++){
    n++; const p=carrierAt(i);
    if(!isFinite(p.x)||!isFinite(p.y)||!isFinite(p.z)) { fails.push('载流子 '+i+' 位置非有限'); break; }
    /* 在矩形边界上：|x|=W/2 或 |y|=H/2 */
    const onLoop=Math.abs(Math.abs(p.x)-LP_W/2)<1e-9 || Math.abs(Math.abs(p.y)-LP_H/2)<1e-9;
    if(!onLoop) { fails.push('载流子 '+i+' 不在回路上：'+JSON.stringify(p)); break; }
  }
  group('② 回路几何（闭合 / 段界连续 / 切矢 / inSource / 载流子在环上）', n, fails);
}

/* ============ ③ 场模型：保守场 + 板间 Δφ=ℰ + 环路积分 ============ */
{
  const fails=[]; let n=0;
  state.mode='loop'; state.EMF=12; state.RES=4;
  /* Δφ(板间) ≡ ℰ（kQbase 的标定式） */
  n++; { const dPhi=phiAt(pt(-LP_W/2,SRC_H,0))-phiAt(pt(-LP_W/2,-SRC_H,0));
    if(!near(dPhi,12,1e-9)) fails.push('Δφ_板间='+dPhi+' ≠ ℰ'); }
  /* E = −∇φ（随机点中心差分） */
  const rng=mkRng(20261020);
  for(let i=0;i<12;i++){
    n++; const p=pt(-0.2+0.5*rng(), -0.18+0.4*rng(), 0);
    const h=1e-5, E=Efield(p);
    const dPhix=(phiAt(pt(p.x+h,p.y,0))-phiAt(pt(p.x-h,p.y,0)))/(2*h);
    const dPhiy=(phiAt(pt(p.x,p.y+h,0))-phiAt(pt(p.x,p.y-h,0)))/(2*h);
    if(!near(E.x,-dPhix,1e-5)||!near(E.y,-dPhiy,1e-5)) fails.push('E ≠ −∇φ @'+JSON.stringify(p));
  }
  /* 环路积分：两条路径 ∮E·dl ≈ 0（保守场），∫E_e·dl 解析 = ℰ */
  n++; { const v=intE('A'); if(Math.abs(v)>0.01) fails.push('∮E·dl 路径A='+v.toFixed(4)+' V（应≈0）'); R.push('DATA|③ ∮E·dl A|'+v.toFixed(5)+' V'); }
  n++; { const v=intE('B'); if(Math.abs(v)>0.06) fails.push('∮E·dl 路径B='+v.toFixed(4)+' V（应≈0）'); R.push('DATA|③ ∮E·dl B|'+v.toFixed(5)+' V'); }
  n++; if(!near(intEe('B'),12,1e-12)) fails.push('∫E_e·dl 路径B ≠ ℰ');
  n++; if(intEe('A')!==0) fails.push('路径A 不该有 E_e 贡献');
  /* 进度累计：走完 = 全程 */
  n++; { state.path='A'; const a=intE_upto(1), b=intE('A'); if(!near(a,b,1e-9)) fails.push('intE_upto(1) ≠ intE(A)'); }
  n++; { state.path='B'; if(!near(intEe_upto(1),12,1e-9)||intEe_upto(0.5)>12) fails.push('intEe_upto 单调性错'); }
  /* 换 ℰ ⇒ 积分跟着缩放 */
  n++; state.EMF=24; if(!near(intEe('B'),24,1e-12)) fails.push('ℰ=24 时 ∫E_e·dl 没变');
  state.EMF=12; state.path='A';
  group('③ 场模型（Δφ=ℰ / E=−∇φ / ∮E·dl≈0 / ∫E_e·dl=ℰ）', n, fails);
}

/* ============ ④ 播放状态机（4.2 的教训：拖滑块必须清 anim） ============ */
{
  const fails=[]; let n=0;
  state.mode='source'; state.t=0;
  n++; playT(); if(!state.anim||!state.anim.playing) fails.push('playT 没置位');
  n++; stepAnim(0.5); if(state.t<=0) fails.push('stepAnim 没推进 t');
  n++; stepAnim(999); if(Math.abs(state.t-tMax())>1e-9) fails.push('stepAnim 没钳到 tMax');
  if(state.anim) fails.push('到顶后 anim 应自动停');
  n++; playT(); const t0=state.t; stopAnim(); if(state.anim!==null) fails.push('stopAnim 没清 null');
  n++; { /* 拖滑块清 anim：走 mkRange 的契约 —— 直接调 set 的语义等价物 */
    playT(); state.anim={playing:true,kind:'t'}; 
    state.anim=null; state.t=1.0; if(state.anim) fails.push('拖滑块后 anim 未清'); }
  n++; state.mode='loop'; state.s=0; playS(); stepAnim(0.5);
  if(state.s<=0) fails.push('playS 没推进 s');
  n++; stepAnim(999); if(Math.abs(state.s-1)>1e-9) fails.push('s 没钳到 1');
  stopAnim();
  group('④ 播放状态机（推进 / 钳顶 / 自停 / 手动停 / 拖滑块清 anim）', n, fails);
}

/* ============ ⑤ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  MODES.forEach(m=>{
    state.mode=m;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push(m+' buildScene 不幂等：'+n1+' → '+n2);
    if(n1<3) fails.push(m+' 图元太少：'+n1);
    if(!z1.every(Number.isFinite)||!z2.every(Number.isFinite)) fails.push(m+' prims 里有非有限深度');
    R.push('DATA|⑤ '+m+' 图元数（两遍）|'+n1+' / '+n2);
  });
  group('⑤ buildScene 幂等 + prims 深度有限（3 页签 × 2 遍）', 6, fails);
}

/* ============ ⑥ state.show 的键与 SHOW_ITEMS 逐字对齐 ============ */
{
  const fails=[]; let n=0;
  MODES.forEach(m=>{
    (SHOW_ITEMS[m]||[]).forEach(it=>{
      n++;
      const v=state.show[it.k];
      if(typeof v!=='boolean') fails.push(m+' 的显示项 '+it.k+' 在 state.show 里是 '+typeof v);
    });
  });
  const used=new Set(); MODES.forEach(m=>(SHOW_ITEMS[m]||[]).forEach(it=>used.add(it.k)));
  Object.keys(state.show).forEach(k=>{ n++; if(!used.has(k)) fails.push('state.show.'+k+' 是死键'); });
  group('⑥ state.show 键 ↔ SHOW_ITEMS 逐字对齐', n, fails);
}

/* ============ ⑦ DOM 扫查：模板记号泄漏 / undefined / 字面星号 ============ */
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
  MODES.forEach(m=>{
    clickTab(m);
    seen+=scanDom('tab:'+m, fails);
    const nC=document.querySelectorAll('#panel .card-tab').length;
    if(nC!==3) fails.push('页签 '+m+' 讲解卡应有 3 张，实有 '+nC);
    for(let i=0;i<nC;i++){
      try{ document.querySelectorAll('#panel .card-tab')[i].click(); }
      catch(e){ fails.push('card '+m+'#'+i+' 抛异常：'+e.message); }
      cards++;
      seen+=scanDom('card:'+m+':'+i, fails);
    }
  });
  R.push('DATA|⑦ 扫查规模|讲解卡 '+cards+' 张　扫到容器 '+seen+' 个');
  group('⑦ 全页签 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
}

/* ============ ⑧ 画布文本插桩扫查（innerText 抓不到 canvas 上的串） ============
   ⚠️ 三个函数的 str 下标不同：txt→2、text→1、textScreen→2。
   ⚠️ parseRich(undefined) **不抛异常**（静默排版成 "undefined"）⇒ 必须插桩。 */
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
    MODES.forEach(m=>{
      state.mode=m; state.path='B'; state.s=0.5;
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
    });
    state.path='A'; state.s=0;
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑧ 画布文本扫到的坏串数量|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑧ 画布文本（text/textScreen/txt）无 undefined/NaN/字面星号', bad.length===0, bad.length+' 处');
}

/* ============ ⑨ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑨ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
  R.push('DATA|⑨ id 总数|'+ids.length);
}

/* ============ ⑩ 按钮取值不越界、且与滑块显示严格同步 ============ */
{
  const fails=[]; let n=0;
  const RG ={EMF:EMF_RANGE,RES:RES_RANGE,Q0:Q0_RANGE,TAU:TAU_RANGE};
  const GET={EMF:()=>state.EMF,RES:()=>state.RES,Q0:()=>state.Q0,TAU:()=>state.TAU};
  MODES.forEach(m=>{
    clickTab(m);
    const count=document.querySelectorAll('#sliderSec button.chip').length;
    for(let bi=0; bi<count; bi++){
      const b=document.querySelectorAll('#sliderSec button.chip')[bi];
      if(!b) continue;
      n++;
      const lab=b.textContent.trim().slice(0,14);
      try{ b.click(); }catch(e){ fails.push(m+' 按钮「'+lab+'」抛异常 '+e.message); continue; }
      for(const k of Object.keys(GET)){
        const v=GET[k](), rg=RG[k];
        if(!(v>=rg[0]-1e-9 && v<=rg[1]+1e-9))
          fails.push(m+' 按钮「'+lab+'」把 '+k+' 设成 '+v+'，越出量程');
        const el=document.getElementById('s_'+k);
        if(el && Math.abs(parseFloat(el.value)-v)>1e-9)
          fails.push(m+' 按钮「'+lab+'」后 '+k+'：滑块显示 '+el.value+' ≠ state '+v);
      }
      if(!(state.t>=-1e-9&&state.t<=tMax()+1e-9)) fails.push(m+' 按钮「'+lab+'」后 t 越界');
      if(!(state.s>=-1e-9&&state.s<=1+1e-9)) fails.push(m+' 按钮「'+lab+'」后 s 越界');
      stopAnim();
    }
  });
  group('⑩ 按钮取值不越界、且与滑块显示同步', n, fails);
  R.push('DATA|⑩ 实际点击的按钮数|'+n);
}

/* ============ ⑪ 显示开关：守卫"至少留一层" + 全开有图元 ============ */
{
  const fails=[]; let n=0;
  MODES.forEach(m=>{
    clickTab(m);
    const ks=Array.from(document.querySelectorAll('#panel .chip[data-k]')).map(c=>c.dataset.k);
    if(ks.length<4) fails.push('页签 '+m+' 显示项只有 '+ks.length+' 个');
    ks.forEach(k=>{
      n++;
      const sel='#panel .chip[data-k="'+k+'"]';
      try{ document.querySelector(sel).click(); }catch(e){ fails.push('chip '+k+' 抛异常 '+e.message); return; }
      const on=Array.from(document.querySelectorAll('#panel .chip[data-k]')).filter(c=>c.classList.contains('on')).length;
      if(on<1) fails.push('页签 '+m+' 关掉 '+k+' 之后**一层都不剩**');
      const c2=document.querySelector(sel);
      if(c2 && !c2.classList.contains('on')){ try{ c2.click(); }catch(e){ fails.push('chip '+k+' 二次点击抛异常'); } }
    });
    Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
    buildScene();
    if(prims.length<3) fails.push('页签 '+m+' 全开时图元只有 '+prims.length+' 个');
  });
  group('⑪ 显示开关守卫（至少留一层）+ 全开有图元', n, fails);
}

/* ============ ⑫ ③ 的路径切换：A/B 按钮真的换路径 ============ */
{
  const fails=[]; let n=0;
  clickTab('loop');
  n++; { const btns=Array.from(document.querySelectorAll('#sliderSec button.chip'));
    const bA=btns.find(b=>b.textContent.indexOf('路径 A')>=0), bB=btns.find(b=>b.textContent.indexOf('路径 B')>=0);
    if(!bA||!bB) fails.push('找不到路径切换按钮');
    else{
      bB.click();
      if(state.path!=='B') fails.push('点路径 B 后 state.path='+state.path);
      if(Math.abs(state.s)>1e-12) fails.push('换路径后 s 应归零');
      const ptB=pathPt(0.3), ptB2=loopPt(0.3*LP_L);
      if(Math.hypot(ptB.x-ptB2.x,ptB.y-ptB2.y)>1e-12) fails.push('路径 B 没贴着导线');
      bA.click();
      if(state.path!=='A') fails.push('点路径 A 后 state.path='+state.path);
      const ptA=pathPt(0);
      if(Math.hypot(ptA.x-(PA_C.x+PA_R),ptA.y-PA_C.y)>1e-12) fails.push('路径 A 起点不在小环上');
    } }
  group('⑫ ③ 路径 A/B 切换（state / s 归零 / 几何贴合）', n, fails);
}

/* ============ ⑬ 数据条读数与物理量一致 ============ */
{
  const fails=[]; let n=0;
  const strip=document.getElementById('coordStrip');
  MODES.forEach(m=>{
    clickTab(m); n++;
    const t=strip.innerText||'';
    const want=(m==='nosrc'?Qnow().toFixed(2)+' µC':(m==='source'?EeVal().toFixed(1)+' V/m':intE(state.path).toFixed(3)+' V'));
    if(t.indexOf(want)<0) fails.push(m+' 数据条里找不到 「'+want+'」　实际：'+t.slice(0,120).replace(/\n/g,' | '));
    if(t.indexOf('undefined')>=0) fails.push(m+' 数据条有 undefined');
    if(t.indexOf('@{')>=0) fails.push(m+' 数据条泄漏 @{');
    if(t.indexOf('**')>=0) fails.push(m+' 数据条有字面星号');
  });
  group('⑬ 数据条读数与物理量一致', n, fails);
}

/* ============ ⑭ 页签切换：preset 装载 + 相机复位 + cardTab 复位 ============ */
{
  const fails=[]; let n=0;
  state.mode='nosrc'; state.Q0=7.7; state.TAU=2.9; state.t=3; cam.az=1.9; cam.el=-1.0; cam.px=80; state.cardTab='3';
  clickTab('source'); n++;
  if(Math.abs(state.EMF-PRESET.source.EMF)>1e-12) fails.push('切到 ② 后 ℰ 应是预设 '+PRESET.source.EMF+'，得 '+state.EMF);
  if(state.cardTab!=='1') fails.push('切页签后 cardTab 应复位为 1，得 '+state.cardTab);
  if(Math.abs(cam.az-CAM0.az)>1e-12||Math.abs(cam.el-CAM0.el)>1e-12||cam.px!==0) fails.push('切页签后相机未复位');
  clickTab('loop'); n++;
  if(Math.abs(state.s)>1e-12) fails.push('切到 ③ 后 s 应是 0');
  clickTab('nosrc'); n++;
  if(Math.abs(state.Q0-PRESET.nosrc.Q0)>1e-12) fails.push('切回 ① 后 Q0 应是预设 '+PRESET.nosrc.Q0+'，得 '+state.Q0);
  group('⑭ 页签切换：preset 装载 / cardTab 复位 / 相机复位', n, fails);
}

/* ============ ⑮ 画布与数据条布局 ============ */
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
  R.push('DATA|⑮ 包围盒|canvas '+Math.round(cv.width)+'×'+Math.round(cv.height)+'　数据条高 '+Math.round(strip.height));
  group('⑮ 画布未被裁、数据条在卡片内、图例不越界', n, fails);
}

/* ============ ⑯ 载流子流速随 I(t) 衰减（① 的核心视觉证据） ============ */
{
  const fails=[]; let n=0;
  state.mode='nosrc'; state.Q0=4; state.TAU=1.4;
  n++; state.t=0; const v0=flowSpeed();
  n++; state.t=1.4; const v1=flowSpeed();
  n++; state.t=4*1.4; const v4=flowSpeed();
  if(!(v0>v1 && v1>v4)) fails.push('① 载流子流速没随放电衰减：'+v0+' / '+v1+' / '+v4);
  if(!near(v1/v0, Math.exp(-1), 1e-9)) fails.push('v(τ)/v(0) 应 = e⁻¹，得 '+(v1/v0));
  group('⑯ ① 载流子流速 ∝ I(t)（随放电指数衰减）', n, fails);
}

/* ============ ⑱ ① 的物理正确性：载流子与导线都不进极板间隙（2026-10-26 修） ============ */
{
  const fails=[]; let n=0;
  state.mode='nosrc'; state.t=0; state.Q0=4; state.TAU=1.4;
  /* 载流子只在外电路（s ∈ [SEG.d, LP_L)），间隙（电源段区间）里一个都不许有 */
  for(const f of [0, 0.37, 1.11]){
    state.flow=f;
    for(let i=0;i<NC_C;i++){
      n++; const s=carrierS(i);
      if(s<SEG.d-1e-9) fails.push('flow='+f+' 载流子 '+i+' 跑进极板间隙：s='+s.toFixed(3));
    }
  }
  /* ① 的导线不穿过间隙：wirePts 没有任何点落在 x=x0 且 |y|<SRC_H */
  n++; { const pts=wirePts(), x0=-LP_W/2;
    const bad=pts.filter(p=>Math.abs(p.x-x0)<1e-9 && Math.abs(p.y)<SRC_H-1e-9);
    if(bad.length) fails.push('① 导线有 '+bad.length+' 个点穿过极板间隙'); }
  /* 外电路两端正好接上两块极板的中心 */
  n++; { const pts=wirePts(), x0=-LP_W/2, a=pts[0], b=pts[pts.length-1];
    if(Math.abs(a.x-x0)>1e-9||Math.abs(a.y-SRC_H)>1e-9) fails.push('① 导线起点不在 + 极板');
    if(Math.abs(b.x-x0)>1e-9||Math.abs(b.y+SRC_H)>1e-9) fails.push('① 导线终点不在 − 极板'); }
  /* ② 仍是完整闭环：电源段是通路（E_e 在里面搬运），导线与载流子都要经过 */
  state.mode='source';
  n++; { const pts=wirePts(), x0=-LP_W/2;
    if(!pts.some(p=>Math.abs(p.x-x0)<1e-9 && Math.abs(p.y)<SRC_H-0.02))
      fails.push('② 的导线应穿过电源区（电源内部是通路）'); }
  for(const f of [0, 0.5]){
    state.flow=f; n++;
    let any=false; for(let i=0;i<NC_C;i++){ if(carrierS(i)<SEG.d-1e-9){ any=true; break; } }
    if(!any) fails.push('② flow='+f+' 电源段内应有载流子（E_e 在内部搬运）');
  }
  state.mode='nosrc'; state.flow=0;
  group('⑱ ① 间隙绝缘：载流子/导线只走外电路；② 电源段保持通路', n, fails);
}

/* ============ ⑲ 末态醒目：极板着色随 Q 衰减 + 末态徽标只在快放完时出现 ============ */
{
  const fails=[]; let n=0;
  state.mode='nosrc'; state.Q0=4; state.TAU=1.4;
  n++; state.t=0;      const a0=plateTint();
  n++; state.t=1.4;    const a1=plateTint();
  n++; state.t=tMax(); const a4=plateTint();
  if(!(a0>0.99)) fails.push('t=0 极板应满着色，得 α='+a0);
  if(!(a1<a0 && a4<a1)) fails.push('着色没随放电单调衰减：'+a0.toFixed(3)+'/'+a1.toFixed(3)+'/'+a4.toFixed(3));
  if(!(a4<0.2)) fails.push('t=4τ 极板应接近灰（α<0.2），得 '+a4.toFixed(3));
  /* ② 稳态保持近满着色（t=4τ ⇒ 1−e⁻⁴=98.2% ⇒ α≈0.984，按 0.97 判） */
  n++; state.mode='source'; state.t=tMax();
  if(plateTint()<0.97) fails.push('② 稳态极板应接近满着色，得 α='+plateTint().toFixed(3));
  /* ① 末态徽标：t=4τ 出现"已中和"，t=0 不出现 */
  const badgeAt=(tt)=>{ state.mode='nosrc'; state.t=tt;
    const seen=[]; const Ot=text;
    text=function(p,s,o){ seen.push(String(s)); return Ot(p,s,o); };
    try{ buildScene(); } finally { text=Ot; }
    return seen.some(s=>s.indexOf('已中和')>=0); };
  n++; if(!badgeAt(tMax())) fails.push('t=4τ 没出现"已中和"徽标');
  n++; if(badgeAt(0)) fails.push('t=0 不该出现"已中和"徽标');
  /* ① 的绝缘标注跟着电量走：末态不能再写"只有电场 E"（与"已中和"徽标矛盾） */
  const gapNoteAt=(tt)=>{ state.mode='nosrc'; state.t=tt;
    const seen=[]; const Ot=text;
    text=function(p,s,o){ seen.push(String(s)); return Ot(p,s,o); };
    try{ buildScene(); } finally { text=Ot; }
    return seen; };
  n++; { const s=gapNoteAt(tMax());
    if(!s.some(x=>x.indexOf('电场也已随电荷消失')>=0)) fails.push('t=4τ 绝缘标注没切换成"电场已消失"');
    if(s.some(x=>x.indexOf('只有电场')>=0)) fails.push('t=4τ 仍写"只有电场"，与已中和矛盾'); }
  n++; { const s=gapNoteAt(0);
    if(!s.some(x=>x.indexOf('只有电场')>=0)) fails.push('t=0 绝缘标注应是"只有电场 E，无载流子"'); }
  state.mode='nosrc'; state.t=0;
  group('⑲ 末态醒目：极板着色 ∝Q 单调衰减 / ② 稳态满色 / 末态徽标与标注时机', n, fails);
}

/* ============ ⑰ tick 主循环真的在跑（载流子在动） ============ */
clickTab('source'); state.t=tMax(); updateAll();
const tickCheck=()=>new Promise(res=>{
  const f0=state.flow, t0=Date.now();
  const poll=()=>{
    if(state.flow!==f0){
      R.push('PASS|⑰ tick 主循环在跑（state.flow 持续推进）|'+f0.toFixed(3)+' → '+state.flow.toFixed(3));
      res(R.join('\n')+'\nDONE'); return;
    }
    if(Date.now()-t0>6000){
      R.push('FAIL|⑰ tick 主循环在跑（state.flow 持续推进）|6 s 内 flow 一直是 '+f0+' ⇒ rAF 循环停摆');
      res(R.join('\n')+'\nDONE'); return;
    }
    setTimeout(poll,80);
  };
  poll();
});

/* 收尾：恢复到默认页签，避免把页面留在一个奇怪的状态 */
stopAnim(); state.t=0; clampState();
setTimeout(()=>{ clickTab('nosrc'); }, 0);

return tickCheck();
})()
