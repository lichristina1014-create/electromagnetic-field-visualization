/* ══════════════════════════════ 读数与判定 ══════════════════════════════ */
function probeInfo(){
  const E0=state.E0, r=state.rp, th=state.thp*D2R;
  const f=fieldE(r,th,E0);
  const mag=Math.hypot(f.Er,f.Eth);
  const onSurf = Math.abs(r-A_C)<1e-6;
  const zone = r<A_C-1e-6 ? 'in' : (onSurf ? 'surf' : 'out');
  const ang = mag>1e-9 ? Math.acos(Math.min(1,Math.abs(f.Er)/mag))*R2D : 0;
  return {E0,r,th,Er:f.Er,Eth:f.Eth,mag,V:volt(r,th,E0),zone,ang,
          ett: mag>1e-9 ? Math.abs(f.Eth)/mag : 0,
          sig: onSurf ? sigma(th,E0,null) : null};
}
function zoneWord(z){ return z==='in'?'导体内部':(z==='surf'?'导体表面':'导体外部'); }
const sgnTxt=(v,d)=>(v>0?'+':'')+v.toFixed(d);

/* ② 面板底部的实时结论条 */
function probeNote(){
  const p=probeInfo();
  const E0=state.E0;
  if(p.zone==='in')
    return '<b>P 在导体内部</b>：严格解给出 @{E} ≡ 0（不是"很小"，是恒等于 0）、'+
           'V ≡ 0。这正是"导体是等位体"的由来 —— 内部没有场，也就没有电位差。';
  if(p.zone==='surf')
    return '<b>P 正好落在导体表面</b>（r = a）：E_θ ≡ 0 ⇒ @{E} 严格沿法向；'+
           '法向分量 E_n = 3E₀cosθ = '+p.Er.toFixed(2)+' kV/m，而 σ = ε₀E_n = '+p.sig.toFixed(1)+' nC/m²。'+
           'V 与 θ 无关、恒为 0 ⇒ 表面是等位面。';
  return '<b>P 在导体外部</b>：E_n = '+p.Er.toFixed(2)+' kV/m、E_t = '+p.Eth.toFixed(2)+' kV/m，'+
         '切向分量占比 '+(p.ett*100).toFixed(1)+'% ⇒ @{E} 与法向夹 '+p.ang.toFixed(1)+'°（外部不垂直，只有表面才垂直）。';
}
function buildNote(){
  const t=state.t, g=state.g, E0=state.E0, Ea=E0*g;
  if(g<0.05) return '<b>还没有外加电场</b>：导体里的自由电荷均匀分布，宏观上既不显电、内部也没有场。'+
    '按 <b>▶ 播放全过程</b>，看外加匀强场加上去以后会发生什么。';
  if(g<0.995) return '<b>外加匀强场正在建立</b>（当前 '+Ea.toFixed(2)+' kV/m，刚到 '+Math.round(g*100)+'%）：'+
    '场线<b>笔直穿过导体</b>，球内仍是原样的匀强场 —— 因为自由电荷<b>还没来得及动</b>。';
  if(t<=0.005) return '<b>外场已经加上</b>（'+E0.toFixed(1)+' kV/m）：电荷还没开始迁移，'+
    '球内球外是同一个匀强场 @{E}₀。';
  if(t>=0.995) return '<b>已达静电平衡</b>：内部 |@{E}| ≡ 0，表面电荷不再移动。'+
    '此时表面 σ(θ) = 3ε₀E₀cosθ ⇒ 总量 ∮σdS = 0（下半球负电荷与上半球正电荷恰好抵消）。';
  return '<b>自由电荷正在迁移</b>（迁移进度 '+Math.round(t*100)+'%）：正电荷顺场线往 +z 极跑、'+
    '负电荷逆场线往 −z 极跑，表面堆出的感应电荷产生反向场 ⇒ 内部合场降到 '+(Ea*(1-t)).toFixed(2)+' kV/m。'+
    '<b>⚠️ 真实过程 ~10⁻¹⁸ s 就结束了，这里是为了看清机理而放慢的示意。</b>';
}
function shieldNote(){
  const qc=state.qc;
  if(Math.abs(qc)<0.02)
    return '<b>腔内无电荷</b>：腔内 @{E} ≡ 0（严格），与外加场 E₀ 多大完全无关 —— '+
      '这就是"导体空腔屏蔽外场"。原因是外表面的感应电荷把外场在壳内恰好抵消干净。';
  return '<b>腔内有电荷 q = '+qc.toFixed(2)+' µC</b>：内表面感应出 −q、外表面多出 +q。'+
    '腔内的场只由 q 决定；而<b>腔外</b>的场只与"总量 q"有关 —— '+
    '把 q 在腔内挪到任何位置（不止球心），外部场的分布<b>一个字都不变</b>。'+
    '想连总量也屏蔽掉，必须把外壳<b>接地</b>（把 +q 引走）。';
}

