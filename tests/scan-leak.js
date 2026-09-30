(()=>{
  const SKIP={SCRIPT:1,STYLE:1,HEAD:1,TITLE:1,NOSCRIPT:1,TEMPLATE:1,META:1,LINK:1,HTML:1};
  const bad=[]; let scans=0; const seen=new Set();
  const add=(tag,el,s,kind)=>{
    const t=tag+' '+kind+' <'+el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+
            (el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:'')+'> → '+s;
    if(seen.has(t)) return; seen.add(t); bad.push(t);
  };
  const scan=(tag)=>{
    scans++;
    document.querySelectorAll('body *').forEach(el=>{
      if(SKIP[el.tagName]) return;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0') return;
      const s=el.innerText||'';
      if(!s) return;
      if(s.indexOf('@{')>=0) add(tag,el,s.slice(0,70).replace(/\n/g,' '),'LEAK');
      else if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) add(tag,el,s.slice(0,70).replace(/\n/g,' '),'UNDEF');
    });
  };
  const clickAll=(sel,tag)=>{
    const n=document.querySelectorAll(sel).length;
    for(let i=0;i<n;i++){
      const list=document.querySelectorAll(sel);
      const el=list[i]; if(!el) continue;
      try{ el.click(); }catch(e){}
      scan(tag+i);
    }
  };
  scan('初始');
  clickAll('#modeTabs > *','TAB');
  clickAll('#subSec .chip','CHIP');
  clickAll('#panel .card-tab','CARD');
  clickAll('#panel .chip','PCHIP');
  return '扫描次数='+scans+'　坏串='+bad.length+'\n'+bad.slice(0,20).join('\n')+(bad.length>20?'\n...':'\n')+'DONE';
})()
