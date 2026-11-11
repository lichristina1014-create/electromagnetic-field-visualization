/* ============================================================================
   4.1 磁感应强度与磁通量 —— 物理模型与几何（引擎段与 2.3 / 4.2 同源）
   ----------------------------------------------------------------------------
   ★★ 教学动线（四个页签，逐字对应教学说明 md）：
       ① 安培力    ：两根平行载流导线，同向相吸、反向相斥；
                     力的来源拆解 F = I₂dl₂ × B₁₂（不是"导线拉导线"）
       ② 磁感应强度：同一根长直导线单独看 —— @{B} 沿圆周切向（右手螺旋），
                     大小 1/r 衰减；B ≡ F_max/(I·dl) 的定义回勾 ①
       ③ 磁通量    ：Φ = BA cosθ = 数穿过面的磁感线根数；
                     θ=90° 时一根不穿，但 @{B} 一根箭头都没少
       ④ 闭合面    ：磁感线闭合 ⇒ ∮@{B}·dS = 0（进多少出多少）；
                     电力线有头有尾 ⇒ ∮@{D}·dS = Q内（第 2 章锚点）

   ★★ 定量链条（自检 chk41 逐条断言）：
       B₁₂   = µ₀I₁/(2πd)            （导线 1 在导线 2 处产生的磁感应强度）
       F/L   = µ₀I₁I₂/(2πd)          （单位长度安培力，N/m）
       F     = µ₀I₁I₂L/(2πd)
       B(r)  = µ₀I/(2πr)             （长直导线外一点的磁感应强度）
       Φ     = B·A·cosθ              （均匀场穿过平面）
       穿线根数 n(θ,A) = #{k : |k·d| < w(A)·|cosθ|}   （离散示意，见下）
       ∮@{B}·dS ≡ 0 ；∮@{D}·dS = Q内

   ★ 单位：I 用 A、d 用 m、F 用 µN、B 用 µT（②）/ mT（③）、
     A 用 dm²、Φ 用 mWb —— 全部照 md 的"课堂数字好念"约定
     （40 mT × 1.2 dm² = 0.48 mWb @θ=0）。
     ⚠️ 板书提醒：1 T·m² = 1 Wb，换算是干净的。

   ⚠️⚠️ ③ 的"数根数"是**离散示意**，绝不是把 Φ 量化：
     场线间距 FLUX_D 固定（13 根一行），所以面板上的可见根数只随
     w(A)·|cosθ| 变，而 w ∝ A ⇒ **根数 ∝ A、Φ ∝ A**（一致）；
     但 A 从 0.5 涨到 2.0（Φ 涨 4 倍）时根数只从 3 涨到 9 ——
     因为根数还带一个 floor。学生若抠这一点，正是"极限思想"的加分题。
   ============================================================================ */

/* ============================== 物理常数 ============================== */
const MU0 = 4*Math.PI*1e-7;              /* H/m，真空磁导率 */

/* ============================== 几何尺度 ============================== */
const EXT41   = 0.98;                    /* 坐标轴长度 */
const WIRE_Z0 = -0.95, WIRE_Z1 = 0.95;   /* 长直导线在 z 方向的画成范围 */

/* ① 安培力：世界间距与物理间距的映射（物理 d 越小，两根导线画得越近） */
const SEP_A = 0.16, SEP_B = 0.66;
const AMP_DZ = 0.62;                     /* ① 里画出的那一段导线的半长（代表 L） */

/* ② 磁感应强度 */
const R_M2W = 1.50;                      /* 物理半径 r(m) → 世界半径（0.10/0.16/0.25 m ⇒ 0.15/0.24/0.375） */
/* ★ ② 的 @{B} 用 quiver 画：xy 平面上一张 5×5 的方格（中心那格跳过），
   每格一支切向箭头、长度 ∝ 1/ρ —— 这正是矢量场最经典的画法：
   箭头一圈圈转起来 = 环绕导线；近处长、远处短 = 1/r。
   ⚠️ 先试过「三个同心圆各摆 6 支箭头」，画面像刺猬（箭头挤在一小片区域、朝向各异），弃用。 */
const QUIV_N = 7, QUIV_SPAN = 0.84;      /* 7×7 格，坐标 ±0.84 ⇒ 格距 0.28（密一点才像场） */
const QUIV_L0 = 0.17, QUIV_R0 = 0.30;    /* 箭头最长 0.17（在 ρ=0.30 处），再近就截顶 */
const QUIV_GUIDE = [0.32, 0.58];         /* 两条虚线导引圆：把「等 B 线」点出来 */
const RINGS = [0.100, 0.160, 0.250];     /* 卡片里举的三个同一根导线、不同距离的例（m） */

