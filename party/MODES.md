# Battle City Party Edition: how to write a mode

This file is the contract for the files in `party/modes/`. The engine is `party/engine.js` (about 220 lines; read it). The template to copy is `party/modes/deathmatch.js`.

## File rules

- One file per batch of modes, listed in `party/modes/manifest.js`. A mode file does not touch `engine.js`, `render.js`, `main.js`, `input.js`, `manifest.js` or other mode files.
- Mode ids must be exactly the ones in the manifest: no aliases, no extra modes.
- File skeleton:

```js
(function(){
'use strict';
const BC=window.BC;
BC.registerMode({id:'...',name:'...',players:[2,4],desc:'...',setup(g){...}});
})();
```

- `registerMode` throws on a duplicate id or a missing `setup`. Nothing is caught: an error has to surface (the page shows it in the status bar, headless exits with code 1).
- No `try/catch`, no code comments, no emoji. Player-facing text: `name` and `desc` are shown in the HTML menu and can be ordinary sentences. On-screen game text (`g.text`) is short, upper case and in English, like the original (`FIRST TO 10`, `YELLOW WINS`).

## What a mode must have

1. **A real mechanic**: something you cannot get by tweaking deathmatch parameters.
2. **A reachable win/lose condition**: `isOver(g)` returns `{text:'...'}`, or call `g.gameOver('...')`.
3. **Visible feedback**: `g.text(...)` when the state changes, and/or your own `hud(...)`, so a player knows what is going on without reading the code.
4. **A test for 2 and for 4 players** (or the full range in `players`).

## Mode API

```js
BC.registerMode({
  id, name, players:[min,max], desc,
  group:'party',                      // menu section: 'classic' | 'story' | 'duo' | 'party' (default 'party'); anything else throws
  stageSelect:true,                   // left/right in the menu picks the starting stage; read g.options.stage in setup
  noEagle:true,                       // do not add the default eagle
  music:'warszawa',                   // background track name for hosts that have music (the Apple TV host); the web page has no sound
  setup(g),                           // called once, in the constructor
  update(g,inputs),                   // every frame, before tanks move
  onSpawn(g,tank),
  onFire(g,tank,bullet),
  onTankHit(g,tank,bullet,shooter),   // return false = no hit
  onTankDestroyed(g,victim,killer),   // killer may be null
  onBlockHit(g,bullet,cells,kind),
  onEagleDestroyed(g,eagle,bullet),   // if present, overrides eagleGameOver
  onPowerup(g,tank,kind),             // return false = the power-up does nothing
  onStageClear(g),                    // only with rules.stageClear
  isOver(g),                          // {text,...} or null
  hud(g,ctx,G,{OX,OY,WHITE,GREY})     // drawing on top
});
```

Order within a frame (`engine.js`): `update` → enemy spawns from the queue → respawns → tank control → bullets (`onTankHit`/`onTankDestroyed`/`onBlockHit`/`onEagleDestroyed`) → power-ups (`onPowerup`) → effects → `onStageClear` → `isOver`.

## `g.rules` (defaults in `engine.js`)

| field | default | meaning |
|---|---|---|
| `friendlyFire` | false | players share the team `players` by default: a player's bullet hitting a teammate stuns them for 90 frames, and the grenade and bullet cancelling spare teammates. `true` = players hurt each other, the grenade kills other players and their bullets cancel. Team modes set `p.team` themselves (`yellow`/`green`, per player `'p'+slot`) |
| `eagleGameOver` | true | destroying the eagle ends the game |
| `ownEagleHurts` | true | `false` = a bullet from your own team bounces off your own eagle |
| `stageClear` | true | enables stage logic and `onStageClear` |
| `enemyQueue` | [] | queue of enemy classes to spawn |
| `maxEnemies` | 4 | enemies on screen at once |
| `spawnDelay` | 90 | frames between spawns |
| `autoFire` | false | `true` = holding fire shoots repeatedly |
| `playerSpeed` | 0.75 | px per frame |
| `playerRespawn` | true | players respawn |
| `respawnDelay` | 60 | frames until respawn |
| `bulletVsBullet` | true | bullets cancel each other |
| `hud` | 'classic' | `'party'` = frags/lives/`timerText` instead of the enemy counter |
| `powerupsForAll` | true | who can collect power-ups |
| `enemyBonusEvery` | [4,11,18] | which enemy carries a power-up |

Note: with `friendlyFire:false`, a bullet from a player hitting a **player of the same team** is not ignored in the bullet loop. It reaches `hitTank`, which stuns (`aiState.stun=90`) instead of hitting. For hard immunity use `onTankHit` and return `false`.

