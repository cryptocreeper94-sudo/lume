/**
 * ═══════════════════════════════════════════════════════════
 *  LUME EDUCATION MODE — Beginner-Tuned Tolerance Chain
 *  
 *  Extended tolerance for common beginner mistakes:
 *    "make a red circle"           → canvas drawing code
 *    "draw a big blue square"      → SVG/canvas element
 *    "make the background green"   → CSS style change
 *    "add a button that says hello"→ DOM element creation
 *    "when I click the button, show 'hi'"  → event + alert
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Color name → hex mapping for beginners
 */
const COLORS = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
    purple: '#a855f7', pink: '#ec4899', orange: '#f97316', white: '#ffffff',
    black: '#000000', gray: '#6b7280', grey: '#6b7280', cyan: '#06b6d4',
    teal: '#14b8a6', indigo: '#6366f1', lime: '#84cc16', amber: '#f59e0b',
    sky: '#0ea5e9', rose: '#f43f5e', violet: '#8b5cf6', emerald: '#10b981',
}

/**
 * Shape name → drawing method mapping
 */
const SHAPES = {
    circle: { method: 'arc', args: 'x, y, radius, 0, Math.PI * 2' },
    square: { method: 'fillRect', args: 'x, y, size, size' },
    rectangle: { method: 'fillRect', args: 'x, y, width, height' },
    triangle: { method: 'path', custom: true },
    line: { method: 'lineTo', args: 'x1, y1, x2, y2' },
    star: { method: 'path', custom: true },
}

/**
 * Size modifiers → pixel values
 */
const SIZES = {
    tiny: 20, small: 40, medium: 80, normal: 80, big: 120, large: 160, huge: 240, giant: 320,
}

/**
 * Detect education mode commands
 */
