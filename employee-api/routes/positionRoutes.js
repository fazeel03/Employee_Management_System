const express = require('express');
const router = express.Router();
const { getAllPositions, getPositionById, createPosition, updatePosition, deletePosition } = require('../controllers/positionController');
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.use(verifyToken);
router.use(requireTenant);

router.get('/', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), getAllPositions);
router.get('/:id', verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), getPositionById);
router.post('/', verifyRole([ROLES.ADMIN, ROLES.HR]), createPosition);
router.put('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), updatePosition);
router.delete('/:id', verifyRole([ROLES.ADMIN, ROLES.HR]), deletePosition);

module.exports = router;
