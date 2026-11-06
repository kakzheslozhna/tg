import {chromium} from 'playwright-core';
const [exe,out,t,cv,step,vw,zoom,clip]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:850},deviceScaleFactor:2});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
await p.evaluate(([t,cv])=>{document.querySelector(`#config [data-type="${t}"]`).click();const b=document.querySelector(`#config [data-k="cover"][data-v="${cv}"]`);b&&b.click();},[t,cv]);
await p.waitForTimeout(400);await p.evaluate(step=>{const ids=App.model.steps.map(s=>s.id);App.setStep(step==='last'?ids.length-1:ids.indexOf(step));},step);
await p.waitForTimeout(2600);if(vw!=='-'){await p.evaluate(v=>App.viewer.view(v),vw);await p.waitForTimeout(1600);}
await p.mouse.move(640,450);for(let i=0;i<+zoom;i++){await p.mouse.wheel(0,-8);}
await p.keyboard.down('Control');for(let i=0;i<+zoom;i++)await p.mouse.wheel(0,-10);await p.keyboard.up('Control');
await p.waitForTimeout(1500);const [x,y,w,h]=clip.split(',').map(Number);await p.screenshot({path:out,clip:{x,y,width:w,height:h}});await b.close();
