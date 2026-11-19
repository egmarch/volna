#!/usr/bin/env python
"""Сборка страниц сайта из index.html (источник правды).

index.html -> сам себя (мета главной, версии css/js)
           -> podcast/index.html  (страница «Подкасты и Shorts»)
           -> youtube/index.html (страница «YouTube для бизнеса»)
           -> smeta/index.html    (страница «Расчёт стоимости»)
           -> sitemap.xml

Страницы отличаются только <title>, description, canonical, og:*, data-page и
относительными путями (../). Весь контент один: роутер в assets/site.js показывает нужный <main>.
Запуск из корня репозитория:  python -I tools/build_pages.py
"""
import hashlib
import os
import re

SITE = 'https://marchen.ru/'
PAGES = {
    'home': dict(
        path='index.html', url=SITE,
        title='VOLNA film — видеопродакшен в Новосибирске: фильмы для бизнеса и госсектора',
        desc='Видеопродакшен VOLNA film в Новосибирске: фильмы для застройщиков, заводов и госсектора, репортажи с мероприятий, реклама с 3D и VFX. Договор и ЭДО, права на видео — заказчику.'),
    'podcast': dict(
        path='podcast/index.html', url=SITE + 'podcast/',
        title='Подкасты и Shorts для экспертов — пакеты и цены · VOLNA film',
        desc='Запись подкастов и серий коротких видео для экспертов и продюсеров в Новосибирске: три готовых пакета с фиксированной ценой от 20 000 ₽ — выпуск подкаста, Shorts, контент на месяц.'),
    'youtube': dict(
        path='youtube/index.html', url=SITE + 'youtube/',
        title='YouTube для бизнеса: продюсирование каналов и шоу · VOLNA film',
        desc='Продюсирование YouTube-каналов для экспертов и компаний: формат, пилотный выпуск, съёмка и монтаж. Разбор собственных каналов и примеры выпусков с участием бизнеса. Новосибирск.'),
    'smeta': dict(
        path='smeta/index.html', url=SITE + 'smeta/',
        title='Расчёт стоимости видеопроизводства — калькулятор и прайс · VOLNA film',
        desc='Предварительный расчёт стоимости видео: калькулятор готовых пакетов, конструктор по этапам и полный прайс VOLNA film. Расчёт можно скопировать или сохранить в PDF.'),
}


def esc(t):
    return t.replace('&', '&amp;').replace('"', '&quot;')


def sub1(pattern, repl, text, flags=0):
    new, n = re.subn(pattern, lambda m: repl, text, count=1, flags=flags)
    assert n == 1, pattern
    return new


def digest(path):
    return hashlib.md5(open(path, 'rb').read()).hexdigest()[:8]


def make(src, key):
    p = PAGES[key]
    t = src
    t = sub1(r'<title>.*?</title>', '<title>%s</title>' % esc(p['title']), t, re.S)
    t = sub1(r'<meta content="[^"]*" name="description"/>', '<meta content="%s" name="description"/>' % esc(p['desc']), t)
    t = sub1(r'<link href="[^"]*" rel="canonical"/>', '<link href="%s" rel="canonical"/>' % p['url'], t)
    t = sub1(r'<meta content="[^"]*" property="og:title"/>', '<meta content="%s" property="og:title"/>' % esc(p['title']), t)
    t = sub1(r'<meta content="[^"]*" property="og:description"/>', '<meta content="%s" property="og:description"/>' % esc(p['desc']), t)
    t = sub1(r'<meta content="[^"]*" property="og:url"/>', '<meta content="%s" property="og:url"/>' % p['url'], t)
    t = re.sub(r'<body data-page="[a-z]+">', '<body data-page="%s">' % key, t, count=1)
    if key != 'home':
        t = re.sub(r'<html lang="ru"[^>]*>', '<html lang="ru" data-root="../">', t, count=1)
        t = re.sub(r'(href|src)="(?:\./|(?=assets/|3d/|podcast/|youtube/|smeta/))', lambda m: '%s="../' % m.group(1), t)
    return t


def main():
    src = open('index.html', encoding='utf-8', newline='').read()
    # версии ресурсов (сброс кэша)
    for f, name in (('assets/site.css', 'site.css'), ('assets/site.js', 'site.js')):
        v = digest(f)
        src = re.sub(r'(assets/%s)\?v=[0-9a-z]+' % re.escape(name), r'\1?v=' + v, src)
    out = {k: make(src, k) for k in PAGES}
    for k, p in PAGES.items():
        os.makedirs(os.path.dirname(p['path']) or '.', exist_ok=True)
        open(p['path'], 'w', encoding='utf-8', newline='').write(out[k])
        print('wrote', p['path'], len(out[k]))
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        '  <url><loc>%s</loc></url>\n' % p['url'] for p in PAGES.values()) + '</urlset>\n'
    open('sitemap.xml', 'w', encoding='utf-8', newline='').write(sm)


if __name__ == '__main__':
    main()
