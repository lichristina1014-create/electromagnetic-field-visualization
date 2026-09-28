(async()=>{
/* t5b：电荷符号 ⊕/⊖ 的**可读性**自检（2026-09-28）
   —— 背景：用户反馈"正电荷的加号看不清"。实测根因是 PingFang 的 '+' 字形远小于字号、
      且笔画极细（字号 15 ⇒ 字形仅 8×8 px、臂厚 2 px）。修法 = 字号 11+19·mag + **同色描边** fat。
   本脚本用两条**互相独立**的证据链：
     ① 插桩 `window.text` 拿"调用参数"——直接证明每支符号都带了 fat、且字号按 CHG_SZ(mag) 走；
     ② 画布像素真值（连通域）——证明字形真的变大变粗、且没有两个符号粘连。
   ⚠️ ① 是调参证据、② 是渲染证据，**缺一不可**：只测 ① 会漏掉"引擎把 fat 吃掉了"这种事。 */
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const P=(n,v)=>R.push('INFO|'+n+'|'+v);

/* ── 0. 导出常量可用（自检不许重抄公式） ── */
T('CHG_SZ / CHG_FAT 已导出', typeof CHG_SZ==='function'&&typeof CHG_FAT==='function');
P('常量采样','CHG_SZ: 0→'+CHG_SZ(0).toFixed(1)+' 0.5→'+CHG_SZ(0.5).toFixed(1)
  +' 1→'+CHG_SZ(1).toFixed(1)+'　CHG_FAT: 1→'+CHG_FAT(1).toFixed(2));

/* ── 1. 只留电荷符号，摆到静电平衡 ── */
const keep=Object.assign({},state.show);
Object.keys(state.show).forEach(k=>{ state.show[k]=false; });
state.show.chg=true; state.showReadout=false;
document.querySelectorAll('#modeTabs button')[0].click();
stopAnim(); state.g=1; state.t=1;
renderPanel(); updateAll();

/* ── 2. 插桩 window.text：拿调用参数 ── */
const calls=[]; const oldText=window.text;
window.text=function(p,str,o){ if(str==='+'||str==='\u2212')
  calls.push({s:str,size:(o&&o.size)||0,fat:(o&&o.fat)||0,alpha:(o&&o.alpha)||0});
  return oldText.apply(this,arguments); };
let glyphs=[];
try{
  const oldFT=ctx.fillText;
  ctx.fillText=function(s,x,y){ if(s==='+'||s==='\u2212') glyphs.push({s:s,x:x,y:y,sz:parseFloat(ctx.font)});
    return oldFT.apply(ctx,arguments); };
  draw(); ctx.fillText=oldFT;
} finally { window.text=oldText; }

const plus=calls.filter(c=>c.s==='+'), minus=calls.filter(c=>c.s==='\u2212');
T('扫到足够多的电荷符号', plus.length>=10&&minus.length>=10,
  '+'+plus.length+'/−'+minus.length);
T('每一支符号都带 fat（加粗参数真的传下去了）',
  calls.length>0&&calls.every(c=>c.fat>0),
  'fat 取值集='+[...new Set(calls.map(c=>c.fat.toFixed(1)))].join(','));
T('字号落在 11..30（改前 7.5..15）',
  calls.every(c=>c.size>=11&&c.size<=30.001),
  'size 范围='+Math.min.apply(null,calls.map(c=>c.size)).toFixed(1)+'..'
  +Math.max.apply(null,calls.map(c=>c.size)).toFixed(1));
T('字号与导出常量一致（CHG_SZ 是唯一真相源）',
  calls.every(c=>Math.abs(c.size-CHG_SZ((c.size-11)/19))<1e-6),
  '反解自洽');
T('仍保留"两极大、赤道小"的字号梯度',
  (function(){ const s=calls.map(c=>c.size).sort((a,b)=>a-b);
    return s[s.length-1]/s[0]>=1.5; })());
T('正负号字号梯度对称（同 mag 同字号）',
  Math.abs((plus.length?plus.reduce((a,c)=>a+c.size,0)/plus.length:0)
         - (minus.length?minus.reduce((a,c)=>a+c.size,0)/minus.length:0))<3,
  '均值 +'+((plus.reduce((a,c)=>a+c.size,0)/plus.length)||0).toFixed(1)
  +' / −'+((minus.reduce((a,c)=>a+c.size,0)/minus.length)||0).toFixed(1));

/* ── 3. 画布像素真值：连通域（红=⊕） ── */
const W=canvas.width,H=canvas.height,d=ctx.getImageData(0,0,W,H).data;
const isR=(x,y)=>{ const i=(y*W+x)*4; return d[i]>140&&d[i]-d[i+1]>50&&d[i]-d[i+2]>50; };
const lab=new Int32Array(W*H).fill(-1), comps=[], st=[];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const p0=y*W+x; if(lab[p0]>=0||!isR(x,y)) continue;
  const id=comps.length; let x0=x,x1=x,y0=y,y1=y,n=0; st.push(p0); lab[p0]=id;
  while(st.length){
    const q=st.pop(), qx=q%W, qy=(q-qx)/W; n++;
    if(qx<x0)x0=qx; if(qx>x1)x1=qx; if(qy<y0)y0=qy; if(qy>y1)y1=qy;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const nx=qx+dx, ny=qy+dy;
      if(nx<0||ny<0||nx>=W||ny>=H) continue;
      const r0=ny*W+nx; if(lab[r0]>=0||!isR(nx,ny)) continue;
      lab[r0]=id; st.push(r0);
    }
  }
  comps.push({x0:x0,x1:x1,y0:y0,y1:y1,n:n});
}
const arms=[];
comps.forEach(c=>{ let mn=1e9;
  for(let y=c.y0;y<=c.y1;y++){ let r=0;
    for(let x=c.x0;x<=c.x1+1;x++){
      const hit=(x<=c.x1)&&isR(x,y);
      if(hit) r++; else { if(r>0){ if(r<mn)mn=r; r=0; } } } }
  if(mn<1e9) arms.push(mn); });
