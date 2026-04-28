import { Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';
import StatusBadge from './common/StatusBadge';
import { formatDateShort, getStatusVariant } from '../utils/tableUtils';

function AttendanceTable({ attendance, employees, onEdit, onDelete, loading = false }) {
  const getEmployeeName = (empId) => {
    if (!empId) return 'N/A';
    
    const employee = employees && employees.find(emp => emp.emp_id === empId);
    if (employee) {
      return `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || `ID: ${empId}`;
    }
    return `ID: ${empId}`;
  };

  // Column definitions
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => <span className="text-gray-700">{getEmployeeName(row.emp_id)}</span>
    },
    {
      key: 'attendance_date',
      label: 'Date',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.attendance_date)}</span>
    },
    {
      key: 'check_in',
      label: 'Check In',
      render: (row) => <span className="text-gray-600">{row.check_in || 'N/A'}</span>
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (row) => <span className="text-gray-600">{row.check_out || 'N/A'}</span>
    },
    {
      key: 'attendance_status',
      label: 'Status',
      render: (row) => (
        <StatusBadge 
          status={row.attendance_status || 'N/A'} 
          variant={getStatusVariant(row.attendance_status)} 
        />
      )
    }
  ];

  // Render action buttons
  const renderActions = (row) => (
    <>
      <IconButton
        icon={Pencil}
        onClick={() => onEdit(row)}
        variant="primary"
        title="Edit Attendance"
      />
      <IconButton
        icon={Trash2}
        onClick={() => onDelete(row.attendance_id)}
        variant="danger"
        title="Delete Attendance"
      />
    </>
  );

  return (
    <Table
      columns={columns}
      data={attendance}
      loading={loading}
      emptyMessage="No attendance records found"
      renderActions={renderActions}
    />
  );
}

export default AttendanceTable;