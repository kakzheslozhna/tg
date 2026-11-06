/* ================== 3D (three.js): 120 fps, жесты трекпада, обзор 360° ================== */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

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

