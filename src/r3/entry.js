import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
try{
/* ================== 3D (three.js): 120 fps, жесты трекпада, обзор 360° ================== */




const App=window.App,BM=window.BM;
const host=document.getElementById('three');
const DPR=Math.min(window.devicePixelRatio||1,2);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(DPR);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
if(renderer.debug)renderer.debug.checkShaderErrors=false;   // без синхронного getProgramInfoLog: компиляция шейдеров не останавливает кадр
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const pmrem=new THREE.PMREMGenerator(renderer);
const envTex=pmrem.fromScene(new RoomEnvironment(),0.04).texture;scene.environment=envTex;
const DARK=matchMedia('(prefers-color-scheme: dark)').matches&&document.documentElement.dataset.theme!=='light';
scene.fog=new THREE.Fog(DARK?0x16202a:0xdfe6ea,18,42);
const camera=new THREE.PerspectiveCamera(35,1,0.05,200);
camera.position.set(6.4,3.6,7.6);camera.lookAt(0,1.35,0);camera.updateMatrixWorld();
const hemi=new THREE.HemisphereLight(0xe6efff,0x5d5442,0.55);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4e6,2.0);sun.position.set(5,8,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-5,right:5,top:5.5,bottom:-4,near:0.5,far:25});sun.shadow.bias=-0.0003;sun.shadow.normalBias=0.025;scene.add(sun);
let needsRender=true,matDirty=true;
// мировые матрицы ~3–5 тыс. мешей пересчитываются только когда сцена изменилась, а не на каждом кадре вращения камеры
scene.matrixWorldAutoUpdate=false;
const dirty=shadows=>{needsRender=true;matDirty=true;if(shadows)renderer.shadowMap.needsUpdate=true;};

renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.__showErr('Видеокарта сбросила WebGL-контекст. Обновите страницу (⌘R).');});
/* ---- текстуры ---- */
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=8;return t;}
const rnd=(()=>{let s=11;return()=>(s=(s*16807)%2147483647)/2147483647;})();
const woodDraw=(g,w,h)=>{g.fillStyle='#a77a49';g.fillRect(0,0,w,h);for(let i=0;i<80;i++){const y=rnd()*h;g.strokeStyle=`rgba(${70+rnd()*40|0},${45+rnd()*25|0},${20+rnd()*15|0},${0.10+rnd()*0.22})`;g.lineWidth=0.6+rnd()*2;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=32)g.lineTo(x,y+Math.sin(x/90+i)*3);g.stroke();}for(let i=0;i<5;i++){g.fillStyle='rgba(80,50,25,.35)';g.beginPath();g.ellipse(rnd()*w,rnd()*h,9+rnd()*8,3+rnd()*3,0,0,7);g.fill();}};
const woodTex=canvasTex(1024,256,woodDraw,[1/1500,1/280]);
const woodTex2=canvasTex(1024,256,woodDraw,[1,1]);
const osbTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#d8b67c';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`hsla(${30+rnd()*15},${40+rnd()*20}%,${45+rnd()*25}%,.55)`;g.save();g.translate(rnd()*w,rnd()*h);g.rotate(rnd()*3);g.fillRect(-14,-4,28+rnd()*20,6+rnd()*5);g.restore();}},[1/1250,1/1250]);
// гибкая черепица: светлые лепестки с посыпкой и тёмными швами — цвет задаётся материалом
// гибкая черепица «соты» в натуральную величину (лепесток 325 мм, шаг ряда 145 мм): верхний ряд лежит на нижнем и отбрасывает на него тень,
// в просветах виден нижний ряд того же цвета, а не чёрный фон; яркость по лепесткам повторяется с периодом текстуры — без шва на стыке
const shTex=canvasTex(512,512,(g,w,h)=>{const R=8,C=4,rh=h/R,tw=w/C,L=[...Array(R)].map(()=>[...Array(C)].map(()=>70+rnd()*16)),md=(a,n)=>((a%n)+n)%n;
 g.fillStyle='hsl(0,0%,62%)';g.fillRect(0,0,w,h);
 const tab=(x,y)=>{g.beginPath();g.moveTo(x,y-rh);g.lineTo(x+tw,y-rh);g.lineTo(x+tw,y+rh*0.45);g.lineTo(x+tw*0.68,y+rh);g.lineTo(x+tw*0.32,y+rh);g.lineTo(x,y+rh*0.45);g.closePath();};
 for(let r=R;r>=-1;r--)for(let c=-1;c<=C;c++){const x=c*tw+md(r,2)*tw/2,y=r*rh,l=L[md(r,R)][md(c,C)];
  g.save();g.translate(0,4);tab(x,y);g.fillStyle='rgba(0,0,0,.26)';g.fill();g.restore();
  tab(x,y);g.fillStyle=`hsl(0,0%,${l}%)`;g.fill();g.save();g.clip();
  for(let k=0;k<70;k++){g.fillStyle=`hsla(0,0%,${l-16+rnd()*28}%,.75)`;g.fillRect(x+rnd()*tw,y-rh+rnd()*2*rh,2,2);}g.restore();
  tab(x,y);g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1.5;g.stroke();}},[1/1300,1/1160]);
// подкладочный ковёр: светло-серое полотно с армирующей сеткой
const ulTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#aeb6be';g.fillRect(0,0,w,h);g.strokeStyle='rgba(70,80,92,.28)';g.lineWidth=1;for(let i=-w;i<w*2;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+h,h);g.stroke();g.beginPath();g.moveTo(i,h);g.lineTo(i+h,0);g.stroke();}g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,0,w,6);},[1/300,1/300]);
const gravelTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#8a8781';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=110+rnd()*90|0;g.fillStyle=`rgb(${v},${v-4},${v-10})`;g.beginPath();g.ellipse(rnd()*w,rnd()*h,2+rnd()*5,2+rnd()*4,rnd()*3,0,7);g.fill();}},[5,5]);
const grassTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#6b8a48';g.fillRect(0,0,w,h);for(let i=0;i<6000;i++){g.fillStyle=`hsla(${78+rnd()*30},${28+rnd()*25}%,${26+rnd()*20}%,.55)`;g.fillRect(rnd()*w,rnd()*h,1.5,4+rnd()*5);}},[16,16]);

/* ---- материалы ---- */
const MAT={};
const mk=(n,p)=>{MAT[n]=new THREE.MeshStandardMaterial(p);MAT[n].userData.op=p.opacity??1;MAT[n].userData.tr=!!p.transparent;};
mk('steel',{color:0x3d4148,metalness:0.45,roughness:0.5});
mk('galv',{color:0xbcc3ca,metalness:0.85,roughness:0.32});
mk('weld',{color:0xf08a24,emissive:0x8a3a00,emissiveIntensity:0.35,metalness:0.35,roughness:0.42});
mk('pc',{color:0xcfe3ee,metalness:0,roughness:0.12,transparent:true,opacity:0.42,side:THREE.DoubleSide,depthWrite:false,forceSinglePass:true});   // тонкие прозрачные листы — один проход вместо двух
mk('concrete',{color:0x9b9a95,roughness:0.95});
mk('gasblock',{color:0xdcdad2,roughness:1});
mk('sand',{color:0xcdb58a,roughness:1});
mk('rebar',{color:0x6b4a35,metalness:0.4,roughness:0.7});
mk('grout',{color:0x8c8a85,roughness:0.95});
mk('roof',{color:0x45322e,metalness:0.3,roughness:0.5,side:THREE.DoubleSide});
mk('fill',{color:0x45322e,metalness:0.3,roughness:0.5,side:THREE.DoubleSide});
mk('osb',{color:0xffffff,roughness:0.9,map:osbTex,side:THREE.DoubleSide});
mk('shingle',{color:0xffffff,roughness:0.95,map:shTex,side:THREE.DoubleSide});
mk('underlay',{color:0xffffff,roughness:0.95,map:ulTex,side:THREE.DoubleSide});
mk('seal',{color:0x26282b,roughness:0.9});
mk('wood',{color:0xffffff,roughness:0.8,map:woodTex});
mk('timber',{color:0xffe9cf,roughness:0.62,map:woodTex});
mk('timberP',{color:0xfff0dc,roughness:0.7,map:woodTex});
mk('timberL',{color:0xd9a27c,roughness:0.62,map:woodTex});
mk('woodFill',{color:0xffffff,roughness:0.8,map:woodTex2});
mk('larch',{color:0xffffff,roughness:0.75,map:woodTex});
mk('wpc',{color:0xffffff,roughness:0.9,map:woodTex});
mk('gravel',{color:0xffffff,roughness:1,map:gravelTex});
mk('plastic',{color:0x151515,roughness:0.6});
// оформление: мягкие окна, окантовка, гирлянда, LED-лента
mk('pvc',{color:0xe4eff4,metalness:0,roughness:0.05,transparent:true,opacity:0.26,side:THREE.DoubleSide,depthWrite:false,forceSinglePass:true});
mk('pvcRoll',{color:0xb9ccd4,roughness:0.2,transparent:true,opacity:0.8});
mk('kant',{color:0x5b3b25,roughness:0.75});
mk('cable',{color:0x1c1c1c,roughness:0.55});
mk('bulb',{color:0xfff4dc,emissive:0xffb54c,emissiveIntensity:1.2,roughness:0.3});
mk('led',{color:0xfff6e2,emissive:0xffc670,emissiveIntensity:1.4,roughness:0.4});
mk('alu',{color:0xc9ced3,metalness:0.8,roughness:0.35});
mk('net',{color:0x3c4247,roughness:0.9,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false,forceSinglePass:true});
mk('netRoll',{color:0x7d858c,roughness:0.95,transparent:true,opacity:0.7});
mk('velcro',{color:0x6d7176,roughness:0.95});
const XRAYABLE=['steel','roof','fill','osb','shingle','underlay','wood','woodFill','larch','wpc','concrete','gasblock','gravel','grout','sand','timber','timberP','timberL'];
const HOVER=new THREE.MeshStandardMaterial({color:0xffa04a,emissive:0xff6a00,emissiveIntensity:0.55,metalness:0.2,roughness:0.5,side:THREE.DoubleSide});
const SELM=new THREE.MeshStandardMaterial({color:0x6ea2ff,emissive:0x2d6bd6,emissiveIntensity:0.5,metalness:0.2,roughness:0.5,side:THREE.DoubleSide});
const newCache={},ghostCache={},modCache={};
const newMat=n=>newCache[n]||(newCache[n]=(()=>{const m=MAT[n].clone();m.emissive=new THREE.Color(0xff7a1a);m.emissiveIntensity=0.3;return m;})());
const ghostMat=n=>ghostCache[n]||(ghostCache[n]=(()=>{const m=MAT[n].clone();m.transparent=true;m.opacity=0.08;m.depthWrite=false;return m;})());
const MODC=[0xe07a2e,0x2e7be0,0x2fa35a,0x9b4fd0,0x14a3a3,0xd4b11a,0xd0436a,0x6a8f2a,0x8a5cff,0x22a0d8,0xc9702a,0x3aa37c];
const modMat=k=>modCache[k]||(modCache[k]=new THREE.MeshStandardMaterial({color:MODC[Object.keys(modCache).length%MODC.length],metalness:0.3,roughness:0.5}));
const looseMat=new THREE.MeshStandardMaterial({color:0x9aa0a8,metalness:0.2,roughness:0.7,transparent:true,opacity:0.35,depthWrite:false});

/* ---- земля ---- */
const groundMat=new THREE.MeshStandardMaterial({color:0xffffff,map:grassTex,roughness:1,transparent:true,opacity:1});
const ground=new THREE.Mesh(new THREE.CircleGeometry(16,72),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const soil=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,1.3,48,1,true),new THREE.MeshStandardMaterial({color:0x6d5a45,roughness:1,transparent:true,opacity:0.18,side:THREE.BackSide,depthWrite:false}));soil.position.y=-0.65;soil.visible=false;scene.add(soil);

const root=new THREE.Group();root.scale.setScalar(0.001);scene.add(root);
const dimsG=new THREE.Group();root.add(dimsG);

