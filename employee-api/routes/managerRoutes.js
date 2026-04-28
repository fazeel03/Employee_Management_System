const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { verifyToken, requireTenant, authorizeRoles, managerTeamAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireTenant);

router.get('/team', authorizeRoles('admin', 'manager'), managerTeamAccess, managerController.getTeamMembers);
router.get('/team-attendance', authorizeRoles('admin', 'manager'), managerTeamAccess, managerController.getTeamAttendance);
router.get('/team-leaves', authorizeRoles('admin', 'manager'), managerTeamAccess, managerController.getTeamLeaveRequests);
router.put('/leave-requests/:id/approve', authorizeRoles('admin', 'manager'), managerTeamAccess, managerController.approveLeaveRequest);
router.get('/team-projects', authorizeRoles('admin', 'manager'), managerTeamAccess, managerController.getTeamProjects);
router.post('/project-assignment', authorizeRoles('admin', 'manager'), managerTeamAccess, managerController.assignToProject);

module.exports = router;
