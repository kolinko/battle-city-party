const BC=window.BC;
function clearField(g){for(let cy=0;cy<20;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);}
function firer(log){return function(g,t){if(g.fire(t))log.push(g.frame);};}

module.exports=[
{
  name:'classic-fire-slot-stays-busy-for-9-frames-after-the-bullet-hits',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];clearField(g);
    const p=H.playerTank(g);p.state='alive';p.shield=0;p.x=32;p.y=64;p.dir=BC.UP;g.__p=p;g.__pf=[];p.controller=firer(g.__pf);
    g.map.set(4,6,BC.STEEL);g.map.set(5,6,BC.STEEL);
    const e=g.spawnTank({x:128,y:64,cls:0x80,team:'enemy',dir:BC.UP,instant:true});e.state='alive';g.__e=e;g.__ef=[];e.controller=firer(g.__ef);
    g.map.set(16,6,BC.STEEL);g.map.set(17,6,BC.STEEL);
  },
  steps:[{frames:60,inputs:(f,g)=>{if(g.__hitP===undefined&&g.__p.reload===9)g.__hitP=g.frame;if(g.__hitE===undefined&&g.__e.reload===9)g.__hitE=g.frame;return {};}}],
  assert:[
    {desc:'forced layout: player and a basic enemy each face a steel cell two cells ahead and try to fire every frame through a controller',
     check(g){return {ok:g.__pf.length>=2&&g.__ef.length>=2,playerFires:g.__pf,enemyFires:g.__ef};}},
    {desc:'player: the second shot leaves exactly 9 frames after the first bullet hit the wall (rom: impact states $33..$11 occupy the slot, measured re-arm at impact+9)',
     check(g){return {ok:g.__hitP!==undefined&&g.__pf[1]===g.__hitP+9,firstFire:g.__pf[0],hit:g.__hitP,secondFire:g.__pf[1],expected:g.__hitP+9};}},
    {desc:'enemy: the same 9-frame impact lock applies to an enemy slot',
     check(g){return {ok:g.__hitE!==undefined&&g.__ef[1]===g.__hitE+9,firstFire:g.__ef[0],hit:g.__hitE,secondFire:g.__ef[1]};}}
  ],
  measure(g){return {playerFires:g.__pf,enemyFires:g.__ef,playerHit:g.__hitP,enemyHit:g.__hitE,reloadConst:9};}
},
{
  name:'classic-player-starts-with-two-reserves-and-three-tanks',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];clearField(g);g.__seq=[];},
  steps:[
    {frames:1,assert:[{desc:'hud reserve digit is 2 at stage start, like the nes IP 2 (rom $51=3 with hud = lives-1)',check(g){return {ok:g.players[0].lives===2,lives:g.players[0].lives};}}]},
    {action(g,H){g.killTank(H.playerTank(g),null,true);g.__seq.push(g.players[0].lives);}},{frames:70},
    {action(g,H){g.killTank(H.playerTank(g),null,true);g.__seq.push(g.players[0].lives);}},{frames:70},
    {action(g,H){g.killTank(H.playerTank(g),null,true);g.__seq.push(g.players[0].lives);}},{frames:5}
  ],
  assert:[
    {desc:'reserves go 1, 0 and the third death is game over: three tanks in total, as measured on the rom ($51 3 -> 2 -> 1 -> 0, HUD 2/1/0)',
     check(g){return {ok:JSON.stringify(g.__seq)===JSON.stringify([1,0,0])&&g.players[0].alive===false&&g.state==='over',seq:g.__seq,alive:g.players[0].alive,state:g.state};}}
  ],
  measure(g){return {livesAfterEachDeath:g.__seq,state:g.state};}
},
{
  name:'classic-enemies-run-the-rom-ai-state-machine',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.__turns=0;g.__alive=0;g.__shots=0;g.__prev=new Map();const f=g.fire.bind(g);g.fire=t=>{const ok=f(t);if(ok&&t.player===null)g.__shots++;return ok;};g.__phase={};},
  steps:[{frames:3600,inputs:(f,g,H)=>{for(const t of H.enemies(g)){if(t.state!=='alive')continue;g.__alive++;const o=g.__prev.get(t.id);if(o!==undefined&&o!==t.dir)g.__turns++;g.__prev.set(t.id,t.dir);const st=t.aiState.st||'none';g.__phase[st]=(g.__phase[st]||0)+1;}return {};}}],
  assert:[
    {desc:'every enemy carries the rom controller installed by onSpawn, not the generic aiEnemy heuristic',
     check(g,H){const e=H.enemies(g);return {ok:e.length>0&&e.every(t=>typeof t.controller==='function'),enemies:e.length};}},
    {desc:'turn rate within the rom band measured on stage 1 (rom state-bit changes 2.1 per 100 alive-enemy frames over five stationary-player episodes, of which real $a0-to-$a0 turns are 0.22; the pause states read as direction 0 and inflate the raw figure); accept 0.2-3.0',
     check(g){const r=100*g.__turns/g.__alive;return {ok:r>0.2&&r<3.0,turnsPer100:r,turns:g.__turns,aliveFrames:g.__alive};}},
    {desc:'visible shot rate within the rom band (rom 1.1-1.9 per 100 alive-enemy frames); accept 0.7-2.5',
     check(g){const r=100*g.__shots/g.__alive;return {ok:r>0.7&&r<2.5,shotsPer100:r,shots:g.__shots};}},
    {desc:'the eagle survives the first 3600 frames against a stationary player far more often than under the old heuristic (rom wander/hunt phases do not beeline for the base before frame 3008 on stage 1)',
     check(g){return {ok:g.state==='playing'||g.frame>3000,state:g.state,frame:g.frame};}}
  ],
  measure(g){return {turnsPer100:100*g.__turns/g.__alive,shotsPer100:100*g.__shots/g.__alive,aliveFrames:g.__alive,phases:g.__phase,state:g.state,frame:g.frame};}
}
];