/* ---- геометрия ---- */
const gc=new Map();
function rr(w,h,r,P){const s=new P();const x=-w/2,y=-h/2;r=Math.min(r,w/2-0.1,h/2-0.1);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function tubeGeo(p){
 if(p.wood){ // брус: сплошной, фаска 2 мм; волокна — вдоль длины (u — по z, v — поперёк)
  const g=new THREE.ExtrudeGeometry(rr(p.sx,p.sy,2,THREE.Shape),{depth:p.L,bevelEnabled:false,curveSegments:2});
  const a=g.attributes.position;if(p.cutA||p.cutB){for(let i=0;i<a.count;i++){const z=a.getZ(i);if(z<0.01&&p.cutA)a.setZ(i,BM.cutZ(p.cutA,a.getX(i),a.getY(i),0));else if(z>p.L-0.01&&p.cutB)a.setZ(i,BM.cutZ(p.cutB,a.getX(i),a.getY(i),p.L));}g.computeVertexNormals();}
  const n=g.attributes.normal,uv=g.attributes.uv,o=(p.id*137)%1500;for(let i=0;i<a.count;i++){const nz=Math.abs(n.getZ(i)),nx=Math.abs(n.getX(i));if(nz>0.7)uv.setXY(i,a.getX(i)*0.12+o,a.getY(i)+o);else uv.setXY(i,a.getZ(i)+o,(nx>0.5?a.getY(i):a.getX(i))+o*0.37);}
  return g;}
 const key=(!p.cutA&&!p.cutB)?`t${p.sx}|${p.sy}|${p.L.toFixed(1)}`:null;
 if(key&&gc.has(key))return gc.get(key);
 let sh;if(p.round){sh=new THREE.Shape();sh.absarc(0,0,p.sx/2,0,Math.PI*2,false);const hl=new THREE.Path();hl.absarc(0,0,p.sx/2-p.t,0,Math.PI*2,true);sh.holes.push(hl);}
 else{sh=rr(p.sx,p.sy,p.r,THREE.Shape);sh.holes.push(rr(p.sx-2*p.t,p.sy-2*p.t,Math.max(0.6,p.r-p.t),THREE.Path));}
 const g=new THREE.ExtrudeGeometry(sh,{depth:p.L,bevelEnabled:false,curveSegments:p.round?14:3});
 if(p.cutA||p.cutB){const a=g.attributes.position;for(let i=0;i<a.count;i++){const z=a.getZ(i);if(z<0.01&&p.cutA)a.setZ(i,BM.cutZ(p.cutA,a.getX(i),a.getY(i),0));else if(z>p.L-0.01&&p.cutB)a.setZ(i,BM.cutZ(p.cutB,a.getX(i),a.getY(i),p.L));}g.computeVertexNormals();}
 if(key)gc.set(key,g);return g;
}
function angleGeo(p){const k=`a${p.A}|${p.B}|${p.t}|${p.L}`;if(gc.has(k))return gc.get(k);const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(p.A,0);s.lineTo(p.A,p.t);s.lineTo(p.t,p.t);s.lineTo(p.t,p.B);s.lineTo(0,p.B);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:p.L,bevelEnabled:false});gc.set(k,g);return g;}
function stripGeo(pts,L){const pos=[],idx=[];pts.forEach(([u,h])=>{pos.push(u,h,0,u,h,L);});for(let i=0;i<pts.length-1;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function corrPts(W,pitch,H,bot,top){const rise=(pitch-bot-top)/2,pts=[];for(let u0=0;u0<W;u0+=pitch){for(const [du,h] of [[0,0],[bot,0],[bot+rise,H],[bot+rise+top,H]]){const u=u0+du;if(u<=W)pts.push([u,h]);}}pts.push([W,pts[pts.length-1][1]]);return pts;}
function tileGeo(W,L){const nu=Math.round(W/14),us=[];for(let i=0;i<=nu;i++)us.push(W*i/nu);const vs=[];for(let k=0;k*350<L;k++)for(const f of [0.003,0.1,0.35,0.6,0.85,0.997]){const v=k*350+f*350;if(v<L)vs.push(v);}vs.push(L);
 const pos=[],idx=[];for(const v of vs)for(const u of us)pos.push(u,17*(0.5-0.5*Math.cos(2*Math.PI*u/183))+13*(1-(v%350)/350),v);
 for(let j=0;j<vs.length-1;j++)for(let i=0;i<us.length-1;i++){const a=j*us.length+i,b=a+1,c=a+us.length,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
// высота кровельного профиля в точке (u — поперёк волны, v — вдоль ската)
function profH(pr,u,v){
 if(pr==='C20'||pr==='PCM'){const pitch=137.5,bot=72,top=40.5,H=20,rise=(pitch-bot-top)/2;let x=((u%pitch)+pitch)%pitch;if(x<bot)return 0;x-=bot;if(x<rise)return H*x/rise;x-=rise;if(x<top)return H;x-=top;return H*Math.max(0,1-x/rise);}
 if(pr==='TILE')return 17*(0.5-0.5*Math.cos(2*Math.PI*u/183))+13*(1-(((v%350)+350)%350)/350);
 if(pr==='OND')return 18*(1-Math.cos(2*Math.PI*u/95));
 if(pr==='FALC'){const x=((u%340)+340)%340;return x<6?25:x<11?25*(11-x)/5:0;}
 return 0;
}
// треугольная грань шатра с настоящим профилем: сетка, прижатая к границам грани
// гнутая планка/коньковая черепица по коньку или ребру: полки не под 90°, поэтому не «уголок со сдвигом»
// (у него толщина одной полки уходит вдоль другой и на шатре сплющивается в ноль) — каждая полка лежит в своём скате, толщина наружу
function bentGeo(p){const V=a=>new THREE.Vector3(...a),o=V(p.o),X=V(p.ax).normalize(),Y=V(p.ay).normalize(),Z=V(p.az).normalize(),out=X.clone().add(Y).negate();if(out.lengthSq()<1e-4)out.set(0,1,0);
 const legs=[[X,p.A],[Y,p.B]].map(([d,W])=>{const n=new THREE.Vector3().crossVectors(d,Z).normalize();if(n.dot(out)<0)n.negate();
  // на шатре у вершины полосы соседних рёбер сходятся: ширина полки ≤ (s0+z)·tgβ — встык по середине грани, без наложения и мерцания
  const wAt=z=>p.tk?Math.min(W,(p.s0+z)*p.tk):W,zf=p.tk?W/p.tk-p.s0:0,q=[[0,0],[wAt(0),0]];if(zf>0&&zf<p.L)q.push([W,zf]);q.push([wAt(p.L),p.L],[0,p.L]);
  const g=new THREE.ExtrudeGeometry(new THREE.Shape(q.map(([a,b])=>new THREE.Vector2(a,b))),{depth:p.t,bevelEnabled:false});
  const M=new THREE.Matrix4().makeBasis(d,Z,n);if(M.determinant()<0){g.translate(0,0,-p.t);M.makeBasis(d,Z,n.clone().negate());}
  return g.applyMatrix4(M.setPosition(o));});
 return mergeGeometries(legs,false);}
function facetGeo(p){
 const pts=p.pts,us=pts.map(q=>q[0]),vs=pts.map(q=>q[1]),u0=Math.min(...us),u1=Math.max(...us),v0=Math.min(...vs),v1=Math.max(...vs);
 const du={C20:9,PCM:9,TILE:12,OND:6,FALC:3.5}[p.profile]||20,nu=Math.ceil((u1-u0)/du),nv=Math.max(10,Math.ceil((v1-v0)/(p.profile==='TILE'?58:110)));
 const range=v=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<pts.length;i++){const A=pts[i],B=pts[(i+1)%pts.length];if(A[1]===B[1])continue;if((A[1]-v)*(B[1]-v)<=0){const u=A[0]+(B[0]-A[0])*(v-A[1])/(B[1]-A[1]);lo=Math.min(lo,u);hi=Math.max(hi,u);}}return lo<=hi?[lo,hi]:[0,0];};
 const pos=[],idx=[],W=nu+1;
 for(let j=0;j<=nv;j++){const v=v0+(v1-v0)*j/nv,[lo,hi]=range(Math.min(v1-1e-3,Math.max(v0+1e-3,v)));
  for(let i=0;i<=nu;i++){const u=Math.max(lo,Math.min(hi,u0+(u1-u0)*i/nu));pos.push(u,profH(p.profile,u,v),v);}}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*W+i,b=a+1,c=a+W,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function sheetGeo(p){
 if(p.profile==='C20')return stripGeo(corrPts(p.W,137.5,20,72,40.5),p.L);
 if(p.profile==='C8')return stripGeo(corrPts(p.W,115,8,58,45),p.L);
 if(p.profile==='PCM')return stripGeo(corrPts(p.W,137.5,20,72,40.5),p.L);
 if(p.profile==='OND'){const q=[];for(let u=0;u<p.W;u+=5)q.push([u,profH('OND',u,0)]);q.push([p.W,profH('OND',p.W,0)]);return stripGeo(q,p.L);}
 if(p.profile==='FALC'){const W=p.W;return stripGeo([[0,0],[0,25],[6,25],[11,0],[W-11,0],[W-6,25],[W,25],[W,0]],p.L);}
 if(p.profile==='EURO')return stripGeo([[0,0],[0,12],[7,18],[111,18],[118,12],[118,0]],p.L);
 if(p.profile==='TILE')return tileGeo(p.W,p.L);
 if(p.profile==='PC8'){const g=new THREE.BoxGeometry(p.W,8,p.L);g.translate(p.W/2,4,p.L/2);return g;}
}
const B6=Math.sqrt(3);
function boltGeo(d,L,grip){const k=`b${d}|${L}|${Math.round(grip)}`;if(gc.has(k))return gc.get(k);const B=BM.BOLT[d];
 const hex=(af,h,y0)=>{const g=new THREE.CylinderGeometry(af/B6,af/B6,h,6);g.rotateY(Math.PI/6);g.translate(0,y0+h/2,0);return g;};
 const cyl=(r,h,y0,s=16)=>{const g=new THREE.CylinderGeometry(r,r,h,s);g.translate(0,y0+h/2,0);return g;};
 const g=mergeGeometries([hex(B.af,B.hh,-B.wt-B.hh),cyl(B.wd/2,B.wt,-B.wt),cyl(d/2*0.92,L,-B.wt,10),cyl(B.wd/2,B.wt,grip),hex(B.af,B.nh,grip+B.wt)]);gc.set(k,g);return g;}
function studGeo(p){const parts=[],q=(p.d||12)/12;const h=p.b[1]-p.a[1];const r=new THREE.CylinderGeometry(6*q,6*q,h,12);r.translate(0,p.a[1]+h/2,0);parts.push(r);
 for(const y of p.nuts){const g=new THREE.CylinderGeometry(19*q/B6,19*q/B6,10*q,6);g.translate(0,y+5*q,0);parts.push(g);}
 for(const [y,t] of p.washers){const g=new THREE.CylinderGeometry(18.5,18.5,t,16);g.translate(0,y+t/2,0);parts.push(g);}
 const g=mergeGeometries(parts);g.translate(p.a[0],0,p.a[2]);return g;}
function basis(o,ax,ay,az){const m=new THREE.Matrix4();m.set(ax[0],ay[0],az[0],o[0],ax[1],ay[1],az[1],o[1],ax[2],ay[2],az[2],o[2],0,0,0,1);return m;}
function dirBasis(p,dir){const y=new THREE.Vector3(...dir).normalize();const ref=Math.abs(y.y)<0.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);const x=new THREE.Vector3().crossVectors(ref,y).normalize();const z=new THREE.Vector3().crossVectors(x,y);return basis(p,x.toArray(),y.toArray(),z.toArray());}

/* ---- подсветка поверх пакетов ---- */
for(const M of [HOVER,SELM])Object.assign(M,{polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6});
MAT.galv.side=THREE.DoubleSide;
const tintCache={};
const TINT={wood:[0.09,0.3,0.8,0.16],woodFill:[0.08,0.25,0.8,0.18],larch:[0.045,0.45,0.66,0.12],wpc:[0.07,0.13,0.42,0.07]};
const tintMat=(n,t)=>{const k=n+'#'+t;return tintCache[k]||(tintCache[k]=(()=>{const m=MAT[n].clone(),q=TINT[n]||TINT.wood;m.color.setHSL(q[0],q[1],q[2]+t*q[3]);m.userData.op=1;m.userData.tr=false;return m;})());};

/* ---- сцена: детали для выбора (невидимый слой 1) + склеенные пакеты для отрисовки (слой 0) ---- */
let meshes=[],batches=[],overlays=[],stepGroups={},stepIndex={},model=null,hovered=null,selMark=null,selId=null,selGrp=null,selMod=null,screwMeshes=[];
const flags={ghost:false,ground:false,xray:false,dims:true,mods:false,welds:true};let layers={},curStep=99,explode=0,under=false;
function clearScene(){for(const k in stepGroups){root.remove(stepGroups[k]);stepGroups[k].traverse(o=>{if(o.isSprite){o.material.map.dispose();o.material.dispose();}else if((o.isMesh||o.isLine)&&o.geometry&&!o.userData.cached&&!o.userData.overlay)o.geometry.dispose();});}
 meshes=[];batches=[];overlays=[];stepGroups={};screwMeshes=[];hovered=null;labels.length=0;
 while(dimsG.children.length){const c=dimsG.children[0];dimsG.remove(c);if(c.isSprite){c.material.map.dispose();c.material.dispose();}else if(c.geometry)c.geometry.dispose();}}
// UV в миллиметрах по граням коробки: текстура ложится в натуральном масштабе, а не растягивается в пятно
function mmUV(g,on){if(!on)return g;const P=g.attributes.position,U=g.attributes.uv,gr=g.groups;for(const q of gr){const ax=Math.floor(q.materialIndex/2);for(let i=q.start;i<q.start+q.count;i++){const v=g.index?g.index.getX(i):i;const x=P.getX(v),y=P.getY(v),z=P.getZ(v);U.setXY(v,ax===0?z:x,ax===1?z:y);}}U.needsUpdate=true;return g;}
function addMesh(p,geo,matrix,cached,mat,matKey){
 const m=new THREE.Mesh(geo,mat||MAT[p.mat]||MAT.steel);m.matrixAutoUpdate=false;m.matrix.copy(matrix);m.layers.set(1);m.receiveShadow=p.layer!=='roof';
 const mn=p.mat in MAT?p.mat:'steel';
 m.userData={part:p,matName:mn,cached,base:m.material,own:!!mat,matKey:matKey||mn};
 stepGroups[p.step].add(m);meshes.push(m);return m;}
function prepGeo(geo){
 let g=geo.index?geo.toNonIndexed():geo.clone();if(!g.attributes.normal)g.computeVertexNormals();
 const o=new THREE.BufferGeometry();o.setAttribute('position',g.attributes.position);o.setAttribute('normal',g.attributes.normal);
 o.setAttribute('uv',g.attributes.uv||new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return o;}
// зеркальный базис (det<0), запечённый в пакет, выворачивает треугольники: лицевая сторона становится изнанкой,
// нормаль смотрит внутрь и грань освещается «снизу» — почти чёрная. Отдельному мешу three.js это прощает, пакету — нет
function unmirror(g,M){if(M.determinant()>=0)return g;for(const k of ['position','normal','uv']){const A=g.attributes[k],s=A.itemSize,r=A.array;
 for(let i=0;i+2<A.count;i+=3)for(let j=0;j<s;j++){const a=(i+1)*s+j,b=(i+2)*s+j,t=r[a];r[a]=r[b];r[b]=t;}A.needsUpdate=true;}return g;}
function buildBatches(){
 const groups=new Map();
 for(const m of meshes){const p=m.userData.part,st=m.userData.only||p.step,key=`${st}|${p.layer}|${m.userData.matKey}|${m.userData.only||''}`;let g=groups.get(key);
  if(!g){g={step:st,layer:p.layer,matName:m.userData.matName,base:m.userData.base,own:m.userData.own,only:m.userData.only,list:[]};groups.set(key,g);}g.list.push(m);}
 for(const g of groups.values()){
  const geos=g.list.map(m=>unmirror(prepGeo(m.geometry).applyMatrix4(m.matrix),m.matrix));
  const merged=mergeGeometries(geos,false);geos.forEach(x=>x.dispose());if(!merged)continue;
  merged.computeBoundingSphere();
  const b=new THREE.Mesh(merged,g.base);b.matrixAutoUpdate=false;b.castShadow=!NOSH.has(g.matName);b.receiveShadow=g.layer!=='roof'; // тонкие кровельные слои тоньше пикселя тени — иначе «рябь» из квадратов
  b.userData={batch:true,step:g.step,layer:g.layer,matName:g.matName,base:g.base,own:g.own,only:g.only};
  stepGroups[g.step].add(b);batches.push(b);
 }
}
function setModel(m){
 model=m;clearScene();
 m.steps.forEach((s,i)=>{const g=new THREE.Group();g.userData.idx=i;stepGroups[s.id]=g;stepIndex[s.id]=i;root.add(g);});
 for(const p of m.parts){
  switch(p.kind){
   case'tube':addMesh(p,tubeGeo(p),basis(p.o,p.ax,p.ay,p.az),!(p.cutA||p.cutB));break;
   case'angle':if(p.trim&&Math.abs(p.ax[0]*p.ay[0]+p.ax[1]*p.ay[1]+p.ax[2]*p.ay[2])>0.05)addMesh(p,bentGeo(p),new THREE.Matrix4(),false);else addMesh(p,angleGeo(p),basis(p.o,p.ax,p.ay,p.az),true);break;
   case'box':{const geo=p.round?new THREE.CylinderGeometry(p.w/2,p.w/2,p.t,20).rotateX(Math.PI/2):mmUV(new THREE.BoxGeometry(p.w,p.h,p.t),['osb','shingle','underlay'].includes(p.mat));if(p.tint!=null&&p.mat==='woodFill'){const t=Math.round(p.tint*5)/5;addMesh(p,geo,basis(p.c,p.ax,p.ay,p.az),false,tintMat('woodFill',t),'woodFill#'+t);}else addMesh(p,geo,basis(p.c,p.ax,p.ay,p.az),false);break;}
   case'cyl':{const geo=new THREE.CylinderGeometry(p.r,p.r,p.h,p.r>50?32:10);geo.translate(0,p.h/2,0);addMesh(p,geo,new THREE.Matrix4().makeTranslation(p.c[0],p.c[1],p.c[2]),false);break;}
   case'stud':addMesh(p,studGeo(p),new THREE.Matrix4(),false);break;
   case'bolt':addMesh(p,boltGeo(p.d,p.L,p.grip),dirBasis(p.p,p.dir),true);break;
   case'weld':{const geo=new THREE.CylinderGeometry(3.3,3.3,p.len,8);geo.translate(0,p.len/2,0);addMesh(p,geo,dirBasis(p.a,[p.b[0]-p.a[0],p.b[1]-p.a[1],p.b[2]-p.a[2]]),false);break;}
   // профиль листа задан по средней линии, впадины ровно в плоскости опоры (обрешётка, брус борта) — две поверхности в одной плоскости мерцают «зубцами»;
   // лист ложится на опору нижней стороной — на полтолщины выше
   case'sheet':addMesh(p,sheetGeo(p).translate(0,0.5,0),basis(p.o,p.ax,p.ay,p.az),false);break;
   case'tri':{const s=new THREE.Shape(p.pts.map(([a,b])=>new THREE.Vector2(a,b)));const geo=new THREE.ExtrudeGeometry(s,{depth:p.t,bevelEnabled:false});geo.translate(0,0,p.h0);addMesh(p,geo,basis(p.o,p.ax,p.ay,p.az),false);break;}
   case'poly':{const s=new THREE.Shape(p.pts.map(([x,z])=>new THREE.Vector2(x,-z)));const geo=new THREE.ExtrudeGeometry(s,{depth:p.h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,p.y0,0);if(TINT[p.mat]){const t=Math.round((p.tint||0)*7)/7;addMesh(p,geo,new THREE.Matrix4(),false,tintMat(p.mat,t),p.mat+'#'+t);}else addMesh(p,geo,new THREE.Matrix4(),false);break;}
   case'facet':addMesh(p,facetGeo(p).translate(0,0.5,0),basis(p.o,p.ax,p.ay,p.az),false);break; // грань шатра — так же, на полтолщины над обрешёткой
   case'ball':addMesh(p,new THREE.SphereGeometry(p.r,18,12),new THREE.Matrix4().makeTranslation(p.c[0],p.c[1],p.c[2]),false);break;
   case'cone':{const geo=new THREE.ConeGeometry(p.r,p.h,p.seg||8);geo.rotateY(p.rot||0);geo.translate(0,p.h/2,0);addMesh(p,geo,new THREE.Matrix4().makeTranslation(p.c[0],p.c[1],p.c[2]),false);break;}
   case'cap':{const geo=new THREE.BoxGeometry(p.sx,p.sy,3);const o=[p.o[0]+p.az[0]*p.z,p.o[1]+p.az[1]*p.z,p.o[2]+p.az[2]*p.z];addMesh(p,geo,basis(o,p.ax,p.ay,p.az),false);break;}
  }
 }
 buildShopTruck(m);buildBatches();
 SPECIAL=new Set(['shop','truck'].map(id=>stepIndex[id]).filter(i=>i!=null));
 // крепёж: по набору на (тип, шаг); наводится и показывает, что это и во что крепит
 const types={pc:{r:9,h:5,seg:12,mat:'galv',step:'roof',layer:'roof'},roof:{r:7,h:6,seg:6,mat:'roof',step:'roof',layer:'roof'},trim:{r:6,h:5,seg:6,mat:'roof',step:'roofTrim',layer:'roof'},osb:{r:5.5,h:1.2,seg:10,mat:'galv',step:'roofDeck',layer:'roof'},
  tek:{r:5.5,h:5,seg:6,mat:'galv',step:'purlins',layer:'roofframe'},clip:{r:4,h:3.5,seg:6,mat:'galv',step:'bottom',layer:'floor'},deck:{r:4.5,h:1.5,seg:8,mat:'galv',step:'deck',layer:'floor'},fill:{r:6,h:5,seg:8,mat:'fill',step:'fill',layer:'rail'},wood:{r:4.5,h:1.5,seg:8,mat:'galv',step:'fill',layer:'rail'},lag:{r:5,h:4,seg:6,mat:'galv',step:'posts',layer:'frame'},jc:{r:4,h:3,seg:6,mat:'galv',step:'bottom',layer:'floor'},wp:{r:5,h:1.6,seg:10,mat:'galv',step:'purlins',layer:'roofframe'},dws:{r:4.2,h:2.2,seg:8,mat:'galv',step:'dress',layer:'dress'},dww:{r:4.2,h:1.4,seg:8,mat:'galv',step:'dress',layer:'dress'},dwp:{r:5.5,h:1.2,seg:10,mat:'galv',step:'dress',layer:'dress'},sc8:{r:6,h:2,seg:10,mat:'galv',step:'heads',layer:'roofframe'}};
 const groups=new Map();for(const s of m.screws){const T_=types[s.type];if(!T_)continue;const st=s.st||T_.step,k=s.type+'|'+st;if(!groups.has(k))groups.set(k,{t:s.type,st,list:[]});groups.get(k).list.push(s);}
 for(const gr of groups.values()){const T_=types[gr.t];if(!stepGroups[gr.st])continue;const g=new THREE.CylinderGeometry(T_.r,T_.r,T_.h,T_.seg);g.translate(0,T_.h/2,0);
  const im=new THREE.InstancedMesh(g,MAT[T_.mat],gr.list.length);gr.list.forEach((s,i)=>im.setMatrixAt(i,dirBasis(s.p,s.n)));im.computeBoundingSphere();im.layers.enable(1);
  const f=BM.FAST[gr.t],d=gr.t==='roof'?(f[m.cov]||f.c20):f,lay=gr.st==='bottom'?'floor':T_.layer;
  im.userData={layer:lay,step:gr.st,part:{kind:'screw',id:'screw:'+gr.t+':'+gr.st,type:gr.t,name:d[0],what:d[1],cat:d[2],step:gr.st,layer:'fast',markQty:m.screws.filter(s=>s.type===gr.t).length,qtyStep:gr.list.length}};
  stepGroups[gr.st].add(im);screwMeshes.push(im);}
 {const k=Math.max(1,Math.max(m.W,m.D)/3000);soil.scale.set(k,1,k);root.position.y=-(m.y0||0)*0.001;}
 buildDims(m);buildGlow(m);applyAll();
}
/* ---- подписи и размеры: внутри WebGL, поэтому всегда совпадают с моделью ---- */
const labels=[];
function makeLabel(text,pos,o={}){
 const fs=26,pad=13,c=document.createElement('canvas'),g=c.getContext('2d');
 const font=`600 ${fs}px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif`;g.font=font;
 const w=Math.ceil(g.measureText(text).width)+pad*2,h=Math.round(fs+pad*1.3);c.width=w;c.height=h;
 g.font=font;g.fillStyle=o.bg||'rgba(18,22,26,.84)';
 const r=h/2;g.beginPath();g.moveTo(r,0);g.arcTo(w,0,w,h,r);g.arcTo(w,h,0,h,r);g.arcTo(0,h,0,0,r);g.arcTo(0,0,w,0,r);g.closePath();g.fill();
 g.fillStyle=o.fg||'#fff';g.textBaseline='middle';g.fillText(text,pad,h/2+1);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,depthWrite:false,sizeAttenuation:false,transparent:true}));
 sp.position.set(...pos);sp.renderOrder=20;sp.userData.px=[w/2,h/2];sp.center.set(o.cx??0.5,o.cy??0.5);labels.push(sp);scaleLabel(sp);return sp;
}
function scaleLabel(sp){const H=Math.max(200,host.clientHeight),k=2*Math.tan(camera.fov*Math.PI/360)/H/0.001;sp.scale.set(sp.userData.px[0]*k,sp.userData.px[1]*k,1);}
const lineM=new THREE.LineBasicMaterial({color:0xe05a1c,transparent:true,opacity:0.95});
function dimLine(a,b,tick,parent){parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b].map(p=>new THREE.Vector3(...p))),lineM));
 if(tick)for(const p of [a,b])parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p[0]-tick[0],p[1]-tick[1],p[2]-tick[2]),new THREE.Vector3(p[0]+tick[0],p[1]+tick[1],p[2]+tick[2])]),lineM));}
