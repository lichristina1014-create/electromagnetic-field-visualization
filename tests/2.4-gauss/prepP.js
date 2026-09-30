/* ③ 复现"用户质疑那张截图"的视图：q₁=+2（球心）、q₃=+2（球外）、q₄=0、R=0.310、P=(79°,27°)
   —— P 恰好落在 O–q₃ 连线上（两电荷之间），用来看"两支场矢量近反向"时场线长什么样。
   ⚠️⚠️ 顺序必须是【先切页签、再改 state、再 renderPanel】：setMode() 会重置 state，
      写在 click 之前的赋值会被悄悄冲掉（表现为读数与预期不符，不报错）。
   ⚠️ 切页签/改 state 后都要重新 renderPanel() 才能把滑块同步到新状态。 */
(()=>{
  const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k==='allfield');
  if(!b) return 'P: 找不到 allfield 页签';
  b.click();                                     /* ① 切页签（会重置 state） */
  state.q=[2,0,2,0]; state.R=0.310; state.Pth=79; state.Pph=27;   /* ② 再改 state */
  renderPanel(); updateAll();                    /* ③ 同步面板 */
  const c=document.querySelector('#subSec .chip[data-k="dec"]');
  if(c && !c.classList.contains('on')) c.click();
  return 'P ok mode='+state.mode+' dec='+(c?c.classList.contains('on'):'?')
       +' q='+state.q.join(',')+' R='+state.R+' P=('+state.Pth+'°,'+state.Pph+'°)';
})()
