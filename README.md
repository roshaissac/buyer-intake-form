# Buyer Intake Form — Sheena & Rosh Issac Property Group

Branded multi-step buyer intake form with EmailJS welcome email, Formspree CRM webhook, and Zapier automation. Hosted on Cloudflare Pages, deployed from GitHub.

---

## Quick Setup Checklist

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/buyer-intake-form.git
cd buyer-intake-form
```

Open `js/config.js` — this is the only file you need to edit before deploying.

---

### 2. Formspree — form backend + Zapier webhook trigger

1. Go to [formspree.io](https://formspree.io) → sign up / log in
2. **New Form** → name it "Buyer Intake — Issac Realty"
3. Copy the Form ID from the URL (the hash after `/f/`) — e.g. `xkndblpj`
4. Paste it into `js/config.js`:
   ```js
   FORMSPREE_FORM_ID: 'xkndblpj',
   ```
5. In Formspree dashboard → **Integrations** → **Webhook** → paste your Zapier Webhook URL (from step 4 below)

---

### 3. EmailJS — client-side thank-you email

1. Go to [emailjs.com](https://www.emailjs.com) → sign up / log in
2. **Email Services** → Add New Service → connect your Gmail (rosh@issacrealty.com)
   - Copy the **Service ID** (e.g. `service_abc1234`)
3. **Email Templates** → Create New Template
   - **Name:** `buyer_thankyou`
   - **Subject:** `Welcome to the Journey, {{to_name}} - Your Calgary Home Search Starts Now`
   - **Body (HTML):** Copy the entire contents of `templates/email-thankyou.html`
   - **To Email:** `{{to_email}}`
   - **From Name:** `Rosh Issac - Sheena & Rosh Issac Property Group`
   - Copy the **Template ID** (e.g. `template_xyz9876`)
4. **Account** → **Public Key** (e.g. `user_aBcDeFgHiJ`)
5. Add all three to `js/config.js`:
   ```js
   EMAILJS_PUBLIC_KEY:  'user_aBcDeFgHiJ',
   EMAILJS_SERVICE_ID:  'service_abc1234',
   EMAILJS_TEMPLATE_ID: 'template_xyz9876',
   ```

---

### 4. Zapier — WhatsApp/SMS + CRM entry

> Free plan = 2 Zaps, each with exactly one trigger + one action.

#### Zap 1 — Thank You WhatsApp/SMS

| Step | Setting |
|------|---------|
| Trigger | **Formspree** → New Submission |
| Action | **Twilio** → Send WhatsApp Message *(or SMS if WhatsApp not approved)* |

**Message template:**
```
Hi {{first_name}}, it's Rosh from Issac Realty! 🏡
Thanks for completing your Buyer Intake — I've sent your welcome package to {{email}}.
I'll be in touch within 24 hours. Excited to help you find your perfect home in Calgary!
```

> **WhatsApp note:** Twilio WhatsApp Business requires an approved message template. For SMS, any Twilio number works immediately.

After saving Zap 1, copy the **Zapier Webhook URL** and paste it into Formspree → Integrations → Webhook.

#### Zap 2 — CRM / Google Sheets Entry

| Step | Setting |
|------|---------|
| Trigger | **Formspree** → New Submission *(same webhook URL)* |
| Action | **Google Sheets** → Create Spreadsheet Row |

**Sheet columns to map:**

| Sheet Column | Formspree Field |
|---|---|
| Date | `submission_date` |
| Name | `full_name` |
| Email | `email` |
| Phone | `phone` |
| Budget | `budget` |
| Timeline | `timeline` |
| Property Type | `property_type` |
| Neighbourhoods | `neighbourhoods` |
| Pre-Approval | `preapproval` |
| Status | *(hardcode "New Lead")* |

---

### 5. Deploy to Cloudflare Pages

1. Push this repo to GitHub (public or private — Cloudflare Pages supports both)
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project** → **Connect to Git**
3. Select the `buyer-intake-form` repo → **Begin setup**
4. Build settings:
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: `/`
5. Click **Save and Deploy** — first deploy takes ~30 seconds

> Your form will be live at `buyer-intake-form.pages.dev` (or a custom domain you configure).

---

### 6. Add your phone number

Open `js/config.js` and replace `(403) 000-0000` with Rosh's real number. This appears in the thank-you email footer.

---

### 7. Add your logo

Drop a `logo.png` file into the `assets/` folder (transparent background, ~200px tall recommended). The `<img>` in the header has an `onerror` fallback so the header looks fine without it too.

---

### 8. End-to-end test

- [ ] Open the form → fill Section 1 with **your own email + phone**
- [ ] Complete all sections → click through to review screen
- [ ] Submit → check your **email inbox** for the thank-you email
- [ ] Check your **SMS/WhatsApp** for the Zapier message
- [ ] Check your **Google Sheet** for the new row
- [ ] Confirm redirect lands on `thank-you.html` with your name in the URL

---

## Project Structure

```
buyer-intake-form/
├── index.html              # Multi-step intake form (client + agent modes)
├── thank-you.html          # Post-submission confirmation page
├── css/
│   └── style.css           # Brand tokens, layout, responsive styles
├── js/
│   ├── config.js           # ← Fill in your keys here
│   ├── emailjs-init.js     # EmailJS SDK init + sendEmail() helper
│   └── form.js             # Form logic, validation, multi-step nav, submission
├── assets/
│   ├── logo.png            # Issac Realty logo (add your own)
│   ├── og-card.png         # Open Graph image for WhatsApp/social sharing (add your own)
│   └── crg-brief.html      # Standalone CRG reference doc (for printing/sharing)
├── templates/
│   └── email-thankyou.html # EmailJS template source (paste into EmailJS dashboard)
└── README.md               # This file
```

---

## Agent Mode

Bookmark this URL on your laptop/tablet for guided sessions:

```
https://YOUR-DOMAIN.pages.dev/?agent=true
```

Agent mode reveals Section 5 (internal notes, CRG checkbox, next steps) and changes the submit button label. It's toggled client-side — no login required.

---

## Security Notes

- **Formspree Form ID** and **EmailJS Public Key** are intentionally client-side. They are designed to be public-facing. Rate limiting and spam protection is handled by Formspree and EmailJS respectively.
- Agent notes submitted via Formspree are sent to your email and CRM — they do **not** appear in the client's welcome email.
- No server-side code. No database. No PII stored by this repo.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Email not sending | Check EmailJS key/service/template IDs in `config.js`. Check EmailJS dashboard for send logs. |
| Form submits but no Zapier trigger | Confirm Zapier Webhook URL is pasted in Formspree → Integrations → Webhook |
| WhatsApp message not arriving | Check Twilio WhatsApp sandbox approval status. Try SMS fallback first. |
| `thank-you.html` redirect not working | Ensure `FORMSPREE_FORM_ID` in `config.js` is correct — a 404 from Formspree skips the redirect |
| Agent mode not showing | Try adding `?agent=true` to the URL. Or click the "Agent-Guided Session" toggle. |

---

*Sheena & Rosh Issac Property Group · Associates of Dreamhouse Realty Ltd., Calgary · Built May 2026*
