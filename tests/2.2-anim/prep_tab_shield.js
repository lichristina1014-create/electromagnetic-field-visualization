(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='shield');
 tb.click(); stopAnim(); state.g=1; state.t=1; state.qc=1;
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,500));
 return 'tab-shield';
})();
