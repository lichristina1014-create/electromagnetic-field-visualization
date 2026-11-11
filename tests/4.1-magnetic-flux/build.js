/* 4.1 页面装配：2.3 的 CSS/骨架/公共引擎 + 4.1 的物理内核 + 页面专属代码
   ★ 与 tests/4.2-magnetization/build.js 同一套打法：
     - 全程带"替换必须唯一命中"的断言（静默失配是这类拼装最大的坑）
     - 引擎段是**绝对行号切片** ⇒ 除 must 清单外再加首尾锚点断言
   ⚠️ 2.3 一旦增删行，切片就会静默切歪 ⇒ build 必须炸，不能产坏页面。 */
const fs=require('fs'), path=require('path');
const P41=__dirname;
const SRC='/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台/2.3-dielectric-polarization.htm';
const OUT=path.join('/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台','4.1-magnetic-flux.htm');

const L=fs.readFileSync(SRC,'utf8').split('\n');
const slice=(a,b)=>L.slice(a-1,b).join('\n');     // 1-indexed 闭区间

/* ---------- 1) 页头 + CSS + body 骨架（2.3 的 1..181 行） ---------- */
let head=slice(1,181);
const reps=[
  ['<title>2.3 静电场中的电介质 · 电磁场可视化平台</title>',
   '<title>4.1 磁感应强度与磁通量 · 电磁场可视化平台</title>'],
  ['<div><h1>2.3 静电场中的电介质</h1><div class="sub">极性 / 非极性分子 · 极化 · 等效极化电荷</div></div>',
   '<div><h1>4.1 磁感应强度与磁通量</h1><div class="sub">安培力 · 磁感应强度 · 磁通量 · 闭合面的磁通量</div></div>'],
  ['<div class="module-title" id="moduleTitle">静电场中的电介质<small id="moduleSub">电偶极子</small></div>',
   '<div class="module-title" id="moduleTitle">磁感应强度与磁通量<small id="moduleSub">两根平行载流导线：同向相吸、反向相斥</small></div>'],
  ['<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">电偶极子的场</div><div class="lg-note" id="lgNote"></div></div>',
   '<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">安培力 · 两根平行导线</div><div class="lg-note" id="lgNote"></div></div>'],
];
for(const [a,b] of reps){
  const n=head.split(a).length-1;
  if(n!==1) throw new Error('❌ 替换未唯一命中（'+n+' 次）: '+a.slice(0,48));
  head=head.replace(a,b);
}
if(head.includes('2.3 静电场中的电介质')) throw new Error('❌ 页头仍有 2.3 残留');
if(/电偶极子/.test(head)) throw new Error('❌ 页头仍有"电偶极子"残留');

/* ---------- 2) 公共引擎段（2.3 的 186..323：向量工具 / 富文本 / 相机图元 / 坐标轴） ----------
   ⚠️ 绝对行号切片 ⇒ 首尾锚点断言：首行必须是"向量工具"注释、末行必须是单独的 }。 */
let engine=slice(186,323);
{
  const eL=engine.split('\n');
  if(!eL[0].includes('向量工具')) throw new Error('❌ 引擎段首行不是"向量工具"注释（2.3 行号已漂移）：'+eL[0].slice(0,70));
  if(eL[eL.length-1].trim()!=='}') throw new Error('❌ 引擎段末行不是单独的 }（2.3 行号已漂移）：'+eL[eL.length-1].slice(0,70));
}
for(const must of ['const pt=(x,y,z)','const vcross=','const D2R=','function parseRich(s)','function richHTML(s)','function richLayout(','function richDraw(','const C = {','let canvas,ctx,W=800,H=600,DPR=1;','const cam={az','function setupCamera()','function pr(p)','let prims=[]','function P_(z,fn)','function line(a,b','function arrow(a,b','function curve(ptsArr','function poly(ptsArr','function marker(p','function text(p,str','function textScreen(','function dimLine(a,b','function screenDot(','function hexA(','const CARD_W=252','const HALF_SCENE=','function drawAxes(ext)','const RICHFONT=']){
  if(!engine.includes(must)) throw new Error('❌ 引擎段缺：'+must);
}

/* ★ 4.1 的取景：④ 两个球并排（球心 y=∓0.44、偶极子口径 0.62）⇒ 水平半宽 ~0.87；
   ③ 的 13 根场线横跨 ±0.94 ⇒ 取 0.90 作折中；cs 分母 3.2 → 3.0（整体略放大）。 */
const engReps=[
  ['let cs=Math.min(W,H)/3.2*cam.zoom;', 'let cs=Math.min(W,H)/3.0*cam.zoom;'],
  ['const HALF_SCENE=0.92;             /* 场景在屏幕水平方向的半宽（世界单位；②③ 实测 0.81，① 取 0.90） */',
   'const HALF_SCENE=0.90;             /* 4.1：④ 两球并排 ~0.87、③ 场线 ±0.94 ⇒ 折中取 0.90 */'],
];
for(const [a,b] of engReps){
  const n=engine.split(a).length-1;
  if(n!==1) throw new Error('❌ 引擎替换未唯一命中（'+n+' 次）: '+a.slice(0,40));
  engine=engine.replace(a,b);
}

/* ---------- 3) 物理内核 + 目录 + 页面专属 ---------- */
const phys=fs.readFileSync(path.join(P41,'phys.js'),'utf8');
const nav =fs.readFileSync(path.join(P41,'nav41.js'),'utf8');
const pg1 =fs.readFileSync(path.join(P41,'page1.js'),'utf8');
const pg2 =fs.readFileSync(path.join(P41,'page2.js'),'utf8');