/* ══════════════════════════════ 右侧面板 ══════════════════════════════ */
const panel=document.getElementById('panel');
function h(html){const d=document.createElement('div');d.innerHTML=html;return d;}
function kchip(k,v,cls){return '<span class="coord-chip '+(cls||'')+'">'+richHTML(k)+'<b>'+v+'</b></span>';}
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
  build: [{k:'lines',t:'外场 @{E}₀ 与场线'},{k:'chg',t:'表面感应电荷'},{k:'flow',t:'电荷迁移方向'},
          {k:'inner',t:'球内合场'},{k:'box',t:'坐标轴'}],
  concl: [{k:'lines',t:'外场 @{E}₀ 与场线'},{k:'equi',t:'等位面 V = const'},{k:'chg',t:'表面感应电荷'},
          {k:'dec',t:'@{E} 的法向 / 切向分解'},{k:'vz',t:'V 沿 z 剖面小卡'},{k:'box',t:'坐标轴'}],
  shield:[{k:'lines',t:'外场 @{E}₀ 与场线'},{k:'chg',t:'感应电荷'},{k:'box',t:'坐标轴'}],
};
function mkRange(sec,d){
  /* ⚠️ d.label 里会写 @{E}₀ ⇒ 必须过 richHTML，否则字面显示 */
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    const v=parseFloat(inp.value);
    d.set(v);
    document.getElementById('v_'+d.k).textContent=d.fmt(parseFloat(inp.value));
    needsRender=true; updateReadout(); updateModeTag();
    if(d.after) d.after();
  };
  sec.appendChild(r);
}
function clampRp(){ state.rp=Math.max(RP_RANGE[0],Math.min(RP_RANGE[1],state.rp)); }
function clampThp(){ state.thp=Math.max(TH_LIM[0],Math.min(TH_LIM[1],state.thp)); }
/* ⚠️ 让「表面」这个位置**够得着**：r 的步长 0.01、最小值 0.32，恰好能落到 0.80；
   但浮点误差会让 0.7999999 被判成"内部" ⇒ 显式吸附（这是本页最关键的一个位置）。 */
function snapRp(){ if(Math.abs(state.rp-A_C)<0.006) state.rp=A_C; clampRp(); }

