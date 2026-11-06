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
const A=w.App;const V=A.viewer;
console.log('parts meshes',S.meshes.length,'→ draw batches',S.batches.length,'(было бы',S.meshes.length,'draw calls)');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(300);let r0=renders;await sleep(400);console.log('рендеров в покое за 0,4 с:',renders-r0);
const cv=S.renderer.domElement;
const wheel=(o)=>{const e=new w.WheelEvent('wheel',Object.assign({bubbles:true,cancelable:true,clientX:600,clientY:400},o));cv.dispatchEvent(e);return e.defaultPrevented;};
let pd=false;for(let i=0;i<30;i++)pd=wheel({deltaX:8,deltaY:0})||pd;
r0=renders;await sleep(500);console.log('после свайпа двумя пальцами: рендеров',renders-r0,'yaw°',(S.nav.yaw*180/Math.PI).toFixed(1),'preventDefault',pd);
for(let i=0;i<20;i++)wheel({deltaY:-6,ctrlKey:true});await sleep(500);console.log('щипок: dist',S.nav.dist.toFixed(2));
for(let i=0;i<40;i++)wheel({deltaY:10});await sleep(600);console.log('свайп вверх → вид снизу: камера y',S.camera.position.y.toFixed(2),'pitch°',(S.nav.pitch*180/Math.PI).toFixed(1));
r0=renders;await sleep(600);console.log('покой после жеста: рендеров',renders-r0);
w.document.getElementById('t-orbit').click();r0=renders;await sleep(500);console.log('обзор 360°: рендеров за 0,5 с',renders-r0,'(при 8 мс таймере ≈60)');w.document.getElementById('t-orbit').click();
V.setFlags({mods:true});console.log('режим модулей: деталей на слое 0',S.meshes.filter(m=>m.layers.test(new THREE.Layers())).length);V.setFlags({mods:false,xray:true});V.setFlags({xray:false,ghost:true});
A.setStep(3);console.log('шаг 4: видимых пакетов',S.batches.filter(b=>b.visible).length,'из',S.batches.length);A.setStep(99);
const p=A.model.parts.find(q=>q.role==='bolt');V.select(p);console.log('выбор марки',p.mark,'→ подсветок',S.overlays.length);
const ids=A.model.steps.map(s=>s.id);for(const id of ['shop','truck','found','finish']){A.setStep(ids.indexOf(id));await sleep(50);console.log('шаг',id,'видимых пакетов',S.batches.filter(b=>b.visible).length,'камера',S.camera.position.toArray().map(v=>v.toFixed(1)).join(','));}
// анимация шага: вперёд на 1 — детали прилетают, потом возвращаются в пакеты
A.setStep(ids.indexOf('posts')-1);await sleep(50);A.setStep(ids.indexOf('posts'));await sleep(120);
console.log('анимация: идёт',!!S.anim,'деталей в полёте',S.anim?S.anim.units.length:0,'длительность мс',Math.round(V.animMs));
await sleep(V.animMs+300);console.log('анимация закончилась',!S.anim,'деталей на слое 0',S.meshes.filter(m=>m.layers.test(new THREE.Layers())).length);
// переворот: свайп вверх долго → камера проходит через верх; поворот вокруг оси взгляда (⌥)
for(let i=0;i<120;i++)wheel({deltaY:-12});await sleep(800);console.log('после переворота: верх камеры y',new THREE.Vector3(0,1,0).applyQuaternion(S.camera.quaternion).y.toFixed(2),'rolled',S.nav.rolled);
for(let i=0;i<20;i++)wheel({deltaX:15,altKey:true});await sleep(500);console.log('⌥ + свайп: крен, rolled',S.nav.rolled);
S.nav.level();await sleep(900);console.log('горизонт: rolled',S.nav.rolled,'верх камеры y',new THREE.Vector3(0,1,0).applyQuaternion(S.camera.quaternion).y.toFixed(2));
const gzc=w.document.querySelectorAll('.gizmo g');console.log('гизмо осей: элементов',gzc.length);
S.nav.alignAxis([0,1,0]);await sleep(900);console.log('ось Y → вид сверху: камера',S.camera.position.toArray().map(v=>v.toFixed(1)).join(','));
console.log('подписей',S.labels.length,'видимых',S.labels.filter(l=>l.visible).length);
A.setStep(ids.indexOf('shop'));await sleep(1500);console.log('мастерская: камера',S.camera.position.toArray().map(v=>v.toFixed(1)).join(','));
V.view('front');await sleep(1200);console.log('вид спереди: камера',S.camera.position.toArray().map(v=>v.toFixed(2)).join(','));
for(const [t,cv] of [['hex','shingle'],['oct','tile'],['hex','falc'],['mono','pcm'],['pergola','pc']]){w.document.querySelector(`#config [data-type="${t}"]`).click();const b=w.document.querySelector(`#config [data-k="cover"][data-v="${cv}"]`);b&&b.click();await sleep(80);
 const ids2=A.model.steps.map(s=>s.id);A.setStep(ids2.indexOf('roof')-1);A.setStep(ids2.indexOf('roof'));await sleep(V.animMs+200);console.log('тип',t,cv,'деталей',S.meshes.length,'пакетов',S.batches.length,'анимация кровли мс',Math.round(V.animMs),'граней',A.model.parts.filter(p=>p.kind==='facet'||p.kind==='tri').length);}
