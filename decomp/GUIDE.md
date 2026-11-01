# Battle City v4: read it, change it, run it

## The short version

The source is `game.py`. It is an executable, Python-style language. It is not ordinary CPython, and it is not the original authors' code: it was recovered from the cartridge's machine code. `bpyc.py` compiles the current text and the bodies of the helper functions, together with `game.machine.json`, into `game.bpy`. An interpreter executes that result while jsnes emulates the console hardware. The original ROM remains the source of graphics and data and the reference the source is checked against. The ROM is **not** in this repository: the page asks for your own copy and reads it in your browser.

## In the browser

- The default view shows `game.py`. Pick a function, or search by name, meaning or address.
- The buttons under the code take you to the functions it calls. *Back to the caller* returns to the previous function.
- Draft edits are kept while you switch functions. *Apply and restart* compiles all drafts together and creates a new, paused machine.
- The very same `bpyc.py` runs in a local Web Worker through the bundled Pyodide. Your code is not sent to any compile service. The first compile has to load the local Python runtime (about 12 MB); a background tab may compile more slowly.
- `game.bpy` is a secondary, technical, read-only view.
- *Download game.py* also saves your unapplied drafts. Download before you close or reload the tab.
- *Experiment: right → left* changes the actual result of the direction function. *Restore the v4 source* goes back to the bundled version.
- New functions you write are marked as outside the published verification.

## Controls

- Player 1: arrow keys, Z/X fire, Enter start/pause, left Shift select.
- Player 2: W/A/S/D and G/H. Choose 2 players before *New game*.
- The on-screen pad has its own player selector. Sound starts only after you click *Sound on*.
- Gamepads: the first connected pad drives player 1, the second player 2.

## Running it offline

Tested with Python 3.14. Put your ROM anywhere on disk, then from the repository root run:

```
python3 decomp/start.py
```

and open the address it prints, then follow the link to the source editor. `start.py` first runs `build.py`, then serves the repository folder over local HTTP. It is not a compile server: compiling still happens in the browser. Pyodide needs HTTP; it does not work from `file://`. The runtime and its standard library are bundled, so no CDN is used.

## Changing the files

1. Save your modified source as `decomp/game.py`.
2. Run `python3 decomp/build.py`. It does not overwrite `game.py` and does not regenerate the program from the ROM. It reads the current source, compiles `game.bpy`, and rebuilds `hardware.js` and `game-data.js`.
3. Reload the page from local HTTP.

Earlier generated `game.bpy` files are kept in a sibling folder, `decomp-generated-history/` (ignored by git). A compile error stops the build; an old result is never used as a silent substitute.

## What the language allows

Records and views are views onto memory. Explicit function results, helpers, changed bodies, consistent renames and the supported guards and loops are part of the language. An `int` or `bool` annotation on a local variable marks a purely program-level value with no extra console instruction: it may not hide a memory read or machine state. Memory reads must stay attached to the right moment of execution.

This is a compiler for this one game with its preserved schedule, not a general Python compiler. Arbitrary new memory operations, moved hardware entry points or retiming may be rejected. Entry names and bindings in `game.machine.json` must stay consistent.

## What stays technical

Console drivers, video and sound protocols, byte and asset encodings, jump tables and the boundaries where the stack and registers are preserved are kept visibly separate from the game logic. They are not a hidden second game program.

## Equivalence

The checks refer to the original ROM and the pinned jsnes emulator model, not to a physical NES or to every possible future input. Natural gameplay is distinguished from forced states, and executed frames from full snapshots. The evidence files (comparisons, mutations, classification) from the original research are not part of this public repository because several of them embed ROM data.

While building v4, an inherited digit-carry bug was found in the earlier v3 source: v3 disagreed with the ROM in 10 of 14 dedicated scoring probes. v4 has explicit carry-in/carry-out and separate positive and deliberately broken checks of that fix.

## Files

- `game.py`: the current source of the game and its helpers
- `game.machine.json`, `keep.json`: bindings to the preserved schedule
- `bpyc.py`, `source-runtime.js`: the compiler and the interpreter
- `compiler-worker.js`, `ui.js`, `index.html`: the editor and its interface
- `build.py`, `start.py`: build and local run
- `hardware.js`, `game-data.js`, `build-manifest.json`: generated by `build.py`
- `vendor/jsnes/`: the pinned console emulator and its licence
- `pyodide-core/pyodide/`: the local compiler runtime, its licence and source notice
- the ROM: yours, supplied in the browser, never stored in the repository
