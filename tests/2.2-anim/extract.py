import sys,re
h=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<script>\n(.*)\n</script>', h, re.S)
if not m: sys.exit('no script')
open(sys.argv[2],'w',encoding='utf-8').write(m.group(1))
print('chars',len(m.group(1)))
