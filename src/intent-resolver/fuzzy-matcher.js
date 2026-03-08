/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Fuzzy Matcher
 *  Levenshtein distance, word-bag matching, phonetic matching,
 *  common misspelling dictionary
 * ═══════════════════════════════════════════════════════════
 */

/* ── Levenshtein Distance ────────────────────────────── */
export function levenshtein(a, b) {
    const la = a.length, lb = b.length
    const dp = Array.from({ length: la + 1 }, (_, i) => {
        const row = new Array(lb + 1)
        row[0] = i
        return row
    })
    for (let j = 1; j <= lb; j++) dp[0][j] = j
    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
    }
    return dp[la][lb]
}

/**
 * Similarity ratio: 0.0 (completely different) to 1.0 (identical)
 */
export function similarity(a, b) {
    if (a === b) return 1.0
    const maxLen = Math.max(a.length, b.length)
    if (maxLen === 0) return 1.0
    return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen
}

/* ── Word-Bag Matching ───────────────────────────────── */
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'it', 'its', 'this', 'that', 'these', 'those',
    'i', 'me', 'my', 'we', 'our', 'you', 'your',
    'and', 'or', 'but', 'so', 'if', 'then', 'than',
    'just', 'please', 'also', 'too', 'very', 'really',
])

export function extractKeyWords(sentence) {
    return sentence.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w))
}

/**
 * Word-bag similarity: ratio of shared key words
 */
export function wordBagSimilarity(a, b) {
    const wordsA = new Set(extractKeyWords(a))
    const wordsB = new Set(extractKeyWords(b))
    if (wordsA.size === 0 || wordsB.size === 0) return 0
    let shared = 0
    for (const w of wordsA) if (wordsB.has(w)) shared++
    return (shared * 2) / (wordsA.size + wordsB.size)
}

/* ── Phonetic Matching (Soundex) ─────────────────────── */
export function soundex(word) {
    const s = word.toUpperCase()
    const map = {
        B: 1, F: 1, P: 1, V: 1, C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2,
        D: 3, T: 3, L: 4, M: 5, N: 5, R: 6
    }
    let result = s[0]
    let prev = map[s[0]] || 0
    for (let i = 1; i < s.length && result.length < 4; i++) {
        const code = map[s[i]] || 0
        if (code && code !== prev) result += code
        prev = code
    }
    return result.padEnd(4, '0')
}

export function phoneticMatch(a, b) {
    return soundex(a) === soundex(b)
}

/* ── Common Misspelling Dictionary ───────────────────── */
export const commonMisspellings = {
    // Programming terms
    'fucntion': 'function', 'funtion': 'function', 'funciton': 'function', 'functoin': 'function',
    'retrun': 'return', 'reutrn': 'return', 'retrn': 'return',
    'varibale': 'variable', 'varialbe': 'variable', 'varaiable': 'variable',
    'databse': 'database', 'datbase': 'database', 'databas': 'database', 'dataase': 'database',
    'paramter': 'parameter', 'paramater': 'parameter', 'paraemter': 'parameter',
    'arguemnt': 'argument', 'arguement': 'argument', 'arugment': 'argument',
    'statment': 'statement', 'statemnt': 'statement',
    'condtion': 'condition', 'conditon': 'condition',
    'iteraton': 'iteration', 'iteraion': 'iteration',
    'complie': 'compile', 'comiple': 'compile',
    'exectue': 'execute', 'execut': 'execute',
    'initalize': 'initialize', 'initalise': 'initialize', 'initailize': 'initialize',
    'autheticate': 'authenticate', 'athenticate': 'authenticate',
    'authroize': 'authorize', 'authoirze': 'authorize',
    'repsonse': 'response', 'resonse': 'response',
    'reqeust': 'request', 'requets': 'request', 'reuqest': 'request',
    'templete': 'template', 'tempalte': 'template',
    'depenency': 'dependency', 'dependancy': 'dependency',
    'configration': 'configuration', 'configuraion': 'configuration',
    'improt': 'import', 'ipmort': 'import',
    'exprot': 'export', 'exoprt': 'export',
    'asnyc': 'async', 'aysnc': 'async', 'asynch': 'async',
    // Common verbs
    'delte': 'delete', 'deleet': 'delete', 'dleete': 'delete',
    'udpate': 'update', 'upadte': 'update', 'updae': 'update',
    'craete': 'create', 'cretae': 'create', 'creat': 'create',
    'shwo': 'show', 'hsow': 'show', 'sohw': 'show',
    'svae': 'save', 'saev': 'save',
    'sned': 'send', 'sedn': 'send',
    'conect': 'connect', 'connetc': 'connect',
    'recieve': 'receive', 'recive': 'receive',
    'occured': 'occurred', 'occured': 'occurred',
    'seperate': 'separate', 'seprate': 'separate',
    'neccessary': 'necessary', 'necesary': 'necessary',
    'environemnt': 'environment', 'enviroment': 'environment',
    'mesage': 'message', 'messgae': 'message',
    'adress': 'address', 'adres': 'address',
    // Common nouns
    'usr': 'user', 'uer': 'user',
    'buttn': 'button', 'buton': 'button',
    'scren': 'screen', 'screne': 'screen',
    'serach': 'search', 'saerch': 'search',
    'reslut': 'result', 'resutl': 'result',
    'erorr': 'error', 'eror': 'error',
    'colum': 'column', 'coulmn': 'column',
    'pasword': 'password', 'passowrd': 'password',
    'emial': 'email', 'emal': 'email',
    'nubmer': 'number', 'numbre': 'number',
    'stirng': 'string', 'strign': 'string',
    'arry': 'array', 'aray': 'array',
    'obejct': 'object', 'ojbect': 'object',
    'elment': 'element', 'elemnt': 'element',
    'floder': 'folder', 'fodler': 'folder',
    'flie': 'file', 'fiel': 'file',
}

