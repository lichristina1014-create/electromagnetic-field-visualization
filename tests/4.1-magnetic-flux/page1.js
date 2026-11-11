/* ============================================================================
   4.1 磁感应强度与磁通量 —— 页面专属（一）
   图元助手 / 四个页签的场景装配 / 右上信息卡 / 画布插图 / 面板上半
   ----------------------------------------------------------------------------
   ⚠️ 所有进画布的串都必须走 parseRich()（@{...} 矢量 / _x 下标）；
      所有进 DOM 的串都必须走 richHTML()。本引擎**不认 Markdown 星号**，加粗只能 <b>。
   ⚠️ buildScene() 的第一句必须是 prims=[]（否则每帧往上叠一层整场景）。
   ★ 3D 里的文字标签只留"必须钉在物体上"的那几个（B₁₂、F、P、n̂、θ、根数），
     其余说明一律走画布左上角的 textScreen 提示行 —— 世界坐标锚的标签在
     窄窗/旋转后极容易撞到右上信息卡。
   ============================================================================ */

/* ══════════════════════════ 画布小卡助手（与 2.1~2.4 / 3.x / 4.2 同源） ══════════════════════════ */
function txt(x,y,str,o={}){
  ctx.save();
  const lo=richLayout(ctx,parseRich(str),o.size||12,!!o.bold);
  richDraw(ctx,lo,x,y,o.align||'left',o.color||C.ink);
  ctx.restore();
}
function rrPath(x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-r);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x+r,y+h);
  ctx.lineTo(x,y+h-r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function crd(x,y,w,h){
  ctx.save(); ctx.shadowColor='rgba(30,60,80,.10)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2;
  rrPath(x,y,w,h,10); ctx.fillStyle='rgba(255,255,255,.95)'; ctx.fill(); ctx.restore();
  ctx.save(); rrPath(x,y,w,h,10); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
}

/* ══════════════════════════ 配色 ══════════════════════════ */
const ZL       = 1e4+40;         /* 标注深度档：压在导线 / 球面之上 */
const WIRE_HEX = '#33505E';      /* 导线本体（深蓝灰） */
const CUR_HEX  = C.crimson;      /* 电流箭头（红） */
const B_HEX    = '#0F9ED5';      /* 磁感应强度（蓝） */
const F_HEX    = C.orange;       /* 安培力（橙） */
const FL_HEX   = '#5E9FBF';      /* 磁感线 */
const PL_HEX   = C.teal;         /* 穿过面的那块板 */
const LOOP_HEX = '#8A6BB8';      /* 球内小电流环（紫） */
const Q_HEX    = C.crimson;      /* 电荷（红） */
const OUT_HEX  = C.green;        /* 穿出（绿） */
const IN_HEX   = '#B0577E';      /* 穿入（玫红） */

/* ══════════════════════════ 右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
    /* ⚠️ 章节行要同时认两种写法：['§','文本'] 与 ['§ 文本']（2.3 的教训：
       只认前者 ⇒ 单元素那种右列取 r[1] 得 undefined，而 parseRich(undefined)
       **不抛异常**、静默排版成 "undefined"）。 */
    const markerOnly=(r[0]==='§');
    if(markerOnly || (r.length===1 && String(r[0]||'')[0]==='§')){
      const lab=markerOnly ? String(r[1]==null?'':r[1]) : String(r[0]).slice(1);
      txt(x0+11,y,lab.trim(),{size:11,bold:true,color:r[2]||'#1F3D4C'}); return;
    }
    let lab=String(r[0]==null?'':r[0]);
    if(lab[0]==='§') lab=lab.slice(1).trim();
    txt(x0+13,y,lab,{size:11,color:'#5F7482'});
    txt(x0+w-13,y,r[1]==null?'':String(r[1]),{size:11,bold:true,color:r[2]||'#0E4A66',align:'right'});
  });
}

/* ══════════════════════════ 通用场景件 ══════════════════════════ */
/* xy 平面上的整圆（绕 z 轴） */
function ringPts3(cx,cy,r,z,N){
  const out=[]; for(let i=0;i<=N;i++){ const a=2*Math.PI*i/N;
    out.push(pt(cx+r*Math.cos(a), cy+r*Math.sin(a), z)); }
  return out;
}
/* 竖直导线：粗线 + 白色高光芯（画成"圆柱"的既视感） */
function wireV(x,y){
  line(pt(x,y,WIRE_Z0),pt(x,y,WIRE_Z1),{color:WIRE_HEX,w:4.4});
  line(pt(x,y,WIRE_Z0),pt(x,y,WIRE_Z1),{color:'#FFFFFF',alpha:.50,w:1.25});
}
/* 导线上的电流方向小箭头（红） */
function curMarks(x,y,sign,zs){
  zs.forEach(z=>{
    arrow(pt(x,y,z-0.105*sign),pt(x,y,z+0.105*sign),{color:CUR_HEX,w:3.2,z:ZL,headScale:0.85});
  });
}
/* 圆上的切向小箭头（右手螺旋的方向指示）；sg=−1 表示电流反向 ⇒ 绕向也反 */
function ringArrows(cx,cy,r,z,azs,len,col,sg){
  const k=(sg==null?1:sg);
  azs.forEach(deg=>{
    const phi=deg*D2R, p=pt(cx+r*Math.cos(phi), cy+r*Math.sin(phi), z);
    arrow(p, vadd(p,vmul(phiHat(phi),len*k)), {color:col||B_HEX,w:1.9,headScale:0.72,alpha:.9});
  });
}
/* 球壳：透明填充 + 3 条纬线 + 4 条子午线 + 轮廓圆
   ★ 正交投影下球面的轮廓**恒为一个圆**（半径 R·camScale）——最省事也最准。 */
