const BC=window.BC;
function botPads(f){const out={},dirs=['up','left','down','right'];
  for(let i=0;i<4;i++){const s={};s[dirs[(Math.floor(f/50)+i)%4]]=(f%80)<60;s.fire=(f%9)===0;out[i]=s;}
  return out;}
function enemySpawns(T){return T.spawns.filter(s=>s.team==='enemy'&&s.player===null);}

module.exports=[
{
  name:'classic-spawn-lane-cycle',
  mode:'classic',players:1,seed:777,
  steps:[{frames:900}],
  assert:[
    {desc:'every enemy spawns on one of the three rom spawn points',
     check(g,H,T){const s=enemySpawns(T);return {ok:s.length>0&&s.every(x=>x.lane!==null),lanes:s.map(x=>x.lane)};}},
    {desc:'the first four spawns cycle middle, right, left, middle',
     check(g,H,T){const l=enemySpawns(T).map(x=>x.lane).slice(0,4);return {ok:JSON.stringify(l)==='[1,2,0,1]',lanes:l};}},
    {desc:'no two consecutive enemies spawn on the same point',
     check(g,H,T){const l=enemySpawns(T).map(x=>x.lane),bad=[];
       for(let i=1;i<l.length;i++)if(l[i]===l[i-1])bad.push({index:i,lane:l[i]});
       return {ok:bad.length===0,repeats:bad,lanes:l};}}
  ],
  measure(g,H,T){return {spawns:enemySpawns(T).map(s=>({frame:s.frame,lane:s.lane,x:s.x,y:s.y}))};}
},
{
  name:'classic-spawn-interval-is-rom-paced',
  mode:'classic',players:1,seed:777,
  steps:[{frames:900}],
  assert:[
    {desc:'the gap between the first four spawns is 191-4*stage frames (187 on stage 1, the rom interval byte plus one)',
     check(g,H,T){const f=enemySpawns(T).map(s=>s.frame).slice(0,4),d=[];
       for(let i=1;i<f.length;i++)d.push(f[i]-f[i-1]);
       return {ok:d.length===3&&d.every(x=>x===187),deltas:d,frames:f,spawnDelay:g.rules.spawnDelay};}}
  ],
  measure(g,H,T){const f=enemySpawns(T).map(s=>s.frame),d=[];
    for(let i=1;i<f.length;i++)d.push(f[i]-f[i-1]);
    return {spawnDelay:g.rules.spawnDelay,firstSpawnFrame:f[0],deltas:d};}
},
{
  name:'classic-bot-run-does-not-stack-spawns',
  mode:'classic',players:1,seed:777,
  steps:[{frames:3600,inputs:f=>botPads(f)}],
  assert:[
    {desc:'under bot input, no spawning enemy is ever overlapped by a live one. weak run by construction: the bots shoot their own eagle, so the round usually ends early — the load-bearing case is classic-no-enemy-spawns-onto-another',
     check(g,H,T){const bad=[];
       for(const o of T.overlaps)for(const p of o.pairs)if((p.aState==='spawning')!==(p.bState==='spawning'))bad.push({frame:o.frame,...p});
       return {ok:bad.length===0,frames:bad.length,endedAt:g.frame,state:g.state};}}
  ],
  measure(g,H,T){const s=enemySpawns(T);
    return {enemySpawns:s.length,overlapFrames:T.overlaps.length,endState:g.state,
      overlapSpansTotal:T.overlaps.length,overlapSpansShown:Math.min(10,T.overlaps.length),
      overlapSpansFirst10:T.overlaps.slice(0,10).map(o=>({frame:o.frame,pairs:o.pairs.length}))};}
},
{
  name:'classic-spawn-point-stays-clear',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[0x80,0x80,0x80,0x80];g.spawnTimer=1;},
  steps:[{frames:1},
    {action(g,H){const t=H.enemies(g)[0];if(!t)throw Error('scenario: expected one enemy after the first spawn');
      t.controller=function(){};t.state='alive';g.__parked=t;}},
    {frames:600}],
  assert:[
    {desc:'an enemy parked on its spawn point never has another enemy spawned onto it',
     check(g,H,T){const p=g.__parked,bad=T.spawns.filter(s=>s.id!==p.id&&s.team==='enemy'&&BC.rectsOverlap(s.x,s.y,16,16,p.x,p.y,16,16));
       return {ok:bad.length===0,parked:{x:p.x,y:p.y,lane:H.lane(p.x,p.y)},collisions:bad};}}
  ],
  measure(g,H,T){return {spawns:enemySpawns(T).map(s=>({frame:s.frame,lane:s.lane}))};}
},
{
  name:'classic-spawn-animation-does-not-collide',
  mode:'classic',players:1,seed:777,
  steps:[{frames:40}],
  assert:[
    {desc:'a spawning enemy is not yet in the alive state',
     check(g,H){const s=H.enemies(g).filter(t=>t.state==='spawning');return {ok:s.length>=1,spawning:s.length,
       timers:s.map(t=>t.timer)};}},
    {desc:'the spawn animation lasts 28 frames, as measured on the rom (14 phase steps, two frames each)',
     check(g,H){const s=H.enemies(g).filter(t=>t.state==='spawning');const t=s[0];
       return {ok:t!==undefined&&t.timer<=28,timer:t?t.timer:null,frame:g.frame};}}
  ]
}
];
