/* 3.2 页面装配：2.3 的 CSS/骨架/公共引擎 + 3.2 的物理内核 + 页面专属代码
   ★ 与 tests/3.1-current-density/build.js 同一套打法（注释见 3.1）：
     - 源文件与脚本同目录 ⇒ 用 __dirname
     - 全程带"替换必须唯一命中"的断言（静默失配是这类拼装最大的坑）
     - 引擎段是**绝对行号切片** ⇒ 除 must 清单外再加首尾锚点断言
   ⚠️ 2.3 一旦增删行，切片就会静默切歪 ⇒ build 必须炸，不能产坏页面。 */
const fs=require('fs'), path=require('path');
const P32=__dirname;
const SRC='/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台/2.3-dielectric-polarization.htm';
const OUT=path.join('/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台','3.2-constant-field.htm');

const L=fs.readFileSync(SRC,'utf8').split('\n');
const slice=(a,b)=>L.slice(a-1,b).join('\n');     // 1-indexed 闭区间

/* ---------- 1) 页头 + CSS + body 骨架（2.3 的 1..181 行） ---------- */
let head=slice(1,181);
const reps=[
  ['<title>2.3 静电场中的电介质 · 电磁场可视化平台</title>',
   '<title>3.2 恒定电场的特点 · 电磁场可视化平台</title>'],
  ['<div><h1>2.3 静电场中的电介质</h1><div class="sub">极性 / 非极性分子 · 极化 · 等效极化电荷</div></div>',
   '<div><h1>3.2 恒定电场的特点</h1><div class="sub">局外力 · 局外场强 · 电流连续性 · 环量特性</div></div>'],
  ['<div class="module-title" id="moduleTitle">静电场中的电介质<small id="moduleSub">电偶极子</small></div>',
   '<div class="module-title" id="moduleTitle">恒定电场的特点<small id="moduleSub">局外场强把电荷搬回正极</small></div>'],
  ['<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">电偶极子的场</div><div class="lg-note" id="lgNote"></div></div>',
   '<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">恒定电场</div><div class="lg-note" id="lgNote"></div></div>'],
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
for(const must of ['const pt=(x,y,z)','const vcross=','const D2R=','function parseRich(s)','function richHTML(s)','function richLayout(','function richDraw(','const C = {','let canvas,ctx,W=800,H=600,DPR=1;','const cam={az','function setupCamera()','function pr(p)','let prims=[]','function P_(z,fn)','function line(a,b','function arrow(a,b','function curve(ptsArr','function poly(ptsArr','function marker(p','function text(p,str','function textScreen(','function dimLine(a,b','function screenDot(','function hexA(','const CARD_W=252','const HALF_SCENE=','function drawAxes(ext)']){
  if(!engine.includes(must)) throw new Error('❌ 引擎段缺：'+must);
}

/* ★ 3.2 的场景是 0.72×0.50 的平面回路（半宽 ~0.42 加标注留白 ⇒ 0.50）。
   cs 分母 3.2 → 2.2（平面电路图要占满画布才读得清）。 */
const engReps=[
  ['let cs=Math.min(W,H)/3.2*cam.zoom;', 'let cs=Math.min(W,H)/2.2*cam.zoom;'],
  ['const HALF_SCENE=0.92;             /* 场景在屏幕水平方向的半宽（世界单位；②③ 实测 0.81，① 取 0.90） */',
   'const HALF_SCENE=0.50;             /* 3.2：平面回路半宽 0.36 + 极板/标注留白 ⇒ 0.50 */'],
];
for(const [a,b] of engReps){
  const n=engine.split(a).length-1;
  if(n!==1) throw new Error('❌ 引擎替换未唯一命中（'+n+' 次）: '+a.slice(0,40));
  engine=engine.replace(a,b);
}

/* ---------- 3) 物理内核 + 目录 + 页面专属 ---------- */
const phys=fs.readFileSync(path.join(P32,'phys.js'),'utf8');
const nav =fs.readFileSync(path.join(P32,'nav32.js'),'utf8');
const pg1 =fs.readFileSync(path.join(P32,'page1.js'),'utf8');
const pg2 =fs.readFileSync(path.join(P32,'page2.js'),'utf8');

/* 顺序无关的重复声明自检（同一标识符两次 const/let/function 会直接 SyntaxError）
   ⚠️ 行首锚定：一条多声明 const（如 const EMF_RANGE=…, RES_RANGE=…）不在行首，
      放松锚定会误抓引擎内的函数局部 const（2.5 踩过）⇒ RANGE 系列不进清单。 */
const all=[engine,phys,nav,pg1,pg2].join('\n');
const dupCheck=['mkRng','pt','richHTML','parseRich','infoCard','txt','rrPath','crd','buildScene','drawOverlays','panel','drawAxes','state','PRESET','clampState','loopPt','Efield','EeVal','intE','pathPt'];
for(const d of dupCheck){
  const re=new RegExp('(?:^|\\n)(?:const|let|function)\\s+'+d+'\\b','g');
  const n=(all.match(re)||[]).length;
  if(n!==1) throw new Error('❌ 标识符 '+d+' 声明了 '+n+' 次（应恰好 1 次）');
}
/* 反向自检：3.2 用到的符号必须真的被定义过。
   ⚠️ CARD_X/CARD_Y/CARD_W 在引擎里是**一条多声明 const** ⇒ 只能按"在引擎文本中出现过"判。 */
const ENGINE_ONLY=['screenDot','hexA','CARD_X','CARD_Y','CARD_W','camU','vcross','D2R','prims','drawAxes','setupCamera','vdot','vmul','vadd'];
const OWN=['mkRng','loopPt','loopTan','Efield','EeVal','intE','intEe','pathPt','carrierAt','clampState','playT','playS','stopAnim'];
const wordRe=s=>new RegExp('(?:^|[^A-Za-z0-9_$])'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:[^A-Za-z0-9_$]|$)');
for(const need of ENGINE_ONLY){
  if(!wordRe(need).test(engine)) throw new Error('❌ 引擎段里找不到 '+need);
}
for(const need of OWN){
  if(!new RegExp('(?:^|\\n)\\s*(?:const|let|function)\\s+'+need+'\\b').test(phys+'\n'+nav+'\n'+pg1+'\n'+pg2))
    throw new Error('❌ 3.2 的源里没定义 '+need);
}
/* P_ 是单字符函数名，单独按定义形式查 */
if(!/function P_\(z,fn\)/.test(engine)) throw new Error('❌ 引擎段里找不到 P_ 的定义');

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
const tmp=path.join(P32,'_inline.js');   /* 已 gitignore；供 node --check */
fs.writeFileSync(tmp, m[1]);
console.log('✅ 内联脚本', Buffer.byteLength(m[1]), 'B →', tmp);
