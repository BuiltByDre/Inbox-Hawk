/* ==========================================================================
   loader.js — fetches data from content/ and populates the carousels.
   Runs FIRST, before carousel.js initializes the carousel instances.
   ========================================================================== */

async function loadIncidents() {
  const track = document.getElementById('incidents-track');
  if (!track) return;

  try {
    const res = await fetch('content/incidents.json');
    if (!res.ok) throw new Error('Failed to load incidents');
    const incidents = await res.json();

    track.innerHTML = incidents.map(i => `
      <div class="carousel-slide" data-id="${i.id}">
        <div class="incident-slide">
          <div class="incident-meta-block">
            <div class="year">${i.year}</div>
            <div class="amount">${i.amount}</div>
          </div>
          <div class="incident-body">
            <p class="who">${i.who}</p>
            <h4>${i.headline}</h4>
            <p>${i.body}</p>
            <p class="takeaway">
              <strong>The lesson</strong>
              ${i.lesson}
            </p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Incidents load error:', err);
    track.innerHTML = '<p style="color: var(--ink-mute); padding: 32px;">Incident data could not be loaded.</p>';
  }
}

async function loadProducts() {
  const track = document.getElementById('products-track');
  if (!track) return;

  const ICONS = {
    search: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.5-4.5"/>
      <path d="M11 7v4l2 2"/>
    </svg>`,
    chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <path d="M3 12l4-9 5 18 4-12 5 9"/>
      <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="21" cy="9" r="1.5" fill="currentColor"/>
    </svg>`,
    shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>`,
  };

  const STATUS_CLASS = {
    'live': 'status-live',
    'deploying': 'status-deploying',
    'in-dev': 'status-soon',
  };

  try {
    const res = await fetch('content/products.json');
    if (!res.ok) throw new Error('Failed to load products');
    const products = await res.json();

    track.innerHTML = products.map(p => `
      <div class="carousel-slide" data-id="${p.id}">
        <div class="tool-card ${p.status === 'live' ? 'live' : ''}">
          <span class="tool-status ${STATUS_CLASS[p.status] || 'status-soon'}">${p.statusLabel}</span>
          <div class="tool-icon">${ICONS[p.icon] || ICONS.shield}</div>
          <h3>${p.name}</h3>
          <p class="tool-tag">${p.tagline}</p>
          <p>${p.description}</p>
          <p class="future">${p.future}</p>
          <a href="${p.url}" class="tool-link" ${p.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
            ${p.urlLabel} <span class="arr">→</span>
          </a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Products load error:', err);
    track.innerHTML = '<p style="color: var(--ink-mute); padding: 32px;">Product data could not be loaded.</p>';
  }
}

// Run both loads, then dynamically import carousel.js so it sees the populated DOM
(async function init() {
  await Promise.all([loadIncidents(), loadProducts()]);
  // Dynamically load the carousel script after data is in the DOM
  const script = document.createElement('script');
  script.src = 'scripts/carousel.js';
  document.body.appendChild(script);
})();
