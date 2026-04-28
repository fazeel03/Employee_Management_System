const nodemailer = require('nodemailer');

// Generate Ethereal test account
const generateTestEmail = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('=== ETHEREAL TEST EMAIL ACCOUNT ===');
    console.log('SMTP Host: smtp.ethereal.email');
    console.log('SMTP Port: 587');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);
    console.log('');
    console.log('=== UPDATE YOUR .ENV FILE ===');
    console.log('EMAIL_HOST=smtp.ethereal.email');
    console.log('EMAIL_PORT=587');
    console.log('EMAIL_SECURE=false');
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASS=${testAccount.pass}`);
    console.log(`EMAIL_FROM=Employee Management System <${testAccount.user}>`);
    console.log('');
    console.log('=== EMAIL PREVIEW URL ===');
    console.log('After sending emails, check them here:');
    console.log(`https://ethereal.email/messages/${testAccount.user}`);
    
  } catch (error) {
    console.error('Error generating test account:', error);
  }
};

generateTestEmail();
