(async()=>{
const R=[];
const T=(n,c,v)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(v===undefined?'':v));

T('脚本已执行到末段（state 存在）', typeof state!=='undefined', typeof state!=='undefined'?('mode='+state.mode):'');
T('页签 3 个', document.querySelectorAll('#modeTabs button').length===3,
  Array.from(document.querySelectorAll('#modeTabs button')).map(b=>b.textContent).join(' / '));
T('图元已生成（prims>0）', prims.length>0, 'prims='+prims.length);
T('坐标条有读数', document.getElementById('coordStrip').children.length>0,
  'chips='+document.getElementById('coordStrip').children.length);
T('面板有讲解卡', document.querySelectorAll('.card-tab').length>0,
  'cards='+document.querySelectorAll('.card-tab').length);
T('左侧目录有 2.3 且 active', (()=>{const a=document.querySelector('.nav-item.active');return a&&a.textContent.indexOf('2.3')>=0;})(),
  (document.querySelector('.nav-item.active')||{}).textContent);

/* 幂等：buildScene 两次图元数不增长 */
const n1=prims.length; buildScene(); const n2=prims.length; buildScene(); const n3=prims.length;
T('buildScene 幂等（不叠层）', n1===n2 && n2===n3, n1+' / '+n2+' / '+n3);

/* z 无 NaN，且不为 undefined（pt() 裸点没有 .d） */
const bad=prims.filter(p=>!Number.isFinite(p.z)).length;
T('所有图元 z 有限（无 NaN/undefined）', bad===0, 'bad='+bad);

/* DOM 扫查：不允许出现字面 @{ 或 ** */
let leak=0, sample='';
document.querySelectorAll('.frm,.ex-body,.ex-note,.card-body,.panel,.coord-strip,.slider-group-label,header,.module-head,#legend,.cv-mode-tag')
 .forEach(el=>{ const t=el.innerText||'';
   if(t.indexOf('@{')>=0 || t.indexOf('**')>=0){ leak++; if(!sample) sample=t.slice(0,90); } });
T('DOM 内无字面 @{ 与 **', leak===0, 'leak='+leak+(sample?'  【'+sample+'】':''));

/* chip 里不许出现 undefined */
let und=0;
document.querySelectorAll('#panel .chip').forEach(b=>{ if((b.textContent||'').indexOf('undefined')>=0) und++; });
T('#panel 的 chip 无 undefined', und===0, 'n='+und);

T('相机可用 camScale', Number.isFinite(camScale) && camScale>10, 'camScale='+camScale.toFixed(1)+'  W×H='+W+'×'+H);
return R.join('\n')+'\nDONE';
})()
