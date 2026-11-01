import hashlib
import json
from pathlib import Path
import bpyc

ROOT = Path(__file__).resolve().parent
ROM_SHA256 = '463c6b44bf03c9bfc8c5d7995354f35ff6a8b23f8292bc558cf71c991870042e'
stats = bpyc.build(ROOT / 'game.py', ROOT / 'game.machine.json', ROOT / 'game.bpy')
modules = sorted((ROOT / 'vendor/jsnes/src').glob('*.js'))
assert len(modules) == 10, f'Expected the pinned ten jsnes modules, found {len(modules)}'
parts = [json.dumps(path.stem) + ':function(module,exports,require){\n' + path.read_text() + '\n}' for path in modules]
hardware = '(function(global){const modules={' + ','.join(parts) + '};const cache={};function require(name){name=name.replace("./","");if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;modules[name](module,module.exports,require);return module.exports;}global.jsnes=require("index");})(window);'
(ROOT / 'hardware.js').write_text(hardware)
source = (ROOT / 'game.py').read_text()
machine = (ROOT / 'game.machine.json').read_text()
compiled = (ROOT / 'game.bpy').read_text()
compiler = (ROOT / 'bpyc.py').read_text()
catalog = json.loads((ROOT / 'catalog-base.json').read_text())
core = ['game.py', 'game.machine.json', 'game.bpy', 'bpyc.py', 'source-runtime.js', 'keep.json']
hashes = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in core}
hashes['battle-city.nes (supplied by the player, not in this repository)'] = ROM_SHA256
payload = {'sourceText': source, 'machineText': machine, 'compilerText': compiler, 'workerText': (ROOT / 'compiler-worker.js').read_text(), 'roles': json.loads((ROOT / 'source-roles.json').read_text())['roles'], 'hashes': hashes, 'stats': stats}
data = 'window.BattleCityPayload=' + json.dumps(payload).replace('<', '\\u003c') + ';\n'
data += 'window.BattleCityCatalog=' + json.dumps(catalog).replace('<', '\\u003c') + ';\n'
data += 'window.BattleCitySourceFactory=rom=>BattleCityRuntime.createAPI(jsnes,rom,' + json.dumps(compiled).replace('<', '\\u003c') + ');\n'
(ROOT / 'game-data.js').write_text(data)
manifest = {'core': hashes, 'stats': stats, 'game_data_sha256': hashlib.sha256(data.encode()).hexdigest(), 'source_is_input': 'game.py + game.machine.json -> bpyc.build_text -> game.bpy; the ROM is read in the browser from the player\'s own file'}
(ROOT / 'build-manifest.json').write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
