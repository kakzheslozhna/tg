/* ---------------- основание без фундамента ----------------
   Вместо столбов — сварная рама. Всё выше рамы не меняется: стойка садится на те же 4 шпильки, только они приварены к столику рамы.
   Рама связывает опоры в одно целое: опора может подняться или просесть, а стойки не разъедутся
   (связь опор балками — п. 8.2.9 пособия Минстроя «Проектирование оснований фундаментов на пучинистых грунтах», 2019).
   Рама лежит на плите через стальные подкладки: уровень — подкладками, после пучения — домкрат и подкладка. Опоры:
   slab — бетонная плита на щебне; gas — блоки рядом над землёй (блок обязан оставаться сухим: СТО НААГ 3.1-2013, п. 6.1.2–6.1.3).
   От ветра держит anchor — винтовой анкер (несущая способность — СП 24.13330, п. 7.2.10), или weight — вес плит, стянутых со своей опорой. */
const SOILS={  // α, c, γc — СП 24.13330, табл. 7.9, 7.10; R и εfh — оценка для верхнего слоя; hl — горизонталь на один анкер, кН/1000
 sand:{t:'Песок, супесь',s:'песок',a1:29.5,a2:16.5,c:1,gc:0.6,R:150,eps:0.008,hl:500},
 loam:{t:'Суглинок плотный',s:'суглинок',a1:10.1,a2:4.5,c:18,gc:0.7,R:120,eps:0.03,hl:1000},
 clay:{t:'Глина, мокрый участок',s:'глина',a1:7.8,a2:2.8,c:10,gc:0.7,R:80,eps:0.075,hl:700}};
const FNDS={pillar:{t:'Столбы',sub:'бетон на 1,2 м, ниже промерзания'},slab:{t:'Плиты',sub:'рама на плитах по щебню, без бетона и ям'},gas:{t:'Газоблоки',sub:'рама на столбиках из блоков над землёй; от ветра блок не держит — сваи всё равно нужны, поэтому дороже плит'}};
const HOLDS={anchor:{t:'Сваи-анкеры',sub:'ВСК 57, вкручиваются в грунт'},weight:{t:'Пригруз',sub:'ничего в грунт: вес плит на раме'}};
const BLK={L:600,W:300,H:200};  // блок D600 B3,5; блоки кладут рядом, а не стопкой: растёт площадь и устойчивость, высота та же
const SLAB={S:500,T:70,kg:40},HELIX={d:200,h:1400,shaft:57,L:1500},MAX_SLABS=6,DF=1400,SU=50;  // DF — глубина промерзания, SU — предельный подъём (табл. Б.1)
const anchorRd=s=>{const S=SOILS[s],A=Math.PI*(HELIX.d**2-HELIX.shaft**2)/4e6,F0=(S.a1*S.c+S.a2*18*HELIX.h/1000)*A;return{F0,Fd:S.gc*F0/1.4*1000};};  // Н
const secDim=s=>s.split('x').map(Number);
const boltTW=(d,b,md,ka,WS)=>{const c=b/10,D=d/10,k=md*WMV;return 2e3*Math.min(0.5*c*D*ka*k*WS.kR,3.1*D*D*Math.sqrt(ka*k*WS.kR));};  // болт с пластинами снаружи, Н: СП 64, табл. 18
// вертикальная раскладка опоры, мм. y = 0 — земля проекта; у газоблоков земля ниже, на y0: вся беседка поднята над ней
function baseLev(cfg){const $=cfg.$||{},FW=cfg.mat==='timber'&&cfg.base==='floor',bS=Math.max($.wPost||100,$.wSill||100),sec=FW?`w${bS}x${bS}`:$.ringSec||'80x40x3',[hR,bR,tR]=FW?[bS,bS,0]:secDim(sec),yT=FW?230:34,yB=yT-hR,yP=FW?yB-2:yB-20,gas=cfg.fnd==='gas',nB=gas?cfg.blocks:0,
  n0=FW?3:1,n=Math.max(n0,$.pads||1),yS=yP-(gas?BLK.H:0),y0=gas?yS-60:FW?yP-n0*SLAB.T:0,hT=hR-40,yTg=yT-3-hT/2;return{FW,sec,hR,bR,tR,yT,yB,yP,gas,nB,n,n0,yS,y0,hT,yTg,js:FW?bS/2+28:60};}  // yP — верх опоры: брус лежит на гидроизоляции, рама — на пластине 8 мм и подкладках 12 мм; n0 — плит минимум: у бруса стопка держит 150 мм над землёй
// разбить линию рамы на куски не длиннее кузова: стык — только над узлом с опорой
function splitLine(a,b,nodes,mx){const out=[];let s=a;const ns=nodes.slice().sort((p,q)=>p-q);
 while(b-s>mx){const c=ns.filter(x=>x+30-s<=mx&&x>s+150);if(!c.length)break;const x=c[c.length-1];out.push([s,x+30,x]);s=x+80;}out.push([s,b,null]);return out;}
