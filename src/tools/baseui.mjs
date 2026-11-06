// панель основания и таблица сравнения: node baseui.mjs <chrome> <out.png> '<cfg>'
import {chromium} from 'playwright-core';
const [exe,out,cfgJ]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1.5,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(1800);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;Object.assign(App.cfg,JSON.parse(c));App.cfg=BM.sanitize(App.cfg);document.querySelector('#config [data-type="'+App.cfg.type+'"]').click();},cfgJ);
await p.waitForTimeout(1500);
await p.evaluate(()=>{document.querySelector('#tabs [data-t="calc"]').click();const t=[...document.querySelectorAll('#tab-body h3')].find(h=>/Основание/.test(h.textContent));if(t)t.scrollIntoView({block:'start'});const c=[...document.querySelectorAll('#config h5')].find(h=>/Основание/.test(h.textContent));if(c)c.scrollIntoView({block:'center'});});
await p.waitForTimeout(800);await p.screenshot({path:out});console.log(errs.length?errs:'ok');await b.close();
