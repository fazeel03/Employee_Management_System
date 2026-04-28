const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { createEmployeeForUser } = require('../services/userEmployeeSync');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const DEFAULT_TENANT_KEY = process.env.DEFAULT_TENANT_KEY || 'default';

const resolveTenant = async (req) => {
  const tenantKey = (
    req.body?.tenantKey ||
    req.headers['x-tenant-key'] ||
    DEFAULT_TENANT_KEY
  ).toString().trim().toLowerCase();

  const [tenants] = await db.query(
    'SELECT tenant_id, tenant_key, tenant_name, status FROM tenants WHERE tenant_key = ? LIMIT 1',
    [tenantKey]
  );

  if (!tenants.length) {
    return null;
  }

  if (tenants[0].status !== 'active') {
    return { ...tenants[0], inactive: true };
  }

  return tenants[0];
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const role = 'employee';

    const tenant = await resolveTenant(req);
    if (!tenant) {
      return res.status(400).json({ success: false, message: 'Invalid tenant key' });
    }
    if (tenant.inactive) {
      return res.status(403).json({ success: false, message: 'Tenant is inactive' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100 || !/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid name format' });
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be 8 to 128 characters long' });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
      });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE tenant_id = ? AND email = ?',
      [tenant.tenant_id, email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists in this tenant'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (tenant_id, name, email, password, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [tenant.tenant_id, name.trim(), email.trim().toLowerCase(), hashedPassword, role]
    );

    try {
      await createEmployeeForUser({
        tenantId: tenant.tenant_id,
        userId: result.insertId,
        name,
        email: email.trim().toLowerCase(),
        role
      });
    } catch (empError) {
      console.error('Error creating employee record:', empError);
    }

    await logAuditEvent(tenant.tenant_id, result.insertId, 'REGISTER', 'user', result.insertId, clientIP, userAgent, {
      name,
      email: email.trim().toLowerCase(),
      role,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: result.insertId,
        tenant_id: tenant.tenant_id,
        tenant_key: tenant.tenant_key,
        name,
        email: email.trim().toLowerCase(),
        role,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const tenant = await resolveTenant(req);
    if (!tenant) {
      return res.status(400).json({ success: false, message: 'Invalid tenant key' });
    }
    if (tenant.inactive) {
      return res.status(403).json({ success: false, message: 'Tenant is inactive' });
    }

    const [users] = await db.query(
      `SELECT id, tenant_id, name, email, password, role, status
       FROM users
       WHERE tenant_id = ? AND email = ?`,
      [tenant.tenant_id, email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      await logFailedLogin(tenant.tenant_id, email, clientIP, userAgent);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      await logFailedLogin(tenant.tenant_id, email, clientIP, userAgent);
      return res.status(401).json({ success: false, message: 'Account is inactive. Please contact administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logFailedLogin(tenant.tenant_id, email, clientIP, userAgent);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const tokenPayload = {
      userId: user.id,
      tenantId: tenant.tenant_id,
      tenantKey: tenant.tenant_key,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
      issuer: 'employee-management-system',
      audience: 'employee-management-users'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: tenant.tenant_id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d' }
    );

    await storeRefreshToken(tenant.tenant_id, user.id, refreshToken);

    await db.query(
      'UPDATE users SET last_login = NOW() WHERE tenant_id = ? AND id = ?',
      [tenant.tenant_id, user.id]
    );

    await logAuditEvent(tenant.tenant_id, user.id, 'LOGIN', 'auth', user.id, clientIP, userAgent, {
      email: user.email,
      role: user.role
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        tenant: {
          tenant_id: tenant.tenant_id,
          tenant_key: tenant.tenant_key,
          tenant_name: tenant.tenant_name
        },
        user: userWithoutPassword,
        expiresIn: JWT_EXPIRE
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.tenantId;

    const [users] = await db.query(
      'SELECT id, tenant_id, name, email, role, status, created_at, last_login FROM users WHERE tenant_id = ? AND id = ?',
      [tenantId, userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (req.user) {
      await logAuditEvent(req.tenantId, req.user.userId, 'LOGOUT', 'auth', req.user.userId, clientIP, userAgent, {
        email: req.user.email,
        role: req.user.role
      });
    }

    await revokeUserRefreshTokens(req.tenantId, req.user?.userId);

    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove token from client storage.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during logout' });
  }
};

const storeRefreshToken = async (tenantId, userId, token) => {
  try {
    const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));

    await db.query(
      'INSERT INTO refresh_tokens (tenant_id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [tenantId, userId, token, expiresAt]
    );
  } catch (error) {
    console.error('Error storing refresh token:', error);
  }
};

const revokeUserRefreshTokens = async (tenantId, userId) => {
  try {
    await db.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE tenant_id = ? AND user_id = ? AND is_revoked = FALSE',
      [tenantId, userId]
    );
  } catch (error) {
    console.error('Error revoking refresh tokens:', error);
  }
};

const logFailedLogin = async (tenantId, email, ipAddress, userAgent) => {
  try {
    await db.query(
      'INSERT INTO failed_login_attempts (tenant_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [tenantId, email, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error logging failed login:', error);
  }
};

const logAuditEvent = async (tenantId, userId, action, resource, resourceId, ipAddress, userAgent, details = null) => {
  try {
    await db.query(
      'INSERT INTO audit_log (tenant_id, user_id, action, resource, resource_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tenantId, userId, action, resource, resourceId, ipAddress, userAgent, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.user_id || req.user?.sub;
    const tenantId = req.tenantId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in token' });
    }

    const [rows] = await db.query(
      `SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.role,
        u.status,
        u.last_login,
        u.created_at,
        COALESCE(CONCAT(e.first_name, ' ', e.last_name), u.name) AS name,
        e.phone,
        d.dept_name AS department,
        p.position_title AS position,
        e.emp_id
       FROM users u
       LEFT JOIN employees e ON u.tenant_id = e.tenant_id AND u.email = e.email
       LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
       LEFT JOIN positions p ON e.tenant_id = p.tenant_id AND e.position_id = p.position_id
       WHERE u.tenant_id = ? AND u.id = ?`,
      [tenantId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get user', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.user_id;
    const tenantId = req.tenantId;
    const { name, email, phone } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in token' });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE tenant_id = ? AND email = ? AND id != ?',
      [tenantId, email.trim().toLowerCase(), userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another user in this tenant' });
    }

    await db.query(
      'UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE tenant_id = ? AND id = ?',
      [name.trim(), email.trim().toLowerCase(), tenantId, userId]
    );

    if (phone && phone.trim()) {
      await db.query(
        'UPDATE employees SET phone = ? WHERE tenant_id = ? AND email = ?',
        [phone.trim(), tenantId, email.trim().toLowerCase()]
      );
    }

    await logAuditEvent(tenantId, userId, 'UPDATE_PROFILE', 'user', userId, clientIP, userAgent, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null
    });

    const [updatedUser] = await db.query(
      `SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.role,
        u.status,
        u.last_login,
        u.created_at,
        COALESCE(CONCAT(e.first_name, ' ', e.last_name), u.name) AS name,
        e.phone,
        d.dept_name AS department,
        p.position_title AS position,
        e.emp_id
       FROM users u
       LEFT JOIN employees e ON u.tenant_id = e.tenant_id AND u.email = e.email
       LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
       LEFT JOIN positions p ON e.tenant_id = p.tenant_id AND e.position_id = p.position_id
       WHERE u.tenant_id = ? AND u.id = ?`,
      [tenantId, userId]
    );

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while updating profile' });
  }
};

const getActiveSessionsCount = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const [rows] = await db.query(
      `SELECT COUNT(*) as count
       FROM refresh_tokens
       WHERE tenant_id = ?
         AND expires_at > NOW()
         AND is_revoked = 0`,
      [tenantId]
    );

    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getMe,
  logout,
  updateProfile,
  getActiveSessionsCount
};
