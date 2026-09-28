(async()=>{
 const tb=Array.from(document.querySelectorAll("#modeTabs button")).find(b=>b.dataset.k==="build");
 tb.click(); stopAnim(); state.g=1; state.t=0.45;
 cam.az=0.62; cam.el=0.46; cam.zoom=1.0;
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,450));
 return "mid";
})();
