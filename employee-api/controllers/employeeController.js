const db = require('../db');

exports.getActiveEmployees = async (req, res, next) => {
  try {
    const [results] = await db.query(
      `SELECT
        e.emp_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.status,
        p.position_title,
        d.dept_name
      FROM employees e
      LEFT JOIN positions p ON e.tenant_id = p.tenant_id AND e.position_id = p.position_id
      LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
      WHERE e.tenant_id = ? AND e.status = 'Active'
      ORDER BY e.first_name ASC`,
      [req.tenantId]
    );

    res.status(200).json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
};

exports.getAllEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sort = req.query.sort || 'emp_id';
    const order = req.query.order && req.query.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const allowedSortFields = ['emp_id', 'first_name', 'last_name', 'email', 'hire_date', 'created_at'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'emp_id';

    let searchQuery = '';
    const params = [req.tenantId];

    if (search) {
      searchQuery = ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM employees WHERE tenant_id = ?${searchQuery}`,
      params
    );

    const [results] = await db.query(
      `SELECT * FROM employees
       WHERE tenant_id = ?${searchQuery}
       ORDER BY ${sortField} ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalRecords,
      totalPages,
      sort: sortField,
      order,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const role = req.user?.role;
    const userId = req.user?.userId;

    if (role === 'employee' || role === 'user') {
      const [ownership] = await db.query(
        `SELECT e.emp_id
         FROM employees e
         JOIN users u ON e.tenant_id = u.tenant_id AND e.email = u.email
         WHERE e.tenant_id = ? AND e.emp_id = ? AND u.id = ?`,
        [req.tenantId, id, userId]
      );

      if (!ownership.length) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only access your own employee record.' });
      }
    }

    const [results] = await db.query(
      'SELECT * FROM employees WHERE tenant_id = ? AND emp_id = ?',
      [req.tenantId, id]
    );

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, data: results[0] });
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone = null, hire_date, status = 'Active', dept_id = null, position_id = null, manager_id = null } = req.body;

    const [maxRow] = await db.query('SELECT MAX(emp_id) as maxId FROM employees WHERE tenant_id = ?', [req.tenantId]);
    const nextId = (maxRow[0].maxId || 0) + 1;
    const year = new Date().getFullYear();
    const employee_code = `EMP-${year}-${String(nextId).padStart(3, '0')}`;

    const [result] = await db.query(
      `INSERT INTO employees
       (tenant_id, employee_code, first_name, last_name, email, phone, hire_date, status, dept_id, position_id, manager_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, employee_code, first_name, last_name, email, phone, hire_date, status, dept_id, position_id, manager_id]
    );

    res.status(201).json({ success: true, message: 'Employee created successfully', employeeId: result.insertId, employee_code });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { first_name, last_name, email, phone, hire_date, status, dept_id, position_id, manager_id } = req.body;

    const [result] = await db.query(
      `UPDATE employees SET
        first_name = ?, last_name = ?, email = ?, phone = ?, hire_date = ?, status = ?, dept_id = ?, position_id = ?, manager_id = ?
       WHERE tenant_id = ? AND emp_id = ?`,
      [first_name, last_name, email, phone, hire_date, status, dept_id, position_id, manager_id, req.tenantId, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [result] = await db.query('DELETE FROM employees WHERE tenant_id = ? AND emp_id = ?', [req.tenantId, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM employees WHERE tenant_id = ? AND status = 'Active'`,
      [req.tenantId]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

exports.getNewHiresCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count
       FROM employees
       WHERE tenant_id = ?
         AND MONTH(hire_date) = MONTH(NOW())
         AND YEAR(hire_date) = YEAR(NOW())`,
      [req.tenantId]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

exports.getManagers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT emp_id, employee_code, first_name, last_name
       FROM employees
       WHERE tenant_id = ? AND status = 'Active'
       ORDER BY first_name ASC`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE tenant_id = ? AND email = ?',
      [req.tenantId, req.user.email]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};
