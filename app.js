'use strict';
const $=id=>document.getElementById(id), KEY='santarosa_programaciones_v16_usuario_';
const today='2026-11-13';let date=today,turn='NOCHE',items=[],editing=null,records={};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x)||0, fmt=x=>n(x).toLocaleString('es-PE',{maximumFractionDigits:6}), id=()=>String(Date.now())+Math.random().toString(36).slice(2,8);
const key=()=>date+'|'+turn;
let srCurrentUserId=null;
let srCloudSeq=0;
const userStorageKey=()=>srCurrentUserId?KEY+srCurrentUserId:null;
// Cálculos verificados contra Libro3 (1).xlsx: D22=CEILING(H25*D21/M24,0.1); M25=L25*10; AD25=M25*D22.
const roundTenthUp=x=>Math.ceil((x-1e-10)*10)/10;
const tanks=(ha,moj,cap)=>n(cap)>0?roundTenthUp(n(ha)*n(moj)/n(cap)):0;
const otTanks=ot=>ot.cilindrosManual===true?n(ot.cilindros):tanks(ot.ha,ot.moj,ot.tanque||2000);
const roundCalc=x=>Math.round((x+Number.EPSILON)*1000000)/1000000;
// Dosis por hectárea: dosis base por 200 L × mojamiento L/Ha ÷ 200.
const haKg=(dose,moj)=>roundCalc(n(dose)*n(moj)/200);
// El tiempo de etiqueta se interpreta solo si es inequívoco: horas o días.
const normalizeProduct=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
const catalogIndex=new Map(PRODUCT_CATALOG.map(p=>[normalizeProduct(p.name),p]));
function reentryHours(value){
 const s=String(value||'').trim().replace(',','.');
 const m=s.match(/^(\d+(?:\.\d+)?)\s*(HRS?\.?|HORAS?|H|D[IÍ]AS?|D)\.?$/i);
 if(!m)return null;return Number(m[1])*( /^D/i.test(m[2])?24:1 );
}
function reentryForProduct(p){return String(p.reentry??'').trim()||'SIN DATO'}
// Solo presentación: un tiempo no informado se muestra como 0, sin cambiar los datos ni la validación.
function displayReentry(value){const s=String(value??'').trim();return !s||/^SIN\s+DATO$/i.test(s)?'0':s}
function generalReentry(products){
 const times=products.map(p=>reentryHours(reentryForProduct(p)));
 const missing=times.some(t=>t===null);const valid=times.filter(t=>t!==null);
 return {text:valid.length?`${Math.max(...valid)} Hrs`:'SIN DATO',missing};
}
function getEditorProducts(){return [...$('productRows').querySelectorAll('tr')].map(tr=>({name:tr.querySelector('[data-field="name"]').value,reentry:tr.querySelector('[data-field="reentry"]').value})).filter(p=>p.name.trim())}
function updateReentry(){
 const result=generalReentry(getEditorProducts());$('fReingreso').value=result.text;
 $('reentryWarning').textContent=result.missing?'⚠ Hay productos sin tiempo de reingreso válido. Verifica la etiqueta antes de autorizar el ingreso.':'';
}
function fillCatalog(input){
 const tr=input.closest('tr'),p=catalogIndex.get(normalizeProduct(input.value));
 if(p){input.value=p.name;tr.querySelector('[data-field="control"]').value=p.control;tr.querySelector('[data-field="reentry"]').value=p.reentry||'SIN DATO';}
 updateReentry();
}
function updateCalculations(){
 const ha=n($('fHa').value.trim().replace(',', '.')),moj=n($('fMoj').value),cap=n($('fTanque').value),auto=$('fAuto').checked;
 const manual=$('fCilindros').dataset.manual==='true';
 $('fCilindros').readOnly=!manual;
 const editBtn=$('editCilindros');
 editBtn.textContent=manual?'↩ Automático':'✎ Editar DOSIS.I';
 editBtn.title=manual?'Volver al cálculo automático':'Introducir manualmente DOSIS.I';
 if(!manual)$('fCilindros').value=cap>0?String(tanks(ha,moj,cap)):'';
 const qty=n($('fCilindros').value);
 for(const tr of $('productRows').querySelectorAll('tr')){
  const get=field=>tr.querySelector(`[data-field="${field}"]`);
  get('dose200').readOnly=auto;get('lt').readOnly=auto && tr.dataset.manualLt!=='true';get('haKg').readOnly=true;get('haKg').value=String(haKg(get('dose').value,moj));
  if(auto){get('dose200').value=cap>0?roundCalc(n(get('dose').value)*cap/200):'';if(tr.dataset.manualLt!=='true')get('lt').value=roundCalc(n(get('dose200').value)*qty)}
 }
}

