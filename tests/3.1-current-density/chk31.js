/* 3.1 电流的分类 —— 页面内自检
   跑法：bash tests/run_suite.sh 3.1-current-density.htm \
         "typeof state!=='undefined' && typeof buildScene==='function'" \
         tests/3.1-current-density/chk31.js
   ⚠️ 断言条数只取实跑的 ^PASS| 行数（grep 'T(' 会命中 helper ⇒ 偏多）。
   ⚠️ 画在 canvas 上的串 innerText 抓不到 ⇒ ⑧ 用插桩扫 text/textScreen/txt。 */
(()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
const near=(a,b,eps)=>{ eps=(eps==null?1e-9:eps); return Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)); };
function clickTab(k){ const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k===k); if(b) b.click(); return !!b; }
const MODES=['volume','surface','line'];

/* ============ ① 单位制：读数数值上就是 电荷密度×速度 ============ */
{
  const fails=[]; let n=0;
  for(const rho of [0.2,1.0,2.0,3.7,4.0]) for(const u of [1.0,4.0,8.0]){
    n++; state.mode='volume'; state.rho=rho; state.u=u;
    if(!near(Jval(),rho*u)) fails.push('ρ='+rho+' u='+u+' J='+Jval()+' ≠ '+(rho*u));
  }
  for(const sig of [0.2,1.0,2.0,3.7,4.0]) for(const u of [1.0,4.0,8.0]){
    n++; state.mode='surface'; state.sig=sig; state.u=u;
    if(!near(Kval(),sig*u)) fails.push('σ='+sig+' u='+u+' K='+Kval()+' ≠ '+(sig*u));
  }
  for(const tau of [0.2,1.0,2.0,3.7,4.0]) for(const u of [1.0,4.0,8.0]){
    n++; state.mode='line'; state.tau=tau; state.u=u;
    if(!near(Ival(),tau*u)) fails.push('τ='+tau+' u='+u+' I='+Ival()+' ≠ '+(tau*u));
  }
  group('① J=ρ·u / K=σ·u / I=τ·u（15×3 组，数值严格相等）', n, fails);
}

/* ============ ② 载流子计数 ≡ 解析式（本页的叙事地基） ============
   "单位时间垂直穿过的载流子数 × 每个载流子的电荷" 必须与解析公式**严格相等**：
     ① 整截面 rateV·qV·1e3 === J·πa²
     ① 面元   fracV·rateV·qV·1e3 === J·dS·cosθ
     ② 整线   rateS·qS·1e3 === K·2πb
     ② 线元   fracS·rateS·qS·1e3 === K·dl
     ③ 整点   rateL·qL·1e3 === τ·u                                            */
{
  const fails=[]; let n=0;
  state.mode='volume';
  for(const a of [0.16,0.25,0.34]) for(const dS of [0.004,0.008,0.012]) for(const th of [0,30,80]){
    n++; state.a=a; state.dS=dS; state.th=th;
    const lhs=rateV()*qCarrierV(state.rho,state.a)*1e3, rhs=ItotV();
    if(!near(lhs,rhs,1e-12)) fails.push('①整截面 a='+a+' '+lhs+' ≠ '+rhs);
    const l2=fracV()*rateV()*qCarrierV(state.rho,state.a)*1e3, r2=IelemV();
    if(!near(l2,r2,1e-12)) fails.push('①面元 a='+a+' dS='+dS+' θ='+th+' '+l2+' ≠ '+r2);
  }
  state.mode='surface';
  for(const b of [0.20,0.30,0.40]) for(const dl of [0.05,0.30,1.20]){
    n++; state.b=b; state.dl=dl;
    if(!near(rateS()*qCarrierS(state.sig,state.b)*1e3, ItotS(),1e-12))
      fails.push('②整线 b='+b+' '+rateS()*qCarrierS(state.sig,state.b)*1e3+' ≠ '+ItotS());
    if(!near(fracS()*rateS()*qCarrierS(state.sig,state.b)*1e3, IelemS(),1e-12))
      fails.push('②线元 b='+b+' dl='+dl);
  }
  state.mode='line'; n++;
  if(!near(rateL()*qCarrierL(state.tau)*1e3, Ival(),1e-12))
    fails.push('③整点 '+rateL()*qCarrierL(state.tau)*1e3+' ≠ '+Ival());
  group('② 载流子计数 ≡ 解析式（①整截面/①面元/②整线/②线元/③整点）', n, fails);
}

