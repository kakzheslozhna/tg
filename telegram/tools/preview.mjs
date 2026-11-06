// Стенд виджета: пузырь Telegram заданной ширины, тема, подставной TelegramWidget с ответом нашего бота.
// node tools/preview.mjs <out-prefix> [width=360] [scheme=light]
import {chromium} from '/Users/egor/Library/Caches/besedka-build/node_modules/playwright-core/index.mjs';
import fs from 'fs';import {createRequire} from 'module';
const require=createRequire(import.meta.url),{answer}=require('../bot/answer.js');
const [out='shot',W='360',scheme='light']=process.argv.slice(2);
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const dark=scheme==='dark',T=dark?{bg:'#212d3b',text:'#f5f5f5',hint:'#7d8b99',button:'#e05a1c',bt:'#ffffff',sec:'#2b3a4b'}:{bg:'#ffffff',text:'#1c1c1e',hint:'#8e8e93',button:'#e05a1c',bt:'#ffffff',sec:'#f0f1f4'};
const widget=fs.readFileSync(new URL('../widget.html',import.meta.url),'utf8');
const b=await chromium.launch({executablePath:CH});const p=await b.newPage({viewport:{width:+W+40,height:700},deviceScaleFactor:2,colorScheme:scheme});
const errs=[],links=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.exposeFunction('__bot',d=>answer(d));await p.exposeFunction('__link',u=>links.push(u));
const html=`<!doctype html><meta charset=utf-8><style>:root{--tg-theme-bg-color:${T.bg};--tg-theme-text-color:${T.text};--tg-theme-hint-color:${T.hint};--tg-theme-button-color:${T.button};--tg-theme-button-text-color:${T.bt};--tg-theme-secondary-bg-color:${T.sec}}html{background:${dark?'#0e1621':'#e9edf1'}}body{margin:20px;width:${W}px;background:${T.bg};border-radius:16px;overflow:hidden}</style><script>window.TelegramWidget={request:d=>window.__bot(d).then(r=>({result:r})),openTelegramLink:u=>window.__link(u),openLink:u=>window.__link(u)};</script>`+widget;
await p.setContent(html);await p.waitForTimeout(400);
const shot=async n=>{await p.screenshot({path:`${out}_${n}.png`,clip:{x:0,y:0,width:+W+40,height:Math.min(700,await p.evaluate(()=>document.body.scrollHeight+40))}});};
await p.click('#q');await p.waitForTimeout(800);await shot('1');
const box=await p.locator('#c').boundingBox();await p.mouse.move(box.x+box.width*.3,box.y+100);await p.mouse.down();for(let i=0;i<12;i++){await p.mouse.move(box.x+box.width*.3+i*12,box.y+100);await p.waitForTimeout(16);}await p.mouse.up();await p.waitForTimeout(900);
await p.click('#t button[data-i="3"]');await p.waitForTimeout(800);await shot('2');
await p.click('#t button[data-i="1"]');await p.click('#m button[data-i="2"]');await p.click('#up');await p.waitForTimeout(900);await shot('3');
await p.click('#t button[data-i="2"]');await p.waitForTimeout(800);await shot('4');
await p.click('#o');await p.waitForTimeout(300);
const h=await p.evaluate(()=>document.body.scrollHeight);
console.log('высота',h,'px · ошибки',JSON.stringify(errs),'· ссылка',links[0]||'—');await b.close();
