#!/bin/bash
# 双站点部署校验：轮询到 200 后逐文件比 sha256 前 10 位
# ⚠️ 每次下载前必须 rm 临时文件（curl 失败会留下上一次的内容 ⇒ 假匹配）
cd "$(dirname "$0")/.." || exit 1       # 本脚本在 tests/ 下 ⇒ 上一级就是站点根
TMP=/tmp/22shots/_v.html
mkdir -p "$(dirname "$TMP")" || exit 1   # /tmp 可能已被清理 ⇒ 不存在时 curl -o 会静默失败
# ⚠️ 新增页面必须同步加进 FILES —— 否则它根本没被检查，脚本却照样报"全部 ✓"。
FILES="index.html 1.2-vector-algebra.html 1.3-directional-derivative.html 1.4-divergence-flux.html 1.5-curl-circulation.html 2.1-field-charge-density.html 2.2-conductor-electrostatic.html 2.3-dielectric-polarization.html 2.4-gauss-law.html 2.5-multi-conductor-crosstalk.html"
MAOZI="https://lichenluemf-3xxc2nj.maozi.io"
PAGES="https://lichristina1014-create.github.io/electromagnetic-field-visualization"

lsha() { shasum -a 256 "$1" | cut -c1-10; }
# ⚠️⚠️ 两个站点走的网**不同**，绝不能一刀切（2026-09-30 修）：
#   · 帽子云 maozi.io（大陆直连）⇒ 必须 `--noproxy '*'` + 清掉 env 里的代理变量。
#     一旦走代理，得到的是 `curl: (35) SSL_ERROR_SYSCALL` / `502 CONNECT tunnel failed`
#     ⇒ 看起来像"站点没重建"，其实只是代理不给过。
#   · GitHub Pages ⇒ 反而要**带**代理（直连不通）。
#   旧版对两者用同一个 curl，maozi 那一轮必然空转 12 次重试（每次 sleep 10 s）后才报失败。
rsha() {                       # $1 = base url, $2 = file, $3 = direct|proxy
  rm -f "$TMP"                 # 每次先删：curl 失败会留下上一次的内容 ⇒ 假匹配
  local u="$1/$2?cb=$(date +%s%N)"   # 破缓存（否则可能读到 CDN 老副本）
  if [ "$3" = "direct" ]; then
    env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u ALL_PROXY -u all_proxy \
      curl -sS --noproxy '*' -o "$TMP" -w '%{http_code}' --max-time 15 "$u" 2>/dev/null
  else
    curl -sS -o "$TMP" -w '%{http_code}' --max-time 15 "$u" 2>/dev/null
  fi
}

for pair in "direct $MAOZI" "proxy $PAGES"; do
  set -- $pair; MODE=$1; base=$2
  echo "=================== $base  (走 $MODE)"
  for f in $FILES; do L=$(lsha "$f"); R=""; C=""
    for try in 1 2 3 4 5 6 7 8 9 10 11 12; do
      C=$(rsha "$base" "$f" "$MODE"); [ "$C" = "200" ] && { R=$(lsha "$TMP"); [ "$R" = "$L" ] && break; }
      sleep 10
    done
    if [ "$C" != "200" ]; then printf "  %-34s HTTP %-4s ✗ 未上线\n" "$f" "$C"
    elif [ "$R" = "$L" ]; then printf "  %-34s %s == %s ✓\n" "$f" "$R" "$L"
    else printf "  %-34s %s != %s ✗ 内容不一致\n" "$f" "$R" "$L"; fi
  done
done
