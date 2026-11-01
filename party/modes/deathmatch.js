(function(){
'use strict';
const BC=window.BC;
const CORNERS=[[0,192],[192,0],[192,192],[0,0]];
function clock(g,frames){const s=Math.max(0,Math.ceil(frames/60));g.timerText=Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}
function dmSetup(g,opts){g.rules.hud='party';g.rules.friendlyFire=true;g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.respawnDelay=90;g.rules.autoFire=false;
  g.buildArena(0.5);g.playerSpawns=CORNERS.slice();for(const p of g.players){p.lives=999;g.spawnPlayer(p.slot);}
  g.dm={limit:opts.limit,timeLimit:opts.time,nextDrop:300};g.text('FIRST TO '+opts.limit,120);}
function dmUpdate(g){const d=g.dm;d.nextDrop--;if(d.nextDrop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());d.nextDrop=480;}clock(g,d.timeLimit-g.frame);}
function leader(g){return g.players.slice().sort((a,b)=>b.kills-a.kills);}
function dmOver(g){const d=g.dm,l=leader(g);if(l[0].kills>=d.limit||g.frame>=d.timeLimit){if(l[1]&&l[1].kills===l[0].kills&&g.frame<d.timeLimit)return null;return {text:l[0].name+' WINS',winner:l[0].slot};}return null;}
BC.registerMode({id:'deathmatch',name:'Deathmatch',players:[2,4],desc:'Free-for-all on a random symmetrical arena. First to 10 frags, or the most frags after 3 minutes. Power-ups drop every 8 s.',
  setup(g){dmSetup(g,{limit:10,time:180*60});},update:dmUpdate,isOver:dmOver,
  onTankDestroyed(g,v,k){if(k&&k.player!==null&&k.player===v.player)g.players[k.player].kills--;}});
BC.registerMode({id:'team-deathmatch',name:'Team Deathmatch',players:[2,4],desc:'Two teams (yellow: players 1+3, green: 2+4), each with its own eagle. Destroy the enemy eagle, or have more frags after 3 minutes.',noEagle:true,
  setup(g){g.rules.hud='party';g.rules.friendlyFire=false;g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.respawnDelay=90;g.rules.ownEagleHurts=false;
    g.buildArena(0.5);const m=g.map;for(const [x,y] of [[5,12],[6,12],[7,12],[5,11],[6,11],[7,11],[5,0],[6,0],[7,0],[5,1],[6,1],[7,1]])m.setMeta(x,y,BC.EMPTY);
    for(const p of g.players){p.team=p.slot%2===0?'yellow':'green';p.palette=BC.PLAYER_PALETTES[p.slot%2];p.lives=999;}
    const ey=g.addEagle(96,192,'yellow'),eg=g.addEagle(96,0,'green');for(const e of [ey,eg])g.ringEagle(e,BC.BRICK);
    g.playerSpawns=[[32,192],[32,0],[160,192],[160,0]];for(const p of g.players)g.spawnPlayer(p.slot);g.dm={time:180*60,nextDrop:300};g.text('YELLOW VS GREEN',120);},
  update(g){const d=g.dm;d.nextDrop--;if(d.nextDrop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());d.nextDrop=480;}clock(g,d.time-g.frame);},
  onEagleDestroyed(g,e){g.gameOver((e.team==='yellow'?'GREEN':'YELLOW')+' TEAM WINS',{winner:e.team==='yellow'?'green':'yellow'});},
  isOver(g){if(g.frame<g.dm.time)return null;const k=t=>g.players.filter(p=>p.team===t).reduce((s,p)=>s+p.kills,0);const y=k('yellow'),gr=k('green');if(y===gr)return {text:'DRAW'};return {text:(y>gr?'YELLOW':'GREEN')+' TEAM WINS'};},
  hud(g,ctx,G,o){const k=t=>g.players.filter(p=>p.team===t).reduce((s,p)=>s+p.kills,0);G.drawText(ctx,String(k('yellow')),BC.PLAYER_PALETTES[0],228,196);G.drawText(ctx,String(k('green')),BC.PLAYER_PALETTES[1],244,196);}});
BC.registerMode({id:'hot-potato',name:'Hot Potato',players:[2,4],desc:'Deathmatch where every 15 s a random player starts flashing red and gets four stars, extra speed and a double shot for 10 s. A frag on the red tank counts triple.',
  setup(g){dmSetup(g,{limit:15,time:240*60});g.hot={next:600,who:-1,until:0};},
  update(g){dmUpdate(g);const h=g.hot;if(h.who>=0&&g.frame>=h.until){const t=g.players[h.who].tank;if(t){t.bonus=false;t.speed=g.rules.playerSpeed;t.level=0;}h.who=-1;h.next=g.frame+600;}
    if(h.who<0&&g.frame>=h.next){const cands=g.players.filter(p=>p.tank&&p.tank.state==='alive');if(cands.length){const p=cands[Math.floor(g.random()*cands.length)];h.who=p.slot;h.until=g.frame+600;const t=p.tank;t.bonus=true;t.speed=1.25;t.level=3;g.text(p.name+' IS RED',90);}}},
  onTankDestroyed(g,v,k){const h=g.hot;if(k&&k.player!==null&&k.player===v.player)g.players[k.player].kills--;else if(k&&k.player!==null&&v.player===h.who){g.players[k.player].kills+=2;}if(v.player===h.who){h.who=-1;h.next=g.frame+300;}},
  isOver:dmOver});
})();
