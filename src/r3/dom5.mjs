// новые функции интерфейса: вкладки мастерской, подсказки «Применить», районы, карточка детали, раскрой
import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync('/Users/egor/Documents/dacha/besedka/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window,d=w.document,errs=[];w.addEventListener('error',e=>errs.push(e.message));w.console.error=(...a)=>{const s=a.join(' ');if(!/getContext|WebGL/.test(s))errs.push('console.error '+s.slice(0,160));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));await sleep(600);
const A=w.App,click=sel=>{const b=d.querySelector(sel);if(!b){errs.push('нет '+sel);return null;}b.click();return b;};
let ok=0;const check=(c,msg)=>{if(c)ok++;else errs.push('✗ '+msg);};
// пергола 3×3 с поликарбонатом: подсказка «глубина 2700» с одним листом
click('#config [data-type="pergola"]');click('#config [data-k="cover"][data-v="pc"]');
click('#tabs [data-t="cut"]');await sleep(2500);
check(A.sug&&A.sug.length>0,'подсказки посчитаны');
const sd=A.sug&&A.sug.find(s=>s.patch.D);check(sd&&sd.why.some(x=>/Поликарбонат/.test(x.n)),'подсказка про поликарбонат');
const btn=d.querySelector('#tab-body [data-apply]');check(!!btn,'кнопка «Применить»');
if(btn){const before=JSON.stringify(A.cfg);btn.click();await sleep(100);check(JSON.stringify(A.cfg)!==before,'подсказка применилась');}
check(d.querySelectorAll('#tab-body details.mat').length>=5,'карточки раскроя');
for(const det of d.querySelectorAll('#tab-body details.mat'))det.open=true;
check(d.querySelectorAll('#tab-body .sheets svg').length>0,'карты листов (SVG)');check(d.querySelectorAll('#tab-body .stick span').length>10,'карты хлыстов');
// районы: из вкладки «Надёжность» и из левой панели
click('#tabs [data-t="calc"]');const vs=d.querySelector('#v-wind');vs.value='5';vs.dispatchEvent(new w.Event('change'));await sleep(50);
check(A.cfg.wind==='5','ветер из вкладки');check(A.model.verify.ok,'ветер V проходит после усилений');check(Object.keys(A.model.fixes).length>0,'есть усиления');
check(/Усилено автоматически/.test(d.querySelector('#tab-body').textContent),'список усилений показан');
const cs=d.querySelector('#c-snow');cs.value='6';cs.dispatchEvent(new w.Event('change'));await sleep(50);check(A.cfg.snow==='6','снег из левой панели');
// число в поле размера
const num=d.querySelector('#config [data-num="W"]');num.value='3 450';num.dispatchEvent(new w.Event('change'));await sleep(50);check(A.cfg.W===3500||A.cfg.W===3400||A.cfg.W===3450,'ширина из поля: '+A.cfg.W);
// мастерская
click('#tabs [data-t="shop"]');for(const k of ['mods','drill','hw','tools']){click(`#tab-body [data-shop="${k}"]`);check(A.shopTab===k&&d.querySelector('#tab-body').textContent.length>200,'мастерская: '+k);}
// карточка детали поверх панели
const p=A.model.parts.find(q=>q.kind==='tube'&&q.mark);A.pick(p);check(d.querySelector('#sheet').classList.contains('open'),'карточка детали открыта');
check(d.querySelector('#sheet-b').textContent.includes(p.name.slice(0,12)),'в карточке — деталь');
click('#sheet-back');check(!d.querySelector('#sheet').classList.contains('open'),'карточка закрыта');
// сравнение типов из левой панели
click('#config [data-open="types"]');check(A.tab==='types'&&d.querySelectorAll('#tab-body [data-cfg]').length>5,'сравнение типов');
// шапка
click('#c-rel');check(A.tab==='calc','значок надёжности → вкладка');click('#c-cut');check(A.tab==='cut','значок раскроя → вкладка');click('#price');check(A.tab==='bom','цена → смета');
// материал каркаса: выбор, сравнение, долговечность, шаги — на всех типах
for(const t of ['gable','mono','pergola','hex','oct']){click(`#config [data-type="${t}"]`);await sleep(300);
 for(const mt of ['steel','hybrid','timber']){click(`#config [data-k="mat"][data-v="${mt}"]`);await sleep(300);
  check(A.cfg.mat===mt&&A.model.mat===mt,`материал ${mt} применён (${t})`);
  check(A.model.verify.ok,`${t} ${mt}: проходит проверку`);
  click('#tabs [data-t="calc"]');await sleep(150);
  const tb=d.querySelector('.cmpm');check(tb&&tb.querySelectorAll('tr').length>=8,`${t} ${mt}: таблица сравнения`);
  const dur=A.model&&w.BM.durability(A.model,A.bom);check(dur.lifeTop>10&&dur.own30>A.bom.total,`${t} ${mt}: долговечность ${dur.lifeTop} лет`);
  click('#tabs [data-t="asm"]');await sleep(100);
  for(let i=0;i<A.model.steps.length;i++){A.setStep(i);const el=d.querySelector('#tab-body .scur');if(!el||/undefined|NaN|null/.test(el.textContent))errs.push(`шаг ${A.model.steps[i].id} ${t} ${mt}: ${el?el.textContent.match(/.{0,40}(undefined|NaN|null).{0,30}/)[0]:'пусто'}`);}
  if(mt!=='steel')check(A.model.steps.some(s=>s.id==='brace')&&d.querySelector('#ttl-sub').textContent.length>5,`${t} ${mt}: подпись`);
  for(const tb of ['bom','cut','shop']){click(`#tabs [data-t="${tb}"]`);await sleep(120);const tx=d.querySelector('#tab-body').textContent;if(/undefined|NaN/.test(tx))errs.push(`вкладка ${tb} ${t} ${mt}: ${tx.match(/.{0,50}(undefined|NaN).{0,30}/)[0]}`);}
  for(const sh of ['drill','hw','tools','mods']){const b=d.querySelector(`[data-shop="${sh}"]`);if(b){b.click();await sleep(60);const tx=d.querySelector('#tab-body').textContent;if(/undefined|NaN/.test(tx))errs.push(`мастерская ${sh} ${t} ${mt}: ${tx.match(/.{0,50}(undefined|NaN).{0,30}/)[0]}`);}}
  for(const pr of A.model.parts.filter(q=>q.wood||q.role==='wKnife'||q.role==='wHead').slice(0,6)){A.pick(pr);const tx=d.querySelector('#sheet-b').textContent;if(/undefined|NaN/.test(tx))errs.push(`карточка ${pr.name}: ${tx.match(/.{0,50}(undefined|NaN).{0,30}/)[0]}`);}
  const bk=d.querySelector('#sheet-back');if(bk)bk.click();
 }}
click('#config [data-k="mat"][data-v="steel"]');
console.log('проверок пройдено',ok,'ошибок',errs.length,errs.slice(0,8));process.exit(0);
