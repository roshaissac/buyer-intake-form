/* ============================================================
   BUYER INTAKE FORM — ISSAC REALTY TEAM
   Core form logic: mode switching, multi-step nav, validation,
   EmailJS + Formspree submission, review screen
   Depends on: config.js, emailjs-init.js
   ============================================================ */

'use strict';

// --- State ---------------------------------------------------

const state = {
  mode: 'client',        // 'client' | 'agent'
  currentSection: 1,
};

function totalSections() {
  return state.mode === 'agent' ? 5 : 4;
}

// --- Init ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  restoreMode();
  bindModeButtons();
  bindNavButtons();
  bindSubmit();
  bindInvestmentToggle();
  autoFillSessionDate();
  showSection(1);
  updateProgress();
});

function restoreMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('agent') === 'true') {
    setMode('agent');
    return;
  }
  const saved = sessionStorage.getItem('intakeMode');
  if (saved === 'agent') setMode('agent');
}

// --- Mode toggle -------------------------------------------

function bindModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
}

function setMode(mode) {
  state.mode = mode;
  sessionStorage.setItem('intakeMode', mode);

  // Update toggle buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Show/hide agent badge
  document.getElementById('agent-badge').style.display =
    mode === 'agent' ? 'flex' : 'none';

  // Show/hide agent section
  const agentSection = document.getElementById('section-5');
  if (agentSection) agentSection.style.display = mode === 'agent' ? 'block' : 'none';

  // Update intro copy
  const clientIntro = document.getElementById('intro-client');
  const agentIntro  = document.getElementById('intro-agent');
  if (clientIntro) clientIntro.style.display = mode === 'client' ? 'block' : 'none';
  if (agentIntro)  agentIntro.style.display  = mode === 'agent'  ? 'block' : 'none';

  // Update submit button text
  const submitLabel = document.querySelector('.btn-label');
  if (submitLabel) {
    submitLabel.textContent = mode === 'agent'
      ? 'Submit Client Intake'
      : 'Submit & Get My Welcome Package';
  }

  // Update step 5 visibility in progress bar
  const step5 = document.querySelector('.progress-step[data-step="5"]');
  if (step5) step5.style.display = mode === 'agent' ? 'flex' : 'none';

  updateProgress();
}

// --- Investment / Multi-family conditional block -----------

function bindInvestmentToggle() {
  const block = document.getElementById('investment-block');
  if (!block) return;
  const sync = () => {
    const checked = checkedValues('property-type').includes('Multi-Family / Investment');
    block.style.display = checked ? 'block' : 'none';
  };
  document.querySelectorAll('input[name="property-type"]').forEach(cb => {
    cb.addEventListener('change', sync);
  });
  sync();
}

// --- Section navigation ------------------------------------

function showSection(n) {
  state.currentSection = n;
  document.querySelectorAll('.form-section').forEach(sec => {
    sec.classList.remove('active');
  });

  if (n === 'review') {
    renderReview();
    document.getElementById('review-screen').classList.add('active');
  } else {
    const target = document.getElementById(`section-${n}`);
    if (target) target.classList.add('active');
  }
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindNavButtons() {
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseInt(btn.closest('.form-section').dataset.section);
      if (validateSection(sec)) {
        clearErrors();
        const next = sec + 1;
        if (next > totalSections()) {
          showSection('review');
        } else {
          showSection(next);
        }
      }
    });
  });

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      clearErrors();
      const secEl = btn.closest('.form-section');
      if (secEl.id === 'review-screen') {
        showSection(totalSections());
      } else {
        const sec = parseInt(secEl.dataset.section);
        showSection(sec - 1);
      }
    });
  });
}

// --- Progress bar ------------------------------------------

