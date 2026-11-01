import ast
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NODE = 'node'
IDENT = r'[a-z_][a-z0-9_]*'
DEF = re.compile(r'^def (' + IDENT + r')\((.*)\):$')
RECORD = re.compile(r'^(record|view) (' + IDENT + r'): (.+)$')
ASSIGN = re.compile(r'^(' + IDENT + r') = (.+)$')
ANNOTATION = re.compile(r'^    (0x[0-9a-f]{4})(?:@(\w+))?: ')
AT = re.compile(r'^at\(0x[0-9a-f]{4}\)$')
SIDECAR_STATUS = {'clear_carry()', 'set_carry()', 'clear_overflow()', 'set_decimal_mode()', 'clear_decimal_mode()'}
PRIMITIVES = SIDECAR_STATUS | {'enable_interrupts()', 'disable_interrupts()', 'push_status()', 'pull_status()'}
STRUCTURAL = {'break', 'continue', 'while True:', 'else:', 'pass'}
REGISTERS = {'a', 'x', 'y', 'sp', 'pc', 'carry', 'zero', 'sign', 'overflow', 'interrupt', 'decimal', 'brk', 'unused'}
KEYWORDS = {'if', 'else', 'elif', 'while', 'True', 'not', 'and', 'or', 'return', 'break', 'continue', 'pass', 'label', 'goto', 'return_from_interrupt'}
CLOSERS = {'if', 'call', 'return', 'jump', 'dispatch', 'rti'}
MAX_INLINE_DEPTH = 8


def archive(target, data):
    if target.exists():
        old = target.read_bytes()
        if old == data:
            return
        folder = ROOT.parent / (ROOT.name + '-generated-history')
        folder.mkdir(exist_ok=True)
        kept = folder / f'{target.name}.{hashlib.sha256(old).hexdigest()}'
        if kept.exists():
            assert kept.read_bytes() == old, f'archive collision {kept}'
        else:
            with open(kept, 'xb') as f:
                f.write(old)
    target.write_bytes(data)


def close_bracket(text, start):
    depth, j = 1, start
    while depth:
        depth += text[j] in '(['
        depth -= text[j] in ')]'
        j += 1
    return j


def split_args(text):
    args, depth, current = [], 0, ''
    for ch in text:
        if ch == ',' and depth == 0:
            args.append(current.strip()); current = ''
            continue
        depth += ch in '(['
        depth -= ch in ')]'
        current += ch
    if current.strip():
        args.append(current.strip())
    return args


def classify(text, routine_names):
    if text == '':
        return 'blank'
    if re.fullmatch(IDENT + r': (?:int|bool) = .+', text):
        return 'structural'
    if text in STRUCTURAL or re.fullmatch(r'label \w+:', text) or re.fullmatch(r'goto \w+', text) or re.fullmatch(r'fall_into\(\w+\)', text) or re.fullmatch(r'machine_span\(\w+\)', text):
        return 'structural'
    if text.startswith('elif ') and text.endswith(':'):
        return 'structural'
    if text.startswith('if ') and text.endswith(':'):
        return 'if'
    if text == 'return_from_interrupt':
        return 'rti'
    tail_call = re.fullmatch(r'return (' + IDENT + r')\(.*\)', text)
    if tail_call and tail_call[1] in routine_names:
        return 'structural'
    if text == 'return' or text.startswith(('return ', 'return_values(')):
        return 'return'
    if re.fullmatch(r'jump\(indirect_word\(0x[0-9a-f]+\)\)', text):
        return 'dispatch'
    if re.fullmatch(r'jump\(\w+\)', text):
        return 'jump'
    if text in PRIMITIVES or re.fullmatch(r'set_stack_pointer\(.+\)', text):
        return 'primitive'
    if re.fullmatch(r'push\(.+\)', text):
        return 'push'
    m = re.fullmatch(r'(' + IDENT + r')\((.*)\)', text)
    if m and m[1] in routine_names:
        return 'call'
    result_call = re.fullmatch(r'(' + IDENT + r'(?:, ' + IDENT + r')*) = (' + IDENT + r')\(.*\)', text)
    if result_call and result_call[2] in routine_names:
        return 'unpack'
    if re.fullmatch(r'(ram|' + IDENT + r')\[.+\](\.' + IDENT + r')? = .+', text) or ASSIGN.fullmatch(text):
        return 'exec'
    if re.fullmatch(r'(' + IDENT + r'(, ' + IDENT + r')+) = ' + IDENT + r'\(.*\)', text):
        return 'unpack'
    raise SyntaxError(f'not a statement of the modern source language: {text!r}')


def parse_modern(text, routine_names):
    lines = text.split('\n')
    header, records, i = [], {}, 0
    while i < len(lines) and not lines[i].startswith('def '):
        rm = RECORD.fullmatch(lines[i])
        if rm:
            records[rm[2]] = dict(kv.split('=') for kv in rm[3].split(', '))
            if rm[1] == 'view':
                records[rm[2]][''] = True
        else:
            header.append(lines[i])
        i += 1
    routines, helpers, order = {}, {}, []
    while i < len(lines):
        start = i; i += 1
        while i < len(lines) and not lines[i].startswith('def '):
            i += 1
        block = lines[start:i]
        m = DEF.fullmatch(block[0])
        if not m:
            raise SyntaxError(f'invalid def line: {block[0]}')
        name, params = m[1], [p for p in m[2].split(', ') if p]
        if name in routine_names:
            routines[name] = (params, block[1:])
            order.append(name)
        else:
            helpers[name] = (params, [l for l in block[1:] if l.strip()])
    return header, records, helpers, routines, order


def substitute(text, params, args):
    values = {}
    for p, a in zip(params, args):
        atom = re.fullmatch(r'[A-Za-z_]\w*|0x[0-9a-f]+|\d+', a) is not None
        values[p] = a if atom else f'({a})'
    if not values:
        return text
    return re.sub(r'(?<![A-Za-z0-9_.])(' + '|'.join(map(re.escape, values)) + r')(?![A-Za-z0-9_]|=(?!=))', lambda m: values[m[1]], text)


def substitute_statement(line, params, args):
    am = re.fullmatch(r'(' + IDENT + r'|(?:ram|' + IDENT + r')\[.+\]) = (.+)', line)
    if not am:
        return substitute(line, params, args)
    target, rhs = am[1], am[2]
    bm = re.fullmatch(r'(' + IDENT + r')\[(.+)\]', target)
    if bm:
        target = f'{bm[1]}[{substitute(bm[2], params, args)}]'
    return f'{target} = {substitute(rhs, params, args)}'


def inline_expressions(text, helpers):
    expression_helpers = {n: h for n, h in helpers.items() if len(h[1]) == 1 and h[1][0].strip().startswith('return ')}
    if not expression_helpers:
        return text
    pattern = re.compile(r'(?<![A-Za-z0-9_.])(' + '|'.join(map(re.escape, expression_helpers)) + r')\(')
    for _ in range(MAX_INLINE_DEPTH):
        m = pattern.search(text)
        if not m:
            return text
        name = m[1]
        j = close_bracket(text, m.end())
        args = split_args(text[m.end():j - 1])
        params, body = expression_helpers[name]
        if len(args) != len(params):
            raise SyntaxError(f'{name}() takes {len(params)} arguments, got {len(args)}: {text}')
        result = body[0].strip()[7:]
        result_tree = ast.parse(result, mode='eval')
        for param, arg in zip(params, args):
            uses = sum(isinstance(n, ast.Name) and n.id == param for n in ast.walk(result_tree))
            argument = ast.parse(arg, mode='eval')
            stateful = any(isinstance(n, (ast.Subscript, ast.Attribute)) or isinstance(n, ast.Call) and not (isinstance(n.func, ast.Name) and n.func.id == 'int') for n in ast.walk(argument))
            if stateful and (uses != 1 or len(params) != 1 or any(isinstance(n, (ast.BoolOp, ast.IfExp, ast.Subscript, ast.Attribute, ast.Call)) for n in ast.walk(result_tree))):
                raise SyntaxError(f'{name}: materialize stateful argument {param} in a local before calling this expression helper; argument evaluation must occur once')
        text = text[:m.start()] + '(' + substitute(body[0].strip()[7:], params, args) + ')' + text[j:]
    raise SyntaxError(f'helper inlining did not terminate in {text!r}')