function buildDims(m){
 const y=Math.max(m.F,30)+8,W2=m.W/2,D2=m.D/2,oz=D2+500,ox=W2+500;
 dimLine([-W2,y,oz],[W2,y,oz],[0,0,70],dimsG);dimLine([-W2,y,D2+20],[-W2,y,oz+70],null,dimsG);dimLine([W2,y,D2+20],[W2,y,oz+70],null,dimsG);dimsG.add(makeLabel(String(m.W),[0,y,oz]));
 dimLine([ox,y,-D2],[ox,y,D2],[70,0,0],dimsG);dimLine([W2+20,y,-D2],[ox+70,y,-D2],null,dimsG);dimLine([W2+20,y,D2],[ox+70,y,D2],null,dimsG);dimsG.add(makeLabel(String(m.D),[ox,y,0]));
 const hx=-ox,hz=D2,yl=m.dims.yLow;dimLine([hx,m.F,hz],[hx,yl,hz],[70,0,0],dimsG);dimLine([hx,yl,hz],[-W2-40,yl,hz],null,dimsG);dimLine([hx,m.F,hz],[-W2,m.F,hz],null,dimsG);
 dimsG.add(makeLabel(`в свету ${m.dims.headroom}`,[hx,(m.F+yl)/2,hz]));
 dimsG.add(makeLabel(`${m.gable?'конёк':'верх'} +${Math.round(m.dims.top)}`,[m.gable?0:W2*0.6,m.dims.top+170,D2+150]));
 if(m.hasDoor){const e=m.E/2;dimLine([-e,m.F+20,D2+80],[e,m.F+20,D2+80],[0,0,50],dimsG);dimsG.add(makeLabel(`вход ${m.E}`,[0,m.F+20,D2+80],{cy:-0.2}));}
 dimsG.add(makeLabel(`уклон ${m.ang}°`,m.gable?[W2*0.55,m.dims.apex-m.W*0.12,D2+150]:[-W2*0.4,m.dims.yLow+380,D2+250]));
}
/* ---- мастерская и «Газель»: те же сварные модули, разложенные плашмя ---- */
function buildShopTruck(m){
 if(!m.layout)return;
 const L=m.layout,mk4=e=>{const M=new THREE.Matrix4();M.set(e.R[0][0],e.R[0][1],e.R[0][2],e.t[0],e.R[1][0],e.R[1][1],e.R[1][2],e.t[1],e.R[2][0],e.R[2][1],e.R[2][2],e.t[2],0,0,0,1);return M;};
 const src=meshes.slice();
 const dup=(entries,step)=>{const g=stepGroups[step];if(!g)return;
  for(const e of entries){const M=mk4(e);
   for(const s of src){const p=s.userData.part;if(p.module!==e.k)continue;
    const steel=s.userData.matName==='steel',mat=steel?modMat(e.k):s.userData.base;
    const mm=new THREE.Mesh(s.geometry,mat);mm.matrixAutoUpdate=false;mm.matrix.multiplyMatrices(M,s.matrix);mm.layers.set(1);
    mm.userData={part:p,matName:s.userData.matName,cached:true,base:mat,own:true,matKey:steel?'mod:'+e.k:s.userData.matKey,only:step};
    g.add(mm);meshes.push(mm);}}};
 dup(L.shop,'shop');dup(L.truck,'truck');
 for(const e of L.shop)stepGroups.shop.add(makeLabel(e.name,e.label,{bg:'rgba(255,255,255,.94)',fg:'#15181c'}));
 const xs=L.shop.flatMap(e=>[e.label[0]-e.dims[0]/2,e.label[0]+e.dims[0]/2]),zs=L.shop.map(e=>e.label[2]);
 const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
 const pad=new THREE.Mesh(new THREE.BoxGeometry(x1-x0+1000,10,z1-z0+2600),new THREE.MeshStandardMaterial({color:0xbdb8ae,roughness:1}));
 pad.position.set((x0+x1)/2,-3,(z0+z1)/2+500);pad.receiveShadow=true;stepGroups.shop.add(pad);
 stepGroups.shop.add(makeLabel('Мастерская · всё сварено и покрашено до выезда',[(x0+x1)/2,900,z0-700],{bg:'rgba(224,90,28,.94)'}));
 const b=L.bed,tg=stepGroups.truck,tm=new THREE.MeshStandardMaterial({color:0xeef1f4,metalness:0.2,roughness:0.45}),dk=new THREE.MeshStandardMaterial({color:0x2a2e33,roughness:0.8}),gl=new THREE.MeshStandardMaterial({color:0x22303c,metalness:0.6,roughness:0.15});
 const bx=(w,h,d,x,y,z,mt)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;tg.add(o);return o;};
 const cx=b.x0+b.L/2;
 bx(b.L,40,b.W,cx,b.y-20,0,dk);for(const s of [-1,1])bx(b.L,400,30,cx,b.y+200,s*(b.W/2+15),tm);bx(30,400,b.W,b.x0+b.L+15,b.y+200,0,tm);bx(30,400,b.W,b.x0-15,b.y+200,0,tm);
 bx(1700,1550,b.W+70,b.x0-950,b.y+420,0,tm);bx(40,700,b.W-280,b.x0-1810,b.y+650,0,gl);bx(b.L+2000,160,900,cx-1000,b.y-200,0,dk);
 for(const xw of [b.x0-1100,b.x0+b.L-700])for(const s of [-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(380,380,230,28),dk);w.rotation.x=Math.PI/2;w.position.set(xw,380,s*(b.W/2-120));w.castShadow=true;tg.add(w);}
 const tent=new THREE.Mesh(new THREE.BoxGeometry(b.L,b.H,b.W),new THREE.MeshBasicMaterial({color:0x8fb3d9,transparent:true,opacity:0.07,depthWrite:false}));tent.position.set(cx,b.y+b.H/2,0);tg.add(tent);
 const ed=new THREE.LineSegments(new THREE.EdgesGeometry(tent.geometry),new THREE.LineBasicMaterial({color:0x5f8fc4}));ed.position.copy(tent.position);tg.add(ed);
 tg.add(makeLabel(`${b.t}: кузов ${b.L}×${b.W}, под тентом ${b.H} мм · штабель ${Math.round(L.stackH)} мм`,[cx,b.y+b.H+260,0],{bg:'rgba(224,90,28,.94)'}));
}
function meshShown(m){const u=m.userData,p=u.part;if(layers[p.layer]===false)return false;return u.only?stepIndex[u.only]===curStep:stepIndex[p.step]<=curStep&&!SPECIAL.has(curStep);}
function partShown(p){return layers[p.layer]!==false&&stepIndex[p.step]<=curStep&&!SPECIAL.has(curStep);}
let SPECIAL=new Set();
/* ---- вечер: свет гирлянды и ленты. Ореол — спрайты с аддитивным смешением, освещение — несколько точечных ламп по контуру ---- */
const NOSH=new Set(['pvc','net','bulb','led']);   // прозрачная плёнка и светящиеся детали тени не дают
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g&&g.createRadialGradient&&g.createRadialGradient(32,32,0,32,32,32);
 if(r){r.addColorStop(0,'rgba(255,224,170,1)');r.addColorStop(0.22,'rgba(255,184,96,.55)');r.addColorStop(0.6,'rgba(255,150,60,.12)');r.addColorStop(1,'rgba(255,140,50,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}   // без 2D-контекста — ореол просто пустой
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const glowMat=new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
let glowG=null,glowN=0;
// точечные лампы — всегда 4 штуки в сцене (днём и без гирлянды — с нулевой яркостью): иначе смена их числа пересобирает все шейдеры
const NL=4,nightL=[...Array(NL)].map(()=>new THREE.PointLight(0xffb866,0,0,2));let nightOn=false;/* в сцене только вечером при включённом свете: днём ни одна лампа не считается в шейдерах */const dayL={sun:sun.intensity,sunC:sun.color.getHex(),hemi:hemi.intensity,fog:scene.fog.color.getHex(),exp:renderer.toneMappingExposure};
function buildGlow(m){
 if(glowG){root.remove(glowG);glowG=null;}
 const pts=[];
 for(const p of m.parts){if(!p.glow)continue;
  if(p.kind==='ball')pts.push({c:p.c,s:230});
  else{const k=Math.max(1,Math.round(p.w/260));for(let i=0;i<k;i++){const t=(i+0.5)/k-0.5;pts.push({c:[p.c[0]+p.ax[0]*p.w*t,p.c[1]+p.ax[1]*p.w*t-8,p.c[2]+p.ax[2]*p.w*t],s:170});}}}
 glowN=pts.length;if(!pts.length)return;
 glowG=new THREE.Group();
 for(const q of pts){const s=new THREE.Sprite(glowMat);s.position.set(...q.c);s.scale.setScalar(q.s);s.layers.set(0);glowG.add(s);}
 for(let i=0;i<NL;i++){const q=pts[Math.floor((i+0.5)*pts.length/NL)].c;nightL[i].position.set(q[0],q[1]-60,q[2]);}
 root.add(glowG);}
function setNightL(on){if(on===nightOn)return;nightOn=on;for(const l of nightL){if(on)root.add(l);else root.remove(l);}}
function applyNight(){
 const on=!!flags.night,vp=host.parentElement;vp&&vp.classList.toggle('night',on);
 sun.intensity=on?0.1:dayL.sun;sun.color.setHex(on?0x9db2ff:dayL.sunC);hemi.intensity=on?0.06:dayL.hemi;scene.environment=on?null:envTex;
 scene.fog.color.setHex(on?0x0b111a:dayL.fog);renderer.toneMappingExposure=on?1.25:dayL.exp;
 MAT.bulb.emissiveIntensity=on?3.2:1.2;MAT.led.emissiveIntensity=on?3.4:1.4;
 if(glowG){const si=stepIndex.dress,show=on&&layers.dress!==false&&si!=null&&si<=curStep&&!flags.mods&&!SPECIAL.has(curStep);
  glowG.visible=show;if(stepGroups.dress)glowG.position.copy(stepGroups.dress.position);
  const I=Math.max(0.7,Math.min(3.4,(model?Math.max(model.W,model.D):3000)/3000*2.4));for(const l of nightL)l.intensity=I;setNightL(show);}
 else setNightL(false);
 renderer.shadowMap.needsUpdate=true;}
function rebuildOverlays(){
 for(const o of overlays)o.parent&&o.parent.remove(o);overlays=[];
 const add=(m,mat)=>{const o=new THREE.Mesh(m.geometry,mat);o.matrixAutoUpdate=false;o.matrix.copy(m.matrix);o.renderOrder=2;o.userData.overlay=true;m.parent.add(o);overlays.push(o);};
 if(selMark||selId||selMod)for(const m of meshes){const p=m.userData.part;if(meshShown(m)&&((selMark&&p.mark===selMark)||p.id===selId||(selGrp&&p.grp===selGrp)||(selMod&&p.module===selMod)))add(m,SELM);}
 if(hovered&&hovered.isInstancedMesh&&hovInst>=0&&hovered.visible){const o=new THREE.Mesh(hovered.geometry,HOVER);o.matrixAutoUpdate=false;hovered.getMatrixAt(hovInst,o.matrix);o.matrix.multiply(new THREE.Matrix4().makeScale(1.6,1.4,1.6));o.renderOrder=3;o.userData.overlay=true;hovered.parent.add(o);overlays.push(o);}
 else if(hovered&&!hovered.isInstancedMesh&&meshShown(hovered)){const g=hovered.userData.part&&hovered.userData.part.grp;if(g)for(const m of meshes){if(m.userData.part.grp===g&&meshShown(m))add(m,HOVER);}else add(hovered,HOVER);}
 dirty(false);
}
function applyGround(){const t=flags.ground||under||!!(model&&model.steps[curStep]&&['found','ring'].includes(model.steps[curStep].id));groundMat.opacity=t?0.22:1;groundMat.depthWrite=!t;soil.visible=t;}
function applyAll(){
 if(!model)return;
 if(anim)restoreAnim();
 for(const g of Object.values(stepGroups))g.position.y=explode*g.userData.idx*300;
 const last=model.steps.length-1;
 for(const b of batches){const u=b.userData,si=stepIndex[u.step];
  if(u.only){b.visible=layers[u.layer]!==false&&si===curStep;b.material=u.base;b.castShadow=!NOSH.has(u.matName);continue;}
  if(layers[u.layer]===false||flags.mods||SPECIAL.has(curStep)){b.visible=false;continue;}
  if(si>curStep){b.visible=flags.ghost;b.material=ghostMat(u.matName);b.castShadow=false;continue;}
  b.visible=true;b.castShadow=!NOSH.has(u.matName);b.material=(si===curStep&&curStep<last&&!u.own)?newMat(u.matName):u.base;}
 for(const id of ['shop','truck'])if(stepGroups[id])stepGroups[id].visible=stepIndex[id]===curStep;
 for(const m of meshes){const p=m.userData.part,n=m.userData.matName;
  if(m.userData.only){m.layers.disable(0);continue;}
  if(flags.mods&&partShown(p)){m.layers.enable(0);m.castShadow=true;m.material=model.MODS[p.module]?modMat(p.module):(['steel','galv','weld'].includes(n)?looseMat:m.userData.base);}
  else m.layers.disable(0);}
 for(const im of screwMeshes)im.visible=layers[im.userData.layer]!==false&&layers.fast!==false&&stepIndex[im.userData.step]<=curStep&&!SPECIAL.has(curStep);
 dimsG.visible=flags.dims;applyGround();
 MAT.weld.color.setHex(flags.welds?0xf08a24:MAT.steel.color.getHex());MAT.weld.emissiveIntensity=flags.welds?0.35:0;MAT.weld.needsUpdate=true;
 const xr=[...XRAYABLE.map(n=>MAT[n]),...Object.values(tintCache)];
 for(const M of xr){if(flags.xray){M.transparent=true;M.opacity=Math.min(M.userData.op,0.16);M.depthWrite=false;}else{M.transparent=M.userData.tr;M.opacity=M.userData.op;M.depthWrite=true;}M.needsUpdate=true;}
 applyNight();rebuildOverlays();if(cut.on)applyCut();dirty(true);
}

/* ---- навигация ---- */
/* ---- Навигация под трекпад MacBook / мышь / тач: вращение на кватернионах (без «замка» у полюсов), переворот через верх,
   поворот вокруг оси взгляда (жест «повернуть» двумя пальцами), свободный режим «трекбол», зум к курсору, сдвиг, инерция ---- */
class TrackpadNav{
 constructor(THREE,camera,el,o={}){
  this.T=THREE;this.cam=camera;this.el=el;
  this.target=new THREE.Vector3(...(o.target||[0,1.35,0]));this.gTarget=this.target.clone();
  this.dist=this.gDist=camera.position.distanceTo(this.target);
  this.q=new THREE.Quaternion();this._look(camera.position,this.target,this.q);this.gq=this.q.clone();
  this.minDist=o.minDist||0.6;this.maxDist=o.maxDist||40;
  this.free=false;                              // false — «турель» (вращение вокруг вертикали), true — трекбол по осям экрана
  this.lambdaUser=18;this.lambda=18;            // сглаживание (1/с), не зависит от частоты кадров
  this.vx=0;this.vy=0;                          // инерция после перетаскивания, рад/с
  this.auto=false;this.autoSpeed=2*Math.PI/28;
  this.rotK=0.0052;this.dragK=0.0068;this.pinchK=0.0105;this.rollK=0.006;
  this.onInput=null;this.onDblClick=null;this.pickPoint=null;
  this.pointers=new Map();this.gest=null;this.gestEnd=-1e9;this.tpUntil=0;this._v=[];
  this._ray=new THREE.Raycaster();this._nd=new THREE.Vector2();
  this._Y=new THREE.Vector3(0,1,0);this._t1=new THREE.Quaternion();this._v3=new THREE.Vector3();
  const L=(t,f,opt)=>el.addEventListener(t,f.bind(this),opt||{passive:false});
  L('wheel',this._wheel);L('gesturestart',this._gs);L('gesturechange',this._gc);L('gestureend',this._ge);
  L('pointerdown',this._pd);L('pointermove',this._pm);L('pointerup',this._pu);L('pointercancel',this._pu);
  L('contextmenu',e=>e.preventDefault());L('dblclick',e=>{this.onDblClick&&this.onDblClick(e);});
 }
 // кватернион камеры, смотрящей из pos в target (верх — мировая вертикаль; у полюса — сохраняем текущий «верх»)
 _look(pos,target,out){const T=this.T,m=new T.Matrix4(),z=new T.Vector3().subVectors(pos,target).normalize();let up=new T.Vector3(0,1,0);
  if(Math.abs(z.dot(up))>0.999)up=new T.Vector3(0,0,-1).applyQuaternion(this.q||new T.Quaternion());
  const x=new T.Vector3().crossVectors(up,z).normalize(),y=new T.Vector3().crossVectors(z,x);m.makeBasis(x,y,z);return out.setFromRotationMatrix(m);}
 _input(){this.lambda=this.lambdaUser;if(this.auto)this.auto=false;this.onInput&&this.onInput();}
 _clamp(){this.gDist=Math.max(this.minDist,Math.min(this.maxDist,this.gDist));}
 /* повороты цели gq: yaw — по горизонтали (вокруг вертикали или, в свободном режиме, вокруг оси экрана Y), up — камера вверх; без ограничений, можно перевернуть */
 rotate(yaw,up){const q=this.gq;
  if(yaw){if(this.free){this._t1.setFromAxisAngle(this._v3.set(0,1,0),yaw);q.multiply(this._t1);}else{this._t1.setFromAxisAngle(this._Y,yaw);q.premultiply(this._t1);}}
  if(up){this._t1.setFromAxisAngle(this._v3.set(1,0,0),-up);q.multiply(this._t1);}
  q.normalize();}
 // трекбол: всегда вокруг осей экрана (для гизмо)
 tumble(dx,dy){const q=this.gq;this._t1.setFromAxisAngle(this._v3.set(0,1,0),-dx);q.multiply(this._t1);this._t1.setFromAxisAngle(this._v3.set(1,0,0),-dy);q.multiply(this._t1);q.normalize();}
 roll(a){this._t1.setFromAxisAngle(this._v3.set(0,0,1),a);this.gq.multiply(this._t1).normalize();}
 /* выровнять горизонт: тот же взгляд, «верх» снова вертикален */
 level(){const T=this.T,z=new T.Vector3(0,0,1).applyQuaternion(this.gq);if(Math.abs(z.y)>0.995){z.set(0.0001,Math.sign(z.y),0.02).normalize();}
  const pos=this.gTarget.clone().addScaledVector(z,this.gDist),save=this.q;this.q=null;this._look(pos,this.gTarget,this.gq);this.q=save;this.lambda=7;this.vx=this.vy=0;}
 get rolled(){const T=this.T,x=new T.Vector3(1,0,0).applyQuaternion(this.q),y=new T.Vector3(0,1,0).applyQuaternion(this.q);return Math.abs(x.y)>0.03||y.y<0;}
 get yaw(){const z=new this.T.Vector3(0,0,1).applyQuaternion(this.q);return Math.atan2(z.x,z.z);}
 get pitch(){const z=new this.T.Vector3(0,0,1).applyQuaternion(this.q);return Math.asin(Math.max(-1,Math.min(1,z.y)));}
 _isTrackpad(e){
  const now=performance.now();
  if(e.deltaMode!==0)return false;
  let tp;
  if(e.deltaX!==0)tp=true;
  else if(typeof e.wheelDeltaY==='number'&&e.wheelDeltaY!==0)tp=Math.abs(e.wheelDeltaY+3*e.deltaY)<1.5||Math.abs(e.wheelDeltaY)%120!==0;
  else tp=Math.abs(e.deltaY)<60;
  if(tp)this.tpUntil=now+400;else if(now<this.tpUntil&&Math.abs(e.deltaY)<50)tp=true;
  return tp;
 }
 _wheel(e){
  e.preventDefault();this._input();
  const k=e.deltaMode===1?16:e.deltaMode===2?400:1;let dx=e.deltaX*k,dy=e.deltaY*k;
  if(e.ctrlKey){if(this.gest||performance.now()-this.gestEnd<120)return;this.zoomAt(Math.exp(dy*this.pinchK),e.clientX,e.clientY);return;} // щипок
  if(!this._isTrackpad(e)){this.zoomAt(Math.exp(dy*0.0016),e.clientX,e.clientY);return;}                                              // колесо мыши — зум
  if(e.shiftKey){if(dx===0){dx=dy;dy=0;}this.pan(-dx,-dy);return;}                                                                     // ⇧ — сдвиг
  if(e.altKey){if(Math.abs(dy)>=Math.abs(dx))this.lift(-dy);else this.roll(dx*this.rollK);return;}                                       // ⌥: вверх-вниз — выше/ниже, вбок — крен
  if(e.metaKey){this.zoomAt(Math.exp(dy*0.004),e.clientX,e.clientY);return;}                                                           // ⌘ — зум
  this.rotate(dx*this.rotK,-dy*this.rotK);                                                                                             // два пальца — вращение без ограничений
 }
 _gs(e){e.preventDefault();this._input();this.gest={s:1,r:0};}
 _gc(e){if(!this.gest)return;e.preventDefault();this._input();                                                                         // Safari: щипок + поворот пальцами
  const f=this.gest.s/e.scale;this.gest.s=e.scale;this.zoomAt(f,e.clientX,e.clientY);
  const r=e.rotation*Math.PI/180,dr=r-this.gest.r;this.gest.r=r;if(Math.abs(dr)<0.5)this.roll(dr);}
 _ge(e){e.preventDefault();this.gest=null;this.gestEnd=performance.now();}
 _pd(e){
  this.el.setPointerCapture&&this.el.setPointerCapture(e.pointerId);this._input();
  this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,t:performance.now()});
  this.vx=this.vy=0;this._v.length=0;
  this.mode=e.pointerType==='touch'?(this.pointers.size>=2?'touch2':'orbit'):(e.button===1||e.button===2||e.shiftKey||e.ctrlKey?'pan':e.altKey?'lift':'orbit');
  if(this.mode==='touch2')this._t2=this._two();
 }
 _two(){const p=[...this.pointers.values()];const dx=p[1].x-p[0].x,dy=p[1].y-p[0].y;return{d:Math.hypot(dx,dy),a:Math.atan2(dy,dx),x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};}
 _pm(e){
  const pt=this.pointers.get(e.pointerId);if(!pt)return;
  const dx=e.clientX-pt.x,dy=e.clientY-pt.y,now=performance.now(),dt=Math.max(1,now-pt.t);
  pt.x=e.clientX;pt.y=e.clientY;pt.t=now;
  if(this.mode==='touch2'&&this.pointers.size>=2){const c=this._two(),p=this._t2;this.zoomAt(p.d/c.d,c.x,c.y);let da=c.a-p.a;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;this.roll(da);this.pan(c.x-p.x,c.y-p.y);this._t2=c;return;}
  if(this.mode==='pan'){this.pan(dx,dy);return;}
  if(this.mode==='lift'){this.lift(dy);return;}
  this.rotate(-dx*this.dragK,dy*this.dragK);
  this._v.push({t:now,x:-dx*this.dragK/dt*1000,y:dy*this.dragK/dt*1000});while(this._v.length&&now-this._v[0].t>90)this._v.shift();
 }
 _pu(e){
  this.pointers.delete(e.pointerId);
  if(this.mode==='orbit'&&this._v.length&&performance.now()-this._v[this._v.length-1].t<60){
   const n=this._v.length;this.vx=this._v.reduce((s,v)=>s+v.x,0)/n;this.vy=this._v.reduce((s,v)=>s+v.y,0)/n;
   const sp=Math.hypot(this.vx,this.vy);if(sp>4){this.vx*=4/sp;this.vy*=4/sp;}}
  this._v.length=0;
  if(this.pointers.size===1&&this.mode==='touch2')this.mode='orbit';
  if(this.pointers.size===0)this.mode=null;
 }
 _axes(){const m=this.cam.matrixWorld,T=this.T;return[new T.Vector3().setFromMatrixColumn(m,0),new T.Vector3().setFromMatrixColumn(m,1),new T.Vector3().setFromMatrixColumn(m,2)];}
 // выше/ниже по мировой вертикали: цель и камера вместе, шаг — как у сдвига (палец ведёт сцену)
 lift(dy){const h=2*this.gDist*Math.tan(this.cam.fov*Math.PI/360)/Math.max(1,this.el.clientHeight);this.gTarget.y=Math.max(-3,Math.min(12,this.gTarget.y+dy*h));}
 pan(dx,dy){const [r,u]=this._axes(),h=2*this.gDist*Math.tan(this.cam.fov*Math.PI/360)/Math.max(1,this.el.clientHeight);this.gTarget.addScaledVector(r,-dx*h).addScaledVector(u,dy*h);}
 zoomAt(f,cx,cy){
  const nd=Math.max(this.minDist,Math.min(this.maxDist,this.gDist*f)),k=nd/this.gDist;if(Math.abs(k-1)<1e-6)return;
  let W=null;
  if(cx!=null&&this.el.getBoundingClientRect){
   const r=this.el.getBoundingClientRect();this._nd.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);
   W=this.pickPoint?this.pickPoint(this._nd):null;
   if(!W){this._ray.setFromCamera(this._nd,this.cam);const [, ,b]=this._axes();const pl=new this.T.Plane().setFromNormalAndCoplanarPoint(b,this.gTarget);W=this._ray.ray.intersectPlane(pl,new this.T.Vector3());}
  }
  if(W){const [, ,b]=this._axes();const d=W.clone().sub(this.gTarget);d.addScaledVector(b,-d.dot(b));this.gTarget.addScaledVector(d,1-k);}
  this.gDist=nd;
 }
 setView(pos,target,lambda){
  const T=this.T,t=new T.Vector3(...target),p=new T.Vector3(...pos);
  this._look(p,t,this.gq);if(this.gq.dot(this.q)<0)this.gq.set(-this.gq.x,-this.gq.y,-this.gq.z,-this.gq.w);
  this.gDist=p.distanceTo(t);this.gTarget.copy(t);this.vx=this.vy=0;this._clamp();this.lambda=lambda||6;
 }
 /* вид вдоль оси: n — направление «из центра к камере» */
 alignAxis(n,lambda){const T=this.T,d=new T.Vector3(...n).normalize();const pos=this.gTarget.clone().addScaledVector(d,this.gDist);this.setView(pos.toArray(),this.gTarget.toArray(),lambda||7);}
 focus(center,size){this.gTarget.copy(center);this.gDist=Math.max(this.minDist,Math.min(12,size*2.8+0.6));this.lambda=7;this.vx=this.vy=0;}
 update(dt){
  if(this.auto){this._t1.setFromAxisAngle(this._Y,this.autoSpeed*dt);this.gq.premultiply(this._t1);}
  if(this.vx||this.vy){this.rotate(this.vx*dt,this.vy*dt);const dcy=Math.exp(-dt*5);this.vx*=dcy;this.vy*=dcy;if(Math.hypot(this.vx,this.vy)<0.01)this.vx=this.vy=0;}
  const k=1-Math.exp(-dt*this.lambda);
  const ang=this.q.angleTo(this.gq),dd=this.gDist-this.dist,dtg=this.gTarget.distanceTo(this.target);
  const eps=2e-5;let moving=true;
  // у цели: прилипаем. «Двигалась» — только если что-то действительно поменялось: angleTo одинаковых, но не идеально нормированных кватернионов даёт ~4e-8, и камера считалась бы движущейся вечно (рендер 120 раз в секунду без остановки)
  if(ang<eps&&Math.abs(dd)<eps&&dtg<eps){moving=!this.q.equals(this.gq)||this.dist!==this.gDist||!this.target.equals(this.gTarget);this.q.copy(this.gq);this.dist=this.gDist;this.target.copy(this.gTarget);}
  else{this.q.slerp(this.gq,k);this.dist+=dd*k;this.target.lerp(this.gTarget,k);}
  const off=this._v3.set(0,0,this.dist).applyQuaternion(this.q);
  this.cam.position.copy(this.target).add(off);this.cam.quaternion.copy(this.q);this.cam.updateMatrixWorld();
  if(!moving&&this.lambda!==this.lambdaUser&&!this.auto)this.lambda=this.lambdaUser;
  return moving||this.auto;
 }
}

