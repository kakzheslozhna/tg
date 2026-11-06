const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
let n=0,miss=0,low=0;const ex={};
for(const type of ['gable','mono','pergola','hex','oct'])for(const mat of ['steel','hybrid','timber'])for(const W of [2400,3000,3400,4000,4600])for(const D of [2600,3000,4000,4600])for(const H of [2000,2200,2400])for(const base of ['floor','legs'])for(const rail of ['0','750','1200','combo']){
 if((type==='hex'||type==='oct')&&D!==2600)continue;
 const c=BM.sanitize({type,mat,W,D,H,base,rail,win:'pvc',fill:'wood'});let m;try{m=BM.build(c);}catch(e){console.log('ERR',JSON.stringify(c),e.message);continue;}
 n++;for(const p of m.parts.filter(p=>p.role==='winPane')){const ys=p.kind==='tri'?p.pts.map(q=>q[1]):[p.c[1]+p.h/2];if(Math.max(...ys)<m.F+0.8*m.H){low++;if(low<5)console.log('LOW',JSON.stringify({type,mat,W:c.W,H,base,rail}),p.name.slice(0,50),Math.round(Math.max(...ys)));}}const nP=m.dress.wins.length,nb=(m.poly||0)||null;
 // сколько граней по контуру (по стойкам)
 const want=m.dress._bays;if(want!=null&&nP<want){miss++;const k=`${type} ${mat} ${base}`;ex[k]=(ex[k]||0)+1;if(miss<8)console.log('miss',JSON.stringify({type,mat,W:c.W,D:c.D,base,rail}),'wins',nP,'bays',want,JSON.stringify(m.dress._skip));}
}
console.log('n',n,'configs with uncovered bays',miss,'low windows',low);for(const [k,v] of Object.entries(ex))console.log(v,k);
