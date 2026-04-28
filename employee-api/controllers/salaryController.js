const db = require('../db');

exports.addSalaryRecord = async (req, res, next) => {
  try {
    const { emp_id, salary_amount, effective_from, effective_to, change_reason } = req.body;

    const [result] = await db.query(
      `INSERT INTO salary_history (tenant_id, emp_id, salary_amount, effective_from, effective_to, change_reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.tenantId, emp_id, salary_amount, effective_from, effective_to, change_reason]
    );

    res.status(201).json({ success: true, message: 'Salary record added', salaryId: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.getAllSalaryHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const empId = req.query.emp_id || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = ?';
    const queryParams = [req.tenantId];

    if (req.filterByUser) {
      const [empRows] = await db.query('SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?', [req.tenantId, req.user.email]);
      if (!empRows.length) return res.json({ success: true, data: [], page: 1, totalPages: 0, totalCount: 0 });
      whereClause += ' AND emp_id = ?';
      queryParams.push(empRows[0].emp_id);
    } else if (req.filterByManager) {
      const [mgrRows] = await db.query('SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?', [req.tenantId, req.user.email]);
      if (!mgrRows.length) return res.json({ success: true, data: [], page: 1, totalPages: 0, totalCount: 0 });
      whereClause += ' AND emp_id IN (SELECT emp_id FROM employees WHERE tenant_id = ? AND manager_id = ?)';
      queryParams.push(req.tenantId, mgrRows[0].emp_id);
    } else if (empId) {
      whereClause += ' AND emp_id = ?';
      queryParams.push(empId);
    }

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM salary_history ${whereClause}`, queryParams);
    const [rows] = await db.query(
      `SELECT * FROM salary_history ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({ success: true, data: rows, page, totalPages, totalCount });
  } catch (error) {
    next(error);
  }
};

exports.getSalaryByEmployee = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM salary_history WHERE tenant_id = ? AND emp_id = ? ORDER BY created_at DESC',
      [req.tenantId, req.params.id]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getSalaryById = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM salary_history WHERE tenant_id = ? AND salary_id = ?', [req.tenantId, req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Salary record not found' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateSalaryRecord = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { emp_id, salary_amount, effective_from, effective_to, change_reason } = req.body;

    const [result] = await db.query(
      `UPDATE salary_history
       SET emp_id = ?, salary_amount = ?, effective_from = ?, effective_to = ?, change_reason = ?
       WHERE tenant_id = ? AND salary_id = ?`,
      [emp_id, salary_amount, effective_from, effective_to, change_reason, req.tenantId, id]
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Salary record not found' });
    res.status(200).json({ success: true, message: 'Salary record updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteSalaryRecord = async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM salary_history WHERE tenant_id = ? AND salary_id = ?', [req.tenantId, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Salary record not found' });
    res.status(200).json({ success: true, message: 'Salary record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getTotalSalary = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT SUM(salary_amount) as total, COUNT(*) as count FROM salary_history WHERE tenant_id = ?`,
      [req.tenantId]
    );

    res.json({ total: rows[0].total || 0, count: rows[0].count || 0 });
  } catch (error) {
    next(error);
  }
};

exports.getSalaryCount = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM salary_history WHERE tenant_id = ?', [req.tenantId]);
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};
