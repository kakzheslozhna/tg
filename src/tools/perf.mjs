// длинные задачи главного потока после смены опции и цена кадра: node perf.mjs '<cfg>'
import {chromium} from 'playwright-core';
const CH=process.env.HOME+'/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const cfg=process.argv[2]||'{}';
const b=await chromium.launch({executablePath:CH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1470,height:844}});
await p.goto('file:///Users/egor/Documents/dacha/besedka/index.html');await p.waitForTimeout(4000);
await p.evaluate(()=>{localStorage.clear();window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(e.duration);}).observe({entryTypes:['longtask']});
 const v=App.viewer,o=v.setModel;v.setModel=function(m){const t=performance.now();const r=o.call(this,m);window.__sm=performance.now()-t;return r;};});
await p.waitForTimeout(3000);await p.evaluate(()=>{window.__lt=[];window.__bc=[];const ob=BM.build,obom=BM.bom,os=BM.suggest;BM.build=function(c){const t=performance.now();const r=ob.call(this,c);window.__bc.push(['build',performance.now()-t,new Error().stack.split('\n')[2].trim().slice(0,60)]);return r;};BM.suggest=function(...a){const t=performance.now();const r=os.apply(this,a);window.__bc.push(['SUGGEST',performance.now()-t,'']);return r;};});
const t0=Date.now();await p.evaluate(c=>{Object.assign(App.cfg,JSON.parse(c));const t=performance.now();document.querySelector('#config [data-type="'+(App.cfg.type||'gable')+'"]').click();window.__click=performance.now()-t;},cfg);
await p.waitForTimeout(12000);
const r=await p.evaluate(()=>({click:Math.round(window.__click),setModel:Math.round(window.__sm||0),long:window.__lt.length,sum:Math.round(window.__lt.reduce((a,b)=>a+b,0)),max:Math.round(Math.max(0,...window.__lt)),info:App.viewer.info(),worker:App.Q.worker(),calls:(()=>{const g={};for(const [k,t,w] of window.__bc){const key=k+' '+w.replace(/\(.*$/,'');g[key]=g[key]||[0,0];g[key][0]++;g[key][1]+=t;}return Object.entries(g).map(([k,v])=>k+' ×'+v[0]+' '+Math.round(v[1])+'ms');})()}));
console.log(cfg,JSON.stringify(r));await b.close();
