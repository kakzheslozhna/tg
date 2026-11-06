// прогон надёжности по всему конструктору: что не проходит даже после автоусиления
const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
const only=process.argv[2]?process.argv[2].split(','):null;
const SZ=[[2400,2400],[3000,3000],[4000,4500],[4000,2400]],PZ=[3000,3800,4600],stat={},worst={},fixStat={},byW={};let n=0,bad=0,t0=Date.now();
const MATL=(process.env.MATS||'steel,hybrid,timber').split(','),FNL=(process.env.FNDS||'pillar').split(',').map(s=>s.split(':')),SOIL=process.env.SOIL||'loam';
for(const mat of MATL)for(const [fnd,hold,blocks] of FNL)for(const type of Object.keys(BM.TYPES)){if(only&&!only.includes(type))continue;const T=BM.TYPES[type];
 for(const cover of T.covers)for(const sz of T.poly?PZ.map(p=>[p,p]):SZ)for(const H of [2000,2400])for(const snow of ['1','3','5','8'])for(const wind of ['1','3','5','7'])for(const [rail,fill] of [['0','euro'],['combo','prof']])for(const base of ['floor','legs']){
  const cfg={type,cover,W:sz[0],D:sz[1],H,snow,wind,rail,fill,base,deck:'pine',ang:T.ang,mat,wood:['glulam','pine','larch'][n%3],fnd,hold:hold||'anchor',blocks:+blocks||1,soil:SOIL};n++;
  let m;try{m=BM.build(cfg);}catch(e){bad++;console.log('ERR',JSON.stringify(cfg),e.message);continue;}
  for(const k in m.fixes)fixStat[k+'='+m.fixes[k]]=(fixStat[k+'='+m.fixes[k]]||0)+1;
  const v=m.verify,wk=wind+'/'+(T.poly?'poly':'rect');byW[wk]=byW[wk]||[0,0];byW[wk][1]++;if(v.ok){byW[wk][0]++;continue;}bad++;
  for(const r of v.rows.filter(r=>r.util>1)){const key=r.grp+' | '+r.name.replace(/[\d,.]+\s*(кН·м|кН|мм|кПа|МПа|%)/g,'#').replace(/\d+/g,'#').slice(0,90);stat[key]=(stat[key]||0)+1;if(!worst[key]||r.util>worst[key].u)worst[key]={u:r.util,cfg,name:r.name,val:r.val};}}}
console.log('конфигураций',n,'не проходят',bad,'сек',((Date.now()-t0)/1000).toFixed(0));
for(const [k,c] of Object.entries(stat).sort((a,b)=>b[1]-a[1]))console.log(String(c).padStart(5),k,'| худший',Math.round(worst[k].u*100)+'%',JSON.stringify(worst[k].cfg),worst[k].val);
console.log('проходят по ветру:',Object.keys(byW).sort().map(k=>k+' '+byW[k][0]+'/'+byW[k][1]).join('  '));
console.log('усиления:',Object.entries(fixStat).sort((a,b)=>b[1]-a[1]).map(([k,c])=>k+':'+c).join('  '));
