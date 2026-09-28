(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
 tb.click(); stopAnim(); state.g=1; state.t=1;
 cam.zoom=1.0; cam.az=2.35; cam.el=0.30;      /* 任意一个方位角，验"场线跟着转" */
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,450));
 return 'rotated az=2.35';
})();
