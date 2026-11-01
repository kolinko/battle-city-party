(function(){
'use strict';
const BC=window.BC;
const CORNERS=[[0,192],[192,0],[192,192],[0,0]];
function clock(g,frames){const s=Math.max(0,Math.ceil(frames/60));g.timerText=Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}
function partyRules(g){g.rules.hud='party';g.rules.eagleGameOver=false;g.rules.stageClear=false;g.rules.autoFire=false;g.rules.respawnDelay=90;}
function corners(g){g.playerSpawns=CORNERS.slice();}
function playerTanks(g){return g.tanks.filter(t=>t.player!==null&&t.alive);}
function leaderBoard(g){return g.players.slice().sort((a,b)=>b.kills-a.kills);}
function fragWinner(g,limit,time){const l=leaderBoard(g);if(l[0].kills>=limit||g.frame>=time){if(l[1]&&l[1].kills===l[0].kills&&g.frame<time)return null;return {text:l[0].name+' WINS',winner:l[0].slot};}return null;}
function drawBar(ctx,x,y,w,h,f,col){ctx.fillStyle='#303030';ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.max(0,Math.min(w,Math.round(w*f))),h);}

function mirrorController(g,t,inputs){const inp=inputs[t.player];if(!inp)return;g.controlPlayer(t,{up:inp.down===true,down:inp.up===true,left:inp.right===true,right:inp.left===true,fire:inp.fire===true});}
function iceOn(g){for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++)if(g.map.get(cx,cy)===BC.EMPTY)g.map.set(cx,cy,BC.ICE);}
function iceOff(g){for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++)if(g.map.get(cx,cy)===BC.ICE)g.map.set(cx,cy,BC.EMPTY);}
function wallsOff(g){g.mut.saved=g.map.clone();for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++){const c=g.map.get(cx,cy);if(c===BC.BRICK||c===BC.STEEL)g.map.set(cx,cy,BC.EMPTY);}}
function wallsBack(g){const s=g.mut.saved;if(!s)return;
  for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++){const old=s.cell[cy*BC.GRID+cx];
    if(old!==BC.BRICK&&old!==BC.STEEL)continue;
    if(g.map.get(cx,cy)!==BC.EMPTY)continue;
    if(g.tanks.some(t=>t.alive&&BC.rectsOverlap(t.x,t.y,16,16,cx*8,cy*8,8,8)))continue;
    g.map.set(cx,cy,old);}
  g.mut.saved=null;}
const MUTATORS=[
  {name:'FAST BULLETS',tag:'FAST',fire(g,t,b){b.speed=8;}},
  {name:'ICE WORLD',tag:'ICE',on:iceOn,off:iceOff},
  {name:'NO WALLS',tag:'OPEN',on:wallsOff,off:wallsBack},
  {name:'TURBO TANKS',tag:'TURB',tank(g,t){t.speed=g.rules.playerSpeed*2;},offTank(g,t){t.speed=g.rules.playerSpeed;}},
  {name:'PIERCING SHOTS',tag:'PIER',tank(g,t){t.pierce=true;},offTank(g,t){t.pierce=false;}},
  {name:'DARKNESS',tag:'DARK',dark:true},
  {name:'ALL LEVEL 3',tag:'LVL3',tank(g,t){t.level=3;g.players[t.player].level=3;},offTank(g,t){t.level=0;g.players[t.player].level=0;}},
  {name:'MIRROR CONTROLS',tag:'MIRR',tank(g,t){t.controller=mirrorController;},offTank(g,t){t.controller=null;}}
];
function applyMutator(g,idx){const m=g.mut,prev=MUTATORS[m.cur];
  if(prev){if(prev.off)prev.off(g);if(prev.offTank)for(const t of playerTanks(g))prev.offTank(g,t);}
  m.cur=idx;m.until=g.frame+m.every;m.changes++;
  const next=MUTATORS[idx];
  if(next.on)next.on(g);
  if(next.tank)for(const t of playerTanks(g))next.tank(g,t);
  g.text(next.name,120);}
