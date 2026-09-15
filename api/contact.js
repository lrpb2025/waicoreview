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
    website,
    dpaAgreed,
  } = req.body || {};

  if (!surname || !givenName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (dpaAgreed !== true) {
    return res.status(400).json({ error: 'Data Protection Agreement must be accepted' });
  }

  const lines = [
    `Surname: ${surname}`,
    `Given Name: ${givenName}`,
    `Email: ${email}`,
    `Organization: ${organization || '(not provided)'}`,
    `Region: ${region || '(not provided)'}`,
    `Job Title: ${jobTitle || '(not provided)'}`,
    `Website: ${website || '(not provided)'}`,
    `Data Protection Agreement accepted: Yes`,
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
        to: 'lrpb2025@outlook.com',
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