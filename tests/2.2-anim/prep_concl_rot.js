(async()=>{
 const tb=Array.from(document.querySelectorAll("#modeTabs button")).find(b=>b.dataset.k==="concl");
 tb.click(); stopAnim(); state.g=1; state.t=1; state.rp=A_C; state.thp=55;
 cam.az=2.30; cam.el=0.34; cam.zoom=1.0;
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,450));
 return "concl-rot";
})();
