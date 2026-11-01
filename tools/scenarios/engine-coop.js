const BC=window.BC;
function clearField(g){for(let cy=0;cy<20;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);}
function face(g,H){g.rules.enemyQueue=[];clearField(g);g.bullets=[];g.powerups=[];
  const a=H.playerTank(g,0),b=H.playerTank(g,1);
  for(const t of [a,b]){t.state='alive';t.shield=0;}
  a.x=32;a.y=64;a.dir=BC.RIGHT;b.x=96;b.y=64;b.dir=BC.UP;g.__a=a;g.__b=b;}

module.exports=[
{
  name:'engine-coop-mode-without-explicit-teams-stuns-partner-instead-of-killing',
  mode:'rpg',players:2,seed:777,
  setup(g,H){face(g,H);g.__lives=g.players[1].lives;},
  steps:[{action(g){g.fire(g.__a);}},{frames:60,inputs:(f,g)=>({1:{up:g.__b.aiState.stun>0}})}],
  assert:[
    {desc:'engine default puts every player on team players (the story modes never set teams and the playtest saw partner kills)',check(g){return {ok:g.players.every(p=>p.team==='players'),teams:g.players.map(p=>p.team)};}},
    {desc:'partner survives and is stunned',check(g){const b=g.__b;return {ok:b.alive&&g.tanks.includes(b)&&g.players[1].lives===g.__lives&&b.aiState.stun>0,alive:b.alive,stun:b.aiState.stun};}}
  ]
},
{
  name:'engine-coop-grenade-spares-partner',
  mode:'rpg',players:2,seed:777,
  setup(g,H){face(g,H);g.__b.shield=5000;g.spawnTank({x:160,y:0,cls:0x80,team:'enemy',dir:BC.DOWN,instant:true}).state='alive';},
  steps:[{action(g,H){g.__before=H.enemies(g).length;g.applyPowerup(g.__a,BC.POWERUPS.indexOf('grenade'));}},{frames:1}],
  assert:[
    {desc:'grenade clears the enemy',check(g,H){return {ok:g.__before===1&&H.enemies(g).length===0,before:g.__before};}},
    {desc:'partner survives (forced: long shield keeps enemy bullets out of the check; grenade kills ignore shields)',check(g){return {ok:g.__b.alive&&g.tanks.includes(g.__b),alive:g.__b.alive};}}
  ]
},
{
  name:'engine-deathmatch-still-kills-and-grenades-opponents',
  mode:'deathmatch',players:2,seed:777,
  setup(g,H){face(g,H);g.__deaths=g.players[1].deaths;},
  steps:[
    {action(g){g.fire(g.__a);}},
    {frames:40,assert:[{desc:'friendlyFire true: a player bullet kills the other player',check(g){return {ok:g.players[1].deaths===g.__deaths+1,deaths:g.players[1].deaths};}}]},
    {frames:120},
    {action(g,H){const a=H.playerTank(g,0),b=H.playerTank(g,1);g.__b2=b;a.state='alive';b.state='alive';g.applyPowerup(a,BC.POWERUPS.indexOf('grenade'));}},
    {frames:1,assert:[{desc:'friendlyFire true: a grenade kills the other player',check(g){return {ok:g.__b2.alive===false,alive:g.__b2.alive};}}]}
  ]
},
{
  name:'engine-overlapping-tanks-unstick-instead-of-jamming',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];clearField(g);const p=H.playerTank(g);p.state='alive';p.x=96;p.y=96;p.dir=BC.RIGHT;g.__p=p;
    g.__e=g.spawnTank({x:100,y:96,cls:0x80,team:'enemy',dir:BC.DOWN,instant:true});g.__e.state='alive';g.__e.controller=function(){};},
  steps:[{frames:30,inputs:{0:{right:true}}}],
  assert:[
    {desc:'a player spawned overlapping another tank can still drive out of it (the playtest saw two enemies jammed forever in the corner)',check(g){return {ok:g.__p.x>=96+20,x:g.__p.x};}},
    {desc:'once separated the overlap is gone',check(g){return {ok:!BC.rectsOverlap(g.__p.x,g.__p.y,16,16,g.__e.x,g.__e.y,16,16),px:g.__p.x,ex:g.__e.x};}}
  ]
},
{
  name:'engine-powerups-never-land-on-water-or-steel',
  mode:'classic',players:1,seed:777,
  setup(g){g.rules.enemyQueue=[];for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,cy<13?BC.WATER:(cx<13?BC.STEEL:BC.EMPTY));g.__spots=[];
    for(let i=0;i<40;i++){g.powerups=[];const pu=g.spawnPowerup(3);g.__spots.push([pu.x,pu.y,g.powerupSpotBlocked(pu.x,pu.y)]);}},
  assert:[
    {desc:'40 random drops with 3/4 of the map water or steel: none lands on water, steel or the eagle',check(g){const bad=g.__spots.filter(s=>s[2]);return {ok:bad.length===0,bad,sample:g.__spots.slice(0,5)};}}
  ]
}
];
