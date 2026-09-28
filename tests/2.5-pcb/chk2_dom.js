(function () {
  const R = [];
  const P = (n, v, ok) => R.push((ok ? 'PASS' : 'FAIL') + '|' + n + '|' + v);

  /* ── ① 页签 ── */
  const tabs = document.querySelectorAll('#modeTabs button');
  P('#modeTabs 按钮数', tabs.length, tabs.length === 3);
  P('#modeTabs .on 数', document.querySelectorAll('#modeTabs button.on').length,
    document.querySelectorAll('#modeTabs button.on').length === 1);
  P('#modeTabs 当前高亮', (document.querySelector('#modeTabs button.on') || {}).dataset ? document.querySelector('#modeTabs button.on').dataset.k : 'none',
    !!document.querySelector('#modeTabs button.on') && document.querySelector('#modeTabs button.on').dataset.k === 'mutual');

  /* ── ② 读数条 ── */
  const chips = document.querySelectorAll('#coordStrip .coord-chip');
  P('#coordStrip chip 数', chips.length, chips.length === 9);
  P('#coordStrip 无空 chip', Array.from(chips).filter(c => !c.textContent.trim()).length,
    Array.from(chips).every(c => c.textContent.trim().length > 2));

  /* ── ③ 面板（页签①：1 个滑块） ── */
  const rng = document.querySelectorAll('#panel input[type=range]');
  P('页签① 滑块数', rng.length, rng.length === 1);
  P('sliders 数组长度', sliders.length, sliders.length === 1);
  P('#panel 有教学内容', document.querySelectorAll('#panel .ex-body').length > 0,
    document.querySelectorAll('#panel .ex-body').length > 0);
  P('#liveRead 有内容', (document.getElementById('liveRead') || {}).textContent ? 1 : 0,
    !!document.getElementById('liveRead') && document.getElementById('liveRead').textContent.length > 10);

  /* ── ④ 页签② ── */
  state.mode = 'edge'; state.cardTab = '1'; syncModeTabs(); renderPanel(); updateAll();
  P('页签② 滑块数', document.querySelectorAll('#panel input[type=range]').length,
    document.querySelectorAll('#panel input[type=range]').length === 1);
  P('页签② .on 数', document.querySelectorAll('#modeTabs button.on').length,
    document.querySelectorAll('#modeTabs button.on').length === 1 && document.querySelector('#modeTabs button.on').dataset.k === 'edge');

  /* ── ⑤ 页签③ ── */
  state.mode = 'rescue'; state.cardTab = '1'; syncModeTabs(); renderPanel(); updateAll();
  P('页签③ 滑块数', document.querySelectorAll('#panel input[type=range]').length,
    document.querySelectorAll('#panel input[type=range]').length === 3);
  P('页签③ 一键试招按钮', document.querySelectorAll('#panel .sub-chips').length,
    document.querySelectorAll('#panel .sub-chips').length >= 1);
  P('页签③ 活路表存在', !!document.querySelector('#trailTable table.trail'),
    !!document.querySelector('#trailTable table.trail'));
  P('活路表行数', document.querySelectorAll('#trailTable table.trail tr').length,
    document.querySelectorAll('#trailTable table.trail tr').length === 4);

  /* ── ⑥ @{} 富文本泄漏全量扫查 ── */
  const sel = '.frm,.ex-body,.ex-note,.card-body,.panel,.coord-strip,.slider-group-label,#modeTag,#legend,#panel label,#panel .sec-title,#panel .val,#modeTabs button';
  const nodes = document.querySelectorAll(sel);
  const leak = [];
  nodes.forEach(el => { const t = el.innerText || el.textContent || ''; if (t.indexOf('@{') >= 0) leak.push((el.className || el.id || el.tagName) + ':' + t.slice(0, 40)); });
  P('扫查节点数', nodes.length, nodes.length >= 10);
  P('@{ 泄漏数', leak.length, leak.length === 0);
  if (leak.length) R.push('INFO|泄漏清单|' + leak.slice(0, 6).join(' ; '));

  /* ── ⑦ 无 undefined 字面 ── */
  const und = [];
  nodes.forEach(el => { const t = el.innerText || el.textContent || ''; if (/\bundefined\b/.test(t)) und.push((el.className || el.id) + ':' + t.slice(0, 40)); });
  P('undefined 字面数', und.length, und.length === 0);
  if (und.length) R.push('INFO|undefined清单|' + und.slice(0, 6).join(' ; '));

  /* ── ⑧ .chip 文本无 undefined ── */
  const ch = Array.from(document.querySelectorAll('#panel .chip'));
  P('#panel .chip 数', ch.length, ch.length > 0);
  P('.chip 文本异常数', ch.filter(c => /undefined/.test(c.textContent)).length,
    ch.every(c => !/undefined/.test(c.textContent)));

  /* ── ⑨ toast / 折叠按钮存在 ── */
  P('toast 节点', !!document.getElementById('toast'), !!document.getElementById('toast'));
  P('三个视图按钮', ['btnReset', 'btnRotate', 'btnPanReset'].every(id => !!document.getElementById(id)),
    ['btnReset', 'btnRotate', 'btnPanReset'].every(id => !!document.getElementById(id)));

  /* 复位到页签①，供后续脚本 */
  state.mode = 'mutual'; state.cardTab = '1'; syncModeTabs(); renderPanel(); updateAll();

  return R.join('\n') + '\nFAILED=' + R.filter(s => s.startsWith('FAIL')).length + ' TOTAL=' + R.length + '\nDONE';
})()
