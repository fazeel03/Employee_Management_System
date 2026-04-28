const db = require('../db');

exports.getDepartments = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 1000) limit = 1000;

    let whereClause = 'WHERE tenant_id = ?';
    const params = [req.tenantId];

    if (search.trim()) {
      whereClause += ' AND (dept_name LIKE ? OR location LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    const [departments] = await db.query(
      `SELECT dept_id, dept_name, location, budget
       FROM departments
       ${whereClause}
       ORDER BY dept_id`,
      params
    );

    const totalCount = departments.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = departments.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      data: paginatedResults,
      page,
      totalPages,
      totalCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error occurred', details: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM departments WHERE tenant_id = ? AND dept_id = ?', [req.tenantId, id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { dept_name, location, budget } = req.body;

    if (!dept_name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO departments (tenant_id, dept_name, location, budget) VALUES (?, ?, ?, ?)',
      [req.tenantId, dept_name, location, budget]
    );

    res.status(201).json({ success: true, message: 'Department created successfully', dept_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { dept_name, location, budget } = req.body;

    const [result] = await db.query(
      `UPDATE departments
       SET dept_name = ?, location = ?, budget = ?
       WHERE tenant_id = ? AND dept_id = ?`,
      [dept_name, location, budget, req.tenantId, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, message: 'Department updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM departments WHERE tenant_id = ? AND dept_id = ?', [req.tenantId, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDepartmentCount = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM departments WHERE tenant_id = ?', [req.tenantId]);
    res.json({ count: rows[0].count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
