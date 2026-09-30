/* 2.4 页面装配：2.3 的 CSS/骨架/公共引擎 + 2.4 的物理内核 + 页面专属代码
   ★ 全程带"替换必须命中"的断言 —— 静默失配是这类拼装最大的坑。
   ⚠️ 源文件与脚本同目录（tests/2.4-gauss/）⇒ 用 __dirname，别写死 /tmp/p24
      （原版写过 /tmp，那是开发时的临时目录，/tmp 一清理就没法重建了）。 */
const fs=require('fs'), path=require('path');
const P24=__dirname;
const SRC='/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台/2.3-dielectric-polarization.html';
const OUT=path.join('/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台','2.4-gauss-law.html');

const L=fs.readFileSync(SRC,'utf8').split('\n');
const slice=(a,b)=>L.slice(a-1,b).join('\n');     // 1-indexed 闭区间

/* ---------- 1) 页头 + CSS + body 骨架（2.3 的 1..181 行） ---------- */
let head=slice(1,181);
const reps=[
  ['<title>2.3 静电场中的电介质 · 电磁场可视化平台</title>',
   '<title>2.4 高斯定理及其应用 · 电磁场可视化平台</title>'],
  ['<div><h1>2.3 静电场中的电介质</h1><div class="sub">极性 / 非极性分子 · 极化 · 等效极化电荷</div></div>',
   '<div><h1>2.4 高斯定理及其应用</h1><div class="sub">电通量 · 球形高斯面 · 穿越球面的场线根数</div></div>'],
  ['<div class="module-title" id="moduleTitle">静电场中的电介质<small id="moduleSub">电偶极子</small></div>',
   '<div class="module-title" id="moduleTitle">高斯定理及其应用<small id="moduleSub">球内电荷与穿出的场线</small></div>'],
  ['<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">电偶极子的场</div><div class="lg-note" id="lgNote"></div></div>',
   '<div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">高斯定理</div><div class="lg-note" id="lgNote"></div></div>'],
  ['/* 2.1 追加：滑块分组标签（1.3 有定义、1.5 漏了，这里补齐） */',
   '/* 滑块分组标签（1.3 定义、1.5 漏过、这里保留） */\n/* 2.4 追加：球面 @{E}·@{n} 采样箭头的图例色 */'],
];
for(const [a,b] of reps){
  const n=head.split(a).length-1;
  if(n!==1) throw new Error('❌ 替换未唯一命中（'+n+' 次）: '+a.slice(0,48));
  head=head.replace(a,b);
}
if(head.includes('2.3 静电场中的电介质')) throw new Error('❌ 页头仍有 2.3 残留');

/* ---------- 2) 公共引擎段（2.3 的 186..323：向量工具 / 富文本 / 相机图元 / 坐标轴） ----------
   ⚠️ 这里是**绝对行号切片**：2.3 一旦增删行，切片就会静默切歪（切到半个函数 ⇒ 语法错或行为诡异）。
   ⇒ 除下面的 `must` 内容自检外，再加"首尾锚点"断言：首行必须是向量工具的注释、末行必须是单独的 }。
   行号漂移时 build 会立刻报错，而不是产出一个坏页面。 */
let engine=slice(186,323);
{
  const eL=engine.split('\n');
  if(!eL[0].includes('向量工具')) throw new Error('❌ 引擎段首行不是"向量工具"注释（2.3 行号已漂移）：'+eL[0].slice(0,70));
  if(eL[eL.length-1].trim()!=='}') throw new Error('❌ 引擎段末行不是单独的 }（2.3 行号已漂移）：'+eL[eL.length-1].slice(0,70));
}
for(const must of ['const pt=(x,y,z)','function parseRich(s)','function richHTML(s)','const cam={az','function setupCamera()','function pr(p)','function P_(z,fn)','function arrow(a,b','function textScreen(','function drawAxes(ext)']){
  if(!engine.includes(must)) throw new Error('❌ 引擎段缺：'+must);
}
/* ⚠️ 2.3 的独立 mkRng/randDir（325~338 行）**故意不要**：phys.js 自带 mkRng，重复声明会 SyntaxError */

/* ★ 2.4 的尺度比 2.3 小得多（电荷在 0.477 m、球面 R ≤ 0.38 m），照搬 2.3 的取景会让球只有 50 px。
   ⇒ 只改两个常数把镜头拉近：cs 的分母 3.2 → 1.7、HUD 安全区用的 HALF_SCENE 0.92 → 0.80。 */
const engReps=[
  ['let cs=Math.min(W,H)/3.2*cam.zoom;', 'let cs=Math.min(W,H)/1.7*cam.zoom;'],
  ['const HALF_SCENE=0.92;             /* 场景在屏幕水平方向的半宽（世界单位；②③ 实测 0.81，① 取 0.90） */',
   'const HALF_SCENE=0.80;             /* 2.4：电荷在 0.477 m、球面 ≤0.38 m ⇒ 场景半宽 ~0.7 m */'],
];
for(const [a,b] of engReps){
  const n=engine.split(a).length-1;
  if(n!==1) throw new Error('❌ 引擎替换未唯一命中（'+n+' 次）: '+a.slice(0,40));
  engine=engine.replace(a,b);
}

/* ---------- 3) 物理内核 + 目录 + 页面专属 ---------- */
const phys=fs.readFileSync(path.join(P24,'phys.js'),'utf8');
const nav =fs.readFileSync(path.join(P24,'nav24.js'),'utf8');
const pg1 =fs.readFileSync(path.join(P24,'page1.js'),'utf8');
const pg2 =fs.readFileSync(path.join(P24,'page2.js'),'utf8');

/* 顺序无关的重复声明自检（同一标识符出现两次 const/let/function 会直接 SyntaxError） */
const all=[engine,phys,nav,pg1,pg2].join('\n');
const dupCheck=['mkRng','rotMatrix','pt','richHTML','parseRich','infoCard','txt','rrPath','crd','buildScene','drawOverlays','panel','drawAxes'];
for(const d of dupCheck){
  const re=new RegExp('(?:^|\\n)(?:const|let|function)\\s+'+d+'\\b','g');
  const n=(all.match(re)||[]).length;
  if(n!==1) throw new Error('❌ 标识符 '+d+' 声明了 '+n+' 次（应恰好 1 次）');
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
const tmp=path.join(P24,'_inline.js');   /* 已 gitignore；供 node --check */
fs.writeFileSync(tmp, m[1]);
console.log('✅ 内联脚本', Buffer.byteLength(m[1]), 'B →', tmp);
