/* ---------------- деревянный каркас (всё, что выше пола, у hybrid и timber) ----------------
   Брус собирается на готовых стальных коннекторах для бруса: гнёзда из стали 2 мм под брус 100×100 или 150×150, порошковая окраска,
   брус вставляется и крепится глухарями 6×60. Без сварки дома и без пропилов. Поэтому стойки и балки — квадратного сечения, под размер гнезда.
   Подкосы — на врубке (15 мм) и 2 конструкционных саморезах: работают на сжатие, в каждом направлении ветра сжат свой подкос.
   Расстановка болтов — СП 64.13330.2017, п. 8.20 (пакет тоньше 10d): вдоль волокон ≥ 6d = 72 мм, поперёк ≥ 3d = 36 мм, от кромки ≥ 2,5d = 30 мм */
function woodKit(X,cfg){
 const WS=WOODS[cfg.wood],matOf=cfg.wood==='larch'?'timberL':cfg.wood==='pine'?'timberP':'timber';
 const tmb=o=>{const s=SEC[o.sec],p=X.tube(Object.assign({sx:s.b,sy:s.h},o,{caps:[false,false]}));p.wood=true;p.mat=matOf;p.rho=WS.rho;p.cat=woodCat(s.b,s.h,cfg.wood);p.notch=(o.notch||[]).map(q=>q.id);return p;};
 // гнездо коннектора: c — центр, u — ось бруса, v — вверх, n — поперёк; open — сверху открыто, брус опускают; cat — на одну стенку изделия, по ней считается смета
 const socket=o=>{const {c,u,v,n,b,h,L,step}=o,qs=o.rows===3?[-L*0.35,0,L*0.35]:[-L*0.3,L*0.3],nm=o.name||'Коннектор обвязки',m0=(X.grpN=(X.grpN||0)+1,{role:'wConn',mat:'steel',cat:null,module:'loose',layer:o.layer||'frame',step,seq:o.seq==null?1:o.seq,mount:o.mount||[0,1,0],mountLen:o.mountLen||60,why:o.why||'Держит брус в лотке, нагрузка уходит на опору. Брус опускают сверху, крепят глухарями.',grp:X.grpN,name:nm,size:`${L}×${h+4}×${b+4} мм`}),P_=(q)=>X.box(Object.assign({},m0,q));
  P_({cat:o.cat||null,c:add(c,mul(v,-(h/2+1))),ax:u,ay:n,w:L,h:b+4,t:2});
  for(const s of [-1,1])P_({c:add(c,mul(n,s*(b/2+1))),ax:u,ay:v,w:L,h:h+4,t:2});
  if(!o.open)P_({c:add(c,mul(v,h/2+1)),ax:u,ay:n,w:L,h:b+4,t:2});
  for(const s of [-1,1])for(const q of qs)for(const dy of [-h*0.25,h*0.25])X.screws.push({type:'lag',p:add(add(add(c,mul(u,q)),mul(v,dy)),mul(n,s*(b/2+2.6))),n:mul(n,s),st:o.sst||step});
  X.C.conn6+=qs.length*4;};
 // опорный коннектор: основание и гнездо вокруг низа стойки
 const postBase=o=>{const sq=o.seq==null?-1:o.seq,why='Низ стойки: гнездо на брус и опорная площадка. Держит стойку от отрыва и не даёт торцу стоять в воде.';X.box({name:`Коннектор опорный ${o.b}×${o.b}`,why,size:`площадка ${o.b+12}×${o.b+12}, гнездо ${o.b}×${o.b}`,role:'wHead',mat:'steel',cat:'plate6',c:[o.x,o.y-4,o.z],ax:o.n,ay:o.u,w:o.b+12,h:o.b+12,t:8,step:o.step,module:o.md,layer:o.layer||'frame',seq:sq});
  socket({name:`Коннектор опорный ${o.b}×${o.b}`,why,cat:'connBase',c:[o.x,o.y+60,o.z],u:[0,1,0],v:o.u,n:o.n,b:o.b,h:o.b,L:120,step:o.step,seq:sq,layer:o.layer,mount:[0,1,0]});};
 // цельный коннектор узла, как изделия LUVON: гнутая сталь 2 мм, гнездо на стойку снизу и открытые сверху лотки под балки. Балка опускается в лоток сверху
 // p — верх стойки на её оси; arms — лотки: d — направление в плане, sst — шаг, когда в лоток приходят глухари; там, где лотка нет, стоит глухая стенка
 const conn=o=>{const {p,b,step}=o,hb=b,Hs=b>=150?130:105,armL=b>=150?110:100,UP=[0,1,0],e1=o.e1||[1,0,0],e2=o.e2||[0,0,1],arms=o.arms||[];X.grpN=(X.grpN||0)+1;
  const base={role:'wConn',mat:'steel',cat:null,module:'loose',layer:o.layer||'frame',step,seq:o.seq==null?1:o.seq,mount:[0,1,0],mountLen:60,why:o.why,grp:X.grpN,name:o.name,size:o.size};
  let first=true;const P_=q=>{const r=X.box(Object.assign({},base,q,first&&o.cat?{cat:o.cat}:{}));first=false;return r;},scr=(pt,n,st)=>{X.screws.push({type:'lag',p:pt,n,st:st||step});X.C.conn6++;};
  // гнездо на стойку: четыре грани, глухари в разные горизонты, чтобы встречные не упирались
  [[e1,e2,0.2,0.6],[mul(e1,-1),e2,0.6,0.2],[e2,e1,0.4,0.8],[mul(e2,-1),e1,0.8,0.4]].forEach(([s,t,h1,h2])=>{P_({c:add(add(p,mul(s,b/2+1)),[0,-Hs/2,0]),ax:t,ay:UP,w:b+4,h:Hs,t:2});
   for(const [q,hh] of [[-0.25,h1],[0.25,h2]])scr(add(add(p,mul(s,b/2+2.6)),add(mul(t,q*b),[0,-Hs*hh,0])),s,step);});
  for(const a of arms){const d=a.d,nn=[-d[2],0,d[0]],end=b/2+(a.L||armL);
   for(const e of [-1,1]){const out=a.out?Math.sign(dot(mul(nn,e),a.out)):0,s0=o.miter?-out*(b/2+2)*Math.tan(o.miter):b/2;
    P_({c:add(add(p,mul(d,(s0+end)/2)),add(mul(nn,e*(b/2+1)),[0,hb/2-1,0])),ax:d,ay:UP,w:end-s0,h:hb+2,t:2});
    if(a.rows===3)for(const q of [0.3,0.55,0.8])for(const dy of [-0.25,0.25])scr(add(add(p,mul(d,end*q)),add(mul(nn,e*(b/2+2.6)),[0,hb/2+dy*hb,0])),mul(nn,e),a.sst);
    else for(const [q,dy] of [[0.28,e*0.22],[0.75,-e*0.22]])scr(add(add(p,mul(d,b/2+(end-b/2)*q)),add(mul(nn,e*(b/2+2.6)),[0,hb/2+dy*hb,0])),mul(nn,e),a.sst);}
   P_({c:add(add(p,mul(d,(b/2+end)/2)),[0,-1,0]),ax:d,ay:nn,w:end-b/2,h:b+4,t:2});
   if(a.rows!==3)for(const s of [-1,1])scr(add(add(p,mul(d,(b/2+end)/2)),add(mul(nn,s*b*0.25),[0,-2.6,0])),[0,-1,0],a.sst);}
  if(!o.miter)for(const s of [e1,mul(e1,-1),e2,mul(e2,-1)]){if(arms.some(a=>dot(a.d,s)>0.9))continue;const t=[-s[2],0,s[0]],low=o.low&&dot(o.low,s)>0.9,hc=low?hb-50:hb;P_({c:add(add(p,mul(s,b/2+1)),[0,hc/2,0]),ax:t,ay:UP,w:b+4,h:hc,t:2});}};
 // торцевой коннектор 100×100: U-образная чашка на грани стойки, балка входит в неё сверху. c — центр торца балки на грани, dir — вдоль балки от грани
 const cup=o=>{const {c,dir,b,step}=o,n=[dir[2],0,-dir[0]],len=100;X.grpN=(X.grpN||0)+1;
  const m0={role:'wConn',mat:'steel',cat:null,module:'loose',layer:'frame',step,seq:o.seq==null?1:o.seq,mount:[0,1,0],mountLen:60,why:o.why,grp:X.grpN,name:o.name,size:`${len}×${b+4}×${b} мм`};
  X.box(Object.assign({},m0,{cat:o.cat,c:add(add(c,mul(dir,len/2)),[0,-b/2-1,0]),ax:dir,ay:n,w:len,h:b+4,t:2}));
  const sd=[];for(const s of [-1,1]){sd.push(X.box(Object.assign({},m0,{c:add(add(c,mul(dir,len/2)),mul(n,s*(b/2+1))),ax:dir,ay:[0,1,0],w:len,h:b,t:2})));
   for(const [q,dy] of [[30,s*b*0.22],[72,-s*b*0.22]]){X.screws.push({type:'lag',p:add(add(add(c,mul(dir,q)),[0,dy,0]),mul(n,s*(b/2+2.6))),n:mul(n,s),st:o.sst||step});X.C.conn6++;}}
  if(o.bolts)for(const dy of [-20,20])X.bolt({d:12,p:add(add(c,mul(dir,78)),add(mul(n,-(b/2+2)),[0,dy,0])),dir:n,grip:b+4,thru:[o.beam,...sd],step:o.sst||step,joint:'балка вдоль — торцевой коннектор'});};
 return{WS,tmb,postBase,socket,conn,cup};
}
// наибольший шаг обрешётки 50×100 плашмя по прочности и прогибу L/150 (снег, mдл = 0,66)
function woodPurStep(L,Sg,c,g,WS,pur){const b=pur?50:100,h=pur==='e150'?150:pur==='e100'?100:50,R=WS.RA*WS.kR*WMS*WMV,Wm=b*h*h/6,I=b*h**3/12,E=WE*WMV,a=Sg*1.4*c+g*1.2,an=Sg*c+g;return Math.floor(Math.min(8e3*R*Wm/(L*L*a),384e3*E*I/(750*L**3*an))/10)*10;}

