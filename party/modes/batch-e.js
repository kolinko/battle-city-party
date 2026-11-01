(function(){
'use strict';
const BC=window.BC;
const CORNERS=[[0,192],[192,0],[192,192],[0,0]];
function clock(g,frames){const s=Math.max(0,Math.ceil(frames/60));g.timerText=Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}
function drop(g,box,gap){box.nextDrop--;if(box.nextDrop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());box.nextDrop=gap;}}

BC.registerMode({id:'infection',name:'Infection',players:[2,4],
  desc:'One player starts infected (a grey enemy tank) and is faster than the rest. Every human who dies respawns infected. The infected win when no humans are left; the humans win if anyone survives 90 seconds.',
  setup(g){g.rules.hud='party';g.rules.friendlyFire=false;g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.respawnDelay=75;
    g.buildArena(0.45);g.playerSpawns=CORNERS.slice();
    const first=Math.floor(g.random()*g.players.length);
    for(const p of g.players){p.lives=999;p.team=p.slot===first?'infected':'human';if(p.slot===first)p.palette=BC.ENEMY_PALETTE;}
    for(const p of g.players)g.spawnPlayer(p.slot);
    g.inf={time:90*60,patient:first,nextDrop:420};
    g.text(g.players[first].name+' IS INFECTED',150);},
  onSpawn(g,t){if(t.player===null)return;const p=g.players[t.player];if(p.team==='infected'){t.speed=1;t.level=0;}else{t.speed=0.75;t.level=1;}},
  update(g){drop(g,g.inf,600);clock(g,g.inf.time-g.frame);},
  onTankDestroyed(g,v){if(v.player===null)return;const p=g.players[v.player];if(p.team!=='human')return;
    p.team='infected';p.palette=BC.ENEMY_PALETTE;g.text(p.name+' INFECTED',90);},
  isOver(g){const humans=g.players.filter(p=>p.team==='human');
    if(humans.length===0)return {text:'INFECTED WIN',winner:'infected'};
    if(g.frame>=g.inf.time)return {text:humans.length===1?humans[0].name+' SURVIVES':'HUMANS SURVIVE',winner:'human'};
    return null;},
  hud(g,ctx,G,o){const h=g.players.filter(p=>p.team==='human').length;
    G.drawText(ctx,'H'+h,o.WHITE,228,148);G.drawText(ctx,'I'+(g.players.length-h),BC.ENEMY_PALETTE,228,164);}});

BC.registerMode({id:'shared-lives',name:'Shared Lives',players:[2,4],
  desc:'Co-op against enemy waves with a shared pool of 6 lives for the whole team: any player dying takes one life from the pool, and every cleared wave gives one back. You lose when the pool runs out or the eagle falls; you win after three waves.',
  setup(g){g.rules.hud='party';g.rules.maxEnemies=6;g.rules.spawnDelay=60;g.rules.ownEagleHurts=false;g.playerSpawns=[[64,192],[128,192],[32,192],[160,192]];
    g.sl={pool:6,waves:3};slStage(g,1);},
  onTankDestroyed(g,v){if(v.player===null)return;const s=g.sl;s.pool--;
    for(const p of g.players)p.lives=Math.max(0,s.pool);
    if(s.pool<=0){for(const p of g.players){p.alive=false;p.respawnTimer=0;}g.gameOver('GAME OVER',{winner:'enemies'});}
    else g.text('LIVES '+s.pool,60);},
  onStageClear(g){g.clearTimer++;const s=g.sl;
    if(g.clearTimer===1){if(g.stage>=s.waves){g.gameOver('VICTORY',{winner:'players'});return;}s.pool++;for(const p of g.players)p.lives=s.pool;g.text('WAVE CLEAR',180);}
    if(g.clearTimer>=180)slStage(g,g.stage+1);},
  hud(g,ctx,G,o){const s=g.sl;G.drawText(ctx,'L'+s.pool,o.WHITE,228,148);G.drawText(ctx,'W'+g.stage,o.GREY,228,164);}});

function slStage(g,n){g.tanks=[];g.bullets=[];g.powerups=[];g.eagles=[];g.effects=[];
  g.loadStage(n);g.addEagle(96,192,'players');g.classicEnemyQueue();g.spawnTimer=30;g.freezeTimer=0;g.shovelTimer=0;g.clearTimer=0;
  for(const p of g.players){p.tank=null;p.level=0;p.lives=g.sl.pool;p.respawnTimer=0;if(p.alive)g.spawnPlayer(p.slot);}
  g.text('WAVE '+n+' OF '+g.sl.waves,150);}

BC.registerMode({id:'bounty',name:'Bounty',players:[2,4],
  desc:'Deathmatch where the leader is the bounty: they flash red, wear a crown above the tank and a marker in the HUD, and a frag on them counts double and drops a power-up. First to 12 points, or the most after 3 minutes.',
  setup(g){g.rules.hud='party';g.rules.friendlyFire=true;g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.respawnDelay=90;
    g.buildArena(0.5);g.playerSpawns=CORNERS.slice();for(const p of g.players){p.lives=999;g.spawnPlayer(p.slot);}
    g.bt={limit:12,time:180*60,nextDrop:300,leader:-1};g.text('FIRST TO 12',120);},
  update(g){const b=g.bt;drop(g,b,480);clock(g,b.time-g.frame);
    const rank=g.players.slice().sort((x,y)=>y.kills-x.kills);
    let lead=-1;if(rank[0].kills>0&&(!rank[1]||rank[1].kills<rank[0].kills))lead=rank[0].slot;
    if(lead!==b.leader){b.leader=lead;if(lead>=0)g.text(g.players[lead].name+' IS BOUNTY',90);}
    for(const p of g.players)if(p.tank)p.tank.bonus=(p.slot===b.leader);},
  onTankDestroyed(g,v,k){const b=g.bt;
    if(k&&k.player!==null){if(k.player===v.player)g.players[k.player].kills--;else if(v.player===b.leader)g.players[k.player].kills++;}
    if(v.player===b.leader)b.leader=-1;},
  isOver(g){const b=g.bt,l=g.players.slice().sort((x,y)=>y.kills-x.kills);
    if(l[0].kills<b.limit&&g.frame<b.time)return null;
    if(l[1]&&l[1].kills===l[0].kills){if(g.frame<b.time)return null;return {text:'DRAW'};}
    return {text:l[0].name+' WINS',winner:l[0].slot};},
  hud(g,ctx,G,o){const b=g.bt;if(b.leader<0)return;const p=g.players[b.leader];
    ctx.fillStyle='#ffcc44';ctx.fillRect(224,26+24*p.slot,3,14);
    const t=p.tank;if(!t||t.state!=='alive')return;
    ctx.save();ctx.beginPath();ctx.rect(o.OX,o.OY,BC.FIELD,BC.FIELD);ctx.clip();
    const x=o.OX+t.x,y=o.OY+t.y;ctx.beginPath();ctx.moveTo(x+2,y-1);ctx.lineTo(x+4,y-7);ctx.lineTo(x+8,y-3);ctx.lineTo(x+12,y-7);ctx.lineTo(x+14,y-1);ctx.closePath();ctx.fill();
    ctx.restore();}});

BC.registerMode({id:'fog-of-war',name:'Fog of War',players:[2,4],noEagle:true,
  desc:'Two teams (yellow: players 1+3, green: 2+4) fight in the dark: you only see the area around living player tanks and both bases, and the rest of the map, bullets included, is hidden. Destroy the enemy eagle, or have more frags after 150 seconds.',
  setup(g){g.rules.hud='party';g.rules.friendlyFire=false;g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.respawnDelay=90;g.rules.ownEagleHurts=false;
    g.buildArena(0.55);const m=g.map;
    for(const [x,y] of [[5,12],[6,12],[7,12],[5,11],[6,11],[7,11],[5,0],[6,0],[7,0],[5,1],[6,1],[7,1]])m.setMeta(x,y,BC.EMPTY);
    for(const p of g.players){p.team=p.slot%2===0?'yellow':'green';p.palette=BC.PLAYER_PALETTES[p.slot%2];p.lives=999;}
    const ey=g.addEagle(96,192,'yellow'),eg=g.addEagle(96,0,'green');for(const e of [ey,eg])g.ringEagle(e,BC.BRICK);
    g.playerSpawns=[[32,192],[32,0],[160,192],[160,0]];for(const p of g.players)g.spawnPlayer(p.slot);
    g.fog={time:150*60,radius:46,base:26,nextDrop:420};g.text('FOG OF WAR',120);},
  update(g){drop(g,g.fog,600);clock(g,g.fog.time-g.frame);},
  onEagleDestroyed(g,e){g.gameOver((e.team==='yellow'?'GREEN':'YELLOW')+' TEAM WINS',{winner:e.team==='yellow'?'green':'yellow'});},
  isOver(g){if(g.frame<g.fog.time)return null;
    const k=t=>g.players.filter(p=>p.team===t).reduce((s,p)=>s+p.kills,0);const y=k('yellow'),gr=k('green');
    if(y===gr)return {text:'DRAW'};return {text:(y>gr?'YELLOW':'GREEN')+' TEAM WINS',winner:y>gr?'yellow':'green'};},
  hud(g,ctx,G,o){const f=g.fog;
    ctx.save();ctx.beginPath();ctx.rect(o.OX,o.OY,BC.FIELD,BC.FIELD);ctx.clip();
    ctx.beginPath();ctx.rect(o.OX,o.OY,BC.FIELD,BC.FIELD);
    for(const t of g.tanks){if(t.player===null||!t.alive)continue;const cx=o.OX+t.x+8,cy=o.OY+t.y+8;ctx.moveTo(cx+f.radius,cy);ctx.arc(cx,cy,f.radius,0,Math.PI*2);}
    for(const e of g.eagles){if(!e.alive)continue;const cx=o.OX+e.x+8,cy=o.OY+e.y+8;ctx.moveTo(cx+f.base,cy);ctx.arc(cx,cy,f.base,0,Math.PI*2);}
    ctx.fillStyle='rgba(0,0,0,0.94)';ctx.fill('evenodd');
    ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=1;
    for(const t of g.tanks){if(t.player===null||!t.alive)continue;ctx.beginPath();ctx.arc(o.OX+t.x+8,o.OY+t.y+8,f.radius,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
    const k=t=>g.players.filter(p=>p.team===t).reduce((s,p)=>s+p.kills,0);
    G.drawText(ctx,String(k('yellow')),BC.PLAYER_PALETTES[0],228,148);G.drawText(ctx,String(k('green')),BC.PLAYER_PALETTES[1],244,148);}});
})();
