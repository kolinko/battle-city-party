(function(){
'use strict';
const BC=window.BC;
const BTN=['up','down','left','right','fire','start','select'];
const CLEAR_FRAMES=200,LINE_MAX=22,BRIEF_MIN=45,BRIEF_HOLD=60,WARP_CAP=180;
function edges(st,inputs,n){
  const out=[];
  if(!st.prev)st.prev=[];
  for(let i=0;i<n;i++){const cur=(inputs&&inputs[i])||{};const p=st.prev[i]||{};const e={},now={};
    for(const b of BTN){const v=cur[b]===true;e[b]=v&&p[b]!==true;now[b]=v;}
    st.prev[i]=now;out.push(e);}
  return out;
}
function panel(ctx,x,y,w,h){ctx.fillStyle='rgba(0,0,0,0.92)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#f8f8f8';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);}
function bar(ctx,x,y,w,h,frac,color){ctx.fillStyle='#303030';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x,y,Math.round(w*Math.max(0,Math.min(1,frac))),h);}
function checkText(s){
  if(!/^[A-Z0-9 .-]*$/.test(s))throw Error('story: text has a glyph the ROM font lacks: '+JSON.stringify(s));
  if(s.length>LINE_MAX)throw Error('story: line over '+LINE_MAX+' chars: '+s);
}
function mix(g,n,classes){const out=[];for(let i=0;i<n;i++)out.push(classes[Math.floor(g.random()*classes.length)]);return out;}
function clearField(g){g.tanks.length=0;g.bullets.length=0;g.powerups.length=0;g.effects.length=0;for(const p of g.players){p.tank=null;p.respawnTimer=0;}}
function enemies(g){return g.tanks.filter(t=>t.team==='enemy');}
function killEnemies(g){for(const t of g.tanks.slice())if(t.team==='enemy')g.killTank(t,null,true);}
function ringCells(e){const cx0=e.x/8,cy0=e.y/8,out=[];for(let cy=cy0-1;cy<=cy0+2;cy++)for(let cx=cx0-1;cx<=cx0+2;cx++){if(cx>=cx0&&cx<cx0+2&&cy>=cy0&&cy<cy0+2)continue;if(cx<0||cy<0||cx>=BC.GRID||cy>=BC.GRID)continue;out.push([cx,cy]);}return out;}
function bombard(g,n){let hit=false;for(let i=0;i<n;i++){for(let tries=0;tries<30;tries++){const cx=Math.floor(g.random()*BC.GRID),cy=Math.floor(g.random()*BC.GRID);if(g.map.get(cx,cy)!==BC.BRICK)continue;g.map.set(cx,cy,BC.EMPTY);g.explode(cx*8-8,cy*8-8,true);hit=true;break;}}if(hit)BC.sfx('explode');}
function clearRows(g,from,to){for(let cy=from;cy<=to;cy++)for(let cx=0;cx<BC.GRID;cx++)g.map.set(cx,cy,BC.EMPTY);}
function forestBand(g,from,to,p){for(let cy=from;cy<=to;cy++)for(let cx=0;cx<BC.GRID;cx++)if(g.map.get(cx,cy)===BC.EMPTY&&g.random()<p)g.map.set(cx,cy,BC.TREES);}

