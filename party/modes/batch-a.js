(function(){
'use strict';
const BC=window.BC;
const CLS=[0x80,0xa0,0xc0,0xe0];
function fmt(frames){const s=Math.max(0,Math.floor(frames/60));return Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}
function pick(g){return CLS[Math.floor(g.random()*CLS.length)];}
function css(G,pal){const c=G.PAL[pal[3]&63];return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}

const BD_ROUND=1080,BD_BREAK=90;
function bdAttacker(g,i){
  let sp=BC.ENEMY_SPAWNS[i%3];
  if(g.tanks.some(t=>BC.rectsOverlap(t.x,t.y,16,16,sp[0],sp[1],16,16))){
    const free=BC.ENEMY_SPAWNS.find(s=>!g.tanks.some(t=>BC.rectsOverlap(t.x,t.y,16,16,s[0],s[1],16,16)));
    if(!free)return false;
    sp=free;}
  g.spawnTank({x:sp[0],y:sp[1],player:i,team:'enemy',palette:BC.ENEMY_PALETTE,dir:BC.DOWN,speed:0.9,shield:60,instant:true});
  return true;
}
function bdStart(g){
  const b=g.bd;
  g.tanks=[];g.bullets=[];g.powerups=[];g.effects=[];g.eagles=[];
  g.loadStage(1);
  b.phase='play';b.start=g.frame;b.kills=0;b.defender=b.round%g.players.length;
  const e=g.addEagle(96,192,g.players[b.defender].team);g.ringEagle(e,BC.BRICK);
  g.rules.maxEnemies=Math.min(6,2+g.players.length);
  g.rules.enemyQueue=[];
  for(let i=0;i<12+b.round*4;i++)g.rules.enemyQueue.push(pick(g));
  g.spawnTimer=60;
  for(const p of g.players){p.tank=null;b.resp[p.slot]=0;}
  const dp=g.players[b.defender];
  g.spawnTank({x:64,y:192,player:b.defender,team:dp.team,dir:BC.UP,level:3,hp:6,speed:1,shield:150,instant:true});
  for(const p of g.players)if(p.slot!==b.defender)bdAttacker(g,p.slot);
  g.text('ROUND '+(b.round+1)+' '+dp.name,150);
}
function bdEnd(g,why){
  const b=g.bd;
  if(b.phase!=='play')return;
  const d=b.defender;
  b.score[d]=Math.floor((g.frame-b.start)/60)+b.kills*5;
  b.phase='break';b.until=g.frame+BD_BREAK;b.round++;
  g.rules.enemyQueue=[];g.tanks=[];g.bullets=[];
  for(const p of g.players)p.tank=null;
  g.text(g.players[d].name+' '+why,90);
}
BC.registerMode({id:'boss-defender',name:'Eagle Defender',players:[2,4],noEagle:true,
  desc:'One player defends the eagle as a fully upgraded tank (level 3, 6 HP, fast) while everyone else attacks as red enemies alongside waves of bots. After 18 seconds, or when the defender dies, the role passes on: everyone defends once.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.playerRespawn=false;g.rules.friendlyFire=false;g.rules.ownEagleHurts=false;g.rules.spawnDelay=70;
    g.bd={round:0,defender:0,phase:'play',start:0,until:0,kills:0,score:g.players.map(()=>0),resp:g.players.map(()=>0)};
    bdStart(g);},
  update(g){
    const b=g.bd;
    if(b.phase==='break'){if(g.frame>=b.until&&b.round<g.players.length)bdStart(g);return;}
    g.timerText=fmt(BD_ROUND-(g.frame-b.start));
    for(const p of g.players){
      if(p.slot===b.defender||p.tank)continue;
      if(b.resp[p.slot]>0){b.resp[p.slot]--;if(b.resp[p.slot]===0&&!bdAttacker(g,p.slot))b.resp[p.slot]=1;}}
    if(g.rules.enemyQueue.length<3)for(let i=0;i<4;i++)g.rules.enemyQueue.push(pick(g));
    if(g.frame-b.start>=BD_ROUND)bdEnd(g,'SURVIVED');},
  onTankDestroyed(g,v,k){
    const b=g.bd;
    if(b.phase!=='play')return;
    if(k&&k.player===b.defender&&v.player!==b.defender)b.kills++;
    if(v.player===null)return;
    if(v.player===b.defender)bdEnd(g,'DOWN');
    else b.resp[v.player]=120;},
  onEagleDestroyed(g){bdEnd(g,'LOST EAGLE');},
  isOver(g){
    const b=g.bd;
    if(b.round<g.players.length||b.phase!=='break'||g.frame<b.until)return null;
    const order=g.players.slice().sort((x,y)=>b.score[y.slot]-b.score[x.slot]);
    if(order[1]&&b.score[order[1].slot]===b.score[order[0].slot])return {text:'DRAW',scores:b.score.slice()};
    return {text:order[0].name+' WINS',winner:order[0].slot,scores:b.score.slice()};},
  hud(g,ctx,G,o){
    const b=g.bd;
    G.drawText(ctx,'R'+Math.min(g.players.length,b.round+1),o.WHITE,228,150);
    let y=24;
    for(const p of g.players){G.drawText(ctx,String(b.score[p.slot]),p.slot===b.defender?p.palette:o.GREY,228,y+16);y+=24;}
    if(b.phase==='play'){const d=g.players[b.defender];ctx.strokeStyle=css(G,d.palette);ctx.lineWidth=1;ctx.strokeRect(226.5,24+b.defender*24-1.5,28,20);}}});

const EH=[{ex:0,ey:0,sx:32,sy:32,mx:0,my:0},{ex:192,ey:0,sx:160,sy:32,mx:10,my:0},{ex:0,ey:192,sx:32,sy:160,mx:0,my:10},{ex:192,ey:192,sx:160,sy:160,mx:10,my:10}];
const EH_TIME=9000;
BC.registerMode({id:'eagle-hunt',name:'Eagle Hunt',players:[2,4],noEagle:true,
  desc:'Everyone has an eagle in their own corner and cannot destroy it with their own shots. Wreck the others, protect yours: lose your eagle and you are out. The last eagle standing wins.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.ownEagleHurts=false;g.rules.friendlyFire=true;g.rules.respawnDelay=90;
    g.buildArena(0.45);
    const spawns=[];
    for(const p of g.players){
      const c=EH[p.slot];
      for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++)g.map.setMeta(c.mx+dx,c.my+dy,BC.EMPTY);
      spawns.push([c.sx,c.sy]);
      p.lives=99;p.team='p'+p.slot;}
    for(const p of g.players){
      const c=EH[p.slot];
      const e=g.addEagle(c.ex,c.ey,p.team);
      e.owner=p.slot;
      g.ringEagle(e,BC.BRICK);}
    g.playerSpawns=spawns;
    for(const p of g.players)g.spawnPlayer(p.slot);
    g.eh={kills:g.players.map(()=>0),drop:360};
    g.text('LAST EAGLE WINS',120);},
  update(g){
    const h=g.eh;
    h.drop--;
    if(h.drop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());h.drop=540;}
    g.timerText=fmt(EH_TIME-g.frame);},
  onEagleDestroyed(g,e,b){
    const p=g.players[e.owner];
    if(b&&b.player!==null&&b.player!==e.owner)g.eh.kills[b.player]++;
    p.alive=false;p.lives=0;p.respawnTimer=0;
    if(p.tank)g.killTank(p.tank,null,true);
    g.text(p.name+' OUT',90);},
  isOver(g){
    const live=g.eagles.filter(e=>e.alive);
    if(live.length===0)return {text:'DRAW'};
    if(live.length===1)return {text:g.players[live[0].owner].name+' WINS',winner:live[0].owner};
    if(g.frame<EH_TIME)return null;
    const order=live.slice().sort((a,b)=>g.eh.kills[b.owner]-g.eh.kills[a.owner]);
    if(order[1]&&g.eh.kills[order[1].owner]===g.eh.kills[order[0].owner])return {text:'DRAW'};
    return {text:g.players[order[0].owner].name+' WINS',winner:order[0].owner};},
  hud(g,ctx,G,o){
    let y=24;
    for(const p of g.players){
      const e=g.eagles.find(x=>x.owner===p.slot);
      G.drawText(ctx,e&&e.alive?String(g.eh.kills[p.slot]):'X',e&&e.alive?p.palette:o.GREY,228,y+16);
      y+=24;}}});

