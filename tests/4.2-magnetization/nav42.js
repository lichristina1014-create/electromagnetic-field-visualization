/* ============================== 目录 ============================== */
/* ⚠️ 2026-10-19：按用户给的新大纲改版 ——
      第 3 章 = 恒定电场：3.1 电流的分类（已上线）+ 3.2 恒定电场的特点（占位）
      第 4 章 = 恒定磁场：4.1 磁感应强度（占位）+ 4.2 磁介质的磁化（本页）
   旧占位「3.2 比奥-萨伐尔 / 3.3 安培环路 / 第4章 时变电磁场（麦克斯韦方程组、均匀平面波）」
   被新大纲取代，暂从导航移除（比奥-萨伐尔、安培环路可作将来 4.3 / 4.4 补回）。 */
const NAV = [
  { ch:'第 1 章 · 矢量分析', items:[
    { id:'coord',  t:'1.1 三种常见坐标系', ready:true, href:'index.html?v=20261020r4' },
    { id:'ch1-2',  t:'1.2 矢量的代数运算', ready:true, href:'1.2-vector-algebra.htm?v=20261020r4' },
    { id:'ch1-3',  t:'1.3 方向导数与梯度', ready:true, href:'1.3-directional-derivative.htm?v=20261020r4' },
    { id:'ch1-4',  t:'1.4 通量与散度',     ready:true, href:'1.4-divergence-flux.htm?v=20261020r4' },
    { id:'ch1-5',  t:'1.5 环量与旋度',     ready:true, href:'1.5-curl-circulation.htm?v=20261020r4' },
  ]},
  { ch:'第 2 章 · 静电场', items:[
    { id:'ch2-1', t:'2.1 电场强度与电荷密度', ready:true, href:'2.1-field-charge-density.htm?v=20261020r4' },
    { id:'ch2-2', t:'2.2 静电场中的导体',     ready:true, href:'2.2-conductor-electrostatic.htm?v=20261020r4' },
    { id:'ch2-3', t:'2.3 静电场中的电介质',   ready:true, href:'2.3-dielectric-polarization.htm?v=20261020r4' },
    { id:'ch2-4', t:'2.4 高斯定理及其应用', ready:true, href:'2.4-gauss-law.htm?v=20261020r4' },
    { id:'ch2-5', t:'2.5 多导体系统的电容与串扰', ready:true, href:'2.5-multi-conductor-crosstalk.htm?v=20261020r4' },
  ]},
  { ch:'第 3 章 · 恒定电场', items:[
    { id:'ch3-1', t:'3.1 电流的分类', ready:true, href:'3.1-current-density.htm?v=20261020r4' },
    { id:'ch3-2', t:'3.2 恒定电场的特点', ready:true, href:'3.2-constant-field.htm?v=20261020r4' },
  ]},
  { ch:'第 4 章 · 恒定磁场', items:[
    { id:'ch4-1', t:'4.1 磁感应强度' },
    { id:'ch4-2', t:'4.2 磁介质的磁化', ready:true, active:true },
  ]},
];
