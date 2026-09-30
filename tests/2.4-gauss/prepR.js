/* ③ 复现用户 2026-09-30 20:48 那张截图：q₁=+2（球心）、q₃=+1、q₄=0、R=0.360、P=(79°,27°)
   ⚠️ 顺序必须是【先切页签、再改 state、再 renderPanel】：setMode() 会重置 state。 */
(()=>{
  const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k==='allfield');
  if(!b) return 'R: 找不到 allfield 页签';
  b.click();
  state.q=[2,0,1,0]; state.R=0.360; state.Pth=79; state.Pph=27;
  renderPanel(); updateAll();
  const c=document.querySelector('#subSec .chip[data-k="dec"]');
  if(c && !c.classList.contains('on')) c.click();
  return 'R ok q='+state.q.join(',')+' R='+state.R+' P=('+state.Pth+'°,'+state.Pph+'°)'
       +' dec='+(c?c.classList.contains('on'):'?');
})()
