/**
 * ═══════════════════════════════════════════════════════
 *  GAP 15: Comments & Documentation
 *
 *  - Comment markers: note:, todo:, fixme:, explain:, why:, warning:, #
 *  - Multi-line explain: blocks
 *  - Inline # comments
 *  - Checked BEFORE tolerance chain
 *  - lume docs generation from explain/note blocks
 * ═══════════════════════════════════════════════════════
 */

// ── Comment Markers ──
const COMMENT_MARKERS = [
    { prefix: 'note to self:', type: 'note', jsPrefix: '// NOTE:' },
    { prefix: 'note:', type: 'note', jsPrefix: '//' },
    { prefix: 'todo:', type: 'todo', jsPrefix: '// TODO:' },
    { prefix: 'fixme:', type: 'fixme', jsPrefix: '// FIXME:' },
    { prefix: 'explain:', type: 'explain', jsPrefix: '/*' },
    { prefix: 'why:', type: 'why', jsPrefix: '// Why:' },
    { prefix: 'warning:', type: 'warning', jsPrefix: '// WARNING:' },
]

/**
 * Detect if a line is a comment (checked BEFORE tolerance chain)
 */
export function detectComment(line) {
    const trimmed = line.trim()
    if (!trimmed) return null

    // # at start of line = comment
    if (trimmed.startsWith('#') && !trimmed.startsWith('#!')) {
        return { type: 'hash', text: trimmed.slice(1).trim(), marker: '#' }
    }

    // // at start of line (already handled, but be explicit)
    if (trimmed.startsWith('//')) {
        return { type: 'line', text: trimmed.slice(2).trim(), marker: '//' }
    }

    // Check all comment markers
    for (const marker of COMMENT_MARKERS) {
        if (trimmed.toLowerCase().startsWith(marker.prefix)) {
            return {
                type: marker.type,
                text: trimmed.slice(marker.prefix.length).trim(),
                marker: marker.prefix,
                jsPrefix: marker.jsPrefix,
            }
        }
    }

    return null
}

/**
 * Parse a multi-line explain: block (continues while indented)
 */
export function parseExplainBlock(lines, startIdx) {
    const firstLine = lines[startIdx].trim()
    const match = firstLine.match(/^explain:\s*(.*)$/i)
    if (!match) return null

    const textLines = [match[1].trim()]
    let i = startIdx + 1

    while (i < lines.length) {
        const line = lines[i]
        if (!line.trim()) { i++; continue }
        if (!line.startsWith('  ') && !line.startsWith('\t')) break
        textLines.push(line.trim())
        i++
    }

    return {
        type: 'CommentNode',
        commentType: 'explain',
        text: textLines.filter(Boolean).join('\n'),
        endIdx: i,
    }
}

/**
 * Strip inline comment from a line: "instruction # comment"
 * Returns { instruction, comment }
 */
export function stripInlineComment(line) {
    // Don't strip # inside strings
    let inString = false
    let stringChar = ''
    for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (!inString && (c === '"' || c === "'")) {
            inString = true; stringChar = c; continue
        }
        if (inString && c === stringChar) {
            inString = false; continue
        }
        if (!inString && c === '#') {
            return {
                instruction: line.slice(0, i).trimEnd(),
                comment: line.slice(i + 1).trim(),
            }
        }
    }
    return { instruction: line, comment: null }
}

/**
 * Convert a comment to a JavaScript CommentNode AST
 */
export function toCommentAST(comment) {
    if (comment.type === 'explain') {
        return {
            type: 'CommentNode',
            commentType: 'explain',
            value: comment.text,
            jsOutput: `/* ${comment.text.replace(/\*\//g, '* /')} */`,
        }
    }

    const jsPrefix = comment.jsPrefix || '//'
    return {
        type: 'CommentNode',
        commentType: comment.type,
        value: comment.text,
        jsOutput: `${jsPrefix} ${comment.text}`,
    }
}

/**
 * Generate documentation markdown from source comments
 */
export function generateDocs(source, filename = 'file.lume') {
    const lines = source.split('\n')
    const docs = []
    let currentSection = null

    docs.push(`# ${filename}\n`)
    docs.push(`_Auto-generated documentation from Lume source comments._\n`)

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const comment = detectComment(line)

        if (!comment) continue

        if (comment.type === 'explain') {
            // Parse full explain block
            const block = parseExplainBlock(lines, i)
            if (block) {
                docs.push(`## ${block.text.split('\n')[0]}\n`)
                if (block.text.split('\n').length > 1) {
                    docs.push(block.text.split('\n').slice(1).join('\n'))
                    docs.push('')
                }
                i = block.endIdx - 1
            }
        } else if (comment.type === 'note') {
            docs.push(`> **Note** (line ${i + 1}): ${comment.text}\n`)
        } else if (comment.type === 'todo') {
            docs.push(`- [ ] **TODO** (line ${i + 1}): ${comment.text}`)
        } else if (comment.type === 'fixme') {
            docs.push(`- ⚠️ **FIXME** (line ${i + 1}): ${comment.text}`)
        } else if (comment.type === 'why') {
            docs.push(`> **Why** (line ${i + 1}): ${comment.text}\n`)
        } else if (comment.type === 'warning') {
            docs.push(`> ⚠️ **Warning** (line ${i + 1}): ${comment.text}\n`)
        }
    }

    if (docs.length <= 2) {
        docs.push('_No documentation comments found._\n')
    }

    return docs.join('\n')
}

/**
 * Check if a line that starts with "note" might be an instruction
 * Returns lint warning data if suspicious
 */
export function detectAmbiguousComment(line) {
    const trimmed = line.trim().toLowerCase()
    // "note the user's preferences" — looks like instruction, not comment
    if (trimmed.startsWith('note ') && !trimmed.startsWith('note:') && !trimmed.startsWith('note to self:')) {
        // "note" followed by noun — likely instruction
        const afterNote = trimmed.slice(5)
        if (/^the\s+\w+/i.test(afterNote) || /^\w+'s\s+/i.test(afterNote)) {
            return {
                code: 'LUME-L011',
                severity: 'warning',
                message: `This line starts with "note" but might be an instruction, not a comment.`,
                suggestion: `If this is a comment, use "note:" with a colon. If it's an instruction, use "save" instead of "note".`,
            }
        }
    }
    return null
}