const bmCache=new Map();
function rotate(rows,k){let r=rows;for(let i=0;i<k;i++){const n=r.length,out=[];for(let y=0;y<n;y++){let s='';for(let x=0;x<n;x++)s+=r[n-1-x].charAt(y);out.push(s);}r=out;}return r;}
function bitmap(key,rows,colors){
  let b=bmCache.get(key);
  if(b)return b;
  const h=rows.length,w=rows[0].length,data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++){if(rows[y].length!==w)throw Error('story: bitmap '+key+' row '+y+' has width '+rows[y].length);
    for(let x=0;x<w;x++){const c=colors[rows[y].charAt(x)];if(!c)continue;const o=(y*w+x)*4;data[o]=c[0];data[o+1]=c[1];data[o+2]=c[2];data[o+3]=255;}}
  b={width:w,height:h,data};bmCache.set(key,b);return b;
}
function dirBitmap(key,rows,colors,dir){return bitmap(key+':'+dir,rotate(rows,{0:0,3:1,2:2,1:3}[dir]),colors);}
const EMPIK=['.KKKKKKKKKKKKKK.','KKKKKKKKKKKKKKKK','KKKKKKKKKKKKKKKK','KKKKKWWWWWWKKKKK','KKKWWWWWWWWWWKKK','KKKWWWKKKKWWWKKK','KKWWWKKKKKKWWWKK','KKWWWWWWWWWWWWKK','KKWWWWWWWWWWWWKK','KKWWWKKKKKKKKKKK','KKKWWWKKKKKKKKKK','KKKWWWWWWKKWWKKK','KKKKKWWWWWWWKKKK','KKKKKKKKKKKKKKKK','KKKKKKKKKKKKKKKK','.KKKKKKKKKKKKKK.'];
const EMPIK_C={W:[248,248,248],K:[0,0,0],'.':[0,0,0]};
const GLYPH={
  e:['.....','.....','.WWW.','WW.WW','WWWWW','WW...','WW.WW','.WWW.','.....','.....'],
  m:['.......','.......','WWWWWWW','WW.W.WW','WW.W.WW','WW.W.WW','WW.W.WW','WW.W.WW','.......','.......'],
  p:['.....','.....','WWWW.','WW.WW','WW.WW','WW.WW','WWWW.','WW...','WW...','WW...'],
  i:['WW','..','WW','WW','WW','WW','WW','WW','..','..'],
  k:['WW...','WW...','WW.WW','WWWW.','WWW..','WWWW.','WW.WW','WW.WW','.....','.....']
};
function wordmark(word,w,h,top){const rows=[];for(let y=0;y<h;y++){let s='';for(let i=0;i<word.length;i++){const gl=GLYPH[word[i]];const r=y-top;s+=(r>=0&&r<gl.length?gl[r]:'.'.repeat(gl[0].length))+(i<word.length-1?'.':'');}while(s.length<w)s=(s.length%2?s+'.':'.'+s);rows.push(s);}return rows;}
const EMPIK_WORD=wordmark('empik',32,16,3);
const PICKLE=['................','..........dgg...','.........dgggg..','........ggggdg..','.......gggggg...','......ggdggg....','.....gggggg.....','....ggggdg......','...gggggg.......','..gdgggg........','..ggggg.........','.ggggd..........','.gggg...........','..gg............','................','................'];
const PICKLE_C={g:[96,168,48],d:[40,96,24],'.':[0,0,0]};
const SAUCER=['.......ll.......','......llll......','.....llllll.....','....llbbbbll....','...llbbbbbbll...','...llbbbbbbll...','..llllbbbbllll..','..llllllllllll..','..llllllllllll..','...llllllllll...','....llllllll....','......lrrl......','......lrrl......','.....rr..rr.....','.....rr..rr.....','................'];
const SAUCER_C={l:[200,200,212],b:[64,128,240],r:[224,64,64],'.':[0,0,0]};
const BIRD=['.......gg.......','......gddg......','.....gddddg.....','....ggddddgg....','...gg.gddg.gg...','..gg..gddg..gg..','.gg...gggg...gg.','gg....gggg....gg','gg....gggg....gg','g.....g..g.....g','......g..g......','.....gg..gg.....','.....gg..gg.....','................','................','................'];
const BIRD_C={g:[64,176,88],d:[32,96,48],'.':[0,0,0]};
const STARBASE=['....llllllll....','...llbbllbbll...','..llllllllllll..','..lbbllyyllbbl..','..llllyyyyllll..','..llllyyyyllll..','..lbbllyyllbbl..','..llllllllllll..','...llbbllbbll...','....llllllll....','......llll......','.....llllll.....','....ll.ll.ll....','....ll.ll.ll....','................','................'];
const STARBASE_C={l:[184,184,200],b:[64,128,240],y:[248,216,64],'.':[0,0,0]};