def bound_locals(lines):
    names = set()
    for line in lines:
        assignment = re.match(r'^(' + IDENT + r'(?:, ' + IDENT + r')*)(?:: (?:int|bool))? = ', line.strip())
        if assignment:
            names.update(assignment[1].split(', '))
        loop = re.match(r'^for (' + IDENT + r') in ', line.strip())
        if loop:
            names.add(loop[1])
    return names


def inline_statements(items, helpers, routine_names):
    statement_helpers = {n: h for n, h in helpers.items() if not (len(h[1]) == 1 and h[1][0].strip().startswith('return '))}
    occupied = set(re.findall(r'\b\w+\b', '\n'.join(t for _, t in items)))
    mutable = {match[1] for _, text in items if (match := re.match(r'(' + IDENT + r'): (?:int|bool) = ', text))}
    instance = 0
    for _ in range(MAX_INLINE_DEPTH):
        mutable |= {match[1] for _, text in items if (match := re.match(r'(' + IDENT + r'): (?:int|bool) = ', text))}
        out, expanded = [], False
        for indent, text in items:
            tail_call = text.startswith('return ')
            call_text = text[7:] if tail_call else text
            m = re.fullmatch(r'(?:(.+) = )?(' + IDENT + r')\((.*)\)', call_text)
            if m and m[2] in statement_helpers:
                target, helper = m[1], m[2]
                if helper in routine_names:
                    raise SyntaxError(f'{helper} is both a routine and a helper')
                params, body = statement_helpers[helper]
                args = split_args(m[3])
                if len(args) != len(params):
                    raise SyntaxError(f'{helper}() takes {len(params)} arguments, got {len(args)}')
                result = None
                local_return = not tail_call and any(line.strip().startswith('return') for line in (body[:-1] if target is not None else body))
                if target is not None:
                    targets = split_args(target)
                    if any(not re.fullmatch(IDENT, name) for name in targets) or not body[-1].strip().startswith('return ') or len(body[-1]) - len(body[-1].lstrip()) != min(len(line) - len(line.lstrip()) for line in body):
                        raise SyntaxError(f'{helper}: a value helper needs local targets and a final return expression')
                    result = split_args(body[-1].strip()[7:])
                    if len(result) != len(targets):
                        raise SyntaxError(f'{helper}: {len(result)} results cannot bind {len(targets)} targets')
                    if local_return:
                        result = None
                    else:
                        body = body[:-1]
                locals_ = bound_locals(body)
                labels = {lm[1] for line in body if (lm := re.fullmatch(r'label (\w+):', line.strip()))}
                if locals_ & set(params):
                    raise SyntaxError(f'{helper}: helper parameters are immutable; assign a new local instead of {sorted(locals_ & set(params))}')
                renamed = {}
                for local in sorted(locals_ | labels):
                    candidate = f'inline_{instance}_{local}'
                    while candidate in occupied:
                        instance += 1
                        candidate = f'inline_{instance}_{local}'
                    renamed[local] = candidate
                    occupied.add(candidate)
                captured = []
                for parameter, argument in zip(params, args):
                    local = f'inline_{instance}_argument_{parameter}'
                    while local in occupied:
                        local += '_copy'
                    occupied.add(local)
                    captured.append(local)
                    out.append((indent, f'{local}: int = {argument}'))
                args = captured
                exit_label = f'inline_{instance}_return'
                while exit_label in occupied:
                    exit_label += '_end'
                occupied.add(exit_label)
                instance += 1
                base = len(body[0]) - len(body[0].lstrip())
                return_number = 0
                for line in body:
                    scoped = line.strip() if line.strip().startswith('machine_span(') else apply_renames(line.strip(), renamed)
                    level = indent + (len(line) - len(line.lstrip())) - base
                    rendered = substitute_statement(scoped, params, args)
                    if local_return and (rendered == 'return' or rendered.startswith('return ')):
                        values = split_args(rendered[7:])
                        destinations = targets if target is not None else []
                        if len(values) != len(destinations):
                            raise SyntaxError(f'{helper}: local return provides {len(values)} values for {len(destinations)} targets')
                        snapshots = []
                        for n, value in enumerate(values):
                            snapshot = f'{exit_label}_{return_number}_{n}'
                            while snapshot in occupied:
                                snapshot += '_copy'
                            occupied.add(snapshot)
                            out.append((level, f'{snapshot}: int = {value}'))
                            snapshots.append(snapshot)
                        out.extend((level, f'{destination}: int = {snapshot}') for destination, snapshot in zip(destinations, snapshots))
                        out.append((level, f'goto {exit_label}'))
                        return_number += 1
                    else:
                        out.append((level, rendered))
                if local_return:
                    out.append((indent, f'label {exit_label}:'))
                if result is not None:
                    for target, expression in zip(targets, result):
                        expr = substitute(apply_renames(expression, renamed), params, args)
                        out.append((indent, f'{target}: int = {expr}' if target in mutable else f'bind {target} = {expr}'))
                expanded = True
                continue
            out.append((indent, text))
        items = out
        if not expanded:
            return items
    raise SyntaxError('statement helper inlining did not terminate')


def lower_records(text, records):
    for rec, fields in records.items():
        if '' in fields:
            pattern = re.compile(r'(?<![A-Za-z0-9_.])' + re.escape(rec) + r'\.(' + IDENT + r')')
            def scalar(match):
                if match[1] not in fields:
                    raise SyntaxError(f'view {rec} has no field {match[1]}')
                return f'ram[{fields[match[1]]}]'
            text = pattern.sub(scalar, text)
            continue
        pattern = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(rec) + r'\[')
        while True:
            m = pattern.search(text)
            if not m:
                break
            j = close_bracket(text, m.end())
            fm = re.match(r'\.(' + IDENT + ')', text[j:])
            if not fm:
                raise SyntaxError(f'{rec}[...] must be followed by a field: {text}')
            if fm[1] not in fields:
                raise SyntaxError(f'record {rec} has no field {fm[1]}: {text}')
            text = text[:m.start()] + f'{fields[fm[1]]}[{text[m.end():j - 1]}]' + text[j + fm.end():]
    return text


def lower_elif(items):
    for _ in range(4096):
        idx = next((k for k, (_, t) in enumerate(items) if t.startswith('elif ') and t.endswith(':')), None)
        if idx is None:
            return items
        indent, text = items[idx]
        end = idx + 1
        while end < len(items):
            other_indent, other = items[end]
            if other == '' or other_indent > indent or (other_indent == indent and (other == 'else:' or (other.startswith('elif ') and other.endswith(':')))):
                end += 1
                continue
            break
        items = items[:idx] + [(indent, 'else:'), (indent + 4, 'if ' + text[5:])] + [(i + 4, t) for i, t in items[idx + 1:end]] + items[end:]
    raise SyntaxError('elif lowering did not terminate')


