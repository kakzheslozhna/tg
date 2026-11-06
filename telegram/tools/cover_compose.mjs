// Обложка мини-приложения 640×360 (требование BotFather) из cover/cover.html
import {chromium} from '/Users/egor/Library/Caches/besedka-build/node_modules/playwright-core/index.mjs';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const dir=new URL('../cover/',import.meta.url).pathname;
const b=await chromium.launch({executablePath:CH});const p=await b.newPage({viewport:{width:640,height:360},deviceScaleFactor:1});
await p.goto('file://'+dir+'cover.html');await p.waitForTimeout(500);await p.screenshot({path:dir+'besedka_cover_640x360.png'});await b.close();console.log('ok');
