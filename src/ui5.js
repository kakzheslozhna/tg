/* ================== ИНТЕРФЕЙС ================== */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const rub=n=>fmt(n)+' ₽';
const dec=(v,d=1)=>(+v).toFixed(d).replace('.',',');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural=(n,a,b,c)=>{const k=Math.abs(n)%100,k1=k%10;return k>10&&k<20?c:k1===1?a:k1>1&&k1<5?b:c;};
const KEY='besedka-v4';
const App=window.App={cfg:BM.sanitize({}),colors:{frame:0x3d4148,roof:0x45322e,ond:0x7a2620,sh:0x8a5640,pc:0,fill:0x45322e,wood:0},step:0,tab:'asm',shopTab:'mods',sel:null,viewer:null,panel:innerWidth>=1100,
 flags:{ghost:false,ground:false,xray:false,dims:true,mods:false,welds:true,night:false},layers:{},explode:0,budget:50000,matOpen:{},condOpen:false,hintSeen:false};
BM.LAYERS.forEach(l=>App.layers[l.id]=true);
try{const s=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('besedka-v3')||'null');
 if(s){if(s.cfg)App.cfg=BM.sanitize(Object.assign({},s.cfg,s.snow?{snow:s.snow}:{}));if(s.colors)Object.assign(App.colors,s.colors);if(typeof s.panel==='boolean')App.panel=s.panel;if(s.hintSeen2)App.hintSeen=true;}}catch(e){}
/* ---------- запуск как мини-приложение Telegram: на весь экран, вертикальный свайп не сворачивает окно (он крутит 3D),
   конфигурация из виджета в сообщении (startapp=g3000s: тип, ширина в мм, материал). Без Telegram — ничего не делает ---------- */
{const q=new URLSearchParams(location.hash.slice(1)),u=new URLSearchParams(location.search),tg=q.get('tgWebAppPlatform')||u.get('tgWebAppPlatform');
 if(tg||window.TelegramWebviewProxy){
  const post=(t,d)=>{try{if(window.TelegramWebviewProxy)window.TelegramWebviewProxy.postEvent(t,JSON.stringify(d||{}));else window.parent.postMessage(JSON.stringify({eventType:t,eventData:d||{}}),'https://web.telegram.org');}catch(e){}};
  post('web_app_ready');post('web_app_expand');post('web_app_setup_swipe_behavior',{allow_vertical_swipe:false});
  const m=/^([gmp68])(\d{4})([sht])$/.exec(q.get('tgWebAppStartParam')||u.get('tgWebAppStartParam')||'');
  if(m)App.cfg=BM.sanitize(Object.assign({},App.cfg,{type:{g:'gable',m:'mono',p:'pergola',6:'hex',8:'oct'}[m[1]],W:+m[2],D:+m[2],mat:{s:'steel',h:'hybrid',t:'timber'}[m[3]]}));
  App.tg=tg||'app';}}
const save=()=>{try{const c=Object.assign({},App.cfg);delete c.$;localStorage.setItem(KEY,JSON.stringify({cfg:c,colors:App.colors,panel:App.panel,hintSeen2:App.hintSeen}));}catch(e){}};

/* ---------- конфигуратор (слева) ---------- */

const TIMBER_COLS=[[0xffe9cf,'Натуральный','масло бесцветное'],[0xe0ae78,'Тик','масло-лазурь'],[0xb37a4e,'Орех','масло-лазурь'],[0x7a5238,'Палисандр','масло-лазурь'],[0x8d8a84,'Серый','под старое дерево']];
const FRAME_COLS=[[0x3d4148,'Графит','RAL 7024'],[0x1d1d1f,'Чёрный','RAL 9005'],[0x45322e,'Шоколад','RAL 8017'],[0xe6e6e1,'Белый','RAL 9003']];
const ROOF_COLS=[[0x45322e,'Шоколад','RAL 8017'],[0x3d4148,'Графит','RAL 7024'],[0x5e2129,'Вишня','RAL 3005'],[0x1f4a36,'Зелёный','RAL 6005'],[0x1d1d1f,'Чёрный','RAL 9005']];
const OND_COLS=[[0x7a2620,'Красный','ондулин'],[0x4e3326,'Коричневый','ондулин'],[0x2c4a33,'Зелёный','ондулин'],[0x262626,'Чёрный','ондулин']];
const SH_COLS=[[0x8a5640,'Коричневый','черепица'],[0xa3443a,'Красный','черепица'],[0x7f868e,'Серый','черепица'],[0x4f7d5e,'Зелёный','черепица']];
// поликарбонат: [цвет, непрозрачность]
const PC_COLS=[[[0xdde9f0,0.38],'Прозрачный','светопропускание ~85%'],[[0xb0874f,0.55],'Бронза','мягкая тень'],[[0xf4f4ef,0.78],'Опал (молочный)','рассеянный свет'],[[0x6c7880,0.6],'Дымчатый','как тонированное стекло']];
// тонировка дерева бортов маслом: HSL-множитель к текстуре
const WOOD_COLS=[[[0.08,0.25,0.8,0.18],'Натуральный','#c9a06c'],[[0.06,0.55,0.66,0.12],'Тик','#a8683a'],[[0.05,0.5,0.42,0.1],'Орех','#6b432a'],[[0.6,0.04,0.34,0.08],'Графит','#4a4b4d']];
// сохранённый цвет, которого больше нет в палитре, — на первый из палитры
{const C_=App.colors,fix=(k,L)=>{if(!L.some(x=>x[0]===C_[k]))C_[k]=L[0][0];};fix('frame',FRAME_COLS);if(!TIMBER_COLS.some(x=>x[0]===C_.timber))C_.timber=TIMBER_COLS[0][0];fix('roof',ROOF_COLS);fix('ond',OND_COLS);fix('sh',SH_COLS);fix('fill',ROOF_COLS);if(!(C_.pc>=0&&C_.pc<PC_COLS.length))C_.pc=0;if(!(C_.wood>=0&&C_.wood<WOOD_COLS.length))C_.wood=0;}
const roofFam=c=>c==='ondulin'?'ond':c==='shingle'?'sh':c==='pc'||c==='pcm'?'pc':'roof';
App.applyColors=()=>{const c=App.colors,cv=App.cfg.cover;App.viewer&&App.viewer.setColors(c.frame,cv==='ondulin'?c.ond:cv==='shingle'?c.sh:c.roof,{sh:c.sh,pc:(PC_COLS[c.pc]||PC_COLS[0])[0],fill:c.fill,wood:(WOOD_COLS[c.wood]||WOOD_COLS[0])[0],timber:c.timber});};
// ряд кружков-образцов: key — поле App.colors, idx — хранить индекс (а не цвет)
function swatches(key,list,idx,css){const cur=App.colors[key],on=x=>idx?list.indexOf(x)===cur:x[0]===cur,sel=list.find(on)||list[0];
 return`<div class="sw">${list.map((x,i)=>`<button data-col="${key}" data-v="${idx?i:x[0]}" class="${on(x)?'on':''}" style="background:${css?css(x):hex(x[0])}" title="${x[1]} · ${x[2]}" aria-label="${x[1]}"></button>`).join('')}</div><div class="sw-name">${sel[1]} · ${sel[2]}</div>`;}
const hex=n=>'#'+n.toString(16).padStart(6,'0');
const TYPE_ICON={
 gable:'<svg viewBox="0 0 96 44"><path d="M10 22 48 4l38 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M18 19h60M48 5v14M48 19 30 12M48 19l18-7" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/><path d="M20 19v22M76 19v22" stroke="currentColor" stroke-width="2.6"/><path d="M20 27l6-8M76 27l-6-8" stroke="currentColor" stroke-width="1.5" opacity=".6"/></svg>',
 mono:'<svg viewBox="0 0 96 44"><path d="M8 20 88 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M20 18v23M76 10v31" stroke="currentColor" stroke-width="2.6"/><path d="M20 26l7-7M76 18l-7-6" stroke="currentColor" stroke-width="1.5" opacity=".6"/><path d="M20 18 76 10" stroke="currentColor" stroke-width="1.4" opacity=".45"/></svg>',
 hex:'<svg viewBox="0 0 96 44"><path d="M48 3 16 20h64Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M48 3v17M48 3 34 20M48 3l14 17" stroke="currentColor" stroke-width="1.3" opacity=".5"/><path d="M22 20v21M74 20v21M40 20v19M56 20v19" stroke="currentColor" stroke-width="2.4"/><path d="M22 41 40 39h16l18 2" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".5"/></svg>',
 oct:'<svg viewBox="0 0 96 44"><path d="M48 2 14 20h68Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M48 2v18M48 2 30 20M48 2l18 18M48 2 22 20M48 2l26 18" stroke="currentColor" stroke-width="1.1" opacity=".45"/><path d="M19 20v21M77 20v21M33 20v20M48 20v19M63 20v20" stroke="currentColor" stroke-width="2.2"/></svg>',
 pergola:'<svg viewBox="0 0 96 44"><path d="M4 11h88" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M14 7v4M26 7v4M38 7v4M50 7v4M62 7v4M74 7v4M86 7v4" stroke="currentColor" stroke-width="2" opacity=".5"/><path d="M18 11v30M78 11v30" stroke="currentColor" stroke-width="2.6"/><path d="M18 19l8-8M78 19l-8-8" stroke="currentColor" stroke-width="1.5" opacity=".6"/></svg>'
};
const seg=(k,opts,dis,cols)=>`<div class="seg" style="--c:${cols||Math.min(opts.length,3)}">${opts.map(([v,t,ttl])=>`<button data-k="${k}" data-v="${v}" class="${String(App.cfg[k])===String(v)?'on':''}" ${dis?'disabled':''}${ttl?` title="${esc(ttl)}"`:''}>${t}</button>`).join('')}</div>`;
const swRow=(lbl,key,list,idx,css)=>{const cur=App.colors[key],on=x=>idx?list.indexOf(x)===cur:x[0]===cur;
 return`<div class="swrow"><span>${lbl}</span><div class="sw">${list.map((x,i)=>`<button data-col="${key}" data-v="${idx?i:x[0]}" class="${on(x)?'on':''}" style="background:${css?css(x):hex(x[0])}" title="${esc(x[1])} · ${esc(x[2])}" aria-label="${esc(x[1])}"></button>`).join('')}</div></div>`;};
/* ---------- фоновые расчёты в Web Worker: цены вариантов, подсказки размеров, сравнения материалов и оснований.
   На главном потоке остаются только текущая модель и 3D — клик, слайдер и вращение не ждут десятков пересчётов.
   Очередь по одному: при смене конфигурации устаревшие запросы выбрасываются, не дожидаясь расчёта ---------- */
function wkOps(BM){return{
 price:c=>BM.bom(BM.build(BM.sanitize(c))).total,
 suggest:c=>BM.suggest(c),
 mat:c=>{const m=BM.build(c),b=BM.bom(m),d=BM.durability(m,b),v=m.verify,fr=v.rows.filter(r=>['Каркас','Обрешётка и фермы','Узлы'].includes(r.grp)),wr=fr.reduce((a,r)=>r.util>a.util?r:a,fr[0]);
  return{total:b.total,kg:b.steelKg+(b.woodKg||0),bolts:m.parts.filter(p=>p.kind==='bolt').length,weld:m.weldLen/1000,ok:v.ok,max:wr.util,wn:wr.name.split(':')[0],d};},
 base:c=>{const m=BM.build(c),b=BM.bom(m),d=BM.durability(m,b),f=m.verify.rows.filter(r=>r.grp==='Основание'||r.grp==='Фундамент'),u=f.reduce((a,r)=>Math.max(a,r.util),0),bad=f.filter(r=>r.util>1).map(r=>({name:r.name,util:r.util}));
  return{total:b.total,h:m.F-(m.y0||0),low:d.lifeLow,u,bad,ok:m.verify.ok,n:m.free?m.base.anchors.length:0,kg:m.free?Math.round(m.base.kg*m.base.posts.length):0,pads:m.free?m.base.n:0,fl:m.isFloor};}};}
function wkMain(){const O=wkOps(self.BM);onmessage=e=>{let v,err;try{v=O[e.data.op](e.data.arg);}catch(x){err=String(x&&x.message||x);}postMessage({v,err});};}
const Q=(()=>{let w=null;const q=[];let busy=null;const local=wkOps(BM);
 try{const src=document.getElementById('model').textContent;w=new Worker(URL.createObjectURL(new Blob(['self.window=self;\n',src,'\n;',wkOps.toString(),'\n;',wkMain.toString(),'\nwkMain();'],{type:'text/javascript'})));}catch(e){w=null;}
 const done=(v,err)=>{const b=busy;busy=null;if(b){err?b.rej(err):b.res(v);}pump();};
 const pump=()=>{if(busy||!q.length)return;busy=q.shift();
  if(w)w.postMessage({op:busy.op,arg:busy.arg});
  else (window.requestIdleCallback||setTimeout)(()=>{let v,err;try{v=local[busy.op](busy.arg);}catch(x){err=x;}done(v,err);});};   // без воркера: по одному расчёту в простое
 if(w){w.onmessage=e=>done(e.data.v,e.data.err);w.onerror=e=>{e.preventDefault&&e.preventDefault();try{w.terminate();}catch(x){}w=null;if(busy){q.unshift(busy);busy=null;}pump();};}
 return{worker:()=>!!w,call:(op,arg,tag)=>new Promise((res,rej)=>{q.push({op,arg,res,rej,tag});pump();}),drop:tag=>{for(let i=q.length-1;i>=0;i--)if(q[i].tag===tag){q[i].rej('drop');q.splice(i,1);}}};})();
App.Q=Q;
// цены вариантов досчитываются в фоне, чтобы клик отзывался мгновенно
const priceCache=new Map();
const pkey=patch=>JSON.stringify(BM.sanitize(Object.assign({},App.cfg,patch,{$:undefined})));
function priceTag(patch,f){const k=pkey(patch);return`<span data-price='${esc(JSON.stringify(patch))}' data-f="${f||'r'}">${priceCache.has(k)?fmtP(priceCache.get(k),f):'…'}</span>`;}
const fmtP=(v,f)=>{if(f==='b')return fmt(v);if(f==='d'){const d=v-App.bom.total;return Math.abs(d)<150?'≈':(d>0?'+':'−')+dec(Math.abs(d)/1000)+' т';}return f==='k'?fmt(v/1000)+' т.₽':rub(v);};
let priceJob=null;
function fillPrices(){if(priceJob)return;const el=[...document.querySelectorAll('[data-price]')].find(e=>e.textContent==='…');if(!el)return;
 const k=pkey(JSON.parse(el.dataset.price));if(priceCache.has(k)){paintPrice(k);return fillPrices();}
 priceJob=1;Q.call('price',JSON.parse(k),'opt').then(v=>{if(priceCache.size>300)priceCache.clear();priceCache.set(k,v);priceJob=null;paintPrice(k);fillPrices();},()=>{priceJob=null;});}
function paintPrice(k){const v=priceCache.get(k);document.querySelectorAll('[data-price]').forEach(e=>{if(pkey(JSON.parse(e.dataset.price))!==k)return;e.textContent=fmtP(v,e.dataset.f);if(e.dataset.f==='b'){const p=e.closest('td');if(p)p.classList.add(v<=App.budget?'ok':v<=App.budget*1.2?'warn':'n0');}});}
function priceOf(patch){const c=BM.sanitize(Object.assign({},App.cfg,patch,{$:undefined})),k=JSON.stringify(c);if(!priceCache.has(k)){if(priceCache.size>300)priceCache.clear();priceCache.set(k,BM.bom(BM.build(c)).total);}return priceCache.get(k);}
const DIMS=[['W','Ширина (фасад)'],['D','Глубина'],['H','Высота в свету']],DIMS_P=[['W','Диаметр по углам'],['H','Высота в свету']];
const TYPE_SHORT={gable:'Классика',mono:'Модерн',pergola:'Пергола',hex:'6 граней',oct:'8 граней'};
const SNOW_N=['I','II','III','IV','V','VI','VII','VIII'],WIND_K=['1a','1','2','3','4','5','6','7'],WIND_N=['Iа','I','II','III','IV','V','VI','VII'];
const snowOpts=v=>SNOW_N.map((n,i)=>`<option value="${i+1}" ${String(i+1)===String(v)?'selected':''}>${n} — ${dec(BM.SNOW[i+1])} кПа${i===2?' (Москва)':i===1?' (юг)':i===3?' (Урал)':''}</option>`).join('');
const windOpts=v=>WIND_K.map((k,i)=>`<option value="${k}" ${k===String(v)?'selected':''}>${WIND_N[i]} — ${dec(BM.WIND[k],2)} кПа${k==='1'?' (Москва)':k==='2'?' (Петербург)':k==='3'?' (побережья)':''}</option>`).join('');
const condSummary=()=>{const c=App.cfg;return`снег ${SNOW_N[+c.snow-1]} · ветер ${WIND_N[WIND_K.indexOf(String(c.wind))]} · ${c.truck==='g42'?'Газель 4,2':'Газель 3'} · ${c.metal==='base'?'металлобаза':'Лемана'}`;};
function renderConfig(){
 const c=App.cfg,m=App.model,T=BM.TYPES[c.type],rf=roofFam(c.cover),metalFill=c.fill!=='wood';
 const dims=(T.poly?DIMS_P:DIMS).map(([k,t])=>{const [lo,hi,st]=T.poly&&k==='W'?BM.LIM.P:BM.LIM[k];return slider(k,t,lo,hi,st,c[k],'мм');}).join('')+slider('ang','Уклон кровли',Math.max(T.angR[0],BM.COVERS[c.cover].min),T.angR[1],1,c.ang,'°');
 const tNote=m.split?`Портал не влезает в кузов целиком — делится пополам и стыкуется на фланцах.`:'Все сварные модули едут целиком.';
 $('#config').innerHTML=`
 <div class="sec"><h5>Тип <a href="#" data-open="types">сравнить типы</a></h5><div class="types">${Object.keys(BM.TYPES).map(t=>`<button class="type ${c.type===t?'on':''}" data-type="${t}" title="${esc(BM.TYPES[t].t)} — ${esc(BM.TYPES[t].sub)}">${TYPE_ICON[t]}<b>${TYPE_SHORT[t]}</b></button>`).join('')}</div><div class="desc"><b>${esc(T.t)}</b> — ${esc(T.sub)}</div></div>
 <div class="sec"><h5>Материал каркаса <a href="#" data-open="calc">сравнить</a></h5><div class="list">${Object.keys(BM.MATS).map(k=>`<button data-k="mat" data-v="${k}" class="${(c.mat||'steel')===k?'on':''}" title="${esc(BM.MATS[k].sub)}"><i class="rd"></i><span>${esc(BM.MATS[k].t)}</span><small class="d">${(c.mat||'steel')===k?'':priceTag({mat:k},'d')}</small></button>`).join('')}</div><div class="desc">${esc(BM.MATS[c.mat||'steel'].sub)}</div>${(c.mat||'steel')==='steel'?'':`<div class="lbl">Брус</div>${seg('wood',Object.keys(BM.WOODS).map(k=>[k,BM.WOODS[k].s,BM.WOODS[k].tag]))}`}</div>
 <div class="sec"><h5>Размеры</h5>${dims}<div class="note" id="dim-note">${dimNote()}</div></div>
 <div class="sec"><h5>Кровля</h5><div class="list">${T.covers.map(k=>`<button data-k="cover" data-v="${k}" class="${c.cover===k?'on':''}" title="${esc(BM.COVERS[k].t)} · уклон от ${BM.COVERS[k].min}° · служит ${esc(BM.COVERS[k].life)}"><i class="rd"></i><span>${esc(BM.COVERS[k].s)}</span><small class="d">${c.cover===k?'':priceTag({cover:k},'d')}</small></button>`).join('')}</div></div>
 <div class="sec"><h5>Пол и борта</h5>${seg('base',[['floor','С полом'],['legs','На ножках','без пола: геотекстиль и щебень']],c.fnd==='gas'||(c.mat==='timber'&&c.fnd!=='pillar'))}
  ${c.base==='floor'?`<div class="lbl">Настил</div>${seg('deck',[['pine','Хвоя'],['larch','Лиственница'],['wpc','ДПК']])}`:''}
  <div class="lbl">Борта, мм</div>${seg('rail',[['0','Нет'],['450','450'],['750','750'],['1000','1000'],['1200','1200'],['combo','Комбо','зад 1200 · бока 1000 · перед 750']],false,3)}
  ${c.rail==='0'?'':`<div class="lbl">Заполнение бортов</div>${seg('fill',[['euro','Штакетник'],['prof','Профлист'],['wood','Дерево']])}`}
  ${T.poly?'<div class="note">Передняя грань — вход, без борта.</div>':''}</div>
 <div class="sec"><h5>Оформление</h5><div class="lbl">Окна и сетка</div>${seg('win',[['0','Нет'],['pvc','Окна ПВХ','мягкие окна 0,7 мм снаружи стоек, на скобах; вход скатывается'],['net','Сетка','москитная сетка изнутри, на липучке'],['both','Окна + сетка','ПВХ снаружи, сетка изнутри: летом окна скатаны, сетка закрыта']],false,2)}
  <div class="lbl">Свет по контуру</div>${seg('light',[['0','Нет'],['belt','Гирлянда','белт-лайт с лампами E27, провисом между стойками'],['led','LED-лента','12 В в алюминиевом профиле по низу балок']])}
  <div class="note">${dressNote()}</div></div>
 <div class="sec"><h5>Основание <a href="#" data-open="calc">сравнить</a></h5>${seg('fnd',Object.keys(BM.FNDS).map(k=>[k,BM.FNDS[k].t,BM.FNDS[k].sub]))}
  ${c.fnd==='pillar'?'':`${c.fnd==='gas'?`<div class="lbl">Блоков на опору, рядом</div>${seg('blocks',[[1,'1 блок','600×300'],[2,'2 блока','600×600']])}`:`<div class="lbl">От ветра держит</div>${seg('hold',Object.keys(BM.HOLDS).map(k=>[k,BM.HOLDS[k].t,BM.HOLDS[k].sub]))}`}
  <div class="lbl">Грунт на участке</div>${seg('soil',Object.keys(BM.SOILS).map(k=>[k,BM.SOILS[k].s[0].toUpperCase()+BM.SOILS[k].s.slice(1),BM.SOILS[k].t]))}`}
  <div class="note">${baseNote()}</div></div>
 <div class="sec"><h5>Цвета</h5>${swRow(c.mat==='steel'||!c.mat?'Каркас':'Сталь','frame',FRAME_COLS)}${(c.mat||'steel')==='steel'?'':swRow('Брус','timber',TIMBER_COLS)}${rf==='pc'?swRow('Кровля','pc',PC_COLS,true,x=>hex(x[0][0])):rf==='sh'?swRow('Кровля','sh',SH_COLS):rf==='ond'?swRow('Кровля','ond',OND_COLS):swRow('Кровля','roof',ROOF_COLS)}${c.rail==='0'?'':metalFill?swRow('Борта','fill',ROOF_COLS):swRow('Борта','wood',WOOD_COLS,true,x=>x[2])}</div>
 <div class="sec"><h5>Площадка и покупка</h5><details class="cond" id="cond" ${App.condOpen?'open':''}><summary><b>Условия</b><span>${condSummary()}</span></summary><div class="body">
  <div class="lbl" style="margin-top:2px">Снеговой район (СП 20.13330)</div><select id="c-snow">${snowOpts(c.snow)}</select>
  <div class="lbl">Ветровой район</div><select id="c-wind">${windOpts(c.wind)}</select>
  <div class="lbl">Перевозка модулей</div>${seg('truck',[['g42','Газель 4,2 м'],['g3','Газель 3 м']])}
  <div class="lbl">Где покупаем металл</div>${seg('metal',[['lemana','Лемана ПРО'],['base','Металлобаза','дешевле розницы на 30–40%']])}
  <div class="note">${tNote}${App.angNote?` <span class="warn">${esc(App.angNote)}</span>`:''}</div></div></details></div>
 <div class="sec"><a href="#" data-open="bom" class="small">Материалы ${rub(App.bom.total)} — смета →</a></div>`;
 const cf=$('#config');
 cf.querySelectorAll('[data-k]').forEach(el=>el.onclick=()=>{App.cfg[el.dataset.k]=el.dataset.v;App.cfg=BM.sanitize(App.cfg);rebuild(true);});
 cf.querySelectorAll('[data-type]').forEach(el=>el.onclick=()=>{App.cfg.type=el.dataset.type;App.cfg=BM.sanitize(App.cfg);rebuild(true);});
 cf.querySelectorAll('[data-dim]').forEach(el=>{const k=el.dataset.dim,num=cf.querySelector(`[data-num="${k}"]`);
  el.oninput=()=>{App.cfg[k]=+el.value;if(k==='ang')App.cfg.angType=App.cfg.type;num.value=k==='ang'?el.value:fmt(+el.value);schedule();};
  el.onchange=()=>{App.cfg[k]=+el.value;flush();renderConfig();renderTab();};});
 cf.querySelectorAll('[data-num]').forEach(el=>{const k=el.dataset.num,rng=cf.querySelector(`[data-dim="${k}"]`);
  const apply=()=>{const v=parseInt(String(el.value).replace(/\D/g,''),10);if(!isFinite(v)){el.value=k==='ang'?rng.value:fmt(+rng.value);return;}const lo=+rng.min,hi=+rng.max,st=+rng.step||1;const q=Math.max(lo,Math.min(hi,Math.round(v/st)*st));App.cfg[k]=q;if(k==='ang')App.cfg.angType=App.cfg.type;rebuild(true);};
  el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();el.blur();}else if(e.key==='Escape'){el.value=k==='ang'?rng.value:fmt(+rng.value);el.blur();}};
  el.onchange=apply;el.onfocus=()=>el.select();});
 cf.querySelectorAll('[data-col]').forEach(el=>el.onclick=()=>{App.colors[el.dataset.col]=+el.dataset.v;save();applyColors();renderConfig();});
 const cd=$('#cond');cd.ontoggle=()=>{App.condOpen=cd.open;};
 $('#c-snow').onchange=e=>{App.cfg.snow=e.target.value;rebuild(true);};
 $('#c-wind').onchange=e=>{App.cfg.wind=e.target.value;rebuild(true);};
 fillPrices();
}
function slider(k,t,lo,hi,st,v,u){return`<div class="sl"><div class="sl-h"><span>${t}</span><span><input type="text" inputmode="numeric" data-num="${k}" value="${k==='ang'?v:fmt(v)}" aria-label="${t}, ${u}"><span class="u">${u}</span></span></div><input type="range" data-dim="${k}" min="${lo}" max="${hi}" step="${st}" value="${v}" aria-label="${t}" title="${k==='ang'?lo+'–'+hi+'°':fmt(lo)+' – '+fmt(hi)+' мм'}"></div>`;}
function dimNote(){const m=App.model;if(m.poly)return`${m.poly} граней · сторона ${fmt(m.side)} мм · ${dec(m.poly/2*m.R*m.R*Math.sin(2*Math.PI/m.poly)/1e6)} м² · верх +${fmt(m.dims.top)}`;return`${dec(m.W*m.D/1e6)} м² · ${m.nP} ${plural(m.nP,'портал','портала','порталов')}, шаг ${fmt(m.sP)} · ${m.mat&&m.mat!=='steel'?'балка':'ригель'} ${m.beam?m.beam.sec.replace(/^w/,'').replace(/x/g,'×'):''} · верх +${fmt(m.dims.top)}`;}
// ползунки: перестраиваем модель не чаще ~8 раз в секунду, панель не перерисовываем, чтобы не сбить жест
let schedT=null,schedLast=0;
function schedule(){const now=performance.now(),run=()=>{schedT=null;schedLast=performance.now();rebuild(true,true);};if(schedT)return;const wait=Math.max(0,120-(now-schedLast));schedT=setTimeout(run,wait);}
function flush(){if(schedT){clearTimeout(schedT);schedT=null;}rebuild(true,true);}
function applyColors(){App.applyColors();}
function setPanel(open){App.panel=open;$('#app').classList.toggle('closed',!open);$('#panel-btn').classList.toggle('on',open);save();}
$('#panel-btn').onclick=()=>setPanel(!App.panel);
setPanel(App.panel);
App.checks=()=>App.chk||(App.chk=BM.checks(App.model));
const openTab=t=>{App.tab=t;closeSheet();setPanel(true);renderTab();};
$('#c-rel').onclick=()=>openTab('calc');$('#c-cut').onclick=()=>openTab('cut');$('#price').onclick=()=>openTab('bom');