function baseKit(X,cfg){
 const {box,push,tube,mod,bolt,ringWeld,weld,tongue}=X,L=baseLev(cfg),S=[],A=[],feet=[];
 const steel=(o)=>box(Object.assign({mat:'steel',cat:'plate6',step:'ring',layer:'frame'},o));
 const plan=(c,u,v,w,h,t,o)=>box(Object.assign({c,ax:u,ay:v,w,h,t},o));
 // столик: на него садятся шпильки стойки; приварен к раме дома
 function table(x,z,u,v,w,h,md,nd){const t=steel({name:`Столик рамы ${w}×${h}×10`,role:'nodePlate',c:[x,L.yT+5,z],ax:u,ay:v,w,h,t:10,module:md});ringWeld([x,L.yT,z],u,v,Math.min(w,L.bR),Math.min(h,L.bR),'Шов столик — рама','ring',md);for(const s of nd.st){s.module=md;}return t;}
 // опора под раму: плита или блоки. Брус лежит прямо на ней через гидроизоляцию и нагель, стальная рама — на подпятнике и подкладках
 function foot(x,z,u,v,md,nd){feet.push(nd);
  if(md&&!L.FW){steel({name:'Подпятник рамы 170×80×8',role:'jackPlate',c:[x,L.yB-4,z],ax:u,ay:v,w:170,h:80,t:8,module:md});
   push({kind:'box',name:'Подкладки стальные 120×80, набор на 12 мм',role:'shim',c:[x,L.yB-14,z],ax:u,ay:v,az:[0,1,0],w:120,h:80,t:12,mat:'galv',layer:'found',step:'ring',cat:'shimSet',module:'loose',seq:-3});}
  if(L.FW){push({kind:'box',name:'Гидроизоляция: рубероид в 2 слоя',role:'dpc',c:[x,L.yP+1,z],ax:u,ay:v,az:[0,1,0],w:L.bR+40,h:320,t:2,mat:'grout',layer:'found',step:'ring',cat:null,module:'loose',seq:-3});
   S.push(push({kind:'stud',d:16,name:'Нагель M16: обвязка к опоре',role:'tieRod',a:[x,L.yP-90,z],b:[x,L.yT-6,z],nuts:[L.yT-28],washers:[],layer:'hw',step:'ring',mat:'galv',cat:'jack'}));}
  if(L.gas)for(let i=0;i<L.nB;i++){const off=L.nB===2?(i?BLK.W/2:-BLK.W/2):0;push({kind:'box',name:`Газоблок ${BLK.L}×${BLK.W}×${BLK.H} D600 B3,5`,role:'gasBlock',c:add([x,L.yS+BLK.H/2,z],mul(v,off)),ax:u,ay:v,az:[0,1,0],w:BLK.L,h:BLK.W,t:BLK.H,mat:'gasblock',layer:'found',step:'found',cat:'gasblock',module:'loose'});}
  const nS=L.gas?0:nd.kind==='post'?L.n:L.n0;for(let i=0;i<nS;i++){const y=L.yS-(i+0.5)*SLAB.T;push({kind:'box',name:`Плита ${SLAB.S}×${SLAB.S}×${SLAB.T}${nS>1?` (стопка, №${i+1})`:''}`,role:'pad',c:[x,y,z],ax:u,ay:v,az:[0,1,0],w:SLAB.S,h:SLAB.S,t:SLAB.T,mat:'concrete',layer:'found',step:'found',cat:'slab',module:'loose'});}
  const tied=cfg.hold==='weight'&&nd.kind==='post'&&nS>L.n0-(L.FW?0:0)&&!L.gas&&nS>1,yEnd=L.yS-nS*SLAB.T;
  if(tied){const yBot=yEnd-8;plan([x,yBot+4,z],u,v,240,120,8,{name:'Нижняя пластина стяжки 240×120×8',role:'jackFoot',mat:'steel',cat:'plate6',step:'found',layer:'found',module:'loose'});
   for(const s of L.FW?[0]:[-60,60]){const q=add([x,0,z],mul(u,s));S.push(push({kind:'stud',d:16,name:'Стяжная шпилька M16 (насквозь через плиты)',role:'tieRod',a:[q[0],yBot-16,q[2]],b:[q[0],L.FW?L.yT-6:L.yB+30,q[2]],nuts:[yBot-16,L.FW?L.yT-28:L.yB],washers:[],layer:'hw',step:'found',mat:'galv',cat:'jack'}));}}
  // щебёночная подушка 200 мм — только под плитой; под трубами рамы узкая траншея с рыхлым щебнем (см. trench)
  plan([x,L.gas?yEnd-130:yEnd-(tied?108:100),z],[1,0,0],[0,0,1],L.gas?800:700,L.gas?800:700,L.gas?260:200,{name:L.gas?'Подушка: щебень 20–40, верх на 60 мм выше земли':'Подушка: щебень 20–40, трамбовка',role:'cushion',mat:'gravel',layer:'found',step:'found',cat:'gravel',module:'loose'});}
 // траншея и обратная засыпка вдоль линии рамы
 function trench(a,b){if(L.gas||L.FW)return;const d=sub(b,a),l=len(d),u=norm(d),v=[-u[2],0,u[0]],c=[(a[0]+b[0])/2,0,(a[2]+b[2])/2];
  const yc=L.yB-150,yt=cfg.base==='floor'?10:30;plan([c[0],(yc+yt)/2,c[2]],u,v,l,300,yt-yc,{name:'Засыпка траншеи рыхлым щебнем: зазор под рамой 150 мм',role:'backfill',mat:'gravel',layer:'found',step:'brace',cat:'gravel',module:'loose'});}
 // анкер: свая ВСК 57 Л200 с приварной крышкой и шпилькой M20. Вкручивается до рамы; промах до ±15 мм выбирает отверстие Ø40 в ушке под шайбой-пластиной
 function anchor(q,u,out,md,i){const y=L.FW?L.yB-6:L.yB+6,top=y-70,yN=L.FW?y+6:y+14;A.push({x:q[0],z:q[2]});
  const r=add(q,mul(out,L.FW?L.js:L.bR/2+35)),m0={layer:'found',step:'ring',seq:-1};
  if(!L.FW){const lg=steel({name:'Ушко анкера 70×100×12',role:'lug',c:add(q,add(mul(out,L.bR/2+35),[0,y,0])),ax:out,ay:u,w:70,h:100,t:12,module:md});lg.holes.push({x:0,y:0,d:40});
   X.box({name:'Шайба-пластина анкера 70×70×8',role:'lug',mat:'steel',cat:'plate6',c:[r[0],y+10,r[2]],ax:out,ay:u,w:70,h:70,t:8,step:'ring',seq:1,module:'loose',layer:'frame'}).holes.push({x:0,y:0,d:22});}
  push(Object.assign({kind:'cyl',name:`Свая винтовая ВСК ${HELIX.shaft} Л${HELIX.d} 1,5 м`,role:'helix',c:[r[0],top-HELIX.L,r[2]],r:HELIX.shaft/2,h:HELIX.L,mat:'galv',cat:null},m0));
  push(Object.assign({kind:'cyl',name:`Лопасть сваи Ø${HELIX.d}`,role:'helix',c:[r[0],top-HELIX.L,r[2]],r:HELIX.d/2,h:6,mat:'galv',cat:null},m0));
  X.box({name:'Крышка сваи 80×80×8',role:'lug',mat:'steel',cat:'plate6',c:[r[0],top+4,r[2]],ax:out,ay:u,w:80,h:80,t:8,step:'ring',seq:-1,module:'loose',layer:'found'});
  return push(Object.assign({kind:'stud',d:20,name:'Шпилька M20 на крышке сваи',role:'anchor',a:[r[0],top+8,r[2]],b:[r[0],yN+30,r[2]],nuts:[yN],washers:[],mat:'galv',cat:'anchor'},m0));}
 return{L,S,A,feet,steel,plan,table,foot,trench,anchor};
}
function buildBaseRect(X,cfg,o){
 const {tube,mod,bolt,tongue,weld}=X,K=baseKit(X,cfg),L=K.L,{XP,ZP,W,D,TR}=o,FN=X.FN,nl=ZP.length-1,$=cfg.$||{},mx=TR.L-150,yC=L.yT-L.hR/2,anc=cfg.hold==='anchor'?($.anc||1):0;
 const pieces=[],tu=(nm,a,b,md,c)=>tube({name:nm,role:'baseBeam',sec:L.sec,a,b,up:[0,1,0],sx:L.bR,sy:L.hR,step:'ring',module:md,caps:c||[true,true],ends:['торец','торец'],layer:'frame',note:'низ трубы — дренаж Ø8 у торцов'});
 // лонжероны — неразрезные по стойкам: при потере опоры стойка повисает на них
 for(const sx of [-1,1]){const x=sx*XP,sp=splitLine(ZP[nl]-30,ZP[0]+30,ZP.slice().reverse().slice(1,-1),mx);
  sp.forEach(([a,b,nz],j)=>{const md=mod(`baseS${sx<0?'L':'R'}${j}`,`Лонжерон рамы: ${sx<0?'лев.':'прав.'}${sp.length>1?` ${j+1}`:''}`),t=tu(`Лонжерон рамы ${L.sec.replace(/x/g,'×')} (${sx<0?'лев.':'прав.'})`,[x,yC,a],[x,yC,b],md,[j===0,nz==null]);pieces.push({x,a,b,md,t});
   if(j>0){const prev=pieces[pieces.length-2],tg=tongue({name:`Язык стыка лонжерона 110×${L.hT}×8`,c:[x,L.yTg,a-25],ax:[0,0,1],ay:[0,1,0],w:110,h:L.hT,t:8,root:[x,L.yTg,a-80],rootAx:[0,1,0],rootLen:L.hT,md:prev.md,step:'ring'});
    bolt({d:12,p:[x-L.bR/2,L.yTg,a+28],dir:[1,0,0],grip:L.bR,thru:[t,tg],step:'ring',joint:'стык лонжерона (язык в пропил)'});}});}
 const onSkid=(x,z)=>pieces.find(p=>Math.abs(p.x-x)<1&&z>=p.a-1&&z<=p.b+1);
 // поперечины — на языках лонжеронов, опускаются сверху между столиками; у входа и под полом на них стоят стойки входа и балки пола
 ZP.forEach((z,i)=>{const x0=-XP+80,x1=XP-80,ns=FN.filter(n=>Math.abs(n.z-z)<1&&Math.abs(Math.abs(n.x)-XP)>1).map(n=>n.x);if(x1-x0>mx&&!ns.length){FN.push({x:0,z,kind:'mid',st:[]});ns.push(0);}
  const sp=splitLine(x0,x1,ns,mx);let prev=null;
  sp.forEach(([a,b,nx],j)=>{const md=mod(`baseC${i}_${j}`,`Поперечина рамы ${i+1}${sp.length>1?`.${j+1}`:''}`),t=tu(`Поперечина рамы ${L.sec.replace(/x/g,'×')} (${i+1})`,[a,yC,z],[b,yC,z],md,[false,nx!=null]);t.note='в торцах — пропил 9 мм снизу под язык 8 мм; низ — дренаж Ø8';
   for(const n of FN)if(Math.abs(n.z-z)<1&&n.x>=a-1&&n.x<=b+1&&Math.abs(Math.abs(n.x)-XP)>1){n.md=md;}
   if(j===0){const s=onSkid(-XP,z),tg=tongue({name:`Язык поперечины 205×${L.hT}×8`,c:[-XP+25+102.5,L.yTg,z],ax:[1,0,0],ay:[0,1,0],w:205,h:L.hT,t:8,root:[-XP+25,L.yTg,z],rootAx:[0,1,0],rootLen:L.hT,md:s.md,step:'ring'});for(const dx of [25,125])bolt({d:12,p:[a+dx,L.yTg,z-L.bR/2],dir:[0,0,1],grip:L.bR,thru:[t,tg],step:'ring',joint:'поперечина рамы — лонжерон (язык в пропил, 2 болта)'});}
   else{const tg=tongue({name:`Язык стыка поперечины 110×${L.hT}×8`,c:[a-25,L.yTg,z],ax:[1,0,0],ay:[0,1,0],w:110,h:L.hT,t:8,root:[a-80,L.yTg,z],rootAx:[0,1,0],rootLen:L.hT,md:prev.md,step:'ring'});bolt({d:12,p:[a+28,L.yTg,z-L.bR/2],dir:[0,0,1],grip:L.bR,thru:[t,tg],step:'ring',joint:'стык поперечины (язык в пропил)'});}
   if(j===sp.length-1){const s=onSkid(XP,z),tg=tongue({name:`Язык поперечины 205×${L.hT}×8`,c:[XP-25-102.5,L.yTg,z],ax:[1,0,0],ay:[0,1,0],w:205,h:L.hT,t:8,root:[XP-25,L.yTg,z],rootAx:[0,1,0],rootLen:L.hT,md:s.md,step:'ring'});for(const dx of [25,125])bolt({d:12,p:[b-dx,L.yTg,z-L.bR/2],dir:[0,0,1],grip:L.bR,thru:[t,tg],step:'ring',joint:'поперечина рамы — лонжерон (язык в пропил, 2 болта)'});}
   prev={md};});
  K.trench([-XP,0,z],[XP,0,z]);});
 for(const sx of [-1,1])K.trench([sx*XP,0,ZP[nl]],[sx*XP,0,ZP[0]]);
 // узлы
 for(const n of FN){const onS=Math.abs(Math.abs(n.x)-XP)<1,md=onS?onSkid(n.x,n.z).md:n.md,u=onS?[1,0,0]:[0,0,1],v=onS?[0,0,1]:[1,0,0];
  if(n.kind!=='mid')K.table(n.x,n.z,[1,0,0],[0,0,1],n.kind==='post'?150:120,150,md,n);
  if(n.kind==='newel'&&!o.isFloor)continue;K.foot(n.x,n.z,u,v,md,n);}
 // анкеры — у стоек; угловые вкручиваются ближе к середине лонжерона
 if(anc)for(const n of FN.filter(q=>q.kind==='post')){const sx=Math.sign(n.x),corner=Math.abs(Math.abs(n.z)-Math.abs(ZP[0]))<1,s0=n.z>0?-1:1;if(anc===1&&!corner)continue;   // 1 — только углы, 2 — у всех стоек, 3 — по два
  for(let i=0;i<(anc===3?2:1);i++){const s=i&&!corner?-s0:s0,off=i&&corner?520:300,z=n.z+s*off;K.anchor([n.x,0,z],[0,0,1],[sx,0,0],onSkid(n.x,z).md,i);}}
 return K;
}
function buildBasePoly(X,cfg,o){
 const {tube,mod,bolt,box,weld}=X,K=baseKit(X,cfg),L=K.L,{N,R,V,tv,rv,PHI,PSI,TR,FRONT}=o,FN=X.FN,side=2*R*Math.sin(Math.PI/N),yC=L.yT-L.hR/2,$=cfg.$||{},anc=cfg.hold==='anchor'?($.anc||1):0;
 // кольцо из дуг: сторона за стороной, стык на фланце в середине стороны. Дуга — самая длинная, что ложится в кузов
 const arcFits=m=>{const pts=[];const s0=0;for(let i=0;i<=m;i++)pts.push(V(s0+i));const mid=(a,b)=>[(a[0]+b[0])/2,0,(a[2]+b[2])/2];pts.push(mid(V(-1),V(0)),mid(V(m),V(m+1)));
  let best=1e12,bw=0;for(let a=0;a<180;a+=5){const c=Math.cos(a*RAD),s=Math.sin(a*RAD),u=pts.map(p=>p[0]*c+p[2]*s),w=pts.map(p=>-p[0]*s+p[2]*c),l=Math.max(...u)-Math.min(...u),t=Math.max(...w)-Math.min(...w);if(l<=TR.L-140&&t<=TR.W-120&&l<best){best=l;bw=t;}}return best<1e12;};
 let m=1;for(const q of N===6?[3,2]:[4,2])if(arcFits(q)){m=q;break;}
 const nA=Math.round(N/m),jAt=[...Array(nA)].map((_,i)=>(i*m)%N);   // стороны со стыком: у входа стыка нет, если это возможно
 const shift=jAt.includes(FRONT)&&m>1?1:0,J=jAt.map(j=>(j+shift)%N);
 const cutV=k=>({n:tv(PHI(k)),p:V(k,yC)}),mids={};
 const secP=L.sec,MD=[];
 for(let a=0;a<nA;a++){const j0=J[a],md=mod(`baseA${a}`,`Дуга рамы ${a+1}`);MD.push(md);
  for(let i=0;i<=m;i++){const j=(j0+i)%N,A=V(j,yC),B=V(j+1,yC),c=tv(PSI(j)),first=i===0,last=i===m,Mid=add(mul(add(A,B),0.5),[0,0,0]);
   const pa=first?Mid:add(A,mul(c,-60)),pb=last?Mid:add(B,mul(c,60));
   const t=tube({name:`Дуга рамы ${secP.replace(/x/g,'×')}`,role:'baseBeam',sec:secP,a:first?add(Mid,mul(c,8)):pa,b:last?add(Mid,mul(c,-8)):pb,up:[0,1,0],sx:L.bR,sy:L.hR,cutA:first?null:cutV(j),cutB:last?null:cutV(j+1),step:'ring',module:md,ends:['торец','торец'],layer:'frame',note:'углы — рез по биссектрисе, шов по контуру; низ — дренаж Ø8'});
   if(first||last){const f=box({name:'Фланец рамы 110×170×8',role:'flange',c:add(Mid,add(mul(c,first?4:-4),[0,L.yT-85-yC,0])),ax:rv(PSI(j)),ay:[0,1,0],w:110,h:170,t:8,mat:'steel',cat:'plate6',step:'ring',module:md,layer:'frame'});mids[`${j}${first?'a':'b'}`]=f;}
   if(!last)FN.filter(n=>Math.hypot(n.x-B[0],n.z-B[2])<1).forEach(n=>{n.md=md;});}}
 for(const j of J){const a=mids[`${j}a`],b=mids[`${j}b`];if(a&&b)for(const s of [-42,42])for(const y of [L.yT-30,L.yB-34]){const c=tv(PSI(j)),A=V(j),B=V(j+1),Mid=mul(add(A,B),0.5),n=rv(PSI(j)),q=add(add(Mid,mul(n,s)),add(mul(c,-8),[0,y,0]));bolt({d:12,p:q,dir:c,grip:16,thru:[a,b],step:'ring',joint:'стык рамы: фланец (болты 8.8)'});}}
 for(let j=0;j<N;j++)K.trench(V(j),V(j+1));
 for(const n of FN){if(n.kind==='post'){const f=n.a,r=rv(f),t=tv(f),md=n.md||MD[0];K.table(n.x,n.z,r,t,150,150,md,n);K.foot(n.x,n.z,r,t,md,n);}else{K.foot(n.x,n.z,[1,0,0],[0,0,1],null,n);K.steel({name:'Пята опоры пола 120×120×6',role:'jackFoot',c:[n.x,L.yP+3,n.z],ax:[1,0,0],ay:[0,0,1],w:120,h:120,t:6,module:'loose',layer:'found'});for(const s of n.st){s.a[1]=L.yP+6;s.name='Шпилька M12 опоры пола, приварена к пяте';s.module='loose';}}}
 if(anc)for(let k=0;k<N;k++){if(anc===1&&k%2)continue;const c=tv(PSI(k)),nO=rv(PSI(k)),A=V(k),B=V(k+1);for(let i=0;i<(anc===3?2:1);i++){const off=i?side-300:300,q=add(A,mul(c,off)),nd=FN.find(n=>Math.hypot(n.x-(i?B:A)[0],n.z-(i?B:A)[2])<1);K.anchor(q,c,nO,nd.md||MD[0],i);}}
 return K;
}
// ступени: нужны, если пол поднят над землёй на газоблоках. Рама из двух косоуров висит на передней балке пола, низ — на плитах
function stairs(X,cfg,o){
 const {tube,box,bolt,mod,push,weld}=X,DK=DECKS[cfg.deck],{zf,F,y0,beam,FW}=o,kit=FW?woodKit(X,cfg):null,T=FW?kit.tmb:tube,tot=F-y0,n=Math.ceil(tot/200),h=tot/n,r=280,sw=320,yF=y0+SLAB.T,md=mod('stair','Ступени'),yl=z=>160-(z-zf)*h/r,zAt=y=>zf+(160-y)*r/h,zb=zAt(yF),dir=norm([0,yF-160,zb-zf]);
 const st=[-1,1].map(s=>{const x=s*sw,t=T({name:FW?'Косоур из бруса 50×100':'Косоур 60×40',role:'stringer',sec:FW?'w50x100':'60x40x2',a:[x,160-dir[1]*80,zf-dir[2]*80],b:[x,yF+dir[1]*-80,zb+dir[2]*80],up:[0,1,0],sx:FW?50:40,sy:FW?100:60,cutA:{n:[0,0,1],p:[0,0,zf+6]},cutB:{n:[0,1,0],p:[0,yF+6,0]},step:'deck',module:md,ends:['верх','низ'],layer:'floor'});
  const pl=box({name:'Фланец косоура 100×70×6',role:'flange',c:[x,160,zf+3],ax:[1,0,0],ay:[0,1,0],w:100,h:70,t:6,mat:'steel',cat:'plate6',step:'deck',module:md,layer:'floor'});
  box({name:'Пята косоура 100×100×6',role:'jackFoot',c:[x,yF+3,zb],ax:[1,0,0],ay:[0,0,1],w:100,h:100,t:6,mat:'steel',cat:'plate6',step:'deck',module:md,layer:'floor'});
  push({kind:'box',name:`Плита ${SLAB.S}×${SLAB.S}×${SLAB.T} под косоур`,role:'pad',c:[x,y0+SLAB.T/2,zb],ax:[1,0,0],ay:[0,0,1],az:[0,1,0],w:SLAB.S,h:SLAB.S,t:SLAB.T,mat:'concrete',layer:'found',step:'found',cat:'slab',module:'loose'});
  if(FW)X.C.sc8+=2;else for(const dx of [-30,30])if(beam)bolt({d:8,p:[x+dx,160,zf-40],dir:[0,0,1],grip:46,thru:[beam,pl],step:'deck',joint:'косоур — балка пола (фланец)'});return t;});
 const pcs=[],ih=FW?sw-25:sw-20;for(let k=1;k<n;k++){const y=F-k*h,yc=y-48,z=zAt(yc);T({name:FW?'Поперечина ступени 50×50':'Поперечина ступени 40×40',role:'stairCleat',sec:FW?'w50x50':'40x40x2',a:[-ih,yc-(FW?5:0),z],b:[ih,yc-(FW?5:0),z],up:[0,1,0],sx:FW?50:40,sy:FW?50:40,step:'deck',module:md,ends:['торец','торец'],layer:'floor'});
  for(const dz of [-72.5,72.5]){const L=FW?2*ih-2:2*sw+120;push({kind:'box',name:`Доска ступени 28×140×${L}`,role:'tread',c:[0,y-14,z+dz],ax:[1,0,0],ay:[0,0,1],az:[0,1,0],w:L,h:140,t:28,mat:DK.mat,layer:'floor',step:'deck',cat:DK.cat,module:'loose',tint:0.3});pcs.push(L);X.C.selfDrill+=4;}}
 return{pcs,run:zb-zf};
}

