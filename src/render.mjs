// Офлайн-рендер модели беседки в PNG (z-буфер, плоское затенение) — для визуальной проверки без браузера
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'fs';import zlib from 'zlib';import path from 'path';
const dir=path.dirname(new URL(import.meta.url).pathname);
globalThis.window={};
eval(fs.readFileSync(dir+'/../model.js','utf8'));
const BM=globalThis.window.BM;globalThis.BM=BM;
const vsrc=fs.readFileSync(dir+'/../viewer.js','utf8');
const geoSrc=vsrc.slice(vsrc.indexOf('/* ---- геометрия ---- */'),vsrc.indexOf('/* ---- сцена из модели ---- */'));
const G=new Function('THREE','mergeGeometries','BM',geoSrc+';return{tubeGeo,angleGeo,sheetGeo,facetGeo,boltGeo,studGeo,basis,dirBasis};')(THREE,mergeGeometries,BM);

const COL={underlay:0xaeb6be,seal:0x111111,steel:0x3d4148,galv:0xbcc3ca,weld:0xf08a24,pc:0xb9d3e0,larch:0xb06a3c,wpc:0x6e6157,concrete:0x9b9a95,sand:0xcdb58a,rebar:0x6b4a35,grout:0x8c8a85,roof:0x45322e,fill:0x45322e,osb:0xc9a46a,shingle:0x3e2a22,wood:0xa77a49,woodFill:0xb68b5a,gravel:0x8a8781,plastic:0x151515};
export function render(cfg,cam,out,opts={}){
 const m=BM.build(cfg);
 const W=opts.w||1400,H=opts.h||900,last=opts.stepId?m.steps.findIndex(s=>s.id===opts.stepId):(opts.step??m.steps.length-1);
 const stepIdx={};m.steps.forEach((s,i)=>stepIdx[s.id]=i);
 const items=[];
 const LAY=opts.layout&&m.layout?m.layout[opts.layout]:null,LM={};
 if(LAY)for(const e of LAY){const M=new THREE.Matrix4();M.set(e.R[0][0],e.R[0][1],e.R[0][2],e.t[0],e.R[1][0],e.R[1][1],e.R[1][2],e.t[1],e.R[2][0],e.R[2][1],e.R[2][2],e.t[2],0,0,0,1);LM[e.k]=M;}
 const PAL=[0xe07a2e,0x2e7be0,0x2fa35a,0x9b4fd0,0x14a3a3,0xd4b11a,0xd0436a,0x6a8f2a,0x8a5cff,0x22a0d8,0xc9702a,0x3aa37c];const pc={};
 for(const p of m.parts){
  if(LAY){if(!LM[p.module])continue;}else if(stepIdx[p.step]>last)continue;if(opts.hideLayers&&opts.hideLayers.includes(p.layer))continue;
  let geo,mat;
  switch(p.kind){
   case'tube':geo=G.tubeGeo(p);mat=G.basis(p.o,p.ax,p.ay,p.az);break;
   case'angle':geo=G.angleGeo(p);mat=G.basis(p.o,p.ax,p.ay,p.az);break;
   case'box':geo=p.round?new THREE.CylinderGeometry(p.w/2,p.w/2,p.t,20).rotateX(Math.PI/2):new THREE.BoxGeometry(p.w,p.h,p.t);mat=G.basis(p.c,p.ax,p.ay,p.az);break;
   case'facet':geo=G.facetGeo(p);mat=G.basis(p.o,p.ax,p.ay,p.az);break;
   case'cone':geo=new THREE.ConeGeometry(p.r,p.h,p.seg||8);geo.rotateY(p.rot||0);geo.translate(0,p.h/2,0);mat=new THREE.Matrix4().makeTranslation(...p.c);break;
   case'cyl':geo=new THREE.CylinderGeometry(p.r,p.r,p.h,24);geo.translate(0,p.h/2,0);mat=new THREE.Matrix4().makeTranslation(...p.c);break;
   case'stud':geo=G.studGeo(p);mat=new THREE.Matrix4();break;
   case'bolt':geo=G.boltGeo(p.d,p.L,p.grip);mat=G.dirBasis(p.p,p.dir);break;
   case'weld':geo=new THREE.CylinderGeometry(3.3,3.3,p.len,8);geo.translate(0,p.len/2,0);mat=G.dirBasis(p.a,[p.b[0]-p.a[0],p.b[1]-p.a[1],p.b[2]-p.a[2]]);break;
   case'sheet':geo=G.sheetGeo(p);mat=G.basis(p.o,p.ax,p.ay,p.az);break;
   case'tri':{const s=new THREE.Shape(p.pts.map(([a,b])=>new THREE.Vector2(a,b)));geo=new THREE.ExtrudeGeometry(s,{depth:p.t,bevelEnabled:false});geo.translate(0,0,p.h0);mat=G.basis(p.o,p.ax,p.ay,p.az);break;}
   case'poly':{const s=new THREE.Shape(p.pts.map(([x,z])=>new THREE.Vector2(x,-z)));geo=new THREE.ExtrudeGeometry(s,{depth:p.h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,p.y0,0);mat=new THREE.Matrix4();break;}
   case'cap':{geo=new THREE.BoxGeometry(p.sx,p.sy,3);mat=G.basis([p.o[0]+p.az[0]*p.z,p.o[1]+p.az[1]*p.z,p.o[2]+p.az[2]*p.z],p.ax,p.ay,p.az);break;}
   default:continue;
  }
  if(LAY){mat=new THREE.Matrix4().multiplyMatrices(LM[p.module],mat);}
  let c=new THREE.Color(COL[p.mat]??0x888888);
  if(LAY&&p.mat==='steel'){if(pc[p.module]==null)pc[p.module]=PAL[Object.keys(pc).length%PAL.length];c=new THREE.Color(pc[p.module]);}
  if(opts.colors&&opts.colors[p.mat]!=null)c=new THREE.Color(opts.colors[p.mat]);
  if(p.kind==='poly')c.offsetHSL(0,0,(p.tint-0.5)*0.08);
  items.push({geo,mat,c,ds:['roof','fill','osb','shingle'].includes(p.mat)||p.kind==='sheet'});
 }
 if(LAY&&opts.layout==='truck'){const bd=m.layout.bed;const bb=new THREE.BoxGeometry(bd.L,40,bd.W);bb.translate(bd.x0+bd.L/2,bd.y-20,0);items.push({geo:bb,mat:new THREE.Matrix4(),c:new THREE.Color(0x2a2e33)});const cab=new THREE.BoxGeometry(1700,1550,2050);cab.translate(bd.x0-950,bd.y+420,0);items.push({geo:cab,mat:new THREE.Matrix4(),c:new THREE.Color(0xeef1f4)});}
 // крепёж
 if(!LAY&&opts.screws!==false){const DS={pc:'roof',roof:'roof',trim:'roofTrim',osb:'roofDeck',tek:'purlins',clip:'bottom',deck:'deck',fill:'fill',wood:'fill'},RS={pc:[9,5],roof:[7,6],trim:[6,5],osb:[5.5,1.2],tek:[5.5,5],clip:[4,3.5],deck:[4.5,1.5],fill:[6,5],wood:[4.5,1.5]};
  for(const sc of m.screws){const st=sc.st||DS[sc.type];if(stepIdx[st]==null||stepIdx[st]>last)continue;const [r,h]=RS[sc.type]||[5,3];const g=new THREE.CylinderGeometry(r,r,h,6);g.translate(0,h/2,0);items.push({geo:g,mat:G.dirBasis(sc.p,sc.n),c:new THREE.Color(0xd8dde2)});}}
 // земля
 const gsz=9000;items.push({geo:new THREE.PlaneGeometry(gsz*2,gsz*2,90,90).rotateX(-Math.PI/2),mat:new THREE.Matrix4(),c:new THREE.Color(0x6e8c4a),ground:true});
 const camera=new THREE.PerspectiveCamera(cam.fov||35,W/H,50,80000);
 camera.position.set(...cam.pos.map(v=>v*1000));camera.lookAt(new THREE.Vector3(...cam.target.map(v=>v*1000)));camera.updateMatrixWorld();camera.updateProjectionMatrix();
 const PV=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
 const zb=new Float32Array(W*H).fill(Infinity),img=new Uint8Array(W*H*3);
 // небо
 for(let y=0;y<H;y++){const t=y/H;const r=Math.round(203+(241-203)*t),g=Math.round(220+(237-220)*t),b=Math.round(236+(230-236)*t);for(let x=0;x<W;x++){const i=(y*W+x)*3;img[i]=r;img[i+1]=g;img[i+2]=b;}}
 const L=new THREE.Vector3(0.5,0.85,0.4).normalize(),camPos=camera.position.clone();
 const toLin=v=>Math.pow(v,2.2),toS=v=>Math.round(255*Math.pow(Math.min(1,Math.max(0,v)),1/2.2));
 const v0=new THREE.Vector3(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3(),n=new THREE.Vector3(),vd=new THREE.Vector3();
 const S=new THREE.Matrix4().makeScale(1,1,1);
 for(const it of items){
  const g=it.geo.index?it.geo.toNonIndexed():it.geo,pos=g.attributes.position,M=it.mat;
  const cl=[toLin(it.c.r),toLin(it.c.g),toLin(it.c.b)];
  for(let i=0;i<pos.count;i+=3){
   v0.fromBufferAttribute(pos,i).applyMatrix4(M);v1.fromBufferAttribute(pos,i+1).applyMatrix4(M);v2.fromBufferAttribute(pos,i+2).applyMatrix4(M);
   e1.subVectors(v1,v0);e2.subVectors(v2,v0);n.crossVectors(e1,e2);const nl=n.length();if(nl<1e-9)continue;n.divideScalar(nl);
   vd.subVectors(camPos,v0);let facing=n.dot(vd);
   if(facing<0){n.negate();}
   let dif=Math.max(0,n.dot(L)),amb=0.38+0.12*n.y;
   let sh=it.ground?0.95:amb+0.75*dif;
   const col=[cl[0]*sh,cl[1]*sh,cl[2]*sh];
   const P=[v0,v1,v2].map(v=>{const q=v.clone().applyMatrix4(PV);return[(q.x*0.5+0.5)*W,(1-(q.y*0.5+0.5))*H,q.z,v.clone().applyMatrix4(camera.matrixWorldInverse).z];});
   if(P.some(q=>q[3]>-50))continue;
   const minX=Math.max(0,Math.floor(Math.min(P[0][0],P[1][0],P[2][0]))),maxX=Math.min(W-1,Math.ceil(Math.max(P[0][0],P[1][0],P[2][0])));
   const minY=Math.max(0,Math.floor(Math.min(P[0][1],P[1][1],P[2][1]))),maxY=Math.min(H-1,Math.ceil(Math.max(P[0][1],P[1][1],P[2][1])));
   if(minX>maxX||minY>maxY)continue;
   const [a,b,c]=P,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;
   const sc=toS(col[0]),sg=toS(col[1]),sb=toS(col[2]);
   const CUT=opts.cut&&!it.ground?opts.cut:null,ci=CUT?(CUT.axis==='x'?0:2):0,cw=CUT?[v0.getComponent(ci),v1.getComponent(ci),v2.getComponent(ci)]:null;
   if(CUT&&Math.min(...cw)>CUT.pos)continue;
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const px=x+0.5,py=y+0.5;const w0=((b[1]-c[1])*(px-c[0])+(c[0]-b[0])*(py-c[1]))/den,w1=((c[1]-a[1])*(px-c[0])+(a[0]-c[0])*(py-c[1]))/den,w2=1-w0-w1;
    if(w0<-1e-6||w1<-1e-6||w2<-1e-6)continue;
    if(CUT&&w0*cw[0]+w1*cw[1]+w2*cw[2]>CUT.pos)continue;
    const z=w0*a[2]+w1*b[2]+w2*c[2]-(it.ground?0.00002:0),k=y*W+x;
    if(z<zb[k]){zb[k]=z;const i=k*3;img[i]=sc;img[i+1]=sg;img[i+2]=sb;}
   }
  }
 }
 // PNG
 const raw=Buffer.alloc((W*3+1)*H);for(let y=0;y<H;y++){raw[y*(W*3+1)]=0;Buffer.from(img.buffer,y*W*3,W*3).copy(raw,y*(W*3+1)+1);}
 const crc=(buf)=>{let c,crcT=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcT[n]=c>>>0;}let x=0xffffffff;for(const b of buf)x=crcT[(x^b)&0xff]^(x>>>8);return(x^0xffffffff)>>>0;};
 const chunk=(t,d)=>{const len=Buffer.alloc(4);len.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([len,td,c]);};
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
 fs.writeFileSync(out,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
 return m;
}
const args=JSON.parse(process.argv[2]||'{}');
render(args.cfg||{},args.cam||{pos:[6.4,3.6,7.6],target:[0,1.35,0]},args.out||dir+'/out.png',args.opts||{});
console.log('ok',args.out);
