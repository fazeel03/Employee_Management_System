const express = require('express');
const router = express.Router();
const controller = require('../controllers/leaveController');
const { verifyToken, requireTenant, verifyRole, checkOwnership } = require('../middleware/authMiddleware');
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
}, controller.getAllLeaveRequests);

router.get('/team', verifyRole([ROLES.MANAGER]), controller.getAllLeaveRequests);
router.get('/me', verifyRole([ROLES.USER]), checkOwnership('id'), controller.getAllLeaveRequests);
router.post('/', controller.applyLeave);
router.put('/:id/approve', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), controller.approveLeave);
router.put('/:id/reject', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), controller.rejectLeave);
router.put('/:id', (req, res, next) => {
  const role = req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.USER || role === ROLES.MANAGER) {
    req.checkOwnershipForEdit = true;
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, controller.updateLeaveStatus);

router.delete('/:id', (req, res, next) => {
  const role = req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.USER) {
    req.checkOwnershipForDelete = true;
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, controller.deleteLeave);

router.get('/pending/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), controller.getPendingLeaveCount);

module.exports = router;
