import { Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';
import { formatDateShort } from '../utils/tableUtils';

function EmployeeProjectTable({ assignments, onEdit, onDelete, loading = false }) {
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => <span className="text-gray-700">{row.employee_name || row.emp_id}</span>
    },
    {
      key: 'project',
      label: 'Project',
      render: (row) => <span className="font-medium text-gray-900">{row.project_name || row.project_id}</span>
    },
    {
      key: 'role_name',
      label: 'Role',
      render: (row) => <span className="text-gray-600">{row.role_name}</span>
    },
    {
      key: 'allocation_percent',
      label: 'Allocation %',
      render: (row) => <span className="text-gray-600">{row.allocation_percent}%</span>
    },
    {
      key: 'assigned_on',
      label: 'Assigned',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.assigned_on)}</span>
    },
    {
      key: 'released_on',
      label: 'Released',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.released_on)}</span>
    }
  ];

  const renderActions = (row) => (
    <>
      <IconButton
        icon={Pencil}
        onClick={() => onEdit(row)}
        variant="primary"
        title="Edit Assignment"
      />
      <IconButton
        icon={Trash2}
        onClick={() => onDelete(row.assignment_id)}
        variant="danger"
        title="Delete Assignment"
      />
    </>
  );

  return (
    <Table
      columns={columns}
      data={assignments}
      loading={loading}
      emptyMessage="No assignments found"
      renderActions={renderActions}
    />
  );
}

export default EmployeeProjectTable;