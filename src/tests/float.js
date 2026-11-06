// «висящие в воздухе» детали: граф касаний (зазор ≤ tol по габаритам), всё должно связаться с землёй
const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/model.js','utf8'));const BM=window.BM;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
function pts(p){const o=[];
 if(p.kind==='tube'){for(const z of [p.zA0||0,p.zB1||p.L])for(const i of [-1,1])for(const j of [-1,1])o.push(add(p.o,add(add(mul(p.ax,i*p.sx/2),mul(p.ay,j*p.sy/2)),mul(p.az,z))));}
 else if(p.kind==='box'){for(const i of [-1,1])for(const j of [-1,1])for(const k of [-1,1])o.push(add(p.c,add(add(mul(p.ax,i*p.w/2),mul(p.ay,j*p.h/2)),mul(p.az,k*p.t/2))));}
 else if(p.kind==='angle'){for(const a of [0,p.A])for(const b of [0,p.B])for(const z of [0,p.L])o.push(add(p.o,add(add(mul(p.ax,a),mul(p.ay,b)),mul(p.az,z))));}
 else if(p.kind==='ball'){for(const s of [-1,1])for(const k of [0,1,2]){const q=p.c.slice();q[k]+=s*p.r;o.push(q);}}
 else if(p.kind==='cyl'){for(const s of [-1,1])for(const t of [-1,1]){o.push([p.c[0]+s*p.r,p.c[1],p.c[2]+t*p.r]);o.push([p.c[0]+s*p.r,p.c[1]+p.h,p.c[2]+t*p.r]);}}
 else if(p.kind==='tri'){for(const [a,b] of p.pts)for(const z of [p.h0||0,(p.h0||0)+(p.t||1)])o.push(add(p.o,add(add(mul(p.ax,a),mul(p.ay,b)),mul(p.az,z))));}
 else if(p.kind==='sheet'&&p.o){for(const a of [0,p.W||0])for(const b of [0,p.L||0])o.push(add(p.o,add(mul(p.ax,a),mul(p.az||[0,0,1],b))));}
 else if(p.kind==='poly'&&p.pts){for(const [x,z] of p.pts)for(const y of [p.y0,p.y0+p.h])o.push([x,y,z]);}
 return o;}
const only=process.argv[2];let tot=0,badCfg=0;const kinds={};
for(const type of ['gable','mono','pergola','hex','oct'])for(const mat of ['steel','hybrid','timber'])for(const [win,light] of [['both','belt'],['pvc','led'],['net','0']])for(const base of ['floor','legs']){
 const c=BM.sanitize({type,mat,base,win,light,rail:'combo',H:2000});const m=BM.build(c);tot++;
 const P=m.parts.filter(p=>p.kind!=='weld'&&p.kind!=='bolt'&&p.role!=='decor'&&p.layer!=='decor');
 const bb=P.map(p=>{const q=pts(p);if(!q.length)return null;return{lo:[0,1,2].map(k=>Math.min(...q.map(v=>v[k]))),hi:[0,1,2].map(k=>Math.max(...q.map(v=>v[k])))};});
 const tol=3,n=P.length,adj=[...Array(n)].map(()=>[]);
 const idx=[...Array(n).keys()].filter(i=>bb[i]).sort((a,b)=>bb[a].lo[0]-bb[b].lo[0]);
 for(let x=0;x<idx.length;x++){const i=idx[x];for(let y=x+1;y<idx.length;y++){const j=idx[y];if(bb[j].lo[0]>bb[i].hi[0]+tol)break;let ok=true;for(let k=1;k<3;k++)if(bb[j].lo[k]>bb[i].hi[k]+tol||bb[i].lo[k]>bb[j].hi[k]+tol){ok=false;break;}if(ok){adj[i].push(j);adj[j].push(i);}}}
 const y0=m.y0||0,seen=new Uint8Array(n),st=[];for(const i of idx)if(bb[i].lo[1]<=y0+15||['pillar','sand','slab','pad','gravel','grout','anchor','pile'].includes(P[i].role)){seen[i]=1;st.push(i);}
 while(st.length){const i=st.pop();for(const j of adj[i])if(!seen[j]){seen[j]=1;st.push(j);}}
 const fl=idx.filter(i=>!seen[i]);if(fl.length){badCfg++;for(const i of fl){const k=`${P[i].layer}/${P[i].role} ${String(P[i].name).replace(/\d+/g,'#').slice(0,52)}`;kinds[k]=(kinds[k]||0)+1;}if(only)console.log(JSON.stringify(c).slice(0,80),fl.length);}
}
console.log('configs',tot,'with floating parts',badCfg);for(const [k,v] of Object.entries(kinds).sort((a,b)=>b[1]-a[1]).slice(0,30))console.log(String(v).padStart(5),k);
