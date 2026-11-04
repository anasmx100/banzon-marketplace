
const html = (body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BANZON Marketplace</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial;background:#f4f6fa;color:#222}
header{background:#172554;color:white;padding:18px;text-align:center}
main{max-width:850px;margin:20px auto;padding:15px}
.card{background:white;padding:18px;margin:14px 0;border-radius:12px;box-shadow:0 2px 8px #ddd}
input,textarea,select{width:100%;padding:12px;margin:7px 0;border:1px solid #ccc;border-radius:7px}
button{background:#1d4ed8;color:white;padding:11px 17px;border:0;border-radius:7px;cursor:pointer;margin:4px}
button.danger{background:#dc2626}
img{max-width:100%;border-radius:8px}
nav{display:flex;flex-wrap:wrap;justify-content:center;gap:5px}
.small{color:#666;font-size:13px}
</style>
</head>
<body>
<header>
<h1>BANZON</h1>
<p>Your Online Marketplace</p>
<nav>
<button onclick="show('home')">Home</button>
<button onclick="show('login')">Login</button>
<button onclick="show('register')">Register</button>
<button onclick="show('sell')">Sell Product</button>
<button onclick="show('admin')">Admin</button>
<button onclick="logout()">Logout</button>
</nav>
</header>
<main>
<div id="app"></div>
</main>
<script>
const app=document.getElementById('app');
let currentUser=null;

async function api(url,method='GET',data=null){
 const opt={method,headers:{'Content-Type':'application/json'}};
 if(data)opt.body=JSON.stringify(data);
 const r=await fetch(url,opt);
 const j=await r.json();
 if(!r.ok)throw Error(j.error||'Request failed');
 return j;
}

function message(e){alert(e.message||'Something went wrong');}

async function show(page){
 try{
  if(page==='home'){
   const result=await api('/api/products');
   app.innerHTML='<h2>Latest Products</h2>'+
   (result.products.length?result.products.map(p=>`
   <div class="card">
   ${p.image_url?`<img src="${esc(p.image_url)}" alt="Product">`:''}
   <h3>${esc(p.title)}</h3>
   <p>${esc(p.description||'')}</p>
   <b>৳ ${Number(p.price).toFixed(2)}</b>
   <p class="small">${esc(p.category||'General')}</p>
   </div>`).join(''):'<div class="card">No products available yet.</div>');
  }
  if(page==='register'){
   app.innerHTML=`<div class="card"><h2>Create Account</h2>
   <form id="reg">
   <input name="name" placeholder="Full name" required>
   <input name="email" type="email" placeholder="Email" required>
   <input name="password" type="password" placeholder="Password (minimum 8 characters)" required>
   <select name="seller_type"><option value="individual">Individual</option><option value="business">Business</option></select>
   <button>Create Account</button></form></div>`;
   document.getElementById('reg').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    try{await api('/api/register','POST',Object.fromEntries(f));alert('Registration successful');show('home');}
    catch(err){message(err);}
   };
  }
  if(page==='login'){
   app.innerHTML=`<div class="card"><h2>Login</h2>
   <form id="log">
   <input name="email" type="email" placeholder="Email" required>
   <input name="password" type="password" placeholder="Password" required>
   <button>Login</button></form></div>`;
   document.getElementById('log').onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    try{const r=await api('/api/login','POST',Object.fromEntries(f));currentUser=r.user;alert('Login successful');show('home');}
    catch(err){message(err);}
   };
  }
  if(page==='sell'){
   const me=await api('/api/me');
   if(!me.user){app.innerHTML='<div class="card">Please login first.</div>';return;}
   app.innerHTML=`<div class="card"><h2>Upload Product</h2>
   <form id="sell">
   <input name="title" placeholder="Product name" required>
   <textarea name="description" placeholder="Product description"></textarea>
   <input name="price" type="number" min="0.01" step="0.01" placeholder="Price (BDT)" required>
   <input name="image_url" type="url" placeholder="Product image URL (optional)">
   <input name="category" placeholder="Category">
   <button>Submit Product</button></form>
   <p class="small">Products will be visible after admin approval.</p></div>`;
   document.getElementById('sell').onsubmit=async e=>{
    e.preventDefault();
    const f=Object.fromEntries(new FormData(e.target));
    try{await api('/api/products','POST',f);alert('Product submitted for approval');show('home');}
    catch(err){message(err);}
   };
  }
  if(page==='admin'){
   const me=await api('/api/me');
   if(!me.user||!me.user.is_admin){app.innerHTML='<div class="card">Admin access required.</div>';return;}
   const r=await api('/api/admin/products');
   app.innerHTML='<h2>Admin Panel</h2>'+r.products.map(p=>`
   <div class="card">
   <h3>${esc(p.title)}</h3>
   <p>৳ ${p.price} | ${esc(p.status)}</p>
   <p>${esc(p.description||'')}</p>
   <button onclick="review(${p.id},'approved')">Approve</button>
   <button class="danger" onclick="review(${p.id},'rejected')">Reject</button>
   </div>`).join('');
  }
 }catch(e){app.innerHTML='<div class="card">'+esc(e.message)+'</div>';}
}

async function review(id,status){
 try{await api('/api/admin/products/'+id,'PATCH',{status});show('admin');}
 catch(e){message(e);}
}
async function logout(){
 try{await api('/api/logout','POST',{});currentUser=null;alert('Logged out');show('home');}
 catch(e){message(e);}
}
function esc(s){
 return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
show('home');
</script>
</body>
</html>`;

function json(data,status=200,headers={}){
 return new Response(JSON.stringify(data),{
  status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}
 });
}

function randomHex(bytes=32){
 const a=new Uint8Array(bytes);
 crypto.getRandomValues(a);
 return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function toBase64(bytes){
 let s='';
 for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);
 return btoa(s);
}

async function hashPassword(password,salt){
 const key=await crypto.subtle.importKey(
  'raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']
 );
 const bits=await crypto.subtle.deriveBits({
  name:'PBKDF2',salt:new TextEncoder().encode(salt),
  iterations:100000,hash:'SHA-256'
 },key,256);
 return toBase64(bits);
}

async function newSession(db,userId){
 const token=randomHex(32);
 const expires=new Date(Date.now()+7*24*60*60*1000).toISOString();
 await db.prepare(
  'INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)'
 ).bind(token,userId,expires).run();
 return token;
}

function cookie(token){
 return 'banzon_session='+token+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800';
}

function getToken(request){
 const c=request.headers.get('Cookie')||'';
 const m=c.match(/(?:^|;\s*)banzon_session=([^;]+)/);
 return m?m[1]:null;
}

async function getUser(request,db){
 const token=getToken(request);
 if(!token)return null;
 return await db.prepare(`
 SELECT users.id,users.name,users.email,users.seller_type,users.is_admin
 FROM sessions JOIN users ON users.id=sessions.user_id
 WHERE sessions.token=? AND datetime(sessions.expires_at)>datetime('now')
 `).bind(token).first();
}

async function readBody(request){
 try{return await request.json();}
 catch{return {};}
}

export default {
 async fetch(request,env){
  try{
   const db=env.DB;
   if(!db)return json({error:'D1 binding DB not found'},500);

   const url=new URL(request.url);
   const path=url.pathname;
   const method=request.method;

   if(path==='/'){
    return new Response(html(),{headers:{'Content-Type':'text/html; charset=utf-8'}});
   }

   if(path==='/register'||path==='/login'||path==='/sell'){
    return new Response(html(),{headers:{'Content-Type':'text/html; charset=utf-8'}});
   }

   if(path==='/api/register'&&method==='POST'){
    const b=await readBody(request);
    const name=String(b.name||'').trim();
    const email=String(b.email||'').trim().toLowerCase();
    const password=String(b.password||'');
    const sellerType=b.seller_type==='business'?'business':'individual';

    if(!name||!email||password.length<8)
     return json({error:'Name, valid email and password of at least 8 characters are required'},400);

    const exists=await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
    if(exists)return json({error:'Email already registered'},409);

    const salt=randomHex(16);
    const passwordHash=await hashPassword(password,salt);
    const result=await db.prepare(`
    INSERT INTO users(name,email,password_hash,password_salt,seller_type)
    VALUES(?,?,?,?,?)
    `).bind(name,email,passwordHash,salt,sellerType).run();

    const token=await newSession(db,result.meta.last_row_id);
    return json({success:true,message:'Account created',user:{name,email}},
     201,{'Set-Cookie':cookie(token)});
   }

   if(path==='/api/login'&&method==='POST'){
    const b=await readBody(request);
    const email=String(b.email||'').trim().toLowerCase();
    const password=String(b.password||'');
    const user=await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    if(!user)return json({error:'Invalid email or password'},401);

    const check=await hashPassword(password,user.password_salt);
    if(check!==user.password_hash)return json({error:'Invalid email or password'},401);

    const token=await newSession(db,user.id);
    return json({success:true,user:{id:user.id,name:user.name,email:user.email,is_admin:user.is_admin}},
     200,{'Set-Cookie':cookie(token)});
   }

   if(path==='/api/logout'&&method==='POST'){
    const token=getToken(request);
    if(token)await db.prepare('DELETE FROM sessions WHERE token=?').bind(token).run();
    return json({success:true},200,{
     'Set-Cookie':'banzon_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    });
   }

   if(path==='/api/me'&&method==='GET'){
    return json({user:await getUser(request,db)});
   }

   if(path==='/api/products'&&method==='GET'){
    const result=await db.prepare(`
    SELECT id,seller_id,title,description,price,image_url,category,status,created_at
    FROM products WHERE status='approved' ORDER BY id DESC LIMIT 100
    `).all();
    return json({products:result.results||[]});
   }

   if(path==='/api/products'&&method==='POST'){
    const user=await getUser(request,db);
    if(!user)return json({error:'Please login first'},401);
    const b=await readBody(request);
    const title=String(b.title||'').trim();
    const description=String(b.description||'').trim();
    const price=Number(b.price);
    const imageUrl=String(b.image_url||'').trim();
    const category=String(b.category||'General').trim();

    if(!title||!Number.isFinite(price)||price<=0)
     return json({error:'Valid product title and price are required'},400);

    if(imageUrl&&!/^https?:\/\//i.test(imageUrl))
     return json({error:'Image URL must start with http:// or https://'},400);

    await db.prepare(`
    INSERT INTO products(seller_id,title,description,price,image_url,category)
    VALUES(?,?,?,?,?,?)
    `).bind(user.id,title,description,price,imageUrl||null,category||'General').run();

    return json({success:true,message:'Product submitted for approval'},201);
   }

   if(path==='/api/my-products'&&method==='GET'){
    const user=await getUser(request,db);
    if(!user)return json({error:'Please login first'},401);
    const result=await db.prepare(
     'SELECT * FROM products WHERE seller_id=? ORDER BY id DESC'
    ).bind(user.id).all();
    return json({products:result.results||[]});
   }

   if(path==='/api/admin/products'&&method==='GET'){
    const user=await getUser(request,db);
    if(!user||!user.is_admin)return json({error:'Admin access required'},403);
    const result=await db.prepare('SELECT * FROM products ORDER BY id DESC LIMIT 200').all();
    return json({products:result.results||[]});
   }

   const adminMatch=path.match(/^\/api\/admin\/products\/(\d+)$/);
   if(adminMatch&&method==='PATCH'){
    const user=await getUser(request,db);
    if(!user||!user.is_admin)return json({error:'Admin access required'},403);
    const b=await readBody(request);
    if(!['approved','rejected','pending'].includes(b.status))
     return json({error:'Invalid product status'},400);
    await db.prepare('UPDATE products SET status=? WHERE id=?')
     .bind(b.status,Number(adminMatch[1])).run();
    return json({success:true});
   }

   return json({error:'Not found'},404);
  }catch(error){
   return json({error:'Server error',details:String(error?.message||error)},500);
  }
 }
};
