# HRM System - Postman API Collection

## Base Configuration

**Base URL**: `http://localhost:3000/api/v1`

**Environment Variables**:
```
base_url = http://localhost:3000/api/v1
token = JWT_TOKEN
```

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

---

## Authentication APIs

### POST /auth/login
**Description**: Login user and return JWT token

**Request Body**:
```json
{
  "email": "admin@company.com",
  "password": "password123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "name": "System Administrator",
      "email": "admin@company.com",
      "role": "admin",
      "status": "active"
    },
    "expiresIn": "7d"
  }
}
```

### POST /auth/forgot-password
**Description**: Request password reset

**Request Body**:
```json
{
  "email": "user@company.com"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email address."
}
```

### POST /auth/reset-password
**Description**: Reset password with token

**Request Body**:
```json
{
  "token": "abc123def456...",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

## Admin APIs

### GET /employees
**Description**: Get all employees (Admin only)
**Roles**: admin

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term

**Success Response (200)**:
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "totalRecords": 50,
  "totalPages": 5,
  "data": [
    {
      "emp_id": 1,
      "employee_code": "EMP-2024-0001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "status": "active"
    }
  ]
}
```

### POST /employees
**Description**: Create new employee (Admin only)
**Roles**: admin

**Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@company.com",
  "phone": "+1234567890",
  "hire_date": "2024-01-15",
  "dept_id": 1,
  "position_id": 1,
  "manager_id": 1
}
```

### PUT /employees/:id
**Description**: Update employee (Admin only)
**Roles**: admin

### DELETE /employees/:id
**Description**: Delete employee (Admin only)
**Roles**: admin

---

## Manager APIs

### GET /manager/team
**Description**: Get manager's team members
**Roles**: admin, manager

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Team members retrieved successfully",
  "data": [
    {
      "emp_id": 5,
      "employee_code": "EMP-2024-0005",
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice.johnson@company.com",
      "department_name": "Engineering",
      "position_title": "Developer",
      "status": "active"
    }
  ],
  "count": 5
}
```

### GET /manager/team-attendance
**Description**: Get team attendance records
**Roles**: admin, manager

**Query Parameters**:
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Team attendance retrieved successfully",
  "data": [
    {
      "emp_id": 5,
      "employee_name": "Alice Johnson",
      "attendance_date": "2024-01-15",
      "check_in": "2024-01-15T09:00:00.000Z",
      "check_out": "2024-01-15T18:00:00.000Z",
      "attendance_status": "present",
      "hours_worked": 9
    }
  ]
}
```

### GET /manager/team-leaves
**Description**: Get team leave requests
**Roles**: admin, manager

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Team leave requests retrieved successfully",
  "data": [
    {
      "leave_id": 1,
      "emp_id": 5,
      "leave_type": "sick",
      "start_date": "2024-01-20",
      "end_date": "2024-01-21",
      "reason": "Medical appointment",
      "approval_status": "pending",
      "employee_name": "Alice Johnson"
    }
  ]
}
```

### PUT /manager/leave-requests/:id/approve
**Description**: Approve or reject leave request
**Roles**: admin, manager

**Request Body**:
```json
{
  "action": "approve",
  "comments": "Approved for medical reasons"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Leave request approved successfully",
  "data": {
    "leave_id": 1,
    "status": "approved",
    "approved_by": 2
  }
}
```

### GET /manager/team-projects
**Description**: Get team projects
**Roles**: admin, manager

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Team projects retrieved successfully",
  "data": [
    {
      "project_id": 1,
      "project_name": "Website Redesign",
      "status": "active",
      "team_members_count": 3
    }
  ]
}
```

### POST /manager/project-assignment
**Description**: Assign employee to project
**Roles**: admin, manager

**Request Body**:
```json
{
  "emp_id": 5,
  "project_id": 1,
  "role_name": "Developer",
  "allocation_percent": 80
}
```

---

## HR APIs

### GET /hr/employees
**Description**: Get all employees (HR view)
**Roles**: admin, hr

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term
- `department` (optional): Filter by department
- `status` (optional): Filter by status

### POST /hr/employees
**Description**: Create new employee (HR)
**Roles**: admin, hr

**Request Body**:
```json
{
  "first_name": "Bob",
  "last_name": "Wilson",
  "email": "bob.wilson@company.com",
  "phone": "+1234567890",
  "hire_date": "2024-01-15",
  "dept_id": 2,
  "position_id": 3,
  "manager_id": 1,
  "user_email": "bob.wilson@company.com",
  "user_role": "user"
}
```

### PUT /hr/employees/:id
**Description**: Update employee (HR)
**Roles**: admin, hr

### GET /hr/attendance-reports
**Description**: Get attendance reports
**Roles**: admin, hr

**Query Parameters**:
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `department` (optional): Filter by department
- `status` (optional): Filter by status

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Attendance reports retrieved successfully",
  "data": [
    {
      "emp_id": 1,
      "employee_name": "John Doe",
      "department_name": "Engineering",
      "attendance_date": "2024-01-15",
      "check_in": "09:00",
      "check_out": "18:00",
      "attendance_status": "present",
      "hours_worked": 9
    }
  ],
  "summary": {
    "total_records": 100,
    "present_count": 85,
    "absent_count": 10,
    "late_count": 5,
    "avg_hours_worked": 8.5
  }
}
```

