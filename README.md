# Word Quest — Grade 7 Semester 1

**Version:** 1.5.2 · **6 units** · **109 missions** · **265 textbook vocabulary/expression entries**

Interactive English vocabulary and etymology game aligned with Shanghai 五四制 2024 Grade 7.

## Project documentation / 项目文档

These three version-controlled Markdown documents are the **canonical project references**. They were consolidated from the earlier v1.4 Blueprint, Master Prompt, change-request template, and the bilingual Word development guides.

| Document | Purpose |
|---|---|
| [Master Blueprint](docs/Master_Blueprint.md) | **What and why:** curriculum, pedagogy, accepted product decisions, compatibility, release policy, plus reusable AI handoff and change-request templates |
| [Development Guide — English](docs/Development_Guide_EN.md) | **How:** project history, source layout, gameplay engine, speech, testing, local setup, CI and deployment |
| [开发与维护指南 — 中文](docs/Development_Guide_ZH.md) | 与英文技术指南对应的中文版，适合交接、分享与后续维护 |

**Version note:** These guides describe merged `main` **v1.5.1** and separately identify [PR #9 / proposed v1.5.2](https://github.com/realnt/wordquest/pull/9) as **not yet merged** at the documentation baseline. Update both language guides and the Blueprint when a new release merges. The existing DOCX editions are shareable reading copies; GitHub Markdown is the maintainable source of truth.

## Unified game architecture in v1.5.1
- All **six units now run the same `quest.js` engine** and share the same `quest.css` gameplay styles, `site-shell.js` header/footer, and `site.css` design system.
- Unit 1's original **23 missions**, five chapters, textbook glossary, word histories, word-formation, and grammar notes are retained as data in `unit1-data.js`. Units 2–6 continue loading `content.js`.
- The unified engine adapts Unit 1 content to the same story/question, building/choice, hints, word vault, history, and results UI as Units 2–6. Unit 1 keeps its five-chapter map and special learning notes.
- **Saved progress is backward compatible.** Unit 1 still reads and writes `wordquest_g7u1_v1` (with `earned`, `score`, `maxUnlocked`, etc.). Units 2–6 keep `wordquest_g7uN_semester_v1`. Voice, accent and speech speed keys stay unchanged. Do not delete local browser data.
- Unit 1's old independent `unit1.js` gameplay engine and `unit1.css` are retired. This makes future gameplay or styling updates single-file changes rather than dual-engine patches.
- `site-version.js` is the central source for v1.5.1. Regression coverage now includes gameplay integration in `tests/test_engine.js`, shared layout, site integrity and speech controls.

## Reliability update in v1.5.2
- **Replay works:** Completed missions can be answered again in an explicitly labeled **Practice mode**. Attempts, hints and reveals during practice are temporary and do **not** add XP, change the completion record, or accumulate mistakes.
- **Existing progress is safe:** Original Unit 1 (`wordquest_g7u1_v1`) and Units 2–6 (`wordquest_g7uN_semester_v1`) storage keys and score formats are unchanged. On refresh, completed missions return to normal review mode.
- **Browser regression coverage:** Playwright runs real desktop Chromium and mobile-sized WebKit interaction tests for all six units, replay, saved progress, navigation, voice settings and the version label. WebKit on Linux is **not** a substitute for testing actual iPhone Safari voices.
- **Content checks:** All 109 missions are checked for required English/Chinese text, answer validity and reachable word-building solutions.

## Features
- English-first game, optional Chinese translations and progressive hints.
- Native speech synthesis for **Word Vault words and English mission passages**; small audio controls, no external API.
- **Accent selector:** Choose 🇬🇧 UK or 🇺🇸 US in the header of any unit. The choice is remembered across all units on the same website origin (`wordquest_speech_accent_v1`), independently from mission progress. Default: UK. Availability depends on browser/system voices; when the selected accent is unavailable the browser may substitute its native voice.
- **Speaking speed:** Adjustable from **0.80× to 1.20×** (default **1.00×** for words and sentences); choice persists per browser/device as `wordquest_speech_speed_v1`, separately from accent and game progress. On iPhone this allows more natural pacing than the slower fixed rates used previously. The browser and OS may interpret speaking rates differently.
- **Specific voice picker:** The Voice menu lists only the `en-GB` or `en-US` voices reported by `speechSynthesis.getVoices()` on the current device (for example Microsoft Hazel / Susan or Google UK English Female / Male). The first available voice for the selected accent is chosen by default; there is no redundant `Automatic` entry. Students can use the ▶ preview before choosing; UK and US voice preferences are saved independently in `wordquest_speech_voice_v1`. If a saved voice disappears, playback falls back to the first available voice for the current accent and shows a note. Selecting different voice objects does not guarantee an audible difference if the operating system maps them to similar or shared synthesizers. iPhone and PC may expose completely different voice lists; updates to voices are detected when available.
- **Compact settings:** A single teal **🔊 UK/US · Voice** button replaces the always-visible controls. Tap to expand accent, voice, preview and speed; **✓ Done** collapses them. Preferences save as they change (also when closing without Done). The controls reappear only when requested, including after page refresh or changing missions.
- **iOS voice preference:** When there is no saved manual choice and both are available, prefer Daniel for UK and Samantha for US based on device testing. Other voices remain selectable; some installed voices may be unreliable or sound unnatural in iOS Safari.
- **Visible version:** The homepage and all six units show the single version number **v1.4.7** beside the Word Quest name. Future releases update `site-version.js` once.
- Mobile-first layout; the existing XP and saved-progress keys are preserved.
- Short, visible word-history explanations; no additional Explore More click.

## Website
- Live Cloudflare (separate deployment): https://wordquest.orbitlab.workers.dev/
- Optional GitHub Pages: https://realnt.github.io/wordquest/ (once enabled under repository Settings → Pages → GitHub Actions).

## Publishing
Changes should be proposed through pull requests. A PR runs the static validation workflow. After you review and merge to `main`, GitHub Actions can publish to GitHub Pages if Pages is enabled. **The production Cloudflare Worker is connected to GitHub and is expected to redeploy after a successful merge to `main`.**

Check locally with:
```bash
python3 tests/check_site.py
node --check quest.js
node --check unit1-data.js
node --check site-shell.js
node tests/test_layout.js
node tests/check_content.js
node tests/test_engine.js
node --check content.js
node --check speech.js
node --check site-version.js
node tests/test_speech.js
npm install --no-audit --no-fund --package-lock=false
npx playwright install chromium webkit
npm run test:browser
```

Progress is stored separately by browser and website origin using localStorage. No export/import or cloud synchronization is planned for v1.5.

The game is unofficial and is not affiliated with the textbook publisher or Etymonline.

## Voice differences between devices
Chrome may expose Microsoft Hazel and Susan as different `SpeechSynthesisVoice` objects while the resulting audio is indistinguishable. The Web Speech API does not provide raw voice samples or guarantee each voice's audio will be unique. Where differences matter, try Google UK English Female/Male or another engine/voice. Voice names and quality are platform-dependent.