function briefState(){return {briefs:[],brief:null,edge:[],prev:[],start:0};}
function briefNext(st,g){const b=st.briefs.shift();st.brief=b?{title:b.title,lines:b.lines,open:g.frame,armed:[],held:0}:null;}
function briefOpen(st,g,title,lines){checkText(title);for(const l of lines)checkText(l);st.briefs.push({title,lines});if(!st.brief)briefNext(st,g);}
function briefSkip(st,g){st.briefs.length=0;st.brief=null;st.start=g.frame;g.hold=false;}
function briefStep(st,g,inputs){
  const b=st.brief;
  if(!b){g.hold=false;return false;}
  let held=false,pressed=false;
  for(let i=0;i<g.players.length;i++){const inp=(inputs&&inputs[i])||{};if(inp.fire!==true)b.armed[i]=true;else{pressed=true;if(b.armed[i]===true)held=true;}}
  if(!pressed)b.held=0;else if(held&&g.frame-b.open>=BRIEF_MIN)b.held++;
  if(b.held>=BRIEF_HOLD){briefNext(st,g);if(!st.brief){st.start=g.frame;g.hold=false;return false;}}
  g.hold=true;return true;
}
function briefHud(st,g,ctx,G,o){
  const b=st.brief;
  if(!b)return;
  const x=24,y=48,w=192,h=34+b.lines.length*10;
  panel(ctx,x,y,w,h);
  G.drawText(ctx,b.title,o.WHITE,x+8,y+6);
  ctx.fillStyle='#f8f8f8';ctx.fillRect(x+8,y+15,w-16,1);
  b.lines.forEach((l,i)=>G.drawText(ctx,l,o.GREY,x+8,y+20+i*10));
  G.drawText(ctx,'HOLD FIRE',b.held>0?o.WHITE:o.GREY,x+8,y+h-10);
  bar(ctx,x+w-72,y+h-8,64,4,b.held/BRIEF_HOLD,'#f8d848');
}
function placeBase(g,keep,ring){
  for(let my=11;my<=12;my++)for(let mx=4;mx<=8;mx++)g.map.setMeta(mx,my,BC.EMPTY);
  if(!g.eagles.length){const e=g.addEagle(96,192,'players');g.ringEagle(e,ring||BC.BRICK);return;}
  const e=g.eagles[0];
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(e.y/8+dy)*BC.GRID+e.x/8+dx;g.map.cell[i]=BC.EAGLE;g.map.tile[i]=0;}
  if(keep&&g.story.ring)ringCells(e).forEach(([cx,cy],i)=>g.map.set(cx,cy,g.story.ring[i]));
  else g.ringEagle(e,ring||BC.BRICK);
}
function campaign(def){
  const M=def.missions;
  for(const m of M){checkText(m.title);for(const l of m.lines)checkText(l);for(const r of (m.radio||[]))checkText(r.text);if(m.winText)checkText(m.winText);}
  checkText(def.finalText);checkText(def.loseText);checkText(def.tag);
  function begin(g,n){
    const s=g.story,m=M[n-1];
    s.n=n;g.stage=n;s.phase='play';s.start=g.frame;s.clear=0;s.radioIdx=0;
    if(def.keepDamage&&g.eagles.length)s.ring=ringCells(g.eagles[0]).map(([cx,cy])=>g.map.get(cx,cy));
    clearField(g);
    m.map(g);
    placeBase(g,def.keepDamage===true,def.ring);
    g.rules.enemyQueue=m.queue(g);g.enemiesSpawned=0;g.spawnTimer=30;g.rules.maxEnemies=m.maxEnemies||4;g.rules.spawnDelay=m.spawnDelay||90;g.rules.enemyBonusEvery=m.bonusEvery||[4,11,18];
    g.freezeTimer=0;g.shovelTimer=0;
    for(const p of g.players)if(p.alive)g.spawnPlayer(p.slot);
    if(m.spawn)m.spawn(g);
    briefOpen(s,g,m.title,m.lines);
  }
  const mode={id:def.id,name:def.name,group:'story',players:def.players||[1,2],desc:def.desc,noEagle:true,
    setup(g){
      g.rules.hud=def.hudStyle||'classic';g.rules.stageClear=false;g.rules.respawnDelay=90;g.rules.ownEagleHurts=false;
      g.story=Object.assign(briefState(),{n:0,phase:'play',clear:0,radioIdx:0,ring:null});
      if(def.init)def.init(g);
      briefOpen(g.story,g,'HOW TO PLAY',def.rules);
      begin(g,1);
    },
    onSpawn(g,t){if(def.onSpawn)def.onSpawn(g,t);},
    update(g,inputs){
      const s=g.story;s.edge=edges(s,inputs,g.players.length);
      if(briefStep(s,g,inputs))return;
      const m=M[s.n-1];
      if(def.frame)def.frame(g);
      if(s.phase==='play'){
        const t=g.frame-s.start;
        if(m.radio)while(s.radioIdx<m.radio.length&&t>=m.radio[s.radioIdx].at){g.text(m.radio[s.radioIdx].text,150);s.radioIdx++;}
        if(m.endless&&g.rules.enemyQueue.length<2)g.rules.enemyQueue.push.apply(g.rules.enemyQueue,mix(g,4,m.endless));
        if(m.update)m.update(g,t);
        const won=m.win?m.win(g,t):(g.rules.enemyQueue.length===0&&enemies(g).length===0);
        if(won){s.phase='clear';s.clear=0;g.rules.enemyQueue=[];killEnemies(g);if(m.onWin)m.onWin(g);g.text(m.winText||'MISSION COMPLETE',CLEAR_FRAMES);}
        return;
      }
      s.clear++;
      if(s.clear>=CLEAR_FRAMES){if(s.n>=M.length)g.gameOver(def.finalText,{winner:'players'});else begin(g,s.n+1);}
    },
    onPowerup(g,t,kind){if(def.onPowerup)return def.onPowerup(g,t,kind);},
    onEagleDestroyed(g){g.gameOver(def.loseText);},
    isOver(g){if(g.players.every(p=>!p.alive&&p.tank===null))return {text:def.loseText};return null;},
    hud(g,ctx,G,o){
      const s=g.story,m=M[s.n-1];
      G.drawText(ctx,def.tag+' '+s.n+' OF '+M.length,o.WHITE,16,4);
      if(def.hud)def.hud(g,ctx,G,o);
      if(m.hud)m.hud(g,ctx,G,o);
      briefHud(s,g,ctx,G,o);
    },
    jump(g,n){begin(g,n);},
    skipBrief(g){briefSkip(g.story,g);}
  };
  return BC.registerMode(mode);
}

