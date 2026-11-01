(function(){
'use strict';
const G=window.BC_GFX,BC=window.BC;
const BG_PAL=window.BC_ASSETS.bgPalettes;
const WHITE=BG_PAL[3],GREY=window.BC_ASSETS.spritePalettes[2];
const OX=16,OY=16;
function rgb(i){const c=G.PAL[i&63];return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}
function drawTank(ctx,g,t){
  const x=OX+t.x,y=OY+t.y;
  if(t.state==='spawning'){const star=[0xf9,0xf5,0xf1,0xf5][(t.timer>>2)&3];if(t.timer>4)G.drawSprite16(ctx,star,WHITE,x,y);return;}
  let pal=t.palette;
  if(t.bonus&&((g.frame>>3)&1))pal=BC.BONUS_PALETTE;
  if(t.hitFlash>0&&(t.hitFlash&1))pal=WHITE;
  else if(t.maxHp>1&&t.hp<t.maxHp&&t.player===null)pal=[BC.PLAYER_PALETTES[1],BC.PLAYER_PALETTES[0],BC.ENEMY_PALETTE][t.hp%3];
  const walk=t.moving?((t.walk>>1)&1):0;
  const base=(t.player!==null||t.cls===null?(t.level&3)*0x20:t.cls)+t.dir*8+walk*4;
  G.drawSprite16(ctx,base,pal,x,y);
  if(t.shield>0&&((g.frame>>1)&1)){ctx.strokeStyle=t.shield<60&&((g.frame>>3)&1)?'#888':'#fff';ctx.lineWidth=1;ctx.strokeRect(x-0.5,y-0.5,17,17);}
}
function drawEffect(ctx,fx){
  const x=OX+fx.x,y=OY+fx.y,t=fx.t;
  if(fx.kind==='pop'){const f=t<6?0xf1:t<12?0xf5:0xf9;G.drawSprite16(ctx,f,GREY,x,y);return;}
  if(t<6)G.drawSprite16(ctx,0xf1,GREY,x+8,y+8);else if(t<12)G.drawSprite16(ctx,0xf5,GREY,x+8,y+8);else if(t<18)G.drawSprite16(ctx,0xf9,GREY,x+8,y+8);
  else if(t<28){G.drawSprite16(ctx,0xd1,GREY,x,y);G.drawSprite16(ctx,0xd5,GREY,x+16,y);G.drawSprite16(ctx,0xd9,GREY,x,y+16);G.drawSprite16(ctx,0xdd,GREY,x+16,y+16);}
  else if(t<34)G.drawSprite16(ctx,0xf9,GREY,x+8,y+8);
}
function hudClassic(ctx,g){
  const x=232;let y=32;const left=g.rules.enemyQueue.length;
  for(let i=0;i<Math.min(20,left);i++)G.drawTile(ctx,1,0x6a,WHITE,x+(i&1)*8,y+(i>>1)*8);
  y=136;
  for(const p of g.players){G.drawText(ctx,'P'+(p.slot+1),p.palette,x,y);G.drawText(ctx,String(Math.max(0,p.lives)),WHITE,x+8,y+8);y+=20;}
  G.drawTile(ctx,1,0x58,[0x0f,0x00,0x16,0x27],x,200);G.drawTile(ctx,1,0x13,[0x0f,0x00,0x16,0x27],x+8,200);G.drawTile(ctx,1,0x14,[0x0f,0x00,0x16,0x27],x,208);G.drawTile(ctx,1,0x70,[0x0f,0x00,0x16,0x27],x+8,208);
  G.drawText(ctx,String(g.stage),WHITE,x+8,216);
}
function hudParty(ctx,g){
  const x=228;let y=24;
  for(const p of g.players){const alive=p.tank!==null||p.alive;G.drawSprite16(ctx,0x00,alive?p.palette:GREY,x,y);G.drawText(ctx,String(p.kills),WHITE,x+18,y);G.drawText(ctx,String(Math.max(0,p.lives)),alive?p.palette:GREY,x+18,y+8);y+=24;}
  if(g.rules.enemyQueue.length){G.drawText(ctx,String(g.rules.enemyQueue.length),GREY,x+8,y+8);}
  if(g.timerText)G.drawText(ctx,g.timerText,WHITE,x,224);
}
function render(ctx,g,opts){
  const water=((g.frame>>4)&1)?0x14:0x12;
  ctx.fillStyle=rgb(0x00);ctx.fillRect(0,0,256,240);
  ctx.fillStyle='#000';ctx.fillRect(OX,OY,BC.FIELD,BC.FIELD);
  const m=g.map;
  for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++){const i=cy*BC.GRID+cx,c=m.cell[i];if(c===BC.EMPTY||c===BC.TREES||c===BC.EAGLE)continue;let tile=m.tile[i];if(c===BC.WATER)tile=water;G.drawTile(ctx,1,tile,BG_PAL[m.tileAttr[i]],OX+cx*8,OY+cy*8);}
  for(const e of g.eagles){const b=e.alive?0xc8:0xcc;const pal=e.team&&e.team!=='players'&&g.players.find(p=>p.team===e.team)?g.players.find(p=>p.team===e.team).palette:BG_PAL[0];G.drawTile(ctx,1,b,pal,OX+e.x,OY+e.y);G.drawTile(ctx,1,b+2,pal,OX+e.x+8,OY+e.y);G.drawTile(ctx,1,b+1,pal,OX+e.x,OY+e.y+8);G.drawTile(ctx,1,b+3,pal,OX+e.x+8,OY+e.y+8);}
  for(const t of g.tanks)drawTank(ctx,g,t);
  for(const b of g.bullets)G.drawSprite8x16(ctx,0xb1+b.dir*2,GREY,OX+b.x-4,OY+b.y-8);
  for(const pu of g.powerups)if((pu.age>>3)&1||pu.age>60)G.drawSprite16(ctx,0x81+pu.kind*4,((pu.age>>2)&1)?BC.BONUS_PALETTE:GREY,OX+pu.x,OY+pu.y);
  for(const fx of g.effects)drawEffect(ctx,fx);
  for(let cy=0;cy<BC.GRID;cy++)for(let cx=0;cx<BC.GRID;cx++){const i=cy*BC.GRID+cx;if(m.cell[i]===BC.TREES)G.drawTile(ctx,1,m.tile[i],BG_PAL[2],OX+cx*8,OY+cy*8);}
  if(g.rules.hud==='classic')hudClassic(ctx,g);else hudParty(ctx,g);
  if(g.mode.hud)g.mode.hud(g,ctx,G,{OX,OY,WHITE,GREY});
  const texts=g.texts.slice(-3);let ty=OY+BC.FIELD/2-8*texts.length;
  for(const t of texts){const w=t.msg.length*8+16;ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(OX+BC.FIELD/2-w/2,ty-4,w,16);G.drawText(ctx,t.msg,WHITE,OX+BC.FIELD/2-t.msg.length*4,ty);ty+=16;}
}
window.BC_RENDER={render,OX,OY,BG_PAL,WHITE,GREY};
})();
