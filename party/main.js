(function(){
'use strict';
const BC=window.BC,IN=window.BC_INPUT,R=window.BC_RENDER,$=id=>document.getElementById(id);
const canvas=$('screen'),c2d=canvas.getContext('2d');c2d.imageSmoothingEnabled=false;
const ctx=window.BC_RASTER.create(256,240),frameImg=c2d.createImageData(256,240);
function present(){frameImg.data.set(ctx.data);c2d.putImageData(frameImg,0,0);}
let game=null,screen='menu',selected=0,playerCount=2,last=0,acc=0,paused=false,fastForward=false;
const loadState={loaded:[],failed:[]};
function status(msg,err){const el=$('status');el.textContent=msg;el.classList.toggle('error',!!err);}
window.addEventListener('error',e=>{const where=e.filename?e.filename.split('/').pop()+':'+e.lineno:'';status('Error: '+e.message+(where?' ('+where+')':' (no location; the game keeps running)'),true);if(where)paused=true;});
function loadModes(){return Promise.all(window.BC_MANIFEST.map(entry=>new Promise(resolve=>{const s=document.createElement('script');s.src='modes/'+entry.file;s.onload=()=>{loadState.loaded.push(entry.file);resolve();};s.onerror=()=>{loadState.failed.push(entry.file);resolve();};document.head.appendChild(s);})));}
function modeList(){const rows=[];for(const entry of window.BC_MANIFEST)for(const id of entry.ids){const m=BC.modes.find(x=>x.id===id);rows.push({id,file:entry.file,mode:m||null});}for(const m of BC.modes)if(!rows.some(r=>r.id===m.id))rows.push({id:m.id,file:'?',mode:m});return rows;}
function renderMenu(){
  const rows=modeList(),list=$('modes');list.replaceChildren();
  rows.forEach((row,i)=>{const li=document.createElement('li');li.className=(i===selected?'sel ':'')+(row.mode?'':'missing');const m=row.mode;
    li.innerHTML='<b>'+(m?m.name:row.id)+'</b><span class="players">'+(m?m.players[0]+'–'+m.players[1]+' players':'missing file '+row.file)+'</span><p>'+(m?m.desc:'This variant is not implemented yet.')+'</p>';
    li.onclick=()=>{selected=i;renderMenu();};li.ondblclick=()=>startSelected();list.appendChild(li);});
  const row=rows[selected],m=row&&row.mode;
  $('players').value=String(playerCount);$('startbtn').disabled=!m;
  $('summary').textContent=m?(m.name+' · '+m.players[0]+'–'+m.players[1]+' players'):'pick a variant';
  $('loadinfo').textContent=loadState.loaded.length+' mode files, '+BC.modes.length+' variants'+(loadState.failed.length?' · missing: '+loadState.failed.join(', '):'');
}
function renderControllers(){
  const box=$('controllers');const devs=IN.devices(),L=IN.learning();box.replaceChildren();
  for(let s=0;s<IN.SLOTS;s++){const d=devs.find(d=>d.slot===s);const card=document.createElement('div');card.className='slot'+(d?(d.connected?' on':' off'):'')+(s<playerCount?'':' unused');
    const st=IN.slots[s],held=IN.BUTTONS.filter(b=>st[b]).join(' ');
    card.innerHTML='<div class="who"><span class="dot p'+s+'"></span>Player '+(s+1)+'</div><div class="dev">'+(d?esc(d.id)+(d.connected?'':' · disconnected'):'gamepad: press any button to join')+'</div><div class="kb">keyboard: '+IN.KEYSET_LABELS[s]+'</div><div class="held">'+(held||'—')+'</div>';
    if(d){const b=document.createElement('button');b.textContent='learn mapping';b.onclick=()=>IN.startLearning(d.index);card.appendChild(b);const sel=document.createElement('select');for(let k=0;k<IN.SLOTS;k++){const o=new Option('→ player '+(k+1),k);if(k===s)o.selected=true;sel.appendChild(o);}sel.onchange=()=>IN.assign(d.index,Number(sel.value));card.appendChild(sel);}
    box.appendChild(card);}
  const un=devs.filter(d=>d.slot<0&&d.connected);$('unassigned').textContent=un.length?('Gamepads without a slot: '+un.map(d=>d.id).join(', ')):'';
  $('learn').textContent=L?('Learning the mapping: press '+IN.BUTTONS[L.step].toUpperCase()+' ('+(L.step+1)+'/'+IN.BUTTONS.length+')'):'';
  $('padcount').textContent=devs.filter(d=>d.connected).length+' gamepad(s) visible to the browser';
}
function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);}
function startSelected(){const row=modeList()[selected];if(!row||!row.mode)return;const m=row.mode;const n=Math.max(m.players[0],Math.min(m.players[1],playerCount));
  game=new BC.Game(m,{playerCount:n,seed:(Date.now()&0xffffff)|1});window.battleCityGame=game;screen='game';paused=false;acc=0;document.body.dataset.screen='game';$('gametitle').textContent=m.name;$('gamedesc').textContent=m.desc;status(m.name+' · '+n+' players');}
