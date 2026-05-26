/* ============================================================
   EmailJS initialisation + helper
   Depends on: config.js loaded first, EmailJS CDN loaded
   ============================================================ */

(function () {
  emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
})();

/**
 * Send the buyer thank-you email.
 * Returns a Promise so form.js can await it.
 */
async function sendThankYouEmail(params) {
  return emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
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
    agent_name:     CONFIG.AGENT_NAME,
    agent_email:    CONFIG.AGENT_EMAIL,
    agent_phone:    CONFIG.AGENT_PHONE,
  });
}
