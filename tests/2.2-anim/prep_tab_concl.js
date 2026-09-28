(async()=>{
 const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='concl');
 tb.click(); stopAnim(); state.g=1; state.t=1;
 state.rp=A_C; state.thp=55;                    /* P 吸附在导体表面 */
 renderPanel(); updateAll();
 await new Promise(r=>setTimeout(r,500));
 return 'tab-concl';
})();