// подсказки по размерам — в фоне, после паузы в действиях (полная смета на каждый соседний вариант)
let sugT=null,sugTok=0;
function scheduleSug(){if(sugT)clearTimeout(sugT);const tok=++sugTok;sugT=setTimeout(()=>{sugT=null;Q.call('suggest',Object.assign({},App.cfg),'opt').then(r=>{if(tok!==sugTok)return;App.sug=r;updateChips();if(App.tab==='cut'&&!$('#sheet').classList.contains('open'))renderTab();},()=>{});},700);}
function updateChips(){
 const v=App.calc,b=App.bom,eff=b.waste.of?1-b.waste.pct:1,rel=$('#c-rel'),cut=$('#c-cut');
 const worst=v.rows.reduce((a,r)=>r.util>a.util?r:a,{util:0});
 rel.className='chip'+(v.ok?'':' bad');rel.innerHTML=v.ok?`<i></i><span>Надёжно</span>`:`<i></i><span>Не проходит</span>`;
 rel.title=v.ok?`Все проверки пройдены. Самый нагруженный элемент: ${worst.name} — ${Math.round(worst.util*100)}%`:'Есть перегруженные элементы — откройте «Надёжность»';
 cut.className='chip'+(eff>=0.85?'':eff>=0.7?' warn':' bad');cut.innerHTML=`<i></i><span>Раскрой</span><small>${Math.round(eff*100)}%${App.sug&&App.sug.length?' · совет':''}</small>`;
 cut.title=`В дело идёт ${Math.round(eff*100)}% купленного материала, в обрезки — ${rub(b.waste.rub)}`;
}
function rebuild(keepStep,light){
 const atEnd=!App.model||App.step>=App.model.steps.length-1,prevId=App.model&&App.model.steps[App.step]&&App.model.steps[App.step].id;
 App.cfg=BM.sanitize(Object.assign({},App.cfg,{$:undefined}));
 const want=App.cfg.ang;App.model=BM.build(App.cfg);App.cfg=Object.assign({},App.model.cfg);delete App.cfg.$;App.bom=BM.bom(App.model);App.chk=null;App.calc=App.model.verify;
 App.angNote=want&&App.cfg.ang<want?`Уклон снижен до ${App.cfg.ang}°, чтобы модули влезли в «${App.model.truckSpec.t}».`:want&&App.cfg.ang>want?`Уклон увеличен до ${App.cfg.ang}° — так рёбра выдерживают снег района.`:'';
 App.byId={};App.model.parts.forEach(p=>App.byId[p.id]=p);
 const ns=App.model.steps;
 if(!keepStep||atEnd)App.step=ns.length-1;else{const k=ns.findIndex(s=>s.id===prevId);App.step=k>=0?k:Math.min(App.step,ns.length-1);}
 App.sel=null;save();
 const m=App.model,t=App.bom.total;
 {const ts=$('#ttl-sub');if(ts)ts.textContent=m.mat==='timber'?'весь каркас из бруса · сталь только в узлах':m.mat==='hybrid'?'сталь до пола · выше пола брус':'металл · сварка дома · на участке только болты';}
 $('#ttl').textContent=m.poly?`Беседка ${BM.TYPES[m.type].t.toLowerCase()} Ø${(m.W/1000).toLocaleString('ru-RU')} м`:`Беседка ${(m.W/1000).toLocaleString('ru-RU')} × ${(m.D/1000).toLocaleString('ru-RU')} м · ${BM.TYPES[m.type].t}`;
 document.title=m.poly?`Беседка ${BM.TYPES[m.type].t} Ø${m.W/1000} м`:`Беседка ${m.W/1000}×${m.D/1000} — ${BM.TYPES[m.type].t}`;
 $('#sum').textContent='≈ '+rub(t);
 const B=App.budget,over=t-B;$('#sumnote').innerHTML=over<=0?`<span class="ok">в бюджете ${fmt(B/1000)} т, запас ${fmt(-over)} ₽</span>`:`бюджет ${fmt(B/1000)} т · <span class="warn">+${fmt(over)} ₽</span>`;
 App.sug=null;Q.drop('opt');priceJob=null;updateChips();scheduleSug();
 if(App.viewer){App.viewer.setModel(App.model);applyColors();App.refreshCut&&App.refreshCut();}
 if(light){const n=$('#dim-note');if(n)n.textContent=dimNote();}else renderConfig();
 setupStepUI();if(!light||App.tab==='asm')renderTab();
}
$('#config').addEventListener('click',e=>{const a=e.target.closest('[data-open]');if(a){e.preventDefault();openTab(a.dataset.open);}});

/* ---------- шаги сборки (шкала внизу 3D) ---------- */
function setupStepUI(){
 $('#ticks').innerHTML=App.model.steps.map((s,i)=>`<button data-i="${i}" title="${i+1}. ${esc(s.t)}" aria-label="Шаг ${i+1}: ${esc(s.t)}">${i+1}</button>`).join('');
 $('#ticks').querySelectorAll('button').forEach(t=>t.onclick=()=>{stopPlay();setStep(+t.dataset.i);});
 setStep(App.step,true);
}
function setStep(i,silent){
 const n=App.model.steps.length;App.step=Math.max(0,Math.min(n-1,i));
 const s=App.model.steps[App.step];
 $('#step-title').textContent=`${App.step+1}/${n} · ${s.t}`;
 $('#step-sub').textContent=App.step===n-1?'Готовая беседка · ▶ — показать всё с мастерской':(App.stepFacts?App.stepFacts(s):'');
 $('#ticks').querySelectorAll('button').forEach((t,k)=>t.className=k<App.step?'done':k===App.step?'cur':'');
 if(App.viewer)App.viewer.setStep(App.step,!silent);
 if(!silent&&App.tab==='asm')renderTab();
}
App.setStep=setStep;
const PLAY='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',PAUSE='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
let playT=null;
function stopPlay(){if(playT){clearTimeout(playT);playT=null;}$('#s-play').innerHTML=PLAY;}
$('#s-prev').onclick=()=>{stopPlay();setStep(App.step-1);};$('#s-next').onclick=()=>{stopPlay();setStep(App.step+1);};
$('#s-play').onclick=()=>{if(playT){stopPlay();return;}
 if(App.step>=App.model.steps.length-1)setStep(0);$('#s-play').innerHTML=PAUSE;
 const next=()=>{if(App.step>=App.model.steps.length-1){stopPlay();return;}setStep(App.step+1);playT=setTimeout(next,Math.max(1500,(App.viewer&&App.viewer.animMs||0)+900));};
 playT=setTimeout(next,700);};

/* ---------- инструменты 3D ---------- */
function tog(id,key){const b=$(id);b.classList.toggle('on',App.flags[key]);b.onclick=()=>{App.flags[key]=!App.flags[key];b.classList.toggle('on',App.flags[key]);App.viewer&&App.viewer.setFlags(App.flags);};}
function chk(id,key){const b=$(id);b.checked=App.flags[key];b.onchange=()=>{App.flags[key]=b.checked;App.viewer&&App.viewer.setFlags(App.flags);};}
tog('#t-welds','welds');tog('#t-dims','dims');tog('#t-night','night');tog('#t-mods','mods');chk('#t-xray','xray');chk('#t-ghost','ghost');chk('#t-ground','ground');
// разрез: поперёк (по глубине) или вдоль (по ширине)
{const b=$('#t-cut'),bar=$('#cutbar'),rng=$('#cutpos'),out=$('#cutval');App.cut={on:false,axis:'z',pos:0};
 const range=()=>{const m=App.model,half=(App.cut.axis==='z'?m.D:m.W)/2+700;rng.min=-half;rng.max=half;rng.step=10;};
 const defPos=()=>{const m=App.model;if(App.cut.axis==='z')return m.poly?140:Math.round(m.ZP[Math.floor(m.ZP.length/2)]+140);return m.poly?140:m.slopeBack?150:Math.round(m.W/2-700);};
 const upd=fly=>{rng.value=App.cut.pos;out.textContent=`${App.cut.axis==='z'?'по глубине':'по ширине'}: ${fmt(App.cut.pos)} мм`;App.viewer&&App.viewer.setCut({on:App.cut.on,axis:App.cut.axis,pos:App.cut.pos,fly});};
 b.onclick=()=>{App.cut.on=!App.cut.on;b.classList.toggle('on',App.cut.on);bar.hidden=!App.cut.on;if(App.cut.on){range();App.cut.pos=defPos();}upd(App.cut.on);};
 rng.oninput=()=>{App.cut.pos=+rng.value;upd(false);};
 bar.querySelectorAll('[data-cax]').forEach(e=>e.onclick=()=>{App.cut.axis=e.dataset.cax;bar.querySelectorAll('[data-cax]').forEach(q=>q.classList.toggle('on',q===e));range();App.cut.pos=defPos();upd(true);});
 App.refreshCut=()=>{if(App.cut.on){range();App.cut.pos=Math.max(+rng.min,Math.min(+rng.max,App.cut.pos));upd(false);}};}
$('#explode').addEventListener('input',e=>{App.explode=+e.target.value;App.viewer&&App.viewer.setExplode(App.explode);});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(b.dataset.view==='under'&&!App.flags.ground){App.flags.ground=true;$('#t-ground').checked=true;App.viewer&&App.viewer.setFlags(App.flags);}App.viewer&&App.viewer.view(b.dataset.view);});
$('#layers').innerHTML=BM.LAYERS.map(l=>`<label><input type="checkbox" data-l="${l.id}" checked><span class="dot" style="background:${l.c}"></span>${l.t}</label>`).join('');
$('#layers').querySelectorAll('input').forEach(c=>c.onchange=()=>{App.layers[c.dataset.l]=c.checked;App.viewer&&App.viewer.setLayers(App.layers);});
document.addEventListener('click',e=>{const p=$('#layers-pop');if(p.open&&!p.contains(e.target))p.open=false;});
{const h=$('#hint');const hide=()=>{h.classList.add('hide');if(!App.hintSeen){App.hintSeen=true;save();}};if(App.hintSeen)h.hidden=true;else{setTimeout(hide,8000);$('#three').addEventListener('wheel',hide,{once:true,passive:true});$('#three').addEventListener('pointerdown',hide,{once:true});}}

/* ---------- вкладки и карточка детали ---------- */
const TABS=[['asm','Сборка'],['bom','Смета'],['cut','Раскрой'],['calc','Надёжность'],['shop','Мастерская']];
$('#tabs').innerHTML=TABS.map(([k,t])=>`<button data-t="${k}">${t}</button>`).join('');
$('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{App.tab=b.dataset.t;closeSheet();renderTab();});
function wire(root){
 root.querySelectorAll('[data-step]').forEach(e=>e.onclick=ev=>{ev.preventDefault();setStep(+e.dataset.step);});
 root.querySelectorAll('[data-mark]').forEach(e=>e.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const p=App.model.parts.find(q=>q.mark===e.dataset.mark);if(p)pick(p);});
 root.querySelectorAll('[data-pid]').forEach(e=>e.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const p=App.byId[+e.dataset.pid];if(p)pick(p);});
 root.querySelectorAll('[data-mod]').forEach(e=>e.onclick=ev=>{ev.preventDefault();App.viewer&&App.viewer.selectModule(e.dataset.mod);});
 root.querySelectorAll('[data-cfg]').forEach(e=>e.onclick=ev=>{ev.preventDefault();ev.stopPropagation();Object.assign(App.cfg,JSON.parse(e.dataset.cfg));rebuild(true);});
 root.querySelectorAll('[data-open]').forEach(e=>e.onclick=ev=>{ev.preventDefault();openTab(e.dataset.open);});
}
function renderTab(){
 $('#tabs').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.t===App.tab);const bad=b.dataset.t==='calc'&&App.calc&&!App.calc.ok;const dot=b.querySelector('i');if(bad&&!dot)b.insertAdjacentHTML('beforeend','<i></i>');if(!bad&&dot)dot.remove();});
 const f={asm:tabAsm,bom:tabBom,cut:tabCut,calc:tabCalc,shop:tabShop,types:tabTypes}[App.tab]||tabAsm;
 const body=$('#tab-body'),st=body.scrollTop,same=body.dataset.t===App.tab;body.innerHTML=f();body.dataset.t=App.tab;if(same)body.scrollTop=st;
 wire(body);fillPrices();
 body.querySelectorAll('[data-apply]').forEach(e=>e.onclick=()=>{const s=App.sug&&App.sug[+e.dataset.apply];if(!s)return;Object.assign(App.cfg,s.patch);if(s.patch.ang)App.cfg.angType=App.cfg.type;rebuild(true);});
 body.querySelectorAll('[data-shop]').forEach(e=>e.onclick=()=>{App.shopTab=e.dataset.shop;renderTab();});
 body.querySelectorAll('details.mat').forEach(d=>d.ontoggle=()=>{App.matOpen[d.dataset.mk]=d.open;});
 const vs=body.querySelector('#v-snow');if(vs)vs.onchange=()=>{App.cfg.snow=vs.value;rebuild(true);};
 const vw=body.querySelector('#v-wind');if(vw)vw.onchange=()=>{App.cfg.wind=vw.value;rebuild(true);};
}
function openSheet(){const p=App.sel;$('#sheet-t').textContent=p?p.name:'Деталь';const b=$('#sheet-b');b.innerHTML=tabPart();b.scrollTop=0;wire(b);$('#sheet').classList.add('open');if(!App.panel)setPanel(true);}
function closeSheet(){$('#sheet').classList.remove('open');}
$('#sheet-back').onclick=()=>{closeSheet();App.sel=null;App.viewer&&App.viewer.select({});};

/* ---------- описание детали ---------- */
function catOf(p){
 if(p.kind==='bolt')return App.bom.lines.find(l=>l.key==='boltM'+p.d+'×'+p.L);
 if(!p.cat)return null;
 const l=App.bom.lines.find(l=>l.key===p.cat);if(l)return l;
 const c=BM.CAT[p.cat];return c?{name:c.n,price:c.pr,unit:c.u,url:c.url,src:c.src,lk:c.lk,sku:c.sku,qty:'—'}:null;
}
function sizeOf(p){if(p.size)return p.size;
 if(p.kind==='tube')return`${p.wood?`Брус ${p.sec.slice(1).replace(/x/g,'×')}`:`Труба ${p.sec.replace(/x/g,'×')}`} мм · заготовка ${Math.round(p.cutLen)} мм${p.angA||p.angB?` · рез ${p.angA?p.angA+'°':'90°'}/${p.angB?p.angB+'°':'90°'}`:''}`;
 if(p.kind==='angle')return p.trim?`Доборный элемент, L=${Math.round(p.L)} мм`:`Уголок ${p.A}×${p.B}×${p.t} мм, L=${Math.round(p.L)} мм`;
 if(p.kind==='bolt')return`M${p.d}×${p.L} · пакет ${Math.round(p.grip)} мм · 2 шайбы DIN 9021 + гайка DIN 985 · отверстие Ø${BM.BOLT[p.d].hole}`;
 if(p.kind==='weld')return`Угловой шов ${Math.round(p.len)} мм, катет 3 мм, электрод Ø2,5 (варится дома)`;
 if(p.kind==='box')return`${Math.round(p.w)}×${Math.round(p.h)}×${p.t} мм`;
 if(p.kind==='sheet')return`${Math.round(p.W)}×${Math.round(p.L)} мм`;
 if(p.kind==='poly')return`28×${Math.round(p.w)}×${p.L} мм`;
 if(p.kind==='cyl')return`Ø${p.r*2} × ${p.h} мм`;
 if(p.kind==='stud')return'M12, L=300 мм';
 if(p.kind==='screw')return`Крепит: ${p.what}`;
 return'';
}
const stepName=p=>{const i=App.model.steps.findIndex(s=>s.id===p.step);return i>=0?`${i+1}. ${App.model.steps[i].t}`:'';};
const modName=p=>App.model.MODS[p.module];
App.tipHTML=function(p){
 const l=catOf(p),mn=modName(p);
 return`<b>${esc(p.name)}</b> ${p.mark?`<span class="badge mark">${esc(p.mark)}</span>`:''}<div class="muted">${esc(sizeOf(p))}</div>${p.why?`<div>${esc(p.why)}</div>`:''}${p.markQty?`<div>В проекте: <b>${p.markQty} шт</b> такой марки</div>`:''}${p.joint?`<div>Узел: ${esc(p.joint)}</div>`:''}${mn?`<div>Модуль: <b>${esc(mn)}</b> <span class="muted">(сварной, везётся целиком)</span></div>`:''}<div class="muted">Шаг ${esc(stepName(p))}</div>${l?`<div class="lm"><b>Лемана ПРО:</b> ${esc(l.name)}<br>${l.price?`<b>${rub(l.price)}</b> / ${esc(l.unit)} `:''}<span class="badge ${l.src==='site'?'site':'est'}">${l.src==='site'?'цена с сайта':l.src==='calc'?'по весу 550 ₽/кг':l.src==='base'?'металлобаза −35%':'оценка'}</span><div class="muted">Клик — карточка детали и ссылка на товар</div></div>`:''}`;
};
function pick(p){App.sel=p;openSheet();App.viewer&&App.viewer.select(p);}
App.pick=pick;

