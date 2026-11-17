let ME,ORD=[],SV=[],F={b:'',s:'act'},TAB='ord';
const app=()=>$('#app');
const act=o=>!['completado','cancelado'].includes(o.status);
async function init(){
  ME=await profile();
  if(!ME){$('#nav').innerHTML='';authView(app(),init);return;}
  if(ME.role==='client'){app().innerHTML='<div class="card"><h2>Sin acceso</h2><p>Esta cuenta no pertenece al equipo.</p><a class="btn sec" href="index.html">Ir a la página de clientes</a></div>';return;}
  $('#nav').innerHTML='<a href="index.html">Vista cliente</a><a onclick="logout()">Salir</a>';
  await load();
  sb.channel('o').on('postgres_changes',{event:'*',schema:'public',table:'orders'},load).subscribe();
}
async function load(){
  const [o,s]=await Promise.all([sb.from('orders').select('*,profiles(full_name,phone),services(name)'),sb.from('services').select('*').order('branch').order('name')]);
  ORD=o.data||[];SV=s.data||[];draw();
}
const tab=t=>{TAB=t;draw()};
function draw(){
  const nuevos=ORD.filter(o=>o.status==='nuevo').length,em=ORD.filter(o=>o.branch==='emer'&&act(o)).length,hoy=ORD.filter(o=>act(o)&&o.scheduled_at&&day(o.scheduled_at)===today()).length;
  app().innerHTML=`<div class="stats"><div><b>${nuevos}</b>Nuevos</div><div><b>${em}</b>Emergencias activas</div><div><b>${hoy}</b>Citas hoy</div></div>
  <div class="tabs"><button class="${TAB==='ord'?'on':''}" onclick="tab('ord')">Pedidos</button><button class="${TAB==='pr'?'on':''}" onclick="tab('pr')">Servicios y precios</button></div>`+(TAB==='ord'?ordHTML():priceHTML());
}
function ordHTML(){
  const L=ORD.filter(o=>(!F.b||o.branch===F.b)&&(F.s==='act'?act(o):F.s==='all'||o.status===F.s));
  const urg=o=>o.branch==='emer'&&o.status==='nuevo';
  L.sort((a,b)=>urg(b)-urg(a)||new Date(a.scheduled_at||a.created_at)-new Date(b.scheduled_at||b.created_at));
  const sel=(k,opts)=>`<select onchange="F.${k}=this.value;draw()">`+opts.map(([v,l])=>`<option value="${v}" ${F[k]===v?'selected':''}>${l}</option>`).join('')+'</select>';
  return `<div class="row">${sel('b',[['','Todos los servicios'],['emer','Emergencia'],['det','Detailing'],['mec','Mecánica']])}${sel('s',[['act','Activos'],['all','Todos'],...Object.entries(ST)])}</div><div class="spacer"></div>`+
  (L.map(o=>{
    const c=o.profiles||{},map=o.lat?`https://www.google.com/maps?q=${o.lat},${o.lng}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`;
    return `<div class="card ${urg(o)?'urg':''}">
    <div class="sum-row"><b>${IC[o.branch]} ${esc(o.services?.name||'Emergencia')}</b><span class="badge ${o.status}">${o.ref}</span></div>
    <p class="note">${o.scheduled_at?'Cita: '+fdate(o.scheduled_at):'Pedido: '+fdate(o.created_at)}</p>
    <div>${esc(c.full_name)} · ${esc(c.phone)}</div><p class="note">📍 ${esc(o.address)}</p>
    <p class="note">${Object.entries(o.details||{}).map(([k,v])=>esc(k)+': '+esc(v)).join('<br>')}</p>
    <div class="row"><select onchange="upd('${o.id}',{status:this.value})">${Object.entries(ST).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select>
    <input type="number" step="0.5" placeholder="Precio final $" value="${o.price??''}" onchange="upd('${o.id}',{price:this.value===''?null:+this.value})"></div>
    <div class="row"><a class="btn sec" target="_blank" rel="noopener" href="${map}">📍 Abrir mapa</a><a class="btn sec" target="_blank" rel="noopener" href="https://wa.me/${wa(c.phone)}">WhatsApp</a></div></div>`}).join('')||'<p class="note">No hay pedidos con este filtro.</p>');
}
async function upd(id,p){const {error}=await sb.from('orders').update(p).eq('id',id);if(error)alert(error.message);load()}
function priceHTML(){
  return '<div class="card"><h2>Servicios y precios</h2>'+SV.map(s=>`<div class="row sv"><span>${IC[s.branch]} ${esc(s.name)}</span><input type="number" step="0.5" value="${s.price}" onchange="svu('${s.id}',{price:+this.value})"><label><input type="checkbox" ${s.active?'checked':''} style="width:auto" onchange="svu('${s.id}',{active:this.checked})"> Activo</label></div>`).join('')+
  `</div><div class="card"><h2>Agregar servicio</h2><select id="nb"><option value="det">Detailing</option><option value="mec">Mecánica</option></select><input id="nn" placeholder="Nombre del servicio"><input id="np" type="number" placeholder="Precio $"><button class="btn" onclick="addSv()">Agregar servicio</button></div>`;
}
async function svu(id,p){const {error}=await sb.from('services').update(p).eq('id',id);if(error)alert(error.message)}
async function addSv(){
  const n=$('#nn').value.trim(),b=$('#nb').value;if(!n)return alert('Escribe el nombre');
  const id=b+'_'+n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').slice(0,24);
  const {error}=await sb.from('services').insert({id,branch:b,name:n,price:+$('#np').value||0});
  if(error)return alert(error.message);load();
}
init();
