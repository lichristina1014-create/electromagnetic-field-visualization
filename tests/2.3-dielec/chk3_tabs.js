(async()=>{
const R=[];
const T=(n,c,v)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(v===undefined?'':v));
const MTS=Array.from(document.querySelectorAll('#modeTabs button'));
const clickTab=k=>{ const b=MTS.find(x=>x.dataset.k===k); b.click(); return b; };
const LEAKSEL='.frm,.ex-body,.ex-note,.card-body,.panel,.coord-strip,.slider-group-label,header,.module-head,#legend,.cv-mode-tag,.sec-title,.sub-chips';
function domLeak(){
  let n=0, s='';
  document.querySelectorAll(LEAKSEL).forEach(el=>{ const t=el.innerText||'';
    if(t.indexOf('@{')>=0 || t.indexOf('**')>=0 || t.indexOf('undefined')>=0){ n++; if(!s) s=t.slice(0,80); } });
  return {n,s};
}
function zBad(){ return prims.filter(p=>!Number.isFinite(p.z)).length; }
/* ⚠️ 幂等判据必须**先 draw 一次**再量：切页签后 updateAll() 只置 needsRender、不触发 draw
   ⇒ prims 还是上一页签的场景（"59 / 176 / 176" 那次的 59 就是这么来的，是我判据写错，不是页面叠层）。 */
function idem(){ draw(); const a=prims.length; buildScene(); const b=prims.length; return [a,b]; }

/* ══════ 0. 全局：id 唯一性（2.2 踩过"重名 ⇒ getElementById 拿到靠前那个、点击由别人处理且不报错"）══════ */
const idMap={}; document.querySelectorAll('[id]').forEach(e=>{ idMap[e.id]=(idMap[e.id]||0)+1; });
const dup=Object.keys(idMap).filter(k=>idMap[k]>1);
T('全页 id 唯一（无重名）', dup.length===0, dup.length?('重复：'+dup.join(',')):('共 '+Object.keys(idMap).length+' 个 id'));

/* ══════ 1. 三页签逐个切：状态 / 图元 / 幂等 / 洁净 ══════ */
const EXPECT={dipole:'① 电偶极子的场', nofield:'② 无外场：两种介质', poling:'③ 加外场：极化过程'};
['dipole','nofield','poling'].forEach(k=>{
  const b=clickTab(k);
  T('切到 '+k+' 后 state.mode 正确', state.mode===k, 'mode='+state.mode);
  const on=MTS.filter(x=>x.classList.contains('on'));
  T('　页签高亮唯一且指向 '+k, on.length===1 && on[0].dataset.k===k,
    'on='+on.map(x=>x.dataset.k).join(',')||'(无)');
  T('　图元已生成', prims.length>0, 'prims='+prims.length);
  const [a,bb]=idem();
  T('　draw 后 buildScene 不叠层（幂等）', a===bb && a>0, a+' / '+bb);
  T('　图元 z 全有限', zBad()===0, 'bad='+zBad());
  const lk=domLeak();
  T('　DOM 无字面 @{ / ** / undefined', lk.n===0, 'leak='+lk.n+(lk.s?'  【'+lk.s+'】':''));
  const st=document.getElementById('coordStrip');
  T('　读数条有 chip', st && st.children.length>=5, 'chips='+(st?st.children.length:0));
  const mt=document.getElementById('modeTag');
  T('　模式标签非空且洁净', mt && mt.innerText.length>6 && mt.innerText.indexOf('@{')<0,
    '“'+(mt?mt.innerText.slice(0,46):'')+'”');
  /* 讲解卡：三张逐个点过去都要能渲染、且不泄标记 */
  const cts=Array.from(document.querySelectorAll('.card-tab'));
  T('　讲解卡 3 张', cts.length===3, cts.map(x=>x.textContent).join(' / '));
  let cardOK=true, cardBad='';
  cts.forEach(ct=>{ ct.click();
    const body=document.querySelector('.card-body .ex-body');
    if(!body || !body.innerText.trim()){ cardOK=false; cardBad='空卡'; }
    else if(/@\{|\*\*/.test(body.innerText)){ cardOK=false; cardBad=body.innerText.slice(0,60); }
  });
  T('　三张讲解卡逐个可渲染且无标记泄漏', cardOK, cardBad||'ok');
  T('　左侧目录 active 仍是 2.3', (()=>{const a=document.querySelector('.nav-item.active');
    return a&&a.textContent.indexOf('2.3')>=0;})(), (document.querySelector('.nav-item.active')||{}).textContent);
  /* 死文案：文案里提到的控件必须**在本页签真实存在**。
     本页踩过：② 的面板写"按 ▶ 播放全过程"，而 ▶ 只长在 ③ 上（点了找不到东西）。 */
  const ptxt=(document.getElementById('panel')||document.body).innerText||'';
  const claimsPlay=ptxt.indexOf('播放全过程')>=0, hasPlay=!!document.getElementById('btnPlay');
  const claimsNoField=ptxt.indexOf('回到无外场')>=0, hasNoField=!!document.getElementById('btnNoField');
  T('　文案提到的控件都存在（无"按 ▶"这类死文案）',
    claimsPlay===hasPlay && claimsNoField===hasNoField,
    '提▶='+claimsPlay+' 有▶='+hasPlay+'　提⏮='+claimsNoField+' 有⏮='+hasNoField);
  state.cardTab='1';
});

/* ══════ 2. 每页签的控件集合（该有的在、不该有的不在）══════ */
function ctlCounts(){
  return { d:!!document.getElementById('s_d'), E0:!!document.getElementById('s_E0'),
           play:!!document.getElementById('btnPlay'), noField:!!document.getElementById('btnNoField'),
           full:!!document.getElementById('btnFull') };
}
clickTab('dipole');   const cd=ctlCounts();
T('① 页签：只有 d 滑块，没有 E₀ 滑块/播放钮',
  cd.d && !cd.E0 && !cd.play && !cd.noField && !cd.full, JSON.stringify(cd));
clickTab('nofield');  const cn=ctlCounts();
T('② 页签：一个滑块都没有（"关键参数恰好等于 0"）',
  !cn.d && !cn.E0 && !cn.play, JSON.stringify(cn));
/* ② 的 @{E}₀ ≡ 0 ⇒ 两块介质根本没极化。
   ① 说明文字里若出现 '+σ_p' 就是把 ③ 的结论搬错了地方；
   ② 说明**只许有一段** —— 第一版在 ② 里并排放了两段同义文字（"还没极化/差别在微观"说两遍）。 */
{
  const notes=Array.from(document.querySelectorAll('#subSec .ex-note'));
  const nt=notes.map(e=>e.innerText).join(' ');
  T('② 的说明只有一段（不同义重复），且没有照搬 ③ 的 +σ_p 结论',
    notes.length===1 && nt.indexOf('+σ_p')<0 && nt.indexOf('还没有外加电场')>=0,
    'notes='+notes.length+'　含"还没有外加电场"='+(nt.indexOf('还没有外加电场')>=0)+
    '　含"+σ_p"='+(nt.indexOf('+σ_p')>=0));
}
clickTab('poling');   const cp=ctlCounts();
T('③ 页签：有 E₀ 滑块 + 播放 + 回到无外场 + 直接最强场',
  !cp.d && cp.E0 && cp.play && cp.noField && cp.full, JSON.stringify(cp));

/* ══════ 3. ③ 的按钮语义 ══════ */
document.getElementById('btnNoField').click();
T('「⏮ 回到无外场」⇒ g=0 且已停止播放', state.g===0 && !state.anim,
  'g='+state.g+'  anim='+(state.anim?'有':'null'));
document.getElementById('btnFull').click();
T('「⏭ 直接到最强场」⇒ g=1', state.g===1, 'g='+state.g);
/* 播放全过程：必须**单调不减**地走完，且结束在 g=1 */
state.g=0; state.anim={u:0,playing:true};
let prev=-1e-9, mono=true, steps=0, last='';
for(;;){ const r=stepAnim(0.05); steps++;
  if(state.g<prev-1e-12) mono=false; prev=state.g;
  if(r!==true){ last=String(r); break; }
  if(steps>500){ last='未收敛'; break; } }
T('「▶ 播放全过程」单调推进到 g=1（不回头、不卡死）',
  mono && Math.abs(state.g-1)<1e-12 && last==='end', 'steps='+steps+'  g='+state.g.toFixed(6)+'  ret='+last);
T('播放起点确实从 g=0 开始（PH_FIELD 前不极化）',
  Math.abs(animG(0))<1e-12 && Math.abs(animG(PH_FIELD[0]))<1e-12 && Math.abs(animG(1)-1)<1e-12,
  'g(0)='+animG(0)+'  g('+PH_FIELD[0]+')='+animG(PH_FIELD[0])+'  g(1)='+animG(1));

/* ══════ 4. ① 的 d 滑块：两个极端都要能画全 ══════ */
clickTab('dipole');
const sl=document.getElementById('s_d');
function setD(v){ sl.value=v; sl.dispatchEvent(new Event('input')); }
let dOK=true, dMsg=[];
[parseFloat(sl.min), 0.22, parseFloat(sl.max)].forEach(v=>{
  setD(v);
  const L=dipLines().filter(t=>!t.axis);
  let rmaxAll=0, nan=0;
  L.forEach(t=>t.pts.forEach(p=>{ const r=vlen(p); if(r>rmaxAll)rmaxAll=r;
    if(!Number.isFinite(r)) nan++; }));
  const hit=L.filter(t=>t.hit).length;
  /* ⚠️ 别要求 L.length === DIP_RMAX.length：d 大时 d/2 逼近最内那条的目标 r_max，
     目标 ≤ d/2 的线**物理上不存在**（alphaForRmax 返回 NaN，dipLines 会滤掉）。
     d=0.34 ⇒ d/2=0.17 ⇒ 只有 5 条（0.90/0.62/0.43/0.29/0.195）。这是对的，不是漏画。 */
  const exp=DIP_RMAX.filter(r=>r>v/2+1e-9).length;
  const ok=hit===L.length && L.length===exp && nan===0 && rmaxAll<0.95;
  if(!ok) dOK=false;
  dMsg.push('d='+v.toFixed(2)+' → '+hit+'/'+L.length+' 闭合（预期 '+exp+' 条）, rmax='+rmaxAll.toFixed(3));
});
T('① d 取两个端点：存在的那几条都闭合、无 NaN、最远不超出画面', dOK, dMsg.join(' ｜ '));
T('① 滑块端点与 DIP_D_RANGE 一致',
  Math.abs(parseFloat(sl.min)-DIP_D_RANGE[0])<1e-9 && Math.abs(parseFloat(sl.max)-DIP_D_RANGE[1])<1e-9,
  '['+sl.min+','+sl.max+'] vs ['+DIP_D_RANGE[0]+','+DIP_D_RANGE[1]+']');
setD(0.22);

/* ══════ 5. 显示开关：**不许全关**（① 全关会得到 prims=0 的纯白画布），且全关尝试后仍不崩 ══════ */
function visChips(){ return Array.from(document.querySelectorAll('#subSec .sub-chips button[data-k]')); }
function tryBlankOut(mode){
  clickTab(mode);
  let refused=0, toastTxt='';
  for(let i=0;i<12;i++){                              /* 每次点击都会 renderPanel 重建 DOM ⇒ 必须重新查 */
    const on=visChips().filter(b=>b.classList.contains('on'));
    if(on.length===0) break;
    if(on.length===1){ const t=document.getElementById('toast');
      refused++; on[0].click(); toastTxt=(t&&t.classList.contains('show'))?t.textContent:''; break; }
    on[0].click();
  }
  draw();
  const stillOn=visChips().filter(b=>b.classList.contains('on')).length;
  return {refused, toastTxt, stillOn, prims:prims.length, zbad:zBad()};
}
const bl1=tryBlankOut('dipole'), bl3=tryBlankOut('poling');
T('① 「全关」被守卫拒绝：至少留一层、图元不为 0、无 NaN',
  bl1.stillOn>=1 && bl1.prims>0 && bl1.zbad===0 && bl1.refused>=1,
  '剩下 '+bl1.stillOn+' 层 · prims='+bl1.prims+' · 拒绝 '+bl1.refused+' 次 · toast=“'+bl1.toastTxt+'”');
T('③ 同样留给守卫不留白（三页签行为一致）',
  bl3.stillOn>=1 && bl3.prims>0 && bl3.zbad===0, '剩下 '+bl3.stillOn+' 层 · prims='+bl3.prims);
T('拒绝时确实弹了提示（#toast 不再是死元素）', bl1.toastTxt.length>0, '“'+bl1.toastTxt+'”');

/* ══════ 6. 面板按钮与工具条按钮 id 不互撞（2.2 的根因坑）══════
   ⚠️ 本页**故意**不叫 btnReset（那是 2.2 工具条的 id）⇒ 这里不能要求它存在，
      要断言的是"工具条那个用的是一个**独占**的 id，且全页没有第二个同名元素"。 */
T('工具条复位按钮 id 独占、且没有沿用 2.2 的 btnReset',
  document.querySelectorAll('[id="btnViewReset"]').length===1 &&
  document.getElementById('btnViewReset')===document.getElementById('btnViewReset') &&
  document.getElementById('btnReset')===null,
  'btnViewReset ×1 · btnReset 不存在（不与 2.2 撞名）');
T('复位视角真的把相机拉回默认位姿', (()=>{
  cam.az=1.9; cam.el=-0.9; cam.zoom=2.4; cam.px=77; cam.py=-33;
  document.getElementById('btnViewReset').click();
  return Math.abs(cam.az-0.62)<1e-9 && Math.abs(cam.el-0.40)<1e-9 &&
         cam.zoom===1 && cam.px===0 && cam.py===0; })());

/* ══════ 7. 实时数据条开关 ══════ */
clickTab('dipole');
const cb=document.getElementById('showReadoutCb');
cb.checked=false; cb.onchange({target:cb});
T('取消勾选 ⇒ 读数条清空', document.getElementById('coordStrip').children.length===0);
cb.checked=true; cb.onchange({target:cb});
T('重新勾选 ⇒ 读数条恢复', document.getElementById('coordStrip').children.length>=5,
  'chips='+document.getElementById('coordStrip').children.length);

/* ══════ 8. 逐页签再扫一遍泄漏（含 ③ 独有的 polNote / ⏮⏭ 之后的文案）══════ */
['dipole','nofield','poling'].forEach(k=>{
  clickTab(k);
  document.getElementById('btnNoField') && document.getElementById('btnNoField').click();
  document.getElementById('btnFull') && document.getElementById('btnFull').click();
  const lk=domLeak();
  T('切到 '+k+' 并切换按钮后仍无标记泄漏', lk.n===0, 'leak='+lk.n+(lk.s?'  【'+lk.s+'】':''));
});
clickTab('poling'); state.g=1; updateAll();
/* 收尾：把显示开关全恢复（state.show 是三页签共用的一个对象，别把改动留给后面的检查） */
Object.keys(state.show).forEach(k=>state.show[k]=true);
clickTab('dipole'); draw();
return R.join('\n')+'\nDONE';
})()
