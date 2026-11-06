// Виджет «Беседка» для сообщений Telegram (HTMLBubbles): своя 3D-проекция на canvas 2D, свайп вбок — поворот.
// Цену и состав считает бот нашей полной моделью (request → answerWidgetQuery), полный 3D — в мини-приложении.
// Лимиты песочницы: 32 КБ кода и 4 КБ после zlib, 300 мс CPU в секунду, 4000 команд canvas за задачу, без WebGL и сети.
const TW = window.TelegramWidget, BOT = '__BOT__', APP = '__APP__';
const T = [['g', 'Классика', 25], ['m', 'Модерн', 10], ['p', 'Пергола', 6], ['6', '6 граней', 30], ['8', '8 граней', 30]];
const SZ = [2.4, 3, 3.6, 4.2, 4.6], MT = [['s', 'Металл'], ['h', 'Брус+сталь'], ['t', 'Брус']];
let st = { t: 0, s: 1, m: 0 }, yaw = 0.6, vel = 0, raf = 0, G;
try { Object.assign(st, JSON.parse(localStorage.getItem('b'))); } catch (e) {}
const $ = id => document.getElementById(id), cv = $('c'), pr = $('p'), nf = $('n');
const code = () => T[st.t][0] + Math.round(SZ[st.s] * 1000) + MT[st.m][0];

// ---- геометрия, метры: y вверх, z — к входу ----
function build() {
  const [t, , ang] = T[st.t], W = SZ[st.s], F = .26, E = F + 2.2, o = .3, tg = Math.tan(ang * Math.PI / 180);
  const wood = st.m > 0, frame = wood ? [176, 124, 72] : [62, 66, 72], L = [], Fc = [], rl = F + .75;
  const ln = (a, b, w, c) => L.push([a, b, w, c || frame]);
  const face = (p, c) => { // нормаль для заливки: свет сверху-спереди-слева
    const u = p[1].map((v, i) => v - p[0][i]), v = p[2].map((x, i) => x - p[0][i]);
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], m = Math.hypot(...n) || 1;
    const k = .55 + .45 * Math.abs((n[0] * -.4 + n[1] * .8 + n[2] * .45) / m);
    Fc.push([p, `rgb(${c.map(x => x * k | 0)})`]);
  };
  const roof = t == 'p' ? [150, 190, 205] : [122, 62, 44];
  let posts = [], top = () => E;
  if (t == '6' || t == '8') { // многогранник: стойки по кругу, шатёр к вершине
    const N = +t, R = W / 2, A = R + o, ap = E + R * tg, P = (r, i, y) => [r * Math.sin(i * 2 * Math.PI / N + Math.PI / N), y, r * Math.cos(i * 2 * Math.PI / N + Math.PI / N)];
    for (let i = 0; i < N; i++) {
      posts.push(P(R, i, 0)); ln(P(R, i, E), P(R, i + 1, E), 4);
      if (i != N - 1) ln(P(R, i, rl), P(R, i + 1, rl), 2);
      face([P(A, i, E - o * tg), P(A, i + 1, E - o * tg), [0, ap, 0]], roof);
    }
    face([...Array(N)].map((_, i) => P(R + .05, i, F)), [196, 150, 98]);
  } else {
    const D = W, h = W / 2, n = W > 3.6 ? 4 : 3, zs = [...Array(n)].map((_, i) => -D / 2 + D * i / (n - 1));
    top = t == 'm' ? x => E + (x + h) * tg : t == 'p' ? (x, z) => E + (h - z) * tg : () => E;
    for (const z of zs) for (const x of [-h, h]) posts.push([x, 0, z]);
    face([[-h - .05, F, -h - .05], [h + .05, F, -h - .05], [h + .05, F, h + .05], [-h - .05, F, h + .05]], [196, 150, 98]);
    for (const x of [-h, h]) ln([x, top(x, -h), -h], [x, top(x, h), h], 4);       // балки вдоль
    for (const z of zs) ln([-h, top(-h, z), z], [h, top(h, z), z], 4);           // ригели порталов
    for (const x of [-h, h]) ln([x, rl, -h], [x, rl, h], 2);                     // борта
    ln([-h, rl, -h], [h, rl, -h], 2); ln([-h, rl, h], [-.45, rl, h], 2); ln([.45, rl, h], [h, rl, h], 2);
    const X = h + o, Z = h + o;
    if (t == 'g') {
      const r = E + h * tg;
      for (const s of [-1, 1]) face([[s * X, E - o * tg, -Z], [0, r, -Z], [0, r, Z], [s * X, E - o * tg, Z]], roof);
      for (const z of zs) { ln([-h, E, z], [0, r, z], 3); ln([0, r, z], [h, E, z], 3); ln([0, E, z], [0, r, z], 2); }
    } else face([[-X, top(-X, -Z), -Z], [X, top(X, -Z), -Z], [X, top(X, Z), Z], [-X, top(-X, Z), Z]], roof);
  }
  for (const p of posts) ln([p[0], .05, p[2]], [p[0], top(p[0], p[2]), p[2]], 5);
  G = { L, F: Fc, r: W * .9 + 1.6 };
  // вписать в кадр: габарит по 8 ракурсам, чтобы при повороте масштаб не «дышал»
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const V = [...L.flatMap(l => [l[0], l[1]]), ...Fc.flatMap(f => f[0])];
  for (let a = 0; a < 6.3; a += .785) for (const v of V) { const r = pj(v, a); x0 = Math.min(x0, r[0]); x1 = Math.max(x1, r[0]); y0 = Math.min(y0, r[1]); y1 = Math.max(y1, r[1]); }
  G.b = [x0, x1, y0, y1];
}
// перспектива без масштаба экрана: [x, y вниз, глубина]
function pj(p, a) { const ca = Math.cos(a), sa = Math.sin(a), x = p[0] * ca - p[2] * sa, z = p[0] * sa + p[2] * ca, y = p[1] - 1.3, z2 = y * .38 + z * .92 + G.r * 2, s = 1 / z2;
  return [x * s, -(y * .92 - z * .38) * s, z2]; }

