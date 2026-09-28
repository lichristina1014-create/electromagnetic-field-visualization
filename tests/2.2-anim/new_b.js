/* ══════════════════════════ 场景（两个页签：① 建立 · ③ 屏蔽） ══════════════════════════ */
const O=pt(0,0,0);
const COND_COL='#3E7C99';      /* 导体（球 / 壳）的基色 */
const FLD_COL ='#2E7FA6';      /* 场线 */
const ZL=1e4+40;               /* 高深度档：③ 的腔心标记 / 腔内读数必须压在球壳正面之上，否则被半透明壳洗掉 */

/* 导体球的统一画法：半透明玻璃壳（同源 shellBall）+ 剪影圆；emph = 强调档（③ 的球壳用） */
function drawBall(c,R,col,emph,rimA){
  shellBall(c,R,col,!!emph,rimA);
  ballRim(c,R,col,emph?1.9:1.5,emph?0.95:0.8);
}

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

/* ══════════ ③ 静电屏蔽 ══════════ */
function sceneShield(){
  const E0=state.E0, qc=state.qc;
  if(state.show.box) drawAxesFor();
  if(state.show.lines) drawE0Hint(E0);
  if(state.show.lines){
    shellLines(E0,qc).forEach(sg=>{
      if(sg.length<2) return;
      /* ★ 同前：壳外场线也只画"正对镜头的那一个平面"（③ 的场线是用 RK4 追出来的 xz 剖面折线，
         形状与 ① 不同，但"绕 z 轴转到哪个 φ"这件事共用 faceCurves() 一套规则）。 */
      faceCurves(sg).forEach(ph=>curve(sg.map(p=>rotZ(p,ph)),{color:FLD_COL,w:1.25,alpha:0.62}));
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
    drawSurfaceCharge(B_C*0.93,()=>sigIn(qc),{alpha:1,nu:5,nv:6,avoidS:avS,share:sep,labelGap:30});
  drawSurfaceCharge(A_C*1.05,th=>sigOut(th,E0,qc),{alpha:1,avoidS:avS,share:sep,labelGap:30});
  text(labShell,'导体壳：内部 @{E} ≡ 0',{color:C.green,size:11.5,bold:true,dx:6,dy:-2});

  /* 腔内点电荷 + 腔内的径向场线
     ★ 方位角与场线**同一套规则**：只画"正对镜头的那一个平面"（facePH()，见 new_a.js）。
       原先写死 [0, π/2, π, 3π/2] ⇒ 5 个 θ × 4 个 φ = 20 支箭头从球心炸出来，在这么小的腔里
       糊成一团；改成 φ/φ+π 这 2 个方位后是 10 支，正好是教科书画点电荷场用的那个剖面。 */
  if(Math.abs(qc)>0.02){
    const dir=qc>0?1:-1;
    const ths=[0.45,1.15,Math.PI/2,2.0,2.7], phs=facePH();
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
