/**
 * ====== Lume Parser ======
 * Consumes tokens from the Lexer and builds an Abstract Syntax Tree (AST).
 * 
 * Milestone 1 + 2 AST nodes:
 *   - Program, LetDeclaration, DefineDeclaration, ShowStatement, LogStatement
 *   - SetStatement, ReturnStatement
 *   - IfStatement, WhenStatement (pattern matching)
 *   - FunctionDeclaration (to keyword, short form)
 *   - ForEachStatement, ForEachIndexStatement, ForRangeStatement
 *   - WhileStatement, BreakStatement, ContinueStatement
 *   - TypeDeclaration (custom types/structs)
 *   - IntentBlock, TestBlock, ExpectStatement
 *   - All expression types from M1
 *   - AssignmentExpression (+=, -=, *=, /=)
 */

import { TokenType } from './lexer.js'

// ── AST Node Types ──
export const NodeType = {
    Program: 'Program',
    LetDeclaration: 'LetDeclaration',
    DefineDeclaration: 'DefineDeclaration',
    ShowStatement: 'ShowStatement',
    LogStatement: 'LogStatement',
    SetStatement: 'SetStatement',
    ReturnStatement: 'ReturnStatement',
    IfStatement: 'IfStatement',
    WhenStatement: 'WhenStatement',
    ForEachStatement: 'ForEachStatement',
    ForEachIndexStatement: 'ForEachIndexStatement',
    ForRangeStatement: 'ForRangeStatement',
    WhileStatement: 'WhileStatement',
    BreakStatement: 'BreakStatement',
    ContinueStatement: 'ContinueStatement',
    FunctionDeclaration: 'FunctionDeclaration',
    AskExpression: 'AskExpression',
    ThinkExpression: 'ThinkExpression',
    GenerateExpression: 'GenerateExpression',
    FetchExpression: 'FetchExpression',
    PipeExpression: 'PipeExpression',
    AwaitExpression: 'AwaitExpression',
    ReadExpression: 'ReadExpression',
    WriteExpression: 'WriteExpression',
    MonitorBlock: 'MonitorBlock',
    HealBlock: 'HealBlock',
    OptimizeBlock: 'OptimizeBlock',
    EvolveBlock: 'EvolveBlock',
    DecoratorStatement: 'DecoratorStatement',
    BinaryExpression: 'BinaryExpression',
    UnaryExpression: 'UnaryExpression',
    CallExpression: 'CallExpression',
    MemberExpression: 'MemberExpression',
    IndexExpression: 'IndexExpression',
    AssignmentExpression: 'AssignmentExpression',
    StringLiteral: 'StringLiteral',
    InterpolatedString: 'InterpolatedString',
    NumberLiteral: 'NumberLiteral',
    BooleanLiteral: 'BooleanLiteral',
    NullLiteral: 'NullLiteral',
    ListLiteral: 'ListLiteral',
    MapLiteral: 'MapLiteral',
    Identifier: 'Identifier',
    TypeAnnotation: 'TypeAnnotation',
    TypeDeclaration: 'TypeDeclaration',
    IntentBlock: 'IntentBlock',
    TestBlock: 'TestBlock',
    ExpectStatement: 'ExpectStatement',
    UseStatement: 'UseStatement',
    ExportStatement: 'ExportStatement',
    ResultPattern: 'ResultPattern',
    BlockStatement: 'BlockStatement',
    CommentNode: 'CommentNode',
}

// ── Parser ──
export class Parser {
    constructor(tokens, filename = '<stdin>') {
        this.tokens = tokens
        this.filename = filename
        this.pos = 0
    }

    // ── Public API ──
    parse() {
        const body = []
        while (!this._isAtEnd()) {
            this._skipNewlines()
            if (this._isAtEnd()) break
            const stmt = this._parseStatement()
            if (stmt) body.push(stmt)
        }
        return { type: NodeType.Program, body, line: 1, column: 1 }
    }

    // ── Private: Navigation ──
    _current() {
        return this.tokens[this.pos]
    }

    _peek(offset = 0) {
        const idx = this.pos + offset
        return idx < this.tokens.length ? this.tokens[idx] : null
    }

    _advance() {
        const token = this.tokens[this.pos]
        this.pos++
        return token
    }

    _expect(type, value) {
        const tok = this._current()
        if (!tok || tok.type !== type || (value !== undefined && tok.value !== value)) {
            const got = tok ? `${tok.type}(${JSON.stringify(tok.value)})` : 'end of file'
            const expected = value !== undefined ? `${type}(${JSON.stringify(value)})` : type
            this._error(tok, `Expected ${expected}, got ${got}`)
        }
        return this._advance()
    }

    _match(type, value) {
        const tok = this._current()
        if (tok && tok.type === type && (value === undefined || tok.value === value)) {
            return this._advance()
        }
        return null
    }

    _check(type, value) {
        const tok = this._current()
        return tok && tok.type === type && (value === undefined || tok.value === value)
    }

    _isAtEnd() {
        return this.pos >= this.tokens.length || this._current().type === TokenType.EOF
    }

