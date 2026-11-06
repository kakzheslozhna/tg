/* ================== 3D (three.js) ================== */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

const App=window.App,BM=window.BM;
const host=document.getElementById('three');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const labelR=new CSS2DRenderer();labelR.domElement.className='labels';host.appendChild(labelR.domElement);
const scene=new THREE.Scene();
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
const DARK=matchMedia('(prefers-color-scheme: dark)').matches&&document.documentElement.dataset.theme!=='light';
scene.fog=new THREE.Fog(DARK?0x16202a:0xdfe6ea,18,42);
const camera=new THREE.PerspectiveCamera(35,1,0.05,200);
camera.position.set(6.4,3.6,7.6);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.35,0);controls.enableDamping=true;controls.dampingFactor=0.08;controls.minDistance=0.5;controls.maxDistance=30;controls.maxPolarAngle=Math.PI*0.97;
scene.add(new THREE.HemisphereLight(0xe6efff,0x5d5442,0.55));
const sun=new THREE.DirectionalLight(0xfff4e6,2.0);sun.position.set(5,8,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-5,right:5,top:5.5,bottom:-4,near:0.5,far:25});sun.shadow.bias=-0.0003;sun.shadow.normalBias=0.025;scene.add(sun);

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

/* ---- сцена из модели ---- */
let meshes=[],stepGroups={},stepIndex={},model=null,hovered=null,selMark=null,selId=null,selMod=null,screwMeshes=[];
const flags={ghost:false,ground:false,xray:false,dims:true,mods:false};let layers={},curStep=99,explode=0;
function clearScene(){for(const k in stepGroups){root.remove(stepGroups[k]);stepGroups[k].traverse(o=>{if(o.isMesh&&o.geometry&&!o.userData.cached)o.geometry.dispose();});}
 meshes=[];stepGroups={};screwMeshes=[];while(dimsG.children.length){const c=dimsG.children[0];dimsG.remove(c);if(c.element)c.element.remove();}}
function addMesh(p,geo,matrix,cached,mat){
 const m=new THREE.Mesh(geo,mat||MAT[p.mat]||MAT.steel);m.matrixAutoUpdate=false;m.matrix.copy(matrix);
 m.castShadow=true;m.receiveShadow=true;m.userData={part:p,matName:p.mat in MAT?p.mat:'steel',cached,base:m.material,own:!!mat};
 stepGroups[p.step].add(m);meshes.push(m);return m;}
