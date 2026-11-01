(function(){
'use strict';
const BC=window.BC;
const GRID=BC.GRID;
function clock(g,frames){const s=Math.max(0,Math.ceil(frames/60));g.timerText=Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}
function bar(ctx,x,y,w,h,frac,color){ctx.fillStyle='#303030';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x,y,Math.round(Math.max(0,Math.min(1,frac))*w),h);}
function teamName(t){return t==='yellow'?'YELLOW':'GREEN';}
function splitTeams(g){for(const p of g.players){p.team=p.slot%2===0?'yellow':'green';p.palette=BC.PLAYER_PALETTES[p.slot%2];p.lives=999;}}
function teamPal(t){return t==='yellow'?BC.PLAYER_PALETTES[0]:BC.PLAYER_PALETTES[1];}

const JUG_TARGET=45*60,JUG_LIMIT=300*60;
function jugOn(g,t){t.hp=6;t.maxHp=6;t.speed=0.45;t.bulletSpeed=4;t.level=2;t.bonus=true;}
function jugRank(g){return g.players.slice().sort((a,b)=>g.jug.time[b.slot]-g.jug.time[a.slot]);}
BC.registerMode({id:'juggernaut',name:'Juggernaut',players:[2,4],
  desc:'One tank is the juggernaut: six hit points, fast bullets, heavy and slow. Everyone else has one life per attempt but respawns forever. Whoever kills the juggernaut becomes it, and what counts is the total time spent in that role. First to 45 seconds wins.',
  setup(g){
    g.rules.hud='party';g.rules.friendlyFire=true;g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.respawnDelay=60;
    g.buildArena(0.45);g.playerSpawns=[[0,192],[192,0],[192,192],[0,0]];
    g.jug={who:0,time:g.players.map(()=>0),drop:420};
    for(const p of g.players){p.lives=999;g.spawnPlayer(p.slot);}
    g.text(g.players[0].name+' IS JUGGERNAUT',150);},
  onSpawn(g,t){if(t.player!==null&&t.player===g.jug.who)jugOn(g,t);},
  update(g){
    const j=g.jug,h=g.players[j.who];
    if(h.tank&&h.tank.state==='alive')j.time[j.who]++;
    j.drop--;if(j.drop<=0&&g.powerups.length<1){g.spawnPowerup(g.randomPowerupKind());j.drop=600;}
    clock(g,JUG_LIMIT-g.frame);},
  onTankDestroyed(g,v,k){
    const j=g.jug;if(v.player===null||v.player!==j.who)return;
    let next=-1;
    if(k&&k.player!==null&&k.player!==v.player)next=k.player;
    else{const rest=g.players.filter(p=>p.slot!==v.player);next=rest[Math.floor(g.random()*rest.length)].slot;}
    j.who=next;const t=g.players[next].tank;if(t)jugOn(g,t);
    g.text(g.players[next].name+' IS JUGGERNAUT',90);},
  isOver(g){
    const r=jugRank(g);
    if(g.jug.time[r[0].slot]>=JUG_TARGET)return {text:r[0].name+' WINS',winner:r[0].slot};
    if(g.frame>=JUG_LIMIT)return {text:r[0].name+' WINS',winner:r[0].slot};
    return null;},
  hud(g,ctx,G,o){
    const j=g.jug;G.drawText(ctx,'JUG',o.WHITE,224,110);
    let y=122;
    for(const p of g.players){
      if(p.slot===j.who){ctx.fillStyle='#e8482c';ctx.fillRect(224,y,3,7);}
      G.drawText(ctx,String(Math.min(99,Math.floor(j.time[p.slot]/60))).padStart(2,'0'),p.palette,228,y);
      bar(ctx,228,y+8,24,2,j.time[p.slot]/JUG_TARGET,'#f4f4f4');
      y+=14;}
    const t=g.players[j.who].tank;
    if(t&&t.state==='alive'){bar(ctx,o.OX+t.x,o.OY+t.y-4,16,2,t.hp/t.maxHp,'#e8482c');}}});

const VIP_START=[96,192],VIP_ROUTE=[[176,128],[16,64],[96,0]];
function vipMove(g,t,dir){
  const vert=dir===BC.UP||dir===BC.DOWN;
  const nx=vert?Math.round(t.x/8)*8:t.x+BC.DX[dir];
  const ny=vert?t.y+BC.DY[dir]:Math.round(t.y/8)*8;
  if(g.blockedAt(t,nx,ny))return false;
  g.moveTank(t,dir,true);return true;}
function vipFace(g,t,dir){
  if(dir===BC.UP||dir===BC.DOWN)t.x=Math.round(t.x/8)*8;else t.y=Math.round(t.y/8)*8;
  t.dir=dir;}
function vipFront(g,t,dir){
  const cx=Math.floor(t.x/8),cy=Math.floor(t.y/8);
  if(dir===BC.UP)return [g.map.get(cx,cy-1),g.map.get(cx+1,cy-1)];
  if(dir===BC.DOWN)return [g.map.get(cx,cy+2),g.map.get(cx+1,cy+2)];
  if(dir===BC.LEFT)return [g.map.get(cx-1,cy),g.map.get(cx-1,cy+1)];
  return [g.map.get(cx+2,cy),g.map.get(cx+2,cy+1)];}
function vipProgress(g){
  const v=g.esc,t=g.vip;let d=0;
  for(let i=0;i<v.leg;i++)d+=v.segs[i];
  if(v.leg<VIP_ROUTE.length){const wp=VIP_ROUTE[v.leg];d+=Math.max(0,v.segs[v.leg]-(Math.abs(t.x-wp[0])+Math.abs(t.y-wp[1])));}
  return Math.max(0,Math.min(1,d/v.total));}
function vipCtl(g,t){
  const v=g.esc;
  if(t.state!=='alive')return;
  if(t.y<=0){v.leg=VIP_ROUTE.length;v.done=true;return;}
  const wp=VIP_ROUTE[v.leg];
  const dist=Math.abs(t.x-wp[0])+Math.abs(t.y-wp[1]);
  if(dist<v.best){v.best=dist;v.stall=0;}else v.stall++;
  if(dist<=8){
    if(v.leg>=VIP_ROUTE.length-1){v.done=true;return;}
    v.leg++;v.best=9999;v.stall=0;v.axis=null;g.text('VIP CHECKPOINT '+(v.leg+1),90);return;}
  if(v.stall>600&&!v.drill){v.drill=true;t.level=3;g.text('VIP DRILLS',90);}
  if(v.detour>0){v.detour--;if(vipMove(g,t,v.dir))return;v.detour=0;}
  const dx=wp[0]-t.x,dy=wp[1]-t.y;
  const horiz=dx>0?BC.RIGHT:BC.LEFT,vert=dy>0?BC.DOWN:BC.UP;
  if(!v.axis)v.axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
  if(Math.abs(v.axis==='x'?dx:dy)<4)v.axis=v.axis==='x'?'y':'x';
  const first=v.axis==='x'?horiz:vert,second=v.axis==='x'?vert:horiz;
  const firstD=v.axis==='x'?dx:dy,secondD=v.axis==='x'?dy:dx;
  if(Math.abs(firstD)>=4&&vipMove(g,t,first))return;
  if(Math.abs(secondD)>=4&&vipMove(g,t,second)){v.axis=v.axis==='x'?'y':'x';return;}
  const want=Math.abs(firstD)>=4?first:second;
  vipFace(g,t,want);
  const front=vipFront(g,t,want);
  if(front.some(c=>c===BC.BRICK||(v.drill&&c===BC.STEEL))){g.fire(t);return;}
  const perp=(want===BC.LEFT||want===BC.RIGHT)?[BC.UP,BC.DOWN]:[BC.LEFT,BC.RIGHT];
  v.dir=perp[g.random()<0.5?0:1];v.detour=24+Math.floor(g.random()*40);}
BC.registerMode({id:'vip-escort',name:'VIP Escort',players:[1,4],
  desc:'Co-op: a slow VIP tank drives itself from the bottom of the map to the top, touching two checkpoints on the way and smashing any bricks in its path. Players have infinite lives and one job: take out the enemies before they take the VIP apart. Its health and route progress are on the right.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.friendlyFire=false;g.rules.respawnDelay=90;g.rules.maxEnemies=5;g.rules.spawnDelay=90;
    g.buildArena(0.4);
    for(const [mx,my] of [[6,12],[6,11],[11,8],[1,4],[6,0],[6,1],[0,12],[12,12],[0,11],[12,11]])g.map.setMeta(mx,my,BC.EMPTY);
    for(const p of g.players){p.team='players';p.lives=999;}
    g.playerSpawns=[[0,192],[192,192],[0,176],[192,176]];
    for(const p of g.players)g.spawnPlayer(p.slot);
    const q=[];for(let i=0;i<40;i++)q.push([0x80,0xa0,0x80,0xc0,0xe0][i%5]);
    g.rules.enemyQueue=q;g.spawnTimer=150;
    const segs=[];let px=VIP_START[0],py=VIP_START[1];
    for(const w of VIP_ROUTE){segs.push(Math.abs(w[0]-px)+Math.abs(w[1]-py));px=w[0];py=w[1];}
    g.esc={leg:0,best:9999,stall:0,drill:false,done:false,detour:0,dir:BC.LEFT,segs,total:segs.reduce((a,b)=>a+b,0)};
    g.vip=g.spawnTank({x:VIP_START[0],y:VIP_START[1],dir:BC.UP,team:'players',hp:16,speed:0.25,bulletSpeed:3,instant:true,bonus:true,controller:vipCtl,tags:{vip:true},palette:BC.PLAYER_PALETTES[3]});
    g.text('ESCORT THE VIP',150);},
  update(g){g.timerText=String(Math.round(vipProgress(g)*100));},
  isOver(g){
    if(g.esc.done)return {text:'VIP IS SAFE',winner:'players'};
    if(!g.vip.alive)return {text:'VIP IS DOWN'};
    return null;},
  hud(g,ctx,G,o){
    const t=g.vip;G.drawText(ctx,'VIP',o.WHITE,224,110);
    G.drawText(ctx,String(Math.max(0,t.hp)).padStart(2,'0'),BC.PLAYER_PALETTES[3],224,122);
    bar(ctx,224,132,28,3,t.hp/t.maxHp,'#e8482c');
    G.drawText(ctx,'WAY',o.GREY,224,142);
    bar(ctx,224,152,28,3,vipProgress(g),'#8ce860');
    const wp=VIP_ROUTE[Math.min(g.esc.leg,VIP_ROUTE.length-1)];
    ctx.fillStyle=g.esc.done?'#8ce860':'#f8f8f8';ctx.fillRect(o.OX+wp[0]+6,o.OY+wp[1]+6,4,4);
    if(t.alive&&t.state==='alive'){
      ctx.fillStyle='#f8f8f8';ctx.fillRect(o.OX+t.x+4,o.OY+t.y-5,8,3);
      bar(ctx,o.OX+t.x,o.OY+t.y-9,16,2,t.hp/t.maxHp,'#e8482c');}}});

