/* Word Quest v1.6 — separate browser-local review persistence.
 * Uses exactly one versioned storage key per atomic operation. It NEVER writes
 * legacy Unit 1/2–6 progress, speech settings or historical mission XP.
 * Not loaded by gameplay pages until the review UI is independently approved.
 */
(function (root, factory) {
  'use strict';
  const api = factory(
    typeof module === 'object' && module.exports ? require('./review-core.js') : root.WordQuestReviewCore,
    typeof module === 'object' && module.exports ? require('./review-scheduler.js') : root.WordQuestScheduler
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordQuestReviewMemory = api;
})(typeof globalThis === 'object' ? globalThis : this, function (core, scheduler) {
  'use strict';
  if (!core || !scheduler) throw new Error('Review core and scheduler must load first');
  const BONUS_XP = 25;
  const RECOVERY_WINDOW_MS = 12 * 60 * 60 * 1000;
  const REMEMBERED_WAIT_MS = 24 * 60 * 60 * 1000;
  const has = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function date(value) {
    if (value == null || value === '') return null;
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  function validState(v) {
    return object(v) && v.schema === core.SCHEMA && object(v.cards) &&
      (v.session === null || object(v.session)) &&
      object(v.bonus) && object(v.bonus.awardedByWord) &&
      Number.isSafeInteger(v.bonus.total) && v.bonus.total >= 0 &&
      (!has(v,'attempts') || object(v.attempts));
  }
  function read(storage) {
    let raw;
    try { raw = storage.getItem(core.REVIEW_KEY); }
    catch (_) { return { ok:false, reason:'storage-unavailable' }; }
    if (raw == null) return {ok:true, state:{...core.emptyReviewState(),attempts:{}}};
    let state;
    try { state = JSON.parse(raw); }
    catch (_) { return {ok:false, reason:'corrupt-review-data'}; }
    if (!validState(state)) return {ok:false, reason:'unsupported-or-corrupt-review-data'};
    return {ok:true, state:{...state, attempts:state.attempts || {}}};
  }
  function transact(storage, operation) {
    const snapshot = read(storage);
    if (!snapshot.ok) return snapshot;
    // Pure operation computes the full next value before any write.
    const output = operation(snapshot.state);
    if (!output || !output.changed) return {ok:true, saved:false,
      reason:output && output.reason || 'unchanged', state:snapshot.state};
    try { storage.setItem(core.REVIEW_KEY, JSON.stringify(output.state)); }
    catch (_) { return {ok:false, saved:false, reason:'storage-write-failed'}; }
    return {ok:true, saved:true, state:output.state, ...output.details};
  }
  function normalizeCandidate({unit,index,word,originalXP,misses=0}) {
    const id = core.missionId(unit,index);
    const key = core.wordKey(word);
    if (!key || typeof originalXP !== 'number' || !Number.isFinite(originalXP) ||
        originalXP < 0 || !Number.isInteger(misses) || misses < 0)
      throw new TypeError('Invalid completed mission');
    return {id,wordKey:key,originalXP,misses};
  }
  function prepare(state,now) {
    const cards = {...state.cards}, recovered = [];
    for (const [id,card] of Object.entries(cards)) {
      if (!object(card)) continue;
      const recent = date(card.lastReviewAt);
      const first = date(card.firstSeenAt);
      if (recent && recent.getTime() > now.getTime() + RECOVERY_WINDOW_MS) {
        // Real device clock was corrected after a far-future rating. Its FSRS
        // due/lastRatedLocalDay must not lock this card away until that year.
        cards[id] = {...card, fsrs:null, due:null, lastReviewAt:null,
          lastRatedLocalDay:null, lastIndependentRecallAt:null,
          firstSeenAt:first && first > now ? now.toISOString():card.firstSeenAt,
          remembered:false,clockCorrections:(card.clockCorrections||0)+1};
        recovered.push(id);
      }
    }
    return {state:{...state,cards}, recovered};
  }
  function seedFirstCompletion(storage, input, when) {
    const now = date(when);
    if (!now) throw new TypeError('Invalid completion time');
    const candidate = normalizeCandidate(input);
    const rating = core.gradeAttempt(input);
    if (!rating) return {ok:false,reason:'unfinished-attempt'};
    return transact(storage,state=>{
      if (has(state.cards,candidate.id)) return {changed:false,reason:'already-seeded'};
      const result = scheduler.next(null,now,rating);
      const card = {...candidate,fsrs:result.card,due:result.card.due,
        firstSeenAt:now.toISOString(),lastReviewAt:now.toISOString(),
        lastRatedLocalDay:core.localDay(now),lastIndependentRecallAt:null,
        remembered:false,revealedForZero:!!input.revealed && candidate.originalXP===0,
        reviewCount:0,lastLog:result.log};
      return {changed:true,state:{...state,cards:{...state.cards,[candidate.id]:card},
        lastObservedAt:now.toISOString()}};
    });
  }
  function startToday(storage, candidates, when) {
    const now = date(when);
    if (!now) throw new TypeError('Invalid session date');
    if (!Array.isArray(candidates)) throw new TypeError('Candidates must be an array');
    return transact(storage,raw=>{
      const {state,recovered}=prepare(raw,now);
      const session = core.makeDailySession({
        candidates,cards:state.cards,now,previous:state.session});
      const same = JSON.stringify(state.session) === JSON.stringify(session);
      if (same && !recovered.length) return {changed:false,reason:'session-unchanged'};
      return {changed:true,state:{...state,session,lastObservedAt:now.toISOString()},
        details:{recovered}};
    });
  }
  function recordReview(storage, input, when) {
    const now = date(when);
    if (!now) throw new TypeError('Invalid review timestamp');
    const candidate = normalizeCandidate(input);
    if (typeof input.attemptId !== 'string' || !/^[\w:-]{1,128}$/.test(input.attemptId))
      return {ok:false,reason:'invalid-attempt-id'};
    if (input.mode !== 'today' && input.mode !== 'mistakes')
      return {ok:false,reason:'invalid-review-mode'};
    const rating = core.gradeAttempt(input);
    if (!rating) return {ok:false,reason:'unfinished-attempt'};
    return transact(storage,raw=>{
      const {state,recovered}=prepare(raw,now);
      if (has(state.attempts,input.attemptId)) return {changed:false,reason:'already-rated'};
      const prev = has(state.cards,candidate.id) ? state.cards[candidate.id] : null;
      if (prev && prev.lastRatedLocalDay && prev.lastRatedLocalDay >= core.localDay(now))
        return {changed:false,reason:'already-rated-today'};
      let nextSession=state.session;
      if (input.mode==='today') {
        const step = core.finishSessionItem(nextSession,candidate.id,rating,now);
        if (!step.committed) return {changed:false,reason:'not-current-session-item'};
        nextSession = step.session;
      }
      const previousFSRS = prev && scheduler.hydrate(prev.fsrs) ? prev.fsrs : null;
      const result = scheduler.next(previousFSRS,now,rating);
      // No invented original completion timestamp for old saves.
      const first = prev && date(prev.firstSeenAt) || now;
      const delayed = now.getTime() - first.getTime() >= REMEMBERED_WAIT_MS;
      const independentlyRecalled = delayed && rating === 'Good';
      const remembered = independentlyRecalled && result.card.stability >= 7;
      const key = candidate.wordKey, bonus=state.bonus;
      const eligibleBonus = !!(prev && prev.revealedForZero) &&
        independentlyRecalled && !has(bonus.awardedByWord,key);
      const nextBonus = eligibleBonus ? {
        awardedByWord:{...bonus.awardedByWord,[key]:{at:now.toISOString(),
          sourceMission:candidate.id,amount:BONUS_XP}},
        total:bonus.total+BONUS_XP
      } : bonus;
      const card={...candidate,
        fsrs:result.card,due:result.card.due,firstSeenAt:first.toISOString(),
        lastReviewAt:now.toISOString(),lastRatedLocalDay:core.localDay(now),
        lastIndependentRecallAt:independentlyRecalled?now.toISOString():
          (prev && prev.lastIndependentRecallAt)||null,
        remembered,revealedForZero:!!(prev && prev.revealedForZero),
        reviewCount:(prev && prev.reviewCount||0)+1,
        clockCorrections:(prev && prev.clockCorrections||0),
        lastLog:result.log
      };
      const attempts={...state.attempts,[input.attemptId]:{
        id:candidate.id,rating,at:now.toISOString()}};
      return {changed:true,state:{...state,cards:{...state.cards,[candidate.id]:card},
        session:nextSession,attempts,bonus:nextBonus,lastObservedAt:now.toISOString()},
      details:{rating,earnedReviewXP:eligibleBonus?BONUS_XP:0,recovered}};
    });
  }
  return Object.freeze({BONUS_XP,read,seedFirstCompletion,startToday,recordReview});
});
