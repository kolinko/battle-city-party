(function(root){
'use strict';
const A=root.BC_ASSETS;
const EMPTY=0,BRICK=1,STEEL=2,WATER=3,TREES=4,ICE=5,EAGLE=6;
const CODE_TO_CELL={0:BRICK,1:BRICK,2:BRICK,3:BRICK,4:BRICK,5:STEEL,6:STEEL,7:STEEL,8:STEEL,9:STEEL,10:WATER,11:TREES,12:ICE,13:EMPTY,14:EMPTY,15:EMPTY};
const TILE_TO_CELL={0x0f:BRICK,0x10:STEEL,0x20:STEEL,0x12:WATER,0x22:TREES,0x21:ICE,0:EMPTY};
const UP=0,LEFT=1,DOWN=2,RIGHT=3;
const DX=[0,-1,0,1],DY=[-1,0,1,0];
const FIELD=208,SUB=8,GRID=26;
const ENEMY_CLASSES={0x80:{name:'basic',speed:0.5,bulletSpeed:2,hp:1,score:100},0xa0:{name:'fast',speed:1,bulletSpeed:2,hp:1,score:200},0xc0:{name:'power',speed:0.5,bulletSpeed:4,hp:1,score:300},0xe0:{name:'armor',speed:0.5,bulletSpeed:2,hp:4,score:400}};
const POWERUPS=['helmet','clock','shovel','star','grenade','tank'];
const PLAYER_PALETTES=[[0x0f,0x18,0x27,0x38],[0x0f,0x0a,0x1b,0x3b],[0x0f,0x01,0x12,0x2c],[0x0f,0x05,0x15,0x25]];
const ENEMY_PALETTE=[0x0f,0x0c,0x10,0x20],BONUS_PALETTE=[0x0f,0x04,0x16,0x20];
const PLAYER_SPAWNS=[[64,192],[128,192],[32,192],[160,192]];
const ENEMY_SPAWNS=[[0,0],[96,0],[192,0]];
const HELMET_FRAMES=640,CLOCK_FRAMES=640,SHOVEL_FRAMES=1280,SHOVEL_BLINK=192,SPAWN_FRAMES=28,RESPAWN_SHIELD=192,BULLET_IMPACT_FRAMES=9;

function rng(seed){let s=seed>>>0||1;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

class Map26{
  constructor(){this.cell=new Uint8Array(GRID*GRID);this.tile=new Uint8Array(GRID*GRID);this.tileAttr=new Uint8Array(GRID*GRID);}
  idx(cx,cy){return cy*GRID+cx;}
  get(cx,cy){if(cx<0||cy<0||cx>=GRID||cy>=GRID)return STEEL;return this.cell[cy*GRID+cx];}
  set(cx,cy,kind){if(cx<0||cy<0||cx>=GRID||cy>=GRID)return;const i=cy*GRID+cx;this.cell[i]=kind;this.tile[i]={[EMPTY]:0,[BRICK]:0x0f,[STEEL]:0x10,[WATER]:0x12,[TREES]:0x22,[ICE]:0x21,[EAGLE]:0}[kind];this.tileAttr[i]={[EMPTY]:0,[BRICK]:0,[STEEL]:3,[WATER]:1,[TREES]:2,[ICE]:3,[EAGLE]:0}[kind];}
  setMeta(mx,my,kind){for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)this.set(mx*2+dx,my*2+dy,kind);}
  loadStage(codes){for(let my=0;my<13;my++)for(let mx=0;mx<13;mx++){const code=codes[my][mx],tiles=A.metaTiles[code],attr=A.metaAttr[code];for(let k=0;k<4;k++){const cx=mx*2+(k&1),cy=my*2+(k>>1),i=cy*GRID+cx,t=tiles[k];if(TILE_TO_CELL[t]===undefined)throw Error('unknown bg tile '+t+' for code '+code);this.cell[i]=TILE_TO_CELL[t];this.tile[i]=t;this.tileAttr[i]=attr;}}}
  fill(kind){for(let cy=0;cy<GRID;cy++)for(let cx=0;cx<GRID;cx++)this.set(cx,cy,kind);}
  clone(){const m=new Map26();m.cell.set(this.cell);m.tile.set(this.tile);m.tileAttr.set(this.tileAttr);return m;}
}

function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}

class Game{
  constructor(mode,options){
    this.mode=mode;this.options=Object.assign({playerCount:1,seed:12345,stage:1},options);
    this.random=rng(this.options.seed);
    this.frame=0;this.map=new Map26();this.tanks=[];this.bullets=[];this.powerups=[];this.effects=[];this.eagles=[];this.texts=[];
    this.players=[];for(let i=0;i<this.options.playerCount;i++)this.players.push({slot:i,team:'players',lives:3,score:0,level:0,tank:null,respawnTimer:0,palette:PLAYER_PALETTES[i],kills:0,killsByCls:{128:0,160:0,192:0,224:0},deaths:0,alive:true,name:'P'+(i+1)});
    this.rules={friendlyFire:false,eagleGameOver:true,enemyQueue:[],maxEnemies:4,spawnDelay:90,autoFire:false,playerSpeed:0.75,playerRespawn:true,bulletVsBullet:true,respawnDelay:60,enemyBonusEvery:[4,11,18],stageClear:true,hud:'classic',powerupsForAll:true,ownEagleHurts:true};
    this.playerSpawns=PLAYER_SPAWNS.map(s=>s.slice());this.timerText='';
    this.state='playing';this.result=null;this.hold=false;this.stage=this.options.stage;this.freezeTimer=0;this.shovelTimer=0;this.spawnTimer=0;this.enemiesSpawned=0;this.enemyIdSeq=0;
    this.mode.setup(this);
    if(this.rules.stageClear&&this.eagles.length===0&&this.mode.noEagle!==true)this.addEagle(96,192,'players');
  }
  loadStage(n){this.stage=n;this.map.loadStage(A.stages[(n-1)%35]);}
  addEagle(x,y,team){const e={x,y,team,alive:true,id:this.eagles.length};this.eagles.push(e);for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const cx=x/8+dx,cy=y/8+dy;this.map.cell[cy*GRID+cx]=EAGLE;this.map.tile[cy*GRID+cx]=0;}return e;}
  classicEnemyQueue(){this.rules.enemyQueue=A.rosters[(this.stage-1)%35].slice();this.enemiesSpawned=0;}
  text(msg,frames){this.texts.push({msg,until:this.frame+(frames===undefined?120:frames)});}
  spawnTank(spec){
    const cls=spec.cls===undefined?null:ENEMY_CLASSES[spec.cls];
    const t={id:++this.enemyIdSeq,x:spec.x,y:spec.y,dir:spec.dir===undefined?(spec.player===undefined?DOWN:UP):spec.dir,team:spec.team,player:spec.player===undefined?null:spec.player,cls:spec.cls===undefined?null:spec.cls,
      speed:spec.speed!==undefined?spec.speed:(cls?cls.speed:this.rules.playerSpeed),bulletSpeed:spec.bulletSpeed!==undefined?spec.bulletSpeed:(cls?cls.bulletSpeed:2),hp:spec.hp!==undefined?spec.hp:(cls?cls.hp:1),maxHp:0,
      maxBullets:spec.maxBullets!==undefined?spec.maxBullets:1,pierce:spec.pierce===true,level:spec.level!==undefined?spec.level:0,palette:spec.palette||(cls?ENEMY_PALETTE:PLAYER_PALETTES[0]),
      state:'spawning',timer:spec.instant?0:SPAWN_FRAMES,shield:spec.shield!==undefined?spec.shield:0,bonus:spec.bonus===true,ai:spec.ai===undefined?(spec.player===undefined):spec.ai,aiState:{timer:0,fire:0,turnWait:0},moving:false,walk:0,acc:0,slide:0,slideDir:0,lastFire:false,reload:0,hitFlash:0,alive:true,score:cls?cls.score:(spec.score||0),controller:spec.controller||null,tags:spec.tags||{}};
    t.maxHp=t.hp;
    if(spec.player!==undefined){const p=this.players[spec.player];p.tank=t;t.level=spec.level!==undefined?spec.level:p.level;t.palette=spec.palette||p.palette;t.team=spec.team||p.team;}
    this.tanks.push(t);if(spec.player!==undefined)BC.sfx('spawn');if(this.mode.onSpawn)this.mode.onSpawn(this,t);return t;
  }
  spawnEnemyFromQueue(){
    if(this.rules.enemyQueue.length===0)return null;
    const living=this.tanks.filter(t=>t.player===null&&t.team==='enemy').length;if(living>=this.rules.maxEnemies)return null;
    const cls=this.rules.enemyQueue.shift();this.enemiesSpawned++;
    const remaining=this.rules.enemyQueue.length+1;const bonus=this.rules.enemyBonusEvery.includes(this.enemiesSpawned);
    const sp=ENEMY_SPAWNS[this.enemiesSpawned%3];
    if(this.tanks.some(t=>rectsOverlap(t.x,t.y,16,16,sp[0],sp[1],16,16))){this.rules.enemyQueue.unshift(cls);this.enemiesSpawned--;return null;}
    return this.spawnTank({x:sp[0],y:sp[1],cls,team:'enemy',bonus,dir:DOWN});
  }
  spawnPlayer(i,spec){const p=this.players[i];let sp=this.playerSpawns[i%this.playerSpawns.length];
    if(this.tanks.some(t=>rectsOverlap(t.x,t.y,16,16,sp[0],sp[1],16,16))){const free=this.playerSpawns.find(s=>!this.tanks.some(t=>rectsOverlap(t.x,t.y,16,16,s[0],s[1],16,16)));if(free)sp=free;}
    return this.spawnTank(Object.assign({x:sp[0],y:sp[1],player:i,team:p.team,dir:sp[1]<FIELD/2?DOWN:UP,shield:RESPAWN_SHIELD,level:p.level},spec||{}));}
  buildArena(density){density=density===undefined?0.45:density;const m=this.map;m.fill(EMPTY);
    for(let my=0;my<7;my++)for(let mx=0;mx<7;mx++){const r=this.random();let kind=EMPTY;if(r<density*0.7)kind=BRICK;else if(r<density*0.85)kind=STEEL;else if(r<density*0.95)kind=TREES;else if(r<density)kind=WATER;
      for(const [x,y] of [[mx,my],[12-mx,my],[mx,12-my],[12-mx,12-my]])m.setMeta(x,y,kind);}
    for(const [x,y] of [[0,0],[12,0],[0,12],[12,12],[6,6],[1,0],[0,1],[11,0],[12,1],[1,12],[0,11],[11,12],[12,11]])m.setMeta(x,y,EMPTY);
    return m;}
  powerupSpotBlocked(x,y){const cx=x/8,cy=y/8;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const c=this.map.get(cx+dx,cy+dy);if(c===WATER||c===STEEL||c===EAGLE)return true;}return false;}
  spawnPowerup(kind,x,y){if(x===undefined){const free=[];for(let gy=0;gy<12;gy++)for(let gx=0;gx<12;gx++){const px=gx*16,py=gy*16;if(!this.powerupSpotBlocked(px,py)&&!this.eagles.some(e=>rectsOverlap(e.x-16,e.y-16,48,48,px,py,16,16)))free.push([px,py]);}
      if(free.length){const s=free[Math.floor(this.random()*free.length)];x=s[0];y=s[1];}else{x=Math.floor(this.random()*12)*16;y=Math.floor(this.random()*12)*16;}}
    const pu={kind,x,y,age:0,id:++this.enemyIdSeq};this.powerups.push(pu);return pu;}
  explode(x,y,big){this.effects.push({kind:big?'boom':'pop',x,y,t:0});}
  randomPowerupKind(){return A.powerupKinds[Math.floor(this.random()*8)];}
  applyPowerup(tank,kind){
    if(this.mode.onPowerup&&this.mode.onPowerup(this,tank,kind)===false)return;
    const name=POWERUPS[kind];const p=tank.player===null?null:this.players[tank.player];
    if(name==='helmet')tank.shield=HELMET_FRAMES;
    else if(name==='clock')this.freezeTimer=CLOCK_FRAMES;
    else if(name==='shovel')this.setShovel(SHOVEL_FRAMES,tank.team);
    else if(name==='star'){tank.level=Math.min(3,tank.level+1);if(p)p.level=tank.level;}
    else if(name==='grenade'){for(const t of this.tanks.slice())if(t!==tank&&t.state==='alive'&&(t.team!==tank.team||(this.rules.friendlyFire&&t.player!==null&&tank.player!==null))){this.killTank(t,tank,true);}}
    else if(name==='tank'){if(p)p.lives++;else tank.hp++;}
    if(p)p.score+=500;
    BC.sfx('powerup');
    this.text(name.toUpperCase(),60);
  }
  shovelCovers(e,team){if(team===undefined||e.team===team)return true;return e.team==='players'&&this.players.some(p=>p.team===team);}
  ringShovelEagles(kind){for(const e of this.eagles)if(e.alive&&this.shovelCovers(e,this.shovelTeam))this.ringEagle(e,kind);}
  setShovel(frames,team){this.shovelTimer=frames;this.shovelTeam=team;for(const e of this.eagles)if(this.shovelCovers(e,team))this.ringEagle(e,STEEL);}
  ringEagle(e,kind){const cx0=e.x/8,cy0=e.y/8;for(let cy=cy0-1;cy<=cy0+2;cy++)for(let cx=cx0-1;cx<=cx0+2;cx++){if(cx>=cx0&&cx<cx0+2&&cy>=cy0&&cy<cy0+2)continue;if(cx<0||cy<0||cx>=GRID||cy>=GRID)continue;if(this.tanks.some(t=>rectsOverlap(t.x,t.y,16,16,cx*8,cy*8,8,8)))continue;this.map.set(cx,cy,kind);}}
  fire(t){
    const mine=this.bullets.filter(b=>b.owner===t.id).length+(t.reload>0?1:0);const max=t.player!==null?(t.level>=2?2:1):t.maxBullets;if(mine>=max)return false;
    let speed=t.bulletSpeed;if(t.player!==null&&t.level>=1)speed=4;
    const bx=t.x+8+DX[t.dir]*8,by=t.y+8+DY[t.dir]*8;
    const b={x:bx,y:by,dir:t.dir,speed,owner:t.id,team:t.team,player:t.player,power:t.level>=3?2:1,pierce:t.pierce,id:++this.enemyIdSeq};
    this.bullets.push(b);BC.sfx(t.player!==null?'fire':'fireEnemy');if(this.mode.onFire)this.mode.onFire(this,t,b);return true;
  }
  spendBullet(b){const o=this.tanks.find(t=>t.id===b.owner);if(o)o.reload=BULLET_IMPACT_FRAMES;}
  blockedAt(t,x,y){
    if(x<0||y<0||x+16>FIELD||y+16>FIELD)return true;
    const cx0=Math.floor(x/8),cy0=Math.floor(y/8),cx1=Math.floor((x+15)/8),cy1=Math.floor((y+15)/8);
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const c=this.map.get(cx,cy);if(c===BRICK||c===STEEL||c===WATER||c===EAGLE)return true;}
    for(const o of this.tanks){if(o===t||!o.alive)continue;if(o.state==='spawning'&&o.player===null&&t.player===null)continue;if(rectsOverlap(t.x,t.y,16,16,o.x,o.y,16,16))continue;if(rectsOverlap(x,y,16,16,o.x,o.y,16,16))return true;}
    return false;
  }
  onIce(t){const cx=Math.floor((t.x+8)/8),cy=Math.floor((t.y+8)/8);let n=0;for(let dy=-1;dy<=0;dy++)for(let dx=-1;dx<=0;dx++)if(this.map.get(cx+dx,cy+dy)===ICE)n++;return n>=3;}
  moveTank(t,dir,run){
    if(dir!==t.dir){if((dir===UP||dir===DOWN)!==(t.dir===UP||t.dir===DOWN)){if(dir===UP||dir===DOWN)t.x=Math.round(t.x/8)*8;else t.y=Math.round(t.y/8)*8;}t.dir=dir;}
    t.acc+=t.speed;let moved=false;t.blocked=false;
    while(t.acc>=1){t.acc-=1;const nx=t.x+DX[dir],ny=t.y+DY[dir];if(this.blockedAt(t,nx,ny)){t.acc=0;t.blocked=true;break;}t.x=nx;t.y=ny;moved=true;}
    if(moved)t.walk=(t.walk+1)&15;t.moving=true;return moved;
  }
  killTank(victim,killer,silent){
    victim.alive=false;this.tanks.splice(this.tanks.indexOf(victim),1);this.explode(victim.x-8,victim.y-8,true);BC.sfx('explode');
    if(killer&&killer.player!==null){const kp=this.players[killer.player];kp.kills++;if(victim.player===null){kp.score+=victim.score;if(victim.cls!==null)kp.killsByCls[victim.cls]++;}else kp.score+=victim.score||100;}
    if(victim.bonus&&!silent)this.spawnPowerup(this.randomPowerupKind());
    if(victim.player!==null){const p=this.players[victim.player];p.tank=null;p.deaths++;p.level=0;if(this.rules.playerRespawn){if(p.lives>0){p.lives--;p.respawnTimer=this.rules.respawnDelay;}else p.alive=false;}}
    if(this.mode.onTankDestroyed)this.mode.onTankDestroyed(this,victim,killer||null);
  }
  hitTank(t,b){
    const shooter=this.tanks.find(o=>o.id===b.owner)||null;
    if(this.mode.onTankHit&&this.mode.onTankHit(this,t,b,shooter)===false)return;
    if(t.shield>0)return;
    if(t.state!=='alive')return;
    if(t.player!==null&&shooter&&shooter.player!==null&&!this.rules.friendlyFire&&shooter.team===t.team){t.aiState.stun=90;return;}
    t.hp-=1;t.hitFlash=8;
    if(t.hp<=0)this.killTank(t,shooter);
  }
  bulletHitsMap(b){
    const side=(b.dir===UP||b.dir===DOWN);
    const fx=b.x+DX[b.dir]*2,fy=b.y+DY[b.dir]*2;
    if(fx<0||fy<0||fx>=FIELD||fy>=FIELD)return 'wall';
    const cells=[];
    if(side){const cy=Math.floor(fy/8);cells.push([Math.floor((b.x-8)/8),cy],[Math.floor(b.x/8),cy]);}
    else{const cx=Math.floor(fx/8);cells.push([cx,Math.floor((b.y-8)/8)],[cx,Math.floor(b.y/8)]);}
    let hit=null;
    for(const [cx,cy] of cells){const c=this.map.get(cx,cy);if(c===BRICK||c===STEEL||c===EAGLE)hit=hit||c;if(c===EAGLE)hit=EAGLE;}
    if(hit===null)return null;
    if(hit===EAGLE){const cx=cells.find(([cx,cy])=>this.map.get(cx,cy)===EAGLE);const e=this.eagles.find(e=>e.alive&&cx[0]>=e.x/8&&cx[0]<e.x/8+2&&cx[1]>=e.y/8&&cx[1]<e.y/8+2);if(e&&!this.rules.ownEagleHurts&&e.team===b.team)return 'wall';if(e)this.destroyEagle(e,b);return 'eagle';}
    for(const [cx,cy] of cells){const c=this.map.get(cx,cy);
      if(c===BRICK||(c===STEEL&&b.power>=2)){this.map.set(cx,cy,EMPTY);
        if(b.power>=2){const bx=cx+DX[b.dir],by=cy+DY[b.dir],behind=this.map.get(bx,by);if(behind===BRICK||behind===STEEL)this.map.set(bx,by,EMPTY);}}}
    BC.sfx(hit===BRICK?'brick':'steel');
    if(this.mode.onBlockHit)this.mode.onBlockHit(this,b,cells,hit);
    return hit;
  }
  destroyEagle(e,b){e.alive=false;this.explode(e.x-8,e.y-8,true);BC.sfx('eagle');const t=this.map.tile;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)this.map.cell[(e.y/8+dy)*GRID+e.x/8+dx]=EMPTY;
    if(this.mode.onEagleDestroyed)this.mode.onEagleDestroyed(this,e,b);else if(this.rules.eagleGameOver)this.gameOver('GAME OVER');}
  gameOver(text,extra){if(this.state!=='playing')return;BC.sfx('gameover');this.state='over';this.result=Object.assign({text,frame:this.frame},extra||{});this.text(text,999999);}
  aiEnemy(t,inputs){
    const s=t.aiState;if(this.freezeTimer>0&&t.team==='enemy')return;
    if(s.stun>0){s.stun--;return;}
    s.timer--;if(s.turnWait>0)s.turnWait--;
    this.moveTank(t,t.dir,true);const moved=!t.blocked;
    if((s.timer<=0||!moved)&&s.turnWait<=0){
      const r=this.random();let d;
      if(r<0.35)d=DOWN;else if(r<0.55&&this.eagles.length){const e=this.eagles.find(e=>e.alive&&e.team!==t.team)||this.eagles[0];d=e.x>t.x+8?RIGHT:(e.x<t.x-8?LEFT:(e.y>t.y?DOWN:UP));}
      else d=Math.floor(this.random()*4);
      if(!moved){const free=[0,1,2,3].filter(k=>k!==t.dir&&!this.blockedAt(t,t.x+DX[k]*2,t.y+DY[k]*2));if(free.length&&!free.includes(d))d=free[Math.floor(this.random()*free.length)];}
      t.dir=d;if(d===UP||d===DOWN)t.x=Math.round(t.x/8)*8;else t.y=Math.round(t.y/8)*8;s.timer=30+Math.floor(this.random()*90);s.turnWait=moved?0:30;
    }
    s.fire--;
    if(s.fire<=0){let want=this.random()<0.35;
      for(const o of this.tanks){if(o.team===t.team||o.state!=='alive')continue;if(t.dir===UP&&Math.abs(o.x-t.x)<12&&o.y<t.y)want=true;if(t.dir===DOWN&&Math.abs(o.x-t.x)<12&&o.y>t.y)want=true;if(t.dir===LEFT&&Math.abs(o.y-t.y)<12&&o.x<t.x)want=true;if(t.dir===RIGHT&&Math.abs(o.y-t.y)<12&&o.x>t.x)want=true;}
      for(const e of this.eagles){if(!e.alive||e.team===t.team)continue;if(Math.abs(e.x-t.x)<12&&((t.dir===DOWN&&e.y>t.y)||(t.dir===UP&&e.y<t.y)))want=true;}
      if(want)this.fire(t);s.fire=20+Math.floor(this.random()*40);}
  }
  controlPlayer(t,inp){
    if(!inp)return;
    if(t.aiState.stun>0){t.aiState.stun--;t.moving=false;t.lastFire=inp.fire===true;return;}
    let dir=-1;if(inp.right)dir=RIGHT;else if(inp.left)dir=LEFT;else if(inp.down)dir=DOWN;else if(inp.up)dir=UP;
    if(dir>=0){this.moveTank(t,dir,true);if(this.onIce(t)){t.slide=28;t.slideDir=dir;}}
    else if(t.slide>0&&this.onIce(t)){t.slide--;this.moveTank(t,t.slideDir,true);}
    else t.moving=false;
    const fireNow=inp.fire===true;
    if(fireNow&&(!t.lastFire||this.rules.autoFire))this.fire(t);
    t.lastFire=fireNow;
  }
  step(inputs){
    if(this.state!=='playing'){this.frame++;for(const fx of this.effects)fx.t++;this.effects=this.effects.filter(fx=>fx.t<(fx.kind==='boom'?40:20));return;}
    this.frame++;
    if(this.freezeTimer>0)this.freezeTimer--;
    if(this.shovelTimer>0){this.shovelTimer--;
      if(this.shovelTimer===0)this.ringShovelEagles(BRICK);
      else if(this.shovelTimer<SHOVEL_BLINK&&(this.frame&15)===0)this.ringShovelEagles((this.frame&16)?STEEL:BRICK);}
    if(this.mode.update)this.mode.update(this,inputs);
    if(this.hold===true){for(const fx of this.effects)fx.t++;this.effects=this.effects.filter(fx=>fx.t<(fx.kind==='boom'?40:20));this.texts=this.texts.filter(x=>x.until>this.frame);return;}
    if(this.rules.enemyQueue.length>0){this.spawnTimer--;if(this.spawnTimer<=0){if(this.spawnEnemyFromQueue())this.spawnTimer=this.rules.spawnDelay;else this.spawnTimer=10;}}
    for(const p of this.players){if(p.tank===null&&p.alive&&p.lives>=0&&this.rules.playerRespawn&&p.respawnTimer>0){p.respawnTimer--;if(p.respawnTimer===0)this.spawnPlayer(p.slot);}}
    for(const t of this.tanks.slice()){
      if(!t.alive)continue;
      if(t.hitFlash>0)t.hitFlash--;if(t.reload>0)t.reload--;
      if(t.state==='spawning'){t.timer--;if(t.timer<=0)t.state='alive';continue;}
      if(t.shield>0)t.shield--;
      if(typeof t.controller==='function')t.controller(this,t,inputs);
      else if(t.player!==null&&!t.ai)this.controlPlayer(t,inputs[t.player]);
      else this.aiEnemy(t,inputs);
    }
    for(const b of this.bullets.slice()){
      if(!this.bullets.includes(b))continue;
      let dead=false;
      for(let s=0;s<b.speed&&!dead;s++){
        b.x+=DX[b.dir];b.y+=DY[b.dir];
        const hit=this.bulletHitsMap(b);
        if(hit!==null){dead=true;this.spendBullet(b);if(hit!=='eagle')this.explode(b.x-8,b.y-8,false);break;}
        for(const t of this.tanks){if(t.state!=='alive'||t.id===b.owner)continue;if(!rectsOverlap(b.x-2,b.y-2,4,4,t.x,t.y,16,16))continue;
          if(t.team===b.team&&!this.rules.friendlyFire&&!(t.player!==null&&b.player!==null))continue;
          this.hitTank(t,b);if(!b.pierce){dead=true;this.spendBullet(b);}break;}
        if(dead)break;
        if(this.rules.bulletVsBullet)for(const o of this.bullets){if(o===b||(o.team===b.team&&!(this.rules.friendlyFire&&o.player!==null&&b.player!==null)))continue;if(Math.abs(o.x-b.x)<6&&Math.abs(o.y-b.y)<6){this.bullets.splice(this.bullets.indexOf(o),1);dead=true;break;}}
      }
      if(dead){const i=this.bullets.indexOf(b);if(i>=0)this.bullets.splice(i,1);}
    }
    for(const pu of this.powerups.slice()){pu.age++;for(const t of this.tanks){if(t.state!=='alive')continue;if(t.player===null&&!this.rules.powerupsForAll&&!t.tags.canCollect)continue;if(t.player===null&&this.rules.powerupsForAll!=='enemies'&&!t.tags.canCollect)continue;if(rectsOverlap(pu.x,pu.y,16,16,t.x,t.y,16,16)){this.powerups.splice(this.powerups.indexOf(pu),1);this.applyPowerup(t,pu.kind);break;}}}
    for(const fx of this.effects)fx.t++;this.effects=this.effects.filter(fx=>fx.t<(fx.kind==='boom'?40:20));
    this.texts=this.texts.filter(x=>x.until>this.frame);
    if(this.rules.stageClear&&this.rules.enemyQueue.length===0&&!this.tanks.some(t=>t.team==='enemy')&&this.mode.onStageClear)this.mode.onStageClear(this);
    if(this.rules.stageClear&&this.rules.eagleGameOver&&this.players.length&&this.players.every(p=>!p.alive&&p.tank===null)&&!this.tanks.some(t=>t.player!==null))this.gameOver('GAME OVER');
    if(this.mode.isOver){const r=this.mode.isOver(this);if(r)this.gameOver(r.text,r);}
  }
}
const BC={Game,Map26,EMPTY,BRICK,STEEL,WATER,TREES,ICE,EAGLE,UP,LEFT,DOWN,RIGHT,DX,DY,FIELD,GRID,ENEMY_CLASSES,POWERUPS,PLAYER_PALETTES,ENEMY_PALETTE,BONUS_PALETTE,PLAYER_SPAWNS,ENEMY_SPAWNS,rectsOverlap,rng,modes:[],GROUPS:['classic','story','duo','party'],sfx:function(){},
  registerMode(m){if(!m.id||!m.name||typeof m.setup!=='function')throw Error('mode needs id, name, setup');if(BC.modes.some(x=>x.id===m.id))throw Error('duplicate mode id '+m.id);m.players=m.players||[1,4];if(m.group===undefined)m.group='party';if(!BC.GROUPS.includes(m.group))throw Error('mode '+m.id+' has unknown group '+m.group+', use one of '+BC.GROUPS.join('/'));BC.modes.push(m);return m;}};
root.BC=BC;if(typeof module!=='undefined')module.exports=BC;
})(typeof window!=='undefined'?window:globalThis);
