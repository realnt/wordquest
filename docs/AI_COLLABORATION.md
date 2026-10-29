# Word Quest — ChatGPT × Claude collaboration

**Scope:** Development collaboration between ChatGPT and Claude, in web chats or coding agents (Codex, Claude Code). Separate assistants do **not** share conversation history, tool state, or decisions. GitHub is the only shared record.

## Shared source of truth

| Record | Authority |
| --- | --- |
| Accepted code and release version | `main` branch; `site-version.js` for the source version |
| Educational goals, scope, product decisions and compatibility constraints | [Master Blueprint](Master_Blueprint.md), especially §6 |
| Implementation, tests and deployment procedure | [English Development Guide](Development_Guide_EN.md) and [中文开发指南](Development_Guide_ZH.md) |
| Current assignments, acceptance criteria and handoffs | [GitHub Issues](https://github.com/realnt/wordquest/issues) |
| Proposed changes, diffs, independent review and CI | [GitHub pull requests](https://github.com/realnt/wordquest/pulls) |
| Release plan and work status | [Milestones](https://github.com/realnt/wordquest/milestones) and the owner's [Word Quest project board](https://github.com/users/realnt/projects/2) |

The repository is **currently public**; code, issues and discussions may be visible to everyone. Do not place private material or credentials in them. If visibility changes, recheck connected-app permissions and GitHub Pages configuration.

## Workflow

1. Create or reuse an **Issue**. Scope one task, describe observed behavior, record acceptance criteria and link the baseline commit. Use the [canonical change-request form](Master_Blueprint.md#appendix-b--reusable-change-request-template) when helpful.
2. Assign **one writer per issue** (ChatGPT, Claude or a human); record that assignment in the Issue. Prefer `chatgpt/...` or `claude/...` branch prefixes for new tasks. The assigned writer opens a feature branch and PR; neither assistant edits `main` directly.
3. Assign the **other assistant as an independent reviewer**. An assistant never approves its own work. The reviewer reads the current source files, Issue, PR and tests, identifies specific problems and challenges assumptions.
4. Hand off **through GitHub when the assistant has authorized access**. The writer and reviewer post on the Issue or PR directly **when their connected tools permit it**. The owner starts the next assistant with the Issue or PR link. Reviews include exact paths/sections, the reviewed commit SHA, test evidence, missing evidence and a GO/NO-GO decision. If direct access or commenting is unavailable, the owner transfers the review to GitHub. Never assume another chat has seen a message.
5. The assigned writer handles the review in the same PR branch; the reviewer checks the updated diff. If both assistants need to implement alternatives, use **separate branches** and explicitly reconcile them.
6. Only the **owner** approves a merge. Run CI, merge after approval, then validate external deployments separately.

**Single-writer rule:** Only one active writer owns a branch at any given time. Before editing, confirm the branch head and current `main`; update a stale branch before making further changes, then record the reviewed commit. For a handover, the owner records the **new writer, previous writer and branch-head SHA** in the Issue or PR. The previous writer stops pushing; the new writer verifies that SHA before making changes. Separate branches are required for simultaneous alternatives.

## Tracking work

- **Milestones** group Issues by release (e.g. `v1.5.3`). Every planned Issue belongs to one; unscheduled Issues have none.
- **Labels:** `writer: claude` or `writer: chatgpt` records the assigned writer (step 2); `risk: high`, `risk: medium` or `risk: low` records the review level below. Assistants keep these up to date on Issues and PRs they work on.
- **Board:** the existing [Word Quest project board](https://github.com/users/realnt/projects/2) belongs to the owner's GitHub account and is linked to this repository. It is a **view** over these Issues and PRs, not a second backlog: don't create another board, and don't track work that exists only on the board.
- **Board columns:** Backlog → Ready (scoped, writer assigned) → In progress (branch exists) → In review (PR open for review) → Done.
- **Who moves cards:** the owner moves cards to Ready, In progress and In review. **If the board's workflows are enabled**, closed Issues and merged PRs move to Done automatically; otherwise the owner moves them. Assistants may not be able to edit the board.
- **Which record wins:** the Issue or PR state, its labels and milestone are authoritative. A card's column is never more authoritative than the item's actual state. If they disagree, trust the Issue/PR and tell the owner.

## Review depth by risk

Classify by **behavioral impact**, not solely by filename. The paths below are examples, not an exhaustive allowlist.

| Risk | Change examples | Review required |
| --- | --- | --- |
| **High** | Gameplay, mission answers/translations or etymology (`quest.js`, `content.js`, `unit1-data.js`); saved-progress keys, formats or XP; interactive/speech JavaScript (`speech.js`, `site-shell.js`, `site-version.js`); HTML changes affecting scripts, navigation or saved state (`index.html`, `unit*.html`); CI, browser configuration or deployment (`.github/workflows/*`, `playwright.config.js`, `package.json`, `wrangler.jsonc`, `.assetsignore`); removing or bypassing regression checks | Other-assistant independent review **required**, relevant CI **green**, risk-specific checks documented, then owner approval |
| **Medium** | Visual-only CSS (`quest.css`, `site.css`, `speech.css`), non-behavioral page markup, additive tests, substantive product/technical documentation (Blueprint, guides, this workflow) | Independent review **recommended**, applicable checks, then owner approval |
| **Low** | Typographical corrections and routine documentation-link/wording fixes that do **not** alter teaching meaning, navigation, product rules, compatibility or behavior | Owner check sufficient |

When uncertain or when multiple categories overlap, use the **highest applicable risk**. Automated tests do not replace human review of educational correctness, accessibility or real-device speech.

## Disagreements

The writer and reviewer record their differing positions and evidence in the PR, then identify the specific decision needed. Avoid circular argument, but **update the discussion if new evidence or a material correction emerges**. The [Master Blueprint](Master_Blueprint.md) is the **current authority for agreed product and educational requirements**, not a substitute for testing or evidence. Escalate any conflict with its rules, or any proposed change to them, to the **owner for an explicit decision**. The owner has final approval authority for all unresolved decisions and merges. Record the decision in the Issue or PR; update the Blueprint only if the owner approves a product-rule change.

## One canonical handoff prompt

Use [Master Blueprint — Appendix A](Master_Blueprint.md#appendix-a--reusable-ai--developer-handoff-prompt) for the AI/developer handoff and [Appendix B](Master_Blueprint.md#appendix-b--reusable-change-request-template) for issue details. **Do not maintain a separate template here.**

An Issue or PR handoff should identify its Issue URL, branch/commit SHA, assigned writer and reviewer, exact acceptance criteria, verified tests, unresolved risks and deployment status. The Blueprint owns the product invariants and scope exclusions.

## Verification and release evidence

- For automated testing procedures, follow the [development guides](Development_Guide_EN.md). The browser CI runner is pinned to Ubuntu 24.04 for the current Playwright release.
- Check the `validate` and `browser` jobs on the **current PR head**. Never interpret a browser-install failure as a gameplay regression without inspecting logs.
- PR success is not production deployment. After merge, verify **GitHub Pages** (`publish` job and actual website) separately from **Cloudflare** (`Workers Builds: wordquest` check, live page and version badge).
- A repository visibility change can require re-enabling Pages through **Settings → Pages** (source: GitHub Actions).
- Mobile-sized Linux WebKit does **not** verify real iPhone Safari system voices. Mark iPhone voice and speed acceptance unverified until actually tested on a device.
- Compare claimed versions to `site-version.js` and merged history. If deployment evidence is unavailable, label it **unverified**, not successful.
