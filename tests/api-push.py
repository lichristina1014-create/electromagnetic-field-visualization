#!/usr/bin/env python3
"""GitHub REST API 推送（Clash 不在 / github.com 不可达时用）。

设计要点（都是踩过的坑）：
1. tree entries 的 mode 必须取自 `git ls-tree`（写死 100644 会把 100755 拍平 ⇒ tree sha 不等）
2. commit message 必须发 `git cat-file commit HEAD` 里的**原字节**
   （`git log --format=%B` 会多带一个换行 ⇒ sha 就变了）
3. 造完后断言 tree/commit sha 与本地全等 ⇒ 不需要任何 update-ref 对齐

用法：python3 scripts/api-push.py <repo_root> <owner> <repo>
"""
import base64, json, os, subprocess, sys, urllib.error, urllib.request

def git(root, *a, binary=False):
    out = subprocess.check_output(['git', '-C', root, *a])
    return out if binary else out.decode().strip()

def call(base, token, method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers={
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print('!! HTTP', e.code, method, path, e.read().decode()[:500])
        raise

def main():
    root, owner, repo = sys.argv[1], sys.argv[2], sys.argv[3]
    token = open('/tmp/.pat').read().strip()
    base = f'https://api.github.com/repos/{owner}/{repo}'

    head = git(root, 'rev-parse', 'HEAD')
    parent = git(root, 'rev-parse', 'HEAD^')
    local_tree = git(root, 'rev-parse', 'HEAD^{tree}')

    print('local HEAD   =', head[:12])
    print('local parent =', parent[:12])

    remote = call(base, token, 'GET', '/git/ref/heads/main')['object']['sha']
    print('remote main  =', remote[:12])
    if remote != parent:
        print('!! 远端 tip 不等于本地父提交 —— 中止（先 pull/核对）')
        return 1

    # 改动文件 + mode（取自 index/HEAD 的真实 mode）
    files = git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n')
    files = [f for f in files if f]
    modes = {}
    for line in git(root, 'ls-tree', '-r', 'HEAD').split('\n'):
        if not line:
            continue
        meta, path = line.split('\t', 1)
        mode, typ, sha = meta.split()
        modes[path] = (mode, sha)
    print('changed files =', len(files))

    entries = []
    for f in files:
        full = os.path.join(root, f)
        if not os.path.exists(full):
            print('!! 本地缺文件（删除类改动本脚本不处理）：', f)
            return 1
        blob = call(base, token, 'POST', '/git/blobs',
                    {'content': base64.b64encode(open(full, 'rb').read()).decode(),
                     'encoding': 'base64'})
        mode = modes[f][0]
        if blob['sha'] != modes[f][1]:
            print('!! blob sha 与 git 不一致：', f)
            return 1
        entries.append({'path': f, 'mode': mode, 'type': 'blob', 'sha': blob['sha']})
        print(f"  blob {f:<46} mode={mode} {blob['sha'][:12]}")

    tree = call(base, token, 'POST', '/git/trees',
                {'base_tree': git(root, 'rev-parse', 'HEAD^^{tree}'), 'tree': entries})
    print('new tree     =', tree['sha'])
    if tree['sha'] != local_tree:
        print('!! tree sha 与本地不等（还有别的差异）—— 中止')
        return 1
    print('✓ tree == 本地 HEAD^{tree}')

    raw = git(root, 'cat-file', 'commit', 'HEAD', binary=True)
    msg = raw.partition(b'\n\n')[2]
    # 元数据直接从对象里取，保证逐字节一致
    header = raw.partition(b'\n\n')[0].decode().split('\n')
    au = [l for l in header if l.startswith('author ')][0]
    ts, tz = au.rsplit(' ', 2)[1:]
    name_email = au[len('author '):].rsplit(' ', 2)[0]
    name, email = name_email.split(' <')
    email = email.rstrip('>')
    from datetime import datetime, timezone, timedelta
    dt = datetime.fromtimestamp(int(ts), timezone(timedelta(seconds=int(tz[:3]) * 3600 + int(tz[0] + tz[3:]) * 60)))
    iso = dt.isoformat()

    commit = call(base, token, 'POST', '/git/commits', {
        'message': msg.decode('utf-8'), 'tree': tree['sha'], 'parents': [parent],
        'author': {'name': name, 'email': email, 'date': iso},
        'committer': {'name': name, 'email': email, 'date': iso},
    })
    print('new commit   =', commit['sha'])
    if commit['sha'] != head:
        print('!! commit sha 与本地不等（message 尾字节/时区不一致）')
        return 1
    print('✓ commit == 本地 HEAD')

    call(base, token, 'PATCH', '/git/refs/heads/main', {'sha': commit['sha'], 'force': False})
    print('OK  main ->', commit['sha'][:12])
    return 0

sys.exit(main())