function woodRect(V){
 const {cfg,X,F,H,W,ZP,XP,nl,PN,SN,yB,CB,TB,nB,uB,hb,bw,beamSec,xa,xb,gable,PG,cb,sb,tb,POST,CAP,TM,FW,bP,yS,Lw,ovh,ybR,ycR,ytR,RHT,DP,E2s,slope,WPOST:WP,sP,TR,PSEC,SPG,wBr,heelS,zBolt}=V;
 const {C,screws}=X,{tmb,postBase,conn,cup}=woodKit(X,cfg),xE=0,MONO=!gable&&!PG,STEM=bP>=150?130:105,ARM=bP>=150?110:100;
 const LZmax=Math.round((sP-bP)/2-70),LZ=Math.min(Lw,LZmax);   // подкосы вдоль не встречаются в коротком пролёте
 const pw=bP,thB=100,secB='w100x100',NT=15,sB=FW?-1:1;   // ножка, опорный коннектор, стойка, верхний коннектор — снизу вверх
 // врубки на соседних гранях стойки не ставят на одну высоту: ослабляют угол и упираются друг в друга
 const BG=Math.ceil(thB*Math.SQRT2)+10,braceZ=d=>{if(Math.abs(d-LZ)>=BG)return LZ;const up=Math.round(d-BG),dn=Math.round(d+BG);return dn<=LZmax?dn:up;};
 // коннекторы прямоугольные, балка в лотке только горизонтальна: у «Модерна» на стойках лежат балки вдоль, а наклонные балки — на них; у перголы портальные балки горизонтальны, стойки разной высоты
 const bm=hb,top=(x,i)=>MONO?yB(x,i)-bP:yB(x,i),TEND={name:`Коннектор Т-образный ${bP}×${bP}`,cat:'connT',size:`${bP+2*ARM}×${bP+STEM}×${bP+4} мм`,why:'Цельная деталь: снизу гнездо на стойку, сверху лоток, в котором лежит балка. Держит балку на стойке от отрыва ветром и от сдвига.'};
 /* ---- стойки из бруса: снизу опорный коннектор, сверху цельный коннектор узла ---- */
 ZP.forEach((z,i)=>{for(const sx of [-1,1]){
  const x=sx*XP,tp=top(x,i),post=POST[`${i}${sx}`],key=`${i}${sx}`,end=i===0||i===nl;
  postBase({x,z,y:yS+CAP,u:[1,0,0],n:[0,0,1],b:bP,step:'posts',md:FW?'loose':post.module,seq:sB});if(FW)C.sc8+=4;
  WP[key]=tmb({name:`Стойка из бруса ${bP}×${bP} (${PN(i)}, ${SN(sx)})`,role:'postW',sec:`w${bP}x${bP}`,a:[x,yS+CAP,z],b:[x,tp,z],up:[0,0,1],step:'posts',seq:sB+1,ends:['низ','верх'],note:'торцы пропитать составом для торцов'});
  const p=[x,tp,z];
  if(gable)conn({p,b:bP,arms:[{d:[-sx,0,0],sst:'heads'},...(i>0?[{d:[0,0,1],sst:'sides'}]:[]),...(i<nl?[{d:[0,0,-1],sst:'sides'}]:[])],low:[sx,0,0],step:'posts',seq:sB+2,name:`${end?'Коннектор угловой':'4-лучевой коннектор'} ${bP}×${bP}`,cat:end?'conn3':'conn4',size:end?`${bP+ARM+5}×${bP+STEM}×${bP+ARM+5} мм`:`${bP+2*ARM+5}×${bP+STEM}×${bP+ARM+5} мм`,why:'Цельная деталь на верху стойки: стойка входит снизу, затяжка фермы и балки вдоль ложатся в лотки сверху.'});
  else conn(Object.assign({p,b:bP,arms:(MONO?[[0,0,1],[0,0,-1]]:[[1,0,0],[-1,0,0]]).map(d=>({d,sst:'heads'})),step:'posts',seq:sB+2},TEND));
 }});
 /* ---- балки и фермы поперёк, по порталам ---- */
 const zz=(v,z)=>[v[0],v[1],z],xe=W/2+xE,PB=[];   // затяжка кончается внутри коннектора; W ≤ 3 м входит в одну заготовку 3 м
 ZP.forEach((z,i)=>{
  const yU=x=>yB(x,i);
  let beam;
  if(gable){
   const yT=F+H+bm;
   beam=tmb({name:`Затяжка фермы ${bw}×${bm} (${PN(i)})`,role:'portalBeam',sec:beamSec,a:[-xe,F+H+bm/2,z],b:[xe,F+H+bm/2,z],up:[0,1,0],step:'heads',ends:['лев.','прав.']});
   const king=tmb({name:'Бабка фермы 100×100',role:'kingPost',sec:'w100x100',a:[0,yT,z],b:[0,ytR(50)-DP/cb-6,z],up:[0,0,1],layer:'roofframe',step:'heads',ends:['низ','верх']});
   for(const sx of [-1,1]){
    const n=[sx*sb,cb,0],raf=tmb({name:`Стропило фермы ${bw}×${RHT} (${sx<0?'левое':'правое'})`,role:'rafter',sec:`w${bw}x${RHT}`,a:[sx*50,ycR(50),z],b:[sx*(W/2+ovh),ycR(W/2+ovh),z],up:n,cutA:{n:[1,0,0],p:[sx*50,0,0]},cutB:{n:[1,0,0],p:[sx*(W/2+ovh),0,0]},layer:'roofframe',step:'heads',ends:['конёк','свес'],notch:[beam],note:'на затяжке — посадочная врубка 30 мм; у конька — упор в бабку'});
    // пята: стропило сидит на затяжке врубкой 30 мм, распор держат конструкционные саморезы сверху, в два ряда
    for(let q=0;q<heelS/2;q++)for(const dz of [-25,25]){const xq=sx*(W/2-110-q*70);screws.push({type:'sc8',p:add(add([xq,ycR(xq),z+dz],mul(n,RHT/2)),[0,0,0]),n,st:'heads'});C.sc8++;}
    const x1=sx*Math.max(420,0.5*W/2),B0=[x1,ybR(x1),z],A0=[sx*50,yT+70,z],d=norm(sub(B0,A0));
    tmb({name:'Раскос фермы 100×100',role:'strut',sec:'w100x100',a:add(A0,mul(d,-60)),b:add(B0,mul(d,60)),up:[0,0,1],cutA:{n:[1,0,0],p:[sx*38,0,0]},cutB:{n:n,p:add(B0,mul(n,12))},layer:'roofframe',step:'heads',ends:['низ','верх'],notch:[king,raf],note:'врубки по 12 мм в бабку и в стропило'});
    C.sc8+=4;
   }
   C.sc8+=4;
  }else{
   beam=tmb({name:`Балка ${MONO?'по скату':'портала'} ${bw}×${bm} (${PN(i)})`,role:'portalBeam',sec:beamSec,a:zz(CB(xa,i),z),b:zz(CB(xb,i),z),up:nB,sx:bw,sy:bm,cutA:{n:[1,0,0],p:[xa,0,0]},cutB:{n:[1,0,0],p:[xb,0,0]},step:MONO?'sides':'heads',ends:PG?['лев. вынос','прав. вынос']:['низ ската','верх ската']});
   if(MONO)for(const sx of [-1,1])for(const dz of [-25,25]){screws.push({type:'sc8',p:add(TB(sx*XP,i),[0,0,dz]),n:nB,st:'sides'});C.sc8++;}   // на балке вдоль: посадочная врубка по уклону, 2 самореза
  }
  PB[i]=beam;
  for(const sx of [-1,1]){
   // подкос поперёк: снизу в грань стойки, сверху под балку
   const xf=sx*(XP-pw/2),yA=yU(xf)-Lw,tt=(yU(xf)-yA)/(1+sx*slope),A0=[xf,yA,z],B0=[xf-sx*tt,yA+tt,z],dir=norm([-sx,1,0]);
   const br=tmb({name:'Подкос из бруса (поперёк)',role:'wBrace',sec:secB,a:add(A0,mul(dir,-90)),b:add(B0,mul(dir,90)),up:[0,0,1],sx:100,sy:thB,cutA:{n:[1,0,0],p:[xf+sx*NT,0,0]},cutB:{n:nB,p:add(B0,mul(nB,15))},step:'brace',ends:['низ','верх'],notch:[beam,WP[`${i}${sx}`]],note:'врубка 15 мм в балку и в стойку'});br.mount=[0,0,i===nl?-1:1];br.mountLen=320;
   C.sc8+=4;
  }
  if(!gable&&!PG)E2s[0]=add(TB(xa),mul(nB,DP));
 });
 /* ---- балки вдоль и подкосы вдоль ---- */
 const bz=(sx,xs,pi,dz,yU,beam)=>{   // подкос вдоль: снизу в грань стойки, сверху под балку вдоль
  const zP=ZP[pi]+dz*pw/2,LZi=braceZ(yU-(yB(xs-sx*pw/2,pi)-Lw)),A0=[xs,yU-LZi,zP],B0=[xs,yU,zP+dz*LZi],dir=norm([0,1,dz]);
  const br=tmb({name:'Подкос из бруса (вдоль)',role:'wBrace',sec:secB,a:add(A0,mul(dir,-90)),b:add(B0,mul(dir,90)),up:[1,0,0],sx:100,sy:thB,cutA:{n:[0,0,1],p:[0,0,zP-dz*NT]},cutB:{n:[0,1,0],p:[0,yU+15,0]},step:'brace',ends:['низ','верх'],notch:[beam,WP[`${pi}${sx}`]],note:'врубка 15 мм в балку и в стойку'});br.mount=[sx,0,0];br.mountLen=320;
  C.sc8+=4;};
 for(const sx of [-1,1]){const xs=sx*XP;
  if(MONO){   // сплошная балка поверх стоек, с выпуском за крайние: лоток Т-коннектора должен быть занят с обеих сторон
   const yT=top(xs,0),ext=bP/2+ARM+4,pcs=cutsAt(ZP[nl]-ext,ZP[0]+ext,ZP.slice(1,-1).slice().reverse(),3000).map(([p0,p1],q,arr)=>({a:p0,b:p1,t:tmb({name:`Балка вдоль ${bP}×${bP}`,role:'sideBeam',sec:`w${bP}x${bP}`,a:[xs,yT+bP/2,p0+(q?1:0)],b:[xs,yT+bP/2,p1-(q<arr.length-1?1:0)],up:[0,1,0],step:'heads',ends:['зад','перед']})}));
   ZP.forEach((z,i)=>{for(const c of pcs)if(z>=c.a-1&&z<=c.b+1)PB[i].notch.push(c.t.id);});
   const at=z=>(pcs.find(c=>z>=c.a&&z<=c.b)||pcs[0]).t;
   for(let i=0;i<nl;i++)for(const [dz,pi] of [[1,i+1],[-1,i]])bz(sx,xs,pi,dz,yT,at(ZP[pi]+dz*(pw/2+Lw/2)));
  }else for(let i=0;i<nl;i++){
   const zb=ZP[i+1]+bP/2+(PG?1:2),zf=ZP[i]-bP/2-(PG?1:2),yT=PG?Math.min(top(xs,i),top(xs,i+1))-STEM-4:F+H+bP,yc=yT-bP/2;   // у перголы стойки разной высоты: балка вдоль горизонтальна, в торцевых коннекторах ниже верхнего узла
   const beam=tmb({name:`Балка вдоль ${bP}×${bP}`,role:'sideBeam',sec:`w${bP}x${bP}`,a:[xs,yc,zb],b:[xs,yc,zf],up:[0,1,0],step:'sides',ends:['зад','перед']});
   if(PG)for(const [zF,dz] of [[ZP[i+1]+bP/2,1],[ZP[i]-bP/2,-1]])cup({c:[xs,yc,zF],dir:[0,0,dz],b:bP,beam,bolts:zBolt,step:'posts',seq:sB+2,sst:'sides',cat:'connE',name:`Торцевой коннектор ${bP}×${bP}`,why:'U-образная чашка на грани стойки: балка вдоль опускается в неё сверху. Связывает порталы между собой.'});
   for(const [dz,pi] of [[1,i+1],[-1,i]])bz(sx,xs,pi,dz,yT-bP,beam);
  }}
}