## Game helpers (`g`)

- Maps: `g.loadStage(n)` (1..35, from the ROM), `g.buildArena(density)` (random, symmetrical, free corners and middle), `g.map.set(cx,cy,kind)` (26×26 cells of 8 px), `g.map.setMeta(mx,my,kind)` (13×13 meta-tiles of 16 px), `g.map.fill(kind)`, `g.map.get(cx,cy)`.
- Cell kinds: `BC.EMPTY, BC.BRICK, BC.STEEL, BC.WATER, BC.TREES, BC.ICE, BC.EAGLE`.
- Eagles: `g.addEagle(x,y,team)` (x,y in px, a multiple of 8, occupies 16×16), `g.ringEagle(e,BC.BRICK|BC.STEEL)`.
- Tanks: `g.spawnTank(spec)`, `g.spawnPlayer(i,spec)`, `g.playerSpawns=[[x,y],...]`, `g.killTank(t,killer,silent)`, `g.fire(t)`, `g.moveTank(t,dir,true)`, `g.blockedAt(t,x,y)`.
- Enemies: `g.classicEnemyQueue()` (the stage roster from the ROM), or your own `g.rules.enemyQueue=[0x80,0xa0,0xc0,0xe0,...]`.
- Power-ups: `g.spawnPowerup(kind,x,y)`, `g.randomPowerupKind()`, `g.applyPowerup(tank,kind)`; `BC.POWERUPS=['helmet','clock','shovel','star','grenade','tank']` (index = kind).
- Effects and text: `g.explode(x,y,big)`, `g.text('MSG',frames)`, `g.timerText='1.30'` (party HUD), `g.gameOver(text,extra)`.
- Randomness: **always `g.random()`** (seeded from the game options), never `Math.random()`, or headless runs stop being reproducible.

### `spec` for `spawnTank`

`{x,y,dir,team,player,cls,speed,bulletSpeed,hp,maxBullets,pierce,level,palette,bonus,shield,instant,ai,controller,tags,score}`

- `cls`: `0x80` basic, `0xa0` fast, `0xc0` power (fast bullet), `0xe0` armor (4 hp). Without `cls` the tank gets player parameters.
- `player: i` binds the tank to `g.players[i]` (sets `p.tank`).
- `ai:true` on a player tank = bot control; `controller(g,t,inputs)` replaces control entirely (that is how an escorted tank, or a player steering enemies, is done).
- `tags` is your own bag of per-mode data (`t.tags.carrier=true`).
- `instant:true` skips the 60-frame spawn animation.

### `g.players[i]`

`{slot,team,lives,score,level,tank,respawnTimer,palette,kills,deaths,alive,name}`. `name` is shown in texts, `palette` decides the color (`BC.PLAYER_PALETTES[0..3]` = yellow/green/blue/pink, `BC.ENEMY_PALETTE`, `BC.BONUS_PALETTE` = red flash). `tank` is `null` while the player waits to respawn.

### Tank

`{id,x,y,dir,team,player,cls,speed,bulletSpeed,hp,maxHp,maxBullets,pierce,level,palette,state,timer,shield,bonus,ai,controller,tags,moving,walk,slide,lastFire,hitFlash,alive,score}`. `state` is `'spawning'` or `'alive'`; `level` 0..3 (3 = breaks steel, 2 = two bullets); `bonus:true` = flashes red.

Directions: `BC.UP=0, BC.LEFT=1, BC.DOWN=2, BC.RIGHT=3`. The playfield is 208×208 px with (0,0) top left; a tank is 16×16, so the bottom-right spawn corner is (192,192).

## HUD

`hud(g,ctx,G,{OX,OY,WHITE,GREY})` draws on the 256×240 canvas **after** the map and the standard HUD, but **before** the central `g.text` messages. The playfield starts at `(OX,OY)=(16,16)` and is 208×208 px.

- `G.drawText(ctx,'12',WHITE,x,y)`: 8×8 ROM-font text, upper case, digits, space, `-` and `.` only. The ROM font has no `X` or `Z`; `gfx.js` draws those two letters from its own bitmaps (`BC_GFX.SYNTH`). Any other unknown character throws.
- `G.drawSprite16(ctx,base,pal,x,y)`, `G.drawTile(ctx,bank,tile,pal,x,y)`.
- Plain canvas works too: `ctx.fillStyle='rgba(0,0,0,0.9)';ctx.fillRect(...)` is how fog of war is done. When covering the field, keep the HUD strip on the right (x ≥ 224) visible and never cover the whole field permanently.

## Tests: required before a change goes in

