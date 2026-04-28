const db = require('../db');

const getTeamMembers = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;

    const [teamMembers] = await db.query(
      `SELECT
        e.emp_id,
        e.first_name,
        e.last_name,
        e.email,
        d.dept_name as department_name,
        p.position_title as position_title
      FROM employees e
      LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
      LEFT JOIN positions p ON e.tenant_id = p.tenant_id AND e.position_id = p.position_id
      WHERE e.tenant_id = ? AND e.manager_id = ? AND e.status = 'Active'
      ORDER BY e.first_name, e.last_name`,
      [req.tenantId, managerEmpId]
    );

    res.status(200).json({ success: true, data: teamMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch team members' });
  }
};

const getTeamAttendance = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [req.tenantId, managerEmpId];

    if (start_date && end_date) {
      dateFilter = 'AND a.attendance_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      dateFilter = 'AND a.attendance_date >= ?';
      params.push(start_date);
    } else if (end_date) {
      dateFilter = 'AND a.attendance_date <= ?';
      params.push(end_date);
    }

    const [teamAttendance] = await db.query(
      `SELECT
        e.emp_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        TIMESTAMPDIFF(HOUR, a.check_in, a.check_out) as hours_worked
      FROM employees e
      LEFT JOIN attendance a ON e.tenant_id = a.tenant_id AND e.emp_id = a.emp_id
      WHERE e.tenant_id = ? AND e.manager_id = ? ${dateFilter}
      ORDER BY a.attendance_date DESC, e.first_name, e.last_name`,
      params
    );

    res.status(200).json({ success: true, message: 'Team attendance retrieved successfully', data: teamAttendance, count: teamAttendance.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error while fetching team attendance' });
  }
};

const getTeamLeaveRequests = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;
    const { status } = req.query;

    let statusFilter = '';
    const params = [req.tenantId, managerEmpId];

    if (status) {
      statusFilter = 'AND lr.approval_status = ?';
      params.push(status);
    }

    const [teamLeaveRequests] = await db.query(
      `SELECT
        lr.leave_id,
        lr.emp_id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.reason,
        lr.approval_status,
        lr.approved_by,
        lr.requested_at,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.email as employee_email,
        approver.first_name as approved_by_name
      FROM leave_requests lr
      JOIN employees e ON lr.tenant_id = e.tenant_id AND lr.emp_id = e.emp_id
      LEFT JOIN employees approver ON lr.tenant_id = approver.tenant_id AND lr.approved_by = approver.emp_id
      WHERE lr.tenant_id = ? AND e.manager_id = ? ${statusFilter}
      ORDER BY lr.requested_at DESC`,
      params
    );

    res.status(200).json({ success: true, message: 'Team leave requests retrieved successfully', data: teamLeaveRequests, count: teamLeaveRequests.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error while fetching team leave requests' });
  }
};

const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;
    const managerEmpId = req.managerEmpId;
    const userId = req.user.userId;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be either "approve" or "reject"' });
    }

    const [leaveRequests] = await db.query(
      `SELECT lr.*, e.manager_id
       FROM leave_requests lr
       JOIN employees e ON lr.tenant_id = e.tenant_id AND lr.emp_id = e.emp_id
       WHERE lr.tenant_id = ? AND lr.leave_id = ? AND e.manager_id = ?`,
      [req.tenantId, id, managerEmpId]
    );

    if (!leaveRequests.length) {
      return res.status(404).json({ success: false, message: 'Leave request not found or not accessible' });
    }

    const leaveRequest = leaveRequests[0];

    if (leaveRequest.approval_status !== 'pending' && leaveRequest.approval_status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Leave request already ${leaveRequest.approval_status}` });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await db.query(
      `UPDATE leave_requests
       SET approval_status = ?, approved_by = ?, comments = ?, updated_at = NOW()
       WHERE tenant_id = ? AND leave_id = ?`,
      [newStatus, managerEmpId, comments || null, req.tenantId, id]
    );

    await db.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource, resource_id, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        userId,
        `LEAVE_REQUEST_${action.toUpperCase()}`,
        'leave_request',
        id,
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        JSON.stringify({ leave_id: id, action, employee_id: leaveRequest.emp_id, manager_id: managerEmpId, comments })
      ]
    );

    res.status(200).json({
      success: true,
      message: `Leave request ${action}d successfully`,
      data: { leave_id: parseInt(id, 10), status: newStatus, approved_by: managerEmpId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error while processing leave request' });
  }
};

const getTeamProjects = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;

    const [teamProjects] = await db.query(
      `SELECT
        p.project_id,
        p.project_name,
        p.status,
        COUNT(ep.emp_id) AS team_size
      FROM employees e
      JOIN employee_projects ep ON e.tenant_id = ep.tenant_id AND e.emp_id = ep.emp_id
      JOIN projects p ON ep.tenant_id = p.tenant_id AND ep.project_id = p.project_id
      WHERE e.tenant_id = ? AND e.manager_id = ?
      GROUP BY p.project_id, p.project_name, p.status
      ORDER BY p.project_name`,
      [req.tenantId, managerEmpId]
    );

    res.status(200).json({ success: true, data: teamProjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch team projects' });
  }
};

const assignToProject = async (req, res) => {
  try {
    const { emp_id, project_id, role_name, allocation_percent } = req.body;
    const managerEmpId = req.managerEmpId;
    const userId = req.user.userId;

    if (!emp_id || !project_id || !role_name || !allocation_percent) {
      return res.status(400).json({ success: false, message: 'All fields are required: emp_id, project_id, role_name, allocation_percent' });
    }

    if (allocation_percent < 1 || allocation_percent > 100) {
      return res.status(400).json({ success: false, message: 'Allocation percentage must be between 1 and 100' });
    }

    const [employees] = await db.query(
      'SELECT emp_id FROM employees WHERE tenant_id = ? AND emp_id = ? AND manager_id = ?',
      [req.tenantId, emp_id, managerEmpId]
    );

    if (!employees.length) {
      return res.status(404).json({ success: false, message: 'Employee not found or not in your team' });
    }

    const [projects] = await db.query(
      'SELECT project_id FROM projects WHERE tenant_id = ? AND project_id = ?',
      [req.tenantId, project_id]
    );

    if (!projects.length) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [existingAssignments] = await db.query(
      'SELECT assignment_id FROM employee_projects WHERE tenant_id = ? AND emp_id = ? AND project_id = ? AND released_on IS NULL',
      [req.tenantId, emp_id, project_id]
    );

    if (existingAssignments.length > 0) {
      return res.status(400).json({ success: false, message: 'Employee is already assigned to this project' });
    }

    const [result] = await db.query(
      `INSERT INTO employee_projects (tenant_id, emp_id, project_id, role_name, allocation_percent, assigned_on)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.tenantId, emp_id, project_id, role_name, allocation_percent]
    );

    await db.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource, resource_id, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        userId,
        'PROJECT_ASSIGNMENT',
        'employee_project',
        result.insertId,
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        JSON.stringify({ emp_id, project_id, role_name, allocation_percent, manager_id: managerEmpId })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Employee assigned to project successfully',
      data: { assignment_id: result.insertId, emp_id, project_id, role_name, allocation_percent, assigned_on: new Date() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error while assigning to project' });
  }
};

module.exports = { getTeamMembers, getTeamAttendance, getTeamLeaveRequests, approveLeaveRequest, getTeamProjects, assignToProject };
