const M = require('./fd4.js');
console.log('板宽 12.4W、固定域、周期侧边界 —— 网格收敛性（gap=1W / 3W）');
console.log(' nx    dx      导体格数  Cm(1W)     Cv(1W)    Vv(1W)   Cm(3W)    耗時');
for (const nx of [176, 240, 280, 336, 400, 480]) {
  const g = M.pcbGrid(Object.assign({}, M.PCB_GEO, { nx }));
  const t0 = Date.now();
  const a = M.pcbCaps(g, 1.0, null, 1e-8);
  const b = M.pcbCaps(g, 3.0, { VA: a.VA, VB: a.VB }, 1e-8);
  console.log('%s %s %s %s %s %s %s  %dms',
    String(nx).padStart(4), g.dx.toFixed(5), (1/g.dx).toFixed(1).padStart(6),
    a.Cm.toFixed(4).padStart(9), a.Cv.toFixed(4).padStart(9), a.Vv.toFixed(4).padStart(8),
    b.Cm.toFixed(4).padStart(9), Date.now() - t0);
}
