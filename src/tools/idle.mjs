import {chromium} from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const url=process.argv[2]||'file:///Users/egor/Documents/dacha/besedka/index.html';
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1470,height:844}});
await p.goto(url);await p.waitForTimeout(6000);
const f0=await p.evaluate(()=>App.viewer.info?App.viewer.info().frame:-1);await p.waitForTimeout(4000);const f1=await p.evaluate(()=>App.viewer.info?App.viewer.info().frame:-1);
console.log('кадров за 4 с покоя:',f1-f0);await b.close();
