(async()=>{
const R=[]; const T=(n,c,i)=>R.push((c?'PASS':'FAIL')+'|'+n+'|'+(i??''));
/* ═══════════ 专测 2026-09-28 删掉的「外加匀强场 E₀」滑块 ═══════════
   用户反馈：拖它"对整个导体的变化看起来影响不大"。
   根因：本页所有场量 E / V / σ 都 ∝ E₀，而 E 箭头的显示比例
        eLen = mag/(2E₀) 又把 E₀ 归一化掉了 ⇒ 拖它画面几乎不动（空转控件）。
   判据分三层 —— ① 控件真的没了 ② 死代码真的清了 ③ 概念真的没丢。 */

const tabOf=k=>Array.from(document.querySelectorAll('#modeTabs button')).find(b=>b.dataset.k===k);
const rangeIds=()=>Array.from(document.querySelectorAll('#panel input[type=range]')).map(e=>e.id).sort();

/* ── ① 控件没了：两个页签分别点数滑块 ───────────────────────────── */
const rep={};
for(const k of ['build','shield']){
  const tb=tabOf(k); if(tb) tb.click();
  rep[k]=rangeIds();
}
T('① build 面板只剩 t 滑块（s_E0 已删）', rep.build.join(',')==='s_t',
  '得='+rep.build.join(',')+' 期望=s_t');
T('③ shield 面板只剩 q 滑块', rep.shield.join(',')==='s_qc', '得='+rep.shield.join(','));
T('#s_E0 在文档里彻底不存在',
  document.getElementById('s_E0')===null && document.querySelectorAll('#s_E0').length===0);
/* ★ 2026-09-28 追加：原来 ② 探针页的 r/θ 两个滑块也必须一起消失 */
T('「② 静电平衡的四个结论」页签已删除（只剩 2 个页签、没有 k=concl）',
  document.querySelectorAll('#modeTabs button').length===2 && tabOf('concl')===undefined,
  '页签数='+document.querySelectorAll('#modeTabs button').length
  +' k='+Array.from(document.querySelectorAll('#modeTabs button')).map(b=>b.dataset.k).join(','));
T('r/θ 两个滑块（s_rp / s_thp）已从文档里消失',
  document.getElementById('s_rp')===null && document.getElementById('s_thp')===null);
T('面板里不再有「把 P 送到关键位置」/「沿半径扫」/「沿表面扫」',
  !/把 P 送到关键位置|沿半径扫|沿表面扫|探针 P 的位置/.test(document.getElementById('panel').innerText));

/* ── ①b 面板里不再有「外加匀强场」这一节标题 ─────────────────────── */
let nTitle=0, hits=[];
for(const k of ['build','shield']){
  const tb=tabOf(k); if(tb) tb.click();
  const ts=Array.from(document.querySelectorAll('#panel .sec-title'));
  nTitle+=ts.length;
  ts.forEach(t=>{ const s=t.innerText.trim(); if(/外加匀强场|外加场\s*E/.test(s)) hits.push(k+':'+s); });
}
T('面板已无「外加匀强场」标题（共扫到 '+nTitle+' 个 sec-title）',
  nTitle>=2 && hits.length===0, 'nTitle='+nTitle+' 命中=['+hits.join(' | ')+']');

/* ── ② 死代码清干净 ───────────────────────────────────────────── */
T('E0_RANGE 常量已删除', typeof E0_RANGE==='undefined', typeof E0_RANGE);
T('SLIDER_FMT.E0 已删除', typeof SLIDER_FMT.E0==='undefined', String(SLIDER_FMT.E0));
/* ★ 2026-09-28：② 探针页删干净以后，这些符号也必须全部不存在。
   ⚠️ 判据必须用**裸 `typeof 名字`**：`typeof` 对"不存在的标识符"返回 'undefined' 而**不抛错**，
   而且它同时能看见 `const/let` 声明（全局词法环境）与 `function` 声明（window 属性）。
   写成 `typeof window[name]` 就错了 —— `const` 声明**不会**挂到 window 上，
   那样这条断言即使符号还活着也会通过（空转）。 */
const gone=n=>{ try{ return eval('typeof '+n)==='undefined'; }catch(e){ return 'ERR:'+e.message; } };
const G1=['probeInfo','probeNote','zoneWord','probeJac','overProbe','snapRp','clampRp','clampThp','probeP'];
T('探针相关符号全部消失（'+G1.join('/')+'）', G1.every(gone), G1.map(n=>n+'='+gone(n)).join(' '));
const G2=['RP_RANGE','TH_LIM','SWEEP_SPEED','P_HIT'];
T('② 独占常量全部消失（'+G2.join('/')+'）', G2.every(gone), G2.map(n=>n+'='+gone(n)).join(' '));
const G3=['sceneConcl','drawEqui','drawProbe','chartVz','equiCurve','equiR','fieldAt','evec'];
T('② 独占的绘制/曲线全部消失（'+G3.join('/')+'）', G3.every(gone), G3.map(n=>n+'='+gone(n)).join(' '));
/* ⚠️ 反向对照：**不能**把该留的也删了 —— volt / fieldE / fieldT / eLen 是解析解本体与 t1a 的闸门 */
const K=['volt','fieldE','fieldT','eLen','sigma','drawInner','drawSurfaceCharge'];
T('解析解本体仍在（'+K.join('/')+'）', K.every(n=>!gone(n)), K.map(n=>n+'='+gone(n)).join(' '));
T('state 里 rp / thp / sweep 三个字段也不存在了',
  state.rp===undefined && state.thp===undefined && state.sweep===undefined,
  'rp='+state.rp+' thp='+state.thp+' sweep='+state.sweep);
T('state.show 里 equi / dec / vz 三个开关也不存在了',
  state.show.equi===undefined && state.show.dec===undefined && state.show.vz===undefined,
  Object.keys(state.show).join(','));
T('syncSliders() 不再引用 s_E0 / probeNote（不抛错即可）', (()=>{ try{ syncSliders(); return true; }
  catch(e){ return 'ERR:'+e.message; } })()===true);
T('两个页签 renderPanel() 都不抛错', (()=>{
  try{ for(const k of ['build','shield']){ const tb=tabOf(k); if(tb) tb.click(); renderPanel(); }
       return true; } catch(e){ return 'ERR:'+e.message; } })()===true);

/* ── ②b 讲解卡里不再有"去拖那个滑块"的死指引 ──────────────────── */
/* ⚠️ renderExplain 只渲染**当前**那张卡（state.cardTab）⇒ 必须逐张切过去再扫，
   否则第 3 张卡的文案根本不在 DOM 里，断言会拿"没扫到"当"没问题"（空转通过）。 */
{ const tb=tabOf('build'); if(tb) tb.click(); }
state.mode='build';
let cardTxt='', nCard=0;
for(const k of ['1','2','3']){
  state.cardTab=k; renderPanel();
  const els=Array.from(document.querySelectorAll('#explainSec .card-body,#explainSec .ex-note'));
  nCard+=els.length;
  cardTxt+=els.map(e=>e.innerText).join('\n')+'\n';
}
T('讲解卡扫查到了内容（防空转）', nCard>=3 && cardTxt.length>200,
  'nCard='+nCard+' len='+cardTxt.length);
T('讲解卡无"把 E₀ 拉/调"类死指引', !/拉到最小|E₀ 调大|把 E₀ 拖|拖动 E₀/.test(cardTxt),
  (/拉到最小|E₀ 调大|把 E₀ 拖|拖动 E₀/.exec(cardTxt)||['(无)'])[0]);
T('「撤掉外场」改由 ▶ 播放全过程 承载',
  /播放全过程/.test(cardTxt) && /阶段①|还没有外场|没有外场/.test(cardTxt));
state.cardTab='1';

/* ── ③ 概念没丢：外场幅值仍在读数条里报出来 ─────────────────────── */
state.mode='build'; renderPanel(); updateAll();
const stripB=document.getElementById('coordStrip').innerText.replace(/\n/g,' ');
T('① 读数条仍报「外加场 E₀ = 10.0 kV/m」',
  /E₀/.test(stripB) && /10\.0\s*kV\/m/.test(stripB), 'strip='+stripB.slice(0,140));
{ const tb=tabOf('shield'); if(tb) tb.click(); }
state.mode='shield'; renderPanel(); updateAll();
const fullS=document.getElementById('coordStrip').innerText.replace(/\n/g,' ');
T('③ 读数条仍报外场值', /10\.0\s*kV\/m/.test(fullS), 'strip='+fullS.slice(0,140));

/* ── ③b 外场"从无到有"仍由 g 驱动（那是动画，不是滑块） ────────── */
const oa=window.arrow; let A=[];
window.arrow=function(a,b,o={}){ A.push({a,b,o}); return oa(a,b,o); };
const hintN=()=>A.filter(x=>String(x.o.color||'').toLowerCase()==='#9db3bf').length;
state.mode='build'; state.t=0; state.show.lines=true;
A=[]; stopAnim(); state.g=0; prims=[]; buildScene(); const n0=hintN();
A=[]; stopAnim(); state.g=1; prims=[]; buildScene(); const n1=hintN();
window.arrow=oa;
T('g=0（阶段① 无外场）背景外场箭头一条都不画', n0===0, 'n='+n0);
T('g=1（外场已建立）画满 8 条背景外场箭头', n1===8, 'n='+n1);
T('⇒ 外场"从无到有"靠 g 驱动、与已删的滑块无关', n0===0&&n1===8, n0+' → '+n1);

/* ── ③c E₀ 固定值与箭头比例自洽 ─────────────────────────────── */
T('state.E0 固定为 10 kV/m', state.E0===10, 'E0='+state.E0);
T('|E|=E₀ 的典型场点箭头长度合理（0.40~0.55 m）', (()=>{
  const L=eLen(10,state.E0); return L>0.40&&L<0.55; })(), 'L='+eLen(10,state.E0).toFixed(3)+' m');

/* ── ④ 状态还原 ────────────────────────────────────────────── */
{ const tb=tabOf('build'); if(tb) tb.click(); }
state.mode='build'; stopAnim(); state.g=1; state.t=1; state.qc=0;
renderPanel(); updateAll();
T('状态已还原到默认', state.g===1&&state.t===1&&state.E0===10);
return R.join('\n')+'\nDONE';
})();
