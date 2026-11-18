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
// DISEÑO: hero centrado, tarjetas de servicio, bloque de confianza e iconos SVG
function home(){
  reset();
  const hello=ME?`Hola, ${esc((ME.full_name||'').split(' ')[0])}`:'Asistencia y cuidado para tu auto';
  const loginAction=ME?'':`<button class="home-login" onclick="login()"><span class="home-login-icon">${ico('user')}</span><span><b>¿Ya tienes una cuenta?</b><small>Inicia sesión para ver tus solicitudes</small></span><span class="home-login-arrow">${ico('chev')}</span></button>`;
  const svc=(k,cls,tag,title,desc)=>`<button class="big${cls}" onclick="go('${k}')"><span class="service-icon">${IC[k]}</span><span class="service-copy"><small>${tag}</small><b>${title}</b><span>${desc}</span></span><span class="service-arrow">${ico('chev')}</span></button>`;
  const trust=(i,t,d)=>`<li><span class="trust-ico">${ico(i)}</span><div><b>${t}</b><p>${d}</p></div></li>`;
  app().innerHTML=`<section class="welcome"><span class="eyebrow"><i></i> Servicio automotriz a domicilio</span><h1>${hello}</h1><p>¿Qué necesitas hoy? Estamos listos para ayudarte, estés donde estés.</p></section>
  <div class="service-heading"><h2>¿Cómo podemos ayudarte?</h2></div>
  <div class="grid">
    ${svc('emer',' emer','Asistencia inmediata','Emergencia en carretera','Grúa, batería, llanta y más. Te ayudamos ahora.')}
    ${svc('det','','Cuidado y limpieza','Detailing a domicilio','Lavado, limpieza profunda y protección para tu auto.')}
    ${svc('mec','','Mantenimiento y reparación','Mecánica a domicilio','Diagnóstico y reparación en el lugar que prefieras.')}
  </div>
  ${loginAction}
  <ul class="trust">${trust('shield','Precio antes de confirmar','Ves el precio referencial antes de pedir.')}${trust('home','Atención a domicilio','Vamos al lugar donde estés.')}${trust('cal','Agenda a tu medida','Elige día y hora para detailing y mecánica.')}</ul>`;
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
  // CAMBIO: la emergencia pide solo nombre y teléfono; el resto pide cuenta
  if(!ME&&S.br!=='emer')add('cuenta','Crea tu cuenta para recibir tu pedido','cuenta');
  if(!ME&&S.br==='emer')add('contacto','¿A nombre de quién te llamamos?','contacto');
  return o;
}
function price(){
  const a=S.a;if(S.br==='emer')return null;
  const s=SV.find(x=>x.id===a.servicio);if(!s||!s.price)return null;
  let p=s.price*VEH[a.vehiculo][1];if(a.pintura)p*=PIN[a.pintura];
  return Math.round(p)+DESP;
}
// DISEÑO: progreso, opciones como tarjetas, campos con etiqueta e iconos SVG
function draw(){
  const st=steps().find(s=>!(s.k in S.a));S.cur=st;
  const back=`<button class="back" onclick="back()">${ico('back')} ${S.ord.length?'Atrás':'Inicio'}</button>`;
  if(!st){app().innerHTML=back+summary();return;}
  const stepIcon={problema:'alert',heridos:'cross',vehiculo:'car',ubicacion:'pin',servicio:S.br==='det'?'det':'mec',pintura:'drop',sintoma:'info',descripcion:'note',cita:'cal',cuenta:'user',contacto:'user'}[st.k]||'det';
  const total=steps().length,pct=Math.round((S.ord.length+1)/total*100);
  const hint={opt:'Selecciona la opción que mejor describe lo que necesitas.',texto:'Cuéntanos con tus palabras lo que ocurre.',loc:'Escribe la dirección o usa tu ubicación actual.',cita:'Elige el día y el horario que prefieras.',cuenta:'Con tu cuenta podrás seguir el estado de tu pedido.',contacto:'Te llamaremos a este número.'}[st.t];
  let h=`${back}<div class="card flow-card"><div class="flow-progress"><span>Paso ${S.ord.length+1} de ${total}</span><div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div></div><div class="flow-title"><span class="flow-icon">${ico(stepIcon)}</span><div><span class="eyebrow">${S.br==='emer'?'Asistencia en carretera':S.br==='det'?'Detailing a domicilio':'Mecánica a domicilio'}</span><h2>${st.q}</h2><p>${hint}</p></div></div>`;
  if(st.note)h+=`<div class="alert">${ico('info')}<span>${st.note}</span></div>`;
  if(st.t==='opt')h+='<div class="opts">'+st.o.map((x,i)=>{const icons={bateria:'battery',llanta:'tire',choque:'cone',combustible:'fuel',otro:'box',si:'cross',no:'check',liviano:'car',suv:'suv',camioneta:'pickup',pesado:'truck',leve:'ok',moderada:'det',fuerte:'layers',chirrido:'sound',pedal:'down',vibra:'pulse',nada:'check'};const icon=icons[x[0]]||(S.br==='det'?'det':'mec');const p=x[1].split(' — '),pr=p.slice(1).join(' — ');return `<button class="opt" onclick="pick(${i})"><span class="opt-label"><i>${ico(icon)}</i><span>${esc(p[0])}</span></span>${pr?`<span class="opt-meta">${esc(pr)}</span>`:''}<span class="opt-arrow">${ico('chev')}</span></button>`}).join('')+'</div>';
  if(st.t==='texto')h+='<label class="field"><span>Descripción</span><textarea id="in" rows="3" placeholder="Cuéntanos qué ocurre"></textarea></label><button class="btn" onclick="txt()">Continuar</button>';
  if(st.t==='loc')h+=`<label class="field"><span>Dirección</span><input id="in" placeholder="Calle, número y referencia" value="${esc(S.lt)}"></label><button class="btn sec" onclick="geo()">${ico('pin')} Usar mi ubicación actual</button><div class="spacer"></div><button class="btn" onclick="loc()">Continuar</button>`;
  if(st.t==='cita')h+=citaHTML();
  if(st.t==='cuenta')h+='<label class="field"><span>Nombre completo</span><input id="cn" autocomplete="name" placeholder="Ej. María Pérez"></label><label class="field"><span>Teléfono / WhatsApp</span><input id="ct" inputmode="tel" autocomplete="tel" placeholder="Ej. 0999 999 999"></label><label class="field"><span>Correo</span><input id="ce" type="email" autocomplete="email" placeholder="tu@correo.com"></label><label class="field"><span>Contraseña</span><input id="cp" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label><button class="btn" onclick="cuentaOK()">Siguiente</button>';
  // CAMBIO: paso de contacto para emergencias sin cuenta
  if(st.t==='contacto')h+='<label class="field"><span>Nombre completo</span><input id="cn" autocomplete="name" placeholder="Ej. María Pérez"></label><label class="field"><span>Teléfono / WhatsApp</span><input id="ct" inputmode="tel" autocomplete="tel" placeholder="Ej. 0999 999 999"></label><button class="btn" onclick="contactoOK()">Siguiente</button>';
  app().innerHTML=h+'</div>';
}
function cuentaOK(){const n=$('#cn').value.trim(),t=$('#ct').value.trim(),e=$('#ce').value.trim(),p=$('#cp').value;if(!n||t.replace(/\D/g,'').length<7||!e.includes('@')||p.length<6)return alert('Revisa nombre, teléfono, correo y una contraseña de 6 caracteres');set('cuenta',{n,t,e,p},n)}
// CAMBIO: validación del contacto de emergencia
function contactoOK(){const n=$('#cn').value.trim(),t=$('#ct').value.trim();if(!n||t.replace(/\D/g,'').length<7)return alert('Escribe tu nombre y un teléfono válido');set('contacto',{n,t},n)}
function set(k,v,l){S.a[k]=v;S.l[k]=l;S.ord.push(k);draw();scrollTo(0,0)}
function pick(i){const x=S.cur.o[i];set(S.cur.k,x[0],x[1].split(' — ')[0])}
function txt(){const v=$('#in').value.trim();if(!v)return alert('Escribe una respuesta');set(S.cur.k,v,v)}
function back(){if(!S.ord.length)return home();const k=S.ord.pop();delete S.a[k];delete S.l[k];draw()}
function geo(){
  if(!navigator.geolocation)return alert('Tu navegador no permite obtener la ubicación.');
  navigator.geolocation.getCurrentPosition(p=>{S.co=[p.coords.latitude.toFixed(5),p.coords.longitude.toFixed(5)];$('#in').value='Ubicación GPS: '+S.co.join(', ')},()=>alert('No pudimos obtener tu ubicación. Escríbela manualmente.'));
}
function loc(){const t=$('#in').value.trim();if(!t)return alert('Escribe una dirección o usa tu ubicación');S.lt=t;set('ubicacion',{t,co:S.co},t)}
// DISEÑO: etiquetas visibles para fecha y horarios
function citaHTML(){
  const f=S.tf;
  let h=`<label class="field"><span>Fecha</span><input type="date" min="${today()}" value="${f}" onchange="setDate(this.value)"></label>`;
  if(!f)return h+'<p class="note">Elige una fecha para ver los horarios disponibles.</p>';
  return h+'<div class="field"><span>Horarios disponibles</span><div class="slots">'+HORAS.map(x=>{const t=new Date(`${f}T${x}:00-05:00`).getTime();const off=S.taken.includes(t)||t<Date.now();return `<button class="opt" ${off?'disabled':''} onclick="slot('${x}')">${x}</button>`}).join('')+'</div></div>';
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
  const rows=steps().filter(s=>!['cita','ubicacion','cuenta','contacto'].includes(s.k)).map(s=>[s.q,S.l[s.k]]);
  if(!e)rows.push(['Fecha y hora',S.l.cita]);
  rows.push(['Ubicación',a.ubicacion.t]);
  // CAMBIO: contacto según si hay cuenta, emergencia sin cuenta o registro nuevo
  let contacto;
  if(ME)contacto=(ME.full_name||'')+' · '+(ME.phone||'');
  else if(a.contacto)contacto=a.contacto.n+' · '+a.contacto.t;
  else contacto=a.cuenta.n+' · '+a.cuenta.t;
  rows.push(['Contacto',contacto]);
  const tot=p!=null?usd(p):e?CONFIG.GRUA_TXT:'Se cotiza en sitio';
  // DISEÑO: tabla limpia, total destacado y botón principal
  return `<div class="card"><p class="note">Último paso</p><h2>Revisa los detalles</h2>${rows.map(([k,v])=>`<div class="sum-row"><span class="note">${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}
  <div class="sum-row sum-total"><b>Total estimado</b><span class="total${p!=null?'':' txt'}">${esc(tot)}</span></div>
  <p class="note">El precio es referencial. Repuestos y trabajos adicionales se cotizan por separado.</p>
  <button class="btn ${e?'red':''}" onclick="confirmar()">${e?'Solicitar asistencia':'Confirmar cita'}</button></div>`;
}
async function confirmar(){
  const e=S.br==='emer';
  // CAMBIO: solo servicios normales crean cuenta; la emergencia va como invitado
  if(!ME&&!e){
    const c=S.a.cuenta;
    let r=await sb.auth.signUp({email:c.e,password:c.p,options:{data:{full_name:c.n,phone:c.t}}});
    if(r.error&&/already/i.test(r.error.message)) r={error:(await sb.auth.signInWithPassword({email:c.e,password:c.p})).error};
    else if(!r.error&&!r.data.session) r={error:(await sb.auth.signInWithPassword({email:c.e,password:c.p})).error||null};
    if(r.error) return alert('No pudimos crear tu cuenta: '+r.error.message);
    ME=await profile();
    if(!ME) return alert('Confirma tu correo para continuar. Revisa tu bandeja de entrada.');
  }
  const a=S.a,ref='AE-'+Math.random().toString(36).slice(2,7).toUpperCase();
  const details=Object.fromEntries(steps().filter(s=>!['cita','ubicacion','servicio','cuenta','contacto'].includes(s.k)).map(s=>[s.q,S.l[s.k]]));
  const {error}=await sb.from('orders').insert({ref,
    user_id:ME?ME.id:null,
    guest_name:ME?null:a.contacto.n,
    guest_phone:ME?null:a.contacto.t,
    branch:S.br,service:e?null:a.servicio,details,address:a.ubicacion.t,
    lat:a.ubicacion.co?a.ubicacion.co[0]:null,lng:a.ubicacion.co?a.ubicacion.co[1]:null,
    scheduled_at:e?null:new Date(`${a.cita.f}T${a.cita.h}:00-05:00`).toISOString(),price:price()});
  if(error){
    if(error.code==='23505'){alert('Ese horario se acaba de ocupar. Elige otro.');S.ord=S.ord.filter(k=>k!=='cita');delete S.a.cita;S.taken=[];setDate(S.tf);}
    else alert('No se pudo guardar el pedido: '+error.message);
    return;
  }
  const quien=ME?ME.full_name:a.contacto.n;
  const msg=`Hola, soy ${quien}. Hice el pedido ${ref} (${e?'emergencia':S.l.servicio}) en ${a.ubicacion.t}.`;
  // DISEÑO: pantalla de éxito con check animado, código de pedido y WhatsApp
  app().innerHTML=`<div class="card center"><svg class="check" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34"/><path d="M22 37l10 10 18-20"/></svg><h2>${e?'Recibimos tu solicitud':'¡Listo, tu cita está confirmada!'}</h2><p class="note">${e?'Te llamaremos en breve al número que nos diste.':'Te esperamos en la fecha y hora elegidas.'}</p><div class="ref-box"><span class="note">Código de pedido</span><b class="ref">${ref}</b></div><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}">${ico('chat')} Enviar mensaje por WhatsApp</a><button class="btn sec" onclick="home()">Volver al inicio</button></div>`;
  scrollTo(0,0);
}
async function orders(){
  if(!ME)return login();
  reset();
  const {data}=await sb.from('orders').select('*,services(name)').order('created_at',{ascending:false});
  const L=data||[];
  // DISEÑO: tarjetas de pedido con estado, fecha y dirección
  app().innerHTML=`<button class="back" onclick="home()">${ico('back')} Inicio</button><h2>Mis pedidos</h2>`+(L.map(o=>`<div class="card"><div class="sum-row"><b>${IC[o.branch]} ${esc(o.services?.name||'Emergencia')}</b><span class="badge ${o.status}">${ST[o.status]}</span></div><p class="meta">${ico('cal')}<span>${o.scheduled_at?'Cita: '+fdate(o.scheduled_at):'Pedido: '+fdate(o.created_at)}</span></p><p class="meta">${ico('pin')}<span>${esc(o.address)}</span></p></div>`).join('')||`<div class="card center"><h2>Aún no tienes pedidos</h2><p class="note">Cuando solicites un servicio, podrás seguir su estado aquí.</p><button class="btn" onclick="home()">Pedir un servicio</button></div>`);
}
init();
