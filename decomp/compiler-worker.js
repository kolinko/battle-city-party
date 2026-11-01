let compilerPromise=null;
self.addEventListener('unhandledrejection',event=>self.postMessage({error:String(event.reason)}));
async function compiler(data){
    if(compilerPromise===null)compilerPromise=(async()=>{
        const module=await import(data.runtimeBase+'pyodide.mjs');
        const python=await module.loadPyodide({indexURL:data.runtimeBase});
        python.globals.set('compiler_input',data.compilerText);
        python.runPython("compiler_scope = {'__name__': 'bpyc', '__file__': '/bpyc.py'}\nexec(compile(compiler_input, '/bpyc.py', 'exec'), compiler_scope)");
        return python;
    })();
    return compilerPromise;
}
self.onmessage=async event=>{
    const data=event.data,python=await compiler(data),began=performance.now();
    python.globals.set('modern_input',data.sourceText);
    python.globals.set('machine_input',data.machineText);
    const result=JSON.parse(python.runPython("import json, hashlib\ncompiled_text, build_stats = compiler_scope['build_text'](modern_input, machine_input)\njson.dumps({'text': compiled_text, 'stats': build_stats, 'sha256': hashlib.sha256(compiled_text.encode()).hexdigest()})"));
    result.milliseconds=performance.now()-began;
    self.postMessage(result);
};
