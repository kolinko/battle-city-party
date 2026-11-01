const BC=window.BC;
function clearField(g){for(let cy=0;cy<20;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);}
function place(g,H){g.rules.enemyQueue=[];clearField(g);
  const a=H.playerTank(g,0),b=H.playerTank(g,1);
  for(const t of [a,b]){t.state='alive';t.shield=0;}
  a.x=32;a.y=64;a.dir=BC.RIGHT;b.x=96;b.y=64;b.dir=BC.UP;g.__a=a;g.__b=b;}

module.exports=[
{
  name:'classic-player-shot-stuns-the-other-player-instead-of-killing',
  mode:'classic',players:2,seed:777,
  setup(g,H){place(g,H);g.__lives=g.players[1].lives;},
  steps:[
    {action(g){g.fire(g.__a);}},
    {frames:60,inputs:(f,g)=>({1:{up:g.__b.aiState.stun>0}})}
  ],
  assert:[
    {desc:'both players are on one team, as on the nes (the playtest saw p0/p1 teams, so a hit killed)',
     check(g){return {ok:g.players.every(p=>p.team==='players'),teams:g.players.map(p=>p.team)};}},
    {desc:'player 2 is still alive after being hit by player 1',
     check(g){const b=g.__b;return {ok:b.alive===true&&g.tanks.includes(b)&&g.players[1].lives===g.__lives,alive:b.alive,lives:g.players[1].lives};}},
    {desc:'player 2 was stunned by the hit and the stun is counting down while it holds a direction',
     check(g){return {ok:g.__b.aiState.stun>0&&g.__b.aiState.stun<90,stun:g.__b.aiState.stun};}},
    {desc:'the stunned player did not move while holding up',
     check(g){return {ok:g.__b.y===64,y:g.__b.y};}}
  ],
  measure(g){return {stun:g.__b.aiState.stun,bullets:g.bullets.length};}
},
{
  name:'classic-grenade-spares-the-other-player',
  mode:'classic',players:2,seed:777,
  setup(g,H){place(g,H);g.rules.enemyQueue=[0x80,0x80];g.spawnTimer=1;g.__b.shield=5000;},
  steps:[
    {frames:80},
    {action(g,H){g.__before=H.enemies(g).length;g.applyPowerup(g.__a,BC.POWERUPS.indexOf('grenade'));}},
    {frames:1}
  ],
  assert:[
    {desc:'the grenade clears the enemies',check(g,H){return {ok:g.__before>0&&H.enemies(g).length===0,before:g.__before,after:H.enemies(g).length};}},
    {desc:'player 2 survives player 1 taking a grenade (forced: p2 carries a long shield so a stray enemy bullet cannot confound the check; grenade kills ignore shields)',check(g){return {ok:g.__b.alive===true&&g.tanks.includes(g.__b),alive:g.__b.alive};}}
  ]
},
{
  name:'classic-starts-on-the-selected-stage',
  mode:'classic',players:1,seed:777,stage:12,
  steps:[{frames:1}],
  assert:[
    {desc:'the game starts on stage 12 when the menu picked it',check(g){return {ok:g.stage===12,stage:g.stage};}},
    {desc:'the map is the rom stage 12 layout, not stage 1',check(g){const s1=new BC.Game(g.mode,{playerCount:1,seed:1,stage:1});let diff=0;for(let i=0;i<g.map.cell.length;i++)if(g.map.cell[i]!==s1.map.cell[i])diff++;return {ok:diff>0,cellsDifferentFromStage1:diff};}},
    {desc:'spawn pacing follows the rom formula for stage 12',check(g){return {ok:g.rules.spawnDelay===191-4*12,spawnDelay:g.rules.spawnDelay};}}
  ]
},
{
  name:'classic-stage-clear-shows-a-tally-and-pays-the-1000-bonus',
  mode:'classic',players:2,seed:777,
  setup(g,H){place(g,H);g.rules.enemyQueue=[0x80];g.spawnTimer=1;},
  steps:[
    {frames:40},
    {action(g,H){const e=H.enemies(g)[0];g.__score=g.players[0].score;g.killTank(e,g.__a,true);}},
    {frames:2,assert:[
      {desc:'the stage-clear tally opened',check(g){return {ok:g.clearTimer>0,clearTimer:g.clearTimer};}},
      {desc:'player 1 got the enemy score plus the 1000 bonus for most kills',check(g){return {ok:g.players[0].score===g.__score+100+1000,score:g.players[0].score,bonusTo:g.tallyBonus};}},
      {desc:'the tally counts one basic enemy for player 1 this stage',check(g){return {ok:g.players[0].killsByCls[0x80]-g.tallyBase[0][0x80]===1,kills:g.players[0].killsByCls};}}
    ]},
    {frames:430}
  ],
  assert:[
    {desc:'after the tally the next stage starts',check(g){return {ok:g.stage===2&&g.clearTimer===0,stage:g.stage,clearTimer:g.clearTimer};}}
  ]
}
];
