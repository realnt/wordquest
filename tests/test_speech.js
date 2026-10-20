/* Standalone Node regression tests: no browser or npm dependencies required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../speech.js'),'utf8');

function harness(voices, saved='en-GB', savedSpeed=null) {
  const handlers={}, voiceHandlers={}, spoken=[], data=new Map([
    ['wordquest_speech_accent_v1',saved],
    ['wordquest_speech_speed_v1',savedSpeed],
    ['wordquest_g7u1_v1','{"score":42}']
  ]);
  let control=null, observe=null, statusEl=null, cancels=0;
  const select={value:'',matches:q=>q==='.speech-accent-select'};
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
    querySelector(q){return q==='.speech-accent-select'?select:q==='.speech-accent-note'?note:q==='.speech-speed-range'?range:q==='.speech-speed-value'?output:null;}
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
  const speedInput=value=>{range.value=value;handlers.input({target:range});};
  return {
    click,change,speedInput,button,spoken,data,select,note,range,output,voiceHandlers,header,
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
 assert.equal(h.range.value,'1.00');
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
 assert.equal(h.range.value,'1.00','Invalid storage falls back to normal speed');
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
console.log('Speech tests passed (UK, US, speed, persistence, fallback and redraw).');
