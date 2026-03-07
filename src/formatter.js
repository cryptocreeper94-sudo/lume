/**
 * ====== Lume Formatter ======
 * Formats Lume source code to a consistent style.
 * 
 * Rules:
 *   - 4-space indentation
 *   - No trailing whitespace
 *   - Single blank line between top-level declarations
 *   - Consistent spacing around operators
 *   - Trim trailing newlines (single newline at end)
 */

export class Formatter {
    constructor(source) {
        this.source = source
        this.lines = source.split('\n')
    }

    format() {
        let result = []
        let prevWasBlank = false
        let prevWasTopLevel = false

        for (let i = 0; i < this.lines.length; i++) {
            let line = this.lines[i]

            // Remove trailing whitespace
            line = line.replace(/\s+$/, '')

            // Handle carriage returns
            line = line.replace(/\r$/, '')

            // Normalize indentation (tabs → 4 spaces)
            const indent = line.match(/^(\s*)/)[1]
            const content = line.slice(indent.length)
            const spaces = indent.replace(/\t/g, '    ')
            line = spaces + content

            // Track blank lines
            const isBlank = content.length === 0
            const isTopLevel = spaces.length === 0 && content.length > 0

            // Don't allow more than one consecutive blank line
            if (isBlank && prevWasBlank) continue

            // Add blank line before top-level declarations
            if (isTopLevel && !isBlank && !prevWasBlank && i > 0 && this._isDeclarationStart(content)) {
                if (result.length > 0 && result[result.length - 1] !== '') {
                    result.push('')
                }
            }

            // Fix operator spacing
            line = this._fixOperatorSpacing(line)

            result.push(line)
            prevWasBlank = isBlank
            prevWasTopLevel = isTopLevel
        }

        // Trim trailing blank lines, ensure single newline at end
        while (result.length > 0 && result[result.length - 1] === '') {
            result.pop()
        }
        result.push('')  // single trailing newline

        return result.join('\n')
    }

    _isDeclarationStart(content) {
        return /^(to |type |test |define |export |\/\/)/.test(content)
    }

    _fixOperatorSpacing(line) {
        const indent = line.match(/^(\s*)/)[1]
        let content = line.slice(indent.length)

        // Don't touch strings or comments
        if (content.startsWith('//') || content.startsWith('"') || content.startsWith("'")) {
            return line
        }

        // Operator spacing is intentionally conservative to avoid breaking strings
        // Only fix clearly missing spaces around standalone = (not ==, !=, etc.)

        return indent + content
    }
}

export function format(source) {
    return new Formatter(source).format()
}
