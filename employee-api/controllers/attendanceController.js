const db = require('../db');

const getAllAttendance = async (req, res) => {
  try {
    let whereClause = 'WHERE a.tenant_id = ?';
    const params = [req.tenantId];

    if (req.filterByUser) {
      const [empRows] = await db.query(
        'SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?',
        [req.tenantId, req.user.email]
      );

      if (!empRows.length) return res.json({ success: true, data: [], count: 0 });
      whereClause += ' AND a.emp_id = ?';
      params.push(empRows[0].emp_id);
    } else if (req.filterByManager) {
      const [mgrRows] = await db.query(
        'SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?',
        [req.tenantId, req.user.email]
      );

      if (!mgrRows.length) return res.json({ success: true, data: [], count: 0 });
      whereClause += ' AND e.manager_id = ?';
      params.push(mgrRows[0].emp_id);
    }

    const [rows] = await db.query(
      `SELECT
        a.attendance_id,
        a.emp_id,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        e.first_name,
        e.last_name,
        e.employee_code
       FROM attendance a
       JOIN employees e ON a.tenant_id = e.tenant_id AND a.emp_id = e.emp_id
       ${whereClause}
       ORDER BY a.attendance_date DESC, a.attendance_id DESC`,
      params
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: err.message });
  }
};

const createAttendance = async (req, res) => {
  try {
    const { emp_id, attendance_date, check_in, check_out, attendance_status } = req.body;

    if (!emp_id || !attendance_date) {
      return res.status(400).json({ success: false, message: 'emp_id and attendance_date are required' });
    }

    const [existing] = await db.query(
      'SELECT attendance_id FROM attendance WHERE tenant_id = ? AND emp_id = ? AND attendance_date = ?',
      [req.tenantId, emp_id, attendance_date]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this employee on this date' });
    }

    const [result] = await db.query(
      `INSERT INTO attendance (tenant_id, emp_id, attendance_date, check_in, check_out, attendance_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.tenantId, emp_id, attendance_date, check_in, check_out, attendance_status]
    );

    const [newAttendance] = await db.query(
      `SELECT
        a.attendance_id,
        a.emp_id,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        e.first_name,
        e.last_name,
        e.employee_code
       FROM attendance a
       JOIN employees e ON a.tenant_id = e.tenant_id AND a.emp_id = e.emp_id
       WHERE a.tenant_id = ? AND a.attendance_id = ?`,
      [req.tenantId, result.insertId]
    );

    res.status(201).json({ success: true, message: 'Attendance marked successfully', data: newAttendance[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create attendance', error: err.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, attendance_status } = req.body;

    const [exists] = await db.query(
      'SELECT attendance_id FROM attendance WHERE tenant_id = ? AND attendance_id = ?',
      [req.tenantId, id]
    );

    if (!exists.length) return res.status(404).json({ success: false, message: 'Attendance record not found' });

    await db.query(
      `UPDATE attendance SET check_in = ?, check_out = ?, attendance_status = ?
       WHERE tenant_id = ? AND attendance_id = ?`,
      [check_in, check_out, attendance_status, req.tenantId, id]
    );

    res.json({ success: true, message: 'Attendance updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update attendance', error: err.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const [exists] = await db.query(
      'SELECT attendance_id FROM attendance WHERE tenant_id = ? AND attendance_id = ?',
      [req.tenantId, id]
    );

    if (!exists.length) return res.status(404).json({ success: false, message: 'Attendance record not found' });

    await db.query('DELETE FROM attendance WHERE tenant_id = ? AND attendance_id = ?', [req.tenantId, id]);
    res.json({ success: true, message: 'Attendance deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete attendance', error: err.message });
  }
};

const getTodayAttendanceCount = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      `SELECT COUNT(*) as count
       FROM attendance
       WHERE tenant_id = ? AND attendance_date = ? AND attendance_status = 'Present'`,
      [req.tenantId, today]
    );

    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllAttendance, createAttendance, updateAttendance, deleteAttendance, getTodayAttendanceCount };
