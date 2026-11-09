/* Read-only Today badge across homepage, all six units and review page. */
(function(){
 'use strict';
 const core=window.WordQuestReviewCore,data=window.WordQuestReviewData;
 if(!core||!data)return;
 function count(){
   const candidates=data.candidates(localStorage);
   const present=new Set(candidates.map(c=>c.id));
   let cards={},previous=null;
   try{
     const raw=JSON.parse(localStorage.getItem(core.REVIEW_KEY)||'null');
     if(raw&&raw.schema===core.SCHEMA&&raw.cards&&
        typeof raw.cards==='object'&&!Array.isArray(raw.cards)){
       cards=raw.cards;previous=raw.session;
     }
   }catch(_){}
   const s=core.makeDailySession({candidates,cards,now:new Date(),previous});
   return s.ids.slice(s.cursor).filter(id=>present.has(id)).length;
 }
 function render(){
   const fields=document.querySelectorAll('[data-review-count]');
   if(!fields.length)return;
   let n;
   try{n=count();}catch(_){return;}
   for(const el of fields){
     const str=String(n);
     if(el.textContent!==str)el.textContent=str;
     const a=el.closest('a');
     if(a)a.setAttribute('aria-label',"Today's practice: "+n+" words due");
   }
 }
 function setup(){
   render();
   const host=document.getElementById('root')||document.body;
   if(typeof MutationObserver!=='undefined')
     new MutationObserver(render).observe(host,{subtree:true,childList:true});
 }
 if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
