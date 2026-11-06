import {chromium} from 'playwright-core';
const exe=process.argv[2],out=process.argv[3];
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:850},deviceScaleFactor:1});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
for(const [t,cv,step,name,vw] of JSON.parse(process.argv[4])){
 await p.evaluate(([t,cv])=>{document.querySelector(`#config [data-type="${t}"]`).click();const b=document.querySelector(`#config [data-k="cover"][data-v="${cv}"]`);b&&b.click();},[t,cv]);
 await p.waitForTimeout(400);
 await p.evaluate(step=>{const ids=App.model.steps.map(s=>s.id);App.setStep(step==='last'?ids.length-1:ids.indexOf(step));},step);if(vw)await p.evaluate(v=>App.viewer.view(v),vw);
 await p.waitForTimeout(2600);await p.screenshot({path:out+name+'.png'});}
console.log('errors',errs.slice(0,5));await b.close();
