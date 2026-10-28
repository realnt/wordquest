/* Validate every Word Quest puzzle and glossary without external dependencies. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};
vm.createContext(ctx);
vm.runInContext(read('content.js'),ctx);
vm.runInContext(read('unit1-data.js'),ctx);

const special=ctx.window.WordQuestUnit1;
const shared=ctx.window.WORDQUEST_CONTENT;
const normalize=s=>String(s).replace(/\s+/g,'').toLowerCase();
function reachable(target,parts){
 const expected=normalize(target);
 function search(word,left){
   if(word===expected)return true;
   if(word.length>=expected.length||!expected.startsWith(word))return false;
   return left.some((part,i)=>search(word+normalize(part),left.filter((_,j)=>j!==i)));
 }
 return search('',parts);
}
let checked=0,builds=0,choices=0;
for(let unit=1;unit<=6;unit++){
 const puzzles=unit===1?special.missions:shared.missions[unit];
 const glossary=unit===1?Object.values(special.glossary).flat():shared.glossaries[unit];
 assert.ok(Array.isArray(glossary)&&glossary.length>0,'Missing Unit '+unit+' glossary');
 assert.ok(puzzles.length>0,'Missing Unit '+unit+' missions');
 for(const [word,zh] of glossary){
   assert.ok(String(word).trim()&&String(zh).trim(),'Empty glossary entry in Unit '+unit);
 }
 for(let i=0;i<puzzles.length;i++){
   const m=puzzles[i],context='Unit '+unit+' mission '+(i+1);
   assert.ok(m.word&&m.title&&m.scene&&m.question&&m.explain,context+' missing text');
   const hints=unit===1?m.hint:m.hints;
   assert.ok(Array.isArray(hints)&&hints.length>=2&&hints.every(x=>x?.trim()),context+' invalid clues');
   const translated=unit===1?special.missionTranslations[i]:m;
   assert.ok(translated?.titleZh&&translated?.sceneZh&&translated?.questionZh,context+' missing Chinese');
   assert.ok(translated?.explainZh&&translated.hintsZh?.length>=2,context+' missing translated explanation');
   const mode=unit===1?m.type:m.mode;
   if(mode==='choice'){
     assert.ok(Array.isArray(m.options)&&m.options.length>=2,context+' empty choices');
     assert.ok(Number.isInteger(m.answer)&&m.answer>=0&&m.answer<m.options.length,context+' invalid answer');
     choices++;
   }else if(mode==='build'){
     const parts=unit===1?m.tokens:m.parts;
     assert.ok(parts?.length>=2,context+' missing parts');
     if(unit===1){
       assert.ok(Array.isArray(m.answer)&&m.answer.every(answer=>parts.includes(answer)),
         context+' impossible Unit 1 parts');
     }else assert.ok(reachable(m.word,parts),context+' has no correct build path');
     builds++;
   }else assert.fail(context+' unknown mission mode: '+mode);
   checked++;
 }
}
assert.equal(checked,109,'Unexpected total mission count');
assert.equal(builds+choices,checked);
assert.equal(special.missions.length,23);
assert.equal(special.missionTranslations.length,23);
assert.equal(special.originExtras.length,23);
console.log('Content checks passed:',checked,'missions,',builds,'word builds,',choices,'choices.');

/* v1.5.3: Chinese question and scene text must not contain the Chinese gloss of the answer for U2 M10 (preparation → 准备). */
{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  const ctx={window:{}};vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','content.js'),'utf8'),ctx);
  const m=ctx.window.WORDQUEST_CONTENT.missions[2][9];
  if(m.word!=='preparation')throw new Error('Unit 2 mission 10 is expected to be PREPARATION');
  for(const field of ['questionZh','sceneZh'])
    if(String(m[field]).includes('准备'))throw new Error('Unit 2 mission 10 '+field+' reveals the answer (准备)');
  console.log('Spoiler check passed: Unit 2 mission 10 Chinese text does not reveal the answer.');
}

