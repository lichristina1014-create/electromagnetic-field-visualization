/* ═════════════════════════════ 状态与派生量 ═════════════════════════════ */
const state = {
  mode: 'mutual',                 /* mutual | edge | rescue */
  gap: 1.0,                       /* 两线间隙（单位 W） */
  tr: 0.1,                        /* 边沿时间 ns */
  L: 10,                          /* 平行长度 cm */
  Vdd: 3.3, Z0: 50, limit: 0.350, /* V / Ω / 噪声容限 V */
  show: { pot: true, field: true, net: true, scope: true },
  cardTab: '1',
  autoRotate: false,
};

/* 动态噪声：i = C_m·dV/dt，注入受害线后向两端分流入地，每端看到 Z₀/2
   ⇒ V_noise = i·Z₀/2（逐字稿原话「注入电流兵分两路，每路各遇约 50Ω」） */
function noiseOf() {
  const Cmu = CmUnit(state.gap);                  /* pF/m */
  const Cmt = Cmu * 1e-12 * (state.L / 100);      /* F */
  const trs = state.tr * 1e-9;
  const i = Cmt * state.Vdd / trs;                /* A */
  const Vn = i * (state.Z0 / 2);                  /* V */
  return { Cmu, Cmt, trs, i, Vn };
}
const vvNow = () => state.Vdd * VvRatio(state.gap);   /* 悬空受害线的静态电位 V */

/* 确定性伪随机（纤维纹理、触点等，保证同一参数每次渲染一致） */
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ═════════════════════════ 写实的 PCB 横截面 ═════════════════════════ */
const BH = PCB_GEO.h, BT = PCB_GEO.t;          /* 走线底面 1.0、铜厚 0.175（物理值，供 FD 用） */
/* ⚠️ 渲染用的「视觉铜厚」比物理值大：真实 PCB 铜厚只有 0.175W，按真实比例画出来是一条
   看不见的细线，学生读不出"铜走线"。教学图把厚度夸大是通行做法，尺寸线仍标注 t。 */
const TV = 0.285;
/* ⚠️ BX0 / BX1（介质板横向范围）由 setupCamera() 随取景一起算，见 app 段① */
const MASK_A = 0.30;                            /* 阻焊层相对透明度 */