/* ---------------- проверка деревянного каркаса — СП 64.13330.2017 ----------------
   R = Rᴬ·mдл·mв: снег mдл = 0,66, ветер — 0,8; φ — ф. (13), (14); сжатие с изгибом — ф. (37), (38);
   болт с пластинами снаружи — табл. 18 и п. 8.14, 8.16, 8.18: на шов смятие среднего элемента 0,5cd·kα·mдл·mв, изгиб 3,1d²·√(kα·mдл·mв) */
function verifyWood(c){
 const {m,row,kN,kNm,MPa,mm,Sd,S,muL,gR,ca,step,q,cfUp,Wup,G,Hx,Hz,Nmax,nPost,morePortals,ladder}=c,WS=WOODS[m.wood],TM=true,N_=m.poly||0;
 const Rb=d=>WS.RA*WS.kR*d*WMV,Rt=d=>WS.Rt*WS.kR*d*WMV*0.8,Rs=d=>WS.Rs*d*WMV,Rl=d=>4.5*WS.kR*d*WMV*(d>=WMW?1.15:1),E=WE*WMV,gW=gR+0.1; // +0,1 кПа — своя масса обрешётки и стропил
 const phi=l=>l<=70?1-0.8*(l/100)**2:3000/(l*l),sw=(b,h)=>({A:b*h,W:b*h*h/6,I:b*h**3/12,b,h});
 const boltT=(d,b,md,ka=1)=>{const c=b/10,D=d/10,k=md*WMV;return 2e3*Math.min(0.5*c*D*ka*k*WS.kR,3.1*D*D*Math.sqrt(ka*k*WS.kR));};   // стальные пластины снаружи: средний элемент 0,5cd, 2 шва
 const rowsW=[];
 // обрешётка
 const prS=m.wPur==='e150'?[50,150]:m.wPur==='e100'?[50,100]:[100,50],prNext=m.wPur==='e150'?null:{wPur:m.wPur==='e100'?'e150':'e100'};
 if(!m.pg){const L=N_?2*(m.R+m.ovh)*Math.sin(Math.PI/N_):m.sP,s=sw(prS[0],prS[1]),qd=(Sd*muL+1.1*gW)*ca*step/1000,qn=(S*muL+gW)*ca*step/1000,qu=(1.4*q*Math.abs(cfUp)*1.2-0.9*gR*ca)*step/1000,M=qd*L*L/8,Mu=qu*L*L/8,f=5*qn*L**4/(384*E*s.I);
  row('Обрешётка и фермы',`Обрешётка ${m.wPur?`50×${prS[1]} на ребро`:'50×100 плашмя'}: пролёт ${mm(L)}, шаг ${mm(step)}`,Math.max(M/s.W/Rb(WMS),Mu/s.W/Rb(WMW),f/(L/150)),`σ ${MPa(M/s.W)} из ${MPa(Rb(WMS))}, прогиб ${mm(f)} (≤ L/150)`,'снег: mдл = 0,66, улица под навесом: mв = 0,85',m.cov!=='tile'&&step>260?{purStep:Math.max(250,Math.floor(step/Math.max(1.01,Math.sqrt(M/s.W/Rb(WMS)),f/(L/150))/10)*10)}:(prNext||(N_?c.steeper():morePortals())));
  const T=Math.max(0,qu*L/2);row('Узлы','Обрешётка к балке: отрыв на 2 самореза 6×120',T/(2*1200),kN(T),'вырыв из бруса при заглублении ≥ 60 мм ≈ 1,2 кН');}
 else{const wp=m.pg.wp,st=m.pg.step,s5=sw(50,50),Lc=wp-100,qc=(Sd+1.1*gW)*ca*st/1000,qcn=(S+gW)*ca*st/1000,M=qc*Lc*Lc/8,f=5*qcn*Lc**4/(384*E*s5.I),s1=sw(50,100),L=m.sP,qr=(Sd+1.1*gW)*wp/2/1000,qrn=(S+gW)*wp/2/1000,Mr=qr*L*L/8,fr=5*qrn*L**4/(384*E*s1.I);
  row('Обрешётка и фермы',`Поперечина щита 50×50: пролёт ${mm(Lc)}, шаг ${mm(st)}`,Math.max(M/s5.W/Rb(WMS),f/(Lc/150)),`σ ${MPa(M/s5.W)}, прогиб ${mm(f)}`,'');
  row('Обрешётка и фермы',`Стропило щита 50×100: пролёт ${mm(L)}`,Math.max(Mr/s1.W/Rb(WMS),fr/(L/200)),`σ ${MPa(Mr/s1.W)}, прогиб ${mm(fr)}`,'',morePortals());}
 const qp=(Sd*muL+1.1*gW)*(N_?m.side/2:m.sP)/1000,qpn=(S*muL+gW)*(N_?m.side/2:m.sP)/1000;
 if(m.gable){const W=m.W,fr=W/2*Math.tan(ang_(m)),Hh=qp*W*W/(8*fr),Ls=W/2/ca/2,r=sw(100,m.RHT),Nr=Hh/ca,lm=Ls/(0.289*m.RHT),ph=phi(lm),xi=Math.max(0.2,1-Nr/(ph*Rb(WMS)*r.A)),Mr=qp*ca*Ls*Ls/8,sg=Nr/r.A+Mr/(xi*r.W),fn=5*qpn*ca*Ls**4/(384*E*r.I);
  row('Обрешётка и фермы',`Стропило фермы 100×${m.RHT}: изгиб ${kNm(Mr)} + сжатие ${kN(Nr)}`,Math.max(sg/Rb(WMS),fn/(Ls/200)),`σ ${MPa(sg)} из ${MPa(Rb(WMS))}, прогиб ${mm(fn)}`,'расчётный пролёт — от пяты до раскоса',morePortals());
 const An=m.beam.b*(m.beam.h-30);row('Обрешётка и фермы',`Затяжка ${m.beam.b}×${m.beam.h}: распор ${kN(Hh)}`,Hh/An/Rt(WMS),`σ ${MPa(Hh/An)} из ${MPa(Rt(WMS))}`,'нетто — за вычетом посадочной врубки 30 мм; ослабление mо = 0,8',morePortals());
  {const nS=m.heelS,Ts=2560*Math.sqrt(WMS*WMV);row('Узлы',`Пята фермы: ${nS} саморезов 8×160 держат распор`,Hh/(nS*Ts),`${kN(Hh)} из ${kN(nS*Ts)}`,'срез самореза ≤ 4d² = 2,56 кН (СП 64, табл. 18) × √(mдл·mв); пластин в узле нет',nS<8?{heelS:8}:morePortals());}
  const Ns=qp*W/4,Lst=Math.max(...m.parts.filter(p=>p.role==='strut').map(p=>p.cutLen),400),ps=phi(Lst/28.9);row('Обрешётка и фермы',`Раскос фермы 100×100: сжатие ${kN(Ns)}, длина ${mm(Lst)}`,Ns/(ps*1e4*Rb(WMS)),'','',morePortals());}
 else if(N_){const hp=m.hip,r=sw(hp.b,hp.h),R=m.R,Lh=(R+m.ovh)/ca,purl=m.parts.filter(p=>p.role==='purlinP').length,Wt=(Sd+1.1*gW)*c.plan*1000,Hr=Wt/N_/2/Math.tan(ang_(m)),Nh=Hr/ca,qh=(Sd*muL+1.1*gW)*m.side/2/1000,Ls=Lh*0.66,Mh=qh*Ls*Ls/8,lm=Ls/(0.289*hp.h),ph=phi(lm),xi=Math.max(0.2,1-Nh/(ph*Rb(WMS)*r.A)),sg=Nh/r.A+Mh/(xi*r.W),fh=5*(S*muL+gW)*m.side/2/1000*ca*Ls**4/(384*E*r.I);
  row('Обрешётка и фермы',`Ребро шатра ${hp.b}×${hp.h}: изгиб ${kNm(Mh)} + сжатие ${kN(Nh)}`,Math.max(sg/Rb(WMS),fh/(Ls/200)),`σ ${MPa(sg)} из ${MPa(Rb(WMS))}, прогиб ${mm(fh)}`,'треугольная грузовая площадь; ребро раскрепляют обрешётка и настил',hp.h<200?{wHip:'w50x200'}:c.steeper());
  const T=Hr/(2*Math.sin(Math.PI/N_)),An=(m.bP-13)*m.bP;
  row('Обрешётка и фермы',`Балка обвязки ${m.bP}×${m.bP}: растяжение от распора ${kN(T)}`,T/An/Rt(WMS),`σ ${MPa(T/An)} из ${MPa(Rt(WMS))}`,'кольцо обвязки держит рёбра от разъезда',c.steeper());
  row('Узлы','Угол обвязки: гнездо коннектора на растяжение',T/10200,`${kN(T)} из 10,2 кН`,'12 глухарей 6×60 по 0,85 кН: гнездо 210 мм, коннектор замыкает кольцо',c.steeper());
  {const Aw=30*hp.b/Math.max(0.5,Math.cos(ang_(m))),Ra=Rb(WMS)/(1+(Rb(WMS)/Rl(WMS)-1)*Math.sin(ang_(m))**3),Ts=2560*Math.sqrt(WMS*WMV),Rv=Aw*Ra+4*Ts;row('Узлы',`Ребро на углу обвязки: врубка 30 мм + 4 самореза 8×160, ${kN(Nh)}`,Nh/Rv,`из ${kN(Rv)}`,'распор ребра садится во врубку, саморезы держат от сдвига и отрыва',c.steeper());}}
 else{const b=sw(m.beam.b,m.beam.h),Lb=m.W-2*(m.Lw+60),cL=(m.ovh||300)+60,M=Math.max(qp*Lb*Lb/8,qp*cL*cL/2),Q=qp*Lb/2,tau=1.5*Q/b.A,f=5*qpn*Lb**4/(384*E*b.I);
  row('Обрешётка и фермы',`Балка портала ${b.b}×${b.h}: пролёт ${mm(Lb)}, вылет ${mm(cL)}`,Math.max(M/b.W/Rb(WMS),tau/Rs(WMS),f/(Lb/200)),`σ ${MPa(M/b.W)} из ${MPa(Rb(WMS))}, τ ${tau.toFixed(2).replace('.',',')} МПа, прогиб ${mm(f)}`,'балка опирается на стойки и подкосы; сечение под коннектор: 100×100 или 150×150',b.h<150?{wPost:150}:morePortals());}
 // рамы: подкосы на сжатие, стойка — изгиб у подкоса
 const nFx=N_?N_/2:Math.max(2,m.nP-1),nFz=N_?N_/2:2*(m.nP-1),Lw=m.Lw,thB=N_?50:100,brUp=null;
 const postH=N_?m.yRb-m.F:m.H,yHinge=TM?m.yS+8:68,yb=m.F+postH-Lw-yHinge+(!N_&&!m.gable&&!m.pg?m.bP:0),Tu=Math.max(0,1.4*Wup*1.3-0.9*G)/nPost;
 for(const [H,nFr,lbl] of N_?[[Hx,nFx,'по кругу']]:[[Hx,nFx,'поперёк'],[Hz,nFz,'вдоль']]){
  const brZ=lbl==='вдоль'?m.parts.filter(p=>p.name==='Подкос из бруса (вдоль)').map(p=>p.cutLen):[],Lb0=brZ.length?Math.min(Lw,Math.min(...brZ)*Math.SQRT1_2-30):Lw,V=H/nFr/2,ybr=lbl==='вдоль'?yb+Lw-Lb0+(m.zOff||0):yb,Mn=V*ybr,Nb=Mn/Lb0/Math.SQRT1_2;
  if(TM){const b=m.bP,s=sw(b,b),l=2*ybr/(0.289*b),ph=phi(l),xi=Math.max(0.2,1-Nmax/(ph*Rb(WMW)*s.A)),kn=((b-15)/b)**2,sg=Nmax/s.A+Mn/(xi*s.W*kn);
   row('Каркас',`Стойка из бруса ${b}×${b}, ветер ${lbl}: N ${kN(Nmax)} + M ${kNm(Mn)}`,Math.max(sg/Rb(WMW),Nmax/(ph*s.A*Rb(WMS))),`σ ${MPa(sg)} из ${MPa(Rb(WMW))}, гибкость ${Math.round(l)}`,`шарнир на ${m.FW?'обвязке':'ножке'}, подкос сверху; устойчивость — μ = 2; ветер: mдл = 0,8`,b<150?{wPost:150}:morePortals());}
  const Lb=Lb0*Math.SQRT2+40,s=sw(100,thB),l=Lb/(0.289*thB),ph=phi(l),A=thB*15/Math.SQRT1_2,Ra=Rb(WMW)/(1+(Rb(WMW)/Rl(WMW)-1)*0.354);
  row('Каркас',`Подкос из бруса 100×${thB} (${lbl}): сжатие ${kN(Nb)}, длина ${mm(Lb)}`,Math.max(Nb/(ph*s.A*Rb(WMW)),Nb/A/Ra),`врубка 15 мм: смятие ${MPa(Nb/A)} из ${MPa(Ra)}`,'работает на сжатие: при смене ветра сжат другой подкос рамы',brUp||(m.bP<150?{wPost:150}:morePortals()));
  {const Vj=Math.hypot(V,Tu);row('Узлы',`Коннектор на стойке (${lbl}): ${kN(Vj)}`,Vj/6800,'из 6,8 кН','гнездо стали 2 мм, 8 глухарей 6×60 по 0,85 кН (СП 64, табл. 18); нагрузок изделий производители не публикуют',m.bP<150?{wPost:150}:morePortals());
   if(!N_&&lbl==='вдоль'){const Tz=Mn/Lb0,Rz=!m.pg?5100:m.zBolt?2*boltT(12,m.bP,WMW):3400;row('Узлы',`Балка вдоль в коннекторе: ${kN(Tz)}`,Tz/Rz,`из ${kN(Rz)}`,!m.pg?'6 глухарей 6×60 в лотке':m.zBolt?'2 болта M12 насквозь через чашку и балку':'4 глухаря 6×60 в чашке',m.pg&&!m.zBolt?{zBolt:1}:m.bP<150?{wPost:150}:morePortals());}}
  {const Vf=Math.hypot(V,Tu);row('Узлы',`Стойка в опорном коннекторе (${lbl}): ${kN(Vf)}`,Vf/6800,'из 6,8 кН','8 глухарей 6×60',m.bP<150?{wPost:150}:morePortals());
   if(!m.FW){const ss=secOf(m.postSec),Ms=V*(m.yS-68),uu=Ms/(ss.Wx*RY)+Nmax/(ss.A*RY);row('Каркас',`Стальная ножка ${m.postSec.replace(/x/g,'×')}: M ${kNm(Ms)} (${lbl})`,uu,'','консоль от опорной пластины',ladder());}}
 }
 if(!m.FW){const V=Math.max(Hx/nFx,Hz/nFz)/2,beta=m.baseFixed?1:0.5,bp=TM?V*(m.yS-68):V*yb*beta/2;c.setMb&&c.setMb(bp);const Tst=bp/90/2+Math.max(0,1.4*Wup-0.9*G)/nPost/4,Rst=m.studs88?34000:13500;
  row(m.free?'Основание':'Фундамент',`Шпильки M12 опорной пластины: момент ${kNm(bp)} + отрыв`,Tst/Rst,kN(Tst)+' на шпильку',m.studs88?'класс 8.8 ≈ 34 кН':'класс 4.8, As = 84 мм² ≈ 13,5 кН',m.studs88?morePortals():{studs88:true});}
 if(!N_)row('Узлы','Балка в лотке коннектора: отрыв ветром',Tu/5100,`${kN(Tu)} из 5,1 кН`,'6 глухарей 6×60 по 0,85 кН: глухарь работает на срез через стенку лотка',m.bP<150?{wPost:150}:morePortals());
 {const Ac=m.bP*m.bP*(N_?0.7:1);row('Узлы','Балка на стойке: смятие поперёк волокон',Nmax/Ac/Rl(WMS),`${MPa(Nmax/Ac)} из ${MPa(Rl(WMS))}`,'местное смятие в опорных частях, табл. 3, п. 4а',TM&&m.bP<150?{wPost:150}:(N_?c.steeper():morePortals()));}
 return{yb};
}
const ang_=m=>m.ang*RAD;