function sphereShell(c,R,hex,wk){
  /* wk = 线框浓淡系数（磁感线那侧传 0.55：球壳让位给场线，否则两张网叠出摩尔纹） */
  const k0=(wk==null?1:wk);
  const S=pr(c), rr=Math.max(6,R*camScale);
  P_(vdot(c,camD)-R*0.55, ()=>{
    const g=ctx.createRadialGradient(S.x-rr*0.30,S.y-rr*0.34,rr*0.10,S.x,S.y,rr*1.02);
    g.addColorStop(0,hexA(hex,0.02)); g.addColorStop(0.72,hexA(hex,0.09)); g.addColorStop(1,hexA(hex,0.20));
    ctx.save(); ctx.beginPath(); ctx.arc(S.x,S.y,rr,0,7); ctx.fillStyle=g; ctx.fill(); ctx.restore();
  });
  [-0.55,0,0.55].forEach(k=>{
    const rr0=R*Math.sqrt(Math.max(1e-6,1-k*k));
    curve(ringPts3(c.x,c.y,rr0,c.z+R*k,40),{color:hexA(hex,0.30*k0),w:1.05});
  });
  for(let m=0;m<4;m++){
    const phi=m*Math.PI/2, pts=[];
    for(let i=0;i<=32;i++){ const t=Math.PI*i/32;
      pts.push(pt(c.x+R*Math.sin(t)*Math.cos(phi), c.y+R*Math.sin(t)*Math.sin(phi), c.z+R*Math.cos(t))); }
    curve(pts,{color:hexA(hex,0.24*k0),w:1.0});
  }
  P_(vdot(c,camD), ()=>{ ctx.save(); ctx.beginPath(); ctx.arc(S.x,S.y,rr,0,7);
    ctx.strokeStyle=hexA(hex,0.52); ctx.lineWidth=1.5; ctx.stroke(); ctx.restore(); });
}
/* 折线与球面的交点（含"出/入"标记）—— 画穿出/穿入的小圆点用 */
function crossPts(pts,c,R){
  const out=[];
  for(let i=1;i<pts.length;i++){
    const fa=vlen(vsub(pts[i-1],c))-R, fb=vlen(vsub(pts[i],c))-R;
    if(fa===fb) continue;
    if((fa<0&&fb>=0)||(fa>=0&&fb<0)){
      const u=fa/(fa-fb);
      out.push({p:vadd(pts[i-1],vmul(vsub(pts[i],pts[i-1]),u)), goingOut:fa<0});
    }
  }
  return out;
}
/* 画布左上角的说明行（固定屏幕坐标，永远不会撞到右上信息卡） */
function hintLine(s,col,row){ textScreen(16,72+(row||0)*19,s,{size:11.5,color:col||'#5F7482'}); }

/* ══════════════════════════ ① 安培力 ══════════════════════════ */
function drawAmpereScene(){
  /* 导线 1 放在 +x 侧（camU 的 x 分量为负 ⇒ 屏幕上偏左），导线 2 在 −x 侧 */
  const s=sepW(state.d), x1=s/2, x2=-s/2;
  const sg1=curSgn(state.I1), sg2=curSgn(state.I2);   /* 电流方向：+1 沿 +z（屏幕向上） */
  const fdir=forceSign();                  /* +1 = 指向导线 1（相吸）／−1 = 背向（相斥）／0 = 无力 */
  const np=noCurrent();

  if(state.show.wire){
    wireV(x1,0); wireV(x2,0);
    curMarks(x1,0,sg1,[-0.62,0,0.62]);
    curMarks(x2,0,sg2,[-0.44,0.22,0.66]);
    /* 标签带上方向箭头：让学生一眼看出哪根是"反的" */
    text(pt(x1,0,WIRE_Z1+0.10),'@{I}₁ '+(sg1>0?'↑':'↓'),{color:CUR_HEX,bold:true,size:13,align:'center'});
    text(pt(x2,0,WIRE_Z1+0.10),'@{I}₂ '+(sg2>0?'↑':'↓'),{color:CUR_HEX,bold:true,size:13,align:'center'});
    dimLine(pt(x2,0,-0.86),pt(x1,0,-0.86),
      {color:C.muted,w:1.2,label:'d = '+state.d.toFixed(3)+' m',lsize:11.5,ldy:13});
  }

  /* 导线 1 的磁场：半径正好等于间距的那一圈**恰好穿过导线 2** —— 全页最要紧的一笔 */
  if(state.show.bcir){
    [0.34,-0.34].forEach((z,k)=>{
      curve(ringPts3(x1,0,s,z,48),{color:hexA(B_HEX,0.55),w:1.35,dash:k?[5,4]:null});
      if(Math.abs(state.I1)>1e-9) ringArrows(x1,0,s,z,k?[20,200]:[70,250],0.085,B_HEX,sg1);
    });
  }

  if(state.show.force){
    /* B₁₂：导线 1 在导线 2 处的场 —— 方向正是那一圈圆的切向（I₁ 沿 +z 时为 −ŷ，反向则 +ŷ） */
    const B12=bLine(state.I1,state.d);
    if(Math.abs(state.I1)>1e-9){
      const lb=Math.max(0.09,Math.min(0.34,0.34*B12/4e-5));
      arrow(pt(x2,0,0.14),pt(x2,-sg1*lb,0.14),
        {color:B_HEX,w:2.6,z:ZL,headScale:0.95,label:'@{B}₁₂',lsize:11.5,ldx:-4,ldy:-9});
    }

    /* 力：一对等大反向的箭头（牛顿第三定律）；长度线性 + 上下限钳制 */
    if(fdir!==0){
      const F=fTotal(state.I1,state.I2,state.d,state.La);
      const lf=Math.min(fArrowLen(F), s*0.42);   /* ⚠️ 上限 0.42·s：两支箭头各占半段，中间留空隙不叠 */
      arrow(pt(x2,0,-0.12),pt(x2+fdir*lf,0,-0.12),
        {color:F_HEX,w:4.0,z:ZL,label:'@{F}₂₁',lsize:12.5,ldy:-11});
      arrow(pt(x1,0,-0.12),pt(x1-fdir*lf,0,-0.12),
        {color:F_HEX,w:4.0,z:ZL,label:'@{F}₁₂',lsize:12.5,ldy:15});
    }
  }
  hintLine('@{B}₁ 绕导线 1 成圈；半径 = d 的那圈恰好穿过导线 2', B_HEX);
  hintLine(np ? '有一根导线没通电流 ⇒ 没有 @{B}₁₂，也就没有力'
              : (sameDir() ? '两根电流同向（同号）⇒ 相吸：两支力互指'
                           : '两根电流反向（异号）⇒ 相斥：两支力背指'), F_HEX, 1);
}

