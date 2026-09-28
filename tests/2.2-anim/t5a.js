(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
/* ══════ 专测 2026-09-28 的改动：场线只画「正对镜头的那一圈」并随相机转 ══════
   用户反馈："外电场线看起来有点乱，我觉得可以就显示圆周一圈的就行，
             当我转动位置的话，始终显示就是电脑线面对的那个面的一圈的电场线就行"。
   原先 FL_PH=[0,π/2,π,3π/2] = 2 个互相垂直的平面 ⇒ 两族线互相穿插。
   ★ 判据要点：**不要复用页面里的 facePH() 来自证**（等于用同一句话证明自己）。
     这里改用四个独立的几何量：方位角集合、平面径向方向 u、赤道点的屏幕偏移、屏幕左右对称。
   ⚠️ 两个测过的坑：
     (1) **"curve 调用条数" ≠ "剖面折线数"**：一条场线会被球剪影圆切成 1~3 段，各段各自调 curve()；
         而顺着 `el` 变化剪影切法也会变 ⇒ 只有 **箭头**条数（arrowed 保证每段每方位恰好 1 个）是稳的。
     (2) 平面正对镜头**不是** n ∥ camD（n 的 z 分量为 0、camD 的 z 分量是 sin el，永远不可能平行）。
         真正的判据是 φ−az = ±π/2 ⟺ **平面内的径向方向 u 恰好等于屏幕水平轴 camU**
         ⇒ 左右严格镜像、径向零缩短；此时 n 与视线夹 el 角（相机自身的仰角，不可避免也不影响可读性）。 */
const tabOf=k=>Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k===k);
const isC=(o,c)=>String(o.color||'').toLowerCase()===c;
const modPi=v=>((v%Math.PI)+Math.PI)%Math.PI;
let CU=[], AR=[];
const oc=window.curve, oa=window.arrow;
window.curve=function(pts,o={}){ CU.push({pts:pts.map(p=>({x:p.x,y:p.y,z:p.z})),o}); return oc(pts,o); };
window.arrow=function(a,b,o={}){ AR.push({a,b,o}); return oa(a,b,o); };
const allP=()=>[].concat(...CU.map(c=>c.pts));
const flP=()=>[].concat(...CU.filter(c=>isC(c.o,'#2e7fa6')).map(c=>c.pts));
/* 只统计"离轴"点的方位角 atan2(y,x)；轴上的点（x=y=0）没有方位角 */
const azs=list=>Array.from(new Set(list.filter(p=>Math.hypot(p.x,p.y)>1e-9)
  .map(p=>+Math.atan2(p.y,p.x).toFixed(9)))).sort((a,b)=>a-b);
/* 平面无向：方位角 a 落在"以 ph 为轴线的那半个平面"里 ⟺ sin(a−ph)=0 */
const inPlane=(L,ph)=>L.every(a=>Math.abs(Math.sin(a-ph))<1e-6);
/* 赤道点（z=0）的屏幕偏移 /(camScale·r)：径向零缩短 ⇒ 恰好 1 */
function faceRatio(list){
  const p=list.find(q=>Math.hypot(q.x,q.y)>1e-9&&Math.abs(q.z)<1e-12); if(!p) return NaN;
  setupCamera(); const s0=pr(O), s=pr(p);
  return Math.hypot(s.x-s0.x,s.y-s0.y)/(camScale*Math.hypot(p.x,p.y));
}
/* 场线的"剖面段数 × 方位数"，轴上段（x ≡ 0）只算 1 个方位（faceCurves 会去重） */
const segsAt=tv=>fieldLines(state.E0,tv);
function nArrowExp(tv){
  return segsAt(tv).reduce((s,sg)=>s+((sg.length&&sg.every(p=>Math.abs(p.x)<1e-9))?1:2),0);
}
function build(){
  prims=[]; CU=[]; AR=[]; buildScene();
  return {fl:AR.filter(x=>isC(x.o,'#2e7fa6')),
          axis:AR.filter(x=>isC(x.o,'#2e7fa6')&&Math.abs(x.a.x)<1e-9&&Math.abs(x.b.x)<1e-9)};
}
const PHc=()=>cam.az+Math.PI/2;      /* 只用于打印，不用来自证 */

