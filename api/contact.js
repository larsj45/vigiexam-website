const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, company, role, volume, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send notification email to your team
    const { data, error } = await resend.emails.send({
      from: 'VigiExam <noreply@vigiexam.eu>',
      to: ['larsjaner45@gmail.com'], // Your email for notifications
      subject: `New Demo Request from ${firstName} ${lastName} - ${company}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Role:</strong> ${role || 'Not specified'}</p>
        <p><strong>Expected Volume:</strong> ${volume || 'Not specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This lead came from the VigiExam website contact form.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Send confirmation email to the user
    await resend.emails.send({
      from: 'VigiExam <noreply@vigiexam.eu>',
      to: [email],
      subject: 'Thanks for your interest in VigiExam',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Thank you for contacting VigiExam!</h2>
          <p>Hi ${firstName},</p>
          <p>We've received your request and a member of our team will be in touch shortly to understand your needs and put together the right setup for you.</p>
          <p>In the meantime, here's what VigiExam helps you do:</p>
          <ul>
            <li><strong>AI proctoring:</strong> identity verification, screen and audio monitoring, and tab-switch reporting during each exam</li>
            <li><strong>Clear reports:</strong> a detailed report after every exam to support your review</li>
            <li><strong>Human review when it helps:</strong> optional human oversight for flagged cases</li>
            <li><strong>EU data protection:</strong> your data is handled in line with GDPR</li>
          </ul>
          <p>We look forward to speaking with you soon!</p>
          <p>Best regards,<br>The VigiExam Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">VigiExam &middot; operated by Auditelle SASU (France)</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