w.document.getElementById('t-cut').click();await sleep(300);const clipped=S.batches.filter(b=>b.material.clippingPlanes&&b.material.clippingPlanes.length).length;
const cr=w.document.getElementById('cutpos');cr.value=String(+cr.min+200);cr.dispatchEvent(new w.Event('input'));w.document.querySelector('[data-cax="x"]').click();await sleep(300);
console.log('разрез: пакетов с плоскостью отсечения',clipped,'из',S.batches.length,'панель видна',!w.document.getElementById('cutbar').hidden);
w.document.getElementById('t-cut').click();await sleep(100);console.log('разрез выключен: пакетов с отсечением',S.batches.filter(b=>b.material.clippingPlanes&&b.material.clippingPlanes.length).length);
{w.document.querySelector('#config [data-type="pergola"]').click();await sleep(50);A.setStep(A.model.steps.length-1);V.view('top');await sleep(1500);
 const im=S.screwMeshes.find(m=>m.visible&&m.userData.part.type==='pc');const M=new THREE.Matrix4();im.getMatrixAt(0,M);const p=new THREE.Vector3().setFromMatrixPosition(M);im.updateMatrixWorld(true);p.applyMatrix4(im.matrixWorld);
 const nd=p.clone().project(S.camera);const h=S.hitAt(new THREE.Vector2(nd.x,nd.y));{const rc=new THREE.Raycaster();rc.layers.set(1);rc.setFromCamera(new THREE.Vector2(nd.x,nd.y),S.camera);const all=rc.intersectObjects([im],false);console.log('dbg: im visible',im.visible,'layers',im.layers.mask,'hits on im',all.length,'p',p.toArray().map(v=>v.toFixed(3)).join(','),'cam',S.camera.position.toArray().map(v=>v.toFixed(2)).join(','));}
 const part=h&&h.object.userData.part;console.log('саморез под курсором:',h?h.object.isInstancedMesh+' '+(part&&part.name):'нет','| подсказка со ссылкой:',part?/lemanapro/.test(A.tipHTML(part))||/Лемана/.test(A.tipHTML(part)):false);
 if(part){A.pick(part);console.log('карточка (поверх панели):',w.document.getElementById('sheet').classList.contains('open'),w.document.getElementById('sheet-b').textContent.slice(0,140).replace(/\s+/g,' '));}
 const ids3=A.model.steps.map(s=>s.id);console.log('шаги перголы:',ids3.join(','));}
console.log('обновлений теней',shadowUpd,'всего рендеров',renders,'ошибок',errs.length,errs.slice(0,3));
process.exit(0);