const nav=new TrackpadNav(THREE,camera,renderer.domElement,{target:[0,1.35,0],minDist:0.6,maxDist:40});
const ray=new THREE.Raycaster();ray.layers.set(1);
nav.free=!!App.navFree;
function hitAt(ndc){ray.setFromCamera(ndc,camera);const vis=meshes.filter(meshShown).concat(screwMeshes.filter(im=>im.visible&&(!anim||im.userData.step!==anim.stepId)));const h=ray.intersectObjects(vis,false)[0];return h||null;}
nav.pickPoint=ndc=>{const h=hitAt(ndc);return h?h.point.clone():null;};
const orbitBtn=document.getElementById('t-orbit');
nav.onInput=()=>{if(orbitBtn)orbitBtn.classList.toggle('on',nav.auto);tip.style.display='none';};
nav.onDblClick=e=>{const h=hitAt(ndcOf(e));if(h){const b=new THREE.Box3().setFromObject(h.object);const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()).length();nav.focus(c,s);App.pick(h.object.userData.part);}else view('iso');};
if(orbitBtn)orbitBtn.onclick=()=>{nav.auto=!nav.auto;nav.vx=nav.vy=0;orbitBtn.classList.toggle('on',nav.auto);};
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement&&document.activeElement.tagName))return;
 const s=0.12;let used=true;
 if(e.key==='ArrowLeft')nav.rotate(-s,0);else if(e.key==='ArrowRight')nav.rotate(s,0);else if(e.key==='ArrowUp')nav.rotate(0,s);else if(e.key==='ArrowDown')nav.rotate(0,-s);
 else if(e.key==='q'||e.key==='й')nav.roll(-s);else if(e.key==='e'||e.key==='у')nav.roll(s);else if(e.key==='h'||e.key==='р')nav.level();
 else if(e.key==='PageUp'||e.key==='r'||e.key==='к')nav.lift(70);else if(e.key==='PageDown'||e.key==='f'||e.key==='а')nav.lift(-70);
 else if(e.key==='+'||e.key==='=')nav.zoomAt(0.85);else if(e.key==='-')nav.zoomAt(1/0.85);else if(e.key==='0')view('iso');
 else if(e.key===' '){nav.auto=!nav.auto;orbitBtn&&orbitBtn.classList.toggle('on',nav.auto);}else used=false;
 if(used){e.preventDefault();nav._clamp();nav.onInput&&nav.onInput();}});