/* ③ 磁通量 */
const PLATE_HW = 0.325;                  /* 板半宽 = PLATE_HW × A(dm²)  ⇒ A=1.2 时 0.39 */
const PLATE_HH = 0.20;                   /* 板沿 ŷ 的半高（固定，不随 A 变） */
const FLUX_D   = 0.156;                  /* 场线间距（固定！A=1.2 时正好 5 根穿过） */
const FLUX_NK  = 6;                      /* k = -6..6 ⇒ 一行 13 根 */
const FLUX_Z0  = -0.95, FLUX_Z1 = 0.95;

/* ④ 闭合面 */
const SEP4    = 0.44;                    /* 两个球心分别在 y = ∓SEP4 */
const DIP_L   = 0.62;                    /* 磁偶极子场线的口径（最远处离偶极子 DIP_L） */
const DIP_TRIM= 0.055;                   /* 场线在极点附近的截断半径（免得糊成一团） */
const DIP_SEG = 240;                     /* 每条偶极子场线的采样段数 */
const DIP_N   = 4;                       /* 4 条子午线（4 个方位）⇒ 4 进 4 出 */
const ELE_N   = 6;                       /* 电力线 6 根 ⇒ 6 出 0 进 */
const ELE_R0  = 0.02, ELE_R1 = 0.62;     /* 电力线的起点/终点半径 */
const LOOP_A  = 0.10;                    /* 球内小电流环的半径（世界） */
const Q4      = 2.0e-9;                  /* 球内电荷 2.00 nC */

/* ============================== 量程 ============================== */
const I1_RANGE=[-20,20], I2_RANGE=[-20,20], D_RANGE=[0.02,0.12], LA_RANGE=[0.20,1.00];
const I_RANGE =[2,20], RP_RANGE=[0.02,0.50];
const TH_RANGE=[0,180], B3_RANGE=[10,100], A3_RANGE=[0.5,2.0];
const R4_RANGE=[0.14,0.34];

/* ============================== 状态 ============================== */
const state = {
  mode:'ampere',                /* ampere | field | flux | closed */
  /* ① 安培力 */
  I1:10,                        /* 导线 1 的电流 A，**带符号**（+ = 沿 +z，− = 沿 −z） */
  I2:10,                        /* 导线 2 的电流 A，**带符号**；同号相吸、异号相斥 */
  d:0.05,                       /* 两导线间距 m */
  La:0.60,                      /* 参与受力的那一段长度 m */
  /* ② 磁感应强度 */
  If:10,                        /* 长直导线电流 A */
  rp:0.16,                      /* 探针 P 到导线的距离 m（默认正落在**中圈**上） */
  /* ③ 磁通量 */
  th:120,                       /* ★ 初始故意停在 120°（负通量区，md 的要求） */
  B3:40,                        /* 均匀场 mT */
  A3:1.2,                       /* 面面积 dm² */
  /* ④ 闭合面 */
  R4:0.28,                      /* 闭合球面半径 m（世界单位同值） */
  /* ⚠️⚠️ 这些键**必须与 page1.js 的 SHOW_ITEMS 逐字对齐**（四页签并集）：
       wire/bcir/force/inset = ①；bvec/probe = ②；
       fline/plate/count/cos = ③；sphM/linesM/sphE/linesE = ④；box = 坐标轴。 */
  show:{ wire:true, bcir:true, force:true, inset:true,
         bvec:true, probe:true,
         fline:true, plate:true, count:true, cos:true,
         sphM:true, linesM:true, sphE:true, linesE:true, box:true },
  showReadout:true,
  autoRotate:false,
  cardTab:'1',
};
/* 每个页签自己的起点（切页签时整体覆盖 ⇒ 每个演示都可复现） */
const PRESET={
  ampere:{I1:10, I2:10, d:0.05, La:0.60},
  field: {If:10, rp:0.16},
  flux:  {th:120, B3:40, A3:1.2},
  closed:{R4:0.28},
};
/* ★ 防御：把 state 里所有"滑块量"夹回各自量程（按钮把量设到量程外的静默不一致） */
function clampState(){
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  state.I1=cl(state.I1,I1_RANGE[0],I1_RANGE[1]);
  state.I2=cl(state.I2,I2_RANGE[0],I2_RANGE[1]);
  state.d =cl(state.d ,D_RANGE[0], D_RANGE[1]);
  state.La=cl(state.La,LA_RANGE[0],LA_RANGE[1]);
  state.If=cl(state.If,I_RANGE[0], I_RANGE[1]);
  state.rp=cl(state.rp,RP_RANGE[0],RP_RANGE[1]);
  state.th=cl(state.th,TH_RANGE[0],TH_RANGE[1]);
  state.B3=cl(state.B3,B3_RANGE[0],B3_RANGE[1]);
  state.A3=cl(state.A3,A3_RANGE[0],A3_RANGE[1]);
  state.R4=cl(state.R4,R4_RANGE[0],R4_RANGE[1]);
  return state;
}

