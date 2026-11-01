(function(){
'use strict';
const BC=window.BC;
const BTN=['up','down','left','right','fire','start','select'];
const CORNERS=[[0,192],[192,0],[192,192],[0,0]];
function edges(st,inputs,n){
  const out=[];
  if(!st.prev)st.prev=[];
  for(let i=0;i<n;i++){const cur=(inputs&&inputs[i])||{};const p=st.prev[i]||{};const e={},now={};
    for(const b of BTN){const v=cur[b]===true;e[b]=v&&p[b]!==true;now[b]=v;}
    st.prev[i]=now;out.push(e);}
  return out;
}
function frozen(g,t){t.moving=false;}
function panel(ctx,x,y,w,h){ctx.fillStyle='rgba(0,0,0,0.9)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);}
function bar(ctx,x,y,w,h,frac,color){ctx.fillStyle='#3a3a3a';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x,y,Math.round(w*Math.max(0,Math.min(1,frac))),h);}
function pcol(G,p){const c=G.PAL[p.palette[3]&63];return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}
function secs(f){return String(Math.max(0,Math.ceil(f/60)));}
function clearField(g){g.tanks.length=0;g.bullets.length=0;g.powerups.length=0;g.effects.length=0;for(const p of g.players){p.tank=null;p.respawnTimer=0;}}
function clock(g,frames){const s=Math.max(0,Math.ceil(frames/60));g.timerText=Math.floor(s/60)+'.'+String(s%60).padStart(2,'0');}

const RPG_OPTS=[{key:'speed',label:'SPEED',max:5},{key:'gun',label:'GUN',max:3},{key:'armor',label:'ARMOR',max:4},{key:'twin',label:'TWIN GUN',max:1}];
const RPG_STAGES=5,RPG_PICK=480;
function rpgNeed(l){return 2*l;}
function rpgApply(g,t){
  if(t.player===null)return;
  const s=g.rpg.st[t.player];
  t.speed=g.rules.playerSpeed+0.15*s.speed;
  t.maxHp=1+s.armor;t.hp=t.maxHp;
  let lvl=0;if(s.gun>=1)lvl=1;if(s.twin>=1&&lvl<2)lvl=2;if(s.gun>=3)lvl=3;
  t.level=lvl;t.pierce=s.gun>=2;g.players[t.player].level=lvl;
}
function rpgTake(g){
  const r=g.rpg,c=r.choice,o=c.opts[c.sel],p=g.players[c.slot];
  r.st[c.slot][o.key]++;
  const t=p.tank;
  if(t){t.controller=null;t.shield=Math.max(t.shield,90);rpgApply(g,t);}
  g.text(p.name+' '+o.label,90);r.choice=null;
}
function rpgStage(g,n){
  clearField(g);g.eagles.length=0;g.loadStage(n);g.addEagle(96,192,'players');g.classicEnemyQueue();
  g.spawnTimer=30;g.freezeTimer=0;g.shovelTimer=0;g.rpg.clear=0;
  for(const p of g.players)if(p.alive)g.spawnPlayer(p.slot);
  g.text('STAGE '+n,150);
}
BC.registerMode({id:'rpg',name:'RPG',players:[1,4],desc:'Co-op campaign with character progression: every enemy gives you experience, and at each new level you pick an upgrade with your pad (speed, gun, armor, double shot). Your tanks grow over five stages.',
  setup(g){
    g.rules.hud='party';g.rules.maxEnemies=g.players.length>2?6:4;g.rules.spawnDelay=70;g.rules.respawnDelay=90;g.rules.ownEagleHurts=false;
    g.rpg={st:g.players.map(()=>({speed:0,gun:0,armor:0,twin:0})),xp:g.players.map(()=>0),lvl:g.players.map(()=>1),choice:null,queue:[],clear:0};
    g.playerSpawns=[[64,192],[128,192],[32,192],[160,192]];
    rpgStage(g,1);},
  update(g,inputs){
    const r=g.rpg,e=edges(r,inputs,g.players.length);
    if(!r.choice&&r.queue.length){const slot=r.queue.shift(),opts=RPG_OPTS.filter(o=>r.st[slot][o.key]<o.max);
      if(opts.length)r.choice={slot,opts,sel:0,open:g.frame,armed:false};}
    const c=r.choice;
    if(c){
      const t=g.players[c.slot].tank;
      if(t){t.controller=frozen;t.shield=Math.max(t.shield,3);t.moving=false;}
      const ev=e[c.slot]||{},age=g.frame-c.open,inp=(inputs&&inputs[c.slot])||{};
      if(inp.fire!==true)c.armed=true;
      if(ev.up)c.sel=(c.sel+c.opts.length-1)%c.opts.length;
      if(ev.down)c.sel=(c.sel+1)%c.opts.length;
      if((ev.fire&&c.armed&&age>=10)||age>=RPG_PICK)rpgTake(g);}
    g.hold=r.choice!==null;
    g.timerText='S'+g.stage;},
  onSpawn(g,t){if(t.player!==null)rpgApply(g,t);},
  onTankDestroyed(g,v,k){
    const r=g.rpg;
    if(v.player===null&&v.team==='enemy'&&k&&k.player!==null){
      const s=k.player;r.xp[s]+=1+Math.floor((v.score||100)/100);
      while(r.xp[s]>=rpgNeed(r.lvl[s])){r.xp[s]-=rpgNeed(r.lvl[s]);r.lvl[s]++;r.queue.push(s);g.text(g.players[s].name+' LEVEL '+r.lvl[s],90);}}
    if(v.player!==null&&r.choice&&r.choice.slot===v.player)rpgTake(g);},
  onStageClear(g){
    const r=g.rpg;r.clear++;
    if(r.clear===1)g.text('STAGE CLEAR',180);
    if(r.clear>=180){if(g.stage>=RPG_STAGES)g.gameOver('CAMPAIGN CLEAR',{winner:'players'});else rpgStage(g,g.stage+1);}},
  hud(g,ctx,G,o){
    const r=g.rpg;
    for(const p of g.players){const x=4+p.slot*52,l=r.lvl[p.slot];
      G.drawText(ctx,'P'+(p.slot+1),p.palette,x,4);
      G.drawText(ctx,'L'+l,o.WHITE,x+18,4);
      bar(ctx,x+36,6,12,4,r.xp[p.slot]/rpgNeed(l),pcol(G,p));}
    const c=r.choice;
    if(!c)return;
    const w=136,h=22+c.opts.length*10,x=(256-w)/2,y=136,p=g.players[c.slot];
    panel(ctx,x,y,w,h);
    G.drawText(ctx,p.name+' LEVEL UP',p.palette,x+6,y+5);
    G.drawText(ctx,secs(RPG_PICK-(g.frame-c.open)),o.GREY,x+w-14,y+5);
    c.opts.forEach((op,i)=>{const yy=y+17+i*10;
      if(i===c.sel){ctx.fillStyle='rgba(255,210,74,0.35)';ctx.fillRect(x+3,yy-1,w-6,10);}
      G.drawText(ctx,op.label+' '+r.st[c.slot][op.key],i===c.sel?o.WHITE:o.GREY,x+6,yy);});}});

const ROG_PERKS=[{key:'speed',label:'SPEED'},{key:'armor',label:'ARMOR'},{key:'rapid',label:'RAPID'},{key:'twin',label:'TWIN GUN'},{key:'shield',label:'SHIELD'},{key:'steel',label:'STEEL'}];
const ROG_ROUNDS=5,ROG_DRAFT=420,ROG_TIME=2700;
function rogApply(g,t){
  if(t.player===null)return;
  const s=g.rog.st[t.player];
  t.speed=g.rules.playerSpeed+0.2*s.speed;t.maxHp=1+s.armor;t.hp=t.maxHp;
  let lvl=0;if(s.rapid)lvl=1;if(s.twin&&lvl<2)lvl=2;if(s.steel)lvl=3;
  t.level=lvl;g.players[t.player].level=lvl;t.shield=Math.max(t.shield,60+s.shield*150);
}
function rogDraft(g){
  const r=g.rog,pool=ROG_PERKS.slice(),opts=[];
  for(let i=0;i<3;i++)opts.push(pool.splice(Math.floor(g.random()*pool.length),1)[0]);
  clearField(g);r.phase='draft';r.opts=opts;r.sel=g.players.map(()=>0);r.done=g.players.map(()=>false);r.armed=g.players.map(()=>false);r.open=g.frame;
  g.text('DRAFT '+r.round,120);
}
function rogStart(g){
  const r=g.rog;clearField(g);r.phase='fight';
  g.buildArena(0.3+g.random()*0.3);
  g.playerSpawns=CORNERS.slice();
  for(const p of g.players){p.lives=0;p.alive=true;g.spawnPlayer(p.slot);}
  const n=4+r.round*2,q=[],pool=r.round<2?[0x80,0xa0]:[0x80,0xa0,0xc0,0xe0];
  for(let i=0;i<n;i++)q.push(pool[Math.floor(g.random()*pool.length)]);
  g.rules.enemyQueue=q;g.enemiesSpawned=0;g.spawnTimer=60;g.rules.maxEnemies=Math.min(6,2+r.round);
  r.start=g.frame;g.text('ROUND '+r.round,120);
}
function rogWinner(g){
  const r=g.rog,s=g.players.slice().sort((a,b)=>(r.win[b.slot]-r.win[a.slot])||(b.kills-a.kills)||(b.score-a.score));
  if(s[1]&&r.win[s[1].slot]===r.win[s[0].slot]&&s[1].kills===s[0].kills)return {text:'DRAW'};
  return {text:s[0].name+' WINS',winner:s[0].slot};
}
BC.registerMode({id:'roguelite',name:'Roguelite',players:[1,4],desc:'Five rounds on random arenas, one life per round. Before each round there is a draft: three random upgrades, and every player picks one with their pad. Whoever survives the most rounds wins.',noEagle:true,
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.friendlyFire=true;g.rules.respawnDelay=60;
    g.rog={phase:'draft',round:1,st:g.players.map(()=>({speed:0,armor:0,rapid:0,twin:0,shield:0,steel:0})),win:g.players.map(()=>0),opts:[],sel:[],done:[],open:0,start:0,final:null};
    g.buildArena(0.4);rogDraft(g);},
  update(g,inputs){
    const r=g.rog,e=edges(r,inputs,g.players.length);
    if(r.phase==='draft'){
      g.timerText=secs(ROG_DRAFT-(g.frame-r.open));
      for(const p of g.players){const ev=e[p.slot]||{},inp=(inputs&&inputs[p.slot])||{};if(r.done[p.slot])continue;
        if(inp.fire!==true)r.armed[p.slot]=true;
        if(ev.up)r.sel[p.slot]=(r.sel[p.slot]+2)%3;
        if(ev.down)r.sel[p.slot]=(r.sel[p.slot]+1)%3;
        if(ev.fire&&r.armed[p.slot]&&g.frame-r.open>20){r.done[p.slot]=true;r.st[p.slot][r.opts[r.sel[p.slot]].key]++;g.text(p.name+' '+r.opts[r.sel[p.slot]].label,60);}}
      if(r.done.every(Boolean)||g.frame-r.open>=ROG_DRAFT){
        for(const p of g.players)if(!r.done[p.slot]){r.done[p.slot]=true;r.st[p.slot][r.opts[r.sel[p.slot]].key]++;}
        rogStart(g);}
      return;}
    if(r.phase==='inter'){if(g.frame>=r.open){if(r.round>ROG_ROUNDS)r.final=rogWinner(g);else rogDraft(g);}return;}
    clock(g,ROG_TIME-(g.frame-r.start));
    const alive=g.players.filter(p=>p.alive).length;
    const cleared=g.rules.enemyQueue.length===0&&!g.tanks.some(t=>t.team==='enemy');
    if(alive===0||cleared||g.frame-r.start>=ROG_TIME){
      for(const p of g.players)if(p.alive){r.win[p.slot]++;p.score+=200;}
      g.text(cleared?'ROUND CLEARED':'ROUND OVER',120);
      clearField(g);r.round++;r.phase='inter';r.open=g.frame+150;}},
  onSpawn(g,t){if(t.player!==null)rogApply(g,t);},
  isOver(g){return g.rog.final;},
  hud(g,ctx,G,o){
    const r=g.rog;
    G.drawText(ctx,'ROUND '+Math.min(r.round,ROG_ROUNDS)+' OF '+ROG_ROUNDS,o.WHITE,4,4);
    for(const p of g.players)G.drawText(ctx,String(r.win[p.slot]),p.palette,120+p.slot*16,4);
    if(r.phase!=='draft')return;
    const w=152,h=52,x=(256-w)/2,y=136;
    panel(ctx,x,y,w,h);
    G.drawText(ctx,'PICK ONE',o.WHITE,x+6,y+4);
    G.drawText(ctx,secs(ROG_DRAFT-(g.frame-r.open)),o.GREY,x+w-14,y+4);
    r.opts.forEach((op,i)=>{const yy=y+16+i*11;
      G.drawText(ctx,op.label,o.WHITE,x+30,yy);
      for(const p of g.players){if(r.sel[p.slot]!==i)continue;
        ctx.fillStyle=pcol(G,p);ctx.globalAlpha=r.done[p.slot]?1:0.5;
        ctx.fillRect(x+5+p.slot*6,yy,5,7);ctx.globalAlpha=1;}});}});

const SHOP_ITEMS=[{key:'armor',label:'ARMOR',cost:3,max:4},{key:'speed',label:'SPEED',cost:2,max:4},{key:'gun',label:'GUN',cost:4,max:3},{key:'shield',label:'SHIELD',cost:2,max:3}];
const SHOP_WINS=3,SHOP_TARGET=5,SHOP_TIME=2700,SHOP_PHASE=720,SHOP_MAX=7;
function shopApply(g,t){
  if(t.player===null)return;
  const s=g.shop.st[t.player];
  t.speed=g.rules.playerSpeed+0.15*s.speed;t.maxHp=1+s.armor;t.hp=t.maxHp;
  let lvl=0;if(s.gun>=1)lvl=1;if(s.gun>=2)lvl=2;if(s.gun>=3)lvl=3;
  t.level=lvl;g.players[t.player].level=lvl;t.shield=Math.max(t.shield,90+s.shield*120);
}
function shopRound(g){
  const r=g.shop;clearField(g);r.phase='fight';
  g.buildArena(0.45+g.random()*0.15);g.playerSpawns=CORNERS.slice();
  for(const p of g.players){p.lives=999;p.alive=true;r.rk[p.slot]=0;g.spawnPlayer(p.slot);}
  r.start=g.frame;g.text('ROUND '+r.round,120);
}
function shopOpen(g){
  const r=g.shop;clearField(g);r.phase='shop';r.sel=g.players.map(()=>0);r.ready=g.players.map(()=>false);r.armed=g.players.map(()=>false);r.open=g.frame;
  g.text('SHOP',120);
}
function shopWinner(g){
  const r=g.shop,s=g.players.slice().sort((a,b)=>(r.win[b.slot]-r.win[a.slot])||(b.kills-a.kills));
  if(s[1]&&r.win[s[1].slot]===r.win[s[0].slot]&&s[1].kills===s[0].kills)return {text:'DRAW'};
  return {text:s[0].name+' WINS',winner:s[0].slot};
}
BC.registerMode({id:'shop-rounds',name:'Shop Rounds',players:[2,4],desc:'Round-based deathmatch: a frag is a point, and between rounds everyone spends points in the shop on armor, speed, gun and shield. First to three round wins.',noEagle:true,
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.friendlyFire=true;g.rules.respawnDelay=90;
    g.shop={phase:'fight',round:1,st:g.players.map(()=>({armor:0,speed:0,gun:0,shield:0})),pts:g.players.map(()=>0),win:g.players.map(()=>0),rk:g.players.map(()=>0),sel:[],ready:[],open:0,start:0,final:null};
    shopRound(g);},
  update(g,inputs){
    const r=g.shop,e=edges(r,inputs,g.players.length);
    if(r.phase==='shop'){
      const left=SHOP_PHASE-(g.frame-r.open);g.timerText=secs(left);
      for(const p of g.players){const ev=e[p.slot]||{},inp=(inputs&&inputs[p.slot])||{};if(r.ready[p.slot])continue;
        if(inp.fire!==true)r.armed[p.slot]=true;
        if(ev.up)r.sel[p.slot]=(r.sel[p.slot]+SHOP_ITEMS.length-1)%SHOP_ITEMS.length;
        if(ev.down)r.sel[p.slot]=(r.sel[p.slot]+1)%SHOP_ITEMS.length;
        if(ev.start||ev.select)r.ready[p.slot]=true;
        if(ev.fire&&r.armed[p.slot]){const it=SHOP_ITEMS[r.sel[p.slot]],own=r.st[p.slot][it.key];
          if(own<it.max&&r.pts[p.slot]>=it.cost){r.pts[p.slot]-=it.cost;r.st[p.slot][it.key]++;g.text(p.name+' '+it.label,50);}}}
      if(r.ready.every(Boolean)||left<=0)shopRound(g);
      return;}
    clock(g,SHOP_TIME-(g.frame-r.start));
    const top=g.players.slice().sort((a,b)=>r.rk[b.slot]-r.rk[a.slot])[0];
    if(r.rk[top.slot]>=SHOP_TARGET||g.frame-r.start>=SHOP_TIME){
      const tie=g.players.filter(p=>r.rk[p.slot]===r.rk[top.slot]).length>1;
      if(!tie&&r.rk[top.slot]>0){r.win[top.slot]++;r.pts[top.slot]+=2;g.text(top.name+' TAKES ROUND',150);}
      else g.text('ROUND DRAW',150);
      if(r.win[top.slot]>=SHOP_WINS&&!tie)r.final={text:top.name+' WINS',winner:top.slot};
      else if(r.round>=SHOP_MAX)r.final=shopWinner(g);
      else {r.round++;shopOpen(g);}}},
  onSpawn(g,t){if(t.player!==null)shopApply(g,t);},
  onTankDestroyed(g,v,k){
    const r=g.shop;
    if(v.player===null||!k||k.player===null)return;
    if(k.player===v.player){g.players[k.player].kills--;return;}
    r.rk[k.player]++;r.pts[k.player]++;},
  isOver(g){return g.shop.final;},
  hud(g,ctx,G,o){
    const r=g.shop;
    G.drawText(ctx,'ROUND '+r.round,o.WHITE,4,4);
    for(const p of g.players){G.drawText(ctx,String(r.win[p.slot]),p.palette,112+p.slot*24,4);G.drawText(ctx,String(r.pts[p.slot]),o.GREY,120+p.slot*24,4);}
    if(r.phase!=='shop')return;
    const w=160,h=68,x=(256-w)/2,y=136;
    panel(ctx,x,y,w,h);
    G.drawText(ctx,'SHOP',o.WHITE,x+6,y+4);
    G.drawText(ctx,secs(SHOP_PHASE-(g.frame-r.open)),o.GREY,x+w-14,y+4);
    SHOP_ITEMS.forEach((it,i)=>{const yy=y+16+i*12;
      G.drawText(ctx,it.label,o.WHITE,x+30,yy);
      G.drawText(ctx,String(it.cost),o.GREY,x+w-40,yy);
      for(const p of g.players){if(r.sel[p.slot]!==i)continue;
        ctx.fillStyle=pcol(G,p);ctx.globalAlpha=r.ready[p.slot]?1:0.5;
        ctx.fillRect(x+5+p.slot*6,yy,5,7);ctx.globalAlpha=1;}
      for(const p of g.players)G.drawText(ctx,String(r.st[p.slot][it.key]),p.palette,x+w-30+p.slot*7,yy);});}});

