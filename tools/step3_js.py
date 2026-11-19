p = 'assets/site.js'
s = open(p, encoding='utf-8', newline='').read()
lead = open('tools/lead_block.js', encoding='utf-8', newline='').read()


def one(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])
    s = s.replace(old, new)


# 1. константы страницы
one("const $ = (selector, root = document) => root.querySelector(selector);",
    "const PAGE = document.body.dataset.page || 'home';\n      const ROOT = document.documentElement.dataset.root || '';\n      let expertHoursSel = 1;\n      const $ = (selector, root = document) => root.querySelector(selector);")

# 2. блок заявки
a = s.index("let attached='';")
b = s.index("function route(){")
s = s[:a] + lead + "\n" + s[b:]

# 3. route / openCalc
a = s.index("function route(){")
b = s.index("function openCalc(){")
route = r"""const OWN={home:['top','cases','formats','faq','portfolio','portfolio-shorts','more-paths'],podcast:['packages','example','outputs','podcast-how','podcast-top'],smeta:['process','calculator','price','quick-estimate','smeta-top']};
const PAGE_URL={home:ROOT||'./',podcast:ROOT+'podcast/',smeta:ROOT+'smeta/'};
const PAGE_TITLE={home:document.title};
let lastView='';
function route(){
  let h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){h=location.hash.slice(1)}
  if(h==='brief'){history.replaceState(null,'',location.pathname+location.search);h='';openLead({})}
  // старые ссылки (до разделения на страницы): якорь ведёт на страницу, где теперь лежит содержимое
  const own=Object.keys(OWN).find(k=>OWN[k].includes(h));
  if(own&&own!==PAGE){location.replace(PAGE_URL[own]+'#'+h);return}
  const port=PAGE==='home'&&(h==='portfolio'||h==='portfolio-shorts');
  document.documentElement.classList.toggle('pf-active',port);
  $('#top').hidden=PAGE!=='home'||port;$('#workpage').hidden=!port;
  $('#podcastpage').hidden=PAGE!=='podcast';$('#smetapage').hidden=PAGE!=='smeta';
  document.title=port?'Портфолио — VOLNA film':PAGE_TITLE.home;
  const navKey=port?'portfolio':PAGE==='podcast'||PAGE==='smeta'?PAGE:h==='faq'?'faq':'';
  $$('#main-nav a[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===navKey));
  if(h==='calculator')openCalc();
  const view=PAGE+(port?':work':'');
  const changed=view!==lastView;lastView=view;
  requestAnimationFrame(()=>{
    const el=h&&!port&&h!=='top'?document.getElementById(h):null;
    if(el)el.scrollIntoView({behavior:'instant'});
    else if(port||h==='top'||changed&&!h)window.scrollTo({top:0,behavior:'instant'});
  });
}
"""
s = s[:a] + route + s[b:]

# 4. наблюдатель разделов в меню — заменён логикой route()
a = s.index("const sections = ['formats'")
b = s.index("if (navObserver) sections.forEach(section => navObserver.observe(section));")
b = s.index("\n", b) + 1
s = s[:a] + s[b:]

# 5. переключатель часов в карточке пакета
one("""        syncExpertCard(hours);
        $('#package-hours').value = String(hours);
        choosePackage('expert', hours);""",
    """        syncExpertCard(hours);
        $('#package-hours').value = String(hours);
        expertHoursSel = hours;
        $$('[data-calc-pkg="expert"]').forEach(a => { a.href = `${ROOT}smeta/?package=expert&hours=${hours}#calculator`; });
        if (PAGE === 'smeta') choosePackage('expert', hours);""")

# 6. печать: пути к картинкам
assert s.count('src="assets/img-92fe70ae1b.png"') == 2
s = s.replace('src="assets/img-92fe70ae1b.png"', 'src="${ROOT}assets/img-92fe70ae1b.png"')

# 7. КП: несколько кнопок
one("const kpBtn = $('#download-kp');\nif (kpBtn) {\n  kpBtn.addEventListener('click', () => {",
    "$$('[data-kp]').forEach(kpBtn => {\n  kpBtn.addEventListener('click', () => {")
open(p, 'w', encoding='utf-8', newline='').write(s)
i = s.index("$$('[data-kp]')")
print(s[i:i+60])
j = s.index('window.print()', i)
print(repr(s[j:j+120]))