/* ============ ③ 面元几何：整个滑块量程 × 极端半径 ⇒ 整块落在圆盘内 ============ */
{
  const fails=[]; let n=0;
  state.mode='volume';
  for(const a of [A_R_RANGE[0],A_R_RANGE[1]]) for(let dS=DS_RANGE[0]; dS<=DS_RANGE[1]+1e-9; dS+=0.001){
    n++; state.a=a; state.dS=dS;
    if(!elemFits()) fails.push('a='+a+' dS='+dS.toFixed(3)+' 面元越出圆盘');
    /* 四个角点到轴距离都要 ≤ a */
    for(const c of elemCorners()) if(Math.hypot(c.x,c.y)>a+1e-9) fails.push('角点越界 a='+a+' dS='+dS.toFixed(3));
  }
  group('③ 面元整块落在横截面内（量程两端 × 全部 dS 步进）', n, fails);
}

/* ============ ④ 角度因子 cosθ ============ */
{
  const fails=[]; let n=0;
  state.mode='volume'; state.a=0.30; state.dS=0.008; state.th=0;
  const base=IelemV();
  for(const th of [0,15,30,45,60,80]){
    n++; state.th=th;
    if(!near(IelemV(), base*Math.cos(th*D2R),1e-12)) fails.push('θ='+th+' IelemV='+IelemV()+' 期望 '+(base*Math.cos(th*D2R)));
    if(!near(state.dS*Math.cos(th*D2R), state.dS*Math.cos(th*D2R))) fails.push('dS⊥ 自身不一致');
  }
  n++; state.th=90;
  if(Math.abs(IelemV())>1e-15) fails.push('θ=90° 应恰好为 0，得 '+IelemV());
  if(Math.abs(fracV())>1e-15) fails.push('θ=90° 占比应恰好为 0，得 '+fracV());
  state.th=0;
  group('④ 穿过面元的电流 = J·dS·cosθ（θ=90° 恰好为 0）', n, fails);
}

/* ============ ⑤ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  MODES.forEach(m=>{
    state.mode=m;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push(m+' buildScene 不幂等：'+n1+' → '+n2+'（每次重绘叠了一层？)');
    if(n1<3) fails.push(m+' 图元太少：'+n1);
    if(!z1.every(Number.isFinite)) fails.push(m+' prims 里有非有限深度（裸 pt() 漏了 .d ⇒ 排序静默失效）');
    if(!z2.every(Number.isFinite)) fails.push(m+' 第二次 prims 里有非有限深度');
    R.push('DATA|⑤ '+m+' 图元数（两遍）|'+n1+' / '+n2);
  });
  group('⑤ buildScene 幂等 + prims 深度有限（3 页签 × 2 遍）', 6, fails);
}

/* ============ ⑥ state.show 的键与 SHOW_ITEMS 逐字对齐 ============
   ⚠️ 真踩过：写成 {vol,car,elem,slab,nrm,box,line,dot,ladder}，
      sec/arc/wire 全是 undefined ⇒ 横截面、横截线、导线**一层都画不出来**，
      而页面不报任何错。这里把"每个显示项在 state.show 里都有布尔值"钉死。 */
{
  const fails=[]; let n=0;
  MODES.forEach(m=>{
    (SHOW_ITEMS[m]||[]).forEach(it=>{
      n++;
      const v=state.show[it.k];
      if(typeof v!=='boolean') fails.push(m+' 的显示项 '+it.k+' 在 state.show 里是 '+typeof v+'（'+v+'）');
    });
  });
  /* 反向：state.show 里不该有 SHOW_ITEMS 从不引用的死键 */
  const used=new Set(); MODES.forEach(m=>(SHOW_ITEMS[m]||[]).forEach(it=>used.add(it.k)));
  Object.keys(state.show).forEach(k=>{ n++; if(!used.has(k)) fails.push('state.show.'+k+' 是死键（没有任何页签用它）'); });
  group('⑥ state.show 键 ↔ SHOW_ITEMS 逐字对齐（无 undefined 开关、无死键）', n, fails);
}

