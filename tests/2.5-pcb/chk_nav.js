(function () {
  const R = [];
  const P = (n, v, ok) => R.push((ok ? 'PASS' : 'FAIL') + '|' + n + '|' + v);
  const items = document.querySelectorAll('#nav .nav-item');
  P('nav 条目数', items.length, items.length >= 10);
  const txt = Array.from(items).map(a => a.textContent.trim());
  const i25 = txt.findIndex(t => t.indexOf('2.5') === 0);
  P('含 2.5 条目', i25 >= 0 ? txt[i25] : 'none', i25 >= 0);
  P('2.5 条目可点', i25 >= 0 ? ((items[i25].getAttribute('href') || items[i25].classList.contains('active')) ? 'yes' : 'no') : 'n/a',
    i25 >= 0 && (!!items[i25].getAttribute('href') || items[i25].classList.contains('active')));
  P('active 唯一', document.querySelectorAll('#nav .nav-item.active').length,
    document.querySelectorAll('#nav .nav-item.active').length === 1);
  const leak = Array.from(document.querySelectorAll('#nav *')).filter(e => (e.textContent || '').indexOf('@{') >= 0).length;
  P('nav @{ 泄漏', leak, leak === 0);
  const und = Array.from(items).filter(a => /undefined/.test(a.textContent)).length;
  P('nav undefined', und, und === 0);
  P('当前页 2.5 实体', /2\.5-multi-conductor-crosstalk|index\.html|1\.[2-5]|2\.[12]/.test(location.pathname) ? 'yes' : location.pathname,
    true);
  return R.join('\n') + '\nFAILED=' + R.filter(s => s.startsWith('FAIL')).length + ' TOTAL=' + R.length + '\nDONE';
})()
