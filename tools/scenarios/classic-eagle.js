const BC=window.BC;

module.exports=[
{
  name:'classic-eagle-wall-at-stage-start',
  mode:'classic',players:1,seed:777,
  assert:[
    {desc:'the 8 rom base-wall cells around the eagle are brick at stage start',
     check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'brick'),counts:w.counts,total:w.total,
       nonBrick:w.list.filter(c=>c.kind!=='brick')};}},
    {desc:'the eagle itself occupies four eagle cells',
     check(g,H){const e=H.eagle(g),cx=e.x/8,cy=e.y/8,k=[[cx,cy],[cx+1,cy],[cx,cy+1],[cx+1,cy+1]].map(([a,b])=>H.cellName(g.map.get(a,b)));
       return {ok:k.every(x=>x==='eagle'),cells:k};}}
  ],
  measure(g,H){return {eagleXY:[H.eagle(g).x,H.eagle(g).y],wall:H.eagleWall(g).counts,thinRing:H.eagleRing(g).counts};}
},
{
  name:'classic-eagle-wall-survives-stage-2',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];},
  steps:[{frames:200},{action(g,H){for(const t of H.enemies(g))g.killTank(t,null,true);}},{frames:220}],
  assert:[
    {desc:'stage advanced past 1',check(g){return {ok:g.stage>1,stage:g.stage};}},
    {desc:'the base wall is brick again on the next stage',
     check(g,H){const w=H.eagleWall(g);return {ok:H.allOf(w,'brick'),counts:w.counts,
       nonBrick:w.list.filter(c=>c.kind!=='brick')};}}
  ]
},
{
  name:'classic-eagle-destroyed-is-game-over',
  mode:'classic',players:1,seed:777,
  setup(g,H){
    const e=H.eagle(g);
    for(const [cx,cy] of H.wallCells(e))g.map.set(cx,cy,BC.EMPTY);
    const t=g.spawnTank({x:e.x,y:e.y-16,cls:0x80,team:'enemy',dir:BC.DOWN,instant:true});
    t.controller=function(){};
    g.__shooter=t;
  },
  steps:[{frames:2},{action(g){g.fire(g.__shooter);}},{frames:30}],
  assert:[
    {desc:'the eagle is destroyed by an enemy bullet',check(g,H){return {ok:g.eagles[0].alive===false};}},
    {desc:'destroying the eagle ends the round',check(g){return {ok:g.state==='over',state:g.state,result:g.result&&g.result.text};}}
  ]
}
];
