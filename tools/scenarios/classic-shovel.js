const BC=window.BC;
const SHOVEL=BC.POWERUPS.indexOf('shovel');
function noSpawns(g){g.rules.maxEnemies=0;}
function readyPlayer(g,H){const t=H.playerTank(g);if(!t)throw Error('scenario: player 0 has no tank');t.state='alive';return t;}
function pickShovel(g,H){const t=readyPlayer(g,H);g.spawnPowerup(SHOVEL,t.x,t.y);}

module.exports=[
{
  name:'classic-shovel-turns-the-wall-to-steel',
  mode:'classic',players:1,seed:777,
  setup:noSpawns,
  steps:[{frames:70},{action:pickShovel},{frames:2,
    assert:[
      {desc:'picking up the shovel starts the shovel timer',check(g){return {ok:g.shovelTimer>0,shovelTimer:g.shovelTimer};}},
      {desc:'every base-wall cell is steel while the shovel is active',
       check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'steel'),counts:w.counts,
         notSteel:w.list.filter(c=>c.kind!=='steel')};}}
    ]}],
  measure(g,H){return {shovelTimer:g.shovelTimer,shovelTeam:g.shovelTeam,eagleTeam:H.eagle(g).team,playerTeam:g.players[0].team,wall:H.eagleWall(g).counts};}
},
{
  name:'classic-shovel-expires-back-to-brick',
  mode:'classic',players:1,seed:777,
  setup:noSpawns,
  steps:[{frames:70},{action:pickShovel},{frames:1},{frames:1088,
    assert:[{desc:'the wall is solid steel right up to the start of the blink window',
      check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'steel')&&g.shovelTimer===192,frame:g.frame,shovelTimer:g.shovelTimer,counts:w.counts};}}]},
    {frames:192,assert:[
      {desc:'the shovel lasts 1280 frames',check(g){return {ok:g.shovelTimer===0,shovelTimer:g.shovelTimer};}},
      {desc:'the wall returns to brick at expiry',
       check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'brick'),counts:w.counts,
         notBrick:w.list.filter(c=>c.kind!=='brick')};}}
    ]}],
  measure(g,H,T){const on=T.shovel.find(s=>s.on),off=T.shovel.filter(s=>!s.on).pop();
    return {steelFrom:on?on.frame:null,steelUntil:off?off.frame:null,
      steelFrames:on&&off?off.frame-on.frame:null,transitions:T.shovel,wallChanges:T.wall};}
},
{
  name:'classic-shovel-rebuilds-a-destroyed-wall',
  mode:'classic',players:1,seed:777,
  setup:noSpawns,
  steps:[{frames:70},
    {action(g,H){const w=H.wallCells(H.eagle(g));g.__broken=w.slice(0,5);for(const [cx,cy] of g.__broken)g.map.set(cx,cy,BC.EMPTY);},
     assert:[{desc:'five wall cells were knocked out before the pickup',
       check(g,H){const w=H.eagleWall(g);return {ok:w.counts.empty===5,counts:w.counts};}}]},
    {action:pickShovel},
    {frames:1,assert:[{desc:'the shovel restores the knocked-out cells as steel',
      check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'steel'),counts:w.counts};}}]},
    {frames:1280},
    {frames:0,assert:[{desc:'expiry rebuilds the full wall in brick, including the cells destroyed earlier',
      check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'brick'),counts:w.counts,
        notBrick:w.list.filter(c=>c.kind!=='brick')};}}]}]
},
{
  name:'classic-shovel-blinks-in-the-last-192-frames',
  mode:'classic',players:1,seed:777,
  setup:noSpawns,
  steps:[{frames:70},{action:pickShovel},{frames:1},{frames:1088},
    {frames:192,assert:[
      {desc:'the ring alternates material during the last 192 frames, toggling every 16',
       check(g,H,T){const flips=T.wall.filter(w=>w.frame>g.frame-192);
         const kinds=flips.map(f=>Object.keys(f.counts).join('+'));
         const gaps=[];for(let i=1;i<flips.length;i++)gaps.push(flips[i].frame-flips[i-1].frame);
         return {ok:flips.length>=10&&kinds.includes('steel')&&kinds.includes('brick')&&gaps.every(x=>x===16),
           flips:flips.length,gaps:Array.from(new Set(gaps)),kinds};}},
      {desc:'the blink ends on brick',
       check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'brick'),counts:w.counts};}}
    ]}],
  measure(g,H,T){return {wallChanges:T.wall.map(w=>({frame:w.frame,counts:w.counts}))};}
},
{
  name:'classic-shovel-ignores-an-enemy-pickup',
  mode:'classic',players:1,seed:777,
  setup:noSpawns,
  steps:[{frames:70},
    {action(g,H){const e=g.spawnTank({x:0,y:0,cls:0x80,team:'enemy',dir:BC.DOWN,instant:true});
      e.controller=function(){};e.state='alive';g.__enemy=e;g.spawnPowerup(SHOVEL,e.x,e.y);}},
    {frames:2,assert:[
      {desc:'an enemy picking up the shovel does not fortify the players base',
       check(g,H){const w=H.eagleWall(g);return {ok:w.counts.steel===undefined,counts:w.counts,shovelTimer:g.shovelTimer};}}
    ]}]
}
];