function setModel(m){
 model=m;clearScene();
 m.steps.forEach((s,i)=>{const g=new THREE.Group();g.userData.idx=i;stepGroups[s.id]=g;stepIndex[s.id]=i;root.add(g);});
 for(const p of m.parts){
  switch(p.kind){
   case'tube':addMesh(p,tubeGeo(p),basis(p.o,p.ax,p.ay,p.az),!(p.cutA||p.cutB));break;
   case'angle':addMesh(p,angleGeo(p),basis(p.o,p.ax,p.ay,p.az),true);break;
   case'box':{const geo=new THREE.BoxGeometry(p.w,p.h,p.t);let mat=null;if(p.tint!=null&&p.mat==='woodFill'){mat=MAT.woodFill.clone();mat.color.setHSL(0.08,0.25,0.8+p.tint*0.18);}addMesh(p,geo,basis(p.c,p.ax,p.ay,p.az),false,mat);break;}
   case'cyl':{const geo=new THREE.CylinderGeometry(p.r,p.r,p.h,p.r>50?32:10);geo.translate(0,p.h/2,0);addMesh(p,geo,new THREE.Matrix4().makeTranslation(p.c[0],p.c[1],p.c[2]),false);break;}
   case'stud':addMesh(p,studGeo(p),new THREE.Matrix4(),false);break;
   case'bolt':addMesh(p,boltGeo(p.d,p.L,p.grip),dirBasis(p.p,p.dir),true);break;
   case'weld':{const geo=new THREE.CylinderGeometry(2.6,2.6,p.len,6);geo.translate(0,p.len/2,0);addMesh(p,geo,dirBasis(p.a,[p.b[0]-p.a[0],p.b[1]-p.a[1],p.b[2]-p.a[2]]),false);break;}
   case'sheet':addMesh(p,sheetGeo(p),basis(p.o,p.ax,p.ay,p.az),false);break;
   case'tri':{const s=new THREE.Shape(p.pts.map(([a,b])=>new THREE.Vector2(a,b)));const geo=new THREE.ExtrudeGeometry(s,{depth:p.t,bevelEnabled:false});geo.translate(0,0,p.h0);addMesh(p,geo,basis(p.o,p.ax,p.ay,p.az),false);break;}
   case'poly':{const s=new THREE.Shape(p.pts.map(([x,z])=>new THREE.Vector2(x,-z)));const geo=new THREE.ExtrudeGeometry(s,{depth:p.h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,p.y0,0);const mat=MAT.wood.clone();mat.color.setHSL(0.09,0.3,0.8+p.tint*0.16);addMesh(p,geo,new THREE.Matrix4(),false,mat);break;}
   case'cap':{const geo=new THREE.BoxGeometry(p.sx,p.sy,3);const o=[p.o[0]+p.az[0]*p.z,p.o[1]+p.az[1]*p.z,p.o[2]+p.az[2]*p.z];addMesh(p,geo,basis(o,p.ax,p.ay,p.az),false);break;}
  }
 }
 const types={roof:{r:7,h:6,mat:'roof',step:'roof',layer:'roof'},deck:{r:4.5,h:1.5,mat:'galv',step:'deck',layer:'floor'},fill:{r:6,h:5,mat:'fill',step:'fill',layer:'rail'},wood:{r:4.5,h:1.5,mat:'galv',step:'fill',layer:'rail'}};
 for(const t in types){const list=m.screws.filter(s=>s.type===t);if(!list.length||!stepGroups[types[t].step])continue;const g=new THREE.CylinderGeometry(types[t].r,types[t].r,types[t].h,10);g.translate(0,types[t].h/2,0);
  const im=new THREE.InstancedMesh(g,MAT[types[t].mat],list.length);list.forEach((s,i)=>im.setMatrixAt(i,dirBasis(s.p,s.n)));im.userData={layer:types[t].layer,step:types[t].step};stepGroups[types[t].step].add(im);screwMeshes.push(im);}
 buildDims(m);applyAll();
}
function buildDims(m){
 const lab=(txt,p)=>{const d=document.createElement('div');d.className='dim';d.textContent=txt;const o=new CSS2DObject(d);o.position.set(...p);dimsG.add(o);};
 const lineM=new THREE.LineBasicMaterial({color:0xd2601a});
 const line=(a,b)=>{dimsG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),lineM));};
 const y=Math.max(m.F,40)+5;
 line([-1500,y,1900],[1500,y,1900]);line([-1500,y,1840],[-1500,y,1960]);line([1500,y,1840],[1500,y,1960]);lab('3000',[0,y+60,1900]);
 line([1900,y,-1500],[1900,y,1500]);line([1840,y,-1500],[1960,y,-1500]);line([1840,y,1500],[1960,y,1500]);lab('3000',[1900,y+60,0]);
 lab(`в свету ${m.dims.headroom}`,[-700,m.F+m.dims.headroom/2,-1480]);
 if(m.hasDoor)lab('вход 900',[0,m.F+130,1650]);
 lab(`верх +${Math.round(m.dims.top)}`,[0,m.dims.top+180,0]);
 lab(`уклон ${m.ang}°`,[m.hip?0:1150,m.hip?m.dims.apex-300:m.T+330,m.hip?1250:0]);
}
function applyAll(){
 if(!model)return;
 for(const g of Object.values(stepGroups))g.position.y=explode*g.userData.idx*300;
 const last=model.steps.length-1;
 for(const m of meshes){const p=m.userData.part,si=stepIndex[p.step],n=m.userData.matName;
  if(layers[p.layer]===false){m.visible=false;continue;}
  if(si>curStep){m.visible=flags.ghost;m.material=ghostMat(n);m.castShadow=false;continue;}
  m.visible=true;m.castShadow=true;
  if(m===hovered)m.material=HOVER;
  else if((selMark&&p.mark===selMark)||p.id===selId||(selMod&&p.module===selMod))m.material=SELM;
  else if(flags.mods){m.material=model.MODS[p.module]?modMat(p.module):(['steel','galv','weld'].includes(n)?looseMat:m.userData.base);}
  else if(si===curStep&&curStep<last&&!m.userData.own)m.material=newMat(n);
  else m.material=m.userData.base;
 }
 for(const im of screwMeshes)im.visible=layers[im.userData.layer]!==false&&stepIndex[im.userData.step]<=curStep;
 dimsG.visible=flags.dims;
 groundMat.opacity=flags.ground?0.22:1;groundMat.depthWrite=!flags.ground;soil.visible=flags.ground;
 for(const nn of XRAYABLE){const M=MAT[nn];if(flags.xray){M.transparent=true;M.opacity=Math.min(M.userData.op,0.16);M.depthWrite=false;}else{M.transparent=M.userData.tr;M.opacity=M.userData.op;M.depthWrite=true;}M.needsUpdate=true;}
}

