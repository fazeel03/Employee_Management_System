const db = require('../config/database');

/**
 * Get All Employees (HR View)
 * GET /api/v1/hr/employees
 */
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (department) {
      whereClause += ` AND d.name = ?`;
      params.push(department);
    }

    if (status) {
      whereClause += ` AND e.status = ?`;
      params.push(status);
    }

    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      ${whereClause}
    `, params);

    // Get employees with details
    const [employees] = await db.query(`
      SELECT 
        e.emp_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.hire_date,
        e.status,
        d.name as department_name,
        p.title as position_title,
        CONCAT(m.first_name, ' ', m.last_name) as manager_name,
        u.role as user_role,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN employees m ON e.manager_id = m.emp_id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.first_name, e.last_name
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalPages = Math.ceil(countResult[0].total / limit);

    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employees'
    });
  }
};

/**
 * Create Employee (HR)
 * POST /api/v1/hr/employees
 */
const createEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      dept_id,
      position_id,
      manager_id,
      user_email,
      user_role = 'user'
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !hire_date) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: first_name, last_name, email, hire_date'
      });
    }

    // Generate employee code
    const [lastEmployee] = await db.query(
      'SELECT emp_id FROM employees ORDER BY emp_id DESC LIMIT 1'
    );
    const nextId = lastEmployee.length > 0 ? lastEmployee[0].emp_id + 1 : 1;
    const year = new Date().getFullYear();
    const employee_code = `EMP-${year}-${String(nextId).padStart(4, '0')}`;

    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Create employee record
      const [employeeResult] = await connection.query(`
        INSERT INTO employees (employee_code, first_name, last_name, email, phone, hire_date, dept_id, position_id, manager_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `, [employee_code, first_name, last_name, email, phone, hire_date, dept_id, position_id, manager_id]);

      // Create user account if user_email provided
      if (user_email) {
        const bcrypt = require('bcryptjs');
        const tempPassword = 'Temp@123'; // Temporary password
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        await connection.query(`
          INSERT INTO users (name, email, password, role, status)
          VALUES (?, ?, ?, ?, 'active')
        `, [`${first_name} ${last_name}`, user_email, hashedPassword, user_role]);

        // Update employee with user_id
        const [userResult] = await connection.query('SELECT LAST_INSERT_ID() as user_id');
        await connection.query(
          'UPDATE employees SET user_id = ? WHERE emp_id = ?',
          [userResult[0].user_id, employeeResult.insertId]
        );
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: {
          emp_id: employeeResult.insertId,
          employee_code,
          first_name,
          last_name,
          email
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating employee'
    });
  }
};

/**
 * Update Employee (HR)
 * PUT /api/v1/hr/employees/:id
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      dept_id,
      position_id,
      manager_id,
      status
    } = req.body;

    // Check if employee exists
    const [existingEmployee] = await db.query(
      'SELECT emp_id FROM employees WHERE emp_id = ?',
      [id]
    );

    if (existingEmployee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update employee
    const [result] = await db.query(`
      UPDATE employees 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, 
          hire_date = ?, dept_id = ?, position_id = ?, manager_id = ?, status = ?, updated_at = NOW()
      WHERE emp_id = ?
    `, [first_name, last_name, email, phone, hire_date, dept_id, position_id, manager_id, status, id]);

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes made to employee record'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        emp_id: parseInt(id)
      }
    });

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating employee'
    });
  }
};

/**
 * Get Attendance Reports
 * GET /api/v1/hr/attendance-reports
 */
const getAttendanceReports = async (req, res) => {
  try {
    const { start_date, end_date, department, status } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (start_date && end_date) {
      whereClause += ` AND a.attendance_date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    } else if (start_date) {
      whereClause += ` AND a.attendance_date >= ?`;
      params.push(start_date);
    } else if (end_date) {
      whereClause += ` AND a.attendance_date <= ?`;
      params.push(end_date);
    }

    if (department) {
      whereClause += ` AND d.name = ?`;
      params.push(department);
    }

    if (status) {
      whereClause += ` AND a.attendance_status = ?`;
      params.push(status);
    }

    const [attendance] = await db.query(`
      SELECT 
        e.emp_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        d.name as department_name,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        TIMESTAMPDIFF(HOUR, a.check_in, a.check_out) as hours_worked
      FROM attendance a
      JOIN employees e ON a.emp_id = e.emp_id
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      ${whereClause}
      ORDER BY a.attendance_date DESC, e.first_name, e.last_name
    `, params);

    // Generate summary statistics
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN attendance_status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN attendance_status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN attendance_status = 'late' THEN 1 ELSE 0 END) as late_count,
        AVG(TIMESTAMPDIFF(HOUR, check_in, check_out)) as avg_hours_worked
      FROM attendance a
      JOIN employees e ON a.emp_id = e.emp_id
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      ${whereClause}
    `, params);

    res.status(200).json({
      success: true,
      message: 'Attendance reports retrieved successfully',
      data: attendance,
      summary: summary[0],
      count: attendance.length
    });

  } catch (error) {
    console.error('Get attendance reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching attendance reports'
    });
  }
};

/**
 * Get Leave Requests (HR View)
 * GET /api/v1/hr/leave-requests
 */
