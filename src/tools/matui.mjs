// экран выбора материала: node matui.mjs <chrome> <out.png> '<cfg>' [tab]
import {chromium} from 'playwright-core';
const [exe,out,cfgJ,tab]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1.5,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2000);
await p.evaluate(([c,t])=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;Object.assign(App.cfg,JSON.parse(c));document.querySelector(`#config [data-type="${JSON.parse(c).type}"]`).click();},[cfgJ,tab]);
await p.waitForTimeout(1500);
await p.evaluate(t=>{App.viewer.animate=false;const ids=App.model.steps.map(s=>s.id);App.setStep(ids.length-1);const b=document.querySelector(`#tabs [data-t="${t||'calc'}"]`);b&&b.click();},tab);
await p.waitForTimeout(3000);await p.screenshot({path:out});console.log(errs.length?'ERR '+errs.slice(0,3).join(' | '):'ok');await b.close();
