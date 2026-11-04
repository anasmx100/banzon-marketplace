const html = (body, title = "BANZON") => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f4f7fc;color:#17243b;font-family:Arial}
header{background:#102b59;color:white;padding:20px;display:flex;justify-content:space-between;flex-wrap:wrap}
nav a{color:white;margin:8px;text-decoration:none}
main{max-width:950px;margin:30px auto;padding:15px}
.panel,.hero,.card{background:white;padding:24px;border-radius:14px;margin-bottom:20px}
.panel{max-width:600px;margin:auto}
h1{color:#102b59}
input,textarea,select{width:100%;padding:13px;margin:7px 0 15px;border:1px solid #ccd5e2;border-radius:8px}
button,.btn{background:#1769d2;color:white;padding:12px 18px;border:0;border-radius:8px;text-decoration:none;cursor:pointer}
.error{color:#b42318}.success{color:green}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
footer{text-align:center;padding:25px;color:#667}
</style>
</head>
<body>
<header><b>BANZON MARKETPLACE</b>
<nav><a href="/">Home</a><a href="/register">Register</a><a href="/login">Login</a><a href="/sell">Sell</a></nav>
</header>
${body}
<footer>BANZON Marketplace</footer>
</body></html>`;

function esc(s="") {
 return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function json(data,status=200,headers={}) {
 return new Response(JSON.stringify(data),{
  status,
  headers:{"Content-Type":"application/json",...headers}
 });
}

function page(body,title) {
 return new Response(html(body,title),{
  headers:{"Content-Type":"text/html; charset=utf-8"}
 });
}

async function data(req) {
 try{return await req.json()}catch{return {}}
}

function randomHex(n=32) {
 const a=new Uint8Array(n);
 crypto.getRandomValues(a);
 return [...a].map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function hashPassword(password,saltHex) {
 const salt=Uint8Array.from(saltHex.match(/.{2}/g).map(x=>parseInt(x,16)));
 const key=await crypto.subtle.importKey(
  "raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]
 );
 const bits=await crypto.subtle.deriveBits({
  name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"
 },key,256);
 return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

function getToken(req) {
 const c=req.headers.get("Cookie")||"";
 const m=c.match(/(?:^|;\s*)banzon_session=([a-f0-9]+)/);
 return m?m[1]:"";
}

async function getUser(req,env) {
 const token=getToken(req);
 if(!token)return null;
 return await env.DB.prepare(
  "SELECT users.id,users.name,users.email,users.is_admin FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires_at>?"
 ).bind(token,new Date().toISOString()).first();
}

async function newSession(userId,env) {
 const token=randomHex(32);
 const expiry=new Date(Date.now()+7*86400000).toISOString();
 await env.DB.prepare(
  "INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)"
 ).bind(token,userId,expiry).run();
 return token;
}

function cookie(token) {
 return "banzon_session="+token+"; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800";
}
async function handle(req,env) {
 const url=new URL(req.url);
 const path=url.pathname;
 const method=req.method;

 if(method==="POST" && path==="/api/register") {
  const d=await data(req);
  const name=String(d.name||"").trim();
  const email=String(d.email||"").trim().toLowerCase();
  const password=String(d.password||"");
  const type=d.seller_type==="business"?"business":"individual";

  if(name.length<2)return json({error:"Enter your full name."},400);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
   return json({error:"Enter a valid email."},400);
  if(password.length<8)return json({error:"Password must be at least 8 characters."},400);

  const salt=randomHex(16);
  const hash=await hashPassword(password,salt);

  try {
   const result=await env.DB.prepare(
    "INSERT INTO users(name,email,password_hash,password_salt,seller_type) VALUES(?,?,?,?,?)"
   ).bind(name,email,hash,salt,type).run();

   const token=await newSession(result.meta.last_row_id,env);
   return json({ok:true},201,{"Set-Cookie":cookie(token)});
  } catch(e) {
   if(String(e.message).toLowerCase().includes("unique"))
    return json({error:"Email already registered. Please login."},409);
   throw e;
  }
 }

 if(method==="POST" && path==="/api/login") {
  const d=await data(req);
  const email=String(d.email||"").trim().toLowerCase();
  const password=String(d.password||"");

  const user=await env.DB.prepare(
   "SELECT * FROM users WHERE email=?"
  ).bind(email).first();

  if(!user)return json({error:"Incorrect email or password."},401);

  const hash=await hashPassword(password,user.password_salt);
  if(hash!==user.password_hash)
   return json({error:"Incorrect email or password."},401);

  const token=await newSession(user.id,env);
  return json({ok:true},200,{"Set-Cookie":cookie(token)});
 }

 if(method==="POST" && path==="/api/logout") {
  const token=getToken(req);
  if(token)await env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(token).run();
  return json({ok:true},200,{"Set-Cookie":"banzon_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"});
 }

 if(method==="GET" && path==="/api/me")
  return json({user:await getUser(req,env)});

 if(method==="GET" && path==="/api/products") {
  const r=await env.DB.prepare(
   "SELECT * FROM products WHERE status='approved' ORDER BY id DESC LIMIT 100"
  ).all();
  return json({products:r.results||[]});
 }

 if(method==="POST" && path==="/api/products") {
  const user=await getUser(req,env);
  if(!user)return json({error:"Please login first."},401);

  const d=await data(req);
  const title=String(d.title||"").trim();
  const price=Number(d.price);

  if(title.length<2||!Number.isFinite(price)||price<=0)
   return json({error:"Enter product name and valid price."},400);

  await env.DB.prepare(
   "INSERT INTO products(seller_id,title,description,price,image_url,category) VALUES(?,?,?,?,?,?)"
  ).bind(user.id,title,String(d.description||""),price,String(d.image_url||""),String(d.category||"General")).run();

  return json({ok:true,message:"Product submitted for approval."},201);
 }

 if(method==="GET" && path==="/api/my-products") {
  const user=await getUser(req,env);
  if(!user)return json({error:"Please login."},401);
  const r=await env.DB.prepare(
   "SELECT * FROM products WHERE seller_id=? ORDER BY id DESC"
  ).bind(user.id).all();
  return json({products:r.results||[]});
 }

 if(method==="GET" && path==="/register") {
  return page(`
  <main><section class="panel">
  <h1>Create Account</h1>
  <form id="f">
  <label>Full name</label><input name="name" required>
  <label>Email</label><input name="email" type="email" required>
  <label>Password (minimum 8 characters)</label>
  <input name="password" type="password" minlength="8" required>
  <label>Account type</label>
  <select name="seller_type">
  <option value="individual">Individual</option>
  <option value="business">Business</option>
  </select>
  <button>Create Account</button><p id="msg"></p>
  </form><a href="/login">Already registered? Login</a>
  </section></main>
  <script>
  document.getElementById("f").onsubmit=async e=>{
   e.preventDefault();
   let m=document.getElementById("msg");
   m.textContent="Creating account...";
   try{
    let r=await fetch("/api/register",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify(Object.fromEntries(new FormData(e.target)))
    });
    let j=await r.json();
    if(!r.ok)throw Error(j.error||"Registration failed");
    m.textContent="Account created!";
    location.href="/sell";
   }catch(x){
    m.textContent=x.message;
    m.className="error";
   }
  };
  </script>`,"Register");
 }

 if(method==="GET" && path==="/login") {
  return page(`
  <main><section class="panel"><h1>Login</h1>
  <form id="f">
  <label>Email</label><input name="email" type="email" required>
  <label>Password</label><input name="password" type="password" required>
  <button>Login</button><p id="msg"></p>
  </form><a href="/register">Create account</a>
  </section></main>
  <script>
  document.getElementById("f").onsubmit=async e=>{
   e.preventDefault();
   let m=document.getElementById("msg");
   m.textContent="Signing in...";
   try{
    let r=await fetch("/api/login",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify(Object.fromEntries(new FormData(e.target)))
    });
    let j=await r.json();
    if(!r.ok)throw Error(j.error||"Login failed");
    location.href="/sell";
   }catch(x){
    m.textContent=x.message;
    m.className="error";
   }
  };
  </script>`,"Login");
 }

 if(method==="GET" && path==="/sell") {
  const user=await getUser(req,env);
  if(!user)return new Response(null,{status:302,headers:{Location:"/login"}});
  return page(`<main><section class="panel">
  <h1>Welcome ${esc(user.name)}</h1>
  <p>Your seller account is ready.</p>
  <h2>Add product</h2>
  <form id="p">
  <label>Product name</label><input name="title" required>
  <label>Description</label><textarea name="description"></textarea>
  <label>Price (BDT)</label><input name="price" type="number" min="1" required>
  <label>Image URL</label><input name="image_url" type="url">
  <label>Category</label><input name="category" value="General">
  <button>Submit Product</button><p id="msg"></p>
  </form><button id="out">Logout</button>
  </section></main>
  <script>
  document.getElementById("p").onsubmit=async e=>{
   e.preventDefault();
   let m=document.getElementById("msg");
   try{
    let r=await fetch("/api/products",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify(Object.fromEntries(new FormData(e.target)))
    });
    let j=await r.json();
    if(!r.ok)throw Error(j.error);
    m.textContent=j.message;
   }catch(x){m.textContent=x.message;m.className="error";}
  };
  document.getElementById("out").onclick=async()=>{
   await fetch("/api/logout",{method:"POST"});
   location.href="/";
  };
  </script>`,"Seller Dashboard");
 }

 if(method==="GET" && path==="/") {
  const r=await env.DB.prepare(
   "SELECT * FROM products WHERE status='approved' ORDER BY id DESC LIMIT 30"
  ).all();

  const cards=(r.results||[]).map(p=>
   `<div class="card"><h3>${esc(p.title)}</h3>
   <p>${esc(p.description||"")}</p>
   <b>৳${Number(p.price).toLocaleString("en-BD")}</b></div>`
  ).join("");

  return page(`<main>
  <section class="hero">
  <h1>Welcome to BANZON</h1>
  <p>Your online marketplace.</p>
  <a class="btn" href="/register">Create Account</a>
  <a class="btn" href="/sell">Start Selling</a>
  </section>
  <h2>Products</h2><section class="grid">${cards||"No products yet."}</section>
  </main>`,"BANZON Marketplace");
 }

 return new Response("Not found",{status:404});
}

export default {
 async fetch(request,env) {
  try {
   if(!env.DB)return json({error:"D1 binding DB is missing."},500);
   return await handle(request,env);
  }catch(e){
   console.error("BANZON error:",e);
   return json({
    error:"Server error",
    detail:String(e.message||e)
   },500);
  }
 }
};