function beach(g,density){g.buildArena(density);clearRows(g,0,3);forestBand(g,8,11,0.45);}
campaign({id:'story-westerplatte',name:'Westerplatte 1939',tag:'WESTERPLATTE',players:[1,2],keepDamage:true,
  desc:'Hold the outpost, 1-2 players. Four days, and the base is never repaired.',
  rules:['DEFEND THE GUARDHOUSE','FOUR DAYS OF ASSAULTS.','DAMAGE TO THE BASE','IS NEVER REPAIRED.','FIRE STARTS A DAY.'],
  finalText:'SEVEN DAYS HELD',loseText:'WESTERPLATTE FALLS',
  missions:[
    {title:'DAY 1 - 1 IX 1939',lines:['0448. FIRE FROM SEA.','THE FIRST ASSAULT.','HOLD THE GUARDHOUSE.','THEY EXPECT 12 HOURS.'],
     map(g){beach(g,0.4);},queue(g){return mix(g,10,[0x80]);},maxEnemies:3,spawnDelay:120,
     radio:[{at:900,text:'STILL STANDING'}],winText:'FIRST DAY HELD'},
    {title:'DAY 2 - 2 IX',lines:['STUKAS OVERHEAD.','WALLS ARE FALLING.','THE FLAG STILL FLIES.','EXPECT ARMOR.'],
     map(g){beach(g,0.4);},queue(g){return mix(g,12,[0x80,0xa0,0xc0]);},maxEnemies:4,spawnDelay:90,
     update(g,t){if(t%240===120)bombard(g,3);},radio:[{at:60,text:'BOMBS INCOMING'}],winText:'RAID OVER'},
    {title:'DAY 4 - 4 IX',lines:['THE BATTLESHIP','FIRES AGAIN.','AMMO IS LOW.','GUARDHOUSE 5 IS GONE.'],
     map(g){beach(g,0.45);},queue(g){return mix(g,14,[0x80,0xa0,0xc0,0xe0]);},maxEnemies:5,spawnDelay:80,
     update(g,t){if(t%360===180)bombard(g,2);},winText:'NIGHT FALLS'},
    {title:'DAY 7 - 7 IX',lines:['NO RELIEF IS COMING.','THE WOUNDED NEED CARE.','HOLD UNTIL 1000.','THEN WE DECIDE.'],
     map(g){beach(g,0.45);},queue(g){return mix(g,6,[0xa0,0xc0,0xe0]);},endless:[0x80,0xa0,0xc0,0xe0],maxEnemies:5,spawnDelay:70,
     update(g,t){if(t%300===150)bombard(g,2);},win(g,t){return t>=9000;},winText:'CEASEFIRE 1015',
     hud(g,ctx,G,o){const s=g.story;if(s.phase!=='play'||s.brief)return;const left=Math.max(0,Math.ceil((9000-(g.frame-s.start))/60));G.drawText(ctx,'HOLD '+Math.floor(left/60)+'.'+String(left%60).padStart(2,'0'),o.WHITE,176,4);}}
  ]});

