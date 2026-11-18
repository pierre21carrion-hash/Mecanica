const sb=supabase.createClient(CONFIG.URL,CONFIG.KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>'$'+Number(n).toFixed(2);
const today=()=>new Date(Date.now()-5*36e5).toISOString().slice(0,10);
const day=i=>new Date(new Date(i)-5*36e5).toISOString().slice(0,10);
const fdate=i=>new Date(i).toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'});
const wa=t=>{t=(t||'').replace(/\D/g,'');return t.startsWith('0')?'593'+t.slice(1):t};
const ST={nuevo:'Recibido',confirmado:'Confirmado',en_camino:'En camino',en_proceso:'En proceso',completado:'Completado',cancelado:'Cancelado'};
// DISEÑO: iconos SVG inline (reemplazan los emojis); ico('nombre') devuelve el <svg>
const ICO={
emer:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.6 5.6 3.9 3.9m5 5 3.9 3.9m0-12.8-3.9 3.9m-5 5-3.9 3.9"/>',
det:'<path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6z"/><path d="M18 14v5m-2.5-2.5h5"/>',
mec:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
alert:'<path d="m12 3.5 9.2 16H2.8z"/><path d="M12 10v4m0 2.6v.01"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5m0 3v.01"/>',
cross:'<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
car:'<path d="M5 16.5v-4l1.7-4.3A2 2 0 0 1 8.6 7h6.8a2 2 0 0 1 1.9 1.2L19 12.5v4z"/><path d="M5 12.5h14"/><circle cx="8" cy="19" r="1.4"/><circle cx="16" cy="19" r="1.4"/>',
suv:'<path d="M4.5 16.5V11L6.5 7h11l2 4v5.5z"/><path d="M4.5 11h15"/><circle cx="8" cy="19" r="1.4"/><circle cx="16" cy="19" r="1.4"/>',
pickup:'<path d="M3 16.5V11h8V7.5h5.2l2.8 3.5h2v5.5z"/><circle cx="7" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
truck:'<path d="M3 6.5h11v10H3zM14 10h4.2l2.8 3.5v3H14z"/><circle cx="7" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
pin:'<path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
cal:'<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4m7-4v4"/>',
user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
battery:'<rect x="3" y="7.5" width="16" height="9" rx="2.2"/><path d="M21.5 11v2M8 10.5v3m-1.5-1.5h3"/>',
tire:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r=".8"/>',
cone:'<path d="M10 5h4l4.5 14h-13z"/><path d="M8.2 11.5h7.6M6.8 15.5h10.4M3.5 19h17"/>',
fuel:'<path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20"/><path d="M4 20h11M5 9h9M14 9.5h2.2a1.8 1.8 0 0 1 1.8 1.8v4.7a1.2 1.2 0 0 0 2.4 0V8l-2.4-2.2"/>',
box:'<rect x="3.5" y="8" width="17" height="11.5" rx="2.5"/><path d="M9 8V6.2A1.7 1.7 0 0 1 10.7 4.5h2.6A1.7 1.7 0 0 1 15 6.2V8M3.5 13h17"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
drop:'<path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z"/>',
layers:'<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
sound:'<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
down:'<path d="M12 4v13m0 0-5-5m5 5 5-5M5 20.5h14"/>',
pulse:'<path d="M3 12h3l2-6 4 12 3-9 1.5 3H21"/>',
note:'<path d="M6.5 3.5h8l4 4v13h-12z"/><path d="M9.5 12h6m-6 3.5h6"/>',
chev:'<path d="m9 6 6 6-6 6"/>',
back:'<path d="m15 6-6 6 6 6"/>',
chat:'<path d="M4.5 19.5l1.2-3.9A8 8 0 1 1 8.5 18.3z"/>',
shield:'<path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
home:'<path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>'
};
const ico=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]||''}</svg>`;
// DISEÑO: IC ahora devuelve iconos SVG (se usa igual: ${IC[o.branch]})
const IC={emer:ico('emer'),det:ico('det'),mec:ico('mec')};
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
    // DISEÑO: tarjeta centrada con etiquetas visibles (misma lógica y mismos ids)
    el.innerHTML=`<div class="card auth"><h2>${reg?'Crear cuenta':'Iniciar sesión'}</h2>
    <p class="note">${reg?'Con tu cuenta podrás seguir el estado de tus pedidos.':'Entra para ver y seguir tus pedidos.'}</p>
    ${reg?'<label class="field"><span>Nombre completo</span><input id="n" autocomplete="name" placeholder="Ej. María Pérez"></label><label class="field"><span>Teléfono / WhatsApp</span><input id="t" inputmode="tel" autocomplete="tel" placeholder="Ej. 0999 999 999"></label>':''}
    <label class="field"><span>Correo</span><input id="e" type="email" autocomplete="email" placeholder="tu@correo.com"></label>
    <label class="field"><span>Contraseña</span><input id="p" type="password" autocomplete="${reg?'new-password':'current-password'}" placeholder="Mínimo 6 caracteres"></label>
    ${reg?'':'<button type="button" class="linkbtn" id="fg">¿Olvidaste tu contraseña?</button>'}
    <p class="note msg" id="m" hidden></p>
    <button class="btn" id="go">${reg?'Crear cuenta':'Entrar'}</button><div class="spacer"></div>
    <button class="btn sec" id="sw">${reg?'Ya tengo cuenta':'Crear cuenta nueva'}</button></div>`;
    $('#sw').onclick=()=>{reg=!reg;draw()};
    if($('#fg'))$('#fg').onclick=()=>forgotView(el,draw,$('#e').value.trim());
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

// ---- RESTABLECER CONTRASEÑA ----
// Se leen al cargar, antes de que supabase-js limpie la URL
let IS_RECOVERY=/type=recovery/.test(location.hash),LINK_ERR=/error_code=|error=access_denied/.test(location.hash);
const RESET_REDIRECT=location.origin+'/';
function forgotView(el,onBack,email=''){
  el.innerHTML=`<div class="card auth"><h2>Restablecer contraseña</h2>
  <p class="note">Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
  <label class="field"><span>Correo</span><input id="fe" type="email" autocomplete="email" value="${esc(email)}" placeholder="tu@correo.com"></label>
  <p class="note msg" id="fm" hidden></p>
  <button class="btn" id="fgo">Enviar enlace</button><div class="spacer"></div>
  <button class="btn sec" id="fback">Volver a iniciar sesión</button></div>`;
  $('#fback').onclick=onBack;
  $('#fgo').onclick=async()=>{
    const m=$('#fm'),e=$('#fe').value.trim();m.hidden=false;
    if(!e.includes('@')){m.textContent='Escribe un correo válido.';return;}
    m.textContent='Enviando…';$('#fgo').disabled=true;
    const {error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:RESET_REDIRECT});
    $('#fgo').disabled=false;
    m.textContent=error?(/rate|seconds|limit/i.test(error.message)?'Espera un minuto antes de pedir otro enlace.':error.message):'Si el correo está registrado, recibirás un enlace en unos minutos. Revisa también la carpeta de spam.';
  };
}
function recoveryView(el,done){
  el.innerHTML=`<div class="card auth"><h2>Nueva contraseña</h2>
  <p class="note">Elige una contraseña nueva para tu cuenta.</p>
  <label class="field"><span>Nueva contraseña</span><input id="np" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label>
  <label class="field"><span>Repite la contraseña</span><input id="np2" type="password" autocomplete="new-password" placeholder="Repite la contraseña"></label>
  <p class="note msg" id="rm" hidden></p>
  <button class="btn" id="rgo">Guardar contraseña</button></div>`;
  $('#rgo').onclick=async()=>{
    const m=$('#rm'),a=$('#np').value,b=$('#np2').value;m.hidden=false;
    if(a.length<6){m.textContent='La contraseña debe tener al menos 6 caracteres.';return;}
    if(a!==b){m.textContent='Las contraseñas no coinciden.';return;}
    m.textContent='Guardando…';$('#rgo').disabled=true;
    const {error}=await sb.auth.updateUser({password:a});
    if(error){$('#rgo').disabled=false;m.textContent=/session/i.test(error.message)?'El enlace expiró. Pide uno nuevo.':error.message;return;}
    m.textContent='Contraseña actualizada. Entrando…';setTimeout(done,1200);
  };
}
// Llamar al inicio de init(): si la página se abrió desde el enlace del correo, muestra el formulario
function authLink(el,done){
  if(!IS_RECOVERY&&!LINK_ERR)return false;
  $('#nav').innerHTML='';
  const clean=()=>{history.replaceState(null,'',location.pathname);IS_RECOVERY=false;LINK_ERR=false;};
  if(IS_RECOVERY)recoveryView(el,()=>{clean();done()});
  else{
    el.innerHTML=`<div class="card auth"><h2>Enlace no válido</h2><p class="note">El enlace expiró o ya fue usado. Pide uno nuevo para restablecer tu contraseña.</p>
    <button class="btn" id="nl">Pedir nuevo enlace</button></div>`;
    $('#nl').onclick=()=>{clean();forgotView(el,()=>authView(el,done))};
  }
  return true;
}
