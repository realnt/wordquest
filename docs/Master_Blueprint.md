# Word Quest — Master Blueprint

**Product specification, design decisions, and AI development handoff**  
**Baseline:** released repository `main` at **v1.5.1** · **21 October 2026**  
**Next proposed release:** [v1.5.2 — PR #9](https://github.com/realnt/wordquest/pull/9), **not merged at this baseline**  
**Repository:** https://github.com/realnt/wordquest  
**Production URL:** https://wordquest.orbitlab.workers.dev/  
**Curriculum:** 上海五四制 2024 新版七年级英语上册 / 2024 Shanghai five-four-system Grade 7 English, Semester 1

> **Document contract:** This is the canonical statement of the project's **WHAT and WHY**: pedagogy, student experience, non-negotiable product decisions, release requirements, and future-work boundaries. The [English Development Guide](Development_Guide_EN.md) and [Chinese Development Guide](Development_Guide_ZH.md) document the **HOW**. Source code and merged PRs take precedence for observed implementation details; this specification records intended behavior. Flag discrepancies instead of silently overwriting accepted decisions.

## 1. Mission and audience

Word Quest is an **English-first, textbook-aligned vocabulary and word-discovery adventure** for Grade 7 learners. Students solve contextual puzzles, use word parts and progressive clues, and receive accurate, memorable language explanations.

**Learning loop: Solve → Understand → Discover → Next Mission.**

The purpose is to develop transferable strategies for unfamiliar English words, not to test obscure root trivia or encourage blind guessing. Word choice follows the assigned textbook; difficulty and clue design should suit the learner's reading proficiency.

### Design decisions we learned through iteration

- **Reasoning over trivia.** “What did this Latin word mean?” without useful evidence is not an inferential task. Provide context, patterns, or word-part clues.
- **English first, Chinese on demand.** Chinese must support comprehension without replacing English or leaking the correct answer prematurely.
- **One concise discovery, immediately visible.** Earlier multi-panel Language Journey / Timeline / Explore More content created excessive reading and tapping, especially on iPhone. Put the memorable explanation directly after answering.
- **Correct terminology matters.** Compounding, derivation, grammar, semantic relationships and historical etymology are not interchangeable.
- **Transfer matters.** Link new missions to earlier roots, affixes, word families, or problem-solving methods.
- **Keep the game usable on PC and iPhone.** Prioritize the question and controls; move rarely changed settings behind compact controls.

## 2. Defined educational scope

These are **counts from the game's dataset**, not a fresh independent audit against the physical textbook.

| Unit | Topic | Word-study emphasis | Missions | Vocabulary / expressions |
|---|---|---|---:|---:|
| 1 | Trying New Things | Compounds, inventions, word history | 23 | 43 |
| 2 | Strong Mind | Opposites and word families | 17 | 48 |
| 3 | Jobs | Occupation suffixes: -er, -or, -ist | 17 | 56 |
| 4 | Smart Home | Semantic networks and technology | 17 | 40 |
| 5 | Films | Prefixes: un-, dis-, im-, in-, re- | 17 | 42 |
| 6 | Mountains and Rivers | Dictionary skills and compounds | 18 | 36 |
| **Total** | | | **109** | **265** |

**Curriculum authority:** the official 2024 edition, especially Word Study and the unit lists (the existing project cites pp. 125–128 and 140–144). Verify each term, spelling, meaning, unit placement, and part of speech when revising content. Distinguish required textbook items from extension vocabulary. Write original scenarios; avoid reproducing extended textbook passages.

## 3. Required mission experience

Every mission should contain:

1. **Contextual scenario:** short, vivid English with enough clues to reason.
2. **Question or action:** choose a word or assemble word parts. Test a genuine thinking skill, not just recall.
3. **Two escalating hints:** the first suggests a strategy; the second narrows it. Do not reveal the answer immediately.
4. **Feedback:** communicate success or error clearly, including a useful explanation for the correct answer.
5. **Word formation / word history:** one accurately categorized, compelling connection displayed immediately after solving.
6. **Next / Map / Review:** direct navigation, the saved mission map, and vocabulary revision.

Game-wide mechanics: ordered mission unlocking, multiple choice, word building, XP, mistakes, individual and global Chinese support, per-unit Word Vault, hints, and a completion screen.

**Replay requirement:** Completed missions must be reviewable. **v1.5.1 currently shows the solution instead of reopening the question.** PR #9 proposes temporary Practice mode in v1.5.2; practice must never add XP, overwrite a completed record, or increase historical mistake totals. Do not document the proposal as released until PR #9 is merged.

## 4. Bilingual design

- Default: primary English mission, question, hints, explanations and language stories; show one Chinese passage only when requested.
- Chinese Support ON: show English followed by accurate, succinct Chinese for the same learning segments.
- Answers and selectable English words remain in English.
- The translation must not spoil an unanswered puzzle.
- Review Chinese for accuracy and naturalness, especially when explaining parts of speech and borrowed words.
- Escape HTML reliably; encoded entities and raw markup must not appear in student-facing text.

## 5. Linguistic evidence rules

**Never infer shared historical origins from superficial spelling resemblance.**

| Claim type | Good English wording | Preferred Chinese |
|---|---|---|
| Attested lineage | can be traced back to | 可追溯到 |
| Language borrowing | entered English through | 经由……传入英语 |
| Productive word-building | formed from | 由……构成 |
| Demonstrated common ancestor | shares a common origin with | 与……同源 |

Use reliable dictionaries and exact-word Etymonline references where available; check historical forms, borrowing pathways, dates, and singular/plural. Avoid categorical “最终源于” where the evidence is multi-step or uncertain.

**Editorial examples:**

- **magazine:** historical borrowing through European languages to Arabic *makhāzin* (“storehouses”); **not** a fictitious `MAG + AZINE` compound. The exact route and any historic publication dates must be rechecked before publishing edits.
- **print / printing:** `-ing` may participate in different grammatical roles depending on sentence context. Distinguish present participle, gerund, and lexical noun rather than stating that `-ing` always makes a noun.
- **improve:** do not teach `im- + prove` solely from surface spelling.
- **windsurfing, traffic light, solar panel:** useful transparent compounds; no invented ancient origin is needed.

## 6. Product and technology constraints

### Shared architecture (v1.5.1, merged)

- All six units use **`quest.js`** for gameplay and **`quest.css`** for puzzle styling.
- **`unit1-data.js`** preserves Unit 1's original 23 missions, five chapters, language notes and glossary. **`content.js`** provides Units 2–6.
- **`site-shell.js`** and **`site.css`** define shared navigation, brand, footer, responsive shell and design tokens.
- **`speech.js`** and **`speech.css`** provide browser-native pronunciation, voice settings and compact controls.
- **`site-version.js`** supplies the visible site version.
- Homepage `index.html` and entry pages `unit1.html` through `unit6.html` are small static documents; no React runtime or build system is needed for the game.

### Storage compatibility — DO NOT BREAK

- Unit 1 progress key: **`wordquest_g7u1_v1`**, legacy fields including `earned`, `maxUnlocked`, `misses` and `score`.
- Units 2–6 keys: **`wordquest_g7uN_semester_v1`**, fields including `completed`, `unlocked`, `mistakes` and `points`.
- Speech settings: **`wordquest_speech_accent_v1`**, **`wordquest_speech_voice_v1`**, **`wordquest_speech_speed_v1`**.

Saved data is scoped to the exact **browser + device + origin**. The Cloudflare and GitHub Pages domains do **not** synchronize. An update at the same origin normally retains local data.

**Established scope boundary:** no user accounts, online database, cross-device sync or Export/Import Progress in the v1.5 series unless explicitly reapproved.

### Speech behavior

Native `speechSynthesis.getVoices()` and `SpeechSynthesisUtterance`; no dependency on a paid TTS endpoint or Google-specific voices. Default UK; select UK/US accents, preview voices, and speed 0.80×–1.20× (default 1.00×). Voice choice is device-dependent and persisted separately per accent. Based on actual iPhone observations, prefer UK Daniel / US Samantha when present and no manual choice exists; do not claim universal device support. Microsoft Hazel and Susan may synthesize nearly identical audio on some Windows setups. Keep the normally collapsed voice-settings button.

### Mobile and accessibility

Compact mobile hero (title, XP, progress), readable English, clear chosen/wrong/correct feedback, usable tap targets, keyboard focus indicators, no horizontal overflow. Check approximately 375/390px and a desktop width of at least 1280px. A browser WebKit emulation is **not** proof of actual iPhone voice quality.

## 7. Release history and decision log

| Milestone | Confirmed change |
|---|---|
| v1.1 | Unit 1 prototype: 23 missions and corrected 43-word vault |
| v1.2–v1.2.1 | Full bilingual explanations, refined grammar and cautious etymology wording |
| v1.3–v1.3.2 | Simplified word stories and removed unnecessary extra clicks |
| Semester expansion / v1.4 | Six units; 109 missions, 265 entries; compact mobile layout |
| v1.4.2 | Browser-native word and sentence audio |
| v1.4.3–v1.4.6 | UK/US accents, adjustable speed, individual voice picker, styling refinement |
| v1.4.7 | Compact voice-settings button and shared version badge |
| v1.5.0 | Shared page header/footer and design system |
| **v1.5.1 — released baseline** | One gameplay engine and stylesheet for all six units, Unit 1 data adapter |
| **v1.5.2 — proposed** | [PR #9](https://github.com/realnt/wordquest/pull/9): functioning replay practice, content checks, real-browser regressions. Not merged as of 21 Oct 2026 |

Use the [repository PR history](https://github.com/realnt/wordquest/pulls?q=is%3Apr+is%3Aclosed) and actual `site-version.js` for current state.

## 8. Quality gates

**Curriculum & content:** correct target words, two useful hints, valid answer indices and build paths, translated meaning, defensible morphology/history, no accidental spoilers.

**Game regression:** all six unit pages, correct/wrong answers, word-piece order, three-attempt behavior where relevant, hints, score, map, vault, completion, translations, saved-state restoration, and no repeated XP during replay.

**Speech:** loading delay for browser voices, unsupported devices, changed voice lists, saved preference fallback, UK/US selection, speed, preview, and real iPhone spot checks.

**Responsive/browser:** desktop Chromium, mobile-sized WebKit, iPhone Safari manual spot-check, visible version, consistent header controls, keyboard, no unusable overlays or overflow.

**Deployment:** PR checks pass; deploy to the **existing** GitHub Pages and Cloudflare Worker only after merge/approval. Verify public URL and version. Never claim an unverified deployment succeeded.

## 9. Safe development and release workflow

1. Inspect `main` and latest PRs, existing content, storage schemas, and these docs; compare against the exact user feedback.
2. Define scope and acceptance criteria. Separate verified defects from optional product ideas.
3. Branch from `main`; make small, reversible changes while keeping mission data independent of the engine.
4. Add tests for the defect and run existing regression checks; include simulated and real-browser tests when relevant.
5. Update version/documentation only when a release merits it.
6. Open a PR with changed files, screenshots where useful, test outcomes and risks. **Do not merge without explicit review/approval.**
7. After merge, check GitHub Actions and the connected Cloudflare deployment separately; smoke-test both public URLs.
8. Keep the documentation consistent: **Blueprint = why/what; Development Guides = how**.

## Appendix A — reusable AI / developer handoff prompt

Copy and customize this prompt when starting a new ChatGPT/Codex task:

> You are helping maintain **Word Quest**, an English-first, bilingual Grade 7 vocabulary and word-formation game aligned with the Shanghai five-four-system 2024 English textbook. First inspect https://github.com/realnt/wordquest and the latest merged code, current PRs, `docs/Master_Blueprint.md`, and the appropriate development guide. **Do not rebuild from scratch.**
>
> Preserve all six units, current textbook coverage, English-first reasoning, natural Chinese support, correct morphology vs etymology, short immediate answer explanations, accessibility and compact mobile design. Preserve the exact localStorage keys and legacy Unit 1 save schema.
>
> Implement only the requested change on a feature branch; add meaningful automated tests, including browser tests when appropriate. Check Chrome desktop and mobile-sized WebKit, but never claim real-iPhone voice testing without running it on an iPhone. Do not introduce accounts, export/import progress, or synchronization unless authorized. Open a PR; **do not merge until approved**. Verify CI and deployment claims against evidence.
>
> Report: exact files changed, behavior, tests, compatibility and any unresolved limitations. Treat source code as implementation truth and this Blueprint as the product-decision authority; flag conflicts.

## Appendix B — reusable change-request template

Copy this into a new issue or conversation:

```text
Current released version / URL:
Target version:
Issue or improvement:
Affected unit(s) and mission(s):
Devices/browsers:
Current observed behavior:
Desired student experience:
Screenshot or reproduction steps:

Required preservation:
- English-first + optional natural Chinese
- Existing missions, XP, saved progress and voice preferences
- Accurate language histories and immediate post-answer explanation
- Existing production origin, unless explicitly changing hosting

Acceptance criteria:
- [ ] The described behavior is reproducibly fixed
- [ ] Correct and incorrect paths, hints and translations work
- [ ] Replay / XP / localStorage remain compatible
- [ ] Mobile and desktop rendering work
- [ ] GitHub CI passes, PR reviewed before merge

Out of scope:
Priority: Must-have / Should-have / Later
```

---

**Guiding principle:** Make students reason in English, discover one accurate, memorable word connection, and continue learning without unnecessary clicks or unsupported linguistic claims.