const ZB_WAVE=900;
BC.registerMode({id:'zombies',name:'Zombies',players:[1,4],noEagle:true,
  desc:'Endless co-op against waves of armored tanks, each wave faster, tougher and bigger. One shared pool of lives for the whole team; your score is the time survived. It ends when the eagle falls or the whole team does.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.playerRespawn=false;g.rules.ownEagleHurts=false;
    g.rules.maxEnemies=4;g.rules.spawnDelay=70;
    g.buildArena(0.4);
    for(let mx=0;mx<13;mx++)g.map.setMeta(mx,12,BC.EMPTY);
    for(let mx=4;mx<=8;mx++)g.map.setMeta(mx,11,BC.EMPTY);
    const e=g.addEagle(96,192,'players');g.ringEagle(e,BC.STEEL);
    g.playerSpawns=[[32,192],[160,192],[64,176],[128,176]];
    for(const p of g.players){p.team='players';p.lives=3*g.players.length;}
    g.zb={wave:1,next:0,lives:3*g.players.length,resp:g.players.map(()=>0)};
    g.zb.next=g.frame+ZB_WAVE;
    for(let i=0;i<4;i++)g.rules.enemyQueue.push(0xe0);
    for(const p of g.players)g.spawnPlayer(p.slot);
    g.text('WAVE 1',120);},
  update(g){
    const z=g.zb;
    if(g.frame>=z.next){
      z.wave++;z.next=g.frame+ZB_WAVE;
      g.rules.maxEnemies=Math.min(10,4+z.wave);
      g.rules.spawnDelay=Math.max(20,70-z.wave*5);
      for(let i=0;i<3+z.wave;i++)g.rules.enemyQueue.push(0xe0);
      g.text('WAVE '+z.wave,90);}
    for(const p of g.players){
      p.lives=z.lives;
      if(p.tank||z.resp[p.slot]<=0)continue;
      z.resp[p.slot]--;
      if(z.resp[p.slot]===0)g.spawnPlayer(p.slot);}
    g.timerText=fmt(g.frame);},
  onSpawn(g,t){
    if(t.player!==null||t.team!=='enemy')return;
    const z=g.zb;
    t.speed=0.5+Math.min(0.6,z.wave*0.05);
    t.hp=4+Math.floor(z.wave/3);t.maxHp=t.hp;},
  onTankHit(g,t,b,shooter){if(t.player!==null&&shooter&&shooter.player!==null)return false;},
  onTankDestroyed(g,v){
    if(v.player===null)return;
    const z=g.zb;
    if(z.lives>0){z.lives--;z.resp[v.player]=120;}
    else g.players[v.player].alive=false;},
  isOver(g){
    const z=g.zb;
    if(!g.eagles.some(e=>e.alive))return {text:'EAGLE LOST',survived:g.frame,wave:z.wave};
    if(z.lives>0)return null;
    if(g.players.some(p=>p.tank||z.resp[p.slot]>0))return null;
    return {text:'SURVIVED '+Math.floor(g.frame/60)+'S',survived:g.frame,wave:z.wave};},
  hud(g,ctx,G,o){
    const z=g.zb;
    G.drawText(ctx,'W'+z.wave,o.WHITE,228,150);
    G.drawText(ctx,'L'+z.lives,z.lives>0?o.WHITE:o.GREY,228,162);}});