function renderSubSec(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="sec-title">显示</div>'));
  chipRow(sec,SHOW_ITEMS[state.mode],k=>state.show[k],k=>{
    state.show[k]=!state.show[k]; needsRender=true; renderPanel();
  });
  const m=state.mode;
  if(m==='build'){
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">全过程播放</div>'));
    const bx=h('<div class="sub-chips"></div>').firstChild;
    /* 主按钮：播放 / 暂停。首次按下时把 (g,t) 一起归零 ⇒ 从"完全没有电场"开始 */
    const pb=h('<button class="chip o" id="btnPlay">'+
      ((state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 播放全过程')+'</button>').firstChild;
    pb.onclick=()=>{
      if(state.anim) state.anim.playing=!state.anim.playing;
      else { state.anim={u:0,playing:true}; state.g=0; state.t=0; }
      renderPanel(); needsRender=true; syncSliders(); updateReadout(); updateModeTag();
    };
    bx.appendChild(pb);
    const rb=h('<button class="chip" id="btnReplay">↺ 重播</button>').firstChild;
    rb.onclick=()=>{ state.anim={u:0,playing:true}; state.g=0; state.t=0;
      renderPanel(); needsRender=true; syncSliders(); updateReadout(); updateModeTag(); };
    bx.appendChild(rb);
    const jb=h('<button class="chip" id="btnEq">⏭ 直接到静电平衡</button>').firstChild;
    jb.onclick=()=>{ stopAnim(); state.t=1; state.g=1; renderPanel(); updateAll(); };
    bx.appendChild(jb);
    sec.appendChild(bx);
    sec.appendChild(h('<div class="ex-note" id="buildNote">'+richHTML(buildNote())+'</div>'));
  } else if(m==='concl'){
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">把 P 送到关键位置</div>'));
    const bx=h('<div class="sub-chips"></div>').firstChild;
    const sb=h('<button class="chip">放到导体表面（r = a）</button>').firstChild;
    sb.onclick=()=>{ state.sweep=null; state.rp=A_C; renderPanel(); updateAll(); };
    bx.appendChild(sb);
    const ib=h('<button class="chip">放进导体内部</button>').firstChild;
    ib.onclick=()=>{ state.sweep=null; state.rp=A_C*0.55; renderPanel(); updateAll(); };
    bx.appendChild(ib);
    const ob=h('<button class="chip">挪到导体外部</button>').firstChild;
    ob.onclick=()=>{ state.sweep=null; state.rp=A_C*1.7; renderPanel(); updateAll(); };
    bx.appendChild(ob);
    sec.appendChild(bx);
    const bx2=h('<div class="sub-chips" style="margin-top:8px"></div>').firstChild;
    const rw=h('<button class="chip g'+(state.sweep==='rad'?' on':'')+'">▶ 沿半径扫（内 → 表 → 外）</button>').firstChild;
    rw.onclick=()=>{ state.sweep = state.sweep==='rad'?null:'rad'; renderPanel(); };
    bx2.appendChild(rw);
    const sw=h('<button class="chip g'+(state.sweep==='surf'?' on':'')+'">▶ 沿表面扫（θ 变）</button>').firstChild;
    sw.onclick=()=>{ state.sweep = state.sweep==='surf'?null:'surf'; state.rp=A_C; renderPanel(); };
    bx2.appendChild(sw);
    sec.appendChild(bx2);
    sec.appendChild(h('<div class="ex-note" id="probeNote">'+richHTML(probeNote())+'</div>'));
  } else {
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">腔内情形</div>'));
    const bx=h('<div class="sub-chips"></div>').firstChild;
    const b0=h('<button class="chip g'+(Math.abs(state.qc)<0.02?' on':'')+'">腔内无电荷</button>').firstChild;
    b0.onclick=()=>{ state.qc=0; renderPanel(); updateAll(); };
    bx.appendChild(b0);
    const b1=h('<button class="chip o'+(Math.abs(state.qc-1)<0.02?' on':'')+'">腔内放 +1 µC</button>').firstChild;
    b1.onclick=()=>{ state.qc=1; renderPanel(); updateAll(); };
    bx.appendChild(b1);
    const b2=h('<button class="chip o'+(Math.abs(state.qc+1)<0.02?' on':'')+'">腔内放 −1 µC</button>').firstChild;
    b2.onclick=()=>{ state.qc=-1; renderPanel(); updateAll(); };
    bx.appendChild(b2);
    sec.appendChild(bx);
    sec.appendChild(h('<div class="ex-note" id="shieldNote">'+richHTML(shieldNote())+'</div>'));
  }
}
const SLIDER_FMT={
  E0:v=>v.toFixed(1)+' kV/m',
  t: v=>Math.round(v*100)+'%',
  rp:v=>v.toFixed(2)+' m',
  thp:v=>Math.round(v)+'°',
  qc:v=>sgnTxt(v,2)+' µC',
};
function syncSliders(){
  const set=(k,v)=>{const s=document.getElementById('s_'+k);
    if(s)s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v);};
  set('E0',state.E0); set('t',state.t); set('rp',state.rp); set('thp',Math.round(state.thp)); set('qc',state.qc);
  const pn=document.getElementById('probeNote'); if(pn) pn.innerHTML=richHTML(probeNote());
  const sn=document.getElementById('shieldNote'); if(sn) sn.innerHTML=richHTML(shieldNote());
  const bn=document.getElementById('buildNote'); if(bn) bn.innerHTML=richHTML(buildNote());
}
function renderSliders(sec){
  sec.innerHTML='';
  const m=state.mode;
  sec.appendChild(h('<div class="sec-title">外加匀强场</div>'));
  mkRange(sec,{k:'E0',label:'@{E}₀',wide:true,min:E0_RANGE[0],max:E0_RANGE[1],step:0.5,
    get:()=>state.E0, set:v=>state.E0=v, fmt:v=>v.toFixed(1)+' kV/m'});
  if(m==='build'){
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">电荷迁移进度</div>'));
    mkRange(sec,{k:'t',label:'迁移进度 t',wide:true,min:0,max:1,step:0.01,
      get:()=>state.t, set:v=>{state.t=v; stopAnim();}, fmt:v=>Math.round(v*100)+'%'});
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '滑块只调"<b>电荷迁移</b>到哪一步"（外场默认已建立）。想看<b>完整的</b>过程（无外场 → 加场 → '+
      '迁移 → 平衡），请按上方的 <b>▶ 播放全过程</b>。'+
      '<br>真实的电荷重分布只花 ~10⁻¹⁸ s，<b>拖动只是为了把机理看清楚</b>，'+
      '不要把中间状态当成会持续存在的物理过程。')+'</div>'));
  } else if(m==='concl'){
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">探针 P 的位置（球坐标）</div>'));
    mkRange(sec,{k:'rp',label:'半径 r',wide:true,min:RP_RANGE[0],max:RP_RANGE[1],step:0.01,
      get:()=>state.rp, set:v=>{ state.rp=v; snapRp(); }, fmt:v=>v.toFixed(2)+' m',
      after:()=>{ if(document.getElementById('s_rp')) document.getElementById('s_rp').value=state.rp;
                  syncSliders(); }});
    mkRange(sec,{k:'thp',label:'极角 θ',wide:true,min:TH_LIM[0],max:TH_LIM[1],step:1,
      get:()=>state.thp, set:v=>state.thp=Math.round(v), fmt:v=>Math.round(v)+'°'});
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '导体球在匀强场里是**轴对称**的 ⇒ 绕 z 轴转 φ 什么都不变，所以两个坐标 (r, θ) 就够了。'+
      'P 能在 xz 平面内<b>任意拖</b>，也能用这两个滑块精确打到数值。'+
      'r 的滑块在 0.80 m 处<b>会自动吸附</b>到导体表面 —— 那个位置最值得看。')+'</div>'));
  } else {
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">腔内点电荷</div>'));
    mkRange(sec,{k:'qc',label:'q',wide:true,min:QC_RANGE[0],max:QC_RANGE[1],step:0.1,
      get:()=>state.qc, set:v=>state.qc=Math.round(v*10)/10, fmt:v=>sgnTxt(v,2)+' µC'});
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      'q 放在<b>腔中心</b>只是为了把图画简单：结论对腔内任意位置都成立。'+
      '注意 ③ 的 q 用 <b>µC</b> —— 因为 1 µC 在 1 m 处恰好产生 8.99 kV/m，'+
      '与"外场 10 kV/m"同量级，画在一起才看得见。')+'</div>'));
  }
}

