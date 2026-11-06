#!/usr/bin/env python3
# Сборка виджета для сообщений Telegram: минификация, подстановка имени бота, проверка лимитов сервера
# (32 768 байт исходника и 4096 байт после zlib уровня 9 — так же меряет сервер, иначе INPUT_MEDIA_WIDGET_TOO_LARGE).
import json, os, re, shutil, subprocess, sys, zlib
D = os.path.dirname(os.path.abspath(__file__))
cfg = {'bot': 'besedka_bot', 'app': 'app'}
if os.path.exists(f'{D}/config.json'): cfg.update(json.load(open(f'{D}/config.json')))
esb = os.environ.get('ESBUILD') or shutil.which('esbuild') or next((p for p in [
    '/private/tmp/claude-501/-Users-egor-Documents-dacha/7cc6f629-cce7-4ebb-b8a7-983dac409cc7/scratchpad/r3/node_modules/.bin/esbuild',
    os.path.expanduser('~/Library/Caches/besedka-build/node_modules/.bin/esbuild')] if os.path.exists(p)), None)
if not esb: sys.exit('нужен esbuild: npm i -g esbuild или ESBUILD=/путь')
js = open(f'{D}/src/widget.js', encoding='utf-8').read().replace('__BOT__', cfg['bot']).replace('__APP__', cfg['app'])
r = subprocess.run([esb, '--minify', '--target=es2020', '--loader=js'], input=js, capture_output=True, text=True)
if r.returncode: sys.exit(r.stderr)
mjs = r.stdout.strip()
html = open(f'{D}/src/widget.html', encoding='utf-8').read()
html = re.sub(r'<style>(.*?)</style>', lambda m: '<style>' + re.sub(r'\s*([{};:,>])\s*', r'\1', re.sub(r'\s+', ' ', m.group(1))).replace(';}', '}').strip() + '</style>', html, flags=re.S)
html = re.sub(r'>\s+<', '><', html).replace('__JS__', mjs).strip()
raw, packed = len(html.encode()), len(zlib.compress(html.encode(), 9))
open(f'{D}/widget.html', 'w', encoding='utf-8').write(html)
ok = raw <= 32768 and packed <= 4096
print(f'widget.html: {raw} байт, после zlib-9 {packed} байт из 4096 — {"в лимите" if ok else "ПРЕВЫШЕН ЛИМИТ"}')
sys.exit(0 if ok else 1)