/* ---------- чертежи ---------- */
function drawTube(p){
 const L=p.cutLen,W=Math.min(560,Math.max(300,L*0.25)),k=W/L,pad=10,out=[];
 for(const f of ['X','Y']){
  const hs=p.holes.filter(h=>h.face===f);if(!hs.length)continue;
  const fh=f==='X'?p.sy:p.sx,th=f==='X'?p.sx:p.sy,H=Math.max(26,fh*0.9),y0=26;
  const zy=(y,end)=>{const xx=f==='X'?[p.sx/2,y]:[y,p.sy/2];return(BM.cutZ(end?p.cutB:p.cutA,xx[0],xx[1],end?p.L:0)-p.zA0)*k+pad;};
  const ys=v=>y0+H/2-v/fh*H,top=fh/2,bot=-fh/2;
  let s=`<svg width="${W+2*pad}" height="${H+y0+20}" viewBox="0 0 ${W+2*pad} ${H+y0+20}">`;
  s+=`<polygon points="${zy(top,0)},${ys(top)} ${zy(top,1)},${ys(top)} ${zy(bot,1)},${ys(bot)} ${zy(bot,0)},${ys(bot)}" fill="var(--chip)" stroke="currentColor" stroke-width="1"/>`;
  hs.sort((a,b)=>a.s-b.s);let lastX=-99,row=0;
  hs.forEach(h=>{const x=(h.s-p.zA0)*k+pad,y=ys(h.off),r=Math.max(2.2,h.d/2*Math.min(1,H/fh));
   s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${h.single?'none':'var(--accent)'}" stroke="var(--accent)" stroke-width="1.3"/>`;
   row=x-lastX<24?(row+1)%2:0;lastX=x;
   s+=`<text x="${x}" y="${row?20:10}" text-anchor="middle">${Math.round(h.s-p.zA0)}</text><line x1="${x}" y1="${row?22:12}" x2="${x}" y2="${y0}" stroke="var(--line)"/>`;});
  s+=`<text x="${pad}" y="${y0+H+14}">${esc(p.ends[0])}</text><text x="${W+pad}" y="${y0+H+14}" text-anchor="end">${esc(p.ends[1])} · L=${Math.round(L)}</text></svg>`;
  out.push(`<div class="small muted">Грань ${fh} мм (${hs.some(h=>!h.single)?'насквозь через '+th+' мм':'одна стенка'}):</div><div class="svgwrap">${s}</div>`);
 }
 return out.join('')||'<p class="muted small">Отверстий нет (деталь на сварке или стыкуется торцом).</p>';
}
function drawAngle(p){
 const W=Math.max(80,p.L*1.4),k=W/p.L,H=p.A*1.4,pad=8;let s='';
 for(const leg of ['U','V']){const hs=p.holes.filter(h=>h.leg===leg);
  s+=`<svg width="${W+2*pad+150}" height="${H+22}"><rect x="${pad}" y="4" width="${W}" height="${H}" fill="var(--chip)" stroke="currentColor"/><text x="${pad}" y="${H+18}">полка ${leg==='U'?'1':'2'} (${leg==='U'?p.A:p.B} мм)</text>`;
  hs.forEach(h=>{const x=pad+h.w*k,y=4+H-h.a/(leg==='U'?p.A:p.B)*H;s+=`<circle cx="${x}" cy="${y}" r="${h.d/2*1.4}" fill="var(--accent)"/><text x="${x+9}" y="${y-4}">Ø${h.d} · ${Math.round(h.a)} от угла</text>`;});
  s+='</svg>';}
 return`<div class="svgwrap">${s}</div>`;
}
function drawPlate(p){
 const k=Math.min(1.6,260/Math.max(p.w,p.h)),pad=8,W=p.w*k,H=p.h*k;let s=`<svg width="${W+2*pad+90}" height="${H+2*pad}"><rect x="${pad}" y="${pad}" width="${W}" height="${H}" fill="var(--chip)" stroke="currentColor"/>`;
 p.holes.forEach(h=>{const x=pad+(h.x+p.w/2)*k,y=pad+(p.h/2-h.y)*k;s+=`<circle cx="${x}" cy="${y}" r="${Math.max(3,h.d/2*k)}" fill="var(--accent)"/><text x="${x+9}" y="${y+3}">${Math.round(h.x+p.w/2)}; ${Math.round(p.h/2-h.y)}</text>`;});
 return`<div class="svgwrap">${s}</svg></div><div class="small muted">Координаты отверстий — от левого верхнего угла, мм.</div>`;
}
function drawingOf(p){if(p.kind==='tube')return drawTube(p);if(p.kind==='angle'&&!p.trim)return drawAngle(p);if(p.kind==='box'&&['basePlate','tongue','flange','newelPlate','support','endPlate','stopP','wHead','wKnife','nodePlate','jackPlate','jackFoot','lug'].includes(p.role))return drawPlate(p);return'';}
function holeList(p){
 if(p.kind!=='tube'||!p.holes.length)return'';
 return`<table><tr><th>от «${esc(p.ends[0])}»</th><th>грань</th><th>смещ.</th><th>Ø</th><th></th></tr>${p.holes.slice().sort((a,b)=>a.s-b.s).map(h=>`<tr><td class="n">${Math.round(h.s-p.zA0)}</td><td>${h.face==='X'?p.sy:p.sx} мм</td><td class="n">${Math.round(h.off)}</td><td class="n">${h.d}</td><td class="small muted">${h.single?esc(h.note||'одна стенка'):h.bolt?esc((App.byId[h.bolt]||{}).name||''):''}</td></tr>`).join('')}</table>`;
}
const LK={product:'Открыть товар ↗',sku:'Открыть по артикулу ↗',catalog:'Открыть раздел ↗',search:'Поиск на сайте ↗'},VND=u=>/luvon/.test(u||'')?'LUVON':/lemanapro/.test(u||'')?'Лемана ПРО':'Поставщик';
function lemanaBox(l){if(!l)return'';const ok=l.src==='site'||l.src==='live';return`<div class="lemana"><div><div class="small muted">${VND(l.url)}</div><b>${esc(l.name)}</b><div class="small">${l.price?rub(l.price)+' / '+esc(l.unit):''} <span class="badge ${ok?'site':'est'}">${l.src==='live'?'цена с сайта':l.src==='site'?(l.city?`цена, ${esc(l.city)}`:'цена с карточки'):l.src==='calc'?'по весу 550 ₽/кг':l.src==='base'?'металлобаза':'оценка'}</span>${l.qty&&l.qty!=='—'?` · в смете: ${l.qty} ${esc(l.unit)}`:''}</div></div><a class="go" href="${l.url}" target="_blank" rel="noopener">${LK[l.lk]||'Открыть ↗'}</a></div>${l.lk==='catalog'?'<div class="small muted">Точной карточки нет: ссылка ведёт в раздел с подходящими товарами.</div>':l.lk==='search'?'<div class="small muted">Точной карточки не нашли: откроется поиск по сайту.</div>':l.lk==='sku'?`<div class="small muted">Поиск по артикулу ${esc(l.sku)} откроет карточку товара.</div>`:''}${l.warn?`<div class="small warn">${esc(l.warn)}</div>`:''}`;}

function tabPart(){
 const p=App.sel;
 if(!p)return`<p class="muted">Наведите курсор на деталь в 3D — появится подсказка с материалом и ценой Лемана ПРО. Клик открывает здесь карточку детали: размеры, марку, чертёж сверловки и ссылку на товар.</p>`;
 const l=catOf(p),mn=modName(p);
 let h=`<h3>${esc(p.name)} ${p.mark?`<span class="badge mark">${esc(p.mark)}</span>`:''}</h3><div class="kv"><div>Размер</div><div>${esc(sizeOf(p))}</div>${p.markQty?`<div>Таких в проекте</div><div><b>${p.markQty} шт</b></div>`:''}${mn?`<div>Модуль</div><div><a href="#" data-mod="${esc(p.module)}">${esc(mn)}</a> — сваривается дома</div>`:''}<div>Монтаж</div><div><a href="#" data-step="${App.model.steps.findIndex(s=>s.id===p.step)}">шаг ${esc(stepName(p))}</a></div>${p.kind==='tube'?`<div>Масса</div><div>${(BM.SEC[p.sec].kgm*p.cutLen/1000).toFixed(2)} кг</div>`:''}</div>`;
 h+=lemanaBox(l);
 if(p.kind==='bolt'){const B=BM.BOLT[p.d];const th=p.thru.map(id=>App.byId[id]);h+=`<h4>Пакет болта</h4><ul><li>Болт DIN 933 M${p.d}×${p.L}, оцинк., класс 5.8</li><li>2 шайбы увеличенные DIN 9021 M${p.d} (Ø${B.wd}): не дают продавить стенку трубы</li><li>Гайка самоконтрящаяся DIN 985 M${p.d}: не открутится от вибрации</li><li>Отверстие Ø${B.hole} мм, момент ${B.torque} Н·м (тонкостенная труба — не пережимать)</li></ul><h4>Стягивает</h4><ul>${th.map(t=>`<li><a href="#" data-pid="${t.id}">${esc(t.name)}</a> ${t.mark?`<span class="badge">${esc(t.mark)}</span>`:''}</li>`).join('')}</ul>`;}
 if(p.kind==='weld')h+=`<p class="small">Варится дома, до покраски: инвертор 160–200 А, электрод Ø2,5 мм (МР-3 / ОК-46), ток 70–90 А. Сначала прихватки по углам, проверка диагоналей и угольника, затем швы вразбежку короткими участками 30–40 мм, чтобы не повело. Шлак отбить, шов зачистить, обработать цинк-спреем.</p>`;
 const dr=drawingOf(p);if(dr)h+=`<h4>Чертёж сверловки</h4>${dr}${holeList(p)}`;
 if(p.kind==='tube'&&(p.angA||p.angB))h+=`<p class="small">Торцы: ${esc(p.ends[0])} — ${p.angA?'рез под '+p.angA+'°':'прямой'}; ${esc(p.ends[1])} — ${p.angB?'рез под '+p.angB+'°':'прямой'}. Разметка по шаблону; косой торец прилегает к соседней трубе всей площадью и обваривается по контуру — открытых срезов нет.</p>`;
 if(p.why)h+=`<p class="small"><b>Зачем:</b> ${esc(p.why)}</p>`;if(p.note)h+=`<p class="small"><b>Обработка:</b> ${esc(p.note)}</p>`;
 if(p.role==='tongue')h+=`<p class="small">Язык — пластина 6 мм, вваривается дома с двух сторон. Ответная труба опускается на него пропилом 7 мм и стягивается одним болтом: узел почти не виден снаружи.</p>`;
 return h;
}

/* ---------- сборка: тексты этапов ---------- */
function TD(){const m=App.model,D=m.dress;if(!D)return'';const W=D.wins,L=D.light,N=D.nets,wd=m.mat&&m.mat!=='steel';let h='<ul>';
 if(W.length){const cat=W.filter(w=>w.fit).length;
  h+=`<li><b>${W.length} ${plural(W.length,'мягкое окно','мягких окна','мягких окон')}</b> ПВХ 0,7 мм${cat?`: ${cat} готовых из Леманы`:''}${W.length-cat?`${cat?',':':'} ${W.length-cat} на заказ — размеры в смете`:''}. Окно висит <b>снаружи</b> стоек: ветер прижимает его к каркасу, а не отрывает.</li>`;
  h+=`<li>Вешать в тепло, от +15 °C: на холоде плёнка сжата и в жару провиснет. Сначала скобы по балке сверху, окно — люверсами на скобы; затем бока и низ. Всего ${D.br} ${plural(D.br,'скоба','скобы','скоб')}, по 2 самореза ${wd?'4,2×32 в брус':'4,2×16 со сверлом в трубу'}.</li>`;
  if(W.some(w=>w.roll))h+='<li>Вход: окно скатывается рулоном наружу и подвязывается двумя ремешками; в непогоду опускается и пристёгивается к скобам.</li>';
  if(W.some(w=>w.zip))h+='<li>Вход на скатной грани: рулон с косым верхом не скатать — в окне-трапеции дверной проём на П-образной молнии.</li>';
  if(W.some(w=>w.slope))h+='<li>Под скатной балкой окна — трапеции: верх идёт по балке, щели над окном нет.</li>';
  if(W.some(w=>w.bottomFree))h+='<li>Пола нет: нижний край свободен и держится боковыми скобами. В сильный ветер окна лучше скатать.</li>';
  h+='<li>С закрытыми окнами беседка парусит: ветер на стены уже учтён в расчёте каркаса и фундамента.</li><li>На зиму — скатать или снять: наледь и снег рвут люверсы. Хранить скатанными, без заломов.</li>';}
 if(N.length){h+=`<li><b>${N.length} ${plural(N.length,'москитная сетка','москитные сетки','москитных сеток')}</b> изнутри, на ленте-липучке 25 мм. Мягкую половину пришить по краю сетки (обычная машинка, зигзаг), жёсткую — к каркасу саморезами с прессшайбой через 200 мм: к стойкам, балке сверху${m.isFloor?' и к настилу внизу':''}.</li>`;
  if(N.some(x=>x.seam))h+='<li>Полотно 1,4 м: широкие пролёты — из двух полос, шов внахлёст 30 мм, прострочить дважды.</li>';
  if(N.some(x=>x.door))h+='<li>На входе сетка скатывается вверх и подвязывается; опущенная — пристёгивается к липучке на стойках и настиле.</li>';
  h+=`<li>${W.length?'Летом окна ПВХ скатаны — от комаров держит сетка; в непогоду окна опускаются поверх.':'Сильный порыв отстёгивает сетку от липучки — каркасу это ничем не грозит; ветер на сетку учтён в расчёте.'}</li>`;}
 if(L&&L.type==='belt'){const two=L.set.length>1;
  h+=`<li><b>Гирлянда белт-лайт</b> ${L.set.join(' + ')} м, ${L.bulbs} ${plural(L.bulbs,'лампа','лампы','ламп')} по контуру ${dec(L.len/1000,1)} м. ${two?'Два комплекта начинаются у стойки входа и идут в разные стороны — встречаются на дальней стороне; обе вилки — в колодке удлинителя на 2 розетки.':'Начало — у стойки входа, вилка — в розетку удлинителя.'}</li>`;
  h+=`<li>Колодка удлинителя — на стойке у входа под балкой, под крышей; шнур — вниз по стойке на стяжках, дальше к розетке с УЗО 30 мА.</li><li>Подвес — стяжками у каждой стойки и промежуточно через ≤ 1,7 м; провис ≈ 5% пролёта, низ ламп — ${fmt(L.clear)} мм над полом. Патроны — лампами вниз.${N.length?' Гирлянда — в 100 мм от стен, сетку не задевает.':''}</li>`;
  h+='<li>Степень защиты на карточке не указана: для улицы нужна IP44 и выше — проверить на упаковке. Если ниже — Uniel арт. 82435136: IP65, соединяемая, 40 патронов на 10 м, лампы E27 покупаются отдельно.</li>';}
 if(L&&L.type==='led')h+=`<li><b>LED-лента 12 В</b> в алюминиевом профиле по низу балок: ${dec(L.len/1000,1)} м, ${Math.round(L.watts)} Вт, ${L.psu} ${plural(L.psu,'блок','блока','блоков')} питания 60 Вт IP67 (нагрузка ≤ 80%). Каждую катушку 5 м — своим проводом от блока: в цепочку к концу лента тускнеет.</li><li>Профиль — саморезами в низ балки через ≈ 0,7 м. Блоки питания и колодка удлинителя — на стойке у входа под балкой; шнур — по стойке вниз к розетке с УЗО 30 мА.</li><li>Если у блока IP67 сетевые провода без вилки — подключить через уличную вилку IP44 или коробку IP65. Это работа электрика.</li>`;
 return h+'</ul>';}
