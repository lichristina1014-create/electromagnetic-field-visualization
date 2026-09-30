(()=>{
const R=[];
const ok=(n,c,extra)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(extra==null?'':extra));
function group(name,n,fails){ R.push((fails.length?'FAIL|':'PASS|')+name+'|'+(n-fails.length)+'/'+n+(fails.length?('  ✗ '+fails.slice(0,3).join(' ; ')):'')); }
/* ⚠️ 必须连 _lastRot 一起清：fieldLines() 的搜索是"从上次命中的旋转开始、命中即 break"
   ⇒ 只清 _FL 的话，起点还留在上一组用例处，同样参数在不同测试顺序下会得到不同的
     旋转（净根数都是 16，但"穿出/穿入"的拆分不同）⇒ 自检输出不可复现。 */
function resetFL(){ _FL=null; _FLkey=''; _fluxC={key:'',v:0}; _lastRot=0; }
function clickTab(k){ const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k===k); if(b) b.click(); return !!b; }

/* ============ ① 净穿越根数 ≡ round(Q内/q₀)（本页的地基） ============ */
{
  const fails=[]; let n=0;
  const qs=[[0,0,0,0],[0.25,0,0,0],[0.5,0,0,0],[1,0,0,0],[2,0,0,0],[2,0.5,0,0],[2,-0.5,0,0],
            [2,0,2,-1],[2,0,2,2],[2,0,-2,0],[0.25,0,2,2],[2,-1,2,-2],[1,1,-2,-2],
            [2,0,0,-2],[0.75,0.5,1,-1]];
  for(const q of qs) for(const Rr of [0.24,0.36,0.38]){
    n++;
    state.q=q.slice(); state.R=Rr; resetFL();
    const want=Math.round(qInside()/Q0);
    const c=fieldLines().cross;
    if(c.net!==want) fails.push('q=['+q.join(',')+'] R='+Rr+' 期望 '+want+' 得 '+c.net);
  }
  group('① 净根数 === round(Q内/q₀)（15 组电荷 × 3 个半径）', n, fails);
}
/* 且 countCross 的 out−inn 与 net 自洽 */
{
  const fails=[];
  const qs=[[2,0,0,0],[2,0,2,-1],[2,0,2,2],[0,0,-2,2],[2,-1,2,-2]];
  for(const q of qs){ state.q=q.slice(); state.R=0.36; resetFL();
    const c=fieldLines().cross; if(c.out-c.inn!==c.net) fails.push('q='+q+' '+c.out+'-'+c.inn+'!='+c.net); }
  group('①b 穿出−穿入 === 净根数', qs.length, fails);
}

/* ============ ② 球外电荷 ⇒ 净根数不变、穿出/穿入同步增大 ============ */
{
  const fails=[];
  state.R=0.36;
  state.q=[2,0,0,0]; resetFL(); const a=fieldLines().cross;
  state.q=[2,0,2,-1]; resetFL(); const b=fieldLines().cross;
  state.q=[2,0,2,2]; resetFL(); const c=fieldLines().cross;
  state.q=[2,0,-2,-2]; resetFL(); const d=fieldLines().cross;
  const want=Math.round(qInside()/Q0);
  [['无球外',a],['q₃=2,q₄=−1',b],['q₃=2,q₄=2',c],['q₃=−2,q₄=−2',d]].forEach(([tag,x])=>{
    if(x.net!==want) fails.push(tag+' 净根数 '+x.net+'≠'+want);
  });
  if(!(b.out>a.out && b.inn>a.inn)) fails.push('球外 +2/−1 时穿出/穿入应同步增大：'+a.out+'/'+a.inn+' → '+b.out+'/'+b.inn);
  if(!(c.out>=b.out && c.inn>=b.inn)) fails.push('球外 +2/+2 时应继续增大：'+b.out+'/'+b.inn+' → '+c.out+'/'+c.inn);
  group('② 球外电荷 ⇒ 净根数不变（4 组）且穿入/穿出同步增大', 4+2, fails);
  R.push('DATA|② 穿出/穿入随球外电荷|无球外 '+a.out+'/'+a.inn+'　q₃=2,q₄=−1 '+b.out+'/'+b.inn+'　q₃=2,q₄=2 '+c.out+'/'+c.inn+'　q₃=−2,q₄=−2 '+d.out+'/'+d.inn);
}