/* 顺序无关的重复声明自检（同一标识符两次 const/let/function 会直接 SyntaxError）
   ⚠️ 多声明行（const A=1, B=2）里的**第二个**名字行首锚定数不到 ⇒ 故意不列。
     真正的重复 const 会被 node --check 判 SyntaxError，这里只做"nicer 报错"。 */
const all=[engine,phys,nav,pg1,pg2].join('\n');
const dupCheck=['MU0','state','PRESET','clampState','fPerLen','fTotal','forceSign','sepW','fArrowLen',
  'bLine','phiHat','plateBasis','fluxWb','fluxM','plateHW','lineXs','piercingXs','plateCorners',
  'CEN_M','CEN_E','dipolePts','countCross','eleLine','crossStats','supStr','fmtN','fmtSmart',
  'txt','rrPath','crd','infoCard','ringPts3','wireV','curMarks','ringArrows','sphereShell','crossPts',
  'hintLine','bLen','drawAmpereScene','drawFieldScene','drawFluxScene','drawClosedScene','sArrow',
  'drawInsetAmpere','drawInsetCos','buildScene','currentCard','drawOverlays','subNote','panel','h',
  'toastMsg','kchip','chipRow','SHOW_ITEMS','mkRange','btnRow','renderSubSec','SLIDER_FMT','syncSliders',
  'renderSliders','CARDS','renderExplain','renderPanel','placeLegend','updateReadout','updateModeTag',
  'needsRender','draw','tick','updateAll','drag','localPos','panelEl','panelMaxW','setPanelW','rzEnd',
  'CAM41','MT','modeTabs','syncModeTabs','resize','nav','NAV','ZL','WIRE_HEX','CUR_HEX','B_HEX',
  'F_HEX','FL_HEX','PL_HEX','LOOP_HEX','OUT_HEX','IN_HEX','EXT41','SEP_A','WIRE_Z0','FLUX_Z0','ELE_R0',
  'PANEL_W0'];
for(const d of dupCheck){
  const re=new RegExp('(?:^|\\n)(?:const|let|function)\\s+'+d+'\\b','g');
  const n=(all.match(re)||[]).length;
  if(n!==1) throw new Error('❌ 标识符 '+d+' 声明了 '+n+' 次（应恰好 1 次）');
}
/* 反向自检：用到的符号必须真的被定义过（漏一个 ⇒ 运行时 ReferenceError）。
   ⚠️ CARD_X/CARD_Y/CARD_W 在引擎里是**一条多声明 const**（const CARD_W=252, CARD_X=()=>…）
      ⇒ 不能用 "const CARD_X" 这种正则，只能按"在引擎文本中出现过"判。 */
const ENGINE_ONLY=['screenDot','hexA','CARD_X','CARD_Y','CARD_W','camU','vcross','D2R','prims',
  'drawAxes','setupCamera','RICHFONT','richHTML','camScale','camD','camV'];
/* ⚠️ 用"词边界出现"判（不锚行首），这样多声明行里的名字也数得到 */
const wordRe=s=>new RegExp('(?:^|[^A-Za-z0-9_$])'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:[^A-Za-z0-9_$]|$)');
for(const need of ENGINE_ONLY){
  if(!wordRe(need).test(engine)) throw new Error('❌ 引擎段里找不到 '+need);
}
if(!/function P_\(z,fn\)/.test(engine)) throw new Error('❌ 引擎段里找不到 P_ 的定义');

/* 4.1 自己的符号：必须真的在四个源文件里被**声明**过 */
const OWN_CHK=['fTotal','sepW','bLine','plateBasis','fluxM','piercingXs','plateCorners',
  'dipolePts','countCross','eleLine','crossStats','drawAmpereScene','drawFieldScene',
  'drawFluxScene','drawClosedScene','drawInsetAmpere','drawInsetCos','sphereShell','crossPts',
  'buildScene','currentCard','subNote','SHOW_ITEMS','CARDS','CAM41','MT','NAV','SLIDER_FMT',
  'syncSliders','renderSliders','renderPanel','renderExplain','updateReadout','updateModeTag',
  'placeLegend','drawOverlays','hintLine','bLen','sArrow','kchip','chipRow','mkRange','btnRow'];
const ownSrc=phys+'\n'+nav+'\n'+pg1+'\n'+pg2;
for(const need of OWN_CHK){
  if(!new RegExp('(?:^|\\n)\\s*(?:const|let|function)\\s+'+need+'\\b').test(ownSrc))
    throw new Error('❌ 4.1 的源里没定义 '+need);
}

const html = head
  + '\n<script>\n\'use strict\';\n'
  + '\n' + engine + '\n'
  + '\n' + phys + '\n'
  + '\n' + nav + '\n'
  + '\n' + pg1 + '\n'
  + '\n' + pg2 + '\n'
  + '</script>\n</body>\n</html>\n';

fs.writeFileSync(OUT, html);
console.log('✅ 写入', OUT, Buffer.byteLength(html), 'B，', html.split('\n').length, '行');

/* ---------- 4) 抽出内联脚本做语法检查 ---------- */
const m=html.match(/<script>\n([\s\S]*)\n<\/script>/);
if(!m) throw new Error('❌ 没抽到内联脚本');
const tmp=path.join(P41,'_inline.js');   /* 已 gitignore；供 node --check */
fs.writeFileSync(tmp, m[1]);
console.log('✅ 内联脚本', Buffer.byteLength(m[1]), 'B →', tmp);
