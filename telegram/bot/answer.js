// Ответ бота на запрос виджета: код конфигурации → полная модель беседки → цена и короткий состав (до 1024 байт).
// Код: тип (g m p 6 8) + ширина в мм + материал (s сталь, h брус на стальном низе, t брус), например g3000s.
const fs = require('fs'), path = require('path');
let BM = null;
function model() {
  if (BM) return BM;
  const src = fs.readFileSync(process.env.BESEDKA_MODEL || path.join(__dirname, '..', '..', 'src', 'model.js'), 'utf8');
  const w = {}; new Function('window', src)(w); return (BM = w.BM);
}
const pl = (n, a, b, c) => { const k = n % 100, j = n % 10; return `${n} ${k > 10 && k < 20 ? c : j == 1 ? a : j > 1 && j < 5 ? b : c}`; };
const TYPE = { g: 'gable', m: 'mono', p: 'pergola', 6: 'hex', 8: 'oct' }, MAT = { s: 'steel', h: 'hybrid', t: 'timber' };
function parse(code) {
  const m = /^([gmp68])(\d{4})([sht])$/.exec(code || '');
  if (!m) return null;
  const W = Math.max(2400, Math.min(4600, +m[2]));
  return { type: TYPE[m[1]], W, D: W, mat: MAT[m[3]] };
}
function answer(data) {
  const cfg = parse(String(data).replace(/^q/, ''));
  if (!cfg) return JSON.stringify({ p: 0, t: 'неизвестная конфигурация' });
  const B = model(), m = B.build(B.sanitize(cfg)), b = B.bom(m), v = m.verify;
  const parts = [];
  if (cfg.mat === 'steel') parts.push(`сталь ${Math.round(b.steelKg)} кг`, pl(m.mods.list.length, 'сварной модуль', 'сварных модуля', 'сварных модулей'));
  else parts.push(`брус ${Math.round(b.woodKg)} кг`, cfg.mat === 'hybrid' ? `сталь ${Math.round(b.steelKg)} кг внизу` : 'коннекторы LUVON');
  parts.push(pl(m.parts.filter(p => p.kind === 'bolt').length, 'болт', 'болта', 'болтов'), v.ok ? 'расчёт проходит' : 'расчёт не проходит');
  return JSON.stringify({ p: b.total, t: parts.join(' · ') });
}
module.exports = { answer, parse };
if (require.main === module) console.log(answer(process.argv[2] || 'qg3000s'));