/* ══════════════════════════ ② 磁感应强度 ══════════════════════════ */
/* 箭头长度 ∝ 1/ρ（ρ 用**世界**半径；ρ=QUIV_R0 处最长 QUIV_L0，再近就截顶） */
function bLen(rho){ return Math.max(0.07,Math.min(QUIV_L0,QUIV_L0*(QUIV_R0/Math.max(0.05,rho)))); }
/* ★★ P 点的取位（踩过的坑，别改回去）：
   若把 P 放在 (0,r,0)，它正好躺在 **y 轴上** ⇒ 橙色的 F 箭头与橙色的 y 轴共线，
   画面上看起来像"轴线自带一个箭头"，学生会把坐标轴当成力。
   抬高到 z=0.42（场沿导线平移不变 ⇒ 物理上完全等价）既避开了 y 轴，
   也避开了 z=0 那三圈的箭头，三支箭头才散得开。 */
const PROBE_Z = 0.42;
function drawFieldScene(){
  const rw=state.rp*R_M2W;
  const P=pt(0,rw,PROBE_Z), SP=pr(P);  /* P 的屏幕位置：环上的箭头要给它让位 */

  if(state.show.wire){
    wireV(0,0);
    curMarks(0,0,1,[-0.62,0,0.62]);
    text(pt(0,0,WIRE_Z1+0.10),'@{I}',{color:CUR_HEX,bold:true,size:13,align:'center'});
    /* 右手螺旋：拇指顺电流、四指绕向 = @{B} 的绕向 */
    curve(ringPts3(0,0,0.42,0.84,40),{color:hexA(B_HEX,0.45),w:1.3,dash:[4,4]});
    ringArrows(0,0,0.42,0.84,[30],0.09);
    text(pt(0,0.42,0.93),'右手螺旋',{color:B_HEX,size:11,bold:true,align:'center'});
  }

  if(state.show.bvec){
    QUIV_GUIDE.forEach(r=>curve(ringPts3(0,0,r,0,48),{color:hexA(B_HEX,0.30),w:1.1,dash:[4,4]}));
    for(let ix=0;ix<QUIV_N;ix++) for(let iy=0;iy<QUIV_N;iy++){
      const x=-QUIV_SPAN+2*QUIV_SPAN*ix/(QUIV_N-1);
      const y=-QUIV_SPAN+2*QUIV_SPAN*iy/(QUIV_N-1);
      const rho=Math.hypot(x,y);
      if(rho<1e-6) continue;                       /* 中心那格在导线上，跳过 */
      const p=pt(x,y,0);
      const L=bLen(rho), e=vadd(p,vmul(phiHat(Math.atan2(y,x)),L));
      /* ★ 屏幕空间最小间距过滤：P 附近（18px 内）的 quiver 箭头不画，
         否则拖 r 让 P 走进场里时，三支探针箭头会和 quiver 糊成一团。 */
      const S0=pr(p), S1=pr(e);
      if(Math.hypot(S0.x-SP.x,S0.y-SP.y)<18 || Math.hypot(S1.x-SP.x,S1.y-SP.y)<18) continue;
      arrow(p, e, {color:B_HEX,w:1.5,alpha:0.9,headScale:0.7});
    }
  }

  if(state.show.probe){
    /* P 脚下这一圈：让"B 就是这一圈的切向"看得见 */
    curve(ringPts3(0,0,rw,PROBE_Z,48),{color:hexA(B_HEX,0.62),w:1.5});
    const B=bLine(state.If,state.rp);
    const lB=Math.max(0.16,Math.min(0.46,0.46*B/2e-5));
    const dphi=phiHat(Math.PI/2);                    /* = (−1,0,0) */
    marker(P,{color:F_HEX,r:5,ring:hexA(F_HEX,.35),label:'P',lsize:12});
    /* ① 该点的 @{B} */
    arrow(P, vadd(P,vmul(dphi,lB)), {color:B_HEX,w:3.2,z:ZL,headScale:1.0,
      label:'@{B}',lsize:13,ldx:-2,ldy:-11});
    /* ② 测试电流元 I₂dl₂（沿 +z，与导线同向） */
    arrow(P, vadd(P,pt(0,0,0.24)), {color:CUR_HEX,w:2.6,z:ZL,headScale:0.95,
      label:'@{I}₂d@{l}₂',lsize:11.5,ldx:-40,ldy:1});
    /* ③ 力 F = I₂dl₂ × B ⇒ 指向导线（同向相吸，回勾 ①） */
    arrow(P, vadd(P,pt(0,-0.28,0)), {color:F_HEX,w:3.2,z:ZL,headScale:1.0,
      label:'@{F}',lsize:13,ldy:15});
    /* dl ⊥ B 的直角标记 */
    const e=0.055;
    curve([vadd(P,pt(-e,0,e)),vadd(P,pt(0,0,e)),vadd(P,pt(-e,0,0))],{color:C.muted,w:1.1});
    /* r 的数值卡片里有，画面上不再标（P 周围已经有三支箭头 + 三个标签） */
  }
  hintLine('@{B} 沿圆周切向、大小 1/r 衰减 —— 箭头近长远短', B_HEX);
}

