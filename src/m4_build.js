/* ---------------- общий набор деталей и узлов (для всех типов) ---------------- */
function mkCtx(cfg){
 const fnd=!!cfg&&cfg.fnd!=='pillar',FN=[];
 const parts=[],screws=[],C={selfDrill:0,clip:0,sc8:0,wood6:0,conn5:0,conn6:0},MODS={};let uid=0;
 const push=p=>{p.id=++uid;p.holes=p.holes||[];if(!p.module)p.module='loose';parts.push(p);return p;};
 const mod=(k,n)=>{MODS[k]=n;return k;};
 /* ---- примитивы ---- */
 function frame(a,b,up){const z=norm(sub(b,a));let y=sub(up,mul(z,dot(up,z)));y=norm(y);return{x:cross(y,z),y,z,L:len(sub(b,a))};}
 function lp(p,pl){const q=sub(pl.p,p.o);return{n:[dot(pl.n,p.ax),dot(pl.n,p.ay),dot(pl.n,p.az)],p:[dot(q,p.ax),dot(q,p.ay),dot(q,p.az)]};}
 function tube(o){
  const f=frame(o.a,o.b,o.up),s=SEC[o.sec];
  const p=push({kind:'tube',round:!!s.round,saddle:o.saddle||null,name:o.name,role:o.role,sec:o.sec,o:o.a,ax:f.x,ay:f.y,az:f.z,L:f.L,sx:o.sx,sy:o.sy,t:s.t,r:s.r,layer:o.layer||'frame',step:o.step,caps:o.caps||[false,false],mat:'steel',cat:s.stock,ends:o.ends||['торец А','торец Б'],module:o.module||'loose',note:o.note||''});
  p.cutA=o.cutA?lp(p,o.cutA):null;p.cutB=o.cutB?lp(p,o.cutB):null;
  const cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[i*p.sx/2,j*p.sy/2]);
  const zA=cs.map(([x,y])=>cutZ(p.cutA,x,y,0)),zB=cs.map(([x,y])=>cutZ(p.cutB,x,y,p.L));
  p.zA0=Math.min(...zA);p.zA1=Math.max(...zA);p.zB0=Math.min(...zB);p.zB1=Math.max(...zB);
  p.cutLen=p.zB1-p.zA0;
  const ang=c=>c?Math.round(Math.acos(Math.min(1,Math.abs(c.n[2])/len(c.n)))/RAD):0;
  p.angA=ang(p.cutA);p.angB=ang(p.cutB);
  return p;
 }
 function angle(o){const w=norm(cross(o.u,o.v));return push({kind:'angle',mount:o.mount,mountLen:o.mountLen,name:o.name,role:o.role,o:o.o,ax:o.u,ay:o.v,az:w,L:o.L,A:o.A||40,B:o.B||40,t:o.t||4,layer:o.layer||'hw',step:o.step,mat:o.mat||'steel',cat:o.cat||'ang40',trim:!!o.trim,tk:o.tk,s0:o.s0,module:o.module||'loose'});}
 function box(o){return push(Object.assign({kind:'box',layer:'hw',mat:'galv',module:'loose'},o,{az:o.az||norm(cross(o.ax,o.ay))}));}
 function hole(part,q,dir,d,bid){
  const rel=sub(q,part.o||part.c);
  if(part.kind==='tube'&&part.round){part.holes.push({s:dot(rel,part.az),face:'R',ang:Math.round(Math.atan2(dot(dir,part.ay),dot(dir,part.ax))/RAD),off:0,d,bolt:bid});return;}
  if(part.kind==='tube'){const s=dot(rel,part.az);
   if(Math.abs(dot(dir,part.ax))>0.85)part.holes.push({s,face:'X',off:dot(rel,part.ay),d,bolt:bid});
   else if(Math.abs(dot(dir,part.ay))>0.85)part.holes.push({s,face:'Y',off:dot(rel,part.ax),d,bolt:bid});}
  else if(part.kind==='box')part.holes.push({x:dot(rel,part.ax),y:dot(rel,part.ay),d,bolt:bid});
 }
 function bolt(o){
  const B=BOLT[o.d];const need=o.grip+2*B.wt+B.nh+2.5;const L=BOLT_STD[o.d].find(x=>x>=need)||Math.ceil(need/10)*10;
  const dir=norm(o.dir);
  const p=push({kind:'bolt',d:o.d,L,p:o.p,dir,grip:o.grip,name:`Болт M${o.d}×${L}`,role:'bolt',layer:'hw',step:o.step,mat:'galv',joint:o.joint||'',cat:'bolt',module:'site'});
  const mid=add(o.p,mul(dir,o.grip/2));
  for(const t of o.thru)hole(t,mid,dir,B.hole,p.id);
  p.thru=o.thru.map(t=>t.id);
  return p;
 }
 function weld(a,b,name,step,module){const L=len(sub(b,a));if(L<3)return null;return push({kind:'weld',a,b,len:L,name:name||'Сварной шов',role:'weld',layer:'weld',step,mat:'weld',cat:'electrode',module:module||'loose'});}
 // шов по контуру примыкания: контур a×b, u — вдоль a, v — вдоль b, c — центр
 function ringWeld(c,u,v,a,b,name,step,md){const e=1.8;for(const s of [-1,1]){weld(add(add(c,mul(v,s*(b/2+e))),mul(u,-a/2-e)),add(add(c,mul(v,s*(b/2+e))),mul(u,a/2+e)),name,step,md);weld(add(add(c,mul(u,s*(a/2+e))),mul(v,-b/2)),add(add(c,mul(u,s*(a/2+e))),mul(v,b/2)),name,step,md);}}
 // вварной язык 6 мм: входит в пропил ответной трубы, держит её на одном болте
 function tongue(o){
  const t=box({name:o.name,role:'tongue',c:o.c,ax:o.ax,ay:o.ay,w:o.w||50,h:o.h||40,t:o.t||6,mat:'steel',cat:'plate6',step:o.step,module:o.md,layer:'frame'});
  const ra=o.rootAx||o.ay,hh=(o.rootLen||o.h||40)/2;
  for(const s of [-1,1])weld(add(add(o.root,mul(t.az,s*4.8)),mul(ra,-hh)),add(add(o.root,mul(t.az,s*4.8)),mul(ra,hh)),'Шов языка',o.step,o.md);
  return t;
 }
 const PB=new Map();
 function pbAdd(post,ai,pt,part,lo,hi,step,joint,d){
  const oi=ai===0?2:0,key=`${post.id}|${ai}|${Math.round(pt[1])}|${Math.round(pt[oi])}`;
  let e=PB.get(key);if(!e){e={post,ai,pt,items:[],step,joint,d};PB.set(key,e);}
  e.items.push({part,lo,hi});
 }
 function pbFinish(){
  for(const e of PB.values()){
   const p0=e.post,half=Math.abs(p0.ax[e.ai])>0.9?p0.sx/2:p0.sy/2,cp=p0.o[e.ai];
   const items=e.items.concat([{part:p0,lo:cp-half,hi:cp+half}]).sort((a,b)=>a.lo-b.lo);
   const lo=items[0].lo,hi=Math.max(...items.map(i=>i.hi)),p=e.pt.slice();p[e.ai]=lo;const dir=[0,0,0];dir[e.ai]=1;
   bolt({d:e.d,p,dir,grip:hi-lo,thru:items.map(i=>i.part),step:e.step,joint:e.joint});
  }
 }
 function pillar(x,z,o){
  const dy=o.y0||0,nd={x,z,kind:!o.name?'post':/балку/.test(o.name)?'floor':'newel',a:o.a,st:[]};if(fnd||o.fw)FN.push(nd);
  if(fnd){if(o.fw)return;   // без фундамента вместо столба — узел рамы, шпильки приварены к его столику
   for(const s of o.studs)nd.st.push(push({kind:'stud',name:`Шпилька M12×${Math.round(s[2]-44)}, приварена к столику`,role:'stud',a:[s[0],44,s[1]],b:[s[0],s[2],s[1]],nuts:s[3].filter(y=>y>44),washers:s[4].filter(w=>w[0]>44),layer:'hw',step:'ring',mat:'galv',cat:'stud12'}));return;}
  push({kind:'cyl',name:'Подушка: песок/ПГС 150 мм, трамбовка',role:'sand',c:[x,-1350+dy,z],r:150,h:150,mat:'sand',layer:'found',step:'found',cat:'sand'});
  push({kind:'cyl',name:o.name||'Столб Ø200, пескобетон М300, низ −1200',role:'pillar',c:[x,-1200+dy,z],r:100,h:(o.top||45)+1200-dy,mat:'concrete',layer:'found',step:'found',cat:'concrete'});
  if(o.bell)push({kind:'cyl',name:'Уширение столба Ø400×200 (бур ТИСЭ с расширителем): держит отрыв и снижает давление на грунт',role:'bell',c:[x,-1200+dy,z],r:200,h:200,mat:'concrete',layer:'found',step:'found',cat:'concrete'});
  for(const dz of [-55,55])push({kind:'cyl',name:'Арматура А500С Ø10, L=1150',role:'rebar',c:[x,-1160+dy,z+dz],r:5,h:1150,mat:'rebar',layer:'found',step:'found',cat:'rebar'});
  for(const s of o.studs)push({kind:'stud',name:'Анкерная шпилька M12×300 (заделка 260)',role:'stud',a:[s[0],-214,s[1]],b:[s[0],s[2],s[1]],nuts:s[3],washers:s[4],layer:'hw',step:'found',mat:'galv',cat:'stud12'});
 }

 // открытые торцы — приварные заглушки 2 мм, обварены по контуру
 function capAll(){
  for(const p of parts.filter(q=>q.kind==='tube'))[0,1].forEach(e=>{
   if(!p.caps[e])return;
   const cut=e?p.cutB:p.cutA;
   if(p.round){const c=add(p.o,mul(p.az,e?p.L:0));box({name:`Заглушка приварная 3 мм (Ø${p.sx})`,role:'capPlate',round:true,parent:p.id,mount:p.mount,mountLen:p.mountLen,seq:p.seq,c:add(c,mul(p.az,(e?1:-1)*1.6)),ax:p.ax,ay:p.ay,az:p.az,w:p.sx,h:p.sy,t:3,mat:'steel',layer:p.layer,step:p.step,module:p.module,cat:'plate'});return;}
   const cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>{const x=i*p.sx/2,y=j*p.sy/2,z=cutZ(cut,x,y,e?p.L:0);return add(p.o,add(add(mul(p.ax,x),mul(p.ay,y)),mul(p.az,z)));});
   const c=mul(cs.reduce((s,q)=>add(s,q),[0,0,0]),0.25),ex=sub(cs[1],cs[0]),ey=sub(cs[3],cs[0]),out=mul(p.az,e?1:-1);
   let az=norm(cross(ex,ey));if(dot(az,out)<0)az=mul(az,-1);
   box({name:`Заглушка приварная 2 мм (${p.sec.replace('x2','').replace('x','×')})`,role:'capPlate',c:add(c,mul(az,1.1)),ax:norm(ex),ay:norm(ey),az,w:len(ex),h:len(ey),t:2,mat:'steel',layer:p.layer,step:p.step,module:p.module,cat:'plate',parent:p.id,mount:p.mount,mountLen:p.mountLen,seq:p.seq});
   for(let k=0;k<4;k++){const wd=weld(add(cs[k],mul(az,0.4)),add(cs[(k+1)%4],mul(az,0.4)),'Шов заглушки по контуру',p.step,p.module);if(wd)wd.parent=p.id;}
  });
 }
 return{parts,screws,C,MODS,push,mod,tube,angle,box,hole,bolt,weld,ringWeld,tongue,pbAdd,pbFinish,pillar,capAll,fnd,FN};
}


/* ---------------- построение ----------------
   Схема: стойки с опорными пластинами → сварные оголовки порталов (ригель, подкосы, у «Классики» — ферма целиком)
   садятся на стойки через вварную вставку-шип; боковые рамы (ригель + 2 подкоса + торцевые пластины) опускаются сверху
   к граням оголовков и стягиваются сквозными болтами. Всё сварное — дома, на участке только болты.
   Порядок работ — STEPS: каркас на наживлённых болтах → выверка и протяжка → кровля → пол → борта. */
const SHEET={
 c20:{p:'C20',W:1150,E:1100,L:2000,lap:200,nm:'Профнастил С20 0,45',mat:'roof',f0:36,fp:137.5,fh:0.6},
 tile:{p:'TILE',W:1180,E:1100,L:2250,lap:250,nm:'Металлочерепица',mat:'roof',f0:183,fp:183,fh:1},
 ondulin:{p:'OND',W:950,E:855,L:1950,lap:170,nm:'Ондулин',mat:'roof',f0:47,fp:95,fh:37},
 falc:{p:'FALC',W:375,E:340,L:7000,lap:0,nm:'Кликфальц',mat:'roof',hidden:true,f0:0,fp:340,fh:0},
 pcm:{p:'PCM',W:1050,E:960,L:2000,lap:200,nm:'Поликарбонат монолитный профилированный',mat:'pc',f0:36,fp:137.5,fh:0.6}};
