(function(root){
'use strict';
const ROM_SIZE=24592,PRG_OFF=16,PRG_LEN=16384,CHR_OFF=16400,CHR_LEN=8192;
const STAGE_BASE=0xF07A,STAGE_LEN=0x5B,STAGES=35,META_ATTR=0xDABB,META_TILES=0xDACB,COUNTS=0xE578,SCRIPT=0xE4EC,SPRITE_PAL=0xD555,BG_PAL=0xD575,AIM=0xE486,POWERUP_KINDS=0xE8FA,ENEMY_SCORE=0xE8BA;
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64encode(u8){
  let s='';
  for(let i=0;i<u8.length;i+=3){
    const n=i+2<u8.length?3:u8.length-i,v=(u8[i]<<16)|((n>1?u8[i+1]:0)<<8)|(n>2?u8[i+2]:0);
    s+=B64[(v>>18)&63]+B64[(v>>12)&63]+(n>1?B64[(v>>6)&63]:'=')+(n>2?B64[v&63]:'=');
  }
  return s;
}
function extract(rom){
  if(rom.length!==ROM_SIZE)throw Error('rom-assets: ROM is '+rom.length+' bytes, expected '+ROM_SIZE);
  const prg=rom.subarray(PRG_OFF,PRG_OFF+PRG_LEN),chr=rom.subarray(CHR_OFF,CHR_OFF+CHR_LEN);
  const cpu=(addr,n)=>Array.from(prg.subarray(addr-0xC000,addr-0xC000+n));
  const stages=[];
  for(let n=0;n<STAGES;n++){
    const raw=cpu(STAGE_BASE+n*STAGE_LEN,STAGE_LEN),grid=[];
    for(let row=0;row<13;row++){const cells=[];for(const b of raw.slice(row*7,row*7+7))cells.push(b>>4,b&15);grid.push(cells.slice(0,13));}
    stages.push(grid);
  }
  const metaTiles=[],counts=[],script=[],spritePalettes=[],rosters=[];
  for(let i=0;i<16;i++)metaTiles.push(cpu(META_TILES+i*4,4));
  for(let i=0;i<STAGES;i++){counts.push(cpu(COUNTS+i*4,4));script.push(cpu(SCRIPT+i*4,4));}
  for(let i=0;i<STAGES;i++){
    const order=[];
    for(let k=0;k<4;k++)for(let j=0;j<counts[i][k];j++)order.push(script[i][k]);
    if(order.length!==20)throw Error('rom-assets: stage '+(i+1)+' roster has '+order.length+' enemies, expected 20');
    rosters.push(order);
  }
  const bgPalettes=[];
  for(let i=0;i<4;i++){spritePalettes.push(cpu(SPRITE_PAL+i*4,4));bgPalettes.push(cpu(BG_PAL+i*4,4));}
  return {chr:b64encode(chr),stages,metaAttr:cpu(META_ATTR,16),metaTiles,rosters,spritePalettes,bgPalettes,aimNormal:cpu(AIM,9).map(b=>b&3),aimAlt:cpu(AIM+9,9).map(b=>b&3),powerupKinds:cpu(POWERUP_KINDS,8),enemyScore:cpu(ENEMY_SCORE,4)};
}
root.BC_ROM_ASSETS={extract,b64encode};
if(typeof module!=='undefined')module.exports=root.BC_ROM_ASSETS;
})(typeof window!=='undefined'?window:globalThis);
