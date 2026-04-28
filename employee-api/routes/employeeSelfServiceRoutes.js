const express = require('express');
const router = express.Router();
const employeeSelfServiceController = require('../controllers/employeeSelfServiceController');
const { verifyToken, authorizeRoles, employeeSelfAccess } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/me
 * @desc    Get current employee profile
 * @access  Private (All authenticated users)
 */
router.get('/me', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.getProfile
);

/**
 * @route   GET /api/v1/my-projects
 * @desc    Get employee's projects
 * @access  Private (All authenticated users)
 */
router.get('/my-projects', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.getMyProjects
);

/**
 * @route   GET /api/v1/my-attendance
 * @desc    Get employee's attendance records
 * @access  Private (All authenticated users)
 */
router.get('/my-attendance', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.getMyAttendance
);

/**
 * @route   POST /api/v1/attendance/check-in
 * @desc    Check in for attendance
 * @access  Private (All authenticated users)
 */
router.post('/attendance/check-in', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.checkIn
);

/**
 * @route   POST /api/v1/attendance/check-out
 * @desc    Check out for attendance
 * @access  Private (All authenticated users)
 */
router.post('/attendance/check-out', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.checkOut
);

/**
 * @route   POST /api/v1/leave/apply
 * @desc    Apply for leave
 * @access  Private (All authenticated users)
 */
router.post('/leave/apply', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.applyLeave
);

/**
 * @route   GET /api/v1/leave/my-requests
 * @desc    Get employee's leave requests
 * @access  Private (All authenticated users)
 */
router.get('/leave/my-requests', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.getMyLeaveRequests
);

/**
 * @route   GET /api/v1/salary-history
 * @desc    Get employee's salary history
 * @access  Private (All authenticated users)
 */
router.get('/salary-history', 
  verifyToken, 
  employeeSelfAccess, 
  employeeSelfServiceController.getSalaryHistory
);

module.exports = router;
