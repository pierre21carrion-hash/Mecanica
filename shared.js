const sb=supabase.createClient(CONFIG.URL,CONFIG.KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>'$'+Number(n).toFixed(2);
const today=()=>new Date(Date.now()-5*36e5).toISOString().slice(0,10);
const day=i=>new Date(new Date(i)-5*36e5).toISOString().slice(0,10);
const fdate=i=>new Date(i).toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'});
const wa=t=>{t=(t||'').replace(/\D/g,'');return t.startsWith('0')?'593'+t.slice(1):t};
const ST={nuevo:'Recibido',confirmado:'Confirmado',en_camino:'En camino',en_proceso:'En proceso',completado:'Completado',cancelado:'Cancelado'};
const IC={emer:'🆘',det:'✨',mec:'🔧'};
const logout=()=>sb.auth.signOut().then(()=>location.reload());
async function profile(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return null;
  const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).single();
  return data;
}
function authView(el,done){
  let reg=false;
  const draw=()=>{
    el.innerHTML=`<div class="card"><h2>${reg?'Crear cuenta':'Iniciar sesión'}</h2>
    ${reg?'<input id="n" placeholder="Nombre completo"><input id="t" placeholder="Teléfono / WhatsApp" inputmode="tel">':''}
    <input id="e" type="email" placeholder="Correo"><input id="p" type="password" placeholder="Contraseña (mínimo 6 caracteres)">
    <p class="note" id="m" hidden></p>
    <button class="btn" id="go">${reg?'Crear cuenta':'Entrar'}</button><div class="spacer"></div>
    <button class="btn sec" id="sw">${reg?'Ya tengo cuenta':'Crear cuenta nueva'}</button></div>`;
    $('#sw').onclick=()=>{reg=!reg;draw()};
    $('#go').onclick=async()=>{
      const m=$('#m'),e=$('#e').value.trim(),p=$('#p').value;let r;
      m.hidden=false;m.textContent='Un momento…';
      if(reg){
        const n=$('#n').value.trim(),t=$('#t').value.trim();
        if(!n||t.replace(/\D/g,'').length<7){m.textContent='Escribe tu nombre y un teléfono válido.';return;}
        r=await sb.auth.signUp({email:e,password:p,options:{data:{full_name:n,phone:t}}});
        if(!r.error&&!r.data.session){m.textContent='Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.';return;}
      }else r=await sb.auth.signInWithPassword({email:e,password:p});
      if(r.error){m.textContent=r.error.message;return;}
      done();
    };
  };
  draw();
}
