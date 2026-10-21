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
