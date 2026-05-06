/* ==========================================================================
   form.js — intake form submission

   THREE BACKEND OPTIONS — pick ONE, comment out the others.

   OPTION A: Formspree (easiest, free tier covers small volume).
     1. Sign up at formspree.io
     2. Create a form, copy the form ID (looks like "xqkgaboo")
     3. Set FORMSPREE_FORM_ID below
     4. Set BACKEND = 'formspree'

   OPTION B: Custom webhook (POST JSON to your own endpoint).
     1. Set WEBHOOK_URL to your endpoint
     2. Set BACKEND = 'webhook'

   OPTION C: Mailto fallback (default — works everywhere with no backend).
     Opens the user's email client with the form pre-populated. Set
     CONTACT_EMAIL to where you want submissions delivered.
   ========================================================================== */

const BACKEND = 'mailto'; // 'formspree' | 'webhook' | 'mailto'

const FORMSPREE_FORM_ID = 'YOUR_FORM_ID_HERE'; // e.g. 'xqkgaboo'
const WEBHOOK_URL = 'https://your-backend.example.com/api/intake';
const CONTACT_EMAIL = 'contact@inboxhawkllc.com';

async function submitIntake(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('f-name').value,
    role: document.getElementById('f-role').value,
    firm: document.getElementById('f-firm').value,
    industry: document.getElementById('f-industry').value,
    domain: document.getElementById('f-domain').value,
    email: document.getElementById('f-email').value,
    policy: document.getElementById('f-policy').value,
    concern: document.getElementById('f-concern').value,
  };

  const successEl = document.getElementById('form-success');
  const formEl = document.getElementById('intake-form');

  try {
    if (BACKEND === 'formspree') {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Formspree submission failed');

    } else if (BACKEND === 'webhook') {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Webhook submission failed');

    } else {
      // Mailto fallback — opens email client
      const subject = `[InboxHawk Assessment] ${data.firm} — ${data.industry}`;
      const body = `New posture assessment request:

Name: ${data.name}
Role: ${data.role}
Firm: ${data.firm}
Industry: ${data.industry}
Domain: ${data.domain}
Email: ${data.email}
Current DMARC: ${data.policy}

What's prompting outreach:
${data.concern || '(not provided)'}
`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    successEl.classList.add('visible');
    setTimeout(() => formEl.reset(), 1500);

  } catch (err) {
    console.error('Form submission error:', err);
    alert(`Submission failed. Please email ${CONTACT_EMAIL} directly with your details.`);
  }

  return false;
}

const intakeForm = document.getElementById('intake-form');
if (intakeForm) {
  intakeForm.addEventListener('submit', submitIntake);
}