/* ============ ⑦ 载流子位置归一到 [−L/2, L/2) ============ */
{
  const fails=[]; let n=0;
  for(const m of MODES) for(const drift of [0,0.13,0.5,0.999,3.7,1e5,-0.4]){
    n++; state.mode=m; state.drift=drift;
    const L=(m==='volume'?A_L:(m==='surface'?B_L:C_L));
    const base=(m==='volume'?BASE_V:(m==='surface'?BASE_S:BASE_L));
    const rad=(m==='volume'?state.a:(m==='surface'?state.b:0));
    for(const b0 of base){
      const p=carrierPos(rad,b0,L);
      if(!(p.z>=-L/2-1e-9 && p.z<L/2-1e-9)) { fails.push(m+' drift='+drift+' z='+p.z+' 越出 [−L/2,L/2)'); break; }
      if(!isFinite(p.x)||!isFinite(p.y)) { fails.push(m+' 位置非有限'); break; }
      if(Math.hypot(p.x,p.y)>rad+1e-9) { fails.push(m+' 径向越界 '+Math.hypot(p.x,p.y)+' > '+rad); break; }
    }
  }
  state.drift=0;
  group('⑦ 载流子位置归一到 [−L/2, L/2) 且径向不越界（3 页签 × 6 个 drift）', n, fails);
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
  MODES.forEach(m=>{
    clickTab(m);
    seen+=scanDom('tab:'+m, fails);
    const n=document.querySelectorAll('#panel .card-tab').length;
    if(n!==3) fails.push('页签 '+m+' 讲解卡应有 3 张，实有 '+n);
    for(let i=0;i<n;i++){
      try{ document.querySelectorAll('#panel .card-tab')[i].click(); }
      catch(e){ fails.push('card '+m+'#'+i+' 抛异常：'+e.message); }
      cards++;
      seen+=scanDom('card:'+m+':'+i, fails);
    }
  });
  R.push('DATA|⑧ 扫查规模|讲解卡 '+cards+' 张　扫到容器 '+seen+' 个');
  group('⑧ 全页签 × 全讲解卡：无 @{ / undefined / 字面星号', cards, fails);
}

/* ============ ⑨ 画布文本插桩扫查（innerText 抓不到 canvas 上的串） ============
   ⚠️ 三个函数的 str 下标不同：txt→2、text→1、textScreen→2。写错 ⇒ 误报"非字符串 number"。
   ⚠️ parseRich(undefined) **不抛异常**（静默排版成 "undefined"）⇒ 必须插桩，不能靠异常。 */
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
      state.mode=m;
      /* 全开一遍 + 全关一遍（"逐层全关"要守卫，见 chk_guard） */
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
      buildScene(); drawOverlays();
      Object.keys(state.show).forEach(k=>{ state.show[k]=true; });
    });
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

/* ============ ⑪ 按钮取值不越界、且与滑块显示严格同步 ============
   ⚠️ 给"预设按钮把量设到量程外"这类**静默** bug 准备的：
      input[type=range] 自己 clamp 显示、state 不 clamp ⇒ 滑块显示 ≠ 真实状态，不报任何错。
   ⚠️ 每点一次 renderPanel() 会重建 #subSec ⇒ 必须**每次重新查 DOM**。 */
{
  const fails=[]; let n=0;
  const RG ={rho:RHO_RANGE,sig:SIG_RANGE,tau:TAU_RANGE,u:U_RANGE,
             a:A_R_RANGE,b:B_R_RANGE,dS:DS_RANGE,th:TH_RANGE,dl:DL_RANGE};
  const GET={rho:()=>state.rho,sig:()=>state.sig,tau:()=>state.tau,u:()=>state.u,
             a:()=>state.a,b:()=>state.b,dS:()=>state.dS,th:()=>state.th,dl:()=>state.dl};
  MODES.forEach(m=>{
    clickTab(m);
    const count=document.querySelectorAll('#subSec button.chip').length;
    for(let bi=0; bi<count; bi++){
      const b=document.querySelectorAll('#subSec button.chip')[bi];
      if(!b) continue;
      n++;
      const lab=b.textContent.trim().slice(0,14);
      try{ b.click(); }catch(e){ fails.push(m+' 按钮「'+lab+'」抛异常 '+e.message); continue; }
      for(const k of Object.keys(GET)){
        const v=GET[k](), rg=RG[k];
        if(!(v>=rg[0]-1e-9 && v<=rg[1]+1e-9))
          fails.push(m+' 按钮「'+lab+'」把 '+k+' 设成 '+v+'，越出量程 ['+rg[0]+','+rg[1]+']');
        const el=document.getElementById('s_'+k);
        if(el && Math.abs(parseFloat(el.value)-v)>1e-9)
          fails.push(m+' 按钮「'+lab+'」后 '+k+'：滑块显示 '+el.value+' ≠ state '+v);
      }
    }
  });
  group('⑪ 按钮取值不越界、且与滑块显示同步', n, fails);
  R.push('DATA|⑪ 实际点击的按钮数|'+n);
}