/* ---------- расчёт основания без фундамента ---------- */
function verifyBase(c){
 const {m,row,kN,kNm,MPa,mm,pct,G,Wup,S,gR,plan,nPost,Hx,Hz,Fx,Fz,yFill,yRoof,yPost}=c,B=m.base,cfg=m.cfg,N_=m.poly||0,So=SOILS[cfg.soil],GR='Основание',ms=B.posts;
 const yp=B.yPivot,MH=f=>1.4*(f.s*(yFill-yp)+f.r*(yRoof-yp)+f.p*(yPost-yp));
 const dirs=N_?[[Math.cos(m.psi0),Math.sin(m.psi0),Fx,Hx],[Math.cos(m.psi0+Math.PI/N_),Math.sin(m.psi0+Math.PI/N_),Fx,Hx]]:[[1,0,Fx,Hx],[0,1,Fz,Hz]];
 const eRoof=N_?m.R/2:Math.max(m.W,m.D)/4,Wd=1.4*Wup,mK=B.kg*9.81,mT=B.tied?mK:0,An=B.anchors,nA=An.length,Rd=nA?anchorRd(cfg.soil).Fd:0;
 let wst={u:0},tmax=0,nd1=0;
 for(const [dx,dz,F,H] of dirs){const pr=ms.map(n=>n.x*dx+n.z*dz),p=Math.max(...pr),l=pr.map(v=>p-v),Mdest=MH(F)+Wd*(p+eRoof),Mst0=0.9*G*p+0.9*mT*l.reduce((s,v)=>s+v,0),la=An.map(a=>Math.max(0,p-(a.x*dx+a.z*dz))),Sl2=la.reduce((s,v)=>s+v*v,0),
   Tm=nA?Math.max(0,Mdest-Mst0)*Math.max(...la)/Sl2:0,Manc=Rd*la.reduce((s,v)=>s+v,0),Mst=Mst0+Manc,u=Mdest/Math.max(1,Mst);tmax=Math.max(tmax,Tm);nd1=Math.max(nd1,(Mdest-0.9*G*p)/(0.9*9.81*l.reduce((s,v)=>s+v,0)));if(u>wst.u)wst={u,Mdest,Mst,Mst0,p};}
 const Gt=G+mT*ms.length,V=Wd-0.9*Gt,fixA=nA&&B.anc<3?{anc:B.anc+1}:null,fixW=!nA&&B.n<MAX_SLABS?{pads:B.n+1}:null,fix=fixA||fixW||(nA&&c.morePortals?c.morePortals():null);
 row(GR,`Опрокидывание ветром: момент ${kNm(wst.Mdest)} из ${kNm(wst.Mst)}`,wst.u,nA?`вес ${pct(wst.Mst0/Math.max(1,wst.Mst))}, анкеры — остальное`:`держит только вес ${Math.round((Gt)/9.81)} кг`,'ветер γ = 1,4, вес γ = 0,9 (СП 20.13330); подъём кровли приложен со смещением к наветренной стороне',fix);
 const VR=nA*Rd+0.9*Gt;row(GR,`Отрыв ветром: подъём ${kN(Wd)}`,Wd/VR,`вес ${kN(0.9*Gt)}${nA?` + анкеры ${kN(nA*Rd)}`:''}`,'подъём кровли без стен: EN 1991-1-4, навесы',fix);
 const Hm=Math.max(Hx,Hz),Nfr=Math.max(0,0.9*Gt-Wd),Fr=0.35*Nfr,Fa=nA*So.hl;
 row(GR,`Сдвиг ветром: ${kN(Hm)}`,Math.min(9.99,Hm/Math.max(1,Fr+Fa)),`трение ${kN(Fr)}${nA?` + анкеры ${kN(Fa)}`:''}`,'трение сталь — бетон 0,35; когда ветер почти поднял беседку, трения нет — держат штоки анкеров',fix);
 if(nA){const A=anchorRd(cfg.soil);row(GR,`Свая ВСК ${HELIX.shaft} Л${HELIX.d}, лопасть глубже ${HELIX.h} мм: вырыв ${kN(tmax)} (${So.s})`,tmax/Rd,`допустимо ${kN(Rd)} на анкер, всего анкеров ${nA}`,`СП 24.13330, п. 7.2.10: Fd = γc·(α1·c + α2·γ·h)·A, γk = 1,4`,fixA);
  const Tu=A.F0*1000;if(B.FW){const Rb=2*boltTW(12,B.bS,WMW,0.85,WOODS[cfg.wood]);row(GR,'Кронштейн анкера: 2 болта M12 через обвязку',Tu/Rb,`${kN(Tu)} из ${kN(Rb)}`,'анкер должен сдаться раньше узла: зимой он работает как предохранитель от пучения');}else{const Mu=Tu*35,Wl=100*12*12/6;row(GR,'Ушко анкера 12 мм: выдерживает вырыв анкера из грунта',Mu/Wl/RY,`${kN(Tu)} → σ ${Math.round(Mu/Wl)} МПа`,'анкер должен сдаться раньше ушка: зимой он работает как предохранитель от пучения');}}
 else{const nn=ms.length,need=Math.max(0,nd1*nn,(Wd/0.9-G)/9.81,(Hm/0.35+Wd)/0.9/9.81-G/9.81),has=B.kg*nn;row(GR,`Пригруз: нужно ${Math.round(need)} кг`,need/Math.max(1,has),`на опорах стянуто ${Math.round(has)} кг: ${B.n} ${plural_(B.n,'плита','плиты','плит')} на стойку`,`плиты стянуты шпилькой с рамой и поднимаются только вместе с ней. Больше ${MAX_SLABS} на опору не кладём: нужны анкеры`,fixW);}
 // опоры
 const Nser=((S+gR)*plan*1000+G+(m.isFloor?(2.0*0.9+0.35)*footArea(cfg)*1000:0))/nPost*(N_?1.1:1.3),Nd=Nser*1.3,Ap=B.padA,p1=Nser/Ap/1000,b2=Math.sqrt(Ap)+2*0.2*0.58,p2=(Nser+B.kg*9.81)/(b2*b2)/1000;
 row(GR,`Давление на щебень под ${B.gas?'блоками':'плитой'}`,p1/250,`${Math.round(p1)} кПа из 250`,'щебень 20–40 с послойной трамбовкой');
 row(GR,`Давление на грунт под подушкой (${So.s})`,p2/So.R,`${Math.round(p2)} кПа из ${So.R}`,'щебень 200 мм разносит нагрузку под углом 30°; R верхнего слоя — оценка, у насыпного грунта и торфа меньше');
 if(!B.gas){const ov=(SLAB.S-(B.FW?150:170))/2,qp=Nd/Ap/1e6,Ms=qp*ov*ov/2,nS=B.FW?Math.max(3,B.n):B.n,Ws=nS*SLAB.T*SLAB.T/6,u=Ms/Ws/2;row(GR,`Плита ${SLAB.S}×${SLAB.T}: изгиб под опорой`,u,`σ ${(Ms/Ws).toFixed(1).replace('.',',')} из 2,0 МПа`,'плита — консоль от подпятника; 2 МПа на растяжение при изгибе — оценка для вибропрессованной плиты',B.n<MAX_SLABS?{pads:B.n+1}:null);}
 if(B.FW){const A=B.bS*(B.gas?BLK.W:SLAB.S),Rc=2.7*WOODS[cfg.wood].kR*0.66*WMV,sg=Nd/A;row(GR,`Обвязка на опоре: смятие поперёк волокон`,sg/Rc,`${sg.toFixed(2).replace('.',',')} из ${Rc.toFixed(2).replace('.',',')} МПа`,'СП 64: смятие поперёк волокон на большой площадке');}
 // рама: стойка повисла на соседних узлах (опора просела или вмёрзла и ушла вверх). Особое сочетание: вес + половина снега, γ = 1
 if(B.FW){const P=(G+0.5*S*plan*1000)/nPost*(N_?1.1:0.85),Lc=N_?m.side/2:m.sP,Ww=B.bS**3/6,Rw=WOODS[cfg.wood].RA*WOODS[cfg.wood].kR*WMW*WMV,Mc=P*Lc,u=Mc/Ww/Rw;row(GR,`Обвязка ${B.bS}×${B.bS}: опора ушла, стойка ${kN(P)} на вылете ${mm(Lc)}`,u,`M ${kNm(Mc)} · σ ${MPa(Mc/Ww)} из ${MPa(Rw)}`,'расчёт не зависит от величины пучения: обвязка выдерживает полное исчезновение одной опоры',B.bS<150?{wSill:150}:c.morePortals?c.morePortals():null);}
 else{const P=(G+0.5*S*plan*1000)/nPost*(N_?1.1:0.85),Lc=N_?m.side/2:m.sP,ss=secOf(B.sec),Mc=P*Lc,fl=P*Lc**3/(3*EST*ss.Ix),u=Mc/ss.Wx/RY;row(GR,`Рама ${B.sec.replace(/x/g,'×')}: опора ушла, стойка ${kN(P)} на вылете ${mm(Lc)}`,u,`M ${kNm(Mc)}, прогиб ${mm(fl)}`,N_?'расчёт не зависит от величины пучения: рама выдерживает полное исчезновение одной опоры':'угловая стойка на вылете или средняя на двойном пролёте: момент одинаков, у средней грузовая площадь вдвое больше. Расчёт не зависит от величины пучения',B.sec==='80x40x3'?{ringSec:'100x50x3'}:B.sec==='100x50x3'?{ringSec:'120x60x3'}:B.sec==='120x60x3'?{ringSec:'120x60x4'}:(c.morePortals&&c.morePortals())||(B.sec==='120x60x4'?{ringSec:'120x80x4'}:null));}
 if(N_&&!B.FW){const P=(G+0.5*S*plan*1000)/nPost*1.1,Mj=P*m.side/4,T=Mj/104/2;row(GR,`Фланец рамы: 4 болта M12 класса 8.8, M ${kNm(Mj)}`,T/34000,kN(T)+' на болт','стык в середине стороны; при потере соседней опоры — половина момента');}
 if(!N_&&!B.FW){const Mb=c.Mbase||0,Fb=Mb/100;row(GR,`Стык поперечины: 2 болта M12, момент базы стойки ${kNm(Mb)}`,Fb/28000,kN(Fb)+' на болт','смятие двух стенок 3 мм ≈ 28 кН; стык держит раму от поворота, поэтому база стойки работает как на столбе');}
 const dc=(B.gas?200:400+(B.n-1)*50),hfp=So.eps*Math.max(0,DF-dc);
 row(GR,`Подъём пучением: ${mm(hfp)} из ${SU} (${So.s})`,hfp/SU,`εfh ${String(So.eps).replace('.',',')} × ${dc?((DF-dc)/1000).toFixed(1).replace('.',','):'—'} м промерзающего слоя`,`предел 5 см — табл. Б.1 пособия Минстроя; глубина промерзания 1,4 м; при глубине больше 1,7 м незаглублённые опоры не применяют (п. 8.2.2)`);
 if(B.gas){const R=1.35*0.8,nB=B.nB,Ab=BLK.L*BLK.W*nB,sb=Nd/Ab,sl=Nd/(240*240),hs=BLK.H,bb=BLK.W*nB,Ng=Math.max(1,0.9*Gt+nA*Rd*0.5),Mr=Ng*bb/2,Ms=Hm*hs;
  row(GR,`Газоблок: сжатие ${(sb).toFixed(2).replace('.',',')} МПа`,sb/R,`из ${R.toFixed(2).replace('.',',')} МПа`,'СТО НААГ 3.1-2013, табл. 9.1: B3,5 на клею 1,5 МПа, ×0,9 за ряд 200 мм, ×0,8 — запас на влажность');
  row(GR,`Газоблок: смятие под пятой 240×240`,sl/(R*1.2),`${sl.toFixed(2).replace('.',',')} МПа из ${(R*1.2).toFixed(2).replace('.',',')}`,'местное сжатие: на 20% выше расчётного');
  row(GR,`Опора из ${nB===2?'2 блоков рядом':'1 блока'}: завал по узкой стороне ${bb} мм`,Ms/Math.max(1,Mr),`момент ${kNm(Ms)} из ${kNm(Mr)}`,'опора стоит свободно: блоки рядом вдвое шире, чем один');}
}
const plural_=(n,a,b,c)=>{const q=Math.abs(n)%100,w=q%10;return q>10&&q<20?c:w===1?a:w>=2&&w<=4?b:c;};
function baseInfo(K,X,cfg){const L=K.L,$=cfg.$||{},posts=X.FN.filter(n=>n.kind==='post').map(n=>({x:n.x,z:n.z})),hasRod=cfg.hold==='weight'&&L.n>1&&!L.gas,gkg=L.n*SLAB.kg+(hasRod?7:0);
 return{sec:L.sec,hold:cfg.hold,gas:L.gas,nB:L.nB,n:L.n,yS:L.yS,yEnd:L.yS-L.n*SLAB.T,yTr:L.yB-150,yP:L.yP,anc:cfg.hold==='anchor'?($.anc||1):0,anchors:K.A,posts,kg:hasRod?gkg:0,tied:hasRod,yPivot:L.gas?L.yS:hasRod?L.yS-L.n*SLAB.T:L.yP,FW:L.FW,bS:L.bR,n0:L.n0,padA:L.gas?BLK.L*BLK.W*L.nB/1e6:(SLAB.S/1000)**2,nFoot:K.feet.length};}

