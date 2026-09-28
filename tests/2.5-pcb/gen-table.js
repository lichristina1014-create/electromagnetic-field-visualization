const M = require('./fd4.js');
const g = M.pcbGrid(Object.assign({}, M.PCB_GEO, { nx: 400 }));
let cache = null;
const G = [], CM = [], CV = [];
const t0 = Date.now();
for (let k = 0; k <= 76; k++) {
  const gap = +(0.2 + k * 0.05).toFixed(2);
  const r = M.pcbCaps(g, gap, cache, 1e-8);
  cache = { VA: r.VA, VB: r.VB };
  G.push(gap); CM.push(+r.Cm.toFixed(6)); CV.push(+r.Cv.toFixed(6));
  if (k % 10 === 0) process.stderr.write('.');
}
process.stderr.write('\n');
const L = [];
L.push('// 2D 拉普拉斯 FD（nx=400，周期侧边界，均匀介质简化），' + G.length + ' 点，' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
L.push('const GAP_TAB=[' + G.join(',') + '];');
L.push('const CM_GEO_TAB=[' + CM.join(',') + '];');
L.push('const CV_GEO_TAB=[' + CV.join(',') + '];');
require('fs').writeFileSync(__dirname + '/tab.js', L.join('\n') + '\n');
const mx = Math.max.apply(null, CV.slice(1).map((v, i) => Math.abs(v - CV[i])));
console.log('Cv 最大相邻跳变 %s ｜ Cm 最大相邻跳变 %s', mx.toFixed(5),
  Math.max.apply(null, CM.slice(1).map((v, i) => Math.abs(v - CM[i]))).toFixed(5));
console.log('Vv(0.5W)=%s  Vv(1W)=%s  Vv(3W)=%s  Vv(4W)=%s',
  (CM[6]/CV[6]).toFixed(4), (CM[16]/CV[16]).toFixed(4), (CM[56]/CV[56]).toFixed(4), (CM[76]/CV[76]).toFixed(4));
console.log('Cm(1W)=%s pF/m   Cv(1W)=%s pF/m', (CM[16]*M.EPS0*1e12).toFixed(3), (CV[16]*M.EPS0*1e12).toFixed(3));
