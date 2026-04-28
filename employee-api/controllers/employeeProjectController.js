const db = require('../db');

const getAllEmployeeProjects = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        ep.assignment_id,
        ep.emp_id,
        ep.project_id,
        ep.role_name,
        ep.allocation_percent,
        ep.assigned_on,
        ep.released_on,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.status as employee_status,
        p.project_name,
        p.status as project_status
       FROM employee_projects ep
       INNER JOIN employees e ON ep.tenant_id = e.tenant_id AND ep.emp_id = e.emp_id
       INNER JOIN projects p ON ep.tenant_id = p.tenant_id AND ep.project_id = p.project_id
       WHERE ep.tenant_id = ?
       ORDER BY ep.assignment_id DESC`,
      [req.tenantId]
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: err.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { emp_id, project_id, role_name, allocation_percent, assigned_on, released_on } = req.body;

    if (!emp_id || !project_id || !role_name || !assigned_on) {
      return res.status(400).json({ success: false, message: 'emp_id, project_id, role_name and assigned_on are required' });
    }

    const [result] = await db.query(
      `INSERT INTO employee_projects
       (tenant_id, emp_id, project_id, role_name, allocation_percent, assigned_on, released_on)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, emp_id, project_id, role_name, allocation_percent || 100.0, assigned_on, released_on || null]
    );

    const [newAssignment] = await db.query(
      `SELECT
        ep.assignment_id,
        ep.emp_id,
        ep.project_id,
        ep.role_name,
        ep.allocation_percent,
        ep.assigned_on,
        ep.released_on,
        e.first_name,
        e.last_name,
        e.employee_code,
        p.project_name,
        p.status as project_status
       FROM employee_projects ep
       INNER JOIN employees e ON ep.tenant_id = e.tenant_id AND ep.emp_id = e.emp_id
       INNER JOIN projects p ON ep.tenant_id = p.tenant_id AND ep.project_id = p.project_id
       WHERE ep.tenant_id = ? AND ep.assignment_id = ?`,
      [req.tenantId, result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Employee assigned successfully', data: newAssignment[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create assignment', error: err.message });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { emp_id, project_id, role_name, allocation_percent, assigned_on, released_on } = req.body;

    await db.query(
      `UPDATE employee_projects SET
         emp_id = ?, project_id = ?, role_name = ?, allocation_percent = ?, assigned_on = ?, released_on = ?
       WHERE tenant_id = ? AND assignment_id = ?`,
      [emp_id, project_id, role_name, allocation_percent || 100.0, assigned_on, released_on || null, req.tenantId, id]
    );

    return res.status(200).json({ success: true, message: 'Assignment updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update assignment', error: err.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM employee_projects WHERE tenant_id = ? AND assignment_id = ?', [req.tenantId, id]);
    return res.status(200).json({ success: true, message: 'Assignment removed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete assignment', error: err.message });
  }
};

module.exports = { getAllEmployeeProjects, createAssignment, updateAssignment, deleteAssignment };
