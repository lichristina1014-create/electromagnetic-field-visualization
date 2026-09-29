(async()=>{
  Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='nofield').click();
  Object.keys(state.show).forEach(k=>state.show[k]=true);
  renderPanel(); draw();
  return 'nofield';
})()