/* ---- наведение и клик ---- */
const tip=document.getElementById('tip'),ndc=new THREE.Vector2();
function ndcOf(e){const r=renderer.domElement.getBoundingClientRect();return ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1).clone();}
let pend=null,downAt=null,camMoving=false;
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!e.buttons)pend=e;});
renderer.domElement.addEventListener('pointerleave',()=>{pend=null;setHover(null);tip.style.display='none';});
renderer.domElement.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];tip.style.display='none';});
renderer.domElement.addEventListener('pointerup',e=>{if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5||e.button!==0)return;const h=hitAt(ndcOf(e));if(h)App.pick(h.object.userData.part);else{selMark=selId=selMod=null;rebuildOverlays();}});
let hovInst=-1;
function setHover(m,inst=-1){if(hovered===m&&hovInst===inst)return;hovered=m;hovInst=inst;rebuildOverlays();}
let hovT=0;
function hoverTick(){if(!pend||camMoving)return;const now_=performance.now();if(now_-hovT<50)return;hovT=now_;const e=pend;pend=null;const h=hitAt(ndcOf(e)),m=h?h.object:null;setHover(m,h&&m.isInstancedMesh?h.instanceId:-1);
 if(m){tip.innerHTML=App.tipHTML(m.userData.part);tip.style.display='block';const r=host.getBoundingClientRect();let x=e.clientX-r.left+16,y=e.clientY-r.top+16;const tw=tip.offsetWidth,th=tip.offsetHeight;if(x+tw>r.width-8)x=e.clientX-r.left-tw-16;if(y+th>r.height-8)y=Math.max(8,e.clientY-r.top-th-16);tip.style.left=x+'px';tip.style.top=y+'px';renderer.domElement.style.cursor='pointer';}
 else{tip.style.display='none';renderer.domElement.style.cursor='';}}

