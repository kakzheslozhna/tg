// крупный план узла: node look.mjs <chrome> <out.png> '<cfg>' <step> '<js: (m)=>[[камера],[цель]] в мм>' [ghost=0]
import {chromium} from 'playwright-core';
const [exe,out,cfgJ,step,fn]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:760},deviceScaleFactor:2,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2000);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;App.panel=false;document.getElementById('app').classList.add('closed');Object.assign(App.cfg,JSON.parse(c));document.querySelector(`#config [data-type="${JSON.parse(c).type}"]`).click();},cfgJ);
await p.waitForTimeout(2200);
await p.evaluate(st=>{App.viewer.animate=false;const ids=App.model.steps.map(s=>s.id);App.setStep(ids.indexOf(st));},step);await p.waitForTimeout(1500);
await p.evaluate(src=>{const f=eval(src),[c,t]=f(App.model);App.viewer.lookAt(c.map(v=>v/1000),t.map(v=>v/1000),20);},fn);
await p.waitForTimeout(2500);await p.screenshot({path:out});console.log(errs.length?'ERR '+errs.join(' | '):'ok');await b.close();
