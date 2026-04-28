const express = require('express');
const router = express.Router();
const controller = require('../controllers/salaryController');
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.use(verifyToken);
router.use(requireTenant);

router.get('/total', verifyRole([ROLES.ADMIN, ROLES.HR]), controller.getTotalSalary);
router.get('/count', verifyRole([ROLES.ADMIN, ROLES.HR]), controller.getSalaryCount);

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
}, controller.getAllSalaryHistory);

router.get('/me', (req, res, next) => {
  const role = req.user?.role === 'user' ? 'employee' : req.user?.role;
  if (role === ROLES.USER || role === ROLES.MANAGER) {
    req.filterByUser = true;
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, controller.getAllSalaryHistory);

router.post('/', verifyRole([ROLES.ADMIN, ROLES.HR]), controller.addSalaryRecord);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), controller.updateSalaryRecord);
router.delete('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), controller.deleteSalaryRecord);

module.exports = router;
