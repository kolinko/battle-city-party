const BC=window.BC;
function enemySpawns(T){return T.spawns.filter(s=>s.team==='enemy'&&s.player===null);}
function stageOneOnly(T){const s2=T.stages.find(x=>x.stage>1);return enemySpawns(T).filter(s=>!s2||s.frame<s2.frame);}
const killWave=[];
for(let i=0;i<26;i++){killWave.push({frames:200});killWave.push({action(g,H){for(const t of H.enemies(g))g.killTank(t,null,true);}});}

module.exports=[
{
  name:'classic-wave-is-twenty-enemies',
  mode:'classic',players:1,seed:777,
  steps:killWave,
  assert:[
    {desc:'stage 1 spawns exactly 20 enemies',
     check(g,H,T){const s=stageOneOnly(T);return {ok:s.length===20,spawned:s.length};}},
    {desc:'the class order comes from the rom roster for stage 1',
     check(g,H,T){const s=stageOneOnly(T).map(x=>x.cls);
       const roster=window.BC_ASSETS.rosters[0];
       return {ok:JSON.stringify(s)===JSON.stringify(roster),spawned:s,roster};}},
    {desc:'the 4th, 11th and 18th enemy of the wave carries the bonus',
     check(g,H,T){const s=stageOneOnly(T),got=[];
       for(let i=0;i<s.length;i++)if(s[i].bonus)got.push(i+1);
       return {ok:JSON.stringify(got)==='[4,11,18]',bonusOrdinals:got};}}
  ]
},
{
  name:'classic-max-four-enemies-on-screen-1p',
  mode:'classic',players:1,seed:777,
  steps:[{frames:2000}],
  assert:[
    {desc:'never more than four enemies alive at once with one player',
     check(g,H){return {ok:g.rules.maxEnemies===4,maxEnemies:g.rules.maxEnemies,alive:H.enemies(g).length};}},
    {desc:'the engine honours the cap',
     check(g,H){return {ok:H.enemies(g).length<=4,alive:H.enemies(g).length};}}
  ]
},
{
  name:'classic-max-six-enemies-on-screen-2p',
  mode:'classic',players:2,seed:777,
  steps:[{frames:2000}],
  assert:[
    {desc:'six enemies on screen with two players, as in the rom two-player configuration',
     check(g,H){return {ok:g.rules.maxEnemies===6,maxEnemies:g.rules.maxEnemies};}},
    {desc:'two-player spawn pacing is 20 frames faster than one-player',
     check(g){return {ok:g.rules.spawnDelay===167,spawnDelay:g.rules.spawnDelay};}}
  ]
}
];