const CARDS={
  build:[
    {k:'1',tab:'1. 为什么会有平衡态',cls:'c1',body:
      '<b>导体里有大量自由电荷（自由电子）</b>，它们受力就会动：'+
      '<div class="frm">@{F} = q@{E}　⇒　正电荷顺场线跑，负电荷逆场线跑</div>'+
      '<ul><li>一旦把导体放进外场，自由电荷就开始移动 —— 正电荷往 +z 极、负电荷往 −z 极</li>'+
      '<li>电荷在<b>表面</b>堆起来（内部无处可去：跑到对面的面就停住了）</li>'+
      '<li>这些"感应电荷"自己又产生一份场，方向与外场<b>相反</b></li>'+
      '<li>堆到某一步：两个场在导体内部<b>处处等大反向</b> ⇒ 内部合场为 0 ⇒ 电荷不再受力、不再移动'+
      ' ⇒ 这就是<b>静电平衡</b></li></ul>'+
      '<div class="ex-note">关键是"内部恰好抵消"这件事没有近似 —— 只要还差一点点，'+
      '自由电荷就会继续移动去补上那一点点，直到严格为零。所以严格解里 r &lt; a 处 |@{E}| <b>恒等于 0</b>。</div>'},
    {k:'2',tab:'2. 感应电荷的分布',cls:'c2',body:
      '<b>表面电荷不是均匀的</b>：'+
      '<div class="frm">σ(θ) = 3ε₀E₀·cosθ　（θ 自外场方向 +z 起算）</div>'+
      '<ul><li>两极（θ = 0°、180°）σ 最大、符号相反；赤道（θ = 90°）σ = 0</li>'+
      '<li>总量 ∮σ dS = 0 —— 正负电荷<b>一样多</b>，因为导体本来不带电</li>'+
      '<li>画布上的 ⊕/⊖ 符号：字号与浓淡 ∝ |σ|，所以"两极密、赤道空"是看出来的</li>'+
      '<li>把外场 E₀ 调大：σ 按比例整体变大，但<b>分布形状完全不变</b>（还是 cosθ）</li></ul>'},
    {k:'3',tab:'3. 若把外场撤掉',cls:'c3',body:
      '<b>撤掉外场（E₀ = 0）会怎样？</b>'+
      '<div class="frm">σ(θ) = 3ε₀E₀cosθ = 0　⇒　感应电荷全部消失</div>'+
      '<ul><li>一旦外场没了，内部也就不需要"抵消"什么，表面电荷失去堆积的理由，'+
      '在自身电场作用下会重新跑回去 ⇒ 双双归零</li>'+
      '<li>⇒ 这个感应电荷是<b>外场引起</b>的，不是导体自带的</li>'+
      '<li>对比记忆：带电导体球的 σ 是均匀的（自带的电荷，只受自身斥力）；'+
      '这里的不均匀 σ 是外场"掰"出来的</li></ul>'+
      '<div class="ex-note">把 E₀ 拉到最小 2 kV/m 看看：感应电荷符号变淡、内部是 0 —— '+
      '结论与 E₀ 的大小无关，只与"有没有导体"有关。</div>'},
  ],
  concl:[
    {k:'1',tab:'1. 四条结论',cls:'c1',body:
      '<b>静电平衡时，导体满足：</b>'+
      '<div class="frm">① 内部 @{E} ≡ 0　　② 电荷只分布在表面（内部净电荷为零）</div>'+
      '<div class="frm">③ 表面 @{E} ⊥ 表面　　④ 导体是等位体，表面是等位面</div>'+
      '<ul><li>②的推理：在导体内部任取一个高斯面，面上 @{E} ≡ 0 ⇒ 面内净电荷 = 0 ⇒ '+
      '内部处处无净电荷，电荷只能跑到表面上</li>'+
      '<li>③的推理：若表面有切向分量，表面自由电荷就受切向力 ⇒ 会继续移动 ⇒ 与"平衡"矛盾</li>'+
      '<li>④的推理：内部 @{E}=0 ⇒ 内部任意两点电位差 = ∫@{E}·d@{l} = 0 ⇒ 内部等位；'+
      '表面 @{E}⊥d@{l} ⇒ 沿表面移动也不做功 ⇒ 表面也是等位面</li></ul>'},
    {k:'2',tab:'2. 用探针验证',cls:'c2',body:
      '<b>把 P 拖到三个区域，看读数怎么变</b>（这就是上面四条结论的实验）：'+
      '<div class="frm">内部：|@{E}| = 0，V = 0　　表面：E_t = 0，V = 0　　外部：E_t ≠ 0</div>'+
      '<ul><li><b>拖到内部</b>（r &lt; a）：蓝色箭头消失，|@{E}| 读数恒为 0，'+
      'V 恒为 0 —— 而且不管 θ 怎么变都是 0</li>'+
      '<li><b>拖到表面</b>（r = a，会自动吸附）：绿色切向分量 E_t ≡ 0 ⇒ '+
      '橙色 E_n 与蓝色 @{E} <b>完全重合</b>（夹角 0°），这就是"垂直"</li>'+
      '<li><b>拖到外部</b>（r &gt; a）：切向分量冒出来了，E 与法向夹一个角；'+
      '越往外这个角越大（r → ∞ 时回到 90°，因为那已经是匀强场）</li>'+
      '<li>电位剖面小卡：|z| &lt; a 那一段是<b>一条水平线</b> ⇒ 等位体的直接证据</li></ul>'},
    {k:'3',tab:'3. 表面场与曲率',cls:'c3',body:
      '<b>导体表面场的大小与面电荷密度是同一个数：</b>'+
      '<div class="frm">@{E}_表面 = (σ/ε₀)·@{ê}_n　⇒　|@{E}| = σ/ε₀</div>'+
      '<ul><li>本页的球是严格解：|@{E}|(θ) = 3E₀|cosθ| —— 两极最强、赤道为零</li>'+
      '<li>⚠️ 赤道（θ=90°）处 σ = 0 <b>且</b> @{E} = 0：这是球体的特例，'+
      '不是"导体表面处处有场"</li>'+
      '<li>一般导体表面曲率越大处 σ 越密、场越强 ⇒ <b>尖端放电</b>、'+
      '避雷针要把尖端"钝化"都由此而来</li>'+
      '<li>本页画的是球（曲率处处相同），所以 σ 的起伏完全来自外场 cosθ 这个因子</li></ul>'},
    {k:'4',tab:'4. 等位面的形状',cls:'c4',body:
      '<b>导体把等位面"掰"了一下：</b>'+
      '<div class="frm">V(r,θ) = −E₀(r − a³/r²)·cosθ　(r ≥ a)　；　V ≡ 0　(r ≤ a)</div>'+
      '<ul><li>没有导体时，匀强场的等位面是一族<b>水平面</b> z = const</li>'+
      '<li>放进球以后：球本身就是 V = 0 的等位面，附近的等位面被它"顶"成帽形，'+
      '越远越平（远处又还原成水平面）</li>'+
      '<li>画布上的淡蓝虚线就是几个 V = ±E₀·0.85 / 1.45 / 2.05 的等位面</li>'+
      '<li>⚠️ V 的符号由 −cosθ 定：上半空间 V &lt; 0、下半空间 V &gt; 0 ⇒ '+
      '每个等位面只存在于一"半"空间（V = 0 那个面是唯一完整的，就是导体本身）</li></ul>'},
  ],
  shield:[
    {k:'1',tab:'1. 屏蔽外场',cls:'c1',body:
      '<b>空腔导体内部没有外加场：</b>'+
      '<div class="frm">腔内 |@{E}| ≡ 0　（与 E₀ 多大无关）</div>'+
      '<ul><li>机理：外场把自由电荷推到外表面 ⇒ 外表面电荷的场在壳内<b>正好抵消</b>外场</li>'+
      '<li>内表面<b>一点电荷都没有</b>（腔内无电荷时）⇒ 腔内也就没有任何源</li>'+
      '<li>空腔形状随便是什么样都不影响结论（腔内的"零场"与腔的形状无关）</li>'+
      '<li>这就是"屏蔽"：把仪器放进金属外壳里，外界的静电场进不来（法拉第笼）</li></ul>'+
      '<div class="ex-note">⚠️ 只对<b>静电场</b>成立。变化的场（电磁波）还要看壳厚度与频率 —— '+
      '那要等到第 4 章的"趋肤效应"。</div>'},
    {k:'2',tab:'2. 屏蔽内场',cls:'c2',body:
      '<b>腔内有电荷 q 时，外面看到什么？</b>'+
      '<div class="frm">内表面感应 −q　·　外表面多出 +q　·　腔外 @{E} 只由"总量 q"决定</div>'+
      '<ul><li>腔内：@{E} 只由 q 与腔的形状决定，外面的 E₀ 进不来 ⇒ 腔内是"独立王国"</li>'+
      '<li>腔外：外壳把内部的<b>细节</b>全遮住了 —— 把 q 在腔内挪到任何位置，'+
      '外部场的分布<b>一个字都不变</b></li>'+
      '<li>但<b>总量</b>遮不住：外表面多出的 +q 会在外面产生一份额外的场</li>'+
      '<li>⇒ 所以"屏蔽"是双向的，但"腔内的场不出腔"只对分布成立，对总量不成立</li></ul>'},
    {k:'3',tab:'3. 接地才彻底',cls:'c3',body:
      '<b>要连总量也屏蔽掉，必须接地：</b>'+
      '<div class="frm">接地 ⇒ 外表面 +q 被引向大地 ⇒ 外部场 = 0</div>'+
      '<ul><li>接地（V = 0 由大地供给）后，外壳电位被钉在 0，'+
      '外表面多出来的 +q 会被地"吸走"</li>'+
      '<li>于是腔外变成真正的无场区：腔内的一切（位置、电量、甚至形状）都不影响腔外</li>'+
      '<li>这是<b>屏蔽室</b>的做法：金属板做墙 + 良好接地</li>'+
      '<li>⚠️ 反过来说：不接地的空腔导体，虽然能屏蔽外场，'+
      '但一旦里面有电荷，就会在外面留下痕迹</li></ul>'+
      '<div class="ex-note">本页的 q 放在腔中心，内表面电荷是均匀的；'+
      '若 q 偏心，内表面电荷就<b>不再均匀</b>（近处的面密度更大），'+
      '但"内表面总量 = −q、外表面均匀 = +q、腔外只认 q"三条依然成立。</div>'},
  ],
};
function renderExplain(sec){
  sec.innerHTML='';
  const list=CARDS[state.mode];
  sec.appendChild(h('<div class="sec-title">讲解</div>'));
  const tabs=h('<div class="card-tabs"></div>').firstChild;
  list.forEach(c=>{
    const b=h('<button class="card-tab '+c.cls+(c.k===state.cardTab?' on':'')+'">'+c.tab+'</button>').firstChild;
    b.onclick=()=>{ state.cardTab=c.k; renderPanel(); };
    tabs.appendChild(b);
  });
  sec.appendChild(tabs);
  const cur=list.find(c=>c.k===state.cardTab)||list[0];
  const body=h('<div class="card-body '+cur.cls+'"><div class="ex-title">'+cur.tab+'</div></div>').firstChild;
  body.appendChild(h('<div class="ex-body">'+richHTML(cur.body)+'</div>').firstChild);
  sec.appendChild(body);
}
function renderPanel(){
  ['subSec','sliderSec','explainSec'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
  const mk=id=>{const d=document.createElement('div');d.className='panel-sec';d.id=id;return d;};
  let tog=document.getElementById('toggleSec');
  if(!tog){
    tog=mk('toggleSec');
    tog.appendChild(h('<label class="readout-toggle"><input type="checkbox" id="showReadoutCb"'+(state.showReadout?' checked':'')+'><span>在<b>画布下方</b>显示<b>实时数据</b>条</span></label>'));
    tog.querySelector('#showReadoutCb').onchange=e=>{state.showReadout=e.target.checked;updateReadout();};
    panel.appendChild(tog);
  }else tog.querySelector('#showReadoutCb').checked=state.showReadout;
  const s=mk('subSec'), sl=mk('sliderSec'), ex=mk('explainSec');
  panel.appendChild(s); panel.appendChild(sl); panel.appendChild(ex);
  renderSubSec(s); renderSliders(sl); renderExplain(ex);
  updateReadout(); updateModeTag();
}

function updateReadout(){
  const strip=document.getElementById('coordStrip'); if(!strip)return;
  if(!state.showReadout){ strip.innerHTML=''; return; }
  let html='';
  if(state.mode==='build'){
    const E0=state.E0, t=state.t, g=state.g, Ea=E0*g, st=stageOf();
    html += kchip('阶段 =', STAGE_NAMES[st], st===3?'acc':'warn');
    html += kchip('外加场 @{E}₀ =', E0.toFixed(1)+' kV/m');
    html += kchip('当前外场 =', Ea.toFixed(2)+' kV/m');
    html += kchip('外场建立 g =', Math.round(g*100)+'%');
    html += kchip('电荷迁移 t =', Math.round(t*100)+'%');
    html += kchip('内部 |@{E}| =', (Ea*(1-t)).toFixed(3)+' kV/m', t>=0.995?'acc':'warn');
    html += kchip('表面 σ(0°) =', (t*SIG_K*Ea).toFixed(1)+' nC/m²','acc');
    html += kchip('表面 σ(90°) =', '0.0 nC/m²');
    html += kchip('感应电荷总量 =', '0.0 nC');
    html += kchip('状态 =', st===3?'静电平衡':(g<0.05?'无外场':(t<=0.02?'外场已加上、电荷未动':'电荷仍在移动')),
      st===3?'acc':'warn');
    document.getElementById('lgTitle').textContent='静电平衡的建立';
    document.getElementById('lgNote').innerHTML=richHTML(STAGE_NAMES[st]+'　·　'+STAGE_NOTES[st]);
  } else if(state.mode==='concl'){
    const p=probeInfo();
    html += kchip('P 的位置 (r, θ) =', '('+p.r.toFixed(2)+' m, '+Math.round(state.thp)+'°)');
    html += kchip('所在区域 =', zoneWord(p.zone), p.zone==='out'?'':'acc');
    html += kchip('|@{E}| =', p.mag.toFixed(3)+' kV/m', p.zone==='in'?'acc':'');
    html += kchip('法向分量 @{E}_n =', p.Er.toFixed(3)+' kV/m','acc');
    html += kchip('切向分量 @{E}_t =', p.Eth.toFixed(3)+' kV/m', Math.abs(p.Eth)<1e-9?'acc':'warn');
    html += kchip('切向占比 =', (p.ett*100).toFixed(1)+'%', p.ett<1e-9?'acc':'warn');
    html += kchip('@{E} 与法向夹角 =', p.ang.toFixed(1)+'°', p.ang<1e-9?'acc':'warn');
    html += kchip('电位 V(P) =', p.V.toFixed(3)+' kV', p.zone==='in'||p.zone==='surf'?'acc':'');
    if(p.sig!=null) html += kchip('该点 σ =', p.sig.toFixed(1)+' nC/m²','acc');
    document.getElementById('lgTitle').textContent='静电平衡的四个结论 · 探针 P';
    document.getElementById('lgNote').innerHTML=richHTML(
      '内部 @{E}≡0 · 表面 @{E}⊥面 · 导体是等位体（V≡0）· 电荷只在表面');
  } else {
    const E0=state.E0, qc=state.qc;
    const rHalf=B_C*0.5, rIn=B_C*0.95, rOut=A_C*1.0, rFar=A_C*2.0;
    const Ein=q=>Q_KV*q/(rIn*rIn);
    const Efar=q=>E0*(1+2*Math.pow(A_C/rFar,3)) + Q_KV*q/(rFar*rFar);
    html += kchip('外加场 @{E}₀ =', E0.toFixed(1)+' kV/m');
    html += kchip('腔内电荷 q =', sgnTxt(qc,2)+' µC');
    html += kchip('腔内 |@{E}|(r=b/2) =', (Q_KV*Math.abs(qc)/(rHalf*rHalf)).toFixed(3)+' kV/m',
      Math.abs(qc)<0.02?'acc':'warn');
    html += kchip('腔内 |@{E}|(r=0.95b) =', (Q_KV*Math.abs(qc)/(rIn*rIn)).toFixed(3)+' kV/m');
    html += kchip('壳内 |@{E}| =', '0.000 kV/m','acc');
    html += kchip('内表面总电荷 =', sigIn(qc).toFixed(1)+' nC','acc');
    html += kchip('外表面总电荷 =', (qc*1000).toFixed(1)+' nC','acc');
    html += kchip('外部 |@{E}|(r=2a,θ=0) =', Efar(qc).toFixed(3)+' kV/m');
    html += kchip('结论 =', Math.abs(qc)<0.02?'外场被完全屏蔽':'外部只认总量 q', 'acc');
    document.getElementById('lgTitle').textContent='静电屏蔽 · 空腔导体';
    document.getElementById('lgNote').innerHTML=richHTML(
      '腔内无电荷 ⇒ 腔内 @{E}≡0；腔内有电荷 ⇒ 内表面 −q、外表面 +q，外部只认总量');
  }
  strip.innerHTML=html;
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t)return;
  const sb=document.getElementById('moduleSub');
  if(state.mode==='build')
    t.innerHTML=richHTML('静电平衡的建立 · '+STAGE_NAMES[stageOf()]+
      '　@{E}₀ = '+state.E0.toFixed(1)+' kV/m　外场建立 '+Math.round(state.g*100)+
      '%　电荷迁移 '+Math.round(state.t*100)+'%');
  else if(state.mode==='concl'){
    const p=probeInfo();
    t.innerHTML=richHTML('四个结论 · P：(r, θ) = ('+p.r.toFixed(2)+' m, '+Math.round(state.thp)+'°)　'+
      zoneWord(p.zone)+'　|@{E}| = '+p.mag.toFixed(3)+' kV/m');
  } else
    t.innerHTML=richHTML('静电屏蔽 · q = '+sgnTxt(state.qc,2)+' µC　腔内 |@{E}| = '+
      (Q_KV*Math.abs(state.qc)/(B_C*B_C*0.25)).toFixed(2)+' kV/m（r = b/2）');
  if(sb) sb.innerHTML=richHTML(
    state.mode==='build'  ? '正电荷顺场线、负电荷逆场线 ⇒ 表面感应电荷 ⇒ 内部合场被抵消到 0'
  : state.mode==='concl'  ? '内部 @{E} ≡ 0　·　表面 @{E} ⊥ 表面　·　导体是等位体（V ≡ 0）'
  :                         '腔内无场（屏蔽外场）　·　腔内电荷只以"总量"影响外部（屏蔽内场）');
}