/* ============ ③ 球面上 |E| 不均匀 / 通量却不变 ============ */
{
  const fails=[]; const GA2=Math.PI*(3-Math.sqrt(5));
  function sphereE(N){ const o=[0,0,0], out=[]; const Rr=state.R;
    for(let i=0;i<N;i++){ const z=1-(2*i+1)/N, r=Math.sqrt(Math.max(0,1-z*z)), th=GA2*i;
      const ux=r*Math.cos(th), uy=r*Math.sin(th), uz=z;
      fieldN(Rr*ux,Rr*uy,Rr*uz,o); out.push(Math.hypot(o[0],o[1],o[2])); } return out; }
  state.R=0.36;
  state.q=[2,0,0,0]; resetFL();
  const e0=sphereE(600), f0=fluxSumExact();
  state.q=[2,0,2,-1]; resetFL();
  const e1=sphereE(600), f1=fluxSumExact();
  state.q=[2,0,2,2]; resetFL();
  const e2=sphereE(600), f2=fluxSumExact();
  const ratio=a=>Math.max.apply(null,a)/Math.max(1e-12,Math.min.apply(null,a));
  const r0=ratio(e0), r1=ratio(e1), r2=ratio(e2);
  R.push('DATA|③ 球面上 |E| 的 max/min 比|无球外 '+r0.toFixed(3)+'　q₃=2,q₄=−1 '+r1.toFixed(3)+'　q₃=2,q₄=2 '+r2.toFixed(3));
  if(!(r0<1.001)) fails.push('只有球内电荷时 |E| 应处处相等，实测比 '+r0.toFixed(4));
  if(!(r1>1.5)) fails.push('有球外电荷时 |E| 应明显不均匀，实测比 '+r1.toFixed(4));
  if(!(r2>1.5)) fails.push('球外全正时应明显不均匀，实测比 '+r2.toFixed(4));
  const wantPhi=PHI_V(2);
  [[f0,'无球外'],[f1,'q₃=2,q₄=−1'],[f2,'q₃=2,q₄=2']].forEach(([f,tag])=>{
    const err=Math.abs(f-wantPhi)/Math.abs(wantPhi)*100;
    if(err>0.2) fails.push(tag+' 球面离散通量误差 '+err.toFixed(3)+'%');
  });
  R.push('DATA|③ 球面离散通量 Σ(E·n̂)ΔS vs 解析 Φ|'+
    [f0,f1,f2].map(v=>fmtSci(v)).join('　')+'　解析 '+fmtSci(wantPhi));
  group('③ |E| 不均匀（max/min>1.5）而 Φ 不变（误差<0.5%）', 6, fails);
  state.q=[2,0,Q3_0,Q4_0]; resetFL();
}

/* ============ ④ buildScene 幂等 + prims 深度无 NaN ============ */
{
  const fails=[];
  ['inside','outside','allfield'].forEach(m=>{
    state.mode=m;
    buildScene(); const n1=prims.length, z1=prims.map(p=>p.z);
    buildScene(); const n2=prims.length, z2=prims.map(p=>p.z);
    if(n1!==n2) fails.push(m+' buildScene 不幂等：'+n1+' → '+n2+'（每次重绘叠了一层？)');
    if(n1<3) fails.push(m+' 图元太少：'+n1);
    if(!z1.every(Number.isFinite)) fails.push(m+' prims 里有非有限深度');
    if(!z2.every(Number.isFinite)) fails.push(m+' 第二次 prims 里有非有限深度');
    R.push('DATA|④ '+m+' 图元数（两遍）|'+n1+' / '+n2);
  });
  state.mode='inside';
  group('④ buildScene 幂等 + prims 深度有限（3 页签 × 2 项）', 6, fails);
}

/* ============ ⑤ DOM 扫查：模板记号泄漏 / undefined 按钮 ============ */
/* ⚠️ `.module-title` 是 2026-09-30 补进来的：`#moduleSub`（标题右侧那行小字）当时**不在**这个清单里，
   而它恰恰是漏了 richHTML() 的那一处（modeTag 有 .cv-mode-tag 罩着，moduleSub 没有）
   ⇒ 自检全绿、用户却一眼看见字面 "|@{E}|"。**扫查清单漏项 = 空转通过。** */
const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
            '.module-title','.sec-title','.slider-row','.readout-toggle'];
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

/* ============ ⑥ 画布文本插桩扫查（进 canvas 的串 innerText 抓不到） ============ */
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
    ['inside','outside','allfield'].forEach(m=>{
      state.mode=m; resetFL();
      state.show.flux=true; buildScene(); drawOverlays();
      state.show.flux=false; buildScene(); drawOverlays();
    });
  } finally { text=O.text; textScreen=O.textScreen; txt=O.txt; }
  R.push('DATA|⑥ 画布文本扫到的坏串数量|'+bad.length+(bad.length?('　例：'+bad.slice(0,4).join(' ‖ ')):''));
  ok('⑥ 画布文本（text/textScreen/txt）无 undefined/NaN/字面星号', bad.length===0, bad.length+' 处');
}