function drawBoard() {
  const ySubT = SY(BH), ySubB = SY(BT), yGndB = SY(0);
  const xa = SX(BX0), xb = SX(BX1), wpx = xb - xa;
  /* 回流平面（板底整层铜） */
  P_(Z.gnd, () => {
    const g = ctx.createLinearGradient(0, yGndB, 0, ySubB);
    g.addColorStop(0, '#8B5320'); g.addColorStop(0.55, '#B87333'); g.addColorStop(1, '#DCA467');
    ctx.fillStyle = g; ctx.fillRect(xa, ySubB, wpx, yGndB - ySubB);
    ctx.strokeStyle = 'rgba(120,72,26,.85)'; ctx.lineWidth = 1;
    ctx.strokeRect(xa + .5, ySubB + .5, wpx - 1, yGndB - ySubB - 1);
  });
  /* FR4 介质基板 */
  P_(Z.sub, () => {
    const g = ctx.createLinearGradient(0, ySubT, 0, ySubB);
    g.addColorStop(0, '#E7EFD6'); g.addColorStop(0.42, '#D9E5C0');
    g.addColorStop(1, '#C4D3A4');
    ctx.fillStyle = g; ctx.fillRect(xa, ySubT, wpx, ySubB - ySubT);
    ctx.save(); ctx.beginPath(); ctx.rect(xa, ySubT, wpx, ySubB - ySubT); ctx.clip();
    /* 玻璃纤维纹理：两族斜向短纤维 */
    for (let k = 0; k < 150; k++) {
      const px = xa + rnd(k * 3 + 1) * wpx, py = ySubT + rnd(k * 3 + 2) * (ySubB - ySubT);
      const a = (rnd(k * 3 + 3) - 0.5) * 0.5, len = 10 + rnd(k * 5 + 7) * 16;
      ctx.beginPath(); ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py + 2);
      ctx.lineTo(px + Math.cos(a) * len * 0.7, py + 2 + Math.sin(a) * len * 0.7);
      ctx.strokeStyle = 'rgba(163,182,132,.35)'; ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,170,120,.75)'; ctx.lineWidth = 1;
    ctx.strokeRect(xa + .5, ySubT + .5, wpx - 1, ySubB - ySubT - 1);
  });
}
/* 走线：蚀刻后是**梯形**截面（顶面略窄），加铜的金属渐变与顶面高光 */
function drawTrace(x0, w, strong) {
  const yB = SY(BH), yT = SY(BH + TV);
  const bev = w * 0.075;
  P_(Z.trace, () => {
    const xa = SX(x0), xb = SX(x0 + w);
    const g = ctx.createLinearGradient(0, yT, 0, yB);
    g.addColorStop(0, '#EFC08A'); g.addColorStop(0.30, '#CE8F4A');
    g.addColorStop(0.72, '#A86228'); g.addColorStop(1, '#7E4517');
    ctx.beginPath();
    ctx.moveTo(SX(x0 + bev), yT); ctx.lineTo(SX(x0 + w - bev), yT);
    ctx.lineTo(xb, yB); ctx.lineTo(xa, yB); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(110,62,20,.9)'; ctx.lineWidth = strong ? 1.3 : 1; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(SX(x0 + bev) + .5, yT + 1.3); ctx.lineTo(SX(x0 + w - bev) - .5, yT + 1.3);
    ctx.strokeStyle = 'rgba(255,244,226,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}
/* 阻焊（绿油）：整板覆盖，随走线起伏 ⇒ 画成「基板顶面薄层 + 走线顶面薄层」 */
function drawMask(gap) {
  const mk = 0.034;
  P_(Z.mask, () => {
    ctx.fillStyle = 'rgba(46,139,87,' + MASK_A + ')';
    ctx.fillRect(SX(BX0), SY(BH + mk), SX(BX1) - SX(BX0), SY(BH) - SY(BH + mk));
    for (const a of [0, 1 + gap]) {
      ctx.fillRect(SX(a), SY(BH + TV + mk), SX(a + 1) - SX(a), SY(BH + TV) - SY(BH + TV + mk));
    }
    ctx.strokeStyle = 'rgba(30,105,66,.5)'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(SX(BX0), SY(BH + mk)); ctx.lineTo(SX(BX1), SY(BH + mk));
    ctx.stroke();
  });
}
/* 尺寸标注（★ 距离一律 dimLine） */
function drawDims(gap) {
  const zo = 0.085;
  dimLine(pt(0, 0, BH + TV + zo), pt(1, 0, BH + TV + zo),
          { color: '#8C6A3F', w: 1.2, lsize: 11.5, label: 'W', ldy: -11, z: Z.net });
  dimLine(pt(1, 0, BH + TV + zo), pt(1 + gap, 0, BH + TV + zo),
          { color: C.crimson, w: 1.3, lsize: 11.5, label: gap.toFixed(2) + ' W',
            ldy: -11, z: Z.net });
  dimLine(pt(2 + gap + 0.20, 0, 0), pt(2 + gap + 0.20, 0, BH),
          { color: '#8C6A3F', w: 1.2, lsize: 11.5, label: 'h', ldx: 14, ldy: 3, z: Z.net });
  dimLine(pt(-0.34, 0, 0), pt(-0.34, 0, BT),
          { color: '#8C6A3F', w: 1.2, lsize: 11, label: 't', ldx: -12, ldy: 9, z: Z.net });
}

/* ═════════════════════════ 场：电力线 + 等势线 ═════════════════════════ */
function drawPotential(g, V) {
  if (!state.show.pot) return;
  const lv = [0.08, 0.16, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.92];
  for (let k = 0; k < lv.length; k++) {
    const segs = isoLines(g, V, lv[k]);
    if (!segs.length) continue;
    const t = k / (lv.length - 1);
    const a = 0.30 + 0.24 * Math.sin(Math.PI * (0.2 + 0.6 * t));
    P_(Z.pot + k * 0.01, () => {
      ctx.save();
      ctx.strokeStyle = 'rgba(' + Math.round(28 + 46 * t) + ',' + Math.round(124 + 32 * t)
                      + ',' + Math.round(176 + 22 * t) + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      for (const s of segs) { ctx.moveTo(SX(s[0]), SY(s[1])); ctx.lineTo(SX(s[2]), SY(s[3])); }
      ctx.stroke(); ctx.restore();
    });
  }
}
/* 追一条场线并判定终点落在哪个导体上 */
function traceOne(g, V, sx, sz, gap) {
  const pts = traceFieldLine(g, V, sx, sz, 420);
  if (pts.length < 2) return { pts, kind: 'open' };
  const e = pts[pts.length - 1];
  let kind = 'open';
  if (e.z <= BT + 0.06) kind = 'gnd';
  else if (e.z < BH + 0.50) {
    if (e.x >= 1 + gap - 0.12 && e.x <= 2 + gap + 0.12) kind = 'vic';
    else if (e.x >= -0.12 && e.x <= 1.12) kind = 'drv';
  }
  return { pts, kind };
}
function drawField(g, V, gap) {
  if (!state.show.field) return;
  const off = g.dx * 0.62;
  const seeds = [];
  for (let k = 1; k <= 13; k++) seeds.push([k / 14, BH + TV + off]);       /* 顶面 */
  for (let k = 1; k <= 5; k++) seeds.push([-off, BH + TV * (k / 6)]);      /* 左侧面 */
  for (let k = 1; k <= 5; k++) seeds.push([1 + off, BH + TV * (k / 6)]);   /* 右侧面 */
  for (let k = 1; k <= 5; k++) seeds.push([k / 6, BH - off]);             /* 底面朝着回流平面 */
  const toVic = [], toGnd = [], other = [];
  for (const s of seeds) {
    const r = traceOne(g, V, s[0], s[1], gap);
    if (r.pts.length < 5) continue;
    (r.kind === 'vic' ? toVic : r.kind === 'gnd' ? toGnd : other).push(r.pts);
  }
  const stroke = (paths, col, w, alpha) => {
    if (!paths.length) return;
    P_(Z.field, () => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.lineCap = 'round'; ctx.beginPath();
      for (const p of paths) {
        ctx.moveTo(SX(p[0].x), SY(p[0].z));
        for (let i = 1; i < p.length; i++) ctx.lineTo(SX(p[i].x), SY(p[i].z));
      }
      ctx.stroke(); ctx.restore();
    });
  };
  stroke(other, '#C44232', 1.1, 0.38);
  stroke(toGnd, '#C44232', 1.25, 0.60);
  /* ★ 漏到受害线的那一簇场线 = 互容的直接证据：间隙拉大，它肉眼可见地变稀 */
  stroke(toVic, '#7048C8', 1.95, 0.92);
  const arrow = (paths, col, al) => {
    for (const p of paths) {
      const n = p.length; if (n < 12) continue;
      const k = Math.max(5, Math.floor(n * 0.40));
      const A = pr(p[k]), B = pr(p[k + 1]);
      const L = Math.hypot(B.x - A.x, B.y - A.y);
      if (L < 1.2) continue;
      const ang = Math.atan2(B.y - A.y, B.x - A.x), hs = 7.0;
      P_(Z.field + 0.02, () => {
        ctx.save(); ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(B.x, B.y);
        ctx.lineTo(B.x - hs * Math.cos(ang - .42), B.y - hs * Math.sin(ang - .42));
        ctx.lineTo(B.x - hs * Math.cos(ang + .42), B.y - hs * Math.sin(ang + .42));
        ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
      });
    }
  };
  arrow(toGnd, '#C44232', 0.68);
  arrow(toVic, '#7048C8', 0.95);
  FAR.nToVic = toVic.length;
}

/* ═════════════════════════ 画布上的叠加小图 ═════════════════════════ */
/* 电容网络（右下角） */
function drawNet(gap) {
  if (!state.show.net) return;
  /* ⚠️ 三张叠加卡排成**底部一行**（左统计 / 中示波器 / 右网络）。顶部整块留给电力线，
     否则取景一放大，右上角的示波器就会压住「受害线」走线标签。 */
  const W2 = 212, H2 = 126, x0 = W - W2 - 14, y0 = H - H2 - 14;
  P_(Z.ui, () => {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.strokeStyle = '#DCE6EB'; ctx.lineWidth = 1;
    roundRect(x0, y0, W2, H2, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#22414F'; ctx.font = '600 11px "PingFang SC",sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('等效电容网络', x0 + 11, y0 + 17);
    const yA = y0 + 38, yB = y0 + 88;
    const xD = x0 + 44, xV = x0 + 156;
    /* 两条竖直支路 */
    ctx.strokeStyle = '#8CA0AC'; ctx.lineWidth = 1.4;
    for (const xx of [xD, xV]) {
      ctx.beginPath(); ctx.moveTo(xx, yA + 6); ctx.lineTo(xx, yA + 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xx, yA + 34); ctx.lineTo(xx, yB); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xx - 11, yA + 22); ctx.lineTo(xx + 11, yA + 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xx - 11, yA + 30); ctx.lineTo(xx + 11, yA + 30); ctx.stroke();
    }
    /* 互容支路 */
    const yM = yA + 6;
    ctx.beginPath(); ctx.moveTo(xD, yM); ctx.lineTo(xD + 20, yM); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xV - 20, yM); ctx.lineTo(xV, yM); ctx.stroke();
    ctx.strokeStyle = C.crimson; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo((xD + xV) / 2 - 9, yM - 8); ctx.lineTo((xD + xV) / 2 + 9, yM - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((xD + xV) / 2 - 9, yM + 8); ctx.lineTo((xD + xV) / 2 + 9, yM + 8); ctx.stroke();
    ctx.strokeStyle = '#8CA0AC'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(xD + 20, yM); ctx.lineTo((xD + xV) / 2 - 9, yM); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((xD + xV) / 2 + 9, yM); ctx.lineTo(xV - 20, yM); ctx.stroke();
    /* 接地轨 */
    const yG = y0 + 100;
    ctx.beginPath(); ctx.moveTo(xD, yB); ctx.lineTo(xD, yG); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xV, yB); ctx.lineTo(xV, yG); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xD - 12, yG); ctx.lineTo(xV + 12, yG); ctx.stroke();
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(xD + (xV - xD) / 2 - 9 + k * 9, yG);
      ctx.lineTo(xD + (xV - xD) / 2 - 13 + k * 9, yG + 5); ctx.stroke();
    }
    /* 文字 */
    ctx.font = '11px "PingFang SC",sans-serif';
    ctx.fillStyle = C.teal; ctx.fillText('驱动线', xD - 17, y0 + 30);
    ctx.fillStyle = C.blue; ctx.fillText('受害线', xV - 17, y0 + 30);
    ctx.fillStyle = C.crimson; ctx.font = '600 11.5px "PingFang SC",sans-serif';
    ctx.fillText('C_m', (xD + xV) / 2 - 11, yM - 13);
    ctx.font = '11px "PingFang SC",sans-serif'; ctx.fillStyle = '#5F7482';
    ctx.fillText('C₁', xD - 20, yA + 30); ctx.fillText('C₂', xV + 15, yA + 30);
    ctx.fillStyle = '#7A8F9B'; ctx.font = '10.5px "PingFang SC",sans-serif';
    /* ⚠️ 必须居中画在接地轨正下方：靠 xV+20 起画会顶出画布右边缘（实测 r=W+27，末几字被裁） */
    ctx.textAlign = 'center';
    ctx.fillText('回流平面 (GND)', (xD + xV) / 2, yG + 17);
    ctx.restore();
  });
}
/* 底部中间：时域波形（驱动沿 + 受害线噪声 + 噪声容限） */
function drawScope() {
  if (!state.show.scope) return;
  const nz = noiseOf();
  const W2 = 240, H2 = 126, x0 = Math.round((W - W2) / 2), y0 = H - H2 - 14;
  const padL = 42, padR = 12, padT = 24, padB = 20;
  const gx0 = x0 + padL, gx1 = x0 + W2 - padR, gy0 = y0 + padT, gy1 = y0 + H2 - padB;
  const span = Math.max(1.6, state.tr * 12);           /* 显示的 ns 跨度 */
  /* ⚠️ 纵轴必须"容得下容限线 + 噪声峰 + 读数标签"。老写法 vMax=min(Vdd*1.06, Vn*2.6)：
     gap 一拉大 Vn 变小 ⇒ vMax 被压到 0.45 ⇒ 3.3 V 驱动沿被画到 ~600px 之外，
     一条长竖线直接飞出卡片（颜色 #B9C9D2，实测抓到）。驱动沿改走独立归一化。 */
  const vMax = Math.max(0.45, state.limit * 1.55, nz.Vn * 1.45);
  const tx = t => gx0 + (t / span) * (gx1 - gx0);
  const vy = v => gy1 - (v / vMax) * (gy1 - gy0);
  const vyD = v => gy1 - (v / state.Vdd) * (gy1 - gy0 - 8);   /* 驱动沿：只讲边沿快慢 */
  P_(Z.ui + 1, () => {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.strokeStyle = '#DCE6EB'; ctx.lineWidth = 1;
    roundRect(x0, y0, W2, H2, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#22414F'; ctx.font = '600 11px "PingFang SC",sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('受害线噪声 · 灰 = 驱动沿 3.3 V', x0 + 11, y0 + 16);
    /* 网格 */
    ctx.strokeStyle = '#EFF4F7'; ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const yy = gy0 + (gy1 - gy0) * k / 4;
      ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx1, yy); ctx.stroke();
    }
    /* 容限线 */
    const yLim = vy(state.limit);
    ctx.setLineDash([4, 3]); ctx.strokeStyle = C.crimson; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(gx0, yLim); ctx.lineTo(gx1, yLim); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.crimson; ctx.font = '10px "PingFang SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((state.limit * 1e3).toFixed(0) + ' mV', gx0 - 4, yLim + 3.4);
    ctx.textAlign = 'left';
    /* ★ 波形一律裁在绘图区内：任何越界都必须在框内被切掉，不能飞出去 */
    ctx.save();
    ctx.beginPath(); ctx.rect(gx0, gy0, gx1 - gx0, gy1 - gy0); ctx.clip();
    /* 驱动沿（灰，独立归一化 ⇒ 永远画在框内） */
    const t0 = span * 0.14, trs = state.tr;
    ctx.strokeStyle = '#B9C9D2'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx0, vyD(0));
    ctx.lineTo(tx(t0), vyD(0));
    ctx.lineTo(tx(t0 + trs), vyD(state.Vdd));
    ctx.lineTo(gx1, vyD(state.Vdd));
    ctx.stroke();
    /* 受害线噪声：耦合尖峰（上升随 t_r，随后指数衰减） */
    const yN = vy(nz.Vn);
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx0, vy(0));
    for (let k = 0; k <= 120; k++) {
      const t = gx0 + (gx1 - gx0) * k / 120;
      const tt = (t - gx0) / (gx1 - gx0) * span;
      let v = 0;
      if (tt > t0) {
        const dt = tt - t0;
        v = dt < trs ? nz.Vn * (dt / trs) : nz.Vn * Math.exp(-(dt - trs) / Math.max(span * 0.20, trs * 2.2));
      }
      ctx.lineTo(t, vy(v));
    }
    ctx.stroke();
    ctx.fillStyle = C.blue; ctx.font = '600 11px "PingFang SC",sans-serif';
    ctx.fillText((nz.Vn * 1e3).toFixed(0) + ' mV', tx(t0 + trs) + 5, yN - 4);
    ctx.restore();
    ctx.restore();
  });
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* 左下角：耦合场线统计（与画布上那簇紫色曲线直接呼应） */
function drawStats() {
  if (W < 700) return;                    /* 画布太窄时让位给示波器与网络卡 */
  const W2 = 190, H2 = 126, x0 = 14, y0 = H - H2 - 14;
  P_(Z.ui + 1, () => {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.strokeStyle = '#DCE6EB'; ctx.lineWidth = 1;
    roundRect(x0, y0, W2, H2, 9); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#22414F'; ctx.font = '600 11px "PingFang SC",sans-serif';
    ctx.fillText('漏到受害线的场线', x0 + 12, y0 + 19);
    ctx.strokeStyle = '#7048C8'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0 + 13, y0 + 46); ctx.lineTo(x0 + 40, y0 + 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + 33, y0 + 42); ctx.lineTo(x0 + 40, y0 + 46);
    ctx.lineTo(x0 + 33, y0 + 50); ctx.stroke();
    ctx.fillStyle = '#7048C8'; ctx.font = '700 16px Menlo,monospace';
    ctx.fillText(String(FAR.nToVic), x0 + 48, y0 + 52);
    ctx.fillStyle = '#7A8F9B'; ctx.font = '10.5px "PingFang SC",sans-serif';
    ctx.fillText('间隙拉大 ⇒ 这一簇变稀', x0 + 12, y0 + 84);
    ctx.fillStyle = '#9AAAB4'; ctx.font = '10.5px "PingFang SC",sans-serif';
    ctx.fillText('紫色 = 漏到受害线的场', x0 + 12, y0 + 104);
    ctx.restore();
  });
}

