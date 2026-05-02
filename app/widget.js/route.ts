import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(WIDGET, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

const WIDGET = String.raw`
(function () {
  var script = document.currentScript;
  var listingId = (script && script.getAttribute('data-listing-id')) || 'demo-123';
  var origin = (script && new URL(script.src).origin) || window.location.origin;

  // load Fraunces for the serif look
  if (!document.getElementById('lemma-fonts')) {
    var f = document.createElement('link');
    f.id = 'lemma-fonts';
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500&display=swap';
    document.head.appendChild(f);
  }

  var ART = {
    family:   { tag: 'FAMILY',   kind: 'WARM',  img: 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=1000&q=80' },
    couple:   { tag: 'COUPLE',   kind: 'QUIET', img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1000&q=80' },
    remote:   { tag: 'REMOTE',   kind: 'FOCUS', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&q=80' },
    business: { tag: 'BUSINESS', kind: 'SHARP', img: 'https://images.unsplash.com/photo-1551776235-dde6d4829807?w=1000&q=80' }
  };

  var css = ` + "`" + `
  .lm-fab{position:fixed;bottom:24px;right:24px;z-index:2147483646;background:#000;color:#f4efe6;border:1px solid rgba(244,239,230,.15);border-radius:9999px;padding:12px 18px;font:500 12px/1 Inter,system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;box-shadow:0 20px 50px rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;gap:10px}
  .lm-fab:hover{background:#0a0a0a}
  .lm-dot{width:6px;height:6px;border-radius:9999px;background:#f4efe6;box-shadow:0 0 0 4px rgba(244,239,230,.12)}

  .lm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s}
  .lm-overlay.show{opacity:1}
  .lm-modal{position:relative;background:#000;color:#f4efe6;border:1px solid rgba(244,239,230,.1);border-radius:28px;max-width:560px;width:100%;padding:36px;font-family:Inter,system-ui,sans-serif;transform:translateY(12px) scale(.98);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
  .lm-overlay.show .lm-modal{transform:translateY(0) scale(1)}
  .lm-eyebrow{font:500 10px/1 Inter,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:rgba(244,239,230,.55);margin-bottom:14px}
  .lm-title{font:600 32px/1.1 Fraunces,Georgia,serif;letter-spacing:-.01em;margin:0 0 8px}
  .lm-title em{font-style:italic;font-weight:500;color:rgba(244,239,230,.85)}
  .lm-sub{font:400 14px/1.5 Inter,sans-serif;color:rgba(244,239,230,.6);margin:0 0 24px;max-width:420px}
  .lm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .lm-opt{position:relative;height:140px;border-radius:18px;overflow:hidden;border:1px solid rgba(244,239,230,.1);cursor:pointer;background:#111;transition:transform .25s, border-color .2s}
  .lm-opt:hover{transform:translateY(-3px);border-color:rgba(244,239,230,.5)}
  .lm-opt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;transition:opacity .25s, transform .4s}
  .lm-opt:hover img{opacity:.75;transform:scale(1.06)}
  .lm-opt-grad{position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.1))}
  .lm-opt-top{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center}
  .lm-opt-tag{font:500 9px/1 Inter,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:rgba(244,239,230,.85)}
  .lm-opt-kind{font:500 9px/1 Inter,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:rgba(244,239,230,.85);padding:5px 7px;border:1px solid rgba(244,239,230,.4);border-radius:6px}
  .lm-opt-name{position:absolute;left:14px;bottom:12px;font:600 18px/1.1 Fraunces,serif;color:#f4efe6}
  .lm-close{position:absolute;top:18px;right:18px;width:32px;height:32px;border-radius:9999px;background:rgba(244,239,230,.06);border:none;color:#f4efe6;font-size:16px;cursor:pointer;display:grid;place-items:center}
  .lm-close:hover{background:rgba(244,239,230,.12)}
  .lm-brand{display:flex;align-items:center;gap:6px;font:500 10px/1 Inter,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:rgba(244,239,230,.4);margin-top:24px;justify-content:center}
  .lm-brand b{color:#f4efe6;font-family:Fraunces,serif;font-style:italic;font-weight:500;letter-spacing:0;text-transform:none;font-size:13px}

  .lm-card{margin:32px 0;position:relative;border-radius:28px;overflow:hidden;background:#000;color:#f4efe6;font-family:Inter,system-ui,sans-serif;box-shadow:0 30px 80px rgba(0,0,0,.4);border:1px solid rgba(244,239,230,.1)}
  .lm-video{width:100%;aspect-ratio:16/9;background:#000;display:block;object-fit:cover}
  .lm-body{padding:24px 28px 28px}
  .lm-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
  .lm-tab{font:500 10px/1 Inter,sans-serif;letter-spacing:.22em;text-transform:uppercase;padding:9px 14px;border-radius:9999px;border:1px solid rgba(244,239,230,.15);background:transparent;color:rgba(244,239,230,.7);cursor:pointer;transition:all .2s}
  .lm-tab:hover{color:#f4efe6;border-color:rgba(244,239,230,.4)}
  .lm-tab.active{background:#f4efe6;color:#000;border-color:#f4efe6}
  .lm-h{font:600 28px/1.15 Fraunces,serif;letter-spacing:-.01em;margin:0 0 6px}
  .lm-h em{font-style:italic;font-weight:500;color:rgba(244,239,230,.85)}
  .lm-d{font:italic 400 16px/1.5 Fraunces,Georgia,serif;color:rgba(244,239,230,.7);margin:0 0 22px;max-width:560px}
  .lm-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .lm-cta{background:#f4efe6;color:#000;border:none;padding:13px 22px;border-radius:9999px;font:500 13px/1 Inter,sans-serif;letter-spacing:.04em;cursor:pointer}
  .lm-cta:hover{background:#fff}
  .lm-meta{font:500 10px/1 Inter,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:rgba(244,239,230,.45)}
  ` + "`" + `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var listing = null;

  fetch(origin + '/api/generate?listingId=' + encodeURIComponent(listingId))
    .then(function (r) { return r.json(); })
    .then(function (data) { listing = data; openModal(); });

  var fab = document.createElement('button');
  fab.className = 'lm-fab';
  fab.innerHTML = '<span class="lm-dot"></span> See your stay';
  fab.onclick = openModal;
  document.body.appendChild(fab);

  function openModal() {
    if (!listing) return;
    var overlay = document.createElement('div');
    overlay.className = 'lm-overlay';
    overlay.innerHTML = ` + "`" + `
      <div class="lm-modal">
        <button class="lm-close" aria-label="Close">×</button>
        <div class="lm-eyebrow">Adaptive listing</div>
        <h2 class="lm-title">Who's traveling <em>with you?</em></h2>
        <p class="lm-sub">We'll show you the version of this stay that fits — same home, told four ways.</p>
        <div class="lm-grid"></div>
        <div class="lm-brand">Powered by <b>Lemma</b></div>
      </div>` + "`" + `;
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });

    var grid = overlay.querySelector('.lm-grid');
    listing.personas.forEach(function (p) {
      var art = ART[p.id] || {};
      var b = document.createElement('button');
      b.className = 'lm-opt';
      b.innerHTML = ` + "`" + `
        <img src="${art.img||''}" alt="" />
        <div class="lm-opt-grad"></div>
        <div class="lm-opt-top">
          <span class="lm-opt-tag">${esc(art.tag||p.name)}</span>
          <span class="lm-opt-kind">${esc(art.kind||'')}</span>
        </div>
        <div class="lm-opt-name">${esc(p.name)}</div>` + "`" + `;
      b.onclick = function () { close(); renderPlayer(p.id); };
      grid.appendChild(b);
    });

    overlay.querySelector('.lm-close').onclick = close;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    function close() {
      overlay.classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 280);
    }
  }

  function renderPlayer(personaId) {
    var existing = document.getElementById('lm-card');
    if (existing) existing.remove();

    var card = document.createElement('div');
    card.id = 'lm-card';
    card.className = 'lm-card';
    card.innerHTML = ` + "`" + `
      <video class="lm-video" autoplay muted loop playsinline></video>
      <div class="lm-body">
        <div class="lm-meta" data-meta></div>
        <h3 class="lm-h" data-h></h3>
        <p class="lm-d" data-d></p>
        <div class="lm-tabs"></div>
        <div class="lm-row">
          <button class="lm-cta">Book this stay →</button>
          <span class="lm-meta">Adapted for you · by Lemma</span>
        </div>
      </div>` + "`" + `;

    var anchor = document.getElementById('lemma-widget-anchor');
    if (anchor) anchor.appendChild(card); else document.body.appendChild(card);

    var video = card.querySelector('video');
    var tabs = card.querySelector('.lm-tabs');
    var h = card.querySelector('[data-h]');
    var d = card.querySelector('[data-d]');
    var meta = card.querySelector('[data-meta]');

    function update(id) {
      var p = listing.personas.find(function (x) { return x.id === id; }) || listing.personas[0];
      var art = ART[p.id] || {};
      video.src = p.videoUrl;
      h.innerHTML = '<em>' + esc(p.tagline) + '</em>';
      d.textContent = p.script || p.description;
      meta.textContent = (art.tag || p.name) + '  ·  ' + (art.kind || '');
      Array.from(tabs.children).forEach(function (el) {
        el.classList.toggle('active', el.dataset.id === p.id);
      });
    }

    listing.personas.forEach(function (p) {
      var t = document.createElement('button');
      t.className = 'lm-tab';
      t.dataset.id = p.id;
      t.textContent = p.name;
      t.onclick = function () { update(p.id); };
      tabs.appendChild(t);
    });

    card.querySelector('.lm-cta').onclick = function () { alert('Booking flow — demo only.'); };

    update(personaId);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
})();
`;
