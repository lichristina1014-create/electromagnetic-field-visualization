/* ① 球内电荷：默认视图 + 打开"球面 E·n 采样" */
(()=>{
  const q=s=>document.querySelector(s);
  const c=q('#subSec .chip[data-k="flux"]');
  if(c && !c.classList.contains('on')) c.click();
  return 'A ok flux='+(c?c.classList.contains('on'):'?');
})()