/* ============ ⑦ 全页签 × 全控件 × 全讲解卡 ============ */
{
  const fails=[]; let clicked=0, tabs=0, cards=0, seen=0;
  ['inside','outside','allfield'].forEach(m=>{
    if(!clickTab(m)) fails.push('找不到页签 '+m);
    tabs++;
    seen+=scanDom('tab:'+m, fails);
    /* 每个显示开关点两遍（关—开），确保守卫与重渲染都不抛 */
    const ks=Array.from(document.querySelectorAll('#panel .chip[data-k]')).map(c=>c.dataset.k);
    if(ks.length<5) fails.push('页签 '+m+' 显示项只有 '+ks.length+' 个');
    ks.forEach(k=>{
      try{ document.querySelector('#panel .chip[data-k="'+k+'"]').click(); }
      catch(e){ fails.push('chip '+k+' 点击抛异常：'+e.message); }
      clicked++;
      const c2=document.querySelector('#panel .chip[data-k="'+k+'"]');
      if(c2 && !c2.classList.contains('on')){
        try{ c2.click(); }catch(e){ fails.push('chip '+k+' 二次点击抛异常：'+e.message); }
        clicked++;
      }
    });
    const n=document.querySelectorAll('#panel .card-tab').length;
    if(n<2) fails.push('页签 '+m+' 讲解卡只有 '+n+' 张');
    for(let i=0;i<n;i++){
      try{ document.querySelectorAll('#panel .card-tab')[i].click(); }
      catch(e){ fails.push('card '+m+'#'+i+' 抛异常：'+e.message); }
      cards++;
      seen+=scanDom('card:'+m+':'+i, fails);
    }
  });
  R.push('DATA|⑦ 扫查规模|页签 '+tabs+'　显示开关点击 '+clicked+' 次　讲解卡 '+cards+' 张　扫到容器 '+seen+' 个');
  group('⑦ 全页签 × 全控件 × 全讲解卡：无 @{ / undefined / 字面星号', tabs+cards, fails);
}

/* ============ ⑧ 全页 id 唯一 ============ */
{
  const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  const dup=ids.filter((v,i)=>ids.indexOf(v)!==i);
  group('⑧ 全页 id 唯一', 1, dup.length?['重复 id：'+Array.from(new Set(dup)).join(', ')]:[]);
  R.push('DATA|⑧ id 总数|'+ids.length);
}

/* ============ ⑨ 关键读数自洽（右侧卡片用的量） ============ */
{
  const fails=[];
  state.mode='outside'; state.q=[2,0,2,-1]; state.R=0.36; resetFL();
  const c=crossNow(), Qi=qInside(), Qo=qOutside();
  if(Math.abs(Qi-2)>1e-9) fails.push('Q内 应为 2.00，得 '+Qi);
  if(Math.abs(Qo-1)>1e-9) fails.push('Q外 应为 +1.00，得 '+Qo);
  if(c.net!==Math.round(Qi/Q0)) fails.push('净根数 '+c.net);
  if(Math.abs(PHI_V(Qi)-2.2588e5)/2.2588e5>1e-4) fails.push('Φ 数值异常 '+PHI_V(Qi));
  if(fmtSci(PHI_V(Qi))!=='2.259×10⁵') fails.push('fmtSci 输出异常 '+fmtSci(PHI_V(Qi)));
  state.mode='allfield'; buildScene();
  R.push('DATA|⑨ 默认 q₃=+2/q₄=−1|Q内='+sgnTxt(Qi,2)+' Q外='+sgnTxt(Qo,2)+' 穿出/穿入='+c.out+'/'+c.inn+' 净='+c.net);
  state.mode='inside'; state.q=[2,0,0,0]; resetFL(); renderPanel(); updateAll();
  group('⑨ 关键读数自洽（Q内/Q外/净根数/Φ/fmtSci）', 5, fails);
}

/* ============ ⑩ 每个按钮点完：取值不越界、且与滑块显示严格同步 ============
   ⚠️ 这条是给"量程收窄后忘了改预设按钮"这类**静默** bug 准备的（本页真踩过一次：
      "q₃=q₄=3"的按钮写在 Q_OUT_RANGE=[−2,2] 之后 ⇒ input[type=range] 自己 clamp 到 2，
      而 state.q 仍是 3 ⇒ 滑块显示与真实状态不一致，后续计算全用越界值，**不报任何错**）。
   ⚠️ 每点一次 renderPanel() 会重建整个 #subSec ⇒ 必须**每次重新查 DOM**，
      否则拿到的是已脱离文档的旧元素（click() 仍会触发 handler ⇒ 会误以为"覆盖了全部按钮"）。 */
{
  const fails=[]; let n=0;
  const RG ={q1:Q_IN_RANGE,q2:Q_IN2_RANGE,q3:Q_OUT_RANGE,q4:Q_OUT_RANGE,R:GS_R_RANGE,th:[0,180],ph:[0,360]};
  const GET={q1:()=>state.q[0],q2:()=>state.q[1],q3:()=>state.q[2],q4:()=>state.q[3],
             R:()=>state.R,th:()=>state.Pth,ph:()=>state.Pph};
  ['inside','outside','allfield'].forEach(m=>{
    clickTab(m);
    const count=document.querySelectorAll('#subSec button.chip').length;
    for(let bi=0; bi<count; bi++){
      const b=document.querySelectorAll('#subSec button.chip')[bi];
      if(!b) continue;
      n++;
      const lab=b.textContent.trim().slice(0,12);
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
  group('⑩ 按钮取值不越界、且与滑块显示同步', n, fails);
  R.push('DATA|⑩ 实际点击的按钮数|'+n);
}

return R.join('\n')+'\nDONE';
})()
