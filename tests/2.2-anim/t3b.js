(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
tb.click();
let A=[];
const oa=window.arrow;
window.arrow=function(a,b,o={}){ A.push({a,b,o}); return oa(a,b,o); };
const isC=(o,c)=>String(o.color||'').toLowerCase()===c;
const S0=pr(O);
const sL=x=>{const p=pr(x.a),q=pr(x.b); return Math.hypot(q.x-p.x,q.y-p.y);};
const wL=p=>Math.hypot(p.x,p.y,p.z);
const onC=x=>{const m=pr(pt((x.a.x+x.b.x)/2,(x.a.y+x.b.y)/2,(x.a.z+x.b.z)/2));
  return m.x>=0&&m.x<=W&&m.y>=0&&m.y<=H;};

/* ===== 1. 场线方向箭头（静电平衡态） ===== */
stopAnim(); state.g=1; state.t=1; state.show.box=false; state.show.flow=false;
prims=[]; buildScene();
const nseg=fieldLines(state.E0,1).length;   /* 平衡态实际画出来的折线段数 × 4 个方位角 */
const fa=A.filter(x=>isC(x.o,'#2e7fa6'));
T('平衡态：场线上出现方向箭头', fa.length>=30, 'n='+fa.length+' 段数×4='+nseg*4);
T('每条场线恰好一个方向箭头', fa.length===nseg*4, 'n='+fa.length+' 期望='+nseg*4);
T('场线箭头已放大（headScale ≥ 1.1）', fa.length>0&&fa.every(x=>x.o.headScale>=1.1),
  'hs='+(fa[0]?fa[0].o.headScale:'-'));
T('场线箭头一律指向 +z（外场方向）', fa.every(x=>x.b.z>=x.a.z),
  '指反='+fa.filter(x=>x.b.z<x.a.z).length);
T('箭头不在导体内部（箭尖与箭尾世界半径 ≥ a）',
  fa.every(x=>wL(x.b)>=A_C*0.995&&wL(x.a)>=A_C*0.995),
  'minRb='+Math.min.apply(null,fa.map(x=>wL(x.b))).toFixed(3)+' minRa='+
  Math.min.apply(null,fa.map(x=>wL(x.a))).toFixed(3)+' a='+A_C);
const Ls=fa.map(sL).sort((a,b)=>a-b), med=Ls[Math.floor(Ls.length/2)];
T('箭杆是屏幕定长（既不缩成 8px 小三角、也不出 300px 巨型箭头）',
  Ls[0]>=24&&Ls[Ls.length-1]<=40&&med>=24,
  'min='+Ls[0].toFixed(1)+' med='+med.toFixed(1)+' max='+Ls[Ls.length-1].toFixed(1));
T('绝大多数箭头落在画布可视区内', fa.filter(onC).length>=fa.length*0.85,
  '可视='+fa.filter(onC).length+'/'+fa.length);

/* ===== 2. 球内两支箭头的箭头头 ===== */
A=[]; stopAnim(); state.g=1; state.t=0.5;
prims=[]; buildScene();
const up=A.filter(x=>isC(x.o,'#5e93ae')), dn=A.filter(x=>isC(x.o,'#e97132'));
T('内部"外场"箭头 headScale ≥ 1.0', up.length===8&&up.every(x=>x.o.headScale>=1.0), 'n='+up.length);
T('内部"感应场"箭头 headScale ≥ 1.1', dn.length===8&&dn.every(x=>x.o.headScale>=1.1), 'n='+dn.length);
T('两支方向仍相反（蓝↑ / 橙↓）',
  up.every(x=>x.b.z>x.a.z)&&dn.every(x=>x.b.z<x.a.z));

/* ===== 3. 迁移弧的箭头也放大了 ===== */
A=[]; stopAnim(); state.g=1; state.t=0.5; state.show.flow=true;
prims=[]; buildScene();
const fw=A.filter(x=>isC(x.o,'#d04a3a'));
T('迁移弧（正电荷）箭头 headScale ≥ 1.2', fw.length>=1&&fw.every(x=>x.o.headScale>=1.2), 'n='+fw.length);

/* ===== 4. 复位按钮 ===== */
window.arrow=oa;
stopAnim(); state.g=1; state.t=1; renderPanel();
T('存在「⏮ 回到无外场」按钮', !!document.getElementById('btnNoField'));
T('旧的重播按钮已移除', !document.getElementById('btnReplay'));
T('id 无重复：面板按钮不与相机复位撞名',
  document.querySelectorAll('#btnNoField').length===1&&document.querySelectorAll('#btnReset').length===1,
  'noField='+document.querySelectorAll('#btnNoField').length+' reset='+document.querySelectorAll('#btnReset').length);
T('相机复位按钮（btnReset）仍是原来那个', (function(){
  cam.az=1.9; cam.el=-1.0; cam.px=30; cam.py=-20;
  document.getElementById('btnReset').click();
  return cam.az===0.62&&cam.el===0.40&&cam.zoom===1&&cam.px===0&&cam.py===0; })(), 'az='+cam.az);
document.getElementById('btnNoField').click();
T('点击后 (g,t)=(0,0)', state.g===0&&state.t===0, 'g='+state.g+' t='+state.t);
T('点击后停止播放', !state.anim, 'anim='+String(state.anim));
T('点击后停在阶段①', STAGE_NAMES[stageOf()]==='① 无外加电场', STAGE_NAMES[stageOf()]);
T('点击后读数条已刷新', /无外场/.test(document.getElementById('coordStrip').innerText));
T('从①再点播放 ⇒ 仍从 (0,0) 起', (function(){
  var pb=document.getElementById('btnPlay'); if(!pb) return false;
  pb.click(); return !!state.anim && state.g===0 && state.t===0; })());
return R.join('\n')+'\nDONE';
})();