def inline_result_aliases(items):
    out, aliases = [], {}
    for index, (indent, text) in enumerate(items):
        binding = re.fullmatch(r'bind (' + IDENT + r') = (.+)', text)
        if binding:
            target, expr = binding[1], substitute(binding[2], list(aliases), list(aliases.values()))
            tree = ast.parse(expr, mode='eval')
            if any(isinstance(n, (ast.Subscript, ast.Attribute)) for n in ast.walk(tree)):
                raise SyntaxError(f'{target}: an inline result must be pure; materialize memory reads inside its helper')
            dependencies = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
            if dependencies & REGISTERS:
                raise SyntaxError(f'{target}: an inline result cannot capture mutable machine registers')
            uses = [j for j in range(index + 1, len(items)) if re.search(r'\b' + re.escape(target) + r'\b', items[j][1])]
            if any(isinstance(n, ast.Call) and not (isinstance(n.func, ast.Name) and n.func.id == 'int') for n in ast.walk(tree)):
                raise SyntaxError(f'{target}: an inline result cannot defer a side-effecting call')
            for _, future in items[index + 1:max(uses, default=index) + 1]:
                assignment = ASSIGN.fullmatch(future)
                if assignment and assignment[1] in dependencies | {target}:
                    raise SyntaxError(f'{target}: inline result captures {assignment[1]}, which changes before its last use; use a fresh local')
            aliases[target] = expr
            continue
        out.append((indent, substitute_statement(text, list(aliases), list(aliases.values()))))
    return out


def lower_byte_loops(items):
    occupied = set(re.findall(r'\b\w+\b', '\n'.join(t for _, t in items)))
    serial = 0

    def lower(part):
        nonlocal serial
        out, index = [], 0
        while index < len(part):
            indent, text = part[index]
            loop = re.fullmatch(r'for (' + IDENT + r') in (.+):', text)
            if not loop:
                out.append((indent, text))
                index += 1
                continue
            expression = ast.parse(loop[2], mode='eval').body
            if not isinstance(expression, ast.Call) or not isinstance(expression.func, ast.Name):
                raise SyntaxError('timed for loops require a byte-slot iterator')
            iterator = expression.func.id
            local_iterator = iterator == 'reverse_byte_values'
            if local_iterator and len(expression.args) == 1:
                counter, count, lower_bound = loop[1], ast.unparse(expression.args[0]), None
            elif iterator == 'byte_slots' and len(expression.args) in (2, 3):
                counter, count = map(ast.unparse, (expression.args[0], expression.args[1]))
                lower_bound = ast.unparse(expression.args[2]) if len(expression.args) == 3 else None
            elif iterator == 'remaining_byte_slots' and len(expression.args) == 1:
                counter, count, lower_bound = ast.unparse(expression.args[0]), None, None
            else:
                raise SyntaxError('use byte_slots(counter, count[, lower_bound]), remaining_byte_slots(counter), or reverse_byte_values(count)')
            cell = expression.args[0]
            if not local_iterator and isinstance(cell, ast.Subscript) and not (isinstance(cell.value, ast.Name) and isinstance(cell.slice, ast.Constant) and isinstance(cell.slice.value, int)):
                raise SyntaxError('a byte-slot cell reference requires a fixed array index; volatile or mutable indices are not repeated')
            counter_ref = counter if local_iterator or isinstance(cell, ast.Subscript) else f'ram[{counter}]'
            end = index + 1
            while end < len(part) and (not part[end][1] or part[end][0] > indent):
                end += 1
            step, epilogue = f'loop_step_{serial}', f'loop_epilogue_{serial}'
            serial += 1
            while step in occupied or step + '_readback' in occupied or epilogue in occupied:
                step += '_next'
                epilogue += '_next'
            occupied.update((step, step + '_readback', epilogue))
            nested, body, has_continue = [], [], False
            for level, statement in part[index + 1:end]:
                if statement:
                    while nested and level <= nested[-1]:
                        nested.pop()
                    if statement == 'continue' and not nested:
                        statement = f'goto {epilogue}'
                        has_continue = True
                    if statement.startswith(('while ', 'for ')):
                        nested.append(level)
                body.append((level, statement))
            if count is not None:
                out.append((indent, f'{counter_ref} = (({count}) - 1) & 0xff'))
            out.append((indent, 'while True:'))
            if not local_iterator:
                out.append((indent + 4, f'{loop[1]} = {counter_ref}'))
            out.extend(lower(body))
            if has_continue:
                out.append((indent + 4, f'label {epilogue}:'))
            if local_iterator:
                step = loop[1]
                out.append((indent + 4, f'{step} = ({step} - 1) & 0xff'))
            else:
                out.extend([(indent + 4, f'{step} = ({counter_ref} - 1) & 0xff'), (indent + 4, f'{counter_ref} = {step}')])
            if lower_bound is None:
                out.append((indent + 4, f'if {step} & 0x80:'))
            else:
                out.extend([(indent + 4, f'{step}_readback = {counter_ref}'), (indent + 4, f'if {step}_readback == (({lower_bound}) - 1) & 0xff:')])
            out.extend([(indent + 8, 'break'), (indent + 4, 'continue')])
            index = end
        return out

    return lower(items)


def lower_guard_conjunctions(items):
    out, index = [], 0
    while index < len(items):
        indent, text = items[index]
        if text.startswith('if ') and text.endswith(':'):
            condition = ast.parse(text[3:-1], mode='eval').body
            negated = isinstance(condition, ast.UnaryOp) and isinstance(condition.op, ast.Not)
            conjunction = condition.operand if negated else condition
            if isinstance(condition, ast.BoolOp) and isinstance(condition.op, ast.Or):
                end = index + 1
                while end < len(items) and (not items[end][1] or items[end][0] > indent):
                    end += 1
                body = lower_guard_conjunctions(items[index + 1:end])
                otherwise = None
                if end < len(items) and items[end] == (indent, 'else:'):
                    stop = end + 1
                    while stop < len(items) and (not items[stop][1] or items[stop][0] > indent):
                        stop += 1
                    otherwise = lower_guard_conjunctions(items[end + 1:stop])
                    end = stop
                for depth, value in enumerate(condition.values):
                    out.append((indent + depth * 4, 'if ' + ast.unparse(value) + ':'))
                    out.extend((level + depth * 4, line) for level, line in body)
                    if depth + 1 < len(condition.values) or otherwise is not None:
                        out.append((indent + depth * 4, 'else:'))
                if otherwise is not None:
                    out.extend((level + (len(condition.values) - 1) * 4, line) for level, line in otherwise)
                index = end
                continue
            if isinstance(conjunction, ast.BoolOp) and isinstance(conjunction.op, ast.And):
                end = index + 1
                while end < len(items) and (not items[end][1] or items[end][0] > indent):
                    end += 1
                if end < len(items) and items[end] == (indent, 'else:'):
                    raise SyntaxError('a conjunction with an else arm needs explicit nested conditions in the timed source')
                body = lower_guard_conjunctions(items[index + 1:end])
                if negated:
                    meaningful = [(level, value) for level, value in body if value]
                    if not meaningful or meaningful[-1][0] != indent + 4 or not re.fullmatch(r'goto .+|return(?: .*)?|break|continue', meaningful[-1][1]):
                        raise SyntaxError('a negated conjunction guard must unconditionally leave its branch')
                    for value in conjunction.values:
                        out.append((indent, 'if not (' + ast.unparse(value) + '):'))
                        out.extend(body)
                else:
                    for depth, value in enumerate(conjunction.values):
                        out.append((indent + depth * 4, 'if ' + ast.unparse(value) + ':'))
                    out.extend((level + (len(conjunction.values) - 1) * 4, value) for level, value in body)
                index = end
                continue
        out.append((indent, text))
        index += 1
    return out


def expand(body, records, helpers, routine_names):
    items = [((len(l) - len(l.lstrip())), l.strip()) for l in body]
    items = lower_elif(items)
    items = inline_statements(items, helpers, routine_names)
    items = lower_elif(items)
    items = [(indent, inline_expressions(lower_records(text, records), helpers)) for indent, text in items]
    return lower_guard_conjunctions(lower_byte_loops(inline_result_aliases(items)))