function toMenu(){screen='menu';game=null;document.body.dataset.screen='menu';renderMenu();status('menu');}
function tick(now){requestAnimationFrame(tick);IN.poll();
  if(screen==='menu'){for(let k=0;k<IN.SLOTS;k++)if(k>=playerCount&&IN.BUTTONS.some(b=>IN.slots[k][b])){playerCount=k+1;renderMenu();renderControllers();}
    const s=IN.anyPressedSlot('start');if(s>=0)startSelected();if(IN.anyPressedSlot('down')>=0){selected=Math.min(modeList().length-1,selected+1);renderMenu();}if(IN.anyPressedSlot('up')>=0){selected=Math.max(0,selected-1);renderMenu();}
    if(now-last>200){last=now;renderControllers();}return;}
  if(IN.anyPressedSlot('start')>=0&&game.state==='playing'){paused=!paused;status(paused?'paused':'playing');}
  if(IN.anyPressedSlot('select')>=0&&game.state!=='playing'){toMenu();return;}
  if(last===0)last=now;acc+=Math.min(now-last,100);last=now;
  const steps=fastForward?8:1;
  if(!paused)while(acc>=1000/60){for(let k=0;k<steps;k++)game.step(IN.slots.slice(0,game.players.length));acc-=1000/60;}else acc=0;
  R.render(ctx,game);present();
  if(game.state!=='playing'&&!game.exitHint){game.exitHint=true;status(game.result.text+' · Select or Esc: menu');}
}
$('startbtn').onclick=startSelected;$('players').onchange=e=>{playerCount=Number(e.target.value);renderMenu();renderControllers();};$('menubtn').onclick=toMenu;$('pausebtn').onclick=()=>{paused=!paused;};
$('ffbtn').onclick=()=>{fastForward=!fastForward;$('ffbtn').textContent=fastForward?'normal speed':'8x (test)';};
window.addEventListener('keydown',e=>{if(e.code==='Escape'){if(screen==='game')toMenu();}if(e.code==='KeyF'&&e.altKey)$('ffbtn').onclick();});
IN.setOnChange(renderControllers);
window.BC_APP={start(id,n){selected=modeList().findIndex(r=>r.id===id);if(selected<0)throw Error('no mode '+id);playerCount=n||playerCount;startSelected();return game;},get game(){return game;},toMenu,setFastForward(v){fastForward=v;},step(n){for(let i=0;i<n;i++)game.step(IN.slots.slice(0,game.players.length));R.render(ctx,game);present();}};
loadModes().then(()=>{document.body.dataset.screen='menu';renderMenu();renderControllers();status('ready · '+BC.modes.length+' variants');requestAnimationFrame(tick);});
})();
