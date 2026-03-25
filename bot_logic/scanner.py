import os
import requests
from tvDatafeed import TvDatafeed, Interval  # T-nya besar, D-nya besar
from supabase import create_client           # s-nya kecil

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BOT_TOKEN = os.getenv("BOT_TOKEN")

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
tv = TvDatafeed()

def run():
    # Ambil harga XAUUSD dari TradingView
    data = tv.get_hist(symbol='XAUUSD', exchange='OANDA', interval=Interval.in_1_minute, n_bars=1)
    curr_price = data['close'].iloc[-1]

    # Cek alert di Supabase
    alerts = supabase.table("alerts").select("*").eq("status", "pending").execute()

    # Cari bagian loop 'for a in alerts.data:' di scanner.py, ganti dengan ini:

    for a in alerts.data:
        target = a['target_price']
        
        # Logika: Alert bunyi jika harga menyentuh/melewati target
        # Kita buat fleksibel (baik harga naik atau turun)
        if abs(curr_price - target) <= 0.5: # Toleransi 0.5 point/pips
            msg = f"🔔 <b>PRICE ALERT!</b>\n\nXAUUSD menyentuh target: <b>${target}</b>\nHarga saat ini: ${curr_price}"
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            requests.post(url, json={"chat_id": a['user_id'], "text": msg, "parse_mode": "HTML"})
            
            # Tandai sudah bunyi
            supabase.table("alerts").update({"status": "triggered"}).eq("id", a['id']).execute()

if __name__ == "__main__":
    run()