(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=0; state.t=0; renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,400));
 return 'A1 no-field';
})();
