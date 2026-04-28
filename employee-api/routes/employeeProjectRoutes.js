const express = require('express');
const router = express.Router();
const {
  getAllEmployeeProjects,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/employeeProjectController');
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.use(verifyToken);
router.use(requireTenant);

router.get('/', getAllEmployeeProjects);
router.post('/', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), createAssignment);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), updateAssignment);
router.delete('/:id', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), deleteAssignment);

module.exports = router;
