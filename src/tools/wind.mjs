import {JSDOM} from 'jsdom';import fs from 'fs';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const html=fs.readFileSync('/Users/egor/Documents/dacha/besedka/index.html','utf8');
const _raw=fs.readFileSync(new URL('./entry.js',import.meta.url),'utf8');const modSrc=_raw.slice(_raw.indexOf('try{\n')+5,_raw.lastIndexOf('\n}catch(e){'));
const dom=new JSDOM(html.replace(/<script id="viewer">[\s\S]*?<\/script>/,''),{runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
await new Promise(r=>setTimeout(r,200));
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 1200}});Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return 800}});
w.HTMLElement.prototype.getBoundingClientRect=function(){return{left:0,top:0,width:1200,height:800,right:1200,bottom:800}};
w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,k)=>k==='canvas'?this:k==='measureText'?(s=>({width:String(s).length*14})):(typeof k==='string'?()=>{}:undefined),set:()=>true});};
for(const k of ['document','window','navigator','HTMLElement','HTMLCanvasElement','Node','DOMParser']){try{globalThis[k]=w[k]??w;}catch(e){}}
globalThis.window=w;globalThis.document=w.document;globalThis.self=w;
globalThis.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),8);
w.matchMedia=()=>({matches:false});globalThis.matchMedia=w.matchMedia;globalThis.ResizeObserver=w.ResizeObserver=class{observe(){}};
const {CSS2DRenderer,CSS2DObject}=await import('three/examples/jsm/renderers/CSS2DRenderer.js');
let renders=0,shadowUpd=0;
class FakeRenderer{constructor(){this.domElement=w.document.createElement('canvas');this.shadowMap={enabled:true,autoUpdate:true,needsUpdate:false};this.pr=1;}
 setPixelRatio(p){this.pr=p}setSize(){}render(sc){sc&&sc.updateMatrixWorld();renders++;if(this.shadowMap.needsUpdate){shadowUpd++;this.shadowMap.needsUpdate=false;}}}
const code=modSrc.replace(/^import .*$/mg,'').replace('new THREE.WebGLRenderer(','new FakeRenderer(').replace('new THREE.PMREMGenerator(renderer)','({fromScene:()=>({texture:null})})');
const fn=new Function('THREE','RoomEnvironment','mergeGeometries','CSS2DRenderer','CSS2DObject','FakeRenderer','performance',code+';return {get meshes(){return meshes},get batches(){return batches},get overlays(){return overlays},get anim(){return anim},get screwMeshes(){return screwMeshes},hitAt,nav,camera,renderer,labels};');
let S;try{S=fn(THREE,RoomEnvironment,mergeGeometries,CSS2DRenderer,CSS2DObject,FakeRenderer,performance);}catch(e){console.log('INIT ERROR',e.stack);process.exit(1);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),vn=new THREE.Vector3();
function badTris(g){const P=g.attributes.position,N=g.attributes.normal;let bad=0,tot=0;for(let i=0;i+2<P.count;i+=3){a.fromBufferAttribute(P,i);b.fromBufferAttribute(P,i+1);c.fromBufferAttribute(P,i+2);n.subVectors(b,a).cross(c.clone().sub(a));if(n.lengthSq()<1e-9)continue;vn.fromBufferAttribute(N,i).add(c.fromBufferAttribute(N,i+1)).add(c.fromBufferAttribute(N,i+2));tot++;if(n.dot(vn)<0)bad++;}return [bad,tot];}
const types=process.argv.slice(2).length?process.argv.slice(2):['gable','mono','pergola','hex','oct'];
for(const t of types){w.document.querySelector(`#config [data-type="${t}"]`).click();await sleep(40);
 const covs=[...w.document.querySelectorAll('#config [data-k="cover"]')].map(e=>e.dataset.v);
 for(const cv of covs){w.document.querySelector(`#config [data-k="cover"][data-v="${cv}"]`).click();await sleep(40);
  const out=[];let neg=0;const negBy={};for(const m of S.meshes){if(m.matrix.determinant()<0){neg++;const k=m.userData.part.kind+':'+m.userData.matName;negBy[k]=(negBy[k]||0)+1;}}
  for(const B of S.batches){const [bd,tt]=badTris(B.geometry);if(bd/tt>0.2)out.push(`${B.userData.step}/${B.userData.matName} ${bd}/${tt}`);}
  console.log(t,cv,'зеркальных деталей',neg,JSON.stringify(negBy),'| пакеты с вывернутыми треугольниками:',out.join('; ')||'нет');}}
process.exit(0);