function updateProgress() {
  const total   = totalSections();
  const current = state.currentSection === 'review' ? total + 1 : state.currentSection;

  document.querySelectorAll('.progress-step').forEach(stepEl => {
    const n = parseInt(stepEl.dataset.step);
    stepEl.classList.remove('active', 'done');
    if (n === current) stepEl.classList.add('active');
    if (n < current)   stepEl.classList.add('done');
  });

  // Progress track fill: 0% at step 1, 100% at final step or review
  const fillPct = total > 1
    ? Math.min(((current - 1) / total) * 100, 100)
    : 0;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = fillPct + '%';
}

// --- Validation -------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts Canadian formats: 10-digit (403-555-0123) or 11-digit +1 (1 403…).
// Counts actual digits rather than just allowed characters, so "((((((((((" fails.
function isValidPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
}

function validateSection(n) {
  clearErrors();
  const errors = [];

  if (n === 1) {
    const name  = val('full-name');
    const email = val('email');
    const phone = val('phone');

    if (!name) errors.push({ id: 'full-name', msg: 'Full name is required' });
    if (!email) {
      errors.push({ id: 'email', msg: 'Email address is required' });
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push({ id: 'email', msg: 'Please enter a valid email address' });
    }
    if (!phone) {
      errors.push({ id: 'phone', msg: 'Mobile number is required' });
    } else if (!isValidPhone(phone)) {
      errors.push({ id: 'phone', msg: 'Please enter a valid 10-digit Canadian phone number' });
    }
  }

  if (n === 2) {
    const types = checkedValues('property-type');
    if (types.length === 0) {
      errors.push({ id: 'property-type-group', msg: 'Please select at least one property type' });
    }
  }

  if (n === 3) {
    if (!val('timeline'))    errors.push({ id: 'timeline',    msg: 'Please select a timeframe' });
    if (!val('budget'))      errors.push({ id: 'budget',      msg: 'Please select a budget range' });
    if (!radioVal('preapproval')) errors.push({ id: 'preapproval-group', msg: 'Please indicate your pre-approval status' });
  }

  if (errors.length > 0) {
    showErrors(errors);
    const firstErr = document.getElementById(`err-${errors[0].id}`);
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

function showErrors(errors) {
  errors.forEach(({ id, msg }) => {
    const errEl = document.getElementById(`err-${id}`);
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add('visible');
    }
    const inputEl = document.getElementById(id);
    if (inputEl) inputEl.classList.add('error');
  });
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.classList.remove('visible');
    el.textContent = '';
  });
  document.querySelectorAll('.field-input.error').forEach(el => {
    el.classList.remove('error');
  });
}

// --- Form data helpers ------------------------------------

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function radioVal(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

function checkedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(el => el.value);
}

function getFormData() {
  return {
    // Section 1
    fullName:       val('full-name'),
    email:          val('email'),
    phone:          val('phone'),
    contactMethod:  radioVal('contact-method'),
    referralSource: val('referral-source'),

    // Section 2
    propertyType:   checkedValues('property-type'),
    neighbourhoods: val('neighbourhoods'),
    mustHave:       val('must-have'),
    dealBreakers:   val('deal-breakers'),
    minBedrooms:    val('min-bedrooms'),
    minBathrooms:   val('min-bathrooms'),
    basementSuite:  radioVal('basement-suite'),
    garage:         radioVal('garage'),

    // Section 2 — Investment / Multi-family (conditional)
    isInvestment:     checkedValues('property-type').includes('Multi-Family / Investment'),
    investUnits:      val('inv-units'),
    investFinancing:  val('inv-financing'),
    investCashflow:   val('inv-cashflow'),
    investPortfolio:  val('inv-portfolio'),
    investGoal:       radioVal('inv-goal'),
    investCapRate:    radioVal('inv-cap-rate'),
    investManagement: radioVal('inv-management'),

    // Section 3
    timeline:       val('timeline'),
    budget:         val('budget'),
    downPayment:    val('down-payment'),
    preapproval:    radioVal('preapproval'),
    lender:         val('lender'),

    // Section 4
    housingSituation: val('housing-situation'),
    firstTimeBuyer:   radioVal('first-time-buyer'),
    otherAgent:       radioVal('other-agent'),
    questions:        val('questions'),

    // Section 5 (agent mode)
    agentNotes:    val('agent-notes'),
    crgSigned:     document.getElementById('crg-signed')?.checked ? 'Yes' : 'No',
    sessionDate:   val('session-date'),
    nextSteps:     val('next-steps'),
  };
}

