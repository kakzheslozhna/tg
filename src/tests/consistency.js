// согласованность модели, сметы и раскроя по широкой выборке конфигураций
const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
let n=0,err=0;const errs={};const E=(k,msg)=>{err++;if(!errs[k]){errs[k]=1;console.log('✗',k,'|',msg);}};
const MATL=(process.env.MATS||'steel,hybrid,timber').split(','),FNL=(process.env.FNDS||'pillar').split(',').map(s=>s.split(':'));
for(const mat of MATL)for(const [fnd,hold,blocks] of FNL)for(const type of Object.keys(BM.TYPES)){const T=BM.TYPES[type];
 for(const cover of T.covers)for(const [W,D] of T.poly?[[3000,3000],[4200,4200]]:[[2400,2400],[3000,3000],[3600,4200],[4000,4500]])for(const [rail,fill] of [['0','euro'],['750','euro'],['combo','prof'],['1200','wood']])for(const base of ['floor','legs'])for(const deck of ['pine','wpc']){
  const cfg={type,cover,W,D,H:2200,rail,fill,base,deck,snow:['3','5'][n%2],wind:['1','3'][(n>>1)%2],mat,wood:['glulam','pine','larch'][n%3],fnd,hold:hold||'anchor',blocks:+blocks||1};n++;const tag=JSON.stringify(cfg);
  const m=BM.build(cfg),b=BM.bom(m);
  // 1. смета без пустых/NaN строк, итог совпадает с суммой
  for(const l of b.lines){if(!(l.qty>0)||!isFinite(l.sum)||!(l.price>=0))E('строка сметы '+l.key,tag+' '+l.name+' qty='+l.qty+' sum='+l.sum);}
  if(Math.abs(b.total-b.lines.reduce((s,l)=>s+l.sum,0))>1)E('итог','сумма строк ≠ total '+tag);
  // 2. каждая труба модели — в раскрое ровно столько раз, сколько частей
  const want={};for(const p of m.parts.filter(p=>p.kind==='tube')){const L=Math.ceil(p.cutLen-0.5),L0=BM.SEC[p.sec].stockL||3000;want[p.id]=(L<=L0||p.wood)?1:2;}
  const got={};for(const c of b.cuts.filter(c=>/^p\d|^p76|^p114|^w\d/.test(c.key)))for(const bin of c.plan.bins)for(const it of bin.items)got[it.id]=(got[it.id]||0)+1;
  for(const id in want)if(got[id]!==want[id])E('труба вне раскроя',tag+' id='+id+' нужно '+want[id]+' есть '+got[id]);
  // 3. каждый план: хлыст/лист не переполнен; количество в смете = числу хлыстов/листов
  for(const c of b.cuts){const pl=c.plan;
   if(pl.kind==='1d'){for(const bin of pl.bins){const u=bin.items.reduce((s,p)=>s+p.len,0);if(u>bin.stock.L+0.5)E('переполнен '+c.key,tag+' '+u+'>'+bin.stock.L);}}
   else for(const bin of pl.bins)for(const it of bin.items)if(it.x+it.w>bin.sheet.W+0.5||it.y+it.h>bin.sheet.H+0.5)E('вне листа '+c.key,tag);
   if(pl.over&&pl.over.length)E('не влезает '+c.key,tag+' '+pl.over.map(p=>p.len||p.w+'×'+p.h).join(','));
   const keys=Object.keys(pl.by||{});for(const k of keys){const ln=b.lines.filter(l=>l.key===k);if(!ln.length)continue;const q=ln.reduce((s,l)=>s+l.qty,0);if(q<pl.by[k])E('смета < раскроя '+k,tag+' смета '+q+' раскрой '+pl.by[k]);}}
  // 4. листы кровли покрывают скат по длине
  const rq=m.roofQty;if(rq.pieces&&rq.pieces.length){const cols={};for(const p of rq.pieces){(cols[p.col]=cols[p.col]||[]).push(p.len);}
   const S={c20:200,tile:250,ondulin:170,pcm:200}[m.cov]||0;for(const k in cols){const L=cols[k].reduce((a,b)=>a+b,0)-S*(cols[k].length-1);if(Math.abs(L-cols[k].sL)>1&&cols[k].length>1&&L<0)E('покрытие ската',tag);}}
  // 5. надёжность
  if(!m.verify.ok&&!(fnd!=='pillar'&&hold==='weight'))E('надёжность',tag+' '+m.verify.rows.filter(r=>r.util>1).map(r=>r.name+' '+Math.round(r.util*100)+'%').join('; '));
 }}
console.log('конфигураций',n,'ошибок',err);
