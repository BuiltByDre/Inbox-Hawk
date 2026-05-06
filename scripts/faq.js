/* ==========================================================================
   faq.js — loads FAQ items from content/faq.json and builds the accordion.
   Single-open behavior (opening one closes the others).
   ========================================================================== */

async function loadFaq() {
  const list = document.getElementById('faq-list');
  if (!list) return;

  try {
    const res = await fetch('content/faq.json');
    if (!res.ok) throw new Error('Failed to load FAQ data');
    const items = await res.json();

    list.innerHTML = items.map(item => `
      <div class="faq-item">
        <button class="faq-q" type="button">
          ${item.q}
          <span class="icon"></span>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">
            ${item.a.map(p => `<p>${p}</p>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Wire up accordion behavior
    list.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => toggleFaq(btn));
    });
  } catch (err) {
    console.error('FAQ load error:', err);
    list.innerHTML = '<p style="color: var(--ink-mute); padding: 24px 0;">FAQ content could not be loaded. Please refresh.</p>';
  }
}

function toggleFaq(btn) {
  const item = btn.parentElement;
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');

  // Close other open items
  document.querySelectorAll('.faq-item.open').forEach(other => {
    if (other !== item) {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = '0px';
    }
  });

  if (isOpen) {
    item.classList.remove('open');
    answer.style.maxHeight = '0px';
  } else {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

loadFaq();
