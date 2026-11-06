// Проверка порядка сборки по шагам: опора (ничего не висит в воздухе), болты и саморезы — не раньше своих деталей,
// сварной модуль — одним шагом, доступ сверху (деталь не закрыта тем, что уже стоит; в анимации не пролетает сквозь детали)
const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const nrm=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
const PROF={C20:20,TILE:32,OND:38,FALC:25,PCM:20,PC8:8,C8:8,EURO:18};
// тело детали: набор ориентированных коробок {c,u:[3 оси],e:[полуразмеры]} (для наклонных и сложных — по углам)
function bodies(p){
 const ob=(c,u,e)=>({c,u:u.map(nrm),e});
 const fromPts=pts=>{const lo=[0,1,2].map(i=>Math.min(...pts.map(q=>q[i]))),hi=[0,1,2].map(i=>Math.max(...pts.map(q=>q[i])));return ob(lo.map((v,i)=>(v+hi[i])/2),[[1,0,0],[0,1,0],[0,0,1]],lo.map((v,i)=>(hi[i]-v)/2));};
 switch(p.kind){
  case'tube':{const z0=p.zA1,z1=p.zB0>p.zA1+20?p.zB0:p.zB1;return[ob(add(p.o,mul(p.az,(z0+z1)/2)),[p.ax,p.ay,p.az],[p.sx/2,p.sy/2,Math.max(5,(z1-z0)/2)])];} // ядро между косыми резами
  case'box':return[ob(p.c,[p.ax,p.ay,p.az],[p.w/2,p.h/2,p.t/2])];
  case'angle':{const orth=Math.abs(dot(p.ax,p.ay))<0.05;
   if(!orth){ // гнутая планка: каждая полка в своём скате, толщина наружу (как в просмотрщике)
    const X=nrm(p.ax),Y=nrm(p.ay),Z=nrm(p.az),out=nrm([-(X[0]+Y[0]),-(X[1]+Y[1]),-(X[2]+Y[2])]);
    return[[X,p.A],[Y,p.B]].map(([d,W])=>{let n=nrm([d[1]*Z[2]-d[2]*Z[1],d[2]*Z[0]-d[0]*Z[2],d[0]*Z[1]-d[1]*Z[0]]);if(dot(n,out)<0)n=mul(n,-1);
     return ob(add(p.o,add(add(mul(d,W/2),mul(n,p.t/2)),mul(Z,p.L/2))),[d,n,Z],[W/2,p.t/2,p.L/2]);});}
   return[ob(add(p.o,add(add(mul(p.ax,p.A/2),mul(p.ay,p.t/2)),mul(p.az,p.L/2))),[p.ax,p.ay,p.az],[p.A/2,p.t/2,p.L/2]),ob(add(p.o,add(add(mul(p.ax,p.t/2),mul(p.ay,p.B/2)),mul(p.az,p.L/2))),[p.ax,p.ay,p.az],[p.t/2,p.B/2,p.L/2])];}
  case'sheet':{const H=PROF[p.profile]||20;return[ob(add(p.o,add(add(mul(p.ax,p.W/2),mul(p.ay,H/2)),mul(p.az,p.L/2))),[p.ax,p.ay,p.az],[p.W/2,H/2,p.L/2])];}
  case'facet':case'tri':{ // многоугольник в своей плоскости — полосами по v (точно повторяет треугольник у рёбер)
   const P=p.pts,vs=P.map(q=>q[1]),v0=Math.min(...vs),v1=Math.max(...vs),n=24,out=[],H0=p.kind==='tri'?p.h0:0,H1=p.kind==='tri'?p.h0+p.t:30;
   const span=v=>{let lo=1e9,hi=-1e9;for(let i=0;i<P.length;i++){const A=P[i],B=P[(i+1)%P.length];if((A[1]-v)*(B[1]-v)<=0&&A[1]!==B[1]){const u=A[0]+(B[0]-A[0])*(v-A[1])/(B[1]-A[1]);lo=Math.min(lo,u);hi=Math.max(hi,u);}}return[lo,hi];};
   for(let i=0;i<n;i++){const a=v0+(v1-v0)*i/n,b=v0+(v1-v0)*(i+1)/n,[lo,hi]=span((a+b)/2);if(!(hi>lo))continue;
    const uc=(lo+hi)/2,vc=(a+b)/2,hc=(H0+H1)/2;
    const c=p.kind==='tri'?add(p.o,add(add(mul(p.ax,uc),mul(p.ay,vc)),mul(p.az,hc))):add(p.o,add(add(mul(p.ax,uc),mul(p.ay,hc)),mul(p.az,vc)));
    out.push(p.kind==='tri'?ob(c,[p.ax,p.ay,p.az],[(hi-lo)/2,(b-a)/2,(H1-H0)/2]):ob(c,[p.ax,p.ay,p.az],[(hi-lo)/2,(H1-H0)/2,(b-a)/2]));}
   return out;}
  case'poly':{const pts=[];for(const [x,z] of p.pts)for(const y of [p.y0,p.y0+p.h])pts.push([x,y,z]);return[fromPts(pts)];}
  case'cyl':case'cone':return[ob([p.c[0],p.c[1]+p.h/2,p.c[2]],[[1,0,0],[0,1,0],[0,0,1]],[p.r,p.h/2,p.r])];
  case'stud':return[fromPts([add(p.a,[-6,0,-6]),add(p.b,[6,0,6])])];
 }
 return[];
}
// пересечение ориентированных коробок (теорема о разделяющей оси), с допуском tol
function hit(A,B,tol){
 const T=[B.c[0]-A.c[0],B.c[1]-A.c[1],B.c[2]-A.c[2]],ax=[...A.u,...B.u];
 for(const a of A.u)for(const b of B.u){const c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],l=Math.hypot(...c);if(l>1e-6)ax.push(c.map(x=>x/l));}
 for(const L of ax){const ra=A.e.reduce((s,e,i)=>s+e*Math.abs(dot(A.u[i],L)),0),rb=B.e.reduce((s,e,i)=>s+e*Math.abs(dot(B.u[i],L)),0);if(Math.abs(dot(T,L))>ra+rb+tol)return false;}
 return true;}