    _skipNewlines() {
        while (this._match(TokenType.NEWLINE)) { /* skip */ }
    }

    // ── Private: Error ──
    _error(token, message) {
        const line = token ? token.line : '?'
        const col = token ? token.column : '?'
        throw new Error(`\nParse Error in ${this.filename} at line ${line}, column ${col}:\n  ${message}`)
    }

    // ── Private: Block Parsing ──
    // A block is a colon followed by INDENT, statements, DEDENT
    _parseBlock() {
        this._skipNewlines()
        this._expect(TokenType.INDENT)
        const body = []
        while (!this._check(TokenType.DEDENT) && !this._isAtEnd()) {
            this._skipNewlines()
            if (this._check(TokenType.DEDENT) || this._isAtEnd()) break
            const stmt = this._parseStatement()
            if (stmt) body.push(stmt)
        }
        this._match(TokenType.DEDENT)
        this._skipNewlines()
        return body
    }

    // ── Private: Statement Parsing ──
    _parseStatement() {
        this._skipNewlines()
        if (this._isAtEnd()) return null

        const tok = this._current()

        // Comments
        if (tok.type === TokenType.COMMENT || tok.type === TokenType.DOC_COMMENT) {
            this._advance()
            return { type: NodeType.CommentNode, value: tok.value, line: tok.line, column: tok.column }
        }

        // Decorators (@healable, @critical, @experimental, @cached)
        if (tok.type === TokenType.AT) {
            const decoratorTok = this._advance()
            this._skipNewlines()
            // The next statement should be a function — parse it and attach decorator
            const stmt = this._parseStatement()
            stmt.decorator = decoratorTok.value
            return stmt
        }

        // Keywords
        if (tok.type === TokenType.KEYWORD) {
            switch (tok.value) {
                case 'let': return this._parseLetDeclaration()
                case 'define': return this._parseDefineDeclaration()
                case 'show': return this._parseShowStatement()
                case 'log': return this._parseLogStatement()
                case 'set': return this._parseSetStatement()
                case 'return': return this._parseReturnStatement()
                case 'if': return this._parseIfStatement()
                case 'when': return this._parseWhenStatement()
                case 'to': return this._parseFunctionDeclaration()
                case 'for': return this._parseForStatement()
                case 'while': return this._parseWhileStatement()
                case 'break': return this._parseBreakStatement()
                case 'continue': return this._parseContinueStatement()
                case 'type': return this._parseTypeDeclaration()
                case 'test': return this._parseTestBlock()
                case 'export': return this._parseExportStatement()
                case 'use': return this._parseUseStatement()
                case 'read': return this._parseReadExpression()
                case 'write': return this._parseWriteExpression()
                case 'monitor': return this._parseConfigBlock('MonitorBlock')
                case 'heal': return this._parseConfigBlock('HealBlock')
                case 'optimize': return this._parseConfigBlock('OptimizeBlock')
                case 'evolve': return this._parseConfigBlock('EvolveBlock')
            }
        }

        // Identifier that might be an assignment (x += 1)
        if (tok.type === TokenType.IDENTIFIER) {
            // Peek for compound assignment operators
            const next = this._peek(1)
            if (next && (next.type === TokenType.PLUS_EQ || next.type === TokenType.MINUS_EQ ||
                next.type === TokenType.STAR_EQ || next.type === TokenType.SLASH_EQ)) {
                return this._parseAssignment()
            }
        }

        // Expression statement (fallback)
        const expr = this._parseExpression()
        this._skipNewlines()
        return expr
    }

    // ══════════════════════════
    //  DECLARATIONS
    // ══════════════════════════