function TP(id){ // тексты этапов для многогранника
 const m=App.model,N=m.poly,fl=m.isFloor,cnt=r=>m.parts.filter(p=>p.role===r).length,bl=st=>m.parts.filter(p=>p.step===st&&p.kind==='bolt').length;
 switch(id){
 case'found':return`<p>Разбивка: ${N} стоек по окружности <b>R = ${fmt(m.R)} мм</b> от центра (по осям), сторона <b>${fmt(m.side)} мм</b>. Удобно: колышек в центре и шнур длиной R, по нему — точки через хорду ${fmt(m.side)} мм.</p><ul><li>${((n)=>n+' '+plural(n,'столб','столба','столбов'))(cnt('pillar'))} Ø200${cnt('bell')?` (${cnt('bell')} — с уширением Ø400 внизу: бур ТИСЭ с расширителем; держит отрыв ветром)`:''}: бур на <b>1350 мм</b>, 150 мм песка с трамбовкой, опалубка — рубероид в 2 слоя (скользящий слой от пучения), верх на +45 в один горизонт.</li><li>В каждом столбе 2 прутка Ø10 × 1150; под стойки — 4 шпильки M12 × 300${m.studs88?' класса 8.8':''} по фанерному шаблону (квадрат 90 мм), повёрнутому по радиусу${fl&&cnt('support')?'; под внутренние балки пола — по 1 шпильке в центре':''}.</li><li>Фундамент — первым, за неделю до сборки: нагружать через 7 суток (полная прочность — 28). Пока он твердеет, варятся модули; бетон и песок удобнее купить рядом с участком.</li>${fl?'':'<li>Дёрн внутри контура снять сразу, на 70–100 мм: после кровли здесь будет щебёночный пол.</li>'}</ul>`;
 case'posts':return`<ul><li>${((n)=>n+' '+plural(n,'круглая стойка','круглые стойки','круглых стоек'))(N)} ${m.postSec==='r76x4'?'Ø76×4':'Ø76×3'} приезжают <b>с приваренными опорными пластинами и языками</b>: под ригели обвязки, подкосы${fl?', балки пола':''} и под ребро шатра (на скошенном торце).</li><li>На шпильки — регулировочные гайки и шайбы в один горизонт. Языки смотрят вдоль сторон: каждую стойку ставить по её марке. Сверху шайба и гайка M12 — <b>пока от руки</b>, затягиваются на шаге «Выверка».</li><li>Вертикаль — уровнем, временно раскрепить рейками.</li></ul>`;
 case'bottom':return`<ul><li>Пол собирается под готовой крышей: каркас уже выверен и протянут, стремянки на кровельных работах стояли на земле, стружка от саморезов не попала на балки и доски.</li><li>Балки пола по периметру опускаются на языки стоек — по 1 болту M8 на конец, сразу затянуть (15–20 Н·м).</li>${cnt('support')?'<li>Внутренние балки лежат на опорных столиках: столик с приварной гайкой заранее накрутить на шпильку пониже, положить балку, выкрутить столик вверх до упора и закрепить 2 саморезами 5,5×32.</li>':''}<li>Лаги 40×40 поверх балок, каждая опора — на оцинкованном уголке и 4 саморезах 4,2×16.</li></ul>`;
 case'sides':return`<ul><li>Сначала <b>ригели обвязки</b> 60×40: торцы подрезаны по радиусу стойки, ригель опускается сверху на 2 вварных языка стоек — по 1 болту M10 на язык.</li><li>Затем <b>подкосы</b>: каждый вдвигается в угол «стойка — ригель» на 2 языка — на стойке и под ригелем (пропилы в торцах открыты в сторону угла), по 1 болту M10 на язык.</li><li>Всего ${bl('sides')} болтов M10, гайки пока наживить: протяжка — после выверки. Временные рейки снять после выверки.</li></ul>`;
 case'hips':return`<ul><li>Центральный узел Ø114 с ${N} вварными языками выставить на временную стойку (брус) по центру, на высоту +${fmt(Math.round(m.dims.apex-200))} ориентировочно.</li><li>Рёбра опускаются пропилами на язык центрального узла и на язык стойки, по 1 болту M10 на конец (${bl('hips')} болтов, гайки пока наживить). Ставить <b>попарно напротив друг друга</b> — тогда узел не тянет вбок со стойки.</li><li>Когда стоят все рёбра, временную стойку убрать: распор шатра держит обвязка.</li></ul>`;
 case'purlins':return`<ul><li>Обрешётка 40×20 кольцами: на каждой грани отрезки с косыми торцами по оси рёбер, шаг ≈${BM.COVERS[m.cov].step} мм.</li><li>Каждый торец ложится на ребро и упирается в <b>вварное ушко</b> (пластина 10 мм на ребре, приварена дома), крепится 2 саморезами 5,5×32 сквозь ушко — без уголков и болтов.</li></ul>`;
 case'brace':return`<ul><li>Каркас стоит на наживлённых болтах, кровли и пола на нём ещё нет — выставлять его нужно сейчас.</li><li>По осям стоек: стороны — ${fmt(m.side)} мм, между противоположными стойками через центр — ${fmt(2*m.R)} мм (допуск ±5 мм). Вертикаль каждой стойки — уровнем в двух направлениях, верх обвязки — в один горизонт. Подправлять регулировочными гайками под пластинами.</li><li>Затянуть болты обвязки, подкосов и рёбер M10 — 25–30 Н·м, затем верхние гайки анкеров M12 — 35–40 Н·м и ещё раз проверить вертикаль.</li><li>Подливка: зазор 17 мм под опорными пластинами забить густым пескобетоном 1:3. Пока он твердеет, нагрузку держат регулировочные гайки — обрешётку можно ставить сразу.</li></ul>`;
 case'deck':return fl?`<ul><li>${m.deck.n} ${plural(m.deck.n,'ряд','ряда','рядов')} доски поперёк лаг, параллельно входу; по контуру многогранника доски обрезаются по месту, у стоек — срезанные углы. Зазор 5 мм.</li>${m.cfg.deck==='wpc'?'<li>ДПК — на скрытых кляймерах: кляймер в паз доски, саморез со сверлом в стальную лагу. По торцам — 5 мм на расширение.</li>':'<li>Саморезы с крыльями 5,5×50, по 2 на лагу (крылья рассверливают доску и срываются на металле). Торцы — антисептик.</li>'}</ul>`:`<ul><li>Дёрн внутри контура снят ещё при разбивке. Геотекстиль внахлёст 100 мм, сверху щебень 20–40 слоем 70 мм, утрамбовать.</li></ul>`;
 case'roof':{const n=m.roofQty.sheets,ns=n+' '+plural(n,'лист','листа','листов'),cut='вдоль рёбер лист режется по месту — край закроет коньковая планка';
  return{c20:`<ul><li>Профнастил С20 0,45: ${ns}; на каждой грани — полосами от карниза, нахлёст в 1 волну, ${cut}.</li><li>Саморезы 4,8×29 с EPDM-шайбой в нижнюю волну, не перетягивать.</li></ul>`,tile:`<ul><li>Металлочерепица: ${ns}, шаг обрешётки = шаг волны 350 мм; ${cut}.</li><li>Саморезы в прогиб волны под ступенью.</li></ul>`,ondulin:`<ul><li>Ондулин: нахлёст в 1 волну и 170 мм по длине, ${cut}.</li><li>20 гвоздей с колпачком на лист — в гребень волны.</li></ul>`,falc:`<ul><li>Кликфальц: панели от карниза к вершине грани, без поперечных стыков; ${cut}.</li><li>Саморезы скрыты в замке.</li></ul>`}[m.cov]||null;}
 case'railframe':return`<ul><li>Секции бортов сварные, по одной на грань; передняя грань — вход. Секцию подносят снаружи и прикладывают к стойкам.</li><li>Стойка секции прижимается к круглой стойке и стягивается болтами M8 насквозь (15–20 Н·м); у соседних граней болты разнесены по высоте.</li></ul>`;
 }return null;
}
// слои кровли: что кладём, на что и чем крепим
function TR_(id){
 const m=App.model,cv=m.cov,poly=!!m.poly,g=m.gable,pc=cv==='pc';
 switch(id){
 case'roofDeck':return`<ul><li>OSB-3 12 мм кладётся на обрешётку${poly?' треугольниками по шаблону грани':' длинной стороной поперёк обрешётки'}, стыки — только на обрешётке и вразбежку, зазор 3 мм.</li><li>Крепёж: ${m.mat&&m.mat!=='steel'?'саморезы по дереву 4,2×51':'саморезы 4,2×51 с крыльями'} через 300 мм в каждую обрешётку (на 3D — серые шляпки на OSB).</li></ul>`;
 case'roofUnder':return`<ul><li>Подкладочный ковёр по OSB: полоса 600 мм по карнизу, ${poly?'по 250 мм с каждой стороны вдоль рёбер':'500 мм у конька, 400 мм по фронтонам'}, нахлёсты 100 мм.</li><li>Крепёж: ершёные гвозди через 200 мм по кромке, нахлёсты промазать битумной мастикой.</li></ul>`;
 case'roofEdge':return pc?`<ul><li>Основания соединительных профилей — вдоль ската, ${m.slopeBack?'на сдвоенные стропила щитов':'над порталами'}. Крепёж: саморезы 5,5×32 со сверлом через 300 мм.</li><li>Листы потом заводятся краями в эти основания.</li></ul>`:`<ul><li>Карнизные планки (капельники) — поверх ковра по краю OSB, нахлёст 30–50 мм${g?'; ветровые (фронтонные) — по торцам ската':''}.</li><li>Крепёж: кровельные гвозди через 120 мм зигзагом.</li></ul>`;
 case'roofTrim':return cv==='shingle'?`<ul><li>Коньково-карнизная черепица ${poly?'по рёбрам снизу вверх':'по коньку'}: лист режется на 3 части по перфорации, нахлёст 50 мм, 4 гвоздя — шляпки закрывает следующий элемент.</li>${poly?'<li>Сверху — колпак-навершие на центральный узел (3 самореза).</li>':''}</ul>`
  :pc?`<ul><li>Крышки соединительных профилей защёлкнуть ударами резиновой киянки.</li><li>Боковые края листов — торцевые профили.</li></ul>`
  :poly?`<ul><li>Коньковые планки по рёбрам снизу вверх, нахлёст 100 мм. Крепёж: кровельные саморезы через 400 мм с обеих сторон, в гребни волн.</li><li>Колпак-навершие на центральный узел.</li></ul>`
  :`<ul>${g&&cv!=='ondulin'?'<li>Самоклеящийся уплотнитель по гребням под конёк.</li><li>Конёк — саморезы через 300 мм в гребни волн, нахлёст 100 мм.</li>':g?'<li>Конёк ондулина на гвоздях с колпачками в каждый второй гребень.</li>':''}<li>Торцевые планки — поверх листа, саморезы через 450 мм (на 3D видны по краям).</li></ul>`;
 case'gutter':return`<ul><li>Кронштейны желоба — на торцы стропил щитов${m.pg?` (шаг ≈${fmt(m.pg.wp)} мм)`:''}, по 2 самореза в каждый; выставить уклон к воронке 3–5 мм на метр. Всё навешивается сзади, со стремянки.</li><li>Желоб 125 мм, заглушки, воронка в заднем углу, труба Ø90 с коленом — вывести воду в сторону от дорожки.</li></ul>`;
 case'roof':if(cv==='shingle')return`<ul><li>Сначала стартовая полоса (коньково-карнизная черепица) по карнизу, потом рядовая черепица от середины карниза вверх, каждый ряд смещён на половину лепестка.</li><li>Крепёж: 4 ершёных гвоздя на гонт, шляпки закрывает следующий ряд. Монтаж при +5 °C и выше.</li></ul>`;return null;
 }return null;
}

/* тексты этапов для каркаса с брусом (Металл + брус и Брус) */
function TW(id){
 const m=App.model,TM=m.mat!=='steel',poly=!!m.poly,g=m.gable,fl=m.isFloor,PG=m.slopeBack,cnt=r=>m.parts.filter(p=>p.role===r).length,bl=st=>m.parts.filter(p=>p.step===st&&p.kind==='bolt').length,WS=BM.WOODS[m.wood],bP=m.bP,bs=n=>n+' '+plural(n,'болт','болта','болтов'),nPost=poly?m.poly:cnt('post');
 const wrd=(n,a,b,c)=>n+' '+plural(n,a,b,c),nodeTxt=()=>poly?'Сверху на стойку надевается коннектор угла: гнездо на стойку и два лотка под балки обвязки, 8 глухарей 6×60 в стойку.':g?'Сверху на стойку надевается цельный коннектор: угловой на крайних порталах, 4-лучевой на средних. 8 глухарей 6×60 в стойку.':`Сверху на стойку надевается цельный Т-образный коннектор, 8 глухарей 6×60 в стойку.${PG?' На грани стоек — торцевые коннекторы под балки вдоль.':''}`;
 switch(id){
 case'shop':return`<p><b>Дома — только заготовка.</b> ${m.FW?(cnt('anchor')?'Сварка одна: крышки на сваи. Остальной крепёж покупной.':'Сварки нет: весь крепёж покупной.'):'Сварка — только стальной низ: ножки, пол, рама.'} Брус: ${esc(WS.t.toLowerCase())}, ${esc(WS.tag)}.</p><ol>${m.FW?'':`<li><b>Сталь.</b> ${poly?'Ножки Ø76':'Ножки 60×60'} — с опорными пластинами${fl?' и языками под балки пола':''}, сверху приварено основание под опорный коннектор. Швы короткими участками, цинк-спрей, 2 слоя грунт-эмали.</li>`}<li><b>Брус.</b> Нарезать по вкладке «Раскрой». Заготовки сушить на ровных прокладках под навесом: брус должен «отдохнуть» неделю до разметки.</li><li><b>Коннекторы для бруса</b> покупные, сталь 2 мм, порошковая окраска: брус ${bP}×${bP} вставляется в гнёзда и крепится шурупами-глухарями 6×60. Брус должен входить плотно: снять фаску и не оставлять заусенцев.</li><li><b>Врубки</b> подкосов — 15 мм, ручной пилой и стамеской, по шаблону.</li><li><b>Защита до сборки.</b> Антисептик на все грани, отверстия и врубки — потом туда не добраться. Торцы — состав для торцов. Масло — 2 слоя.</li></ol>`;
 case'truck':{const lg=Math.max(...m.parts.filter(p=>p.wood).map(p=>p.cutLen)),tr=m.truckSpec;
  return`<ul><li>Везти, когда фундамент простоял 7 суток. Стальные модули — плашмя, между ними картон.</li><li>Брус — под тентом, на ровных прокладках, сверху ничего тяжёлого: готовое масло легко поцарапать.</li>${lg>tr.L?`<li>Самая длинная деталь — ${fmt(Math.round(lg))} мм, длиннее кузова (${fmt(tr.L)} мм): до 2 м свеса за задний борт разрешено с красно-белым флажком, либо закажите доставку заготовок.</li>`:''}<li>Коробки с крепежом подписать по этапам.</li></ul>`;}
 case'posts':return m.FW?`<ul><li>Опорный коннектор — на обвязку, 4 самореза 8×160: он держит стойку от отрыва и разносит вес.</li><li>Стойка ${bP}×${bP} вставляется в гнездо и крепится 8 глухарями 6×60.</li><li>${nodeTxt()} Его удобнее прикрутить на земле, до подъёма стойки.</li><li>Вертикаль — уровнем${poly?'':' по двум граням'}, раскрепить рейками.</li></ul>`:`<ul><li>${wrd(nPost,'стальная ножка','стальные ножки','стальных ножек')} с опорной пластиной на шпильки: регулировочные гайки и шайбы в один горизонт (+62), сверху гайки M12 — <b>пока от руки</b>.</li><li>На ножке — опорный коннектор. Стойка ${bP}×${bP} вставляется в гнездо, 8 глухарей 6×60.</li><li>${nodeTxt()}</li><li>Вертикаль — уровнем${poly?'':' по двум граням'}, раскрепить рейками.</li></ul>`;
 case'heads':return g?`<ul><li>Ферму собрать на земле: затяжка ${m.beam.b}×${m.beam.h}, стропила садятся на неё врубкой 30 мм, у конька — упор в бабку, раскосы на врубках.</li><li>Пята без пластин: ${wrd(m.heelS,'конструкционный саморез','конструкционных самореза','конструкционных саморезов')} 8×160 сверху, через стропило в затяжку, в два ряда. Они держат распор.</li><li>Поднять ферму вдвоём со стремянок и опустить затяжку в лотки коннекторов на стойках, по 6 глухарей 6×60 на лоток.</li></ul>`:PG?`<ul><li>Балка портала ${m.beam.b}×${m.beam.h} опускается сверху в лотки Т-образных коннекторов на стойках, по 6 глухарей 6×60 на лоток.</li><li>Порталы стоят ступенями по уклону: балки всегда горизонтальны.</li></ul>`:`<ul><li>Балка вдоль ${bP}×${bP} опускается сверху в лотки Т-образных коннекторов, по 6 глухарей 6×60 на лоток. За крайние стойки она выходит на ${bP/2+(bP>=150?110:100)} мм.</li><li>Если балка длиннее заготовки, стык — точно над стойкой, в середине коннектора.</li></ul>`;
 case'sides':return poly?`<ul><li>Балки обвязки ${bP}×${bP} опускаются сверху в лотки коннекторов на стойках, торцы «на ус» по оси стойки, по 12 глухарей 6×60 на лоток: кольцо держит распор шатра.</li><li>Коннекторы углов — под заказ: угол ${poly===6?120:135}°, у готовых изделий такого нет.</li><li>Подкосы 50×100 вдвигаются в угол «стойка — балка» после выверки.</li></ul>`:g?`<ul><li>Балка вдоль ${bP}×${bP} опускается сверху в лотки коннекторов на стойках, по 6 глухарей 6×60 на лоток.</li></ul>`:PG?`<ul><li>Балка вдоль ${bP}×${bP} горизонтальна: стойки разной высоты, поэтому она идёт ниже верхних коннекторов.</li><li>Торцевые коннекторы уже на стойках: балка опускается в них сверху, ${m.zBolt?'2 болта M12 насквозь на торец':'по 4 глухаря 6×60 на торец'}.</li></ul>`:`<ul><li>Балки по скату ${m.beam.b}×${m.beam.h} ложатся поперёк балок вдоль: посадочная врубка по уклону, по 2 самореза 8×160 на опору.</li><li>Лотков здесь нет: коннекторы прямоугольные, наклонную балку в них не положить.</li></ul>`;
 case'hips':return`<ul><li>Центральный узел Ø114 с ${m.poly} ножами выставить на временную стойку по центру.</li><li>Рёбра ${m.hip.b}×${m.hip.h}: верх — пропилом на нож узла, низ — врубкой 30 мм на угол обвязки, 4 самореза 8×160 наискось. Ставить <b>попарно напротив друг друга</b>: тогда узел не тянет вбок.</li><li>Когда стоят все рёбра, временную стойку убрать: распор шатра держит обвязка.</li></ul>`;
 case'brace':{const dg=Math.round(Math.hypot(m.W-60,m.D-60));return`<ul><li>Каркас стоит на наживлённых глухарях, кровли и пола ещё нет — выставлять нужно сейчас, <b>до подкосов</b>: подкосы фиксируют геометрию.</li><li>${poly?`По осям стоек: стороны — ${fmt(m.side)} мм, через центр — ${fmt(2*m.R)} мм (допуск ±5 мм).`:`Диагонали по осям стоек — ${fmt(dg)} мм, разница не больше 5 мм.`} Вертикаль каждой стойки — уровнем, верх — в один горизонт. ${m.FW?'Подправлять подкладками под обвязку.':'Подправлять регулировочными гайками.'}</li><li><b>Подкосы</b> ${TM?'100×100':poly?'50×100':'50×100'}: ${TM?'концы входят во врубки 15 мм в стойке и в балке, по 2 самореза 8×160 на конец':'низ — на язык стойки, 2 болта M10; верх — врубка 15 мм в балку, 2 самореза 8×160'}. Подкос работает на сжатие: подгонять плотно, без зазора.</li><li>Дотянуть глухари во всех коннекторах: головка прижимает сталь к брусу, но <b>не вдавливает её</b>.${m.FW?'':' Затем верхние гайки анкеров M12 — 35–40 Н·м и ещё раз проверить вертикаль.'}</li>${m.FW?'':'<li>Подливка: зазор под опорными пластинами забить густым пескобетоном 1:3. Обрешётку можно ставить сразу.</li>'}</ul>`;}
 case'purlins':if(m.pg)return`<ul><li>${wrd(cnt('panelRafter')/2,'щит','щита','щитов')}: 2 стропила 50×100 и поперечины 50×50 заподлицо, собраны дома на саморезах. Щиты ложатся на балки вдоль ската.</li><li>На балках — посадочная врубка по уклону, в каждую балку 2 самореза 6×120 наискось.</li><li>Соседние щиты вплотную: под стыком листов получается сдвоенное стропило шириной 100 мм.</li></ul>`;
  return`<ul><li>Обрешётка ${m.wPur?`50×${m.wPur==='e150'?150:100} на ребро`:'50×100 плашмя'}, шаг ≈${poly?BM.COVERS[m.cov].step:Math.round(m.rows.length>1?(m.rows[m.rows.length-1]-m.rows[0])/(m.rows.length-1):0)} мм${poly?', кольцами: на каждой грани отрезки с косыми торцами по оси рёбер':''}.</li><li>${poly?'В каждое ребро':g?'В каждое стропило':'В каждую балку'} — 2 самореза 6×120 через обрешётку. Стыки — только над опорами, в разбежку по рядам.</li><li>Торцы и срезы сразу покрыть составом для торцов.</li></ul>`;
 case'railframe':if(!TM)return null;return poly?`<ul><li>Поручень 50×100 и брусья 50×50 — с косыми торцами под грань стойки, врубка 10 мм, по 2 самореза 8×160 наискось на конец.</li><li>Высоту разметить от настила шнуром: поручни всех граней в один горизонт.</li></ul>`
  :`<ul><li>Секции из бруса собраны дома: стойки 50×50 + поручень 50×100 + брусья 50×50, на конструкционных саморезах.</li><li>Секцию подносят снаружи, прикладывают к стойке и стягивают болтами M8 насквозь через брус (15–20 Н·м).</li>${cnt('newel')?`<li>Вход ${m.E} мм: стойки входа уже стоят${fl?' (шаг «Каркас пола»)':''}: передняя секция прижимается к стойке 2 болтами M8.</li>`:''}</ul>`;
 case'finish':return`<ul><li>Протянуть болты через 2 недели и через год: брус усыхает, соединения слабеют. Потом — каждую весну.</li><li>Масло по брусу — раз в 3–4 года, солнечную сторону — чаще. Торцы проверять особенно внимательно: гниль начинается с них.</li><li>Сталь: сколы и шляпки болтов — цинк-спрей и подкраска.</li><li>Трещины вдоль волокон до 3 мм — норма для цельного бруса, на прочность не влияют; в них не должна затекать вода.</li></ul>`;
 }return null;
}
// подпись под выбором основания: что получилось при этих условиях
function dressNote(){const m=App.model,D=m.dress;if(!D)return'Окна и свет включаются отдельно: каркас считается и без них, а с закрытыми окнами — с ветром на стены.';
 const sum=App.bom.lines.filter(l=>l.cat==='Оформление').reduce((s,l)=>s+l.sum,0),W=D.wins,cat=W.filter(w=>w.fit).length,L=D.light,o=[],N=D.nets;
 if(W.length)o.push(`${W.length} ${plural(W.length,'окно','окна','окон')}: ${cat?`${cat} готовых из Леманы`:''}${cat&&W.length-cat?', ':''}${W.length-cat?`${W.length-cat} на заказ`:''}`);
 if(N.length)o.push(`${N.length} ${plural(N.length,'сетка','сетки','сеток')} на липучке`);
 if(L)o.push(L.type==='belt'?`гирлянда ${dec(L.len/1000,1)} м, ${L.bulbs} ${plural(L.bulbs,'лампа','лампы','ламп')}`:`лента ${dec(L.len/1000,1)} м, ${Math.round(L.watts)} Вт`);
 return`${o.join(' · ')} · <b>${rub(sum)}</b>${L?' · свет видно в режиме «Вечер» (луна над моделью)':''}`;}
function baseNote(){const m=App.model,c=App.cfg;if(!m.free)return'Бетонные столбы ниже промерзания: самый надёжный вариант, но ямы и неделя на бетон.';
 const B=m.base,bad=m.verify.rows.filter(r=>r.grp==='Основание'&&r.util>1),nA=B.anchors.length,kg=Math.round(B.kg*B.posts.length),h=m.F-m.y0,o=[];
 o.push(B.hold==='anchor'?`${nA} ${plural(nA,'анкер','анкера','анкеров')} в грунт`:kg?`пригруз ${fmt(kg)} кг: ${B.n} ${plural(B.n,'плита','плиты','плит')} на стойку`:'держит вес самой беседки');
 if(B.gas)o.push(`блок весит ≈20 кг и от отрыва ветром не держит — сваи те же, что у плит, плюс блоки и мастика: поэтому дороже плит`,`пол на ${fmt(h)} мм над землёй, поэтому только с полом и со ступенями. Блок обязан быть сухим: мастика со всех сторон, отсечка снизу, щебень выше земли`);else if(m.FW)o.push(`обвязка из бруса на 150 мм над землёй, пол на ${fmt(h)} мм`);
 return`${m.FW?'Обвязка из бруса':'Рама'} на опорах, без бетона: ${o.join('; ')}.${bad.length?` <span class="warn">${(hv=>hv?`На таком грунте нельзя: ${esc(hv.name.split(' (')[0].toLowerCase())} мм. Нужны столбы.`:`Здесь не проходит: ${esc(bad[0].name.split(':')[0].toLowerCase())}. ${B.hold==='weight'?'Выберите анкеры.':'Смотрите расчёт.'}`)(bad.find(r=>/Подъём/.test(r.name)))}</span>`:''}`;}
