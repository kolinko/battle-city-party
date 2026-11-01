(function(root){
'use strict';
const SHA='463c6b44bf03c9bfc8c5d7995354f35ff6a8b23f8292bc558cf71c991870042e',SIZE=24592,DB='battle-city-rom',STORE='rom',KEY='battle-city.nes';
const CSS='.rom-gate{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(247,245,238,.97);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#25291f}.rom-card{max-width:560px;width:100%;background:#fffdf7;border:1px solid #d3d6c8;border-radius:14px;padding:24px;box-shadow:0 6px 24px rgba(0,0,0,.08)}.rom-card h2{margin:0 0 8px;font-size:22px;font-weight:600}.rom-card p{margin:8px 0;color:#4a5043}.rom-pick{display:block;margin:16px 0 8px;padding:22px 16px;border:2px dashed #b3b9a8;border-radius:10px;text-align:center;cursor:pointer;background:#f7f5ee;font-weight:600}.rom-pick.over{border-color:#1a75f5;background:#eef4ff}.rom-pick input{display:block;margin:10px auto 0;font:13px ui-monospace,monospace;max-width:100%}.rom-error{color:#a6251a;font-weight:600;min-height:1.5em;white-space:pre-wrap;overflow-wrap:anywhere}.rom-small{font:12px ui-monospace,monospace;color:#6b7160!important;overflow-wrap:anywhere}.rom-card a{color:#1a75f5}';
function hex(buf){return Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');}
function request(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function open(){const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);return request(r);}
async function stored(){const db=await open();const v=await request(db.transaction(STORE).objectStore(STORE).get(KEY));db.close();return v===undefined?null:new Uint8Array(v);}
async function save(bytes){const db=await open();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(bytes.slice().buffer,KEY);await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}
async function forget(){const db=await open();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(KEY);await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}
async function check(bytes,name){
  if(bytes.length!==SIZE)return 'That file ('+name+') is '+bytes.length.toLocaleString('en-US')+' bytes. The Battle City ROM this page needs is exactly 24,592 bytes (a 16-byte iNES header, 16 KB of program, 8 KB of graphics). Nothing was saved.';
  const h=hex(await crypto.subtle.digest('SHA-256',bytes));
  if(h!==SHA)return 'That file ('+name+') is the right size but not the expected Battle City ROM.\nIts SHA-256 is '+h+'.\nOther dumps, hacks and translations are not supported. Nothing was saved.';
  return null;
}
function gate(message){
  return new Promise(resolve=>{
    const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
    const el=document.createElement('div');el.className='rom-gate';el.setAttribute('role','dialog');el.setAttribute('aria-labelledby','rom-gate-title');
    el.innerHTML='<div class="rom-card"><h2 id="rom-gate-title">Bring your own ROM</h2><p>This page runs Battle City from the original 1985 cartridge data: its graphics, its 35 stage maps and, in the source editor, its program. None of that is included here. Pick your own copy of the Battle City ROM (NES/Famicom, <code>.nes</code>) and everything is derived from it in your browser.</p><p>The file never leaves this device. It is kept in this browser\'s storage so you are asked only once, and you can remove it at any time.</p><label class="rom-pick" id="rom-pick">Choose your Battle City .nes file, or drop it here<input type="file" id="rom-file" accept=".nes,application/octet-stream"></label><p class="rom-error" id="rom-error" role="alert"></p><p class="rom-small">Expected: 24,592 bytes, SHA-256 '+SHA+'</p><p class="rom-small"><a href="'+home()+'">Back to the project page</a></p></div>';
    document.body.appendChild(el);
    const err=el.querySelector('#rom-error'),pick=el.querySelector('#rom-pick'),input=el.querySelector('#rom-file');
    err.textContent=message||'';
    async function take(file){
      err.textContent='Checking '+file.name+'…';
      const bytes=new Uint8Array(await file.arrayBuffer()),bad=await check(bytes,file.name);
      if(bad){err.textContent=bad;input.value='';return;}
      await save(bytes);el.remove();style.remove();resolve(bytes);
    }
    input.onchange=()=>{if(input.files.length)take(input.files[0]);};
    pick.ondragover=e=>{e.preventDefault();pick.classList.add('over');};
    pick.ondragleave=()=>pick.classList.remove('over');
    pick.ondrop=e=>{e.preventDefault();pick.classList.remove('over');if(e.dataTransfer.files.length)take(e.dataTransfer.files[0]);};
  });
}
function home(){return new URL(document.querySelector('meta[name="bc-home"]').content,document.baseURI).href;}
async function obtain(){
  const cached=await stored();
  if(cached===null)return gate('');
  const bad=await check(cached,'stored ROM');
  if(bad){await forget();return gate('The ROM stored in this browser did not verify and was removed. '+bad);}
  return cached;
}
function loadScripts(list){return list.reduce((p,src)=>p.then(()=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('could not load '+src));document.body.appendChild(s);})),Promise.resolve());}
function binaryString(bytes){let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return s;}
function fail(e){const box=document.createElement('div');box.className='rom-gate';box.innerHTML='<div class="rom-card"><h2>Something broke while starting</h2><p class="rom-error"></p></div>';box.querySelector('.rom-error').textContent=String(e&&e.stack||e);document.body.appendChild(box);throw e;}
function wireForget(a){a.onclick=async e=>{e.preventDefault();await forget();location.reload();};}
root.BCRom={SHA,SIZE,obtain,forget,check,loadScripts,binaryString,fail,wireForget};
})(window);
