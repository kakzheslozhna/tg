
const PLATE_ROLES=['basePlate','tongue','flange','newelPlate','support','endPlate','stopP','wHead','wKnife','nodePlate','jackPlate','jackFoot','lug','shoe'];
function sigOf(p){
 if(p.kind==='tube'){
  const L=p.cutLen,H=p.holes.map(h=>({s:h.s-p.zA0,f:h.face,o:h.off,d:h.d,sg:h.single?1:0}));
  let best=null;
  for(const [sd,xs,ys] of [[1,1,1],[1,-1,-1],[-1,-1,1],[-1,1,-1]]){
   const str=H.map(h=>{const s=sd>0?h.s:L-h.s,o=h.f==='X'?h.o*ys:h.f==='R'?0:h.o*xs;return`${h.f}${Math.round(s)}:${Math.round(o)}:${h.d}${h.sg?'s':''}`;}).sort().join('|');
   if(best===null||str<best)best=str;
  }
  return`${ROLE[p.role]?ROLE[p.role][0]:p.role}|${p.sec}|${p.sx}x${p.sy}|${Math.round(L)}|${[p.angA,p.angB].sort().join('/')}|${p.caps.filter(Boolean).length}|${best}`;
 }
 if(p.kind==='angle'&&!p.trim)return`${p.role}|${p.A}x${p.B}x${p.t}|${Math.round(p.L)}`;
 if(p.kind==='box'&&PLATE_ROLES.includes(p.role)){const hs=p.holes.map(h=>`${Math.round(Math.abs(h.x))}:${Math.round(Math.abs(h.y))}:${h.d}`).sort().join('|');return`${p.role}|${Math.round(p.w)}x${Math.round(p.h)}x${p.t}|${hs}`;}
 return null;
}
function assignMarks(m){
 const groups=new Map();
 for(const p of m.parts){const k=sigOf(p);if(!k)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
 const cnt={};m.marks=[];
 for(const [k,arr] of groups){const pre=(ROLE[arr[0].role]||['Д'])[0];cnt[pre]=(cnt[pre]||0)+1;const mark=pre+'-'+cnt[pre];arr.forEach(p=>{p.mark=mark;p.markQty=arr.length;});m.marks.push({mark,parts:arr,p:arr[0]});}
 const bg={};for(const p of m.parts)if(p.kind==='bolt'){const k=`M${p.d}×${p.L}`;(bg[k]=bg[k]||[]).push(p);}
 for(const k in bg)bg[k].forEach(p=>{p.mark=k;p.markQty=bg[k].length;});
}

/* ---------------- модули для перевозки ---------------- */
function corners8(p){
 const pts=[];
 if(p.kind==='tube'){for(const e of [0,1])for(const i of [-1,1])for(const j of [-1,1]){const x=i*p.sx/2,y=j*p.sy/2,z=cutZ(e?p.cutB:p.cutA,x,y,e?p.L:0);pts.push(add(p.o,add(add(mul(p.ax,x),mul(p.ay,y)),mul(p.az,z))));}}
 else if(p.kind==='angle'){for(const a of [0,p.A])for(const b of [0,p.B])for(const z of [0,p.L])pts.push(add(p.o,add(add(mul(p.ax,a),mul(p.ay,b)),mul(p.az,z))));}
 else if(p.kind==='box'){for(const i of [-1,1])for(const j of [-1,1])for(const k of [-1,1])pts.push(add(p.c,add(add(mul(p.ax,i*p.w/2),mul(p.ay,j*p.h/2)),mul(p.az,k*p.t/2))));}
 else if(p.kind==='weld')pts.push(p.a,p.b);
 return pts;
}
function massOf(p){
 if(p.kind==='tube')return p.wood?p.sx*p.sy*p.cutLen*p.rho*1e-9:SEC[p.sec].kgm*p.cutLen/1000;
 if(p.kind==='angle')return p.cat==='ang40'?2.42*p.L/1000:p.cat==='kus40'?0.05:0;
 if(p.kind==='box'&&(PLATE_ROLES.includes(p.role)||p.role==='capPlate'))return p.w*p.h*p.t*7.85e-6;
 return 0;
}
// габарит модуля в его собственных осях: перебираем оси труб модуля и мировые, берём самый компактный
function bboxOf(ps,TR){
 const pts=ps.flatMap(corners8),cand=[[[1,0,0],[0,1,0],[0,0,1]]];
 for(const p of ps)if(p.kind==='tube'&&!p.round)cand.push([p.ax,p.ay,p.az]);
 let best=null;
 for(const F of cand){const lo=[0,1,2].map(i=>Math.min(...pts.map(q=>dot(F[i],q)))),hi=[0,1,2].map(i=>Math.max(...pts.map(q=>dot(F[i],q)))),d=[0,1,2].map(i=>hi[i]-lo[i]),q=d.slice().sort((a,b)=>b-a),fit=TR?q[0]<=TR.L&&q[1]<=TR.W&&q[2]<=TR.H:true,v=(fit?0:1e12)+d[0]*d[1]*d[2]+1e-3*(d[0]+d[1]+d[2]);if(!best||v<best.v-1)best={F,lo,hi,v};}
 return best;
}
const mat3=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
function modules(m){
 const TR=m.truckSpec,g={};for(const p of m.parts){if(!m.MODS[p.module])continue;(g[p.module]=g[p.module]||[]).push(p);}
 const list=[];
 for(const k of Object.keys(m.MODS)){const ps=g[k];if(!ps)continue;
  const b=bboxOf(ps,TR),d=[0,1,2].map(i=>b.hi[i]-b.lo[i]).sort((a,b)=>b-a);
  const kg=ps.reduce((s,p)=>s+massOf(p),0),welds=ps.filter(p=>p.kind==='weld');
  list.push({k,name:m.MODS[k],dims:d,kg,parts:ps.filter(p=>p.kind!=='weld').length,welds:welds.length,weldLen:welds.reduce((s,p)=>s+p.len,0),fits:d[0]<=TR.L&&d[1]<=TR.W&&d[2]<=TR.H});}
 const loose=m.parts.filter(p=>!m.MODS[p.module]&&p.module!=='site'&&(p.kind==='tube'||p.kind==='sheet'||p.kind==='poly'));
 const longest=loose.reduce((a,p)=>{const L=p.kind==='tube'?p.cutLen:p.kind==='sheet'?(p.profile==='PC8'?0:Math.max(p.W,p.L)):p.L||0;return L>a.L?{L,p}:a;},{L:0,p:null});
 return{list,longest,looseKg:m.parts.filter(p=>!m.MODS[p.module]).reduce((s,p)=>s+massOf(p),0)};
}

/* ---------------- раскладка модулей: мастерская и кузов ---------------- */
function flatRot(d){
 const idx=[0,1,2].sort((a,b)=>d[b]-d[a]),[a,b,c]=idx,e=i=>[0,1,2].map(j=>j===i?1:0);
 let R=[e(a),e(c),e(b)];const det=R[0][0]*(R[1][1]*R[2][2]-R[1][2]*R[2][1])-R[0][1]*(R[1][0]*R[2][2]-R[1][2]*R[2][0])+R[0][2]*(R[1][0]*R[2][1]-R[1][1]*R[2][0]);
 if(det<0)R[2]=R[2].map(v=>-v);
 return{R,dims:[d[a],d[c],d[b]]};
}
function placeTf(box,R,target){
 const cf=[0,1,2].map(i=>(box.lo[i]+box.hi[i])/2),F=box.F||[[1,0,0],[0,1,0],[0,0,1]],c=[0,1,2].map(j=>F[0][j]*cf[0]+F[1][j]*cf[1]+F[2][j]*cf[2]),Rc=R.map(r=>r[0]*c[0]+r[1]*c[1]+r[2]*c[2]);
 return{R,t:[target[0]-Rc[0],target[1]-Rc[1],target[2]-Rc[2]]};
}
const MOD_ORDER=['head','hip','hub','ring','post','pstub','whead','side','panel','newel','rail','base','stair'];
function layoutModules(m){
 const TR=m.truckSpec,items=[];
 for(const k of Object.keys(m.MODS)){
  const ps=m.parts.filter(p=>p.module===k);if(!ps.length)continue;
  const box=bboxOf(ps,TR),d=[0,1,2].map(i=>box.hi[i]-box.lo[i]),fr=flatRot(d);
  const grp=MOD_ORDER.findIndex(g=>k.startsWith(g));
  items.push({k,name:m.MODS[k],box,R:mat3(fr.R,box.F),dims:fr.dims,grp:grp<0?9:grp,kg:ps.reduce((s,p)=>s+massOf(p),0)});
 }
 // мастерская: ряды по типу модуля, раскладка по центру площадки
 const Wrow=Math.max(7600,...items.map(i=>i.dims[0]+400)),gap=320,pre=[];let x=0,z=0,rowD=0,lastG=null;
 items.slice().sort((a,b)=>a.grp-b.grp||b.dims[0]-a.dims[0]).forEach(it=>{
  if(x+it.dims[0]>Wrow||(lastG!==null&&it.grp!==lastG&&x>0)){x=0;z+=rowD+gap*1.6;rowD=0;}
  pre.push({it,tx:x+it.dims[0]/2,tz:z+it.dims[2]/2});x+=it.dims[0]+gap;rowD=Math.max(rowD,it.dims[2]);lastG=it.grp;
 });
 const zMax=z+rowD,xMax=Math.max(...pre.map(p=>p.tx+p.it.dims[0]/2));
 const shop=pre.map(({it,tx,tz})=>{const target=[tx-xMax/2,it.dims[1]/2+2,tz-zMax/2];return Object.assign({},placeTf(it.box,it.R,target),{k:it.k,name:it.name,label:[target[0],it.dims[1]+260,target[2]],dims:it.dims});});
 // кузов: слои, в слое — полки; деталь можно повернуть в плане на 90°, сначала ищем место в уже начатых слоях
 const bed={x0:-TR.L/2,z0:-TR.W/2,L:TR.L,W:TR.W,y:1050,H:TR.H,t:TR.t};
 const Ry=[[0,0,1],[0,1,0],[-1,0,0]],mm=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
 const packRun=order=>{const layers=[],placed=[];
  for(const it of order){
   const [L,T,D]=it.dims,opts=[[L,D,false],[D,L,true]].filter(([lx,dz])=>lx<=bed.L&&dz<=bed.W);
   let done=false;
   for(const ly of layers){for(const [lx,dz,rot] of opts){
     for(const sh of ly.sh)if(sh.x+lx<=bed.L&&(dz<=sh.d||(sh===ly.sh[ly.sh.length-1]&&sh.z+dz<=bed.W))){placed.push({it,ly,x:sh.x,z:sh.z,lx,dz,rot});sh.x+=lx+20;sh.d=Math.max(sh.d,dz);ly.h=Math.max(ly.h,T);done=true;break;}
     if(!done){const last=ly.sh[ly.sh.length-1],z=last.z+last.d+20;if(z+dz<=bed.W){ly.sh.push({x:lx+20,z,d:dz});placed.push({it,ly,x:0,z,lx,dz,rot});ly.h=Math.max(ly.h,T);done=true;}}
     if(done)break;}if(done)break;}
   if(!done){const [lx,dz,rot]=opts[0]||[L,D,false],ly={h:T,sh:[{x:lx+20,z:0,d:dz}]};layers.push(ly);placed.push({it,ly,x:0,z:0,lx,dz,rot});}
  }
  let y=bed.y;for(const ly of layers){ly.y=y;y+=ly.h+15;}
  return{placed,stackH:layers.length?y-15-bed.y:0};};
 // несколько порядков укладки — берём самый низкий штабель
 const area=i=>i.dims[0]*i.dims[2];
 const runs=[(a,b)=>area(b)-area(a),(a,b)=>b.dims[1]-a.dims[1]||area(b)-area(a),(a,b)=>b.dims[0]-a.dims[0]||b.dims[1]-a.dims[1],(a,b)=>a.grp-b.grp||area(b)-area(a)].map(f=>packRun(items.slice().sort(f)));
 const best=runs.reduce((p,q)=>q.stackH<p.stackH?q:p);
 const truck=best.placed.map(({it,ly,x,z,lx,dz,rot})=>{const target=[bed.x0+x+lx/2,ly.y+it.dims[1]/2,bed.z0+z+dz/2];return Object.assign({},placeTf(it.box,rot?mm(Ry,it.R):it.R,target),{k:it.k,name:it.name});});
 const stackH=best.stackH;

 return{shop,truck,bed,stackH,fits:stackH<=bed.H,items};
}
/* ---------------- что делаем на каждом этапе ---------------- */
function stepInfo(m){
 const out={},WM=new Set(m.parts.filter(q=>q.kind==='weld').map(q=>q.module));   // модули, где есть сварка
 for(const s of m.steps){
  const ps=m.parts.filter(p=>p.step===s.id);
  const mods=[...new Set(ps.map(p=>p.module).filter(k=>m.MODS[k]))].map(k=>m.MODS[k]);
  const nWeld=new Set(ps.map(p=>p.module).filter(k=>m.MODS[k]&&WM.has(k))).size;
  const j={};for(const b of ps.filter(p=>p.kind==='bolt')){const key=b.joint;j[key]=j[key]||{n:0,sizes:{}};j[key].n++;const sz=`M${b.d}×${b.L}`;j[key].sizes[sz]=(j[key].sizes[sz]||0)+1;}
  const loose={},seen=new Set();for(const p of ps.filter(p=>!m.MODS[p.module]&&p.module!=='site'&&!['weld','bolt'].includes(p.kind)&&!['decor','capPlate'].includes(p.role))){if(p.grp){if(seen.has(p.grp))continue;seen.add(p.grp);}const n=p.grp||p.wood?p.name.replace(/\s*\(.*$/,''):(ROLE[p.role]||[null,p.name])[1]||p.name;loose[n]=(loose[n]||0)+1;}
  const welds=ps.filter(p=>p.kind==='weld').length;
  out[s.id]={mods,nWeld,joints:Object.entries(j).map(([k,v])=>({name:k,n:v.n,sizes:Object.entries(v.sizes).map(([z,c])=>`${z} × ${c}`).join(', ')})),loose:Object.entries(loose).map(([k,v])=>({name:k,n:v})),siteWelds:welds};
 }
 return out;
}

/* ---------------- раскрой ---------------- */
function pack(pieces,stock,kerf){
 const ps=pieces.slice().sort((a,b)=>b.len-a.len),bins=[];
 for(const p of ps){if(p.len>stock){bins.push({items:[p],used:p.len,over:true});continue;}
  let b=bins.find(b=>!b.over&&stock-b.used>=p.len+(b.items.length?kerf:0));
  if(!b){b={items:[],used:0};bins.push(b);}
  b.used+=(b.items.length?kerf:0)+p.len;b.items.push(p);}
 bins.forEach(b=>b.rest=stock-b.used);
 return bins;
}

/* ---------------- смета: всё, что режется, — по плану раскроя (сколько купить = сколько уйдёт в дело + честный отход) ---------------- */
const TRIM_STOCK={ridgeC20:[2000,100],trimC20:[2000,100],ridgeTile:[2000,100],trimTile:[2000,100],drip:[2000,50],wind:[2000,50],ridgeOnd:[1000,150],gutter:[3000,0]};
const dec1=v=>(Math.round(v*10)/10).toString().replace('.',',');
function bom(m){
 const lines=[],P=m.parts,cfg=m.cfg,cut={},base=cfg.metal==='base',rq=m.roofQty,cuts=[];
 const add_=(cat,key,qty,extra)=>{if(!(qty>0))return;const c=CAT[key];let pr=c.pr,src=c.src;if(base&&cat==='Металл'&&key!=='plate6'){pr=Math.round(pr*0.65);src='base';}lines.push(Object.assign({cat,key,name:c.n,qty,unit:c.u,price:pr,sum:qty*pr,url:c.url,src,sku:c.sku,lk:c.lk,city:c.city,warn:c.warn},extra||{}));};
 const plan=(key,title,pl,extra)=>{cuts.push(Object.assign({key,title,plan:pl,name:CAT[key]?CAT[key].n:title},extra||{}));return pl;};
 const pct=pl=>Math.round(pl.util*100)+'%',m1=v=>(v/1000).toFixed(2).replace('.',',');
 const rest1=pl=>pl.remnants&&pl.remnants.length?` · годные остатки ${pl.remnants.slice(0,5).map(m1).join(', ')} м`:'';
 // металл: хлысты по 3 м, пропил 3 мм; длиннее хлыста — две части со стыком на сварке
 for(const p of P.filter(p=>p.kind==='tube')){
  const L=Math.ceil(p.cutLen-0.5),arr=(cut[p.sec]=cut[p.sec]||[]),L0=SEC[p.sec].stockL||3000;
  if(L<=L0||p.wood)arr.push({len:L,mark:p.mark,name:p.name,id:p.id});   // брус не сращиваем: длиннее 3 м — из 6-метровой заготовки
  else{const s=p.splice?Math.round(p.splice-p.zA0):Math.round(L/2);arr.push({len:s,mark:p.mark,name:p.name+' — часть 1 (стык на сварке)',id:p.id});arr.push({len:L-s,mark:p.mark,name:p.name+' — часть 2',id:p.id});}
 }
 const plans={},secName=sec=>SEC[sec].round?'Труба Ø'+sec.slice(1).replace('x','×'):'Труба '+sec.replace(/x/g,'×');
 for(const sec of Object.keys(SEC)){if(!cut[sec])continue;
  if(SEC[sec].wood){const Sc=SEC[sec],k=woodCat(Sc.b,Sc.h,cfg.wood),pr=CAT[k].pr,pl=plan(k,`Брус ${Sc.b}×${Sc.h} — заготовки 3 и 6 м`,cut1D(cut[sec],[{L:3000,pr,key:k},{L:6000,pr:Math.round(pr*2.1),key:k}],4),{unit:'шт',kerf:4});
   plans[sec]=pl.bins.map(b=>({items:b.items,used:b.used,rest:b.rest}));
   const n6=pl.bins.filter(b=>b.stock.L>3000).length;lines.push({cat:'Брус',key:k,name:CAT[k].n,qty:pl.n,unit:'шт',price:pr,sum:Math.round(pl.cost),url:CAT[k].url,src:CAT[k].src,lk:CAT[k].lk,sku:CAT[k].sku,city:CAT[k].city,warn:CAT[k].warn,note:`${cut[sec].length} заготовок · в дело ${pct(pl)}${n6?` · ${n6} шт — 6 м (привоз отдельно)`:''}${rest1(pl)}`});continue;}
  const k=SEC[sec].stock,L0=SEC[sec].stockL||3000;
  const pl=plan(k,`${secName(sec)} — хлысты ${String(L0/1000).replace('.',',')} м`,cut1D(cut[sec],[{L:L0,pr:CAT[k].pr,key:k}],3),{unit:'хлыст',kerf:3});
  plans[sec]=pl.bins.map(b=>({items:b.items,used:b.used,rest:b.rest})).concat(pl.over.map(p=>({items:[p],used:p.len,rest:0,over:true})));
  add_('Металл',k,pl.n+pl.over.length,{note:`${cut[sec].length} заготовок · в дело ${pct(pl)}${rest1(pl)}`});}
 const angP=P.filter(p=>p.kind==='angle'&&p.cat==='ang40').map(p=>({len:Math.ceil(p.L),mark:p.mark,name:p.name,id:p.id}));
 if(angP.length){const pl=plan('ang40','Уголок 40×40×4 — хлысты 3 м',cut1D(angP,[{L:3000,pr:CAT.ang40.pr,key:'ang40'}],3),{unit:'хлыст',kerf:3});
  plans.ang40=pl.bins.map(b=>({items:b.items,used:b.used,rest:b.rest}));add_('Металл','ang40',pl.n,{note:`${angP.length} упоров по 40 мм${rest1(pl)}`});}
 const plKg=P.filter(p=>p.kind==='box'&&PLATE_ROLES.includes(p.role)).reduce((s,p)=>s+massOf(p),0);
 add_('Металл','plate6',Math.ceil(plKg*1.15*10)/10,{note:'опорные пластины, языки, фланцы, ушки — по эскизам во вкладке «Сверловка»'});
 const capA=P.filter(p=>p.role==='capPlate').reduce((s,p)=>s+p.w*p.h,0);
 add_('Металл','plate',Math.ceil(capA/(200*100*0.7)),{note:`${P.filter(p=>p.role==='capPlate').length} заглушек нарезать из пластин`});
 add_('Крепёж','kus40',P.filter(p=>p.cat==='kus40').length);
 if(m.C.sc8)add_('Крепёж','structScrew',Math.ceil(m.C.sc8/50),{note:`${m.C.sc8} шт: подкосы, раскосы, секции бортов`});
 if(m.C.wood6)add_('Крепёж','woodScrew6',Math.ceil(m.C.wood6/100),{note:`${m.C.wood6} шт: обрешётка к балкам и стропилам`});
 const KG=550,gr=x=>Math.max(1,Math.round(x*KG/1000*2)/2);
 const bk={},nuts={},wash={};
 for(const b of P.filter(p=>p.kind==='bolt')){const k=`M${b.d}×${b.L}`;bk[k]=bk[k]||{d:b.d,L:b.L,q:0,joints:new Set()};bk[k].q++;bk[k].joints.add(b.joint);nuts[b.d]=(nuts[b.d]||0)+1;wash[b.d]=(wash[b.d]||0)+2;}
 const boltLines=[];
 Object.keys(bk).sort((a,b)=>bk[a].d-bk[b].d||bk[a].L-bk[b].L).forEach(k=>{const b=bk[k],B=BOLT[b.d],g=Math.PI*(b.d/2)**2*b.L*0.00785+B.head;
  const pr=b.d===8?(b.L<=80?22:b.L<=120?27:32):gr(g),isA=b.d===8&&b.L===120;
  const ln={cat:'Крепёж',key:'bolt'+k,name:`Болт DIN 933 ${k.replace('M','').replace('×','x')} мм оцинкованный`,qty:b.q,unit:'шт',price:pr,sum:b.q*pr,url:isA?S('89404123'):LP+'/catalogue/bolty/din-933/',sku:isA?'89404123':undefined,lk:isA?'sku':'catalog',src:b.d===8?'site':'calc',note:[...b.joints].join('; ')};lines.push(ln);boltLines.push(ln);});
 for(const d of Object.keys(nuts)){const B=BOLT[d];
  if(+d===8){const q=Math.ceil(nuts[d]/24);lines.push({cat:'Крепёж',key:'nut'+d,name:'Гайка самоконтрящаяся М8 DIN 985 оцинк., 24 шт.',qty:q,unit:'уп.',price:94,sum:q*94,url:LP+'/product/gayka-samokontryashchayasya-m8-din-985-stal-ocinkovannaya-24-sht-89397141/',sku:'89397141',lk:'product',src:'site',note:`${nuts[d]} шт`});}
  else lines.push({cat:'Крепёж',key:'nut'+d,name:`Гайка самоконтрящаяся DIN 985 M${d} оцинк. (на вес)`,qty:nuts[d],unit:'шт',price:gr(B.nut),sum:nuts[d]*gr(B.nut),url:LP+'/catalogue/gayki/',lk:'catalog',src:'calc'});
  if(+d===8){const q=Math.ceil(wash[d]/24);lines.push({cat:'Крепёж',key:'wash'+d,name:'Шайба кузовная (увеличенная) DIN 9021 М8, 24 шт.',qty:q,unit:'уп.',price:80,sum:q*80,url:LP+'/product/shayba-kuzovnaya-din-9021-m8-24-sht-89397085/',sku:'89397085',lk:'product',src:'site',note:`${wash[d]} шт`});}
  else lines.push({cat:'Крепёж',key:'wash'+d,name:`Шайба увеличенная DIN 9021 M${d} (на вес)`,qty:wash[d],unit:'шт',price:gr(B.wash),sum:wash[d]*gr(B.wash),url:LP+'/catalogue/shayby/',lk:'catalog',src:'calc'});}
 // коннекторы бруса: всё покупное, считается штуками
 {const nC=c=>P.filter(p=>p.cat===c).length,kS=(m.bP||0)>=150?1.9:1;
  for(const [c,note] of [['connBase','под стойки'],['conn3','углы каркаса'],['conn4','средние стойки'],['connT','стойка и балка над ней'],['connE','балки вдоль в стойки'],['connS','стыки над опорами'],['connP','углы, угол не 90°'],['connJ','лаги в балки']]){const q=nC(c);if(q){const pr=Math.round(CAT[c].pr*(c==='connJ'?1:kS)/10)*10;add_('Крепёж',c,q,Object.assign({price:pr,sum:q*pr,note},kS>1&&c!=='connJ'?{name:CAT[c].n.replace(/100×100( LUVON)?(, сталь 2 мм)?/,'150×150'),src:'est',city:'',note:`${note}; под заказ: LUVON делает только 100×100, цена — оценка ×1,9`}:{}));}}
  if(m.C.conn6)add_('Крепёж','conn6',Math.ceil(m.C.conn6/100),{note:`${m.C.conn6} шт: в гнёзда коннекторов`});if(m.C.conn5)add_('Крепёж','conn5',Math.ceil(m.C.conn5/250),{note:`${m.C.conn5} шт: опоры бруса под лагами`});
  add_('Основание','shimSet',P.filter(p=>p.role==='shim').length,{note:'выставить уровень; после пучения — домкрат и подкладка'});if(P.some(p=>p.role==='dpc'))add_('Основание','rub',Math.ceil(P.filter(p=>p.role==='dpc').length*0.1*2/10),{note:'отсечка под обвязкой, 2 слоя'});}
 const studs=P.filter(p=>p.role==='stud'),nStud=studs.length,nN=studs.reduce((s,p)=>s+p.nuts.length,0),nW=studs.reduce((s,p)=>s+p.washers.length,0),FC=m.free?'Основание':'Фундамент';
 add_(FC,m.studs88?'stud12s':'stud12',m.free?Math.ceil(studs.reduce((s,p)=>s+p.b[1]-p.a[1],0)/950):Math.ceil(nStud/3),{note:m.free?`${nStud} коротких шпилек к столикам рамы`:`${nStud} шпилек по 300 мм (3 из прутка)${m.studs88?' — класс 8.8 под жёсткую базу':''}`});
 if(nN)lines.push({cat:FC,key:'nut12',name:'Гайка M12 DIN 934 оцинк.',qty:nN,unit:'шт',price:gr(17),sum:nN*gr(17),url:S('гайка М12'),src:'calc',note:'анкерная, регулировочная, верхняя'});
 if(nW)lines.push({cat:FC,key:'wash12',name:'Шайба увеличенная DIN 9021 M12',qty:nW,unit:'шт',price:gr(22),sum:nW*gr(22),url:S('шайба увеличенная М12'),src:'calc'});
 if(m.free){const Bs=m.base,cnt=r=>P.filter(p=>p.role===r).length,V3=rs=>P.filter(p=>rs.includes(p.role)).reduce((s,p)=>s+p.w*p.h*p.t*1e-9,0),A2=P.filter(p=>p.role==='cushion').reduce((s,p)=>s+p.w*p.h*1e-6,0),rods=P.filter(p=>p.role==='tieRod'),len=d=>rods.filter(p=>p.d===d).reduce((s,p)=>s+p.b[1]-p.a[1],0);
  add_(FC,'slab',cnt('pad'),{note:Bs.gas?'под ступени':Bs.n>1?`стопки по ${Bs.n} шт. на стойку, по центру отверстие Ø24`:'по 1 на опору'});
  if(cnt('gasBlock')){const nb=cnt('gasBlock'),ar=nb*2*(0.6*0.3+0.6*0.2+0.3*0.2);add_(FC,'gasblock',nb,{note:Bs.nB===2?'по 2 рядом на опору':'по 1 на опору'});if(Bs.nB===2)add_(FC,'gasGlue',1,{note:'шов между блоками'});add_(FC,'gasMastic',Math.ceil(ar*1.5*2/18),{note:`${ar.toFixed(1).replace('.',',')} м², все грани в 2 слоя`});add_(FC,'rub',1,{note:'отсечка под блоком: 2 слоя'});}
  add_(FC,'gravelBulk',Math.ceil(V3(['cushion','backfill'])*1.3*2)/2,{note:`подушка и засыпка ${V3(['cushion','backfill']).toFixed(2).replace('.',',')} м³ с трамбовкой`});add_(FC,'geotex',Math.ceil(A2/50));
  for(const d of [16,20])if(len(d)){add_(FC,'stud'+d,Math.ceil(len(d)/950),{note:'нагели и стяжки опор'});const nq=rods.filter(p=>p.d===d).reduce((s,p)=>s+p.nuts.length,0);lines.push({cat:FC,key:'nut'+d+'b',name:`Гайка M${d} DIN 934 оцинк.`,qty:nq,unit:'шт',price:gr(d===20?60:34),sum:nq*gr(d===20?60:34),url:S(`гайка М${d}`),src:'calc',note:'к нагелям и стяжкам'});}
  {add_(FC,'anchorH',cnt('anchor'),{note:'лопасть ниже 1,4 м; на каждую приварить крышку 80×80×8 и шпильку M20'});if(cnt('anchor')){add_(FC,'stud20',Math.ceil(cnt('anchor')*0.14),{note:`по 120 мм на сваю`});const nq=cnt('anchor');lines.push({cat:FC,key:'nut20b',name:'Гайка M20 DIN 934 оцинк.',qty:nq,unit:'шт',price:gr(60),sum:nq*gr(60),url:S('гайка М20'),src:'calc',lk:'search',note:'на шпильки свай'});}}}
 else{const pil=P.filter(p=>p.role==='pillar'),vol=P.filter(p=>p.role==='pillar'||p.role==='bell').reduce((s,p)=>s+Math.PI*(p.r/1000)**2*p.h/1000,0),bells=P.filter(p=>p.role==='bell').length;
 add_('Фундамент','concrete',Math.ceil(vol/0.021)+1,{note:`${pil.length} столбов${bells?`, ${bells} с уширением Ø400 (бур ТИСЭ)`:''}, ${vol.toFixed(2)} м³ + подливка`});
 add_('Фундамент','sand',Math.ceil(pil.length*0.0106/0.025)+1);add_('Фундамент','rub',Math.ceil(pil.length*1.35/10));add_('Фундамент','rebar',Math.ceil(pil.length*2/2),{note:`${pil.length*2} прутков по 1150 мм (2 из 3-метрового)`});add_('Фундамент','wire',1);}
 const cnt=(t,st)=>m.screws.filter(s=>s.type===t&&(!st||s.st===st)).length,trimScr=cnt('trim'),roofScr=cnt('roof')+trimScr,pcScr=cnt('pc'),osbScr=cnt('osb'),tekX=cnt('tek','roofEdge');
 const ridgeM=(rq.ridgeLen||0)+(rq.hipLen||0),shA=rq.sheetW&&rq.sheetW.length?rq.sheetW.reduce((s,w,i)=>s+w*rq.sheetLen[i],0)/1e6:rq.area;
 // кровельные листы: колонки снизу целыми листами, добор и срезы по рёбрам — из общих листов
 const SH=SHEET[m.cov];let roofPl=null;
 if(SH&&m.cov!=='falc'){let pcs=[];
  if(m.poly){const N=rq.colsN;rq.cols.forEach((c,ci)=>{let a=0,nf=0;while(c.long-a>SH.L+0.5){nf++;a+=SH.L-SH.lap;}
    for(let q=0;q<nf*N;q++)pcs.push({len:SH.L,name:`колонка ${ci+1}: целый лист`});
    const L1=c.long-a,L2=Math.max(0,c.short-a);
    if(m.cov==='tile')for(let f=0;f<N;f++)pcs.push({len:tileLen(L1),name:`колонка ${ci+1}: срез по ребру`});
    else if(c.side!=='C'&&L1+L2<=SH.L+0.5&&N%2===0)for(let f=0;f<N/2;f++)pcs.push({len:Math.ceil(L1+L2),name:`колонка ${ci+1}: 2 куска «валетом» (срез по ребру)`,n:2});
    else for(let f=0;f<N;f++)pcs.push({len:Math.ceil(L1),name:`колонка ${ci+1}: срез по ребру`});});}
  else pcs=rq.pieces.map(p=>({len:m.cov==='tile'?tileLen(p.len):Math.ceil(p.len),name:`колонка ${p.col+1}${p.row?`, ряд ${p.row+1} (добор)`:''}`}));
  roofPl=plan(m.cov,`${COVERS[m.cov].s} — листы ${SH.W}×${SH.L}`,cut1D(pcs,[{L:SH.L,pr:CAT[m.cov].pr,key:m.cov}],0),{unit:'лист'});}
 const rNote=pl=>`${pl.n} листов · в дело ${pct(pl)}${m.poly?' · срезы по рёбрам':''}`;
 // доборные планки, конёк, капельник, водосток: каждая полоса — целыми планками с нахлёстом, хвосты — из общих
 const trimRuns={};for(const p of P)if(p.trim&&p.kind==='angle'&&TRIM_STOCK[p.cat])(trimRuns[p.cat]=trimRuns[p.cat]||[]).push(p);
 const trimLine=(k,cat)=>{const runs=trimRuns[k];if(!runs)return;const [L,ov]=TRIM_STOCK[k],pcs=[];
  runs.forEach((p,ri)=>{let a=0;while(p.L-a>L+0.5){pcs.push({len:L,name:p.name+' — целая'});a+=L-ov;}pcs.push({len:Math.max(50,Math.ceil(p.L-a)),name:p.name+' — добор'});});
  const pl=plan(k,`${CAT[k].n.split(',')[0]} — ${L/1000} м`,cut1D(pcs,[{L,pr:CAT[k].pr,key:k}],ov?0:2),{unit:'шт'});
  add_(cat||'Кровля',k,pl.n,{note:`${runs.length} ${runs.length===1?'полоса':'полос'}, нахлёст ${ov} мм${rest1(pl)}`});};
 switch(m.cov){
  case'c20':add_('Кровля','c20',roofPl.n,{note:rNote(roofPl)});trimLine(m.poly?'ridgeC20':'ridgeC20');add_('Кровля','sealC20',Math.ceil(ridgeM*2+rq.eaveLen));trimLine('trimC20');add_('Кровля','roofScrew',Math.ceil((roofScr+40)/100),{note:`≈${roofScr+40} шт`});break;
  case'tile':add_('Кровля','tile',roofPl.n,{note:rNote(roofPl)+' · режем по линии ступени'});trimLine('ridgeTile');trimLine('trimTile');add_('Кровля','ridgeSeal',Math.ceil(ridgeM*2));add_('Кровля','roofScrew',Math.ceil((roofScr+50)/100),{note:`≈${roofScr+50} шт`});break;
  case'ondulin':add_('Кровля','ondulin',roofPl.n,{note:rNote(roofPl)+', нахлёст 1 волна и 170 мм'});trimLine('ridgeOnd');trimLine('wind');add_('Кровля','ondNail',Math.ceil(roofPl.n*20/100),{note:'20 на лист'});break;
  case'falc':add_('Кровля','falc',Math.ceil(shA*1.03),{note:`${shA.toFixed(1)} м² + 3% на подрезку: панели под заказ точно по длине ската, без поперечных стыков`});add_('Кровля','falcScrew',Math.max(1,Math.ceil((rq.hidden||rq.sheets*6)*2/250)),{note:'крепёж скрыт в замке'});trimLine('ridgeC20');trimLine('trimC20');break;
  case'pcm':add_('Кровля','pcm',roofPl.n,{note:rNote(roofPl)});trimLine('trimC20');add_('Кровля','roofScrew',Math.ceil((roofScr+pcScr+40)/100),{note:'с EPDM-шайбой, отверстия Ø+3 мм'});break;
  case'shingle':{let pl;
   if(m.poly){ // грань — треугольник: ряды по 1250 вдоль карниза, трапеции соседних граней «валетом» в одну ленту, лента режется на листы по 2500
    const N=rq.colsN,{b0,Hs}=rq.facet,pcs=[];
    for(let a=0,r=0;a<Hs-20;a+=1250,r++){const h=Math.min(1250,Hs-a),bb=b0*(1-a/Hs),bt=b0*Math.max(0,1-(a+h)/Hs),chain=N*(bb+bt)/2+(bb-bt)/2+N*6;
     let x=0;while(chain-x>2500.5){pcs.push({len:2500,name:`ряд ${r+1}: трапеции валетом`});x+=2500;}pcs.push({len:Math.ceil(chain-x),name:`ряд ${r+1}: хвост ленты`});}
    pl=plan('osb12','OSB-3 12 мм 1250×2500 — сплошной настил',cut1D(pcs,[{L:2500,pr:CAT.osb12.pr,key:'osb12'}],3),{unit:'лист'});}
   else{const rects=[];rq.osb.forEach((o,si)=>{const n=Math.ceil(o.span/1250-1e-6);for(let k=0;k<n;k++){const w=Math.min(1250,o.span-k*1250);sheetColumn(o.sL,{L:2500,lap:0}).forEach((l,r)=>rects.push({w:Math.round(w),h:Math.ceil(l),name:`скат ${si+1}, полоса ${k+1}${r?' (добор)':''}`}));}});
    pl=plan('osb12','OSB-3 12 мм 1250×2500 — сплошной настил',cut2D(rects,[{W:1250,H:2500,pr:CAT.osb12.pr,key:'osb12'}],{kerf:3}),{unit:'лист'});}
   add_('Кровля','osb12',pl.n,{note:`${m.poly?'рядами вдоль карниза, трапеции соседних граней валетом':'длинной стороной вдоль ската'}, стыки — на обрешётке · в дело ${pct(pl)}`});
   add_('Кровля','shingle',Math.ceil(rq.area*(m.poly?1.08:1.05)/3),{note:`${rq.area.toFixed(1)} м² + ${m.poly?8:5}% на подрезку${m.poly?' у рёбер':''}`});
   add_('Кровля','ridgeSh',Math.max(1,Math.ceil((ridgeM+rq.eaveLen)/12)));
   const ulA=P.filter(p=>p.role==='underlay').reduce((s,p)=>s+(p.kind==='tri'?polyArea(p.pts):p.w*p.h),0)/1e6;
   add_('Кровля','underlay',Math.max(1,Math.ceil(ulA*1.1/10)),{note:`${ulA.toFixed(1)} м² полосами по карнизам, ${m.poly?'рёбрам':'коньку и фронтонам'} + нахлёст 10%`});
   add_('Кровля','nails',2);add_('Кровля','mastic',1);trimLine('drip');trimLine('wind');break;}
  case'pc':{const rects=rq.pcStrips.map((w,i)=>({w:Math.round(w),h:Math.round(rq.pcLen),name:`полоса ${i+1} (${Math.round(w)} мм)`}));
   const pl=plan('pc8','Поликарбонат сотовый 8 мм — листы 2,1 м',cut2D(rects,PC_STOCK(),{kerf:2}),{unit:'лист'});
   for(const k of Object.keys(pl.by))add_('Кровля',k,pl.by[k],{note:`${rects.length} ${rects.length===1?'полоса':'полосы'} по ${Math.round(rq.pcLen)} мм, каналы вдоль ската · в дело ${pct(pl)}`});
   const nJ=Math.max(0,rects.length-1);
   if(nJ){const pj=plan('pcConn','Профиль соединительный — 6 м',cut1D([...Array(nJ)].map((_,i)=>({len:Math.ceil(rq.pcLen),name:`стык ${i+1}`})),[{L:6000,pr:CAT.pcConn.pr,key:'pcConn'}],2),{unit:'шт'});add_('Кровля','pcConn',pj.n,{note:`${nJ} ${nJ===1?'стык':'стыка'} над сдвоенными стропилами${rest1(pj)}`});}
   const ep=[];rects.forEach((r,i)=>ep.push({len:r.w,name:`полоса ${i+1}, низ`},{len:r.w,name:`полоса ${i+1}, верх`}));
   for(let sd=0;sd<2;sd++){let a=0;const Ls=Math.ceil(rq.pcLen);while(Ls-a>2100){ep.push({len:2100,name:'бок'});a+=2100;}ep.push({len:Ls-a,name:'бок'});}
   const pe=plan('pcEnd','Профиль торцевой — 2,1 м',cut1D(ep,[{L:2100,pr:CAT.pcEnd.pr,key:'pcEnd'}],2),{unit:'шт'});add_('Кровля','pcEnd',pe.n,{note:`торцы полос и боковые кромки${rest1(pe)}`});
   add_('Кровля','pcTape',1);add_('Кровля','pcScrew',Math.ceil((pcScr+10)/25),{note:`≈${pcScr+10} шт`});break;}
 }
 if(osbScr)add_('Кровля','osbScrew',Math.ceil(osbScr*1.1/100),{note:`${osbScr} шт по рядам обрешётки, шаг 300 мм`});
 if(trimScr&&['falc','ondulin'].includes(m.cov))add_('Кровля','roofScrew',Math.ceil((trimScr+20)/100),{note:`${trimScr} шт: конёк и торцевые планки`});
 if(trimRuns.gutter){trimLine('gutter');add_('Кровля','gutterSet',1);add_('Кровля','downpipe',1,{note:'с задней стороны, в сторону от дорожки'});}
 if(m.poly)add_('Кровля','hipCap',1,{note:'закрывает центральный узел и верх рёбер'});
 add_('Кровля','selfDrill',Math.ceil((m.C.selfDrill+tekX)/50),{note:`${m.C.selfDrill+tekX} шт: обрешётка${m.poly?' к рёбрам':' к упорам'}, столики${tekX?', основания профилей':''}`});
 if(m.C.clip)add_('Пол','clip',Math.ceil(m.C.clip/100),{note:`${m.C.clip} шт: уголки лаг`});
 const flA=m.poly?m.poly/2*m.R*m.R*Math.sin(2*Math.PI/m.poly)/1e6:m.W*m.D/1e6;
 if(m.isFloor){const dk=DECKS[cfg.deck],pcs=m.deck.pieces.map((len,i)=>({len,name:`доска ${i+1}`})),ns=m.screws.filter(s=>s.type==='deck').length;
  const pl=plan(dk.cat,`${dk.t}: доска настила — 3 м`,cut1D(pcs,[{L:3000,pr:CAT[dk.cat].pr,key:dk.cat}],4),{unit:'доска',kerf:4});
  add_('Пол',dk.cat,pl.n,{note:`${pcs.length} кусков${m.poly?', обрезка по граням':m.W>3000?', стыки вразбежку на лагах':', доски целиком'} · в дело ${pct(pl)}${rest1(pl)}`});
  if(cfg.deck==='wpc')add_('Пол','wpcClip',Math.ceil(flA),{note:'скрытый крепёж ДПК'});else{add_('Пол','deckScrew',Math.ceil(ns/100),{note:`${ns} шт`});add_('Пол','antisept',1);}}
 else{add_('Пол','geotex',Math.ceil(flA/50));add_('Пол','gravel',Math.ceil(flA*0.07*1.5/0.05*1.05),{note:`≈${(flA*0.07).toFixed(2)} м³; навалом с доставкой обычно дешевле`});}
 const fi=m.fillInfo;
 if(fi.length){
  if(cfg.fill==='prof'){const rects=[];
   fi.forEach(f=>{const n=Math.max(1,Math.ceil((f.len-50)/1150-1e-6));for(let k=0;k<n;k++){const w=k<n-1?1200:Math.round(f.len-(n-1)*1150);rects.push({w:Math.max(60,Math.min(1200,w)),h:Math.round(f.h),name:`борт ${f.n}, лист ${k+1}`});}});
   const pl=plan('c8','Профнастил С8 1200×2000 — борта',cut2D(rects,[{W:1200,H:2000,pr:CAT.c8.pr,key:'c8'}],{kerf:0}),{unit:'лист'});
   add_('Борта','c8',pl.n,{note:`${rects.length} кусков, волна вертикально, нахлёст 1 волна · в дело ${pct(pl)}`});
   add_('Борта','fillScrew',Math.ceil(m.screws.filter(s=>s.type==='fill').length/100));
  }else{const euro=cfg.fill==='euro',key=euro?'euro':'plank',L=euro?2000:3000,pcs=[];
   fi.forEach(f=>{for(let i=0;i<f.pieces;i++)pcs.push({len:Math.ceil(f.h),name:`борт ${f.n}`});});
   const pl=plan(key,euro?'Штакетник металлический — 2 м':'Доска строганая 20×95 — 3 м',cut1D(pcs,[{L,pr:CAT[key].pr,key}],euro?2:3),{unit:'шт',kerf:euro?2:3});
   add_('Борта',key,pl.n,{note:`${pcs.length} штакетин · в дело ${pct(pl)}${rest1(pl)}`});
   if(euro)add_('Борта','fillScrew',Math.ceil(m.screws.filter(s=>s.type==='fill').length/100));
   else{add_('Борта','woodScrew',Math.ceil(m.screws.filter(s=>s.type==='wood').length/100));add_('Борта','woodOil',1);}}
 }
 let area=0,aWood=0;for(const p of P){if(p.kind==='tube'&&p.wood)aWood+=2*(p.sx+p.sy)*p.cutLen;else if(p.kind==='tube')area+=2*(p.sx+p.sy)*p.cutLen;else if(p.kind==='angle'&&p.cat==='ang40')area+=2*(p.A+p.B)*p.L;else if(p.kind==='box'&&PLATE_ROLES.includes(p.role))area+=2*p.w*p.h;}
 area/=1e6;aWood/=1e6;const kg=area*2*0.11*1.15;
 if(aWood){{const k=CAT.antisept2.conc||1,L=aWood*0.35;add_('Покраска и защита','antisept2',Math.ceil(L/(5*k)),{note:`${aWood.toFixed(1)} м² бруса × 0,35 л/м² ≈ ${Math.ceil(L)} л раствора${k>1?`; канистра концентрата 1:${k-1} даёт ${5*k} л`:''} — до сборки, все грани и пропилы`});}add_('Покраска и защита','woodOilExt',Math.ceil(aWood*2*0.09/2.5),{note:'2 слоя после антисептика, обновлять раз в 3–4 года'});add_('Покраска и защита','endSeal',1,{note:'все торцы и пропилы'});}
 {// банки 2,7 кг почти вдвое дешевле за кило: берём их, а остаток — малой банкой, только если так дешевле
  const n27=Math.floor(kg/2.7),r=kg-n27*2.7,small=r>0.05?Math.ceil(r/0.9):0,big=small&&small*CAT.paint.pr>=CAT.paint27.pr?1:0,N27=n27+big,N9=big?0:small;
  add_('Покраска и защита','paint27',N27,{note:`${area.toFixed(1)} м² × 2 слоя ≈ ${kg.toFixed(1)} кг${N9?'':N27*2.7-kg>0.4?` · остаток ${dec1(N27*2.7-kg)} кг — на подкраску`:''}`});
  add_('Покраска и защита','paint',N9,{note:N27?'остаток до нужного веса':`${area.toFixed(1)} м² × 2 слоя ≈ ${kg.toFixed(1)} кг`});}
 add_('Покраска и защита','solvent',2);add_('Покраска и защита','zinc',2);add_('Покраска и защита','sealant',1,{note:'пропилы под языки, нахлёсты'});
 add_('Сварка (дома, в мастерской)','electrode',Math.max(1,Math.ceil(m.weldLen/1000*0.12)),{note:`швы ≈ ${(m.weldLen/1000).toFixed(1)} м, катет 3 мм, ток 70–90 А`});add_('Сварка (дома, в мастерской)','gdisc',3);
 add_('Расходники','discs',2);add_('Расходники','drill4',2);add_('Расходники','drill9',2);if(P.some(p=>p.kind==='bolt'&&p.d===10))add_('Расходники','drill11',2);add_('Расходники','stepDrill',1);
 if(m.dress)for(const it of m.dress.bom){const c=CAT[it.base||it.key],pr=it.price!=null?it.price:c.pr;
  lines.push({cat:'Оформление',key:it.key,name:it.name||c.n,qty:it.qty,unit:c.u,price:pr,sum:it.qty*pr,url:c.url,src:c.src,sku:c.sku,lk:c.lk,city:c.city,warn:it.warn||c.warn,note:it.note});}
 const total=lines.reduce((s,l)=>s+l.sum,0);
 const byCat={};lines.forEach(l=>byCat[l.cat]=(byCat[l.cat]||0)+l.sum);
 const steelKg=P.reduce((s,p)=>s+(p.wood?0:massOf(p)),0),woodKg=P.reduce((s,p)=>s+(p.wood?massOf(p):0),0);
 // сводка раскроя: сколько денег уходит в обрезки (по цене купленного)
 let wasteRub=0,cutRub=0;for(const c of cuts){const k=base&&/^p\d|^ang/.test(c.key)?0.65:1;cutRub+=c.plan.cost*k;wasteRub+=c.plan.cost*k*(1-c.plan.util);}
 return{lines,total,byCat,plans,boltLines,steelKg,woodKg,area,cuts,waste:{rub:Math.round(wasteRub),of:Math.round(cutRub),pct:cutRub?wasteRub/cutRub:0}};
}

/* ---------------- подсказки: соседние размеры и уклон, при которых материал ложится лучше ----------------
   Считаем полную смету для каждого варианта. Показываем только то, что честно выгодно: дешевле за квадратный метр
   (а не просто «меньше беседка — меньше денег») или заметно дешевле почти без потери площади. */
function footArea(c){const T=TYPES[c.type];if(T.poly){const R=c.W/2;return T.poly/2*R*R*Math.sin(2*Math.PI/T.poly)/1e6;}return c.W*c.D/1e6;}
function suggest(cfgIn,base0){
 const c0=sanitize(cfgIn),T=TYPES[c0.type],b0=base0||bom(build(c0)),A0=footArea(c0),r0=b0.total/A0,cand=[];
 for(const k of T.poly?['W']:['W','D']){const [lo,hi]=T.poly?LIM.P:LIM[k];for(const d of [-300,-200,-100,100,200,300]){const v=c0[k]+d;if(v>=lo&&v<=hi)cand.push({[k]:v});}}
 const amin=Math.max(T.angR[0],COVERS[c0.cover].min);for(const d of [-3,-2,-1,1,2,3]){const a=c0.ang+d;if(a>=amin&&a<=T.angR[1])cand.push({ang:a});}
 const lines0={};for(const l of b0.lines)lines0[l.key]=l;
 const out=[];
 for(const patch of cand){const c=sanitize(Object.assign({},c0,patch));if(JSON.stringify(c)===JSON.stringify(c0))continue;
  const b=bom(build(c)),A=footArea(c),d=b.total-b0.total,rpm=b.total/A;
  const good=(rpm<r0*0.985&&d<0&&A/A0>0.86)||(d<=-2500&&A/A0>=0.93)||(d<=-0.08*b0.total&&A/A0>=0.88&&rpm<r0)||(A>A0&&d<=300)||(patch.ang!=null&&d<=-800); // крупная экономия (целый лист, хлыст) при небольшой потере площади — тоже предлагаем
  if(!good)continue;
  const why=[];const l1={};for(const l of b.lines)l1[l.key]=l;
  for(const k of new Set([...Object.keys(lines0),...Object.keys(l1)])){const a=lines0[k],z=l1[k],ds=(z?z.sum:0)-(a?a.sum:0);if(Math.abs(ds)>=300)why.push({k,ds,q0:a?a.qty:0,q1:z?z.qty:0,u:(z||a).unit,n:CAT[k]?CAT[k].n.split(/[,(]/)[0]:(z||a).name});}
  why.sort((x,y)=>x.ds-y.ds);
  out.push({patch,cfg:c,total:b.total,d,area:A,dA:A-A0,rpm,why:why.slice(0,3),waste:b.waste});}
 out.sort((x,y)=>(x.rpm-y.rpm)||(x.d-y.d));
 const seen=new Set(),res=[];for(const s of out){const k=Object.keys(s.patch)[0];if(seen.has(k+(s.d<0?'-':'+')))continue;seen.add(k+(s.d<0?'-':'+'));res.push(s);if(res.length>=4)break;}
 return res;
}

/* ---------------- проверки: отверстия, торцы, пересечения тел ---------------- */
function checks(m){
 const res={bolt:[],edge:[],coll:[]};
 for(const p of m.parts.filter(p=>p.kind==='tube')){
  const H=p.holes;
  for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){
   const a=H[i],b=H[j];if(a.bolt&&a.bolt===b.bolt)continue;
   if(a.face==='R'||b.face==='R'){if(a.single||b.single)continue;if(Math.abs(a.s-b.s)<(a.d+b.d)/2+3)res.bolt.push({p,a,b,why:'болты пересекаются внутри круглой трубы'});continue;}
   if(a.face!==b.face){if(a.single||b.single)continue;if(Math.abs(a.s-b.s)<(a.d+b.d)/2+3)res.bolt.push({p,a,b,why:'встречаются перпендикулярные болты'});}
   else{const dd=Math.hypot(a.s-b.s,a.off-b.off);if(dd<(a.d+b.d)/2+1.2*Math.min(a.d,b.d))res.bolt.push({p,a,b,why:`мал шаг отверстий (${dd.toFixed(0)} мм)`});}
  }
  if(p.wood)for(const h of H){ // брус — СП 64, п. 8.20 (пакет тоньше 10d): от торца ≥ 6d, от кромки ≥ 2,5d
   if(h.single)continue;const d=h.d-1,half=h.face==='X'?p.sy/2:p.sx/2,pts=h.face==='X'?[[-p.sx/2,h.off],[p.sx/2,h.off]]:[[h.off,-p.sy/2],[h.off,p.sy/2]],zA=Math.max(...pts.map(([x,y])=>cutZ(p.cutA,x,y,0))),zB=Math.min(...pts.map(([x,y])=>cutZ(p.cutB,x,y,p.L))),de=Math.min(h.s-zA,zB-h.s);
   if(de<6*d-0.5)res.edge.push({p,h,why:`брус: до торца ${de.toFixed(0)} мм, нужно ≥ ${6*d}`});if(half-Math.abs(h.off)<2.5*d-0.5)res.edge.push({p,h,why:`брус: до кромки ${(half-Math.abs(h.off)).toFixed(0)} мм, нужно ≥ ${2.5*d}`});}
  for(const h of H){
   if(h.face==='R'){const zB=cutZ(p.cutB,0,0,p.L),zA=cutZ(p.cutA,0,0,0),de=Math.min(h.s-zA,zB-h.s)-p.sx/2*(p.cutB?Math.abs(Math.tan(Math.acos(Math.min(1,Math.abs(p.cutB.n[2])/len(p.cutB.n))))):0);if(de<1.2*h.d)res.edge.push({p,h,why:`близко к торцу (${de.toFixed(0)} мм)`});continue;}
   const half=h.face==='X'?p.sy/2:p.sx/2;
   if(half-Math.abs(h.off)-h.d/2<4)res.edge.push({p,h,why:`близко к ребру трубы (${(half-Math.abs(h.off)).toFixed(0)} мм)`});
   const pts=h.face==='X'?[[-p.sx/2,h.off],[p.sx/2,h.off]]:[[h.off,-p.sy/2],[h.off,p.sy/2]];
   const zA=Math.max(...pts.map(([x,y])=>cutZ(p.cutA,x,y,0))),zB=Math.min(...pts.map(([x,y])=>cutZ(p.cutB,x,y,p.L)));
   const de=Math.min(h.s-zA,zB-h.s);
   if(de<1.2*h.d)res.edge.push({p,h,why:`близко к торцу (${de.toFixed(0)} мм)`});
  }
 }
 const ob=[];
 for(const p of m.parts){
  if(p.kind==='tube'){if(p.role==='spigot'||p.round)continue;const z0=p.zA1,z1=p.zB0;if(z1-z0<2)continue;ob.push({p,c:add(p.o,mul(p.az,(z0+z1)/2)),A:[p.ax,p.ay,p.az],h:[p.sx/2,p.sy/2,(z1-z0)/2]});}
  else if(p.kind==='angle'&&!p.trim){ob.push({p,c:add(p.o,add(add(mul(p.ax,p.A/2),mul(p.ay,p.t/2)),mul(p.az,p.L/2))),A:[p.ax,p.ay,p.az],h:[p.A/2,p.t/2,p.L/2]});ob.push({p,c:add(p.o,add(add(mul(p.ax,p.t/2),mul(p.ay,p.B/2)),mul(p.az,p.L/2))),A:[p.ax,p.ay,p.az],h:[p.t/2,p.B/2,p.L/2]});}
  else if(p.kind==='box'&&['basePlate','flange','newelPlate','support'].includes(p.role))ob.push({p,c:p.c,A:[p.ax,p.ay,p.az],h:[p.w/2,p.h/2,p.t/2]});
 }
 const seen=new Set();
 for(let i=0;i<ob.length;i++)for(let j=i+1;j<ob.length;j++){
  const a=ob[i],b=ob[j];if(a.p===b.p)continue;
  if((a.p.notch&&a.p.notch.includes(b.p.id))||(b.p.notch&&b.p.notch.includes(a.p.id)))continue;   // врубка: брус заходит в брус на 12–30 мм
  const d=sub(b.c,a.c);if(len(d)>a.h[0]+a.h[1]+a.h[2]+b.h[0]+b.h[1]+b.h[2])continue;
  let minO=Infinity;const axes=[...a.A,...b.A];for(const u of a.A)for(const v of b.A){const c=cross(u,v);if(len(c)>1e-6)axes.push(norm(c));}
  for(const L of axes){const ra=a.h.reduce((s,h,k)=>s+h*Math.abs(dot(a.A[k],L)),0),rb=b.h.reduce((s,h,k)=>s+h*Math.abs(dot(b.A[k],L)),0);const o=ra+rb-Math.abs(dot(d,L));if(o<minO)minO=o;if(minO<1)break;}
  if(a.p.role==='wBrace'&&b.p.role==='wBrace'&&minO<6)continue;   // концы подкосов во врубках одной стойки — внутри бруса
  if(minO>=1){const k=Math.min(a.p.id,b.p.id)+'-'+Math.max(a.p.id,b.p.id);if(!seen.has(k)){seen.add(k);res.coll.push({a:a.p,b:b.p,o:minO});}}
 }
 // круглые трубы: углы соседних деталей не должны заходить внутрь (седловые резы — допустимы по замыслу)
 for(const rp of m.parts.filter(p=>p.kind==='tube'&&p.round)){
  const r2=(rp.sx/2-1.5)**2;
  for(const q of m.parts){
   if(q===rp||!['tube','box','angle'].includes(q.kind)||q.trim||(q.saddle&&q.saddle.includes(rp.id))||['tongue','capPlate','spigot','grout','decor','osb','shingle','gravel','pad','cushion','backfill','gasBlock'].includes(q.role)||q.kind==='box'&&!['basePlate','flange','newelPlate','support'].includes(q.role))continue;
   for(const c of corners8(q)){const d=sub(c,rp.o),z=dot(d,rp.az),x=dot(d,rp.ax),y=dot(d,rp.ay);
    if(x*x+y*y<r2&&z>cutZ(rp.cutA,x,y,0)+1&&z<cutZ(rp.cutB,x,y,rp.L)-1){const k=Math.min(rp.id,q.id)+'-'+Math.max(rp.id,q.id);if(!seen.has(k)){seen.add(k);res.coll.push({a:rp,b:q,o:Math.sqrt(r2)-Math.sqrt(x*x+y*y)});}break;}}
  }
 }
 return res;
}

/* ---------------- прочностной расчёт (упрощённо, по фактическим пролётам) ---------------- */
// расчёт — полная проверка надёжности (см. verify); оставлено имя calc для интерфейса
function calc(m){return m.verify||verify(m);}

return{build,bom,suggest,footArea,checks,calc,verify,cutZ,sanitize,FAST,CAT,PRICE_DATE,TYPES,COVERS,DECKS,TRUCKS,LIM,RAILS,STEPS,LAYERS,ROLE,SEC,BOLT,SNOW:SNOW_,WIND:WIND_,pack,cut1D,cut2D,durability,MATS,WOODS,SOILS,FNDS,HOLDS,MAX_SLABS,anchorRd};
})();