// шаги сборки без фундамента
function TF(id){
 const m=App.model,B=m.base,N=m.poly,cnt=r=>m.parts.filter(p=>p.role===r).length,So=BM.SOILS[m.cfg.soil],pad=B.nFoot,nA=cnt('anchor'),dg=Math.round(Math.hypot(m.W-60,m.D-60)),st=fmt(-B.yEnd+200),tr=fmt(-B.yTr),Rd=(BM.anchorRd(m.cfg.soil).Fd/1000).toFixed(1).replace('.',',');
 const axes=N?`${N} опор по окружности <b>R = ${fmt(m.R)} мм</b>, сторона <b>${fmt(m.side)} мм</b>`:`оси стоек — прямоугольник <b>${m.W-60} × ${m.D-60} мм</b>, диагонали <b>${dg} мм</b>`;
 switch(id){
  case'found':return`<p>Разбивка: ${axes}. Всего ${pad} ${plural(pad,'опора','опоры','опор')} ${B.gas?'из газоблоков':'на плитах'}${m.isFloor?', включая опоры под балками пола':''}.</p><ul><li>${B.gas||B.FW?`Снять дёрн по пятну опор: ${B.FW?'обвязка':'рама'} стоит над землёй, траншеи не нужны.`:`Снять дёрн. Вдоль линий рамы — траншея шириной 300 и глубиной ${tr} мм: рама не должна касаться грунта, он зимой пучит. Зазор 150 мм под трубой заполнит рыхлый щебень.`}</li><li>Под каждую опору — яма 700×700 мм, глубина <b>${B.gas?200:fmt(-B.yEnd+200+B.yEnd*0)} мм</b>${B.gas?' от земли':''}. Геотекстиль, щебень 20–40, трамбовать по 100 мм: на пучинистом грунте опору ставят только на такую подушку.</li>${B.gas?`<li>Щебень — на 60 мм выше земли, верх ровный, с уклоном от центра. Блоки стоят на этой подушке, вода от них уходит вниз.</li><li>На опору — <b>${B.nB===2?'2 блока рядом, 600×600 мм':'1 блок, 600×300 мм'}</b>. Снизу отсечка: рубероид в 2 слоя. <b>Все грани блока — битумная мастика в 2 слоя</b>: сухой блок держит с запасом, мокрый разрушается морозом. Верх блоков — в один горизонт, ±10 мм.</li>`:`<li>Плиты — верх в один горизонт по нивелиру, ±10 мм: точно выставят подкладки.</li>`}${!B.gas&&B.n>1?`<li>Пригруз: на стойку по <b>${B.n} плиты</b>, в каждой по центру отверстие Ø24. Снизу пластина 200×200, шпилька M16 через всю стопку, сверху гайка через пяту: плиты поднимаются только вместе с рамой.</li>`:''}<li>Глубина промерзания в расчёте 1,4 м. Торф, насыпной мусор, грунтовая вода у поверхности — не для этого варианта.</li></ul>`;
  case'ring':if(B.FW)return TFW('ring');return`<ul>${nA?`<li><b>Первыми — сваи, ${nA} шт.</b> Вкрутить рычагом вдвоём через заводские отверстия: вертикально, лопасть глубже 1,4 м, верх крышки на 70 мм ниже будущего ушка рамы. Рассчитано ${Rd} кН на сваю (${So.s}).</li>`:''}${N?`<li>Рама — ${m.mods.list.filter(x=>/^Дуга/.test(x.name)).length} сварные дуги ${B.sec.replace(/x/g,'×')}. Положить на пяты, стянуть фланцы болтами M12 класса 8.8, 4 на стык.</li>`:`<li>Лонжероны ${B.sec.replace(/x/g,'×')} — на пяты, подпятниками на шпильки: они несут стойки. Поперечины опускают сверху между столиками на языки, по 2 болта M12 на конец.</li><li>Диагонали рамы по осям стоек: <b>${dg} мм</b>, разница не больше 5 мм, проверить до затяжки.</li>`}<li>Уровень: стальные подкладки под подпятники. Верх столиков — в один горизонт по нивелиру, ±2 мм.</li>${nA?`<li>Шпильки свай проходят в отверстия Ø40 в ушках: промах до ±15 мм не страшен. Шайба-пластина, гайка до упора, без перетяжки.</li>`:''}<li>Через годы беседку выставляют заново: домкрат под раму и подкладка.</li></ul>`;
 }
 return null;}
// шаги нижней обвязки из бруса: при столбах и без фундамента одинаковы
function TFW(id){const m=App.model,cnt=r=>m.parts.filter(p=>p.role===r).length,N=m.poly,bS=m.bP,dg=Math.round(Math.hypot(m.W-60,m.D-60));
 switch(id){
  case'ring':return`<ul>${cnt('anchor')?`<li><b>Первыми — сваи, ${cnt('anchor')} шт.</b> Вкрутить рычагом вдвоём через заводские отверстия: вертикально, лопасть глубже 1,4 м.</li>`:''}<li>На ${m.free?'опоры':'столбы'} — рубероид в 2 слоя: брус не должен тянуть влагу из бетона. Верх опор в один горизонт по нивелиру, ±2 мм.</li><li>Коннекторы обвязки — на опоры, затем брус ${bS}×${bS} опускается в лотки: ${N?'стороны многоугольника, углы «на ус»':'сначала обвязка вдоль, между ней балки пола'}. По 8 глухарей 6×60 на лоток.</li>${N?'':`<li>Диагонали по осям стоек: <b>${dg} мм</b>, разница не больше 5 мм.</li>`}<li>${m.free?'Нагель M16 насквозь через обвязку в опору: держит от сдвига.':'Шпилька столба — насквозь через обвязку, гайка в потай: держит от отрыва.'}</li><li>Брус до установки: все резы — антисептик, торцы — состав для торцов, низ — 2 слоя масла.</li>${cnt('anchor')?`<li>Кронштейны: лоток с прорезью завести на шпильку сваи, щёки — на обвязку, 2 болта M12 насквозь. Гайка на шпильку до упора.</li>`:''}</ul>`;
  case'bottom':return`<ul><li>Обвязка и балки стоят с начала сборки, стойки держатся на них. Сейчас, под готовой крышей, — только лаги: стремянки на кровельных работах не ходили по полу.</li><li>Лаги 50×100 — между балками, заподлицо с верхом, в раскрытых опорах бруса (по 12 саморезов 5×50): ${cnt('joist')} шт.</li>${m.parts.some(p=>/^Стойка входа из бруса/.test(p.name))?'<li>Стойки входа 100×100: опорный коннектор на балку, 4 самореза 8×160, стойка в гнездо.</li>':''}</ul>`;
 }return null;}
function T(id){
 if(id==='dress')return TD();
 const m=App.model;let r=m.free?TF(id):m.FW?TFW(id):null;if(r==null)r=T0(id);
 if(m.FW&&!m.free&&id==='found')r=r.replace(/<\/ul>$/,`<li>Столбы выше земли на 135 мм: брус не должен стоять в зоне брызг. Сверху — по 2 шпильки, поперёк обвязки, ${m.bP/2+28} мм от оси.</li></ul>`);
 if(m.free&&typeof r==='string'){const B=m.base;r=r.replace(/<li>Подливка:.*?<\/li>/,'<li>Подливки нет: под пластиной воздух, вода стекает сама.</li>').replace(/Везти, когда фундамент простоял 7 суток\.?/,'Везти можно сразу: бетона нет, ждать нечего.').replace(/своего столбика/g,'своего столика на раме').replace(/, зазор подбить пескобетоном/g,'');
  if(id==='brace')r=r.replace(/<\/ul>$/,`<li>${B.FW?'Обвязка уже выставлена по уровню: стойки выверяют перед тем, как закрутить все глухари в коннекторах.':'Рама уже выставлена по уровню: стойки выверяют только гайками на своих шпильках.'}</li>${B.gas||B.FW?'':'<li>После выверки — засыпать траншеи рыхлым щебнем до уровня земли.</li>'}</ul>`);
  if(id==='shop')r=r.replace(/<\/(ul|ol)>\s*$/,(x,t)=>`${B.FW?'':`<li>Рама основания: столики и подпятники приварить до покраски, низ труб — дренаж Ø8. Трубы рядом со щебнем — цинк-спрей и 3 слоя краски${B.gas?'':', это самая мокрая зона каркаса'}.</li>`}${B.anchors.length?'<li>Сваи: на каждую приварить крышку 80×80×8 и шпильку M20×120 по оси, шов зачистить и покрасить.</li>':''}</${t}>`);
  if(id==='deck'&&m.y0<-100)r=r.replace(/(<\/ul>)?$/,`<ul><li>Ступени: ${m.FW?'косоуры из бруса':'сварная лестница'} на передней балке пола, низ стоит на двух плитах. Доски ступеней — по 2 на проступь, саморезами в поперечины.</li></ul>`);
  if(id==='finish')r=r.replace(/<\/ul>$/,`<li>Каждую весну: уровень рамы и гайки${B.anchors.length?', гайки свай подтянуть':''}. Подъём от пучения в расчёте до 5 см: домкрат и подкладки возвращают всё в горизонт.</li>${B.gas?'<li>Газоблоки осматривать каждый год: трещины, отслоение мастики, белёсые пятна. Срок службы — около 14 лет, потом заменить.</li>':''}</ul>`);}
 return r;}