const KOH_LO=80,KOH_HI=128,KOH_WIN=1800,KOH_TIME=14400;
function kohIn(t){return t&&t.state==='alive'&&t.x+8>=KOH_LO&&t.x+8<KOH_HI&&t.y+8>=KOH_LO&&t.y+8<KOH_HI;}
BC.registerMode({id:'king-of-hill',name:'King of the Hill',players:[2,4],noEagle:true,
  desc:'A 3x3 zone glows in the middle of the map. The clock only runs for whoever stands in it alone: a second tank entering stops everyone. First to 30 seconds in total wins.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.friendlyFire=true;g.rules.respawnDelay=90;
    g.buildArena(0.5);
    for(let my=5;my<=7;my++)for(let mx=5;mx<=7;mx++)g.map.setMeta(mx,my,BC.EMPTY);
    for(const [mx,my] of [[6,3],[6,4],[6,8],[6,9],[3,6],[4,6],[8,6],[9,6]])g.map.setMeta(mx,my,BC.EMPTY);
    g.playerSpawns=[[0,192],[192,0],[192,192],[0,0]];
    for(const p of g.players){p.lives=99;g.spawnPlayer(p.slot);}
    g.koh={hold:g.players.map(()=>0),owner:-1,said:-999,drop:420};
    g.text('HOLD THE CENTER',120);},
  update(g){
    const k=g.koh;
    k.drop--;
    if(k.drop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());k.drop=600;}
    const inside=g.players.filter(p=>kohIn(p.tank));
    if(inside.length===1){
      const s=inside[0].slot;
      k.hold[s]++;
      if(k.owner!==s&&g.frame-k.said>90){k.said=g.frame;g.text(inside[0].name+' HOLDS',60);}
      k.owner=s;}
    else{
      if(inside.length>1&&k.owner!==-2&&g.frame-k.said>90){k.said=g.frame;g.text('CONTESTED',45);}
      k.owner=inside.length>1?-2:-1;}
    g.timerText=fmt(Math.max.apply(null,k.hold));},
  isOver(g){
    const k=g.koh,best=Math.max.apply(null,k.hold),who=k.hold.indexOf(best);
    if(best>=KOH_WIN)return {text:g.players[who].name+' WINS',winner:who,hold:k.hold.slice()};
    if(g.frame<KOH_TIME)return null;
    if(k.hold.filter(h=>h===best).length>1)return {text:'DRAW',hold:k.hold.slice()};
    return {text:g.players[who].name+' WINS',winner:who,hold:k.hold.slice()};},
  hud(g,ctx,G,o){
    const k=g.koh,x=o.OX+KOH_LO,y=o.OY+KOH_LO,w=KOH_HI-KOH_LO;
    const held=k.owner>=0;
    ctx.fillStyle=held?'rgba(255,255,255,0.16)':(k.owner===-2?'rgba(255,120,120,0.14)':'rgba(255,255,255,0.06)');
    ctx.fillRect(x,y,w,w);
    ctx.strokeStyle=held?css(G,g.players[k.owner].palette):(k.owner===-2?'#f88':'#999');
    ctx.lineWidth=1;
    ctx.strokeRect(x+0.5,y+0.5,w-1,w-1);
    ctx.beginPath();
    for(let i=1;i<3;i++){ctx.moveTo(x+i*16,y);ctx.lineTo(x+i*16,y+w);ctx.moveTo(x,y+i*16);ctx.lineTo(x+w,y+i*16);}
    ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.stroke();
    let by=24;
    for(const p of g.players){
      const f=Math.min(1,k.hold[p.slot]/KOH_WIN);
      ctx.fillStyle='#333';ctx.fillRect(228,by+18,24,3);
      ctx.fillStyle=css(G,p.palette);ctx.fillRect(228,by+18,Math.round(24*f),3);
      by+=24;}
    G.drawText(ctx,String(Math.floor(Math.max.apply(null,k.hold)/60)),o.WHITE,228,150);}});
})();
