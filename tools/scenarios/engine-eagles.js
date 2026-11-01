const BC=window.BC;
function shootEagle(g,t){t.state='alive';t.shield=0;t.x=96;t.y=160;t.dir=BC.DOWN;g.bullets=[];g.fire(t);}
module.exports=[
{
  name:'engine-boss-defender-attacker-bullet-destroys-the-eagle',
  mode:'boss-defender',players:2,seed:777,
  setup(g,H){g.rules.enemyQueue=[];g.spawnTimer=99999;for(const t of g.tanks.slice())if(t.player===null)g.killTank(t,null,true);
    const e=H.eagle(g);for(const [cx,cy] of H.ringCells(e))g.map.set(cx,cy,BC.EMPTY);
    const att=g.tanks.find(t=>t.player!==null&&t.player!==g.bd.defender);g.__att=att;g.__eagleTeam=e.team;g.__attTeam=att.team;shootEagle(g,att);},
  steps:[{frames:12}],
  assert:[
    {desc:'the eagle carries the defender team and the attacker is a player-controlled enemy-team tank (the setup this regression depended on)',check(g){return {ok:g.__eagleTeam==='players'&&g.__attTeam==='enemy',eagleTeam:g.__eagleTeam,attTeam:g.__attTeam};}},
    {desc:'an attacking player bullet destroys the eagle under ownEagleHurts=false (bundle 20260916-212806 bounced it off as a friendly shot)',check(g,H){return {ok:g.bd.phase==='break'&&g.eagles.every(e=>!e.alive),phase:g.bd.phase,alive:g.eagles.map(e=>e.alive)};}}
  ]
},
{
  name:'engine-own-eagle-still-protected-when-ownEagleHurts-false',
  mode:'boss-defender',players:2,seed:777,
  setup(g,H){g.rules.enemyQueue=[];g.spawnTimer=99999;for(const t of g.tanks.slice())if(t.player===null)g.killTank(t,null,true);
    const e=H.eagle(g);for(const [cx,cy] of H.ringCells(e))g.map.set(cx,cy,BC.EMPTY);
    const def=g.tanks.find(t=>t.player===g.bd.defender);for(const t of g.tanks.slice())if(t!==def)g.killTank(t,null,true);shootEagle(g,def);},
  steps:[{frames:12}],
  assert:[{desc:'the defender own shot bounces off its own eagle',check(g){return {ok:g.eagles.every(e=>e.alive)&&g.bd.phase==='play',alive:g.eagles.map(e=>e.alive),phase:g.bd.phase};}}]
},
{
  name:'engine-coop-players-cannot-shoot-their-shared-eagle-when-ownEagleHurts-false',
  mode:'rpg',players:2,seed:777,
  setup(g,H){g.rules.enemyQueue=[];const e=H.eagle(g);for(const [cx,cy] of H.ringCells(e))g.map.set(cx,cy,BC.EMPTY);shootEagle(g,H.playerTank(g,1));},
  steps:[{frames:12}],
  assert:[{desc:'rpg sets ownEagleHurts=false: a player bullet bounces off the shared players eagle',check(g){return {ok:g.eagles.every(e=>e.alive)&&g.state==='playing',alive:g.eagles.map(e=>e.alive)};}}]
}
];
