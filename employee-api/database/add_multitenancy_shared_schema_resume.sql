-- =========================================================
-- Idempotent Resume Migration: Shared-Schema Multi-Tenancy
-- Safe to run multiple times after partial migration failures
-- =========================================================

SET @db := DATABASE();

-- ---------- 0) Tenants table ----------
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_key VARCHAR(64) NOT NULL,
  tenant_name VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id),
  UNIQUE KEY uq_tenant_key (tenant_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO tenants (tenant_key, tenant_name)
VALUES ('default', 'Default Organization')
ON DUPLICATE KEY UPDATE tenant_name = VALUES(tenant_name);

-- ---------- 1) Add tenant_id columns if missing ----------
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE users ADD COLUMN tenant_id BIGINT NULL AFTER id',
  'SELECT ''users.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE employees ADD COLUMN tenant_id BIGINT NULL AFTER emp_id',
  'SELECT ''employees.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='employees' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE departments ADD COLUMN tenant_id BIGINT NULL AFTER dept_id',
  'SELECT ''departments.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='departments' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE positions ADD COLUMN tenant_id BIGINT NULL AFTER position_id',
  'SELECT ''positions.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='positions' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE projects ADD COLUMN tenant_id BIGINT NULL AFTER project_id',
  'SELECT ''projects.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='projects' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE employee_projects ADD COLUMN tenant_id BIGINT NULL AFTER assignment_id',
  'SELECT ''employee_projects.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='employee_projects' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE attendance ADD COLUMN tenant_id BIGINT NULL AFTER attendance_id',
  'SELECT ''attendance.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='attendance' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE leave_requests ADD COLUMN tenant_id BIGINT NULL AFTER leave_id',
  'SELECT ''leave_requests.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='leave_requests' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE salary_history ADD COLUMN tenant_id BIGINT NULL AFTER salary_id',
  'SELECT ''salary_history.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='salary_history' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE audit_log ADD COLUMN tenant_id BIGINT NULL AFTER id',
  'SELECT ''audit_log.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_log' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE refresh_tokens ADD COLUMN tenant_id BIGINT NULL AFTER id',
  'SELECT ''refresh_tokens.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='refresh_tokens' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE password_reset_tokens ADD COLUMN tenant_id BIGINT NULL AFTER id',
  'SELECT ''password_reset_tokens.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='password_reset_tokens' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE failed_login_attempts ADD COLUMN tenant_id BIGINT NULL AFTER id',
  'SELECT ''failed_login_attempts.tenant_id exists''')
  FROM information_schema.columns WHERE table_schema=@db AND table_name='failed_login_attempts' AND column_name='tenant_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- 2) Backfill tenant_id ----------
UPDATE users SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE employees SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE departments SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE positions SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE projects SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE employee_projects SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE attendance SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE leave_requests SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE salary_history SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE audit_log SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE refresh_tokens SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE password_reset_tokens SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;
UPDATE failed_login_attempts SET tenant_id = (SELECT tenant_id FROM tenants WHERE tenant_key = 'default') WHERE tenant_id IS NULL;