/* ── Contraction Normalization ───────────────────────── */
export const contractions = {
    "dont": "don't", "doesnt": "doesn't", "didnt": "didn't",
    "cant": "can't", "couldnt": "couldn't", "shouldnt": "shouldn't",
    "wouldnt": "wouldn't", "wont": "won't", "isnt": "isn't",
    "arent": "aren't", "wasnt": "wasn't", "werent": "weren't",
    "hasnt": "hasn't", "havent": "haven't", "hadnt": "hadn't",
    "ive": "I've", "youve": "you've", "weve": "we've", "theyve": "they've",
    "im": "I'm", "youre": "you're", "were": "we're", "theyre": "they're",
    "its": "it's", "thats": "that's", "whats": "what's", "whos": "who's",
    "hes": "he's", "shes": "she's", "lets": "let's",
}

/**
 * Correct a single word using the misspelling dictionary and contractions.
 * Returns { corrected: string, wasCorrected: boolean }
 */
export function correctWord(word) {
    const lower = word.toLowerCase()
    if (commonMisspellings[lower]) return { corrected: commonMisspellings[lower], wasCorrected: true }
    if (contractions[lower]) return { corrected: contractions[lower], wasCorrected: true }
    return { corrected: word, wasCorrected: false }
}

/**
 * Correct all words in a sentence.
 * Returns { corrected: string, corrections: Array<{original, fixed}> }
 */
export function correctSentence(sentence) {
    const corrections = []
    const words = sentence.split(/(\s+)/)
    const corrected = words.map(w => {
        if (/^\s+$/.test(w)) return w
        const { corrected: fixed, wasCorrected } = correctWord(w)
        if (wasCorrected) corrections.push({ original: w, fixed })
        return wasCorrected ? fixed : w
    }).join('')
    return { corrected, corrections }
}

/**
 * Find the best fuzzy match for an input against a list of reference strings.
 * Returns the best match if similarity >= threshold, otherwise null.
 */
export function findBestMatch(input, references, threshold = 0.85) {
    let best = null
    let bestScore = 0
    for (const ref of references) {
        const score = similarity(input, ref)
        if (score > bestScore) {
            bestScore = score
            best = ref
        }
    }
    if (bestScore >= threshold) return { match: best, score: bestScore }

    // Fallback to word-bag matching
    let bestBag = null
    let bestBagScore = 0
    for (const ref of references) {
        const score = wordBagSimilarity(input, ref)
        if (score > bestBagScore) {
            bestBagScore = score
            bestBag = ref
        }
    }
    if (bestBagScore >= threshold) return { match: bestBag, score: bestBagScore, method: 'word-bag' }
    return null
}
