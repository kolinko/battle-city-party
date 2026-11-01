const BC=window.BC;
const KEEP_WAVE_FLOWING=[];
for(let i=0;i<16;i++){KEEP_WAVE_FLOWING.push({frames:250});
  KEEP_WAVE_FLOWING.push({action(g,H){for(const t of H.enemies(g))if(t.state==='alive')g.killTank(t,null,true);}});}
function pairs(T,pick){const out=[];
  for(const o of T.overlaps)for(const p of o.pairs)if(pick(p))out.push({frame:o.frame,...p});
  return out;}

module.exports=[
{
  name:'classic-no-enemy-spawns-onto-another',
  mode:'classic',players:1,seed:777,
  steps:KEEP_WAVE_FLOWING,
  assert:[
    {desc:'no enemy ever appears on top of another: zero frames where a spawning enemy overlaps a live one (rom stage 1 measured 0 of 3721 frames). the wave is kept flowing by force-killing live enemies every 250 frames, which is an intervention, not natural play',
     check(g,H,T){const bad=pairs(T,p=>(p.aState==='spawning')!==(p.bState==='spawning'));
       return {ok:bad.length===0,frames:bad.length,first:bad.slice(0,3)};}},
    {desc:'the run actually exercised spawning: at least 12 enemies appeared',
     check(g,H,T){const s=T.spawns.filter(x=>x.team==='enemy'&&x.player===null);
       return {ok:s.length>=12,spawns:s.length,lanes:s.map(x=>x.lane)};}}
  ],
  measure(g,H,T){
    const spawnPairs=pairs(T,p=>(p.aState==='spawning')!==(p.bState==='spawning'));
    const livePairs=pairs(T,p=>p.aState==='alive'&&p.bState==='alive');
    return {frames:g.frame,enemySpawns:T.spawns.filter(x=>x.team==='enemy'&&x.player===null).length,
      spawnOntoLiveFrames:spawnPairs.length,liveOnLiveFrames:livePairs.length,
      romReference:{stage:1,framesAnalysed:3721,activeOnActive:183,activeOnSpawning:0,
        note:'the rom collides against an 8px occupancy grid, so partial box overlap between two live enemies is normal there; party blocks on exact rects in blockedAt so it should show fewer, not more'}};}
}
];
