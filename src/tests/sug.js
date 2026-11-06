const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
for(const c of [{type:'pergola',cover:'pc',W:3000,D:3000},{type:'mono',cover:'pc',W:3000,D:3000},{type:'gable',cover:'c20',W:3500,D:3500},{type:'gable',cover:'tile',W:4000,D:3000},{type:'hex',cover:'c20',W:3500},{type:'gable',cover:'shingle',W:3600,D:4200}]){
 const cfg=Object.assign({H:2200,base:'floor',rail:'combo',fill:'prof',deck:'pine',snow:'3'},c),t0=Date.now(),s=BM.suggest(cfg);
 console.log(`\n${c.type} ${c.cover} ${c.W}×${c.D||c.W} (${Date.now()-t0} мс):`);
 for(const x of s)console.log(`  ${JSON.stringify(x.patch)}  ${x.d>0?'+':''}${Math.round(x.d)} ₽  площадь ${x.dA>0?'+':''}${x.dA.toFixed(2)} м²  ₽/м² ${Math.round(x.rpm)} | ${x.why.map(w=>`${w.n}: ${w.q1} вместо ${w.q0} (${Math.round(w.ds)})`).join('; ')}`);}
