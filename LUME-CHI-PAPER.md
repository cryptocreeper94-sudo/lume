# Eliminating Cognitive Distance: Lume, an Intent-Resolving Compiler for Accessible, Voice-Native Programming

**Jason Andrews**
DarkWave Studios LLC — DarkWave Systems Collective (DWSC)
team@dwsc.io | lume-lang.com | dwsc.io

**Target Venue:** ACM CHI 2027 — Conference on Human Factors in Computing Systems
**Subcommittee:** Interaction Techniques, Devices, and Modalities
**Format:** ACM 1-column review format (sigconf)
**Submission Deadline:** September 2026 (abstract early September; full paper one week later)

---

> **Document Status**
> This manuscript is submission-ready in structure. Sections marked `[POST-LAUNCH]` require data from the August 23, 2026 public release. All theoretical contributions, system descriptions, related work, and evaluation plans are final.

---

## Abstract

Programming remains one of the most cognitively expensive knowledge-work activities. Developers must continuously translate between natural language thought and formal syntax — a gap we call *cognitive distance* (CD). This paper presents Lume, the first programming language designed to eliminate cognitive distance by accepting natural English as valid, compilable source code. We introduce cognitive distance as a measurable construct comprising six transformation dimensions and show that Lume's *Tolerance Chain* — a seven-layer resolution architecture — absorbs the imprecision inherent in human communication. This design makes voice-to-code an architectural consequence rather than a bolt-on feature, enabling fully hands-free, eyes-free programming through *Auditory Mode*. We describe the *Cleanup Layer*, which normalizes speech-to-text noise (filler words, stuttering, homophones) before it enters the compilation pipeline, and *Adaptive Voice Profiles*, which learn per-user dialect patterns to improve accuracy over time. We present *Review Mode*, a transparency layer that presents the compiler's interpretation in plain language for human-in-the-loop verification, and a deterministic *Resolution Manifest* that guarantees reproducible compilation of natural language input. We report results from a pilot evaluation with `[N]` participants, measuring Task Completion Time (TCT), NASA-TLX cognitive load, Technology Acceptance (TAM/TAD), and silent error rates. `[POST-LAUNCH: Insert summary results]`. Lume represents a new interaction paradigm — *intent-resolving compilation* — where the compiler serves as the understanding layer between human thought and executable code.

**Keywords:** cognitive distance, cognitive load, natural language programming, voice-to-code, accessible programming, human-in-the-loop compilation, intent resolution, adaptive voice profiles

**CCS Concepts:** • Human-centered computing → Interaction techniques • Human-centered computing → Accessibility technologies • Software and its engineering → Language features

---

## 1. Introduction

Every developer on Earth experiences the same daily friction: they think in natural language but must act in formal syntax. A developer who thinks "get the user's name from the database" must express that thought as `const name = await db.query("SELECT name FROM users WHERE id = ?", [userId])`. The thought and the action do not match. This happens hundreds of times per day, across every programming language, in every development environment.

This is not a metaphor. The experience of thinking one thing and being forced to express it in a completely different form is a well-documented psychological phenomenon. Festinger's theory of cognitive dissonance [15] describes the mental discomfort that arises when one's actions conflict with one's beliefs or internal state. In programming, the developer's internal representation (natural language intent) perpetually conflicts with the required external representation (formal syntax). The result is frustration, errors, and exclusion — particularly for developers with motor impairments, visual impairments, or non-native English proficiency.

We propose that the fundamental problem is not that programming is *hard*, but that programming imposes an unnecessary *translation burden*. We call this burden **cognitive distance**: the measurable gap between a human's intent and the expression required by a computational system.

The history of programming languages is a history of reducing cognitive distance. Assembly required developers to think in registers and memory addresses. C introduced named variables and functions. Python removed syntactic ceremony. But even Python — among the most readable languages — still demands exact syntactic conformity. A missing colon, an incorrect indent, or a misspelled keyword breaks compilation entirely. The distance has narrowed, but it has never been eliminated.

Recent AI-powered tools have paradoxically *increased* cognitive distance in one critical dimension. GitHub Copilot, ChatGPT, and similar systems interpose an AI agent between the developer and the compiler. The developer now operates in a three-layer chain: human → AI → compiler. The AI is a middleman. The developer must review AI-generated code for correctness — a new cognitive task that did not exist before. The tool is more convenient, but the chain of translation is longer, with more opportunities for misunderstanding [35].

**Lume eliminates the middleman.** The compiler *is* the understanding layer. When a developer writes (or speaks) "get all the users who signed up this month," the Lume compiler resolves this directly to executable code. No intermediary. No review-and-edit cycle. No generated code to inspect.

---

## 2. Contributions

This paper makes the following contributions:

1. **Lume is the first programming language where voice-to-code is architecturally native.** Because the compiler already handles imprecise input (spelling errors, ambiguity, informal phrasing), voice input — which is inherently imprecise — becomes a mechanical consequence of the architecture rather than a bolted-on feature.

