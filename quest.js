(function(){'use strict';
const DATA=window.WORDQUEST_CONTENT;
const unit=Number(document.body.dataset.unit);
const first=unit===1;
const special=first?window.WordQuestUnit1:null;
if(first&&!special)throw Error('Unit 1 content failed to load');
const info=first?{
  title:'Trying New Things',tagline:"The Inventor's Lab",
  focus:'Explore new clubs. Build words. Fix solar inventions. Discover surprising word histories.',
  focusZh:'探索新社团、拼装单词、修复太阳能发明、发现词语背后的历史。',
  theme:'Word building · word histories',source:'2024 Grade 7 Unit 1 word list'
}:DATA.meta[unit];
const puzzles=first?special.missions.map((m,i)=>{
  const translation=special.missionTranslations[i];
  return {
    word:m.word,title:m.title,titleZh:translation.titleZh,
    scene:m.scene,sceneZh:translation.sceneZh,
    question:m.question,questionZh:translation.questionZh,
    options:m.options,answer:m.type==='choice'?m.answer:undefined,
    mode:m.type==='build'?'build':'choice',parts:m.tokens,answerParts:m.type==='build'?m.answer:null,
    hints:m.hint,hintsZh:translation.hintsZh,
    explain:m.explain,explainZh:translation.explainZh,
    connection:m.origin,connectionZh:translation.originZh,
    tag:special.originMeta[i].kind,
    history:special.originExtras[i].en,historyZh:special.originExtras[i].zh,
    formation:translation.formation,formationZh:translation.formationZh,
    grammar:translation.grammar,grammarZh:translation.grammarZh,
    url:m.url,chapter:m.ch,icon:m.icon
  };
}):DATA.missions[unit];
const glossary=first?Object.values(special.glossary).flat():DATA.glossaries[String(unit)];
const KEY=first?'wordquest_g7u1_v1':'wordquest_g7u'+unit+'_semester_v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults=()=>({current:0,unlocked:0,completed:{},mistakes:{},points:0,zh:false,tab:'play'});
const audioIcon='🔊';
const sentenceSpeak=text=>'<button type="button" class="speak-sentence" data-speak-sentence="'+esc(text)+'" aria-label="Listen to English" aria-pressed="false" title="Listen to English">'+audioIcon+'</button>';
const vaultSpeak=w=>'<button type="button" class="speak-word" data-speak-word="'+esc(w)+'" aria-label="Hear pronunciation" aria-pressed="false" title="Hear pronunciation">'+audioIcon+'</button>';

let state=defaults();
let originalFirstState={};
try{
 const v=JSON.parse(localStorage.getItem(KEY)||'null');
 if(v&&typeof v==='object'&&!Array.isArray(v)){
   if(first){
     originalFirstState=v;
     state={...state,
       current:v.current,unlocked:v.maxUnlocked,completed:v.earned||{},
       mistakes:v.misses||{},points:v.score||0,zh:Boolean(v.zh),
       tab:v.view==='result'?'results':v.view||'play'};
   }else state={...state,...v};
 }
}catch(e){}
state.unlocked=Math.max(0,Math.min(puzzles.length,state.unlocked||0));
state.current=Math.max(0,Math.min(puzzles.length-1,state.current||0));
let rt={hint:0,tries:0,selected:[],wrong:-1,answer:false,revealed:{},query:'',mode:'all'};
const $=document.getElementById('root');
function store(){
 try{
   if(first){
     const legacy={...originalFirstState,
       current:state.current,maxUnlocked:state.unlocked,earned:state.completed,
       misses:state.mistakes,score:state.points,view:state.tab==='results'?'result':state.tab,
       zh:state.zh};
     localStorage.setItem(KEY,JSON.stringify(legacy));
     originalFirstState=legacy;
   }else localStorage.setItem(KEY,JSON.stringify(state));
 }catch(e){}
}
function completeCount(){return Object.keys(state.completed).length}
function progress(){return Math.round(100*completeCount()/puzzles.length)}
function wordText(en,zh,id){
 const visible=state.zh||rt.revealed[id];
 const english=`<div class="spoken-english"><div class="en" lang="en">${esc(en)}</div>${sentenceSpeak(en)}</div>`;
 return english+(zh?(visible?`<div class="cn" lang="zh-CN">${esc(zh)}</div>`:
   `<button class="tr" data-action="translate" data-id="${esc(id)}">译 · 查看中文</button>`):'');
}
function header(){return window.WordQuestShell.header({unit,active:state.tab,chinese:first&&state.zh})}
function hero(){return `<section class="hero"><div class="mobile-summary"><div class="mobile-summary-head"><div class="mobile-summary-text"><div class="mobile-summary-kicker">GRADE 7 · UNIT ${unit}</div><div class="mobile-summary-title">${esc(info.title)}</div></div><span class="mobile-summary-xp">✦ ${state.points} XP</span></div><div class="mobile-summary-progress"><div class="mobile-summary-track" role="progressbar" aria-label="Completed missions" aria-valuemin="0" aria-valuemax="${puzzles.length}" aria-valuenow="${completeCount()}"><div class="mobile-summary-fill" style="width:${progress()}%"></div></div><span class="mobile-summary-count">${completeCount()} / ${puzzles.length}</span></div></div><div class="kicker">Shanghai Five-Four System · Grade 7 · Unit ${unit}</div><h1>${esc(info.title)}</h1><div class="subtitle">${esc(info.tagline)}</div><p>${esc(info.focus)}</p>${state.zh?`<p style="font-size:12px">${esc(info.focusZh)}</p>`:''}<div class="stats"><div class="stat"><span>Missions</span>${completeCount()} / ${puzzles.length}</div><div class="stat"><span>Experience</span>${state.points} XP</div><div class="stat"><span>Word Vault</span>${glossary.length} textbook entries</div></div></section>`}
function side(){let start=Math.max(0,Math.min(puzzles.length-8,state.current-3));return `<aside class="sidebar"><section class="panel sidepad"><h3>Your progress · 学习进度</h3><div class="progressbar"><div style="width:${progress()}%"></div></div><div class="progress-row">${completeCount()} / ${puzzles.length} missions finished · ${progress()}%</div><div class="divider"></div><div class="list">${puzzles.slice(start,start+8).map((p,j)=>{const n=start+j;return `<button class="mission-link ${state.current===n?'current':''}" ${n>state.unlocked?'disabled':''} data-action="jump" data-n="${n}"><span>${state.completed[n]!==undefined?'✓':n>state.unlocked?'🔒':'▶'}</span><strong>${esc(p.title)}</strong><small>${n+1}</small></button>`}).join('')}</div><p class="sidefoot">You can replay any unlocked mission. Each unit saves progress independently in this browser.</p></section><section class="panel sidepad"><h3>Learning controls · 学习设置</h3><button class="btn ${state.zh?'':'ghost'} small" data-action="zh">${state.zh?'🇨🇳 中文辅助 ON':'🇬🇧 中文辅助 OFF'}</button><p class="sidefoot">English first. Chinese is available for the story, question, hints and explanation. Answers stay in English.</p><div class="divider"></div><details class="guide"><summary>Word Origin Language Guide</summary><p><b>can be traced back to</b><span>可追溯到 · historical evidence</span></p><p><b>entered English through</b><span>经由……传入英语 · borrowing route</span></p><p><b>formed from</b><span>由……构成 · word formation</span></p><p><b>shares a common origin with</b><span>与……同源 · related etymology</span></p></details></section></aside>`}
function choices(p){return `<div class="options" role="group" aria-label="Answer choices">${p.options.map((o,i)=>`<button class="option ${rt.answer&&i===p.answer?'correct':rt.wrong===i?'wrong':''}" data-action="choose" data-n="${i}" ${rt.answer||rt.tries>=3?'disabled':''}><span class="choice-letter">${'ABCDEF'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`}
function build(p){return `<div><div class="board" aria-label="Selected word parts">${rt.selected.length?rt.selected.map((i,j)=>`<button class="answer-token" data-action="remove" data-n="${j}" title="Remove this part">${esc(p.parts[i])} ×</button>`).join(''):'<span class="empty">Tap word parts in order / 按顺序点击词块</span>'}</div><div class="tokens">${p.parts.map((part,i)=>`<button class="token ${rt.selected.includes(i)?'selected':''}" data-action="part" data-n="${i}" ${rt.answer||rt.tries>=3||rt.selected.includes(i)?'disabled':''}>${esc(part)}</button>`).join('')}</div><div class="actions"><button class="btn" data-action="check" ${rt.answer||rt.tries>=3?'disabled':''}>Check the word</button><button class="btn ghost" data-action="clear" ${rt.answer?'disabled':''}>Clear</button></div></div>`}
function solved(p){return `<div class="feedback" role="status"><h3>${rt.tries>=3?'🔍 Solution unlocked':'✓ Discovery unlocked!'}</h3><p class="explanation"><strong>${esc(p.word)}</strong> · ${rt.tries>=3?'Learn from this example.':'Nice reasoning.'}</p><div class="label" style="margin-top:15px">Explanation · 答题解释</div>${wordText(p.explain,p.explainZh,'exp')}<div class="storynote"><div class="note-title">✧ ${esc(p.tag.toUpperCase())} · HOW IT WORKS</div>${wordText(p.connection,p.connectionZh,'connection')}</div><div class="actions"><button class="btn" data-action="next">${state.current===puzzles.length-1?'See my results':'Next mission →'}</button><button class="btn ghost" data-action="replay">Replay</button></div></div>`}
function play(){const p=puzzles[state.current],n=state.current;const passed=state.completed[n]!==undefined;const answerVisible=rt.answer||passed;return `<section class="panel pad"><div class="stage-title"><div class="eyebrow">MISSION ${n+1} / ${puzzles.length}</div><span class="pill">${esc(info.theme)}</span></div><h2 class="mission-title">${esc(p.title)}</h2>${state.zh?`<div class="cn-title">${esc(p.titleZh)}</div>`:''}<div class="story"><div class="label">YOUR MISSION ${state.zh?'· 任务背景':''}</div>${wordText(p.scene,p.sceneZh,'scene')}</div><div style="margin-top:19px"><div class="label">YOUR QUESTION ${state.zh?'· 任务问题':''}</div><div class="question">${wordText(p.question,p.questionZh,'question')}</div></div>${!answerVisible?(p.mode==='build'?build(p):choices(p)):''}${rt.tries>0&&!answerVisible?`<div class="warn" role="status">${rt.tries>=3?'Three tries used. Reveal the answer to learn from it.':'Not quite. Try again or use a clue.'}${state.zh?'<div class="cn" style="border:0;padding-left:0">答案还不对。可以使用提示；尝试三次后可查看正确解法。</div>':''}</div>`:''}${!answerVisible?`<div class="actions"><button class="btn alt" data-action="hint" ${rt.hint>=2?'disabled':''}>💡 ${rt.hint===0?'Give me a clue':rt.hint===1?'Another clue':'Clues unlocked'}</button>${rt.tries>=3?'<button class="btn" data-action="reveal">Reveal solution</button>':''}</div>${rt.hint?`<div class="hints"><div class="label">CLUE ${rt.hint}</div>${wordText(p.hints[rt.hint-1],p.hintsZh[rt.hint-1],'hint')}</div>`:''}`:solved(p)}<div class="divider"></div><div class="actions"><button class="btn ghost small" data-action="view" data-view="map">🗺️ All missions</button><button class="btn ghost small" data-action="zh">${state.zh?'中文辅助 ON':'中文辅助 OFF'}</button></div></section>`}
function map(){return `<section class="panel pad"><div class="row"><h2 style="margin:0">Mission map · 闯关地图</h2><span class="pill">${completeCount()}/${puzzles.length}</span></div><p class="footnote">Solve missions in order. Finished missions can be replayed. / 按顺序通关，已完成的任务可以重玩。</p><div class="mapgrid" style="margin-top:16px">${puzzles.map((p,i)=>`<button class="maptile ${state.current===i?'current':''}" data-action="jump" data-n="${i}" ${i>state.unlocked?'disabled':''}><span class="pill">${state.completed[i]!==undefined?'✓ Completed':i>state.unlocked?'🔒 Locked':'▶ Available'} · ${i+1}</span><b>${esc(p.title)}</b><small>${esc(p.word)}</small></button>`).join('')}</div><div class="divider"></div><button class="btn ghost" data-action="restart">Restart this unit / 重置本单元</button></section>`}
function vault(){const q=rt.query.trim().toLowerCase();const results=glossary.filter(([w,z])=>!q||`${w} ${z}`.toLowerCase().includes(q));return `<section class="panel pad"><div class="row"><h2 style="margin:0">Word Vault · Unit ${unit}</h2><span class="pill">${glossary.length} entries</span></div><p class="footnote">Textbook vocabulary, not all independent missions. Verified against the unit word list (${info.source}). Units use selected words in original scenarios, and some explanations contain related expansion words.</p><input type="search" class="search" id="search" placeholder="Search textbook words or Chinese meanings..." value="${esc(rt.query)}" aria-label="Search vocabulary"><div class="vaultgrid" id="vault-results">${results.map(([w,z])=>`<div class="vword"><div class="vault-pron-row"><b lang="en">${esc(w)}</b>${vaultSpeak(w)}</div><small>${esc(z)}</small></div>`).join('')||'<p>No matches.</p>'}</div></section>`}
function results(){const missed=Object.keys(state.mistakes).map(Number).filter(x=>state.mistakes[x]>0);return `<section class="panel pad"><div class="success-banner"><div style="font-size:57px">🏆</div><div class="eyebrow">UNIT ${unit} COMPLETE</div><h2>You're a Word Explorer!</h2><p>${puzzles.length} missions completed. / 本单元 ${puzzles.length} 关完成。</p><div class="stats" style="justify-content:center"><div class="pill">⭐ ${state.points} XP</div><div class="pill">✓ ${completeCount()} solved</div><div class="pill">📖 ${glossary.length} textbook terms</div></div></div><div class="divider"></div><h3>Words to revisit · 值得复习</h3>${missed.length?`<div class="recap">${missed.map(n=>`<button class="btn ghost small" data-action="jump" data-n="${n}">${esc(puzzles[n].word)} ↺</button>`).join('')}</div>`:'<p class="footnote">No mistakes recorded. Try again with fewer clues!</p>'}<div class="actions"><a class="btn" href="index.html">Explore other units</a><button class="btn alt" data-action="view" data-view="map">Replay missions</button><button class="btn ghost" data-action="view" data-view="vault">Open vocabulary</button></div></section>`}
function draw(){document.title='Word Quest · Unit '+unit+' · '+info.title;$.innerHTML=`<main class="container wq-page">${header()}${hero()}<div class="main-grid"><div>${state.tab==='vault'?vault():state.tab==='map'?map():state.tab==='results'?results():play()}</div>${side()}</div>${window.WordQuestShell.footer()}</main>`;
 if(state.tab==='vault'){const input=$.querySelector('#search');input.addEventListener('input',()=>{rt.query=input.value;let results=glossary.filter(([w,z])=>`${w} ${z}`.toLowerCase().includes(rt.query.trim().toLowerCase()));$.querySelector('#vault-results').innerHTML=results.map(([w,z])=>`<div class="vword"><div class="vault-pron-row"><b lang="en">${esc(w)}</b>${vaultSpeak(w)}</div><small>${esc(z)}</small></div>`).join('')||'<p>No matches.</p>';});}
}
function mark(revealed=false){const n=state.current;if(state.completed[n]===undefined){const points=revealed?0:Math.max(20,100-rt.hint*20-rt.tries*25);state.completed[n]=points;state.points+=points;state.unlocked=Math.max(state.unlocked,n+1);}rt.answer=true;store();draw()}
function wrong(){rt.tries++;state.mistakes[state.current]=(state.mistakes[state.current]||0)+1;store();rt.selected=[];draw()}
function go(n){if(n>state.unlocked||n<0||n>=puzzles.length)return;state.current=n;state.tab='play';rt={...rt,hint:0,tries:0,selected:[],wrong:-1,answer:false,revealed:{}};store();draw();window.scrollTo({top:0,behavior:'smooth'})}
$.addEventListener('click',ev=>{const b=ev.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,p=puzzles[state.current],n=Number(b.dataset.n);switch(a){case'view':state.tab=b.dataset.view;store();draw();break;case'jump':go(n);break;case'zh':state.zh=!state.zh;store();draw();break;case'translate':rt.revealed[b.dataset.id]=!rt.revealed[b.dataset.id];draw();break;case'hint':rt.hint=Math.min(2,rt.hint+1);draw();break;case'choose':if(n===p.answer)mark();else{rt.wrong=n;wrong();}break;case'part':if(!rt.selected.includes(n))rt.selected.push(n);draw();break;case'remove':rt.selected.splice(n,1);draw();break;case'clear':rt.selected=[];draw();break;case'check':{if(!rt.selected.length)break;const picked=rt.selected.map(i=>p.parts[i]).join('').replace(/\s+/g,'').toLowerCase();const target=p.word.replace(/\s+/g,'').toLowerCase();if(picked===target)mark();else wrong();break;}case'reveal':mark(true);break;case'next':if(state.current>=puzzles.length-1){state.tab='results';store();draw();window.scrollTo({top:0,behavior:'smooth'})}else go(state.current+1);break;case'replay':go(state.current);break;case'restart':if(window.confirm('Clear progress for Unit '+unit+'? / 确定重置本单元进度？')){state=defaults();rt={hint:0,tries:0,selected:[],wrong:-1,answer:false,revealed:{},query:'',mode:'all'};store();draw();}break;}});
draw();
})();
