const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, requireTenant, verifyRole, checkOwnership } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.use(verifyToken);
router.use(requireTenant);

router.get('/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getProjectCount);
router.get('/active/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getActiveProjectCount);
router.get('/completed/count', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getCompletedProjectsCount);

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
}, projectController.getAllProjects);

router.get('/me', verifyRole([ROLES.USER]), checkOwnership('id'), projectController.getAllProjects);
router.get('/my/count', verifyRole([ROLES.USER]), projectController.getProjectCount);
router.get('/:id', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), projectController.getProjectById);
router.post('/', verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.createProject);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.MANAGER]), projectController.updateProject);
router.delete('/:id', verifyRole([ROLES.ADMIN]), projectController.deleteProject);

module.exports = router;
