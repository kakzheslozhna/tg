import {chromium} from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [pre,cfgJ,theme='light']=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1470,height:844},deviceScaleFactor:1,colorScheme:theme});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;const C=JSON.parse(c);Object.assign(App.cfg,C);document.querySelector(`#config [data-type="${C.type||'gable'}"]`).click();},cfgJ);await p.waitForTimeout(2600);
await p.evaluate(()=>{const h=[...document.querySelectorAll('#config h5')].find(x=>/Оформление/.test(x.textContent));h.scrollIntoView({block:'start'});});await p.waitForTimeout(300);
await p.screenshot({path:`../shots/${pre}_cfg.png`,clip:{x:0,y:48,width:284,height:500}});
// шаг «Окна и свет»
await p.evaluate(()=>{const i=App.model.steps.findIndex(s=>s.id==='dress');const el=[...document.querySelectorAll('#tab-body [data-step], #tab-body li, #tab-body .step')].find(x=>/Окна|свет|Мягкие/.test(x.textContent.split('\n')[0]));el&&el.click();});await p.waitForTimeout(1500);
await p.screenshot({path:`../shots/${pre}_step.png`});
// смета
await p.evaluate(()=>document.querySelector('#tabs [data-t="bom"]').click());await p.waitForTimeout(700);
await p.evaluate(()=>{const h=[...document.querySelectorAll('#tab-body summary, #tab-body details')].find(x=>/^\s*Оформление/.test(x.textContent));if(h){const d=h.closest('details');if(d)d.open=true;h.scrollIntoView({block:'start'});}});await p.waitForTimeout(400);
await p.screenshot({path:`../shots/${pre}_bom.png`,clip:{x:1066,y:48,width:404,height:796}});
// надёжность
await p.evaluate(()=>{const t=[...document.querySelectorAll('#tabs [data-t]')].find(x=>/Надёжн/.test(x.textContent));t&&t.click();});await p.waitForTimeout(700);
await p.evaluate(()=>{const h=[...document.querySelectorAll('#tab-body *')].find(x=>x.children.length<3&&/Оформление|Мягкие окна закрыты/.test(x.textContent.trim()));h&&h.scrollIntoView({block:'center'});});await p.waitForTimeout(400);
await p.screenshot({path:`../shots/${pre}_calc.png`,clip:{x:1066,y:48,width:404,height:796}});
// подсказка по управлению
await p.evaluate(()=>{document.querySelector('#help-pop').open=true;});await p.waitForTimeout(300);
await p.screenshot({path:`../shots/${pre}_help.png`,clip:{x:620,y:48,width:450,height:420}});
// наведение на окно
console.log('errors',errs.slice(0,5));await b.close();
