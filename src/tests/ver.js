// прогон надёжности: печать отчёта для одного варианта
const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
const cfg=Object.assign({type:'pergola',cover:'pc',W:3000,D:3000,H:2200,base:'floor',rail:'combo',fill:'prof',snow:'3',wind:'1'},JSON.parse(process.argv[2]||'{}'));
const m=BM.build(cfg),v=m.verify;
console.log(JSON.stringify(cfg),'усиления:',JSON.stringify(m.fixes));
console.log('среда:',Object.entries(v.env).map(([k,x])=>k+'='+(typeof x==='number'?x.toFixed(2):x)).join(' '));
for(const r of v.rows)console.log(`${r.util>1?'✗':r.util>0.85?'!':' '} ${String(Math.round(r.util*100)).padStart(4)}%  [${r.grp}] ${r.name}  ${r.val}`);