const CAP_GOAL=3,CAP_LIMIT=180*60;
function capDrop(g,x,y){
  const c=g.cap,t=c.carrier;
  if(t){t.tags.carrier=false;t.speed=t.tags.baseSpeed||g.rules.playerSpeed;t.bonus=false;}
  c.carrier=null;c.x=Math.max(0,Math.min(192,Math.round(x/8)*8));c.y=Math.max(0,Math.min(192,Math.round(y/8)*8));c.idle=0;}
BC.registerMode({id:'capture-eagle',name:'Flag to the Eagle',players:[2,4],noEagle:true,
  desc:'Two teams, yellow at the bottom and green at the top, each with its own eagle inside a steel ring. A flag lies in the middle: whoever carries it drives slower and flashes red, and drops it where they die. Bring the flag to your own eagle three times.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.ownEagleHurts=false;g.rules.friendlyFire=false;g.rules.respawnDelay=90;
    g.buildArena(0.4);
    const m=g.map;
    for(const [x,y] of [[5,12],[6,12],[7,12],[5,11],[6,11],[7,11],[5,0],[6,0],[7,0],[5,1],[6,1],[7,1],[5,6],[6,6],[7,6]])m.setMeta(x,y,BC.EMPTY);
    splitTeams(g);
    const ey=g.addEagle(96,192,'yellow'),eg=g.addEagle(96,0,'green');
    for(const e of [ey,eg])g.ringEagle(e,BC.STEEL);
    g.playerSpawns=[[32,192],[32,0],[160,192],[160,0]];
    for(const p of g.players)g.spawnPlayer(p.slot);
    g.cap={x:96,y:96,carrier:null,score:{yellow:0,green:0},idle:0};
    g.text('CAPTURE THE FLAG',150);},
  update(g){
    const c=g.cap;
    if(c.carrier){
      const t=c.carrier;
      if(!t.alive)capDrop(g,t.x,t.y);
      else{
        const e=g.eagles.find(e=>e.team===t.team);
        if(BC.rectsOverlap(t.x,t.y,16,16,e.x-12,e.y-12,40,40)){
          c.score[t.team]++;g.text(teamName(t.team)+' SCORES',120);capDrop(g,96,96);}}}
    else{
      c.idle++;
      if(c.idle>900&&(c.x!==96||c.y!==96)){c.x=96;c.y=96;c.idle=0;g.text('FLAG RESET',90);}
      for(const t of g.tanks){
        if(t.player===null||t.state!=='alive')continue;
        if(!BC.rectsOverlap(t.x,t.y,16,16,c.x,c.y,16,16))continue;
        c.carrier=t;t.tags.carrier=true;t.tags.baseSpeed=t.speed;t.speed=0.45;t.bonus=true;c.idle=0;
        g.text(teamName(t.team)+' HAS THE FLAG',90);break;}}
    clock(g,CAP_LIMIT-g.frame);},
  onTankDestroyed(g,v){if(v.tags.carrier)capDrop(g,v.x,v.y);},
  onEagleDestroyed(g,e){
    e.alive=true;
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(e.y/8+dy)*GRID+e.x/8+dx;g.map.cell[i]=BC.EAGLE;g.map.tile[i]=0;}
    g.ringEagle(e,BC.STEEL);g.text('BASE REBUILT',90);},
  isOver(g){
    const s=g.cap.score;
    if(s.yellow>=CAP_GOAL)return {text:'YELLOW TEAM WINS',winner:'yellow'};
    if(s.green>=CAP_GOAL)return {text:'GREEN TEAM WINS',winner:'green'};
    if(g.frame<CAP_LIMIT)return null;
    if(s.yellow===s.green)return {text:'DRAW'};
    return {text:(s.yellow>s.green?'YELLOW':'GREEN')+' TEAM WINS',winner:s.yellow>s.green?'yellow':'green'};},
  hud(g,ctx,G,o){
    const c=g.cap;
    G.drawText(ctx,String(c.score.yellow),BC.PLAYER_PALETTES[0],228,110);
    G.drawText(ctx,'-',o.GREY,236,110);
    G.drawText(ctx,String(c.score.green),BC.PLAYER_PALETTES[1],244,110);
    G.drawText(ctx,String(CAP_GOAL),o.GREY,236,122);
    const t=c.carrier,fx=t?t.x:c.x,fy=t?t.y:c.y;
    ctx.fillStyle='#f8f8f8';ctx.fillRect(o.OX+fx+3,o.OY+fy+1,2,14);
    ctx.fillStyle=t?(t.team==='yellow'?'#e8d020':'#50c040'):'#e8482c';
    ctx.fillRect(o.OX+fx+5,o.OY+fy+2,9,7);}});

