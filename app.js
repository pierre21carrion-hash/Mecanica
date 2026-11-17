const HORAS=['08:00','09:30','11:00','14:00','15:30','17:00'];
const VEH={liviano:['Auto liviano',1],suv:['SUV',1.3],camioneta:['Camioneta 4x4',1.4],pesado:['Camión / bus',1]};
const PIN={leve:1,moderada:1.25,fuerte:1.6},DESP=5;
let ME,SV=[],S;
const app=()=>$('#app');
const reset=()=>{S={br:null,a:{},l:{},ord:[],tf:'',taken:[],co:null,cur:null,lt:''}};

async function init(){
  ME=await profile();
  $('#nav').innerHTML=ME?'<a onclick="home()">Inicio</a><a onclick="orders()">Mis pedidos</a>'+(ME.role!=='client'?'<a href="admin.html">Panel</a>':'')+'<a onclick="logout()">Salir</a>':'<a onclick="login()">Iniciar sesión</a>';
  const {data}=await sb.from('services').select('*').eq('active',true).order('price');
  SV=data||[];home();
}
function home(){
  reset();
  const hello=ME?`Hola, ${esc((ME.full_name||'').split(' ')[0])}`:'Asistencia y cuidado para tu auto';
  const loginAction=ME?'':`<button class="home-login" onclick="login()"><span class="home-login-icon">👤</span><span><b>¿Ya tienes una cuenta?</b><small>Inicia sesión para ver tus solicitudes</small></span><span class="home-login-arrow">›</span></button>`;
  app().innerHTML=`<section class="welcome">
    <div class="welcome-copy"><span class="eyebrow"><i></i> SERVICIO AUTOMOTRIZ A DOMICILIO</span><h1>${hello}</h1><p>¿Qué necesitas hoy?</p><div class="welcome-rule"></div><span class="welcome-detail">Estamos listos para ayudarte, estés donde estés.</span></div>
    <div class="welcome-mark" aria-hidden="true"><span>🚘</span><i>✦</i></div>
  </section>
  <div class="service-heading"><div><span class="eyebrow">ELIGE UNA OPCIÓN</span><h2>¿Cómo podemos ayudarte?</h2></div><span class="service-count">01 <i>/</i> 03</span></div>
  ${loginAction}
  <div class="grid">
    <button class="big emer" onclick="go('emer')"><span class="service-icon">🆘</span><span class="service-copy"><small>ASISTENCIA INMEDIATA</small><b>Emergencia en carretera</b><span>Grúa, batería, llanta y más. Te ayudamos ahora.</span></span><span class="service-arrow">↗</span></button>
    <button class="big" onclick="go('det')"><span class="service-icon">✨</span><span class="service-copy"><small>CUIDADO Y LIMPIEZA</small><b>Detailing a domicilio</b><span>Lavado, limpieza profunda y protección para tu auto.</span></span><span class="service-arrow">↗</span></button>
    <button class="big" onclick="go('mec')"><span class="service-icon">🔧</span><span class="service-copy"><small>MANTENIMIENTO Y REPARACIÓN</small><b>Mecánica a domicilio</b><span>Diagnóstico y reparación en el lugar que prefieras.</span></span><span class="service-arrow">↗</span></button>
  </div>
  <p class="home-footnote"><span>🛡️</span> Atención confiable, con precios referenciales antes de confirmar.</p>`;
}
function login(){authView(app(),init)}
const go=b=>{reset();S.br=b;draw();scrollTo(0,0)};

