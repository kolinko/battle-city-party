global.window=global;
const path=require('path'),P=path.join(__dirname,'..','party');
require('./rom-node.js');require(P+'/engine.js');
const fs=require('fs');
const manifest=fs.readFileSync(P+'/modes/manifest.js','utf8');eval(manifest);
for(const entry of window.BC_MANIFEST){const f=P+'/modes/'+entry.file;if(fs.existsSync(f))require(f);else console.log('missing mode file',entry.file);}
const BC=window.BC;
function blank(){return {up:false,down:false,left:false,right:false,fire:false,start:false,select:false};}
function botInputs(g,f){return g.players.map((p,i)=>{const s=blank();const d=['up','left','down','right'][(Math.floor(f/50)+i)%4];s[d]=(f%80)<60;s.fire=(f%9)===0;return s;});}
const want=process.argv[2]||null,frames=Number(process.argv[3]||3600);
let failed=0;
for(const m of BC.modes){if(want&&m.id!==want)continue;
  const n=m.players[1];
  const g=new BC.Game(m,{playerCount:n,seed:777});
  const t0=Date.now();let err=null;
  try{for(let f=0;f<frames&&g.state==='playing';f++)g.step(botInputs(g,f));}catch(e){err=e;}
  const enemies=g.tanks.filter(t=>t.team==='enemy').length;
  const brick=g.map.cell.filter(c=>c===BC.BRICK).length;
  console.log(JSON.stringify({mode:m.id,players:n,frames:g.frame,state:g.state,result:g.result&&g.result.text,tanks:g.tanks.length,enemies,bullets:g.bullets.length,brick,kills:g.players.map(p=>p.kills),deaths:g.players.map(p=>p.deaths),lives:g.players.map(p=>p.lives),ms:Date.now()-t0,error:err?String(err.stack):null}));
  if(err)failed++;
}
if(failed){console.log('FAILED',failed);process.exit(1);}
