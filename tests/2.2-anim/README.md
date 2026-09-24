# 2.2 静电场中的导体 · 回归自检脚本

对应页面：`../2.2-conductor-electrostatic.html`
覆盖提交：`e553ebc`（首版三页签）+ `b9aa342`（① 全过程播放）
自检总数：**143 条，全绿**

> 这些脚本是从 `/tmp` 抢救归档的 —— 它们是回归资产，改页面后应重跑一遍。

## 怎么跑

用 `headless-cdp-test` skill 的 `cdpeval.js`（**不在本仓库**，在 `~/.workbuddy/skills/headless-cdp-test/scripts/`）：

```bash
NODE=/Users/lichenlu/.workbuddy/binaries/node/versions/22.22.2-3/bin/node
SK=~/.workbuddy/skills/headless-cdp-test/scripts
URL="file://$(cd .. && pwd)/2.2-conductor-electrostatic.html"

"$NODE" "$SK/cdpeval.js" "$URL" t1a.js
```

⚠️ 必须 `/Users/lichenlu/.workbuddy/binaries/node/versions/22.22.2-3/bin/node`（不要用系统 node）。

## 脚本清单

| 文件 | 条数 | 验证内容 |
|---|---|---|
| `t1a.js` | 21 | 物理内核：球坐标分量式 ↔ 直角坐标叠加式交叉验证、σ=ε₀E_n、r<a 时 E≡0、表面 E_θ≡0 |
| `t1b.js` | 25 | 幂等（`prims` 不增长）、z 无 NaN、交互、DOM 扫查 |
| `t1c.js` | 9 | 三页签全量文本扫查（无 `@{` 字面泄漏、无 `undefined` 芯片） |
| `t1d.js` | 15 | 屏幕空间：投影长度、方向夹角、**标签包围盒 18 组合零重叠** |
| `t1e.js` | 21 | ① 的三个按钮真实可点、播放到结束（轮询 `state.anim`） |
| `t2a.js` | 14 | 流函数 t 族：t=0 是直线、5 个 t 满足 ψ 方程、`Bcr(t)`、t=1 与严格解逐点相同 |
| `t2b.js` | 16 | 时间轴：断点 / 单调 / 值域、`stepAnim` 步进与暂停、播完自动归位、`animU` 反推 |
| `t2c.js` | 22 | 三按钮、**三阶段画布文本哈希 + 像素哈希互不相同**、阶段卡位置、阶段① 恰好 8 个中性电荷 |

## 截图前置脚本（配 `cdpshot.js`）

`prep_a1..a5.js` 把页面拨到指定 `(g, t)`：

| 文件 | 状态 |
|---|---|
| `prep_a1.js` | (0, 0)　　① 无外加电场 |
| `prep_a2.js` | (1, 0)　　② 外场已建立、电荷未动 |
| `prep_a3.js` | (1, 0.5)　③ 迁移中 |
| `prep_a4.js` | (1, 1)　　④ 静电平衡 |
| `prep_a5.js` | (0.45, 0) ② 建立过程中 |

```bash
"$NODE" "$SK/cdpshot.js" "$URL" prep_a3.js /tmp/22/out_a3.png
```

## 装配 / 语法检查

本页**非直接编辑**：HTML 是**生成物**，由 `build.py` 取 2.1 的 head/body/引擎段（整段复用，保证视觉与手感同源）+ 下列三段源码装配而成：

| 文件 | 内容 |
|---|---|
| `new_a.js` | 物理内核（解析解 / 插值场 `fieldT` / 流函数 / 通用绘制助手） |
| `new_b.js` | 三个场景 + 阶段卡 + 小卡 |
| `new_c.js` | 读数 / 面板 / 交互 / 页签 / 主循环 |

```bash
cd tests/2.2-anim
/Users/lichenlu/.workbuddy/binaries/python/versions/3.13.12/bin/python3 build.py
# → OK  lines=1792  bytes=118041
```

⚠️ 改完源码**必须重跑 `build.py`**，否则改动不会进 HTML。

校验重建结果与线上一致（应输出
`6fee56a6eda30cca12351cc65e5f1dfdccfc288e29df2463bb5698b66f3dbd76`，且 `git status` 里该 HTML 无改动）：

```bash
shasum -a 256 ../../2.2-conductor-electrostatic.html
```

语法检查（内联脚本整块提取后 `node --check`）：

```bash
/Users/lichenlu/.workbuddy/binaries/python/versions/3.13.12/bin/python3 extract.py ../../2.2-conductor-electrostatic.html /tmp/2.2.js
/Users/lichenlu/.workbuddy/binaries/node/versions/22.22.2-3/bin/node --check /tmp/2.2.js
```

⚠️ 别只 `grep` 源码做自检 —— 内联串会被 HTML 标签拆开，一律用 `cdpeval.js` 指向 URL。

## 备注

- `build.py` 里的 `SRC` / `OUT` 仍指向项目根（2.1 源与 2.2 产物都在那），
  但 `BASE` 是硬编码绝对路径 —— 换机器要改。
- 三项最近一轮的通用经验（辅助几何方位写死 / 固定注记进避让表 / 动画时间轴派生量）
  已回灌进 `headless-cdp-test` skill 的 `## Critical Gotchas` 第 22–24 条。

