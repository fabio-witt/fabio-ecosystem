/* Fabio Ecosystem v62 navbar behaviour: dropdowns, mobile sheet, keyboard */
(function(){
  'use strict';
  function init(){
    var nav=document.querySelector('[data-fw50-nav]');
    if(!nav||nav.dataset.ready)return;nav.dataset.ready='1';
    var dds=[].slice.call(nav.querySelectorAll('.fw50-dd'));
    var burger=nav.querySelector('.fw50-burger'),sheet=nav.querySelector('.fw50-sheet');
    function setDd(dd,open){var b=dd.querySelector('button'),p=dd.querySelector('.fw50-dd__panel');b.setAttribute('aria-expanded',String(open));p.classList.toggle('is-open',open);}
    function closeAll(except){dds.forEach(function(d){if(d!==except)setDd(d,false);});}
    dds.forEach(function(dd){
      var b=dd.querySelector('button');
      b.addEventListener('click',function(e){e.stopPropagation();var open=b.getAttribute('aria-expanded')!=='true';closeAll(dd);setDd(dd,open);});
      dd.querySelector('.fw50-dd__panel').addEventListener('click',function(e){e.stopPropagation();});
      dd.addEventListener('keydown',function(e){
        if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
        var links=[].slice.call(dd.querySelectorAll('.fw50-dd__panel a'));if(!links.length)return;
        e.preventDefault();setDd(dd,true);var i=links.indexOf(document.activeElement);
        i=e.key==='ArrowDown'?Math.min(links.length-1,i+1):Math.max(0,i-1);links[i].focus();
      });
    });
    function setSheet(open){
      if(!burger)return;
      burger.setAttribute('aria-expanded',String(open));
      burger.setAttribute('aria-label',open?burger.dataset.close:burger.dataset.open);
      sheet.classList.toggle('is-open',open);
      document.documentElement.classList.toggle('fw50-locked',open);
    }
    if(burger){
      burger.addEventListener('click',function(){setSheet(burger.getAttribute('aria-expanded')!=='true');});
      sheet.addEventListener('click',function(e){if(e.target.closest('a'))setSheet(false);});
    }
    document.addEventListener('click',function(){closeAll();});
    document.addEventListener('keydown',function(e){
      if(e.key!=='Escape')return;
      var open=dds.filter(function(d){return d.querySelector('button').getAttribute('aria-expanded')==='true';})[0];
      if(open){setDd(open,false);open.querySelector('button').focus();}
      if(burger&&burger.getAttribute('aria-expanded')==='true'){setSheet(false);burger.focus();}
    });
    var mq=window.matchMedia('(min-width:1101px)');
    var onChange=function(){if(mq.matches)setSheet(false);else closeAll();};
    if(mq.addEventListener)mq.addEventListener('change',onChange);else mq.addListener(onChange);
    window.addEventListener('pageshow',function(){setSheet(false);closeAll();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
