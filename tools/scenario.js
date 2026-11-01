const path=require('path'),fs=require('fs');
global.window=global;
const P=path.join(__dirname,'..','party');
require('./rom-node.js');
for(const f of ['nes-palette.js','gfx.js','raster.js','engine.js','render.js'])require(P+'/'+f);
const manifest=fs.readFileSync(P+'/modes/manifest.js','utf8');eval(manifest);
for(const entry of window.BC_MANIFEST){const f=P+'/modes/'+entry.file;if(!fs.existsSync(f))throw Error('scenario: missing mode file '+entry.file);require(f);}
const BC=window.BC,RENDER=window.BC_RENDER,RASTER=window.BC_RASTER;
const png=require('./png.js');
const W=256,H=240;
const BUTTONS=['up','down','left','right','fire','start','select','menu'];
const CELL_NAME={0:'empty',1:'brick',2:'steel',3:'water',4:'trees',5:'ice',6:'eagle'};
const CELL_CHAR={0:'.',1:'b',2:'S',3:'~',4:'T',5:'i',6:'E'};

function blank(){const o={};for(const b of BUTTONS)o[b]=false;return o;}
function pad(spec){const o=blank();if(spec)for(const k of Object.keys(spec)){if(BUTTONS.indexOf(k)<0)throw Error('scenario: unknown button '+k);o[k]=spec[k]===true;}return o;}
function slots(inputs,n){const out=[];for(let i=0;i<n;i++)out.push(pad(inputs?inputs[i]:null));return out;}

const helpers={
  BC,CELL_NAME,
  mode(id){const m=BC.modes.find(x=>x.id===id);if(!m)throw Error('scenario: no mode '+id);return m;},
  cell(g,cx,cy){return g.map.get(cx,cy);},
  cellName(k){const n=CELL_NAME[k];if(n===undefined)throw Error('scenario: unknown cell kind '+k);return n;},
  eagle(g,i){const e=g.eagles[i===undefined?0:i];if(!e)throw Error('scenario: no eagle '+(i===undefined?0:i));return e;},
  ringCells(e){const cx0=e.x/8,cy0=e.y/8,out=[];
    for(let cy=cy0-1;cy<=cy0+2;cy++)for(let cx=cx0-1;cx<=cx0+2;cx++){
      if(cx>=cx0&&cx<cx0+2&&cy>=cy0&&cy<cy0+2)continue;
      if(cx<0||cy<0||cx>=BC.GRID||cy>=BC.GRID)continue;
      out.push([cx,cy]);}
    return out;},
  wallCells(e){return helpers.ringCells(e);},
  materials(g,cells){const counts={};const list=[];
    for(const [cx,cy] of cells){const k=g.map.get(cx,cy),n=helpers.cellName(k);counts[n]=(counts[n]||0)+1;list.push({cx,cy,kind:n});}
    return {counts,list,total:cells.length};},
  eagleRing(g,e){return helpers.materials(g,helpers.ringCells(e||helpers.eagle(g)));},
  eagleWall(g,e){return helpers.materials(g,helpers.wallCells(e||helpers.eagle(g)));},
  allOf(m,kind){return m.total>0&&m.counts[kind]===m.total;},
  tankAt(g,x,y){return g.tanks.filter(t=>x>=t.x&&x<t.x+16&&y>=t.y&&y<t.y+16);},
  tankOn(g,cx,cy){return g.tanks.filter(t=>BC.rectsOverlap(t.x,t.y,16,16,cx*8,cy*8,8,8));},
  enemies(g){return g.tanks.filter(t=>t.player===null&&t.team==='enemy');},
  playerTank(g,slot){return g.players[slot===undefined?0:slot].tank;},
  enemiesOverlapping(g){const e=helpers.enemies(g),out=[];
    for(let i=0;i<e.length;i++)for(let j=i+1;j<e.length;j++)
      if(BC.rectsOverlap(e[i].x,e[i].y,16,16,e[j].x,e[j].y,16,16))
        out.push({a:e[i].id,b:e[j].id,ax:e[i].x,ay:e[i].y,bx:e[j].x,by:e[j].y,aState:e[i].state,bState:e[j].state});
    return out;},
  powerupActive(g,kind){
    if(kind==='shovel')return g.shovelTimer;
    if(kind==='clock')return g.freezeTimer;
    if(kind==='helmet'){const t=helpers.playerTank(g);return t?t.shield:0;}
    if(kind==='star'){const t=helpers.playerTank(g);return t?t.level:0;}
    if(kind==='tank')return g.players[0].lives;
    throw Error('scenario: powerupActive does not track '+kind);},
  lane(x,y){const i=BC.ENEMY_SPAWNS.findIndex(s=>s[0]===x&&s[1]===y);return i<0?null:i;},
  spawnPointsUsed(T){return T.spawns.filter(s=>s.team==='enemy'&&s.player===null).map(s=>s.lane);},
  give(g,tank,patch){for(const k of Object.keys(patch))tank[k]=patch[k];return tank;},
  clearArea(g,cx,cy,w,h){for(let y=cy;y<cy+h;y++)for(let x=cx;x<cx+w;x++)g.map.set(x,y,BC.EMPTY);},
  mapRows(g){const out=[];
    for(let cy=0;cy<BC.GRID;cy++){let s='';for(let cx=0;cx<BC.GRID;cx++)s+=CELL_CHAR[g.map.cell[cy*BC.GRID+cx]];out.push(s);}
    return out;}
};

