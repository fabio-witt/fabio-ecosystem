/* Fabio Ecosystem v60 - navbar behaviour: dropdown, mobile sheet, keyboard */
(function(){
  'use strict';
  function init(){
    var nav=document.querySelector('[data-fw50-nav]');
    if(!nav||nav.dataset.ready)return;nav.dataset.ready='1';
    var more=nav.querySelector('.fw50-more>button'),panel=nav.querySelector('.fw50-more__panel');
    var burger=nav.querySelector('.fw50-burger'),sheet=nav.querySelector('.fw50-sheet');
    function setMore(open){if(!more)return;more.setAttribute('aria-expanded',String(open));panel.classList.toggle('is-open',open);}
    function setSheet(open){
      if(!burger)return;
      burger.setAttribute('aria-expanded',String(open));
      burger.setAttribute('aria-label',open?burger.dataset.close:burger.dataset.open);
      sheet.classList.toggle('is-open',open);
      document.documentElement.classList.toggle('fw50-locked',open);
      if(open){var first=sheet.querySelector('a,button');if(first)first.focus({preventScroll:true});}
    }
    if(more){
      more.addEventListener('click',function(e){e.stopPropagation();setMore(more.getAttribute('aria-expanded')!=='true');});
      panel.addEventListener('click',function(e){e.stopPropagation();});
    }
    if(burger){
      burger.addEventListener('click',function(){setSheet(burger.getAttribute('aria-expanded')!=='true');});
      sheet.addEventListener('click',function(e){if(e.target.closest('a'))setSheet(false);});
    }
    document.addEventListener('click',function(){setMore(false);});
    document.addEventListener('keydown',function(e){
      if(e.key!=='Escape')return;
      if(more&&more.getAttribute('aria-expanded')==='true'){setMore(false);more.focus();}
      if(burger&&burger.getAttribute('aria-expanded')==='true'){setSheet(false);burger.focus();}
    });
    var mq=window.matchMedia('(min-width:1021px)');
    var onChange=function(){if(mq.matches)setSheet(false);else setMore(false);};
    if(mq.addEventListener)mq.addEventListener('change',onChange);else mq.addListener(onChange);
    window.addEventListener('pageshow',function(){setSheet(false);setMore(false);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
