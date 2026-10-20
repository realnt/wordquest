# Word Quest — Grade 7 Semester 1

**Version:** 1.4.2 · **6 units** · **109 missions** · **265 textbook vocabulary/expression entries**

Interactive English vocabulary and etymology game aligned with Shanghai 五四制 2024 Grade 7.

## Features
- English-first game, optional Chinese translations and progressive hints.
- Native speech synthesis for **Word Vault words and English mission passages**; small audio controls, no external API.
- Mobile-first layout; the existing XP and saved-progress keys are preserved.
- Short, visible word-history explanations; no additional Explore More click.

## Website
- Live Cloudflare (separate deployment): https://wordquest.orbitlab.workers.dev/
- Optional GitHub Pages: https://realnt.github.io/wordquest/ (once enabled under repository Settings → Pages → GitHub Actions).

## Publishing
Changes should be proposed through pull requests. A PR runs the static validation workflow. After you review and merge to `main`, GitHub Actions can publish to GitHub Pages if Pages is enabled. **Cloudflare does not update automatically from this repository yet.**

Check locally with:
```bash
python3 tests/check_site.py
node --check quest.js
node --check content.js
node --check speech.js
```

Progress is stored separately by browser and website origin using localStorage. No export/import or cloud synchronization is planned for v1.5.

The game is unofficial and is not affiliated with the textbook publisher or Etymonline.
