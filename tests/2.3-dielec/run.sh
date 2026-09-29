#!/usr/bin/env bash
# 2.3-dielectric-polarization.html 回归自检一键跑。
# 用法：bash run.sh            （在 tests/2.3-dielec/ 下）
# 退出码：全部 PASS ⇒ 0；任一脚本有 FAIL 或没产出断言 ⇒ 1
set -u
NODE=/Users/lichenlu/.workbuddy/binaries/node/versions/22.22.2-3/bin/node
SK="$HOME/.workbuddy/skills/headless-cdp-test/scripts"
cd "$(dirname "$0")" || exit 1
# ⚠️ 是 ../.. —— 页面在仓库根，本脚本在 tests/2.3-dielec/ 下（写成 .. 会指到 tests/ ⇒
#    页面加载失败、就绪探针超时、四条全 0 却不报错）。run.sh 首版就栽在这一行。
URL="file://$(cd ../.. && pwd)/2.3-dielectric-polarization.html"

# ⚠️ 第 3 个参数是**轮询**的就绪表达式，漏传 ⇒ 脚本早于页面执行 ⇒ PASS 数为 0 却不报错。
READY="typeof state!=='undefined'"

TOT=0; BAD=0
for f in chk1_smoke chk2_phys chk3_tabs chk4_canvas; do
  out=$("$NODE" "$SK/cdpeval.js" "$URL" "$f.js" "$READY" 2>&1)
  p=$(printf '%s\n' "$out" | grep -c '^PASS|')
  q=$(printf '%s\n' "$out" | grep -c '^FAIL|')
  done_=$(printf '%s\n' "$out" | grep -c '^DONE')
  TOT=$((TOT+p))
  printf '%-12s PASS=%-3s FAIL=%-3s %s\n' "$f" "$p" "$q" \
    "$( [ "$done_" -eq 1 ] && echo '' || echo '<-- 没跑到 DONE（超时/异常）')"
  [ "$q" -gt 0 ] && printf '%s\n' "$out" | grep '^FAIL|'
  { [ "$q" -gt 0 ] || [ "$done_" -ne 1 ] || [ "$p" -eq 0 ]; } && BAD=1
done
echo "======================================"
echo "合计 PASS=$TOT"
[ "$BAD" -eq 0 ] && echo "全绿 ✓" || echo "有失败 ✗"
exit $BAD