def lower_call(text, params_of):
    tail = text.startswith('return ')
    cm = re.fullmatch(r'(' + IDENT + r')\((.*)\)', text[7:] if tail else text)
    if not cm or cm[1] not in params_of:
        return text
    target, params = cm[1], params_of[cm[1]]
    by_reg = {}
    for a in split_args(cm[2]):
        key, expr = a.split('=', 1)
        tree = ast.parse(expr, mode='eval')
        if any(isinstance(node, (ast.Subscript, ast.Attribute)) or isinstance(node, ast.Name) and node.id in REGISTERS or isinstance(node, ast.Call) and not (isinstance(node.func, ast.Name) and node.func.id == 'int') for node in ast.walk(tree)):
            raise SyntaxError(f'{target}(): materialize argument {key} in a timed source local; call bindings may not re-evaluate memory, machine registers, or side effects')
        reg = params.get(key, key)
        if reg not in ('a', 'x', 'y', 'carry'):
            raise SyntaxError(f'{target}() has no parameter {key}: {text}')
        if reg in by_reg:
            raise SyntaxError(f'{target}() binds {reg} twice: {text}')
        by_reg[reg] = expr
    verb = 'fall_into' if tail else 'call'
    return f'{verb}({target}' + ''.join(f', {register}={expression}' for register, expression in by_reg.items()) + ')'


def lower_return(text, name, results):
    if not text.startswith('return '):
        if results is not None:
            raise SyntaxError(f'{name}: every return must provide its {len(results)} declared results')
        return text
    parts = split_args(text[7:])
    if results is None:
        if len(parts) != 1:
            raise SyntaxError(f'{name}: tuple results require an explicit output ABI; no result may be silently dropped')
        return text
    if len(parts) != len(results):
        raise SyntaxError(f'{name}: expected {len(results)} return values, got {len(parts)}')
    for expression in parts:
        tree = ast.parse(expression, mode='eval')
        if any(isinstance(node, (ast.Subscript, ast.Attribute)) or isinstance(node, ast.Call) and not (isinstance(node.func, ast.Name) and node.func.id == 'int') for node in ast.walk(tree)):
            raise SyntaxError(f'{name}: materialize memory reads before returning; timed output expressions must be pure')
    bindings = [(register, expression) for group, expression in zip(results, parts) for register in group]
    if len({register for register, _ in bindings}) != len(bindings):
        raise SyntaxError(f'{name}: a return ABI binds the same output twice')
    if any(register not in ('a', 'x', 'y', 'zero', 'carry', 'negative', 'overflow') for register, _ in bindings):
        raise SyntaxError(f'{name}: unknown output in return ABI')
    return 'return_values(' + ', '.join(f'{"+".join(group)}={expression}' for group, expression in zip(results, parts)) + ')'


def source_subexpression(text, recipe, aliases, names):
    if text.startswith('if ') and text.endswith(':'):
        expression, offset = text[3:-1], 3
    elif text.startswith('return '):
        expression, offset = text[7:], 7
    elif ' = ' in text:
        offset = text.index(' = ') + 3
        expression = text[offset:]
    else:
        expression, offset = text, 0
    def normalized(node, seen=frozenset()):
        if isinstance(node, ast.Name) and node.id in aliases:
            if node.id in seen:
                raise SyntaxError('cyclic source-local alias in schedule matching')
            return normalized(ast.parse(aliases[node.id], mode='eval').body, seen | {node.id})
        if isinstance(node, ast.AST):
            return (type(node).__name__, tuple((key, normalized(value, seen)) for key, value in ast.iter_fields(node)))
        if isinstance(node, list):
            return tuple(normalized(value, seen) for value in node)
        return node
    wanted = normalized(ast.parse(apply_renames(recipe, names), mode='eval').body)
    tree = ast.parse(expression, mode='eval')
    matches = [node for node in ast.walk(tree) if hasattr(node, 'col_offset') and normalized(node) == wanted]
    if not matches:
        return None
    node = min(matches, key=lambda item: item.col_offset)
    start, stop = offset + node.col_offset, offset + node.end_col_offset
    return start, stop, text[start:stop]


