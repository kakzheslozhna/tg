import {chromium} from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const [w,h,th] of [[1024,700,'dark'],[390,844,'light']]){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,colorScheme:th});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
 await p.evaluate(()=>{localStorage.clear();App.hintSeen=true;document.getElementById('hint').hidden=true;Object.assign(App.cfg,{win:'pvc',light:'led'});document.querySelector('#config [data-type="gable"]').click();});await p.waitForTimeout(2500);
 const over=await p.evaluate(()=>{const t=document.querySelector('.float.tools'),r=t.getBoundingClientRect(),v=document.getElementById('viewport').getBoundingClientRect();return{tools:[Math.round(r.left),Math.round(r.right)],vp:[Math.round(v.left),Math.round(v.right)],scrollW:document.documentElement.scrollWidth,W:innerWidth};});
 console.log(w,JSON.stringify(over),errs.slice(0,3));await p.screenshot({path:`../shots/nar_${w}.png`});await p.close();}
await b.close();
