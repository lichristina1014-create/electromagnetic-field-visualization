/* 5.6 页面装配：2.3 的 CSS/骨架/公共引擎 + 5.6 的物理内核 + 页面专属代码
   ★ 与 tests/5.8-wave-lab/build.js 同一套打法。 */
const fs=require('fs'), path=require('path');
const P56=__dirname;
const SRC='/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台/2.3-dielectric-polarization.htm';
const OUT=path.join('/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台','5.6-poynting-vector.htm');

const L=fs.readFileSync(SRC,'utf8').split('\n');
const slice=(a,b)=>L.slice(a-1,b).join('\n');

let head=slice(1,181);
const reps=[
  ['<title>2.3 静电场中的电介质 · 电磁场可视化平台</title>',
   '<title>5.6 电磁能量如何传播 · 电磁场可视化平台</title>'],
  ['<div><h1>2.3 静电场中的电介质</h1><div class="sub">极性 / 非极性分子 · 极化 · 等效极化电荷</div></div>',
   '<div><h1>5.6 电磁能量如何传播</h1><div class="sub">坡印廷矢量 · 坡印廷定理 · 能量收支</div></div>'],
  ['<div class="module-title" id="moduleTitle">静电场中的电介质<small id="moduleSub">电偶极子</small></div>',
   '<div class="module-title" id="moduleTitle">电磁能量如何传播<small id="moduleSub">坡印廷矢量与坡印廷定理</small></div>'],
  ['<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">电偶极子的场</div><div class="lg-note" id="lgNote"></div></div>',
   '<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">能流穿过体积 V</div><div class="lg-note" id="lgNote"></div></div>'],
];
for(const [a,b] of reps){
  const n=head.split(a).length-1;
  if(n!==1) throw new Error('❌ 替换未唯一命中（'+n+' 次）: '+a.slice(0,48));
  head=head.replace(a,b);
}
if(/电偶极子/.test(head)) throw new Error('❌ 页头仍有"电偶极子"残留');

let engine=slice(186,323);
{
  const eL=engine.split('\n');
  if(!eL[0].includes('向量工具')) throw new Error('❌ 引擎段首行漂移：'+eL[0].slice(0,70));
  if(eL[eL.length-1].trim()!=='}') throw new Error('❌ 引擎段末行漂移：'+eL[eL.length-1].slice(0,70));
}
for(const must of ['const pt=(x,y,z)','const vcross=','const D2R=','function parseRich(s)','function richHTML(s)','function richLayout(','function richDraw(','const C = {','let canvas,ctx,W=800,H=600,DPR=1;','const cam={az','function setupCamera()','function pr(p)','let prims=[]','function P_(z,fn)','function line(a,b','function arrow(a,b','function curve(ptsArr','function poly(ptsArr','function marker(p','function text(p,str','function textScreen(','function dimLine(a,b','function screenDot(','function hexA(','const CARD_W=252','const HALF_SCENE=','function drawAxes(ext)']){
  if(!engine.includes(must)) throw new Error('❌ 引擎段缺：'+must);
}

/* ★ 5.6 的场景与 5.8 同族：波列半宽 0.55 + 能量条 ⇒ 0.62 */
const engReps=[
  ['let cs=Math.min(W,H)/3.2*cam.zoom;', 'let cs=Math.min(W,H)/2.4*cam.zoom;'],
  ['const HALF_SCENE=0.92;             /* 场景在屏幕水平方向的半宽（世界单位；②③ 实测 0.81，① 取 0.90） */',
   'const HALF_SCENE=0.62;             /* 5.6：波列半宽 0.55 + 标注留白 ⇒ 0.62 */'],
];
for(const [a,b] of engReps){
  const n=engine.split(a).length-1;
  if(n!==1) throw new Error('❌ 引擎替换未唯一命中（'+n+' 次）: '+a.slice(0,40));
  engine=engine.replace(a,b);
}

const phys=fs.readFileSync(path.join(P56,'phys.js'),'utf8');
const nav =fs.readFileSync(path.join(P56,'nav56.js'),'utf8');
const pg1 =fs.readFileSync(path.join(P56,'page1.js'),'utf8');
const pg2 =fs.readFileSync(path.join(P56,'page2.js'),'utf8');

const all=[engine,phys,nav,pg1,pg2].join('\n');
const dupCheck=['pt','richHTML','parseRich','infoCard','txt','rrPath','crd','buildScene','drawOverlays','panel','state','clampState','fieldE','fieldH','energyBooks','poyntingResidual'];
for(const d of dupCheck){
  const re=new RegExp('(?:^|\\n)(?:const|let|function)\\s+'+d+'\\b','g');
  const n=(all.match(re)||[]).length;
  if(n!==1) throw new Error('❌ 标识符 '+d+' 声明了 '+n+' 次（应恰好 1 次）');
}
const ENGINE_ONLY=['screenDot','hexA','CARD_X','CARD_Y','CARD_W','camU','vcross','D2R','prims','drawAxes','setupCamera','vdot','vmul','vadd'];
const OWN=['clampState','fieldE','fieldH','energyBooks','poyntingResidual','playPause'];
const wordRe=s=>new RegExp('(?:^|[^A-Za-z0-9_$])'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:[^A-Za-z0-9_$]|$)');
for(const need of ENGINE_ONLY){
  if(!wordRe(need).test(engine)) throw new Error('❌ 引擎段里找不到 '+need);
}
for(const need of OWN){
  if(!new RegExp('(?:^|\\n)\\s*(?:const|let|function)\\s+'+need+'\\b').test(phys+'\n'+nav+'\n'+pg1+'\n'+pg2))
    throw new Error('❌ 5.6 的源里没定义 '+need);
}
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

const m=html.match(/<script>\n([\s\S]*)\n<\/script>/);
if(!m) throw new Error('❌ 没抽到内联脚本');
const tmp=path.join(P56,'_inline.js');
fs.writeFileSync(tmp, m[1]);
console.log('✅ 内联脚本', Buffer.byteLength(m[1]), 'B →', tmp);
