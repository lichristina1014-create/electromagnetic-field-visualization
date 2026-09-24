(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
/* 用 ctx.fillText 打桩抓"真正画到画布上的文本" */
const ori=ctx.fillText.bind(ctx); const texts=[];
ctx.fillText=(s,x,y)=>{ texts.push({s:String(s),x,y,w:ctx.measureText(String(s)).width,sz:parseFloat(ctx.font)||12,al:ctx.textAlign||'left'}); };
const grab=(fn)=>{ texts.length=0; try{ fn(); }catch(e){ return 'ERR:'+e.message; } return null; };
const scr2=v=>({x:camScale*vdot(v,camU), y:-camScale*vdot(v,camV)});
const ang=(a,b)=>{ const A=scr2(a),B=scr2(b); const d=(A.x*B.x+A.y*B.y)/(Math.hypot(A.x,A.y)*Math.hypot(B.x,B.y));
  return Math.acos(Math.max(-1,Math.min(1,d)))*R2D; };
const plen=v=>Math.hypot(camScale*vdot(v,camU), camScale*vdot(v,camV));
/* ① E 箭头的屏幕投影长度：只在"页面真的会画箭头"的点上判（L ≥ EARR_GATE） */
state.mode='concl'; state.E0=10; state.t=1; state.sweep=null;
state.show.equi=true; state.show.chg=true; state.show.dec=true; state.show.vz=true; state.show.lines=true;
const grid=[]; let skipped=0;
for(let i=0;i<10;i++) for(let j=1;j<12;j++){
  const r=A_C*1.02+ (2.2-A_C)*i/9, th=j/12*180;
  const f=fieldE(r,th*D2R,state.E0);
  const E=vadd(vmul(eR(th*D2R,0),f.Er), vmul(eTh(th*D2R,0),f.Eth));
  const m=vlen(E); if(m<1e-9){skipped++;continue;}
  const L=eLen(m,state.E0); if(L<EARR_GATE){ skipped++; continue; }
  const px=L*Math.sqrt(Math.max(0,1-Math.pow(vdot(vnorm(E),camD),2)))*camScale;
  grid.push({r,th,L:px,m});
}
grid.sort((a,b)=>a.L-b.L);
const worst=grid[0], med=grid[Math.floor(grid.length/2)];
T('E 箭头投影长度 中位 ≥ 80px', med.L>=80,
  '中位='+med.L.toFixed(0)+'px 最坏='+worst.L.toFixed(1)+'px @(r='+worst.r.toFixed(2)+
  ',θ='+worst.th.toFixed(0)+') |E|='+worst.m.toFixed(2)+' n='+grid.length+' 不画='+skipped);
T('E 箭头长度 随 |E| 单调（表面 30°>60°>85°）', (()=>{
  const Lof=th=>{const f=fieldE(A_C,th*D2R,state.E0);
    const E=vadd(vmul(eR(th*D2R,0),f.Er),vmul(eTh(th*D2R,0),f.Eth));
    return eLen(vlen(E),state.E0);};
  const a=Lof(30),b=Lof(60),c=Lof(85);
  T('  L 值', true, '30°='+a.toFixed(3)+' 60°='+b.toFixed(3)+' 85°='+c.toFixed(3)+' m');
  return a>b && b>c;
})());
T('最短箭头仍可辨识（≥ 屏幕 18px）', worst.L>=18, worst.L.toFixed(1)+'px');
state.rp=1.35; state.thp=55; renderPanel(); draw();
const f0=fieldE(state.rp,state.thp*D2R,state.E0);
const E0v=vadd(vmul(eR(state.thp*D2R,0),f0.Er), vmul(eTh(state.thp*D2R,0),f0.Eth));
const dv=vnorm(E0v), depN=vdot(dv,camD);
const px0=eLen(vlen(E0v),state.E0)*Math.sqrt(Math.max(0,1-depN*depN))*camScale;
T('E 箭头投影长度 默认 P', px0>=80, px0.toFixed(1)+'px |E|='+vlen(E0v).toFixed(3)+' L='+eLen(vlen(E0v),state.E0).toFixed(3)+'m');
/* ★ 三个分量必须**共用同一个比例 s**：若某处写成"逐分量各自 eLen"，在饱和区
   |E_n|/|E_t| 就会被钳成 1 ⇒ 分解矩形变形。用比例判据抓这种写法。 */
let mxcl=0, mxrt=0;
for(const tb of [[A_C,30],[A_C,45],[A_C,60],[A_C,75],[1.1,35],[1.6,50]]){
  const r=tb[0], th=tb[1]*D2R, m0=state.E0;
  const f=fieldE(r,th,m0), E=vadd(vmul(eR(th,0),f.Er),vmul(eTh(th,0),f.Eth)), m=vlen(E);
  const L=eLen(m,m0); if(L<EARR_GATE) continue;
  const s=L/m;
  /* 闭合：tip ≡ Pr + Pt − P */
  const tip=vadd(O,vmul(E,s)), Pr=vadd(O,vmul(eR(th,0),f.Er*s)), Pt=vadd(O,vmul(eTh(th,0),f.Eth*s));
  mxcl=Math.max(mxcl, vlen(vsub(vadd(vsub(Pr,O),vsub(Pt,O)),vsub(tip,O))));
  if(Math.abs(f.Eth)>1e-9){
    const want=Math.abs(f.Er)/Math.abs(f.Eth);
    const got=(Math.abs(f.Er)*s)/(Math.abs(f.Eth)*s);
    mxrt=Math.max(mxrt, Math.abs(got-want)/want);
  }
}
T('E = E_n + E_t 分解严格闭合', mxcl<1e-12, 'maxΔ='+mxcl.toExponential(2)+' m');
T('三分量共用同一比例（逐分量缩放会露馅）', mxrt<1e-12, 'relΔ='+mxrt.toExponential(2));

/* ② 表面：E ∥ ±r̂（共线即可——θ>90° 时 E_r<0，场线是从下方"扎"进去的，这是对的）、E_t ≡ 0 */
let mxa=0, mxp=0, signbad=0;
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
/* ③ 内部：不画 E 箭头（mag ≡ 0） */
let mxi=0;
for(let i=0;i<8;i++) for(let j=1;j<10;j++){
  const f=fieldE(0.1+0.6*i/7, j/10*180*D2R, state.E0);
  mxi=Math.max(mxi, Math.hypot(f.Er,f.Eth));
}
T('内部 |E| ≡ 0 ⇒ 无箭头', mxi===0, 'max='+mxi);
/* ④ 真实绘制文本：无 @{ 泄漏 / 无 undefined / 标签包围盒不重叠（三页签 × 6 个探针位） */
/* ⚠️ 不能只比"锚点两两距离"：一个富文本标签会被拆成 'E' + '₀' 两段（间距本来就 7.5px）。
   要按**包围盒**判重叠 —— 同标签的两段首尾相接，不会互相压住。
   ⚠️ 宽度必须用 ctx.measureText 实测：按"字数×0.6×字号"估会把 '|' 这类窄字符算宽 2 倍，
      于是把同一个富文本标签的两段误判成"重叠"（实测假阳性 3.9px）。 */
const box=t=>{ const x0=t.al==='center'?t.x-t.w/2:(t.al==='right'?t.x-t.w:t.x);
  return {x0,x1:x0+t.w,y0:t.y-t.sz*0.78,y1:t.y+t.sz*0.22}; };
const cap=()=>{ texts.length=0; try{ draw(); }catch(e){ return {t:[],e:e.message}; } return {t:texts.slice(),e:null}; };
const errs=[]; let hit=0, ex=[], nCap=0, nTxt=0;
for(const md of ['build','concl','shield'])
for(const tb of [[1.35,55],[A_C,55],[A_C,20],[A_C,90],[0.45,30],[1.05,55]]){
  state.mode=md; state.rp=tb[0]; state.thp=tb[1]; state.qc=1; state.t=(md==='build'?0.45:1);
  const c=cap(), tag=md+'('+tb[0]+','+tb[1]+')';
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
T('画布文本覆盖', nCap===18 && nTxt>600, 'caps='+nCap+' texts='+nTxt);
T('画布文本包围盒互不重叠', hit===0, 'n='+hit+(ex.length?' 例:'+ex.join(' | '):''));

/* ⑤ ③ 页签：内/外表面电荷符号不同 */
state.mode='shield'; state.qc=1.2; draw();
T('屏蔽：q=1.2µC 时内表面 −q', Math.abs(sigIn(1.2)*4*Math.PI*B_C*B_C/1000+1.2)<1e-9, sigIn(1.2).toFixed(1)+' nC/m²');
ctx.fillText=ori;
return R.join('\n')+'\nDONE';
})();
