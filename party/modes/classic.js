(function(){
'use strict';
const BC=window.BC;
const CLEAR_FRAMES=420,CLASSES=[0x80,0xa0,0xc0,0xe0];
function romSpawnDelay(g,n){return 191-4*n-(g.players.length>1?20:0);}
const ROM_AIM_NORMAL=[0,0,0,1,0,3,2,2,2],ROM_AIM_ALT=[1,0,3,1,0,3,1,2,3];
function sgn(pos,target){return target<pos?0:(target===pos?1:2);}
function rnd(g){return Math.floor(g.random()*256);}
function romSelect(g,t){const s=t.aiState,T=g.rules.spawnDelay-1,slow=Math.floor((g.frame-g.stageFrame0)/64);
  if((T>>2)<slow){s.st='target';s.target='eagle';}
  else if((T>>3)>=slow){t.dir=rnd(g)&3;s.st='move';}
  else{const p1=g.players[0].tank,p2=g.players.length>1?g.players[1].tank:null;s.target=!p1?'p2':((t.id&1)===0?'p1':(p2?'p2':'p1'));s.st='target';}}
function romAim(g,t){const s=t.aiState;let tx,ty;
  if(s.target==='eagle'&&g.eagles.length){tx=g.eagles[0].x;ty=g.eagles[0].y;}
  else{const p=g.players[s.target==='p2'?1:0],pt=p?p.tank:null;if(!pt){t.dir=rnd(g)&3;return;}tx=pt.x;ty=pt.y;}
  t.dir=((rnd(g)&1)?ROM_AIM_ALT:ROM_AIM_NORMAL)[3*sgn(t.y,ty)+sgn(t.x,tx)];}
function romMove(g,t){const s=t.aiState;if(s.st===undefined)s.st='move';
  if(s.st==='pause'){if(--s.wait<=0)s.st='move';return;}
  if(s.st==='pick'){if(rnd(g)&1){t.dir=(t.dir+((rnd(g)&1)?1:3))&3;s.st='move';}else romSelect(g,t);return;}
  if(s.st==='target'){romAim(g,t);s.st='move';return;}
  if((t.x&7)===0&&(t.y&7)===0&&(rnd(g)&15)===0){romSelect(g,t);return;}
  const nx=t.x+BC.DX[t.dir],ny=t.y+BC.DY[t.dir];t.moving=true;
  if(!g.blockedAt(t,nx,ny)){t.x=nx;t.y=ny;t.walk=(t.walk+1)&15;return;}
  if((rnd(g)&3)===0){if((t.x&7)===0&&(t.y&7)===0)s.st='pick';t.dir^=2;}else{s.st='pause';s.wait=2;}}
function romEnemy(g,t){const s=t.aiState;if(g.freezeTimer>0)return;if(s.stun>0){s.stun--;return;}
  if(t.cls===0xa0||((t.id^g.frame)&1))romMove(g,t);
  if((rnd(g)&31)===0)g.fire(t);}
function classicStage(g,n){g.tanks=[];g.bullets=[];g.powerups=[];g.eagles=[];g.loadStage(n);g.ringEagle(g.addEagle(96,192,'players'),BC.BRICK);g.classicEnemyQueue();g.spawnTimer=30;g.freezeTimer=0;g.shovelTimer=0;
  for(const p of g.players){p.tank=null;if(p.alive)g.spawnPlayer(p.slot);}g.text('STAGE '+n,150);g.clearTimer=0;g.stageFrame0=g.frame;
  g.tallyBase=g.players.map(p=>Object.assign({},p.killsByCls));g.tallyBonus=-1;}
function oneTeam(g){for(const p of g.players)p.team='players';}
function stageKills(g,p){const b=g.tallyBase[p.slot],o={total:0};for(const c of CLASSES){o[c]=p.killsByCls[c]-b[c];o.total+=o[c];}return o;}
function classicClear(g,next){
  g.clearTimer++;
  if(g.clearTimer===1&&g.players.length>1){
    const totals=g.players.map(p=>stageKills(g,p).total),best=Math.max.apply(null,totals),who=g.players.filter(p=>stageKills(g,p).total===best);
    if(who.length===1){who[0].score+=1000;g.tallyBonus=who[0].slot;}
  }
  if(g.clearTimer>=CLEAR_FRAMES){classicStage(g,g.stage+1);next(g);}
}
function tallyHud(g,ctx,G,o){
  if(!g.clearTimer)return;
  const x0=24,y0=32,w=208;
  ctx.fillStyle='rgba(0,0,0,0.92)';ctx.fillRect(x0,y0,w,176);
  ctx.strokeStyle='#f8f8f8';ctx.lineWidth=1;ctx.strokeRect(x0+0.5,y0+0.5,w-1,175);
  const head='STAGE '+g.stage+' CLEAR';
  G.drawText(ctx,head,o.WHITE,x0+w/2-head.length*4,y0+6);
  const col=i=>x0+28+i*44;
  for(const p of g.players){G.drawText(ctx,p.name,p.palette,col(p.slot),y0+20);G.drawText(ctx,String(p.score),o.WHITE,col(p.slot),y0+28);}
  CLASSES.forEach((c,j)=>{
    const y=y0+44+j*22;
    G.drawSprite16(ctx,c,BC.ENEMY_PALETTE,x0+4,y);
    for(const p of g.players){const k=stageKills(g,p)[c];G.drawText(ctx,'X'+k,k>0?o.WHITE:o.GREY,col(p.slot),y);G.drawText(ctx,String(k*BC.ENEMY_CLASSES[c].score),o.GREY,col(p.slot),y+8);}
  });
  ctx.fillStyle='#f8f8f8';ctx.fillRect(x0+4,y0+134,w-8,1);
  for(const p of g.players){G.drawText(ctx,'X'+stageKills(g,p).total,o.WHITE,col(p.slot),y0+140);
    if(g.tallyBonus===p.slot){G.drawText(ctx,'BONUS',p.palette,col(p.slot),y0+152);G.drawText(ctx,'1000',p.palette,col(p.slot),y0+160);}}
}
BC.registerMode({id:'classic',name:'Classic (1985)',group:'classic',stageSelect:true,players:[1,2],desc:'The original rules: 20 enemies per stage, the eagle, power-ups, all 35 stages from the ROM. Left/right in the menu picks the starting stage.',
  setup(g){g.rules.hud='classic';g.rules.maxEnemies=g.players.length>1?6:4;oneTeam(g);for(const p of g.players)p.lives=2;classicStage(g,g.options.stage);g.rules.spawnDelay=romSpawnDelay(g,g.options.stage);},
  onStageClear(g){classicClear(g,g=>{g.rules.spawnDelay=romSpawnDelay(g,g.stage);});},
  onSpawn(g,t){if(t.player===null&&t.team==='enemy')t.controller=romEnemy;},
  hud:tallyHud});
BC.registerMode({id:'coop4',name:'Co-op 4',group:'party',stageSelect:true,players:[1,4],desc:'The classic campaign with four defenders at once: more enemies on screen (8), faster spawns, 30 enemies per stage. Left/right picks the stage.',
  setup(g){g.rules.hud='party';g.rules.maxEnemies=8;g.rules.spawnDelay=50;g.playerSpawns=[[64,192],[128,192],[32,192],[160,192]];oneTeam(g);classicStage(g,g.options.stage);g.rules.enemyQueue=g.rules.enemyQueue.concat(g.rules.enemyQueue.slice(0,10));},
  onStageClear(g){classicClear(g,g=>{g.rules.enemyQueue=g.rules.enemyQueue.concat(g.rules.enemyQueue.slice(0,10));});},
  hud:tallyHud});
})();
