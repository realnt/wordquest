/* Word Quest browser-native English pronunciation (UK / US).
   Voices are provided by the browser/operating system; no remote TTS API. */
(function(){
  'use strict';
  const KEY='wordquest_speech_accent_v1'; // Independent from mission/progress storage.
  const supported=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
  const LOCALES={'en-GB':'UK','en-US':'US'};
  let accent='en-GB'; // Preserve the prior UK-default behavior.
  try { const saved=localStorage.getItem(KEY); if(Object.hasOwn(LOCALES,saved)) accent=saved; } catch(_e){}
  let active=null, utterance=null, seq=0;

  function status(message){
    let el=document.getElementById('wordquest-speech-status');
    if(!el){
      el=document.createElement('div');
      el.id='wordquest-speech-status';
      el.className='speak-status';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      document.body.appendChild(el);
    }
    el.textContent=message;
  }
  function reset(){
    if(!active)return;
    active.classList.remove('speaking');
    active.setAttribute('aria-pressed','false');
    active.title=active.hasAttribute('data-speak-sentence')?'Listen to English':'Hear pronunciation';
    active=null;
  }
  function stop(){
    seq++;
    reset();
    utterance=null;
    if(supported)window.speechSynthesis.cancel();
  }
  function getVoices(){
    if(!supported)return [];
    try{return window.speechSynthesis.getVoices()||[];}catch(_e){return [];}
  }
  function matchingVoice(locale,voices){
    const matches=voices.filter(v=>String(v.lang||'').replace('_','-').toLowerCase()===locale.toLowerCase());
    // Prefer a locally installed voice when possible; never deliberately select the wrong accent.
    return matches.find(v=>v.localService)||matches[0]||null;
  }
  function refreshAvailability(){
    const voices=getVoices();
    const unavailable=supported&&voices.length>0&&!matchingVoice(accent,voices);
    document.querySelectorAll('.speech-accent-control').forEach(control=>{
      const select=control.querySelector('.speech-accent-select');
      if(select&&select.value!==accent)select.value=accent;
      const note=control.querySelector('.speech-accent-note');
      if(note){
        note.hidden=!unavailable;
        const message=unavailable?LOCALES[accent]+' voice not installed; device may substitute.':'';
        if(note.textContent!==message)note.textContent=message;
      }
    });
  }
  function ensureControl(){
    const header=document.querySelector('#app .top, #root .navline');
    if(!header)return;
    if(header.querySelector('.speech-accent-control'))return;
    const control=document.createElement('label');
    control.className='speech-accent-control';
    control.innerHTML='<span class="speech-accent-icon" aria-hidden="true">🔊</span>'+
      '<span class="speech-accent-name">Accent</span>'+
      '<select class="speech-accent-select" aria-label="English pronunciation accent">'+
      '<option value="en-GB">🇬🇧 UK</option><option value="en-US">🇺🇸 US</option></select>'+
      '<span class="speech-accent-note" hidden></span>';
    const nav=header.querySelector('.topnav, .tools');
    if(nav)nav.insertAdjacentElement('afterend',control);
    else header.appendChild(control);
    refreshAvailability();
  }
  function changeAccent(locale){
    if(!Object.hasOwn(LOCALES,locale))return;
    if(accent!==locale)stop();
    accent=locale;
    try{localStorage.setItem(KEY,accent);}catch(_e){}
    refreshAvailability();
    status('Pronunciation set to '+(locale==='en-GB'?'British':'American')+' English.');
  }
  function play(button){
    if(!supported){status('Speech unavailable. / 当前浏览器不支持语音朗读。');return;}
    if(active===button){stop();return;}
    const sentence=button.hasAttribute('data-speak-sentence');
    const raw=button.getAttribute(sentence?'data-speak-sentence':'data-speak-word')||'';
    if(!raw.trim())return;
    stop();
    const id=++seq;
    const readable=sentence
      ?raw.trim().replace(/_{2,}|…+/g,' blank ').replace(/\s+/g,' ')
      :raw.trim().replace(/\s*(?:\.\.\.|…)\s*/g,' something ').replace(/\s+/g,' ');
    const next=new SpeechSynthesisUtterance(readable);
    const matching=matchingVoice(accent,getVoices());
    if(matching)next.voice=matching;
    // The requested locale is explicit even when the browser has no listed matching voice.
    next.lang=accent;
    next.rate=sentence?0.94:0.86;
    next.pitch=1;
    active=button;utterance=next;
    button.classList.add('speaking');
    button.setAttribute('aria-pressed','true');
    button.title='Stop playback';
    status((sentence?'Reading: ':'Playing: ')+raw+' ('+LOCALES[accent]+')');
    function finish(){if(id!==seq||utterance!==next)return;reset();utterance=null;}
    next.onend=finish;
    next.onerror=e=>{
      if(id!==seq)return;
      finish();
      if(e.error!=='canceled'&&e.error!=='interrupted')status('Cannot play audio. Check device English voices.');
    };
    try{window.speechSynthesis.speak(next);}catch(_e){finish();status('Speech playback unavailable.');}
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-speak-word],[data-speak-sentence]');
    if(!button)return;
    event.preventDefault();
    play(button);
  });
  document.addEventListener('change',event=>{
    if(!event.target.matches('.speech-accent-select'))return;
    changeAccent(event.target.value);
  });
  if(supported&&typeof window.speechSynthesis.addEventListener==='function'){
    window.speechSynthesis.addEventListener('voiceschanged',refreshAvailability);
  }
  function init(){
    ensureControl();
    const root=document.getElementById('app')||document.getElementById('root');
    if(root&&typeof MutationObserver!=='undefined'){
      new MutationObserver(ensureControl).observe(root,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pagehide',stop);
})();
