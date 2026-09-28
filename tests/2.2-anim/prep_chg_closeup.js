(async()=>{
/* 电极近景：放大到单支"+"占满视野一角，用来判断笔画粗度 */
const tb=Array.from(document.querySelectorAll("#modeTabs button")).find(b=>b.dataset.k==="build");
tb.click(); stopAnim(); state.g=1; state.t=1;
cam.az=0.62; cam.el=0.62; cam.zoom=3.1;
state.showReadout=false;
renderPanel(); updateAll();
await new Promise(r=>setTimeout(r,450));
return "chg-closeup";
})();