function pickMutator(g){let i=Math.floor(g.random()*MUTATORS.length);if(i>=MUTATORS.length)i=MUTATORS.length-1;if(i===g.mut.cur)i=(i+1)%MUTATORS.length;return i;}
function darkness(g,ctx,o){
  const lit=g.tanks.filter(t=>t.state==='alive');
  for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++){
    const px=cx*8+4,py=cy*8+4;let d=9999;
    for(const t of lit){const dx=px-(t.x+8),dy=py-(t.y+8),dd=Math.sqrt(dx*dx+dy*dy);if(dd<d)d=dd;}
    if(d<26)continue;
    ctx.fillStyle=d<40?'rgba(0,0,0,0.55)':'rgba(0,0,0,0.94)';
    ctx.fillRect(o.OX+cx*8,o.OY+cy*8,8,8);}}
BC.registerMode({id:'mutators',name:'Mutators',players:[2,4],
  desc:'Deathmatch where a new global rule is rolled every 20 seconds: ice everywhere, vanishing walls, darkness, reversed controls and five more. First to 12 frags, or the most after 4 minutes.',
  setup(g){partyRules(g);g.rules.friendlyFire=true;g.buildArena(0.5);corners(g);
    for(const p of g.players){p.lives=999;g.spawnPlayer(p.slot);}
    g.mut={cur:-1,until:0,every:1200,time:240*60,changes:0,saved:null,nextDrop:300};
    applyMutator(g,Math.floor(g.random()*MUTATORS.length));},
  update(g){const m=g.mut;
    if(g.frame>=m.until)applyMutator(g,pickMutator(g));
    m.nextDrop--;if(m.nextDrop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());m.nextDrop=480;}
    clock(g,m.time-g.frame);},
  onSpawn(g,t){if(!g.mut||t.player===null)return;const m=MUTATORS[g.mut.cur];if(m&&m.tank)m.tank(g,t);},
  onFire(g,t,b){const m=MUTATORS[g.mut.cur];if(m&&m.fire)m.fire(g,t,b);},
  onTankDestroyed(g,v,k){if(k&&k.player!==null&&k.player===v.player)g.players[k.player].kills--;},
  isOver(g){return fragWinner(g,12,g.mut.time);},
  hud(g,ctx,G,o){const m=MUTATORS[g.mut.cur];if(!m)return;
    if(m.dark)darkness(g,ctx,o);
    G.drawText(ctx,m.tag,o.WHITE,224,184);
    G.drawText(ctx,String(Math.max(0,Math.ceil((g.mut.until-g.frame)/60))).padStart(2,'0'),o.GREY,224,192);}});

const RELOAD=110;
function sniperController(g,t,inputs){const inp=inputs[t.player];if(!inp)return;
  g.controlPlayer(t,{up:inp.up===true,down:inp.down===true,left:inp.left===true,right:inp.right===true,fire:false});
  const fire=inp.fire===true,ready=g.frame>=t.tags.ready;
  if(fire&&!t.tags.held&&ready&&g.fire(t))t.tags.ready=g.frame+RELOAD;
  t.tags.held=fire;}
function treeArena(g){const m=g.map;m.fill(BC.EMPTY);
  for(let my=0;my<7;my++)for(let mx=0;mx<7;mx++){const r=g.random();let kind=BC.EMPTY;
    if(r<0.5)kind=BC.TREES;else if(r<0.62)kind=BC.STEEL;else if(r<0.72)kind=BC.BRICK;
    for(const [x,y] of [[mx,my],[12-mx,my],[mx,12-my],[12-mx,12-my]])m.setMeta(x,y,kind);}
  for(const [x,y] of [[0,0],[12,0],[0,12],[12,12],[6,6],[1,0],[0,1],[11,0],[12,1],[1,12],[0,11],[11,12],[12,11]])m.setMeta(x,y,BC.EMPTY);}