/* ---------- нижняя обвязка из бруса (вариант «Брус» с полом) ----------
   Весь каркас деревянный: обвязка и балки пола в одной плоскости, лаги заподлицо, настил сверху, стойки стоят на обвязке.
   Обвязка лежит прямо на опоре через гидроизоляцию, как и положено брусу: на столбе, стопке плит или блоках, низ на 150 мм выше земли.
   Соединения — те же коннекторы для бруса, что и наверху: Т-образные и угловые на обвязке, торцевые под лаги. */
const cutsAt=(a,b,ns,mx)=>{const out=[];let s=a;const q=ns.slice().sort((p,r)=>p-r);while(b-s>mx){const c=q.filter(x=>x-s<=mx&&x>s+300);if(!c.length)break;const x=c[c.length-1];out.push([s,x]);s=x;}out.push([s,b]);return out;};
// кронштейн анкера: лоток под брусом с двумя щеками, 2 болта насквозь. c — точка на оси бруса, u — вдоль него, v — поперёк
function shoeKit(X,L){const {box,bolt}=X,bS=L.bR;
 return(c,u,v,from,to,at)=>{const md='loose',len=to-from,cc=add(c,mul(u,(from+to)/2)),w=2*L.js+50,h=70,m0=(X.grpN=(X.grpN||0)+1,{name:'Кронштейн сваи',grp:X.grpN,size:`${len}×${w}×${h} мм`,why:'Цепляет обвязку к винтовой свае: лоток под брусом, щёки по бокам, 2 болта насквозь. Держит беседку от отрыва ветром.',mat:'steel',cat:'plate6',step:'ring',module:md,layer:'frame',seq:1,role:'shoe'});
  box(Object.assign({},m0,{c:[cc[0],L.yB-3,cc[2]],ax:u,ay:v,w:len,h:w,t:6,mount:[0,-1,0],mountLen:60}));
  const ears=[-1,1].map(s=>box(Object.assign({},m0,{c:add(add(cc,mul(v,s*(bS/2+4))),[0,L.yB+h/2,0]),ax:u,ay:[0,1,0],w:len,h,t:6,mount:[0,-1,0],mountLen:60})));
  for(const [q,b] of at)bolt({d:12,p:add(add(c,mul(u,q)),add(mul(v,-(bS/2+7)),[0,L.yB+35,0])),dir:v,grip:bS+14,thru:[b,...ears],step:'ring',joint:'кронштейн сваи — обвязка'});};}
