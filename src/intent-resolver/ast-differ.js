/**
 * ═══════════════════════════════════════════════════════════
 *  LUME — AST-Level Differ (M12 Phase A)
 *  Computes semantic diffs between Lume AST trees.
 *
 *  Purpose:
 *    - Git merge driver for multi-language Lume files
 *    - Cross-language conflict detection (same AST node = real conflict)
 *    - "View in my language" — render shared AST in user's preferred language
 *
 *  Diff types:
 *    - ADD:    Node exists in B but not A
 *    - REMOVE: Node exists in A but not B
 *    - MODIFY: Node exists in both but has changes
 *    - MOVE:   Node with same identity moved position
 * ═══════════════════════════════════════════════════════════
 */

/* ── Node Identity ────────────────────────────────────── */

/**
 * Compute a stable identity hash for an AST node.
 * Two nodes with the same identity represent the "same" logical unit
 * across different file versions.
 *
 * @param {object} node - AST node
 * @returns {string} Identity string
 */
export function nodeIdentity(node) {
    if (!node) return 'null'

    switch (node.type) {
        case 'FunctionDeclaration':
            return `fn:${node.name}`
        case 'LetDeclaration':
        case 'DefineDeclaration':
            return `var:${node.name}`
        case 'TypeDeclaration':
            return `type:${node.name}`
        case 'TestBlock':
            return `test:${node.name}`
        case 'UseStatement':
            return `use:${node.source}`
        case 'ExportStatement':
            return `export:${node.declaration?.name || 'anon'}`
        case 'ShowStatement':
        case 'LogStatement':
            return `${node.type}:L${node.line}`
        default:
            // For unnamed nodes, use type + line as identity
            return `${node.type}:L${node.line || '?'}`
    }
}

/* ── AST Diff Computation ─────────────────────────────── */

/**
 * @typedef {object} DiffEntry
 * @property {'add'|'remove'|'modify'|'move'} type
 * @property {string} identity - Node identity
 * @property {object} [nodeA] - Node from version A (old)
 * @property {object} [nodeB] - Node from version B (new)
 * @property {string[]} [changes] - Description of modifications
 * @property {number} [lineA] - Line in version A
 * @property {number} [lineB] - Line in version B
 */

/**
 * Compute the AST-level diff between two AST arrays.
 *
 * @param {object[]} astA - AST body from version A (old)
 * @param {object[]} astB - AST body from version B (new)
 * @returns {DiffEntry[]} Array of diff entries
 */
export function diffAST(astA, astB) {
    const nodesA = astA.body || astA
    const nodesB = astB.body || astB

    // Build identity maps
    const mapA = new Map()
    const mapB = new Map()

    for (let i = 0; i < nodesA.length; i++) {
        const id = nodeIdentity(nodesA[i])
        mapA.set(id, { node: nodesA[i], index: i })
    }

    for (let i = 0; i < nodesB.length; i++) {
        const id = nodeIdentity(nodesB[i])
        mapB.set(id, { node: nodesB[i], index: i })
    }

    const diffs = []

    // Find removed nodes (in A but not B)
    for (const [id, { node, index }] of mapA) {
        if (!mapB.has(id)) {
            diffs.push({
                type: 'remove',
                identity: id,
                nodeA: node,
                lineA: node.line || index + 1,
            })
        }
    }

    // Find added nodes (in B but not A)
    for (const [id, { node, index }] of mapB) {
        if (!mapA.has(id)) {
            diffs.push({
                type: 'add',
                identity: id,
                nodeB: node,
                lineB: node.line || index + 1,
            })
        }
    }

    // Find modified and moved nodes (in both)
    for (const [id, entryB] of mapB) {
        const entryA = mapA.get(id)
        if (!entryA) continue

        const changes = detectChanges(entryA.node, entryB.node)

        // Check for position change
        if (entryA.index !== entryB.index) {
            diffs.push({
                type: 'move',
                identity: id,
                nodeA: entryA.node,
                nodeB: entryB.node,
                lineA: entryA.node.line || entryA.index + 1,
                lineB: entryB.node.line || entryB.index + 1,
                changes,
            })
        } else if (changes.length > 0) {
            diffs.push({
                type: 'modify',
                identity: id,
                nodeA: entryA.node,
                nodeB: entryB.node,
                lineA: entryA.node.line || entryA.index + 1,
                lineB: entryB.node.line || entryB.index + 1,
                changes,
            })
        }
    }

    return diffs
}

