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

// --- FITUR A: CEK HARGA REALTIME ---
bot.command('price', async (ctx) => {
  try {
    const resp = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
    const goldPrice = parseFloat(resp.data.price).toFixed(2);
    ctx.reply(`💰 Harga XAUUSD (Spot): <b>$${goldPrice}</b>`, { parse_mode: 'HTML' });
  } catch (err) {
    ctx.reply('❌ Gagal mengambil harga market.');
  }
});

// --- FITUR B: HAPUS ALERT SPESIFIK ---
bot.command('delete', async (ctx) => {
  const price = parseFloat(ctx.message.text.split(' ')[1]);
  if (isNaN(price)) return ctx.reply('⚠️ Contoh: /delete 2150');

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('user_id', ctx.chat.id.toString())
    .eq('target_price', price)
    .eq('status', 'pending');

  if (error) return ctx.reply('❌ Gagal menghapus alert.');
  ctx.reply(`🗑️ Alert di harga $${price} telah dihapus.`);
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