### GET /hr/leave-requests
**Description**: Get all leave requests (HR view)
**Roles**: admin, hr

**Query Parameters**:
- `status` (optional): Filter by status
- `department` (optional): Filter by department
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `page` (optional): Page number
- `limit` (optional): Items per page

### POST /hr/salary-history
**Description**: Create salary record
**Roles**: admin, hr

**Request Body**:
```json
{
  "emp_id": 1,
  "base_salary": 50000,
  "allowances": 5000,
  "deductions": 2000,
  "payment_date": "2024-01-31",
  "pay_period_start": "2024-01-01",
  "pay_period_end": "2024-01-31"
}
```

### GET /hr/reports
**Description**: Get HR reports
**Roles**: admin, hr

**Query Parameters**:
- `type` (optional): Report type (headcount, attendance_summary, leave_summary)
- `department` (optional): Filter by department
- `start_date` (optional): Start date
- `end_date` (optional): End date

---

## Employee APIs

### GET /me
**Description**: Get current employee profile
**Roles**: All authenticated users

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "emp_id": 5,
    "employee_code": "EMP-2024-0005",
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice.johnson@company.com",
    "department_name": "Engineering",
    "position_title": "Developer",
    "user_role": "user",
    "status": "active"
  }
}
```

### GET /my-projects
**Description**: Get employee's projects
**Roles**: All authenticated users

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": [
    {
      "project_id": 1,
      "project_name": "Website Redesign",
      "description": "Complete website redesign project",
      "start_date": "2024-01-01",
      "end_date": "2024-06-30",
      "status": "active",
      "role_name": "Developer",
      "allocation_percent": 80,
      "assigned_on": "2024-01-01"
    }
  ]
}
```

### GET /my-attendance
**Description**: Get employee's attendance records
**Roles**: All authenticated users

**Query Parameters**:
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `limit` (optional): Number of records (default: 30)

### POST /attendance/check-in
**Description**: Check in for attendance
**Roles**: All authenticated users

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Checked in successfully",
  "data": {
    "attendance_id": 123,
    "check_in": "2024-01-15T09:00:00.000Z",
    "attendance_status": "present"
  }
}
```

### POST /attendance/check-out
**Description**: Check out for attendance
**Roles**: All authenticated users

### POST /leave/apply
**Description**: Apply for leave
**Roles**: All authenticated users

**Request Body**:
```json
{
  "leave_type": "sick",
  "start_date": "2024-01-20",
  "end_date": "2024-01-21",
  "reason": "Medical appointment"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "leave_id": 45,
    "emp_id": 5,
    "leave_type": "sick",
    "start_date": "2024-01-20",
    "end_date": "2024-01-21",
    "reason": "Medical appointment",
    "approval_status": "pending",
    "requested_at": "2024-01-15T10:00:00.000Z"
  }
}
```

### GET /leave/my-requests
**Description**: Get employee's leave requests
**Roles**: All authenticated users

**Query Parameters**:
- `status` (optional): Filter by status
- `limit` (optional): Number of records (default: 20)

### GET /salary-history
**Description**: Get employee's salary history
**Roles**: All authenticated users

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Salary history retrieved successfully",
  "data": [
    {
      "salary_id": 1,
      "base_salary": 50000,
      "allowances": 5000,
      "deductions": 2000,
      "net_salary": 53000,
      "payment_date": "2024-01-31",
      "pay_period_start": "2024-01-01",
      "pay_period_end": "2024-01-31"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required role: admin. Current role: user.",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Testing Instructions

1. **Set up Environment**:
   - Create a new environment in Postman
   - Add variables: `base_url` and `token`

2. **Authentication Flow**:
   - First, call `POST /auth/login` to get the token
   - Save the token to the environment variable
   - Use the token in all subsequent API calls

3. **Role-Based Testing**:
   - Test with different user roles (admin, hr, manager, user)
   - Verify that role restrictions work correctly
   - Test unauthorized access scenarios

4. **Data Validation**:
   - Test with invalid data formats
   - Test missing required fields
   - Test edge cases and boundary conditions

5. **Error Handling**:
   - Test all error scenarios
   - Verify error response formats
   - Test timeout and network error scenarios

---

## Security Notes

- All APIs (except auth endpoints) require JWT token
- Token should be sent in `Authorization: Bearer <token>` header
- Password reset tokens expire in 1 hour
- Role-based access control is enforced on all endpoints
- Input validation is performed on all request data
- SQL injection protection is implemented
- XSS protection is implemented

---

## Performance Considerations

- Pagination is implemented on list endpoints
- Use appropriate page sizes (10-100 items per page)
- Implement caching for frequently accessed data
- Use database indexes for performance optimization
- Monitor API response times and implement optimizations as needed