function steps(){
  const a=S.a,o=[],add=(k,q,t,x)=>o.push({k,q,t,...x});
  const veh=all=>Object.entries(VEH).filter(([k])=>all||k!=='pesado').map(([k,v])=>[k,v[0]]);
  if(S.br==='emer'){
    add('problema','¿Qué le ocurre a tu vehículo?','opt',{o:[['bateria','No arranca / batería'],['llanta','Llanta ponchada'],['choque','Choque o accidente'],['combustible','Sin combustible'],['otro','Otra emergencia']]});
    if(a.problema==='choque')add('heridos','¿Hay personas heridas?','opt',{o:[['si','Sí'],['no','No']],note:'Si hay heridos, llama primero al 911.'});
    add('vehiculo','Tipo de vehículo','opt',{o:veh(true)});
    add('ubicacion','¿Dónde se encuentra el vehículo?','loc');
  }else{
    add('servicio','¿Qué servicio necesitas?','opt',{o:SV.filter(s=>s.branch===S.br).map(s=>[s.id,s.name+(s.price?' — '+usd(s.price):'')])});
    if(/pulido|ceramico/.test(a.servicio||''))add('pintura','¿Cómo está la pintura?','opt',{o:[['leve','Buen estado'],['moderada','Rayones finos'],['fuerte','Oxidación o rayones profundos']]});
    if(a.servicio==='mec_frenos')add('sintoma','¿Qué notas en los frenos?','opt',{o:[['chirrido','Chirrido al frenar'],['pedal','Pedal blando'],['vibra','Vibración al frenar'],['nada','Revisión preventiva']]});
    if(a.servicio==='mec_otro')add('descripcion','Describe el problema','texto');
    add('vehiculo','Tipo de vehículo','opt',{o:veh(false)});
    add('cita','¿Qué día y hora te convienen?','cita');
    add('ubicacion','¿Dónde realizamos el servicio?','loc');
  }
  if(!ME)add('cuenta','Crea tu cuenta para recibir tu pedido','cuenta');
  return o;
}
function price(){
  const a=S.a;if(S.br==='emer')return null;
  const s=SV.find(x=>x.id===a.servicio);if(!s||!s.price)return null;
  let p=s.price*VEH[a.vehiculo][1];if(a.pintura)p*=PIN[a.pintura];
  return Math.round(p)+DESP;
}
function draw(){
  const st=steps().find(s=>!(s.k in S.a));S.cur=st;
  const back=`<button class="back" onclick="back()">← ${S.ord.length?'Atrás':'Inicio'}</button>`;
  if(!st){app().innerHTML=back+summary();return;}
  const stepIcon={problema:'🚨',heridos:'🩺',vehiculo:'🚘',ubicacion:'📍',servicio:S.br==='det'?'✨':'🔧',pintura:'🎨',sintoma:'🛑',descripcion:'📝',cita:'🗓️',cuenta:'👤'}[st.k]||'✦';
  let h=`${back}<div class="card flow-card"><div class="flow-progress"><span>PASO ${String(S.ord.length+1).padStart(2,'0')}</span><span>DE ${String(steps().length).padStart(2,'0')}</span><div><i style="width:${Math.round(S.ord.length/steps().length*100)}%"></i></div></div><div class="flow-title"><span class="flow-icon">${stepIcon}</span><div><span class="eyebrow">${S.br==='emer'?'ASISTENCIA EN CARRETERA':S.br==='det'?'DETAILING A DOMICILIO':'MECÁNICA A DOMICILIO'}</span><h2>${st.q}</h2><p>Selecciona la opción que mejor describe lo que necesitas.</p></div></div>`;
  if(st.note)h+=`<div class="alert">${st.note}</div>`;
  if(st.t==='opt')h+='<div class="opts">'+st.o.map((x,i)=>{const icons={bateria:'🔋',llanta:'🛞',choque:'🚧',combustible:'⛽',otro:'🧰',si:'🩹',no:'✅',liviano:'🚗',suv:'🚙',camioneta:'🛻',pesado:'🚚',leve:'✨',moderada:'🪄',fuerte:'🧽',chirrido:'🔊',pedal:'🦶',vibra:'〰️',nada:'✅'};const icon=icons[x[0]]||(S.br==='det'?'✨':'🔧');return `<button class="opt" onclick="pick(${i})"><span class="opt-label"><i>${icon}</i><span>${esc(x[1])}</span></span><span class="opt-arrow">›</span></button>`}).join('')+'</div>';
  if(st.t==='texto')h+='<textarea id="in" rows="3" placeholder="Cuéntanos qué ocurre"></textarea><button class="btn" onclick="txt()">Continuar</button>';
  if(st.t==='loc')h+=`<input id="in" placeholder="Calle, número y referencia" value="${esc(S.lt)}"><button class="btn sec" onclick="geo()">📍 Usar mi ubicación actual</button><div class="spacer"></div><button class="btn" onclick="loc()">Continuar</button>`;
  if(st.t==='cita')h+=citaHTML();
  if(st.t==='cuenta')h+='<input id="cn" placeholder="Nombre completo"><input id="ct" placeholder="Teléfono / WhatsApp" inputmode="tel"><input id="ce" type="email" placeholder="Correo"><input id="cp" type="password" placeholder="Contraseña (mínimo 6 caracteres)"><button class="btn" onclick="cuentaOK()">Siguiente</button>';
  app().innerHTML=h+'</div>';
}
function cuentaOK(){const n=$('#cn').value.trim(),t=$('#ct').value.trim(),e=$('#ce').value.trim(),p=$('#cp').value;if(!n||t.replace(/\D/g,'').length<7||!e.includes('@')||p.length<6)return alert('Revisa nombre, teléfono, correo y una contraseña de 6 caracteres');set('cuenta',{n,t,e,p},n)}
function set(k,v,l){S.a[k]=v;S.l[k]=l;S.ord.push(k);draw();scrollTo(0,0)}
function pick(i){const x=S.cur.o[i];set(S.cur.k,x[0],x[1].split(' — ')[0])}
function txt(){const v=$('#in').value.trim();if(!v)return alert('Escribe una respuesta');set(S.cur.k,v,v)}
function back(){if(!S.ord.length)return home();const k=S.ord.pop();delete S.a[k];delete S.l[k];draw()}
function geo(){
  if(!navigator.geolocation)return alert('Tu navegador no permite obtener la ubicación.');
  navigator.geolocation.getCurrentPosition(p=>{S.co=[p.coords.latitude.toFixed(5),p.coords.longitude.toFixed(5)];$('#in').value='Ubicación GPS: '+S.co.join(', ')},()=>alert('No pudimos obtener tu ubicación. Escríbela manualmente.'));
}
function loc(){const t=$('#in').value.trim();if(!t)return alert('Escribe una dirección o usa tu ubicación');S.lt=t;set('ubicacion',{t,co:S.co},t)}
function citaHTML(){
  const f=S.tf;
  let h=`<input type="date" min="${today()}" value="${f}" onchange="setDate(this.value)">`;
  if(!f)return h+'<p class="note">Elige una fecha para ver los horarios disponibles.</p>';
  return h+'<div class="slots">'+HORAS.map(x=>{const t=new Date(`${f}T${x}:00-05:00`).getTime();const off=S.taken.includes(t)||t<Date.now();return `<button class="opt" ${off?'disabled':''} onclick="slot('${x}')">${x}</button>`}).join('')+'</div>';
}
async function setDate(f){
  S.tf=f;S.taken=[];draw();if(!f)return;
  const a=new Date(f+'T00:00:00-05:00'),b=new Date(a.getTime()+864e5);
  const {data}=await sb.rpc('taken_slots',{a:a.toISOString(),b:b.toISOString()});
  S.taken=(data||[]).map(x=>new Date(x).getTime());draw();
}
const slot=h=>set('cita',{f:S.tf,h},S.tf+' a las '+h);

