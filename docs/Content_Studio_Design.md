# Word Quest Content Studio — Sites Prototype Design (v0)

**Status:** Proposed design; **not deployed**, no production code changes  
**Owner approval:** Direction approved for design on 9 November 2026  
**Tracking:** [Issue #24](https://github.com/realnt/wordquest/issues/24)  
**Source baseline:** `main` at **v1.5.4** (confirmed 9 Nov 2026; use commit/file SHAs in every import)  
**Separate ongoing work:** [Issue #17 / PR #23](https://github.com/realnt/wordquest/pull/23), v1.6 learner retention; do not edit or block that branch  
**Student website:** https://wordquest.orbitlab.workers.dev/  
**Source repository:** https://github.com/realnt/wordquest  
**Related product authority:** [Master Blueprint](Master_Blueprint.md) and [AI Collaboration](AI_COLLABORATION.md)

> **Decision:** Keep the student-facing game on the existing Cloudflare Worker. Build **Word Quest Content Studio** as a **private, adult-editor-only ChatGPT Site** for inspecting, reviewing and preparing changes to teaching content. The Site is an editorial workbench, not a source of truth, GitHub editor, production deployment tool or student progress store.

## 1. Why this tool exists

Word Quest already has a functioning six-unit game, a single gameplay engine, and release checks. What is difficult today is editing and reviewing the **109 missions and 265 vocabulary/expression entries** spread across two legacy data formats:

- `unit1-data.js`: Unit 1's 23 missions, five chapters, glossary, Chinese translations and detailed word history metadata.
- `content.js`: Units 2–6's 86 missions and glossaries.

Educational revisions must distinguish *correct answer*, *plausibility of distractors*, *clue quality*, *bilingual equivalence*, *word formation* and *historically documented etymology*. Reading large JavaScript data files is inefficient and makes parallel review harder.

**Success metric:** an adult reviewer can find any mission, understand its complete teaching rationale, identify questionable content, preview its student presentation, record a review decision, and export a **traceable draft change** without touching the production website.

**Non-goals:** build another game engine; move children to ChatGPT Sites; implement the v1.6 FSRS review algorithm; store students' learning activity; add automatic source commits or publishing.

## 2. Boundaries and data authority

```text
GitHub main (canonical source: unit1-data.js + content.js)
         │
         │ approved source snapshot + file blob SHAs
         ▼
   Content Studio (private adult-only Sites preview)
      Search  ── Inspect  ── Draft  ── Validate  ── Review
         │
         │ export proposal with original IDs, SHAs and diffs
         ▼
    GitHub Issue / feature branch / pull request
         │
         ├── independent human / AI content review
         ├── tests/check_content.js and relevant regression tests
         └── owner approval → merge → existing deployment
         ▼
Existing Cloudflare student site (unchanged until approved release)
```

1. **GitHub `main` is authoritative.** Content Studio data is a snapshot plus review drafts, not a competing production database.
2. **No direct GitHub write** from the Site in v0. An exported change proposal must be applied by an explicitly authorized developer in a separate feature branch.
3. **No production or user-progress writes.** Do not read or modify `wordquest_g7u1_v1`, `wordquest_g7uN_semester_v1`, `wordquest_review_v1`, or any speech-preference keys.
4. **Private adult-only access.** Do not publish it publicly or invite children to the Site. No student names, assessment history, account IDs or other child personal information.
5. **No secrets in the public repository, Site import, or exported patch.** GitHub API tokens, Cloudflare secrets and external credentials are never part of the dataset.
6. **Every review action is local to the editorial workspace.** A label like “Approved” means *editorial approval for a proposed revision*, not “merged” or “deployed”.

## 3. V0 information architecture

| View | Main tasks | First release |
|---|---|---|
| **Dashboard** | Scope: 6 units, 109 missions, 265 entries; review queue, unresolved warnings, latest imported source SHA | Required |
| **Mission Library** | Search target word/title; filter unit, mission type, language category, status, risk flag | Required |
| **Mission Inspector** | Compare English/Chinese scenario, question, options/parts, answer, 2 hints, explanation, formation/history and citations | Required |
| **Student Preview** | Simulate English-first display, optional Chinese, hints and post-answer explanation; clearly labeled mock preview | Required |
| **Review & Validation** | Flags for answer leakage, misleading distractors, morphology/etymology mislabeling, unverified source, translation mismatch; reviewer notes and state | Required |
| **Export** | Export source-referenced edit proposal and review report (JSON + readable Markdown summary) | Required |
| **Word Vault Library** | Search and inspect all 265 terms across six units, flag duplicates/meaning gaps | Basic searchable view |
| **Version comparison** | Show changes between two GitHub commits | Later |
| **Direct GitHub PR creation** | Authorized GitHub integration and permissioned write workflow | Out of scope |
| **Student accounts / analytics** | Cross-device synchronization, XP, FSRS and child progress | Out of scope |

### Proposed responsive screen

Desktop: narrow left navigation; central searchable mission table/list; right-side detail inspector with tabs (**EN & ZH / Answer / Word History / Preview / QA**). Keep selected mission visible while filters change. Mobile adult editor: one view at a time with a clear back action, no fixed columns overflowing the screen.

Mission list item should show **U3-M11 · target word · mission title · type · review state**, without exposing solutions to any student audience (this tool is only for adult editors). Show source revision and whether a draft differs from the imported original.

### Example review workflow

1. Search for `windsurfing`; open `U1-M01`.
2. Read the full English question, Chinese equivalents, hints, expected build order and word formation note.
3. Open **Student Preview**: English-only, Chinese support ON, first hint, second hint, solved explanation.
4. Flag a questionable phrase or revise its draft. Check whether it leaks the answer before solving.
5. Validate the revised content; record a note and mark **In review**.
6. Independent reviewer marks **Approved** or returns to **Draft**, providing rationale and linguistic evidence.
7. Export an immutable proposal with before/after values and source SHA. A developer opens a GitHub PR and runs existing tests. **Nothing changes in the live game at export time.**

## 4. Normalized editorial data model (not a game runtime migration)

Use an **adapter at snapshot export time**. Never rewrite the current game data solely to fit the editor.

### Mission record (minimum)

```json
{
  "id": "U1-M01",
  "unit": 1,
  "missionIndex": 0,
  "chapter": "A",
  "source": {
    "path": "unit1-data.js",
    "blobSha": "<actual-git-blob-sha>",
    "exportedAt": "<ISO-8601-timestamp>"
  },
  "targetWord": "windsurfing",
  "mode": "build",
  "title": {"en": "Catch the Wind", "zh": "乘风破浪"},
  "scene": {"en": "...", "zh": "..."},
  "question": {"en": "...", "zh": "..."},
  "hints": [{"en": "...", "zh": "..."}, {"en": "...", "zh": "..."}],
  "answer": {
    "type": "parts",
    "availableParts": ["surfing", "garden", "wind", "rain"],
    "correctParts": ["wind", "surfing"]
  },
  "explanation": {"en": "...", "zh": "..."},
  "languageNotes": [
    {"kind": "formation", "en": "...", "zh": "...", "sourceUrl": null}
  ],
  "editorial": {
    "status": "draft",
    "flags": [],
    "reviewerNote": "",
    "evidenceUrls": []
  }
}
```

The example illustrates **shape**, not a complete export. All real student-facing strings must be imported from the verified repository, not invented. `<actual-git-blob-sha>` is a placeholder; the importer must populate it.

- **Stable IDs:** `U1-M01` … `U6-M18` (1-based display), but retain `missionIndex` (0-based) for the game's storage contract. **Never reorder or delete missions silently**; existing progress indexes depend on order.
- **Unit 1 mapping:** `missions[]` + `missionTranslations[]` + `originMeta[]` + `originExtras[]` joined by mission index. Build missions use `type: 'build'`, `tokens` and ordered `answer` fragments. Keep chapter IDs A–E. Glossary is nested in categories; flatten only for display, preserve original location metadata.
- **Units 2–6 mapping:** `WORDQUEST_CONTENT.missions[unit]`, `meta[unit]` and `glossaries[String(unit)]`; choice missions use original `options[]` and zero-based `answer` index; build missions use `parts[]` and the exact accepted build semantics of the current game.
- **Preserve original representations:** the edit exporter should include the original raw values, source path and index to allow a trustworthy reverse mapping. The normalized record is a **view**; losslessly reversible edits are required before applying them to the code.
- **Word Vault entries:** separate records with `id`, `unit`, original group/index, `word`, `translation`, any known provenance, and editorial metadata. Never assume the same word appearing in two units is automatically an error.

### Review status and flags

Statuses: **Draft → In review → Approved → Exported**. **Needs changes** returns to Draft, retaining notes. Importing a newer GitHub revision should mark affected drafts as **Source changed / reconciliation required**, not auto-apply old edits.

Flags are independent of status: **Unclear clue**, **Answer leaked**, **Weak distractor**, **Answer invalid**, **Translation mismatch**, **Morphology/grammar issue**, **Etymology not verified**, **Source missing**, **Accessibility issue**.

Distinguish three validations:

- **Machine validation:** missing required strings, wrong number of hints, duplicate answer tokens where unexpected, out-of-range answer index, unreachable build solution, invalid URL format, unsafe HTML, changed source SHA.
- **Reviewer validation:** real deductive clue, natural Chinese, plausible distractors, grammatical correctness, correct linguistic category and trustworthy citation.
- **Release verification:** current project test suite and actual browser behavior, run in GitHub CI after the proposed change is implemented.

## 5. Import, draft and export protocol

### Import

- Phase 0 starts from a **reviewed, explicit snapshot file** generated by a trusted export helper from the checked-out versioned repository. Do not ask Sites to execute `unit1-data.js` or arbitrary uploaded JavaScript.
- The snapshot contains only curriculum content and documented metadata. Do **not** include learning progress, localStorage exports, secrets or private files.
- Record both source file Git blob SHA values, the source commit SHA and timestamp. Import must show the counts by unit and reject malformed structures rather than silently dropping missions.
- Expected baseline: six units, 109 missions, 265 vocabulary/expression entries. If counts change in a later approved release, require a deliberate change-recorded update to the expected manifest.

### Draft save

- Edits are separate from the imported immutable snapshot. Autosave, if implemented, must make the draft/unsaved state clear.
- Site storage may retain adult editorial drafts where eligible, but this does not replace GitHub. Avoid putting anything private in the public source repo.
- A Site version can be saved privately for review; **do not deploy/publish** it as a student website.

### Export (proposed patch bundle)

```json
{
  "schemaVersion": 1,
  "sourceCommitSha": "<exact-commit>",
  "sources": {"unit1-data.js": "<blob-sha>", "content.js": "<blob-sha>"},
  "status": "proposal-only",
  "changes": [
    {
      "missionId": "U1-M01",
      "sourcePath": "unit1-data.js",
      "missionIndex": 0,
      "fieldPath": "missionTranslations[0].explainZh",
      "before": "<exact-original-value>",
      "after": "<revised-value>",
      "reason": "Clarify a word-formation explanation",
      "reviewStatus": "approved",
      "evidenceUrls": []
    }
  ]
}
```

Export a readable companion **Markdown review report** listing changed fields, original/new values, reviewer rationale, validation outcomes and the GitHub commit. **No changes are automatically pushed to GitHub by this Site.**

Before applying any exported change in a branch: compare SHA and original field content, reject mismatches, rebase/review the proposal, run content and engine tests. Do not modify mission indices, save-state schemas, XP rules or FSRS code through the editorial export.

## 6. V0 acceptance criteria

- [ ] Only adult maintainers can access the private Site; no public learner-facing deployment.
- [ ] Search for a known word finds the correct mission; combined unit/type/status filters work; empty query results have a clear message.
- [ ] All **109 missions** and **265 vocabulary/expression entries** import with accurate source IDs and unchanged data.
- [ ] Unit 1's build-answer order, chapter info and expanded history are visible and intact; U2–U6 multiple-choice index semantics remain correct.
- [ ] Every selected mission shows both languages, two hints, answer/parts, explanation, and a clearly marked teaching classification.
- [ ] English-only vs Chinese-support preview is readable on desktop and mobile; preview cannot modify student XP or history.
- [ ] Broken/missing fields create validation flags; a false etymology claim is flagged for **human review** (not falsely declared machine-verified).
- [ ] Draft edits retain the original field and can be reverted.
- [ ] Review status and rationale are distinguishable from deployment state.
- [ ] Export contains before/after, source revision, mission ID, rationale and approval status; applying a stale proposal is refused.
- [ ] No direct live website or GitHub `main` writes; no child personal data or localStorage access.
- [ ] Independent Claude review and owner approval before expanding from prototype to real content publishing.

## 7. Implementation phases and ownership

| Phase | Deliverable | Risk | Gate |
|---|---|---|---|
| **0 — Design** | This document, GitHub issue, explicit non-goals and acceptance tests | Low/medium | Owner reviews design |
| **1 — Private Sites prototype** | Dashboard, import preview, searchable library, detail inspector, EN/ZH preview; use an approved **content snapshot** | Medium | Adult editor validates 6 units and counts |
| **2 — Safe editorial changes** | Draft editing, review status, machine validation, JSON+Markdown proposal export | High (content integrity) | Independent content QA; stale-SHA rejection |
| **3 — GitHub adapter** | Separately developed validated importer/exporter tooling and PR-only workflow | High | CI green, code review, owner approval |
| **4 — Student experience integration** | Review whether content findings improve Cloudflare Word Vault, missions and v1.6 review UI | High | Separate issues/PRs; student progress tests |

Do **not** treat Phase 1 as an actual fully integrated editing pipeline. GitHub-to-Sites updates and Sites-to-GitHub writes should be assessed separately with documented permissions and reliability. A read-only snapshot is the safest initial connection.

## 8. Copyable @Sites build request (adult-only private prototype)

Use this in **ChatGPT Work → @Sites** (or the Sites creation flow) with the approved snapshot attached. Sites building is not available as a direct GitHub action from this chat.

> Build a **private, adult-maintainer-only website** named **Word Quest Content Studio**, based solely on the attached *Word Quest editorial snapshot* and this design specification. Do **not** rebuild or host the student Word Quest game. No students will access this Site.
>
> Design a clean, responsive content-review dashboard. Show counts by unit and review status; create a searchable/filterable mission and vocabulary library; create an inspector with English/Chinese scenario, question, answer options or word-building tokens, two hints, correct answer, post-answer explanation, formation/grammar/etymology notes and source references. Add an English-first and Chinese-support **student-preview simulation** that does not store or update actual student progress.
>
> Allow adult editors to mark independent quality flags, write reviewer notes, save **draft-only** changes separately from the immutable imported snapshot, move the editorial status through Draft / In review / Approved / Exported, and view a before/after diff. Validate required fields, expected answer index / build order, missing translations, empty clues and source revision. Present uncertain etymology as **Needs human verification**, not as automatically verified.
>
> Provide a **Download proposed edits** control exporting **JSON + Markdown summary** with exact mission IDs, source file names and SHA, original values, updated values and reviewer rationale. Do **not** call GitHub APIs, commit files, merge pull requests or publish the Cloudflare site. Do not import student localStorage, personal data, passwords, API tokens or private learner records.
>
> Keep the Site private, show its snapshot commit SHA prominently, and show an unmistakable banner: **Editorial preview — not the student production site**. If a requested integration is unsupported, surface the limitation clearly rather than pretending changes are synchronized. Include clear empty/loading/error states and accessible keyboard navigation.
>
> Start with **Phase 1 only**: read-only dashboard + mission library + detail inspector + simulated student preview. Do not enable editing/export until the imported content and counts have been verified.

## 9. Relationship to Word Quest v1.6

The student-side **FSRS memory and five-minute practice** work tracked in [Issue #17](https://github.com/realnt/wordquest/issues/17) and [draft PR #23](https://github.com/realnt/wordquest/pull/23) remains separate. Content Studio does **not** calculate or store student recall predictions, daily review schedules, XP bonuses, or due queues. At a later stage the adult editor may flag missions that are consistently problematic *if privacy-safe, consented, aggregated evidence exists*. Such analytics are **not** included in v0.

---

**Approval boundary:** Design approval permits preparing a private Sites prototype from reviewed content; it does not authorize production data changes, automatic GitHub writes, merge, public publication, or student-facing migration.