/* v1.5.4 (#16): answer integrity and no spoilers in mission titles, across all six units. */
{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  const ctx={window:{}};vm.createContext(ctx);
  for(const f of ['content.js','unit1-data.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
  const D=ctx.window.WORDQUEST_CONTENT,U=ctx.window.WordQuestUnit1,all=[];
  U.missions.forEach((m,i)=>all.push({tag:'U1 M'+(i+1),word:m.word,title:m.title,titleZh:U.missionTranslations[i].titleZh,options:m.options,answer:m.answer}));
  for(let u=2;u<=6;u++)D.missions[u].forEach((m,i)=>all.push({...m,tag:'U'+u+' M'+(i+1)}));
  // Missions whose correct option legitimately differs from the target word (inflection, or the question asks for a meaning).
  const optionExceptions=new Set(['U4 M15','U6 M6']);
  // U6 M6 asks what BANK means, so naming the word in the title is intended.
  const titleExceptions=new Set(['U6 M6']);
  const norm=s=>String(s).toLowerCase().replace(/^(a|an|the) /,'');
  let checked=0;
  for(const m of all){
    if(m.options){
      if(new Set(m.options.map(norm)).size!==m.options.length)throw new Error(m.tag+': options must be unique');
      if(!Number.isInteger(m.answer)||m.answer<0||m.answer>=m.options.length)throw new Error(m.tag+': answer index out of range');
      if(!m.word.includes('/')&&!optionExceptions.has(m.tag)&&!norm(m.options[m.answer]).includes(norm(m.word)))
        throw new Error(m.tag+': answer index points to "'+m.options[m.answer]+'", not the target word "'+m.word+'"');
      checked++;
    }
    if(!titleExceptions.has(m.tag)){
      const parts=m.word.toLowerCase().split(/[ \/]+/).filter(p=>p.length>3);
      for(const t of [m.title,m.titleZh])
        if(t&&parts.some(p=>t.toLowerCase().includes(p)))throw new Error(m.tag+': title "'+t+'" gives away the answer');
    }
  }
  console.log('Answer-integrity checks passed: '+checked+' missions with options (77 multiple-choice + 21 word-building in Units 2–6) point to their target word; no English title reveals its answer.');
}

/* v1.5.4 (#16, review on PR #21): Chinese text must not spoil the answer with its textbook gloss.
   Titles: no exceptions. Questions/scenes: only where the English text already gives the same
   meaning, or where the match is accidental. Each exception states why. */
{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  const ctx={window:{}};vm.createContext(ctx);
  for(const f of ['content.js','unit1-data.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
  const D=ctx.window.WORDQUEST_CONTENT,U=ctx.window.WordQuestUnit1,all=[];
  const g1=Object.values(U.glossary).flat();
  U.missions.forEach((m,i)=>all.push({...U.missionTranslations[i],word:m.word,tag:'U1 M'+(i+1),gl:g1}));
  for(let u=2;u<=6;u++)D.missions[u].forEach((m,i)=>all.push({...m,tag:'U'+u+' M'+(i+1),gl:D.glossaries[u]}));
  const allowed={
    'U1 M6 questionZh':'名词 is a grammar label from the gloss note, not the meaning',
    'U1 M12 questionZh':'English question itself gives the meaning ("not possible")',
    'U4 M12 sceneZh':'English scene itself says "medical services"',
    'U4 M14 questionZh':'English question itself names both meanings',
    'U4 M14 sceneZh':'English scene itself says "studies the words again"',
    'U5 M4 sceneZh':'accidental substring: 指导 + 演员, not 导演',
    'U5 M5 questionZh':'制作 (making) is generic, as in the English "process"',
    'U5 M14 sceneZh':'English scene itself says "comes back"',
    'U6 M14 questionZh':'English question itself gives the meaning ("supply")',
    'U6 M18 questionZh':'English question itself gives the meaning ("most important")'
  };
  let checked=0;const used=new Set();
  for(const m of all){
    const words=m.word.toLowerCase().split(/\s*\/\s*/),segs=new Set();
    for(const [w,z] of m.gl){const lw=w.toLowerCase();
      if(words.some(x=>lw===x||lw.split(/\s*\/\s*/).includes(x)))
        for(const s of String(z).split(/[；;，,、（）()]/))if(s.trim().length>=2)segs.add(s.trim());}
    if(!segs.size)continue;checked++;
    for(const f of ['titleZh','questionZh','sceneZh']){
      const hit=[...segs].filter(s=>String(m[f]||'').includes(s));
      if(!hit.length)continue;
      const key=m.tag+' '+f;
      if(f!=='titleZh'&&allowed[key]){used.add(key);continue;}
      throw new Error(key+' contains the Chinese meaning of the answer ('+hit.join(', ')+'): '+m[f]);
    }
  }
  for(const key of Object.keys(allowed))if(!used.has(key))throw new Error('Stale Chinese-spoiler exception, remove it: '+key);
  console.log('Chinese spoiler checks passed: '+checked+' missions checked against their textbook glosses; '+used.size+' documented exceptions.');
}
