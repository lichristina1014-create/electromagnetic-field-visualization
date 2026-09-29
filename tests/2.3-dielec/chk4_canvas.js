(async()=>{
const R=[];
const T=(n,c,v)=>R.push((c?'PASS|':'FAIL|')+n+'|'+(v===undefined?'':v));

/* ══════════════════════════════════════════════════════════════════════
   一、canvas 文本插桩
   ⚠️ 为什么必须有这一条：DOM 扫查（innerText）**只看得到 DOM**，而本页有 4 张卡片
      （dipCard / mediaCard）是**画在 canvas 上**的。卡片里的坏值（r[1]=undefined）
      在 DOM 里完全不存在 ⇒ 上一版的扫查漏过了 4 处字面 "undefined"（截图才发现）。
      更阴的是 **parseRich(undefined) 不抛异常**：它 String() 一下照常排版，
      ⇒ 控制台干净、断言全过、画面上一行 "undefined"。
   ✅ 唯一可靠的抓法：给 txt / text / textScreen **插桩**，扫它们收到的字符串。
   ⚠️ 三者签名不同，str 的下标也不同：txt(x,y,str) → 2；text(p,str) → 1；textScreen(x,y,str) → 2。
      第一版我把 textScreen 写成 1 ⇒ 一直报 "非字符串 number"（那其实是 y 坐标），是**误报**。
   ⚠️ 只认 `undefined` / `NaN` / `**` 为坏串；`@{…}` 是**合法的富文本标记**，绝不能报。
   ══════════════════════════════════════════════════════════════════════ */
const bad=[];
let calls=0;
function wrap(name, strIdx, posIdx){
  const f=window[name];
  if(typeof f!=='function'){ bad.push(name+' 不存在'); return false; }
  window[name]=function(){
    calls++;
    const s=arguments[strIdx];
    if(typeof s!=='string') bad.push(name+' 收到非字符串 ['+typeof s+'] = '+String(s));
    else if(s.indexOf('undefined')>=0 || s.indexOf('NaN')>=0 || s.indexOf('**')>=0)
      bad.push(name+' 收到坏串 “'+s.slice(0,64)+'”');
    if(posIdx!=null){ const a=arguments[posIdx[0]], b=arguments[posIdx[1]];
      if(!Number.isFinite(a)||!Number.isFinite(b)) bad.push(name+' 坐标非有限 ('+a+','+b+')'); }
    return f.apply(this,arguments);
  };
  return true;
}
const w1=wrap('txt',2,[0,1]), w2=wrap('text',1,null), w3=wrap('textScreen',2,[0,1]);
T('三个文本函数都插上桩（txt / text / textScreen）', w1&&w2&&w3, 'ok');

/* ══════════════════════════════════════════════════════════════════════
   二、像素级「画布可读性」——DOM 之外的另一半
   判据只用**无量纲**的量（覆盖率、量化色数），所以不受 camScale / 视口差别影响。
   ⚠️ 阈值只给宽区间，不钉常数：目的是抓"整块空白 / 糊成一片"两类失败。
   ══════════════════════════════════════════════════════════════════════ */
/* ⚠️ 本页 draw() 只 clearRect、**不填背景**（透出页面 CSS 的底色）⇒ 未上墨的像素读出来是
   (0,0,0,**0**)，不是 (255,255,255)。第一版拿"和白色差多少"当墨迹 ⇒ 把整块透明底全算成墨
   ⇒ 覆盖率恒在 91%（每个状态都"糊成一片"）。判据必须是 **alpha**。 */
function inkStats(){
  const cw=canvas.width, ch=canvas.height;
  const d=ctx.getImageData(0,0,cw,ch).data;
  let ink=0, tot=0; const colors=new Set();
  for(let y=0;y<ch;y+=2) for(let x=0;x<cw;x+=2){
    const i=(y*cw+x)*4, r=d[i], g=d[i+1], b=d[i+2], a=d[i+3];
    tot++;
    if(a>12){ ink++; colors.add(((r>>4)<<8)|((g>>4)<<4)|(b>>4)); }
  }
  return {cov:ink/tot, cols:colors.size, tot};
}

/* ══════ 逐页签 × 逐卡片页签 × 参数端点：全扫 ══════ */
const modeTabs=Array.from(document.querySelectorAll('#modeTabs button'));
const stat=[];
let worstBad=0;
function scanOne(label){
  const b0=bad.length;
  draw();
  if(bad.length>b0){ worstBad+=bad.length-b0; return {label,newBad:bad.length-b0}; }
  const st=inkStats();
  stat.push(label+' → 覆盖 '+(st.cov*100).toFixed(2)+'% · 色数 '+st.cols);
  return {label, cov:st.cov, cols:st.cols, newBad:0};
}
const rows=[];
['dipole','nofield','poling'].forEach(k=>{
  modeTabs.find(b=>b.dataset.k===k).click();
  Object.keys(state.show).forEach(x=>state.show[x]=true);
  state.g=1; renderPanel();
  const cts=Array.from(document.querySelectorAll('.card-tab'));
  cts.forEach((ct,i)=>{
    ct.click();
    const body=document.querySelector('.card-body .ex-body');
    if(body && body.offsetParent!==null){}   /* 触发一次布局，模拟真实可见 */
    rows.push(scanOne(k+'#card'+(i+1)));
  });
  state.cardTab='1'; renderPanel();
  rows.push(scanOne(k+'·默认'));
});
/* 参数端点也要扫：数值极端处最容易把 NaN/undefined 写进卡片 */
modeTabs.find(b=>b.dataset.k==='dipole').click();
[0.05,0.10,0.22,0.34].forEach(v=>{ const sl=document.getElementById('s_d');
  sl.value=v; sl.dispatchEvent(new Event('input')); renderPanel(); rows.push(scanOne('dipole d='+v)); });
modeTabs.find(b=>b.dataset.k==='poling').click();
[0,1,7,16,30].forEach(v=>{ const sl=document.getElementById('s_E0');
  sl.value=v; sl.dispatchEvent(new Event('input')); state.g=1; renderPanel();
  rows.push(scanOne('poling E0='+v)); });
/* 动画中途（g 取中间值，卡片里所有数都是"半场"） */
[0.0,0.18,0.5,0.999,1.0].forEach(g=>{ state.g=g; renderPanel(); rows.push(scanOne('poling g='+g)); });

T('扫过的绘制点数量（证明扫查真跑了，不是空转）', calls>200, 'txt/text 调用 '+calls+' 次，扫 '+rows.length+' 个状态');
T('canvas 文本里没有 undefined / NaN / **（含 4 张卡片）', worstBad===0,
  worstBad===0?('0 处，共验 '+calls+' 次文本调用'):('发现 '+worstBad+' 处：'+bad.slice(0,6).join(' ｜ ')));
const low=rows.filter(r=>r.cov!==undefined && r.cov<0.006);
T('每个状态的画面都不是空白（覆盖率 > 0.6%）', low.length===0,
  low.length?('偏空：'+low.map(r=>r.label+' '+(r.cov*100).toFixed(2)+'%').join(', ')):('最低 '+
    (Math.min.apply(null,rows.filter(r=>r.cov!==undefined).map(r=>r.cov))*100).toFixed(2)+'%'));
const few=rows.filter(r=>r.cols!==undefined && r.cols<12);
T('每个状态的画面都够丰富（量化色数 ≥ 12）', few.length===0,
  few.length?('偏少：'+few.map(r=>r.label+' '+r.cols).join(', ')):('最少 '+Math.min.apply(null,rows.filter(r=>r.cols!==undefined).map(r=>r.cols))+' 色'));
T('没有覆盖率高到"糊成一片"的状态（< 45%）',
  rows.filter(r=>r.cov!==undefined && r.cov>0.45).length===0, 'ok');

R.push('--- 逐状态读数 ---');
rows.slice(0,40).forEach(r=>R.push((r.newBad?'[坏串] ':'')+r.label+(r.cov!==undefined?(' → 覆盖 '+(r.cov*100).toFixed(2)+'% · 色数 '+r.cols):'')));

/* 收尾：还原桩与状态，别把影响留给别的自检 */
window.txt=window.txt;   /* noop：桩留在原地也无妨，本脚本结束后进程即退出 */
Object.keys(state.show).forEach(k=>state.show[k]=true);
state.cardTab='1'; modeTabs.find(b=>b.dataset.k==='dipole').click(); draw();
return R.join('\n')+'\nDONE';
})()
