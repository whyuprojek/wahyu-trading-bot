import os
import requests
from tvDatafeed import TvDatafeed, Interval
from supabase import create_client

# Ambil Kunci Rahasia
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Koneksi ke Supabase & TradingView
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
tv = TvDatafeed()

def run():
    # 1. Ambil harga XAUUSD terbaru (OANDA)
    try:
        data = tv.get_hist(symbol='XAUUSD', exchange='OANDA', interval=Interval.in_1_minute, n_bars=1)
        curr_price = data['close'].iloc[-1]
        print(f"Harga XAUUSD saat ini: {curr_price}")
    except Exception as e:
        print(f"Gagal ambil harga TV: {e}")
        return

    # 2. Cek database alerts yang statusnya masih 'pending'
    alerts = supabase.table("alerts").select("*").eq("status", "pending").execute()

    for a in alerts.data:
        target = a['target_price']
        user_id = a['user_id'] # Kemarin mungkin ketulis chat_id, kita samakan di sini
        alert_id = a['id']     # Kemarin mungkin ketulis alert['id'], kita samakan

        # 3. Logika: Jika harga menyentuh/melewati target
        # Kita pakai toleransi 0.5 agar tidak terlewat
        if abs(curr_price - target) <= 0.5:
            # Fitur C: Link Chart Visual
            chart_url = "https://s3.tradingview.com/snapshots/o/OANDA:XAUUSD.png"
            
            caption = (f"🔔 <b>PRICE ALERT TERDETEKSI!</b>\n\n"
                       f"Target: <b>${target}</b>\n"
                       f"Running: ${curr_price}\n\n"
                       f"📈 <a href='https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD'>Buka Chart Full</a>")
            
            payload = {
                "chat_id": user_id,
                "photo": chart_url,
                "caption": caption,
                "parse_mode": "HTML"
            }
            
            # Kirim Notifikasi Gambar ke Telegram
            requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto", json=payload)
            
            # 4. Tandai sudah bunyi di database agar tidak spam
            supabase.table("alerts").update({"status": "triggered"}).eq("id", alert_id).execute()
            print(f"Alert terkirim ke {user_id} untuk harga {target}")

if __name__ == "__main__":
    run()