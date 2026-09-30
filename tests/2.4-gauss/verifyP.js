/* 验算截图③的状态：P 落在 q₁(球心,+2) 与 q₃(球外,+2) 之间时，两支场矢量的方向关系 */
(()=>{
  const R=[];
  state.q=[2,0,2,0]; state.R=0.310; state.Pth=79; state.Pph=27;
  const P=Ppoint();
  const Ein=EfieldOf(IDX_IN,P), Eout=EfieldOf(IDX_OUT,P), Eall=Efield(P);
  const f=v=>'('+v.x.toFixed(1)+', '+v.y.toFixed(1)+', '+v.z.toFixed(1)+')';
  const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,vdot(a,b)/(vlen(a)*vlen(b)))))*180/Math.PI;
  const rel=(a,b)=>{const c=vdot(a,b)/(vlen(a)*vlen(b));
    return Math.abs(c-1)<1e-6?'★完全同向':(Math.abs(c+1)<1e-6?'★完全反向':'夹角 '+ang(a,b).toFixed(2)+'°');};

  R.push('— 几何 —');
  R.push('  P  = '+f(P)+'　|P| = '+vlen(P).toFixed(4)+' m（= 球面半径）');
  R.push('  q₁ = '+f(CHARGES[0].pos)+'（球心，+2.00 µC）');
  R.push('  q₃ = '+f(CHARGES[2].pos)+'　|q₃| = '+vlen(CHARGES[2].pos).toFixed(4)+' m（+2.00 µC）');
  R.push('  q₃→P 距离 = '+vlen(vsub(P,CHARGES[2].pos)).toFixed(4)+' m');
  R.push('  O→P 与 O→q₃ 的夹角 = '+ang(P,CHARGES[2].pos).toFixed(3)+'°　⇒ '+
         (ang(P,CHARGES[2].pos)<2?'★ P 就在 O–q₃ 连线上（即两电荷之间）':'不在连线上'));
  R.push('— 三支场矢量（kV/m）—');
  R.push('  E_内 (仅球内电荷) = '+f(Ein)+'　|E| = '+vlen(Ein).toFixed(1));
  R.push('  E_外 (仅球外电荷) = '+f(Eout)+'　|E| = '+vlen(Eout).toFixed(1));
  R.push('  E_总 (全体电荷)   = '+f(Eall)+'　|E| = '+vlen(Eall).toFixed(1));
  R.push('— 方向关系 —');
  R.push('  E_内 vs E_外：'+rel(Ein,Eout));
  R.push('  E_总 vs E_外：'+rel(Eall,Eout));
  R.push('  P̂(径向向外) vs E_内：'+rel(P,Ein)+'　（球心正电荷 ⇒ 指正方向）');
  R.push('  P̂(径向向外) vs E_外：'+rel(P,Eout)+'　（球外正电荷 ⇒ 指负方向）');
  R.push('  P̂(径向向外) vs E_总：'+rel(P,Eall)+'　⇒ '+
         (ang(P,Eall)>90?'总场指向【球心那一侧】':'总场指向【背离球心】'));
  R.push('— 叠加核对 —');
  R.push('  |E_总| = '+vlen(Eall).toFixed(1)+'　|E_外|−|E_内| = '+(vlen(Eout)-vlen(Ein)).toFixed(1)+
         '　|E_内|+|E_外| = '+(vlen(Ein)+vlen(Eout)).toFixed(1));
  R.push('  ⇒ '+(Math.abs(vlen(Eall)-(vlen(Eout)-vlen(Ein)))<1.0?'★ |E_总| = |E_外| − |E_内|（反向相减，不是相加）':'与反向相减不符，需检查'));
  R.push('— 与解析式核对 —');
  const KE=8.9875517873;
  R.push('  1/(4πε₀)·q₁/r² = '+ (KE*2/Math.pow(vlen(P),2)).toFixed(1)+'（E_内 解析值）');
  R.push('  1/(4πε₀)·q₃/d²  = '+ (KE*2/Math.pow(vlen(vsub(P,CHARGES[2].pos)),2)).toFixed(1)+'（E_外 解析值）');
  return R.join('\n')+'\nDONE';
})()
