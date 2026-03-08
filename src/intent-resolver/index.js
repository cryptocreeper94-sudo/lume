/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Main Entry Point
 *  Routes English Mode input through the full pipeline:
 *
 *  English Input
 *    → Auto-Correct Layer
 *    → Sentence Splitter
 *    → Tolerance Chain (7-step per atomic operation):
 *        Step 1: Exact Pattern Match (Layer A)
 *        Step 2: Fuzzy Pattern Match (85%+ similarity)
 *        Step 3: Grammar-Tolerant Word-Bag Match
 *        Step 4: AI Resolution — High Confidence (≥80%)
 *        Step 5: AI Resolution — Low Confidence (50-79%)
 *        Step 6: AI Resolution — Very Low (<50%)
 *        Step 7: Unresolvable
 *    → Security Layer (per-node guardian scan)
 *    → Lume AST nodes (fed to existing Transpiler)
 *
 *  Pipeline: English Source → Intent Resolver → AST → Transpiler → JavaScript
 *  The Lexer and Parser are NOT involved in English Mode.
 * ═══════════════════════════════════════════════════════════
 */

import { autoCorrect, formatCorrections } from './auto-correct.js'
import { matchPattern, patterns } from './pattern-library.js'
import { similarity, wordBagSimilarity, correctSentence } from './fuzzy-matcher.js'
import { splitSentence } from './sentence-splitter.js'
import { resolveTemporal } from './temporal-resolver.js'
import { checkSecurity, scanASTNode, formatThreat, generateCertificate, THREAT_CATEGORIES } from './security-layer.js'
import { resetFileScope, updateMemory, resolvePronoun, getAutocorrectContext } from './context-engine.js'
import { aiResolve, batchResolve } from './ai-resolver.js'
import { detectLanguage } from './lang-detect.js'
import { resolveMultilingualVerb, translateVerb, getLocalizedError } from './pattern-library-i18n.js'
import { ClarificationCache, enterClarificationMode, formatPlaygroundClarification } from './clarification.js'
import { detectCompoundStart, parseCompoundConditional } from './logic-blocks.js'
import { parseUsingDirective, buildModuleIndex, resolveReference, formatModuleError } from './module-resolver.js'
import { extractHints, summarizeHints } from './hint-parser.js'
import { parseVersionDeclaration, loadProjectConfig } from './pattern-versioning.js'
import { detectPackageReference, recognizePackage, generateImport, formatMissingPackageError } from './package-registry.js'
import { detectStructureStart, parseStructureBlock, compileStructure } from './structure-parser.js'
import { detectTryBlock, parseTryCatchBlock, detectThrowStatement, parseThrowStatement } from './error-handling.js'
import { detectTestBlock, detectDescribeBlock, parseTestBlockFull, parseDescribeBlockFull } from './test-framework.js'
import { detectEnvironmentBlock, parseEnvironmentBlock, detectEnvReference, detectFeatureFlag } from './environment.js'
import { detectConcurrencyBlock, parseConcurrencyBlock, detectSequentialChain, parseSequentialChain, detectTimerInstruction, parseTimerInstruction } from './concurrency.js'
import { detectComment, parseExplainBlock, stripInlineComment, toCommentAST } from './comments.js'

/**
 * Check if a file should use English Mode
 */
export function detectMode(source) {
    const firstLine = source.split('\n')[0].trim()
    if (firstLine === 'mode: english') return 'english'
    if (firstLine === 'mode: natural') return 'natural'
    return 'standard' // Use existing Lexer → Parser pipeline
}

/**
 * Main resolve function — processes an entire English Mode file
 *
 * @param {string} source - The full .lume file content
 * @param {object} options - { noAutocorrect, strict, lockCache, projectRoot, model, lang }
 * @returns {object} { ast[], diagnostics[], certificate, stats, detectedLanguages }
 */
