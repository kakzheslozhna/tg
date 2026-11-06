// node ui_shot.mjs <chrome> <out.png> [w] [h] [js-to-eval-before]
import {chromium} from 'playwright-core';
const [exe,out,w='1470',h='844',pre='']=process.argv.slice(2);
const b=await chromium.launch({executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:1,colorScheme:process.env.THEME||'dark'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(2500);
if(pre){await p.evaluate(pre);await p.waitForTimeout(2200);}
await p.screenshot({path:out});console.log('errors',errs.slice(0,5));await b.close();