/* ============ ⑫ 显示开关：守卫"至少留一层" + 全关不空 ============ */
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
      if(on<1) fails.push('页签 '+m+' 关掉 '+k+' 之后**一层都不剩**（画布会纯白）');
      const c2=document.querySelector(sel);
      if(c2 && !c2.classList.contains('on')){ try{ c2.click(); }catch(e){ fails.push('chip '+k+' 二次点击抛异常'); } }
    });
    /* 全开之后 buildScene 必须有图元 */
    Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
    buildScene();
    if(prims.length<3) fails.push('页签 '+m+' 全开时图元只有 '+prims.length+' 个');
  });
  group('⑫ 显示开关守卫（至少留一层）+ 全开有图元', n, fails);
}

/* ============ ⑬ 三级阶梯只在 ③ 画 ============ */
{
  const fails=[]; const calls=[];
  const ODL=drawLadder; drawLadder=function(){ calls.push(state.mode); return ODL(); };
  try{
    MODES.forEach(m=>{ state.mode=m; Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; }); buildScene(); });
  } finally { drawLadder=ODL; }
  MODES.forEach(m=>{
    const c=calls.filter(x=>x===m).length;
    if(m==='line'){ if(c<1) fails.push('③ 页应画三级阶梯，实际 0 次'); }
    else if(c>0) fails.push(m+' 页不该画三级阶梯，实际 '+c+' 次');
  });
  group('⑬ 三级阶梯只在 ③ 页绘制', 3, fails);
  R.push('DATA|⑬ drawLadder 调用|'+MODES.map(m=>m+':'+calls.filter(x=>x===m).length).join(' '));
}

/* ============ ⑭ 数据条读数与物理量一致 ============ */
{
  const fails=[]; let n=0;
  const strip=document.getElementById('coordStrip');
  MODES.forEach(m=>{
    clickTab(m); n++;
    const t=strip.innerText||'';
    const want=(m==='volume'?Jval().toFixed(2)+' nA/m²':(m==='surface'?Kval().toFixed(2)+' nA/m':Ival().toFixed(2)+' nA'));
    if(t.indexOf(want)<0) fails.push(m+' 数据条里找不到 「'+want+'」　实际：'+t.slice(0,120).replace(/\n/g,' | '));
    if(t.indexOf('undefined')>=0) fails.push(m+' 数据条有 undefined');
    if(t.indexOf('@{')>=0) fails.push(m+' 数据条泄漏 @{');
    if(t.indexOf('**')>=0) fails.push(m+' 数据条有字面星号');
  });
  group('⑭ 数据条读数与 Jval()/Kval()/Ival() 一致', n, fails);
}