/* ══════════════════════════════ 主循环 ══════════════════════════════ */
let needsRender=true;
function draw(){
  setupCamera(); ctx.clearRect(0,0,W,H);
  buildScene();
  prims.sort((a,b)=>a.z-b.z);
  for(const p of prims) p.draw(ctx);
  drawOverlays();
  const pt2=document.getElementById('panTag');
  if(pt2) pt2.classList.toggle('show',Math.abs(cam.px)>2||Math.abs(cam.py)>2);
  needsRender=false;
}
let _lastT=performance.now();
function tick(){
  const now=performance.now(); const dt=Math.min(0.05,(now-_lastT)/1000); _lastT=now;
  try{
    if(state.autoRotate){ cam.az+=0.0045; needsRender=true; }
    /* ① 的"全过程播放"：一条时间轴 u 同时驱动外场建立度 g 与电荷迁移 t（见 new_a.js 的推导） */
    const ra=stepAnim(dt);
    if(ra){
      needsRender=true; syncSliders(); updateReadout(); updateModeTag();
      const pb=document.getElementById('btnPlay');
      if(pb) pb.textContent=(state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 播放全过程';
      if(ra==='end') renderPanel();          /* 播完再重建一次面板（按钮文字/滑块归位） */
    }
    if(state.mode==='concl' && state.sweep){
      if(state.sweep==='rad'){
        state.rp += dt*SWEEP_SPEED.rad;
        if(state.rp>RP_RANGE[1]) state.rp=RP_RANGE[1]-(state.rp-RP_RANGE[1]);
        if(state.rp<RP_RANGE[0]) state.rp=RP_RANGE[0]+(RP_RANGE[0]-state.rp);
      } else {
        state.rp=A_C;
        state.thp += dt*SWEEP_SPEED.surf;
        if(state.thp>TH_LIM[1]) state.thp=TH_LIM[1]-(state.thp-TH_LIM[1]);
        if(state.thp<TH_LIM[0]) state.thp=TH_LIM[0]+(TH_LIM[0]-state.thp);
      }
      needsRender=true; syncSliders();
      updateReadout(); updateModeTag();
      const pn=document.getElementById('probeNote'); if(pn) pn.innerHTML=richHTML(probeNote());
    }
    if(needsRender) draw();
  }catch(err){ needsRender=false; console.error('draw/tick error:',err); }
  requestAnimationFrame(tick);
}
function updateAll(){ needsRender=true; syncSliders(); updateReadout(); updateModeTag(); }

/* ══════════════════════════════ 交互 ══════════════════════════════ */
let drag=null;
function localPos(ev){const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};}
/* 探针 P = (r, θ) 两个自由度 ⇒ 拖动 = 把鼠标位移反解成 (Δr, Δθ)。
   两个世界基：B₁ = ∂P/∂r = (sinθ, 0, cosθ)、B₂ = ∂P/∂θ = (r cosθ, 0, −r sinθ)。
   它们在当前相机下的屏幕投影构成 2×2 矩阵 J；解 J·(Δr,Δθ) = mouseΔ 即可。
   ★ 与 2.1 线电荷的 xyJac() 是同一套技术（那里的两个基是 x̂/ŷ），这里换成 (r,θ) 的两个自然基。
   ★ J 会在"两个基的投影共线"时退化（例如 θ→0 时 B₂ ∥ x̂ 而视线正对 x̂）⇒ |det| 加下限，
     灵敏度被钳住（拖起来变钝）但绝不会飞出去，且越界还会被 clamp 兜住。 */