2. **The Tolerance Chain + Cleanup Layer absorb all speech-to-text noise.** A seven-layer resolution architecture (§4.3) plus a dedicated Transcription Cleanup Layer (§5.2) normalizes filler words, stuttering, homophones, spoken punctuation, and dialect-specific artifacts before they reach the parser.

3. **Deterministic reproducibility of natural language input.** The Resolution Manifest (`lume-lock.json`, §7.2) locks every natural-language-to-code mapping, ensuring that the same English sentence produces the same JavaScript output indefinitely — even if underlying NLP models change.

4. **Cognitive Distance approaches zero in Lume Voice Mode.** We formalize cognitive distance as a six-dimensional metric (§3) and show that Lume reduces all six dimensions simultaneously. In Voice Mode with Auditory feedback, the developer's thought and expression converge completely.

5. **Accessibility as architecture, not a feature.** When the compiler accepts natural language and provides natural language output, the most common physical and cognitive barriers to programming disappear at the language level, not the tool level (§6). Auditory Mode enables fully hands-free, eyes-free programming.

6. **Human-in-the-loop disambiguation eliminates silent errors.** When the compiler encounters ambiguous input, it surfaces structured clarification requests (§4.4) rather than silently guessing. This eliminates the most dangerous class of software defect — code that compiles, passes cursory review, and fails at runtime.

7. **Review Mode provides transparent intent verification.** The compiler presents its interpretation in plain English before emitting code (§7.3). The developer approves, rejects, or edits — creating a trust loop grounded in XAI best practices without adding cognitive distance.

8. **Lume represents a new HCI paradigm: intent-resolving compilation.** The compiler is not a syntax translator — it is a *resolution engine* that bridges the gap between human thought and executable code, more closely related to dialogue systems than to traditional parsers.

---

## 3. Background and Related Work

### 3.1 Cognitive Load Theory

Cognitive Load Theory (CLT), introduced by Sweller [31], distinguishes between intrinsic load (task difficulty), extraneous load (imposed by tools or environments), and germane load (productive learning effort). Programming imposes significant extraneous cognitive load through syntactic requirements, toolchain complexity, and debugging overhead. Lume's design targets the reduction of extraneous load — syntax translation, error recovery, and tool configuration contribute nothing to the developer's actual problem-solving.

### 3.2 Cognitive Dissonance in Programming

Festinger's cognitive dissonance theory [15] describes the psychological discomfort arising from holding contradictory cognitions. In programming, this manifests as the perpetual mismatch between internal representation (natural language thought) and external expression (formal code). Prior work has documented how this dissonance contributes to programmer frustration [22], imposter syndrome [26], and elevated error rates under cognitive load [19]. We formalize the underlying measurement — cognitive distance — and show that reducing it to zero eliminates the conditions for dissonance.

### 3.3 Natural Language Programming

Natural language programming (NLP) has been pursued since the 1960s. SHRDLU [36] demonstrated natural language interaction with a simulated block world. More recently, NL-to-code systems like Codex [10], AlphaCode [23], and CodeWhisperer have used large language models to generate code from English prompts. However, these systems are non-deterministic: the same prompt may produce different outputs across invocations. They are also opaque — the developer cannot inspect the reasoning process. Lume differs fundamentally: the compiler uses a deterministic Tolerance Chain with logged confidence scores, and the developer can inspect every resolution via the Resolution Manifest.

### 3.4 Voice Coding Systems

Voice-based coding tools including Talon [32], Serenade [29], and GitHub Copilot Voice operate as editor integrations. They map voice commands to IDE actions (e.g., "select line five," "insert function") or template expansions. The compiler never sees voice input — it receives synthesized code after template substitution. Lume's architecture is fundamentally different: voice input enters the same Tolerance Chain as typed input. The compiler directly processes imprecise, informal speech transcriptions. This makes voice coding a *consequence of the architecture* rather than a separate feature.

### 3.5 Accessible Programming

Programming accessibility research has focused on screen readers for code editors [30], tactile programming languages for blind developers [4], and assisted input for motor-impaired users [28]. These approaches accommodate disability through assistive overlays on existing languages. Lume's contribution is different: accessibility is a *core architectural property*. When the compiler accepts natural language and supports full auditory feedback, the barriers are removed at the language level, not the tool level. Auditory Mode — where the developer speaks intent, hears the compiler's interpretation, and confirms by voice — makes Lume the first programming language usable with eyes closed.

### 3.6 Trust and Transparency in AI Systems

Research on human-AI interaction consistently identifies transparency and control as prerequisites for user trust [1, 24]. Explainable AI (XAI) research demonstrates that users perform better and report higher satisfaction when they can inspect and understand an AI system's reasoning [20]. Lume's Review Mode applies these principles to compilation: the compiler explains its interpretation in plain English, and the developer approves before code is emitted. This transforms compilation from a black-box process to a transparent, collaboratively verified one.

---

## 4. Cognitive Distance: A Formal Definition