function T0(id){
 if(App.model.mat&&App.model.mat!=='steel'){const r=TW(id);if(r!=null)return r;}
 {const r=TR_(id);if(r!=null)return r;}
 if(App.model.poly){const r=TP(id);if(r!=null)return r;}
 const m=App.model,fl=m.isFloor,L=m.layout,tr=m.truckSpec,g=m.gable,ax=m.W-60,az=m.D-60,dg=Math.round(Math.hypot(ax,az));
 const nMods=m.mods.list.length,cnt=r=>m.parts.filter(p=>p.role===r).length;
 switch(id){
 case'shop':{const SL={floorBeam:'балках пола',floorBeamP:'балках пола',ring:'ригелях обвязки',ringBrace:'подкосах обвязки',hip:'рёбрах шатра'},slot=[...new Set(m.parts.filter(p=>/пропил/.test(p.note||'')).map(p=>SL[p.role]||p.name.replace(/\s+\d.*$/,'').toLowerCase()))],tg=cnt('tongue'),ep=cnt('endPlate'),newel=cnt('newel');
  return`<p><b>Всё, что варится, делается здесь — дома, до выезда.</b> На участке сварки нет: модули соединяются болтами${m.poly?' через вварные языки':ep?' через вставки-шипы и торцевые пластины':' через вставки-шипы'}.</p><ol>
  <li>Нарезать трубы по вкладке «Раскрой». ${g?'Подкосы и раскосы':'Подкосы'} — «на ус» по шаблону, торцы зачистить.</li>
  <li>Отверстия — до сварки, по вкладке «Сверловка».${ep?' Отверстия Ø11 в оголовках и торцевых пластинах боковых рам сверлить по одному кондуктору: в средних порталах один болт проходит сразу через 2 пластины и оголовок.':''}${slot.length?` Пропилы 7 мм под языки — в ${slot.length>1?slot.slice(0,-1).join(', ')+' и '+slot[slot.length-1]:slot[0]}.`:''}</li>
  <li>Собирать каждый модуль на ровном столе: прихватки → проверка угольником и диагоналей → швы короткими участками вразбежку, чтобы не повело.</li>
  <li>${m.poly?`Стойка — с опорной пластиной и языками по шаблону: под ригели, подкосы${fl?', балки пола':''} и ребро. Ригель обвязки — с 2 языками снизу под подкосы. Центральный узел — с ${m.poly} языками под рёбра. Ребро — с заглушкой на свесе и ушками под обрешётку (пластина 10 мм, отверстия Ø6, по шаблону колец: по 2 на кольцо, по обе стороны оси). Подкосы — одиночные трубы: резы и пропилы.`:`${g?'Ферма варится вместе с ригелем, оголовками стоек и подкосами':'Ригель варится вместе с оголовками стоек и подкосами'} — одна жёсткая рама.${ep?' Боковая рама — ригель, 2 подкоса «на ус» и торцевые пластины 6 мм строго под прямым углом к ригелю.':''}${cnt('cleatW')?(m.slopeBack?' Упоры щитов (уголок 40×40×4) — на ригели, у внутренней грани каждого стропила щита.':` Упоры обрешётки (уголок 40×40×4) — на ${g?'стропила':'ригели'} по разметке рядов.`):''}${m.slopeBack?' Кровельный щит — 2 стропила 40×40 и поперечины 40×20 заподлицо.':''}${newel?` Стойка входа — труба 40×40 с опорной пластиной 120×120×8${fl?' и 2 языками под переднюю балку пола':''}.`:''}`}</li>
  ${m.poly?'':'<li>Вставки-шипы вварить в оголовки пробочными швами; подогнать так, чтобы входили в стойку плотно, без люфта.</li>'}
  ${tg?'<li>Языки 6 мм вварить по шаблону сборки — точно напротив пропилов. Лучше один раз примерить ответную деталь прямо в мастерской.</li>':''}
  <li>Все открытые торцы закрыть приварными заглушками 2 мм. Отбить шлак, зачистить, цинк-спрей на швы, 2 слоя грунт-эмали.</li></ol>
  <p class="small">${nMods} ${plural(nMods,'модуль','модуля','модулей')} и ${(m.weldLen/1000).toFixed(0)} м швов. Состав каждого модуля — во вкладке <a href="#" data-open="trans">«Модули и сварка»</a>. В 3D швы подсвечены оранжевым (кнопка «Швы»).</p>`;}
 case'truck':return`<p>Все модули ложатся плашмя в кузов «${esc(tr.t)}»: штабель <b>${L?Math.round(L.stackH):'—'} мм</b> при допустимых ${tr.H} мм под тентом.${m.split?' Порталы длиннее кузова, поэтому они разделены на половины с фланцами.':''}</p><ul><li>Везти, когда фундамент простоял 7 суток.</li><li>Между модулями — картон, чтобы не побить краску. Сверху россыпью: обрешётка, ${m.cov==='pc'?'поликарбонат (свёрнутый дугой или в рулоне, плёнкой наружу)':'листы кровли'}, ${fl?'доски, ':''}коробки с крепежом, подписанные по этапам.</li><li>Раскладка — как на 3D этого шага; самое тяжёлое — ближе к кабине, над осью.</li></ul>`;
 case'found':return`<p>Разбивка: оси стоек — прямоугольник <b>${ax} × ${az} мм</b>, диагонали <b>${dg} мм</b>. ${m.nP} портала с шагом ${Math.round(m.sP)} мм.</p><ul><li>${((n)=>n+' '+plural(n,'столб','столба','столбов'))(cnt('pillar'))} Ø200${cnt('bell')?` (${cnt('bell')} — с уширением Ø400 внизу: бур ТИСЭ с расширителем; держит отрыв ветром и снижает давление на грунт)`:''}: бур на <b>1350 мм</b>, 150 мм песка с трамбовкой, опалубка — рубероид в 2 слоя (скользящий слой от пучения), верх на +45 в один горизонт.</li><li>В каждом столбе 2 прутка Ø10 × 1150; под стойки — 4 шпильки M12 × 300${m.studs88?' класса 8.8':''} по фанерному шаблону (квадрат 90 мм)${fl&&cnt('support')?`, под балки пола — по 1 шпильке в центре`:''}${cnt('newel')?', под стойки входа — по 2 шпильки поперёк борта, через 80 мм':''}.</li><li>Фундамент — первым, за неделю до сборки: нагружать через 7 суток (полная прочность — 28). Пока он твердеет, варятся модули; бетон и песок удобнее купить рядом с участком.</li>${fl?'':'<li>Дёрн внутри контура снять сразу, на 70–100 мм: после кровли здесь будет щебёночный пол.</li>'}</ul>`;
 case'posts':return`<ul><li>${((n)=>n+' '+plural(n,'стойка','стойки','стоек'))(cnt('post'))} ${(m.postSec||'60x60x2').replace(/x/g,'×')} приезжают <b>с приваренными опорными пластинами 140×140×${m.baseT||6}</b>${fl?' и языками под балки пола — язык смотрит внутрь беседки, ставить по марке':''}.</li><li>На шпильки — регулировочные гайки и шайбы, верх шайб на +62 в один горизонт. Надеть стойку, сверху шайба и гайка M12 — <b>пока от руки</b>: затягиваются на шаге «Выверка».</li><li>Вертикаль — уровнем по двум граням, временно раскрепить рейками. ${m.slopeBack?'Верх стоек — ступенями по уклону: передние выше задних, длина каждой стойки — по её марке.':`Верх всех стоек — в один горизонт (+${m.Yj}), это важно для оголовков.`}</li></ul>`;
 case'bottom':return`<ul><li>Пол собирается под готовой крышей: каркас уже выверен и протянут, стремянки на кровельных работах стояли на земле, стружка от саморезов не попала на балки и доски.</li>${cnt('newel')?'<li><b>Первыми — стойки входа</b>: ножка с опорной пластиной 120×120 на 2 шпильки своего столбика, регулировочные гайки снизу (верх пластины на +68, как у стоек), сверху шайбы и гайки; выставить по уровню, затянуть, зазор подбить пескобетоном. Передняя балка пола — из трёх частей: концы на языках стоек и стоек входа, по 1 болту M8. Лаги у входа раздвинуты, доски потом огибают стойку.</li>':''}<li>Балки пола 60×40 опускаются сверху на языки стоек — язык входит в пропил нижней стенки. На каждый конец <b>1 болт M8</b> насквозь, сразу затянуть (15–20 Н·м).</li>${cnt('support')?`<li>Посередине балки лежат на опорных столиках с приварной гайкой: столик заранее накрутить на шпильку пониже, положить балку, выкрутить столик вверх до упора и закрепить 2 саморезами 5,5×32.</li>`:''}<li>Лаги 40×40 кладутся поверх балок с шагом ≈${Math.round(m.joistStep)} мм, каждая опора — на оцинкованном уголке и 4 саморезах 4,2×16.</li></ul>`;
 case'heads':return`<ul><li>${g?'Портал с фермой':'Оголовок портала'} — одна сварная рама: ${g?'затяжка-ригель, стропила, бабка, раскосы, ':m.slopeBack?'горизонтальный ригель с выносами, ':'наклонный ригель с выносами, '}оголовки стоек и подкосы. Узлы и подкосы — <b>на сварке</b>, болтов в раме нет.</li>${m.split?`<li>Половины портала сначала стыкуются на земле: фланцы ${g?'конька и затяжки':'ригеля'} — по 2 болта M10, затянуть сразу (25–30 Н·м), чтобы рама не сложилась при подъёме.</li>`:''}<li>Поднять раму вдвоём со стремянок и опустить вставками-шипами в стойки: шов «стойка — оголовок» на высоте +${m.Yj} получается тонкой линией, как будто стойка цельная.</li><li>На каждую стойку <b>1 болт M10</b> насквозь через стойку и шип, гайку пока наживить. Временно раскрепить раму, пока не стоят боковые связи.</li><li>На боковых гранях оголовков — только отверстия Ø11 под сквозные болты боковых рам: из оголовка ничего не торчит.</li></ul>`;
 case'sides':return`<ul><li>Боковая связь — сварная рама: ригель 60×40 и 2 подкоса «на ус», на торцах — пластины 6 мм. Раму опускают сверху вплотную к граням оголовков: на пути подкосов ничего не торчит.</li><li>Каждый торец — <b>2 сквозных болта M10</b> через пластину и оголовок, гайки пока наживить. ${m.nP-1} ${plural(m.nP-1,'пролёт','пролёта','пролётов')} × 2 стороны = ${(m.nP-1)*2} ${plural((m.nP-1)*2,'рама','рамы','рам')}, ${((n)=>n+' '+plural(n,'болт','болта','болтов'))(m.parts.filter(p=>p.step==='sides'&&p.kind==='bolt').length)}.</li>${m.nP>2?'<li>В средних порталах один болт стягивает сразу 2 рамы: его вставляют, когда стоят обе, — до этого первую держит струбцина на оголовке.</li>':'<li>Пока болты не вставлены, раму держит помощник или струбцина на оголовке.</li>'}<li>Наружные грани ригелей, пластин, оголовков и стоек — в одной плоскости.</li></ul>`;
 case'brace':return`<ul><li>Каркас стоит на наживлённых болтах, кровли и пола на нём ещё нет — выставлять его нужно сейчас.</li><li>Вертикаль каждой стойки — уровнем по двум граням; шов «стойка — оголовок» ${m.slopeBack?'у левой и правой стойки каждого портала — на одной отметке, порталы — ступенями по уклону':`у всех стоек на +${m.Yj}`} (шланговый уровень); диагонали по осям стоек — ${dg} мм, разница не больше 5 мм. Подправлять регулировочными гайками под пластинами.</li><li>Затянуть болты рамы M10 (шипы оголовков, боковые рамы) — 25–30 Н·м, затем верхние гайки анкеров M12 — 35–40 Н·м и ещё раз проверить вертикаль.</li><li>Подливка: зазор 17 мм под опорными пластинами забить густым пескобетоном 1:3. Пока он твердеет, нагрузку держат регулировочные гайки — обрешётку можно ставить сразу.</li></ul>`;
 case'purlins':if(m.slopeBack)return`<ul><li>${((n)=>n+' '+plural(n,'кровельный щит','кровельных щита','кровельных щитов'))(Object.keys(m.MODS).filter(k=>k.startsWith('panel')).length)}: 2 стропила 40×40 и поперечины 40×20 заподлицо, всё сварено дома. Щиты ложатся на ригели порталов вдоль ската, стыки — над ригелем.</li><li>Каждое стропило упирается в вварной упор на ригеле и крепится 2 саморезами 5,5×32 — болтов нет.</li><li>Соседние щиты стоят вплотную: под стыком листов поликарбоната получается сдвоенное стропило шириной 80 мм.</li></ul>`;
 return`<ul><li>Обрешётка 40×20 на ребро${g?` по ${m.rows.length} ${plural(m.rows.length,'ряду','ряда','рядов')} на скат`:`, ${m.rows.length} ${plural(m.rows.length,'ряд','ряда','рядов')}`} с шагом ≈${Math.round(m.rows.length>1?(m.rows[m.rows.length-1]-m.rows[0])/(m.rows.length-1):0)} мм.</li><li>Каждый ряд упирается в <b>вварной упор</b> на ${g?'стропиле':'ригеле'} и крепится 2 саморезами 5,5×32 — без уголков и болтов.</li><li>Стыки труб — только над порталами; крайние торцы закрыты заглушками.</li></ul>`;
 case'roof':return{c20:`<ul><li>Профнастил С20 0,45: ${((n)=>n+' '+plural(n,'лист','листа','листов'))(m.roofQty.sheets)}, нахлёст в 1 волну${m.gable?', на конёк — уплотнитель':''}.</li><li>Саморезы 4,8×29 с EPDM-шайбой в нижнюю волну, не перетягивать.</li><li>Торцевые планки по краям.</li></ul>`,tile:`<ul><li>Металлочерепица: ${((n)=>n+' '+plural(n,'лист','листа','листов'))(m.roofQty.sheets)}, шаг обрешётки = шаг волны 350 мм.</li><li>Саморезы в прогиб волны под ступенью, через волну.</li><li>Конёк на коньковом уплотнителе, торцевые планки.</li></ul>`,shingle:`<ul><li>OSB-3 12 мм сплошным настилом, зазор 3 мм.</li><li>Капельники, ветровые планки, подкладочный ковёр полосами по карнизу и коньку.</li><li>Гибкая черепица: 4 ершёных гвоздя на гонт, монтаж при +5 °C и выше.</li></ul>`,pc:`<ul><li>Сотовый поликарбонат 8 мм: каналы — вдоль ската, УФ-слой наружу. Стыки листов — только над порталами, в соединительном профиле.</li><li>Верхний торец — герметичная лента, нижний — перфорированная, сверху торцевой профиль.</li><li>Саморезы с термошайбой, отверстия в листе на 2–3 мм больше (температурное расширение), не перетягивать.</li>${m.slopeBack?'<li>По заднему свесу — желоб 125 мм с уклоном к трубе 3–5 мм на метр, водосточная труба Ø90 в заднем углу.</li>':''}</ul>`,ondulin:`<ul><li>Ондулин: нахлёст в 1 волну и 170 мм по длине, 20 гвоздей/саморезов с колпачком на лист — в гребень волны.</li><li>Конёк ондулин на тех же гвоздях.</li></ul>`,falc:`<ul><li>Кликфальц: панели на всю длину ската, без поперечных стыков; саморезы скрыты в замке.</li><li>Начинать от торца, против преобладающего ветра.</li></ul>`,pcm:`<ul><li>Монолитный профилированный поликарбонат: нахлёст в 1 волну, саморезы с EPDM-шайбой в верх волны, отверстия на 3 мм больше.</li>${m.slopeBack?'<li>По заднему свесу — желоб и водосточная труба.</li>':''}</ul>`}[m.cov];
 case'deck':return fl?`<ul><li>${m.deck.n} ${plural(m.deck.n,'ряд','ряда','рядов')} доски поперёк лаг, вдоль фасада${m.W>3000?' — по 2 доски в ряд, стыки вразбежку на лагах':', целиком по 3 м'}. Зазор 5 мм, вырезы под стойки${cnt('newel')?' и стойки входа':''}.</li>${m.cfg.deck==='wpc'?'<li>ДПК — на скрытых кляймерах: кляймер в паз доски, саморез со сверлом в стальную лагу. По торцам — 5 мм на расширение.</li>':'<li>Саморезы с крыльями 5,5×50, по 2 на лагу (крылья рассверливают доску и срываются на металле). Торцы — антисептик.</li>'}</ul>`:`<ul><li>Дёрн внутри контура снят ещё при разбивке. Геотекстиль внахлёст 100 мм, сверху щебень 20–40 слоем 70 мм, утрамбовать.</li></ul>`;
 case'railframe':return`<ul><li>Секции бортов приезжают <b>сваренными</b>: стойки 40×20 + брусья. Секцию подносят снаружи, прикладывают между стойками порталов и стягивают болтами M8 насквозь (15–20 Н·м); у средних стоек один болт держит сразу 2 секции.</li>${cnt('newel')?(fl?`<li>Вход ${m.E} мм: стойки входа уже стоят (шаг «Каркас пола»). Передняя секция прижимается к стойке входа своей стойкой 40×20 — 2 болта M8.</li>`:`<li>Вход ${m.E} мм: сначала стойки входа 40×40 — опорная пластина 120×120 на 2 шпильки своего столбика: регулировочные гайки с шайбами снизу, сверху шайбы и гайки M12; выставить по уровню, затянуть, зазор подбить пескобетоном. Затем передняя секция: её стойка 40×20 прижимается к стойке входа 2 болтами M8.</li>`):''}${m.parts.some(p=>/стык половин/.test(p.joint||''))?'<li>Задняя секция длиннее 3 м — она из двух половин, стойки у стыка стягиваются 2 болтами.</li>':''}</ul>`;
 case'fill':return{prof:`<ul><li>Профнастил С8, волна вертикально, саморезы 4,8×19 через волну.</li></ul>`,euro:`<ul><li>Штакетник 2 м режется по высоте борта, по 2 самореза в цвет на каждый брус.</li></ul>`,wood:`<ul><li>Доска 20×95, заранее пропитанная маслом, саморезы с крыльями 4,8×38.</li></ul>`}[m.cfg.fill];
 case'finish':return`<ul><li>Открытые торцы труб закрыты приварными заглушками ещё в мастерской — пластиковые не нужны.</li><li>Пропилы под языки и головки болтов — цинк-спрей и подкраска.</li><li>Протяжка болтов через 2 недели и каждую весну.</li></ul>`;
 }return'';
}
function stepFacts(s){
 const m=App.model,i=m.stepInfo[s.id]||{mods:[],joints:[],loose:[]};
 if(s.id==='shop'){const wl=(m.weldLen/1000).toFixed(0),n=m.mods.list.length;if(m.FW)return`брус и покупные коннекторы · ${m.parts.filter(p=>p.wood).length} деталей`;return`${n} ${plural(n,'сварной модуль','сварных модуля','сварных модулей')} · ${wl} м швов`;}
 if(s.id==='truck')return`штабель ${Math.round(m.layout.stackH)} мм из ${m.truckSpec.H} · один рейс`;
 const b=i.joints.reduce((a,j)=>a+j.n,0);
 return[i.nWeld?`${i.nWeld} сварн. ${plural(i.nWeld,'модуль','модуля','модулей')}`:'',b?`${b} ${plural(b,'болт','болта','болтов')}`:'',`без сварки`].filter(Boolean).join(' · ');
}
App.stepFacts=stepFacts;
/* ---------- узел крепления кровли: чертёж-сечение с подписями ---------- */
function roofNodeSVG(){
 const m=App.model,cov=m.cov,pg=m.slopeBack,poly=!!m.poly,k=0.62,acc='var(--accent)',wc='#e0892e',wdn=m.mat&&m.mat!=='steel';
 if(wdn)return woodNodeSVG();
 const R_=(x,y,w,h,f,extra)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f||'var(--chip)'}" stroke="currentColor" stroke-width="1.1" ${extra||''}/>`;
 const L_=(x1,y1,x2,y2,c,w,d)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c||'currentColor'}" stroke-width="${w||1}" ${d?`stroke-dasharray="${d}"`:''}/>`;
 const lab=(x,y,tx,ty,t,anchor)=>`${L_(x,y,tx,ty+3,'var(--muted)',0.8)}<circle cx="${x}" cy="${y}" r="1.8" fill="var(--muted)"/><text x="${tx+(anchor==='end'?-3:3)}" y="${ty}" text-anchor="${anchor||'start'}">${esc(t)}</text>`;
 const sheetY=(x,y0)=>{const p=cov==='c20'||cov==='pcm'?((x%85)<44?0:(x%85)<52?(((x%85)-44)/8)*12:(x%85)<77?12:12-(((x%85)-77)/8)*12):cov==='tile'?6*(1-Math.cos(2*Math.PI*x/113)):cov==='ondulin'?11*(1-Math.cos(2*Math.PI*x/59)):cov==='falc'?((x%210)<4?16:0):0;return y0-p;};
 const sheetPath=(x0,x1,y0)=>{let d='';for(let x=x0;x<=x1;x+=2)d+=(x===x0?'M':'L')+x+' '+sheetY(x,y0).toFixed(1)+' ';return`<path d="${d}" fill="none" stroke="${cov==='pc'||cov==='pcm'?'#7fb3d1':'currentColor'}" stroke-width="${cov==='pc'?5:1.8}"/>`;};
 let s=`<svg viewBox="0 0 440 236">`,ry=150,rh=60*k;
 const fx={c20:'Профнастил С20: саморез 4,8×29 с EPDM-шайбой в нижнюю волну, через волну',tile:'Металлочерепица: саморез 4,8×29 в прогиб волны под ступенью',ondulin:'Ондулин: 20 гвоздей с колпачком на лист, в гребень волны',falc:'Кликфальц: саморез 4,2×19 в замок — крепёж не виден',shingle:'OSB-3 12 мм (саморезы 4,2×51) + гибкая черепица (4 ершёных гвоздя на гонт)',pcm:'Монолитный ПК: саморез с EPDM в гребень, отверстие +3 мм',pc:'Сотовый ПК 8 мм: саморез с термошайбой, отверстие +3 мм'}[cov];
 if(!pg){
  const raf=m.gable?'Стропило фермы 60×40':poly?'Ребро шатра 60×40':`Ригель портала ${m.hb}×40`;
  s+=R_(20,ry,380,rh)+`<text x="210" y="${ry+rh/2+4}" text-anchor="middle">${esc(raf)} (вид сбоку)</text>`;
  const pw=20*k,ph=40*k,top=ry-ph;
  for(const px of [110,290]){
   s+=R_(px,top,pw,ph,'var(--surface2)')+L_(px,top,px+pw,top+ph,'var(--muted)',0.6)+L_(px+pw,top,px,top+ph,'var(--muted)',0.6);
   const t4=poly?1.6:2.6,legL=40*k,legH=40*k;
   if(poly){s+=`<rect x="${px-6.2}" y="${top+2.5}" width="6.2" height="${ph-2.5}" fill="currentColor" opacity="0.75"/><circle cx="${px-6.2}" cy="${ry-1}" r="2.6" fill="${wc}"/><circle cx="${px}" cy="${ry-1}" r="2.2" fill="${wc}"/>`;for(const yy of [top+12,top+26])s+=L_(px-10,yy,px+pw-3,yy,acc,1.6);}
   else{s+=`<path d="M${px-t4} ${top+ph-legH} h${t4} v${legH} h${-legL} v${-t4} h${legL-t4} z" fill="currentColor" opacity="0.75"/><circle cx="${px-legL}" cy="${ry-1}" r="2.6" fill="${wc}"/><circle cx="${px-t4}" cy="${top+ph-legH-1}" r="2.6" fill="${wc}"/>`;
    for(const yy of [top+8,top+18])s+=L_(px-10,yy,px+pw-3,yy,acc,1.6);}
   if(cov!=='shingle'&&cov!=='falc'){const y0=top-1;s+=L_(px+pw/2,y0-22,px+pw/2,top+ph*0.7,acc,1.6)+R_(px+pw/2-4,sheetY(px+pw/2,y0)-16,8,3,acc,'stroke="none"');}
  }
  if(cov==='shingle'){s+=R_(20,top-7.5,380,7.5,'#c9a46a')+R_(20,top-11,380,3.5,'#5a3428');for(const px of [110,290])s+=L_(px+pw/2,top-14,px+pw/2,top+12,acc,1.6);}
  else s+=sheetPath(20,400,top-1);
  s+=lab(poly?108:116,top+8,140,40,poly?'Ушко: пластина 10 мм, вварено в ребро дома (●)':'Упор: уголок 40×40×4, вварен дома (●)')+lab(102,poly?top+26:top+18,30,212,poly?'2 самореза 5,5×32 сквозь ушко в обрешётку':'2 самореза 5,5×32 сквозь упор в обрешётку')+lab(296,top+ph/2,320,74,poly?`Обрешётка ${(m.purlin&&m.purlin.sec||'40x20x2').replace(/x2$/,'').replace('x','×')}`:'Обрешётка 40×20 на ребро')+lab(300,top-12,250,20,fx,'end');
  s+=`<text x="20" y="232" fill="var(--muted)">● — сварной шов, сделан в мастерской. На участке — только саморезы.</text>`;
 }else{
  // пергола: сечение поперёк щитов над ригелем портала
  const rw=40*k,beamY=ry+8;rh=40*k;const crossY=beamY-rh;
  s+=R_(20,beamY,400,48)+`<text x="220" y="${beamY+30}" text-anchor="middle">Ригель портала (горизонтальный)</text>`;
  const J=210,rafX=[60,J-rw,J,380-rw];
  [[60+rw,J-rw],[J+rw,380-rw]].forEach(([a,b])=>{s+=R_(a,crossY,b-a,40*k,'var(--surface2)','stroke-dasharray="3 2"');});
  for(const x of rafX)s+=R_(x,beamY-rh,rw,rh,'var(--chip)');
  s+=`<path d="M${60+rw} ${beamY-24} h2.5 v22 h22 v2.5 h-24.5z" fill="currentColor" opacity=".75"/><circle cx="${60+rw+24}" cy="${beamY-1}" r="2.6" fill="${wc}"/>`;
  for(const yy of [beamY-18,beamY-9])s+=L_(60+rw-12,yy,60+rw+6,yy,acc,1.6);
  s+=`<rect x="20" y="${beamY-rh-5}" width="400" height="5" fill="#7fb3d1" opacity=".85"/>`+R_(J-14,beamY-rh-10,28,6,'#b9c0c7');
  for(const x of [70,140,290,360])s+=L_(x,beamY-rh-14,x,beamY-rh+14,acc,1.6)+R_(x-5,beamY-rh-16,10,3,acc,'stroke="none"');
  s+=lab(70,beamY-rh/2,30,60,'Стропило щита 40×40')+lab(J,beamY-rh/2,236,96,'Сдвоенное стропило под стыком листов')+lab(150,crossY+8,96,128,'Поперечина 40×20 заподлицо (на сварке)')+lab(J,beamY-rh-8,250,20,'Соединительный профиль 8 мм')+lab(360,beamY-rh-4,420,44,fx,'end')+lab(62+rw,beamY-14,60,214,'Упор на ригеле + 2 самореза 5,5×32 (● — шов дома)');
 }
 return`<div class="node"><h4>Узел: на чём лежит и чем крепится кровля</h4>${s}</svg><div class="small muted">Чтобы увидеть узел в 3D, включите «Разрез» на панели инструментов.</div></div>`;
}
function woodNodeSVG(){const m=App.model,cov=m.cov,lbl=m.gable?'Стропило фермы 100×150':m.poly?`Ребро шатра ${m.hip.b}×${m.hip.h}`:m.slopeBack?'Балка портала':'Балка портала';
 return`<div class="node"><h4>Узел: на чём лежит и чем крепится кровля</h4><svg viewBox="0 0 440 150"><rect x="20" y="96" width="400" height="44" fill="#c9a46a" stroke="currentColor" stroke-width="1.1"/><text x="220" y="123" text-anchor="middle" fill="#3b2a18">${esc(lbl)}</text>${[80,220,360].map(x=>`<rect x="${x-31}" y="65" width="62" height="31" fill="#d9b98a" stroke="currentColor" stroke-width="1.1"/><line x1="${x-14}" y1="58" x2="${x-14}" y2="112" stroke="var(--accent)" stroke-width="1.8"/><line x1="${x+14}" y1="58" x2="${x+14}" y2="112" stroke="var(--accent)" stroke-width="1.8"/>`).join('')}<path d="M20 62 H420" stroke="currentColor" stroke-width="2.2" fill="none"/><text x="20" y="20" fill="var(--muted)">Кровля: ${esc(BM.COVERS[cov].s)} — крепёж по инструкции покрытия</text><text x="20" y="38" fill="var(--muted)">Обрешётка ${m.wPur?`50×${m.wPur==='e150'?150:100} на ребро`:'50×100 плашмя'}</text><text x="20" y="54" fill="var(--muted)">2 самореза 6×120 на каждую опору</text></svg></div>`;}
function stepCard(s,i){
 const m=App.model,inf=m.stepInfo[s.id]||{mods:[],joints:[],loose:[]};
 let h=`<div class="small">${T(s.id)}</div>`;
 if(['purlins','roofDeck','roofUnder','roofEdge','roof','roofTrim'].includes(s.id))h+=roofNodeSVG();
 if(inf.mods.length)h+=`<h4>Ставим готовые модули</h4><div>${inf.mods.map(n=>`<span class="pill">${esc(n)}</span>`).join('')}</div>`;
 if(inf.loose.length)h+=`<h4>Отдельные детали</h4><div>${inf.loose.map(l=>`<span class="pill">${esc(l.name)} × ${l.n}</span>`).join('')}</div>`;
 if(inf.joints.length)h+=`<h4>Узлы на болтах</h4><table>${inf.joints.map(j=>`<tr><td>${esc(j.name)}</td><td class="n small">${esc(j.sizes)}</td></tr>`).join('')}</table>`;
 if(s.id!=='shop'&&s.id!=='truck')h+=`<p class="small ok">Сварка на участке не нужна${inf.siteWelds?': швы этого этапа уже сделаны дома в модулях':''}.</p>`;
 return h;
}
function tabAsm(){
 const m=App.model,nb=m.parts.filter(p=>p.kind==='bolt').length;
 let h=`<p class="small muted">${m.FW?'Сначала заготовка бруса: распил, сверловка, антисептик.':`Сначала мастерская: ${m.mods.list.length} ${plural(m.mods.list.length,'сварной модуль','сварных модуля','сварных модулей')}, ${dec(m.weldLen/1000,0)} м швов.`} На участке — только болты (${nb} шт) и саморезы. Каркас ставится на наживлённых болтах и протягивается после выверки, затем кровля${m.isFloor?', пол':''}${m.parts.some(p=>p.layer==='rail')?' и борта':''}. Нажмите на этап — 3D покажет его.</p><div class="steps">`;
 m.steps.forEach((s,i)=>{const row=`<span class="num">${i+1}</span><b>${esc(s.t)}</b><span class="cnt">${esc(stepFacts(s))}</span>`;
  h+=i===App.step?`<div class="scur"><div class="srow">${row}</div>${stepCard(s,i)}</div>`:`<div class="srow ${i<App.step?'done':''}" data-step="${i}">${row}</div>`;});
 return h+'</div>';
}

/* ---------- смета ---------- */
const CATC={'Брус':'#b98a52','Металл':'#5b6570','Кровля':'#b4593a','Пол':'#c08f58','Борта':'#8a6a5a','Фундамент':'#a3a29c','Основание':'#a3a29c','Крепёж':'#8f979f','Покраска и защита':'#5f8f74','Сварка (дома, в мастерской)':'#e0892e','Расходники':'#c3c9cf','Оформление':'#d9a441'};
const SRC={site:'с карточки',live:'с сайта',calc:'по весу',base:'база',est:'оценка'},srcOf=l=>`<span class="badge ${l.src==='site'||l.src==='live'?'site':'est'}">${SRC[l.src]||'оценка'}${l.src==='site'&&l.city?', '+esc(l.city):''}</span>`,goOf=l=>l.lk==='product'?'':l.lk==='sku'?'':l.lk==='catalog'?' · раздел':l.lk==='search'?' · поиск':'';
function tabBom(){
 const b=App.bom,cats=[...new Set(b.lines.map(l=>l.cat))];
 let h=`<div class="tot-card"><div><div class="tiny muted">Материалы · ${App.cfg.metal==='base'?'металл с металлобазы':'Лемана, LUVON'}</div><div class="v">${rub(b.total)}</div></div><div class="tiny muted" style="text-align:right">сталь ${fmt(b.steelKg)} кг${b.woodKg?` · брус ${fmt(b.woodKg)} кг`:''} · окраска ${dec(b.area)} м²<br>в обрезки ${rub(b.waste.rub)} <a href="#" data-open="cut">раскрой →</a></div></div>`;
 h+=`<div class="catbar">${cats.map(c=>`<i style="width:${b.byCat[c]/b.total*100}%;background:${CATC[c]||'#888'}" title="${esc(c)}: ${rub(b.byCat[c])}"></i>`).join('')}</div><div class="legend">${cats.map(c=>`<span style="--c:${CATC[c]||'#888'}">${esc(c.replace(' (дома, в мастерской)',''))} ${dec(b.byCat[c]/1000,0)} т</span>`).join('')}</div>`;
 {const ok=b.lines.filter(l=>l.src==='site'||l.src==='live'),sm=ok.reduce((s,l)=>s+l.sum,0);h+=`<p class="tiny muted">Цена с карточки товара: ${ok.length} из ${b.lines.length} строк, ${Math.round(sm/b.total*100)}% суммы. Остальное — оценка. Сверено ${esc(BM.PRICE_DATE)} по поисковой выдаче: дата снимка неизвестна, цены по городам расходятся в 1,5–2 раза.</p>`;}
 for(const c of cats){const ls=b.lines.filter(l=>l.cat===c);
  h+=`<details class="grp" open><summary><span>${esc(c)} <span class="muted tiny">${ls.length}</span></span><em>${rub(b.byCat[c])}</em></summary>${ls.map(l=>`<div class="bl"><a href="${l.url}" target="_blank" rel="noopener">${esc(l.name)}</a><span class="q">${String(l.qty).replace('.',',')} ${esc(l.unit)} · <b>${fmt(l.sum)}</b></span><div class="nt">${fmt(l.price)} ₽/${esc(l.unit)} ${srcOf(l)}${l.sku?` · арт. ${esc(l.sku)}`:''}${goOf(l)}${l.note?' · '+esc(l.note):''}${l.warn?` <span class="warn">· ${esc(l.warn)}</span>`:''}</div></div>`).join('')}</details>`;}
 h+=`<p class="tiny muted">Цены — Москва: карточки lemanapro.ru (<span class="badge site">сайт</span>) или оценка по рынку. Крепёж на развес (≈550 ₽/кг). В регионах ±15% — перед покупкой проверьте корзину.</p>`;
 h+=`<details class="more"><summary>Все типы и кровли при этих размерах</summary><table><tr><th>Тип · кровля</th><th class="n">с полом</th><th class="n">на ножках</th></tr>`;
 const cls=t=>t<=App.budget?'ok':t<=App.budget*1.2?'warn':'';
 for(const t in BM.TYPES)for(const k of BM.TYPES[t].covers){const cur=t===App.cfg.type&&k===App.cfg.cover;
  h+=`<tr data-cfg='${JSON.stringify({type:t,cover:k})}' style="cursor:pointer;${cur?'font-weight:700':''}"><td>${esc(BM.TYPES[t].t)} · ${esc(BM.COVERS[k].s)}</td><td class="n">${priceTag({type:t,cover:k,base:'floor'},'b')}</td><td class="n">${priceTag({type:t,cover:k,base:'legs'},'b')}</td></tr>`;}
 h+='</table></details>';
 const lo=priceTag({type:'mono',cover:'c20',base:'legs',rail:'0',metal:'base',W:3000,D:3000});
 h+=`<details class="more"><summary>Как приблизиться к бюджету ${fmt(App.budget)} ₽</summary><p class="small">Металлическая беседка с полом и бортами по розничным ценам — это 100+ тыс. ₽ материалов. Ближе всего: <b>«Модерн» 3×3 на ножках, профнастил, без бортов, металл с металлобазы ≈ ${lo}</b>.</p><ul class="small"><li><b>Металлобаза</b> (хлысты 6 м, резка в размер) дешевле розницы на 30–40%.</li><li><b>Очерёдность:</b> сначала каркас и крыша, пол и борта — во второй сезон; языки под балки пола можно вварить сразу.</li><li>Щебень, песок и бетон — навалом или миксером у местных поставщиков.</li><li>Посмотрите вкладку <a href="#" data-open="cut">Раскрой</a>: там размеры, при которых материал ложится без лишних листов и хлыстов.</li></ul></details>`;
 return h;
}

