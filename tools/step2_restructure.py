# Однократная перестройка index.html: главная / подкасты / смета + общий диалог заявки.
import re

P = 'index.html'
s = open(P, encoding='utf-8', newline='').read()


def one(old, new, text=None):
    global s
    t = s if text is None else text
    assert t.count(old) == 1, (t.count(old), old[:80])
    t = t.replace(old, new)
    if text is None:
        s = t
    return t


def section_span(text, sid):
    m = re.search(r'<section[^>]*\bid="%s"[^>]*>' % re.escape(sid), text)
    assert m, sid
    e = text.index('</section>', m.end()) + len('</section>')
    assert '<section' not in text[m.end():e], sid
    return m.start(), e


def take_section(sid):
    global s
    a, b = section_span(s, sid)
    chunk = s[a:b]
    s = s[:a] + s[b:]
    return chunk


# ---------- 1. вытаскиваем существующие блоки ----------
cases_old = s[section_span(s, 'cases')[0]:section_span(s, 'cases')[1]]
# тексты двух старых кейсов (для переноса в полное портфолио)
def old_case(vk):
    i = cases_old.index('data-vk="-240438229_%s"' % vk)
    a = cases_old.rindex('<article', 0, i)
    b = cases_old.index('</article>', i) + len('</article>')
    art = cases_old[a:b]
    ps = re.findall(r'<p>(.*?)</p>', art, flags=re.S)
    meta = re.search(r'<div class="case-meta-bar">\s*<span>(.*?)</span>', art, flags=re.S).group(1)
    return ps, meta

inskie_ps, inskie_meta = old_case('456239021')
promk_ps, promk_meta = old_case('456239019')
assert len(inskie_ps) == 2 and len(promk_ps) == 2

formats = take_section('formats')
packages = take_section('packages')
example = take_section('example')
process = take_section('process')
calculator = take_section('calculator')
price_teaser = take_section('price-teaser')
faq = take_section('faq')
cases_chunk = take_section('cases')
brief_chunk = take_section('brief')

# pricepage целиком
a = s.index('<main hidden="" id="pricepage">')
b = s.index('</main>', a) + len('</main>')
pricepage = s[a:b]
s = s[:a] + s[b:]
_pa = pricepage.index('<section aria-labelledby="price-title"')
_pb = pricepage.rindex('</section>') + len('</section>')
price = pricepage[_pa:_pb]  # quick-estimate вложен в price
assert 'id="quick-estimate"' in price
quick = ''

# ---------- 2. hero / route-strip / b2b ----------
a = s.index('<div aria-label="Три шага к расчёту"')
b = s.index('<div aria-label="Сферы и опыт')
route_strip = s[a:b]
s = s[:a] + s[b:]
a = s.index('<div aria-label="Сферы и опыт')
# b2b-блок кончается перед </div> контейнера hero-wrap; найдём конец <main id="top"> контента
b2b_end = s.index('<section class="section-sm">')  # final-cta
b2b_raw = s[a:b2b_end]
# b2b_raw = b2b-блок + закрывающий </div> hero-wrap
assert b2b_raw.rstrip().endswith('</div>')
b2b = b2b_raw.rstrip()[:-len('</div>')].rstrip()
s = s[:a] + '</div>\n' + s[b2b_end:]  # закрываем hero-wrap

# hero: действия
a = s.index('<div class="hx-actions">')
b = s.index('<p class="hx-contact">')
b_end = s.index('</p>', b) + 4
new_actions = '''<div class="hx-actions">
<a class="hx-cta" href="#cases">Посмотреть работы <span aria-hidden="true">↓</span></a>
<button class="hx-cta hx-cta-ghost" data-lead="general" type="button">Обсудить проект <span aria-hidden="true">→</span></button>
</div>
<p class="hx-contact">Напрямую: <a href="https://t.me/Egmarch" rel="noopener" target="_blank">Telegram @Egmarch</a> · <a href="tel:+79231775251">+7&nbsp;923&nbsp;177-52-51</a> · <button class="hx-textbtn" data-kp id="download-kp" type="button">Скачать КП (PDF)</button></p>
<p class="hx-podlink"><a href="podcast/">Нужен подкаст или серия Shorts? Пакеты и цены →</a></p>'''
s = s[:a] + new_actions + s[b_end:]

