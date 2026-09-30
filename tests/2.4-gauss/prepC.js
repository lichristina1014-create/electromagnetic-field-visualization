/* ③ 任意一点的场：切页签 + 打开"P 点场分解" */
(()=>{
  const tabs=Array.from(document.getElementById('modeTabs').children);
  const b=tabs.find(x=>x.dataset.k==='allfield');
  if(!b) return 'C: 找不到 allfield 页签';
  b.click();
  const c=document.querySelector('#subSec .chip[data-k="dec"]');
  if(c && !c.classList.contains('on')) c.click();
  return 'C ok mode='+state.mode+' dec='+(c?c.classList.contains('on'):'?')
       +' q='+state.q.join(',')+' R='+state.R;
})()
