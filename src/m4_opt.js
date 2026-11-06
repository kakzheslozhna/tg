/* ---------------- раскрой материалов ----------------
   Линейный (трубы, доски, штакетник, планки, профили, водосток) и листовой (поликарбонат, OSB, профлист бортов).
   Цель — купить как можно меньше: минимальная стоимость покупки, при равной — меньший отход; годные остатки — в отчёт. */

// cut1D: куски pieces=[{len,...}] из хлыстов stocks=[{L,pr,...}] (длин может быть несколько), kerf — пропил на рез.
// Каждый хлыст: самый длинный из оставшихся кусков + точная добивка остатка (рюкзак 0/1 по миллиметрам);
// длину хлыста выбираем по цене за миллиметр полезной длины. Потом «расселяем» самый пустой хлыст по свободным
// местам остальных, сливаем пары коротких в один длинный, если так дешевле, и удешевляем хлысты по содержимому.
function cut1D(pieces,stocks,kerf,opt){
 kerf=kerf||0;opt=opt||{};
 const st=stocks.slice().sort((a,b)=>a.L-b.L||a.pr-b.pr),Lmax=st[st.length-1].L,minRest=opt.minRest||300,bins=[],over=[],rest=[];
 for(const p of pieces)(p.len>Lmax+0.5?over:rest).push(p);
 rest.sort((a,b)=>b.len-a.len);
 // подмножество items с наибольшей суммой (len+kerf) ≤ cap
 const fill=(cap,items)=>{const G=cap>6000?2:1,C=Math.floor((cap+1e-6)/G),n=items.length;if(C<=0||!n)return[];
  const reach=new Uint8Array(C+1),from=new Int32Array(C+1),w=items.map(p=>Math.ceil((p.len+kerf-1e-6)/G));reach[0]=1;
  for(let i=0;i<n;i++){const wi=w[i];if(wi>C)continue;for(let s=C;s>=wi;s--)if(!reach[s]&&reach[s-wi]){reach[s]=1;from[s]=i;}}
  let s=C;while(s>0&&!reach[s])s--;const pick=[];while(s>0){const i=from[s];pick.push(i);s-=w[i];}return pick;};
 while(rest.length){
  const big=rest[0],others=rest.slice(1);let best=null;
  for(const s of st){if(big.len>s.L+0.5)continue;
   const pick=fill(s.L-big.len,others),items=[big,...pick.map(i=>others[i])],used=items.reduce((a,p)=>a+p.len,0)+kerf*(items.length-1),score=s.pr/used;
   if(!best||score<best.score-1e-9||(Math.abs(score-best.score)<=1e-9&&s.L-used<best.s.L-best.used))best={s,items,used,score};}
  const set=new Set(best.items);for(let i=rest.length-1;i>=0;i--)if(set.has(rest[i]))rest.splice(i,1);
  bins.push({stock:best.s,items:best.items,used:best.used});}
 // самый пустой хлыст — по свободным местам остальных (наилучшее попадание)
 for(let g=0;g<40&&bins.length>1;g++){
  bins.sort((a,b)=>a.used-b.used);
  const b0=bins[0],oth=bins.slice(1),free=oth.map(b=>b.stock.L-b.used),plan=[];let ok=true;
  for(const p of b0.items.slice().sort((a,b)=>b.len-a.len)){let bi=-1,bf=1e18;
   for(let j=0;j<oth.length;j++){const f=free[j]-p.len-kerf;if(f>=-0.5&&f<bf){bf=f;bi=j;}}
   if(bi<0){ok=false;break;}free[bi]-=p.len+kerf;plan.push([p,bi]);}
  if(!ok)break;
  for(const [p,j] of plan){oth[j].items.push(p);oth[j].used+=p.len+kerf;}
  bins.shift();}
 // два хлыста → один подлиннее, если он дешевле двух
 if(st.length>1)for(let g=0;g<40;g++){let done=false;
  for(let i=0;i<bins.length&&!done;i++)for(let j=i+1;j<bins.length&&!done;j++){const u=bins[i].used+bins[j].used+kerf,c=st.filter(s=>s.L>=u-0.5).sort((a,b)=>a.pr-b.pr)[0];
   if(c&&c.pr<bins[i].stock.pr+bins[j].stock.pr-0.5){bins[i]={stock:c,items:bins[i].items.concat(bins[j].items),used:u};bins.splice(j,1);done=true;}}
  if(!done)break;}
 // по содержимому — самый дешёвый подходящий хлыст
 for(const b of bins){const c=st.filter(s=>s.L>=b.used-0.5).sort((x,y)=>x.pr-y.pr||x.L-y.L)[0];if(c&&c.pr<b.stock.pr)b.stock=c;}
 for(const b of bins){b.rest=b.stock.L-b.used;b.items.sort((x,y)=>y.len-x.len);}
 bins.sort((a,b)=>b.stock.L-a.stock.L||a.rest-b.rest);
 const need=pieces.reduce((s,p)=>s+p.len,0)-over.reduce((s,p)=>s+p.len,0),bought=bins.reduce((s,b)=>s+b.stock.L,0);
 const lb=rest.length+bins.length?Math.ceil((need+kerf*Math.max(0,pieces.length-over.length))/(Lmax+kerf)):0,by={};
 for(const b of bins){const k=b.stock.key||b.stock.L;by[k]=(by[k]||0)+1;}
 return{kind:'1d',bins,over,n:bins.length,by,cost:bins.reduce((s,b)=>s+b.stock.pr,0),need,bought,util:bought?need/bought:1,
  remnants:bins.filter(b=>b.rest>=minRest).map(b=>Math.round(b.rest)),lb};
}

