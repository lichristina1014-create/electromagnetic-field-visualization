(async()=>{
  Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='dipole').click();
  Object.keys(state.show).forEach(k=>state.show[k]=true);
  state.d=0.22; state.show.far=true;
  renderPanel(); draw();
  return 'dipole d='+state.d;
})()
