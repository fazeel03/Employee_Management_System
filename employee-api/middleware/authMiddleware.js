const jwt = require('jsonwebtoken');
const db = require('../db');
const { ROLES } = require('../constants/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

const normalizeRole = (role) => {
  if (role === 'user') return ROLES.USER;
  return role;
};

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Expected "Bearer <token>".'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'employee-management-system',
      audience: 'employee-management-users'
    });

    req.user = decoded;
    req.token = token;
    req.tenantId = decoded.tenantId || decoded.tenant_id || null;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed.',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

const requireTenant = (req, res, next) => {
  const tenantId = req.tenantId || req.user?.tenantId || req.user?.tenant_id;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      message: 'Tenant context missing. Please login again.',
      code: 'TENANT_CONTEXT_MISSING'
    });
  }

  req.tenantId = Number(tenantId);
  next();
};

const verifyRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const userRole = normalizeRole(req.user?.role);

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. User role not found.',
          code: 'ROLE_NOT_FOUND'
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}. Current role: ${userRole}.`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole
        });
      }

      req.userRoles = roles;
      req.hasRequiredRole = true;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification.',
        code: 'ROLE_VERIFICATION_ERROR'
      });
    }
  };
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'employee-management-system',
      audience: 'employee-management-users'
    });

    req.user = decoded;
    req.token = token;
    req.isAuthenticated = true;
    req.tenantId = decoded.tenantId || decoded.tenant_id || null;

    next();
  } catch (error) {
    next();
  }
};

const checkOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    try {
      const currentUserId = req.user?.userId;
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

      if (normalizeRole(req.user?.role) === ROLES.ADMIN) {
        return next();
      }

      if (currentUserId && String(currentUserId) === String(resourceUserId)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error during ownership check.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

const employeeSelfAccess = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or tenant context',
        code: 'INVALID_AUTH_CONTEXT'
      });
    }

    const [rows] = await db.query(
      `SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ? LIMIT 1`,
      [tenantId, req.user.email]
    );

    if (!rows.length) {
      return res.status(403).json({
        success: false,
        message: 'Employee profile not found for current tenant',
        code: 'EMPLOYEE_PROFILE_NOT_FOUND'
      });
    }

    req.employeeId = rows[0].emp_id;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve employee context',
      code: 'EMPLOYEE_CONTEXT_ERROR'
    });
  }
};

const authorizeRoles = (...requiredRoles) => verifyRole(requiredRoles);

const managerTeamAccess = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user?.role);

    if (role !== ROLES.MANAGER && role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.',
        code: 'MANAGER_ACCESS_REQUIRED'
      });
    }

    const [rows] = await db.query(
      'SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ? LIMIT 1',
      [req.tenantId, req.user.email]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Manager employee profile not found',
        code: 'MANAGER_PROFILE_NOT_FOUND'
      });
    }

    req.managerEmpId = rows[0].emp_id;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during manager access check.',
      code: 'MANAGER_ACCESS_ERROR'
    });
  }
};

module.exports = {
  verifyToken,
  requireTenant,
  verifyRole,
  authorizeRoles,
  managerTeamAccess,
  optionalAuth,
  checkOwnership,
  employeeSelfAccess
};
