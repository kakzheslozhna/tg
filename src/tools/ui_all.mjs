// все вкладки и размеры: node ui_all.mjs <chrome> <prefix> '<cfg json>' [theme] [w] [h]
import {chromium} from 'playwright-core';
const [exe,pre,cfgJ,theme='dark',w='1470',h='844']=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:1,colorScheme:theme});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2200);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;Object.assign(App.cfg,JSON.parse(c));document.querySelector(`#config [data-type="${JSON.parse(c).type}"]`).click();},cfgJ);await p.waitForTimeout(2600);
const tabs=await p.evaluate(()=>[...document.querySelectorAll('#tabs [data-t]')].map(x=>x.dataset.t));console.log(tabs.join(','));
await p.screenshot({path:`${pre}_main.png`});
const narrow=+w<980;if(narrow)await p.evaluate(()=>{if(document.getElementById('app').classList.contains('closed'))document.getElementById('panel-btn').click();});await p.waitForTimeout(500);
for(const t of tabs){await p.evaluate(t=>{document.querySelector(`#tabs [data-t="${t}"]`).click();},t);await p.waitForTimeout(700);if(narrow)await p.locator('#panel').screenshot({path:`${pre}_${t}.png`});else await p.screenshot({path:`${pre}_${t}.png`});
 const o=await p.evaluate(()=>{const out=[];const bad=[];const W=document.documentElement.clientWidth;for(const e of document.querySelectorAll('#tab-body *')){const r=e.getBoundingClientRect();if(r.width>0&&r.right>W+1&&bad.length<4)bad.push(e.tagName+'.'+e.className+' '+Math.round(r.right));if(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX==='hidden'&&e.clientWidth>0&&bad.length<6)bad.push('clip '+e.tagName+'.'+e.className+' '+(e.textContent||'').slice(0,40));}return bad;});if(o.length)console.log(t,JSON.stringify(o));}
console.log('errors',errs.slice(0,5));await b.close();
