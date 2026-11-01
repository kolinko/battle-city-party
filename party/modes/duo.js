(function(){
'use strict';
const BC=window.BC;
const BTN=['up','down','left','right','fire','start','select'];
function edges(st,inputs,n){
  const out=[];
  if(!st.prev)st.prev=[];
  for(let i=0;i<n;i++){const cur=(inputs&&inputs[i])||{};const p=st.prev[i]||{};const e={},now={};
    for(const b of BTN){const v=cur[b]===true;e[b]=v&&p[b]!==true;now[b]=v;}
    st.prev[i]=now;out.push(e);}
  return out;
}
function bar(ctx,x,y,w,h,frac,color){ctx.fillStyle='#303030';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x,y,Math.round(w*Math.max(0,Math.min(1,frac))),h);}
function mix(g,n,classes){const out=[];for(let i=0;i<n;i++)out.push(classes[Math.floor(g.random()*classes.length)]);return out;}
function enemies(g){return g.tanks.filter(t=>t.team==='enemy');}
function dirs(inp){return {up:inp.up===true,down:inp.down===true,left:inp.left===true,right:inp.right===true,fire:false};}
function clock(g,frames){const s=Math.max(0,Math.ceil(frames/60));g.timerText=Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}
function panel(ctx,x,y,w,h){ctx.fillStyle='rgba(0,0,0,0.92)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#f8f8f8';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);}
function checkText(s){if(!/^[A-Z0-9 .-]*$/.test(s)||s.length>22)throw Error('duo: bad briefing line: '+JSON.stringify(s));}
const BRIEF_MIN=45,BRIEF_HOLD=60;
function briefOpen(st,g,title,lines){checkText(title);for(const l of lines)checkText(l);st.brief={title,lines,open:g.frame,armed:[],held:0};}
function briefSkip(st,g){st.brief=null;g.hold=false;}
function briefStep(st,g,inputs){
  const b=st.brief;
  if(!b){g.hold=false;return false;}
  let held=false,pressed=false;
  for(let i=0;i<g.players.length;i++){const inp=(inputs&&inputs[i])||{};if(inp.fire!==true)b.armed[i]=true;else{pressed=true;if(b.armed[i]===true)held=true;}}
  if(!pressed)b.held=0;else if(held&&g.frame-b.open>=BRIEF_MIN)b.held++;
  if(b.held>=BRIEF_HOLD){st.brief=null;g.hold=false;return false;}
  g.hold=true;return true;
}
function briefHud(st,g,ctx,G,o){
  const b=st.brief;
  if(!b)return;
  const x=24,y=48,w=192,h=34+b.lines.length*10;
  panel(ctx,x,y,w,h);
  G.drawText(ctx,b.title,o.WHITE,x+8,y+6);
  ctx.fillStyle='#f8f8f8';ctx.fillRect(x+8,y+15,w-16,1);
  b.lines.forEach((l,i)=>G.drawText(ctx,l,o.GREY,x+8,y+20+i*10));
  G.drawText(ctx,'HOLD FIRE',b.held>0?o.WHITE:o.GREY,x+8,y+h-10);
  bar(ctx,x+w-72,y+h-8,64,4,b.held/BRIEF_HOLD,'#f8d848');
}
const bmCache=new Map();
function rotate(rows,k){let r=rows;for(let i=0;i<k;i++){const n=r.length,out=[];for(let y=0;y<n;y++){let s='';for(let x=0;x<n;x++)s+=r[n-1-x].charAt(y);out.push(s);}r=out;}return r;}
function bitmap(key,rows,colors){
  let b=bmCache.get(key);
  if(b)return b;
  const h=rows.length,w=rows[0].length,data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++){if(rows[y].length!==w)throw Error('duo: bitmap '+key+' row '+y+' has width '+rows[y].length);
    for(let x=0;x<w;x++){const c=colors[rows[y].charAt(x)];if(!c)continue;const o=(y*w+x)*4;data[o]=c[0];data[o+1]=c[1];data[o+2]=c[2];data[o+3]=255;}}
  b={width:w,height:h,data};bmCache.set(key,b);return b;
}
function dirBitmap(key,rows,colors,dir){return bitmap(key+':'+dir,rotate(rows,{0:0,3:1,2:2,1:3}[dir]),colors);}
const TRUCK=['.....cccccc.....','.....cbbbbc.....','.....cbbbbc.....','....wccccccw....','....wccccccw....','.....cccccc.....','...kkkkkkkkkk...','..wkkkkkkkkkkw..','..wkkkkkkkkkkw..','...kkkkkkkkkk...','...kkkkkkkkkk...','..wkkkkkkkkkkw..','..wkkkkkkkkkkw..','...kkkkkkkkkk...','...kkkkkkkkkk...','................'];
const TRUCK_C={c:[216,128,40],b:[136,208,248],w:[40,40,40],k:[104,128,168],'.':[0,0,0]};

