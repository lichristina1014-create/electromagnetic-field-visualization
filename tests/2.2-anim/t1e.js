(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const tab=k=>{const b=Array.from(document.querySelectorAll('#modeTabs button')).find(x=>x.dataset.k===k); b.click();};
/* ① 全过程播放：点播放 → (g,t) 归零 → 时间轴推进 → 播完自动停并复位 */
tab('build'); stopAnim(); state.t=1; state.g=1; renderPanel(); updateAll();
document.getElementById('btnPlay').click();
T('播放：起始态归零', state.t===0 && state.g===0 && !!state.anim && state.anim.playing===true,
  't='+state.t+' g='+state.g);
await sl(900);
T('播放：时间轴确实在推进', state.g>0 || state.t>0, 'g='+state.g.toFixed(3)+' t='+state.t.toFixed(3));
let waited=0; while(state.anim && waited<14000){ await sl(200); waited+=200; }
T('播放：播完自动停并到 (1,1)', state.anim===null && Math.abs(state.t-1)<1e-9 && state.g===1,
  't='+state.t.toFixed(4)+' g='+state.g+' 用时≈'+waited+'ms');
/* ② 暂停 / 继续：暂停时时间轴必须完全不动 */
document.getElementById('btnPlay').click(); await sl(400);
document.getElementById('btnPlay').click();
const pu=state.anim?state.anim.u:null; await sl(500);
T('暂停后时间轴不动', pu!=null && state.anim && Math.abs(state.anim.u-pu)<1e-9,
  'u='+pu.toFixed(4)+' → '+(state.anim?state.anim.u.toFixed(4):'null'));
document.getElementById('btnPlay').click(); await sl(400);
T('继续后时间轴又动', state.anim && state.anim.u>pu, 'u='+state.anim.u.toFixed(4));
/* ②b 直接到静电平衡 */
document.getElementById('btnEq').click();
T('直接到平衡：t=1 且无动画', state.t===1 && state.g===1 && state.anim===null,
  't='+state.t+' g='+state.g);
/* ③ 自动旋转 */
const az0=cam.az; document.getElementById('btnRotate').click();
await sl(300); const az1=cam.az;
T('自动旋转：az 在变', Math.abs(az1-az0)>1e-6, az0.toFixed(4)+' → '+az1.toFixed(4));
document.getElementById('btnRotate').click();
T('自动旋转：可关', state.autoRotate===false);
/* ④ 滚轮缩放 + 上下限 */
const z0=cam.zoom;
for(let k=0;k<40;k++) canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}));
const zmax=cam.zoom;
for(let k=0;k<80;k++) canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true}));
const zmin=cam.zoom;
T('滚轮缩放：有上下限', zmax<=3.2+1e-9 && zmin>=0.45-1e-9 && zmax>z0 && zmin<zmax,
  'z0='+z0+' max='+zmax.toFixed(3)+' min='+zmin.toFixed(3));
cam.zoom=1; needsRender=true;
/* ⑤ 复位视角按钮 */
cam.az=1.9; cam.el=-1.0; cam.px=40; cam.py=-30;
document.getElementById('btnReset').click();
T('复位视角', cam.az===0.62&&cam.el===0.40&&cam.zoom===1&&cam.px===0&&cam.py===0,
  [cam.az,cam.el,cam.zoom,cam.px,cam.py].join(','));
/* ⑥ 折叠导航 / 面板 */
const b0=document.body.className; document.getElementById('tglNav').click();
T('折叠导航', document.body.classList.contains('nav-off'), b0+' → '+document.body.className);
document.getElementById('tglNav').click();
document.getElementById('tglPanel').click();
T('折叠面板', document.body.classList.contains('panel-off'));
document.getElementById('tglPanel').click();
/* ⑦ 实时数据条开关 */
const cb=document.getElementById('showReadoutCb'); cb.checked=false; cb.onchange({target:cb});
T('关掉读数条 ⇒ 画布下方空', document.getElementById('coordStrip').innerText.length===0);
cb.checked=true; cb.onchange({target:cb});
T('打开读数条 ⇒ 有内容', document.getElementById('coordStrip').innerText.length>20,
  'len='+document.getElementById('coordStrip').innerText.length);
return R.join('\n')+'\nDONE';
})();
