const validateEmployee = require('../middleware/validateEmployee');
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { ROLES } = require('../constants/roles');
const db = require('../db');

router.use(verifyToken);
router.use(requireTenant);

router.get('/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getEmployeeCount);
router.get('/managers', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getManagers);
router.get('/new-hires/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getNewHiresCount);
router.get('/active', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getActiveEmployees);
router.get('/', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getAllEmployees);

router.get('/me', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE tenant_id = ? AND email = ?',
      [req.tenantId, req.user.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch employee record', error: err.message });
  }
});

router.get('/team', verifyRole([ROLES.MANAGER]), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT emp_id, employee_code, first_name, last_name,
              email, phone, dept_id, position_id, status
       FROM employees
       WHERE tenant_id = ?
         AND manager_id = (
           SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?
         )`,
      [req.tenantId, req.tenantId, req.user.email]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', employeeController.getEmployeeById);
router.post('/', verifyRole([ROLES.ADMIN, ROLES.HR]), validateEmployee, employeeController.createEmployee);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), validateEmployee, employeeController.updateEmployee);
router.delete('/:id', verifyRole([ROLES.ADMIN]), employeeController.deleteEmployee);

module.exports = router;