/* ---- взаимодействие ---- */
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),tip=document.getElementById('tip');
let pend=null,downAt=null;
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')pend=e;});
renderer.domElement.addEventListener('pointerleave',()=>{pend=null;setHover(null);tip.style.display='none';});
renderer.domElement.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5)return;const h=pickAt(e);if(h)App.pick(h.userData.part);else{selMark=selId=selMod=null;applyAll();}});
function pickAt(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
 const vis=meshes.filter(m=>m.visible&&stepIndex[m.userData.part.step]<=curStep);const hit=ray.intersectObjects(vis,false)[0];return hit?hit.object:null;}
function setHover(m){if(hovered===m)return;hovered=m;applyAll();}
function hoverTick(){if(!pend)return;const e=pend;pend=null;const m=pickAt(e);setHover(m);
 if(m){tip.innerHTML=App.tipHTML(m.userData.part);tip.style.display='block';const r=host.getBoundingClientRect();let x=e.clientX-r.left+16,y=e.clientY-r.top+16;const tw=tip.offsetWidth,th=tip.offsetHeight;if(x+tw>r.width-8)x=e.clientX-r.left-tw-16;if(y+th>r.height-8)y=Math.max(8,e.clientY-r.top-th-16);tip.style.left=x+'px';tip.style.top=y+'px';renderer.domElement.style.cursor='pointer';}
 else{tip.style.display='none';renderer.domElement.style.cursor='';}}

/* ---- камера ---- */
const VIEWS={iso:[[6.4,3.6,7.6],[0,1.35,0]],front:[[0,1.8,10.5],[0,1.5,0]],side:[[10.5,1.8,0],[0,1.5,0]],top:[[0.001,12,0.8],[0,1,0]],under:[[5.2,0.4,6.2],[0,-0.4,0]]};
let anim=null;
function view(n){const [p,t]=VIEWS[n];anim={t0:performance.now(),p0:camera.position.clone(),t0v:controls.target.clone(),p1:new THREE.Vector3(...p),t1:new THREE.Vector3(...t)};}
function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';labelR.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
function loop(now){requestAnimationFrame(loop);
 if(anim){const k=Math.min(1,(now-anim.t0)/700),e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;camera.position.lerpVectors(anim.p0,anim.p1,e);controls.target.lerpVectors(anim.t0v,anim.t1,e);if(k>=1)anim=null;}
 hoverTick();controls.update();renderer.render(scene,camera);labelR.render(scene,camera);}
requestAnimationFrame(loop);

const V={
 setModel,
 setStep(i){curStep=i;applyAll();},
 setFlags(f){Object.assign(flags,f);applyAll();},
 setLayers(l){layers=Object.assign({},l);applyAll();},
 setExplode(x){explode=x;applyAll();},
 view,
 select(p){selMark=p.mark||null;selId=p.id;selMod=null;applyAll();},
 selectModule(k){selMod=k;selMark=null;selId=null;applyAll();},
 setColors(fc,rc){MAT.steel.color.setHex(fc);MAT.roof.color.setHex(rc);MAT.fill.color.setHex(rc);for(const k in newCache)newCache[k].color.copy(MAT[k].color);for(const k in ghostCache)ghostCache[k].color.copy(MAT[k].color);}
};
App.viewer=V;
layers=Object.assign({},App.layers);Object.assign(flags,App.flags);
V.setColors(+document.getElementById('cfg-fcol').value,+document.getElementById('cfg-rcol').value);
setModel(App.model);curStep=App.step;applyAll();
{const nv=document.getElementById('noview');if(nv)nv.hidden=true;}
window.__ready=true;