/* ---------- модули и сварка + погрузка ---------- */
function tabTrans(){
 const m=App.model,tr=m.truckSpec,b=App.bom,L=m.layout;
 let h=`<p class="small muted">${App.model.FW?'Секции бортов собирают дома на саморезах, сварки в них нет.':App.model.mat==='hybrid'?'Стальной низ варят дома, секции бортов из бруса собирают на саморезах.':'Каждый модуль варится дома целиком, до выезда.'} Для каждого: из каких деталей, какие швы и на каком этапе он ставится. В 3D — шаги «Мастерская» и «Погрузка», кнопка «Модули» раскрашивает их на беседке.</p>`;
 const stepOf=k=>{const s=m.steps.find(s=>m.parts.some(p=>p.module===k&&p.step===s.id&&p.kind!=='weld'));return s?`${m.steps.indexOf(s)+1}. ${s.t}`:'';};
 const groups=new Map();
 for(const x of m.mods.list){const sig=x.k.replace(/\d+(L|R)?$/,'')+'|'+x.dims.map(Math.round).join('x')+'|'+x.parts+'|'+x.welds;if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(x);}
 for(const arr of groups.values()){const x=arr[0];
  const ps=m.parts.filter(p=>p.module===x.k&&p.kind!=='weld');
  const det={};ps.forEach(p=>{if(p.role==='capPlate')return;const n=(p.mark?p.mark+' · ':'')+p.name.replace(/ \(.*\)$/,'');det[n]=(det[n]||0)+1;});
  const caps=ps.filter(p=>p.role==='capPlate').length;
  const ws={};m.parts.filter(p=>p.module===x.k&&p.kind==='weld').forEach(p=>{ws[p.name]=ws[p.name]||{n:0,l:0};ws[p.name].n++;ws[p.name].l+=p.len;});
  h+=`<div class="card"><div class="step-h" data-mod="${esc(x.k)}"><b>${esc(arr.length>1?x.name.replace(/:.*$/,''):x.name)}${arr.length>1?` × ${arr.length}`:''}</b><span class="cnt">${x.kg.toFixed(1)} кг</span></div>
   <div class="small muted">${x.dims.map(Math.round).join(' × ')} мм · шаг ${esc(stepOf(x.k))} · ${x.fits?`<span class="ok">влезает в кузов</span>`:'<span class="bad">не влезает</span>'}${arr.length>1?`<br>${arr.map(a=>`<a href="#" data-mod="${esc(a.k)}">${esc(a.name.replace(/^.*?: /,''))}</a>`).join(' · ')}`:''}</div>
   <h4>Детали</h4><ul class="small">${Object.entries(det).map(([n,c])=>`<li>${esc(n)} — ${c} шт</li>`).join('')}${caps?`<li>Заглушки приварные 2 мм — ${caps} шт</li>`:''}</ul>
   <h4>Сварка</h4>${Object.keys(ws).length?`<ul class="small">${Object.entries(ws).map(([n,v])=>`<li>${esc(n)}: ${v.n} шв., ${(v.l/1000).toFixed(2)} м</li>`).join('')}</ul>`:'<p class="small muted">Без сварки.</p>'}</div>`;
 }
 const q=k=>(b.lines.find(l=>l.key===k)||{qty:0}).qty,bags=q('concrete'),sand=q('sand'),grav=q('gravel');
 const roofA=(m.gable?(m.W+2*m.ovh)/Math.cos(m.ang*Math.PI/180):(m.W+2*m.ovh))*(m.D+2*m.ovhZ)/1e6,roofKg=Math.round((m.poly?m.roofQty.area:roofA)*{c20:5,tile:5,shingle:13,pc:1.7,falc:5,ondulin:3,pcm:1.6}[m.cov]),deckKg=m.isFloor?q('deck')*9:0,total=b.steelKg+(b.woodKg||0)+roofKg+deckKg+60,bulk=(bags+sand)*40+grav*50;
 h+=`<h3>Погрузка: ${esc(tr.t)}</h3><p class="small">Кузов ${tr.L}×${tr.W} мм, тент ${tr.H} мм. Модули уложены плашмя слоями, высота штабеля <b>${Math.round(L.stackH)} мм</b>.${m.split?' Порталы разделены пополам на фланцах, чтобы влезть по длине.':''}</p>
 <table><tr><td>Металлоконструкции</td><td class="n">${b.steelKg.toFixed(0)} кг</td></tr>${b.woodKg?`<tr><td>Брус</td><td class="n">${b.woodKg.toFixed(0)} кг</td></tr>`:''}<tr><td>Кровля</td><td class="n">≈${roofKg} кг</td></tr>${deckKg?`<tr><td>Доска пола</td><td class="n">≈${deckKg} кг</td></tr>`:''}<tr><td>Борта, крепёж, краска</td><td class="n">≈60 кг</td></tr><tr class="tot"><td>Итого</td><td class="n">≈${fmt(total)} кг</td></tr></table>
 ${total>1400?`<p class="warn small">Близко к пределу 1,5 т — разделите на 2 рейса.</p>`:`<p class="ok small">Один рейс, запас по массе есть.</p>`}
 <p class="small muted">${m.free?`Отдельно, до сборки — плиты (${q('slab')} шт, ${fmt(q('slab')*40)} кг), щебень ${dec(q('gravelBulk'))} м³${q('gasblock')?`, газоблоки ${q('gasblock')} шт`:''}${q('anchorH')?`, анкеры ${q('anchorH')} шт`:''}`:`Отдельно, до сборки — бетон и песок для фундамента (${bags+sand} меш., ${fmt((bags+sand)*40)} кг)`}${grav?`, позже щебень под пол (${fmt(grav*50)} кг)`:''}: удобнее заказать у поставщиков рядом с участком.</p>`;
 return h;
}

/* ---------- раскрой: что купить и что из чего резать ---------- */
const UNITW={'хлыст':['хлыст','хлыста','хлыстов'],'лист':['лист','листа','листов'],'доска':['доска','доски','досок'],'шт':['шт','шт','шт']};
const unitW=(u,n)=>{const w=UNITW[u]||UNITW['шт'];return plural(n,w[0],w[1],w[2]);};
const DIMW={W:'Ширина',D:'Глубина',ang:'Уклон'};
function sugText(s){const k=Object.keys(s.patch)[0],v=s.patch[k],cur=App.cfg[k],u=k==='ang'?'°':' мм';
 const head=`${DIMW[k]||k} ${k==='ang'?v:fmt(v)}${u} вместо ${k==='ang'?cur:fmt(cur)}${u}`;
 const eff=s.d<0?`<span class="ok">−${rub(-s.d)}</span>`:`+${rub(s.d)}`,area=Math.abs(s.dA)>=0.05?` · площадь ${s.dA>0?'+':'−'}${dec(Math.abs(s.dA))} м²`:'';
 const why=s.why.filter(w=>w.ds<0).slice(0,2).map(w=>`${w.n.trim()}: ${String(w.q1).replace('.',',')} вместо ${String(w.q0).replace('.',',')}`).join('; ');
 return`<b>${head}</b> — ${eff}${area}${why?`<br><span class="muted">${esc(why)}</span>`:''}`;}
function sugBlock(){
 if(!App.sug)return`<p class="tiny muted">Ищу соседние размеры, при которых материал ложится лучше…</p>`;
 if(!App.sug.length)return`<p class="tiny muted">Размеры удачные: соседние варианты не дешевле за квадратный метр.</p>`;
 return`<h3>Можно выгоднее</h3>`+App.sug.map((s,i)=>`<div class="sug"><div class="t">${sugText(s)}</div><button data-apply="${i}">Применить</button></div>`).join('');}
function barsHTML(pl){
 const groups=new Map();
 for(const b of pl.bins){const sig=b.stock.L+'|'+b.items.map(p=>p.len+':'+(p.mark||'')).join(',');if(!groups.has(sig))groups.set(sig,{b,n:0});groups.get(sig).n++;}
 let h='<div class="bars">';
 for(const {b,n} of groups.values())h+=`<div class="bar1"><span>${n>1?'×'+n:''}</span><div class="stick">${b.items.map(p=>`<span style="width:${p.len/b.stock.L*100}%" title="${esc((p.name||'кусок')+' — '+fmt(p.len)+' мм')}"${p.id!=null?` data-pid="${p.id}"`:''}>${p.len/b.stock.L>0.13?esc((p.mark?p.mark+' · ':'')+fmt(p.len)):''}</span>`).join('')}</div></div>`;
 return h+`</div><div class="tiny muted" style="margin-top:4px">Полоса — ${fmt(pl.bins[0].stock.L)} мм, штриховка — остаток, пропил учтён.</div>`;
}
function sheetsHTML(pl){
 let h='<div class="sheets">';
 pl.bins.forEach((b,i)=>{const s=b.sheet,k=150/Math.max(s.H,s.W),W=s.W*k,H=s.H*k,fs=9/k,used=b.items.reduce((a,it)=>a+it.w*it.h,0)/(s.W*s.H);
  h+=`<figure><svg width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${s.W} ${s.H}"><defs><pattern id="hatch" width="${8/k}" height="${8/k}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${8/k}" height="${8/k}" fill="var(--surface2)"/><rect width="${3/k}" height="${8/k}" fill="var(--line)"/></pattern></defs><rect class="st" width="${s.W}" height="${s.H}"/>${b.items.map(it=>{const y=s.H-it.y-it.h;const f2=Math.min(fs,it.w/5.6),lbl=it.w*k>26&&it.h*k>14?`<text x="${it.x+it.w/2}" y="${y+it.h/2+f2/3}" font-size="${f2}" text-anchor="middle">${Math.round(it.w)}×${Math.round(it.h)}</text>`:'';return`<rect class="pc" x="${it.x}" y="${y}" width="${it.w}" height="${it.h}"><title>${esc(it.r.name||'')} ${Math.round(it.w)}×${Math.round(it.h)}</title></rect>${lbl}`;}).join('')}</svg><figcaption>${i+1}: ${fmt(s.W)}×${fmt(s.H)} · ${Math.round(used*100)}%</figcaption></figure>`;});
 return h+'</div>';
}
function matCard(c){
 const pl=c.plan,u=Math.round(pl.util*100),wr=pl.cost*(1-pl.util),k=App.cfg.metal==='base'&&/^p\d|^ang/.test(c.key)?0.65:1;
 const buy=Object.entries(pl.by||{}).map(([key,q])=>{const n=BM.CAT[key]?BM.CAT[key].n:key;const sz=(n.match(/(\d[\d,]*\s*×\s*[\d,]+(?:\s*×\s*[\d,]+)?\s*(?:мм|м)|\d[\d,]*\s*м(?![мм²]))/)||[''])[0];return`${q} ${unitW(c.unit,q)}${sz?' '+sz:''}`;}).join(' + ')||`${pl.n} ${unitW(c.unit,pl.n)}`;
 return`<details class="mat" data-mk="${esc(c.key)}" ${App.matOpen[c.key]?'open':''}><summary><b>${esc(c.title)}</b><span class="eff"><b class="${u>=85?'ok':u>=65?'warn':'bad'}">${u}%</b><br><span class="muted tiny">−${fmt(wr*k)} ₽</span></span><small>купить ${esc(buy)} · ${rub(pl.cost*k)}</small></summary><div class="body">${pl.kind==='2d'?sheetsHTML(pl):barsHTML(pl)}${pl.remnants&&pl.remnants.length?`<div class="tiny muted" style="margin-top:6px">Годные остатки: ${pl.remnants.slice(0,8).map(r=>dec(r/1000,2)+' м').join(', ')}${pl.remnants.length>8?'…':''}</div>`:''}</div></details>`;
}
function tabCut(){
 const b=App.bom,w=b.waste,eff=w.of?1-w.pct:1,n=b.cuts.reduce((s,c)=>s+c.plan.n,0);
 let h=`<div class="kpis"><div class="kpi"><b class="${eff>=0.85?'ok':eff>=0.7?'warn':'bad'}">${Math.round(eff*100)}%</b><span>купленного — в дело</span></div><div class="kpi"><b>${rub(w.rub)}</b><span>уходит в обрезки</span></div><div class="kpi"><b>${n}</b><span>${plural(n,'хлыст или лист','хлыста и листа','хлыстов и листов')}</span></div></div>`;
 h+=sugBlock();
 h+=`<p class="tiny muted">Каждая позиция раскроена на минимум покупки. Свесы кровли, стыки досок и полосы поликарбоната уже подогнаны под длины листов и хлыстов. Нажмите на позицию, чтобы увидеть карту реза; на трубе — клик по куску открывает деталь.</p>`;
 const order=b.cuts.slice().sort((a,c)=>c.plan.cost*(1-c.plan.util)-a.plan.cost*(1-a.plan.util));
 for(const c of order)h+=matCard(c);
 return h;
}

