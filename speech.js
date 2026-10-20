/* Word Quest browser-native English pronunciation (UK / US).
   Voices are provided by the browser/operating system; no remote TTS API. */
(function(){
  'use strict';
  const KEY='wordquest_speech_accent_v1'; // Independent from mission/progress storage.
  const SPEED_KEY='wordquest_speech_speed_v1'; // Same preference across all six units, per device/browser.
  const supported=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
  const LOCALES={'en-GB':'UK','en-US':'US'};
  let accent='en-GB'; // Preserve the prior UK-default behavior.
  try { const saved=localStorage.getItem(KEY); if(Object.hasOwn(LOCALES,saved)) accent=saved; } catch(_e){}
  // A natural 1.00× default avoids unnecessarily slow iOS playback.
  // The old v1.4.3 rates were 0.86× words / 0.94× sentences.
  let speed=1.0;
  try {
    const saved=localStorage.getItem(SPEED_KEY);
    if(saved!==null){
      const number=Number(saved);
      if(Number.isFinite(number)&&number>=0.8&&number<=1.2)
        speed=Math.round(number*20)/20;
    }
  } catch(_e){}
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
      const range=control.querySelector('.speech-speed-range');
      if(range&&Number(range.value)!==speed)range.value=speed.toFixed(2);
      const value=control.querySelector('.speech-speed-value');
      const display=speed.toFixed(2)+'×';
      if(value&&value.textContent!==display)value.textContent=display;
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
    const control=document.createElement('div');
    control.className='speech-accent-control';
    control.innerHTML='<label class="speech-accent-picker"><span class="speech-accent-icon" aria-hidden="true">🔊</span>'+
      '<span class="speech-accent-name">Accent</span>'+
      '<select class="speech-accent-select" aria-label="English pronunciation accent">'+
      '<option value="en-GB">🇬🇧 UK</option><option value="en-US">🇺🇸 US</option></select></label>'+
      '<label class="speech-speed-label" for="wordquest-speech-speed">Speed</label>'+
      '<input id="wordquest-speech-speed" class="speech-speed-range" type="range"'+
      ' min="0.8" max="1.2" step="0.05" value="1.0" aria-label="Speaking speed">'+
      '<output class="speech-speed-value" for="wordquest-speech-speed">1.00×</output>'+
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
  function changeSpeed(value){
    const requested=Number(value);
    if(!Number.isFinite(requested)||requested<0.8||requested>1.2)return;
    const nextSpeed=Math.round(requested*20)/20;
    if(speed!==nextSpeed)stop(); // New speed is applied to the next playback.
    speed=nextSpeed;
    try{localStorage.setItem(SPEED_KEY,speed.toFixed(2));}catch(_e){}
    refreshAvailability();
    status('Speaking speed set to '+speed.toFixed(2)+'×.');
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
    next.rate=speed;
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
    if(event.target.matches('.speech-accent-select'))changeAccent(event.target.value);
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('.speech-speed-range'))changeSpeed(event.target.value);
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
