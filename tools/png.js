const zlib=require('zlib');
const CRC=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c;}return t;})();
function crc32(buf){let c=0xffffffff;for(let i=0;i<buf.length;i++)c=CRC[(c^buf[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function png(w,h,rgba){
  if(rgba.length!==w*h*4)throw Error('png: got '+rgba.length+' bytes, expected '+(w*h*4));
  const stride=w*4,raw=Buffer.alloc((stride+1)*h);
  for(let y=0;y<h;y++){raw[y*(stride+1)]=0;for(let x=0;x<stride;x++)raw[y*(stride+1)+1+x]=rgba[y*stride+x];}
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  const chunk=(type,data)=>{const head=Buffer.alloc(8);head.writeUInt32BE(data.length,0);head.write(type,4);
    const tail=Buffer.alloc(4);tail.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type),data])),0);
    return Buffer.concat([head,data,tail]);};
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),
    chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
module.exports=png;
module.exports.crc32=crc32;
