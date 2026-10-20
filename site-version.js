/* Single version source for every Word Quest page. */
(function(){
  'use strict';
  const VERSION='1.4.7';
  const root=document.getElementById('app')||document.getElementById('root')||document.body;
  function mark(){
    const brand=document.querySelector('.navline .brand, .top .brand');
    if(!brand||brand.querySelector('[data-wordquest-version]'))return;
    const label=document.createElement('span');
    label.className='wordquest-version';
    label.dataset.wordquestVersion=VERSION;
    label.setAttribute('aria-label','Word Quest version '+VERSION);
    label.title='Word Quest version '+VERSION;
    label.textContent='v'+VERSION;
    brand.appendChild(label);
  }
  function setup(){
    if(!document.getElementById('wordquest-version-style')){
      const style=document.createElement('style');
      style.id='wordquest-version-style';
      style.textContent='.wordquest-version{display:inline-flex;align-items:center;white-space:nowrap;'+
        'font-size:10px;line-height:1.2;font-weight:800;letter-spacing:0;'+
        'border:1px solid #c7e5da;border-radius:7px;padding:3px 6px;'+
        'background:#e3f5ef;color:#247368;margin-left:5px}'+
        '@media(max-width:560px){.wordquest-version{font-size:9px;padding:3px 5px;margin-left:1px}}';
      document.head.appendChild(style);
    }
    mark();
    if(root&&typeof MutationObserver!=='undefined')new MutationObserver(mark)
      .observe(root,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
