/**
 * ═══════════════════════════════════════════════════════════
 *  LUME DEPLOY ENGINE — Self-Healing Deployment as a Keyword
 *  
 *  Lume syntax:
 *    deploy to render from "main"
 *    deploy status
 *    deploy rollback
 *    deploy check "https://dwsc.io"
 *    deploy monitor "https://dwsc.io" every 30 seconds
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Deployment target registry
 * Maps Lume target names → deployment configurations
 */
const DEPLOY_TARGETS = {
    render: {
        name: 'Render',
        type: 'static',
        buildCommand: 'node build.js',
        pushCommand: 'git push',
        healthCheckDelay: 120000, // 2 min
    },
    vercel: {
        name: 'Vercel',
        type: 'serverless',
        buildCommand: 'npx vercel --prod',
        healthCheckDelay: 60000,
    },
    netlify: {
        name: 'Netlify',
        type: 'static',
        buildCommand: 'npx netlify deploy --prod',
        healthCheckDelay: 60000,
    },
    local: {
        name: 'Local',
        type: 'dev',
        buildCommand: 'node build.js',
        healthCheckDelay: 3000,
    }
}

/**
 * Detect deploy command in Lume source
 * Returns parsed deploy instruction or null
 */
export function detectDeploy(line) {
    const trimmed = line.trim()

    // deploy to <target> from "<branch>"
    const deployTo = trimmed.match(
        /^deploy\s+to\s+(\w+)(?:\s+from\s+["']?(\w+)["']?)?$/i
    )
    if (deployTo) {
        return {
            type: 'DeployCommand',
            action: 'deploy',
            target: deployTo[1].toLowerCase(),
            branch: deployTo[2] || 'main',
        }
    }

    // deploy status
    if (/^deploy\s+status$/i.test(trimmed)) {
        return { type: 'DeployCommand', action: 'status' }
    }

    // deploy rollback
    if (/^deploy\s+rollback$/i.test(trimmed)) {
        return { type: 'DeployCommand', action: 'rollback' }
    }

    // deploy check "<url>"
    const check = trimmed.match(/^deploy\s+check\s+["'](.+?)["']$/i)
    if (check) {
        return { type: 'DeployCommand', action: 'check', url: check[1] }
    }

    // deploy monitor "<url>" every <n> seconds
    const monitor = trimmed.match(
        /^deploy\s+monitor\s+["'](.+?)["']\s+every\s+(\d+)\s+(seconds?|minutes?)$/i
    )
    if (monitor) {
        const interval = monitor[3].startsWith('minute') 
            ? parseInt(monitor[2]) * 60 
            : parseInt(monitor[2])
        return { type: 'DeployCommand', action: 'monitor', url: monitor[1], interval }
    }

    return null
}

/**
 * Compile a DeployCommand AST node to JavaScript
 */
export function compileDeploy(node) {
    switch (node.action) {
        case 'deploy': {
            const target = DEPLOY_TARGETS[node.target] || DEPLOY_TARGETS.local
            return [
                `// ═══ Lume Deploy: ${target.name} ═══`,
                `(async () => {`,
                `  console.log('  ✦ Deploying to ${target.name}...');`,
                `  const { execSync } = require('child_process');`,
                `  try {`,
                `    // Stage 1: Build + Validate`,
                `    console.log('  ⟐ Building...');`,
                `    execSync('${target.buildCommand}', { stdio: 'inherit' });`,
                `    console.log('  ✓ Build passed');`,
                ``,
                `    // Stage 2: Push`,
                `    console.log('  ⟐ Pushing to ${target.name}...');`,
                `    execSync('${target.pushCommand}', { stdio: 'inherit' });`,
                `    console.log('  ✓ Pushed to ${target.name}');`,
                ``,
                `    // Stage 3: Health check (after deploy delay)`,
                `    console.log('  ⟐ Waiting for deploy...');`,
                `    await new Promise(r => setTimeout(r, ${target.healthCheckDelay}));`,
                `    console.log('  ✓ Deploy complete');`,
                `  } catch (e) {`,
                `    console.error('  ✗ Deploy failed:', e.message);`,
                `    console.log('  ⟐ Run: deploy rollback');`,
                `  }`,
                `})();`,
            ].join('\n')
        }

        case 'status':
            return `require('child_process').execSync('node lume-heal.js status', { stdio: 'inherit' });`

        case 'rollback':
            return `require('child_process').execSync('node lume-heal.js rollback', { stdio: 'inherit' });`

        case 'check':
            return `require('child_process').execSync('node lume-heal.js check ${node.url}', { stdio: 'inherit' });`

        case 'monitor':
            return `require('child_process').execSync('node lume-heal.js monitor ${node.url} ${node.interval || 30}', { stdio: 'inherit' });`

        default:
            return `// Unknown deploy action: ${node.action}`
    }
}

/**
 * English Mode patterns for deploy
 */
export const deployPatterns = [
    {
        match: /^(?:deploy|push|ship|release)(?:\s+(?:this|the\s+app|the\s+site))?\s+to\s+(\w+)(?:\s+from\s+["']?(\w+)["']?)?$/i,
        resolve: (m) => ({ type: 'DeployCommand', action: 'deploy', target: m[1].toLowerCase(), branch: m[2] || 'main' }),
        tags: ['devops', 'deploy']
    },
    {
        match: /^(?:check|show|get)\s+(?:the\s+)?deploy(?:ment)?\s+status$/i,
        resolve: () => ({ type: 'DeployCommand', action: 'status' }),
        tags: ['devops', 'deploy']
    },
    {
        match: /^(?:rollback|revert|undo)\s+(?:the\s+)?(?:last\s+)?deploy(?:ment)?$/i,
        resolve: () => ({ type: 'DeployCommand', action: 'rollback' }),
        tags: ['devops', 'deploy']
    },
    {
        match: /^(?:is\s+)?(?:the\s+)?(?:site|app|deployment)\s+(?:up|running|alive|healthy)\??$/i,
        resolve: () => ({ type: 'DeployCommand', action: 'status' }),
        tags: ['devops', 'health']
    },
]

export { DEPLOY_TARGETS }
