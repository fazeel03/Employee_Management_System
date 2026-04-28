import CurrencyDisplay from './CurrencyDisplay';
import { Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';

function PositionTable({ positions, onEdit, onDelete, loading = false }) {
  // Column definitions
  const columns = [
    {
      key: 'position_id',
      label: 'ID',
      render: (row) => <span className="text-gray-700">{row.position_id}</span>
    },
    {
      key: 'position_title',
      label: 'Title',
      render: (row) => <span className="font-medium text-gray-900">{row.position_title}</span>
    },
    {
      key: 'dept_id',
      label: 'Department',
      render: (row) => <span className="text-gray-600">{row.dept_id}</span>
    },
    {
      key: 'min_salary',
      label: 'Min Salary',
      render: (row) => <CurrencyDisplay amount={row.min_salary} />
    },
    {
      key: 'max_salary',
      label: 'Max Salary',
      render: (row) => <CurrencyDisplay amount={row.max_salary} />
    }
  ];

  // Render action buttons
  const renderActions = (row) => (
    <>
      <IconButton
        icon={Pencil}
        onClick={() => onEdit(row)}
        variant="primary"
        title="Edit Position"
      />
      <IconButton
        icon={Trash2}
        onClick={() => onDelete(row.position_id)}
        variant="danger"
        title="Delete Position"
      />
    </>
  );

  return (
    <Table
      columns={columns}
      data={positions}
      loading={loading}
      emptyMessage="No positions found"
      renderActions={renderActions}
    />
  );
}

export default PositionTable;