function tabDrill(){
 const m=App.model;let h=`<p class="small muted">Все уникальные детали (марки). Размеры от указанного торца, мм. Залитый кружок — сквозное отверстие через обе стенки, пустой — только одна стенка.</p>`;
 for(const mk of m.marks.slice().sort((a,b)=>a.mark.localeCompare(b.mark,'ru',{numeric:true}))){const p=mk.p;h+=`<div class="card"><div class="step-h" data-mark="${esc(mk.mark)}"><span class="badge mark">${esc(mk.mark)}</span><b>${esc(p.name)}</b><span class="cnt">${mk.parts.length} шт</span></div><div class="small muted">${esc(sizeOf(p))}</div>${drawingOf(p)}</div>`;}
 return h;
}
function tabHw(){
 const b=App.bom,m=App.model;
 let h=`<h3>Болты</h3><table><tr><th>Размер</th><th class="n">шт</th><th>Где</th></tr>${b.boltLines.map(l=>`<tr><td><b>${esc(l.name.replace('Болт DIN 933 ','').replace(' оцинк. (кл. 5.8)',''))}</b></td><td class="n">${l.qty}</td><td class="small">${esc(l.note)}</td></tr>`).join('')}</table>`;
 h+=`<p class="small">К каждому болту — <b>2 шайбы DIN 9021</b> и <b>гайка DIN 985</b> с нейлоновым кольцом. Отверстия: M6 → Ø7, M8 → Ø9, M10 → Ø11, шпилька M12 → Ø14.</p>`;
 const sc={roof:'Кровельные саморезы',deck:'Саморезы с крыльями 5,5×50 (настил)',fill:'Саморезы 4,8×19 (заполнение бортов)',wood:'Саморезы с крыльями 4,8×38 (штакетник)'};
 const cnt={};m.screws.forEach(s=>cnt[s.type]=(cnt[s.type]||0)+1);
 const scN=k=>sc[k]||(Array.isArray(BM.FAST[k])?BM.FAST[k][0]:k);
 h+=`<h3>Саморезы</h3><ul>${Object.keys(cnt).filter(k=>k!=='tek'&&k!=='clip').map(k=>`<li>${esc(scN(k))}: <b>${cnt[k]}</b> шт</li>`).join('')}${m.C.clip?`<li>Саморезы 4,2×16 со сверлом (крепёжные уголки): <b>${m.C.clip}</b> шт</li>`:''}${m.C.selfDrill?`<li>Саморезы 5,5×32 со сверлом: <b>${m.C.selfDrill}</b> шт</li>`:''}${m.C.sc8?`<li>Конструкционные 8×160 (подкосы, раскосы, секции): <b>${m.C.sc8}</b> шт</li>`:''}${m.C.wood6?`<li>По дереву 6×120 (обрешётка): <b>${m.C.wood6}</b> шт</li>`:''}</ul>`;
 if(m.weldLen){const g={};m.parts.filter(p=>p.kind==='weld').forEach(p=>{g[p.name]=g[p.name]||{n:0,L:0};g[p.name].n++;g[p.name].L+=p.len;});
  h+=`<h3>Сварка (только дома)</h3><table><tr><th>Шов</th><th class="n">шт</th><th class="n">м</th></tr>${Object.entries(g).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.n}</td><td class="n">${(v.L/1000).toFixed(2)}</td></tr>`).join('')}<tr class="tot"><td>Итого</td><td></td><td class="n">${(m.weldLen/1000).toFixed(1)}</td></tr></table><p class="small">Инвертор 160–200 А, электроды Ø2,5, ток 70–90 А, катет шва 3 мм. Стенка 2 мм легко прожигается: короткие швы вразбежку, лучше «ёлочкой» или с паузами. Монтажных швов на участке нет: всё, что соединяется на месте, — на болтах.</p>`;}
 h+=`<h3>Моменты затяжки</h3><table><tr><th>Резьба</th><th>Момент</th><th>Ключ</th></tr><tr><td>M6</td><td>6–8 Н·м</td><td>10</td></tr><tr><td>M8</td><td>15–20 Н·м</td><td>13</td></tr><tr><td>M10</td><td>25–30 Н·м</td><td>17</td></tr><tr><td>M12 (анкер)</td><td>35–40 Н·м</td><td>19</td></tr></table><p class="small muted">Моменты занижены под трубу 2 мм: при полном моменте стенка сминается. Самоконтрящаяся гайка держит и так.</p>`;
 return h;
}
/* ---------- типы и кровля ---------- */
function tabTypes(){
 const c=App.cfg;
 const TI={gable:{pros:['классический силуэт, открытые фермы — красиво изнутри','любая кровля: черепица, профнастил, гибкая','снег сходит сам (25°)'],cons:['самая высокая и тяжёлая','больше обрешётки и доборных элементов']},
  mono:{pros:['современный вид, ровная линия кровли','дешевле «Классики» на 10–15%','вода уходит на одну сторону — легко поставить водосток'],cons:['уклон 10°: только профнастил или поликарбонат','снег сходит хуже — в снежных районах чистить']},
  pergola:{pros:['светлая крыша из поликарбоната, тень без темноты','выносы ригелей и обрешётки — лёгкий «архитектурный» вид','самая низкая — не загораживает участок'],cons:['поликарбонат служит меньше металла (10–15 лет)','уклон 5–8°: снег нужно счищать']},
  hex:{pros:['классическая «садовая» беседка, красива со всех сторон','шатёр: снег и вода уходят на все стороны','круглые стойки и центральный узел — без видимых болтов на кровле'],cons:['дороже прямоугольной той же площади','кровля режется треугольниками — больше отходов']},
  oct:{pros:['почти круглая, самая «парковая» форма','8 граней — мягкий силуэт, много света','короткие грани — короткие и лёгкие модули'],cons:['больше узлов и болтов, чем у шестигранника','кровля — 8 треугольников, отходы до 15–20%']}};
 const CI={tile:'Классический «домашний» вид, шумит в дождь. Шаг обрешётки = шаг волны 350 мм.',c20:'Дешевле всего и надёжно. Матовый полиэстер 0,45–0,5 мм не бликует.',falc:'Гладкие панели на всю длину ската, крепёж скрыт в замке — самый современный вид. От 12°.',shingle:'Тихо в дождь, мягкая фактура. Нужен OSB и подкладочный ковёр, монтаж в тепло. Лучший выбор для шатра.',ondulin:'Битумный волновой лист: лёгкий, тихий, дешёвый. Служит меньше металла, на солнце выцветает.',pcm:'Монолитный профилированный поликарбонат: светлый, крепится как профнастил, прочнее сотового.',pc:'Сотовый 8 мм: светлая тёплая крыша. Каналы вдоль ската, стыки над порталами, термошайбы.'};
 let h=roofNodeSVG()+`<p class="small muted">Пять типов на одной логике: всё сварное варится дома, на участке — только болты через вварные языки. Прямоугольные — порталы на вставках-шипах; многогранники — круглые стойки, рамы обвязки и шатёр на центральном узле. Цены — при текущих размерах, основании и бортах. Клик переключает 3D.</p>`;
 for(const t in BM.TYPES){const T=BM.TYPES[t],i=TI[t];
  h+=`<div class="card ${c.type===t?'cur':''}" data-cfg='${JSON.stringify({type:t})}' style="cursor:pointer"><h4>${esc(T.t)} <span class="badge">${T.ang}°</span> <span class="badge site">${priceTag({type:t})}</span></h4><div class="small muted">${esc(T.sub)}</div><div class="grid2 small" style="margin-top:6px"><div><b class="ok">Плюсы</b><ul>${i.pros.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><b class="warn">Минусы</b><ul>${i.cons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>
   <div>${T.covers.map(k=>`<span class="pill" data-cfg='${JSON.stringify({type:t,cover:k})}' style="cursor:pointer">${esc(BM.COVERS[k].t)} · ${priceTag({type:t,cover:k})}</span>`).join(' ')}</div></div>`;}
 h+=`<h3>Покрытия</h3><table><tr><th>Покрытие</th><th>Срок</th><th>Вес</th></tr>${Object.entries(BM.COVERS).map(([k,v])=>`<tr><td><b>${esc(v.t)}</b><div class="small muted">${esc(CI[k])}</div></td><td>${v.life}</td><td>${v.w}</td></tr>`).join('')}</table>`;
 h+=`<div class="card"><h4>Тренды 2026</h4><ul class="small"><li><b>Фальцевая кровля (кликфальц)</b> — гладкие панели без видимых саморезов. Ставится на ту же обрешётку с шагом 300 мм.</li><li><b>Монолитный поликарбонат</b> вместо сотового — светлая крыша на 15+ лет, крепится как профнастил.</li><li><b>Графитовый каркас + тёмная матовая кровля</b> — самое «дорогое» сочетание за те же деньги.</li></ul></div>`;
 return h;
}

/* ---------- надёжность ---------- */
function fixList(f,m){const o=[];if(!f)return o;
 if(f.heelS)o.push(`${f.heelS} саморезов на пяту фермы`);if(f.zBolt)o.push('болты M12 в торцевых коннекторах');if(f.wPur)o.push(`обрешётка 50×${f.wPur==='e150'?150:100} на ребро`);if(f.hipB)o.push(`${f.hipB} болта на конец ребра`);if(f.wBr)o.push('подкосы 100×100');
 if(f.wPost)o.push(`брус каркаса и коннекторы ${f.wPost}×${f.wPost}`);if(f.wSill)o.push(`обвязка ${f.wSill}×${f.wSill}`);if(f.wHip)o.push(`рёбра ${f.wHip.replace(/^w/,'').replace(/x/g,'×')}`);
 if(f.post)o.push(`стойки ${f.post.replace(/x/g,'×')}`);if(f.spigot)o.push(`шип ${f.spigot.replace(/x/g,'×')}`);
 if(f.base)o.push(`жёсткая база: пластина ${f.base==='fixed16'?16:10} мм`);if(f.studs88)o.push('шпильки M12 класса 8.8');
 if(f.nP)o.push(`${f.nP} ${plural(f.nP,'портал','портала','порталов')} — чаще, под нагрузку района`);
 if(f.pcStep)o.push(`поперечины под поликарбонат через ${fmt(f.pcStep)} мм`);if(f.purStep)o.push(`обрешётка с шагом ≤ ${fmt(f.purStep)} мм`);
 if(f.pads)o.push(`пригруз: ${f.pads} ${plural(f.pads,'плита','плиты','плит')} на стойку`);if(f.anc)o.push(f.anc===2?'анкеры у каждой стойки':'по 2 анкера на стойку');if(f.ringSec)o.push(`рама ${f.ringSec.replace(/x/g,'×')}`);
 if(f.bell)o.push('столбы с уширением Ø400 (бур ТИСЭ)');if(f.hip)o.push(`рёбра ${f.hip.replace(/x/g,'×')}`);if(f.postR)o.push('стойки Ø76×4');
 return o;}
/* сравнение материалов каркаса при текущих размерах и районе */
const matCache=new Map();
function matRow(k){const c=BM.sanitize(Object.assign({},App.cfg,{mat:k,$:undefined})),key=JSON.stringify(c);if(matCache.has(key))return matCache.get(key);
 if(k===(App.cfg.mat||'steel')){const r=Object.assign(matFrom(App.model,App.bom),{k});matCache.set(key,r);return r;}
 if(!matCache.has('?'+key)){matCache.set('?'+key,1);Q.call('mat',c,'opt').then(v=>{if(matCache.size>60)matCache.clear();matCache.set(key,Object.assign(v,{k}));if(App.tab==='calc')renderTab();},()=>matCache.delete('?'+key));}
 return null;}
function matFrom(m,b){const d=BM.durability(m,b),v=m.verify,fr=v.rows.filter(r=>['Каркас','Обрешётка и фермы','Узлы'].includes(r.grp)),wr=fr.reduce((a,r)=>r.util>a.util?r:a,fr[0]);return{total:b.total,kg:b.steelKg+(b.woodKg||0),bolts:m.parts.filter(p=>p.kind==='bolt').length,weld:m.weldLen/1000,ok:v.ok,max:wr.util,wn:wr.name.split(':')[0],d};}
function matCompare(){const ks=Object.keys(BM.MATS),R=ks.map(matRow),cur=App.cfg.mat||'steel',best=f=>Math.min(...R.map(f));
 if(R.some(r=>!r))return`<h3>Материал каркаса: что выбрать</h3><p class="small muted">Считаю ${ks.length} варианта в фоне…</p>${durCard()}`;
 const tr=(t,f,g)=>`<tr><td>${t}</td>${R.map(r=>{const v=f(r);return`<td class="n ${g&&g(r)===best(g)?'ok':''} ${r.k===cur?'cur':''}">${v}</td>`;}).join('')}</tr>`;
 return`<h3>Материал каркаса: что выбрать</h3><table class="cmpm"><tr><th></th>${R.map(r=>`<th class="n ${r.k===cur?'cur':''}"><a href="#" data-cfg='{"mat":"${r.k}"}'>${esc(BM.MATS[r.k].t)}</a></th>`).join('')}</tr>
 ${tr('Материалы',r=>rub(r.total),r=>r.total)}${tr('Масса',r=>fmt(r.kg)+' кг',r=>r.kg)}${tr('Загрузка каркаса',r=>`<span class="${r.ok?'':'bad'}" title="${esc(r.wn)}">${Math.round(r.max*100)}%</span>`,r=>r.max)}${tr('Срок службы над полом',r=>`≈ ${r.d.lifeTop} лет`,r=>-r.d.lifeTop)}${tr('Низ: ножки, балки пола',r=>`≈ ${r.d.lifeLow} лет`,null)}${tr('Обслуживание за 30 лет',r=>rub(r.d.maint30),r=>r.d.maint30)}${tr('Всего за 30 лет',r=>`<b>${rub(r.d.own30)}</b>`,r=>r.d.own30)}${tr('Сварка дома',r=>dec(r.weld,0)+' м',r=>r.weld)}${tr('Болтов на участке',r=>r.bolts,r=>r.bolts)}</table>
 <p class="tiny muted">Сравнение при текущих размерах, кровле и районе. Обслуживание — материалы своими руками, с заменой кровли и настила по сроку. Срок службы — прогноз по ISO 15686-1 при обслуживании по графику, не гарантия. Цены бруса — оценка по рынку.</p>${durCard()}`;}
const baseCache=new Map();
function baseRow(k){const o={pillar:{fnd:'pillar'},anchor:{fnd:'slab',hold:'anchor'},weight:{fnd:'slab',hold:'weight'},gas:{fnd:'gas',hold:'anchor',blocks:App.cfg.blocks||1}}[k],c=BM.sanitize(Object.assign({},App.cfg,o,{$:undefined})),key=JSON.stringify(c);
 if(baseCache.has(key))return baseCache.get(key);
 if(!baseCache.has('?'+key)){baseCache.set('?'+key,1);Q.call('base',c,'opt').then(v=>{if(baseCache.size>60)baseCache.clear();baseCache.set(key,Object.assign(v,{k,o}));if(App.tab==='calc')renderTab();},()=>baseCache.delete('?'+key));}
 return null;}
function baseCompare(){const ks=['pillar','anchor','weight','gas'],R=ks.map(baseRow);if(R.some(r=>!r))return'<h3>Основание: что выбрать</h3><p class="small muted">Считаю 4 варианта в фоне…</p>';const c=App.cfg,cur=c.fnd==='pillar'?'pillar':c.fnd==='gas'?'gas':c.hold==='weight'?'weight':'anchor',best=f=>Math.min(...R.map(f));
 const NM={pillar:'Столбы',anchor:'Плиты + анкеры',weight:'Плиты + пригруз',gas:`Газоблоки, ${c.blocks===2||c.blocks==='2'?'2 рядом':'1'} + анкеры`},WORK={pillar:'ямы 1,2 м, бетон 7 суток',anchor:'траншеи, 1 день',weight:'траншеи, 1 день',gas:'ямы под плиты, 1 день'};
 return`<h3>Основание: что выбрать</h3><div class="bcmp">${R.map(r=>`<a href="#" class="${r.k===cur?'cur':''}" data-cfg='${JSON.stringify(r.o)}'><b>${esc(NM[r.k])}</b><span class="n ${r.total===best(x=>x.total)?'ok':''}">${rub(r.total)}</span><span class="n u ${r.bad.length?'bad':''}" title="${esc(r.bad.map(x=>x.name).join('; ')||'Самая нагруженная проверка основания')}">${Math.round(r.u*100)}%</span><small>${esc(WORK[r.k])} · ${r.k==='pillar'?'держат вес столбов и грунт':r.k==='weight'?`${r.pads} ${plural(r.pads,'плита','плиты','плит')} на стойку`:`${r.n} ${plural(r.n,'анкер','анкера','анкеров')}`} · ${r.fl?`пол ${fmt(r.h)} мм над землёй`:'без пола'} · низ ≈ ${r.low} лет</small></a>`).join('')}</div>
 <p class="tiny muted">Справа — самая нагруженная проверка основания: больше 100% значит, что при этих условиях вариант не проходит. Анкеры считаются по СП 24.13330, п. 7.2.10; грунт в расчёте: ${esc(BM.SOILS[c.soil||'loam'].t.toLowerCase())}. Без столбов нужна связь опор — рама или обвязка: без неё опоры расходятся и пучатся порознь. Цены плит, блоков и анкеров — оценка по рынку.</p>`;}
function durCard(){const d=BM.durability(App.model,App.bom);
 return`<details class="more"><summary>Срок службы и обслуживание: ${esc(BM.MATS[App.cfg.mat||'steel'].t)}</summary><table>${d.elems.map(e=>`<tr><td>${esc(e.n)}<div class="tiny muted">${esc(e.note)}</div></td><td class="n">≈ ${e.life} лет</td></tr>`).join('')}</table><p class="small">Над полом ограничивает: <b>${esc(d.limTop)}</b>, ≈ ${d.lifeTop} лет. Низ у земли одинаков во всех вариантах: ≈ ${d.lifeLow} лет при подкраске по графику, ножки меняются по одной. Кровля и настил — отдельно.</p><table>${d.maint.map(x=>`<tr><td>${esc(x.n)}</td><td class="n small">раз в ${x.every} лет × ${x.times}</td><td class="n">${rub(x.rub)}</td></tr>`).join('')}<tr class="tot"><td>Итого за 30 лет</td><td></td><td class="n">${rub(d.maint30)}</td></tr></table></details>`;}
function tabCalc(){
 const m=App.model,v=App.calc,ch=App.checks(),env=v.env,c=App.cfg;
 const worst=v.rows.reduce((a,r)=>r.util>a.util?r:a,{util:0,name:''}),bad=v.rows.filter(r=>r.util>1);
 let h=v.ok?`<div class="verdict ok"><span class="ic">✓</span><div><b>Конструкция проходит проверку</b><div class="small">Самый нагруженный элемент — ${esc(worst.name.split(':')[0])}: ${Math.round(worst.util*100)}% несущей способности.</div></div></div>`
  :`<div class="verdict bad"><span class="ic">!</span><div><b>Не проходит ${bad.length} ${plural(bad.length,'проверку','проверки','проверок')}</b><div class="small">Это за пределами типового решения даже после усилений. Уменьшите высоту или размер, выберите другой тип — или нужен индивидуальный проект.</div></div></div>`;
 h+=matCompare();
 h+=baseCompare();
 h+=`<div class="envs"><label>Снеговой район<select id="v-snow">${snowOpts(c.snow)}</select></label><label>Ветровой район<select id="v-wind">${windOpts(c.wind)}</select></label></div>`;
 h+=`<p class="tiny muted">Снег на кровлю ${dec(env.S,2)} кПа${env.muL>1?' (на подветренном скате ×1,25)':''} · ветер ${dec(env.w0,2)} кПа, местность B · отрыв кровли ветром ${dec(env.Wup/1000)} кН при весе беседки ${dec(env.G/1000)} кН · борта закрывают ${Math.round(env.phi*100)}% боков</p>`;
 const fx=fixList(m.fixes,m);if(fx.length)h+=`<h3>Усилено автоматически под этот район</h3><div class="fx">${fx.map(x=>`<span>${esc(x)}</span>`).join('')}</div><p class="tiny muted">Конструктор поднимается по «лестнице» от дешёвого к дорогому, пока каждая проверка не пройдёт. Детали, раскрой и смета уже учитывают усиление.</p>`;
 if(App.angNote)h+=`<p class="small warn">${esc(App.angNote)}</p>`;
 for(const g of [...new Set(v.rows.map(r=>r.grp))]){h+=`<h3>${esc(g)}</h3>`;
  for(const r of v.rows.filter(r=>r.grp===g).sort((a,b)=>b.util-a.util)){const u=r.util,col=u<=0.8?'var(--ok)':u<=1?'var(--warn)':'var(--bad)';
   h+=`<div class="vrow"><div class="nm">${esc(r.name)}${r.val||r.note?`<small>${esc([r.val,r.note].filter(Boolean).join(' · '))}</small>`:''}</div><div class="util"><i style="width:${Math.min(100,u*100)}%;background:${col}"></i></div><div class="pc" style="color:${col}">${Math.round(u*100)}%</div></div>`;}}
 h+=`<h3>Геометрия и сборка</h3><ul class="small"><li class="${ch.bolt.length?'bad':'ok'}">Встречные болты и шаг отверстий: ${ch.bolt.length?ch.bolt.length+' конфликтов':'без конфликтов'}</li><li class="${ch.edge.length?'warn':'ok'}">Отступы отверстий от торцов и рёбер (≥ 1,2·d): ${ch.edge.length?ch.edge.length+' замечаний':'в норме'}</li><li class="${ch.coll.length?'bad':'ok'}">Пересечения деталей: ${ch.coll.length||'нет'}</li><li class="${m.mods.list.every(x=>x.fits)?'ok':'bad'}">Модули в кузове «${esc(m.truckSpec.t)}»: ${m.mods.list.filter(x=>x.fits).length} из ${m.mods.list.length}</li><li>Болтов на участке ${m.parts.filter(p=>p.kind==='bolt').length}, швов дома ${dec(m.weldLen/1000,0)} м · высота в свету ${fmt(m.dims.headroom)}${m.hasDoor?`, вход ${fmt(m.E)}`:''}, верх +${fmt(m.dims.top)}</li></ul>`;
 const list=[...ch.bolt.map(x=>`${x.p.name}: ${x.why}`),...ch.edge.map(x=>`${x.p.name}: Ø${x.h.d} ${x.why}`),...ch.coll.map(x=>`${x.a.name} × ${x.b.name}: ${x.o.toFixed(1)} мм`)];
 if(list.length)h+=`<details class="more"><summary>Подробности</summary><ul class="small">${list.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></details>`;
 if(m.mat&&m.mat!=='steel')h+=`<details class="more"><summary>Как считали брус</summary><p class="small">Древесина — СП 64.13330.2017: R = Rᴬ·mдл·mв. Rᴬ = 19,5 МПа (сорт 2, табл. 3), лиственница ×1,2 (табл. 5); снег mдл = 0,66, ветер 0,8 (табл. 4); улица под навесом — условия 4а, mв = 0,85 (табл. 9). Устойчивость — φ по ф. (13), (14), сжатие с изгибом — ф. (37). Узлы — готовые стальные коннекторы для бруса. Производители не публикуют допустимых нагрузок, поэтому гнездо считается по 8 саморезам 6×60 (СП 64, табл. 18), 0,85 кН на саморез: это оценка. Болт с пластинами снаружи (пята фермы) — табл. 18 и пп. 8.14–8.18: на шов смятие среднего элемента 0,5cd·kα·mдл·mв, изгиб 3,1d²·√(kα·mдл·mв); расстановка — п. 8.20: не меньше 2 болтов в узле, вдоль волокон ≥ 6d, поперёк ≥ 3d, от кромки ≥ 2,5d. Цельный брус построечного изготовления — растяжение минус 30% (прим. 1 к табл. 3). Срок службы — факторный метод ISO 15686-1, опорные сроки — оценка по EN 335/EN 350 и ISO 12944; это прогноз для сравнения, не гарантия.</p></details>`;
 if(m.free)h+=`<details class="more"><summary>Как считали основание без фундамента</summary><p class="small">Вся беседка считается одним жёстким телом на раме. Опрокидывание и отрыв: ветер γ = 1,4, вес γ = 0,9 (СП 20.13330); подъём кровли смещён к наветренному краю. Сдвиг: трение сталь — бетон 0,35, при полном отрыве держат штоки анкеров. Анкер: СП 24.13330, п. 7.2.10, Fd = γc·(α1·c + α2·γ·h)·A, запас γk = 1,4. Ушко сильнее анкера: зимой анкер отдаст раньше, чем сломается рама. Рама считается на полную потерю одной опоры: так расчёт не зависит от величины пучения. Подъём ограничен 5 см (табл. Б.1 пособия Минстроя «Проектирование оснований фундаментов на пучинистых грунтах», 2019), столбики связаны рамой (п. 8.2.9), опора — на щебёночной подушке (п. 8.2.4), зазор под рамой 150 мм (п. 8.2.10). Незаглублённые опоры допустимы при глубине промерзания до 1,7 м (п. 8.2.2). Газоблок: СТО НААГ 3.1-2013, табл. 9.1 и п. 6.1.2: применять можно только при защите от увлажнения. Блоки кладутся рядом, не стопкой: стопка только поднимает пол и уменьшает устойчивость. Свойства грунта, цены плит и анкеров — оценка; для ответственного случая нужны изыскания.</p></details>`;
 h+=`<details class="more"><summary>Как считали</summary><p class="small">Нагрузки — СП 20.13330.2016: снег по району (на скатах 20–30° у двускатных и шатров — неравномерный, ×1,25), ветер по району для местности B с пульсацией; коэффициенты надёжности 1,4 к снегу и ветру. Кровля без стен считается как навес (EN 1991-1-4, табл. 7.6–7.7) с учётом загромождения бортами. Сталь — СП 16.13330.2017: Ry = 235 МПа, γc = 0,95; рамы с подкосами — с податливостью опорной плиты и продольным изгибом стойки как консоли (μ = 2) с учётом второго порядка; болты — срез и смятие стенки 2 мм; фундамент — давление ≤ 200 кПа и отрыв ветром (рубероид снимает трение, держит вес столба и грунт над уширением). Поликарбонат и листы — по таблицам производителей. Это инженерная проверка с запасом, но не проект с подписью: на слабых грунтах и в горах — консультация на месте.</p></details>`;
 h+=`<details class="more"><summary>Надёжность на годы</summary><ul class="small"><li><b>${m.free?'Основание':'Фундамент'}:</b> ${m.free?'рама на опорах: зимой вся беседка поднимается вместе с грунтом, весной выставляется подкладками':'столбы на 1,2 м с подушкой и рубероидом — без выпучивания; шпильки с регулировкой — беседку можно выставить заново через годы'}.</li><li><b>Коррозия:</b> резы и отверстия — до покраски; швы и отверстия — цинк-спрей; 2 слоя грунт-эмали; торцы закрыты заглушками, внизу стоек дренаж Ø6.</li><li><b>Крепёж:</b> оцинкованные болты, увеличенные шайбы DIN 9021, самоконтрящиеся гайки DIN 985.</li><li><b>Обслуживание:</b> весной протянуть болты и подкрасить сколы; раз в 3–5 лет — обновить краску на солнечной стороне.</li></ul></details>`;
 return h;
}

function tabTools(){
 const wdT=App.model.mat&&App.model.mat!=='steel';
 return`<h3>Дома (мастерская)</h3><ul>${wdT?'<li>Ручная пила, стамески 20 и 40 мм, киянка — врубки подкосов</li><li>Сверло по дереву Ø13 × 200 мм, упор для перпендикулярности</li><li>Кисти, валик и лоток — антисептик и масло</li>':''}<li>УШМ 125 мм, отрезные диски 1,2 мм, зачистные и лепестковые круги</li>${1?'<li>Сварочный инвертор 160–200 А, маска-хамелеон, краги, электроды Ø2,5, молоток-шлакоотбойник, магнитные угольники</li><li>Ровный стол или козлы, струбцины, угольник, рулетка</li>':''}<li>Дрель на малых оборотах (Ø9–11: 400–600 об/мин), кернер, масло для свёрл</li><li>Кисть и валик, уайт-спирит, грунт-эмаль, цинк-спрей</li></ul><h3>На участке</h3><ul><li>Ручной бур Ø200–250, лопата, гидроуровень или лазерный нивелир</li><li>Ключи и головки 10, 13, 17, 19, желательно динамометрический</li><li>Шуруповёрт, уровень 1–2 м, стремянка, 2 человека</li></ul><h3>Безопасность</h3><ul class="small"><li>УШМ — только с кожухом, в очках и перчатках.</li><li>Сварка — в маске, при проветривании, без горючего рядом.</li><li>Кровлю монтировать вдвоём в безветрие. Профнастил резать ножницами по металлу, не болгаркой.</li></ul><h3>Обслуживание</h3><ul class="small"><li>Весной протянуть болты, подкрасить сколы.</li><li>Снег толще 30 см — очистить.</li><li>Дерево (настил, штакетник) раз в 2–3 года пропитывать маслом.</li></ul>`;
}

/* ---------- мастерская: модули, сверловка, крепёж, инструмент ---------- */
const SHOP=[['mods','Модули'],['drill','Сверловка'],['hw','Крепёж'],['tools','Инструмент']];
function tabShop(){return`<div class="seg subtabs" style="--c:4">${SHOP.map(([k,t])=>`<button data-shop="${k}" class="${App.shopTab===k?'on':''}">${t}</button>`).join('')}</div>`+({mods:tabTrans,drill:tabDrill,hw:tabHw,tools:tabTools}[App.shopTab]||tabTrans)();}

rebuild(false);
})();