/* ============ ⑮ 页签切换：preset 装载 + 相机复位 + cardTab 复位 ============ */
{
  const fails=[]; let n=0;
  /* 先弄脏 */
  state.mode='volume'; state.rho=3.7; state.a=0.20; state.th=70; cam.az=1.9; cam.el=-1.0; cam.px=80; state.cardTab='3';
  clickTab('surface'); n++;
  if(Math.abs(state.sig-PRESET.surface.sig)>1e-12) fails.push('切到 ② 后 σ 应是预设 '+PRESET.surface.sig+'，得 '+state.sig);
  if(Math.abs(state.b-PRESET.surface.b)>1e-12) fails.push('切到 ② 后 b 应是预设 '+PRESET.surface.b+'，得 '+state.b);
  if(state.cardTab!=='1') fails.push('切页签后 cardTab 应复位为 1，得 '+state.cardTab);
  if(Math.abs(cam.az-0.62)>1e-12||Math.abs(cam.el-0.40)>1e-12||cam.px!==0) fails.push('切页签后相机未复位');
  clickTab('line'); n++;
  if(Math.abs(state.tau-PRESET.line.tau)>1e-12) fails.push('切到 ③ 后 τ 应是预设 '+PRESET.line.tau+'，得 '+state.tau);
  if(state.cardTab!=='1') fails.push('③ cardTab 未复位');
  clickTab('volume'); n++;
  if(Math.abs(state.rho-PRESET.volume.rho)>1e-12) fails.push('切回 ① 后 ρ 应是预设 '+PRESET.volume.rho+'，得 '+state.rho);
  if(Math.abs(state.dS-PRESET.volume.dS)>1e-12) fails.push('切回 ① 后 dS 应是预设 '+PRESET.volume.dS+'，得 '+state.dS);
  if(state.th!==0) fails.push('切回 ① 后 θ 应回 0，得 '+state.th);
  group('⑮ 页签切换：preset 装载 / cardTab 复位 / 相机复位', n, fails);
}

/* ============ ⑯ 画布与数据条布局：没被裁、数据条在卡片内 ============
   ⚠️ cdpshot/cdpeval 只在导航时量一次 canvas ⇒ 截图验不了窄布局，
      响应式只能靠**包围盒数学断言**。 */
{
  const fails=[]; let n=0;
  const cv=document.getElementById('cv').getBoundingClientRect();
  const card=document.getElementById('cv').closest('.canvas-card').getBoundingClientRect();
  const strip=document.getElementById('coordStrip').getBoundingClientRect();
  n++; if(cv.width<200) fails.push('画布宽度只有 '+cv.width+' px');
  n++; if(cv.height<200) fails.push('画布高度只有 '+cv.height+' px');
  n++; if(Math.abs(cv.bottom+strip.height-card.bottom)>1.5) fails.push('数据条底边 '+strip.bottom+' 与卡片底边 '+card.bottom+' 不齐（画布被裁？）');
  n++; if(strip.height<1) fails.push('数据条高度为 0（读数没显示？）');
  n++; if(cv.right>card.right+1) fails.push('画布右缘越出卡片');
  /* 信息卡不能压到画布左边（HUD 安全区） */
  n++;
  const cardX=document.getElementById('legend').getBoundingClientRect();
  if(cardX.left<cv.left-1) fails.push('图例越出画布左缘');
  R.push('DATA|⑯ 包围盒|canvas '+Math.round(cv.width)+'×'+Math.round(cv.height)+'　数据条高 '+Math.round(strip.height)+'　卡片 '+Math.round(card.width)+'×'+Math.round(card.height));
  group('⑯ 画布未被裁、数据条在卡片内、图例不越界', n, fails);
}

/* ============ ⑰ tick 主循环真的在跑（载流子在动） ============
   ⚠️ **不能同步等**：rAF 是宏任务，同步 while 轮询会把事件循环堵死，
      等完 drift 必然还是原值 ⇒ 假失败。cdpeval 用 awaitPromise:true 求值
      ⇒ 这里返回一个 Promise，靠 setTimeout 轮询。 */
const tickCheck=()=>new Promise(res=>{
  const d0=state.drift, t0=Date.now();
  const poll=()=>{
    if(state.drift!==d0){
      R.push('PASS|⑰ tick 主循环在跑（state.drift 持续推进）|'+d0+' → '+state.drift);
      R.push('DATA|⑰ drift|'+d0+' → '+state.drift);
      res(R.join('\n')+'\nDONE'); return;
    }
    if(Date.now()-t0>6000){
      R.push('FAIL|⑰ tick 主循环在跑（state.drift 持续推进）|6 s 内 drift 一直是 '+d0+' ⇒ rAF 循环停摆（画面会卡住）');
      res(R.join('\n')+'\nDONE'); return;
    }
    setTimeout(poll,80);
  };
  poll();
});

/* 收尾：恢复到默认页签，避免把页面留在一个奇怪的状态 */
clickTab('volume'); state.rho=PRESET.volume.rho; state.u=PRESET.volume.u; state.a=PRESET.volume.a;
state.dS=PRESET.volume.dS; state.th=PRESET.volume.th; state.drift=0; clampState();
renderPanel(); updateAll();

return tickCheck();
})()
