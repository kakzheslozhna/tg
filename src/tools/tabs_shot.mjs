// снимки вкладок правой панели: node tabs_shot.mjs <chrome> <prefix> '<js setup>' tab1,tab2,...
import {chromium} from 'playwright-core';
const [exe,out,pre,tabs]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1470,height:844},deviceScaleFactor:1,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2200);
if(pre){await p.evaluate(pre);await p.waitForTimeout(2500);}
for(const t of tabs.split(',')){await p.evaluate(t=>{const[k,s]=t.split(':');if(s)App.shopTab=s;document.querySelector(`#tabs [data-t="${k}"]`).click();document.querySelectorAll('#tab-body details.mat').forEach((d,i)=>{if(i<3)d.open=true;});},t);await p.waitForTimeout(500);await p.screenshot({path:out+t.replace(':','_')+'.png',clip:{x:1066,y:0,width:404,height:844}});}
console.log('errors',errs.slice(0,5));await b.close();
