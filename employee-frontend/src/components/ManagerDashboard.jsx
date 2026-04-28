import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDashboardData, projectFilters } from '../api/managerService';
import { getLeaveRequests } from '../api/leaveService';
import PieChartComponent from './charts/PieChartComponent';
import AttendanceCalendar from './attendance/AttendanceCalendar';
import axiosInstance from '../api/axiosInstance';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    teamMembers: 0,
    activeProjects: 0,
    todaysAttendance: 0,
    absentToday: 0,
    pendingLeaves: 0
  });
  
  const [rawData, setRawData] = useState({
    teamMembers: [],
    projects: [],
    attendance: [],
    leaveRequests: [],
    managerAttendance: [] // Manager's own attendance for calendar
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data (projects, team, attendance)  
      const dashboardData = await getDashboardData();
      
      // Fetch leave requests using EXACT SAME service as LeavePage
      // Backend automatically filters by role (manager sees team leaves)
      const leaveResponse = await getLeaveRequests(1, 1000, "");
      const teamLeaves = leaveResponse.data.data || [];
      
      // Fetch manager's OWN attendance for calendar widget
      // Backend automatically filters by logged-in user (manager sees their own attendance)
      setAttendanceLoading(true);
      const managerAttendanceResponse = await axiosInstance.get('/attendance');
      const managerAttendance = managerAttendanceResponse.data?.data || managerAttendanceResponse.data || [];
      setAttendanceLoading(false);
      
      // Calculate stats from real data with fallbacks
      const teamMembers = dashboardData.teamMembers || [];
      
      // Use centralized filtering utility (same logic as backend)
      const activeProjects = (dashboardData.projects || []).filter(projectFilters.isActive);
      
      const todaysAttendance = dashboardData.attendance || [];
      
      const presentCount = todaysAttendance.filter(
        att => att.attendance_status === 'Present' || att.status === 'Present'
      ).length;
      
      const absentCount = teamMembers.length - presentCount;
      
      setStats({
        teamMembers: teamMembers.length,
        activeProjects: activeProjects.length,
        todaysAttendance: presentCount,
        absentToday: absentCount,
        pendingLeaves: teamLeaves.filter(l => l.approval_status === 'Pending').length
      });
      
      // Store raw data for charts
      setRawData({
        teamMembers,
        projects: dashboardData.projects || [],
        attendance: todaysAttendance,
        leaveRequests: teamLeaves, // Use EXACT SAME data as LeavePage
        managerAttendance // Manager's own attendance for calendar
      });
      
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError('Failed to load dashboard data. Please try again.');
      setAttendanceLoading(false);
      
      // Set default values on error to prevent crashes
      setStats({
        teamMembers: 0,
        activeProjects: 0,
        todaysAttendance: 0,
        absentToday: 0,
        pendingLeaves: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  // Chart data transformations
  const leaveStatusChartData = useMemo(() => {
    if (!rawData.leaveRequests.length) {
      return [];
    }
    
    // Use EXACT SAME logic as LeavePage with Title Case status values
    const pendingCount = rawData.leaveRequests.filter(r => r.approval_status === 'Pending').length;
    const approvedCount = rawData.leaveRequests.filter(r => r.approval_status === 'Approved').length;
    const rejectedCount = rawData.leaveRequests.filter(r => r.approval_status === 'Rejected').length;
    
    const chartData = [
      { name: 'Pending', value: pendingCount },
      { name: 'Approved', value: approvedCount },
      { name: 'Rejected', value: rejectedCount }
    ].filter(item => item.value > 0);
    
    return chartData;
  }, [rawData.leaveRequests]);

  const projectStatusChartData = useMemo(() => {
    if (!rawData.projects.length) return [];
    
    const statusCount = {
      Active: 0,
      Completed: 0,
      Pending: 0
    };
    
    rawData.projects.forEach(project => {
      if (projectFilters.isActive(project)) {
        statusCount.Active++;
      } else if (projectFilters.isCompleted(project)) {
        statusCount.Completed++;
      } else {
        statusCount.Pending++;
      }
    });
    
    return Object.entries(statusCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [rawData.projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name || 'Manager'}!
              </h1>
              <p className="text-blue-100">
                Here's your team overview and today's status
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'M'}
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

      {/* Manager Dashboard Content */}
      <div>
        {/* Main Content Grid: 3 widgets in one row */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leave Request Status Chart */}
            <div className="lg:col-span-1">
              <PieChartComponent
                data={leaveStatusChartData}
                title="Leave Request Status"
                height={250}
                colors={['#facc15', '#22c55e', '#ef4444']}
              />
            </div>
            
            {/* Project Status Chart */}
            <div className="lg:col-span-1">
              <PieChartComponent
                data={projectStatusChartData}
                title="Project Status Distribution"
                height={250}
                colors={['#10B981', '#3B82F6', '#F59E0B']}
              />
            </div>
            
            {/* Manager's Own Attendance Calendar Widget */}
            <div className="lg:col-span-1">
              <AttendanceCalendar 
                attendanceData={rawData.managerAttendance}
                loading={attendanceLoading}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/projects')}
              className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left font-medium"
            >
              Create Project
            </button>
            <button 
              onClick={() => navigate('/employees')}
              className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left font-medium"
            >
              View Team Members
            </button>
            <button 
              onClick={() => navigate('/leave')}
              className="p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-left font-medium"
            >
              View Leave Requests
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-left font-medium"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