function summary(){
  const a=S.a,e=S.br==='emer',p=price();
  const rows=steps().filter(s=>!['cita','ubicacion','cuenta'].includes(s.k)).map(s=>[s.q,S.l[s.k]]);
  if(!e)rows.push(['Fecha y hora',S.l.cita]);
  rows.push(['Ubicación',a.ubicacion.t],['Contacto',ME?(ME.full_name||'')+' · '+(ME.phone||''):a.cuenta.n+' · '+a.cuenta.t]);
  const tot=p!=null?usd(p):e?CONFIG.GRUA_TXT:'Se cotiza en sitio';
  return `<div class="card"><p class="note">Último paso</p><h2>Revisa los detalles</h2>${rows.map(([k,v])=>`<div class="sum-row"><span class="note">${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}
  <div class="sum-row"><b>Total estimado</b><span class="total">${esc(tot)}</span></div>
  <p class="note">El precio es referencial. Repuestos y trabajos adicionales se cotizan por separado.</p>
  <button class="btn ${e?'red':''}" onclick="confirmar()">${e?'Solicitar asistencia':'Confirmar cita'}</button></div>`;
}
async function confirmar(){
  if(!ME){
    const c=S.a.cuenta;
    let r=await sb.auth.signUp({email:c.e,password:c.p,options:{data:{full_name:c.n,phone:c.t}}});
    if(r.error&&/already/i.test(r.error.message)) r={error:(await sb.auth.signInWithPassword({email:c.e,password:c.p})).error};
    else if(!r.error&&!r.data.session) r={error:(await sb.auth.signInWithPassword({email:c.e,password:c.p})).error||null};
    if(r.error) return alert('No pudimos crear tu cuenta: '+r.error.message);
    ME=await profile();
    if(!ME) return alert('Confirma tu correo para continuar. Revisa tu bandeja de entrada.');
  }
  const a=S.a,e=S.br==='emer',ref='AE-'+Math.random().toString(36).slice(2,7).toUpperCase();
  const details=Object.fromEntries(steps().filter(s=>!['cita','ubicacion','servicio','cuenta'].includes(s.k)).map(s=>[s.q,S.l[s.k]]));
  const {error}=await sb.from('orders').insert({ref,user_id:ME.id,branch:S.br,service:e?null:a.servicio,details,address:a.ubicacion.t,
    lat:a.ubicacion.co?a.ubicacion.co[0]:null,lng:a.ubicacion.co?a.ubicacion.co[1]:null,
    scheduled_at:e?null:new Date(`${a.cita.f}T${a.cita.h}:00-05:00`).toISOString(),price:price()});
  if(error){
    if(error.code==='23505'){alert('Ese horario se acaba de ocupar. Elige otro.');S.ord=S.ord.filter(k=>k!=='cita');delete S.a.cita;S.taken=[];setDate(S.tf);}
    else alert('No se pudo guardar el pedido: '+error.message);
    return;
  }
  const msg=`Hola, soy ${ME.full_name}. Hice el pedido ${ref} (${e?'emergencia':S.l.servicio}) en ${a.ubicacion.t}.`;
  app().innerHTML=`<div class="card"><h2>${e?'Solicitud enviada':'Cita agendada'}</h2><p>Código: <b>${ref}</b></p>
  <p class="note">${e?'Te contactaremos de inmediato para confirmar el tiempo de llegada.':S.l.cita+'. Te escribiremos para confirmar.'}</p>
  <a class="btn" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}">Escribir por WhatsApp</a><div class="spacer"></div>
  <button class="btn sec" onclick="orders()">Ver mis solicitudes</button></div>`;
}
async function orders(){
  const {data}=await sb.from('orders').select('*,services(name)').order('created_at',{ascending:false});
  app().innerHTML='<button class="back" onclick="home()">← Inicio</button><h2>Mis solicitudes</h2>'+((data||[]).map(o=>`<div class="card">
  <div class="sum-row"><b>${IC[o.branch]} ${esc(o.services?.name||'Emergencia')}</b><span class="badge ${o.status}">${ST[o.status]}</span></div>
  <p class="note">${o.ref} · ${fdate(o.scheduled_at||o.created_at)}</p>${o.price!=null?`<div>${usd(o.price)}</div>`:''}
  ${o.status==='nuevo'?`<div class="spacer"></div><button class="btn sec" onclick="cancelar('${o.id}')">Cancelar solicitud</button>`:''}</div>`).join('')||'<p class="note">Aún no tienes solicitudes. Cuando hagas una, aparecerá aquí.</p>');
}
async function cancelar(id){if(!confirm('¿Cancelar este pedido?'))return;await sb.from('orders').update({status:'cancelado'}).eq('id',id);orders()}
init();
