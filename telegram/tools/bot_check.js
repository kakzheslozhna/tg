// Проверка бота на имитаторе Bot API: /start без sendWidget → кнопка мини-приложения; запрос виджета → цена от модели
const http = require('http'), { spawn } = require('child_process'), path = require('path');
const calls = []; let served = 0;
const srv = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => {
  const m = req.url.split('/').pop(), p = b ? JSON.parse(b) : {}; calls.push([m, p]);
  const ok = r => res.end(JSON.stringify({ ok: true, result: r }));
  if (m === 'getMe') return ok({ username: 'besedka_test_bot' });
  if (m === 'sendWidget') return res.end(JSON.stringify({ ok: false, error_code: 404, description: 'Not Found' }));
  if (m === 'getUpdates') { if (served++ === 0) return ok([{ update_id: 1, message: { chat: { id: 42 }, text: '/start' } }, { update_id: 2, widget_query: { id: 'w1', data: 'qg3000s' } }]); return setTimeout(() => ok([]), 300); }
  ok(true); }); }).listen(0, () => {
  const port = srv.address().port;
  const bot = spawn('node', [path.join(__dirname, '..', 'bot', 'bot.js')], { env: Object.assign({}, process.env, { BOT_TOKEN: '1:test', MINIAPP_URL: 'https://example.org/besedka/', TG_API: `http://127.0.0.1:${port}` }) });
  let log = ''; bot.stdout.on('data', d => log += d); bot.stderr.on('data', d => log += d);
  setTimeout(() => { bot.kill(); srv.close();
    const names = calls.map(c => c[0]), sm = calls.find(c => c[0] === 'sendMessage'), aw = calls.find(c => c[0] === 'answerWidgetQuery');
    console.log('вызовы:', [...new Set(names)].join(', '));
    console.log('кнопка мини-приложения:', sm ? JSON.stringify(sm[1].reply_markup) : 'нет');
    console.log('ответ виджету:', aw ? aw[1].result : 'нет');
    console.log('лог бота:', log.trim().replace(/\n/g, ' | '));
  }, 2500); });
