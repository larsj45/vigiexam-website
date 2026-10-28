const { Resend } = require('resend');

// Fail closed until the lead privacy notice and handling have been validated.
const CONTACT_FORM_ENABLED = false;
let resend;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CONTACT_FORM_ENABLED) {
    return res.status(503).json({ error: 'Online enquiries are temporarily unavailable', code: 'CONTACT_FORM_PAUSED' });
  }

  try {
    const { firstName, lastName, email, company, role, volume, message,
            leadReferrer, leadLanding, utmSource, utmMedium, utmCampaign } = req.body || {};

    // Validate required fields and reject header-breaking or malformed email values.
    if (!firstName || !lastName || !email || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof email !== 'string' || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const safe = {
      firstName: escapeHtml(firstName),
      lastName: escapeHtml(lastName),
      email: escapeHtml(email),
      company: escapeHtml(company),
      role: escapeHtml(role || 'Not specified'),
      volume: escapeHtml(volume || 'Not specified'),
      message: escapeHtml(message || 'No message provided').replace(/\r?\n/g, '<br>'),
      leadReferrer: escapeHtml(leadReferrer || 'Not captured'),
      leadLanding: escapeHtml(leadLanding || 'Not captured'),
      utmSource: escapeHtml(utmSource || 'Not captured'),
      utmMedium: escapeHtml(utmMedium || 'Not captured'),
      utmCampaign: escapeHtml(utmCampaign || 'Not captured'),
    };

    resend ??= new Resend(process.env.RESEND_API_KEY);

    // Send a neutral enquiry notification to the existing team recipient.
    const { data, error } = await resend.emails.send({
      from: 'VigiExam <noreply@vigiexam.eu>',
      to: ['larsjaner45@gmail.com'], // Existing notification recipient
      subject: 'New VigiExam enquiry',
      html: `
        <h2>New VigiExam enquiry</h2>
        <p><strong>Name:</strong> ${safe.firstName} ${safe.lastName}</p>
        <p><strong>Email:</strong> ${safe.email}</p>
        <p><strong>Organisation:</strong> ${safe.company}</p>
        <p><strong>Role:</strong> ${safe.role}</p>
        <p><strong>Approximate annual assessment volume:</strong> ${safe.volume}</p>
        <p><strong>Business requirements or questions:</strong></p>
        <p>${safe.message}</p>
        <hr>
        <h3 style="font-size: 14px; color: #0d9488;">Lead source</h3>
        <p><strong>Referrer:</strong> ${safe.leadReferrer}</p>
        <p><strong>Landing page:</strong> ${safe.leadLanding}</p>
        <p><strong>UTM source / medium / campaign:</strong> ${safe.utmSource} / ${safe.utmMedium} / ${safe.utmCampaign}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This enquiry came from the VigiExam website form. It is an initial enquiry about an exam platform, recording review or live invigilation. Service scope, staffing and availability must be agreed before delivery.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Confirm receipt without promising a response time, demonstration, pilot, or service.
    await resend.emails.send({
      from: 'VigiExam <noreply@vigiexam.eu>',
      to: [email],
      subject: 'VigiExam enquiry received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Your enquiry has been received</h2>
          <p>Hello ${safe.firstName},</p>
          <p>Thank you for contacting VigiExam. We have received your enquiry about your assessment programme, whether you need an exam platform, human review of recordings or live invigilation.</p>
          <p>VigiExam, operated by Auditelle SASU in France, helps organisations explore TestWe for exam delivery and scope human services separately. Live onboarding checks and supervision throughout the exam are different service scopes.</p>
          <p>This email confirms receipt only. Any service, demonstration or pilot depends on agreed requirements, staffing, languages, volumes, scheduling and availability. Responsibilities, pricing and turnaround are confirmed in a separate proposal.</p>
          <p>Please do not send candidate data or exam recordings by reply.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">VigiExam · operated by Auditelle SASU (France)</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
