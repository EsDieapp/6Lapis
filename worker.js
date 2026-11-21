
import { DurableObject } from "cloudflare:workers";

const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>6LAPIS Control</title>
<style>
body{margin:0;background:#080b12;color:#fff;font-family:Arial;padding:20px}
main{max-width:550px;margin:auto}
header{display:flex;justify-content:space-between;align-items:center}
h1{letter-spacing:3px}
.tag{color:#55e6a5;border:1px solid #246e50;padding:8px;border-radius:20px;font-size:12px}
.card{background:#151b27;padding:18px;border-radius:13px;margin:12px 0}
.small{color:#9aa6ba;font-size:12px}
.value{font-size:21px;font-weight:bold;margin-top:9px}
input{box-sizing:border-box;width:100%;padding:13px;border-radius:8px;border:1px solid #38445a;background:#0c1220;color:white}
button{width:100%;padding:15px;border:0;border-radius:9px;margin:6px 0;font-weight:bold}
.start{background:#159b68;color:white}
.stop{background:#38445a;color:white}
.emergency{background:#a83242;color:white}
button:disabled{opacity:.4}
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
<div class="small">SALDO</div>
<div class="value">Belum tersedia</div>
</div>

<div class="card">
<div class="small">PNL</div>
<div class="value">Belum tersedia</div>
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

<p class="small">6LAPIS • SIMULATION ONLY • NO REAL TRADING</p>
</main>

<script>
async function control(action){
 const token=document.getElementById("token").value;
 const message=document.getElementById("message");
 message.textContent="Mengirim perintah...";
 try{
  const r=await fetch("/api/control",{
   method:"POST",
   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+token
   },
   body:JSON.stringify({action})
  });
  const data=await r.json();
  message.textContent=data.message || data.error || "Selesai";
  await status();
 }catch(e){
  message.textContent="Koneksi gagal";
 }
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
        return Response.json({
          error: "Emergency lock aktif"
        }, { status: 423 });
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
   
