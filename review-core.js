/* Word Quest v1.6 review foundation.
 * Pure, dependency-free functions for inventory, recall evidence and daily queue.
 * This module deliberately does not write to localStorage, award XP, or modify
 * existing unit progress. FSRS scheduling/serialization is a separate adapter.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordQuestReviewCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const SCHEMA = 1;
  const REVIEW_KEY = 'wordquest_review_v1';
  const MAX_DAILY = 5;
  const RATINGS = Object.freeze({ Again: 'Again', Hard: 'Hard', Good: 'Good' });

  function asDate(value) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  function localDay(value) {
    const date = asDate(value);
    if (!date) throw new TypeError('A valid date is required');
    const pad = n => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function stableTime(value, lastObservedAt) {
    const current = asDate(value);
    if (!current) throw new TypeError('A valid current date is required');
    const previous = lastObservedAt == null ? null : asDate(lastObservedAt);
    return previous && previous > current ? previous : current;
  }
  function missionId(unit, index) {
    if (!Number.isInteger(unit) || unit < 1 || unit > 6 ||
        !Number.isInteger(index) || index < 0) throw new RangeError('Invalid unit or mission');
    return 'u' + unit + ':m' + index;
  }
  function wordKey(word) {
    return typeof word === 'string'
      ? word.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
      : '';
  }
  function numericIndex(key, length) {
    if (!/^(0|[1-9]\d*)$/.test(String(key))) return null;
    const n = Number(key);
    return Number.isSafeInteger(n) && n >= 0 && n < length ? n : null;
  }
  function parseProgress(raw, unit, length) {
    if (!Number.isInteger(unit) || unit < 1 || unit > 6) throw new RangeError('Invalid unit');
    if (!Number.isInteger(length) || length < 0) throw new RangeError('Invalid mission count');
    let value;
    try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { value = null; }
    const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const done = unit === 1 ? data.earned : data.completed;
    const misses = unit === 1 ? data.misses : data.mistakes;
    const completed = done && typeof done === 'object' && !Array.isArray(done) ? done : {};
    const mistakes = misses && typeof misses === 'object' && !Array.isArray(misses) ? misses : {};
    return Object.keys(completed).reduce((out, key) => {
      const i = numericIndex(key, length), score = completed[key];
      if (i === null || typeof score !== 'number' || !Number.isFinite(score) || score < 0) return out;
      const missCount = Number(mistakes[key]);
      out.push({
        id: missionId(unit, i), unit, index: i, originalXP: score,
        misses: Number.isSafeInteger(missCount) && missCount > 0 ? missCount : 0
      });
      return out;
    }, []).sort((a, b) => a.index - b.index);
  }
  function missionCandidates(unit, raw, words) {
    if (!Array.isArray(words)) throw new TypeError('words must be a mission array');
    return parseProgress(raw, unit, words.length).flatMap(item => {
      const word = typeof words[item.index] === 'string'
        ? words[item.index] : words[item.index] && words[item.index].word;
      const key = wordKey(word);
      return key ? [{ ...item, word, wordKey: key }] : [];
    });
  }
  function gradeAttempt({ finished, correct, revealed = false, wrongCount = 0,
                          hintsUsed = 0, chineseAssisted = false } = {}) {
    if (!finished) return null;
    if (!correct && !revealed) return null; // unresolved: no FSRS review
    if (revealed || wrongCount > 0) return RATINGS.Again;
    if (hintsUsed > 0 || chineseAssisted) return RATINGS.Hard;
    return RATINGS.Good;
  }
  // FSRS is responsible for calculating due; this function ONLY selects already
  // due cards or completed legacy missions with no review card.
  function selectToday({ candidates = [], cards = {}, now, limit = MAX_DAILY } = {}) {
    if (!Number.isInteger(limit) || limit < 0 || limit > MAX_DAILY) {
      throw new RangeError('Daily limit must be between 0 and ' + MAX_DAILY);
    }
    const day = localDay(now), clean = [];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate.id !== 'string' || !candidate.wordKey) continue;
      const card = cards && Object.prototype.hasOwnProperty.call(cards, candidate.id)
        ? cards[candidate.id] : null;
      if (card) {
        if (typeof card !== 'object' || !card || !asDate(card.due)) continue;
        if (card.lastRatedLocalDay && card.lastRatedLocalDay >= day) continue;
        if (localDay(card.due) > day) continue;
      }
      clean.push({
        ...candidate,
        priority: card ? 0 : 1,
        dueTime: card ? asDate(card.due).getTime() : Number.POSITIVE_INFINITY
      });
    }
    clean.sort((a, b) => a.priority - b.priority || a.dueTime - b.dueTime ||
      b.misses - a.misses || a.id.localeCompare(b.id));
    const selected = [], seenWords = new Set();
    for (const c of clean) {
      if (seenWords.has(c.wordKey)) continue;
      seenWords.add(c.wordKey);
      selected.push(c.id);
      if (selected.length >= limit) break;
    }
    return limit ? selected : [];
  }
  function makeDailySession({ candidates = [], cards = {}, now, previous = null } = {}) {
    const day = localDay(now);
    if (previous && previous.kind === 'today' && Array.isArray(previous.ids) &&
        Array.isArray(previous.results) && Number.isInteger(previous.cursor) &&
        previous.cursor >= 0 && previous.cursor <= previous.ids.length) {
      // An unfinished queue must remain resumable even across midnight.
      // A finished queue stays finished on the same day or on clock rollback.
      if (previous.cursor < previous.ids.length || previous.day >= day) {
        return { ...previous, ids: [...previous.ids], results: [...previous.results] };
      }
    }
    return {
      kind: 'today', day,
      ids: selectToday({ candidates, cards, now }),
      cursor: 0, results: []
    };
  }
  function finishSessionItem(session, id, rating, finishedAt) {
    if (!session || !Array.isArray(session.ids) || !Array.isArray(session.results) ||
        !Number.isInteger(session.cursor) || !Object.values(RATINGS).includes(rating) ||
        !asDate(finishedAt)) throw new TypeError('Invalid finished review');
    // Repeat clicks, stale tab submissions, and out-of-order results have no effect.
    if (session.ids[session.cursor] !== id) return { committed: false, session };
    return {
      committed: true,
      session: {
        ...session, cursor: session.cursor + 1,
        results: [...session.results, { id, rating, finishedAt: asDate(finishedAt).toISOString() }]
      }
    };
  }
  function emptyReviewState() {
    return { schema: SCHEMA, cards: {}, session: null,
      bonus: { awardedByWord: {}, total: 0 }, lastObservedAt: null };
  }

  return Object.freeze({
    REVIEW_KEY, SCHEMA, MAX_DAILY, RATINGS, localDay, stableTime, missionId,
    wordKey, parseProgress, missionCandidates, gradeAttempt, selectToday,
    makeDailySession, finishSessionItem, emptyReviewState
  });
});
