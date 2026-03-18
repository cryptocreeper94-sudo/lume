---
description: Sync the Lume test count across all ecosystem repos after adding tests
---

# Sync Test Count

After adding new tests to Lume, run this to update the test count everywhere.

## Quick Run

// turbo-all

1. **Dry run** (see what would change):
```
node scripts/sync-test-count.js
```

2. **Apply changes** (update all files):
```
node scripts/sync-test-count.js --apply
```

3. **Apply + commit + push** (full distribution):
```
node scripts/sync-test-count.js --apply --push
```

## What It Updates

The script updates test count references across **17 files** in **3 repos**:

### Lume (`D:\lume`)
- `website/src/pages/ResearchPage.jsx` — typing effect + AnimatedNumber
- `website/src/components/HeroCarousel.jsx` — hero stat
- `website/src/pages/DevPortal.jsx` — tech stack FAQ + server meta fallback
- `website/src/pages/ExplorePage.jsx` — milestones heading
- `website/src/pages/ChangelogPage.jsx` — highlights + improved items
- `website/src/data/presentationData.js` — 3 stats entries + narration
- `README.md` — project stats
- `CHANGELOG.md` — release notes
- `LUME_ACADEMIC_BRIEF.md` — metrics table
- `LUME-ACADEMIC-PAPER.md` — test verification section
- `darkwave_studios_handoff.txt` — handoff doc

### DWSC (`D:\dwsc`)
- `index.html` — Lume feature list

### Trust Layer Hub (`D:\trust-layer-hub`)
- `LUME-ACADEMIC-PAPER.md` — test verification section
- `LUME-ACADEMIC-PAPER-BRIEF.md` — metrics table
- `LUME-MASTER-SPECIFICATION.md` — metrics table + directory tree
- `constants/ecosystem-apps.ts` — Lume app description
- `server/ai-agent.ts` — AI agent context stats