function newTrace(){return {frames:0,spawns:[],deaths:[],overlaps:[],wall:[],shovel:[],stages:[]};}

function observe(g,T,seen){
  T.frames=g.frame;
  for(const t of g.tanks)if(!seen.has(t.id)){seen.set(t.id,t);
    T.spawns.push({frame:g.frame,id:t.id,team:t.team,cls:t.cls,player:t.player,x:t.x,y:t.y,bonus:t.bonus===true,lane:helpers.lane(t.x,t.y),spawned:g.enemiesSpawned});}
  for(const [id,t] of seen)if(!g.tanks.includes(t)){seen.delete(id);T.deaths.push({frame:g.frame,id,team:t.team,player:t.player,x:t.x,y:t.y});}
  const ov=helpers.enemiesOverlapping(g);
  if(ov.length)T.overlaps.push({frame:g.frame,pairs:ov});
  if(g.eagles.length&&g.eagles[0].alive){
    const w=helpers.eagleWall(g,g.eagles[0]),sig=JSON.stringify(w.counts);
    if(!T.wall.length||T.wall[T.wall.length-1].sig!==sig)T.wall.push({frame:g.frame,sig,counts:w.counts});
  }
  const on=g.shovelTimer>0;
  if(!T.shovel.length||T.shovel[T.shovel.length-1].on!==on)T.shovel.push({frame:g.frame,on,timer:g.shovelTimer});
  if(!T.stages.length||T.stages[T.stages.length-1].stage!==g.stage)T.stages.push({frame:g.frame,stage:g.stage});
}

function run(sc,opts){
  const mode=helpers.mode(sc.mode);
  const players=sc.players===undefined?1:sc.players;
  const seed=sc.seed===undefined?777:sc.seed;
  const g=new BC.Game(mode,{playerCount:players,seed,stage:sc.stage===undefined?1:sc.stage});
  const T=newTrace(),seen=new Map();
  observe(g,T,seen);
  if(sc.setup)sc.setup(g,helpers,T);
  const results=[];
  const check=(list,where)=>{
    for(const a of list){
      const r=a.check(g,helpers,T);
      const ok=r===true||(r&&r.ok===true);
      const row={desc:a.desc,where,ok};
      if(r&&typeof r==='object')for(const k of Object.keys(r))if(k!=='ok')row[k]=r[k];
      results.push(row);
    }
  };
  for(let si=0;si<(sc.steps||[]).length;si++){
    const st=sc.steps[si];
    if(st.action)st.action(g,helpers,T);
    const n=st.frames===undefined?0:st.frames;
    for(let f=0;f<n;f++){
      const inp=typeof st.inputs==='function'?st.inputs(g.frame,g,helpers):st.inputs;
      g.step(slots(inp,g.players.length));observe(g,T,seen);
    }
    if(st.assert)check(st.assert,'step'+si);
  }
  if(sc.assert)check(sc.assert,'end');
  const measure=sc.measure?sc.measure(g,helpers,T):null;
  return {g,T,results,measure,seed,players};
}

