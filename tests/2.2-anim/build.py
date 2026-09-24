#!/usr/bin/env python3
# 2.2 装配：外壳 / 引擎段整段复用 2.1（保证视觉与手感完全同源），主体另写。
import io, os, sys

BASE = '/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台'
HERE = os.path.dirname(os.path.abspath(__file__))   # tests/2.2-anim（源文件与脚本同目录）
SRC  = os.path.join(BASE, '2.1-field-charge-density.html')
OUT  = os.path.join(BASE, '2.2-conductor-electrostatic.html')

L = open(SRC, encoding='utf-8').read().split('\n')
def seg(a, b):            # 1-based inclusive
    return '\n'.join(L[a-1:b])

head = seg(1, 140)        # <!DOCTYPE .. </head>
body = seg(141, 171)      # <body> .. <div id="toast">
eng  = seg(202, 411)      # 向量工具 .. shellBall（全通用，无 2.1 物理）

parts = [open(os.path.join(HERE, f), encoding='utf-8').read()
         for f in ('new_a.js', 'new_b.js', 'new_c.js')]

REP_HEAD = [
    ('2.1 电场强度与电荷密度', '2.2 静电场中的导体'),
]
REP_BODY = [
    ('2.1 电场强度与电荷密度', '2.2 静电场中的导体'),
    ('场强的定义 · 点电荷的场 · 电荷密度（体 / 面 / 线）',
     '静电平衡 · 导体内部与表面的场 · 等位体 · 静电屏蔽'),
    ('E = lim(q_t→0) F/q_t', 'E 内 ≡ 0　·　E ⊥ 表面　·　导体是等位体'),
    ('>电场强度与电荷密度<small id="moduleSub">场强的定义</small>',
     '>静电场中的导体<small id="moduleSub">静电平衡</small>'),
]

for a, b in REP_HEAD:
    if a not in head: sys.exit('head 未命中: ' + a)
    head = head.replace(a, b)
for a, b in REP_BODY:
    if a not in body: sys.exit('body 未命中: ' + a)
    body = body.replace(a, b)

out = ('\n'.join([head, body, '<script>', "'use strict';"]) + '\n'
       + eng + '\n' + '\n'.join(parts)
       + '\n</script>\n</body>\n</html>\n')

open(OUT, 'w', encoding='utf-8').write(out)
print('OK  lines=%d  bytes=%d' % (len(out.split('\n')), len(out.encode('utf-8'))))
