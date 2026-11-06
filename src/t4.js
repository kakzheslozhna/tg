const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/model.js','utf8'));const BM=window.BM;
let fail=0,n=0;const seen={};
const sizes=[[3000,3000,2200],[2400,2400,2000],[4000,4500,2400],[3500,3000,2100],[2800,3800,2300],[3200,2600,2200]];
const t0=Date.now();
const PS=[[3000,0,2100],[3600,0,2200],[4600,0,2400],[4000,0,2000]];
const MATL=(process.env.MATS||'steel,hybrid,timber').split(','),FNL=(process.env.FNDS||'pillar').split(',').map(s=>s.split(':'));
for(const mat of MATL)for(const [fnd,hold,blocks] of FNL)for(const type of Object.keys(BM.TYPES))for(const cover of BM.TYPES[type].covers)for(const [W,D,H] of (BM.TYPES[type].poly?PS:sizes))for(const base of ['floor','legs'])for(const rail of ['0','750','combo','1200'])for(const truck of ['g3','g42'])for(const angK of [0,1]){
  const fill=rail==='combo'?'prof':rail==='1200'?'wood':'euro',T=BM.TYPES[type],ang=angK?T.angR[1]:T.angR[0],deck=['pine','larch','wpc'][(W+D+H)%3];
  const cfg={type,cover,W,D,H,base,rail,fill,truck,ang,deck,snow:['3','5','1','4'][(W+H)%4],mat,wood:['glulam','pine','larch'][(W+H+angK)%3],fnd,hold:hold||'anchor',blocks:+blocks||1};n++;
  let m,b,c;try{m=BM.build(cfg);b=BM.bom(m);c=BM.checks(m);}catch(e){fail++;console.log('ERR',JSON.stringify(cfg),e.stack.split('\n').slice(0,3).join(' | '));continue;}
  const over=Object.values(b.plans).flat().filter(x=>x.over).length;
  const bad=m.mods.list.filter(x=>!x.fits);
  const tag=JSON.stringify(cfg);
  if(c.bolt.length||c.coll.length||c.edge.length||over||bad.length||!isFinite(b.total)||!m.layout.fits){fail++;
    const sig=c.bolt.map(x=>x.p.role+x.why.slice(0,10)).concat(c.coll.map(x=>x.a.role+'×'+x.b.role),c.edge.map(x=>x.p.role+x.why.slice(0,12)),bad.map(x=>x.k.replace(/\d/g,'')),[over?'over':''],[m.layout.fits?'':'stack']).join(';');
    if(seen[sig])continue;seen[sig]=1;
    console.log('FAIL',tag,'bolt',c.bolt.length,'coll',c.coll.length,'edge',c.edge.length,'over',over,'stack',Math.round(m.layout.stackH),'truck',bad.map(x=>x.name+' '+x.dims.map(Math.round)));
    c.bolt.slice(0,3).forEach(x=>console.log('  B',x.p.name,x.why,Math.round(x.a.s),x.a.face,Math.round(x.a.off),'|',Math.round(x.b.s),x.b.face,Math.round(x.b.off)));
    c.coll.slice(0,5).forEach(x=>console.log('  C',x.a.name,'×',x.b.name,x.o.toFixed(1)));
    c.edge.slice(0,3).forEach(x=>console.log('  E',x.p.name,x.why));
  }
}
console.log('configs',n,'fails',fail,'ms/cfg',((Date.now()-t0)/n).toFixed(0));
for(const cfg of [{type:'gable',cover:'tile'},{type:'gable',cover:'tile',truck:'g3'},{type:'mono',cover:'c20',W:3500,D:3000},{type:'pergola',cover:'pc',base:'legs',rail:'0'}]){
 const m=BM.build(cfg),b=BM.bom(m);
 const bs=m.parts.filter(p=>p.kind==='bolt'),j={};bs.forEach(x=>j[x.joint]=(j[x.joint]||0)+1);
 console.log('\n==',JSON.stringify(cfg),'TOTAL',Math.round(b.total),'steel',b.steelKg.toFixed(0),'kg parts',m.parts.length,'bolts',bs.length,'welds',(m.weldLen/1000).toFixed(1)+'m','marks',m.marks.length,'split',m.split);
 console.log('   ',JSON.stringify(j));
 for(const c in b.byCat)console.log('  ',c,Math.round(b.byCat[c]));
 m.mods.list.forEach(x=>console.log('   mod',x.name,x.dims.map(Math.round).join('×'),x.kg.toFixed(1)+'kg',x.fits));
 console.log('   stack',Math.round(m.layout.stackH),'steps',m.steps.map(s=>s.t+':'+s.count+'/'+s.bolts).join(' | '));
 console.log('   calc\n     '+BM.calc(m,'3').rows.map(r=>r.name.slice(0,60)+' '+Math.round(r.util*100)+'%'+(r.futil!=null?'/'+Math.round(r.futil*100)+'%':'')).join('\n     '));
 console.log('   dims',JSON.stringify(m.dims));
}