def emit_routine(name, table, params, body, records, helpers, routine_names, symbols, outputs, effect_refs, annotations, results_of, params_of):
    items = expand(body, records, helpers, routine_names)
    slots, out, cursor = table['slots'], [], 0
    mapping = {old: new for (old, _), new in zip(table['params'], params)}
    source_names = dict(mapping)
    aliases = {match[1]: match[2] for _, line in items if (match := re.fullmatch(r'(inline_\w+_argument_\w+): int = (.+)', line))}
    assigned = set(params) | bound_locals([text for _, text in items])
    if any(n.startswith('abi__') for n in assigned):
        raise SyntaxError(f'{name}: abi__ names are reserved for generated register bindings')
    binding_names = {slot['lhs']: 'abi__' + slot['lhs'] for slot in slots if slot['lhs'] is not None}
    binding_names.update({ASSIGN.fullmatch(line)[1]: 'abi__' + ASSIGN.fullmatch(line)[1] for slot in slots for line in slot['free']})
    binds_at = {}
    for old, new in mapping.items():
        if old in binding_names:
            out.append((4, f'{binding_names[old]} = {new}', False))
    mapping.update(binding_names)
    indent = last = 4
    free = []
    used = set()
    anchors, positions = {}, {}
    for anchor in table.get('control_anchors', []):
        key = (anchor['slot'], anchor['kind'], anchor['ordinal'])
        anchors.setdefault(key, []).append(anchor)

    def emit_anchors(kind, level):
        key = (cursor, kind)
        ordinal = positions.get(key, 0)
        positions[key] = ordinal + 1
        for anchor in anchors.get((cursor, kind, ordinal), []):
            span = anchor['span']
            if span not in table['machine_spans'] or span in used and any(not AT.fullmatch(text) for _, text in table['machine_spans'][span]):
                raise SyntaxError(f'{name}: only timing-only anchors can be shared across control edges: {span}')
            used.add(span)
            for delta, instruction in table['machine_spans'][span]:
                out.append((max(4, level + anchor['indent'] + delta), instruction, True))

    for indent, text in items:
        kind = classify(text, routine_names)
        if kind != 'blank' and not re.fullmatch(IDENT + r': (?:int|bool) = .+', text) and not text.startswith('machine_span('):
            emit_anchors(text.split('(', 1)[0].split(' ', 1)[0] if kind == 'structural' else kind, indent)
        if kind == 'blank':
            out.append((0, '', False))
            continue
        if kind == 'structural':
            declaration = re.fullmatch(r'(' + IDENT + r'): (?:int|bool) = (.+)', text)
            if declaration:
                tree = ast.parse(declaration[2], mode='eval')
                if any(isinstance(node, (ast.Subscript, ast.Attribute)) or isinstance(node, ast.Call) and not (isinstance(node.func, ast.Name) and node.func.id == 'int') or isinstance(node, ast.Name) and node.id in REGISTERS for node in ast.walk(tree)):
                    raise SyntaxError(f'{name}: source-local {declaration[1]} must use pure source values; memory and machine-state reads need a timed statement')
            msm = re.fullmatch(r'machine_span\((\w+)\)', text)
            if msm:
                if msm[1] not in table['machine_spans']:
                    raise SyntaxError(f'{name}: machine_span({msm[1]}) is not a ROM span of this routine')
                if msm[1] in used and any(not AT.fullmatch(text) for _, text in table['machine_spans'][msm[1]]):
                    raise SyntaxError(f'{name}: only timing-only spans can be shared across control edges: {msm[1]}')
                used.add(msm[1])
                for delta, machine in table['machine_spans'][msm[1]]:
                    out.append((max(4, indent + delta), machine, True))
                continue
            out.append((indent, text, False))
            continue
        if free:
            if kind != 'exec':
                raise SyntaxError(f'{name}: {text!r} follows a call outside any ROM span, where only a register read can go')
            out.append((indent, text, False))
            original = ASSIGN.fullmatch(free.pop(0))
            current = ASSIGN.fullmatch(text)
            if current is None:
                raise SyntaxError(f'{name}: a call output needs a local binding, got {text}')
            out.append((indent, f'{binding_names[original[1]]} = {current[1]}', False))
            continue
        while cursor < len(slots) and kind != 'exec' and slots[cursor]['k'] == 'exec' and slots[cursor].get('match') and slots[cursor]['lhs']:
            slot = slots[cursor]
            matched = source_subexpression(text, slot['match'], aliases, source_names)
            if matched is None:
                break
            start, stop, expression = matched
            local = f'normalized_{cursor}_{slot["lhs"]}'
            while local in assigned:
                local += '_value'
            assigned.add(local)
            source_names[slot['lhs']] = local
            for delta, machine in slot['lead']:
                out.append((max(4, indent + delta), machine, True))
            binds_at[len(out)] = binding_names[slot['lhs']]
            out.append((indent, f'{local} = {expression}', False))
            for delta, machine in slot['post']:
                out.append((max(4, indent + delta), machine, True))
            text = text[:start] + local + text[stop:]
            last = indent
            cursor += 1
        texts, captures = [text], []
        if kind == 'unpack':
            um = re.fullmatch(r'(.+) = ((' + IDENT + r')\(.*\))', text)
            targets = [t.strip() for t in um[1].split(',')]
            groups = results_of[um[3]]
            if len(targets) != len(groups):
                raise SyntaxError(f'{name}: {um[3]} returns {len(groups)} values, not {len(targets)}')
            captures = [(target, group[0]) for target, group in zip(targets, groups)]
            texts = [um[2]]
            kind = 'call'
        for k, piece in enumerate(texts):
            piece_kind = kind if k == 0 else 'exec'
            if cursor >= len(slots):
                raise SyntaxError(f'{name}: more statements than the ROM instruction schedule holds ({len(slots)}); the extra statement is {piece!r}')
            slot = slots[cursor]
            if slot['k'] != piece_kind:
                raise SyntaxError(f'{name}: statement {cursor} is {piece_kind} ({piece!r}) but the ROM schedules a {slot["k"]} there')
            if piece_kind == 'return':
                piece = lower_return(piece, name, table.get('results'))
            am = ASSIGN.fullmatch(piece)
            for delta, machine in slot['lead']:
                out.append((max(4, indent + delta), machine, True))
            if slot['lhs'] is not None and am is not None:
                binds_at[len(out)] = binding_names[slot['lhs']]
                source_names[slot['lhs']] = am[1]
            out.append((indent, piece, False))
            for delta, machine in slot['post']:
                out.append((max(4, indent + delta), machine, True))
            free = list(slot['free'])
            last = indent
            cursor += 1
        if captures:
            for target, register in captures:
                value = register if register in ('a', 'x', 'y') else 'returned_' + register
                out.append((indent, f'{target} = {value}', False))
            for line in free:
                output = ASSIGN.fullmatch(line)
                if output[2] not in ('a', 'x', 'y', 'returned_zero', 'returned_carry', 'returned_negative', 'returned_overflow'):
                    raise SyntaxError(f'{name}: non-register call-output recipe {line!r}')
                out.append((indent, f'{binding_names[output[1]]} = {output[2]}', False))
            free = []
            while cursor < len(slots) and slots[cursor]['k'] == 'exec' and slots[cursor]['reg'] is not None:
                output = slots[cursor]
                for delta, machine in output['lead']:
                    out.append((max(4, indent + delta), machine, True))
                binds_at[len(out)] = binding_names[output['lhs']]
                target = next((target for target, register in captures if register == output['reg']), binding_names[output['lhs']])
                out.append((indent, f'{target} = {output["reg"]}', False))
                for delta, machine in output['post']:
                    out.append((max(4, indent + delta), machine, True))
                cursor += 1
    emit_anchors('end', 4)
    dropped = sorted(set(table['machine_spans']) - used)
    if dropped:
        raise SyntaxError(f'{name}: timing anchors {dropped} were not placed by the current source control flow; recalibrate the changed control edges')
    if cursor != len(slots):
        raise SyntaxError(f'{name}: {cursor} statements but the ROM instruction schedule was generated for {len(slots)}; statements cannot be added or removed here (edit expressions, names, constants and helper bodies; a new statement needs a new ROM schedule from lift.py)')
    for delta, machine in table['tail']:
        out.append((max(4, last + delta), machine, True))
    renames = {old: new for old, new in mapping.items() if old != new}
    out = [(i, apply_renames(t, renames) if m else t, m) for i, t, m in out]
    out = inline_late_captures(name, out, [re.sub(r'@(\w+)', lambda m: '@' + renames.get(m[1], m[1]), text) for text in annotations], routine_names, params_of, params, binds_at)
    known = assigned | set(mapping.values()) | symbols | routine_names | KEYWORDS | REGISTERS | {'ram', 'returned_zero', 'returned_negative', 'returned_carry', 'returned_overflow'}
    known |= {m[1] for _, t, _ in out if (m := re.fullmatch(r'label (\w+):', t))}
    known |= {m[1] for _, t, _ in out if (m := ASSIGN.fullmatch(t))}
    check_machine_lines(name, out, known, {renames.get(ref, ref) for ref in effect_refs})
    check_machine_references(name, out, annotations, routine_names)
    check_names(name, out, known)
    bindings, pc, statement = {}, None, 0
    for index, (_, text, _) in enumerate(out):
        if AT.fullmatch(text):
            pc, statement = int(text[3:-1], 16), 0
            continue
        kind = classify(text, routine_names)
        if kind in ('blank', 'structural'):
            continue
        if index in binds_at:
            if pc is None:
                raise SyntaxError(f'{name}: scheduled binding outside a span: {text}')
            bindings.setdefault(pc, []).append((statement, binds_at[index]))
        if pc is not None:
            statement += 1
        if kind in CLOSERS:
            pc = None
    return [' ' * i + t if t else '' for i, t, _ in out], renames, bindings


def apply_renames(text, renames):
    if not renames:
        return text
    return re.sub(r'(?<![A-Za-z0-9_@.])(' + '|'.join(map(re.escape, renames)) + r')(?![A-Za-z0-9_]|=(?!=))', lambda m: renames[m[1]], text)


LOCAL = re.compile(r'(' + IDENT + r'): (?:int|bool) = (.+)')
SPAN_ENDERS = re.compile(r'goto \w+|break|continue|while True:|fall_into\(.*\)|return ' + IDENT + r'\(.*\)')
CAPTURE = re.compile(r'inline_\d+_argument_\w+')


def statement_expression(kind, text, params_of):
    if kind == 'if':
        return ast.parse(text[3:-1], mode='eval').body
    if kind == 'return':
        if text == 'return':
            return None
        if text.startswith('return_values('):
            return ast.parse(split_args(text[14:-1])[0].split('=', 1)[1], mode='eval').body
        return ast.parse(text[7:], mode='eval').body
    if kind == 'push':
        return ast.parse(text[5:-1], mode='eval').body
    if kind == 'primitive':
        sm = re.fullmatch(r'set_stack_pointer\((.+)\)', text)
        return ast.parse(sm[1], mode='eval').body if sm else None
    if kind == 'exec':
        return ast.parse(text[text.index(' = ') + 3:], mode='eval').body
    if kind == 'call':
        cm = re.fullmatch(r'(' + IDENT + r')\((.*)\)', text)
        registers = params_of.get(cm[1], {})
        by_reg = {}
        for argument in split_args(cm[2]):
            key, expression = argument.split('=', 1)
            by_reg[registers.get(key, key)] = ast.parse(expression, mode='eval').body
        return by_reg
    return None