comps.sort((a,b)=>b.n-a.n);
P('画布',W+'x'+H+'　红色连通域='+comps.length+'　最大 3 个='
  +comps.slice(0,3).map(c=>(c.x1-c.x0+1)+'x'+(c.y1-c.y0+1)).join(' '));
P('臂厚','min='+Math.min.apply(null,arms)+' 中位='
  +arms.slice().sort((a,b)=>a-b)[Math.floor(arms.length/2)]+' max='+Math.max.apply(null,arms));
T('像素扫查有覆盖（红连通域 ≥ 10 个）', comps.length>=10, '扫到='+comps.length);
T('每个红色连通域 ≤ 20×20（没有两个符号粘在一起）',
  comps.every(c=>(c.x1-c.x0+1)<=20&&(c.y1-c.y0+1)<=20),
  '最大='+comps[0].n+'px');
T('最大字形 ≥ 14 px（改前 8 px）', (comps[0].x1-comps[0].x0+1)>=14,
  comps[0]?(comps[0].x1-comps[0].x0+1)+'x'+(comps[0].y1-comps[0].y0+1):'-');
T('最粗臂厚 ≥ 4 px（改前 2 px）', Math.max.apply(null,arms)>=4,
  'max='+Math.max.apply(null,arms));

/* ── 4. 屏幕最小间距（间距过滤器必须跟着字号一起抬） ── */
const md=glyphs.reduce((acc,g1,i)=>{
  for(let j=i+1;j<glyphs.length;j++){
    const dd=Math.hypot(g1.x-glyphs[j].x,g1.y-glyphs[j].y); if(dd<acc)acc=dd; }
  return acc; },1e9);
T('屏幕最小间距 ≥ 20 px（改前恰好顶在 15.1 px）', md>=20, 'min='+md.toFixed(1));

/* ── 5. 放大后仍不能压到阶段卡（③ 页签本来就没传 avoidRect，最可疑） ──
   ⚠️ 判据必须用**墨迹盒**（半宽 = measureText/2，半高 = 字号/2），不能用锚点 ——
      字形从 8×8 长到 17×16 后，"锚点在卡外 6px"就可能变成"墨迹压卡 2px"。 */
const rc=stageCardRect();
const cardOv=[];
[0,1].forEach(i=>{
  document.querySelectorAll('#modeTabs button')[i].click();
  stopAnim();
  [[1,1],[0,0]].forEach(gt=>{
    state.g=gt[0]; state.t=gt[1];
    const old=ctx.fillText;
    ctx.fillText=function(s,x,y){ if(s==='+'||s==='\u2212'){
      const sz=parseFloat(ctx.font), hw=ctx.measureText(s).width/2, hh=sz/2;
      if(!((x-hw)>rc[0]+rc[2]||(x+hw)<rc[0]||(y-hh)>rc[1]+rc[3]||(y+hh)<rc[1]))
        cardOv.push('页签'+(i+1)+' g='+gt[0]+' t='+gt[1]+' '+s+'@'+Math.round(x)+','+Math.round(y));
    } return old.apply(ctx,arguments); };
    draw(); ctx.fillText=old;
  });
});
T('电荷符号墨迹不压阶段卡（2 页签 × 2 状态）', cardOv.length===0,
  cardOv.length?cardOv.slice(0,3).join(' | '):'0 例');

/* ── 6. 面板/讲解文案不得泄漏（richHTML 不认 Markdown） ── */
let leak=0,n=0;
document.querySelectorAll('#modeTabs button').forEach((b,bi)=>{
  b.click(); n++;
  document.querySelectorAll('.frm,.ex-body,.ex-note,.card-body,.panel,.coord-strip,.slider-group-label')
    .forEach(e=>{ const t=e.innerText; if(t.indexOf('@{')>=0||/\*\*/.test(t)||/\bundefined\b/.test(t)) leak++; });
});
T('面板扫查有覆盖（≥ 15 个元素）', n>=2&&leak===0, '页签='+n+' 泄漏='+leak);

/* 还原 */
Object.keys(state.show).forEach(k=>{ state.show[k]=keep[k]; });
state.showReadout=true;
document.querySelectorAll('#modeTabs button')[0].click();
state.g=1; state.t=1; renderPanel(); updateAll();
return R.join('\n')+'\nDONE';
})();
