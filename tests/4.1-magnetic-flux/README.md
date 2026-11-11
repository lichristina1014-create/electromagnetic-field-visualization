# 4.1 磁感应强度与磁通量 · 装配源与回归自检

对应页面：`../../4.1-magnetic-flux.htm`（**生成物，不要直接改**）

## 页面在讲什么

按教学说明文档重做的 4.1，四个页签一路走完「力的相互作用 → 场的定量 → 面通量 → 闭合面通量」：

| 页签 | 教学落点 | 关键一笔 |
|---|---|---|
| ① 安培力 | 同向相吸 / 反向相斥 | **半径恰好等于 d 的那圈磁场圆穿过导线 2** |
| ② 磁感应强度 | B 沿圆周切向（右手螺旋）、1/r 衰减、`B ≡ F_max/(I·dl)` | P 点三支箭头（d@{l}、@{B}、@{F}）两两垂直，F 指向导线 ⇒ 回勾① |
| ③ 磁通量 | `Φ = B·A·cosθ = 数穿过的线根数` | θ=90° 时 **Φ=0，但 @{B} 还在！** |
| ④ 闭合面的磁通量 | ∮@{B}·d@{S}=0；电力线有头有尾 ⇒ ∮@{D}·d@{S}=Q内 | 4 进 4 出 vs 6 出 0 进；"为什么找不到磁单极子" |

共用锚点 = 同一根长直载流导线（I 沿 +z，"垂直纸面流出"），四个页签在同一个世界坐标系里换视角。

## 物理模型（本页的地基）

- `B = μ₀I/(2πr)`、`F/L = μ₀I₁I₂/(2πd)`、`F = I₂·L×B₁₂`（叉乘符号由 `vcross` 现算，不自欺）
- `Φ = B·A·cosθ`；θ 定义域 `[0°,180°]`，负号 = 参照面法线的正负向
- ④ 的磁偶极子磁感线用**解析式** `r = L·sin²θ`（`dipolePts`）—— **闭合性由构造保证**，
  绝不能让"线没接上"的画面打脸"磁感线闭合"这句话；从 `r ≥ DIP_TRIM=0.055` 起画（端点会糊成点）
- ④ 的电力线 = 6 条从球心 Q 出发的**直线段**（`ELE_DIRS` = ±x̂/±ŷ/±ẑ），有头有尾
- **穿入/穿出统计必须与画出来的线同源**：`crossStats(R)` 里对 `dipolePts(...)` 的每个点先
  `vadd(q, CEN_M)` 再比球 —— **曾漏掉平移（偶极子在原点、球心在 y=−0.44）⇒ 统计出 1/1**
- **"数根数"是离散示意，不是把 Φ 量化**：`FLUX_D=0.156` 固定、一行 13 根（k=−6..6），
  `piercingXs` 用**严格不等式** `|x| < w·|cosθ| − 1e-9`（θ=90° 时连 x=0 那根也不穿）。
  根数 ∝ A 但带 floor（A 0.5→2.0 时 3→9 根，而 Φ 真涨 4 倍）——学生抠这点正是"极限思想"加分题

## 单位（照教学说明的"课堂好念"）

B 用 **mT**（②卡片/数据条另给 µT）；A 用 **dm²**；Φ 用 **mWb**；F 用 **µN**；F/L 用 **µN/m**。
基准点：40 mT × 1.2 dm² = **0.48 mWb**（θ=0°）。

## 文件清单

| 文件 | 作用 |
|---|---|
| `phys.js` | 物理内核 + 几何尺度 + `state` + `PRESET` + 取样/统计（`dipolePts`/`crossStats`/`piercingXs`） |
| `page1.js` | 图元 + 四个场景绘制 + 信息卡 + 两张插图 + 面板上半 |
| `page2.js` | 讲解卡 12 张 + 面板装配 + 数据条 + 主循环 + 交互 + 页签 |
| `nav41.js` | 自带完整 19 项 NAV（本页 `ch4-1` 为 `active`，无 href） |
| `build.js` | 装配器：以 `2.3-dielectric-polarization.htm` 的页头/CSS/骨架 + 公共引擎段为底座 |
| `chk41.js` | 页面内自检（**104 条**） |
| `prep_ampere.js` `prep_field.js` `prep_flux.js` `prep_closed.js` | 截图前置：切页签 + `draw()` |

