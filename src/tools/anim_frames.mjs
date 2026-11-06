// кадры анимации одного шага: node anim_frames.mjs <chrome> <out.png> '<cfg>' <stepId> '<cam json [pos,target]>' t1,t2,...
import {chromium} from 'playwright-core';
const [exe,out,cfgJ,stepId,camJ,ts]=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1000,height:700},deviceScaleFactor:1,colorScheme:'dark'});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2000);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;App.panel=false;document.getElementById('app').classList.add('closed');Object.assign(App.cfg,JSON.parse(c));document.querySelector(`#config [data-type="${JSON.parse(c).type}"]`).click();},cfgJ);
await p.waitForTimeout(2500);
const shots=[];
for(const t of ts.split(',').map(Number)){
 await p.evaluate(([id,cam])=>{const ids=App.model.steps.map(s=>s.id),i=ids.indexOf(id);App.setStep(i-1);},[stepId,camJ]);await p.waitForTimeout(1700);
 await p.evaluate(([id,cam])=>{const ids=App.model.steps.map(s=>s.id),i=ids.indexOf(id);App.viewer.animate=true;App.setStep(i);},[stepId,camJ]);
 if(camJ!=='-')await p.evaluate(cam=>{const c=JSON.parse(cam);App.viewer.lookAt(c[0],c[1],60);},camJ);
 await p.waitForTimeout(t);const buf=await p.screenshot({clip:{x:284,y:48,width:716,height:652}});shots.push({t,img:buf.toString('base64')});}
const html=`<html><body style="margin:0;background:#111;font:12px sans-serif;color:#eee"><div style="display:grid;grid-template-columns:repeat(${shots.length},360px);gap:4px;padding:4px">${shots.map(s=>`<div><img src="data:image/png;base64,${s.img}" style="width:360px;display:block"><div>${s.t} мс</div></div>`).join('')}</div></body></html>`;
const q=await b.newPage({viewport:{width:shots.length*364+4,height:200},deviceScaleFactor:1});await q.setContent(html);await q.waitForTimeout(300);await q.screenshot({path:out,fullPage:true});await b.close();console.log('ok');
