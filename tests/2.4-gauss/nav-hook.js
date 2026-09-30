/* 把 2.4 从占位符挂成活链接，并把全站 ?v= 统一 bump 到 20260930r1。
   ⚠️ 2.2 / 2.5 是**生成物**：必须改它们的源（new_a.js / app1.js）再重跑 build，
      绝不能只改产物 —— 否则下次重跑就把这条导航静默抹掉。
   ⚠️ 每条替换都断言命中次数；静默失配是这类批处理最大的坑。 */
const fs = require('fs');
const B = '/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台';
const OLD_V = '20260929r20', NEW_V = '20260930r1';
const PLACE = "{ t:'2.4 高斯定理及其应用' },";
const LIVE  = "{ id:'ch2-4', t:'2.4 高斯定理及其应用', ready:true, href:'2.4-gauss-law.html?v=" + NEW_V + "' },";

/* 直接编辑的页面 + 生成物的源文件 */
const FILES = [
  ['index.html',                       B + '/index.html'],
  ['1.2-vector-algebra.html',          B + '/1.2-vector-algebra.html'],
  ['1.3-directional-derivative.html',  B + '/1.3-directional-derivative.html'],
  ['1.4-divergence-flux.html',         B + '/1.4-divergence-flux.html'],
  ['1.5-curl-circulation.html',        B + '/1.5-curl-circulation.html'],
  ['2.1-field-charge-density.html',    B + '/2.1-field-charge-density.html'],
  ['2.3-dielectric-polarization.html', B + '/2.3-dielectric-polarization.html'],
  ['2.2源 new_a.js',                    B + '/tests/2.2-anim/new_a.js'],
  ['2.5源 app1.js',                     B + '/tests/2.5-pcb/app1.js'],
];
/* 2.4 自己已经是活链接（active），只参与版本号检查 */
const SELF = B + '/2.4-gauss-law.html';

let bad = 0;
for (const [name, f] of FILES) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  const nPlace = s.split(PLACE).length - 1;
  if (nPlace !== 1) { console.error(`❌ ${name}: 2.4 占位符命中 ${nPlace} 次（应为 1）`); bad++; continue; }
  s = s.replace(PLACE, LIVE);

  const nV = s.split(OLD_V).length - 1;
  if (nV < 1) { console.error(`❌ ${name}: 旧版本号命中 ${nV} 次`); bad++; continue; }
  s = s.split(OLD_V).join(NEW_V);

  if (s === before) { console.error(`❌ ${name}: 内容没变`); bad++; continue; }
  fs.writeFileSync(f, s);
  console.log(`✅ ${name.padEnd(34)} 2.4 项 ×1　? v= 替换 ${nV} 处`);
}

/* 复查：全站不该再有旧版本号或占位符 */
const dir = fs.readdirSync(B).filter(x => x.endsWith('.html'));
let left = [];
for (const f of [...dir.map(x => B + '/' + x), FILES[7][1], FILES[8][1]]) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(OLD_V)) left.push(f.split('/').pop() + ' 仍有旧版本号');
  if (s.includes(PLACE)) left.push(f.split('/').pop() + ' 仍有 2.4 占位符');
  if (s.includes('?v=' + NEW_V) === false && f !== SELF) {
    /* 只作提示：有些页面可能没有 nav 之外的 ?v= */
  }
}
if (left.length) { console.error('❌ 复查不通过：\n  ' + left.join('\n  ')); bad++; }
else console.log('✅ 全站复查：无旧版本号、无 2.4 占位符');

const self = fs.readFileSync(SELF, 'utf8');
console.log('ℹ️  2.4 自身：' + (self.includes("id:'ch2-4'") ? '已挂活链接' : '缺 ch2-4')
  + '，?v= 引用 ' + (self.split('?v=' + NEW_V).length - 1) + ' 处');
process.exit(bad ? 1 : 0);