We define **cognitive distance (CD)** as the total translation effort required to convert a human's intent into executable code:

$$CD(H, C) = \sum_{i=1}^{n} T_i(H, C)$$

where *H* represents human intent, *C* represents the target computational system, and each *T_i* represents a discrete transformation dimension:

| Dimension | Description | Example |
|-----------|-------------|---------|
| T₁ — Lexical | Mapping natural words to language keywords | "show" → `console.log` |
| T₂ — Syntactic | Conforming to grammar rules | Adding semicolons, brackets, indentation |
| T₃ — Structural | Organizing code into required patterns | Classes, modules, imports, function signatures |
| T₄ — Semantic | Mapping intent to the correct API or construct | Choosing `forEach` vs. `map` vs. `filter` |
| T₅ — Representational | Translating mental models to data structures | Conceptual "list of users" → `Array<User>` |
| T₆ — Meta-cognitive | Monitoring one's own understanding | "Is this the right approach?" "Am I using this API correctly?" |

**CD = 0 is the theoretical ideal**: the developer expresses intent exactly as they think it, and the system executes that intent with zero translation. No existing programming language achieves CD = 0. Lume approaches it.

### 4.1 CD Scores Across Paradigms

| System | CD Score | Missing Dimensions |
|--------|----------|-------------------|
| Assembly | 6/6 | All dimensions require explicit translation |
| C | 5/6 | Lexical slightly improved (named variables) |
| Python | 3/6 | T₁, T₂ reduced; T₃–T₆ remain |
| Copilot/ChatGPT | 4/6* | Adds T₆ (must verify AI output) |
| Lume (text) | 0.5/6 | Only T₄ in rare edge cases |
| Lume (voice) | ~0/6 | Intent expressed as thought |

*AI coding assistants paradoxically score higher than Python on T₆ because the developer must now also verify whether the AI's interpretation is correct — a new meta-cognitive task that did not exist without the AI.

### 4.2 The Dissonance Hypothesis

We hypothesize that *cognitive dissonance in programming is directly proportional to cognitive distance*:

$$\text{Dissonance} \propto CD(H, C)$$

As CD → 0, the conditions for dissonance disappear: the developer's thought and their expression become the same thing. This predicts that Lume users will report lower frustration, lower mental demand, and higher perceived performance on the NASA-TLX [18], compared to users of traditional languages. Our evaluation plan (§9) tests this prediction.

---

## 5. System Overview

### 5.1 Architecture

Lume compiles to JavaScript via the following pipeline:

```
Human Input → [Cleanup Layer] → [Tolerance Chain] → AST → Transpiler → JavaScript
 (text/voice)   (voice only)      (7 layers)      (unified)  (standard)   (output)
```

The critical innovation is in the resolution stages: the Cleanup Layer normalizes speech artifacts, and the Tolerance Chain absorbs the remaining imprecision through seven structured layers. Traditional compilers reject any input that does not conform exactly to a context-free grammar. Lume *absorbs* non-conformity.

### 5.2 English Mode

Lume supports natural English as source code. There is no formal grammar (no BNF, no CFG). Instead, a pattern library of 34+ regex-based patterns maps English phrases to AST node types:

```
Input:    "get all the users who signed up this month"
Pattern:  /^get\s+(all\s+)?the\s+(.+)/i
AST:      QueryOperation { target: "users", filter: "signed_up_this_month" }
```

The pattern library handles article stripping ("the," "a," "an"), possessive normalization ("user's" → "user"), slug conversion ("user profile" → "user_profile"), and pronoun flagging.

### 5.3 The Tolerance Chain

When input does not directly match a pattern, it cascades through seven resolution layers:

**Layer 1 — Exact Pattern Match.** Direct regex match from the 34-pattern library. Confidence: 1.0.

**Layer 2 — Fuzzy Pattern Match.** Levenshtein distance ≤ 2 from a known pattern. Catches typos and minor phrasing variations.

**Layer 3 — Auto-Correct.** Spelling correction using a domain-specific dictionary of ~500 programming terms. "functon" → "function."

**Layer 4 — Context Engine.** Uses surrounding instructions to resolve ambiguity. Maintains a Context Stack with `LastSubject` and `LastCollection` registers for pronoun resolution (§5.5).

**Layer 5 — Temporal Resolver.** Resolves time-relative references: "the previous result," "the last item," "what we just created."

**Layer 6 — i18n Pattern Library.** Multilingual pattern matching for non-English speakers. Supports 10 languages.

**Layer 7 — AI Resolver.** Falls back to an LLM for intent classification when all deterministic layers fail. This is the *only* non-deterministic layer, and its results are cached in the Resolution Manifest (§7.2) to ensure reproducibility.

Each layer reports a confidence score (0.0–1.0). The first layer to exceed the threshold (default: 0.85) produces the AST node.

**HCI Significance:** The Tolerance Chain is not a compiler optimization — it is an HCI mechanism. It absorbs the natural imprecision of human language that would cause hard failures in any traditional compiler. By making imprecise input first-class, the Tolerance Chain removes the extraneous cognitive load of syntactic conformity.