def effect_node(root, steps, spec):
    if steps and steps[0] in ('v', 'cond'):
        node, steps = root, steps[1:]
    elif steps and re.fullmatch(r'k(?:[axy]|carry)', steps[0]):
        assert isinstance(root, dict), f'{spec}: kwarg reference into a statement that is not a call'
        if steps[0][1:] not in root:
            raise SyntaxError(f'machine effect {spec} reads call argument {steps[0][1:]}, which the current call no longer passes; keep that argument (or re-key the annotation to the argument holding the same value)')
        node, steps = root[steps[0][1:]], steps[1:]
    else:
        node = root
    assert node is not None and not isinstance(node, dict), f'{spec}: reference into a statement without a referable value'
    for step in steps:
        if step == 'predicate':
            while isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
                node = node.operand
            continue
        if isinstance(node, ast.Name):
            return None, node.id
        if step in ('l', 'r'):
            if isinstance(node, ast.BinOp):
                node = node.left if step == 'l' else node.right
            elif isinstance(node, ast.BoolOp):
                node = (ast.BoolOp(node.op, node.values[:-1]) if len(node.values) > 2 else node.values[0]) if step == 'l' else node.values[-1]
            elif isinstance(node, ast.Compare):
                assert len(node.ops) == 1, f'{spec}: chained comparison has no single l/r'
                node = node.left if step == 'l' else node.comparators[0]
            else:
                raise SyntaxError(f'effect path {spec} does not resolve in the current source')
        elif step == 'a':
            if isinstance(node, ast.UnaryOp):
                node = node.operand
            elif isinstance(node, ast.Call):
                node = node.args[0]
            else:
                raise SyntaxError(f'effect path {spec} does not resolve in the current source')
        elif step == 'idx':
            if not isinstance(node, ast.Subscript):
                raise SyntaxError(f'effect path {spec} does not resolve in the current source')
            node = node.slice
        else:
            raise SyntaxError(f'bad effect path step {step} in {spec}')
    return node, None


def derivation_shape_ok(derivation, node):
    if derivation is None:
        return True
    if derivation in ('add', 'sub'):
        return isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub))
    return isinstance(node, ast.Compare) or isinstance(node, ast.BinOp) and isinstance(node.op, ast.Sub)


def effect_timing_violations(name, out, annotations, routine_names, params_of, params, binds_at):
    by_pc = {}
    for text in annotations:
        if not text.strip():
            continue
        header = ANNOTATION.match(text)
        parts = text[header.end():].split(' ;; ')
        pc = int(header[1], 16)
        fields = dict(part.split('=', 1) for part in parts if not re.match(r'e\d+=', part))
        schedule = [] if fields['schedule'] == '' else [(int(entry.rstrip('+')), entry.endswith('+')) for entry in fields['schedule'].split(',')]
        reads = [(int(part[1:part.index('=')]), part[part.index('=') + 1:].split(':', 1)[1]) for part in parts if re.match(r'e\d+=', part)]
        reads += [(index, cross[1]) for index, entry in enumerate(fields['cycles'].split(';')) if (cross := re.search(r'\+xcross:(\S+)', entry))]
        by_pc[pc] = (len(fields['ins'].split(',')), schedule, reads)
    violations = []
    assigned_before = set(params)
    index = 0
    while index < len(out):
        text = out[index][1]
        if not AT.fullmatch(text):
            lm = LOCAL.fullmatch(text)
            am = ASSIGN.fullmatch(text) or re.fullmatch(r'(' + IDENT + r'(?:, ' + IDENT + r')+) = .+', text)
            if lm:
                assigned_before.add(lm[1])
            elif am:
                assigned_before.update(am[1].split(', '))
            if index in binds_at:
                assigned_before.add(binds_at[index])
            index += 1
            continue
        pc = int(text[3:-1], 16)
        assert pc in by_pc, f'{name}: span {pc:#06x} has no machine annotation'
        ins_count, schedule, reads = by_pc[pc]
        last = ins_count - 1
        statements, available, chunk_done, deferred = [], {}, 0, False
        span_start = index
        index += 1
        while index < len(out):
            level, text, _ = out[index]
            if AT.fullmatch(text):
                break
            kind = classify(text, routine_names)
            if kind == 'blank':
                index += 1
                continue
            if kind == 'structural':
                if SPAN_ENDERS.fullmatch(text):
                    break
                lm = LOCAL.fullmatch(text)
                if lm:
                    if deferred:
                        chunk_done, deferred = chunk_done + 1, False
                    available.setdefault(lm[1], chunk_done)
                index += 1
                continue
            position = len(statements)
            statements.append((kind, text))
            if kind in ('exec', 'push', 'primitive'):
                assert position < len(schedule), f'{name}: span {pc:#06x} has more statements than its schedule'
                chunk, after = schedule[position]
                if chunk > chunk_done:
                    chunk_done, deferred = chunk, False
                if after:
                    deferred = True
                am = ASSIGN.fullmatch(text)
                if am:
                    available.setdefault(am[1], chunk + 1 if after else chunk)
                if index in binds_at:
                    available.setdefault(binds_at[index], chunk + 1 if after else chunk)
                index += 1
                continue
            index += 1
            break
        assert len(statements) == len(schedule), f'{name}: span {pc:#06x} has {len(statements)} statements but its machine annotation schedules {len(schedule)}'
        for chunk, spec in reads:
            derivation = re.match(r'(cmp|add|sub):', spec)
            inner = spec[derivation.end():] if derivation else spec
            if inner.startswith('@'):
                names = {inner[1:]}
            else:
                sm = re.fullmatch(r's(\d+)((?:\.\w+)*)', inner)
                assert sm, f'{name}: invalid effect reference {spec} in span {pc:#06x}'
                kind, text = statements[int(sm[1])]
                node, blocked = effect_node(statement_expression(kind, text, params_of), sm[2][1:].split('.') if sm[2] else [], spec)
                if blocked is None and derivation and not derivation_shape_ok(derivation[1], node):
                    blocked = node.id if isinstance(node, ast.Name) else ''
                if blocked is not None:
                    if CAPTURE.fullmatch(blocked):
                        violations.append((pc, chunk, spec, blocked, 'shape', span_start))
                        continue
                    raise SyntaxError(f'{name}: machine effect {spec} of span {pc:#06x} needs the expression tree of the original operation at that position, but the current source has {blocked or ast.unparse(node)!r} there; keep that sub-expression inline instead of naming it in a local')
                names = {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}
            for read in names:
                if read in available and read not in assigned_before and chunk < available[read]:
                    violations.append((pc, chunk, spec, read, available[read], span_start))
                elif read not in available and read not in assigned_before and read not in symbols_never_assigned(out, read):
                    violations.append((pc, chunk, spec, read, None, span_start))
        for read in available:
            assigned_before.add(read)
    return violations


def symbols_never_assigned(out, read):
    if any(LOCAL.fullmatch(t) and LOCAL.fullmatch(t)[1] == read or ASSIGN.fullmatch(t) and ASSIGN.fullmatch(t)[1] == read for _, t, _ in out):
        return set()
    return {read}


