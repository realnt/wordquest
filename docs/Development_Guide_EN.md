# Word Quest — Development Guide (English)

**From learning idea to a deployable and maintainable game**  
**Repository:** https://github.com/realnt/wordquest  
**Baseline:** `main` at **v1.5.4** ([PR #21](https://github.com/realnt/wordquest/pull/21)), after v1.5.3 ([PR #20](https://github.com/realnt/wordquest/pull/20)) and v1.5.2 (merged 21 October 2026 via [PR #9](https://github.com/realnt/wordquest/pull/9))  
**Production site:** https://wordquest.orbitlab.workers.dev/  
**GitHub Pages:** https://realnt.github.io/wordquest/  
**Companion:** [Master Blueprint](Master_Blueprint.md) · [中文版开发指南](Development_Guide_ZH.md) · [AI collaboration workflow](AI_COLLABORATION.md)

This document explains **HOW we built Word Quest and how to reproduce, test and maintain it**. The Master Blueprint owns the educational goals, accepted product decisions, and linguistic quality rules.

## 1. The problem we set out to solve

The starting request was to make a fun **word-formation and word-history game** that followed the **2024 Shanghai five-four-system Grade 7 Semester 1 English textbook**. Plain vocabulary flashcards would not be enough: students needed to deduce answers from an English scenario, word parts and progressively stronger clues.

We established requirements iteratively: textbook first; English for the main challenge with Chinese on demand; accurate distinctions between derivation, grammar and etymology; short explanations visible immediately after answering; PC/iPhone support; and no required user account.

The resulting project is a static, browser-based learning game with **6 units, 109 missions and 265 textbook vocabulary/expression entries** in its present dataset. These are software content counts, not an independent recertification of the textbook.

| Unit | Title | Missions | Entries | Learning focus |
|---|---|---:|---:|---|
| 1 | Trying New Things | 23 | 43 | Compounds and invention stories |
| 2 | Strong Mind | 17 | 48 | Opposites, word families |
| 3 | Jobs | 17 | 56 | Job suffixes |
| 4 | Smart Home | 17 | 40 | Connected meanings and technology |
| 5 | Films | 17 | 42 | Prefixes |
| 6 | Mountains and Rivers | 18 | 36 | Dictionary use and compounds |

## 2. How the project evolved

We created one playable **Unit 1 prototype**, revised the bilingual teaching experience, and expanded it to the whole semester. Actual student-facing feedback shaped each iteration:

| Stage | Implementation and learning |
|---|---|
| v1.1–v1.2 | Unit 1 missions; 43-word vault; English/Chinese text and progressive clues |
| v1.2.1–v1.3.2 | Etymology caution; clearer grammatical explanations; replace overly long history panels with one immediate discovery |
| Semester expansion / v1.4 | Units 2–6, full 109 missions, compact mobile experience |
| v1.4.2–v1.4.6 | Pronunciation, UK/US, speed slider, voice selection, preview and consistent styling |
| v1.4.7 | Collapse rarely used voice options into a single settings button; visible version |
| v1.5.0 | Shared site header/footer via `site-shell.js` and design variables in `site.css` |
| **v1.5.1** | Unified gameplay for all units in `quest.js` / `quest.css`; Unit 1 data adapted without resetting stored progress |
| **v1.5.2** | [PR #9](https://github.com/realnt/wordquest/pull/9) (merged 21 October 2026): functioning practice/replay mode, mission content validation, Playwright browser tests |
| **v1.5.3** | [PR #20](https://github.com/realnt/wordquest/pull/20): stable shuffled options, no map spoilers, fair retries, reveal = 0 XP in all units, `lang` metadata |
| **v1.5.4** | [PR #21](https://github.com/realnt/wordquest/pull/21): stronger wrong options in 22 missions, 7 titles renamed, answer-integrity content checks |

Instead of replacing the site with a new app framework, we refactored the existing working project in small feature branches. Unit 1 was originally self-contained; in v1.5.1 its game logic was merged into the shared engine, keeping the **original mission data and storage contract**.

## 3. Repository structure

```text
wordquest/
├── index.html                  Semester landing page
├── unit1.html ... unit6.html    Small unit entry pages
├── unit1-data.js               Unit 1 missions, translations, word histories
├── content.js                  Unit 2–6 missions, metadata, glossaries
├── quest.js                    ONE game engine across all six units
├── quest.css                   Common puzzle/gameplay CSS
├── site-shell.js               Header, navigation, footer renderer
├── site.css                    Shared design tokens and responsive shell
├── site-version.js             Single visible release version
├── speech.js                   Browser TTS and saved voice choices
├── speech.css                  Speech controls and audio button styles
├── tests/
│   ├── check_site.py           Asset and HTML integrity
│   ├── test_engine.js          Mission, save, scoring regression
│   ├── test_layout.js          Common shell / version regressions
│   └── test_speech.js          Pronunciation / voice preferences
├── .github/workflows/pages.yml Validation and GitHub Pages deployment
├── wrangler.jsonc              Cloudflare Worker static assets config
└── docs/                       Product blueprint and build guides
```

**Files added in v1.5.2:** `package.json`, `playwright.config.js`, `tests/browser/wordquest.spec.js` and `tests/check_content.js` are now on `main`.

There is **no database server, authentication service, React dependency, bundler, or build step for the running game**. The site consists of static HTML, CSS and JavaScript.

### Runtime flow

1. The browser loads `unitN.html` and the appropriate unit's content data.
2. `quest.js` reads `document.body.dataset.unit` and constructs that unit's mission list.
3. For Unit 1, the adapter converts old fields (`type`, `tokens`, answer fragments, translated history) to the unified gameplay shape. Units 2–6 already use `mode`, `parts`, `options` and answer indices.
4. The engine loads the correct `localStorage` progress record and draws Play, Map, Word Vault or Results.
5. Click handlers update temporary or persistent state and render the next view.
6. `speech.js` supplies word/sentence audio and saved accent/voice/speed controls.
7. `site-version.js` inserts the release number beside the shared brand.

### Why data is separate from the engine

Educational content is updated frequently; page mechanics should not need to be copied six times. Keeping Unit 1's historical content in `unit1-data.js` and Units 2–6 in `content.js` lets reviewers inspect the actual questions without editing game behavior. The data adapter retains backward compatibility while enabling shared UI improvements.

## 4. Designing a playable mission

**Content preparation process:**

1. Check the correct unit and the official 2024 textbook's Word Study and vocabulary pages.
2. Select the target word, skill and intended transferable inference.
3. Write an original, short English scene with sufficient contextual evidence.
4. Write an unambiguous question and answer choices or ordered word fragments.
5. Write two hints: strategy first, stronger narrowing clue second.
6. Write a concise post-answer explanation; add formation/grammar/history only if linguistically justified.
7. Add accurate Chinese translations **without revealing the answer in advance**.
8. Test correct, incorrect, hint, replay/review and mobile paths.

### Basic choice mission (schematic)

```js
{
  word: "example",
  mode: "choice",
  title: "A short mission title",
  scene: "A brief English situation.",
  question: "Which word fits best?",
  options: ["example", "distractor"],
  answer: 0,
  hints: ["First strategy clue", "More specific clue"],
  explain: "Why this answer is correct.",
  // Chinese counterparts and a correctly labeled connection follow.
}
```

### Basic word-building mission (schematic)

```js
{
  word: "waterfall",
  mode: "build",
  parts: ["FALL", "RIVER", "WATER"],
  // Learner selects WATER, then FALL.
  // The unified engine validates the constructed target word.
}
```

Unit 1 contains **explicit ordered answer fragments** in its older data model; retain this distinction when modifying or validating builds. Do not confuse similarly spelled parts with historically related roots.

## 5. Learning state, XP and backward compatibility

Progress lives in the browser's **localStorage**, with no account and no remote database.

| Data | Exact key | Format |
|---|---|---|
| Unit 1 progress | `wordquest_g7u1_v1` | Legacy `earned`, `maxUnlocked`, `misses`, `score` |
| Units 2–6 | `wordquest_g7uN_semester_v1` | `completed`, `unlocked`, `mistakes`, `points` |
| Accent | `wordquest_speech_accent_v1` | `en-GB` or `en-US` |
| Voice preference | `wordquest_speech_voice_v1` | Per-accent voice name/URI |
| Playback speed | `wordquest_speech_speed_v1` | 0.80–1.20 |

**Do not rename or clear these keys casually.** The same hostname/origin generally retains data after a deployment, but different hosts such as Cloudflare Workers and GitHub Pages maintain **separate** progress. Clearing browser site data removes saved progress.

The engine reads the original Unit 1 save fields and writes back the same schema. XP and completion must never be awarded twice for the same mission.

**Replay status:** v1.5.2 includes *Practice mode*: students can answer completed questions again without modifying stored XP, completion state or mistake history. This is an implementation statement; verify the deployed site separately.

## 6. Bilingual UX and pronunciation

**Bilingual modes:** Chinese Support OFF keeps English primary and allows per-paragraph translation. Chinese Support ON displays Chinese directly below English for the scene, question, hints, and explanations. Answer options remain English and translations should not spoil puzzles.

**Pronunciation:** `speech.js` uses the built-in Web Speech API, notably `SpeechSynthesisUtterance` and `speechSynthesis.getVoices()`, with **no paid or Google-specific TTS dependency**.

- Choose UK `en-GB` or US `en-US` accent, default UK.
- Voice list is generated from the actual browser/device voice inventory.
- Per-accent voice selection and speed 0.80×–1.20× persist locally; default speed 1.00×.
- The compact header button expands accent, voice, preview and speed; **Done** closes the panel.
- Based on specific iPhone observations, **Daniel** (UK) and **Samantha** (US) were preferable if present. This is not a guarantee across all iPhones.
- Windows Hazel and Susan may be audibly identical despite being different voice objects. Some iOS voices are listed but sound abnormal. Voice quality is determined partly by browser and OS; Google voices can be unavailable in some regions or devices.

Test UI controls in Chromium and WebKit, but use a real iPhone to confirm audio timbre and reliability.

## 7. Run the project on your computer

### Requirements

- **Git** to clone and make branches.
- **Python 3** for the local HTTP development server.
- **Node.js** to run the existing tests.
- A modern browser (Chrome, Edge, Safari, etc.).
- **Wrangler** only if you are authorized to deploy the Cloudflare Worker.

Clone and serve:

```bash
git clone https://github.com/realnt/wordquest.git
cd wordquest
python3 -m http.server 8080
```

On Windows, `py -m http.server 8080` may work if `python3` does not.

Visit **http://localhost:8080/**. Do not rely solely on opening the HTML files with `file://` paths; an HTTP server better reproduces production loading.

### Tests on current `main` (v1.5.4)

Run the static, unit and content checks:

```bash
python3 tests/check_site.py
node --check quest.js
node --check unit1-data.js
node --check site-shell.js
node --check content.js
node --check speech.js
node --check site-version.js
npm run test:unit
```

For real-browser regression (desktop Chromium and mobile-sized WebKit):

```bash
npm install --no-audit --no-fund --package-lock=false
npx playwright install chromium webkit
npm run test:browser
```

The Playwright suite checks six units, navigation, mission replay, saved-state behavior, version labels, compact speech settings, desktop Chromium and an iPhone-sized **WebKit browser**. Linux WebKit does **not** prove actual Safari/voice behavior on a physical iPhone.

## 8. GitHub workflow and release control

1. Pull the latest `main` and check currently open PRs before editing.
2. Create a feature branch; keep each PR focused.
3. Modify the appropriate data, game engine, shared style, speech module or document.
4. Add regression tests for the changed behavior. Keep original textbook data and saved keys unless a migration is explicitly approved.
5. Run tests; open a PR against `main` with scope, acceptance criteria and known limitations.
6. Wait for automated CI and manual review. **Do not merge without explicit approval.**
7. After merging, confirm GitHub Pages CI and the external Cloudflare-connected build; verify the public sites separately.
8. Update the displayed version in `site-version.js` and the documentation baseline when shipping a new release.

### CI files and publishing

The repo's `.github/workflows/pages.yml` validates HTML/assets, JS syntax and browser regressions on PRs. The **browser** job is pinned to `ubuntu-24.04` because Playwright 1.56.1 cannot install on Ubuntu 26.04; reassess this pin when deliberately updating Playwright. On approved pushes to `main`, the `publish` job can publish GitHub Pages only if Pages is enabled and configured with **GitHub Actions** as its build source.

The production site is connected to a **Cloudflare Worker with static assets**. The checked-in `wrangler.jsonc` names the Worker `wordquest` and maps assets to the repository directory. The **GitHub-to-Cloudflare connection, credentials and dashboard build settings live outside Git**; cloning the repo does not automatically confer deployment rights.

Keep the same existing Cloudflare Worker/domain when continuity of saved progress matters. After merging, check the **Workers Builds: wordquest** result and the live Cloudflare version badge; separately check the GitHub Actions `publish` result and the live Pages URL. A green PR or merge is not proof of either deployment.

## 9. Maintaining content and avoiding regressions

**When changing missions:** confirm source vocabulary, hints, Chinese, correct answer, and word history. Distinguish historical etymology from productive word formation; verify quotations and dates.

**When changing the game:** test first solve, wrong tries, hint limits, word-part order, navigation, map, vault, completion, saved-state reload, and previously completed missions. A shared engine fix affects every unit.

**When changing speech:** test loading delayed voices, unavailable voices, name/URI persistence, accent changes, preview, speech speed and settings opening/closing. Voice support differs across devices.

**When changing CSS:** check mobile (~375–390 px), desktop, focus accessibility, tap targets, overflow and no obstruction of puzzle content.

**When changing docs:** update this guide and the Chinese counterpart together. Preserve the Master Blueprint as the authority on **educational design**, and explain any migration or backward-incompatible change explicitly.

## 10. What to improve next

The current project is suitable for iterative maintenance. Prioritize more rigorous evidence-based content review, increased mission variety, accessibility auditing and actual iPhone Safari verification. Avoid unnecessary framework migrations, user accounts, cloud sync and progress export unless the product requirements explicitly change.

---

**Project principle:** Help learners reason in English, discover an accurate word connection, and move forward with minimal friction.