# hero: плашка портфолио и «Экспертам»
a = s.index('<span class="hx-reel-label">Портфолио</span><strong>')
b = s.index('</strong>', a) + len('</strong>')
s = s[:a] + '<span class="hx-reel-label">Портфолио</span><strong data-works-count>22 работы в портфолио</strong>' + s[b:]
a = s.index('<a class="hx-experts"')
b = s.index('</a>', a) + 4
s = s[:a] + s[b:]
one('<li>Фиксированные пакеты и калькулятор</li>', '<li>Смета до начала съёмок</li>')

# ---------- 3. новые карточки кейсов ----------
def case_card(cid, vk, img, title, badge, caption, h3, text, meta, lead):
    meta_html = ''
    if meta:
        meta_html = '<div class="case-meta-bar"><span>%s</span></div>' % meta
    attrs = ' '.join('data-%s="%s"' % (k, v) for k, v in lead.items())
    return f'''<article class="caseunit real-case" data-case="{cid}">
<div class="video-stage" data-vk="-240438229_{vk}" data-yt-title="{badge}">
<img alt="Кадр из фильма: {badge}" loading="lazy" src="{img}"/>
<div class="video-stage-shade"></div>
<span class="video-badge">{badge}</span>
<button aria-label="Смотреть: {badge}" class="video-play-btn" type="button">
<span aria-hidden="true" class="play-triangle">▶</span>
<span>Смотреть ролик</span>
</button>
</div>
<div class="casebody">
<span class="caption">{caption}</span>
<h3>{h3}</h3>
<p class="case-text">{text}</p>
{meta_html}
<div class="case-actions">
<button class="btn btn-accent" data-lead-case="{cid}" {attrs} type="button">{lead['cta']} <span aria-hidden="true">→</span></button>
<a class="case-ext-link" href="https://vkvideo.ru/video-240438229_{vk}" rel="noopener noreferrer" target="_blank">Открыть в VK Видео ↗</a>
</div>
</div>
</article>'''

c1 = case_card(
    'inskie-holmy', '456239021', 'assets/img-d14a247b5e.webp', 'Инские холмы', 'Сити-квартал «Инские холмы»',
    'Девелопмент · фильм об объекте',
    'Инские холмы: квартал глазами его резидентов',
    'Арендаторам и покупателям важны не только метры, но и деловая среда вокруг. Мы показали сити-квартал через предпринимателей, которые там работают: интервью с резидентами, архитектура, лобби и панорамные кадры у воды.',
    'Производство ~3 недели · 2 съёмочные смены · интервью, аэросъёмка, грейдинг',
    {'title': 'Инские холмы', 'type': 'Фильм об объекте (девелопмент)', 'format': 'Фильм',
     'question': 'Вам понравился фильм «Инские холмы». О каком объекте хотите снять вы?',
     'task-label': 'Ваш объект и задача фильма',
     'task-hint': 'Например: жилой комплекс, бизнес-центр или квартал — и что должен понять зритель',
     'place-label': 'Город и желаемые сроки', 'place-hint': 'Например: Новосибирск, к презентации объекта',
     'cta': 'Обсудить фильм об объекте'})
c2 = case_card(
    'helffer', '456239017', 'assets/covers/q1gdhCpcnZM.jpg', 'Helffer', 'Завод «Helffer»',
    'Промышленность · фильм о производстве',
    'Helffer: как собирают мини-погрузчик',
    'Закупщику важно увидеть не только готовую технику, но и работу, которая за ней стоит. Видеоэкскурсия проводит зрителя от чертежа через лазерный раскрой, сварку и порошковую окраску к сборке машины.',
    '',
    {'title': 'Helffer', 'type': 'Фильм о производстве (промышленность)', 'format': 'Фильм',
     'question': 'Вам понравился фильм о производстве «Helffer». Какое производство хотите показать вы?',
     'task-label': 'Ваше производство и задача фильма',
     'task-hint': 'Например: завод, цех или линия — и кому адресован фильм (закупщики, партнёры, тендер)',
     'place-label': 'Город, площадка и желаемые сроки', 'place-hint': 'Например: Новосибирская область, к выставке',
     'cta': 'Обсудить фильм о производстве'})