The tests read the game data from your own ROM: put it at `rom/battle-city.nes` (this path is git-ignored).

1. Headless, for each id and the full player count:

```
node tools/headless.js <id> 5000
```

The output is one JSON line per mode: `state`, `result`, `frames`, `kills`, `deaths`, `lives`, `error`. An exception means a non-empty `error` and exit code 1. **"It did not crash" is not enough**: check that `state` and `result` make sense (a timed mode should end, co-op survival should keep going, the frag counter should grow). Bots in headless drive in circles and fire every 9 frames, so treat this as a test for exceptions and for the game state moving forward.
2. `node tools/headless.js` with no arguments runs every mode, so your file does not break anyone else's.
3. In a browser: serve the repository root (`python3 -m http.server 8765`), open `http://127.0.0.1:8765/party/`, supply your ROM, and in the developer console:
   - `BC_APP.start('<id>',4)` starts a mode for 4 players,
   - `BC_APP.step(600)` advances 600 frames and redraws,
   - `battleCityGame` is the whole game state (`.players`, `.tanks`, `.state`, `.result`),
   - the screen must show the map, the tanks and your HUD, not a black rectangle.
   Check that the mode appears in the menu with the right name and description.
4. The browser console must show no errors from your file.

### Scenarios: `tools/scenario.js`

Headless checks exceptions and that the state moves forward. Scenarios check **rules**: they run the real `BC.Game` without a DOM, with a fixed seed, and measure specific state fields.

```
node tools/scenario.js                       # all of them
node tools/scenario.js classic-shovel        # filter by part of the name
node tools/scenario.js --list
node tools/scenario.js --png --out=/some/path --tag=before
```

One JSON line per scenario (`pass`, `asserts`, `measure`, `artifacts`), then a summary; the exit code is 1 when anything failed. On failure (or with `--png`) a PNG of the board from `raster.js` plus a dump of `map`/`tanks`/`powerups`/`rules`/trace goes to `scenario-out/` (or `--out`). **Look at the PNG, not only at the counter.**

A scenario file in `tools/scenarios/*.js` exports an object or a list:

```js
module.exports={
  name:'classic-shovel-turns-the-wall-to-steel',
  mode:'classic',players:1,seed:777,
  setup(g,H){g.rules.maxEnemies=0;},
  steps:[{frames:70},{action(g,H){...}},{frames:2,assert:[...]},
         {frames:600,inputs:f=>({0:{right:true,fire:(f%9)===0}})}],
  assert:[{desc:'...',check(g,H,T){return {ok:true,measured:1};}}],
  measure(g,H,T){return {...};}
};
```

- `steps` run in order: `action(g,H,T)` → `frames` frames with `inputs` (an object per slot, or a function `(frame,g,H)`) → that step's `assert`. The global `assert` runs at the end.
- `check` returns `true` or `{ok,...}`; the other fields go into the report, so **measure, do not just confirm**.
- No `try/catch`: an engine exception aborts the whole run, and that is fine. A failed assertion is a measurement: it goes into the JSON, the run continues, the exit code is 1.
- Helpers `H`: `eagleWall(g,e)`/`ringCells(e)` (the 8 cells of the base ring, exactly the ones `g.ringEagle` uses), `materials`, `allOf`, `tankAt`, `tankOn`, `enemies`, `playerTank`, `enemiesOverlapping`, `powerupActive`, `lane`, `spawnPointsUsed`, `clearArea`, `mapRows`, `give`.
- The runner collects the trace `T` itself: `T.spawns` (frame, spawn slot, class, bonus), `T.deaths`, `T.overlaps`, `T.wall` (material changes of the ring), `T.shovel`, `T.stages`.
- A forced setup (empty queue, `maxEnemies=0`, a planted power-up, a `controller`) is allowed and **must be described in `desc`** as forced.

### Classic rules from the ROM (measured, not guessed)

Sources: `decomp/game.py` (functions) plus runs of the real ROM in jsnes (frames and pixels).

