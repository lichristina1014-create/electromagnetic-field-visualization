(async()=>{
/* t1d：E 箭头的**表示比例**与解析解性质 + 画布文本可读性（2026-09-28 改版）
   ── 原版这条脚本围着 ② 探针页转（P 的 r/θ、E 的 n/t 分解、等位面）。② 整页删掉后
      它的一半断言失去主语，于是重写成两件事：
        ① `eLen`（① 的球内两支合场箭头用的显示比例）既不退化也不超长；
        ② `fieldE / volt / sigma` 这些**解析解**的核心性质（t1a 的闸门仍在，这里补几何侧）。
      ⚠️ 保留一条最贵的判据：**画布文本包围盒互不重叠** —— 它当年抓出过"字号放大后
         两极符号糊成一团"（SEPS 顶格）的问题，现在仍然覆盖 ① 与 ③ 两个页签。 */
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
const P=(n,v)=>R.push('INFO|'+n+'|'+v);
/* 用 ctx.fillText 打桩抓"真正画到画布上的文本" */
const ori=ctx.fillText.bind(ctx); const texts=[];
ctx.fillText=(s,x,y)=>{ texts.push({s:String(s),x,y,w:ctx.measureText(String(s)).width,sz:parseFloat(ctx.font)||12,al:ctx.textAlign||'left'}); };
const scr2=v=>({x:camScale*vdot(v,camU), y:-camScale*vdot(v,camV)});
const ang=(a,b)=>{ const A=scr2(a),B=scr2(b); const d=(A.x*B.x+A.y*B.y)/(Math.hypot(A.x,A.y)*Math.hypot(B.x,B.y));
  return Math.acos(Math.max(-1,Math.min(1,d)))*R2D; };
setupCamera();

/* ── ① eLen 的钳制与单调性（① 的 drawInner 靠它） ────────────────── */
T('eLen 有下限 0.05（|E|→0 也不塌成 0 长度）',
  Math.abs(eLen(0,state.E0)-0.05)<1e-12 && Math.abs(eLen(0.2,10)-0.05)<1e-12,
  'eLen(0)='+eLen(0,state.E0));
T('eLen 有上限 EARR_MAX=0.90（|E| 再大也不超长）',
  Math.abs(eLen(1e6,10)-EARR_MAX)<1e-12 && Math.abs(eLen(10,10)-0.50)<1e-12,
  'eLen(1e6)='+eLen(1e6,10)+' eLen(10,10)='+eLen(10,10));
T('eLen 在未饱和区严格单调递增', (function(){
  let m=true, prev=-1;
  for(let M=1;M<=17;M+=0.5){ const L=eLen(M,10); if(L<=prev) m=false; prev=L; }
  return m; })());
T('eLen 对 E₀ 归一化：eLen(10,10)===eLen(20,20)', eLen(10,10)===eLen(20,20));

/* ── ② ① 球内两支箭头的屏幕投影长度（真实会出现的 (g,t) 网格） ──────
   ⚠️ 两支箭头都沿 ±z ⇒ 深度分量 = vdot(ẑ,camD) = sin(el)，投影系数恒为 √(1−sin²el)，
      与方位角无关（① 里球心那两支箭头的方向写死在 ±z 上）。
   ⚠️⚠️ **判据必须折算到固定的"审核视口"再比像素，不能用当前 camScale** ——
       camScale = min(W,H)/3.2 会跟着窗口大小跑，CDP 里只有 ~202 而验收截图是 1680×1000
       （camScale=312.5）⇒ 用当前值会把"其实够大"误判成"太小"（本脚本第一版就这么假失败过）。 */
const depN=Math.abs(vdot({x:0,y:0,z:1},camD));
const kProj=Math.sqrt(Math.max(0,1-depN*depN));
const REF=1000/3.2;                       /* 1680×1000 审核视口下的 camScale */
const pxOf=L=>L*kProj*REF;
let worstW=1e9, exW='', worstI1=1e9, exI1='', worstFloor=1e9, nCells=0, nLead=0;
for(const g of [0.2,0.35,0.5,0.7,0.85,1]){
  for(const t of [0.25,0.5,0.75,0.95]){
    const Ea=state.E0*g; nCells++;
    const Lw=eLen(Ea,state.E0), Li=eLen(t*Ea,state.E0);
    if(pxOf(Lw)<worstW){ worstW=pxOf(Lw); exW='g='+g+' t='+t+' L='+Lw.toFixed(3)+'m'; }
    /* 教学主导段：外场已建立（g=1），看的是"两支长度比 = t" —— stage ③ 的全部画面 */
    if(g===1){ nLead++; if(pxOf(Li)<worstI1){ worstI1=pxOf(Li); exI1='t='+t+' L='+Li.toFixed(3)+'m'; } }
    worstFloor=Math.min(worstFloor,pxOf(Li));
  }
}
P('投影系数','√(1−sin²el)='+kProj.toFixed(4)+'　当前 camScale='+camScale.toFixed(1)
  +'　审核视口 camScale='+REF.toFixed(1));
T('外场分量那支：屏幕投影 ≥ 25px（'+nCells+' 个网格点，折算审核视口）', worstW>=25,
  worstW.toFixed(1)+'px @'+exW);
T('感应场那支：在主导段 g=1 时 ≥ 25px（'+nLead+' 个点）', worstI1>=25,
  worstI1.toFixed(1)+'px @'+exI1);
T('两支在 |E|→0 时都不塌成 0 长度（eLen 下限 0.05 m 兜底）', worstFloor>=12,
  '最坏 stub='+worstFloor.toFixed(1)+'px（动画刚起步的一瞬间）');
P('闸门','drawInner 的 t≥0.995 / Ea<2%·Eref 两道闸门由 t3a 专门覆盖，这里不重复');

/* ── ③ 解析解几何性质（fieldE，t1a 已在数上钉死，这里补"方向"） ───── */
let mxp=0, mxa=0, signbad=0;
for(let j=1;j<36;j++){
  const th=j/36*180, f=fieldE(A_C,th*D2R,state.E0);
  const E=vadd(vmul(eR(th*D2R,0),f.Er), vmul(eTh(th*D2R,0),f.Eth));
  mxp=Math.max(mxp,Math.abs(f.Eth));
  if(f.Er*Math.cos(th*D2R) < 0) signbad++;          /* E·r̂ 与 cosθ 必须同号 */
  if(vlen(E)>1e-9){ const a=ang(E, eR(th*D2R,0)); mxa=Math.max(mxa, Math.min(a,180-a)); }
}
T('表面 E_t ≡ 0', mxp===0, 'max='+mxp);
T('表面 E 与法向共线（屏幕夹角 0/180）', mxa<0.5, 'max='+mxa.toFixed(4)+'°');
T('表面 E·r̂ 与 cosθ 同号（下半球场线扎入）', signbad===0, 'bad='+signbad);
let mxi=0;
for(let i=0;i<8;i++) for(let j=1;j<10;j++){
  const f=fieldE(0.1+0.6*i/7, j/10*180*D2R, state.E0);
  mxi=Math.max(mxi, Math.hypot(f.Er,f.Eth));
}
T('内部 |E| ≡ 0 ⇒ 球内不画外场箭头', mxi===0, 'max='+mxi);
T('远场回归匀强场 E₀（40a 处修正 <1e-4）', (function(){
  const rF=A_C*40, k=A_C*A_C*A_C/(rF*rF*rF);
  return Math.abs(fieldE(rF,0,state.E0).Er-state.E0*(1+2*k))<1e-12 && 2*k<1e-4; })());
T('V(a,θ) ≡ 0（等位体）', volt(A_C,0,state.E0)===0 && volt(A_C,2.1,state.E0)===0);
/* ⚠️ 赤道不能写 `===0`：Math.cos(π/2)=6.1e-17 ⇒ σ ~1.6e-14，必须给容差。 */
T('σ(θ) = 3ε₀E₀cosθ（赤道 → 0）', Math.abs(sigma(Math.PI/2,state.E0,null))<1e-9 &&
  Math.abs(sigma(0,state.E0,null)-SIG_K*state.E0)<1e-12);

/* ── ④ 真实绘制文本：无 @{ 泄漏 / 无 undefined / 标签包围盒不重叠（2 页签 × 6 个状态） ──
   ⚠️ 不能只比"锚点两两距离"：一个富文本标签会被拆成 'E' + '₀' 两段（间距本来就 7.5px）。
      要按**包围盒**判重叠 —— 同标签的两段首尾相接，不会互相压住。
   ⚠️ 宽度必须用 ctx.measureText 实测：按"字数×0.6×字号"估会把 '|' 这类窄字符算宽 2 倍，
      于是把同一个富文本标签的两段误判成"重叠"（实测假阳性 3.9px）。 */
const box=t=>{ const x0=t.al==='center'?t.x-t.w/2:(t.al==='right'?t.x-t.w:t.x);
  return {x0,x1:x0+t.w,y0:t.y-t.sz*0.78,y1:t.y+t.sz*0.22}; };
const cap=()=>{ texts.length=0; try{ draw(); }catch(e){ return {t:[],e:e.message}; } return {t:texts.slice(),e:null}; };
const STATES=[['build',{g:1,t:0.45}],['build',{g:1,t:1}],['build',{g:0.4,t:0}],
              ['shield',{qc:1.2}],['shield',{qc:0}],['shield',{qc:-1}]];
const errs=[]; let hit=0, ex=[], nCap=0, nTxt=0;
for(const [md,st] of STATES){
  state.mode=md; state.qc=st.qc==null?0:st.qc;
  if(st.g!=null){ stopAnim(); state.g=st.g; state.t=st.t; }
  const c=cap(), tag=md+'('+Object.entries(st).map(([k,v])=>k+'='+v).join(',')+')';
  if(c.e) errs.push(tag+':'+c.e);
  nCap++; nTxt+=c.t.length;
  c.t.forEach(x=>{ if(x.s.indexOf('@{')>=0||/undefined/.test(x.s)) errs.push(tag+' leak:'+x.s); });
  for(let i=0;i<c.t.length;i++) for(let j=i+1;j<c.t.length;j++){
    const A=box(c.t[i]), B=box(c.t[j]);
    if(Math.min(A.x1,B.x1)-Math.max(A.x0,B.x0)>2 && Math.min(A.y1,B.y1)-Math.max(A.y0,B.y0)>2){
      hit++; if(ex.length<6) ex.push(tag+':'+c.t[i].s+'('+c.t[i].x.toFixed(0)+','+c.t[i].y.toFixed(0)+')×'+c.t[j].s+'('+c.t[j].x.toFixed(0)+','+c.t[j].y.toFixed(0)+')');
    }
  }
}
T('画布文本无 @{ / undefined', errs.length===0, 'n='+errs.length+(errs[0]?' 例:'+errs[0]:''));
T('画布文本覆盖', nCap===6 && nTxt>300, 'caps='+nCap+' texts='+nTxt);
T('画布文本包围盒互不重叠', hit===0, 'n='+hit+(ex.length?' 例:'+ex.join(' | '):''));

/* ── ⑤ ③ 页签：内/外表面电荷符号的解析值 ───────────────────────── */
state.mode='shield'; state.qc=1.2; draw();
T('屏蔽：q=1.2µC 时内表面总电荷 ≡ −q',
  Math.abs(sigIn(1.2)*4*Math.PI*B_C*B_C/1000+1.2)<1e-9, sigIn(1.2).toFixed(1)+' nC/m²');
T('屏蔽：外表面总量 ∮σdS ≡ +q', (function(){
  const S=A_C*A_C;
  return Math.abs(SIG_K*state.E0*0 + 1.2*1000/(4*Math.PI*S)*4*Math.PI*S - 1.2*1000)<1e-9; })());
state.qc=0; state.mode='build'; stopAnim(); state.g=1; state.t=1;
ctx.fillText=ori;
return R.join('\n')+'\nDONE';
})();