const LB_LIMIT=180*60;
function fort(g,cols,rows){const keys=[];for(const my of rows)for(const mx of cols){g.map.setMeta(mx,my,BC.BRICK);for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)keys.push((my*2+dy)*GRID+mx*2+dx);}return keys;}
function fortLeft(g,keys){let n=0;for(const i of keys)if(g.map.cell[i]===BC.BRICK)n++;return n;}
BC.registerMode({id:'last-brick',name:'Last Brick',players:[2,4],noEagle:true,
  desc:'Two teams, two brick fortresses: yellow at the bottom, green at the top. Every brick of your fortress that gets destroyed costs a life point; the counter is on the right. The team whose fortress hits zero loses; after three minutes the team with more bricks wins.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.friendlyFire=false;g.rules.respawnDelay=90;
    g.buildArena(0.3);
    splitTeams(g);
    const cols=[3,4,5,6,7,8,9];
    const yellow=fort(g,cols,[11,12]),green=fort(g,cols,[0,1]);
    for(const [mx,my] of [[0,10],[0,11],[0,12],[12,10],[12,11],[12,12],[0,0],[0,1],[0,2],[12,0],[12,1],[12,2],[1,11],[11,11],[1,1],[11,1]])g.map.setMeta(mx,my,BC.EMPTY);
    g.playerSpawns=[[0,176],[0,16],[192,176],[192,16]];
    g.lb={yellow,green,left:{yellow:yellow.length,green:green.length},max:yellow.length,prev:{yellow:yellow.length,green:green.length}};
    for(const p of g.players)g.spawnPlayer(p.slot);
    g.text('BREAK THE FORT',150);},
  update(g){
    const lb=g.lb;
    lb.left.yellow=fortLeft(g,lb.yellow);lb.left.green=fortLeft(g,lb.green);
    for(const side of ['yellow','green']){
      const n=lb.left[side];
      if(n<lb.prev[side]&&(n%10===0||n<=3))g.text(teamName(side)+' '+n+' LEFT',90);
      lb.prev[side]=n;}
    clock(g,LB_LIMIT-g.frame);},
  isOver(g){
    const l=g.lb.left;
    if(l.yellow===0&&l.green===0)return {text:'DRAW'};
    if(l.yellow===0)return {text:'GREEN TEAM WINS',winner:'green'};
    if(l.green===0)return {text:'YELLOW TEAM WINS',winner:'yellow'};
    if(g.frame<LB_LIMIT)return null;
    if(l.yellow===l.green)return {text:'DRAW'};
    return {text:(l.yellow>l.green?'YELLOW':'GREEN')+' TEAM WINS',winner:l.yellow>l.green?'yellow':'green'};},
  hud(g,ctx,G,o){
    const lb=g.lb;let y=110;
    for(const side of ['yellow','green']){
      G.drawText(ctx,String(lb.left[side]).padStart(2,'0'),teamPal(side),224,y);
      bar(ctx,224,y+9,28,3,lb.left[side]/lb.max,side==='yellow'?'#e8d020':'#50c040');
      y+=18;}}});
})();