/* ---- виды ---- */
const VIEWS0={iso:[[6.4,3.6,7.6],[0,1.35,0]],front:[[0,1.8,10.5],[0,1.5,0]],side:[[10.5,1.8,0],[0,1.5,0]],top:[[0.001,12,0.8],[0,1,0]],under:[[5.2,-1.2,6.2],[0,0.2,0]]};
// виды и подлёты камеры заданы для 3×3 м — масштабируем под текущий габарит
const camK=()=>model?Math.max(0.85,Math.hypot(model.W,model.D,(model.dims.top||3300)*1.1)/Math.hypot(3000,3000,3630)):1;
const camHY=()=>model?(model.dims.top||3300)/3300:1;
const scaleView=v=>{const k=camK(),hy=camHY();return[[v[0][0]*k,v[0][1]*k,v[0][2]*k],[v[1][0]*k,v[1][1]*hy,v[1][2]*k]];};
function view(n){const [p,t]=scaleView(VIEWS0[n]);nav.auto=false;orbitBtn&&orbitBtn.classList.remove('on');nav.setView(p,t,6);}
/* камера сама подлетает к месту работ на каждом этапе; пол собирается под готовой крышей — смотрим на него снизу, из-под свеса */
const STEP_CAM={ring:[[3.9,1.5,4.9],[0,0.05,0]],hips:[[6.0,5.0,7.0],[0,2.6,0]],roofDeck:[[5.4,5.8,6.2],[0,2.4,0]],roofUnder:[[5.4,5.8,6.2],[0,2.4,0]],roofEdge:[[5.8,3.4,6.8],[0,2.2,0]],roofTrim:[[4.8,6.2,5.6],[0,2.6,0]],gutter:[[-4.4,2.4,-6.4],[0,1.5,-1.4]],found:[[5.2,0.5,6.6],[0,-0.45,0]],posts:[[6.4,3.4,7.8],[0,1.2,0]],bottom:[[5.4,1.25,6.6],[0,0.15,0]],heads:[[6.4,4.4,7.6],[0,2.0,0]],sides:[[7.8,3.6,4.6],[0,2.1,0]],brace:[[5.0,1.3,6.2],[0,0.5,0]],purlins:[[5.2,6.6,6.0],[0,2.7,0]],roof:[[6.6,4.4,7.8],[0,1.8,0]],deck:[[4.6,1.5,5.8],[0,0.25,0]],railframe:[[6.0,2.6,7.2],[0,0.8,0]],fill:[[2.4,1.9,7.6],[0,0.9,0]],finish:[[6.4,3.6,7.6],[0,1.35,0]]};
function stepCamera(){
 const s=model&&model.steps[curStep];if(!s)return;let v=STEP_CAM[s.id];
 if(s.id==='shop'&&model.layout){const xs=model.layout.shop.map(e=>e.label[0]/1000),zs=model.layout.shop.map(e=>e.label[2]/1000),cx=(Math.max(...xs)+Math.min(...xs))/2,cz=(Math.max(...zs)+Math.min(...zs))/2,sp=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))/7;v=[[cx+3.6*sp,7.6*sp,cz+8.6*sp],[cx,0,cz+0.5]];}
 else if(s.id==='truck'&&model.layout){const b=model.layout.bed,cx=(b.x0+b.L/2)/1000;v=[[cx+4.6,4.4,6.6],[cx-0.5,1.2,0]];}
 else if(v)v=scaleView(v);
 if(v){nav.auto=false;orbitBtn&&orbitBtn.classList.remove('on');nav.setView(v[0],v[1],4.5);}
}


