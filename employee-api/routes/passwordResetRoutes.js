const express = require('express');
const { body } = require('express-validator');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = req.validationErrors();
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Request Password Reset
 * POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail()
      .withMessage('Please enter a valid email address')
  ],
  handleValidationErrors,
  forgotPassword
);

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password',
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 32, max: 32 })
      .withMessage('Invalid reset token format'),
    
    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
      .withMessage('Password must contain uppercase, lowercase, numbers, and special characters'),
    
    body('confirmPassword')
      .trim()
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  handleValidationErrors,
  resetPassword
);

module.exports = router;