function city(g,density){g.buildArena(density);clearRows(g,0,3);for(let i=0;i<10;i++){const mx=Math.floor(g.random()*13),my=2+Math.floor(g.random()*8);if(g.map.get(mx*2,my*2)===BC.BRICK)g.map.setMeta(mx,my,BC.STEEL);}}
campaign({id:'story-warszawa',name:'Defense of Warsaw 1939',tag:'WARSAW',players:[1,2],
  desc:'City campaign for 1-2 players. Your base is the sign of an Empik bookstore; the power-ups are pickles.',
  rules:['DEFEND THE EMPIK SIGN.','FOUR MISSIONS IN','A CROWDED CITY.','PICKLES ARE BONUSES.','FIRE STARTS A MISSION'],
  finalText:'WARSAW - 20 DAYS',loseText:'THE SIGN FELL',
  onPowerup(g,t,kind){g.text('PICKLED GHERKIN',60);},
  hud(g,ctx,G,o){
    for(const e of g.eagles)if(e.alive)ctx.drawImage(bitmap('empik',EMPIK,EMPIK_C),o.OX+e.x,o.OY+e.y);
    ctx.drawImage(bitmap('empik-word',EMPIK_WORD,EMPIK_C),224,116);
    for(const pu of g.powerups)if((pu.age>>3)&1||pu.age>60)ctx.drawImage(bitmap('pickle',PICKLE,PICKLE_C),o.OX+pu.x,o.OY+pu.y);
  },
  missions:[
    {title:'OCHOTA - 8 IX 1939',lines:['PANZERS AT THE GATES.','BARRICADES ON GROJECKA','FIGHT STREET BY STREET','THE SIGN MUST STAND.'],
     map(g){city(g,0.65);},queue(g){return mix(g,12,[0x80,0xa0,0xa0]);},maxEnemies:4,spawnDelay:90,winText:'OCHOTA HELD'},
    {title:'PRAGA - 15 IX',lines:['THE RING CLOSES.','EAST BANK UNDER FIRE.','NO GHERKIN LEFT BEHIND','EAT WHAT YOU FIND.'],
     map(g){city(g,0.6);},queue(g){return mix(g,14,[0x80,0xa0,0xc0]);},maxEnemies:4,spawnDelay:85,
     update(g,t){if(t%720===300&&g.powerups.length<2)g.spawnPowerup(g.randomPowerupKind());},winText:'PRAGA HELD'},
    {title:'BLACK MONDAY - 25 IX',lines:['BOMBS ALL DAY.','WATER IS OUT.','SURVIVE THE DAY.','2 MINUTES.'],
     map(g){city(g,0.7);},queue(g){return mix(g,6,[0x80,0xa0,0xc0]);},endless:[0x80,0xa0,0xc0,0xe0],maxEnemies:5,spawnDelay:70,
     update(g,t){if(t%180===90)bombard(g,4);},win(g,t){return t>=7200;},winText:'THE NIGHT IS QUIET',
     hud(g,ctx,G,o){const s=g.story;if(s.phase!=='play'||s.brief)return;const left=Math.max(0,Math.ceil((7200-(g.frame-s.start))/60));G.drawText(ctx,Math.floor(left/60)+'.'+String(left%60).padStart(2,'0'),o.WHITE,184,4);}},
    {title:'HONORS - 27 IX',lines:['THE CITY IS TIRED.','ONE LAST COLUMN.','MAKE THEM REMEMBER.'],
     map(g){city(g,0.55);},queue(g){return mix(g,16,[0xa0,0xc0,0xe0]);},maxEnemies:5,spawnDelay:75,winText:'HONORS OF WAR'}
  ]});