const P_HIT=26;
function probeJac(){
  const th=state.thp*D2R, r=state.rp;
  const B1=pt(Math.sin(th),0,Math.cos(th));
  const B2=pt(r*Math.cos(th),0,-r*Math.sin(th));
  const P1={x:camScale*vdot(B1,camU), y:-camScale*vdot(B1,camV)};
  const P2={x:camScale*vdot(B2,camU), y:-camScale*vdot(B2,camV)};
  const det0=P1.x*P2.y-P1.y*P2.x;
  const ref=camScale*camScale*vlen(B1)*vlen(B2);
  if(!isFinite(det0)||ref<1e-9) return null;
  return {P1,P2,det0,ref};
}
function overProbe(m){
  if(state.mode!=='concl') return false;
  const w=pr(probeP());
  return Math.hypot(m.x-w.x,m.y-w.y)<P_HIT;
}
canvas=document.getElementById('cv');
ctx=canvas.getContext('2d');
canvas.addEventListener('pointerdown',ev=>{
  canvas.setPointerCapture(ev.pointerId);
  const m=localPos(ev);
  if(ev.button===0 && overProbe(m)){ drag={x:m.x,y:m.y,btn:0,mode:'probe'}; ev.preventDefault(); return; }
  drag={x:m.x,y:m.y,btn:ev.button,mode:(ev.button===2||ev.ctrlKey)?'pan':'rot'};
  ev.preventDefault();
});
canvas.addEventListener('pointermove',ev=>{
  const m=localPos(ev);
  if(!drag){ canvas.style.cursor = overProbe(m) ? 'move' : ''; return; }
  const dx=m.x-drag.x, dy=m.y-drag.y; drag.x=m.x; drag.y=m.y;
  if(drag.mode==='probe'){
    state.sweep=null;
    const J=probeJac();
    if(J){
      const det=(Math.abs(J.det0) < 0.25*J.ref) ? ((J.det0>=0?1:-1)*0.25*J.ref) : J.det0;
      state.rp += (dx*J.P2.y - dy*J.P2.x)/det;
      state.thp += (J.P1.x*dy - J.P1.y*dx)/det*R2D;
      snapRp(); clampThp();
      needsRender=true; syncSliders(); updateReadout(); updateModeTag();
      const pn=document.getElementById('probeNote'); if(pn) pn.innerHTML=richHTML(probeNote());
    }
  }
  else if(drag.mode==='pan'){ cam.px+=dx; cam.py+=dy; needsRender=true; }
  else { cam.az-=dx*0.0075; cam.el=Math.max(-1.45,Math.min(1.45,cam.el+dy*0.0062)); needsRender=true; }
});
canvas.addEventListener('pointerup',()=>{ if(drag&&drag.mode==='probe') syncSliders(); drag=null; });
canvas.addEventListener('pointercancel',()=>{ if(drag&&drag.mode==='probe') syncSliders(); drag=null; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.zoom=Math.max(.45,Math.min(3.2,cam.zoom*(e.deltaY<0?1.09:1/1.09)));needsRender=true;},{passive:false});
document.getElementById('btnReset').onclick=()=>{ cam.az=.62; cam.el=.40; cam.zoom=1; cam.px=0; cam.py=0; needsRender=true; };
document.getElementById('btnRotate').onclick=e=>{state.autoRotate=!state.autoRotate;e.target.classList.toggle('on',state.autoRotate);};
document.getElementById('btnPanReset').onclick=()=>{cam.px=0;cam.py=0;needsRender=true;};
function bindFold(bid,cls){document.getElementById(bid).onclick=()=>{document.body.classList.toggle(cls);setTimeout(resize,60);setTimeout(resize,260);};}
bindFold('foldNav','nav-off'); bindFold('foldPanel','panel-off');
document.getElementById('tglNav').onclick=()=>{document.body.classList.toggle('nav-off');setTimeout(resize,260);};
document.getElementById('tglPanel').onclick=()=>{document.body.classList.toggle('panel-off');setTimeout(resize,260);};
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;
  if(e.key==='['){document.body.classList.toggle('nav-off');setTimeout(resize,260);}
  if(e.key===']'){document.body.classList.toggle('panel-off');setTimeout(resize,260);}});

