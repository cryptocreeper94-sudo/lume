import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const sql = `
-- Users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name  VARCHAR(100),
    sso_id        VARCHAR(255) UNIQUE,
    phone         VARCHAR(20),
    sms_consent   BOOLEAN DEFAULT FALSE,
    sms_marketing BOOLEAN DEFAULT FALSE,
    referral_code VARCHAR(20) UNIQUE,
    referred_by   INTEGER REFERENCES users(id),
    tier          VARCHAR(20) DEFAULT 'bronze',
    signal_balance DECIMAL(12,2) DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    title       VARCHAR(500) NOT NULL,
    excerpt     VARCHAR(1000),
    body        TEXT NOT NULL,
    thumbnail   VARCHAR(500),
    author      VARCHAR(100) DEFAULT 'DarkWave Studios',
    tags        TEXT[] DEFAULT '{}',
    published   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id            SERIAL PRIMARY KEY,
    referrer_id   INTEGER NOT NULL REFERENCES users(id),
    referred_id   INTEGER REFERENCES users(id),
    code          VARCHAR(20) NOT NULL,
    status        VARCHAR(20) DEFAULT 'pending',
    signal_earned DECIMAL(12,2) DEFAULT 0,
    cookie_set_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Opt-Ins
CREATE TABLE IF NOT EXISTS sms_optins (
    id              SERIAL PRIMARY KEY,
    phone           VARCHAR(20) NOT NULL,
    user_id         INTEGER REFERENCES users(id),
    consent         BOOLEAN NOT NULL DEFAULT TRUE,
    marketing       BOOLEAN DEFAULT FALSE,
    opted_out       BOOLEAN DEFAULT FALSE,
    opted_out_at    TIMESTAMPTZ,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Hallmarks
CREATE TABLE IF NOT EXISTS hallmarks (
    id            SERIAL PRIMARY KEY,
    hallmark_id   VARCHAR(20) UNIQUE NOT NULL,
    user_id       INTEGER REFERENCES users(id),
    program_name  VARCHAR(255),
    program_hash  VARCHAR(128),
    status        VARCHAR(20) DEFAULT 'pending',
    chain_tx      VARCHAR(128),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    verified_at   TIMESTAMPTZ
);

-- Sessions (for JWT revocation)
CREATE TABLE IF NOT EXISTS sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    token_hash  VARCHAR(128) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_sso ON users(sso_id);
CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_optins(phone);
CREATE INDEX IF NOT EXISTS idx_hallmarks_user ON hallmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_hallmarks_hid ON hallmarks(hallmark_id);

-- Seed blog posts
INSERT INTO blog_posts (slug, title, excerpt, body, thumbnail, tags, published) VALUES
('ai-native-syntax', 'Why AI Should Be Syntax, Not a Library', 'Traditional languages force you to import SDKs and write boilerplate. Lume makes AI a language primitive.', 'Full article content here...', '/features/ai-syntax.png', ARRAY['ai','language-design'], true),
('self-sustaining-intro', 'Introducing the Self-Sustaining Runtime', 'Programs that monitor, heal, optimize, and evolve themselves — autonomously.', 'Full article content here...', '/features/self-healing.png', ARRAY['runtime','self-sustaining'], true),
('lume-vs-python', 'Lume vs. Python: 90% Less Code for AI', 'A side-by-side comparison showing how Lume eliminates AI boilerplate.', 'Full article content here...', '/features/optimizing.png', ARRAY['comparison','python'], true),
('milestone-6', 'Milestone 6 Complete: 219 Tests Passing', 'The self-sustaining runtime is live with 56 new tests across 4 autonomous layers.', 'Full article content here...', '/features/monitoring.png', ARRAY['milestone','testing'], true),
('trust-layer-integration', 'Connecting Lume to the Trust Layer Ecosystem', 'SSO, Signal Chat, hallmarking, and Signal rewards — all built in.', 'Full article content here...', '/ecosystem/sso.png', ARRAY['ecosystem','trust-layer'], true),
('pipe-operator', 'The Pipe Operator: Composing Data Flows', 'How Lume''s pipe operator chains transformations into readable data pipelines.', 'Full article content here...', '/features/pipe-operator.png', ARRAY['language','features'], true)
ON CONFLICT (slug) DO NOTHING;
`;

async function init() {
    console.log('⚡ Initializing Lume database...')
    try {
        await pool.query(sql)
        console.log('✅ Database initialized successfully')
        console.log('   · users table')
        console.log('   · blog_posts table (6 seeded)')
        console.log('   · referrals table')
        console.log('   · sms_optins table')
        console.log('   · hallmarks table')
        console.log('   · sessions table')
        console.log('   · 10 indexes created')
    } catch (err) {
        console.error('❌ Database init failed:', err.message)
    } finally {
        await pool.end()
    }
}

init()
