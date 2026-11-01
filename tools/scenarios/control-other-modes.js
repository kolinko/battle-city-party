const BC=window.BC;
const RING_MODES=['team-deathmatch','boss-defender','capture-eagle'];

module.exports=RING_MODES.map(id=>({
  name:'control-'+id+'-still-walls-its-eagles',
  mode:id,players:2,seed:777,
  steps:[{frames:0,assert:[
      {desc:'the mode starts with its own eagles walled by ringEagle',
       check(g,H){const walls=g.eagles.map(e=>H.eagleWall(g,e).counts);
         const any=walls.some(c=>(c.brick||0)+(c.steel||0)>0);
         return {ok:g.eagles.length>0&&any,eagles:g.eagles.length,walls};}}]},
    {frames:600,inputs:f=>{const o={},dirs=['up','left','down','right'];
    for(let i=0;i<4;i++){const s={};s[dirs[(Math.floor(f/50)+i)%4]]=(f%80)<60;s.fire=(f%9)===0;o[i]=s;}return o;}}],
  assert:[
    {desc:'the mode still runs 600 frames of bots without an engine exception',
     check(g,H){return {ok:g.frame===600,state:g.state,frame:g.frame};}}
  ],
  measure(g,H){return {eagles:g.eagles.map(e=>({x:e.x,y:e.y,team:e.team,alive:e.alive,wall:H.eagleWall(g,e).counts}))};}
}));
