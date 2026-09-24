(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const leak=[], undef=[]; let nText=0, nEl=0;
function walk(el,path){
  if(el.nodeType===3){ nText++; const v=el.nodeValue;
    if(v.indexOf('@{')>=0) leak.push(path+'>'+v.trim().slice(0,46));
    if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(v)) undef.push(path+'>'+v.trim().slice(0,46));
  } else if(el.nodeType===1){
    if(el.tagName==='SCRIPT'||el.tagName==='STYLE') return;
    nEl++;
    Array.from(el.childNodes).forEach(c=>walk(c,path+'>'+el.tagName.toLowerCase()+(el.id?'#'+el.id:'')));
  }
}
const sweep=md=>{ ['panel','coordStrip','legend','modeTag'].forEach(id=>{
    const e=document.getElementById(id); if(e) walk(e, md+'|'+id); }); };
let nChip=0,nCard=0,nTab=0;
for(const md of ['build','concl','shield']){
  const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k===md);
  if(!tb){ T('页签存在 '+md,false); continue; }
  nTab++; tb.click();
  /* 逐个点掉所有显示 chip / 动作按钮（每次点击都会 renderPanel 重建 DOM ⇒ 必须重查） */
  for(let i=0;i<40;i++){
    const cs=Array.from(document.querySelectorAll('#panel .chip'));
    if(i>=cs.length) break;
    cs[i].click(); nChip++;
    sweep(md);
  }
  /* 逐个点掉所有讲解卡 */
  const cards=Array.from(document.querySelectorAll('#explainSec .card-tab'));
  nCard+=cards.length;
  for(let ci=0;ci<cards.length;ci++){
    const cs=Array.from(document.querySelectorAll('#explainSec .card-tab'));
    if(!cs[ci]) break;
    cs[ci].click();
    sweep(md);
  }
  tb.click();
  sweep(md);
}
walk(document.body,'body');
T('扫查覆盖面', nTab===3&&nChip>=20&&nCard===10&&nText>300,
  'tabs='+nTab+' chips='+nChip+' cards='+nCard+' textNodes='+nText+' els='+nEl);
T('无 @{ 字面泄漏', leak.length===0, 'n='+leak.length+(leak[0]?' 例:'+leak[0]:''));
T('无 undefined 字面', undef.length===0, 'n='+undef.length+(undef[0]?' 例:'+undef[0]:''));
/* 标题 / 副标题 / 画布标签的静态文案不能还是 2.1 的字 */
const mt=document.getElementById('moduleTitle').innerText,
      sb=document.getElementById('moduleSub').innerText,
      h1=document.querySelector('header h1').innerText;
T('模块标题=2.2', mt.indexOf('静电场中的导体')>=0, mt);
T('副标题随页签', sb.length>8, sb);
T('页头=2.2', h1.indexOf('2.2')>=0, h1);
/* 画布图例（lgTitle/lgNote）三个页签都要有 2.2 语义、且非空 */
let lgAll='', lgOk=true;
for(const md of ['build','concl','shield']){
  state.mode=md; renderPanel(); updateAll();
  const s=document.getElementById('lgTitle').innerText+document.getElementById('lgNote').innerText;
  if(s.length<12) lgOk=false;
  lgAll+=s;
}
T('三页签图例非空', lgOk&&lgAll.length>60, 'len='+lgAll.length);
T('图例含 2.2 关键词', /导体|静电|等位|屏蔽/.test(lgAll), lgAll.replace(/\n/g,' ').slice(0,70));
/* 每个页签的读数条都非空、且含该页签的关键串 */
let ok=true, inf=[];
for(const md of ['build','concl','shield']){
  state.mode=md; renderPanel(); updateAll();
  const s=document.getElementById('coordStrip').innerText;
  if(s.length<20){ ok=false; }
  inf.push(md+':'+s.length);
}
T('三页签读数条均非空', ok, inf.join(' '));
return R.join('\n')+'\nDONE';
})();