const getLeaveRequests = async (req, res) => {
  try {
    const { status, department, start_date, end_date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ` AND lr.approval_status = ?`;
      params.push(status);
    }

    if (department) {
      whereClause += ` AND d.name = ?`;
      params.push(department);
    }

    if (start_date && end_date) {
      whereClause += ` AND ((lr.start_date >= ? AND lr.start_date <= ?) OR (lr.end_date >= ? AND lr.end_date <= ?))`;
      params.push(start_date, end_date, start_date, end_date);
    }

    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM leave_requests lr
      JOIN employees e ON lr.emp_id = e.emp_id
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      ${whereClause}
    `, params);

    // Get leave requests
    const [leaveRequests] = await db.query(`
      SELECT 
        lr.leave_id,
        lr.emp_id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.reason,
        lr.approval_status,
        lr.approved_by,
        lr.requested_at,
        lr.updated_at,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.email as employee_email,
        d.name as department_name,
        CONCAT(m.first_name, ' ', m.last_name) as approved_by_name
      FROM leave_requests lr
      JOIN employees e ON lr.emp_id = e.emp_id
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      LEFT JOIN employees m ON lr.approved_by = m.emp_id
      ${whereClause}
      ORDER BY lr.requested_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalPages = Math.ceil(countResult[0].total / limit);

    res.status(200).json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: leaveRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching leave requests'
    });
  }
};

/**
 * Manage Salary History
 * POST /api/v1/hr/salary-history
 */
const createSalaryRecord = async (req, res) => {
  try {
    const {
      emp_id,
      base_salary,
      allowances = 0,
      deductions = 0,
      payment_date,
      pay_period_start,
      pay_period_end
    } = req.body;

    // Validate required fields
    if (!emp_id || !base_salary || !payment_date) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: emp_id, base_salary, payment_date'
      });
    }

    // Check if employee exists
    const [employee] = await db.query(
      'SELECT emp_id FROM employees WHERE lr.emp_id = ?',
      [emp_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Calculate net salary
    const net_salary = base_salary + allowances - deductions;

    // Create salary record
    const [result] = await db.query(`
      INSERT INTO salary_history (emp_id, base_salary, allowances, deductions, net_salary, payment_date, pay_period_start, pay_period_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [emp_id, base_salary, allowances, deductions, net_salary, payment_date, pay_period_start, pay_period_end]);

    res.status(201).json({
      success: true,
      message: 'Salary record created successfully',
      data: {
        salary_id: result.insertId,
        emp_id,
        base_salary,
        allowances,
        deductions,
        net_salary,
        payment_date
      }
    });

  } catch (error) {
    console.error('Create salary record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating salary record'
    });
  }
};

/**
 * Get HR Reports
 * GET /api/v1/hr/reports
 */
const getHRReports = async (req, res) => {
  try {
    const { type, department, start_date, end_date } = req.query;

    let reports = {};

    switch (type) {
      case 'headcount':
        const [headcount] = await db.query(`
          SELECT 
            d.name as department,
            COUNT(e.emp_id) as employee_count,
            SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_count,
            SUM(CASE WHEN e.status = 'inactive' THEN 1 ELSE 0 END) as inactive_count
          FROM departments d
          LEFT JOIN employees e ON d.dept_id = e.dept_id
          ${department ? 'WHERE d.name = ?' : ''}
          GROUP BY d.dept_id, d.name
          ORDER BY d.name
        `, department ? [department] : []);
        reports.headcount = headcount;
        break;

      case 'attendance_summary':
        let attendanceWhere = 'WHERE 1=1';
        let attendanceParams = [];
        
        if (start_date && end_date) {
          attendanceWhere += ' AND attendance_date BETWEEN ? AND ?';
          attendanceParams.push(start_date, end_date);
        }

        const [attendanceSummary] = await db.query(`
          SELECT 
            DATE_FORMAT(attendance_date, '%Y-%m') as month,
            COUNT(*) as total_days,
            SUM(CASE WHEN attendance_status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN attendance_status = 'absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN attendance_status = 'late' THEN 1 ELSE 0 END) as late_days
          FROM attendance
          ${attendanceWhere}
          GROUP BY DATE_FORMAT(attendance_date, '%Y-%m')
          ORDER BY month DESC
          LIMIT 12
        `, attendanceParams);
        reports.attendance_summary = attendanceSummary;
        break;

      case 'leave_summary':
        let leaveWhere = 'WHERE 1=1';
        let leaveParams = [];
        
        if (start_date && end_date) {
          leaveWhere += ' AND ((start_date >= ? AND start_date <= ?) OR (end_date >= ? AND end_date <= ?))';
          leaveParams.push(start_date, end_date, start_date, end_date);
        }

        const [leaveSummary] = await db.query(`
          SELECT 
            leave_type,
            approval_status,
            COUNT(*) as count,
            SUM(DATEDIFF(end_date, start_date) + 1) as total_days
          FROM leave_requests
          ${leaveWhere}
          GROUP BY leave_type, approval_status
          ORDER BY leave_type, approval_status
        `, leaveParams);
        reports.leave_summary = leaveSummary;
        break;

      default:
        // Get all reports
        const [allHeadcount] = await db.query(`
          SELECT 
            d.name as department,
            COUNT(e.emp_id) as employee_count,
            SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_count
          FROM departments d
          LEFT JOIN employees e ON d.dept_id = e.dept_id
          GROUP BY d.dept_id, d.name
          ORDER BY d.name
        `);

        const [allAttendance] = await db.query(`
          SELECT 
            DATE_FORMAT(attendance_date, '%Y-%m') as month,
            COUNT(*) as total_days,
            SUM(CASE WHEN attendance_status = 'present' THEN 1 ELSE 0 END) as present_days
          FROM attendance
          WHERE attendance_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY DATE_FORMAT(attendance_date, '%Y-%m')
          ORDER BY month DESC
        `);

        reports = {
          headcount: allHeadcount,
          attendance_summary: allAttendance
        };
    }

    res.status(200).json({
      success: true,
      message: 'HR reports retrieved successfully',
      data: reports
    });

  } catch (error) {
    console.error('Get HR reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating HR reports'
    });
  }
};

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  getAttendanceReports,
  getLeaveRequests,
  createSalaryRecord,
  getHRReports
};
