import CurrencyDisplay from './CurrencyDisplay';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';
import { formatDateShort } from '../utils/tableUtils';

function ProjectTable({ projects, onDelete, onEdit, loading = false }) {
  const { isAdmin, isHR } = useAuth();
  const canManageProjects = isAdmin() || isHR();
  const canSeeBudget = isAdmin() || isHR();
  const canDelete = isAdmin() || isHR();

  // Column definitions
  const columns = [
    {
      key: 'project_id',
      label: 'ID',
      render: (row) => <span className="text-gray-700">{row.project_id}</span>
    },
    {
      key: 'project_name',
      label: 'Project Name',
      render: (row) => <span className="font-medium text-gray-900">{row.project_name}</span>
    },
    {
      key: 'start_date',
      label: 'Start',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.start_date)}</span>
    },
    {
      key: 'end_date',
      label: 'End',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.end_date)}</span>
    },
    {
      key: 'budget',
      label: canManageProjects ? 'Budget' : 'Allocation',
      render: (row) => (
        canSeeBudget ? (
          <CurrencyDisplay amount={row.budget} />
        ) : (
          <span className="text-gray-600">{row.allocation_percent || 0}%</span>
        )
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className="text-gray-600">{row.status}</span>
    },
    {
      key: 'project_manager_id',
      label: 'Manager',
      render: (row) => <span className="text-gray-600">{row.project_manager_id}</span>
    }
  ];

  // Render action buttons
  const renderActions = (row) => (
    <>
      {canManageProjects && (
        <IconButton
          icon={Pencil}
          onClick={() => onEdit(row)}
          variant="primary"
          title="Edit Project"
        />
      )}
      {canDelete && (
        <IconButton
          icon={Trash2}
          onClick={() => onDelete(row.project_id)}
          variant="danger"
          title="Delete Project"
        />
      )}
    </>
  );

  return (
    <Table
      columns={columns}
      data={projects}
      loading={loading}
      emptyMessage="No projects found"
      renderActions={renderActions}
    />
  );
}

export default ProjectTable;