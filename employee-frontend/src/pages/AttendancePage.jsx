import { useEffect, useState } from "react";
import AttendanceForm from "../components/AttendanceForm";
import AttendanceTable from "../components/AttendanceTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";

import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance
} from "../api/attendanceServices";
import { getEmployees } from "../api/employeeService";

function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    emp_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in: '',
    check_out: '',
    attendance_status: 'Present'
  });
  const { showConfirmDelete, showSuccess, showError } = useModal();
  const { isAdmin, isHR, isManager, isUser, isLoading: authLoading, user } = useAuth();
  const canManageAll = isAdmin() || isHR();

  const itemsPerPage = 10;

  const refetchAttendance = async () => {
    try {
      if (isManager()) {
        const [attendRes, teamEmpRes] = await Promise.all([
          getAttendance(),
          axiosInstance.get('/attendance/team-employees')
        ]);
        console.log('MANAGER ATTENDANCE RESPONSE:', attendRes);
        setAttendance(attendRes.data?.data || []);
        setEmployees(teamEmpRes.data?.data || []);
      } else if (isAdmin() || isHR()) {
        const [attendRes, empRes] = await Promise.all([
          getAttendance(),
          getEmployees(1, 1000, "")
        ]);
        console.log('ADMIN/HR ATTENDANCE RESPONSE:', attendRes);
        console.log('TOTAL EMPLOYEES RECEIVED:', empRes.data?.data?.length || 0);
        setAttendance(attendRes.data || []);
        setEmployees(empRes.data?.data || []);
      } else {
        const attendRes = await getAttendance();
        console.log('EMPLOYEE ATTENDANCE RESPONSE:', attendRes);
        setAttendance(attendRes.data || []);
      }
    } catch (err) {
      console.error('Failed to refetch attendance:', err);
      toast.error('Failed to load attendance data');
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        if (isManager()) {
          const [attendRes, teamEmpRes] = await Promise.all([
            getAttendance(),
            axiosInstance.get('/attendance/team-employees')
          ]);
          const attendData = attendRes.data?.data || [];
          const empData = teamEmpRes.data?.data || [];
          console.log('MANAGER ATTENDANCE:', attendData);
          console.log('MANAGER TEAM:', empData);
          setAttendance(attendData);
          setEmployees(empData);

        } else if (isAdmin() || isHR()) {
          const [attendRes, empRes] = await Promise.all([
            getAttendance(),
            getEmployees(1, 1000, "")
          ]);
          const attendData = attendRes.data || [];
          const empData = empRes.data?.data || [];
          console.log('ADMIN/HR ATTENDANCE:', attendData);
          console.log('TOTAL EMPLOYEES RECEIVED:', empData.length);
          setAttendance(attendData);
          setEmployees(empData);

        } else {
          const attendRes = await getAttendance();
          const attendData = attendRes.data || [];
          console.log('EMPLOYEE ATTENDANCE:', attendData);
          console.log('FULL API RESPONSE:', attendRes);
          setAttendance(attendData);
          setEmployees([]);
        }

      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user?.role]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchEmployee, searchDate, searchStatus]);

  const formatDateLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter logic with proper null checks
  const filteredAttendance = attendance.filter(a => {
    if (!a) return false;
    
    const name = `${a.first_name || ''} ${a.last_name || ''} ${a.employee_code || ''}`.toLowerCase();
    const empMatch = searchEmployee === '' || name.includes(searchEmployee.toLowerCase());
    
    const dateMatch = searchDate === '' || 
      formatDateLocal(a.attendance_date) === searchDate;
    
    const statusMatch = searchStatus === 'all' || a.attendance_status === searchStatus;
    
    return empMatch && dateMatch && statusMatch;
  });

  // Debug logging
  console.log('Attendance Debug:', {
    totalAttendance: attendance.length,
    filteredAttendance: filteredAttendance.length,
    searchEmployee,
    searchDate,
    searchStatus,
    attendanceData: attendance,
    filteredData: filteredAttendance
  });

  // Pagination
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const paginated = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = {
    present: attendance.filter(a => 
      formatDateLocal(a.attendance_date) === today && 
      a.attendance_status === 'Present').length,
    absent: attendance.filter(a => 
      formatDateLocal(a.attendance_date) === today && 
      a.attendance_status === 'Absent').length,
    halfDay: attendance.filter(a => 
      formatDateLocal(a.attendance_date) === today && 
      a.attendance_status === 'Half Day').length,
    total: attendance.length
  };

  const handleSave = async (data) => {
    try {
      if (isEditing) {
        await updateAttendance(editingId, data);
        setIsEditing(false);
        setEditingId(null);
        toast.success('Attendance updated successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
      } else {
        await createAttendance(data);
        toast.success('Attendance marked successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
        setCurrentPage(1);
      }

      setFormData({
        emp_id: '',
        attendance_date: new Date().toISOString().split('T')[0],
        check_in: '',
        check_out: '',
        attendance_status: 'Present'
      });
      
      await refetchAttendance();
      setIsModalOpen(false);

    } catch (error) {
      console.error('Save attendance error:', error);
      if (error.response?.data?.message?.includes('already marked')) {
        toast('⚠️ Attendance already marked for this employee on this date!', {
          duration: 4000,
          icon: '⚠️',
          style: {
            background: '#F59E0B',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
      } else {
        toast.error('Failed to process attendance. Try again.', {
          duration: 4000,
          style: {
            background: '#EF4444',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
      }
    }
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingId(record.attendance_id);
    setFormData({
      emp_id: record.emp_id,
      attendance_date: record.attendance_date,
      check_in: record.check_in || '',
      check_out: record.check_out || '',
      attendance_status: record.attendance_status
    });
    setIsModalOpen(true);
  };

  const handleAddAttendance = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      emp_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      check_in: '',
      check_out: '',
      attendance_status: 'Present'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const record = attendance.find(a => a.attendance_id === id);
    const recordDetails = record ? 
      `${record.first_name} ${record.last_name} - ${record.attendance_date}` : 
      'this attendance record';
    
    showConfirmDelete(
      recordDetails,
      async () => {
        try {
          await deleteAttendance(id);
          toast('Attendance record deleted!', {
            duration: 4000,
            icon: '🗑️',
            style: {
              background: '#F97316',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            }
          });
          
          // Update local state
          setAttendance(attendance.filter(a => a.attendance_id !== id));
          
        } catch (error) {
          console.error('Delete attendance error:', error);
          toast.error('Failed to delete attendance. Try again.', {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            }
          });
        }
      },
      `Attendance ID: ${id}\nEmployee: ${record?.first_name || 'N/A'} ${record?.last_name || 'N/A'}\nDate: ${record?.attendance_date || 'N/A'}\nCheck In: ${record?.check_in || 'N/A'}\nCheck Out: ${record?.check_out || 'N/A'}\nStatus: ${record?.attendance_status || 'N/A'}`
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      emp_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      check_in: '',
      check_out: '',
      attendance_status: 'Present'
    });
  };

  const clearFilters = () => {
    setSearchEmployee('');
    setSearchDate('');
    setSearchStatus('all');
    setCurrentPage(1);
  };



  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance Management</h2>
        {canManageAll && (
          <button
            onClick={handleAddAttendance}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mark Attendance
          </button>
        )}
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-green-500 p-4">
          <div className="text-sm font-medium text-gray-500">Present Today</div>
          <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-red-500 p-4">
          <div className="text-sm font-medium text-gray-500">Absent Today</div>
          <div className="text-2xl font-bold text-red-600">{todayStats.absent}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-blue-500 p-4">
          <div className="text-sm font-medium text-gray-500">Half Day Today</div>
          <div className="text-2xl font-bold text-blue-600">{todayStats.halfDay}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-gray-500 p-4">
          <div className="text-sm font-medium text-gray-500">Total Records</div>
          <div className="text-2xl font-bold text-gray-600">{todayStats.total}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-purple-500 p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          {canManageAll && (
            <div className="flex-1 min-w-48">
              <SearchBar
                value={searchEmployee}
                onChange={setSearchEmployee}
                placeholder="Search by employee name or code..."
              />
            </div>
          )}
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Filter by date"
          />
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      {filteredAttendance.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#6B7280'
          }}>
            <p style={{ fontSize: '16px' }}>
              📅 No attendance records found
            </p>
            <p style={{ fontSize: '14px' }}>
              {searchEmployee || searchDate || searchStatus !== 'all' 
                ? 'Try different filter criteria or clear all filters' 
                : 'Your attendance records will appear here once they are marked'}
            </p>
            {(searchEmployee || searchDate || searchStatus !== 'all') && (
              <button 
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <AttendanceTable
            attendance={paginated}
            employees={employees}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
          
          <div className="mt-6">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* MODAL */}
      {canManageAll && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            handleCancelEdit();
          }}
          title={isEditing ? "Update Attendance" : "Mark Attendance"}
          size="md"
        >
          <AttendanceForm
            onSave={handleSave}
            editingAttendance={isEditing ? { attendance_id: editingId, ...formData } : null}
            employees={employees}
            canManageAll={canManageAll}
          />
        </Modal>
      )}
    </div>
  );
}

export default AttendancePage;
