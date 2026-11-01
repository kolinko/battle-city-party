(function(){
'use strict';
const SLOTS=4,BUTTONS=['up','down','left','right','fire','start','select'];
const KEYSETS=[
  {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyZ:'fire',KeyX:'fire',Enter:'start',ShiftLeft:'select',ShiftRight:'select'},
  {KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right',KeyG:'fire',KeyH:'fire',KeyT:'start',KeyY:'select'},
  {KeyI:'up',KeyK:'down',KeyJ:'left',KeyL:'right',KeyN:'fire',KeyM:'fire',KeyO:'start',KeyP:'select'},
  {Numpad8:'up',Numpad5:'down',Numpad4:'left',Numpad6:'right',Numpad0:'fire',NumpadDecimal:'fire',NumpadEnter:'start',NumpadAdd:'select'}];
const KEYSET_LABELS=['arrows + Z/X, Enter, Shift','WASD + G/H, T, Y','IJKL + N/M, O, P','numpad 8456 + 0, Enter, +'];
const STANDARD={up:{b:12},down:{b:13},left:{b:14},right:{b:15},fire:{b:[0,1,2,3]},start:{b:9},select:{b:8}};
const DEAD=0.5;
function blank(){return {up:false,down:false,left:false,right:false,fire:false,start:false,select:false};}
const slots=[],prev=[],keyState=[];for(let i=0;i<SLOTS;i++){slots.push(blank());prev.push(blank());keyState.push(blank());}
const pads=new Map();
let learning=null,keyboardEnabled=true,onChange=()=>{};
function learned(id){const raw=localStorage.getItem('bc-map:'+id);return raw?JSON.parse(raw):null;}
function freeSlot(){for(let s=0;s<SLOTS;s++)if(![...pads.values()].some(p=>p.slot===s))return s;return -1;}
function readPad(gp,map){const st=blank();
  for(const name of BUTTONS){const m=map[name];if(!m)continue;const bs=Array.isArray(m.b)?m.b:(m.b===undefined?[]:[m.b]);for(const b of bs)if(gp.buttons[b]&&gp.buttons[b].pressed)st[name]=true;if(m.axis!==undefined&&gp.axes[m.axis]!==undefined){const v=gp.axes[m.axis];if(m.sign>0?v>DEAD:v<-DEAD)st[name]=true;}}
  if(gp.axes.length>=2&&map===STANDARD){if(gp.axes[1]<-DEAD)st.up=true;if(gp.axes[1]>DEAD)st.down=true;if(gp.axes[0]<-DEAD)st.left=true;if(gp.axes[0]>DEAD)st.right=true;}
  return st;}
function anyPressed(gp){return gp.buttons.some(b=>b.pressed)||gp.axes.some(a=>Math.abs(a)>0.8);}
function poll(){
  const gps=navigator.getGamepads?navigator.getGamepads():[];
  let changed=false;
  for(const gp of gps){if(!gp)continue;let p=pads.get(gp.index);
    if(!p){p={index:gp.index,id:gp.id,slot:-1,mapping:gp.mapping==='standard'?'standard':(learned(gp.id)?'learned':'unknown'),map:gp.mapping==='standard'?STANDARD:(learned(gp.id)||STANDARD),lastActivity:0,connected:true};pads.set(gp.index,p);changed=true;}
    p.connected=true;p.gp=gp;
    if(learning&&learning.index===gp.index){learnStep(gp,p);continue;}
    const pressed=anyPressed(gp);if(pressed)p.lastActivity=performance.now();
    if(p.slot<0&&pressed){const s=freeSlot();if(s>=0){p.slot=s;changed=true;}}
  }
  for(const p of pads.values()){const gp=gps[p.index];if(!gp||gp.id!==p.id){if(p.connected){p.connected=false;changed=true;}}}
  for(let s=0;s<SLOTS;s++){prev[s]=slots[s];const st=keyboardEnabled?Object.assign({},keyState[s]):blank();for(const p of pads.values())if(p.slot===s&&p.connected){const ps=readPad(p.gp,p.map);for(const k of BUTTONS)st[k]=st[k]||ps[k];}slots[s]=st;}
  if(changed)onChange();
}
function pressed(slot,name){return slots[slot][name]&&!prev[slot][name];}
function anyPressedSlot(name){for(let s=0;s<SLOTS;s++)if(pressed(s,name))return s;return -1;}
function learnStep(gp,p){const L=learning;
  if(L.wait){if(!anyPressed(gp))L.wait=false;return;}
  for(let b=0;b<gp.buttons.length;b++)if(gp.buttons[b].pressed){L.map[BUTTONS[L.step]]={b};L.step++;L.wait=true;break;}
  if(!L.wait)for(let a=0;a<gp.axes.length;a++)if(Math.abs(gp.axes[a])>0.8){L.map[BUTTONS[L.step]]={axis:a,sign:Math.sign(gp.axes[a])};L.step++;L.wait=true;break;}
  if(L.step>=BUTTONS.length){localStorage.setItem('bc-map:'+p.id,JSON.stringify(L.map));p.map=L.map;p.mapping='learned';learning=null;}
  onChange();
}
function startLearning(index){const p=pads.get(index);if(!p)throw Error('no pad '+index);learning={index,step:0,map:{},wait:true};onChange();}
function assign(index,slot){const p=pads.get(index);if(!p)throw Error('no pad '+index);for(const o of pads.values())if(o.slot===slot&&o!==p)o.slot=p.slot;p.slot=slot;onChange();}
function devices(){return [...pads.values()].map(p=>({index:p.index,id:p.id,slot:p.slot,mapping:p.mapping,connected:p.connected,lastActivity:p.lastActivity,buttons:p.gp?p.gp.buttons.map(b=>b.pressed):[],axes:p.gp?Array.from(p.gp.axes):[]}));}
window.addEventListener('keydown',e=>{if(e.target instanceof Element&&e.target.matches('input,select,textarea'))return;for(let s=0;s<SLOTS;s++){const n=KEYSETS[s][e.code];if(n){keyState[s][n]=true;e.preventDefault();}}});
window.addEventListener('keyup',e=>{for(let s=0;s<SLOTS;s++){const n=KEYSETS[s][e.code];if(n)keyState[s][n]=false;}});
window.addEventListener('blur',()=>{for(const k of keyState)for(const b of BUTTONS)k[b]=false;});
window.addEventListener('gamepadconnected',()=>onChange());window.addEventListener('gamepaddisconnected',()=>onChange());
window.BC_INPUT={SLOTS,BUTTONS,KEYSET_LABELS,slots,poll,pressed,anyPressedSlot,devices,assign,startLearning,learning:()=>learning,setOnChange(f){onChange=f;},setKeyboard(v){keyboardEnabled=v;}};
})();
