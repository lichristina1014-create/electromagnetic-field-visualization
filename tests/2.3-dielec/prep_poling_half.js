(async()=>{
  Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='poling').click();
  Object.keys(state.show).forEach(k=>state.show[k]=true);
  state.E0=30; state.g=0.45; renderPanel(); draw();
  return 'poling mid';
})()
