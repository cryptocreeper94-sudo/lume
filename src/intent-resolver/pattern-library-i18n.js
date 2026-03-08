/**
 * ═══════════════════════════════════════════════════════════
 *  LUME INTENT RESOLVER — Internationalized Pattern Library
 *  Translates multilingual verbs to canonical English verbs
 *  and provides localized pattern matching for 10 languages.
 *
 *  These synonym rings mirror the English rings in 
 *  pattern-library.js, mapping each language's verbs to
 *  the canonical English key used by the Tolerance Chain.
 * ═══════════════════════════════════════════════════════════
 */

/* ── Multilingual Synonym Rings ─────────────────────── */

/**
 * Maps localized verbs → canonical English verb.
 * Keyed by ISO 639-1 language code.
 * The English ring is in pattern-library.js — not duplicated here.
 */
export const multilingualSynonyms = {
    // ── Spanish ──
    es: {
        // get
        'obtener': 'get', 'conseguir': 'get', 'traer': 'get', 'buscar': 'get',
        'recuperar': 'get', 'sacar': 'get', 'tomar': 'get', 'leer': 'get',
        'cargar': 'get', 'acceder': 'get',
        // show
        'mostrar': 'show', 'ver': 'show', 'presentar': 'show', 'visualizar': 'show',
        'exhibir': 'show', 'enseñar': 'show', 'imprimir': 'show',
        // save
        'guardar': 'save', 'almacenar': 'save', 'grabar': 'save', 'salvar': 'save',
        'conservar': 'save', 'archivar': 'save', 'registrar': 'save',
        // delete
        'eliminar': 'delete', 'borrar': 'delete', 'quitar': 'delete', 'suprimir': 'delete',
        'remover': 'delete', 'limpiar': 'delete',
        // create
        'crear': 'create', 'hacer': 'create', 'generar': 'create', 'construir': 'create',
        'añadir': 'create', 'agregar': 'create', 'fabricar': 'create',
        // update
        'actualizar': 'update', 'modificar': 'update', 'cambiar': 'update',
        'editar': 'update', 'ajustar': 'update', 'renovar': 'update',
        // send
        'enviar': 'send', 'mandar': 'send', 'despachar': 'send', 'transmitir': 'send',
        'remitir': 'send', 'emitir': 'send',
        // filter
        'filtrar': 'filter', 'seleccionar': 'filter', 'escoger': 'filter', 'elegir': 'filter',
        // sort
        'ordenar': 'sort', 'clasificar': 'sort', 'organizar': 'sort',
        // connect
        'conectar': 'connect', 'enlazar': 'connect', 'vincular': 'connect',
        // wait
        'esperar': 'wait', 'pausar': 'wait', 'demorar': 'wait',
        // repeat
        'repetir': 'repeat', 'iterar': 'repeat',
        // navigate
        'navegar': 'navigate', 'ir': 'navigate', 'redirigir': 'navigate',
        // monitor
        'monitorear': 'monitor', 'vigilar': 'monitor', 'supervisar': 'monitor',
        // calculate
        'calcular': 'calculate', 'computar': 'calculate', 'sumar': 'calculate',
    },

    // ── French ──
    fr: {
        // get
        'obtenir': 'get', 'chercher': 'get', 'récupérer': 'get', 'trouver': 'get',
        'charger': 'get', 'lire': 'get', 'accéder': 'get', 'prendre': 'get',
        // show
        'afficher': 'show', 'montrer': 'show', 'présenter': 'show', 'voir': 'show',
        'visualiser': 'show', 'imprimer': 'show', 'révéler': 'show',
        // save
        'sauvegarder': 'save', 'enregistrer': 'save', 'garder': 'save',
        'conserver': 'save', 'stocker': 'save', 'archiver': 'save',
        // delete
        'supprimer': 'delete', 'effacer': 'delete', 'enlever': 'delete',
        'retirer': 'delete', 'détruire': 'delete', 'nettoyer': 'delete',
        // create
        'créer': 'create', 'faire': 'create', 'générer': 'create', 'construire': 'create',
        'ajouter': 'create', 'fabriquer': 'create', 'bâtir': 'create',
        // update
        'mettre à jour': 'update', 'modifier': 'update', 'changer': 'update',
        'éditer': 'update', 'ajuster': 'update', 'réviser': 'update',
        // send
        'envoyer': 'send', 'expédier': 'send', 'transmettre': 'send',
        'diffuser': 'send', 'émettre': 'send',
        // filter
        'filtrer': 'filter', 'sélectionner': 'filter', 'choisir': 'filter', 'trier': 'filter',
        // sort
        'trier': 'sort', 'ordonner': 'sort', 'classer': 'sort', 'ranger': 'sort',
        // connect
        'connecter': 'connect', 'relier': 'connect', 'lier': 'connect',
        // wait
        'attendre': 'wait', 'patienter': 'wait',
        // repeat
        'répéter': 'repeat', 'refaire': 'repeat',
        // navigate
        'naviguer': 'navigate', 'aller': 'navigate', 'rediriger': 'navigate',
        // monitor
        'surveiller': 'monitor', 'observer': 'monitor', 'suivre': 'monitor',
        // calculate
        'calculer': 'calculate', 'compter': 'calculate', 'additionner': 'calculate',
    },

    // ── German ──
    de: {
        // get
        'abrufen': 'get', 'holen': 'get', 'bekommen': 'get', 'erhalten': 'get',
        'laden': 'get', 'lesen': 'get', 'finden': 'get', 'suchen': 'get',
        // show
        'anzeigen': 'show', 'zeigen': 'show', 'darstellen': 'show', 'ausgeben': 'show',
        'drucken': 'show', 'präsentieren': 'show',
        // save
        'speichern': 'save', 'sichern': 'save', 'aufbewahren': 'save',
        'ablegen': 'save', 'archivieren': 'save',
        // delete
        'löschen': 'delete', 'entfernen': 'delete', 'beseitigen': 'delete',
        'vernichten': 'delete', 'bereinigen': 'delete',
        // create
        'erstellen': 'create', 'erzeugen': 'create', 'anlegen': 'create',
        'bauen': 'create', 'hinzufügen': 'create', 'generieren': 'create',
        // update
        'aktualisieren': 'update', 'ändern': 'update', 'bearbeiten': 'update',
        'modifizieren': 'update', 'anpassen': 'update',
        // send
        'senden': 'send', 'schicken': 'send', 'versenden': 'send',
        'übertragen': 'send', 'aussenden': 'send',
        // filter
        'filtern': 'filter', 'auswählen': 'filter', 'selektieren': 'filter',
        // sort
        'sortieren': 'sort', 'ordnen': 'sort', 'einordnen': 'sort',
        // connect
        'verbinden': 'connect', 'anschließen': 'connect', 'verknüpfen': 'connect',
        // wait
        'warten': 'wait', 'pausieren': 'wait',
        // repeat
        'wiederholen': 'repeat',
        // navigate
        'navigieren': 'navigate', 'umleiten': 'navigate', 'gehen': 'navigate',
        // monitor
        'überwachen': 'monitor', 'beobachten': 'monitor', 'verfolgen': 'monitor',
        // calculate
        'berechnen': 'calculate', 'ausrechnen': 'calculate', 'zählen': 'calculate',
    },

    // ── Portuguese ──
    pt: {
        // get
        'obter': 'get', 'buscar': 'get', 'pegar': 'get', 'recuperar': 'get',
        'carregar': 'get', 'ler': 'get', 'acessar': 'get', 'encontrar': 'get',
        // show
        'mostrar': 'show', 'exibir': 'show', 'apresentar': 'show', 'imprimir': 'show',
        'visualizar': 'show', 'ver': 'show',
        // save
        'salvar': 'save', 'guardar': 'save', 'armazenar': 'save',
        'gravar': 'save', 'preservar': 'save', 'registrar': 'save',
        // delete
        'excluir': 'delete', 'apagar': 'delete', 'remover': 'delete',
        'eliminar': 'delete', 'limpar': 'delete', 'destruir': 'delete',
        // create
        'criar': 'create', 'fazer': 'create', 'gerar': 'create', 'construir': 'create',
        'adicionar': 'create', 'montar': 'create',
        // update
        'atualizar': 'update', 'modificar': 'update', 'alterar': 'update',
        'editar': 'update', 'ajustar': 'update',
        // send
        'enviar': 'send', 'mandar': 'send', 'transmitir': 'send', 'despachar': 'send',
        // filter
        'filtrar': 'filter', 'selecionar': 'filter', 'escolher': 'filter',
        // sort
        'ordenar': 'sort', 'classificar': 'sort', 'organizar': 'sort',
        // connect
        'conectar': 'connect', 'ligar': 'connect', 'vincular': 'connect',
        // wait
        'esperar': 'wait', 'aguardar': 'wait', 'pausar': 'wait',
        // repeat
        'repetir': 'repeat', 'iterar': 'repeat',
        // navigate
        'navegar': 'navigate', 'ir': 'navigate', 'redirecionar': 'navigate',
        // monitor
        'monitorar': 'monitor', 'acompanhar': 'monitor', 'supervisionar': 'monitor',
        // calculate
        'calcular': 'calculate', 'computar': 'calculate', 'somar': 'calculate',
    },

    // ── Japanese ──
    ja: {
        // get
        '取得する': 'get', '取得': 'get', '得る': 'get', '取る': 'get',
        '読み込む': 'get', '検索する': 'get', '見つける': 'get',
        '読む': 'get', 'ロードする': 'get',
        // show
        '表示する': 'show', '表示': 'show', '見せる': 'show', '出力する': 'show',
        '示す': 'show', '印刷する': 'show', 'プリントする': 'show',
        // save
        '保存する': 'save', '保存': 'save', '格納する': 'save',
        '記録する': 'save', '蓄える': 'save',
        // delete
        '削除する': 'delete', '削除': 'delete', '消す': 'delete',
        '除去する': 'delete', 'クリアする': 'delete',
        // create
        '作成する': 'create', '作成': 'create', '作る': 'create', '生成する': 'create',
        '追加する': 'create', '構築する': 'create',
        // update
        '更新する': 'update', '更新': 'update', '変更する': 'update',
        '編集する': 'update', '修正する': 'update',
        // send
        '送信する': 'send', '送信': 'send', '送る': 'send', '発信する': 'send',
        '転送する': 'send',
        // filter
        'フィルターする': 'filter', 'フィルタする': 'filter', '絞り込む': 'filter',
        '選択する': 'filter', '選ぶ': 'filter',
        // sort
        'ソートする': 'sort', '並べ替える': 'sort', '整列する': 'sort', '順序付ける': 'sort',
        // connect
        '接続する': 'connect', '接続': 'connect', 'つなぐ': 'connect', '連結する': 'connect',
        // wait
        '待つ': 'wait', '待機する': 'wait', '一時停止する': 'wait',
        // repeat
        '繰り返す': 'repeat', 'リピートする': 'repeat',
        // navigate
        '移動する': 'navigate', 'ナビゲートする': 'navigate', 'リダイレクトする': 'navigate',
        // monitor
        '監視する': 'monitor', '追跡する': 'monitor', '観察する': 'monitor',
        // calculate
        '計算する': 'calculate', '算出する': 'calculate',
    },

    // ── Mandarin Chinese ──
    zh: {
        // get
        '获取': 'get', '得到': 'get', '取得': 'get', '拿到': 'get',
        '读取': 'get', '查找': 'get', '搜索': 'get', '加载': 'get',
        // show
        '显示': 'show', '展示': 'show', '呈现': 'show', '输出': 'show',
        '打印': 'show', '看': 'show',
        // save
        '保存': 'save', '存储': 'save', '存': 'save', '记录': 'save',
        '写入': 'save', '储存': 'save',
        // delete
        '删除': 'delete', '移除': 'delete', '清除': 'delete',
        '去掉': 'delete', '消除': 'delete',
        // create
        '创建': 'create', '新建': 'create', '生成': 'create', '制作': 'create',
        '添加': 'create', '建立': 'create',
        // update
        '更新': 'update', '修改': 'update', '编辑': 'update', '变更': 'update',
        '调整': 'update',
        // send
        '发送': 'send', '传送': 'send', '寄送': 'send', '传输': 'send',
        // filter
        '过滤': 'filter', '筛选': 'filter', '选择': 'filter', '挑选': 'filter',
        // sort
        '排序': 'sort', '排列': 'sort', '整理': 'sort',
        // connect
        '连接': 'connect', '接入': 'connect', '链接': 'connect',
        // wait
        '等待': 'wait', '暂停': 'wait',
        // repeat
        '重复': 'repeat', '循环': 'repeat',
        // navigate
        '导航': 'navigate', '跳转': 'navigate', '重定向': 'navigate',
        // monitor
        '监控': 'monitor', '监视': 'monitor', '追踪': 'monitor',
        // calculate
        '计算': 'calculate', '算': 'calculate',
    },

    // ── Hindi ──
    hi: {
        // get
        'प्राप्त': 'get', 'लाना': 'get', 'पाना': 'get', 'लेना': 'get',
        'खोजना': 'get', 'पढ़ना': 'get', 'लोड': 'get',
        // show
        'दिखाना': 'show', 'प्रदर्शित': 'show', 'देखना': 'show',
        'दर्शाना': 'show', 'छापना': 'show',
        // save
        'सहेजना': 'save', 'बचाना': 'save', 'संग्रहित': 'save',
        'रखना': 'save', 'सुरक्षित': 'save',
        // delete
        'हटाना': 'delete', 'मिटाना': 'delete', 'निकालना': 'delete',
        'साफ': 'delete',
        // create
        'बनाना': 'create', 'तैयार': 'create', 'निर्माण': 'create',
        'जोड़ना': 'create', 'उत्पन्न': 'create',
        // update
        'अपडेट': 'update', 'बदलना': 'update', 'संशोधित': 'update',
        'संपादित': 'update',
        // send
        'भेजना': 'send', 'प्रेषित': 'send', 'डालना': 'send',
        // filter
        'छानना': 'filter', 'चुनना': 'filter',
        // sort
        'क्रमबद्ध': 'sort', 'व्यवस्थित': 'sort',
        // connect
        'जोड़ना': 'connect', 'कनेक्ट': 'connect',
        // wait
        'प्रतीक्षा': 'wait', 'रुकना': 'wait',
        // repeat
        'दोहराना': 'repeat',
        // navigate
        'जाना': 'navigate',
        // monitor
        'निगरानी': 'monitor',
        // calculate
        'गणना': 'calculate', 'जोड़ना': 'calculate',
    },

    // ── Arabic ──
    ar: {
        // get
        'الحصول': 'get', 'جلب': 'get', 'استرجاع': 'get', 'قراءة': 'get',
        'تحميل': 'get', 'بحث': 'get', 'إيجاد': 'get',
        // show
        'عرض': 'show', 'إظهار': 'show', 'طباعة': 'show',
        'تقديم': 'show', 'إخراج': 'show',
        // save
        'حفظ': 'save', 'تخزين': 'save', 'تسجيل': 'save',
        'كتابة': 'save',
        // delete
        'حذف': 'delete', 'إزالة': 'delete', 'مسح': 'delete',
        'تنظيف': 'delete',
        // create
        'إنشاء': 'create', 'صنع': 'create', 'توليد': 'create',
        'بناء': 'create', 'إضافة': 'create',
        // update
        'تحديث': 'update', 'تعديل': 'update', 'تغيير': 'update',
        'تحرير': 'update',
        // send
        'إرسال': 'send', 'نقل': 'send', 'بث': 'send',
        // filter
        'تصفية': 'filter', 'اختيار': 'filter', 'انتقاء': 'filter',
        // sort
        'ترتيب': 'sort', 'تنظيم': 'sort', 'تصنيف': 'sort',
        // connect
        'اتصال': 'connect', 'ربط': 'connect', 'توصيل': 'connect',
        // wait
        'انتظار': 'wait', 'توقف': 'wait',
        // repeat
        'تكرار': 'repeat',
        // navigate
        'انتقال': 'navigate', 'توجيه': 'navigate',
        // monitor
        'مراقبة': 'monitor', 'متابعة': 'monitor',
        // calculate
        'حساب': 'calculate',
    },

    // ── Korean ──
    ko: {
        // get
        '가져오다': 'get', '가져오기': 'get', '얻다': 'get', '찾다': 'get',
        '불러오다': 'get', '읽다': 'get', '로드': 'get', '검색': 'get',
        // show
        '보여주다': 'show', '표시': 'show', '표시하다': 'show', '출력': 'show',
        '출력하다': 'show', '인쇄': 'show',
        // save
        '저장': 'save', '저장하다': 'save', '보관': 'save', '기록': 'save',
        // delete
        '삭제': 'delete', '삭제하다': 'delete', '제거': 'delete', '지우다': 'delete',
        // create
        '생성': 'create', '생성하다': 'create', '만들다': 'create', '추가': 'create',
        '추가하다': 'create',
        // update
        '업데이트': 'update', '수정': 'update', '수정하다': 'update', '변경': 'update',
        '편집': 'update',
        // send
        '보내다': 'send', '보내기': 'send', '전송': 'send', '발송': 'send',
        // filter
        '필터': 'filter', '필터링': 'filter', '선택': 'filter', '고르다': 'filter',
        // sort
        '정렬': 'sort', '정렬하다': 'sort', '배열': 'sort',
        // connect
        '연결': 'connect', '연결하다': 'connect', '접속': 'connect',
        // wait
        '기다리다': 'wait', '대기': 'wait',
        // repeat
        '반복': 'repeat', '반복하다': 'repeat',
        // navigate
        '이동': 'navigate', '이동하다': 'navigate',
        // monitor
        '모니터링': 'monitor', '감시': 'monitor', '추적': 'monitor',
        // calculate
        '계산': 'calculate', '계산하다': 'calculate',
    },
}