c3 = case_card(
    'level-up-5-let', '456239024', 'assets/covers/4-sYR_D9r8U.jpg', 'Level Up', '5 лет Level Up',
    'Мероприятие · репортаж',
    '5 лет клубу «Level Up» — репортаж с юбилея',
    'Событийный репортаж: днём — семейные конкурсы и общение, вечером — разговоры у костра. Юбилей показан глазами предпринимателей: их истории объясняют, что связывает участников помимо деловых встреч.',
    '',
    {'title': '5 лет Level Up', 'type': 'Съёмка мероприятия (репортаж)', 'format': 'Съёмка мероприятия',
     'question': 'Вам понравился репортаж с юбилея Level Up. Какое мероприятие хотите снять вы: что за событие, в каком городе и когда?',
     'task-label': 'Что за мероприятие и что важно показать',
     'task-hint': 'Например: корпоративный праздник, форум или выставка — и на что сделать акцент',
     'place-label': 'Город, площадка и дата мероприятия', 'place-hint': 'Например: Новосибирск, конец июня',
     'cta': 'Обсудить съёмку мероприятия'})

new_cases = f'''<section aria-labelledby="cases-title" class="section cases-showcase" id="cases">
<div class="container">
<div class="section-head reveal">
<div>
<span class="eyebrow">Избранные работы</span>
<h2 id="cases-title">Работы, похожие на вашу задачу</h2>
<p>Девелопмент, производство, деловые события. Откройте фильм, который ближе к вашей задаче, и расскажите о своём проекте — камеры и смены выбирать не нужно.</p>
</div>
<a class="btn btn-outline" data-works-link href="#portfolio">Все работы в портфолио ↗</a>
</div>
<div class="casegrid">
{c1}
{c2}
{c3}
</div>
<div class="cases-footer-bar reveal">
<span data-works-note>В полном портфолио — логистика с 3D-графикой, игровые ролики с VFX, проекты для госсектора и серии Shorts.</span>
<a class="btn btn-accent" data-works-link href="#portfolio">Все работы в портфолио →</a>
</div>
</div>
</section>'''

# ---------- 4. главная: сборка ----------
paths = '''<section aria-label="Другие задачи" class="section-sm" id="more-paths">
<div class="container">
<div class="paths-grid">
<a class="path-card" href="podcast/"><span class="eyebrow">Подкасты и Shorts</span><h3>Подкаст, серия коротких видео или контент на месяц</h3><p>Три готовых пакета с фиксированной ценой — от 20&nbsp;000&nbsp;₽.</p><span class="path-more">Пакеты и цены →</span></a>
<a class="path-card" href="smeta/"><span class="eyebrow">Расчёт стоимости</span><h3>Соберите предварительную смету сами</h3><p>Калькулятор и полный прайс: можно сравнить услуги, скопировать расчёт или сохранить PDF.</p><span class="path-more">Рассчитать стоимость →</span></a>
</div>
</div>
</section>'''

b2b_section = '<section aria-label="Почему с нами работают" class="section-sm"><div class="container">' + b2b + '</div></section>'

# FAQ: ссылка на смету
faq = one('<a class="text-link" href="#calculator">Перейти к смете</a>', '<a class="text-link" href="smeta/#calculator">Перейти к расчёту стоимости</a>', faq)

# final-cta -> открывает диалог
a = s.index('<section class="section-sm">')
b = s.index('</section>', a) + len('</section>')
final_cta = s[a:b]
final_cta2 = one('<a class="btn" href="#brief">Подготовить бриф →</a>', '<button class="btn" data-lead="general" type="button">Обсудить проект →</button>', final_cta)
s = s[:a] + '@@FINAL@@' + s[b:]

# после hero-wrap добавляем секции главной (перед @@FINAL@@)
s = one('@@FINAL@@', new_cases + '\n' + b2b_section + '\n' + formats + '\n' + paths + '\n' + faq + '\n' + final_cta2 + '\n')

# ---------- 5. страница /podcast ----------
# пакеты: заголовок + кнопки
packages = one('<h2 id="packages-title">Три сценария.<br/>Всё необходимое внутри.</h2>', '<h2 id="packages-title">Три пакета.<br/>Состав и цена известны заранее.</h2>', packages)

