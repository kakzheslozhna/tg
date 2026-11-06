const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
let far=0,farK={},ov=0,cov=0,n=0,err=0,okChg=0,noBr=0,cat=0,wins=0,bad=[],gaps=0;const fails={};
for(const type of ['gable','mono','pergola','hex','oct'])for(const mat of ['steel','hybrid','timber'])for(const [W,D] of [[2400,2600],[3200,3200],[4000,4600]])for(const base of ['floor','legs'])for(const rail of ['0','750','combo'])for(const [win,light] of [['pvc','belt'],['net','led'],['both','belt'],['0','belt']]){
 const c=BM.sanitize({type,mat,W,D,base,rail,win,light,snow:'3',wind:'2'});let m,m0;
 try{m=BM.build(c);m0=BM.build(BM.sanitize(Object.assign({},c,{win:'0',light:'0'})));}catch(e){err++;if(bad.length<5)bad.push(JSON.stringify(c)+' '+e.message+' '+(e.stack||'').split('\n')[1]);continue;}
 n++;if(m0.verify.ok&&!m.verify.ok){okChg++;const r=m.verify.rows.filter(r=>r.util>1).map(r=>r.name.replace(/[\d,.]+/g,'#').slice(0,70));for(const x of r)fails[x]=(fails[x]||0)+1;}
 const DR=m.dress;if(!DR){if(bad.length<8)bad.push('nodress '+JSON.stringify(c));continue;}
 for(const w of DR.wins){wins++;if(w.fit)cat++;if(w.brackets<(w.roll?2:6)){noBr++;if(bad.length<12)bad.push(`brackets ${w.brackets} ${w.nm} ${w.sz} ${type} ${mat} ${W}x${c.D} ${base} ${rail}`);}}
 const ch=BM.checks(m);if(ch.coll.length+ch.bolt.length+ch.edge.length){if(bad.length<14)bad.push('checks '+JSON.stringify(c)+' '+ch.coll.slice(0,2).map(x=>x.a.name+'×'+x.b.name).join('; '));}
 const nets=m.parts.filter(p=>p.role==='netPane'),hw=m.parts.filter(p=>['beltBulb','beltSocket','plugBlock','ledPsu'].includes(p.role));for(const np of nets){if(np.kind!=='box')continue;for(const q of hw){const r=[q.c[0]-np.c[0],q.c[1]-np.c[1],q.c[2]-np.c[2]],d=r[0]*np.az[0]+r[1]*np.az[1]+r[2]*np.az[2],u=r[0]*np.ax[0]+r[2]*np.ax[2],rr=q.kind==='ball'?q.r:Math.abs(q.ax[0]*np.az[0]+q.ax[2]*np.az[2])*q.w/2+Math.abs(q.ay[0]*np.az[0]+q.ay[2]*np.az[2])*q.h/2+Math.abs((q.az||[0,0,0])[0]*np.az[0]+(q.az||[0,0,0])[2]*np.az[2])*q.t/2;if(Math.abs(d)<rr&&Math.abs(u)<np.w/2&&Math.abs(r[1])<np.h/2){ov++;if(bad.length<20)bad.push('overlap '+q.role+' '+JSON.stringify(c).slice(0,80));}}}
 for(const x of [...DR.wins,...DR.nets])if(x.off>60){far++;const k=type+' '+mat+' '+(x.zip!=null?'окно':'сетка');farK[k]=(farK[k]||0)+1;if(bad.length<24)bad.push(`far ${x.off} мм ${x.nm} ${x.zip!=null?'окно':'сетка'} `+JSON.stringify(c).slice(0,90));}
 const nn=DR.nets.length,nw=DR.wins.length;if((win==='net'||win==='both')&&nn!==DR._bays||(win==='pvc'||win==='both')&&nw!==DR._bays){cov++;if(bad.length<20)bad.push(`cover ${nw}/${nn} of ${DR._bays} `+JSON.stringify(c).slice(0,90));}
 const b=BM.bom(m);for(const l of b.lines.filter(l=>l.cat==='Оформление'))if(!(l.qty>0)||!(l.price>0)||!l.url){if(bad.length<16)bad.push('bom '+l.key+' '+l.qty+' '+l.price);}
 if(light==='belt'&&DR.light&&DR.light.clear<1700){gaps++;if(bad.length<18)bad.push(`low bulbs ${DR.light.clear} ${type} ${mat} ${W} ${base}`);}
}
console.log('n',n,'errors',err,'verify ok→fail with windows',okChg,'windows',wins,'catalog',cat,'few brackets',noBr,'low garland',gaps,'overlaps',ov,'uncovered',cov,'far from wall',far,JSON.stringify(farK));
for(const [k,v] of Object.entries(fails).sort((a,b)=>b[1]-a[1]).slice(0,10))console.log(String(v).padStart(5),k);
console.log(bad.join('\n'));
