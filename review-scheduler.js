/* Word Quest v1.6 — pinned FSRS 5.4.2 adapter.
 * The browser must load vendor/ts-fsrs-5.4.2.umd.js before this script.
 * No CDN, backend or migration of existing unit progress.
 */
(function (root, factory) {
  'use strict';
  const api = factory(
    typeof module === 'object' && module.exports
      ? require('./vendor/ts-fsrs-5.4.2.umd.js') : root.FSRS
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordQuestScheduler = api;
})(typeof globalThis === 'object' ? globalThis : this, function (lib) {
  'use strict';
  if (!lib || typeof lib.fsrs !== 'function' || typeof lib.createEmptyCard !== 'function' ||
      !lib.Rating || !lib.Rating.Good) throw new Error('Pinned ts-fsrs 5.4.2 is unavailable');
  const VERSION = '5.4.2';
  const CONFIG = Object.freeze({
    request_retention: 0.9, learning_steps: [], relearning_steps: [], enable_fuzz: false
  });
  const instance = lib.fsrs(CONFIG);
  const RATINGS = Object.freeze({ Again: lib.Rating.Again, Hard: lib.Rating.Hard,
    Good: lib.Rating.Good });
  const FIELDS = ['stability','difficulty','elapsed_days','scheduled_days',
    'learning_steps','reps','lapses','state'];
  const date = value => {
    if (value == null || value === '') return null;
    const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  };
  const iso = value => {
    const d = date(value);
    if (!d) throw new TypeError('Invalid FSRS date');
    return d.toISOString();
  };
  function hydrate(saved) {
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null;
    const due = date(saved.due);
    if (!due || FIELDS.some(key => typeof saved[key] !== 'number' ||
        !Number.isFinite(saved[key]) || saved[key] < 0)) return null;
    if (!Number.isInteger(saved.state) || saved.state > 3 ||
        !['elapsed_days','scheduled_days','learning_steps','reps','lapses']
          .every(k => Number.isInteger(saved[k]))) return null;
    const last_review = saved.last_review == null ? null : date(saved.last_review);
    if (saved.last_review != null && !last_review) return null;
    return { ...Object.fromEntries(FIELDS.map(key => [key,saved[key]])),
      due, ...(last_review ? { last_review } : {}) };
  }
  function serialize(card) {
    const c = hydrate(card);
    if (!c) throw new TypeError('Invalid FSRS card state');
    return { ...c, due: iso(c.due),
      ...(c.last_review ? { last_review: iso(c.last_review) } : {}) };
  }
  function empty(now) {
    const d = date(now);
    if (!d) throw new TypeError('Invalid review timestamp');
    return lib.createEmptyCard(d);
  }
  function next(previous, now, rating) {
    const d = date(now);
    if (!d) throw new TypeError('Invalid review timestamp');
    if (!Object.prototype.hasOwnProperty.call(RATINGS,rating))
      throw new RangeError('Only Again, Hard and Good are supported');
    const old = previous == null ? empty(d) : hydrate(previous);
    if (!old) throw new TypeError('Invalid previous FSRS card');
    const result = instance.next(old,d,RATINGS[rating]);
    if (!result || !result.card || !result.log) throw new Error('FSRS yielded no review');
    // Full FSRS card, including last_review, is kept; no estimated histories invented.
    return { card:serialize(result.card),
      log:{ ...result.log,
        due:iso(result.log.due), review:iso(result.log.review) } };
  }
  return Object.freeze({VERSION, CONFIG, RATINGS, empty, next, hydrate, serialize});
});
