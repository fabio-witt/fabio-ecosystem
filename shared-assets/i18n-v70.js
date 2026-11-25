/* Fabio Ecosystem - English / German.
 * English is the default; the "EN | DE" switch in the menu changes it and is remembered.
 * The German page is the original. For English, every text and a few attributes are
 * looked up in /shared-assets/i18n-en-v70.json (German text -> English text).
 * Pages without a full translation show a short note that they are German only.
 */
(function(){
  'use strict';
  var KEY='fabio-lang';
  var DICT_URL='/shared-assets/i18n-en-v70.json';
  function read(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function store(v){try{localStorage.setItem(KEY,v);}catch(e){}}
  var param=null;
  try{param=new URL(location.href).searchParams.get('lang');}catch(e){}
  if(param==='en'||param==='de')store(param);
  var lang=(param==='en'||param==='de')?param:(read()==='de'?'de':'en');
  // Old Google-Translate cookie from earlier versions.
  document.cookie='googtrans=;path=/;max-age=0';
  document.documentElement.setAttribute('lang',lang);

  var ATTRS=['placeholder','aria-label','title','alt','data-open','data-close'];
  var dict=null, pages=[], observer=null;

  function norm(s){return s.replace(/\s+/g,' ').trim();}
  function tr(text){
    if(!text)return null;
    var key=norm(text);
    if(!key||!Object.prototype.hasOwnProperty.call(dict,key))return null;
    var lead=text.match(/^\s*/)[0], tail=text.match(/\s*$/)[0];
    return lead+dict[key]+tail;
  }
  function skip(el){
    for(var n=el;n&&n.nodeType===1;n=n.parentNode){
      var tag=n.tagName;
      if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT'||tag==='CODE'||tag==='PRE')return true;
      if(n.hasAttribute('data-no-i18n'))return true;
    }
    return false;
  }
  function attrs(el){
    for(var i=0;i<ATTRS.length;i++){
      var a=ATTRS[i];
      if(!el.hasAttribute(a))continue;
      var v=tr(el.getAttribute(a));
      if(v!==null)el.setAttribute(a,v);
    }
    if(el.tagName==='INPUT'&&(el.type==='submit'||el.type==='button')&&el.value){
      var b=tr(el.value);if(b!==null)el.value=b;
    }
  }
  function text(node){
    var r=tr(node.nodeValue);
    if(r!==null&&r!==node.nodeValue)node.nodeValue=r;
  }
  function walk(root){
    if(!dict||!root)return;
    if(root.nodeType===3){if(root.parentNode&&!skip(root.parentNode))text(root);return;}
    if(root.nodeType!==1||skip(root))return;
    attrs(root);
    var tw=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,null),node;
    while((node=tw.nextNode())){
      if(node.nodeType===3){if(!skip(node.parentNode))text(node);}
      else if(!skip(node))attrs(node);
    }
  }
  function translateHead(){
    var t=tr(document.title);if(t!==null)document.title=t;
    var metas=document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]');
    for(var i=0;i<metas.length;i++){var c=tr(metas[i].getAttribute('content')||'');if(c!==null)metas[i].setAttribute('content',c);}
  }
  function pagePath(){
    var p=location.pathname.replace(/index(\.html)?$/,'').replace(/\.html$/,'');
    if(p.length>1)p=p.replace(/\/$/,'');
    return p||'/';
  }
  function germanOnlyNote(){
    if(pages.indexOf(pagePath())>=0||document.querySelector('.fw-de-only'))return;
    var note=document.createElement('div');
    note.className='fw-de-only';note.setAttribute('data-no-i18n','');
    note.textContent='🇩🇪 This page is currently only available in German. Switch to DE at the top for the original.';
    var header=document.querySelector('header');
    if(header&&header.parentNode)header.parentNode.insertBefore(note,header.nextSibling);
    else document.body.insertBefore(note,document.body.firstChild);
  }
  function run(){
    translateHead();
    walk(document.body);
    germanOnlyNote();
    if(!observer&&window.MutationObserver){
      // Menus, the contact dialog and "show more" buttons are added by scripts later.
      observer=new MutationObserver(function(list){
        for(var i=0;i<list.length;i++){
          var m=list[i];
          if(m.type==='characterData'){walk(m.target);continue;}
          if(m.type==='attributes'){if(!skip(m.target))attrs(m.target);continue;}
          for(var j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j]);
        }
      });
      observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
    }
    document.documentElement.classList.remove('fw-translating');
  }

  function setLang(next){
    store(next);
    var url=new URL(location.href);url.searchParams.delete('lang');
    location.href=url.toString();
  }
  function makeSwitch(extra){
    var wrap=document.createElement('div');
    wrap.className='fw-lang'+(extra?' '+extra:'');wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Language / Sprache');
    wrap.setAttribute('data-no-i18n','');
    ['en','de'].forEach(function(code){
      var b=document.createElement('button');b.type='button';b.textContent=code.toUpperCase();
      b.className='fw-lang__btn'+(code===lang?' is-active':'');
      b.setAttribute('aria-pressed',code===lang?'true':'false');
      b.setAttribute('aria-label',code==='en'?'English':'Deutsch');
      b.addEventListener('click',function(){if(code!==lang)setLang(code);});
      wrap.appendChild(b);
    });
    return wrap;
  }
  function addStyles(){
    if(document.getElementById('fw-lang-css'))return;
    var st=document.createElement('style');st.id='fw-lang-css';
    st.textContent='.fw-lang{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid rgba(20,55,95,.18);border-radius:999px;background:rgba(255,255,255,.92);flex:0 0 auto;margin:0 6px}'+
      '.fw-lang__btn{font:inherit;font-size:12px;font-weight:800;letter-spacing:.04em;border:0;background:transparent;color:#14375f;padding:6px 9px;border-radius:999px;cursor:pointer;line-height:1}'+
      '.fw-lang__btn.is-active{background:#14375f;color:#fff}'+
      '.fw-lang__btn:focus-visible{outline:3px solid rgba(20,154,114,.35);outline-offset:2px}'+
      '.fw-lang--mobile{margin-left:auto}'+
      '@media(min-width:1101px){.fw-lang--mobile{display:none}}'+
      '.fw-de-only{background:#fff7e0;color:#5a4300;border-bottom:1px solid #f0dc9c;text-align:center;font-size:14px;line-height:1.4;padding:8px 16px}'+
      'html.fw-translating body{opacity:0}'+
      'body{transition:opacity .15s ease}';
    document.head.appendChild(st);
  }
  function insertSwitches(){
    var desktop=document.querySelector('.fw50-menu');
    if(desktop&&!desktop.querySelector('.fw-lang')){
      var cta=desktop.querySelector('.fw50-cta');
      if(cta)desktop.insertBefore(makeSwitch(),cta);else desktop.appendChild(makeSwitch());
    }
    var burger=document.querySelector('.fw50-burger');
    if(burger&&burger.parentNode&&!document.querySelector('.fw-lang--mobile')){
      burger.parentNode.insertBefore(makeSwitch('fw-lang--mobile'),burger);
    }
    if(!desktop&&!burger&&!document.querySelector('.fw-lang')){
      var header=document.querySelector('header');
      if(header)header.appendChild(makeSwitch());
    }
  }

  addStyles();
  if(lang==='en'){
    document.documentElement.classList.add('fw-translating');
    // Never hide the page for long, even on a slow connection.
    setTimeout(function(){document.documentElement.classList.remove('fw-translating');},1200);
  }
  function start(){
    insertSwitches();
    if(lang!=='en')return;
    fetch(DICT_URL).then(function(r){return r.json();}).then(function(data){
      dict=data.t||{};pages=data.pages||[];run();
    }).catch(function(){document.documentElement.classList.remove('fw-translating');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