// сборка с проверкой: если узел или элемент не проходит и есть понятное лечение — усиливаем и собираем заново
function ladder(cfg){
 let m=build0(cfg),v=verify(m);
 for(let g=0;g<20;g++){const cur=cfg.$||{},add={};let ang=null;
  for(const k in v.fixes){const nv=v.fixes[k];if(k==='ang'){if(nv>cfg.ang)ang=nv;}else if(k==='pcStep'||k==='purStep'){if(nv>=150&&(!cur[k]||nv<cur[k]))add[k]=nv;}else if(k==='nP'){if(!cur.nP||nv>cur.nP)add[k]=nv;}else if(cur[k]!==nv)add[k]=nv;}
  if(!Object.keys(add).length&&ang==null)break;
  cfg=Object.assign({},cfg,{$:Object.assign({},cur,add)},ang!=null?{ang,angType:cfg.type}:{});m=build0(cfg);v=verify(m);}
 m.verify=v;m.fixes=cfg.$||{};return m;
}
function build(cfgIn){
 const cfg=sanitize(Object.assign({},cfgIn,{$:undefined}));let m=finish(ladder(cfg));
 /* брус: «стойки 150×150» лестница берёт первой, но обычно дешевле добавить портал — ветер делится на большее число рам.
    Пробуем 1–3 лишних портала на брусе 100×100 и оставляем вариант дешевле; оба проходят расчёт */
 if(m.fixes.wPost&&!TYPES[cfg.type].poly&&cfg.mat!=='steel'){const base=Object.assign({},m.fixes);delete base.wPost;let best=m,bt=bom(m).total;
  const maxNP=Math.max(3,Math.floor((cfg.D-60)/650)+1);
  for(let nP=m.nP+1;nP<=Math.min(maxNP,m.nP+3);nP++){const a=finish(ladder(Object.assign({},cfg,{$:Object.assign({},base,{nP:Math.max(nP,base.nP||0)})})));
   if(a.fixes.wPost||!a.verify.ok)continue;const t=bom(a).total;if(t<bt-1){best=a;bt=t;}break;}
  m=best;}
 return m;
}
function build0(cfgIn){
 const cfg=sanitize(cfgIn);if(TYPES[cfg.type].poly)return buildPoly(cfg);
 const $=cfg.$||{},PSEC=$.post||'60x60x2',PT=PSEC.split('x')[2],SPG=$.spigot||'50x50x2';
 const TY=TYPES[cfg.type],gable=cfg.type==='gable',cov=cfg.cover,TR=TRUCKS[cfg.truck];
 const WD=cfg.mat!=='steel',TM=WD,WS=WOODS[cfg.wood],CAP=8,PURH=$.wPur==='e150'?150:$.wPur==='e100'?100:50,DP=WD?PURH-40:0; // WD — деревянная крыша; TM — и стойки из бруса; DP — обрешётка из бруса выше стальной: плоскость покрытия поднимается на DP
 const W=cfg.W,D=cfg.D,H=cfg.H,isFloor=cfg.base==='floor',FW=cfg.mat==='timber'&&isFloor,DT=cfg.deck==='wpc'?25:28,F=isFloor?230+DT:0; // FW — обвязка и пол тоже из бруса; DT — толщина доски настила (ДПК 25, дерево 28), лаги — по 230
 const RH=RAILS[cfg.rail].h,hasDoor=RH.front>0;
 const PG=cfg.type==='pergola';   // пергола: ригели горизонтальные, скат назад (порталы ступенями), кровельные щиты вдоль ската
 // оголовок портала должен лечь в кузов: укорачиваем подкосы, делим пополам на фланцах, в крайнем случае снижаем уклон
 let ovh=300,ovhL=cfg.type==='mono'?350:400,ovhR=cfg.type==='mono'?200:400;const ovhZ=gable?150:cfg.type==='mono'?200:300;
 // ригель «Модерна» и перголы работает на изгиб: сечение — по пролёту между подкосами, шагу порталов и снегу района
 const nP0=Math.max(cfg.$&&cfg.$.nP||0,3,Math.ceil((D-60)/1600)+1),sP0=(D-60)/(nP0-1),Sg0=SNOW_[cfg.snow],L45n=Math.round(Math.min(500,Math.max(360,W*0.15)));
 const bPw=$.wPost||100,BM_=WD?{sec:`w${bPw}x${bPw}`,b:bPw,h:bPw}:gable?(W>3200?BEAMS[1]:BEAMS[0]):(()=>{const q=(Sg0*1.4+GROOF[cfg.cover]*1.2)*sP0/1000,qn=(Sg0+GROOF[cfg.cover])*sP0/1000,Lb=W-2*(60+L45n),Lb_=W-2*(60+300),cL=400+60+L45n,M=Math.max(q*Lb_*Lb_/8,q*cL*cL/2);return pickSec(BEAMS,M,qn,Lb_,200);})(); // подкосы могут укоротиться до 300 мм при укладке в кузов — считаем по худшему
 const hb0=BM_.h;let span=gable?W+2*ovh:W+ovhL+ovhR;
 const headFit=(ang,l45,sp)=>{const t=Math.tan(ang*RAD),c=Math.cos(ang*RAD),base=l45+170+150+45,
   whole=gable?[[span+4,W/2*t+60/c+base]]:PG?[[span+4,hb0+base+45]]:[[span+4,span*t+hb0/c+base],[span/c+24,base*c+hb0+70]],half=gable?[[W/2+ovh+10,whole[0][1]]]:PG?[[span/2+10,whole[0][1]]]:[[span/2+10,span/2*t+hb0/c+base],[span/2/c+24,base*c+hb0+70]];
   const ok=d=>{const q=d.slice().sort((a,b)=>b-a);return q[0]<=TR.L-40&&q[1]<=TR.W-30;};return(sp?half:whole).some(ok);};
 let L45=Math.round(Math.min(500,Math.max(360,W*0.15))),split=false;
 if(!WD)for(;;){if(headFit(cfg.ang,L45,false))break;if(L45>300){L45=Math.max(300,L45-20);continue;}if(headFit(cfg.ang,L45,true)){split=true;break;}if(cfg.ang<=TY.angR[0])break;cfg.ang--;L45=Math.round(Math.min(500,Math.max(360,W*0.15)));}
 if(!WD&&!split&&!headFit(cfg.ang,L45,false))split=true;
 // свесы — под материал кровли, а не «как получится»: скат ложится в один лист (или целые листы + короткий добор из общих листов),
 // полоса поликарбоната — кратно длине листа; при равной цене берём свес ближе к обычному. Оголовок обязан по-прежнему лечь в кузов
 const zSpan=D+2*ovhZ+50,ZP0=[...Array(nP0)].map((_,i)=>D/2-30-i*sP0);
 const pcJoints=(a0,a1)=>{const j=[a0];let a=a0;while(a1-a>2100){const cand=ZP0.filter(z=>z>a+300&&z-a<=2100);const zc=cand.length?Math.max(...cand):a+2100;j.push(zc);a=zc;}j.push(a1);return j;};
 const coverCost=(sL,span_,slopes,widths)=>{
  if(cov==='falc')return 0;
  if(cov==='pc')return cut2D(widths.map(w=>({w,h:sL})),PC_STOCK(),{kerf:2}).cost;
  const S=cov==='shingle'?{L:2500,lap:0,W:1250,E:1250}:SHEET[cov],cols=Math.ceil((span_-(S.W-S.E))/S.E),pcs=[];
  for(let k=0;k<cols*slopes;k++)for(const l of sheetColumn(sL,S))pcs.push({len:cov==='tile'?tileLen(l):l});
  return cut1D(pcs,[{L:S.L,pr:CAT[cov==='shingle'?'osb12':cov].pr}],0).cost;};
 {const o0=[ovh,ovhL,ovhR],c=Math.cos(cfg.ang*RAD);
  if(gable)ovh=fitParam(200,420,10,300,o=>coverCost((W/2+o-20)/c+50,zSpan,2));
  else if(cfg.type==='mono'){const jw=pcJoints(-(D/2+ovhZ),D/2+ovhZ),wd=jw.slice(1).map((z,i)=>z-jw[i]);
   const s=fitParam(420,750,10,550,s=>coverCost((W+s)/c+(cov==='pc'?40:60),zSpan,1,wd));ovhL=Math.max(250,Math.min(450,s-200));ovhR=s-ovhL;}
  span=gable?W+2*ovh:W+ovhL+ovhR;
  if(!WD&&!headFit(cfg.ang,L45,split)){[ovh,ovhL,ovhR]=o0;span=gable?W+2*ovh:W+ovhL+ovhR;}}
 const Lw=Math.round(Math.min(650,Math.max(450,W*0.2)));   // вынос подкоса из бруса
 const be=cfg.ang*RAD,cb=Math.cos(be),sb=Math.sin(be),tb=Math.tan(be);
 const hb=BM_.h,bw=BM_.b,beamSec=BM_.sec,beamTxt=BM_.sec.replace(/x/g,'×').replace(/×(\d)$/,'×$1');
 const XP=W/2-30,nP=Math.max($.nP||0,3,Math.ceil((D-60)/1600)+1),sP=(D-60)/(nP-1),nl=nP-1;
 const ZP=[...Array(nP)].map((_,i)=>D/2-30-i*sP);
 const PN=i=>i===0?'фасад':i===nl?'зад':nP>3?`середина ${i}`:'середина';
 const SN=sx=>sx<0?'лев.':'прав.';
 const E=W>=2800?900:800;
 const slope=gable||PG?0:tb;
 const yB=(x,i=nl)=>F+H+(gable?0:PG?(ZP[i]-ZP[nl])*tb:(x+W/2)*tb+(WD?bPw:0)); // низ ригеля портала: у «Модерна» — наклонный (выше справа), у перголы — ступенями (передний выше)
 const ySide={'-1':gable?F+H:yB(-W/2),'1':gable?F+H:yB(W/2-40)}; // верх бокового ригеля
 const Yj=F+H-L45-170;                                          // стык «стойка — оголовок», одинаковый у всех стоек
 const YJ=i=>PG?yB(0,i)-L45-170:Yj;                             // у перголы перепад уклона берут стойки, оголовки одинаковые и низкие
 const beamBot=gable?{n:[0,1,0],p:[0,F+H,0]}:{n:[-sb,cb,0],p:[0,yB(0),0]};
 const flatB=gable||PG,nB=flatB?[0,1,0]:[-sb,cb,0],uB=flatB?[1,0,0]:[cb,sb,0],sbx=flatB?0:sb,cbx=flatB?1:cb,tbx=flatB?0:tb;
 const botOf=i=>PG?{n:[0,1,0],p:[0,yB(0,i),0]}:beamBot;

 const X=mkCtx(cfg),{parts,screws,C,MODS,push,mod,tube,angle,box,bolt,weld,ringWeld,tongue,pbAdd,pbFinish,pillar}=X;
 const fast=(type,p,n,st)=>screws.push({type,p,n,st});
 const bP=WD?($.wPost||100):0,yS=FW?222:isFloor?F+60:200,sillB=FW?Math.max(bP,$.wSill||0):0,FY=FW&&!X.fnd?230-sillB-152:0;   // брус стойки и верх стальной ножки (над настилом: торец бруса вне зоны брызг); у FW — опора врезана в обвязку, FY — земля ниже столбов
 const postTop=(x,i)=>TM?yS:YJ(i);

 /* ---- 1. фундамент и стойки ---- */
 const POST={},FT={};
 // жёсткая база (сильный ветер): пластина 10 мм, гайка и шайба под ней ниже на 4 мм
 const BT=$.base==='fixed16'?16:$.base==='fixed'?10:6,studs4=(x,z)=>[[-45,-45],[45,-45],[-45,45],[45,45]].map(([a,b])=>[x+a,z+b,86,[-205,49-(BT-6),71],[[-195,3],[59-(BT-6),3],[68,3]]]);
 ZP.forEach((z,i)=>{for(const sx of [-1,1]){
  const x=sx*XP,md=mod(`post${i}${sx<0?'L':'R'}`,`Стойка: ${PN(i)}, ${SN(sx)}`);
  if(FW){POST[`${i}${sx}`]={o:[x,0,z],module:md,id:-1};pillar(x,z,{fw:1,y0:FY,top:228-sillB,bell:$.bell,studs:[[x,z,224,[-205,206],[[-195,3],[203,3]]]]});continue;}   // стойка стоит на обвязке, столб несёт башмак
  pillar(x,z,{studs:studs4(x,z),bell:$.bell});
  const post=tube({name:`${TM?'Ножка':'Стойка'} 60×60×${PT} (${PN(i)}, ${SN(sx)})`,role:'post',sec:PSEC,a:[x,68,z],b:[x,postTop(x,i),z],up:[0,0,1],sx:60,sy:60,step:'posts',ends:['низ',WD?'верх':'верх (стык)'],module:md});
  post.holes.push({s:40,face:'Y',off:0,d:6,single:true,note:'дренаж Ø6, одна стенка'});
  const bp=box({name:`Опорная пластина 140×140×${BT}`,role:'basePlate',c:[x,68-BT/2,z],ax:[1,0,0],ay:[0,0,1],w:140,h:140,t:BT,mat:'steel',step:'posts',cat:'plate6',module:md,layer:'frame'});
  for(const [a,b] of [[-45,-45],[45,-45],[-45,45],[45,45]])bp.holes.push({x:a,y:b,d:14});
  ringWeld([x,68,z],[1,0,0],[0,0,1],60,60,'Шов стойка — опорная пластина','posts',md);
  if(isFloor){const xf=sx*(W/2-60);FT[`${i}${sx}`]=tongue({name:'Язык балки пола 50×40×6 (вварен в стойку)',c:[xf-sx*25,160,z],ax:[1,0,0],ay:[0,1,0],root:[xf,160,z],md,step:'posts'});}
  POST[`${i}${sx}`]=post;
 }});
 if(!X.fnd&&!FW)for(const p of Object.values(POST))box({name:'Подливка под опорную пластину (пескобетон)',role:'grout',c:[p.o[0],53.5-(BT-6)/2,p.o[2]],ax:[1,0,0],ay:[0,1,0],w:160,h:17-(BT-6),t:160,mat:'grout',layer:'found',step:'brace',cat:'concrete'});

 /* ---- 2. оголовки порталов: оголовки стоек + ригель + подкосы (+ ферма), всё на сварке ---- */
 const WPOST={};
 const HMD={},STUB={};      // ключ модуля по (портал, сторона)
 const RHT=WD?150:60,ybR=x=>(WD?F+H+hb-30:F+H)+(W/2-Math.abs(x))*tb,ycR=x=>ybR(x)+RHT/2/cb,ytR=x=>ybR(x)+(RHT+DP)/cb;   // стропило «Классики»: у дерева — врубка 30 мм в затяжку; ytR — плоскость под покрытие
 const P_=(x,i)=>[x,yB(x,i),0],CB=(x,i)=>add(P_(x+sbx*hb/2,i),mul(nB,hb/2)),TB=(x,i)=>add(P_(x+sbx*hb,i),mul(nB,hb)); // ось и верх ригеля над вертикалью x
 const xa=-(W/2+ovhL),xb=W/2+ovhR;
 // ряды обрешётки (вдоль ската), общие для всех порталов
 const PST=WD?(L,S,c,g)=>woodPurStep(L,S,c,g,WS,$.wPur):purlinStep;
 let rows=[],E2s={},Lr=0;const rIn=cfg.type==='pergola'?150:20; // у перголы ригели выступают за край кровли
 if(gable){const base=cov==='tile'?350:Math.min(COVERS[cov].step,PST(sP,SNOW_[cfg.snow],cb,GROOF[cov]),$.purStep||1e9,cov==='pc'?($.pcStep||1e9):1e9),Ls=(W/2+ovh-20)/cb,last=Ls-(WD?75:34);Lr=Ls;   // у дерева последний ряд стоит на стропиле, а не над бабкой
 
  if(cov==='tile'){rows=[20];while(rows[rows.length-1]+base<last)rows.push(rows[rows.length-1]+base);if(last-rows[rows.length-1]<120)rows.pop();if(WD&&last-rows[rows.length-1]>base)rows.push((last+rows[rows.length-1])/2);rows.push(last);} // шаг = шагу волны черепицы
  else{const n=Math.ceil((last-20)/base)+1;rows=[...Array(n)].map((_,j)=>20+j*(last-20)/(n-1));}}
 else{Lr=(xb-xa)/cb;const mx=Math.min(COVERS[cov].step,PST(sP,SNOW_[cfg.snow],cb,GROOF[cov]),$.purStep||1e9,cov==='pc'?($.pcStep||1e9):1e9),n=Math.ceil((Lr-2*rIn)/(split?mx-75:mx))+1;rows=[...Array(n)].map((_,j)=>rIn+j*(Lr-2*rIn)/(n-1)); // у фланцевого стыка ряд сдвигается на ~70 мм — шаг с запасом
  if(split)rows=rows.map(s=>{const x=xa+s*cb;return Math.abs(x)<70?s+(x<0?-1:1)*(70-Math.abs(x))/cb:s;});}
 // пергола: кровельные щиты (2 стропила + поперечины заподлицо) вдоль ската; стыки листов — над сдвоенными стропилами
 const PGR=PG?(()=>{const Wr=W+300,k=Math.ceil(Wr/1050),wp=Wr/k,RX=[],rw2=WD?25:20;for(let j=0;j<k;j++)RX.push(-Wr/2+j*wp+rw2,-Wr/2+(j+1)*wp-rw2);
  const pw=[];for(let x=-Wr/2;x<Wr/2-1;x+=2*wp)pw.push(Math.min(2*wp,Wr/2-x));   // полосы ПК: по два щита, стык — над сдвоенными стропилами
  const ov=fitParam(100,400,10,330,o=>coverCost((D-60+2*o)/cb+80,Wr,1,pw));
  const zBk=ZP[nl]-ov,zFr=ZP[0]+ov,lim=Math.min(2950*cb,(TR.L-120)*cb),segs=[];let a=zBk;
  while(zFr-a>lim){const cand=ZP.filter(z=>z>a+300&&z-a<=lim);const zc=Math.max(...cand);segs.push([a,zc]);a=zc;}segs.push([a,zFr]);
  return{Wr,k,wp,RX,zBk,zFr,ov,segs,yR:z=>F+H+hb+(z-ZP[nl])*tb+20*tb+0.5};})():null;
 const cleat=(heel,ax,nrm,md)=>{const w=norm(cross(ax,nrm)),o=sub(heel,mul(w,20));
  angle({name:'Упор обрешётки 40×40×4, L=40 (вварен)',role:'cleatW',o,u:ax,v:nrm,L:40,A:40,B:40,t:4,mat:'steel',cat:'ang40',step:'heads',layer:'roofframe',module:md});
  for(const k of [-1.8,41.8])weld(add(o,mul(ax,k)),add(add(o,mul(ax,k)),mul(w,40)),'Шов упора обрешётки','heads',md);C.selfDrill+=2;
  for(const ww of [12,28])fast('tek',add(add(add(o,mul(ax,4.2)),mul(nrm,24)),mul(w,ww)),ax,'purlins');};
 if(WD)woodRect({cfg,X,F,H,W,ZP,XP,nl,PN,SN,yB,CB,TB,nB,uB,hb,bw,beamSec,xa,xb,gable,PG,cb,sb,tb,POST,CAP,TM,FW,bP,yS,Lw,ovh,ybR,ycR,ytR,RHT,DP,E2s,slope,WPOST,sP,TR,PSEC,SPG,wBr:$.wBr,heelS:$.heelS||(W>3200?6:4),zBolt:!!$.zBolt});
 else ZP.forEach((z,i)=>{
  const nm=gable?'Портал с фермой':'Оголовок портала';
  if(split)for(const sx of [-1,1])HMD[`${i}${sx}`]=mod(`head${i}${sx<0?'L':'R'}`,`${nm}: ${PN(i)}, ${sx<0?'левая':'правая'} половина`);
  else{const k=mod(`head${i}`,`${nm}: ${PN(i)}`);HMD[`${i}-1`]=HMD[`${i}1`]=k;}
  const zz=v=>[v[0],v[1],z];
  for(const sx of [-1,1]){
   const md=HMD[`${i}${sx}`],x=sx*XP,xf=sx*(W/2-60);
   STUB[`${i}${sx}`]=tube({name:`Оголовок стойки 60×60×${PT} (${PN(i)}, ${SN(sx)})`,role:'stub',sec:PSEC,a:[x,YJ(i),z],b:[x,yB(x,i),z],up:[0,0,1],sx:60,sy:60,cutB:flatB?null:beamBot,step:'heads',ends:['низ (стык)','верх'],module:md});
   ringWeld([x,yB(x,i),z],uB,[0,0,1],flatB?60:60/cb,bw,'Шов оголовок — ригель','heads',md);
   const spg=tube({name:`Вставка-шип ${SPG.replace(/x/g,'×')}, L=300 (вварена в оголовок)`,role:'spigot',sec:SPG,a:[x,YJ(i)-150,z],b:[x,YJ(i)+150,z],up:[0,0,1],sx:50,sy:50,step:'heads',ends:['низ','верх'],module:md,note:'подогнать до плотной посадки: по 2 полосы 2,5 мм на смежные грани'});
   for(const s of [-1,1])for(const yy of [YJ(i)+60,YJ(i)+115])weld([x-5,yy,z+s*31.8],[x+5,yy,z+s*31.8],'Пробочный шов вставки Ø10','heads',md);
   bolt({d:10,p:[x,YJ(i)-75,z-30],dir:[0,0,1],grip:60,thru:[POST[`${i}${sx}`],spg],step:'heads',joint:'оголовок — стойка (вставка-шип)'});
   // подкос портала: рез «на ус» с двух концов, обварен по контуру
   const yF=(PG?yB(0,i):ySide[sx])-L45,tt=(yB(xf,i)-yF)/(1+sx*slope),A0=[xf,yF,z],B0=[xf-sx*tt,yF+tt,z],dir=norm([-sx,1,0]);
   tube({name:'Подкос портала 40×40 (рез «на ус», на сварке)',role:'brace',sec:'40x40x2',a:add(A0,mul(dir,-60)),b:add(B0,mul(dir,60)),up:[0,0,1],sx:40,sy:40,cutA:{n:[1,0,0],p:[xf,0,0]},cutB:botOf(i),step:'heads',ends:['низ','верх'],module:md});
   ringWeld(A0,[0,1,0],[0,0,1],40/Math.abs(dir[0]),40,'Шов подкос — оголовок стойки','heads',md);
   ringWeld(B0,uB,[0,0,1],40/Math.abs(dot(dir,nB)),40,'Шов подкос — ригель','heads',md);
  }
  if(gable){
   const rafPl=sx=>({n:[sx*sb,cb,0],p:[sx*W/2,F+H,0]}),x0=split?6:20,Tb=F+H+hb;
   const heelW=sx=>ringWeld([sx*(W/2-(hb/2)/tb),F+H+hb/2,z],[sx*cb,-sb,0],[0,0,1],hb/sb,40,'Шов затяжка — стропило (пята)','heads',HMD[`${i}${sx}`]);
   if(split){
    for(const sx of [-1,1]){const md=HMD[`${i}${sx}`];
     tube({name:`Ригель-затяжка ${beamTxt} (половина)`,role:'portalBeam',sec:beamSec,a:[sx*W/2,F+H+hb/2,z],b:[sx*6,F+H+hb/2,z],up:[0,1,0],sx:40,sy:hb,cutA:rafPl(sx),step:'heads',ends:['пята','фланец'],module:md});heelW(sx);}
   }else{
    const bm=tube({name:`Ригель-затяжка портала ${beamTxt}`,role:'portalBeam',sec:beamSec,a:[-W/2,F+H+hb/2,z],b:[W/2,F+H+hb/2,z],up:[0,1,0],sx:40,sy:hb,cutA:rafPl(-1),cutB:rafPl(1),step:'heads',ends:['лев. пята','прав. пята'],module:HMD[`${i}1`]});
    for(const sx of [-1,1])heelW(sx);
    if(bm.cutLen>3000.5){const xs=W*0.18;bm.splice=xs+W/2;ringWeld([xs,F+H+hb/2,z],[0,1,0],[0,0,1],hb,40,'Стык ригеля на сварке (с подкладкой)','heads',HMD[`${i}1`]);}
   }
   for(const sx of [-1,1]){const md=HMD[`${i}${sx}`];
    tube({name:`Стропило фермы ${sx<0?'левое':'правое'} 60×40`,role:'rafter',sec:'60x40x2',a:[sx*x0,ycR(x0),z],b:[sx*(W/2+ovh),ycR(W/2+ovh),z],up:[sx*sb,cb,0],sx:40,sy:60,cutA:{n:[1,0,0],p:[sx*x0,0,0]},cutB:{n:[1,0,0],p:[sx*(W/2+ovh),0,0]},caps:[false,true],step:'heads',layer:'roofframe',ends:['конёк','свес'],module:md});
   }
   if(!split){const md=HMD[`${i}1`];
    tube({name:'Бабка фермы 40×40',role:'kingPost',sec:'40x40x2',a:[0,Tb,z],b:[0,ytR(20),z],up:[0,0,1],sx:40,sy:40,caps:[false,true],step:'heads',layer:'roofframe',ends:['низ','верх'],module:md});
    ringWeld([0,Tb,z],[1,0,0],[0,0,1],40,40,'Шов бабка — затяжка','heads',md);
    for(const sx of [-1,1])ringWeld([sx*20,ycR(20),z],[0,1,0],[0,0,1],60/cb,40,'Шов стропило — бабка','heads',md);
   }else{
    const fl=(yc,h,nm,jn)=>{const pl={};for(const sx of [-1,1]){pl[sx]=box({name:nm,role:'flange',c:[sx*3,yc,z],ax:[0,0,1],ay:[0,1,0],w:100,h,t:6,mat:'steel',cat:'plate6',step:'heads',module:HMD[`${i}${sx}`],layer:'roofframe'});}
     for(const dz of [-35,35])bolt({d:10,p:[-6,yc,z+dz],dir:[1,0,0],grip:12,thru:[pl[-1],pl[1]],step:'heads',joint:jn});};
    const hr=Math.round(60/cb+24);
    fl(ycR(6),hr,`Фланец конька 100×${hr}×6`,'фланец конька — стыковка половин');
    fl(F+H+hb/2,hb,`Фланец затяжки 100×${hb}×6`,'фланец затяжки — стыковка половин');
    for(const sx of [-1,1]){ringWeld([sx*6,ycR(6),z],[0,1,0],[0,0,1],60/cb,40,'Шов стропило — фланец','heads',HMD[`${i}${sx}`]);ringWeld([sx*6,F+H+hb/2,z],[0,1,0],[0,0,1],hb,40,'Шов затяжка — фланец','heads',HMD[`${i}${sx}`]);}
   }
   for(const sx of [-1,1]){
    const md=HMD[`${i}${sx}`],x1=sx*0.45*W/2,B0=[x1,ybR(x1),z];let A0,cutA;
    if(!split){let ay=Tb+30;for(let k=0;k<4;k++){const d=norm(sub(B0,[sx*20,ay,z]));ay=Tb+20/Math.abs(d[0])+4;}A0=[sx*20,ay,z];cutA={n:[1,0,0],p:[sx*20,0,0]};}
    else{A0=[sx*90,Tb,z];cutA={n:[0,1,0],p:[0,Tb,0]};}
    const d=norm(sub(B0,A0)),nr=[sx*sb,cb,0];
    tube({name:'Раскос фермы 40×40 (на сварке)',role:'strut',sec:'40x40x2',a:add(A0,mul(d,-60)),b:add(B0,mul(d,60)),up:[0,0,1],sx:40,sy:40,cutA,cutB:{n:nr,p:B0},step:'heads',layer:'roofframe',ends:['низ','верх'],module:md});
    if(!split)ringWeld(A0,[0,1,0],[0,0,1],40/Math.abs(d[0]),40,'Шов раскос — бабка','heads',md);
    else ringWeld(A0,[1,0,0],[0,0,1],40/Math.abs(d[1]),40,'Шов раскос — затяжка','heads',md);
    ringWeld(B0,[-sx*cb,sb,0],[0,0,1],40/Math.abs(dot(d,nr)),40,'Шов раскос — стропило','heads',md);
    // упоры обрешётки
    const E2=[sx*(W/2+ovh),ytR(W/2+ovh),z],u=[-sx*cb,sb,0];E2s[sx]=E2;
    rows.forEach((s,ri)=>{const down=ri>0;cleat(add(E2,mul(u,down?s-10:s+10)),down?mul(u,-1):u,nr,md);});
   }
  }else{
   const mk=(x1,x2,md,nm,ends,caps)=>tube({name:nm,role:'portalBeam',sec:beamSec,a:zz(CB(x1,i)),b:zz(CB(x2,i)),up:nB,sx:bw,sy:hb,cutA:{n:[1,0,0],p:[x1,0,0]},cutB:{n:[1,0,0],p:[x2,0,0]},caps,step:'heads',ends,module:md});
   if(!split){const bm=mk(xa,xb,HMD[`${i}1`],`Ригель портала ${beamTxt} (${PG?'горизонтальный':'наклонный'}, с выносами)`,PG?['лев. вынос','прав. вынос']:['низ ската','верх ската'],[true,true]);
    if(bm.cutLen>3000.5){const xs=W*0.18;bm.splice=(xs-xa)/cbx;ringWeld(zz(CB(xs,i)),nB,[0,0,1],hb,bw,'Стык ригеля на сварке (с подкладкой)','heads',HMD[`${i}1`]);}}
   else{
    mk(xa,-6,HMD[`${i}-1`],`Ригель портала ${beamTxt} (левая половина)`,['вынос','фланец'],[true,false]);
    mk(6,xb,HMD[`${i}1`],`Ригель портала ${beamTxt} (правая половина)`,['фланец','вынос'],[false,true]);
    const yc=CB(0,i)[1],h=Math.round(hb/cbx),pl={};
    const hf=PG?h-6:h,yf=PG?yc-3:yc;
    for(const sx of [-1,1]){pl[sx]=box({name:`Фланец ригеля 100×${hf}×6`,role:'flange',c:[sx*3,yf,z],ax:[0,0,1],ay:[0,1,0],w:100,h:hf,t:6,mat:'steel',cat:'plate6',step:'heads',module:HMD[`${i}${sx}`],layer:'frame'});
     ringWeld([sx*6,yc+sx*6*tbx,z],[0,1,0],[0,0,1],hb/cbx,bw,'Шов ригель — фланец','heads',HMD[`${i}${sx}`]);}
    for(const dz of [-35,35])bolt({d:10,p:[-6,yc,z+dz],dir:[1,0,0],grip:12,thru:[pl[-1],pl[1]],step:'heads',joint:'фланец ригеля — стыковка половин'});
   }
   if(PG){ // упоры щитов: у внутренней грани каждого стропила, на верху ригеля
    const yT=yB(0,i)+hb;PGR.RX.forEach((rx,q)=>{const u=q%2?-1:1,md=HMD[`${i}${rx<0?-1:1}`],o=[rx+u*20,yT,z-20*u];
     angle({name:'Упор кровельного щита 40×40×4, L=40 (вварен в ригель)',role:'cleatW',o,u:[u,0,0],v:[0,1,0],L:40,A:40,B:40,t:4,mat:'steel',cat:'ang40',step:'heads',layer:'roofframe',module:md});
     for(const kk of [-1.8,41.8])weld(add(o,[u*kk,0,0]),add(add(o,[u*kk,0,0]),[0,0,40*u]),'Шов упора щита','heads',md);C.selfDrill+=2;
     for(const dz of [-9,9])fast('tek',[rx+u*24.2,yT+22,z+dz],[u,0,0],'purlins');});
   }else{
   const E0=TB(xa);E2s[0]=E0;
   rows.forEach((s,ri)=>{const down=ri>0,heel=zz(add(E0,mul(uB,down?s-10:s+10))),md=HMD[`${i}${heel[0]<0?-1:1}`];cleat(heel,down?mul(uB,-1):uB,nB,md);});
   }
  }
 });

 /* ---- 3. боковые связи: сварная рама «ригель + 2 подкоса» с торцевыми пластинами 6 мм. Рама опускается сверху вплотную к граням
        оголовков и стягивается двумя сквозными болтами M10 через оголовок (в среднем портале — общими для рам с двух сторон).
        Из оголовка ничего не торчит: на пути подкоса при опускании рамы нет выступов (раньше мешал язык ригеля) ---- */
 const EP=6;
 if(!WD)for(const sx of [-1,1])for(let i=0;i<nl;i++){
  const md=mod(`side${sx<0?'L':'R'}${i}`,`Боковая связь: ${sx<0?'левая':'правая'}, пролёт ${i+1}`);
  const xs=sx*(W/2-20),top=ySide[sx],zb=ZP[i+1]+30,zf=ZP[i]-30;
  const ts=PG?(yB(0,i)-yB(0,i+1))/(zf-zb):0,cs=1/Math.hypot(1,ts),ns=[0,cs,-ts*cs],ytop=zv=>PG?yB(0,i+1)+(zv-zb)*ts:top,yax=zv=>ytop(zv)-30/cs;
  const za=zb+EP,zc=zf-EP;
  const beam=tube({name:PG?'Ригель боковой 60×40 (по уклону)':'Ригель боковой 60×40',role:'sideBeam',sec:'60x40x2',a:[xs,yax(za),za],b:[xs,yax(zc),zc],up:PG?ns:[0,1,0],cutA:PG?{n:[0,0,1],p:[0,0,za]}:null,cutB:PG?{n:[0,0,1],p:[0,0,zc]}:null,sx:40,sy:60,step:'sides',ends:['зад','перед'],module:md,note:'торцы — на торцевые пластины рамы, на сварке'});
  for(const [zFace,dz,pi] of [[zb,1,i+1],[zf,-1,i]]){
   const zF=zFace+dz*EP,yTP=PG?yB(0,pi):top;                 // верх ригеля у оголовка — общий для рам с двух сторон портала
   const yBot=zv=>ytop(zv)-60/cs,foot=[xs,yBot(zF)-(L45-60),zF],dB=norm([0,1,dz]),tt=(L45-60)/(1-dz*ts),B0=[xs,foot[1]+tt,zF+dz*tt],botPl={n:PG?ns:[0,1,0],p:[0,yBot(zF),zF]};
   const br=tube({name:'Подкос боковой 40×40 (рез «на ус»)',role:'sideBrace',sec:'40x40x2',a:add(foot,mul(dB,-60)),b:add(B0,mul(dB,60)),up:[1,0,0],sx:40,sy:40,cutA:{n:[0,0,1],p:[0,0,zF]},cutB:botPl,step:'sides',ends:['низ','верх'],module:md,note:'нижний торец — на торцевую пластину, верхний — на ригель, всё на сварке'});
   ringWeld(B0,PG?[0,ts*cs,cs]:[0,0,1],[1,0,0],40/Math.abs(dot(dB,botPl.n)),40,'Шов подкос — боковой ригель','sides',md);
   const yLo=yTP-L45-40,pl=box({name:`Торцевая пластина боковой рамы 60×${Math.round(L45+40)}×6`,role:'endPlate',c:[sx*XP,(yLo+yTP)/2,zFace+dz*EP/2],ax:[1,0,0],ay:[0,1,0],w:60,h:yTP-yLo,t:EP,mat:'steel',cat:'plate6',step:'sides',module:md,layer:'frame'});
   ringWeld([xs,yax(zF),zF],[1,0,0],[0,1,0],40,60/cs,'Шов ригель — торцевая пластина','sides',md);
   ringWeld([xs,foot[1],zF],[1,0,0],[0,1,0],40,40*Math.SQRT2,'Шов подкос — торцевая пластина','sides',md);
   for(const yb of [yTP-90,yTP-L45+75])pbAdd(STUB[`${pi}${sx}`],2,[sx*XP,yb,zFace],pl,Math.min(zFace,zF),Math.max(zFace,zF),'sides','боковая рама — оголовок (сквозной болт через пластины)',10);
  }
 }

 /* ---- 4. кровля ---- */
 let apexY=0,ridgeY=0;const roofQty={sheets:0,sheetLen:[],trimLen:0,ridgeLen:0,eaveLen:0,area:0,pcStrips:[],pcLen:0,pieces:[],osb:[]};
 const cutsZ=(z0,z1)=>{const c=[z0];let a=z0;while(z1-a>3000){const cand=ZP.filter(z=>z>a+200&&z-a<=3000);const zc=Math.max(...cand);c.push(zc);a=zc;}c.push(z1);return c;};
 const purlinRun=(c0,n,ax0)=>{const zA=-(D/2+ovhZ),zB=D/2+ovhZ,cuts=cutsZ(zA,zB);
  if(WD){const {tmb}=woodKit(X,cfg),c1=add(c0,mul(n,20-PURH/2)),pb=PURH===50?100:50,lat=norm(cross(n,[0,0,1]));for(let k=0;k<cuts.length-1;k++){const z0=cuts[k]+(k?1:0),z1=cuts[k+1]-(k<cuts.length-2?1:0);tmb({name:PURH===50?'Обрешётка 50×100 плашмя':`Обрешётка 50×${PURH} на ребро`,role:'purlin',sec:PURH===150?'w50x150':'w50x100',a:add(c1,[0,0,z0]),b:add(c1,[0,0,z1]),up:n,sx:pb,sy:PURH,step:'purlins',layer:'roofframe',ends:['зад','перед']});
    for(const zp of ZP)if(zp>=z0-1&&zp<=z1+1)for(const s of [-1,1]){const q=add(c1,[0,0,Math.min(z1-24,Math.max(z0+24,zp+s*14))]);screws.push(PURH===50?{type:'wp',p:add(add(q,mul(n,PURH/2)),mul(lat,s*26)),n,st:'purlins'}:{type:'wp',p:add(add(q,mul(n,30-PURH/2)),mul(lat,s*25)),n:norm(add(mul(lat,s),mul(n,0.7))),st:'purlins'});C.wood6++;}}return;}   // 2 самореза на опору: плашмя — сверху, на ребро — наискось с боков
  for(let k=0;k<cuts.length-1;k++)tube({name:'Обрешётка 40×20 (на ребро)',role:'purlin',sec:'40x20x2',a:add(c0,[0,0,cuts[k]+(k?1:0)]),b:add(c0,[0,0,cuts[k+1]-(k<cuts.length-2?1:0)]),up:n,sx:20,sy:40,caps:[k===0,k===cuts.length-2],step:'purlins',layer:'roofframe',ends:['зад','перед']});};
 const zA=-(D/2+ovhZ),zB2=D/2+ovhZ,zLen=zB2-zA+50;
 roofQty.sheetW=[];
 const TRIM_H={tile:86,c20:60,ondulin:78,falc:66,pcm:62,shingle:58},TRIM_CAT={tile:'trimTile',c20:'trimC20',falc:'trimC20',ondulin:'wind',pcm:'trimC20',shingle:'wind',pc:'pcEnd'};
 // листовая кровля на прямоугольном скате: крайний лист подрезается по ширине, по длине — ряды с нахлёстом
 function sheetRoof(P,n,u,s0,sL,z0,z1,wAx){
  const S=SHEET[cov],nAcross=Math.ceil((z1-z0-(S.W-S.E))/S.E),col=sheetColumn(sL,S);
  for(let k=0;k<nAcross;k++){const za=z0+k*S.E,w=Math.min(S.W,z1-za);if(w<80)continue;
   for(let r=0,sa=s0;r<col.length;sa+=col[r]-S.lap,r++){const segL=col[r],hh=40+k*0.6+r*1.2;
    push({kind:'sheet',profile:S.p,name:`${S.nm} (лист ${Math.round(w)}×${Math.round(segL)}${w<S.W-1?', подрезан по ширине':''})`,role:'roofSheet',o:P(za,sa,hh),ax:wAx||[0,0,1],ay:n,az:u,W:w,L:segL,mat:S.mat,layer:'roof',step:'roof',cat:cov});
    roofQty.sheets++;roofQty.sheetLen.push(segL);roofQty.sheetW.push(w);roofQty.pieces.push({len:segL,w,col:k,row:r});
    rows.forEach((s,ri)=>{if(s<sa+15||s>sa+segL-15)return;const all=ri===0||ri===rows.length-1;
     if(S.hidden){roofQty.hidden=(roofQty.hidden||0)+1;return;}
     for(let q=0,uu=S.f0;uu<w-8;q++,uu+=S.fp){if(!all&&q%2)continue;screws.push({type:S.mat==='pc'?'pc':'roof',p:P(za+uu,s,hh+S.fh),n});}});
   }}
 }
 if(gable){
  for(const sx of [-1,1]){
   const E2=[sx*(W/2+ovh),ytR(W/2+ovh),0],u=[-sx*cb,sb,0],n=[sx*sb,cb,0];
   const Pg=(zz,s,h)=>add(add(add(E2,[0,0,zz]),mul(u,s)),mul(n,h));
   rows.forEach(s=>purlinRun(add(add(E2,mul(u,s)),mul(n,20)),n));
   const sL=Lr+50;
   if(SHEET[cov])sheetRoof(Pg,n,u,-50,sL,zA-25,zB2+25);
   else{
    box({name:'OSB-3 12 мм (сплошной настил, зазор 3 мм)',role:'osb',c:Pg((zA+zB2)/2,sL/2-50,46),ax:[0,0,1],ay:u,w:zLen,h:sL,t:12,mat:'osb',layer:'roof',step:'roofDeck',cat:'osb12'});
    roofQty.osb.push({span:zLen,sL});
    rows.forEach(s=>{for(let zz=zA+60;zz<zB2-30;zz+=300)fast('osb',Pg(zz,s,51.9),n,'roofDeck');});
    const U=(nm,s0,hh,ww,zc)=>box({name:nm,role:'underlay',c:Pg(zc,s0+hh/2,52.8),ax:[0,0,1],ay:u,w:ww,h:hh,t:1.5,mat:'underlay',layer:'roof',step:'roofUnder',cat:'underlay'});
    U('Подкладочный ковёр — полоса по карнизу 600 мм',-50,600,zLen,(zA+zB2)/2);U('Подкладочный ковёр — полоса у конька 500 мм',sL-550,500,zLen,(zA+zB2)/2);
    for(const zc of [zA-25+200,zB2+25-200])U('Подкладочный ковёр — полоса по фронтону 400 мм',550,sL-1100,400,zc);
    box({name:'Гибкая черепица Shinglas (рядовая, от карниза к коньку)',role:'shingle',c:Pg((zA+zB2)/2,sL/2-48,56.1),ax:[0,0,1],ay:u,w:zLen+10,h:sL+6,t:5,mat:'shingle',layer:'roof',step:'roof',cat:'shingle'});
    const v=mul(n,-1),w=norm(cross(u,v));angle({mount:[sx,0,0],name:'Планка карнизная (капельник) — поверх ковра, гвозди через 120 мм',role:'trim',o:Pg(w[2]>0?zA-25:zB2+25,-50,53.6),u,v,L:zLen,A:60,B:50,t:0.6,mat:'roof',layer:'roof',step:'roofEdge',cat:'drip',trim:true});
    roofQty.area+=zLen*sL/1e6;
   }
   const hh=TRIM_H[cov]+(cov==='shingle'?2:0);
   for(const sz of [-1,1]){const uu=[0,0,-sz],v=mul(n,-1),w=norm(cross(uu,v)),o=Pg(sz>0?zB2+26:zA-26,dot(w,u)>0?-50:sL-50,hh);angle({name:cov==='shingle'?'Планка ветровая (фронтонная) — поверх ковра':'Планка торцевая — поверх листа',role:'trim',o,u:uu,v,L:sL,A:70,B:hh+30,t:0.6,mat:'roof',layer:'roof',step:cov==='shingle'?'roofEdge':'roofTrim',cat:TRIM_CAT[cov],trim:true});
    if(cov!=='shingle')for(let q=150;q<sL-50;q+=450)fast('trim',add(add(o,mul(uu,35)),mul(w,q)),n,'roofTrim');}
   roofQty.trimLen+=2*sL/1000;roofQty.eaveLen+=zLen/1000;
  }
  apexY=ytR(0);
  const rh=TRIM_H[cov]+(cov==='shingle'?2:4),rw=cov==='shingle'?125:200;
  ridgeY=apexY+rh/cb;
  // уплотнитель лежит на гребнях профиля, конёк — на уплотнителе: верх уплотнителя на 1 мм ниже полки конька (rh), иначе он торчит сквозь планку
  if(SHEET[cov]&&cov!=='ondulin')for(const sx of [-1,1]){const n=[sx*sb,cb,0],u=[-sx*cb,sb,0],E2=[sx*(W/2+ovh),ytR(W/2+ovh),0],sL=Lr+50;box({name:'Уплотнитель коньковый (профильный, самоклеящийся)',role:'seal',c:add(add(E2,mul(u,sL-120)),mul(n,Math.min(rh-7,40+{c20:20,tile:30,falc:25,pcm:20}[cov]+6))),ax:[0,0,1],ay:u,w:zLen,h:40,t:12,mat:'seal',layer:'roof',step:'roofTrim',cat:cov==='tile'?'ridgeSeal':'sealC20'});}
  if(cov!=='shingle')for(let zz=zA;zz<zB2;zz+=300)for(const sx of [-1,1])fast('trim',[sx*cb*110,ridgeY-sb*110+1,zz],[sx*sb,cb,0],'roofTrim');
  angle({name:cov==='shingle'?'Коньково-карнизная черепица по коньку':'Конёк плоский — на уплотнитель, саморезы через 300 мм в гребни',role:'trim',o:[0,ridgeY,zB2+30],u:[cb,-sb,0],v:[-cb,-sb,0],L:zLen+10,A:rw,B:rw,t:cov==='shingle'?4:0.6,mat:cov==='shingle'?'shingle':'roof',layer:'roof',step:'roofTrim',cat:{tile:'ridgeTile',c20:'ridgeC20',falc:'ridgeC20',ondulin:'ridgeOnd',shingle:'ridgeSh'}[cov],trim:true});
  roofQty.ridgeLen=(zLen+10)/1000;
 }else if(PG){
  // кровельные щиты вдоль ската: 2 стропила 40×40 + поперечины 40×20 заподлицо сверху и снизу, всё на сварке; щиты лежат на ригелях порталов
  const {Wr,k,wp,RX,zBk,zFr,segs,yR}=PGR,d=[0,sb,cb],n=[0,cb,-sb],PH=WD?100:40,Q0=add([0,yR(zBk),zBk],mul(n,PH-40));   // щит из бруса выше стального: стропило 50×100
  const Pt=(x,s,h)=>add(add(add(Q0,[x,0,0]),mul(d,s)),mul(n,h));
  const stp=cov==='pcm'?Math.min(COVERS.pcm.step,$.purStep||1e9):Math.min(700,$.pcStep||1e9),CR=new Set();
  segs.forEach(([z0,z1],si)=>{
   const eA=si===0,eB=si===segs.length-1,za=z0+(eA?0:1),zb_=z1-(eB?0:1);
   const c0=eA?za+12:za+75,c1=eB?zb_-12:zb_-75,nc=Math.max(2,Math.ceil((c1-c0)/(stp-(ZP.length>2?80:0)))+1); // у порталов поперечины сдвигаются на 75 мм — шаг с запасом
   const CZ=[...Array(nc)].map((_,q)=>c0+q*(c1-c0)/(nc-1)).map(zc=>{for(const zp of ZP)if(Math.abs(zc-zp)<75)return zp+(zc<zp?-75:75);return zc;});
   for(let j=0;j<k;j++){
    const md=mod(`panel${j}_${si}`,`Кровельный щит ${j+1}${segs.length>1?'.'+(si+1):''}`),rl=RX[2*j],rr=RX[2*j+1];
    for(const rx of [rl,rr]){const at=zv=>Pt(rx,(zv-zBk+20*sb)/cb,40-PH/2);
     if(WD){woodKit(X,cfg).tmb({name:'Стропило щита 50×100',role:'panelRafter',sec:'w50x100',a:at(za),b:at(zb_),up:n,cutA:{n:[0,0,1],p:[0,0,za]},cutB:{n:[0,0,1],p:[0,0,zb_]},step:'purlins',layer:'roofframe',ends:['зад','перед'],module:md,notch:parts.filter(p=>p.role==='portalBeam'),note:'на балках — посадочная врубка по уклону'});for(const zp of ZP)if(zp>=Math.min(za,zb_)+30&&zp<=Math.max(za,zb_)-30)for(const q of [-22,22]){screws.push({type:'wp',p:add(at(zp+q),add([(rx===rl?1:-1)*25,0,0],mul(n,30-PH/2))),n:norm(add([rx===rl?1:-1,0,0],mul(n,0.7))),st:'purlins'});C.wood6++;}}
     else tube({name:'Стропило щита 40×40',role:'panelRafter',sec:'40x40x2',a:at(za),b:at(zb_),up:n,sx:40,sy:40,cutA:{n:[0,0,1],p:[0,0,za]},cutB:{n:[0,0,1],p:[0,0,zb_]},caps:[eA,eB],step:'purlins',layer:'roofframe',ends:['зад','перед'],module:md});}
    for(const zc of CZ){const sc=(zc-zBk+20*sb)/cb;CR.add(Math.round(sc));
     if(WD){woodKit(X,cfg).tmb({name:'Поперечина щита 50×50 (заподлицо, на саморезах)',role:'panelBar',sec:'w50x50',a:Pt(rl+25,sc,15),b:Pt(rr-25,sc,15),up:n,step:'purlins',layer:'roofframe',ends:['лев.','прав.'],module:md});C.wood6+=4;}
     else{tube({name:'Поперечина щита 40×20 (заподлицо, на сварке)',role:'panelBar',sec:'40x20x2',a:Pt(rl+20,sc,20),b:Pt(rr-20,sc,20),up:n,sx:20,sy:40,step:'purlins',layer:'roofframe',ends:['лев.','прав.'],module:md});
     for(const xx of [rl+20,rr-20])ringWeld(Pt(xx,sc,20),n,d,40,20,'Шов поперечина — стропило щита','purlins',md);}}
   }
  });
  rows=[...CR].sort((a,b)=>a-b);
  const s0=40*tb-40,sL=(zFr-zBk)/cb+80;
  if(cov==='pc'){
   const J=[];
   for(let x=-Wr/2,q=0;x<Wr/2-1;x+=2*wp,q++){const w=Math.min(2*wp,Wr/2-x),last=x+w>=Wr/2-1;
    push({kind:'sheet',profile:'PC8',name:`Поликарбонат сотовый 8 мм (${Math.round(w)}×${Math.round(sL)})`,role:'roofSheet',o:Pt(x+(q?2:0),s0,40),ax:[1,0,0],ay:n,az:d,W:w-(q?2:0)-(last?0:2),L:sL,mat:'pc',layer:'roof',step:'roof',cat:'pc8'});roofQty.pcStrips.push(w);
    if(q){J.push(x);box({name:'Основание соединительного профиля — на сдвоенные стропила, саморезы через 300 мм',role:'trim',c:Pt(x,s0+sL/2,38.9),ax:[1,0,0],ay:d,w:60,h:sL,t:2,mat:'galv',layer:'roof',step:'roofEdge',cat:'pcConn'});
     for(let sv=s0+150;sv<s0+sL-100;sv+=300)fast('tek',Pt(x,sv,40),n,'roofEdge');
     box({name:'Крышка соединительного профиля (защёлкивается)',role:'trim',c:Pt(x,s0+sL/2,51),ax:[1,0,0],ay:d,w:44,h:sL,t:6,mat:'galv',layer:'roof',step:'roofTrim',cat:'pcConn'});}}
   for(const se of [s0+6,s0+sL-6])box({name:'Профиль торцевой на конец листа (сверху — герметичная лента, снизу — перфорированная)',role:'trim',c:Pt(0,se,44),ax:[1,0,0],ay:d,w:Wr,h:12,t:14,mat:'galv',layer:'roof',step:'roof',cat:'pcEnd'});
   rows.forEach(sr=>{for(let x=-Wr/2+150;x<=Wr/2-149;x+=350){if(J.some(j=>Math.abs(j-x)<60))continue;screws.push({type:'pc',p:Pt(x,sr,48.5),n});}});
   roofQty.pcLen=sL;
  }else sheetRoof((x,sv,h)=>Pt(x,sv,h),n,d,s0,sL,-Wr/2,Wr/2,[1,0,0]);
  for(const sx of [-1,1]){const uu=[-sx,0,0],v=mul(n,-1),w=norm(cross(uu,v)),isPc=true;
   angle({name:cov==='pc'?'Профиль торцевой (бок)':'Планка торцевая',role:'trim',o:Pt(sx*(Wr/2+6),dot(w,d)>0?s0-10:s0+sL-10,cov==='pc'?48.6:60.6),u:uu,v,L:sL,A:26,B:30,t:0.6,mat:'galv',layer:'roof',step:'roofTrim',cat:TRIM_CAT[cov],trim:true});}
  // водосток по заднему (нижнему) свесу
  const be_=Pt(0,s0,40),ra=Pt(0,(20*sb)/cb,20),zE=zBk,yE=ra[1],gP=parts.length;   // ось стропила у заднего торца
  const BX=[...new Set(RX.map((x,q)=>q%2&&q<RX.length-1?null:Math.round(x)).filter(x=>x!=null))];          // по одному кронштейну на торец стропила, у сдвоенных — на левое
  for(const x of BX){box({name:'Кронштейн желоба (к торцу стропила щита, 2 самореза)',role:'trim',c:[x,yE-22,zE-52],ax:[1,0,0],ay:[0,1,0],w:20,h:84,t:104,mat:'galv',layer:'roof',step:'gutter',cat:'gutterSet'});
   for(const dy of [-12,12])fast('tek',[x,yE+dy,zE-2.2],[0,0,-1],'gutter');}
  const gy=yE-64,gz=zE-115;
  angle({name:'Желоб водосточный 125 мм (уклон к трубе 3–5 мм на метр)',role:'trim',o:[Wr/2+20,gy,gz],u:[0,0,1],v:[0,1,0],L:Wr+40,A:115,B:85,t:0.6,mat:'roof',layer:'roof',step:'gutter',cat:'gutter',trim:true});
  push({kind:'cyl',name:'Труба водосточная Ø90 с воронкой и коленом',role:'trim',c:[-(Wr/2)+90,0,gz+60],r:45,h:gy,mat:'roof',layer:'roof',step:'gutter',cat:'downpipe'});
  for(let q=gP;q<parts.length;q++)parts[q].mount=[0,0,-1];   // водосток навешивают сзади
  roofQty.gutter=(Wr+40)/1000;roofQty.trimLen=2*sL/1000;roofQty.eaveLen=2*Wr/1000;
  const top=Pt(0,s0+sL,50);apexY=top[1];ridgeY=top[1];
 }else{
  const E0=E2s[0],n=nB,u=uB,Pm=(zz,s,h)=>add(add(add(E0,[0,0,zz]),mul(u,s)),mul(n,h));
  rows.forEach(s=>purlinRun(add(add(E0,mul(u,s)),mul(n,20)),n));
  const s0r=cfg.type==='pergola'?rIn-40:cov==='pc'?-20:-30,sL=cfg.type==='pergola'?Lr-2*rIn+80:Lr+(cov==='pc'?40:60);
  if(SHEET[cov])sheetRoof(Pm,n,u,s0r,sL,zA-25,zB2+25);
  else{
   // поликарбонат: стыки листов — только над порталами, в соединительном профиле
   const joints=[zA];{let a=zA;while(zB2-a>2100){const cand=ZP.filter(z=>z>a+300&&z-a<=2100);const zc=cand.length?Math.max(...cand):a+2100;joints.push(zc);a=zc;}}joints.push(zB2);
   for(let k=0;k<joints.length-1;k++){const w=joints[k+1]-joints[k]-(k&&k<joints.length-2?0:0);
    push({kind:'sheet',profile:'PC8',name:`Поликарбонат сотовый 8 мм (${Math.round(w)}×${Math.round(sL)})`,role:'roofSheet',o:Pm(joints[k]+(k?2:0),s0r,40),ax:[0,0,1],ay:n,az:u,W:w-(k?2:0)-(k<joints.length-2?2:0),L:sL,mat:'pc',layer:'roof',step:'roof',cat:'pc8'});
    roofQty.pcStrips.push(w);}
   for(let k=1;k<joints.length-1;k++){box({name:'Основание соединительного профиля — над порталом, саморезы в каждую обрешётку',role:'trim',c:Pm(joints[k],s0r+sL/2,38.9),ax:[0,0,1],ay:u,w:60,h:sL,t:2,mat:'galv',layer:'roof',step:'roofEdge',cat:'pcConn'});rows.forEach(sv=>fast('tek',Pm(joints[k],sv,40),n,'roofEdge'));
    box({name:'Крышка соединительного профиля (защёлкивается)',role:'trim',c:Pm(joints[k],s0r+sL/2,51),ax:[0,0,1],ay:u,w:44,h:sL,t:6,mat:'galv',layer:'roof',step:'roofTrim',cat:'pcConn'});}
   for(const se of [s0r+6,s0r+sL-6])box({name:'Профиль торцевой на конец листа (герметичная/перфорированная лента)',role:'trim',c:Pm((zA+zB2)/2,se,44),ax:[0,0,1],ay:u,w:zB2-zA+50,h:12,t:14,mat:'galv',layer:'roof',step:'roof',cat:'pcEnd'});
   rows.forEach(s=>{for(let zz=zA+120;zz<=zB2-119;zz+=330){if(joints.some(j=>Math.abs(j-zz)<60))continue;screws.push({type:'pc',p:Pm(zz,s,48.5),n});}});
   roofQty.pcLen=sL;
  }
  for(const sz of [-1,1]){const uu=[0,0,-sz],v=mul(n,-1),w=norm(cross(uu,v));const isPc=cov==='pc'||cov==='pcm';const o_=Pm(sz>0?zB2+(isPc?6:26):zA-(isPc?6:26),dot(w,u)>0?s0r-10:s0r+sL-10,cov==='pc'?48.6:cov==='pcm'?60.6:TRIM_H[cov]);angle({name:isPc?'Профиль торцевой (бок)':'Планка торцевая',role:'trim',o:o_,u:uu,v,L:sL,A:isPc?26:70,B:isPc?30:90,t:0.6,mat:isPc?'galv':'roof',layer:'roof',step:'roofTrim',cat:TRIM_CAT[cov],trim:true});if(!isPc)for(let q=150;q<sL-50;q+=450)fast('trim',add(add(o_,mul(uu,35)),mul(w,q)),n,'roofTrim');}
  roofQty.trimLen=2*sL/1000;roofQty.eaveLen=2*zLen/1000;
  const top=Pm(0,s0r+sL,60);apexY=top[1];ridgeY=top[1];
 }

 /* ---- 5. пол: балки на языках стоек, лаги поверх, настил ---- */
 const NX=hasDoor?[-(E/2+20),E/2+20]:[];const FB={};let deckInfo=null,FSP=0,WFL=null,JX=[];
 if(isFloor){
  const x0=-(W/2-60),x1=W/2-60,LB=x1-x0,nSup=Math.max(0,Math.ceil(LB/1500)-1);
  const supX=[...Array(nSup)].map((_,j)=>x0+(j+1)*LB/(nSup+1)),spl=LB>3000?[supX[nSup>1?1:0]]:[];
  if(FW){WFL=woodFloorRect(X,cfg,{XP,ZP,W,D,TR,bP,supX,FY,pillar,N:0});JX=WFL.JX;FSP=WFL.span;}else{
  ZP.forEach((z,i)=>{
   // перед со входом: балка из трёх частей, концы — на языках стоек входа (стойка входа — на своём столбике), столики не нужны
   const front=i===0&&NX.length,segs=front?[[x0,NX[0]-21],[NX[0]+21,NX[1]-21],[NX[1]+21,x1]]:[x0,...spl,x1].slice(0,-1).map((c,k,a)=>[c+(k?1:0),(k<a.length-1?a[k+1]-1:x1)]),pcs=[];
   FSP=Math.max(FSP,front?Math.max(...segs.map(([ca,cb])=>cb-ca)):LB/(nSup+1)); // пролёт между опорами: у передней балки со входом — между стойками и стойками входа
   for(const [ca,cb] of segs)pcs.push(tube({name:`Балка пола 60×40 (${PN(i)})`,role:'floorBeam',sec:'60x40x2',a:[ca,160,z],b:[cb,160,z],up:[0,1,0],sx:40,sy:60,step:'bottom',layer:'floor',ends:['лев.','прав.'],note:'у стоек — пропил 7×60 мм в нижней стенке под язык'}));
   FB[i]=pcs;
   for(const sx of [-1,1])bolt({d:8,p:[sx*(W/2-85),160,z-20],dir:[0,0,1],grip:40,thru:[sx<0?pcs[0]:pcs[pcs.length-1],FT[`${i}${sx}`]],step:'bottom',joint:'балка пола — стойка (язык в пропил)'});
   for(const x of front?[]:supX){pillar(x,z,{name:'Столбик под балку пола Ø200',studs:[[x,z,124,[-205,109],[[-195,3]]]]});box({name:'Опорный столик 100×100×4 с приварной гайкой M12',role:'support',c:[x,128,z],ax:[1,0,0],ay:[0,0,1],w:100,h:100,t:4,step:'bottom',cat:'plate6',mat:'steel',layer:'floor'});C.selfDrill+=2;for(const dx of [-30,30])fast('tek',[x+dx,125.8,z],[0,-1,0],'bottom');}
  });
  const nj=Math.ceil((W-160)/(cfg.deck==='wpc'?400:500))+1; // ДПК — лаги не реже 400 мм
  JX=[...Array(nj)].map((_,j)=>-(W/2-80)+j*(W-160)/(nj-1));
  JX=JX.map(x=>{for(const xn of NX)if(Math.abs(x-xn)<62)return xn+(x<xn?-62:62);return x;});
  for(let i=0;i<nl;i++){const z0=ZP[i+1]+(i+1===nl?-20:1),z1=ZP[i]+(i===0?20:-1);
   for(const x of JX)tube({name:'Лага пола 40×40',role:'joist',sec:'40x40x2',a:[x,210,z0],b:[x,210,z1],up:[0,1,0],sx:40,sy:40,caps:[i+1===nl,i===0],step:'bottom',layer:'floor',ends:['зад','перед']});} // наружные торцы — с заглушкой, стыки над балками — встык
  const clipBad=(x,s)=>Math.abs(x+s*40)>W/2-80||NX.some(xn=>Math.abs(x+s*40-xn)<62);
  ZP.forEach(z=>{for(const x of JX){let s=x>1?-1:1;if(clipBad(x,s))s=-s;
   angle({name:'Уголок крепёжный 40×40×40×2 (лага — балка)',role:'cleatJoist',o:[x+s*20,190,z-20*s],u:[s,0,0],v:[0,1,0],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});C.clip+=4;
   for(const dz of [-10,10]){fast('clip',[x+s*42,192.2,z+dz],[0,1,0],'bottom');fast('clip',[x+s*22.2,214,z+dz],[s,0,0],'bottom');}}});}
  const ho=FW?bP/2+6:33,hn=FW?56:23,obst=Object.values(POST).map(p=>({x0:p.o[0]-ho,x1:p.o[0]+ho,z0:p.o[2]-ho,z1:p.o[2]+ho}));
  for(const xn of NX)obst.push({x0:xn-hn,x1:xn+hn,z0:ZP[0]-hn,z1:ZP[0]+hn});
  let nb=Math.ceil((D+5)/145),exc=nb*145-5-D;if(exc/2>60){nb--;exc=nb*145-5-D;}
  // лишнее — распускаем крайние доски; недостача (exc<0) — настил по центру, кромки не доходят до края на ≤13 мм
  const ws=[...Array(nb)].map((_,i)=>(i===0||i===nb-1)&&exc>0?140-exc/2:140);
  let mid=JX.map((x,j)=>[Math.abs(x),j]).sort((a,b)=>a[0]-b[0]).slice(0,2).map(q=>JX[q[1]]).sort((a,b)=>a-b);
  // широкий пол — две доски в ряд, стыки на лагах вразбежку (через ряд — на другой лаге); какие две лаги — по раскрою досок 3 м
  if(W>3000){const pr=CAT[DECKS[cfg.deck].cat].pr,cand=JX.filter(x=>Math.abs(x)<W/2-300);let bc=Infinity;
   for(const xa of cand)for(const xb of cand){if(xb<=xa||xa+W/2>3000||W/2-xb>3000||W/2-xa>3000||xb+W/2>3000)continue;
    const pcs=[];for(let i=0;i<nb;i++){const x=i%2?xb:xa;pcs.push({len:Math.round(x+W/2-1.5)},{len:Math.round(W/2-x-1.5)});}
    const c=cut1D(pcs,[{L:3000,pr}],4).cost+(Math.abs(xa)+Math.abs(xb))*1e-3;if(c<bc){bc=c;mid=[xa,xb];}}}
  let z=-D/2+Math.max(0,-exc)/2;const pieces=[];
  ws.forEach((w,i)=>{const z0=z,z1=z+w;z=z1+5;
   const segs=W>3000?[[-W/2,mid[i%2]-1.5],[mid[i%2]+1.5,W/2]]:[[-W/2,W/2]];
   segs.forEach(([a,b])=>{const L=Math.round(b-a);pieces.push(L);
    push({kind:'poly',name:`Доска настила №${i+1}: ${DT}×${Math.round(w)}×${L}${w<140?' (распустить)':''}`,role:'deck',pts:notchPoly(a,b,z0,z1,obst),y0:230,h:DT,mat:DECKS[cfg.deck].mat,layer:'floor',step:'deck',cat:DECKS[cfg.deck].cat,w,L,tint:((i*37)%7)/7});});
   if(cfg.deck!=='wpc')for(const x of JX)for(const dz of [-1,1])screws.push({type:'deck',p:[x,F+0.5,(z0+z1)/2+dz*(w/2-25)],n:[0,1,0]}); // ДПК — на скрытых кляймерах, сверху крепежа не видно
  });
  deckInfo={n:nb,pieces};
 }else box({name:'Пол: геотекстиль + щебень 20–40, слой 70 мм',role:'gravel',c:[0,-5,0],ax:[1,0,0],ay:[0,1,0],w:W-10,h:70,t:D-10,mat:'gravel',layer:'floor',step:'deck',cat:'gravel'});

 // брус стойки шире ножки: балки и доски заводят сбоку под нависающий брус, сверху они только садятся на место
 if(TM)for(const p of parts)if(['bottom','deck'].includes(p.step)&&!p.mount){p.mount=[0,1,0];p.mountLen=p.step==='deck'?50:70;}

 /* ---- 6. борта: сварные секции; у стоек — стяжные болты, у входа — своя стойка 40×40 ---- */
 const Bb=isFloor?F+60:150,bays=[];
 // брус: секции — из бруса на тех же стяжных болтах, к стойкам из бруса; грань стойки дальше от оси, у входа — стойка 100×100 над стальной ножкой
 const PST_=TM?WPOST:POST,pf=TM?30+bP/2:60,ph=TM?bP/2:30,nh=TM?50:20;
 if(RH.back)bays.push({k:'back',n:'задний',axis:'x',pc:ZP[nl],out:-1,f:-(W/2-pf),t:W/2-pf,H:RH.back,ends:[PST_[`${nl}-1`],PST_[`${nl}1`]]});
 if(hasDoor){bays.push({k:'frontL',n:'передний левый',axis:'x',pc:ZP[0],out:1,f:-(W/2-pf),t:-(E/2+20+nh),H:RH.front,ends:[PST_['0-1'],null],newel:NX[0]});
  bays.push({k:'frontR',n:'передний правый',axis:'x',pc:ZP[0],out:1,f:E/2+20+nh,t:W/2-pf,H:RH.front,ends:[null,PST_['01']],newel:NX[1]});}
 {const bk=bays.find(b=>b.k==='back');if(bk&&bk.t-bk.f>Math.min(2950,TR.L-120)){bays.splice(bays.indexOf(bk),1);
  bays.push(Object.assign({},bk,{k:'backL',n:'задний левый',t:0,ends:[bk.ends[0],'mid']}),Object.assign({},bk,{k:'backR',n:'задний правый',f:0,ends:['mid',bk.ends[1]]}));}}
 for(const [sx,key,nm] of [[-1,'left','левый'],[1,'right','правый']])if(RH[key])for(let i=0;i<nl;i++)bays.push({k:`${key}${i}`,n:`${nm} ${i+1}`,axis:'z',pc:sx*XP,out:sx,f:ZP[i+1]+ph,t:ZP[i]-ph,H:RH[key],ends:[PST_[`${i+1}${sx}`],PST_[`${i}${sx}`]]});
 const fillInfo=[],MIDS={},TK=TM?woodKit(X,cfg):null,ST=TM?25:10,CG=TM?3:0,clampY=(y,az)=>TM?Math.max(y,yS+CAP+(az?228:120)):y;   // выше болтов ножки, друг с другом не встречаются
 const stile=(o)=>TM?TK.tmb(Object.assign({},o,{sec:'w50x50',sx:50,sy:50,name:o.name.replace('40×20','50×50')})):tube(o);
 for(const r of bays){const pN=parts.length;
  const A=r.axis==='x'?[1,0,0]:[0,0,1],Pp=r.axis==='x'?[0,0,1]:[1,0,0],ai=r.axis==='x'?0:2;
  const pt=(al,y,pe)=>add(add(mul(A,al),[0,y,0]),mul(Pp,pe));
  const top=F+r.H,md=mod('rail_'+r.k,`Секция борта: ${r.n}`),st='railframe',inner=[0,0];
  for(const e of [0,1]){
   const fc=e?r.t:r.f,sg=e?-1:1;
   if(r.ends[e]==='mid'){ // стык двух половин секции: стойки 40×20 вплотную, 2 стяжных болта
    const c0=fc+sg*(ST+0.5),stl=stile({name:`Стойка секции 40×20 (борт ${r.n}, у стыка)`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
    (MIDS[r.pc]=MIDS[r.pc]||[]).push(stl);inner[e]=fc+sg*(2*ST+1);
    if(MIDS[r.pc].length===2)for(const y of [Bb+85,top-95])bolt({d:8,p:pt(-(2*ST+1),y,r.pc),dir:A,grip:4*ST+2,thru:MIDS[r.pc],step:st,joint:'стык половин задней секции'});
   }else if(r.ends[e]){
    const c0=fc+sg*(ST+CG);
    const stl=stile({name:`Стойка секции 40×20 (борт ${r.n})`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
    for(const y of (r.axis==='x'?[Bb+85,top-95]:[Bb+115,top-65]))pbAdd(r.ends[e],ai,pt(c0,clampY(y,r.axis==='z'),r.pc),stl,Math.min(fc,fc+sg*(2*ST+CG)),Math.max(fc,fc+sg*(2*ST+CG)),'railframe','секция борта — стойка портала (стяжной болт)',8);
    inner[e]=fc+sg*(2*ST+CG);
   }else{
    // стойка входа — мини-стойка на своём столбике, ставится после выверки каркаса: пластина 120×120×8 на 2 шпильках M12 поперёк борта
    // держит момент от нажима на поручень; с полом — ещё 2 вварных языка под переднюю балку пола (она разрезана у стоек входа),
    // ставится первой в шаге «Каркас пола», на ножках — перед своей секцией. Секция прижимается к ней стойкой 40×20 на два стяжных болта
    const xn=r.newel,nst=isFloor?'bottom':'railframe',nmd=mod('newel_'+r.k,`Стойка входа: ${r.n}`),nq=parts.length;
    if(FW){const nw=newelOnSill(X,TK,{xn,z:r.pc,top,bP,nst,nmd,A,name:r.n,pt,ax:Pp});for(let q=nq;q<parts.length;q++)if(parts[q].module===nmd||parts[q].role==='postW')parts[q].seq=-1;
     const c0=xn+sg*(nh+ST+CG),stl=stile({name:`Стойка секции 40×20 (борт ${r.n}, у входа)`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
     for(const y of [Bb+85,top-95])pbAdd(nw,ai,pt(c0,clampY(y),r.pc),stl,Math.min(xn+sg*nh,xn+sg*(nh+2*ST+CG)),Math.max(xn+sg*nh,xn+sg*(nh+2*ST+CG)),'railframe','секция борта — стойка входа (стяжной болт)',8);
     inner[e]=xn+sg*(nh+2*ST+CG);continue;}
    pillar(xn,ZP[0],{name:'Столбик под стойку входа Ø200',studs:[-40,40].map(dz=>[xn,ZP[0]+dz,86,[-205,47,71],[[-195,3],[57,3],[68,3]]])}); // как у стоек с пластиной 8 мм
    const nw0=tube({name:`${TM?'Ножка стойки входа':'Стойка входа'} 40×40 (${r.n})`,role:'newel',sec:'40x40x2',a:pt(xn,68,r.pc),b:pt(xn,TM?yS:top,r.pc),up:A,sx:40,sy:40,caps:[false,!TM],step:nst,layer:'rail',module:nmd,ends:['низ','верх']});
    let nw=nw0;
    if(TM){TK.postBase({x:xn,z:r.pc,y:yS+CAP,u:[1,0,0],n:[0,0,1],b:100,step:nst,md:nmd,layer:'rail'});
     nw=TK.tmb({name:`Стойка входа из бруса 100×100 (${r.n})`,role:'postW',sec:'w100x100',a:pt(xn,yS+CAP,r.pc),b:pt(xn,top,r.pc),up:[0,0,1],step:nst,layer:'rail',ends:['низ','верх'],note:'верхний торец — под срез с уклоном или колпачок'});nw.seq=-1;}
    const pl=box({name:'Опорная пластина стойки входа 120×120×8',role:'newelPlate',c:pt(xn,64,r.pc),ax:[1,0,0],ay:[0,0,1],w:120,h:120,t:8,mat:'steel',cat:'plate6',step:nst,module:nmd,layer:'rail'});
    for(const dz of [-40,40])pl.holes.push({x:0,y:dz,d:14});
    ringWeld(pt(xn,68,r.pc),[1,0,0],[0,0,1],40,40,'Шов стойка входа — пластина',nst,nmd);
    if(!X.fnd)box({name:'Подливка под опорную пластину (пескобетон)',role:'grout',c:[xn,52.5,ZP[0]],ax:[1,0,0],ay:[0,1,0],w:130,h:15,t:130,mat:'grout',layer:'found',step:nst,cat:'concrete'});
    if(isFloor)for(const s2 of [-1,1]){const tg=tongue({name:'Язык балки пола 50×40×6 (вварен в стойку входа)',c:[xn+s2*45,160,ZP[0]],ax:[1,0,0],ay:[0,1,0],root:[xn+s2*20,160,ZP[0]],md:nmd,step:nst});
     const fb=FB[0].find(p=>Math.min(p.o[0],p.o[0]+p.az[0]*p.L)<=xn+s2*45&&Math.max(p.o[0],p.o[0]+p.az[0]*p.L)>=xn+s2*45);
     bolt({d:8,p:[xn+s2*45,160,ZP[0]-20],dir:[0,0,1],grip:40,thru:[fb,tg],step:'bottom',joint:'балка пола — стойка входа (язык в пропил)'});}
    for(let q=nq;q<parts.length;q++)if(parts[q].module===nmd)parts[q].seq=-1; // в своём шаге — раньше балок и секции
    const c0=xn+sg*(nh+ST+CG),stl=stile({name:`Стойка секции 40×20 (борт ${r.n}, у входа)`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
    for(const y of [Bb+85,top-95])pbAdd(nw,ai,pt(c0,clampY(y),r.pc),stl,Math.min(xn+sg*nh,xn+sg*(nh+2*ST+CG)),Math.max(xn+sg*nh,xn+sg*(nh+2*ST+CG)),'railframe','секция борта — стойка входа (стяжной болт)',8);
    inner[e]=xn+sg*(nh+2*ST+CG);
   }
  }
  const rails=TM?[{sec:'w50x100',w:100,h:50,yc:top-25,name:'Поручень 50×100',role:'railTop'},{sec:'w50x50',w:50,h:50,yc:Bb+25,name:'Нижний брус 50×50',role:'railBot'}]:[{sec:'40x40x2',h:40,yc:top-20,name:'Поручень 40×40',role:'railTop'},{sec:'40x20x2',h:20,yc:Bb+10,name:'Нижний брус 40×20',role:'railBot'}];
  if(top-Bb>700)rails.push(TM?{sec:'w50x50',w:50,h:50,yc:Math.round((top+Bb)/2),name:'Средний брус 50×50',role:'railMid'}:{sec:'40x20x2',h:20,yc:Math.round((top+Bb)/2),name:'Средний брус 40×20',role:'railMid'});
  const railY=rails.map(x=>x.yc);
  for(const rl of rails){
   if(TM){TK.tmb({name:`${rl.name} (борт ${r.n})`,role:rl.role,sec:rl.sec,a:pt(inner[0],rl.yc,r.pc),b:pt(inner[1],rl.yc,r.pc),up:[0,1,0],sx:rl.w,sy:rl.h,step:st,layer:'rail',module:md});C.sc8+=2;continue;}
   tube({name:`${rl.name} (борт ${r.n})`,role:rl.role,sec:rl.sec,a:pt(inner[0],rl.yc,r.pc),b:pt(inner[1],rl.yc,r.pc),up:[0,1,0],sx:40,sy:rl.h,step:st,layer:'rail',module:md});
   for(const e of [0,1])ringWeld(pt(inner[e],rl.yc,r.pc),[0,1,0],Pp,rl.h,40,'Шов брус — стойка секции',st,md);
  }
  const runLen=r.t-r.f,h=top-Bb,outF=r.pc+r.out*(TM?25:20),ay=mul(Pp,r.out);
  const fi={run:r.k,n:r.n,len:runLen,h,pieces:0};
  if(cfg.fill==='prof'){
   push({kind:'sheet',profile:'C8',name:`Профнастил С8 (борт ${r.n}, ${Math.round(runLen)}×${Math.round(h)})`,role:'fillSheet',o:pt(r.f+(TM?4:0),Bb,outF),ax:A,ay,az:[0,1,0],W:runLen-(TM?8:0),L:h,mat:'fill',layer:'rail',step:'fill',cat:'c8'});
   for(const y of railY)for(let uu=29;uu<runLen;uu+=230)screws.push({type:'fill',p:add(pt(r.f+uu,y,outF),mul(ay,0.6)),n:ay});
  }else{
   const Wd=cfg.fill==='euro'?118:95,gap=cfg.fill==='euro'?47:30;
   const n=Math.max(1,Math.floor((runLen+gap)/(Wd+gap))),tot=n*Wd+(n-1)*gap,st0=r.f+(runLen-tot)/2;
   fi.pieces=n;
   for(let i=0;i<n;i++){
    const a0=st0+i*(Wd+gap);
    if(cfg.fill==='euro')push({kind:'sheet',profile:'EURO',name:`Штакетник 118 × ${Math.round(h)} (борт ${r.n})`,role:'picket',o:pt(a0,Bb,outF),ax:A,ay,az:[0,1,0],W:Wd,L:h,mat:'fill',layer:'rail',step:'fill',cat:'euro'});
    else box({name:`Штакетина 20×95 × ${Math.round(h)} (борт ${r.n})`,role:'plank',c:add(pt(a0+Wd/2,Bb+h/2,outF),mul(ay,10)),ax:A,ay:[0,1,0],w:Wd,h,t:20,mat:'woodFill',layer:'rail',step:'fill',cat:'plank',tint:((i*29)%5)/5});
    for(const y of railY)for(const dx of [-1,1])screws.push({type:cfg.fill==='euro'?'fill':'wood',p:add(pt(a0+Wd/2+dx*(Wd/2-22),y,outF),mul(ay,cfg.fill==='euro'?18.6:20.5)),n:ay});
   }
  }
  fillInfo.push(fi);
  for(let q=pN;q<parts.length;q++)if(['railframe','fill'].includes(parts[q].step)&&!/^newel_/.test(parts[q].module||''))parts[q].mount=mul(Pp,r.out); // секцию и заполнение подносят снаружи; стойку входа — сверху
 }
 pbFinish();

 X.capAll();
 // мебель для масштаба
 const dec=(name,c,w,h,t,mat)=>box({name:name+' — для масштаба, в смету не входит',role:'decor',c,ax:[1,0,0],ay:[0,1,0],w,h,t,mat:mat||'woodFill',layer:'decor',step:'finish',cat:null});
 const tl=Math.min(1800,W-1100),tz=-D*0.06,bz=Math.min(620,(D-900)/2-150);
 if(tl>700&&bz>400){dec('Стол',[0,F+735,tz],tl,30,750);for(const sx of [-1,1])for(const sz of [-1,1])dec('Ножка стола',[sx*(tl/2-80),F+360,tz+sz*300],60,720,60);
  for(const z of [tz-bz,tz+bz]){dec('Скамья',[0,F+445,z],tl,35,320);for(const sx of [-1,1])dec('Ножка скамьи',[sx*(tl/2-100),F+214,z],60,428,260);}}
 const BK=FW?WFL.K:X.fnd?buildBaseRect(X,cfg,{XP,ZP,W,D,TR,isFloor}):null,y0=BK?BK.L.y0:FY,STR=isFloor&&F-y0>300?stairs(X,cfg,{FW,zf:ZP[0]+(FW?sillB/2:20),F,y0,beam:parts.find(p=>['floorBeam','sillX'].includes(p.role)&&Math.abs(p.o[2]-ZP[0])<1&&Math.min(p.o[0],p.o[0]+p.az[0]*p.L)<0&&Math.max(p.o[0],p.o[0]+p.az[0]*p.L)>0)}):null;
 if(STR)deckInfo.pieces.push(...STR.pcs);
 for(let i=0;i<4;i++)dec('Плитка дорожки',[((i%2)?-60:60),y0+(i===0?18:8),D/2+(STR?STR.run+250:0)+400+i*520],620,16,420,'grout');

 const steps=mkSteps(parts,cfg);
 const model={cfg,parts,screws,F,ZP,hb,Bb,RH,isFloor,gable,type:cfg.type,cov,hasDoor,steps,C,fillInfo,W,D,H,nP,sP,MODS,ang:cfg.ang,roofQty,E,split,Yj,L45,
  free:!!X.fnd,base:X.fnd?baseInfo(BK,X,cfg):null,y0,FW,sillB,mat:cfg.mat,wood:cfg.wood,bP,yS,Lw,RHT,heelS:$.heelS||(W>3200?6:4),zBolt:!!$.zBolt,zOff:WD&&PG?(ZP[1]-ZP[nl])*tb-(bP>=150?130:105)-4-bP:0,wPur:$.wPur||'',wBr:!!$.wBr,beam:BM_,truckSpec:TR,deck:deckInfo,rows,Lr,pg:PG?{wp:PGR.wp,k:PGR.k,step:cov==='pcm'?Math.min(COVERS.pcm.step,$.purStep||1e9):Math.min(700,$.pcStep||1e9)}:null,pgOv:PG?PGR.ov:0,ovhL,ovhR,postSec:PSEC,spigotSec:SPG,baseFixed:/^fixed/.test($.base||''),baseT:BT,studs88:!!$.studs88,
  joistStep:isFloor?(W-160)/(Math.ceil((W-160)/(cfg.deck==='wpc'?400:500))):0,floorSpan:isFloor?FSP:0,slopeBack:PG,ovh:gable?ovh:Math.max(ovhL,ovhR),ovhZ,
  dims:{headroom:H,top:Math.max(ridgeY,apexY)+20,apex:apexY,eave:gable?F+H:yB(-W/2),door:E,yLow:F+H,yHigh:gable?F+H:PG?yB(0,0):yB(W/2)}};
 return finalize(model);
}

function mkSteps(parts,cfg){
 const TR=TRUCKS[cfg.truck],gable=cfg.type==='gable';
 const steps=STEPS.filter(s=>s.id==='shop'||s.id==='truck'||(s.id==='brace'&&cfg.fnd!=='pillar')||parts.some(p=>p.step===s.id)).map(s=>Object.assign({},s));
 steps.forEach(s=>{
  const wd=cfg.mat!=='steel';
  if(s.id==='heads')s.t=wd?(gable?'Фермы из бруса':cfg.type==='mono'?'Балки вдоль':'Балки порталов'):gable?'Порталы с фермами':'Оголовки порталов';
  if(s.id==='sides')s.t=TYPES[cfg.type].poly?(wd?'Обвязка из бруса':'Обвязка с подкосами'):wd?(cfg.type==='mono'?'Балки по скату':'Балки вдоль'):'Боковые связи';
  if(s.id==='brace'&&wd)s.t='Выверка, подкосы, протяжка';
  if(s.id==='shop'&&wd)s.t=cfg.mat==='timber'&&cfg.base==='floor'?'Мастерская: заготовка бруса':'Мастерская: брус и сталь';
  if(s.id==='purlins'&&wd&&cfg.type==='pergola')s.t='Кровельные щиты из бруса';
  if(s.id==='posts'&&wd)s.t=cfg.mat==='timber'&&cfg.base==='floor'?'Стойки из бруса':'Ножки и стойки из бруса';
  if(s.id==='purlins'&&cfg.type==='pergola')s.t='Кровельные щиты';
  const cv=cfg.cover,poly=!!TYPES[cfg.type].poly;
  if(s.id==='roofDeck')s.t='Сплошной настил OSB-3';
  if(s.id==='roofEdge')s.t=cv==='pc'?'Основания соединительных профилей':'Карнизные и ветровые планки';
  if(s.id==='roof')s.t={tile:'Листы металлочерепицы',c20:'Листы профнастила',falc:'Панели кликфальца',ondulin:'Листы ондулина',pcm:'Листы монолитного поликарбоната',pc:'Листы поликарбоната с торцевыми профилями',shingle:'Гибкая черепица'}[cv];
  if(s.id==='roofTrim')s.t=cv==='shingle'?(poly?'Коньково-карнизная черепица по рёбрам, навершие':'Коньково-карнизная черепица по коньку'):cv==='pc'?'Крышки профилей и боковые торцы':poly?'Коньковые планки по рёбрам, навершие':cfg.type==='gable'?'Уплотнитель, конёк, торцевые планки':'Торцевые планки';
  if(s.id==='deck')s.t=cfg.base==='floor'?'Настил пола':'Отсыпка пола';
  if(s.id==='found'&&cfg.fnd!=='pillar')s.t=cfg.fnd==='gas'?'Площадка и газоблоки':'Площадка: щебень и плиты';
  if(s.id==='ring'&&cfg.mat==='timber'&&cfg.base==='floor')s.t='Нижняя обвязка из бруса';
  if(s.id==='truck')s.t=`Погрузка: ${TR.t}`;
  s.count=parts.filter(p=>p.step===s.id&&!['bolt','weld'].includes(p.kind)&&!['decor','capPlate'].includes(p.role)).length;
  s.bolts=parts.filter(p=>p.step===s.id&&p.kind==='bolt').length;
  s.welds=parts.filter(p=>p.step===s.id&&p.kind==='weld').length;
 });
 return steps;
}
// для расчёта (лестница усилений) нужны детали и оформление; марки, модули, раскладка в кузове и сводки шагов — только итоговой модели (finish)
function finalize(model){
 dress(model,true);
 model.weldLen=model.parts.filter(p=>p.kind==='weld').reduce((s,p)=>s+p.len,0);
 return model;
}
function finish(model){
 if(model.dress&&model.dress.lite){model.dress=null;dress(model,false);model.verify=verify(model);}   // окна, свет и их крепёж — целиком; расчёт — с итоговыми скобами
 assignMarks(model);
 model.mods=modules(model);
 model.layout=layoutModules(model);
 model.stepInfo=stepInfo(model);
 return model;
}