// --- Review screen ----------------------------------------

function renderReview() {
  const data = getFormData();
  const container = document.getElementById('review-content');
  if (!container) return;

  const sections = [
    {
      title: 'About You',
      goTo: 1,
      rows: [
        ['Full Name',               data.fullName],
        ['Email',                   data.email],
        ['Mobile / WhatsApp',       data.phone],
        ['Preferred Contact',       data.contactMethod],
        ['How You Heard About Us',  data.referralSource],
      ],
    },
    {
      title: 'Buying Goals',
      goTo: 2,
      rows: [
        ['Property Type',     data.propertyType.join(', ')],
        ['Neighbourhoods',    data.neighbourhoods],
        ['Must-Have Features',data.mustHave],
        ['Deal-Breakers',     data.dealBreakers],
        ['Min. Bedrooms',     data.minBedrooms],
        ['Min. Bathrooms',    data.minBathrooms],
        ['Basement Suite',    data.basementSuite],
        ['Garage',            data.garage],
      ],
    },
    {
      title: 'Timeline & Budget',
      goTo: 3,
      rows: [
        ['Move-In Timeframe', data.timeline],
        ['Max Budget',        data.budget],
        ['Down Payment',      data.downPayment],
        ['Pre-Approval',      data.preapproval],
        ['Lender / Broker',   data.lender],
      ],
    },
    {
      title: 'Your Situation',
      goTo: 4,
      rows: [
        ['Current Housing',        data.housingSituation],
        ['First-Time Buyer?',      data.firstTimeBuyer],
        ['Working with Another Agent?', data.otherAgent],
        ['Questions / Concerns',   data.questions],
      ],
    },
  ];

  if (data.isInvestment) {
    sections.splice(2, 0, {
      title: 'Investment Details',
      goTo: 2,
      rows: [
        ['Number of Units',   data.investUnits],
        ['Investment Goal',   data.investGoal],
        ['Target Cash Flow',  data.investCashflow],
        ['Cap Rate Comfort',  data.investCapRate],
        ['Financing Type',    data.investFinancing],
        ['Current Portfolio', data.investPortfolio],
        ['Management',        data.investManagement],
      ],
    });
  }

  if (state.mode === 'agent') {
    sections.push({
      title: 'Agent Notes',
      goTo: 5,
      rows: [
        ['Intake Notes',   data.agentNotes],
        ['CRG Signed?',    data.crgSigned],
        ['Session Date',   data.sessionDate],
        ['Next Steps',     data.nextSteps],
      ],
    });
  }

  container.innerHTML = sections.map(sec => `
    <div class="review-section">
      <div class="review-section-header">
        <span class="review-section-title">${sec.title}</span>
        <button class="btn-edit" data-goto="${sec.goTo}" type="button">Edit</button>
      </div>
      <div class="review-section-body">
        ${sec.rows.filter(([, v]) => v).map(([k, v]) => `
          <div class="review-row">
            <span class="review-key">${k}</span>
            <span class="review-val">${escHtml(v)}</span>
          </div>
        `).join('')}
        ${sec.rows.every(([, v]) => !v)
          ? '<p class="review-val empty">No details provided for this section.</p>'
          : ''}
      </div>
    </div>
  `).join('');

  // Wire up edit buttons
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => showSection(parseInt(btn.dataset.goto)));
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// --- Submission -------------------------------------------

