import { NodeType } from './parser.js'

export function estimateCost(ast) {
    let stats = {
        askCount: 0,
        thinkCount: 0,
        generateCount: 0,
        runtimeBlocks: 0,
        englishIntentBlocks: 0
    }

    function walk(node) {
        if (!node || typeof node !== 'object') return
        
        if (node.type === NodeType.AskExpression) stats.askCount++
        if (node.type === NodeType.ThinkExpression) stats.thinkCount++
        if (node.type === NodeType.GenerateExpression) stats.generateCount++
        if (['MonitorBlock', 'HealBlock', 'OptimizeBlock', 'EvolveBlock'].includes(node.type)) stats.runtimeBlocks++
        if (node.type === 'IntentBlock') stats.englishIntentBlocks++
        
        for (const key of Object.keys(node)) {
            const val = node[key]
            if (Array.isArray(val)) {
                val.forEach(walk)
            } else if (typeof val === 'object' && val !== null) {
                walk(val)
            }
        }
    }

    walk(ast)
    
    // Abstract token boundary estimation based on gpt-4o-mini pricing
    // Assuming roughly ~1,000 contextual tokens per standard execution loop
    const averageCostPerCall = 0.00015 // $0.15 per 1M tokens -> 0.00015 per 1,000 tokens
    const totalCalls = stats.askCount + stats.thinkCount + stats.generateCount + stats.runtimeBlocks + stats.englishIntentBlocks
    const estimatedCost = totalCalls * averageCostPerCall
    
    return { ...stats, totalCalls, estimatedCost }
}