function spawnAlly(g){return g.spawnTank({x:160,y:192,team:'players',ai:true,palette:BC.PLAYER_PALETTES[1],level:1,hp:3,shield:120,tags:{ally:true},score:0});}
function ally(g){return g.tanks.find(t=>t.tags.ally===true)||null;}
function boss(g){return g.tanks.find(t=>t.tags.boss===true)||null;}
campaign({id:'story-commander-k',name:'The Last Commander',tag:'MISSION',players:[1,2],
  desc:'Radio-drama campaign for 1-2 players. Seven missions, an AI wingman and a boss.',
  rules:['HOLD OUTPOST 7.','SEVEN MISSIONS.','READ THE RADIO.','VIPER FIGHTS WITH YOU','IN MISSIONS 4 AND 5.'],
  finalText:'THE LINE HELD',loseText:'OUTPOST 7 LOST',
  hud(g,ctx,G,o){
    const a=ally(g);if(a&&a.state==='alive')G.drawText(ctx,'VIPER',BC.PLAYER_PALETTES[1],o.OX+a.x-12,o.OY+a.y-9);
    const b=boss(g);if(b&&b.state==='alive'){G.drawText(ctx,'ARQUETTE',o.WHITE,Math.max(o.OX,Math.min(o.OX+144,o.OX+b.x-24)),Math.max(o.OY,o.OY+b.y-10));bar(ctx,o.OX+b.x,o.OY+b.y+17,16,2,b.hp/b.maxHp,'#f84040');}
  },
  missions:[
    {title:'OUTPOST 7',lines:['AIKO - COMMANDER K.','THIS IS OUTPOST 7.','ARMOR CROSSED THE DMZ.','YOU ARE THE LINE.'],
     map(g){g.loadStage(1);},queue(g){return mix(g,8,[0x80]);},maxEnemies:3,spawnDelay:120,radio:[{at:600,text:'AIKO - MORE ON RADAR'}],winText:'SECTOR CLEAR'},
    {title:'PROBING',lines:['AIKO - THEY TEST US.','LIGHT UNITS ONLY.','THEY KNOW OUR LAYOUT.','SOMEONE TOLD THEM.'],
     map(g){g.loadStage(3);},queue(g){return mix(g,10,[0x80,0xa0]);},maxEnemies:4,spawnDelay:100,radio:[{at:900,text:'INTERCEPT - GOOD K.'}],winText:'THEY PULL BACK'},
    {title:'REGROUP',lines:['AIKO - PUSH THEM BACK.','THEN THEY REGROUP.','K - THEY ALWAYS DO.'],
     map(g){g.loadStage(5);},queue(g){return mix(g,12,[0x80,0xa0,0xc0]);},maxEnemies:4,spawnDelay:90,winText:'THEY WILL REGROUP'},
    {title:'VIPER',lines:['VIPER - MISS ME K.','I KNOW THAT VOICE.','THE GENERAL TAUGHT ME.','HE TAUGHT YOU TOO.'],
     map(g){g.loadStage(8);},queue(g){return mix(g,12,[0xa0,0xc0]);},maxEnemies:4,spawnDelay:85,spawn:spawnAlly,radio:[{at:300,text:'VIPER - ON YOUR WING'}],winText:'VIPER - NOT BAD K'},
    {title:'ULTIMATUM',lines:['GENERAL - JOIN ME K.','THE CAPITAL IS ROTTEN.','K - NO.','VIPER - COVER ME.'],
     map(g){g.loadStage(12);},queue(g){return mix(g,14,[0xa0,0xc0,0xe0]);},maxEnemies:5,spawnDelay:80,spawn:spawnAlly,
     onWin(g){const a=ally(g);if(a)g.killTank(a,null,true);},winText:'VIPER IS DOWN'},
    {title:'THE REVEAL',lines:['AIKO - VOICE MATCH.','COLONEL ARQUETTE.','YOUR INSTRUCTOR K.','DECLARED DEAD IN 19XX.'],
     map(g){g.loadStage(20);},queue(g){return mix(g,16,[0xc0,0xe0]);},maxEnemies:5,spawnDelay:75,radio:[{at:1200,text:'ARQUETTE - HELLO K.'}],winText:'HE IS COMING'},
    {title:'CLASSROOM',lines:['ARQUETTE - CLASSROOM','IS OPEN K. COME IN.','AIKO - HOLD THE LINE.','FOR VIPER.'],
     map(g){g.loadStage(35);},queue(g){return mix(g,10,[0xc0,0xe0]);},maxEnemies:5,spawnDelay:80,
     spawn(g){g.spawnTank({x:96,y:0,cls:0xe0,team:'enemy',hp:12,speed:0.5,bulletSpeed:4,dir:BC.DOWN,tags:{boss:true},score:2000});},
     win(g){return g.rules.enemyQueue.length===0&&enemies(g).length===0;},winText:'CLASS DISMISSED'}
  ]});

