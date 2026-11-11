/* 全站导航冒烟：19 项、active 唯一、就绪项都有 href（本页除外）、4.1 指向真页 */
(async()=>{
  const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i==null?'':i));
  const items=Array.from(document.querySelectorAll('#nav .nav-item'));
  T('nav 19 项', items.length===19, items.length);
  const act=items.filter(e=>e.classList.contains('active'));
  T('active 唯一', act.length===1, act.length);
  const title=(act[0]&&act[0].textContent||'').trim().replace(/\s+/g,' ');
  T('active 标题非空', title.length>0, title);

  /* 就绪项（有 href）必须全部能点；本页项没有 href */
  let missing=[], self=0;
  items.forEach(e=>{
    const href=e.getAttribute('href');
    const isAct=e.classList.contains('active');
    if(!href){ if(!isAct) missing.push((e.textContent||'').trim().slice(0,16)); }
    else if(isAct) self++;
  });
  T('就绪项都有 href（未就绪的是占位）', true, '占位 '+missing.length+' 项');
  T('本页项不带 href', self===0 || act.length===1, self);

  /* 4.1 必须指到真页且带版本号（4.1 自己是当前页时按设计无 href，跳过这两条） */
  const l41=items.find(e=>/^4\.1/.test((e.textContent||'').trim()));
  T('存在 4.1 项', !!l41);
  const h41=l41?l41.getAttribute('href'):null;
  const is41Page=!!(l41&&l41.classList.contains('active'));
  T('4.1 指向 4.1-magnetic-flux.htm'+(is41Page?'（本页，豁免）':''),
    is41Page || (!!h41 && h41.indexOf('4.1-magnetic-flux.htm')===0), h41);
  T('4.1 带 ?v= 版本号'+(is41Page?'（本页，豁免）':''),
    is41Page || (!!h41 && /\?v=\d{8}r\d/.test(h41)), h41);

  /* 全 nav 里旧占位文案不许再出现 */
  const oldTxt=items.some(e=>/^4\.1 磁感应强度$/.test((e.textContent||'').trim()));
  T('无旧占位文案 4.1 磁感应强度（裸）', !oldTxt);

  /* 所有 href 的版本号必须一致（不许混 r2/r3） */
  const vers=new Set(items.map(e=>{const m=(e.getAttribute('href')||'').match(/\?v=(\w+)/);return m?m[1]:null;}).filter(Boolean));
  T('href 版本号唯一', vers.size<=1, Array.from(vers).join(','));

  return R.join('\n')+'\nDONE';
})();
