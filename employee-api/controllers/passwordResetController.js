const db = require('../config/database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create password reset token
const createResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send password reset email
const sendResetEmail = async (email, resetToken) => {
  try {
    // Create transporter for Zoho Mail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });

    console.log('🔗 Testing Zoho connection...');
    console.log(`📧 Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    console.log(`👤 User: ${process.env.EMAIL_USER}`);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Zoho connection verified!');

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Employee Management System',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Employee Management System</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello,</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset your password for your Employee Management System account. 
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; font-weight: bold; font-size: 16px; 
                        display: inline-block; transition: all 0.3s ease;"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0; font-size: 14px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; line-height: 1.6; margin: 10px 0 20px 0; padding-left: 20px;">
              <li>This link will expire in <strong>15 minutes</strong> for security reasons</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't request this reset, your account may be at risk. 
                Please contact your administrator immediately.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              This is an automated message from Employee Management System. Please do not reply to this email.
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
              © 2024 Employee Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    console.log('📤 Sending password reset email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Response:', error.response);
    return false;
  }
};

/**
 * Request Password Reset
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Input validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE email = ? AND status = "active"',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];

    // Create reset token
    const resetToken = createResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log('🔑 Generated reset token:', resetToken);
    console.log('⏰ Token expires at:', expiresAt);
    console.log('👤 Token for user:', user.email);

    // Store reset token in database
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [user.id, resetToken, expiresAt]
    );

    console.log('💾 Token stored in database');

    // Log the password reset request
    await db.query(
      'INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, 'PASSWORD_RESET_REQUEST', 'auth', user.id, clientIP, userAgent, JSON.stringify({ email: user.email })]
    );

    // Log reset URL to console for development
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    console.log('=== PASSWORD RESET LINK ===');
    console.log('Email:', user.email);
    console.log('Reset URL:', resetUrl);
    console.log('Token:', resetToken);
    console.log('Expires in:', '15 minutes');
    console.log('==========================');

    // Send reset email
    const emailSent = await sendResetEmail(user.email, resetToken);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email address.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset request'
    });
  }
};

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Input validation
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, numbers, and special characters'
      });
    }

    // Find valid reset token
    const [resetTokens] = await db.query(
      'SELECT prt.user_id, prt.expires_at, u.email FROM password_reset_tokens prt ' +
      'JOIN users u ON prt.user_id = u.id ' +
      'WHERE prt.token = ? AND prt.is_used = FALSE AND prt.expires_at > NOW()',
      [token]
    );

    if (resetTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const resetTokenData = resetTokens[0];

    // Hash new password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update user password
      await connection.query(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, resetTokenData.user_id]
      );

      // Mark reset token as used
      await connection.query(
        'UPDATE password_reset_tokens SET is_used = TRUE, used_at = NOW() WHERE token = ?',
        [token]
      );

      // Log password reset
      await connection.query(
        'INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [resetTokenData.user_id, 'PASSWORD_RESET', 'auth', resetTokenData.user_id, clientIP, userAgent, JSON.stringify({ email: resetTokenData.email })]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset'
    });
  }
};

/**
 * Validate Reset Token
 * POST /api/v1/auth/validate-reset-token
 */
const validateResetToken = async (req, res) => {
  try {
    console.log('🔍 Token validation request received');
    console.log('📋 Request body:', req.body);
    
    const { token } = req.body;

    if (!token) {
      console.log('❌ No token provided in request body');
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    // Find valid reset token
    const [resetTokens] = await db.query(
      'SELECT prt.user_id, prt.expires_at, u.email FROM password_reset_tokens prt ' +
      'JOIN users u ON prt.user_id = u.id ' +
      'WHERE prt.token = ? AND prt.is_used = FALSE AND prt.expires_at > NOW()',
      [token]
    );

    console.log('📊 Query results:', resetTokens.length, 'tokens found');

    if (resetTokens.length === 0) {
      console.log('❌ No valid token found in database');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const tokenData = resetTokens[0];
    console.log('✅ Token valid for user:', tokenData.email);
    console.log('⏰ Token expires at:', tokenData.expires_at);

    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: tokenData.email,
        expiresAt: tokenData.expires_at
      }
    });

  } catch (error) {
    console.error('❌ Validate token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token validation'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  validateResetToken
};
