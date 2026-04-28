/**
 * Shared utility functions for tables
 */

/**
 * Format date to "Jan 09, 2022" format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  return dateString.split('T')[0];
};

/**
 * Get employee full name from employee object or ID
 */
export const getEmployeeName = (employee, empId) => {
  if (!employee && !empId) return 'N/A';
  
  if (employee) {
    if (employee.first_name && employee.last_name) {
      return `${employee.first_name} ${employee.last_name}`;
    }
    if (employee.employee_name) {
      return employee.employee_name;
    }
  }
  
  return empId ? `Employee #${empId}` : 'N/A';
};

/**
 * Get status variant for StatusBadge component
 */
export const getStatusVariant = (status) => {
  if (!status) return 'default';
  
  const statusLower = status.toLowerCase();
  
  // Employee status
  if (statusLower === 'active') return 'success';
  if (statusLower === 'on leave') return 'warning';
  if (statusLower === 'resigned') return 'danger';
  
  // Leave status
  if (statusLower === 'pending') return 'warning';
  if (statusLower === 'approved') return 'success';
  if (statusLower === 'rejected') return 'danger';
  
  // Attendance status
  if (statusLower === 'present') return 'success';
  if (statusLower === 'absent') return 'danger';
  if (statusLower === 'leave') return 'warning';
  if (statusLower === 'half day') return 'info';
  if (statusLower === 'late') return 'orange';
  if (statusLower === 'early leave') return 'purple';
  
  return 'default';
};

/**
 * Get leave type icon
 */
export const getLeaveTypeIcon = (type) => {
  const icons = {
    'Sick': '🤒',
    'Casual': '🏖️',
    'Earned': '💰',
    'Maternity': '🤱',
    'Paternity': '👨‍👦‍👦',
    'Unpaid': '📋'
  };
  
  return icons[type] || '📄';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
