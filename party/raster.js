(function(root){
'use strict';
const COLORS=new Map();
function parse(s){
  let c=COLORS.get(s);
  if(c)return c;
  if(typeof s!=='string')throw Error('raster: color must be a string, got '+typeof s);
  let r,g,b,a=1;
  if(s.charCodeAt(0)===35){
    if(s.length===4){r=parseInt(s[1]+s[1],16);g=parseInt(s[2]+s[2],16);b=parseInt(s[3]+s[3],16);}
    else if(s.length===7){r=parseInt(s.slice(1,3),16);g=parseInt(s.slice(3,5),16);b=parseInt(s.slice(5,7),16);}
    else throw Error('raster: bad hex color '+s);
  }else{
    const m=/^rgba?\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*(?:,\s*([-0-9.]+)\s*)?\)$/.exec(s);
    if(!m)throw Error('raster: unsupported color '+s);
    r=parseFloat(m[1]);g=parseFloat(m[2]);b=parseFloat(m[3]);if(m[4]!==undefined)a=parseFloat(m[4]);
  }
  if(!(r>=0)||!(g>=0)||!(b>=0)||!(a>=0))throw Error('raster: bad color components '+s);
  c=[r,g,b,a];COLORS.set(s,c);return c;
}
function Ctx(w,h){
  this.width=w;this.height=h;
  this.data=new Uint8ClampedArray(w*h*4);
  this.imageSmoothingEnabled=false;
  this.lineWidth=1;
  this.globalAlpha=1;
  this._fillStr='#000000';this._fill=parse('#000000');
  this._strokeStr='#000000';this._stroke=parse('#000000');
  this._clip=null;
  this._subs=[];this._cur=null;
  this._stack=[];
}
Object.defineProperty(Ctx.prototype,'fillStyle',{get:function(){return this._fillStr;},set:function(v){this._fillStr=v;this._fill=parse(v);}});
Object.defineProperty(Ctx.prototype,'strokeStyle',{get:function(){return this._strokeStr;},set:function(v){this._strokeStr=v;this._stroke=parse(v);}});
Ctx.prototype.save=function(){this._stack.push({f:this._fillStr,s:this._strokeStr,lw:this.lineWidth,ga:this.globalAlpha,clip:this._clip});};
Ctx.prototype.restore=function(){
  const st=this._stack.pop();
  if(!st)throw Error('raster: restore without save');
  this.fillStyle=st.f;this.strokeStyle=st.s;this.lineWidth=st.lw;this.globalAlpha=st.ga;this._clip=st.clip;
};
Ctx.prototype.beginPath=function(){this._subs=[];this._cur=null;};
Ctx.prototype.moveTo=function(x,y){this._cur={pts:[x,y],closed:false};this._subs.push(this._cur);};
Ctx.prototype.lineTo=function(x,y){if(!this._cur){this.moveTo(x,y);return;}this._cur.pts.push(x,y);};
Ctx.prototype.closePath=function(){if(this._cur)this._cur.closed=true;};
Ctx.prototype.rect=function(x,y,w,h){this._cur={pts:[x,y,x+w,y,x+w,y+h,x,y+h],closed:true};this._subs.push(this._cur);};
Ctx.prototype.arc=function(cx,cy,r,a0,a1,ccw){
  let sweep=a1-a0;
  if(ccw){if(sweep>0)sweep-=Math.PI*2;}else if(sweep<0)sweep+=Math.PI*2;
  const n=Math.max(8,Math.ceil(Math.abs(sweep)*r/2));
  if(!this._cur){this._cur={pts:[],closed:false};this._subs.push(this._cur);}
  const p=this._cur.pts;
  for(let i=0;i<=n;i++){const a=a0+sweep*(i/n);p.push(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
};
Ctx.prototype._blend=function(x,y,c,a){
  if(x<0||y<0||x>=this.width||y>=this.height)return;
  const i=y*this.width+x;
  if(this._clip&&!this._clip[i])return;
  const d=this.data,o=i*4;
  if(a>=1){d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;return;}
  if(a<=0)return;
  const ia=1-a;
  d[o]=c[0]*a+d[o]*ia;d[o+1]=c[1]*a+d[o+1]*ia;d[o+2]=c[2]*a+d[o+2]*ia;d[o+3]=255*a+d[o+3]*ia;
};
Ctx.prototype._span=function(y,xa,xb,c,a){
  let x0=Math.ceil(xa-0.5),x1=Math.ceil(xb-0.5)-1;
  if(x0<0)x0=0;
  if(x1>=this.width)x1=this.width-1;
  if(a>=1&&!this._clip){
    const d=this.data,r=c[0],g=c[1],b=c[2];
    let o=(y*this.width+x0)*4;
    for(let x=x0;x<=x1;x++){d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=255;o+=4;}
    return;
  }
  for(let x=x0;x<=x1;x++)this._blend(x,y,c,a);
};
Ctx.prototype._maskSpan=function(mask,y,xa,xb){
  let x0=Math.ceil(xa-0.5),x1=Math.ceil(xb-0.5)-1;
  if(x0<0)x0=0;
  if(x1>=this.width)x1=this.width-1;
  const row=y*this.width;
  for(let x=x0;x<=x1;x++)mask[row+x]=1;
};
Ctx.prototype._scan=function(rule,onSpan){
  const edges=[];
  let minY=Infinity,maxY=-Infinity;
  for(const sp of this._subs){
    const p=sp.pts,n=p.length/2;
    if(n<2)continue;
    for(let i=0;i<n;i++){
      const j=(i+1)%n;
      const y0=p[i*2+1],y1=p[j*2+1];
      if(y0<minY)minY=y0;
      if(y0>maxY)maxY=y0;
      if(y0===y1)continue;
      edges.push(p[i*2],y0,p[j*2],y1);
    }
  }
  if(!edges.length)return;
  let ya=Math.floor(minY),yb=Math.ceil(maxY);
  if(ya<0)ya=0;
  if(yb>this.height-1)yb=this.height-1;
  const xs=[],dirs=[];
  for(let y=ya;y<=yb;y++){
    const yc=y+0.5;
    xs.length=0;dirs.length=0;
    for(let k=0;k<edges.length;k+=4){
      const x0=edges[k],y0=edges[k+1],x1=edges[k+2],y1=edges[k+3];
      if(y0<y1?(yc<y0||yc>=y1):(yc<y1||yc>=y0))continue;
      xs.push(x0+(yc-y0)/(y1-y0)*(x1-x0));dirs.push(y1>y0?1:-1);
    }
    if(xs.length<2)continue;
    const idx=[];
    for(let k=0;k<xs.length;k++)idx.push(k);
    idx.sort(function(a,b){return xs[a]-xs[b];});
    if(rule==='evenodd'){
      for(let k=0;k+1<idx.length;k+=2)onSpan(y,xs[idx[k]],xs[idx[k+1]]);
    }else{
      let w=0,start=0;
      for(let k=0;k<idx.length;k++){
        const prev=w;w+=dirs[idx[k]];
        if(prev===0&&w!==0)start=xs[idx[k]];
        else if(prev!==0&&w===0)onSpan(y,start,xs[idx[k]]);
      }
    }
  }
};
Ctx.prototype.fill=function(rule){
  const c=this._fill,a=this._fill[3]*this.globalAlpha,self=this;
  this._scan(rule==='evenodd'?'evenodd':'nonzero',function(y,xa,xb){self._span(y,xa,xb,c,a);});
};
Ctx.prototype.clip=function(rule){
  const mask=new Uint8Array(this.width*this.height),self=this;
  this._scan(rule==='evenodd'?'evenodd':'nonzero',function(y,xa,xb){self._maskSpan(mask,y,xa,xb);});
  const old=this._clip;
  if(old)for(let i=0;i<mask.length;i++)if(!old[i])mask[i]=0;
  this._clip=mask;
};
Ctx.prototype.fillRect=function(x,y,w,h){
  const c=this._fill,a=this._fill[3]*this.globalAlpha;
  let x0=Math.round(x),y0=Math.round(y),x1=Math.round(x+w),y1=Math.round(y+h);
  if(x1<x0){const t=x0;x0=x1;x1=t;}
  if(y1<y0){const t=y0;y0=y1;y1=t;}
  if(x0<0)x0=0;
  if(y0<0)y0=0;
  if(x1>this.width)x1=this.width;
  if(y1>this.height)y1=this.height;
  if(a>=1&&!this._clip){
    const d=this.data,r=c[0],g=c[1],b=c[2],w=this.width;
    for(let py=y0;py<y1;py++){
      let o=(py*w+x0)*4;
      for(let px=x0;px<x1;px++){d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=255;o+=4;}
    }
    return;
  }
  for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++)this._blend(px,py,c,a);
};
Ctx.prototype._strokeRectPx=function(x,y,w,h){
  const c=this._stroke,a=this._stroke[3]*this.globalAlpha,lw=Math.max(1,Math.round(this.lineWidth));
  const ox0=Math.round(x-lw/2),oy0=Math.round(y-lw/2),ox1=Math.round(x+w+lw/2),oy1=Math.round(y+h+lw/2);
  const ix0=Math.round(x+lw/2),iy0=Math.round(y+lw/2),ix1=Math.round(x+w-lw/2),iy1=Math.round(y+h-lw/2);
  for(let py=oy0;py<oy1;py++)for(let px=ox0;px<ox1;px++){
    if(px>=ix0&&px<ix1&&py>=iy0&&py<iy1)continue;
    this._blend(px,py,c,a);
  }
};
Ctx.prototype.strokeRect=function(x,y,w,h){this._strokeRectPx(x,y,w,h);};
Ctx.prototype._line=function(x0,y0,x1,y1,c,a,lw){
  const dx=x1-x0,dy=y1-y0,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))));
  const half=(lw-1)/2;
  for(let i=0;i<=steps;i++){
    const px=Math.floor(x0+dx*i/steps),py=Math.floor(y0+dy*i/steps);
    if(lw<=1){this._blend(px,py,c,a);continue;}
    for(let oy=-Math.floor(half);oy<=Math.ceil(half);oy++)for(let ox=-Math.floor(half);ox<=Math.ceil(half);ox++)this._blend(px+ox,py+oy,c,a);
  }
};
Ctx.prototype.stroke=function(){
  const c=this._stroke,a=this._stroke[3]*this.globalAlpha,lw=Math.max(1,Math.round(this.lineWidth));
  for(const sp of this._subs){
    const p=sp.pts,n=p.length/2;
    if(n<2)continue;
    for(let i=0;i+1<n;i++)this._line(p[i*2],p[i*2+1],p[i*2+2],p[i*2+3],c,a,lw);
    if(sp.closed)this._line(p[(n-1)*2],p[(n-1)*2+1],p[0],p[1],c,a,lw);
  }
};
Ctx.prototype.drawImage=function(img,dx,dy){
  if(!img||!img.data||!img.width)throw Error('raster: drawImage needs a raster bitmap {width,height,data}');
  const ga=this.globalAlpha,src=img.data,iw=img.width,ih=img.height;
  const d=this.data,w=this.width,h=this.height,clip=this._clip;
  const x0=dx|0,y0=dy|0;
  if(ga>=1){
    for(let sy=0;sy<ih;sy++){
      const py=y0+sy;
      if(py<0||py>=h)continue;
      const srow=sy*iw*4,drow=py*w;
      for(let sx=0;sx<iw;sx++){
        const px=x0+sx;
        if(px<0||px>=w)continue;
        const so=srow+sx*4;
        if(src[so+3]===0)continue;
        const i=drow+px;
        if(clip&&!clip[i])continue;
        const o=i*4;
        d[o]=src[so];d[o+1]=src[so+1];d[o+2]=src[so+2];d[o+3]=255;
      }
    }
    return;
  }
  for(let sy=0;sy<ih;sy++){
    const py=y0+sy;
    if(py<0||py>=h)continue;
    for(let sx=0;sx<iw;sx++){
      const so=(sy*iw+sx)*4,sa=src[so+3];
      if(sa===0)continue;
      this._blend(x0+sx,py,[src[so],src[so+1],src[so+2]],sa/255*ga);
    }
  }
};
root.BC_RASTER={create:function(w,h){return new Ctx(w,h);},parseColor:parse};
if(typeof module!=='undefined')module.exports=root.BC_RASTER;
})(typeof window!=='undefined'?window:globalThis);
