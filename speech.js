/* Word Quest browser-native pronunciation. No external speech service. */
(function(){
'use strict';
const supported=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
let active=null, utterance=null, seq=0;
function status(message){
 let el=document.getElementById('wordquest-speech-status');
 if(!el){el=document.createElement('div');el.id='wordquest-speech-status';el.className='speak-status';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}
 el.textContent=message;
}
function reset(){
 if(active){active.classList.remove('speaking');active.setAttribute('aria-pressed','false');active.title=active.hasAttribute('data-speak-sentence')?'Listen to English':'Hear pronunciation';active=null;}
}
function stop(){seq++;reset();utterance=null;if(supported)window.speechSynthesis.cancel();}
function voice(){
 let v=[];try{v=window.speechSynthesis.getVoices()||[];}catch(e){}
 return v.find(x=>/^en[-_]GB$/i.test(x.lang)&&x.localService)||v.find(x=>/^en[-_]GB$/i.test(x.lang))||v.find(x=>/^en([-_]|$)/i.test(x.lang)&&x.localService)||v.find(x=>/^en([-_]|$)/i.test(x.lang))||null;
}
function play(b){
 if(!supported){status('Speech unavailable. / 当前浏览器不支持语音朗读。');return;}
 if(active===b){stop();return;}
 const sentence=b.hasAttribute('data-speak-sentence');
 const raw=b.getAttribute(sentence?'data-speak-sentence':'data-speak-word')||'';
 if(!raw.trim())return;
 stop();const id=++seq;
 const txt=sentence?raw.trim().replace(/_{2,}|…+/g,' blank ').replace(/\s+/g,' '):raw.trim().replace(/\s*(?:\.\.\.|…)\s*/g,' something ').replace(/\s+/g,' ');
 const u=new SpeechSynthesisUtterance(txt),v=voice();if(v)u.voice=v;
 u.lang=v?v.lang:'en-GB';u.rate=sentence?0.94:0.86;u.pitch=1;
 active=b;utterance=u;b.classList.add('speaking');b.setAttribute('aria-pressed','true');b.title='Stop playback';status((sentence?'Reading: ':'Playing: ')+raw);
 function finish(){if(id!==seq||utterance!==u)return;reset();utterance=null;}
 u.onend=finish;u.onerror=e=>{if(id!==seq)return;finish();if(e.error!=='canceled'&&e.error!=='interrupted')status('Cannot play audio. Check English voices.');};
 try{window.speechSynthesis.speak(u);}catch(e){finish();status('Speech playback unavailable.');}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-speak-word],[data-speak-sentence]');if(!b)return;e.preventDefault();play(b);});
window.addEventListener('pagehide',stop);
})();