/* ── ① 旧常量没了、新函数在 ─────────────────────────────────── */
T('旧的四方位角常量 FL_PH 已删除', typeof FL_PH==='undefined', typeof FL_PH);
T('facePH / faceCurves 都是函数', typeof facePH==='function'&&typeof faceCurves==='function');
T('facePH() 给 2 个方位角 = 同一平面的两半', (function(){ const p=facePH();
  return p.length===2&&Math.abs(p[1]-p[0]-Math.PI)<1e-12; })(), facePH().map(x=>x.toFixed(4)).join(','));
T('faceCurves() 对轴上的段只给 1 个方位角（去重）', (function(){
  const ax=[{x:0,y:0,z:0},{x:0,y:0,z:1}], off=[{x:1,y:0,z:0},{x:1,y:0,z:1}];
  return faceCurves(ax).length===1&&faceCurves(off).length===2;})());

/* ── ② 默认机位：只画一圈、横铺在镜头前 ─────────────────────── */
const tb=tabOf('build'); tb.click();
stopAnim(); state.g=1; state.t=1; state.show.box=false; state.show.flow=false; state.show.chg=false;
let B0=build();
const A1=azs(flP()), r1=faceRatio(flP());
T('① 场线只有 2 个方位角（= 1 个平面，不再有两个平面）', A1.length===2, JSON.stringify(A1));
T('① 全部场线落在同一个平面里', inPlane(A1,PHc()), 'φ−az='+A1.map(a=>(a-cam.az).toFixed(4)).join(','));
T('① φ−az = ±π/2（若写成 φ=az 会得 0 ⇒ 侧对镜头、最乱）',
  A1.every(a=>Math.abs(Math.cos(a-cam.az))<1e-6),
  'max|cos(φ−az)|='+Math.max.apply(null,A1.map(a=>Math.abs(Math.cos(a-cam.az)))).toExponential(2));
{ /* ⚠️ 这里必须用**某个真实场线点的精确方位角**，不能用 azs() 的返回值 ——
     azs() 为了去重把方位角舍入到 1e-9，再拿它造 u 会带进 ~1e-10 的误差，
     u·camV 就卡在 8e-11 上，容差写 1e-12 会得到一个"看着像真 bug"的假失败。 */
  const p0=flP().find(p=>Math.hypot(p.x,p.y)>1e-9);
  const a0=Math.atan2(p0.y,p0.x), u={x:Math.cos(a0),y:Math.sin(a0),z:0};
  const sU=vdot(u,camU), sV=vdot(u,camV);
  T('① 平面内的径向方向 = 屏幕水平轴（u·camU=±1、u·camV=0）⇒ 横向零缩短',
    Math.abs(Math.abs(sU)-1)<1e-12&&Math.abs(sV)<1e-12,
    'u·camU='+sU.toFixed(12)+' u·camV='+sV.toFixed(12)); }
T('① 无透视缩短：赤道点屏幕偏移/(camScale·r) = 1', Math.abs(r1-1)<1e-9, 'ratio='+r1.toFixed(12));
{ setupCamera(); const dx=flP().map(p=>+pr(p).x-+CX2), st=new Set(dx.map(v=>+(-v).toFixed(6)));
  const un=dx.map(v=>+v.toFixed(6)).filter(v=>!st.has(v));
  T('① 场线在屏幕上关于 z 轴严格左右对称（正对镜头的直接后果）', un.length===0,
    '不对称点='+un.length+'/'+dx.length); }
T('① 场线方向箭头条数 = 剖面段数×方位数（轴上段只算 1）',
  B0.fl.length===nArrowExp(1), B0.fl.length+'/'+nArrowExp(1));
