(async()=>{
/* 电荷符号特写：只留电荷 + 玻璃球，放大到能数清"+"的笔画 */
const tb=Array.from(document.querySelectorAll("#modeTabs button")).find(b=>b.dataset.k==="build");
tb.click(); stopAnim(); state.g=1; state.t=1;
Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
state.show.chg=true; state.showReadout=false;
cam.az=0.62; cam.el=0.40; cam.zoom=1.85;
renderPanel(); updateAll();
await new Promise(r=>setTimeout(r,450));
return "chg-zoom";
})();