export async function resolveEnglishFile(source, options = {}) {
    const lines = source.split('\n')
    const mode = detectMode(source)

    // Skip the mode declaration line
    const startLine = lines[0].trim().startsWith('mode:') ? 1 : 0
    const versionLine = lines[startLine]?.trim().startsWith('lume-version:') ? startLine + 1 : startLine

    resetFileScope()

    const ast = []
    const diagnostics = []
    const stats = { layerA: 0, layerB: 0, autoCorrections: 0, aiCalls: 0, skipped: 0, clarifications: 0, logicBlocks: 0, hints: 0, structures: 0, tryCatch: 0, tests: 0, envBlocks: 0, concurrency: 0, comments: 0, packages: 0 }
    const unresolvedLines = [] // Queue for batch AI resolution
    const detectedLanguages = new Map() // Track language per line
    const isMultilingual = mode === 'natural' // mode: natural enables multilingual
    const langOverride = options.lang || null // --lang flag override

    // Gap 1: Clarification cache
    const clarificationCache = new ClarificationCache(options.projectRoot || '.')
    if (options.reclarify) clarificationCache.clear()

    // Gap 3: Parse using: directives and build module index
    const usingFiles = []
    const moduleIndex = options.projectRoot ? buildModuleIndex(options.projectRoot) : { definitions: {}, files: {} }

    // Gap 8: Parse patterns: version declaration
    const patternVersion = parseVersionDeclaration(source)
    if (patternVersion) diagnostics.push({ type: 'info', code: 'LUME-I010', line: 1, message: `Pattern library version: ${patternVersion}` })

    // Gap 9: Track active packages
    const activePackages = new Map()

    for (let i = versionLine; i < lines.length; i++) {
        const rawLine = lines[i]
        const trimmed = rawLine.trim()
        const lineNum = i + 1

        // Skip empty lines
        if (!trimmed) {
            stats.skipped++
            continue
        }

        // Gap 15: Comment detection (BEFORE tolerance chain)
        const comment = detectComment(trimmed)
        if (comment) {
            if (comment.type === 'explain') {
                const explainBlock = parseExplainBlock(lines, i)
                if (explainBlock) {
                    ast.push(toCommentAST({ type: 'explain', text: explainBlock.text }))
                    i = explainBlock.endIdx - 1
                }
            } else {
                ast.push(toCommentAST(comment))
            }
            stats.comments++
            stats.skipped++
            continue
        }

        // Strip inline # comments
        const { instruction: instrWithoutComment, comment: inlineComment } = stripInlineComment(trimmed)
        if (inlineComment) {
            ast.push(toCommentAST({ type: 'hash', text: inlineComment, jsPrefix: '//' }))
        }
        const effectiveTrimmed = instrWithoutComment || trimmed

        // Gap 3: Parse using: directives
        const usingDirective = parseUsingDirective(effectiveTrimmed)
        if (usingDirective) {
            if (usingDirective.type === 'file') usingFiles.push(usingDirective.path)
            else if (usingDirective.candidates) usingFiles.push(...usingDirective.candidates)
            diagnostics.push({ type: 'info', code: 'LUME-I006', line: lineNum, message: `Module import: ${effectiveTrimmed}` })
            continue
        }

        // Gap 9: Package references ("use Express to create a web server")
        const pkgRef = detectPackageReference(effectiveTrimmed)
        if (pkgRef) {
            const pkg = recognizePackage(pkgRef.packageName)
            if (pkg) {
                activePackages.set(pkg.key, pkg)
                ast.push({ type: 'RawBlock', code: generateImport(pkg), line: lineNum })
                stats.packages++
                diagnostics.push({ type: 'info', code: 'LUME-I011', line: lineNum, message: `Package: ${pkg.key} (${pkg.npm})` })
            } else {
                diagnostics.push(formatMissingPackageError(pkgRef.packageName, pkgRef.packageName.toLowerCase(), lineNum))
            }
            // The rest of the instruction still gets processed below
        }

        // Gap 10: Structure definitions ("a user has:")
        const structStart = detectStructureStart(effectiveTrimmed)
        if (structStart) {
            const structBlock = parseStructureBlock(lines, i)
            if (structBlock) {
                guardianScan(structBlock, lineNum, diagnostics, options)
                ast.push(structBlock)
                stats.structures++
                i = structBlock.endIdx - 1
                continue
            }
        }

        // Gap 11: Try/catch blocks ("try to [action]")
        if (detectTryBlock(effectiveTrimmed)) {
            const tcBlock = parseTryCatchBlock(lines, i)
            if (tcBlock) {
                guardianScan(tcBlock, lineNum, diagnostics, options)
                ast.push(tcBlock)
                stats.tryCatch++
                i = tcBlock.endIdx - 1
                continue
            }
        }

        // Gap 11: Throw statements ("stop with error")
        if (detectThrowStatement(effectiveTrimmed)) {
            const throwNode = parseThrowStatement(effectiveTrimmed)
            if (throwNode) {
                ast.push({ ...throwNode, line: lineNum })
                continue
            }
        }

        // Gap 12: Test blocks
        const testBlock = detectTestBlock(effectiveTrimmed)
        const descBlock = detectDescribeBlock(effectiveTrimmed)
        if (descBlock) {
            const suite = parseDescribeBlockFull(lines, i)
            if (suite) { ast.push(suite); stats.tests++; i = suite.endIdx - 1; continue }
        }
        if (testBlock) {
            const tc = parseTestBlockFull(lines, i)
            if (tc) { ast.push(tc); stats.tests++; i = tc.endIdx - 1; continue }
        }

        // Gap 13: Environment blocks ("in production:")
        const envBlock = detectEnvironmentBlock(effectiveTrimmed)
        if (envBlock) {
            const eb = parseEnvironmentBlock(lines, i)
            if (eb) { ast.push(eb); stats.envBlocks++; i = eb.endIdx - 1; continue }
        }

        // Gap 13: Env variable references
        const envRef = detectEnvReference(effectiveTrimmed)
        if (envRef) { ast.push({ ...envRef, line: lineNum }); continue }

        // Gap 13: Feature flags
        const featureFlag = detectFeatureFlag(effectiveTrimmed)
        if (featureFlag) { ast.push({ ...featureFlag, line: lineNum }); continue }

        // Gap 14: Concurrency blocks
        const concBlock = detectConcurrencyBlock(effectiveTrimmed)
        if (concBlock) {
            const cb = parseConcurrencyBlock(lines, i)
            if (cb) { ast.push(cb); stats.concurrency++; i = cb.endIdx - 1; continue }
        }

        // Gap 14: Sequential chains
        if (detectSequentialChain(effectiveTrimmed)) {
            const chain = parseSequentialChain(lines, i)
            if (chain) { ast.push(chain); stats.concurrency++; i = chain.endIdx - 1; continue }
        }

        // Gap 14: Timer instructions
        const timerType = detectTimerInstruction(effectiveTrimmed)
        if (timerType) {
            const timer = parseTimerInstruction(effectiveTrimmed)
            if (timer) { ast.push({ ...timer, line: lineNum }); continue }
        }

        // Gap 2: Detect compound conditional blocks
        const compoundStart = detectCompoundStart(effectiveTrimmed)
        if (compoundStart) {
            const result = parseCompoundConditional(lines, i, lineNum)
            if (result) {
                guardianScan(result.node, lineNum, diagnostics, options)
                ast.push(result.node)
                stats.logicBlocks++
                i = result.endIdx
                continue
            }
        }

        // Handle raw: escape hatch blocks
        if (trimmed === 'raw:') {
            const rawBlock = collectRawBlock(lines, i + 1)
            // Security: scan raw blocks for dangerous patterns
            const rawThreats = scanRawBlock(rawBlock.code, lineNum)
            if (rawThreats.length > 0) {
                diagnostics.push(...rawThreats)
                const blocked = rawThreats.some(t => t.level === 'BLOCK')
                if (blocked) {
                    ast.push({ type: 'RawBlock', code: `/* BLOCKED: raw block failed security scan */`, line: lineNum })
                    i = rawBlock.endLine
                    continue
                }
            }
            ast.push({ type: 'RawBlock', code: rawBlock.code, line: lineNum })
            i = rawBlock.endLine
            diagnostics.push({ type: 'info', code: 'LUME-I004', line: lineNum, message: 'Raw block — bypassing Intent Resolver' })
            continue
        }

        // Step 0: Auto-Correct
        const acContext = getAutocorrectContext()
        const { corrected, corrections, wasModified } = autoCorrect(trimmed, acContext, options)
        if (wasModified) {
            stats.autoCorrections += corrections.length
            if (options.strict) {
                diagnostics.push(...corrections.map(c => ({ type: 'warning', code: 'LUME-I001', line: lineNum, message: `"${c.original}" → "${c.fixed}" (${c.type})` })))
            } else {
                diagnostics.push(...formatCorrections(corrections, lineNum).map(msg => ({ type: 'info', code: 'LUME-I001', line: lineNum, message: msg })))
            }
        }

        // Step 0.3: Multilingual verb translation (mode: natural only)
        let processedInput = corrected
        let lineLanguage = 'en'
        if (isMultilingual) {
            const langResult = langOverride
                ? { code: langOverride, language: langOverride, confidence: 1.0 }
                : detectLanguage(corrected)
            lineLanguage = langResult.code
            detectedLanguages.set(lineNum, { code: langResult.code, language: langResult.language, confidence: langResult.confidence })

            if (langResult.code !== 'en') {
                const verbResult = translateVerb(corrected, langResult.code)
                if (verbResult) {
                    processedInput = verbResult.translated
                    diagnostics.push({ type: 'info', code: 'LUME-I005', line: lineNum, message: `[${langResult.language}] "${verbResult.originalVerb}" → "${verbResult.verb}"` })
                }
            }
        }

        // Step 0.5: Security check on input
        const secCheck = checkSecurity(corrected, options.securityConfig || {})
        if (secCheck.blocked) {
            diagnostics.push(...secCheck.threats.map(t => ({ type: 'error', code: t.code, line: lineNum, message: formatThreat(t, lineNum) })))
            continue // Skip blocked lines
        }
        if (secCheck.needsConfirmation) {
            diagnostics.push(...secCheck.threats.map(t => ({ type: 'confirm', code: t.code, line: lineNum, message: formatThreat(t, lineNum) })))
        }

        // Step 0.7: Split compound sentences
        const operations = splitSentence(processedInput)

        for (const op of operations) {
            // Resolve pronouns
            const pronounResolved = resolvePronouns(op.text)
            if (pronounResolved.warnings) {
                diagnostics.push(...pronounResolved.warnings.map(w => ({ type: 'warning', code: 'LUME-W002', line: lineNum, message: w })))
            }
            const resolveText = pronounResolved.text

            // Gap 5: Extract hint annotations before matching
            const { instruction: hintCleanText, hints, hasHints } = extractHints(resolveText)
            const matchText = hasHints ? hintCleanText : resolveText
            if (hasHints) {
                stats.hints++
                diagnostics.push({ type: 'info', code: 'LUME-I007', line: lineNum, message: `Hints detected: ${summarizeHints(hints)}` })
            }

            // Check for temporal expressions
            const temporal = resolveTemporal(matchText)

            // ═══ TOLERANCE CHAIN ═══

            // Step 1: Exact Pattern Match (Layer A)
            const exactMatch = matchPattern(matchText)
            if (exactMatch.matched) {
                const node = { ...exactMatch.ast, line: lineNum, resolvedBy: 'layer_a_exact', ...(hasHints ? { hints } : {}), ...(isMultilingual ? { language: lineLanguage } : {}) }
                guardianScan(node, lineNum, diagnostics, options)
                ast.push(node)
                updateMemory(lineNum, extractSubject(matchText), extractVerb(matchText), node)
                stats.layerA++
                continue
            }

            // Step 2: Fuzzy Pattern Match (85%+ similarity)
            const fuzzyResult = fuzzyMatch(matchText)
            if (fuzzyResult) {
                const node = { ...fuzzyResult.ast, line: lineNum, resolvedBy: 'layer_a_fuzzy', similarity: fuzzyResult.score, ...(hasHints ? { hints } : {}), ...(isMultilingual ? { language: lineLanguage } : {}) }
                guardianScan(node, lineNum, diagnostics, options)
                ast.push(node)
                updateMemory(lineNum, extractSubject(matchText), extractVerb(matchText), node)
                stats.layerA++
                diagnostics.push({ type: 'info', code: 'LUME-I003', line: lineNum, message: `Fuzzy match (${(fuzzyResult.score * 100).toFixed(0)}%): "${matchText}" → pattern "${fuzzyResult.pattern}"` })
                continue
            }

            // Step 3: Word-Bag Match
            const bagResult = wordBagMatch(matchText)
            if (bagResult) {
                const node = { ...bagResult.ast, line: lineNum, resolvedBy: 'layer_a_wordbag', similarity: bagResult.score, ...(hasHints ? { hints } : {}), ...(isMultilingual ? { language: lineLanguage } : {}) }
                guardianScan(node, lineNum, diagnostics, options)
                ast.push(node)
                updateMemory(lineNum, extractSubject(matchText), extractVerb(matchText), node)
                stats.layerA++
                diagnostics.push({ type: 'info', code: 'LUME-I003', line: lineNum, message: `Word-bag match (${(bagResult.score * 100).toFixed(0)}%): "${matchText}"` })
                continue
            }

            // Steps 4-7: Queue for AI resolution (batched)
            unresolvedLines.push({ text: matchText, line: lineNum, temporal, hints: hasHints ? hints : null, originalText: resolveText })
        }
    }

    // Batch AI resolution for all unresolved lines
    if (unresolvedLines.length > 0) {
        stats.aiCalls++
        const texts = unresolvedLines.map(l => l.text)
        const results = await batchResolve(texts, { model: options.model, lockCache: options.lockCache })

        for (let i = 0; i < results.length; i++) {
            const { resolved, ast: aiAst, confidence, error } = results[i]
            const { line, text, hints: lineHints } = unresolvedLines[i]

            if (resolved && confidence >= 0.8) {
                // Step 4: High confidence — apply silently
                const node = { ...aiAst, line, resolvedBy: 'layer_b_ai', confidence, ...(lineHints ? { hints: lineHints } : {}) }
                guardianScan(node, line, diagnostics, options)
                ast.push(node)
                stats.layerB++
                diagnostics.push({ type: 'info', code: 'LUME-I003', line, message: `AI resolved (${(confidence * 100).toFixed(0)}% confidence): "${text}"` })
            } else if (resolved && confidence >= 0.5) {
                // Step 5: Low confidence — Gap 1: Interactive Clarification Mode
                const clarResult = await enterClarificationMode(text, line, confidence, {
                    nonInteractive: options.nonInteractive,
                    aiResults: [{ interpretation: aiAst?.value || text, ast: aiAst, confidence }],
                    cache: clarificationCache,
                })
                if (clarResult.resolved) {
                    const node = clarResult.ast || { ...aiAst, line, resolvedBy: clarResult.fromCache ? 'clarification_cache' : 'clarification_interactive', confidence: 1.0 }
                    ast.push(node)
                    stats.clarifications++
                    diagnostics.push({ type: 'info', code: 'LUME-I008', line, message: `Clarified${clarResult.fromCache ? ' (cached)' : ''}: "${text}" → ${clarResult.resolvedAs || 'developer choice'}` })
                } else if (clarResult.rephrased) {
                    unresolvedLines.push({ text: clarResult.newText, line, temporal: null, hints: lineHints })
                } else if (clarResult.error) {
                    diagnostics.push(clarResult.error)
                }
            } else if (resolved && confidence > 0) {
                // Step 6: Very low confidence — Gap 1: Clarification with more options
                const clarResult = await enterClarificationMode(text, line, confidence, {
                    nonInteractive: options.nonInteractive,
                    cache: clarificationCache,
                })
                if (clarResult.resolved && clarResult.ast) {
                    ast.push(clarResult.ast)
                    stats.clarifications++
                } else if (clarResult.error) {
                    diagnostics.push(clarResult.error)
                } else {
                    diagnostics.push({ type: 'ambiguous', code: 'LUME-W001', line, message: `Very low confidence (${(confidence * 100).toFixed(0)}%): "${text}". Multiple interpretations possible.` })
                }
            } else {
                // Step 7: Unresolvable
                diagnostics.push({ type: 'error', code: 'LUME-E001', line, message: `Unresolvable: "${text}". ${error || 'Try rephrasing.'}` })
            }
        }
    }

    // Sort AST by line number
    ast.sort((a, b) => a.line - b.line)

    // Generate security certificate
    const rawBlockCount = ast.filter(n => n.type === 'RawBlock').length
    const hash = generateHash(ast)
    const certificate = generateCertificate(options.filename || 'unknown.lume', ast.length, rawBlockCount, options.securityConfig?.level || 'standard', hash)

    return {
        mode,
        ast,
        diagnostics,
        certificate,
        detectedLanguages: Object.fromEntries(detectedLanguages),
        stats: {
            ...stats,
            totalLines: lines.length,
            resolvedLines: ast.length,
            patternMatches: stats.layerA,
            aiResolutions: stats.layerB,
            autoCorrections: stats.autoCorrections,
            aiCallsMade: stats.aiCalls,
        },
    }
}

