import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { Pencil, Trash2 } from 'lucide-react';
import Table from './common/Table';
import StatusBadge from './common/StatusBadge';
import IconButton from './IconButton';
import { formatDate, getStatusVariant } from '../utils/tableUtils';

function EmployeeTable({ employees, onDelete, onEdit, loading = false }) {
  const { isAdmin, isHR } = useAuth();
  const canManageEmployees = isAdmin() || isHR();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Fetch departments and positions for mapping
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          axiosInstance.get('/departments'),
          axiosInstance.get('/positions')
        ]);
        setDepartments(Array.isArray(deptRes.data.data) ? deptRes.data.data : deptRes.data);
        setPositions(Array.isArray(posRes.data.data) ? posRes.data.data : posRes.data);
      } catch (error) {
        console.error('Failed to fetch mappings:', error);
      }
    };
    
    fetchMappings();
  }, []);

  // Helper functions
  const getDepartmentName = (deptId) => {
    if (!deptId) return 'N/A';
    const dept = departments.find(d => d.dept_id === parseInt(deptId));
    return dept ? dept.dept_name : 'N/A';
  };

  const getPositionName = (positionId) => {
    if (!positionId) return 'N/A';
    const position = positions.find(p => p.position_id === parseInt(positionId));
    return position ? position.position_title : 'N/A';
  };

  // Column definitions
  const columns = [
    {
      key: 'employee_code',
      label: 'Employee Code',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {row.employee_code || 'N/A'}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Full Name',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {row.first_name} {row.last_name}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <span className="text-gray-600">{row.email}</span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => (
        <span className="text-gray-600">{row.phone || 'N/A'}</span>
      )
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <span className="text-gray-600">{getDepartmentName(row.dept_id)}</span>
      )
    },
    {
      key: 'position',
      label: 'Position',
      render: (row) => (
        <span className="text-gray-600">{getPositionName(row.position_id)}</span>
      )
    },
    {
      key: 'hire_date',
      label: 'Hire Date',
      render: (row) => (
        <span className="text-gray-600">{formatDate(row.hire_date)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge 
          status={row.status || 'N/A'} 
          variant={getStatusVariant(row.status)} 
        />
      )
    }
  ];

  // Render action buttons
  const renderActions = (row) => {
    if (!canManageEmployees) {
      return <span className="text-xs text-gray-400">View only</span>;
    }

    return (
      <>
        <IconButton
          icon={Pencil}
          onClick={() => onEdit(row)}
          variant="primary"
          title="Edit Employee"
        />
        <IconButton
          icon={Trash2}
          onClick={() => onDelete(row.emp_id)}
          variant="danger"
          title="Delete Employee"
        />
      </>
    );
  };

  return (
    <Table
      columns={columns}
      data={employees}
      loading={loading}
      emptyMessage="No employees found"
      renderActions={renderActions}
    />
  );
}

export default EmployeeTable;
