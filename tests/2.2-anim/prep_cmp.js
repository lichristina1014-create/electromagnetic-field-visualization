(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=1; state.t=0.038; state.show.box=false; renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,400));
 return 'cmp';
})();
