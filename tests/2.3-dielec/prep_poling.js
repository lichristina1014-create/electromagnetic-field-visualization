(async()=>{
  Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='poling').click();
  Object.keys(state.show).forEach(k=>state.show[k]=true);
  stopAnim(); state.g=1; state.E0=10; renderPanel(); draw();
  return 'poling full field';
})()
