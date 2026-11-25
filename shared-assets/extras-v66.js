/*
 * extras-v66: fills page parts from shared-assets/site-config.js.
 * - [data-fw-booking="key"]: calendar booking links (hidden until a link is set)
 * - [data-fw-references="key"]: customer quotes (hidden while the list is empty)
 * - [data-fw-portfolio]: drone and video work (hidden while the list is empty)
 */
(function () {
  var config = window.FW_SITE_CONFIG || {};
  function esc(text) {
    return String(text || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function safeUrl(url) { return /^https:\/\//i.test(url || '') ? url : ''; }

  var css = '' +
    '.fw-refs{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-top:18px}' +
    '.fw-ref{margin:0;padding:22px;border-radius:20px;background:#fff;border:1px solid rgba(20,55,95,.12);box-shadow:0 8px 24px rgba(15,35,60,.06)}' +
    '.fw-ref blockquote{margin:0 0 12px;font-size:17px;line-height:1.5}.fw-ref figcaption{font-size:14px;opacity:.75}.fw-ref figcaption b{opacity:1}' +
    '.fw-portfolio{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin:18px 0 26px}' +
    '.fw-portfolio figure{margin:0}.fw-portfolio .fw-frame{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#0b2240}' +
    '.fw-portfolio iframe,.fw-portfolio video{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    '.fw-portfolio figcaption{margin-top:8px;font-weight:700}' +
    '.fw-showreel .fw-frame{position:relative;aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:#0b2240;margin-top:22px}' +
    '.fw-showreel iframe,.fw-showreel video{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    '.fw-profile-links{display:flex;flex-wrap:wrap;gap:10px}.fw-profile-link{display:inline-flex;align-items:center;min-height:42px;padding:0 16px;border-radius:12px;font-weight:800;text-decoration:none;background:#fff;color:#0f2f52;border:1.5px solid rgba(15,47,82,.2)}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function embed(url) {
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/);
    if (yt) return '<iframe loading="lazy" allowfullscreen title="Video" src="https://www.youtube-nocookie.com/embed/' + yt[1] + '"></iframe>';
    var vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return '<iframe loading="lazy" allowfullscreen title="Video" src="https://player.vimeo.com/video/' + vimeo[1] + '"></iframe>';
    if (/\.mp4($|\?)/i.test(url)) return '<video controls preload="metadata" playsinline src="' + esc(url) + '"></video>';
    return '';
  }

  function start() {
    var booking = config.booking || {};
    document.querySelectorAll('[data-fw-booking]').forEach(function (el) {
      var url = safeUrl(booking[el.getAttribute('data-fw-booking')]);
      if (!url) return;
      el.setAttribute('href', url);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
      el.hidden = false;
      el.style.display = '';
    });
    var refs = config.references || {};
    document.querySelectorAll('[data-fw-references]').forEach(function (box) {
      var list = (refs[box.getAttribute('data-fw-references')] || []).filter(function (r) { return r && r.quote && r.name; });
      if (!list.length) return;
      var target = box.querySelector('.fw-refs') || box;
      target.innerHTML = list.map(function (r) {
        return '<figure class="fw-ref"><blockquote>„' + esc(r.quote) + '“</blockquote><figcaption><b>' + esc(r.name) + '</b>' + (r.role ? ' · ' + esc(r.role) : '') + '</figcaption></figure>';
      }).join('');
      box.hidden = false;
      box.style.display = '';
    });
    document.querySelectorAll('[data-fw-portfolio]').forEach(function (box) {
      var items = (config.portfolio || []).map(function (p) { return { title: p && p.title, html: embed(safeUrl(p && p.url)) }; }).filter(function (p) { return p.html; });
      if (!items.length) return;
      var target = box.querySelector('.fw-portfolio') || box;
      target.innerHTML = items.map(function (p) {
        return '<figure><div class="fw-frame">' + p.html + '</div>' + (p.title ? '<figcaption>' + esc(p.title) + '</figcaption>' : '') + '</figure>';
      }).join('');
      box.hidden = false;
      box.style.display = '';
    });
  }
  function extras() {
    var reel = safeUrl(config.showreel);
    document.querySelectorAll('[data-fw-showreel]').forEach(function (box) {
      var html = reel && embed(reel);
      if (!html) return;
      var target = box.querySelector('.fw-frame') || box;
      target.innerHTML = html;
      box.hidden = false;
      box.style.display = '';
    });
    var profiles = config.profiles || {};
    var names = { linkedin: 'LinkedIn', malt: 'Malt', freelancermap: 'freelancermap', gulp: 'GULP' };
    document.querySelectorAll('[data-fw-profiles]').forEach(function (box) {
      var links = Object.keys(names).map(function (key) {
        var url = safeUrl(profiles[key]);
        return url ? '<a class="fw-profile-link" href="' + esc(url) + '" target="_blank" rel="noopener">' + names[key] + ' ↗</a>' : '';
      }).join('');
      if (!links) return;
      var target = box.querySelector('.fw-profile-links') || box;
      target.innerHTML = links;
      box.hidden = false;
      box.style.display = '';
    });
  }
  var startAll = function () { start(); extras(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startAll);
  else startAll();
})();
