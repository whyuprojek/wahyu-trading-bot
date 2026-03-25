import os
import requests
from tvDatafeed import TvDatafeed, Interval
from supabase import create_client

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
tv = TvDatafeed()

def run():
    # Ambil harga XAUUSD dari TradingView
    data = tv.get_hist(symbol='XAUUSD', exchange='OANDA', interval=Interval.in_1_minute, n_bars=1)
    curr_price = data['close'].iloc[-1]

    # Cek alert di Supabase
    alerts = supabase.table("alerts").select("*").eq("status", "pending").execute()

    for a in alerts.data:
        if curr_price >= a['target_price']:
            msg = f"🔔 ALERT: XAUUSD menyentuh ${a['target_price']}!"
            requests.post(f"https://api.telegram.org/bot{os.getenv('BOT_TOKEN')}/sendMessage", 
                          json={"chat_id": a['user_id'], "text": msg})
            
            supabase.table("alerts").update({"status": "triggered"}).eq("id", a['id']).execute()

if __name__ == "__main__":
    run()