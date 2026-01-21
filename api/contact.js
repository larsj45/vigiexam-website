import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
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
      from: 'VigiExam <noreply@vigiexam.com>',
      to: ['sales@vigiexam.com'], // Change to your sales email
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
      from: 'VigiExam <noreply@vigiexam.com>',
      to: [email],
      subject: 'Thanks for your interest in VigiExam',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Thank you for contacting VigiExam!</h2>
          <p>Hi ${firstName},</p>
          <p>We've received your demo request and our team will be in touch within 24 hours to schedule a personalized walkthrough of our human-audited exam proctoring solution.</p>
          <p>In the meantime, here's what makes VigiExam different:</p>
          <ul>
            <li><strong>Human Oversight:</strong> Every AI flag is reviewed by certified proctors</li>
            <li><strong>Global Coverage:</strong> Live proctors across EU and Latin America</li>
            <li><strong>Enterprise Security:</strong> GDPR, ISO 27001, and SOC 2 compliant</li>
          </ul>
          <p>We look forward to speaking with you soon!</p>
          <p>Best regards,<br>The VigiExam Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">VigiExam - A Global Edtech Ventures company</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
