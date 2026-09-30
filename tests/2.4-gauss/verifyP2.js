(()=>{
  const R=[];
  const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,vdot(a,b)/(vlen(a)*vlen(b)))))*180/Math.PI;
  const cases=[[79,27,'[A] P 正对球外电荷（球外场最强）'],
               [24,27,'[B] 默认·球顶附近'],
               [101,207,'[C] P 的正对面（球外场最弱）']];
  for(const c of cases){
    state.q=[2,0,2,0]; state.R=0.310; state.Pth=c[0]; state.Pph=c[1];
    const P=Ppoint();
    const Ein=EfieldOf(IDX_IN,P), Eout=EfieldOf(IDX_OUT,P), Eall=Efield(P);
    const Li=vlen(Ein), Lo=vlen(Eout), La=vlen(Eall);
    const aIO=ang(Ein,Eout), aPE=ang(P,Eall);
    let kind='矢量合成';
    if(Math.abs(La-(Lo-Li))<1.2) kind='两模相减';
    else if(Math.abs(La-(Li+Lo))<1.2) kind='两模相加';
    R.push(c[2]+'　P=(θ'+c[0]+'°, φ'+c[1]+'°)');
    R.push('   |E_内|='+Li.toFixed(1)+'　|E_外|='+Lo.toFixed(1)+'　|E_总|='+La.toFixed(1)+' kV/m');
    R.push('   夹角(E_内,E_外)='+aIO.toFixed(1)+'° ⇒ '+(aIO>90?'反向相消':'同向相加'));
    R.push('   |E_外|-|E_内|='+(Lo-Li).toFixed(1)+'　|E_内|+|E_外|='+(Li+Lo).toFixed(1)+'　⇒ 总场 = '+kind);
    R.push('   夹角(P径向向外,E_总)='+aPE.toFixed(1)+'° ⇒ '+(aPE>90?'总场指向球心那一侧':'总场径向向外'));
  }
  return R.join('\n')+'\nDONE';
})()
