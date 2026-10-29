/* Deterministic tests for the v1.6 review foundation.
 * Pure Node.js assertions; no browser, clock or storage side effects.
 */
'use strict';
const assert = require('node:assert/strict');
const R = require('../review-core.js');
process.env.TZ = 'Asia/Singapore';

function test(name, fn) {
  try { fn(); console.log('✓', name); }
  catch (e) { console.error('✗', name); throw e; }
}
const at = date => new Date(date);
const u1 = { earned: { 0: 100, 1: 0, 2: 40 }, misses: { 1: 3, 2: 1 }, score: 140, maxUnlocked: 3 };
const u2 = { completed: { 0: 80, 2: 0 }, mistakes: { 0: 1 }, points: 80, unlocked: 3 };

test('stable unit+index identity, never option order', () => {
  assert.equal(R.missionId(1, 0), 'u1:m0');
  assert.equal(R.missionId(6, 17), 'u6:m17');
  assert.throws(() => R.missionId(7, 0), RangeError);
  assert.throws(() => R.missionId(1, -1), RangeError);
});
test('word keys normalize spaces and case but not mission identity', () => {
  assert.equal(R.wordKey('  Solar   Panel '), 'solar panel');
  assert.equal(R.wordKey('FLOW'), 'flow');
  assert.equal(R.wordKey(null), '');
});
test('read Unit 1 legacy saves without changing original data', () => {
  const before = JSON.stringify(u1);
  const items = R.parseProgress(before, 1, 4);
  assert.deepEqual(items.map(x => [x.id, x.originalXP, x.misses]),
    [['u1:m0',100,0],['u1:m1',0,3],['u1:m2',40,1]]);
  assert.equal(JSON.stringify(u1), before);
});
test('read Unit 2–6 progress separately from Unit 1 schema', () => {
  const items = R.parseProgress(u2, 2, 3);
  assert.deepEqual(items.map(x => [x.id, x.originalXP, x.misses]),
    [['u2:m0',80,1],['u2:m2',0,0]]);
});
test('reject corrupt, missing and injected invalid mission records', () => {
  assert.deepEqual(R.parseProgress('{bad', 1, 2), []);
  assert.deepEqual(R.parseProgress(null, 2, 2), []);
  assert.deepEqual(R.parseProgress({ completed: { '-1': 99, foo: 5, 999: 44, 0: '90', 1: -3 } },2,3), []);
  assert.deepEqual(R.parseProgress({completed: {'01':5}},2,3), []);
});
test('only completed, known words become candidates', () => {
  const words = [{word:'Solar Panel'}, {word:'  FLOW '}, {word:''}];
  const items = R.missionCandidates(1, JSON.stringify(u1), words);
  assert.deepEqual(items.map(x => x.wordKey), ['solar panel', 'flow']);
});
test('grade only a completed attempt, once, not each wrong tap', () => {
  assert.equal(R.gradeAttempt({finished:false,correct:false,wrongCount:1}),null);
  assert.equal(R.gradeAttempt({finished:true,correct:true}), R.RATINGS.Good);
  assert.equal(R.gradeAttempt({finished:true,correct:true,hintsUsed:1}),R.RATINGS.Hard);
  assert.equal(R.gradeAttempt({finished:true,correct:true,chineseAssisted:true}),R.RATINGS.Hard);
  assert.equal(R.gradeAttempt({finished:true,correct:true,wrongCount:1}),R.RATINGS.Again);
  assert.equal(R.gradeAttempt({finished:true,correct:true,wrongCount:3}),R.RATINGS.Again);
  assert.equal(R.gradeAttempt({finished:true,revealed:true}),R.RATINGS.Again);
  assert.equal(R.gradeAttempt({finished:true,correct:false}),null);
});
test('day boundaries use local calendar date', () => {
  assert.equal(R.localDay(at('2026-10-28T15:59:59Z')),'2026-10-28');
  assert.equal(R.localDay(at('2026-10-28T16:00:00Z')),'2026-10-29');
  assert.throws(() => R.localDay('not a date'), TypeError);
});
test('monotonic effective clock prevents backward movement', () => {
  assert.equal(R.stableTime('2026-10-28T10:00:00Z','2026-10-29T00:00:00Z').toISOString(),
    '2026-10-29T00:00:00.000Z');
  assert.equal(R.stableTime('2026-10-30T10:00:00Z','2026-10-29T00:00:00Z').toISOString(),
    '2026-10-30T10:00:00.000Z');
  assert.throws(() => R.stableTime('bad'),TypeError);
});
function cand(unit,index,word,misses=0) {
  return {id:R.missionId(unit,index),unit,index,word,wordKey:R.wordKey(word),misses};
}
const candidates=[cand(1,0,'A',1),cand(1,1,'B',2),cand(1,2,'C',1),cand(2,0,'D',3),
  cand(2,1,'E',1),cand(2,2,'F'),cand(3,0,'G')];
