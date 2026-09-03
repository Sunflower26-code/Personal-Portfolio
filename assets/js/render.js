/* ============================================================
   Reads the per-project content files and builds:
     - the project cards on the home page (#work-grid)
     - the individual project page (project.html?p=<slug>)
   No build step. To add a project: create content/<slug>/project.js
   and add "<slug>" to content/manifest.js.
   ============================================================ */
(function () {
  'use strict';
  var doc = document;
  var store = (window.Portfolio = window.Portfolio || {});
  var order = window.PORTFOLIO_ORDER || [];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function assetPath(slug, file) { return 'content/' + slug + '/' + file; }
  function toArray(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* Load every project.js in manifest order, then run cb. */
  function loadProjects(slugs, cb) {
    var remaining = slugs.length;
    if (!remaining) { cb(); return; }
    slugs.forEach(function (slug) {
      var s = doc.createElement('script');
      s.src = assetPath(slug, 'project.js');
      s.onload = s.onerror = function () { if (--remaining === 0) cb(); };
      doc.head.appendChild(s);
    });
  }

  /* ---------- home cards ---------- */
  function coverMarkup(slug, p) {
    var flag = p.featured ? '<span class="featured-flag">Featured</span>' : '';
    if (p.cover) {
      // Optional hover video. The poster image is always the resting state.
      // preload="metadata" fetches only the header, so the clip is ready to
      // start on hover without downloading the whole file up front.
      var video = '', badge = '';
      if (p.coverVideo) {
        video = '<video class="cover-video" src="' + esc(assetPath(slug, p.coverVideo)) +
                '" muted loop playsinline preload="metadata" tabindex="-1" aria-hidden="true"></video>';
        badge = '<span class="motion-badge" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';
      }
      return '<div class="cover' + (p.coverVideo ? ' has-video' : '') + '">' + flag +
        '<img src="' + esc(assetPath(slug, p.cover)) + '" alt="' + esc(p.title) + '" loading="lazy">' +
        video + badge + '</div>';
    }
    // No photo yet: clean placeholder. Drop a photo in the folder and set "cover".
    return '<div class="cover">' + flag +
      '<div class="cover--placeholder">' +
        '<span class="pill">' + esc(p.kicker || 'Project') + '</span>' +
        '<span class="ttl">' + esc(p.title) + '</span>' +
      '</div></div>';
  }

  function tagsMarkup(tags) {
    return toArray(tags).map(function (t, i) {
      return '<span class="tag' + (i < 2 ? ' tag--accent' : '') + '">' + esc(t) + '</span>';
    }).join('');
  }

  function renderHome(container) {
    if (!order.length) {
      container.innerHTML = '<p class="work-empty">New projects are on the way. Check back soon.</p>';
      return;
    }
    var html = order.map(function (slug, i) {
      var p = store[slug];
      if (!p) return '';
      var href = 'project.html?p=' + encodeURIComponent(slug);
      var delay = Math.min(i, 5) * 60;
      return '<article class="work-card reveal' + (p.featured ? ' is-featured' : '') + '" data-reveal-delay="' + delay + '">' +
        coverMarkup(slug, p) +
        '<div class="body">' +
          '<div class="kicker">' + esc(p.kicker || '') + '</div>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p class="blurb">' + esc(p.blurb || '') + '</p>' +
          '<div class="tags">' + tagsMarkup(p.tags) + '</div>' +
          '<span class="card-cta">View project' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</span>' +
          '<a class="card-link" href="' + href + '" aria-label="' + esc(p.title) + '"></a>' +
        '</div>' +
      '</article>';
    }).join('');
    container.innerHTML = html;
    if (window.Motion) { window.Motion.scan(container); }
    if (window.Site) { window.Site.bindHoverVideo(container); }
  }

  /* ---------- project page ---------- */
  function linksMarkup(links) {
    return toArray(links).filter(function (l) { return l && l.href; }).map(function (l) {
      return '<a class="btn btn--ghost btn--sm" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>';
    }).join('');
  }
  function specMarkup(spec) {
    return toArray(spec).map(function (row) {
      return '<div class="spec-row"><span class="k">' + esc(row[0]) + '</span><span class="v">' + esc(row[1]) + '</span></div>';
    }).join('');
  }
  function figureMarkup(slug, fig) {
    var cap = fig.caption ? '<figcaption>' + esc(fig.caption) + '</figcaption>' : '';
    return '<figure class="figure"><img src="' + esc(assetPath(slug, fig.src)) + '" alt="' + esc(fig.caption || '') + '" loading="lazy" data-zoom>' + cap + '</figure>';
  }
  /* Optional table:  table: { head: ["A","B"], rows: [["1","2"]] }
     Wrapped so a wide table scrolls on its own instead of the page. */
  function tableMarkup(t) {
    if (!t || !t.rows || !t.rows.length) return '';
    var head = toArray(t.head);
    var out = '<div class="table-wrap"><table class="proj-table">';
    if (head.length) {
      out += '<thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>';
    }
    out += '<tbody>' + toArray(t.rows).map(function (r) {
      return '<tr>' + toArray(r).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    return out;
  }

  function sectionMarkup(slug, sec) {
    var out = '<section class="proj-section reveal" id="' + esc(sec.id || '') + '">';
    out += '<h2>' + esc(sec.heading) + '</h2>';
    toArray(sec.body).forEach(function (para) { out += '<p>' + esc(para) + '</p>'; });
    if (sec.list && sec.list.length) {
      out += '<ul>' + sec.list.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>';
    }
    out += tableMarkup(sec.table);
    var figs = toArray(sec.figures);
    if (figs.length === 1) { out += figureMarkup(slug, figs[0]); }
    else if (figs.length > 1) {
      out += '<div class="fig-grid">' + figs.map(function (f) { return figureMarkup(slug, f); }).join('') + '</div>';
    }
    out += '</section>';
    return out;
  }

  function renderProject(root, slug) {
    var p = store[slug];
    if (!p) { root.innerHTML = '<div class="wrap section"><p>Project not found. <a href="index.html">Back to home</a></p></div>'; return; }
    doc.title = p.title + ' | Caitlin Fields';

    var sections = toArray(p.sections);
    var toc = sections.filter(function (s) { return s.id && s.heading; })
      .map(function (s) { return '<a href="#' + esc(s.id) + '">' + esc(s.heading) + '</a>'; }).join('');

    var heroImg = p.hero || p.cover;
    var heroMarkup = heroImg
      ? '<div class="proj-hero-img reveal"><img src="' + esc(assetPath(slug, heroImg)) + '" alt="' + esc(p.title) + '" data-zoom></div>'
      : '';

    var links = linksMarkup(p.links);
    var spec = specMarkup(p.spec);

    root.innerHTML =
      '<div class="wrap proj-top">' +
        '<a class="back-link" href="index.html#work"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m0 0l6-6m-6 6l6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>All work</a>' +
        '<header class="proj-header reveal">' +
          '<div>' +
            '<div class="kicker">' + esc(p.kicker || '') + '</div>' +
            '<h1>' + esc(p.title) + '</h1>' +
            '<p class="tagline">' + esc(p.tagline || '') + '</p>' +
            (links ? '<div class="proj-links" style="margin-top:1.4rem">' + links + '</div>' : '') +
          '</div>' +
          (spec ? '<div class="spec">' + spec + '</div>' : '') +
        '</header>' +
        heroMarkup +
        '<div class="proj-body">' +
          (toc ? '<nav class="proj-toc" id="projToc">' + toc + '</nav>' : '<div></div>') +
          '<div>' + sections.map(function (s) { return sectionMarkup(slug, s); }).join('') + '</div>' +
        '</div>' +
      '</div>';

    if (window.Motion) { window.Motion.scan(root); }
    if (window.Site) {
      window.Site.bindZoom(root);
      window.Site.initSpy('#projToc');
    }
  }

  /* ---------- boot ---------- */
  doc.addEventListener('DOMContentLoaded', function () {
    var homeGrid = doc.getElementById('work-grid');
    var projRoot = doc.getElementById('project-root');

    if (projRoot) {
      var slug = getParam('p');
      loadProjects(slug ? [slug] : order, function () { renderProject(projRoot, slug); });
    } else if (homeGrid) {
      loadProjects(order, function () { renderHome(homeGrid); });
    }
  });
})();