/* ---- гизмо осей: показывает ориентацию, клик по оси — вид вдоль неё, перетаскивание — свободный поворот ---- */
const gz=document.createElement('div');gz.className='float gizmo';gz.innerHTML='<svg viewBox="-60 -60 120 120" aria-label="Оси"></svg><div class="gz-btns"><button type="button" id="gz-free" title="Свободное вращение по всем осям (трекбол)">Свободно</button><button type="button" id="gz-level" title="Выровнять горизонт (H)">Горизонт</button></div><div class="gz-lift" role="group" aria-label="Выше или ниже"><button type="button" id="gz-up" title="Камера выше — держать (R, PageUp, ⌥ + два пальца)" aria-label="Выше"><svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button><button type="button" id="gz-dn" title="Камера ниже — держать (F, PageDown, ⌥ + два пальца)" aria-label="Ниже"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button></div>';
(host.parentElement||document.body).appendChild(gz);
const gzSvg=gz.querySelector('svg'),NS='http://www.w3.org/2000/svg',GZ=[];
const AX=[['X',[1,0,0],'#e5484d','справа'],['Y',[0,1,0],'#30a46c','сверху'],['Z',[0,0,1],'#3e7bfa','спереди']];
{const ring=document.createElementNS(NS,'circle');ring.setAttribute('r','52');ring.setAttribute('class','gz-ring');gzSvg.appendChild(ring);}
for(const [n,v,c,t] of AX)for(const sg of [1,-1]){const g=document.createElementNS(NS,'g'),ln=document.createElementNS(NS,'line'),ci=document.createElementNS(NS,'circle'),tx=document.createElementNS(NS,'text'),ti=document.createElementNS(NS,'title');
 ln.setAttribute('stroke',c);ln.setAttribute('stroke-width',sg>0?'3':'1.6');ln.setAttribute('stroke-linecap','round');if(sg<0)ln.setAttribute('opacity','.45');
 ci.setAttribute('r',sg>0?'10':'6.5');ci.setAttribute('fill',sg>0?c:'var(--surface)');ci.setAttribute('stroke',c);ci.setAttribute('stroke-width','2');
 tx.textContent=sg>0?n:'';tx.setAttribute('text-anchor','middle');tx.setAttribute('dy','4');ti.textContent=`Вид ${sg>0?t:{справа:'слева',сверху:'снизу',спереди:'сзади'}[t]} (ось ${sg>0?'+':'−'}${n})`;
 g.append(ln,ci,tx,ti);g.style.cursor='pointer';g.dataset.ax=JSON.stringify(v.map(q=>q*sg));gzSvg.appendChild(g);GZ.push({g,ln,ci,tx,v:v.map(q=>q*sg)});}
const gzQ=new THREE.Quaternion(),gzV=new THREE.Vector3();
function updGizmo(){gzQ.copy(camera.quaternion).invert();
 for(const a of GZ){gzV.set(...a.v).applyQuaternion(gzQ);a.x=gzV.x*40;a.y=-gzV.y*40;a.z=gzV.z;a.ln.setAttribute('x1','0');a.ln.setAttribute('y1','0');a.ln.setAttribute('x2',a.x.toFixed(1));a.ln.setAttribute('y2',a.y.toFixed(1));a.ci.setAttribute('cx',a.x.toFixed(1));a.ci.setAttribute('cy',a.y.toFixed(1));a.tx.setAttribute('x',a.x.toFixed(1));a.tx.setAttribute('y',a.y.toFixed(1));}
 GZ.slice().sort((p,q)=>p.z-q.z).forEach(a=>gzSvg.appendChild(a.g));
 gz.querySelector('#gz-level').classList.toggle('on',nav.rolled);}
let gzDrag=null;
gzSvg.addEventListener('pointerdown',e=>{gzDrag={x:e.clientX,y:e.clientY,moved:false,ax:e.target.closest('g')&&e.target.closest('g').dataset.ax};gzSvg.setPointerCapture&&gzSvg.setPointerCapture(e.pointerId);nav._input();e.preventDefault();});
gzSvg.addEventListener('pointermove',e=>{if(!gzDrag)return;const dx=e.clientX-gzDrag.x,dy=e.clientY-gzDrag.y;if(Math.hypot(dx,dy)>2)gzDrag.moved=true;gzDrag.x=e.clientX;gzDrag.y=e.clientY;if(gzDrag.moved)nav.tumble(dx*0.012,dy*0.012);});
gzSvg.addEventListener('pointerup',()=>{if(gzDrag&&!gzDrag.moved&&gzDrag.ax){nav.auto=false;orbitBtn&&orbitBtn.classList.remove('on');nav.alignAxis(JSON.parse(gzDrag.ax),7);}gzDrag=null;});
gz.querySelector('#gz-free').onclick=e=>{nav.free=!nav.free;e.currentTarget.classList.toggle('on',nav.free);App.navFree=nav.free;};
gz.querySelector('#gz-level').onclick=()=>{nav.level();};
// выше/ниже: пока кнопка нажата, камера плавно едет по вертикали
for(const [id,sg] of [['#gz-up',1],['#gz-dn',-1]]){const b=gz.querySelector(id);let raf=0,t0=0;
 const tick=t=>{const dt=Math.min(50,t-(t0||t));t0=t;nav.lift(sg*dt*0.45);raf=requestAnimationFrame(tick);};
 const stop=()=>{cancelAnimationFrame(raf);raf=0;t0=0;b.classList.remove('on');};
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture&&b.setPointerCapture(e.pointerId);nav._input();nav.lift(sg*10);b.classList.add('on');if(!raf)raf=requestAnimationFrame(tick);});
 b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);}
// «Беседка.app» (macOS): приложение само читает касания трекпада и при трёх пальцах вверх/вниз зовёт эту функцию; dy — в пикселях, как у сдвига
window.__nativeLift=dy=>{nav._input();nav.lift(dy);};
if(window.__besedkaApp){for(const id of ['help-native','help-native-d']){const r=document.getElementById(id);if(r)r.hidden=false;}const p=document.getElementById('help-3f');if(p)p.textContent='Три пальца ↑↓ работают в этом приложении, если в Системных настройках → Трекпад → Ещё жесты Mission Control и смахивание между приложениями переведены на четыре пальца.';}
// полный экран: больше места под модель; жесты тремя пальцами macOS забирает себе и в нём — см. подсказку
{const fb=document.getElementById('t-full'),de=document.documentElement,fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
 if(fb){if(!(de.requestFullscreen||de.webkitRequestFullscreen))fb.hidden=true;
  fb.onclick=()=>{if(fsEl())(document.exitFullscreen||document.webkitExitFullscreen).call(document);else(de.requestFullscreen||de.webkitRequestFullscreen).call(de);};
  const upd=()=>fb.classList.toggle('on',!!fsEl());document.addEventListener('fullscreenchange',upd);document.addEventListener('webkitfullscreenchange',upd);}}
updGizmo();

/* ---- анимация этапа: модули и детали «прилетают» на место по очереди, болты появляются последними ---- */
let anim=null;const ease=t=>1-Math.pow(1-t,3),am=new THREE.Matrix4();
function restoreAnim(){if(!anim)return;for(const u of anim.units)for(const m of u.ms){m.matrix.copy(m.userData.m0);m.visible=true;m.layers.disable(0);}anim=null;}
function endAnim(){if(!anim)return;restoreAnim();applyAll();}
function startAnim(stepId){
 endAnim();if(flags.mods||SPECIAL.has(curStep))return;
 const ms=meshes.filter(m=>!m.userData.only&&m.userData.part.step===stepId&&layers[m.userData.part.layer]!==false);if(!ms.length)return;
 const byKey=new Map(),key=p=>p.kind==='bolt'?'~b'+p.id:p.layer==='dress'&&p.grp?'~g'+p.grp:model.MODS[p.module]?p.module:'~'+(p.parent||p.id);
 for(const m of ms){const k=key(m.userData.part);if(!byKey.has(k))byKey.set(k,[]);byKey.get(k).push(m);}
 const cen=arr=>{const b=new THREE.Box3();for(const m of arr){m.geometry.boundingBox||m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrix));}return b.getCenter(new THREE.Vector3());};
 // откуда деталь подаётся (p.mount: секции бортов — снаружи, водосток — сзади, подкос обвязки — в угол) и очередь в шаге (p.seq)
 let units=[...byKey.entries()].map(([k,arr])=>{const ps=arr.map(m=>m.userData.part),mt=ps.find(p=>p.mount);return{k,ms:arr,bolt:k.startsWith('~b'),c:cen(arr),seq:Math.min(...ps.map(p=>p.seq||0)),dir:mt?mt.mount:null,len:mt&&mt.mountLen};});
 const main=units.filter(u=>!u.bolt).sort((a,b)=>a.seq-b.seq||(a.c.y-b.c.y>60||a.c.y-b.c.y<-60?a.c.y-b.c.y:b.c.z-a.c.z||a.c.x-b.c.x)),bolts=units.filter(u=>u.bolt).sort((a,b)=>b.c.z-a.c.z);
 const st=Math.max(22,Math.min(170,1500/Math.max(1,main.length))),fly=560,lift=stepId==='found'?-700:Math.max(700,0.25*(model.dims.top||3000));
 main.forEach((u,i)=>{u.d=i*st;const L=u.dir?(u.len||Math.max(500,Math.abs(lift)*0.8)):lift;u.off=u.dir?[u.dir[0]*L,u.dir[1]*L,u.dir[2]*L]:[0,lift,0];});const tb=main.length?(main.length-1)*st+fly*0.75:0,bs=Math.min(40,600/Math.max(1,bolts.length));bolts.forEach((u,i)=>{u.d=tb+i*bs;});
 units=main.concat(bolts);
 for(const m of ms){m.userData.m0=m.userData.m0||m.matrix.clone();m.userData.m0.copy(m.matrix);const n=m.userData.matName;m.material=(curStep<model.steps.length-1&&!m.userData.own)?newMat(n):m.userData.base;m.layers.enable(0);m.visible=false;}
 for(const b of batches)if(b.userData.step===stepId&&!b.userData.only)b.visible=false;
 for(const im of screwMeshes)if(im.userData.step===stepId)im.visible=false;
 anim={t0:performance.now(),units,stepId,end:(units.length?Math.max(...units.map(u=>u.d)):0)+fly};
 V.animMs=anim.end;
}
function tickAnim(now){
 if(!anim)return false;const t=now-anim.t0;renderer.shadowMap.needsUpdate=true;
 for(const u of anim.units){const k=Math.max(0,Math.min(1,(t-u.d)/(u.bolt?260:560)));
  for(const m of u.ms){m.visible=k>0;if(k<=0)continue;
   if(u.bolt){const s=0.2+0.8*ease(k);am.makeScale(s,s,s);m.matrix.multiplyMatrices(m.userData.m0,am);}
   else{const f=1-ease(k);am.makeTranslation(u.off[0]*f,u.off[1]*f,u.off[2]*f);m.matrix.multiplyMatrices(am,m.userData.m0);}}}
 if(t>=anim.end+40){endAnim();}
 return true;
}

