# 2.2 静电场中的导体 · 回归自检脚本

对应页面：`../2.2-conductor-electrostatic.html`
覆盖提交：`e553ebc`（首版三页签）+ `b9aa342`（① 全过程播放）+ `e9632e8`（球内场分解、场线压暗）
　　　　　+ `738dfee`（⏮ 回到无外场、场线方向箭头）+ `9fee50b`（删 E₀ 滑块、装配器改内容锚定）
　　　　　+ 本轮（**场线只画「正对镜头的那一圈」并随相机转**）
自检总数：**221 条，全绿**（143 条回归 + 16 条 `t3a` + 20 条 `t3b` + 20 条 `t4a` + 22 条 `t5a`）

> ⚠️⚠️ **改源码后忘记重跑 `build.py` ⇒ 自检会对着旧页面跑**（本轮真实踩过一次：
> `pts[k].z` 的方向修正只改进了 `new_a.js`，HTML 里仍是旧的一行，于是 `t3b` 报 32 条"箭头指反"。
> 症状是"源码明明是对的、页面行为却不对" —— 先 `shasum` 比一次再怀疑代码。）

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
| `t3a.js` | 16 | **球内场分解**：t=0.5 时两支一一配对且长度比 = 0.500、t=0.95 时 0.950、t=1 / 无外场时一支都不画、**球剪影圆内的场线段被压暗且不拆断**、拆分后仍幂等、z 无 NaN |
| `t3b.js` | 20 | **箭头可读性**：场线方向箭头"每条线恰好一个 / 一律指 +z / 箭杆屏幕定长 26~40px（不缩成 8px 小三角、不出 300px 巨型箭头）/ 不在导体内部 / ≥85% 在画布内"、球内两支与迁移弧的 `headScale`、**⏮ 回到无外场**按钮 ⇒ (0,0) 且停在阶段①、**id 不与相机复位按钮撞名** |
| `t4a.js` | 20 | **删控件三层判据**（E₀ 滑块）：① 控件真没了（三页签的 `input[type=range]` id 集合）② 死代码真清了（`typeof E0_RANGE==='undefined'`、逐张切讲解卡扫死文案）③ **概念没丢**（读数条仍报 E₀、`g` 仍驱动 8 条背景外场箭头） |
| `t5a.js` | 22 | **场线只画「正对镜头的那一圈」**：方位角只有 2 个且 φ−az = ±π/2、平面径向方向 u ≡ camU（⇒ 横向零缩短、屏幕左右严格对称）、赤道点屏幕偏移/(camScale·r) = 1、轴上段去重、**转相机后 Δφ ≡ Δaz (mod π)**；② 等位面 / ③ 壳外场线 / ③ 腔内径向箭头（20→10）共用同一规则；面板提示存在 + 无字面 `**` |

## 截图前置脚本（配 `cdpshot.js`）

