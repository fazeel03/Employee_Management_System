-- Migration Script: Sync existing users to employees table
-- This creates employee records for users who don't have one yet

-- Step 1: Check current state
SELECT 
    'Users without employee records' as description,
    COUNT(*) as count
FROM users u
LEFT JOIN employees e ON u.email = e.email
WHERE e.emp_id IS NULL AND u.role = 'employee';

-- Step 2: Create employee records for users without them
INSERT INTO employees (employee_code, first_name, last_name, email, hire_date, status)
SELECT 
    CONCAT('EMP-', YEAR(NOW()), '-', LPAD(ROW_NUMBER() OVER (ORDER BY u.id) + (SELECT COALESCE(MAX(emp_id), 0) FROM employees), 3, '0')) as employee_code,
    SUBSTRING_INDEX(u.name, ' ', 1) as first_name,
    TRIM(SUBSTRING(u.name, LOCATE(' ', u.name))) as last_name,
    u.email,
    COALESCE(u.created_at, NOW()) as hire_date,
    CASE 
        WHEN u.status = 'active' THEN 'Active'
        WHEN u.status = 'inactive' THEN 'Inactive'
        ELSE 'Active'
    END as status
FROM users u
LEFT JOIN employees e ON u.email = e.email
WHERE e.emp_id IS NULL 
  AND u.role = 'employee';

-- Step 3: Verify sync
SELECT 
    'Sync verification' as description,
    COUNT(*) as users_count,
    (SELECT COUNT(*) FROM employees WHERE email IN (SELECT email FROM users WHERE role = 'employee')) as employees_count
FROM users 
WHERE role = 'employee';

-- Step 4: Show any remaining mismatches
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    u.status as user_status,
    e.emp_id,
    e.status as employee_status
FROM users u
LEFT JOIN employees e ON u.email = e.email
WHERE u.role = 'employee'
ORDER BY u.id;