/* ═════════════════════════════ 场景装配 ═════════════════════════════ */
let FAR = { V: null, g: null, VA: null, VB: null, gap: -1, sweeps: 0, nToVic: 0 };

function buildScene() {
  prims = [];                                     /* ★ 首句必须清空 */
  const gap = state.gap;
  const g = FAR.g;
  if (!g) return;

  drawBoard();
  if (g) {
    /* 走线（铜）→ 阻焊 → 场 → 标注 */
    drawTrace(0, 1, true);
    drawTrace(1 + gap, 1, false);
    if (state.show.mask !== false) drawMask(gap);
    if (FAR.V) {
      drawPotential(g, FAR.V);
      drawField(g, FAR.V, gap);
    }
  }
  /* 走线标签 */
  text(pt(0.5, -2, BH + TV + 0.62), '驱动线', { color: C.crimson, size: 12, bold: true, align: 'center' });
  text(pt(1.5 + gap, -2, BH + TV + 0.62), '受害线', { color: C.blue, size: 12, bold: true, align: 'center' });
  drawDims(gap);

  /* 受害线静电位（页签 ①/③ 的重点读数）：marker 落在走线顶面，读数抬到走线名之下 */
  const vv = vvNow();
  marker(pt(1.5 + gap, -3, BH + TV + 0.05), { color: C.blue, r: 4, z: Z.net });
  text(pt(1.5 + gap, -3, BH + TV + 0.30), vv.toFixed(2) + ' V',
       { color: C.blue, size: 13, bold: true, align: 'center', z: Z.net + 1 });

  /* 介质界面注记（贴着左边写，避免被右边缘裁掉） */
  text(pt(-VIEW.padL + 0.22, -2, BT + 0.26), '回流平面', { color: '#8B5320', size: 11, align: 'left', alpha: .95 });
  text(pt(-VIEW.padL + 0.22, -2, (BT + BH) / 2), 'FR4  ε_r = 4.3', { color: '#7E8E5A', size: 11, align: 'left', alpha: .95 });

  if (state.show.net) drawNet(gap);
  if (state.show.scope) drawScope();
  drawStats();
}
function drawOverlays() {
  const pt2 = document.getElementById('panTag');
  if (pt2) pt2.classList.toggle('show', Math.abs(cam.px) > 2 || Math.abs(cam.py) > 2);
}