// опора бруса раскрытая (OBR 50×100): U-образная, с полками по грани балки. c — центр торца на грани, dir — вдоль лаги от грани
function hangBeam(X,c,dir,b,h,beam,step,o={}){const n=[dir[2],0,-dir[0]],len=90,hc=h-20,nm=`Опора бруса раскрытая ${b}×${h}`,m0=(X.grpN=(X.grpN||0)+1,{name:nm,role:'wHanger',mat:'steel',step,module:'loose',layer:o.layer||'frame',mount:dir,mountLen:40,seq:-1,grp:X.grpN,size:`${len}×${b+4}×${h} мм`,why:'Держит конец лаги на балке: лагу опускают в лоток, с двух сторон саморезы.'});
 X.box(Object.assign({},m0,{cat:'connJ',c:add(add(c,mul(dir,len/2)),[0,-h/2-1,0]),ax:dir,ay:n,w:len,h:b+4,t:2}));
 for(const s of [-1,1])X.box(Object.assign({},m0,{cat:null,c:add(add(c,mul(dir,len/2)),mul(n,s*(b/2+1))),ax:dir,ay:[0,1,0],w:len,h:hc,t:2}));
 for(const s of [-1,1])X.box(Object.assign({},m0,{cat:null,c:add(add(c,mul(dir,1)),mul(n,s*(b/2+22))),ax:n,ay:[0,1,0],w:40,h:hc,t:2}));
 for(const s of [-1,1])for(const dy of [-hc/3,hc/3])for(const q of [28,62])X.screws.push({type:'jc',p:add(add(add(c,mul(dir,q)),[0,dy,0]),mul(n,s*(b/2+2.6))),n:mul(n,s),st:step});
 X.C.conn5+=12;}
