// node shot2.mjs <chrome> <outPrefix> '<json scenes>'
// scene: {name, clicks:[[k,v],...] (k='type' → карточка типа), step:'fill'|'last'|id, view?:'iso'|'top'..., orbit?:[dx,dy] свайп, zoom?:n щипков, clip?:[x,y,w,h]}
import {chromium} from 'playwright-core';
const [exe,out,js]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:850},deviceScaleFactor:2,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
for(const s of JSON.parse(js)){
 for(const [k,v] of s.clicks||[]){await p.evaluate(([k,v])=>{const el=k==='type'?document.querySelector(`#config [data-type="${v}"]`):document.querySelector(`#config [data-k="${k}"][data-v="${v}"]`);if(!el)throw new Error('нет кнопки '+k+'='+v);el.click();},[k,v]);await p.waitForTimeout(250);}
 await p.evaluate(step=>{const ids=App.model.steps.map(s=>s.id);App.setStep(step==='last'?ids.length-1:ids.indexOf(step));},s.step||'last');await p.waitForTimeout(2600);
 if(s.view){await p.evaluate(v=>App.viewer.view(v),s.view);await p.waitForTimeout(1600);}
 await p.mouse.move(640,450);
 if(s.orbit)for(let i=0;i<10;i++)await p.mouse.wheel(s.orbit[0]/10,s.orbit[1]/10);
 if(s.zoom){await p.keyboard.down('Control');for(let i=0;i<s.zoom;i++)await p.mouse.wheel(0,-10);await p.keyboard.up('Control');}
 await p.waitForTimeout(1500);
 await p.screenshot({path:out+s.name+'.png',...(s.clip?{clip:{x:s.clip[0],y:s.clip[1],width:s.clip[2],height:s.clip[3]}}:{})});}
console.log('errors',errs.slice(0,5));await b.close();