| rule | value | where it comes from |
|---|---|---|
| base ring at stage start | 8 brick cells around the eagle (±1 column, the row above) | ROM render: 8 `BRICK` cells, nothing else within 16 px |
| who draws the ring | `queue_status_vram_update()` right after `load_stage_map`, **not** the map data | `decomp/game.py::run_stage_campaign` |
| shovel | the same ring turns to steel, `stage_flow.delay=0x14` ticks × 64 frames = 1280 frames, then back to brick (rebuilt unconditionally) | `start_timed_display_when_68_negative`, `update_round_transition_countdowns_and_dispatch` |
| flashing at the end of the shovel | the last 192 frames, redrawn every 16 frames alternating brick/steel. In the ROM this is a real nametable write, so the ring really is brick in every other window and can be shot through | `blink_status_rows_while_countdown_ends`; `SHOVEL_BLINK` in `engine.js` |
| enemy spawn points | 3, in the order 1,2,0 (middle, right, left) | `initialize_tank_slot`; measured on the ROM in a real 1-player game on stage 1: x 120 → 216 → 24, y 24 |
| spawn interval | `0xBE - 4*stage` (−20 with 2 players), a spawn every `interval+1` frames → `rules.spawnDelay = 191-4*stage` | `initialize_stage_round`; measured on the ROM **on stage 1: 187, 187, 187 frames** between the first four spawns, and byte 70 → 71 frames on stage 30 in the demo: two points confirming the same formula |
| spawn animation | 14 phases of 2 frames, in practice **27 or 28 frames**: `tick_tank_states` only lets an enemy through on frames where `(slot ^ frame) & 1` is odd, so the total shifts by one frame depending on the parity of the slot and the spawn frame. Measured: 27 in four episodes on stage 1, 28 in one in demo mode | `SPAWN_FRAMES=28` (fixed, no parity) |
| shield after respawn | nominally 3 ticks × 64 = 192 frames, but **really 128–192**: measured on the ROM as 129 / 184 / 187 frames in three respawns | `configure_spawned_tank_slot`, `RESPAWN_SHIELD` |
| helmet / clock | nominally 10 ticks × 64 = 640 frames, really 576–640 (the same phase dependence) | `set_tank_effect_timer_10`, `set_global_pause_timer_10` |
| speeds: player 0.75 px/frame, class `$80` 0.5 | **measured on the ROM** (1 player, stage 1): player 61 px / 82 frames = 0.744 (0.75 with the end of the run rounded), `$80` 0.5 in four independent runs | `rules.playerSpeed`, `ENEMY_CLASSES` |
| speeds: `$a0` 1.0, `$c0` 0.5, `$e0` 0.5 | **not measured on the ROM**: the movement table is not in `game.py`, and stage 1 never reached these classes in the run; values from earlier RAM-map notes | `ENEMY_CLASSES` |
| scoring | ROM bytes `[0x10,0x20,0x30,0x40]` in `assets.enemyScore`, unpacked by `initialize_score_increment_record` as digits 4 and 5 → 100/200/300/400; bonus `0x50` → 500 | matches `ENEMY_CLASSES[*].score`, scenario `classic-scoring-matches-the-rom-score-bytes` |
| 20 enemies per stage, bonus on the 4th/11th/18th | `enemies_remaining=0x14`, tests on 17/10/3 | `initialize_stage_round`, `initialize_tank_slot` |
| max on screen | 4 (1 player) / 6 (2 players) | `enemy_spawn_start_slot` 5 or 7 |
| bullet vs bullet | both axis distances `< 6` | `PROJECTILE_AXIS_LIMIT` |
| stars | 0: 1 bullet/speed 2 · 1: speed 4 · 2–3: 2 bullets · 3: breaks steel | `allows_secondary_projectile`, `apply_projectile_traits` |
| enemies overlapping | ROM stage 1, 3721 frames: **183 frames with two living enemies overlapping** (collision works on an 8 px grid, so partial rectangle overlap is normal) and **0 frames with a living enemy overlapping a spawning one**. Party after the fix: 0 and 0: `blockedAt` blocks on exact rectangles, which is stricter than the original | scenario `classic-no-enemy-spawns-onto-another` |
| your own bullet destroys your own eagle | yes, the ROM does not check the owner → `rules.ownEagleHurts=true` is faithful | `handle_projectile_map_collision` |
| bullet slot after a hit | after hitting a wall **or a tank** the bullet goes through 9 explosion states `$33,$32,$31,$23,$22,$21,$13,$12,$11`, and the slot is busy meanwhile: the next shot (fire held, edge every frame) appears exactly **9 frames after the first frame of the impact**. Applies to players and enemies (one slot per tank). Bullet speed 2 px/frame (0 stars), 4 px/frame from 1 star, confirmed | ROM/jsnes 1P stage 1: `$CC[0]` impact t=97 → new `$40` t=106; tank hit: 18 frames of flight, 9 states, new shot t=28. Party: `BULLET_IMPACT_FRAMES=9`, `t.reload`, `spendBullet` in `engine.js`; scenario `classic-fire-slot-stays-busy-for-9-frames-after-the-bullet-hits`. Bullet vs bullet: not measured, no block |
| lives | ROM `$51=3` at the start, the HUD shows `IP 2` (`spare_lives = lives-1`); after a death `$51=2` → HUD `1`; `$51=2`→`1` respawn with HUD `0`; `$51=1` → a death ends the game: **3 tanks, the HUD shows reserves** | ROM/jsnes `$51`, HUD PNG; `game.py`. Party: `classic` sets `p.lives=2`; scenario `classic-player-starts-with-two-reserves-and-three-tanks` |
| enemy AI | the ROM state machine: the movement handler runs every other frame for attributes `$80/$c0/$e0` (`(slot^frame)&1`), every frame for `$a0` (fast); 1 px per visit; at an 8×8 grid crossing a 1/16 roll → action choice. **Time phases from stage start**: `slow_frame` (`$0A`, +1 every 64 frames, reset at stage start) ≤ `interval>>3` → random direction; ≤ `interval>>2` → aim at a player (even slots P1, odd slots P2); above that → aim at the eagle (`$78,$d8`). Stage 1 (`interval=186`): wandering 0–1535, player 1536–3007, eagle from 3008. Blocked: 25% turn around (`dir^2`, at the grid additionally state `$90`: 50% action choice / 50% turn ±90°), 75% pause for 2 visits. Aiming table `$e486` (the normal row prefers the Y axis, the alternative X, at random). **Firing: 1/32 per frame per enemy, with no line-of-sight check to a player or the eagle**, only when the bullet slot is free and nothing is frozen | `game.py`, ROM bytes `$e486`, `$e498`; jsnes trace: `$0A` 0→4 every 256 frames from stage start. Party: `romEnemy` in `modes/classic.js` via `onSpawn`/`controller` (the older `aiEnemy` stays for party modes); scenario `classic-enemies-run-the-rom-ai-state-machine`. Measured over 5 seeds with a still player: visible shots 1.86/100 frames of a living enemy (ROM: attempts 1.87, visible 1.14), turns 2.1/100 (ROM: direction-bit changes 2.1, of which clean `$a0→$a0` 0.22: pause states read as direction 0) |
| clock (freeze) | `$100=10` ticks, −1 every 64 frames → 640 frames; enemies stand still (position fixed), the spawn animation keeps going; **nothing flashes** (frames +2/+3, +10/+11, +40/+41 identical except for the player) | ROM/jsnes forced pickup of type 1; `game.py`. Party: `CLOCK_FRAMES=640`, no flashing after its removal from `render.js`: consistent. Whether a frozen enemy can fire: not measured (one enemy in the trial) |

