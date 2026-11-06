// Базовая линия: что сейчас покупается и сколько уходит в отход (по типичным конфигурациям)
const fs=require('fs');global.window={};eval(fs.readFileSync(__dirname+'/../model.js','utf8'));const BM=window.BM;
const cfgs=[
 {type:'pergola',cover:'pc',W:3000,D:3000},{type:'pergola',cover:'pc',W:4000,D:3500},{type:'mono',cover:'pc',W:3000,D:3000},
 {type:'gable',cover:'c20',W:3000,D:3000},{type:'gable',cover:'tile',W:3000,D:3000},{type:'gable',cover:'shingle',W:3000,D:3000},
 {type:'gable',cover:'ondulin',W:3500,D:4000},{type:'mono',cover:'c20',W:3000,D:3000},{type:'hex',cover:'c20',W:3000},{type:'oct',cover:'shingle',W:3600},
];
for(const c of cfgs){const cfg=Object.assign({H:2200,base:'floor',rail:'combo',fill:'prof',deck:'pine',snow:'3'},c);const m=BM.build(cfg),b=BM.bom(m);
 console.log(`\n== ${c.type} ${c.cover} ${c.W}×${c.D||c.W}: итого ${Math.round(b.total)} ₽`);
 for(const l of b.lines.filter(l=>['Кровля','Борта','Пол','Металл'].includes(l.cat)&&l.sum>600))console.log(`  ${l.cat.padEnd(7)} ${String(l.qty).padStart(4)} ${l.unit.padEnd(5)} ${String(Math.round(l.sum)).padStart(7)} ₽  ${l.name.slice(0,60)}  ${l.note?'· '+l.note.slice(0,70):''}`);}
