/* Shared, read-only review inventory. Never edits mission content or progress. */
(function(root,factory){
 'use strict';
 const api=factory(root.WordQuestReviewCore,root.WORDQUEST_CONTENT,root.WordQuestUnit1);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WordQuestReviewData=api;
})(typeof globalThis==='object'?globalThis:this,function(core,content,unit1){
 'use strict';
 if(!core||!content||!unit1)throw Error('Review data and six units are required');
 const units=[1,2,3,4,5,6];
 function puzzles(unit){
   return unit===1?unit1.missions:content.missions[unit];
 }
 function key(unit){
   return unit===1?'wordquest_g7u1_v1':'wordquest_g7u'+unit+'_semester_v1';
 }
 function raw(storage,unit){
   try{return storage.getItem(key(unit));}catch(_){return null;}
 }
 function candidates(storage){
   const all=[];
   for(const unit of units){
     all.push(...core.missionCandidates(unit,raw(storage,unit),puzzles(unit)));
   }
   return all;
 }
 function mission(id){
   const match=/^u([1-6]):m(0|[1-9]\d*)$/.exec(String(id));
   if(!match)return null;
   const unit=Number(match[1]),index=Number(match[2]);
   const m=puzzles(unit)[index];
   if(!m)return null;
   if(unit===1){
     const z=unit1.missionTranslations[index],kind=unit1.originMeta[index];
     const history=unit1.originExtras[index];
     return {id,unit,index,word:m.word,title:m.title,titleZh:z.titleZh,
       scene:m.scene,sceneZh:z.sceneZh,question:m.question,questionZh:z.questionZh,
       mode:m.type==='build'?'build':'choice',options:m.options||[],
       answer:m.type==='choice'?m.answer:null,parts:m.tokens||[],
       answerParts:m.type==='build'?m.answer:null,
       hints:m.hint,hintsZh:z.hintsZh,explain:m.explain,explainZh:z.explainZh,
       connection:m.origin,connectionZh:z.originZh,tag:kind.kind,
       formation:z.formation,formationZh:z.formationZh,
       grammar:z.grammar,grammarZh:z.grammarZh,
       history:history.en,historyZh:history.zh,url:m.url,
       chapter:m.ch,icon:m.icon};
   }
   return {id,unit,index,word:m.word,title:m.title,titleZh:m.titleZh,
     scene:m.scene,sceneZh:m.sceneZh,question:m.question,questionZh:m.questionZh,
     mode:m.mode,options:m.options||[],answer:m.answer,
     parts:m.parts||[],answerParts:m.answerParts||null,
     hints:m.hints,hintsZh:m.hintsZh,explain:m.explain,explainZh:m.explainZh,
     connection:m.connection,connectionZh:m.connectionZh,tag:m.tag,
     formation:m.formation,formationZh:m.formationZh,
     grammar:m.grammar,grammarZh:m.grammarZh,
     history:m.history,historyZh:m.historyZh,url:m.url,
     chapter:m.chapter,icon:m.icon};
 }
 function missed(candidatesList){
   return candidatesList.filter(c=>c.misses>0).sort((a,b)=>b.misses-a.misses||a.id.localeCompare(b.id));
 }
 return Object.freeze({key,candidates,mission,missed});
});
