(function(global) {
'use strict';
const registers={a:'REG_ACC',x:'REG_X',y:'REG_Y',sp:'REG_SP',pc:'REG_PC',carry:'F_CARRY',zero:'F_ZERO',sign:'F_SIGN',overflow:'F_OVERFLOW',interrupt:'F_INTERRUPT',decimal:'F_DECIMAL',brk:'F_BRK',unused:'F_NOTUSED'};
const locals=new Set(['value','base','address','cross','saved_carry','cycles']);
const precedence={or:1,and:2,'==':3,'!=':3,'<':3,'>':3,'<=':3,'>=':3,'|':4,'^':5,'&':6,'<<':7,'>>':7,'+':8,'-':8,'*':9,'/':9,'%':9};
const operators={'+':(a,b)=>a+b,'-':(a,b)=>a-b,'*':(a,b)=>a*b,'/':(a,b)=>a/b,'%':(a,b)=>a%b,'&':(a,b)=>a&b,'|':(a,b)=>a|b,'^':(a,b)=>a^b,'<<':(a,b)=>a<<b,'>>':(a,b)=>a>>b,'==':(a,b)=>a===b,'!=':(a,b)=>a!==b,'<':(a,b)=>a<b,'>':(a,b)=>a>b,'<=':(a,b)=>a<=b,'>=':(a,b)=>a>=b};
const primitiveNames=new Set(['read','read_word','indirect_word','write','push','pull','status','restore_status','jump','call','return_from_call','int','nz','cross']);
function readLocal(name){return e=>{const frame=e.frame;if(frame===undefined||!(name in frame.locals))throw Error('undefined source local '+name);return frame.locals[name];};}
function expression(text,symbols,lifted=false) {
  const tokens=[];let position=0;
  const lexer=/\s*(0x[\da-f]+|\d+|[a-zA-Z_][a-zA-Z_0-9]*|<<|>>|==|!=|<=|>=|[()\[\]+\-*/%&|^~,<>])/gy;
  while(position<text.length) {lexer.lastIndex=position;const m=lexer.exec(text);if(!m)throw Error('invalid expression at '+text.slice(position));tokens.push(m[1]);position=lexer.lastIndex;}
  let index=0;
  function parse(min) {
    const token=tokens[index++];let node;
    if(token==='('){node=parse(0);if(tokens[index++]!==')')throw Error('expected closing parenthesis: '+text);}
    else if(token==='-'||token==='~'||token==='not'){const a=parse(10);node={kind:'unary',op:token,a,eval:token==='-'?e=>-a.eval(e):token==='~'?e=>~a.eval(e):e=>!a.eval(e)};}
    else if(/^0x|^\d/.test(token)){const value=Number(token);node={kind:'const',value,eval:()=>value};}
    else if(tokens[index]==='('){if(!primitiveNames.has(token))throw Error('unknown primitive '+token);index++;const args=[];if(tokens[index]!==')'){for(;;){args.push(parse(0));if(tokens[index]!==',')break;index++;}}if(tokens[index++]!==')')throw Error('expected call close '+text);node={kind:'primitive',name:token,args,a:args[0],eval:e=>e.functions[token](...args.map(a=>a.eval(e)))};}
    else if(tokens[index]==='['){index++;const idx=parse(0);if(tokens[index++]!==']')throw Error('expected ] in '+text);
      if(token==='ram')node={kind:'ram',idx,eval:e=>e.functions.read(idx.eval(e)&0xffff)};
      else{if(!Object.hasOwn(symbols,token))throw Error('unknown array '+token);const base=symbols[token];const wrap=base<0x100?0xff:0xffff;node={kind:'index',array:token,base,idx,eval:e=>e.functions.read((base+idx.eval(e))&wrap)};}}
    else if(Object.hasOwn(registers,token)){const field=registers[token];node={kind:'register',name:token,eval:e=>e.cpu[field]};}
    else if(!lifted&&locals.has(token)){node={kind:'interp',name:token,eval:e=>e[token]};}
    else if(token==='returned_zero')node={kind:'register',name:token,eval:e=>e.cpu.F_ZERO===0};
    else if(token==='returned_negative')node={kind:'register',name:token,eval:e=>e.cpu.F_SIGN===1};
    else if(token==='returned_carry')node={kind:'register',name:token,eval:e=>e.cpu.F_CARRY===1};
    else if(token==='returned_overflow')node={kind:'register',name:token,eval:e=>e.cpu.F_OVERFLOW===1};
    else if(Object.hasOwn(symbols,token)){const value=symbols[token];node={kind:'const',value,symbol:token,eval:()=>value};}
    else if(lifted&&/^[a-zA-Z_]\w*$/.test(token)){node={kind:'local',name:token,eval:readLocal(token)};}
    else throw Error('unknown source name '+token);
    while(index<tokens.length && Object.hasOwn(precedence,tokens[index]) && precedence[tokens[index]]>=min){const op=tokens[index++],l=node,r=parse(precedence[op]+1);node={kind:'bin',op,l,r,eval:op==='and'?e=>l.eval(e)&&r.eval(e):op==='or'?e=>l.eval(e)||r.eval(e):e=>operators[op](l.eval(e),r.eval(e))};}
    return node;
  }
  const result=parse(0);if(index!==tokens.length)throw Error('trailing tokens '+text);return result;
}
function pureSourceValue(node){if(node.kind==='const'||node.kind==='local')return true;if(node.kind==='unary')return pureSourceValue(node.a);if(node.kind==='bin')return pureSourceValue(node.l)&&pureSourceValue(node.r);if(node.kind==='primitive'&&node.name==='int')return node.args.every(pureSourceValue);return false;}
function parseAnnotations(lines) {
  const annotations=Object.create(null);
  for(const {text,line} of lines) {
    const m=/^(0x[\da-f]+)(?:@(\w+))?: (.*)$/.exec(text);if(!m)throw Error('invalid machine annotation line '+line);
    const record={pc:Number(m[1]),routine:m[2]||null,line,ins:[],cycles:[],schedule:[],effects:[],bindings:[]};
    for(const part of m[3].split(' ;; ')) {
      const kv=/^(\w+)=(.*)$/.exec(part);if(!kv)throw Error('invalid annotation part '+part+' line '+line);
      const key=kv[1],value=kv[2];
      if(key==='ins')record.ins=value.split(',').map(t=>{const p=t.split(':');return {pc:Number(p[0]),size:Number(p[1])};});
      else if(key==='cycles')record.cycles=value.split(';').map(t=>{const c=/^\s*(\d+)(?:\+xcross:(\S+))?(?:\+taken:(1|x))?\s*$/.exec(t);if(!c)throw Error('invalid cycle entry '+t+' line '+line);return {base:Number(c[1]),cross:c[2]||null,taken:c[3]||null};});
      else if(key==='schedule')record.schedule=value===''?[]:value.split(',').map(t=>{const m=/^(\d+)(\+)?$/.exec(t);if(!m)throw Error('invalid schedule entry '+t+' line '+line);return {chunk:Number(m[1]),after:m[2]==='+'};});
      else if(/^bind\d+$/.test(key)){if(!/^abi__\w+$/.test(value))throw Error('invalid ABI binding '+value+' line '+line);record.bindings.push({index:Number(key.slice(4)),name:value});}
      else if(/^e\d+$/.test(key)){const chunk=Number(key.slice(1)),colon=value.indexOf(':'),target=value.slice(0,colon);if(!['a','x','y','c','v','n','z','nz','flags','i','d'].includes(target))throw Error('unknown effect target '+target+' line '+line);(record.effects[chunk]=record.effects[chunk]||[]).push({target,spec:value.slice(colon+1),line});}
      else throw Error('unknown annotation key '+key+' line '+line);
    }
    if(record.cycles.length!==record.ins.length)throw Error('annotation chunk mismatch at line '+line);
    if(record.routine!==null){annotations.byRoutine=annotations.byRoutine||Object.create(null);const table=annotations.byRoutine[record.routine]=annotations.byRoutine[record.routine]||Object.create(null);if(table[record.pc]!==undefined)throw Error('duplicate annotation '+text.split(':')[0]);table[record.pc]=record;continue;}
    if(annotations[record.pc]!==undefined)throw Error('duplicate annotation '+m[1]);
    annotations[record.pc]=record;
  }
  return annotations;
}
const GOTO=Symbol('goto'),BREAK=Symbol('break'),CONTINUE=Symbol('continue'),RETURN=Symbol('return');
function splitArguments(text){const parts=[];let depth=0,start=0;for(let i=0;i<text.length;i++){const c=text[i];if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;else if(c===','&&depth===0){parts.push(text.slice(start,i).trim());start=i+1;}}if(text.slice(start).trim())parts.push(text.slice(start).trim());return parts;}
function statementRoot(s,path) {
  const first=path[0];
  if(s.kind==='exec'||s.kind==='return'||s.kind==='if'||s.kind==='push'||s.kind==='primitive'){if(first!=='v'&&first!=='cond')throw Error('statement has no part '+first);return [s.node,1];}
  if(s.kind==='call'){const m=/^k([axy]|carry)$/.exec(first);if(!m)throw Error('call ref needs kwarg part, got '+first);const arg=s.args.find(a=>a.key===m[1]);if(!arg)throw Error('call has no kwarg '+m[1]);return [arg.node,1];}
  throw Error('statement kind '+s.kind+' has no referable value');
}
function resolveRef(spec,statements,line) {
  if(/^(and|or|xor|add|sub|mask|shl|shr|bit|cmp):/.test(spec))throw Error('derivation '+spec+' is not allowed here: every register and flag value must be a source expression (annotation line '+line+')');
  if(spec[0]==='@'){const name=spec.slice(1);return {kind:'local',name,eval:readLocal(name)};}
  if(spec[0]==='#')throw Error('literal effect '+spec+' is not allowed; every register and flag value must reference the source (annotation line '+line+')');
  const m=/^s(\d+)((?:\.\w+)*)$/.exec(spec);if(!m)throw Error('invalid effect reference '+spec+' at annotation line '+line);
  const k=Number(m[1]);if(k>=statements.length)throw Error('effect reference '+spec+' points past the span statements (annotation line '+line+')');
  let path=m[2]?m[2].slice(1).split('.'):[];
  if(!(path.length&&(path[0]==='v'||path[0]==='cond'||/^k(?:[axy]|carry)$/.test(path[0]))))path=['v'].concat(path);
  let [node,i]=statementRoot(statements[k],path);
  for(;i<path.length;i++){const step=path[i];if(step==='predicate'){if(statements[k].kind!=='if'||i!==1)throw Error('predicate reference must name the root of a current condition: '+spec);while(node.kind==='unary'&&node.op==='not')node=node.a;}else if(step==='l'||step==='r'||step==='a'||step==='idx'){if(node[step]===undefined)throw Error('effect path '+spec+' does not resolve in the current source (annotation line '+line+')');node=node[step];}else throw Error('bad path step '+step+' in '+spec);}
  return node;
}
function compileEffect(effect,statements) {
  const {target,spec,line}=effect;
  const der=/^(cmp|add|sub):(.+)$/.exec(spec);
  if(!der){const node=resolveRef(spec,statements,line);return {target,kind:'value',node};}
  const kind=der[1],node=resolveRef(der[2],statements,line);
  if(target!=='flags')throw Error('derivation '+kind+' only sets flags (annotation line '+line+')');
  if(kind==='cmp'&&!(node.kind==='bin'&&(node.op==='-'||Object.hasOwn(precedence,node.op)&&precedence[node.op]===3)))throw Error('cmp derivation needs a comparison or subtraction node: '+spec);
  if((kind==='add'||kind==='sub')&&!(node.kind==='bin'&&(node.op==='+'||node.op==='-')))throw Error(kind+' derivation needs a + or - node: '+spec);
  return {target,kind:(kind==='add'||kind==='sub')?(node.op==='+'?'add':'sub'):kind,node};
}
function leftmostTerms(node,op) {
  const terms=[];(function walk(x){if(x.kind==='bin'&&x.op===op&&terms.length<2)walk(x.l);else terms.push(x);})(node);
  let cursor=node;while(cursor.kind==='bin'&&cursor.op===op&&cursor.l.kind==='bin'&&cursor.l.op===op)cursor=cursor.l;
  return cursor;
}
function applyEffect(effect,e,c) {
  const {target,kind,node}=effect;
  if(kind==='value'){
    let v=node.eval(e);
    if(typeof v==='boolean')v=Number(v);
    if(target==='a'){if(v<0||v>255||!Number.isInteger(v))throw Error('register a would receive '+v+' from '+describeNode(node));c.REG_ACC=v;}
    else if(target==='x'){if(v<0||v>255||!Number.isInteger(v))throw Error('register x would receive '+v);c.REG_X=v;}
    else if(target==='y'){if(v<0||v>255||!Number.isInteger(v))throw Error('register y would receive '+v);c.REG_Y=v;}
    else if(target==='c')c.F_CARRY=v&1;
    else if(target==='v')c.F_OVERFLOW=v&1;
    else if(target==='i')c.F_INTERRUPT=v&1;
    else if(target==='d')c.F_DECIMAL=v&1;
    else if(target==='nz'){c.F_SIGN=(v>>7)&1;c.F_ZERO=v;}
    else if(target==='n')c.F_SIGN=v&1;
    else if(target==='z')c.F_ZERO=v;
    else throw Error('effect target '+target);
    return;
  }
  if(kind==='cmp'){const L=node.l.eval(e),R=node.r.eval(e),d=L-R;c.F_CARRY=L>=R?1:0;c.F_ZERO=d&0xff;c.F_SIGN=(d>>7)&1;return;}
  if(kind==='add'){const inner=leftmostTerms(node,'+');const a=inner.l.eval(e),b=inner.r.eval(e),total=node.eval(e);c.F_OVERFLOW=(((a^b)&0x80)===0&&((a^total)&0x80)!==0)?1:0;c.F_CARRY=total>255?1:0;c.F_ZERO=total&0xff;c.F_SIGN=(total>>7)&1;return;}
  if(kind==='sub'){const inner=leftmostTerms(node,'-');const a=inner.l.eval(e),b=inner.r.eval(e),total=node.eval(e);c.F_OVERFLOW=(((a^total)&0x80)!==0&&((a^b)&0x80)!==0)?1:0;c.F_CARRY=total>=0?1:0;c.F_ZERO=total&0xff;c.F_SIGN=(total>>7)&1;return;}
  throw Error('effect kind '+kind);
}
function describeNode(node){return node.kind==='local'?node.name:node.kind==='const'?String(node.value):node.kind;}
function crossFor(node,e) {
  if(node.kind==='index'){const idx=node.idx.eval(e);return Number((node.base&0xff00)!==((node.base+idx)&0xff00));}
  if(node.kind==='ram'&&node.idx.kind==='bin'&&node.idx.op==='+'){const l=node.idx.l.eval(e),r=node.idx.r.eval(e);return Number((l&0xff00)!==((l+r)&0xff00));}
  if(node.kind==='index'){const idx=node.idx.eval(e);return Number((node.base&0xff00)!==((node.base+idx)&0xff00));}
  throw Error('page-cross reference must be an indexed array or ram[base + index] access');
}
function compileLifted(routine,symbols,annotations) {
  const labels=Object.create(null);
  function compileBlock(items,indent,path) {
    const statements=[];let i=0;
    while(i<items.length) {
      const item=items[i];
      if(item.indent!==indent)throw Error('unexpected indentation at '+item.line);
      const text=item.text,here=path.concat(statements.length);
      let m;
      if(text==='pass'){i++;continue;}
      if((m=/^(\w+): (int|bool) = (.+)$/.exec(text))){const name=m[1];if(Object.hasOwn(registers,name)||Object.hasOwn(symbols,name))throw Error('source-local may not assign '+name);const node=expression(m[3],symbols,true);if(!pureSourceValue(node))throw Error('source-local requires pure source values at '+item.line);statements.push({kind:'local',target:name,node,run:e=>{e.frame.locals[name]=node.eval(e);},line:item.line});i++;continue;}
      if((m=/^at\((0x[\da-f]+)\)$/.exec(text))){const pc=Number(m[1]);const own=annotations.byRoutine&&annotations.byRoutine[routine.name];const ann=own&&own[pc]!==undefined?own[pc]:annotations[pc];if(ann===undefined)throw Error('lifted span 0x'+pc.toString(16)+' has no machine annotation (line '+item.line+')');statements.push({kind:'at',pc,ann,line:item.line});i++;continue;}
      if((m=/^label (\w+):$/.exec(text))){labels[m[1]]=here;i++;continue;}
      if((m=/^goto (\w+)$/.exec(text))){statements.push({kind:'goto',label:m[1],line:item.line});i++;continue;}
      if(text==='break'){statements.push({kind:'break',line:item.line});i++;continue;}
      if(text==='continue'){statements.push({kind:'continue',line:item.line});i++;continue;}
      if(text==='while True:'){i++;const body=[];while(i<items.length&&items[i].indent>indent)body.push(items[i++]);statements.push({kind:'while',body:compileBlock(body,indent+4,here.concat('body')),line:item.line});continue;}
      if(text.startsWith('if ')&&text.endsWith(':')){
        const node=expression(text.slice(3,-1),symbols,true);i++;const body=[];while(i<items.length&&items[i].indent>indent)body.push(items[i++]);
        let otherwise=null;
        if(i<items.length&&items[i].indent===indent&&items[i].text==='else:'){i++;const other=[];while(i<items.length&&items[i].indent>indent)other.push(items[i++]);otherwise=compileBlock(other,indent+4,here.concat('else'));}
        statements.push({kind:'if',node,body:compileBlock(body,indent+4,here.concat('then')),otherwise,line:item.line,scheduled:true});continue;}
      if(text==='return_from_interrupt'){statements.push({kind:'rti',line:item.line,scheduled:true});i++;continue;}
      if((m=/^return_values\((.*)\)$/.exec(text))){const outputs=splitArguments(m[1]).map(part=>{const kv=/^([a-z+]+)=(.+)$/.exec(part);if(!kv)throw Error('invalid return output '+part+' at '+item.line);const keys=kv[1].split('+');if(keys.some(key=>!['a','x','y','zero','carry','negative','overflow'].includes(key)))throw Error('unknown return binding '+part);return {keys,node:expression(kv[2],symbols,true)};});const keys=outputs.flatMap(o=>o.keys);if(!outputs.length||new Set(keys).size!==keys.length)throw Error('empty or repeated return output at '+item.line);statements.push({kind:'return',node:outputs[0].node,outputs,line:item.line,scheduled:true});i++;continue;}
      if((m=/^return( (.+))?$/.exec(text))){statements.push({kind:'return',node:m[2]===undefined?null:expression(m[2],symbols,true),line:item.line,scheduled:true});i++;continue;}
      if((m=/^jump\(indirect_word\((0x[\da-f]+)\)\)$/.exec(text))){statements.push({kind:'dispatch',address:Number(m[1]),line:item.line,scheduled:true});i++;continue;}
      if((m=/^jump\((\w+)\)$/.exec(text))){if(!Object.hasOwn(symbols,m[1]))throw Error('unknown jump target '+m[1]);statements.push({kind:'jump',target:symbols[m[1]],line:item.line,scheduled:true});i++;continue;}
      if((m=/^fall_into\((\w+)((?:, [\s\S]+)?)\)$/.exec(text))){if(!Object.hasOwn(symbols,m[1]))throw Error('unknown routine '+m[1]);const args=splitArguments(m[2].replace(/^, /,'')).map(part=>{const kv=/^([axy]|carry)=(.+)$/.exec(part);if(!kv)throw Error('invalid tail argument '+part);return {key:kv[1],reg:registers[kv[1]],node:expression(kv[2],symbols,true)};});statements.push({kind:'jump',target:symbols[m[1]],args,fallthrough:true,line:item.line});i++;continue;}
      if((m=/^call\((\w+)((?:, (?:[axy]|carry)=[^,]+)*)\)$/.exec(text))){if(!Object.hasOwn(symbols,m[1]))throw Error('unknown call target '+m[1]);const args=[];for(const kv of m[2].split(', ').filter(Boolean)){const eq=kv.indexOf('=');args.push({reg:registers[kv.slice(0,eq)],key:kv.slice(0,eq),node:expression(kv.slice(eq+1),symbols,true)});}statements.push({kind:'call',target:symbols[m[1]],args,line:item.line,scheduled:true});i++;continue;}
      if((m=/^push\((.+)\)$/.exec(text))){const node=expression(m[1],symbols,true);statements.push({kind:'push',node,run:e=>{e.functions.push(node.eval(e));},line:item.line,scheduled:true});i++;continue;}
      const statusOp={'clear_carry()':e=>{e.cpu.F_CARRY=0;},'set_carry()':e=>{e.cpu.F_CARRY=1;},'enable_interrupts()':e=>{e.cpu.F_INTERRUPT=0;},'disable_interrupts()':e=>{e.cpu.F_INTERRUPT=1;},'clear_decimal_mode()':e=>{e.cpu.F_DECIMAL=0;},'set_decimal_mode()':e=>{e.cpu.F_DECIMAL=1;},'clear_overflow()':e=>{e.cpu.F_OVERFLOW=0;}}[text];
      if(statusOp){statements.push({kind:'primitive',node:null,run:statusOp,line:item.line,scheduled:true});i++;continue;}
      if(text==='push_status()'){statements.push({kind:'primitive',node:null,run:e=>{e.cpu.F_BRK=1;e.functions.push(e.functions.status());},line:item.line,scheduled:true});i++;continue;}
      if(text==='pull_status()'){statements.push({kind:'primitive',node:null,run:e=>{e.functions.restore_status(e.functions.pull());e.cpu.F_NOTUSED=1;},line:item.line,scheduled:true});i++;continue;}
      if((m=/^set_stack_pointer\((.+)\)$/.exec(text))){const node=expression(m[1],symbols,true);statements.push({kind:'primitive',node,run:e=>{e.cpu.REG_SP=0x100|(node.eval(e)&0xff);},line:item.line,scheduled:true});i++;continue;}
      if((m=/^ram\[(.+)\] = (.+)$/.exec(text))){const address=expression(m[1],symbols,true),node=expression(m[2],symbols,true);statements.push({kind:'exec',node,run:e=>{e.functions.write(address.eval(e)&0xffff,node.eval(e));},line:item.line,scheduled:true});i++;continue;}
      if((m=/^(\w+)\[(.+)\] = (.+)$/.exec(text))){if(!Object.hasOwn(symbols,m[1]))throw Error('unknown array '+m[1]+' line '+item.line);const base=symbols[m[1]],wrap=base<0x100?0xff:0xffff,idx=expression(m[2],symbols,true),node=expression(m[3],symbols,true);statements.push({kind:'exec',node,run:e=>{e.functions.write((base+idx.eval(e))&wrap,node.eval(e));},line:item.line,scheduled:true});i++;continue;}
      if((m=/^(\w+) = (.+)$/.exec(text))){const name=m[1];if(Object.hasOwn(registers,name)||Object.hasOwn(symbols,name))throw Error('lifted source may not assign '+name+' at line '+item.line);const node=expression(m[2],symbols,true);if(m[2]==='pull()')node.impure=true;statements.push({kind:'exec',node,target:name,run:e=>{e.frame.locals[name]=node.eval(e);},line:item.line,scheduled:true});i++;continue;}
      throw Error('invalid lifted statement at line '+item.line+': '+text);
    }
    return statements;
  }
  const body=compileBlock(routine.lines,4,[]);
  const compiled={name:routine.name,pc:routine.pc,params:routine.params,body,labels};
  const assigned=new Set(routine.params.map(p=>p.name));
  for(const item of routine.lines){const m=/^(\w+)(?:: (?:int|bool))? = /.exec(item.text);if(m)assigned.add(m[1]);}
  compiled.assigned=assigned;
  bindSpans(compiled);
  return compiled;
}
function firstAnchor(statements,start,continuation,labelsOf,whileStack) {
  for(let i=start;i<statements.length;i++){
    const s=statements[i];
    if(s.kind==='local')continue;
    if(s.kind==='at')return s.pc;
    if(s.kind==='jump')return s.target;
    if(s.kind==='goto'){const path=labelsOf[s.label];if(path===undefined)throw Error('unknown label '+s.label);return anchorAtPath(path,labelsOf);}
    if(s.kind==='continue'){if(!whileStack.length)throw Error('continue outside loop at line '+s.line);const w=whileStack[whileStack.length-1];return firstAnchor(w.stmt.body,0,null,labelsOf,whileStack);}
    if(s.kind==='break'){if(!whileStack.length)throw Error('break outside loop at line '+s.line);const w=whileStack[whileStack.length-1];return firstAnchor(w.parent,w.index+1,w.continuation,labelsOf,whileStack.slice(0,-1));}
    if(s.kind==='while')return firstAnchor(s.body,0,null,labelsOf,whileStack.concat({stmt:s,parent:statements,index:i,continuation}));
    throw Error('statement at line '+s.line+' executes before any span anchor');
  }
  if(continuation===null)throw Error('control falls off the end of a lifted routine body');
  return continuation();
}
function anchorAtPath(path,labelsOf){return {path};}
function bindSpans(compiled) {
  const spans=[];
  function walk(statements,continuation,whileStack,labelsOf){
    let current=null;
    for(let i=0;i<statements.length;i++){
      const s=statements[i];
      if(s.kind==='local')continue;
      if(s.kind==='at'){if(current!==null&&current.exit===undefined)current.exit=s.pc;current={ann:s.ann,statements:[],at:s,exit:undefined};spans.push(current);s.span=current;continue;}
      if(s.kind==='while'){if(current!==null&&current.exit===undefined)current.exit=firstAnchor(s.body,0,null,labelsOf,whileStack.concat({stmt:s,parent:statements,index:i,continuation}));const loopBack=()=>firstAnchor(s.body,0,loopBack,labelsOf,whileStack.concat({stmt:s,parent:statements,index:i,continuation}));walk(s.body,loopBack,whileStack.concat({stmt:s,parent:statements,index:i,continuation}),labelsOf);current=null;continue;}
      if(s.kind==='goto'||s.kind==='break'||s.kind==='continue'){if(current!==null&&current.exit===undefined)current.exit=firstAnchor(statements,i,continuation,labelsOf,whileStack);current=null;continue;}
      if(s.kind==='jump'&&s.fallthrough){if(current!==null&&current.exit===undefined)current.exit=s.target;current=null;continue;}
      if(current===null){if(s.kind==='exec'){s.afterCall=true;continue;}throw Error('statement at line '+s.line+' is outside any span');}
      if(s.kind==='jump'&&s.fallthrough){current=null;continue;}
      current.statements.push(s);s.span=current;
      if(s.kind==='if'){
        const thenAnchor=firstAnchor(s.body,0,()=>firstAnchor(statements,i+1,continuation,labelsOf,whileStack),labelsOf,whileStack);
        const elseAnchor=s.otherwise?firstAnchor(s.otherwise,0,()=>firstAnchor(statements,i+1,continuation,labelsOf,whileStack),labelsOf,whileStack):firstAnchor(statements,i+1,continuation,labelsOf,whileStack);
        s.thenAnchor=thenAnchor;s.elseAnchor=elseAnchor;
        walk(s.body,()=>firstAnchor(statements,i+1,continuation,labelsOf,whileStack),whileStack,labelsOf);
        if(s.otherwise)walk(s.otherwise,()=>firstAnchor(statements,i+1,continuation,labelsOf,whileStack),whileStack,labelsOf);
        current=null;
      }
      if(s.kind==='call'||s.kind==='return'||s.kind==='jump'||s.kind==='dispatch'||s.kind==='rti')current=null;
    }
    if(current!==null&&current.exit===undefined){if(continuation===null)throw Error('span 0x'+current.ann.pc.toString(16)+' runs off the end of '+compiled.name);current.exit=continuation();}
  }
  const labelsOf=compiled.labels;
  walk(compiled.body,null,[],labelsOf);
  for(const span of spans)if(span.exit===undefined){const t=span.statements.length?span.statements[span.statements.length-1]:null;if(!(t&&(t.kind==='if'||t.kind==='call'||t.kind==='return'||t.kind==='rti'||t.kind==='dispatch'||t.kind==='jump')))throw Error('span 0x'+span.ann.pc.toString(16)+' (line '+span.at.line+') has no successor anchor');}
  for(const span of spans)for(const binding of span.ann.bindings){const statement=span.statements[binding.index];if(!statement||statement.kind!=='exec'||!statement.target)throw Error('ABI binding requires a current source local assignment at '+span.ann.pc.toString(16));compiled.assigned.add(binding.name);const run=statement.run;statement.run=e=>{run(e);e.frame.locals[binding.name]=e.frame.locals[statement.target];};}
  for(const span of spans){
    const ann=span.ann,scheduled=span.statements;
    if(ann.schedule.length!==scheduled.length)throw Error('span 0x'+ann.pc.toString(16)+' (source line '+span.at.line+') has '+scheduled.length+' statements but its machine annotation schedules '+ann.schedule.length+'; statements cannot be added or removed without regenerating the annotation');
    span.effects=ann.effects.map(list=>(list||[]).map(effect=>{const compiled_=compileEffect(effect,scheduled);for(const m of effect.spec.matchAll(/@(\w+)/g))if(!compiled.assigned.has(m[1]))throw Error('machine annotation for span 0x'+ann.pc.toString(16)+' references local '+m[1]+' which '+compiled.name+' no longer assigns; rename the annotation reference too or regenerate with lift.py');return compiled_;}));
    span.cycles=ann.cycles.map(cy=>({base:cy.base,cross:cy.cross?resolveRef(cy.cross,scheduled,ann.line):null}));
    const lastIns=ann.ins[ann.ins.length-1],fallthrough=lastIns.pc+lastIns.size;
    const resolve=a=>typeof a==='number'?a:resolveLabelAnchor(a,compiled);
    for(const s of scheduled)if(s.kind==='if'){
      const t=resolve(s.thenAnchor),f=resolve(s.elseAnchor);
      if(t===fallthrough&&f!==fallthrough){s.takenWhenTrue=false;s.branchTarget=f;}
      else if(f===fallthrough&&t!==fallthrough){s.takenWhenTrue=true;s.branchTarget=t;}
      else if(t===fallthrough&&f===fallthrough){s.takenWhenTrue=true;s.branchTarget=fallthrough;}
      else throw Error('if at line '+s.line+': neither arm continues at the instruction after the branch (0x'+fallthrough.toString(16)+'); arms anchor at 0x'+t.toString(16)+' and 0x'+f.toString(16));
      const policy=ann.cycles[ann.cycles.length-1].taken;if(policy===null)throw Error('if at line '+s.line+' closes span 0x'+ann.pc.toString(16)+' whose last instruction is not a branch');
      s.branchPenalty=policy==='1'?1:1+Number(((lastIns.pc-1)&0xff00)!==((s.branchTarget-1)&0xff00));
    }
    const terminator=scheduled.length?scheduled[scheduled.length-1]:null;
    if(!(terminator&&(terminator.kind==='if'||terminator.kind==='call'||terminator.kind==='return'||terminator.kind==='rti'||terminator.kind==='dispatch'||(terminator.kind==='jump'&&!terminator.fallthrough)))){
      const exit=span.exit===undefined?null:resolve(span.exit);
      if(exit!==null&&exit!==fallthrough)span.exitTarget=exit;
    }
  }
  compiled.spans=spans;
}
function resolveLabelAnchor(a,compiled){
  let list=compiled.body,i=0;const path=a.path,frames=[];
  function scan(list,start,frames){
    for(let j=start;j<list.length;j++){const s=list[j];if(s.kind==='local')continue;if(s.kind==='at')return s.pc;if(s.kind==='jump')return s.target;if(s.kind==='while')return scan(s.body,0,frames.concat({list,stmt:s,idx:j,arm:'body'}));throw Error('label at line '+s.line+' is followed by a statement without a span anchor');}
    if(!frames.length)throw Error('label does not start with a span anchor');
    const f=frames[frames.length-1];
    if(f.arm==='body')return scan(f.stmt.body,0,frames);
    return scan(f.list,f.idx+1,frames.slice(0,-1));
  }
  while(i<path.length){
    const idx=path[i++];
    if(i===path.length)return scan(list,idx,frames);
    const stmt=list[idx],arm=path[i++];
    frames.push({list,stmt,idx,arm});
    if(arm==='then'||arm==='body')list=stmt.body;else if(arm==='else')list=stmt.otherwise;else throw Error('bad label path arm '+arm);
  }
  throw Error('label path did not resolve');
}
function parse(sourceText) {
  const lines=sourceText.split('\n'),symbols=Object.create(null),records=[],functions=[],lifted=[],annotationLines=[];
  let pending=null,pendingIsFunction=false,current=null,liftedRoutine=null,section='source';
  for(let line=0;line<lines.length;line++) {
    const raw=lines[line],text=raw.trim();if(!text)continue;
    if(text==='machine annotations:'){section='machine';continue;}
    if(section==='machine'){annotationLines.push({text,line:line+1});continue;}
    const definition=/^def ([a-zA-Z_][\w]*)\(([^)]*)\):$/.exec(text);
    if(definition){pending=definition[1];pendingIsFunction=true;liftedRoutine=null;current=null;
      let isLifted=definition[2]!=='';
      for(let look=line+1;!isLifted&&look<lines.length&&(lines[look].startsWith(' ')||!lines[look].trim());look++)if(/^at\(0x[\da-f]+\)$/.test(lines[look].trim()))isLifted=true;
      if(isLifted){const params=definition[2].split(', ').filter(Boolean).map(p=>{const kv=/^(\w+)=([axy]|carry)$/.exec(p);if(!kv)throw Error('invalid parameter '+p+' line '+(line+1));return {name:kv[1],reg:registers[kv[2]]};});liftedRoutine={name:definition[1],params,lines:[],line:line+1,pc:null,pendingLabels:null};lifted.push(liftedRoutine);pending=null;}
      continue;}
    if(liftedRoutine!==null){
      if(!raw.startsWith(' '))throw Error('lifted statement without indentation at line '+(line+1));
      const at=/^at\((0x[\da-f]+)\)$/.exec(text);
      if(at&&liftedRoutine.pc===null){liftedRoutine.pc=Number(at[1]);symbols[liftedRoutine.name]=liftedRoutine.pc;functions.push({name:liftedRoutine.name,pc:liftedRoutine.pc,line:liftedRoutine.line});}
      const label=/^label (\w+):$/.exec(text);
      liftedRoutine.lines.push({text,indent:raw.length-raw.trimStart().length,line:line+1});
      if(label)liftedRoutine.pendingLabels=(liftedRoutine.pendingLabels||[]).concat(label[1]);
      if(at&&liftedRoutine.pendingLabels){for(const name of liftedRoutine.pendingLabels)symbols[name]=Number(at[1]);liftedRoutine.pendingLabels=null;}
      continue;}
    const label=/^label (\w+):$/.exec(text);
    if(label){pending=label[1];pendingIsFunction=false;continue;}
    const marker=/^at\((0x[\da-f]+), (\d+), (\d+)\)$/.exec(text);
    if(marker){const pc=Number(marker[1]),size=Number(marker[2]),cycles=Number(marker[3]);if(pending!==null){symbols[pending]=pc;if(pendingIsFunction)functions.push({name:pending,pc,line:line+1});pending=null;}current={pc,size,cycles,line:line+1,lines:[]};records.push(current);continue;}
    if(!raw.startsWith(' ')){const m=/^(\w+) = (0x[\da-f]+|\d+)$/.exec(text);if(!m)throw Error('invalid declaration line '+(line+1));symbols[m[1]]=Number(m[2]);continue;}
    if(current===null)throw Error('statement outside source step '+(line+1));
    current.lines.push({text,indent:raw.length-raw.trimStart().length,line:line+1});
  }
  const map=new Array(65536);
  for(const record of records) {
    if(map[record.pc]!==undefined)throw Error('duplicate source address '+record.pc.toString(16));
    let i=0;
    function block(indent) {
      const statements=[];
      while(i<record.lines.length && record.lines[i].indent>=indent) {
        const item=record.lines[i++];if(item.indent!==indent)throw Error('unexpected indentation at '+item.line);
        if(item.text==='pass')continue;
        if(item.text.startsWith('if ')&&item.text.endsWith(':')){const condition=expression(item.text.slice(3,-1),symbols),body=block(indent+4);statements.push(e=>{if(condition.eval(e))for(const s of body)s(e);});continue;}
        const assignment=/^(\w+) = (.+)$/.exec(item.text);
        if(assignment){const name=assignment[1],value=expression(assignment[2],symbols);if(Object.hasOwn(registers,name)){const field=registers[name];statements.push(e=>{e.cpu[field]=value.eval(e);});}else if(locals.has(name)){statements.push(e=>{e[name]=value.eval(e);});}else throw Error('invalid assignment '+item.text);}
        else {const value=expression(item.text,symbols);statements.push(e=>{value.eval(e);});}
      }
      return statements;
    }
    record.statements=block(4);map[record.pc]=record;
  }
  const annotations=parseAnnotations(annotationLines);
  const routines=[],pushed=new Set();
  for(const routine of lifted) {
    if(routine.pc===null)throw Error('lifted routine '+routine.name+' has no span');
    const compiled=compileLifted(routine,symbols,annotations);
    routines.push(compiled);
    if(map[routine.pc]!==undefined)throw Error('duplicate source address '+routine.pc.toString(16));
    map[routine.pc]={pc:routine.pc,lifted:compiled,line:routine.line};
    for(const span of compiled.spans)for(const ins of span.ann.ins){if(map[ins.pc]!==undefined&&map[ins.pc].lifted!==undefined&&map[ins.pc].lifted!==compiled)throw Error('lifted routine '+compiled.name+' contains the entry of '+map[ins.pc].lifted.name+' at 0x'+ins.pc.toString(16));if(map[ins.pc]===undefined)map[ins.pc]={pc:ins.pc,inner:compiled,line:span.at.line};if(!pushed.has(ins.pc)){pushed.add(ins.pc);records.push({pc:ins.pc,size:ins.size,cycles:null,line:span.at.line,lifted:true});}}
  }
  records.sort((p,q)=>p.pc-q.pc);
  return {sourceText,map,records,symbols,functions,lifted:routines,annotations};
}
function status(c) {return c.F_CARRY|((c.F_ZERO===0?1:0)<<1)|(c.F_INTERRUPT<<2)|(c.F_DECIMAL<<3)|(c.F_BRK<<4)|(c.F_NOTUSED<<5)|(c.F_OVERFLOW<<6)|(c.F_SIGN<<7);}
function serviceInterrupt(c) {
  if(c.irqRequested) {
    const flags=status(c);c.REG_PC_NEW=c.REG_PC;c.F_INTERRUPT_NEW=c.F_INTERRUPT;
    if(c.irqType===0){if(c.F_INTERRUPT===0)c.doIrq(flags);}
    else if(c.irqType===1)c.doNonMaskableInterrupt(flags);
    else if(c.irqType===2)c.doResetInterrupt();
    else throw Error('invalid IRQ type '+c.irqType);
    c.REG_PC=c.REG_PC_NEW;c.F_INTERRUPT=c.F_INTERRUPT_NEW;c.F_BRK=c.F_BRK_NEW;c.irqRequested=false;
    return true;
  }
  return false;
}
function* runLifted(frame,environment,machine) {
  const c=environment.cpu,routine=frame.routine;
  let span=null;
  function* runChunk(last){
    const idx=span.chunk;const ins=span.ann.ins[idx];
    if(c.REG_PC+1!==ins.pc)throw Error('lifted span desynchronised: expected 0x'+ins.pc.toString(16)+' at 0x'+(c.REG_PC+1).toString(16));
    c.REG_PC+=ins.size;
    const cy=span.def.cycles[idx];let cycles=cy.base+(cy.cross?crossFor(cy.cross,environment):0);
    const isLast=idx===span.ann.ins.length-1;
    for(const effect of span.def.effects[idx]||[]){if(isLast&&last&&last.skip&&last.skip.has(effect.target))continue;applyEffect(effect,environment,c);}
    while(span.deferred.length)span.deferred.shift().run(environment);
    if(isLast){if(span.branchTaken===true)cycles+=span.branchPenalty;if(last&&last.transfer)last.transfer();else if(span.def.exitTarget!==undefined)c.REG_PC=span.def.exitTarget-1;}
    machine.executed[ins.pc]=1;machine.instructions++;span.chunk++;frame.midSpan=span.chunk<span.ann.ins.length;if(!(last&&last.transfer&&last.keepResume))frame.resume=c.REG_PC+1;
    yield cycles;
  }
  function* advanceTo(chunkIndex){while(span.chunk<chunkIndex)yield* runChunk(null);}
  function* closeSpan(){if(span!==null){yield* advanceTo(span.ann.ins.length-1);if(span.chunk<span.ann.ins.length)yield* runChunk({});span=null;}}
  function* runBlock(statements,seek){
    for(let i=0;i<statements.length;i++){
      const s=statements[i];
      if(seek!==null&&seek.path.length){const index=seek.path[0],arm=seek.path[1];if(i<index)continue;if(i>index)throw Error('goto seek overshoot');if(s.kind==='if'){const rest={path:seek.path.slice(2)};seek=null;const r=yield* runBlock(arm==='then'?s.body:s.otherwise,rest);if(r!==undefined)return r;continue;}if(s.kind==='while'){const rest={path:seek.path.slice(2)};seek=null;const r=yield* runWhile(s,rest);if(r!==undefined)return r;continue;}seek=null;}
      if(s.kind==='local'){if(span!==null&&span.deferred.length)yield* advanceTo(span.chunk+1);s.run(environment);continue;}
      if(s.kind==='at'){yield* closeSpan();c.REG_PC=s.pc-1;span={ann:s.ann,def:s.span,chunk:0,stmt:0,branchTaken:undefined,branchPenalty:0,deferred:[]};continue;}
      if(s.kind==='goto')return {kind:GOTO,label:s.label};
      if(s.kind==='break')return BREAK;
      if(s.kind==='continue')return CONTINUE;
      if(s.kind==='while'){const r=yield* runWhile(s,null);if(r!==undefined)return r;continue;}
      if(s.kind==='jump'&&s.fallthrough){yield* closeSpan();if(c.REG_PC+1!==s.target)throw Error('fallthrough jump mismatch at line '+s.line);const values=s.args.map(arg=>({key:arg.key,reg:arg.reg,value:Number(arg.node.eval(environment))}));for(const {key,reg,value} of values){if(value<0||value>255||!Number.isInteger(value)||key==='carry'&&value>1)throw Error('tail argument out of range at '+s.line);c[reg]=value;}frame.finished=true;return RETURN;}
      if(span===null&&s.kind==='jump'){if(c.REG_PC+1!==s.target)throw Error('fallthrough jump mismatch at line '+s.line);return RETURN;}
      if(span===null&&s.afterCall){s.run(environment);continue;}
      if(span===null)throw Error('lifted statement outside span at line '+s.line);
      const scheduled=span.ann.schedule[span.stmt];span.stmt++;
      const chunkIndex=scheduled===undefined?Math.min(span.chunk,span.ann.ins.length-1):scheduled.chunk;
      const lastIndex=span.ann.ins.length-1;
      if(s.kind==='exec'||s.kind==='push'||s.kind==='primitive'){yield* advanceTo(chunkIndex);if(scheduled!==undefined&&scheduled.after){span.deferred.push(s);}else s.run(environment);continue;}
      if(s.kind==='if'){
        yield* advanceTo(lastIndex);
        while(span.deferred.length)span.deferred.shift().run(environment);
        const truth=!!s.node.eval(environment);
        span.branchTaken=truth===s.takenWhenTrue;span.branchPenalty=s.branchPenalty;
        const target=s.branchTarget;
        yield* runChunk(span.branchTaken?{transfer:()=>{c.REG_PC=target-1;}}:{});span=null;
        const r=yield* runBlock(truth?s.body:(s.otherwise||[]),null);if(r!==undefined)return r;continue;}
      if(s.kind==='call'){
        yield* advanceTo(lastIndex);
        const values=s.args.map(arg=>({key:arg.key,reg:arg.reg,value:Number(arg.node.eval(environment))}));
        const skip=new Set();for(const {key,reg,value} of values){if(value<0||value>255||!Number.isInteger(value)||key==='carry'&&value>1)throw Error('call argument '+key+' out of range at line '+s.line);c[reg]=value;skip.add(key==='carry'?'c':key);}
        const target=s.target;
        yield* runChunk({skip,keepResume:true,transfer:()=>{c.push((c.REG_PC>>8)&255);c.push(c.REG_PC&255);frame.resume=c.REG_PC+1;c.REG_PC=target-1;}});
        span=null;continue;}
      if(s.kind==='return'){
        yield* advanceTo(lastIndex);
        const skip=new Set();
        const outputs=s.outputs===undefined?(s.node===null?[]:[{keys:['a'],node:s.node}]):s.outputs;
        const values=outputs.map(output=>({keys:output.keys,value:Number(output.node.eval(environment))}));
        for(const {keys,value} of values)for(const key of keys){if(value<0||value>255||!Number.isInteger(value))throw Error('return '+key+' out of byte range at line '+s.line);if(key==='a'||key==='x'||key==='y'){c[registers[key]]=value;skip.add(key);}else if(key==='zero'){c.F_ZERO=value?0:(c.F_ZERO===0?1:c.F_ZERO);skip.add('z');}else{const field={carry:'F_CARRY',negative:'F_SIGN',overflow:'F_OVERFLOW'}[key];c[field]=value?1:0;skip.add({carry:'c',negative:'n',overflow:'v'}[key]);}}
        frame.finished=true;
        yield* runChunk({skip,transfer:()=>{c.REG_PC=c.pull();c.REG_PC+=c.pull()<<8;if(c.REG_PC===0xffff)throw Error('unexpected NSF return in game source');}});
        span=null;return RETURN;}
      if(s.kind==='rti'){
        yield* advanceTo(lastIndex);frame.finished=true;
        yield* runChunk({transfer:()=>{environment.functions.restore_status(c.pull());c.REG_PC=c.pull();c.REG_PC=c.REG_PC+(c.pull()<<8)-1;c.F_NOTUSED=1;}});
        span=null;return RETURN;}
      if(s.kind==='jump'){
        if(span.chunk<span.ann.ins.length){yield* advanceTo(lastIndex);const target=s.target;frame.finished=true;yield* runChunk({transfer:()=>{c.REG_PC=target-1;}});}
        else if(c.REG_PC+1!==s.target)throw Error('fallthrough jump mismatch at line '+s.line);
        span=null;return RETURN;}
      if(s.kind==='dispatch'){
        yield* advanceTo(lastIndex);const address=s.address;frame.finished=true;
        yield* runChunk({transfer:()=>{c.REG_PC=environment.functions.indirect_word(address)-1;}});
        span=null;return RETURN;}
      throw Error('unknown lifted statement kind '+s.kind);
    }
    return undefined;
  }
  function* runWhile(s,seek){
    for(;;){const r=yield* runBlock(s.body,seek);seek=null;if(r===BREAK)return undefined;if(r===CONTINUE||r===undefined)continue;return r;}
  }
  let seek=null;
  for(;;){
    const r=yield* runBlock(routine.body,seek);
    if(r===RETURN)return;
    if(r!==undefined&&r.kind===GOTO){const path=routine.labels[r.label];if(path===undefined)throw Error('unknown label '+r.label+' in '+routine.name);seek={path};continue;}
    if(r===BREAK||r===CONTINUE)throw Error('break/continue outside loop in '+routine.name);
    throw Error('lifted routine '+routine.name+' ran off its end');
  }
}
function install(machine,program) {
  const c=machine.nes.cpu;
  const environment={cpu:c,cycles:0,value:0,base:0,address:0,cross:0,saved_carry:0,frame:undefined};
  environment.functions={
    read:address=>c.load(address),read_word:address=>c.load16bit(address),
    indirect_word:address=>address<0x1fff?c.mem[address]+(c.mem[(address&0xff00)|((address+1)&255)]<<8):machine.nes.mmap.load(address)+(machine.nes.mmap.load((address&0xff00)|((address+1)&255))<<8),
    write:(address,value)=>c.write(address,value),push:value=>c.push(value),pull:()=>c.pull(),status:()=>status(c),
    restore_status:value=>{c.F_CARRY=value&1;c.F_ZERO=((value>>1)&1)===1?0:1;c.F_INTERRUPT=(value>>2)&1;c.F_DECIMAL=(value>>3)&1;c.F_BRK=(value>>4)&1;c.F_NOTUSED=(value>>5)&1;c.F_OVERFLOW=(value>>6)&1;c.F_SIGN=(value>>7)&1;},
    jump:address=>{c.REG_PC=address-1;},
    call:address=>{c.push((c.REG_PC>>8)&255);c.push(c.REG_PC&255);c.REG_PC=address-1;},
    return_from_call:()=>{c.REG_PC=c.pull();c.REG_PC+=c.pull()<<8;if(c.REG_PC===0xffff)throw Error('unexpected NSF return in game source');},
    int:value=>Number(value),
    nz:value=>{c.F_SIGN=(value>>7)&1;c.F_ZERO=value;return value;},
    cross:(base,index)=>Number((base&0xff00)!==((base+index)&0xff00))
  };
  c.opdata=null;
  machine.stack=[];machine.straddles=[];
  c.emulate=function sourceStep() {
    const top=machine.stack.length?machine.stack[machine.stack.length-1]:null;
    if(serviceInterrupt(c)&&top!==null&&top.midSpan)machine.straddles.push({pc:top.resume,routine:top.routine.name,depth:machine.stack.length,frame:machine.frames});
    for(;;){
      const pc=c.REG_PC+1;
      let frame=machine.stack.length?machine.stack[machine.stack.length-1]:null;
      if(frame!==null&&frame.resume!==pc){for(let i=machine.stack.length-2;i>=0;i--)if(machine.stack[i].resume===pc){machine.unwound=(machine.unwound||0)+(machine.stack.length-1-i);machine.stack.length=i+1;frame=machine.stack[i];break;}}
      if(frame!==null&&frame.resume===pc){
        environment.frame=frame;
        const step=frame.generator.next();
        if(step.done){machine.stack.pop();environment.frame=machine.stack.length?machine.stack[machine.stack.length-1]:undefined;continue;}
        if(frame.finished){machine.stack.pop();environment.frame=machine.stack.length?machine.stack[machine.stack.length-1]:undefined;}
        machine.cycles+=step.value;return step.value;
      }
      const record=machine.program.map[pc];
      if(record===undefined)throw Error('unmapped source PC 0x'+pc.toString(16));
      if(record.inner!==undefined)throw Error('entered lifted routine '+record.inner.name+' mid-body at 0x'+pc.toString(16));
      if(record.lifted!==undefined){
        const routine=record.lifted;
        const next={routine,locals:Object.create(null),resume:pc,midSpan:false};
        for(const p of routine.params)next.locals[p.name]=c[p.reg];
        next.generator=runLifted(next,environment,machine);
        machine.stack.push(next);
        continue;
      }
      machine.executed[pc]=1;machine.instructions++;c.REG_PC+=record.size;environment.cycles=record.cycles;
      for(const statement of record.statements)statement(environment);
      machine.cycles+=environment.cycles;
      return environment.cycles;
    }
  };
  machine.program=program;
}
function snapshot(object,seen=new Set()) {
  if(object===null || typeof object!=='object')return object;
  if(seen.has(object))return '[shared]';seen.add(object);
  if(Array.isArray(object)||ArrayBuffer.isView(object))return Array.from(object,item=>snapshot(item,seen));
  const result={};for(const key of Object.keys(object).sort()){if(key==='nes'||key==='papu'||typeof object[key]==='function')continue;result[key]=snapshot(object[key],seen);}return result;
}
function createAPI(jsnes,rom,sourceText) {
  let program=parse(sourceText);
  const api={sourceText,parse,program};
  api.makeMachine=function(mode='source',options={}) {
    if(mode!=='source'&&mode!=='original')throw Error('mode must be source or original');
    const machine={mode,frames:0,instructions:0,cycles:0,stack:[],straddles:[],executed:new Uint8Array(65536),pixels:new Uint32Array(256*240),audio:[],program:options.program===undefined?program:options.program};
    machine.nes=new jsnes.NES({sampleRate:44100,onFrame:pixels=>{machine.pixels.set(pixels);if(options.onFrame)options.onFrame(pixels);},onAudioSample:(left,right)=>{machine.audio.push(left,right);if(options.onAudioSample)options.onAudioSample(left,right);}});
    const binary=typeof rom==='string'?rom:Array.from(rom,b=>String.fromCharCode(b)).join('');
    machine.nes.loadROM(binary);
    if(mode==='source')install(machine,machine.program);
    else {const original=machine.nes.cpu.emulate.bind(machine.nes.cpu);machine.nes.cpu.emulate=function(){const c=machine.nes.cpu;let pc=c.REG_PC+1;if(c.irqRequested){if(c.irqType===2)pc=c.mem[0xfffc]|c.mem[0xfffd]<<8;else if(c.irqType===1&&(c.mem[0x2000]&128))pc=c.mem[0xfffa]|c.mem[0xfffb]<<8;else if(c.irqType===0&&c.F_INTERRUPT===0)pc=c.mem[0xfffe]|c.mem[0xffff]<<8;}machine.executed[pc]=1;machine.instructions++;const cycles=original();machine.cycles+=cycles;return cycles;};}
    machine.stepFrame=function(){machine.audio=[];machine.nes.frame();machine.frames++;return machine;};
    machine.runFrames=function(count){for(let i=0;i<count;i++)machine.stepFrame();return machine;};
    machine.button=function(player,name,down=true){const key=typeof name==='number'?name:jsnes.Controller['BUTTON_'+name.toUpperCase()];if(key===undefined)throw Error('unknown controller button '+name);machine.nes[down?'buttonDown':'buttonUp'](player,key);};
    machine.reloadSource=function(text){if(machine.mode!=='source')throw Error('source reload requires source mode');if(machine.stack.length)throw Error('source reload while a lifted routine is active; reload when the frame ends outside lifted code');const next=parse(text);machine.program=next;return next;};
    machine.inspect=function(){const cpu=machine.nes.cpu;return {mode:machine.mode,frames:machine.frames,instructions:machine.instructions,cycles:machine.cycles,straddles:machine.straddles.length,registers:Object.fromEntries(cpu.JSON_PROPERTIES.filter(k=>k!=='mem').map(k=>[k,cpu[k]])),memory:cpu.mem.slice(),ppu:cpu.nes.ppu.toJSON(),apu:snapshot(cpu.nes.papu),mapper:cpu.nes.mmap.toJSON(),pixels:Array.from(machine.pixels),audio:machine.audio.slice(),executedPCs:Array.from(machine.executed,(v,i)=>v?i:-1).filter(i=>i>=0)};};
    return machine;
  };
  api.runFrames=(machine,count)=>machine.runFrames(count);
  api.stepFrame=machine=>machine.stepFrame();
  api.inspect=machine=>machine.inspect();
  api.setSource=function(text){program=parse(text);api.sourceText=text;api.program=program;return program;};
  return api;
}
const exported={parse,createAPI,serviceInterrupt};
if(typeof module!=='undefined'&&module.exports)module.exports=exported;
else global.BattleCityRuntime=exported;
})(typeof window!=='undefined'?window:globalThis);
