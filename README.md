# Word Quest — Grade 7 Semester 1

**Version:** 1.4.4 · **6 units** · **109 missions** · **265 textbook vocabulary/expression entries**

Interactive English vocabulary and etymology game aligned with Shanghai 五四制 2024 Grade 7.

## Features
- English-first game, optional Chinese translations and progressive hints.
- Native speech synthesis for **Word Vault words and English mission passages**; small audio controls, no external API.
- **Accent selector:** Choose 🇬🇧 UK or 🇺🇸 US in the header of any unit. The choice is remembered across all units on the same website origin (`wordquest_speech_accent_v1`), independently from mission progress. Default: UK. Availability depends on browser/system voices; when the selected accent is unavailable the browser may substitute its native voice.
- **Speaking speed:** Adjustable from **0.80× to 1.20×** (default **1.00×** for words and sentences); choice persists per browser/device as `wordquest_speech_speed_v1`, separately from accent and game progress. On iPhone this allows more natural pacing than the slower fixed rates used previously. The browser and OS may interpret speaking rates differently.
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
node --check content.js
node --check speech.js
node tests/test_speech.js
```

Progress is stored separately by browser and website origin using localStorage. No export/import or cloud synchronization is planned for v1.5.

The game is unofficial and is not affiliated with the textbook publisher or Etymonline.
