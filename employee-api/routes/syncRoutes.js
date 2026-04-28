const express = require('express');
const router = express.Router();
const { verifyToken, requireTenant, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const { syncAllUsers } = require('../services/userEmployeeSync');

router.use(verifyToken);
router.use(requireTenant);
router.use(verifyRole([ROLES.ADMIN]));

router.post('/users-to-employees', async (req, res) => {
  try {
    const results = await syncAllUsers(req.tenantId);

    res.status(200).json({
      success: true,
      message: 'User-employee sync completed',
      data: results
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync users to employees',
      error: error.message
    });
  }
});

module.exports = router;
