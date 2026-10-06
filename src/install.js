const card = document.getElementById('install-card');
const dialog = document.getElementById('install-dialog');
const installButton = document.getElementById('native-install');
const status = document.getElementById('install-status');
const standalone = matchMedia('(display-mode: standalone)');
const isPhone = navigator.userAgentData?.mobile === true || /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent);
let installed = standalone.matches || navigator.standalone === true;
let promptEvent;
function updateInstalled() { card.hidden = installed || !isPhone; if(installed&&dialog.open) dialog.close(); }
standalone.addEventListener('change',()=>{installed=standalone.matches||navigator.standalone===true;updateInstalled();});
window.addEventListener('appinstalled',()=>{installed=true;promptEvent=null;updateInstalled();});
window.addEventListener('beforeinstallprompt',event=>{
  if (!isPhone || installed) return;
  event.preventDefault(); promptEvent=event; installButton.hidden=false;
});
function selectPlatform(platform) {
  for(const button of dialog.querySelectorAll('[data-platform]')) {
    const selected=button.dataset.platform===platform;
    button.setAttribute('aria-pressed',String(selected));
  }
  document.getElementById('install-ios').hidden=platform!=='ios';
  document.getElementById('install-android').hidden=platform!=='android';
}
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
selectPlatform(ios ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'ios');
for(const button of dialog.querySelectorAll('[data-platform]')) button.addEventListener('click',()=>selectPlatform(button.dataset.platform));
document.getElementById('save-app').addEventListener('click',()=>dialog.showModal());
document.getElementById('close-install').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{ if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();} });
installButton.addEventListener('click',async()=>{
  if(!promptEvent) return;
  const current=promptEvent;promptEvent=null;installButton.hidden=true;
  try {
    await current.prompt();
    const choice=await current.userChoice;
    status.textContent=choice.outcome==='accepted'?'Installation requested. Your browser will finish adding the app.':'You can save it later using your browser’s menu.';
  } catch {status.textContent='Use the browser steps below to save this app.';}
});
updateInstalled();
if('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname))) {
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js').then(async()=>{
      await navigator.serviceWorker.ready;
      document.getElementById('offline-status').textContent='Offline ready';
    }).catch(()=>{document.getElementById('offline-status').textContent='iPhone, iPad and Android';});
  });
}
