const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken, requireTenant } = require('../middleware/authMiddleware');

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

router.post('/register', validateRegister, handleValidationErrors, authController.register);
router.post('/login', validateLogin, handleValidationErrors, authController.login);

router.get('/profile', verifyToken, requireTenant, authController.getProfile);
router.put('/update-profile', verifyToken, requireTenant, authController.updateProfile);
router.post('/logout', verifyToken, requireTenant, authController.logout);
router.get('/sessions/count', verifyToken, requireTenant, authController.getActiveSessionsCount);
router.get('/me', verifyToken, requireTenant, authController.getMe);

router.get('/verify', verifyToken, requireTenant, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
      token: req.token,
      tenantId: req.tenantId
    }
  });
});

module.exports = router;
