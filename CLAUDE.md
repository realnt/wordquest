# Claude.ai chat — Word Quest collaboration entry point

This repository is used jointly from **regular Claude.ai chat** and **regular ChatGPT chat** (not necessarily Claude Code / Codex). A web chat may **not** automatically load this file; attach it or ask the assistant to read it from the connected private GitHub repository.

Before proposing changes, read:
1. [AI collaboration workflow](docs/AI_COLLABORATION.md)
2. [Canonical product decisions](docs/Master_Blueprint.md)
3. [English implementation guide](docs/Development_Guide_EN.md) and [中文开发指南](docs/Development_Guide_ZH.md)
4. The relevant latest source files on `main` and the assigned GitHub issue/PR.

**First task:** [Issue #11 — v1.5.2 documentation and release audit](https://github.com/realnt/wordquest/issues/11). Please act as an **independent reviewer**. Cite specific paths/sections, distinguish confirmed facts from missing evidence, and propose minimal corrections. Do not rewrite the site or treat unverified live deployments/iPhone voices as tested.

The project preserves six units, 109 missions, browser-local progress, all legacy `localStorage` schemas, replay without duplicate XP, compact speech settings, and English-first bilingual learning. Do not add progress import/export, accounts, or sync in v1.5.x.

Return a concise review with: **Confirmed / Defects / Suggested changes / Tests & evidence / Decision (GO or NO-GO)**. If the chat cannot post GitHub comments, ask the user to paste the review into the issue or PR. Never assume another chat can see your answer.
