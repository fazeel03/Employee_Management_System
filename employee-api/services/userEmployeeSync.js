// services/userEmployeeSync.js
// Helper service to maintain sync between users and employees tables

const db = require('../db');

async function createEmployeeForUser(userData) {
  const { tenantId, userId, name, email, role } = userData;

  if (role !== 'employee') {
    return null;
  }

  try {
    const [maxRow] = await db.query(
      'SELECT MAX(emp_id) as maxId FROM employees WHERE tenant_id = ?',
      [tenantId]
    );
    const nextId = (maxRow[0].maxId || 0) + 1;
    const year = new Date().getFullYear();
    const employee_code = `EMP-${year}-${String(nextId).padStart(3, '0')}`;

    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || nameParts[0];

    const [result] = await db.query(
      `INSERT INTO employees
       (tenant_id, employee_code, first_name, last_name, email, hire_date, status, user_id)
       VALUES (?, ?, ?, ?, ?, CURDATE(), 'Active', ?)`,
      [tenantId, employee_code, first_name, last_name, email, userId]
    );

    return {
      emp_id: result.insertId,
      tenant_id: tenantId,
      employee_code,
      first_name,
      last_name,
      email
    };
  } catch (error) {
    console.error('Error creating employee record:', error);
    throw error;
  }
}

async function hasEmployeeRecord(tenantId, email) {
  const [rows] = await db.query(
    'SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?',
    [tenantId, email]
  );
  return rows.length > 0;
}

async function getEmployeeByEmail(tenantId, email) {
  const [rows] = await db.query(
    'SELECT * FROM employees WHERE tenant_id = ? AND email = ?',
    [tenantId, email]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function syncAllUsers(tenantId) {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at
       FROM users u
       LEFT JOIN employees e ON u.tenant_id = e.tenant_id AND u.email = e.email
       WHERE u.tenant_id = ? AND e.emp_id IS NULL AND u.role = 'employee'`,
      [tenantId]
    );

    const results = {
      total: users.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        await createEmployeeForUser({
          tenantId,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing users:', error);
    throw error;
  }
}

module.exports = {
  createEmployeeForUser,
  hasEmployeeRecord,
  getEmployeeByEmail,
  syncAllUsers
};
