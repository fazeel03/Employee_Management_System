// Mock email service for development - logs to console instead of sending
const sendResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    console.log('=== EMAIL LOG (Development Mode) ===');
    console.log('To:', email);
    console.log('Reset URL:', resetUrl);
    console.log('Token:', resetToken);
    console.log('');
    console.log('=== EMAIL CONTENT ===');
    console.log('Subject: Password Reset Request - Employee Management System');
    console.log('Body: Click the link below to reset your password:');
    console.log(resetUrl);
    console.log('====================================');
    
    return true;
  } catch (error) {
    console.error('Email logging error:', error);
    return false;
  }
};

module.exports = { sendResetEmail };
