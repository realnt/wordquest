const {test,expect}=require('@playwright/test');

const progressKey=unit=>unit===1?'wordquest_g7u1_v1':'wordquest_g7u'+unit+'_semester_v1';
const storage=async(page,key)=>page.evaluate(k=>localStorage.getItem(k),key);

for(let unit=1;unit<=6;unit++){
  test('Unit '+unit+': navigation, vault, map and version',async({page})=>{
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/unit'+unit+'.html');
    await expect(page.locator('.wq-header')).toBeVisible();
    await expect(page.locator('[data-wordquest-version]')).toHaveText('v1.5.4');
    await expect(page.locator('.mission-title')).toBeVisible();
    await expect(page.locator('.speech-settings-trigger')).toBeVisible();
    await page.locator('.wq-nav [data-view="map"]').click();
    await expect(page.locator('.maptile').first()).toBeVisible();
    await page.locator('.wq-nav [data-view="vault"]').click();
    await expect(page.locator('.vword').first()).toBeVisible();
    await expect(page.locator('.speak-word').first()).toBeVisible();
    await page.locator('.wq-nav [data-view="play"]').click();
    await expect(page.locator('.mission-title')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('Unit 1: replay word-building and protect earned XP',async({page})=>{
  await page.goto('/unit1.html');
  await page.locator('[data-action="part"][data-n="2"]').click();
  await page.locator('[data-action="part"][data-n="0"]').click();
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.feedback')).toBeVisible();
  const original=await storage(page,progressKey(1));
  expect(JSON.parse(original).earned['0']).toBe(100);
  await page.locator('[data-action="replay"]').click();
  await expect(page.locator('.practice-note').first()).toBeVisible();
  await expect(page.locator('[data-action="part"][data-n="2"]')).toBeEnabled();
  expect(await storage(page,progressKey(1))).toBe(original);
  await page.locator('[data-action="part"][data-n="2"]').click();
  await page.locator('[data-action="part"][data-n="0"]').click();
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.feedback')).toContainText('Practice complete');
  expect(await storage(page,progressKey(1))).toBe(original);
  await page.locator('[data-action="replay"]').click();
  for(let i=0;i<3;i++){
    await page.locator('[data-action="part"][data-n="0"]').click();
    await page.locator('[data-action="check"]').click();
  }
  await expect(page.locator('[data-action="reveal"]')).toBeVisible();
  await page.locator('[data-action="reveal"]').click();
  await expect(page.locator('.feedback')).toContainText('Practice complete');
  expect(await storage(page,progressKey(1))).toBe(original);
  await page.reload();
  await expect(page.locator('[data-action="replay"]')).toBeVisible();
});

test('Unit 2: retry choice, reveal solution and maintain original score',async({page})=>{
  await page.goto('/unit2.html');
  await page.locator('[data-action="choose"][data-n="0"]').click();
  const earned=await storage(page,progressKey(2));
  expect(JSON.parse(earned).points).toBe(100);
  await page.locator('[data-action="replay"]').click();
  await expect(page.locator('.practice-note').first()).toBeVisible();
  await page.locator('[data-action="choose"][data-n="1"]').click();
  expect(await storage(page,progressKey(2))).toBe(earned);
  await page.locator('[data-action="choose"][data-n="0"]').click();
  await expect(page.locator('.feedback')).toContainText('Practice complete');
  expect(await storage(page,progressKey(2))).toBe(earned);
  await page.locator('[data-action="replay"]').click();
  await page.locator('[data-action="choose"][data-n="1"]').click();
  await expect(page.locator('[data-action="choose"][data-n="1"]')).toBeDisabled();
  await page.locator('[data-action="choose"][data-n="2"]').click();
  await page.locator('[data-action="choose"][data-n="0"]').click();
  expect(await storage(page,progressKey(2))).toBe(earned);
});

test('voice settings remain compact and preferences persist',async({page})=>{
  await page.goto('/unit1.html');
  const trigger=page.locator('.speech-settings-trigger');
  const panel=page.locator('.speech-accent-control');
  await expect(panel).toBeHidden();
  await trigger.click();
  await expect(panel).toBeVisible();
  await panel.locator('.speech-accent-select').selectOption('en-US');
  await expect.poll(()=>storage(page,'wordquest_speech_accent_v1')).toBe('en-US');
  const speed=panel.locator('.speech-speed-range');
  await speed.focus();
  await speed.press('End');
  await expect.poll(()=>storage(page,'wordquest_speech_speed_v1')).toBe('1.20');
  await panel.locator('.speech-settings-confirm').click();
  await expect(panel).toBeHidden();
  await page.reload();
  await expect(panel).toBeHidden();
  await trigger.click();
  await expect(panel.locator('.speech-accent-select')).toHaveValue('en-US');
  await expect(panel.locator('.speech-speed-range')).toHaveValue('1.2');
  await expect.poll(()=>storage(page,'wordquest_speech_speed_v1')).toBe('1.20');
});

test('homepage: six units and version displayed',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('[data-wordquest-version]')).toHaveText('v1.5.4');
  await expect(page.locator('.unitcard')).toHaveCount(6);
  await expect(page.locator('#home-progress-count')).toContainText('0 / 109');
});


test('learning integrity: stable choices, no map spoilers, fair retries',async({page})=>{
 await page.goto('/unit2.html');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 const order=()=>page.locator('.option').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('data-n')));
 const before=await order();
 await page.locator('[data-action="hint"]').click();
 expect(await order()).toEqual(before);
 await page.locator('[data-action="choose"][data-n="1"]').click();
 const saved=await storage(page,progressKey(2));
 expect(JSON.parse(saved).mistakes['0']).toBe(1);
 await expect(page.locator('[data-action="choose"][data-n="1"]')).toBeDisabled();
 await page.locator('[data-action="choose"][data-n="1"]').dispatchEvent('click');
 expect(await storage(page,progressKey(2))).toBe(saved);
 expect(await order()).toEqual(before);
 await page.locator('.wq-nav [data-view="map"]').click();
 await expect(page.locator('.maptile').first()).toContainText('Solve to reveal');
 await expect(page.locator('.maptile').first()).not.toContainText('weak');
 await page.locator('.wq-nav [data-view="play"]').click();
 await page.locator('[data-action="choose"][data-n="0"]').click();
 expect(JSON.parse(await storage(page,progressKey(2))).completed['0']).toBe(55);
 await page.locator('.wq-nav [data-view="map"]').click();
 await expect(page.locator('.maptile').first()).toContainText('weak');
});
for(const name of ['index.html','unit1.html','unit2.html','unit3.html','unit4.html','unit5.html','unit6.html']){
 test('document language: '+name,async({page})=>{
  await page.goto('/'+name);
  await expect(page.locator('html')).toHaveAttribute('lang','en');
 });
}
