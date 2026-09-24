export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    surname,
    givenName,
    organization,
    region,
    email,
    jobTitle,
    shareConsent,
    website,
    'website-url': honeypot,
  } = req.body || {};

  // Honeypot check: real visitors never fill this hidden field, so if it
  // has any value, silently pretend success and drop the submission.
  if (honeypot) {
    return res.status(200).json({ success: true });
  }

  if (!surname || !givenName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const lines = [
    `Surname: ${surname}`,
    `Given Name: ${givenName}`,
    `Email: ${email}`,
    `Organization: ${organization || '(not provided)'}`,
    `Region: ${region || '(not provided)'}`,
    `Job Title: ${jobTitle || '(not provided)'}`,
    `Website: ${website || '(not provided)'}`,
    `Consent to share contact details with other Participants: ${shareConsent ? 'Yes' : 'No'}`,,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WAICO Review Contact Form <onboarding@resend.dev>',
        to: 'dataprotection@waicoreview.com', // <-- replace with the address you want submissions sent to
        reply_to: email,
        subject: `New submission from ${givenName} ${surname}`,
        text: lines,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
      return res.status(502).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
