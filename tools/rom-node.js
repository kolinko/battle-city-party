const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROM=path.join(__dirname,'..','rom','battle-city.nes'),SHA='463c6b44bf03c9bfc8c5d7995354f35ff6a8b23f8292bc558cf71c991870042e';
if(!fs.existsSync(ROM))throw Error('The tests read the game data from your own ROM. Put your Battle City .nes file at '+ROM+' (see README, "Bring your own ROM").');
const bytes=fs.readFileSync(ROM),sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha!==SHA)throw Error(ROM+' has SHA-256 '+sha+', expected '+SHA);
global.window=global;
global.BC_ASSETS=require('../party/rom-assets.js').extract(new Uint8Array(bytes));
global.BC_ASSETS.romSha256=sha;
