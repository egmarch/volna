import re, io
p='index.html'
s=open(p,encoding='utf-8',newline='').read()
styles=re.findall(r'<style[^>]*>(.*?)</style>',s,flags=re.S)
assert len(styles)==5
css='\n'.join(styles)
first=True
def rep(m):
    global first
    if first:
        first=False
        return '<link rel="stylesheet" href="assets/site.css?v=0"/>'
    return ''
s=re.sub(r'<style[^>]*>.*?</style>',rep,s,flags=re.S)
# main script: the last <script> without type
m=list(re.finditer(r'<script>(.*?)</script>',s,flags=re.S))
big=[x for x in m if len(x.group(1))>10000]
assert len(big)==1
b=big[0]
js=b.group(1)
s=s[:b.start()]+'<script src="assets/site.js?v=0"></script>'+s[b.end():]
open('assets/site.css','w',encoding='utf-8',newline='').write(css)
open('assets/site.js','w',encoding='utf-8',newline='').write(js)
open(p,'w',encoding='utf-8',newline='').write(s)
print(len(css),len(js),len(s))
