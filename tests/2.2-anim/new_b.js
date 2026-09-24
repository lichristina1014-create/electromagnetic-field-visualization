/* ══════════════════════════════ 场景（三个页签） ══════════════════════════════ */
const O=pt(0,0,0);
const COND_COL='#3E7C99';      /* 导体（球 / 壳）的基色 */
const FLD_COL ='#2E7FA6';      /* 场线 */
const ZL=1e4+40;               /* 探针相关图元的深度档：必须压在球壳正面之上，不然会被洗掉 */

/* z 轴方向的角弧（θ 从 +z 起算）—— 与 1.x 的 meridianArc 同义，这里只用到 φ 固定的一条 */
function arcZ(r0,th0,th1,ph,n){
  const a=[];
  for(let i=0;i<=n;i++) a.push(sphPt(r0, th0+(th1-th0)*i/n, ph));
  return a;
}
/* 导体球的统一画法：半透明玻璃壳（同源 shellBall）+ 剪影圆，ed 强调档给 ② 用 */
function drawBall(c,R,col,emph,rimA){
  shellBall(c,R,col,!!emph,rimA);
  ballRim(c,R,col,emph?1.9:1.5,emph?0.95:0.8);
}
const probeP=()=>sphPt(state.rp, state.thp*D2R, 0);

/* ① 画布上的固定注记（球心读数 + 两条迁移弧的标签）—— 一起进避让表，别让 ⊕/⊖ 压上去。
   ⚠️ 实测：不加避让时 '正电荷' 标签与一个 '+' 只差 (2,5) px（b10 自检抓到 6 例）。 */
function buildLabels(Ea,t){
  const L=[{p:O, s: Ea<0.05 ? '无外加电场：导体内部也没有场'
      : (t>=0.995 ? '导体内部　@{E} ≡ 0' : '内部 |@{E}| = '+(Ea*(1-t)).toFixed(2)+' kV/m'),
      sz:12.5, dx:0, dy:0, al:'center'}];
  if(state.show.flow && state.g>=0.9 && t>0.02 && t<0.985){
    const ph=cam.az+0.55;
    L.push({p:sphPt(A_C*1.16, Math.PI*0.50-Math.PI*0.30, ph-0.26), s:'正电荷', sz:11, dx:6,  dy:-4, al:'left'});
    L.push({p:sphPt(A_C*1.16, Math.PI*0.50+Math.PI*0.28, ph+0.26), s:'负电荷', sz:11, dx:6, dy:10, al:'left'});
  }
  return L;
}
/* ══════════ ① 静电平衡的建立（含"无外场 → 加场 → 电荷迁移 → 平衡"全过程播放） ══════════ */
function sceneBuild(){
  const E0=state.E0, g=state.g, t=state.t, Ea=E0*g;
  if(state.show.box) drawAxesFor();
  if(state.show.lines) drawE0Hint(Ea);
  if(state.show.lines) drawFieldLines(Ea,t);
  drawBall(O,A_C,COND_COL,false,0.30);
  /* 阶段①：导体自带的自由电荷均匀分布（赤道一圈、正负相间）——随外场淡出 */
  if(state.show.chg) drawNeutralCharge(1-Math.min(1,state.g/0.12));
  /* 感应电荷用**当前实际外场幅值** Ea；alpha 再乘 g ⇒ 阶段①一个符号都没有、阶段②淡入 */
  if(state.show.chg){
    let av=[];
    buildLabels(Ea,t).forEach(l=>{ av=av.concat(avoidText(l.p, plainTxt(l.s), l.sz, l.dx, l.dy, l.al)); });
    drawSurfaceCharge(A_C*1.05, th=>sigma(th,Ea,t), {alpha:t*g, avoidS:av, avoidRect:stageCardRect()});
  }
  if(state.show.flow) drawFlow(Ea,t);
  drawInner(Ea,t,E0);
  /* 关键读数直接写在球心：三种状态分开报，别把"没有外场"和"抵消掉了"混成一句 */
  buildLabels(Ea,t).slice(0,1).forEach(l=>text(l.p, l.s,
    {color: Ea<0.05 ? '#7A8F9B' : (t>=0.995 ? C.green : '#8A5A20'), size:l.sz, bold:true, align:'center'}));
}