def inline_late_captures(name, out, annotations, routine_names, params_of, params, binds_at):
    for _ in range(MAX_INLINE_DEPTH):
        violations = effect_timing_violations(name, out, annotations, routine_names, params_of, params, binds_at)
        if not violations:
            return out
        converted = False
        for pc, chunk, spec, read, available, span_start in violations:
            if not CAPTURE.fullmatch(read):
                continue
            if available == 'shape':
                chunk = 'the operation'
            position = next(i for i, (_, t, _) in enumerate(out) if (lm := LOCAL.fullmatch(t)) and lm[1] == read)
            rhs = LOCAL.fullmatch(out[position][1])[2]
            previous = next((t for _, t, _ in reversed(out[:position]) if t and not (classify(t, routine_names) == 'structural' and not LOCAL.fullmatch(t))), None)
            following = next((t for _, t, _ in out[position + 1:] if t and not LOCAL.fullmatch(t)), None)
            same_span_follows = following is not None and not AT.fullmatch(following) and not (classify(following, routine_names) == 'structural' and SPAN_ENDERS.fullmatch(following))
            if same_span_follows and previous is not None and not LOCAL.fullmatch(previous) and not AT.fullmatch(previous) and deferred_statement(out, position, annotations, routine_names):
                raise SyntaxError(f'{name}: helper argument capture {read} must run before ROM instruction {chunk} of span {pc:#06x} ({spec} reads it) but it follows a deferred-commit statement, so it cannot be inlined; materialize the argument in a timed source local earlier in the routine')
            dependencies = {n.id for n in ast.walk(ast.parse(rhs, mode='eval')) if isinstance(n, ast.Name)}
            uses = [i for i in range(position + 1, len(out)) if not out[i][2] and re.search(r'\b' + re.escape(read) + r'\b', out[i][1])]
            assert not any(re.search(r'\b' + re.escape(read) + r'\b', t) for _, t, m in out if m), f'{name}: generated backend line reads helper argument capture {read}'
            for i in range(position + 1, max(uses, default=position) + 1):
                am = ASSIGN.fullmatch(out[i][1]) or LOCAL.fullmatch(out[i][1])
                if am and am[1] in dependencies:
                    raise SyntaxError(f'{name}: helper argument capture {read} is read by {spec} of span {pc:#06x} before it runs, and its argument {am[1]} changes before the last use, so it cannot be inlined; use a fresh local for the argument')
            out = [(level, substitute_statement(text, [read], [rhs]) if i in uses else text, machine) for i, (level, text, machine) in enumerate(out)]
            out[position] = (0, '', False)
            converted = True
            break
        if not converted:
            pc, chunk, spec, read, available, _ = violations[0]
            if available is None:
                raise SyntaxError(f'{name}: machine effect {spec} of span {pc:#06x} reads {read}, which nothing before that span assigns in the current source')
            raise SyntaxError(f'{name}: machine effect {spec} after ROM instruction {chunk} of span {pc:#06x} reads {read}, which the current source assigns only after that instruction has executed (available from instruction {available}); compute the value in an earlier statement or leave the sub-expression inline instead of routing it through a late local')
    raise SyntaxError(f'{name}: capture inlining did not terminate')


def deferred_statement(out, position, annotations, routine_names):
    pc, statements = None, []
    for _, text, _ in out[:position]:
        if AT.fullmatch(text):
            pc, statements = int(text[3:-1], 16), []
            continue
        kind = classify(text, routine_names) if text else 'blank'
        if kind in ('blank', 'structural'):
            if SPAN_ENDERS.fullmatch(text or ''):
                pc = None
            continue
        statements.append(text)
        if kind in CLOSERS:
            pc = None
    if pc is None or not statements:
        return False
    for text in annotations:
        if text.strip() and int(ANNOTATION.match(text)[1], 16) == pc:
            schedule = re.search(r'schedule=([0-9,+]*)', text)[1].split(',')
            return schedule[len(statements) - 1].endswith('+')
    raise AssertionError(f'span {pc:#06x} has no machine annotation')


def build(py_path, machine_path, out_bpy):
    text, stats = build_text(py_path.read_text(), machine_path.read_text())
    archive(out_bpy, text.encode())
    return stats


def build_text(py_text, machine_text):
    machine = json.loads(machine_text)
    assert machine['version'] == 2, machine.get('version')
    header, records, helpers, routines, _ = parse_modern(py_text, set(machine['routines']))
    missing = [n for n in machine['routines'] if n not in routines]
    if missing:
        raise SyntaxError(f'routines missing from the modern source: {missing}')
    params_of, renames, bindings, out = {}, {}, {}, list(header)
    symbols = {m[1] for line in header if (m := re.fullmatch(r'(\w+) = (?:0x[0-9a-f]+|\d+)', line))}
    helper_globals = symbols | set(records) | set(helpers) | set(routines) | KEYWORDS | REGISTERS | {'ram', 'returned_zero', 'returned_negative', 'returned_carry', 'returned_overflow'}
    for helper_name, (params, body) in helpers.items():
        local_names = bound_locals(body)
        labels = {label[1] for line in body if (label := re.fullmatch(r'label (\w+):', line.strip()))}
        loop_names = {loop[1] for line in body if (loop := re.match(r'for (\w+) in ', line.strip()))}
        known = helper_globals | set(params) | local_names | labels | loop_names | {'for', 'in'}
        check_names('helper ' + helper_name, [(0, line.strip(), False) for line in body if not line.strip().startswith('machine_span(')], known)
    outputs, effect_refs, annotations = {}, {}, {}
    for entry in machine['annotations']:
        annotations.setdefault(entry['routine'], []).append(entry['text'])
        for target, spec in re.findall(r'e\d+=([a-z]+):([^ ]+)', entry['text']):
            for ref in re.findall(r'@(\w+)', spec):
                if target in ('a', 'x', 'y'):
                    outputs.setdefault(entry['routine'], set()).add(ref)
                effect_refs.setdefault(entry['routine'], set()).add(ref)
    for name, table in machine['routines'].items():
        params = routines[name][0]
        if len(params) != len(table['params']):
            raise SyntaxError(f'{name}: {len(params)} parameters but the ROM binds {len(table["params"])} register parameters')
        params_of[name] = {p: reg for p, (_, reg) in zip(params, table['params'])}
    results_of = {name: table.get('results', [['a']]) for name, table in machine['routines'].items()}
    stats = {'routines': 0, 'slots': 0, 'machine_lines': 0, 'renamed_locals': 0}
    for name, table in machine['routines'].items():
        lines, rename, routine_bindings = emit_routine(name, table, routines[name][0], routines[name][1], records, helpers, set(machine['routines']), symbols, outputs.get(name, set()), effect_refs.get(name, set()), annotations.get(name, []), results_of, params_of)
        out.append(f'def {name}({", ".join(f"{p}={reg}" for p, reg in params_of[name].items())}):')
        out.extend(lines)
        renames[name] = rename
        bindings[name] = routine_bindings
        stats['routines'] += 1
        stats['slots'] += len(table['slots'])
        stats['machine_lines'] += sum(len(s['lead']) + len(s['post']) for s in table['slots']) + len(table['tail'])
        stats['renamed_locals'] += len(rename)
    out = [' ' * (len(line) - len(line.lstrip())) + lower_call(line.strip(), params_of) if line.strip() else line for line in out]
    out.append('machine annotations:')
    for entry in machine['annotations']:
        text = entry['text']
        rename = renames.get(entry['routine'], {})
        text = re.sub(r'@(\w+)', lambda m: '@' + rename.get(m[1], m[1]), text)
        if text.strip():
            pc = int(ANNOTATION.match(text)[1], 16)
            for index, binding in bindings[entry['routine']].get(pc, []):
                text += f' ;; bind{index}={binding}'
        out.append(text)
    return '\n'.join(out), stats


def check_names(name, out, known):
    for _, line, _ in out:
        for word in re.findall(r'(?<![\w.@])([a-zA-Z_]\w*)(?![\w(\[]|\s*=(?!=))', line):
            if word not in known:
                raise SyntaxError(f'{name}: {line!r} reads {word}, which is not a parameter, a local of this routine, a constant or a label')


def check_machine_references(name, out, annotations, routine_names):
    spans, current = {}, None
    for _, text, is_machine in out:
        if AT.fullmatch(text):
            current = int(text[3:-1], 16)
            spans[current] = []
            continue
        kind = classify(text, routine_names)
        if kind in ('blank', 'structural'):
            continue
        if current is not None:
            spans[current].append((text, is_machine))
        if kind in CLOSERS:
            current = None
    for annotation in annotations:
        if not annotation.strip():
            continue
        address = int(ANNOTATION.match(annotation)[1], 16)
        statements = spans[address]
        for match in re.finditer(r'\bs(\d+)(?:\.[\w]+)*', annotation):
            index = int(match[1])
            if index >= len(statements):
                raise SyntaxError(f'{name}: annotation {match[0]} points past span {address:#06x}')
            text, is_machine = statements[index]
            if is_machine:
                raise SyntaxError(f'{name}: generated backend line {text!r} is read by annotation {match[0]} in span {address:#06x}; its value must come from the current source')


