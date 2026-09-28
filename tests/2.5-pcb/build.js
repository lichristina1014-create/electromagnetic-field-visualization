'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   2.5 页面装配（非直接编辑 2.5-multi-conductor-crosstalk.html）
     - 从 2.2 提取 <style> 与引擎段（向量 / 富文本 / 颜色 / 相机 / 图元）
     - 注入 FD 查找表（tab.js）与三段页面源（app1/2/3.js）
     - 产出 ../2.5-multi-conductor-crosstalk.html
   ⚠️ 改完 app*.js / tab.js 必须重跑本脚本，否则页面不会变。
   ⚠️ 提取用的是**行号切片**：2.2 的 <style> 与引擎段一旦被编辑，行号会漂移 ⇒
      下面两个断言（必须含"向量工具"、必须含"function hexA"）就是防线。
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const SRC = __dirname;                                   /* tests/2.5-pcb */
const P = require('path').resolve(SRC, '..', '..') + '/';  /* 电磁场可视化平台/ */
const OUT = P + '2.5-multi-conductor-crosstalk.html';

const src = fs.readFileSync(P + '2.2-conductor-electrostatic.html', 'utf8').split('\n');
const style = src.slice(6, 138).join('\n');       /* 行 7..138（<style> 起，不含 </style>） */
const engine = src.slice(174, 269).join('\n');    /* 行 175..269（向量/富文本/颜色/相机/图元） */
if (!/向量工具/.test(engine) || !/function hexA/.test(engine)) throw new Error('引擎段提取越界');

const EXTRA_CSS = [
  '/* ── 2.5 追加：读数行 / 结论条 / 活路表 ── */',
  '.kv{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:#5F7482;padding:5px 0;border-bottom:1px dashed #EBF1F4;}',
  '.kv:last-child{border-bottom:none;}',
  '.kv b{color:#1F3D4C;font-family:Menlo,monospace;font-weight:600;font-size:13px;}',
  '.verdict{margin-top:9px;border-radius:8px;padding:8px 11px;font-size:12.5px;line-height:1.55;font-weight:600;}',
  '.verdict.bad{background:#FDECEA;border:1px solid #F2C3BC;color:#A8392A;}',
  '.verdict.ok{background:#EAF5EC;border:1px solid #C2E0C8;color:#2F7A3E;}',
  'table.trail{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px;}',
  'table.trail th{background:#F3F8FA;color:#5F7482;font-weight:600;text-align:left;padding:6px 8px;border-bottom:1px solid #E2ECF1;font-size:11.5px;}',
  'table.trail td{padding:6px 8px;border-bottom:1px solid #F0F5F8;color:#3A5462;}',
  'table.trail td.dim{color:#93A8B4;}',
  'table.trail td.me{font-family:Menlo,monospace;font-weight:600;color:#156082;}',
  '#coordStrip .coord-chip{flex-shrink:0;}',
].join('\n');

/* 查找表：先改名再连线（app1.js 里留的是 __GAP_TAB__ 之类的占位符） */
const tabLines = fs.readFileSync(SRC + '/tab.js', 'utf8')
  .replace('const CM_GEO_TAB=', 'const CMT=')
  .replace('const CV_GEO_TAB=', 'const CVT=')
  .split('\n').filter(l => l.startsWith('const '));
const getLine = pfx => { const l = tabLines.find(s => s.startsWith(pfx)); if (!l) throw new Error('缺表 ' + pfx); return l; };

const a1 = fs.readFileSync(SRC + '/app1.js', 'utf8')
  .replace('__GAP_TAB__', getLine('const GAP_TAB='))
  .replace('__CM_TAB__', getLine('const CMT='))
  .replace('__CV_TAB__', getLine('const CVT='));
const a2 = fs.readFileSync(SRC + '/app2.js', 'utf8');
const a3 = fs.readFileSync(SRC + '/app3.js', 'utf8');

const js = [engine, a1, a2, a3].join('\n\n');
fs.writeFileSync(SRC + '/bundle.js', js);          /* 供 node --check */

const html = [
  '<!DOCTYPE html>', '<html lang="zh-CN">', '<head>', '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<title>2.5 多导体系统的电容与串扰 · 电磁场可视化平台</title>',
  style, EXTRA_CSS, '</style>', '</head>', '<body>',
  '<header>',
  '  <a class="logo" href="index.html" title="返回平台首页">E&M</a>',
  '  <div><h1>2.5 多导体系统的电容与串扰</h1><div class="sub">互容 C_m · 3W 规则 · 边沿决定串扰 · i = C·du/dt</div></div>',
  '  <div class="view-toggles" id="viewToggles"><button id="tglNav" title="折叠 / 展开左侧目录（快捷键 [ ）">☰ 目录</button><button id="tglPanel" title="折叠 / 展开右侧控制面板（快捷键 ] ）">☰ 面板</button></div>',
  '  <div class="badge"><div class="chip">《工程电磁场》 ×《电磁场与电磁波》</div><div class="owner"><b>© 2026 Li Chenlu</b> All Rights Reserved</div></div>',
  '</header>',
  '<div class="layout">',
  '  <aside id="nav"></aside>',
  '  <main>',
  '    <div class="module-head">',
  '      <div class="module-title" id="moduleTitle">多导体系统的电容与串扰<small id="moduleSub">PCB 上的「隐形电容」</small></div>',
  '      <div class="seg" id="modeTabs"></div>',
  '    </div>',
  '    <div class="content-row">',
  '      <div class="canvas-card">',
  '        <canvas id="cv"></canvas>',
  '        <div class="cv-mode-tag" id="modeTag"></div>',
  '        <div class="cv-pan-tag" id="panTag"><span>画面已平移</span><button id="btnPanReset">回到原点</button></div>',
  '        <div class="cv-toolbar"><button id="btnReset">复位视角</button><button id="btnRotate">自动平移</button></div>',
  '        <div class="cv-legend" id="legend"><div class="lg-t" id="lgTitle">互容 C_m</div><div class="lg-note" id="lgNote">受害线悬空 · 净电荷为零</div></div>',
  '        <button class="fold-handle" id="foldNav" title="折叠 / 展开左侧目录">‹</button>',
  '        <button class="fold-handle" id="foldPanel" title="折叠 / 展开右侧面板">›</button>',
  '        <div class="coord-strip" id="coordStrip"></div>',
  '      </div>',
  '      <div class="panel" id="panel"></div>',
  '    </div>',
  '  </main>',
  '</div>',
  '<div id="toast"></div>',
  '<script>',
  "'use strict';",
  js,
  '</script>',
  '</body>', '</html>', '',
].join('\n');

fs.writeFileSync(OUT, html);
const b = fs.statSync(OUT).size;
console.log('OK  %s  bytes=%d  lines=%d', OUT.replace(P, ''), b, html.split('\n').length);
console.log('   表 %d 点：gap %s .. %s', getLine('const GAP_TAB=').split(',').length, '', '');
