// Perintah /list untuk melihat alert yang aktif
bot.command('list', async (ctx) => {
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', ctx.chat.id.toString())
    .eq('status', 'pending');

  if (error) return ctx.reply('❌ Gagal mengambil data.');

  if (alerts.length === 0) {
    return ctx.reply('📭 Tidak ada alert aktif saat ini.');
  }

  let pesan = '📋 <b>Daftar Alert Aktif (XAUUSD):</b>\n\n';
  alerts.forEach((a, index) => {
    pesan += `${index + 1}. Harga: <b>$${a.target_price}</b>\n`;
  });

  ctx.reply(pesan, { parse_mode: 'HTML' });
});

// Perintah /clear untuk menghapus semua alert pending
bot.command('clear', async (ctx) => {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('user_id', ctx.chat.id.toString())
    .eq('status', 'pending');

  if (error) return ctx.reply('❌ Gagal menghapus alert.');
  ctx.reply('🗑️ Semua alert aktif berhasil dihapus!');
});