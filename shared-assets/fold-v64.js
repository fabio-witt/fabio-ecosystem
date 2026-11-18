/*
 * fold-v64: keeps long pages short.
 *
 * 1. Very long sections show a preview with "Mehr anzeigen" (all text stays
 *    in the page, so search engines and Ctrl+F links still work).
 * 2. Very long pages get an "Auf dieser Seite" jump menu after the hero.
 *
 * Opt out per section with data-nofold, per page with <body data-nofold>.
 */
(function () {
  if (document.body && document.body.hasAttribute('data-nofold')) return;
  var en = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var TEXT = en
    ? { more: 'Show more', less: 'Show less', toc: 'On this page' }
    : { more: 'Mehr anzeigen', less: 'Weniger anzeigen', toc: 'Auf dieser Seite' };

  var css = '' +
    '.fw-fold{position:relative;overflow:hidden;transition:max-height .45s ease}' +
    '.fw-fold::after{content:"";position:absolute;left:0;right:0;bottom:0;height:160px;pointer-events:none;' +
    'background:linear-gradient(to bottom,rgba(255,255,255,0),var(--fw-fold-bg,#fff))}' +
    '.fw-fold.is-open{max-height:none!important}.fw-fold.is-open::after{display:none}' +
    '.fw-fold-btn-wrap{display:flex;justify-content:center;margin:0;padding:6px 0 36px;position:relative;z-index:2}' +
    '.fw-fold-btn{font:inherit;font-weight:700;cursor:pointer;border:1.5px solid currentColor;background:#fff;color:#14375f;' +
    'border-radius:999px;padding:10px 22px;box-shadow:0 6px 18px rgba(15,35,60,.12)}' +
    '.fw-fold-btn:hover{transform:translateY(-1px)}' +
    '.fw-toc{position:relative;z-index:3;max-width:1180px;margin:22px auto 4px;padding:0 20px}' +
    '.fw-toc__label{display:block;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.65;margin-bottom:8px}' +
    '.fw-toc__list{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}' +
    '.fw-toc__list a{flex:0 0 auto;text-decoration:none;font-weight:600;font-size:.92rem;padding:8px 14px;border-radius:999px;' +
    'border:1px solid rgba(20,55,95,.18);background:rgba(255,255,255,.85);color:#14375f;white-space:nowrap}' +
    '.fw-toc__list a:hover{border-color:#14375f}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function topSections() {
    var all = Array.prototype.slice.call(document.querySelectorAll('main section, body > section'));
    return all.filter(function (s) {
      var p = s.parentElement;
      while (p) { if (p.tagName === 'SECTION') return false; p = p.parentElement; }
      return true;
    });
  }

  function skip(s, index) {
    if (index === 0 || s.hasAttribute('data-nofold')) return true;
    var name = ((s.id || '') + ' ' + (s.className || '')).toLowerCase();
    if (/hero|cta|final|anfrage|kontakt|contact|form|faq|footer/.test(name)) return true;
    if (s.querySelector('form, textarea, select, iframe, video')) return true;
    return false;
  }

  function background(el) {
    while (el && el !== document.documentElement) {
      var bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
      el = el.parentElement;
    }
    return '#fff';
  }

  function open(section, button) {
    section.classList.add('is-open');
    if (button) { button.textContent = TEXT.less + ' ▴'; button.setAttribute('aria-expanded', 'true'); }
  }

  function fold() {
    var vh = window.innerHeight || 800;
    var page = document.documentElement.scrollHeight;
    if (page < vh * 5) return;
    var sections = topSections();
    var limit = Math.max(640, Math.round(vh * 0.95));
    sections.forEach(function (s, index) {
      if (skip(s, index) || s.offsetHeight < Math.max(limit * 1.6, 1100)) return;
      s.classList.add('fw-fold');
      var bg = background(s);
      s.style.setProperty('--fw-fold-bg', bg);
      s.style.maxHeight = limit + 'px';
      var wrap = document.createElement('div');
      wrap.className = 'fw-fold-btn-wrap';
      wrap.style.background = bg;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'fw-fold-btn';
      button.setAttribute('aria-expanded', 'false');
      button.textContent = TEXT.more + ' ▾';
      button.addEventListener('click', function () {
        if (s.classList.contains('is-open')) {
          s.classList.remove('is-open');
          button.textContent = TEXT.more + ' ▾';
          button.setAttribute('aria-expanded', 'false');
          s.scrollIntoView({ block: 'start' });
        } else open(s, button);
      });
      wrap.appendChild(button);
      s.parentNode.insertBefore(wrap, s.nextSibling);
      s._fwButton = button;
      // Typing in a search field or using a filter inside: show everything.
      s.addEventListener('input', function () { open(s, button); });
      s.addEventListener('click', function (event) {
        var t = event.target;
        if (t && t.closest && t.closest('[data-filter],[data-blog-filter],.filter,button[role="tab"]')) open(s, button);
      });
    });
    return sections;
  }

  function slug(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  }

  function toc(sections) {
    var vh = window.innerHeight || 800;
    if (!sections || !sections[0] || document.documentElement.scrollHeight < vh * 8 || document.querySelector('.fw-toc')) return;
    // Pages whose hero already has jump links do not need a second menu.
    if (sections[0].querySelectorAll('a[href^="#"]').length >= 3) return;
    var items = [];
    sections.forEach(function (s, index) {
      if (index === 0) return;
      var h = s.querySelector('h2');
      var name = ((s.id || '') + ' ' + (s.className || '')).toLowerCase();
      if (!h || /cta|final|mehr|footer/.test(name)) return;
      if (!s.id) s.id = 'abschnitt-' + slug(h.textContent || String(index));
      var label = (h.textContent || '').replace(/\s+/g, ' ').trim();
      if (label.length > 38) label = label.slice(0, 36).replace(/\s+\S*$/, '') + ' …';
      items.push('<a href="#' + s.id + '">' + label.replace(/</g, '&lt;') + '</a>');
    });
    if (items.length < 4) return;
    var nav = document.createElement('nav');
    nav.className = 'fw-toc';
    nav.setAttribute('aria-label', TEXT.toc);
    nav.innerHTML = '<span class="fw-toc__label">' + TEXT.toc + '</span><div class="fw-toc__list">' + items.slice(0, 10).join('') + '</div>';
    // Before the first content section: elements right after the hero often
    // overlap it on purpose (stat cards with negative margins).
    var anchor = sections[1];
    anchor.parentNode.insertBefore(nav, anchor);
  }

  // A link to something inside a folded section opens it first.
  function reveal(hash) {
    if (!hash || hash.length < 2) return;
    var target;
    try { target = document.querySelector(decodeURIComponent(hash)); } catch (e) { return; }
    var folded = target && target.closest && target.closest('.fw-fold');
    if (folded && !folded.classList.contains('is-open')) {
      open(folded, folded._fwButton);
      setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 60);
    }
  }

  function start() {
    var sections = fold();
    toc(sections || topSections());
    reveal(location.hash);
    window.addEventListener('hashchange', function () { reveal(location.hash); });
    document.addEventListener('click', function (event) {
      var a = event.target && event.target.closest && event.target.closest('a[href^="#"]');
      if (a) reveal(a.getAttribute('href'));
    });
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