function hangJoist(X,x,zb,dz,s=1){const w=-dz*s;X.C.conn5+=4;X.angle({name:'Опора лаги: уголок 40×40×40×2',role:'cleatJoist',mount:[0,0,dz],mountLen:40,o:[x+s*25,w>0?162:198,zb],u:[s,0,0],v:[0,0,dz],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});X.C.clip+=4;}
function woodFloorRect(X,cfg,o){
 const {XP,ZP,TR,bP,supX,FY,pillar}=o,{tmb,socket}=woodKit(X,cfg),L=baseLev(cfg),bS=L.bR,sec=L.sec,yc=230-bS/2,nl=ZP.length-1,mx=TR.L-60,K=X.fnd?baseKit(X,cfg):null,shoe=shoeKit(X,L),anc=X.fnd&&cfg.hold==='anchor'?((cfg.$||{}).anc||1):0;
 ZP.forEach(z=>supX.forEach(x=>pillar(x,z,{name:'Столбик под балку пола Ø200',fw:1,y0:FY,top:228-bS,studs:[[x,z,224,[-205,206],[[-195,3],[203,3]]]]})));
 const G=(c,u,n,L0,o2={})=>socket(Object.assign({c,u,v:[0,1,0],n,b:bS,h:bS,L:L0,open:true,step:'ring',seq:-1},o2));
 // обвязка вдоль — неразрезная по стойкам; длиннее кузова режется над опорой, стык в сквозном коннекторе
 const SL={};for(const sx of [-1,1]){const x=sx*XP;SL[sx]=cutsAt(ZP[nl]-bS/2,ZP[0]+bS/2,ZP.slice(1,-1),mx).map(([a,b])=>({a,b,t:tmb({name:`Обвязка ${bS}×${bS} (${sx<0?'лев.':'прав.'})`,role:'sill',sec,a:[x,yc,a],b:[x,yc,b],up:[0,1,0],step:'ring',ends:['торец','торец'],note:'торцы — состав для торцов; низ на 150 мм выше земли'})}));
  SL[sx].forEach((p,q)=>{if(q)G([x,yc,p.a],[0,0,1],[1,0,0],300,{name:`Коннектор сквозной ${bS}×${bS}`,cat:'connS'});});}
 const pcZ=(sx,z)=>SL[sx].find(p=>z>=p.a-1&&z<=p.b+1).t;
 ZP.forEach((z,i)=>{const xa=-XP+bS/2,xb=XP-bS/2,end=i===0?1:i===nl?-1:0,ns=supX.filter(()=>xb-xa>mx),pcs=cutsAt(xa,xb,ns,mx).map(([a,b])=>({a,b,t:tmb({name:`Балка пола ${bS}×${bS} (${i+1})`,role:'sillX',sec,a:[a,yc,z],b:[b,yc,z],up:[0,1,0],step:'ring',ends:['торец','торец']})}));
  pcs.forEach((p,q)=>{if(q)G([p.a,yc,z],[1,0,0],[0,0,1],300,{name:`Коннектор сквозной ${bS}×${bS}`,cat:'connS'});});
  for(const s of [-1,1]){G([s*(XP-bS/2-65),yc,z],[1,0,0],[0,0,1],130,{name:`Коннектор ${end?'угловой':'Т-образный'} ${bS}×${bS}`,cat:end?'conn3':'conn4'});G([s*XP,yc,z-end*40],[0,0,1],[1,0,0],end?bS+80:bS+120);}});
 // лаги заподлицо с балками
 const S=2*(XP-bS/2),nJ=Math.max(1,Math.ceil(S/(cfg.deck==='wpc'?400:500))-1),xs=[...Array(nJ)].map((_,j)=>-S/2+(j+1)*S/(nJ+1));
 for(let i=0;i<nl;i++){const z0=ZP[i+1]+bS/2+1,z1=ZP[i]-bS/2-1;for(const x of xs){tmb({name:'Лага 50×100',role:'joist',sec:'w50x100',a:[x,180,z0],b:[x,180,z1],up:[0,1,0],step:'bottom',layer:'floor',ends:['зад','перед']});hangBeam(X,[x,180,z0-1],[0,0,1],50,100,null,'bottom',{layer:'floor'});hangBeam(X,[x,180,z1+1],[0,0,-1],50,100,null,'bottom',{layer:'floor'});}}
 // опоры
 if(K)for(const n of X.FN){const onS=Math.abs(Math.abs(n.x)-XP)<1;K.foot(n.x,n.z,onS?[1,0,0]:[0,0,1],onS?[0,0,1]:[1,0,0],'loose',n);}
 if(anc)for(const n of X.FN.filter(q=>q.kind==='post')){const sx=Math.sign(n.x),corner=Math.abs(Math.abs(n.z)-Math.abs(ZP[0]))<1,s0=n.z>0?-1:1;if(anc===1&&!corner)continue;
  for(let i=0;i<(anc===3?2:1);i++){const s=i&&!corner?-s0:s0,off=i&&corner?540:320,z=n.z+s*off;shoe([n.x,0,z],[0,0,1],[1,0,0],-100,100,[[-45,pcZ(sx,z-45)],[45,pcZ(sx,z+45)]]);K.anchor([n.x,0,z],[0,0,1],[sx,0,0],'loose',i);}}
 return{JX:[-XP,...xs,XP],span:Math.max(...supX.map((x,i)=>(i?x-supX[i-1]:x+XP)),XP-(supX.length?supX[supX.length-1]:-XP)),K};}
