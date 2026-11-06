/* ---------------- надёжность: нагрузки — СП 20.13330.2016, сталь — СП 16.13330.2017 ----------------
   Схемы упрощённые, но с запасом: каждый элемент и узел — по своему худшему сочетанию. Итог по строке — коэффициент
   использования (до 100% — проходит). Если не проходит и есть понятное лечение (толще стенка, уширение столба, чаще
   поперечины) — модель пересобирается с усилением сама (см. build), а в отчёте видно, что и почему усилено. */
const WIND_={'1a':0.17,'1':0.23,'2':0.30,'3':0.38,'4':0.48,'5':0.60,'6':0.73,'7':0.85};
const KW=0.5*(1+1.22*0.85);        // местность B (дачный посёлок, деревья), высота до 5 м: k(z)·(1+ζ·ν)
const RY=235*0.95,EST=2.06e5;       // сталь С245/Ст3, γc = 0,95
function secOf(sec){
 if(sec[0]==='r'){const [Dd,t]=sec.slice(1).split('x').map(Number),d=Dd-2*t,A=Math.PI*(Dd*Dd-d*d)/4,I=Math.PI*(Dd**4-d**4)/64;return{A,Ix:I,Iy:I,Wx:I/(Dd/2),Wy:I/(Dd/2),ix:Math.sqrt(I/A),iy:Math.sqrt(I/A),h:Dd,b:Dd,t};}
 const [h,b,t]=sec.split('x').map(Number),A=2*t*(h+b-2*t),Ix=Ipr(b,h,t),Iy=Ipr(h,b,t);
 return{A,Ix,Iy,Wx:Ix/(h/2),Wy:Iy/(b/2),ix:Math.sqrt(Ix/A),iy:Math.sqrt(Iy/A),h,b,t};}
const chiC=lb=>{if(lb<=0.2)return 1;const F=0.5*(1+0.49*(lb-0.2)+lb*lb);return Math.min(1,1/(F+Math.sqrt(F*F-lb*lb)));}; // кривая «c»
const lbar=(L0,i)=>L0/i*Math.sqrt(RY/EST)/Math.PI;
// навесы без стен (EN 1991-1-4, табл. 7.6/7.7): [+cf, −cf при φ=0, −cf при φ=1], по уклону
const CFM=[[0,0.2,-0.5,-1.3],[5,0.4,-0.7,-1.4],[10,0.5,-0.9,-1.4],[15,0.7,-1.0,-1.4],[20,0.8,-1.1,-1.5],[25,1.0,-1.2,-1.6],[30,1.2,-1.3,-1.6],[45,1.4,-1.4,-1.7]];
const CFD=[[0,0.2,-0.5,-1.3],[5,0.3,-0.6,-1.3],[10,0.4,-0.6,-1.4],[15,0.4,-0.6,-1.4],[20,0.6,-0.6,-1.4],[25,0.7,-0.6,-1.4],[30,0.9,-0.6,-1.4],[45,1.1,-0.7,-1.5]];
const cfAt=(T,a)=>{let i=0;while(i<T.length-2&&a>T[i+1][0])i++;const A=T[i],B=T[i+1],k=Math.max(0,Math.min(1,(a-A[0])/(B[0]-A[0])));return A.map((v,j)=>v+(B[j]-v)*k);};
// сотовый поликарбонат 8 мм, ширина опирания ≤ 1050: шаг поперечин по таблицам производителей (нормативная нагрузка, кПа)
const pcStepMax=qn=>Math.round(790*Math.sqrt(1/Math.max(0.6,qn))/10)*10;
const pcmStepMax=qn=>Math.round(650*Math.sqrt(1/Math.max(0.6,qn))/10)*10;

