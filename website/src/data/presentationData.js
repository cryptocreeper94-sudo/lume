/**
 * Lume Enterprise Presentation — Scene Data
 * 30 slides, 7 acts
 */

export const presentationActs = [
  { number: 1, name: 'The Vision' },
  { number: 2, name: 'Core Language' },
  { number: 3, name: 'Security & Reliability' },
  { number: 4, name: 'Developer Experience' },
  { number: 5, name: 'Ecosystem' },
  { number: 6, name: 'By The Numbers' },
  { number: 7, name: 'What\'s Next' },
]

export const presentationScenes = [
  // ── ACT 1: THE VISION ────────────────────────────
  {
    id: 1, act: 'The Vision', actNumber: 1,
    title: 'The Gap Between Intent and Code',
    subtitle: 'Why Lume exists',
    narration: 'Every programmer has the same experience — you know exactly what you want the machine to do, but you have to translate that thought into an arbitrary, unforgiving syntax. That translation step is where bugs are born, where beginners give up, and where productivity dies.',
    duration: 18, icon: 'Heart', visualType: 'intro',
    content: {
      headline: 'The Gap Between Intent and Code',
      subheadline: 'What if your code understood what you meant?',
      bullets: [
        'Every programming language in history has asked humans to think like machines — to translate their natural intent into rigid, arbitrary syntax.',
        'That translation gap costs the industry $312 billion annually in debugging alone. It locks out 99% of the population who can think logically but can\'t type semicolons.',
        'What if a language could meet you where you are?',
        'What if you could write code the way you think — in English, in Spanish, in Japanese — or even by speaking out loud?',
        'This is Lume.',
      ],
    },
  },
  {
    id: 2, act: 'The Vision', actNumber: 1,
    title: 'LUME', subtitle: 'The AI-Native Programming Language',
    narration: 'Lume is the first programming language where AI is syntax, English is code, and your voice is a compiler.',
    duration: 7, icon: 'Zap', visualType: 'hero',
    content: { headline: 'LUME', subheadline: 'The AI-Native Programming Language' },
  },
  {
    id: 3, act: 'The Vision', actNumber: 1,
    title: 'The Cost of Cognitive Distance',
    subtitle: 'What every developer loses today',
    narration: 'We call it cognitive distance — the gap between what you intend and what you must type. Lume is the first language engineered to minimize it.',
    duration: 9, icon: 'TrendingDown', visualType: 'stats',
    content: {
      stats: [
        { value: '312', label: 'Billion Lost to Debugging Annually', prefix: '$', suffix: 'B' },
        { value: '50', label: 'Developer Time Spent Debugging', suffix: '%' },
        { value: '99', label: 'Population Locked Out of Coding', suffix: '%' },
        { value: '70', label: 'Bugs from Translation Errors', suffix: '%' },
        { value: '15', label: 'Languages Learned Before Productive', suffix: '+' },
        { value: '0', label: 'Languages That Accept English', suffix: '' },
      ],
    },
  },
  {
    id: 4, act: 'The Vision', actNumber: 1,
    title: 'One Language. Every Mode. Every Human.',
    subtitle: 'Complete cognitive bridge',
    narration: 'Lume doesn\'t just support AI — it\'s built from AI. Six unique capabilities that no other language offers, unified in a single compiler.',
    duration: 10, icon: 'Layers', visualType: 'bento',
    content: {
      features: [
        { icon: 'Brain', title: 'AI as Syntax', description: 'ask, think, and generate are keywords — not library calls. AI is embedded in the grammar itself.', image: '/demo/ai-keywords.png' },
        { icon: 'FileText', title: 'English Mode', description: 'Write code in plain English sentences. 102+ deterministic patterns resolve without AI.', image: '/demo/english-scroll.png' },
        { icon: 'Globe', title: 'Multilingual', description: 'Write in any of 10 human languages — Spanish, French, Japanese, Chinese, Korean, and more.', image: '/demo/multilingual-globe.png' },
        { icon: 'Mic', title: 'Voice-to-Code', description: 'Speak your code. Lume compiles speech to running programs with homophone resolution and filler stripping.', image: '/demo/voice-wave.png' },
        { icon: 'RefreshCw', title: 'Self-Sustaining Runtime', description: 'Programs monitor, heal, optimize, and evolve themselves autonomously at runtime.', image: '/demo/self-healing.png' },
        { icon: 'Shield', title: 'Certified-at-Birth Security', description: '11 threat categories scanned at compile time. Security certificates embedded in output.', image: '/demo/shield-guardian.png' },
      ],
    },
  },

  // ── ACT 2: CORE LANGUAGE ────────────────────────────
  {
    id: 5, act: 'Core Language', actNumber: 2,
    title: 'Clean, Readable Syntax',
    subtitle: 'Designed for humans first',
    narration: 'Lume\'s syntax reads like a conversation. Variables, functions, loops, and conditions — all as intuitive as speaking.',
    duration: 9, icon: 'Code', visualType: 'feature',
    content: {
      headline: 'Syntax That Thinks Like You',
      subheadline: 'No semicolons. No curly braces. Just intent.',
      features: [
        { icon: 'Hash', title: 'Natural Declarations', description: 'let name = "World" — clean, minimal, no type ceremony when you don\'t need it.' },
        { icon: 'Braces', title: 'Indentation-Based Blocks', description: 'Colon-and-indent structure. No curly braces. No end keywords. Python-like clarity.' },
        { icon: 'ArrowRight', title: 'Typed Functions', description: 'to greet(name: text) -> text: — English-like function signatures with full type safety.' },
        { icon: 'Repeat', title: 'Natural Loops', description: 'for i in 1 to 10 and while/repeat — intuitive iteration that reads like instructions.' },
      ],
    },
  },
  {
    id: 6, act: 'Core Language', actNumber: 2,
    title: 'AI as a First-Class Keyword',
    subtitle: 'ask gpt4 is a language construct',
    narration: 'In every other language, AI requires importing SDKs, managing API keys, parsing JSON, and handling retries. In Lume, it\'s one line.',
    duration: 9, icon: 'Brain', visualType: 'feature',
    content: {
      headline: 'AI Without the SDK',
      subheadline: 'Three keywords that replace 200 lines of boilerplate.',
      features: [
        { icon: 'MessageSquare', title: 'ask', description: 'let answer = ask gpt4 "Summarize this" — synchronous AI call, one line, result as text.', image: '/demo/ai-keywords.png' },
        { icon: 'Lightbulb', title: 'think', description: 'let ideas = think claude "Generate names" — creative generation with system prompt tuning.' },
        { icon: 'Wand', title: 'generate', description: 'let code = generate "a REST API" — scaffolds entire code structures from natural language.' },
        { icon: 'ShieldCheck', title: 'Graceful Degradation', description: 'No API key? Lume returns a structured hint instead of crashing. Always safe.' },
      ],
    },
  },
  {
    id: 7, act: 'Core Language', actNumber: 2,
    title: 'English Mode',
    subtitle: '102+ patterns that compile without AI',
    narration: 'English Mode is Lume\'s signature innovation. Write instructions in plain English — the compiler resolves them deterministically through a 7-layer tolerance chain.',
    duration: 10, icon: 'FileText', visualType: 'feature',
    content: {
      headline: 'Write Code in Plain English',
      subheadline: 'mode: english — and your sentences become programs.',
      features: [
        { icon: 'Zap', title: '102+ Deterministic Patterns', description: '"create a list called users" → let users = []. "show the total" → console.log(total). No AI needed.', image: '/demo/english-scroll.png' },
        { icon: 'Layers', title: '7-Layer Tolerance Chain', description: 'Exact match → synonym rings → canonical verbs → fuzzy matching → context engine → clarification → AI fallback.' },
        { icon: 'ArrowRightLeft', title: 'Canonical Verb System', description: '30 synonym rings: "grab", "fetch", "obtain", "retrieve" all map to "get". Natural vocabulary, precise code.' },
        { icon: 'Sparkles', title: 'Auto-Correct', description: 'Misspellings, abbreviations, and informal language all resolve. "shw" → "show". "del" → "delete".' },
      ],
    },
  },
  {
    id: 8, act: 'Core Language', actNumber: 2,
    title: 'Write in Any Language',
    subtitle: '10 human languages supported',
    narration: 'A developer in Tokyo can write Lume in Japanese. A student in Madrid in Spanish. Lume\'s multilingual engine maps verbs across 10 languages with localized stop words and error messages.',
    duration: 8, icon: 'Globe', visualType: 'bento',
    content: {
      features: [
        { icon: 'Globe', title: 'Spanish', description: '"mostrar los datos" → resolves to "show". Full verb synonym rings for crear, obtener, guardar, borrar.' },
        { icon: 'Globe', title: 'French', description: '"supprimer les fichiers" → resolves to "delete". Supports compound verbs like "mettre à jour".' },
        { icon: 'Globe', title: 'Japanese', description: '"表示する" → resolves to "show". Full verb mappings for 作成, 取得, 保存, 削除, 送信.' },
        { icon: 'Globe', title: 'German', description: '"erstellen" → resolves to "create". Plus Portuguese, Chinese, Korean, Arabic, and Hindi.' },
        { icon: 'Globe', title: 'Localized Errors', description: 'Error messages in all 10 languages. Spanish developer sees Spanish errors. Japanese sees Japanese.' },
        { icon: 'Globe', title: 'Stop Word Stripping', description: 'Language-specific stop words removed before resolution. "el", "の", "das" — all handled.' },
      ],
    },
  },
  {
    id: 9, act: 'Core Language', actNumber: 2,
    title: 'Voice-to-Code',
    subtitle: 'Speak. Compile. Run.',
    narration: 'Lume is the first language where voice input is architecturally natural — not an afterthought. The tolerance chain was designed from day one to handle the imprecision of speech.',
    duration: 9, icon: 'Mic', visualType: 'workflow',
    content: {
      steps: [
        { step: 1, title: 'Speak Your Intent', description: 'Use the browser microphone or CLI to dictate code. "Create a list called users and add three items."', icon: 'Mic', image: '/demo/voice-wave.png' },
        { step: 2, title: 'Filler Stripping', description: '"Um, like, create a variable" → "create a variable". 20 filler words removed automatically.', icon: 'Filter' },
        { step: 3, title: 'Homophone Resolution', description: '"right the file" → "write the file". 10 homophone pairs resolved by context.', icon: 'ArrowRightLeft' },
        { step: 4, title: 'Compile & Run', description: 'Cleaned transcription flows through the standard intent resolver. Same 7-layer tolerance chain. Same precision.', icon: 'Play' },
      ],
    },
  },

  // ── ACT 3: SECURITY & RELIABILITY ────────────────────────────
  {
    id: 10, act: 'Security & Reliability', actNumber: 3,
    title: 'The 7-Layer Tolerance Chain',
    subtitle: 'From human thought to machine code, safely',
    narration: 'When Lume receives an English instruction, it passes through seven layers of resolution — each more sophisticated than the last. This is how imprecise human language becomes precise machine code.',
    duration: 10, icon: 'Layers', visualType: 'workflow',
    content: {
      steps: [
        { step: 1, title: 'Exact Pattern Match', description: '102+ patterns checked first. Instant resolution. Zero ambiguity.', icon: 'Target' },
        { step: 2, title: 'Synonym Ring Lookup', description: '30 verb synonym rings: "grab" → "get", "remove" → "delete". Natural vocabulary mapped.', icon: 'RefreshCw' },
        { step: 3, title: 'Canonical Verb Resolution', description: 'All verbs normalized to canonical forms for consistent AST generation.', icon: 'Hash' },
        { step: 4, title: 'Fuzzy Matching', description: 'Levenshtein distance matching. "shw" → "show". Handles typos and abbreviations.', icon: 'Search' },
        { step: 5, title: 'Context Engine', description: 'Recent variables, models, and functions inform resolution. Pronoun resolution via context.', icon: 'Brain' },
        { step: 6, title: 'Interactive Clarification', description: 'If confidence is low, Lume asks the developer to clarify. Caches the answer for next time.', icon: 'HelpCircle' },
        { step: 7, title: 'AI Fallback', description: 'GPT-4o resolves truly ambiguous input. Structured AST output. Rate-limited. Compile-locked.', icon: 'Sparkles' },
      ],
    },
  },
  {
    id: 11, act: 'Security & Reliability', actNumber: 3,
    title: 'Guardian Scanner',
    subtitle: '11 threat categories, 3 layers of defense',
    narration: 'Lume\'s Guardian Scanner runs at compile time — not runtime. Every line of input and every line of output is scanned for 11 categories of threats before code ever executes.',
    duration: 9, icon: 'Shield', visualType: 'bento',
    content: {
      features: [
        { icon: 'Trash2', title: 'File Destruction', description: 'Blocks rm -rf, file deletion, and disk wipe commands at the AST level.', image: '/demo/shield-guardian.png' },
        { icon: 'Key', title: 'Credential Exposure', description: 'Detects hardcoded passwords, API keys, and tokens in source code.' },
        { icon: 'Terminal', title: 'Shell Injection', description: 'Prevents child_process.exec, eval, and dynamic code execution patterns.' },
        { icon: 'Globe', title: 'Network Exfiltration', description: 'Scans for unauthorized data exfiltration patterns in network calls.' },
        { icon: 'AlertTriangle', title: 'Prompt Injection', description: '8 attack categories blocked: system prompt override, role hijacking, delimiter injection.' },
        { icon: 'Lock', title: 'Raw Block Scanning', description: 'Even raw: JavaScript blocks are scanned. No escape hatch from security.' },
      ],
    },
  },
  {
    id: 12, act: 'Security & Reliability', actNumber: 3,
    title: 'Certified at Birth',
    subtitle: 'Security certificates in compiled output',
    narration: 'Every compiled Lume program contains a security certificate header — cryptographic proof that it passed all 11 threat categories at compile time. We call it "certified at birth."',
    duration: 8, icon: 'Award', visualType: 'feature',
    content: {
      headline: 'Security Certificates in Every Build',
      subheadline: 'Tamper-evident proof that your code is clean.',
      features: [
        { icon: 'FileCheck', title: 'Compile-Time Certificates', description: 'SHA-256 hash of the AST, threat scan results, and compiler version — embedded as a header comment.' },
        { icon: 'Lock', title: 'Compile Lock', description: 'Deterministic builds. Same input → same output. Lock file ensures reproducibility across environments.' },
        { icon: 'ShieldCheck', title: 'Tamper Detection', description: 'If the compiled output is modified after certification, the hash breaks. Instant detection.' },
        { icon: 'Eye', title: 'Audit Trail', description: 'Every certificate includes timestamp, source hash, pattern version, and threat scan summary.' },
      ],
    },
  },
  {
    id: 13, act: 'Security & Reliability', actNumber: 3,
    title: 'Self-Sustaining Runtime',
    subtitle: 'Programs that heal themselves',
    narration: 'Lume programs don\'t just run — they observe themselves, detect failures, apply fixes, and optimize performance autonomously. Four layers work together: Monitor, Heal, Optimize, Evolve.',
    duration: 9, icon: 'RefreshCw', visualType: 'bento',
    content: {
      features: [
        { icon: 'Activity', title: 'Monitor', description: 'Tracks execution time, call count, error rate, and memory usage for every function in real-time.', image: '/demo/self-healing.png' },
        { icon: 'Heart', title: 'Heal', description: '@healable decorator enables auto-retry with exponential backoff and circuit breakers on failure.' },
        { icon: 'Gauge', title: 'Optimize', description: 'Automatic memoization of pure functions. Bottleneck detection with optimization suggestions.' },
        { icon: 'TrendingUp', title: 'Evolve', description: 'Adaptive retry intervals based on historical success patterns. The system learns from its own behavior.' },
      ],
    },
  },

  // ── ACT 4: DEVELOPER EXPERIENCE ────────────────────────────
  {
    id: 14, act: 'Developer Experience', actNumber: 4,
    title: 'Playground IDE',
    subtitle: 'Write, compile, and run Lume in the browser',
    narration: 'The Lume Playground is a full IDE in the browser — with syntax highlighting, live compilation, sandbox execution, and a security scanner. No install required.',
    duration: 9, icon: 'Layout', visualType: 'feature',
    content: {
      headline: 'Browser-Based IDE',
      subheadline: 'From first line to running program in 30 seconds.',
      features: [
        { icon: 'Code', title: 'Live Editor', description: 'Monaco-style code editor with Lume syntax highlighting, line numbers, and auto-formatting.', image: '/demo/playground-ide.png' },
        { icon: 'Play', title: 'Sandbox Execution', description: 'Compiled JavaScript runs in an isolated iframe sandbox. No access to the parent page.' },
        { icon: 'Shield', title: 'Security Tab', description: 'Real-time Guardian Scanner output showing all threats detected during compilation.' },
        { icon: 'Eye', title: 'Build Approval', description: 'Review the AI\'s interpretation before compilation. Approve or reject like a git push confirmation.' },
      ],
    },
  },
  {
    id: 15, act: 'Developer Experience', actNumber: 4,
    title: '18+ CLI Commands',
    subtitle: 'A complete toolchain from the terminal',
    narration: 'Lume ships with a professional-grade CLI — 18 commands covering everything from compilation to voice input to binary bundling.',
    duration: 8, icon: 'Terminal', visualType: 'bento',
    content: {
      features: [
        { icon: 'Play', title: 'lume run', description: 'Execute any .lume file instantly. Auto-compiles and runs in a single step.', image: '/demo/cli-terminal.png' },
        { icon: 'Package', title: 'lume build', description: 'Compile to JavaScript with security certificate headers and compile locks.' },
        { icon: 'Terminal', title: 'lume repl', description: 'Interactive REPL with English Mode toggle. Type .mode to switch between Lume and English.' },
        { icon: 'Rocket', title: 'lume create', description: '"lume create a blog with authentication" — scaffolds a full-stack app from a sentence.' },
        { icon: 'FileText', title: 'lume explain', description: 'Point it at any JS/TS/Lume file. Get a plain-English explanation with line-by-line annotations.' },
        { icon: 'Mic', title: 'lume listen', description: 'Start voice input from the terminal. Speak your code, see it compile in real-time.' },
      ],
    },
  },
  {
    id: 16, act: 'Developer Experience', actNumber: 4,
    title: 'Full-Stack App Generator',
    subtitle: 'Describe an app. Get a codebase.',
    narration: 'lume create doesn\'t generate stubs — it generates real, running code. Six pre-built templates for blog, todo, e-commerce, chat, dashboard, and API. Plus feature modifiers for authentication, dark mode, and search.',
    duration: 9, icon: 'Rocket', visualType: 'bento',
    content: {
      features: [
        { icon: 'BookOpen', title: 'Blog Template', description: 'Post listing, markdown rendering, categorization, author profiles, and RSS feed.', image: '/demo/fullstack-scaffold.png' },
        { icon: 'CheckSquare', title: 'Todo Template', description: 'CRUD operations, categories, due dates, priority sorting, and local storage.' },
        { icon: 'ShoppingCart', title: 'E-Commerce Template', description: 'Product catalog, cart management, checkout flow, order history, and inventory tracking.' },
        { icon: 'MessageCircle', title: 'Chat Template', description: 'Real-time messaging, rooms, user presence, typing indicators, and message history.' },
        { icon: 'BarChart', title: 'Dashboard Template', description: 'Widget grid, chart rendering, data fetching, filters, and responsive layout.' },
        { icon: 'Server', title: 'API Template', description: 'RESTful endpoints, Zod validation, error handling, CORS config, and rate limiting.' },
      ],
    },
  },
  {
    id: 17, act: 'Developer Experience', actNumber: 4,
    title: 'Reverse Mode',
    subtitle: 'Any code, explained in English',
    narration: 'Point lume explain at any JavaScript, TypeScript, or Lume file — and get a full plain-English explanation. Line-by-line annotations or summary paragraphs. Perfect for code review, onboarding, and documentation.',
    duration: 8, icon: 'BookOpen', visualType: 'feature',
    content: {
      headline: 'Code → English',
      subheadline: 'lume explain file.js — instant understanding.',
      features: [
        { icon: 'FileText', title: 'Line-by-Line Annotations', description: 'Every line explained in plain English. Comments appear next to each statement.' },
        { icon: 'AlignLeft', title: 'Summary Paragraphs', description: 'High-level overview of what the file does, its inputs, outputs, and side effects.' },
        { icon: 'Code', title: 'Multi-Language Support', description: 'Understands JavaScript, TypeScript, and Lume. Handles imports, async, and complex patterns.' },
        { icon: 'Sparkles', title: '30+ AST Node Types', description: 'Functions, classes, loops, conditionals, imports, error handling — all translated to English.' },
      ],
    },
  },
  {
    id: 18, act: 'Developer Experience', actNumber: 4,
    title: 'AST-Level Diffing',
    subtitle: 'Semantic version control for Lume',
    narration: 'Lume\'s AST differ doesn\'t compare text — it compares meaning. A renamed variable, a moved function, a modified condition — each tracked semantically with conflict detection and cross-language rendering.',
    duration: 8, icon: 'GitBranch', visualType: 'bento',
    content: {
      features: [
        { icon: 'GitBranch', title: 'Semantic Diff', description: 'Detects additions, removals, modifications, and moves at the AST node level — not line level.', image: '/demo/ast-tree.png' },
        { icon: 'AlertTriangle', title: 'Conflict Detection', description: 'When two developers modify the same function, Lume identifies real conflicts vs safe concurrent edits.' },
        { icon: 'Globe', title: 'Cross-Language Rendering', description: 'Render diffs in Spanish, French, German, or Japanese. The AST is language-agnostic.' },
        { icon: 'Hash', title: 'Node Identity Hashing', description: 'Stable SHA-based identity for every AST node. Tracks movements across file restructuring.' },
      ],
    },
  },

  // ── ACT 5: ECOSYSTEM ────────────────────────────
  {
    id: 19, act: 'Ecosystem', actNumber: 5,
    title: 'Trust Layer Integration',
    subtitle: 'Part of a verified ecosystem',
    narration: 'Lume is a verified member of the Trust Layer ecosystem — connected through shared identity (SSO), blockchain hallmarks, and the Signal Chat protocol. Enterprise-grade from day one.',
    duration: 8, icon: 'Link', visualType: 'bento',
    content: {
      features: [
        { icon: 'Key', title: 'Single Sign-On', description: 'Trust Layer SSO integration. One identity across the entire ecosystem of 30+ applications.', image: '/demo/trust-layer.png' },
        { icon: 'Link', title: 'Blockchain Hallmarks', description: 'Solana-verified trust stamps. SHA-256 hashed records. Immutable proof of compilation and certification.' },
        { icon: 'MessageCircle', title: 'Signal Chat', description: 'Integrated with the Signal Chat real-time messaging platform. Bot framework for compiler notifications.' },
        { icon: 'Shield', title: 'DarkWave Verified', description: 'Meets DarkWave Studios quality standards: 2,093 tests, security scanning, and audit trails.' },
      ],
    },
  },
  {
    id: 20, act: 'Ecosystem', actNumber: 5,
    title: 'Package Registry',
    subtitle: '20+ npm packages recognized by name',
    narration: 'Lume knows npm. Say "use Express to create a server" and Lume recognizes Express, generates the import, and provides context-aware code snippets. 20+ packages mapped with aliases and capabilities.',
    duration: 8, icon: 'Package', visualType: 'bento',
    content: {
      features: [
        { icon: 'Package', title: 'Express, Lodash, Axios', description: 'Direct name recognition. "use Lodash to sort" generates the import and _.sortBy call.' },
        { icon: 'Key', title: 'JWT, bcrypt, Passport', description: 'Authentication packages recognized with full context hints and code generation.' },
        { icon: 'Database', title: 'Mongoose, Prisma, Drizzle', description: 'Database ORMs with schema generation helpers and connection boilerplate.' },
        { icon: 'Zap', title: 'Capability Matching', description: '"I need web scraping" → Cheerio suggested. Packages matched by capability, not just name.' },
      ],
    },
  },
  {
    id: 21, act: 'Ecosystem', actNumber: 5,
    title: 'Module System',
    subtitle: 'Cross-file resolution and dependency tracking',
    narration: 'Lume\'s module resolver supports using: directives for explicit imports, automatic cross-file resolution, and circular dependency detection. Modules work seamlessly across multi-file projects.',
    duration: 7, icon: 'FolderOpen', visualType: 'feature',
    content: {
      headline: 'Smart Module Resolution',
      subheadline: 'Three-tier resolution: local → using → auto-search.',
      features: [
        { icon: 'FileText', title: 'Using Directives', description: '"using: helpers.lume" — explicit imports with file, folder, and module resolution.' },
        { icon: 'Search', title: 'Auto-Search', description: 'Reference "user data" and Lume finds it across your project. No manual import management.' },
        { icon: 'RefreshCw', title: 'Circular Detection', description: 'Graph-based circular dependency detection with clear error messages and resolution suggestions.' },
        { icon: 'AlertTriangle', title: 'Ambiguity Resolution', description: 'Multiple candidates? Lume asks you to clarify and caches the answer for future builds.' },
      ],
    },
  },
  {
    id: 22, act: 'Ecosystem', actNumber: 5,
    title: 'Pattern Versioning',
    subtitle: 'Semantic versioning for the pattern library',
    narration: 'Lume\'s pattern library is versioned with semantic versioning. Each .lume file can declare "patterns: 1.0" to pin to a specific version. Upgrade reports show what changed, what\'s deprecated, and what\'s safe to auto-update.',
    duration: 7, icon: 'GitBranch', visualType: 'bento',
    content: {
      features: [
        { icon: 'Tag', title: 'Semver Versioning', description: 'Major.Minor.Patch versioning. Breaking changes bump major. New patterns bump minor.', image: '/demo/pattern-library.png' },
        { icon: 'FileText', title: 'Upgrade Reports', description: 'Detailed diff between versions: new patterns, changed resolutions, deprecated syntax.' },
        { icon: 'RefreshCw', title: 'Auto-Migration', description: 'Minor and patch updates auto-migrate. Deprecated patterns replaced with their successors.' },
        { icon: 'Shield', title: 'Impact Analysis', description: 'Before upgrading, see exactly which files in your project are affected by the change.' },
      ],
    },
  },

  // ── ACT 6: BY THE NUMBERS ────────────────────────────
  {
    id: 23, act: 'By The Numbers', actNumber: 6,
    title: 'The Test Suite',
    subtitle: '2,093 tests. Zero failures.',
    narration: 'Lume\'s test suite is one of the most comprehensive in any programming language project at this stage. Every module, every pattern, every edge case — tested and verified.',
    duration: 9, icon: 'CheckCircle', visualType: 'stats',
    content: {
      stats: [
        { value: '2093', label: 'Passing Tests', suffix: '' },
        { value: '505', label: 'Test Suites', suffix: '' },
        { value: '51', label: 'Test Files', suffix: '' },
        { value: '0', label: 'Failures', suffix: '' },
        { value: '100', label: 'Module Coverage', suffix: '%' },
        { value: '38', label: 'Example Programs', suffix: '' },
      ],
    },
  },
  {
    id: 24, act: 'By The Numbers', actNumber: 6,
    title: 'The Codebase',
    subtitle: 'Production-grade at every layer',
    narration: 'Lume isn\'t a prototype — it\'s a full compiler with 14,000+ lines of production code, a complete CLI, a web-based IDE, and comprehensive documentation.',
    duration: 8, icon: 'BarChart', visualType: 'stats',
    content: {
      stats: [
        { value: '14', label: 'Lines of Source Code', suffix: 'K+' },
        { value: '102', label: 'English Mode Patterns', suffix: '+' },
        { value: '18', label: 'CLI Commands', suffix: '+' },
        { value: '10', label: 'Human Languages', suffix: '' },
        { value: '13', label: 'Completed Milestones', suffix: '' },
        { value: '8', label: 'Documentation Files', suffix: '' },
      ],
    },
  },
  {
    id: 25, act: 'By The Numbers', actNumber: 6,
    title: 'Before vs After',
    subtitle: 'Traditional Programming vs Lume',
    narration: 'The numbers tell the story. Here\'s what changes when you replace traditional programming with Lume.',
    duration: 10, icon: 'TrendingUp', visualType: 'comparison',
    content: {
      comparison: {
        before: [
          { label: 'AI Integration', value: 'Import SDK, manage keys, parse JSON' },
          { label: 'Writing Code', value: 'Learn arbitrary syntax rules' },
          { label: 'Voice Input', value: 'Not supported by any language' },
          { label: 'Security', value: 'External tools, manual audits' },
          { label: 'Error Messages', value: 'Cryptic stack traces' },
          { label: 'Debugging', value: '50% of developer time' },
          { label: 'Multilingual', value: 'English-only syntax' },
          { label: 'Runtime Resilience', value: 'Manual try/catch everywhere' },
        ],
        after: [
          { label: 'AI Integration', value: 'let x = ask gpt4 "prompt"' },
          { label: 'Writing Code', value: 'Write in plain English' },
          { label: 'Voice Input', value: 'lume listen — speak and compile' },
          { label: 'Security', value: 'Compile-time scanning, 11 categories' },
          { label: 'Error Messages', value: 'Plain-English explanations' },
          { label: 'Debugging', value: 'Self-healing runtime' },
          { label: 'Multilingual', value: '10 human languages' },
          { label: 'Runtime Resilience', value: 'Auto-retry, circuit breakers' },
        ],
      },
    },
  },
  {
    id: 26, act: 'By The Numbers', actNumber: 6,
    title: 'Technical Architecture',
    subtitle: 'Under the hood — for engineers, by an engineer',
    narration: 'Lume is built with modern JavaScript architecture. Here\'s the full technical specification.',
    duration: 15, icon: 'Code', visualType: 'techSpecs',
    content: {
      techCategories: [
        {
          title: 'Compiler Pipeline', icon: 'Cpu',
          items: [
            { label: 'Lexer', value: 'Custom tokenizer with keyword-aware scanning' },
            { label: 'Parser', value: 'Recursive descent, 35+ AST node types' },
            { label: 'Transpiler', value: 'AST → JavaScript code generation' },
            { label: 'Intent Resolver', value: '7-layer tolerance chain, 102+ patterns' },
            { label: 'Formatter', value: 'Opinionated auto-formatter' },
            { label: 'Linter', value: '7 lint rules (LUME-L001 through LUME-L007)' },
          ],
        },
        {
          title: 'AI & NLP Layer', icon: 'Brain',
          items: [
            { label: 'Pattern Library', value: '102+ deterministic patterns' },
            { label: 'Synonym Rings', value: '30 verb synonym groups' },
            { label: 'Fuzzy Matcher', value: 'Levenshtein distance correction' },
            { label: 'Context Engine', value: 'Variable/model/function tracking' },
            { label: 'AI Fallback', value: 'GPT-4o with structured AST output' },
            { label: 'Language Detection', value: '10 languages via n-gram heuristics' },
          ],
        },
        {
          title: 'Voice Pipeline', icon: 'Mic',
          items: [
            { label: 'Input', value: 'Web Speech API + CLI microphone' },
            { label: 'Filler Stripping', value: '20 filler words removed' },
            { label: 'Homophones', value: '10 contextual resolution pairs' },
            { label: 'Number Conversion', value: '"twenty three" → 23' },
            { label: 'Structural Cues', value: 'if/else/loop detection in speech' },
            { label: 'Correction Phrases', value: '9 triggers: "scratch that", "no I mean"' },
          ],
        },
        {
          title: 'Security Layer', icon: 'Shield',
          items: [
            { label: 'Threat Categories', value: '11 (file destruction, shell injection, etc.)' },
            { label: 'Guardian Scanner', value: 'Input + output scanning' },
            { label: 'Prompt Injection', value: '8 attack categories blocked' },
            { label: 'Compile Lock', value: 'SHA-256 deterministic build hashes' },
            { label: 'Certificates', value: 'Tamper-evident headers in output' },
            { label: 'AI Rate Limiting', value: 'Configurable per-file limits' },
          ],
        },
        {
          title: 'Runtime System', icon: 'Activity',
          items: [
            { label: 'Monitor', value: 'Execution time, call count, error rate' },
            { label: 'Heal', value: 'Auto-retry, circuit breakers, @healable' },
            { label: 'Optimize', value: 'Memoization, bottleneck detection' },
            { label: 'Evolve', value: 'Adaptive intervals, suggestion engine' },
            { label: 'Bundler', value: 'Zero-dependency JS bundles + Bun compile' },
            { label: 'Source Maps', value: 'Lume line → JS line mapping' },
          ],
        },
        {
          title: 'Website & IDE', icon: 'Monitor',
          items: [
            { label: 'Framework', value: 'React + Vite' },
            { label: 'Playground', value: 'In-browser sandbox with iframe isolation' },
            { label: 'Build Approval', value: 'Review AI interpretation before compile' },
            { label: 'Documentation', value: '8 comprehensive guides' },
            { label: 'Changelog', value: 'Version history with release notes' },
            { label: 'Blog', value: 'Technical articles and tutorials' },
          ],
        },
      ],
    },
  },

  // ── ACT 7: WHAT'S NEXT ────────────────────────────
  {
    id: 27, act: 'What\'s Next', actNumber: 7,
    title: 'Academic Recognition',
    subtitle: 'Theory meets implementation',
    narration: 'Lume introduces a new theoretical concept — Cognitive Distance — the measurable gap between human intent and machine syntax. This framework has implications beyond programming, connecting to the established psychological concept of cognitive dissonance.',
    duration: 9, icon: 'GraduationCap', visualType: 'bento',
    content: {
      features: [
        { icon: 'BookOpen', title: 'Cognitive Distance Theory', description: 'A formal metric for the translation overhead between human intent and code syntax. Lume minimizes it.', image: '/demo/cognitive-bridge.png' },
        { icon: 'Award', title: 'Academic Brief Published', description: 'Full technical specification suitable for academic publication. Voice-to-Code, security, and cognitive theory.' },
        { icon: 'Lightbulb', title: 'Novel Contributions', description: 'Intent-resolving compilation, certified-at-birth security, and voice-native language design.' },
        { icon: 'Globe', title: 'Publication Tracks', description: 'ACM SIGPLAN (PL design), IEEE S&P (security), CogSci (cognitive distance theory).' },
      ],
    },
  },
  {
    id: 28, act: 'What\'s Next', actNumber: 7,
    title: 'Roadmap to Version 1.0',
    subtitle: '13 milestones complete. More ahead.',
    narration: 'Lume has completed 13 milestones. The path to Version 1.0 continues with a language server protocol, VS Code extension, and native compilation targets.',
    duration: 8, icon: 'Map', visualType: 'workflow',
    content: {
      steps: [
        { step: 1, title: 'Language Server Protocol', description: 'Full LSP implementation for VS Code, Neovim, and JetBrains IDEs. Autocomplete, diagnostics, hover.', icon: 'Server' },
        { step: 2, title: 'VS Code Extension', description: 'Syntax highlighting, real-time compilation, English Mode toggle, and voice input from the editor.', icon: 'Code' },
        { step: 3, title: 'Native Compilation', description: 'Bun-based native binary compilation for Linux, macOS, Windows, and WASM targets.', icon: 'Cpu' },
        { step: 4, title: 'Package Manager', description: 'lume install — a native package manager for Lume modules with semantic versioning.', icon: 'Package' },
      ],
    },
  },
  {
    id: 29, act: 'What\'s Next', actNumber: 7,
    title: 'Enterprise Ready',
    subtitle: 'Trust Layer verified. MIT licensed.',
    narration: 'Lume is production-ready and enterprise-verified. 2,093 tests. Zero failures. Security scanning. Blockchain audit trails. MIT licensed for maximum flexibility.',
    duration: 8, icon: 'Building', visualType: 'stats',
    content: {
      stats: [
        { value: '2093', label: 'Tests Passing', suffix: '' },
        { value: '0', label: 'Test Failures', suffix: '' },
        { value: '11', label: 'Security Threat Categories', suffix: '' },
        { value: '102', label: 'English Mode Patterns', suffix: '+' },
        { value: '10', label: 'Human Languages', suffix: '' },
        { value: '13', label: 'Milestones Complete', suffix: '' },
        { value: '38', label: 'Example Programs', suffix: '' },
        { value: '1', label: 'Philosophy: MIT Licensed', suffix: '' },
      ],
    },
  },
  {
    id: 30, act: 'What\'s Next', actNumber: 7,
    title: 'Start Writing Lume',
    subtitle: 'The future of programming is here.',
    narration: '',
    duration: 0, icon: 'Rocket', visualType: 'cta',
    content: {
      headline: 'Start Writing Lume',
      subheadline: 'The language that meets you where you are.',
      features: [
        { icon: 'Play', title: 'Try the Playground', description: 'Write, compile, and run Lume in your browser — no install required.' },
        { icon: 'BookOpen', title: 'Read the Docs', description: '8 comprehensive guides covering syntax, English Mode, CLI, and security.' },
        { icon: 'Rocket', title: 'Join the Ecosystem', description: 'Part of the Trust Layer — connected, verified, and enterprise-grade.' },
      ],
    },
  },
]