// cut2D: прямоугольники rects=[{w,h,...}] из листов sheets=[{W,H,pr,...}]; opt.rot — можно поворачивать, opt.kerf — пропил.
// Гильотина: каждый рез проходит через весь остаток листа (так режут пилой и ножницами по металлу).
// Ячейка — лучшая по площади, деление по короткой оси; перебираем порядки укладки и типы листов, берём дешёвый результат.
function pack2D(list,sh,kerf,rot){
 const W=sh.W+kerf,H=sh.H+kerf,bins=[];
 for(const r of list){
  const opts=[[r.w+kerf,r.h+kerf,false]];if(rot&&Math.abs(r.w-r.h)>0.5)opts.push([r.h+kerf,r.w+kerf,true]);
  if(!opts.some(([w,h])=>w<=W+0.5&&h<=H+0.5))return null;
  let best=null;const tryF=(b,i)=>{const F=b.free[i];for(const [w,h,rt] of opts)if(w<=F.w+0.5&&h<=F.h+0.5){const sc=F.w*F.h-w*h;if(!best||sc<best.sc)best={b,i,w,h,rt,sc};}};
  for(const b of bins)for(let i=0;i<b.free.length;i++)tryF(b,i);
  if(!best){const b={free:[{x:0,y:0,w:W,h:H}],items:[]};bins.push(b);tryF(b,0);}
  const {b,i,w,h,rt}=best,F=b.free[i];b.free.splice(i,1);
  b.items.push({r,x:F.x,y:F.y,w:w-kerf,h:h-kerf,rot:rt});
  const dw=F.w-w,dh=F.h-h;
  if(dw<dh){if(dw>0.5)b.free.push({x:F.x+w,y:F.y,w:dw,h});if(dh>0.5)b.free.push({x:F.x,y:F.y+h,w:F.w,h:dh});}
  else{if(dw>0.5)b.free.push({x:F.x+w,y:F.y,w:dw,h:F.h});if(dh>0.5)b.free.push({x:F.x,y:F.y+h,w,h:dh});}
 }
 return bins;
}
function cut2D(rects,sheets,opt){
 opt=opt||{};const kerf=opt.kerf||0,rot=!!opt.rot;
 const fits=r=>sheets.some(s=>(r.w<=s.W+0.5&&r.h<=s.H+0.5)||(rot&&r.h<=s.W+0.5&&r.w<=s.H+0.5));
 const over=rects.filter(r=>!fits(r)),ok=rects.filter(fits),area=ok.reduce((s,r)=>s+r.w*r.h,0);
 const orders=[(a,b)=>b.w*b.h-a.w*a.h,(a,b)=>b.h-a.h||b.w-a.w,(a,b)=>b.w-a.w||b.h-a.h,(a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h)||b.w*b.h-a.w*a.h];
 let best=null;
 if(ok.length)for(const sh of sheets)for(const ord of orders){
  const bins=pack2D(ok.slice().sort(ord),sh,kerf,rot);if(!bins)continue;
  const out=bins.map(b=>({sheet:sh,items:b.items}));
  for(const o of out)for(const s2 of sheets)if(s2.pr<o.sheet.pr-0.5){const rb=pack2D(o.items.map(it=>it.r),s2,kerf,rot);if(rb&&rb.length===1){o.sheet=s2;o.items=rb[0].items;}}
  const cost=out.reduce((s,o)=>s+o.sheet.pr,0),last=out[out.length-1],lu=last.items.reduce((s,it)=>s+it.w*it.h,0)/(last.sheet.W*last.sheet.H);
  if(!best||cost<best.cost-0.5||(Math.abs(cost-best.cost)<=0.5&&lu<best.lu))best={bins:out,cost,lu};}
 const bins=best?best.bins:[],bought=bins.reduce((s,o)=>s+o.sheet.W*o.sheet.H,0),by={};
 for(const b of bins){const k=b.sheet.key||(b.sheet.W+'×'+b.sheet.H);by[k]=(by[k]||0)+1;}
 return{kind:'2d',bins,over,n:bins.length,by,cost:best?best.cost:0,need:area,bought,util:bought?area/bought:1};
}

// подбор параметра (свеса и т. п.) под материал: перебор от lo до hi с шагом st, при равной цене — ближе к def
function fitParam(lo,hi,st,def,costOf){
 let best=def,bc=costOf(def);
 for(let v=lo;v<=hi+1e-9;v+=st){const c=costOf(v);if(c<bc-0.5||(Math.abs(c-bc)<=0.5&&Math.abs(v-def)<Math.abs(best-def)))best=v,bc=c;}
 return best;
}

// кровельные листы по колонкам: снизу — целые листы заводским краем к карнизу, сверху — добор с нахлёстом.
// Добор режем из общих листов (раскрой), поэтому выгодно, когда скат укладывается в длину листа.
function sheetColumn(len,S){
 if(len<=S.L+0.5)return[len];
 const out=[];let a=0;while(len-a>S.L+0.5){out.push(S.L);a+=S.L-S.lap;}out.push(len-a);return out;
}
// металлочерепица режется только по линии ступени: длина куска — 150 + n·350
const tileLen=l=>Math.max(500,Math.ceil((l-150-1)/350)*350+150);
// поликарбонат: какими листами продаётся
const PC_STOCK=()=>[{W:2100,H:6000,pr:CAT.pc8.pr,key:'pc8'},{W:2100,H:12000,pr:CAT.pc12.pr,key:'pc12'}];
