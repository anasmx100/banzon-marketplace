const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const html = (body, title = "BANZON") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#102b59"><title>${title}</title>
<style>
:root{--navy:#102b59;--blue:#1769d2;--pale:#eef5ff;--ink:#152238;--muted:#66758b}
*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f8fd;color:var(--ink)}
header{background:linear-gradient(110deg,#102b59,#1769d2);color:white;padding:18px max(5%,calc((100% - 1100px)/2));display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.logo{font-size:27px;font-weight:900;letter-spacing:2px}.tag{font-size:12px;opacity:.85}
nav a{color:white;text-decoration:none;margin-left:15px;font-size:14px}
main{max-width:1100px;margin:28px auto;padding:0 16px}.hero{background:white;border-radius:20px;padding:28px;box-shadow:0 8px 30px #102b5910}
h1{font-size:clamp(27px,5vw,42px);margin:0 0 10px;color:var(--navy)}p{line-height:1.55}.muted{color:var(--muted)}
.search{display:flex;gap:8px;margin-top:20px}.search input{flex:1}
input,select,textarea{width:100%;padding:12px;border:1px solid #d6dfeb;border-radius:10px;font:inherit;background:white;margin:5px 0 12px}
button,.btn{background:var(--blue);color:white;border:0;border-radius:10px;padding:12px 17px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}
button.secondary,.btn.secondary{background:#e8f1ff;color:var(--navy)}
.sectionhead{display:flex;justify-content:space-between;align-items:center;margin:28px 0 14px;gap:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.card{background:white;border-radius:15px;overflow:hidden;box-shadow:0 5px 20px #102b590c}
.card img{width:100%;height:155px;object-fit:cover;background:var(--pale)}
.cardbody{padding:14px}.price{font-size:20px;color:var(--blue);font-weight:800}
.panel{background:white;padding:22px;border-radius:16px;max-width:620px;margin:20px auto;box-shadow:0 8px 30px #102b5910}
label{font-size:13px;font-weight:700;color:#394b63}
.notice{padding:12px;background:#eef5ff;border-radius:10px;color:#244a7d}
footer{text-align:center;color:var(--muted);padding:30px;font-size:13px}
@media(max-width:600px){header{padding:16px}.search{flex-direction:column}.sectionhead{align-items:flex-start;flex-direction:column}}
</style></head><body>
<header><div><div class="logo">BANZON</div><div class="tag">A smarter marketplace</div></div>
<nav><a href="/">Home</a><a href="/sell">Start Selling</a><a href="/login">Login</a><a href="/register">Create Account</a></nav></header>
${body}<footer>© ${new Date().getFullYear()} BANZON Marketplace · Bangladesh first, worldwide next</footer></body></html>`;

function json(data, status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...CORS_HEADERS}})}
function page(body,title){return new Response(html(body,title),{headers:{"Content-Type":"text/html; charset=utf-8"}})}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function bodyData(req){try{return await req.json()}catch{return {}}}