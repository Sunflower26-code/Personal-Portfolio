/* ============================================================
   Builds the print/PDF version of the portfolio.
   ------------------------------------------------------------
   Content is read from the live site rather than duplicated:
     - the profile sections are pulled out of index.html
     - the projects are read from content/<slug>/project.js
   So editing the site updates the PDF, with nothing to keep in sync.

   When the document is fully rendered and every image has decoded,
   this sets  <html data-export-ready="1">.  The PDF script waits on
   that flag so it never prints a half-loaded page.
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
  function toArray(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function assetPath(slug, file) { return 'content/' + slug + '/' + file; }
  function txt(node) { return node ? node.textContent.trim().replace(/\s+/g, ' ') : ''; }
  function all(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }

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

  /* ---------- pull the profile out of index.html ---------- */
  function readSite(html) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    var out = {};

    out.name = txt(d.querySelector('.hero .h-display')) || 'Caitlin Fields';
    out.roles = all(d.querySelector('.hero .hero-role'), 'span')
      .filter(function (s) { return !s.classList.contains('sep'); })
      .map(txt).filter(Boolean);
    out.summary = txt(d.querySelector('.hero .hero-text'));

    out.stats = all(d, '.stats .stat').map(function (s) {
      return { num: txt(s.querySelector('.num')), label: txt(s.querySelector('.label')) };
    });

    out.about = all(d.querySelector('#about .prose'), 'p').map(function (p) { return p.innerHTML; });

    out.experience = all(d, '#experience .exp-item').map(function (it) {
      var when = it.querySelector('.exp-when');
      var loc = when ? when.querySelector('.loc') : null;
      var whenText = when ? txt(when) : '';
      var locText = txt(loc);
      if (locText && whenText.endsWith(locText)) {
        whenText = whenText.slice(0, -locText.length).trim();
      }
      return {
        when: whenText, loc: locText,
        org: txt(it.querySelector('h3')),
        role: txt(it.querySelector('.role')),
        bullets: all(it, 'li').map(txt)
      };
    });

    out.toolbox = all(d, '#toolbox .tool-group').map(function (g) {
      return { heading: txt(g.querySelector('h3')), chips: all(g, '.chip').map(txt) };
    });

    out.education = all(d, '#education .card').map(function (c) {
      return {
        kicker: txt(c.querySelector('.kicker')),
        title: txt(c.querySelector('h3')),
        sub: txt(c.querySelector('.sub')),
        items: all(c, 'li').map(function (li) { return li.innerHTML; })
      };
    });

    // Contact details, taken from the real links so they cannot drift.
    var mail = d.querySelector('#contact a[href^="mailto:"]');
    var tel = d.querySelector('#contact a[href^="tel:"]');
    out.contact = {
      email: mail ? mail.getAttribute('href').replace('mailto:', '') : '',
      phone: tel ? txt(tel) : '',
      linkedin: (function () {
        var a = d.querySelector('#contact a[href*="linkedin"]') || d.querySelector('a[href*="linkedin"]');
        return a ? a.getAttribute('href') : '';
      })(),
      github: (function () {
        var a = d.querySelector('#contact a[href*="github.com"]') || d.querySelector('a[href*="github.com"]');
        return a ? a.getAttribute('href') : '';
      })(),
      location: (function () {
        var spans = all(d, '#contact .contact-meta span');
        return spans.length ? txt(spans[spans.length - 1]) : '';
      })()
    };
    return out;
  }

  /* ---------- render: cover ---------- */
  function coverPage(site) {
    var roles = site.roles.map(function (r, i) {
      return (i ? '<span class="sep">/</span>' : '') + '<span>' + esc(r) + '</span>';
    }).join('');

    var c = site.contact;
    var items = [
      c.email && { k: 'Email', v: esc(c.email) },
      c.phone && { k: 'Phone', v: esc(c.phone) },
      c.linkedin && { k: 'LinkedIn', v: esc(c.linkedin.replace(/^https?:\/\/(www\.)?/, '')) },
      c.github && { k: 'GitHub', v: esc(c.github.replace(/^https?:\/\/(www\.)?/, '')) },
      c.location && { k: 'Location', v: esc(c.location) }
    ].filter(Boolean).map(function (i) {
      return '<div class="item"><span class="k">' + i.k + '</span>' + i.v + '</div>';
    }).join('');

    var stats = site.stats.map(function (s) {
      return '<div class="stat"><div class="num">' + esc(s.num) + '</div>' +
             '<div class="label">' + esc(s.label) + '</div></div>';
    }).join('');

    return '<section class="page cover">' +
      '<div class="cover-main">' +
        '<img class="logo" src="images/logo.png" alt="">' +
        '<h1>' + esc(site.name) + '</h1>' +
        '<div class="roles">' + roles + '</div>' +
        '<div class="rule-accent"></div>' +
        '<p class="summary">' + esc(site.summary) + '</p>' +
        (stats ? '<div class="cover-stats">' + stats + '</div>' : '') +
      '</div>' +
      (items ? '<div class="cover-contact">' + items + '</div>' : '') +
    '</section>';
  }

  /* ---------- render: profile page ---------- */
  function profilePage(site) {
    var out = '<section class="page">';

    if (site.about.length) {
      out += '<div class="sec"><p class="eyebrow">About</p><h2>Background</h2>' +
             '<div class="prose">' + site.about.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
             '</div></div>';
    }

    if (site.experience.length) {
      out += '<div class="sec"><p class="eyebrow">Experience</p><h2>Work history</h2>';
      site.experience.forEach(function (e) {
        out += '<div class="exp-item">' +
          '<div class="exp-when">' + esc(e.when) + (e.loc ? '<span class="loc">' + esc(e.loc) + '</span>' : '') + '</div>' +
          '<div class="exp-body"><h3>' + esc(e.org) + '</h3>' +
            (e.role ? '<p class="role">' + esc(e.role) + '</p>' : '') +
            (e.bullets.length ? '<ul>' + e.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') +
          '</div></div>';
      });
      out += '</div>';
    }

    if (site.toolbox.length) {
      out += '<div class="sec"><p class="eyebrow">Technical Toolbox</p><h2>Tools and methods</h2><div class="toolbox">';
      site.toolbox.forEach(function (g) {
        out += '<div class="tool-group"><h3>' + esc(g.heading) + '</h3><div class="chips">' +
          g.chips.map(function (ch) { return '<span class="chip">' + esc(ch) + '</span>'; }).join('') +
          '</div></div>';
      });
      out += '</div></div>';
    }

    if (site.education.length) {
      out += '<div class="sec"><p class="eyebrow">Education and Credentials</p><h2>Education</h2><div class="edu-grid">';
      site.education.forEach(function (c) {
        out += '<div class="edu-card">' +
          (c.kicker ? '<div class="kicker">' + esc(c.kicker) + '</div>' : '') +
          '<h3>' + esc(c.title) + '</h3>' +
          (c.sub ? '<p class="sub">' + esc(c.sub) + '</p>' : '') +
          (c.items.length ? '<ul>' + c.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' : '') +
        '</div>';
      });
      out += '</div></div>';
    }

    return out + '</section>';
  }

  /* ---------- render: one project per page ---------- */
  function figureMarkup(slug, f) {
    return '<figure><img src="' + esc(assetPath(slug, f.src)) + '" alt="">' +
      (f.caption ? '<figcaption>' + esc(f.caption) + '</figcaption>' : '') + '</figure>';
  }

  function tableMarkup(t) {
    if (!t || !t.rows || !t.rows.length) return '';
    var head = toArray(t.head);
    var out = '<table class="proj-table">';
    if (head.length) {
      out += '<thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>';
    }
    out += '<tbody>' + toArray(t.rows).map(function (r) {
      return '<tr>' + toArray(r).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
    return out;
  }

  function projectPage(slug) {
    var p = store[slug];
    if (!p) return '';

    var spec = toArray(p.spec).map(function (r) {
      return '<div class="row"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>';
    }).join('');

    var links = toArray(p.links).filter(function (l) { return l && l.href; })
      .map(function (l) { return esc(l.label) + ': <a href="' + esc(l.href) + '">' + esc(l.href) + '</a>'; })
      .join(' &nbsp;·&nbsp; ');

    var heroImg = p.hero || p.cover;
    var out = '<section class="page proj">' +
      '<div class="proj-head">' +
        (p.kicker ? '<div class="kicker">' + esc(p.kicker) + '</div>' : '') +
        '<h2>' + esc(p.title) + '</h2>' +
        (p.tagline ? '<p class="tagline">' + esc(p.tagline) + '</p>' : '') +
      '</div>' +
      (heroImg ? '<div class="proj-hero"><img src="' + esc(assetPath(slug, heroImg)) + '" alt=""></div>' : '') +
      (spec ? '<div class="spec">' + spec + '</div>' : '') +
      (links ? '<p class="proj-links">' + links + '</p>' : '');

    toArray(p.sections).forEach(function (sec) {
      out += '<div class="block"><h3>' + esc(sec.heading) + '</h3>';
      toArray(sec.body).forEach(function (para) { out += '<p>' + esc(para) + '</p>'; });
      if (sec.list && sec.list.length) {
        out += '<ul>' + sec.list.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>';
      }
      out += tableMarkup(sec.table);
      var figs = toArray(sec.figures);
      if (figs.length === 1) out += figureMarkup(slug, figs[0]);
      else if (figs.length > 1) {
        out += '<div class="fig-grid">' + figs.map(function (f) { return figureMarkup(slug, f); }).join('') + '</div>';
      }
      out += '</div>';
    });

    return out + '</section>';
  }

  /* ---------- readiness: fonts + every image decoded ---------- */
  function signalWhenReady(root) {
    var imgs = all(root, 'img');
    var waits = imgs.map(function (img) {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(function (res) {
        img.addEventListener('load', res, { once: true });
        // A missing image must not stall the export.
        img.addEventListener('error', function () { img.style.display = 'none'; res(); }, { once: true });
      });
    });
    if (doc.fonts && doc.fonts.ready) waits.push(doc.fonts.ready);

    Promise.all(waits).then(function () {
      // One more frame so layout settles before the PDF is taken.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          doc.documentElement.setAttribute('data-export-ready', '1');
        });
      });
    });
  }

  /* ---------- boot ---------- */
  doc.addEventListener('DOMContentLoaded', function () {
    var root = doc.getElementById('export-root');
    if (!root) return;

    fetch('index.html', { cache: 'no-cache' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var site = readSite(html);
        doc.title = site.name + ' | Portfolio';
        loadProjects(order, function () {
          root.innerHTML =
            coverPage(site) +
            profilePage(site) +
            order.map(projectPage).join('');
          signalWhenReady(root);
        });
      })
      .catch(function (err) {
        root.innerHTML = '<section class="page"><h2>Could not build the export</h2>' +
          '<p>' + esc(String(err)) + '</p>' +
          '<p>Open this page over http (not the file:// protocol) so it can read index.html.</p></section>';
        doc.documentElement.setAttribute('data-export-ready', '1');
      });
  });
})();
