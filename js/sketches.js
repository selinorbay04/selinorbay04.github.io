/* ══════════════════════════════════════════════════════════════
   SKETCHES — filter pills + desk motion. Loads after motion.js.

   · filters   All / category; #busstop etc. in the URL pre-selects one
               (the old per-category pages redirect here with a hash)
   · Flip      switching filters animates sketches out, in, and into
               their new places (GSAP Flip); instant under reduced motion
   · drift     sketches below the fold drift onto the desk as they
               scroll in (desktop, staggered)
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SO    = window.SO;
  const gsap  = SO && SO.gsap;
  const Flip  = window.Flip;
  const desk  = document.getElementById('desk');
  const items = [...desk.querySelectorAll('.sk')];
  const pills = [...document.querySelectorAll('.filters [data-filter]')];
  const cats  = pills.map(p => p.dataset.filter);
  const animate = gsap && Flip && !SO.reduced;


  /* ── Filters ── */
  let current = 'all';
  function apply(cat, withMotion) {
    if (!cats.includes(cat)) cat = 'all';
    if (cat === current) return;
    current = cat;
    pills.forEach(p => {
      const on = p.dataset.filter === cat;
      p.classList.toggle('is-active', on);
      p.setAttribute('aria-pressed', String(on));
    });
    settleDrift();   // a filter change ends the scroll drift: everything is placed
    const state = withMotion ? Flip.getState(items) : null;
    items.forEach(el => { el.hidden = !(cat === 'all' || el.dataset.cat === cat); });

    if (state) {
      Flip.from(state, {
        duration: 0.7,
        ease: 'power3.inOut',
        absolute: true,
        stagger: 0.012,
        onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, delay: 0.15, stagger: 0.015 }),
        onLeave: els => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.35 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }

  pills.forEach(p => p.addEventListener('click', () => {
    const cat = p.dataset.filter;
    history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
    // if we're scrolled into the desk, bring its top back under the sticky pills first
    const bar  = document.querySelector('.filters');
    const top  = desk.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - (document.getElementById('nav')?.offsetHeight || 0);
    if (window.scrollY > top + 4) {
      if (SO?.lenis) SO.lenis.scrollTo(top, { immediate: true });
      else window.scrollTo(0, top);
    }
    apply(cat, animate);
  }));

  const fromHash = () => apply(location.hash.slice(1) || 'all', false);


  /* ── Drift onto the desk (desktop, below the fold only) ── */
  let drift = [], pending = [];
  function settleDrift() {
    drift.forEach(t => t.kill()); drift = [];
    if (pending.length) { gsap.set(pending, { clearProps: 'transform,opacity' }); pending = []; }
  }
  if (gsap && !SO.reduced) {
    gsap.matchMedia().add('(min-width: 768px)', () => {
      const below = pending = items.filter(el => !el.hidden && el.getBoundingClientRect().top > window.innerHeight);
      gsap.set(below, { opacity: 0, y: 70, x: (i) => ((i * 37) % 60) - 30 });
      drift = ScrollTrigger.batch(below, {
        start: 'top 92%',
        once: true,
        onEnter: batch => gsap.to(batch, {
          opacity: 1, y: 0, x: 0, duration: 1, ease: 'power3.out', stagger: 0.07,
          onComplete: () => {
            gsap.set(batch, { clearProps: 'transform,opacity' });
            pending = pending.filter(el => !batch.includes(el));
          },
        }),
      });
      return settleDrift;
    });
  }

  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
