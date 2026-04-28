const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getTodayAttendanceCount
} = require('../controllers/attendanceController');
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.use(verifyToken);
router.use(requireTenant);

router.get('/', (req, res, next) => {
  const role = req.user?.role === 'user' ? 'employee' : req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.MANAGER) {
    req.filterByManager = true;
    return next();
  }
  if (role === ROLES.USER) {
    req.filterByUser = true;
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, getAllAttendance);

router.get('/team', verifyRole([ROLES.MANAGER]), getAllAttendance);
router.get('/me', verifyRole([ROLES.USER]), getAllAttendance);
router.get('/my/month', verifyRole([ROLES.USER]), getAllAttendance);
router.post('/', verifyRole([ROLES.ADMIN, ROLES.HR]), createAttendance);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), updateAttendance);
router.delete('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), deleteAttendance);
router.get('/today/count', getTodayAttendanceCount);

router.get('/team-employees', verifyRole([ROLES.MANAGER]), async (req, res) => {
  try {
    const db = require('../db');
    const [rows] = await db.query(
      `SELECT emp_id, first_name, last_name, employee_code
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

module.exports = router;
