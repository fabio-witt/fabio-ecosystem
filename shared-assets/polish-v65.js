/*
 * polish-v65: small touches for every page.
 * - A thin reading progress bar at the top of long pages
 * - A "back to top" button after scrolling down a long page
 * Both respect reduced motion and stay out of the way of forms.
 */
(function () {
  var en = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var css = '' +
    '.fw-progress{position:fixed;left:0;top:0;height:3px;width:100%;z-index:10000;pointer-events:none;' +
    'transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#0a8578,#6fd6c4)}' +
    '.fw-top{position:fixed;right:18px;bottom:18px;z-index:9000;width:46px;height:46px;border-radius:50%;border:0;cursor:pointer;' +
    'background:#0f2f52;color:#fff;font-size:20px;line-height:1;box-shadow:0 10px 26px rgba(15,35,60,.28);' +
    'opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .2s,transform .2s}' +
    '.fw-top.is-on{opacity:.92;transform:none;pointer-events:auto}.fw-top:hover{opacity:1}' +
    '@media (prefers-reduced-motion: reduce){.fw-top{transition:none}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function start() {
    var long = document.documentElement.scrollHeight > (window.innerHeight || 800) * 3;
    if (!long) return;
    var bar = document.createElement('div');
    bar.className = 'fw-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var top = document.createElement('button');
    top.type = 'button';
    top.className = 'fw-top';
    top.textContent = '↑';
    top.setAttribute('aria-label', en ? 'Back to top' : 'Nach oben');
    top.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    document.body.appendChild(top);
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY || document.documentElement.scrollTop;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      top.classList.toggle('is-on', y > window.innerHeight * 1.5);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  // Cookie-free visitor statistics, only when a domain is set in site-config.js.
  var analytics = (window.FW_SITE_CONFIG || {}).analytics || {};
  if (analytics.plausibleDomain && !document.querySelector('script[data-domain]')) {
    var plausible = document.createElement('script');
    plausible.defer = true;
    plausible.setAttribute('data-domain', analytics.plausibleDomain);
    plausible.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(plausible);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
