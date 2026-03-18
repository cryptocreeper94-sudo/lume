/**
 * ====== Lume Lexer ======
 * Tokenizes Lume source code into a flat array of tokens.
 * 
 * Handles:
 *   - Keywords (let, define, show, log, set, to, return, if, else, when, is,
 *     and, or, not, for, each, in, while, break, continue, then, by,
 *     ask, think, generate, as, use, export, from, all,
 *     text, number, boolean, list, map, of, any, nothing, maybe,
 *     ok, error, fail, with, try, test, expect, equal, intent, given, expects,
 *     true, false, null, default)
 *   - Identifiers
 *   - Numbers (integer and float)
 *   - Strings (with {expr} interpolation)
 *   - Operators (+, -, *, /, %, ==, !=, >, <, >=, <=, =, +=, -=, *=, /=, ...)
 *   - Natural language operators (is, is not, is greater than, etc.)
 *   - Punctuation (, . : ( ) [ ] { } ->)
 *   - Comments (// single, /* multi *​/, /// doc)
 *   - Indentation tracking (INDENT / DEDENT tokens)
 *   - Newlines (significant for block detection)
 */

// ── Token Types ──
export const TokenType = {
    // Literals
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    INTERP_START: 'INTERP_START',   // start of interpolated string segment
    INTERP_EXPR: 'INTERP_EXPR',    // expression inside {…}
    INTERP_END: 'INTERP_END',     // end of interpolated string segment
    BOOLEAN: 'BOOLEAN',
    NULL: 'NULL',

    // Identifiers & Keywords
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',

    // Operators
    PLUS: 'PLUS',           // +
    MINUS: 'MINUS',          // -
    STAR: 'STAR',           // *
    SLASH: 'SLASH',          // /
    PERCENT: 'PERCENT',        // %
    EQUALS: 'EQUALS',         // =
    DOUBLE_EQUALS: 'DOUBLE_EQUALS',  // ==
    NOT_EQUALS: 'NOT_EQUALS',     // !=
    GREATER: 'GREATER',        // >
    LESS: 'LESS',           // <
    GREATER_EQ: 'GREATER_EQ',     // >=
    LESS_EQ: 'LESS_EQ',        // <=
    PLUS_EQ: 'PLUS_EQ',        // +=
    MINUS_EQ: 'MINUS_EQ',       // -=
    STAR_EQ: 'STAR_EQ',        // *=
    SLASH_EQ: 'SLASH_EQ',       // /=
    AND: 'AND',            // && or 'and'
    OR: 'OR',             // || or 'or'
    NOT: 'NOT',            // ! or 'not'
    SPREAD: 'SPREAD',         // ...
    PIPE: 'PIPE',            // |>
    AT: 'AT',              // @

    // Punctuation
    COLON: 'COLON',          // :
    DOT: 'DOT',            // .
    COMMA: 'COMMA',          // ,
    ARROW: 'ARROW',          // ->
    LPAREN: 'LPAREN',         // (
    RPAREN: 'RPAREN',         // )
    LBRACKET: 'LBRACKET',       // [
    RBRACKET: 'RBRACKET',       // ]
    LBRACE: 'LBRACE',         // {
    RBRACE: 'RBRACE',         // }

    // Structure
    NEWLINE: 'NEWLINE',
    INDENT: 'INDENT',
    DEDENT: 'DEDENT',
    COMMENT: 'COMMENT',
    DOC_COMMENT: 'DOC_COMMENT',
    EOF: 'EOF',
}

// ── Keywords ──
const KEYWORDS = new Set([
    // Core
    'let', 'define', 'set', 'to', 'return', 'if', 'else', 'when', 'is',
    'and', 'or', 'not', 'for', 'each', 'in', 'while', 'break', 'continue',
    'show', 'log', 'then', 'by',
    // AI
    'ask', 'think', 'generate', 'as',
    // Modules & Interop
    'use', 'export', 'from', 'all', 'fetch', 'read', 'write', 'await', 'pipe',
    // Self-sustaining
    'monitor', 'heal', 'healable', 'optimize', 'evolve', 'rollback', 'suggest', 'daemon',
    // Types
    'type', 'text', 'number', 'boolean', 'list', 'map', 'of', 'any', 'nothing', 'maybe',
    // Error handling
    'ok', 'error', 'fail', 'with', 'try',
    // Testing
    'test', 'expect', 'equal', 'intent', 'given', 'expects', 'verify',
    // Vertical Applications
    'deploy', 'config',
    // Literals (handled separately but still reserved)
    'true', 'false', 'null',
    // Pattern
    'default',
])