const TD_WAVES=[
  {name:'TOURISTS',n:6,mix:[0x80],quip:'THEY JUST WANT SELFIES'},
  {name:'INTERNS',n:8,mix:[0x80,0xa0],quip:'UNPAID BUT FAST'},
  {name:'MIDDLE MGMT',n:10,mix:[0xa0,0xc0],quip:'LETS CIRCLE BACK'},
  {name:'AUDITORS',n:12,mix:[0xc0,0xe0],quip:'PER MY LAST EMAIL'},
  {name:'CONSULTANTS',n:12,mix:[0xa0,0xa0,0xc0],quip:'THEY BILL BY THE HOUR'},
  {name:'THE BOARD',n:14,mix:[0xe0,0xe0,0xc0],breach:true,quip:'STEEL MEANS NOTHING'},
  {name:'HOSTILE TAKEOVER',n:16,mix:[0xa0,0xc0,0xe0],breach:true,quip:'RESTRUCTURING BEGINS'}];
const TD_BUILDS=[{key:'BRICK',cost:1,kind:BC.BRICK,color:'#c85018'},{key:'STEEL',cost:4,kind:BC.STEEL,color:'#c0c0c0'},{key:'MOAT',cost:2,kind:BC.WATER,color:'#4060f8'},{key:'BUSH',cost:1,kind:BC.TREES,color:'#40a040'},{key:'MINE',cost:3,color:'#f84040'},{key:'TURRET',cost:6,color:'#f8f8f8'}];
const TD_BUILD=480,TD_START_MAT=12,TD_MAT_CAP=24,TD_MAX_MINES=6,TD_MAX_TURRETS=3,TD_INCOME=360,TD_TURRET_RELOAD=36;
const TD_BREACH_PAL=[0x0f,0x16,0x27,0x37],TD_TURRET_PAL=[0x0f,0x00,0x10,0x30];
function tdTarget(t){return [Math.round((t.x+BC.DX[t.dir]*16)/8)*8,Math.round((t.y+BC.DY[t.dir]*16)/8)*8];}
function tdCells(bx,by){const out=[];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)out.push([bx/8+dx,by/8+dy]);return out;}
function tdFree(g,bx,by){
  if(bx<0||by<16||bx+16>BC.FIELD||by+16>BC.FIELD)return false;
  if(tdCells(bx,by).some(([cx,cy])=>g.map.get(cx,cy)!==BC.EMPTY))return false;
  if(g.tanks.some(o=>o.alive&&BC.rectsOverlap(o.x,o.y,16,16,bx,by,16,16)))return false;
  if(g.td.mines.some(m=>m.x===bx&&m.y===by))return false;
  return true;
}
function tdPlace(g,t,kind){
  const [bx,by]=tdTarget(t);
  let any=false;
  for(const [cx,cy] of tdCells(bx,by)){
    if(cx<0||cy<2||cx>=BC.GRID||cy>=BC.GRID)continue;
    if(g.map.get(cx,cy)!==BC.EMPTY)continue;
    if(g.tanks.some(o=>o.alive&&BC.rectsOverlap(o.x,o.y,16,16,cx*8,cy*8,8,8)))continue;
    if(g.td.mines.some(m=>BC.rectsOverlap(m.x,m.y,16,16,cx*8,cy*8,8,8)))continue;
    g.map.set(cx,cy,kind);any=true;}
  return any;
}
function turretCtl(g,t){
  t.moving=false;
  let best=-1,bd=1e9;
  for(const e of g.tanks){if(e.team!=='enemy'||e.state!=='alive')continue;
    const dx=e.x-t.x,dy=e.y-t.y;let dir=-1,d=0;
    if(Math.abs(dx)<10){dir=dy<0?BC.UP:BC.DOWN;d=Math.abs(dy);}else if(Math.abs(dy)<10){dir=dx<0?BC.LEFT:BC.RIGHT;d=Math.abs(dx);}
    if(dir>=0&&d<bd){bd=d;best=dir;}}
  if(t.aiState.fire>0)t.aiState.fire--;
  if(best>=0){t.dir=best;if(t.aiState.fire<=0&&g.fire(t))t.aiState.fire=TD_TURRET_RELOAD;}
}
function tdBuild(g,t){
  const d=g.td,b=TD_BUILDS[d.sel];
  if(d.mat<b.cost){g.text('NO MATERIALS',40);return;}
  const [bx,by]=tdTarget(t);
  let ok=false;
  if(b.key==='MINE'){if(d.mines.length>=TD_MAX_MINES){g.text('MAX 6 MINES',40);return;}ok=tdFree(g,bx,by);if(ok)d.mines.push({x:bx,y:by});}
  else if(b.key==='TURRET'){if(g.tanks.filter(o=>o.tags.turret).length>=TD_MAX_TURRETS){g.text('MAX 3 TURRETS',40);return;}ok=tdFree(g,bx,by);
    if(ok)g.spawnTank({x:bx,y:by,team:'players',controller:turretCtl,hp:2,level:1,speed:0,instant:true,palette:TD_TURRET_PAL,tags:{turret:true},dir:BC.UP});}
  else ok=tdPlace(g,t,b.kind);
  if(ok){d.mat-=b.cost;d.placed++;BC.sfx('brick');}
}
function engCtl(g,t,inputs){
  const inp=inputs[t.player];if(!inp)return;
  g.controlPlayer(t,dirs(inp));
  const d=g.td,ev=(d.edge&&d.edge[t.player])||{};
  if(ev.select){d.sel=(d.sel+1)%TD_BUILDS.length;const b=TD_BUILDS[d.sel];g.text(b.key+' - COST '+b.cost,60);}
  if(ev.fire)tdBuild(g,t);
}
function tdWave(g){
  const d=g.td;d.wave++;const w=TD_WAVES[d.wave-1];d.phase='wave';
  g.rules.enemyQueue=mix(g,w.n,w.mix);g.enemiesSpawned=0;g.spawnTimer=60;g.rules.maxEnemies=Math.min(6,2+d.wave);g.rules.spawnDelay=Math.max(45,110-d.wave*10);
  g.text('WAVE '+d.wave+' - '+w.name,150);d.quipAt=g.frame+160;
}
BC.registerMode({id:'duo-tower-defense',name:'Two-Player Tower Defense',group:'duo',players:[2,2],noEagle:true,
  desc:'Player 1 shoots, player 2 builds walls, mines and turrets. 7 waves.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=true;g.rules.friendlyFire=false;g.rules.respawnDelay=90;g.rules.ownEagleHurts=false;g.rules.maxEnemies=3;g.rules.spawnDelay=100;
    g.buildArena(0.25);
    for(let cy=0;cy<4;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);
    const e=g.addEagle(96,192,'players');g.ringEagle(e,BC.BRICK);
    g.td={wave:0,phase:'build',until:g.frame+TD_BUILD,mat:TD_START_MAT,sel:0,placed:0,mines:[],edge:[],prev:[],done:null,brief:null,quipAt:0};
    g.playerSpawns=[[64,192],[128,192]];
    for(const p of g.players)p.team='players';
    g.players[0].lives=3;g.players[1].lives=999;
    g.spawnPlayer(0);g.spawnPlayer(1);
    briefOpen(g.td,g,'TOWER DEFENSE',['P1 SHOOTS. P2 BUILDS.','P2 FIRE PLACES. SELECT','PICKS THE NEXT BUILD.','MINES AND TURRETS','HIT BACK. 7 WAVES.','LATE ONES BURN STEEL.']);
  },
  skipBrief(g){briefSkip(g.td,g);},
  update(g,inputs){
    const d=g.td;d.edge=edges(d,inputs,g.players.length);
    if(briefStep(d,g,inputs)){d.until=g.frame+TD_BUILD;return;}
    if(g.frame%TD_INCOME===TD_INCOME-1)d.mat=Math.min(TD_MAT_CAP,d.mat+1);
    for(const m of d.mines.slice()){const e=g.tanks.find(o=>o.team==='enemy'&&o.state==='alive'&&BC.rectsOverlap(o.x,o.y,16,16,m.x,m.y,16,16));
      if(e){d.mines.splice(d.mines.indexOf(m),1);g.explode(m.x-8,m.y-8,true);g.killTank(e,g.players[1].tank,false);g.text('MINE',40);}}
    if(d.quipAt&&g.frame>=d.quipAt){g.text(TD_WAVES[d.wave-1].quip,120);d.quipAt=0;}
    if(d.phase==='build'){clock(g,d.until-g.frame);if(g.frame>=d.until)tdWave(g);return;}
    g.timerText='W'+d.wave;
    if(g.rules.enemyQueue.length===0&&enemies(g).length===0){
      if(d.wave>=TD_WAVES.length){d.done={text:'TOWER STANDS',winner:'players'};return;}
      d.phase='build';d.until=g.frame+Math.max(240,TD_BUILD-d.wave*40);d.mat=Math.min(TD_MAT_CAP,d.mat+4);g.text('WAVE CLEAR - BUILD',150);}
  },
  onSpawn(g,t){
    if(t.player===1){t.controller=engCtl;t.tags.eng=true;t.palette=BC.PLAYER_PALETTES[1];}
    if(t.player===0){t.level=Math.max(1,t.level);g.players[0].level=t.level;}
    if(t.team==='enemy'&&g.td.wave>0&&TD_WAVES[g.td.wave-1].breach&&t.cls===0xe0){t.level=3;t.palette=TD_BREACH_PAL;t.tags.breach=true;}
  },
  onTankHit(g,t,b,shooter){
    if(!t.tags.eng)return;
    if(shooter&&shooter.team==='enemy'&&t.shield<=0){g.td.mat=Math.max(0,g.td.mat-2);g.text('ENGINEER HIT -2',60);t.shield=60;}
    return false;
  },
  onEagleDestroyed(g){g.gameOver('TOWER FELL');},
  isOver(g){if(g.td.done)return g.td.done;const p=g.players[0];if(!p.alive&&p.tank===null)return {text:'TOWER FELL'};return null;},
  hud(g,ctx,G,o){
    const d=g.td,b=TD_BUILDS[d.sel];
    G.drawText(ctx,d.phase==='build'?'BUILD TIME':'WAVE '+d.wave+' OF '+TD_WAVES.length+' - '+TD_WAVES[d.wave-1].name,o.WHITE,16,4);
    G.drawText(ctx,'MAT '+d.mat+' '+b.key+'-'+b.cost,o.WHITE,16,228);
    G.drawText(ctx,'SEL SWAPS',o.GREY,152,228);
    for(const m of d.mines){ctx.fillStyle=((g.frame>>3)&1)?'#f84040':'#802020';ctx.fillRect(o.OX+m.x+6,o.OY+m.y+6,4,4);}
    for(const t of g.tanks){if(!t.tags.turret||t.state!=='alive')continue;bar(ctx,o.OX+t.x,o.OY+t.y+17,16,2,t.hp/t.maxHp,'#f8f8f8');}
    for(const t of g.tanks)if(t.tags.breach&&t.state==='alive')G.drawText(ctx,'X',o.WHITE,o.OX+t.x+4,Math.max(o.OY,o.OY+t.y-9));
    const t=g.players[1].tank;
    if(t&&t.state==='alive'){const [bx,by]=tdTarget(t);ctx.strokeStyle=b.color;ctx.lineWidth=1;ctx.strokeRect(o.OX+bx+0.5,o.OY+by+0.5,15,15);}
    briefHud(d,g,ctx,G,o);
  }});
