/* ==========================================================================
   nav.js — mobile hamburger, slide-out menu, sticky section rail,
   active-section tracking, mobile bottom CTA bar
   ========================================================================== */

/* ---- Mobile menu ---- */
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');

function closeMobileMenu() {
  if (!mobileToggle || !mobileMenu || !mobileOverlay) return;
  mobileToggle.classList.remove('open');
  mobileMenu.classList.remove('open');
  mobileOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (mobileToggle && mobileMenu && mobileOverlay) {
  mobileToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    mobileToggle.classList.toggle('open');
    mobileOverlay.classList.toggle('open');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileOverlay.addEventListener('click', closeMobileMenu);

  document.querySelectorAll('.mobile-link').forEach(a =>
    a.addEventListener('click', closeMobileMenu)
  );
}

/* ---- Sticky section rail (desktop) + mobile bottom CTA bar ---- */
const rail = document.getElementById('sectionRail');
const mobileCtaBar = document.getElementById('mobileCtaBar');
const railDots = document.querySelectorAll('.rail-dot');

const SECTIONS = [
  'top', 'threat', 'incidents', 'floor', 'compliance',
  'tools', 'checker', 'audience', 'founder', 'intake', 'faq'
];

function updateRailVisibility() {
  const scrolled = window.scrollY > 600;
  if (rail) rail.classList.toggle('visible', scrolled);
  if (mobileCtaBar) mobileCtaBar.classList.toggle('visible', scrolled);
}

function updateActiveDot() {
  let activeId = 'top';
  const offset = window.innerHeight * 0.3;

  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= offset) activeId = id;
  }

  railDots.forEach(d => {
    d.classList.toggle('active', d.dataset.section === activeId);
  });
}

let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  requestAnimationFrame(() => {
    updateRailVisibility();
    updateActiveDot();
    scrollTicking = false;
  });
  scrollTicking = true;
});

updateRailVisibility();
updateActiveDot();
