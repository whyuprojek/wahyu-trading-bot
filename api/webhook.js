const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// 1. Inisialisasi Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Inisialisasi Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- LOGIKA BOT ---

bot.start((ctx) => {
  ctx.reply(`Halo ${ctx.from.first_name}! 👋\nBot Wahyu Projek aktif. Gunakan /set [harga] untuk alert XAUUSD.`);
});

bot.command('set', async (ctx) => {
  const price = parseFloat(ctx.message.text.split(' ')[1]);
  if (isNaN(price)) return ctx.reply('⚠️ Contoh: /set 2150');

  const { error } = await supabase.from('alerts').insert([{ 
    user_id: ctx.chat.id.toString(), 
    target_price: price,
    status: 'pending'
  }]);
  
  if (error) return ctx.reply('❌ Database Error. Cek Supabase!');
  ctx.reply(`✅ Alert dipasang di harga $${price}`);
});

bot.command('list', async (ctx) => {
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', ctx.chat.id.toString())
      .eq('status', 'pending');
  
    if (error) return ctx.reply('❌ Gagal ambil data.');
    if (!alerts || alerts.length === 0) return ctx.reply('📭 Alert kosong.');
  
    let pesan = '📋 Alert Aktif:\n';
    alerts.forEach((a) => pesan += `- $${a.target_price}\n`);
    ctx.reply(pesan);
});

// 3. Handler untuk Vercel (Wajib ada!)
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Bot Error');
    }
  } else {
    res.status(200).send('Bot is Running...');
  }
}