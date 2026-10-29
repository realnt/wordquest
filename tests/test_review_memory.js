'use strict';
process.env.TZ = 'Asia/Singapore';
const assert = require('node:assert/strict');
const S = require('../review-scheduler.js');
const M = require('../review-memory.js');
const C = require('../review-core.js');
const upstream = require('../vendor/ts-fsrs-5.4.2.umd.js');
const now = new Date('2026-10-29T04:00:00.000Z');
const delayed = new Date('2026-10-31T04:00:00.000Z');
const word = {unit:1,index:0,word:'Solar Panel',originalXP:0,misses:3};
const candidate = {...word,id:'u1:m0',wordKey:'solar panel'};
const good = {finished:true,correct:true};
const reveal = {finished:true,revealed:true};
function memory(initial={}) {
  const contents = new Map(Object.entries(initial)); let writes=0;
  return {contents, get writes(){return writes;},
    getItem:key=>contents.has(key)?contents.get(key):null,
    setItem(key,val){writes++;contents.set(key,String(val));}};
}
function test(name,fn) {fn();console.log('PASS',name);}

test('actual pinned FSRS UMD works without network',()=>{
  assert.equal(typeof upstream.fsrs,'function');
  assert.equal(typeof upstream.createEmptyCard,'function');
  assert.equal(S.VERSION,'5.4.2');
  assert.equal(S.CONFIG.enable_fuzz,false);
  assert.equal(S.RATINGS.Good,upstream.Rating.Good);
  const first=S.next(null,now,'Good');
  const missed=S.next(null,now,'Again');
  assert.ok(first.card.stability>missed.card.stability);
  assert.ok(Date.parse(first.card.due)>Date.parse(missed.card.due));
  assert.equal(first.log.review,now.toISOString());
});

test('FSRS full card round-trips Date values and rejects invalid state',()=>{
  const original=S.next(null,now,'Good').card;
  const restored=S.hydrate(JSON.parse(JSON.stringify(original)));
  assert.ok(restored.due instanceof Date);
  assert.ok(restored.last_review instanceof Date);
  assert.deepEqual(S.serialize(restored),original);
  assert.ok(S.next(original,delayed,'Good').card.stability>original.stability);
  assert.equal(S.hydrate({due:'bad'}),null);
  assert.throws(()=>S.next(null,now,'Easy'),RangeError);
});

test('fresh review state does not write or modify any old progress key',()=>{
  const old='{"earned":{"0":0},"misses":{"0":3},"score":0}';
  const st=memory({'wordquest_g7u1_v1':old});
  assert.equal(M.read(st).ok,true);
  assert.equal(st.writes,0);
  assert.equal(st.contents.size,1);
  const saved=M.seedFirstCompletion(st,{...word,...reveal},now);
  assert.equal(saved.saved,true);
  assert.equal(st.writes,1);
  assert.equal(st.getItem('wordquest_g7u1_v1'),old);
  assert.equal(M.read(st).state.cards['u1:m0'].revealedForZero,true);
  assert.equal(M.seedFirstCompletion(st,{...word,...reveal},now).saved,false);
});

test('an incomplete initial attempt does not create review state',()=>{
  const st=memory();
  assert.equal(M.seedFirstCompletion(st,{...word,finished:false},now).ok,false);
  assert.equal(st.writes,0);
});

test('delayed independent Good earns a one-time 25 Review XP, never changes mission XP',()=>{
  const st=memory();
  M.seedFirstCompletion(st,{...word,...reveal},now);
  const count=st.writes;
  const result=M.recordReview(st,{...word,...good,attemptId:'r:1',mode:'mistakes'},delayed);
  assert.equal(result.rating,'Good');
  assert.equal(result.earnedReviewXP,25);
  assert.equal(st.writes,count+1);
  const saved=M.read(st).state;
  assert.equal(saved.bonus.total,25);
  assert.equal(saved.cards['u1:m0'].remembered,false);
  assert.equal(M.recordReview(st,{...word,...good,attemptId:'r:1',mode:'mistakes'},delayed).saved,false);
  assert.equal(M.recordReview(st,{...word,...good,attemptId:'r:2',mode:'mistakes'},delayed).saved,false);
  assert.equal(st.writes,count+1);
});