// ── Token class ──
export class Token {
    constructor(type, value, line, column) {
        this.type = type
        this.value = value
        this.line = line
        this.column = column
    }

    toString() {
        return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column})`
    }
}

// ── Lexer ──
export class Lexer {
    constructor(source, filename = '<stdin>') {
        this.source = source
        this.filename = filename
        this.pos = 0
        this.line = 1
        this.column = 1
        this.tokens = []
        this.indentStack = [0]   // stack of indentation levels
        this.atLineStart = true  // are we at the beginning of a line?
    }

    // ── Public API ──
    tokenize() {
        while (this.pos < this.source.length) {
            // Handle line-start indentation
            if (this.atLineStart) {
                this._handleIndentation()
                this.atLineStart = false
            }

            const ch = this.source[this.pos]

            // Skip whitespace (non-newline)
            if (ch === ' ') {
                this._advance()
                continue
            }

            // Tab error
            if (ch === '\t') {
                this._error('E003', 'Tabs are not allowed in Lume. Use 4 spaces per indentation level.')
            }

            // Newlines
            if (ch === '\n' || ch === '\r') {
                this._handleNewline()
                continue
            }

            // Comments
            if (ch === '/') {
                if (this._peek(1) === '/') {
                    if (this._peek(2) === '/') {
                        this._readDocComment()
                    } else {
                        this._readLineComment()
                    }
                    continue
                }
                if (this._peek(1) === '*') {
                    this._readBlockComment()
                    continue
                }
            }

            // Strings
            if (ch === '"') {
                if (this._peek(1) === '"' && this._peek(2) === '"') {
                    this._readTripleString()
                } else {
                    this._readString()
                }
                continue
            }

            // Numbers
            if (this._isDigit(ch)) {
                this._readNumber()
                continue
            }

            // Identifiers and keywords
            if (this._isAlpha(ch) || ch === '_') {
                this._readIdentifier()
                continue
            }

            // @ decorator
            if (ch === '@') {
                this._advance()
                let decorator = '@'
                while (this.pos < this.source.length && this._isAlphaNumeric(this.source[this.pos])) {
                    decorator += this._advance()
                }
                this.tokens.push(new Token(TokenType.AT, decorator, this.line, this.column - decorator.length))
                continue
            }

            // Operators and punctuation
            if (this._readOperatorOrPunctuation()) {
                continue
            }

            this._error('E001', `Unexpected character '${ch}'`)
        }

        // Emit remaining DEDENTs at EOF
        while (this.indentStack.length > 1) {
            this.indentStack.pop()
            this.tokens.push(new Token(TokenType.DEDENT, '', this.line, this.column))
        }

        this.tokens.push(new Token(TokenType.EOF, '', this.line, this.column))
        return this.tokens
    }

    // ── Private: Navigation ──
    _advance() {
        const ch = this.source[this.pos]
        this.pos++
        this.column++
        return ch
    }

    _peek(offset = 0) {
        const idx = this.pos + offset
        return idx < this.source.length ? this.source[idx] : null
    }

    _current() {
        return this.source[this.pos]
    }

    // ── Private: Error ──
    _error(code, message) {
        // Find the offending line for context
        const lines = this.source.split('\n')
        const lineText = lines[this.line - 1] || ''
        const pad = ' '.repeat(this.column - 1)
        const errorMsg = [
            ``,
            `Error [${code}] in ${this.filename} at line ${this.line}, column ${this.column}:`,
            `  ${this.line} |   ${lineText}`,
            `        ${pad}^`,
            `  ${message}`,
        ].join('\n')
        throw new Error(errorMsg)
    }

    // ── Private: Newline handling ──
    _handleNewline() {
        if (this._current() === '\r') {
            this._advance()
            if (this._current() === '\n') {
                this._advance()
            }
        } else {
            this._advance()
        }
        // Only emit NEWLINE if the last token isn't already a NEWLINE or INDENT/DEDENT
        const lastType = this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].type : null
        if (lastType && lastType !== TokenType.NEWLINE && lastType !== TokenType.INDENT && lastType !== TokenType.DEDENT) {
            this.tokens.push(new Token(TokenType.NEWLINE, '\\n', this.line, 0))
        }
        this.line++
        this.column = 1
        this.atLineStart = true
    }

    // ── Private: Indentation ──
    _handleIndentation() {
        let spaces = 0
        while (this.pos < this.source.length && this.source[this.pos] === ' ') {
            spaces++
            this.pos++
            this.column++
        }

        // Skip blank or comment-only lines
        const ch = this.source[this.pos]
        if (ch === '\n' || ch === '\r' || ch === undefined) return
        if (ch === '/' && (this._peek(1) === '/' || this._peek(1) === '*')) return

        const currentIndent = this.indentStack[this.indentStack.length - 1]

        if (spaces > currentIndent) {
            this.indentStack.push(spaces)
            this.tokens.push(new Token(TokenType.INDENT, spaces, this.line, 1))
        } else if (spaces < currentIndent) {
            while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > spaces) {
                this.indentStack.pop()
                this.tokens.push(new Token(TokenType.DEDENT, '', this.line, 1))
            }
            if (this.indentStack[this.indentStack.length - 1] !== spaces) {
                this._error('E001', `Inconsistent indentation. Expected ${this.indentStack[this.indentStack.length - 1]} spaces, got ${spaces}.`)
            }
        }
    }

    // ── Private: Comments ──
    _readLineComment() {
        const startCol = this.column
        let text = ''
        this._advance() // /
        this._advance() // /
        while (this.pos < this.source.length && this.source[this.pos] !== '\n' && this.source[this.pos] !== '\r') {
            text += this._advance()
        }
        this.tokens.push(new Token(TokenType.COMMENT, text.trim(), this.line, startCol))
    }

    _readDocComment() {
        const startCol = this.column
        let text = ''
        this._advance() // /
        this._advance() // /
        this._advance() // /
        while (this.pos < this.source.length && this.source[this.pos] !== '\n' && this.source[this.pos] !== '\r') {
            text += this._advance()
        }
        this.tokens.push(new Token(TokenType.DOC_COMMENT, text.trim(), this.line, startCol))
    }

    _readBlockComment() {
        const startLine = this.line
        const startCol = this.column
        let text = ''
        this._advance() // /
        this._advance() // *
        while (this.pos < this.source.length) {
            if (this.source[this.pos] === '*' && this._peek(1) === '/') {
                this._advance() // *
                this._advance() // /
                this.tokens.push(new Token(TokenType.COMMENT, text.trim(), startLine, startCol))
                return
            }
            if (this.source[this.pos] === '\n') {
                text += '\n'
                this.line++
                this.column = 0
            } else {
                text += this.source[this.pos]
            }
            this._advance()
        }
        this._error('E001', 'Unterminated block comment')
    }

    // ── Private: Strings ──
    _readString() {
        const startLine = this.line
        const startCol = this.column
        this._advance() // opening "

        // Check for interpolation segments
        let segments = []
        let current = ''
        let hasInterpolation = false

        while (this.pos < this.source.length) {
            const ch = this.source[this.pos]

            if (ch === '\\') {
                // Escape sequence
                this._advance()
                const next = this._advance()
                switch (next) {
                    case 'n': current += '\n'; break
                    case 't': current += '\t'; break
                    case '"': current += '"'; break
                    case '\\': current += '\\'; break
                    case '{': current += '{'; break
                    default: current += '\\' + next; break
                }
                continue
            }

            if (ch === '{') {
                // Start of interpolation
                hasInterpolation = true
                if (current.length > 0) {
                    segments.push({ type: 'text', value: current })
                    current = ''
                }
                this._advance() // {
                // Read expression until matching }
                let expr = ''
                let depth = 1
                while (this.pos < this.source.length && depth > 0) {
                    const ec = this.source[this.pos]
                    if (ec === '{') depth++
                    if (ec === '}') depth--
                    if (depth > 0) {
                        expr += ec
                    }
                    this._advance()
                }
                segments.push({ type: 'expr', value: expr.trim() })
                continue
            }

            if (ch === '"') {
                // End of string
                this._advance()
                if (current.length > 0) {
                    segments.push({ type: 'text', value: current })
                }

                if (hasInterpolation) {
                    // Emit interpolated string tokens
                    this.tokens.push(new Token(TokenType.INTERP_START, '', startLine, startCol))
                    for (const seg of segments) {
                        if (seg.type === 'text') {
                            this.tokens.push(new Token(TokenType.STRING, seg.value, startLine, startCol))
                        } else {
                            this.tokens.push(new Token(TokenType.INTERP_EXPR, seg.value, startLine, startCol))
                        }
                    }
                    this.tokens.push(new Token(TokenType.INTERP_END, '', startLine, startCol))
                } else {
                    // Plain string
                    this.tokens.push(new Token(TokenType.STRING, current, startLine, startCol))
                }
                return
            }

            if (ch === '\n' || ch === '\r') {
                this._error('E001', 'Unterminated string. Use triple quotes (""") for multi-line strings.')
            }

            current += this._advance()
        }

        this._error('E001', 'Unterminated string')
    }

    _readTripleString() {
        const startLine = this.line
        const startCol = this.column
        // Skip opening """
        this._advance(); this._advance(); this._advance()

        let content = ''
        while (this.pos < this.source.length) {
            if (this.source[this.pos] === '"' && this._peek(1) === '"' && this._peek(2) === '"') {
                this._advance(); this._advance(); this._advance()
                this.tokens.push(new Token(TokenType.STRING, content, startLine, startCol))
                return
            }
            if (this.source[this.pos] === '\n') {
                content += '\n'
                this.line++
                this.column = 0
            } else if (this.source[this.pos] !== '\r') {
                content += this.source[this.pos]
            }
            this._advance()
        }
        this._error('E001', 'Unterminated triple-quoted string')
    }

    // ── Private: Numbers ──
    _readNumber() {
        const startCol = this.column
        let num = ''
        let isFloat = false

        while (this.pos < this.source.length && (this._isDigit(this.source[this.pos]) || this.source[this.pos] === '.')) {
            if (this.source[this.pos] === '.') {
                if (isFloat) break // second dot — stop
                if (!this._isDigit(this._peek(1))) break // not a decimal, stop (could be method call)
                isFloat = true
            }
            num += this._advance()
        }

        this.tokens.push(new Token(TokenType.NUMBER, isFloat ? parseFloat(num) : parseInt(num, 10), this.line, startCol))
    }

    // ── Private: Identifiers & Keywords ──
    _readIdentifier() {
        const startCol = this.column
        let name = ''

        while (this.pos < this.source.length && (this._isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === '_')) {
            name += this._advance()
        }

        // Check for boolean and null literals
        if (name === 'true' || name === 'false') {
            this.tokens.push(new Token(TokenType.BOOLEAN, name === 'true', this.line, startCol))
            return
        }
        if (name === 'null') {
            this.tokens.push(new Token(TokenType.NULL, null, this.line, startCol))
            return
        }

        // Check for natural language operators (multi-word)
        if (name === 'is') {
            // Peek ahead for multi-word operators: "is not", "is greater than", "is less than", "is at least", "is at most"
            const saved = { pos: this.pos, col: this.column }
            const next = this._peekWord()
            if (next === 'not') {
                this._skipSpaces(); this._consumeWord()
                this.tokens.push(new Token(TokenType.NOT_EQUALS, 'is not', this.line, startCol))
                return
            }
            if (next === 'greater') {
                this._skipSpaces(); this._consumeWord()
                this._skipSpaces()
                if (this._peekWord() === 'than') { this._consumeWord() }
                this.tokens.push(new Token(TokenType.GREATER, 'is greater than', this.line, startCol))
                return
            }
            if (next === 'less') {
                this._skipSpaces(); this._consumeWord()
                this._skipSpaces()
                if (this._peekWord() === 'than') { this._consumeWord() }
                this.tokens.push(new Token(TokenType.LESS, 'is less than', this.line, startCol))
                return
            }
            if (next === 'at') {
                this._skipSpaces(); this._consumeWord()
                this._skipSpaces()
                const qualifier = this._peekWord()
                if (qualifier === 'least') {
                    this._consumeWord()
                    this.tokens.push(new Token(TokenType.GREATER_EQ, 'is at least', this.line, startCol))
                    return
                }
                if (qualifier === 'most') {
                    this._consumeWord()
                    this.tokens.push(new Token(TokenType.LESS_EQ, 'is at most', this.line, startCol))
                    return
                }
                // Not a multi-word operator — restore
                this.pos = saved.pos; this.column = saved.col
            }
            // Check if 'is' is followed by colon (pattern matching context: "when x is:")
            // In that case emit 'is' as a keyword, not an equality operator
            if (next === '' || this._peekNextNonSpace() === ':') {
                this.tokens.push(new Token(TokenType.KEYWORD, 'is', this.line, startCol))
                return
            }
            // Plain "is" = equality check
            this.tokens.push(new Token(TokenType.DOUBLE_EQUALS, 'is', this.line, startCol))
            return
        }

        // "and" / "or" / "not" as logical operators
        if (name === 'and') {
            this.tokens.push(new Token(TokenType.AND, 'and', this.line, startCol))
            return
        }
        if (name === 'or') {
            this.tokens.push(new Token(TokenType.OR, 'or', this.line, startCol))
            return
        }
        if (name === 'not') {
            this.tokens.push(new Token(TokenType.NOT, 'not', this.line, startCol))
            return
        }

        // Keywords
        if (KEYWORDS.has(name)) {
            this.tokens.push(new Token(TokenType.KEYWORD, name, this.line, startCol))
            return
        }

        // Regular identifier
        this.tokens.push(new Token(TokenType.IDENTIFIER, name, this.line, startCol))
    }

    // ── Private: Operators & Punctuation ──
    _readOperatorOrPunctuation() {
        const ch = this.source[this.pos]
        const next = this._peek(1)
        const startCol = this.column

        // Three-char operators
        if (ch === '.' && next === '.' && this._peek(2) === '.') {
            this._advance(); this._advance(); this._advance()
            this.tokens.push(new Token(TokenType.SPREAD, '...', this.line, startCol))
            return true
        }

        // Two-char operators
        const two = ch + (next || '')
        const twoCharMap = {
            '==': TokenType.DOUBLE_EQUALS,
            '!=': TokenType.NOT_EQUALS,
            '>=': TokenType.GREATER_EQ,
            '<=': TokenType.LESS_EQ,
            '+=': TokenType.PLUS_EQ,
            '-=': TokenType.MINUS_EQ,
            '*=': TokenType.STAR_EQ,
            '/=': TokenType.SLASH_EQ,
            '->': TokenType.ARROW,
            '&&': TokenType.AND,
            '||': TokenType.OR,
            '|>': TokenType.PIPE,
        }
        if (twoCharMap[two]) {
            this._advance(); this._advance()
            this.tokens.push(new Token(twoCharMap[two], two, this.line, startCol))
            return true
        }

        // Single-char operators and punctuation
        const oneCharMap = {
            '+': TokenType.PLUS,
            '-': TokenType.MINUS,
            '*': TokenType.STAR,
            '/': TokenType.SLASH,
            '%': TokenType.PERCENT,
            '=': TokenType.EQUALS,
            '>': TokenType.GREATER,
            '<': TokenType.LESS,
            '!': TokenType.NOT,
            ':': TokenType.COLON,
            '.': TokenType.DOT,
            ',': TokenType.COMMA,
            '(': TokenType.LPAREN,
            ')': TokenType.RPAREN,
            '[': TokenType.LBRACKET,
            ']': TokenType.RBRACKET,
            '{': TokenType.LBRACE,
            '}': TokenType.RBRACE,
        }
        if (oneCharMap[ch]) {
            this._advance()
            this.tokens.push(new Token(oneCharMap[ch], ch, this.line, startCol))
            return true
        }

        return false
    }

    // ── Private: Helpers ──
    _isDigit(ch) { return ch >= '0' && ch <= '9' }
    _isAlpha(ch) { return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' }
    _isAlphaNumeric(ch) { return this._isAlpha(ch) || this._isDigit(ch) }

    _skipSpaces() {
        while (this.pos < this.source.length && this.source[this.pos] === ' ') {
            this._advance()
        }
    }

    _peekWord() {
        let i = this.pos
        while (i < this.source.length && this.source[i] === ' ') i++
        let word = ''
        while (i < this.source.length && this._isAlphaNumeric(this.source[i])) {
            word += this.source[i]
            i++
        }
        return word
    }

    _consumeWord() {
        while (this.pos < this.source.length && this.source[this.pos] === ' ') this._advance()
        while (this.pos < this.source.length && this._isAlphaNumeric(this.source[this.pos])) this._advance()
    }

    _peekNextNonSpace() {
        let i = this.pos
        while (i < this.source.length && this.source[i] === ' ') i++
        return i < this.source.length ? this.source[i] : null
    }
}

// ── Convenience function ──
export function tokenize(source, filename) {
    return new Lexer(source, filename).tokenize()
}