/* ══════════════════════════ ③ 磁通量 ══════════════════════════ */
function drawFluxScene(){
  const th=state.th, A=state.A3;
  const pierce=piercingXs(th,A);
  const isP=x=>pierce.some(v=>Math.abs(v-x)<1e-9);

  if(state.show.fline){
    lineXs().forEach(x=>{
      const on=isP(x);
      const p0=pt(x,0,FLUX_Z0), p1=pt(x,0,FLUX_Z1);
      curve([p0,p1],{color:on?hexA(B_HEX,.95):hexA(B_HEX,.26),w:on?2.3:1.2});
      /* 每根线都保留箭头：θ=90° 时"一根不穿但场还在"全靠这些箭头说话 */
      arrow(pt(x,0,FLUX_Z1-0.17),p1,{color:on?B_HEX:hexA(B_HEX,.30),w:on?2.1:1.2,headScale:0.85});
    });
  }

  if(state.show.plate){
    /* ⚠️ poly 的 fillAlpha 会同时压低描边透明度（引擎的行为）⇒ 必须显式给 strokeAlpha */
    poly(plateCorners(th,A),{fill:PL_HEX,fillAlpha:.13,strokeAlpha:1,stroke:PL_HEX,w:1.9});
    const n=plateBasis(th).n;
    arrow(pt(0,0,0), vmul(n,0.50), {color:LOOP_HEX,w:2.4,z:ZL,headScale:0.95,
      label:'n̂',lsize:12.5,ldy:-9});
    /* θ：从 +z 转到 n̂（两者都在 xz 平面内 ⇒ 直接在 xz 平面画弧） */
    if(th>4 && th<176){
      const arc=[]; for(let i=0;i<=24;i++){ const t=th*D2R*i/24;
        arc.push(pt(0.30*Math.sin(t),0,0.30*Math.cos(t))); }
      curve(arc,{color:LOOP_HEX,w:1.4,dash:[4,3]});
      const tm=th*D2R/2;
      text(pt(0.345*Math.sin(tm),0,0.345*Math.cos(tm)),'θ',
        {color:LOOP_HEX,bold:true,size:12.5,align:'center'});
    }
  }

  if(state.show.count){
    const n0=pierce.length, sgn=Math.cos(th*D2R)>=0?1:-1;
    text(pt(0,0,FLUX_Z1+0.14),'穿过面的磁感线：'+n0+' 根（净 '+(n0===0?0:sgn*n0)+' 根）',
      {color:PL_HEX,bold:true,size:12.5,align:'center'});
  }
  /* θ=90° 的关键句：md 里明写的那一句，必须最显眼 */
  if(Math.abs(Math.cos(th*D2R))<0.02)
    hintLine('Φ = 0，但 @{B} 还在！面只是与场平行，一根线都没被打中', F_HEX);
  else
    hintLine('Φ = B·A·cos θ ＝ 数穿过面的磁感线根数', B_HEX);
}

/* ══════════════════════════ ④ 闭合面的磁通量 ══════════════════════════ */
function drawClosedScene(){
  const R=state.R4;

  /* ── 磁感线那一侧：球内一个小电流环，场线闭合成环 ── */
  if(state.show.sphM) sphereShell(CEN_M,R,'#156082',0.55);
  if(state.show.linesM){
    for(let i=0;i<DIP_N;i++){
      /* 方位从 45° 起、口径在 0.62/0.52 之间交替：四条线不重合，看着才像一族而不是一条 */
      const pts=dipolePts(i*90+45, i%2?DIP_L:DIP_L*0.84).map(p=>vadd(p,CEN_M));
      curve(pts,{color:hexA(FL_HEX,.95),w:2.1});
      [Math.floor(pts.length*0.30),Math.floor(pts.length*0.78)].forEach(k=>{
        if(k>0&&k<pts.length-1) arrow(pts[k-1],pts[k],{color:FL_HEX,w:1.9,headScale:0.7});
      });
      crossPts(pts,CEN_M,R).forEach(cp=>{
        screenDot(cp.p,3.4,cp.goingOut?OUT_HEX:IN_HEX,.95,ZL);
      });
    }
    /* 球内的小电流环（偶极子的"源"） */
    curve(ringPts3(CEN_M.x,CEN_M.y,LOOP_A,CEN_M.z,36),{color:LOOP_HEX,w:2.6,z:ZL});
    ringArrows(CEN_M.x,CEN_M.y,LOOP_A,CEN_M.z,[0,120,240],0.05,LOOP_HEX);
    text(pt(CEN_M.x,CEN_M.y,CEN_M.z-LOOP_A-0.13),'球内：小电流环',
      {color:LOOP_HEX,size:10.5,bold:true,align:'center'});
    text(pt(CEN_M.x,CEN_M.y,CEN_M.z+R+0.17),'磁感线：闭合 · 穿进必穿出',
      {color:FL_HEX,bold:true,size:11.5,align:'center'});
  }

  /* ── 电力线那一侧：球内 +Q，6 根径向线全部向外 ── */
  if(state.show.sphE) sphereShell(CEN_E,R,'#D04A3A');
  if(state.show.linesE){
    for(let i=0;i<ELE_N;i++){
      const pts=eleLine(CEN_E,ELE_DIRS[i]);
      curve(pts,{color:hexA(Q_HEX,.88),w:1.9,arrowEnd:true});
      crossPts(pts,CEN_E,R).forEach(cp=>{
        screenDot(cp.p,3.4,cp.goingOut?OUT_HEX:IN_HEX,.95,ZL);
      });
    }
    marker(CEN_E,{color:Q_HEX,r:6,ring:hexA(Q_HEX,.28)});
    text(CEN_E,'+Q',{color:Q_HEX,bold:true,size:13,dy:20,align:'center'});
    text(pt(CEN_E.x,CEN_E.y,CEN_E.z+R+0.17),'电力线：有头有尾（起于正电荷）',
      {color:Q_HEX,bold:true,size:11.5,align:'center'});
  }
  const st=crossStats(R);
  hintLine('磁感线 '+st.mIn+' 进 '+st.mOut+' 出 ⇒ 净 '+st.mNet+
           '　｜　电力线 '+st.eIn+' 进 '+st.eOut+' 出 ⇒ 净 '+st.eNet, C.ink);
}