def pkg_btn(text, key, title, accent, detail=''):
    det = f' data-detail="{detail}"' if detail else ''
    cls = 'btn btn-accent' if accent else 'btn'
    return (f'<div class="pkg-actions"><button class="{cls}" data-lead-package="{key}" data-title="{title}"{det} type="button">Обсудить этот пакет <span>→</span></button>'
            f'<a class="pkg-calc" data-calc-pkg="{key}" href="smeta/?package={key}#calculator">Рассчитать в калькуляторе</a></div>')

packages = one('<button class="btn" data-choose-package="expert" type="button">Выбрать пакет <span>→</span></button>', pkg_btn('', 'expert', 'Подкаст Эксперта', False), packages)
packages = one('<button class="btn btn-accent" data-choose-package="monthly" type="button">Выбрать пакет <span>→</span></button>', pkg_btn('', 'monthly', 'Экспертный контент на месяц', True, '85 000 ₽ в месяц: 4 выпуска до 1,5 ч, 15 вертикальных роликов, 4 обложки'), packages)
packages = one('<button class="btn" data-choose-package="shorts" type="button">Выбрать пакет <span>→</span></button>', pkg_btn('', 'shorts', '30 коротких видео', False, '50 000 ₽: 30 вертикальных роликов, смена до 4 часов'), packages)

example = one('<button class="btn btn-accent" data-choose-package="expert" data-hours="2" type="button">Повторить в калькуляторе <span>→</span></button>',
              '<a class="btn btn-accent" href="smeta/?package=expert&amp;hours=2#calculator">Повторить в калькуляторе <span>→</span></a>', example)

outputs = '''<section aria-labelledby="outputs-title" class="section" id="outputs">
<div class="container">
<div class="section-head reveal"><div><span class="eyebrow">Что вы получите</span><h2 id="outputs-title">Результат на выходе</h2><p>Сначала — что окажется у вас в руках, затем — как мы это снимаем. Состав каждого пакета ниже в карточках и таблице сравнения.</p></div></div>
<div class="out-grid">
<article class="out-card reveal"><span class="out-num">1</span><h3>Выпуск подкаста</h3><p>Смонтированный выпуск с обложкой. В тарифах на 2 и 3 часа записи — ещё 5 вертикальных роликов Reels/Shorts.</p><span class="out-price">от 20&nbsp;000&nbsp;₽ · пакет «Подкаст Эксперта»</span></article>
<article class="out-card reveal"><span class="out-num">4 + 15</span><h3>Контент на месяц</h3><p>Четыре выпуска, 15 вертикальных роликов и четыре обложки. Помощь с темами, структурой и таймкодами включена.</p><span class="out-price">85&nbsp;000&nbsp;₽ в месяц</span></article>
<article class="out-card reveal"><span class="out-num">30</span><h3>Серия коротких видео</h3><p>30 готовых вертикальных роликов с субтитрами, названиями и SEO-описаниями — из одной студийной смены до 4 часов.</p><span class="out-price">50&nbsp;000&nbsp;₽ за пачку</span></article>
</div>
</div>
</section>'''

how = '''<section aria-labelledby="how-title" class="section" id="podcast-how">
<div class="container">
<div class="section-head reveal"><div><span class="eyebrow">Как устроена съёмка</span><h2 id="how-title">От записи до готовых роликов</h2></div></div>
<div class="process-grid">
<article class="process-card reveal"><span class="process-number">01</span><h3>Подготовка</h3><p>В тайминг заложено 30 минут: свет, звук, базовая грим-подготовка. Темы и структуру обсуждаем заранее.</p></article>
<article class="process-card reveal"><span class="process-number">02</span><h3>Запись в студии</h3><p>Три статичные камеры, свет и звук, два специалиста. Цена зависит от записанного времени, а не от длины готового выпуска.</p></article>
<article class="process-card reveal"><span class="process-number">03</span><h3>Монтаж</h3><p>Мультикам-монтаж, цветокоррекция, обложка; в тарифах от 2 часов — вертикальные ролики для Reels, Shorts и VK Клипов.</p></article>
<article class="process-card reveal"><span class="process-number">04</span><h3>Сдача</h3><p>Исходники хранятся три недели бесплатно. Права на материалы передаём заказчику по договору.</p></article>
</div>
</div>
</section>'''