const TAN_STAGES=3,TAN_CLEAR=200;
function tandemCtl(g,t,inputs){
  const d=inputs[0]||{},a=inputs[1]||{};
  if(t.aiState.stun>0){t.aiState.stun--;t.moving=false;t.lastFire=a.fire===true;return;}
  let mv=-1;if(d.right)mv=BC.RIGHT;else if(d.left)mv=BC.LEFT;else if(d.down)mv=BC.DOWN;else if(d.up)mv=BC.UP;
  let aim=-1;if(a.right)aim=BC.RIGHT;else if(a.left)aim=BC.LEFT;else if(a.down)aim=BC.DOWN;else if(a.up)aim=BC.UP;
  if(mv>=0){g.moveTank(t,mv,true);if(g.onIce(t)){t.slide=28;t.slideDir=mv;}}
  else if(t.slide>0&&g.onIce(t)){t.slide--;g.moveTank(t,t.slideDir,true);}
  else t.moving=false;
  if(aim>=0)t.dir=aim;
  t.tags.aim=aim;
  const f=a.fire===true;
  if(f&&!t.lastFire)g.fire(t);
  t.lastFire=f;
}
function tandemStage(g,n){
  g.tanks.length=0;g.bullets.length=0;g.powerups.length=0;g.eagles.length=0;
  g.loadStage(n);g.stage=n;
  const e=g.addEagle(96,192,'players');g.ringEagle(e,BC.BRICK);
  g.classicEnemyQueue();g.spawnTimer=30;g.freezeTimer=0;g.shovelTimer=0;g.tan.clear=0;
  for(const p of g.players){p.tank=null;p.respawnTimer=0;}
  g.spawnPlayer(0);
  if(!g.tan.brief)g.text('STAGE '+n,150);
}
BC.registerMode({id:'duo-tandem',name:'Tandem - Driver and Gunner',group:'duo',players:[2,2],noEagle:true,stageSelect:true,
  desc:'One tank: player 1 drives, player 2 aims and fires.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.maxEnemies=4;g.rules.spawnDelay=90;g.rules.respawnDelay=90;g.rules.ownEagleHurts=false;
    for(const p of g.players)p.team='players';
    g.players[0].lives=3;g.players[1].lives=0;
    g.tan={first:g.options.stage,clear:0,prev:[],edge:[],brief:null};
    briefOpen(g.tan,g,'TANDEM',['ONE TANK. TWO PADS.','P1 DRIVES.','P2 HOLDS A DIRECTION','TO AIM AND FIRES.','CLEAR 3 STAGES.']);
    tandemStage(g,g.options.stage);
  },
  skipBrief(g){briefSkip(g.tan,g);},
  onSpawn(g,t){if(t.player===0){t.controller=tandemCtl;t.hp=2;t.maxHp=2;t.tags.aim=-1;}},
  update(g,inputs){
    const s=g.tan;s.edge=edges(s,inputs,g.players.length);
    if(briefStep(s,g,inputs))return;
    if(g.rules.enemyQueue.length===0&&enemies(g).length===0){
      s.clear++;
      if(s.clear===1)g.text('STAGE CLEAR',TAN_CLEAR);
      if(s.clear>=TAN_CLEAR){if(g.stage-s.first+1>=TAN_STAGES)g.gameOver('TANDEM TRIUMPH',{winner:'players'});else tandemStage(g,g.stage+1);}}
    g.timerText='S'+g.stage;
  },
  onEagleDestroyed(g){g.gameOver('BASE LOST');},
  isOver(g){const p=g.players[0];if(!p.alive&&p.tank===null)return {text:'TANDEM DOWN'};return null;},
  hud(g,ctx,G,o){
    const t=g.players[0].tank;
    G.drawText(ctx,'P1 DRIVES P2 AIMS FIRES',o.GREY,16,228);
    if(t&&t.state==='alive'){ctx.fillStyle='#f8f8f8';ctx.fillRect(o.OX+t.x+7+BC.DX[t.dir]*11,o.OY+t.y+7+BC.DY[t.dir]*11,2,2);bar(ctx,o.OX+t.x,o.OY+t.y+17,16,2,t.hp/t.maxHp,'#f8b830');}
    briefHud(g.tan,g,ctx,G,o);
  }});

