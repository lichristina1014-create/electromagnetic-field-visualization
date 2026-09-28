#!/usr/bin/env python3
# 2.2 装配：外壳 / 引擎段整段复用 2.1（保证视觉与手感完全同源），主体另写。
#
# ⚠️⚠️ 2026-09-28 重要修复：原来这里用**绝对行号** seg(1,140) / seg(141,171) / seg(202,411)。
#   后来 2.1 的 nav 加进了 2.2 / 2.5 两条目录项（+2 行），行号就**静默错位**了：
#     · seg(202,411) 的**起点**落进 NAV 数组尾部 ⇒ 产物脚本第一句是孤立的 `];`（语法错误）
#     · **终点**又少吃掉 shellBall 的收尾 `}`（新行号是 412）⇒ 函数没闭合
#   两个错误叠加起来，页面会整片失效，而 build.py 却开开心心打印 "OK"。
#   ⇒ 教训：**生成器的切片范围绝不能钉绝对行号**，必须锚在内容上；
#     并且每条锚点都要断言，锚点没命中就 sys.exit，绝不静默产出半个文件。
#     诊断手法：`node --check` 提取出的内联脚本（这一步能直接抓住 `];`）。
import os, sys

BASE = '/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台'
HERE = os.path.dirname(os.path.abspath(__file__))   # tests/2.2-anim（源文件与脚本同目录）
SRC  = os.path.join(BASE, '2.1-field-charge-density.html')
OUT  = os.path.join(BASE, '2.2-conductor-electrostatic.html')

L = open(SRC, encoding='utf-8').read().split('\n')

def find(pred, what, start=0):
    for i in range(start, len(L)):
        if pred(L[i]):
            return i
    sys.exit('❌ 锚点未命中: ' + what)

def seg(a, b):            # 0-based, inclusive
    return '\n'.join(L[a:b+1])

def chk(ok, msg):
    if not ok:
        sys.exit('❌ 越界断言失败: ' + msg)

# ─────────────── 按内容锚定三段（不再用绝对行号）───────────────
iHeadEnd = find(lambda s: s.strip() == '</head>', '</head>')
iBodySt  = find(lambda s: s.lstrip().startswith('<body'), '<body>')
iToast   = find(lambda s: 'id="toast"' in s, 'id="toast"')
iScript  = find(lambda s: s.strip() == '<script>', '<script>')
iEngSt   = find(lambda s: '向量工具' in s and s.lstrip().startswith('/*'), '向量工具 段首')

# 引擎段的结尾 = "物理模型" 横幅之前最后一个非空行
iBanner = find(lambda s: '物理模型' in s, '物理模型 横幅')
i = iBanner
while i > iEngSt and not L[i].lstrip().startswith('/*'):
    i -= 1
chk(i > iEngSt, '未能在 物理模型 横幅之前找到它的 /* 起点')
iEngEnd = i - 1
while iEngEnd > iEngSt and L[iEngEnd].strip() == '':
    iEngEnd -= 1

# ⚠️ 为了能拿"用旧源重建 ⇒ 逐字节等于已部署版"当回归检查，排版要跟历史产物一致：
#   body 含 toast 之后那个空行；eng 含横幅之前那个空行。
iEng0 = iEngSt - 1 if L[iEngSt-1].strip() == '' else iEngSt

head, body, eng = seg(0, iHeadEnd), seg(iBodySt, iScript-1), seg(iEng0, iEngEnd)
eng_first = next((l for l in eng.split('\n') if l.strip()), '')

# ─────────────── 越界断言：任何一条不过就停止产出 ───────────────
chk(head.startswith('<!DOCTYPE'), 'head 不以 <!DOCTYPE 开头')
chk(head.rstrip().endswith('</head>'), 'head 不以 </head> 结尾')
chk(body.lstrip().startswith('<body'), 'body 不以 <body 开头')
chk('id="toast"' in body, 'body 里没有 id="toast"')
chk('向量工具' in eng_first, 'eng 第一行有效内容不是「向量工具」横幅，而是: ' + eng_first[:60])
chk(eng.rstrip().split('\n')[-1].strip() == '}',
    'eng 末行不是孤立的 }（那是 shellBall 的收尾，行号错位时第一个牺牲的就是它）')
chk('function hexA' in eng, 'eng 里没有 function hexA')
chk('function shellBall' in eng, 'eng 里没有 function shellBall')
chk(all(l.strip() != '];' for l in eng.split('\n')),
    'eng 里混进了孤立的 ];（= 起点落进 2.1 的 NAV 数组尾部）')
chk('const NAV' not in eng, 'eng 里混进了 2.1 自己的 NAV 数组')

# ─────────────── 文案替换 ───────────────
REP_HEAD = [
    ('2.1 电场强度与电荷密度', '2.2 静电场中的导体'),
]
REP_BODY = [
    ('2.1 电场强度与电荷密度', '2.2 静电场中的导体'),
    # ⚠️ 2026-09-28：删掉「② 静电平衡的四个结论」页签后，副标题里那个「等位体」也一并去掉
    #    （它原本是照着三个页签逐条列的；现在只剩两个页签 ⇒ 只留 ① 与 ③ 的内容）。
    # ⚠️ 注意 `E = lim(q_t→0) F/q_t` 那一条（画布图例的初始文案）**故意不改**：
    #    它不是 ② 页签里面的内容，而且被 updateReadout() 在首帧就覆盖掉；
    #    "导体是等位体"这条在 ① 的「建立过程 · 四个阶段」卡片第 ④ 行里本来就有。
    ('场强的定义 · 点电荷的场 · 电荷密度（体 / 面 / 线）',
     '静电平衡 · 导体内部与表面的场 · 静电屏蔽'),
    ('E = lim(q_t→0) F/q_t', 'E 内 ≡ 0　·　E ⊥ 表面　·　导体是等位体'),
    ('>电场强度与电荷密度<small id="moduleSub">场强的定义</small>',
     '>静电场中的导体<small id="moduleSub">静电平衡</small>'),
]
for a, b in REP_HEAD:
    if a not in head:
        sys.exit('head 未命中: ' + a)
    head = head.replace(a, b)
for a, b in REP_BODY:
    if a not in body:
        sys.exit('body 未命中: ' + a)
    body = body.replace(a, b)

parts = [open(os.path.join(HERE, f), encoding='utf-8').read()
         for f in ('new_a.js', 'new_b.js', 'new_c.js')]

out = ('\n'.join([head, body, '<script>', "'use strict';"]) + '\n'
       + eng + '\n' + '\n'.join(parts)
       + '\n</script>\n</body>\n</html>\n')

open(OUT, 'w', encoding='utf-8').write(out)
print('锚点(1-based): head 1..%d  body %d..%d  eng %d..%d'
      % (iHeadEnd+1, iBodySt+1, iScript, iEng0+1, iEngEnd+1))
print('OK  lines=%d  bytes=%d' % (len(out.split('\n')), len(out.encode('utf-8'))))