const inside=(B,q,tol)=>B.u.every((u,i)=>Math.abs(dot([q[0]-B.c[0],q[1]-B.c[1],q[2]-B.c[2]],u))<=B.e[i]+tol);
const aabb=bs=>{const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const B of bs)for(let i=0;i<3;i++){const r=B.e.reduce((s,e,k)=>s+e*Math.abs(B.u[k][i]),0);lo[i]=Math.min(lo[i],B.c[i]-r);hi[i]=Math.max(hi[i],B.c[i]+r);}return{lo,hi};};

function check(cfg){
 const m=BM.build(cfg),P=m.parts,steps=m.steps.map(s=>s.id),SI=Object.fromEntries(steps.map((s,i)=>[s,i])),issues=[];
 const isGround=p=>p.step==='found'||p.role==='gravel'||p.role==='backfill';
 const use=P.filter(p=>!['weld','bolt'].includes(p.kind)&&p.layer!=='decor'&&p.layer!=='dress');
 const body=new Map(),box=new Map();for(const p of use){const b=bodies(p);body.set(p.id,b);box.set(p.id,aabb(b));}
 const byId=new Map(P.map(p=>[p.id,p]));
 // 1. сварной модуль — одним шагом
 const modStep={};for(const p of P)if(m.MODS[p.module]){const s=modStep[p.module];if(s&&s!==p.step&&p.kind!=='weld')issues.push({k:'модуль в разных шагах',m:`${m.MODS[p.module]}: ${s} и ${p.step} (${p.name})`});modStep[p.module]=modStep[p.module]||p.step;}
 // 2. болт — не раньше деталей, которые он стягивает
 for(const b of P.filter(p=>p.kind==='bolt')){const late=b.thru.map(id=>byId.get(id)).filter(q=>q&&SI[q.step]>SI[b.step]);if(late.length)issues.push({k:'болт раньше детали',m:`${b.joint}: болт в «${b.step}», ${late[0].name} — в «${late[0].step}»`});}
 // связи: модуль, болт, саморез, касание
 const adj=new Map(use.map(p=>[p.id,[]])),edge=(a,b,s)=>{if(a===b||!adj.has(a)||!adj.has(b))return;adj.get(a).push([b,s]);adj.get(b).push([a,s]);};
 const mods={};for(const p of use)if(m.MODS[p.module])(mods[p.module]=mods[p.module]||[]).push(p.id);
 for(const k in mods){const ids=mods[k];for(let i=1;i<ids.length;i++)edge(ids[0],ids[i],SI[byId.get(ids[0]).step]);}
 for(const b of P.filter(p=>p.kind==='bolt')){const ids=b.thru.filter(id=>adj.has(id));for(let i=1;i<ids.length;i++)edge(ids[0],ids[i],SI[b.step]);}
 // сетка для поиска соседей
 const G=400,grid=new Map(),cellsOf=bx=>{const out=[];for(let x=Math.floor(bx.lo[0]/G);x<=Math.floor(bx.hi[0]/G);x++)for(let y=Math.floor(bx.lo[1]/G);y<=Math.floor(bx.hi[1]/G);y++)for(let z=Math.floor(bx.lo[2]/G);z<=Math.floor(bx.hi[2]/G);z++)out.push(x+','+y+','+z);return out;};
 for(const p of use){if(!body.get(p.id).length)continue;for(const c of cellsOf(box.get(p.id))){if(!grid.has(c))grid.set(c,[]);grid.get(c).push(p);}}
 const near=bx=>{const s=new Set();for(const c of cellsOf(bx))for(const q of grid.get(c)||[])s.add(q);return s;};
 const inPoly=(P,x,z)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,zi]=P[i],[xj,zj]=P[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;};   // доска настила с вырезами: коробка детали их не видит
 for(const sc of m.screws){const pts=[add(sc.p,mul(sc.n,-3)),add(sc.p,mul(sc.n,-12)),add(sc.p,mul(sc.n,-30))],bx={lo:sc.p.map(v=>v-40),hi:sc.p.map(v=>v+40)},hitP=[];
  for(const q of near(bx))if(body.get(q.id).some(B=>pts.some(x=>inside(B,x,2.5)&&(q.kind!=='poly'||inPoly(q.pts,x[0],x[2])))))hitP.push(q);
  for(const q of hitP)if(SI[q.step]>SI[sc.st]&&q.role!=='trim')issues.push({k:'саморез раньше детали',m:`${sc.type} в «${sc.st}» → ${q.name} в «${q.step}»`});
  for(let i=1;i<hitP.length;i++)edge(hitP[0].id,hitP[i].id,SI[sc.st]);}
 for(const p of use){const bp=body.get(p.id);if(!bp.length)continue;for(const q of near(box.get(p.id))){if(q.id<=p.id)continue;if(bp.some(A=>body.get(q.id).some(B=>hit(A,B,2))))edge(p.id,q.id,Math.max(SI[p.step],SI[q.step]));}}
 // 3. к концу каждого шага всё установленное связано с фундаментом
 const firstFloat=new Map();
 for(let s=0;s<steps.length;s++){if(steps[s]==='shop'||steps[s]==='truck')continue;
  const inst=use.filter(p=>SI[p.step]<=s),seen=new Set(),q=[];
  for(const p of inst)if(isGround(p)){seen.add(p.id);q.push(p.id);}
  while(q.length){const a=q.pop();for(const [b,st] of adj.get(a))if(st<=s&&!seen.has(b)&&SI[byId.get(b).step]<=s){seen.add(b);q.push(b);}}
  for(const p of inst)if(!seen.has(p.id)&&!firstFloat.has(p.id))firstFloat.set(p.id,steps[s]);}
 const fl={};for(const [id,s] of firstFloat){const p=byId.get(id);const k=`${p.name.replace(/\s*\(.*$/,'')} — с шага «${s}»`;fl[k]=(fl[k]||0)+1;}
 for(const k in fl)issues.push({k:'висит в воздухе',m:`${k} × ${fl[k]}`});
 // 5. порядок работ: каркас (стойки, оголовки, связи, рёбра) ставится на наживлённых болтах, затем «Выверка и протяжка»;
 //    всё, что держится за выверенный каркас или фундамент (кровля, пол, борта), — только после неё. Фундамент — до погрузки.
 {const FRAME=['ring','posts','heads','sides','hips'],AFTER=['purlins','roofDeck','roofUnder','roofEdge','roof','roofTrim','gutter','bottom','deck','railframe','fill'],ROOF=['purlins','roofDeck','roofUnder','roofEdge','roof','roofTrim','gutter'];
  const has=id=>SI[id]!=null,B=SI.brace;
  if(SI.found>SI.truck)issues.push({k:'порядок работ',m:'фундамент после погрузки: модули привезут на незастывший бетон'});
  if(!has('brace'))issues.push({k:'порядок работ',m:'нет шага «Выверка и протяжка»'});
  else{for(const id of FRAME)if(has(id)&&SI[id]>B)issues.push({k:'порядок работ',m:`каркас «${id}» после выверки`});
   for(const id of AFTER)if(has(id)&&SI[id]<B)issues.push({k:'порядок работ',m:`«${id}» до выверки каркаса`});}
  if(has('bottom'))for(const id of ROOF)if(has(id)&&SI[id]>SI.bottom)issues.push({k:'порядок работ',m:`пол раньше кровли («${id}»): стремянки на лагах, стружка на балках`});
  for(const [a,b] of [['bottom','deck'],['deck','railframe'],['railframe','fill']])if(has(a)&&has(b)&&SI[a]>SI[b])issues.push({k:'порядок работ',m:`«${b}» раньше «${a}»`});
  // до выверки к фундаменту крепятся только стойки: иначе выверять уже нечего — всё зажато
  const postMod=new Set(P.filter(p=>['post','postR'].includes(p.role)&&p.module).map(p=>p.module));
  const frameP=p=>p.step==='ring'||['post','postR','basePlate','wHead','wConn'].includes(p.role)||postMod.has(p.module);
  if(has('brace'))for(const p of use){if(isGround(p)||SI[p.step]>=B||frameP(p))continue;
   const g=adj.get(p.id).find(([q,st])=>{const Q=byId.get(q);return isGround(Q)&&SI[Q.step]<=SI[p.step]&&st<=SI[p.step];});
   if(g)issues.push({k:'порядок работ',m:`${p.name.replace(/\s*\(.*$/,'')} («${p.step}») крепится к фундаменту до выверки каркаса`});}
  for(const p of P)if(p.role==='grout'&&has('brace')&&SI[p.step]<B)issues.push({k:'порядок работ',m:`подливка в «${p.step}» — раньше выверки`});}
 // 4. путь монтажа: деталь подаётся по направлению p.mount (по умолчанию — сверху), сдвигаем её от места до высоты подъёма
 //    анимации и ищем то, что уже стоит: до 100 мм — физически закрыто, дальше — в анимации пролетает сквозь
 const lift=Math.max(700,0.25*(m.dims.top||3000)),DS0=[3,8,15,25,40,60,80,100,150,200,300,400,500,600,700,800,900];
 const unit=p=>m.MODS[p.module]?p.module:'~'+p.id;
 for(const p of use){if(isGround(p)||['grout','sand'].includes(p.role)||p.kind==='stud')continue;const si=SI[p.step],dir=p.mount||[0,1,0],A0=body.get(p.id);if(!A0.length)continue;
  let found=null;const touch=new Set();   // то, чего деталь касается на месте (шип в полой стойке, косой рез, упор), — не препятствие
  for(const q of near(aabb(A0)))if(q.id!==p.id&&body.get(q.id).some(B=>A0.some(A=>hit(A,B,0.5))))touch.add(q.id);
  const reach=p.mountLen||(p.mount?Math.max(500,lift*0.8):lift);
  for(const d of DS0.filter(x=>x<=reach+1)){if(d<20)continue;const sh=mul(dir,d),As=A0.map(A=>({c:add(A.c,sh),u:A.u,e:A.e.map(e=>Math.max(0.5,e-1.5))})),bx=aabb(As);
   for(const q of near(bx)){if(q.id===p.id||touch.has(q.id)||isGround(q)||unit(q)===unit(p)||SI[q.step]*10+(q.seq||0)>=si*10+(p.seq||0))continue;
    if(body.get(q.id).some(B=>As.some(A=>hit(A,B,-0.5)))){found={q,d};break;}}
   if(found)break;}
  if(found){const {q,d}=found;issues.push({k:d<=100?'закрыто на пути монтажа':'в анимации пролетает сквозь',m:`${p.name.replace(/\s*\(.*$/,'')} («${p.step}», подача ${p.mount?'сбоку':'сверху'}) упирается в ${q.name.replace(/\s*\(.*$/,'')} («${q.step}») через ${d} мм`});}}
 return{m,issues};
}
const types=process.argv[2]?process.argv[2].split(','):Object.keys(BM.TYPES),stat={},ex={};let n=0;const t0=Date.now();
const MATL=(process.env.MATS||'steel,hybrid,timber').split(','),FNL=(process.env.FNDS||'pillar').split(',').map(s=>s.split(':'));
for(const mat of MATL)for(const type of types)for(const [fnd,hold,blocks] of FNL){const T=BM.TYPES[type];
 for(const cover of T.covers)for(const base of ['floor','legs'])for(const [rail,fill] of [['0','euro'],['750','euro'],['combo','prof'],['1200','wood']])for(const sz of T.poly?[3000,4200]:[3000,4000]){
  const cfg={type,cover,base,rail,fill,W:sz,D:T.poly?sz:3000+(sz-3000)/2,H:2200,snow:'3',wind:'1',mat,wood:'glulam',fnd,hold:hold||'anchor',blocks:+blocks||1};n++;
  const {issues}=check(cfg);
  for(const i of issues){const key=mat+' '+fnd+' '+type+' | '+i.k+' | '+i.m.replace(/\d+(?: × \d+)?/g,'#');stat[key]=(stat[key]||0)+1;if(!ex[key])ex[key]=JSON.stringify({cover,base,rail,fill,sz})+'  '+i.m;}}}
console.log('конфигураций',n,'типов замечаний',Object.keys(stat).length,'сек',((Date.now()-t0)/1000).toFixed(0));
for(const [k,c] of Object.entries(stat).sort((a,b)=>a[0].localeCompare(b[0])))console.log(String(c).padStart(4),k.slice(0,150),'\n      пример:',ex[k].slice(0,260));