const LW_WAVES=5,LZ=[0,96];
BC.registerMode({id:'story-lone-wolf',name:'Lone Wolf',group:'story',players:[1,1],noEagle:true,
  desc:'One tank, one life, no base. Survive 5 waves, then drive to the landing zone.',
  setup(g){
    g.rules.hud='party';g.rules.stageClear=false;g.rules.eagleGameOver=false;g.rules.playerRespawn=false;g.rules.maxEnemies=3;g.rules.spawnDelay=90;
    g.rules.enemyBonusEvery=[2,5,8,11,14,17,20,23,26,29,32];
    g.buildArena(0.4);
    for(const [mx,my] of [[5,12],[6,12],[7,12]])g.map.setMeta(mx,my,BC.EMPTY);
    g.playerSpawns=[[96,192]];g.players[0].lives=0;
    g.spawnPlayer(0,{hp:3});
    g.lw=Object.assign(briefState(),{wave:0,phase:'wave'});
    briefOpen(g.lw,g,'LONE WOLF',['ONE LIFE. NO BASE.','SURVIVE 5 WAVES.','THEN REACH THE LZ.','SHOVEL HEALS.','TANK ADDS ARMOR.']);
  },
  skipBrief(g){briefSkip(g.lw,g);},
  update(g,inputs){
    const w=g.lw;w.edge=edges(w,inputs,1);
    if(briefStep(w,g,inputs))return;
    if(w.phase==='lz'){
      if(g.rules.enemyQueue.length<2)g.rules.enemyQueue.push.apply(g.rules.enemyQueue,mix(g,3,[0xa0,0xc0,0xe0]));
      const t=g.players[0].tank;
      if(t&&t.state==='alive'&&BC.rectsOverlap(t.x,t.y,16,16,LZ[0],LZ[1],16,16))g.gameOver('EXTRACTED',{winner:0});
      g.timerText='LZ';return;}
    if(g.rules.enemyQueue.length===0&&enemies(g).length===0){
      if(w.wave>=LW_WAVES){w.phase='lz';for(const [mx,my] of [[0,6],[1,6],[0,5],[1,5]])g.map.setMeta(mx,my,BC.EMPTY);g.text('CHOPPER AT LZ - GO WEST',240);g.rules.maxEnemies=2;return;}
      w.wave++;const pool=[[0x80],[0x80,0xa0],[0xa0,0xc0],[0xa0,0xc0,0xe0],[0xc0,0xe0]][w.wave-1];
      g.rules.enemyQueue=mix(g,3+2*w.wave,pool);g.enemiesSpawned=0;g.spawnTimer=90;g.rules.maxEnemies=Math.min(5,2+w.wave);
      g.text('WAVE '+w.wave,120);}
    g.timerText='W'+w.wave;
  },
  onPowerup(g,t,kind){
    const name=BC.POWERUPS[kind];
    if(name==='shovel'){t.hp=Math.min(t.maxHp,t.hp+1);g.text('MEDKIT',60);g.players[0].score+=500;return false;}
    if(name==='tank'){t.hp+=2;t.maxHp+=2;g.text('ARMOR PLATE',60);g.players[0].score+=500;return false;}
  },
  isOver(g){if(g.frame>30&&g.players[0].tank===null)return {text:'KIA'};return null;},
  hud(g,ctx,G,o){
    const w=g.lw,t=g.players[0].tank;
    G.drawText(ctx,w.phase==='lz'?'REACH THE LZ':'WAVE '+w.wave+' OF '+LW_WAVES,o.WHITE,16,4);
    if(t){G.drawText(ctx,'HP',o.GREY,140,4);bar(ctx,160,6,48,4,t.hp/t.maxHp,'#f8b830');}
    if(w.phase==='lz'&&((g.frame>>3)&1)){ctx.strokeStyle='#f8f8f8';ctx.lineWidth=1;ctx.strokeRect(o.OX+LZ[0]+0.5,o.OY+LZ[1]+0.5,15,15);G.drawText(ctx,'LZ',o.WHITE,o.OX+LZ[0],o.OY+LZ[1]+4);}
    briefHud(w,g,ctx,G,o);
  }});

