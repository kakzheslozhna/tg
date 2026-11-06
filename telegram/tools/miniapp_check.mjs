// Проверка мини-приложения: index.html открыт как в Telegram (параметры tgWebApp… в адресе, мост TelegramWebviewProxy)
import {chromium} from '/Users/egor/Library/Caches/besedka-build/node_modules/playwright-core/index.mjs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const out=process.argv[2]||'miniapp.png';
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__ev=[];window.TelegramWebviewProxy={postEvent:(t,d)=>window.__ev.push(t+' '+d)};try{localStorage.clear();}catch(e){}});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html#tgWebAppPlatform=ios&tgWebAppVersion=8.0&tgWebAppStartParam=p3600t');
await p.waitForTimeout(6000);
const r=await p.evaluate(()=>({ev:window.__ev,cfg:{type:App.cfg.type,W:App.cfg.W,D:App.cfg.D,mat:App.cfg.mat},tg:App.tg,title:document.title,price:App.bom&&App.bom.total}));
await p.screenshot({path:out});console.log(JSON.stringify(r),'ошибки',JSON.stringify(errs));await b.close();
