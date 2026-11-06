const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
const tab={};
for(const type of ['gable','mono','pergola','hex'])for(const wind of ['1a','1','2','3','4','5','6','7'])for(const snow of ['3']){let f=0,n=0,mx=0;
 for(const sz of [[2400,2400],[3000,3000],[4000,4500]])for(const H of [2000,2400])for(const [rail,fill] of [['0','euro'],['1000','euro'],['combo','prof']]){
  const T=BM.TYPES[type],cfg={type,cover:T.covers[0],W:sz[0],D:sz[1],H,snow,wind,rail,fill,base:'floor'};n++;const m=BM.build(cfg);const r=m.verify.rows.filter(r=>/Стойка|шипе/.test(r.name));const u=Math.max(...r.map(r=>r.util));mx=Math.max(mx,u);if(u>1)f++;}
 (tab[type]=tab[type]||[]).push(`${wind}:${f}/${n}(${Math.round(mx*100)}%)`);}
for(const t in tab)console.log(t.padEnd(8),tab[t].join('  '));
