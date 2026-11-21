
const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>6LAPIS Dashboard</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#080b12;color:#f4f6fb;font-family:Arial,sans-serif;padding:20px}
.wrap{max-width:600px;margin:auto}
header{display:flex;justify-content:space-between;align-items:center;margin:12px 0 28px}
h1{font-size:27px;letter-spacing:3px;margin:0}
.tag{color:#55e6a5;font-size:12px;border:1px solid #246e50;padding:7px 10px;border-radius:20px}
h2{font-size:15px;color:#aab3c4;margin:24px 0 12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:#151b27;border:1px solid #252e3e;border-radius:13px;padding:17px}
.small{color:#9aa6ba;font-size:12px}
.value{font-size:21px;font-weight:bold;margin-top:10px}
.green{color:#55e6a5}
.yellow{color:#ffd166}
.controls{display:grid;gap:10px}
button{padding:15px;border:0;border-radius:10px;font-weight:bold;font-size:14px}
button:disabled{opacity:.65}
.start{background:#1c9b68;color:white}
.stop{background:#303b4d;color:white}
.emergency{background:#a83242;color:white}
.note{color:#929db0;font-size:12px;line-height:1.6;margin-top:22px}
footer{color:#667287;text-align:center;font-size:11px;margin:35px 0}
</style>
</head>
<body>
<div class="wrap">
<header>
<h1>6LAPIS</h1>
<span class="tag">● SIMULATION</span>
</header>

<h2>STATUS SISTEM</h2>
<div class="grid">
<div class="card"><div class="small">BACKEND</div><div class="value green" id="backend">CHECKING</div></div>
<div class="card"><div class="small">TRADING</div><div class="value yellow">OFF</div></div>
<div class="card"><div class="small">SALDO</div><div class="value">Belum tersedia</div></div>
<div class="card"><div class="small">PNL</div><div class="value">Belum tersedia</div></div>
</div>

<h2>KONTROL BOT</h2>
<div class="controls">
<button class="start" disabled>START — BELUM AKTIF</button>
<button class="stop" disabled>STOP — BELUM AKTIF</button>
<button class="emergency" disabled>EMERGENCY STOP — BELUM AKTIF</button>
</div>

<div class="note">
Dashboard 6LAPIS versi awal.<br>
Mode simulasi. Belum terhubung ke scanner token,
wallet, atau sistem transaksi. Tombol kontrol belum aktif.
</div>
<footer>6LAPIS • SOLANA MEMECOIN SYSTEM</footer>
</div>
<script>
fetch("/health")
.then(r=>r.json())
.then(d=>{
document.getElementById("backend").textContent =
d.healthy ? "ONLINE" : "OFFLINE";
})
.catch(()=>{
document.getElementById("backend").textContent="OFFLINE";
});
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        healthy: true,
        scanner: "READY",
        trading: false
      });
    }

    if (url.pathname === "/") {
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8"
        }
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
};
