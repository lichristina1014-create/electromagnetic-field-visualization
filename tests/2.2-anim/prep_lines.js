(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=1; state.t=0.038;
 state.show.box=false; state.show.inner=false; state.show.chg=false;   /* 只看场线 */
 cam.zoom=1.5; cam.az=0.62; cam.el=0.46;
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,400));
 return 'zoom lines only';
})();
