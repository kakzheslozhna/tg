// тексты всех этапов: node dump_steps.mjs <chrome> '<cfg>'
import {chromium} from 'playwright-core';
const [exe,cfgJ]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1400,height:900}});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(1500);
const out=await p.evaluate(async c=>{localStorage.clear();App.viewer&&(App.viewer.animate=false);Object.assign(App.cfg,JSON.parse(c));document.querySelector(`#config [data-type="${JSON.parse(c).type}"]`).click();
 App.tab='asm';const r=[];for(let i=0;i<App.model.steps.length;i++){App.setStep(i);const el=document.querySelector('#tab-body .scur');r.push(el?el.innerText.replace(/\n+/g,' | '):'—');}return r;},cfgJ);
console.log(out.join('\n\n'));await b.close();