| 文件 | 状态 |
|---|---|
| `prep_a1.js` | (0, 0)　　① 无外加电场 |
| `prep_a2.js` | (1, 0)　　② 外场已建立、电荷未动 |
| `prep_a3.js` | (1, 0.5)　③ 迁移中 |
| `prep_a4.js` | (1, 1)　　④ 静电平衡 |
| `prep_a5.js` | (0.45, 0) ② 建立过程中 |
| `prep_t004.js` | (1, 0.038)　③ 刚开始迁移（用户报缺陷时的状态） |
| `prep_t050.js` | (1, 0.5) 　两支长度比 2:1 |
| `prep_t095.js` | (1, 0.95)　两支几乎等长（抵消） |
| `prep_lines.js` | 只留场线、放大 1.5×（诊断"凌乱"用） |
| `prep_cmp.js` | 固定 (1, 0.038) 且关坐标轴 —— **新旧像素对照**用 |
| `prep_eq.js` | (1, 1)　　④ 静电平衡、只留场线（**验收场线方向箭头**用） |
| `prep_noField.js` | 先 (1,1) 再按「⏮ 回到无外场」—— **验收复位按钮**用 |
| `prep_1plane.js` | (1, 1) 且关框/关电荷/关球内场 —— **只看场线**（验收"只画一圈"） |
| `prep_mid.js` | (1, 0.45) ③ 迁移中、元素全开 —— **看单平面下的整体观感** |
| `prep_rot.js` | (1, 1) 且 `cam.az=2.35, cam.el=0.30` —— **验收"场线跟着相机转"** |
| `prep_concl_rot.js` | ② 页签 + `cam.az=2.30` —— 转视角下的等位面 |
| `prep_tab_build.js` / `prep_tab_concl.js` / `prep_tab_shield.js` | 三个页签的默认态 |

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
/Users/lichenlu/.workbuddy/binaries/python/envs/default/bin/python build.py
# → 锚点(1-based): head 1..140  body 141..171  eng 203..412
# → OK  lines=1934  bytes=130151
```

⚠️ 改完源码**必须重跑 `build.py`**，否则改动不会进 HTML。
判"真同步"的办法：**连跑两遍，sha 不变**（装配是纯拼接，幂等）。

校验重建结果与线上一致（应输出
`ed9b79d992b657b0210d7cc3b7e8133533baf712a6c1fba1f58221ca39401a01`，且 `git status` 里该 HTML 无改动）：

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
- 本轮三条（**改源码没重建** / **新增按钮撞已有 id** / **箭杆被采样步长压成 8.6px**）
  回灌进同一 skill 的第 25–27 条；本页细节见 memory `ref-22-conductor.md` §12。
- 上一轮两条（**空转控件判据** / **生成器切片绝不钉绝对行号**）见同一 skill 的
  `## 空转控件的判据` 与 `## 生成物页面的两个致命坑`；细节见 `ref-22-conductor.md` §13。
- 本轮四条（**"正对镜头"的真正判据是 u ≡ camU 而不是 n ∥ camD** /
  **`curve` 调用条数 ≠ 剖面折线数**（剪影圆会把它切成 1~3 段）/
  **`azs()` 为了去重做的舍入会污染下游几何断言** /
  **`richHTML` 不认 `**`，写了会字面显示星号**）见 memory `ref-22-conductor.md` §14。

## 场线只画「正对镜头的一圈」（2026-09-28）

原写法 `FL_PH = [0, π/2, π, 3π/2]` = **2 个互相垂直的平面**，两族线互相穿插 ⇒ 用户嫌乱。
现在由 `facePH()` / `faceCurves()`（`new_a.js`）统一给出**一个平面**的 2 个方位角：

```js
const facePH = ()=>{ const ph=cam.az+Math.PI/2; return [ph, ph+Math.PI]; };
```

- 为什么是 `az + π/2`（**差 90° 正好是最乱的那个结果**）：
  子午面 φ 的径向方向 `u = (cosφ, sinφ, 0)`；`φ = az+π/2` ⟹ `u ≡ camU`（屏幕水平轴）
  ⟹ 横向零缩短、屏幕**左右严格镜像**。若误写成 `φ = az` 则 `u ⊥ camU` ⟹ 平面侧对镜头、
  整族线被压成一条线（就是用户截图里最乱的样子）。
- **不是** `n ∥ camD`：`n` 的 z 分量恒为 0、`camD` 的 z 分量是 `sin(el)`，永远不可能平行；
  此时 `n` 与视线夹 `el` 角 = 相机仰角（不可避免，也不影响可读性）。
- 平面无向：`φ` 与 `φ+π` 是同一个平面，而 `dipolarLines()` / `equiCurve()` 只给 `x ≥ 0` 的半条
  ⟹ **必须两个方位都转**才拼得出完整的一圈。但**轴上的段（x ≡ 0）**转两次是同一批点 ⟹ 去重。
- 三个调用点：`new_a.js` `drawFieldLines`、`new_b.js` `drawEqui`、`new_b.js` `sceneShield`
  （含腔内径向箭头 `phs`，20 → 10 支）。`drawFlow` 的迁移弧**没动** —— 它有自己的一套调参
  （`az+0.55`，故意"半开着"），改成 +π/2 会完全张开、和场线糊在一起。