/* ══════════ ② 静电平衡的四个结论 ══════════ */
/* 等位面：V = ∓E₀·fac 的"帽形"曲面。fac 的单位是 m ⇒ 形状与 E₀ 无关（只是整体缩放）。 */
function drawEqui(E0){
  const Rmax=A_C*3.3, facs=[0.85,1.45,2.05];
  facs.forEach((fac,i)=>{
    [1,-1].forEach(sg=>{
      const c=equiCurve(sg,E0,fac,Rmax);
      if(c.length<3) return;
      FL_PH.forEach(ph=>curve(c.map(p=>rotZ(p,ph)),{color:'#8FB3C6',w:1.15,dash:[5,5],alpha:0.50}));
    });
  });
  const V1=E0*facs[0];
  text(sphPt(A_C*1.72,0.30,0.55),'V = −'+(E0*0.85).toFixed(1)+' kV 等位面',
    {color:'#7A8F9B',size:11,dx:6,dy:-4});
  text(sphPt(A_C*1.72,Math.PI-0.30,0.55),'V = +'+(E0*0.85).toFixed(1)+' kV 等位面',
    {color:'#7A8F9B',size:11,dx:6,dy:10});
}
/* ★ 探针 P 的几何：P / E 终点 / E_n 终点 / E_t 终点。
   "画"与"避让"共用同一套坐标 ⇒ 以后改比例不会出现"标注躲错地方"。
   三个分量**共用同一个比例 s = L/|E|**，⇒ E = E_n + E_t 的平行四边形严格闭合
   （若改成逐分量各自 eLen，饱和区会被各自钳住 ⇒ 矩形变形）。 */
function probeGeom(E0){
  const th=state.thp*D2R, r=state.rp;
  const P=probeP(), f=fieldE(r,th,E0);
  const E=vadd(vmul(eR(th,0),f.Er), vmul(eTh(th,0),f.Eth)), mag=vlen(E);
  const L=eLen(mag,E0);
  const g={P,f,E,mag,nr:eR(th,0),nt:eTh(th,0),L,s:0,tip:null,Pr:null,Pt:null,Ers:0,Ets:0,shown:false};
  if(mag>1e-9 && L>=EARR_GATE){
    const s=L/mag; g.s=s; g.shown=true; g.tip=vadd(P,vmul(E,s));
    g.Ers=Math.abs(f.Er)*s; g.Ets=Math.abs(f.Eth)*s;
    if(g.Ers>1e-9) g.Pr=vadd(P,vmul(g.nr,f.Er*s));
    if(g.Ets>1e-9) g.Pt=vadd(P,vmul(g.nt,f.Eth*s));
  }
  return g;
}
const probeAvoid=E0=>{const g=probeGeom(E0),a=[g.P];
  [g.tip,g.Pr,g.Pt].forEach(v=>{if(v)a.push(v);}); return a.map(p=>pr(p));};
/* θ 角弧上那个 'θ' 的锚点（drawProbe 里用同一个式子算出来，这里复算一遍给它避让） */
const probeThetaLab=()=>{ const r=state.rp, ra=Math.min(Math.max(r,A_C*0.55),A_C*1.15)*0.52;
  return sphPt(ra*1.16, state.thp*D2R/2, 0); };
