// контактный лист шагов: node steps_sheet.mjs <chrome> <out.png> '<cfg json>' [mid=1 — кадр посреди анимации]
import {chromium} from 'playwright-core';import fs from 'fs';
const [exe,out,cfgJ,mid]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:720},deviceScaleFactor:1,colorScheme:'dark'});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2000);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;App.panel=false;document.getElementById('app').classList.add('closed');Object.assign(App.cfg,JSON.parse(c));document.querySelector(`#config [data-type="${JSON.parse(c).type}"]`).click();},cfgJ);
await p.waitForTimeout(2500);
const n=await p.evaluate(()=>App.model.steps.length),shots=[];
for(let i=0;i<n;i++){
 if(mid){await p.evaluate(i=>{App.setStep(Math.max(0,i-1));},i);await p.waitForTimeout(1600);await p.evaluate(i=>App.setStep(i),i);await p.waitForTimeout(450);}
 else{await p.evaluate(i=>App.setStep(i),i);await p.waitForTimeout(1900);}
 const t=await p.evaluate(i=>(i+1)+'. '+App.model.steps[i].t,i);
 const buf=await p.screenshot({clip:{x:284,y:48,width:816,height:672}});shots.push({t,img:buf.toString('base64')});}
const cols=4,html=`<html><body style="margin:0;background:#111;font:12px -apple-system,sans-serif;color:#eee"><div style="display:grid;grid-template-columns:repeat(${cols},340px);gap:4px;padding:4px">${shots.map(s=>`<div><img src="data:image/png;base64,${s.img}" style="width:340px;display:block"><div style="padding:2px 4px">${s.t}</div></div>`).join('')}</div></body></html>`;
const q=await b.newPage({viewport:{width:cols*344+4,height:300},deviceScaleFactor:1});await q.setContent(html);await q.waitForTimeout(300);
await q.screenshot({path:out,fullPage:true});await b.close();console.log('шагов',n);
