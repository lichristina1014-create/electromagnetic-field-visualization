/* 4.2 视觉判据（屏幕空间）—— 单独一个脚本，供 run_suite 一并跑。
   ⚠️ 项目铁律："断言通过 ≠ 用户满意"，视觉判据必须落在**屏幕空间**（投影后的
      包围盒 / 重叠面积），不能只 grep 源码。这里用 richLayout 的真实宽度算每个
      标签的包围盒，再两两求交。
   覆盖：3 个页签 × 参数组合 × 4 组相机角 ⇒ 每个画面查四件事：
       ① 标签两两不重叠（>25% 较小者面积才算）
       ② 标签不越出画布
       ③ 信息卡（右上）不压场景标签
       ④ ②③ 的世界标签不闯进左下「表层放大」插图区（插图自带 textScreen 标签）
   跑法：bash tests/run_suite.sh 4.2-magnetization.htm \
         "typeof state!=='undefined' && typeof CARDS!=='undefined'" \
         tests/4.2-magnetization/chk42.js tests/4.2-magnetization/vis42.js        */
(()=>{
const R=[];
const ok=(n,c,e)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(e==null?'':e));
const boxes=[];                       /* 世界标签（text() 投影得到） */
const sboxes=[];                      /* 屏幕标签（textScreen，插图内部） */
const Otext=text, Ots=textScreen;
function pushBox(arr,s,p,o,dx0,dy0){
  const S=pr(p), size=o.size||12.5;
  const lo=richLayout(ctx,parseRich(s),size,!!o.bold);
  const ax=S.x+(o.dx||0), ay=S.y+(o.dy||0);
  const x0=(o.align==='center')?ax-lo.w/2:(o.align==='right')?ax-lo.w:ax;
  arr.push({s:String(s),x0:x0+dx0,x1:x0+lo.w+dx0,y0:ay-size*0.72+dy0,y1:ay+size*0.72+dy0});
}
text=function(p,s,o){ o=o||{};
  pushBox(boxes,s,p,o,0,0);
  return Otext(p,s,o);
};
textScreen=function(x,y,s,o){ o=o||{};
  const size=o.size||12;
  const lo=richLayout(ctx,parseRich(s),size,!!o.bold);
  const x0=(o.align==='center')?x-lo.w/2:(o.align==='right')?x-lo.w:x;
  sboxes.push({s:String(s),x0:x0,x1:x0+lo.w,y0:y-size*0.72,y1:y+size*0.72});
  return Ots(x,y,s,o);
};
const CAMS=[[0.62,0.40],[1.9,-0.35],[3.4,0.85],[5.6,-0.9]];
let scenes=0, labels=0, worst=0, worstTag='';
/* 表层放大插图的屏幕矩形（与 page1.js drawInset 的 bx/by/bw/bh 一致） */
const INS={x0:14,y0:()=>H-206,x1:14+176,y1:()=>H-206+192};
function grab(mode){
  boxes.length=0; sboxes.length=0;
  state.mode=mode;
  Object.keys(state.show).forEach(k=>{ if(typeof state.show[k]==='boolean') state.show[k]=true; });
  buildScene();
  scenes++; labels+=boxes.length+sboxes.length;
  return {w:boxes.slice(), s:sboxes.slice()};
}
function check(tag,bs,mode){
  const bad=[];
  const all=bs.w.concat(bs.s);
  for(let i=0;i<all.length;i++) for(let j=i+1;j<all.length;j++){
    const a=all[i],b=all[j];
    const ox=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0), oy=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);
    if(ox>0&&oy>0){
      const ar=(a.x1-a.x0)*(a.y1-a.y0), br=(b.x1-b.x0)*(b.y1-b.y0);
      const f=ox*oy/Math.max(1e-6,Math.min(ar,br));
      if(f>worst){ worst=f; worstTag=tag+' 「'+a.s.slice(0,12)+'」×「'+b.s.slice(0,12)+'」'; }
      if(f>0.25) bad.push('「'+a.s.slice(0,12)+'」×「'+b.s.slice(0,12)+'」'+(f*100).toFixed(0)+'%');
    }
  }
  const out=all.filter(b=>b.x0<2||b.x1>W-2||b.y0<2||b.y1>H-2)
              .map(b=>'「'+b.s.slice(0,12)+'」越界');
  const c0=CARD_X(), c1=c0+CARD_W;
  const hit=all.filter(b=>b.x1>c0&&b.x0<c1&&b.y1>CARD_Y&&b.y0<CARD_Y+250)
              .map(b=>'「'+b.s.slice(0,12)+'」被信息卡压');
  /* ②③：世界标签不许闯进左下插图矩形（插图自己的 textScreen 标签天然在框内，不查） */
  if(mode!=='molecular'){
    const ins=bs.w.filter(b=>b.x1>INS.x0&&b.x0<INS.x1&&b.y1>INS.y0()&&b.y0<INS.y1())
      .map(b=>'「'+b.s.slice(0,12)+'」闯进表层放大插图');
    bad.push(...ins);
  }
  return bad.concat(out,hit);
}
const fails=[];
for(const [az,el] of CAMS){
  cam.az=az; cam.el=el; cam.zoom=1; cam.px=0; cam.py=0;
  /* ① 分子电流：默认 / 大电流 / 翻转 */
  for(const [iC,flip] of [[1.0,false],[3.0,false],[0.2,true]]){
    state.iC=iC; state.rC=10; state.flip=flip;
    const bad=check('az='+az.toFixed(1)+' ①iC='+iC+(flip?'/翻转':''), grab('molecular'),'molecular');
    if(bad.length) fails.push('az='+az.toFixed(1)+' el='+el+' ① iC='+iC+(flip?'/flip':'')+' → '+bad.slice(0,2).join(' ; '));
  }
  /* ② 无外场：默认 seed / 换一个 seed */
  for(const sd of [20261022, 777]){
    state.seed=sd;
    const bad=check('az='+az.toFixed(1)+' ②seed='+sd, grab('nofield'),'nofield');
    if(bad.length) fails.push('az='+az.toFixed(1)+' el='+el+' ② seed='+sd+' → '+bad.slice(0,2).join(' ; '));
  }
  /* ③ 加外场：无场 / 半程 / 满场 × 弱场 / 强场 */
  for(const [B0,t] of [[50,0],[50,0.5],[50,1],[10,1],[100,1]]){
    state.B0=B0; state.t=t; state.g=animG(t); state.anim=null;
    const bad=check('az='+az.toFixed(1)+' ③B0='+B0+'/t='+t, grab('poling'),'poling');
    if(bad.length) fails.push('az='+az.toFixed(1)+' el='+el+' ③ B0='+B0+' t='+t+' → '+bad.slice(0,2).join(' ; '));
  }
}
text=Otext; textScreen=Ots;
ok('视觉：标签不重叠 / 不越界 / 不被信息卡压 / 不闯进插图（'+scenes+' 个画面 × '+labels+' 个标签）', fails.length===0, fails.slice(0,3).join(' ; '));
R.push('DATA|视觉扫查|画面 '+scenes+' 个　标签 '+labels+' 个　最大重叠 '+(worst*100).toFixed(0)+'%（'+worstTag+'）');
/* 恢复默认状态，别把页面留歪 */
state.mode='molecular'; state.iC=1.0; state.rC=10; state.flip=false; state.seed=20261022;
state.B0=50; state.t=1; state.g=1; state.anim=null;
cam.az=0.62; cam.el=0.40; cam.zoom=1; cam.px=0; cam.py=0; needsRender=true;
return R.join('\n')+'\nDONE';
})()