### Deliberate difference: power-up timers without phase

The ROM keeps helmet/clock/shovel/shield in **ticks** and decrements them only at the boundary `frame & 0x3f == 0`, so the real duration depends on the frame a power-up was picked up on, and can be up to 64 frames shorter than nominal. Measured on the ROM for the respawn shield (nominally 192): **129, 184, 187** frames in three respawns.

Party keeps these counters in frames and decrements them every frame, so it always lands at the top of the range. Reproducing the phase would mean turning `shield`/`freezeTimer`/`shovelTimer` into ticks, and `shield` is also read by the renderer (`t.shield<60` for flashing) and by `hitTank`: a contract change of a field every mode can see. Nominal for now, difference documented here.

### Deliberate difference: brick granularity

The ROM keeps a quadrant mask under every 8×8 cell: an ordinary bullet removes **half** a cell (`clear_cell_mask_and_queue_update` clears only mask bits), and only a 3-star bullet clears the whole cell (`store_cell_and_queue_single_vram_update(value=0)` under `PROJECTILE_CLEAR_CELL`). `Map26` has one byte per 8 px cell, so an ordinary bullet in Party removes twice as much brick as the original.

**Left that way deliberately.** The fix is not a parameter but a model change: a sub-cell mask touches `Map26`, `bulletHitsMap`, `blockedAt`, `ringEagle`, the tile renderer and the command-buffer protocol of the native Apple TV renderer, i.e. code shared by every mode. If it ever goes in, it should be its own change with its own edge-case scenarios: the eagle ring, steel at 3 stars, a tank colliding with half a brick.

## Sound and music

The engine calls `BC.sfx(name)`; the browser page has no sound. Sound effects and a NES-style music sequencer exist in the Apple TV host this edition was built for, which is not part of this repository. The `music` field on modes is kept so the same mode files work there.

## Engine gaps

If something truly cannot be done with the existing hooks, you may add **one small, general** hook to `engine.js`: one every mode could use, not just yours. Keep the change minimal, keep existing behaviour unchanged, and say plainly what you added (file, line, what it does). First check `controller`, `tags`, `onTankHit` and `hud`: they cover most cases.
