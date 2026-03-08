/**
 * ====== Lume Source Map Generator ======
 * Generates source maps mapping transpiled JavaScript lines back to Lume source lines.
 * Enhanced with English Mode metadata (Gap 6): instruction, resolved_by, confidence, ast_node.
 */

export class SourceMap {
    constructor(lumeFilename) {
        this.lumeFilename = lumeFilename
        this.mappings = []  // { jsLine, lumeLine, name?, lume_instruction?, resolved_by?, confidence?, ast_node? }
    }

    addMapping(jsLine, lumeLine, name = null) {
        this.mappings.push({ jsLine, lumeLine, name })
    }

    /** Gap 6: Enhanced mapping with English Mode metadata */
    addEnhancedMapping(jsLine, lumeLine, meta = {}) {
        this.mappings.push({
            js_line: jsLine,
            lume_line: lumeLine,
            lume_instruction: meta.instruction || null,
            resolved_by: meta.resolvedBy || null,
            confidence: meta.confidence || null,
            ast_node: meta.astType || null,
            name: meta.name || null,
        })
    }

    // Resolve a JS error line back to original Lume line
    resolve(jsLine) {
        // Find closest mapping at or before the given JS line
        let best = null
        for (const m of this.mappings) {
            if (m.jsLine <= jsLine) {
                if (!best || m.jsLine > best.jsLine) {
                    best = m
                }
            }
        }
        return best
    }

    toJSON() {
        return {
            file: this.lumeFilename,
            mappings: this.mappings,
        }
    }

    toComment() {
        const data = Buffer.from(JSON.stringify(this.toJSON())).toString('base64')
        return `//# sourceMappingURL=data:application/json;base64,${data}`
    }
}

/**
 * Generate a basic source map from a Lume source and its transpiled JS output.
 * Uses comment-based line tracking embedded by the transpiler.
 */
export function generateSourceMap(lumeSource, jsOutput, filename) {
    const sm = new SourceMap(filename)
    const lumeLines = lumeSource.split('\n')
    const jsLines = jsOutput.split('\n')

    // Simple heuristic: Lume comment lines map directly
    let lumeLine = 1
    for (let i = 0; i < jsLines.length; i++) {
        const jsLine = jsLines[i]
        // Track JS lines that correspond to comment markers
        if (jsLine.match(/^\s*\/\//)) {
            // Comment — try to match to a Lume comment
            const content = jsLine.replace(/^\s*\/\/\s*/, '')
            for (let j = lumeLine - 1; j < lumeLines.length; j++) {
                if (lumeLines[j].trim().startsWith('//' + content.trim().substring(0, 20)) ||
                    lumeLines[j].trim() === content.trim()) {
                    sm.addMapping(i + 1, j + 1)
                    lumeLine = j + 1
                    break
                }
            }
        } else if (jsLine.trim().length > 0 && !jsLine.startsWith('// Generated')) {
            // Non-empty, non-header line — incrementally map
            sm.addMapping(i + 1, Math.min(lumeLine, lumeLines.length))
            lumeLine++
        }
    }

    return sm
}
