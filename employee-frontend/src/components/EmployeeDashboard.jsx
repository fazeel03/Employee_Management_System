import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Modal from './Modal';
import LeaveForm from './LeaveForm';
import toast from 'react-hot-toast';
import { createLeaveRequest } from '../api/leaveService';
import PieChartComponent from './charts/PieChartComponent';
import BarChartComponent from './charts/BarChartComponent';
import AttendanceCalendar from './attendance/AttendanceCalendar';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  
  const [stats, setStats] = useState({
    presentToday: 0,
    thisMonthAttendance: 0,
    pendingLeaveRequests: 0
  });
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("[EmployeeDashboard] Fetching dashboard data for employee...");
      console.log("[EmployeeDashboard] User info:", { email: user?.email, role: user?.role });
      
      // Backend automatically filters data based on user role:
      // - /attendance: Returns only logged-in employee's attendance (via req.filterByUser)
      // - /leave-requests: Returns only logged-in employee's leave requests (via req.filterByUser)
      const [
        leaveRes,
        attendanceRes
      ] = await Promise.allSettled([
        axiosInstance.get('/leave-requests'),
        axiosInstance.get('/attendance')
      ]);
      
      // Extract data safely from settled promises
      const leaveData = leaveRes.status === 'fulfilled' 
        ? (leaveRes.value.data?.data || [])
        : [];
      const attendanceData = attendanceRes.status === 'fulfilled' 
        ? (attendanceRes.value.data?.data || attendanceRes.value.data || [])
        : [];
      
      console.log("[EmployeeDashboard] API responses:", {
        leaveCount: leaveData.length,
        attendanceCount: attendanceData.length,
        errors: {
          leave: leaveRes.status === 'rejected' ? leaveRes.reason?.message : null,
          attendance: attendanceRes.status === 'rejected' ? attendanceRes.reason?.message : null
        }
      });
      
      // Helper function to format date consistently (copied from AttendancePage)
      const formatDateLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Calculate counts using the same logic as AttendancePage
      const presentToday = attendanceData.filter(a => 
        formatDateLocal(a.attendance_date) === today && 
        a.attendance_status === 'Present'
      ).length;
      
      const thisMonthAttendance = attendanceData.filter(a => {
        const attendanceDate = new Date(a.attendance_date);
        return attendanceDate.getMonth() === currentMonth && 
               attendanceDate.getFullYear() === currentYear &&
               a.attendance_status === 'Present';
      }).length;
      
      const pendingLeaveRequests = leaveData.filter(l => l.approval_status === 'Pending').length;
      
      console.log("[EmployeeDashboard] Calculated stats:", {
        presentToday,
        thisMonthAttendance,
        pendingLeaveRequests,
        totalLeaveRecords: leaveData.length,
        totalAttendanceRecords: attendanceData.length
      });
      
      setStats({
        presentToday,
        thisMonthAttendance,
        pendingLeaveRequests
      });
      
      // Store raw data for charts
      setAttendanceData(attendanceData);
      setLeaveData(leaveData);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Set default values to prevent UI crashes
      setStats({
        presentToday: 0,
        thisMonthAttendance: 0,
        pendingLeaveRequests: 0
      });
      setError('Some dashboard data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Get user display name
  const getDisplayName = () => {
    if (!user) return 'Employee';
    if (user.name) return user.name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.email) return user.email.split('@')[0];
    return 'Employee';
  };

  // Get user initial
  const getUserInitial = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const handleApplyLeave = () => {
    setIsLeaveModalOpen(true);
  };

  const handleSaveLeave = async (data) => {
    try {
      await createLeaveRequest(data);
      toast.success('Leave request submitted successfully!', {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '600',
          borderRadius: '10px',
          padding: '16px 24px',
        }
      });
      setIsLeaveModalOpen(false);
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to submit leave request. Try again.', {
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
  };

  // Chart data transformations
  const leaveStatusData = useMemo(() => {
    if (!leaveData.length) return [];
    
    const statusCount = {
      Pending: 0,
      Approved: 0,
      Rejected: 0
    };
    
    leaveData.forEach(leave => {
      const status = leave.approval_status || 'Pending';
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++;
      }
    });
    
    return Object.entries(statusCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [leaveData]);

  const monthlyAttendanceData = useMemo(() => {
    if (!attendanceData.length) return [];
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const presentCount = attendanceData.filter(a => {
        const aDate = new Date(a.attendance_date);
        return aDate.getMonth() === month && 
               aDate.getFullYear() === year && 
               a.attendance_status === 'Present';
      }).length;
      
      last6Months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        present: presentCount
      });
    }
    
    return last6Months;
  }, [attendanceData]);
  const StatCard = ({ title, value, icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'border-blue-500',
      green: 'border-green-500',
      purple: 'border-purple-500',
      yellow: 'border-yellow-500',
      red: 'border-red-500',
      indigo: 'border-indigo-500'
    };

    const bgColorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500'
    };

    return (
      <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 ${colorClasses[color]}`}>
        <div className="p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${bgColorClasses[color]} flex items-center justify-center`}>
              {icon}
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {getDisplayName()}!
              </h1>
              <p className="text-blue-100">
                Here's your work overview and quick actions
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold">
                  {getUserInitial()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Main Content Grid: Charts on Left, Calendar on Right */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Charts (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChartComponent
                data={leaveStatusData}
                title="Leave Request Status"
                height={250}
                colors={['#F59E0B', '#10B981', '#EF4444']}
              />
              <BarChartComponent
                data={monthlyAttendanceData}
                dataKey="present"
                xAxisKey="name"
                color="#10B981"
                title="Monthly Attendance (Last 6 Months)"
                height={250}
              />
            </div>
          </div>
          
          {/* Right: Attendance Calendar Widget */}
          <div className="lg:col-span-1">
            <AttendanceCalendar 
              attendanceData={attendanceData}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-blue-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleApplyLeave}
            className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center font-medium"
          >
            <span className="block text-2xl mb-2">🏖️</span>
            Apply Leave
          </button>
          <button 
            onClick={() => navigate('/salary')}
            className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium"
          >
            <span className="block text-2xl mb-2">💰</span>
            View Salary History
          </button>
          <button 
            onClick={() => navigate('/attendance')}
            className="p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-center font-medium"
          >
            <span className="block text-2xl mb-2">👁️</span>
            View Attendance
          </button>
        </div>
      </div>

      {/* Leave Application Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Apply for Leave"
        size="md"
      >
        <LeaveForm
          onSave={handleSaveLeave}
          editingLeave={null}
          employees={[]}
          canManageAll={false}
        />
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