test('legacy 0-XP completion lacks proof of reveal and never earns bonus',()=>{
  const st=memory();
  const outcome=M.recordReview(st,{...word,...good,attemptId:'legacy:1',mode:'mistakes'},now);
  assert.equal(outcome.earnedReviewXP,0);
  assert.equal(M.read(st).state.cards['u1:m0'].firstSeenAt,now.toISOString());
  assert.equal(M.read(st).state.cards['u1:m0'].remembered,false);
  assert.equal(M.read(st).state.bonus.total,0);
});

test('remembered requires real later Good and stability at least seven',()=>{
  const st=memory();
  const learned={...word,index:1,originalXP:100};
  M.seedFirstCompletion(st,{...learned,...good},now);
  assert.equal(M.recordReview(st,{...learned,...good,attemptId:'same:1',mode:'mistakes'},now).saved,false);
  const response=M.recordReview(st,{...learned,...good,attemptId:'late:1',mode:'mistakes'},delayed);
  assert.equal(response.saved,true);
  const card=M.read(st).state.cards['u1:m1'];
  assert.ok(card.fsrs.stability>=7);
  assert.equal(card.remembered,true);
});

test('Today session and result save atomically, even with a bonus',()=>{
  const st=memory();
  M.seedFirstCompletion(st,{...word,...reveal},now);
  const before=st.writes;
  assert.equal(M.startToday(st,[candidate],delayed).saved,true);
  assert.equal(st.writes,before+1);
  assert.deepEqual(M.read(st).state.session.ids,['u1:m0']);
  assert.equal(M.recordReview(st,{...word,...good,attemptId:'today:1',mode:'today'},delayed).saved,true);
  assert.equal(st.writes,before+2);
  const snapshot=M.read(st).state;
  assert.equal(snapshot.session.cursor,1);
  assert.equal(snapshot.bonus.total,25);
  assert.equal(snapshot.cards['u1:m0'].reviewCount,1);
  assert.equal(M.recordReview(st,{...word,...good,attemptId:'today:1',mode:'today'},delayed).saved,false);
  assert.equal(st.writes,before+2);
});

test('future clock incorrectly saved cannot lock review until next year',()=>{
  const future=new Date('2027-06-01T05:00:00Z');
  const corrected=new Date('2026-10-30T05:00:00Z');
  const st=memory();
  M.seedFirstCompletion(st,{...word,originalXP:100,...good},future);
  const outcome=M.startToday(st,[{...candidate,originalXP:100}],corrected);
  assert.deepEqual(outcome.recovered,['u1:m0']);
  const state=M.read(st).state;
  assert.equal(state.cards['u1:m0'].fsrs,null);
  assert.equal(state.cards['u1:m0'].lastRatedLocalDay,null);
  assert.equal(state.cards['u1:m0'].firstSeenAt,corrected.toISOString());
  assert.deepEqual(state.session.ids,['u1:m0']);
  assert.equal(M.recordReview(st,{...word,...good,originalXP:100,attemptId:'clock:1',mode:'today'},corrected).saved,true);
});

test('corrupt due date is rescheduled as a baseline instead of lost',()=>{
  const st=memory();
  M.seedFirstCompletion(st,{...word,...good,originalXP:100},now);
  const v=M.read(st).state;
  v.cards['u1:m0'].fsrs={due:'bad'};
  v.cards['u1:m0'].due='bad';
  st.setItem(C.REVIEW_KEY,JSON.stringify(v));
  assert.deepEqual(M.startToday(st,[candidate],delayed).state.session.ids,['u1:m0']);
  assert.equal(M.recordReview(st,{...word,...good,originalXP:100,mode:'today',attemptId:'bad:1'},delayed).saved,true);
  assert.ok(S.hydrate(M.read(st).state.cards['u1:m0'].fsrs));
});

test('corrupt or future-version storage is not silently overwritten',()=>{
  const st=memory({[C.REVIEW_KEY]:'{invalid'});
  assert.equal(M.seedFirstCompletion(st,{...word,...good},now).ok,false);
  assert.equal(st.writes,0);
  const newer=memory({[C.REVIEW_KEY]:JSON.stringify({...C.emptyReviewState(),schema:2})});
  assert.equal(M.startToday(newer,[candidate],now).ok,false);
  assert.equal(newer.writes,0);
});

test('write failure must not pretend it saved',()=>{
  const st=memory();
  st.setItem=()=>{throw Error('storage quota');};
  const response=M.seedFirstCompletion(st,{...word,...good},now);
  assert.equal(response.ok,false);
  assert.equal(response.reason,'storage-write-failed');
});
console.log('FSRS persistence suite complete.');
