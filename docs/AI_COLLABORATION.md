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

The repository is **currently public**; code, issues and discussions may be visible to everyone. Do not place private material or credentials in them. If visibility changes, recheck connected-app permissions and GitHub Pages configuration.

## Workflow

1. Create or reuse an **Issue**. Scope one task, describe observed behavior, record acceptance criteria and link the baseline commit. Use the [canonical change-request form](Master_Blueprint.md#appendix-b--reusable-change-request-template) when helpful.
2. Assign **one writer per issue** (ChatGPT, Claude or a human); record that assignment in the Issue. Prefer `chatgpt/...` or `claude/...` branch prefixes for new tasks. The assigned writer opens a feature branch and PR; neither assistant edits `main` directly.
3. Assign the **other assistant as an independent reviewer**. An assistant never approves its own work. The reviewer reads the current source files, Issue, PR and tests, identifies specific problems and challenges assumptions.
4. Hand off **through GitHub**. Both assistants can read and comment on the repository, so the writer and reviewer post directly on the Issue or PR, and the owner starts the other assistant by giving it the Issue or PR link. Reviews include exact paths/sections, the reviewed commit SHA, test evidence, missing evidence and a GO/NO-GO decision. Pasting through the owner is only a fallback when an assistant has no GitHub access; never assume the other assistant has seen a chat.
5. The assigned writer handles the review in the same PR branch; the reviewer checks the updated diff. If both assistants need to implement alternatives, use **separate branches** and explicitly reconcile them.
6. Only the **owner** approves a merge. Run CI, merge after approval, then validate external deployments separately.

**Single-writer rule:** One writer owns a branch at any given time. Before editing, confirm the branch head and current `main`; update a stale branch before making further changes, then record the reviewed commit. To hand a branch to the other assistant, the owner says so explicitly, and the previous writer stops pushing to it.

## Review depth by risk

| Change | Review required |
| --- | --- |
| Game engine (`quest.js`), mission data (`content.js`, `unit1-data.js`), saved progress or `localStorage` keys, speech (`speech.js`), CI, deployment config (`wrangler.jsonc`, `.assetsignore`, `package.json`) | Independent review by the other assistant, green CI, then owner approval |
| Styling, page shells, tests only, substantive documentation (Blueprint, guides, this file) | Independent review recommended; owner approval |
| Typos, broken links, wording that changes no rule or behavior | Owner's own check is enough |

When unsure, use the stricter level.

## Disagreements

The writer and reviewer each state their position once on the PR, with evidence. They do not keep re-arguing. The [Master Blueprint](Master_Blueprint.md) settles product and educational questions; the **owner** decides everything else, including whether to change the Blueprint.

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