/* 画布上的固定注记（与其锚点一起让给 ⊕/⊖） */
const LBL_SURF=()=>sphPt(A_C*1.02,0.30,Math.PI*0.72);
function drawProbe(E0){
  const th=state.thp*D2R, r=state.rp;
  const g=probeGeom(E0), P=g.P, f=g.f, mag=g.mag;
  /* 半径：距离一律用 dimLine（本项目规范：距离绝不用箭头） */
  if(r>A_C+1e-6){
    const Lr=Math.hypot(pr(P).x-pr(O).x, pr(P).y-pr(O).y);
    if(Lr>=70) dimLine(O,P,{color:'#9DB3BF',w:1.2,dash:[5,4],label:'r = '+r.toFixed(2)+' m',
      ldx:10,ldy:-8,lsize:11,z:ZL});
  }
  /* θ 角弧（自 +z 轴起算） */
  const ra=Math.min(Math.max(r,A_C*0.55),A_C*1.15)*0.52;
  line(O,pt(0,0,ra),{color:'#C9D8E0',w:1.1,z:ZL-2});
  curve(arcZ(ra,0,Math.max(th,0.12),0,14),{color:C.orange,w:1.7,arrowEnd:true,z:ZL-2});
  text(sphPt(ra*1.16,th/2,0),'θ',{color:C.orange,size:12,bold:true,dx:4,dy:-3});
  /* E 矢量 + 法向/切向分解 */
  if(g.shown){
    const showN=state.show.dec&&g.Pr&&g.Ers>=0.09, showT=state.show.dec&&g.Pt&&g.Ets>=0.09;
    if(showN&&showT){
      line(g.Pr,g.tip,{color:'#C9D6DD',w:1,dash:[4,4],z:ZL-1});
      line(g.Pt,g.tip,{color:'#C9D6DD',w:1,dash:[4,4],z:ZL-1});
      arrow(P,g.Pr,{color:C.orange,w:2,headScale:.85,label:'@{E}_n',ldx:10,ldy:-8,lsize:11,z:ZL});
      arrow(P,g.Pt,{color:C.green,w:2,headScale:.85,label:'@{E}_t',ldx:10,ldy:12,lsize:11,z:ZL});
      arrow(P,g.tip,{color:C.blue,w:2.7,headScale:1.0,label:'@{E}',ldx:12,ldy:-14,lsize:12,z:ZL+1});
    } else if(showN){
      /* ★ 切向分量为零（恰好落在导体表面上）⇒ E ≡ E_n 是**同一支箭头**。
         此时若仍旧画两支蓝/橙箭头 + 两个标签，标签会在同一点上叠字（实测 7.5 px）。 */
      arrow(P,g.tip,{color:C.blue,w:2.7,headScale:1.0,label:'@{E} = @{E}_n',ldx:12,ldy:-14,lsize:12,z:ZL+1});
    } else {
      arrow(P,g.tip,{color:C.blue,w:2.7,headScale:1.0,label:'@{E}',ldx:12,ldy:-14,lsize:12,z:ZL+1});
    }
  }
  marker(P,{r:5.5,color:C.purple,ring:'#E6D6F0',label:'P',ldx:-28,ldy:14,lsize:12.5,z:ZL+2});
  /* ⚠️ P 的标签放**左下**：右下是 E_t 的标签（arrow 的标签画在杆的中点！实测两者只差 3.5 px） */
}
function sceneConcl(){
  const E0=state.E0;
  if(state.show.box) drawAxesFor();
  if(state.show.lines) drawE0Hint(E0);
  if(state.show.equi) drawEqui(E0);
  if(state.show.lines) drawFieldLines(E0,null);
  drawBall(O,A_C,COND_COL,true,0.42);
  /* ⊕/⊖ 要让开：P、E/E_n/E_t 的标注区、"导体表面"注记、以及 r 尺寸线的标签
     （尺寸线标签画在 O—P 的中点 + (10,−8)，见 dimLine） */
  const lp=LBL_SURF();
  if(state.show.chg){
    const av=probeAvoid(E0).concat(avoidText(lp,'导体表面：V = 0 等位面',11.5,6,-2),
      avoidText(probeThetaLab(),'θ',12,4,-3),
      avoidText(vmul(probeP(),0.5),'r = '+state.rp.toFixed(2)+' m',11,10,-8),
      avoidText(probeP(),'P',12.5,-28,14));
    drawSurfaceCharge(A_C*1.05, th=>sigma(th,E0,null), {alpha:1, avoidS:av, probeGap:34});
  }
  text(lp,'导体表面：V = 0 等位面',{color:C.green,size:11.5,bold:true,dx:6,dy:-2});
  drawProbe(E0);
  if(state.show.vz) chartVz();
}

