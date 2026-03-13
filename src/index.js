/**
 * ═══════════════════════════════════════════════════════════
 *  LUME COMPILER — Main Entry Point
 *  @lume/compiler
 *
 *  Usage:
 *    import { tokenize, parse, transpile, compile } from '@lume/compiler'
 *    import { resolveIntent } from '@lume/compiler'
 *
 *  Pipeline:
 *    Source → Lexer → Parser → AST → Transpiler → JavaScript
 *    English Source → Intent Resolver → AST → Transpiler → JavaScript
 * ═══════════════════════════════════════════════════════════
 */

// ── Core Compiler Pipeline ──
export { tokenize } from './lexer.js'
export { parse, NodeType } from './parser.js'
export { transpile } from './transpiler.js'

// ── Formatting & Linting ──
export { format } from './formatter.js'
export { lint } from './linter.js'

// ── Standard Library ──
export { stdlib } from './stdlib.js'

// ── Intent Resolver (English Mode) ──
export { resolveEnglishFile } from './intent-resolver/index.js'
export { matchPattern, patterns } from './intent-resolver/pattern-library.js'
export { autoCorrect } from './intent-resolver/auto-correct.js'
export { checkSecurity, scanASTNode, scanGeneratedCode, checkAIRateLimit, fullSecurityAudit } from './intent-resolver/security-layer.js'
export { detectLanguage } from './intent-resolver/lang-detect.js'

// ── M9-M13 Modules ──
export { processTranscription } from './intent-resolver/voice-input.js'
export { parseAppDescription, generateProjectStructure } from './intent-resolver/app-generator.js'
export { explainCode } from './intent-resolver/explainer.js'
export { diffASTs } from './intent-resolver/ast-differ.js'
export { createBundle } from './intent-resolver/bundler.js'

// ── Error Formatting ──
export { formatError, didYouMean } from './error-formatter.js'

// ── Convenience ──
import { tokenize as _tokenize } from './lexer.js'
import { parse as _parse } from './parser.js'
import { transpile as _transpile } from './transpiler.js'
import { resolveIntent as _resolveIntent } from './intent-resolver/index.js'

/**
 * Compile Lume source to JavaScript in one step.
 * @param {string} source - Lume source code
 * @param {string} [filename='<input>'] - Filename for error messages
 * @returns {string} JavaScript output
 */
export function compile(source, filename = '<input>') {
    // Check for English Mode
    const firstLine = source.split('\n')[0].trim().toLowerCase()
    if (firstLine === 'mode: english' || firstLine === 'mode: natural') {
        const result = _resolveIntent(source, filename)
        return _transpile(result.ast, filename)
    }

    const tokens = _tokenize(source, filename)
    const ast = _parse(tokens, filename)
    return _transpile(ast, filename)
}