const CV_DEPOTS=[[192,96],[16,32],[176,176]],CV_GOAL=3,CV_TRUCK_HP=6;
function truckCtl(g,t,inputs){const inp=inputs[t.player];if(!inp)return;g.controlPlayer(t,dirs(inp));}
function truckify(g,t){t.controller=truckCtl;t.hp=CV_TRUCK_HP;t.maxHp=CV_TRUCK_HP;t.speed=0.5;t.tags.truck=true;t.level=0;g.players[1].level=0;}
function truck(g){return g.players[1].tank;}
BC.registerMode({id:'duo-convoy',name:'Convoy',group:'duo',players:[2,2],noEagle:true,
  desc:'Player 2 drives an unarmed cargo truck, player 1 escorts it. 3 deliveries.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.friendlyFire=false;g.rules.respawnDelay=90;g.rules.maxEnemies=3;g.rules.spawnDelay=120;
    g.buildArena(0.4);
    for(const [x,y] of CV_DEPOTS)g.map.setMeta(x/16,y/16,BC.EMPTY);
    for(const p of g.players)p.team='players';
    g.playerSpawns=[[96,192],[0,192]];
    g.players[0].lives=999;g.players[1].lives=2;
    g.spawnPlayer(0);g.spawnPlayer(1);
    g.cv={done:0,depot:0,final:null,prev:[],edge:[],brief:null};
    g.rules.enemyQueue=mix(g,6,[0x80,0xa0]);g.spawnTimer=120;
    briefOpen(g.cv,g,'CONVOY',['P2 DRIVES THE TRUCK.','IT CANNOT SHOOT.','P1 ESCORTS IT.','REACH 3 DEPOTS.','DO NOT SHOOT THE TRUCK']);
  },
  skipBrief(g){briefSkip(g.cv,g);},
  onSpawn(g,t){if(t.player===1)truckify(g,t);},
  update(g,inputs){
    const c=g.cv;c.edge=edges(c,inputs,g.players.length);
    if(briefStep(c,g,inputs))return;
    if(g.rules.enemyQueue.length===0)g.rules.enemyQueue=mix(g,4,[[0x80,0xa0],[0xa0,0xc0],[0xa0,0xc0,0xe0]][Math.min(2,c.done)]);
    const t=truck(g),d=CV_DEPOTS[c.depot];
    if(t&&t.state==='alive'&&BC.rectsOverlap(t.x,t.y,16,16,d[0],d[1],16,16)){
      c.done++;t.hp=t.maxHp;g.players[1].score+=1000;
      if(c.done>=CV_GOAL)c.final={text:'CONVOY DELIVERED',winner:'players'};
      else{c.depot=(c.depot+1)%CV_DEPOTS.length;g.text('DELIVERED '+c.done+' OF '+CV_GOAL,120);}}
    g.timerText='C'+c.done;
  },
  onTankHit(g,t,b,shooter){if(t.tags.truck&&shooter&&shooter.player!==null){g.text('NOT THE TRUCK',60);return false;}},
  onTankDestroyed(g,v){if(v.tags.truck)g.text('TRUCK LOST',120);},
  isOver(g){if(g.cv.final)return g.cv.final;const p=g.players[1];if(!p.alive&&p.tank===null)return {text:'CONVOY LOST'};return null;},
  hud(g,ctx,G,o){
    const c=g.cv,d=CV_DEPOTS[c.depot],t=truck(g);
    G.drawText(ctx,'CARGO '+c.done+' OF '+CV_GOAL,o.WHITE,16,4);
    if(c.final===null&&((g.frame>>3)&1)){ctx.strokeStyle='#f8d848';ctx.lineWidth=1;ctx.strokeRect(o.OX+d[0]+0.5,o.OY+d[1]+0.5,15,15);}
    if(c.final===null&&!c.brief)G.drawText(ctx,'DEPOT',o.WHITE,Math.max(o.OX,Math.min(o.OX+168,o.OX+d[0]-12)),d[1]>=192?o.OY+d[1]-9:o.OY+d[1]+17);
    if(t&&t.state==='alive'){ctx.drawImage(dirBitmap('truck',TRUCK,TRUCK_C,t.dir),o.OX+t.x,o.OY+t.y);bar(ctx,o.OX+t.x,o.OY+t.y+17,16,2,t.hp/t.maxHp,'#40d060');}
    briefHud(c,g,ctx,G,o);
  }});
})();