## 跑法

```bash
# 1) 装配（内容锚定；必须唯一命中，否则 throw）
cd tests/4.1-magnetic-flux && node build.js

# 2) 语法检查（build 会顺带抽出 _inline.js）
node --check _inline.js

# 3) 页面内自检（104 PASS / 0 FAIL）
cd ../.. && node ~/.workbuddy/skills/headless-cdp-test/scripts/cdpeval.js \
  "file://$PWD/4.1-magnetic-flux.htm" tests/4.1-magnetic-flux/chk41.js \
  "typeof state!=='undefined'" | grep -c '^PASS|'

# 4) 截图（先切页签再读 prims）
node ~/.workbuddy/skills/headless-cdp-test/scripts/cdpshot.js \
  "file://$PWD/4.1-magnetic-flux.htm" tests/4.1-magnetic-flux/prep_closed.js /tmp/closed.png
```

## 装配器口径（照 4.2）

- `2.3-dielectric-polarization.htm` 的 `slice(1,181)` = 页头 + CSS + 骨架；`slice(186,323)` = 公共引擎段
- 每条替换**必须唯一命中**（`split(a).length-1 !== 1` 就 throw）；引擎段首行含「向量工具」、
  末行是单独的 `}`（给绝对行号漂移兜底）
- 重复声明清单逐名查"恰好 1 次"；`OWN_CHK` 查 4.1 自己声明的符号是否真存在
- ⚠️ **改 `page*.js` / `phys.js` 后必须重跑 `build.js`**：改源码 ≠ 改页面

## 踩过的坑（改这页前先读）

1. **`page*.js` 里数组字面量误用 `)` 收尾** ⇒ `SyntaxError: Unexpected token ')'`（第 891 行）
2. **`Q_HEX is not defined`** ⇒ ④ 整屏空白，而 `tick()` 的 try/catch 把它吞成 `console.error`，
   `prims` 停在上一个页签的 52。**症状是"画面不动"而不是"报错"**
3. **`crossStats` 忘 `vadd(CEN_M)`** ⇒ 4/4 变 1/1
4. **`.card-tab` 是 `flex:1 + white-space:nowrap`** ⇒ 页签名超 6 字会溢出叠住
5. **② 首版「三圈各 6 支箭头」像刺猬** ⇒ 改 7×7 quiver（`QUIV_N=7, QUIV_SPAN=0.84`，中心格跳过）
   + 两条虚线导引圆 + `bLen(ρ)` 钳制 `[0.07, 0.17]`
6. **② P 在 y 轴上时，橙色 @{F} 箭头与橙色 y 轴共线**（像"轴线自带箭头"）⇒ `PROBE_Z=0.42` 抬高
   （场沿导线平移不变，物理等价）。**注意：抬高后三矢垂直的断言不能用球坐标 r̂，要用柱坐标 ρ̂=(0,1,0)**
7. **④ 两张线框网叠出摩尔纹** ⇒ `sphereShell(c,R,hex,wk)` 的 `wk` 磁感线侧传 0.55；
   场线方位从 45° 起、口径 0.84/0.62 交替（不重合才像"一族"）
8. **`poly()` 的 `fillAlpha` 会同时压低描边** ⇒ 必须显式 `strokeAlpha:1`
9. **世界坐标锚的 `text()` 极易撞右上信息卡 / 压虚线椭圆** ⇒ 说明文字一律走 `hintLine()`
   （`textScreen(16, 72+row*19, …)`）
10. **chip 点击后 `prims` 读到旧值** ⇒ `chip.onclick` 只置 `needsRender`，断言里要 `c.click(); draw();`
11. **全角减号 `−`（U+2212）混进代码** ⇒ `rev?−1:1` 是语法错；改完 `grep -n "−"` 全量核查
12. **Python heredoc 的替换串不要用中文全角引号**，否则 `SyntaxError: invalid syntax`
