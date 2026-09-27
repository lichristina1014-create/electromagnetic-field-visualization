(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const tb=Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k==='build');
tb.click();

/* 钩住两个图元构造函数，记录每次调用的实参 */
let A=[], V=[];
const oa=window.arrow, oc=window.curve;
window.arrow=function(a,b,o={}){ A.push({a,b,o}); return oa(a,b,o); };
window.curve=function(pts,o={}){ V.push({pts,o}); return oc(pts,o); };
const isC=(o,c)=>String(o.color||'').toLowerCase()===c;
const isUp=x=>x.b.z>x.a.z, isDn=x=>x.b.z<x.a.z;
const NW='#5e93ae', OR='#e97132';          /* 外场分量 / 感应场 */

function run(g,t){
  stopAnim(); state.g=g; state.t=t;
  state.show.box=false; state.show.flow=false; state.show.equi=false;
  prims=[]; buildScene();
}
const inn=()=>A.filter(x=>isC(x.o,NW)||isC(x.o,OR));

/* ① t=0.5：两支都在，方向相反 */
A=[]; V=[]; run(1,0.5);
const up=A.filter(x=>isC(x.o,NW)&&isUp(x)), dn=A.filter(x=>isC(x.o,OR)&&isDn(x));
T('t=0.5 有"外场"箭头朝 +z', up.length>0, 'n='+up.length);
T('t=0.5 有"感应场"箭头朝 −z', dn.length>0, 'n='+dn.length);
T('t=0.5 两支一一配对', up.length===dn.length, up.length+'/'+dn.length);
T('没有把球内箭头画成同向', A.filter(x=>isC(x.o,OR)&&isUp(x)).length===0);

/* ② 长度比 = t（这就是"抵消"的可视化） */
const len=x=>Math.abs(x.b.z-x.a.z);
T('t=0.5 时感应场 ≈ 外场的一半', Math.abs(len(dn[0])/len(up[0])-0.5)<0.02, (len(dn[0])/len(up[0])).toFixed(3));
A=[]; run(1,0.95);
const up2=A.filter(x=>isC(x.o,NW)&&isUp(x)), dn2=A.filter(x=>isC(x.o,OR)&&isDn(x));
T('t=0.95 时两支几乎等长（抵消）', Math.abs(len(dn2[0])/len(up2[0])-0.95)<0.02, (len(dn2[0])/len(up2[0])).toFixed(3));

/* ③ 两端都不画 */
A=[]; run(1,1);   T('t=1（平衡）球内一支都不画', inn().length===0, 'n='+inn().length);
A=[]; run(0,0);   T('无外场时球内不画', inn().length===0, 'n='+inn().length);
A=[]; run(0.4,0); T('外场建立中：只有外场分量、无感应场', A.filter(x=>isC(x.o,NW)).length>0&&A.filter(x=>isC(x.o,OR)).length===0);

/* ④ 场线：球剪影圆内的段被压暗 */
V=[]; run(1,0.5);
const S0=pr(O), Rpx=A_C*camScale;
const inC=p=>{const S=pr(p); return Math.hypot(S.x-S0.x,S.y-S0.y)<Rpx;};
const seg=V.filter(x=>x.o.color&&x.o.alpha!=null);
const dark=seg.filter(x=>x.o.alpha<0.2), light=seg.filter(x=>x.o.alpha>=0.2);
T('场线里存在被压暗的段', dark.length>0, 'dark='+dark.length+' light='+light.length);
T('被压暗的段确实落在球剪影圆内', dark.every(x=>x.pts.some(inC)), 'dark='+dark.length);
T('明亮段基本在球剪影圆外', light.filter(x=>inC(x.pts[0])).length<=light.length*0.4,
  'light='+light.length+' 圆内='+light.filter(x=>inC(x.pts[0])).length);
T('压暗段首尾相接、没把线拆断', dark.length===0||dark.every(x=>x.pts.length>=2));
T('场线总段数合理（未爆炸）', seg.length<400, 'seg='+seg.length);

/* ⑤ 幂等（拆分后仍不能累积） */
run(1,0.5); const n1=prims.length; run(1,0.5); run(1,0.5);
T('按段拆分后仍然幂等', prims.length===n1, n1+'/'+prims.length);
T('图元 z 无 NaN', prims.every(p=>!Number.isNaN(p.z)&&p.z!=null), 'nan='+prims.filter(p=>Number.isNaN(p.z)).length);

window.arrow=oa; window.curve=oc;
return R.join('\n')+'\nDONE';
})();
