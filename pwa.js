(()=>{
 const button=document.getElementById('installSanta'); let prompt=null;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
 const refresh=()=>{button.hidden=standalone();}; refresh();
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;refresh();});
 window.addEventListener('appinstalled',()=>{prompt=null;button.hidden=true;});
 matchMedia('(display-mode: standalone)').addEventListener('change',refresh);
 button.addEventListener('click',async()=>{
 if(prompt){const p=prompt;prompt=null;try{await p.prompt();await p.userChoice;}catch(e){console.warn(e);}return;}
 alert('Android: abre el menú ⋮ de Chrome y elige Instalar aplicación o Añadir a pantalla de inicio. Windows: en Chrome o Edge busca Instalar aplicación en la barra de direcciones o en el menú. Si ya está instalada, ábrela desde su icono.');
 });
 if('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('PWA:',e));
})();