/* ---- разрез: плоскость отсекает всё, что ближе к зрителю, — видны ферма, обрешётка, упоры, профиль листа, саморезы ---- */
renderer.localClippingEnabled=true;
const cutPl=new THREE.Plane(new THREE.Vector3(0,0,-1),0),CLIP=[cutPl],cut={on:false,axis:'z',pos:0};
function clipMat(m){if(!m||m.isSpriteMaterial||m.isLineBasicMaterial)return;const want=cut.on?CLIP:null;if(m.clippingPlanes!==want){m.clippingPlanes=want;m.clipShadows=true;m.needsUpdate=true;}}
function applyCut(){
 cutPl.normal.set(cut.axis==='z'?0:-1,0,cut.axis==='z'?-1:0);cutPl.constant=cut.pos/1000;
 root.traverse(o=>{if(o.isSprite||o.isLine)return;if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(clipMat);});
 for(const M of [...Object.values(MAT),HOVER,SELM,looseMat,...Object.values(newCache),...Object.values(ghostCache),...Object.values(tintCache),...Object.values(modCache)])clipMat(M);
 dirty(true);}

/* ---- подписи не налезают друг на друга: при перекрытии прячем менее важную ---- */
const dcV=new THREE.Vector3();
const shownUp=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;};
function declutter(){const W=host.clientWidth,H=host.clientHeight,rects=[];
 for(const sp of labels){if(!sp.parent||!shownUp(sp.parent)){continue;}
  sp.getWorldPosition(dcV).project(camera);if(dcV.z>1||dcV.z<-1){sp.visible=false;continue;}
  const w=sp.userData.px[0],h=sp.userData.px[1],ax=(dcV.x+1)/2*W,ay=(1-dcV.y)/2*H,c0=sp.userData.c0||(sp.userData.c0=[sp.center.x,sp.center.y]);
  // подпись не уходит за край окна: сдвигаем её относительно точки, а не саму точку
  sp.center.x=Math.max((ax+6+w-W)/w,Math.min((ax-6)/w,c0[0]));sp.center.y=Math.min((H-6-ay)/h,Math.max(1-(ay-6)/h,c0[1]));
  const x=ax-w*sp.center.x,y=ay-h*(1-sp.center.y),r=[x-3,y-3,x+w+3,y+h+3];
  const hit=rects.some(q=>r[0]<q[2]&&r[2]>q[0]&&r[1]<q[3]&&r[3]>q[1]);sp.visible=!hit;if(!hit)rects.push(r);}}

/* ---- цикл: рисуем только при движении; держим частоту экрана (120 Гц на ProMotion) ---- */
const fpsEl=document.getElementById('fps'),fpsBtn=document.getElementById('t-fps');let showFps=false;
if(fpsBtn)fpsBtn.onclick=()=>{showFps=!showFps;fpsBtn.classList.toggle('on',showFps);fpsEl.hidden=!showFps;};
let lastSz='';
// буфер кадра пересоздаётся только при настоящей смене размера или плотности пикселей — перерисовка панели его не трогает
function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const key=w+'x'+h+'@'+(renderer.getPixelRatio?renderer.getPixelRatio():DPR);if(key===lastSz)return;lastSz=key;renderer.setSize(w,h,false);renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();labels.forEach(scaleLabel);dirty(false);}
new ResizeObserver(resize).observe(host);resize();
/* цикл: кадр рисуется, пока камера движется (+250 мс хвост), и при любом изменении сцены; разрешение постоянное */
let last=performance.now(),tailT=0,frames=0,fpsT=0;const raw=[];
let loopErr=false;
function loop(now){requestAnimationFrame(loop);try{step(now);}catch(e){if(!loopErr){loopErr=true;console.error(e);window.__showErr(e);}}}
// разрешение в движении: если кадры не успевают за экраном (6 подряд дольше 1,45 интервала), временно меньше пикселей; в покое — полная чёткость
const SC=[1,0.8,0.65,0.5];let scI=0,slowN=0;
function setScale(i){if(i===scI)return;scI=i;renderer.setPixelRatio(DPR*SC[i]);resize();}
function step(now){
 const rdt=now-last;last=now;raw.push(rdt);if(raw.length>120)raw.shift();
 const dt=Math.min(0.05,rdt/1000);
 const moved=nav.update(dt);camMoving=moved||nav.pointers.size>0;
 const u=camera.position.y<0.03;if(u!==under){under=u;applyGround();dirty(false);}
 if(moved)tailT=250;else if(tailT>0)tailT-=rdt;
 if(camMoving&&rdt<120){const iv=Math.min(...raw);if(rdt>iv*1.45){if(++slowN>=6&&scI<SC.length-1){setScale(scI+1);slowN=0;}}else slowN=Math.max(0,slowN-1);}else if(!camMoving&&tailT<=0&&scI){slowN=0;setScale(0);}
 const animating=tickAnim(now);
 if(moved||needsRender||tailT>0||animating){if(moved||needsRender||animating)updGizmo();if(matDirty||animating){scene.updateMatrixWorld();matDirty=false;}declutter();renderer.render(scene,camera);needsRender=false;frames++;}
 hoverTick();
 fpsT+=rdt;if(fpsT>=500){const fps=Math.round(frames*1000/fpsT);frames=0;fpsT=0;if(showFps&&fpsEl)fpsEl.textContent=`${fps} fps · экран ${Math.round(1000/Math.min(...raw))} Гц${scI?` · ${Math.round(SC[scI]*100)}% пикселей в движении`:''}`;}
}
requestAnimationFrame(loop);
// все материалы компилируются заранее, в простое после первого кадра (параллельно, без остановки кадра): включение окон, сетки или света не дёргает картинку
setTimeout(()=>{try{const g=new THREE.BoxGeometry(1,1,1),tmp=new THREE.Scene();for(const k in MAT){for(const rs of [true,false]){const mm=new THREE.Mesh(g,MAT[k]);mm.position.set(0,-50,0);mm.castShadow=true;mm.receiveShadow=rs;tmp.add(mm);}const im=new THREE.InstancedMesh(g,MAT[k],1);im.position.set(0,-50,0);tmp.add(im);}
 const go=()=>{try{if(renderer.compileAsync)renderer.compileAsync(tmp,camera,scene).catch(()=>{});else if(renderer.compile)renderer.compile(tmp,camera,scene);}catch(e){}};(window.requestIdleCallback||setTimeout)(go);}catch(e){}},1500);

const V={
 setModel,
 setStep(i,cam){const prev=curStep;endAnim();curStep=i;applyAll();if(cam)stepCamera();V.animMs=0;if(i===prev+1&&V.animate!==false&&model&&model.steps[i])startAnim(model.steps[i].id);},
 animMs:0,animate:true,
 lookAt(p,t,sp){nav.auto=false;orbitBtn&&orbitBtn.classList.remove('on');nav.setView(p,t,sp||6);}, // камера в точку (для крупных планов узлов)
 setCut(o){Object.assign(cut,o);applyCut();
  if(o.fly&&model){const k=camK(),hy=camHY(),ty=(model.dims.top||3000)*0.55/1000;
   if(cut.axis==='z')nav.setView([0.9*k,ty+0.6*k,cut.pos/1000+6.2*k],[0,ty,cut.pos/1000],5);else nav.setView([cut.pos/1000+6.2*k,ty+0.6*k,0.9*k],[cut.pos/1000,ty,0],5);
   nav.auto=false;orbitBtn&&orbitBtn.classList.remove('on');}},
 setFlags(f){Object.assign(flags,f);applyAll();},
 camY:()=>camera.position.y,
 hitTest:(x,y)=>{const h=hitAt(ndcOf({clientX:x,clientY:y}));return h?h.object.userData.part.name:null;},
 navState:()=>({moving:camMoving,pend:!!pend,auto:nav.auto,ptr:nav.pointers.size,ang:nav.q.angleTo(nav.gq),dd:nav.gDist-nav.dist,dtg:nav.gTarget.distanceTo(nav.target),v:[nav.vx,nav.vy],tail:tailT,anim:!!anim}),
 info:()=>({frame:renderer.info.render.frame,calls:renderer.info.render.calls,tris:renderer.info.render.triangles,geoms:renderer.info.memory.geometries,progs:renderer.info.programs.length,meshes:meshes.length,batches:batches.length,screws:screwMeshes.length}),
 setLayers(l){layers=Object.assign({},l);applyAll();},
 setExplode(x){explode=x;applyAll();},
 view,
 select(p){selMark=p.grp?null:p.mark||null;selId=p.id;selGrp=p.grp||null;selMod=null;rebuildOverlays();},
 selectModule(k){selMod=k;selMark=null;selId=null;selGrp=null;rebuildOverlays();},
 // цвета по материалам: каркас, металлическая/битумная кровля, гибкая черепица, поликарбонат, металлические и деревянные борта
 setColors(fc,rc,o={}){MAT.steel.color.setHex(fc);if(o.timber!=null){MAT.timber.color.setHex(o.timber);MAT.timberP.color.setHex(o.timber);MAT.timberL.color.setHex(o.timber).multiplyScalar(0.86);}if(!flags.welds)MAT.weld.color.setHex(fc);MAT.roof.color.setHex(rc);MAT.fill.color.setHex(o.fill!=null?o.fill:rc);
  if(o.sh!=null)MAT.shingle.color.setHex(o.sh).multiplyScalar(1.3);
  if(o.pc){MAT.pc.color.setHex(o.pc[0]);MAT.pc.opacity=MAT.pc.userData.op=o.pc[1];MAT.pc.needsUpdate=true;}
  if(o.wood){TINT.woodFill=o.wood;for(const k in tintCache)if(k.startsWith('woodFill#')){const t=+k.split('#')[1],q=o.wood;tintCache[k].color.setHSL(q[0],q[1],q[2]+t*q[3]);}}
  for(const k in newCache){newCache[k].color.copy(MAT[k].color);if(k==='pc')newCache[k].opacity=MAT.pc.opacity;}for(const k in ghostCache)ghostCache[k].color.copy(MAT[k].color);dirty(true);}
};
App.viewer=V;
layers=Object.assign({},App.layers);Object.assign(flags,App.flags);
App.applyColors?App.applyColors():V.setColors(App.colors.frame,App.colors.roof);
setModel(App.model);curStep=App.step;applyAll();
{const nv=document.getElementById('noview');if(nv)nv.hidden=true;}
window.__ready=true;

}catch(e){console.error(e);window.__showErr&&window.__showErr(e);}