BC.registerMode({id:'sniper',name:'Snipers',players:[2,4],
  desc:'One shot kills and flies four times faster, but reloading takes almost two seconds (shown on a bar). The map is overgrown with trees you can drive through and hide in. First to 8 frags.',
  setup(g){partyRules(g);g.rules.friendlyFire=true;g.rules.respawnDelay=120;
    treeArena(g);corners(g);
    for(const p of g.players){p.lives=999;g.spawnPlayer(p.slot);}
    g.snp={limit:8,time:180*60};g.text('ONE SHOT ONE KILL',150);},
  update(g){clock(g,g.snp.time-g.frame);},
  onSpawn(g,t){if(t.player===null)return;t.tags.ready=0;t.tags.held=false;t.controller=sniperController;if(t.shield>60)t.shield=60;},
  onFire(g,t,b){b.speed=8;},
  onTankDestroyed(g,v,k){if(k&&k.player!==null&&k.player===v.player)g.players[k.player].kills--;},
  isOver(g){return fragWinner(g,g.snp.limit,g.snp.time);},
  hud(g,ctx,G,o){let y=24;
    for(const p of g.players){const t=p.tank;let f=0;
      if(t&&t.tags.ready!==undefined)f=t.tags.ready<=g.frame?1:1-(t.tags.ready-g.frame)/RELOAD;
      drawBar(ctx,228,y+18,24,3,f,f>=1?'#ffffff':'#c85000');y+=24;}
    for(const t of playerTanks(g)){if(t.state!=='alive'||t.tags.ready>g.frame)continue;ctx.fillStyle='#ffffff';ctx.fillRect(o.OX+t.x+7,o.OY+t.y-3,2,2);}}});

const TAG_TIME=1200;
function chooseIt(g,avoid){const pool=g.players.filter(p=>p.alive&&p.tank&&p.slot!==avoid);
  const use=pool.length?pool:g.players.filter(p=>p.alive&&p.tank);
  if(!use.length)return -1;return use[Math.floor(g.random()*use.length)].slot;}
BC.registerMode({id:'tank-tag',name:'Tank Tag',players:[2,4],
  desc:'One tank is "it" and flashes red: touching anyone passes it on. Every 20 seconds whoever is "it" loses a life. Bullets do not hurt, they only break walls. The last tank with lives left wins.',
  setup(g){partyRules(g);g.rules.friendlyFire=false;g.rules.respawnDelay=60;
    g.buildArena(0.3);corners(g);
    for(const p of g.players){p.lives=3;g.spawnPlayer(p.slot);}
    g.tag={who:-1,until:TAG_TIME,cool:90};
    g.tag.who=chooseIt(g,-1);
    if(g.tag.who>=0)g.text(g.players[g.tag.who].name+' IS IT',120);},
  update(g){const s=g.tag;if(s.cool>0)s.cool--;
    let it=s.who>=0?g.players[s.who]:null;
    if(!it||!it.alive||!it.tank){s.who=chooseIt(g,-1);it=s.who>=0?g.players[s.who]:null;if(it)g.text(it.name+' IS IT',60);}
    for(const p of g.players)if(p.tank)p.tank.bonus=(p.slot===s.who);
    clock(g,s.until-g.frame);
    if(it&&g.frame>=s.until){
      it.lives--;g.text(it.name+' LOSES A LIFE',90);
      if(it.tank)g.explode(it.tank.x-8,it.tank.y-8,true);
      if(it.lives<=0){it.lives=0;if(it.tank)g.killTank(it.tank,null,true);else it.alive=false;}
      s.until=g.frame+TAG_TIME;s.cool=90;
      const n=chooseIt(g,it.slot);s.who=n;
      if(n>=0)g.text(g.players[n].name+' IS IT',60);
      return;}
    if(!it||!it.tank||it.tank.state!=='alive'||s.cool>0)return;
    for(const o of g.tanks){
      if(o.player===null||o===it.tank||o.state!=='alive')continue;
      if(!BC.rectsOverlap(it.tank.x-3,it.tank.y-3,22,22,o.x,o.y,16,16))continue;
      s.who=o.player;s.cool=90;g.text(g.players[o.player].name+' IS IT',60);break;}},
  onTankHit(){return false;},
  isOver(g){const alive=g.players.filter(p=>p.alive);
    if(alive.length>1)return null;
    return {text:(alive[0]?alive[0].name:'NOBODY')+' WINS',winner:alive[0]?alive[0].slot:null};},
  hud(g,ctx,G,o){let y=24;
    for(const p of g.players){if(p.slot===g.tag.who)G.drawText(ctx,'IT',BC.BONUS_PALETTE,228,y+18);y+=24;}
    G.drawText(ctx,'IT',o.WHITE,16,228);}});