/* ══════════ ③ 静电屏蔽 ══════════ */
function sceneShield(){
  const E0=state.E0, qc=state.qc;
  if(state.show.box) drawAxesFor();
  if(state.show.lines) drawE0Hint(E0);
  if(state.show.lines){
    shellLines(E0,qc).forEach(sg=>{
      if(sg.length<2) return;
      FL_PH.forEach(ph=>curve(sg.map(p=>rotZ(p,ph)),{color:FLD_COL,w:1.25,alpha:0.62}));
    });
  }
  drawBall(O,A_C,COND_COL,true,0.40);           /* 外表面 */
  drawBall(O,B_C,'#8FB3C6',false,0.26);         /* 腔内表面 */
  /* 赤道上一圈"壳厚"短划：让"导体壳是有厚度的一层"看得见 */
  for(let j=0;j<16;j++){
    const ph=j/16*2*Math.PI;
    line(sphPt(B_C,Math.PI/2,ph),sphPt(A_C,Math.PI/2,ph),{color:COND_COL,w:1.3,alpha:0.45});
  }
  const labShell = sphPt(A_C*1.02,Math.PI/2,Math.PI*1.25);
  const eLab = '腔内 |E| = '+(Q_KV*Math.abs(qc)/(B_C*B_C*0.25)).toFixed(1)+' kV/m（r = b/2 处）';
  /* ★ 一次场景里两次 drawSurfaceCharge 共用 sep ⇒ 内外表面的符号绝不互相压住；
     ★ 三句注记（壳内、q、腔内场）与坐标轴原点的 O 一起进避让表（实测它们原本各压着 1~2 个符号） */
  const sep=[], avS=[pr(O)].concat(
      avoidText(labShell,'导体壳：内部 E ≡ 0',11.5,6,-2),
      Math.abs(qc)>0.02
        ? avoidText(O,(qc>0?'+q = ':'−q = ')+Math.abs(qc).toFixed(2)+' µC',12,14,-14)
            .concat(avoidText(O,eLab,11.5,0,34,'center'))
        : avoidText(O,'腔内无电荷 ⇒ E ≡ 0',12.5,0,0,'center'));
  if(Math.abs(qc)>0.02)
    drawSurfaceCharge(B_C*0.93,()=>sigIn(qc),{alpha:1,nu:5,nv:6,avoidS:avS,share:sep,probeGap:30});
  drawSurfaceCharge(A_C*1.05,th=>sigOut(th,E0,qc),{alpha:1,avoidS:avS,share:sep,probeGap:30});
  text(labShell,'导体壳：内部 @{E} ≡ 0',{color:C.green,size:11.5,bold:true,dx:6,dy:-2});

  /* 腔内点电荷 + 腔内的径向场线 */
  if(Math.abs(qc)>0.02){
    const dir=qc>0?1:-1;
    const ths=[0.45,1.15,Math.PI/2,2.0,2.7], phs=[0,Math.PI/2,Math.PI,3*Math.PI/2];
    ths.forEach(t0=>phs.forEach(p0=>{
      const a=sphPt(B_C*0.10,t0,p0), b=sphPt(B_C*0.985,t0,p0);
      if(dir>0) arrow(a,b,{color:'#B07A2A',w:1.6,headScale:.7,alpha:.85});
      else      arrow(b,a,{color:'#B07A2A',w:1.6,headScale:.7,alpha:.85});
    }));
    marker(O,{r:6,color:'#B07A2A',ring:'#F0E0C8',
      label:(qc>0?'+q = ':'−q = ')+Math.abs(qc).toFixed(2)+' µC',ldx:14,ldy:-14,lsize:12,z:ZL+2});
    text(O,'腔内 |@{E}| = '+(Q_KV*Math.abs(qc)/(B_C*B_C*0.25)).toFixed(1)+' kV/m（r = b/2 处）',
      {color:'#8A5A20',size:11.5,dy:34,align:'center'});   /* dy 要够大：否则压住坐标轴原点的 O */
  } else {
    text(O,'腔内无电荷 ⇒ @{E} ≡ 0',{color:C.green,size:12.5,bold:true,align:'center'});
  }
}

