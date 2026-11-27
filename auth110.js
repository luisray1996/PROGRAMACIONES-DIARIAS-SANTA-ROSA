let srSession110=null;
function srScope110(){return srSession110?.username==='ADMIN'?document.getElementById('srOwner').value:srSession110?.username;}
function srSecure(q){return {...q,token:srSession110?.token,owner:srScope110()};}
async function srRequest110(q){const r=await fetch(SR_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(q)});const j=await r.json();if(j.error)throw Error(j.error.message);return j.data;}
window.addEventListener('DOMContentLoaded',()=>{
 const el=id=>document.getElementById(id), form=el('srLoginForm');
 form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;try{const session=await srRequest110({op:'login',username:el('srName').value,password:el('srPass').value});if(!session?.token||!session?.username)throw Error('Actualiza Apps Script a V110');srSession110=session;el('srPass').value='';el('srIdentity').textContent=session.username;el('srOwner').hidden=session.username!=='ADMIN';el('srOwner').value=session.username==='ADMIN'?'ADMIN':'DIGITADOR1';el('srLogin').hidden=true;document.body.classList.remove('sr-locked');window.srStart110();}catch(err){el('srLoginStatus').textContent=err.message;}finally{b.disabled=false;}};
 el('srOwner').onchange=()=>{if(!confirm('Cambiar de usuario. Se perderán los cambios sin guardar.')){el('srOwner').value=srCurrentUserId;return;}document.querySelectorAll('dialog[open]').forEach(d=>d.close());switchView('programaciones');window.srStart110();};
 el('srLogout').onclick=async()=>{try{await srRequest110(srSecure({op:'logout'}));}finally{location.reload();}};
});
