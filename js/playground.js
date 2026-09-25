/* ══════════════════════════════════════════════════════════════
   PLAYGROUND — pointer motion for playground.html and cad.html.
   Loads after motion.js. Desktop pointers only; nothing under
   reduced motion.

   · tiles     the 3×3 grid's cells open in a diagonal stagger
   · magnetic  ART / SKETCHES / CAD labels lean toward the cursor
   · tilt      grid images tilt slightly toward the cursor (≤ 5°) and
               return to straight when the cursor leaves
   · parallax  [data-hover-parallax] images drift slowly toward the
               cursor (CAD renders): translate + scale only, no tilt
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SO = window.SO;
  if (!SO || !SO.gsap || SO.reduced) return;
  const gsap = SO.gsap;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


  /* ── Tiles: diagonal stagger in ── */
  const cells = [...document.querySelectorAll('.pg-grid > *')];
  if (cells.length) {
    const visible = cells.filter(c => c.offsetParent !== null);
    gsap.from(visible, {
      opacity: 0,
      clipPath: 'inset(12% 12% 12% 12%)',
      scale: 0.96,
      duration: 0.9,
      ease: 'power3.out',
      stagger: { each: 0.07, grid: 'auto', from: 'start' },
      clearProps: 'clipPath,transform,opacity',
    });
  }
  if (!fine) return;


  /* ── Magnetic labels ── */
  document.querySelectorAll('.pg-label').forEach(cell => {
    const text = cell.querySelector('.kw-text');
    if (!text) return;
    const xTo = gsap.quickTo(text, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(text, 'y', { duration: 0.6, ease: 'power3.out' });
    cell.addEventListener('pointermove', e => {
      const r = cell.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.18);
      yTo((e.clientY - r.top - r.height / 2) * 0.18);
    });
    cell.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });


  /* ── Grid images: tilt toward the cursor, back to straight on leave ── */
  document.querySelectorAll('.pg-img').forEach(cell => {
    const img = cell.querySelector('img, .split-pair');
    if (!img) return;
    gsap.set(cell, { perspective: 800 });
    const rx = gsap.quickTo(img, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = gsap.quickTo(img, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    cell.addEventListener('pointermove', e => {
      const r = cell.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 10);   // ±5°
      rx(-py * 10);
    });
    cell.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });


  /* ── Slow hover parallax (CAD renders) ── */
  document.querySelectorAll('[data-hover-parallax]').forEach(frame => {
    const img = frame.querySelector('img');
    if (!img) return;
    const x = gsap.quickTo(img, 'xPercent', { duration: 1.4, ease: 'power2.out' });
    const y = gsap.quickTo(img, 'yPercent', { duration: 1.4, ease: 'power2.out' });
    const s = gsap.quickTo(img, 'scale',    { duration: 1.4, ease: 'power2.out' });
    frame.addEventListener('pointermove', e => {
      const r = frame.getBoundingClientRect();
      x(((e.clientX - r.left) / r.width - 0.5) * 6);
      y(((e.clientY - r.top) / r.height - 0.5) * 6);
      s(1.06);
    });
    frame.addEventListener('pointerleave', () => { x(0); y(0); s(1); });
  });
})();
