// Кадр для обложки мини-приложения: настоящий 3D-рендер без интерфейса. node cover_shot.mjs <out.png> '<cfg>' <night 0|1> '<камера,цель в м>'
import {chromium} from '/Users/egor/Library/Caches/besedka-build/node_modules/playwright-core/index.mjs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [out,cfgJ,night='0',camJ='[[5.2,2.6,6.2],[0,1.45,0]]']=process.argv.slice(2);
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2,colorScheme:'light'});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(3000);
await p.evaluate(c=>{localStorage.clear();App.hintSeen=true;App.panel=false;const C=JSON.parse(c);Object.assign(App.cfg,C);document.querySelector(`#config [data-type="${C.type||'gable'}"]`).click();},cfgJ);
await p.waitForTimeout(2500);
await p.addStyleTag({content:'.top,#config,#panel,.vbar,.timeline,.gizmo,#hint,.cutbar,#tip{display:none!important}.app{display:block!important}#viewport{position:fixed!important;inset:0!important;height:100vh!important}'});
await p.waitForTimeout(600);
await p.evaluate(([n,cam])=>{App.flags.dims=false;App.flags.welds=false;App.flags.night=n==='1';App.viewer.setFlags(App.flags);App.viewer.lookAt(cam[0],cam[1],40);window.dispatchEvent(new Event('resize'));},[night,JSON.parse(camJ)]);
await p.waitForTimeout(3500);await p.screenshot({path:out});await b.close();console.log('ok',out);
