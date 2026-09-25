/* ══════════════════════════════════════════════════════════════
   HOME — homepage-only motion. Loads after motion.js (uses window.SO).

   · intro loader   hand-off only (clock: inline <head> script; motion: CSS)
   · name dock      SELIN ORBAY scrubs from the hero into the SO logo
   · hero parallax  photo drifts at ~¼ scroll speed
   · wipe           cream WORK section wipes diagonally over the brown
   · WORK letters   W and RK slide together around the folder

   Desktop (≥ 768px) gets all of it; mobile gets a crossfade for the
   name and plain reveals; reduced motion gets none of it.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SO   = window.SO;
  const root = document.documentElement;
  if (!SO || !SO.gsap || SO.reduced) return;

  const gsap    = SO.gsap;
  const hero    = document.querySelector('.hero');
  const name    = document.querySelector('.hero-name');
  const lines   = name.querySelectorAll('.line');
  const photo   = document.querySelector('.hero-photo');
  const tagline = document.querySelector('.hero-tagline');
  const hint    = document.querySelector('.scroll-hint');
  const nav     = document.getElementById('nav');
  const logo    = nav.querySelector('.logo');

  // On the homepage the logo scrolls back to the top instead of reloading.
  logo.addEventListener('click', e => { e.preventDefault(); SO.scrollTo(0); });


  /* ══════════════════════════════════════
     INTRO LOADER
     The clock lives in the inline <head> script and the animation in CSS
     (so it doesn't wait for the CDN). Here: hold Lenis while it plays,
     then build the scroll effects once it hands off.
  ══════════════════════════════════════ */
  function afterIntro(fn) {
    if (!root.classList.contains('intro') || window.SOintroDone) { fn(); return; }
    SO.lockScroll(true);
    document.addEventListener('so:intro-done', () => {
      SO.lockScroll(false);
      document.querySelector('.loader')?.remove();
      fn();
    }, { once: true });
  }


  /* ══════════════════════════════════════
     SCROLL-LINKED  (gsap.matchMedia reverts cleanly on resize)
  ══════════════════════════════════════ */
  function initScroll() {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      /* ── Name docks into the logo ──
         Measured from the reference: one timeline, hero top→bottom, scrub 1,
         ease none, nothing pinned. Transforms only: the name scales to the
         logo's type size and ORBAY slides up beside SELIN to make one line. */
      name.classList.add('is-docking');

      let geo = null;
      const measure = () => {
        if (geo) return geo;
        const lr    = logo.getBoundingClientRect();
        const first = lines[0].firstElementChild;
        const fs    = parseFloat(getComputedStyle(first).fontSize);
        const s     = parseFloat(getComputedStyle(logo).fontSize) / fs;
        const lh    = lines[0].offsetHeight;
        return (geo = {
          s,
          x:  lr.left - name.offsetLeft,
          y:  lr.top + lr.height / 2 - (s * lh) / 2 - name.offsetTop,
          x2: first.offsetWidth + fs * 0.24,
          y2: lines[0].offsetTop - lines[1].offsetTop,
        });
      };
      const onRefreshInit = () => { geo = null; };
      ScrollTrigger.addEventListener('refreshInit', onRefreshInit);

      const dock = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1, invalidateOnRefresh: true },
      });
      dock.to(name,     { x: () => measure().x,  y: () => measure().y, scale: () => measure().s }, 0)
          // ORBAY steps out to the right first, then rises beside SELIN,
          // so the two words never cross.
          .to(lines[1], { x: () => measure().x2, duration: 0.5, ease: 'power1.inOut' }, 0)
          .to(lines[1], { y: () => measure().y2, duration: 0.45, ease: 'power1.inOut' }, 0.4)
          .to(hint,     { opacity: 0, duration: 0.15 }, 0)
          .to(tagline,  { opacity: 0, duration: 0.15 }, 0)
          .to(logo,     { opacity: 0, duration: 0.12 }, 0.84);

      /* ── Hero parallax (reference: yPercent 0 → 40 on the bg; toned down) ── */
      gsap.to(photo, {
        yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });

      /* ── Diagonal wipe: brown → cream, scrubbed, no pin ── */
      const work = document.querySelector('.work-section');
      gsap.fromTo(work,
        { clipPath: 'polygon(0% 42%, 100% 0%, 100% 100%, 0% 100%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none',
          scrollTrigger: { trigger: work, start: 'top bottom', end: 'top 30%', scrub: true } });

      /* ── W and RK slide together around the folder ── */
      const ghosts = work.querySelectorAll('.work-ghost');
      gsap.fromTo(ghosts, { xPercent: i => (i === 0 ? -45 : 45) }, {
        xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: work, start: 'top 90%', end: 'top 15%', scrub: 1 },
      });

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
        name.classList.remove('is-docking');
        gsap.set([name, lines[1], logo, hint, tagline, photo, work, ghosts], { clearProps: 'transform,opacity,clipPath' });
      };
    });

    mm.add('(max-width: 767px)', () => {
      /* Mobile: the name and tagline simply fade as the hero scrolls away. */
      gsap.to([name, tagline, hint], {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true },
      });
      return () => gsap.set([name, tagline, hint], { clearProps: 'opacity' });
    });
  }

  afterIntro(initScroll);
})();
