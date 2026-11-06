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
__NAV__
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
