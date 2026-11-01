const BC=window.BC,A=window.BC_ASSETS;
const CLASSES=[0x80,0xa0,0xc0,0xe0];
function romScore(b){return ((b>>4)*10+(b&15))*10;}

module.exports=[
{
  name:'classic-scoring-matches-the-rom-score-bytes',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.maxEnemies=0;},
  steps:[{frames:40},
    {action(g,H){const p=H.playerTank(g);p.state='alive';g.__p=p;g.__before=g.players[0].score;
      g.__victims=CLASSES.map((c,i)=>g.spawnTank({x:i*32,y:0,cls:c,team:'enemy',dir:BC.DOWN,instant:true}));}},
    {action(g,H){g.__killScores=[];
      for(const v of g.__victims){const s0=g.players[0].score;g.killTank(v,g.__p,true);g.__killScores.push(g.players[0].score-s0);}}},
    {action(g,H){const s0=g.players[0].score;g.applyPowerup(g.__p,BC.POWERUPS.indexOf('helmet'));g.__pickupScore=g.players[0].score-s0;}}],
  assert:[
    {desc:'engine class scores equal the rom score bytes read as bcd digits at score positions 4 and 5',
     check(g){const rom=A.enemyScore.map(romScore),eng=CLASSES.map(c=>BC.ENEMY_CLASSES[c].score);
       return {ok:JSON.stringify(rom)===JSON.stringify(eng),romBytes:A.enemyScore,romRendered:rom,engine:eng};}},
    {desc:'killing an enemy credits exactly its class score to the shooting player',
     check(g){const eng=CLASSES.map(c=>BC.ENEMY_CLASSES[c].score);
       return {ok:JSON.stringify(g.__killScores)===JSON.stringify(eng),credited:g.__killScores,expected:eng};}},
    {desc:'a power-up pickup credits 500, the rom 0x50 addend',
     check(g){return {ok:g.__pickupScore===500,credited:g.__pickupScore};}}
  ],
  measure(g){return {romBytes:A.enemyScore,romRendered:A.enemyScore.map(romScore),
    engine:CLASSES.map(c=>({cls:'0x'+c.toString(16),name:BC.ENEMY_CLASSES[c].name,score:BC.ENEMY_CLASSES[c].score})),
    killCredits:g.__killScores,pickupCredit:g.__pickupScore,romSha256:A.romSha256};}
}
];
