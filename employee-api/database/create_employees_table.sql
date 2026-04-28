-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    emp_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NULL,
    hire_date DATE NOT NULL,
    status ENUM('Active', 'Inactive', 'Terminated') DEFAULT 'Active',
    role ENUM('EMPLOYEE', 'MANAGER', 'ADMIN') DEFAULT 'EMPLOYEE',
    dept_id INT NULL,
    position_id INT NULL,
    manager_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_employee_code (employee_code),
    INDEX idx_dept_id (dept_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_status (status),
    INDEX idx_role (role)
);
