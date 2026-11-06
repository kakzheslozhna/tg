import {chromium} from 'playwright-core';import fs from 'fs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const cfg=process.argv[2]||'{}',act=process.argv[3]||'click';
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1470,height:844}});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(5000);
const s=await p.context().newCDPSession(p);await s.send('Profiler.enable');await s.send('Profiler.setSamplingInterval',{interval:200});await s.send('Profiler.start');
if(act==='click')await p.evaluate(c=>{Object.assign(App.cfg,JSON.parse(c));document.querySelector('#config [data-type="'+(App.cfg.type||'gable')+'"]').click();},cfg);
if(act==='orbit'){await p.evaluate(c=>{Object.assign(App.cfg,JSON.parse(c));document.querySelector('#config [data-type="'+(App.cfg.type||'gable')+'"]').click();},cfg);await p.waitForTimeout(6000);await s.send('Profiler.stop');await s.send('Profiler.start');
 await p.mouse.move(700,420);for(let i=0;i<60;i++){await p.mouse.move(700+i*3,420+((i%10)-5)*2);await p.waitForTimeout(16);}}
await p.waitForTimeout(act==='click'?9000:500);
const {profile}=await s.send('Profiler.stop');
const self={},byId=new Map(profile.nodes.map(n=>[n.id,n]));const dt=profile.timeDeltas;let tot=0;
const cnt={};profile.samples.forEach((id,i)=>{cnt[id]=(cnt[id]||0)+(dt[i]||0);});
for(const [id,t] of Object.entries(cnt)){const n=byId.get(+id),f=n.callFrame,k=(f.functionName||'(anon)')+' '+(f.url.split('/').pop()||'')+':'+f.lineNumber;self[k]=(self[k]||0)+t;tot+=t;}
console.log(cfg,act,'total ms',Math.round(tot/1000));for(const [k,t] of Object.entries(self).sort((a,c)=>c[1]-a[1]).slice(0,22))console.log(String(Math.round(t/1000)).padStart(6),k.slice(0,90));
await b.close();
