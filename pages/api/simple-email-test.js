const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // GoDaddy SMTP configuration for digitalcareercenter.com
    const smtpConfigs = [
      { host: 'smtp.secureserver.net', port: 587, secure: false }, // GoDaddy SMTP
      { host: 'smtp.secureserver.net', port: 465, secure: true },  // GoDaddy SMTP SSL
      { host: 'smtpout.secureserver.net', port: 587, secure: false }, // Alternative GoDaddy
      { host: 'smtpout.secureserver.net', port: 465, secure: true },  // Alternative GoDaddy SSL
    ];

    let transporter;
    let lastError;

    for (const config of smtpConfigs) {
      try {
        transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: 'Info@digitalcareercenter.com',
            pass: '786786Abc@',
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        await transporter.verify();
        console.log(`✅ Email server ready with ${config.host}:${config.port}`);
        break;
      } catch (error) {
        lastError = error;
        console.log(`❌ Failed with ${config.host}:${config.port} - ${error.message}`);
        continue;
      }
    }

    if (!transporter) {
      throw new Error(`All SMTP configurations failed. Last error: ${lastError.message}`);
    }

    // Test connection
    await transporter.verify();
    console.log('✅ Email server is ready');

    // Send test email
    const { testEmail } = req.body;
    const mailOptions = {
      from: 'Info@digitalcareercenter.com',
      to: testEmail || 'Info@digitalcareercenter.com',
      subject: 'Test Email from DCC',
      text: 'This is a test email from Digital Career Center.',
      html: '<h1>Test Email</h1><p>This is a test email from Digital Career Center.</p>'
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      message: 'Test email sent successfully!',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      message: 'Email test failed',
      error: error.message
    });
  }
}
