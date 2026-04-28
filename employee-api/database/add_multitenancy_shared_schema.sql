-- Shared-schema multi-tenancy migration for employee_management_system
-- Source schema aligned to: employee_management_system.sql (downloaded on 2026-04-22)

START TRANSACTION;

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

-- Add tenant_id columns (nullable first for safe backfill)
ALTER TABLE users ADD COLUMN tenant_id BIGINT NULL AFTER id;
ALTER TABLE employees ADD COLUMN tenant_id BIGINT NULL AFTER emp_id;
ALTER TABLE departments ADD COLUMN tenant_id BIGINT NULL AFTER dept_id;
ALTER TABLE positions ADD COLUMN tenant_id BIGINT NULL AFTER position_id;
ALTER TABLE projects ADD COLUMN tenant_id BIGINT NULL AFTER project_id;
ALTER TABLE employee_projects ADD COLUMN tenant_id BIGINT NULL AFTER assignment_id;
ALTER TABLE attendance ADD COLUMN tenant_id BIGINT NULL AFTER attendance_id;
ALTER TABLE leave_requests ADD COLUMN tenant_id BIGINT NULL AFTER leave_id;
ALTER TABLE salary_history ADD COLUMN tenant_id BIGINT NULL AFTER salary_id;
ALTER TABLE audit_log ADD COLUMN tenant_id BIGINT NULL AFTER id;
ALTER TABLE refresh_tokens ADD COLUMN tenant_id BIGINT NULL AFTER id;
ALTER TABLE password_reset_tokens ADD COLUMN tenant_id BIGINT NULL AFTER id;
ALTER TABLE failed_login_attempts ADD COLUMN tenant_id BIGINT NULL AFTER id;

-- Backfill existing records to default tenant
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

-- Make tenant_id mandatory for tenant-scoped tables
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

-- Tenant indexes
ALTER TABLE users ADD KEY idx_users_tenant (tenant_id);
ALTER TABLE employees ADD KEY idx_employees_tenant (tenant_id);
ALTER TABLE departments ADD KEY idx_departments_tenant (tenant_id);
ALTER TABLE positions ADD KEY idx_positions_tenant (tenant_id);
ALTER TABLE projects ADD KEY idx_projects_tenant (tenant_id);
ALTER TABLE employee_projects ADD KEY idx_employee_projects_tenant (tenant_id);
ALTER TABLE attendance ADD KEY idx_attendance_tenant (tenant_id);
ALTER TABLE leave_requests ADD KEY idx_leave_requests_tenant (tenant_id);
ALTER TABLE salary_history ADD KEY idx_salary_history_tenant (tenant_id);
ALTER TABLE audit_log ADD KEY idx_audit_log_tenant (tenant_id);
ALTER TABLE refresh_tokens ADD KEY idx_refresh_tokens_tenant (tenant_id);
ALTER TABLE password_reset_tokens ADD KEY idx_password_reset_tokens_tenant (tenant_id);
ALTER TABLE failed_login_attempts ADD KEY idx_failed_login_attempts_tenant (tenant_id);

-- Add unique/index combinations for tenant-safe uniqueness
ALTER TABLE users DROP INDEX email;
ALTER TABLE users ADD UNIQUE KEY uq_users_tenant_email (tenant_id, email);
ALTER TABLE users ADD UNIQUE KEY uq_users_tenant_id_id (tenant_id, id);

ALTER TABLE employees DROP INDEX employee_code;
ALTER TABLE employees DROP INDEX email;
ALTER TABLE employees ADD UNIQUE KEY uq_employees_tenant_employee_code (tenant_id, employee_code);
ALTER TABLE employees ADD UNIQUE KEY uq_employees_tenant_email (tenant_id, email);
ALTER TABLE employees ADD UNIQUE KEY uq_employees_tenant_emp_id (tenant_id, emp_id);

ALTER TABLE departments DROP INDEX dept_name;
ALTER TABLE departments ADD UNIQUE KEY uq_departments_tenant_dept_name (tenant_id, dept_name);

ALTER TABLE attendance ADD KEY idx_attendance_emp_id (emp_id);
ALTER TABLE attendance DROP INDEX uq_attendance_emp_day;
ALTER TABLE attendance ADD UNIQUE KEY uq_attendance_tenant_emp_day (tenant_id, emp_id, attendance_date);

ALTER TABLE employee_projects ADD KEY idx_employee_projects_emp_id (emp_id);
ALTER TABLE employee_projects DROP INDEX uq_employee_project;
ALTER TABLE employee_projects ADD UNIQUE KEY uq_employee_projects_tenant_emp_project (tenant_id, emp_id, project_id);

-- Add tenant foreign keys
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE departments ADD CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE positions ADD CONSTRAINT fk_positions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE projects ADD CONSTRAINT fk_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE employee_projects ADD CONSTRAINT fk_employee_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE salary_history ADD CONSTRAINT fk_salary_history_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_reset_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE failed_login_attempts ADD CONSTRAINT fk_failed_login_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);

COMMIT;

