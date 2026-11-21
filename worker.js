
import { DurableObject } from "cloudflare:workers";

const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>6LAPIS Control</title>
<style>
body{margin:0;background:#080b12;color:#fff;font-family:Arial;padding:18px}
main{max-width:600px;margin:auto}
header{display:flex;justify-content:space-between;align-items:center}
h1{letter-spacing:3px}
.tag{color:#55e6a5;border:1px solid #246e50;padding:8px;border-radius:20px;font-size:12px}
.card{background:#151b27;padding:17px;border-radius:13px;margin:12px 0}
.small{color:#9aa6ba;font-size:12px}
.value{font-size:21px;font-weight:bold;margin-top:9px}
input{box-sizing:border-box;width:100%;padding:13px;border-radius:8px;border:1px solid #38445a;background:#0c1220;color:white}
button{width:100%;padding:14px;border:0;border-radius:9px;margin:6px 0;font-weight:bold}
.start{background:#159b68;color:white}
.stop{background:#38445a;color:white}
.emergency{background:#a83242;color:white}
.scan{background:#2468b4;color:white}
.result{border-top:1px solid #30394a;padding:14px 0}
.buy{color:#55e6a5}.wait{color:#ffd166}.avoid{color:#ff6878}
a{color:#70b7ff}
</style>
</head>
<body>
<main>
<header><h1>6LAPIS</h1><span class="tag">SIMULATION</span></header>

<div class="card">
<div class="small">STATUS BOT</div>
<div class="value" id="status">CHECKING</div>
</div>

<div class="card">
<div class="small">TRADING</div>
<div class="value">OFF</div>
</div>

<div class="card">
<div class="small">TOKEN KONTROL</div>
<input id="token" type="password" placeholder="Masukkan token kontrol">
</div>

<div class="card">
<button class="start" onclick="control('START')">START SIMULASI</button>
<button class="stop" onclick="control('STOP')">STOP</button>
<button class="emergency" onclick="control('EMERGENCY_STOP')">EMERGENCY STOP</button>
<p id="message" class="small">Kontrol belum terhubung.</p>
</div>

<div class="card">
<h3>SCANNER SOLANA V2</h3>
<p class="small">Data pasar langsung dari DEX Screener • Tanpa transaksi otomatis</p>
<button class="scan" onclick="scan()">SCAN TOKEN SOLANA</button>
<p id="scanMessage" class="small">Belum ada pemindaian.</p>
<div id="results"></div>
</div>

<p class="small">6LAPIS • MARKET DATA ONLY • NO REAL TRADING</p>
</main>

<script>
async function control(action){
 const token=document.getElementById("token").value;
 const message=document.getElementById("message");
 message.textContent="Mengirim perintah...";
 try{
  const r=await fetch("/api/control",{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
   body:JSON.stringify({action})
  });
  const data=await r.json();
  message.textContent=data.message || data.error || "Selesai";
  await status();
 }catch(e){message.textContent="Koneksi gagal";}
}
async function status(){
 try{
  const r=await fetch("/api/status");
  const d=await r.json();
  document.getElementById("status").textContent=d.status;
 }catch(e){
  document.getElementById("status").textContent="OFFLINE";
 }
}
function money(n){
 if(n===null||n===undefined)return "N/A";
 return "$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
}
async function scan(){
 const box=document.getElementById("results");
 const msg=document.getElementById("scanMessage");
 box.innerHTML="";
 msg.textContent="Mengambil kandidat dan data pasar...";
 try{
  const r=await fetch("/api/scanner");
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||"Gagal mengambil data");
  msg.textContent="Selesai: "+d.count+" kandidat Solana. Sumber: DEX Screener.";
  if(!d.tokens.length){
   box.textContent="Belum ada kandidat dengan data pool yang tersedia.";
   return;
  }
  for(const t of d.tokens){
   const div=document.createElement("div");
   div.className="result";
   const signalClass=t.signal.toLowerCase();
   const link=document.createElement("a");
   link.href=t.url||"#";
   link.target="_blank";
   link.rel="noopener";
   link.textContent="Lihat pool di DEX Screener";
   const title=document.createElement("b");
   title.textContent=t.name+" ("+t.symbol+")";
   const lines=[
    t.type,
    "Harga: "+money(t.priceUsd),
    "Likuiditas: "+money(t.liquidity),
    "Volume 24 jam: "+money(t.volume24),
    "Transaksi 24 jam: "+t.txns24+" (BUY "+t.buys24+" / SELL "+t.sells24+")",
    "Perubahan harga 24 jam: "+t.change24+"%",
    "Umur pool: "+t.ageHours+" jam",
    "Momentum: "+t.momentum+"/100",
    "Risiko: "+t.risk+"/100",
    "Sinyal: "+t.signal,
    "Boost aktif: "+t.boosts
   ];
   div.appendChild(title);
   for(const line of lines){
    const p=document.createElement("p");
    p.className="small";
    p.textContent=line;
    div.appendChild(p);
   }
   const signal=document.createElement("b");
   signal.className=signalClass;
   signal.textContent=t.signal;
   div.appendChild(signal);
   div.appendChild(document.createElement("br"));
   div.appendChild(link);
   box.appendChild(div);
  }
 }catch(e){
  msg.textContent="Scanner gagal: "+e.message;
 }
}
status();
</script>
</body>
</html>`;

export class BotState extends DurableObject {
  async fetch(request) {
    const current = await this.ctx.storage.get("status") || "STOPPED";
    const emergency = await this.ctx.storage.get("emergency") || false;

    if (request.method === "GET") {
      return Response.json({ status: current, emergency });
    }

    const body = await request.json();

    if (body.action === "START") {
      if (emergency) {
        return Response.json({ error: "Emergency lock aktif" }, { status: 423 });
      }
      await this.ctx.storage.put("status", "RUNNING");
    } else if (body.action === "STOP") {
      await this.ctx.storage.put("status", "STOPPED");
    } else if (body.action === "EMERGENCY_STOP") {
      await this.ctx.storage.put("status", "STOPPED");
      await this.ctx.storage.put("emergency", true);
    } else {
      return Response.json({ error: "Perintah tidak dikenal" }, { status: 400 });
    }

    return Response.json({
      status: await this.ctx.storage.get("status"),
      emergency: await this.ctx.storage.get("emergency"),
      message: "Status simulasi diperbarui"
    });
  }
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) {
    throw new Error("DEX Screener HTTP " + response.status);
  }
  return response.json();
}

async function scanSolana() {
  const [profiles, boosts] = await Promise.all([
    getJson("https://api.dexscreener.com/token-profiles/latest/v1"),
    getJson("https://api.dexscreener.com/token-boosts/latest/v1")
  ]);

  const candidates = new Map();

  for (const item of [...(Array.isArray(profiles) ? profiles : []),
                      ...(Array.isArray(boosts) ? boosts : [])]) {
    if (item.chainId !== "solana" || !item.tokenAddress) continue;
    candidates.set(item.tokenAddress, {
      address: item.tokenAddress,
      boosted: candidates.has(item.tokenAddress) || boosts.some(
        b => b.chainId === "solana" && b.tokenAddress === item.tokenAddress
      )
    });
  }

  const addresses = [...candidates.keys()].slice(0, 30);
  if (!addresses.length) {
    return { count: 0, tokens: [], source: "DEX Screener" };
  }

  const url = "https://api.dexscreener.com/tokens/v1/solana/" +
    addresses.map(encodeURIComponent).join(",");

  const pairs = await getJson(url);
  const bestPairs = new Map();

  for (const pair of Array.isArray(pairs) ? pairs : []) {
    if (pair.chainId !== "solana" || !pair.baseToken?.address) continue;
    const address = pair.baseToken.address;
    if (!candidates.has(address)) continue;

    const liquidity = Number(pair.liquidity?.usd || 0);
    const previous = bestPairs.get(address);
    if (!previous || liquidity > Number(previous.liquidity?.usd || 0)) {
      bestPairs.set(address, pair);
    }
  }

  const now = Date.now();
  const tokens = [];

  for (const [address, pair] of bestPairs) {
    const liquidity = Number(pair.liquidity?.usd || 0);
    const volume24 = Number(pair.volume?.h24 || 0);
    const buys24 = Number(pair.txns?.h24?.buys || 0);
    const sells24 = Number(pair.txns?.h24?.sells || 0);
    const txns24 = buys24 + sells24;
    const change24 = Number(pair.priceChange?.h24 || 0);
    const ageHours = pair.pairCreatedAt
      ? Math.max(0, (now - pair.pairCreatedAt) / 3600000)
      : null;
    const boosted = candidates.get(address).boosted;

    let momentum = 0;
    momentum += Math.min(30, volume24 / 1000);
    momentum += Math.min(25, txns24 / 20);
    momentum += Math.max(0, Math.min(25, change24));
    momentum += txns24 ? Math.min(20, buys24 / txns24 * 20) : 0;
    momentum = Math.round(Math.min(100, momentum));

    let risk = 20;
    if (liquidity < 5000) risk += 40;
    else if (liquidity < 15000) risk += 20;
    if (sells24 > buys24 * 1.5 && sells24 >= 10) risk += 20;
    if (txns24 < 10) risk += 10;
    if (change24 > 100) risk += 10;
    if (ageHours !== null && ageHours < 1) risk += 10;
    risk = Math.min(100, risk);

    let signal = "WAIT";
    if (liquidity < 5000 || risk >= 70) signal = "AVOID";
    else if (momentum >= 65 && risk <= 45 && txns24 >= 20) signal = "WATCH";

    tokens.push({
      name: pair.baseToken.name || "Unknown",
      symbol: pair.baseToken.symbol || "N/A",
      address,
      url: pair.url || "",
      priceUsd: pair.priceUsd || null,
      liquidity: Math.round(liquidity),
      volume24: Math.round(volume24),
      buys24,
      sells24,
      txns24,
      change24: Number(change24.toFixed(2)),
      ageHours: ageHours === null ? "N/A" : Number(ageHours.toFixed(1)),
      type: ageHours !== null && ageHours <= 48
        ? "Pool baru (maks. 48 jam)"
        : "Kandidat momentum",
      momentum,
      risk,
      signal,
      boosts: boosted ? "Ya (promosi terdeteksi)" : "Tidak terdeteksi"
    });
  }

  tokens.sort((a, b) => b.momentum - a.momentum);
  return { count: tokens.length, tokens, source: "DEX Screener" };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    if (url.pathname === "/health") {
      return Response.json({ healthy: true, trading: false });
    }

    if (url.pathname === "/api/scanner" && request.method === "GET") {
      try {
        return Response.json({
          mode: "LIVE_MARKET_DATA",
          trading: false,
          ...(await scanSolana())
        });
      } catch (error) {
        return Response.json({
          error: "Gagal mengambil data DEX Screener: " + error.message
        }, { status: 502 });
      }
    }

    const id = env.BOT_STATE.idFromName("6lapis-main");
    const state = env.BOT_STATE.get(id);

    if (url.pathname === "/api/status" && request.method === "GET") {
      return state.fetch(new Request("https://internal/status"));
    }

    if (url.pathname === "/api/control" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (!env.CONTROL_TOKEN || auth !== "Bearer " + env.CONTROL_TOKEN) {
        return Response.json({ error: "Akses ditolak" }, { status: 401 });
      }

      return state.fetch(new Request("https://internal/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await request.text()
      }));
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
};
            
