/* ══════════════════════════════════════════════════════════════
   MOTION — shared behaviour for every page.
   Load order (all `defer`): gsap → ScrollTrigger → SplitText → lenis → motion.js

   · one Lenis instance, driven by the GSAP ticker and synced to ScrollTrigger
   · reveal helpers: [data-reveal], [data-reveal="lines" | "clip" | "scale"]
   · nav state (.scrolled) and back-to-top button
   · prefers-reduced-motion: no Lenis, no reveals; content is simply there
   · optional custom cursor: <body data-cursor>

   Exposes window.SO for page scripts.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const root    = document.documentElement;
  const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const SO = window.SO = {
    gsap:    hasGsap ? window.gsap : null,
    lenis:   null,
    reduced: rmQuery.matches,
    isMobile: () => window.matchMedia('(max-width: 767px)').matches,
    scrollTo,
    lockScroll,
    initReveals,
  };

  // Content must never stay hidden: without GSAP, or with reduced motion, reveals are off.
  if (!hasGsap || SO.reduced) root.classList.add('motion-off');


  /* ── Easing: "osmo" cubic-bezier(0.625, 0.05, 0, 1), measured on the reference site ── */
  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const x = t => ((ax * t + bx) * t + cx) * t;
    const y = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return p => {
      if (p <= 0 || p >= 1) return p;
      let t = p;
      for (let i = 0; i < 6; i++) {           // Newton–Raphson
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= (x(t) - p) / d;
      }
      return y(Math.min(1, Math.max(0, t)));
    };
  }
  SO.ease = { osmo: cubicBezier(0.625, 0.05, 0, 1) };


  /* ── GSAP + Lenis ── */
  if (hasGsap) {
    const plugins = [window.ScrollTrigger];
    if (window.SplitText) plugins.push(window.SplitText);
    if (window.Flip) plugins.push(window.Flip);
    gsap.registerPlugin(...plugins);
    gsap.defaults({ ease: SO.ease.osmo, duration: 0.6 });

    const smoothOff = document.body.hasAttribute('data-smooth-off');
    if (!SO.reduced && !smoothOff && typeof window.Lenis !== 'undefined') {
      SO.lenis = new Lenis({ lerp: 0.165, anchors: true });
      SO.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => SO.lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // late-loading images change page height; keep triggers accurate
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  function scrollTo(target) {
    if (SO.lenis) SO.lenis.scrollTo(target, { duration: 1.2 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: SO.reduced ? 'auto' : 'smooth' });
    else document.querySelector(target)?.scrollIntoView({ behavior: SO.reduced ? 'auto' : 'smooth' });
  }

  function lockScroll(locked) {
    if (SO.lenis) locked ? SO.lenis.stop() : SO.lenis.start();
    document.body.style.overflow = locked ? 'hidden' : '';
  }


  /* ── Reveals ── */
  function initReveals(scope) {
    if (!hasGsap || SO.reduced) return;
    const els = (scope || document).querySelectorAll('[data-reveal]:not([data-revealed])');

    els.forEach(el => {
      el.setAttribute('data-revealed', '');
      const type  = el.getAttribute('data-reveal');
      const delay = parseFloat(el.getAttribute('data-reveal-delay')) || 0;
      const st    = { trigger: el, start: 'top 88%', once: true };

      if (type === 'lines' && window.SplitText) {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,               // re-splits after webfonts load / resize
          onSplit(self) {
            gsap.set(el, { visibility: 'visible' });
            return gsap.from(self.lines, {
              yPercent: 110, duration: 0.8, ease: 'power4.out', stagger: 0.1, delay,
              scrollTrigger: st,
            });
          },
        });
      } else if (type === 'lines') {
        gsap.set(el, { visibility: 'visible' });
      } else if (type === 'clip') {
        gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, delay, scrollTrigger: st });
      } else if (type === 'scale') {
        gsap.to(el, { opacity: 1, scale: 1, duration: 1.1, delay, scrollTrigger: st });
      } else {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay, scrollTrigger: st });
      }
    });
  }
  initReveals();


  /* ── Nav: solid background once past the hero (or 20px on pages without one) ── */
  const nav = document.getElementById('nav');
  if (nav) {
    const hero = nav.hasAttribute('data-over-hero') ? document.querySelector('.hero') : null;
    let threshold = 20;
    const measure = () => { threshold = hero ? hero.offsetHeight - 80 : 20; };
    const update  = () => nav.classList.toggle('scrolled', window.scrollY > threshold);
    measure(); update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => { measure(); update(); });
  }


  /* ── Back to top ── */
  const btt = document.getElementById('backToTop');
  if (btt) {
    const update = () => btt.classList.toggle('visible', window.scrollY > 400);
    update();
    window.addEventListener('scroll', update, { passive: true });
    btt.addEventListener('click', () => scrollTo(0));
  }


  /* ── Optional custom cursor (fine pointers only) ── */
  if (document.body.hasAttribute('data-cursor') &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    root.classList.add('has-cursor');

    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    }, { passive: true });
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }


  /* ── Follow the user's reduced-motion setting if it changes mid-visit ── */
  rmQuery.addEventListener?.('change', () => window.location.reload());
})();