// ---- рисование: перспектива, сортировка граней и линий по глубине ----
function draw() {
  const d = devicePixelRatio || 1, w = cv.clientWidth * d, h = 220 * d, c = cv.getContext('2d');
  if (cv.width != w) { cv.width = w; cv.height = h; }
  c.clearRect(0, 0, w, h);
  const [x0, x1, y0, y1] = G.b, K = Math.min(w * .92 / (x1 - x0), h * .9 / (y1 - y0)), dist = G.r * 2;
  const P = p => { const r = pj(p, yaw); return [w / 2 + (r[0] - (x0 + x1) / 2) * K, h / 2 + (r[1] - (y0 + y1) / 2) * K, r[2]]; };
  const it = [];
  for (const [p, col] of G.F) { const q = p.map(P); it.push([q.reduce((a, v) => a + v[2], 0) / q.length + .2, q, col]); }
  for (const [a, b, lw, col] of G.L) { const A = P(a), B = P(b); it.push([(A[2] + B[2]) / 2, [A, B], `rgb(${col})`, lw * d * K * .0009]); }
  it.sort((a, b) => b[0] - a[0]);
  c.lineCap = 'round';
  for (const [, q, col, lw] of it) {
    c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (const v of q) c.lineTo(v[0], v[1]);
    if (lw) { c.strokeStyle = col; c.lineWidth = lw; c.stroke(); } else { c.closePath(); c.fillStyle = col; c.fill(); }
  }
}
const loop = () => { raf = 0; if (Math.abs(vel) > .002) { yaw += vel; vel *= .92; raf = requestAnimationFrame(loop); } draw(); };

// ---- поворот свайпом вбок: вертикальный свайп Telegram оставляет чату ----
let drag = 0;
cv.onpointerdown = e => { drag = 1; vel = 0; cv.setPointerCapture(e.pointerId); };
cv.onpointermove = e => { if (!drag) return; vel = e.movementX * .012; yaw += vel; if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
cv.onpointerup = cv.onpointercancel = () => { drag = 0; if (!raf) raf = requestAnimationFrame(loop); };

// ---- кнопки, цена от бота, полный 3D ----
const row = (id, list, key) => { $(id).innerHTML = list.map((x, i) => `<button data-i=${i} class=${st[key] == i ? 'on' : ''}>${x}</button>`).join('');
  $(id).onclick = e => { const i = e.target.dataset.i; if (i == null) return; st[key] = +i; upd(1); }; };
function upd(ask) {
  try { localStorage.setItem('b', JSON.stringify(st)); } catch (e) {}
  row('t', T.map(x => x[1]), 't'); row('m', MT.map(x => x[1]), 'm');
  $('s').textContent = (SZ[st.s] + '').replace('.', ',') + ' × ' + (SZ[st.s] + '').replace('.', ',') + ' м';
  build(); draw();
  const k = code(), c = (() => { try { return JSON.parse(localStorage.getItem('c' + k)); } catch (e) {} })();
  if (c) return show(c);
  pr.textContent = ''; nf.textContent = TW ? 'цена — по кнопке «Посчитать»' : 'откройте в Telegram';
  if (ask && TW && TW.request) {
    pr.textContent = 'считаю…';
    TW.request('q' + k).then(r => { const v = JSON.parse(r.result); try { localStorage.setItem('c' + k, r.result); } catch (e) {} show(v); },
      e => { pr.textContent = '—'; nf.textContent = e.code == 'NOT_ALLOWED' ? 'откройте бота, чтобы считать' : e.code == 'RATE_LIMITED' ? 'не так часто' : 'бот не ответил'; });
  }
}
const show = v => { pr.textContent = '≈ ' + String(v.p).replace(/\B(?=(\d{3})+$)/g, ' ') + ' ₽'; nf.textContent = v.t; };   // разряды вручную: в QuickJS нет полного Intl
$('dn').onclick = () => { if (st.s > 0) { st.s--; upd(1); } };
$('up').onclick = () => { if (st.s < SZ.length - 1) { st.s++; upd(1); } };
$('q').onclick = () => upd(1);
$('o').onclick = () => { if (TW) TW.openTelegramLink(`https://t.me/${BOT}/${APP}?startapp=${code()}`); };
upd(0);