/* ── Change Detection ─────────────────────────────────── */

/**
 * Detect specific changes between two versions of the same node.
 *
 * @param {object} nodeA - Old version
 * @param {object} nodeB - New version
 * @returns {string[]} List of change descriptions
 */
function detectChanges(nodeA, nodeB) {
    const changes = []

    // Compare common properties
    const compareKeys = ['name', 'value', 'source', 'target', 'entity', 'destination']

    for (const key of compareKeys) {
        if (key in nodeA && key in nodeB) {
            const a = typeof nodeA[key] === 'object' ? JSON.stringify(nodeA[key]) : nodeA[key]
            const b = typeof nodeB[key] === 'object' ? JSON.stringify(nodeB[key]) : nodeB[key]
            if (a !== b) {
                changes.push(`${key}: "${a}" → "${b}"`)
            }
        }
    }

    // Compare bodies (function/block bodies)
    if (nodeA.body && nodeB.body) {
        if (Array.isArray(nodeA.body) && Array.isArray(nodeB.body)) {
            if (nodeA.body.length !== nodeB.body.length) {
                changes.push(`body: ${nodeA.body.length} statements → ${nodeB.body.length} statements`)
            }
        }
    }

    // Compare params
    if (nodeA.params && nodeB.params) {
        const paramsA = nodeA.params.map(p => p.name).join(',')
        const paramsB = nodeB.params.map(p => p.name).join(',')
        if (paramsA !== paramsB) {
            changes.push(`params: (${paramsA}) → (${paramsB})`)
        }
    }

    // Compare conditions
    if (nodeA.condition && nodeB.condition) {
        const condA = JSON.stringify(nodeA.condition)
        const condB = JSON.stringify(nodeB.condition)
        if (condA !== condB) {
            changes.push('condition: modified')
        }
    }

    return changes
}

/* ── Conflict Detection ───────────────────────────────── */

/**
 * Detect real conflicts between two sets of diffs.
 * A conflict occurs when both sides modify the same node identity.
 *
 * @param {DiffEntry[]} diffsOurs - Our changes
 * @param {DiffEntry[]} diffsTheirs - Their changes
 * @returns {{ conflicts: Array, safeOurs: Array, safeTheirs: Array }}
 */
export function detectConflicts(diffsOurs, diffsTheirs) {
    const ourIds = new Map()
    const theirIds = new Map()

    for (const diff of diffsOurs) ourIds.set(diff.identity, diff)
    for (const diff of diffsTheirs) theirIds.set(diff.identity, diff)

    const conflicts = []
    const safeOurs = []
    const safeTheirs = []

    // Find conflicts: same identity modified by both sides
    for (const [id, ourDiff] of ourIds) {
        const theirDiff = theirIds.get(id)
        if (theirDiff) {
            // Both sides changed the same node — CONFLICT
            if (ourDiff.type === 'modify' && theirDiff.type === 'modify') {
                conflicts.push({
                    identity: id,
                    ours: ourDiff,
                    theirs: theirDiff,
                    resolution: 'manual', // Requires human resolution
                })
            } else {
                // One add + one remove = conflict
                // Both remove = safe (same intent)
                if (ourDiff.type === 'remove' && theirDiff.type === 'remove') {
                    safeOurs.push(ourDiff) // Both agree — no conflict
                } else {
                    conflicts.push({
                        identity: id,
                        ours: ourDiff,
                        theirs: theirDiff,
                        resolution: 'manual',
                    })
                }
            }
        } else {
            safeOurs.push(ourDiff)
        }
    }

    // Their-only changes are always safe
    for (const [id, theirDiff] of theirIds) {
        if (!ourIds.has(id)) {
            safeTheirs.push(theirDiff)
        }
    }

    return { conflicts, safeOurs, safeTheirs }
}

/* ── Cross-Language View ──────────────────────────────── */

/**
 * Re-render an AST in a user's preferred language.
 * Uses the multilingual synonym rings from M8 to translate
 * English Mode AST nodes back into localized natural language.
 *
 * @param {object[]} ast - Array of AST nodes
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr')
 * @returns {string[]} Array of natural language lines in the target language
 */
export function renderInLanguage(ast, targetLang) {
    const nodes = ast.body || ast

    // Reverse verb map: English canonical → localized verb
    const reverseMap = buildReverseVerbMap(targetLang)

    return nodes.map(node => {
        const verb = nodeToVerb(node)
        const localizedVerb = reverseMap[verb] || verb
        const description = nodeToDescription(node)
        return `${localizedVerb} ${description}`.trim()
    })
}

