/* Standalone Node regression tests: no browser or npm dependencies required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../speech.js'),'utf8');

function harness(voices, saved='en-GB', savedSpeed=null, voicePreferences=null) {
  const handlers={}, voiceHandlers={}, spoken=[], data=new Map([
    ['wordquest_speech_accent_v1',saved],
    ['wordquest_speech_speed_v1',savedSpeed],
    ['wordquest_speech_voice_v1',voicePreferences===null?null:JSON.stringify(voicePreferences)],
    ['wordquest_g7u1_v1','{"score":42}']
  ]);
  let control=null, observe=null, statusEl=null, cancels=0;
  const select={value:'',matches:q=>q==='.speech-accent-select'};
  const voiceSelect={
    value:'',disabled:false,dataset:{},options:[],
    matches:q=>q==='.speech-voice-select',
    replaceChildren(...options){this.options=options;this.value=options[0]?.value||'';}
  };
  const note={hidden:true,textContent:''};
  const range={value:'1.0',matches:q=>q==='.speech-speed-range'};
  const output={textContent:''};
  const header={
    querySelector:q=>q==='.speech-accent-control'?control:q==='.topnav, .tools'?nav:null,
    appendChild:el=>{control=el;}
  };
  const nav={insertAdjacentElement:(_pos,el)=>{control=el;}};
  const root={};
  const body={appendChild:el=>{statusEl=el;}};
  class Node {
    constructor(tag){this.tag=tag;this.attrs={};this.className='';this.textContent='';this.title='';this.classList={
      add:()=>{},remove:()=>{}
    };}
    setAttribute(k,v){this.attrs[k]=String(v);}
    hasAttribute(k){return Object.prototype.hasOwnProperty.call(this.attrs,k);}
    getAttribute(k){return this.attrs[k]||null;}
    set innerHTML(html){this.html=html;}
    querySelector(q){return q==='.speech-accent-select'?select:q==='.speech-voice-select'?voiceSelect:q==='.speech-accent-note'?note:q==='.speech-speed-range'?range:q==='.speech-speed-value'?output:null;}
  }
  const document={
    readyState:'complete',body,
    querySelector:q=>q==='#app .top, #root .navline'?header:null,
    querySelectorAll:q=>q==='.speech-accent-control'&&control?[control]:[],
    getElementById:id=>id==='app'?root:id==='wordquest-speech-status'?statusEl:null,
    createElement:tag=>new Node(tag),
    addEventListener:(type,cb)=>{handlers[type]=cb;}
  };
  const synthesis={
    getVoices:()=>voices,
    speak:utterance=>spoken.push(utterance),
    cancel:()=>{cancels++;},
    addEventListener:(type,cb)=>{voiceHandlers[type]=cb;}
  };
  const window={
    speechSynthesis:synthesis,
    SpeechSynthesisUtterance:class{constructor(text){this.text=text;this.voice=null;}},
    addEventListener:()=>{}
  };
  class MutationObserver{constructor(callback){observe=callback;}observe(){}}
  const store={
    getItem:key=>data.get(key)||null,
    setItem:(key,value)=>data.set(key,value)
  };
  vm.runInNewContext(script,{window,document,localStorage:store,
    SpeechSynthesisUtterance:window.SpeechSynthesisUtterance,MutationObserver});
  const button=(attr,value)=>{
    const el=new Node('button');el.setAttribute(attr,value);
    el.closest=q=>q.includes('[data-speak-word]')?el:null;
    return el;
  };
  const click=el=>handlers.click({target:el,preventDefault(){}});
  const change=value=>{select.value=value;handlers.change({target:select});};
  const changeVoice=value=>{voiceSelect.value=value;handlers.change({target:voiceSelect});};
  const speedInput=value=>{range.value=value;handlers.input({target:range});};
  return {
    click,change,changeVoice,speedInput,button,spoken,data,select,voiceSelect,note,range,output,voiceHandlers,header,
    redraw:()=>{control=null;observe();},
    getControl:()=>control,getCancels:()=>cancels
  };
}
const voices=[
  {name:'US English',lang:'en-US',localService:true},
  {name:'UK English',lang:'en-GB',localService:true}
];
{
 const h=harness(voices);
 assert.ok(h.getControl(),'Accent control inserted in header');
 assert.equal(h.select.value,'en-GB','Default remains UK');
 h.click(h.button('data-speak-word','schedule'));
 assert.equal(h.spoken.at(-1).lang,'en-GB');
 assert.equal(h.spoken.at(-1).voice.name,'UK English');
 assert.equal(h.spoken.at(-1).rate,1.0,'Natural speed is the default for words');
 assert.equal(Number(h.range.value),1.0);
 assert.equal(h.output.textContent,'1.00×');
 h.change('en-US');
 assert.equal(h.data.get('wordquest_speech_accent_v1'),'en-US');
 assert.equal(h.data.get('wordquest_g7u1_v1'),'{"score":42}','Progress is unchanged');
 h.speedInput('1.15');
 assert.equal(h.data.get('wordquest_speech_speed_v1'),'1.15','Speed persisted independently');
 assert.equal(h.data.get('wordquest_g7u1_v1'),'{"score":42}','XP/progress remains unchanged');
 h.click(h.button('data-speak-sentence','Read the sentence.'));
 assert.equal(h.spoken.at(-1).lang,'en-US');
 assert.equal(h.spoken.at(-1).voice.name,'US English');
 assert.equal(h.spoken.at(-1).rate,1.15,'Sentence uses chosen speed');
 assert.ok(h.getCancels()>0,'Accent change cancels existing audio');
 h.redraw();
 assert.ok(h.getControl(),'Selector reappears after mission rerender');
 assert.equal(h.select.value,'en-US');
 assert.equal(h.range.value,'1.15');
 assert.equal(h.output.textContent,'1.15×');
}
{
 const h=harness(voices,'en-US','1.20');
 assert.equal(h.select.value,'en-US','Saved accent restored in another unit');
 assert.equal(h.range.value,'1.20','Saved speed restored in another unit');
 h.click(h.button('data-speak-word','color'));
 assert.equal(h.spoken.at(-1).voice.name,'US English');
 assert.equal(h.spoken.at(-1).rate,1.20);
}
{
 const h=harness([voices[1]],'en-US');
 assert.equal(h.note.hidden,false,'Clearly signal when requested voice is unavailable');
 h.click(h.button('data-speak-word','water'));
 assert.equal(h.spoken.at(-1).lang,'en-US','Keep requested locale as synthesis hint');
 assert.equal(h.spoken.at(-1).voice,null,'Do not force a UK voice for a US preference');
 h.voiceHandlers.voiceschanged();
}
{
 const h=harness(voices,'en-GB','not-a-number');
 assert.equal(Number(h.range.value),1.0,'Invalid storage falls back to normal speed');
 h.speedInput('0.80');
 h.click(h.button('data-speak-word','hello'));
 assert.equal(h.spoken.at(-1).rate,0.80,'Minimum rate supported');
 h.speedInput('1.20');
 h.click(h.button('data-speak-sentence','One full sentence.'));
 assert.equal(h.spoken.at(-1).rate,1.20,'Maximum rate supported');
 const previous=h.data.get('wordquest_speech_speed_v1');
 h.speedInput('2.00');
 assert.equal(h.data.get('wordquest_speech_speed_v1'),previous,'Reject rates outside configured range');
}
{
 const desktop=[
  {name:'Microsoft Hazel - English (United Kingdom)',lang:'en-GB',voiceURI:'Hazel',localService:true},
  {name:'Microsoft Susan - English (United Kingdom)',lang:'en-GB',voiceURI:'Susan',localService:true},
  {name:'Google UK English Female',lang:'en-GB',voiceURI:'google-uk-f',localService:false},
  {name:'Google UK English Male',lang:'en-GB',voiceURI:'google-uk-m',localService:false},
  {name:'Microsoft David - English (United States)',lang:'en-US',voiceURI:'David',localService:true},
  {name:'Microsoft Zira - English (United States)',lang:'en-US',voiceURI:'Zira',localService:true},
  {name:'Google US English',lang:'en-US',voiceURI:'google-us',localService:false},
  {name:'Microsoft Huihui - Chinese (Simplified, PRC)',lang:'zh-CN',voiceURI:'Huihui',localService:true}
 ];
 const h=harness(desktop);
 const names=()=>h.voiceSelect.options.map(option=>option.textContent);
 assert.ok(names().includes('Google UK English Female'));
 assert.ok(names().includes('Google UK English Male'));
 assert.ok(!names().includes('Google US English'),'Filter by UK accent');
 assert.ok(!names().some(name=>name.includes('Huihui')),'Exclude non-English voices');
 assert.equal(names()[0],'Microsoft Hazel - English (United Kingdom)','First UK voice is default');
 assert.ok(!names().includes('Automatic'),'Do not offer redundant Automatic option');
 assert.equal(h.voiceSelect.options[0].value,h.voiceSelect.value,
   'Dropdown visibly selects the first voice by default');
 h.click(h.button('data-speak-word','hello'));
 assert.equal(h.spoken.at(-1).voice.name,'Microsoft Hazel - English (United Kingdom)',
   'Initial playback and visible selection agree');
 const hazelToken=h.voiceSelect.options[0].value;
 const susanToken=h.voiceSelect.options.find(option=>option.textContent.includes('Microsoft Susan')).value;
 assert.notEqual(hazelToken,susanToken,'Hazel and Susan remain distinct browser choices');
 h.changeVoice(susanToken);
 h.click(h.button('data-speech-preview',''));
 assert.equal(h.spoken.at(-1).voice.voiceURI,'Susan','Explicit Susan selection is passed to speechSynthesis');
 h.changeVoice(hazelToken);
 h.click(h.button('data-speech-preview',''));
 assert.equal(h.spoken.at(-1).voice.voiceURI,'Hazel','Explicit Hazel selection is passed to speechSynthesis');
 const ukChoice=h.voiceSelect.options.find(option=>option.textContent==='Google UK English Female').value;
 h.changeVoice(ukChoice);
 h.click(h.button('data-speak-word','water'));
 assert.equal(h.spoken.at(-1).voice.name,'Google UK English Female');
 assert.equal(h.spoken.at(-1).lang,'en-GB');
 assert.equal(JSON.parse(h.data.get('wordquest_speech_voice_v1'))['en-GB'].name,'Google UK English Female');
 h.change('en-US');
 assert.ok(names().includes('Google US English'));
 assert.ok(!names().includes('Google UK English Female'),'UK voices disappear for US accent');
 const usChoice=h.voiceSelect.options.find(option=>option.textContent==='Google US English').value;
 h.changeVoice(usChoice);
 h.click(h.button('data-speak-sentence','One complete sentence.'));
 assert.equal(h.spoken.at(-1).voice.name,'Google US English');
 const pref=JSON.parse(h.data.get('wordquest_speech_voice_v1'));
 assert.equal(pref['en-US'].name,'Google US English');
 assert.equal(pref['en-GB'].name,'Google UK English Female','Both accent choices persisted');
 h.change('en-GB');
 assert.equal(h.voiceSelect.value,ukChoice,'Original UK choice restored after toggling accent');
 h.click(h.button('data-speech-preview',''));
 assert.equal(h.spoken.at(-1).voice.name,'Google UK English Female');
 assert.ok(h.spoken.at(-1).text.includes('Word Quest'),'Preview uses a test sentence');
 assert.equal(h.data.get('wordquest_g7u1_v1'),'{"score":42}','Never modify mission storage');
 h.redraw();
 assert.equal(h.voiceSelect.value,ukChoice,'Chosen voice restored after rerender');
 const reloaded=harness(desktop,'en-GB',null,pref);
 assert.equal(reloaded.voiceSelect.value,ukChoice,'Choice persists after page reload');
 const firstToken=reloaded.voiceSelect.options[0].value;
 reloaded.changeVoice(firstToken);
 reloaded.click(reloaded.button('data-speak-word','test'));
 assert.equal(reloaded.spoken.at(-1).voice.name,'Microsoft Hazel - English (United Kingdom)',
   'Choosing the first UK voice is equivalent to the former default');
 assert.equal(JSON.parse(reloaded.data.get('wordquest_speech_voice_v1'))['en-GB'].name,
   'Microsoft Hazel - English (United Kingdom)','Explicit first choice is saved');
}
{
 // Safari may have no voices on initial load; a voiceschanged event populates them later.
 const upcoming=[];
 const h=harness(upcoming);
 assert.equal(h.voiceSelect.options.length,1,'Loading placeholder before voices load');
 assert.equal(h.voiceSelect.options[0].textContent,'Loading voices…');
 assert.ok(!h.voiceSelect.options.some(o=>o.textContent==='Automatic'));
 assert.equal(h.voiceSelect.disabled,false,'Picker stays focusable while voices load');
 upcoming.push({name:'Samantha',lang:'en-US',voiceURI:'com.apple.samantha',localService:true});
 h.change('en-US');
 h.voiceHandlers.voiceschanged();
 assert.ok(h.voiceSelect.options.some(o=>o.textContent==='Samantha'),'Late voices become available');
 const token=h.voiceSelect.options.find(o=>o.textContent==='Samantha').value;
 h.changeVoice(token);
 h.click(h.button('data-speak-word','hello'));
 assert.equal(h.spoken.at(-1).voice.name,'Samantha');
 const missing=harness([{name:'Other UK',lang:'en-GB',voiceURI:'uk',localService:true}],
   'en-GB',null,{'en-GB':{name:'Samantha',uri:'com.apple.samantha'}});
 assert.equal(missing.voiceSelect.value,missing.voiceSelect.options[0].value,
   'Missing saved voice falls back to the first available voice');
 assert.equal(missing.note.hidden,false,'Explain missing preference');
}
console.log('Speech tests passed (UK/US, first default, distinct voice objects, preview, saved choices, mobile reload, speed).');