T('① 轴上的 b=0 段没被叠画两遍（去重生效）', B0.axis.length===2, 'n='+B0.axis.length);

/* ── ③ 转相机 ⇒ 场线跟着转，且仍然横铺在镜头前 ─────────────── */
const az0=cam.az, m0=modPi(A1[0]);
cam.az=az0+1.4; cam.el=0.20;
B0=build(); const A2=azs(flP()), r2=faceRatio(flP());
T('③ 换机位后仍是"一圈"且仍横铺在镜头前',
  A2.length===2&&inPlane(A2,PHc())&&A2.every(a=>Math.abs(Math.cos(a-cam.az))<1e-6),
  'Δaz=1.4000');
{ const d=((modPi(A2[0])-m0)%Math.PI+Math.PI)%Math.PI;
  T('③ 方位角随相机同步转（Δφ ≡ Δaz mod π）', Math.abs(d-1.4)<1e-9,
    'Δφ mod π='+d.toFixed(12)+'（方位角会绕 ±π 回卷 ⇒ 必须 mod π 再比）'); }
T('③ 换机位后依然零缩短', Math.abs(r2-1)<1e-9, 'ratio='+r2.toFixed(12)+'（默认机位 '+r1.toFixed(12)+'）');
T('③ 换机位后箭头条数不减（≥ 默认机位的 90%）', B0.fl.length>=nArrowExp(1)*0.9,
  B0.fl.length+'/'+nArrowExp(1)+'（el 变了会改变剪影的切法，条数允许小幅变化）');

/* ── ④ 三个页签共用同一套规则 ───────────────────────────────── */
state.mode='concl'; state.show.equi=true; state.show.chg=false; state.show.vz=false;
prims=[]; CU=[]; buildScene();
const EQ=CU.filter(c=>isC(c.o,'#8fb3c6'));
T('② 等位面剖面也只在同一个平面里',
  EQ.length>0&&inPlane(azs([].concat(...EQ.map(c=>c.pts))),PHc()),
  'n='+EQ.length+' az='+JSON.stringify(azs([].concat(...EQ.map(c=>c.pts)))));
tabOf('shield').click();
state.mode='shield'; state.qc=1; state.show.chg=false;
prims=[]; CU=[]; AR=[]; buildScene();
const SH=CU.filter(c=>isC(c.o,'#2e7fa6')), cav=AR.filter(x=>isC(x.o,'#b07a2a'));
T('③ 壳外场线也只在同一个平面里',
  SH.length>0&&inPlane(azs([].concat(...SH.map(c=>c.pts))),PHc()), 'n='+SH.length);
T('③ 腔内径向箭头也从 4 个方位收到 2 个（20 → 10 支）', cav.length===10, 'n='+cav.length);
T('③ 腔内箭头确实落在同一个平面里',
  inPlane(azs(cav.map(x=>x.b)),PHc()), JSON.stringify(azs(cav.map(x=>x.b))));

/* ── ⑤ 面板提示与例行文案扫查 ───────────────────────────────── */
tabOf('build').click(); state.mode='build'; renderPanel();
T('面板里有"只画正对镜头的那一个剖面"的提示（用户才知道线为什么跟着转）',
  /正对镜头的那一个剖面/.test(document.getElementById('panel').innerText));
const bad=[];
for(const m of ['build','concl','shield']){
  tabOf(m).click();
  for(const ck of ['1','2','3','4']){ state.cardTab=ck; renderPanel();
    if(document.getElementById('panel').innerText.includes('**')&&!bad.includes(m+'#'+ck)) bad.push(m+'#'+ck); } }
T('三个页签的面板文案里没有字面 ** （richHTML 不认它，会原样显示星号）',
  bad.length===0, bad.join(',')||'干净');
window.curve=oc; window.arrow=oa;
return R.join('\n')+'\nDONE';
})();
