const {test,expect}=require('@playwright/test');

async function setLegacy(page,unit,index=0,score=100,misses=0){
 await page.goto('/index.html');
 await page.evaluate(({unit,index,score,misses})=>{
   const key=unit===1?'wordquest_g7u1_v1':'wordquest_g7u'+unit+'_semester_v1';
   const data=unit===1
    ?{current:index,maxUnlocked:index+1,earned:{[index]:score},
       misses:{[index]:misses},score,view:'play',zh:false}
    :{current:index,unlocked:index+1,completed:{[index]:score},
       mistakes:{[index]:misses},points:score,zh:false,tab:'play'};
   localStorage.setItem(key,JSON.stringify(data));
 },{unit,index,score,misses});
}
async function firstCorrect(page){
 const answer=await page.evaluate(()=>window.WORDQUEST_CONTENT.missions[2][0].answer);
 await page.locator('[data-action="choose"][data-n="'+answer+'"]').click();
}

test('main-game Unit 1 completion seeds exactly one FSRS card without rewriting XP',async({page})=>{
 await page.goto('/unit1.html');
 await page.locator('[data-action="part"][data-n="2"]').click();
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 const saved=await page.evaluate(()=>({
  game:localStorage.getItem('wordquest_g7u1_v1'),
  review:JSON.parse(localStorage.getItem('wordquest_review_v1'))
 }));
 expect(JSON.parse(saved.game).earned['0']).toBe(100);
 expect(saved.review.cards['u1:m0'].fsrs).toBeTruthy();
 expect(saved.review.cards['u1:m0'].reviewCount).toBe(0);
 await page.locator('[data-action="replay"]').click();
 await page.locator('[data-action="part"][data-n="2"]').click();
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 const final=await page.evaluate(()=>({
  game:localStorage.getItem('wordquest_g7u1_v1'),
  review:JSON.parse(localStorage.getItem('wordquest_review_v1'))
 }));
 expect(final.game).toEqual(saved.game);
 expect(final.review).toEqual(saved.review);
});

test('Today: previously completed mission opens a question and resumes after refresh',async({page})=>{
 await setLegacy(page,2,0,100,0);
 await page.goto('/review.html?mode=today&auto=1');
 await expect(page.locator('.mission-title')).toBeVisible();
 await expect(page.locator('.review-step')).toContainText('1 / 1');
 await expect(page.locator('.feedback')).toHaveCount(0);
 await page.reload();
 await expect(page.locator('.mission-title')).toBeVisible();
 await firstCorrect(page);
 await expect(page.locator('.review-note')).toContainText('FSRS result: Good');
 await page.locator('[data-action="next"]').click();
 await expect(page.getByText('Review finished')).toBeVisible();
 const state=await page.evaluate(()=>({
  review:JSON.parse(localStorage.getItem('wordquest_review_v1')),
  unit:JSON.parse(localStorage.getItem('wordquest_g7u2_semester_v1'))
 }));
 expect(state.review.cards['u2:m0'].reviewCount).toBe(1);
 expect(state.review.session.cursor).toBe(1);
 expect(state.review.session.ids).toEqual(['u2:m0']);
 expect(state.unit.completed['0']).toBe(100);
 await page.goto('/review.html?mode=today&auto=1');
 await expect(page.getByText('Nothing is due right now.',{exact:false})).toBeVisible();
});

test('Review my mistakes: same-day repeat is practice-only and preserves original mistakes',async({page})=>{
 await page.goto('/unit1.html');
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 await page.locator('[data-action="part"][data-n="2"]').click();
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 const original=await page.evaluate(()=>localStorage.getItem('wordquest_g7u1_v1'));
 await page.goto('/review.html?mode=mistakes&auto=1');
 await expect(page.locator('.mission-title')).toBeVisible();
 await expect(page.locator('[data-action="part"][data-n="2"]')).toBeEnabled();
 await page.locator('[data-action="part"][data-n="2"]').click();
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 await expect(page.locator('.review-note')).toContainText('Same-day retry');
 const after=await page.evaluate(()=>({
  game:localStorage.getItem('wordquest_g7u1_v1'),
  review:JSON.parse(localStorage.getItem('wordquest_review_v1'))
 }));
 expect(after.game).toBe(original);
 expect(after.review.cards['u1:m0'].reviewCount).toBe(0);
 expect(after.review.mistakesSession.cursor).toBe(1);
});

test('Review XP: delayed independent recall of an explicitly revealed 0-XP word earns +25 once',async({page})=>{
 await setLegacy(page,1,0,0,3);
 await page.goto('/review.html');
 await page.evaluate(()=>{
   const when=new Date(Date.now()-4*86400000);
   window.WordQuestReviewMemory.seedFirstCompletion(localStorage,{
     unit:1,index:0,word:'windsurfing',originalXP:0,misses:3,
     finished:true,correct:false,revealed:true,wrongCount:3
   },when);
 });
 const original=await page.evaluate(()=>localStorage.getItem('wordquest_g7u1_v1'));
 await page.goto('/review.html?mode=mistakes&auto=1');
 await page.locator('[data-action="part"][data-n="2"]').click();
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 await expect(page.locator('.review-bonus')).toContainText('+25 Review XP');
 const saved=await page.evaluate(()=>({
  game:localStorage.getItem('wordquest_g7u1_v1'),
  review:JSON.parse(localStorage.getItem('wordquest_review_v1'))
 }));
 expect(saved.game).toBe(original);
 expect(saved.review.bonus.total).toBe(25);
 await page.locator('[data-action="next"]').click();
 await page.goto('/review.html?mode=mistakes&auto=1');
 await page.locator('[data-action="part"][data-n="2"]').click();
 await page.locator('[data-action="part"][data-n="0"]').click();
 await page.locator('[data-action="check"]').click();
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('wordquest_review_v1')));
 expect(result.bonus.total).toBe(25);
});

test('Review: bilingual hint and 3-error reveal work on unit 1 build',async({page})=>{
 await setLegacy(page,1,0,100,1);
 await page.goto('/review.html?mode=mistakes&auto=1');
 await page.locator('[data-action="zh"]').click();
 await expect(page.locator('.cn-title')).toBeVisible();
 await page.locator('[data-action="hint"]').click();
 await expect(page.locator('.hints .cn')).toBeVisible();
 for(let n=0;n<3;n++){
   await page.locator('[data-action="part"][data-n="0"]').click();
   await page.locator('[data-action="check"]').click();
 }
 await page.locator('[data-action="reveal"]').click();
 await expect(page.locator('.review-note')).toContainText('FSRS result: Again');
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('wordquest_review_v1')));
 expect(state.cards['u1:m0'].remembered).toBe(false);
});

test('Header shows compact Today badge and review page fits small viewport',async({page,isMobile})=>{
 await setLegacy(page,2,0,100,0);
 await page.goto('/index.html');
 const badge=page.locator('.wq-today-link');
 await expect(badge).toBeVisible();
 await expect(page.locator('[data-review-count]')).toHaveText('1');
 await badge.click();
 await expect(page.locator('.mission-title')).toBeVisible();
 if(isMobile){
   const dimensions=await page.evaluate(()=>({
     scroll:document.documentElement.scrollWidth,inner:window.innerWidth
   }));
   expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.inner+1);
 }
});