function bindSubmit() {
  document.getElementById('intake-form').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  const submitBtn = document.querySelector('.btn-submit');
  const warningEl = document.getElementById('email-warning');
  setLoading(true);

  const data = getFormData();

  // Step 1 — EmailJS (best-effort).
  // Client mode always emails. Agent mode only emails the client when the
  // agent has checked "CRG explained & acknowledged" — matching the UI promise.
  const shouldEmailClient = state.mode === 'client' || data.crgSigned === 'Yes';
  if (shouldEmailClient) {
    try {
      await sendThankYouEmail(data);
    } catch (err) {
      console.warn('EmailJS failed:', err);
      if (warningEl) warningEl.classList.add('visible');
    }
  }

  // Step 1b — Branded lead alert to the internal alias (always fires, best-effort).
  // Independent of mode/CRG and of the Formspree filter, so a lead is never missed.
  try {
    await sendLeadAlert(data);
  } catch (err) {
    console.warn('Lead alert failed:', err);
  }

  // Step 2 — Formspree POST
  try {
    const payload = buildFormspreePayload(data);
    const res = await fetch(`https://formspree.io/f/${CONFIG.FORMSPREE_FORM_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Formspree returned ${res.status}`);
  } catch (err) {
    console.error('Formspree failed:', err);
    setLoading(false);
    alert('Sorry — there was a problem submitting your form. Please try again or contact Rosh directly at rosh@issacrealty.com');
    return;
  }

  // Step 3 — Google Apps Script CRM (best-effort: logs to Google Sheets)
  if (CONFIG.GAS_CRM_URL && CONFIG.GAS_CRM_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
    try {
      await fetch(CONFIG.GAS_CRM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildFormspreePayload(data)),
        mode: 'no-cors',
      });
    } catch (err) {
      console.warn('CRM post failed:', err);
    }
  }

  // Step 4 — Redirect
  const name = encodeURIComponent(data.fullName.split(' ')[0]);
  window.location.href = `thank-you.html?name=${name}`;
}

function buildFormspreePayload(data) {
  return {
    '_subject': `New Buyer Intake — ${data.fullName}`,
    full_name:          data.fullName,
    email:              data.email,
    phone:              data.phone,
    contact_method:     data.contactMethod,
    referral_source:    data.referralSource,
    property_type:      data.propertyType.join(', '),
    neighbourhoods:     data.neighbourhoods,
    must_have:          data.mustHave,
    deal_breakers:      data.dealBreakers,
    min_bedrooms:       data.minBedrooms,
    min_bathrooms:      data.minBathrooms,
    basement_suite:     data.basementSuite,
    garage:             data.garage,
    is_investment:      data.isInvestment ? 'Yes' : 'No',
    invest_units:       data.investUnits,
    invest_goal:        data.investGoal,
    invest_cashflow:    data.investCashflow,
    invest_cap_rate:    data.investCapRate,
    invest_financing:   data.investFinancing,
    invest_portfolio:   data.investPortfolio,
    invest_management:  data.investManagement,
    timeline:           data.timeline,
    budget:             data.budget,
    down_payment:       data.downPayment,
    preapproval:        data.preapproval,
    lender:             data.lender,
    housing_situation:  data.housingSituation,
    first_time_buyer:   data.firstTimeBuyer,
    other_agent:        data.otherAgent,
    questions:          data.questions,
    agent_notes:        data.agentNotes,
    crg_signed:         data.crgSigned,
    session_date:       data.sessionDate,
    next_steps:         data.nextSteps,
    mode:               state.mode,
    submission_date:    new Date().toISOString(),
  };
}

function setLoading(on) {
  const btn = document.querySelector('.btn-submit');
  if (!btn) return;
  btn.disabled = on;
  btn.classList.toggle('loading', on);
}

// --- Auto-fill session date --------------------------------

function autoFillSessionDate() {
  const dateEl = document.getElementById('session-date');
  if (dateEl) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }
}
