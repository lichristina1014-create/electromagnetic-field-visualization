(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const q=id=>document.getElementById(id);
/* ---- 1. 播放按钮 ---- */
document.querySelectorAll('#modeTabs button')[0].click();
T('① 面板有播放/重播/到平衡三键', !!q('btnPlay')&&!!q('btnReplay')&&!!q('btnEq'));
q('btnPlay').click();
T('点播放 ⇒ 起始态 (g,t)=(0,0) 且 anim 在跑',
  !!state.anim&&state.anim.playing===true&&state.g===0&&state.t===0, 'g='+state.g+' t='+state.t);
T('点播放后画面处于阶段①', stageOf()===0);
q('btnPlay').click(); T('再点 ⇒ 暂停', !!state.anim&&state.anim.playing===false);
q('btnEq').click(); T('"到静电平衡" ⇒ (1,1) 且无动画', state.anim===null&&state.g===1&&state.t===1);
q('btnReplay').click(); T('重播 ⇒ 回到 (0,0) 并在跑', !!state.anim&&state.g===0&&state.t===0);
/* ---- 2. 动画真的改变画面（文本 + 像素双哈希） ---- */
function pix(){ const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let hx=0; for(let i=0;i<d.length;i+=4001) hx=(hx*31+d[i])>>>0; return hx; }
function txts(){ let s=''; const old=ctx.fillText;
  ctx.fillText=function(str,x,y){ s+=str+'@'+Math.round(x)+','+Math.round(y)+';'; return old.apply(ctx,arguments); };
  draw(); ctx.fillText=old; return s; }
stopAnim();
state.g=0; state.t=0; draw(); const h0=txts(), n0=pix();
state.g=1; state.t=0; const h1=txts(), n1=pix();
state.g=1; state.t=1; const h2=txts(), n2=pix();
T('三个阶段画布文本互不相同', h0!==h1&&h1!==h2&&h0!==h2, 'len='+h0.length+'/'+h1.length+'/'+h2.length);
T('三个阶段画布像素互不相同', n0!==n1&&n1!==n2&&n0!==n2, n0+'/'+n1+'/'+n2);
T('阶段①有"无外加电场"注记', h0.indexOf('无外加电场')>=0);
T('阶段②有"笔直/建立"类注记', h1.indexOf('内部 |')>=0);
T('阶段③有"E ≡ 0"注记', h2.indexOf('恒')<0&&h2.indexOf('导体内部')>=0);
/* ---- 3. 幂等 + z 无 NaN ---- */
let bad=0, grow=0;
[[0,0],[0.5,0],[1,0.5]].forEach(([g,t])=>{ state.g=g; state.t=t;
  draw(); const n=prims.length; if(prims.filter(p=>!isFinite(p.z)).length) bad++;
  draw(); draw(); if(prims.length!==n) grow++; });
T('幂等：重绘不增长（3 个状态）', grow===0, 'grow='+grow);
T('图元 z 无 NaN（3 个状态）', bad===0, 'bad='+bad);
/* ---- 4. DOM 扫查 ---- */
state.g=0; state.t=0; renderPanel(); updateAll();
const sel='.frm,.ex-body,.ex-note,.card-body,.panel,.coord-strip,.slider-group-label,#modeTag,button';
const els=document.querySelectorAll(sel);
let leak=0, und=0, n=0;
els.forEach(e=>{ n++; if(e.innerText.indexOf('@{')>=0) leak++;
  if(/\bundefined\b/.test(e.innerText)) und++; });
T('扫查覆盖面足够', els.length>=25, '扫到='+els.length);
T('面板无 @{ 泄漏 / 无 undefined', leak===0&&und===0, 'leak='+leak+' und='+und);
/* ---- 5. buildNote 五态文案 ---- */
const notes=[];
[[0,0],[0.5,0],[1,0],[1,0.4],[1,1]].forEach(([g,t])=>{ state.g=g; state.t=t; notes.push(buildNote()); });
stopAnim(); renderPanel(); updateAll();
T('buildNote 五态文案互不相同', new Set(notes).size===5, 'uniq='+new Set(notes).size);
T('无外场/平衡文案正确', notes[0].indexOf('还没有外加电场')>=0&&notes[4].indexOf('已达静电平衡')>=0);
/* ---- 6. 阶段卡位置 + 电荷符号不落进卡里 ---- */
const RC=stageCardRect(), cs=camScale, sp=pr(pt(0,0,0));
T('阶段卡在画布内', RC[0]>0&&RC[1]>0&&RC[0]+RC[2]<W&&RC[1]+RC[3]<H,
  'card=['+RC[0].toFixed(0)+','+RC[1].toFixed(0)+','+RC[2]+','+RC[3]+'] W='+W+' H='+H);
T('阶段卡不压住球', RC[0]>sp.x+A_C*cs, 'x0='+RC[0].toFixed(0)+' 球右缘='+(sp.x+A_C*cs).toFixed(0));
stopAnim(); state.t=1; draw();
let inCard=0, tot=0; const old2=ctx.fillText;
ctx.fillText=function(str,x,y){ if(str==='+'||str==='−'){ tot++;
  if(x>RC[0]&&x<RC[0]+RC[2]&&y>RC[1]&&y<RC[1]+RC[3]) inCard++; } return old2.apply(ctx,arguments); };
draw(); ctx.fillText=old2;
T('电荷符号没落进阶段卡（avoidRect 生效）', inCard===0&&tot>=12, 'inCard='+inCard+' 总符号='+tot);
/* 阶段①应恰好是"赤道一圈中性自由电荷"8 个（4 正 4 负），且都没落进卡里 */
state.g=0; state.t=0; draw();
let n0c=0, p0=0, m0=0, inC0=0;
ctx.fillText=function(str,x,y){ if(str==='+'||str==='−'){ n0c++; if(str==='+')p0++; else m0++;
  if(x>RC[0]&&x<RC[0]+RC[2]&&y>RC[1]&&y<RC[1]+RC[3]) inC0++; } return old2.apply(ctx,arguments); };
draw(); ctx.fillText=old2;
T('阶段①：赤道一圈中性电荷 8 个（4+/4−）', n0c===8&&p0===4&&m0===4, n0c+' 个（+'+p0+'/−'+m0+'）');
T('阶段①：中性电荷也不落进卡里', inC0===0, inC0);
stopAnim(); renderPanel(); updateAll();
return R.join('\n')+'\nDONE';
})();
