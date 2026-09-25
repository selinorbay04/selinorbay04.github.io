/* ══════════════════════════════════════════════════════════════
   PROJECTS — the stacking card deck and the PLAYGROUND teaser.
   Loads after motion.js.

   Deck (desktop ≥ 768px, motion allowed), measured on kail.studio:
   the section pins for (N − 1) screens; in each step the next card
   rests for the first 45% of the step, then slides up over the last
   one with a slight tilt (±1.5°), while the card underneath scales
   to 0.92 and dims. Mobile / reduced motion keep the plain list.
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SO = window.SO;
  if (!SO || !SO.gsap || SO.reduced) return;
  const gsap = SO.gsap;


  /* ── Deck ── */
  const deck  = document.getElementById('deck');
  const cards = deck ? [...deck.querySelectorAll('.deck-card')] : [];

  if (cards.length > 1) {
    gsap.matchMedia()
      .add('(min-width: 768px)', () => {
        deck.classList.add('deck--stacked');
        const N = cards.length;

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: deck,
            start: 'top top',
            end: () => '+=' + (N - 1) * window.innerHeight,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        cards.forEach((card, i) => {
          if (i === 0) return;
          const at   = (i - 1) + 0.45;               // rest, then move
          const tilt = i % 2 ? 1.5 : -1.5;
          const prev = cards[i - 1];
          tl.fromTo(card,
              { y: () => window.innerHeight, rotate: tilt * 4 },
              { y: 0, rotate: tilt, duration: 0.55, ease: 'power1.out' }, at)
            .to(prev, { scale: 0.92, duration: 0.55 }, at)
            .to(prev.querySelector('.deck-shade'), { opacity: 0.5, duration: 0.55 }, at);
        });

        return () => {
          deck.classList.remove('deck--stacked');
          gsap.set(cards, { clearProps: 'transform' });
          gsap.set(deck.querySelectorAll('.deck-shade'), { clearProps: 'opacity' });
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