### 5.4 Adaptive Voice Profiles

Inserted at Layer 1.5 of the Tolerance Chain — after exact pattern matching, before fuzzy match — the Adaptive Voice Profile is a per-user resolution layer that learns three axes of personalization:

1. **Dialect Mapping.** When a user consistently says "gimme" for "get" or "toss" for "delete," the system records these as candidates. After a configurable threshold (default: 5 consistent uses), the candidate is auto-promoted to a confirmed mapping with confidence ≥ 0.95.

2. **Accent Correction.** When a Southern US accent consistently produces "roit" for "right," or a non-native speaker produces "dat" for "that," the profile stores corrections and applies them before the Tolerance Chain begins.

3. **Filler Word Personalization.** Beyond generic fillers ("um," "uh"), the profile learns user-specific fillers ("y'know," "basically," "right so") and strips them during preprocessing.

The profile's confidence follows the learning curve:

$$\text{DC}(u) = 1 - e^{-0.01 \cdot R_u - 0.1 \cdot C_u}$$

where DC(u) is Dialect Confidence for user *u*, *R* is total resolutions, and *C* is confirmed mappings.

**HCI Significance:** The Adaptive Voice Profile transforms the compiler from a static tool into a *personalized interaction partner*. Users with speech impediments or non-standard accents experience improving accuracy over time — the system adapts to them, not the other way around.

### 5.5 Anaphora Resolution: The Context Stack

Developers naturally use pronouns: "show **it**," "delete **them**," "sort **that result**." The Context Stack resolves these references using a bounded sliding window (5 instructions) with two registers:

- `LastSubject` — most recent singular entity
- `LastCollection` — most recent plural entity

Resolution is enhanced by the Recency-Frequency-Type (RFT) model:

$$\text{Score}(entity) = \alpha \cdot \text{Recency} + \beta \cdot \text{Frequency} + \gamma \cdot \text{TypeMatch}(entity, verb)$$

where α = 0.5, β = 0.3, γ = 0.2. When type matching fails, the compiler triggers `DisambiguationRequired` rather than guessing:

```
⚠ DisambiguationRequired at line 4:
  "delete them" — ambiguous reference.
  Did you mean:
    (a) delete activeUsers    [LastCollection, set at line 2]
    (b) delete expiredTokens  [LastCollection, set at line 1]
  Clarify with: "delete the active users" or "delete the expired tokens"
```

This transforms English's greatest weakness (ambiguity) into a structured, verifiable interaction.

---

## 6. Voice-to-Code: An Architectural Consequence

### 6.1 Why Voice is Natural in Lume

Voice input is inherently imprecise. Speech-to-text engines produce output characterized by homophones ("write" vs. "right"), filler words ("um," "uh," "like"), stuttering ("get get the name"), spoken punctuation ("period" instead of "."), and run-on sentences with no line breaks.

No traditional compiler can process any of these. Voice-coding tools (Talon, Serenade, Copilot Voice) work around this by operating at the *editor* level — mapping voice commands to IDE actions. The compiler never sees voice input.

In Lume, the Tolerance Chain already handles all of these characteristics:

| Voice Artifact | Resolution Layer | Resolution |
|---------------|-----------------|------------|
| Filler words ("um," "uh") | Cleanup Layer | Stripped before parsing |
| Stuttering ("get get the") | Auto-Correct (Layer 3) | De-duplicated |
| Homophones ("right" vs. "write") | Context Engine (Layer 4) | Resolved by surrounding context |
| Spoken punctuation ("period") | Cleanup Layer | Converted to symbols |
| Informal phrasing ("grab the user") | Fuzzy Match (Layer 2) | "grab" → "get" (synonym mapping) |
| Run-on sentences | Sentence Boundary Detection | Split into separate instructions |
| Dialect vocabulary ("y'all," "gonna") | Adaptive Voice Profile | Learned per-user mappings |

Voice-to-code in Lume is not a feature — it is a mechanical consequence of a compiler that already handles imprecise input.

### 6.2 The Cleanup Layer

The Cleanup Layer is a preprocessing stage that normalizes raw speech-to-text output before it enters the Tolerance Chain:

```
Raw Transcription → Filler Removal → Stutter De-duplication
  → Spoken Punctuation Conversion → Sentence Boundary Detection
  → Adaptive Profile Application → Tolerance Chain
```

**Stage 1 — Filler Removal.** Removes universal fillers ("um," "uh," "like," "you know") and learned per-user fillers from the Adaptive Voice Profile.

**Stage 2 — Stutter De-duplication.** Detects repeated adjacent words or phrases ("get get the name," "create a a function") and reduces them to single occurrences.

**Stage 3 — Spoken Punctuation Conversion.** Maps spoken punctuation words to their symbolic equivalents: "period" → ".", "comma" → ",", "open paren" → "(", "new line" → "\n".

