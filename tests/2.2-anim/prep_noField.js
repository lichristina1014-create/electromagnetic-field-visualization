(async()=>{
 /* 按下「⏮ 回到无外场」以后的样子（本次新增按钮的验收截图） */
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=1; state.t=1; renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,200));
 document.getElementById('btnNoField').click();
 await new Promise(r=>setTimeout(r,400));
 return 'stage='+stageOf()+' g='+state.g+' t='+state.t;
})();