const TREK_NAMES={helmet:'SHIELDS UP',clock:'TIME WARP - 3 SEC',shovel:'FORCE FIELD',star:'PHOTON TORPEDOES',grenade:'RED ALERT',tank:'REPAIR CREW'};
function space(g,nebula){
  g.map.fill(BC.EMPTY);
  for(let i=0;i<9;i++){const mx=Math.floor(g.random()*13),my=2+Math.floor(g.random()*8);if(mx>=4&&mx<=8&&my>=10)continue;g.map.setMeta(mx,my,BC.STEEL);}
  if(nebula)for(let i=0;i<16;i++){const mx=Math.floor(g.random()*13),my=2+Math.floor(g.random()*8);if(g.map.get(mx*2,my*2)===BC.EMPTY)g.map.setMeta(mx,my,BC.TREES);}
}
function queen(g){return g.tanks.find(t=>t.tags.queen===true)||null;}
campaign({id:'story-trek',name:'Star Trek - The Last Starbase',tag:'STARDATE',players:[1,2],hudStyle:'party',ring:BC.STEEL,
  desc:'Space campaign for 1-2 players: Klingons, the Borg, Voyager, Q and the Queen.',
  rules:['HOLD FIRE - PHASERS.','SHIELDS REGENERATE.','GUARD THE STARBASE.','FIVE STARDATES.','TIME WARP LASTS 3 SEC'],
  finalText:'LIVE LONG AND PROSPER',loseText:'STARBASE LOST',
  init(g){
    g.rules.autoFire=true;g.rules.bulletVsBullet=false;
    g.story.stars=[];for(let i=0;i<28;i++)g.story.stars.push([Math.floor(g.random()*208),Math.floor(g.random()*208)]);
    for(const p of g.players)p.lives=2;
  },
  onSpawn(g,t){if(t.player!==null){t.hp=3;t.maxHp=3;}},
  frame(g){
    if(g.freezeTimer>WARP_CAP)g.freezeTimer=WARP_CAP;
    if(g.frame%600===599)for(const p of g.players){const t=p.tank;if(t&&t.state==='alive'&&t.hp<t.maxHp){t.hp++;g.text('SHIELDS RESTORED',60);}}
    g.timerText='SD'+g.story.n;
  },
  onPowerup(g,t,kind){g.text(TREK_NAMES[BC.POWERUPS[kind]],60);},
  hud(g,ctx,G,o){
    const s=g.story;
    ctx.fillStyle='#f8f8f8';for(const [x,y] of s.stars)if(g.map.get(x>>3,y>>3)===BC.EMPTY)ctx.fillRect(o.OX+x,o.OY+y,1,1);
    for(const e of g.eagles)if(e.alive)ctx.drawImage(bitmap('starbase',STARBASE,STARBASE_C),o.OX+e.x,o.OY+e.y);
    for(const t of g.tanks){if(t.state!=='alive')continue;
      if(t.team==='enemy')ctx.drawImage(dirBitmap(t.tags.queen?'queen':'bird',BIRD,t.tags.queen?{g:[200,80,220],d:[100,30,120],'.':[0,0,0]}:BIRD_C,t.dir),o.OX+t.x,o.OY+t.y);
      else if(t.player!==null){const pal=G.PAL[t.palette[3]&63];ctx.drawImage(dirBitmap('saucer'+t.player,SAUCER,{l:pal,b:SAUCER_C.b,r:SAUCER_C.r,'.':SAUCER_C['.']},t.dir),o.OX+t.x,o.OY+t.y);}}
    for(const p of g.players){const t=p.tank;const x=228,y=24+p.slot*24;if(t)bar(ctx,x,y+17,24,3,t.hp/t.maxHp,'#40a0f8');}
    const q=queen(g);if(q&&q.state==='alive'){G.drawText(ctx,'BORG QUEEN',o.WHITE,Math.max(o.OX,Math.min(o.OX+128,o.OX+q.x-32)),Math.max(o.OY,o.OY+q.y-10));bar(ctx,o.OX+q.x,o.OY+q.y+17,16,2,q.hp/q.maxHp,'#d050e0');}
  },
  missions:[
    {title:'FIRST CONTACT',lines:['PICARD - RED ALERT.','KLINGON RAIDERS','ON AN ATTACK VECTOR.','PROTECT THE STARBASE.'],
     map(g){space(g,false);},queue(g){return mix(g,8,[0x80,0xa0]);},maxEnemies:3,spawnDelay:100,radio:[{at:600,text:'WORF - TARGET LOCKED'}],winText:'MAKE IT SO'},
    {title:'THE BORG',lines:['WE ARE THE BORG.','RESISTANCE IS FUTILE.','DATA - THEY ADAPT.','SHOOT FIRST.'],
     map(g){space(g,false);},queue(g){return mix(g,10,[0xe0,0xe0,0xc0]);},maxEnemies:4,spawnDelay:90,radio:[{at:900,text:'ASSIMILATE THEM FIRST'}],winText:'BORG REPELLED'},
    {title:'DELTA QUADRANT',lines:['JANEWAY - VOYAGER HERE','70000 LIGHT YEARS OUT.','THE NEBULA HIDES SHIPS','HOLD 2 MINUTES.'],
     map(g){space(g,true);},queue(g){return mix(g,6,[0xa0,0xc0]);},endless:[0x80,0xa0,0xc0,0xe0],maxEnemies:5,spawnDelay:75,
     win(g,t){return t>=7200;},radio:[{at:1800,text:'JANEWAY - COFFEE.'},{at:1900,text:'BLACK.'}],winText:'HOME IS THAT WAY',
     hud(g,ctx,G,o){const s=g.story;if(s.phase!=='play'||s.brief)return;const left=Math.max(0,Math.ceil((7200-(g.frame-s.start))/60));G.drawText(ctx,Math.floor(left/60)+'.'+String(left%60).padStart(2,'0'),o.WHITE,184,4);}},
    {title:'Q',lines:['Q - LET US PLAY.','EVERY SHIP CARRIES','A GIFT. OR A TRAP.','TIME WARP IS SHORT.'],
     map(g){space(g,false);},queue(g){return mix(g,12,[0x80,0xa0,0xc0,0xe0]);},bonusEvery:[1,2,3,4,5,6,7,8,9,10,11,12],maxEnemies:5,spawnDelay:70,winText:'Q - HOW DULL.'},
    {title:'WOLF 359',lines:['LOCUTUS - SURRENDER.','SISKO - NOT TODAY.','THE QUEEN IS HERE.','ENGAGE.'],
     map(g){space(g,false);},queue(g){return mix(g,12,[0xe0,0xc0]);},maxEnemies:5,spawnDelay:70,
     spawn(g){g.spawnTank({x:96,y:0,cls:0xe0,team:'enemy',hp:16,speed:0.5,bulletSpeed:4,dir:BC.DOWN,tags:{queen:true},score:3000});},
     win(g){return g.rules.enemyQueue.length===0&&enemies(g).length===0;},winText:'ENGAGE'}
  ]});
})();
