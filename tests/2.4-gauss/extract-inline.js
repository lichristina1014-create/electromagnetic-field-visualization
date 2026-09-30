/* 从产物 html 抽出内联脚本，供 node --check 做语法检查。
   ⚠️ 这一步是"生成物坏了但构建脚本还在报 OK"的唯一防线（2.2 的历史事故就靠它抓的）。 */
const fs = require('fs');
const B = '/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台';
const files = [
  ['2.2', B + '/2.2-conductor-electrostatic.html'],
  ['2.4', B + '/2.4-gauss-law.html'],
  ['2.5', B + '/2.5-multi-conductor-crosstalk.html'],
];
let bad = 0;
for (const [n, f] of files) {
  const s = fs.readFileSync(f, 'utf8');
  const i = s.lastIndexOf('<script>'), j = s.lastIndexOf('</script>');
  if (i < 0 || j < 0 || j < i) { console.error('❌ ' + n + '：没找到内联脚本'); bad++; continue; }
  const js = s.slice(i + '<script>'.length, j);
  fs.writeFileSync('/tmp/p24/_chk_' + n + '.js', js);
  /* 顺带检查：脚本里不该有孤立的 ]; （2.2 行号错位事故的典型症状） */
  const orphan = js.split('\n').filter(l => l.trim() === '];').length;
  /* 不该有 2.4 占位符 / 旧版本号 */
  const stale = (js.includes('20260929r20') ? 1 : 0) + (js.includes("{ t:'2.4 高斯定理及其应用' }") ? 1 : 0);
  console.log(`${n}  脚本 ${String(js.length).padStart(6)} B　孤立]; ${orphan}　陈旧串 ${stale}`);
  if (stale) { console.error('❌ ' + n + '：脚本里仍有旧版本号或 2.4 占位符'); bad++; }
}
process.exit(bad ? 1 : 0);