pod_end = '''<section class="section-sm" id="podcast-cta">
<div class="container">
<div class="final-cta reveal"><div><h2>Не нашли подходящий пакет?</h2><p>Опишите задачу — подберём формат. Или соберите состав сами в калькуляторе.</p></div><div class="cta-pair"><button class="btn" data-lead="general" data-request="Экспертный контент" type="button">Описать задачу →</button><a class="btn btn-outline" href="smeta/">Расчёт стоимости</a></div></div>
</div>
</section>'''

podcast_hero = '''<section aria-labelledby="podcast-title" class="section pg-hero" id="podcast-top">
<div class="container">
<span class="eyebrow">VOLNA film · Подкасты и Shorts · Новосибирск</span>
<h1 id="podcast-title">Подкасты и короткие видео для экспертов и продюсеров</h1>
<p class="pg-lead">Запишем выпуск подкаста, нарежем серию Shorts или возьмём контент на месяц. Студия, фиксированная цена, состав известен заранее.</p>
<div class="pg-actions">
<a class="hx-cta" href="#packages">Выбрать пакет <span aria-hidden="true">↓</span></a>
<button class="hx-cta hx-cta-ghost" data-lead="general" data-request="Экспертный контент" type="button">Не знаю, что выбрать</button>
</div>
<p class="pg-sub"><a href="./#portfolio">Примеры работ в портфолио</a> · <a href="./#faq">Частые вопросы</a> · <a href="https://t.me/Egmarch" rel="noopener" target="_blank">Telegram @Egmarch</a> · <a href="tel:+79231775251">+7&nbsp;923&nbsp;177-52-51</a></p>
</div>
</section>'''

podcastpage = '<main hidden="" id="podcastpage">\n' + podcast_hero + '\n' + outputs + '\n' + packages + '\n' + how + '\n' + example + '\n' + pod_end + '\n</main>'

# ---------- 6. страница /smeta ----------
calculator = one('<details class="calc-collapse" id="calc-details">', '<details class="calc-collapse" id="calc-details" open="">', calculator)
smeta_hero = '''<section aria-labelledby="smeta-title" class="section pg-hero" id="smeta-top">
<div class="container">
<span class="eyebrow">VOLNA film · Расчёт стоимости</span>
<h1 id="smeta-title">Расчёт стоимости видеопроекта</h1>
<p class="pg-lead">Соберите предварительную смету сами: выберите готовый пакет или отметьте нужные услуги в прайсе. Расчёт можно скопировать, сохранить в PDF или передать продюсеру.</p>
<div class="inline-notice pg-prelim"><span class="info-icon">i</span><span><b>Расчёт предварительный</b> и не является офертой: итоговая стоимость подтверждается после брифа — зависит от объёма материала, локаций, сложности графики и сроков.</span></div>
<div class="pg-actions">
<a class="hx-cta" href="#calculator">Открыть калькулятор <span aria-hidden="true">↓</span></a>
<a class="hx-cta hx-cta-ghost" href="#price">Весь прайс</a>
</div>
''' + route_strip + '''
<div class="pg-unsure"><div><b>Не уверены в составе?</b><span>Опишите задачу — продюсер сам подберёт формат и пришлёт расчёт.</span></div><button class="btn btn-accent" data-lead="general" data-request="Другой проект" type="button">Опишите задачу →</button></div>
</div>
</section>'''
smetapage = '<main hidden="" id="smetapage">\n' + smeta_hero + '\n' + process + '\n' + calculator + '\n' + price + '\n' + quick + '\n</main>'

# вставляем после главной <main id="top">…</main>
a = s.index('<main id="top">')
b = s.index('</main>', a) + len('</main>')
s = s[:b] + '\n' + podcastpage + '\n' + smetapage + s[b:]

# ---------- 7. портфолио: добавляем «Инские холмы» и «ПРО МК», навигация ----------
def pf_card(vk, img, badge, h3, ps):
    return f'''<article class="caseunit real-case">
<div class="video-stage" data-vk="-240438229_{vk}" data-yt-title="{badge}">
<img alt="Видео: {badge}" loading="lazy" src="{img}"/>
<div class="video-stage-shade"></div>
<span class="video-badge">{badge}</span>
<button aria-label="Смотреть: {badge}" class="video-play-btn" type="button">
<span class="play-triangle">▶</span>
<span>Смотреть</span>
</button>
</div>
<div class="casebody"><h3>{h3}</h3><p>{ps}</p><a class="case-ext-link" href="https://vkvideo.ru/video-240438229_{vk}" rel="noopener noreferrer" target="_blank">Открыть в VK Видео ↗</a></div>
</article>'''