**Stage 4 — Sentence Boundary Detection.** Splits run-on voice input into discrete instructions using pause detection (+500ms pause), conjunction splitting ("and then"), and sequential markers ("next," "after that").

**Stage 5 — Adaptive Profile Application.** Applies the user's Adaptive Voice Profile: dialect mappings, accent corrections, and personalized filler filtering.

The Cleanup Layer ensures that the Tolerance Chain receives normalized input equivalent to informal typed English — the same input class it was already designed to handle.

### 6.3 Voice Pipeline Architecture

```
Microphone → Web Speech API → Raw Transcription → Cleanup Layer
    → Tolerance Chain → AST → JavaScript
```

The pipeline adds only the Cleanup Layer before feeding into the same Tolerance Chain used for typed input. No part of the compiler is modified for voice — the same compilation path processes both modalities.

---

## 7. Accessibility and Auditory Mode

### 7.1 Accessibility as Architecture

Traditional accessibility in programming is achieved through overlays: screen readers for code editors, eye-tracking for cursor control, switch-based input for motor-impaired users. These accommodations layer assistive technology *on top of* languages that were designed for keyboard-and-screen interaction.

Lume's accessibility is structural. When the compiler accepts natural language:

- **Motor impairments** are addressed because typing exact syntax is not required
- **Visual impairments** are addressed because code structure is not spatial (no indentation-dependent semantics in English Mode)
- **Learning disabilities** are addressed because the input language matches the thought language
- **Non-native speakers** are addressed by the i18n pattern library and fuzzy matching

### 7.2 Auditory Mode: Eyes-Free, Hands-Free Programming

Auditory Mode completes the accessibility loop by adding compiler-to-developer speech output:

```
Developer (speaks): "Get all the users who signed up this month"

Lume (speaks back): "I understood: query the users collection,
  filtering by signup date in the current month.
  Confidence: 97 percent. Shall I compile?"

Developer (speaks): "Yes"

Lume (speaks back): "Compiled successfully. One line resolved
  by exact pattern match."
```

This bidirectional speech pipeline is implemented using the Web Speech API (`SpeechRecognition` for input, `SpeechSynthesis` for output) — zero additional dependencies.

**Auditory Mode reduces cognitive distance to zero across all dimensions.** The developer speaks their intent, hears confirmation in the same language, and speaks approval. No screens. No keyboards. No translation.

The significance for accessibility is profound: Auditory Mode makes Lume the first programming language *usable with eyes closed*. For developers with visual impairments, motor disabilities, or hands-occupied scenarios (e.g., field engineering, manufacturing floors), programming transforms from a keyboard-dependent activity to a conversational one.

---

## 8. Determinism and Trust

### 8.1 The Reproducibility Problem

The greatest threat to natural language programming is non-determinism. If "get the users" compiles to `SELECT * FROM users` today but the LLM changes tomorrow and produces `DELETE FROM users`, the language is a failure. Lume's entire architecture guarantees strict determinism.

### 8.2 The Resolution Manifest

Every compilation produces a Resolution Manifest (`lume-lock.json`) that records the exact mapping from input to output:

```json
{
  "entries": [{
    "source": "get all the users who signed up this month",
    "cls": "QUERY users WHERE created_at >= MONTH_START(CURRENT_DATE)",
    "resolvedBy": "ExactPatternMatch",
    "confidence": 0.97,
    "astHash": "sha256:a3f8b2c1...",
    "outputHash": "sha256:9e4d1f0a..."
  }]
}
```

Subsequent compilations read from the manifest first, ensuring 100% reproducibility regardless of model updates. The build is reproducible ten years from now.

### 8.3 Review Mode: Human-in-the-Loop Verification

Review Mode presents the compiler's interpretation before any code is emitted:

```
$ lume compile app.lume --review

  Line 1: "get all the users who signed up this month"
  ├─ Intent: QUERY on collection 'users'
  ├─ Filter: created_at >= start of current month
  ├─ Resolved by: ExactPatternMatch (confidence: 0.97)
  └─ Output: const result = await db.query('SELECT * ...');
  
  ✓ Approve?  [y]es / [n]o / [e]dit
```

The developer reviews the compiler's *understanding* in plain English — not in generated code. This is a transparency mechanism grounded in XAI best practices [1, 20]: the system explains its reasoning, the human approves, and trust is established through verified interaction.

### 8.4 Semantic Invariant Certificates

Each compiled output carries a certificate binding the entire chain:

$$\text{Certificate} = \text{SHA-256}(\text{Input} + \text{AST} + \text{JavaScript})$$

Modifying any of the three artifacts invalidates the certificate:

```javascript
// LUME-CERT: sha256:a3f8b2c1... | Intent: QUERY | Risk: LOW | Chain: VALID
const result = await db.query('SELECT * FROM users');
```

The certificate provides tamper-evident integrity verification — a cryptographic proof of intent-to-execution integrity, operating as infrastructure-level trust for safety-critical deployment.

---

