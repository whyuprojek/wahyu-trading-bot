const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome Wahyu! Gunakan /set [harga] untuk alert XAUUSD."));

bot.command('set', async (ctx) => {
  const price = parseFloat(ctx.message.text.split(' ')[1]);
  if (!price) return ctx.reply('Contoh: /set 2150');

  await supabase.from('alerts').insert([{ 
    user_id: ctx.chat.id.toString(), 
    target_price: price 
  }]);
  
  ctx.reply(`✅ Alert dipasang di harga $${price}`);
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot Running');
  }
}