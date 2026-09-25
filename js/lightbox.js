/* ══════════════════════════════════════════════════════════════
   LIGHTBOX — shared by sketches, art and CAD. No dependencies
   (uses GSAP for the fade when it's there).

   Markup: <a href="full.jpg" data-lightbox="group" data-label="Bus Stop">
             <img src="thumb.jpg" alt="…"></a>
   Without JS the link simply opens the full image.

   · full screen, image contained (never cropped)
   · ← → keys, prev/next buttons, swipe on touch, Esc closes
   · "03 / 24" counter + category label
   · focus is trapped while open and returns to the opener on close
   · the group is re-read on every open, so hidden (filtered-out) items
     are skipped: the counter follows what's on screen

   Exposes window.SOLightbox.open(links, index).
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  let box, img, labelEl, countEl, btnPrev, btnNext, btnClose;
  let items = [], index = 0, opener = null, inerted = [];

  function build() {
    box = document.createElement('div');
    box.className = 'lb';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<div class="lb-top"><span class="lb-label"></span><span class="lb-count" aria-live="polite"></span>' +
      '<button type="button" class="lb-close" aria-label="Close">✕</button></div>' +
      '<button type="button" class="lb-prev" aria-label="Previous image">←</button>' +
      '<figure class="lb-stage"><img class="lb-img" alt=""></figure>' +
      '<button type="button" class="lb-next" aria-label="Next image">→</button>';
    document.body.appendChild(box);
    img      = box.querySelector('.lb-img');
    labelEl  = box.querySelector('.lb-label');
    countEl  = box.querySelector('.lb-count');
    btnPrev  = box.querySelector('.lb-prev');
    btnNext  = box.querySelector('.lb-next');
    btnClose = box.querySelector('.lb-close');

    btnPrev.addEventListener('click', () => go(-1));
    btnNext.addEventListener('click', () => go(1));
    btnClose.addEventListener('click', close);
    // click on the dark backdrop (not the image or a button) closes
    box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lb-stage')) close(); });
    box.addEventListener('keydown', onKey);

    // swipe
    let x0 = null, y0 = null;
    box.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
    box.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = y0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    });
  }

  function show(i) {
    index = (i + items.length) % items.length;
    const a = items[index];
    const thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = (thumb && thumb.alt) || '';
    labelEl.textContent = a.dataset.label || '';
    countEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
    const single = items.length < 2;
    btnPrev.hidden = btnNext.hidden = single;
    // warm the neighbours
    [1, -1].forEach(d => { const n = items[(index + d + items.length) % items.length]; if (n) new Image().src = n.getAttribute('href'); });
  }

  function go(d) {
    const g = window.gsap, SO = window.SO;
    if (g && SO && !SO.reduced) {
      g.fromTo(img, { opacity: 0, x: d * 24 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
    }
    show(index + d);
  }

  function open(links, i) {
    if (!box) build();
    items = links;
    opener = document.activeElement;
    show(i);
    // everything else becomes inert: nothing behind can be tabbed to or read
    inerted = [...document.body.children].filter(el => el !== box && !el.inert && el.tagName !== 'SCRIPT');
    inerted.forEach(el => { el.inert = true; });
    box.hidden = false;
    window.SO?.lockScroll?.(true);
    const g = window.gsap;
    if (g && !window.SO?.reduced) g.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    btnClose.focus();
  }

  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    img.removeAttribute('src');
    inerted.forEach(el => { el.inert = false; });
    inerted = [];
    window.SO?.lockScroll?.(false);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (e.key === 'Escape')      { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
    else if (e.key === 'Tab') {
      const f = [btnClose, btnPrev, btnNext].filter(b => !b.hidden);
      const at = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  // auto-wire [data-lightbox] links (delegated, so filtered/moved items just work)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const group = [...document.querySelectorAll(`a[data-lightbox="${a.dataset.lightbox}"]`)]
      .filter(el => el.offsetParent !== null || el === a);
    open(group, group.indexOf(a));
  });

  window.SOLightbox = { open, close };
})();
