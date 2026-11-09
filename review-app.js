/* Word Quest v1.6 — student review UI.
 * Browser-local questions reused from the original six-unit content.
 * All review results go to wordquest_review_v1 only.
 */
(function(){
 'use strict';
 const core=window.WordQuestReviewCore, memory=window.WordQuestReviewMemory;
 const data=window.WordQuestReviewData, shell=window.WordQuestShell;
 const node=document.getElementById('review-root');
 if(!core||!memory||!data||!shell||!node)throw Error('Review dependencies missing');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
   '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
 })[c]);
 const all=data.candidates(localStorage),byId=new Map(all.map(x=>[x.id,x]));
 const args=new URLSearchParams(window.location.search);
 let mode=args.get('mode')==='mistakes'?'mistakes':'today';
 let stage='overview',currentId=null,zh=false,error='',rt=attempt();
 function attempt(){return {tries:0,hint:0,selected:[],wrongChoices:[],revealed:{},
   answer:false,result:null,busy:false};}
 function state(){return memory.read(localStorage);}
 function session(reviewState){
   return mode==='today'?reviewState.session:reviewState.mistakesSession;
 }
 function allowedSession(s){
   return s && s.kind===mode && Array.isArray(s.ids) &&
     Number.isInteger(s.cursor) && s.cursor>=0 && s.cursor<=s.ids.length;
 }
 function todaySession(s){
   return core.makeDailySession({candidates:all,cards:s.cards,now:new Date(),
     previous:s.session});
 }
 function summaryStats(s){
   const eligible=new Set(all.map(c=>c.id));
   const remembered=Object.entries(s.cards).filter(([id,card])=>
     eligible.has(id)&&card&&card.remembered).length;
   return {remembered,bonus:s.bonus.total,today:todaySession(s).ids.length-
     todaySession(s).cursor, mistakes:data.missed(all).length};
 }
 function wordText(en,cn,id){
   const spoken=esc(en||'');
   return `<div class="spoken-english"><div class="en" lang="en">`+spoken+
     `</div><button type="button" class="speak-sentence" data-speak-sentence="`+
     spoken+`" aria-label="Listen to English" aria-pressed="false">🔊</button></div>`+
     (!cn?'':(zh||rt.revealed[id]
       ?`<div class="cn" lang="zh-CN">`+esc(cn)+`</div>`
       :`<button class="tr" data-action="translate" data-id="`+esc(id)+
         `">译 · 查看中文</button>`));
 }
 function order(p){
   const list=p.options.map((_,i)=>i);
   let seed=(((p.unit*73856093)^((p.index+1)*19349663))>>>0)||1;
   for(let i=list.length-1;i>0;i--){
     seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
     const j=(seed>>>0)%(i+1);
     [list[i],list[j]]=[list[j],list[i]];
   }
   return list;
 }
 function options(p){
   return `<div class="options" role="group" aria-label="Answer choices">`+
     order(p).map((i,n)=>`<button type="button" class="option `+
       (rt.wrongChoices.includes(i)?'wrong':'')+
       `" data-action="choose" data-n="`+i+`" `+
       (rt.tries>=3||rt.wrongChoices.includes(i)?'disabled':'')+
       `><span class="choice-letter">`+'ABCDEF'[n]+
       `</span><span>`+esc(p.options[i])+`</span></button>`).join('')+
     `</div>`;
 }
 function build(p){
   const selected=rt.selected.map((idx,n)=>
     `<button type="button" class="answer-token" data-action="remove" data-n="`+
     n+`">`+esc(p.parts[idx])+` ×</button>`).join('');
   const parts=p.parts.map((part,i)=>`<button type="button" class="token `+
     (rt.selected.includes(i)?'selected':'')+`" data-action="part" data-n="`+i+
     `" `+(rt.selected.includes(i)||rt.tries>=3?'disabled':'')+`>`+esc(part)+
     `</button>`).join('');
   return `<div><div class="board" aria-label="Selected word parts">`+
     (selected||'<span class="empty">Tap word parts in order / 按顺序点击词块</span>')+
     `</div><div class="tokens">`+parts+`</div><div class="actions">`+
     `<button class="btn" data-action="check" `+(rt.tries>=3?'disabled':'')+
     `>Check the word</button><button class="btn ghost" data-action="clear">Clear</button>`+
     `</div></div>`;
 }
 function start(which){
   mode=which;error='';rt=attempt();currentId=null;
   const r=mode==='today'
     ?memory.startToday(localStorage,all,new Date())
     :memory.startMistakes(localStorage,all,new Date());
   if(!r.ok){error='Review progress cannot be saved ('+r.reason+
     '). Your existing mission scores are safe.';stage='overview';}
   else stage='session';
   draw();window.scrollTo({top:0,behavior:'smooth'});
 }
 function overview(s){
   const stats=summaryStats(s);
   return `<section class="panel pad review-landing"><h2>Keep your discoveries alive</h2>`+
     `<p class="footnote">Your mission XP and review progress are separate. Each review opens the question again.</p>`+
     `<div class="review-statgrid">`+
     `<div><strong>`+stats.today+`</strong><span>Today's words</span></div>`+
     `<div><strong>`+stats.remembered+`</strong><span>Remembered · 已记住</span></div>`+
     `<div><strong>`+stats.bonus+`</strong><span>Review XP</span></div></div>`+
     `<div class="review-start-grid"><div class="review-start-card"><h3>📅 Today's practice</h3>`+
     `<p>Up to five due words each local day. Unfinished words come first.</p>`+
     `<button class="btn" data-action="begin-today">`+
     (stats.today?'Start / Resume · '+stats.today:'View today’s practice')+
     `</button></div>`+
     `<div class="review-start-card"><h3>↺ Review my mistakes</h3>`+
     `<p>Retry completed missions that once had wrong answers. Your old XP never changes.</p>`+
     `<button class="btn alt" data-action="begin-mistakes">Review mistakes · `+
     stats.mistakes+`</button></div></div>`+
     `<p class="sidefoot">Remembered means you recalled a word on a later day without a hint and FSRS estimates ≥ 7-day stability. It can change after mistakes.</p>`+
     `</section>`;
 }
 function current(s){
   if(!allowedSession(s))return `<section class="panel pad"><h2>No review session</h2>`+
     `<p>Select a practice mode to begin.</p><button class="btn" data-action="exit">Review menu</button></section>`;
   if(s.cursor>=s.ids.length){
     const completed=s.results.length;
     return `<section class="panel pad review-finish"><h2>🏆 Review finished</h2>`+
       `<p>`+(completed?esc(completed)+' activities completed.':'Nothing is due right now. / 今天没有待复习的词。')+
       `</p><p class="footnote">You can return tomorrow for spaced practice. Mission XP is unchanged.</p>`+
       `<div class="actions"><button class="btn" data-action="exit">Review overview</button>`+
       `<a class="btn ghost" href="index.html">All units</a></div></section>`;
   }
   const id=s.ids[s.cursor],p=data.mission(id),candidate=byId.get(id);
   if(!p||!candidate) return `<section class="panel pad"><h2>Content changed</h2>`+
     `<p>Review item is no longer available. Your saved data was not overwritten.</p>`+
     `<button class="btn" data-action="exit">Review overview</button></section>`;
   if(currentId!==id){rt=attempt();currentId=id;}
   return question(p,candidate,s);
 }
 function question(p,c,s){
   const info=`<div class="review-step"><span>`+
     (mode==='today'?"📅 Today's practice":"↺ Review my mistakes")+
     `</span><span>`+(s.cursor+1)+` / `+s.ids.length+
     `</span></div><div class="review-progress"><div style="width:`+
     Math.round(100*s.cursor/s.ids.length)+`%"></div></div>`;
   const clue=rt.hint?`<div class="hints"><div class="label">CLUE `+rt.hint+
     `</div>`+wordText(p.hints[rt.hint-1],p.hintsZh[rt.hint-1],'hint')+
     `</div>`:'';
   const warning=rt.tries?`<div class="warn" role="status">`+
     (rt.tries>=3?'Three tries used. Reveal the answer to continue.':'Not quite. Try again or use a clue.')+
     `</div>`:'';
   return `<section class="panel pad">`+info+
     `<div class="stage-title"><div class="eyebrow">UNIT `+p.unit+` · MISSION `+
     (p.index+1)+`</div><span class="pill">Review · no Mission XP</span></div>`+
     `<h2 class="mission-title">`+esc(p.title)+`</h2>`+
     (zh&&p.titleZh?`<div class="cn-title" lang="zh-CN">`+esc(p.titleZh)+`</div>`:'')+
     `<div class="story"><div class="label">YOUR MISSION</div>`+
     wordText(p.scene,p.sceneZh,'scene')+`</div>`+
     `<div class="question"><div class="label">YOUR QUESTION</div>`+
     wordText(p.question,p.questionZh,'question')+`</div>`+
     (p.mode==='build'?build(p):options(p))+warning+
     `<div class="actions"><button class="btn alt" data-action="hint" `+
     (rt.hint>=2?'disabled':'')+`>💡 `+
     (rt.hint===0?'Give me a clue':rt.hint===1?'Another clue':'Clues unlocked')+
     `</button>`+
     (rt.tries>=3?`<button class="btn" data-action="reveal">Reveal solution</button>`:'')+
     `</div>`+clue+
     `<div class="divider"></div><div class="actions">`+
     `<button class="btn ghost small" data-action="zh">`+
     (zh?'中文辅助 ON':'中文辅助 OFF')+`</button>`+
     `<button class="btn ghost small" data-action="exit">Save & exit</button>`+
     `</div></section>`;
 }
 function solved(){
   const p=data.mission(currentId),r=rt.result;
   if(!p||!r)return '';
   const notice=r.practiceOnly?
     `<p class="review-note">Same-day retry: practice completed, without an additional FSRS rating.</p>`:
     `<p class="review-note">FSRS result: `+esc(r.rating)+
       `. Next review is scheduled automatically.</p>`;
   return `<section class="panel pad"><h2>✓ Discovery reviewed</h2>`+
     notice+
     (r.earnedReviewXP?`<p class="review-bonus">✦ +`+r.earnedReviewXP+
       ` Review XP — a one-time earn-back bonus!</p>`:'')+
     `<h3 class="mission-title">`+esc(p.word)+`</h3>`+
     `<div class="label">Explanation · 解题解释</div>`+
     wordText(p.explain,p.explainZh,'explained')+
     (p.connection?`<div class="storynote"><div class="note-title">HOW IT WORKS</div>`+
       wordText(p.connection,p.connectionZh,'connection')+`</div>`:'')+
     (p.formation?`<div class="storynote"><div class="note-title">Word formation</div>`+
       wordText(p.formation,p.formationZh,'formation')+`</div>`:'')+
     (p.grammar?`<div class="storynote"><div class="note-title">Grammar</div>`+
       wordText(p.grammar,p.grammarZh,'grammar')+`</div>`:'')+
     (p.history?`<div class="storynote"><div class="note-title">Word discovery</div>`+
       wordText(p.history,p.historyZh,'history')+`</div>`:'')+
     `<div class="actions"><button class="btn" data-action="next">Next review →</button>`+
     `<a class="btn ghost" href="unit`+p.unit+`.html">Unit `+p.unit+`</a></div>`+
     `</section>`;
 }
 function draw(){
   const loaded=state();
   const body=!loaded.ok?
     `<section class="panel pad"><h2>Review storage unavailable</h2><p>`+
     esc(loaded.reason)+`. We will not overwrite it. Existing mission progress is safe.</p>`+
     `<a href="index.html">Return to units</a></section>`:
     stage==='overview'?overview(loaded.state):
       stage==='solved'?solved():current(session(loaded.state));
   node.innerHTML=`<main class="container wq-page review-page">`+
     shell.header({home:true})+
     `<section class="review-banner"><span class="eyebrow">WORD QUEST · REVIEW LAB</span>`+
     `<h1>Today's practice · 每日复习</h1><p>Small steps, stronger memory.</p></section>`+
     (error?`<div class="warn" role="alert">`+esc(error)+`</div>`:'')+
     body+shell.footer()+`</main>`;
   document.title='Word Quest · Review';
 }
 function submit(revealed){
   if(rt.answer||rt.busy)return;
   const p=data.mission(currentId),candidate=byId.get(currentId),loaded=state();
   if(!p||!candidate||!loaded.ok){error='Review data unavailable.';draw();return;}
   const s=session(loaded.state);
   if(!allowedSession(s)||s.ids[s.cursor]!==currentId){error='Session changed in another tab. Reload to continue.';draw();return;}
   rt.busy=true;
   const attemptId=(mode==='today'?'today:'+s.day:'mistakes:'+s.token)+
     ':'+s.cursor+':'+currentId;
   const outcome=memory.recordReview(localStorage,{...candidate,finished:true,
     correct:!revealed,revealed,wrongCount:rt.tries,hintsUsed:rt.hint,
     attemptId,mode},new Date());
   rt.busy=false;
   if(!outcome.ok||!outcome.saved){
     error='Could not save review ('+(outcome.reason||'unknown')+
       '). Nothing was marked complete. Reload if this tab is outdated.';
     draw();return;
   }
   rt.answer=true;rt.result=outcome;stage='solved';error='';draw();
 }
 function checkBuild(p){
   const parts=rt.selected.map(i=>p.parts[i]);
   return p.answerParts?
     JSON.stringify(parts)===JSON.stringify(p.answerParts):
     parts.join('').replace(/\s+/g,'').toLowerCase()===
       p.word.replace(/\s+/g,'').toLowerCase();
 }
 function wrong(){
   if(rt.tries>=3)return;
   rt.tries++;rt.selected=[];draw();
 }
 node.addEventListener('click',event=>{
   const b=event.target.closest('[data-action]');if(!b)return;
   const action=b.dataset.action,idx=Number(b.dataset.n);
   if(action==='begin-today'){start('today');return;}
   if(action==='begin-mistakes'){start('mistakes');return;}
   if(action==='exit'){stage='overview';currentId=null;rt=attempt();error='';draw();return;}
   if(action==='next'){stage='session';currentId=null;rt=attempt();draw();return;}
   if(action==='zh'){zh=!zh;draw();return;}
   if(action==='translate'){
     rt.revealed[b.dataset.id]=!rt.revealed[b.dataset.id];draw();return;
   }
   if(stage!=='session'||rt.answer||rt.busy)return;
   const p=data.mission(currentId);if(!p)return;
   if(action==='hint'){rt.hint=Math.min(2,rt.hint+1);draw();return;}
   if(action==='choose'){
     if(p.mode!=='choice'||!Number.isInteger(idx)||idx<0||
       idx>=p.options.length||rt.tries>=3||rt.wrongChoices.includes(idx))return;
     if(idx===p.answer)submit(false);
     else {rt.wrongChoices.push(idx);wrong();}
     return;
   }
   if(action==='part'){
     if(p.mode==='build'&&Number.isInteger(idx)&&idx>=0&&idx<p.parts.length&&
       !rt.selected.includes(idx)&&rt.tries<3){rt.selected.push(idx);draw();}
     return;
   }
   if(action==='remove'&&Number.isInteger(idx)&&idx>=0&&idx<rt.selected.length){
     rt.selected.splice(idx,1);draw();return;
   }
   if(action==='clear'){rt.selected=[];draw();return;}
   if(action==='check'&&p.mode==='build'&&rt.selected.length&&rt.tries<3){
     if(checkBuild(p))submit(false);else wrong();return;
   }
   if(action==='reveal'&&rt.tries>=3)submit(true);
 });
 if(args.get('auto')==='1')start(mode);else draw();
})();