const today=at('2026-10-29T04:00:00Z');
test('five item cap, deterministic order and no unnecessary filler', () => {
  const first=R.selectToday({candidates,now:today});
  assert.equal(first.length,5);
  assert.deepEqual(first,R.selectToday({candidates,now:today}));
  assert.deepEqual(R.selectToday({candidates:candidates.slice(0,2),now:today}),
    ['u1:m1','u1:m0']);
  assert.deepEqual(R.selectToday({candidates,now:today,limit:0}),[]);
  assert.throws(()=>R.selectToday({candidates,now:today,limit:6}),RangeError);
});
test('overdue first, future excluded, same-day rated excluded', () => {
  const cards = {
    'u1:m0': {due:'2026-10-30T02:00:00Z'},
    'u1:m1': {due:'2026-10-27T04:00:00Z'},
    'u1:m2': {due:'2026-10-28T04:00:00Z',lastRatedLocalDay:'2026-10-29'},
    'u2:m0': {due:'2026-10-29T10:00:00Z'}, // due later today, day-based policy
    'u2:m1': {due:'2026-10-28T08:00:00Z'}
  };
  const chosen=R.selectToday({candidates,cards,now:today});
  assert.deepEqual(chosen,['u1:m1','u2:m1','u2:m0','u2:m2','u3:m0']);
});
test('duplicate target words across units appear only once', () => {
  const pairs=[cand(1,0,'a handle'),cand(2,3,' A  HANDLE '),cand(2,4,'other')];
  assert.deepEqual(R.selectToday({candidates:pairs,now:today}),
    ['u1:m0','u2:m4']);
});
test('frozen daily queue resumes without reselecting after refresh', () => {
  const started=R.makeDailySession({candidates,now:today});
  const changed=R.makeDailySession({candidates:[],now:today,previous:started});
  assert.deepEqual(changed,started);
  assert.notStrictEqual(changed,started);
  assert.notStrictEqual(changed.ids,started.ids);
});
test('unfinished session resumes even after midnight; finished can restart next day', () => {
  const previous=R.makeDailySession({candidates,now:today});
  const nextDay=at('2026-10-30T05:00:00Z');
  assert.deepEqual(R.makeDailySession({candidates:[],now:nextDay,previous}),previous);
  const complete={...previous,cursor:previous.ids.length};
  assert.equal(R.makeDailySession({candidates:[],now:today,previous:complete}).cursor,
    complete.cursor);
  assert.equal(R.makeDailySession({candidates:[],now:nextDay,previous:complete}).cursor,0);
});
test('same attempt cannot advance twice, stale or out-of-order submissions ignored', () => {
  const before={kind:'today',day:'2026-10-29',ids:['u1:m0','u1:m1'],cursor:0,results:[]};
  const no=R.finishSessionItem(before,'u1:m1','Good',today);
  assert.equal(no.committed,false);
  const done=R.finishSessionItem(before,'u1:m0','Good',today);
  assert.equal(done.committed,true);
  assert.equal(done.session.cursor,1);
  assert.equal(before.cursor,0);
  assert.equal(done.session.results.length,1);
  assert.equal(R.finishSessionItem(done.session,'u1:m0','Good',today).committed,false);
  assert.equal(R.finishSessionItem(done.session,'u1:m1','Again',today).committed,true);
  assert.equal(R.finishSessionItem(done.session,'u1:m1','Again',today).committed,false);
});
test('initial review state is versioned and distinct from original progress',()=>{
  const x=R.emptyReviewState();
  assert.equal(R.REVIEW_KEY,'wordquest_review_v1');
  assert.equal(x.schema,1);
  assert.equal(x.bonus.total,0);
  assert.deepEqual(x.cards,{});
});
console.log('Review foundation unit tests: 16 passed');