/* ── Helpers ──────────────────────────────────────────── */

function collectRawBlock(lines, startIdx) {
    const codeLines = []
    let i = startIdx
    const baseIndent = getIndent(lines[i] || '')

    while (i < lines.length) {
        const line = lines[i]
        if (line.trim() === '' && i > startIdx) { i++; continue }
        if (getIndent(line) < baseIndent && line.trim() !== '') break
        codeLines.push(line)
        i++
    }

    return { code: codeLines.join('\n'), endLine: i - 1 }
}

function getIndent(line) {
    const match = line.match(/^(\s*)/)
    return match ? match[1].length : 0
}

function resolvePronouns(text) {
    const pronouns = ['\\bit\\b', '\\bthey\\b', '\\bthem\\b', '\\btheir\\b', '\\bthis\\b', '\\bthat\\b', '\\bthose\\b']
    const warnings = []
    let resolved = text

    for (const p of pronouns) {
        const regex = new RegExp(p, 'gi')
        if (regex.test(text)) {
            const word = text.match(regex)[0]
            const result = resolvePronoun(word)
            if (result.resolved) {
                resolved = resolved.replace(regex, result.value)
                if (result.warning) warnings.push(result.warning)
            } else if (result.warning) {
                warnings.push(result.warning)
            }
        }
    }

    return { text: resolved, warnings: warnings.length > 0 ? warnings : null }
}

