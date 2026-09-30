/* ② 球外电荷：切页签 + 打开"球面 E·n 采样"（要看"进进出出"的箭头） */
(()=>{
  const tabs=Array.from(document.getElementById('modeTabs').children);
  const b=tabs.find(x=>x.dataset.k==='outside');
  if(!b) return 'B: 找不到 outside 页签';
  b.click();
  const c=document.querySelector('#subSec .chip[data-k="flux"]');
  if(c && !c.classList.contains('on')) c.click();
  return 'B ok mode='+state.mode+' flux='+(c?c.classList.contains('on'):'?')
       +' q='+state.q.join(',')+' R='+state.R;
})()
