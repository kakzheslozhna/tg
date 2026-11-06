
/* ---------------- многогранная беседка (6 или 8 граней) ----------------
   Круглые стойки Ø76 (с опорной пластиной и вварными языками) → сварные рамы обвязки (ригель + 2 подкоса) на языках →
   рёбра шатра: низ — на язык на торце стойки, верх — на язык центрального узла. Обрешётка — кольцами по граням. */
const rv=f=>[Math.cos(f),0,Math.sin(f)],tv=f=>[-Math.sin(f),0,Math.cos(f)];
function clipHalf(pts,nx,nz,c){const out=[];for(let i=0;i<pts.length;i++){const A=pts[i],B=pts[(i+1)%pts.length],da=nx*A[0]+nz*A[1]-c,db=nx*B[0]+nz*B[1]-c;if(da<=0)out.push(A);if(da*db<0){const t=da/(da-db);out.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]);}}return out;}
const polyArea=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
function buildPoly(cfg){
 const TY=TYPES[cfg.type],N=TY.poly,cov=cfg.cover,TR=TRUCKS[cfg.truck];
 const Dc=cfg.W,H=cfg.H,isFloor=cfg.base==='floor',DT=cfg.deck==='wpc'?25:28,F=isFloor?230+DT:0,RH=RAILS[cfg.rail].h;
 const X=mkCtx(cfg),{parts,screws,C,MODS,push,mod,tube,angle,box,bolt,weld,ringWeld,tongue,pillar}=X;
 const fast=(type,p,n,st)=>screws.push({type,p,n,st});
 const WD=cfg.mat!=='steel',TM=WD,FW=cfg.mat==='timber'&&isFloor,WS=WOODS[cfg.wood],CAP=8,kit=WD?woodKit(X,cfg):null,$w=cfg.$||{},bP=WD?($w.wPost||100):0,yS=FW?222:isFloor?F+60:200,sillB=FW?Math.max(bP,$w.wSill||0):0,FY=FW&&!X.fnd?230-sillB-152:0;
 const pi=Math.PI,hN=pi/N,R=Dc/2-38,a=R*Math.cos(hN),side=2*R*Math.sin(hN);
 // уклон: ребро должно влезть в кузов
 let ovh=350;{const lim=TR.L-90;let ca=Math.cos(cfg.ang*RAD);if((R+ovh)/ca>lim)ovh=Math.max(150,lim*ca-R);while((R+ovh)/Math.cos(cfg.ang*RAD)>lim&&cfg.ang>TY.angR[0])cfg.ang--;}
 const al=cfg.ang*RAD,ca=Math.cos(al),sa=Math.sin(al),ta=Math.tan(al);
 const PHI=k=>pi/2+hN+2*pi*(((k%N)+N)%N)/N,PSI=j=>PHI(j)+hN;
 const V=(k,y=0)=>{const r=rv(PHI(k));return[r[0]*R,y,r[2]*R];};
 const yRb=F+H,yRt=F+H+(WD?bP:60),yH=WD?yRt-30:yRt+3,L45=Math.round(Math.min(450,side/2-170)),Lw=Math.round(Math.min(600,side/2-120));   // у дерева: ребро садится в угол обвязки врубкой 30 мм
 const yb=r=>yH+(R-r)*ta;                                                     // низ ребра на радиусе r
 const FRONT=N-1;
 const POST={},TNG={},WPOST={};

 /* ---- фундамент и стойки ---- */
 for(let k=0;k<N;k++){
  const f=PHI(k),r=rv(f),t=tv(f),P=V(k),md=mod(`post${k}`,`Стойка ${k+1}`);
  if(FW){POST[k]={o:[P[0],0,P[2]],module:md,id:-1};pillar(P[0],P[2],{fw:1,y0:FY,top:228-sillB,a:f,bell:(cfg.$||{}).bell,studs:[[P[0],P[2],224,[-205,206],[[-195,3],[203,3]]]]});continue;}
  pillar(P[0],P[2],{a:f,bell:(cfg.$||{}).bell,studs:[[-45,-45],[45,-45],[-45,45],[45,45]].map(([u,w])=>{const q=add(add(P,mul(r,u)),mul(t,w));return[q[0],q[2],86,[-205,49,71],[[-195,3],[59,3],[68,3]]];})});
  const top={n:norm([r[0]*ta,1,r[2]*ta]),p:[P[0],yH,P[2]]};
  const post=tube({name:`${TM?'Ножка':'Стойка'} круглая Ø76×${(cfg.$||{}).postR==='r76x4'?4:3} (${k+1})`,role:'postR',sec:(cfg.$||{}).postR||'r76x3',a:[P[0],68,P[2]],b:[P[0],TM?yS:WD?yRb-CAP:yH,P[2]],up:r,sx:76,sy:76,cutB:WD?null:top,step:'posts',ends:['низ',WD?'верх':'верх (под ребро)'],module:md});
  post.holes.push({s:40,face:'R',ang:180,off:0,d:6,single:true,note:'дренаж Ø6, одна стенка'});
  const bp=box({name:'Опорная пластина 140×140×6',role:'basePlate',c:[P[0],65,P[2]],ax:r,ay:t,w:140,h:140,t:6,mat:'steel',step:'posts',cat:'plate6',module:md,layer:'frame'});
  for(const [u,w] of [[-45,-45],[45,-45],[-45,45],[45,45]])bp.holes.push({x:u,y:w,d:14});
  for(let q=0;q<12;q++){const a1=q/12*2*pi,a2=(q+1)/12*2*pi;weld([P[0]+40*Math.cos(a1),69.8,P[2]+40*Math.sin(a1)],[P[0]+40*Math.cos(a2),69.8,P[2]+40*Math.sin(a2)],'Шов стойка — опорная пластина','posts',md);}
  // язык под ребро шатра на торце стойки
  const dE=[r[0]*ca,-sa,r[2]*ca],nR=[r[0]*sa,ca,r[2]*sa],tp=[P[0],yH,P[2]];
  if(!WD)TNG[`h${k}`]=tongue({name:'Язык ребра шатра 50×40×6 (вварен в торец стойки)',c:add(tp,mul(nR,22)),ax:dE,ay:nR,w:50,h:40,root:tp,rootAx:dE,rootLen:50,md,step:'posts'});
  POST[k]=post;
 }
 if(!X.fnd&&!FW)for(const k in POST){const p=POST[k];box({name:'Подливка под опорную пластину (пескобетон)',role:'grout',c:[p.o[0],53.5,p.o[2]],ax:[1,0,0],ay:[0,1,0],w:160,h:17,t:160,mat:'grout',layer:'found',step:'brace',cat:'concrete'});}
 // языки на стойках по направлениям сторон
 const sideTongue=(k,dir,y,h,nm,rootLen)=>{const P=V(k,y);return tongue({name:nm,c:add(P,mul(dir,38+25)),ax:dir,ay:[0,1,0],w:50,h,root:add(P,mul(dir,38)),rootLen,md:`post${k}`,step:'posts'});};

 /* ---- обвязка: ригель опускается сверху на языки стоек, затем подкосы вдвигаются в углы «стойка — ригель» на языки.
        Раньше рама «ригель + 2 подкоса» сварена целиком — её нельзя было опустить: подкос упирался в язык ригеля ---- */
 if(!WD)for(let j=0;j<N;j++){
  const k0=j,k1=(j+1)%N,c=tv(PSI(j)),nO=rv(PSI(j)),A=V(k0),B=V(k1),md=mod(`ring${j}`,`Ригель обвязки: сторона ${j+1}${j===FRONT?' (вход)':''}`);
  const beam=tube({name:'Ригель обвязки 60×40',role:'ring',sec:'60x40x2',a:add(A,add(mul(c,32.3),[0,yRb+30,0])),b:add(B,add(mul(c,-32.3),[0,yRb+30,0])),up:[0,1,0],sx:40,sy:60,step:'sides',ends:['торец','торец'],module:md,saddle:[POST[k0].id,POST[k1].id],note:'торцы — по радиусу стойки (седловой рез) и пропил 7×60 под язык'});
  for(const [k,dir] of [[k0,c],[k1,mul(c,-1)]]){
   const tg=sideTongue(k,dir,yRb+30,40,'Язык ригеля обвязки 50×40×6 (вварен в стойку)');
   bolt({d:10,p:add(tg.c,mul(nO,20)),dir:mul(nO,-1),grip:40,thru:[beam,tg],step:'sides',joint:'ригель обвязки — стойка (язык в пропил)'});
   const foot=add(V(k,yRb-L45),mul(dir,32.3)),d=norm(add(dir,[0,1,0])),top=add(foot,add(mul(dir,L45),[0,L45,0]));
   // подкос — отдельная деталь: ставится после ригеля, вдвигается в угол «стойка — ригель» в плоскости рамы на два языка
   // (на стойке и под ригелем); пропилы в торцах открыты в сторону угла. Стойки едут компактно, на пути ригеля ничего нет
   const br=tube({name:'Подкос обвязки 40×40 (рез «на ус»)',role:'ringBrace',sec:'40x40x2',a:add(foot,mul(d,-60)),b:add(top,mul(d,60)),up:nO,sx:40,sy:40,cutA:{n:dir,p:foot},cutB:{n:[0,1,0],p:[0,yRb-1,0]},step:'sides',ends:['низ','верх'],saddle:[POST[k].id],note:'в торцах — пропилы 7 мм под языки, открытые в сторону угла; нижний торец — по радиусу стойки'});
   br.seq=1;br.mount=norm(sub(dir,[0,1,0]));br.mountLen=300;
   const t2=tongue({name:'Язык подкоса 50×24×6 (вварен в стойку)',c:add(foot,mul(d,25)),ax:d,ay:norm(cross(nO,d)),w:50,h:24,root:add(V(k,yRb-L45),mul(dir,38)),rootAx:[0,1,0],rootLen:34,md:`post${k}`,step:'posts'});
   const t3=tongue({name:'Язык подкоса 50×24×6 (вварен в ригель)',c:add(top,mul(d,-25)),ax:d,ay:norm(cross(nO,d)),w:50,h:24,root:[top[0],yRb,top[2]],rootAx:dir,rootLen:40,md,step:'sides'});
   for(const [tg,qq,nm] of [[t2,add(foot,mul(d,30)),'стойка'],[t3,add(top,mul(d,-30)),'ригель']])bolt({d:10,p:add(qq,mul(nO,20)),dir:mul(nO,-1),grip:40,thru:[br,tg],step:'sides',joint:`подкос обвязки — ${nm} (язык в пропил)`});
  }
 }

 /* ---- центральный узел и рёбра шатра ---- */
 // сечение рёбер — по пролёту и снегу (треугольная грузовая площадь)
 const Sg_=SNOW_[cfg.snow],trH=side/2/1000,qH=(Sg_*1.4+GROOF[cov]*1.2)*trH,qHn=(Sg_+GROOF[cov])*trH,LsH=R/ca;
 const HSEC=WD?($w.wHip==='w50x200'?{sec:'w50x200',b:50,h:200}:{sec:'w50x150',b:50,h:150}):(cfg.$||{}).hip==='100x50x3'?{sec:'100x50x3',b:50,h:100,t:3}:pickSec([{sec:'60x40x2',b:40,h:60,t:2},{sec:'80x40x2',b:40,h:80,t:2},{sec:'80x40x3',b:40,h:80,t:3}],qH*R*R/8*0.66,qHn*ca*0.66,LsH,200),hh=HSEC.h; // 100×50 — только у шестигранника: у восьми рёбер нет места на узле Ø114
 const rH=WD?64:53.4,yHub0=yb(rH)-45,yHub1=yb(rH)+hh/ca+12;
 const nHB=$w.hipB||2;   // болтов на конец ребра
 const CrF=(k,rho)=>{const r=rv(PHI(k)),rr=rho-hh/2*sa;return[r[0]*rho,yb(rr)+hh/2*ca,r[2]*rho];};
 if(WD)woodPolyFrame({cfg,X,N,Vk:V,PHI,PSI,POST,WPOST,yRb,yRt,yS,CAP,TM,FW,bP,Lw,Cr:CrF,hipTop:rho=>yb(rho)+(hh-30)/ca,al,R,nHB});
 const hub=tube({name:'Центральный узел шатра Ø114×4',role:'hub',sec:'r114x4',a:[0,yHub0,0],b:[0,yHub1,0],up:[1,0,0],sx:114,sy:114,caps:[true,true],step:'hips',layer:'roofframe',ends:['низ','верх'],module:mod('hub','Центральный узел шатра')});
 const HIP={};
 for(let k=0;k<N;k++){
  const f=PHI(k),r=rv(f),t=tv(f),dE=[r[0]*ca,-sa,r[2]*ca],nR=[r[0]*sa,ca,r[2]*sa],md=mod(`hip${k}`,`Ребро шатра ${k+1}`);
  const Cr=rho=>{const rr=rho-hh/2*sa;return[r[0]*rho,yb(rr)+hh/2*ca,r[2]*rho];};
  const hipO={name:`Ребро шатра ${HSEC.sec.replace(/^w/,'').replace(/x/g,'×')}`,role:'hip',sec:HSEC.sec,a:Cr(rH-40),b:Cr(R+ovh),up:nR,sx:HSEC.b,sy:hh,cutA:{n:r,p:mul(r,rH)},cutB:{n:r,p:mul(r,R+ovh)},step:'hips',layer:'roofframe',ends:['центр','свес'],note:WD?'у центра — пропил 9 мм под нож узла; на углу обвязки — посадочная врубка 30 мм':'верхний торец — по радиусу центрального узла; пропилы 7 мм под языки снизу у обоих концов'};
  const hp=WD?kit.tmb(Object.assign(hipO,{notch:parts.filter(p=>p.role==='ring')})):tube(Object.assign(hipO,{caps:[false,true],module:md,saddle:[hub.id]}));
  HIP[k]=hp;
  const tp=[R*r[0],yH,R*r[2]];
  if(WD){for(const q of [R-110,R-55])for(const sg of [-1,1]){screws.push({type:'sc8',p:add(add(Cr(q),mul(nR,hh/2-45)),mul(t,sg*(HSEC.b/2))),n:norm(add(mul(t,sg),mul(nR,0.7))),st:'hips'});C.sc8++;}}   // ребро на углу обвязки: врубка 30 мм и саморезы наискось, без пластин
  else bolt({d:10,p:add(add(tp,mul(nR,22)),mul(t,-20)),dir:t,grip:40,thru:[hp,TNG[`h${k}`]],step:'hips',joint:'ребро — стойка (язык в пропил)'});
  if(WD){const tgL=110+(nHB-1)*80,tg=tongue({name:`Язык центрального узла ${tgL}×70×6`,c:Cr(57+tgL/2+5),ax:dE,ay:nR,w:tgL,h:70,root:[r[0]*57,yb(57)+hh/2,r[2]*57],rootAx:[0,1,0],rootLen:70,md:'hub',step:'hips'});
   for(const rho of [57+84,57+160,57+236,57+312].slice(0,nHB))bolt({d:12,p:add(Cr(rho),mul(t,-25)),dir:t,grip:50,thru:[hp,tg],step:'hips',joint:'ребро — центральный узел (язык в пропил)'});}
  else{const hc=add([r[0]*(57+25),0,r[2]*(57+25)],[0,yb(57+25),0]),tg=tongue({name:'Язык центрального узла 50×40×6',c:add(hc,mul(nR,22)),ax:dE,ay:nR,w:50,h:40,root:[r[0]*57,yb(57)+22,r[2]*57],rootAx:[0,1,0],rootLen:40,md:'hub',step:'hips'});
  bolt({d:10,p:add(add(hc,mul(nR,22)),mul(t,-20)),dir:t,grip:40,thru:[hp,tg],step:'hips',joint:'ребро — центральный узел (язык в пропил)'});}
 }

 /* ---- обрешётка кольцами и кровля по граням ---- */
 const COVH={tile:46,c20:22,ondulin:38,falc:27,shingle:17};
 const edge=(k,sg,rr)=>{const f=PHI(k),r=rv(f),t=tv(f),nR=[r[0]*sa,ca,r[2]*sa];return add(add([r[0]*rr,yb(rr),r[2]*rr],mul(nR,hh)),mul(t,HSEC.b/2*sg));};
 const FACET=[],roofQty={sheets:0,sheetLen:[],sheetW:[],trimLen:0,ridgeLen:0,eaveLen:0,area:0,hipLen:0,pcStrips:[],pcLen:0,cols:[],colsN:N};
 let step=Math.min(cov==='shingle'?420:COVERS[cov].step,(cfg.$||{}).purStep||1e9);const SH=SHEET[cov]; // под гибкой черепицей OSB лежит рядами вдоль карниза (параллельно кольцам обрешётки) — пролёт не больше 420 мм
 // сечение обрешётки — по самому длинному кольцу у карниза
 const Lpur=2*(R+ovh)*Math.sin(hN),Sg=SNOW_[cfg.snow],qp=(Sg*1.4*ca+GROOF[cov]*1.2)*step/1000,qpn=(Sg*ca+GROOF[cov])*step/1000;
 const PUR=WD?($w.wPur==='e150'?{sec:'w50x150',b:50,h:150}:$w.wPur==='e100'?{sec:'w50x100',b:50,h:100}:{sec:'w50x100',b:100,h:50}):pickSec([{sec:'40x20x2',b:20,h:40,t:2},{sec:'40x40x2',b:40,h:40,t:2},{sec:'60x40x2',b:40,h:60,t:2}],qp*Lpur*Lpur/8,qpn,Lpur,150),ph=PUR.h;
 if(WD){const sm=woodPurStep(Lpur,Sg,ca,GROOF[cov],WS,$w.wPur);if(cov!=='tile'&&sm<step)step=Math.max(250,sm);}
 else{const I=Ipr(PUR.b,PUR.h,PUR.t),a=Sg*1.4*ca+GROOF[cov]*1.2,an=Sg*ca+GROOF[cov],sm=Math.floor(Math.min(1600*I/(PUR.h/2)/(Lpur*Lpur*a),384*2.06e5*I/(750*Lpur**3*an))*100)*10;if(cov!=='tile'&&sm<step)step=Math.max(250,sm);}
 for(let j=0;j<N;j++){
  const k0=j,k1=(j+1)%N,c=tv(PSI(j)),p1=edge(k0,1,R),p2=edge(k0,1,R*0.35),p3=edge(k1,-1,R);
  let nP=norm(cross(sub(p2,p1),sub(p3,p1)));if(nP[1]<0)nP=mul(nP,-1);
  let w=norm(cross(nP,c));if(w[1]<0)w=mul(w,-1);
  const M=mul(rv(PSI(j)),(R+ovh)*Math.cos(hN)),O=[M[0],p1[1]-(nP[0]*(M[0]-p1[0])+nP[2]*(M[2]-p1[2]))/nP[1],M[2]];
  const P=(u,v,h)=>add(add(add(O,mul(c,u)),mul(w,v)),mul(nP,h));
  const tA=tv(PHI(k0)),tB=tv(PHI(k1));
  const uAt=(tk,v,h)=>-dot(add(add(O,mul(w,v)),mul(nP,h)),tk)/dot(c,tk);
  FACET.push({j,nP,w,c,O,P,uAt,tA,tB});
  // обрешётка
  for(let v=20;;v+=step){const uL=uAt(tA,v,ph/2),uR=uAt(tB,v,ph/2);if(uR-uL<260)break;
   const purO={name:WD?($w.wPur?`Обрешётка шатра 50×${PUR.h} на ребро`:'Обрешётка шатра 50×100 плашмя'):`Обрешётка шатра ${PUR.sec.replace('x2','').replace('x','×')}${PUR.b<PUR.h?' (на ребро)':''}`,role:'purlinP',sec:PUR.sec,a:P(uL,v,ph/2),b:P(uR,v,ph/2),up:nP,sx:PUR.b,sy:ph,cutA:{n:tA,p:[0,0,0]},cutB:{n:tB,p:[0,0,0]},step:'purlins',layer:'roofframe',ends:['ребро','ребро'],note:'торцы — под углом по оси ребра'};
   const pur=WD?kit.tmb(purO):tube(purO);if(WD){const fl=PUR.b>PUR.h;   // по 2 самореза в ребро на каждый конец: плашмя — сверху, на ребро — наискось с боков
    for(const [tk,sg] of [[tA,1],[tB,-1]])for(const s of [-1,1]){const vq=fl?v+s*26:v;screws.push(fl?{type:'wp',p:P(uAt(tk,vq,ph/2)+sg*24,vq,ph),n:nP,st:'purlins'}:{type:'wp',p:P(uAt(tk,v,30)+sg*36,v+s*25,30),n:norm(add(mul(w,s),mul(nP,0.7))),st:'purlins'});C.wood6++;}continue;}
   // крепление к рёбрам — ушко на ребре (как упор у прямоугольных беседок): пластина 10 мм вварена дома в верх ребра у нижней (по скату)
   // грани обрешётки, перпендикулярно скату; обрешётка упирается в неё, на каждый торец — 2 самореза 5,5×32 сквозь ушко (отверстия Ø6 — дома).
   // Ушко занимает 2…22 мм от плоскости оси ребра — это над верхом ребра; уголок здесь не встаёт: грань идёт к верху ребра под углом
   for(const [tk,sg,hk] of [[tA,1,k0],[tB,-1,k1]]){const vS=v-PUR.b/2-5,uE=uAt(tk,vS,0),a0=sg>0?uE+2:uE-22,H=HIP[hk],md=H.module;
    const q0=P(a0+10,vS,0),gap=Math.max(0,(dot(sub(q0,H.o),H.ay)-H.sy/2)/Math.max(0.5,dot(nP,H.ay))),hT=ph-4,hc=(hT-gap)/2;
    const tb=box({name:'Ушко обрешётки 20×10 (вварено в ребро)',role:'stopP',c:P(a0+10,vS,hc),ax:c,ay:nP,w:20,h:hT+gap,t:10,mat:'steel',cat:'plate6',step:'hips',layer:'roofframe',module:md});
    for(const hh of [ph*0.3,ph*0.68]){tb.holes.push({x:0,y:hh-hc,d:6});fast('tek',P(a0+10,vS-5.2,hh),mul(w,-1),'purlins');}C.selfDrill+=2;
    for(const dv of [-5.4,5.4])weld(P(a0,vS+dv,-gap+0.4),P(a0+20,vS+dv,-gap+0.4),'Шов ушка обрешётки','hips',md);}}
  // кровельная грань
  const v0=-70,h0=ph,aL=uAt(tA,0,h0),bL=uAt(tA,1,h0)-aL,aR=uAt(tB,0,h0),bR=uAt(tB,1,h0)-aR,vt=(aR-aL)/(bL-bR);
  const pts=[[aL+bL*v0,v0],[aR+bR*v0,v0],[aL+bL*vt,vt]],area=polyArea(pts)/1e6;roofQty.area+=area;roofQty.eaveLen+=(pts[1][0]-pts[0][0])/1000;
  // раскрой грани колонками (все грани одинаковые — считаем по первой): верх колонки срезан по ребру — длинная и короткая стороны
  if(j===0){roofQty.facet={b0:pts[1][0]-pts[0][0],Hs:vt-v0};}
  if(j===0){const vH=u=>Math.max(v0,Math.min(vt,u<=pts[2][0]?(u-aL)/bL:(u-aR)/bR)),SC=cov==='shingle'?{W:1250,E:1250}:SHEET[cov];
   if(SC)for(let u0=pts[0][0];u0<pts[1][0]-40;u0+=SC.E){const u1=Math.min(u0+SC.W,pts[1][0]),hi=(u0<=pts[2][0]&&u1>=pts[2][0])?vt:Math.max(vH(u0),vH(u1)),lo=Math.min(vH(u0),vH(u1));
    roofQty.cols.push({long:hi-v0,short:lo-v0,side:u1<=pts[2][0]?'L':u0>=pts[2][0]?'R':'C',w:u1-u0});}}
  if(cov==='shingle'){
   push({kind:'tri',name:'OSB-3 12 мм (грань шатра, раскрой по шаблону)',role:'osb',pts,t:12,h0:0,o:P(0,0,h0),ax:c,ay:w,az:nP,mat:'osb',layer:'roof',step:'roofDeck',cat:'osb12'});
   for(let v=20;;v+=step){const ul=aL+bL*v,ur=aR+bR*v;if(ur-ul<260)break;for(let uu=ul+40;uu<ur-30;uu+=300)fast('osb',P(uu,v,h0+11.9),nP,'roofDeck');}
   // подкладочный ковёр: полоса по карнизу 600 мм и полосы вдоль рёбер по 250 мм с каждой стороны
   const band=(pp,nm)=>{if(pp.length>=3&&polyArea(pp)>2000)push({kind:'tri',name:nm,role:'underlay',pts:pp,t:1.5,h0:12,o:P(0,0,h0),ax:c,ay:w,az:nP,mat:'underlay',layer:'roof',step:'roofUnder',cat:'underlay'});};
   const v1=v0+600;band([[aL+bL*v0,v0],[aR+bR*v0,v0],[aR+bR*v1,v1],[aL+bL*v1,v1]],'Подкладочный ковёр — полоса по карнизу 600 мм');
   band(clipHalf([[aL+bL*v1,v1],[aL+bL*v1+250,v1],[pts[2][0],vt]],1,0,0),'Подкладочный ковёр — полоса вдоль ребра 250 мм');
   band(clipHalf([[aR+bR*v1-250,v1],[aR+bR*v1,v1],[pts[2][0],vt]],-1,0,0),'Подкладочный ковёр — полоса вдоль ребра 250 мм');
   push({kind:'tri',name:'Гибкая черепица (рядовая, от карниза к вершине)',role:'shingle',pts,t:5,h0:13.5,o:P(0,0,h0),ax:c,ay:w,az:nP,mat:'shingle',layer:'roof',step:'roof',cat:'shingle'});
  }else{
   push({kind:'facet',profile:SH.p,name:`${SH.nm} — грань шатра (полос: ${Math.ceil((pts[1][0]-pts[0][0])/SH.E)})`,role:'roofSheet',pts,o:P(0,0,h0),ax:c,ay:nP,az:w,mat:SH.mat,layer:'roof',step:'roof',cat:cov});
   for(let u0=pts[0][0];u0<pts[1][0]-40;u0+=SH.E){const uc=Math.min(u0+SH.E/2,pts[1][0]-20),vc=uc<pts[2][0]?(uc-aL)/bL:(uc-aR)/bR,L=Math.max(200,vc-v0);
    const pcs=L>SH.L?Math.ceil((L-SH.lap)/(SH.L-SH.lap)):1;roofQty.sheets+=pcs;for(let q=0;q<pcs;q++){roofQty.sheetLen.push(Math.min(SH.L,L));roofQty.sheetW.push(SH.W);}
    if(!SH.hidden)for(let v=20;v<vc-40;v+=step)for(let uu=u0+SH.f0;uu<Math.min(u0+SH.E,pts[1][0])-10;uu+=SH.fp*2){const ul=aL+bL*v,ur=aR+bR*v;if(uu<ul+30||uu>ur-30)continue;screws.push({type:'roof',p:P(uu,v,h0+SH.fh),n:nP});}}
  }
  if(cov==='shingle'){const v=mul(nP,-1),uu=mul(w,-1),Ld=norm(cross(uu,v));angle({mount:rv(PSI(j)),name:'Планка карнизная (капельник) — поверх ковра',role:'trim',o:P(dot(Ld,c)>0?pts[0][0]-20:pts[1][0]+20,v0,h0+13.6),u:uu,v,L:pts[1][0]-pts[0][0]+40,A:60,B:50,t:0.6,mat:'roof',layer:'roof',step:'roofEdge',cat:'drip',trim:true});}
 }
 // коньковые планки по рёбрам
 const ch=ph+COVH[cov];
 const yOn=(F_,x,z)=>{const q=F_.P(0,0,ch),n=F_.nP;return q[1]-(n[0]*(x-q[0])+n[2]*(z-q[2]))/n[1];};
 let apexY=0;
 for(let k=0;k<N;k++){
  const fa=FACET[k],fb=FACET[(k-1+N)%N],r=rv(PHI(k)),t=tv(PHI(k));
  const pt=rho=>[r[0]*rho,yOn(fa,r[0]*rho,r[2]*rho)+1.5,r[2]*rho];
  const H1=pt(55),H2=pt(R+ovh+60),hd=norm(sub(H2,H1));apexY=Math.max(apexY,yOn(fa,0,0));
  let u=norm(cross(fa.nP,hd));if(dot(u,t)<0)u=mul(u,-1);let v=norm(cross(fb.nP,hd));if(dot(v,t)>0)v=mul(v,-1);
  if(dot(cross(u,v),hd)<0){const q=u;u=v;v=q;}
  const Lh=len(sub(H2,H1));roofQty.hipLen+=Lh/1000;
  // у вершины грань уже двух полок: сужаем полки до встыка по середине грани (tgβ — полуугол грани у вершины, s0 — от вершины до начала)
  const cB=dot(hd,mul(fa.w,-1)),tk=Math.sqrt(Math.max(0,1-cB*cB))/cB,s0=55/Math.hypot(hd[0],hd[2]);
  if(cov!=='shingle')for(let q=200;q<Lh-50;q+=400)for(const dd of [u,v])fast('trim',add(add(H1,mul(hd,q)),mul(dd,90)),norm(add(fa.nP,fb.nP)),'roofTrim');
  angle({name:cov==='shingle'?'Коньково-карнизная черепица по ребру':'Планка коньковая по ребру — саморезы через 400 мм',role:'trim',o:H1,u,v,L:Lh,tk,s0,A:cov==='shingle'?125:130,B:cov==='shingle'?125:130,t:cov==='shingle'?4:0.6,mat:cov==='shingle'?'shingle':'roof',layer:'roof',step:'roofTrim',cat:{tile:'ridgeTile',c20:'ridgeC20',falc:'ridgeC20',ondulin:'ridgeOnd',shingle:'ridgeSh'}[cov],trim:true});
 }
 push({kind:'cone',name:'Колпак-навершие шатра (на центральный узел, 3 самореза)',role:'trim',c:[0,apexY-60,0],r:150,h:300,seg:N,rot:hN,mat:'roof',layer:'roof',step:'roofTrim',cat:'hipCap',trim:true});

 /* ---- пол: балки по периметру на языках, внутренние балки на столбиках, лаги, настил ---- */
 let deckInfo=null;
 const inPoly=(x,z,off)=>{for(let j=0;j<N;j++){const n=rv(PSI(j));if(n[0]*x+n[2]*z>a+off)return false;}return true;};
 const zSpan=x=>{let lo=-1e9,hi=1e9;for(let j=0;j<N;j++){const n=rv(PSI(j));if(Math.abs(n[2])<1e-6){if(n[0]*x>a)return null;continue;}const zz=(a-n[0]*x)/n[2];if(n[2]>0)hi=Math.min(hi,zz);else lo=Math.max(lo,zz);}return hi>lo?[lo,hi]:null;};
 const xSpan=(z,off)=>{let lo=-1e9,hi=1e9;for(let j=0;j<N;j++){const n=rv(PSI(j));if(Math.abs(n[0])<1e-6){if(n[2]*z>a+off)return null;continue;}const xx=(a+off-n[2]*z)/n[0];if(n[0]>0)hi=Math.min(hi,xx);else lo=Math.max(lo,xx);}return hi>lo?[lo,hi]:null;};
 let WFL=null;if(isFloor&&FW){WFL=woodFloorPoly(X,cfg,{N,R,a,V,rv,tv,PHI,PSI,TR,bP,FY,pillar,inPoly,xSpan,zSpan});}
 if(isFloor){
  if(!FW)for(let j=0;j<N;j++){const k0=j,k1=(j+1)%N,c=tv(PSI(j)),nO=rv(PSI(j)),A=V(k0),B=V(k1);
   const fb=tube({name:'Балка пола 60×40 (по периметру)',role:'floorBeamP',sec:'60x40x2',a:add(A,add(mul(c,32.3),[0,160,0])),b:add(B,add(mul(c,-32.3),[0,160,0])),up:[0,1,0],sx:40,sy:60,step:'bottom',layer:'floor',ends:['торец','торец'],saddle:[POST[k0].id,POST[k1].id],note:'торцы — по радиусу стойки и пропил 7×60 под язык'});
   for(const [k,dir] of [[k0,c],[k1,mul(c,-1)]]){const tg=sideTongue(k,dir,160,40,'Язык балки пола 50×40×6 (вварен в стойку)');bolt({d:8,p:add(tg.c,mul(nO,20)),dir:mul(nO,-1),grip:40,thru:[fb,tg],step:'bottom',joint:'балка пола — стойка (язык в пропил)'});}}
  const nIn=R>1650?2:1,ZL=[...Array(nIn)].map((_,l)=>-a+(l+1)*2*a/(nIn+1));
  if(!FW)for(const zl of ZL){
   const s1=xSpan(zl-20,-25),s2=xSpan(zl+20,-25),x0=Math.max(s1[0],s2[0]),x1=Math.min(s1[1],s2[1]),Lb=x1-x0;
   const np=Math.max(2,Math.ceil((Lb-300)/1300)+1),PX=[...Array(np)].map((_,i)=>x0+150+i*(Lb-300)/(np-1));
   const cuts=[x0,...(Lb>3000?[PX[Math.floor(np/2)]]:[]),x1];
   for(let q=0;q<cuts.length-1;q++)tube({name:'Балка пола 60×40 (внутренняя, на столбиках)',role:'floorBeam',sec:'60x40x2',a:[cuts[q]+(q?1:0),160,zl],b:[cuts[q+1]-(q<cuts.length-2?1:0),160,zl],up:[0,1,0],sx:40,sy:60,caps:[q===0,q===cuts.length-2],step:'bottom',layer:'floor',ends:['лев.','прав.']});
   for(const x of PX){pillar(x,zl,{name:'Столбик под балку пола Ø200',studs:[[x,zl,124,[-205,109],[[-195,3]]]]});box({name:'Опорный столик 100×100×4 с приварной гайкой M12',role:'support',c:[x,128,zl],ax:[1,0,0],ay:[0,0,1],w:100,h:100,t:4,step:'bottom',cat:'plate6',mat:'steel',layer:'floor'});C.selfDrill+=2;}
  }
  const xs=xSpan(0,-130),VX=[...Array(N)].map((_,k)=>V(k)[0]);
  const nj=Math.ceil((xs[1]-xs[0])/(cfg.deck==='wpc'?400:480))+1;let JX=FW?WFL.JX:[...Array(nj)].map((_,i)=>xs[0]+i*(xs[1]-xs[0])/(nj-1)); // ДПК — лаги не реже 400 мм
  JX=JX.map(x=>{for(const vx of VX)if(Math.abs(x-vx)<72)return vx+(x<vx?-72:72);return x;}).filter(x=>Math.abs(x)<=R-110);
  // конец лаги на балке по периметру: на грани поперёк лаги — до наружной кромки балки (опора на всю ширину),
  // на косой грани квадратный торец и так целиком над балкой; на каждом конце — уголок со стороны, где под ним балка
  const endN=(x,z)=>{let b=null;for(let j=0;j<N;j++){const n=rv(PSI(j)),d=Math.abs(n[0]*x+n[2]*z-a);if(!b||d<b.d)b={n,d};}return b.n;};
  if(!FW)for(const x of JX){const zs=zSpan(x);if(!zs)continue;let [z0,z1]=zs;const n0=endN(x,z0),n1=endN(x,z1);
   if(Math.abs(n0[0])<0.05)z0-=18;if(Math.abs(n1[0])<0.05)z1+=18;
   const pcs=z1-z0>2950?[[z0,ZL[Math.floor(ZL.length/2)]-1],[ZL[Math.floor(ZL.length/2)]+1,z1]]:[[z0,z1]];
   for(const [p0,p1] of pcs)tube({name:'Лага пола 40×40',role:'joist',sec:'40x40x2',a:[x,210,p0],b:[x,210,p1],up:[0,1,0],sx:40,sy:40,caps:[p0===z0,p1===z1],step:'bottom',layer:'floor',ends:['зад','перед']});
   for(const n of [n0,n1]){const s=Math.abs(n[0])<0.05?(x>1?-1:1):Math.sign(n[0]),zc=(a-n[0]*(x+s*40))/n[2];
    angle({name:'Уголок крепёжный 40×40×40×2 (лага — балка)',role:'cleatJoist',o:[x+s*20,190,zc-20*s],u:[s,0,0],v:[0,1,0],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});C.clip+=4;
    for(const dz of [-10,10]){fast('clip',[x+s*42,192.2,zc+dz],[0,1,0],'bottom');fast('clip',[x+s*22.2,214,zc+dz],[s,0,0],'bottom');}}
   for(const zl of ZL){if(zl<z0+30||zl>z1-30)continue;const s=x>1?-1:1;angle({name:'Уголок крепёжный 40×40×40×2 (лага — балка)',role:'cleatJoist',o:[x+s*20,190,zl-20*s],u:[s,0,0],v:[0,1,0],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});C.clip+=4;for(const dz of [-10,10]){fast('clip',[x+s*42,192.2,zl+dz],[0,1,0],'bottom');fast('clip',[x+s*22.2,214,zl+dz],[s,0,0],'bottom');}}
  }
  // настил: доски вдоль X, обрезаны по многоугольнику, у стоек — срезанные углы
  let nb=Math.ceil((2*a+40+5)/145);const ws=[...Array(nb)].map(()=>140),z00=-(nb*145-5)/2,pieces=[];
  const mid=JX.map(x=>[Math.abs(x),x]).sort((p,q)=>p[0]-q[0]).slice(0,2).map(q=>q[1]).sort((p,q)=>p-q);
  ws.forEach((wd,i)=>{const z0=z00+i*145,z1=z0+wd;
   let pg=[[-R-200,z0],[R+200,z0],[R+200,z1],[-R-200,z1]];
   for(let j=0;j<N;j++){const n=rv(PSI(j));pg=clipHalf(pg,n[0],n[2],a+20);}
   for(let k=0;k<N;k++){const n=rv(PHI(k));pg=clipHalf(pg,n[0],n[2],FW?R-bP*0.75-6:R-44);}
   if(pg.length<3||polyArea(pg)<4000)return;
   const xmn=Math.min(...pg.map(q=>q[0])),xmx=Math.max(...pg.map(q=>q[0]));
   const segs=xmx-xmn>3000?[[-1e9,mid[i%2]-1.5],[mid[i%2]+1.5,1e9]]:[[-1e9,1e9]];
   for(const [sa_,sb_] of segs){let q=clipHalf(pg,-1,0,-sa_);q=clipHalf(q,1,0,sb_);if(q.length<3)continue;const L=Math.round(Math.max(...q.map(p=>p[0]))-Math.min(...q.map(p=>p[0])));pieces.push(L);
    push({kind:'poly',name:`Доска настила №${i+1}: ${DT}×140×${L}`,role:'deck',pts:q,y0:230,h:DT,mat:DECKS[cfg.deck].mat,layer:'floor',step:'deck',cat:DECKS[cfg.deck].cat,w:140,L,tint:((i*37)%7)/7});}
   if(cfg.deck!=='wpc')for(const x of JX){const zs=zSpan(x);if(!zs)continue;for(const dz of [-1,1]){const zz=(z0+z1)/2+dz*45;if(zz>zs[0]+30&&zz<zs[1]-30&&inPoly(x,zz,0))screws.push({type:'deck',p:[x,F+0.5,zz],n:[0,1,0]});}}
  });
  deckInfo={n:nb,pieces};
 }else{let pg=[];for(let j=0;j<N;j++){const f=PHI(j);pg.push([Math.cos(f)*(R-20),Math.sin(f)*(R-20)]);}push({kind:'poly',name:'Пол: геотекстиль + щебень 20–40, слой 70 мм',role:'gravel',pts:pg,y0:-40,h:70,mat:'gravel',layer:'floor',step:'deck',cat:'gravel'});}

 if(TM)for(const p of parts)if(['bottom','deck'].includes(p.step)&&!p.mount){p.mount=[0,1,0];p.mountLen=p.step==='deck'?50:70;}
 /* ---- борта: секции по сторонам, передняя сторона — вход ---- */
 const Bb=TM?Math.max(isFloor?F+60:150,yS+CAP+126):isFloor?F+60:150,fillInfo=[],sF=TM?bP/2/Math.cos(hN)+1:58;   // брус: брусья борта с косым торцом врезаны в грани стоек
 for(let j=0;j<N;j++){
  if(j===FRONT)continue;
  const n=rv(PSI(j)),c=tv(PSI(j)),Hs=n[2]<-0.5?RH.back:n[2]>0.5?RH.front:(n[0]<0?RH.left:RH.right);if(!Hs)continue;
  const pN=parts.length,top=F+Hs,md=mod(`rail_${j}`,`Секция борта: сторона ${j+1}`),A=V(j),st='railframe';
  const pt=(s,y,pe)=>add(add(add(A,mul(c,s)),[0,y,0]),mul(n,pe||0));
  const stiles=[];
  if(!TM)for(const [s0,k,dir] of [[48,j,-1],[side-48,(j+1)%N,1]]){
   const stl=tube({name:'Стойка секции 40×20',role:'stile',sec:'40x20x2',a:pt(s0,Bb),b:pt(s0,top),up:c,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});stiles.push(stl);
   const o=(j%2)*30;
   for(const y of [Bb+85+o,top-95-o])bolt({d:8,p:pt(s0-dir*10,y),dir:mul(c,dir),grip:96,thru:[stl,POST[k]],step:st,joint:'секция борта — стойка (стяжной болт)'});
  }
  const rails=TM?[{sec:'w50x100',w:100,h:50,yc:top-25,name:'Поручень 50×100',role:'railTop'},{sec:'w50x50',w:50,h:50,yc:Bb+25,name:'Нижний брус 50×50',role:'railBot'}]:[{sec:'40x40x2',h:40,yc:top-20,name:'Поручень 40×40',role:'railTop'},{sec:'40x20x2',h:20,yc:Bb+10,name:'Нижний брус 40×20',role:'railBot'}];
  if(top-Bb>700)rails.push(TM?{sec:'w50x50',w:50,h:50,yc:Math.round((top+Bb)/2),name:'Средний брус 50×50',role:'railMid'}:{sec:'40x20x2',h:20,yc:Math.round((top+Bb)/2),name:'Средний брус 40×20',role:'railMid'});
  if(TM)for(const rl of rails){const t0=tv(PHI(j)),t1=tv(PHI(j+1)),Q0=V(j,0),Q1=V((j+1)%N,0);kit.tmb({name:`${rl.name} (сторона ${j+1})`,role:rl.role,sec:rl.sec,a:pt(sF-12,rl.yc),b:pt(side-sF+12,rl.yc),up:[0,1,0],sx:rl.w,sy:rl.h,cutA:{n:t0,p:add(Q0,mul(t0,bP/2-10))},cutB:{n:t1,p:add(Q1,mul(t1,-(bP/2-10)))},step:st,layer:'rail',module:md,notch:[WPOST[j],WPOST[(j+1)%N]],note:'торцы — под грань стойки, врубка 10 мм, 2 самореза наискось'});C.sc8+=4;}
  else for(const rl of rails){tube({name:`${rl.name} (сторона ${j+1})`,role:rl.role,sec:rl.sec,a:pt(58,rl.yc),b:pt(side-58,rl.yc),up:[0,1,0],sx:40,sy:rl.h,step:st,layer:'rail',module:md});for(const s of [58,side-58])ringWeld(pt(s,rl.yc),[0,1,0],n,rl.h,40,'Шов брус — стойка секции',st,md);}
  const oF=TM?25:20,s38=TM?sF+6:38,runLen=side-2*s38,h=top-Bb,fi={run:j,n:`сторона ${j+1}`,len:runLen,h,pieces:0};
  if(cfg.fill==='prof'){push({kind:'sheet',profile:'C8',name:`Профнастил С8 (сторона ${j+1}, ${Math.round(runLen)}×${Math.round(h)})`,role:'fillSheet',o:pt(s38,Bb,oF),ax:c,ay:n,az:[0,1,0],W:runLen,L:h,mat:'fill',layer:'rail',step:'fill',cat:'c8'});
   for(const y of rails.map(r=>r.yc))for(let uu=29;uu<runLen;uu+=230)screws.push({type:'fill',p:pt(s38+uu,y,oF+0.6),n});}
  else{const Wd=cfg.fill==='euro'?118:95,gap=cfg.fill==='euro'?47:30,cnt=Math.max(1,Math.floor((runLen+gap)/(Wd+gap))),tot=cnt*Wd+(cnt-1)*gap,s0=s38+(runLen-tot)/2;fi.pieces=cnt;
   for(let i=0;i<cnt;i++){const a0=s0+i*(Wd+gap);
    if(cfg.fill==='euro')push({kind:'sheet',profile:'EURO',name:`Штакетник 118 × ${Math.round(h)} (сторона ${j+1})`,role:'picket',o:pt(a0,Bb,oF),ax:c,ay:n,az:[0,1,0],W:Wd,L:h,mat:'fill',layer:'rail',step:'fill',cat:'euro'});
    else box({name:`Штакетина 20×95 × ${Math.round(h)} (сторона ${j+1})`,role:'plank',c:pt(a0+Wd/2,Bb+h/2,oF+10),ax:c,ay:[0,1,0],w:Wd,h,t:20,mat:'woodFill',layer:'rail',step:'fill',cat:'plank',tint:((i*29)%5)/5});
    for(const y of rails.map(r=>r.yc))for(const dx of [-1,1])screws.push({type:cfg.fill==='euro'?'fill':'wood',p:pt(a0+Wd/2+dx*(Wd/2-22),y,cfg.fill==='euro'?oF+18.6:oF+20.5),n});}}
  fillInfo.push(fi);
  for(let q=pN;q<parts.length;q++)if(['railframe','fill'].includes(parts[q].step))parts[q].mount=n; // секцию и заполнение подносят снаружи
 }
 X.capAll();
 // мебель для масштаба: круглый стол и скамьи
 const dec=(name,c,w,h,t,mat)=>box({name:name+' — для масштаба, в смету не входит',role:'decor',c,ax:[1,0,0],ay:[0,1,0],w,h,t,mat:mat||'woodFill',layer:'decor',step:'finish',cat:null});
 const tl=Math.min(1500,2*a-1500);
 if(tl>600){dec('Стол',[0,F+735,-80],tl,30,800);for(const sx of [-1,1])for(const sz of [-1,1])dec('Ножка стола',[sx*(tl/2-80),F+360,-80+sz*300],60,720,60);for(const z of [-700,540])dec('Скамья',[0,F+445,z],tl,35,300);}
 const BK=FW?WFL.K:X.fnd?buildBasePoly(X,cfg,{N,R,V,tv,rv,PHI,PSI,TR,FRONT}):null,y0=BK?BK.L.y0:FY,ST=isFloor&&F-y0>300?stairs(X,cfg,{FW,zf:a+(FW?sillB/2:20),F,y0,beam:parts.find(p=>['floorBeamP','sill'].includes(p.role)&&Math.abs(p.o[2]+p.az[2]*p.L/2-a)<2)}):null;
 if(ST)deckInfo.pieces.push(...ST.pcs);
 for(let i=0;i<4;i++)dec('Плитка дорожки',[((i%2)?-60:60),y0+(i===0?18:8),a+(ST?ST.run+250:0)+450+i*520],620,16,420,'grout');
 const steps=mkSteps(parts,cfg);
 const sideHalf=side/2;
 const model={cfg,parts,screws,F,ZP:[a,0,-a],hb:60,Bb,RH,isFloor,gable:false,poly:N,type:cfg.type,cov,hasDoor:true,steps,C,fillInfo,W:Dc,D:Dc,H,nP:N,sP:side,MODS,ang:cfg.ang,roofQty,E:Math.round(side-76),split:false,Yj:null,L45,
  free:!!X.fnd,base:X.fnd?baseInfo(BK,X,cfg):null,y0,FW,sillB,psi0:PSI(0),mat:cfg.mat,wood:cfg.wood,bP,yS,Lw,yRb,wPur:$w.wPur||'',hipB:nHB,postSec:(cfg.$||{}).postR||'r76x3',baseFixed:false,purlin:PUR,hip:HSEC,joistStep:cfg.deck==='wpc'?400:480,floorSpan:1300,truckSpec:TR,deck:deckInfo,rows:[20,20+step],Lr:0,ovh,ovhZ:ovh,R,apo:a,side,
  dims:{headroom:H,top:yHub1+260,apex:apexY,eave:F+H,door:Math.round(side-76),yLow:F+H,yHigh:F+H}};
 return finalize(model);
}