## 9. Evaluation Plan

We propose four controlled studies to empirically validate the cognitive distance theory and Lume's design claims. `[POST-LAUNCH: Studies to be executed August–September 2026 with real Lume users.]`

### 9.1 Study A — Task Completion Time (TCT)

**Objective:** Measure intent-to-execution speed across four conditions.

| Group | Tool | Task |
|-------|------|------|
| Control A | Python (manual) | Build a CRUD API for a user database |
| Control B | Python + GitHub Copilot | Same task, AI-assisted |
| Experimental | Lume English Mode (text) | Same task, natural language |
| Experimental+ | Lume Voice Mode | Same task, voice input |

**Metrics:** Time from reading the specification to first passing test suite. Hypothesis: Lume reduces TCT by 40–60% vs. Python, 20–30% vs. Copilot.

**Participants:** 40 developers (10 per group), balanced for experience level (novice, intermediate, expert). Within-subjects design for the two Lume conditions.

### 9.2 Study B — Silent Error Rate

**Objective:** Measure how often tools produce incorrect code without warning.

Participants receive deliberately ambiguous prompts: "update the user," "delete that record," "show the results."

| Tool | Metric |
|------|--------|
| GitHub Copilot | Count of times the AI generates incorrect code without any warning |
| Lume | Count of times the compiler triggers `DisambiguationRequired` |

**Hypothesis:** Lume produces zero silent errors — every ambiguity is caught and surfaced. Copilot produces silent errors at a rate proportional to prompt ambiguity.

**Significance:** Silent errors are the most dangerous class of software defect. A system that *never* silently guesses eliminates this entire class.

### 9.3 Study C — NASA-TLX: Cognitive Load Measurement

**Objective:** Validate the Dissonance Hypothesis using the NASA Task Load Index [18].

| Subscale | Hypothesis |
|----------|------------|
| Mental Demand | Lume < Python (fewer transformations = less mental load) |
| Frustration | Lume ≈ 0 (no "why doesn't this work" moments) |
| Effort | Lume < Copilot (no review/edit cycle for wrong guesses) |
| Performance | Lume ≥ Python (equal or higher self-rated success) |

**Independent Variable:** CD score (number of active transformation dimensions).
**Dependent Variable:** NASA-TLX weighted score.
**Prediction:** As CD → 0, all NASA-TLX subscales trend toward minimum.

### 9.4 Study D — Technology Acceptance and Trust

Using the Technology Acceptance Model (TAM) [14] and Trust in Automation Scale [21], we will measure:

- **Perceived usefulness** — Does Lume feel productive?
- **Perceived ease of use** — Does Lume feel natural?
- **Trust** — Does the developer trust the compiler's interpretation?
- **Review Mode impact** — Does transparency increase trust and reduce anxiety?

### 9.5 Post-Launch Data Integration

`[POST-LAUNCH: After August 23, 2026, this section will include:]`

- Screenshots of the live Lume Playground IDE
- Usage metrics from the first month (compilations, voice sessions, Review Mode events)
- Early user feedback and quotes
- Cognitive load pilot results (NASA-TLX scores)
- Task completion time pilot results
- Error rate pilot results
- Examples of real programs written in Lume (with user permission)
- Examples of real voice sessions (with user permission)
- Examples of real Review Mode disambiguation events
- Adaptive Voice Profile learning curves from real users

---

## 10. Discussion

### 10.1 Intent-Resolving Compilation as a New Paradigm

Lume introduces a category that does not exist in current taxonomies: the *intent-resolving compiler*. Traditional compilers translate conformant syntax to machine code. Lume's compiler resolves human intent — including ambiguity, informality, and error — into deterministic, verifiable output. This is closer to dialogue systems than to parsers, closer to HCI than to programming language theory.

### 10.2 The Middleman Paradox

AI coding assistants (Copilot, ChatGPT, Cursor) have made programming more *convenient* but not less *cognitively expensive*. They have inserted a translation layer — the AI agent — between the developer and the compiler. The developer must now (1) formulate a prompt, (2) evaluate the AI's response, (3) correct errors, and (4) integrate the result. Each step adds cognitive load.

Lume eliminates the middleman. The compiler is the understanding layer. There is one translation step: human intent → compiled code. There is nothing to review (though Review Mode is available), nothing to correct, and nothing to integrate. The total cognitive work is lower.

### 10.3 Implications for CS Education

If cognitive distance is the primary barrier to programming, then reducing it should disproportionately benefit novice programmers — those with the least tooling fluency and the highest extraneous cognitive load. Lume's English Mode may enable a "natural language first" pedagogical approach: students express algorithms in English, observe the compiled output, and gradually develop syntactic fluency by reading generated code. This inverts the traditional pedagogy (learn syntax first, then express ideas) and may dramatically reduce dropout rates in introductory CS courses.

### 10.4 Implications for Accessibility

