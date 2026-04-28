const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.use(verifyToken);
router.use(requireTenant);

router.get('/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), departmentController.getDepartmentCount);
router.get('/', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), departmentController.getDepartments);
router.get('/:id', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), departmentController.getDepartmentById);
router.post('/', verifyRole([ROLES.ADMIN, ROLES.HR]), departmentController.createDepartment);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), departmentController.updateDepartment);
router.delete('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), departmentController.deleteDepartment);

module.exports = router;
