(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=1; state.t=1;
 state.show.box=false; state.show.inner=false; state.show.chg=false; state.show.flow=false;
 cam.zoom=1.0; cam.az=0.62; cam.el=0.46;
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,450));
 return 'only-lines t=1';
})();