/* ══════════ ① 的阶段指示卡（画布右上角） ══════════
   四个阶段 + 一条进度条。它同时充当 ⊕/⊖ 的**禁布区**（avoidRect）——
   否则阶段③里两极端点的电荷符号会正好压在卡片上。 */
const STAGE_CARD_H=160;
function stageCardRect(){ return [CARD_X(), CARD_Y, CARD_W, STAGE_CARD_H]; }
function drawStageCard(){
  const R=stageCardRect(), x0=R[0], y0=R[1], w=R[2], h=R[3];
  crd(x0,y0,w,h);
  const st=stageOf();
  txt(x0+12,y0+15,'建立过程 · 四个阶段',{size:11.5,bold:true,color:'#1F3D4C'});
  const rows=[
    ['① 无外加电场','自由电荷均匀分布 ⇒ 宏观不显电、内部没有场'],
    ['② 外加匀强场建立','电荷还没来得及动 ⇒ 场线笔直穿过导体'],
    ['③ 自由电荷迁移','正电荷顺场线、负电荷逆场线 ⇒ 堆出感应电荷'],
    ['④ 静电平衡','内部 @{E} ≡ 0 · 表面 @{E} ⊥ 面 · 等位体'],
  ];
  rows.forEach((r,i)=>{
    const y=y0+34+i*24, on=(i===st);
    txt(x0+15,y,r[0],{size:11.5,bold:on,color:on?'#0E6E4A':'#9AAAB4'});
    txt(x0+15,y+11.5,r[1],{size:9,color:on?'#5F7482':'#BFC9D0'});
  });
  const bx=x0+15, by=y0+h-30, bw=w-30, u=animU();
  ctx.save();
  ctx.fillStyle='#E6EEF2'; rrPath(bx,by,bw,5,2.5); ctx.fill();
  ctx.fillStyle=C.green;   rrPath(bx,by,Math.max(3,bw*u),5,2.5); ctx.fill();
  [PH_FIELD[0],PH_FIELD[1]].forEach(f=>{ctx.fillStyle='#FFFFFF';ctx.fillRect(bx+bw*f-1,by-1.5,2,8);});
  ctx.restore();
  txt(x0+15,y0+h-16,(state.anim&&state.anim.playing)?'▶ 正在播放…':(state.anim?'⏸ 已暂停':'（未播放：可手动拖动滑块）'),
    {size:9.5,color:'#9AAAB4'});
}

/* ══════════ 场景装配 ══════════ */
function buildScene(){
  prims=[];                                  /* ★ 第一句必须是 prims=[]（否则每次重绘再叠一层） */
  if(state.mode==='build')  sceneBuild();
  else if(state.mode==='concl') sceneConcl();
  else                      sceneShield();
}
function drawOverlays(){
  if(state.mode==='build'){ drawStageCard(); return; }
  if(state.mode!=='shield') return;
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W, h=118;
  crd(x0,y0,w,h);
  const qc=state.qc, E0=state.E0;
  txt(x0+12,y0+15,'静电屏蔽的两个方向',{size:11.5,bold:true,color:'#1F3D4C'});
  const rows=[
    ['腔内（r < b）', Math.abs(qc)<0.02 ? '|@{E}| ≡ 0' : (Q_KV*Math.abs(qc)/(B_C*B_C)).toFixed(1)+' kV/m', C.green],
    ['壳内（b<r<a）', '|@{E}| ≡ 0', C.green],
    ['内表面总电荷', sigIn(qc).toFixed(1)+' nC（= −q）', C.crimson],
    ['外表面总电荷', (qc*1000).toFixed(1)+' nC（= +q）', C.crimson],
  ];
  rows.forEach((r,i)=>{
    txt(x0+14, y0+40+i*19, r[0], {size:11.5,color:'#5F7482'});
    txt(x0+w-14, y0+40+i*19, r[1], {size:11.5,bold:true,color:r[2],align:'right'});
  });
  txt(x0+14,y0+h-12,'外表面是均匀 +q ⇒ 外部只知道"总量"，不知道 q 在腔内的位置',
    {size:10,color:'#7A8F9B'});
}
