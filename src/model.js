/* ================== МОДЕЛЬ БЕСЕДКИ (мм; Y — вверх, Z — вперёд к входу) ================== */
window.BM=(function(){
'use strict';
const RAD=Math.PI/180;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const norm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
const LP='https://lemanapro.ru';
const S=q=>LP+'/search/?q='+encodeURIComponent(q);

const SEC={
 '60x60x2':{t:2,r:4,kgm:3.56,stock:'p6060'},
 '60x60x3':{t:3,r:5,kgm:5.13,stock:'p6060t3'},
 '60x60x4':{t:4,r:6,kgm:6.6,stock:'p6060t4'},
 '80x40x2':{t:2,r:4,kgm:3.64,stock:'p8040'},
 '80x40x3':{t:3,r:5,kgm:5.23,stock:'p8040t3'},
 '100x50x3':{t:3,r:5,kgm:6.71,stock:'p10050'},
 '120x60x3':{t:3,r:5,kgm:8.13,stock:'p12060'},
 '120x60x4':{t:4,r:6,kgm:10.8,stock:'p12060t4'},
 '120x80x4':{t:4,r:6,kgm:11.7,stock:'p12080t4'},
 '60x40x2':{t:2,r:4,kgm:2.93,stock:'p6040'},
 '50x50x2':{t:2,r:4,kgm:3.01,stock:'p5050'},
 '50x50x3':{t:3,r:5,kgm:4.25,stock:'p5050t3'},
 '50x50x4':{t:4,r:6,kgm:5.4,stock:'p5050t4'},
 '40x40x2':{t:2,r:3,kgm:2.31,stock:'p4040'},
 '40x20x2':{t:2,r:3,kgm:1.68,stock:'p4020'},
 'r76x3':{t:3,r:38,kgm:5.4,stock:'p76',round:true},
 'r76x4':{t:4,r:38,kgm:7.1,stock:'p76t4',round:true},
 'r114x4':{t:4,r:57,kgm:10.85,stock:'p114',round:true,stockL:500}
};
const BOLT={6:{wt:1.6,wd:18,nh:6,hh:4,af:10,hole:7,head:2,nut:2.5,wash:2.8,torque:'6–8'},
            8:{wt:2,wd:24,nh:8,hh:5.3,af:13,hole:9,head:4.5,nut:5,wash:6.2,torque:'15–20'},
            10:{wt:2.5,wd:30,nh:10,hh:6.4,af:17,hole:11,head:8.5,nut:10,wash:12.2,torque:'25–30'},
            12:{wt:3,wd:37,nh:12,hh:7.5,af:19,hole:13,head:14,nut:17,wash:22,torque:'40–50'}};
const BOLT_STD={6:[30,40,50,60,70,80,90,100],8:[30,40,50,60,70,80,90,100,110,120,130,140,150,160],10:[40,50,60,70,80,90,100,110,120],12:[80,100,120,130,140,150,160,180,200,220,240,260,280,300,320,340,360,380,400]};

/* типы беседок и покрытия */
const TYPES={
 gable:{t:'Классика',sub:'двускатная, открытые фермы',ang:25,angR:[18,35],covers:['tile','c20','falc','shingle','ondulin']},
 mono:{t:'Модерн',sub:'односкатная, скат вбок',ang:10,angR:[8,15],covers:['c20','falc','pcm','pc','ondulin']},
 pergola:{t:'Пергола',sub:'фасад горизонтальный, скат 5–8° назад',ang:6,angR:[5,8],covers:['pc','pcm']},
 hex:{t:'Шестигранник',sub:'шатровая крыша, 6 граней',ang:30,angR:[22,40],covers:['shingle','tile','c20','ondulin','falc'],poly:6},
 oct:{t:'Восьмигранник',sub:'почти круглая, 8 граней',ang:30,angR:[22,40],covers:['shingle','tile','c20','ondulin','falc'],poly:8}
};
// step — шаг обрешётки, min — минимальный уклон по инструкции производителя
const COVERS={
 tile:{t:'Металлочерепица',s:'Металлочерепица',w:'≈5 кг/м²',life:'25–30 лет',step:350,min:14},
 c20:{t:'Профнастил С20',s:'Профнастил С20',w:'≈5 кг/м²',life:'25–30 лет',step:470,min:8},
 falc:{t:'Кликфальц (гладкая фальцевая)',s:'Кликфальц',w:'≈5 кг/м²',life:'30–50 лет',step:300,min:12},
 shingle:{t:'Гибкая черепица',s:'Гибкая черепица',w:'≈13 кг/м²',life:'20–30 лет',step:480,min:12},
 ondulin:{t:'Ондулин (битумный волновой лист)',s:'Ондулин',w:'≈3 кг/м²',life:'15–25 лет',step:450,min:10},
 pcm:{t:'Монолитный профилированный поликарбонат',s:'Поликарбонат монолит',w:'≈1,5 кг/м²',life:'15–20 лет',step:450,min:5},
 pc:{t:'Сотовый поликарбонат 8 мм',s:'Поликарбонат сотовый',w:'≈1,5 кг/м²',life:'10–15 лет',step:600,min:5}
};
const DECKS={pine:{t:'Хвоя (импрегнированная)',cat:'deck',mat:'wood'},larch:{t:'Лиственница',cat:'deckLarch',mat:'larch'},wpc:{t:'ДПК (композит)',cat:'deckWpc',mat:'wpc'}};
const TRUCKS={g3:{t:'Газель 3 м',L:3060,W:1980,H:1800},g42:{t:'Газель 4,2 м (удлинённая)',L:4200,W:2000,H:1800}};
const LIM={W:[2400,4000,100],D:[2400,4500,100],H:[2000,2400,50],P:[3000,4600,100]}; // P — диаметр многогранника по углам
const RAILS={
 '0':{t:'Без бортов',h:{back:0,left:0,right:0,front:0}},
 '450':{t:'Низкие — 450 мм',h:{back:450,left:450,right:450,front:450}},
 '750':{t:'Средние — 750 мм',h:{back:750,left:750,right:750,front:750}},
 '1000':{t:'Перила — 1000 мм',h:{back:1000,left:1000,right:1000,front:1000}},
 '1200':{t:'Высокие — 1200 мм',h:{back:1200,left:1200,right:1200,front:1200}},
 'combo':{t:'Комбо: зад 1200 · бока 1000 · перед 750',h:{back:1200,left:1000,right:1000,front:750}}
};
/* материал каркаса: metal — как раньше; hybrid — стальные стойки, деревянные балки, фермы и обрешётка; timber — ещё и стойки из бруса.
   Всё, что ниже настила (столбы, ножки, балки пола), — сталь во всех вариантах: здесь дерево гниёт первым.
   Древесина — СП 64.13330.2017: R = Rᴬ·mдл·mв; Rᴬ — табл. 3 (сорт 2), таблица 5 — лиственница ×1,2 (скалывание ×1),
   mв = 0,85 — условия 4а (улица под навесом, влажность до 20%), плотность — приложение Г для условий 3–4 */
const MATS={steel:{t:'Металл',sub:'стальной каркас, всё на сварке и болтах'},hybrid:{t:'Брус + стальной низ',sub:'каркас из бруса; сталь только внизу, где сыро: ножки и рама пола'},timber:{t:'Брус',sub:'весь каркас из бруса, от обвязки до конька; сталь только в узлах'}};
const WOODS={
 pine:{t:'Хвоя',s:'Хвоя',m3:47000,rho:600,kR:1,RA:19.5,Rt:10.5*0.7,Rs:2.4,tag:'брус нестроганый, сорт 2: лицевые грани шлифовать'},  // Rt: цельная, построечное изготовление — минус 30% (прим. 1 к табл. 3)
 glulam:{t:'Клеёный брус',s:'Клеёный',m3:120000,rho:600,kR:1,RA:19.5,Rt:13.5,Rs:2.25,tag:'сосна, ламели до 33 мм, не ведёт и почти не трескается'},
 larch:{t:'Лиственница',s:'Лиственница',m3:135000,rho:800,kR:1.2,RA:19.5,Rt:10.5*0.7,Rs:2.4,tag:'самая стойкая к гниению из доступных'}};
const WMV=0.85,WMS=0.66,WMW=0.8,WMG=0.53,WE=10000; // mв; mдл: снег, ветер, постоянная; E — среднее
const WSEC=[[100,100],[150,150],[100,150],[50,100],[50,50],[50,150],[50,200]];
for(const [b,h] of WSEC)SEC[`w${b}x${h}`]={t:0,r:2,kgm:b*h*6e-4,wood:true,b,h,stockL:3000};
const woodCat=(b,h,sp)=>`w${b}x${h}_${b<=50?(sp==='larch'?'larch':'pine'):sp}`;  // тонкие бруски — всегда строганые: клеить их незачем
const STEPS=[ // порядок = порядок работ: каркас выверяется и протягивается, пока на нём нет ни кровли, ни пола
 {id:'shop',t:'Мастерская: сварка модулей'},{id:'found',t:'Фундамент'},{id:'truck',t:'Погрузка'},{id:'ring',t:'Рама основания'},
 {id:'posts',t:'Стойки'},{id:'heads',t:'Оголовки порталов'},{id:'sides',t:'Боковые связи'},{id:'hips',t:'Рёбра и центр крыши'},{id:'brace',t:'Выверка и протяжка'},
 {id:'purlins',t:'Обрешётка'},{id:'roofDeck',t:'Сплошной настил OSB'},{id:'roofUnder',t:'Подкладочный ковёр'},{id:'roofEdge',t:'Карнизные и ветровые планки'},{id:'roof',t:'Кровля'},{id:'roofTrim',t:'Конёк и доборные элементы'},{id:'gutter',t:'Водосток'},
 {id:'bottom',t:'Каркас пола'},{id:'deck',t:'Пол'},{id:'railframe',t:'Секции бортов'},{id:'fill',t:'Заполнение бортов'},{id:'dress',t:'Окна и свет'},{id:'finish',t:'Финиш'}
];
const LAYERS=[
 {id:'found',t:'Фундамент',c:'#9b9a95'},{id:'frame',t:'Каркас',c:'#3d4148'},{id:'roofframe',t:'Фермы, обрешётка',c:'#6a7380'},
 {id:'roof',t:'Кровля',c:'#7a4b3a'},{id:'floor',t:'Пол',c:'#a57a4a'},{id:'rail',t:'Борта',c:'#8a6a5a'},
 {id:'weld',t:'Сварные швы',c:'#e0892e'},{id:'fast',t:'Саморезы и гвозди',c:'#8f979f'},{id:'hw',t:'Болты, уголки',c:'#b9c0c7'},{id:'dress',t:'Окна и свет',c:'#d9a441'},{id:'decor',t:'Мебель (для масштаба)',c:'#c49a6c'}
];
const ROLE={post:['С','Стойка'],stub:['ОГ','Оголовок стойки'],spigot:['В','Вставка-шип'],portalBeam:['Р','Ригель портала'],rafter:['Ф','Стропило фермы'],kingPost:['Ф','Бабка фермы'],strut:['Ф','Раскос фермы'],
 brace:['П','Подкос портала'],sideBeam:['Р','Ригель боковой'],sideBrace:['П','Подкос боковой'],floorBeam:['БП','Балка пола'],joist:['Л','Лага'],purlin:['О','Обрешётка'],
 stile:['Б','Стойка секции'],newel:['Б','Стойка у входа'],railTop:['Б','Поручень'],railMid:['Б','Средний брус'],railBot:['Б','Нижний брус'],
 basePlate:['К','Опорная пластина'],tongue:['Я','Язык'],flange:['Фл','Фланец'],newelPlate:['К','Опорная пластина стойки входа'],support:['К','Опорный столик'],capPlate:['З','Заглушка'],
 cleatW:['У','Упор обрешётки'],stopP:['УШ','Ушко обрешётки'],postW:['С','Стойка из бруса'],wHead:['ОК','Основание коннектора'],wKnife:['Н','Вставная пластина'],wBrace:['П','Подкос из бруса'],endPlate:['ТП','Торцевая пластина рамы'],cleatJoist:['КУ','Крепёжный уголок'],
 postR:['С','Стойка круглая'],panelRafter:['Щ','Стропило щита'],panelBar:['Щ','Поперечина щита'],ring:['Р','Обвязка'],ringBrace:['П','Подкос обвязки'],hip:['Ш','Ребро шатра'],hub:['Ш','Центральный узел'],purlinP:['О','Обрешётка шатра'],floorBeamP:['БП','Балка пола']};

const CAT={
 p6060:{n:'Труба профильная 60×60×2 мм, 3 м',u:'шт',pr:925,src:'site',url:LP+'/product/truba-profilnaya-60x60x2mm-3-m-15791001/',sku:'15791001'},
 p6060t3:{n:'Труба профильная 60×60×3 мм, 3 м (стойки — усиленные)',u:'шт',pr:1390,src:'est',url:S('труба профильная 60х60х3')},
 p6060t4:{n:'Труба профильная 60×60×4 мм, 3 м (стойки — для сильного ветра)',u:'шт',pr:1890,src:'est',url:S('труба профильная 60х60х4')},
 p5050t4:{n:'Труба профильная 50×50×4 мм, 3 м (шипы — для сильного ветра)',u:'шт',pr:1690,src:'est',url:S('труба профильная 50х50х4')},
 p5050t3:{n:'Труба профильная 50×50×3 мм, 3 м (вставки-шипы — усиленные)',u:'шт',pr:1290,src:'est',url:S('труба профильная 50х50х3')},
 p8040:{n:'Труба профильная 80×40×2 мм, 3 м',u:'шт',pr:1390,src:'est',url:S('труба профильная 80х40х2')},
 p8040t3:{n:'Труба профильная 80×40×3 мм, 3 м',u:'шт',pr:1890,src:'est',url:S('труба профильная 80х40х3')},
 p12060:{n:'Труба профильная 120×60×3 мм, 3 м',u:'шт',pr:2990,src:'est',url:S('труба профильная 120х60х3')},
 p12060t4:{n:'Труба профильная 120×60×4 мм, 3 м',u:'шт',pr:3890,src:'est',url:S('труба профильная 120х60х4')},
 p12080t4:{n:'Труба профильная 120×80×4 мм, 3 м',u:'шт',pr:4290,src:'est',url:S('труба профильная 120х80х4')},
 p10050:{n:'Труба профильная 100×50×3 мм, 3 м',u:'шт',pr:2390,src:'est',url:S('труба профильная 100х50х3')},
 p6040:{n:'Труба профильная 60×40×2 мм, 3 м',u:'шт',pr:1175,src:'site',url:LP+'/product/truba-profilnaya-60x40x2-mm-3-m-82377586/',sku:'82377586'},
 p5050:{n:'Труба профильная 50×50×2 мм, 3 м (вставки-шипы)',u:'шт',pr:980,src:'est',url:S('труба профильная 50х50х2')},
 p4040:{n:'Труба профильная 40×40×2 мм, 3 м',u:'шт',pr:724,src:'site',url:LP+'/product/truba-profilnaya-40x40x2mm-3-m-13376760/',sku:'13376760'},
 p4020:{n:'Труба профильная 40×20×2 мм, 3 м',u:'шт',pr:433,src:'site',url:LP+'/product/truba-profilnaya-40x20x2-mm-3-m-82157251/',sku:'82157251'},
 ang40:{n:'Уголок металлический 40×40×4 мм, 3 м (упоры обрешётки)',u:'шт',pr:528,src:'site',url:LP+'/product/ugolok-metallicheskiy-40x40x4-mm-3-m-13376824/',sku:'13376824',lk:'product'},
 kus40:{n:'Уголок крепёжный равнополочный 40×40×40×2 мм, оцинкованный',u:'шт',pr:14,src:'est',url:LP+'/catalogue/krepezhnye-ugolki/',lk:'catalog'},
 plate:{n:'Пластина соединительная PS 200×100×1,8 мм (из неё — заглушки на торцы)',u:'шт',pr:88,src:'site',url:LP+'/product/plastina-soedinitelnaya-ps-200x100x18-18739057/',sku:'18739057',lk:'product'},
 p76:{n:'Труба круглая электросварная Ø76×3 мм, 3 м (стойки, центр шатра)',u:'шт',pr:1890,src:'est',url:S('труба круглая 76х3')},
 p76t4:{n:'Труба круглая Ø76×4 мм, 3 м (стойки шатра — для сильного ветра)',u:'шт',pr:2390,src:'est',url:S('труба круглая 76х4')},
 p114:{n:'Труба круглая Ø114×4 мм, отрезок 0,5 м (центральный узел шатра)',u:'шт',pr:950,src:'est',url:S('труба 114х4')},
 plate6:{n:'Пластины 4–16 мм по эскизу: опорные, языки, фланцы, ушки (резка на металлобазе)',u:'кг',pr:190,src:'est',url:S('лист стальной 6 мм'),note:'в Лемана ПРО нет — металлобаза, лазер/плазма'},
 stud12s:{n:'Шпилька резьбовая DIN 975 класс 8.8, 12×1000 мм (жёсткая база)',u:'шт',pr:290,src:'est',url:S('шпилька 8.8 М12')},
 stud12:{n:'Шпилька резьбовая DIN 975 оцинк. 12×1000 мм',u:'шт',pr:110,src:'site',url:S('90841116'),sku:'90841116',lk:'sku'},
 concrete:{n:'Пескобетон М300, 40 кг',u:'меш.',pr:323,src:'site',url:LP+'/product/peskobeton-m300-kamennyy-cvetok-dobromes-40-kg-18478820/',sku:'18478820'},
 sand:{n:'Песок строительный, 40 кг (подушка)',u:'меш.',pr:130,src:'est',url:S('песок строительный 40 кг')},
 rub:{n:'Рубероид РКП-350, рулон 10 м² (опалубка столбов)',u:'рул.',pr:690,src:'est',url:S('рубероид')},
 rebar:{n:'Арматура А500С Ø10 мм, 3 м',u:'шт',pr:250,src:'est',url:S('арматура 10 мм')},
 wire:{n:'Проволока вязальная 1,2 мм, 0,5 кг',u:'шт',pr:160,src:'est',url:S('проволока вязальная')},
 c20:{n:'Профнастил С20 0,45 мм 1150×2000 мм, RAL 8017',u:'лист',pr:1298,src:'site',url:LP+'/product/profnastil-s20-045-mm-1150x2000-mm-ral-8017-korichnevyy-82157378/',sku:'82157378'},
 ridgeC20:{n:'Планка конька плоская для профнастила, 2 м',u:'шт',pr:520,src:'est',url:S('планка конька плоская')},
 trimC20:{n:'Планка торцевая (ветровая) для профнастила, 2 м',u:'шт',pr:420,src:'est',url:S('планка торцевая для профнастила')},
 sealC20:{n:'Уплотнитель для профнастила С20, 1 м',u:'шт',pr:70,src:'est',url:S('уплотнитель для профнастила')},
 roofScrew:{n:'Саморезы кровельные с пресс-шайбой и сверлом 4,8×29, RAL 8017, 100 шт',u:'уп.',pr:378,src:'site',url:LP+'/catalogue/samorezy/samorezy-krovelnye-ral-8017/',lk:'catalog'},
 clip:{n:'Саморез по металлу 4,2×16 со сверлом (прессшайба), 100 шт',u:'уп.',pr:250,src:'est',url:S('саморез по металлу со сверлом 4,2х16')},
 selfDrill:{n:'Саморез по металлу 5,5×32 со сверлом (шестигранный), 50 шт',u:'уп.',pr:290,src:'est',url:S('саморез по металлу со сверлом 5,5х32')},
 tile:{n:'Лист металлочерепицы 0,45 мм, 1180×2250 мм',u:'лист',pr:1780,src:'site',url:LP+'/catalogue/metallocherepica/list-metallocherepicy/',lk:'catalog'},
 ridgeTile:{n:'Конёк плоский для металлочерепицы, 2 м',u:'шт',pr:690,src:'est',url:S('конек для металлочерепицы')},
 trimTile:{n:'Планка торцевая для металлочерепицы, 2 м',u:'шт',pr:450,src:'est',url:S('планка торцевая металлочерепица')},
 ridgeSeal:{n:'Уплотнитель коньковый, 1 м',u:'шт',pr:90,src:'est',url:S('уплотнитель коньковый')},
 osb12:{n:'Плита OSB-3 Ultraply 12 мм 1250×2500 мм',u:'лист',pr:1240,src:'site',url:LP+'/product/plita-osb-3-ultraply-12-mm-1250x2500-mm-3125-m-89355360/',sku:'89355360',lk:'product'},
 shingle:{n:'Гибкая черепица ТехноНИКОЛЬ Shinglas, упаковка 3 м²',u:'уп.',pr:1350,src:'site',url:LP+'/catalogue/myagkaya-cherepica/tehnonikol-shinglas/',lk:'catalog'},
 ridgeSh:{n:'Черепица коньково-карнизная Shinglas, упаковка',u:'уп.',pr:1690,src:'est',url:S('черепица коньково-карнизная')},
 underlay:{n:'Ковёр подкладочный для гибкой черепицы, 10 м²',u:'рул.',pr:2950,src:'est',url:S('подкладочный ковер')},
 nails:{n:'Гвозди ершёные оцинкованные 3,5×30, 1 кг',u:'уп.',pr:360,src:'est',url:S('гвозди ершеные оцинкованные')},
 mastic:{n:'Мастика битумная для гибкой черепицы, 1 л',u:'шт',pr:790,src:'est',url:S('мастика для гибкой черепицы')},
 drip:{n:'Планка карнизная (капельник), 2 м',u:'шт',pr:360,src:'est',url:S('планка карнизная')},
 wind:{n:'Планка ветровая (торцевая), 2 м',u:'шт',pr:390,src:'est',url:S('планка ветровая')},
 ondulin:{n:'Ондулин Смарт, волновой лист 1950×950 мм',u:'лист',pr:790,src:'est',url:S('ондулин смарт')},
 ondNail:{n:'Гвозди/саморезы для ондулина с колпачком, 100 шт',u:'уп.',pr:420,src:'est',url:S('гвозди для ондулина')},
 ridgeOnd:{n:'Конёк ондулин 1000 мм',u:'шт',pr:520,src:'est',url:S('конек ондулин')},
 falc:{n:'Кликфальц 0,5 мм (полоса по длине ската, полезная ширина 340 мм)',u:'м²',pr:1150,src:'est',url:S('кликфальц'),note:'продаётся под заказ у производителей кровли'},
 falcScrew:{n:'Саморезы по металлу 4,2×19 для кликфальца (в замок), 250 шт',u:'уп.',pr:390,src:'est',url:S('саморез 4,2х19 со сверлом')},
 pcm:{n:'Поликарбонат монолитный профилированный 0,8 мм, 1050×2000 мм',u:'лист',pr:1690,src:'est',url:S('поликарбонат монолитный профилированный')},
 gutter:{n:'Желоб водосточный 125 мм, 3 м',u:'шт',pr:690,src:'est',url:S('желоб водосточный 125 мм 3 м')},
 gutterSet:{n:'Водосток: кронштейны желоба, заглушки, воронка, колено, хомуты — комплект',u:'компл.',pr:1900,src:'est',url:S('кронштейн желоба')},
 downpipe:{n:'Труба водосточная Ø90, 3 м',u:'шт',pr:790,src:'est',url:S('труба водосточная 90 мм 3 м')},
 hipCap:{n:'Колпак-навершие для шатровой кровли (оцинк., окраска)',u:'шт',pr:1490,src:'est',url:S('колпак на столб металлический')},
 osbScrew:{n:'Саморез по металлу 4,2×51 со сверлом и крыльями (OSB к обрешётке), 100 шт',u:'уп.',pr:420,src:'est',url:S('саморез с крыльями 4,2х51')},
 pc8:{n:'Поликарбонат сотовый 8 мм, 2,1×6 м, с УФ-защитой',u:'лист',pr:5290,src:'est',url:S('поликарбонат сотовый 8 мм 2,1х6')},
 pc12:{n:'Поликарбонат сотовый 8 мм, 2,1×12 м, с УФ-защитой (под заказ)',u:'лист',pr:11080,src:'est',url:S('поликарбонат сотовый 8 мм 2,1х12'),note:'в магазине обычно 2,1×6 м; 12 м — под заказ с доставкой'},
 pcConn:{n:'Профиль соединительный разъёмный для поликарбоната 8 мм, 6 м',u:'шт',pr:890,src:'est',url:S('профиль соединительный для поликарбоната 8 мм')},
 pcEnd:{n:'Профиль торцевой для поликарбоната 8 мм, 2,1 м',u:'шт',pr:230,src:'est',url:S('профиль торцевой поликарбонат 8 мм')},
 pcTape:{n:'Лента для торцов поликарбоната (герметичная + перфорированная), комплект',u:'компл.',pr:690,src:'est',url:S('лента для поликарбоната')},
 pcScrew:{n:'Саморезы с термошайбой для поликарбоната 5,5×38 со сверлом, 25 шт',u:'уп.',pr:390,src:'est',url:S('термошайба для поликарбоната саморез')},
 deck:{n:'Доска террасная хвоя импрегнированная вельвет 28×140×3000 мм',u:'шт',pr:854,src:'site',url:S('82676411'),sku:'82676411',lk:'sku'},
 deckLarch:{n:'Доска террасная лиственница сорт АВ 28×140×3000 мм',u:'шт',pr:1490,src:'est',url:S('доска террасная лиственница 28х140')},
 deckWpc:{n:'Доска террасная ДПК 25×140×3000 мм (полнотелая/пустотелая, с клипсами)',u:'шт',pr:1690,src:'est',url:S('террасная доска ДПК 3 м')},
 wpcClip:{n:'Кляймеры для ДПК с саморезами со сверлом (в стальную лагу), комплект на 1 м²',u:'компл.',pr:190,src:'est',url:S('кляймер для ДПК')},
 deckScrew:{n:'Саморез с крыльями по металлу 5,5×50 (доска к металлу), 100 шт',u:'уп.',pr:590,src:'est',url:S('саморез с крыльями 5,5х50')},
 antisept:{n:'Антисептик для торцов и пропилов, 1 л',u:'шт',pr:390,src:'est',url:S('антисептик для торцов')},
 c8:{n:'Профнастил С8 0,4 мм 1200×2000 мм, RAL 8017',u:'лист',pr:1250,src:'site',url:LP+'/product/profnastil-s8-04mm-1200x2000mm-ral-8017-korichnevyy-90171220/',sku:'90171220',lk:'product'},
 fillScrew:{n:'Саморез кровельный 4,8×19 со сверлом, RAL, 100 шт',u:'уп.',pr:330,src:'est',url:S('саморез кровельный 4,8х19')},
 euro:{n:'Штакетник металлический М-профиль, 2 м',u:'шт',pr:160,src:'site',url:LP+'/catalogue/metallicheskiy-shtaketnik/2-m/',lk:'catalog'},
 plank:{n:'Доска строганая сосна 20×95×3000 мм',u:'шт',pr:290,src:'est',url:S('доска строганая 20х95')},
 woodScrew:{n:'Саморез с крыльями по металлу 4,8×38, 100 шт',u:'уп.',pr:450,src:'est',url:S('саморез с крыльями 4,8х38')},
 woodOil:{n:'Масло-антисептик для дерева (улица), 0,9 л',u:'шт',pr:690,src:'est',url:S('масло для дерева уличное')},
 paint27:{n:'Грунт-эмаль по ржавчине 3 в 1 Empils PL гладкая, серая, 2,7 кг',u:'шт',pr:1073,src:'site',city:'Москва',sku:'84434181',url:'https://lemanapro.ru/search/?q=84434181',lk:'sku',warn:'Под цвет каркаса: чёрная — арт. 84434187 (980 ₽), шоколадная — арт. 84434190 (1030 ₽, Киров). Белой 2,7 кг не нашёл — тогда банки 0,9 кг.'},
 paint:{n:'Грунт-эмаль по ржавчине 3 в 1, 0,9 кг',u:'шт',pr:638,src:'site',url:LP+'/product/grunt-emal-po-rzhavchine-3-v-1-rascvet-bystrosohnushchaya-cvet-chernyy-09-kg-87815562/'},
 solvent:{n:'Уайт-спирит (обезжиривание), 1 л',u:'шт',pr:220,src:'est',url:S('уайт-спирит')},
 zinc:{n:'Цинк-спрей (холодное цинкование) — пропилы, отверстия, швы',u:'шт',pr:690,src:'est',url:S('цинк спрей')},
 sealant:{n:'Герметик кровельный, 280 мл (нахлёсты, пропилы)',u:'шт',pr:450,src:'est',url:S('герметик кровельный')},
 electrode:{n:'Электрод сварочный МР-3 ESAB 2,5 мм, 1 кг',u:'уп.',pr:548,src:'site',url:LP+'/product/elektrod-svarochnyy-mr-3-esab-25-mm-1-kg-85301401/',sku:'85301401',lk:'product'},
 gdisc:{n:'Круг зачистной по металлу 125×6 мм',u:'шт',pr:130,src:'est',url:S('круг зачистной 125')},
 discs:{n:'Диск отрезной по металлу 125×1,2 мм, 10 шт',u:'уп.',pr:450,src:'est',url:S('диск отрезной по металлу 125')},
 drill4:{n:'Сверло по металлу HSS-Co 4 мм (пилотное)',u:'шт',pr:90,src:'est',url:S('сверло по металлу 4 мм кобальт')},
 drill9:{n:'Сверло по металлу HSS-Co 9 мм (под M8)',u:'шт',pr:290,src:'est',url:S('сверло по металлу 9 мм')},
 drill11:{n:'Сверло по металлу HSS-Co 11 мм (под M10)',u:'шт',pr:340,src:'est',url:S('сверло по металлу 11 мм')},
 stepDrill:{n:'Сверло ступенчатое 4–20 мм (Ø14 под анкеры, снятие заусенцев)',u:'шт',pr:650,src:'est',url:S('сверло ступенчатое')},
 geotex:{n:'Геотекстиль 150 г/м², 2×5 м',u:'шт',pr:450,src:'est',url:S('геотекстиль')},
 gravel:{n:'Щебень гранитный фр. 20–40, 50 кг',u:'меш.',pr:230,src:'est',url:S('щебень 50 кг')},
 gravelBulk:{n:'Щебень 20–40 навалом, с доставкой',u:'м³',pr:2900,src:'est',url:S('щебень фракция 20-40')},
 connBase:{n:'Коннектор опорный для бруса',u:'шт',pr:775,src:'est',url:'https://xn----7sbodvrda4ak7l.xn--p1ai/products/konnektor-opora-dlya-brusa-100100-mm-odinarnyj-1'},
 conn3:{n:'Коннектор угловой, тройной, для бруса',u:'шт',pr:1650,src:'est',url:'https://xn----7sbodvrda4ak7l.xn--p1ai/products/category/konnektor-dlya-brusa'},
 connT:{n:'Коннектор Т-образный для бруса',u:'шт',pr:2300,src:'est',url:S('коннектор для бруса т-образный')},
 connE:{n:'Торцевой коннектор для бруса',u:'шт',pr:900,src:'est',url:S('коннектор торцевой для бруса')},
 conn4:{n:'Коннектор Т-образный, 4-лучевой, для бруса',u:'шт',pr:2500,src:'est',url:'https://luvon.ru/catalog/konnektory/'},
 connS:{n:'Коннектор сквозной для бруса',u:'шт',pr:1800,src:'est',url:'https://luvon.ru/catalog/konnektory/'},
 connP:{n:'Коннектор угла многогранника, под заказ',u:'шт',pr:3400,src:'est',url:'https://xn----7sbodvrda4ak7l.xn--p1ai/products/category/konnektor-dlya-brusa'},
 connJ:{n:'Коннектор торцевой 50×100 для лаг',u:'шт',pr:450,src:'est',url:'https://luvon.ru/catalog/konnektory/'},
 conn6:{n:'Саморез-глухарь 6×60 оцинк., 100 шт',u:'уп.',pr:990,src:'est',url:S('глухарь 6х60')},
 conn5:{n:'Саморез для коннекторов 5×50 оцинк., 250 шт',u:'уп.',pr:690,src:'est',url:S('шуруп для перфорированного крепежа 5х50')},
 shimSet:{n:'Подкладки стальные 120×80, набор на опору',u:'шт',pr:140,src:'est',url:S('подкладка стальная пластина 2 мм')},
 slab:{n:'Плита тротуарная бетонная 500×500×50',u:'шт',pr:390,src:'est',url:S('плита тротуарная 500х500х50')},
 gasblock:{n:'Блок газобетонный D600 B3,5 600×300×200',u:'шт',pr:260,src:'est',url:S('газобетонный блок 600х300х200 D600')},
 gasGlue:{n:'Клей для газобетона, 25 кг',u:'меш.',pr:390,src:'est',url:S('клей для газобетона 25 кг')},
 gasMastic:{n:'Мастика битумная гидроизоляционная, 18 кг',u:'шт',pr:1490,src:'est',url:S('мастика битумная 18 кг')},
 anchorH:{n:'Анкер винтовой: лопасть Ø200, шток Ø20, L ≈ 1,5 м (оцинк.)',u:'шт',pr:1700,src:'est',url:S('винтовая свая 57 анкер')},
 stud16:{n:'Шпилька резьбовая DIN 975 оцинк. 16×1000 мм',u:'шт',pr:260,src:'est',url:S('шпилька М16 1000')},
 stud20:{n:'Шпилька резьбовая DIN 975 оцинк. 20×1000 мм',u:'шт',pr:430,src:'est',url:S('шпилька М20 1000')}
};

function cutZ(pl,x,y,def){if(!pl)return def;const n=pl.n,q=pl.p;return q[2]-(n[0]*(x-q[0])+n[1]*(y-q[1]))/n[2];}

// прямоугольник доски минус вырезы (под стойки), прилегающие к краям
function notchPoly(x0,x1,z0,z1,obst){
 const E=0.01,ns={b:[],r:[],t:[],l:[]},rects=[];
 for(const o of obst){const a0=Math.max(x0,o.x0),a1=Math.min(x1,o.x1),c0=Math.max(z0,o.z0),c1=Math.min(z1,o.z1);if(a0>=a1-E||c0>=c1-E)continue;rects.push(o);
  if(o.z1>=z1-E)ns.t.push({a:a0,b:a1,d:c0});else if(o.z0<=z0+E)ns.b.push({a:a0,b:a1,d:c1});else if(o.x1>=x1-E)ns.r.push({a:c0,b:c1,d:a0});else if(o.x0<=x0+E)ns.l.push({a:c0,b:c1,d:a1});}
 const pts=[],P=(x,z)=>pts.push([x,z]);
 P(x0,z0);ns.b.sort((p,q)=>p.a-q.a).forEach(n=>{P(n.a,z0);P(n.a,n.d);P(n.b,n.d);P(n.b,z0);});P(x1,z0);
 ns.r.sort((p,q)=>p.a-q.a).forEach(n=>{P(x1,n.a);P(n.d,n.a);P(n.d,n.b);P(x1,n.b);});P(x1,z1);
 ns.t.sort((p,q)=>q.b-p.b).forEach(n=>{P(n.b,z1);P(n.b,n.d);P(n.a,n.d);P(n.a,z1);});P(x0,z1);
 ns.l.sort((p,q)=>q.b-p.b).forEach(n=>{P(x0,n.b);P(n.d,n.b);P(n.d,n.a);P(x0,n.a);});
 const inside=(x,z)=>rects.some(o=>x>o.x0+E&&x<o.x1-E&&z>o.z0+E&&z<o.z1-E);
 const out=[];for(const p of pts){if(inside(p[0],p[1]))continue;const l=out[out.length-1];if(l&&Math.abs(l[0]-p[0])<E&&Math.abs(l[1]-p[1])<E)continue;out.push(p);}
 if(out.length>1){const f=out[0],l=out[out.length-1];if(Math.abs(f[0]-l[0])<E&&Math.abs(f[1]-l[1])<E)out.pop();}
 return out;
}
// крепёж «россыпью» (саморезы, гвозди): что это, во что крепит, позиция сметы
for(const [b,h] of WSEC)for(const sp of Object.keys(WOODS)){const W=WOODS[sp],k=woodCat(b,h,sp);if(CAT[k])continue;
 const nm=b<=50?`${h<=50?'Брусок':'Доска'} ${sp==='larch'?(h<=50?'строганый':'строганая')+' лиственница':(h<=50?'нестроганый':'нестроганая')+' хвоя'}`:sp==='glulam'?'Брус клеёный сосна':sp==='larch'?'Брус лиственница строганый':'Брус нестроганый хвоя';
 CAT[k]={n:`${nm} ${b}×${h}×3000 мм`,u:'шт',pr:Math.round(b*h*3*1e-6*WOODS[k.split('_')[1]].m3/10)*10,src:'est',url:S(`${b<=50?'доска':sp==='glulam'?'брус клееный':'брус'} ${b}х${h}${sp==='larch'?' лиственница':''}`)};}
/* ---- сверка каталога 30.10.2026 ----
   Лемана ПРО не отдаёт страницы роботам (HTTP 401), поэтому адреса и цены взяты из поисковой выдачи по lemanapro.ru: цена — со снимка карточки,
   дата снимка неизвестна, город указан в city; между городами цены расходятся в 1,5–2 раза. Страницы LUVON открыты напрямую: src 'live'.
   lk: product — карточка, sku — поиск по артикулу открывает карточку, catalog — раздел, search — обычный поиск (карточка не найдена). */
const PRICE_DATE='30.10.2026';
const PROD=(slug,sku)=>({url:`${LP}/product/${slug}-${sku}/`,sku,lk:'product'}),BYSKU=sku=>({url:S(sku),sku,lk:'sku'}),LV=(slug,n,pr)=>({n,pr,src:'live',city:'luvon.ru',url:`https://luvon.ru/catalog/konnektory/${slug}/`,lk:'product'});
const RIDGE={n:'Конёк плоский 60×230 мм 2 м 0,4 мм RAL 8017',pr:634,city:'Тверь',...PROD('konek-ploskiy-60x230-mm-2-m-04-mm-ral-8017-korichnevyy','10009009')},TRIM={n:'Планка торцевая 90×90 мм 2 м 0,4 мм RAL 8017',pr:575,city:'Волгоград',url:S('торцевая планка 90x90x2000 RAL 8017')};
const CHK={
 p6060:{pr:925,city:'Москва'},p6040:{pr:1175,city:'Москва'},p4040:{pr:724,city:'Москва'},p4020:{pr:412,city:'Тверь'},
 p5050:{pr:775,city:'Москва',...PROD('truba-profilnaya-50x50x2-mm-3-m','82157258')},
 concrete:{pr:323,city:'Москва'},
 rub:{n:'Рубероид РКК-350 верхний слой картон, рулон 10 м²',pr:664,city:'Казань',...PROD('ruberoid-rkk-350-verhniy-sloy-karton-10-m','82585599')},
 rebar:{n:'Арматура металлическая 10 мм А400/500С, 3 м',pr:197,city:'Челябинск',...PROD('armatura-metallicheskaya-10-mm-a400-500s-3-m','82550588')},
 stud16:{pr:210,city:'Киров',...PROD('shpilka-rezbovaya-ocinkovannaya-stal-din-975-oc-16x1000-mm','90841120')},
 c20:{pr:1298,city:'Москва'},ridgeC20:RIDGE,ridgeTile:RIDGE,trimC20:TRIM,trimTile:TRIM,
 c8:{pr:1136,city:'Воронеж',...BYSKU('89440439')},
 tile:{n:'Металлочерепица 0,45 мм 2250×1180 мм RAL 8017',pr:1788,city:'Волгоград',url:LP+'/catalogue/metallocherepica/metallocherepica-ral-8017/',lk:'catalog'},
 shingle:{n:'Гибкая черепица Технониколь Оптима коричневый, упаковка 3 м²',pr:996,city:'Москва',...BYSKU('87949171')},
 pc8:{n:'Поликарбонат сотовый 8 мм 2,1×6 м Rational прозрачный',pr:5543,city:'',...BYSKU('89411715')},
 pcm:{n:'Поликарбонат монолитный С21 0,8 мм 2×1,051 м Novattro прозрачный',pr:1436,city:'Киров',...PROD('polikarbonat-monolitnyy-profilirovannyy-s21-08-mm-2x1051-m-novattro-prozrachnyy','88976338')},
 deck:{pr:838,city:'Тверь'},
 deckWpc:{n:'Террасная доска ДПК CM Decking Vintage 25×140×3000 мм',pr:2322,city:'',url:LP+'/catalogue/terrasnaya-doska-iz-dpk/cm/',lk:'catalog'},
 euro:{n:'Штакетник металлический M-образный 128 мм 2 м RAL 8017',pr:210,city:'Иваново',...PROD('shtaketnik-metallicheskiy-m-obraznyy-128-mm-2-m-odnostoronniy-ral-8017-korichnevyy','85395038')},
 gutter:{n:'Желоб водосточный 125 мм 3 м коричневый',pr:1013,city:'Москва',...PROD('zhelob-vodostochnyy-3-m-125-mm-cvet-korichnevyy','81931298')},
 downpipe:{n:'Труба водосточная 90 мм 3 м коричневая Интерпрофиль',pr:1408,city:'Москва',...BYSKU('81931341')},
 gasGlue:{n:'Клей для блоков Волма Блок, 25 кг',pr:378,city:'Москва',...PROD('kley-dlya-blokov-volma-blok-25-kg','12265073')},
 gasMastic:{n:'Мастика битумная однокомпонентная, 18 кг',pr:1580,city:'',...PROD('mastika-bitumnaya-odnokomponentnaya','11153969')},
 anchorH:{n:'Свая винтовая ВСК 57 Л200 1,5 м',pr:1298,city:'Саранск',...BYSKU('82630844')},
 w100x100_pine:{n:'Брус нестроганый 100×100×3000 мм хвоя',pr:1395,city:'Краснодар',...PROD('brus-nestroganyy-100x100x3000-mm-hvoya','82017667')},
 w150x150_pine:{n:'Брус нестроганый 150×150×3000 мм хвоя',pr:1860,city:'Москва',...BYSKU('85102666')},
 w50x100_pine:{n:'Доска нестроганая 50×100×3000 мм хвоя',pr:555,city:'Москва',...PROD('doska-nestroganaya-50x100x3000-mm-hvoya-fgis-lk','81947447')},
 w50x150_pine:{n:'Доска нестроганая 50×150×3000 мм хвоя',pr:925,city:'Киров',...PROD('doska-nestroganaya-50x150x3000-mm-hvoya-fgis-lk','81947448')},
 w50x200_pine:{n:'Доска нестроганая импрегнированная 50×200×3000 мм хвоя',pr:2224,city:'Москва',...PROD('doska-nestroganaya-impregnirovannaya-50x200x3000-mm-hvoya-sort-optima-fgis-lk','85108160')},
 w100x100_glulam:{n:'Брус сращенный 100×100×3000 мм хвоя сорт Экстра',pr:1742,city:'Воронеж',...BYSKU('81990138')},
 woodOilExt:{n:'Лазурь для дерева Linnimax полуматовая прозрачная, 2,5 л',pr:2231,city:'',...BYSKU('89349658')},
 w50x50_pine:{n:'Брусок строганый 50×50×3000 мм хвоя сорт Оптима',pr:333,city:'Москва',...PROD('brusok-stroganyy-50x50x3000-mm-hvoya-sort-optima-fgis-lk','81947398')},
 woodScrew6:{n:'Саморезы по дереву оцинк. 6×120 мм, на вес: 100 шт ≈ 2 кг',pr:1200,city:'',url:LP+'/catalogue/samorezy/samorezy-120-mm-dlina/',lk:'catalog'},
 zinc:{n:'Состав холодного цинкования Vixen, 520 мл',pr:396,city:'Москва',...PROD('sostav-holodnogo-cinkovaniya-vixen','18820824')},
 conn6:{n:'Шуруп-глухарь DIN 571 6×60 оцинк., 100 шт',pr:890,city:'Череповец',url:LP+'/catalogue/samorezy/shurup-gluhar/',lk:'catalog'},
 slab:{n:'Плитка тротуарная бетонная 500×500×70 мм серая',pr:293,city:'Москва',url:LP+'/catalogue/trotuarnaya-plitka/betonnye-trotuarnye-plitki/',lk:'catalog'},
 underlay:{n:'Подкладочный ковёр Mida, 10 м²',pr:475,city:'',url:LP+'/catalogue/myagkaya-cherepica/podkladochnyy-kover/',lk:'catalog'},
 roofScrew:{n:'Саморезы кровельные Dilwis 4,8×29 с пресс-шайбой и сверлом, RAL 8017, 100 шт',pr:378,city:'Екатеринбург'},
 antisept2:{n:'Антисептик Neomid 440 Eco для наружных работ, концентрат 1:9, 5 л',pr:2812,city:'Москва',conc:10,...PROD('antiseptik-neomid-440-eco-dlya-naruzhnyh-rabot-dlya-dereva-biozashchitnyy-koncentrat-19-5-l','90167552')},
 geotex:{n:'Геотекстиль 150 г/м², рулон 2×25 м',pr:1850,city:'',url:LP+'/catalogue/geomaterialy/geotekstil-150-g-m/',lk:'catalog'},
 structScrew:{n:'Саморезы конструкционные INFIX потайные 8×160 мм, 50 шт',pr:917,city:'',...BYSKU('91651414')},
 connBase:LV('opornyy-konnektor','Коннектор опорный для бруса 100×100 LUVON, сталь 2 мм',1500),
 conn3:LV('uglovoy-konnektor','Коннектор угловой для бруса 100×100 LUVON',2200),
 conn4:LV('4kh-luchevoy-konnektor','4-лучевой коннектор для бруса 100×100 LUVON',2700),
 connS:LV('konnektor-dlya-brusa-100kh100-mm-skvoznoy-luvon','Коннектор сквозной для бруса 100×100 LUVON',2300),
 connT:LV('t-konnektor','Коннектор Т-образный для бруса 100×100 LUVON',2300),
 connE:LV('tortsevoy-konnektor-100kh100','Торцевой коннектор для бруса 100×100 LUVON',900),
 connJ:{n:'Опора бруса раскрытая OBR R 50×100×1,8 мм',u:'шт',pr:122,city:'Москва',...BYSKU('83861169')}   // та же раскрытая опора, что у LUVON за 900 ₽: лоток, щёки, полки на грань балки
};
CAT.structScrew={n:'Саморез конструкционный по дереву 8×160, потай, 50 шт',u:'уп.',pr:1490,src:'est',url:S('конструкционный саморез 8х160')};
CAT.woodScrew6={n:'Саморез по дереву 6×120 жёлтый цинк, 100 шт',u:'уп.',pr:890,src:'est',url:S('саморез по дереву 6х120')};
CAT.antisept2={n:'Антисептик глубокого проникновения для наружных работ, 5 л',u:'канистра',pr:1490,src:'est',url:S('антисептик для дерева 5 л наружный')};
CAT.woodOilExt={n:'Масло-лазурь для наружных работ, 2,5 л',u:'банка',pr:2890,src:'est',url:S('масло лазурь для дерева наружных работ')};
CAT.endSeal={n:'Состав для защиты торцов древесины, 1 л',u:'банка',pr:990,src:'est',url:S('защита торцов древесины')};
for(const k in CHK)Object.assign(CAT[k],{src:'site'},CHK[k]);
/* у этих есть точный артикул, но цена на карточке не вызывает доверия или не московская: оставляем оценку и предупреждаем */
Object.assign(CAT.gasblock,{n:'Блок газобетонный D600 600×300×200 мм серый',warn:'На Дальнем Востоке 478 ₽, в Иркутске 520 ₽; в Москве нашёлся только 600×250×200 за 162 ₽. В смете оценка.'},BYSKU('89378704'));
Object.assign(CAT.w100x100_larch,{n:'Брусок строганый 100×100×3000 мм лиственница',warn:'На карточке 850–951 ₽ — слишком дёшево для лиственницы, проверь размер. В смете оценка.'},BYSKU('14396157'));
for(const k in CAT){const c=CAT[k];if(!c.lk)c.lk=/\/search\/\?q=/.test(c.url)?(/^\d+$/.test(decodeURIComponent(c.url.split('q=')[1]))?'sku':'search'):/\/catalogue\//.test(c.url)||/\/category\//.test(c.url)?'catalog':'product';}
const FAST={
 roof:{c20:['Саморез кровельный 4,8×29 с EPDM-шайбой','лист → обрешётка, в нижнюю волну через волну','roofScrew'],tile:['Саморез кровельный 4,8×29 с EPDM-шайбой','лист → обрешётка, в прогиб волны под ступенью','roofScrew'],pcm:['Саморез 4,8×35 с EPDM-шайбой','лист → обрешётка, в гребень волны, отверстие +3 мм','roofScrew'],ondulin:['Гвоздь (саморез) для ондулина с колпачком','лист → обрешётка, в гребень волны, 20 на лист','ondNail'],falc:['Саморез 4,2×19 в замок','скрыт в замке панели','falcScrew'],shingle:['Гвоздь ершёный 3,5×30','гонт → OSB, 4 на гонт, закрыт следующим рядом','nails']},
 pc:['Саморез 5,5×38 с термошайбой','поликарбонат → поперечина/обрешётка, отверстие +3 мм','pcScrew'],
 trim:['Саморез кровельный 4,8×29 (доборные элементы)','конёк, торцевые планки → лист/обрешётка, шаг 300–450','roofScrew'],
 osb:['Саморез 4,2×51 с крыльями','OSB → обрешётка, шаг 300 мм по каждому ряду','osbScrew'],
 tek:['Саморез по металлу 5,5×32 со сверлом','упор → обрешётка/стропило; столик → балка; основание профиля → стропило','selfDrill'],
 clip:['Саморез по металлу 4,2×16 со сверлом','крепёжный уголок → лага/балка/ребро','clip'],
 deck:['Саморез с крыльями 5,5×50','доска пола → лага, по 2 на пересечение','deckScrew'],
 fill:['Саморез кровельный 4,8×19 со сверлом','заполнение борта → брус секции','fillScrew'],
 wood:['Саморез с крыльями 4,8×38','штакетина → брус секции','woodScrew'],
 lag:['Шуруп-глухарь 6×60','коннектор → брус','conn6'],
 sc8:['Саморез конструкционный 8×160','стропило → затяжка, балка → балка','structScrew'],
 jc:['Саморез 5×50','опора бруса → лага и балка','conn5'],
 wp:['Саморез по дереву 6×120','обрешётка → балка: по 2 на опору, ветер отрывает кровлю вверх','woodScrew6'],
 dws:['Саморез по металлу 4,2×16 со сверлом','скоба окна, профиль ленты, блок питания → сталь','dwS'],
 dww:['Саморез по дереву 4,2×32','скоба окна, профиль ленты, блок питания → брус','dwW'],
 dwp:['Саморез с прессшайбой острый 4,2×25','лента-липучка москитной сетки → брус, настил; шаг 200 мм','dwP']};
const SNOW_={1:0.5,2:1.0,3:1.5,4:2.0,5:2.5,6:3.0,7:3.5,8:4.0};
const GROOF={c20:0.10,tile:0.12,shingle:0.25,pc:0.03,pcm:0.03,falc:0.10,ondulin:0.06};
// подбор трубы на изгиб: σ ≤ 200 МПа (с запасом к 225) и прогиб ≤ L/lim; M — изгибающий момент, q·L⁴-коэффициент для прогиба
const Ipr=(b,h,t)=>(b*h**3-(b-2*t)*(h-2*t)**3)/12;
function pickSec(cands,M,dq,L,lim){for(const c of cands){const I=Ipr(c.b,c.h,c.t),Wm=I/(c.h/2);if(M/Wm<=200&&5*dq*L**4/(384*2.06e5*I)<=L/lim)return c;}return cands[cands.length-1];}
const BEAMS=[{sec:'60x40x2',b:40,h:60,t:2},{sec:'80x40x2',b:40,h:80,t:2},{sec:'80x40x3',b:40,h:80,t:3},{sec:'100x50x3',b:50,h:100,t:3},{sec:'120x60x3',b:60,h:120,t:3}];
// наибольший шаг обрешётки 40×20 на ребро по прочности и прогибу (L/150)
function purlinStep(L,Sg,c,g){const I=Ipr(20,40,2),Wm=I/20,a=Sg*1.4*c+g*1.2,an=Sg*c+g;return Math.floor(Math.min(1600*Wm/(L*L*a),384*2.06e5*I/(750*L**3*an))*1000/10)*10;}
function sanitize(c){
 const cfg=Object.assign({type:'gable',W:3000,D:3000,H:2200,base:'floor',cover:'tile',rail:'750',fill:'euro',metal:'lemana',truck:'g42',deck:'pine',snow:'3',wind:'1',mat:'steel',wood:'glulam',fnd:'pillar',hold:'anchor',blocks:1,soil:'loam',win:'0',light:'0'},c||{});
 if(!TYPES[cfg.type])cfg.type='gable';
 const TY=TYPES[cfg.type];
 for(const k of ['W','D','H']){const [lo,hi,st]=TY.poly&&k==='W'?LIM.P:LIM[k];const v=Math.round((+cfg[k]||lo)/st)*st;cfg[k]=Math.max(lo,Math.min(hi,v));}
 if(TY.poly)cfg.D=cfg.W;
 if(!TY.covers.includes(cfg.cover))cfg.cover=TY.covers[0];
 const [a0,a1]=TY.angR,cm=COVERS[cfg.cover].min;let a=Math.round(+cfg.ang);if(!(a>=a0&&a<=a1)||(cfg.angType&&cfg.angType!==cfg.type))a=TY.ang;
 cfg.ang=Math.max(Math.max(a0,cm),Math.min(a1,a));cfg.angType=cfg.type;
 if(!RAILS[cfg.rail])cfg.rail='750';
 if(!['floor','legs'].includes(cfg.base))cfg.base='floor';
 if(!FNDS[cfg.fnd])cfg.fnd='pillar';if(!HOLDS[cfg.hold])cfg.hold='anchor';if(!SOILS[cfg.soil])cfg.soil='loam';cfg.blocks=Math.max(1,Math.min(2,Math.round(+cfg.blocks)||1));
 if(cfg.fnd==='gas'){cfg.base='floor';cfg.hold='anchor';}   // блок должен стоять над землёй, над ним только поднятый пол; веса в блоке нет
 if(cfg.mat==='timber'&&cfg.fnd!=='pillar')cfg.base='floor';   // обвязка из бруса не ложится в щебень: она над землёй, под поднятым полом
 if(!['euro','prof','wood'].includes(cfg.fill))cfg.fill='euro';
 if(!TRUCKS[cfg.truck])cfg.truck='g42';
 if(!['lemana','base'].includes(cfg.metal))cfg.metal='lemana';
 if(!DECKS[cfg.deck])cfg.deck='pine';
 if(!MATS[cfg.mat])cfg.mat='steel';
 if(!WOODS[cfg.wood])cfg.wood='glulam';
 cfg.snow=String(cfg.snow);if(!SNOW_[cfg.snow])cfg.snow='3';
 cfg.wind=String(cfg.wind);if(!WIND_[cfg.wind])cfg.wind='1';
 if(!['0','pvc','net','both'].includes(cfg.win))cfg.win='0';if(!['0','belt','led'].includes(cfg.light))cfg.light='0';
 return cfg;
}
/* ---------------- общий набор деталей и узлов (для всех типов) ---------------- */
function mkCtx(cfg){
 const fnd=!!cfg&&cfg.fnd!=='pillar',FN=[];
 const parts=[],screws=[],C={selfDrill:0,clip:0,sc8:0,wood6:0,conn5:0,conn6:0},MODS={};let uid=0;
 const push=p=>{p.id=++uid;p.holes=p.holes||[];if(!p.module)p.module='loose';parts.push(p);return p;};
 const mod=(k,n)=>{MODS[k]=n;return k;};
 /* ---- примитивы ---- */
 function frame(a,b,up){const z=norm(sub(b,a));let y=sub(up,mul(z,dot(up,z)));y=norm(y);return{x:cross(y,z),y,z,L:len(sub(b,a))};}
 function lp(p,pl){const q=sub(pl.p,p.o);return{n:[dot(pl.n,p.ax),dot(pl.n,p.ay),dot(pl.n,p.az)],p:[dot(q,p.ax),dot(q,p.ay),dot(q,p.az)]};}
 function tube(o){
  const f=frame(o.a,o.b,o.up),s=SEC[o.sec];
  const p=push({kind:'tube',round:!!s.round,saddle:o.saddle||null,name:o.name,role:o.role,sec:o.sec,o:o.a,ax:f.x,ay:f.y,az:f.z,L:f.L,sx:o.sx,sy:o.sy,t:s.t,r:s.r,layer:o.layer||'frame',step:o.step,caps:o.caps||[false,false],mat:'steel',cat:s.stock,ends:o.ends||['торец А','торец Б'],module:o.module||'loose',note:o.note||''});
  p.cutA=o.cutA?lp(p,o.cutA):null;p.cutB=o.cutB?lp(p,o.cutB):null;
  const cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[i*p.sx/2,j*p.sy/2]);
  const zA=cs.map(([x,y])=>cutZ(p.cutA,x,y,0)),zB=cs.map(([x,y])=>cutZ(p.cutB,x,y,p.L));
  p.zA0=Math.min(...zA);p.zA1=Math.max(...zA);p.zB0=Math.min(...zB);p.zB1=Math.max(...zB);
  p.cutLen=p.zB1-p.zA0;
  const ang=c=>c?Math.round(Math.acos(Math.min(1,Math.abs(c.n[2])/len(c.n)))/RAD):0;
  p.angA=ang(p.cutA);p.angB=ang(p.cutB);
  return p;
 }
 function angle(o){const w=norm(cross(o.u,o.v));return push({kind:'angle',mount:o.mount,mountLen:o.mountLen,name:o.name,role:o.role,o:o.o,ax:o.u,ay:o.v,az:w,L:o.L,A:o.A||40,B:o.B||40,t:o.t||4,layer:o.layer||'hw',step:o.step,mat:o.mat||'steel',cat:o.cat||'ang40',trim:!!o.trim,tk:o.tk,s0:o.s0,module:o.module||'loose'});}
 function box(o){return push(Object.assign({kind:'box',layer:'hw',mat:'galv',module:'loose'},o,{az:o.az||norm(cross(o.ax,o.ay))}));}
 function hole(part,q,dir,d,bid){
  const rel=sub(q,part.o||part.c);
  if(part.kind==='tube'&&part.round){part.holes.push({s:dot(rel,part.az),face:'R',ang:Math.round(Math.atan2(dot(dir,part.ay),dot(dir,part.ax))/RAD),off:0,d,bolt:bid});return;}
  if(part.kind==='tube'){const s=dot(rel,part.az);
   if(Math.abs(dot(dir,part.ax))>0.85)part.holes.push({s,face:'X',off:dot(rel,part.ay),d,bolt:bid});
   else if(Math.abs(dot(dir,part.ay))>0.85)part.holes.push({s,face:'Y',off:dot(rel,part.ax),d,bolt:bid});}
  else if(part.kind==='box')part.holes.push({x:dot(rel,part.ax),y:dot(rel,part.ay),d,bolt:bid});
 }
 function bolt(o){
  const B=BOLT[o.d];const need=o.grip+2*B.wt+B.nh+2.5;const L=BOLT_STD[o.d].find(x=>x>=need)||Math.ceil(need/10)*10;
  const dir=norm(o.dir);
  const p=push({kind:'bolt',d:o.d,L,p:o.p,dir,grip:o.grip,name:`Болт M${o.d}×${L}`,role:'bolt',layer:'hw',step:o.step,mat:'galv',joint:o.joint||'',cat:'bolt',module:'site'});
  const mid=add(o.p,mul(dir,o.grip/2));
  for(const t of o.thru)hole(t,mid,dir,B.hole,p.id);
  p.thru=o.thru.map(t=>t.id);
  return p;
 }
 function weld(a,b,name,step,module){const L=len(sub(b,a));if(L<3)return null;return push({kind:'weld',a,b,len:L,name:name||'Сварной шов',role:'weld',layer:'weld',step,mat:'weld',cat:'electrode',module:module||'loose'});}
 // шов по контуру примыкания: контур a×b, u — вдоль a, v — вдоль b, c — центр
 function ringWeld(c,u,v,a,b,name,step,md){const e=1.8;for(const s of [-1,1]){weld(add(add(c,mul(v,s*(b/2+e))),mul(u,-a/2-e)),add(add(c,mul(v,s*(b/2+e))),mul(u,a/2+e)),name,step,md);weld(add(add(c,mul(u,s*(a/2+e))),mul(v,-b/2)),add(add(c,mul(u,s*(a/2+e))),mul(v,b/2)),name,step,md);}}
 // вварной язык 6 мм: входит в пропил ответной трубы, держит её на одном болте
 function tongue(o){
  const t=box({name:o.name,role:'tongue',c:o.c,ax:o.ax,ay:o.ay,w:o.w||50,h:o.h||40,t:o.t||6,mat:'steel',cat:'plate6',step:o.step,module:o.md,layer:'frame'});
  const ra=o.rootAx||o.ay,hh=(o.rootLen||o.h||40)/2;
  for(const s of [-1,1])weld(add(add(o.root,mul(t.az,s*4.8)),mul(ra,-hh)),add(add(o.root,mul(t.az,s*4.8)),mul(ra,hh)),'Шов языка',o.step,o.md);
  return t;
 }
 const PB=new Map();
 function pbAdd(post,ai,pt,part,lo,hi,step,joint,d){
  const oi=ai===0?2:0,key=`${post.id}|${ai}|${Math.round(pt[1])}|${Math.round(pt[oi])}`;
  let e=PB.get(key);if(!e){e={post,ai,pt,items:[],step,joint,d};PB.set(key,e);}
  e.items.push({part,lo,hi});
 }
 function pbFinish(){
  for(const e of PB.values()){
   const p0=e.post,half=Math.abs(p0.ax[e.ai])>0.9?p0.sx/2:p0.sy/2,cp=p0.o[e.ai];
   const items=e.items.concat([{part:p0,lo:cp-half,hi:cp+half}]).sort((a,b)=>a.lo-b.lo);
   const lo=items[0].lo,hi=Math.max(...items.map(i=>i.hi)),p=e.pt.slice();p[e.ai]=lo;const dir=[0,0,0];dir[e.ai]=1;
   bolt({d:e.d,p,dir,grip:hi-lo,thru:items.map(i=>i.part),step:e.step,joint:e.joint});
  }
 }
 function pillar(x,z,o){
  const dy=o.y0||0,nd={x,z,kind:!o.name?'post':/балку/.test(o.name)?'floor':'newel',a:o.a,st:[]};if(fnd||o.fw)FN.push(nd);
  if(fnd){if(o.fw)return;   // без фундамента вместо столба — узел рамы, шпильки приварены к его столику
   for(const s of o.studs)nd.st.push(push({kind:'stud',name:`Шпилька M12×${Math.round(s[2]-44)}, приварена к столику`,role:'stud',a:[s[0],44,s[1]],b:[s[0],s[2],s[1]],nuts:s[3].filter(y=>y>44),washers:s[4].filter(w=>w[0]>44),layer:'hw',step:'ring',mat:'galv',cat:'stud12'}));return;}
  push({kind:'cyl',name:'Подушка: песок/ПГС 150 мм, трамбовка',role:'sand',c:[x,-1350+dy,z],r:150,h:150,mat:'sand',layer:'found',step:'found',cat:'sand'});
  push({kind:'cyl',name:o.name||'Столб Ø200, пескобетон М300, низ −1200',role:'pillar',c:[x,-1200+dy,z],r:100,h:(o.top||45)+1200-dy,mat:'concrete',layer:'found',step:'found',cat:'concrete'});
  if(o.bell)push({kind:'cyl',name:'Уширение столба Ø400×200 (бур ТИСЭ с расширителем): держит отрыв и снижает давление на грунт',role:'bell',c:[x,-1200+dy,z],r:200,h:200,mat:'concrete',layer:'found',step:'found',cat:'concrete'});
  for(const dz of [-55,55])push({kind:'cyl',name:'Арматура А500С Ø10, L=1150',role:'rebar',c:[x,-1160+dy,z+dz],r:5,h:1150,mat:'rebar',layer:'found',step:'found',cat:'rebar'});
  for(const s of o.studs)push({kind:'stud',name:'Анкерная шпилька M12×300 (заделка 260)',role:'stud',a:[s[0],-214,s[1]],b:[s[0],s[2],s[1]],nuts:s[3],washers:s[4],layer:'hw',step:'found',mat:'galv',cat:'stud12'});
 }

 // открытые торцы — приварные заглушки 2 мм, обварены по контуру
 function capAll(){
  for(const p of parts.filter(q=>q.kind==='tube'))[0,1].forEach(e=>{
   if(!p.caps[e])return;
   const cut=e?p.cutB:p.cutA;
   if(p.round){const c=add(p.o,mul(p.az,e?p.L:0));box({name:`Заглушка приварная 3 мм (Ø${p.sx})`,role:'capPlate',round:true,parent:p.id,mount:p.mount,mountLen:p.mountLen,seq:p.seq,c:add(c,mul(p.az,(e?1:-1)*1.6)),ax:p.ax,ay:p.ay,az:p.az,w:p.sx,h:p.sy,t:3,mat:'steel',layer:p.layer,step:p.step,module:p.module,cat:'plate'});return;}
   const cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>{const x=i*p.sx/2,y=j*p.sy/2,z=cutZ(cut,x,y,e?p.L:0);return add(p.o,add(add(mul(p.ax,x),mul(p.ay,y)),mul(p.az,z)));});
   const c=mul(cs.reduce((s,q)=>add(s,q),[0,0,0]),0.25),ex=sub(cs[1],cs[0]),ey=sub(cs[3],cs[0]),out=mul(p.az,e?1:-1);
   let az=norm(cross(ex,ey));if(dot(az,out)<0)az=mul(az,-1);
   box({name:`Заглушка приварная 2 мм (${p.sec.replace('x2','').replace('x','×')})`,role:'capPlate',c:add(c,mul(az,1.1)),ax:norm(ex),ay:norm(ey),az,w:len(ex),h:len(ey),t:2,mat:'steel',layer:p.layer,step:p.step,module:p.module,cat:'plate',parent:p.id,mount:p.mount,mountLen:p.mountLen,seq:p.seq});
   for(let k=0;k<4;k++){const wd=weld(add(cs[k],mul(az,0.4)),add(cs[(k+1)%4],mul(az,0.4)),'Шов заглушки по контуру',p.step,p.module);if(wd)wd.parent=p.id;}
  });
 }
 return{parts,screws,C,MODS,push,mod,tube,angle,box,hole,bolt,weld,ringWeld,tongue,pbAdd,pbFinish,pillar,capAll,fnd,FN};
}


/* ---------------- построение ----------------
   Схема: стойки с опорными пластинами → сварные оголовки порталов (ригель, подкосы, у «Классики» — ферма целиком)
   садятся на стойки через вварную вставку-шип; боковые рамы (ригель + 2 подкоса + торцевые пластины) опускаются сверху
   к граням оголовков и стягиваются сквозными болтами. Всё сварное — дома, на участке только болты.
   Порядок работ — STEPS: каркас на наживлённых болтах → выверка и протяжка → кровля → пол → борта. */
const SHEET={
 c20:{p:'C20',W:1150,E:1100,L:2000,lap:200,nm:'Профнастил С20 0,45',mat:'roof',f0:36,fp:137.5,fh:0.6},
 tile:{p:'TILE',W:1180,E:1100,L:2250,lap:250,nm:'Металлочерепица',mat:'roof',f0:183,fp:183,fh:1},
 ondulin:{p:'OND',W:950,E:855,L:1950,lap:170,nm:'Ондулин',mat:'roof',f0:47,fp:95,fh:37},
 falc:{p:'FALC',W:375,E:340,L:7000,lap:0,nm:'Кликфальц',mat:'roof',hidden:true,f0:0,fp:340,fh:0},
 pcm:{p:'PCM',W:1050,E:960,L:2000,lap:200,nm:'Поликарбонат монолитный профилированный',mat:'pc',f0:36,fp:137.5,fh:0.6}};
// сборка с проверкой: если узел или элемент не проходит и есть понятное лечение — усиливаем и собираем заново
function ladder(cfg){
 let m=build0(cfg),v=verify(m);
 for(let g=0;g<20;g++){const cur=cfg.$||{},add={};let ang=null;
  for(const k in v.fixes){const nv=v.fixes[k];if(k==='ang'){if(nv>cfg.ang)ang=nv;}else if(k==='pcStep'||k==='purStep'){if(nv>=150&&(!cur[k]||nv<cur[k]))add[k]=nv;}else if(k==='nP'){if(!cur.nP||nv>cur.nP)add[k]=nv;}else if(cur[k]!==nv)add[k]=nv;}
  if(!Object.keys(add).length&&ang==null)break;
  cfg=Object.assign({},cfg,{$:Object.assign({},cur,add)},ang!=null?{ang,angType:cfg.type}:{});m=build0(cfg);v=verify(m);}
 m.verify=v;m.fixes=cfg.$||{};return m;
}
function build(cfgIn){
 const cfg=sanitize(Object.assign({},cfgIn,{$:undefined}));let m=finish(ladder(cfg));
 /* брус: «стойки 150×150» лестница берёт первой, но обычно дешевле добавить портал — ветер делится на большее число рам.
    Пробуем 1–3 лишних портала на брусе 100×100 и оставляем вариант дешевле; оба проходят расчёт */
 if(m.fixes.wPost&&!TYPES[cfg.type].poly&&cfg.mat!=='steel'){const base=Object.assign({},m.fixes);delete base.wPost;let best=m,bt=bom(m).total;
  const maxNP=Math.max(3,Math.floor((cfg.D-60)/650)+1);
  for(let nP=m.nP+1;nP<=Math.min(maxNP,m.nP+3);nP++){const a=finish(ladder(Object.assign({},cfg,{$:Object.assign({},base,{nP:Math.max(nP,base.nP||0)})})));
   if(a.fixes.wPost||!a.verify.ok)continue;const t=bom(a).total;if(t<bt-1){best=a;bt=t;}break;}
  m=best;}
 return m;
}
function build0(cfgIn){
 const cfg=sanitize(cfgIn);if(TYPES[cfg.type].poly)return buildPoly(cfg);
 const $=cfg.$||{},PSEC=$.post||'60x60x2',PT=PSEC.split('x')[2],SPG=$.spigot||'50x50x2';
 const TY=TYPES[cfg.type],gable=cfg.type==='gable',cov=cfg.cover,TR=TRUCKS[cfg.truck];
 const WD=cfg.mat!=='steel',TM=WD,WS=WOODS[cfg.wood],CAP=8,PURH=$.wPur==='e150'?150:$.wPur==='e100'?100:50,DP=WD?PURH-40:0; // WD — деревянная крыша; TM — и стойки из бруса; DP — обрешётка из бруса выше стальной: плоскость покрытия поднимается на DP
 const W=cfg.W,D=cfg.D,H=cfg.H,isFloor=cfg.base==='floor',FW=cfg.mat==='timber'&&isFloor,DT=cfg.deck==='wpc'?25:28,F=isFloor?230+DT:0; // FW — обвязка и пол тоже из бруса; DT — толщина доски настила (ДПК 25, дерево 28), лаги — по 230
 const RH=RAILS[cfg.rail].h,hasDoor=RH.front>0;
 const PG=cfg.type==='pergola';   // пергола: ригели горизонтальные, скат назад (порталы ступенями), кровельные щиты вдоль ската
 // оголовок портала должен лечь в кузов: укорачиваем подкосы, делим пополам на фланцах, в крайнем случае снижаем уклон
 let ovh=300,ovhL=cfg.type==='mono'?350:400,ovhR=cfg.type==='mono'?200:400;const ovhZ=gable?150:cfg.type==='mono'?200:300;
 // ригель «Модерна» и перголы работает на изгиб: сечение — по пролёту между подкосами, шагу порталов и снегу района
 const nP0=Math.max(cfg.$&&cfg.$.nP||0,3,Math.ceil((D-60)/1600)+1),sP0=(D-60)/(nP0-1),Sg0=SNOW_[cfg.snow],L45n=Math.round(Math.min(500,Math.max(360,W*0.15)));
 const bPw=$.wPost||100,BM_=WD?{sec:`w${bPw}x${bPw}`,b:bPw,h:bPw}:gable?(W>3200?BEAMS[1]:BEAMS[0]):(()=>{const q=(Sg0*1.4+GROOF[cfg.cover]*1.2)*sP0/1000,qn=(Sg0+GROOF[cfg.cover])*sP0/1000,Lb=W-2*(60+L45n),Lb_=W-2*(60+300),cL=400+60+L45n,M=Math.max(q*Lb_*Lb_/8,q*cL*cL/2);return pickSec(BEAMS,M,qn,Lb_,200);})(); // подкосы могут укоротиться до 300 мм при укладке в кузов — считаем по худшему
 const hb0=BM_.h;let span=gable?W+2*ovh:W+ovhL+ovhR;
 const headFit=(ang,l45,sp)=>{const t=Math.tan(ang*RAD),c=Math.cos(ang*RAD),base=l45+170+150+45,
   whole=gable?[[span+4,W/2*t+60/c+base]]:PG?[[span+4,hb0+base+45]]:[[span+4,span*t+hb0/c+base],[span/c+24,base*c+hb0+70]],half=gable?[[W/2+ovh+10,whole[0][1]]]:PG?[[span/2+10,whole[0][1]]]:[[span/2+10,span/2*t+hb0/c+base],[span/2/c+24,base*c+hb0+70]];
   const ok=d=>{const q=d.slice().sort((a,b)=>b-a);return q[0]<=TR.L-40&&q[1]<=TR.W-30;};return(sp?half:whole).some(ok);};
 let L45=Math.round(Math.min(500,Math.max(360,W*0.15))),split=false;
 if(!WD)for(;;){if(headFit(cfg.ang,L45,false))break;if(L45>300){L45=Math.max(300,L45-20);continue;}if(headFit(cfg.ang,L45,true)){split=true;break;}if(cfg.ang<=TY.angR[0])break;cfg.ang--;L45=Math.round(Math.min(500,Math.max(360,W*0.15)));}
 if(!WD&&!split&&!headFit(cfg.ang,L45,false))split=true;
 // свесы — под материал кровли, а не «как получится»: скат ложится в один лист (или целые листы + короткий добор из общих листов),
 // полоса поликарбоната — кратно длине листа; при равной цене берём свес ближе к обычному. Оголовок обязан по-прежнему лечь в кузов
 const zSpan=D+2*ovhZ+50,ZP0=[...Array(nP0)].map((_,i)=>D/2-30-i*sP0);
 const pcJoints=(a0,a1)=>{const j=[a0];let a=a0;while(a1-a>2100){const cand=ZP0.filter(z=>z>a+300&&z-a<=2100);const zc=cand.length?Math.max(...cand):a+2100;j.push(zc);a=zc;}j.push(a1);return j;};
 const coverCost=(sL,span_,slopes,widths)=>{
  if(cov==='falc')return 0;
  if(cov==='pc')return cut2D(widths.map(w=>({w,h:sL})),PC_STOCK(),{kerf:2}).cost;
  const S=cov==='shingle'?{L:2500,lap:0,W:1250,E:1250}:SHEET[cov],cols=Math.ceil((span_-(S.W-S.E))/S.E),pcs=[];
  for(let k=0;k<cols*slopes;k++)for(const l of sheetColumn(sL,S))pcs.push({len:cov==='tile'?tileLen(l):l});
  return cut1D(pcs,[{L:S.L,pr:CAT[cov==='shingle'?'osb12':cov].pr}],0).cost;};
 {const o0=[ovh,ovhL,ovhR],c=Math.cos(cfg.ang*RAD);
  if(gable)ovh=fitParam(200,420,10,300,o=>coverCost((W/2+o-20)/c+50,zSpan,2));
  else if(cfg.type==='mono'){const jw=pcJoints(-(D/2+ovhZ),D/2+ovhZ),wd=jw.slice(1).map((z,i)=>z-jw[i]);
   const s=fitParam(420,750,10,550,s=>coverCost((W+s)/c+(cov==='pc'?40:60),zSpan,1,wd));ovhL=Math.max(250,Math.min(450,s-200));ovhR=s-ovhL;}
  span=gable?W+2*ovh:W+ovhL+ovhR;
  if(!WD&&!headFit(cfg.ang,L45,split)){[ovh,ovhL,ovhR]=o0;span=gable?W+2*ovh:W+ovhL+ovhR;}}
 const Lw=Math.round(Math.min(650,Math.max(450,W*0.2)));   // вынос подкоса из бруса
 const be=cfg.ang*RAD,cb=Math.cos(be),sb=Math.sin(be),tb=Math.tan(be);
 const hb=BM_.h,bw=BM_.b,beamSec=BM_.sec,beamTxt=BM_.sec.replace(/x/g,'×').replace(/×(\d)$/,'×$1');
 const XP=W/2-30,nP=Math.max($.nP||0,3,Math.ceil((D-60)/1600)+1),sP=(D-60)/(nP-1),nl=nP-1;
 const ZP=[...Array(nP)].map((_,i)=>D/2-30-i*sP);
 const PN=i=>i===0?'фасад':i===nl?'зад':nP>3?`середина ${i}`:'середина';
 const SN=sx=>sx<0?'лев.':'прав.';
 const E=W>=2800?900:800;
 const slope=gable||PG?0:tb;
 const yB=(x,i=nl)=>F+H+(gable?0:PG?(ZP[i]-ZP[nl])*tb:(x+W/2)*tb+(WD?bPw:0)); // низ ригеля портала: у «Модерна» — наклонный (выше справа), у перголы — ступенями (передний выше)
 const ySide={'-1':gable?F+H:yB(-W/2),'1':gable?F+H:yB(W/2-40)}; // верх бокового ригеля
 const Yj=F+H-L45-170;                                          // стык «стойка — оголовок», одинаковый у всех стоек
 const YJ=i=>PG?yB(0,i)-L45-170:Yj;                             // у перголы перепад уклона берут стойки, оголовки одинаковые и низкие
 const beamBot=gable?{n:[0,1,0],p:[0,F+H,0]}:{n:[-sb,cb,0],p:[0,yB(0),0]};
 const flatB=gable||PG,nB=flatB?[0,1,0]:[-sb,cb,0],uB=flatB?[1,0,0]:[cb,sb,0],sbx=flatB?0:sb,cbx=flatB?1:cb,tbx=flatB?0:tb;
 const botOf=i=>PG?{n:[0,1,0],p:[0,yB(0,i),0]}:beamBot;

 const X=mkCtx(cfg),{parts,screws,C,MODS,push,mod,tube,angle,box,bolt,weld,ringWeld,tongue,pbAdd,pbFinish,pillar}=X;
 const fast=(type,p,n,st)=>screws.push({type,p,n,st});
 const bP=WD?($.wPost||100):0,yS=FW?222:isFloor?F+60:200,sillB=FW?Math.max(bP,$.wSill||0):0,FY=FW&&!X.fnd?230-sillB-152:0;   // брус стойки и верх стальной ножки (над настилом: торец бруса вне зоны брызг); у FW — опора врезана в обвязку, FY — земля ниже столбов
 const postTop=(x,i)=>TM?yS:YJ(i);

 /* ---- 1. фундамент и стойки ---- */
 const POST={},FT={};
 // жёсткая база (сильный ветер): пластина 10 мм, гайка и шайба под ней ниже на 4 мм
 const BT=$.base==='fixed16'?16:$.base==='fixed'?10:6,studs4=(x,z)=>[[-45,-45],[45,-45],[-45,45],[45,45]].map(([a,b])=>[x+a,z+b,86,[-205,49-(BT-6),71],[[-195,3],[59-(BT-6),3],[68,3]]]);
 ZP.forEach((z,i)=>{for(const sx of [-1,1]){
  const x=sx*XP,md=mod(`post${i}${sx<0?'L':'R'}`,`Стойка: ${PN(i)}, ${SN(sx)}`);
  if(FW){POST[`${i}${sx}`]={o:[x,0,z],module:md,id:-1};pillar(x,z,{fw:1,y0:FY,top:228-sillB,bell:$.bell,studs:[[x,z,224,[-205,206],[[-195,3],[203,3]]]]});continue;}   // стойка стоит на обвязке, столб несёт башмак
  pillar(x,z,{studs:studs4(x,z),bell:$.bell});
  const post=tube({name:`${TM?'Ножка':'Стойка'} 60×60×${PT} (${PN(i)}, ${SN(sx)})`,role:'post',sec:PSEC,a:[x,68,z],b:[x,postTop(x,i),z],up:[0,0,1],sx:60,sy:60,step:'posts',ends:['низ',WD?'верх':'верх (стык)'],module:md});
  post.holes.push({s:40,face:'Y',off:0,d:6,single:true,note:'дренаж Ø6, одна стенка'});
  const bp=box({name:`Опорная пластина 140×140×${BT}`,role:'basePlate',c:[x,68-BT/2,z],ax:[1,0,0],ay:[0,0,1],w:140,h:140,t:BT,mat:'steel',step:'posts',cat:'plate6',module:md,layer:'frame'});
  for(const [a,b] of [[-45,-45],[45,-45],[-45,45],[45,45]])bp.holes.push({x:a,y:b,d:14});
  ringWeld([x,68,z],[1,0,0],[0,0,1],60,60,'Шов стойка — опорная пластина','posts',md);
  if(isFloor){const xf=sx*(W/2-60);FT[`${i}${sx}`]=tongue({name:'Язык балки пола 50×40×6 (вварен в стойку)',c:[xf-sx*25,160,z],ax:[1,0,0],ay:[0,1,0],root:[xf,160,z],md,step:'posts'});}
  POST[`${i}${sx}`]=post;
 }});
 if(!X.fnd&&!FW)for(const p of Object.values(POST))box({name:'Подливка под опорную пластину (пескобетон)',role:'grout',c:[p.o[0],53.5-(BT-6)/2,p.o[2]],ax:[1,0,0],ay:[0,1,0],w:160,h:17-(BT-6),t:160,mat:'grout',layer:'found',step:'brace',cat:'concrete'});

 /* ---- 2. оголовки порталов: оголовки стоек + ригель + подкосы (+ ферма), всё на сварке ---- */
 const WPOST={};
 const HMD={},STUB={};      // ключ модуля по (портал, сторона)
 const RHT=WD?150:60,ybR=x=>(WD?F+H+hb-30:F+H)+(W/2-Math.abs(x))*tb,ycR=x=>ybR(x)+RHT/2/cb,ytR=x=>ybR(x)+(RHT+DP)/cb;   // стропило «Классики»: у дерева — врубка 30 мм в затяжку; ytR — плоскость под покрытие
 const P_=(x,i)=>[x,yB(x,i),0],CB=(x,i)=>add(P_(x+sbx*hb/2,i),mul(nB,hb/2)),TB=(x,i)=>add(P_(x+sbx*hb,i),mul(nB,hb)); // ось и верх ригеля над вертикалью x
 const xa=-(W/2+ovhL),xb=W/2+ovhR;
 // ряды обрешётки (вдоль ската), общие для всех порталов
 const PST=WD?(L,S,c,g)=>woodPurStep(L,S,c,g,WS,$.wPur):purlinStep;
 let rows=[],E2s={},Lr=0;const rIn=cfg.type==='pergola'?150:20; // у перголы ригели выступают за край кровли
 if(gable){const base=cov==='tile'?350:Math.min(COVERS[cov].step,PST(sP,SNOW_[cfg.snow],cb,GROOF[cov]),$.purStep||1e9,cov==='pc'?($.pcStep||1e9):1e9),Ls=(W/2+ovh-20)/cb,last=Ls-(WD?75:34);Lr=Ls;   // у дерева последний ряд стоит на стропиле, а не над бабкой
 
  if(cov==='tile'){rows=[20];while(rows[rows.length-1]+base<last)rows.push(rows[rows.length-1]+base);if(last-rows[rows.length-1]<120)rows.pop();if(WD&&last-rows[rows.length-1]>base)rows.push((last+rows[rows.length-1])/2);rows.push(last);} // шаг = шагу волны черепицы
  else{const n=Math.ceil((last-20)/base)+1;rows=[...Array(n)].map((_,j)=>20+j*(last-20)/(n-1));}}
 else{Lr=(xb-xa)/cb;const mx=Math.min(COVERS[cov].step,PST(sP,SNOW_[cfg.snow],cb,GROOF[cov]),$.purStep||1e9,cov==='pc'?($.pcStep||1e9):1e9),n=Math.ceil((Lr-2*rIn)/(split?mx-75:mx))+1;rows=[...Array(n)].map((_,j)=>rIn+j*(Lr-2*rIn)/(n-1)); // у фланцевого стыка ряд сдвигается на ~70 мм — шаг с запасом
  if(split)rows=rows.map(s=>{const x=xa+s*cb;return Math.abs(x)<70?s+(x<0?-1:1)*(70-Math.abs(x))/cb:s;});}
 // пергола: кровельные щиты (2 стропила + поперечины заподлицо) вдоль ската; стыки листов — над сдвоенными стропилами
 const PGR=PG?(()=>{const Wr=W+300,k=Math.ceil(Wr/1050),wp=Wr/k,RX=[],rw2=WD?25:20;for(let j=0;j<k;j++)RX.push(-Wr/2+j*wp+rw2,-Wr/2+(j+1)*wp-rw2);
  const pw=[];for(let x=-Wr/2;x<Wr/2-1;x+=2*wp)pw.push(Math.min(2*wp,Wr/2-x));   // полосы ПК: по два щита, стык — над сдвоенными стропилами
  const ov=fitParam(100,400,10,330,o=>coverCost((D-60+2*o)/cb+80,Wr,1,pw));
  const zBk=ZP[nl]-ov,zFr=ZP[0]+ov,lim=Math.min(2950*cb,(TR.L-120)*cb),segs=[];let a=zBk;
  while(zFr-a>lim){const cand=ZP.filter(z=>z>a+300&&z-a<=lim);const zc=Math.max(...cand);segs.push([a,zc]);a=zc;}segs.push([a,zFr]);
  return{Wr,k,wp,RX,zBk,zFr,ov,segs,yR:z=>F+H+hb+(z-ZP[nl])*tb+20*tb+0.5};})():null;
 const cleat=(heel,ax,nrm,md)=>{const w=norm(cross(ax,nrm)),o=sub(heel,mul(w,20));
  angle({name:'Упор обрешётки 40×40×4, L=40 (вварен)',role:'cleatW',o,u:ax,v:nrm,L:40,A:40,B:40,t:4,mat:'steel',cat:'ang40',step:'heads',layer:'roofframe',module:md});
  for(const k of [-1.8,41.8])weld(add(o,mul(ax,k)),add(add(o,mul(ax,k)),mul(w,40)),'Шов упора обрешётки','heads',md);C.selfDrill+=2;
  for(const ww of [12,28])fast('tek',add(add(add(o,mul(ax,4.2)),mul(nrm,24)),mul(w,ww)),ax,'purlins');};
 if(WD)woodRect({cfg,X,F,H,W,ZP,XP,nl,PN,SN,yB,CB,TB,nB,uB,hb,bw,beamSec,xa,xb,gable,PG,cb,sb,tb,POST,CAP,TM,FW,bP,yS,Lw,ovh,ybR,ycR,ytR,RHT,DP,E2s,slope,WPOST,sP,TR,PSEC,SPG,wBr:$.wBr,heelS:$.heelS||(W>3200?6:4),zBolt:!!$.zBolt});
 else ZP.forEach((z,i)=>{
  const nm=gable?'Портал с фермой':'Оголовок портала';
  if(split)for(const sx of [-1,1])HMD[`${i}${sx}`]=mod(`head${i}${sx<0?'L':'R'}`,`${nm}: ${PN(i)}, ${sx<0?'левая':'правая'} половина`);
  else{const k=mod(`head${i}`,`${nm}: ${PN(i)}`);HMD[`${i}-1`]=HMD[`${i}1`]=k;}
  const zz=v=>[v[0],v[1],z];
  for(const sx of [-1,1]){
   const md=HMD[`${i}${sx}`],x=sx*XP,xf=sx*(W/2-60);
   STUB[`${i}${sx}`]=tube({name:`Оголовок стойки 60×60×${PT} (${PN(i)}, ${SN(sx)})`,role:'stub',sec:PSEC,a:[x,YJ(i),z],b:[x,yB(x,i),z],up:[0,0,1],sx:60,sy:60,cutB:flatB?null:beamBot,step:'heads',ends:['низ (стык)','верх'],module:md});
   ringWeld([x,yB(x,i),z],uB,[0,0,1],flatB?60:60/cb,bw,'Шов оголовок — ригель','heads',md);
   const spg=tube({name:`Вставка-шип ${SPG.replace(/x/g,'×')}, L=300 (вварена в оголовок)`,role:'spigot',sec:SPG,a:[x,YJ(i)-150,z],b:[x,YJ(i)+150,z],up:[0,0,1],sx:50,sy:50,step:'heads',ends:['низ','верх'],module:md,note:'подогнать до плотной посадки: по 2 полосы 2,5 мм на смежные грани'});
   for(const s of [-1,1])for(const yy of [YJ(i)+60,YJ(i)+115])weld([x-5,yy,z+s*31.8],[x+5,yy,z+s*31.8],'Пробочный шов вставки Ø10','heads',md);
   bolt({d:10,p:[x,YJ(i)-75,z-30],dir:[0,0,1],grip:60,thru:[POST[`${i}${sx}`],spg],step:'heads',joint:'оголовок — стойка (вставка-шип)'});
   // подкос портала: рез «на ус» с двух концов, обварен по контуру
   const yF=(PG?yB(0,i):ySide[sx])-L45,tt=(yB(xf,i)-yF)/(1+sx*slope),A0=[xf,yF,z],B0=[xf-sx*tt,yF+tt,z],dir=norm([-sx,1,0]);
   tube({name:'Подкос портала 40×40 (рез «на ус», на сварке)',role:'brace',sec:'40x40x2',a:add(A0,mul(dir,-60)),b:add(B0,mul(dir,60)),up:[0,0,1],sx:40,sy:40,cutA:{n:[1,0,0],p:[xf,0,0]},cutB:botOf(i),step:'heads',ends:['низ','верх'],module:md});
   ringWeld(A0,[0,1,0],[0,0,1],40/Math.abs(dir[0]),40,'Шов подкос — оголовок стойки','heads',md);
   ringWeld(B0,uB,[0,0,1],40/Math.abs(dot(dir,nB)),40,'Шов подкос — ригель','heads',md);
  }
  if(gable){
   const rafPl=sx=>({n:[sx*sb,cb,0],p:[sx*W/2,F+H,0]}),x0=split?6:20,Tb=F+H+hb;
   const heelW=sx=>ringWeld([sx*(W/2-(hb/2)/tb),F+H+hb/2,z],[sx*cb,-sb,0],[0,0,1],hb/sb,40,'Шов затяжка — стропило (пята)','heads',HMD[`${i}${sx}`]);
   if(split){
    for(const sx of [-1,1]){const md=HMD[`${i}${sx}`];
     tube({name:`Ригель-затяжка ${beamTxt} (половина)`,role:'portalBeam',sec:beamSec,a:[sx*W/2,F+H+hb/2,z],b:[sx*6,F+H+hb/2,z],up:[0,1,0],sx:40,sy:hb,cutA:rafPl(sx),step:'heads',ends:['пята','фланец'],module:md});heelW(sx);}
   }else{
    const bm=tube({name:`Ригель-затяжка портала ${beamTxt}`,role:'portalBeam',sec:beamSec,a:[-W/2,F+H+hb/2,z],b:[W/2,F+H+hb/2,z],up:[0,1,0],sx:40,sy:hb,cutA:rafPl(-1),cutB:rafPl(1),step:'heads',ends:['лев. пята','прав. пята'],module:HMD[`${i}1`]});
    for(const sx of [-1,1])heelW(sx);
    if(bm.cutLen>3000.5){const xs=W*0.18;bm.splice=xs+W/2;ringWeld([xs,F+H+hb/2,z],[0,1,0],[0,0,1],hb,40,'Стык ригеля на сварке (с подкладкой)','heads',HMD[`${i}1`]);}
   }
   for(const sx of [-1,1]){const md=HMD[`${i}${sx}`];
    tube({name:`Стропило фермы ${sx<0?'левое':'правое'} 60×40`,role:'rafter',sec:'60x40x2',a:[sx*x0,ycR(x0),z],b:[sx*(W/2+ovh),ycR(W/2+ovh),z],up:[sx*sb,cb,0],sx:40,sy:60,cutA:{n:[1,0,0],p:[sx*x0,0,0]},cutB:{n:[1,0,0],p:[sx*(W/2+ovh),0,0]},caps:[false,true],step:'heads',layer:'roofframe',ends:['конёк','свес'],module:md});
   }
   if(!split){const md=HMD[`${i}1`];
    tube({name:'Бабка фермы 40×40',role:'kingPost',sec:'40x40x2',a:[0,Tb,z],b:[0,ytR(20),z],up:[0,0,1],sx:40,sy:40,caps:[false,true],step:'heads',layer:'roofframe',ends:['низ','верх'],module:md});
    ringWeld([0,Tb,z],[1,0,0],[0,0,1],40,40,'Шов бабка — затяжка','heads',md);
    for(const sx of [-1,1])ringWeld([sx*20,ycR(20),z],[0,1,0],[0,0,1],60/cb,40,'Шов стропило — бабка','heads',md);
   }else{
    const fl=(yc,h,nm,jn)=>{const pl={};for(const sx of [-1,1]){pl[sx]=box({name:nm,role:'flange',c:[sx*3,yc,z],ax:[0,0,1],ay:[0,1,0],w:100,h,t:6,mat:'steel',cat:'plate6',step:'heads',module:HMD[`${i}${sx}`],layer:'roofframe'});}
     for(const dz of [-35,35])bolt({d:10,p:[-6,yc,z+dz],dir:[1,0,0],grip:12,thru:[pl[-1],pl[1]],step:'heads',joint:jn});};
    const hr=Math.round(60/cb+24);
    fl(ycR(6),hr,`Фланец конька 100×${hr}×6`,'фланец конька — стыковка половин');
    fl(F+H+hb/2,hb,`Фланец затяжки 100×${hb}×6`,'фланец затяжки — стыковка половин');
    for(const sx of [-1,1]){ringWeld([sx*6,ycR(6),z],[0,1,0],[0,0,1],60/cb,40,'Шов стропило — фланец','heads',HMD[`${i}${sx}`]);ringWeld([sx*6,F+H+hb/2,z],[0,1,0],[0,0,1],hb,40,'Шов затяжка — фланец','heads',HMD[`${i}${sx}`]);}
   }
   for(const sx of [-1,1]){
    const md=HMD[`${i}${sx}`],x1=sx*0.45*W/2,B0=[x1,ybR(x1),z];let A0,cutA;
    if(!split){let ay=Tb+30;for(let k=0;k<4;k++){const d=norm(sub(B0,[sx*20,ay,z]));ay=Tb+20/Math.abs(d[0])+4;}A0=[sx*20,ay,z];cutA={n:[1,0,0],p:[sx*20,0,0]};}
    else{A0=[sx*90,Tb,z];cutA={n:[0,1,0],p:[0,Tb,0]};}
    const d=norm(sub(B0,A0)),nr=[sx*sb,cb,0];
    tube({name:'Раскос фермы 40×40 (на сварке)',role:'strut',sec:'40x40x2',a:add(A0,mul(d,-60)),b:add(B0,mul(d,60)),up:[0,0,1],sx:40,sy:40,cutA,cutB:{n:nr,p:B0},step:'heads',layer:'roofframe',ends:['низ','верх'],module:md});
    if(!split)ringWeld(A0,[0,1,0],[0,0,1],40/Math.abs(d[0]),40,'Шов раскос — бабка','heads',md);
    else ringWeld(A0,[1,0,0],[0,0,1],40/Math.abs(d[1]),40,'Шов раскос — затяжка','heads',md);
    ringWeld(B0,[-sx*cb,sb,0],[0,0,1],40/Math.abs(dot(d,nr)),40,'Шов раскос — стропило','heads',md);
    // упоры обрешётки
    const E2=[sx*(W/2+ovh),ytR(W/2+ovh),z],u=[-sx*cb,sb,0];E2s[sx]=E2;
    rows.forEach((s,ri)=>{const down=ri>0;cleat(add(E2,mul(u,down?s-10:s+10)),down?mul(u,-1):u,nr,md);});
   }
  }else{
   const mk=(x1,x2,md,nm,ends,caps)=>tube({name:nm,role:'portalBeam',sec:beamSec,a:zz(CB(x1,i)),b:zz(CB(x2,i)),up:nB,sx:bw,sy:hb,cutA:{n:[1,0,0],p:[x1,0,0]},cutB:{n:[1,0,0],p:[x2,0,0]},caps,step:'heads',ends,module:md});
   if(!split){const bm=mk(xa,xb,HMD[`${i}1`],`Ригель портала ${beamTxt} (${PG?'горизонтальный':'наклонный'}, с выносами)`,PG?['лев. вынос','прав. вынос']:['низ ската','верх ската'],[true,true]);
    if(bm.cutLen>3000.5){const xs=W*0.18;bm.splice=(xs-xa)/cbx;ringWeld(zz(CB(xs,i)),nB,[0,0,1],hb,bw,'Стык ригеля на сварке (с подкладкой)','heads',HMD[`${i}1`]);}}
   else{
    mk(xa,-6,HMD[`${i}-1`],`Ригель портала ${beamTxt} (левая половина)`,['вынос','фланец'],[true,false]);
    mk(6,xb,HMD[`${i}1`],`Ригель портала ${beamTxt} (правая половина)`,['фланец','вынос'],[false,true]);
    const yc=CB(0,i)[1],h=Math.round(hb/cbx),pl={};
    const hf=PG?h-6:h,yf=PG?yc-3:yc;
    for(const sx of [-1,1]){pl[sx]=box({name:`Фланец ригеля 100×${hf}×6`,role:'flange',c:[sx*3,yf,z],ax:[0,0,1],ay:[0,1,0],w:100,h:hf,t:6,mat:'steel',cat:'plate6',step:'heads',module:HMD[`${i}${sx}`],layer:'frame'});
     ringWeld([sx*6,yc+sx*6*tbx,z],[0,1,0],[0,0,1],hb/cbx,bw,'Шов ригель — фланец','heads',HMD[`${i}${sx}`]);}
    for(const dz of [-35,35])bolt({d:10,p:[-6,yc,z+dz],dir:[1,0,0],grip:12,thru:[pl[-1],pl[1]],step:'heads',joint:'фланец ригеля — стыковка половин'});
   }
   if(PG){ // упоры щитов: у внутренней грани каждого стропила, на верху ригеля
    const yT=yB(0,i)+hb;PGR.RX.forEach((rx,q)=>{const u=q%2?-1:1,md=HMD[`${i}${rx<0?-1:1}`],o=[rx+u*20,yT,z-20*u];
     angle({name:'Упор кровельного щита 40×40×4, L=40 (вварен в ригель)',role:'cleatW',o,u:[u,0,0],v:[0,1,0],L:40,A:40,B:40,t:4,mat:'steel',cat:'ang40',step:'heads',layer:'roofframe',module:md});
     for(const kk of [-1.8,41.8])weld(add(o,[u*kk,0,0]),add(add(o,[u*kk,0,0]),[0,0,40*u]),'Шов упора щита','heads',md);C.selfDrill+=2;
     for(const dz of [-9,9])fast('tek',[rx+u*24.2,yT+22,z+dz],[u,0,0],'purlins');});
   }else{
   const E0=TB(xa);E2s[0]=E0;
   rows.forEach((s,ri)=>{const down=ri>0,heel=zz(add(E0,mul(uB,down?s-10:s+10))),md=HMD[`${i}${heel[0]<0?-1:1}`];cleat(heel,down?mul(uB,-1):uB,nB,md);});
   }
  }
 });

 /* ---- 3. боковые связи: сварная рама «ригель + 2 подкоса» с торцевыми пластинами 6 мм. Рама опускается сверху вплотную к граням
        оголовков и стягивается двумя сквозными болтами M10 через оголовок (в среднем портале — общими для рам с двух сторон).
        Из оголовка ничего не торчит: на пути подкоса при опускании рамы нет выступов (раньше мешал язык ригеля) ---- */
 const EP=6;
 if(!WD)for(const sx of [-1,1])for(let i=0;i<nl;i++){
  const md=mod(`side${sx<0?'L':'R'}${i}`,`Боковая связь: ${sx<0?'левая':'правая'}, пролёт ${i+1}`);
  const xs=sx*(W/2-20),top=ySide[sx],zb=ZP[i+1]+30,zf=ZP[i]-30;
  const ts=PG?(yB(0,i)-yB(0,i+1))/(zf-zb):0,cs=1/Math.hypot(1,ts),ns=[0,cs,-ts*cs],ytop=zv=>PG?yB(0,i+1)+(zv-zb)*ts:top,yax=zv=>ytop(zv)-30/cs;
  const za=zb+EP,zc=zf-EP;
  const beam=tube({name:PG?'Ригель боковой 60×40 (по уклону)':'Ригель боковой 60×40',role:'sideBeam',sec:'60x40x2',a:[xs,yax(za),za],b:[xs,yax(zc),zc],up:PG?ns:[0,1,0],cutA:PG?{n:[0,0,1],p:[0,0,za]}:null,cutB:PG?{n:[0,0,1],p:[0,0,zc]}:null,sx:40,sy:60,step:'sides',ends:['зад','перед'],module:md,note:'торцы — на торцевые пластины рамы, на сварке'});
  for(const [zFace,dz,pi] of [[zb,1,i+1],[zf,-1,i]]){
   const zF=zFace+dz*EP,yTP=PG?yB(0,pi):top;                 // верх ригеля у оголовка — общий для рам с двух сторон портала
   const yBot=zv=>ytop(zv)-60/cs,foot=[xs,yBot(zF)-(L45-60),zF],dB=norm([0,1,dz]),tt=(L45-60)/(1-dz*ts),B0=[xs,foot[1]+tt,zF+dz*tt],botPl={n:PG?ns:[0,1,0],p:[0,yBot(zF),zF]};
   const br=tube({name:'Подкос боковой 40×40 (рез «на ус»)',role:'sideBrace',sec:'40x40x2',a:add(foot,mul(dB,-60)),b:add(B0,mul(dB,60)),up:[1,0,0],sx:40,sy:40,cutA:{n:[0,0,1],p:[0,0,zF]},cutB:botPl,step:'sides',ends:['низ','верх'],module:md,note:'нижний торец — на торцевую пластину, верхний — на ригель, всё на сварке'});
   ringWeld(B0,PG?[0,ts*cs,cs]:[0,0,1],[1,0,0],40/Math.abs(dot(dB,botPl.n)),40,'Шов подкос — боковой ригель','sides',md);
   const yLo=yTP-L45-40,pl=box({name:`Торцевая пластина боковой рамы 60×${Math.round(L45+40)}×6`,role:'endPlate',c:[sx*XP,(yLo+yTP)/2,zFace+dz*EP/2],ax:[1,0,0],ay:[0,1,0],w:60,h:yTP-yLo,t:EP,mat:'steel',cat:'plate6',step:'sides',module:md,layer:'frame'});
   ringWeld([xs,yax(zF),zF],[1,0,0],[0,1,0],40,60/cs,'Шов ригель — торцевая пластина','sides',md);
   ringWeld([xs,foot[1],zF],[1,0,0],[0,1,0],40,40*Math.SQRT2,'Шов подкос — торцевая пластина','sides',md);
   for(const yb of [yTP-90,yTP-L45+75])pbAdd(STUB[`${pi}${sx}`],2,[sx*XP,yb,zFace],pl,Math.min(zFace,zF),Math.max(zFace,zF),'sides','боковая рама — оголовок (сквозной болт через пластины)',10);
  }
 }

 /* ---- 4. кровля ---- */
 let apexY=0,ridgeY=0;const roofQty={sheets:0,sheetLen:[],trimLen:0,ridgeLen:0,eaveLen:0,area:0,pcStrips:[],pcLen:0,pieces:[],osb:[]};
 const cutsZ=(z0,z1)=>{const c=[z0];let a=z0;while(z1-a>3000){const cand=ZP.filter(z=>z>a+200&&z-a<=3000);const zc=Math.max(...cand);c.push(zc);a=zc;}c.push(z1);return c;};
 const purlinRun=(c0,n,ax0)=>{const zA=-(D/2+ovhZ),zB=D/2+ovhZ,cuts=cutsZ(zA,zB);
  if(WD){const {tmb}=woodKit(X,cfg),c1=add(c0,mul(n,20-PURH/2)),pb=PURH===50?100:50,lat=norm(cross(n,[0,0,1]));for(let k=0;k<cuts.length-1;k++){const z0=cuts[k]+(k?1:0),z1=cuts[k+1]-(k<cuts.length-2?1:0);tmb({name:PURH===50?'Обрешётка 50×100 плашмя':`Обрешётка 50×${PURH} на ребро`,role:'purlin',sec:PURH===150?'w50x150':'w50x100',a:add(c1,[0,0,z0]),b:add(c1,[0,0,z1]),up:n,sx:pb,sy:PURH,step:'purlins',layer:'roofframe',ends:['зад','перед']});
    for(const zp of ZP)if(zp>=z0-1&&zp<=z1+1)for(const s of [-1,1]){const q=add(c1,[0,0,Math.min(z1-24,Math.max(z0+24,zp+s*14))]);screws.push(PURH===50?{type:'wp',p:add(add(q,mul(n,PURH/2)),mul(lat,s*26)),n,st:'purlins'}:{type:'wp',p:add(add(q,mul(n,30-PURH/2)),mul(lat,s*25)),n:norm(add(mul(lat,s),mul(n,0.7))),st:'purlins'});C.wood6++;}}return;}   // 2 самореза на опору: плашмя — сверху, на ребро — наискось с боков
  for(let k=0;k<cuts.length-1;k++)tube({name:'Обрешётка 40×20 (на ребро)',role:'purlin',sec:'40x20x2',a:add(c0,[0,0,cuts[k]+(k?1:0)]),b:add(c0,[0,0,cuts[k+1]-(k<cuts.length-2?1:0)]),up:n,sx:20,sy:40,caps:[k===0,k===cuts.length-2],step:'purlins',layer:'roofframe',ends:['зад','перед']});};
 const zA=-(D/2+ovhZ),zB2=D/2+ovhZ,zLen=zB2-zA+50;
 roofQty.sheetW=[];
 const TRIM_H={tile:86,c20:60,ondulin:78,falc:66,pcm:62,shingle:58},TRIM_CAT={tile:'trimTile',c20:'trimC20',falc:'trimC20',ondulin:'wind',pcm:'trimC20',shingle:'wind',pc:'pcEnd'};
 // листовая кровля на прямоугольном скате: крайний лист подрезается по ширине, по длине — ряды с нахлёстом
 function sheetRoof(P,n,u,s0,sL,z0,z1,wAx){
  const S=SHEET[cov],nAcross=Math.ceil((z1-z0-(S.W-S.E))/S.E),col=sheetColumn(sL,S);
  for(let k=0;k<nAcross;k++){const za=z0+k*S.E,w=Math.min(S.W,z1-za);if(w<80)continue;
   for(let r=0,sa=s0;r<col.length;sa+=col[r]-S.lap,r++){const segL=col[r],hh=40+k*0.6+r*1.2;
    push({kind:'sheet',profile:S.p,name:`${S.nm} (лист ${Math.round(w)}×${Math.round(segL)}${w<S.W-1?', подрезан по ширине':''})`,role:'roofSheet',o:P(za,sa,hh),ax:wAx||[0,0,1],ay:n,az:u,W:w,L:segL,mat:S.mat,layer:'roof',step:'roof',cat:cov});
    roofQty.sheets++;roofQty.sheetLen.push(segL);roofQty.sheetW.push(w);roofQty.pieces.push({len:segL,w,col:k,row:r});
    rows.forEach((s,ri)=>{if(s<sa+15||s>sa+segL-15)return;const all=ri===0||ri===rows.length-1;
     if(S.hidden){roofQty.hidden=(roofQty.hidden||0)+1;return;}
     for(let q=0,uu=S.f0;uu<w-8;q++,uu+=S.fp){if(!all&&q%2)continue;screws.push({type:S.mat==='pc'?'pc':'roof',p:P(za+uu,s,hh+S.fh),n});}});
   }}
 }
 if(gable){
  for(const sx of [-1,1]){
   const E2=[sx*(W/2+ovh),ytR(W/2+ovh),0],u=[-sx*cb,sb,0],n=[sx*sb,cb,0];
   const Pg=(zz,s,h)=>add(add(add(E2,[0,0,zz]),mul(u,s)),mul(n,h));
   rows.forEach(s=>purlinRun(add(add(E2,mul(u,s)),mul(n,20)),n));
   const sL=Lr+50;
   if(SHEET[cov])sheetRoof(Pg,n,u,-50,sL,zA-25,zB2+25);
   else{
    box({name:'OSB-3 12 мм (сплошной настил, зазор 3 мм)',role:'osb',c:Pg((zA+zB2)/2,sL/2-50,46),ax:[0,0,1],ay:u,w:zLen,h:sL,t:12,mat:'osb',layer:'roof',step:'roofDeck',cat:'osb12'});
    roofQty.osb.push({span:zLen,sL});
    rows.forEach(s=>{for(let zz=zA+60;zz<zB2-30;zz+=300)fast('osb',Pg(zz,s,51.9),n,'roofDeck');});
    const U=(nm,s0,hh,ww,zc)=>box({name:nm,role:'underlay',c:Pg(zc,s0+hh/2,52.8),ax:[0,0,1],ay:u,w:ww,h:hh,t:1.5,mat:'underlay',layer:'roof',step:'roofUnder',cat:'underlay'});
    U('Подкладочный ковёр — полоса по карнизу 600 мм',-50,600,zLen,(zA+zB2)/2);U('Подкладочный ковёр — полоса у конька 500 мм',sL-550,500,zLen,(zA+zB2)/2);
    for(const zc of [zA-25+200,zB2+25-200])U('Подкладочный ковёр — полоса по фронтону 400 мм',550,sL-1100,400,zc);
    box({name:'Гибкая черепица Shinglas (рядовая, от карниза к коньку)',role:'shingle',c:Pg((zA+zB2)/2,sL/2-48,56.1),ax:[0,0,1],ay:u,w:zLen+10,h:sL+6,t:5,mat:'shingle',layer:'roof',step:'roof',cat:'shingle'});
    const v=mul(n,-1),w=norm(cross(u,v));angle({mount:[sx,0,0],name:'Планка карнизная (капельник) — поверх ковра, гвозди через 120 мм',role:'trim',o:Pg(w[2]>0?zA-25:zB2+25,-50,53.6),u,v,L:zLen,A:60,B:50,t:0.6,mat:'roof',layer:'roof',step:'roofEdge',cat:'drip',trim:true});
    roofQty.area+=zLen*sL/1e6;
   }
   const hh=TRIM_H[cov]+(cov==='shingle'?2:0);
   for(const sz of [-1,1]){const uu=[0,0,-sz],v=mul(n,-1),w=norm(cross(uu,v)),o=Pg(sz>0?zB2+26:zA-26,dot(w,u)>0?-50:sL-50,hh);angle({name:cov==='shingle'?'Планка ветровая (фронтонная) — поверх ковра':'Планка торцевая — поверх листа',role:'trim',o,u:uu,v,L:sL,A:70,B:hh+30,t:0.6,mat:'roof',layer:'roof',step:cov==='shingle'?'roofEdge':'roofTrim',cat:TRIM_CAT[cov],trim:true});
    if(cov!=='shingle')for(let q=150;q<sL-50;q+=450)fast('trim',add(add(o,mul(uu,35)),mul(w,q)),n,'roofTrim');}
   roofQty.trimLen+=2*sL/1000;roofQty.eaveLen+=zLen/1000;
  }
  apexY=ytR(0);
  const rh=TRIM_H[cov]+(cov==='shingle'?2:4),rw=cov==='shingle'?125:200;
  ridgeY=apexY+rh/cb;
  // уплотнитель лежит на гребнях профиля, конёк — на уплотнителе: верх уплотнителя на 1 мм ниже полки конька (rh), иначе он торчит сквозь планку
  if(SHEET[cov]&&cov!=='ondulin')for(const sx of [-1,1]){const n=[sx*sb,cb,0],u=[-sx*cb,sb,0],E2=[sx*(W/2+ovh),ytR(W/2+ovh),0],sL=Lr+50;box({name:'Уплотнитель коньковый (профильный, самоклеящийся)',role:'seal',c:add(add(E2,mul(u,sL-120)),mul(n,Math.min(rh-7,40+{c20:20,tile:30,falc:25,pcm:20}[cov]+6))),ax:[0,0,1],ay:u,w:zLen,h:40,t:12,mat:'seal',layer:'roof',step:'roofTrim',cat:cov==='tile'?'ridgeSeal':'sealC20'});}
  if(cov!=='shingle')for(let zz=zA;zz<zB2;zz+=300)for(const sx of [-1,1])fast('trim',[sx*cb*110,ridgeY-sb*110+1,zz],[sx*sb,cb,0],'roofTrim');
  angle({name:cov==='shingle'?'Коньково-карнизная черепица по коньку':'Конёк плоский — на уплотнитель, саморезы через 300 мм в гребни',role:'trim',o:[0,ridgeY,zB2+30],u:[cb,-sb,0],v:[-cb,-sb,0],L:zLen+10,A:rw,B:rw,t:cov==='shingle'?4:0.6,mat:cov==='shingle'?'shingle':'roof',layer:'roof',step:'roofTrim',cat:{tile:'ridgeTile',c20:'ridgeC20',falc:'ridgeC20',ondulin:'ridgeOnd',shingle:'ridgeSh'}[cov],trim:true});
  roofQty.ridgeLen=(zLen+10)/1000;
 }else if(PG){
  // кровельные щиты вдоль ската: 2 стропила 40×40 + поперечины 40×20 заподлицо сверху и снизу, всё на сварке; щиты лежат на ригелях порталов
  const {Wr,k,wp,RX,zBk,zFr,segs,yR}=PGR,d=[0,sb,cb],n=[0,cb,-sb],PH=WD?100:40,Q0=add([0,yR(zBk),zBk],mul(n,PH-40));   // щит из бруса выше стального: стропило 50×100
  const Pt=(x,s,h)=>add(add(add(Q0,[x,0,0]),mul(d,s)),mul(n,h));
  const stp=cov==='pcm'?Math.min(COVERS.pcm.step,$.purStep||1e9):Math.min(700,$.pcStep||1e9),CR=new Set();
  segs.forEach(([z0,z1],si)=>{
   const eA=si===0,eB=si===segs.length-1,za=z0+(eA?0:1),zb_=z1-(eB?0:1);
   const c0=eA?za+12:za+75,c1=eB?zb_-12:zb_-75,nc=Math.max(2,Math.ceil((c1-c0)/(stp-(ZP.length>2?80:0)))+1); // у порталов поперечины сдвигаются на 75 мм — шаг с запасом
   const CZ=[...Array(nc)].map((_,q)=>c0+q*(c1-c0)/(nc-1)).map(zc=>{for(const zp of ZP)if(Math.abs(zc-zp)<75)return zp+(zc<zp?-75:75);return zc;});
   for(let j=0;j<k;j++){
    const md=mod(`panel${j}_${si}`,`Кровельный щит ${j+1}${segs.length>1?'.'+(si+1):''}`),rl=RX[2*j],rr=RX[2*j+1];
    for(const rx of [rl,rr]){const at=zv=>Pt(rx,(zv-zBk+20*sb)/cb,40-PH/2);
     if(WD){woodKit(X,cfg).tmb({name:'Стропило щита 50×100',role:'panelRafter',sec:'w50x100',a:at(za),b:at(zb_),up:n,cutA:{n:[0,0,1],p:[0,0,za]},cutB:{n:[0,0,1],p:[0,0,zb_]},step:'purlins',layer:'roofframe',ends:['зад','перед'],module:md,notch:parts.filter(p=>p.role==='portalBeam'),note:'на балках — посадочная врубка по уклону'});for(const zp of ZP)if(zp>=Math.min(za,zb_)+30&&zp<=Math.max(za,zb_)-30)for(const q of [-22,22]){screws.push({type:'wp',p:add(at(zp+q),add([(rx===rl?1:-1)*25,0,0],mul(n,30-PH/2))),n:norm(add([rx===rl?1:-1,0,0],mul(n,0.7))),st:'purlins'});C.wood6++;}}
     else tube({name:'Стропило щита 40×40',role:'panelRafter',sec:'40x40x2',a:at(za),b:at(zb_),up:n,sx:40,sy:40,cutA:{n:[0,0,1],p:[0,0,za]},cutB:{n:[0,0,1],p:[0,0,zb_]},caps:[eA,eB],step:'purlins',layer:'roofframe',ends:['зад','перед'],module:md});}
    for(const zc of CZ){const sc=(zc-zBk+20*sb)/cb;CR.add(Math.round(sc));
     if(WD){woodKit(X,cfg).tmb({name:'Поперечина щита 50×50 (заподлицо, на саморезах)',role:'panelBar',sec:'w50x50',a:Pt(rl+25,sc,15),b:Pt(rr-25,sc,15),up:n,step:'purlins',layer:'roofframe',ends:['лев.','прав.'],module:md});C.wood6+=4;}
     else{tube({name:'Поперечина щита 40×20 (заподлицо, на сварке)',role:'panelBar',sec:'40x20x2',a:Pt(rl+20,sc,20),b:Pt(rr-20,sc,20),up:n,sx:20,sy:40,step:'purlins',layer:'roofframe',ends:['лев.','прав.'],module:md});
     for(const xx of [rl+20,rr-20])ringWeld(Pt(xx,sc,20),n,d,40,20,'Шов поперечина — стропило щита','purlins',md);}}
   }
  });
  rows=[...CR].sort((a,b)=>a-b);
  const s0=40*tb-40,sL=(zFr-zBk)/cb+80;
  if(cov==='pc'){
   const J=[];
   for(let x=-Wr/2,q=0;x<Wr/2-1;x+=2*wp,q++){const w=Math.min(2*wp,Wr/2-x),last=x+w>=Wr/2-1;
    push({kind:'sheet',profile:'PC8',name:`Поликарбонат сотовый 8 мм (${Math.round(w)}×${Math.round(sL)})`,role:'roofSheet',o:Pt(x+(q?2:0),s0,40),ax:[1,0,0],ay:n,az:d,W:w-(q?2:0)-(last?0:2),L:sL,mat:'pc',layer:'roof',step:'roof',cat:'pc8'});roofQty.pcStrips.push(w);
    if(q){J.push(x);box({name:'Основание соединительного профиля — на сдвоенные стропила, саморезы через 300 мм',role:'trim',c:Pt(x,s0+sL/2,38.9),ax:[1,0,0],ay:d,w:60,h:sL,t:2,mat:'galv',layer:'roof',step:'roofEdge',cat:'pcConn'});
     for(let sv=s0+150;sv<s0+sL-100;sv+=300)fast('tek',Pt(x,sv,40),n,'roofEdge');
     box({name:'Крышка соединительного профиля (защёлкивается)',role:'trim',c:Pt(x,s0+sL/2,51),ax:[1,0,0],ay:d,w:44,h:sL,t:6,mat:'galv',layer:'roof',step:'roofTrim',cat:'pcConn'});}}
   for(const se of [s0+6,s0+sL-6])box({name:'Профиль торцевой на конец листа (сверху — герметичная лента, снизу — перфорированная)',role:'trim',c:Pt(0,se,44),ax:[1,0,0],ay:d,w:Wr,h:12,t:14,mat:'galv',layer:'roof',step:'roof',cat:'pcEnd'});
   rows.forEach(sr=>{for(let x=-Wr/2+150;x<=Wr/2-149;x+=350){if(J.some(j=>Math.abs(j-x)<60))continue;screws.push({type:'pc',p:Pt(x,sr,48.5),n});}});
   roofQty.pcLen=sL;
  }else sheetRoof((x,sv,h)=>Pt(x,sv,h),n,d,s0,sL,-Wr/2,Wr/2,[1,0,0]);
  for(const sx of [-1,1]){const uu=[-sx,0,0],v=mul(n,-1),w=norm(cross(uu,v)),isPc=true;
   angle({name:cov==='pc'?'Профиль торцевой (бок)':'Планка торцевая',role:'trim',o:Pt(sx*(Wr/2+6),dot(w,d)>0?s0-10:s0+sL-10,cov==='pc'?48.6:60.6),u:uu,v,L:sL,A:26,B:30,t:0.6,mat:'galv',layer:'roof',step:'roofTrim',cat:TRIM_CAT[cov],trim:true});}
  // водосток по заднему (нижнему) свесу
  const be_=Pt(0,s0,40),ra=Pt(0,(20*sb)/cb,20),zE=zBk,yE=ra[1],gP=parts.length;   // ось стропила у заднего торца
  const BX=[...new Set(RX.map((x,q)=>q%2&&q<RX.length-1?null:Math.round(x)).filter(x=>x!=null))];          // по одному кронштейну на торец стропила, у сдвоенных — на левое
  for(const x of BX){box({name:'Кронштейн желоба (к торцу стропила щита, 2 самореза)',role:'trim',c:[x,yE-22,zE-52],ax:[1,0,0],ay:[0,1,0],w:20,h:84,t:104,mat:'galv',layer:'roof',step:'gutter',cat:'gutterSet'});
   for(const dy of [-12,12])fast('tek',[x,yE+dy,zE-2.2],[0,0,-1],'gutter');}
  const gy=yE-64,gz=zE-115;
  angle({name:'Желоб водосточный 125 мм (уклон к трубе 3–5 мм на метр)',role:'trim',o:[Wr/2+20,gy,gz],u:[0,0,1],v:[0,1,0],L:Wr+40,A:115,B:85,t:0.6,mat:'roof',layer:'roof',step:'gutter',cat:'gutter',trim:true});
  push({kind:'cyl',name:'Труба водосточная Ø90 с воронкой и коленом',role:'trim',c:[-(Wr/2)+90,0,gz+60],r:45,h:gy,mat:'roof',layer:'roof',step:'gutter',cat:'downpipe'});
  for(let q=gP;q<parts.length;q++)parts[q].mount=[0,0,-1];   // водосток навешивают сзади
  roofQty.gutter=(Wr+40)/1000;roofQty.trimLen=2*sL/1000;roofQty.eaveLen=2*Wr/1000;
  const top=Pt(0,s0+sL,50);apexY=top[1];ridgeY=top[1];
 }else{
  const E0=E2s[0],n=nB,u=uB,Pm=(zz,s,h)=>add(add(add(E0,[0,0,zz]),mul(u,s)),mul(n,h));
  rows.forEach(s=>purlinRun(add(add(E0,mul(u,s)),mul(n,20)),n));
  const s0r=cfg.type==='pergola'?rIn-40:cov==='pc'?-20:-30,sL=cfg.type==='pergola'?Lr-2*rIn+80:Lr+(cov==='pc'?40:60);
  if(SHEET[cov])sheetRoof(Pm,n,u,s0r,sL,zA-25,zB2+25);
  else{
   // поликарбонат: стыки листов — только над порталами, в соединительном профиле
   const joints=[zA];{let a=zA;while(zB2-a>2100){const cand=ZP.filter(z=>z>a+300&&z-a<=2100);const zc=cand.length?Math.max(...cand):a+2100;joints.push(zc);a=zc;}}joints.push(zB2);
   for(let k=0;k<joints.length-1;k++){const w=joints[k+1]-joints[k]-(k&&k<joints.length-2?0:0);
    push({kind:'sheet',profile:'PC8',name:`Поликарбонат сотовый 8 мм (${Math.round(w)}×${Math.round(sL)})`,role:'roofSheet',o:Pm(joints[k]+(k?2:0),s0r,40),ax:[0,0,1],ay:n,az:u,W:w-(k?2:0)-(k<joints.length-2?2:0),L:sL,mat:'pc',layer:'roof',step:'roof',cat:'pc8'});
    roofQty.pcStrips.push(w);}
   for(let k=1;k<joints.length-1;k++){box({name:'Основание соединительного профиля — над порталом, саморезы в каждую обрешётку',role:'trim',c:Pm(joints[k],s0r+sL/2,38.9),ax:[0,0,1],ay:u,w:60,h:sL,t:2,mat:'galv',layer:'roof',step:'roofEdge',cat:'pcConn'});rows.forEach(sv=>fast('tek',Pm(joints[k],sv,40),n,'roofEdge'));
    box({name:'Крышка соединительного профиля (защёлкивается)',role:'trim',c:Pm(joints[k],s0r+sL/2,51),ax:[0,0,1],ay:u,w:44,h:sL,t:6,mat:'galv',layer:'roof',step:'roofTrim',cat:'pcConn'});}
   for(const se of [s0r+6,s0r+sL-6])box({name:'Профиль торцевой на конец листа (герметичная/перфорированная лента)',role:'trim',c:Pm((zA+zB2)/2,se,44),ax:[0,0,1],ay:u,w:zB2-zA+50,h:12,t:14,mat:'galv',layer:'roof',step:'roof',cat:'pcEnd'});
   rows.forEach(s=>{for(let zz=zA+120;zz<=zB2-119;zz+=330){if(joints.some(j=>Math.abs(j-zz)<60))continue;screws.push({type:'pc',p:Pm(zz,s,48.5),n});}});
   roofQty.pcLen=sL;
  }
  for(const sz of [-1,1]){const uu=[0,0,-sz],v=mul(n,-1),w=norm(cross(uu,v));const isPc=cov==='pc'||cov==='pcm';const o_=Pm(sz>0?zB2+(isPc?6:26):zA-(isPc?6:26),dot(w,u)>0?s0r-10:s0r+sL-10,cov==='pc'?48.6:cov==='pcm'?60.6:TRIM_H[cov]);angle({name:isPc?'Профиль торцевой (бок)':'Планка торцевая',role:'trim',o:o_,u:uu,v,L:sL,A:isPc?26:70,B:isPc?30:90,t:0.6,mat:isPc?'galv':'roof',layer:'roof',step:'roofTrim',cat:TRIM_CAT[cov],trim:true});if(!isPc)for(let q=150;q<sL-50;q+=450)fast('trim',add(add(o_,mul(uu,35)),mul(w,q)),n,'roofTrim');}
  roofQty.trimLen=2*sL/1000;roofQty.eaveLen=2*zLen/1000;
  const top=Pm(0,s0r+sL,60);apexY=top[1];ridgeY=top[1];
 }

 /* ---- 5. пол: балки на языках стоек, лаги поверх, настил ---- */
 const NX=hasDoor?[-(E/2+20),E/2+20]:[];const FB={};let deckInfo=null,FSP=0,WFL=null,JX=[];
 if(isFloor){
  const x0=-(W/2-60),x1=W/2-60,LB=x1-x0,nSup=Math.max(0,Math.ceil(LB/1500)-1);
  const supX=[...Array(nSup)].map((_,j)=>x0+(j+1)*LB/(nSup+1)),spl=LB>3000?[supX[nSup>1?1:0]]:[];
  if(FW){WFL=woodFloorRect(X,cfg,{XP,ZP,W,D,TR,bP,supX,FY,pillar,N:0});JX=WFL.JX;FSP=WFL.span;}else{
  ZP.forEach((z,i)=>{
   // перед со входом: балка из трёх частей, концы — на языках стоек входа (стойка входа — на своём столбике), столики не нужны
   const front=i===0&&NX.length,segs=front?[[x0,NX[0]-21],[NX[0]+21,NX[1]-21],[NX[1]+21,x1]]:[x0,...spl,x1].slice(0,-1).map((c,k,a)=>[c+(k?1:0),(k<a.length-1?a[k+1]-1:x1)]),pcs=[];
   FSP=Math.max(FSP,front?Math.max(...segs.map(([ca,cb])=>cb-ca)):LB/(nSup+1)); // пролёт между опорами: у передней балки со входом — между стойками и стойками входа
   for(const [ca,cb] of segs)pcs.push(tube({name:`Балка пола 60×40 (${PN(i)})`,role:'floorBeam',sec:'60x40x2',a:[ca,160,z],b:[cb,160,z],up:[0,1,0],sx:40,sy:60,step:'bottom',layer:'floor',ends:['лев.','прав.'],note:'у стоек — пропил 7×60 мм в нижней стенке под язык'}));
   FB[i]=pcs;
   for(const sx of [-1,1])bolt({d:8,p:[sx*(W/2-85),160,z-20],dir:[0,0,1],grip:40,thru:[sx<0?pcs[0]:pcs[pcs.length-1],FT[`${i}${sx}`]],step:'bottom',joint:'балка пола — стойка (язык в пропил)'});
   for(const x of front?[]:supX){pillar(x,z,{name:'Столбик под балку пола Ø200',studs:[[x,z,124,[-205,109],[[-195,3]]]]});box({name:'Опорный столик 100×100×4 с приварной гайкой M12',role:'support',c:[x,128,z],ax:[1,0,0],ay:[0,0,1],w:100,h:100,t:4,step:'bottom',cat:'plate6',mat:'steel',layer:'floor'});C.selfDrill+=2;for(const dx of [-30,30])fast('tek',[x+dx,125.8,z],[0,-1,0],'bottom');}
  });
  const nj=Math.ceil((W-160)/(cfg.deck==='wpc'?400:500))+1; // ДПК — лаги не реже 400 мм
  JX=[...Array(nj)].map((_,j)=>-(W/2-80)+j*(W-160)/(nj-1));
  JX=JX.map(x=>{for(const xn of NX)if(Math.abs(x-xn)<62)return xn+(x<xn?-62:62);return x;});
  for(let i=0;i<nl;i++){const z0=ZP[i+1]+(i+1===nl?-20:1),z1=ZP[i]+(i===0?20:-1);
   for(const x of JX)tube({name:'Лага пола 40×40',role:'joist',sec:'40x40x2',a:[x,210,z0],b:[x,210,z1],up:[0,1,0],sx:40,sy:40,caps:[i+1===nl,i===0],step:'bottom',layer:'floor',ends:['зад','перед']});} // наружные торцы — с заглушкой, стыки над балками — встык
  const clipBad=(x,s)=>Math.abs(x+s*40)>W/2-80||NX.some(xn=>Math.abs(x+s*40-xn)<62);
  ZP.forEach(z=>{for(const x of JX){let s=x>1?-1:1;if(clipBad(x,s))s=-s;
   angle({name:'Уголок крепёжный 40×40×40×2 (лага — балка)',role:'cleatJoist',o:[x+s*20,190,z-20*s],u:[s,0,0],v:[0,1,0],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});C.clip+=4;
   for(const dz of [-10,10]){fast('clip',[x+s*42,192.2,z+dz],[0,1,0],'bottom');fast('clip',[x+s*22.2,214,z+dz],[s,0,0],'bottom');}}});}
  const ho=FW?bP/2+6:33,hn=FW?56:23,obst=Object.values(POST).map(p=>({x0:p.o[0]-ho,x1:p.o[0]+ho,z0:p.o[2]-ho,z1:p.o[2]+ho}));
  for(const xn of NX)obst.push({x0:xn-hn,x1:xn+hn,z0:ZP[0]-hn,z1:ZP[0]+hn});
  let nb=Math.ceil((D+5)/145),exc=nb*145-5-D;if(exc/2>60){nb--;exc=nb*145-5-D;}
  // лишнее — распускаем крайние доски; недостача (exc<0) — настил по центру, кромки не доходят до края на ≤13 мм
  const ws=[...Array(nb)].map((_,i)=>(i===0||i===nb-1)&&exc>0?140-exc/2:140);
  let mid=JX.map((x,j)=>[Math.abs(x),j]).sort((a,b)=>a[0]-b[0]).slice(0,2).map(q=>JX[q[1]]).sort((a,b)=>a-b);
  // широкий пол — две доски в ряд, стыки на лагах вразбежку (через ряд — на другой лаге); какие две лаги — по раскрою досок 3 м
  if(W>3000){const pr=CAT[DECKS[cfg.deck].cat].pr,cand=JX.filter(x=>Math.abs(x)<W/2-300);let bc=Infinity;
   for(const xa of cand)for(const xb of cand){if(xb<=xa||xa+W/2>3000||W/2-xb>3000||W/2-xa>3000||xb+W/2>3000)continue;
    const pcs=[];for(let i=0;i<nb;i++){const x=i%2?xb:xa;pcs.push({len:Math.round(x+W/2-1.5)},{len:Math.round(W/2-x-1.5)});}
    const c=cut1D(pcs,[{L:3000,pr}],4).cost+(Math.abs(xa)+Math.abs(xb))*1e-3;if(c<bc){bc=c;mid=[xa,xb];}}}
  let z=-D/2+Math.max(0,-exc)/2;const pieces=[];
  ws.forEach((w,i)=>{const z0=z,z1=z+w;z=z1+5;
   const segs=W>3000?[[-W/2,mid[i%2]-1.5],[mid[i%2]+1.5,W/2]]:[[-W/2,W/2]];
   segs.forEach(([a,b])=>{const L=Math.round(b-a);pieces.push(L);
    push({kind:'poly',name:`Доска настила №${i+1}: ${DT}×${Math.round(w)}×${L}${w<140?' (распустить)':''}`,role:'deck',pts:notchPoly(a,b,z0,z1,obst),y0:230,h:DT,mat:DECKS[cfg.deck].mat,layer:'floor',step:'deck',cat:DECKS[cfg.deck].cat,w,L,tint:((i*37)%7)/7});});
   if(cfg.deck!=='wpc')for(const x of JX)for(const dz of [-1,1])screws.push({type:'deck',p:[x,F+0.5,(z0+z1)/2+dz*(w/2-25)],n:[0,1,0]}); // ДПК — на скрытых кляймерах, сверху крепежа не видно
  });
  deckInfo={n:nb,pieces};
 }else box({name:'Пол: геотекстиль + щебень 20–40, слой 70 мм',role:'gravel',c:[0,-5,0],ax:[1,0,0],ay:[0,1,0],w:W-10,h:70,t:D-10,mat:'gravel',layer:'floor',step:'deck',cat:'gravel'});

 // брус стойки шире ножки: балки и доски заводят сбоку под нависающий брус, сверху они только садятся на место
 if(TM)for(const p of parts)if(['bottom','deck'].includes(p.step)&&!p.mount){p.mount=[0,1,0];p.mountLen=p.step==='deck'?50:70;}

 /* ---- 6. борта: сварные секции; у стоек — стяжные болты, у входа — своя стойка 40×40 ---- */
 const Bb=isFloor?F+60:150,bays=[];
 // брус: секции — из бруса на тех же стяжных болтах, к стойкам из бруса; грань стойки дальше от оси, у входа — стойка 100×100 над стальной ножкой
 const PST_=TM?WPOST:POST,pf=TM?30+bP/2:60,ph=TM?bP/2:30,nh=TM?50:20;
 if(RH.back)bays.push({k:'back',n:'задний',axis:'x',pc:ZP[nl],out:-1,f:-(W/2-pf),t:W/2-pf,H:RH.back,ends:[PST_[`${nl}-1`],PST_[`${nl}1`]]});
 if(hasDoor){bays.push({k:'frontL',n:'передний левый',axis:'x',pc:ZP[0],out:1,f:-(W/2-pf),t:-(E/2+20+nh),H:RH.front,ends:[PST_['0-1'],null],newel:NX[0]});
  bays.push({k:'frontR',n:'передний правый',axis:'x',pc:ZP[0],out:1,f:E/2+20+nh,t:W/2-pf,H:RH.front,ends:[null,PST_['01']],newel:NX[1]});}
 {const bk=bays.find(b=>b.k==='back');if(bk&&bk.t-bk.f>Math.min(2950,TR.L-120)){bays.splice(bays.indexOf(bk),1);
  bays.push(Object.assign({},bk,{k:'backL',n:'задний левый',t:0,ends:[bk.ends[0],'mid']}),Object.assign({},bk,{k:'backR',n:'задний правый',f:0,ends:['mid',bk.ends[1]]}));}}
 for(const [sx,key,nm] of [[-1,'left','левый'],[1,'right','правый']])if(RH[key])for(let i=0;i<nl;i++)bays.push({k:`${key}${i}`,n:`${nm} ${i+1}`,axis:'z',pc:sx*XP,out:sx,f:ZP[i+1]+ph,t:ZP[i]-ph,H:RH[key],ends:[PST_[`${i+1}${sx}`],PST_[`${i}${sx}`]]});
 const fillInfo=[],MIDS={},TK=TM?woodKit(X,cfg):null,ST=TM?25:10,CG=TM?3:0,clampY=(y,az)=>TM?Math.max(y,yS+CAP+(az?228:120)):y;   // выше болтов ножки, друг с другом не встречаются
 const stile=(o)=>TM?TK.tmb(Object.assign({},o,{sec:'w50x50',sx:50,sy:50,name:o.name.replace('40×20','50×50')})):tube(o);
 for(const r of bays){const pN=parts.length;
  const A=r.axis==='x'?[1,0,0]:[0,0,1],Pp=r.axis==='x'?[0,0,1]:[1,0,0],ai=r.axis==='x'?0:2;
  const pt=(al,y,pe)=>add(add(mul(A,al),[0,y,0]),mul(Pp,pe));
  const top=F+r.H,md=mod('rail_'+r.k,`Секция борта: ${r.n}`),st='railframe',inner=[0,0];
  for(const e of [0,1]){
   const fc=e?r.t:r.f,sg=e?-1:1;
   if(r.ends[e]==='mid'){ // стык двух половин секции: стойки 40×20 вплотную, 2 стяжных болта
    const c0=fc+sg*(ST+0.5),stl=stile({name:`Стойка секции 40×20 (борт ${r.n}, у стыка)`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
    (MIDS[r.pc]=MIDS[r.pc]||[]).push(stl);inner[e]=fc+sg*(2*ST+1);
    if(MIDS[r.pc].length===2)for(const y of [Bb+85,top-95])bolt({d:8,p:pt(-(2*ST+1),y,r.pc),dir:A,grip:4*ST+2,thru:MIDS[r.pc],step:st,joint:'стык половин задней секции'});
   }else if(r.ends[e]){
    const c0=fc+sg*(ST+CG);
    const stl=stile({name:`Стойка секции 40×20 (борт ${r.n})`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
    for(const y of (r.axis==='x'?[Bb+85,top-95]:[Bb+115,top-65]))pbAdd(r.ends[e],ai,pt(c0,clampY(y,r.axis==='z'),r.pc),stl,Math.min(fc,fc+sg*(2*ST+CG)),Math.max(fc,fc+sg*(2*ST+CG)),'railframe','секция борта — стойка портала (стяжной болт)',8);
    inner[e]=fc+sg*(2*ST+CG);
   }else{
    // стойка входа — мини-стойка на своём столбике, ставится после выверки каркаса: пластина 120×120×8 на 2 шпильках M12 поперёк борта
    // держит момент от нажима на поручень; с полом — ещё 2 вварных языка под переднюю балку пола (она разрезана у стоек входа),
    // ставится первой в шаге «Каркас пола», на ножках — перед своей секцией. Секция прижимается к ней стойкой 40×20 на два стяжных болта
    const xn=r.newel,nst=isFloor?'bottom':'railframe',nmd=mod('newel_'+r.k,`Стойка входа: ${r.n}`),nq=parts.length;
    if(FW){const nw=newelOnSill(X,TK,{xn,z:r.pc,top,bP,nst,nmd,A,name:r.n,pt,ax:Pp});for(let q=nq;q<parts.length;q++)if(parts[q].module===nmd||parts[q].role==='postW')parts[q].seq=-1;
     const c0=xn+sg*(nh+ST+CG),stl=stile({name:`Стойка секции 40×20 (борт ${r.n}, у входа)`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
     for(const y of [Bb+85,top-95])pbAdd(nw,ai,pt(c0,clampY(y),r.pc),stl,Math.min(xn+sg*nh,xn+sg*(nh+2*ST+CG)),Math.max(xn+sg*nh,xn+sg*(nh+2*ST+CG)),'railframe','секция борта — стойка входа (стяжной болт)',8);
     inner[e]=xn+sg*(nh+2*ST+CG);continue;}
    pillar(xn,ZP[0],{name:'Столбик под стойку входа Ø200',studs:[-40,40].map(dz=>[xn,ZP[0]+dz,86,[-205,47,71],[[-195,3],[57,3],[68,3]]])}); // как у стоек с пластиной 8 мм
    const nw0=tube({name:`${TM?'Ножка стойки входа':'Стойка входа'} 40×40 (${r.n})`,role:'newel',sec:'40x40x2',a:pt(xn,68,r.pc),b:pt(xn,TM?yS:top,r.pc),up:A,sx:40,sy:40,caps:[false,!TM],step:nst,layer:'rail',module:nmd,ends:['низ','верх']});
    let nw=nw0;
    if(TM){TK.postBase({x:xn,z:r.pc,y:yS+CAP,u:[1,0,0],n:[0,0,1],b:100,step:nst,md:nmd,layer:'rail'});
     nw=TK.tmb({name:`Стойка входа из бруса 100×100 (${r.n})`,role:'postW',sec:'w100x100',a:pt(xn,yS+CAP,r.pc),b:pt(xn,top,r.pc),up:[0,0,1],step:nst,layer:'rail',ends:['низ','верх'],note:'верхний торец — под срез с уклоном или колпачок'});nw.seq=-1;}
    const pl=box({name:'Опорная пластина стойки входа 120×120×8',role:'newelPlate',c:pt(xn,64,r.pc),ax:[1,0,0],ay:[0,0,1],w:120,h:120,t:8,mat:'steel',cat:'plate6',step:nst,module:nmd,layer:'rail'});
    for(const dz of [-40,40])pl.holes.push({x:0,y:dz,d:14});
    ringWeld(pt(xn,68,r.pc),[1,0,0],[0,0,1],40,40,'Шов стойка входа — пластина',nst,nmd);
    if(!X.fnd)box({name:'Подливка под опорную пластину (пескобетон)',role:'grout',c:[xn,52.5,ZP[0]],ax:[1,0,0],ay:[0,1,0],w:130,h:15,t:130,mat:'grout',layer:'found',step:nst,cat:'concrete'});
    if(isFloor)for(const s2 of [-1,1]){const tg=tongue({name:'Язык балки пола 50×40×6 (вварен в стойку входа)',c:[xn+s2*45,160,ZP[0]],ax:[1,0,0],ay:[0,1,0],root:[xn+s2*20,160,ZP[0]],md:nmd,step:nst});
     const fb=FB[0].find(p=>Math.min(p.o[0],p.o[0]+p.az[0]*p.L)<=xn+s2*45&&Math.max(p.o[0],p.o[0]+p.az[0]*p.L)>=xn+s2*45);
     bolt({d:8,p:[xn+s2*45,160,ZP[0]-20],dir:[0,0,1],grip:40,thru:[fb,tg],step:'bottom',joint:'балка пола — стойка входа (язык в пропил)'});}
    for(let q=nq;q<parts.length;q++)if(parts[q].module===nmd)parts[q].seq=-1; // в своём шаге — раньше балок и секции
    const c0=xn+sg*(nh+ST+CG),stl=stile({name:`Стойка секции 40×20 (борт ${r.n}, у входа)`,role:'stile',sec:'40x20x2',a:pt(c0,Bb,r.pc),b:pt(c0,top,r.pc),up:A,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});
    for(const y of [Bb+85,top-95])pbAdd(nw,ai,pt(c0,clampY(y),r.pc),stl,Math.min(xn+sg*nh,xn+sg*(nh+2*ST+CG)),Math.max(xn+sg*nh,xn+sg*(nh+2*ST+CG)),'railframe','секция борта — стойка входа (стяжной болт)',8);
    inner[e]=xn+sg*(nh+2*ST+CG);
   }
  }
  const rails=TM?[{sec:'w50x100',w:100,h:50,yc:top-25,name:'Поручень 50×100',role:'railTop'},{sec:'w50x50',w:50,h:50,yc:Bb+25,name:'Нижний брус 50×50',role:'railBot'}]:[{sec:'40x40x2',h:40,yc:top-20,name:'Поручень 40×40',role:'railTop'},{sec:'40x20x2',h:20,yc:Bb+10,name:'Нижний брус 40×20',role:'railBot'}];
  if(top-Bb>700)rails.push(TM?{sec:'w50x50',w:50,h:50,yc:Math.round((top+Bb)/2),name:'Средний брус 50×50',role:'railMid'}:{sec:'40x20x2',h:20,yc:Math.round((top+Bb)/2),name:'Средний брус 40×20',role:'railMid'});
  const railY=rails.map(x=>x.yc);
  for(const rl of rails){
   if(TM){TK.tmb({name:`${rl.name} (борт ${r.n})`,role:rl.role,sec:rl.sec,a:pt(inner[0],rl.yc,r.pc),b:pt(inner[1],rl.yc,r.pc),up:[0,1,0],sx:rl.w,sy:rl.h,step:st,layer:'rail',module:md});C.sc8+=2;continue;}
   tube({name:`${rl.name} (борт ${r.n})`,role:rl.role,sec:rl.sec,a:pt(inner[0],rl.yc,r.pc),b:pt(inner[1],rl.yc,r.pc),up:[0,1,0],sx:40,sy:rl.h,step:st,layer:'rail',module:md});
   for(const e of [0,1])ringWeld(pt(inner[e],rl.yc,r.pc),[0,1,0],Pp,rl.h,40,'Шов брус — стойка секции',st,md);
  }
  const runLen=r.t-r.f,h=top-Bb,outF=r.pc+r.out*(TM?25:20),ay=mul(Pp,r.out);
  const fi={run:r.k,n:r.n,len:runLen,h,pieces:0};
  if(cfg.fill==='prof'){
   push({kind:'sheet',profile:'C8',name:`Профнастил С8 (борт ${r.n}, ${Math.round(runLen)}×${Math.round(h)})`,role:'fillSheet',o:pt(r.f+(TM?4:0),Bb,outF),ax:A,ay,az:[0,1,0],W:runLen-(TM?8:0),L:h,mat:'fill',layer:'rail',step:'fill',cat:'c8'});
   for(const y of railY)for(let uu=29;uu<runLen;uu+=230)screws.push({type:'fill',p:add(pt(r.f+uu,y,outF),mul(ay,0.6)),n:ay});
  }else{
   const Wd=cfg.fill==='euro'?118:95,gap=cfg.fill==='euro'?47:30;
   const n=Math.max(1,Math.floor((runLen+gap)/(Wd+gap))),tot=n*Wd+(n-1)*gap,st0=r.f+(runLen-tot)/2;
   fi.pieces=n;
   for(let i=0;i<n;i++){
    const a0=st0+i*(Wd+gap);
    if(cfg.fill==='euro')push({kind:'sheet',profile:'EURO',name:`Штакетник 118 × ${Math.round(h)} (борт ${r.n})`,role:'picket',o:pt(a0,Bb,outF),ax:A,ay,az:[0,1,0],W:Wd,L:h,mat:'fill',layer:'rail',step:'fill',cat:'euro'});
    else box({name:`Штакетина 20×95 × ${Math.round(h)} (борт ${r.n})`,role:'plank',c:add(pt(a0+Wd/2,Bb+h/2,outF),mul(ay,10)),ax:A,ay:[0,1,0],w:Wd,h,t:20,mat:'woodFill',layer:'rail',step:'fill',cat:'plank',tint:((i*29)%5)/5});
    for(const y of railY)for(const dx of [-1,1])screws.push({type:cfg.fill==='euro'?'fill':'wood',p:add(pt(a0+Wd/2+dx*(Wd/2-22),y,outF),mul(ay,cfg.fill==='euro'?18.6:20.5)),n:ay});
   }
  }
  fillInfo.push(fi);
  for(let q=pN;q<parts.length;q++)if(['railframe','fill'].includes(parts[q].step)&&!/^newel_/.test(parts[q].module||''))parts[q].mount=mul(Pp,r.out); // секцию и заполнение подносят снаружи; стойку входа — сверху
 }
 pbFinish();

 X.capAll();
 // мебель для масштаба
 const dec=(name,c,w,h,t,mat)=>box({name:name+' — для масштаба, в смету не входит',role:'decor',c,ax:[1,0,0],ay:[0,1,0],w,h,t,mat:mat||'woodFill',layer:'decor',step:'finish',cat:null});
 const tl=Math.min(1800,W-1100),tz=-D*0.06,bz=Math.min(620,(D-900)/2-150);
 if(tl>700&&bz>400){dec('Стол',[0,F+735,tz],tl,30,750);for(const sx of [-1,1])for(const sz of [-1,1])dec('Ножка стола',[sx*(tl/2-80),F+360,tz+sz*300],60,720,60);
  for(const z of [tz-bz,tz+bz]){dec('Скамья',[0,F+445,z],tl,35,320);for(const sx of [-1,1])dec('Ножка скамьи',[sx*(tl/2-100),F+214,z],60,428,260);}}
 const BK=FW?WFL.K:X.fnd?buildBaseRect(X,cfg,{XP,ZP,W,D,TR,isFloor}):null,y0=BK?BK.L.y0:FY,STR=isFloor&&F-y0>300?stairs(X,cfg,{FW,zf:ZP[0]+(FW?sillB/2:20),F,y0,beam:parts.find(p=>['floorBeam','sillX'].includes(p.role)&&Math.abs(p.o[2]-ZP[0])<1&&Math.min(p.o[0],p.o[0]+p.az[0]*p.L)<0&&Math.max(p.o[0],p.o[0]+p.az[0]*p.L)>0)}):null;
 if(STR)deckInfo.pieces.push(...STR.pcs);
 for(let i=0;i<4;i++)dec('Плитка дорожки',[((i%2)?-60:60),y0+(i===0?18:8),D/2+(STR?STR.run+250:0)+400+i*520],620,16,420,'grout');

 const steps=mkSteps(parts,cfg);
 const model={cfg,parts,screws,F,ZP,hb,Bb,RH,isFloor,gable,type:cfg.type,cov,hasDoor,steps,C,fillInfo,W,D,H,nP,sP,MODS,ang:cfg.ang,roofQty,E,split,Yj,L45,
  free:!!X.fnd,base:X.fnd?baseInfo(BK,X,cfg):null,y0,FW,sillB,mat:cfg.mat,wood:cfg.wood,bP,yS,Lw,RHT,heelS:$.heelS||(W>3200?6:4),zBolt:!!$.zBolt,zOff:WD&&PG?(ZP[1]-ZP[nl])*tb-(bP>=150?130:105)-4-bP:0,wPur:$.wPur||'',wBr:!!$.wBr,beam:BM_,truckSpec:TR,deck:deckInfo,rows,Lr,pg:PG?{wp:PGR.wp,k:PGR.k,step:cov==='pcm'?Math.min(COVERS.pcm.step,$.purStep||1e9):Math.min(700,$.pcStep||1e9)}:null,pgOv:PG?PGR.ov:0,ovhL,ovhR,postSec:PSEC,spigotSec:SPG,baseFixed:/^fixed/.test($.base||''),baseT:BT,studs88:!!$.studs88,
  joistStep:isFloor?(W-160)/(Math.ceil((W-160)/(cfg.deck==='wpc'?400:500))):0,floorSpan:isFloor?FSP:0,slopeBack:PG,ovh:gable?ovh:Math.max(ovhL,ovhR),ovhZ,
  dims:{headroom:H,top:Math.max(ridgeY,apexY)+20,apex:apexY,eave:gable?F+H:yB(-W/2),door:E,yLow:F+H,yHigh:gable?F+H:PG?yB(0,0):yB(W/2)}};
 return finalize(model);
}

function mkSteps(parts,cfg){
 const TR=TRUCKS[cfg.truck],gable=cfg.type==='gable';
 const steps=STEPS.filter(s=>s.id==='shop'||s.id==='truck'||(s.id==='brace'&&cfg.fnd!=='pillar')||parts.some(p=>p.step===s.id)).map(s=>Object.assign({},s));
 steps.forEach(s=>{
  const wd=cfg.mat!=='steel';
  if(s.id==='heads')s.t=wd?(gable?'Фермы из бруса':cfg.type==='mono'?'Балки вдоль':'Балки порталов'):gable?'Порталы с фермами':'Оголовки порталов';
  if(s.id==='sides')s.t=TYPES[cfg.type].poly?(wd?'Обвязка из бруса':'Обвязка с подкосами'):wd?(cfg.type==='mono'?'Балки по скату':'Балки вдоль'):'Боковые связи';
  if(s.id==='brace'&&wd)s.t='Выверка, подкосы, протяжка';
  if(s.id==='shop'&&wd)s.t=cfg.mat==='timber'&&cfg.base==='floor'?'Мастерская: заготовка бруса':'Мастерская: брус и сталь';
  if(s.id==='purlins'&&wd&&cfg.type==='pergola')s.t='Кровельные щиты из бруса';
  if(s.id==='posts'&&wd)s.t=cfg.mat==='timber'&&cfg.base==='floor'?'Стойки из бруса':'Ножки и стойки из бруса';
  if(s.id==='purlins'&&cfg.type==='pergola')s.t='Кровельные щиты';
  const cv=cfg.cover,poly=!!TYPES[cfg.type].poly;
  if(s.id==='roofDeck')s.t='Сплошной настил OSB-3';
  if(s.id==='roofEdge')s.t=cv==='pc'?'Основания соединительных профилей':'Карнизные и ветровые планки';
  if(s.id==='roof')s.t={tile:'Листы металлочерепицы',c20:'Листы профнастила',falc:'Панели кликфальца',ondulin:'Листы ондулина',pcm:'Листы монолитного поликарбоната',pc:'Листы поликарбоната с торцевыми профилями',shingle:'Гибкая черепица'}[cv];
  if(s.id==='roofTrim')s.t=cv==='shingle'?(poly?'Коньково-карнизная черепица по рёбрам, навершие':'Коньково-карнизная черепица по коньку'):cv==='pc'?'Крышки профилей и боковые торцы':poly?'Коньковые планки по рёбрам, навершие':cfg.type==='gable'?'Уплотнитель, конёк, торцевые планки':'Торцевые планки';
  if(s.id==='deck')s.t=cfg.base==='floor'?'Настил пола':'Отсыпка пола';
  if(s.id==='found'&&cfg.fnd!=='pillar')s.t=cfg.fnd==='gas'?'Площадка и газоблоки':'Площадка: щебень и плиты';
  if(s.id==='ring'&&cfg.mat==='timber'&&cfg.base==='floor')s.t='Нижняя обвязка из бруса';
  if(s.id==='truck')s.t=`Погрузка: ${TR.t}`;
  s.count=parts.filter(p=>p.step===s.id&&!['bolt','weld'].includes(p.kind)&&!['decor','capPlate'].includes(p.role)).length;
  s.bolts=parts.filter(p=>p.step===s.id&&p.kind==='bolt').length;
  s.welds=parts.filter(p=>p.step===s.id&&p.kind==='weld').length;
 });
 return steps;
}
// для расчёта (лестница усилений) нужны детали и оформление; марки, модули, раскладка в кузове и сводки шагов — только итоговой модели (finish)
function finalize(model){
 dress(model,true);
 model.weldLen=model.parts.filter(p=>p.kind==='weld').reduce((s,p)=>s+p.len,0);
 return model;
}
function finish(model){
 if(model.dress&&model.dress.lite){model.dress=null;dress(model,false);model.verify=verify(model);}   // окна, свет и их крепёж — целиком; расчёт — с итоговыми скобами
 assignMarks(model);
 model.mods=modules(model);
 model.layout=layoutModules(model);
 model.stepInfo=stepInfo(model);
 return model;
}

/* ---------------- многогранная беседка (6 или 8 граней) ----------------
   Круглые стойки Ø76 (с опорной пластиной и вварными языками) → сварные рамы обвязки (ригель + 2 подкоса) на языках →
   рёбра шатра: низ — на язык на торце стойки, верх — на язык центрального узла. Обрешётка — кольцами по граням. */
const rv=f=>[Math.cos(f),0,Math.sin(f)],tv=f=>[-Math.sin(f),0,Math.cos(f)];
function clipHalf(pts,nx,nz,c){const out=[];for(let i=0;i<pts.length;i++){const A=pts[i],B=pts[(i+1)%pts.length],da=nx*A[0]+nz*A[1]-c,db=nx*B[0]+nz*B[1]-c;if(da<=0)out.push(A);if(da*db<0){const t=da/(da-db);out.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]);}}return out;}
const polyArea=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
function buildPoly(cfg){
 const TY=TYPES[cfg.type],N=TY.poly,cov=cfg.cover,TR=TRUCKS[cfg.truck];
 const Dc=cfg.W,H=cfg.H,isFloor=cfg.base==='floor',DT=cfg.deck==='wpc'?25:28,F=isFloor?230+DT:0,RH=RAILS[cfg.rail].h;
 const X=mkCtx(cfg),{parts,screws,C,MODS,push,mod,tube,angle,box,bolt,weld,ringWeld,tongue,pillar}=X;
 const fast=(type,p,n,st)=>screws.push({type,p,n,st});
 const WD=cfg.mat!=='steel',TM=WD,FW=cfg.mat==='timber'&&isFloor,WS=WOODS[cfg.wood],CAP=8,kit=WD?woodKit(X,cfg):null,$w=cfg.$||{},bP=WD?($w.wPost||100):0,yS=FW?222:isFloor?F+60:200,sillB=FW?Math.max(bP,$w.wSill||0):0,FY=FW&&!X.fnd?230-sillB-152:0;
 const pi=Math.PI,hN=pi/N,R=Dc/2-38,a=R*Math.cos(hN),side=2*R*Math.sin(hN);
 // уклон: ребро должно влезть в кузов
 let ovh=350;{const lim=TR.L-90;let ca=Math.cos(cfg.ang*RAD);if((R+ovh)/ca>lim)ovh=Math.max(150,lim*ca-R);while((R+ovh)/Math.cos(cfg.ang*RAD)>lim&&cfg.ang>TY.angR[0])cfg.ang--;}
 const al=cfg.ang*RAD,ca=Math.cos(al),sa=Math.sin(al),ta=Math.tan(al);
 const PHI=k=>pi/2+hN+2*pi*(((k%N)+N)%N)/N,PSI=j=>PHI(j)+hN;
 const V=(k,y=0)=>{const r=rv(PHI(k));return[r[0]*R,y,r[2]*R];};
 const yRb=F+H,yRt=F+H+(WD?bP:60),yH=WD?yRt-30:yRt+3,L45=Math.round(Math.min(450,side/2-170)),Lw=Math.round(Math.min(600,side/2-120));   // у дерева: ребро садится в угол обвязки врубкой 30 мм
 const yb=r=>yH+(R-r)*ta;                                                     // низ ребра на радиусе r
 const FRONT=N-1;
 const POST={},TNG={},WPOST={};

 /* ---- фундамент и стойки ---- */
 for(let k=0;k<N;k++){
  const f=PHI(k),r=rv(f),t=tv(f),P=V(k),md=mod(`post${k}`,`Стойка ${k+1}`);
  if(FW){POST[k]={o:[P[0],0,P[2]],module:md,id:-1};pillar(P[0],P[2],{fw:1,y0:FY,top:228-sillB,a:f,bell:(cfg.$||{}).bell,studs:[[P[0],P[2],224,[-205,206],[[-195,3],[203,3]]]]});continue;}
  pillar(P[0],P[2],{a:f,bell:(cfg.$||{}).bell,studs:[[-45,-45],[45,-45],[-45,45],[45,45]].map(([u,w])=>{const q=add(add(P,mul(r,u)),mul(t,w));return[q[0],q[2],86,[-205,49,71],[[-195,3],[59,3],[68,3]]];})});
  const top={n:norm([r[0]*ta,1,r[2]*ta]),p:[P[0],yH,P[2]]};
  const post=tube({name:`${TM?'Ножка':'Стойка'} круглая Ø76×${(cfg.$||{}).postR==='r76x4'?4:3} (${k+1})`,role:'postR',sec:(cfg.$||{}).postR||'r76x3',a:[P[0],68,P[2]],b:[P[0],TM?yS:WD?yRb-CAP:yH,P[2]],up:r,sx:76,sy:76,cutB:WD?null:top,step:'posts',ends:['низ',WD?'верх':'верх (под ребро)'],module:md});
  post.holes.push({s:40,face:'R',ang:180,off:0,d:6,single:true,note:'дренаж Ø6, одна стенка'});
  const bp=box({name:'Опорная пластина 140×140×6',role:'basePlate',c:[P[0],65,P[2]],ax:r,ay:t,w:140,h:140,t:6,mat:'steel',step:'posts',cat:'plate6',module:md,layer:'frame'});
  for(const [u,w] of [[-45,-45],[45,-45],[-45,45],[45,45]])bp.holes.push({x:u,y:w,d:14});
  for(let q=0;q<12;q++){const a1=q/12*2*pi,a2=(q+1)/12*2*pi;weld([P[0]+40*Math.cos(a1),69.8,P[2]+40*Math.sin(a1)],[P[0]+40*Math.cos(a2),69.8,P[2]+40*Math.sin(a2)],'Шов стойка — опорная пластина','posts',md);}
  // язык под ребро шатра на торце стойки
  const dE=[r[0]*ca,-sa,r[2]*ca],nR=[r[0]*sa,ca,r[2]*sa],tp=[P[0],yH,P[2]];
  if(!WD)TNG[`h${k}`]=tongue({name:'Язык ребра шатра 50×40×6 (вварен в торец стойки)',c:add(tp,mul(nR,22)),ax:dE,ay:nR,w:50,h:40,root:tp,rootAx:dE,rootLen:50,md,step:'posts'});
  POST[k]=post;
 }
 if(!X.fnd&&!FW)for(const k in POST){const p=POST[k];box({name:'Подливка под опорную пластину (пескобетон)',role:'grout',c:[p.o[0],53.5,p.o[2]],ax:[1,0,0],ay:[0,1,0],w:160,h:17,t:160,mat:'grout',layer:'found',step:'brace',cat:'concrete'});}
 // языки на стойках по направлениям сторон
 const sideTongue=(k,dir,y,h,nm,rootLen)=>{const P=V(k,y);return tongue({name:nm,c:add(P,mul(dir,38+25)),ax:dir,ay:[0,1,0],w:50,h,root:add(P,mul(dir,38)),rootLen,md:`post${k}`,step:'posts'});};

 /* ---- обвязка: ригель опускается сверху на языки стоек, затем подкосы вдвигаются в углы «стойка — ригель» на языки.
        Раньше рама «ригель + 2 подкоса» сварена целиком — её нельзя было опустить: подкос упирался в язык ригеля ---- */
 if(!WD)for(let j=0;j<N;j++){
  const k0=j,k1=(j+1)%N,c=tv(PSI(j)),nO=rv(PSI(j)),A=V(k0),B=V(k1),md=mod(`ring${j}`,`Ригель обвязки: сторона ${j+1}${j===FRONT?' (вход)':''}`);
  const beam=tube({name:'Ригель обвязки 60×40',role:'ring',sec:'60x40x2',a:add(A,add(mul(c,32.3),[0,yRb+30,0])),b:add(B,add(mul(c,-32.3),[0,yRb+30,0])),up:[0,1,0],sx:40,sy:60,step:'sides',ends:['торец','торец'],module:md,saddle:[POST[k0].id,POST[k1].id],note:'торцы — по радиусу стойки (седловой рез) и пропил 7×60 под язык'});
  for(const [k,dir] of [[k0,c],[k1,mul(c,-1)]]){
   const tg=sideTongue(k,dir,yRb+30,40,'Язык ригеля обвязки 50×40×6 (вварен в стойку)');
   bolt({d:10,p:add(tg.c,mul(nO,20)),dir:mul(nO,-1),grip:40,thru:[beam,tg],step:'sides',joint:'ригель обвязки — стойка (язык в пропил)'});
   const foot=add(V(k,yRb-L45),mul(dir,32.3)),d=norm(add(dir,[0,1,0])),top=add(foot,add(mul(dir,L45),[0,L45,0]));
   // подкос — отдельная деталь: ставится после ригеля, вдвигается в угол «стойка — ригель» в плоскости рамы на два языка
   // (на стойке и под ригелем); пропилы в торцах открыты в сторону угла. Стойки едут компактно, на пути ригеля ничего нет
   const br=tube({name:'Подкос обвязки 40×40 (рез «на ус»)',role:'ringBrace',sec:'40x40x2',a:add(foot,mul(d,-60)),b:add(top,mul(d,60)),up:nO,sx:40,sy:40,cutA:{n:dir,p:foot},cutB:{n:[0,1,0],p:[0,yRb-1,0]},step:'sides',ends:['низ','верх'],saddle:[POST[k].id],note:'в торцах — пропилы 7 мм под языки, открытые в сторону угла; нижний торец — по радиусу стойки'});
   br.seq=1;br.mount=norm(sub(dir,[0,1,0]));br.mountLen=300;
   const t2=tongue({name:'Язык подкоса 50×24×6 (вварен в стойку)',c:add(foot,mul(d,25)),ax:d,ay:norm(cross(nO,d)),w:50,h:24,root:add(V(k,yRb-L45),mul(dir,38)),rootAx:[0,1,0],rootLen:34,md:`post${k}`,step:'posts'});
   const t3=tongue({name:'Язык подкоса 50×24×6 (вварен в ригель)',c:add(top,mul(d,-25)),ax:d,ay:norm(cross(nO,d)),w:50,h:24,root:[top[0],yRb,top[2]],rootAx:dir,rootLen:40,md,step:'sides'});
   for(const [tg,qq,nm] of [[t2,add(foot,mul(d,30)),'стойка'],[t3,add(top,mul(d,-30)),'ригель']])bolt({d:10,p:add(qq,mul(nO,20)),dir:mul(nO,-1),grip:40,thru:[br,tg],step:'sides',joint:`подкос обвязки — ${nm} (язык в пропил)`});
  }
 }

 /* ---- центральный узел и рёбра шатра ---- */
 // сечение рёбер — по пролёту и снегу (треугольная грузовая площадь)
 const Sg_=SNOW_[cfg.snow],trH=side/2/1000,qH=(Sg_*1.4+GROOF[cov]*1.2)*trH,qHn=(Sg_+GROOF[cov])*trH,LsH=R/ca;
 const HSEC=WD?($w.wHip==='w50x200'?{sec:'w50x200',b:50,h:200}:{sec:'w50x150',b:50,h:150}):(cfg.$||{}).hip==='100x50x3'?{sec:'100x50x3',b:50,h:100,t:3}:pickSec([{sec:'60x40x2',b:40,h:60,t:2},{sec:'80x40x2',b:40,h:80,t:2},{sec:'80x40x3',b:40,h:80,t:3}],qH*R*R/8*0.66,qHn*ca*0.66,LsH,200),hh=HSEC.h; // 100×50 — только у шестигранника: у восьми рёбер нет места на узле Ø114
 const rH=WD?64:53.4,yHub0=yb(rH)-45,yHub1=yb(rH)+hh/ca+12;
 const nHB=$w.hipB||2;   // болтов на конец ребра
 const CrF=(k,rho)=>{const r=rv(PHI(k)),rr=rho-hh/2*sa;return[r[0]*rho,yb(rr)+hh/2*ca,r[2]*rho];};
 if(WD)woodPolyFrame({cfg,X,N,Vk:V,PHI,PSI,POST,WPOST,yRb,yRt,yS,CAP,TM,FW,bP,Lw,Cr:CrF,hipTop:rho=>yb(rho)+(hh-30)/ca,al,R,nHB});
 const hub=tube({name:'Центральный узел шатра Ø114×4',role:'hub',sec:'r114x4',a:[0,yHub0,0],b:[0,yHub1,0],up:[1,0,0],sx:114,sy:114,caps:[true,true],step:'hips',layer:'roofframe',ends:['низ','верх'],module:mod('hub','Центральный узел шатра')});
 const HIP={};
 for(let k=0;k<N;k++){
  const f=PHI(k),r=rv(f),t=tv(f),dE=[r[0]*ca,-sa,r[2]*ca],nR=[r[0]*sa,ca,r[2]*sa],md=mod(`hip${k}`,`Ребро шатра ${k+1}`);
  const Cr=rho=>{const rr=rho-hh/2*sa;return[r[0]*rho,yb(rr)+hh/2*ca,r[2]*rho];};
  const hipO={name:`Ребро шатра ${HSEC.sec.replace(/^w/,'').replace(/x/g,'×')}`,role:'hip',sec:HSEC.sec,a:Cr(rH-40),b:Cr(R+ovh),up:nR,sx:HSEC.b,sy:hh,cutA:{n:r,p:mul(r,rH)},cutB:{n:r,p:mul(r,R+ovh)},step:'hips',layer:'roofframe',ends:['центр','свес'],note:WD?'у центра — пропил 9 мм под нож узла; на углу обвязки — посадочная врубка 30 мм':'верхний торец — по радиусу центрального узла; пропилы 7 мм под языки снизу у обоих концов'};
  const hp=WD?kit.tmb(Object.assign(hipO,{notch:parts.filter(p=>p.role==='ring')})):tube(Object.assign(hipO,{caps:[false,true],module:md,saddle:[hub.id]}));
  HIP[k]=hp;
  const tp=[R*r[0],yH,R*r[2]];
  if(WD){for(const q of [R-110,R-55])for(const sg of [-1,1]){screws.push({type:'sc8',p:add(add(Cr(q),mul(nR,hh/2-45)),mul(t,sg*(HSEC.b/2))),n:norm(add(mul(t,sg),mul(nR,0.7))),st:'hips'});C.sc8++;}}   // ребро на углу обвязки: врубка 30 мм и саморезы наискось, без пластин
  else bolt({d:10,p:add(add(tp,mul(nR,22)),mul(t,-20)),dir:t,grip:40,thru:[hp,TNG[`h${k}`]],step:'hips',joint:'ребро — стойка (язык в пропил)'});
  if(WD){const tgL=110+(nHB-1)*80,tg=tongue({name:`Язык центрального узла ${tgL}×70×6`,c:Cr(57+tgL/2+5),ax:dE,ay:nR,w:tgL,h:70,root:[r[0]*57,yb(57)+hh/2,r[2]*57],rootAx:[0,1,0],rootLen:70,md:'hub',step:'hips'});
   for(const rho of [57+84,57+160,57+236,57+312].slice(0,nHB))bolt({d:12,p:add(Cr(rho),mul(t,-25)),dir:t,grip:50,thru:[hp,tg],step:'hips',joint:'ребро — центральный узел (язык в пропил)'});}
  else{const hc=add([r[0]*(57+25),0,r[2]*(57+25)],[0,yb(57+25),0]),tg=tongue({name:'Язык центрального узла 50×40×6',c:add(hc,mul(nR,22)),ax:dE,ay:nR,w:50,h:40,root:[r[0]*57,yb(57)+22,r[2]*57],rootAx:[0,1,0],rootLen:40,md:'hub',step:'hips'});
  bolt({d:10,p:add(add(hc,mul(nR,22)),mul(t,-20)),dir:t,grip:40,thru:[hp,tg],step:'hips',joint:'ребро — центральный узел (язык в пропил)'});}
 }

 /* ---- обрешётка кольцами и кровля по граням ---- */
 const COVH={tile:46,c20:22,ondulin:38,falc:27,shingle:17};
 const edge=(k,sg,rr)=>{const f=PHI(k),r=rv(f),t=tv(f),nR=[r[0]*sa,ca,r[2]*sa];return add(add([r[0]*rr,yb(rr),r[2]*rr],mul(nR,hh)),mul(t,HSEC.b/2*sg));};
 const FACET=[],roofQty={sheets:0,sheetLen:[],sheetW:[],trimLen:0,ridgeLen:0,eaveLen:0,area:0,hipLen:0,pcStrips:[],pcLen:0,cols:[],colsN:N};
 let step=Math.min(cov==='shingle'?420:COVERS[cov].step,(cfg.$||{}).purStep||1e9);const SH=SHEET[cov]; // под гибкой черепицей OSB лежит рядами вдоль карниза (параллельно кольцам обрешётки) — пролёт не больше 420 мм
 // сечение обрешётки — по самому длинному кольцу у карниза
 const Lpur=2*(R+ovh)*Math.sin(hN),Sg=SNOW_[cfg.snow],qp=(Sg*1.4*ca+GROOF[cov]*1.2)*step/1000,qpn=(Sg*ca+GROOF[cov])*step/1000;
 const PUR=WD?($w.wPur==='e150'?{sec:'w50x150',b:50,h:150}:$w.wPur==='e100'?{sec:'w50x100',b:50,h:100}:{sec:'w50x100',b:100,h:50}):pickSec([{sec:'40x20x2',b:20,h:40,t:2},{sec:'40x40x2',b:40,h:40,t:2},{sec:'60x40x2',b:40,h:60,t:2}],qp*Lpur*Lpur/8,qpn,Lpur,150),ph=PUR.h;
 if(WD){const sm=woodPurStep(Lpur,Sg,ca,GROOF[cov],WS,$w.wPur);if(cov!=='tile'&&sm<step)step=Math.max(250,sm);}
 else{const I=Ipr(PUR.b,PUR.h,PUR.t),a=Sg*1.4*ca+GROOF[cov]*1.2,an=Sg*ca+GROOF[cov],sm=Math.floor(Math.min(1600*I/(PUR.h/2)/(Lpur*Lpur*a),384*2.06e5*I/(750*Lpur**3*an))*100)*10;if(cov!=='tile'&&sm<step)step=Math.max(250,sm);}
 for(let j=0;j<N;j++){
  const k0=j,k1=(j+1)%N,c=tv(PSI(j)),p1=edge(k0,1,R),p2=edge(k0,1,R*0.35),p3=edge(k1,-1,R);
  let nP=norm(cross(sub(p2,p1),sub(p3,p1)));if(nP[1]<0)nP=mul(nP,-1);
  let w=norm(cross(nP,c));if(w[1]<0)w=mul(w,-1);
  const M=mul(rv(PSI(j)),(R+ovh)*Math.cos(hN)),O=[M[0],p1[1]-(nP[0]*(M[0]-p1[0])+nP[2]*(M[2]-p1[2]))/nP[1],M[2]];
  const P=(u,v,h)=>add(add(add(O,mul(c,u)),mul(w,v)),mul(nP,h));
  const tA=tv(PHI(k0)),tB=tv(PHI(k1));
  const uAt=(tk,v,h)=>-dot(add(add(O,mul(w,v)),mul(nP,h)),tk)/dot(c,tk);
  FACET.push({j,nP,w,c,O,P,uAt,tA,tB});
  // обрешётка
  for(let v=20;;v+=step){const uL=uAt(tA,v,ph/2),uR=uAt(tB,v,ph/2);if(uR-uL<260)break;
   const purO={name:WD?($w.wPur?`Обрешётка шатра 50×${PUR.h} на ребро`:'Обрешётка шатра 50×100 плашмя'):`Обрешётка шатра ${PUR.sec.replace('x2','').replace('x','×')}${PUR.b<PUR.h?' (на ребро)':''}`,role:'purlinP',sec:PUR.sec,a:P(uL,v,ph/2),b:P(uR,v,ph/2),up:nP,sx:PUR.b,sy:ph,cutA:{n:tA,p:[0,0,0]},cutB:{n:tB,p:[0,0,0]},step:'purlins',layer:'roofframe',ends:['ребро','ребро'],note:'торцы — под углом по оси ребра'};
   const pur=WD?kit.tmb(purO):tube(purO);if(WD){const fl=PUR.b>PUR.h;   // по 2 самореза в ребро на каждый конец: плашмя — сверху, на ребро — наискось с боков
    for(const [tk,sg] of [[tA,1],[tB,-1]])for(const s of [-1,1]){const vq=fl?v+s*26:v;screws.push(fl?{type:'wp',p:P(uAt(tk,vq,ph/2)+sg*24,vq,ph),n:nP,st:'purlins'}:{type:'wp',p:P(uAt(tk,v,30)+sg*36,v+s*25,30),n:norm(add(mul(w,s),mul(nP,0.7))),st:'purlins'});C.wood6++;}continue;}
   // крепление к рёбрам — ушко на ребре (как упор у прямоугольных беседок): пластина 10 мм вварена дома в верх ребра у нижней (по скату)
   // грани обрешётки, перпендикулярно скату; обрешётка упирается в неё, на каждый торец — 2 самореза 5,5×32 сквозь ушко (отверстия Ø6 — дома).
   // Ушко занимает 2…22 мм от плоскости оси ребра — это над верхом ребра; уголок здесь не встаёт: грань идёт к верху ребра под углом
   for(const [tk,sg,hk] of [[tA,1,k0],[tB,-1,k1]]){const vS=v-PUR.b/2-5,uE=uAt(tk,vS,0),a0=sg>0?uE+2:uE-22,H=HIP[hk],md=H.module;
    const q0=P(a0+10,vS,0),gap=Math.max(0,(dot(sub(q0,H.o),H.ay)-H.sy/2)/Math.max(0.5,dot(nP,H.ay))),hT=ph-4,hc=(hT-gap)/2;
    const tb=box({name:'Ушко обрешётки 20×10 (вварено в ребро)',role:'stopP',c:P(a0+10,vS,hc),ax:c,ay:nP,w:20,h:hT+gap,t:10,mat:'steel',cat:'plate6',step:'hips',layer:'roofframe',module:md});
    for(const hh of [ph*0.3,ph*0.68]){tb.holes.push({x:0,y:hh-hc,d:6});fast('tek',P(a0+10,vS-5.2,hh),mul(w,-1),'purlins');}C.selfDrill+=2;
    for(const dv of [-5.4,5.4])weld(P(a0,vS+dv,-gap+0.4),P(a0+20,vS+dv,-gap+0.4),'Шов ушка обрешётки','hips',md);}}
  // кровельная грань
  const v0=-70,h0=ph,aL=uAt(tA,0,h0),bL=uAt(tA,1,h0)-aL,aR=uAt(tB,0,h0),bR=uAt(tB,1,h0)-aR,vt=(aR-aL)/(bL-bR);
  const pts=[[aL+bL*v0,v0],[aR+bR*v0,v0],[aL+bL*vt,vt]],area=polyArea(pts)/1e6;roofQty.area+=area;roofQty.eaveLen+=(pts[1][0]-pts[0][0])/1000;
  // раскрой грани колонками (все грани одинаковые — считаем по первой): верх колонки срезан по ребру — длинная и короткая стороны
  if(j===0){roofQty.facet={b0:pts[1][0]-pts[0][0],Hs:vt-v0};}
  if(j===0){const vH=u=>Math.max(v0,Math.min(vt,u<=pts[2][0]?(u-aL)/bL:(u-aR)/bR)),SC=cov==='shingle'?{W:1250,E:1250}:SHEET[cov];
   if(SC)for(let u0=pts[0][0];u0<pts[1][0]-40;u0+=SC.E){const u1=Math.min(u0+SC.W,pts[1][0]),hi=(u0<=pts[2][0]&&u1>=pts[2][0])?vt:Math.max(vH(u0),vH(u1)),lo=Math.min(vH(u0),vH(u1));
    roofQty.cols.push({long:hi-v0,short:lo-v0,side:u1<=pts[2][0]?'L':u0>=pts[2][0]?'R':'C',w:u1-u0});}}
  if(cov==='shingle'){
   push({kind:'tri',name:'OSB-3 12 мм (грань шатра, раскрой по шаблону)',role:'osb',pts,t:12,h0:0,o:P(0,0,h0),ax:c,ay:w,az:nP,mat:'osb',layer:'roof',step:'roofDeck',cat:'osb12'});
   for(let v=20;;v+=step){const ul=aL+bL*v,ur=aR+bR*v;if(ur-ul<260)break;for(let uu=ul+40;uu<ur-30;uu+=300)fast('osb',P(uu,v,h0+11.9),nP,'roofDeck');}
   // подкладочный ковёр: полоса по карнизу 600 мм и полосы вдоль рёбер по 250 мм с каждой стороны
   const band=(pp,nm)=>{if(pp.length>=3&&polyArea(pp)>2000)push({kind:'tri',name:nm,role:'underlay',pts:pp,t:1.5,h0:12,o:P(0,0,h0),ax:c,ay:w,az:nP,mat:'underlay',layer:'roof',step:'roofUnder',cat:'underlay'});};
   const v1=v0+600;band([[aL+bL*v0,v0],[aR+bR*v0,v0],[aR+bR*v1,v1],[aL+bL*v1,v1]],'Подкладочный ковёр — полоса по карнизу 600 мм');
   band(clipHalf([[aL+bL*v1,v1],[aL+bL*v1+250,v1],[pts[2][0],vt]],1,0,0),'Подкладочный ковёр — полоса вдоль ребра 250 мм');
   band(clipHalf([[aR+bR*v1-250,v1],[aR+bR*v1,v1],[pts[2][0],vt]],-1,0,0),'Подкладочный ковёр — полоса вдоль ребра 250 мм');
   push({kind:'tri',name:'Гибкая черепица (рядовая, от карниза к вершине)',role:'shingle',pts,t:5,h0:13.5,o:P(0,0,h0),ax:c,ay:w,az:nP,mat:'shingle',layer:'roof',step:'roof',cat:'shingle'});
  }else{
   push({kind:'facet',profile:SH.p,name:`${SH.nm} — грань шатра (полос: ${Math.ceil((pts[1][0]-pts[0][0])/SH.E)})`,role:'roofSheet',pts,o:P(0,0,h0),ax:c,ay:nP,az:w,mat:SH.mat,layer:'roof',step:'roof',cat:cov});
   for(let u0=pts[0][0];u0<pts[1][0]-40;u0+=SH.E){const uc=Math.min(u0+SH.E/2,pts[1][0]-20),vc=uc<pts[2][0]?(uc-aL)/bL:(uc-aR)/bR,L=Math.max(200,vc-v0);
    const pcs=L>SH.L?Math.ceil((L-SH.lap)/(SH.L-SH.lap)):1;roofQty.sheets+=pcs;for(let q=0;q<pcs;q++){roofQty.sheetLen.push(Math.min(SH.L,L));roofQty.sheetW.push(SH.W);}
    if(!SH.hidden)for(let v=20;v<vc-40;v+=step)for(let uu=u0+SH.f0;uu<Math.min(u0+SH.E,pts[1][0])-10;uu+=SH.fp*2){const ul=aL+bL*v,ur=aR+bR*v;if(uu<ul+30||uu>ur-30)continue;screws.push({type:'roof',p:P(uu,v,h0+SH.fh),n:nP});}}
  }
  if(cov==='shingle'){const v=mul(nP,-1),uu=mul(w,-1),Ld=norm(cross(uu,v));angle({mount:rv(PSI(j)),name:'Планка карнизная (капельник) — поверх ковра',role:'trim',o:P(dot(Ld,c)>0?pts[0][0]-20:pts[1][0]+20,v0,h0+13.6),u:uu,v,L:pts[1][0]-pts[0][0]+40,A:60,B:50,t:0.6,mat:'roof',layer:'roof',step:'roofEdge',cat:'drip',trim:true});}
 }
 // коньковые планки по рёбрам
 const ch=ph+COVH[cov];
 const yOn=(F_,x,z)=>{const q=F_.P(0,0,ch),n=F_.nP;return q[1]-(n[0]*(x-q[0])+n[2]*(z-q[2]))/n[1];};
 let apexY=0;
 for(let k=0;k<N;k++){
  const fa=FACET[k],fb=FACET[(k-1+N)%N],r=rv(PHI(k)),t=tv(PHI(k));
  const pt=rho=>[r[0]*rho,yOn(fa,r[0]*rho,r[2]*rho)+1.5,r[2]*rho];
  const H1=pt(55),H2=pt(R+ovh+60),hd=norm(sub(H2,H1));apexY=Math.max(apexY,yOn(fa,0,0));
  let u=norm(cross(fa.nP,hd));if(dot(u,t)<0)u=mul(u,-1);let v=norm(cross(fb.nP,hd));if(dot(v,t)>0)v=mul(v,-1);
  if(dot(cross(u,v),hd)<0){const q=u;u=v;v=q;}
  const Lh=len(sub(H2,H1));roofQty.hipLen+=Lh/1000;
  // у вершины грань уже двух полок: сужаем полки до встыка по середине грани (tgβ — полуугол грани у вершины, s0 — от вершины до начала)
  const cB=dot(hd,mul(fa.w,-1)),tk=Math.sqrt(Math.max(0,1-cB*cB))/cB,s0=55/Math.hypot(hd[0],hd[2]);
  if(cov!=='shingle')for(let q=200;q<Lh-50;q+=400)for(const dd of [u,v])fast('trim',add(add(H1,mul(hd,q)),mul(dd,90)),norm(add(fa.nP,fb.nP)),'roofTrim');
  angle({name:cov==='shingle'?'Коньково-карнизная черепица по ребру':'Планка коньковая по ребру — саморезы через 400 мм',role:'trim',o:H1,u,v,L:Lh,tk,s0,A:cov==='shingle'?125:130,B:cov==='shingle'?125:130,t:cov==='shingle'?4:0.6,mat:cov==='shingle'?'shingle':'roof',layer:'roof',step:'roofTrim',cat:{tile:'ridgeTile',c20:'ridgeC20',falc:'ridgeC20',ondulin:'ridgeOnd',shingle:'ridgeSh'}[cov],trim:true});
 }
 push({kind:'cone',name:'Колпак-навершие шатра (на центральный узел, 3 самореза)',role:'trim',c:[0,apexY-60,0],r:150,h:300,seg:N,rot:hN,mat:'roof',layer:'roof',step:'roofTrim',cat:'hipCap',trim:true});

 /* ---- пол: балки по периметру на языках, внутренние балки на столбиках, лаги, настил ---- */
 let deckInfo=null;
 const inPoly=(x,z,off)=>{for(let j=0;j<N;j++){const n=rv(PSI(j));if(n[0]*x+n[2]*z>a+off)return false;}return true;};
 const zSpan=x=>{let lo=-1e9,hi=1e9;for(let j=0;j<N;j++){const n=rv(PSI(j));if(Math.abs(n[2])<1e-6){if(n[0]*x>a)return null;continue;}const zz=(a-n[0]*x)/n[2];if(n[2]>0)hi=Math.min(hi,zz);else lo=Math.max(lo,zz);}return hi>lo?[lo,hi]:null;};
 const xSpan=(z,off)=>{let lo=-1e9,hi=1e9;for(let j=0;j<N;j++){const n=rv(PSI(j));if(Math.abs(n[0])<1e-6){if(n[2]*z>a+off)return null;continue;}const xx=(a+off-n[2]*z)/n[0];if(n[0]>0)hi=Math.min(hi,xx);else lo=Math.max(lo,xx);}return hi>lo?[lo,hi]:null;};
 let WFL=null;if(isFloor&&FW){WFL=woodFloorPoly(X,cfg,{N,R,a,V,rv,tv,PHI,PSI,TR,bP,FY,pillar,inPoly,xSpan,zSpan});}
 if(isFloor){
  if(!FW)for(let j=0;j<N;j++){const k0=j,k1=(j+1)%N,c=tv(PSI(j)),nO=rv(PSI(j)),A=V(k0),B=V(k1);
   const fb=tube({name:'Балка пола 60×40 (по периметру)',role:'floorBeamP',sec:'60x40x2',a:add(A,add(mul(c,32.3),[0,160,0])),b:add(B,add(mul(c,-32.3),[0,160,0])),up:[0,1,0],sx:40,sy:60,step:'bottom',layer:'floor',ends:['торец','торец'],saddle:[POST[k0].id,POST[k1].id],note:'торцы — по радиусу стойки и пропил 7×60 под язык'});
   for(const [k,dir] of [[k0,c],[k1,mul(c,-1)]]){const tg=sideTongue(k,dir,160,40,'Язык балки пола 50×40×6 (вварен в стойку)');bolt({d:8,p:add(tg.c,mul(nO,20)),dir:mul(nO,-1),grip:40,thru:[fb,tg],step:'bottom',joint:'балка пола — стойка (язык в пропил)'});}}
  const nIn=R>1650?2:1,ZL=[...Array(nIn)].map((_,l)=>-a+(l+1)*2*a/(nIn+1));
  if(!FW)for(const zl of ZL){
   const s1=xSpan(zl-20,-25),s2=xSpan(zl+20,-25),x0=Math.max(s1[0],s2[0]),x1=Math.min(s1[1],s2[1]),Lb=x1-x0;
   const np=Math.max(2,Math.ceil((Lb-300)/1300)+1),PX=[...Array(np)].map((_,i)=>x0+150+i*(Lb-300)/(np-1));
   const cuts=[x0,...(Lb>3000?[PX[Math.floor(np/2)]]:[]),x1];
   for(let q=0;q<cuts.length-1;q++)tube({name:'Балка пола 60×40 (внутренняя, на столбиках)',role:'floorBeam',sec:'60x40x2',a:[cuts[q]+(q?1:0),160,zl],b:[cuts[q+1]-(q<cuts.length-2?1:0),160,zl],up:[0,1,0],sx:40,sy:60,caps:[q===0,q===cuts.length-2],step:'bottom',layer:'floor',ends:['лев.','прав.']});
   for(const x of PX){pillar(x,zl,{name:'Столбик под балку пола Ø200',studs:[[x,zl,124,[-205,109],[[-195,3]]]]});box({name:'Опорный столик 100×100×4 с приварной гайкой M12',role:'support',c:[x,128,zl],ax:[1,0,0],ay:[0,0,1],w:100,h:100,t:4,step:'bottom',cat:'plate6',mat:'steel',layer:'floor'});C.selfDrill+=2;}
  }
  const xs=xSpan(0,-130),VX=[...Array(N)].map((_,k)=>V(k)[0]);
  const nj=Math.ceil((xs[1]-xs[0])/(cfg.deck==='wpc'?400:480))+1;let JX=FW?WFL.JX:[...Array(nj)].map((_,i)=>xs[0]+i*(xs[1]-xs[0])/(nj-1)); // ДПК — лаги не реже 400 мм
  JX=JX.map(x=>{for(const vx of VX)if(Math.abs(x-vx)<72)return vx+(x<vx?-72:72);return x;}).filter(x=>Math.abs(x)<=R-110);
  // конец лаги на балке по периметру: на грани поперёк лаги — до наружной кромки балки (опора на всю ширину),
  // на косой грани квадратный торец и так целиком над балкой; на каждом конце — уголок со стороны, где под ним балка
  const endN=(x,z)=>{let b=null;for(let j=0;j<N;j++){const n=rv(PSI(j)),d=Math.abs(n[0]*x+n[2]*z-a);if(!b||d<b.d)b={n,d};}return b.n;};
  if(!FW)for(const x of JX){const zs=zSpan(x);if(!zs)continue;let [z0,z1]=zs;const n0=endN(x,z0),n1=endN(x,z1);
   if(Math.abs(n0[0])<0.05)z0-=18;if(Math.abs(n1[0])<0.05)z1+=18;
   const pcs=z1-z0>2950?[[z0,ZL[Math.floor(ZL.length/2)]-1],[ZL[Math.floor(ZL.length/2)]+1,z1]]:[[z0,z1]];
   for(const [p0,p1] of pcs)tube({name:'Лага пола 40×40',role:'joist',sec:'40x40x2',a:[x,210,p0],b:[x,210,p1],up:[0,1,0],sx:40,sy:40,caps:[p0===z0,p1===z1],step:'bottom',layer:'floor',ends:['зад','перед']});
   for(const n of [n0,n1]){const s=Math.abs(n[0])<0.05?(x>1?-1:1):Math.sign(n[0]),zc=(a-n[0]*(x+s*40))/n[2];
    angle({name:'Уголок крепёжный 40×40×40×2 (лага — балка)',role:'cleatJoist',o:[x+s*20,190,zc-20*s],u:[s,0,0],v:[0,1,0],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});C.clip+=4;
    for(const dz of [-10,10]){fast('clip',[x+s*42,192.2,zc+dz],[0,1,0],'bottom');fast('clip',[x+s*22.2,214,zc+dz],[s,0,0],'bottom');}}
   for(const zl of ZL){if(zl<z0+30||zl>z1-30)continue;const s=x>1?-1:1;angle({name:'Уголок крепёжный 40×40×40×2 (лага — балка)',role:'cleatJoist',o:[x+s*20,190,zl-20*s],u:[s,0,0],v:[0,1,0],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});C.clip+=4;for(const dz of [-10,10]){fast('clip',[x+s*42,192.2,zl+dz],[0,1,0],'bottom');fast('clip',[x+s*22.2,214,zl+dz],[s,0,0],'bottom');}}
  }
  // настил: доски вдоль X, обрезаны по многоугольнику, у стоек — срезанные углы
  let nb=Math.ceil((2*a+40+5)/145);const ws=[...Array(nb)].map(()=>140),z00=-(nb*145-5)/2,pieces=[];
  const mid=JX.map(x=>[Math.abs(x),x]).sort((p,q)=>p[0]-q[0]).slice(0,2).map(q=>q[1]).sort((p,q)=>p-q);
  ws.forEach((wd,i)=>{const z0=z00+i*145,z1=z0+wd;
   let pg=[[-R-200,z0],[R+200,z0],[R+200,z1],[-R-200,z1]];
   for(let j=0;j<N;j++){const n=rv(PSI(j));pg=clipHalf(pg,n[0],n[2],a+20);}
   for(let k=0;k<N;k++){const n=rv(PHI(k));pg=clipHalf(pg,n[0],n[2],FW?R-bP*0.75-6:R-44);}
   if(pg.length<3||polyArea(pg)<4000)return;
   const xmn=Math.min(...pg.map(q=>q[0])),xmx=Math.max(...pg.map(q=>q[0]));
   const segs=xmx-xmn>3000?[[-1e9,mid[i%2]-1.5],[mid[i%2]+1.5,1e9]]:[[-1e9,1e9]];
   for(const [sa_,sb_] of segs){let q=clipHalf(pg,-1,0,-sa_);q=clipHalf(q,1,0,sb_);if(q.length<3)continue;const L=Math.round(Math.max(...q.map(p=>p[0]))-Math.min(...q.map(p=>p[0])));pieces.push(L);
    push({kind:'poly',name:`Доска настила №${i+1}: ${DT}×140×${L}`,role:'deck',pts:q,y0:230,h:DT,mat:DECKS[cfg.deck].mat,layer:'floor',step:'deck',cat:DECKS[cfg.deck].cat,w:140,L,tint:((i*37)%7)/7});}
   if(cfg.deck!=='wpc')for(const x of JX){const zs=zSpan(x);if(!zs)continue;for(const dz of [-1,1]){const zz=(z0+z1)/2+dz*45;if(zz>zs[0]+30&&zz<zs[1]-30&&inPoly(x,zz,0))screws.push({type:'deck',p:[x,F+0.5,zz],n:[0,1,0]});}}
  });
  deckInfo={n:nb,pieces};
 }else{let pg=[];for(let j=0;j<N;j++){const f=PHI(j);pg.push([Math.cos(f)*(R-20),Math.sin(f)*(R-20)]);}push({kind:'poly',name:'Пол: геотекстиль + щебень 20–40, слой 70 мм',role:'gravel',pts:pg,y0:-40,h:70,mat:'gravel',layer:'floor',step:'deck',cat:'gravel'});}

 if(TM)for(const p of parts)if(['bottom','deck'].includes(p.step)&&!p.mount){p.mount=[0,1,0];p.mountLen=p.step==='deck'?50:70;}
 /* ---- борта: секции по сторонам, передняя сторона — вход ---- */
 const Bb=TM?Math.max(isFloor?F+60:150,yS+CAP+126):isFloor?F+60:150,fillInfo=[],sF=TM?bP/2/Math.cos(hN)+1:58;   // брус: брусья борта с косым торцом врезаны в грани стоек
 for(let j=0;j<N;j++){
  if(j===FRONT)continue;
  const n=rv(PSI(j)),c=tv(PSI(j)),Hs=n[2]<-0.5?RH.back:n[2]>0.5?RH.front:(n[0]<0?RH.left:RH.right);if(!Hs)continue;
  const pN=parts.length,top=F+Hs,md=mod(`rail_${j}`,`Секция борта: сторона ${j+1}`),A=V(j),st='railframe';
  const pt=(s,y,pe)=>add(add(add(A,mul(c,s)),[0,y,0]),mul(n,pe||0));
  const stiles=[];
  if(!TM)for(const [s0,k,dir] of [[48,j,-1],[side-48,(j+1)%N,1]]){
   const stl=tube({name:'Стойка секции 40×20',role:'stile',sec:'40x20x2',a:pt(s0,Bb),b:pt(s0,top),up:c,sx:40,sy:20,caps:[true,true],step:st,layer:'rail',module:md,ends:['низ','верх']});stiles.push(stl);
   const o=(j%2)*30;
   for(const y of [Bb+85+o,top-95-o])bolt({d:8,p:pt(s0-dir*10,y),dir:mul(c,dir),grip:96,thru:[stl,POST[k]],step:st,joint:'секция борта — стойка (стяжной болт)'});
  }
  const rails=TM?[{sec:'w50x100',w:100,h:50,yc:top-25,name:'Поручень 50×100',role:'railTop'},{sec:'w50x50',w:50,h:50,yc:Bb+25,name:'Нижний брус 50×50',role:'railBot'}]:[{sec:'40x40x2',h:40,yc:top-20,name:'Поручень 40×40',role:'railTop'},{sec:'40x20x2',h:20,yc:Bb+10,name:'Нижний брус 40×20',role:'railBot'}];
  if(top-Bb>700)rails.push(TM?{sec:'w50x50',w:50,h:50,yc:Math.round((top+Bb)/2),name:'Средний брус 50×50',role:'railMid'}:{sec:'40x20x2',h:20,yc:Math.round((top+Bb)/2),name:'Средний брус 40×20',role:'railMid'});
  if(TM)for(const rl of rails){const t0=tv(PHI(j)),t1=tv(PHI(j+1)),Q0=V(j,0),Q1=V((j+1)%N,0);kit.tmb({name:`${rl.name} (сторона ${j+1})`,role:rl.role,sec:rl.sec,a:pt(sF-12,rl.yc),b:pt(side-sF+12,rl.yc),up:[0,1,0],sx:rl.w,sy:rl.h,cutA:{n:t0,p:add(Q0,mul(t0,bP/2-10))},cutB:{n:t1,p:add(Q1,mul(t1,-(bP/2-10)))},step:st,layer:'rail',module:md,notch:[WPOST[j],WPOST[(j+1)%N]],note:'торцы — под грань стойки, врубка 10 мм, 2 самореза наискось'});C.sc8+=4;}
  else for(const rl of rails){tube({name:`${rl.name} (сторона ${j+1})`,role:rl.role,sec:rl.sec,a:pt(58,rl.yc),b:pt(side-58,rl.yc),up:[0,1,0],sx:40,sy:rl.h,step:st,layer:'rail',module:md});for(const s of [58,side-58])ringWeld(pt(s,rl.yc),[0,1,0],n,rl.h,40,'Шов брус — стойка секции',st,md);}
  const oF=TM?25:20,s38=TM?sF+6:38,runLen=side-2*s38,h=top-Bb,fi={run:j,n:`сторона ${j+1}`,len:runLen,h,pieces:0};
  if(cfg.fill==='prof'){push({kind:'sheet',profile:'C8',name:`Профнастил С8 (сторона ${j+1}, ${Math.round(runLen)}×${Math.round(h)})`,role:'fillSheet',o:pt(s38,Bb,oF),ax:c,ay:n,az:[0,1,0],W:runLen,L:h,mat:'fill',layer:'rail',step:'fill',cat:'c8'});
   for(const y of rails.map(r=>r.yc))for(let uu=29;uu<runLen;uu+=230)screws.push({type:'fill',p:pt(s38+uu,y,oF+0.6),n});}
  else{const Wd=cfg.fill==='euro'?118:95,gap=cfg.fill==='euro'?47:30,cnt=Math.max(1,Math.floor((runLen+gap)/(Wd+gap))),tot=cnt*Wd+(cnt-1)*gap,s0=s38+(runLen-tot)/2;fi.pieces=cnt;
   for(let i=0;i<cnt;i++){const a0=s0+i*(Wd+gap);
    if(cfg.fill==='euro')push({kind:'sheet',profile:'EURO',name:`Штакетник 118 × ${Math.round(h)} (сторона ${j+1})`,role:'picket',o:pt(a0,Bb,oF),ax:c,ay:n,az:[0,1,0],W:Wd,L:h,mat:'fill',layer:'rail',step:'fill',cat:'euro'});
    else box({name:`Штакетина 20×95 × ${Math.round(h)} (сторона ${j+1})`,role:'plank',c:pt(a0+Wd/2,Bb+h/2,oF+10),ax:c,ay:[0,1,0],w:Wd,h,t:20,mat:'woodFill',layer:'rail',step:'fill',cat:'plank',tint:((i*29)%5)/5});
    for(const y of rails.map(r=>r.yc))for(const dx of [-1,1])screws.push({type:cfg.fill==='euro'?'fill':'wood',p:pt(a0+Wd/2+dx*(Wd/2-22),y,cfg.fill==='euro'?oF+18.6:oF+20.5),n});}}
  fillInfo.push(fi);
  for(let q=pN;q<parts.length;q++)if(['railframe','fill'].includes(parts[q].step))parts[q].mount=n; // секцию и заполнение подносят снаружи
 }
 X.capAll();
 // мебель для масштаба: круглый стол и скамьи
 const dec=(name,c,w,h,t,mat)=>box({name:name+' — для масштаба, в смету не входит',role:'decor',c,ax:[1,0,0],ay:[0,1,0],w,h,t,mat:mat||'woodFill',layer:'decor',step:'finish',cat:null});
 const tl=Math.min(1500,2*a-1500);
 if(tl>600){dec('Стол',[0,F+735,-80],tl,30,800);for(const sx of [-1,1])for(const sz of [-1,1])dec('Ножка стола',[sx*(tl/2-80),F+360,-80+sz*300],60,720,60);for(const z of [-700,540])dec('Скамья',[0,F+445,z],tl,35,300);}
 const BK=FW?WFL.K:X.fnd?buildBasePoly(X,cfg,{N,R,V,tv,rv,PHI,PSI,TR,FRONT}):null,y0=BK?BK.L.y0:FY,ST=isFloor&&F-y0>300?stairs(X,cfg,{FW,zf:a+(FW?sillB/2:20),F,y0,beam:parts.find(p=>['floorBeamP','sill'].includes(p.role)&&Math.abs(p.o[2]+p.az[2]*p.L/2-a)<2)}):null;
 if(ST)deckInfo.pieces.push(...ST.pcs);
 for(let i=0;i<4;i++)dec('Плитка дорожки',[((i%2)?-60:60),y0+(i===0?18:8),a+(ST?ST.run+250:0)+450+i*520],620,16,420,'grout');
 const steps=mkSteps(parts,cfg);
 const sideHalf=side/2;
 const model={cfg,parts,screws,F,ZP:[a,0,-a],hb:60,Bb,RH,isFloor,gable:false,poly:N,type:cfg.type,cov,hasDoor:true,steps,C,fillInfo,W:Dc,D:Dc,H,nP:N,sP:side,MODS,ang:cfg.ang,roofQty,E:Math.round(side-76),split:false,Yj:null,L45,
  free:!!X.fnd,base:X.fnd?baseInfo(BK,X,cfg):null,y0,FW,sillB,psi0:PSI(0),mat:cfg.mat,wood:cfg.wood,bP,yS,Lw,yRb,wPur:$w.wPur||'',hipB:nHB,postSec:(cfg.$||{}).postR||'r76x3',baseFixed:false,purlin:PUR,hip:HSEC,joistStep:cfg.deck==='wpc'?400:480,floorSpan:1300,truckSpec:TR,deck:deckInfo,rows:[20,20+step],Lr:0,ovh,ovhZ:ovh,R,apo:a,side,
  dims:{headroom:H,top:yHub1+260,apex:apexY,eave:F+H,door:Math.round(side-76),yLow:F+H,yHigh:F+H}};
 return finalize(model);
}
/* ---------------- деревянный каркас (всё, что выше пола, у hybrid и timber) ----------------
   Брус собирается на готовых стальных коннекторах для бруса: гнёзда из стали 2 мм под брус 100×100 или 150×150, порошковая окраска,
   брус вставляется и крепится глухарями 6×60. Без сварки дома и без пропилов. Поэтому стойки и балки — квадратного сечения, под размер гнезда.
   Подкосы — на врубке (15 мм) и 2 конструкционных саморезах: работают на сжатие, в каждом направлении ветра сжат свой подкос.
   Расстановка болтов — СП 64.13330.2017, п. 8.20 (пакет тоньше 10d): вдоль волокон ≥ 6d = 72 мм, поперёк ≥ 3d = 36 мм, от кромки ≥ 2,5d = 30 мм */
function woodKit(X,cfg){
 const WS=WOODS[cfg.wood],matOf=cfg.wood==='larch'?'timberL':cfg.wood==='pine'?'timberP':'timber';
 const tmb=o=>{const s=SEC[o.sec],p=X.tube(Object.assign({sx:s.b,sy:s.h},o,{caps:[false,false]}));p.wood=true;p.mat=matOf;p.rho=WS.rho;p.cat=woodCat(s.b,s.h,cfg.wood);p.notch=(o.notch||[]).map(q=>q.id);return p;};
 // гнездо коннектора: c — центр, u — ось бруса, v — вверх, n — поперёк; open — сверху открыто, брус опускают; cat — на одну стенку изделия, по ней считается смета
 const socket=o=>{const {c,u,v,n,b,h,L,step}=o,qs=o.rows===3?[-L*0.35,0,L*0.35]:[-L*0.3,L*0.3],nm=o.name||'Коннектор обвязки',m0=(X.grpN=(X.grpN||0)+1,{role:'wConn',mat:'steel',cat:null,module:'loose',layer:o.layer||'frame',step,seq:o.seq==null?1:o.seq,mount:o.mount||[0,1,0],mountLen:o.mountLen||60,why:o.why||'Держит брус в лотке, нагрузка уходит на опору. Брус опускают сверху, крепят глухарями.',grp:X.grpN,name:nm,size:`${L}×${h+4}×${b+4} мм`}),P_=(q)=>X.box(Object.assign({},m0,q));
  P_({cat:o.cat||null,c:add(c,mul(v,-(h/2+1))),ax:u,ay:n,w:L,h:b+4,t:2});
  for(const s of [-1,1])P_({c:add(c,mul(n,s*(b/2+1))),ax:u,ay:v,w:L,h:h+4,t:2});
  if(!o.open)P_({c:add(c,mul(v,h/2+1)),ax:u,ay:n,w:L,h:b+4,t:2});
  for(const s of [-1,1])for(const q of qs)for(const dy of [-h*0.25,h*0.25])X.screws.push({type:'lag',p:add(add(add(c,mul(u,q)),mul(v,dy)),mul(n,s*(b/2+2.6))),n:mul(n,s),st:o.sst||step});
  X.C.conn6+=qs.length*4;};
 // опорный коннектор: основание и гнездо вокруг низа стойки
 const postBase=o=>{const sq=o.seq==null?-1:o.seq,why='Низ стойки: гнездо на брус и опорная площадка. Держит стойку от отрыва и не даёт торцу стоять в воде.';X.box({name:`Коннектор опорный ${o.b}×${o.b}`,why,size:`площадка ${o.b+12}×${o.b+12}, гнездо ${o.b}×${o.b}`,role:'wHead',mat:'steel',cat:'plate6',c:[o.x,o.y-4,o.z],ax:o.n,ay:o.u,w:o.b+12,h:o.b+12,t:8,step:o.step,module:o.md,layer:o.layer||'frame',seq:sq});
  socket({name:`Коннектор опорный ${o.b}×${o.b}`,why,cat:'connBase',c:[o.x,o.y+60,o.z],u:[0,1,0],v:o.u,n:o.n,b:o.b,h:o.b,L:120,step:o.step,seq:sq,layer:o.layer,mount:[0,1,0]});};
 // цельный коннектор узла, как изделия LUVON: гнутая сталь 2 мм, гнездо на стойку снизу и открытые сверху лотки под балки. Балка опускается в лоток сверху
 // p — верх стойки на её оси; arms — лотки: d — направление в плане, sst — шаг, когда в лоток приходят глухари; там, где лотка нет, стоит глухая стенка
 const conn=o=>{const {p,b,step}=o,hb=b,Hs=b>=150?130:105,armL=b>=150?110:100,UP=[0,1,0],e1=o.e1||[1,0,0],e2=o.e2||[0,0,1],arms=o.arms||[];X.grpN=(X.grpN||0)+1;
  const base={role:'wConn',mat:'steel',cat:null,module:'loose',layer:o.layer||'frame',step,seq:o.seq==null?1:o.seq,mount:[0,1,0],mountLen:60,why:o.why,grp:X.grpN,name:o.name,size:o.size};
  let first=true;const P_=q=>{const r=X.box(Object.assign({},base,q,first&&o.cat?{cat:o.cat}:{}));first=false;return r;},scr=(pt,n,st)=>{X.screws.push({type:'lag',p:pt,n,st:st||step});X.C.conn6++;};
  // гнездо на стойку: четыре грани, глухари в разные горизонты, чтобы встречные не упирались
  [[e1,e2,0.2,0.6],[mul(e1,-1),e2,0.6,0.2],[e2,e1,0.4,0.8],[mul(e2,-1),e1,0.8,0.4]].forEach(([s,t,h1,h2])=>{P_({c:add(add(p,mul(s,b/2+1)),[0,-Hs/2,0]),ax:t,ay:UP,w:b+4,h:Hs,t:2});
   for(const [q,hh] of [[-0.25,h1],[0.25,h2]])scr(add(add(p,mul(s,b/2+2.6)),add(mul(t,q*b),[0,-Hs*hh,0])),s,step);});
  for(const a of arms){const d=a.d,nn=[-d[2],0,d[0]],end=b/2+(a.L||armL);
   for(const e of [-1,1]){const out=a.out?Math.sign(dot(mul(nn,e),a.out)):0,s0=o.miter?-out*(b/2+2)*Math.tan(o.miter):b/2;
    P_({c:add(add(p,mul(d,(s0+end)/2)),add(mul(nn,e*(b/2+1)),[0,hb/2-1,0])),ax:d,ay:UP,w:end-s0,h:hb+2,t:2});
    if(a.rows===3)for(const q of [0.3,0.55,0.8])for(const dy of [-0.25,0.25])scr(add(add(p,mul(d,end*q)),add(mul(nn,e*(b/2+2.6)),[0,hb/2+dy*hb,0])),mul(nn,e),a.sst);
    else for(const [q,dy] of [[0.28,e*0.22],[0.75,-e*0.22]])scr(add(add(p,mul(d,b/2+(end-b/2)*q)),add(mul(nn,e*(b/2+2.6)),[0,hb/2+dy*hb,0])),mul(nn,e),a.sst);}
   P_({c:add(add(p,mul(d,(b/2+end)/2)),[0,-1,0]),ax:d,ay:nn,w:end-b/2,h:b+4,t:2});
   if(a.rows!==3)for(const s of [-1,1])scr(add(add(p,mul(d,(b/2+end)/2)),add(mul(nn,s*b*0.25),[0,-2.6,0])),[0,-1,0],a.sst);}
  if(!o.miter)for(const s of [e1,mul(e1,-1),e2,mul(e2,-1)]){if(arms.some(a=>dot(a.d,s)>0.9))continue;const t=[-s[2],0,s[0]],low=o.low&&dot(o.low,s)>0.9,hc=low?hb-50:hb;P_({c:add(add(p,mul(s,b/2+1)),[0,hc/2,0]),ax:t,ay:UP,w:b+4,h:hc,t:2});}};
 // торцевой коннектор 100×100: U-образная чашка на грани стойки, балка входит в неё сверху. c — центр торца балки на грани, dir — вдоль балки от грани
 const cup=o=>{const {c,dir,b,step}=o,n=[dir[2],0,-dir[0]],len=100;X.grpN=(X.grpN||0)+1;
  const m0={role:'wConn',mat:'steel',cat:null,module:'loose',layer:'frame',step,seq:o.seq==null?1:o.seq,mount:[0,1,0],mountLen:60,why:o.why,grp:X.grpN,name:o.name,size:`${len}×${b+4}×${b} мм`};
  X.box(Object.assign({},m0,{cat:o.cat,c:add(add(c,mul(dir,len/2)),[0,-b/2-1,0]),ax:dir,ay:n,w:len,h:b+4,t:2}));
  const sd=[];for(const s of [-1,1]){sd.push(X.box(Object.assign({},m0,{c:add(add(c,mul(dir,len/2)),mul(n,s*(b/2+1))),ax:dir,ay:[0,1,0],w:len,h:b,t:2})));
   for(const [q,dy] of [[30,s*b*0.22],[72,-s*b*0.22]]){X.screws.push({type:'lag',p:add(add(add(c,mul(dir,q)),[0,dy,0]),mul(n,s*(b/2+2.6))),n:mul(n,s),st:o.sst||step});X.C.conn6++;}}
  if(o.bolts)for(const dy of [-20,20])X.bolt({d:12,p:add(add(c,mul(dir,78)),add(mul(n,-(b/2+2)),[0,dy,0])),dir:n,grip:b+4,thru:[o.beam,...sd],step:o.sst||step,joint:'балка вдоль — торцевой коннектор'});};
 return{WS,tmb,postBase,socket,conn,cup};
}
// наибольший шаг обрешётки 50×100 плашмя по прочности и прогибу L/150 (снег, mдл = 0,66)
function woodPurStep(L,Sg,c,g,WS,pur){const b=pur?50:100,h=pur==='e150'?150:pur==='e100'?100:50,R=WS.RA*WS.kR*WMS*WMV,Wm=b*h*h/6,I=b*h**3/12,E=WE*WMV,a=Sg*1.4*c+g*1.2,an=Sg*c+g;return Math.floor(Math.min(8e3*R*Wm/(L*L*a),384e3*E*I/(750*L**3*an))/10)*10;}

function woodRect(V){
 const {cfg,X,F,H,W,ZP,XP,nl,PN,SN,yB,CB,TB,nB,uB,hb,bw,beamSec,xa,xb,gable,PG,cb,sb,tb,POST,CAP,TM,FW,bP,yS,Lw,ovh,ybR,ycR,ytR,RHT,DP,E2s,slope,WPOST:WP,sP,TR,PSEC,SPG,wBr,heelS,zBolt}=V;
 const {C,screws}=X,{tmb,postBase,conn,cup}=woodKit(X,cfg),xE=0,MONO=!gable&&!PG,STEM=bP>=150?130:105,ARM=bP>=150?110:100;
 const LZmax=Math.round((sP-bP)/2-70),LZ=Math.min(Lw,LZmax);   // подкосы вдоль не встречаются в коротком пролёте
 const pw=bP,thB=100,secB='w100x100',NT=15,sB=FW?-1:1;   // ножка, опорный коннектор, стойка, верхний коннектор — снизу вверх
 // врубки на соседних гранях стойки не ставят на одну высоту: ослабляют угол и упираются друг в друга
 const BG=Math.ceil(thB*Math.SQRT2)+10,braceZ=d=>{if(Math.abs(d-LZ)>=BG)return LZ;const up=Math.round(d-BG),dn=Math.round(d+BG);return dn<=LZmax?dn:up;};
 // коннекторы прямоугольные, балка в лотке только горизонтальна: у «Модерна» на стойках лежат балки вдоль, а наклонные балки — на них; у перголы портальные балки горизонтальны, стойки разной высоты
 const bm=hb,top=(x,i)=>MONO?yB(x,i)-bP:yB(x,i),TEND={name:`Коннектор Т-образный ${bP}×${bP}`,cat:'connT',size:`${bP+2*ARM}×${bP+STEM}×${bP+4} мм`,why:'Цельная деталь: снизу гнездо на стойку, сверху лоток, в котором лежит балка. Держит балку на стойке от отрыва ветром и от сдвига.'};
 /* ---- стойки из бруса: снизу опорный коннектор, сверху цельный коннектор узла ---- */
 ZP.forEach((z,i)=>{for(const sx of [-1,1]){
  const x=sx*XP,tp=top(x,i),post=POST[`${i}${sx}`],key=`${i}${sx}`,end=i===0||i===nl;
  postBase({x,z,y:yS+CAP,u:[1,0,0],n:[0,0,1],b:bP,step:'posts',md:FW?'loose':post.module,seq:sB});if(FW)C.sc8+=4;
  WP[key]=tmb({name:`Стойка из бруса ${bP}×${bP} (${PN(i)}, ${SN(sx)})`,role:'postW',sec:`w${bP}x${bP}`,a:[x,yS+CAP,z],b:[x,tp,z],up:[0,0,1],step:'posts',seq:sB+1,ends:['низ','верх'],note:'торцы пропитать составом для торцов'});
  const p=[x,tp,z];
  if(gable)conn({p,b:bP,arms:[{d:[-sx,0,0],sst:'heads'},...(i>0?[{d:[0,0,1],sst:'sides'}]:[]),...(i<nl?[{d:[0,0,-1],sst:'sides'}]:[])],low:[sx,0,0],step:'posts',seq:sB+2,name:`${end?'Коннектор угловой':'4-лучевой коннектор'} ${bP}×${bP}`,cat:end?'conn3':'conn4',size:end?`${bP+ARM+5}×${bP+STEM}×${bP+ARM+5} мм`:`${bP+2*ARM+5}×${bP+STEM}×${bP+ARM+5} мм`,why:'Цельная деталь на верху стойки: стойка входит снизу, затяжка фермы и балки вдоль ложатся в лотки сверху.'});
  else conn(Object.assign({p,b:bP,arms:(MONO?[[0,0,1],[0,0,-1]]:[[1,0,0],[-1,0,0]]).map(d=>({d,sst:'heads'})),step:'posts',seq:sB+2},TEND));
 }});
 /* ---- балки и фермы поперёк, по порталам ---- */
 const zz=(v,z)=>[v[0],v[1],z],xe=W/2+xE,PB=[];   // затяжка кончается внутри коннектора; W ≤ 3 м входит в одну заготовку 3 м
 ZP.forEach((z,i)=>{
  const yU=x=>yB(x,i);
  let beam;
  if(gable){
   const yT=F+H+bm;
   beam=tmb({name:`Затяжка фермы ${bw}×${bm} (${PN(i)})`,role:'portalBeam',sec:beamSec,a:[-xe,F+H+bm/2,z],b:[xe,F+H+bm/2,z],up:[0,1,0],step:'heads',ends:['лев.','прав.']});
   const king=tmb({name:'Бабка фермы 100×100',role:'kingPost',sec:'w100x100',a:[0,yT,z],b:[0,ytR(50)-DP/cb-6,z],up:[0,0,1],layer:'roofframe',step:'heads',ends:['низ','верх']});
   for(const sx of [-1,1]){
    const n=[sx*sb,cb,0],raf=tmb({name:`Стропило фермы ${bw}×${RHT} (${sx<0?'левое':'правое'})`,role:'rafter',sec:`w${bw}x${RHT}`,a:[sx*50,ycR(50),z],b:[sx*(W/2+ovh),ycR(W/2+ovh),z],up:n,cutA:{n:[1,0,0],p:[sx*50,0,0]},cutB:{n:[1,0,0],p:[sx*(W/2+ovh),0,0]},layer:'roofframe',step:'heads',ends:['конёк','свес'],notch:[beam],note:'на затяжке — посадочная врубка 30 мм; у конька — упор в бабку'});
    // пята: стропило сидит на затяжке врубкой 30 мм, распор держат конструкционные саморезы сверху, в два ряда
    for(let q=0;q<heelS/2;q++)for(const dz of [-25,25]){const xq=sx*(W/2-110-q*70);screws.push({type:'sc8',p:add(add([xq,ycR(xq),z+dz],mul(n,RHT/2)),[0,0,0]),n,st:'heads'});C.sc8++;}
    const x1=sx*Math.max(420,0.5*W/2),B0=[x1,ybR(x1),z],A0=[sx*50,yT+70,z],d=norm(sub(B0,A0));
    tmb({name:'Раскос фермы 100×100',role:'strut',sec:'w100x100',a:add(A0,mul(d,-60)),b:add(B0,mul(d,60)),up:[0,0,1],cutA:{n:[1,0,0],p:[sx*38,0,0]},cutB:{n:n,p:add(B0,mul(n,12))},layer:'roofframe',step:'heads',ends:['низ','верх'],notch:[king,raf],note:'врубки по 12 мм в бабку и в стропило'});
    C.sc8+=4;
   }
   C.sc8+=4;
  }else{
   beam=tmb({name:`Балка ${MONO?'по скату':'портала'} ${bw}×${bm} (${PN(i)})`,role:'portalBeam',sec:beamSec,a:zz(CB(xa,i),z),b:zz(CB(xb,i),z),up:nB,sx:bw,sy:bm,cutA:{n:[1,0,0],p:[xa,0,0]},cutB:{n:[1,0,0],p:[xb,0,0]},step:MONO?'sides':'heads',ends:PG?['лев. вынос','прав. вынос']:['низ ската','верх ската']});
   if(MONO)for(const sx of [-1,1])for(const dz of [-25,25]){screws.push({type:'sc8',p:add(TB(sx*XP,i),[0,0,dz]),n:nB,st:'sides'});C.sc8++;}   // на балке вдоль: посадочная врубка по уклону, 2 самореза
  }
  PB[i]=beam;
  for(const sx of [-1,1]){
   // подкос поперёк: снизу в грань стойки, сверху под балку
   const xf=sx*(XP-pw/2),yA=yU(xf)-Lw,tt=(yU(xf)-yA)/(1+sx*slope),A0=[xf,yA,z],B0=[xf-sx*tt,yA+tt,z],dir=norm([-sx,1,0]);
   const br=tmb({name:'Подкос из бруса (поперёк)',role:'wBrace',sec:secB,a:add(A0,mul(dir,-90)),b:add(B0,mul(dir,90)),up:[0,0,1],sx:100,sy:thB,cutA:{n:[1,0,0],p:[xf+sx*NT,0,0]},cutB:{n:nB,p:add(B0,mul(nB,15))},step:'brace',ends:['низ','верх'],notch:[beam,WP[`${i}${sx}`]],note:'врубка 15 мм в балку и в стойку'});br.mount=[0,0,i===nl?-1:1];br.mountLen=320;
   C.sc8+=4;
  }
  if(!gable&&!PG)E2s[0]=add(TB(xa),mul(nB,DP));
 });
 /* ---- балки вдоль и подкосы вдоль ---- */
 const bz=(sx,xs,pi,dz,yU,beam)=>{   // подкос вдоль: снизу в грань стойки, сверху под балку вдоль
  const zP=ZP[pi]+dz*pw/2,LZi=braceZ(yU-(yB(xs-sx*pw/2,pi)-Lw)),A0=[xs,yU-LZi,zP],B0=[xs,yU,zP+dz*LZi],dir=norm([0,1,dz]);
  const br=tmb({name:'Подкос из бруса (вдоль)',role:'wBrace',sec:secB,a:add(A0,mul(dir,-90)),b:add(B0,mul(dir,90)),up:[1,0,0],sx:100,sy:thB,cutA:{n:[0,0,1],p:[0,0,zP-dz*NT]},cutB:{n:[0,1,0],p:[0,yU+15,0]},step:'brace',ends:['низ','верх'],notch:[beam,WP[`${pi}${sx}`]],note:'врубка 15 мм в балку и в стойку'});br.mount=[sx,0,0];br.mountLen=320;
  C.sc8+=4;};
 for(const sx of [-1,1]){const xs=sx*XP;
  if(MONO){   // сплошная балка поверх стоек, с выпуском за крайние: лоток Т-коннектора должен быть занят с обеих сторон
   const yT=top(xs,0),ext=bP/2+ARM+4,pcs=cutsAt(ZP[nl]-ext,ZP[0]+ext,ZP.slice(1,-1).slice().reverse(),3000).map(([p0,p1],q,arr)=>({a:p0,b:p1,t:tmb({name:`Балка вдоль ${bP}×${bP}`,role:'sideBeam',sec:`w${bP}x${bP}`,a:[xs,yT+bP/2,p0+(q?1:0)],b:[xs,yT+bP/2,p1-(q<arr.length-1?1:0)],up:[0,1,0],step:'heads',ends:['зад','перед']})}));
   ZP.forEach((z,i)=>{for(const c of pcs)if(z>=c.a-1&&z<=c.b+1)PB[i].notch.push(c.t.id);});
   const at=z=>(pcs.find(c=>z>=c.a&&z<=c.b)||pcs[0]).t;
   for(let i=0;i<nl;i++)for(const [dz,pi] of [[1,i+1],[-1,i]])bz(sx,xs,pi,dz,yT,at(ZP[pi]+dz*(pw/2+Lw/2)));
  }else for(let i=0;i<nl;i++){
   const zb=ZP[i+1]+bP/2+(PG?1:2),zf=ZP[i]-bP/2-(PG?1:2),yT=PG?Math.min(top(xs,i),top(xs,i+1))-STEM-4:F+H+bP,yc=yT-bP/2;   // у перголы стойки разной высоты: балка вдоль горизонтальна, в торцевых коннекторах ниже верхнего узла
   const beam=tmb({name:`Балка вдоль ${bP}×${bP}`,role:'sideBeam',sec:`w${bP}x${bP}`,a:[xs,yc,zb],b:[xs,yc,zf],up:[0,1,0],step:'sides',ends:['зад','перед']});
   if(PG)for(const [zF,dz] of [[ZP[i+1]+bP/2,1],[ZP[i]-bP/2,-1]])cup({c:[xs,yc,zF],dir:[0,0,dz],b:bP,beam,bolts:zBolt,step:'posts',seq:sB+2,sst:'sides',cat:'connE',name:`Торцевой коннектор ${bP}×${bP}`,why:'U-образная чашка на грани стойки: балка вдоль опускается в неё сверху. Связывает порталы между собой.'});
   for(const [dz,pi] of [[1,i+1],[-1,i]])bz(sx,xs,pi,dz,yT-bP,beam);
  }}
}

/* ---------------- проверка деревянного каркаса — СП 64.13330.2017 ----------------
   R = Rᴬ·mдл·mв: снег mдл = 0,66, ветер — 0,8; φ — ф. (13), (14); сжатие с изгибом — ф. (37), (38);
   болт с пластинами снаружи — табл. 18 и п. 8.14, 8.16, 8.18: на шов смятие среднего элемента 0,5cd·kα·mдл·mв, изгиб 3,1d²·√(kα·mдл·mв) */
function verifyWood(c){
 const {m,row,kN,kNm,MPa,mm,Sd,S,muL,gR,ca,step,q,cfUp,Wup,G,Hx,Hz,Nmax,nPost,morePortals,ladder}=c,WS=WOODS[m.wood],TM=true,N_=m.poly||0;
 const Rb=d=>WS.RA*WS.kR*d*WMV,Rt=d=>WS.Rt*WS.kR*d*WMV*0.8,Rs=d=>WS.Rs*d*WMV,Rl=d=>4.5*WS.kR*d*WMV*(d>=WMW?1.15:1),E=WE*WMV,gW=gR+0.1; // +0,1 кПа — своя масса обрешётки и стропил
 const phi=l=>l<=70?1-0.8*(l/100)**2:3000/(l*l),sw=(b,h)=>({A:b*h,W:b*h*h/6,I:b*h**3/12,b,h});
 const boltT=(d,b,md,ka=1)=>{const c=b/10,D=d/10,k=md*WMV;return 2e3*Math.min(0.5*c*D*ka*k*WS.kR,3.1*D*D*Math.sqrt(ka*k*WS.kR));};   // стальные пластины снаружи: средний элемент 0,5cd, 2 шва
 const rowsW=[];
 // обрешётка
 const prS=m.wPur==='e150'?[50,150]:m.wPur==='e100'?[50,100]:[100,50],prNext=m.wPur==='e150'?null:{wPur:m.wPur==='e100'?'e150':'e100'};
 if(!m.pg){const L=N_?2*(m.R+m.ovh)*Math.sin(Math.PI/N_):m.sP,s=sw(prS[0],prS[1]),qd=(Sd*muL+1.1*gW)*ca*step/1000,qn=(S*muL+gW)*ca*step/1000,qu=(1.4*q*Math.abs(cfUp)*1.2-0.9*gR*ca)*step/1000,M=qd*L*L/8,Mu=qu*L*L/8,f=5*qn*L**4/(384*E*s.I);
  row('Обрешётка и фермы',`Обрешётка ${m.wPur?`50×${prS[1]} на ребро`:'50×100 плашмя'}: пролёт ${mm(L)}, шаг ${mm(step)}`,Math.max(M/s.W/Rb(WMS),Mu/s.W/Rb(WMW),f/(L/150)),`σ ${MPa(M/s.W)} из ${MPa(Rb(WMS))}, прогиб ${mm(f)} (≤ L/150)`,'снег: mдл = 0,66, улица под навесом: mв = 0,85',m.cov!=='tile'&&step>260?{purStep:Math.max(250,Math.floor(step/Math.max(1.01,Math.sqrt(M/s.W/Rb(WMS)),f/(L/150))/10)*10)}:(prNext||(N_?c.steeper():morePortals())));
  const T=Math.max(0,qu*L/2);row('Узлы','Обрешётка к балке: отрыв на 2 самореза 6×120',T/(2*1200),kN(T),'вырыв из бруса при заглублении ≥ 60 мм ≈ 1,2 кН');}
 else{const wp=m.pg.wp,st=m.pg.step,s5=sw(50,50),Lc=wp-100,qc=(Sd+1.1*gW)*ca*st/1000,qcn=(S+gW)*ca*st/1000,M=qc*Lc*Lc/8,f=5*qcn*Lc**4/(384*E*s5.I),s1=sw(50,100),L=m.sP,qr=(Sd+1.1*gW)*wp/2/1000,qrn=(S+gW)*wp/2/1000,Mr=qr*L*L/8,fr=5*qrn*L**4/(384*E*s1.I);
  row('Обрешётка и фермы',`Поперечина щита 50×50: пролёт ${mm(Lc)}, шаг ${mm(st)}`,Math.max(M/s5.W/Rb(WMS),f/(Lc/150)),`σ ${MPa(M/s5.W)}, прогиб ${mm(f)}`,'');
  row('Обрешётка и фермы',`Стропило щита 50×100: пролёт ${mm(L)}`,Math.max(Mr/s1.W/Rb(WMS),fr/(L/200)),`σ ${MPa(Mr/s1.W)}, прогиб ${mm(fr)}`,'',morePortals());}
 const qp=(Sd*muL+1.1*gW)*(N_?m.side/2:m.sP)/1000,qpn=(S*muL+gW)*(N_?m.side/2:m.sP)/1000;
 if(m.gable){const W=m.W,fr=W/2*Math.tan(ang_(m)),Hh=qp*W*W/(8*fr),Ls=W/2/ca/2,r=sw(100,m.RHT),Nr=Hh/ca,lm=Ls/(0.289*m.RHT),ph=phi(lm),xi=Math.max(0.2,1-Nr/(ph*Rb(WMS)*r.A)),Mr=qp*ca*Ls*Ls/8,sg=Nr/r.A+Mr/(xi*r.W),fn=5*qpn*ca*Ls**4/(384*E*r.I);
  row('Обрешётка и фермы',`Стропило фермы 100×${m.RHT}: изгиб ${kNm(Mr)} + сжатие ${kN(Nr)}`,Math.max(sg/Rb(WMS),fn/(Ls/200)),`σ ${MPa(sg)} из ${MPa(Rb(WMS))}, прогиб ${mm(fn)}`,'расчётный пролёт — от пяты до раскоса',morePortals());
 const An=m.beam.b*(m.beam.h-30);row('Обрешётка и фермы',`Затяжка ${m.beam.b}×${m.beam.h}: распор ${kN(Hh)}`,Hh/An/Rt(WMS),`σ ${MPa(Hh/An)} из ${MPa(Rt(WMS))}`,'нетто — за вычетом посадочной врубки 30 мм; ослабление mо = 0,8',morePortals());
  {const nS=m.heelS,Ts=2560*Math.sqrt(WMS*WMV);row('Узлы',`Пята фермы: ${nS} саморезов 8×160 держат распор`,Hh/(nS*Ts),`${kN(Hh)} из ${kN(nS*Ts)}`,'срез самореза ≤ 4d² = 2,56 кН (СП 64, табл. 18) × √(mдл·mв); пластин в узле нет',nS<8?{heelS:8}:morePortals());}
  const Ns=qp*W/4,Lst=Math.max(...m.parts.filter(p=>p.role==='strut').map(p=>p.cutLen),400),ps=phi(Lst/28.9);row('Обрешётка и фермы',`Раскос фермы 100×100: сжатие ${kN(Ns)}, длина ${mm(Lst)}`,Ns/(ps*1e4*Rb(WMS)),'','',morePortals());}
 else if(N_){const hp=m.hip,r=sw(hp.b,hp.h),R=m.R,Lh=(R+m.ovh)/ca,purl=m.parts.filter(p=>p.role==='purlinP').length,Wt=(Sd+1.1*gW)*c.plan*1000,Hr=Wt/N_/2/Math.tan(ang_(m)),Nh=Hr/ca,qh=(Sd*muL+1.1*gW)*m.side/2/1000,Ls=Lh*0.66,Mh=qh*Ls*Ls/8,lm=Ls/(0.289*hp.h),ph=phi(lm),xi=Math.max(0.2,1-Nh/(ph*Rb(WMS)*r.A)),sg=Nh/r.A+Mh/(xi*r.W),fh=5*(S*muL+gW)*m.side/2/1000*ca*Ls**4/(384*E*r.I);
  row('Обрешётка и фермы',`Ребро шатра ${hp.b}×${hp.h}: изгиб ${kNm(Mh)} + сжатие ${kN(Nh)}`,Math.max(sg/Rb(WMS),fh/(Ls/200)),`σ ${MPa(sg)} из ${MPa(Rb(WMS))}, прогиб ${mm(fh)}`,'треугольная грузовая площадь; ребро раскрепляют обрешётка и настил',hp.h<200?{wHip:'w50x200'}:c.steeper());
  const T=Hr/(2*Math.sin(Math.PI/N_)),An=(m.bP-13)*m.bP;
  row('Обрешётка и фермы',`Балка обвязки ${m.bP}×${m.bP}: растяжение от распора ${kN(T)}`,T/An/Rt(WMS),`σ ${MPa(T/An)} из ${MPa(Rt(WMS))}`,'кольцо обвязки держит рёбра от разъезда',c.steeper());
  row('Узлы','Угол обвязки: гнездо коннектора на растяжение',T/10200,`${kN(T)} из 10,2 кН`,'12 глухарей 6×60 по 0,85 кН: гнездо 210 мм, коннектор замыкает кольцо',c.steeper());
  {const Aw=30*hp.b/Math.max(0.5,Math.cos(ang_(m))),Ra=Rb(WMS)/(1+(Rb(WMS)/Rl(WMS)-1)*Math.sin(ang_(m))**3),Ts=2560*Math.sqrt(WMS*WMV),Rv=Aw*Ra+4*Ts;row('Узлы',`Ребро на углу обвязки: врубка 30 мм + 4 самореза 8×160, ${kN(Nh)}`,Nh/Rv,`из ${kN(Rv)}`,'распор ребра садится во врубку, саморезы держат от сдвига и отрыва',c.steeper());}}
 else{const b=sw(m.beam.b,m.beam.h),Lb=m.W-2*(m.Lw+60),cL=(m.ovh||300)+60,M=Math.max(qp*Lb*Lb/8,qp*cL*cL/2),Q=qp*Lb/2,tau=1.5*Q/b.A,f=5*qpn*Lb**4/(384*E*b.I);
  row('Обрешётка и фермы',`Балка портала ${b.b}×${b.h}: пролёт ${mm(Lb)}, вылет ${mm(cL)}`,Math.max(M/b.W/Rb(WMS),tau/Rs(WMS),f/(Lb/200)),`σ ${MPa(M/b.W)} из ${MPa(Rb(WMS))}, τ ${tau.toFixed(2).replace('.',',')} МПа, прогиб ${mm(f)}`,'балка опирается на стойки и подкосы; сечение под коннектор: 100×100 или 150×150',b.h<150?{wPost:150}:morePortals());}
 // рамы: подкосы на сжатие, стойка — изгиб у подкоса
 const nFx=N_?N_/2:Math.max(2,m.nP-1),nFz=N_?N_/2:2*(m.nP-1),Lw=m.Lw,thB=N_?50:100,brUp=null;
 const postH=N_?m.yRb-m.F:m.H,yHinge=TM?m.yS+8:68,yb=m.F+postH-Lw-yHinge+(!N_&&!m.gable&&!m.pg?m.bP:0),Tu=Math.max(0,1.4*Wup*1.3-0.9*G)/nPost;
 for(const [H,nFr,lbl] of N_?[[Hx,nFx,'по кругу']]:[[Hx,nFx,'поперёк'],[Hz,nFz,'вдоль']]){
  const brZ=lbl==='вдоль'?m.parts.filter(p=>p.name==='Подкос из бруса (вдоль)').map(p=>p.cutLen):[],Lb0=brZ.length?Math.min(Lw,Math.min(...brZ)*Math.SQRT1_2-30):Lw,V=H/nFr/2,ybr=lbl==='вдоль'?yb+Lw-Lb0+(m.zOff||0):yb,Mn=V*ybr,Nb=Mn/Lb0/Math.SQRT1_2;
  if(TM){const b=m.bP,s=sw(b,b),l=2*ybr/(0.289*b),ph=phi(l),xi=Math.max(0.2,1-Nmax/(ph*Rb(WMW)*s.A)),kn=((b-15)/b)**2,sg=Nmax/s.A+Mn/(xi*s.W*kn);
   row('Каркас',`Стойка из бруса ${b}×${b}, ветер ${lbl}: N ${kN(Nmax)} + M ${kNm(Mn)}`,Math.max(sg/Rb(WMW),Nmax/(ph*s.A*Rb(WMS))),`σ ${MPa(sg)} из ${MPa(Rb(WMW))}, гибкость ${Math.round(l)}`,`шарнир на ${m.FW?'обвязке':'ножке'}, подкос сверху; устойчивость — μ = 2; ветер: mдл = 0,8`,b<150?{wPost:150}:morePortals());}
  const Lb=Lb0*Math.SQRT2+40,s=sw(100,thB),l=Lb/(0.289*thB),ph=phi(l),A=thB*15/Math.SQRT1_2,Ra=Rb(WMW)/(1+(Rb(WMW)/Rl(WMW)-1)*0.354);
  row('Каркас',`Подкос из бруса 100×${thB} (${lbl}): сжатие ${kN(Nb)}, длина ${mm(Lb)}`,Math.max(Nb/(ph*s.A*Rb(WMW)),Nb/A/Ra),`врубка 15 мм: смятие ${MPa(Nb/A)} из ${MPa(Ra)}`,'работает на сжатие: при смене ветра сжат другой подкос рамы',brUp||(m.bP<150?{wPost:150}:morePortals()));
  {const Vj=Math.hypot(V,Tu);row('Узлы',`Коннектор на стойке (${lbl}): ${kN(Vj)}`,Vj/6800,'из 6,8 кН','гнездо стали 2 мм, 8 глухарей 6×60 по 0,85 кН (СП 64, табл. 18); нагрузок изделий производители не публикуют',m.bP<150?{wPost:150}:morePortals());
   if(!N_&&lbl==='вдоль'){const Tz=Mn/Lb0,Rz=!m.pg?5100:m.zBolt?2*boltT(12,m.bP,WMW):3400;row('Узлы',`Балка вдоль в коннекторе: ${kN(Tz)}`,Tz/Rz,`из ${kN(Rz)}`,!m.pg?'6 глухарей 6×60 в лотке':m.zBolt?'2 болта M12 насквозь через чашку и балку':'4 глухаря 6×60 в чашке',m.pg&&!m.zBolt?{zBolt:1}:m.bP<150?{wPost:150}:morePortals());}}
  {const Vf=Math.hypot(V,Tu);row('Узлы',`Стойка в опорном коннекторе (${lbl}): ${kN(Vf)}`,Vf/6800,'из 6,8 кН','8 глухарей 6×60',m.bP<150?{wPost:150}:morePortals());
   if(!m.FW){const ss=secOf(m.postSec),Ms=V*(m.yS-68),uu=Ms/(ss.Wx*RY)+Nmax/(ss.A*RY);row('Каркас',`Стальная ножка ${m.postSec.replace(/x/g,'×')}: M ${kNm(Ms)} (${lbl})`,uu,'','консоль от опорной пластины',ladder());}}
 }
 if(!m.FW){const V=Math.max(Hx/nFx,Hz/nFz)/2,beta=m.baseFixed?1:0.5,bp=TM?V*(m.yS-68):V*yb*beta/2;c.setMb&&c.setMb(bp);const Tst=bp/90/2+Math.max(0,1.4*Wup-0.9*G)/nPost/4,Rst=m.studs88?34000:13500;
  row(m.free?'Основание':'Фундамент',`Шпильки M12 опорной пластины: момент ${kNm(bp)} + отрыв`,Tst/Rst,kN(Tst)+' на шпильку',m.studs88?'класс 8.8 ≈ 34 кН':'класс 4.8, As = 84 мм² ≈ 13,5 кН',m.studs88?morePortals():{studs88:true});}
 if(!N_)row('Узлы','Балка в лотке коннектора: отрыв ветром',Tu/5100,`${kN(Tu)} из 5,1 кН`,'6 глухарей 6×60 по 0,85 кН: глухарь работает на срез через стенку лотка',m.bP<150?{wPost:150}:morePortals());
 {const Ac=m.bP*m.bP*(N_?0.7:1);row('Узлы','Балка на стойке: смятие поперёк волокон',Nmax/Ac/Rl(WMS),`${MPa(Nmax/Ac)} из ${MPa(Rl(WMS))}`,'местное смятие в опорных частях, табл. 3, п. 4а',TM&&m.bP<150?{wPost:150}:(N_?c.steeper():morePortals()));}
 return{yb};
}
const ang_=m=>m.ang*RAD;

/* ---- шатёр: стойка уходит в коннектор угла, балки обвязки — в его гнёзда, ребро садится на угол врубкой между щёк ---- */
function woodPolyFrame(V){
 const {cfg,X,N,Vk,PHI,PSI,POST,WPOST,yRb,yRt,yS,CAP,TM,FW,bP,Lw,Cr,hipTop}=V;
 const {C}=X,{tmb,postBase,conn}=woodKit(X,cfg),sB=FW?-1:1;   // ножка, опорный коннектор, стойка, верхние гнёзда — снизу вверх
 for(let k=0;k<N;k++){
  const f=PHI(k),r=rv(f),t=tv(f),P=Vk(k),tp=yRb,post=POST[k];
  postBase({x:P[0],z:P[2],y:yS+CAP,u:r,n:t,b:bP,step:'posts',md:FW?'loose':post.module,seq:sB});if(FW)C.sc8+=4;
  WPOST[k]=tmb({name:`Стойка из бруса ${bP}×${bP} (${k+1})`,role:'postW',sec:`w${bP}x${bP}`,a:[P[0],yS+CAP,P[2]],b:[P[0],tp,P[2]],up:t,step:'posts',seq:sB+1,ends:['низ','верх'],note:'торцы пропитать составом для торцов'});
  // коннектор угла: гнездо на верх стойки и два гнезда под балки обвязки; угол не 90°, поэтому под заказ
  conn({p:[P[0],tp,P[2]],b:bP,e1:r,e2:t,miter:Math.PI/N,arms:[tv(PSI(k)),mul(tv(PSI(k-1)),-1)].map(d=>({d,L:160,rows:3,sst:'sides',out:r})),step:'posts',seq:sB+2,name:`Коннектор угла ${N}-гранника ${bP}×${bP}`,cat:'connP',size:`угол ${N===6?120:135}°, сталь 2 мм`,why:'Цельная деталь на верху стойки: стойка входит снизу, балки обвязки ложатся в лотки сверху. Угол не 90°, поэтому под заказ. Кольцо держит распор шатра, поэтому в каждый лоток 12 глухарей.'});
 }
 for(let j=0;j<N;j++){
  const k0=j,k1=(j+1)%N,c=tv(PSI(j)),nO=rv(PSI(j)),A=Vk(k0),B=Vk(k1),t0=tv(PHI(k0)),t1=tv(PHI(k1));
  const beam=tmb({name:`Балка обвязки ${bP}×${bP}`,role:'ring',sec:`w${bP}x${bP}`,a:add(A,[0,yRb+bP/2,0]),b:add(B,[0,yRb+bP/2,0]),up:[0,1,0],cutA:{n:t0,p:add(A,mul(t0,1))},cutB:{n:t1,p:add(B,mul(t1,-1))},step:'sides',ends:['торец','торец'],note:'торцы «на ус» по оси стойки'});
  for(const [k,dir,nm,sg] of [[k0,c,'n',1],[k1,mul(c,-1),'p',-1]]){
   // подкос в плоскости стороны: 50×100, врубка в балку и в грань стойки
   const fn=mul(tv(PHI(k)),sg),off=bP/2/Math.max(0.3,dot(dir,fn)),foot=add(Vk(k,yRb-Lw),mul(dir,off)),d=norm(add(dir,[0,1,0])),top=add(foot,add(mul(dir,Lw),[0,Lw,0]));
   const br=tmb({name:'Подкос из бруса 50×100',role:'wBrace',sec:'w50x100',a:add(foot,mul(d,-90)),b:add(top,mul(d,90)),up:nO,sx:100,sy:50,cutA:{n:fn,p:add(foot,mul(fn,-15))},cutB:{n:[0,1,0],p:[0,yRb+15,0]},step:'brace',ends:['низ','верх'],notch:[beam,WPOST[k]],note:'врубка 15 мм в балку и в грань стойки'});br.mount=nO;br.mountLen=320;
   C.sc8+=4;
  }
 }
}

/* ---------------- долговечность: факторный метод ISO 15686-1 ----------------
   Срок = опорный срок × A (материал) × B (конструктив) × C (качество работ) × E (среда) × G (обслуживание).
   Опорные сроки — оценка по классам применения EN 335/EN 350 (брус) и ISO 12944 / ISO 9223 C2–C3 (сталь с покраской, с обновлением).
   Это прогноз для сравнения вариантов, а не гарантия: он верен только при обслуживании по графику */
const RSL={steel:40,timberPost:{pine:20,glulam:25,larch:30},timberRoof:{pine:30,glulam:35,larch:42}};
const WA={pine:0.9,glulam:1.1,larch:1.15},DECK_L={pine:12,larch:20,wpc:25},GAS_L=14;  // GAS_L — оценка: газоблок под мастикой на плите, над землёй
const coverLife=c=>({tile:27,c20:27,falc:40,shingle:25,ondulin:18,pcm:17,pc:12}[c]||25);
function durability(m,b){
 const cfg=m.cfg,wood=cfg.wood,mat=cfg.mat||'steel',tw=(+String(m.postSec||'60x60x2').split('x').pop())||2,fT=tw>=4?1.35:tw>=3?1.2:1,C_=0.9,el=[];
 const ln=(n,life,note,lim,low)=>el.push({n,life:Math.round(life),note,lim:lim!==false,low:!!low});
 if(m.FW)ln(`Обвязка и балки пола из бруса (${WOODS[wood].s.toLowerCase()})`,RSL.timberPost[wood]*WA[wood]*0.9*C_*1.1,'над землёй на 150 мм, с вентиляцией снизу: B = 0,9; антисептик раз в 12 лет',true,true);
 else ln(mat==='steel'?'Стойки ниже настила, балки пола':mat==='timber'?'Стальные пяты стоек':'Стальные ножки и всё ниже настила',RSL.steel*fT*1.1*C_*0.85,'зона брызг и снега у земли: E = 0,85; подкрашивать по графику',true,true);
 if(mat==='steel')ln('Каркас и крыша (сталь)',RSL.steel*fT*1.1*C_,'закрытые торцы, дренаж стоек; краска — раз в 8 лет');
 if(mat!=='steel')ln(`Стойки из бруса (${WOODS[wood].s.toLowerCase()})`,RSL.timberPost[wood]*WA[wood]*1.3*C_*1.1,'торец над настилом, коннектор и свес от дождя: B = 1,3; масло раз в 4 года');
 if(mat!=='steel')ln(`Балки, фермы, обрешётка (${WOODS[wood].s.toLowerCase()})`,RSL.timberRoof[wood]*WA[wood]*1.2*C_*1.1,'под кровлей, без прямого дождя');
 if(m.free)ln(m.base.gas?'Столбики из газоблоков':'Рама основания в щебне',m.base.gas?GAS_L:RSL.steel*1.2*1.1*C_*0.8,m.base.gas?'только под гидроизоляцией и над землёй; без защиты блок размораживается за несколько зим':'щебень сушит трубу, но краска у земли стареет быстрее: E = 0,8',true,true);
 ln('Кровля',coverLife(m.cov),'заменяется отдельно, каркас остаётся',false);
 if(m.isFloor)ln('Настил',DECK_L[cfg.deck]||12,'доски меняются по одной',false);
 const stru=el.filter(e=>e.lim),lim=stru.reduce((a,e)=>e.life<a.life?e:a,stru[0]),top=stru.filter(e=>!e.low),limT=top.reduce((a,e)=>e.life<a.life?e:a,top[0]),low=stru.filter(e=>e.low).reduce((a,e)=>e.life<a.life?e:a);
 // обслуживание за 30 лет, ₽ — по ценам материалов сметы, своими руками
 const sum=f=>b.lines.filter(f).reduce((s,l)=>s+l.sum,0),paint=sum(l=>['paint','paint27','zinc','solvent'].includes(l.key)),oil=sum(l=>l.key==='woodOilExt'),anti=sum(l=>l.key==='antisept2'),roof=sum(l=>l.cat==='Кровля'),deck=m.isFloor?sum(l=>l.cat==='Пол'):0,maint=[];
 const add1=(n,every,rub)=>{const times=Math.max(0,Math.ceil(30/every)-1);if(times&&rub)maint.push({n,every,times,rub:Math.round(rub*times)});};
 add1('Подкраска стали',8,paint*(mat==='steel'?0.6:0.3));
 if(oil)add1('Масло по брусу, 2 слоя',4,oil);
 if(anti)add1('Антисептик',12,anti);
 add1('Замена кровли',coverLife(m.cov),roof);
 if(deck)add1('Замена настила',DECK_L[cfg.deck]||12,deck);
 if(m.free&&m.base.gas)add1('Замена газоблоков',GAS_L,sum(l=>['gasblock','gasGlue','gasMastic'].includes(l.key))+1500);
 const maint30=maint.reduce((s,x)=>s+x.rub,0);
 return{life:lim.life,lim:lim.n,lifeTop:limT.life,limTop:limT.n,lifeLow:low.life,elems:el,maint,maint30,own30:Math.round(b.total+maint30)};
}
/* ---------------- основание без фундамента ----------------
   Вместо столбов — сварная рама. Всё выше рамы не меняется: стойка садится на те же 4 шпильки, только они приварены к столику рамы.
   Рама связывает опоры в одно целое: опора может подняться или просесть, а стойки не разъедутся
   (связь опор балками — п. 8.2.9 пособия Минстроя «Проектирование оснований фундаментов на пучинистых грунтах», 2019).
   Рама лежит на плите через стальные подкладки: уровень — подкладками, после пучения — домкрат и подкладка. Опоры:
   slab — бетонная плита на щебне; gas — блоки рядом над землёй (блок обязан оставаться сухим: СТО НААГ 3.1-2013, п. 6.1.2–6.1.3).
   От ветра держит anchor — винтовой анкер (несущая способность — СП 24.13330, п. 7.2.10), или weight — вес плит, стянутых со своей опорой. */
const SOILS={  // α, c, γc — СП 24.13330, табл. 7.9, 7.10; R и εfh — оценка для верхнего слоя; hl — горизонталь на один анкер, кН/1000
 sand:{t:'Песок, супесь',s:'песок',a1:29.5,a2:16.5,c:1,gc:0.6,R:150,eps:0.008,hl:500},
 loam:{t:'Суглинок плотный',s:'суглинок',a1:10.1,a2:4.5,c:18,gc:0.7,R:120,eps:0.03,hl:1000},
 clay:{t:'Глина, мокрый участок',s:'глина',a1:7.8,a2:2.8,c:10,gc:0.7,R:80,eps:0.075,hl:700}};
const FNDS={pillar:{t:'Столбы',sub:'бетон на 1,2 м, ниже промерзания'},slab:{t:'Плиты',sub:'рама на плитах по щебню, без бетона и ям'},gas:{t:'Газоблоки',sub:'рама на столбиках из блоков над землёй; от ветра блок не держит — сваи всё равно нужны, поэтому дороже плит'}};
const HOLDS={anchor:{t:'Сваи-анкеры',sub:'ВСК 57, вкручиваются в грунт'},weight:{t:'Пригруз',sub:'ничего в грунт: вес плит на раме'}};
const BLK={L:600,W:300,H:200};  // блок D600 B3,5; блоки кладут рядом, а не стопкой: растёт площадь и устойчивость, высота та же
const SLAB={S:500,T:70,kg:40},HELIX={d:200,h:1400,shaft:57,L:1500},MAX_SLABS=6,DF=1400,SU=50;  // DF — глубина промерзания, SU — предельный подъём (табл. Б.1)
const anchorRd=s=>{const S=SOILS[s],A=Math.PI*(HELIX.d**2-HELIX.shaft**2)/4e6,F0=(S.a1*S.c+S.a2*18*HELIX.h/1000)*A;return{F0,Fd:S.gc*F0/1.4*1000};};  // Н
const secDim=s=>s.split('x').map(Number);
const boltTW=(d,b,md,ka,WS)=>{const c=b/10,D=d/10,k=md*WMV;return 2e3*Math.min(0.5*c*D*ka*k*WS.kR,3.1*D*D*Math.sqrt(ka*k*WS.kR));};  // болт с пластинами снаружи, Н: СП 64, табл. 18
// вертикальная раскладка опоры, мм. y = 0 — земля проекта; у газоблоков земля ниже, на y0: вся беседка поднята над ней
function baseLev(cfg){const $=cfg.$||{},FW=cfg.mat==='timber'&&cfg.base==='floor',bS=Math.max($.wPost||100,$.wSill||100),sec=FW?`w${bS}x${bS}`:$.ringSec||'80x40x3',[hR,bR,tR]=FW?[bS,bS,0]:secDim(sec),yT=FW?230:34,yB=yT-hR,yP=FW?yB-2:yB-20,gas=cfg.fnd==='gas',nB=gas?cfg.blocks:0,
  n0=FW?3:1,n=Math.max(n0,$.pads||1),yS=yP-(gas?BLK.H:0),y0=gas?yS-60:FW?yP-n0*SLAB.T:0,hT=hR-40,yTg=yT-3-hT/2;return{FW,sec,hR,bR,tR,yT,yB,yP,gas,nB,n,n0,yS,y0,hT,yTg,js:FW?bS/2+28:60};}  // yP — верх опоры: брус лежит на гидроизоляции, рама — на пластине 8 мм и подкладках 12 мм; n0 — плит минимум: у бруса стопка держит 150 мм над землёй
// разбить линию рамы на куски не длиннее кузова: стык — только над узлом с опорой
function splitLine(a,b,nodes,mx){const out=[];let s=a;const ns=nodes.slice().sort((p,q)=>p-q);
 while(b-s>mx){const c=ns.filter(x=>x+30-s<=mx&&x>s+150);if(!c.length)break;const x=c[c.length-1];out.push([s,x+30,x]);s=x+80;}out.push([s,b,null]);return out;}
function baseKit(X,cfg){
 const {box,push,tube,mod,bolt,ringWeld,weld,tongue}=X,L=baseLev(cfg),S=[],A=[],feet=[];
 const steel=(o)=>box(Object.assign({mat:'steel',cat:'plate6',step:'ring',layer:'frame'},o));
 const plan=(c,u,v,w,h,t,o)=>box(Object.assign({c,ax:u,ay:v,w,h,t},o));
 // столик: на него садятся шпильки стойки; приварен к раме дома
 function table(x,z,u,v,w,h,md,nd){const t=steel({name:`Столик рамы ${w}×${h}×10`,role:'nodePlate',c:[x,L.yT+5,z],ax:u,ay:v,w,h,t:10,module:md});ringWeld([x,L.yT,z],u,v,Math.min(w,L.bR),Math.min(h,L.bR),'Шов столик — рама','ring',md);for(const s of nd.st){s.module=md;}return t;}
 // опора под раму: плита или блоки. Брус лежит прямо на ней через гидроизоляцию и нагель, стальная рама — на подпятнике и подкладках
 function foot(x,z,u,v,md,nd){feet.push(nd);
  if(md&&!L.FW){steel({name:'Подпятник рамы 170×80×8',role:'jackPlate',c:[x,L.yB-4,z],ax:u,ay:v,w:170,h:80,t:8,module:md});
   push({kind:'box',name:'Подкладки стальные 120×80, набор на 12 мм',role:'shim',c:[x,L.yB-14,z],ax:u,ay:v,az:[0,1,0],w:120,h:80,t:12,mat:'galv',layer:'found',step:'ring',cat:'shimSet',module:'loose',seq:-3});}
  if(L.FW){push({kind:'box',name:'Гидроизоляция: рубероид в 2 слоя',role:'dpc',c:[x,L.yP+1,z],ax:u,ay:v,az:[0,1,0],w:L.bR+40,h:320,t:2,mat:'grout',layer:'found',step:'ring',cat:null,module:'loose',seq:-3});
   S.push(push({kind:'stud',d:16,name:'Нагель M16: обвязка к опоре',role:'tieRod',a:[x,L.yP-90,z],b:[x,L.yT-6,z],nuts:[L.yT-28],washers:[],layer:'hw',step:'ring',mat:'galv',cat:'jack'}));}
  if(L.gas)for(let i=0;i<L.nB;i++){const off=L.nB===2?(i?BLK.W/2:-BLK.W/2):0;push({kind:'box',name:`Газоблок ${BLK.L}×${BLK.W}×${BLK.H} D600 B3,5`,role:'gasBlock',c:add([x,L.yS+BLK.H/2,z],mul(v,off)),ax:u,ay:v,az:[0,1,0],w:BLK.L,h:BLK.W,t:BLK.H,mat:'gasblock',layer:'found',step:'found',cat:'gasblock',module:'loose'});}
  const nS=L.gas?0:nd.kind==='post'?L.n:L.n0;for(let i=0;i<nS;i++){const y=L.yS-(i+0.5)*SLAB.T;push({kind:'box',name:`Плита ${SLAB.S}×${SLAB.S}×${SLAB.T}${nS>1?` (стопка, №${i+1})`:''}`,role:'pad',c:[x,y,z],ax:u,ay:v,az:[0,1,0],w:SLAB.S,h:SLAB.S,t:SLAB.T,mat:'concrete',layer:'found',step:'found',cat:'slab',module:'loose'});}
  const tied=cfg.hold==='weight'&&nd.kind==='post'&&nS>L.n0-(L.FW?0:0)&&!L.gas&&nS>1,yEnd=L.yS-nS*SLAB.T;
  if(tied){const yBot=yEnd-8;plan([x,yBot+4,z],u,v,240,120,8,{name:'Нижняя пластина стяжки 240×120×8',role:'jackFoot',mat:'steel',cat:'plate6',step:'found',layer:'found',module:'loose'});
   for(const s of L.FW?[0]:[-60,60]){const q=add([x,0,z],mul(u,s));S.push(push({kind:'stud',d:16,name:'Стяжная шпилька M16 (насквозь через плиты)',role:'tieRod',a:[q[0],yBot-16,q[2]],b:[q[0],L.FW?L.yT-6:L.yB+30,q[2]],nuts:[yBot-16,L.FW?L.yT-28:L.yB],washers:[],layer:'hw',step:'found',mat:'galv',cat:'jack'}));}}
  // щебёночная подушка 200 мм — только под плитой; под трубами рамы узкая траншея с рыхлым щебнем (см. trench)
  plan([x,L.gas?yEnd-130:yEnd-(tied?108:100),z],[1,0,0],[0,0,1],L.gas?800:700,L.gas?800:700,L.gas?260:200,{name:L.gas?'Подушка: щебень 20–40, верх на 60 мм выше земли':'Подушка: щебень 20–40, трамбовка',role:'cushion',mat:'gravel',layer:'found',step:'found',cat:'gravel',module:'loose'});}
 // траншея и обратная засыпка вдоль линии рамы
 function trench(a,b){if(L.gas||L.FW)return;const d=sub(b,a),l=len(d),u=norm(d),v=[-u[2],0,u[0]],c=[(a[0]+b[0])/2,0,(a[2]+b[2])/2];
  const yc=L.yB-150,yt=cfg.base==='floor'?10:30;plan([c[0],(yc+yt)/2,c[2]],u,v,l,300,yt-yc,{name:'Засыпка траншеи рыхлым щебнем: зазор под рамой 150 мм',role:'backfill',mat:'gravel',layer:'found',step:'brace',cat:'gravel',module:'loose'});}
 // анкер: свая ВСК 57 Л200 с приварной крышкой и шпилькой M20. Вкручивается до рамы; промах до ±15 мм выбирает отверстие Ø40 в ушке под шайбой-пластиной
 function anchor(q,u,out,md,i){const y=L.FW?L.yB-6:L.yB+6,top=y-70,yN=L.FW?y+6:y+14;A.push({x:q[0],z:q[2]});
  const r=add(q,mul(out,L.FW?L.js:L.bR/2+35)),m0={layer:'found',step:'ring',seq:-1};
  if(!L.FW){const lg=steel({name:'Ушко анкера 70×100×12',role:'lug',c:add(q,add(mul(out,L.bR/2+35),[0,y,0])),ax:out,ay:u,w:70,h:100,t:12,module:md});lg.holes.push({x:0,y:0,d:40});
   X.box({name:'Шайба-пластина анкера 70×70×8',role:'lug',mat:'steel',cat:'plate6',c:[r[0],y+10,r[2]],ax:out,ay:u,w:70,h:70,t:8,step:'ring',seq:1,module:'loose',layer:'frame'}).holes.push({x:0,y:0,d:22});}
  push(Object.assign({kind:'cyl',name:`Свая винтовая ВСК ${HELIX.shaft} Л${HELIX.d} 1,5 м`,role:'helix',c:[r[0],top-HELIX.L,r[2]],r:HELIX.shaft/2,h:HELIX.L,mat:'galv',cat:null},m0));
  push(Object.assign({kind:'cyl',name:`Лопасть сваи Ø${HELIX.d}`,role:'helix',c:[r[0],top-HELIX.L,r[2]],r:HELIX.d/2,h:6,mat:'galv',cat:null},m0));
  X.box({name:'Крышка сваи 80×80×8',role:'lug',mat:'steel',cat:'plate6',c:[r[0],top+4,r[2]],ax:out,ay:u,w:80,h:80,t:8,step:'ring',seq:-1,module:'loose',layer:'found'});
  return push(Object.assign({kind:'stud',d:20,name:'Шпилька M20 на крышке сваи',role:'anchor',a:[r[0],top+8,r[2]],b:[r[0],yN+30,r[2]],nuts:[yN],washers:[],mat:'galv',cat:'anchor'},m0));}
 return{L,S,A,feet,steel,plan,table,foot,trench,anchor};
}
function buildBaseRect(X,cfg,o){
 const {tube,mod,bolt,tongue,weld}=X,K=baseKit(X,cfg),L=K.L,{XP,ZP,W,D,TR}=o,FN=X.FN,nl=ZP.length-1,$=cfg.$||{},mx=TR.L-150,yC=L.yT-L.hR/2,anc=cfg.hold==='anchor'?($.anc||1):0;
 const pieces=[],tu=(nm,a,b,md,c)=>tube({name:nm,role:'baseBeam',sec:L.sec,a,b,up:[0,1,0],sx:L.bR,sy:L.hR,step:'ring',module:md,caps:c||[true,true],ends:['торец','торец'],layer:'frame',note:'низ трубы — дренаж Ø8 у торцов'});
 // лонжероны — неразрезные по стойкам: при потере опоры стойка повисает на них
 for(const sx of [-1,1]){const x=sx*XP,sp=splitLine(ZP[nl]-30,ZP[0]+30,ZP.slice().reverse().slice(1,-1),mx);
  sp.forEach(([a,b,nz],j)=>{const md=mod(`baseS${sx<0?'L':'R'}${j}`,`Лонжерон рамы: ${sx<0?'лев.':'прав.'}${sp.length>1?` ${j+1}`:''}`),t=tu(`Лонжерон рамы ${L.sec.replace(/x/g,'×')} (${sx<0?'лев.':'прав.'})`,[x,yC,a],[x,yC,b],md,[j===0,nz==null]);pieces.push({x,a,b,md,t});
   if(j>0){const prev=pieces[pieces.length-2],tg=tongue({name:`Язык стыка лонжерона 110×${L.hT}×8`,c:[x,L.yTg,a-25],ax:[0,0,1],ay:[0,1,0],w:110,h:L.hT,t:8,root:[x,L.yTg,a-80],rootAx:[0,1,0],rootLen:L.hT,md:prev.md,step:'ring'});
    bolt({d:12,p:[x-L.bR/2,L.yTg,a+28],dir:[1,0,0],grip:L.bR,thru:[t,tg],step:'ring',joint:'стык лонжерона (язык в пропил)'});}});}
 const onSkid=(x,z)=>pieces.find(p=>Math.abs(p.x-x)<1&&z>=p.a-1&&z<=p.b+1);
 // поперечины — на языках лонжеронов, опускаются сверху между столиками; у входа и под полом на них стоят стойки входа и балки пола
 ZP.forEach((z,i)=>{const x0=-XP+80,x1=XP-80,ns=FN.filter(n=>Math.abs(n.z-z)<1&&Math.abs(Math.abs(n.x)-XP)>1).map(n=>n.x);if(x1-x0>mx&&!ns.length){FN.push({x:0,z,kind:'mid',st:[]});ns.push(0);}
  const sp=splitLine(x0,x1,ns,mx);let prev=null;
  sp.forEach(([a,b,nx],j)=>{const md=mod(`baseC${i}_${j}`,`Поперечина рамы ${i+1}${sp.length>1?`.${j+1}`:''}`),t=tu(`Поперечина рамы ${L.sec.replace(/x/g,'×')} (${i+1})`,[a,yC,z],[b,yC,z],md,[false,nx!=null]);t.note='в торцах — пропил 9 мм снизу под язык 8 мм; низ — дренаж Ø8';
   for(const n of FN)if(Math.abs(n.z-z)<1&&n.x>=a-1&&n.x<=b+1&&Math.abs(Math.abs(n.x)-XP)>1){n.md=md;}
   if(j===0){const s=onSkid(-XP,z),tg=tongue({name:`Язык поперечины 205×${L.hT}×8`,c:[-XP+25+102.5,L.yTg,z],ax:[1,0,0],ay:[0,1,0],w:205,h:L.hT,t:8,root:[-XP+25,L.yTg,z],rootAx:[0,1,0],rootLen:L.hT,md:s.md,step:'ring'});for(const dx of [25,125])bolt({d:12,p:[a+dx,L.yTg,z-L.bR/2],dir:[0,0,1],grip:L.bR,thru:[t,tg],step:'ring',joint:'поперечина рамы — лонжерон (язык в пропил, 2 болта)'});}
   else{const tg=tongue({name:`Язык стыка поперечины 110×${L.hT}×8`,c:[a-25,L.yTg,z],ax:[1,0,0],ay:[0,1,0],w:110,h:L.hT,t:8,root:[a-80,L.yTg,z],rootAx:[0,1,0],rootLen:L.hT,md:prev.md,step:'ring'});bolt({d:12,p:[a+28,L.yTg,z-L.bR/2],dir:[0,0,1],grip:L.bR,thru:[t,tg],step:'ring',joint:'стык поперечины (язык в пропил)'});}
   if(j===sp.length-1){const s=onSkid(XP,z),tg=tongue({name:`Язык поперечины 205×${L.hT}×8`,c:[XP-25-102.5,L.yTg,z],ax:[1,0,0],ay:[0,1,0],w:205,h:L.hT,t:8,root:[XP-25,L.yTg,z],rootAx:[0,1,0],rootLen:L.hT,md:s.md,step:'ring'});for(const dx of [25,125])bolt({d:12,p:[b-dx,L.yTg,z-L.bR/2],dir:[0,0,1],grip:L.bR,thru:[t,tg],step:'ring',joint:'поперечина рамы — лонжерон (язык в пропил, 2 болта)'});}
   prev={md};});
  K.trench([-XP,0,z],[XP,0,z]);});
 for(const sx of [-1,1])K.trench([sx*XP,0,ZP[nl]],[sx*XP,0,ZP[0]]);
 // узлы
 for(const n of FN){const onS=Math.abs(Math.abs(n.x)-XP)<1,md=onS?onSkid(n.x,n.z).md:n.md,u=onS?[1,0,0]:[0,0,1],v=onS?[0,0,1]:[1,0,0];
  if(n.kind!=='mid')K.table(n.x,n.z,[1,0,0],[0,0,1],n.kind==='post'?150:120,150,md,n);
  if(n.kind==='newel'&&!o.isFloor)continue;K.foot(n.x,n.z,u,v,md,n);}
 // анкеры — у стоек; угловые вкручиваются ближе к середине лонжерона
 if(anc)for(const n of FN.filter(q=>q.kind==='post')){const sx=Math.sign(n.x),corner=Math.abs(Math.abs(n.z)-Math.abs(ZP[0]))<1,s0=n.z>0?-1:1;if(anc===1&&!corner)continue;   // 1 — только углы, 2 — у всех стоек, 3 — по два
  for(let i=0;i<(anc===3?2:1);i++){const s=i&&!corner?-s0:s0,off=i&&corner?520:300,z=n.z+s*off;K.anchor([n.x,0,z],[0,0,1],[sx,0,0],onSkid(n.x,z).md,i);}}
 return K;
}
function buildBasePoly(X,cfg,o){
 const {tube,mod,bolt,box,weld}=X,K=baseKit(X,cfg),L=K.L,{N,R,V,tv,rv,PHI,PSI,TR,FRONT}=o,FN=X.FN,side=2*R*Math.sin(Math.PI/N),yC=L.yT-L.hR/2,$=cfg.$||{},anc=cfg.hold==='anchor'?($.anc||1):0;
 // кольцо из дуг: сторона за стороной, стык на фланце в середине стороны. Дуга — самая длинная, что ложится в кузов
 const arcFits=m=>{const pts=[];const s0=0;for(let i=0;i<=m;i++)pts.push(V(s0+i));const mid=(a,b)=>[(a[0]+b[0])/2,0,(a[2]+b[2])/2];pts.push(mid(V(-1),V(0)),mid(V(m),V(m+1)));
  let best=1e12,bw=0;for(let a=0;a<180;a+=5){const c=Math.cos(a*RAD),s=Math.sin(a*RAD),u=pts.map(p=>p[0]*c+p[2]*s),w=pts.map(p=>-p[0]*s+p[2]*c),l=Math.max(...u)-Math.min(...u),t=Math.max(...w)-Math.min(...w);if(l<=TR.L-140&&t<=TR.W-120&&l<best){best=l;bw=t;}}return best<1e12;};
 let m=1;for(const q of N===6?[3,2]:[4,2])if(arcFits(q)){m=q;break;}
 const nA=Math.round(N/m),jAt=[...Array(nA)].map((_,i)=>(i*m)%N);   // стороны со стыком: у входа стыка нет, если это возможно
 const shift=jAt.includes(FRONT)&&m>1?1:0,J=jAt.map(j=>(j+shift)%N);
 const cutV=k=>({n:tv(PHI(k)),p:V(k,yC)}),mids={};
 const secP=L.sec,MD=[];
 for(let a=0;a<nA;a++){const j0=J[a],md=mod(`baseA${a}`,`Дуга рамы ${a+1}`);MD.push(md);
  for(let i=0;i<=m;i++){const j=(j0+i)%N,A=V(j,yC),B=V(j+1,yC),c=tv(PSI(j)),first=i===0,last=i===m,Mid=add(mul(add(A,B),0.5),[0,0,0]);
   const pa=first?Mid:add(A,mul(c,-60)),pb=last?Mid:add(B,mul(c,60));
   const t=tube({name:`Дуга рамы ${secP.replace(/x/g,'×')}`,role:'baseBeam',sec:secP,a:first?add(Mid,mul(c,8)):pa,b:last?add(Mid,mul(c,-8)):pb,up:[0,1,0],sx:L.bR,sy:L.hR,cutA:first?null:cutV(j),cutB:last?null:cutV(j+1),step:'ring',module:md,ends:['торец','торец'],layer:'frame',note:'углы — рез по биссектрисе, шов по контуру; низ — дренаж Ø8'});
   if(first||last){const f=box({name:'Фланец рамы 110×170×8',role:'flange',c:add(Mid,add(mul(c,first?4:-4),[0,L.yT-85-yC,0])),ax:rv(PSI(j)),ay:[0,1,0],w:110,h:170,t:8,mat:'steel',cat:'plate6',step:'ring',module:md,layer:'frame'});mids[`${j}${first?'a':'b'}`]=f;}
   if(!last)FN.filter(n=>Math.hypot(n.x-B[0],n.z-B[2])<1).forEach(n=>{n.md=md;});}}
 for(const j of J){const a=mids[`${j}a`],b=mids[`${j}b`];if(a&&b)for(const s of [-42,42])for(const y of [L.yT-30,L.yB-34]){const c=tv(PSI(j)),A=V(j),B=V(j+1),Mid=mul(add(A,B),0.5),n=rv(PSI(j)),q=add(add(Mid,mul(n,s)),add(mul(c,-8),[0,y,0]));bolt({d:12,p:q,dir:c,grip:16,thru:[a,b],step:'ring',joint:'стык рамы: фланец (болты 8.8)'});}}
 for(let j=0;j<N;j++)K.trench(V(j),V(j+1));
 for(const n of FN){if(n.kind==='post'){const f=n.a,r=rv(f),t=tv(f),md=n.md||MD[0];K.table(n.x,n.z,r,t,150,150,md,n);K.foot(n.x,n.z,r,t,md,n);}else{K.foot(n.x,n.z,[1,0,0],[0,0,1],null,n);K.steel({name:'Пята опоры пола 120×120×6',role:'jackFoot',c:[n.x,L.yP+3,n.z],ax:[1,0,0],ay:[0,0,1],w:120,h:120,t:6,module:'loose',layer:'found'});for(const s of n.st){s.a[1]=L.yP+6;s.name='Шпилька M12 опоры пола, приварена к пяте';s.module='loose';}}}
 if(anc)for(let k=0;k<N;k++){if(anc===1&&k%2)continue;const c=tv(PSI(k)),nO=rv(PSI(k)),A=V(k),B=V(k+1);for(let i=0;i<(anc===3?2:1);i++){const off=i?side-300:300,q=add(A,mul(c,off)),nd=FN.find(n=>Math.hypot(n.x-(i?B:A)[0],n.z-(i?B:A)[2])<1);K.anchor(q,c,nO,nd.md||MD[0],i);}}
 return K;
}
// ступени: нужны, если пол поднят над землёй на газоблоках. Рама из двух косоуров висит на передней балке пола, низ — на плитах
function stairs(X,cfg,o){
 const {tube,box,bolt,mod,push,weld}=X,DK=DECKS[cfg.deck],{zf,F,y0,beam,FW}=o,kit=FW?woodKit(X,cfg):null,T=FW?kit.tmb:tube,tot=F-y0,n=Math.ceil(tot/200),h=tot/n,r=280,sw=320,yF=y0+SLAB.T,md=mod('stair','Ступени'),yl=z=>160-(z-zf)*h/r,zAt=y=>zf+(160-y)*r/h,zb=zAt(yF),dir=norm([0,yF-160,zb-zf]);
 const st=[-1,1].map(s=>{const x=s*sw,t=T({name:FW?'Косоур из бруса 50×100':'Косоур 60×40',role:'stringer',sec:FW?'w50x100':'60x40x2',a:[x,160-dir[1]*80,zf-dir[2]*80],b:[x,yF+dir[1]*-80,zb+dir[2]*80],up:[0,1,0],sx:FW?50:40,sy:FW?100:60,cutA:{n:[0,0,1],p:[0,0,zf+6]},cutB:{n:[0,1,0],p:[0,yF+6,0]},step:'deck',module:md,ends:['верх','низ'],layer:'floor'});
  const pl=box({name:'Фланец косоура 100×70×6',role:'flange',c:[x,160,zf+3],ax:[1,0,0],ay:[0,1,0],w:100,h:70,t:6,mat:'steel',cat:'plate6',step:'deck',module:md,layer:'floor'});
  box({name:'Пята косоура 100×100×6',role:'jackFoot',c:[x,yF+3,zb],ax:[1,0,0],ay:[0,0,1],w:100,h:100,t:6,mat:'steel',cat:'plate6',step:'deck',module:md,layer:'floor'});
  push({kind:'box',name:`Плита ${SLAB.S}×${SLAB.S}×${SLAB.T} под косоур`,role:'pad',c:[x,y0+SLAB.T/2,zb],ax:[1,0,0],ay:[0,0,1],az:[0,1,0],w:SLAB.S,h:SLAB.S,t:SLAB.T,mat:'concrete',layer:'found',step:'found',cat:'slab',module:'loose'});
  if(FW)X.C.sc8+=2;else for(const dx of [-30,30])if(beam)bolt({d:8,p:[x+dx,160,zf-40],dir:[0,0,1],grip:46,thru:[beam,pl],step:'deck',joint:'косоур — балка пола (фланец)'});return t;});
 const pcs=[],ih=FW?sw-25:sw-20;for(let k=1;k<n;k++){const y=F-k*h,yc=y-48,z=zAt(yc);T({name:FW?'Поперечина ступени 50×50':'Поперечина ступени 40×40',role:'stairCleat',sec:FW?'w50x50':'40x40x2',a:[-ih,yc-(FW?5:0),z],b:[ih,yc-(FW?5:0),z],up:[0,1,0],sx:FW?50:40,sy:FW?50:40,step:'deck',module:md,ends:['торец','торец'],layer:'floor'});
  for(const dz of [-72.5,72.5]){const L=FW?2*ih-2:2*sw+120;push({kind:'box',name:`Доска ступени 28×140×${L}`,role:'tread',c:[0,y-14,z+dz],ax:[1,0,0],ay:[0,0,1],az:[0,1,0],w:L,h:140,t:28,mat:DK.mat,layer:'floor',step:'deck',cat:DK.cat,module:'loose',tint:0.3});pcs.push(L);X.C.selfDrill+=4;}}
 return{pcs,run:zb-zf};
}

/* ---------- расчёт основания без фундамента ---------- */
function verifyBase(c){
 const {m,row,kN,kNm,MPa,mm,pct,G,Wup,S,gR,plan,nPost,Hx,Hz,Fx,Fz,yFill,yRoof,yPost}=c,B=m.base,cfg=m.cfg,N_=m.poly||0,So=SOILS[cfg.soil],GR='Основание',ms=B.posts;
 const yp=B.yPivot,MH=f=>1.4*(f.s*(yFill-yp)+f.r*(yRoof-yp)+f.p*(yPost-yp));
 const dirs=N_?[[Math.cos(m.psi0),Math.sin(m.psi0),Fx,Hx],[Math.cos(m.psi0+Math.PI/N_),Math.sin(m.psi0+Math.PI/N_),Fx,Hx]]:[[1,0,Fx,Hx],[0,1,Fz,Hz]];
 const eRoof=N_?m.R/2:Math.max(m.W,m.D)/4,Wd=1.4*Wup,mK=B.kg*9.81,mT=B.tied?mK:0,An=B.anchors,nA=An.length,Rd=nA?anchorRd(cfg.soil).Fd:0;
 let wst={u:0},tmax=0,nd1=0;
 for(const [dx,dz,F,H] of dirs){const pr=ms.map(n=>n.x*dx+n.z*dz),p=Math.max(...pr),l=pr.map(v=>p-v),Mdest=MH(F)+Wd*(p+eRoof),Mst0=0.9*G*p+0.9*mT*l.reduce((s,v)=>s+v,0),la=An.map(a=>Math.max(0,p-(a.x*dx+a.z*dz))),Sl2=la.reduce((s,v)=>s+v*v,0),
   Tm=nA?Math.max(0,Mdest-Mst0)*Math.max(...la)/Sl2:0,Manc=Rd*la.reduce((s,v)=>s+v,0),Mst=Mst0+Manc,u=Mdest/Math.max(1,Mst);tmax=Math.max(tmax,Tm);nd1=Math.max(nd1,(Mdest-0.9*G*p)/(0.9*9.81*l.reduce((s,v)=>s+v,0)));if(u>wst.u)wst={u,Mdest,Mst,Mst0,p};}
 const Gt=G+mT*ms.length,V=Wd-0.9*Gt,fixA=nA&&B.anc<3?{anc:B.anc+1}:null,fixW=!nA&&B.n<MAX_SLABS?{pads:B.n+1}:null,fix=fixA||fixW||(nA&&c.morePortals?c.morePortals():null);
 row(GR,`Опрокидывание ветром: момент ${kNm(wst.Mdest)} из ${kNm(wst.Mst)}`,wst.u,nA?`вес ${pct(wst.Mst0/Math.max(1,wst.Mst))}, анкеры — остальное`:`держит только вес ${Math.round((Gt)/9.81)} кг`,'ветер γ = 1,4, вес γ = 0,9 (СП 20.13330); подъём кровли приложен со смещением к наветренной стороне',fix);
 const VR=nA*Rd+0.9*Gt;row(GR,`Отрыв ветром: подъём ${kN(Wd)}`,Wd/VR,`вес ${kN(0.9*Gt)}${nA?` + анкеры ${kN(nA*Rd)}`:''}`,'подъём кровли без стен: EN 1991-1-4, навесы',fix);
 const Hm=Math.max(Hx,Hz),Nfr=Math.max(0,0.9*Gt-Wd),Fr=0.35*Nfr,Fa=nA*So.hl;
 row(GR,`Сдвиг ветром: ${kN(Hm)}`,Math.min(9.99,Hm/Math.max(1,Fr+Fa)),`трение ${kN(Fr)}${nA?` + анкеры ${kN(Fa)}`:''}`,'трение сталь — бетон 0,35; когда ветер почти поднял беседку, трения нет — держат штоки анкеров',fix);
 if(nA){const A=anchorRd(cfg.soil);row(GR,`Свая ВСК ${HELIX.shaft} Л${HELIX.d}, лопасть глубже ${HELIX.h} мм: вырыв ${kN(tmax)} (${So.s})`,tmax/Rd,`допустимо ${kN(Rd)} на анкер, всего анкеров ${nA}`,`СП 24.13330, п. 7.2.10: Fd = γc·(α1·c + α2·γ·h)·A, γk = 1,4`,fixA);
  const Tu=A.F0*1000;if(B.FW){const Rb=2*boltTW(12,B.bS,WMW,0.85,WOODS[cfg.wood]);row(GR,'Кронштейн анкера: 2 болта M12 через обвязку',Tu/Rb,`${kN(Tu)} из ${kN(Rb)}`,'анкер должен сдаться раньше узла: зимой он работает как предохранитель от пучения');}else{const Mu=Tu*35,Wl=100*12*12/6;row(GR,'Ушко анкера 12 мм: выдерживает вырыв анкера из грунта',Mu/Wl/RY,`${kN(Tu)} → σ ${Math.round(Mu/Wl)} МПа`,'анкер должен сдаться раньше ушка: зимой он работает как предохранитель от пучения');}}
 else{const nn=ms.length,need=Math.max(0,nd1*nn,(Wd/0.9-G)/9.81,(Hm/0.35+Wd)/0.9/9.81-G/9.81),has=B.kg*nn;row(GR,`Пригруз: нужно ${Math.round(need)} кг`,need/Math.max(1,has),`на опорах стянуто ${Math.round(has)} кг: ${B.n} ${plural_(B.n,'плита','плиты','плит')} на стойку`,`плиты стянуты шпилькой с рамой и поднимаются только вместе с ней. Больше ${MAX_SLABS} на опору не кладём: нужны анкеры`,fixW);}
 // опоры
 const Nser=((S+gR)*plan*1000+G+(m.isFloor?(2.0*0.9+0.35)*footArea(cfg)*1000:0))/nPost*(N_?1.1:1.3),Nd=Nser*1.3,Ap=B.padA,p1=Nser/Ap/1000,b2=Math.sqrt(Ap)+2*0.2*0.58,p2=(Nser+B.kg*9.81)/(b2*b2)/1000;
 row(GR,`Давление на щебень под ${B.gas?'блоками':'плитой'}`,p1/250,`${Math.round(p1)} кПа из 250`,'щебень 20–40 с послойной трамбовкой');
 row(GR,`Давление на грунт под подушкой (${So.s})`,p2/So.R,`${Math.round(p2)} кПа из ${So.R}`,'щебень 200 мм разносит нагрузку под углом 30°; R верхнего слоя — оценка, у насыпного грунта и торфа меньше');
 if(!B.gas){const ov=(SLAB.S-(B.FW?150:170))/2,qp=Nd/Ap/1e6,Ms=qp*ov*ov/2,nS=B.FW?Math.max(3,B.n):B.n,Ws=nS*SLAB.T*SLAB.T/6,u=Ms/Ws/2;row(GR,`Плита ${SLAB.S}×${SLAB.T}: изгиб под опорой`,u,`σ ${(Ms/Ws).toFixed(1).replace('.',',')} из 2,0 МПа`,'плита — консоль от подпятника; 2 МПа на растяжение при изгибе — оценка для вибропрессованной плиты',B.n<MAX_SLABS?{pads:B.n+1}:null);}
 if(B.FW){const A=B.bS*(B.gas?BLK.W:SLAB.S),Rc=2.7*WOODS[cfg.wood].kR*0.66*WMV,sg=Nd/A;row(GR,`Обвязка на опоре: смятие поперёк волокон`,sg/Rc,`${sg.toFixed(2).replace('.',',')} из ${Rc.toFixed(2).replace('.',',')} МПа`,'СП 64: смятие поперёк волокон на большой площадке');}
 // рама: стойка повисла на соседних узлах (опора просела или вмёрзла и ушла вверх). Особое сочетание: вес + половина снега, γ = 1
 if(B.FW){const P=(G+0.5*S*plan*1000)/nPost*(N_?1.1:0.85),Lc=N_?m.side/2:m.sP,Ww=B.bS**3/6,Rw=WOODS[cfg.wood].RA*WOODS[cfg.wood].kR*WMW*WMV,Mc=P*Lc,u=Mc/Ww/Rw;row(GR,`Обвязка ${B.bS}×${B.bS}: опора ушла, стойка ${kN(P)} на вылете ${mm(Lc)}`,u,`M ${kNm(Mc)} · σ ${MPa(Mc/Ww)} из ${MPa(Rw)}`,'расчёт не зависит от величины пучения: обвязка выдерживает полное исчезновение одной опоры',B.bS<150?{wSill:150}:c.morePortals?c.morePortals():null);}
 else{const P=(G+0.5*S*plan*1000)/nPost*(N_?1.1:0.85),Lc=N_?m.side/2:m.sP,ss=secOf(B.sec),Mc=P*Lc,fl=P*Lc**3/(3*EST*ss.Ix),u=Mc/ss.Wx/RY;row(GR,`Рама ${B.sec.replace(/x/g,'×')}: опора ушла, стойка ${kN(P)} на вылете ${mm(Lc)}`,u,`M ${kNm(Mc)}, прогиб ${mm(fl)}`,N_?'расчёт не зависит от величины пучения: рама выдерживает полное исчезновение одной опоры':'угловая стойка на вылете или средняя на двойном пролёте: момент одинаков, у средней грузовая площадь вдвое больше. Расчёт не зависит от величины пучения',B.sec==='80x40x3'?{ringSec:'100x50x3'}:B.sec==='100x50x3'?{ringSec:'120x60x3'}:B.sec==='120x60x3'?{ringSec:'120x60x4'}:(c.morePortals&&c.morePortals())||(B.sec==='120x60x4'?{ringSec:'120x80x4'}:null));}
 if(N_&&!B.FW){const P=(G+0.5*S*plan*1000)/nPost*1.1,Mj=P*m.side/4,T=Mj/104/2;row(GR,`Фланец рамы: 4 болта M12 класса 8.8, M ${kNm(Mj)}`,T/34000,kN(T)+' на болт','стык в середине стороны; при потере соседней опоры — половина момента');}
 if(!N_&&!B.FW){const Mb=c.Mbase||0,Fb=Mb/100;row(GR,`Стык поперечины: 2 болта M12, момент базы стойки ${kNm(Mb)}`,Fb/28000,kN(Fb)+' на болт','смятие двух стенок 3 мм ≈ 28 кН; стык держит раму от поворота, поэтому база стойки работает как на столбе');}
 const dc=(B.gas?200:400+(B.n-1)*50),hfp=So.eps*Math.max(0,DF-dc);
 row(GR,`Подъём пучением: ${mm(hfp)} из ${SU} (${So.s})`,hfp/SU,`εfh ${String(So.eps).replace('.',',')} × ${dc?((DF-dc)/1000).toFixed(1).replace('.',','):'—'} м промерзающего слоя`,`предел 5 см — табл. Б.1 пособия Минстроя; глубина промерзания 1,4 м; при глубине больше 1,7 м незаглублённые опоры не применяют (п. 8.2.2)`);
 if(B.gas){const R=1.35*0.8,nB=B.nB,Ab=BLK.L*BLK.W*nB,sb=Nd/Ab,sl=Nd/(240*240),hs=BLK.H,bb=BLK.W*nB,Ng=Math.max(1,0.9*Gt+nA*Rd*0.5),Mr=Ng*bb/2,Ms=Hm*hs;
  row(GR,`Газоблок: сжатие ${(sb).toFixed(2).replace('.',',')} МПа`,sb/R,`из ${R.toFixed(2).replace('.',',')} МПа`,'СТО НААГ 3.1-2013, табл. 9.1: B3,5 на клею 1,5 МПа, ×0,9 за ряд 200 мм, ×0,8 — запас на влажность');
  row(GR,`Газоблок: смятие под пятой 240×240`,sl/(R*1.2),`${sl.toFixed(2).replace('.',',')} МПа из ${(R*1.2).toFixed(2).replace('.',',')}`,'местное сжатие: на 20% выше расчётного');
  row(GR,`Опора из ${nB===2?'2 блоков рядом':'1 блока'}: завал по узкой стороне ${bb} мм`,Ms/Math.max(1,Mr),`момент ${kNm(Ms)} из ${kNm(Mr)}`,'опора стоит свободно: блоки рядом вдвое шире, чем один');}
}
const plural_=(n,a,b,c)=>{const q=Math.abs(n)%100,w=q%10;return q>10&&q<20?c:w===1?a:w>=2&&w<=4?b:c;};
function baseInfo(K,X,cfg){const L=K.L,$=cfg.$||{},posts=X.FN.filter(n=>n.kind==='post').map(n=>({x:n.x,z:n.z})),hasRod=cfg.hold==='weight'&&L.n>1&&!L.gas,gkg=L.n*SLAB.kg+(hasRod?7:0);
 return{sec:L.sec,hold:cfg.hold,gas:L.gas,nB:L.nB,n:L.n,yS:L.yS,yEnd:L.yS-L.n*SLAB.T,yTr:L.yB-150,yP:L.yP,anc:cfg.hold==='anchor'?($.anc||1):0,anchors:K.A,posts,kg:hasRod?gkg:0,tied:hasRod,yPivot:L.gas?L.yS:hasRod?L.yS-L.n*SLAB.T:L.yP,FW:L.FW,bS:L.bR,n0:L.n0,padA:L.gas?BLK.L*BLK.W*L.nB/1e6:(SLAB.S/1000)**2,nFoot:K.feet.length};}

/* ---------- нижняя обвязка из бруса (вариант «Брус» с полом) ----------
   Весь каркас деревянный: обвязка и балки пола в одной плоскости, лаги заподлицо, настил сверху, стойки стоят на обвязке.
   Обвязка лежит прямо на опоре через гидроизоляцию, как и положено брусу: на столбе, стопке плит или блоках, низ на 150 мм выше земли.
   Соединения — те же коннекторы для бруса, что и наверху: Т-образные и угловые на обвязке, торцевые под лаги. */
const cutsAt=(a,b,ns,mx)=>{const out=[];let s=a;const q=ns.slice().sort((p,r)=>p-r);while(b-s>mx){const c=q.filter(x=>x-s<=mx&&x>s+300);if(!c.length)break;const x=c[c.length-1];out.push([s,x]);s=x;}out.push([s,b]);return out;};
// кронштейн анкера: лоток под брусом с двумя щеками, 2 болта насквозь. c — точка на оси бруса, u — вдоль него, v — поперёк
function shoeKit(X,L){const {box,bolt}=X,bS=L.bR;
 return(c,u,v,from,to,at)=>{const md='loose',len=to-from,cc=add(c,mul(u,(from+to)/2)),w=2*L.js+50,h=70,m0=(X.grpN=(X.grpN||0)+1,{name:'Кронштейн сваи',grp:X.grpN,size:`${len}×${w}×${h} мм`,why:'Цепляет обвязку к винтовой свае: лоток под брусом, щёки по бокам, 2 болта насквозь. Держит беседку от отрыва ветром.',mat:'steel',cat:'plate6',step:'ring',module:md,layer:'frame',seq:1,role:'shoe'});
  box(Object.assign({},m0,{c:[cc[0],L.yB-3,cc[2]],ax:u,ay:v,w:len,h:w,t:6,mount:[0,-1,0],mountLen:60}));
  const ears=[-1,1].map(s=>box(Object.assign({},m0,{c:add(add(cc,mul(v,s*(bS/2+4))),[0,L.yB+h/2,0]),ax:u,ay:[0,1,0],w:len,h,t:6,mount:[0,-1,0],mountLen:60})));
  for(const [q,b] of at)bolt({d:12,p:add(add(c,mul(u,q)),add(mul(v,-(bS/2+7)),[0,L.yB+35,0])),dir:v,grip:bS+14,thru:[b,...ears],step:'ring',joint:'кронштейн сваи — обвязка'});};}
// опора бруса раскрытая (OBR 50×100): U-образная, с полками по грани балки. c — центр торца на грани, dir — вдоль лаги от грани
function hangBeam(X,c,dir,b,h,beam,step,o={}){const n=[dir[2],0,-dir[0]],len=90,hc=h-20,nm=`Опора бруса раскрытая ${b}×${h}`,m0=(X.grpN=(X.grpN||0)+1,{name:nm,role:'wHanger',mat:'steel',step,module:'loose',layer:o.layer||'frame',mount:dir,mountLen:40,seq:-1,grp:X.grpN,size:`${len}×${b+4}×${h} мм`,why:'Держит конец лаги на балке: лагу опускают в лоток, с двух сторон саморезы.'});
 X.box(Object.assign({},m0,{cat:'connJ',c:add(add(c,mul(dir,len/2)),[0,-h/2-1,0]),ax:dir,ay:n,w:len,h:b+4,t:2}));
 for(const s of [-1,1])X.box(Object.assign({},m0,{cat:null,c:add(add(c,mul(dir,len/2)),mul(n,s*(b/2+1))),ax:dir,ay:[0,1,0],w:len,h:hc,t:2}));
 for(const s of [-1,1])X.box(Object.assign({},m0,{cat:null,c:add(add(c,mul(dir,1)),mul(n,s*(b/2+22))),ax:n,ay:[0,1,0],w:40,h:hc,t:2}));
 for(const s of [-1,1])for(const dy of [-hc/3,hc/3])for(const q of [28,62])X.screws.push({type:'jc',p:add(add(add(c,mul(dir,q)),[0,dy,0]),mul(n,s*(b/2+2.6))),n:mul(n,s),st:step});
 X.C.conn5+=12;}
function hangJoist(X,x,zb,dz,s=1){const w=-dz*s;X.C.conn5+=4;X.angle({name:'Опора лаги: уголок 40×40×40×2',role:'cleatJoist',mount:[0,0,dz],mountLen:40,o:[x+s*25,w>0?162:198,zb],u:[s,0,0],v:[0,0,dz],L:40,A:40,B:40,t:2,mat:'galv',cat:'kus40',step:'bottom',layer:'floor'});X.C.clip+=4;}
function woodFloorRect(X,cfg,o){
 const {XP,ZP,TR,bP,supX,FY,pillar}=o,{tmb,socket}=woodKit(X,cfg),L=baseLev(cfg),bS=L.bR,sec=L.sec,yc=230-bS/2,nl=ZP.length-1,mx=TR.L-60,K=X.fnd?baseKit(X,cfg):null,shoe=shoeKit(X,L),anc=X.fnd&&cfg.hold==='anchor'?((cfg.$||{}).anc||1):0;
 ZP.forEach(z=>supX.forEach(x=>pillar(x,z,{name:'Столбик под балку пола Ø200',fw:1,y0:FY,top:228-bS,studs:[[x,z,224,[-205,206],[[-195,3],[203,3]]]]})));
 const G=(c,u,n,L0,o2={})=>socket(Object.assign({c,u,v:[0,1,0],n,b:bS,h:bS,L:L0,open:true,step:'ring',seq:-1},o2));
 // обвязка вдоль — неразрезная по стойкам; длиннее кузова режется над опорой, стык в сквозном коннекторе
 const SL={};for(const sx of [-1,1]){const x=sx*XP;SL[sx]=cutsAt(ZP[nl]-bS/2,ZP[0]+bS/2,ZP.slice(1,-1),mx).map(([a,b])=>({a,b,t:tmb({name:`Обвязка ${bS}×${bS} (${sx<0?'лев.':'прав.'})`,role:'sill',sec,a:[x,yc,a],b:[x,yc,b],up:[0,1,0],step:'ring',ends:['торец','торец'],note:'торцы — состав для торцов; низ на 150 мм выше земли'})}));
  SL[sx].forEach((p,q)=>{if(q)G([x,yc,p.a],[0,0,1],[1,0,0],300,{name:`Коннектор сквозной ${bS}×${bS}`,cat:'connS'});});}
 const pcZ=(sx,z)=>SL[sx].find(p=>z>=p.a-1&&z<=p.b+1).t;
 ZP.forEach((z,i)=>{const xa=-XP+bS/2,xb=XP-bS/2,end=i===0?1:i===nl?-1:0,ns=supX.filter(()=>xb-xa>mx),pcs=cutsAt(xa,xb,ns,mx).map(([a,b])=>({a,b,t:tmb({name:`Балка пола ${bS}×${bS} (${i+1})`,role:'sillX',sec,a:[a,yc,z],b:[b,yc,z],up:[0,1,0],step:'ring',ends:['торец','торец']})}));
  pcs.forEach((p,q)=>{if(q)G([p.a,yc,z],[1,0,0],[0,0,1],300,{name:`Коннектор сквозной ${bS}×${bS}`,cat:'connS'});});
  for(const s of [-1,1]){G([s*(XP-bS/2-65),yc,z],[1,0,0],[0,0,1],130,{name:`Коннектор ${end?'угловой':'Т-образный'} ${bS}×${bS}`,cat:end?'conn3':'conn4'});G([s*XP,yc,z-end*40],[0,0,1],[1,0,0],end?bS+80:bS+120);}});
 // лаги заподлицо с балками
 const S=2*(XP-bS/2),nJ=Math.max(1,Math.ceil(S/(cfg.deck==='wpc'?400:500))-1),xs=[...Array(nJ)].map((_,j)=>-S/2+(j+1)*S/(nJ+1));
 for(let i=0;i<nl;i++){const z0=ZP[i+1]+bS/2+1,z1=ZP[i]-bS/2-1;for(const x of xs){tmb({name:'Лага 50×100',role:'joist',sec:'w50x100',a:[x,180,z0],b:[x,180,z1],up:[0,1,0],step:'bottom',layer:'floor',ends:['зад','перед']});hangBeam(X,[x,180,z0-1],[0,0,1],50,100,null,'bottom',{layer:'floor'});hangBeam(X,[x,180,z1+1],[0,0,-1],50,100,null,'bottom',{layer:'floor'});}}
 // опоры
 if(K)for(const n of X.FN){const onS=Math.abs(Math.abs(n.x)-XP)<1;K.foot(n.x,n.z,onS?[1,0,0]:[0,0,1],onS?[0,0,1]:[1,0,0],'loose',n);}
 if(anc)for(const n of X.FN.filter(q=>q.kind==='post')){const sx=Math.sign(n.x),corner=Math.abs(Math.abs(n.z)-Math.abs(ZP[0]))<1,s0=n.z>0?-1:1;if(anc===1&&!corner)continue;
  for(let i=0;i<(anc===3?2:1);i++){const s=i&&!corner?-s0:s0,off=i&&corner?540:320,z=n.z+s*off;shoe([n.x,0,z],[0,0,1],[1,0,0],-100,100,[[-45,pcZ(sx,z-45)],[45,pcZ(sx,z+45)]]);K.anchor([n.x,0,z],[0,0,1],[sx,0,0],'loose',i);}}
 return{JX:[-XP,...xs,XP],span:Math.max(...supX.map((x,i)=>(i?x-supX[i-1]:x+XP)),XP-(supX.length?supX[supX.length-1]:-XP)),K};}
function woodFloorPoly(X,cfg,o){
 const {N,R,a,V,rv,tv,PHI,PSI,TR,bP,FY,pillar,xSpan}=o,{tmb,socket}=woodKit(X,cfg),L=baseLev(cfg),bS=L.bR,sec=L.sec,yc=230-bS/2,mx=TR.L-60,ap=a-bS/2-1,K=X.fnd?baseKit(X,cfg):null,shoe=shoeKit(X,L),anc=X.fnd&&cfg.hold==='anchor'?((cfg.$||{}).anc||1):0,side=2*R*Math.sin(Math.PI/N);
 const SD={};for(let j=0;j<N;j++){const A=V(j,yc),B=V(j+1,yc),c=tv(PSI(j)),e=bS*Math.tan(Math.PI/N)/2+30;SD[j]=tmb({name:`Обвязка ${bS}×${bS} (сторона ${j+1})`,role:'sill',sec,a:add(A,mul(c,-e)),b:add(B,mul(c,e)),up:[0,1,0],cutA:{n:tv(PHI(j)),p:A},cutB:{n:tv(PHI(j+1)),p:B},step:'ring',ends:['торец','торец'],note:'торцы — рез по биссектрисе; низ на 150 мм выше земли'});}
 // угол обвязки: коннектор с двумя гнёздами под углом многоугольника, под заказ
 const G=(c,u,n,L0,o2={})=>socket(Object.assign({c,u,v:[0,1,0],n,b:bS,h:bS,L:L0,open:true,step:'ring',seq:-1},o2));
 for(let k=0;k<N;k++)[[tv(PSI(k)),rv(PSI(k))],[mul(tv(PSI(k-1)),-1),rv(PSI(k-1))]].forEach(([c,nO],q)=>G(add(V(k,yc),mul(c,105)),c,nO,210,q?{}:{name:`Коннектор угла обвязки ${bS}×${bS}`,cat:'connP'}));
 const cutFor=(x,z)=>{let b=null;for(let j=0;j<N;j++){const n=rv(PSI(j)),d=n[0]*x+n[2]*z;if(!b||d>b.d)b={n,d};}return{n:b.n,p:mul(b.n,ap)};};
 // внутренние балки на своих опорах
 const nIn=R>1650?2:1,ZL=[...Array(nIn)].map((_,l)=>-a+(l+1)*2*a/(nIn+1));
 for(const zl of ZL){const s1=xSpan(zl-bS/2,-bS/2-1),s2=xSpan(zl+bS/2,-bS/2-1),x0=Math.max(s1[0],s2[0]),x1=Math.min(s1[1],s2[1]),Lb=x1-x0,np=Math.max(2,Math.ceil((Lb-300)/1300)+1),PX=[...Array(np)].map((_,i)=>x0+200+i*(Lb-400)/(np-1));
  const ns=Lb>mx?PX.slice(1,-1):[],pcs=cutsAt(x0,x1,ns,mx).map(([p0,p1],q,arr)=>({a:p0,b:p1,t:tmb({name:`Балка пола ${bS}×${bS}`,role:'sillX',sec,a:[q?p0:p0-120,yc,zl],b:[q<arr.length-1?p1:p1+120,yc,zl],up:[0,1,0],cutA:q?null:cutFor(p0,zl),cutB:q<arr.length-1?null:cutFor(p1,zl),step:'ring',ends:['торец','торец'],note:'торцы — по грани обвязки, 2 косых самореза'})}));
  pcs.forEach((p,q)=>{if(q)G([p.a,yc,zl],[1,0,0],[0,0,1],300,{name:`Коннектор сквозной ${bS}×${bS}`,cat:'connS'});});
  X.C.sc8+=4;   // концы балки — внатяг в обвязку 2 косыми саморезами, вес несут опоры
  for(const x of PX)pillar(x,zl,{name:'Столбик под балку пола Ø200',fw:1,y0:FY,top:228-bS,studs:[[x,zl,224,[-205,206],[[-195,3],[203,3]]]]});}
 // лаги
 const zIn=x=>{let lo=-1e9,hi=1e9;for(let j=0;j<N;j++){const n=rv(PSI(j));if(Math.abs(n[2])<1e-6){if(n[0]*x>ap)return null;continue;}const zz=(ap-n[0]*x)/n[2];if(n[2]>0)hi=Math.min(hi,zz);else lo=Math.max(lo,zz);}return hi>lo?[lo,hi]:null;};
 const xr=xSpan(0,-bS/2-1),st=cfg.deck==='wpc'?400:480,nj=Math.ceil((xr[1]-xr[0])/st),xs=[...Array(Math.max(0,nj-1))].map((_,i)=>xr[0]+(i+1)*(xr[1]-xr[0])/nj).filter(x=>Math.abs(x)<=R-260).map(x=>{for(let k=0;k<N;k++){const vx=V(k)[0]*ap/a;if(Math.abs(x-vx)<45)return vx+(x<vx?-45:45);}return x;});   // лага не садится на вершину многоугольника
 for(const x of xs){const zs=zIn(x);if(!zs)continue;const br=[zs[0],...ZL.flatMap(z=>[z-bS/2-1,z+bS/2+1]),zs[1]].filter(z=>z>=zs[0]&&z<=zs[1]);
  for(let i=0;i+1<br.length;i+=2){const p0=br[i],p1=br[i+1];if(p1-p0<200)continue;const c0=i===0,c1=i+2>=br.length;
   tmb({name:'Лага 50×100',role:'joist',sec:'w50x100',a:[x,180,c0?p0-90:p0],b:[x,180,c1?p1+90:p1],up:[0,1,0],cutA:c0?cutFor(x,p0):null,cutB:c1?cutFor(x,p1):null,step:'bottom',layer:'floor',ends:['зад','перед']});
   const hang=(end,dz,zp)=>{if(!end){hangBeam(X,[x,180,zp-dz],[0,0,dz],50,100,null,'bottom',{layer:'floor'});return;}const n=cutFor(x,zp).n,g=-n[0]/n[2],s0=dz>0?(g>0?-1:1):(g>0?1:-1),at=s=>{const z1=zIn(x+s*25),z2=zIn(x+s*65);return z1&&z2?(dz>0?Math.max(z1[0],z2[0])+1:Math.min(z1[1],z2[1])-1):null;},free=(s,z)=>z!=null&&!X.screws.some(q=>q.st==='ring'&&Math.abs(q.p[2]-z)<75&&Math.abs(q.p[0]-(x+s*55))<45),s=free(s0,at(s0))||!free(-s0,at(-s0))?s0:-s0,zb=at(s);if(zb==null)return;hangJoist(X,x,zb,dz,s);};   // уголок не садится на головки глухарей гнезда
   hang(c0,1,p0);hang(c1,-1,p1);}}
 // опоры
 if(K)for(const n of X.FN){if(n.kind==='post'){const f=n.a;K.foot(n.x,n.z,rv(f),tv(f),'loose',n);}else K.foot(n.x,n.z,[0,0,1],[1,0,0],'loose',n);}
 if(anc)for(let k=0;k<N;k++){if(anc===1&&k%2)continue;const c=tv(PSI(k)),nO=rv(PSI(k)),A=V(k);for(let i=0;i<(anc===3?2:1);i++){const off=i?side-340:340,q=add(A,mul(c,off));shoe([q[0],0,q[2]],c,nO,-100,100,[[-45,SD[k]],[45,SD[k]]]);K.anchor(q,c,nO,'loose',i);}}
 return{JX:xs,K};}
function newelOnSill(X,TK,o){const {xn,z,top,nst,nmd,name}=o;TK.postBase({x:xn,z,y:230,u:[1,0,0],n:[0,0,1],b:100,step:nst,md:'loose',layer:'rail'});X.C.sc8+=4;
 return TK.tmb({name:`Стойка входа из бруса 100×100 (${name})`,role:'postW',sec:'w100x100',a:[xn,230,z],b:[xn,top,z],up:[0,0,1],step:nst,layer:'rail',ends:['низ','верх'],note:'верхний торец — под срез с уклоном или колпачок'});}
// пол из бруса: лаги, балки, стойки на обвязке
function verifyFloorW(c){const {m,row,kN,MPa,mm,Tu,Nmax,WS}=c,R=WS.RA*WS.kR*0.53*WMV,Rs=WS.RA*WS.kR*WMW*WMV,qL=2.0*1.2+0.35*1.1,bS=m.sillB,sp=m.sP||m.side;
 const js=m.joistStep||480,Lj=m.poly?2*m.apo/(m.R>1650?3:2)-bS:sp-bS,qj=qL*js/1000,Mj=qj*Lj*Lj/8,Wj=50*100*100/6,Ij=50*100**3/12,fj=5*2.35*js/1000*Lj**4/(384*WE*WMV*Ij);
 row('Пол и борта',`Лага 50×100: пролёт ${mm(Lj)}, шаг ${mm(js)} (2 кПа)`,Math.max(Mj/Wj/R,fj/(Lj/250)),`σ ${MPa(Mj/Wj)} из ${MPa(R)}, прогиб ${mm(fj)}`,'лаги заподлицо с балками, на уголках');
 const Lb=m.floorSpan||1300,qb=qL*(sp)/1000,Mb=qb*Lb*Lb/8,Wb=bS**3/6;row('Пол и борта',`Балка пола ${bS}×${bS}: пролёт ${mm(Lb)}`,Mb/Wb/R,`σ ${MPa(Mb/Wb)} из ${MPa(R)}`,'');
 const Ap=(bS+12)*(bS+12),Rc=2.7*WS.kR*0.66*WMV*1.6;row('Узлы',`Обвязка под стойкой: смятие поперёк волокон ${MPa(Nmax/Ap)}`,Nmax/Ap/Rc,`из ${MPa(Rc)}`,'основание коннектора разносит нагрузку на обвязку; при нехватке обвязка толще',bS<150?{wSill:150}:null);
 row('Узлы','Опорный коннектор на обвязке, отрыв: 4 самореза 8×160',Tu/(4*3000),`${kN(Tu)} из ${kN(12000)}`,'конструкционные саморезы в обвязку, расчётно 3 кН на штуку');
 const V=qL*sp/1000*Lb/2;row('Узлы',`Балка пола в гнезде коннектора: ${kN(V)}`,V/6800,'из 6,8 кН','8 глухарей 6×60 по 0,85 кН');}
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
/* ---------------- оформление: мягкие окна ПВХ и свет по контуру (включается отдельно, каркас не меняет) ----------------
   Окно висит снаружи: плоскость — по самой выступающей детали пролёта, края — на стойках, верх — на балке, низ — на балке пола.
   Скоба ставится только там, где за ней есть брус или труба: точка проверяется лучом внутрь каркаса.
   Свет — гирлянда белт-лайт с провисом между стойками или LED-лента в профиле по низу балок. */
const WIN_CAT=[ // готовые мягкие окна Леманы: ПВХ до −39 °C, коричневая окантовка; fx — чем крепится (в комплекте)
 {w:1200,h:2000,pr:5330,city:'Ульяновск',fx:'strap',...PROD('myagkoe-okno-pvh-do-39-120x200sm-okantovka-korichnevaya-skoba-s-remeshkom','90305669')},
 {w:1300,h:2000,pr:4700,city:'Тула',fx:'strap',...BYSKU('91370395')},
 {w:2000,h:1500,pr:6150,city:'Тверь',fx:'strap',...BYSKU('90305808')},
 {w:2400,h:1400,pr:5471,city:'Новосибирск',fx:'strap',...BYSKU('91370431')},
 {w:1100,h:1200,pr:3510,city:'Иваново',fx:'turn',...BYSKU('90305879')},
 {w:1300,h:2200,pr:4862,city:'Барнаул',fx:'turn',...BYSKU('91370481')},
 {w:1400,h:2200,pr:6314,city:'Краснодар',fx:'turn',...BYSKU('91370470')},
 {w:1500,h:2200,pr:6270,city:'Киров',fx:'turn',...BYSKU('91370418')},
 {w:1500,h:2400,pr:6840,city:'Киров',fx:'strap',...BYSKU('90305684')}];
const pl_=(n,a,b,c)=>{const k=n%100,j=n%10;return k>10&&k<20?c:j===1?a:j>=2&&j<=4?b:c;};
const FX={strap:'скоба с ремешком',turn:'поворотная скоба'},ZIP_PR=1500;   // П-образная молния дверного проёма — оценка
// окно под размер шьют на заказ: медиана ₽/м² готовых окон Леманы + 20% за пошив по размеру (оценка)
const WIN_M2=(()=>{const v=WIN_CAT.map(c=>c.pr/(c.w*c.h/1e6)).sort((a,b)=>a-b);return Math.round(v[v.length>>1]*1.2/10)*10;})();
Object.assign(CAT,{
 winCustom:{n:'Мягкое окно ПВХ 0,7 мм на заказ, окантовка, люверсы, скобы с ремешками',u:'шт',pr:0,src:'est',url:LP+'/catalogue/myagkie-okna/',lk:'catalog'},
 belt:{n:'Гирлянда белт-лайт Uniel UDL-K122, 10 м, 20 ламп E27 LED',u:'шт',pr:2988,src:'site',city:'',...BYSKU('89390834')},
 ledTape:{n:'Лента светодиодная Lamper 141-496, 4,8 Вт/м, 12 В, IP65, 5 м',u:'шт',pr:613,src:'site',city:'Москва',...BYSKU('91381438')},
 ledPsu:{n:'Блок питания Ambrella 12 В 60 Вт IP67',u:'шт',pr:1400,src:'site',city:'Тверь',...BYSKU('91612693')},
 ledProf:{n:'Профиль накладной для LED-ленты Fiberli М1506, 2 м',u:'шт',pr:600,src:'site',city:'Клин',...BYSKU('91801689')},
 ledWire:{n:'Провод ПВС 2×0,75 мм², на отрезку',u:'м',pr:45,src:'est',url:S('провод ПВС 2х0,75'),lk:'search'},
 extCord:{n:'Удлинитель-шнур Партнер-Электро US106C-110OR, 10 м, IP44',u:'шт',pr:1670,src:'site',city:'Уфа',...BYSKU('93901404')},
 extCord2:{n:'Удлинитель-шнур iTOK i-connect-SUR-PVS-310-2-44-10, 10 м, 2 розетки с заземлением, IP44',u:'шт',pr:3780,src:'site',city:'Воронеж',...PROD('udlinitel-shnur-silovoy-itok-tip-sur-i-connect-sur-pvs-310-2-44-10-2-rozetki-s-zazemleniem-3x1-mm-10-m-2200-vt-cvet-chernyy','91554885')},
 belt5:{n:'Гирлянда белт-лайт Uniel UDL-K121, 5 м, 10 ламп E27, чёрная',u:'шт',pr:1056,src:'site',city:'Москва',...BYSKU('89390833')},
 ties:{n:'Стяжки кабельные Tdm 4,8×200 мм морозостойкие, 100 шт',u:'уп.',pr:245,src:'site',city:'',url:S('стяжки кабельные 4,8х200 морозостойкие'),lk:'search'},
 dwW:{n:'Саморез по дереву 4,2×32 оцинкованный, 200 шт',u:'уп.',pr:290,src:'est',url:S('саморез по дереву 4,2х32'),lk:'search'},
 netRoll:{n:'Москитное полотно Oxiss 10000×1400 мм, серое',u:'рулон',pr:2773,src:'site',city:'Москва',...BYSKU('90330618')},
 velcro:{n:'Лента-липучка TBY пришивная 25 мм, серая, пара по 25 м',u:'уп.',pr:561,src:'site',city:'Иваново',...PROD('lenta-lipuchka-tby-prishivnaya-kachb-shirina-25mm-cvet-f310-300-seryy-upakovka-25m-para','91828321')},
 dwP:{n:'Саморез с прессшайбой острый 4,2×25, 100 шт',u:'уп.',pr:220,src:'est',url:S('саморез с прессшайбой острый 4,2х25'),lk:'search'},
 dwS:{n:'Саморез по металлу 4,2×16 со сверлом (прессшайба), 100 шт',u:'уп.',pr:250,src:'est',url:S('саморез по металлу со сверлом 4,2х16'),lk:'search'}});
for(const c of WIN_CAT)CAT['win'+c.w+'x'+c.h]={n:`Мягкое окно ПВХ до −39 °C ${c.w/10}×${c.h/10} см, окантовка ПВХ, ${FX[c.fx]}`,u:'шт',pr:c.pr,src:'site',city:c.city,url:c.url,sku:c.sku,lk:c.lk};

// lite — для лестницы усилений: только размеры окон и сеток (ветер); скобы, лучи, гирлянда и лента строятся один раз, в итоговой модели
function dress(m,lite){
 const cfg=m.cfg,win=['pvc','both'].includes(cfg.win),net=['net','both'].includes(cfg.win),lt=['belt','led'].includes(cfg.light)?cfg.light:'0';
 m.dress=null;if(!win&&!net&&lt==='0')return;
 const P=m.parts,F=m.F;let uid=P.reduce((a,p)=>Math.max(a,p.id||0),0);
 const D={wins:[],nets:[],bom:[],winA:{x:0,z:0},netA:{x:0,z:0,a:0},scr:{dws:0,dww:0,dwp:0},br:0,light:null};
 const put=o=>{if(lite)return o;const p=Object.assign({kind:'box',layer:'dress',step:'dress',module:'loose',holes:[]},o);if(p.kind==='box'&&!p.az)p.az=norm(cross(p.ax,p.ay));p.id=++uid;P.push(p);return p;};
 const fast=(wood,p,n,t)=>{if(lite)return;t=t||(wood?'dww':'dws');m.screws.push({type:t,p,n,st:'dress'});D.scr[t]++;};
 // стойки по контуру, по кругу; у бруса на ножках — только брус
 let posts=P.filter(p=>p.kind==='tube'&&['post','postR','postW'].includes(p.role)&&p.layer!=='rail'&&Math.abs(p.az[1])>0.9);
 if(posts.some(p=>p.role==='postW'))posts=posts.filter(p=>p.role==='postW');
 const pts=[];for(const p of posts)if(!pts.some(q=>Math.hypot(q.x-p.o[0],q.z-p.o[2])<30))pts.push({x:p.o[0],z:p.o[2],hw:(p.sx||60)/2,wood:!!p.wood});
 if(pts.length<3)return;
 const cx=pts.reduce((s,q)=>s+q.x,0)/pts.length,cz=pts.reduce((s,q)=>s+q.z,0)/pts.length;
 pts.sort((a,b)=>Math.atan2(a.z-cz,a.x-cx)-Math.atan2(b.z-cz,b.x-cx));
 // детали каркаса как ориентированные коробки: для плоскости окна, опоры скоб и луча
 const OB=[];
 for(const p of P){if(!['frame','roofframe','rail','floor','hw'].includes(p.layer)||['decor','grout','pad','sand','pillar','gravel','stud','capPlate','deck','osb','shingle','underlay'].includes(p.role))continue;
  if(p.kind==='tube'){const z0=p.zA0||0,z1=p.zB1||p.L;OB.push({p,c:add(p.o,mul(p.az,(z0+z1)/2)),A:[p.ax,p.ay,p.az],h:[p.sx/2,p.sy/2,(z1-z0)/2],wood:!!p.wood});}
  else if(p.kind==='box'&&p.w&&p.h&&p.t)OB.push({p,c:p.c,A:[p.ax,p.ay,p.az],h:[p.w/2,p.h/2,p.t/2],wood:p.mat==='wood'||p.mat==='woodFill'});
  else if(p.kind==='angle')OB.push({p,c:add(p.o,add(add(mul(p.ax,p.A/2),mul(p.ay,p.B/2)),mul(p.az,p.L/2))),A:[p.ax,p.ay,p.az],h:[p.A/2,p.B/2,p.L/2],wood:false});}
 const ray=(o,d,tmax,L)=>{let best=null;
  for(const b of L||OB){let t0=0,t1=tmax;const r=sub(o,b.c);let ok=true;
   for(let k=0;k<3&&ok;k++){const e=dot(b.A[k],r),f=dot(b.A[k],d),h=b.h[k];
    if(Math.abs(f)<1e-9){if(Math.abs(e)>h)ok=false;continue;}
    let a=(-h-e)/f,c=(h-e)/f;if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)ok=false;}
   if(ok&&(!best||t0<best.t))best={t:t0,b};}
  return best;};
 for(const o of OB){const cs=corners8(o.p);o.lo=[0,1,2].map(k=>Math.min(...cs.map(c=>c[k])));o.hi=[0,1,2].map(k=>Math.max(...cs.map(c=>c[k])));}
 const near=(x0,x1,z0,z1)=>OB.filter(o=>o.hi[0]>=x0&&o.lo[0]<=x1&&o.hi[2]>=z0&&o.lo[2]<=z1);
 const n=pts.length,bays=[];
 for(let i=0;i<n;i++){const A=pts[i],B=pts[(i+1)%n],dx=B.x-A.x,dz=B.z-A.z,S=Math.hypot(dx,dz),t=[dx/S,0,dz/S];
  let nv=[t[2],0,-t[0]];if((A.x+B.x)/2*nv[0]-cx*nv[0]+((A.z+B.z)/2-cz)*nv[2]<0)nv=mul(nv,-1);
  bays.push({i,A,B,S,t,n:nv,o:[A.x,0,A.z],OB:near(Math.min(A.x,B.x)-500,Math.max(A.x,B.x)+500,Math.min(A.z,B.z)-500,Math.max(A.z,B.z)+500)});}
 // поворот контура у каждой стойки: край окна заходит за ось стойки на d·tg(θ/2) — окна соседних граней сходятся на углу
 const turn=i=>{const a=bays[(i-1+n)%n].t,b=bays[i].t;return Math.acos(Math.max(-1,Math.min(1,dot(a,b))));};
 const loc=(b,q)=>{const r=sub(q,b.o);return[dot(r,b.t),q[1],dot(r,b.n)];};
 const at=(b,u,y,v)=>add(add(b.o,mul(b.t,u)),add([0,y,0],mul(b.n,v)));
 // горизонтальные детали в плоскости грани: балка сверху, балка пола или нижний брус снизу
 const inPlane=b=>b.OB.filter(o=>o.p.kind==='tube'&&Math.abs(dot(o.p.az,b.t))>0.9&&Math.abs(o.p.az[1])<0.4).map(o=>{const cs=corners8(o.p).map(q=>loc(b,q)),us=cs.map(c=>c[0]),vs=cs.map(c=>c[2]);
   const s0=dot(sub(o.p.o,b.o),b.t),k=dot(o.p.az,b.t),hv=(Math.abs(o.p.ax[1])*o.p.sx+Math.abs(o.p.ay[1])*o.p.sy)/2;
   const yAt=u=>o.p.o[1]+o.p.az[1]*(u-s0)/k;
   return{o,u0:Math.min(...us),u1:Math.max(...us),v0:Math.min(...vs),v1:Math.max(...vs),vc:(Math.min(...vs)+Math.max(...vs))/2,bot:u=>yAt(u)-hv,top:u=>yAt(u)+hv,ym:yAt(b.S/2)};})
  .filter(h=>h.v1>-260&&h.v0<260&&h.u0<b.S*0.95&&h.u1>b.S*0.05);
 // несколько деталей вдоль пролёта — как одна: в каждой точке — та, что ближе к проёму; должны перекрывать 85% пролёта
 const compose=(b,hs,mode)=>{if(!hs.length)return null;
  if(mode==='high'){const t0=Math.max(...hs.map(h=>Math.max(h.top(Math.max(0,h.u0)),h.top(Math.min(b.S,h.u1)))));hs=hs.filter(h=>Math.max(h.top(Math.max(0,h.u0)),h.top(Math.min(b.S,h.u1)))>t0-30);}
  const iv=hs.map(h=>[Math.max(0,h.u0),Math.min(b.S,h.u1)]).sort((a,c)=>a[0]-c[0]);let cov=0,e=-1e9;for(const [a,c] of iv){if(c<=e)continue;cov+=c-Math.max(a,e);e=c;}if(cov<b.S*0.85)return null;
  const pick=u=>{const on=hs.filter(h=>u>=h.u0-60&&u<=h.u1+60),L=on.length?on:hs;return L.reduce((x,h)=>mode==='low'?(h.bot(u)<x.bot(u)?h:x):(h.top(u)>x.top(u)?h:x));};
  const bot=u=>pick(u).bot(u),top=u=>pick(u).top(u),sm=[0,0.25,0.5,0.75,1].map(k=>k*b.S),mid=pick(b.S/2);
  const set=new Set(hs.map(h=>h.o.p));
  return{h:{bot,top,vc:mid.vc,o:mid.o,has:p=>set.has(p)},y:mode==='low'?Math.min(...sm.map(bot)):Math.max(...sm.map(bot)),yt:mode==='low'?Math.min(...sm.map(top)):Math.max(...sm.map(top))};};
 for(const b of bays){const H=inPlane(b);
  // сверху — балка (или ригель из двух половин со стыком), не поручень высокого борта; снизу — балка пола или нижний брус
  const tops=H.filter(h=>h.ym>F+m.H*0.55&&h.o.p.layer!=='rail'&&!/^rail/.test(h.o.p.role));
  b.topM=compose(b,tops,'low');
  const bots=H.filter(h=>h.ym<F+500&&h.ym>(m.y0||0)+40&&!/^rail(Top|Mid)/.test(h.o.p.role));
  b.botM=bots.length?compose(b,bots.filter(h=>h.ym<=F+5).length?bots.filter(h=>h.ym<=F+5):bots,'high'):null;
  const rails=H.filter(h=>h.o.p.role==='railTop');let cov=0;for(const r of rails)cov+=Math.max(0,Math.min(b.S,r.u1)-Math.max(0,r.u0));b.railCov=cov/b.S;
  b.mz=(b.A.z+b.B.z)/2;}
 const okB=bays.filter(b=>b.topM);if(!okB.length)return;
 /* детали, которые задают плоскость стены: только этой стены. Детали соседней (перпендикулярной) стены у угла —
    её штакетины, стойки секций, лотки коннекторов поперечных балок — уходят внутрь на 100–330 мм и утаскивали сетку в воздух.
    Своя деталь: труба вдоль стены или вертикальная на линии стоек; плита/доска — тонкая поперёк стены (≤ 40 мм) и у линии стоек */
 const wallExt=(b,y0,y1)=>{let lo=1e9,hi=-1e9;const lim=Math.max(b.A.hw,b.B.hw);
  for(const o of b.OB){const p=o.p;if(p.layer==='roofframe'&&!b.topM.h.has(p))continue;
   const cs=corners8(p).map(q=>loc(b,q)),us=cs.map(c=>c[0]),ys=cs.map(c=>c[1]),vs=cs.map(c=>c[2]),v0=Math.min(...vs),v1=Math.max(...vs),vc=(v0+v1)/2;
   if(Math.max(...us)<-b.A.hw||Math.min(...us)>b.S+b.B.hw||Math.max(...ys)<y0||Math.min(...ys)>y1)continue;
   if(p.kind==='tube'){const ct=Math.abs(dot(p.az,b.t)),cy=Math.abs(p.az[1]),cn=Math.abs(dot(p.az,b.n));if(cn>0.3)continue;if(ct>0.9?Math.abs(vc)>lim+100:Math.abs(vc)>lim+10)continue;}
   else if(v1-v0>40||Math.abs(vc)>lim+60)continue;
   lo=Math.min(lo,v0);hi=Math.max(hi,v1);}
  return{lo,hi};};
 D._bays=bays.length;D._skip=bays.filter(b=>!b.topM).map(b=>({i:b.i,S:Math.round(b.S),A:[Math.round(b.A.x),Math.round(b.A.z)],B:[Math.round(b.B.x),Math.round(b.B.z)]}));
 const zMax=Math.max(...okB.map(b=>b.mz)),anyRail=bays.some(b=>b.railCov>0.5);
 for(const b of bays)b.door=!!b.topM&&b.mz>zMax-60&&(anyRail?b.railCov<0.9:true);
 const grp=(k,o)=>Object.assign(o,{grp:k});
 /* ---------- мягкие окна ---------- */
 if(win){const byKey={};let wi=0;
  for(const b of okB){wi++;
   const yT0=b.topM.y,yT=Math.min(yT0+40,b.topM.yt-8);
   const yB=b.botM?Math.max(b.botM.y+6,b.botM.yt-45):Math.max(F,m.y0||0)+80;
   // плоскость: самая выступающая деталь в прямоугольнике окна (стойки, балки, борта, пластины коннекторов)
   const vmax=wallExt(b,yB,b.topM.y-1).hi;
   const d=Math.max(vmax,b.A.hw)+8;
   const eA=d*Math.tan(turn(b.i)/2),eB=d*Math.tan(turn((b.i+1)%n)/2);
   /* готовое окно годится, только если люверсы (22 мм от края) ложатся на стойки, балку сверху и деталь снизу:
      край у стойки — в пределах её грани, верх — на балке, низ — на балке пола (или свободен, если её нет) */
   const lim=(hw,e,cor)=>cor?Math.min(hw+17,e+10):hw+17,cA=turn(b.i)>0.05,cB=turn((b.i+1)%n)>0.05;
   const wMin=b.S-(b.A.hw-27)-(b.B.hw-27),wMax=b.S+lim(b.A.hw,eA,cA)+lim(b.B.hw,eB,cB);
   const tMin=b.topM.y+27,tMax=b.topM.yt-5,bMin=b.botM?b.botM.y-17:(m.y0||0)+30,bMax=b.botM?b.botM.yt-27:Math.max(F,m.y0||0)+150;
   let fit=null;for(const c of WIN_CAT)for(const [cw,ch] of [[c.w,c.h],[c.h,c.w]]){if(cw<wMin||cw>wMax||ch<tMin-bMax||ch>tMax-bMin)continue;if(!fit||c.pr<fit.c.pr)fit={c,cw,ch};}
   // скатная балка сверху: окно-трапеция на заказ, верх идёт по балке; вход на такой грани — дверь на молнии
   const slope=Math.abs(b.topM.h.bot(b.S)-b.topM.h.bot(0))>30;if(slope)fit=null;
   const w=fit?fit.cw:Math.ceil((b.S+eA+eB-6)/10)*10;
   let h=fit?fit.ch:Math.ceil((yT-yB)/10)*10,top=yT;
   if(fit){if(top-h<bMin)top=Math.min(tMax,bMin+h);if(top-h>bMax)top=Math.max(tMin,bMax+h);}
   let um=(-eA+b.S+eB)/2;if(fit){const lo=Math.max(w/2-lim(b.A.hw,eA,cA),b.S-(b.B.hw-27)-w/2),hi=Math.min(w/2+b.A.hw-27,b.S+lim(b.B.hw,eB,cB)-w/2);um=Math.max(lo,Math.min(hi,um));}
   const bot=top-h,uL=um-w/2,uR=um+w/2,tAt=slope?u=>Math.min(b.topM.h.bot(u)+40,b.topM.h.top(u)-8):()=>top,tL=tAt(uL),tR=tAt(uR);
   const hL=Math.round((tL-bot)/10)*10,hR=Math.round((tR-bot)/10)*10,roll=b.door&&!slope,zip=b.door&&slope;
   const fx=fit?fit.c.fx:'turn',key=fit?'win'+fit.c.w+'x'+fit.c.h:(slope?`winT${w}x${hL}x${hR}`:`winC${w}x${h}`)+(zip?'z':''),G='dress-win-'+wi;
   const sz=slope?`${w}×${hL}…${hR}`:`${w}×${h}`,area=w*((tL+tR)/2-bot)/1e6;
   const side=['спереди','сзади','слева','справа'][Math.abs(b.n[2])>0.7?(b.n[2]>0?0:1):(b.n[0]<0?2:3)];
   const nm=m.poly?`грань ${wi}`:side,title=`Мягкое окно ПВХ ${sz}${slope?' трапеция':''} (${nm}${roll?', вход — скатывается':zip?', вход — дверь на молнии':''})`;
   const size=`${sz} мм · ПВХ 0,7 мм, окантовка 45 мм`+(fit?` · готовое ${fit.c.w/10}×${fit.c.h/10} см${fit.cw!==fit.c.w?' (повёрнуто)':''}`:' · на заказ');
   const why=roll?'вход: окно скатывается рулоном вверх и держится двумя ремешками; опускается в непогоду':zip?'вход на скатной грани: рулон не скатать — проём на П-образной молнии, верх окна идёт по балке':slope?'верх — по скатной балке: прямоугольное окно висело бы без опоры по верху':'закрывает пролёт от ветра и дождя; висит снаружи на скобах — каркас не сверлится насквозь';
   const base={grp:G,cat:key,size,why};
   byKey[key]=byKey[key]||{n:0,sz,w,h,fit,area:0,door:0,zip:0,slope};byKey[key].n++;byKey[key].area+=area;if(roll)byKey[key].door++;if(zip)byKey[key].zip++;
   D.winA.x+=area*Math.abs(b.n[0]);D.winA.z+=area*Math.abs(b.n[2]);
   const X=b.t,Y=[0,1,0],kant=(nm_,u0,y0,u1,y1)=>{const a=at(b,u0,y0,d+2.6),c=at(b,u1,y1,d+2.6),L=len(sub(c,a)),ax=norm(sub(c,a)),ay=Math.abs(ax[1])>0.9?X:norm(sub(Y,mul(ax,ax[1])));
     put(Object.assign({name:title+' — '+nm_,role:'winKant',c:mul(add(a,c),0.5),ax:Math.abs(ax[1])>0.9?Y:ax,ay:Math.abs(ax[1])>0.9?X:ay,w:L,h:45,t:1.6,mat:'kant'},base));};
   if(!roll){
    if(slope)put(Object.assign({kind:'tri',name:title,role:'winPane',pts:[[uL,bot],[uR,bot],[uR,tR],[uL,tL]],o:at(b,0,0,d+0.25),ax:X,ay:Y,az:norm(cross(X,Y)),t:1.5,h0:0,mat:'pvc'},base));
    else put(Object.assign({name:title,role:'winPane',c:at(b,um,bot+h/2,d+1),ax:X,ay:Y,w,h,t:1.5,mat:'pvc'},base));
    kant('окантовка верха',uL,tL-22.5,uR,tR-22.5);kant('окантовка низа',uL,bot+22.5,uR,bot+22.5);
    kant('окантовка',uL+22.5,bot+45,uL+22.5,tL-45);kant('окантовка',uR-22.5,bot+45,uR-22.5,tR-45);
    if(zip){const E=Math.min(m.E||900,w-500),hd=Math.min(2000,Math.min(tL,tR)-bot-160);
     for(const [a0,b0,a1,b1] of [[um-E/2,bot+45,um-E/2,bot+hd],[um+E/2,bot+45,um+E/2,bot+hd],[um-E/2,bot+hd,um+E/2,bot+hd]]){const a=at(b,a0,b0,d+2.8),c=at(b,a1,b1,d+2.8),ax=norm(sub(c,a));
      put(Object.assign({name:title+' — молния дверного проёма',role:'winZip',c:mul(add(a,c),0.5),ax,ay:Math.abs(ax[1])>0.9?X:Y,w:len(sub(c,a))+12,h:12,t:2,mat:'plastic'},base));}}}
   else{kant('окантовка верха',uL,top-22.5,uR,top-22.5);
    put(Object.assign({name:title+' — в рулоне',role:'winRoll',c:at(b,um,top-45-42,d+42),ax:Y,ay:b.n,w:80,h:80,t:w-90,round:true,mat:'pvcRoll'},base));
    for(const s of [-1,1])put(Object.assign({name:title+' — окантовка в рулоне',role:'winKant',c:at(b,um+s*(w/2-22.5),top-45-42,d+42),ax:Y,ay:b.n,w:84,h:84,t:45,round:true,mat:'kant'},base));
    for(const s of [-1,1])put(Object.assign({name:title+' — ремешок рулона',role:'winStrap',c:at(b,um+s*(w/2-260),top-45-42,d+42),ax:X,ay:Y,w:24,h:132,t:88,mat:'kant'},base));}
   // скобы: по периметру окна шагом ≤ 450 мм, в 22 мм от края; только там, где сзади есть деталь
   const u0=uL+22,u1=uR-22,y0=bot+22,pts_=[];
   const runs=(a,c)=>{const k=Math.max(1,Math.ceil((c-a)/450));return[...Array(k+1)].map((_,j)=>a+(c-a)*j/k);};
   for(const u of runs(u0,u1))pts_.push([u,tAt(u)-22,'top']);
   if(!roll){for(const u of runs(u0,u1))pts_.push([u,y0,'bot']);
    const st=wi%2;for(const [u,yt] of [[u0,tAt(u0)-22],[u1,tAt(u1)-22]]){const r=runs(y0,yt);for(let j=1;j<r.length-1;j++)pts_.push([u,st?(r[j]+r[j-1])/2:r[j],'side']);if(st)pts_.push([u,(r[r.length-1]+r[r.length-2])/2,'side']);}}   // боковые скобы через одно окно — вразбежку: у общей стойки не сталкиваются
   let nb=0;
   if(lite)nb=pts_.length;else for(const [u,y,e] of pts_){const P0=at(b,u,y,d+20),hit=ray(P0,mul(b.n,-1),220,b.OB);if(!hit)continue;
    const surf=add(P0,mul(b.n,-hit.t)),gap=hit.t-20,ex=e==='side'?Y:X,ey=e==='side'?X:Y;
    put(Object.assign({name:(fx==='strap'?'Скоба с ремешком':'Скоба поворотная')+' (окно '+nm+')',role:'winBracket',c:add(surf,mul(b.n,(gap+10)/2)),ax:ex,ay:ey,w:26,h:9,t:gap+10,mat:'galv'},base,{size:'скоба 26×9 мм, 2 самореза',why:fx==='strap'?'ремешок пропущен через люверс и скобу, затягивается пряжкой':'люверс окна надевается на скобу, скоба поворачивается и запирает его',cat:hit.b.wood?'dwW':'dwS'}));
    put(Object.assign({name:'Люверс окантовки (окно '+nm+')',role:'winEyelet',c:at(b,u,y,d+3.6),ax:X,ay:Y,w:22,h:22,t:1.4,round:true,mat:'galv'},base));
    for(const s of [-1,1])fast(hit.b.wood,add(surf,mul(ex,s*9)),b.n);nb++;}
   D.br+=nb;D.wins.push({nm,sz,w,h,area,fit:!!fit,roll,zip,slope,brackets:nb,bottomFree:!b.botM,off:Math.round(d-Math.max(b.A.hw,b.B.hw))});}
  for(const k in byKey){const v=byKey[k],a=v.area.toFixed(1).replace('.',','),one=v.area/v.n;
   if(v.fit)D.bom.push({key:k,qty:v.n,note:`${v.n} ${pl_(v.n,'окно','окна','окон')} на ${a} м²${v.fit.cw!==v.fit.c.w?', вешается боком':''}${v.door?' · входное скатывается':''}`});
   else{const pr=Math.round((one*WIN_M2+(v.zip?ZIP_PR:0))/10)*10;
    D.bom.push({key:k,base:'winCustom',qty:v.n,name:`Мягкое окно ПВХ 0,7 мм на заказ ${v.sz} мм${v.slope?', трапеция (верх по балке)':''}${v.zip?', дверной проём на молнии':''}, окантовка, скобы`,price:pr,
     note:`${v.n} × ${one.toFixed(2).replace('.',',')} м²${v.door?' · входное скатывается':''} · ${v.slope?'косой верх':'готового такого размера в Лемане нет'}`,
     warn:`Цена — оценка: медиана готовых окон Леманы ${Math.round(WIN_M2/1.2)} ₽/м² + 20% за пошив по размеру${v.zip?` + ${ZIP_PR} ₽ за молнию`:''}. Шьют тентовые мастерские; дайте им размеры из этой строки.`});}}}
 /* ---------- москитная сетка: изнутри, на ленте-липучке. Мягкую половину пришивают по краю сетки,
    жёсткую — саморезами с прессшайбой через 200 мм к стойкам, балке и настилу. Порыв ветра её отстёгивает — каркасу это ничем не грозит ---------- */
 if(net){const pieces=[];let wi=0,velc=0;
  for(const b of okB){wi++;
   const bot0=m.isFloor?F:b.botM?b.botM.y:Math.max(F,m.y0||0)+40;
   const vmin=wallExt(b,bot0,b.topM.y-1).lo;
   const dI=Math.min(vmin,-b.A.hw)-14,slope=Math.abs(b.topM.h.bot(b.S)-b.topM.h.bot(0))>30;   // 14 мм от грани — над головками саморезов и шнуром удлинителя
   b.netD=-dI;const uL=b.A.hw-28,uR=b.S-b.B.hw+28,w=uR-uL,tAt=u=>b.topM.h.bot(u)+31,tL=tAt(uL),tR=tAt(uR),bot=bot0+(m.isFloor?2:0);
   const area=w*((tL+tR)/2-bot)/1e6,hMax=Math.max(tL,tR)-bot,G='dress-net-'+wi,X=b.t,Y=[0,1,0];
   const side=['спереди','сзади','слева','справа'][Math.abs(b.n[2])>0.7?(b.n[2]>0?0:1):(b.n[0]<0?2:3)],nm=m.poly?`грань ${wi}`:side;
   const title=`Москитная сетка ${Math.round(w)}×${Math.round(hMax)} (${nm}${b.door?', вход — скатывается':''})`,base={grp:G,cat:'netRoll',size:`${Math.round(w)}×${Math.round(hMax)} мм из полотна 1,4 м, край — мягкая половина липучки`,why:b.door?'вход: сетка скатывается вверх и подвязывается; опускается на липучку':'от комаров; висит изнутри на липучке, в порыв ветра отстёгивается, а не рвётся'};
   if(!b.door){if(slope)put(Object.assign({kind:'tri',name:title,role:'netPane',pts:[[uL,bot],[uR,bot],[uR,tR],[uL,tL]],o:at(b,0,0,dI),ax:X,ay:Y,az:norm(cross(X,Y)),t:0.8,h0:0,mat:'net'},base));
    else put(Object.assign({name:title,role:'netPane',c:at(b,(uL+uR)/2,(bot+tL)/2,dI),ax:X,ay:Y,w,h:tL-bot,t:0.8,mat:'net'},base));}
   else{const tT=Math.min(tL,tR),um=(uL+uR)/2,yR=tT-58;   // вход: верх сетки — на липучке под балкой, под ним рулон вплотную к плоскости, две завязки вокруг
    put(Object.assign({name:title+' — верх над рулоном',role:'netPane',c:at(b,um,(tT+yR)/2,dI),ax:X,ay:Y,w:w-20,h:tT-yR,t:0.8,mat:'net'},base));
    put(Object.assign({name:title+' — в рулоне',role:'netRoll',c:at(b,um,yR,dI-24),ax:Y,ay:b.n,w:46,h:46,t:w-60,round:true,mat:'netRoll'},base));
    for(const sg of [-1,1])put(Object.assign({name:title+' — завязка рулона',role:'netTie',c:at(b,um+sg*(w/2-240),yR+10,dI-24),ax:X,ay:Y,w:16,h:72,t:52,mat:'kant'},base));}
   if(!lite){   // жёсткая половина ленты на каркасе: стойки (своя половина грани), балка сверху, настил снизу; саморез — только если за лентой деталь
   const strip=(nm_,a,c,ex,ey,pts_,dir,wood)=>{const L=len(sub(c,a));if(L<50)return;put(Object.assign({name:'Лента-липучка жёсткая (сетка '+nm+')'+nm_,role:'netVelcro',c:mul(add(a,c),0.5),ax:ex,ay:ey,w:L,h:25,t:2.5,mat:'velcro'},base,{cat:'velcro',size:`${Math.round(L)} мм, лента 25 мм`,why:'держит сетку; мягкая половина пришита по её краю'}));velc+=L;
    for(const q of pts_)fast(wood,q,dir,wood?'dwp':'dws');};
   for(const [u,pA] of [[b.A.hw-14,b.A],[b.S-b.B.hw+14,b.B]]){const y0=bot+40,y1=(u<b.S/2?tL:tR)-45,P0=at(b,u,(y0+y1)/2,dI-60),h=ray(P0,b.n,200,b.OB);if(!h)continue;const vs=dot(sub(add(P0,mul(b.n,h.t)),b.o),b.n),k=Math.max(2,Math.ceil((y1-y0)/200)),sc=[];
    for(let j=0;j<=k;j++){const y=y0+(y1-y0)*j/k,Q=at(b,u,y,vs-60),hh=ray(Q,b.n,120,b.OB);if(hh)sc.push(add(Q,mul(b.n,hh.t-1.4)));}
    strip(', стойка',at(b,u,y0,vs-1.3),at(b,u,y1,vs-1.3),Y,X,sc,mul(b.n,-1),h.b.wood);}
   {const P0=at(b,(uL+uR)/2,b.topM.h.bot((uL+uR)/2)+16,dI-60),h=ray(P0,b.n,220,b.OB);if(h){const vs=dot(sub(add(P0,mul(b.n,h.t)),b.o),b.n),k=Math.max(2,Math.ceil(w/200)),sc=[];
    for(let j=0;j<=k;j++){const u=uL+20+(w-40)*j/k,Q=at(b,u,b.topM.h.bot(u)+16,vs-60),hh=ray(Q,b.n,120,b.OB);if(hh)sc.push(add(Q,mul(b.n,hh.t-1.4)));}
    const a=at(b,uL+10,b.topM.h.bot(uL+10)+16,vs-1.3),c=at(b,uR-10,b.topM.h.bot(uR-10)+16,vs-1.3),ax=norm(sub(c,a));strip(', балка',a,c,ax,Y,sc,mul(b.n,-1),h.b.wood);}}
   if(m.isFloor){const k=Math.max(2,Math.ceil(w/200)),sc=[];for(let j=0;j<=k;j++)sc.push(at(b,uL+20+(w-40)*j/k,F+2.5,dI-14));
    const a=at(b,uL+10,F+1.25,dI-14),c=at(b,uR-10,F+1.25,dI-14);put(Object.assign({name:'Лента-липучка жёсткая (сетка '+nm+'), настил',role:'netVelcro',c:mul(add(a,c),0.5),ax:X,ay:b.n,w:len(sub(c,a)),h:25,t:2.5,mat:'velcro'},base,{cat:'velcro',size:`${Math.round(w-20)} мм, лента 25 мм`,why:'низ сетки ложится на настил — щели у пола нет'}));velc+=w-20;
    for(const q of sc)fast(true,q,[0,1,0],'dwp');}
   }
   // раскрой из полотна 1,4 м: узкое — одним куском по высоте, широкое и высокое — двумя со швом внахлёст 30 мм
   const Wp=w+60,Hp=hMax+60+(m.isFloor?30:0);
   if(Wp<=1400)pieces.push({len:Math.ceil(Hp),name:`${nm}: целиком`});else if(Hp<=1400)pieces.push({len:Math.ceil(Wp),name:`${nm}: поперёк рулона`});
   else{const k=Math.ceil((Wp+30)/1370);for(let j=0;j<k;j++)pieces.push({len:Math.ceil(Hp),name:`${nm}: полоса ${j+1} из ${k}, шов внахлёст`});}
   D.netA.x+=area*Math.abs(b.n[0]);D.netA.z+=area*Math.abs(b.n[2]);D.netA.a+=area;
   D.nets.push({nm,w:Math.round(w),h:Math.round(hMax),area,door:b.door,slope,seam:Wp>1400&&Hp>1400,off:Math.round(-dI-Math.max(b.A.hw,b.B.hw))});}
  const pl=cut1D(pieces,[{L:10000,pr:CAT.netRoll.pr,key:'netRoll'}],0);   // в упаковке пара 25 м: жёсткая на каркас + мягкая на сетку
  D.bom.push({key:'netRoll',qty:pl.n,note:`${pieces.length} ${pl_(pieces.length,'кусок','куска','кусков')} на ${D.nets.length} ${pl_(D.nets.length,'сетку','сетки','сеток')} · в дело ${Math.round(pl.util*100)}%${D.nets.some(x=>x.seam)?' · широкие — из двух полос со швом':''}`});
  D.bom.push({key:'velcro',qty:Math.ceil(velc*1.05/25000),note:`${(velc/1000).toFixed(1).replace('.',',')} м по периметру сеток + 5%: жёсткая — на каркас, мягкая — пришить к сетке`});}
 /* ---------- свет ---------- */
 const steelOf=b=>!b.topM.h.o.wood;
 // колодка удлинителя на внутренней грани стойки у входа, под балкой (вилки под крышей), шнур — вниз по стойке на стяжках
 /* колодка удлинителя — под балкой у входа, по её оси: внутри, под крышей, не мешает ни окну снаружи, ни сетке изнутри и под рукой.
    Шнур — по низу балки к стойке и вниз по её внутренней грани между лентами-липучками; сетка проходит поверх, в 14 мм от грани */
 const underBeam=(db,u,dy)=>{const P0=at(db,u,db.topM.h.bot(u)-120,0),h=ray(P0,[0,1,0],200,db.OB);return h?{p:add(P0,[0,h.t,0]),wood:h.b.wood}:null;};
 const powerPost=(db,G,ext,two,why)=>{const hw=db.A.hw,ub=hw+150,hb=underBeam(db,ub+60);if(!hb)return 0;let k=0;
  put({name:'Удлинитель уличный IP44 (колодка под балкой)',role:'plugBlock',c:add(hb.p,[0,-23,0]),ax:db.t,ay:[0,1,0],w:120,h:46,t:66,mat:'plastic',grp:G,cat:ext,size:two?'колодка на 2 розетки, IP44':'розетка шнура, IP44',why});
  for(const s2 of [-1,1])fast(hb.wood,add(hb.p,mul(db.t,s2*45)),[0,-1,0]);
  const yB=hb.p[1]-5,vC=-hw-5,yb=Math.max(F,m.y0||0)+40,seg=(a,c,nm)=>put({name:'Удлинитель уличный IP44 ('+nm+')',role:'plugCord',c:mul(add(a,c),0.5),...frameOf(a,c),w:9,h:9,t:len(sub(c,a)),round:true,mat:'cable',grp:G,cat:ext,size:'шнур 10 м до розетки с УЗО',why:'от колодки по низу балки и вниз по стойке на стяжках, дальше — к розетке дома'});
  const c1=at(db,ub,yB,vC),c2=at(db,0,yB,vC),c3=at(db,0,yb,vC);seg(c1,c2,'шнур по балке');seg(c2,c3,'шнур по стойке');
  for(let y=yb+250;y<yB-60;y+=500){put({name:'Стяжка кабельная (шнур удлинителя)',role:'plugTie',c:at(db,0,y,vC),ax:db.t,ay:[0,1,0],w:16,h:8,t:16,mat:'plastic',grp:G,cat:'ties',size:'стяжка 4,8×200 мм',why:'шнур прижат к стойке'});k++;}
  return k;};
 if(lt==='belt'&&!lite){const G='dress-belt',hangs=[];
  // от стойки у входа: там под балкой колодка удлинителя, комплекты расходятся от неё в обе стороны (вилки — в одной точке, под крышей)
  const inner0=(i,y)=>{const a=bays[(i-1+n)%n],c=bays[i],bi=norm(add(a.n,c.n)),th=turn(i),q=pts[i],o=q.hw/Math.cos(th/2);return[q.x-bi[0]*o,y,q.z-bi[2]*o];};
  const inner=(i,y)=>{const a=bays[(i-1+n)%n],c=bays[i],bi=norm(add(a.n,c.n)),th=turn(i),q=pts[i],o=Math.max(q.hw+35,(a.netD||0)+45,(c.netD||0)+45)/Math.cos(th/2);return[q.x-bi[0]*o,y,q.z-bi[2]*o];};   // с сеткой — на 45 мм внутрь от её плоскости: лампа Ø48 её не касается
  const db=okB.find(b=>b.door)||okB[0],k0=okB.indexOf(db),ring=okB.slice(k0).concat(okB.slice(0,k0));
  let Lc=0,nb=0,nt=0,minY=1e9,last=null;const chain=[];
  for(const b of ring){const pA=inner(b.i,b.topM.h.bot(0)-30),pB=inner((b.i+1)%n,b.topM.h.bot(b.S)-30),Lb=Math.hypot(pB[0]-pA[0],pB[2]-pA[2]),k=Math.max(1,Math.ceil(Lb/1700));
   if(last&&len(sub(last,pA))>1)chain.push([last,pA]);
   for(let j=0;j<k;j++){const a=add(pA,mul(sub(pB,pA),j/k)),c=add(pA,mul(sub(pB,pA),(j+1)/k)),sp=Lb/k,f=Math.max(40,Math.min(100,sp*0.05));
    hangs.push({p:a,post:j===0,to:j===0?inner0(b.i,b.topM.h.bot(0)-30):add(a,add(mul(b.n,dot(sub(at(b,0,0,-b.A.hw),a),b.n)),[0,30,0]))});const N=Math.max(4,Math.ceil(sp/140));
    let prev=a;for(let s=1;s<=N;s++){const r=s/N,q=add(add(a,mul(sub(c,a),r)),[0,-4*f*r*(1-r),0]);chain.push([prev,q]);prev=q;}}
   last=pB;}
  for(const [a,c] of chain)Lc+=len(sub(c,a));
  // комплекты: 10 м (20 ламп) и 5 м (10 ламп), шаг патронов один — 0,5 м; самый дешёвый набор, покрывающий контур (+0,3 м на вилку каждого)
  let best=null;for(const set of [[5],[10],[5,5],[10,5],[10,10]]){const L=set.reduce((x,y)=>x+y,0)*1000-300*set.length,pr=set.reduce((x,y)=>x+CAT[y===10?'belt':'belt5'].pr,0)+CAT[set.length>1?'extCord2':'extCord'].pr/* два комплекта — две вилки: колодка на 2 розетки */;if(L>=Lc&&(!best||pr<best.pr-1))best={set,pr,L};}
  if(!best)best={set:[10,10],pr:2*CAT.belt.pr,L:19400};
  const s1=Math.min(Lc,best.set[0]*1000-300);   // первый комплект — вперёд от входа, второй — назад, встречаются на дальней стороне
  const pos=[];for(let x=250;x<=s1;x+=500)pos.push(x);if(best.set.length>1)for(let x=Lc-250;x>s1+200;x-=500)pos.push(x);pos.sort((a,b)=>a-b);
  let acc=0,pi=0;
  for(const [a,c] of chain){const L=len(sub(c,a));
   put({name:'Гирлянда белт-лайт (провод с патронами)',role:'beltWire',c:mul(add(a,c),0.5),...frameOf(a,c),w:6,h:6,t:L+1,round:true,mat:'cable',grp:G,cat:'belt',size:'двужильный провод с патронами E27 через 0,5 м',why:'контурный свет: висит с провисом между стойками'});
   while(pi<pos.length&&pos[pi]<=acc+L){const r=(pos[pi]-acc)/L,q=add(a,mul(sub(c,a),r));
    put({name:'Гирлянда белт-лайт (патрон E27)',role:'beltSocket',c:add(q,[0,-26,0]),ax:[1,0,0],ay:[0,0,-1],w:34,h:34,t:44,round:true,mat:'plastic',grp:G,cat:'belt',size:'патрон E27 с уплотнением',why:'лампа вкручивается вниз — вода не затекает'});
    put({kind:'ball',name:'Гирлянда белт-лайт (лампа LED)',role:'beltBulb',c:add(q,[0,-72,0]),r:24,mat:'bulb',glow:1,grp:G,cat:'belt',size:'LED-лампа E27 Ø48 мм, ≈1 Вт',why:'тёплый свет, корпус не греется'});
    pi++;nb++;minY=Math.min(minY,q[1]-72-24);}
   acc+=L;}
  for(const h of hangs){const L=Math.max(20,len(sub(h.to,h.p)));put({name:'Стяжка кабельная (гирлянда)',role:'beltTie',c:mul(add(h.p,h.to),0.5),...frameOf(h.p,L>21?h.to:add(h.p,[0,20,0])),w:5,h:5,t:L,mat:'plastic',grp:G,cat:'ties',size:'стяжка 4,8×200 мм, морозостойкая',why:h.post?'провод к стойке под балкой':'промежуточный подвес к балке: провис не больше 5%'});nt++;}
  const two=best.set.length>1,ext=two?'extCord2':'extCord';nt+=powerPost(db,G,ext,two,'вилки гирлянды — под крышей, в стороне от дождя');
  const spare=best.L-Lc;
  D.light={type:'belt',len:Lc,bulbs:nb,ties:nt,sets:best.set.length,set:best.set,watts:nb,clear:Math.round(minY-F),spare};
  const n10=best.set.filter(x=>x===10).length,n5=best.set.length-n10,split=best.set.length>1?` · ${best.set.join(' + ')} м: от стойки у входа в разные стороны`:'';
  const ipw='IP на карточке не указан — проверить на упаковке (для улицы нужно IP44+). Если ниже: Uniel арт. 82435136 — IP65, соединяемая, 40 патронов на 10 м, лампы E27 отдельно.';
  if(n10)D.bom.push({key:'belt',qty:n10,note:`контур ${(Lc/1000).toFixed(1).replace('.',',')} м${split}${spare>600?` · запас ${(spare/1000).toFixed(1).replace('.',',')} м — в смотке у колодки`:''}`,warn:ipw});
  if(n5)D.bom.push({key:'belt5',qty:n5,note:n10?'добирает контур до колодки':`контур ${(Lc/1000).toFixed(1).replace('.',',')} м`,warn:ipw});
  D.bom.push({key:'ties',qty:1,note:`${nt} шт: подвесы гирлянды и шнур по стойке`});
  D.bom.push({key:ext,qty:1,note:two?'колодка — на стойке у входа под балкой: обе вилки под крышей; шнур — к розетке с УЗО 30 мА':'розетка шнура — на стойке у входа под балкой; другой конец — в розетку с УЗО 30 мА'});}
 if(lt==='led'&&!lite){const G='dress-led',segs=[];let Ls=0;
  for(const b of okB){const tm=b.topM,uA=b.A.hw+6,uB=b.S-b.B.hw-6,L=uB-uA;if(L<300)continue;
   const vc=tm.h.vc,wood=!steelOf(b),qA=at(b,uA,tm.h.bot(uA),vc),qB=at(b,uB,tm.h.bot(uB),vc),ax=norm(sub(qB,qA));let ay=cross(b.n,ax);if(ay[1]<0)ay=mul(ay,-1);
   const Lr=len(sub(qB,qA)),mid=mul(add(qA,qB),0.5),dn=mul(ay,-1);
   put({name:'LED-подсветка (профиль М1506)',role:'ledProfile',c:add(mid,mul(dn,3)),ax,ay,w:Lr,h:6,t:15,mat:'alu',grp:G,cat:'ledProf',size:`${Math.round(Lr)} мм, 15×6 мм`,why:'лента в профиле по низу балки: свет вниз, лента защищена и отводит тепло'});
   put({name:'LED-подсветка (лента 4,8 Вт/м)',role:'ledStrip',c:add(mid,mul(dn,6.6)),ax,ay,w:Lr-10,h:1.2,t:9,mat:'led',glow:2,grp:G,cat:'ledTape',size:`${Math.round(Lr-10)} мм, 12 В, IP65`,why:'контурная подсветка по низу балок'});
   const k=Math.max(2,Math.ceil(Lr/700)+1);for(let j=0;j<k;j++)fast(wood,add(add(qA,mul(ax,30+(Lr-60)*j/(k-1))),mul(dn,6)),dn);
   segs.push({len:Math.round(Lr),name:`балка ${segs.length+1}`});Ls+=Lr;}
  if(!segs.length)return void (m.dress=null);
  const W=4.8*Ls/1000,nP=Math.ceil(W/48),reels=Math.ceil(Ls/5000);
  // блоки питания — под той же балкой у входа, рядом с колодкой: плашмя, по 2 самореза в низ балки
  const db=okB.find(b=>b.door)||okB[0];let nt=0;
  for(let k=0;k<nP;k++){const u=db.A.hw+420+k*230,hb=underBeam(db,u);if(!hb)continue;
   put({name:'LED-подсветка (блок питания 12 В 60 Вт IP67)',role:'ledPsu',c:add(hb.p,[0,-16,0]),ax:db.t,ay:[0,1,0],w:170,h:30,t:44,mat:'plastic',grp:G,cat:'ledPsu',size:'170×44×30 мм, IP67',why:'питание ленты: нагрузка не больше 80% от 60 Вт'});
   for(const s2 of [-1,1])fast(hb.wood,add(hb.p,mul(db.t,s2*75)),[0,-1,0]);}
  const ext=nP>1?'extCord2':'extCord';nt+=powerPost(db,G,ext,nP>1,'вилки блоков питания — под крышей');
  const pcs=[];for(const sg of segs){let r=sg.len,k=0;while(r>2000.5){pcs.push({len:2000,name:sg.name+', целый '+(++k)});r-=2000;}pcs.push({len:r,name:sg.name+(k?', добор':'')});}   // длиннее профиля — стык встык на балке
  const pl=cut1D(pcs,[{L:2000,pr:CAT.ledProf.pr,key:'ledProf'}],2);
  D.light={type:'led',len:Ls,watts:W,psu:nP,reels,profiles:pl.n,ties:nt};
  D.bom.push({key:'ledTape',qty:reels,note:`${(Ls/1000).toFixed(1).replace('.',',')} м по низу балок · ${Math.round(W)} Вт · каждая катушка 5 м — своим проводом от блока`});
  D.bom.push({key:'ledProf',qty:pl.n,note:`${pcs.length} ${pl_(pcs.length,'отрезок','отрезка','отрезков')} по ${segs.length} ${pl_(segs.length,'балке','балкам','балкам')}, в дело ${Math.round(pl.util*100)}%`});
  D.bom.push({key:'ledPsu',qty:nP,note:`${Math.round(W)} Вт из ${nP*60} — запас 20% на нагрев`});
  D.bom.push({key:'ledWire',qty:Math.ceil(reels*3+segs.length*0.5+2),note:'от блока к началу каждой катушки и перемычки у стоек'});
  D.bom.push({key:'ties',qty:1,note:`${nt} шт: шнур удлинителя по стойке`});
  D.bom.push({key:ext,qty:1,note:`${nP>1?'колодка на 2 розетки':'розетка шнура'} — на стойке у входа над блоками питания; шнур — к розетке с УЗО 30 мА`,warn:'Если у блока питания IP67 сетевые провода без вилки — подключить через уличную вилку IP44 или распаечную коробку IP65. Это делает электрик.'});}
 // саморезы скоб и профиля
 if(D.scr.dws)D.bom.push({key:'dwS',qty:Math.ceil(D.scr.dws*1.1/100),note:`${D.scr.dws} шт: ${[win&&'скобы',net&&'лента-липучка',lt==='led'&&'профиль'].filter(Boolean).join(', ')} к стальным стойкам и балкам`});
 if(D.scr.dww)D.bom.push({key:'dwW',qty:Math.ceil(D.scr.dww*1.1/200),note:`${D.scr.dww} шт: скобы${lt==='led'?' и профиль':''} к брусу`});
 if(D.scr.dwp)D.bom.push({key:'dwP',qty:Math.ceil(D.scr.dwp*1.1/100),note:`${D.scr.dwp} шт: лента-липучка к брусу и настилу, через 200 мм`});
 m.dress=D;D.lite=!!lite;if(lite)return;
 const i=m.steps.findIndex(s=>s.id==='finish');if(!m.steps.some(s=>s.id==='dress'))m.steps.splice(i<0?m.steps.length:i,0,{id:'dress',t:(win||net)&&lt!=='0'?'Окна и свет':win?'Мягкие окна':net?'Москитная сетка':'Свет по контуру'});
}
// оси для отрезка: локальная z — вдоль a→c
function frameOf(a,c){const z=norm(sub(c,a)),x=Math.abs(z[1])<0.9?norm(cross([0,1,0],z)):[1,0,0],y=cross(z,x);return{ax:x,ay:y,az:z};}
/* ---------------- надёжность: нагрузки — СП 20.13330.2016, сталь — СП 16.13330.2017 ----------------
   Схемы упрощённые, но с запасом: каждый элемент и узел — по своему худшему сочетанию. Итог по строке — коэффициент
   использования (до 100% — проходит). Если не проходит и есть понятное лечение (толще стенка, уширение столба, чаще
   поперечины) — модель пересобирается с усилением сама (см. build), а в отчёте видно, что и почему усилено. */
const WIND_={'1a':0.17,'1':0.23,'2':0.30,'3':0.38,'4':0.48,'5':0.60,'6':0.73,'7':0.85};
const KW=0.5*(1+1.22*0.85);        // местность B (дачный посёлок, деревья), высота до 5 м: k(z)·(1+ζ·ν)
const RY=235*0.95,EST=2.06e5;       // сталь С245/Ст3, γc = 0,95
function secOf(sec){
 if(sec[0]==='r'){const [Dd,t]=sec.slice(1).split('x').map(Number),d=Dd-2*t,A=Math.PI*(Dd*Dd-d*d)/4,I=Math.PI*(Dd**4-d**4)/64;return{A,Ix:I,Iy:I,Wx:I/(Dd/2),Wy:I/(Dd/2),ix:Math.sqrt(I/A),iy:Math.sqrt(I/A),h:Dd,b:Dd,t};}
 const [h,b,t]=sec.split('x').map(Number),A=2*t*(h+b-2*t),Ix=Ipr(b,h,t),Iy=Ipr(h,b,t);
 return{A,Ix,Iy,Wx:Ix/(h/2),Wy:Iy/(b/2),ix:Math.sqrt(Ix/A),iy:Math.sqrt(Iy/A),h,b,t};}
const chiC=lb=>{if(lb<=0.2)return 1;const F=0.5*(1+0.49*(lb-0.2)+lb*lb);return Math.min(1,1/(F+Math.sqrt(F*F-lb*lb)));}; // кривая «c»
const lbar=(L0,i)=>L0/i*Math.sqrt(RY/EST)/Math.PI;
// навесы без стен (EN 1991-1-4, табл. 7.6/7.7): [+cf, −cf при φ=0, −cf при φ=1], по уклону
const CFM=[[0,0.2,-0.5,-1.3],[5,0.4,-0.7,-1.4],[10,0.5,-0.9,-1.4],[15,0.7,-1.0,-1.4],[20,0.8,-1.1,-1.5],[25,1.0,-1.2,-1.6],[30,1.2,-1.3,-1.6],[45,1.4,-1.4,-1.7]];
const CFD=[[0,0.2,-0.5,-1.3],[5,0.3,-0.6,-1.3],[10,0.4,-0.6,-1.4],[15,0.4,-0.6,-1.4],[20,0.6,-0.6,-1.4],[25,0.7,-0.6,-1.4],[30,0.9,-0.6,-1.4],[45,1.1,-0.7,-1.5]];
const cfAt=(T,a)=>{let i=0;while(i<T.length-2&&a>T[i+1][0])i++;const A=T[i],B=T[i+1],k=Math.max(0,Math.min(1,(a-A[0])/(B[0]-A[0])));return A.map((v,j)=>v+(B[j]-v)*k);};
// сотовый поликарбонат 8 мм, ширина опирания ≤ 1050: шаг поперечин по таблицам производителей (нормативная нагрузка, кПа)
const pcStepMax=qn=>Math.round(790*Math.sqrt(1/Math.max(0.6,qn))/10)*10;
const pcmStepMax=qn=>Math.round(650*Math.sqrt(1/Math.max(0.6,qn))/10)*10;

function verify(m){
 const cfg=m.cfg,P=m.parts,rows=[],fixes={},N_=m.poly||0,ang=m.ang,ca=Math.cos(ang*RAD),sa=Math.sin(ang*RAD);
 const Sg=SNOW_[cfg.snow]||1.5,w0=WIND_[cfg.wind]||0.23,q=w0*KW,gR=GROOF[m.cov]||0.1;
 const mu=ang<=30?1:Math.max(0,(60-ang)/30),muL=(m.gable||N_)&&ang>=20&&ang<=30?1.25:1;   // muL — неравномерный снег (подветренный скат)
 const S=Sg*mu,Sd=1.4*S;
 // лестница усилений рамы — от дешёвого к дорогому; следующая ступень предлагается, пока проверка не пройдёт
 const maxNP=N_?0:Math.max(3,Math.floor((m.D-60)/650)+1);
 const ladder=()=>N_?(m.postSec==='r76x3'?{postR:'r76x4'}:null):m.spigotSec==='50x50x2'?{spigot:'50x50x3'}:m.postSec==='60x60x2'?{post:'60x60x3'}:!m.baseFixed?{base:'fixed'}:m.spigotSec!=='50x50x4'?{spigot:'50x50x4',post:'60x60x4'}:m.nP<maxNP?{nP:m.nP+1}:null;
 const morePortals=()=>N_||m.nP>=maxNP?null:{nP:m.nP+1};
 const steeper=()=>N_&&ang<40?{ang:Math.min(40,ang+3)}:null;
 const hipUp=()=>N_===6&&m.hip.sec!=='100x50x3'?{hip:'100x50x3'}:steeper();
 const row=(grp,name,util,val,note,fix)=>{rows.push({grp,name,util:Math.max(0,util),val:val||'',note:note||'',fix:fix||null});if(util>1&&fix)Object.assign(fixes,fix);};
 const kN=v=>Math.abs(v)<950?Math.round(v/10)*10+' Н':(v/1000).toFixed(1).replace('.',',')+' кН',kNm=v=>(v/1e6).toFixed(2).replace('.',',')+' кН·м',MPa=v=>Math.round(v)+' МПа',mm=v=>Math.round(v)+' мм',pct=v=>Math.round(v*100)+'%';
 const tubes=r=>P.filter(p=>p.kind==='tube'&&p.role===r),lo=p=>Math.min(p.o[1],p.o[1]+p.az[1]*p.L),hi=p=>Math.max(p.o[1],p.o[1]+p.az[1]*p.L);
 // ---------- общие величины ----------
 const G=P.reduce((s,p)=>s+(p.role==='pillar'||p.role==='sand'||p.layer==='decor'?0:massOf(p)),0)*9.81;    // вес над фундаментом, Н
 let plan;
 if(N_)plan=N_/2*(m.R+m.ovh)**2*Math.sin(2*Math.PI/N_)/1e6;
 else if(m.gable)plan=(m.W+2*m.ovh)*(m.D+2*m.ovhZ)/1e6;
 else if(m.slopeBack)plan=(m.W+300)*(m.D-60+2*m.pgOv)/1e6;
 else plan=(m.W+m.ovhL+m.ovhR)*(m.D+2*m.ovhZ)/1e6;
 const nPost=m.FW?P.filter(p=>p.role==='postW'&&!/входа/.test(p.name)).length:P.filter(p=>p.role==='post'||p.role==='postR').length;
 // загромождение под навесом φ: доля сплошных бортов по периметру и высоте
 const eaveH=m.F+m.H,per=N_?N_*m.side:2*(m.W+m.D),solid=cfg.fill==='prof'?1:cfg.fill==='euro'?0.72:0.76;
 const fillA=m.fillInfo.reduce((s,f)=>s+f.len*f.h,0)*solid;
 const WA=m.dress&&m.dress.wins.length?m.dress.winA:null;   // мягкие окна считаем закрытыми: под навесом всё загромождено, стены сплошные
 const NA=m.dress&&m.dress.nets.length&&!WA?m.dress.netA:null,NS=0.35;   // москитная сетка без окон: сплошность полотна ≈ 0,35 (оценка), по всей площади стен
 const phi=WA?1:Math.min(1,(fillA+(NA?NA.a*1e6*NS:0))/(per*eaveH));
 const cf=cfAt(m.gable||N_?CFD:CFM,ang),cfUp=cf[2]+(cf[3]-cf[2])*phi,cfDn=cf[1];
 const Wup=q*Math.abs(cfUp)*plan*1000,Wdn=q*cfDn*plan*1000;                 // Н, нормативные
 const env={Sg,S,w0,q,phi,cfUp,cfDn,plan,G,Wup,Wdn,mu,muL};
 // ---------- 1. кровельное покрытие ----------
 const step=m.rows&&m.rows.length>1?Math.max(...m.rows.slice(1).map((s,i)=>s-m.rows[i])):500;
 const qn=S*muL+gR,qd=(Sd*muL+1.1*gR)*ca;          // на покрытие: нормативная и расчётная (поперёк ската)
 const qloc=1.4*q*Math.abs(cfUp)*1.5;              // местный отсос у кромок, расчётный
 if(m.cov==='pc'){const b=m.pg?m.pg.step:step,bm=pcStepMax(qn);
  row('Кровля',`Сотовый поликарбонат 8 мм: шаг опор ${mm(b)} (допустимо ${mm(bm)} при ${qn.toFixed(2).replace('.',',')} кПа)`,b/bm,'',`по таблицам производителей, ширина опирания ≤ 1050 мм`,{pcStep:Math.floor(bm*0.95/10)*10});}
 else if(m.cov==='pcm'){const bm=pcmStepMax(qn);row('Кровля',`Монолитный профилированный поликарбонат: шаг обрешётки ${mm(step)} (допустимо ${mm(bm)})`,step/bm,'','',{purStep:Math.floor(bm*0.95/10)*10});}
 else if(m.cov==='ondulin'){const lim=ang<15?450:610;row('Кровля',`Ондулин: шаг обрешётки ${mm(step)} (по инструкции ≤ ${lim} мм при уклоне ${ang}°)`,step/lim,'',`снеговая ${qn.toFixed(2).replace('.',',')} кПа — в пределах допуска производителя`,{purStep:lim});}
 else if(m.cov==='shingle'){const s=step,M=qd*1e-3*s*s/10,W=12*12/6,f=(m.poly?0.7*8.2:0.7*16.4)/1.2;
  row('Кровля',`OSB-3 12 мм под гибкую черепицу: пролёт ${mm(s)}`,M/W/f,`σ ${(M/W).toFixed(1).replace('.',',')} из ${f.toFixed(1).replace('.',',')} МПа`,m.poly?'плиты рядами вдоль карниза — по слабой оси':'плиты вдоль ската — по сильной оси',{purStep:Math.floor(s*Math.sqrt(1/(M/W/f))/10)*10});}
 else{const Wsh={c20:2800,tile:2000,falc:1200,ondulin:0}[m.cov]||2000,s=m.cov==='tile'?350:step,M=Math.max(qd,qloc)*1e-3*1000*s*s/10;
  row('Кровля',`${COVERS[m.cov].s}: лист на обрешётке с шагом ${mm(s)}`,M/Wsh/220,MPa(M/Wsh),'лист 0,45–0,5 мм, неразрезной по опорам');}
 // крепёж кровли на отрыв: один саморез на ~0,14 м² (через волну на каждой обрешётке)
 {const a=Math.min(step,600)*275/1e6,T=(qloc-0.9*gR)*a*1000;row('Кровля','Саморез кровли на отрыв ветром (у кромки)',T/1200,kN(T)+' на саморез','вырыв самореза 4,8 мм из стенки 2 мм ≈ 1,2 кН');}
 // ---------- 2. обрешётка / щиты / рёбра ----------
 const WDm=m.mat&&m.mat!=='steel';
 if(WDm){}
 else if(N_){const pu=m.purlin,sp=secOf(pu.sec),Lp=2*(m.R+m.ovh)*Math.sin(Math.PI/N_),st=m.rows[1]-m.rows[0],qq=(Sd*muL+1.1*gR)*ca*st/1000,qqn=(S*muL+gR)*ca*st/1000,M=qq*Lp*Lp/8,f=5*qqn*Lp**4/(384*EST*sp.Ix);
  row('Обрешётка и фермы',`Обрешётка шатра ${pu.sec.replace(/x/g,'×')}: пролёт у карниза ${mm(Lp)}, шаг ${mm(st)}`,Math.max(M/sp.Wx/RY,f/(Lp/150)),`σ ${MPa(M/sp.Wx)}, прогиб ${mm(f)} (≤ L/150)`,'',m.cov==='tile'?steeper():{purStep:Math.max(250,Math.floor(st/Math.max(1.01,Math.sqrt(M/sp.Wx/RY))/10)*10)});
  // торец обрешётки — ушко 20×10 на ребре + 2 самореза 5,5×32: ушко гнётся из плоскости (упор обрешётки вдоль ската), саморезы — на срез
  {const sa_=Math.sin(ang*RAD),V=(Sd*muL+1.1*gR)*st/1000*sa_*Lp/2,T=Math.max(0,(qloc-0.9*gR)*st*Lp/2/1e3),ph=secOf(pu.sec).h||40,Mt=V*(ph/2+3),Wt=20*10*10/6,
    u=Math.max(Mt/Wt/RY,V/4200,T/4200);
   row('Обрешётка и фермы',`Ушко обрешётки 20×10 на ребре: упор вдоль ската ${kN(V)}, отрыв ${kN(T)}`,u,`σ ${MPa(Mt/Wt)}`,'пластина 10 мм вварена в ребро с двух сторон; 2 самореза 5,5 в стенку 2 мм ≈ 2×2,1 кН',{purStep:Math.max(250,Math.floor(st/Math.max(1.01,u)/10)*10)});}
  const hp=m.hip,hs=secOf(hp.sec),R=m.R,Lh=(R+m.ovh)/ca,trib=m.side/2/1000,qh=(Sd*muL+1.1*gR)*trib,qhn=(S*muL+gR)*trib,Mh=qh*(R+m.ovh)**2/8*0.66;
  const Wt=(Sd+1.1*gR)*plan*1000,Hr=Wt/N_/2/Math.tan(ang*RAD),Nh=Hr/ca,fh=5*qhn*ca*Lh**4/(384*EST*hs.Ix)*0.66;
  row('Обрешётка и фермы',`Ребро шатра ${hp.sec.replace(/x/g,'×')}: изгиб + сжатие (распор ${kN(Hr)})`,Mh/hs.Wx/RY+Nh/(chiC(lbar(Lh,hs.iy))*hs.A*RY),`прогиб ${mm(fh)} (≤ L/200 = ${mm(Lh/200)})`,'треугольная грузовая площадь',hipUp());
  const T=Hr/(2*Math.sin(Math.PI/N_)),rs=secOf('60x40x2');
  row('Обрешётка и фермы','Ригель обвязки 60×40 — растяжение от распора шатра',T/rs.A/RY,kN(T),'кольцо обвязки держит рёбра от разъезда');
  row('Узлы','Болт M10 ригеля обвязки — срез и смятие стенки 2 мм',T/16000,kN(T),'язык 6 мм в пропиле, болт работает на 2 среза; смятие стенок 2×2 мм ≈ 16 кН',steeper());}
 else if(m.pg){const wp=m.pg.wp,st=m.pg.step,s20=secOf('40x20x2'),s40=secOf('40x40x2'),Lc=wp-80,qc=(Sd+1.1*gR)*ca*st/1000,qcn=(S+gR)*ca*st/1000,M=qc*Lc*Lc/8,f=5*qcn*Lc**4/(384*EST*s20.Ix);
  row('Обрешётка и фермы',`Поперечина щита 40×20: пролёт ${mm(Lc)}, шаг ${mm(st)}`,Math.max(M/s20.Wx/RY,f/(Lc/150)),`σ ${MPa(M/s20.Wx)}, прогиб ${mm(f)}`,'');
  const L=m.sP,qr=(Sd+1.1*gR)*wp/2/1000,qrn=(S+gR)*wp/2/1000,Mr=qr*L*L/8,fr=5*qrn*L**4/(384*EST*s40.Ix);
  row('Обрешётка и фермы',`Стропило щита 40×40: пролёт ${mm(L)} между порталами`,Math.max(Mr/s40.Wx/RY,fr/(L/200)),`σ ${MPa(Mr/s40.Wx)}, прогиб ${mm(fr)}`,'',morePortals());}
 else{const L=m.sP,s=secOf('40x20x2'),qd2=(Sd*muL+1.1*gR)*ca*step/1000,qn2=(S*muL+gR)*ca*step/1000,qu=(1.4*q*Math.abs(cfUp)*1.2-0.9*gR*ca)*step/1000,M=Math.max(qd2,qu)*L*L/8,f=5*qn2*L**4/(384*EST*s.Ix);
  row('Обрешётка и фермы',`Обрешётка 40×20 на ребро: пролёт ${mm(L)}, шаг ${mm(step)}`,Math.max(M/s.Wx/RY,f/(L/150)),`σ ${MPa(M/s.Wx)}, прогиб ${mm(f)} (≤ ${mm(L/150)})`,'сечение и шаг подобраны под снеговой район',step>300&&m.cov!=='tile'?{purStep:Math.floor(step/Math.max(1.01,Math.sqrt(M/s.Wx/RY),f/(L/150))/10)*10}:morePortals());}
 // ---------- 3. ригель портала / ферма ----------
 if(!N_&&!WDm){const trib=m.sP,qb=((Sd*(m.gable?muL:1)+1.1*gR)*trib+1.05*0.05*trib)/1000,qbn=(S+gR)*trib/1000;
  if(m.gable){const t=Math.tan(ang*RAD),Lh=0.55*m.W/2,Ls=Lh/ca,s60=secOf('60x40x2'),s40=secOf('40x40x2'),Hh=qb*m.W*m.W/8/(m.W/2*t),Nr=Hh/ca;
   row('Обрешётка и фермы',`Стропило фермы 60×40: изгиб между узлами ${mm(Lh)} + сжатие ${kN(Nr)}`,qb*Lh*Lh/8/s60.Wx/RY+Nr/(chiC(lbar(Ls,s60.iy))*s60.A*RY),`прогиб ${mm(5*qbn*ca*Ls**4/(384*EST*s60.Ix))}`,'',morePortals());
   const bs=secOf(m.beam.sec);row('Обрешётка и фермы',`Ригель-затяжка ${m.beam.sec.replace(/x/g,'×')} — растяжение`,Hh/bs.A/RY,kN(Hh),'затяжка держит распор стропил',morePortals());
   const Ns=qb*m.W/4,Lst=Math.max(...tubes('strut').map(p=>p.cutLen),400);row('Обрешётка и фермы',`Раскос фермы 40×40: сжатие ${kN(Ns)}, длина ${mm(Lst)}`,Ns/(chiC(lbar(Lst,s40.ix))*s40.A*RY),'','',morePortals());}
  else{const bs=secOf(m.beam.sec),Lb=m.W-2*(m.L45+60),cL=m.ovh+60+m.L45,M=Math.max(qb*Lb*Lb/8,qb*cL*cL/2),f=5*qbn*Lb**4/(384*EST*bs.Ix);
   row('Обрешётка и фермы',`Ригель портала ${m.beam.sec.replace(/x/g,'×')}: пролёт ${mm(Lb)}, вылет ${mm(cL)}`,Math.max(M/bs.Wx/RY,f/(Lb/200)),`σ ${MPa(M/bs.Wx)}, прогиб ${mm(f)}`,'сечение подобрано по пролёту и снеговому району',morePortals());}}
 // ---------- 4. стойки, подкосы, стык на шипе — рамы против ветра ----------
 // вертикаль: снег + своя масса на самую нагруженную стойку
 const Gpost=G-(m.free?P.filter(p=>p.step==='ring').reduce((s,p)=>s+massOf(p),0)*9.81:0);   // рама основания ниже стоек и их не грузит
 const Ntot=(Sd+1.1*gR)*plan*1000+1.05*Gpost,Nmax=Ntot/nPost*(N_?1:1.3);
 // горизонталь: борта (наветренный + 0,5 подветренного), кровля, стойки
 const sideA=k=>m.fillInfo.filter(f=>k(f.run)).reduce((s,f)=>s+f.len*f.h,0)*solid/1e6;
 const Ax=Math.max(sideA(r=>/^(left|right)/.test(r)),WA?WA.x:0)+(NA?NA.x*NS:0),Az=Math.max(sideA(r=>/^(back|front)/.test(r)),WA?WA.z:0)+(NA?NA.z*NS:0);
 if(WA){const ws=m.dress.wins,A=ws.reduce((s,w)=>s+w.w*w.h/1e6,0),nb=ws.reduce((s,w)=>s+w.brackets,0),Fb=1.4*q*1.3*A*1000/Math.max(1,nb)*2;
  const wd=m.dress.scr.dww>0,cap=wd?660:3140;   // брус: 2 × 1 МПа·π·4,2·25 (СП 64); сталь 2 мм: 2 × 0,65·d·t·fu/1,25 (EN 1993-1-3)
  row('Оформление',`Мягкие окна закрыты: ${A.toFixed(1).replace('.',',')} м² стен, ветер на скобу ${kN(Fb)} (×2 у середины кромки)`,Fb/cap,'',`скоба на 2 саморезах держит на вырыв ≈ ${kN(cap)} (${wd?'брус, СП 64: 1 МПа × πdl':'стенка 2 мм: 0,65·d·t·fu'}); стены сплошные — ветер на каркас и фундамент ниже посчитан с ними`);}
 const roofH=dir=>{if(N_)return q*Math.max(cfDn,Math.abs(cfUp))*plan*sa*0.5*1000;
  if(m.gable)return dir==='x'?q*0.6*plan*sa*1000:q*0.04*plan*1000;
  if(m.slopeBack)return dir==='z'?q*Math.max(cfDn,Math.abs(cfUp))*plan*sa*1000:q*0.04*plan*1000;
  return dir==='x'?q*Math.max(cfDn,Math.abs(cfUp))*plan*sa*1000:q*0.04*plan*1000;};
 const postsA=nPost*0.06*eaveH/1e6*2.0;
 // стены: открытые борта — как заборы (наветренный 1,3 + затенённый подветренный 0,6); закрытые окнами — замкнутый объём,
 // СП 20.13330, прил. В.1.2: +0,8 на наветренную стену и −0,5 на подветренную, т. е. 1,3 на площадь одной стены; стойки тогда внутри
 const wallH=(A,Aw)=>Aw!=null?q*1.3*(Aw/2)*1000:q*(1.3*A*0.5+0.6*A*0.5)*1000,pA=WA?0:q*postsA*1000*0.5;
 const Hx=1.4*(wallH(Ax,WA?WA.x:null)+roofH('x')+pA),Hz=1.4*(wallH(Az,WA?WA.z:null)+roofH('z')+pA);
 let Mbs=0,MbW=0;
 if(WDm)verifyWood({m,row,kN,kNm,MPa,mm,Sd,S,muL,gR,ca,step,q,cfUp,Wup,G,Hx,Hz,Nmax,nPost,morePortals,ladder,plan,steeper,setMb:v=>{MbW=v;}});
 else{
 const beta=m.baseFixed?1:0.5;                     // пластина 6 мм на 4 шпильках — полужёсткое защемление; 10 мм — жёсткое. На раме то же: стык поперечины держит момент
 const frame=(H,nFr,brace,lbl)=>{if(!brace)return null;
  const V=H/nFr/2,yb=lo(brace)-68,yTop=hi(brace)-68,a=Math.max(150,yTop-yb),Mn=V*yb*(1-beta/2),Mb=V*yb*beta/2,ang_=Math.atan2(Math.abs(brace.az[1]),Math.hypot(brace.az[0],brace.az[2])),Nb=Mn/a/Math.cos(ang_);
  return{V,yb,a,Mn,Mb,Nb,ang:ang_,lbl};};
 const brP=tubes(N_?'ringBrace':'brace')[0],brS=tubes('sideBrace')[0];
 const nFx=N_?N_/2:Math.max(2,m.nP-1),nFz=N_?N_/2:2*(m.nP-1);
 const fx=frame(Hx,nFx,brP,N_?'по кругу':'поперёк (порталы)'),fz=N_?null:frame(Hz,nFz,brS,'вдоль (боковые рамы)');
 const psec=m.postSec||(N_?'r76x3':'60x60x2'),ps=secOf(psec),hPost=(N_?(hi(tubes('postR')[0])):m.F+m.H)-68;
 const Ncr=Math.PI**2*EST*ps.Ix/(2.0*(fx?fx.yb:hPost))**2,amp=1/Math.max(0.15,1-Nmax/Ncr);
 const chiP=chiC(lbar(2.0*(fx?fx.yb:hPost),ps.ix));
 for(const f of [fx,fz].filter(Boolean)){
  const uN=Nmax/(chiP*ps.A*RY),uM=f.Mn*amp/(ps.Wx*RY);
  row('Каркас',`Стойка ${psec.replace(/^r/,'Ø').replace(/x/g,'×')} у подкоса, ветер ${f.lbl}: N ${kN(Nmax)} + M ${kNm(f.Mn*amp)}`,uN+uM,`сжатие ${pct(uN)} + изгиб ${pct(uM)}`,`рама с подкосами, база ${m.baseFixed?'жёсткая (пластина 10 мм)':'полужёсткая'}; устойчивость — как у консоли (μ = 2)`,ladder());
  const bs=secOf('40x40x2'),Lb=(f===fz?brS:brP).cutLen;
  row('Каркас',`Подкос 40×40 (${f.lbl}): сжатие ${kN(f.Nb)}, длина ${mm(Lb)}`,f.Nb/(chiC(lbar(Lb,bs.ix))*bs.A*RY),'','');
  if(N_)row('Узлы',`Болт M10 подкоса на языке (${f.lbl}): ${kN(f.Nb)}`,f.Nb/16000,'смятие стенок 2×2 мм ≈ 16 кН, срез 2 плоскости ≈ 28 кН','язык 6 мм в пропиле подкоса');
  else if(f===fz)row('Узлы',`Торцевая пластина боковой рамы: 2 сквозных болта M10 (${f.lbl}): ${kN(f.Nb)}`,f.Nb/28000,'срез 2 болтов ≈ 28 кН; сжатие — пластиной в грань оголовка','пластина 6 мм приварена к ригелю и подкосу');}
 if(!N_&&fx){const sg=m.spigotSec||'50x50x2',ss=secOf(sg),yj=m.Yj-68,V=fx.V,Mj=Math.max(Math.abs(V*yj-fx.Mb),fz?Math.abs(fz.V*yj-fz.Mb):0)*amp;
  row('Узлы',`Стык «стойка — оголовок» на шипе ${sg.replace(/x/g,'×')}: M ${kNm(Mj)}`,Mj/(ss.Wx*RY),`предел ${kNm(ss.Wx*RY)}`,'шип входит в стойку на 150 мм, плотная посадка обязательна',ladder());
  const bp=Math.max(fx?fx.Mb:0,fz?fz.Mb:0)*amp;Mbs=fx?fx.Mb*amp:0;const Tst=bp/90/2+Math.max(0,1.4*Wup-0.9*(G+0))/nPost/4;
  const Rst=m.studs88?34000:13500;row(m.free?'Основание':'Фундамент',`Шпильки M12 опорной пластины: момент ${kNm(bp)} + отрыв`,Tst/Rst,kN(Tst)+' на шпильку',m.studs88?'класс 8.8 ≈ 34 кН':'класс 4.8, As = 84 мм² ≈ 13,5 кН',m.studs88?morePortals():{studs88:true});
  if(m.baseFixed){const t=m.baseT||10,Mpl=bp/180*15,Wpl=60*t*t/6;row(m.free?'Основание':'Фундамент',`Опорная пластина ${t} мм: изгиб у стенки стойки`,Mpl/Wpl/RY,MPa(Mpl/Wpl),'усилие в шпильке × вылет 15 мм, ширина ≈ 60 мм на шпильку',t<16?{base:'fixed16'}:morePortals());}}
 // голова на шипе — отрыв ветром на болт M10
 if(!N_){const Tb=Math.max(0,1.4*Wup*1.3-0.9*G)/nPost;row('Узлы','Болт M10 «оголовок — стойка»: отрыв ветром',Tb/28000,kN(Tb),'2 плоскости среза ≈ 28 кН');}
 }
 // ---------- 5. фундамент ----------
 if(m.free){const Fc=(A,d)=>({s:q*(1.3*A*0.5+0.6*A*0.5)*1000,r:roofH(d),p:q*postsA*1000*0.5}),fh=Math.max(0,...m.fillInfo.map(f=>f.h));
  verifyBase({m,row,kN,kNm,MPa,mm,pct,G,Wup,S,gR,plan,nPost,Hx,Hz,morePortals,Fx:Fc(Ax,'x'),Fz:Fc(Az,'z'),yFill:m.Bb+fh/2,yRoof:(m.F+m.H+m.dims.top)/2,yPost:(m.F+m.H)/2,Mbase:WDm?MbW:Mbs});}
 else{const pil=P.filter(p=>p.role==='pillar'),bell=P.some(p=>p.role==='bell'),wPil=Math.PI*0.1*0.1*1.245*24000,Abase=bell?Math.PI*0.2*0.2:Math.PI*0.15*0.15;
  const Nser=((S+gR)*plan*1000+G+(m.isFloor?(2.0*0.9+0.35)*footArea(cfg)*1000:0))/nPost*(N_?1.1:1.3)+wPil,p_=Nser/Abase/1000;
  row('Фундамент',`Давление на грунт под столбом${bell?' с уширением Ø400':' (подушка Ø300)'}`,p_/200,`${Math.round(p_)} кПа из 200`,'200 кПа — суглинок тугопластичный / песок средней крупности; на слабом грунте — уширение',bell?morePortals():{bell:true});
  const up=(1.4*Wup*1.3-0.9*G)/nPost,cone=bell?1.047*1.2*(0.2*0.2+0.2*0.52+0.52*0.52)*17000:0,res=0.9*(wPil+cone);
  row('Фундамент',`Отрыв столба ветром${bell?' (уширение держит конус грунта)':''}`,up>0?up/res:0,up>0?`${kN(up)} из ${kN(res)}`:'отрыва нет — вес беседки больше подъёмной силы','рубероид снимает силы пучения, поэтому держит только вес столба'+(bell?' и грунт над уширением':''),{bell:true});}
 // ---------- 6. пол и борта ----------
 if(m.isFloor){const s40=secOf('40x40x2'),s60=secOf('60x40x2'),qL=2.0*1.2+0.35*1.1;
  const js=m.joistStep||480,Lj=N_?2*m.apo/(m.R>1650?3:2):m.sP,qj=qL*js/1000,Mj=qj*Lj*Lj/8,fj=5*2.35*js/1000*Lj**4/(384*EST*s40.Ix);
  if(m.FW)verifyFloorW({m,row,kN,MPa,mm,Tu:Math.max(0,1.4*Wup*1.3-0.9*G)/nPost,Nmax,WS:WOODS[cfg.wood]});
  else row('Пол и борта',`Лага 40×40: пролёт ${mm(Lj)}, шаг ${mm(js)} (2 кПа)`,Math.max(Mj/s40.Wx/RY,fj/(Lj/250)),`σ ${MPa(Mj/s40.Wx)}, прогиб ${mm(fj)}`,'');
  const Lb=m.floorSpan||1300,trib=N_?Lj:m.sP,qb=qL*trib/1000,Mb=qb*Lb*Lb/8;
  if(!m.FW)row('Пол и борта',`Балка пола 60×40: пролёт ${mm(Lb)}`,Mb/s60.Wx/RY,MPa(Mb/s60.Wx),'');
  const wpc=cfg.deck==='wpc';
  if(wpc)row('Пол и борта',`Доска ДПК: пролёт ${mm(js)} (по испытаниям производителя ≤ 400 мм)`,js/400,'','пустотелую доску ДПК считают по допуску производителя, а не по сечению');
  else{const Pd=1.5e3*1.2,Md=Pd*js/4,Wd=140*28*28/6,fm=0.7*24/1.3;
   row('Пол и борта',`Доска настила 28×140: пролёт ${mm(js)}, сосредоточенная 1,5 кН`,Math.max(js/600,Md/Wd/fm),`σ ${MPa(Md/Wd)} из ${MPa(fm)}`,'хвоя/лиственница C24, улица, кратковременная нагрузка');}}
 const TMm=WDm,RWb=WOODS[cfg.wood].RA*WOODS[cfg.wood].kR*WMW*WMV;
 {const lr=Math.max(...m.fillInfo.map(f=>f.len),0);if(lr){const M=1.2*0.3*lr*lr/8;if(TMm){const Wr=50*100*100/6;row('Пол и борта',`Поручень 50×100: 0,3 кН/м поперёк, пролёт ${mm(lr)}`,M/Wr/RWb,MPa(M/Wr),'СП 20: перила частного дома');}else{const s=secOf('40x40x2');row('Пол и борта',`Поручень 40×40: 0,3 кН/м поперёк, пролёт ${mm(lr)}`,M/s.Wx/RY,MPa(M/s.Wx),'СП 20: перила частного дома');}}}
 // стойка входа — консоль от своей пластины 120×120×8 на 2 шпильках M12 (плечо 80 мм): половина нажима на переднюю секцию
 {const nw=m.parts.find(p=>p.role==='newel'),fr=m.fillInfo.filter(f=>/^front/.test(f.run));if(nw&&fr.length){const L=Math.max(...fr.map(f=>f.len)),P=1.2*0.3*L/2,h=(TMm?m.F+Math.max(...fr.map(f=>f.h))+60:nw.L)-20-68,M=P*h,s=secOf('40x40x2'),T=M/80,Mp=T*20,Wp=60*8*8/6,hS=TMm?m.yS-68:h,Ms=P*hS;
  if(TMm){const hW=h-(m.yS-60),Mw=P*hW,Wb=100*100*100/6;row('Пол и борта',`Стойка входа из бруса 100×100: нажим ${kN(P)}`,Mw/Wb/RWb,MPa(Mw/Wb),'консоль от стальной ножки');}
  row('Пол и борта',`${TMm?'Ножка стойки входа':'Стойка входа'} 40×40: нажим ${kN(P)} на высоте ${mm(h)}`,Math.max(Ms/s.Wx/RY,T/13500,Mp/Wp/RY),`σ ${MPa(Ms/s.Wx)}, шпилька ${kN(T)}, пластина ${MPa(Mp/Wp)}`,'пластина 120×120×8 на 2 шпильках M12 поперёк борта');}}
 const max=rows.reduce((a,r)=>Math.max(a,r.util),0);
 return{rows,fixes,max,ok:max<=1.0001,env};
}

const PLATE_ROLES=['basePlate','tongue','flange','newelPlate','support','endPlate','stopP','wHead','wKnife','nodePlate','jackPlate','jackFoot','lug','shoe'];
function sigOf(p){
 if(p.kind==='tube'){
  const L=p.cutLen,H=p.holes.map(h=>({s:h.s-p.zA0,f:h.face,o:h.off,d:h.d,sg:h.single?1:0}));
  let best=null;
  for(const [sd,xs,ys] of [[1,1,1],[1,-1,-1],[-1,-1,1],[-1,1,-1]]){
   const str=H.map(h=>{const s=sd>0?h.s:L-h.s,o=h.f==='X'?h.o*ys:h.f==='R'?0:h.o*xs;return`${h.f}${Math.round(s)}:${Math.round(o)}:${h.d}${h.sg?'s':''}`;}).sort().join('|');
   if(best===null||str<best)best=str;
  }
  return`${ROLE[p.role]?ROLE[p.role][0]:p.role}|${p.sec}|${p.sx}x${p.sy}|${Math.round(L)}|${[p.angA,p.angB].sort().join('/')}|${p.caps.filter(Boolean).length}|${best}`;
 }
 if(p.kind==='angle'&&!p.trim)return`${p.role}|${p.A}x${p.B}x${p.t}|${Math.round(p.L)}`;
 if(p.kind==='box'&&PLATE_ROLES.includes(p.role)){const hs=p.holes.map(h=>`${Math.round(Math.abs(h.x))}:${Math.round(Math.abs(h.y))}:${h.d}`).sort().join('|');return`${p.role}|${Math.round(p.w)}x${Math.round(p.h)}x${p.t}|${hs}`;}
 return null;
}
function assignMarks(m){
 const groups=new Map();
 for(const p of m.parts){const k=sigOf(p);if(!k)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
 const cnt={};m.marks=[];
 for(const [k,arr] of groups){const pre=(ROLE[arr[0].role]||['Д'])[0];cnt[pre]=(cnt[pre]||0)+1;const mark=pre+'-'+cnt[pre];arr.forEach(p=>{p.mark=mark;p.markQty=arr.length;});m.marks.push({mark,parts:arr,p:arr[0]});}
 const bg={};for(const p of m.parts)if(p.kind==='bolt'){const k=`M${p.d}×${p.L}`;(bg[k]=bg[k]||[]).push(p);}
 for(const k in bg)bg[k].forEach(p=>{p.mark=k;p.markQty=bg[k].length;});
}

/* ---------------- модули для перевозки ---------------- */
function corners8(p){
 const pts=[];
 if(p.kind==='tube'){for(const e of [0,1])for(const i of [-1,1])for(const j of [-1,1]){const x=i*p.sx/2,y=j*p.sy/2,z=cutZ(e?p.cutB:p.cutA,x,y,e?p.L:0);pts.push(add(p.o,add(add(mul(p.ax,x),mul(p.ay,y)),mul(p.az,z))));}}
 else if(p.kind==='angle'){for(const a of [0,p.A])for(const b of [0,p.B])for(const z of [0,p.L])pts.push(add(p.o,add(add(mul(p.ax,a),mul(p.ay,b)),mul(p.az,z))));}
 else if(p.kind==='box'){for(const i of [-1,1])for(const j of [-1,1])for(const k of [-1,1])pts.push(add(p.c,add(add(mul(p.ax,i*p.w/2),mul(p.ay,j*p.h/2)),mul(p.az,k*p.t/2))));}
 else if(p.kind==='weld')pts.push(p.a,p.b);
 return pts;
}
function massOf(p){
 if(p.kind==='tube')return p.wood?p.sx*p.sy*p.cutLen*p.rho*1e-9:SEC[p.sec].kgm*p.cutLen/1000;
 if(p.kind==='angle')return p.cat==='ang40'?2.42*p.L/1000:p.cat==='kus40'?0.05:0;
 if(p.kind==='box'&&(PLATE_ROLES.includes(p.role)||p.role==='capPlate'))return p.w*p.h*p.t*7.85e-6;
 return 0;
}
// габарит модуля в его собственных осях: перебираем оси труб модуля и мировые, берём самый компактный
function bboxOf(ps,TR){
 const pts=ps.flatMap(corners8),cand=[[[1,0,0],[0,1,0],[0,0,1]]];
 for(const p of ps)if(p.kind==='tube'&&!p.round)cand.push([p.ax,p.ay,p.az]);
 let best=null;
 for(const F of cand){const lo=[0,1,2].map(i=>Math.min(...pts.map(q=>dot(F[i],q)))),hi=[0,1,2].map(i=>Math.max(...pts.map(q=>dot(F[i],q)))),d=[0,1,2].map(i=>hi[i]-lo[i]),q=d.slice().sort((a,b)=>b-a),fit=TR?q[0]<=TR.L&&q[1]<=TR.W&&q[2]<=TR.H:true,v=(fit?0:1e12)+d[0]*d[1]*d[2]+1e-3*(d[0]+d[1]+d[2]);if(!best||v<best.v-1)best={F,lo,hi,v};}
 return best;
}
const mat3=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
function modules(m){
 const TR=m.truckSpec,g={};for(const p of m.parts){if(!m.MODS[p.module])continue;(g[p.module]=g[p.module]||[]).push(p);}
 const list=[];
 for(const k of Object.keys(m.MODS)){const ps=g[k];if(!ps)continue;
  const b=bboxOf(ps,TR),d=[0,1,2].map(i=>b.hi[i]-b.lo[i]).sort((a,b)=>b-a);
  const kg=ps.reduce((s,p)=>s+massOf(p),0),welds=ps.filter(p=>p.kind==='weld');
  list.push({k,name:m.MODS[k],dims:d,kg,parts:ps.filter(p=>p.kind!=='weld').length,welds:welds.length,weldLen:welds.reduce((s,p)=>s+p.len,0),fits:d[0]<=TR.L&&d[1]<=TR.W&&d[2]<=TR.H});}
 const loose=m.parts.filter(p=>!m.MODS[p.module]&&p.module!=='site'&&(p.kind==='tube'||p.kind==='sheet'||p.kind==='poly'));
 const longest=loose.reduce((a,p)=>{const L=p.kind==='tube'?p.cutLen:p.kind==='sheet'?(p.profile==='PC8'?0:Math.max(p.W,p.L)):p.L||0;return L>a.L?{L,p}:a;},{L:0,p:null});
 return{list,longest,looseKg:m.parts.filter(p=>!m.MODS[p.module]).reduce((s,p)=>s+massOf(p),0)};
}

/* ---------------- раскладка модулей: мастерская и кузов ---------------- */
function flatRot(d){
 const idx=[0,1,2].sort((a,b)=>d[b]-d[a]),[a,b,c]=idx,e=i=>[0,1,2].map(j=>j===i?1:0);
 let R=[e(a),e(c),e(b)];const det=R[0][0]*(R[1][1]*R[2][2]-R[1][2]*R[2][1])-R[0][1]*(R[1][0]*R[2][2]-R[1][2]*R[2][0])+R[0][2]*(R[1][0]*R[2][1]-R[1][1]*R[2][0]);
 if(det<0)R[2]=R[2].map(v=>-v);
 return{R,dims:[d[a],d[c],d[b]]};
}
function placeTf(box,R,target){
 const cf=[0,1,2].map(i=>(box.lo[i]+box.hi[i])/2),F=box.F||[[1,0,0],[0,1,0],[0,0,1]],c=[0,1,2].map(j=>F[0][j]*cf[0]+F[1][j]*cf[1]+F[2][j]*cf[2]),Rc=R.map(r=>r[0]*c[0]+r[1]*c[1]+r[2]*c[2]);
 return{R,t:[target[0]-Rc[0],target[1]-Rc[1],target[2]-Rc[2]]};
}
const MOD_ORDER=['head','hip','hub','ring','post','pstub','whead','side','panel','newel','rail','base','stair'];
function layoutModules(m){
 const TR=m.truckSpec,items=[];
 for(const k of Object.keys(m.MODS)){
  const ps=m.parts.filter(p=>p.module===k);if(!ps.length)continue;
  const box=bboxOf(ps,TR),d=[0,1,2].map(i=>box.hi[i]-box.lo[i]),fr=flatRot(d);
  const grp=MOD_ORDER.findIndex(g=>k.startsWith(g));
  items.push({k,name:m.MODS[k],box,R:mat3(fr.R,box.F),dims:fr.dims,grp:grp<0?9:grp,kg:ps.reduce((s,p)=>s+massOf(p),0)});
 }
 // мастерская: ряды по типу модуля, раскладка по центру площадки
 const Wrow=Math.max(7600,...items.map(i=>i.dims[0]+400)),gap=320,pre=[];let x=0,z=0,rowD=0,lastG=null;
 items.slice().sort((a,b)=>a.grp-b.grp||b.dims[0]-a.dims[0]).forEach(it=>{
  if(x+it.dims[0]>Wrow||(lastG!==null&&it.grp!==lastG&&x>0)){x=0;z+=rowD+gap*1.6;rowD=0;}
  pre.push({it,tx:x+it.dims[0]/2,tz:z+it.dims[2]/2});x+=it.dims[0]+gap;rowD=Math.max(rowD,it.dims[2]);lastG=it.grp;
 });
 const zMax=z+rowD,xMax=Math.max(...pre.map(p=>p.tx+p.it.dims[0]/2));
 const shop=pre.map(({it,tx,tz})=>{const target=[tx-xMax/2,it.dims[1]/2+2,tz-zMax/2];return Object.assign({},placeTf(it.box,it.R,target),{k:it.k,name:it.name,label:[target[0],it.dims[1]+260,target[2]],dims:it.dims});});
 // кузов: слои, в слое — полки; деталь можно повернуть в плане на 90°, сначала ищем место в уже начатых слоях
 const bed={x0:-TR.L/2,z0:-TR.W/2,L:TR.L,W:TR.W,y:1050,H:TR.H,t:TR.t};
 const Ry=[[0,0,1],[0,1,0],[-1,0,0]],mm=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
 const packRun=order=>{const layers=[],placed=[];
  for(const it of order){
   const [L,T,D]=it.dims,opts=[[L,D,false],[D,L,true]].filter(([lx,dz])=>lx<=bed.L&&dz<=bed.W);
   let done=false;
   for(const ly of layers){for(const [lx,dz,rot] of opts){
     for(const sh of ly.sh)if(sh.x+lx<=bed.L&&(dz<=sh.d||(sh===ly.sh[ly.sh.length-1]&&sh.z+dz<=bed.W))){placed.push({it,ly,x:sh.x,z:sh.z,lx,dz,rot});sh.x+=lx+20;sh.d=Math.max(sh.d,dz);ly.h=Math.max(ly.h,T);done=true;break;}
     if(!done){const last=ly.sh[ly.sh.length-1],z=last.z+last.d+20;if(z+dz<=bed.W){ly.sh.push({x:lx+20,z,d:dz});placed.push({it,ly,x:0,z,lx,dz,rot});ly.h=Math.max(ly.h,T);done=true;}}
     if(done)break;}if(done)break;}
   if(!done){const [lx,dz,rot]=opts[0]||[L,D,false],ly={h:T,sh:[{x:lx+20,z:0,d:dz}]};layers.push(ly);placed.push({it,ly,x:0,z:0,lx,dz,rot});}
  }
  let y=bed.y;for(const ly of layers){ly.y=y;y+=ly.h+15;}
  return{placed,stackH:layers.length?y-15-bed.y:0};};
 // несколько порядков укладки — берём самый низкий штабель
 const area=i=>i.dims[0]*i.dims[2];
 const runs=[(a,b)=>area(b)-area(a),(a,b)=>b.dims[1]-a.dims[1]||area(b)-area(a),(a,b)=>b.dims[0]-a.dims[0]||b.dims[1]-a.dims[1],(a,b)=>a.grp-b.grp||area(b)-area(a)].map(f=>packRun(items.slice().sort(f)));
 const best=runs.reduce((p,q)=>q.stackH<p.stackH?q:p);
 const truck=best.placed.map(({it,ly,x,z,lx,dz,rot})=>{const target=[bed.x0+x+lx/2,ly.y+it.dims[1]/2,bed.z0+z+dz/2];return Object.assign({},placeTf(it.box,rot?mm(Ry,it.R):it.R,target),{k:it.k,name:it.name});});
 const stackH=best.stackH;

 return{shop,truck,bed,stackH,fits:stackH<=bed.H,items};
}
/* ---------------- что делаем на каждом этапе ---------------- */
function stepInfo(m){
 const out={},WM=new Set(m.parts.filter(q=>q.kind==='weld').map(q=>q.module));   // модули, где есть сварка
 for(const s of m.steps){
  const ps=m.parts.filter(p=>p.step===s.id);
  const mods=[...new Set(ps.map(p=>p.module).filter(k=>m.MODS[k]))].map(k=>m.MODS[k]);
  const nWeld=new Set(ps.map(p=>p.module).filter(k=>m.MODS[k]&&WM.has(k))).size;
  const j={};for(const b of ps.filter(p=>p.kind==='bolt')){const key=b.joint;j[key]=j[key]||{n:0,sizes:{}};j[key].n++;const sz=`M${b.d}×${b.L}`;j[key].sizes[sz]=(j[key].sizes[sz]||0)+1;}
  const loose={},seen=new Set();for(const p of ps.filter(p=>!m.MODS[p.module]&&p.module!=='site'&&!['weld','bolt'].includes(p.kind)&&!['decor','capPlate'].includes(p.role))){if(p.grp){if(seen.has(p.grp))continue;seen.add(p.grp);}const n=p.grp||p.wood?p.name.replace(/\s*\(.*$/,''):(ROLE[p.role]||[null,p.name])[1]||p.name;loose[n]=(loose[n]||0)+1;}
  const welds=ps.filter(p=>p.kind==='weld').length;
  out[s.id]={mods,nWeld,joints:Object.entries(j).map(([k,v])=>({name:k,n:v.n,sizes:Object.entries(v.sizes).map(([z,c])=>`${z} × ${c}`).join(', ')})),loose:Object.entries(loose).map(([k,v])=>({name:k,n:v})),siteWelds:welds};
 }
 return out;
}

/* ---------------- раскрой ---------------- */
function pack(pieces,stock,kerf){
 const ps=pieces.slice().sort((a,b)=>b.len-a.len),bins=[];
 for(const p of ps){if(p.len>stock){bins.push({items:[p],used:p.len,over:true});continue;}
  let b=bins.find(b=>!b.over&&stock-b.used>=p.len+(b.items.length?kerf:0));
  if(!b){b={items:[],used:0};bins.push(b);}
  b.used+=(b.items.length?kerf:0)+p.len;b.items.push(p);}
 bins.forEach(b=>b.rest=stock-b.used);
 return bins;
}

/* ---------------- смета: всё, что режется, — по плану раскроя (сколько купить = сколько уйдёт в дело + честный отход) ---------------- */
const TRIM_STOCK={ridgeC20:[2000,100],trimC20:[2000,100],ridgeTile:[2000,100],trimTile:[2000,100],drip:[2000,50],wind:[2000,50],ridgeOnd:[1000,150],gutter:[3000,0]};
const dec1=v=>(Math.round(v*10)/10).toString().replace('.',',');
function bom(m){
 const lines=[],P=m.parts,cfg=m.cfg,cut={},base=cfg.metal==='base',rq=m.roofQty,cuts=[];
 const add_=(cat,key,qty,extra)=>{if(!(qty>0))return;const c=CAT[key];let pr=c.pr,src=c.src;if(base&&cat==='Металл'&&key!=='plate6'){pr=Math.round(pr*0.65);src='base';}lines.push(Object.assign({cat,key,name:c.n,qty,unit:c.u,price:pr,sum:qty*pr,url:c.url,src,sku:c.sku,lk:c.lk,city:c.city,warn:c.warn},extra||{}));};
 const plan=(key,title,pl,extra)=>{cuts.push(Object.assign({key,title,plan:pl,name:CAT[key]?CAT[key].n:title},extra||{}));return pl;};
 const pct=pl=>Math.round(pl.util*100)+'%',m1=v=>(v/1000).toFixed(2).replace('.',',');
 const rest1=pl=>pl.remnants&&pl.remnants.length?` · годные остатки ${pl.remnants.slice(0,5).map(m1).join(', ')} м`:'';
 // металл: хлысты по 3 м, пропил 3 мм; длиннее хлыста — две части со стыком на сварке
 for(const p of P.filter(p=>p.kind==='tube')){
  const L=Math.ceil(p.cutLen-0.5),arr=(cut[p.sec]=cut[p.sec]||[]),L0=SEC[p.sec].stockL||3000;
  if(L<=L0||p.wood)arr.push({len:L,mark:p.mark,name:p.name,id:p.id});   // брус не сращиваем: длиннее 3 м — из 6-метровой заготовки
  else{const s=p.splice?Math.round(p.splice-p.zA0):Math.round(L/2);arr.push({len:s,mark:p.mark,name:p.name+' — часть 1 (стык на сварке)',id:p.id});arr.push({len:L-s,mark:p.mark,name:p.name+' — часть 2',id:p.id});}
 }
 const plans={},secName=sec=>SEC[sec].round?'Труба Ø'+sec.slice(1).replace('x','×'):'Труба '+sec.replace(/x/g,'×');
 for(const sec of Object.keys(SEC)){if(!cut[sec])continue;
  if(SEC[sec].wood){const Sc=SEC[sec],k=woodCat(Sc.b,Sc.h,cfg.wood),pr=CAT[k].pr,pl=plan(k,`Брус ${Sc.b}×${Sc.h} — заготовки 3 и 6 м`,cut1D(cut[sec],[{L:3000,pr,key:k},{L:6000,pr:Math.round(pr*2.1),key:k}],4),{unit:'шт',kerf:4});
   plans[sec]=pl.bins.map(b=>({items:b.items,used:b.used,rest:b.rest}));
   const n6=pl.bins.filter(b=>b.stock.L>3000).length;lines.push({cat:'Брус',key:k,name:CAT[k].n,qty:pl.n,unit:'шт',price:pr,sum:Math.round(pl.cost),url:CAT[k].url,src:CAT[k].src,lk:CAT[k].lk,sku:CAT[k].sku,city:CAT[k].city,warn:CAT[k].warn,note:`${cut[sec].length} заготовок · в дело ${pct(pl)}${n6?` · ${n6} шт — 6 м (привоз отдельно)`:''}${rest1(pl)}`});continue;}
  const k=SEC[sec].stock,L0=SEC[sec].stockL||3000;
  const pl=plan(k,`${secName(sec)} — хлысты ${String(L0/1000).replace('.',',')} м`,cut1D(cut[sec],[{L:L0,pr:CAT[k].pr,key:k}],3),{unit:'хлыст',kerf:3});
  plans[sec]=pl.bins.map(b=>({items:b.items,used:b.used,rest:b.rest})).concat(pl.over.map(p=>({items:[p],used:p.len,rest:0,over:true})));
  add_('Металл',k,pl.n+pl.over.length,{note:`${cut[sec].length} заготовок · в дело ${pct(pl)}${rest1(pl)}`});}
 const angP=P.filter(p=>p.kind==='angle'&&p.cat==='ang40').map(p=>({len:Math.ceil(p.L),mark:p.mark,name:p.name,id:p.id}));
 if(angP.length){const pl=plan('ang40','Уголок 40×40×4 — хлысты 3 м',cut1D(angP,[{L:3000,pr:CAT.ang40.pr,key:'ang40'}],3),{unit:'хлыст',kerf:3});
  plans.ang40=pl.bins.map(b=>({items:b.items,used:b.used,rest:b.rest}));add_('Металл','ang40',pl.n,{note:`${angP.length} упоров по 40 мм${rest1(pl)}`});}
 const plKg=P.filter(p=>p.kind==='box'&&PLATE_ROLES.includes(p.role)).reduce((s,p)=>s+massOf(p),0);
 add_('Металл','plate6',Math.ceil(plKg*1.15*10)/10,{note:'опорные пластины, языки, фланцы, ушки — по эскизам во вкладке «Сверловка»'});
 const capA=P.filter(p=>p.role==='capPlate').reduce((s,p)=>s+p.w*p.h,0);
 add_('Металл','plate',Math.ceil(capA/(200*100*0.7)),{note:`${P.filter(p=>p.role==='capPlate').length} заглушек нарезать из пластин`});
 add_('Крепёж','kus40',P.filter(p=>p.cat==='kus40').length);
 if(m.C.sc8)add_('Крепёж','structScrew',Math.ceil(m.C.sc8/50),{note:`${m.C.sc8} шт: подкосы, раскосы, секции бортов`});
 if(m.C.wood6)add_('Крепёж','woodScrew6',Math.ceil(m.C.wood6/100),{note:`${m.C.wood6} шт: обрешётка к балкам и стропилам`});
 const KG=550,gr=x=>Math.max(1,Math.round(x*KG/1000*2)/2);
 const bk={},nuts={},wash={};
 for(const b of P.filter(p=>p.kind==='bolt')){const k=`M${b.d}×${b.L}`;bk[k]=bk[k]||{d:b.d,L:b.L,q:0,joints:new Set()};bk[k].q++;bk[k].joints.add(b.joint);nuts[b.d]=(nuts[b.d]||0)+1;wash[b.d]=(wash[b.d]||0)+2;}
 const boltLines=[];
 Object.keys(bk).sort((a,b)=>bk[a].d-bk[b].d||bk[a].L-bk[b].L).forEach(k=>{const b=bk[k],B=BOLT[b.d],g=Math.PI*(b.d/2)**2*b.L*0.00785+B.head;
  const pr=b.d===8?(b.L<=80?22:b.L<=120?27:32):gr(g),isA=b.d===8&&b.L===120;
  const ln={cat:'Крепёж',key:'bolt'+k,name:`Болт DIN 933 ${k.replace('M','').replace('×','x')} мм оцинкованный`,qty:b.q,unit:'шт',price:pr,sum:b.q*pr,url:isA?S('89404123'):LP+'/catalogue/bolty/din-933/',sku:isA?'89404123':undefined,lk:isA?'sku':'catalog',src:b.d===8?'site':'calc',note:[...b.joints].join('; ')};lines.push(ln);boltLines.push(ln);});
 for(const d of Object.keys(nuts)){const B=BOLT[d];
  if(+d===8){const q=Math.ceil(nuts[d]/24);lines.push({cat:'Крепёж',key:'nut'+d,name:'Гайка самоконтрящаяся М8 DIN 985 оцинк., 24 шт.',qty:q,unit:'уп.',price:94,sum:q*94,url:LP+'/product/gayka-samokontryashchayasya-m8-din-985-stal-ocinkovannaya-24-sht-89397141/',sku:'89397141',lk:'product',src:'site',note:`${nuts[d]} шт`});}
  else lines.push({cat:'Крепёж',key:'nut'+d,name:`Гайка самоконтрящаяся DIN 985 M${d} оцинк. (на вес)`,qty:nuts[d],unit:'шт',price:gr(B.nut),sum:nuts[d]*gr(B.nut),url:LP+'/catalogue/gayki/',lk:'catalog',src:'calc'});
  if(+d===8){const q=Math.ceil(wash[d]/24);lines.push({cat:'Крепёж',key:'wash'+d,name:'Шайба кузовная (увеличенная) DIN 9021 М8, 24 шт.',qty:q,unit:'уп.',price:80,sum:q*80,url:LP+'/product/shayba-kuzovnaya-din-9021-m8-24-sht-89397085/',sku:'89397085',lk:'product',src:'site',note:`${wash[d]} шт`});}
  else lines.push({cat:'Крепёж',key:'wash'+d,name:`Шайба увеличенная DIN 9021 M${d} (на вес)`,qty:wash[d],unit:'шт',price:gr(B.wash),sum:wash[d]*gr(B.wash),url:LP+'/catalogue/shayby/',lk:'catalog',src:'calc'});}
 // коннекторы бруса: всё покупное, считается штуками
 {const nC=c=>P.filter(p=>p.cat===c).length,kS=(m.bP||0)>=150?1.9:1;
  for(const [c,note] of [['connBase','под стойки'],['conn3','углы каркаса'],['conn4','средние стойки'],['connT','стойка и балка над ней'],['connE','балки вдоль в стойки'],['connS','стыки над опорами'],['connP','углы, угол не 90°'],['connJ','лаги в балки']]){const q=nC(c);if(q){const pr=Math.round(CAT[c].pr*(c==='connJ'?1:kS)/10)*10;add_('Крепёж',c,q,Object.assign({price:pr,sum:q*pr,note},kS>1&&c!=='connJ'?{name:CAT[c].n.replace(/100×100( LUVON)?(, сталь 2 мм)?/,'150×150'),src:'est',city:'',note:`${note}; под заказ: LUVON делает только 100×100, цена — оценка ×1,9`}:{}));}}
  if(m.C.conn6)add_('Крепёж','conn6',Math.ceil(m.C.conn6/100),{note:`${m.C.conn6} шт: в гнёзда коннекторов`});if(m.C.conn5)add_('Крепёж','conn5',Math.ceil(m.C.conn5/250),{note:`${m.C.conn5} шт: опоры бруса под лагами`});
  add_('Основание','shimSet',P.filter(p=>p.role==='shim').length,{note:'выставить уровень; после пучения — домкрат и подкладка'});if(P.some(p=>p.role==='dpc'))add_('Основание','rub',Math.ceil(P.filter(p=>p.role==='dpc').length*0.1*2/10),{note:'отсечка под обвязкой, 2 слоя'});}
 const studs=P.filter(p=>p.role==='stud'),nStud=studs.length,nN=studs.reduce((s,p)=>s+p.nuts.length,0),nW=studs.reduce((s,p)=>s+p.washers.length,0),FC=m.free?'Основание':'Фундамент';
 add_(FC,m.studs88?'stud12s':'stud12',m.free?Math.ceil(studs.reduce((s,p)=>s+p.b[1]-p.a[1],0)/950):Math.ceil(nStud/3),{note:m.free?`${nStud} коротких шпилек к столикам рамы`:`${nStud} шпилек по 300 мм (3 из прутка)${m.studs88?' — класс 8.8 под жёсткую базу':''}`});
 if(nN)lines.push({cat:FC,key:'nut12',name:'Гайка M12 DIN 934 оцинк.',qty:nN,unit:'шт',price:gr(17),sum:nN*gr(17),url:S('гайка М12'),src:'calc',note:'анкерная, регулировочная, верхняя'});
 if(nW)lines.push({cat:FC,key:'wash12',name:'Шайба увеличенная DIN 9021 M12',qty:nW,unit:'шт',price:gr(22),sum:nW*gr(22),url:S('шайба увеличенная М12'),src:'calc'});
 if(m.free){const Bs=m.base,cnt=r=>P.filter(p=>p.role===r).length,V3=rs=>P.filter(p=>rs.includes(p.role)).reduce((s,p)=>s+p.w*p.h*p.t*1e-9,0),A2=P.filter(p=>p.role==='cushion').reduce((s,p)=>s+p.w*p.h*1e-6,0),rods=P.filter(p=>p.role==='tieRod'),len=d=>rods.filter(p=>p.d===d).reduce((s,p)=>s+p.b[1]-p.a[1],0);
  add_(FC,'slab',cnt('pad'),{note:Bs.gas?'под ступени':Bs.n>1?`стопки по ${Bs.n} шт. на стойку, по центру отверстие Ø24`:'по 1 на опору'});
  if(cnt('gasBlock')){const nb=cnt('gasBlock'),ar=nb*2*(0.6*0.3+0.6*0.2+0.3*0.2);add_(FC,'gasblock',nb,{note:Bs.nB===2?'по 2 рядом на опору':'по 1 на опору'});if(Bs.nB===2)add_(FC,'gasGlue',1,{note:'шов между блоками'});add_(FC,'gasMastic',Math.ceil(ar*1.5*2/18),{note:`${ar.toFixed(1).replace('.',',')} м², все грани в 2 слоя`});add_(FC,'rub',1,{note:'отсечка под блоком: 2 слоя'});}
  add_(FC,'gravelBulk',Math.ceil(V3(['cushion','backfill'])*1.3*2)/2,{note:`подушка и засыпка ${V3(['cushion','backfill']).toFixed(2).replace('.',',')} м³ с трамбовкой`});add_(FC,'geotex',Math.ceil(A2/50));
  for(const d of [16,20])if(len(d)){add_(FC,'stud'+d,Math.ceil(len(d)/950),{note:'нагели и стяжки опор'});const nq=rods.filter(p=>p.d===d).reduce((s,p)=>s+p.nuts.length,0);lines.push({cat:FC,key:'nut'+d+'b',name:`Гайка M${d} DIN 934 оцинк.`,qty:nq,unit:'шт',price:gr(d===20?60:34),sum:nq*gr(d===20?60:34),url:S(`гайка М${d}`),src:'calc',note:'к нагелям и стяжкам'});}
  {add_(FC,'anchorH',cnt('anchor'),{note:'лопасть ниже 1,4 м; на каждую приварить крышку 80×80×8 и шпильку M20'});if(cnt('anchor')){add_(FC,'stud20',Math.ceil(cnt('anchor')*0.14),{note:`по 120 мм на сваю`});const nq=cnt('anchor');lines.push({cat:FC,key:'nut20b',name:'Гайка M20 DIN 934 оцинк.',qty:nq,unit:'шт',price:gr(60),sum:nq*gr(60),url:S('гайка М20'),src:'calc',lk:'search',note:'на шпильки свай'});}}}
 else{const pil=P.filter(p=>p.role==='pillar'),vol=P.filter(p=>p.role==='pillar'||p.role==='bell').reduce((s,p)=>s+Math.PI*(p.r/1000)**2*p.h/1000,0),bells=P.filter(p=>p.role==='bell').length;
 add_('Фундамент','concrete',Math.ceil(vol/0.021)+1,{note:`${pil.length} столбов${bells?`, ${bells} с уширением Ø400 (бур ТИСЭ)`:''}, ${vol.toFixed(2)} м³ + подливка`});
 add_('Фундамент','sand',Math.ceil(pil.length*0.0106/0.025)+1);add_('Фундамент','rub',Math.ceil(pil.length*1.35/10));add_('Фундамент','rebar',Math.ceil(pil.length*2/2),{note:`${pil.length*2} прутков по 1150 мм (2 из 3-метрового)`});add_('Фундамент','wire',1);}
 const cnt=(t,st)=>m.screws.filter(s=>s.type===t&&(!st||s.st===st)).length,trimScr=cnt('trim'),roofScr=cnt('roof')+trimScr,pcScr=cnt('pc'),osbScr=cnt('osb'),tekX=cnt('tek','roofEdge');
 const ridgeM=(rq.ridgeLen||0)+(rq.hipLen||0),shA=rq.sheetW&&rq.sheetW.length?rq.sheetW.reduce((s,w,i)=>s+w*rq.sheetLen[i],0)/1e6:rq.area;
 // кровельные листы: колонки снизу целыми листами, добор и срезы по рёбрам — из общих листов
 const SH=SHEET[m.cov];let roofPl=null;
 if(SH&&m.cov!=='falc'){let pcs=[];
  if(m.poly){const N=rq.colsN;rq.cols.forEach((c,ci)=>{let a=0,nf=0;while(c.long-a>SH.L+0.5){nf++;a+=SH.L-SH.lap;}
    for(let q=0;q<nf*N;q++)pcs.push({len:SH.L,name:`колонка ${ci+1}: целый лист`});
    const L1=c.long-a,L2=Math.max(0,c.short-a);
    if(m.cov==='tile')for(let f=0;f<N;f++)pcs.push({len:tileLen(L1),name:`колонка ${ci+1}: срез по ребру`});
    else if(c.side!=='C'&&L1+L2<=SH.L+0.5&&N%2===0)for(let f=0;f<N/2;f++)pcs.push({len:Math.ceil(L1+L2),name:`колонка ${ci+1}: 2 куска «валетом» (срез по ребру)`,n:2});
    else for(let f=0;f<N;f++)pcs.push({len:Math.ceil(L1),name:`колонка ${ci+1}: срез по ребру`});});}
  else pcs=rq.pieces.map(p=>({len:m.cov==='tile'?tileLen(p.len):Math.ceil(p.len),name:`колонка ${p.col+1}${p.row?`, ряд ${p.row+1} (добор)`:''}`}));
  roofPl=plan(m.cov,`${COVERS[m.cov].s} — листы ${SH.W}×${SH.L}`,cut1D(pcs,[{L:SH.L,pr:CAT[m.cov].pr,key:m.cov}],0),{unit:'лист'});}
 const rNote=pl=>`${pl.n} листов · в дело ${pct(pl)}${m.poly?' · срезы по рёбрам':''}`;
 // доборные планки, конёк, капельник, водосток: каждая полоса — целыми планками с нахлёстом, хвосты — из общих
 const trimRuns={};for(const p of P)if(p.trim&&p.kind==='angle'&&TRIM_STOCK[p.cat])(trimRuns[p.cat]=trimRuns[p.cat]||[]).push(p);
 const trimLine=(k,cat)=>{const runs=trimRuns[k];if(!runs)return;const [L,ov]=TRIM_STOCK[k],pcs=[];
  runs.forEach((p,ri)=>{let a=0;while(p.L-a>L+0.5){pcs.push({len:L,name:p.name+' — целая'});a+=L-ov;}pcs.push({len:Math.max(50,Math.ceil(p.L-a)),name:p.name+' — добор'});});
  const pl=plan(k,`${CAT[k].n.split(',')[0]} — ${L/1000} м`,cut1D(pcs,[{L,pr:CAT[k].pr,key:k}],ov?0:2),{unit:'шт'});
  add_(cat||'Кровля',k,pl.n,{note:`${runs.length} ${runs.length===1?'полоса':'полос'}, нахлёст ${ov} мм${rest1(pl)}`});};
 switch(m.cov){
  case'c20':add_('Кровля','c20',roofPl.n,{note:rNote(roofPl)});trimLine(m.poly?'ridgeC20':'ridgeC20');add_('Кровля','sealC20',Math.ceil(ridgeM*2+rq.eaveLen));trimLine('trimC20');add_('Кровля','roofScrew',Math.ceil((roofScr+40)/100),{note:`≈${roofScr+40} шт`});break;
  case'tile':add_('Кровля','tile',roofPl.n,{note:rNote(roofPl)+' · режем по линии ступени'});trimLine('ridgeTile');trimLine('trimTile');add_('Кровля','ridgeSeal',Math.ceil(ridgeM*2));add_('Кровля','roofScrew',Math.ceil((roofScr+50)/100),{note:`≈${roofScr+50} шт`});break;
  case'ondulin':add_('Кровля','ondulin',roofPl.n,{note:rNote(roofPl)+', нахлёст 1 волна и 170 мм'});trimLine('ridgeOnd');trimLine('wind');add_('Кровля','ondNail',Math.ceil(roofPl.n*20/100),{note:'20 на лист'});break;
  case'falc':add_('Кровля','falc',Math.ceil(shA*1.03),{note:`${shA.toFixed(1)} м² + 3% на подрезку: панели под заказ точно по длине ската, без поперечных стыков`});add_('Кровля','falcScrew',Math.max(1,Math.ceil((rq.hidden||rq.sheets*6)*2/250)),{note:'крепёж скрыт в замке'});trimLine('ridgeC20');trimLine('trimC20');break;
  case'pcm':add_('Кровля','pcm',roofPl.n,{note:rNote(roofPl)});trimLine('trimC20');add_('Кровля','roofScrew',Math.ceil((roofScr+pcScr+40)/100),{note:'с EPDM-шайбой, отверстия Ø+3 мм'});break;
  case'shingle':{let pl;
   if(m.poly){ // грань — треугольник: ряды по 1250 вдоль карниза, трапеции соседних граней «валетом» в одну ленту, лента режется на листы по 2500
    const N=rq.colsN,{b0,Hs}=rq.facet,pcs=[];
    for(let a=0,r=0;a<Hs-20;a+=1250,r++){const h=Math.min(1250,Hs-a),bb=b0*(1-a/Hs),bt=b0*Math.max(0,1-(a+h)/Hs),chain=N*(bb+bt)/2+(bb-bt)/2+N*6;
     let x=0;while(chain-x>2500.5){pcs.push({len:2500,name:`ряд ${r+1}: трапеции валетом`});x+=2500;}pcs.push({len:Math.ceil(chain-x),name:`ряд ${r+1}: хвост ленты`});}
    pl=plan('osb12','OSB-3 12 мм 1250×2500 — сплошной настил',cut1D(pcs,[{L:2500,pr:CAT.osb12.pr,key:'osb12'}],3),{unit:'лист'});}
   else{const rects=[];rq.osb.forEach((o,si)=>{const n=Math.ceil(o.span/1250-1e-6);for(let k=0;k<n;k++){const w=Math.min(1250,o.span-k*1250);sheetColumn(o.sL,{L:2500,lap:0}).forEach((l,r)=>rects.push({w:Math.round(w),h:Math.ceil(l),name:`скат ${si+1}, полоса ${k+1}${r?' (добор)':''}`}));}});
    pl=plan('osb12','OSB-3 12 мм 1250×2500 — сплошной настил',cut2D(rects,[{W:1250,H:2500,pr:CAT.osb12.pr,key:'osb12'}],{kerf:3}),{unit:'лист'});}
   add_('Кровля','osb12',pl.n,{note:`${m.poly?'рядами вдоль карниза, трапеции соседних граней валетом':'длинной стороной вдоль ската'}, стыки — на обрешётке · в дело ${pct(pl)}`});
   add_('Кровля','shingle',Math.ceil(rq.area*(m.poly?1.08:1.05)/3),{note:`${rq.area.toFixed(1)} м² + ${m.poly?8:5}% на подрезку${m.poly?' у рёбер':''}`});
   add_('Кровля','ridgeSh',Math.max(1,Math.ceil((ridgeM+rq.eaveLen)/12)));
   const ulA=P.filter(p=>p.role==='underlay').reduce((s,p)=>s+(p.kind==='tri'?polyArea(p.pts):p.w*p.h),0)/1e6;
   add_('Кровля','underlay',Math.max(1,Math.ceil(ulA*1.1/10)),{note:`${ulA.toFixed(1)} м² полосами по карнизам, ${m.poly?'рёбрам':'коньку и фронтонам'} + нахлёст 10%`});
   add_('Кровля','nails',2);add_('Кровля','mastic',1);trimLine('drip');trimLine('wind');break;}
  case'pc':{const rects=rq.pcStrips.map((w,i)=>({w:Math.round(w),h:Math.round(rq.pcLen),name:`полоса ${i+1} (${Math.round(w)} мм)`}));
   const pl=plan('pc8','Поликарбонат сотовый 8 мм — листы 2,1 м',cut2D(rects,PC_STOCK(),{kerf:2}),{unit:'лист'});
   for(const k of Object.keys(pl.by))add_('Кровля',k,pl.by[k],{note:`${rects.length} ${rects.length===1?'полоса':'полосы'} по ${Math.round(rq.pcLen)} мм, каналы вдоль ската · в дело ${pct(pl)}`});
   const nJ=Math.max(0,rects.length-1);
   if(nJ){const pj=plan('pcConn','Профиль соединительный — 6 м',cut1D([...Array(nJ)].map((_,i)=>({len:Math.ceil(rq.pcLen),name:`стык ${i+1}`})),[{L:6000,pr:CAT.pcConn.pr,key:'pcConn'}],2),{unit:'шт'});add_('Кровля','pcConn',pj.n,{note:`${nJ} ${nJ===1?'стык':'стыка'} над сдвоенными стропилами${rest1(pj)}`});}
   const ep=[];rects.forEach((r,i)=>ep.push({len:r.w,name:`полоса ${i+1}, низ`},{len:r.w,name:`полоса ${i+1}, верх`}));
   for(let sd=0;sd<2;sd++){let a=0;const Ls=Math.ceil(rq.pcLen);while(Ls-a>2100){ep.push({len:2100,name:'бок'});a+=2100;}ep.push({len:Ls-a,name:'бок'});}
   const pe=plan('pcEnd','Профиль торцевой — 2,1 м',cut1D(ep,[{L:2100,pr:CAT.pcEnd.pr,key:'pcEnd'}],2),{unit:'шт'});add_('Кровля','pcEnd',pe.n,{note:`торцы полос и боковые кромки${rest1(pe)}`});
   add_('Кровля','pcTape',1);add_('Кровля','pcScrew',Math.ceil((pcScr+10)/25),{note:`≈${pcScr+10} шт`});break;}
 }
 if(osbScr)add_('Кровля','osbScrew',Math.ceil(osbScr*1.1/100),{note:`${osbScr} шт по рядам обрешётки, шаг 300 мм`});
 if(trimScr&&['falc','ondulin'].includes(m.cov))add_('Кровля','roofScrew',Math.ceil((trimScr+20)/100),{note:`${trimScr} шт: конёк и торцевые планки`});
 if(trimRuns.gutter){trimLine('gutter');add_('Кровля','gutterSet',1);add_('Кровля','downpipe',1,{note:'с задней стороны, в сторону от дорожки'});}
 if(m.poly)add_('Кровля','hipCap',1,{note:'закрывает центральный узел и верх рёбер'});
 add_('Кровля','selfDrill',Math.ceil((m.C.selfDrill+tekX)/50),{note:`${m.C.selfDrill+tekX} шт: обрешётка${m.poly?' к рёбрам':' к упорам'}, столики${tekX?', основания профилей':''}`});
 if(m.C.clip)add_('Пол','clip',Math.ceil(m.C.clip/100),{note:`${m.C.clip} шт: уголки лаг`});
 const flA=m.poly?m.poly/2*m.R*m.R*Math.sin(2*Math.PI/m.poly)/1e6:m.W*m.D/1e6;
 if(m.isFloor){const dk=DECKS[cfg.deck],pcs=m.deck.pieces.map((len,i)=>({len,name:`доска ${i+1}`})),ns=m.screws.filter(s=>s.type==='deck').length;
  const pl=plan(dk.cat,`${dk.t}: доска настила — 3 м`,cut1D(pcs,[{L:3000,pr:CAT[dk.cat].pr,key:dk.cat}],4),{unit:'доска',kerf:4});
  add_('Пол',dk.cat,pl.n,{note:`${pcs.length} кусков${m.poly?', обрезка по граням':m.W>3000?', стыки вразбежку на лагах':', доски целиком'} · в дело ${pct(pl)}${rest1(pl)}`});
  if(cfg.deck==='wpc')add_('Пол','wpcClip',Math.ceil(flA),{note:'скрытый крепёж ДПК'});else{add_('Пол','deckScrew',Math.ceil(ns/100),{note:`${ns} шт`});add_('Пол','antisept',1);}}
 else{add_('Пол','geotex',Math.ceil(flA/50));add_('Пол','gravel',Math.ceil(flA*0.07*1.5/0.05*1.05),{note:`≈${(flA*0.07).toFixed(2)} м³; навалом с доставкой обычно дешевле`});}
 const fi=m.fillInfo;
 if(fi.length){
  if(cfg.fill==='prof'){const rects=[];
   fi.forEach(f=>{const n=Math.max(1,Math.ceil((f.len-50)/1150-1e-6));for(let k=0;k<n;k++){const w=k<n-1?1200:Math.round(f.len-(n-1)*1150);rects.push({w:Math.max(60,Math.min(1200,w)),h:Math.round(f.h),name:`борт ${f.n}, лист ${k+1}`});}});
   const pl=plan('c8','Профнастил С8 1200×2000 — борта',cut2D(rects,[{W:1200,H:2000,pr:CAT.c8.pr,key:'c8'}],{kerf:0}),{unit:'лист'});
   add_('Борта','c8',pl.n,{note:`${rects.length} кусков, волна вертикально, нахлёст 1 волна · в дело ${pct(pl)}`});
   add_('Борта','fillScrew',Math.ceil(m.screws.filter(s=>s.type==='fill').length/100));
  }else{const euro=cfg.fill==='euro',key=euro?'euro':'plank',L=euro?2000:3000,pcs=[];
   fi.forEach(f=>{for(let i=0;i<f.pieces;i++)pcs.push({len:Math.ceil(f.h),name:`борт ${f.n}`});});
   const pl=plan(key,euro?'Штакетник металлический — 2 м':'Доска строганая 20×95 — 3 м',cut1D(pcs,[{L,pr:CAT[key].pr,key}],euro?2:3),{unit:'шт',kerf:euro?2:3});
   add_('Борта',key,pl.n,{note:`${pcs.length} штакетин · в дело ${pct(pl)}${rest1(pl)}`});
   if(euro)add_('Борта','fillScrew',Math.ceil(m.screws.filter(s=>s.type==='fill').length/100));
   else{add_('Борта','woodScrew',Math.ceil(m.screws.filter(s=>s.type==='wood').length/100));add_('Борта','woodOil',1);}}
 }
 let area=0,aWood=0;for(const p of P){if(p.kind==='tube'&&p.wood)aWood+=2*(p.sx+p.sy)*p.cutLen;else if(p.kind==='tube')area+=2*(p.sx+p.sy)*p.cutLen;else if(p.kind==='angle'&&p.cat==='ang40')area+=2*(p.A+p.B)*p.L;else if(p.kind==='box'&&PLATE_ROLES.includes(p.role))area+=2*p.w*p.h;}
 area/=1e6;aWood/=1e6;const kg=area*2*0.11*1.15;
 if(aWood){{const k=CAT.antisept2.conc||1,L=aWood*0.35;add_('Покраска и защита','antisept2',Math.ceil(L/(5*k)),{note:`${aWood.toFixed(1)} м² бруса × 0,35 л/м² ≈ ${Math.ceil(L)} л раствора${k>1?`; канистра концентрата 1:${k-1} даёт ${5*k} л`:''} — до сборки, все грани и пропилы`});}add_('Покраска и защита','woodOilExt',Math.ceil(aWood*2*0.09/2.5),{note:'2 слоя после антисептика, обновлять раз в 3–4 года'});add_('Покраска и защита','endSeal',1,{note:'все торцы и пропилы'});}
 {// банки 2,7 кг почти вдвое дешевле за кило: берём их, а остаток — малой банкой, только если так дешевле
  const n27=Math.floor(kg/2.7),r=kg-n27*2.7,small=r>0.05?Math.ceil(r/0.9):0,big=small&&small*CAT.paint.pr>=CAT.paint27.pr?1:0,N27=n27+big,N9=big?0:small;
  add_('Покраска и защита','paint27',N27,{note:`${area.toFixed(1)} м² × 2 слоя ≈ ${kg.toFixed(1)} кг${N9?'':N27*2.7-kg>0.4?` · остаток ${dec1(N27*2.7-kg)} кг — на подкраску`:''}`});
  add_('Покраска и защита','paint',N9,{note:N27?'остаток до нужного веса':`${area.toFixed(1)} м² × 2 слоя ≈ ${kg.toFixed(1)} кг`});}
 add_('Покраска и защита','solvent',2);add_('Покраска и защита','zinc',2);add_('Покраска и защита','sealant',1,{note:'пропилы под языки, нахлёсты'});
 add_('Сварка (дома, в мастерской)','electrode',Math.max(1,Math.ceil(m.weldLen/1000*0.12)),{note:`швы ≈ ${(m.weldLen/1000).toFixed(1)} м, катет 3 мм, ток 70–90 А`});add_('Сварка (дома, в мастерской)','gdisc',3);
 add_('Расходники','discs',2);add_('Расходники','drill4',2);add_('Расходники','drill9',2);if(P.some(p=>p.kind==='bolt'&&p.d===10))add_('Расходники','drill11',2);add_('Расходники','stepDrill',1);
 if(m.dress)for(const it of m.dress.bom){const c=CAT[it.base||it.key],pr=it.price!=null?it.price:c.pr;
  lines.push({cat:'Оформление',key:it.key,name:it.name||c.n,qty:it.qty,unit:c.u,price:pr,sum:it.qty*pr,url:c.url,src:c.src,sku:c.sku,lk:c.lk,city:c.city,warn:it.warn||c.warn,note:it.note});}
 const total=lines.reduce((s,l)=>s+l.sum,0);
 const byCat={};lines.forEach(l=>byCat[l.cat]=(byCat[l.cat]||0)+l.sum);
 const steelKg=P.reduce((s,p)=>s+(p.wood?0:massOf(p)),0),woodKg=P.reduce((s,p)=>s+(p.wood?massOf(p):0),0);
 // сводка раскроя: сколько денег уходит в обрезки (по цене купленного)
 let wasteRub=0,cutRub=0;for(const c of cuts){const k=base&&/^p\d|^ang/.test(c.key)?0.65:1;cutRub+=c.plan.cost*k;wasteRub+=c.plan.cost*k*(1-c.plan.util);}
 return{lines,total,byCat,plans,boltLines,steelKg,woodKg,area,cuts,waste:{rub:Math.round(wasteRub),of:Math.round(cutRub),pct:cutRub?wasteRub/cutRub:0}};
}

/* ---------------- подсказки: соседние размеры и уклон, при которых материал ложится лучше ----------------
   Считаем полную смету для каждого варианта. Показываем только то, что честно выгодно: дешевле за квадратный метр
   (а не просто «меньше беседка — меньше денег») или заметно дешевле почти без потери площади. */
function footArea(c){const T=TYPES[c.type];if(T.poly){const R=c.W/2;return T.poly/2*R*R*Math.sin(2*Math.PI/T.poly)/1e6;}return c.W*c.D/1e6;}
function suggest(cfgIn,base0){
 const c0=sanitize(cfgIn),T=TYPES[c0.type],b0=base0||bom(build(c0)),A0=footArea(c0),r0=b0.total/A0,cand=[];
 for(const k of T.poly?['W']:['W','D']){const [lo,hi]=T.poly?LIM.P:LIM[k];for(const d of [-300,-200,-100,100,200,300]){const v=c0[k]+d;if(v>=lo&&v<=hi)cand.push({[k]:v});}}
 const amin=Math.max(T.angR[0],COVERS[c0.cover].min);for(const d of [-3,-2,-1,1,2,3]){const a=c0.ang+d;if(a>=amin&&a<=T.angR[1])cand.push({ang:a});}
 const lines0={};for(const l of b0.lines)lines0[l.key]=l;
 const out=[];
 for(const patch of cand){const c=sanitize(Object.assign({},c0,patch));if(JSON.stringify(c)===JSON.stringify(c0))continue;
  const b=bom(build(c)),A=footArea(c),d=b.total-b0.total,rpm=b.total/A;
  const good=(rpm<r0*0.985&&d<0&&A/A0>0.86)||(d<=-2500&&A/A0>=0.93)||(d<=-0.08*b0.total&&A/A0>=0.88&&rpm<r0)||(A>A0&&d<=300)||(patch.ang!=null&&d<=-800); // крупная экономия (целый лист, хлыст) при небольшой потере площади — тоже предлагаем
  if(!good)continue;
  const why=[];const l1={};for(const l of b.lines)l1[l.key]=l;
  for(const k of new Set([...Object.keys(lines0),...Object.keys(l1)])){const a=lines0[k],z=l1[k],ds=(z?z.sum:0)-(a?a.sum:0);if(Math.abs(ds)>=300)why.push({k,ds,q0:a?a.qty:0,q1:z?z.qty:0,u:(z||a).unit,n:CAT[k]?CAT[k].n.split(/[,(]/)[0]:(z||a).name});}
  why.sort((x,y)=>x.ds-y.ds);
  out.push({patch,cfg:c,total:b.total,d,area:A,dA:A-A0,rpm,why:why.slice(0,3),waste:b.waste});}
 out.sort((x,y)=>(x.rpm-y.rpm)||(x.d-y.d));
 const seen=new Set(),res=[];for(const s of out){const k=Object.keys(s.patch)[0];if(seen.has(k+(s.d<0?'-':'+')))continue;seen.add(k+(s.d<0?'-':'+'));res.push(s);if(res.length>=4)break;}
 return res;
}

/* ---------------- проверки: отверстия, торцы, пересечения тел ---------------- */
function checks(m){
 const res={bolt:[],edge:[],coll:[]};
 for(const p of m.parts.filter(p=>p.kind==='tube')){
  const H=p.holes;
  for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){
   const a=H[i],b=H[j];if(a.bolt&&a.bolt===b.bolt)continue;
   if(a.face==='R'||b.face==='R'){if(a.single||b.single)continue;if(Math.abs(a.s-b.s)<(a.d+b.d)/2+3)res.bolt.push({p,a,b,why:'болты пересекаются внутри круглой трубы'});continue;}
   if(a.face!==b.face){if(a.single||b.single)continue;if(Math.abs(a.s-b.s)<(a.d+b.d)/2+3)res.bolt.push({p,a,b,why:'встречаются перпендикулярные болты'});}
   else{const dd=Math.hypot(a.s-b.s,a.off-b.off);if(dd<(a.d+b.d)/2+1.2*Math.min(a.d,b.d))res.bolt.push({p,a,b,why:`мал шаг отверстий (${dd.toFixed(0)} мм)`});}
  }
  if(p.wood)for(const h of H){ // брус — СП 64, п. 8.20 (пакет тоньше 10d): от торца ≥ 6d, от кромки ≥ 2,5d
   if(h.single)continue;const d=h.d-1,half=h.face==='X'?p.sy/2:p.sx/2,pts=h.face==='X'?[[-p.sx/2,h.off],[p.sx/2,h.off]]:[[h.off,-p.sy/2],[h.off,p.sy/2]],zA=Math.max(...pts.map(([x,y])=>cutZ(p.cutA,x,y,0))),zB=Math.min(...pts.map(([x,y])=>cutZ(p.cutB,x,y,p.L))),de=Math.min(h.s-zA,zB-h.s);
   if(de<6*d-0.5)res.edge.push({p,h,why:`брус: до торца ${de.toFixed(0)} мм, нужно ≥ ${6*d}`});if(half-Math.abs(h.off)<2.5*d-0.5)res.edge.push({p,h,why:`брус: до кромки ${(half-Math.abs(h.off)).toFixed(0)} мм, нужно ≥ ${2.5*d}`});}
  for(const h of H){
   if(h.face==='R'){const zB=cutZ(p.cutB,0,0,p.L),zA=cutZ(p.cutA,0,0,0),de=Math.min(h.s-zA,zB-h.s)-p.sx/2*(p.cutB?Math.abs(Math.tan(Math.acos(Math.min(1,Math.abs(p.cutB.n[2])/len(p.cutB.n))))):0);if(de<1.2*h.d)res.edge.push({p,h,why:`близко к торцу (${de.toFixed(0)} мм)`});continue;}
   const half=h.face==='X'?p.sy/2:p.sx/2;
   if(half-Math.abs(h.off)-h.d/2<4)res.edge.push({p,h,why:`близко к ребру трубы (${(half-Math.abs(h.off)).toFixed(0)} мм)`});
   const pts=h.face==='X'?[[-p.sx/2,h.off],[p.sx/2,h.off]]:[[h.off,-p.sy/2],[h.off,p.sy/2]];
   const zA=Math.max(...pts.map(([x,y])=>cutZ(p.cutA,x,y,0))),zB=Math.min(...pts.map(([x,y])=>cutZ(p.cutB,x,y,p.L)));
   const de=Math.min(h.s-zA,zB-h.s);
   if(de<1.2*h.d)res.edge.push({p,h,why:`близко к торцу (${de.toFixed(0)} мм)`});
  }
 }
 const ob=[];
 for(const p of m.parts){
  if(p.kind==='tube'){if(p.role==='spigot'||p.round)continue;const z0=p.zA1,z1=p.zB0;if(z1-z0<2)continue;ob.push({p,c:add(p.o,mul(p.az,(z0+z1)/2)),A:[p.ax,p.ay,p.az],h:[p.sx/2,p.sy/2,(z1-z0)/2]});}
  else if(p.kind==='angle'&&!p.trim){ob.push({p,c:add(p.o,add(add(mul(p.ax,p.A/2),mul(p.ay,p.t/2)),mul(p.az,p.L/2))),A:[p.ax,p.ay,p.az],h:[p.A/2,p.t/2,p.L/2]});ob.push({p,c:add(p.o,add(add(mul(p.ax,p.t/2),mul(p.ay,p.B/2)),mul(p.az,p.L/2))),A:[p.ax,p.ay,p.az],h:[p.t/2,p.B/2,p.L/2]});}
  else if(p.kind==='box'&&['basePlate','flange','newelPlate','support'].includes(p.role))ob.push({p,c:p.c,A:[p.ax,p.ay,p.az],h:[p.w/2,p.h/2,p.t/2]});
 }
 const seen=new Set();
 for(let i=0;i<ob.length;i++)for(let j=i+1;j<ob.length;j++){
  const a=ob[i],b=ob[j];if(a.p===b.p)continue;
  if((a.p.notch&&a.p.notch.includes(b.p.id))||(b.p.notch&&b.p.notch.includes(a.p.id)))continue;   // врубка: брус заходит в брус на 12–30 мм
  const d=sub(b.c,a.c);if(len(d)>a.h[0]+a.h[1]+a.h[2]+b.h[0]+b.h[1]+b.h[2])continue;
  let minO=Infinity;const axes=[...a.A,...b.A];for(const u of a.A)for(const v of b.A){const c=cross(u,v);if(len(c)>1e-6)axes.push(norm(c));}
  for(const L of axes){const ra=a.h.reduce((s,h,k)=>s+h*Math.abs(dot(a.A[k],L)),0),rb=b.h.reduce((s,h,k)=>s+h*Math.abs(dot(b.A[k],L)),0);const o=ra+rb-Math.abs(dot(d,L));if(o<minO)minO=o;if(minO<1)break;}
  if(a.p.role==='wBrace'&&b.p.role==='wBrace'&&minO<6)continue;   // концы подкосов во врубках одной стойки — внутри бруса
  if(minO>=1){const k=Math.min(a.p.id,b.p.id)+'-'+Math.max(a.p.id,b.p.id);if(!seen.has(k)){seen.add(k);res.coll.push({a:a.p,b:b.p,o:minO});}}
 }
 // круглые трубы: углы соседних деталей не должны заходить внутрь (седловые резы — допустимы по замыслу)
 for(const rp of m.parts.filter(p=>p.kind==='tube'&&p.round)){
  const r2=(rp.sx/2-1.5)**2;
  for(const q of m.parts){
   if(q===rp||!['tube','box','angle'].includes(q.kind)||q.trim||(q.saddle&&q.saddle.includes(rp.id))||['tongue','capPlate','spigot','grout','decor','osb','shingle','gravel','pad','cushion','backfill','gasBlock'].includes(q.role)||q.kind==='box'&&!['basePlate','flange','newelPlate','support'].includes(q.role))continue;
   for(const c of corners8(q)){const d=sub(c,rp.o),z=dot(d,rp.az),x=dot(d,rp.ax),y=dot(d,rp.ay);
    if(x*x+y*y<r2&&z>cutZ(rp.cutA,x,y,0)+1&&z<cutZ(rp.cutB,x,y,rp.L)-1){const k=Math.min(rp.id,q.id)+'-'+Math.max(rp.id,q.id);if(!seen.has(k)){seen.add(k);res.coll.push({a:rp,b:q,o:Math.sqrt(r2)-Math.sqrt(x*x+y*y)});}break;}}
  }
 }
 return res;
}

/* ---------------- прочностной расчёт (упрощённо, по фактическим пролётам) ---------------- */
// расчёт — полная проверка надёжности (см. verify); оставлено имя calc для интерфейса
function calc(m){return m.verify||verify(m);}

return{build,bom,suggest,footArea,checks,calc,verify,cutZ,sanitize,FAST,CAT,PRICE_DATE,TYPES,COVERS,DECKS,TRUCKS,LIM,RAILS,STEPS,LAYERS,ROLE,SEC,BOLT,SNOW:SNOW_,WIND:WIND_,pack,cut1D,cut2D,durability,MATS,WOODS,SOILS,FNDS,HOLDS,MAX_SLABS,anchorRd};
})();
