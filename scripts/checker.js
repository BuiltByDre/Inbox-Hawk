/* ==========================================================================
   checker.js — Live DMARC + SPF posture check
   Uses Cloudflare DNS-over-HTTPS (no API key needed, free, fast).
   Renders a verdict, parses the policy, and pre-fills the intake form
   with the discovered policy if the user proceeds.
   ========================================================================== */

const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

async function dnsLookup(name, type) {
  const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/dns-json' } });
  if (!res.ok) throw new Error('DNS query failed');
  return res.json();
}

function parseDmarc(record) {
  // DoH sometimes returns the record with surrounding quotes and split into multiple
  // quoted strings. Strip and normalize.
  const clean = record.replace(/^"|"$/g, '').replace(/"\s*"/g, '');
  const out = {};
  clean.split(';').forEach(part => {
    const [k, v] = part.trim().split('=');
    if (k && v) out[k.trim()] = v.trim();
  });
  return out;
}

function normalizeDomain(input) {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '');
  d = d.split('/')[0].split('?')[0];
  return d;
}

async function runCheck() {
  const input = document.getElementById('domain-input');
  const btn = document.getElementById('check-btn');
  const result = document.getElementById('checker-result');

  const domain = normalizeDomain(input.value);

  if (!domain || !domain.includes('.')) {
    alert('Please enter a valid domain (e.g. example.com)');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Checking…';
  result.classList.add('visible');

  // Reset display
  document.getElementById('rec-domain').textContent = domain;
  document.getElementById('rec-dmarc').textContent = 'Looking up…';
  document.getElementById('rec-policy').textContent = '—';
  document.getElementById('rec-spf').textContent = 'Looking up…';
  document.getElementById('rec-rua').textContent = '—';

  try {
    const [dmarcRes, spfRes] = await Promise.all([
      dnsLookup(`_dmarc.${domain}`, 'TXT').catch(() => ({ Answer: [] })),
      dnsLookup(domain, 'TXT').catch(() => ({ Answer: [] }))
    ]);

    let dmarcRecord = null;
    if (dmarcRes.Answer) {
      for (const a of dmarcRes.Answer) {
        const data = a.data.replace(/^"|"$/g, '').replace(/"\s*"/g, '');
        if (data.toLowerCase().startsWith('v=dmarc1')) {
          dmarcRecord = data;
          break;
        }
      }
    }

    let spfRecord = null;
    if (spfRes.Answer) {
      for (const a of spfRes.Answer) {
        const data = a.data.replace(/^"|"$/g, '').replace(/"\s*"/g, '');
        if (data.toLowerCase().startsWith('v=spf1')) {
          spfRecord = data;
          break;
        }
      }
    }

    const recDmarc = document.getElementById('rec-dmarc');
    const recPolicy = document.getElementById('rec-policy');
    const recSpf = document.getElementById('rec-spf');
    const recRua = document.getElementById('rec-rua');

    let policy = null;
    if (dmarcRecord) {
      recDmarc.textContent = dmarcRecord;
      recDmarc.classList.remove('missing');

      const parsed = parseDmarc(dmarcRecord);
      policy = (parsed.p || 'unknown').toLowerCase();

      recPolicy.textContent = `p=${policy}`
        + (parsed.pct ? ` · pct=${parsed.pct}` : '')
        + (parsed.sp ? ` · sp=${parsed.sp}` : '');

      if (parsed.rua) {
        recRua.textContent = parsed.rua;
        recRua.classList.remove('missing');
      } else {
        recRua.textContent = 'Not configured (no aggregate reporting)';
        recRua.classList.add('missing');
      }
    } else {
      recDmarc.textContent = 'No DMARC record found.';
      recDmarc.classList.add('missing');
      recPolicy.textContent = '—';
      recRua.textContent = '—';
    }

    if (spfRecord) {
      recSpf.textContent = spfRecord;
      recSpf.classList.remove('missing');
    } else {
      recSpf.textContent = 'No SPF record found.';
      recSpf.classList.add('missing');
    }

    // Set verdict
    const badge = document.getElementById('verdict-badge');
    const title = document.getElementById('verdict-title');
    const sub = document.getElementById('verdict-sub');
    const ctaText = document.getElementById('cta-text');

    badge.className = 'verdict-badge';

    if (!dmarcRecord) {
      badge.classList.add('unprotected');
      badge.textContent = '✕';
      title.textContent = 'Wide open.';
      sub.textContent = `${domain} has no DMARC record. Anyone can spoof your domain to your clients today.`;
      ctaText.textContent = "This is the highest-risk posture. Let's get you authenticated.";
    } else if (policy === 'reject') {
      badge.classList.add('protected');
      badge.textContent = '✓';
      title.textContent = 'Fully protected.';
      sub.textContent = `${domain} is at p=reject. You're in the small minority that actually blocks spoofing. Make sure your reporting is being monitored.`;
      ctaText.textContent = "Already at reject? Smart. Let's audit your monitoring and alignment.";
    } else if (policy === 'quarantine') {
      badge.classList.add('partial');
      badge.textContent = '!';
      title.textContent = 'Partial protection.';
      sub.textContent = `${domain} is at p=quarantine. Spoofs go to spam folders — they still arrive. The next step is p=reject.`;
      ctaText.textContent = "You're close. Let's plan the move to p=reject.";
    } else if (policy === 'none') {
      badge.classList.add('partial');
      badge.textContent = '!';
      title.textContent = 'Monitoring only — not protected.';
      sub.textContent = `${domain} has DMARC at p=none. This satisfies mailbox provider mandates but does not block spoofing. You're sitting in the 36-point Enforcement Gap.`;
      ctaText.textContent = "p=none is the trap. Let's plot the path to enforcement.";
    } else {
      badge.classList.add('error');
      badge.textContent = '?';
      title.textContent = 'Record found, policy unclear.';
      sub.textContent = `${domain} has a DMARC record but the policy could not be parsed cleanly.`;
    }

    // Pre-fill the intake form with what we discovered
    const intakeDomain = document.getElementById('f-domain');
    if (intakeDomain && !intakeDomain.value) intakeDomain.value = domain;

    const intakePolicy = document.getElementById('f-policy');
    if (intakePolicy) {
      if (!dmarcRecord) intakePolicy.value = 'no-record';
      else if (policy === 'none') intakePolicy.value = 'none';
      else if (policy === 'quarantine') intakePolicy.value = 'quarantine';
      else if (policy === 'reject') intakePolicy.value = 'reject';
    }

  } catch (err) {
    console.error('Checker error:', err);
    const badge = document.getElementById('verdict-badge');
    const title = document.getElementById('verdict-title');
    const sub = document.getElementById('verdict-sub');
    badge.className = 'verdict-badge error';
    badge.textContent = '?';
    title.textContent = 'Lookup failed.';
    sub.textContent = "We couldn't resolve that domain. Check the spelling or try again in a moment.";
  } finally {
    btn.disabled = false;
    btn.textContent = 'Check Posture →';
  }
}

// Wire up event handlers
const checkBtn = document.getElementById('check-btn');
if (checkBtn) checkBtn.addEventListener('click', runCheck);

const domainInput = document.getElementById('domain-input');
if (domainInput) {
  domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runCheck();
  });
}
