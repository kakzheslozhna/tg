import {chromium} from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1470,height:844}});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(5000);
const r=await p.evaluate(()=>{const e=document.querySelector('#three canvas').getBoundingClientRect();return [e.x+e.width/2,e.y+e.height/2+60];});
console.log('hit',await p.evaluate(([x,y])=>App.viewer.hitTest(x,y),r));
await p.mouse.move(r[0]-3,r[1]-2);await p.waitForTimeout(100);console.log('state after move',await p.evaluate(()=>App.viewer.navState()));
await p.mouse.move(r[0],r[1]);await p.waitForTimeout(2500);console.log('state later',await p.evaluate(()=>App.viewer.navState()),await p.evaluate(()=>document.getElementById('tip').innerText.slice(0,80)));
await b.close();