const demo=[
 {stage:'FORMACIÓN',ot:'0176',cuartel:'4',ha:5.32,ddc:169,moj:800,fen:'OÍDIUM CICATRIZADO',reingreso:'24 Hrs',obs:'SE APLICARÁ LO PENDIENTE DE LA LÍNEA 35 AL 64',products:[{name:'ORIUS 430 SC',order:5,dose:.2,dose200:1,control:'Oídium',lt:4.4}]},
 {stage:'FORMACIÓN',ot:'0206',cuartel:'4',ha:5,ddc:169,moj:800,fen:'CIANAMIDA',reingreso:'24 Hrs',obs:'CIANAMIDA',products:[{name:'BLUE POINT',order:1,dose:.35,dose200:1.4,control:'Marcador de aspersiones',lt:7},{name:'FITOBROT',order:3,dose:10,dose200:40,control:'Regulador de crecimiento',lt:200},{name:'KEMPRO',order:2,dose:.001,dose200:0,control:'Regulador de crecimiento',lt:.02},{name:'PANTERA ADHIERE',order:4,dose:.1,dose200:.4,control:'Coadyuvante',lt:2}]},
 {stage:'POST-COSECHA',ot:'0218',cuartel:'22',ha:5.33,ddc:142,moj:1000,fen:'POST-COSECHA',reingreso:'24 Hrs',obs:'',products:[{name:'AGRIOIL 99 SL',order:5,dose:2,dose200:10,control:'Adherente',lt:54},{name:'CARBOXY MAX',order:6,dose:.4,dose200:2,control:'Fertilizante',lt:10.8}]},
 {stage:'PRODUCCIÓN',ot:'7596',cuartel:'28',ha:5.33,ddc:142,moj:800,fen:'LARVAS',reingreso:'4 Hrs',obs:'',products:[{name:'BTK-CROPS',order:1,dose:.5,dose200:2,control:'Gusano cogollero',lt:10.66}]}
].map(x=>({...x,uid:id(),conf:'PENDIENTE',inicio:'',termino:''}));
function read(){records={};const k=userStorageKey();if(!k)return;try{records=JSON.parse(localStorage.getItem(k)||'{}');if(!records||Array.isArray(records)||typeof records!=='object')records={}}catch{records={}}}
function persistUserCache(){const k=userStorageKey();if(k)localStorage.setItem(k,JSON.stringify(records))}
function load(){srCloudSeq++;items=[];render();if(window.srAuthReady)cloudLoad()}
function notify(msg){$('notice').textContent=msg;setTimeout(()=>{if($('notice').textContent===msg)$('notice').textContent=''},5000)}
async function save(){if(!window.srAuthReady||!srCurrentUserId)return alert('Inicia sesión para guardar.');const snapshot={date,turn,items:structuredClone(items),updated:new Date().toISOString()};try{const user=(await window.srClient.auth.getUser()).data.user;if(!user||user.id!==srCurrentUserId)throw Error('La sesión cambió. Inicia sesión nuevamente');const {error}=await window.srClient.from('programaciones_diarias').upsert({fecha:date,turno:turn,datos:{items:snapshot.items},creado_por:user.id,actualizado_en:new Date().toISOString()},{onConflict:'fecha,turno,creado_por'});if(error)throw error;records[key()]=snapshot;persistUserCache();notify('✓ Guardado en Supabase correctamente.')}catch(e){alert('No se guardó en Supabase: '+e.message)}}
function render(){
 const ordered=['FORMACIÓN','POST-COSECHA','PRODUCCIÓN','ORILLADO','TRASLAPES','PLANTACIÓN','VIA DRONE','OTROS'];
 let html='',totalLt=0,totalHa=0,totalDosisI=0;
 for(const stage of ordered){
  const group=items.filter(x=>x.stage===stage);
  if(!group.length)continue;
  let subLt=0,subHa=0,subDosisI=0;
  for(let otIndex=0;otIndex<group.length;otIndex++){
   const ot=group[otIndex];
   if(otIndex>0)html+=`<tr class="separador-ot" aria-hidden="true"><td colspan="23"><div class="separador-ot-espacio"></div></td></tr>`;
   const products=ot.products?.length?ot.products:[{name:'',order:'',dose:'',dose200:'',control:'',lt:0}];
   const span=products.length;
   const shared=(value,extra='')=>`<td rowspan="${span}" class="ot-unida ${extra}">${value}</td>`;
   const stageClass='stage-'+stage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
   const dosisI=otTanks(ot);
   const reingreso=generalReentry(products).text;
   subHa+=n(ot.ha);subDosisI+=dosisI;
   for(let j=0;j<span;j++){
    const p=products[j];subLt+=n(p.lt);
    const first=j===0;
    html+=`<tr class="product-line ${first?'inicio-ot':''}">`;
    if(first){
     html+=shared(esc(stage),'stage '+stageClass);
     html+=shared(`<b>${esc(ot.ot)}</b>`,'ot-numero');
     html+=shared(esc(ot.cuartel),'cuartel-numero');
    }
    html+=`<td>${esc(p.name)}</td><td>${esc(p.order)}</td><td>${esc(p.dose)}</td>`+
      `<td>${esc(p.dose200)}</td><td class="col-ha-kg">${fmt(haKg(p.dose,ot.moj))}</td><td>${esc(p.control)}</td>`+
      `<td>${esc(displayReentry(p.reentry))}</td>`;
    if(first){
     html+=shared(esc(ot.fen));
     html+=shared(esc(ot.ddc));
     html+=shared(esc(ot.moj));
     html+=shared(esc(turn));
     html+=shared(esc(displayReentry(reingreso)));
     html+=shared(esc(ot.inicio||'-'));
     html+=shared(esc(ot.termino||'-'));
     html+=shared(esc(ot.conf==='PARCIAL'?'PROGRAMADO':ot.conf),'confirmacion-estado '+({'CONFIRMADO':'confirmacion-confirmado','PENDIENTE':'confirmacion-pendiente','PROGRAMADO':'confirmacion-programado','NO APLICADO':'confirmacion-no-aplicado','PARCIAL':'confirmacion-programado'}[ot.conf]||''));
     html+=shared(esc(ot.obs));
    }
    html+=`<td class="col-lt">${fmt(p.lt)}</td>`;
    if(first){
     html+=shared(fmt(ot.ha),'col-ha');
     html+=shared(fmt(dosisI),'col-dosis-i');
     html+=shared(`<button data-edit="${esc(ot.uid)}">Editar</button><button data-del="${esc(ot.uid)}">Eliminar</button>`,'row-actions no-print col-acciones');
    }
    html+='</tr>';
   }
  }
  totalLt+=subLt;totalHa+=subHa;totalDosisI+=subDosisI;
  html+=`<tr class="subtotal"><td colspan="19">SUBTOTAL ${esc(stage)}</td><td>${fmt(subLt)}</td><td>${fmt(subHa)}</td><td class="col-dosis-i">${fmt(subDosisI)}</td><td class="no-print col-acciones"></td></tr>`;
 }
 if(!items.length)html='<tr class="no-data"><td colspan="23">Sin órdenes de trabajo. Pulsa «Agregar OT» para comenzar o carga los datos de ejemplo desde Inicio.</td></tr>';
 // Vista móvil: tarjetas por OT; la tabla original se conserva para PC y PDF.
 const mobile=document.getElementById('mobileOtCards');
 if(mobile){
  mobile.innerHTML=items.length?items.map(ot=>{
   const conf=ot.conf==='PARCIAL'?'PROGRAMADO':(ot.conf||'PENDIENTE');
   const cls=({'CONFIRMADO':'confirmacion-confirmado','PENDIENTE':'confirmacion-pendiente','PROGRAMADO':'confirmacion-programado','NO APLICADO':'confirmacion-no-aplicado'}[conf]||'');
   const stageCls='stage-'+String(ot.stage||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
   const prods=ot.products||[];
   return `<article class="mobile-ot-card"><div class="mobile-ot-head ${stageCls}"><strong>${esc(ot.stage)}</strong><span>OT ${esc(ot.ot)}</span></div>`+
    `<div class="mobile-ot-meta"><span>CUARTEL <b>${esc(ot.cuartel)}</b></span><span>ÁREA <b>${fmt(ot.ha)} Ha</b></span><span>DOSIS.I <b>${fmt(otTanks(ot))}</b></span></div>`+
    `<div class="mobile-ot-info"><span>Turno: <b>${esc(turn)}</b></span><span>Mojamiento: <b>${esc(ot.moj)} L/Ha</b></span><span>DDC: <b>${esc(ot.ddc)}</b></span><span>Reingreso: <b>${esc(displayReentry(generalReentry(prods).text))}</b></span></div>`+
    `<div class="mobile-ot-products"><strong>PRODUCTOS (${prods.length})</strong>${prods.map(x=>`<div class="mobile-product"><b>${esc(x.name)}</b><span>Dosis: ${esc(x.dose)} · LT: <b>${fmt(x.lt)}</b></span><small>${esc(x.control||'')}</small></div>`).join('')}</div>`+
    `<div class="mobile-ot-footer"><span class="mobile-confirm ${cls}">${esc(conf)}</span><div><button type="button" data-edit="${esc(ot.uid)}">Editar</button><button type="button" data-del="${esc(ot.uid)}">Eliminar</button></div></div></article>`;
  }).join(''):'<p class="mobile-empty">Sin órdenes. Pulsa Agregar OT para comenzar.</p>';
 }
 $('rows').innerHTML=html;
 $('foot').innerHTML=`<tr class="grand"><td colspan="19">TOTAL GENERAL</td><td>${fmt(totalLt)}</td><td>${fmt(totalHa)}</td><td class="col-dosis-i">${fmt(totalDosisI)}</td><td class="no-print col-acciones"></td></tr>`;
 const products=items.flatMap(x=>x.products||[]);
 $('statOt').textContent=items.length;
 $('statCuartel').textContent=new Set(items.map(x=>x.cuartel)).size;
 $('statProd').textContent=products.length;
 $('statMoj').textContent=(items.length?items.reduce((a,x)=>a+n(x.moj),0)/items.length:0).toFixed(2)+' L/Ha';
 $('statHa').textContent=fmt(totalHa)+' Ha';
 $('statVol').textContent=fmt(items.reduce((a,x)=>a+n(x.ha)*n(x.moj),0))+' L';
 $('stripOt').textContent='N° OT: '+(items.map(x=>x.ot).join(' - ')||'—');
 $('stripTurno').textContent='TURNO: '+turn;
 $('stripStatus').textContent='CONFIRMACIÓN: '+(items.length&&items.every(x=>x.conf==='CONFIRMADO')?'CONFIRMADO':'PENDIENTE');
 $('tableTitle').textContent=`PROGRAMACIÓN DE TURNO ${turn} - APLICACIONES`;
}
function productRow(p={}){
 const tr=document.createElement('tr');
 tr.dataset.manualLt=p.manualLt===true||p.manualLt==='true'?'true':'false';
 for(const [name,type] of [['name','text'],['order','number'],['dose','number'],['dose200','number'],['haKg','number'],['control','text'],['reentry','text'],['lt','number']]){
  const td=document.createElement('td'),input=document.createElement('input');
  input.type=type;input.dataset.field=name;input.value=p[name]??'';
  if(type==='number'){input.step='any';input.min='0'}
  input.setAttribute('aria-label',name);if(name==='name'){input.setAttribute('list','catalogoNombres');input.autocomplete='off';input.addEventListener('change',()=>fillCatalog(input));input.addEventListener('blur',()=>fillCatalog(input));}if(name==='reentry')input.placeholder='SIN DATO';td.append(input);
  if(name==='lt'){
   const edit=document.createElement('button');edit.type='button';edit.className='lt-edit';
   const refresh=()=>{edit.textContent=tr.dataset.manualLt==='true'?'↩ Automático':'✎ Editar LT';edit.title=tr.dataset.manualLt==='true'?'Volver al cálculo automático':'Introducir cantidad manual de LT';};
   edit.onclick=()=>{tr.dataset.manualLt=tr.dataset.manualLt==='true'?'false':'true';refresh();updateCalculations();if(tr.dataset.manualLt==='true')input.focus();};
   td.append(edit);refresh();
  }
  tr.append(td);
 }
 const td=document.createElement('td'),b=document.createElement('button');b.type='button';b.textContent='✕';b.title='Eliminar producto';b.onclick=()=>tr.remove();td.append(b);tr.append(td);
 $('productRows').append(tr);tr.addEventListener('input',()=>{updateCalculations();updateReentry()});updateCalculations();updateReentry();
}
function openEditor(uid=null){editing=uid;const x=items.find(z=>z.uid===uid)||{stage:'FORMACIÓN',ot:'',cuartel:'',ha:0,ddc:'',moj:800,tanque:2000,auto:true,fen:'',reingreso:'',inicio:'',termino:'',conf:'PENDIENTE',obs:'',products:[{}]};$('modalTitle').textContent=uid?'Editar OT '+x.ot:'Nueva orden de trabajo';for(const [field,val] of Object.entries({Etapa:x.stage,Ot:x.ot,Cuartel:x.cuartel,Ha:x.ha,Ddc:x.ddc,Moj:x.moj,Tanque:x.tanque||2000,Fen:x.fen,Reingreso:x.reingreso,Inicio:x.inicio,Termino:x.termino,Conf:x.conf,Obs:x.obs}))$('f'+field).value=field==='Conf'&&val==='PARCIAL'?'PROGRAMADO':(val??'');$('fAuto').checked=x.auto??false;$('fCilindros').dataset.manual=String(x.cilindrosManual===true);$('fCilindros').value=x.cilindrosManual===true?String(x.cilindros??0):'';$('productRows').innerHTML='';(x.products||[{}]).forEach(p=>{const match=catalogIndex.get(normalizeProduct(p.name));productRow({...p,control:p.control||match?.control||'',reentry:p.reentry||match?.reentry||'SIN DATO',manualLt:p.manualLt??(uid!==null && x.auto===false)});});updateCalculations();updateReentry();$('editor').showModal()}
function submit(e){e.preventDefault();const val=s=>$('f'+s).value.trim();if(!val('Ot')||!val('Cuartel'))return alert('Indica la OT y el cuartel.');updateCalculations();const products=[...$('productRows').querySelectorAll('tr')].map(tr=>{const p={};tr.querySelectorAll('input').forEach(input=>{if(input.dataset.field!=='haKg')p[input.dataset.field]=input.value});p.manualLt=tr.dataset.manualLt==='true';return p}).filter(p=>p.name.trim());if(!products.length)return alert('Agrega al menos un producto.');for(const p of products){const match=catalogIndex.get(normalizeProduct(p.name));if(match){p.name=match.name;if(!p.control)p.control=match.control;if(!p.reentry)p.reentry=match.reentry||'SIN DATO';}else if(!p.reentry)p.reentry='SIN DATO';}const resultReentry=generalReentry(products);if(resultReentry.missing&&!confirm('Hay productos sin tiempo de reingreso válido. ¿Guardar OT marcada para verificación?'))return;const x={uid:editing||id(),stage:val('Etapa'),ot:val('Ot'),cuartel:val('Cuartel'),ha:n(val('Ha').trim().replace(',', '.')),ddc:val('Ddc'),moj:n(val('Moj')),tanque:n(val('Tanque')),auto:$('fAuto').checked,cilindros:n(val('Cilindros')),cilindrosManual:$('fCilindros').dataset.manual==='true',fen:val('Fen'),reingreso:resultReentry.text,inicio:val('Inicio'),termino:val('Termino'),conf:val('Conf'),obs:val('Obs'),products};if(editing)items=items.map(z=>z.uid===editing?x:z);else items.push(x);$('editor').close();render();notify('OT actualizada en pantalla. Pulsa Guardar para conservar los cambios.')}
async function moveSavedDate(oldKey){
 if(!window.srAuthReady||!srCurrentUserId)return alert('Inicia sesión primero.');
 const original=records[oldKey];if(!original)return alert('Recarga el historial e inténtalo nuevamente.');
 const [oldDate,oldTurn]=oldKey.split('|');
 const newDate=prompt('Nueva fecha para esta programación (AAAA-MM-DD):',oldDate);
 if(newDate===null)return;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(newDate)||new Date(newDate+'T12:00:00').toISOString().slice(0,10)!==newDate)return alert('Fecha inválida. Utiliza AAAA-MM-DD.');
 if(newDate===oldDate)return notify('La fecha no cambió.');
 const userId=srCurrentUserId;
 try{
  const client=window.srClient;
  const {data:existing,error:checkError}=await client.from('programaciones_diarias').select('id').eq('fecha',newDate).eq('turno',oldTurn).eq('creado_por',userId).maybeSingle();
  if(checkError)throw checkError;
  if(existing)return alert('Ya tienes una programación en esa fecha y turno. No se reemplazará.');
  if(!confirm(`¿Mover la programación de ${oldDate} a ${newDate}, turno ${oldTurn}? Se conservarán todas sus OT y la fecha anterior dejará de aparecer.`))return;
  // UPDATE es atómico: cambia la fecha del mismo registro sin crear copias ni borrar datos.
  const {data:changed,error}=await client.from('programaciones_diarias').update({fecha:newDate,actualizado_en:new Date().toISOString()}).eq('fecha',oldDate).eq('turno',oldTurn).eq('creado_por',userId).select('id');
  if(error)throw error;
  if(userId!==srCurrentUserId)return;
  if(!changed||changed.length!==1)throw Error('No se encontró el registro original. Actualiza el historial.');
  delete records[oldKey];records[newDate+'|'+oldTurn]={...original,date:newDate,turn:oldTurn,updated:new Date().toISOString()};persistUserCache();
  if(date===oldDate&&turn===oldTurn){date=newDate;$('fecha').value=newDate;await cloudLoad();}
  await refreshOwnHistory();notify('✓ Programación trasladada a '+newDate+' sin perder las OT.');
 }catch(e){alert('No se pudo mover la programación: '+e.message+'\nEl registro original se mantiene si la operación no se completó.');}
}
async function refreshOwnHistory(){if(!window.srAuthReady||!srCurrentUserId)return;const userId=srCurrentUserId;const {data,error}=await window.srClient.from('programaciones_diarias').select('fecha,turno,datos,actualizado_en').eq('creado_por',userId).order('fecha',{ascending:false});if(error){notify('Error al cargar historial: '+error.message);return}if(userId!==srCurrentUserId)return;records={};for(const r of data||[]){records[r.fecha+'|'+r.turno]={date:r.fecha,turn:r.turn,items:r.datos?.items||[],updated:r.actualizado_en}}persistUserCache();switchView('historial')}
function switchView(view){document.querySelectorAll('.side button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('page-programaciones').hidden=view!=='programaciones';$('other').hidden=view==='programaciones';if(view==='programaciones')return;let html='';if(view==='historial'){const entries=Object.entries(records).sort((a,b)=>b[0].localeCompare(a[0]));html='<h2>Historial de programaciones</h2><p class="hint">Abre una fecha anterior para editarla, imprimirla o descargarla.</p><div class="history-wrap"><table class="history-table"><thead><tr><th>Fecha</th><th>Turno</th><th>Órdenes</th><th>Último guardado</th><th>Acciones</th></tr></thead><tbody>'+entries.map(([k,v])=>`<tr><td>${esc(v.date)}</td><td>${esc(v.turn)}</td><td>${v.items?.length||0}</td><td>${esc(new Date(v.updated).toLocaleString('es-PE'))}</td><td><button data-open="${esc(k)}">Abrir</button><button data-move="${esc(k)}">Cambiar fecha</button><button data-remove="${esc(k)}">Eliminar</button></td></tr>`).join('')+'</tbody></table></div>'+(entries.length?'':'<p>No hay programaciones guardadas todavía.</p>')}else if(view==='inicio'){html='<h2>Bienvenido a Fundo Santa Rosa</h2><p>Administra tus aplicaciones agrícolas por fecha, turno y orden de trabajo.</p><button class="blue" id="goSchedule">Abrir programación</button> <button id="loadDemo">Cargar ejemplo visual (4 OT)</button><p class="hint">El ejemplo es demostrativo; no corresponde a un registro operativo validado.</p>'}else if(view==='reportes'){html=`<h2>Reportes</h2><p class="metric">Programaciones guardadas: ${Object.keys(records).length}</p><p>Usa el botón Excel para descargar la programación seleccionada y Respaldo JSON para exportar todo tu historial.</p>`}else if(view==='productos'){const names=[...new Set(Object.values(records).flatMap(v=>(v.items||[]).flatMap(x=>(x.products||[]).map(p=>p.name))))].sort();html='<h2>Catálogo de productos</h2><p>'+PRODUCT_CATALOG.length+' productos del archivo PRODUCTOS.xlsx. Usa el buscador al agregar una OT.</p><p class="hint">Productos utilizados en programaciones: '+names.map(esc).join(' · ')+'</p>'}else if(view==='cuarteles'){const names=[...new Set(Object.values(records).flatMap(v=>(v.items||[]).map(x=>x.cuartel)))].sort();html='<h2>Cuarteles registrados</h2><p>'+names.map(esc).join(' · ')+'</p><p class="hint">Este catálogo se genera a partir de las programaciones guardadas.</p>'}else{html='<h2>Configuración y respaldos</h2><p>La versión 2 funciona sin servidor: los datos se guardan localmente en este navegador. Para compartir entre computadoras necesitaremos conectar Supabase y configurar autenticación.</p><button id="settingsBackup">Descargar respaldo completo</button>'}$('other').innerHTML=html;}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function exportCsv(){const cols=['Fecha','Turno','Etapa','OT','Cuartel','Producto','Orden mezcla','Dosis LT/KG','Dosis 200','HA/KG','Control','Reingreso producto','Estado fenológico','DDC','Mojamiento LT/Ha','Capacidad tanque L','Tanques calculados','DOSIS.I','Reingreso','Inicio aplicación','Término aplicación','Confirmación','Observación','LT','Ha'];const data=[cols,...items.flatMap(x=>(x.products||[]).map(p=>[date,turn,x.stage,x.ot,x.cuartel,p.name,p.order,p.dose,p.dose200,haKg(p.dose,x.moj),p.control,reentryForProduct(p),x.fen,x.ddc,x.moj,x.tanque||'',otTanks(x),otTanks(x),generalReentry(x.products||[]).text,x.inicio,x.termino,x.conf,x.obs,p.lt,x.ha]))];const csv='\ufeff'+data.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),`Programacion_${date}_${turn}.csv`);notify('Archivo CSV descargado: se abre con Excel.')}
function backup(){download(new Blob([JSON.stringify({version:2,records},null,2)],{type:'application/json'}),`Respaldo_Santa_Rosa_${new Date().toISOString().slice(0,10)}.json`)}
$('catalogoNombres').innerHTML=PRODUCT_CATALOG.map(p=>`<option value="${esc(p.name)}"></option>`).join('');
['fHa','fMoj','fTanque'].forEach(k=>$(k).addEventListener('input',updateCalculations));$('editCilindros').addEventListener('click',()=>{const manual=$('fCilindros').dataset.manual==='true';$('fCilindros').dataset.manual=String(!manual);updateCalculations();if(!manual)$('fCilindros').focus();});$('fAuto').addEventListener('input',updateCalculations);$('fCilindros').addEventListener('input',()=>{if($('fCilindros').dataset.manual==='true')updateCalculations()});$('fecha').value=date;$('turno').value=turn;read();load();
$('fecha').addEventListener('change',e=>{date=e.target.value;load()});$('turno').addEventListener('change',e=>{turn=e.target.value;load()});$('save').onclick=save;$('addOt').onclick=()=>openEditor();$('addProduct').onclick=()=>productRow();$('editForm').onsubmit=submit;$('closeModal').onclick=$('cancel').onclick=()=>$('editor').close();$('mobileOtCards').onclick=e=>{const b=e.target.closest('button');if(!b)return;const target=[...$('rows').querySelectorAll('button')].find(x=>b.dataset.edit&&x.dataset.edit===b.dataset.edit||b.dataset.del&&x.dataset.del===b.dataset.del);if(target)target.click()};$('rows').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)openEditor(b.dataset.edit);if(b.dataset.del&&confirm('¿Eliminar esta OT de la programación actual?')){items=items.filter(x=>x.uid!==b.dataset.del);render();notify('OT eliminada en pantalla. Pulsa Guardar para conservar el cambio.')}};$('new').onclick=$('sideNew').onclick=()=>{if(confirm('¿Crear una programación nueva en la fecha y turno seleccionados? Los cambios no guardados se perderán.')){items=[];render();switchView('programaciones');notify('Nueva programación en blanco.')}};$('print').onclick=$('pdf').onclick=()=>{switchView('programaciones');setTimeout(()=>window.print(),80)};$('excel').onclick=exportCsv;$('backup').onclick=backup;$('restore').onclick=()=>$('restoreFile').click();$('restoreFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const obj=JSON.parse(await file.text());if(obj.version!==2||!obj.records||typeof obj.records!=='object'||Array.isArray(obj.records))throw Error('Formato de respaldo no válido');if(!confirm('¿Importar el respaldo? Reemplazará todas las programaciones guardadas en este navegador.'))return;records=obj.records;persistUserCache();load();notify('Respaldo importado en caché privada. Guarda cada programación para subirla a Supabase.')}catch(err){alert('Error al importar: '+err.message)}e.target.value=''};$('history').onclick=()=>refreshOwnHistory();document.querySelectorAll('.side button[data-view]').forEach(b=>b.onclick=()=>b.dataset.view==='historial'?refreshOwnHistory():switchView(b.dataset.view));$('other').onclick=async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.move){moveSavedDate(b.dataset.move);return;}if(b.dataset.open){const v=records[b.dataset.open];if(!v)return;date=v.date;turn=v.turn;$('fecha').value=date;$('turno').value=turn;load();switchView('programaciones')}if(b.dataset.remove&&confirm('¿Eliminar esta programación de tu cuenta en Supabase?')){const [f,t]=b.dataset.remove.split('|');const uid=srCurrentUserId;const {error}=await window.srClient.from('programaciones_diarias').delete().eq('fecha',f).eq('turno',t).eq('creado_por',uid);if(error){alert('No se pudo eliminar: '+error.message)}else if(uid===srCurrentUserId){delete records[b.dataset.remove];persistUserCache();await refreshOwnHistory()}}if(b.id==='goSchedule')switchView('programaciones');if(b.id==='loadDemo'){if(!confirm('¿Cargar cuatro OT de ejemplo en la programación actual? No se guardarán hasta pulsar Guardar.'))return;items=structuredClone(demo);render();switchView('programaciones')}if(b.id==='settingsBackup')backup()};

// V15: Autenticación y sincronización de programaciones en Supabase.
const SR_URL='https://sokrhqmljarvolmcfuvg.supabase.co';
const SR_KEY='sb_publishable_IvPVZaVJv81iBMhtbcsm7g_GiVKitPH';
window.srAuthReady=false;
window.srClient=window.supabase.createClient(SR_URL,SR_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
async function cloudLoad(){
 if(!window.srAuthReady||!srCurrentUserId)return;const seq=++srCloudSeq, wanted=key(), userId=srCurrentUserId;
 const {data,error}=await window.srClient.from('programaciones_diarias').select('fecha,turno,datos,actualizado_en').eq('fecha',date).eq('turno',turn).eq('creado_por',userId).maybeSingle();
 if(seq!==srCloudSeq||wanted!==key()||userId!==srCurrentUserId)return;
 if(error){notify('No se pudo consultar Supabase: '+error.message);return}
 items=structuredClone(data?.datos?.items||[]);render();
 if(data){records[wanted]={date,turn,items:structuredClone(items),updated:data.actualizado_en};persistUserCache()}else{delete records[wanted];persistUserCache()}
}
function srShowAuth(show){document.getElementById('sr-login').hidden=!show;document.getElementById('sr-logout').hidden=show;document.getElementById('sr-account').hidden=show;document.body.classList.toggle('sr-locked',show)}
async function srSession(session){
 const previousUser=srCurrentUserId;srCurrentUserId=session?.user?.id||null;const changed=previousUser!==srCurrentUserId;window.srAuthReady=!!srCurrentUserId;
 srShowAuth(!window.srAuthReady);
 document.getElementById('sr-account').textContent=session?.user?.email||'';
 if(window.srAuthReady){if(changed){srCloudSeq++;read();items=[];render();await cloudLoad()}}
 else{srCloudSeq++;records={};items=[];render()}
}
document.getElementById('sr-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const b=document.getElementById('sr-login-submit'),status=document.getElementById('sr-login-status');
 b.disabled=true;status.textContent='Verificando usuario...';
 try{const email=document.getElementById('sr-email').value.trim(),password=document.getElementById('sr-password').value;const {data,error}=await window.srClient.auth.signInWithPassword({email,password});if(error)throw error;document.getElementById('sr-password').value='';status.textContent='';await srSession(data.session)}
 catch(err){status.textContent='No se pudo iniciar sesión: '+err.message}
 finally{b.disabled=false}
});
document.getElementById('sr-logout').addEventListener('click',async()=>{await window.srClient.auth.signOut();await srSession(null)});
window.srClient.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>srSession(session),0)});
window.srClient.auth.getSession().then(({data})=>srSession(data.session)).catch(e=>{document.getElementById('sr-login-status').textContent=e.message;srShowAuth(true)});


/* V20: conservar exactamente los rowspan del diseño al imprimir.
   La V19 convertía celdas combinadas en casilleros vacíos y deformaba la tabla. */
let srPrintTable=null;
function srClearPrintTable(){
 document.body.classList.remove('sr-print-lt-fix');
 if(srPrintTable){srPrintTable.remove();srPrintTable=null;}
}
function srPreparePrintTable(){
 srClearPrintTable();
 const original=document.getElementById('schedule');
 if(!original)return;
 const clone=original.cloneNode(true);
 clone.id='schedule-print';
 // Mantener rowspan y colspan intactos: LT sigue siendo una celda por producto.
 original.parentElement.appendChild(clone);
 srPrintTable=clone;
 document.body.classList.add('sr-print-lt-fix');
}
window.addEventListener('beforeprint',srPreparePrintTable);
window.addEventListener('afterprint',srClearPrintTable);