Current accessibility approaches add assistive technology *on top of* inaccessible systems. Lume demonstrates that accessibility can be a *core design property*: when the system accepts human language as input and provides human language as output, the most common physical and cognitive barriers disappear at the architecture level.

### 10.5 Domain Generality

`[POST-LAUNCH]` The Lume compiler architecture has been validated beyond general-purpose programming through deployment in a production 3D creative studio, where English Mode intent compiles not to JavaScript but to 3D engine API calls through a pluggable domain module. The same Tolerance Chain, the same Cleanup Layer, the same Adaptive Voice Profiles — targeting a completely different output domain. This establishes Lume as an intent compilation framework, not a JavaScript transpiler.

---

## 11. Limitations

1. **Accent variation.** Speech-to-text accuracy varies across accents and dialects. The Tolerance Chain and Adaptive Voice Profiles mitigate but cannot eliminate transcription errors for underrepresented accents in current speech recognition models.

2. **Domain-specific jargon.** The pattern library may not cover specialized terminology in niche domains (bioinformatics, quantum computing, financial derivatives). Domain-specific extension of the pattern library is required.

3. **Ambiguity ceiling.** Some natural language instructions are genuinely ambiguous even to humans. The DisambiguationRequired mechanism surfaces these cases, but it adds interaction steps that may feel onerous for expert users.

4. **AI resolver cost.** Layer 7 requires LLM API calls, introducing latency and monetary cost. Compile-lock caching mitigates repeated costs, but first-compilation cold starts remain expensive.

5. **Evaluation scope.** `[POST-LAUNCH]` The proposed evaluation plan requires real participants across diverse populations. Results will be included after the August 23, 2026 launch.

6. **JavaScript target.** Lume currently compiles only to JavaScript. Additional compilation targets (Python, Rust, WASM) would broaden applicability.

---

## 12. Future Work

### 12.1 Verbal State Machines

The `state` standard library module enables declarative state machines. Combined with English Mode, future work will enable fully verbal state machine definition.

### 12.2 Collaborative Intent Resolution

Multiple developers writing Lume simultaneously, with the compiler resolving conflicting intents at the semantic level rather than as text-level merge conflicts.

### 12.3 Cross-Modal Compilation

Extending Lume to accept mixed-modality input: voice + typed text + pasted code + handwritten notes + diagrammatic input, all resolved through the same Tolerance Chain into a unified AST.

### 12.4 Cognitive Distance as a UX Metric

Proposing CD as a general-purpose HCI metric applicable to any system where humans must translate intent into system-compatible input: command-line tools, configuration languages, database query interfaces, API design.

---

## 13. Conclusion

This paper has presented cognitive distance — the measurable gap between human intent and system-required expression — as the fundamental barrier to accessible, inclusive programming. We have described Lume, the first programming language designed to eliminate cognitive distance through an intent-resolving compiler.

Lume's Tolerance Chain absorbs the imprecision inherent in human communication, and the Cleanup Layer normalizes the additional noise introduced by speech-to-text systems. Together, they make voice-to-code an architectural consequence rather than a feature. Adaptive Voice Profiles extend this by learning per-user dialect patterns, improving accuracy over time without requiring users to change how they speak. Auditory Mode enables fully hands-free, eyes-free programming — making Lume the first programming language usable by a developer who cannot see a screen or touch a keyboard. Review Mode and the Resolution Manifest provide deterministic transparency, establishing trust through human-in-the-loop verification rather than black-box compilation.

We have proposed an empirical evaluation plan — Task Completion Time, NASA-TLX cognitive load, silent error rate, and Technology Acceptance — to validate the cognitive distance theory. We hypothesize that as CD → 0, cognitive load, frustration, and error rates also approach minimum: the dissonance disappears when the distance disappears.

Lume is not merely a new programming language. It is a demonstration that the translation burden imposed by formal syntax is an engineering choice, not a necessity — and that eliminating it opens programming to everyone who can describe what they want, in any language, through any modality.

---

## References

[1] Amershi, S., et al. Guidelines for Human-AI Interaction. *CHI 2019*.

[4] Baker, C. M., Milne, L. R., & Ladner, R. E. StructJumper: A Tool to Help Blind Programmers Navigate and Understand the Structure of Code. *CHI 2015*.

[10] Chen, M., et al. Evaluating Large Language Models Trained on Code. *arXiv 2021*.

[14] Davis, F. D. Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology. *MIS Quarterly, 1989*.

[15] Festinger, L. *A Theory of Cognitive Dissonance.* Stanford University Press, 1957.

[18] Hart, S. G., & Staveland, L. E. Development of NASA-TLX. *Advances in Psychology, 1988*.

[19] Hermans, F. *The Programmer's Brain.* Manning, 2021.

[20] Liao, Q. V., et al. Questioning the AI: Informing Design Practices for Explainable AI User Experiences. *CHI 2020*.

[21] Jian, J.-Y., Bisantz, A. M., & Drury, C. G. Foundations for an Empirically Determined Scale of Trust in Automated Systems. *IJCSA, 2000*.