    // ── let name = expression ──
    _parseLetDeclaration() {
        const tok = this._advance() // consume 'let'
        const name = this._expect(TokenType.IDENTIFIER)

        // Optional type annotation: let x: number = ...
        let typeAnnotation = null
        if (this._match(TokenType.COLON)) {
            typeAnnotation = this._parseTypeAnnotation()
        }

        this._expect(TokenType.EQUALS)
        const value = this._parseExpression()
        this._skipNewlines()

        return {
            type: NodeType.LetDeclaration,
            name: name.value,
            typeAnnotation,
            value,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── define NAME = expression ──
    _parseDefineDeclaration() {
        const tok = this._advance() // consume 'define'
        const name = this._expect(TokenType.IDENTIFIER)
        this._expect(TokenType.EQUALS)
        const value = this._parseExpression()
        this._skipNewlines()

        return {
            type: NodeType.DefineDeclaration,
            name: name.value,
            value,
            line: tok.line,
            column: tok.column,
        }
    }

    // ══════════════════════════
    //  SIMPLE STATEMENTS
    // ══════════════════════════

    _parseShowStatement() {
        const tok = this._advance()
        const value = this._parseExpression()
        this._skipNewlines()
        return { type: NodeType.ShowStatement, value, line: tok.line, column: tok.column }
    }

    _parseLogStatement() {
        const tok = this._advance()
        const value = this._parseExpression()
        this._skipNewlines()
        return { type: NodeType.LogStatement, value, line: tok.line, column: tok.column }
    }

    _parseSetStatement() {
        const tok = this._advance() // consume 'set'
        const name = this._expect(TokenType.IDENTIFIER)
        this._expect(TokenType.KEYWORD, 'to')
        const value = this._parseExpression()
        this._skipNewlines()
        return { type: NodeType.SetStatement, name: name.value, value, line: tok.line, column: tok.column }
    }

    _parseReturnStatement() {
        const tok = this._advance() // consume 'return'
        // Return can have no value (return nothing)
        let value = null
        if (!this._check(TokenType.NEWLINE) && !this._check(TokenType.DEDENT) && !this._isAtEnd()) {
            value = this._parseExpression()
        }
        this._skipNewlines()
        return { type: NodeType.ReturnStatement, value, line: tok.line, column: tok.column }
    }

    _parseBreakStatement() {
        const tok = this._advance()
        this._skipNewlines()
        return { type: NodeType.BreakStatement, line: tok.line, column: tok.column }
    }

    _parseContinueStatement() {
        const tok = this._advance()
        this._skipNewlines()
        return { type: NodeType.ContinueStatement, line: tok.line, column: tok.column }
    }

    // ── x += 1 (compound assignment) ──
    _parseAssignment() {
        const ident = this._advance() // identifier
        const op = this._advance()    // +=, -=, *=, /=
        const opMap = {
            [TokenType.PLUS_EQ]: '+=',
            [TokenType.MINUS_EQ]: '-=',
            [TokenType.STAR_EQ]: '*=',
            [TokenType.SLASH_EQ]: '/=',
        }
        const value = this._parseExpression()
        this._skipNewlines()
        return {
            type: NodeType.AssignmentExpression,
            name: ident.value,
            operator: opMap[op.type],
            value,
            line: ident.line,
            column: ident.column,
        }
    }

    // ══════════════════════════
    //  CONTROL FLOW
    // ══════════════════════════

    // ── if condition: ... else: ... ──
    _parseIfStatement() {
        const tok = this._advance() // consume 'if'
        const condition = this._parseExpression()
        this._expect(TokenType.COLON)
        const body = this._parseBlock()

        let elseBody = null
        this._skipNewlines()
        if (this._check(TokenType.KEYWORD, 'else')) {
            this._advance() // consume 'else'
            // else if  or  else:
            if (this._check(TokenType.KEYWORD, 'if')) {
                elseBody = [this._parseIfStatement()]
            } else {
                this._expect(TokenType.COLON)
                elseBody = this._parseBlock()
            }
        }

        return {
            type: NodeType.IfStatement,
            condition,
            body,
            elseBody,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── when expr is: ok(data) -> ... error(e) -> ... ──
    _parseWhenStatement() {
        const tok = this._advance() // consume 'when'
        const subject = this._parseExpression()

        // "when result is:" or "when tier is:"
        // 'is' followed by ':' is emitted as KEYWORD 'is' by the lexer
        if (this._check(TokenType.KEYWORD, 'is')) {
            this._advance() // consume 'is'
        } else if (this._check(TokenType.DOUBLE_EQUALS)) {
            this._advance() // consume 'is' (alternative)
        }
        this._expect(TokenType.COLON)

        this._skipNewlines()
        this._expect(TokenType.INDENT)

        const cases = []
        while (!this._check(TokenType.DEDENT) && !this._isAtEnd()) {
            this._skipNewlines()
            if (this._check(TokenType.DEDENT) || this._isAtEnd()) break
            // Skip comments inside when block
            if (this._check(TokenType.COMMENT) || this._check(TokenType.DOC_COMMENT)) {
                this._advance()
                continue
            }

            // Parse pattern: "gold" -> ... or ok(data) -> ... or default ->
            let pattern
            if (this._check(TokenType.STRING)) {
                pattern = { type: 'string', value: this._advance().value }
            } else if (this._check(TokenType.NUMBER)) {
                pattern = { type: 'number', value: this._advance().value }
            } else if (this._check(TokenType.BOOLEAN)) {
                pattern = { type: 'boolean', value: this._advance().value }
            } else if (this._check(TokenType.KEYWORD, 'ok')) {
                this._advance()
                this._expect(TokenType.LPAREN)
                const binding = this._expect(TokenType.IDENTIFIER)
                this._expect(TokenType.RPAREN)
                pattern = { type: 'ok', binding: binding.value }
            } else if (this._check(TokenType.KEYWORD, 'error')) {
                this._advance()
                this._expect(TokenType.LPAREN)
                const binding = this._expect(TokenType.IDENTIFIER)
                this._expect(TokenType.RPAREN)
                pattern = { type: 'error', binding: binding.value }
            } else if (this._check(TokenType.KEYWORD, 'default')) {
                this._advance()
                pattern = { type: 'default' }
            } else if (this._check(TokenType.IDENTIFIER)) {
                pattern = { type: 'identifier', value: this._advance().value }
            } else {
                this._error(this._current(), 'Expected pattern in when case')
            }

            this._expect(TokenType.ARROW)
            // Case body — could be single expression or block
            let caseBody
            if (this._check(TokenType.NEWLINE)) {
                // Multi-line block
                this._skipNewlines()
                if (this._check(TokenType.INDENT)) {
                    caseBody = this._parseBlock()
                } else {
                    caseBody = []
                }
            } else {
                // Single expression after ->
                const expr = this._parseStatement()
                caseBody = expr ? [expr] : []
            }

            cases.push({ pattern, body: caseBody })
            this._skipNewlines()
        }

        this._match(TokenType.DEDENT)
        this._skipNewlines()

        return {
            type: NodeType.WhenStatement,
            subject,
            cases,
            line: tok.line,
            column: tok.column,
        }
    }

    // ══════════════════════════
    //  FUNCTIONS
    // ══════════════════════════

    // ── to greet(name: text) -> text: ... ──
    // ── to double(n: number) -> n * 2 (short form) ──
    _parseFunctionDeclaration() {
        const tok = this._advance() // consume 'to'
        const name = this._expect(TokenType.IDENTIFIER)

        // Parameters
        this._expect(TokenType.LPAREN)
        const params = []
        while (!this._check(TokenType.RPAREN) && !this._isAtEnd()) {
            const paramName = this._expect(TokenType.IDENTIFIER)
            let paramType = null
            if (this._match(TokenType.COLON)) {
                paramType = this._parseTypeAnnotation()
            }
            params.push({ name: paramName.value, typeAnnotation: paramType })
            this._match(TokenType.COMMA)
        }
        this._expect(TokenType.RPAREN)

        // Optional return type: -> text
        let returnType = null
        let body = null
        let isShortForm = false

        if (this._match(TokenType.ARROW)) {
            // Could be return type + colon block, or short form expression
            // Peek: if next is a type keyword followed by colon, it's return type
            if (this._check(TokenType.KEYWORD) && this._isTypeKeyword(this._current().value)) {
                returnType = this._parseTypeAnnotation()
                this._expect(TokenType.COLON)
                body = this._parseBlock()
            } else if (this._check(TokenType.COLON)) {
                // -> followed by : — no return type, just block
                this._advance() // consume :
                body = this._parseBlock()
            } else {
                // Short form: to double(n: number) -> n * 2
                isShortForm = true
                const expr = this._parseExpression()
                body = [{ type: NodeType.ReturnStatement, value: expr, line: expr.line, column: expr.column }]
            }
        } else if (this._match(TokenType.COLON)) {
            // No return type, just colon block
            body = this._parseBlock()
        }

        this._skipNewlines()

        return {
            type: NodeType.FunctionDeclaration,
            name: name.value,
            params,
            returnType,
            body: body || [],
            isShortForm,
            line: tok.line,
            column: tok.column,
        }
    }

    _isTypeKeyword(value) {
        return ['text', 'number', 'boolean', 'list', 'map', 'any', 'nothing', 'maybe'].includes(value)
    }

    // ══════════════════════════
    //  LOOPS
    // ══════════════════════════

    // ── for each / for i in 0 to 10 ──
    _parseForStatement() {
        const tok = this._advance() // consume 'for'

        // "for each item in list:" or "for each item, index in list:"
        if (this._check(TokenType.KEYWORD, 'each')) {
            this._advance() // consume 'each'
            const itemName = this._expect(TokenType.IDENTIFIER)

            // Check for index: "for each item, index in list:"
            let indexName = null
            if (this._match(TokenType.COMMA)) {
                indexName = this._expect(TokenType.IDENTIFIER).value
            }

            this._expect(TokenType.KEYWORD, 'in')
            const iterable = this._parseExpression()
            this._expect(TokenType.COLON)
            const body = this._parseBlock()

            if (indexName) {
                return {
                    type: NodeType.ForEachIndexStatement,
                    item: itemName.value,
                    index: indexName,
                    iterable,
                    body,
                    line: tok.line,
                    column: tok.column,
                }
            }
            return {
                type: NodeType.ForEachStatement,
                item: itemName.value,
                iterable,
                body,
                line: tok.line,
                column: tok.column,
            }
        }

        // "for i in 0 to 10:" or "for i in 0 to 100 by 5:"
        const varName = this._expect(TokenType.IDENTIFIER)
        this._expect(TokenType.KEYWORD, 'in')
        const start = this._parseExpression()
        this._expect(TokenType.KEYWORD, 'to')
        const end = this._parseExpression()

        let step = null
        if (this._check(TokenType.KEYWORD, 'by')) {
            this._advance()
            step = this._parseExpression()
        }

        this._expect(TokenType.COLON)
        const body = this._parseBlock()

        return {
            type: NodeType.ForRangeStatement,
            variable: varName.value,
            start,
            end,
            step,
            body,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── while condition: ... ──
    _parseWhileStatement() {
        const tok = this._advance() // consume 'while'
        const condition = this._parseExpression()
        this._expect(TokenType.COLON)
        const body = this._parseBlock()

        return {
            type: NodeType.WhileStatement,
            condition,
            body,
            line: tok.line,
            column: tok.column,
        }
    }

    // ══════════════════════════
    //  TYPES
    // ══════════════════════════

    // ── type User: name: text ... ──
    _parseTypeDeclaration() {
        const tok = this._advance() // consume 'type'
        const name = this._expect(TokenType.IDENTIFIER)

        // Check for type alias: type Score = number
        if (this._match(TokenType.EQUALS)) {
            const aliasType = this._parseTypeAnnotation()
            this._skipNewlines()
            return {
                type: NodeType.TypeDeclaration,
                name: name.value,
                isAlias: true,
                aliasType,
                fields: [],
                line: tok.line,
                column: tok.column,
            }
        }

        this._expect(TokenType.COLON)

        // Parse fields
        this._skipNewlines()
        this._expect(TokenType.INDENT)
        const fields = []
        while (!this._check(TokenType.DEDENT) && !this._isAtEnd()) {
            this._skipNewlines()
            if (this._check(TokenType.DEDENT) || this._isAtEnd()) break
            const fieldName = this._expect(TokenType.IDENTIFIER)
            this._expect(TokenType.COLON)
            const fieldType = this._parseTypeAnnotation()

            // Optional default value
            let defaultValue = null
            if (this._match(TokenType.EQUALS)) {
                defaultValue = this._parseExpression()
            }

            fields.push({
                name: fieldName.value,
                typeAnnotation: fieldType,
                defaultValue,
            })
            this._skipNewlines()
        }
        this._match(TokenType.DEDENT)
        this._skipNewlines()

        return {
            type: NodeType.TypeDeclaration,
            name: name.value,
            isAlias: false,
            fields,
            line: tok.line,
            column: tok.column,
        }
    }

    // ══════════════════════════
    //  TESTING
    // ══════════════════════════

    // ── test "name": ... ──
    _parseTestBlock() {
        const tok = this._advance() // consume 'test'
        const name = this._expect(TokenType.STRING)
        this._expect(TokenType.COLON)
        const body = this._parseBlock()

        return {
            type: NodeType.TestBlock,
            name: name.value,
            body,
            line: tok.line,
            column: tok.column,
        }
    }

    // ══════════════════════════
    //  MODULES
    // ══════════════════════════

    // ── export to func(...) / export let x = ... ──
    _parseExportStatement() {
        const tok = this._advance() // consume 'export'
        const inner = this._parseStatement()
        return {
            type: NodeType.ExportStatement,
            declaration: inner,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── use "module" as alias / use { x } from "module" ──
    _parseUseStatement() {
        const tok = this._advance() // consume 'use'

        // use { x, y } from "module"
        if (this._check(TokenType.LBRACE)) {
            this._advance()
            const imports = []
            while (!this._check(TokenType.RBRACE) && !this._isAtEnd()) {
                imports.push(this._expect(TokenType.IDENTIFIER).value)
                this._match(TokenType.COMMA)
            }
            this._expect(TokenType.RBRACE)
            this._expect(TokenType.KEYWORD, 'from')
            const source = this._expect(TokenType.STRING)
            this._skipNewlines()
            return {
                type: NodeType.UseStatement,
                source: source.value,
                imports,
                alias: null,
                line: tok.line,
                column: tok.column,
            }
        }

        // use "module" as alias
        const source = this._expect(TokenType.STRING)
        let alias = null
        if (this._check(TokenType.KEYWORD, 'as')) {
            this._advance()
            alias = this._expect(TokenType.IDENTIFIER).value
        }
        this._skipNewlines()

        return {
            type: NodeType.UseStatement,
            source: source.value,
            imports: [],
            alias,
            line: tok.line,
            column: tok.column,
        }
    }

    // ══════════════════════════
    //  EXPRESSION PARSING
    // ══════════════════════════

    _parseExpression() {
        return this._parsePipe()
    }

    // |> pipe operator: value |> func → func(value)
    _parsePipe() {
        let left = this._parseOr()
        while (this._check(TokenType.PIPE)) {
            const op = this._advance()
            const right = this._parseOr()
            left = {
                type: NodeType.PipeExpression,
                left,
                right,
                line: op.line,
                column: op.column,
            }
        }
        return left
    }

    _parseOr() {
        let left = this._parseAnd()
        while (this._check(TokenType.OR)) {
            const op = this._advance()
            const right = this._parseAnd()
            left = { type: NodeType.BinaryExpression, operator: '||', left, right, line: op.line, column: op.column }
        }
        return left
    }

    _parseAnd() {
        let left = this._parseEquality()
        while (this._check(TokenType.AND)) {
            const op = this._advance()
            const right = this._parseEquality()
            left = { type: NodeType.BinaryExpression, operator: '&&', left, right, line: op.line, column: op.column }
        }
        return left
    }

    _parseEquality() {
        let left = this._parseComparison()
        while (this._check(TokenType.DOUBLE_EQUALS) || this._check(TokenType.NOT_EQUALS)) {
            const op = this._advance()
            const operator = op.type === TokenType.DOUBLE_EQUALS ? '==' : '!='
            const right = this._parseComparison()
            left = { type: NodeType.BinaryExpression, operator, left, right, line: op.line, column: op.column }
        }
        return left
    }

    _parseComparison() {
        let left = this._parseAddition()
        while (
            this._check(TokenType.GREATER) || this._check(TokenType.LESS) ||
            this._check(TokenType.GREATER_EQ) || this._check(TokenType.LESS_EQ)
        ) {
            const op = this._advance()
            const opMap = {
                [TokenType.GREATER]: '>',
                [TokenType.LESS]: '<',
                [TokenType.GREATER_EQ]: '>=',
                [TokenType.LESS_EQ]: '<=',
            }
            const right = this._parseAddition()
            left = { type: NodeType.BinaryExpression, operator: opMap[op.type], left, right, line: op.line, column: op.column }
        }
        return left
    }

    _parseAddition() {
        let left = this._parseMultiplication()
        while (this._check(TokenType.PLUS) || this._check(TokenType.MINUS)) {
            const op = this._advance()
            const right = this._parseMultiplication()
            left = { type: NodeType.BinaryExpression, operator: op.value, left, right, line: op.line, column: op.column }
        }
        return left
    }

    _parseMultiplication() {
        let left = this._parseUnary()
        while (this._check(TokenType.STAR) || this._check(TokenType.SLASH) || this._check(TokenType.PERCENT)) {
            const op = this._advance()
            const right = this._parseUnary()
            left = { type: NodeType.BinaryExpression, operator: op.value, left, right, line: op.line, column: op.column }
        }
        return left
    }

    _parseUnary() {
        if (this._check(TokenType.NOT) || this._check(TokenType.MINUS)) {
            const op = this._advance()
            const operand = this._parseUnary()
            return { type: NodeType.UnaryExpression, operator: op.value === 'not' ? '!' : op.value, operand, line: op.line, column: op.column }
        }
        return this._parsePostfix()
    }

    _parsePostfix() {
        let expr = this._parsePrimary()

        while (true) {
            if (this._check(TokenType.DOT)) {
                this._advance()
                const prop = this._expect(TokenType.IDENTIFIER)
                expr = { type: NodeType.MemberExpression, object: expr, property: prop.value, line: prop.line, column: prop.column }
            } else if (this._check(TokenType.LBRACKET)) {
                const bracket = this._advance()
                const index = this._parseExpression()
                this._expect(TokenType.RBRACKET)
                expr = { type: NodeType.IndexExpression, object: expr, index, line: bracket.line, column: bracket.column }
            } else if (this._check(TokenType.LPAREN)) {
                const paren = this._advance()
                const args = []
                while (!this._check(TokenType.RPAREN) && !this._isAtEnd()) {
                    args.push(this._parseExpression())
                    this._match(TokenType.COMMA)
                }
                this._expect(TokenType.RPAREN)
                expr = { type: NodeType.CallExpression, callee: expr, arguments: args, line: paren.line, column: paren.column }
            } else {
                break
            }
        }

        return expr
    }

    _parsePrimary() {
        const tok = this._current()

        if (!tok || tok.type === TokenType.EOF) {
            this._error(tok, 'Unexpected end of input')
        }

        // Number literal
        if (tok.type === TokenType.NUMBER) {
            this._advance()
            return { type: NodeType.NumberLiteral, value: tok.value, line: tok.line, column: tok.column }
        }

        // Boolean literal
        if (tok.type === TokenType.BOOLEAN) {
            this._advance()
            return { type: NodeType.BooleanLiteral, value: tok.value, line: tok.line, column: tok.column }
        }

        // Null literal
        if (tok.type === TokenType.NULL) {
            this._advance()
            return { type: NodeType.NullLiteral, value: null, line: tok.line, column: tok.column }
        }

        // Plain string literal
        if (tok.type === TokenType.STRING) {
            this._advance()
            return { type: NodeType.StringLiteral, value: tok.value, line: tok.line, column: tok.column }
        }

        // Interpolated string
        if (tok.type === TokenType.INTERP_START) {
            return this._parseInterpolatedString()
        }

        // List literal: [1, 2, 3]
        if (tok.type === TokenType.LBRACKET) {
            return this._parseListLiteral()
        }

        // Map literal: { key: value }
        if (tok.type === TokenType.LBRACE) {
            return this._parseMapLiteral()
        }

        // Grouped expression: (expr)
        if (tok.type === TokenType.LPAREN) {
            this._advance()
            const expr = this._parseExpression()
            this._expect(TokenType.RPAREN)
            return expr
        }

        // Expect keyword in expression position
        if (tok.type === TokenType.KEYWORD && tok.value === 'expect') {
            return this._parseExpectStatement()
        }

        // AI keywords in expression position
        if (tok.type === TokenType.KEYWORD && (tok.value === 'ask' || tok.value === 'think' || tok.value === 'generate')) {
            return this._parseAIExpression()
        }

        // fetch keyword in expression position
        if (tok.type === TokenType.KEYWORD && tok.value === 'fetch') {
            return this._parseFetchExpression()
        }

        // await keyword in expression position
        if (tok.type === TokenType.KEYWORD && tok.value === 'await') {
            const awaitTok = this._advance()
            const expr = this._parseExpression()
            return {
                type: NodeType.AwaitExpression,
                expression: expr,
                line: awaitTok.line,
                column: awaitTok.column,
            }
        }

        // read keyword in expression position
        if (tok.type === TokenType.KEYWORD && tok.value === 'read') {
            return this._parseReadExpression()
        }

        // Identifier
        if (tok.type === TokenType.IDENTIFIER) {
            this._advance()
            return { type: NodeType.Identifier, name: tok.value, line: tok.line, column: tok.column }
        }

        this._error(tok, `Unexpected token ${tok.type}(${JSON.stringify(tok.value)})`)
    }

    // ── expect x to equal y ──
    _parseExpectStatement() {
        const tok = this._advance() // consume 'expect'
        const actual = this._parseExpression()

        // "expect x to equal y"
        if (this._check(TokenType.KEYWORD, 'to')) {
            this._advance()
            this._expect(TokenType.KEYWORD, 'equal')
            const expected = this._parseExpression()
            this._skipNewlines()
            return {
                type: NodeType.ExpectStatement,
                actual,
                expected,
                line: tok.line,
                column: tok.column,
            }
        }

        // "expect true" — just assert truthiness
        this._skipNewlines()
        return {
            type: NodeType.ExpectStatement,
            actual,
            expected: null,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── AI Expression: ask/think/generate ──
    // Syntax variations:
    //   ask "what is 2+2?"
    //   ask claude.sonnet "what is 2+2?"
    //   ask "translate {text}" as json
    //   think "analyze this data" as json
    //   generate "write a poem about {topic}"
    //   let result = ask "summarize {doc}" as json
    _parseAIExpression() {
        const tok = this._advance() // consume ask/think/generate
        const keyword = tok.value    // 'ask', 'think', or 'generate'

        const nodeTypeMap = {
            'ask': NodeType.AskExpression,
            'think': NodeType.ThinkExpression,
            'generate': NodeType.GenerateExpression,
        }

        // Optional model selector: ask claude.sonnet "..."
        // Detect: next is IDENTIFIER and the token after is STRING or INTERP_START
        let model = null
        if (this._check(TokenType.IDENTIFIER)) {
            // Peek ahead — if after the identifier chain there's a string, it's a model selector
            const savedPos = this.pos
            let modelName = this._advance().value
            // Handle dotted model names: claude.sonnet, gpt.4o
            while (this._check(TokenType.DOT)) {
                this._advance()
                let segment = ''
                // Handle cases like gpt.4o where 4 is NUMBER and o is IDENTIFIER
                if (this._check(TokenType.NUMBER)) {
                    segment += String(this._advance().value)
                }
                if (this._check(TokenType.IDENTIFIER)) {
                    segment += this._advance().value
                }
                if (segment) modelName += '.' + segment
            }
            // If the next token is a string/interp, this was a model selector
            if (this._check(TokenType.STRING) || this._check(TokenType.INTERP_START)) {
                model = modelName
            } else {
                // Not a model selector — rewind
                this.pos = savedPos
            }
        }

        // Prompt expression (required)
        const prompt = this._parseExpression()

        // Optional output format: as json / as list / as text
        let outputFormat = null
        if (this._check(TokenType.KEYWORD, 'as')) {
            this._advance() // consume 'as'
            if (this._check(TokenType.IDENTIFIER) || this._check(TokenType.KEYWORD)) {
                outputFormat = this._advance().value
            }
        }

        return {
            type: nodeTypeMap[keyword],
            model,
            prompt,
            outputFormat,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── fetch expression ──
    // Syntax:
    //   fetch "https://api.example.com/data"
    //   fetch.get "url"
    //   fetch.post "url" with { body: "data" }
    //   fetch "url" as json
    _parseFetchExpression() {
        const tok = this._advance() // consume 'fetch'
        let method = 'get'

        // Optional method selector: fetch.post, fetch.put, etc.
        if (this._check(TokenType.DOT)) {
            this._advance()
            if (this._check(TokenType.IDENTIFIER)) {
                method = this._advance().value
            }
        }

        // URL expression (required)
        const url = this._parseExpression()

        // Optional body: with { ... } or with expr
        let body = null
        if (this._check(TokenType.KEYWORD, 'with')) {
            this._advance()
            body = this._parseExpression()
        }

        // Optional format: as json / as text
        let outputFormat = null
        if (this._check(TokenType.KEYWORD, 'as')) {
            this._advance()
            if (this._check(TokenType.IDENTIFIER) || this._check(TokenType.KEYWORD)) {
                outputFormat = this._advance().value
            }
        }

        return {
            type: NodeType.FetchExpression,
            method,
            url,
            body,
            outputFormat,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── read expression ──
    // Syntax: read "path/to/file"
    _parseReadExpression() {
        const tok = this._advance() // consume 'read'
        const path = this._parseExpression()
        return {
            type: NodeType.ReadExpression,
            path,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── write expression ──
    // Syntax: write "data" to "path/to/file"
    _parseWriteExpression() {
        const tok = this._advance() // consume 'write'
        const data = this._parseExpression()
        this._expect(TokenType.KEYWORD, 'to')
        const path = this._parseExpression()
        return {
            type: NodeType.WriteExpression,
            data,
            path,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── Config block: monitor/heal/optimize/evolve ──
    // Syntax:
    //   monitor:
    //       interval: 5 seconds
    //       dashboard: true
    _parseConfigBlock(nodeType) {
        const tok = this._advance() // consume keyword
        this._expect(TokenType.COLON)
        this._skipNewlines()

        const config = {}

        // Consume INDENT token
        if (this._check(TokenType.INDENT)) {
            this._advance()
        }

        // Parse key-value pairs until DEDENT or EOF
        while (this.pos < this.tokens.length) {
            const next = this._peek()
            if (!next || next.type === TokenType.EOF) break
            if (next.type === TokenType.DEDENT) {
                this._advance()
                break
            }

            if (next.type === TokenType.NEWLINE) {
                this._advance()
                continue
            }

            // Read key: value
            if (next.type === TokenType.IDENTIFIER || next.type === TokenType.KEYWORD) {
                const key = this._advance().value
                if (this._check(TokenType.COLON)) {
                    this._advance() // consume :
                    // Read value tokens until newline or DEDENT
                    let value = ''
                    while (this.pos < this.tokens.length &&
                        !this._check(TokenType.NEWLINE) &&
                        !this._check(TokenType.DEDENT) &&
                        !this._check(TokenType.EOF)) {
                        value += this._advance().value + ' '
                    }
                    config[key] = value.trim()
                } else {
                    // Boolean flag (no value)
                    config[key] = true
                }
            } else {
                this._advance() // skip unexpected tokens
            }
        }

        return {
            type: NodeType[nodeType],
            config,
            line: tok.line,
            column: tok.column,
        }
    }

    // ── Interpolated string: "Hello, {name}!" ──
    _parseInterpolatedString() {
        const start = this._advance() // INTERP_START
        const parts = []

        while (!this._check(TokenType.INTERP_END) && !this._isAtEnd()) {
            if (this._check(TokenType.STRING)) {
                const s = this._advance()
                parts.push({ type: NodeType.StringLiteral, value: s.value, line: s.line, column: s.column })
            } else if (this._check(TokenType.INTERP_EXPR)) {
                const exprToken = this._advance()
                const exprText = exprToken.value
                // Handle expressions: simple identifiers, member access, and arithmetic
                if (exprText.includes(' ')) {
                    // Complex expression like "price * 1.08" — mini-parse it
                    // For now, treat as raw JS expression wrapped in an identifier
                    parts.push({ type: NodeType.Identifier, name: exprText, line: exprToken.line, column: exprToken.column })
                } else if (exprText.includes('.')) {
                    const segments = exprText.split('.')
                    let node = { type: NodeType.Identifier, name: segments[0], line: exprToken.line, column: exprToken.column }
                    for (let i = 1; i < segments.length; i++) {
                        node = { type: NodeType.MemberExpression, object: node, property: segments[i], line: exprToken.line, column: exprToken.column }
                    }
                    parts.push(node)
                } else {
                    parts.push({ type: NodeType.Identifier, name: exprText, line: exprToken.line, column: exprToken.column })
                }
            } else {
                break
            }
        }

        this._expect(TokenType.INTERP_END)
        return { type: NodeType.InterpolatedString, parts, line: start.line, column: start.column }
    }

    _parseListLiteral() {
        const tok = this._advance()
        const elements = []
        while (!this._check(TokenType.RBRACKET) && !this._isAtEnd()) {
            elements.push(this._parseExpression())
            this._match(TokenType.COMMA)
        }
        this._expect(TokenType.RBRACKET)
        return { type: NodeType.ListLiteral, elements, line: tok.line, column: tok.column }
    }

    _parseMapLiteral() {
        const tok = this._advance()
        const entries = []
        while (!this._check(TokenType.RBRACE) && !this._isAtEnd()) {
            const key = this._expect(TokenType.IDENTIFIER)
            this._expect(TokenType.COLON)
            const value = this._parseExpression()
            entries.push({ key: key.value, value })
            this._match(TokenType.COMMA)
        }
        this._expect(TokenType.RBRACE)
        return { type: NodeType.MapLiteral, entries, line: tok.line, column: tok.column }
    }

    _parseTypeAnnotation() {
        const tok = this._current()
        if (tok.type === TokenType.KEYWORD || tok.type === TokenType.IDENTIFIER) {
            const typeName = this._advance()
            // Handle "list of text", "map of number", "maybe text"
            if (typeName.value === 'list' || typeName.value === 'map') {
                if (this._check(TokenType.KEYWORD, 'of')) {
                    this._advance()
                    const innerType = this._parseTypeAnnotation()
                    return { type: NodeType.TypeAnnotation, name: typeName.value, innerType, line: tok.line, column: tok.column }
                }
            }
            if (typeName.value === 'maybe') {
                const innerType = this._parseTypeAnnotation()
                return { type: NodeType.TypeAnnotation, name: 'maybe', innerType, line: tok.line, column: tok.column }
            }
            return { type: NodeType.TypeAnnotation, name: typeName.value, line: tok.line, column: tok.column }
        }
        this._error(tok, 'Expected type name')
    }
}

// ── Convenience function ──
export function parse(tokens, filename) {
    return new Parser(tokens, filename).parse()
}
