/* ==========================================================================
   counters.js — animated number counters using IntersectionObserver
   Counters fire once when scrolled into view.

   To update target values when new data is published, edit the COUNTERS array
   below or pass in via data attributes (data-target, data-decimals).
   ========================================================================== */

function animateCounter(el, target, duration = 1800, decimals = 0) {
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const value = target * eased;

    if (decimals > 0) {
      el.textContent = value.toFixed(decimals);
    } else {
      el.textContent = Math.floor(value).toLocaleString();
    }

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Final value (avoid floating-point creep)
      el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString();
    }
  }

  requestAnimationFrame(tick);
}

/* ----------------------------------------------------------------------------
   COUNTER REGISTRY
   Each entry maps an HTML element id to a target value.
   When sources update (Valimail, IC3 annual reports), update target values here.
---------------------------------------------------------------------------- */
const COUNTERS = [
  // Hero card
  { id: 'enforcement-num', target: 42, decimals: 0, gauge: 'gauge-fill', triggerEl: 'hero-counter' },
  { id: 'stat-9', target: 9, decimals: 0, triggerEl: 'hero-counter' },
  { id: 'stat-bec', target: 2.77, decimals: 2, triggerEl: 'hero-counter' },

  // Cost-of-inaction BEC counter
  { id: 'bec-num', target: 2.77, decimals: 2, triggerEl: 'bec-counter' },
  { id: 'complaints-num', target: 21442, decimals: 0, triggerEl: 'bec-counter' },
  { id: 'three-year', target: 8.5, decimals: 1, triggerEl: 'bec-counter' },

  // Maryland sub-counter
  { id: 'maryland-num', target: 49.5, decimals: 1, triggerEl: 'maryland-strip' },
];

const fired = new Set();

function fireGroup(triggerEl) {
  COUNTERS.filter(c => c.triggerEl === triggerEl).forEach(c => {
    if (fired.has(c.id)) return;
    fired.add(c.id);

    const el = document.getElementById(c.id);
    if (!el) return;

    animateCounter(el, c.target, 1800, c.decimals);

    if (c.gauge) {
      const g = document.getElementById(c.gauge);
      if (g) {
        setTimeout(() => { g.style.width = c.target + '%'; }, 100);
      }
    }
  });
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      fireGroup(entry.target.id);
    }
  });
}, { threshold: 0.3 });

// Find unique trigger elements and observe each
const triggers = [...new Set(COUNTERS.map(c => c.triggerEl))];
triggers.forEach(id => {
  const el = document.getElementById(id);
  if (el) counterObserver.observe(el);
});
