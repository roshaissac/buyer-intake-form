/* ============================================================
   EmailJS initialisation + helpers
   Depends on: config.js loaded first, EmailJS CDN loaded
   ============================================================ */

(function () {
  emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
})();

/**
 * Build the EmailJS template params from form data.
 * `overrides` lets us re-target the same template (e.g. send a copy
 * to the internal lead-alert alias).
 */
function buildEmailParams(params, overrides) {
  const base = {
    to_name:        params.fullName,
    to_email:       params.email,
    phone:          params.phone,
    property_type:  Array.isArray(params.propertyType)
                      ? params.propertyType.join(', ')
                      : params.propertyType,
    neighbourhoods: params.neighbourhoods || 'Not specified',
    budget:         params.budget,
    timeline:       params.timeline,
    preapproval:    params.preapproval,
    next_steps:     params.nextSteps || 'I will be in touch within 24 hours.',
    // Investment summary — blank for ordinary buyers, populated for multi-family.
    investment_summary: params.isInvestment
      ? [
          params.investUnits     && `Units: ${params.investUnits}`,
          params.investGoal      && `Goal: ${params.investGoal}`,
          params.investCashflow  && `Target cash flow: ${params.investCashflow}`,
          params.investFinancing && `Financing: ${params.investFinancing}`,
        ].filter(Boolean).join('  •  ')
      : '',
    agent_name:     CONFIG.AGENT_NAME,
    agent_email:    CONFIG.AGENT_EMAIL,
    agent_phone:    CONFIG.AGENT_PHONE,
    pdf_url:        'https://buyer-intake-form.rosh-4d0.workers.dev/assets/consumer-relationships-guide-brochure.pdf',
  };
  return Object.assign(base, overrides || {});
}

/**
 * Send the branded welcome email to the CLIENT.
 * Returns a Promise so form.js can await it.
 */
async function sendThankYouEmail(params) {
  return emailjs.send(
    CONFIG.EMAILJS_SERVICE_ID,
    CONFIG.EMAILJS_TEMPLATE_ID,
    buildEmailParams(params)
  );
}

/**
 * Send a branded copy to the internal lead-alert alias (info@…).
 * This ALWAYS fires (both modes) so Rosh never misses a lead,
 * independent of the client email and the Formspree filter.
 */
async function sendLeadAlert(params) {
  return emailjs.send(
    CONFIG.EMAILJS_SERVICE_ID,
    CONFIG.EMAILJS_TEMPLATE_ID,
    buildEmailParams(params, { to_email: CONFIG.LEAD_ALERT_EMAIL })
  );
}
