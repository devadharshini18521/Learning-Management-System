
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Debug: Check if API key is configured
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ WARNING: RESEND_API_KEY is not set! Emails will not be sent.');
}

const sendEmail = async (options) => {
  // Check if API key is available
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ Email sending failed: RESEND_API_KEY not configured');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    console.log(`📧 Attempting to send email to: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    console.log(`✅ Email sent successfully to ${options.to}`);
    console.log(`   Message ID: ${data?.id}`);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error(`   To: ${options.to}`);
    console.error(`   Subject: ${options.subject}`);
    console.error(`   Error: ${error.message}`);
    
    if (error.response?.body) {
      console.error(`   Resend Error Details:`, error.response.body);
    }

    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
