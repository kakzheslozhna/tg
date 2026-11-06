import re,subprocess
old=open('viewer.js',encoding='utf-8').read()
mid=old[old.index('/* ---- текстуры ---- */'):old.index('/* ---- сцена из модели ---- */')]
nav=open('nav.js',encoding='utf-8').read().replace('export class TrackpadNav','class TrackpadNav')
head=open('v_head2.js',encoding='utf-8').read()
head=head.replace("new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})","new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})")
head+="renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.__showErr('Видеокарта сбросила WebGL-контекст. Обновите страницу (⌘R).');});\n"
tail=open('v_tail2.js',encoding='utf-8').read().replace('__NAV__',nav)
code=head+mid+tail
imports=re.findall(r'^import .*$',code,re.M)
body=re.sub(r'^import .*$','',code,flags=re.M)
entry="\n".join(i.replace("three/addons/","three/examples/jsm/") for i in imports)+"\ntry{\n"+body+"\n}catch(e){console.error(e);window.__showErr&&window.__showErr(e);}\n"
open('r3/entry.js','w',encoding='utf-8').write(entry)
r=subprocess.run(['./node_modules/.bin/esbuild','entry.js','--bundle','--format=iife','--minify','--target=es2020','--legal-comments=none','--outfile=viewer.bundle.js'],cwd='r3',capture_output=True,text=True)
print(r.stderr[-600:])
sh=open('shell.html',encoding='utf-8').read()
sh=sh.replace(".roof small{font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}",".roof small{font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}\n.roof:last-child:nth-child(odd){grid-column:1/-1;flex-direction:row;align-items:center;gap:10px}.roof:last-child:nth-child(odd) svg{width:96px;flex:none}")
# модель склеивается из исходников в строгом порядке (общий замыкатель BM открывается в m4_head и закрывается в m4_tail)
MODEL_SRC=['m4_head.js','m4_build.js','m4_poly.js','m4_wood.js','m4_base.js','m4_opt.js','m4_dress.js','m4_verify.js','m4_tail.js']
model=''.join(open(f,encoding='utf-8').read() for f in MODEL_SRC);open('model.js','w',encoding='utf-8').write(model);ui=open('ui5.js',encoding='utf-8').read();vb=open('r3/viewer.bundle.js',encoding='utf-8').read()
for x in (model,ui,vb): assert '</script' not in x
h=sh.replace('<!--MODEL-->','<script id="model">\n'+model+'\n</script>').replace('<!--UI-->','<script id="ui">\n'+ui+'\n</script>').replace('<!--VIEWER-->','<script id="viewer">\n'+vb+'\n</script>')
open('/Users/egor/Documents/dacha/besedka/index.html','w',encoding='utf-8').write(h)
print('html',len(h))
# «Беседка.app» рядом: вшитая копия конфигуратора обновляется вместе с index.html (подпись — заново, она локальная)
import os
app='/Users/egor/Documents/dacha/besedka/Беседка.app'
if os.path.isdir(app):
    import shutil;shutil.copyfile('/Users/egor/Documents/dacha/besedka/index.html',app+'/Contents/Resources/index.html')
    subprocess.run(['xattr','-cr',app]);r=subprocess.run(['codesign','--force','--deep','-s','-',app],capture_output=True,text=True);print('app',r.returncode==0 and 'ok' or r.stderr[-200:])
