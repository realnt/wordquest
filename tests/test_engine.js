/* Unified engine integration tests, Node.js vm / no browser packages.
   Verify real Unit 1 legacy progress and Units 2–6 shared-game behavior. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
function game(unit,saved){
  const data=new Map(Object.entries(saved||{}));
  const events={},inputs={};
  const app={
    innerHTML:'',addEventListener:(type,cb)=>{events[type]=cb;},
    querySelector:selector=>({
      addEventListener:(type,cb)=>{inputs[selector+'#'+type]=cb;},
      innerHTML:''
    })
  };
  const localStorage={
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value))
  };
  const context={window:{scrollTo:()=>{},confirm:()=>true},localStorage,
    document:{body:{dataset:{unit:String(unit)}},
      title:'',getElementById:id=>id==='root'?app:null}};
  vm.createContext(context);
  vm.runInContext(read('site-shell.js'),context);
  vm.runInContext(read('content.js'),context);
  if(unit===1)vm.runInContext(read('unit1-data.js'),context);
  vm.runInContext(read('quest.js'),context);
  const click=(action,extra={})=>{
    const target={dataset:{action,...extra}};
    target.closest=selector=>selector==='[data-action]'?target:null;
    assert.ok(events.click,'Expected gameplay listener');
    events.click({target});
  };
  return {app,data,click,context,readKey:key=>JSON.parse(data.get(key)||'null')};
}
const KEY1='wordquest_g7u1_v1',KEY2='wordquest_g7u2_semester_v1';
{
 const g=game(1,{});
 const data=g.context.window.WordQuestUnit1;
 assert.equal(data.missions.length,23,'All original Unit 1 missions are present');
 assert.equal(data.missionTranslations.length,23);
 assert.equal(data.originMeta.length,23);
 assert.equal(data.originExtras.length,23);
 assert.equal(Object.values(data.glossary).flat().length,43,'All Unit 1 textbook words are present');
 for(let n=0;n<23;n++){
   const stored={current:n,maxUnlocked:23,earned:{},misses:{},score:0,view:'play',zh:true};
   const m=game(1,{[KEY1]:JSON.stringify(stored)});
   assert.ok(m.app.innerHTML.includes('data-action="choose"')||
     m.app.innerHTML.includes('data-action="part"'),
     'Mission '+(n+1)+' renders an answer control');
   assert.match(m.app.innerHTML,/YOUR MISSION/);
 }
 const result=game(1,{[KEY1]:JSON.stringify({
    current:22,maxUnlocked:23,earned:Object.fromEntries(Array.from({length:23},(_,i)=>[i,100])),
    misses:{},score:2300,view:'result',zh:false
 })});
 assert.match(result.app.innerHTML,/You're a Word Explorer!/,
    'Legacy completed game opens results screen');
}

{
 const g=game(1,{});
 assert.match(g.app.innerHTML,/Catch the Wind/);
 assert.match(g.app.innerHTML,/WIND|wind/);
 assert.match(g.app.innerHTML,/data-action="part"/);
 assert.match(g.app.innerHTML,/Word Vault/);
 assert.match(g.app.innerHTML,/speech-settings-trigger|WORD QUEST/);
 g.click('part',{n:'2'});
 g.click('part',{n:'0'});
 g.click('check');
 const saved=g.readKey(KEY1);
 assert.equal(saved.earned['0'],100,'Original first mission correct token order');
 assert.equal(saved.maxUnlocked,1);
 assert.equal(saved.score,100);
 assert.equal(saved.current,0);
 assert.ok(!Object.hasOwn(saved,'completed'),'Do not replace legacy progress format');
 assert.match(g.app.innerHTML,/Word Formation|Word Discovery/);
 assert.match(g.app.innerHTML,/Etymonline/);
 assert.match(g.app.innerHTML,/Next mission/);
 g.click('view',{view:'map'});
 assert.match(g.app.innerHTML,/Chapter A/);
 assert.match(g.app.innerHTML,/Chapter E/);
 assert.equal(g.readKey(KEY1).view,'map');
 g.click('view',{view:'vault'});
 assert.match(g.app.innerHTML,/43 entries/);
 assert.match(g.app.innerHTML,/data-speak-word/);
 g.click('view',{view:'play'});
 g.click('next');
 assert.equal(g.readKey(KEY1).current,1);
}
{
 const existing={current:3,maxUnlocked:5,earned:{0:90,1:80,2:70},misses:{2:1},
  score:240,view:'play',zh:true,level:'standard'};
 const g=game(1,{[KEY1]:JSON.stringify(existing)});
 assert.match(g.app.innerHTML,/A Curious Mind/);
 assert.match(g.app.innerHTML,/curious/);
 assert.match(g.app.innerHTML,/cn-title/);
 g.click('view',{view:'map'});
 const saved=g.readKey(KEY1);
 assert.equal(saved.earned['2'],70);
 assert.equal(saved.maxUnlocked,5);
 assert.equal(saved.score,240);
 assert.equal(saved.level,'standard','Unknown legacy state properties retained');
 assert.equal(saved.zh,true);
}
{
 const g=game(1,{[KEY1]:JSON.stringify({current:3,maxUnlocked:3,
  earned:{0:100,1:100,2:100},misses:{},score:300,view:'play',zh:false})});
 g.click('choose',{n:'1'});
 g.click('choose',{n:'1'});
 g.click('choose',{n:'1'});
 assert.equal(g.readKey(KEY1).earned['3'],20,'Unit 1 unlocks automatically after three wrong tries');
 assert.equal(g.readKey(KEY1).maxUnlocked,4);
 assert.equal(g.readKey(KEY1).misses['3'],3);
}
{
 const g=game(2,{});
 assert.match(g.app.innerHTML,/The Wobbly Bridge/);
 g.click('choose',{n:'0'});
 assert.equal(g.readKey(KEY2).completed['0'],100);
 assert.equal(g.readKey(KEY2).unlocked,1);
 assert.equal(g.readKey(KEY2).points,100);
 assert.ok(!Object.hasOwn(g.readKey(KEY2),'earned'),'Other units retain their own progress schema');
}
for(let unit=3;unit<=6;unit++){
 const g=game(unit,{});
 assert.match(g.app.innerHTML,new RegExp('UNIT '+unit));
 assert.match(g.app.innerHTML,/data-action="choose"|data-action="part"/);
}

/* Replay is a disposable practice attempt, never a new XP transaction. */
{
 const g=game(1,{});
 g.click('part',{n:'2'});g.click('part',{n:'0'});g.click('check');
 const storedBefore=g.data.get(KEY1);
 assert.match(g.app.innerHTML,/data-action="replay"/);
 g.click('replay');
 assert.match(g.app.innerHTML,/Practice mode/);
 assert.match(g.app.innerHTML,/data-action="part"/,'Completed Unit 1 build puzzle is interactive again');
 assert.equal(g.data.get(KEY1),storedBefore,'Entering practice never alters saved Unit 1 data');
 g.click('part',{n:'2'});g.click('part',{n:'0'});g.click('check');
 assert.match(g.app.innerHTML,/Practice complete/);
 assert.equal(g.data.get(KEY1),storedBefore,'Perfect practice cannot duplicate XP');
 g.click('replay');
 for(let n=0;n<3;n++)g.click('check');
 assert.match(g.app.innerHTML,/Practice complete/,'Auto-unlock after three mistakes works in practice');
 assert.equal(g.data.get(KEY1),storedBefore,'Practice misses and auto-unlocks must not change XP or misses');
 const refresh=game(1,{[KEY1]:storedBefore});
 assert.match(refresh.app.innerHTML,/data-action="replay"/,'Saved completion survives refresh');
 refresh.click('replay');
 assert.match(refresh.app.innerHTML,/data-action="part"/);
}
{
 const g=game(2,{});
 g.click('choose',{n:'0'});
 const saved=g.data.get(KEY2);
 assert.equal(g.readKey(KEY2).points,100);
 g.click('replay');
 assert.match(g.app.innerHTML,/Practice mode/);
 assert.match(g.app.innerHTML,/data-action="choose"/,'Completed choice puzzle can be answered again');
 assert.equal(g.data.get(KEY2),saved);
 g.click('choose',{n:'1'}); // wrong in practice
 assert.match(g.app.innerHTML,/Not quite/);
 assert.equal(g.data.get(KEY2),saved,'Practice mistakes are not persisted');
 g.click('choose',{n:'0'}); // correct
 assert.match(g.app.innerHTML,/Practice complete/);
 assert.equal(g.data.get(KEY2),saved,'Correct replay cannot duplicate XP');
 g.click('replay');
 for(let i=0;i<3;i++)g.click('choose',{n:'1'});
 assert.match(g.app.innerHTML,/Reveal solution/);
 g.click('reveal');
 assert.match(g.app.innerHTML,/Practice complete/);
 assert.equal(g.data.get(KEY2),saved,'Reveal during replay cannot reset or change score');
 g.click('view',{view:'map'});
 g.click('jump',{n:'0'});
 assert.match(g.app.innerHTML,/data-action="replay"/,'Normal review still shows past completion');
 assert.doesNotMatch(g.app.innerHTML,/Practice mode/,'Navigating away exits practice mode');
}
{
 // A completed mission reopened from a saved Unit 5 game can be retried.
 const key='wordquest_g7u5_semester_v1';
 const old={current:0,unlocked:1,completed:{0:80},mistakes:{0:2},points:80,zh:false,tab:'play'};
 const g=game(5,{[key]:JSON.stringify(old)});
 assert.match(g.app.innerHTML,/data-action="replay"/);
 g.click('replay');
 assert.match(g.app.innerHTML,/data-action="choose"/);
 g.click('choose',{n:'1'}); // correctness doesn't affect persisted completion either way
 assert.deepEqual(JSON.parse(g.data.get(key)),old,'Legacy saved Unit 5 progress unchanged');
}

console.log('Unified engine tests passed: six units, replay, XP safety, saved progress, content.');
