/* ══════════════════════════════════════════════════════════════
   PROJECTS — the dealt card deck and the PLAYGROUND teaser.
   Loads after motion.js.

   Deck (desktop ≥ 768px, motion allowed): the cards' real layout is a
   2-column grid. They start as a straight pile that rides along in the
   viewport (40% down, centred). When a slot's top reaches the pile, the
   top card slides up and settles into that slot: top-left, top-right,
   next row left, and so on. Nothing is pinned and nothing tilts; every
   card ends in normal flow. Mobile / reduced motion keep the plain grid.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SO = window.SO;
  if (!SO || !SO.gsap || SO.reduced) return;
  const gsap = SO.gsap;


  /* ── Deck ── */
  const deck  = document.getElementById('deck');
  const stage = deck && deck.querySelector('.deck-stage');
  const cards = stage ? [...stage.querySelectorAll('.deck-card')] : [];

  if (cards.length > 1) {
    gsap.matchMedia()
      .add('(min-width: 768px)', () => {
        const PILE_AT = 0.4;       // pile's top edge, as a fraction of the viewport
        const STEP    = 6;         // px each lower card peeks out under the one above
        const ease    = gsap.parseEase('power2.inOut');
        const setX = cards.map(c => gsap.quickSetter(c, 'x', 'px'));
        const setY = cards.map(c => gsap.quickSetter(c, 'y', 'px'));
        cards.forEach((c, i) => { c.style.zIndex = String(cards.length - i); });   // card 01 on top

        let slots = [], pileX = 0, stageTop = 0, stageBottom = 0, cardH = 0, vh = 0;
        const measure = () => {
          vh = window.innerHeight;
          const sr = stage.getBoundingClientRect();
          stageTop = sr.top + window.scrollY;
          stageBottom = sr.bottom + window.scrollY;
          // offset* ignore transforms, so these are the real grid slots
          slots = cards.map(c => ({ x: c.offsetLeft, y: stageTop + c.offsetTop }));
          cardH = cards[0].offsetHeight;
          pileX = (stage.clientWidth - cards[0].offsetWidth) / 2;
        };

        const render = () => {
          const sy = window.scrollY;
          // the pile rides at PILE_AT of the viewport, but never leaves the stage
          const pileY = Math.min(Math.max(sy + vh * PILE_AT, stageTop), stageBottom - cardH);
          let depth = 0;
          cards.forEach((c, i) => {
            const slot = slots[i];
            // deal window: from the slot's top meeting the pile, to it reaching 12% of the viewport;
            // the right-hand card of a row waits for the left one to be halfway gone
            const lag   = i % 2 ? 0.18 * vh : 0;
            const start = slot.y - vh * PILE_AT + lag;
            const end   = slot.y - vh * 0.12 + lag * 0.5;
            const p     = ease(Math.min(1, Math.max(0, (sy - start) / (end - start))));
            const fromX = pileX, fromY = pileY + depth * STEP;
            if (p < 1) depth++;
            setX[i]((fromX - slot.x) * (1 - p));
            setY[i]((fromY - slot.y) * (1 - p));
          });
        };

        measure(); render();
        const st = ScrollTrigger.create({
          trigger: stage, start: 'top bottom', end: 'bottom top',
          onUpdate: render, onRefresh: () => { measure(); render(); },
        });

        return () => {
          st.kill();
          gsap.set(cards, { clearProps: 'transform,zIndex' });
        };
      })
      .add('(max-width: 767px)', () => {
        cards.forEach(card => card.getBoundingClientRect().top > window.innerHeight && gsap.from(card, {
          opacity: 0, y: 24, duration: 0.8,
          scrollTrigger: { trigger: card, start: 'top 90%', once: true },
        }));
      });
  }


  /* ── PLAYGROUND letters assemble on scroll ──
     Each letter starts scattered (seeded, so it's the same every visit)
     and scrubs into place as the section scrolls in. */
  const teaser  = document.getElementById('pg-teaser');
  const letters = teaser ? teaser.querySelectorAll('.pg-letter') : [];
  if (letters.length) {
    let seed = 7;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) * 2 - 1;   // −1…1
    const from = [...letters].map(() => ({ x: rand() * 22, y: 30 + rand() * 40, r: rand() * 28 }));
    const mobile = SO.isMobile();

    gsap.fromTo(letters,
      { xPercent: i => from[i].x * (mobile ? 1 : 3), yPercent: i => from[i].y * (mobile ? 1 : 2.2),
        rotate: i => from[i].r, opacity: 0 },
      { xPercent: 0, yPercent: 0, rotate: 0, opacity: 1, ease: 'none', stagger: 0.03,
        scrollTrigger: { trigger: teaser, start: 'top 85%', end: 'top 20%', scrub: 0.8 } });
  }
})();
