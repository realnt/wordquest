/* Shared header/footer template for homepage and all six units.
   Game engines retain their own state and event handlers. */
(function(){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sections=[['play','🎮 Play','游戏'],['map','🗺️ Map','地图'],['vault','📚 Word Vault','词汇库']];
  function header({home=false,unit=0,active='play',chinese=false}={}){
    const nav=home
      ?'<a class="wq-navbtn navbtn" href="https://www.etymonline.com/" target="_blank" rel="noopener noreferrer">Etymonline ↗</a>'
      :sections.map(([view,title,zh])=>
          '<button type="button" class="wq-navbtn navbtn nav '+(active===view?'active':'')+
          '" data-action="view" data-view="'+view+'" data-val="'+view+'">'+
          title+(chinese?' · '+zh:'')+'</button>').join('');
    return '<header class="wq-header navline top">'+
      '<a href="index.html" class="wq-brand brand">'+
        '<span class="wq-brand-icon logo brandmark" aria-hidden="true">✦</span>'+
        '<span class="wq-brand-text">WORD QUEST</span>'+
        '<small class="wq-grade">G7A'+(unit?' · U'+esc(unit):'')+'</small>'+
      '</a>'+
      '<nav class="wq-nav tools topnav" aria-label="'+(home?'Resources':'Game navigation')+'">'+nav+'</nav>'+
      '</header>';
  }
  function footer(){
    return '<footer class="wq-footer foot footer">'+
      'Word Quest · 2024 Shanghai five-four-system Grade 7A · Unofficial learning game.'+
      '<span class="wq-footer-extra"> Learning content is original. Progress stays in this browser.</span>'+
      '</footer>';
  }
  window.WordQuestShell=Object.freeze({header,footer});
})();