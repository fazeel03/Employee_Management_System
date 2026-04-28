const db = require('../db');

const getAllPositions = async (req, res) => {
  try {
    const search = req.query.search || '';

    let query = `
      SELECT
        p.position_id,
        p.position_title,
        p.min_salary,
        p.max_salary,
        p.dept_id,
        d.dept_name,
        p.created_at
      FROM positions p
      LEFT JOIN departments d ON p.tenant_id = d.tenant_id AND p.dept_id = d.dept_id
      WHERE p.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (search) {
      query += ' AND p.position_title LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY p.position_title ASC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch positions', error: err.message });
  }
};

const getPositionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT p.*, d.dept_name
       FROM positions p
       LEFT JOIN departments d ON p.tenant_id = d.tenant_id AND p.dept_id = d.dept_id
       WHERE p.tenant_id = ? AND p.position_id = ?`,
      [req.tenantId, id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Position not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch position', error: err.message });
  }
};

const createPosition = async (req, res) => {
  try {
    const { position_title, min_salary, max_salary, dept_id } = req.body;

    if (!position_title?.trim()) {
      return res.status(400).json({ success: false, message: 'Position title is required' });
    }

    const [existing] = await db.query(
      `SELECT position_id FROM positions
       WHERE tenant_id = ? AND LOWER(position_title) = LOWER(?)`,
      [req.tenantId, position_title.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Position title already exists' });
    }

    const [result] = await db.query(
      `INSERT INTO positions (tenant_id, position_title, min_salary, max_salary, dept_id)
       VALUES (?, ?, ?, ?, ?)`,
      [req.tenantId, position_title.trim(), min_salary || 0.0, max_salary || 0.0, dept_id || null]
    );

    const [newPosition] = await db.query(
      `SELECT p.*, d.dept_name
       FROM positions p
       LEFT JOIN departments d ON p.tenant_id = d.tenant_id AND p.dept_id = d.dept_id
       WHERE p.tenant_id = ? AND p.position_id = ?`,
      [req.tenantId, result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Position created successfully', data: newPosition[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create position', error: err.message });
  }
};

const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { position_title, min_salary, max_salary, dept_id } = req.body;

    if (!position_title?.trim()) {
      return res.status(400).json({ success: false, message: 'Position title is required' });
    }

    const [existing] = await db.query(
      `SELECT position_id FROM positions
       WHERE tenant_id = ? AND LOWER(position_title) = LOWER(?) AND position_id != ?`,
      [req.tenantId, position_title.trim(), id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Position title already exists' });
    }

    await db.query(
      `UPDATE positions
       SET position_title = ?, min_salary = ?, max_salary = ?, dept_id = ?
       WHERE tenant_id = ? AND position_id = ?`,
      [position_title.trim(), min_salary || 0.0, max_salary || 0.0, dept_id || null, req.tenantId, id]
    );

    return res.status(200).json({ success: true, message: 'Position updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update position', error: err.message });
  }
};

const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const [inUse] = await db.query(
      `SELECT emp_id FROM employees WHERE tenant_id = ? AND position_id = ? LIMIT 1`,
      [req.tenantId, id]
    );

    if (inUse.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete position that is assigned to employees' });
    }

    await db.query('DELETE FROM positions WHERE tenant_id = ? AND position_id = ?', [req.tenantId, id]);

    return res.status(200).json({ success: true, message: 'Position deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete position', error: err.message });
  }
};

module.exports = { getAllPositions, getPositionById, createPosition, updatePosition, deletePosition };