/* ---- шатёр: стойка уходит в коннектор угла, балки обвязки — в его гнёзда, ребро садится на угол врубкой между щёк ---- */
function woodPolyFrame(V){
 const {cfg,X,N,Vk,PHI,PSI,POST,WPOST,yRb,yRt,yS,CAP,TM,FW,bP,Lw,Cr,hipTop}=V;
 const {C}=X,{tmb,postBase,conn}=woodKit(X,cfg),sB=FW?-1:1;   // ножка, опорный коннектор, стойка, верхние гнёзда — снизу вверх
 for(let k=0;k<N;k++){
  const f=PHI(k),r=rv(f),t=tv(f),P=Vk(k),tp=yRb,post=POST[k];
  postBase({x:P[0],z:P[2],y:yS+CAP,u:r,n:t,b:bP,step:'posts',md:FW?'loose':post.module,seq:sB});if(FW)C.sc8+=4;
  WPOST[k]=tmb({name:`Стойка из бруса ${bP}×${bP} (${k+1})`,role:'postW',sec:`w${bP}x${bP}`,a:[P[0],yS+CAP,P[2]],b:[P[0],tp,P[2]],up:t,step:'posts',seq:sB+1,ends:['низ','верх'],note:'торцы пропитать составом для торцов'});
  // коннектор угла: гнездо на верх стойки и два гнезда под балки обвязки; угол не 90°, поэтому под заказ
  conn({p:[P[0],tp,P[2]],b:bP,e1:r,e2:t,miter:Math.PI/N,arms:[tv(PSI(k)),mul(tv(PSI(k-1)),-1)].map(d=>({d,L:160,rows:3,sst:'sides',out:r})),step:'posts',seq:sB+2,name:`Коннектор угла ${N}-гранника ${bP}×${bP}`,cat:'connP',size:`угол ${N===6?120:135}°, сталь 2 мм`,why:'Цельная деталь на верху стойки: стойка входит снизу, балки обвязки ложатся в лотки сверху. Угол не 90°, поэтому под заказ. Кольцо держит распор шатра, поэтому в каждый лоток 12 глухарей.'});
 }
 for(let j=0;j<N;j++){
  const k0=j,k1=(j+1)%N,c=tv(PSI(j)),nO=rv(PSI(j)),A=Vk(k0),B=Vk(k1),t0=tv(PHI(k0)),t1=tv(PHI(k1));
  const beam=tmb({name:`Балка обвязки ${bP}×${bP}`,role:'ring',sec:`w${bP}x${bP}`,a:add(A,[0,yRb+bP/2,0]),b:add(B,[0,yRb+bP/2,0]),up:[0,1,0],cutA:{n:t0,p:add(A,mul(t0,1))},cutB:{n:t1,p:add(B,mul(t1,-1))},step:'sides',ends:['торец','торец'],note:'торцы «на ус» по оси стойки'});
  for(const [k,dir,nm,sg] of [[k0,c,'n',1],[k1,mul(c,-1),'p',-1]]){
   // подкос в плоскости стороны: 50×100, врубка в балку и в грань стойки
   const fn=mul(tv(PHI(k)),sg),off=bP/2/Math.max(0.3,dot(dir,fn)),foot=add(Vk(k,yRb-Lw),mul(dir,off)),d=norm(add(dir,[0,1,0])),top=add(foot,add(mul(dir,Lw),[0,Lw,0]));
   const br=tmb({name:'Подкос из бруса 50×100',role:'wBrace',sec:'w50x100',a:add(foot,mul(d,-90)),b:add(top,mul(d,90)),up:nO,sx:100,sy:50,cutA:{n:fn,p:add(foot,mul(fn,-15))},cutB:{n:[0,1,0],p:[0,yRb+15,0]},step:'brace',ends:['низ','верх'],notch:[beam,WPOST[k]],note:'врубка 15 мм в балку и в грань стойки'});br.mount=nO;br.mountLen=320;
   C.sc8+=4;
  }
 }
}

