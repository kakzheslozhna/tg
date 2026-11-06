/* ---- Навигация под трекпад MacBook / мышь / тач: вращение на кватернионах (без «замка» у полюсов), переворот через верх,
   поворот вокруг оси взгляда (жест «повернуть» двумя пальцами), свободный режим «трекбол», зум к курсору, сдвиг, инерция ---- */
export class TrackpadNav{
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
