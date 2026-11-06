const fs=require('fs');const src=fs.readFileSync(__dirname+'/../m4_opt.js','utf8');
const {cut1D}=new Function(src+';return{cut1D};')();
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
// точный минимум хлыстов перебором (ветви и границы) для n ≤ 14
function exact(lens,L,kerf){lens=lens.slice().sort((a,b)=>b-a);let best=lens.length;const bins=[];
 (function go(i){if(bins.length>=best)return;if(i===lens.length){best=bins.length;return;}
  const tried=new Set();for(let j=0;j<bins.length;j++){const nu=bins[j]+kerf+lens[i];if(nu<=L&&!tried.has(bins[j])){tried.add(bins[j]);bins[j]=nu;go(i+1);bins[j]-=kerf+lens[i];}}
  bins.push(lens[i]);go(i+1);bins.pop();})(0);return best;}
let worse=0,tot=0,extra=0;
for(let t=0;t<300;t++){const n=4+Math.floor(rnd()*10),lens=[...Array(n)].map(()=>Math.round(200+rnd()*2700));
 const h=cut1D(lens.map(len=>({len})),[{L:3000,pr:1}],3).n,e=exact(lens,3000,3);tot++;if(h>e){worse++;extra+=h-e;}}
console.log('эвристика хуже точного в',worse,'из',tot,'случаев, лишних хлыстов всего',extra);