/* ---------------- долговечность: факторный метод ISO 15686-1 ----------------
   Срок = опорный срок × A (материал) × B (конструктив) × C (качество работ) × E (среда) × G (обслуживание).
   Опорные сроки — оценка по классам применения EN 335/EN 350 (брус) и ISO 12944 / ISO 9223 C2–C3 (сталь с покраской, с обновлением).
   Это прогноз для сравнения вариантов, а не гарантия: он верен только при обслуживании по графику */
const RSL={steel:40,timberPost:{pine:20,glulam:25,larch:30},timberRoof:{pine:30,glulam:35,larch:42}};
const WA={pine:0.9,glulam:1.1,larch:1.15},DECK_L={pine:12,larch:20,wpc:25},GAS_L=14;  // GAS_L — оценка: газоблок под мастикой на плите, над землёй
const coverLife=c=>({tile:27,c20:27,falc:40,shingle:25,ondulin:18,pcm:17,pc:12}[c]||25);
function durability(m,b){
 const cfg=m.cfg,wood=cfg.wood,mat=cfg.mat||'steel',tw=(+String(m.postSec||'60x60x2').split('x').pop())||2,fT=tw>=4?1.35:tw>=3?1.2:1,C_=0.9,el=[];
 const ln=(n,life,note,lim,low)=>el.push({n,life:Math.round(life),note,lim:lim!==false,low:!!low});
 if(m.FW)ln(`Обвязка и балки пола из бруса (${WOODS[wood].s.toLowerCase()})`,RSL.timberPost[wood]*WA[wood]*0.9*C_*1.1,'над землёй на 150 мм, с вентиляцией снизу: B = 0,9; антисептик раз в 12 лет',true,true);
 else ln(mat==='steel'?'Стойки ниже настила, балки пола':mat==='timber'?'Стальные пяты стоек':'Стальные ножки и всё ниже настила',RSL.steel*fT*1.1*C_*0.85,'зона брызг и снега у земли: E = 0,85; подкрашивать по графику',true,true);
 if(mat==='steel')ln('Каркас и крыша (сталь)',RSL.steel*fT*1.1*C_,'закрытые торцы, дренаж стоек; краска — раз в 8 лет');
 if(mat!=='steel')ln(`Стойки из бруса (${WOODS[wood].s.toLowerCase()})`,RSL.timberPost[wood]*WA[wood]*1.3*C_*1.1,'торец над настилом, коннектор и свес от дождя: B = 1,3; масло раз в 4 года');
 if(mat!=='steel')ln(`Балки, фермы, обрешётка (${WOODS[wood].s.toLowerCase()})`,RSL.timberRoof[wood]*WA[wood]*1.2*C_*1.1,'под кровлей, без прямого дождя');
 if(m.free)ln(m.base.gas?'Столбики из газоблоков':'Рама основания в щебне',m.base.gas?GAS_L:RSL.steel*1.2*1.1*C_*0.8,m.base.gas?'только под гидроизоляцией и над землёй; без защиты блок размораживается за несколько зим':'щебень сушит трубу, но краска у земли стареет быстрее: E = 0,8',true,true);
 ln('Кровля',coverLife(m.cov),'заменяется отдельно, каркас остаётся',false);
 if(m.isFloor)ln('Настил',DECK_L[cfg.deck]||12,'доски меняются по одной',false);
 const stru=el.filter(e=>e.lim),lim=stru.reduce((a,e)=>e.life<a.life?e:a,stru[0]),top=stru.filter(e=>!e.low),limT=top.reduce((a,e)=>e.life<a.life?e:a,top[0]),low=stru.filter(e=>e.low).reduce((a,e)=>e.life<a.life?e:a);
 // обслуживание за 30 лет, ₽ — по ценам материалов сметы, своими руками
 const sum=f=>b.lines.filter(f).reduce((s,l)=>s+l.sum,0),paint=sum(l=>['paint','paint27','zinc','solvent'].includes(l.key)),oil=sum(l=>l.key==='woodOilExt'),anti=sum(l=>l.key==='antisept2'),roof=sum(l=>l.cat==='Кровля'),deck=m.isFloor?sum(l=>l.cat==='Пол'):0,maint=[];
 const add1=(n,every,rub)=>{const times=Math.max(0,Math.ceil(30/every)-1);if(times&&rub)maint.push({n,every,times,rub:Math.round(rub*times)});};
 add1('Подкраска стали',8,paint*(mat==='steel'?0.6:0.3));
 if(oil)add1('Масло по брусу, 2 слоя',4,oil);
 if(anti)add1('Антисептик',12,anti);
 add1('Замена кровли',coverLife(m.cov),roof);
 if(deck)add1('Замена настила',DECK_L[cfg.deck]||12,deck);
 if(m.free&&m.base.gas)add1('Замена газоблоков',GAS_L,sum(l=>['gasblock','gasGlue','gasMastic'].includes(l.key))+1500);
 const maint30=maint.reduce((s,x)=>s+x.rub,0);
 return{life:lim.life,lim:lim.n,lifeTop:limT.life,limTop:limT.n,lifeLow:low.life,elems:el,maint,maint30,own30:Math.round(b.total+maint30)};
}