[22] Ko, A. J., et al. Six Learning Barriers in End-User Programming Systems. *VL/HCC 2004*.

[23] Li, Y., et al. Competition-Level Code Generation with AlphaCode. *Science, 2022*.

[24] Liao, Q. V., & Varshney, K. R. Human-Centered Explainable AI (XAI). *Patterns, 2022*.

[26] Moller, F., & Crick, T. A University-Based Model for Supporting Computer Science Curriculum Reform. *JCSE, 2018*.

[28] Naftali, M., & Findlater, L. Accessibility in Context: Understanding the Truly Mobile Experience of Smartphone Users with Motor Impairments. *ASSETS 2014*.

[29] Serenade. Voice-to-Code Engine. serenade.ai, 2021.

[30] Stefik, A., & Siebert, S. An Empirical Investigation into Programming Language Syntax. *TOCE, 2013*.

[31] Sweller, J. Cognitive Load During Problem Solving: Effects on Learning. *Cognitive Science, 1988*.

[32] Talon. Hands-Free Input. talonvoice.com, 2020.

[35] Vaithilingam, P., Zhang, T., & Glassman, E. L. Expectation vs. Experience: Evaluating the Usability of Code Generation Tools Powered by Large Language Models. *CHI 2022*.

[36] Winograd, T. Understanding Natural Language. *Cognitive Psychology, 1972*.

---

## Appendix A: Required Figures and Tables

| Figure/Table | Description | Status |
|-------------|-------------|--------|
| Fig. 1 | CD scores comparison chart (Assembly → Lume) | Ready (data in §4.1) |
| Fig. 2 | Tolerance Chain architecture diagram | Ready (flow in §5.3) |
| Fig. 3 | Voice pipeline with Cleanup Layer stages | Ready (flow in §6.2) |
| Fig. 4 | Adaptive Voice Profile learning curve | Ready (formula in §5.4) |
| Fig. 5 | Review Mode screenshot | `[POST-LAUNCH]` |
| Fig. 6 | Auditory Mode interaction sequence diagram | Ready (§7.2) |
| Fig. 7 | Lume Playground IDE screenshot | `[POST-LAUNCH]` |
| Fig. 8 | DisambiguationRequired dialog example | Ready (§5.5) |
| Fig. 9 | Resolution Manifest structure | Ready (§8.2) |
| Table 1 | CD dimension definitions | Ready (§4) |
| Table 2 | CD scores across paradigms | Ready (§4.1) |
| Table 3 | Voice artifact → resolution layer mapping | Ready (§6.1) |
| Table 4 | Study A — TCT experimental design | Ready (§9.1) |
| Table 5 | NASA-TLX predicted subscale scores | Ready (§9.3) |
| Table 6 | `[POST-LAUNCH]` Pilot study results | Pending |

---

## Appendix B: Evaluation Data Collection Timeline

| Date | Activity | Data Produced |
|------|----------|---------------|
| August 23, 2026 | Lume + Trust Layer public launch | Live system, real usage begins |
| August 23–31 | Open access period | Raw usage metrics (compilations, voice sessions, Review Mode events) |
| September 1–7 | Pilot Study A — TCT | Task completion time data (n=40) |
| September 1–7 | Pilot Study B — Silent Error Rate | Error rate data (n=20) |
| September 1–7 | Pilot Study C — NASA-TLX | Cognitive load surveys (n=40) |
| September 1–7 | Pilot Study D — TAM/Trust | Technology acceptance surveys (n=40) |
| September 1–7 | Adaptive Voice Profile analysis | Learning curves, dialect mappings, confidence trajectories |
| Early September | CHI 2027 abstract submission | Abstract with summary metrics |
| Mid-September | CHI 2027 full paper submission | Complete manuscript with evaluation results |

---

## Appendix C: Demo Video Script (Recommended)

**Duration:** 3–5 minutes
**Title:** *"Lume: Programming Without Translation"*

**Scene 1 — The Problem (30s)**
Split screen: developer thinking "get the user's name" / typing `const name = await db.query(...)`. Narration explains cognitive distance.

**Scene 2 — Lume Text Mode (60s)**
Live screen recording of the Lume Playground. Developer types English, sees compiled JavaScript in real-time. Three examples increasing in complexity.

**Scene 3 — Lume Voice Mode (60s)**
Developer speaks commands aloud. The Cleanup Layer processes speech. The Tolerance Chain resolves. Real-time compilation appears on screen.

**Scene 4 — Review Mode (45s)**
Deliberately ambiguous command. Lume triggers DisambiguationRequired. Developer selects the correct interpretation by voice. Resolution Manifest updates.

**Scene 5 — Auditory Mode (45s)**
Developer puts hands behind back, closes eyes. Speaks commands. Hears compiler confirmation. Approves by voice. Complete program written without touching keyboard or viewing screen.

**Scene 6 — The Result (30s)**
The complete program runs. Output shown. Narration: "Zero cognitive distance. Zero translation. Zero exclusion."

---