/* ══════════════════════════════ 页签 ══════════════════════════════ */
const MT=[{k:'build',t:'① 静电平衡的建立'},
          {k:'concl',t:'② 静电平衡的四个结论'},
          {k:'shield',t:'③ 静电屏蔽'}];
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ state.mode=m.k; state.cardTab='1'; state.sweep=null; stopAnim();
    syncModeTabs(); cam.az=.62; cam.el=.40; cam.px=0; cam.py=0;
    renderPanel(); updateAll(); };
  modeTabs.appendChild(b);});
function syncModeTabs(){Array.from(modeTabs.children).forEach(b=>b.classList.toggle('on',b.dataset.k===state.mode));}

function resize(){
  const r=canvas.getBoundingClientRect();
  const nw=Math.max(60,Math.round(r.width)),nh=Math.max(60,Math.round(r.height));
  DPR=Math.min(2,window.devicePixelRatio||1);
  if(nw===W&&nh===H&&canvas.width===Math.round(nw*DPR))return;
  W=nw;H=nh;canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0); needsRender=true;
}
new ResizeObserver(()=>resize()).observe(canvas);

const nav=document.getElementById('nav');
NAV.forEach(g=>{nav.appendChild(h('<div class="nav-ch">'+g.ch+'</div>'));
  g.items.forEach(it=>{const cls='nav-item'+(it.active?' active':'')+(it.ready?'':' soon');
    nav.appendChild(h('<a class="'+cls+'" '+(it.href?'href="'+it.href+'"':'')+'><span class="dot"></span>'+it.t+'</a>'));});});

clampRp(); clampThp();
syncModeTabs();
resize();
renderPanel();
updateAll();
tick();
