# Vendored FSRS scheduler

- Package: [`ts-fsrs`](https://www.npmjs.com/package/ts-fsrs) **5.4.2** (pinned stable release)
- File: `ts-fsrs-5.4.2.umd.js` — exact 72,009-byte `dist/index.umd.js` from the published npm package, extracted in GitHub Actions
- Source repository: [`open-spaced-repetition/ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs/tree/v5.4.2/packages/fsrs)
- License: MIT; full upstream copyright/license text in [`LICENSE-ts-fsrs-5.4.2.txt`](LICENSE-ts-fsrs-5.4.2.txt)
- Check: the PR browser CI installs the **exact** version from `package.json` and compares the checked-in UMD file byte-for-byte with `node_modules/ts-fsrs/dist/index.umd.js`.
- Runtime: Word Quest loads this local file, not a CDN or service; vendoring the scheduler does **not** enable complete offline website loading without separate caching.

Do not edit the vendored bundle by hand. If upgrading, verify upstream release/license, replace the entire published bundle, update its versioned filename and adapter, and rerun scheduling, persistence and browser tests.
