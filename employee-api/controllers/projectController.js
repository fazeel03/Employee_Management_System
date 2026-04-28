const db = require('../db');

exports.getAllProjects = async (req, res, next) => {
  try {
    let whereClause = 'WHERE p.tenant_id = ?';
    const params = [req.tenantId];

    if (req.filterByManager) {
      const [mgrRows] = await db.query(
        'SELECT emp_id FROM employees WHERE tenant_id = ? AND email = ?',
        [req.tenantId, req.user.email]
      );

      if (!mgrRows.length) return res.json({ success: true, count: 0, data: [] });

      const managerEmpId = mgrRows[0].emp_id;
      whereClause += ` AND p.project_id IN (
        SELECT DISTINCT project_id FROM projects WHERE tenant_id = ? AND project_manager_id = ?
        UNION
        SELECT DISTINCT ep.project_id
        FROM employee_projects ep
        INNER JOIN employees e ON ep.tenant_id = e.tenant_id AND ep.emp_id = e.emp_id
        WHERE ep.tenant_id = ? AND e.manager_id = ?
      )`;
      params.push(req.tenantId, managerEmpId, req.tenantId, managerEmpId);
    }

    const [projects] = await db.query(`SELECT p.* FROM projects p ${whereClause}`, params);
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const [result] = await db.query('SELECT * FROM projects WHERE tenant_id = ? AND project_id = ?', [req.tenantId, req.params.id]);
    if (!result.length) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { project_name, start_date, end_date, budget, status, project_manager_id } = req.body;
    const [result] = await db.query(
      `INSERT INTO projects (tenant_id, project_name, start_date, end_date, budget, status, project_manager_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, project_name, start_date, end_date, budget, status, project_manager_id]
    );

    res.status(201).json({ success: true, message: 'Project created successfully', projectId: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { project_name, start_date, end_date, budget, status, project_manager_id } = req.body;

    const [result] = await db.query(
      `UPDATE projects SET
        project_name = ?, start_date = ?, end_date = ?, budget = ?, status = ?, project_manager_id = ?
       WHERE tenant_id = ? AND project_id = ?`,
      [project_name, start_date, end_date, budget, status, project_manager_id, req.tenantId, id]
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM projects WHERE tenant_id = ? AND project_id = ?', [req.tenantId, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Project not found' });
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getProjectCount = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM projects WHERE tenant_id = ?', [req.tenantId]);
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

exports.getActiveProjectCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM projects WHERE tenant_id = ? AND status = 'In Progress'`,
      [req.tenantId]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

exports.getCompletedProjectsCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM projects WHERE tenant_id = ? AND status = 'Completed'`,
      [req.tenantId]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};
