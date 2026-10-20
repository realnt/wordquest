# Word Quest — Grade 7 Semester 1

**Version:** 1.5.0 · **6 units** · **109 missions** · **265 textbook vocabulary/expression entries**

Interactive English vocabulary and etymology game aligned with Shanghai 五四制 2024 Grade 7.

## Architecture in v1.5.0
- `site-shell.js` is the single source for the **header, navigation and footer** on the homepage and every unit. It generates both `data-view` and `data-val` to preserve the existing Unit 1 and Unit 2–6 event handlers.
- `site.css` centralizes design tokens, brand/navigation buttons, shared mobile layout, footer, and version-badge styles. Page-specific puzzle styles remain in `unit1.css` and `quest.css`, with `speech.css` for speech-specific controls.
- Unit 1 has been split from a monolithic HTML file into `unit1.html` (entry point), `unit1.js` (original gameplay/content) and `unit1.css` (game-specific styles). Units 2–6 continue using `content.js` and `quest.js`.
- The existing progress keys `wordquest_g7u1_v1` and `wordquest_g7u{N}_semester_v1` are **not migrated or cleared**. Speech preferences retain their existing keys.
- Shared version comes from `site-version.js`. Subsequent releases need a single version update instead of changing individual unit pages.
- Tests: `tests/check_site.py`, `tests/test_layout.js`, `tests/test_speech.js`.

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
node --check unit1.js
node --check site-shell.js
node tests/test_layout.js
node --check content.js
node --check speech.js
node --check site-version.js
node tests/test_speech.js
```

Progress is stored separately by browser and website origin using localStorage. No export/import or cloud synchronization is planned for v1.5.

The game is unofficial and is not affiliated with the textbook publisher or Etymonline.

## Voice differences between devices
Chrome may expose Microsoft Hazel and Susan as different `SpeechSynthesisVoice` objects while the resulting audio is indistinguishable. The Web Speech API does not provide raw voice samples or guarantee each voice's audio will be unique. Where differences matter, try Google UK English Female/Male or another engine/voice. Voice names and quality are platform-dependent.
