(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
/* ---- 1. 时间轴曲线 ---- */
T('animG 端点/中点', animG(0)===0&&animG(0.12)===0&&animG(0.36)===1&&animG(1)===1&&Math.abs(animG(0.24)-0.5)<1e-15,
  [animG(0),animG(0.12),animG(0.24),animG(0.36)].map(x=>x.toFixed(3)).join('/'));
T('animT 端点/中点', animT(0)===0&&animT(0.36)===0&&animT(1)===1&&Math.abs(animT(0.68)-0.5)<1e-15,
  [animT(0.36),animT(0.52),animT(0.68),animT(1)].map(x=>x.toFixed(3)).join('/'));
let mon=true; for(let i=0;i<=200;i++){ const u=i/200;
  if(animG(u)<animG(u-1/200)-1e-15||animT(u)<animT(u-1/200)-1e-15) mon=false;
  if(animG(u)<-1e-15||animG(u)>1+1e-15||animT(u)<-1e-15||animT(u)>1+1e-15) mon=false; }
T('animG/animT 单调且在 [0,1]', mon);
T('阶段①外场恒为 0', animG(0.06)===0&&animT(0.06)===0);
T('阶段②电荷还没动', animT(0.30)===0&&animG(0.30)>0.5);
/* ---- 2. 阶段判定 ---- */
T('默认态 = 阶段④', stageOf()===3);
const S=[];
[[0,0],[0.5,0],[1,0],[1,0.05],[1,0.5],[1,1]].forEach(([g,t])=>{ state.g=g; state.t=t; S.push(stageOf()); });
state.g=1; state.t=1;
T('stageOf 分段正确（含 (1,0) 归②）', S.join(',')==='0,1,1,2,2,3', 'got='+S.join(','));
/* ---- 3. 步进 ---- */
state.anim=null; T('无动画时 stepAnim=false', stepAnim(0.5)===false);
state.anim={u:0,playing:true};
let rr=null; for(let i=0;i<4;i++) rr=stepAnim(1.4);   /* 4×1.4/5.6 = 1.0 */
T('步进 4×dt 后播完并归位', rr==='end'&&state.anim===null&&state.g===1&&state.t===1,
  'r='+rr+' g='+state.g+' t='+state.t);
state.anim={u:0.5,playing:false}; const u0=state.anim.u; stepAnim(1);
T('暂停时不推进', state.anim.u===u0&&stepAnim(1)===false, 'u='+state.anim.u);
state.anim=null; state.g=0.4; state.t=0.2;
T('animU 由 g 反推', Math.abs(animU()-(0.12+0.24*0.4))<1e-12, animU().toFixed(4));
state.g=1; state.t=0.25;
T('animU 由 t 反推', Math.abs(animU()-(0.36+0.64*0.25))<1e-12, animU().toFixed(4));
stopAnim(); T('stopAnim 归 g=1 且清 anim', state.anim===null&&state.g===1);
/* ---- 4. 时间轴中途与末端的物理量都对 ---- */
state.anim={u:0.68,playing:true}; stepAnim(1e-9);
T('u=0.68 时外场已满、电荷迁移到 50%', Math.abs(state.g-1)<1e-9&&Math.abs(state.t-0.5)<1e-6,
  'g='+state.g.toFixed(3)+' t='+state.t.toFixed(3));
state.anim={u:0.30,playing:true}; stepAnim(1e-9);
T('u=0.30 时外场在建立、电荷还没动', state.g>0.5&&state.g<1&&state.t===0,
  'g='+state.g.toFixed(3)+' t='+state.t);
state.anim={u:0.9,playing:true}; stepAnim(1e-9);
T('u=0.9 时外场已满、迁移接近完成', state.g===1&&state.t>0.85&&state.t<1, 't='+state.t.toFixed(3));
stopAnim();
return R.join('\n')+'\nDONE';
})();
