/* ---------------- оформление: мягкие окна ПВХ и свет по контуру (включается отдельно, каркас не меняет) ----------------
   Окно висит снаружи: плоскость — по самой выступающей детали пролёта, края — на стойках, верх — на балке, низ — на балке пола.
   Скоба ставится только там, где за ней есть брус или труба: точка проверяется лучом внутрь каркаса.
   Свет — гирлянда белт-лайт с провисом между стойками или LED-лента в профиле по низу балок. */
const WIN_CAT=[ // готовые мягкие окна Леманы: ПВХ до −39 °C, коричневая окантовка; fx — чем крепится (в комплекте)
 {w:1200,h:2000,pr:5330,city:'Ульяновск',fx:'strap',...PROD('myagkoe-okno-pvh-do-39-120x200sm-okantovka-korichnevaya-skoba-s-remeshkom','90305669')},
 {w:1300,h:2000,pr:4700,city:'Тула',fx:'strap',...BYSKU('91370395')},
 {w:2000,h:1500,pr:6150,city:'Тверь',fx:'strap',...BYSKU('90305808')},
 {w:2400,h:1400,pr:5471,city:'Новосибирск',fx:'strap',...BYSKU('91370431')},
 {w:1100,h:1200,pr:3510,city:'Иваново',fx:'turn',...BYSKU('90305879')},
 {w:1300,h:2200,pr:4862,city:'Барнаул',fx:'turn',...BYSKU('91370481')},
 {w:1400,h:2200,pr:6314,city:'Краснодар',fx:'turn',...BYSKU('91370470')},
 {w:1500,h:2200,pr:6270,city:'Киров',fx:'turn',...BYSKU('91370418')},
 {w:1500,h:2400,pr:6840,city:'Киров',fx:'strap',...BYSKU('90305684')}];
const pl_=(n,a,b,c)=>{const k=n%100,j=n%10;return k>10&&k<20?c:j===1?a:j>=2&&j<=4?b:c;};
const FX={strap:'скоба с ремешком',turn:'поворотная скоба'},ZIP_PR=1500;   // П-образная молния дверного проёма — оценка
// окно под размер шьют на заказ: медиана ₽/м² готовых окон Леманы + 20% за пошив по размеру (оценка)
const WIN_M2=(()=>{const v=WIN_CAT.map(c=>c.pr/(c.w*c.h/1e6)).sort((a,b)=>a-b);return Math.round(v[v.length>>1]*1.2/10)*10;})();
Object.assign(CAT,{
 winCustom:{n:'Мягкое окно ПВХ 0,7 мм на заказ, окантовка, люверсы, скобы с ремешками',u:'шт',pr:0,src:'est',url:LP+'/catalogue/myagkie-okna/',lk:'catalog'},
 belt:{n:'Гирлянда белт-лайт Uniel UDL-K122, 10 м, 20 ламп E27 LED',u:'шт',pr:2988,src:'site',city:'',...BYSKU('89390834')},
 ledTape:{n:'Лента светодиодная Lamper 141-496, 4,8 Вт/м, 12 В, IP65, 5 м',u:'шт',pr:613,src:'site',city:'Москва',...BYSKU('91381438')},
 ledPsu:{n:'Блок питания Ambrella 12 В 60 Вт IP67',u:'шт',pr:1400,src:'site',city:'Тверь',...BYSKU('91612693')},
 ledProf:{n:'Профиль накладной для LED-ленты Fiberli М1506, 2 м',u:'шт',pr:600,src:'site',city:'Клин',...BYSKU('91801689')},
 ledWire:{n:'Провод ПВС 2×0,75 мм², на отрезку',u:'м',pr:45,src:'est',url:S('провод ПВС 2х0,75'),lk:'search'},
 extCord:{n:'Удлинитель-шнур Партнер-Электро US106C-110OR, 10 м, IP44',u:'шт',pr:1670,src:'site',city:'Уфа',...BYSKU('93901404')},
 extCord2:{n:'Удлинитель-шнур iTOK i-connect-SUR-PVS-310-2-44-10, 10 м, 2 розетки с заземлением, IP44',u:'шт',pr:3780,src:'site',city:'Воронеж',...PROD('udlinitel-shnur-silovoy-itok-tip-sur-i-connect-sur-pvs-310-2-44-10-2-rozetki-s-zazemleniem-3x1-mm-10-m-2200-vt-cvet-chernyy','91554885')},
 belt5:{n:'Гирлянда белт-лайт Uniel UDL-K121, 5 м, 10 ламп E27, чёрная',u:'шт',pr:1056,src:'site',city:'Москва',...BYSKU('89390833')},
 ties:{n:'Стяжки кабельные Tdm 4,8×200 мм морозостойкие, 100 шт',u:'уп.',pr:245,src:'site',city:'',url:S('стяжки кабельные 4,8х200 морозостойкие'),lk:'search'},
 dwW:{n:'Саморез по дереву 4,2×32 оцинкованный, 200 шт',u:'уп.',pr:290,src:'est',url:S('саморез по дереву 4,2х32'),lk:'search'},
 netRoll:{n:'Москитное полотно Oxiss 10000×1400 мм, серое',u:'рулон',pr:2773,src:'site',city:'Москва',...BYSKU('90330618')},
 velcro:{n:'Лента-липучка TBY пришивная 25 мм, серая, пара по 25 м',u:'уп.',pr:561,src:'site',city:'Иваново',...PROD('lenta-lipuchka-tby-prishivnaya-kachb-shirina-25mm-cvet-f310-300-seryy-upakovka-25m-para','91828321')},
 dwP:{n:'Саморез с прессшайбой острый 4,2×25, 100 шт',u:'уп.',pr:220,src:'est',url:S('саморез с прессшайбой острый 4,2х25'),lk:'search'},
 dwS:{n:'Саморез по металлу 4,2×16 со сверлом (прессшайба), 100 шт',u:'уп.',pr:250,src:'est',url:S('саморез по металлу со сверлом 4,2х16'),lk:'search'}});
for(const c of WIN_CAT)CAT['win'+c.w+'x'+c.h]={n:`Мягкое окно ПВХ до −39 °C ${c.w/10}×${c.h/10} см, окантовка ПВХ, ${FX[c.fx]}`,u:'шт',pr:c.pr,src:'site',city:c.city,url:c.url,sku:c.sku,lk:c.lk};