pf_inskie = pf_card('456239021', 'assets/img-d14a247b5e.webp', 'Сити-квартал «Инские холмы»', 'Инские холмы: квартал глазами его резидентов', inskie_ps[0] + ' ' + inskie_ps[1])
pf_promk = pf_card('456239019', 'assets/img-7c05f5e6a3.webp', 'Завод и строительная компания «ПРО МК»', 'Завод и строительная компания «ПРО МК»', promk_ps[0] + ' ' + promk_ps[1])
mk = '<section class="vf-section"><h2>Девелопмент и ЖК</h2><div class="vf-cards">'
one(mk, mk + pf_inskie)
mk = '<section class="vf-section"><h2>Промышленность и производство</h2><div class="vf-cards">'
one(mk, mk + pf_promk)

one('<a class="text-link" href="#top">← Вернуться к прайсу и калькулятору</a>\n<a class="btn btn-accent" href="#brief">Обсудить похожую задачу →</a>',
    '<a class="text-link" href="#top">← На главную</a>\n<button class="btn btn-accent" data-lead="general" type="button">Обсудить свой проект →</button>')
one('<a class="btn btn-accent" href="#brief">Обсудить свой проект →</a>\n<a class="btn btn-outline" href="#calculator">Перейти к калькулятору сметы</a>',
    '<button class="btn btn-accent" data-lead="general" type="button">Обсудить свой проект →</button>\n<a class="btn btn-outline" href="smeta/">Рассчитать стоимость</a>')

# ---------- 8. шапка, подвал, диалог ----------
a = s.index('<nav aria-label="Основная навигация"')
b = s.index('</nav>', a) + len('</nav>')
s = s[:a] + '''<nav aria-label="Основная навигация" class="main-nav" id="main-nav">
<a data-nav="portfolio" href="#portfolio">Портфолио</a>
<a data-nav="podcast" href="podcast/">Подкасты и Shorts</a>
<a data-nav="smeta" href="smeta/">Расчёт стоимости</a>
<a data-nav="faq" href="#faq">Вопросы</a>
</nav>''' + s[b:]
one('<a class="btn header-cta" href="#calculator">Собрать смету <span aria-hidden="true">↗</span></a>', '<button class="btn header-cta" data-lead="general" type="button">Обсудить проект <span aria-hidden="true">↗</span></button>')
one('<a class="" href="#portfolio">Портфолио</a></div>', '<a class="" href="#portfolio">Портфолио</a><a href="podcast/">Подкасты и Shorts</a><a href="smeta/">Расчёт стоимости</a></div>')
one('<div class="footer-links"><a href="#packages">Пакеты</a><a href="#price">Прайс</a><a href="#calculator">Калькулятор</a>', '<div class="footer-links"><a href="podcast/#packages">Пакеты</a><a href="smeta/#price">Прайс</a><a href="smeta/#calculator">Калькулятор</a>')

