/* Single version source for every Word Quest page. */
(function(){
  'use strict';
  const VERSION='1.5.4';
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
    mark();
    if(root&&typeof MutationObserver!=='undefined')new MutationObserver(mark)
      .observe(root,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