// lite — для лестницы усилений: только размеры окон и сеток (ветер); скобы, лучи, гирлянда и лента строятся один раз, в итоговой модели
function dress(m,lite){
 const cfg=m.cfg,win=['pvc','both'].includes(cfg.win),net=['net','both'].includes(cfg.win),lt=['belt','led'].includes(cfg.light)?cfg.light:'0';
 m.dress=null;if(!win&&!net&&lt==='0')return;
 const P=m.parts,F=m.F;let uid=P.reduce((a,p)=>Math.max(a,p.id||0),0);
 const D={wins:[],nets:[],bom:[],winA:{x:0,z:0},netA:{x:0,z:0,a:0},scr:{dws:0,dww:0,dwp:0},br:0,light:null};
 const put=o=>{if(lite)return o;const p=Object.assign({kind:'box',layer:'dress',step:'dress',module:'loose',holes:[]},o);if(p.kind==='box'&&!p.az)p.az=norm(cross(p.ax,p.ay));p.id=++uid;P.push(p);return p;};
 const fast=(wood,p,n,t)=>{if(lite)return;t=t||(wood?'dww':'dws');m.screws.push({type:t,p,n,st:'dress'});D.scr[t]++;};
 // стойки по контуру, по кругу; у бруса на ножках — только брус
 let posts=P.filter(p=>p.kind==='tube'&&['post','postR','postW'].includes(p.role)&&p.layer!=='rail'&&Math.abs(p.az[1])>0.9);
 if(posts.some(p=>p.role==='postW'))posts=posts.filter(p=>p.role==='postW');
 const pts=[];for(const p of posts)if(!pts.some(q=>Math.hypot(q.x-p.o[0],q.z-p.o[2])<30))pts.push({x:p.o[0],z:p.o[2],hw:(p.sx||60)/2,wood:!!p.wood});
 if(pts.length<3)return;
 const cx=pts.reduce((s,q)=>s+q.x,0)/pts.length,cz=pts.reduce((s,q)=>s+q.z,0)/pts.length;
 pts.sort((a,b)=>Math.atan2(a.z-cz,a.x-cx)-Math.atan2(b.z-cz,b.x-cx));
 // детали каркаса как ориентированные коробки: для плоскости окна, опоры скоб и луча
 const OB=[];
 for(const p of P){if(!['frame','roofframe','rail','floor','hw'].includes(p.layer)||['decor','grout','pad','sand','pillar','gravel','stud','capPlate','deck','osb','shingle','underlay'].includes(p.role))continue;
  if(p.kind==='tube'){const z0=p.zA0||0,z1=p.zB1||p.L;OB.push({p,c:add(p.o,mul(p.az,(z0+z1)/2)),A:[p.ax,p.ay,p.az],h:[p.sx/2,p.sy/2,(z1-z0)/2],wood:!!p.wood});}
  else if(p.kind==='box'&&p.w&&p.h&&p.t)OB.push({p,c:p.c,A:[p.ax,p.ay,p.az],h:[p.w/2,p.h/2,p.t/2],wood:p.mat==='wood'||p.mat==='woodFill'});
  else if(p.kind==='angle')OB.push({p,c:add(p.o,add(add(mul(p.ax,p.A/2),mul(p.ay,p.B/2)),mul(p.az,p.L/2))),A:[p.ax,p.ay,p.az],h:[p.A/2,p.B/2,p.L/2],wood:false});}
 const ray=(o,d,tmax,L)=>{let best=null;
  for(const b of L||OB){let t0=0,t1=tmax;const r=sub(o,b.c);let ok=true;
   for(let k=0;k<3&&ok;k++){const e=dot(b.A[k],r),f=dot(b.A[k],d),h=b.h[k];
    if(Math.abs(f)<1e-9){if(Math.abs(e)>h)ok=false;continue;}
    let a=(-h-e)/f,c=(h-e)/f;if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)ok=false;}
   if(ok&&(!best||t0<best.t))best={t:t0,b};}
  return best;};
 for(const o of OB){const cs=corners8(o.p);o.lo=[0,1,2].map(k=>Math.min(...cs.map(c=>c[k])));o.hi=[0,1,2].map(k=>Math.max(...cs.map(c=>c[k])));}
 const near=(x0,x1,z0,z1)=>OB.filter(o=>o.hi[0]>=x0&&o.lo[0]<=x1&&o.hi[2]>=z0&&o.lo[2]<=z1);
 const n=pts.length,bays=[];
 for(let i=0;i<n;i++){const A=pts[i],B=pts[(i+1)%n],dx=B.x-A.x,dz=B.z-A.z,S=Math.hypot(dx,dz),t=[dx/S,0,dz/S];
  let nv=[t[2],0,-t[0]];if((A.x+B.x)/2*nv[0]-cx*nv[0]+((A.z+B.z)/2-cz)*nv[2]<0)nv=mul(nv,-1);
  bays.push({i,A,B,S,t,n:nv,o:[A.x,0,A.z],OB:near(Math.min(A.x,B.x)-500,Math.max(A.x,B.x)+500,Math.min(A.z,B.z)-500,Math.max(A.z,B.z)+500)});}
 // поворот контура у каждой стойки: край окна заходит за ось стойки на d·tg(θ/2) — окна соседних граней сходятся на углу
 const turn=i=>{const a=bays[(i-1+n)%n].t,b=bays[i].t;return Math.acos(Math.max(-1,Math.min(1,dot(a,b))));};
 const loc=(b,q)=>{const r=sub(q,b.o);return[dot(r,b.t),q[1],dot(r,b.n)];};
 const at=(b,u,y,v)=>add(add(b.o,mul(b.t,u)),add([0,y,0],mul(b.n,v)));
 // горизонтальные детали в плоскости грани: балка сверху, балка пола или нижний брус снизу
 const inPlane=b=>b.OB.filter(o=>o.p.kind==='tube'&&Math.abs(dot(o.p.az,b.t))>0.9&&Math.abs(o.p.az[1])<0.4).map(o=>{const cs=corners8(o.p).map(q=>loc(b,q)),us=cs.map(c=>c[0]),vs=cs.map(c=>c[2]);
   const s0=dot(sub(o.p.o,b.o),b.t),k=dot(o.p.az,b.t),hv=(Math.abs(o.p.ax[1])*o.p.sx+Math.abs(o.p.ay[1])*o.p.sy)/2;
   const yAt=u=>o.p.o[1]+o.p.az[1]*(u-s0)/k;
   return{o,u0:Math.min(...us),u1:Math.max(...us),v0:Math.min(...vs),v1:Math.max(...vs),vc:(Math.min(...vs)+Math.max(...vs))/2,bot:u=>yAt(u)-hv,top:u=>yAt(u)+hv,ym:yAt(b.S/2)};})
  .filter(h=>h.v1>-260&&h.v0<260&&h.u0<b.S*0.95&&h.u1>b.S*0.05);
 // несколько деталей вдоль пролёта — как одна: в каждой точке — та, что ближе к проёму; должны перекрывать 85% пролёта
 const compose=(b,hs,mode)=>{if(!hs.length)return null;
  if(mode==='high'){const t0=Math.max(...hs.map(h=>Math.max(h.top(Math.max(0,h.u0)),h.top(Math.min(b.S,h.u1)))));hs=hs.filter(h=>Math.max(h.top(Math.max(0,h.u0)),h.top(Math.min(b.S,h.u1)))>t0-30);}
  const iv=hs.map(h=>[Math.max(0,h.u0),Math.min(b.S,h.u1)]).sort((a,c)=>a[0]-c[0]);let cov=0,e=-1e9;for(const [a,c] of iv){if(c<=e)continue;cov+=c-Math.max(a,e);e=c;}if(cov<b.S*0.85)return null;
  const pick=u=>{const on=hs.filter(h=>u>=h.u0-60&&u<=h.u1+60),L=on.length?on:hs;return L.reduce((x,h)=>mode==='low'?(h.bot(u)<x.bot(u)?h:x):(h.top(u)>x.top(u)?h:x));};
  const bot=u=>pick(u).bot(u),top=u=>pick(u).top(u),sm=[0,0.25,0.5,0.75,1].map(k=>k*b.S),mid=pick(b.S/2);
  const set=new Set(hs.map(h=>h.o.p));
  return{h:{bot,top,vc:mid.vc,o:mid.o,has:p=>set.has(p)},y:mode==='low'?Math.min(...sm.map(bot)):Math.max(...sm.map(bot)),yt:mode==='low'?Math.min(...sm.map(top)):Math.max(...sm.map(top))};};
 for(const b of bays){const H=inPlane(b);
  // сверху — балка (или ригель из двух половин со стыком), не поручень высокого борта; снизу — балка пола или нижний брус
  const tops=H.filter(h=>h.ym>F+m.H*0.55&&h.o.p.layer!=='rail'&&!/^rail/.test(h.o.p.role));
  b.topM=compose(b,tops,'low');
  const bots=H.filter(h=>h.ym<F+500&&h.ym>(m.y0||0)+40&&!/^rail(Top|Mid)/.test(h.o.p.role));
  b.botM=bots.length?compose(b,bots.filter(h=>h.ym<=F+5).length?bots.filter(h=>h.ym<=F+5):bots,'high'):null;
  const rails=H.filter(h=>h.o.p.role==='railTop');let cov=0;for(const r of rails)cov+=Math.max(0,Math.min(b.S,r.u1)-Math.max(0,r.u0));b.railCov=cov/b.S;
  b.mz=(b.A.z+b.B.z)/2;}
 const okB=bays.filter(b=>b.topM);if(!okB.length)return;
 /* детали, которые задают плоскость стены: только этой стены. Детали соседней (перпендикулярной) стены у угла —
    её штакетины, стойки секций, лотки коннекторов поперечных балок — уходят внутрь на 100–330 мм и утаскивали сетку в воздух.
    Своя деталь: труба вдоль стены или вертикальная на линии стоек; плита/доска — тонкая поперёк стены (≤ 40 мм) и у линии стоек */
 const wallExt=(b,y0,y1)=>{let lo=1e9,hi=-1e9;const lim=Math.max(b.A.hw,b.B.hw);
  for(const o of b.OB){const p=o.p;if(p.layer==='roofframe'&&!b.topM.h.has(p))continue;
   const cs=corners8(p).map(q=>loc(b,q)),us=cs.map(c=>c[0]),ys=cs.map(c=>c[1]),vs=cs.map(c=>c[2]),v0=Math.min(...vs),v1=Math.max(...vs),vc=(v0+v1)/2;
   if(Math.max(...us)<-b.A.hw||Math.min(...us)>b.S+b.B.hw||Math.max(...ys)<y0||Math.min(...ys)>y1)continue;
   if(p.kind==='tube'){const ct=Math.abs(dot(p.az,b.t)),cy=Math.abs(p.az[1]),cn=Math.abs(dot(p.az,b.n));if(cn>0.3)continue;if(ct>0.9?Math.abs(vc)>lim+100:Math.abs(vc)>lim+10)continue;}
   else if(v1-v0>40||Math.abs(vc)>lim+60)continue;
   lo=Math.min(lo,v0);hi=Math.max(hi,v1);}
  return{lo,hi};};
 D._bays=bays.length;D._skip=bays.filter(b=>!b.topM).map(b=>({i:b.i,S:Math.round(b.S),A:[Math.round(b.A.x),Math.round(b.A.z)],B:[Math.round(b.B.x),Math.round(b.B.z)]}));
 const zMax=Math.max(...okB.map(b=>b.mz)),anyRail=bays.some(b=>b.railCov>0.5);
 for(const b of bays)b.door=!!b.topM&&b.mz>zMax-60&&(anyRail?b.railCov<0.9:true);
 const grp=(k,o)=>Object.assign(o,{grp:k});
 /* ---------- мягкие окна ---------- */
 if(win){const byKey={};let wi=0;
  for(const b of okB){wi++;
   const yT0=b.topM.y,yT=Math.min(yT0+40,b.topM.yt-8);
   const yB=b.botM?Math.max(b.botM.y+6,b.botM.yt-45):Math.max(F,m.y0||0)+80;
   // плоскость: самая выступающая деталь в прямоугольнике окна (стойки, балки, борта, пластины коннекторов)
   const vmax=wallExt(b,yB,b.topM.y-1).hi;
   const d=Math.max(vmax,b.A.hw)+8;
   const eA=d*Math.tan(turn(b.i)/2),eB=d*Math.tan(turn((b.i+1)%n)/2);
   /* готовое окно годится, только если люверсы (22 мм от края) ложатся на стойки, балку сверху и деталь снизу:
      край у стойки — в пределах её грани, верх — на балке, низ — на балке пола (или свободен, если её нет) */
   const lim=(hw,e,cor)=>cor?Math.min(hw+17,e+10):hw+17,cA=turn(b.i)>0.05,cB=turn((b.i+1)%n)>0.05;
   const wMin=b.S-(b.A.hw-27)-(b.B.hw-27),wMax=b.S+lim(b.A.hw,eA,cA)+lim(b.B.hw,eB,cB);
   const tMin=b.topM.y+27,tMax=b.topM.yt-5,bMin=b.botM?b.botM.y-17:(m.y0||0)+30,bMax=b.botM?b.botM.yt-27:Math.max(F,m.y0||0)+150;
   let fit=null;for(const c of WIN_CAT)for(const [cw,ch] of [[c.w,c.h],[c.h,c.w]]){if(cw<wMin||cw>wMax||ch<tMin-bMax||ch>tMax-bMin)continue;if(!fit||c.pr<fit.c.pr)fit={c,cw,ch};}
   // скатная балка сверху: окно-трапеция на заказ, верх идёт по балке; вход на такой грани — дверь на молнии
   const slope=Math.abs(b.topM.h.bot(b.S)-b.topM.h.bot(0))>30;if(slope)fit=null;
   const w=fit?fit.cw:Math.ceil((b.S+eA+eB-6)/10)*10;
   let h=fit?fit.ch:Math.ceil((yT-yB)/10)*10,top=yT;
   if(fit){if(top-h<bMin)top=Math.min(tMax,bMin+h);if(top-h>bMax)top=Math.max(tMin,bMax+h);}
   let um=(-eA+b.S+eB)/2;if(fit){const lo=Math.max(w/2-lim(b.A.hw,eA,cA),b.S-(b.B.hw-27)-w/2),hi=Math.min(w/2+b.A.hw-27,b.S+lim(b.B.hw,eB,cB)-w/2);um=Math.max(lo,Math.min(hi,um));}
   const bot=top-h,uL=um-w/2,uR=um+w/2,tAt=slope?u=>Math.min(b.topM.h.bot(u)+40,b.topM.h.top(u)-8):()=>top,tL=tAt(uL),tR=tAt(uR);
   const hL=Math.round((tL-bot)/10)*10,hR=Math.round((tR-bot)/10)*10,roll=b.door&&!slope,zip=b.door&&slope;
   const fx=fit?fit.c.fx:'turn',key=fit?'win'+fit.c.w+'x'+fit.c.h:(slope?`winT${w}x${hL}x${hR}`:`winC${w}x${h}`)+(zip?'z':''),G='dress-win-'+wi;
   const sz=slope?`${w}×${hL}…${hR}`:`${w}×${h}`,area=w*((tL+tR)/2-bot)/1e6;
   const side=['спереди','сзади','слева','справа'][Math.abs(b.n[2])>0.7?(b.n[2]>0?0:1):(b.n[0]<0?2:3)];
   const nm=m.poly?`грань ${wi}`:side,title=`Мягкое окно ПВХ ${sz}${slope?' трапеция':''} (${nm}${roll?', вход — скатывается':zip?', вход — дверь на молнии':''})`;
   const size=`${sz} мм · ПВХ 0,7 мм, окантовка 45 мм`+(fit?` · готовое ${fit.c.w/10}×${fit.c.h/10} см${fit.cw!==fit.c.w?' (повёрнуто)':''}`:' · на заказ');
   const why=roll?'вход: окно скатывается рулоном вверх и держится двумя ремешками; опускается в непогоду':zip?'вход на скатной грани: рулон не скатать — проём на П-образной молнии, верх окна идёт по балке':slope?'верх — по скатной балке: прямоугольное окно висело бы без опоры по верху':'закрывает пролёт от ветра и дождя; висит снаружи на скобах — каркас не сверлится насквозь';
   const base={grp:G,cat:key,size,why};
   byKey[key]=byKey[key]||{n:0,sz,w,h,fit,area:0,door:0,zip:0,slope};byKey[key].n++;byKey[key].area+=area;if(roll)byKey[key].door++;if(zip)byKey[key].zip++;
   D.winA.x+=area*Math.abs(b.n[0]);D.winA.z+=area*Math.abs(b.n[2]);
   const X=b.t,Y=[0,1,0],kant=(nm_,u0,y0,u1,y1)=>{const a=at(b,u0,y0,d+2.6),c=at(b,u1,y1,d+2.6),L=len(sub(c,a)),ax=norm(sub(c,a)),ay=Math.abs(ax[1])>0.9?X:norm(sub(Y,mul(ax,ax[1])));
     put(Object.assign({name:title+' — '+nm_,role:'winKant',c:mul(add(a,c),0.5),ax:Math.abs(ax[1])>0.9?Y:ax,ay:Math.abs(ax[1])>0.9?X:ay,w:L,h:45,t:1.6,mat:'kant'},base));};
   if(!roll){
    if(slope)put(Object.assign({kind:'tri',name:title,role:'winPane',pts:[[uL,bot],[uR,bot],[uR,tR],[uL,tL]],o:at(b,0,0,d+0.25),ax:X,ay:Y,az:norm(cross(X,Y)),t:1.5,h0:0,mat:'pvc'},base));
    else put(Object.assign({name:title,role:'winPane',c:at(b,um,bot+h/2,d+1),ax:X,ay:Y,w,h,t:1.5,mat:'pvc'},base));
    kant('окантовка верха',uL,tL-22.5,uR,tR-22.5);kant('окантовка низа',uL,bot+22.5,uR,bot+22.5);
    kant('окантовка',uL+22.5,bot+45,uL+22.5,tL-45);kant('окантовка',uR-22.5,bot+45,uR-22.5,tR-45);
    if(zip){const E=Math.min(m.E||900,w-500),hd=Math.min(2000,Math.min(tL,tR)-bot-160);
     for(const [a0,b0,a1,b1] of [[um-E/2,bot+45,um-E/2,bot+hd],[um+E/2,bot+45,um+E/2,bot+hd],[um-E/2,bot+hd,um+E/2,bot+hd]]){const a=at(b,a0,b0,d+2.8),c=at(b,a1,b1,d+2.8),ax=norm(sub(c,a));
      put(Object.assign({name:title+' — молния дверного проёма',role:'winZip',c:mul(add(a,c),0.5),ax,ay:Math.abs(ax[1])>0.9?X:Y,w:len(sub(c,a))+12,h:12,t:2,mat:'plastic'},base));}}}
   else{kant('окантовка верха',uL,top-22.5,uR,top-22.5);
    put(Object.assign({name:title+' — в рулоне',role:'winRoll',c:at(b,um,top-45-42,d+42),ax:Y,ay:b.n,w:80,h:80,t:w-90,round:true,mat:'pvcRoll'},base));
    for(const s of [-1,1])put(Object.assign({name:title+' — окантовка в рулоне',role:'winKant',c:at(b,um+s*(w/2-22.5),top-45-42,d+42),ax:Y,ay:b.n,w:84,h:84,t:45,round:true,mat:'kant'},base));
    for(const s of [-1,1])put(Object.assign({name:title+' — ремешок рулона',role:'winStrap',c:at(b,um+s*(w/2-260),top-45-42,d+42),ax:X,ay:Y,w:24,h:132,t:88,mat:'kant'},base));}
   // скобы: по периметру окна шагом ≤ 450 мм, в 22 мм от края; только там, где сзади есть деталь
   const u0=uL+22,u1=uR-22,y0=bot+22,pts_=[];
   const runs=(a,c)=>{const k=Math.max(1,Math.ceil((c-a)/450));return[...Array(k+1)].map((_,j)=>a+(c-a)*j/k);};
   for(const u of runs(u0,u1))pts_.push([u,tAt(u)-22,'top']);
   if(!roll){for(const u of runs(u0,u1))pts_.push([u,y0,'bot']);
    const st=wi%2;for(const [u,yt] of [[u0,tAt(u0)-22],[u1,tAt(u1)-22]]){const r=runs(y0,yt);for(let j=1;j<r.length-1;j++)pts_.push([u,st?(r[j]+r[j-1])/2:r[j],'side']);if(st)pts_.push([u,(r[r.length-1]+r[r.length-2])/2,'side']);}}   // боковые скобы через одно окно — вразбежку: у общей стойки не сталкиваются
   let nb=0;
   if(lite)nb=pts_.length;else for(const [u,y,e] of pts_){const P0=at(b,u,y,d+20),hit=ray(P0,mul(b.n,-1),220,b.OB);if(!hit)continue;
    const surf=add(P0,mul(b.n,-hit.t)),gap=hit.t-20,ex=e==='side'?Y:X,ey=e==='side'?X:Y;
    put(Object.assign({name:(fx==='strap'?'Скоба с ремешком':'Скоба поворотная')+' (окно '+nm+')',role:'winBracket',c:add(surf,mul(b.n,(gap+10)/2)),ax:ex,ay:ey,w:26,h:9,t:gap+10,mat:'galv'},base,{size:'скоба 26×9 мм, 2 самореза',why:fx==='strap'?'ремешок пропущен через люверс и скобу, затягивается пряжкой':'люверс окна надевается на скобу, скоба поворачивается и запирает его',cat:hit.b.wood?'dwW':'dwS'}));
    put(Object.assign({name:'Люверс окантовки (окно '+nm+')',role:'winEyelet',c:at(b,u,y,d+3.6),ax:X,ay:Y,w:22,h:22,t:1.4,round:true,mat:'galv'},base));
    for(const s of [-1,1])fast(hit.b.wood,add(surf,mul(ex,s*9)),b.n);nb++;}
   D.br+=nb;D.wins.push({nm,sz,w,h,area,fit:!!fit,roll,zip,slope,brackets:nb,bottomFree:!b.botM,off:Math.round(d-Math.max(b.A.hw,b.B.hw))});}
  for(const k in byKey){const v=byKey[k],a=v.area.toFixed(1).replace('.',','),one=v.area/v.n;
   if(v.fit)D.bom.push({key:k,qty:v.n,note:`${v.n} ${pl_(v.n,'окно','окна','окон')} на ${a} м²${v.fit.cw!==v.fit.c.w?', вешается боком':''}${v.door?' · входное скатывается':''}`});
   else{const pr=Math.round((one*WIN_M2+(v.zip?ZIP_PR:0))/10)*10;
    D.bom.push({key:k,base:'winCustom',qty:v.n,name:`Мягкое окно ПВХ 0,7 мм на заказ ${v.sz} мм${v.slope?', трапеция (верх по балке)':''}${v.zip?', дверной проём на молнии':''}, окантовка, скобы`,price:pr,
     note:`${v.n} × ${one.toFixed(2).replace('.',',')} м²${v.door?' · входное скатывается':''} · ${v.slope?'косой верх':'готового такого размера в Лемане нет'}`,
     warn:`Цена — оценка: медиана готовых окон Леманы ${Math.round(WIN_M2/1.2)} ₽/м² + 20% за пошив по размеру${v.zip?` + ${ZIP_PR} ₽ за молнию`:''}. Шьют тентовые мастерские; дайте им размеры из этой строки.`});}}}
 /* ---------- москитная сетка: изнутри, на ленте-липучке. Мягкую половину пришивают по краю сетки,
    жёсткую — саморезами с прессшайбой через 200 мм к стойкам, балке и настилу. Порыв ветра её отстёгивает — каркасу это ничем не грозит ---------- */
 if(net){const pieces=[];let wi=0,velc=0;
  for(const b of okB){wi++;
   const bot0=m.isFloor?F:b.botM?b.botM.y:Math.max(F,m.y0||0)+40;
   const vmin=wallExt(b,bot0,b.topM.y-1).lo;
   const dI=Math.min(vmin,-b.A.hw)-14,slope=Math.abs(b.topM.h.bot(b.S)-b.topM.h.bot(0))>30;   // 14 мм от грани — над головками саморезов и шнуром удлинителя
   b.netD=-dI;const uL=b.A.hw-28,uR=b.S-b.B.hw+28,w=uR-uL,tAt=u=>b.topM.h.bot(u)+31,tL=tAt(uL),tR=tAt(uR),bot=bot0+(m.isFloor?2:0);
   const area=w*((tL+tR)/2-bot)/1e6,hMax=Math.max(tL,tR)-bot,G='dress-net-'+wi,X=b.t,Y=[0,1,0];
   const side=['спереди','сзади','слева','справа'][Math.abs(b.n[2])>0.7?(b.n[2]>0?0:1):(b.n[0]<0?2:3)],nm=m.poly?`грань ${wi}`:side;
   const title=`Москитная сетка ${Math.round(w)}×${Math.round(hMax)} (${nm}${b.door?', вход — скатывается':''})`,base={grp:G,cat:'netRoll',size:`${Math.round(w)}×${Math.round(hMax)} мм из полотна 1,4 м, край — мягкая половина липучки`,why:b.door?'вход: сетка скатывается вверх и подвязывается; опускается на липучку':'от комаров; висит изнутри на липучке, в порыв ветра отстёгивается, а не рвётся'};
   if(!b.door){if(slope)put(Object.assign({kind:'tri',name:title,role:'netPane',pts:[[uL,bot],[uR,bot],[uR,tR],[uL,tL]],o:at(b,0,0,dI),ax:X,ay:Y,az:norm(cross(X,Y)),t:0.8,h0:0,mat:'net'},base));
    else put(Object.assign({name:title,role:'netPane',c:at(b,(uL+uR)/2,(bot+tL)/2,dI),ax:X,ay:Y,w,h:tL-bot,t:0.8,mat:'net'},base));}
   else{const tT=Math.min(tL,tR),um=(uL+uR)/2,yR=tT-58;   // вход: верх сетки — на липучке под балкой, под ним рулон вплотную к плоскости, две завязки вокруг
    put(Object.assign({name:title+' — верх над рулоном',role:'netPane',c:at(b,um,(tT+yR)/2,dI),ax:X,ay:Y,w:w-20,h:tT-yR,t:0.8,mat:'net'},base));
    put(Object.assign({name:title+' — в рулоне',role:'netRoll',c:at(b,um,yR,dI-24),ax:Y,ay:b.n,w:46,h:46,t:w-60,round:true,mat:'netRoll'},base));
    for(const sg of [-1,1])put(Object.assign({name:title+' — завязка рулона',role:'netTie',c:at(b,um+sg*(w/2-240),yR+10,dI-24),ax:X,ay:Y,w:16,h:72,t:52,mat:'kant'},base));}
   if(!lite){   // жёсткая половина ленты на каркасе: стойки (своя половина грани), балка сверху, настил снизу; саморез — только если за лентой деталь
   const strip=(nm_,a,c,ex,ey,pts_,dir,wood)=>{const L=len(sub(c,a));if(L<50)return;put(Object.assign({name:'Лента-липучка жёсткая (сетка '+nm+')'+nm_,role:'netVelcro',c:mul(add(a,c),0.5),ax:ex,ay:ey,w:L,h:25,t:2.5,mat:'velcro'},base,{cat:'velcro',size:`${Math.round(L)} мм, лента 25 мм`,why:'держит сетку; мягкая половина пришита по её краю'}));velc+=L;
    for(const q of pts_)fast(wood,q,dir,wood?'dwp':'dws');};
   for(const [u,pA] of [[b.A.hw-14,b.A],[b.S-b.B.hw+14,b.B]]){const y0=bot+40,y1=(u<b.S/2?tL:tR)-45,P0=at(b,u,(y0+y1)/2,dI-60),h=ray(P0,b.n,200,b.OB);if(!h)continue;const vs=dot(sub(add(P0,mul(b.n,h.t)),b.o),b.n),k=Math.max(2,Math.ceil((y1-y0)/200)),sc=[];
    for(let j=0;j<=k;j++){const y=y0+(y1-y0)*j/k,Q=at(b,u,y,vs-60),hh=ray(Q,b.n,120,b.OB);if(hh)sc.push(add(Q,mul(b.n,hh.t-1.4)));}
    strip(', стойка',at(b,u,y0,vs-1.3),at(b,u,y1,vs-1.3),Y,X,sc,mul(b.n,-1),h.b.wood);}
   {const P0=at(b,(uL+uR)/2,b.topM.h.bot((uL+uR)/2)+16,dI-60),h=ray(P0,b.n,220,b.OB);if(h){const vs=dot(sub(add(P0,mul(b.n,h.t)),b.o),b.n),k=Math.max(2,Math.ceil(w/200)),sc=[];
    for(let j=0;j<=k;j++){const u=uL+20+(w-40)*j/k,Q=at(b,u,b.topM.h.bot(u)+16,vs-60),hh=ray(Q,b.n,120,b.OB);if(hh)sc.push(add(Q,mul(b.n,hh.t-1.4)));}
    const a=at(b,uL+10,b.topM.h.bot(uL+10)+16,vs-1.3),c=at(b,uR-10,b.topM.h.bot(uR-10)+16,vs-1.3),ax=norm(sub(c,a));strip(', балка',a,c,ax,Y,sc,mul(b.n,-1),h.b.wood);}}
   if(m.isFloor){const k=Math.max(2,Math.ceil(w/200)),sc=[];for(let j=0;j<=k;j++)sc.push(at(b,uL+20+(w-40)*j/k,F+2.5,dI-14));
    const a=at(b,uL+10,F+1.25,dI-14),c=at(b,uR-10,F+1.25,dI-14);put(Object.assign({name:'Лента-липучка жёсткая (сетка '+nm+'), настил',role:'netVelcro',c:mul(add(a,c),0.5),ax:X,ay:b.n,w:len(sub(c,a)),h:25,t:2.5,mat:'velcro'},base,{cat:'velcro',size:`${Math.round(w-20)} мм, лента 25 мм`,why:'низ сетки ложится на настил — щели у пола нет'}));velc+=w-20;
    for(const q of sc)fast(true,q,[0,1,0],'dwp');}
   }
   // раскрой из полотна 1,4 м: узкое — одним куском по высоте, широкое и высокое — двумя со швом внахлёст 30 мм
   const Wp=w+60,Hp=hMax+60+(m.isFloor?30:0);
   if(Wp<=1400)pieces.push({len:Math.ceil(Hp),name:`${nm}: целиком`});else if(Hp<=1400)pieces.push({len:Math.ceil(Wp),name:`${nm}: поперёк рулона`});
   else{const k=Math.ceil((Wp+30)/1370);for(let j=0;j<k;j++)pieces.push({len:Math.ceil(Hp),name:`${nm}: полоса ${j+1} из ${k}, шов внахлёст`});}
   D.netA.x+=area*Math.abs(b.n[0]);D.netA.z+=area*Math.abs(b.n[2]);D.netA.a+=area;
   D.nets.push({nm,w:Math.round(w),h:Math.round(hMax),area,door:b.door,slope,seam:Wp>1400&&Hp>1400,off:Math.round(-dI-Math.max(b.A.hw,b.B.hw))});}
  const pl=cut1D(pieces,[{L:10000,pr:CAT.netRoll.pr,key:'netRoll'}],0);   // в упаковке пара 25 м: жёсткая на каркас + мягкая на сетку
  D.bom.push({key:'netRoll',qty:pl.n,note:`${pieces.length} ${pl_(pieces.length,'кусок','куска','кусков')} на ${D.nets.length} ${pl_(D.nets.length,'сетку','сетки','сеток')} · в дело ${Math.round(pl.util*100)}%${D.nets.some(x=>x.seam)?' · широкие — из двух полос со швом':''}`});
  D.bom.push({key:'velcro',qty:Math.ceil(velc*1.05/25000),note:`${(velc/1000).toFixed(1).replace('.',',')} м по периметру сеток + 5%: жёсткая — на каркас, мягкая — пришить к сетке`});}
 /* ---------- свет ---------- */
 const steelOf=b=>!b.topM.h.o.wood;
 // колодка удлинителя на внутренней грани стойки у входа, под балкой (вилки под крышей), шнур — вниз по стойке на стяжках
 /* колодка удлинителя — под балкой у входа, по её оси: внутри, под крышей, не мешает ни окну снаружи, ни сетке изнутри и под рукой.
    Шнур — по низу балки к стойке и вниз по её внутренней грани между лентами-липучками; сетка проходит поверх, в 14 мм от грани */
 const underBeam=(db,u,dy)=>{const P0=at(db,u,db.topM.h.bot(u)-120,0),h=ray(P0,[0,1,0],200,db.OB);return h?{p:add(P0,[0,h.t,0]),wood:h.b.wood}:null;};
 const powerPost=(db,G,ext,two,why)=>{const hw=db.A.hw,ub=hw+150,hb=underBeam(db,ub+60);if(!hb)return 0;let k=0;
  put({name:'Удлинитель уличный IP44 (колодка под балкой)',role:'plugBlock',c:add(hb.p,[0,-23,0]),ax:db.t,ay:[0,1,0],w:120,h:46,t:66,mat:'plastic',grp:G,cat:ext,size:two?'колодка на 2 розетки, IP44':'розетка шнура, IP44',why});
  for(const s2 of [-1,1])fast(hb.wood,add(hb.p,mul(db.t,s2*45)),[0,-1,0]);
  const yB=hb.p[1]-5,vC=-hw-5,yb=Math.max(F,m.y0||0)+40,seg=(a,c,nm)=>put({name:'Удлинитель уличный IP44 ('+nm+')',role:'plugCord',c:mul(add(a,c),0.5),...frameOf(a,c),w:9,h:9,t:len(sub(c,a)),round:true,mat:'cable',grp:G,cat:ext,size:'шнур 10 м до розетки с УЗО',why:'от колодки по низу балки и вниз по стойке на стяжках, дальше — к розетке дома'});
  const c1=at(db,ub,yB,vC),c2=at(db,0,yB,vC),c3=at(db,0,yb,vC);seg(c1,c2,'шнур по балке');seg(c2,c3,'шнур по стойке');
  for(let y=yb+250;y<yB-60;y+=500){put({name:'Стяжка кабельная (шнур удлинителя)',role:'plugTie',c:at(db,0,y,vC),ax:db.t,ay:[0,1,0],w:16,h:8,t:16,mat:'plastic',grp:G,cat:'ties',size:'стяжка 4,8×200 мм',why:'шнур прижат к стойке'});k++;}
  return k;};
 if(lt==='belt'&&!lite){const G='dress-belt',hangs=[];
  // от стойки у входа: там под балкой колодка удлинителя, комплекты расходятся от неё в обе стороны (вилки — в одной точке, под крышей)
  const inner0=(i,y)=>{const a=bays[(i-1+n)%n],c=bays[i],bi=norm(add(a.n,c.n)),th=turn(i),q=pts[i],o=q.hw/Math.cos(th/2);return[q.x-bi[0]*o,y,q.z-bi[2]*o];};
  const inner=(i,y)=>{const a=bays[(i-1+n)%n],c=bays[i],bi=norm(add(a.n,c.n)),th=turn(i),q=pts[i],o=Math.max(q.hw+35,(a.netD||0)+45,(c.netD||0)+45)/Math.cos(th/2);return[q.x-bi[0]*o,y,q.z-bi[2]*o];};   // с сеткой — на 45 мм внутрь от её плоскости: лампа Ø48 её не касается
  const db=okB.find(b=>b.door)||okB[0],k0=okB.indexOf(db),ring=okB.slice(k0).concat(okB.slice(0,k0));
  let Lc=0,nb=0,nt=0,minY=1e9,last=null;const chain=[];
  for(const b of ring){const pA=inner(b.i,b.topM.h.bot(0)-30),pB=inner((b.i+1)%n,b.topM.h.bot(b.S)-30),Lb=Math.hypot(pB[0]-pA[0],pB[2]-pA[2]),k=Math.max(1,Math.ceil(Lb/1700));
   if(last&&len(sub(last,pA))>1)chain.push([last,pA]);
   for(let j=0;j<k;j++){const a=add(pA,mul(sub(pB,pA),j/k)),c=add(pA,mul(sub(pB,pA),(j+1)/k)),sp=Lb/k,f=Math.max(40,Math.min(100,sp*0.05));
    hangs.push({p:a,post:j===0,to:j===0?inner0(b.i,b.topM.h.bot(0)-30):add(a,add(mul(b.n,dot(sub(at(b,0,0,-b.A.hw),a),b.n)),[0,30,0]))});const N=Math.max(4,Math.ceil(sp/140));
    let prev=a;for(let s=1;s<=N;s++){const r=s/N,q=add(add(a,mul(sub(c,a),r)),[0,-4*f*r*(1-r),0]);chain.push([prev,q]);prev=q;}}
   last=pB;}
  for(const [a,c] of chain)Lc+=len(sub(c,a));
  // комплекты: 10 м (20 ламп) и 5 м (10 ламп), шаг патронов один — 0,5 м; самый дешёвый набор, покрывающий контур (+0,3 м на вилку каждого)
  let best=null;for(const set of [[5],[10],[5,5],[10,5],[10,10]]){const L=set.reduce((x,y)=>x+y,0)*1000-300*set.length,pr=set.reduce((x,y)=>x+CAT[y===10?'belt':'belt5'].pr,0)+CAT[set.length>1?'extCord2':'extCord'].pr/* два комплекта — две вилки: колодка на 2 розетки */;if(L>=Lc&&(!best||pr<best.pr-1))best={set,pr,L};}
  if(!best)best={set:[10,10],pr:2*CAT.belt.pr,L:19400};
  const s1=Math.min(Lc,best.set[0]*1000-300);   // первый комплект — вперёд от входа, второй — назад, встречаются на дальней стороне
  const pos=[];for(let x=250;x<=s1;x+=500)pos.push(x);if(best.set.length>1)for(let x=Lc-250;x>s1+200;x-=500)pos.push(x);pos.sort((a,b)=>a-b);
  let acc=0,pi=0;
  for(const [a,c] of chain){const L=len(sub(c,a));
   put({name:'Гирлянда белт-лайт (провод с патронами)',role:'beltWire',c:mul(add(a,c),0.5),...frameOf(a,c),w:6,h:6,t:L+1,round:true,mat:'cable',grp:G,cat:'belt',size:'двужильный провод с патронами E27 через 0,5 м',why:'контурный свет: висит с провисом между стойками'});
   while(pi<pos.length&&pos[pi]<=acc+L){const r=(pos[pi]-acc)/L,q=add(a,mul(sub(c,a),r));
    put({name:'Гирлянда белт-лайт (патрон E27)',role:'beltSocket',c:add(q,[0,-26,0]),ax:[1,0,0],ay:[0,0,-1],w:34,h:34,t:44,round:true,mat:'plastic',grp:G,cat:'belt',size:'патрон E27 с уплотнением',why:'лампа вкручивается вниз — вода не затекает'});
    put({kind:'ball',name:'Гирлянда белт-лайт (лампа LED)',role:'beltBulb',c:add(q,[0,-72,0]),r:24,mat:'bulb',glow:1,grp:G,cat:'belt',size:'LED-лампа E27 Ø48 мм, ≈1 Вт',why:'тёплый свет, корпус не греется'});
    pi++;nb++;minY=Math.min(minY,q[1]-72-24);}
   acc+=L;}
  for(const h of hangs){const L=Math.max(20,len(sub(h.to,h.p)));put({name:'Стяжка кабельная (гирлянда)',role:'beltTie',c:mul(add(h.p,h.to),0.5),...frameOf(h.p,L>21?h.to:add(h.p,[0,20,0])),w:5,h:5,t:L,mat:'plastic',grp:G,cat:'ties',size:'стяжка 4,8×200 мм, морозостойкая',why:h.post?'провод к стойке под балкой':'промежуточный подвес к балке: провис не больше 5%'});nt++;}
  const two=best.set.length>1,ext=two?'extCord2':'extCord';nt+=powerPost(db,G,ext,two,'вилки гирлянды — под крышей, в стороне от дождя');
  const spare=best.L-Lc;
  D.light={type:'belt',len:Lc,bulbs:nb,ties:nt,sets:best.set.length,set:best.set,watts:nb,clear:Math.round(minY-F),spare};
  const n10=best.set.filter(x=>x===10).length,n5=best.set.length-n10,split=best.set.length>1?` · ${best.set.join(' + ')} м: от стойки у входа в разные стороны`:'';
  const ipw='IP на карточке не указан — проверить на упаковке (для улицы нужно IP44+). Если ниже: Uniel арт. 82435136 — IP65, соединяемая, 40 патронов на 10 м, лампы E27 отдельно.';
  if(n10)D.bom.push({key:'belt',qty:n10,note:`контур ${(Lc/1000).toFixed(1).replace('.',',')} м${split}${spare>600?` · запас ${(spare/1000).toFixed(1).replace('.',',')} м — в смотке у колодки`:''}`,warn:ipw});
  if(n5)D.bom.push({key:'belt5',qty:n5,note:n10?'добирает контур до колодки':`контур ${(Lc/1000).toFixed(1).replace('.',',')} м`,warn:ipw});
  D.bom.push({key:'ties',qty:1,note:`${nt} шт: подвесы гирлянды и шнур по стойке`});
  D.bom.push({key:ext,qty:1,note:two?'колодка — на стойке у входа под балкой: обе вилки под крышей; шнур — к розетке с УЗО 30 мА':'розетка шнура — на стойке у входа под балкой; другой конец — в розетку с УЗО 30 мА'});}
 if(lt==='led'&&!lite){const G='dress-led',segs=[];let Ls=0;
  for(const b of okB){const tm=b.topM,uA=b.A.hw+6,uB=b.S-b.B.hw-6,L=uB-uA;if(L<300)continue;
   const vc=tm.h.vc,wood=!steelOf(b),qA=at(b,uA,tm.h.bot(uA),vc),qB=at(b,uB,tm.h.bot(uB),vc),ax=norm(sub(qB,qA));let ay=cross(b.n,ax);if(ay[1]<0)ay=mul(ay,-1);
   const Lr=len(sub(qB,qA)),mid=mul(add(qA,qB),0.5),dn=mul(ay,-1);
   put({name:'LED-подсветка (профиль М1506)',role:'ledProfile',c:add(mid,mul(dn,3)),ax,ay,w:Lr,h:6,t:15,mat:'alu',grp:G,cat:'ledProf',size:`${Math.round(Lr)} мм, 15×6 мм`,why:'лента в профиле по низу балки: свет вниз, лента защищена и отводит тепло'});
   put({name:'LED-подсветка (лента 4,8 Вт/м)',role:'ledStrip',c:add(mid,mul(dn,6.6)),ax,ay,w:Lr-10,h:1.2,t:9,mat:'led',glow:2,grp:G,cat:'ledTape',size:`${Math.round(Lr-10)} мм, 12 В, IP65`,why:'контурная подсветка по низу балок'});
   const k=Math.max(2,Math.ceil(Lr/700)+1);for(let j=0;j<k;j++)fast(wood,add(add(qA,mul(ax,30+(Lr-60)*j/(k-1))),mul(dn,6)),dn);
   segs.push({len:Math.round(Lr),name:`балка ${segs.length+1}`});Ls+=Lr;}
  if(!segs.length)return void (m.dress=null);
  const W=4.8*Ls/1000,nP=Math.ceil(W/48),reels=Math.ceil(Ls/5000);
  // блоки питания — под той же балкой у входа, рядом с колодкой: плашмя, по 2 самореза в низ балки
  const db=okB.find(b=>b.door)||okB[0];let nt=0;
  for(let k=0;k<nP;k++){const u=db.A.hw+420+k*230,hb=underBeam(db,u);if(!hb)continue;
   put({name:'LED-подсветка (блок питания 12 В 60 Вт IP67)',role:'ledPsu',c:add(hb.p,[0,-16,0]),ax:db.t,ay:[0,1,0],w:170,h:30,t:44,mat:'plastic',grp:G,cat:'ledPsu',size:'170×44×30 мм, IP67',why:'питание ленты: нагрузка не больше 80% от 60 Вт'});
   for(const s2 of [-1,1])fast(hb.wood,add(hb.p,mul(db.t,s2*75)),[0,-1,0]);}
  const ext=nP>1?'extCord2':'extCord';nt+=powerPost(db,G,ext,nP>1,'вилки блоков питания — под крышей');
  const pcs=[];for(const sg of segs){let r=sg.len,k=0;while(r>2000.5){pcs.push({len:2000,name:sg.name+', целый '+(++k)});r-=2000;}pcs.push({len:r,name:sg.name+(k?', добор':'')});}   // длиннее профиля — стык встык на балке
  const pl=cut1D(pcs,[{L:2000,pr:CAT.ledProf.pr,key:'ledProf'}],2);
  D.light={type:'led',len:Ls,watts:W,psu:nP,reels,profiles:pl.n,ties:nt};
  D.bom.push({key:'ledTape',qty:reels,note:`${(Ls/1000).toFixed(1).replace('.',',')} м по низу балок · ${Math.round(W)} Вт · каждая катушка 5 м — своим проводом от блока`});
  D.bom.push({key:'ledProf',qty:pl.n,note:`${pcs.length} ${pl_(pcs.length,'отрезок','отрезка','отрезков')} по ${segs.length} ${pl_(segs.length,'балке','балкам','балкам')}, в дело ${Math.round(pl.util*100)}%`});
  D.bom.push({key:'ledPsu',qty:nP,note:`${Math.round(W)} Вт из ${nP*60} — запас 20% на нагрев`});
  D.bom.push({key:'ledWire',qty:Math.ceil(reels*3+segs.length*0.5+2),note:'от блока к началу каждой катушки и перемычки у стоек'});
  D.bom.push({key:'ties',qty:1,note:`${nt} шт: шнур удлинителя по стойке`});
  D.bom.push({key:ext,qty:1,note:`${nP>1?'колодка на 2 розетки':'розетка шнура'} — на стойке у входа над блоками питания; шнур — к розетке с УЗО 30 мА`,warn:'Если у блока питания IP67 сетевые провода без вилки — подключить через уличную вилку IP44 или распаечную коробку IP65. Это делает электрик.'});}
 // саморезы скоб и профиля
 if(D.scr.dws)D.bom.push({key:'dwS',qty:Math.ceil(D.scr.dws*1.1/100),note:`${D.scr.dws} шт: ${[win&&'скобы',net&&'лента-липучка',lt==='led'&&'профиль'].filter(Boolean).join(', ')} к стальным стойкам и балкам`});
 if(D.scr.dww)D.bom.push({key:'dwW',qty:Math.ceil(D.scr.dww*1.1/200),note:`${D.scr.dww} шт: скобы${lt==='led'?' и профиль':''} к брусу`});
 if(D.scr.dwp)D.bom.push({key:'dwP',qty:Math.ceil(D.scr.dwp*1.1/100),note:`${D.scr.dwp} шт: лента-липучка к брусу и настилу, через 200 мм`});
 m.dress=D;D.lite=!!lite;if(lite)return;
 const i=m.steps.findIndex(s=>s.id==='finish');if(!m.steps.some(s=>s.id==='dress'))m.steps.splice(i<0?m.steps.length:i,0,{id:'dress',t:(win||net)&&lt!=='0'?'Окна и свет':win?'Мягкие окна':net?'Москитная сетка':'Свет по контуру'});
}
// оси для отрезка: локальная z — вдоль a→c
function frameOf(a,c){const z=norm(sub(c,a)),x=Math.abs(z[1])<0.9?norm(cross([0,1,0],z)):[1,0,0],y=cross(z,x);return{ax:x,ay:y,az:z};}