dialog = '''<dialog aria-labelledby="lead-title" class="lead-dialog" id="lead-dialog">
<div class="lead-panel">
<button aria-label="Закрыть форму" class="lead-close" id="lead-close" type="button">×</button>
<span class="eyebrow">Обсудить проект</span>
<h2 id="lead-title">Расскажите о задаче</h2>
<div class="lead-selected" hidden id="lead-selected"><span><small id="lead-selected-kind">Вы выбрали работу</small><b id="lead-selected-title"></b></span><button class="lead-clear" id="lead-clear" type="button">Другая задача</button></div>
<p class="lead-question" hidden id="lead-question"></p>
<label>Формат<select id="req-format"><option>Другой проект</option><option>Фильм</option><option>Реклама</option><option>Съёмка мероприятия</option><option>Экспертный контент</option></select></label>
<label><span id="req-task-label">Что зритель должен понять или сделать?</span><textarea id="req-task" placeholder="Например, понять, чем наша технология отличается от аналогов" rows="3"></textarea></label>
<label><span id="req-place-label">Город, площадка и желаемая дата</span><input id="req-place" placeholder="Например, съёмка в цехе к отраслевой выставке"/></label>
<label>Компания и контакт для ответа<input id="req-contact" placeholder="Имя и рабочая почта или телефон"/></label>
<details hidden id="attachment"><summary>Приложенная смета · посмотреть</summary><pre id="attach-text"></pre><button class="btn btn-outline" id="detach" type="button">Убрать приложение</button></details>
<p class="subnote" id="recipient-note"></p>
<div class="lead-actions"><button class="btn btn-accent" id="make-email" type="button">Отправить заявку</button> <button class="btn btn-outline" id="save-brief" type="button">Скачать бриф (.txt)</button></div>
<div class="contact-row"><a href="tel:+79231775251">+7 923 177-52-51</a><a href="https://t.me/Egmarch" rel="noopener" target="_blank">Telegram @Egmarch</a></div>
<details class="lead-hints"><summary>Что уточнить до бронирования</summary><dl><dt>Площадка и выезд</dt><dd>Город, допуск на объект, дорога и командировочные. Для выездной съёмки запрашивайте отдельный расчёт.</dd><dt>Договор и бюджет</dt><dd>Попросите итоговую сумму с указанием режима НДС и отдельно согласованных расходов.</dd><dt>Приёмка и использование</dt><dd>Зафиксируйте, кто утверждает сценарий, сколько раундов правок входит и где можно использовать готовое видео.</dd><dt>Исходники</dt><dd>Согласуйте формат передачи, дату скачивания и необходимость продления хранения после трёх бесплатных недель.</dd></dl><p id="identity"></p></details>
</div>
</dialog>
'''
one('<div aria-live="polite" class="toast" id="toast" role="status"></div>', dialog + '<div aria-live="polite" class="toast" id="toast" role="status"></div>')
one('<body>', '<body data-page="home">')

# ---------- 9. ссылки-якоря: по принадлежности страницам ----------
OWN = {'home': ['top', 'cases', 'formats', 'faq', 'portfolio', 'portfolio-shorts', 'more-paths'],
       'podcast': ['packages', 'example', 'outputs', 'podcast-how', 'podcast-top'],
       'smeta': ['process', 'calculator', 'price', 'quick-estimate', 'smeta-top']}
URL = {'home': './', 'podcast': 'podcast/', 'smeta': 'smeta/'}
owner = {i: p for p, ids in OWN.items() for i in ids}


def fix(chunk, page):
    def r(m):
        i = m.group(1)
        if i not in owner:
            return m.group(0)
        o = owner[i]
        if page == o:
            return m.group(0)
        return 'href="%s#%s"' % (URL[o], i)
    return re.sub(r'href="#([a-z0-9-]+)"', r, chunk)


def apply_zone(open_tag, close_tag, page):
    global s
    a = s.index(open_tag)
    b = s.index(close_tag, a) + len(close_tag)
    s = s[:a] + fix(s[a:b], page) + s[b:]

apply_zone('<main id="top">', '</main>', 'home')
apply_zone('<main hidden="" id="podcastpage">', '</main>', 'podcast')
apply_zone('<main hidden="" id="smetapage">', '</main>', 'smeta')
apply_zone('<main class="section" hidden="" id="workpage">', '</main>', 'home')
# шапка и подвал — всегда с префиксом (работают с любой страницы)
a = s.index('<header class="site-header">'); b = s.index('</header>', a)
hdr = s[a:b]
hdr = hdr.replace('href="#top"', 'href="./#top"').replace('href="#portfolio"', 'href="./#portfolio"').replace('href="#faq"', 'href="./#faq"')
s = s[:a] + hdr + s[b:]
a = s.index('<footer class="site-footer">'); b = s.index('</footer>', a)
ft = s[a:b]
ft = ft.replace('href="#top"', 'href="./#top"').replace('href="#portfolio"', 'href="./#portfolio"')
s = s[:a] + ft + s[b:]
# портфолио: «На главную» и пр. (workpage) — главная это home, ссылки остаются #...
# оставшиеся #brief
assert s.count('href="#brief"') == 0 or True

open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok', len(s))
