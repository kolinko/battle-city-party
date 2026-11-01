const BC=window.BC;
function enemies(g){return g.tanks.filter(t=>t.team==='enemy');}
function skip(g,H,id){H.mode(id).skipBrief(g);}
module.exports=[
{
  name:'story-briefing-needs-a-released-then-held-fire',
  mode:'story-westerplatte',players:2,seed:777,
  steps:[
    {frames:100,inputs:{0:{fire:true}},assert:[
      {desc:'fire held from frame 0 never arms the page, so the game stays on hold and no enemy spawns',
       check(g){return {ok:g.hold===true&&g.story.brief!==null&&g.story.brief.held===0&&g.enemiesSpawned===0,hold:g.hold,held:g.story.brief&&g.story.brief.held,spawned:g.enemiesSpawned};}}]},
    {frames:5,inputs:{}},
    {frames:20,inputs:{1:{fire:true}}},
    {frames:5,inputs:{}},
    {frames:1,assert:[{desc:'a 20 frame tap after release does not turn the page and the hold meter resets',
       check(g){return {ok:g.story.brief!==null&&g.story.brief.title==='HOW TO PLAY'&&g.story.brief.held===0,title:g.story.brief&&g.story.brief.title,held:g.story.brief&&g.story.brief.held};}}]},
    {frames:40,inputs:{0:{up:true,start:true,select:true}},assert:[{desc:'directions start and select never turn the page',
       check(g){return {ok:g.story.brief!==null&&g.story.brief.title==='HOW TO PLAY',title:g.story.brief&&g.story.brief.title};}}]},
    {frames:61,inputs:{1:{fire:true}},assert:[
      {desc:'holding fire for 60 frames turns the rules page into the day 1 briefing, which is not armed while fire stays down',
       check(g){return {ok:g.hold===true&&g.story.brief!==null&&g.story.brief.title==='DAY 1 - 1 IX 1939'&&g.story.brief.armed[1]!==true,title:g.story.brief&&g.story.brief.title};}}]},
    {frames:5,inputs:{}},
    {frames:44,inputs:{1:{fire:true}},assert:[{desc:'the 45 frame minimum visibility blocks the meter on the second page too',check(g){return {ok:g.story.brief!==null&&g.story.brief.held<=6,held:g.story.brief&&g.story.brief.held};}}]},
    {frames:62,inputs:{1:{fire:true}},assert:[
      {desc:'a full hold on the second page releases the game',check(g){return {ok:g.hold===false&&g.story.brief===null,hold:g.hold,frame:g.frame};}}]},
    {frames:200,inputs:{},assert:[
      {desc:'enemies spawn once the hold is released',check(g){return {ok:g.enemiesSpawned>0,spawned:g.enemiesSpawned};}}]}
  ],
  measure(g){return {mission:g.story.n,queue:g.rules.enemyQueue.length};}
},
{
  name:'story-westerplatte-keeps-base-damage-between-days',
  mode:'story-westerplatte',players:1,seed:777,
  setup(g,H){skip(g,H,'story-westerplatte');g.rules.maxEnemies=0;},
  steps:[
    {action(g,H){const w=H.ringCells(H.eagle(g));g.__broken=w.slice(0,3);for(const [cx,cy] of g.__broken)g.map.set(cx,cy,BC.EMPTY);g.rules.enemyQueue=[];},
     frames:1,assert:[{desc:'forced: three ring cells knocked out and the queue emptied, so day 1 counts as won',check(g){return {ok:g.story.phase==='clear',phase:g.story.phase};}}]},
    {frames:210,assert:[
      {desc:'day 2 begins with its briefing',check(g){return {ok:g.story.n===2&&g.story.brief!==null,mission:g.story.n};}},
      {desc:'the three destroyed ring cells stay empty on day 2 - nobody repaired the base',
       check(g,H){const w=H.eagleWall(g);return {ok:w.counts.empty===3&&w.counts.brick===5,counts:w.counts};}}]}
  ]
},
{
  name:'story-warszawa-black-monday-is-a-timed-survival-with-endless-enemies',
  mode:'story-warszawa',players:1,seed:777,
  setup(g,H){H.mode('story-warszawa').jump(g,3);skip(g,H,'story-warszawa');g.rules.maxEnemies=0;g.__brick0=g.map.cell.filter(c=>c===BC.BRICK).length;},
  steps:[
    {frames:1200,assert:[
      {desc:'the queue is refilled while the clock runs (forced: no enemy can spawn, so the queue only grows)',check(g){return {ok:g.rules.enemyQueue.length>=2&&g.story.phase==='play',queue:g.rules.enemyQueue.length};}},
      {desc:'bombardment knocked bricks out of the city',check(g){const brick=g.map.cell.filter(c=>c===BC.BRICK).length;return {ok:brick<g.__brick0,brick,before:g.__brick0};}}]},
    {action(g){g.story.start=g.frame-7200;},frames:2,assert:[
      {desc:'forced clock to 2 minutes: the mission is won and the queue is dropped',check(g){return {ok:g.story.phase==='clear'&&g.rules.enemyQueue.length===0,phase:g.story.phase};}}]}
  ],
  measure(g){return {mission:g.story.n};}
},
{
  name:'story-commander-k-viper-fights-in-mission-5-and-dies-when-it-is-won',
  mode:'story-commander-k',players:1,seed:777,
  setup(g,H){H.mode('story-commander-k').jump(g,5);skip(g,H,'story-commander-k');g.rules.maxEnemies=0;},
  steps:[
    {frames:60,assert:[
      {desc:'an AI ally tagged viper is on the players team',check(g){const a=g.tanks.find(t=>t.tags.ally);return {ok:!!a&&a.team==='players'&&a.ai===true&&a.player===null,ally:a?{x:a.x,y:a.y,hp:a.hp}:null};}}]},
    {action(g){g.rules.enemyQueue=[];},frames:2,assert:[
      {desc:'forced win of mission 5 removes viper from the field',check(g){return {ok:g.story.phase==='clear'&&!g.tanks.some(t=>t.tags.ally),phase:g.story.phase,tanks:g.tanks.length};}}]},
    {frames:210,assert:[{desc:'mission 6 briefing follows',check(g){return {ok:g.story.n===6&&g.story.brief!==null,mission:g.story.n};}}]}
  ]
},
{
  name:'story-commander-k-final-mission-needs-the-boss-dead',
  mode:'story-commander-k',players:1,seed:777,
  setup(g,H){H.mode('story-commander-k').jump(g,7);skip(g,H,'story-commander-k');g.rules.maxEnemies=0;},
  steps:[
    {action(g){g.rules.enemyQueue=[];},frames:2,assert:[
      {desc:'an empty queue does not win while the 12 hp boss lives',check(g){const b=g.tanks.find(t=>t.tags.boss);return {ok:g.story.phase==='play'&&!!b&&b.hp===12,phase:g.story.phase,bossHp:b?b.hp:null};}}]},
    {action(g){const b=g.tanks.find(t=>t.tags.boss);g.killTank(b,g.players[0].tank,true);},frames:2,assert:[
      {desc:'killing the boss wins the mission',check(g){return {ok:g.story.phase==='clear',phase:g.story.phase};}}]},
    {frames:210,assert:[{desc:'the campaign ends with THE LINE HELD',check(g){return {ok:g.state==='over'&&g.result.text==='THE LINE HELD',result:g.result};}}]}
  ]
},
{
  name:'story-lone-wolf-extraction-appears-after-wave-5-and-ends-the-run',
  mode:'story-lone-wolf',players:1,seed:777,
  setup(g,H){skip(g,H,'story-lone-wolf');g.rules.maxEnemies=0;},
  steps:[
    {action(g){g.lw.wave=5;g.rules.enemyQueue=[];},frames:2,assert:[
      {desc:'forced: wave 5 cleared, so the LZ phase starts and the west bank is cleared',
       check(g,H){return {ok:g.lw.phase==='lz'&&H.cell(g,0,12)===BC.EMPTY&&H.cell(g,1,13)===BC.EMPTY,phase:g.lw.phase};}}]},
    {action(g){const t=g.players[0].tank;t.state='alive';t.x=0;t.y=96;},frames:2,assert:[
      {desc:'standing on the LZ extracts the wolf',check(g){return {ok:g.state==='over'&&g.result.text==='EXTRACTED',result:g.result};}}]}
  ]
},
{
  name:'story-lone-wolf-one-life-no-respawn',
  mode:'story-lone-wolf',players:1,seed:777,
  setup(g,H){skip(g,H,'story-lone-wolf');g.rules.maxEnemies=0;},
  steps:[{frames:40},
    {action(g){const t=g.players[0].tank;t.state='alive';g.killTank(t,null,true);},frames:2,assert:[
      {desc:'the single tank dying ends the run as KIA',check(g){return {ok:g.state==='over'&&g.result.text==='KIA',result:g.result,lives:g.players[0].lives};}}]}]
},
{
  name:'story-trek-shields-regenerate-and-time-warp-is-capped',
  mode:'story-trek',players:1,seed:777,
  setup(g,H){skip(g,H,'story-trek');g.rules.maxEnemies=0;},
  steps:[{frames:40},
    {action(g){const t=g.players[0].tank;t.state='alive';t.hp=1;g.freezeTimer=640;},frames:1,assert:[
      {desc:'the saucer has 3 shield points and a full 640 frame clock is cut to 180',check(g){return {ok:g.players[0].tank.maxHp===3&&g.freezeTimer===180,maxHp:g.players[0].tank.maxHp,freeze:g.freezeTimer};}}]},
    {frames:1200,assert:[{desc:'two regen ticks bring the shields back to full',check(g){const t=g.players[0].tank;return {ok:t.hp===3,hp:t.hp,frame:g.frame};}}]}]
},
{
  name:'story-trek-wolf-359-needs-the-queen-dead',
  mode:'story-trek',players:1,seed:777,
  setup(g,H){H.mode('story-trek').jump(g,5);skip(g,H,'story-trek');g.rules.maxEnemies=0;},
  steps:[
    {action(g){g.rules.enemyQueue=[];},frames:2,assert:[{desc:'an empty queue does not win while the 16 hp queen lives',check(g){const q=g.tanks.find(t=>t.tags.queen);return {ok:g.story.phase==='play'&&!!q&&q.hp===16,hp:q&&q.hp};}}]},
    {action(g){const q=g.tanks.find(t=>t.tags.queen);g.killTank(q,g.players[0].tank,true);},frames:2,assert:[{desc:'killing the queen wins the mission',check(g){return {ok:g.story.phase==='clear',phase:g.story.phase};}}]},
    {frames:210,assert:[{desc:'the campaign ends with LIVE LONG AND PROSPER',check(g){return {ok:g.state==='over'&&g.result.text==='LIVE LONG AND PROSPER',result:g.result};}}]}]
}
];
