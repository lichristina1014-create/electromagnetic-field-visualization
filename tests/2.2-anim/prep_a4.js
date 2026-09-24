(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=1; state.t=1; renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,400));
 return 'A4 equilibrium';
})();