function woodFloorPoly(X,cfg,o){
 const {N,R,a,V,rv,tv,PHI,PSI,TR,bP,FY,pillar,xSpan}=o,{tmb,socket}=woodKit(X,cfg),L=baseLev(cfg),bS=L.bR,sec=L.sec,yc=230-bS/2,mx=TR.L-60,ap=a-bS/2-1,K=X.fnd?baseKit(X,cfg):null,shoe=shoeKit(X,L),anc=X.fnd&&cfg.hold==='anchor'?((cfg.$||{}).anc||1):0,side=2*R*Math.sin(Math.PI/N);
 const SD={};for(let j=0;j<N;j++){const A=V(j,yc),B=V(j+1,yc),c=tv(PSI(j)),e=bS*Math.tan(Math.PI/N)/2+30;SD[j]=tmb({name:`Обвязка ${bS}×${bS} (сторона ${j+1})`,role:'sill',sec,a:add(A,mul(c,-e)),b:add(B,mul(c,e)),up:[0,1,0],cutA:{n:tv(PHI(j)),p:A},cutB:{n:tv(PHI(j+1)),p:B},step:'ring',ends:['торец','торец'],note:'торцы — рез по биссектрисе; низ на 150 мм выше земли'});}
 // угол обвязки: коннектор с двумя гнёздами под углом многоугольника, под заказ
 const G=(c,u,n,L0,o2={})=>socket(Object.assign({c,u,v:[0,1,0],n,b:bS,h:bS,L:L0,open:true,step:'ring',seq:-1},o2));
 for(let k=0;k<N;k++)[[tv(PSI(k)),rv(PSI(k))],[mul(tv(PSI(k-1)),-1),rv(PSI(k-1))]].forEach(([c,nO],q)=>G(add(V(k,yc),mul(c,105)),c,nO,210,q?{}:{name:`Коннектор угла обвязки ${bS}×${bS}`,cat:'connP'}));
 const cutFor=(x,z)=>{let b=null;for(let j=0;j<N;j++){const n=rv(PSI(j)),d=n[0]*x+n[2]*z;if(!b||d>b.d)b={n,d};}return{n:b.n,p:mul(b.n,ap)};};
 // внутренние балки на своих опорах
 const nIn=R>1650?2:1,ZL=[...Array(nIn)].map((_,l)=>-a+(l+1)*2*a/(nIn+1));
 for(const zl of ZL){const s1=xSpan(zl-bS/2,-bS/2-1),s2=xSpan(zl+bS/2,-bS/2-1),x0=Math.max(s1[0],s2[0]),x1=Math.min(s1[1],s2[1]),Lb=x1-x0,np=Math.max(2,Math.ceil((Lb-300)/1300)+1),PX=[...Array(np)].map((_,i)=>x0+200+i*(Lb-400)/(np-1));
  const ns=Lb>mx?PX.slice(1,-1):[],pcs=cutsAt(x0,x1,ns,mx).map(([p0,p1],q,arr)=>({a:p0,b:p1,t:tmb({name:`Балка пола ${bS}×${bS}`,role:'sillX',sec,a:[q?p0:p0-120,yc,zl],b:[q<arr.length-1?p1:p1+120,yc,zl],up:[0,1,0],cutA:q?null:cutFor(p0,zl),cutB:q<arr.length-1?null:cutFor(p1,zl),step:'ring',ends:['торец','торец'],note:'торцы — по грани обвязки, 2 косых самореза'})}));
  pcs.forEach((p,q)=>{if(q)G([p.a,yc,zl],[1,0,0],[0,0,1],300,{name:`Коннектор сквозной ${bS}×${bS}`,cat:'connS'});});
  X.C.sc8+=4;   // концы балки — внатяг в обвязку 2 косыми саморезами, вес несут опоры
  for(const x of PX)pillar(x,zl,{name:'Столбик под балку пола Ø200',fw:1,y0:FY,top:228-bS,studs:[[x,zl,224,[-205,206],[[-195,3],[203,3]]]]});}
 // лаги
 const zIn=x=>{let lo=-1e9,hi=1e9;for(let j=0;j<N;j++){const n=rv(PSI(j));if(Math.abs(n[2])<1e-6){if(n[0]*x>ap)return null;continue;}const zz=(ap-n[0]*x)/n[2];if(n[2]>0)hi=Math.min(hi,zz);else lo=Math.max(lo,zz);}return hi>lo?[lo,hi]:null;};
 const xr=xSpan(0,-bS/2-1),st=cfg.deck==='wpc'?400:480,nj=Math.ceil((xr[1]-xr[0])/st),xs=[...Array(Math.max(0,nj-1))].map((_,i)=>xr[0]+(i+1)*(xr[1]-xr[0])/nj).filter(x=>Math.abs(x)<=R-260).map(x=>{for(let k=0;k<N;k++){const vx=V(k)[0]*ap/a;if(Math.abs(x-vx)<45)return vx+(x<vx?-45:45);}return x;});   // лага не садится на вершину многоугольника
 for(const x of xs){const zs=zIn(x);if(!zs)continue;const br=[zs[0],...ZL.flatMap(z=>[z-bS/2-1,z+bS/2+1]),zs[1]].filter(z=>z>=zs[0]&&z<=zs[1]);
  for(let i=0;i+1<br.length;i+=2){const p0=br[i],p1=br[i+1];if(p1-p0<200)continue;const c0=i===0,c1=i+2>=br.length;
   tmb({name:'Лага 50×100',role:'joist',sec:'w50x100',a:[x,180,c0?p0-90:p0],b:[x,180,c1?p1+90:p1],up:[0,1,0],cutA:c0?cutFor(x,p0):null,cutB:c1?cutFor(x,p1):null,step:'bottom',layer:'floor',ends:['зад','перед']});
   const hang=(end,dz,zp)=>{if(!end){hangBeam(X,[x,180,zp-dz],[0,0,dz],50,100,null,'bottom',{layer:'floor'});return;}const n=cutFor(x,zp).n,g=-n[0]/n[2],s0=dz>0?(g>0?-1:1):(g>0?1:-1),at=s=>{const z1=zIn(x+s*25),z2=zIn(x+s*65);return z1&&z2?(dz>0?Math.max(z1[0],z2[0])+1:Math.min(z1[1],z2[1])-1):null;},free=(s,z)=>z!=null&&!X.screws.some(q=>q.st==='ring'&&Math.abs(q.p[2]-z)<75&&Math.abs(q.p[0]-(x+s*55))<45),s=free(s0,at(s0))||!free(-s0,at(-s0))?s0:-s0,zb=at(s);if(zb==null)return;hangJoist(X,x,zb,dz,s);};   // уголок не садится на головки глухарей гнезда
   hang(c0,1,p0);hang(c1,-1,p1);}}
 // опоры
 if(K)for(const n of X.FN){if(n.kind==='post'){const f=n.a;K.foot(n.x,n.z,rv(f),tv(f),'loose',n);}else K.foot(n.x,n.z,[0,0,1],[1,0,0],'loose',n);}
 if(anc)for(let k=0;k<N;k++){if(anc===1&&k%2)continue;const c=tv(PSI(k)),nO=rv(PSI(k)),A=V(k);for(let i=0;i<(anc===3?2:1);i++){const off=i?side-340:340,q=add(A,mul(c,off));shoe([q[0],0,q[2]],c,nO,-100,100,[[-45,SD[k]],[45,SD[k]]]);K.anchor(q,c,nO,'loose',i);}}
 return{JX:xs,K};}
