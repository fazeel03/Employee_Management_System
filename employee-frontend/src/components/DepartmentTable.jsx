import CurrencyDisplay from './CurrencyDisplay';
import { Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';

function DepartmentTable({ departments, onEdit, onDelete, loading = false }) {
  // Column definitions
  const columns = [
    {
      key: 'dept_id',
      label: 'ID',
      render: (row) => <span className="text-gray-700">{row.dept_id}</span>
    },
    {
      key: 'dept_name',
      label: 'Department Name',
      render: (row) => <span className="font-medium text-gray-900">{row.dept_name}</span>
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => <span className="text-gray-600">{row.location || 'Not specified'}</span>
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (row) => <CurrencyDisplay amount={row.budget} />
    }
  ];

  // Render action buttons
  const renderActions = (row) => (
    <>
      <IconButton
        icon={Pencil}
        onClick={() => onEdit(row)}
        variant="primary"
        title="Edit Department"
      />
      <IconButton
        icon={Trash2}
        onClick={() => onDelete(row.dept_id)}
        variant="danger"
        title="Delete Department"
      />
    </>
  );

  return (
    <Table
      columns={columns}
      data={departments}
      loading={loading}
      emptyMessage="No departments found"
      renderActions={renderActions}
    />
  );
}

export default DepartmentTable;