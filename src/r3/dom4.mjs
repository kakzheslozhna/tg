import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync('/Users/egor/Documents/dacha/besedka/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
w.console.error=(...a)=>errs.push('console.error '+a.join(' ').slice(0,200));
await new Promise(r=>setTimeout(r,500));
const A=w.App,d=w.document;
console.log('3D в jsdom (без WebGL) → окно ошибки:',!d.getElementById('noview').hidden);
let n=0;const t0=Date.now();
const click=(sel)=>{const b=d.querySelector(sel);if(!b){errs.push('нет '+sel);return false;}b.click();return true;};
const setRange=(k,v)=>{const el=d.querySelector(`#config [data-dim="${k}"]`);el.value=String(v);el.dispatchEvent(new w.Event('input'));el.dispatchEvent(new w.Event('change'));};
for(const type of Object.keys(w.BM.TYPES)){
 click(`#config [data-type="${type}"]`);
 if(A.cfg.type!==type)errs.push('тип не применился '+type);
 for(const cover of w.BM.TYPES[type].covers)for(const [W,D,H] of (w.BM.TYPES[type].poly?[[3600,3600,2200],[4600,4600,2400]]:[[3000,3000,2200],[2400,4500,2000],[4000,2600,2400]]))for(const base of ['floor','legs'])for(const rail of ['0','750','combo'])for(const truck of ['g42','g3']){
  click(`#config [data-k="cover"][data-v="${cover}"]`);
  setRange('W',W);if(!w.BM.TYPES[type].poly)setRange('D',D);setRange('H',H);setRange('ang',w.BM.TYPES[type].angR[1]);
  for(const [k,v] of [['base',base],['rail',rail],['truck',truck]])click(`#config [data-k="${k}"][data-v="${v}"]`);
  const c=A.cfg;if(c.cover!==cover||c.W!==W||(!w.BM.TYPES[type].poly&&c.D!==D)||c.H!==H||c.base!==base||c.rail!==rail||c.truck!==truck)errs.push('cfg не применился '+JSON.stringify(c));
  if((W===3000||W===3600)&&base==='floor'&&truck==='g42')for(const t of [...d.querySelectorAll('#tabs button')]){try{t.click();n++;}catch(e){errs.push(e.message);}}
  if((W===3000||W===3600)&&rail==="750"){if(base==="floor")click(`#config [data-k="deck"][data-v="wpc"]`);for(const k of ['tube','bolt','weld','angle','box','sheet','poly','cyl','stud']){const p=A.model.parts.find(q=>q.kind===k);for(const q of A.model.parts.filter(q=>['facet','cone','tri'].includes(q.kind)).slice(0,3)){A.pick(q);A.tipHTML(q);}if(p){A.pick(p);A.tipHTML(p);}}
   for(const b of d.querySelectorAll('#ticks button'))b.click();}
 }
}
for(const cv of ['pc','shingle','ondulin','tile']){const b=d.querySelector(`#config [data-k="cover"][data-v="${cv}"]`);if(b)b.click();[...d.querySelectorAll('#config [data-col]')].forEach(e=>e.click());}click('#config [data-k="fill"][data-v="wood"]');[...d.querySelectorAll('#config [data-col]')].forEach(e=>e.click());console.log('цвета:',JSON.stringify(A.colors));d.getElementById('panel-btn').click();d.getElementById('panel-btn').click();
click('#config [data-open="bom"]');
for(const t of [...d.querySelectorAll('#tabs button')]){t.click();n++;for(const e of [...d.querySelectorAll('#tab-body [data-cfg]')].slice(0,2)){e.click();}}
console.log('вкладок отрисовано',n,'ошибок интерфейса',errs.length,[...new Set(errs)].slice(0,6),'сек',((Date.now()-t0)/1000).toFixed(1));
console.log('цена',d.getElementById('sum').textContent,'|',d.getElementById('ttl').textContent,'|',d.getElementById('step-title').textContent,'| панель',A.tab);
process.exit(0);
