#!/bin/bash
# 双站点部署校验：轮询到 200 后逐文件比 sha256 前 10 位
# ⚠️ 每次下载前必须 rm 临时文件（curl 失败会留下上一次的内容 ⇒ 假匹配）
cd "$(dirname "$0")/.." || exit 1       # 本脚本在 tests/ 下 ⇒ 上一级就是站点根
TMP=/tmp/22shots/_v.html
mkdir -p "$(dirname "$TMP")" || exit 1   # /tmp 可能已被清理 ⇒ 不存在时 curl -o 会静默失败
FILES="index.html 1.2-vector-algebra.html 1.3-directional-derivative.html 1.4-divergence-flux.html 1.5-curl-circulation.html 2.1-field-charge-density.html 2.2-conductor-electrostatic.html 2.5-multi-conductor-crosstalk.html"
MAOZI="https://lichenluemf-3xxc2nj.maozi.io"
PAGES="https://lichristina1014-create.github.io/electromagnetic-field-visualization"

lsha() { shasum -a 256 "$1" | cut -c1-10; }
rsha() {                       # $1 = base url, $2 = file
  rm -f "$TMP"
  curl -sS -o "$TMP" -w '%{http_code}' --max-time 25 "$1/$2" 2>/dev/null
}

for base in "$MAOZI" "$PAGES"; do
  echo "=================== $base"
  for f in $FILES; do L=$(lsha "$f"); R=""; C=""
    for try in 1 2 3 4 5 6 7 8 9 10 11 12; do
      C=$(rsha "$base" "$f"); [ "$C" = "200" ] && { R=$(lsha "$TMP"); [ "$R" = "$L" ] && break; }
      sleep 10
    done
    if [ "$C" != "200" ]; then printf "  %-34s HTTP %-4s ✗ 未上线\n" "$f" "$C"
    elif [ "$R" = "$L" ]; then printf "  %-34s %s == %s ✓\n" "$f" "$R" "$L"
    else printf "  %-34s %s != %s ✗ 内容不一致\n" "$f" "$R" "$L"; fi
  done
done
