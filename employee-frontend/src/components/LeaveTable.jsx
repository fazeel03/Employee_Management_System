import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';
import IconButton from './IconButton';
import Table from './common/Table';
import StatusBadge from './common/StatusBadge';
import { formatDateShort, getStatusVariant, getLeaveTypeIcon } from '../utils/tableUtils';

function LeaveTable({ leaveRequests, employees, onDelete, onEdit, onApprove, onReject, canApprove, loading = false }) {
  const { isAdmin, isHR, isManager, isUser } = useAuth();
  const canApproveActions = canApprove !== undefined 
    ? canApprove 
    : (isAdmin() || isHR() || isManager());

  const getEmployeeName = (empId, item) => {
    return item.first_name && item.last_name 
      ? `${item.first_name} ${item.last_name}` 
      : item.employee_name 
      ? item.employee_name
      : `Employee #${item.emp_id}`;
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => <span className="text-gray-700">{getEmployeeName(row.emp_id, row)}</span>
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{getLeaveTypeIcon(row.leave_type)}</span>
          <span className="font-medium text-gray-900">{row.leave_type}</span>
        </div>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.start_date)}</span>
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.end_date)}</span>
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => <span className="text-gray-600 text-sm line-clamp-2">{row.reason || '-'}</span>
    },
    {
      key: 'approval_status',
      label: 'Status',
      render: (row) => (
        <StatusBadge 
          status={row.approval_status} 
          variant={getStatusVariant(row.approval_status)} 
        />
      )
    },
    {
      key: 'requested_at',
      label: 'Requested At',
      render: (row) => <span className="text-gray-600">{formatDateShort(row.requested_at)}</span>
    }
  ];

  const renderActions = (row) => {
    if (row.approval_status !== 'Pending') {
      return <span className="text-gray-400 text-sm italic">No actions available</span>;
    }

    return (
      <>
        {canApproveActions && (
          <IconButton
            icon={CheckCircle}
            onClick={() => onApprove(row.leave_id)}
            variant="success"
            title="Approve Leave"
          />
        )}
        {canApproveActions && (
          <IconButton
            icon={XCircle}
            onClick={() => onReject(row.leave_id)}
            variant="danger"
            title="Reject Leave"
          />
        )}
        {(isAdmin() || isHR() || isUser()) && (
          <IconButton
            icon={Pencil}
            onClick={() => onEdit(row)}
            variant="primary"
            title="Edit Leave"
          />
        )}
        {(isAdmin() || isHR() || isUser()) && (
          <IconButton
            icon={Trash2}
            onClick={() => onDelete(row.leave_id)}
            variant="danger"
            title="Delete Leave"
          />
        )}
      </>
    );
  };

  return (
    <Table
      columns={columns}
      data={leaveRequests}
      loading={loading}
      emptyMessage="No leave requests found"
      renderActions={renderActions}
    />
  );
}

export default LeaveTable;
