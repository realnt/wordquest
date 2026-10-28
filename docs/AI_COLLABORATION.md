# Word Quest — ChatGPT × Claude.ai collaboration

**Scope:** regular ChatGPT chat and regular Claude.ai chat. Neither chat automatically sees the other's conversation or actions. **Pilot task:** [Issue #11](https://github.com/realnt/wordquest/issues/11).

## One shared source of truth

| Record | Authoritative location |
| --- | --- |
| Accepted source code and release files | `main` branch of `realnt/wordquest` |
| Educational scope, product decisions, non-negotiable constraints | [Master Blueprint](Master_Blueprint.md) |
| Implementation and testing practices | [English Development Guide](Development_Guide_EN.md) and [Chinese Development Guide](Development_Guide_ZH.md) |
| Work to be done / questions / AI handoffs | [GitHub Issues](https://github.com/realnt/wordquest/issues) |
| Proposed edits and independent reviews | [GitHub pull requests](https://github.com/realnt/wordquest/pulls) |
| Real deployment evidence | Test the Cloudflare and GitHub Pages URLs separately, after publishing |

Do **not** keep competing specifications in each AI's chat history. Do not treat a proposed PR, test pass, or a prior assistant's summary as proof of a deployed release. Verify from `main` and actual deployment evidence.

## How to collaborate in two web chat interfaces

1. **User or ChatGPT** opens a scoped GitHub issue with observed behavior, acceptance criteria, preserved functionality, and a link to the current baseline. If an issue exists, reuse it.
2. **ChatGPT** reads the current repository and proposes a change or makes a small change on a dedicated feature branch, opening a PR. Never edit `main` directly.
3. **Claude.ai (regular chat)** independently reads the same GitHub content, issue and PR (connect GitHub in Claude if permitted; the repository is **private**, so access must be authorized). Ask Claude for file- and line-specific criticism, alternative explanations, missing tests and release risks. A pasted issue/PR excerpt is the fallback if Claude can't read GitHub.
4. **User** pastes Claude's review into the PR/issue or brings it back to ChatGPT, including the affected revision. Do not claim the assistants communicate automatically.
5. **ChatGPT** addresses the review on the feature branch, updates tests when relevant and records what changed.
6. **User** approves a merge only after reviewing the evidence. Never auto-merge. For code changes, check CI and inspect both the Cloudflare Worker and GitHub Pages after merge, when applicable.

**Single-writer rule:** only one AI edits any given branch/file at a time. Use separate branches for parallel proposals. Record the base commit/branch to avoid stale reviews.

## Standard handoff template

```text
Project: Word Quest (realnt/wordquest; private)
Issue: <GitHub issue URL>
Target PR/branch and commit: <URL or SHA; otherwise read current main>
Objective: <single bounded task>
Source of truth: docs/Master_Blueprint.md + bilingual development guides + current source
Preserve: 6 units, 109 missions, existing localStorage keys and score schemas,
          English-first and optional Chinese, correct morphology/etymology,
          mobile layout and speech preferences
Evidence required: exact files/sections, observed vs expected behavior, test results
Output: confirmed findings, suggested change, unresolved risks, GO / NO-GO
Scope exclusion: no accounts, progress import/export, cross-device sync, or rewrite
```

## Verification and release rules

- For unit and static checks: `python3 tests/check_site.py`; `npm run test:unit`; `node --check quest.js` and other changed JS files.
- For browser regression: `npm install --no-audit --no-fund --package-lock=false`; `npx playwright install chromium webkit`; `npm run test:browser`.
- Existing GitHub Actions `validate` and `browser` jobs must pass for a code-change PR. Documentation-only PRs should still be reviewed for accuracy.
- Playwright mobile-sized WebKit **does not** verify installed voices on a physical iPhone. Test iPhone Safari speech, voice preference and speed manually before claiming acceptance.
- Replay/practice must not award extra XP or alter stored mistakes/completions. Original storage keys and Unit 1 legacy schema must remain compatible.
- Never claim the current released version solely from the README if it conflicts with `site-version.js`, merged PRs or deployment evidence.
- **Intentional deferral:** no progress import/export in v1.5.x; browser-local saved progress is kept.

## First exercise — Issue #11

Independent Claude review: verify merged v1.5.2 versus stale v1.5.1/proposed text in README and three canonical guides. List exact statements to update, separate confirmed automated test evidence from unverified live deployment and iPhone behavior, and review this collaboration PR before merging. **Do not change application source code as part of this pilot.**
