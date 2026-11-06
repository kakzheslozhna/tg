// проверки раскроя: каждый кусок ровно один раз, хлыст не переполнен, в листе без наложений и в границах
const fs=require('fs');const src=fs.readFileSync(__dirname+'/../m4_opt.js','utf8');
const {cut1D,cut2D,sheetColumn,tileLen}=new Function(src+';return{cut1D,cut2D,sheetColumn,tileLen};')();
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
let bad=0,gapSum=0,cases=0,t0=Date.now();
for(let t=0;t<400;t++){
 const n=3+Math.floor(rnd()*60),pcs=[...Array(n)].map((_,i)=>({len:Math.round(200+rnd()*2700),id:i}));
 const stocks=t%3?[{L:3000,pr:433}]:[{L:3000,pr:433},{L:6000,pr:800}],kerf=t%2?3:0;
 const r=cut1D(pcs,stocks,kerf);
 const seen=new Map();for(const b of r.bins){let u=0;b.items.forEach((p,k)=>{u+=p.len+(k?kerf:0);seen.set(p,(seen.get(p)||0)+1);});if(u>b.stock.L+0.5){bad++;console.log('ПЕРЕПОЛНЕН',u,b.stock.L);}}
 for(const p of pcs)if(seen.get(p)!==1){bad++;console.log('КУСОК',p.len,seen.get(p));break;}
 if(stocks.length===1){gapSum+=r.n-r.lb;cases++;}
}
console.log('1D: ошибок',bad,'| хлыстов сверх нижней оценки в среднем',(gapSum/cases).toFixed(3),'| мс',Date.now()-t0);
// 2D
t0=Date.now();let bad2=0;
for(let t=0;t<200;t++){
 const n=1+Math.floor(rnd()*14),rects=[...Array(n)].map((_,i)=>({w:Math.round(150+rnd()*1050),h:Math.round(200+rnd()*1800),id:i}));
 const sheets=t%2?[{W:1250,H:2500,pr:1240}]:[{W:2100,H:6000,pr:5290},{W:2100,H:12000,pr:9990}],kerf=t%3?2:0;
 const r=cut2D(rects,sheets,{kerf,rot:t%4===0});const cnt=new Map();
 for(const b of r.bins){const it=b.items;for(const a of it){cnt.set(a.r,(cnt.get(a.r)||0)+1);
   if(a.x<-0.5||a.y<-0.5||a.x+a.w>b.sheet.W+0.5||a.y+a.h>b.sheet.H+0.5){bad2++;console.log('ВНЕ ЛИСТА',a);}
   const ww=a.rot?a.r.h:a.r.w,hh=a.rot?a.r.w:a.r.h;if(Math.abs(ww-a.w)>0.5||Math.abs(hh-a.h)>0.5){bad2++;console.log('РАЗМЕР',a);}}
  for(let i=0;i<it.length;i++)for(let j=i+1;j<it.length;j++){const a=it[i],c=it[j];if(a.x<c.x+c.w-0.5&&c.x<a.x+a.w-0.5&&a.y<c.y+c.h-0.5&&c.y<a.y+a.h-0.5){bad2++;console.log('НАЛОЖЕНИЕ');}}}
 for(const q of rects)if(cnt.get(q)!==1&&!r.over.includes(q)){bad2++;console.log('ПОТЕРЯН',q);}
}
console.log('2D: ошибок',bad2,'| мс',Date.now()-t0);
// частные случаи
const S={L:2000,lap:200};console.log('колонка 2036 →',sheetColumn(2036,S),'| 3900 →',sheetColumn(3900,S),'| черепица 1110 →',tileLen(1110),'2010 →',tileLen(2010));
const pc=cut2D([{w:1650,h:3680},{w:1650,h:3680}],[{W:2100,H:6000,pr:5290}],{kerf:2});console.log('ПК 2 полосы 1650×3680 →',pc.n,'листа, использовано',(pc.util*100).toFixed(0)+'%');
const pc2=cut2D([{w:1650,h:2960},{w:1650,h:2960}],[{W:2100,H:6000,pr:5290}],{kerf:2});console.log('ПК 2 полосы 1650×2960 →',pc2.n,'лист');
const c8=cut2D([{w:1200,h:1140},{w:1200,h:1140},{w:1200,h:940},{w:1200,h:940},{w:1200,h:690},{w:600,h:690}],[{W:1200,H:2000,pr:1250}],{});console.log('С8 борта →',c8.n,'листа');