-- ---------- 3) Tenant indexes (safe add if missing) ----------
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE users ADD KEY idx_users_tenant (tenant_id)','SELECT ''idx_users_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='users' AND index_name='idx_users_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE employees ADD KEY idx_employees_tenant (tenant_id)','SELECT ''idx_employees_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employees' AND index_name='idx_employees_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE departments ADD KEY idx_departments_tenant (tenant_id)','SELECT ''idx_departments_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='departments' AND index_name='idx_departments_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE positions ADD KEY idx_positions_tenant (tenant_id)','SELECT ''idx_positions_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='positions' AND index_name='idx_positions_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE projects ADD KEY idx_projects_tenant (tenant_id)','SELECT ''idx_projects_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='projects' AND index_name='idx_projects_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE employee_projects ADD KEY idx_employee_projects_tenant (tenant_id)','SELECT ''idx_employee_projects_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employee_projects' AND index_name='idx_employee_projects_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE attendance ADD KEY idx_attendance_tenant (tenant_id)','SELECT ''idx_attendance_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='attendance' AND index_name='idx_attendance_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE leave_requests ADD KEY idx_leave_requests_tenant (tenant_id)','SELECT ''idx_leave_requests_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='leave_requests' AND index_name='idx_leave_requests_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE salary_history ADD KEY idx_salary_history_tenant (tenant_id)','SELECT ''idx_salary_history_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='salary_history' AND index_name='idx_salary_history_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE audit_log ADD KEY idx_audit_log_tenant (tenant_id)','SELECT ''idx_audit_log_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='audit_log' AND index_name='idx_audit_log_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE refresh_tokens ADD KEY idx_refresh_tokens_tenant (tenant_id)','SELECT ''idx_refresh_tokens_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='refresh_tokens' AND index_name='idx_refresh_tokens_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE password_reset_tokens ADD KEY idx_password_reset_tokens_tenant (tenant_id)','SELECT ''idx_password_reset_tokens_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='password_reset_tokens' AND index_name='idx_password_reset_tokens_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE failed_login_attempts ADD KEY idx_failed_login_attempts_tenant (tenant_id)','SELECT ''idx_failed_login_attempts_tenant exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='failed_login_attempts' AND index_name='idx_failed_login_attempts_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- FK-safe fallback indexes for leftmost FK columns
SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE attendance ADD KEY idx_attendance_emp_id (emp_id)','SELECT ''idx_attendance_emp_id exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='attendance' AND index_name='idx_attendance_emp_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE employee_projects ADD KEY idx_employee_projects_emp_id (emp_id)','SELECT ''idx_employee_projects_emp_id exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employee_projects' AND index_name='idx_employee_projects_emp_id');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- 4) Replace global unique indexes with tenant-aware ones ----------
SET @sql = (SELECT IF(COUNT(*)>0,'ALTER TABLE users DROP INDEX email','SELECT ''users.email index missing''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='users' AND index_name='email');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE users ADD UNIQUE KEY uq_users_tenant_email (tenant_id, email)','SELECT ''uq_users_tenant_email exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='users' AND index_name='uq_users_tenant_email');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)>0,'ALTER TABLE employees DROP INDEX employee_code','SELECT ''employees.employee_code index missing''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employees' AND index_name='employee_code');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)>0,'ALTER TABLE employees DROP INDEX email','SELECT ''employees.email index missing''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employees' AND index_name='email');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE employees ADD UNIQUE KEY uq_employees_tenant_employee_code (tenant_id, employee_code)','SELECT ''uq_employees_tenant_employee_code exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employees' AND index_name='uq_employees_tenant_employee_code');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE employees ADD UNIQUE KEY uq_employees_tenant_email (tenant_id, email)','SELECT ''uq_employees_tenant_email exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employees' AND index_name='uq_employees_tenant_email');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)>0,'ALTER TABLE departments DROP INDEX dept_name','SELECT ''departments.dept_name index missing''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='departments' AND index_name='dept_name');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE departments ADD UNIQUE KEY uq_departments_tenant_dept_name (tenant_id, dept_name)','SELECT ''uq_departments_tenant_dept_name exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='departments' AND index_name='uq_departments_tenant_dept_name');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)>0,'ALTER TABLE attendance DROP INDEX uq_attendance_emp_day','SELECT ''attendance.uq_attendance_emp_day missing''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='attendance' AND index_name='uq_attendance_emp_day');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE attendance ADD UNIQUE KEY uq_attendance_tenant_emp_day (tenant_id, emp_id, attendance_date)','SELECT ''uq_attendance_tenant_emp_day exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='attendance' AND index_name='uq_attendance_tenant_emp_day');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)>0,'ALTER TABLE employee_projects DROP INDEX uq_employee_project','SELECT ''employee_projects.uq_employee_project missing''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employee_projects' AND index_name='uq_employee_project');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,'ALTER TABLE employee_projects ADD UNIQUE KEY uq_employee_projects_tenant_emp_project (tenant_id, emp_id, project_id)','SELECT ''uq_employee_projects_tenant_emp_project exists''')
FROM information_schema.statistics WHERE table_schema=@db AND table_name='employee_projects' AND index_name='uq_employee_projects_tenant_emp_project');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- 5) Make tenant_id NOT NULL now that backfill is done ----------
ALTER TABLE users MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE employees MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE departments MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE positions MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE projects MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE employee_projects MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE attendance MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE leave_requests MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE salary_history MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE audit_log MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE refresh_tokens MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE password_reset_tokens MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE failed_login_attempts MODIFY COLUMN tenant_id BIGINT NOT NULL;

-- ---------- 6) Add tenant foreign keys if missing ----------
SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_users_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='users' AND constraint_name='fk_users_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE employees ADD CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_employees_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='employees' AND constraint_name='fk_employees_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE departments ADD CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_departments_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='departments' AND constraint_name='fk_departments_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE positions ADD CONSTRAINT fk_positions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_positions_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='positions' AND constraint_name='fk_positions_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE projects ADD CONSTRAINT fk_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_projects_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='projects' AND constraint_name='fk_projects_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE employee_projects ADD CONSTRAINT fk_employee_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_employee_projects_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='employee_projects' AND constraint_name='fk_employee_projects_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE attendance ADD CONSTRAINT fk_attendance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_attendance_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='attendance' AND constraint_name='fk_attendance_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_leave_requests_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='leave_requests' AND constraint_name='fk_leave_requests_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE salary_history ADD CONSTRAINT fk_salary_history_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_salary_history_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='salary_history' AND constraint_name='fk_salary_history_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_audit_log_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='audit_log' AND constraint_name='fk_audit_log_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_refresh_tokens_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='refresh_tokens' AND constraint_name='fk_refresh_tokens_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_reset_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_password_reset_tokens_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='password_reset_tokens' AND constraint_name='fk_password_reset_tokens_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE failed_login_attempts ADD CONSTRAINT fk_failed_login_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)',
  'SELECT ''fk_failed_login_attempts_tenant exists''')
FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='failed_login_attempts' AND constraint_name='fk_failed_login_attempts_tenant');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- 7) Final verification ----------
SELECT 'users' AS table_name, COUNT(*) AS null_tenant_rows FROM users WHERE tenant_id IS NULL
UNION ALL SELECT 'employees', COUNT(*) FROM employees WHERE tenant_id IS NULL
UNION ALL SELECT 'departments', COUNT(*) FROM departments WHERE tenant_id IS NULL
UNION ALL SELECT 'positions', COUNT(*) FROM positions WHERE tenant_id IS NULL
UNION ALL SELECT 'projects', COUNT(*) FROM projects WHERE tenant_id IS NULL
UNION ALL SELECT 'employee_projects', COUNT(*) FROM employee_projects WHERE tenant_id IS NULL
UNION ALL SELECT 'attendance', COUNT(*) FROM attendance WHERE tenant_id IS NULL
UNION ALL SELECT 'leave_requests', COUNT(*) FROM leave_requests WHERE tenant_id IS NULL
UNION ALL SELECT 'salary_history', COUNT(*) FROM salary_history WHERE tenant_id IS NULL
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log WHERE tenant_id IS NULL
UNION ALL SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens WHERE tenant_id IS NULL
UNION ALL SELECT 'password_reset_tokens', COUNT(*) FROM password_reset_tokens WHERE tenant_id IS NULL
UNION ALL SELECT 'failed_login_attempts', COUNT(*) FROM failed_login_attempts WHERE tenant_id IS NULL;
