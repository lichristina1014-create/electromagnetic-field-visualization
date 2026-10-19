#!/usr/bin/env bash
# 通用回归跑法：run_suite.sh <页面路径(相对仓库根)> <就绪表达式> <脚本...>
set -u
SK="$HOME/.workbuddy/skills/headless-cdp-test/scripts"
NODE=$(command -v node)
BASE=$(cd "$(dirname "$0")" 2>/dev/null; pwd)
ROOT="/Users/lichenlu/Documents/教学/电磁场与电磁波可视化探索/知识点ppt/电磁场可视化平台"
PAGE="$1"; shift; READY="$1"; shift
URL="file://$ROOT/$PAGE"
TOT=0; BAD=0
for f in "$@"; do
  out=$("$NODE" "$SK/cdpeval.js" "$URL" "$f" "$READY" 2>&1)
  p=$(printf '%s\n' "$out" | grep -c '^PASS|')
  q=$(printf '%s\n' "$out" | grep -c '^FAIL|')
  d=$(printf '%s\n' "$out" | grep -c '^DONE')
  TOT=$((TOT+p))
  printf '%-26s PASS=%-3s FAIL=%-3s %s\n' "$(basename "$f")" "$p" "$q" \
    "$([ "$d" -eq 1 ] && echo '' || echo '<-- 没跑到 DONE（超时/异常）')"
  [ "$q" -gt 0 ] && printf '%s\n' "$out" | grep '^FAIL|' | head -5
  { [ "$q" -gt 0 ] || [ "$d" -ne 1 ] || [ "$p" -eq 0 ]; } && BAD=1
done
echo "--------------------------------------"
echo "合计 PASS=$TOT"
[ "$BAD" -eq 0 ] && echo "全绿 ✓" || echo "有失败 ✗"
exit $BAD