/* ── Verb Resolution ─────────────────────────────────── */

/**
 * Resolve a verb from any supported language to its canonical English verb.
 * Checks all language synonym rings.
 *
 * @param {string} word - The verb to resolve (any language)
 * @param {string} [langCode] - Optional language hint to check first
 * @returns {{ verb: string, language: string } | null}
 */
export function resolveMultilingualVerb(word, langCode = null) {
    const normalized = word.toLowerCase().trim()

    // If a language hint is given, check that first
    if (langCode && multilingualSynonyms[langCode]) {
        const result = multilingualSynonyms[langCode][normalized]
        if (result) return { verb: result, language: langCode }
    }

    // Search all languages
    for (const [lang, rings] of Object.entries(multilingualSynonyms)) {
        const result = rings[normalized]
        if (result) return { verb: result, language: lang }
    }

    return null
}

/**
 * Translate a natural language sentence by replacing the leading verb
 * with the canonical English verb. Leaves the rest of the sentence
 * in its original language (the pattern matcher handles noun extraction).
 *
 * @param {string} sentence - The input sentence
 * @param {string} langCode - The detected language code
 * @returns {{ translated: string, verb: string, originalVerb: string } | null}
 */
export function translateVerb(sentence, langCode) {
    if (!langCode || langCode === 'en') return null

    const rings = multilingualSynonyms[langCode]
    if (!rings) return null

    // For CJK languages (no word separators), use PREFIX matching
    const cjkLangs = new Set(['ja', 'zh', 'ko'])
    if (cjkLangs.has(langCode)) {
        // Sort verbs by length (longest first) to match greedily
        const verbs = Object.keys(rings).sort((a, b) => b.length - a.length)
        for (const verb of verbs) {
            if (sentence.startsWith(verb)) {
                const rest = sentence.slice(verb.length).trim()
                return {
                    translated: `${rings[verb]} ${rest}`.trim(),
                    verb: rings[verb],
                    originalVerb: verb,
                }
            }
        }
        return null
    }

    // For Latin-script languages, split by whitespace
    const words = sentence.split(/\s+/)

    // Try progressively longer word sequences (for multi-word verbs like "mettre à jour")
    for (let len = Math.min(3, words.length); len >= 1; len--) {
        const candidate = words.slice(0, len).join(' ').toLowerCase()
        const english = rings[candidate]
        if (english) {
            const rest = words.slice(len).join(' ')
            return {
                translated: `${english} ${rest}`.trim(),
                verb: english,
                originalVerb: candidate,
            }
        }
    }

    return null
}

