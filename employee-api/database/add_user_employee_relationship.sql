-- Add proper relationship between users and employees tables
-- This ensures data consistency going forward

-- Option 1: Add user_id foreign key to employees table (RECOMMENDED)
-- This creates a hard link between tables

ALTER TABLE employees 
ADD COLUMN user_id INT NULL AFTER emp_id,
ADD CONSTRAINT fk_employees_users 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX idx_employees_user_id ON employees(user_id);

-- Update existing records to link user_id
UPDATE employees e
INNER JOIN users u ON e.email = u.email
SET e.user_id = u.id
WHERE e.user_id IS NULL;

-- Verify the relationship
SELECT 
    'Employees with user_id' as description,
    COUNT(*) as count
FROM employees 
WHERE user_id IS NOT NULL;

-- Show the linked data
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    e.emp_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.status as employee_status
FROM users u
LEFT JOIN employees e ON u.id = e.user_id
WHERE u.role = 'employee'
ORDER BY u.id
LIMIT 20;