const GAU_CLASSES=[{cls:0x80,label:'B',cost:1},{cls:0xa0,label:'F',cost:2},{cls:0xc0,label:'P',cost:3},{cls:0xe0,label:'A',cost:4}];
const GAU_WAVES=5,GAU_MAXEN=4,GAU_DROPS=[0,1,2,3,5],GAU_REGEN=90,GAU_ENMAX=5;
function gauQuota(w){return 4+w*2;}
function gauSpawn(g,t){
  const d=t.tags.dir,c=GAU_CLASSES[d.cls];
  if(d.en<c.cost)return;
  if(g.tanks.filter(x=>x.team==='enemy').length>=GAU_MAXEN)return;
  const x=Math.max(0,Math.min(192,Math.round(t.x/8)*8)),y=16;
  if(g.tanks.some(o=>BC.rectsOverlap(o.x,o.y,16,16,x,y,16,16)))return;
  d.en-=c.cost;
  g.spawnTank({x,y,cls:c.cls,team:'enemy',dir:BC.DOWN});
}
function gauCtl(g,t,inputs){
  const d=t.tags.dir,ev=(g.gau.edge&&g.gau.edge[t.player])||{},inp=(inputs&&inputs[t.player])||{};
  if(inp.left)g.moveTank(t,BC.LEFT,true);
  else if(inp.right)g.moveTank(t,BC.RIGHT,true);
  else t.moving=false;
  t.y=0;t.dir=BC.DOWN;
  if(ev.up)d.cls=(d.cls+GAU_CLASSES.length-1)%GAU_CLASSES.length;
  if(ev.down)d.cls=(d.cls+1)%GAU_CLASSES.length;
  if(ev.fire)gauSpawn(g,t);
}
function gauDirector(g,i,x,dir){
  const p=g.players[i];p.team='director';p.lives=1;p.alive=true;p.respawnTimer=0;
  return g.spawnTank({x,y:0,player:i,team:'director',dir:BC.DOWN,instant:true,speed:1.1,ai:false,controller:gauCtl,tags:{dir:dir||{cls:0,en:2}}});
}
BC.registerMode({id:'gauntlet',name:'Gauntlet',players:[2,4],desc:'Player 1 defends the eagle against enemy waves while the others direct the attack: their tanks ride along the top lane, pick an enemy type with the d-pad and spend energy to spawn it in their column with fire. The defender wins after five waves.',noEagle:true,
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.friendlyFire=false;g.rules.respawnDelay=120;g.rules.ownEagleHurts=false;g.rules.maxEnemies=GAU_MAXEN;
    g.buildArena(0.45);
    for(let cy=0;cy<4;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);
    const e=g.addEagle(96,192,'players');g.ringEagle(e,BC.BRICK);
    for(let cx=e.x/8-1;cx<=e.x/8+2;cx++)g.map.set(cx,e.y/8-1,BC.STEEL);
    g.gau={wave:1,left:gauQuota(1),edge:null,idle:0,drop:0,done:null};
    const p0=g.players[0];p0.team='players';p0.lives=4;
    g.playerSpawns=[[64,192],[128,192],[32,192],[160,192]];
    g.spawnPlayer(0);
    const xs=[16,96,176];
    for(let i=1;i<g.players.length;i++)gauDirector(g,i,xs[i-1],null);
    g.text('DEFEND THE EAGLE',150);},
  update(g,inputs){
    const d=g.gau;d.edge=edges(d,inputs,g.players.length);
    if(g.frame%GAU_REGEN===0)for(let i=1;i<g.players.length;i++){const t=g.players[i].tank;if(t&&t.tags.dir)t.tags.dir.en=Math.min(GAU_ENMAX,t.tags.dir.en+1);}
    const enemies=g.tanks.filter(t=>t.team==='enemy').length;
    if(enemies===0){d.idle++;if(d.idle>=300){d.idle=0;g.spawnTank({x:Math.floor(g.random()*12)*16,y:16,cls:0x80,team:'enemy',dir:BC.DOWN});}}
    else d.idle=0;
    d.drop++;
    if(d.drop>=1200&&g.powerups.length===0){d.drop=0;g.spawnPowerup(GAU_DROPS[Math.floor(g.random()*GAU_DROPS.length)],Math.floor(g.random()*12)*16,48+Math.floor(g.random()*8)*16);}
    g.timerText=String(d.left);
    const p0=g.players[0];
    if(!p0.alive&&p0.tank===null&&!d.done)d.done={text:'DIRECTORS WIN',winner:'directors'};},
  onTankHit(g,t,b,shooter){if(t.team==='director')return false;},
  onTankDestroyed(g,v,k){
    const d=g.gau;
    if(v.team==='enemy'){d.left--;
      if(d.left<=0){if(d.wave>=GAU_WAVES)d.done={text:'DEFENDER WINS',winner:0};
        else{d.wave++;d.left=gauQuota(d.wave);g.text('WAVE '+d.wave,120);}}}
    if(v.team==='director')gauDirector(g,v.player,v.x,v.tags.dir);},
  onEagleDestroyed(g){g.gameOver('DIRECTORS WIN',{winner:'directors'});},
  isOver(g){return g.gau.done;},
  hud(g,ctx,G,o){
    const d=g.gau;
    G.drawText(ctx,'WAVE '+d.wave+' OF '+GAU_WAVES,o.WHITE,4,228);
    G.drawText(ctx,'LEFT '+d.left,o.GREY,96,228);
    for(let i=1;i<g.players.length;i++){const p=g.players[i],t=p.tank;if(!t||!t.tags.dir)continue;
      const c=GAU_CLASSES[t.tags.dir.cls],x=Math.max(0,Math.min(232,o.OX+t.x));
      G.drawText(ctx,c.label+t.tags.dir.en,p.palette,x,4);}}});
})();
