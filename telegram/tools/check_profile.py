#!/usr/bin/env python3
# Сверка виджета с профилем песочницы Telegram (tools/profile-v1.json из TelegramMessenger/widget-sandbox):
# теги, атрибуты, CSS-свойства, методы canvas и события — всё должно быть в разрешённых, иначе песочница молча вырежет.
import json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(f'{D}/profile-v1.json'))['tables']
html = open(sys.argv[1] if len(sys.argv) > 1 else f'{D}/../widget.html', encoding='utf-8').read()
bad = []
def allowed(table, key):
    v = table.get(key)
    return set(v.keys()) if isinstance(v, dict) else set(v or [])
els = allowed(P['html'], 'elements'); attrs = allowed(P['html'], 'attributes')
for t in set(re.findall(r'<([a-z][a-z0-9]*)', re.sub(r'<script>.*?</script>', '<script>', html, flags=re.S))):
    if t not in els and t not in ('style', 'script'): bad.append(f'тег <{t}>')   # <style> и <script> — таблицы стилей и скрипт документа, их песочница забирает сама
for a in set(re.findall(r'\s([a-z-]+)=', re.sub(r'<script>.*?</script>', '', html, flags=re.S))):
    if a not in attrs and not a.startswith('data-'): bad.append(f'атрибут {a}')
css = ' '.join(re.findall(r'<style>(.*?)</style>', html, flags=re.S))
props = allowed(P['css'], 'properties')
for pr in set(re.findall(r'[{;]\s*([a-z-]+)\s*:', css)):
    if pr not in props and not pr.startswith('--'): bad.append(f'CSS {pr}')
js = ' '.join(re.findall(r'<script>(.*?)</script>', html, flags=re.S))
cm = allowed(P['canvas'], 'methods'); cp = allowed(P['canvas'], 'properties')
for m in set(re.findall(r'\.(beginPath|moveTo|lineTo|closePath|fill|stroke|clearRect|fillRect|strokeRect|arc|fillText|roundRect|setTransform|drawImage)\(', js)):
    if m not in cm: bad.append(f'canvas {m}()')
for m in set(re.findall(r'\.(lineCap|lineWidth|strokeStyle|fillStyle|globalAlpha|font|textAlign)\s*=', js)):
    if m not in cp: bad.append(f'canvas .{m}')
ev = set(P['events'])
for e in set(re.findall(r'\.on([a-z]+)\s*=', js)):
    if e not in ev: bad.append(f'событие {e}')
print('профиль песочницы:', 'всё разрешено' if not bad else 'НЕ ПРОХОДИТ: ' + ', '.join(sorted(bad)))
sys.exit(1 if bad else 0)