function nodeToVerb(node) {
    const verbMap = {
        'ShowStatement': 'show',
        'VariableAccess': 'get',
        'StoreOperation': 'save',
        'DeleteOperation': 'delete',
        'CreateOperation': 'create',
        'UpdateOperation': 'update',
        'SendOperation': 'send',
        'FilterOperation': 'filter',
        'SortOperation': 'sort',
        'NavigateOperation': 'navigate',
        'LetDeclaration': 'set',
        'FunctionDeclaration': 'define',
    }
    return verbMap[node.type] || node.type?.toLowerCase() || ''
}

function nodeToDescription(node) {
    if (node.name) return node.name
    if (node.target) return node.target
    if (node.entity) return node.entity
    if (node.source) return node.source
    if (node.value?.value) return String(node.value.value)
    return ''
}

// Build reverse map from English → localized
function buildReverseVerbMap(langCode) {
    // Hardcoded reverse maps for common languages
    const maps = {
        'es': { 'get': 'obtener', 'show': 'mostrar', 'save': 'guardar', 'delete': 'eliminar', 'create': 'crear', 'send': 'enviar', 'update': 'actualizar', 'set': 'establecer', 'define': 'definir', 'filter': 'filtrar', 'sort': 'ordenar', 'navigate': 'navegar' },
        'fr': { 'get': 'obtenir', 'show': 'afficher', 'save': 'sauvegarder', 'delete': 'supprimer', 'create': 'créer', 'send': 'envoyer', 'update': 'mettre à jour', 'set': 'définir', 'define': 'définir', 'filter': 'filtrer', 'sort': 'trier', 'navigate': 'naviguer' },
        'de': { 'get': 'abrufen', 'show': 'anzeigen', 'save': 'speichern', 'delete': 'löschen', 'create': 'erstellen', 'send': 'senden', 'update': 'aktualisieren', 'set': 'setzen', 'define': 'definieren', 'filter': 'filtern', 'sort': 'sortieren', 'navigate': 'navigieren' },
        'pt': { 'get': 'obter', 'show': 'mostrar', 'save': 'salvar', 'delete': 'excluir', 'create': 'criar', 'send': 'enviar', 'update': 'atualizar', 'set': 'definir', 'define': 'definir', 'filter': 'filtrar', 'sort': 'ordenar', 'navigate': 'navegar' },
        'ja': { 'get': '取得する', 'show': '表示する', 'save': '保存する', 'delete': '削除する', 'create': '作成する', 'send': '送信する', 'update': '更新する', 'set': '設定する', 'define': '定義する', 'filter': 'フィルターする', 'sort': '並び替える', 'navigate': 'ナビゲートする' },
        'zh': { 'get': '获取', 'show': '显示', 'save': '保存', 'delete': '删除', 'create': '创建', 'send': '发送', 'update': '更新', 'set': '设置', 'define': '定义', 'filter': '筛选', 'sort': '排序', 'navigate': '导航' },
    }
    return maps[langCode] || {}
}

/* ── Diff Formatting ──────────────────────────────────── */

/**
 * Format diffs into a human-readable string.
 *
 * @param {DiffEntry[]} diffs - Array of diff entries
 * @returns {string} Formatted diff output
 */
export function formatDiff(diffs) {
    if (diffs.length === 0) return 'No changes detected.'

    const lines = [`${diffs.length} change(s) detected:\n`]

    for (const diff of diffs) {
        switch (diff.type) {
            case 'add':
                lines.push(`+ [ADD]    ${diff.identity} (line ${diff.lineB || '?'})`)
                break
            case 'remove':
                lines.push(`- [REMOVE] ${diff.identity} (was line ${diff.lineA || '?'})`)
                break
            case 'modify':
                lines.push(`~ [MODIFY] ${diff.identity}`)
                for (const change of diff.changes) {
                    lines.push(`    ${change}`)
                }
                break
            case 'move':
                lines.push(`↕ [MOVE]   ${diff.identity} (line ${diff.lineA} → ${diff.lineB})`)
                if (diff.changes?.length > 0) {
                    for (const change of diff.changes) {
                        lines.push(`    ${change}`)
                    }
                }
                break
        }
    }

    return lines.join('\n')
}
