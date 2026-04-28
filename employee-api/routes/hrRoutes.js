const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/hr/employees
 * @desc    Get all employees (HR view)
 * @access  Private (HR, Admin)
 */
router.get('/employees', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.getAllEmployees
);

/**
 * @route   POST /api/v1/hr/employees
 * @desc    Create new employee
 * @access  Private (HR, Admin)
 */
router.post('/employees', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.createEmployee
);

/**
 * @route   PUT /api/v1/hr/employees/:id
 * @desc    Update employee
 * @access  Private (HR, Admin)
 */
router.put('/employees/:id', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.updateEmployee
);

/**
 * @route   GET /api/v1/hr/attendance-reports
 * @desc    Get attendance reports
 * @access  Private (HR, Admin)
 */
router.get('/attendance-reports', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.getAttendanceReports
);

/**
 * @route   GET /api/v1/hr/leave-requests
 * @desc    Get all leave requests (HR view)
 * @access  Private (HR, Admin)
 */
router.get('/leave-requests', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.getLeaveRequests
);

/**
 * @route   POST /api/v1/hr/salary-history
 * @desc    Create salary record
 * @access  Private (HR, Admin)
 */
router.post('/salary-history', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.createSalaryRecord
);

/**
 * @route   GET /api/v1/hr/reports
 * @desc    Get HR reports
 * @access  Private (HR, Admin)
 */
router.get('/reports', 
  verifyToken, 
  authorizeRoles('admin', 'hr'), 
  hrController.getHRReports
);

module.exports = router;