export function detectEducationCommand(line) {
    const trimmed = line.trim().toLowerCase()

    // "make/draw a [size] [color] [shape]"
    const shapeMatch = trimmed.match(
        /^(?:make|draw|create|add)\s+(?:a\s+)?(?:(tiny|small|medium|big|large|huge|giant)\s+)?(\w+)\s+(circle|square|rectangle|triangle|line|star)$/i
    )
    if (shapeMatch) {
        const size = SIZES[shapeMatch[1]] || SIZES.medium
        const color = COLORS[shapeMatch[2]] || shapeMatch[2]
        const shape = shapeMatch[3].toLowerCase()
        return {
            type: 'EducationDraw',
            shape,
            color,
            size,
        }
    }

    // "make the background [color]"
    const bgMatch = trimmed.match(
        /^(?:make|change|set)\s+(?:the\s+)?background\s+(?:color\s+)?(?:to\s+)?(\w+)$/i
    )
    if (bgMatch) {
        const color = COLORS[bgMatch[1]] || bgMatch[1]
        return {
            type: 'EducationStyle',
            property: 'backgroundColor',
            value: color,
            target: 'body',
        }
    }

    // "add a button that says [text]"
    const btnMatch = trimmed.match(
        /^(?:add|create|make)\s+(?:a\s+)?button\s+(?:that\s+)?(?:says?\s+)?["']?(.+?)["']?$/i
    )
    if (btnMatch) {
        return {
            type: 'EducationElement',
            element: 'button',
            text: btnMatch[1],
        }
    }

    // "add a heading/title that says [text]"
    const headingMatch = trimmed.match(
        /^(?:add|create|make)\s+(?:a\s+)?(?:heading|title|header)\s+(?:that\s+)?(?:says?\s+)?["']?(.+?)["']?$/i
    )
    if (headingMatch) {
        return {
            type: 'EducationElement',
            element: 'h1',
            text: headingMatch[1],
        }
    }

    // "add a paragraph/text that says [text]"
    const textMatch = trimmed.match(
        /^(?:add|create|make|write)\s+(?:a\s+)?(?:paragraph|text|message|label)\s+(?:that\s+)?(?:says?\s+)?["']?(.+?)["']?$/i
    )
    if (textMatch) {
        return {
            type: 'EducationElement',
            element: 'p',
            text: textMatch[1],
        }
    }

    // "when I click [target], show/display [message]"
    const clickShowMatch = trimmed.match(
        /^when\s+(?:i\s+)?(?:click|press|tap)\s+(?:the\s+)?(.+?),?\s*(?:show|display|alert|say)\s+["']?(.+?)["']?$/i
    )
    if (clickShowMatch) {
        return {
            type: 'EducationEvent',
            event: 'click',
            target: clickShowMatch[1],
            action: 'show',
            message: clickShowMatch[2],
        }
    }

    // "make [target] [style]" (bigger, smaller, colorful, etc.)
    const styleMatch = trimmed.match(
        /^(?:make)\s+(?:the\s+)?(.+?)\s+(bigger|smaller|bold|italic|invisible|visible|colorful|sparkly|bouncy|spinning)$/i
    )
    if (styleMatch) {
        return {
            type: 'EducationStyle',
            target: styleMatch[1],
            effect: styleMatch[2].toLowerCase(),
        }
    }

    return null
}

/**
 * Compile an education command to JavaScript
 */
export function compileEducationCommand(node) {
    switch (node.type) {
        case 'EducationDraw':
            return compileDrawShape(node)
        case 'EducationStyle':
            return compileStyle(node)
        case 'EducationElement':
            return compileElement(node)
        case 'EducationEvent':
            return compileEvent(node)
        default:
            return `// Education: unhandled ${node.type}`
    }
}

function compileDrawShape(node) {
    const lines = [
        `// Draw a ${node.color} ${node.shape}`,
        `(function() {`,
        `  let canvas = document.querySelector('canvas');`,
        `  if (!canvas) {`,
        `    canvas = document.createElement('canvas');`,
        `    canvas.width = 600; canvas.height = 400;`,
        `    canvas.style.border = '2px solid ${COLORS.gray}';`,
        `    canvas.style.borderRadius = '12px';`,
        `    document.body.appendChild(canvas);`,
        `  }`,
        `  const ctx = canvas.getContext('2d');`,
        `  ctx.fillStyle = '${node.color}';`,
    ]

    const cx = 300, cy = 200, size = node.size
    if (node.shape === 'circle') {
        lines.push(`  ctx.beginPath();`)
        lines.push(`  ctx.arc(${cx}, ${cy}, ${size / 2}, 0, Math.PI * 2);`)
        lines.push(`  ctx.fill();`)
    } else if (node.shape === 'square' || node.shape === 'rectangle') {
        lines.push(`  ctx.fillRect(${cx - size/2}, ${cy - size/2}, ${size}, ${node.shape === 'rectangle' ? size * 0.6 : size});`)
    } else if (node.shape === 'triangle') {
        lines.push(`  ctx.beginPath();`)
        lines.push(`  ctx.moveTo(${cx}, ${cy - size/2});`)
        lines.push(`  ctx.lineTo(${cx + size/2}, ${cy + size/2});`)
        lines.push(`  ctx.lineTo(${cx - size/2}, ${cy + size/2});`)
        lines.push(`  ctx.closePath();`)
        lines.push(`  ctx.fill();`)
    } else if (node.shape === 'star') {
        lines.push(`  ctx.beginPath();`)
        lines.push(`  for (let i = 0; i < 5; i++) {`)
        lines.push(`    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;`)
        lines.push(`    const x = ${cx} + ${size/2} * Math.cos(angle);`)
        lines.push(`    const y = ${cy} + ${size/2} * Math.sin(angle);`)
        lines.push(`    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);`)
        lines.push(`  }`)
        lines.push(`  ctx.closePath();`)
        lines.push(`  ctx.fill();`)
    }

    lines.push(`})();`)
    return lines.join('\n')
}

function compileStyle(node) {
    if (node.property) {
        return `document.querySelector('${node.target}').style.${node.property} = '${node.value}';`
    }

    const effectMap = {
        bigger: `el.style.transform = 'scale(1.5)'; el.style.transition = 'transform 0.3s';`,
        smaller: `el.style.transform = 'scale(0.5)'; el.style.transition = 'transform 0.3s';`,
        bold: `el.style.fontWeight = 'bold';`,
        italic: `el.style.fontStyle = 'italic';`,
        invisible: `el.style.opacity = '0'; el.style.transition = 'opacity 0.3s';`,
        visible: `el.style.opacity = '1'; el.style.transition = 'opacity 0.3s';`,
        colorful: `el.style.background = 'linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)'; el.style.backgroundClip = 'text'; el.style.webkitBackgroundClip = 'text'; el.style.color = 'transparent';`,
        sparkly: `el.style.textShadow = '0 0 10px #ffd700, 0 0 20px #ff6b35'; el.style.transition = 'text-shadow 0.3s';`,
        bouncy: `el.style.animation = 'bounce 0.6s infinite alternate'; if (!document.querySelector('#lume-edu-anim')) { const s = document.createElement('style'); s.id = 'lume-edu-anim'; s.textContent = '@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-20px); } }'; document.head.appendChild(s); }`,
        spinning: `el.style.animation = 'spin 1s linear infinite'; if (!document.querySelector('#lume-edu-spin')) { const s = document.createElement('style'); s.id = 'lume-edu-spin'; s.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'; document.head.appendChild(s); }`,
    }

    return `(function() { const el = document.querySelector('${node.target}') || document.querySelector('[data-lume="${node.target}"]'); if (el) { ${effectMap[node.effect] || ''} } })();`
}

function compileElement(node) {
    return [
        `(function() {`,
        `  const el = document.createElement('${node.element}');`,
        `  el.textContent = ${JSON.stringify(node.text)};`,
        `  el.style.cssText = 'font-family: system-ui; padding: ${node.element === 'button' ? '12px 24px' : '8px'}; margin: 8px; border-radius: 8px; ${node.element === 'button' ? 'background: #06b6d4; color: white; border: none; cursor: pointer; font-size: 16px;' : ''}';`,
        `  el.setAttribute('data-lume', '${node.element}');`,
        `  document.body.appendChild(el);`,
        `})();`,
    ].join('\n')
}

function compileEvent(node) {
    return [
        `document.addEventListener('${node.event}', function(e) {`,
        `  if (e.target.matches('[data-lume="${node.target}"], ${node.target}')) {`,
        `    alert(${JSON.stringify(node.message)});`,
        `  }`,
        `});`,
    ].join('\n')
}

/**
 * Simplified error messages for education mode
 */
export function educationError(error) {
    const msg = error.message || String(error)
    
    const friendly = {
        'is not defined': `Hmm, I don't know what that is yet. Try defining it first with: define name = value`,
        'is not a function': `That's not something I can run — it's a value, not an action. Try a different word.`,
        'Unexpected token': `Something looks a little off. Check for missing quotes or parentheses.`,
        'missing )': `You forgot to close a parenthesis ) — every ( needs a matching )`,
        'missing }': `You forgot to close a curly brace } — every { needs a matching }`,
        'Unexpected end': `Your code stopped too early. Are you missing a closing bracket or quote?`,
    }

    for (const [pattern, message] of Object.entries(friendly)) {
        if (msg.includes(pattern)) return message
    }

    return `Something went wrong: ${msg}. Try simplifying your command.`
}

/**
 * English Mode patterns for education
 */
export const educationPatterns = [
    {
        match: /^(?:draw|make|create)\s+(?:a\s+)?(?:(tiny|small|big|large|huge)\s+)?(\w+)\s+(circle|square|rectangle|triangle|star)$/i,
        resolve: (m) => ({
            type: 'EducationDraw',
            size: SIZES[m[1]?.toLowerCase()] || SIZES.medium,
            color: COLORS[m[2]?.toLowerCase()] || m[2],
            shape: m[3].toLowerCase(),
        }),
        tags: ['education', 'draw']
    },
    {
        match: /^(?:add|create)\s+(?:a\s+)?button\s+(?:that\s+)?(?:says?\s+)?["']?(.+?)["']?$/i,
        resolve: (m) => ({ type: 'EducationElement', element: 'button', text: m[1] }),
        tags: ['education', 'ui']
    },
    {
        match: /^(?:change|make|set)\s+(?:the\s+)?background\s+(?:to\s+)?(\w+)$/i,
        resolve: (m) => ({ type: 'EducationStyle', property: 'backgroundColor', value: COLORS[m[1]] || m[1], target: 'body' }),
        tags: ['education', 'style']
    },
]

export { COLORS, SHAPES, SIZES }
