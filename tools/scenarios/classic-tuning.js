const BC=window.BC;
function clearField(g,H){for(let cy=0;cy<20;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);}
function driver(dir){return function(g,t){g.moveTank(t,dir,true);};}

module.exports=[
{
  name:'classic-tank-speeds',
  mode:'classic',players:1,seed:777,
  setup(g,H){
    g.rules.enemyQueue=[];clearField(g,H);
    g.__probe={};
    const classes={basic:0x80,fast:0xa0,power:0xc0,armor:0xe0};
    let x=0;
    for(const name of Object.keys(classes)){
      const t=g.spawnTank({x:x,y:0,cls:classes[name],team:'enemy',dir:BC.DOWN,instant:true});
      t.controller=driver(BC.DOWN);g.__probe[name]=t;x+=32;
    }
    for(const t of g.tanks)if(t.player!==null){t.state='alive';g.__probe.player=t;}
  },
  steps:[{frames:1,action(g){for(const k of Object.keys(g.__probe))g.__probe[k].__y0=g.__probe[k].y;}},
    {frames:100,inputs:{0:{up:true}}}],
  assert:[
    {desc:'player moves 0.75 px per frame',
     check(g){const t=g.__probe.player,d=Math.abs(t.y-t.__y0);return {ok:Math.abs(d-75)<=1,pixels:d,expected:75};}},
    {desc:'basic enemy moves 0.5 px per frame',
     check(g){const d=g.__probe.basic.y-g.__probe.basic.__y0;return {ok:Math.abs(d-50)<=1,pixels:d,expected:50};}},
    {desc:'fast enemy moves 1 px per frame',
     check(g){const d=g.__probe.fast.y-g.__probe.fast.__y0;return {ok:Math.abs(d-100)<=1,pixels:d,expected:100};}},
    {desc:'power enemy moves 0.5 px per frame',
     check(g){const d=g.__probe.power.y-g.__probe.power.__y0;return {ok:Math.abs(d-50)<=1,pixels:d,expected:50};}},
    {desc:'armor enemy moves 0.5 px per frame and takes four hits',
     check(g){const t=g.__probe.armor,d=t.y-t.__y0;return {ok:Math.abs(d-50)<=1&&t.hp===4,pixels:d,hp:t.hp};}}
  ],
  measure(g){const o={};for(const k of Object.keys(g.__probe)){const t=g.__probe[k];o[k]={moved:Math.abs(t.y-t.__y0),speed:t.speed,bulletSpeed:t.bulletSpeed,hp:t.hp};}return o;}
},
{
  name:'classic-star-levels',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];clearField(g,H);
    const t=H.playerTank(g);t.state='alive';g.__p=t;g.__fired=[];},
  steps:[
    {action(g,H){const t=g.__p;t.level=0;g.bullets=[];g.fire(t);g.fire(t);g.__fired.push({level:0,bullets:g.bullets.length,speed:g.bullets.length?g.bullets[0].speed:null,power:g.bullets.length?g.bullets[0].power:null});}},
    {action(g,H){const t=g.__p;t.level=1;g.bullets=[];g.fire(t);g.fire(t);g.__fired.push({level:1,bullets:g.bullets.length,speed:g.bullets[0].speed,power:g.bullets[0].power});}},
    {action(g,H){const t=g.__p;t.level=2;g.bullets=[];g.fire(t);g.fire(t);g.__fired.push({level:2,bullets:g.bullets.length,speed:g.bullets[0].speed,power:g.bullets[0].power});}},
    {action(g,H){const t=g.__p;t.level=3;g.bullets=[];g.fire(t);g.fire(t);g.__fired.push({level:3,bullets:g.bullets.length,speed:g.bullets[0].speed,power:g.bullets[0].power});}},
    {action(g,H){const t=g.__p;g.bullets=[];t.level=0;g.map.set(t.x/8,t.y/8-1,BC.STEEL);g.map.set(t.x/8+1,t.y/8-1,BC.STEEL);t.dir=BC.UP;g.fire(t);}},
    {frames:8,assert:[{desc:'a level 0 bullet does not break steel',
      check(g,H){const t=g.__p;return {ok:g.map.get(t.x/8,t.y/8-1)===BC.STEEL,cell:H.cellName(g.map.get(t.x/8,t.y/8-1))};}}]},
    {action(g,H){const t=g.__p;g.bullets=[];t.level=3;g.map.set(t.x/8,t.y/8-1,BC.STEEL);g.map.set(t.x/8+1,t.y/8-1,BC.STEEL);t.dir=BC.UP;g.fire(t);}},
    {frames:8,assert:[{desc:'a level 3 bullet breaks steel',
      check(g,H){const t=g.__p;return {ok:g.map.get(t.x/8,t.y/8-1)===BC.EMPTY,cell:H.cellName(g.map.get(t.x/8,t.y/8-1))};}}]}
  ],
  assert:[
    {desc:'one live bullet at star 0 and 1, two at star 2 and 3',
     check(g){const f=g.__fired;return {ok:f[0].bullets===1&&f[1].bullets===1&&f[2].bullets===2&&f[3].bullets===2,fired:f};}},
    {desc:'bullet speed 2 at star 0, 4 from star 1 up',
     check(g){const f=g.__fired;return {ok:f[0].speed===2&&f[1].speed===4&&f[2].speed===4&&f[3].speed===4,speeds:f.map(x=>x.speed)};}}
  ],
  measure(g){return {fired:g.__fired};}
},
{
  name:'classic-powerup-timers',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];const t=H.playerTank(g);t.state='alive';t.shield=0;g.__p=t;},
  steps:[
    {action(g,H){g.applyPowerup(g.__p,BC.POWERUPS.indexOf('helmet'));}},
    {frames:0,assert:[{desc:'helmet gives 640 frames of shield',check(g){return {ok:g.__p.shield===640,shield:g.__p.shield};}}]},
    {action(g,H){g.applyPowerup(g.__p,BC.POWERUPS.indexOf('clock'));}},
    {frames:0,assert:[{desc:'clock freezes enemies for 640 frames',check(g){return {ok:g.freezeTimer===640,freezeTimer:g.freezeTimer};}}]},
    {action(g,H){g.__lives=g.players[0].lives;g.applyPowerup(g.__p,BC.POWERUPS.indexOf('tank'));}},
    {frames:0,assert:[{desc:'tank bonus adds one life',check(g){return {ok:g.players[0].lives===g.__lives+1,lives:g.players[0].lives};}}]},
    {action(g,H){g.rules.enemyQueue=[0x80,0x80];g.spawnTimer=1;}},
    {frames:80},
    {action(g,H){g.__before=H.enemies(g).length;g.applyPowerup(g.__p,BC.POWERUPS.indexOf('grenade'));}},
    {frames:0,assert:[{desc:'grenade clears every live enemy',
      check(g,H){return {ok:g.__before>0&&H.enemies(g).filter(t=>t.state==='alive').length===0,before:g.__before,after:H.enemies(g).length};}}]},
    {action(g,H){const t=H.playerTank(g);g.killTank(t,null,true);}},
    {frames:62},
    {frames:0,assert:[{desc:'a respawned player gets 192 frames of shield',
      check(g,H){const t=H.playerTank(g);return {ok:t!==null&&t.shield===192,shield:t?t.shield:null};}}]}
  ],
  measure(g,H){const t=H.playerTank(g);return {respawnShield:t?t.shield:null,lives:g.players[0].lives,score:g.players[0].score};}
},
{
  name:'classic-terrain-rules',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.enemyQueue=[];clearField(g,H);
    const t=H.playerTank(g);t.state='alive';g.__p=t;
    g.map.set(4,10,BC.WATER);g.map.set(5,10,BC.WATER);
    g.map.set(8,10,BC.TREES);g.map.set(9,10,BC.TREES);
    for(let cx=12;cx<20;cx++)for(let cy=8;cy<12;cy++)g.map.set(cx,cy,BC.ICE);},
  steps:[
    {action(g,H){const t=g.__p;t.x=32;t.y=96;t.dir=BC.UP;g.__waterBlocked=g.blockedAt(t,32,80);
      t.x=64;t.y=96;g.__treesBlocked=g.blockedAt(t,64,80);}},
    {frames:0,assert:[
      {desc:'water blocks a tank',check(g){return {ok:g.__waterBlocked===true,blocked:g.__waterBlocked};}},
      {desc:'trees do not block a tank',check(g){return {ok:g.__treesBlocked===false,blocked:g.__treesBlocked};}}
    ]},
    {action(g,H){const t=g.__p;t.x=112;t.y=72;t.dir=BC.DOWN;t.slide=0;g.__onIce=g.onIce(t);}},
    {frames:0,assert:[{desc:'a tank standing on ice is detected as on ice',check(g){return {ok:g.__onIce===true,onIce:g.__onIce};}}]},
    {action(g,H){const t=g.__p;t.x=112;t.y=72;t.dir=BC.RIGHT;t.slide=0;}},
    {frames:10,inputs:{0:{right:true}}},
    {action(g,H){g.__slideStart={x:g.__p.x,slide:g.__p.slide};}},
    {frames:40},
    {frames:0,assert:[{desc:'releasing the stick on ice keeps the tank sliding',
      check(g){const t=g.__p;return {ok:t.x>g.__slideStart.x,from:g.__slideStart,to:{x:t.x,slide:t.slide}};}}]}
  ]
}
];