const BRICKS=14,BUILD_TIME=1800;
function placeBricks(g,t){
  const bx=Math.round((t.x+BC.DX[t.dir]*16)/8)*8,by=Math.round((t.y+BC.DY[t.dir]*16)/8)*8;
  let any=false;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
    const cx=bx/8+dx,cy=by/8+dy;
    if(cx<0||cy<0||cx>=BC.GRID||cy>=BC.GRID)continue;
    if(g.map.get(cx,cy)!==BC.EMPTY)continue;
    if(g.tanks.some(o=>o.alive&&BC.rectsOverlap(o.x,o.y,16,16,cx*8,cy*8,8,8)))continue;
    g.map.set(cx,cy,BC.BRICK);any=true;}
  return any;}
function buildController(g,t,inputs){const inp=inputs[t.player];if(!inp)return;
  g.controlPlayer(t,{up:inp.up===true,down:inp.down===true,left:inp.left===true,right:inp.right===true,fire:false});
  const fire=inp.fire===true,b=g.bld;
  if(fire&&!t.tags.held&&b.left[t.player]>0&&placeBricks(g,t))b.left[t.player]--;
  t.tags.held=fire;}
BC.registerMode({id:'builders',name:'Builders',players:[2,4],
  desc:'The first 30 seconds are for building: fire places a brick in front of your tank, everyone has 14 of them and nobody can be killed. Then a deathmatch to 10 frags starts on the arena you built.',
  setup(g){partyRules(g);g.rules.friendlyFire=false;g.buildArena(0.2);corners(g);
    g.bld={phase:'build',until:BUILD_TIME,time:BUILD_TIME+180*60,left:g.players.map(()=>BRICKS),nextDrop:300};
    for(const p of g.players){p.lives=999;g.spawnPlayer(p.slot);}
    g.text('BUILD PHASE',180);},
  update(g){const b=g.bld;
    if(b.phase==='build'){clock(g,b.until-g.frame);
      if(g.frame>=b.until){b.phase='fight';g.rules.friendlyFire=true;
        for(const t of g.tanks)if(t.player!==null)t.controller=null;
        g.text('FIGHT',150);}
      return;}
    clock(g,b.time-g.frame);
    b.nextDrop--;if(b.nextDrop<=0&&g.powerups.length<2){g.spawnPowerup(g.randomPowerupKind());b.nextDrop=480;}},
  onSpawn(g,t){if(t.player===null||!g.bld)return;t.tags.held=false;t.controller=g.bld.phase==='build'?buildController:null;},
  onTankHit(g){return g.bld.phase==='build'?false:undefined;},
  onTankDestroyed(g,v,k){if(k&&k.player!==null&&k.player===v.player)g.players[k.player].kills--;},
  isOver(g){if(g.bld.phase==='build')return null;return fragWinner(g,10,g.bld.time);},
  hud(g,ctx,G,o){const b=g.bld;
    G.drawText(ctx,b.phase==='build'?'BUILD PHASE':'FIGHT',o.WHITE,16,228);
    if(b.phase!=='build')return;
    let y=24;for(const p of g.players){G.drawText(ctx,'B'+String(b.left[p.slot]).padStart(2,'0'),o.WHITE,228,y+18);y+=24;}}});
})();
