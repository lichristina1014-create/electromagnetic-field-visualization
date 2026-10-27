/* 5.2 视觉判据（屏幕空间）—— 跑法见 chk52.js 头注。 */
(()=>{
const R=[];
const ok=(n,c,e)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(e==null?'':e));
const boxes=[];
const Otext=text;
text=function(p,s,o){ o=o||{};
  const S=pr(p), size=o.size||12.5;
  const lo=richLayout(ctx,parseRich(s),size,!!o.bold);
  const ax=S.x+(o.dx||0), ay=S.y+(o.dy||0);
  const x0=(o.align==='center')?ax-lo.w/2:(o.align==='right')?ax-lo.w:ax;
  boxes.push({s:String(s),x0:x0,x1:x0+lo.w,y0:ay-size*0.72,y1:ay+size*0.72});
  return Otext(p,s,o);
};
const CAMS=[[-0.9,0.5],[-0.4,0.8],[0.7,0.6],[2.2,0.35]];
let scenes=0, labels=0, worst=0, worstTag='';
function grab(extra){
  boxes.length=0;
  if(extra) Object.assign(state,extra);
  setupCamera(); buildScene();
  scenes++; labels+=boxes.length;
  return boxes.slice();
}
function check(tag,bs){
  const bad=[];
  for(let i=0;i<bs.length;i++) for(let j=i+1;j<bs.length;j++){
    const a=bs[i],b=bs[j];
    const ox=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0), oy=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);
    if(ox>0&&oy>0){
      const ar=(a.x1-a.x0)*(a.y1-a.y0), br=(b.x1-b.x0)*(b.y1-b.y0);
      const f=ox*oy/Math.max(1e-6,Math.min(ar,br));
      if(f>worst){ worst=f; worstTag=tag+' 「'+a.s.slice(0,12)+'」×「'+b.s.slice(0,12)+'」'; }
      if(f>0.25) bad.push('「'+a.s.slice(0,12)+'」×「'+b.s.slice(0,12)+'」'+(f*100).toFixed(0)+'%');
    }
  }
  const out=bs.filter(b=>b.x0<2||b.x1>W-2||b.y0<2||b.y1>H-2).map(b=>'「'+b.s.slice(0,12)+'」越界');
  const c0=CARD_X(), c1=c0+CARD_W;
  const hit=bs.filter(b=>b.x1>c0&&b.x0<c1&&b.y1>CARD_Y&&b.y0<CARD_Y+240).map(b=>'「'+b.s.slice(0,12)+'」被信息卡压');
  return bad.concat(out,hit);
}
const fails=[];
for(const [az,el] of CAMS){
  cam.az=az; cam.el=el; cam.zoom=1.1; cam.px=0; cam.py=0;
  for(const surf of ['S1','S2']){
    for(const t of [0.1, 0.62]){
      const bs=grab({surf, t});
      const bad=check('az='+az+'/'+el+' '+surf+' t='+t, bs);
      if(bad.length) fails.push('az='+az+' el='+el+' '+surf+' t='+t+' → '+bad.slice(0,2).join(' ; '));
    }
  }
}
text=Otext;
ok('视觉：标签不重叠 / 不越界 / 不被信息卡压（'+scenes+' 个画面 × '+labels+' 个标签）', fails.length===0, fails.slice(0,3).join(' ; '));
R.push('DATA|视觉扫查|画面 '+scenes+' 个　标签 '+labels+' 个　最大重叠 '+(worst*100).toFixed(0)+'%（'+worstTag+'）');
cam.az=-0.9; cam.el=0.5; cam.zoom=1.1; cam.px=0; cam.py=0;
state.surf='S1'; state.t=0; needsRender=true;
return R.join('\n')+'\nDONE';
})()