function newelOnSill(X,TK,o){const {xn,z,top,nst,nmd,name}=o;TK.postBase({x:xn,z,y:230,u:[1,0,0],n:[0,0,1],b:100,step:nst,md:'loose',layer:'rail'});X.C.sc8+=4;
 return TK.tmb({name:`Стойка входа из бруса 100×100 (${name})`,role:'postW',sec:'w100x100',a:[xn,230,z],b:[xn,top,z],up:[0,0,1],step:nst,layer:'rail',ends:['низ','верх'],note:'верхний торец — под срез с уклоном или колпачок'});}
// пол из бруса: лаги, балки, стойки на обвязке
function verifyFloorW(c){const {m,row,kN,MPa,mm,Tu,Nmax,WS}=c,R=WS.RA*WS.kR*0.53*WMV,Rs=WS.RA*WS.kR*WMW*WMV,qL=2.0*1.2+0.35*1.1,bS=m.sillB,sp=m.sP||m.side;
 const js=m.joistStep||480,Lj=m.poly?2*m.apo/(m.R>1650?3:2)-bS:sp-bS,qj=qL*js/1000,Mj=qj*Lj*Lj/8,Wj=50*100*100/6,Ij=50*100**3/12,fj=5*2.35*js/1000*Lj**4/(384*WE*WMV*Ij);
 row('Пол и борта',`Лага 50×100: пролёт ${mm(Lj)}, шаг ${mm(js)} (2 кПа)`,Math.max(Mj/Wj/R,fj/(Lj/250)),`σ ${MPa(Mj/Wj)} из ${MPa(R)}, прогиб ${mm(fj)}`,'лаги заподлицо с балками, на уголках');
 const Lb=m.floorSpan||1300,qb=qL*(sp)/1000,Mb=qb*Lb*Lb/8,Wb=bS**3/6;row('Пол и борта',`Балка пола ${bS}×${bS}: пролёт ${mm(Lb)}`,Mb/Wb/R,`σ ${MPa(Mb/Wb)} из ${MPa(R)}`,'');
 const Ap=(bS+12)*(bS+12),Rc=2.7*WS.kR*0.66*WMV*1.6;row('Узлы',`Обвязка под стойкой: смятие поперёк волокон ${MPa(Nmax/Ap)}`,Nmax/Ap/Rc,`из ${MPa(Rc)}`,'основание коннектора разносит нагрузку на обвязку; при нехватке обвязка толще',bS<150?{wSill:150}:null);
 row('Узлы','Опорный коннектор на обвязке, отрыв: 4 самореза 8×160',Tu/(4*3000),`${kN(Tu)} из ${kN(12000)}`,'конструкционные саморезы в обвязку, расчётно 3 кН на штуку');
 const V=qL*sp/1000*Lb/2;row('Узлы',`Балка пола в гнезде коннектора: ${kN(V)}`,V/6800,'из 6,8 кН','8 глухарей 6×60 по 0,85 кН');}
