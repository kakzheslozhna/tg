// основание без фундамента: выбор в панели, все вкладки, карточки новых деталей, тексты шагов
import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync('/Users/egor/Documents/dacha/besedka/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window,d=w.document,errs=[];w.addEventListener('error',e=>errs.push(e.message));w.console.error=(...a)=>{const s=a.join(' ');if(!/getContext|WebGL/.test(s))errs.push('console.error '+s.slice(0,200));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));await sleep(600);
const A=w.App;const seen={};let ok=0;const check=(c,msg)=>{if(c)ok++;else errs.push('✗ '+msg);};
const click=sel=>{const b=d.querySelector(sel);if(!b){errs.push('нет '+sel);return null;}b.click();return b;};
const body=()=>d.querySelector('#tab-body').textContent,bad=s=>/undefined|NaN|\[object/.test(s);
const TABS=[...d.querySelectorAll('#tabs [data-t]')].map(b=>b.dataset.t);
const MODES=[['pillar',null,null],['slab','anchor',null],['slab','weight',null],['gas',null,1],['gas',null,2]];
for(const type of ['gable','mono','pergola','hex','oct'])for(const mat of ['steel','hybrid','timber'])for(const [fnd,hold,bl] of MODES){
 click(`#config [data-type="${type}"]`);click(`#config [data-k="mat"][data-v="${mat}"]`);click(`#config [data-k="fnd"][data-v="${fnd}"]`);
 if(hold)click(`#config [data-k="hold"][data-v="${hold}"]`);if(bl)click(`#config [data-k="blocks"][data-v="${bl}"]`);await sleep(20);
 const tag=`${type}/${mat}/${fnd}/${hold}/${bl}`;
 check(A.cfg.fnd===fnd,'выбрано основание '+tag);check(!!A.model.free===(fnd!=='pillar'),'модель без фундамента '+tag);
 if(fnd==='gas'){check(A.model.isFloor&&A.model.y0<-100&&A.model.parts.some(p=>p.role==='tread'),'газоблоки: пол поднят, есть ступени '+tag);const gb=A.model.parts.filter(p=>p.role==='gasBlock'),ys=new Set(gb.map(p=>p.c[1]));check(ys.size===1,'блоки рядом, а не стопкой '+tag);}
 if(mat==='timber'&&A.model.isFloor)check(!A.model.parts.some(p=>p.kind==='tube'&&!p.wood&&!/^post|^newel/.test(p.role||'')&&['baseBeam','floorBeam','joist'].includes(p.role)),'брус: стальных балок и лаг нет '+tag);
 check(!A.model.parts.some(p=>p.role==='jackRod'),'нет шпилек-опор '+tag);check(!A.model.parts.some(p=>p.role==="wKnife"&&mat==="timber"&&A.model.isFloor),"брус: нет сварных ножей "+tag);if(mat!=='steel')check(!A.model.parts.some(p=>/Оголов|Стенка|Щека|седло/.test(p.name)||p.role==='wPlate')&&A.model.parts.some(p=>p.role==='wConn'&&p.grp),'брус: цельные коннекторы, без отдельных пластин '+tag);if(mat!=='steel'&&type!=='hex'&&type!=='oct')check(A.model.parts.some(p=>p.cat==='conn3'||p.cat==='connT')&&A.model.parts.some(p=>p.cat==='connBase'),'брус: коннекторы узлов '+tag);if(mat!=='steel')check(!A.model.parts.some(p=>p.role==='wAngle'||p.role==='wStrap'),'брус: без уголков и ленты '+tag);if(mat==='timber'&&A.model.isFloor)check(A.model.parts.some(p=>p.cat==='connJ')||type==='hex'||type==='oct','брус: коннекторы лаг '+tag);
 if(mat==='hybrid')check(A.model.parts.some(p=>p.role==='postW')&&!A.model.parts.some(p=>p.role==='post'&&p.L>800)&&!A.model.parts.some(p=>p.role==='postR'&&p.L>800),'металл + брус: выше пола брус '+tag);
 check(!bad(d.querySelector('#config').textContent),'панель '+tag);
 for(const t of TABS){click(`#tabs [data-t="${t}"]`);await sleep(5);check(!bad(body()),`вкладка ${t} ${tag}: ${(body().match(/.{30}(undefined|NaN).{30}/)||[''])[0]}`);}
 click('#tabs [data-t="calc"]');await sleep(5);check(/Основание: что выбрать/.test(body()),'сравнение основания '+tag);
 if(fnd!=='pillar')check(/Как считали основание/.test(body()),'пояснение расчёта '+tag);
 click('#tabs [data-t="asm"]');await sleep(5);
 for(let i=0;i<A.model.steps.length;i++){A.setStep(i);const el=d.querySelector('#tab-body .scur'),tx=el?el.textContent:'';check(el&&tx.length>20&&!/undefined|NaN|\bnull\b/.test(tx),`шаг ${A.model.steps[i].id} ${tag}`);
  if(fnd!=='pillar'){const m=tx.match(/.{0,40}(столб(?!ик)|Столб|фундамент|Фундамент|подливк|пескобетон|ножк|ножек).{0,40}/);if(m)seen[m[0].replace(/\d+/g,'#')]=A.model.steps[i].id+' '+tag;}}
 const ps=A.model.parts.filter(p=>['nodePlate','jackPlate','jackFoot','lug','baseBeam','gasBlock','pad','stringer','shoe','sill','sillX','wConn','wHanger','shim'].includes(p.role));
 for(const r of [...new Set(ps.map(p=>p.role))]){A.pick(ps.find(p=>p.role===r));check(!bad(d.querySelector('#sheet-b').textContent),'карточка '+r+' '+tag);}
 d.querySelector('#sheet-x, #sheet .close')?.click?.();
}
console.log('проверок пройдено',ok,'ошибок',errs.length,errs.slice(0,8));console.log('упоминания столбов в режиме без фундамента:',Object.keys(seen).length);for(const k in seen)console.log('  ',seen[k],'→',k);process.exit(0);
