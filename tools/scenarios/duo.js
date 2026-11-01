const BC=window.BC;
function skip(g,H,id){H.mode(id).skipBrief(g);}
function ready(g,slot){const t=g.players[slot].tank;if(!t)throw Error('scenario: player '+slot+' has no tank');t.state='alive';t.shield=0;return t;}
module.exports=[
{
  name:'duo-tower-defense-engineer-builds-brick-steel-mine-turret',
  mode:'duo-tower-defense',players:2,seed:777,
  setup(g,H){skip(g,H,'duo-tower-defense');g.rules.maxEnemies=0;g.td.mat=20;},
  steps:[{frames:40},
    {action(g){const t=ready(g,1);t.x=128;t.y=128;t.dir=BC.UP;for(let cy=6;cy<=23;cy++)for(let cx=8;cx<=23;cx++)g.map.set(cx,cy,BC.EMPTY);},
     frames:1,inputs:{1:{fire:true}},assert:[
      {desc:'the engineer cannot fire bullets',check(g){return {ok:g.bullets.length===0,bullets:g.bullets.length};}},
      {desc:'one fire edge places a 2x2 brick in front of the engineer for 1 material',
       check(g,H){const cells=[[16,14],[17,14],[16,15],[17,15]].map(([cx,cy])=>H.cellName(H.cell(g,cx,cy)));return {ok:cells.every(c=>c==='brick')&&g.td.mat===19,cells,mat:g.td.mat};}}]},
    {frames:1,inputs:{}},
    {frames:1,inputs:{1:{select:true}},assert:[{desc:'select moves to steel',check(g){return {ok:g.td.sel===1,sel:g.td.sel};}}]},
    {frames:1,inputs:{}},
    {action(g){g.players[1].tank.dir=BC.DOWN;},frames:1,inputs:{1:{fire:true}},assert:[
      {desc:'steel costs 4 and lands where the engineer faces',
       check(g,H){const cells=[[16,18],[17,18],[16,19],[17,19]].map(([cx,cy])=>H.cellName(H.cell(g,cx,cy)));return {ok:cells.every(c=>c==='steel')&&g.td.mat===15,cells,mat:g.td.mat};}}]},
    {frames:1,inputs:{}},
    {action(g){g.td.sel=4;g.players[1].tank.dir=BC.LEFT;},frames:1,inputs:{1:{fire:true}},assert:[
      {desc:'a mine is armed on the free 16x16 to the left for 3',check(g){return {ok:g.td.mines.length===1&&g.td.mines[0].x===112&&g.td.mines[0].y===128&&g.td.mat===12,mines:g.td.mines,mat:g.td.mat};}}]},
    {action(g){const e=g.spawnTank({x:112,y:128,cls:0x80,team:'enemy',dir:BC.DOWN,instant:true});e.state='alive';},frames:1,assert:[
      {desc:'an enemy rolling onto the mine dies and the kill is credited to the engineer',check(g){return {ok:g.td.mines.length===0&&!g.tanks.some(t=>t.team==='enemy')&&g.players[1].kills===1,mines:g.td.mines.length,kills:g.players[1].kills};}}]},
    {frames:1,inputs:{}},
    {action(g){g.td.sel=5;g.players[1].tank.dir=BC.RIGHT;},frames:1,inputs:{1:{fire:true}},assert:[
      {desc:'a turret tank is built on the right for 6',check(g){const t=g.tanks.find(o=>o.tags.turret);return {ok:!!t&&t.x===144&&t.y===128&&t.team==='players'&&g.td.mat===6,mat:g.td.mat,turret:t&&[t.x,t.y]};}}]},
    {action(g){const e=g.spawnTank({x:144,y:48,cls:0x80,team:'enemy',dir:BC.DOWN,instant:true});e.state='alive';e.controller=function(){};},frames:3,assert:[
      {desc:'the turret turns up towards an aligned enemy and fires',check(g){const t=g.tanks.find(o=>o.tags.turret);const b=g.bullets.find(x=>x.owner===t.id);return {ok:t.dir===BC.UP&&!!b&&b.dir===BC.UP&&b.team==='players',dir:t.dir,bullets:g.bullets.length};}}]},
    {action(g){g.td.mat=0;g.td.sel=0;g.players[1].tank.dir=BC.UP;},frames:1,inputs:{}},
    {frames:1,inputs:{1:{fire:true}},assert:[{desc:'with no materials nothing is placed',check(g){return {ok:g.td.placed===4,placed:g.td.placed};}}]}
  ],
  measure(g){return {mat:g.td.mat,placed:g.td.placed,mines:g.td.mines.length,turrets:g.tanks.filter(t=>t.tags.turret).length};}
},
{
  name:'duo-tower-defense-board-wave-armor-burns-steel',
  mode:'duo-tower-defense',players:2,seed:777,
  setup(g,H){skip(g,H,'duo-tower-defense');g.td.wave=5;g.td.phase='wave';g.rules.enemyQueue=[];},
  steps:[{frames:2,assert:[{desc:'forced: wave 5 cleared, so the board arrives after a build break',check(g){return {ok:g.td.phase==='build',phase:g.td.phase};}}]},
    {action(g){g.td.until=g.frame+1;},frames:2,assert:[{desc:'wave 6 is THE BOARD with 14 in the queue',check(g){return {ok:g.td.wave===6&&g.rules.enemyQueue.length===14,wave:g.td.wave,queue:g.rules.enemyQueue.length};}}]},
    {action(g){g.rules.enemyQueue=[0xe0];g.spawnTimer=1;},frames:40,assert:[{desc:'an armor tank of the board spawns as a level 3 breacher whose bullets destroy steel',
       check(g){const e=g.tanks.find(t=>t.team==='enemy');return {ok:!!e&&e.level===3&&e.tags.breach===true,level:e&&e.level};}}]}]
},
{
  name:'duo-tower-defense-waves-follow-the-build-timer',
  mode:'duo-tower-defense',players:2,seed:777,
  setup(g,H){skip(g,H,'duo-tower-defense');},
  steps:[
    {frames:479,assert:[{desc:'during the 8 second build phase no enemy is queued',check(g){return {ok:g.td.phase==='build'&&g.rules.enemyQueue.length===0,phase:g.td.phase};}}]},
    {frames:2,assert:[{desc:'wave 1 queues 6 tourists after the build timer',check(g){return {ok:g.td.wave===1&&g.rules.enemyQueue.length===6,wave:g.td.wave,queue:g.rules.enemyQueue.length};}}]}
  ]
},
{
  name:'duo-tandem-p2-aims-and-fires-while-p1-drives',
  mode:'duo-tandem',players:2,seed:777,
  setup(g,H){skip(g,H,'duo-tandem');g.rules.maxEnemies=0;g.rules.enemyQueue=[];for(let cy=4;cy<=20;cy++)for(let cx=4;cx<=20;cx++)g.map.set(cx,cy,BC.EMPTY);},
  steps:[{frames:40},
    {action(g){const t=ready(g,0);t.x=96;t.y=96;t.dir=BC.UP;g.__x0=96;},frames:20,inputs:{0:{right:true}},assert:[
      {desc:'player 1 holding right drives the shared tank right',check(g){const t=g.players[0].tank;return {ok:t.x>g.__x0&&t.dir===BC.RIGHT,x:t.x,dir:t.dir};}},
      {desc:'player 2 owns no tank of his own',check(g){return {ok:g.players[1].tank===null,tanks:g.tanks.length};}}]},
    {frames:10,inputs:{0:{right:true},1:{up:true}},assert:[
      {desc:'player 2 holding up turns the gun up while the tank keeps rolling right',check(g){const t=g.players[0].tank;return {ok:t.dir===BC.UP&&t.moving===true,dir:t.dir,moving:t.moving};}}]},
    {frames:1,inputs:{1:{up:true,fire:true}},assert:[
      {desc:'player 2 fire launches a bullet upward',check(g){return {ok:g.bullets.length===1&&g.bullets[0].dir===BC.UP,bullets:g.bullets.map(b=>b.dir)};}}]},
    {frames:90,inputs:{0:{fire:true}},assert:[
      {desc:'player 1 fire does nothing',check(g){return {ok:g.bullets.length===0,bullets:g.bullets.length};}}]}
  ]
},
{
  name:'duo-convoy-three-deliveries-win-and-friendly-fire-is-harmless',
  mode:'duo-convoy',players:2,seed:777,
  setup(g,H){skip(g,H,'duo-convoy');g.rules.maxEnemies=0;},
  steps:[{frames:40},
    {action(g){const t=ready(g,1);t.hp=2;t.x=192;t.y=96;},frames:1,assert:[
      {desc:'the truck on depot 1 delivers, is repaired and the marker moves on',check(g){const t=g.players[1].tank;return {ok:g.cv.done===1&&g.cv.depot===1&&t.hp===6,done:g.cv.done,depot:g.cv.depot,hp:t.hp};}}]},
    {action(g){const t=g.players[1].tank;t.x=16;t.y=32;},frames:1},
    {action(g){const t=g.players[1].tank;t.x=96;t.y=96;const e=g.players[0].tank;e.state='alive';g.hitTank(t,{owner:e.id,team:e.team,player:0});},frames:1,assert:[
      {desc:'an escort bullet does not hurt or stun the truck',check(g){const t=g.players[1].tank;return {ok:t.hp===6&&!t.aiState.stun,hp:t.hp,stun:t.aiState.stun};}}]},
    {action(g){const t=g.players[1].tank;t.x=176;t.y=176;},frames:2,assert:[
      {desc:'the third delivery wins the game',check(g){return {ok:g.state==='over'&&g.result.text==='CONVOY DELIVERED',done:g.cv.done,result:g.result};}}]}
  ]
},
{
  name:'duo-convoy-losing-all-trucks-loses',
  mode:'duo-convoy',players:2,seed:777,
  setup(g,H){skip(g,H,'duo-convoy');g.rules.maxEnemies=0;},
  steps:[{frames:40},
    {action(g){for(let i=0;i<3;i++){const t=ready(g,1);g.killTank(t,null,true);for(let f=0;f<100;f++)g.step([{},{}]);}},frames:2,assert:[
      {desc:'after the third truck dies the convoy is lost',check(g){return {ok:g.state==='over'&&g.result.text==='CONVOY LOST',result:g.result,lives:g.players[1].lives};}}]}]
}
];