/* ══════════════════════════ 画布插图（屏幕空间） ══════════════════════════ */
/* 画一支屏幕空间的水平箭头（从 xa 到 xb，y 处） */
function sArrow(xa,xb,y,col){
  ctx.save();
  ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=2.2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(xa,y); ctx.lineTo(xb,y); ctx.stroke();
  const s=Math.sign(xb-xa)||1;
  ctx.beginPath(); ctx.moveTo(xb,y);
  ctx.lineTo(xb-6*s,y-3.4); ctx.lineTo(xb-6*s,y+3.4); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* ① 双联对照：同向 ⇒ 相吸 / 反向 ⇒ 相斥（md 图 A 的左右对照；3D 场景里摆不下） */
function drawInsetAmpere(){
  if(!state.show.inset || W<560) return;
  const w=282, h=112, x0=14, y0=H-h-14;
  const cur=noCurrent()? -1 : (sameDir()?0:1);    /* 当前落在哪一联（−1 = 没有电流，都不高亮） */
  (()=>{
    crd(x0,y0,w,h);
    txt(x0+11,y0+15,'对照：只看两根导线的电流方向',{size:11,bold:true,color:'#1F3D4C'});
    [['同向 ⇒ 相吸',0],['反向 ⇒ 相斥',1]].forEach(([lab,rev],k)=>{
      const cx=x0+w*0.27+k*w*0.46, cy=y0+62;
      /* 两个截面圆：⊙ = 电流流出纸面，⊗ = 流入纸面 */
      [[-24,1],[24,rev?-1:1]].forEach(([dx,dir])=>{
        const px=cx+dx;
        ctx.save();
        ctx.beginPath(); ctx.arc(px,cy,11,0,7);
        ctx.fillStyle='#FFFFFF'; ctx.fill();
        ctx.strokeStyle=CUR_HEX; ctx.lineWidth=2; ctx.stroke();
        if(dir>0){ ctx.beginPath(); ctx.arc(px,cy,2.8,0,7); ctx.fillStyle=CUR_HEX; ctx.fill(); }
        else { ctx.beginPath();
          ctx.moveTo(px-5,cy-5); ctx.lineTo(px+5,cy+5);
          ctx.moveTo(px+5,cy-5); ctx.lineTo(px-5,cy+5);
          ctx.lineWidth=1.9; ctx.stroke(); }
        ctx.restore();
      });
      /* 力箭头：相吸 → 两箭头在中间对指；相斥 → 两箭头在外侧背指 */
      if(!rev){ sArrow(cx-12,cx-2,cy,F_HEX); sArrow(cx+12,cx+2,cy,F_HEX); }
      /* ⚠️ 相斥的两支箭头必须画在圆**外面**（cx∓37..cx∓49）：画在里面会被圆压住、看成一团 */
      else    { sArrow(cx-37,cx-49,cy,F_HEX); sArrow(cx+37,cx+49,cy,F_HEX); }
      txt(cx,y0+96,lab,{size:10.5,bold:k===cur,color:k===cur?F_HEX:'#8A9AA5',align:'center'});
    });
  })();
}
/* ③ cosθ 曲线 + Φ/Φmax 竖条（md：cosθ 曲线动点、90° 处虚线 + 仪表） */
function drawInsetCos(){
  if(!state.show.cos || W<620) return;
  const w=320, h=150, x0=14, y0=H-h-14;
  const th=state.th, c=Math.cos(th*D2R), fM=fluxM(state.B3,state.A3,th);
  (()=>{
    crd(x0,y0,w,h);
    txt(x0+11,y0+15,'Φ = B·A·cos θ',{size:11,bold:true,color:'#1F3D4C'});
    txt(x0+w-12,y0+15,(fM<0?'−':'')+Math.abs(fM).toFixed(3)+' mWb',
      {size:11.5,bold:true,color:PL_HEX,align:'right'});
    /* ── 绘图区 ── */
    const px=x0+38, py=y0+34, pw=180, ph=96;
    const X=t=>px+pw*t/180, Y=v=>py+ph*(1-v)/2;
    ctx.save();
    ctx.strokeStyle='#E7EEF3'; ctx.lineWidth=1;
    for(let k=0;k<=3;k++){ const gx=px+pw*k/3;
      ctx.beginPath(); ctx.moveTo(gx,py); ctx.lineTo(gx,py+ph); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(px,Y(0)); ctx.lineTo(px+pw,Y(0)); ctx.stroke();
    /* 90° 虚线 */
    ctx.setLineDash([4,3]); ctx.strokeStyle='#C9D6DD';
    ctx.beginPath(); ctx.moveTo(X(90),py); ctx.lineTo(X(90),py+ph); ctx.stroke();
    ctx.setLineDash([]);
    /* cos 曲线 */
    ctx.beginPath(); ctx.strokeStyle=LOOP_HEX; ctx.lineWidth=1.8;
    for(let i=0;i<=90;i++){ const t=180*i/90, yy=Y(Math.cos(t*D2R));
      if(i===0) ctx.moveTo(X(t),yy); else ctx.lineTo(X(t),yy); }
    ctx.stroke();
    /* 动点 */
    ctx.beginPath(); ctx.arc(X(th),Y(c),4.4,0,7); ctx.fillStyle=F_HEX; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.stroke();
    /* 刻度 */
    ctx.fillStyle='#8A9AA5'; ctx.font='9px '+RICHFONT; ctx.textAlign='center';
    ['0°','90°','180°'].forEach((s,i)=>ctx.fillText(s,px+pw*i/2,py+ph+12));
    ctx.textAlign='right';
    ctx.fillText('+1',px-4,py+7); ctx.fillText('0',px-4,Y(0)+3); ctx.fillText('−1',px-4,py+ph);
    ctx.restore();
    /* ── Φ/Φmax 竖条（中线 = 0，向上正、向下负） ── */
    const bx=x0+w-72, by0=y0+34, bh=96, bw=16;
    const zero=by0+bh/2, len=(bh/2-2)*Math.max(-1,Math.min(1,c));
    ctx.save();
    rrPath(bx,by0,bw,bh,7); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke();
    ctx.beginPath(); ctx.rect(bx+2, Math.min(zero,zero-len), bw-4, Math.abs(len));
    ctx.fillStyle=c>=0?OUT_HEX:IN_HEX; ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx,zero); ctx.lineTo(bx+bw,zero);
    ctx.strokeStyle='#8A9AA5'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.restore();
    txt(bx+bw+6,by0+8,'+1',{size:9,color:'#8A9AA5'});
    txt(bx+bw+6,zero+4,'0',{size:9,color:'#8A9AA5'});
    txt(bx+bw+6,by0+bh-2,'−1',{size:9,color:'#8A9AA5'});
  })();
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[] */
  if(state.mode==='ampere') drawAmpereScene();
  if(state.mode==='field')  drawFieldScene();
  if(state.mode==='flux')   drawFluxScene();
  if(state.mode==='closed') drawClosedScene();
  drawAxes(EXT41);
}

/* ══════════════ 信息卡内容 ══════════════ */
function currentCard(){
  if(state.mode==='ampere'){
    const B=bLine(state.I1,state.d), FL=fPerLen(state.I1,state.I2,state.d);
    const F=FL*state.La;
    const sg1=curSgn(state.I1), sg2=curSgn(state.I2);
    const np=noCurrent();
    return ['安培力 · 两根平行导线',[
      ['导线 1 的电流 I₁', state.I1.toFixed(1)+' A（'+(sg1>0?'沿 +z ↑':'沿 −z ↓')+'）'],
      ['导线 2 的电流 I₂', state.I2.toFixed(1)+' A（'+(sg2>0?'沿 +z ↑':'沿 −z ↓')+'）'],
      ['导线间距 d', state.d.toFixed(3)+' m'],
      ['受力的那一段长度 L', state.La.toFixed(2)+' m'],
      ['§ 导线 1 在导线 2 处产生的场'],
      ['　B₁₂ = µ₀|I₁|/(2πd)', fmtSmart(B*1e6,'µT')],
      ['§ 安培力'],
      ['　F/L = µ₀|I₁I₂|/(2πd)', fmtSmart(FL*1e6,'µN/m')],
      ['　F = (F/L)·L', fmtSmart(F*1e6,'µN')],
      ['§ 方向'],
      ['　两电流', np?'有一根为 0 ⇒ 无作用力'
                     :(sameDir()?'同号（同向）⇒ 相吸':'异号（反向）⇒ 相斥'),
       np?'#5F7482':(sameDir()?'#0E6E4A':'#A8442F')],
    ],244];
  }
  if(state.mode==='field'){
    const B=bLine(state.If,state.rp);
    return ['磁感应强度 · 长直导线',[
      ['导线电流 I', state.If.toFixed(1)+' A'],
      ['探针到导线的距离 r', state.rp.toFixed(3)+' m'],
      ['§ 该点的磁感应强度'],
      ['　B = µ₀I/(2πr)', fmtSmart(B*1e6,'µT')],
      ['　方向', '沿圆周切向 φ̂'],
      ['§ 同一根导线，不同距离'],
      ['　r = 0.100 m', fmtSmart(bLine(state.If,0.100)*1e6,'µT')],
      ['　r = 0.160 m', fmtSmart(bLine(state.If,0.160)*1e6,'µT')],
      ['　r = 0.250 m', fmtSmart(bLine(state.If,0.250)*1e6,'µT')],
      ['§ 定义（回勾 ①）'],
      ['　B ≡ F_max/(I·dl)', '与 I、dl 无关'],
    ],244];
  }
  if(state.mode==='flux'){
    const n=piercingXs(state.th,state.A3).length;
    const c=Math.cos(state.th*D2R);
    const f=fluxM(state.B3,state.A3,state.th);
    return ['磁通量 · 穿过一个面',[
      ['均匀场 B', state.B3.toFixed(0)+' mT（沿 +z）'],
      ['面面积 A', state.A3.toFixed(2)+' dm²'],
      ['面法线与 B 的夹角 θ', state.th.toFixed(0)+'°'],
      ['§ 磁通量'],
      ['　Φ_max = B·A（θ=0）', fluxM(state.B3,state.A3,0).toFixed(3)+' mWb'],
      ['　cos θ', (c<0?'−':'')+Math.abs(c).toFixed(3)],
      ['　Φ = B·A·cos θ', (f<0?'−':'')+Math.abs(f).toFixed(3)+' mWb'],
      ['§ 数线根数（一行共 13 根）'],
      ['　穿过面的根数', n+' 根'],
      ['　净根数（出正入负）', (n===0?0:(c>=0?n:-n))+' 根'],
      ['§ 判读'],
      ['　面与 B 的关系', n===0?'平行 ⇒ 一根不穿':(c>0?'斜穿（正向）':'斜穿（反向）')],
    ],263];
  }
  const st=crossStats(state.R4);
  return ['闭合面的磁通量',[
    ['闭合面半径 R', state.R4.toFixed(3)+' m'],
    ['§ 磁感线那侧（球内：小电流环）'],
    ['　穿出根数', String(st.mOut)],
    ['　穿入根数', String(st.mIn)],
    ['　净根数', String(st.mNet)],
    ['　∮@{B}·dS', '0 Wb', '#0E6E4A'],
    ['§ 电力线那侧（球内：+Q）'],
    ['　穿出根数', String(st.eOut)],
    ['　穿入根数', String(st.eIn)],
    ['　净根数', String(st.eNet)],
    ['　∮@{D}·dS = Q内', '+2.00 nC', '#A8442F'],
    ['§ 结论'],
    ['　磁场的高斯定理', '∮@{B}·dS ≡ 0', '#0E6E4A'],
  ],282];
}
function drawOverlays(){
  const c=currentCard(); infoCard(c[0],c[1],c[2]);
  if(state.mode==='ampere') drawInsetAmpere();
  if(state.mode==='flux')   drawInsetCos();
}

/* ══════════════════════════ 面板底部的实时结论条 ══════════════════════════ */
function subNote(){
  if(state.mode==='ampere')
    return '<b>力不是导线拉导线</b>：导线 1 先在自己周围产生 @{B}₁，'+
      '处在场里的导线 2 再受力 @{F} = @{I}₂d@{l}₂ × @{B}₁。<br>'+
      '画面上半径正好等于间距的那一圈圆<b>恰好穿过导线 2</b>，那里的 @{B}₁₂ 就沿圆的切向。'+
      '点「反向（+10 / −10）」看两支力箭头当场掉头（大小一点不变）。';
  if(state.mode==='field')
    return '<b>@{B} 的方向沿圆周切向</b>（右手螺旋：拇指顺电流，四指绕向即 @{B} 的绕向），'+
      '<b>大小 1/r 衰减</b> —— 箭头近长远短。<br>'+
      'P 点的测试电流元与导线<b>同向</b>，受力指向导线：这就是 ① 里"同向相吸"的微观解释。';
  if(state.mode==='flux')
    return '<b>磁通量就是数穿过的磁感线根数</b>，斜了要打 cos θ 的折：'+
      'θ=0° 全穿、60° 只剩一半、90° <b>一根都不穿</b>。<br>'+
      '★ 但 θ=90° 时 <b>@{B} 一根箭头都没少</b> —— 变的是"面与场的夹角"，不是场本身。';
  return '<b>磁感线闭合、无头无尾</b>：穿进闭合面的必然再穿出来 ⇒ <b>∮@{B}·dS ≡ 0</b>，'+
    '与面的大小、形状、位置都无关。<br>'+
    '电力线有头有尾：包住 +Q 就有净穿出 ⇒ <b>∮@{D}·dS = Q内</b>（第 2 章锚点）。'+
    '<b>为什么磁感线必须闭合？</b>因为至今没找到磁单极子 —— 见第 3 张讲解卡。';
}

/* ══════════════════════════ 右侧面板 ══════════════════════════ */
const panel=document.getElementById('panel');
function h(html){const d=document.createElement('div');d.innerHTML=html;return d;}
let _toastTimer=0;
function toastMsg(msg){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function kchip(k,v,cls){return '<span class="coord-chip '+(cls||'')+'">'+richHTML(k)+'<b>'+richHTML(v)+'</b></span>';}
function chipRow(parent,items,isOn,onPick){
  const box=h('<div class="sub-chips"></div>').firstChild;
  items.forEach(it=>{
    const lab=richHTML(String(it.t??it.sub??it.label??''));
    const b=h('<button class="chip '+(it.col||'')+(isOn(it.k)?' on':'')+'" data-k="'+it.k+'">'+lab+'</button>').firstChild;
    b.onclick=()=>onPick(it.k);
    box.appendChild(b);
  });
  parent.appendChild(box);
  return box;
}
const SHOW_ITEMS={
  ampere:[{k:'wire',t:'两根导线与电流'},{k:'bcir',t:'导线 1 的磁场圆'},{k:'force',t:'@{B}₁₂ 与安培力'},
          {k:'inset',t:'同向 / 反向对照插图'},{k:'box',t:'坐标轴'}],
  field: [{k:'wire',t:'长直导线与电流'},{k:'bvec',t:'各处的 @{B}（quiver）'},
          {k:'probe',t:'P 点的 @{B} / 电流元 / 力'},{k:'box',t:'坐标轴'}],
  flux:  [{k:'fline',t:'均匀磁场的场线'},{k:'plate',t:'穿过的面与法线'},
          {k:'count',t:'穿线根数标注'},{k:'cos',t:'cos θ 曲线与 Φ 仪表'},{k:'box',t:'坐标轴'}],
  closed:[{k:'sphM',t:'磁感线那侧的闭合面'},{k:'linesM',t:'磁感线（闭合）'},
          {k:'sphE',t:'电力线那侧的闭合面'},{k:'linesE',t:'电力线（有头有尾）'},{k:'box',t:'坐标轴'}],
};
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    /* ⚠️ 必须用 d.set() 的**返回值**（生效值）来格式化与回写滑块（防"显示≠真实状态"） */
    const eff=d.set(parseFloat(inp.value));
    const v=(eff==null||!isFinite(eff))?parseFloat(inp.value):eff;
    if(String(inp.value)!==String(v)) inp.value=String(v);
    document.getElementById('v_'+d.k).textContent=d.fmt(v);
    needsRender=true; updateReadout(); updateModeTag();
    if(d.after) d.after();
  };
  sec.appendChild(r);
}
function btnRow(sec,specs){
  const bx=h('<div class="sub-chips"></div>').firstChild;
  specs.forEach(s=>{ const b=h('<button class="chip '+(s.col||'')+(s.on?' on':'')+'">'+richHTML(s.t)+'</button>').firstChild;
    b.onclick=s.act; bx.appendChild(b); });
  sec.appendChild(bx);
}
function renderSubSec(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="sec-title">显示</div>'));
  chipRow(sec,SHOW_ITEMS[state.mode],k=>state.show[k],k=>{
    const next=!state.show[k];
    /* ⚠️ 不许把层全关掉：全关 ⇒ 只剩坐标轴/空画布 */
    const othersOn=SHOW_ITEMS[state.mode].some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
/* 电流读数：负号用全角 − 与卡片一致。
   ⚠️ 不要再往后加 ↑/↓ —— 值单元格只放得下 ~7 个字，"−10.0 A ↓" 会折行（实测）。
      方向交给：画布导线顶部标签、信息卡"沿 ±z"、数据条"同号/异号"、以及力箭头本身。 */
const fmtI=v=>(v<0?'−':'')+Math.abs(v).toFixed(1)+' A';
/* ⚠️ 这里的格式必须与 mkRange 建滑块时的 fmt **完全一致**（syncSliders 会反复调用）。 */
const SLIDER_FMT={
  I1:fmtI, I2:fmtI,
  d:v=>v.toFixed(3)+' m',  La:v=>v.toFixed(2)+' m',
  If:v=>v.toFixed(1)+' A', rp:v=>v.toFixed(3)+' m',
  th:v=>v.toFixed(0)+'°',  B3:v=>v.toFixed(0)+' mT', A3:v=>v.toFixed(2)+' dm²',
  R4:v=>v.toFixed(3)+' m',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('I1',state.I1); set('I2',state.I2); set('d',state.d); set('La',state.La);
  set('If',state.If); set('rp',state.rp);
  set('th',state.th); set('B3',state.B3); set('A3',state.A3);
  set('R4',state.R4);
}
function renderSliders(sec){
  sec.innerHTML='';
  if(state.mode==='ampere'){
    sec.appendChild(h('<div class="slider-group-label">两根平行导线</div>'));
    mkRange(sec,{k:'I1',label:'导线 1 的电流 I₁',wide:true,min:I1_RANGE[0],max:I1_RANGE[1],step:0.5,
      get:()=>state.I1,set:v=>{state.I1=v;},fmt:fmtI});
    mkRange(sec,{k:'I2',label:'导线 2 的电流 I₂',wide:true,min:I2_RANGE[0],max:I2_RANGE[1],step:0.5,
      get:()=>state.I2,set:v=>{state.I2=v;},fmt:fmtI});
    mkRange(sec,{k:'d',label:'导线间距 d',wide:true,min:D_RANGE[0],max:D_RANGE[1],step:0.001,
      get:()=>state.d,set:v=>{state.d=v;},fmt:v=>v.toFixed(3)+' m'});
    mkRange(sec,{k:'La',label:'受力的那一段长度 L',wide:true,min:LA_RANGE[0],max:LA_RANGE[1],step:0.02,
      get:()=>state.La,set:v=>{state.La=v;},fmt:v=>v.toFixed(2)+' m'});
    btnRow(sec,[
      {t:'同向（+10 / +10）⇒ 相吸', col:'p',
        on:Math.abs(state.I1-10)<1e-9 && Math.abs(state.I2-10)<1e-9,
        act:()=>{ state.I1=10; state.I2=10; renderPanel(); updateAll(); }},
      {t:'反向（+10 / −10）⇒ 相斥', col:'p',
        on:Math.abs(state.I1-10)<1e-9 && Math.abs(state.I2+10)<1e-9,
        act:()=>{ state.I1=10; state.I2=-10; renderPanel(); updateAll(); }},
      {t:'翻转 I₂ 的符号', on:false,
        act:()=>{ state.I2=-state.I2; renderPanel(); updateAll(); }},
      {t:'回到默认', on:Math.abs(state.I1-10)<1e-9&&Math.abs(state.I2-10)<1e-9&&Math.abs(state.d-0.05)<1e-9,
        act:()=>{ Object.assign(state,PRESET.ampere); renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '⭐ <b>把 I₂ 的滑块拖过 0</b>：电流方向当场翻成 ↓，两支橙色力箭头会从"互指"翻成"背指" —— '+
      '<b>同号 ⇒ 相吸，异号 ⇒ 相斥</b>，这就是安培力最反直觉的一点。<br>'+
      '力箭头长度<b>线性</b>对应 F，太长/太短都截在上下限内（只为看得见，读数看卡片）。<br>'+
      '💡 把 <b>d 拖小</b>：B₁₂ 与 F 同时变大（都按 1/d）；把 <b>I₂ 拖近 0</b>：F 变小但 B₁₂ 不变 —— '+
      '<b>B₁₂ 只由导线 1 决定</b>，这正是"场"与"力"必须分开讲的理由。')+'</div>'));
  } else if(state.mode==='field'){
    sec.appendChild(h('<div class="slider-group-label">同一根长直导线</div>'));
    mkRange(sec,{k:'If',label:'导线电流 I',wide:true,min:I_RANGE[0],max:I_RANGE[1],step:0.5,
      get:()=>state.If,set:v=>{state.If=v;},fmt:v=>v.toFixed(1)+' A'});
    mkRange(sec,{k:'rp',label:'探针 P 到导线的距离 r',wide:true,min:RP_RANGE[0],max:RP_RANGE[1],step:0.005,
      get:()=>state.rp,set:v=>{state.rp=v;},fmt:v=>v.toFixed(3)+' m'});
    btnRow(sec,[
      {t:'r = 0.100 m（内圈）', on:Math.abs(state.rp-0.100)<1e-6,
        act:()=>{ state.rp=0.100; renderPanel(); updateAll(); }},
      {t:'r = 0.160 m（中圈）', on:Math.abs(state.rp-0.160)<1e-6,
        act:()=>{ state.rp=0.160; renderPanel(); updateAll(); }},
      {t:'r = 0.250 m（外圈）', on:Math.abs(state.rp-0.250)<1e-6,
        act:()=>{ state.rp=0.250; renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '方格上的 B 箭头<b>近长远短</b>，而且一圈圈转起来 —— 这两件事合起来才是「长直导线的场」。<br>'+
      '💡 P 点的三支箭头凑成一次叉乘：<b>d@{l}₂（红，沿 +z）</b>、<b>@{B}（蓝，沿切向）</b>、'+
      '<b>@{F}（橙，指向导线）</b> —— @{F} = @{I}₂d@{l}₂ × @{B} 的现场。')+'</div>'));
  } else if(state.mode==='flux'){
    sec.appendChild(h('<div class="slider-group-label">面与场</div>'));
    mkRange(sec,{k:'th',label:'法线与 B 的夹角 θ',wide:true,min:TH_RANGE[0],max:TH_RANGE[1],step:1,
      get:()=>state.th,set:v=>{state.th=v;},fmt:v=>v.toFixed(0)+'°'});
    mkRange(sec,{k:'B3',label:'均匀场 B',wide:true,min:B3_RANGE[0],max:B3_RANGE[1],step:1,
      get:()=>state.B3,set:v=>{state.B3=v;},fmt:v=>v.toFixed(0)+' mT'});
    mkRange(sec,{k:'A3',label:'面面积 A',wide:true,min:A3_RANGE[0],max:A3_RANGE[1],step:0.05,
      get:()=>state.A3,set:v=>{state.A3=v;},fmt:v=>v.toFixed(2)+' dm²'});
    btnRow(sec,[
      {t:'θ=0°（全穿）', on:state.th===0, act:()=>{ state.th=0; renderPanel(); updateAll(); }},
      {t:'θ=60°', on:state.th===60, act:()=>{ state.th=60; renderPanel(); updateAll(); }},
      {t:'θ=90°（一根不穿）', col:'o', on:state.th===90, act:()=>{ state.th=90; renderPanel(); updateAll(); }},
      {t:'θ=120°（负通量）', on:state.th===120, act:()=>{ state.th=120; renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '★ 初始故意停在 <b>120°</b>：先看到 <b>Φ &lt; 0</b> 并解释它，再拖回 0° / 90°。<br>'+
      '💡 根数是<b>离散示意</b>（一行 13 根、间距固定），Φ = BA cos θ 是连续精确值；'+
      '线够密时两者才一致 —— 这正是"取极限"的思想。')+'</div>'));
  } else {
    sec.appendChild(h('<div class="slider-group-label">两个闭合面共用同一个半径</div>'));
    mkRange(sec,{k:'R4',label:'闭合面半径 R',wide:true,min:R4_RANGE[0],max:R4_RANGE[1],step:0.005,
      get:()=>state.R4,set:v=>{state.R4=v;},fmt:v=>v.toFixed(3)+' m'});
    btnRow(sec,[
      {t:'缩到最小', on:Math.abs(state.R4-R4_RANGE[0])<1e-6,
        act:()=>{ state.R4=R4_RANGE[0]; renderPanel(); updateAll(); }},
      {t:'放到最大', on:Math.abs(state.R4-R4_RANGE[1])<1e-6,
        act:()=>{ state.R4=R4_RANGE[1]; renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '★ 把 R 从最小拖到最大：<b>穿入根数、穿出根数一个都不变</b> —— '+
      '∮@{B}·dS = 0 与面的大小、形状、位置都无关。<br>'+
      '绿点 = 穿出，玫红点 = 穿入：磁感线上<b>两种点成对出现</b>，电力线上只有绿点。')+'</div>'));
  }
  sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
    '拖动画布旋转视角、滚轮缩放；右键（或 Ctrl+拖）平移。<br>'+
    '💡 画面上的读数全部按<b>真实物理量</b>算，箭头长度只为看得见（必要时截在上下限内）。')+'</div>'));
}
