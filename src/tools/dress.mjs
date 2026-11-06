// оформление: node dress.mjs <prefix> '<cfg json>' [night] [views]
import {chromium} from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [pre,cfgJ,night='0',vs='iso,front,close']=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1470,height:844},deviceScaleFactor:1,colorScheme:'light'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;const C=JSON.parse(c);Object.assign(App.cfg,C);document.querySelector(`#config [data-type="${C.type||'gable'}"]`).click();},cfgJ);await p.waitForTimeout(2600);
if(night==='1')await p.evaluate(()=>{document.getElementById('t-night').click();});
await p.waitForTimeout(400);
const V={iso:[[6.4,3.4,7.6],[0,1.3,0]],front:[[0.6,1.6,7.5],[0,1.3,0]],close:[[2.4,2.3,3.2],[0.9,1.9,1.1]],inside:[[0.4,1.2,0.6],[-0.8,2.2,-1.5]],inside2:[[-0.9,1.5,-0.6],[0.9,1.9,1.3]],user:[[-1.1,1.55,-1.0],[0.9,1.75,1.2]],side:[[7.5,1.6,0.4],[0,1.3,0]]};
for(const v of vs.split(',')){await p.evaluate(([a,t])=>App.viewer.lookAt(a,t,40),V[v]);await p.waitForTimeout(1300);await p.screenshot({path:`../shots/${pre}_${v}.png`});}
const info=await p.evaluate(()=>({steps:App.model.steps.map(s=>s.id).join(','),dress:document.querySelector('#config').innerText.split('\n').filter(l=>/окн|Окн|гирлян|лент|Оформ|Свет/.test(l)).slice(0,8)}));
console.log(JSON.stringify(info));console.log('errors',errs.slice(0,5));await b.close();