/* ── Localized Articles and Stop Words ───────────────── */

/**
 * Stop words to strip per language before pattern matching.
 * These are articles, prepositions, and filler that don't affect intent.
 */
export const localizedStopWords = {
    en: new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'up', 'its']),
    es: new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'en', 'con', 'por', 'para', 'su', 'sus']),
    fr: new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux', 'en', 'dans', 'avec', 'par', 'pour', 'sur', 'son', 'sa', 'ses']),
    de: new Set(['der', 'die', 'das', 'ein', 'eine', 'den', 'dem', 'des', 'von', 'zu', 'mit', 'auf', 'für', 'an', 'in', 'aus', 'am', 'im']),
    pt: new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'com', 'por', 'para', 'seu', 'sua']),
    ja: new Set(['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'も', 'な', 'か', 'れ', 'さ']),
    zh: new Set(['的', '了', '着', '过', '把', '被', '让', '给', '向', '从', '在', '到', '是']),
    hi: new Set(['का', 'के', 'की', 'में', 'से', 'को', 'पर', 'और', 'या', 'एक', 'यह', 'वह']),
    ar: new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'أن', 'ما', 'هذا', 'هذه', 'ال']),
    ko: new Set(['의', '에', '를', '을', '이', '가', '은', '는', '에서', '으로', '와', '과', '도']),
}