/* ============================== ① 安培力 ============================== */
/* 单位长度安培力（N/m）：两根平行载流导线 */
function fPerLen(I1,I2,d){ return MU0*Math.abs(I1*I2)/(2*Math.PI*Math.max(1e-4,d)); }
/* 长度 L 上的安培力（N） */
function fTotal(I1,I2,d,L){ return fPerLen(I1,I2,d)*L; }
/* 力的方向符号：+1 = 相吸（同号电流），−1 = 相斥（异号电流），0 = 有一根没电流 ⇒ 无力
   ★★ 这里**不要**退回"rev 布尔量 + 幅值"的老写法：方向必须由电流本身的符号决定，
      学生要能直接把滑块拖过零点，看力箭头当场翻向。 */
function sameDir(){ return state.I1*state.I2 > 0; }
function noCurrent(){ return Math.abs(state.I1)<1e-9 || Math.abs(state.I2)<1e-9; }
function forceSign(){ return noCurrent() ? 0 : (sameDir() ? 1 : -1); }
/* 电流方向（0 也当 +1，只是那时不画箭头） */
function curSgn(v){ return v<0 ? -1 : 1; }
/* 世界间距（屏幕上的两根导线离多远） */
function sepW(d){
  const u=(d-D_RANGE[0])/(D_RANGE[1]-D_RANGE[0]);
  return SEP_A + Math.max(0,Math.min(1,u))*(SEP_B-SEP_A);
}
/* 力箭头的画成长度：线性 + 上下限钳制（照 2.1 的 LE 打法），下限以下仍画但最短 */
const F_VIS_REF = 1.2e-3;                 /* N —— 箭头到这个量级就按最长画 */
function fArrowLen(F){
  const u=F/F_VIS_REF;
  return Math.max(0.13, Math.min(0.60, 0.60*u+0.13));
}

/* ============================== ② 磁感应强度 ============================== */
function bLine(I,r){ return MU0*Math.abs(I)/(2*Math.PI*Math.max(1e-4,r)); }
/* 长直导线（沿 +z）在柱坐标点 (ρ, φ, z) 处的 @{B} 单位方向 = φ̂ */
function phiHat(phi){ return pt(-Math.sin(phi), Math.cos(phi), 0); }

/* ============================== ③ 磁通量 ============================== */
/* 面的一组正交基：a 为面内"宽"方向（随 θ 绕 y 轴转），b = ŷ，n = a×b */
function plateBasis(thDeg){
  const t=thDeg*D2R;
  const a=pt(Math.cos(t),0,-Math.sin(t));
  const b=pt(0,1,0);
  return {a:a, b:b, n:vnorm(vcross(a,b)), t:t};
}
/* Φ = B·A·cosθ，返回 Wb */
function fluxWb(BmT,Adm2,thDeg){
  return (BmT*1e-3)*(Adm2*1e-2)*Math.cos(thDeg*D2R);
}
function fluxM(BmT,Adm2,thDeg){ return fluxWb(BmT,Adm2,thDeg)*1e3; }   /* mWb */
function plateHW(Adm2){ return PLATE_HW*Adm2; }                        /* 半宽（世界） */
/* 一行场线的 x 坐标（固定间距 —— 关键：**不随 A 变**） */
function lineXs(){
  const xs=[]; for(let k=-FLUX_NK;k<=FLUX_NK;k++) xs.push(k*FLUX_D);
  return xs;
}
/* 真正穿过面的那几根（严格不等式：θ=90° 时一根都不算，含 x=0 那根）
   ⚠️ 用 < 而不是 <=：θ=90° 时面与 @{B} 平行，x=0 的那根线躺在面内、不算穿过。 */