function verify(m){
 const cfg=m.cfg,P=m.parts,rows=[],fixes={},N_=m.poly||0,ang=m.ang,ca=Math.cos(ang*RAD),sa=Math.sin(ang*RAD);
 const Sg=SNOW_[cfg.snow]||1.5,w0=WIND_[cfg.wind]||0.23,q=w0*KW,gR=GROOF[m.cov]||0.1;
 const mu=ang<=30?1:Math.max(0,(60-ang)/30),muL=(m.gable||N_)&&ang>=20&&ang<=30?1.25:1;   // muL — неравномерный снег (подветренный скат)
 const S=Sg*mu,Sd=1.4*S;
 // лестница усилений рамы — от дешёвого к дорогому; следующая ступень предлагается, пока проверка не пройдёт
 const maxNP=N_?0:Math.max(3,Math.floor((m.D-60)/650)+1);
 const ladder=()=>N_?(m.postSec==='r76x3'?{postR:'r76x4'}:null):m.spigotSec==='50x50x2'?{spigot:'50x50x3'}:m.postSec==='60x60x2'?{post:'60x60x3'}:!m.baseFixed?{base:'fixed'}:m.spigotSec!=='50x50x4'?{spigot:'50x50x4',post:'60x60x4'}:m.nP<maxNP?{nP:m.nP+1}:null;
 const morePortals=()=>N_||m.nP>=maxNP?null:{nP:m.nP+1};
 const steeper=()=>N_&&ang<40?{ang:Math.min(40,ang+3)}:null;
 const hipUp=()=>N_===6&&m.hip.sec!=='100x50x3'?{hip:'100x50x3'}:steeper();
 const row=(grp,name,util,val,note,fix)=>{rows.push({grp,name,util:Math.max(0,util),val:val||'',note:note||'',fix:fix||null});if(util>1&&fix)Object.assign(fixes,fix);};
 const kN=v=>Math.abs(v)<950?Math.round(v/10)*10+' Н':(v/1000).toFixed(1).replace('.',',')+' кН',kNm=v=>(v/1e6).toFixed(2).replace('.',',')+' кН·м',MPa=v=>Math.round(v)+' МПа',mm=v=>Math.round(v)+' мм',pct=v=>Math.round(v*100)+'%';
 const tubes=r=>P.filter(p=>p.kind==='tube'&&p.role===r),lo=p=>Math.min(p.o[1],p.o[1]+p.az[1]*p.L),hi=p=>Math.max(p.o[1],p.o[1]+p.az[1]*p.L);
 // ---------- общие величины ----------
 const G=P.reduce((s,p)=>s+(p.role==='pillar'||p.role==='sand'||p.layer==='decor'?0:massOf(p)),0)*9.81;    // вес над фундаментом, Н
 let plan;
 if(N_)plan=N_/2*(m.R+m.ovh)**2*Math.sin(2*Math.PI/N_)/1e6;
 else if(m.gable)plan=(m.W+2*m.ovh)*(m.D+2*m.ovhZ)/1e6;
 else if(m.slopeBack)plan=(m.W+300)*(m.D-60+2*m.pgOv)/1e6;
 else plan=(m.W+m.ovhL+m.ovhR)*(m.D+2*m.ovhZ)/1e6;
 const nPost=m.FW?P.filter(p=>p.role==='postW'&&!/входа/.test(p.name)).length:P.filter(p=>p.role==='post'||p.role==='postR').length;
 // загромождение под навесом φ: доля сплошных бортов по периметру и высоте
 const eaveH=m.F+m.H,per=N_?N_*m.side:2*(m.W+m.D),solid=cfg.fill==='prof'?1:cfg.fill==='euro'?0.72:0.76;
 const fillA=m.fillInfo.reduce((s,f)=>s+f.len*f.h,0)*solid;
 const WA=m.dress&&m.dress.wins.length?m.dress.winA:null;   // мягкие окна считаем закрытыми: под навесом всё загромождено, стены сплошные
 const NA=m.dress&&m.dress.nets.length&&!WA?m.dress.netA:null,NS=0.35;   // москитная сетка без окон: сплошность полотна ≈ 0,35 (оценка), по всей площади стен
 const phi=WA?1:Math.min(1,(fillA+(NA?NA.a*1e6*NS:0))/(per*eaveH));
 const cf=cfAt(m.gable||N_?CFD:CFM,ang),cfUp=cf[2]+(cf[3]-cf[2])*phi,cfDn=cf[1];
 const Wup=q*Math.abs(cfUp)*plan*1000,Wdn=q*cfDn*plan*1000;                 // Н, нормативные
 const env={Sg,S,w0,q,phi,cfUp,cfDn,plan,G,Wup,Wdn,mu,muL};
 // ---------- 1. кровельное покрытие ----------
 const step=m.rows&&m.rows.length>1?Math.max(...m.rows.slice(1).map((s,i)=>s-m.rows[i])):500;
 const qn=S*muL+gR,qd=(Sd*muL+1.1*gR)*ca;          // на покрытие: нормативная и расчётная (поперёк ската)
 const qloc=1.4*q*Math.abs(cfUp)*1.5;              // местный отсос у кромок, расчётный
 if(m.cov==='pc'){const b=m.pg?m.pg.step:step,bm=pcStepMax(qn);
  row('Кровля',`Сотовый поликарбонат 8 мм: шаг опор ${mm(b)} (допустимо ${mm(bm)} при ${qn.toFixed(2).replace('.',',')} кПа)`,b/bm,'',`по таблицам производителей, ширина опирания ≤ 1050 мм`,{pcStep:Math.floor(bm*0.95/10)*10});}
 else if(m.cov==='pcm'){const bm=pcmStepMax(qn);row('Кровля',`Монолитный профилированный поликарбонат: шаг обрешётки ${mm(step)} (допустимо ${mm(bm)})`,step/bm,'','',{purStep:Math.floor(bm*0.95/10)*10});}
 else if(m.cov==='ondulin'){const lim=ang<15?450:610;row('Кровля',`Ондулин: шаг обрешётки ${mm(step)} (по инструкции ≤ ${lim} мм при уклоне ${ang}°)`,step/lim,'',`снеговая ${qn.toFixed(2).replace('.',',')} кПа — в пределах допуска производителя`,{purStep:lim});}
 else if(m.cov==='shingle'){const s=step,M=qd*1e-3*s*s/10,W=12*12/6,f=(m.poly?0.7*8.2:0.7*16.4)/1.2;
  row('Кровля',`OSB-3 12 мм под гибкую черепицу: пролёт ${mm(s)}`,M/W/f,`σ ${(M/W).toFixed(1).replace('.',',')} из ${f.toFixed(1).replace('.',',')} МПа`,m.poly?'плиты рядами вдоль карниза — по слабой оси':'плиты вдоль ската — по сильной оси',{purStep:Math.floor(s*Math.sqrt(1/(M/W/f))/10)*10});}
 else{const Wsh={c20:2800,tile:2000,falc:1200,ondulin:0}[m.cov]||2000,s=m.cov==='tile'?350:step,M=Math.max(qd,qloc)*1e-3*1000*s*s/10;
  row('Кровля',`${COVERS[m.cov].s}: лист на обрешётке с шагом ${mm(s)}`,M/Wsh/220,MPa(M/Wsh),'лист 0,45–0,5 мм, неразрезной по опорам');}
 // крепёж кровли на отрыв: один саморез на ~0,14 м² (через волну на каждой обрешётке)
 {const a=Math.min(step,600)*275/1e6,T=(qloc-0.9*gR)*a*1000;row('Кровля','Саморез кровли на отрыв ветром (у кромки)',T/1200,kN(T)+' на саморез','вырыв самореза 4,8 мм из стенки 2 мм ≈ 1,2 кН');}
 // ---------- 2. обрешётка / щиты / рёбра ----------
 const WDm=m.mat&&m.mat!=='steel';
 if(WDm){}
 else if(N_){const pu=m.purlin,sp=secOf(pu.sec),Lp=2*(m.R+m.ovh)*Math.sin(Math.PI/N_),st=m.rows[1]-m.rows[0],qq=(Sd*muL+1.1*gR)*ca*st/1000,qqn=(S*muL+gR)*ca*st/1000,M=qq*Lp*Lp/8,f=5*qqn*Lp**4/(384*EST*sp.Ix);
  row('Обрешётка и фермы',`Обрешётка шатра ${pu.sec.replace(/x/g,'×')}: пролёт у карниза ${mm(Lp)}, шаг ${mm(st)}`,Math.max(M/sp.Wx/RY,f/(Lp/150)),`σ ${MPa(M/sp.Wx)}, прогиб ${mm(f)} (≤ L/150)`,'',m.cov==='tile'?steeper():{purStep:Math.max(250,Math.floor(st/Math.max(1.01,Math.sqrt(M/sp.Wx/RY))/10)*10)});
  // торец обрешётки — ушко 20×10 на ребре + 2 самореза 5,5×32: ушко гнётся из плоскости (упор обрешётки вдоль ската), саморезы — на срез
  {const sa_=Math.sin(ang*RAD),V=(Sd*muL+1.1*gR)*st/1000*sa_*Lp/2,T=Math.max(0,(qloc-0.9*gR)*st*Lp/2/1e3),ph=secOf(pu.sec).h||40,Mt=V*(ph/2+3),Wt=20*10*10/6,
    u=Math.max(Mt/Wt/RY,V/4200,T/4200);
   row('Обрешётка и фермы',`Ушко обрешётки 20×10 на ребре: упор вдоль ската ${kN(V)}, отрыв ${kN(T)}`,u,`σ ${MPa(Mt/Wt)}`,'пластина 10 мм вварена в ребро с двух сторон; 2 самореза 5,5 в стенку 2 мм ≈ 2×2,1 кН',{purStep:Math.max(250,Math.floor(st/Math.max(1.01,u)/10)*10)});}
  const hp=m.hip,hs=secOf(hp.sec),R=m.R,Lh=(R+m.ovh)/ca,trib=m.side/2/1000,qh=(Sd*muL+1.1*gR)*trib,qhn=(S*muL+gR)*trib,Mh=qh*(R+m.ovh)**2/8*0.66;
  const Wt=(Sd+1.1*gR)*plan*1000,Hr=Wt/N_/2/Math.tan(ang*RAD),Nh=Hr/ca,fh=5*qhn*ca*Lh**4/(384*EST*hs.Ix)*0.66;
  row('Обрешётка и фермы',`Ребро шатра ${hp.sec.replace(/x/g,'×')}: изгиб + сжатие (распор ${kN(Hr)})`,Mh/hs.Wx/RY+Nh/(chiC(lbar(Lh,hs.iy))*hs.A*RY),`прогиб ${mm(fh)} (≤ L/200 = ${mm(Lh/200)})`,'треугольная грузовая площадь',hipUp());
  const T=Hr/(2*Math.sin(Math.PI/N_)),rs=secOf('60x40x2');
  row('Обрешётка и фермы','Ригель обвязки 60×40 — растяжение от распора шатра',T/rs.A/RY,kN(T),'кольцо обвязки держит рёбра от разъезда');
  row('Узлы','Болт M10 ригеля обвязки — срез и смятие стенки 2 мм',T/16000,kN(T),'язык 6 мм в пропиле, болт работает на 2 среза; смятие стенок 2×2 мм ≈ 16 кН',steeper());}
 else if(m.pg){const wp=m.pg.wp,st=m.pg.step,s20=secOf('40x20x2'),s40=secOf('40x40x2'),Lc=wp-80,qc=(Sd+1.1*gR)*ca*st/1000,qcn=(S+gR)*ca*st/1000,M=qc*Lc*Lc/8,f=5*qcn*Lc**4/(384*EST*s20.Ix);
  row('Обрешётка и фермы',`Поперечина щита 40×20: пролёт ${mm(Lc)}, шаг ${mm(st)}`,Math.max(M/s20.Wx/RY,f/(Lc/150)),`σ ${MPa(M/s20.Wx)}, прогиб ${mm(f)}`,'');
  const L=m.sP,qr=(Sd+1.1*gR)*wp/2/1000,qrn=(S+gR)*wp/2/1000,Mr=qr*L*L/8,fr=5*qrn*L**4/(384*EST*s40.Ix);
  row('Обрешётка и фермы',`Стропило щита 40×40: пролёт ${mm(L)} между порталами`,Math.max(Mr/s40.Wx/RY,fr/(L/200)),`σ ${MPa(Mr/s40.Wx)}, прогиб ${mm(fr)}`,'',morePortals());}
 else{const L=m.sP,s=secOf('40x20x2'),qd2=(Sd*muL+1.1*gR)*ca*step/1000,qn2=(S*muL+gR)*ca*step/1000,qu=(1.4*q*Math.abs(cfUp)*1.2-0.9*gR*ca)*step/1000,M=Math.max(qd2,qu)*L*L/8,f=5*qn2*L**4/(384*EST*s.Ix);
  row('Обрешётка и фермы',`Обрешётка 40×20 на ребро: пролёт ${mm(L)}, шаг ${mm(step)}`,Math.max(M/s.Wx/RY,f/(L/150)),`σ ${MPa(M/s.Wx)}, прогиб ${mm(f)} (≤ ${mm(L/150)})`,'сечение и шаг подобраны под снеговой район',step>300&&m.cov!=='tile'?{purStep:Math.floor(step/Math.max(1.01,Math.sqrt(M/s.Wx/RY),f/(L/150))/10)*10}:morePortals());}
 // ---------- 3. ригель портала / ферма ----------
 if(!N_&&!WDm){const trib=m.sP,qb=((Sd*(m.gable?muL:1)+1.1*gR)*trib+1.05*0.05*trib)/1000,qbn=(S+gR)*trib/1000;
  if(m.gable){const t=Math.tan(ang*RAD),Lh=0.55*m.W/2,Ls=Lh/ca,s60=secOf('60x40x2'),s40=secOf('40x40x2'),Hh=qb*m.W*m.W/8/(m.W/2*t),Nr=Hh/ca;
   row('Обрешётка и фермы',`Стропило фермы 60×40: изгиб между узлами ${mm(Lh)} + сжатие ${kN(Nr)}`,qb*Lh*Lh/8/s60.Wx/RY+Nr/(chiC(lbar(Ls,s60.iy))*s60.A*RY),`прогиб ${mm(5*qbn*ca*Ls**4/(384*EST*s60.Ix))}`,'',morePortals());
   const bs=secOf(m.beam.sec);row('Обрешётка и фермы',`Ригель-затяжка ${m.beam.sec.replace(/x/g,'×')} — растяжение`,Hh/bs.A/RY,kN(Hh),'затяжка держит распор стропил',morePortals());
   const Ns=qb*m.W/4,Lst=Math.max(...tubes('strut').map(p=>p.cutLen),400);row('Обрешётка и фермы',`Раскос фермы 40×40: сжатие ${kN(Ns)}, длина ${mm(Lst)}`,Ns/(chiC(lbar(Lst,s40.ix))*s40.A*RY),'','',morePortals());}
  else{const bs=secOf(m.beam.sec),Lb=m.W-2*(m.L45+60),cL=m.ovh+60+m.L45,M=Math.max(qb*Lb*Lb/8,qb*cL*cL/2),f=5*qbn*Lb**4/(384*EST*bs.Ix);
   row('Обрешётка и фермы',`Ригель портала ${m.beam.sec.replace(/x/g,'×')}: пролёт ${mm(Lb)}, вылет ${mm(cL)}`,Math.max(M/bs.Wx/RY,f/(Lb/200)),`σ ${MPa(M/bs.Wx)}, прогиб ${mm(f)}`,'сечение подобрано по пролёту и снеговому району',morePortals());}}
 // ---------- 4. стойки, подкосы, стык на шипе — рамы против ветра ----------
 // вертикаль: снег + своя масса на самую нагруженную стойку
 const Gpost=G-(m.free?P.filter(p=>p.step==='ring').reduce((s,p)=>s+massOf(p),0)*9.81:0);   // рама основания ниже стоек и их не грузит
 const Ntot=(Sd+1.1*gR)*plan*1000+1.05*Gpost,Nmax=Ntot/nPost*(N_?1:1.3);
 // горизонталь: борта (наветренный + 0,5 подветренного), кровля, стойки
 const sideA=k=>m.fillInfo.filter(f=>k(f.run)).reduce((s,f)=>s+f.len*f.h,0)*solid/1e6;
 const Ax=Math.max(sideA(r=>/^(left|right)/.test(r)),WA?WA.x:0)+(NA?NA.x*NS:0),Az=Math.max(sideA(r=>/^(back|front)/.test(r)),WA?WA.z:0)+(NA?NA.z*NS:0);
 if(WA){const ws=m.dress.wins,A=ws.reduce((s,w)=>s+w.w*w.h/1e6,0),nb=ws.reduce((s,w)=>s+w.brackets,0),Fb=1.4*q*1.3*A*1000/Math.max(1,nb)*2;
  const wd=m.dress.scr.dww>0,cap=wd?660:3140;   // брус: 2 × 1 МПа·π·4,2·25 (СП 64); сталь 2 мм: 2 × 0,65·d·t·fu/1,25 (EN 1993-1-3)
  row('Оформление',`Мягкие окна закрыты: ${A.toFixed(1).replace('.',',')} м² стен, ветер на скобу ${kN(Fb)} (×2 у середины кромки)`,Fb/cap,'',`скоба на 2 саморезах держит на вырыв ≈ ${kN(cap)} (${wd?'брус, СП 64: 1 МПа × πdl':'стенка 2 мм: 0,65·d·t·fu'}); стены сплошные — ветер на каркас и фундамент ниже посчитан с ними`);}
 const roofH=dir=>{if(N_)return q*Math.max(cfDn,Math.abs(cfUp))*plan*sa*0.5*1000;
  if(m.gable)return dir==='x'?q*0.6*plan*sa*1000:q*0.04*plan*1000;
  if(m.slopeBack)return dir==='z'?q*Math.max(cfDn,Math.abs(cfUp))*plan*sa*1000:q*0.04*plan*1000;
  return dir==='x'?q*Math.max(cfDn,Math.abs(cfUp))*plan*sa*1000:q*0.04*plan*1000;};
 const postsA=nPost*0.06*eaveH/1e6*2.0;
 // стены: открытые борта — как заборы (наветренный 1,3 + затенённый подветренный 0,6); закрытые окнами — замкнутый объём,
 // СП 20.13330, прил. В.1.2: +0,8 на наветренную стену и −0,5 на подветренную, т. е. 1,3 на площадь одной стены; стойки тогда внутри
 const wallH=(A,Aw)=>Aw!=null?q*1.3*(Aw/2)*1000:q*(1.3*A*0.5+0.6*A*0.5)*1000,pA=WA?0:q*postsA*1000*0.5;
 const Hx=1.4*(wallH(Ax,WA?WA.x:null)+roofH('x')+pA),Hz=1.4*(wallH(Az,WA?WA.z:null)+roofH('z')+pA);
 let Mbs=0,MbW=0;
 if(WDm)verifyWood({m,row,kN,kNm,MPa,mm,Sd,S,muL,gR,ca,step,q,cfUp,Wup,G,Hx,Hz,Nmax,nPost,morePortals,ladder,plan,steeper,setMb:v=>{MbW=v;}});
 else{
 const beta=m.baseFixed?1:0.5;                     // пластина 6 мм на 4 шпильках — полужёсткое защемление; 10 мм — жёсткое. На раме то же: стык поперечины держит момент
 const frame=(H,nFr,brace,lbl)=>{if(!brace)return null;
  const V=H/nFr/2,yb=lo(brace)-68,yTop=hi(brace)-68,a=Math.max(150,yTop-yb),Mn=V*yb*(1-beta/2),Mb=V*yb*beta/2,ang_=Math.atan2(Math.abs(brace.az[1]),Math.hypot(brace.az[0],brace.az[2])),Nb=Mn/a/Math.cos(ang_);
  return{V,yb,a,Mn,Mb,Nb,ang:ang_,lbl};};
 const brP=tubes(N_?'ringBrace':'brace')[0],brS=tubes('sideBrace')[0];
 const nFx=N_?N_/2:Math.max(2,m.nP-1),nFz=N_?N_/2:2*(m.nP-1);
 const fx=frame(Hx,nFx,brP,N_?'по кругу':'поперёк (порталы)'),fz=N_?null:frame(Hz,nFz,brS,'вдоль (боковые рамы)');
 const psec=m.postSec||(N_?'r76x3':'60x60x2'),ps=secOf(psec),hPost=(N_?(hi(tubes('postR')[0])):m.F+m.H)-68;
 const Ncr=Math.PI**2*EST*ps.Ix/(2.0*(fx?fx.yb:hPost))**2,amp=1/Math.max(0.15,1-Nmax/Ncr);
 const chiP=chiC(lbar(2.0*(fx?fx.yb:hPost),ps.ix));
 for(const f of [fx,fz].filter(Boolean)){
  const uN=Nmax/(chiP*ps.A*RY),uM=f.Mn*amp/(ps.Wx*RY);
  row('Каркас',`Стойка ${psec.replace(/^r/,'Ø').replace(/x/g,'×')} у подкоса, ветер ${f.lbl}: N ${kN(Nmax)} + M ${kNm(f.Mn*amp)}`,uN+uM,`сжатие ${pct(uN)} + изгиб ${pct(uM)}`,`рама с подкосами, база ${m.baseFixed?'жёсткая (пластина 10 мм)':'полужёсткая'}; устойчивость — как у консоли (μ = 2)`,ladder());
  const bs=secOf('40x40x2'),Lb=(f===fz?brS:brP).cutLen;
  row('Каркас',`Подкос 40×40 (${f.lbl}): сжатие ${kN(f.Nb)}, длина ${mm(Lb)}`,f.Nb/(chiC(lbar(Lb,bs.ix))*bs.A*RY),'','');
  if(N_)row('Узлы',`Болт M10 подкоса на языке (${f.lbl}): ${kN(f.Nb)}`,f.Nb/16000,'смятие стенок 2×2 мм ≈ 16 кН, срез 2 плоскости ≈ 28 кН','язык 6 мм в пропиле подкоса');
  else if(f===fz)row('Узлы',`Торцевая пластина боковой рамы: 2 сквозных болта M10 (${f.lbl}): ${kN(f.Nb)}`,f.Nb/28000,'срез 2 болтов ≈ 28 кН; сжатие — пластиной в грань оголовка','пластина 6 мм приварена к ригелю и подкосу');}
 if(!N_&&fx){const sg=m.spigotSec||'50x50x2',ss=secOf(sg),yj=m.Yj-68,V=fx.V,Mj=Math.max(Math.abs(V*yj-fx.Mb),fz?Math.abs(fz.V*yj-fz.Mb):0)*amp;
  row('Узлы',`Стык «стойка — оголовок» на шипе ${sg.replace(/x/g,'×')}: M ${kNm(Mj)}`,Mj/(ss.Wx*RY),`предел ${kNm(ss.Wx*RY)}`,'шип входит в стойку на 150 мм, плотная посадка обязательна',ladder());
  const bp=Math.max(fx?fx.Mb:0,fz?fz.Mb:0)*amp;Mbs=fx?fx.Mb*amp:0;const Tst=bp/90/2+Math.max(0,1.4*Wup-0.9*(G+0))/nPost/4;
  const Rst=m.studs88?34000:13500;row(m.free?'Основание':'Фундамент',`Шпильки M12 опорной пластины: момент ${kNm(bp)} + отрыв`,Tst/Rst,kN(Tst)+' на шпильку',m.studs88?'класс 8.8 ≈ 34 кН':'класс 4.8, As = 84 мм² ≈ 13,5 кН',m.studs88?morePortals():{studs88:true});
  if(m.baseFixed){const t=m.baseT||10,Mpl=bp/180*15,Wpl=60*t*t/6;row(m.free?'Основание':'Фундамент',`Опорная пластина ${t} мм: изгиб у стенки стойки`,Mpl/Wpl/RY,MPa(Mpl/Wpl),'усилие в шпильке × вылет 15 мм, ширина ≈ 60 мм на шпильку',t<16?{base:'fixed16'}:morePortals());}}
 // голова на шипе — отрыв ветром на болт M10
 if(!N_){const Tb=Math.max(0,1.4*Wup*1.3-0.9*G)/nPost;row('Узлы','Болт M10 «оголовок — стойка»: отрыв ветром',Tb/28000,kN(Tb),'2 плоскости среза ≈ 28 кН');}
 }
 // ---------- 5. фундамент ----------
 if(m.free){const Fc=(A,d)=>({s:q*(1.3*A*0.5+0.6*A*0.5)*1000,r:roofH(d),p:q*postsA*1000*0.5}),fh=Math.max(0,...m.fillInfo.map(f=>f.h));
  verifyBase({m,row,kN,kNm,MPa,mm,pct,G,Wup,S,gR,plan,nPost,Hx,Hz,morePortals,Fx:Fc(Ax,'x'),Fz:Fc(Az,'z'),yFill:m.Bb+fh/2,yRoof:(m.F+m.H+m.dims.top)/2,yPost:(m.F+m.H)/2,Mbase:WDm?MbW:Mbs});}
 else{const pil=P.filter(p=>p.role==='pillar'),bell=P.some(p=>p.role==='bell'),wPil=Math.PI*0.1*0.1*1.245*24000,Abase=bell?Math.PI*0.2*0.2:Math.PI*0.15*0.15;
  const Nser=((S+gR)*plan*1000+G+(m.isFloor?(2.0*0.9+0.35)*footArea(cfg)*1000:0))/nPost*(N_?1.1:1.3)+wPil,p_=Nser/Abase/1000;
  row('Фундамент',`Давление на грунт под столбом${bell?' с уширением Ø400':' (подушка Ø300)'}`,p_/200,`${Math.round(p_)} кПа из 200`,'200 кПа — суглинок тугопластичный / песок средней крупности; на слабом грунте — уширение',bell?morePortals():{bell:true});
  const up=(1.4*Wup*1.3-0.9*G)/nPost,cone=bell?1.047*1.2*(0.2*0.2+0.2*0.52+0.52*0.52)*17000:0,res=0.9*(wPil+cone);
  row('Фундамент',`Отрыв столба ветром${bell?' (уширение держит конус грунта)':''}`,up>0?up/res:0,up>0?`${kN(up)} из ${kN(res)}`:'отрыва нет — вес беседки больше подъёмной силы','рубероид снимает силы пучения, поэтому держит только вес столба'+(bell?' и грунт над уширением':''),{bell:true});}
 // ---------- 6. пол и борта ----------
 if(m.isFloor){const s40=secOf('40x40x2'),s60=secOf('60x40x2'),qL=2.0*1.2+0.35*1.1;
  const js=m.joistStep||480,Lj=N_?2*m.apo/(m.R>1650?3:2):m.sP,qj=qL*js/1000,Mj=qj*Lj*Lj/8,fj=5*2.35*js/1000*Lj**4/(384*EST*s40.Ix);
  if(m.FW)verifyFloorW({m,row,kN,MPa,mm,Tu:Math.max(0,1.4*Wup*1.3-0.9*G)/nPost,Nmax,WS:WOODS[cfg.wood]});
  else row('Пол и борта',`Лага 40×40: пролёт ${mm(Lj)}, шаг ${mm(js)} (2 кПа)`,Math.max(Mj/s40.Wx/RY,fj/(Lj/250)),`σ ${MPa(Mj/s40.Wx)}, прогиб ${mm(fj)}`,'');
  const Lb=m.floorSpan||1300,trib=N_?Lj:m.sP,qb=qL*trib/1000,Mb=qb*Lb*Lb/8;
  if(!m.FW)row('Пол и борта',`Балка пола 60×40: пролёт ${mm(Lb)}`,Mb/s60.Wx/RY,MPa(Mb/s60.Wx),'');
  const wpc=cfg.deck==='wpc';
  if(wpc)row('Пол и борта',`Доска ДПК: пролёт ${mm(js)} (по испытаниям производителя ≤ 400 мм)`,js/400,'','пустотелую доску ДПК считают по допуску производителя, а не по сечению');
  else{const Pd=1.5e3*1.2,Md=Pd*js/4,Wd=140*28*28/6,fm=0.7*24/1.3;
   row('Пол и борта',`Доска настила 28×140: пролёт ${mm(js)}, сосредоточенная 1,5 кН`,Math.max(js/600,Md/Wd/fm),`σ ${MPa(Md/Wd)} из ${MPa(fm)}`,'хвоя/лиственница C24, улица, кратковременная нагрузка');}}
 const TMm=WDm,RWb=WOODS[cfg.wood].RA*WOODS[cfg.wood].kR*WMW*WMV;
 {const lr=Math.max(...m.fillInfo.map(f=>f.len),0);if(lr){const M=1.2*0.3*lr*lr/8;if(TMm){const Wr=50*100*100/6;row('Пол и борта',`Поручень 50×100: 0,3 кН/м поперёк, пролёт ${mm(lr)}`,M/Wr/RWb,MPa(M/Wr),'СП 20: перила частного дома');}else{const s=secOf('40x40x2');row('Пол и борта',`Поручень 40×40: 0,3 кН/м поперёк, пролёт ${mm(lr)}`,M/s.Wx/RY,MPa(M/s.Wx),'СП 20: перила частного дома');}}}
 // стойка входа — консоль от своей пластины 120×120×8 на 2 шпильках M12 (плечо 80 мм): половина нажима на переднюю секцию
 {const nw=m.parts.find(p=>p.role==='newel'),fr=m.fillInfo.filter(f=>/^front/.test(f.run));if(nw&&fr.length){const L=Math.max(...fr.map(f=>f.len)),P=1.2*0.3*L/2,h=(TMm?m.F+Math.max(...fr.map(f=>f.h))+60:nw.L)-20-68,M=P*h,s=secOf('40x40x2'),T=M/80,Mp=T*20,Wp=60*8*8/6,hS=TMm?m.yS-68:h,Ms=P*hS;
  if(TMm){const hW=h-(m.yS-60),Mw=P*hW,Wb=100*100*100/6;row('Пол и борта',`Стойка входа из бруса 100×100: нажим ${kN(P)}`,Mw/Wb/RWb,MPa(Mw/Wb),'консоль от стальной ножки');}
  row('Пол и борта',`${TMm?'Ножка стойки входа':'Стойка входа'} 40×40: нажим ${kN(P)} на высоте ${mm(h)}`,Math.max(Ms/s.Wx/RY,T/13500,Mp/Wp/RY),`σ ${MPa(Ms/s.Wx)}, шпилька ${kN(T)}, пластина ${MPa(Mp/Wp)}`,'пластина 120×120×8 на 2 шпильках M12 поперёк борта');}}
 const max=rows.reduce((a,r)=>Math.max(a,r.util),0);
 return{rows,fixes,max,ok:max<=1.0001,env};
}
