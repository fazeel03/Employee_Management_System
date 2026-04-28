const db = require('../config/database');

/**
 * Get Employee Profile
 * GET /api/v1/me
 */
const getProfile = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;
    const userId = req.user.userId;

    const [employee] = await db.query(`
      SELECT 
        e.emp_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.hire_date,
        e.status,
        e.dept_id,
        e.position_id,
        e.manager_id,
        d.name as department_name,
        p.title as position_title,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name,
        m.email as manager_email,
        u.email as user_email,
        u.role as user_role
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN employees m ON e.manager_id = m.emp_id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.emp_id = ?
    `, [employeeEmpId]);

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: employee[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile'
    });
  }
};

/**
 * Get Employee's Projects
 * GET /api/v1/my-projects
 */
const getMyProjects = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;

    const [projects] = await db.query(`
      SELECT 
        p.project_id,
        p.project_name,
        p.description,
        p.start_date,
        p.end_date,
        p.status,
        ep.role_name,
        ep.allocation_percent,
        ep.assigned_on,
        ep.released_on
      FROM projects p
      JOIN employee_projects ep ON p.project_id = ep.project_id
      WHERE ep.emp_id = ? AND (ep.released_on IS NULL OR ep.released_on > NOW())
      ORDER BY p.project_name
    `, [employeeEmpId]);

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching projects'
    });
  }
};

/**
 * Get Employee's Attendance
 * GET /api/v1/my-attendance
 */
const getMyAttendance = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;
    const { start_date, end_date, limit = 30 } = req.query;

    let dateFilter = '';
    let params = [employeeEmpId];

    if (start_date && end_date) {
      dateFilter = 'AND attendance_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      dateFilter = 'AND attendance_date >= ?';
      params.push(start_date);
    } else if (end_date) {
      dateFilter = 'AND attendance_date <= ?';
      params.push(end_date);
    }

    params.push(parseInt(limit));

    const [attendance] = await db.query(`
      SELECT 
        attendance_id,
        attendance_date,
        check_in,
        check_out,
        attendance_status,
        TIMESTAMPDIFF(HOUR, check_in, check_out) as hours_worked,
        created_at,
        updated_at
      FROM attendance
      WHERE emp_id = ? ${dateFilter}
      ORDER BY attendance_date DESC
      LIMIT ?
    `, params);

    res.status(200).json({
      success: true,
      message: 'Attendance retrieved successfully',
      data: attendance,
      count: attendance.length
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching attendance'
    });
  }
};

/**
 * Check In Attendance
 * POST /api/v1/attendance/check-in
 */
const checkIn = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;
    const userId = req.user.userId;

    // Check if already checked in today
    const [existingAttendance] = await db.query(`
      SELECT attendance_id FROM attendance 
      WHERE emp_id = ? AND DATE(attendance_date) = CURDATE()
    `, [employeeEmpId]);

    if (existingAttendance.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Check in
    const [result] = await db.query(`
      INSERT INTO attendance (emp_id, attendance_date, check_in, attendance_status)
      VALUES (?, CURDATE(), NOW(), 'present')
    `, [employeeEmpId]);

    // Log the action
    await db.query(`
      INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      'ATTENDANCE_CHECK_IN',
      'attendance',
      result.insertId,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      JSON.stringify({
        emp_id: employeeEmpId,
        check_in_time: new Date()
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: {
        attendance_id: result.insertId,
        check_in: new Date(),
        attendance_status: 'present'
      }
    });

  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking in'
    });
  }
};

/**
 * Check Out Attendance
 * POST /api/v1/attendance/check-out
 */
const checkOut = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;
    const userId = req.user.userId;

    // Find today's attendance record
    const [attendance] = await db.query(`
      SELECT attendance_id, check_in FROM attendance 
      WHERE emp_id = ? AND DATE(attendance_date) = CURDATE()
    `, [employeeEmpId]);

    if (attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance[0].check_out) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Check out
    await db.query(`
      UPDATE attendance 
      SET check_out = NOW(), updated_at = NOW()
      WHERE attendance_id = ?
    `, [attendance[0].attendance_id]);

    // Log the action
    await db.query(`
      INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      'ATTENDANCE_CHECK_OUT',
      'attendance',
      attendance[0].attendance_id,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      JSON.stringify({
        emp_id: employeeEmpId,
        check_out_time: new Date()
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: {
        attendance_id: attendance[0].attendance_id,
        check_out: new Date()
      }
    });

  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking out'
    });
  }
};

/**
 * Apply for Leave
 * POST /api/v1/leave/apply
 */
const applyLeave = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;
    const userId = req.user.userId;
    const { leave_type, start_date, end_date, reason } = req.body;

    // Validate required fields
    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: leave_type, start_date, end_date, reason'
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check for overlapping leave requests
    const [existingLeaves] = await db.query(`
      SELECT leave_id FROM leave_requests 
      WHERE emp_id = ? AND approval_status = 'pending'
      AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
    `, [employeeEmpId, start_date, start_date, end_date, end_date]);

    if (existingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending leave request for this period'
      });
    }

    // Create leave request
    const [result] = await db.query(`
      INSERT INTO leave_requests (emp_id, leave_type, start_date, end_date, reason, approval_status, requested_at)
      VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `, [employeeEmpId, leave_type, start_date, end_date, reason]);

    // Log the action
    await db.query(`
      INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      'LEAVE_REQUEST_APPLY',
      'leave_request',
      result.insertId,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      JSON.stringify({
        emp_id: employeeEmpId,
        leave_type,
        start_date,
        end_date,
        reason
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        leave_id: result.insertId,
        emp_id: employeeEmpId,
        leave_type,
        start_date,
        end_date,
        reason,
        approval_status: 'pending',
        requested_at: new Date()
      }
    });

  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while applying for leave'
    });
  }
};

/**
 * Get My Leave Requests
 * GET /api/v1/leave/my-requests
 */
const getMyLeaveRequests = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;
    const { status, limit = 20 } = req.query;

    let statusFilter = '';
    let params = [employeeEmpId];

    if (status) {
      statusFilter = 'AND approval_status = ?';
      params.push(status);
    }

    params.push(parseInt(limit));

    const [leaveRequests] = await db.query(`
      SELECT 
        leave_id,
        leave_type,
        start_date,
        end_date,
        reason,
        approval_status,
        approved_by,
        requested_at,
        updated_at
      FROM leave_requests
      WHERE emp_id = ? ${statusFilter}
      ORDER BY requested_at DESC
      LIMIT ?
    `, params);

    res.status(200).json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: leaveRequests,
      count: leaveRequests.length
    });

  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching leave requests'
    });
  }
};

/**
 * Get Salary History
 * GET /api/v1/salary-history
 */
const getSalaryHistory = async (req, res) => {
  try {
    const employeeEmpId = req.employeeEmpId;

    const [salaryHistory] = await db.query(`
      SELECT 
        salary_id,
        base_salary,
        allowances,
        deductions,
        net_salary,
        payment_date,
        pay_period_start,
        pay_period_end,
        created_at
      FROM salary_history
      WHERE emp_id = ?
      ORDER BY payment_date DESC
    `, [employeeEmpId]);

    res.status(200).json({
      success: true,
      message: 'Salary history retrieved successfully',
      data: salaryHistory,
      count: salaryHistory.length
    });

  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching salary history'
    });
  }
};

module.exports = {
  getProfile,
  getMyProjects,
  getMyAttendance,
  checkIn,
  checkOut,
  applyLeave,
  getMyLeaveRequests,
  getSalaryHistory
};
