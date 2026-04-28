import CurrencyDisplay from './CurrencyDisplay';
import { Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';
import { formatDateShort } from '../utils/tableUtils';

function SalaryTable({ salaryHistory, employees, onDelete, onEdit, canManageAll = false, loading = false }) {
  const getEmployeeName = (empId) => {
    const employee = employees.find(emp => emp.emp_id === empId);
    return employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${empId}`;
  };

  // Column definitions
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => <span className="text-gray-700">{getEmployeeName(row.emp_id)}</span>
    },
    {
      key: 'salary_amount',
      label: 'Salary Amount',
      render: (row) => <CurrencyDisplay amount={row.salary_amount} />
    },
    {
      key: 'effective_from',
      label: 'Effective From',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.effective_from)}</span>
    },
    {
      key: 'effective_to',
      label: 'Effective To',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.effective_to) || 'Present'}</span>
    },
    {
      key: 'change_reason',
      label: 'Change Reason',
      render: (row) => <span className="text-gray-600 text-sm">{row.change_reason || '-'}</span>
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.created_at)}</span>
    }
  ];

  // Render action buttons
  const renderActions = (row) => {
    if (!canManageAll) {
      return <span className="text-xs text-gray-400">View only</span>;
    }

    return (
      <>
        <IconButton
          icon={Pencil}
          onClick={() => onEdit(row)}
          variant="primary"
          title="Edit Salary Record"
        />
        <IconButton
          icon={Trash2}
          onClick={() => onDelete(row.salary_id)}
          variant="danger"
          title="Delete Salary Record"
        />
      </>
    );
  };

  return (
    <Table
      columns={columns}
      data={salaryHistory}
      loading={loading}
      emptyMessage="No salary records found"
      renderActions={renderActions}
    />
  );
}

export default SalaryTable;
