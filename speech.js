/* Word Quest browser-native English pronunciation (UK / US).
   Voices are provided by the browser/operating system; no remote TTS API. */
(function(){
  'use strict';
  const KEY='wordquest_speech_accent_v1'; // Independent from mission/progress storage.
  const SPEED_KEY='wordquest_speech_speed_v1'; // Same preference across all six units, per device/browser.
  const VOICE_KEY='wordquest_speech_voice_v1'; // Device-specific chosen UK/US voices.
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
  // Keep a separate voice choice per accent. Never touch mission progress storage.
  let chosenVoices={};
  try {
    const saved=JSON.parse(localStorage.getItem(VOICE_KEY)||'{}');
    if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
      for(const locale of Object.keys(LOCALES)){
        const voice=saved[locale];
        if(voice&&typeof voice.name==='string'&&voice.name.length<=300&&
           typeof voice.uri==='string'&&voice.uri.length<=500){
          chosenVoices[locale]={name:voice.name,uri:voice.uri};
        }
      }
    }
  }catch(_e){}
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
    active.title=active.hasAttribute('data-speech-preview')?'Preview English voice':active.hasAttribute('data-speak-sentence')?'Listen to English':'Hear pronunciation';
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
  function voiceToken(voice){
    return JSON.stringify([String(voice.name||''),String(voice.voiceURI||'')]);
  }
  function availableVoices(locale,voices){
    return voices.filter(v=>String(v.lang||'').replace('_','-').toLowerCase()===locale.toLowerCase());
  }
  function savedVoice(locale,voices){
    const wanted=chosenVoices[locale];
    if(!wanted)return null;
    const matching=availableVoices(locale,voices);
    // A URI can vary across browsers and OS updates; use name as a safe fallback
    // only within the requested accent.
    return matching.find(v=>v.name===wanted.name&&String(v.voiceURI||'')===wanted.uri)||
           matching.find(v=>v.name===wanted.name)||null;
  }
  function selectedVoice(locale,voices){
    return savedVoice(locale,voices)||matchingVoice(locale,voices);
  }
  function refreshAvailability(){
    const voices=getVoices();
    const choices=availableVoices(accent,voices);
    const unavailable=supported&&voices.length>0&&choices.length===0;
    const wanted=chosenVoices[accent];
    const selected=wanted?savedVoice(accent,voices):null;
    document.querySelectorAll('.speech-accent-control').forEach(control=>{
      const select=control.querySelector('.speech-accent-select');
      if(select&&select.value!==accent)select.value=accent;
      const range=control.querySelector('.speech-speed-range');
      if(range&&Number(range.value)!==speed)range.value=speed.toFixed(2);
      const value=control.querySelector('.speech-speed-value');
      const display=speed.toFixed(2)+'×';
      if(value&&value.textContent!==display)value.textContent=display;
      const voiceSelect=control.querySelector('.speech-voice-select');
      if(voiceSelect){
        // Some browsers (notably Safari) populate voices after initial page load.
        // Rebuild only when locale or available voice list changes.
        const fingerprint=accent+'|'+JSON.stringify(choices.map(voiceToken));
        if(voiceSelect.dataset.voiceList!==fingerprint){
          const auto=document.createElement('option');
          auto.value='';
          auto.textContent='Automatic';
          const options=[auto];
          for(const voice of choices){
            const option=document.createElement('option');
            option.value=voiceToken(voice);
            option.textContent=voice.name;
            options.push(option);
          }
          voiceSelect.replaceChildren(...options);
          voiceSelect.dataset.voiceList=fingerprint;
        }
        const value=selected?voiceToken(selected):'';
        if(voiceSelect.value!==value)voiceSelect.value=value;
        voiceSelect.disabled=!supported||choices.length===0;
      }
      const note=control.querySelector('.speech-accent-note');
      if(note){
        const missingSelected=Boolean(wanted)&&voices.length>0&&!selected;
        const message=unavailable
          ?LOCALES[accent]+' voice not available; device may substitute.'
          :missingSelected?'Saved voice unavailable; using automatic '+LOCALES[accent]+' voice.':'';
        note.hidden=!message;
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
      '<label class="speech-voice-picker"><span class="speech-voice-label">Voice</span>'+
      '<select class="speech-voice-select" aria-label="English speaking voice">'+
      '<option value="">Automatic</option></select></label>'+
      '<button type="button" class="speech-voice-preview" data-speech-preview'+
      ' title="Preview English voice" aria-label="Preview English voice">▶</button>'+
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
  function changeVoice(token){
    const voices=availableVoices(accent,getVoices());
    const voice=token?voices.find(v=>voiceToken(v)===token):null;
    if(token&&!voice)return;
    if(voice)chosenVoices[accent]={name:voice.name,uri:String(voice.voiceURI||'')};
    else delete chosenVoices[accent];
    stop();
    try{localStorage.setItem(VOICE_KEY,JSON.stringify(chosenVoices));}catch(_e){}
    refreshAvailability();
    status(voice?'Voice set to '+voice.name+'.':'Automatic '+LOCALES[accent]+' voice selected.');
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
    const preview=button.hasAttribute('data-speech-preview');
    const sentence=button.hasAttribute('data-speak-sentence');
    const raw=preview?"Welcome to Word Quest. Let's discover new words together.":
      button.getAttribute(sentence?'data-speak-sentence':'data-speak-word')||'';
    if(!raw.trim())return;
    stop();
    const id=++seq;
    const readable=sentence
      ?raw.trim().replace(/_{2,}|…+/g,' blank ').replace(/\s+/g,' ')
      :raw.trim().replace(/\s*(?:\.\.\.|…)\s*/g,' something ').replace(/\s+/g,' ');
    const next=new SpeechSynthesisUtterance(readable);
    const matching=selectedVoice(accent,getVoices());
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
    const button=event.target.closest('[data-speak-word],[data-speak-sentence],[data-speech-preview]');
    if(!button)return;
    event.preventDefault();
    play(button);
  });
  document.addEventListener('change',event=>{
    if(event.target.matches('.speech-accent-select'))changeAccent(event.target.value);
    else if(event.target.matches('.speech-voice-select'))changeVoice(event.target.value);
  });
  document.addEventListener('focusin',event=>{
    if(event.target.matches('.speech-voice-select'))refreshAvailability();
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