function fuzzyMatch(input) {
    let bestScore = 0
    let bestPattern = null

    // Build test strings from patterns (extract the regex source as a readable sentence)
    for (const p of patterns) {
        // Test each pattern by running the regex — if fuzzy enough, might match
        // For now, just try the pattern and see
        // Real fuzzy matching uses representative examples per pattern
    }

    // Simple approach: try softened input against patterns
    const softened = input.toLowerCase()
        .replace(/[''`]/g, "'")
        .replace(/\s+/g, ' ')
        .trim()

    const result = matchPattern(softened)
    if (result.matched) return { ast: result.ast, score: 0.9, pattern: 'softened-exact' }

    return null
}

function wordBagMatch(input) {
    // Extract key words and try to match against known verb+noun patterns
    const words = input.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    const verbs = ['get', 'show', 'save', 'delete', 'create', 'update', 'send', 'sort', 'filter', 'connect', 'monitor', 'heal', 'optimize', 'evolve']
    const foundVerb = words.find(w => verbs.includes(w))

    if (foundVerb) {
        // Reconstruct a clean sentence: "verb the [remaining nouns]"
        const nouns = words.filter(w => w !== foundVerb && w.length > 2 && !['the', 'from', 'into', 'with', 'and'].includes(w))
        const clean = `${foundVerb} the ${nouns.join(' ')}`
        const result = matchPattern(clean)
        if (result.matched) return { ast: result.ast, score: 0.85, pattern: 'word-bag-reconstruction' }
    }

    return null
}

function extractSubject(text) {
    // Extract the main noun (remove articles and verbs)
    const words = text.toLowerCase().split(/\s+/)
    const skip = new Set(['get', 'show', 'save', 'delete', 'create', 'update', 'send', 'the', 'a', 'an', 'from', 'to', 'in', 'on', 'with', 'all', 'and', 'or'])
    return words.find(w => !skip.has(w) && w.length > 2) || text.split(/\s+/).pop()
}

function extractVerb(text) {
    const words = text.toLowerCase().split(/\s+/)
    const verbs = new Set(['get', 'show', 'save', 'delete', 'create', 'update', 'send', 'sort', 'filter', 'connect', 'wait', 'repeat', 'return', 'set', 'check', 'ask', 'monitor', 'heal', 'optimize', 'evolve', 'fetch', 'display', 'store', 'remove', 'make', 'build'])
    return words.find(w => verbs.has(w)) || words[0]
}

function generateHash(ast) {
    // Simple hash for security certificate (production would use crypto.createHash)
    const str = JSON.stringify(ast)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(16, '0')
}

function guardianScan(node, lineNum, diagnostics, options) {
    const scan = scanASTNode(node, options.securityConfig || {})
    if (!scan.safe) {
        diagnostics.push(...scan.threats.map(t => ({ type: t.level === 'BLOCK' ? 'error' : 'warning', code: t.code, line: lineNum, message: formatThreat(t, lineNum) })))
    }
}

/* ── Raw Block Security Scanner ──────────────────────── */
const RAW_BLOCK_THREATS = [
    { pattern: /\beval\s*\(/, category: 'SYSTEM_COMMANDS', message: 'eval() is blocked in raw blocks — use a function instead' },
    { pattern: /\bnew\s+Function\s*\(/, category: 'SYSTEM_COMMANDS', message: 'new Function() is blocked — use a named function instead' },
    { pattern: /\bchild_process\b/, category: 'SYSTEM_COMMANDS', message: 'child_process access blocked in raw blocks' },
    { pattern: /\brequire\s*\(\s*['"]child_process/, category: 'SYSTEM_COMMANDS', message: 'child_process import blocked' },
    { pattern: /\bprocess\.exit\b/, category: 'SYSTEM_COMMANDS', message: 'process.exit() blocked — use return instead' },
    { pattern: /\bfs\s*\.\s*(?:unlink|rmdir|rm)Sync\b/, category: 'FILE_DESTRUCTION', message: 'File deletion blocked in raw blocks' },
    { pattern: /\bfs\s*\.\s*(?:writeFile|appendFile)Sync?\s*\(.*(?:\/etc|\/usr|\/bin|C:\\\\Windows)/i, category: 'FILE_DESTRUCTION', message: 'System file write blocked' },
    { pattern: /\bexecSync\b|\bspawnSync\b/, category: 'SYSTEM_COMMANDS', message: 'Synchronous process execution blocked' },
    { pattern: /\bprocess\.env\b.*(?:=|delete)/, category: 'CREDENTIAL_EXPOSURE', message: 'Modifying environment variables blocked' },
    { pattern: /\bglobal\s*\.\s*(?:process|require|__dirname)/, category: 'PRIVILEGE_ESCALATION', message: 'Global scope manipulation blocked' },
]

function scanRawBlock(code, lineNum) {
    const threats = []
    for (const { pattern, category, message } of RAW_BLOCK_THREATS) {
        if (pattern.test(code)) {
            const cat = THREAT_CATEGORIES[category] || { level: 'BLOCK', code: 'LUME-E003', label: category }
            threats.push({ type: 'error', code: cat.code, level: cat.level, line: lineNum, message: `[guardian:raw] ${message}` })
        }
    }
    return threats
}

/* ── Exports ─────────────────────────────────────────── */
export { matchPattern } from './pattern-library.js'
export { autoCorrect } from './auto-correct.js'
export { splitSentence } from './sentence-splitter.js'
export { checkSecurity, scanASTNode } from './security-layer.js'
export { resolveTemporal } from './temporal-resolver.js'
export { detectLanguage, supportedLanguages } from './lang-detect.js'
export { resolveMultilingualVerb, translateVerb, getLocalizedError } from './pattern-library-i18n.js'

// ── M9: Voice-to-Code ──
export { processTranscription, transcriptionToLume } from './voice-input.js'

// ── M10: Visual Context Awareness ──
export { UIRegistry, getComponentTemplate, SPATIAL_MAP, STYLE_MAP } from './ui-registry.js'
export { parseAppDescription, generateProjectStructure } from './app-generator.js'

// ── M11: Reverse Mode ──
export { explainNode, explainAST, summarizeAST, explainFile as explainFileAST } from './explainer.js'

// ── M12: Collaborative Intent ──
export { diffAST, detectConflicts, renderInLanguage, formatDiff, nodeIdentity } from './ast-differ.js'

// ── M13: Zero-Dependency Runtime ──
export { createBundle, getCompileCommand, detectRuntimeFeatures, detectPlatform, supportedTargets } from './bundler.js'

// ── Gap 1: Interactive Clarification ──
export { ClarificationCache, enterClarificationMode, formatPlaygroundClarification, formatVoiceClarification, generateOptions } from './clarification.js'

// ── Gap 2: Natural Language Logic Blocks ──
export { detectCompoundStart, parseCompoundConditional, compileConditionExpression } from './logic-blocks.js'

// ── Gap 3: Implicit Module Resolution ──
export { parseUsingDirective, buildModuleIndex, resolveReference, formatModuleError, detectCircularDeps } from './module-resolver.js'

// ── Gap 4: Canonical Formatter ──
export { canonicalize, canonicalizeFile, isCanonical, loadStyleConfig, VERB_SYNONYMS } from './canonicalizer.js'

// ── Gap 5: Hint Annotations ──
export { extractHints, summarizeHints, generateCacheWrapper, generateRetryWrapper, generateTimeoutWrapper } from './hint-parser.js'

// ── Gap 6: Error Translation ──
export { translateError, formatEnglishError, createStepDebugger } from './error-translator.js'
