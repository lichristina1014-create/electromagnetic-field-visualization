/* 3.1 视觉判据（屏幕空间）—— 单独一个脚本，供 run_suite 一并跑。
   ⚠️ 项目铁律："断言通过 ≠ 用户满意"，视觉判据必须落在**屏幕空间**（投影后的
      包围盒 / 重叠面积），不能只 grep 源码。这里用 richLayout 的真实宽度算每个
      text() 的包围盒，再两两求交。
   覆盖：3 个页签 × θ ∈ {0,40,80} × 4 组相机角 ⇒ 36 个画面，每个画面查三件事：
       ① 标签两两不重叠（>25% 较小者面积才算）
       ② 标签不越出画布
       ③ 信息卡（右上）不压场景标签
   跑法：bash tests/run_suite.sh 3.1-current-density.htm <就绪表达式> \
         tests/3.1-current-density/chk31.js tests/3.1-current-density/vis31.js        */
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
const CAMS=[[0.62,0.40],[1.9,-0.35],[3.4,0.85],[5.6,-0.9]];
let scenes=0, labels=0, worst=0, worstTag='';
function grab(mode,th){
  boxes.length=0;
  state.mode=mode; if(mode==='volume') state.th=th;
  buildScene();
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
  const out=bs.filter(b=>b.x0<2||b.x1>W-2||b.y0<2||b.y1>H-2)
              .map(b=>'「'+b.s.slice(0,12)+'」越界');
  const c0=CARD_X(), c1=c0+CARD_W;
  const hit=bs.filter(b=>b.x1>c0&&b.x0<c1&&b.y1>CARD_Y&&b.y0<CARD_Y+250)
              .map(b=>'「'+b.s.slice(0,12)+'」被信息卡压');
  return bad.concat(out,hit);
}
const fails=[];
for(const [az,el] of CAMS){
  cam.az=az; cam.el=el; cam.zoom=1; cam.px=0; cam.py=0;
  for(const m of ['volume','surface','line']){
    const ths=(m==='volume')?[0,40,80]:[0];
    for(const th of ths){
      const bs=grab(m,th);
      const bad=check('az='+az.toFixed(1)+'/'+el+' '+m+'/θ'+th, bs);
      if(bad.length) fails.push('az='+az.toFixed(1)+' el='+el+' '+m+' θ='+th+' → '+bad.slice(0,2).join(' ; '));
    }
  }
}
text=Otext;
ok('视觉：标签不重叠 / 不越界 / 不被信息卡压（'+scenes+' 个画面 × '+labels+' 个标签）', fails.length===0, fails.slice(0,3).join(' ; '));
R.push('DATA|视觉扫查|画面 '+scenes+' 个　标签 '+labels+' 个　最大重叠 '+(worst*100).toFixed(0)+'%（'+worstTag+'）');
/* 相机复位后回到默认角，别把页面留歪 */
cam.az=0.62; cam.el=0.40; cam.zoom=1; cam.px=0; cam.py=0; needsRender=true;
return R.join('\n')+'\nDONE';
})()
