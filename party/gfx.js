(function(root){
'use strict';
const A=root.BC_ASSETS,PAL=root.NES_PALETTE;
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64decode(s){
  const rev=new Int16Array(256);
  for(let i=0;i<256;i++)rev[i]=-1;
  for(let i=0;i<B64.length;i++)rev[B64.charCodeAt(i)]=i;
  let len=s.length;
  while(len>0&&s.charAt(len-1)==='=')len--;
  const out=new Uint8Array(Math.floor(len*3/4));
  let acc=0,bits=0,o=0;
  for(let i=0;i<len;i++){
    const v=rev[s.charCodeAt(i)];
    if(v<0)throw Error('gfx: bad base64 char at '+i);
    acc=(acc<<6)|v;bits+=6;
    if(bits>=8){bits-=8;out[o++]=(acc>>bits)&255;}
  }
  if(o!==out.length)throw Error('gfx: base64 produced '+o+' bytes, expected '+out.length);
  return out;
}
const chr=b64decode(A.chr);
if(chr.length!==8192)throw Error('CHR length '+chr.length);
const cache=new Map();
function tilePixels(bank,idx){const off=bank*4096+idx*16,px=new Uint8Array(64);for(let y=0;y<8;y++){const lo=chr[off+y],hi=chr[off+y+8];for(let x=0;x<8;x++){const b=7-x;px[y*8+x]=((lo>>b)&1)|(((hi>>b)&1)<<1);}}return px;}
function tileBitmap(bank,idx,palette,flipX,flipY){
  const key=bank+':'+idx+':'+palette.join(',')+':'+(flipX?1:0)+(flipY?1:0);
  let b=cache.get(key);
  if(b)return b;
  const data=new Uint8ClampedArray(256),px=tilePixels(bank,idx);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    const v=px[y*8+x];
    if(v===0)continue;
    const sx=flipX?7-x:x,sy=flipY?7-y:y,rgb=PAL[palette[v]&63],o=(sy*8+sx)*4;
    data[o]=rgb[0];data[o+1]=rgb[1];data[o+2]=rgb[2];data[o+3]=255;
  }
  b={width:8,height:8,data};
  cache.set(key,b);
  return b;
}
function drawTile(ctx,bank,idx,palette,x,y,flipX,flipY){ctx.drawImage(tileBitmap(bank,idx,palette,flipX,flipY),x|0,y|0);}
function drawSprite8x16(ctx,idx,palette,x,y){const bank=idx&1,base=idx&~1;drawTile(ctx,bank,base,palette,x,y);drawTile(ctx,bank,base+1,palette,x,y+8);}
function drawSprite16(ctx,idx,palette,x,y){drawSprite8x16(ctx,idx,palette,x,y);drawSprite8x16(ctx,idx+2,palette,x+8,y);}
function drawBgMeta(ctx,tiles,palette,x,y){drawTile(ctx,1,tiles[0],palette,x,y);drawTile(ctx,1,tiles[1],palette,x+8,y);drawTile(ctx,1,tiles[2],palette,x,y+8);drawTile(ctx,1,tiles[3],palette,x+8,y+8);}
const GLYPHS={};for(let i=0;i<10;i++)GLYPHS[String(i)]=0x30+i;for(let i=0;i<26;i++)GLYPHS[String.fromCharCode(65+i)]=0x41+i;GLYPHS[' ']=null;
GLYPHS['-']=0x6b;GLYPHS['.']=0x69;
delete GLYPHS.X;delete GLYPHS.Z;
const SYNTH={
  X:['##....##','##....##','.##..##.','..####..','.##..##.','##....##','##....##','........'],
  Z:['########','......##','.....##.','...##...','..##....','##......','########','........']
};
function synthBitmap(ch,palette){
  const key='s:'+ch+':'+palette.join(',');
  let b=cache.get(key);
  if(b)return b;
  const rows=SYNTH[ch],data=new Uint8ClampedArray(256),rgb=PAL[palette[3]&63];
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    if(rows[y].charAt(x)!=='#')continue;
    const o=(y*8+x)*4;
    data[o]=rgb[0];data[o+1]=rgb[1];data[o+2]=rgb[2];data[o+3]=255;
  }
  b={width:8,height:8,data};
  cache.set(key,b);
  return b;
}
function drawText(ctx,text,palette,x,y){text=String(text).toUpperCase();for(let i=0;i<text.length;i++){const c=text[i],g=GLYPHS[c];if(g===undefined){if(!SYNTH[c])throw Error('no glyph for '+JSON.stringify(c));ctx.drawImage(synthBitmap(c,palette),(x+i*8)|0,y|0);continue;}if(g!==null)drawTile(ctx,1,g,palette,x+i*8,y);}}
root.BC_GFX={tilePixels,tileBitmap,drawTile,drawSprite16,drawSprite8x16,drawBgMeta,drawText,PAL,GLYPHS,SYNTH};
if(typeof module!=='undefined')module.exports=root.BC_GFX;
})(typeof window!=='undefined'?window:globalThis);
