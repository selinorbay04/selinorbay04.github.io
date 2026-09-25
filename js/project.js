/* ══════════════════════════════════════════════════════════════
   PROJECT — motion for the project detail pages. Loads after motion.js.

   · hero       photo settles 1.12 → 1 and drifts (parallax, desktop);
                the title's line reveal is plain [data-reveal="lines"]
   · images     below-the-fold images open with a slight clip + scale
   · stats      numbers count up once when they come into view
   · fig-stack  photos rise and settle with a small tilt, scrubbed (desktop)

   Reduced motion: none of it runs; everything is already in place.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SO = window.SO;
  if (!SO || !SO.gsap || SO.reduced) return;
  const gsap = SO.gsap;
  const belowFold = el => el.getBoundingClientRect().top > window.innerHeight;


  /* ── Hero ── */
  const hero  = document.querySelector('.hero');
  const photo = hero && hero.querySelector('.hero-photo');
  if (photo) {
    gsap.fromTo(photo, { scale: 1.12 }, { scale: 1, duration: 1.4 });
    gsap.matchMedia().add('(min-width: 768px)', () => {
      gsap.to(photo, {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    });
  }


  /* ── Images: clip + scale open, once ── */
  const imgs = document.querySelectorAll(
    'img:not(.hero-photo), .graph'
  );
  imgs.forEach(el => {
    if (el.closest('.hero, nav, .proj-card, .fig-stack, [data-no-reveal], [data-reveal]')) return;
    if (!belowFold(el)) return;   // never hide something already on screen
    gsap.fromTo(el,
      { clipPath: 'inset(8% 6% 8% 6%)', scale: 1.06 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.2,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });


  /* ── Stats: count up (keeps any prefix/suffix, e.g. "×3", ">90%", "32 CM") ── */
  document.querySelectorAll('.stat-number, .result-stat, [data-count]').forEach(el => {
    const text = el.textContent.trim();
    const m = text.match(/\d+(?:\.\d+)?/);
    if (!m) return;
    const target = parseFloat(m[0]);
    if (!target) return;                       // "0" stays "0"
    const dec  = (m[0].split('.')[1] || '').length;
    const pre  = text.slice(0, m.index);
    const post = text.slice(m.index + m[0].length);
    const n = { v: 0 };
    el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = pre + (0).toFixed(dec) + post;
    gsap.to(n, {
      v: target, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = pre + n.v.toFixed(dec) + post; },
      onComplete: () => { el.textContent = text; },
    });
  });


  /* ── Figure stack: rise and settle with a slight tilt (desktop, scrubbed) ── */
  const figs = document.querySelectorAll('.fig-stack figure');
  if (figs.length) {
    gsap.matchMedia()
      .add('(min-width: 768px)', () => {
        figs.forEach((fig, i) => {
          const tilt = [-1.2, 1, -0.8][i % 3];
          const st = { trigger: fig, start: 'top 100%', end: 'top 45%', scrub: 0.8 };
          gsap.fromTo(fig, { y: 120, rotate: tilt * 4, opacity: 0.2 },
            { y: 0, rotate: tilt, opacity: 1, ease: 'none', scrollTrigger: st });
          const img = fig.querySelector('img');
          if (img) gsap.fromTo(img, { clipPath: 'inset(16% 0% 16% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { ...st } });
        });
      })
      .add('(max-width: 767px)', () => {
        gsap.from(figs, {
          opacity: 0, y: 24, duration: 0.8, stagger: 0.1,
          scrollTrigger: { trigger: figs[0].parentElement, start: 'top 85%', once: true },
        });
      });
  }
})();