/**
 * Strip localized stop words from a sentence.
 *
 * @param {string} sentence - The input sentence
 * @param {string} langCode - The language code
 * @returns {string} The sentence with stop words removed
 */
export function stripStopWords(sentence, langCode) {
    const stops = localizedStopWords[langCode]
    if (!stops) return sentence

    return sentence.split(/\s+/)
        .filter(w => !stops.has(w.toLowerCase()))
        .join(' ')
}

/* ── Error Messages ──────────────────────────────────── */

/**
 * Localized error message templates.
 * Used to return compiler errors in the developer's language.
 */
export const errorMessages = {
    en: {
        unresolvable: (input) => `Could not understand: "${input}". Try rephrasing.`,
        lowConfidence: (input, suggestion) => `I think you mean: ${suggestion}. Is that right?`,
        blocked: (reason) => `Blocked by security layer: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    es: {
        unresolvable: (input) => `No se pudo entender: "${input}". Intente reformular.`,
        lowConfidence: (input, suggestion) => `Creo que quieres decir: ${suggestion}. ¿Es correcto?`,
        blocked: (reason) => `Bloqueado por la capa de seguridad: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    fr: {
        unresolvable: (input) => `Impossible de comprendre : "${input}". Essayez de reformuler.`,
        lowConfidence: (input, suggestion) => `Je pense que vous voulez dire : ${suggestion}. Est-ce correct ?`,
        blocked: (reason) => `Bloqué par la couche de sécurité : ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    de: {
        unresolvable: (input) => `Konnte nicht verstanden werden: "${input}". Versuchen Sie es umzuformulieren.`,
        lowConfidence: (input, suggestion) => `Ich glaube, Sie meinen: ${suggestion}. Ist das richtig?`,
        blocked: (reason) => `Blockiert durch Sicherheitsschicht: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    pt: {
        unresolvable: (input) => `Não foi possível entender: "${input}". Tente reformular.`,
        lowConfidence: (input, suggestion) => `Acho que você quer dizer: ${suggestion}. Está correto?`,
        blocked: (reason) => `Bloqueado pela camada de segurança: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    ja: {
        unresolvable: (input) => `理解できませんでした: "${input}"。言い換えてみてください。`,
        lowConfidence: (input, suggestion) => `おそらく次の意味だと思います: ${suggestion}。正しいですか？`,
        blocked: (reason) => `セキュリティレイヤーによりブロックされました: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    zh: {
        unresolvable: (input) => `无法理解: "${input}"。请尝试重新表述。`,
        lowConfidence: (input, suggestion) => `我认为您的意思是: ${suggestion}。对吗？`,
        blocked: (reason) => `被安全层阻止: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    hi: {
        unresolvable: (input) => `समझ नहीं आया: "${input}"। कृपया दोबारा प्रयास करें।`,
        lowConfidence: (input, suggestion) => `मुझे लगता है आपका मतलब है: ${suggestion}। क्या यह सही है?`,
        blocked: (reason) => `सुरक्षा परत द्वारा अवरुद्ध: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    ar: {
        unresolvable: (input) => `تعذر الفهم: "${input}". حاول إعادة الصياغة.`,
        lowConfidence: (input, suggestion) => `أعتقد أنك تقصد: ${suggestion}. هل هذا صحيح؟`,
        blocked: (reason) => `محظور بواسطة طبقة الأمان: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
    ko: {
        unresolvable: (input) => `이해할 수 없습니다: "${input}". 다시 표현해 주세요.`,
        lowConfidence: (input, suggestion) => `다음을 의미하는 것 같습니다: ${suggestion}. 맞습니까?`,
        blocked: (reason) => `보안 레이어에 의해 차단됨: ${reason}`,
        correction: (original, fixed) => `"${original}" → "${fixed}"`,
    },
}

/**
 * Get a localized error message.
 *
 * @param {string} langCode - The language code
 * @param {string} key - The error key
 * @param  {...any} args - Arguments to the message template
 * @returns {string}
 */
export function getLocalizedError(langCode, key, ...args) {
    const messages = errorMessages[langCode] || errorMessages.en
    const fn = messages[key]
    return fn ? fn(...args) : errorMessages.en[key](...args)
}
