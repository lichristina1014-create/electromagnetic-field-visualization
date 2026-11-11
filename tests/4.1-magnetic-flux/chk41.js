/* ============================================================================
   4.1 磁感应强度与磁通量 —— 页面内自检（CDP 里跑）
   用法：
     node ~/.workbuddy/skills/headless-cdp-test/scripts/cdpeval.js \
          "file://…/4.1-magnetic-flux.htm" tests/4.1-magnetic-flux/chk41.js \
          "typeof state!=='undefined'"
   约定：每条断言输出 PASS|名|值 或 FAIL|名|值，末尾 DONE。
   ============================================================================ */
(async()=>{
  const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i==null?'':i));
  const near=(a,b,tol)=>Math.abs(a-b)<=tol;
  const go=k=>{const b=Array.from(document.getElementById('modeTabs').children).find(x=>x.dataset.k===k);
    if(!b) throw new Error('找不到页签 '+k); b.click(); draw(); };

  /* ────────── 0. 结构与导航 ────────── */
  T('页签 4 个', document.querySelectorAll('#modeTabs > *').length===4);
  T('nav 19 项', document.querySelectorAll('#nav .nav-item').length===19,
    document.querySelectorAll('#nav .nav-item').length);
  T('本页 active 唯一', document.querySelectorAll('#nav .nav-item.active').length===1);
  const act=document.querySelector('#nav .nav-item.active');
  T('本页 active 就是 4.1', act && act.textContent.indexOf('4.1')>=0, act&&act.textContent.trim());
  T('唯本页无 href', document.querySelectorAll('#nav .nav-item:not(.soon):not([href])').length===1);
  T('SHOW_ITEMS 的键都在 state.show 里',
    Object.keys(SHOW_ITEMS).every(m=>SHOW_ITEMS[m].every(it=>it.k in state.show)),
    Object.keys(SHOW_ITEMS).map(m=>SHOW_ITEMS[m].length).join('/'));

  /* ────────── 1. ① 安培力的定量链 ────────── */
  const MU0v=4*Math.PI*1e-7;
  T('B(r)=µ₀I/2πr @I=10,r=0.1', near(bLine(10,0.1), MU0v*10/(2*Math.PI*0.1), 1e-15),
    bLine(10,0.1).toExponential(4));
  T('F/L=µ₀I₁I₂/2πd @10,10,0.05', near(fPerLen(10,10,0.05), 2e-7*100/0.05, 1e-15),
    fPerLen(10,10,0.05).toExponential(4));
  T('F=(F/L)·L 线性', near(fTotal(10,10,0.05,0.6), fPerLen(10,10,0.05)*0.6, 1e-18));
  T('F/L 按 1/d 缩放', near(fPerLen(10,10,0.1), fPerLen(10,10,0.05)/2, 1e-15));

  /* ★ 叉乘的**符号**（这才是"同向相吸"的证明，不是背结论）：
     导线1 在导线2 处的 @{B}₁₂ = φ̂(φ=π) = −ŷ；F ∝ ẑ × @{B}₁₂ 应指向 +x（即指向导线1）。 */
  const zH=pt(0,0,1), B12=phiHat(Math.PI);
  T('@{B}₁₂ 沿 −ŷ', near(B12.x,0,1e-12)&&near(B12.y,-1,1e-12), JSON.stringify(B12));
  const Fdir=vcross(zH,B12);
  T('F = ẑ×@{B}₁₂ 指向 +x ⇒ 相吸', Fdir.x>0.99, JSON.stringify(Fdir));
  const Fdir2=vcross(vmul(zH,-1),B12);
  T('翻转 @{I}₂ ⇒ F 反向 ⇒ 相斥', Fdir2.x<-0.99, JSON.stringify(Fdir2));

  /* ★★ 带符号电流（2026-11-12 用户要求"电流都是正的看不出吸/斥"）：
     方向必须由**电流的符号**决定，学生一把滑块拖过零点就该看到力箭头翻向。 */
  T('电流量程允许取负', I1_RANGE[0]<0 && I2_RANGE[0]<0, I1_RANGE[0]+'…'+I1_RANGE[1]);
  T('已废弃 rev 布尔量（方向改由电流符号决定）', !('rev' in state));
  const keepI={I1:state.I1, I2:state.I2};
  const setI=(a,b)=>{ state.I1=a; state.I2=b; };
  setI(10,10);
  T('同号（+10/+10）⇒ 相吸 forceSign=+1', sameDir() && forceSign()===1, forceSign());
  setI(10,-10);
  T('异号（+10/−10）⇒ 相斥 forceSign=−1', !sameDir() && forceSign()===-1, forceSign());
  setI(-10,-10);
  T('都取负号仍是同向 ⇒ 相吸', sameDir() && forceSign()===1);
  setI(-10,10);
  T('I₁<0、I₂>0 仍是异号 ⇒ 相斥', !sameDir() && forceSign()===-1);
  setI(10,0);
  T('I₂=0 ⇒ 无作用力（forceSign=0 且 F/L=0）',
    forceSign()===0 && fPerLen(10,0,0.05)===0, forceSign()+' / '+fPerLen(10,0,0.05));
  setI(0,10);
  T('I₁=0 ⇒ 无作用力（没有 @{B} 就没有力）', forceSign()===0 && !(Math.abs(state.I1)>1e-9));
  /* 电流反向 ⇒ 右手螺旋反过来 ⇒ @{B}₁₂ 翻成 +ŷ（画面上 arrow 用的是 −curSgn(I₁)·lb） */
  setI(-10,10);
  const bDir=vmul(pt(0,-1,0), curSgn(state.I1));
  T('I₁ 反向 ⇒ @{B}₁₂ 翻成 +ŷ', bDir.y>0.99, JSON.stringify(bDir));
  state.I1=keepI.I1; state.I2=keepI.I2;

  /* 面板上一键切换：点「反向（+10 / −10）⇒ 相斥」应真的把 I₂ 变负并能画出来 */
  go('ampere');
  const bRev=Array.from(document.querySelectorAll('#sliderSec button.chip'))
    .find(b=>/反向（\+10/.test(b.textContent||''));
  T('面板存在「反向」一键切换', !!bRev);
  if(bRev){
    bRev.click();
    T('点「反向」⇒ I₂ = −10 且 相斥', near(state.I2,-10,1e-9) && forceSign()===-1, state.I2+' / '+forceSign());
    draw();
    const nRev=prims.length;
    const bSame=Array.from(document.querySelectorAll('#sliderSec button.chip'))
      .find(b=>/同向（\+10/.test(b.textContent||''));
    if(bSame){ bSame.click(); draw(); }
    T('两种情形都能画出图元（非空转）', nRev>0, '反向 '+nRev+' 个 / 同向 '+prims.length+' 个');
  }

  /* ★ 屏幕空间复核：力的箭头必须**真的**互指 / 背指（光把符号算对不算数）
     ⚠️ 投影方向反直觉：**世界 +x 在屏幕上朝左**（camU.x<0）⇒ 导线 1（+x 侧）出现在**左边**，
        导线 2（−x 侧）在右边。所以"相吸"时导线 2 那支箭头的屏幕 dx 是**负**的。
        第一版按直觉写成 >0，两条全红 —— 是断言错、不是画面错。 */
  const sW=sepW(state.d), X1=sW/2, X2=-sW/2;
  const arrowDx=(i1,i2)=>{
    state.I1=i1; state.I2=i2;
    const lf=Math.min(fArrowLen(fTotal(i1,i2,state.d,state.La)), sW*0.42), fd=forceSign();
    return {
      w2: pr(pt(X2+fd*lf,0,-0.12)).x - pr(pt(X2,0,-0.12)).x,
      w1: pr(pt(X1-fd*lf,0,-0.12)).x - pr(pt(X1,0,-0.12)).x,
    };
  };
  const Aa=arrowDx(10,10), Bb=arrowDx(10,-10);
  T('（同向）屏幕上两支力箭头互指：尖端相向', Aa.w2<0 && Aa.w1>0,
    'd2='+Aa.w2.toFixed(1)+'px / d1='+Aa.w1.toFixed(1)+'px');
  T('（反向）屏幕上两支力箭头背指：尖端朝外', Bb.w2>0 && Bb.w1<0,
    'd2='+Bb.w2.toFixed(1)+'px / d1='+Bb.w1.toFixed(1)+'px');
  state.I1=10; state.I2=10;

  /* ────────── 2. ② 探针 P 的三矢关系 ────────── */
  /* ⚠️ 探针抬到了 z=PROBE_Z（为了让它不躺在 y 轴上），所以"指向导线"要用**柱坐标**
     的径向 ρ̂ = (0,1,0)，不能拿球坐标的 r̂ 去判 —— 后者带 z 分量，会把 −ρ̂ 判成 −0.496。
     这一条曾经把正确的画面判成 FAIL，记在这里。 */
  const rp=state.rp, P3=pt(0,rp*R_M2W,PROBE_Z);
  const rhoHat=pt(0,1,0), Bhat=phiHat(Math.PI/2);
  T('探针抬到 z=PROBE_Z', near(P3.z,PROBE_Z,1e-12)&&PROBE_Z>0.3, P3.z);
  T('@{B} ⟂ ρ̂', near(vdot(Bhat,rhoHat),0,1e-12), vdot(Bhat,rhoHat).toExponential(2));
  T('@{B} ⟂ ẑ', near(vdot(Bhat,zH),0,1e-12), vdot(Bhat,zH).toExponential(2));
  T('@{B} 沿 −x̂（切向）', near(Bhat.x,-1,1e-12)&&near(Bhat.y,0,1e-12));
  const Fhat=vcross(zH,Bhat);
  T('@{F} = ẑ×@{B} 指向导线（−ρ̂）', vdot(Fhat,rhoHat)<-0.99, vdot(Fhat,rhoHat).toFixed(6));
  T('@{F} ⟂ d@{l}₂', near(vdot(Fhat,zH),0,1e-12));
  T('1/r：r 翻倍 B 减半', near(bLine(10,0.2), bLine(10,0.1)/2, 1e-15));
  T('quiver 箭头长度随 ρ 单调递减', bLen(0.3)>bLen(0.6)&&bLen(0.6)>bLen(0.8),
    bLen(0.3).toFixed(3)+'/'+bLen(0.6).toFixed(3)+'/'+bLen(0.8).toFixed(3));

  /* ────────── 3. ③ 磁通量的三条恒等式 ────────── */
  T('Φ(40mT,1.2dm²,0°)=0.48 mWb', near(fluxM(40,1.2,0), 0.48, 1e-12), fluxM(40,1.2,0).toFixed(6));
  T('Φ(60°)=Φ(0°)·0.5', near(fluxM(40,1.2,60), 0.24, 1e-12), fluxM(40,1.2,60).toFixed(6));
  T('Φ(90°)=0', near(fluxM(40,1.2,90), 0, 1e-15));
  T('Φ(120°)<0 且 |Φ|=Φ(60°)', fluxM(40,1.2,120)<0 && near(Math.abs(fluxM(40,1.2,120)),0.24,1e-12));
  T('Φ(180°)=−Φ(0°)', near(fluxM(40,1.2,180), -0.48, 1e-12));
  T('Φ ∝ A（面积翻倍 Φ 翻倍）', near(fluxM(40,2.4,0), 2*fluxM(40,1.2,0), 1e-12));
  T('Φ ∝ B（场翻倍 Φ 翻倍）', near(fluxM(80,1.2,0), 2*fluxM(40,1.2,0), 1e-12));
  /* 数根数：θ=0°/60°/90° 的整定值（照 md 的 5/3/0） */
  T('θ=0° 穿过 5 根', piercingXs(0,1.2).length===5, piercingXs(0,1.2).length);
  T('θ=60° 穿过 3 根', piercingXs(60,1.2).length===3, piercingXs(60,1.2).length);
  T('θ=90° 一根不穿', piercingXs(90,1.2).length===0, piercingXs(90,1.2).length);
  T('θ=120° 仍 3 根（方向反了）', piercingXs(120,1.2).length===3, piercingXs(120,1.2).length);
  T('面积变大 ⇒ 根数不减少（A:0.5→2.0）',
    piercingXs(0,2.0).length>piercingXs(0,0.5).length,
    piercingXs(0,0.5).length+'→'+piercingXs(0,2.0).length);
  /* 面法线 */
  const nn=plateBasis(37).n;
  T('法线是单位矢量', near(vlen(nn),1,1e-12), vlen(nn).toFixed(9));
  T('n·ẑ = cosθ', near(vdot(nn,pt(0,0,1)), Math.cos(37*Math.PI/180), 1e-12),
    vdot(nn,pt(0,0,1)).toFixed(6));
  /* ★ 连续性：根数的符号必须与 Φ 的符号一致（出正入负的记账口径统一） */
  let signOK=true, sgnTxt=[];
  [10,60,90,120,170].forEach(th=>{
    const n=piercingXs(th,1.2).length, f=fluxM(40,1.2,th);
    const nSign = n===0?0:(Math.cos(th*Math.PI/180)>=0?1:-1);
    /* ⚠️ 90° 处 cos 是 6e-17 而不是精确 0 ⇒ 必须给容差，否则断言会假失败 */
    const fSign = Math.abs(f)<1e-12?0:(f>0?1:-1);
    if(nSign!==fSign){ signOK=false; sgnTxt.push(th+'°:n='+nSign+',Φ='+fSign); }
  });
  T('根数符号 ≡ Φ 符号（记账口径统一）', signOK, sgnTxt.join(';')||'5 个角度一致');

  /* ────────── 4. ④ 闭合面：两个半径都不改变根数 ────────── */
  [R4_RANGE[0], 0.21, 0.28, R4_RANGE[1]].forEach(Rv=>{
    const s=crossStats(Rv);
    T('R='+Rv.toFixed(2)+' 磁感线 4 进 4 出', s.mIn===4&&s.mOut===4, s.mIn+'/'+s.mOut);
    T('R='+Rv.toFixed(2)+' 电力线 6 出 0 进', s.eOut===6&&s.eIn===0, s.eOut+'/'+s.eIn);
    T('R='+Rv.toFixed(2)+' 净通量 0 与 6', s.mNet===0&&s.eNet===6, s.mNet+'/'+s.eNet);
  });
  /* 偶极子场线本身：必过两极（r→0）且最远到 DIP_L */
  const dl0=dipolePts(45,DIP_L);
  const rmax=Math.max.apply(null,dl0.map(q=>vlen(q)));
  T('偶极子场线最远 = DIP_L', near(rmax,DIP_L,0.01), rmax.toFixed(4));
  T('偶极子场线两端都收在极点上', vlen(dl0[0])<DIP_TRIM*1.6 && vlen(dl0[dl0.length-1])<DIP_TRIM*1.6,
    vlen(dl0[0]).toFixed(4));

  /* ────────── 5. 逐页签渲染 + 幂等 + 零泄漏 ────────── */
  const SKIP={SCRIPT:1,STYLE:1,HEAD:1,TITLE:1,NOSCRIPT:1,TEMPLATE:1,META:1,LINK:1,HTML:1};
  /* ⚠️ 扫查清单必须包含 .module-title（#moduleSub 就是它里面的小字）——
       2.4 曾经因为漏了它就"自检全绿、用户一眼看见字面 @{E}"（skill gotcha #54）。 */
  const CONT=['.frm','.ex-body','.ex-note','.card-body','#legend','.coord-strip','.cv-mode-tag',
              '.module-title','.sec-title','.slider-row','.readout-toggle','.sub-chips','.card-tab'];
  const leaks=[];
  const scan=(tag)=>{
    CONT.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{
      if(SKIP[el.tagName]) return;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0') return;
      const s=el.innerText||'';
      if(s.indexOf('@{')>=0) leaks.push(tag+'|'+sel+'|'+s.slice(0,28).replace(/\n/g,' '));
      else if(/(^|[^A-Za-z])undefined([^A-Za-z]|$)/.test(s)) leaks.push('UNDEF '+tag+'|'+sel);
    }));
  };
  let contScanned=0;
  CONT.forEach(sel=>{ contScanned+=document.querySelectorAll(sel).length; });
  scan('初始');
  /* 幂等：buildScene 连跑两次，图元数必须一模一样（漏 prims=[] 就会翻倍） */
  const p1=(buildScene(),prims.length), p2=(buildScene(),prims.length);
  T('buildScene 幂等（图元数不增长）', p1===p2 && p1>0, p1+'→'+p2);

  const per={};
  ['ampere','field','flux','closed'].forEach(k=>{
    go(k);
    per[k]=prims.length;
    T(k+' 有图元', prims.length>0, prims.length);
    T(k+' 数据条非空', document.getElementById('coordStrip').children.length>0,
      document.getElementById('coordStrip').children.length);
    T(k+' 信息卡标题不是 undefined', (document.getElementById('coordStrip').innerText||'').indexOf('undefined')<0);
    scan(k);
    /* 每个页签都把 3 张讲解卡点一遍 */
    document.querySelectorAll('#panel .card-tab').forEach(b=>{
      b.click(); scan(k+'-card');
      T(k+' 卡 '+b.textContent.slice(0,6)+' 正文非空',
        (document.querySelector('.card-body .ex-body')||{innerText:''}).innerText.length>40);
    });
    /* 显示层逐个开关一遍（含"最后一层不许关"的守卫生效）
       ⚠️ chip 的 onclick 只 renderPanel（置 needsRender），**不会**同步重画 ⇒
          读 prims 之前必须手动 draw()，否则读到的还是上一个页签的旧图元数。 */
    document.querySelectorAll('#subSec .chip').forEach(c=>{
      c.click(); draw(); scan(k+'-chip');
      T(k+' chip['+c.textContent.slice(0,4)+'] 关掉后仍有图元', prims.length>0, prims.length);
      c.click(); draw(); scan(k+'-chip2');
    });
  });
  T('四个页签图元数各不相同（确是真渲染）', new Set(Object.values(per)).size>=3, JSON.stringify(per));
  T('DOM 扫查真的扫到了容器（非空转）', contScanned>20, '容器数 '+contScanned);
  T('全流程零 @{ 泄漏 / 零 undefined', leaks.length===0, leaks.slice(0,3).join(' ; ')||'0 处');

  /* ────────── 6. 屏幕空间：提示行别压到右上信息卡 ────────── */
  go('flux');
  setupCamera();
  const pad=16, cardX=CARD_X();
  const hintW=(()=>{ const lo=richLayout(ctx,parseRich('Φ = B·A·cos θ ＝ 数穿过面的磁感线根数'),11.5,false); return lo.w; })();
  T('提示行不与信息卡重叠', pad+hintW < cardX-6, Math.round(pad+hintW)+' < '+Math.round(cardX));
  const mtag=document.getElementById('modeTag');
  T('提示行 y=72 在 modeTag 之下', mtag.getBoundingClientRect().height+12 < 72,
    mtag.getBoundingClientRect().height+'px');
  /* 各页签的相机都要就位（camScale>0 且 CX2/CY 有限） */
  ['ampere','field','flux','closed'].forEach(k=>{
    go(k);
    T(k+' 相机已就位', isFinite(CX2)&&isFinite(CY)&&camScale>0, Math.round(camScale));
  });

  /* ────────── 7. 复位视角 ────────── */
  go('closed');
  cam.az=0.1; cam.el=1.2; cam.zoom=2.4;
  document.getElementById('btnViewReset').click();
  T('复位视角回到该页签的取景', near(cam.az,CAM41.closed.az,1e-9)&&near(cam.el,CAM41.closed.el,1e-9)&&near(cam.zoom,1,1e-9),
    cam.az.toFixed(2)+'/'+cam.el.toFixed(2)+'/'+cam.zoom.toFixed(2));

  return R.join('\n')+'\nDONE';
})();