def check_machine_lines(name, out, assigned, effect_refs=frozenset()):
    source_names = set(re.findall(r'\b' + IDENT + r'\b', '\n'.join(text for _, text, generated in out if not generated)))
    known = set(assigned) | {m[1] for _, t, _ in out if (m := ASSIGN.fullmatch(t))}
    for _, line, is_machine in out:
        if not is_machine or AT.fullmatch(line) or line in PRIMITIVES:
            continue
        am = ASSIGN.fullmatch(line)
        if not am:
            raise SyntaxError(f'{name}: generated backend line {line!r} is neither a span anchor, a status op nor a local assignment')
        if am[1] in source_names:
            raise SyntaxError(f'{name}: generated backend line {line!r} clobbers a current-source binding; the source owns this value')
        if am[1] in effect_refs:
            raise SyntaxError(f'{name}: generated backend line {line!r} holds a value a machine annotation reads into a register or flag, so it is a game output and belongs in game.py')
        if re.search(r'\bcall\(|\bpush\(|\bwrite\(', am[2]):
            raise SyntaxError(f'{name}: generated backend line {line!r} writes memory or calls a routine; every game effect belongs in game.py')
        for word in re.findall(r'(?<![\w.])(' + IDENT + r')(?![\w(\[])', am[2]):
            if word not in known and word not in ('a', 'x', 'y'):
                raise SyntaxError(f'{name}: generated backend line {line!r} reads {word}, which the current source no longer assigns; rename it back or regenerate with lift.py')


def split_source(text):
    lines = text.split('\n')
    marker = lines.index('machine annotations:')
    header, body, annotations = [], lines[:marker], lines[marker + 1:]
    i = 0
    while i < len(body) and not body[i].startswith('def '):
        header.append(body[i]); i += 1
    routines = []
    while i < len(body):
        assert body[i].startswith('def '), body[i]
        start = i; i += 1
        while i < len(body) and not body[i].startswith('def '):
            i += 1
        routines.append(body[start:i])
    return header, routines, annotations


def referenced(name, lines, skip):
    pattern = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(name) + r'(?![A-Za-z0-9_])')
    return any(pattern.search(line) for j, line in enumerate(lines) if j != skip)


def split(bpy_path, out_py, out_machine):
    import subprocess
    text = bpy_path.read_text()
    header, routines, annotations = split_source(text)
    bearing = json.loads(subprocess.run([NODE, str(ROOT / 'probes/output-bearing.js'), str(bpy_path)], check=True, capture_output=True, text=True).stdout)
    keep_path = ROOT / 'keep.json'
    keep = json.loads(keep_path.read_text()) if keep_path.exists() else {}
    machine = {'version': 2, 'routines': {}, 'annotations': []}
    owner_of_pc = {}
    modern = list(header)
    line_no = len(header)
    names = {DEF.fullmatch(block[0])[1] for block in routines}
    for block in routines:
        m = DEF.fullmatch(block[0])
        machine['routines'][m[1]] = {'params': [[re.fullmatch(r'(\w+)=([axy])', p)[1], re.fullmatch(r'(\w+)=([axy])', p)[2]] for p in m[2].split(', ') if p]}
    for block in routines:
        m = DEF.fullmatch(block[0])
        name = m[1]
        params = machine['routines'][name]['params']
        param_names = {p for p, _ in params}
        def_line = line_no + 1
        bearing_lines = set(bearing.get(name, []))
        slots, tail, pending, span_open, last = [], [], [], False, 4
        spans_table = {}

        def flush(pending):
            if not pending:
                return False
            base = pending[0][0]
            first = next((t for _, t in pending if AT.fullmatch(t)), None)
            label = f'block_{first[5:9]}' if first else f'{name}_machine_{len(spans_table)}'
            assert label not in spans_table, label
            spans_table[label] = [(i - base, t) for i, t in pending]
            modern.append(' ' * base + f'machine_span({label})')
            return first is not None

        modern.append(f'def {name}({", ".join(p for p, _ in params)}):')
        for k, line in enumerate(block[1:], start=1):
            stripped = line.strip()
            indent = len(line) - len(line.lstrip()) if stripped else last
            source_line = def_line + k
            am = ASSIGN.fullmatch(stripped)
            if AT.fullmatch(stripped):
                owner_of_pc.setdefault(int(stripped[3:9], 16), name)
            backend = AT.fullmatch(stripped) is not None or stripped in SIDECAR_STATUS or (am is not None and am[1] not in param_names and not referenced(am[1], block, k) and source_line not in bearing_lines and stripped not in keep.get(name, ()))
            if backend:
                pending.append((indent, stripped))
                continue
            kind = classify(modernize(stripped, machine['routines']), names)
            if kind in ('blank', 'structural'):
                if flush(pending):
                    span_open = True
                pending = []
                modern.append(line)
                if stripped in ('break', 'continue', 'while True:', 'else:') or re.fullmatch(r'goto \w+', stripped) or re.fullmatch(r'fall_into\(\w+\)', stripped):
                    span_open = False
                continue
            lead = []
            if pending:
                cut = next((j for j, (_, t) in enumerate(pending) if AT.fullmatch(t)), None)
                if cut is None:
                    place_pending(slots, pending, tail, last)
                else:
                    place_pending(slots, pending[:cut], tail, last)
                    lead = [(i - indent, t) for i, t in pending[cut:]]
                    span_open = True
                pending = []
            if not span_open and kind == 'exec':
                slots[-1]['free'].append(stripped)
                modern.append(line)
                continue
            slots.append({'k': kind, 'lhs': am[1] if am else None, 'reg': am[2] if am and am[2] in ('a', 'x', 'y') else None, 'match': am[2] if am else None, 'lead': lead, 'post': [], 'free': []})
            last = indent
            if kind in CLOSERS:
                span_open = False
            modern.append(modernize(line, machine['routines']))
        flush(pending)
        machine['routines'][name] = {'params': params, 'slots': slots, 'tail': tail, 'machine_spans': spans_table}
        line_no += len(block)
    for line in annotations:
        if not line:
            machine['annotations'].append({'routine': None, 'text': line})
            continue
        am = ANNOTATION.match(line)
        assert am, line
        machine['annotations'].append({'routine': am[2] or owner_of_pc[int(am[1], 16)], 'text': line})
    out_machine.write_text(json.dumps(machine, indent=1))
    out_py.write_text('\n'.join(modern))
    return machine


def place_pending(slots, pending, tail, last):
    entries = [(i - last, t) for i, t in pending]
    if not entries:
        return
    if slots:
        slots[-1]['post'].extend(entries)
    else:
        tail.extend(entries)


def modernize(line, routines):
    cm = re.fullmatch(r'(\s*)call\((' + IDENT + r')((?:, [axy]=[^,]+)*)\)', line)
    if not cm:
        return line
    indent, target, args = cm[1], cm[2], [a for a in cm[3].split(', ') if a]
    reg_to_param = {reg: param for param, reg in routines[target]['params']} if target in routines else {}
    rendered = []
    for a in args:
        reg, expr = a.split('=', 1)
        rendered.append(f'{reg_to_param.get(reg, reg)}={expr}')
    return f'{indent}{target}({", ".join(rendered)})'


if __name__ == '__main__':
    command = sys.argv[1]
    if command == 'split':
        out = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT
        out.mkdir(parents=True, exist_ok=True)
        result = split(ROOT / sys.argv[2], out / 'game.py', out / 'game.machine.json')
        print(json.dumps({'routines': len(result['routines']), 'slots': sum(len(r['slots']) for r in result['routines'].values()), 'backend_lines': sum(len(s['lead']) + len(s['post']) for r in result['routines'].values() for s in r['slots']) + sum(len(r['tail']) for r in result['routines'].values())}))
    elif command == 'build':
        where = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT
        print(json.dumps(build(where / 'game.py', where / 'game.machine.json', where / 'game.bpy')))
    else:
        raise SystemExit(f'unknown command {command}')
