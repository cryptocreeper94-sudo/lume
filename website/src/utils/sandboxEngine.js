/**
 * Lume Sandbox Engine — Client-side execution simulator
 * Walks AST nodes from the Pattern Library and produces output.
 */

export function executeSandbox(astResults) {
    const output = []
    const variables = {}
    const startTime = performance.now()
    const errors = []

    for (const r of astResults) {
        if (r.type !== 'match') continue
        try {
            executeNode(r.nodeType, r.node, r.text, variables, output)
        } catch (e) {
            errors.push({ message: e.message, line: r.lineNum })
        }
    }

    return {
        output,
        variables,
        errors,
        executionTime: Math.round(performance.now() - startTime),
    }
}

function executeNode(nodeType, nodeStr, originalText, vars, output) {
    switch (nodeType) {
        case 'ShowStatement': {
            const m = nodeStr.match(/value:\s*"([^"]*)"/)
            const val = m ? resolveValue(m[1], vars) : originalText
            output.push({ type: 'log', text: val })
            break
        }
        case 'VariableDeclaration': {
            const m = nodeStr.match(/name:\s*"([^"]*)",\s*value:\s*"([^"]*)"/)
            if (m) {
                const val = isNaN(m[2]) ? m[2] : Number(m[2])
                vars[m[1]] = val
                output.push({ type: 'info', text: `→ ${m[1]} = ${val}` })
            }
            break
        }
        case 'VariableAccess': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) {
                const val = vars[m[1]] !== undefined ? vars[m[1]] : `<${m[1]}>`
                output.push({ type: 'info', text: `→ loaded ${m[1]} = ${val}` })
            }
            break
        }
        case 'CreateOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) {
                vars[m[1]] = { _type: m[1], _created: true }
                output.push({ type: 'log', text: `✓ Created ${m[1]}` })
            }
            break
        }
        case 'StoreOperation': {
            const m = nodeStr.match(/value:\s*"([^"]*)"/)
            if (m) output.push({ type: 'log', text: `✓ Saved ${m[1]}` })
            break
        }
        case 'DeleteOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) {
                delete vars[m[1]]
                output.push({ type: 'log', text: `✓ Deleted ${m[1]}` })
            }
            break
        }
        case 'UpdateOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"(?:,\s*value:\s*"([^"]*)")?/)
            if (m) {
                if (m[2]) vars[m[1]] = isNaN(m[2]) ? m[2] : Number(m[2])
                output.push({ type: 'log', text: `✓ Updated ${m[1]}${m[2] ? ` → ${m[2]}` : ''}` })
            }
            break
        }
        case 'SendOperation': {
            const m = nodeStr.match(/payload:\s*"([^"]*)"(?:,\s*target:\s*"([^"]*)")?/)
            if (m) output.push({ type: 'log', text: `📤 Sent ${m[1]}${m[2] ? ` to ${m[2]}` : ''}` })
            break
        }
        case 'BinaryExpression': {
            const m = nodeStr.match(/op:\s*"([^"]*)",\s*left:\s*"([^"]*)",\s*right:\s*"([^"]*)"/)
            if (m) {
                const left = vars[m[2]] !== undefined ? Number(vars[m[2]]) : Number(m[2])
                const right = vars[m[3]] !== undefined ? Number(vars[m[3]]) : Number(m[3])
                let result
                switch (m[1]) {
                    case '+': result = left + right; break
                    case '-': result = left - right; break
                    case '*': result = left * right; break
                    case '/': result = right !== 0 ? left / right : NaN; break
                    default: result = NaN
                }
                // Store result in the left operand variable
                if (vars[m[2]] !== undefined) vars[m[2]] = result
                output.push({ type: 'info', text: `→ ${m[2]} ${m[1]} ${m[3]} = ${result}` })
            }
            break
        }
        case 'IncrementOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)",\s*amount:\s*(\d+)/)
            if (m) {
                vars[m[1]] = (vars[m[1]] || 0) + Number(m[2])
                output.push({ type: 'info', text: `→ ${m[1]} += ${m[2]} (now ${vars[m[1]]})` })
            }
            break
        }
        case 'DecrementOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)",\s*amount:\s*(\d+)/)
            if (m) {
                vars[m[1]] = (vars[m[1]] || 0) - Number(m[2])
                output.push({ type: 'info', text: `→ ${m[1]} -= ${m[2]} (now ${vars[m[1]]})` })
            }
            break
        }
        case 'RepeatLoop': {
            const m = nodeStr.match(/count:\s*(\d+)/)
            if (m) output.push({ type: 'info', text: `🔁 Repeating ${m[1]} times...` })
            break
        }
        case 'ForEachLoop': {
            const m = nodeStr.match(/item:\s*"([^"]*)"(?:,\s*collection:\s*"([^"]*)")?/)
            if (m) output.push({ type: 'info', text: `🔁 For each ${m[1]}${m[2] ? ` in ${m[2]}` : ''}...` })
            break
        }
        case 'IfStatement': {
            const m = nodeStr.match(/condition:\s*"([^"]*)"/)
            if (m) output.push({ type: 'info', text: `❓ Checking: ${m[1]}` })
            break
        }
        case 'WhileLoop': {
            const m = nodeStr.match(/condition:\s*"([^"]*)"/)
            if (m) output.push({ type: 'info', text: `🔁 While: ${m[1]}` })
            break
        }
        case 'AskExpression': {
            const m = nodeStr.match(/prompt:\s*"([^"]*)"/)
            if (m) output.push({ type: 'ai', text: `🤖 AI: [Response to "${m[1]}"]` })
            break
        }
        case 'ReturnStatement': {
            const m = nodeStr.match(/value:\s*"([^"]*)"/)
            if (m) output.push({ type: 'result', text: `⬅ Return: ${resolveValue(m[1], vars)}` })
            break
        }
        case 'DelayStatement': {
            const m = nodeStr.match(/duration:\s*(.+)/)
            if (m) output.push({ type: 'info', text: `⏳ Waiting ${m[1]}...` })
            break
        }
        case 'NavigateOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) output.push({ type: 'log', text: `🔗 Navigate → ${m[1]}` })
            break
        }
        case 'ResetOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) {
                delete vars[m[1]]
                output.push({ type: 'log', text: `🔄 Reset ${m[1]}` })
            }
            break
        }
        case 'SwapOperation': {
            const m = nodeStr.match(/left:\s*"([^"]*)",\s*right:\s*"([^"]*)"/)
            if (m) {
                const temp = vars[m[1]]
                vars[m[1]] = vars[m[2]]
                vars[m[2]] = temp
                output.push({ type: 'log', text: `🔄 Swapped ${m[1]} ↔ ${m[2]}` })
            }
            break
        }
        case 'ToggleOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) {
                vars[m[1]] = !vars[m[1]]
                output.push({ type: 'log', text: `🔘 Toggled ${m[1]} → ${vars[m[1]]}` })
            }
            break
        }
        case 'MonitorBlock': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) output.push({ type: 'info', text: `👁 Monitoring ${m[1]}` })
            break
        }
        case 'SortOperation': {
            const m = nodeStr.match(/target:\s*"([^"]*)"/)
            if (m) output.push({ type: 'log', text: `✓ Sorted ${m[1]}` })
            break
        }
        case 'ThrowStatement': {
            const m = nodeStr.match(/message:\s*"([^"]*)"/)
            if (m) output.push({ type: 'error', text: `❌ Error: ${m[1]}` })
            break
        }
        case 'TryBlock': {
            const m = nodeStr.match(/action:\s*"([^"]*)"/)
            if (m) output.push({ type: 'info', text: `🛡 Trying: ${m[1]}` })
            break
        }
        default:
            output.push({ type: 'info', text: `→ ${nodeType}` })
    }
}

function resolveValue(val, vars) {
    // Check if it's a variable reference
    if (vars[val] !== undefined) return String(vars[val])
    // Check if parts of the value reference variables
    return val.replace(/\{(\w+)\}/g, (_, name) => vars[name] !== undefined ? vars[name] : `{${name}}`)
}

/* ── Program Storage (localStorage) ── */
const STORAGE_KEY = 'lume_programs'

export function saveProgram(name, source, mode = 'english') {
    const programs = loadPrograms()
    const existing = programs.findIndex(p => p.name === name)
    const entry = {
        id: existing >= 0 ? programs[existing].id : crypto.randomUUID(),
        name,
        source,
        mode,
        updatedAt: new Date().toISOString(),
        createdAt: existing >= 0 ? programs[existing].createdAt : new Date().toISOString(),
    }
    if (existing >= 0) programs[existing] = entry
    else programs.push(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
    return entry
}

export function loadPrograms() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
}

export function deleteProgram(id) {
    const programs = loadPrograms().filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
}

export function exportAsLume(name, source) {
    const blob = new Blob([source], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\s+/g, '_').toLowerCase()}.lume`
    a.click()
    URL.revokeObjectURL(url)
}