function artifacts(sc,out,tag,r){
  fs.mkdirSync(out,{recursive:true});
  const stem=path.join(out,(tag?tag+'-':'')+sc.name);
  const ctx=RASTER.create(W,H);
  RENDER.render(ctx,r.g);
  fs.writeFileSync(stem+'.png',png(W,H,ctx.data));
  const dump={scenario:sc.name,mode:sc.mode,players:r.players,seed:r.seed,frame:r.g.frame,state:r.g.state,
    result:r.g.result,rules:r.g.rules,shovelTimer:r.g.shovelTimer,shovelTeam:r.g.shovelTeam,freezeTimer:r.g.freezeTimer,
    enemiesSpawned:r.g.enemiesSpawned,spawnTimer:r.g.spawnTimer,
    eagles:r.g.eagles,tanks:r.g.tanks,powerups:r.g.powerups,players:r.g.players.map(p=>({slot:p.slot,team:p.team,lives:p.lives,level:p.level,score:p.score,alive:p.alive,hasTank:p.tank!==null})),
    map:helpers.mapRows(r.g),legend:CELL_CHAR,asserts:r.results,measure:r.measure,trace:r.T};
  fs.writeFileSync(stem+'.json',JSON.stringify(dump,null,1)+'\n');
  return [stem+'.png',stem+'.json'];
}

const args={},filters=[];
for(const a of process.argv.slice(2)){
  const m=/^--([a-z-]+)(?:=(.*))?$/.exec(a);
  if(m)args[m[1]]=m[2]===undefined?'1':m[2];
  else filters.push(a);
}
const DIR=path.join(__dirname,'scenarios');
const names=fs.readdirSync(DIR).filter(f=>f.endsWith('.js')).sort();
const all=[];
for(const f of names){
  const mod=require(path.join(DIR,f));
  for(const sc of (Array.isArray(mod)?mod:[mod])){
    if(!sc.name||!sc.mode)throw Error('scenario: '+f+' exports an entry without name/mode');
    all.push(sc);
  }
}
if(args.list){for(const sc of all)console.log(sc.name+'\t'+sc.mode+'\t'+(sc.players||1)+'p');process.exit(0);}
const chosen=all.filter(sc=>!filters.length||filters.some(f=>sc.name.indexOf(f)>=0));
if(!chosen.length)throw Error('scenario: no scenario matches '+JSON.stringify(filters)+'; --list shows '+all.length);
const OUT=args.out||path.join(__dirname,'..','scenario-out');
const TAG=args.tag||'';
let failed=0;
for(const sc of chosen){
  const t0=Date.now();
  const r=run(sc,args);
  const bad=r.results.filter(x=>!x.ok);
  const files=(bad.length||args.png)?artifacts(sc,OUT,TAG,r):[];
  console.log(JSON.stringify({scenario:sc.name,mode:sc.mode,players:r.players,seed:r.seed,frames:r.g.frame,
    state:r.g.state,pass:bad.length===0,asserts:r.results,measure:r.measure,artifacts:files,ms:Date.now()-t0}));
  if(bad.length)failed++;
}
console.log(JSON.stringify({scenarios:chosen.length,passed:chosen.length-failed,failed,out:OUT}));
if(failed)process.exitCode=1;
