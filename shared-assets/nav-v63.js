/* Fabio Ecosystem v63 navbar: overview links with dropdowns, mobile sheet, quick contact */
(function(){
  'use strict';
  var TOPICS={dachwerk:'SAP Consulting',sprachschule:'Private Sprachkurse',lingora:'GrammarBay App',grammarfirst:'GrammarFirst',digital:'Weitere Services: Drohne, Video, Social Media, Website',fabio:'Allgemeine Anfrage'};
  var THANKS={dachwerk:'/dachwerk/danke.html',sprachschule:'/sprachschule/danke.html'};
  function section(){var m=location.pathname.match(/^\/(dachwerk|sprachschule|lingora|grammarfirst|fabio)\b/);if(m)return m[1];if(/^\/digital/.test(location.pathname))return 'digital';return 'fabio';}
  function buildDialog(){
    var sec=section();
    var d=document.createElement('dialog');d.className='fw-qc';d.setAttribute('aria-labelledby','fw-qc-title');
    var opts=Object.keys(TOPICS).map(function(k){return '<option'+(k===sec?' selected':'')+'>'+TOPICS[k]+'</option>';}).join('');
    d.innerHTML='<form action="https://formsubmit.co/fabiowitt@gmx.de" method="POST" data-email-form="true">'+
      '<div class="fw-qc__top"><div><h2 id="fw-qc-title">Kurze Anfrage</h2><p>Ich antworte persönlich, meist innerhalb eines Werktags.</p></div><button type="button" class="fw-qc__x" aria-label="Schliessen">×</button></div>'+
      '<div class="fw-qc__row"><label>Name<input name="Name" autocomplete="name" required></label><label>E-Mail<input name="email" type="email" autocomplete="email" required></label></div>'+
      '<label>Worum geht es?<select name="Thema">'+opts+'</select></label>'+
      '<label>Nachricht<textarea name="Nachricht" required placeholder="Zwei, drei Sätze reichen."></textarea></label>'+
      '<input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0">'+
      '<input type="hidden" name="_captcha" value="false"><input type="hidden" name="_template" value="table">'+
      '<input type="hidden" name="_subject" value="Neue Kurzanfrage über fabio-ecosystem">'+
      '<input type="hidden" name="_next" value="'+location.origin+(THANKS[sec]||'/danke.html')+'"><input type="hidden" name="_url" value="'+location.href+'">'+
      '<button class="fw-qc__send" type="submit">Anfrage senden</button><p class="fw-qc__note">Lieber direkt? <a href="mailto:fabiowitt@gmx.de">fabiowitt@gmx.de</a></p></form>';
    document.body.appendChild(d);
    d.querySelector('.fw-qc__x').addEventListener('click',function(){d.close();});
    d.addEventListener('click',function(e){if(e.target===d)d.close();});
    d.querySelector('form').addEventListener('submit',function(e){var f=e.target;if(!f.checkValidity())return;var b=f.querySelector('.fw-qc__send');b.textContent='Wird gesendet…';b.disabled=true;});
    return d;
  }
  var dialog=null;
  function openContact(e){
    if(typeof HTMLDialogElement==='undefined')return;
    if(e){e.preventDefault();}
    if(!dialog)dialog=buildDialog();
    dialog.showModal();
    setTimeout(function(){var i=dialog.querySelector('input[name="Name"]');if(i)i.focus();},30);
  }
  window.fwOpenContact=openContact;
  function init(){
    var nav=document.querySelector('[data-fw50-nav]');
    if(!nav||nav.dataset.ready)return;nav.dataset.ready='1';
    var dds=[].slice.call(nav.querySelectorAll('.fw50-dd'));
    var burger=nav.querySelector('.fw50-burger'),sheet=nav.querySelector('.fw50-sheet');
    function setDd(dd,open){var b=dd.querySelector('.fw50-dd__toggle'),p=dd.querySelector('.fw50-dd__panel');b.setAttribute('aria-expanded',String(open));p.classList.toggle('is-open',open);dd.classList.toggle('is-open',open);}
    function closeAll(except){dds.forEach(function(d){if(d!==except)setDd(d,false);});}
    dds.forEach(function(dd){
      var b=dd.querySelector('.fw50-dd__toggle');
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
      var open=dds.filter(function(d){return d.classList.contains('is-open');})[0];
      if(open){setDd(open,false);open.querySelector('.fw50-dd__toggle').focus();}
      if(burger&&burger.getAttribute('aria-expanded')==='true'){setSheet(false);burger.focus();}
    });
    var mq=window.matchMedia('(min-width:1101px)');
    var onChange=function(){if(mq.matches)setSheet(false);else closeAll();};
    if(mq.addEventListener)mq.addEventListener('change',onChange);else mq.addListener(onChange);
    window.addEventListener('pageshow',function(){setSheet(false);closeAll();});
    // Quick contact: the navbar button and any "contact" link open a short form instead of a long scroll.
    document.addEventListener('click',function(e){
      var a=e.target.closest('a');if(!a)return;
      if(a.hasAttribute('data-contact')||/#(kontakt|fabio-anfrage|sap-anfrage)$/.test(a.getAttribute('href')||'')){setSheet(false);openContact(e);}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
