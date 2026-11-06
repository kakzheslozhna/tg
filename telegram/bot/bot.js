// Бот «Беседка»: кнопка мини-приложения (полный 3D-конфигуратор), виджет в сообщении и ответы виджету — цена и состав по полной модели.
// Запуск: BOT_TOKEN=123:abc MINIAPP_URL=https://…/index.html node bot/bot.js   (Node 18+, без зависимостей, длинный опрос)
// Виджеты в сообщениях отправляются методом sendWidget из Bot API 10.4; пока он не открыт, бот присылает кнопку мини-приложения.
const fs = require('fs'), path = require('path'), { answer } = require('./answer');
const TOKEN = process.env.BOT_TOKEN, URL_APP = process.env.MINIAPP_URL;
if (!TOKEN || !URL_APP) { console.error('нужны BOT_TOKEN и MINIAPP_URL'); process.exit(1); }
const API = `${process.env.TG_API || 'https://api.telegram.org'}/bot${TOKEN}/`;   // TG_API — только для локальной проверки
const call = async (m, p) => { const r = await fetch(API + m, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p || {}) }); return r.json(); };
const widgetHtml = () => fs.readFileSync(path.join(__dirname, '..', 'widget.html'), 'utf8');
const appButton = { inline_keyboard: [[{ text: 'Открыть беседку в 3D', web_app: { url: URL_APP } }]] };

async function sendBesedka(chat_id) {
  const w = await call('sendWidget', { chat_id, html: widgetHtml(), allow_queries: true, caption: 'Беседка — поверните свайпом вбок, цена по кнопке «Посчитать»' });
  if (w.ok) return;
  console.log('sendWidget недоступен:', w.description || w.error_code, '— отправляю кнопку мини-приложения');
  await call('sendMessage', { chat_id, text: 'Конфигуратор беседки: 3D, расчёт по СП, смета со ссылками на Лемана ПРО.', reply_markup: appButton });
}

// ответ виджету: результат — не больше 1024 байт; имя поля в Bot API 10.4 пока не закреплено документацией, пробуем оба
async function answerWidget(q) {
  const result = answer(q.data);
  let r = await call('answerWidgetQuery', { widget_query_id: q.id, result });
  if (!r.ok) r = await call('answerWidgetQuery', { widget_query_id: q.id, data: result });
  if (!r.ok) console.log('answerWidgetQuery:', r.description);
}

(async () => {
  const me = await call('getMe');
  if (!me.ok) { console.error('токен не принят:', me.description); process.exit(1); }
  console.log(`бот @${me.result.username} запущен`);
  await call('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Беседка 3D', web_app: { url: URL_APP } } });
  await call('setMyCommands', { commands: [{ command: 'start', description: 'Беседка: виджет и 3D' }] });
  let offset = 0;
  for (;;) {
    let u;
    try { u = await call('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'widget_query'] }); }
    catch (e) { console.log('сеть:', e.message); await new Promise(r => setTimeout(r, 3000)); continue; }
    for (const x of u.result || []) {
      offset = x.update_id + 1;
      try {
        if (x.message && /^\/start|^\/widget/.test(x.message.text || '')) await sendBesedka(x.message.chat.id);
        else if (x.widget_query) await answerWidget(x.widget_query);
      } catch (e) { console.log('ошибка обработки:', e.message); }
    }
  }
})();
