/* SSS Earthmovers & Transports – interactions & animations */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---- preloader (first visit of the session only) ---- */
  var pl = $('.preloader');
  function hidePre() {
    if (!pl) return;
    pl.classList.add('done');
    root.classList.remove('pl');
    try { sessionStorage.setItem('sss_seen', '1'); } catch (e) {}
  }
  if (pl) {
    var t0 = Date.now();
    window.addEventListener('load', function () {
      setTimeout(hidePre, Math.max(0, 1500 - (Date.now() - t0)));
    });
    setTimeout(hidePre, 3200);
  }

  /* ---- scroll progress, sticky nav, back-to-top, parallax ---- */
  var bar = $('.progress'), nav = $('.nav'), topBtn = $('.float .top');
  var parallax = $$('[data-parallax]');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset, h = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('stuck', y > 40);
    if (topBtn) topBtn.classList.toggle('show', y > 600);
    if (!reduce) parallax.forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      el.style.transform = 'translate3d(0,' + (y * s).toFixed(1) + 'px,0)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (topBtn) topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---- reveal on scroll (with automatic stagger inside .stagger) ---- */
  $$('.stagger').forEach(function (p) {
    $$('.rv', p).forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'); });
  });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.matches('[data-count]')) countUp(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.rv, .models').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });

  /* ---- counters ---- */
  function countUp(el) {
    if (el.__done) return; el.__done = true;
    var to = parseFloat(el.getAttribute('data-count')) || 0;
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    if (reduce) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    var dur = 1800, t = performance.now();
    (function step(n) {
      var p = Math.min(1, (n - t) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + (to * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t);
  }
  $$('[data-count]').forEach(function (el) {
    if (io) io.observe(el); else countUp(el);
  });

  /* ---- 3D tilt on cards (mouse devices only) ---- */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .08s linear';
        el.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) translateY(-8px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)';
        el.style.transform = '';
      });
    });
  }

  /* ---- filter buttons (projects / fleet) ---- */
  $$('[data-filter-group]').forEach(function (g) {
    var btns = $$('.fbtn', g);
    var scope = $(g.getAttribute('data-filter-group'));
    if (!scope) return;
    var items = $$('[data-tags]', scope);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var f = b.getAttribute('data-f');
        var n = 0;
        items.forEach(function (it) {
          var show = f === 'all' || it.getAttribute('data-tags').split(' ').indexOf(f) > -1;
          it.classList.toggle('is-hidden', !show);
          if (show) {
            it.classList.remove('pop'); void it.offsetWidth;
            it.style.animationDelay = (n++ * 0.04) + 's';
            it.classList.add('pop'); it.classList.add('in');
          }
        });
        var c = $('[data-result-count]');
        if (c) c.textContent = n;
      });
    });
  });

  /* ---- lightbox ---- */
  var lb = $('.lightbox');
  if (lb) {
    var lbImg = $('img', lb);
    $$('[data-lightbox]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        lbImg.src = a.getAttribute('data-lightbox') || a.getAttribute('href');
        lb.classList.add('open');
      });
    });
    lb.addEventListener('click', function () { lb.classList.remove('open'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
  }

  /* ---- contact form: compose email / WhatsApp message (no server needed) ---- */
  var form = $('#enquiry');
  if (form) {
    function msg() {
      var v = function (n) { return (form.elements[n] && form.elements[n].value || '').trim(); };
      return 'Hello SSS Earthmovers & Transports,\n\nName: ' + v('name') + '\nPhone: ' + v('phone') + '\nEmail: ' + v('email') +
        '\nService: ' + v('service') + '\n\n' + v('message');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      location.href = 'mailto:sssemrs@gmail.com?subject=' + encodeURIComponent('Enquiry – ' + (form.elements.service.value || 'SSS Earthmovers')) + '&body=' + encodeURIComponent(msg());
    });
    var wa = $('#wa-send');
    if (wa) wa.addEventListener('click', function () {
      if (!form.reportValidity()) return;
      window.open('https://wa.me/919659299999?text=' + encodeURIComponent(msg()), '_blank', 'noopener');
    });
  }

  /* ---- smooth page-to-page transition ---- */
  $$('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|https?:|javascript:)/i.test(h) || a.target === '_blank' || a.hasAttribute('data-lightbox')) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      d.body.classList.add('leaving');
      setTimeout(function () { location.href = h; }, reduce ? 0 : 260);
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) d.body.classList.remove('leaving'); });

  /* close mobile menu after tapping a link */
  var tg = $('#nav-toggle');
  if (tg) $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { tg.checked = false; }); });
})();