function piercingXs(thDeg,Adm2){
  const c=Math.abs(Math.cos(thDeg*D2R)), w=plateHW(Adm2);
  return lineXs().filter(x=>Math.abs(x) < w*c - 1e-9);
}
/* 面的四个角（世界坐标） */
function plateCorners(thDeg,Adm2){
  const {a,b}=plateBasis(thDeg), w=plateHW(Adm2), h=PLATE_HH;
  return [ vadd(vmul(a, w),vmul(b, h)), vadd(vmul(a,-w),vmul(b, h)),
           vadd(vmul(a,-w),vmul(b,-h)), vadd(vmul(a, w),vmul(b,-h)) ];
}

/* ============================== ④ 闭合面 ============================== */
const CEN_M = pt(0,-SEP4,0);             /* 磁感线那侧的球心（小电流环所在处） */
const CEN_E = pt(0, SEP4,0);             /* 电力线那侧的球心（+Q 所在处） */
/* 磁偶极子的场线：r = L·sin²θ（解析、**必然闭合**、必过两极）
   ★ 为什么不用 RK4 追真·电流环的场线：解析式的闭合性由构造保证 ——
     本页最要紧的一句话就是"磁感线闭合"，绝不能让"线没接上"的画面来打脸。
   ⚠️ 端点 r→0 会糊成一个点 ⇒ 从 r ≥ DIP_TRIM 起画。 */
function dipolePts(phiDeg,L){
  const phi=phiDeg*D2R, out=[];
  const N=DIP_SEG;
  for(let i=0;i<=N;i++){
    const th=Math.PI*i/N, s=Math.sin(th), r=L*s*s;
    if(r<DIP_TRIM) continue;
    out.push(pt(r*s*Math.cos(phi), r*s*Math.sin(phi), r*Math.cos(th)));
  }
  return out;
}
/* 一条折线穿过球面（球心 c、半径 R）的次数：出 / 进 各算各的 */
function countCross(pts,c,R){
  let out=0, inn=0;
  for(let i=1;i<pts.length;i++){
    const fa=vlen(vsub(pts[i-1],c))-R, fb=vlen(vsub(pts[i],c))-R;
    if(fa<0 && fb>=0) out++;
    else if(fa>=0 && fb<0) inn++;
  }
  return {out:out, inn:inn};
}
/* 电力线的 6 个方向（±x / ±y / ±z）⇒ 6 出 0 进，一眼数得清 */
const ELE_DIRS=[pt(1,0,0),pt(-1,0,0),pt(0,1,0),pt(0,-1,0),pt(0,0,1),pt(0,0,-1)];
function eleLine(c,dir){ return [ vadd(c,vmul(dir,ELE_R0)), vadd(c,vmul(dir,ELE_R1*0.55)),
                                 vadd(c,vmul(dir,ELE_R1*0.82)), vadd(c,vmul(dir,ELE_R1)) ]; }
/* 两侧的穿越统计（honest：由几何真算，不写死 4/4、6/0） */
function crossStats(R){
  let mo=0, mi=0;
  for(let i=0;i<DIP_N;i++){
    /* ⚠️ 偶极子场线是**以原点为中心**生成的，而球心在 CEN_M ⇒ 必须先把线平移到 CEN_M，
       否则拿原点系的线去和偏移了 0.44 的球比，统计出来的根数是错的（曾实测 1/1）。 */
    const cs=countCross(dipolePts(i*90,DIP_L).map(q=>vadd(q,CEN_M)),CEN_M,R); mo+=cs.out; mi+=cs.inn;
  }
  let eo=0, ei=0;
  for(let i=0;i<ELE_N;i++){
    const cs=countCross(eleLine(CEN_E,ELE_DIRS[i]),CEN_E,R); eo+=cs.out; ei+=cs.inn;
  }
  return {mOut:mo, mIn:mi, eOut:eo, eIn:ei,
          mNet:mo-mi, eNet:eo-ei};
}

/* ============================== 小工具 ============================== */
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supStr=n=>String(n).split('').map(c=>SUP[c]||c).join('');
function fmtN(v,d){ d=(d==null)?2:d; if(!isFinite(v)) return '—';
  return (v<0?'−':'')+Math.abs(v).toFixed(d); }
/* 按量级自动选小数位：0.33 / 24.0 / 4021 都好看 */
function fmtSmart(v,unit){
  const a=Math.abs(v);
  const d=a>=1000?0:(a>=100?1:(a>=10?1:2));
  return fmtN(v,d)+' '+unit;
}
