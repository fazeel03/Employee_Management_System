import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Users, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, Briefcase } from 'lucide-react';
import PieChartComponent from './charts/PieChartComponent';
import LineChartComponent from './charts/LineChartComponent';
import BarChartComponent from './charts/BarChartComponent';

const HRDashboard = () => {
  const { user, isHR } = useAuth();
  const navigate = useNavigate();
  
  // Utility function for consistent date formatting
  const formatDateLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    pendingLeaveRequests: 0,
    todayAttendance: 0,
    newHiresThisMonth: 0,
    projectsCompleted: 0,
    pendingReviews: 0,
    totalDepartments: 0,
    employeeGrowthRate: 0,
    projectCompletionRate: 0
  });
  
  const [rawData, setRawData] = useState({
    employees: [],
    projects: [],
    leaveRequests: [],
    attendance: [],
    departments: []
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Fetching dashboard data for HR...");
      
      // Fetch data from all available APIs
      const [
        employeesRes,
        projRes,
        leaveRes,
        attendanceRes,
        departmentsRes
      ] = await Promise.allSettled([
        axiosInstance.get('/employees?page=1&limit=1000'), // Get all employees
        axiosInstance.get('/projects'),
        axiosInstance.get('/leave-requests'), // Use standard working endpoint
        axiosInstance.get('/attendance'),
        axiosInstance.get('/departments?page=1&limit=100')
      ]);
      
      // Extract data safely from settled promises
      const employeesData = employeesRes.status === 'fulfilled' 
        ? (employeesRes.value.data?.data || [])
        : [];
      const projectsData = projRes.status === 'fulfilled' 
        ? (projRes.value.data?.data || [])
        : [];
      const leaveData = leaveRes.status === 'fulfilled' 
        ? (leaveRes.value.data?.data || [])
        : [];
      const attendanceData = attendanceRes.status === 'fulfilled' 
        ? (attendanceRes.value.data?.data || [])
        : [];
      const departmentsData = departmentsRes.status === 'fulfilled' 
        ? (departmentsRes.value.data?.data || [])
        : [];
      
      console.log("HR dashboard API responses:", {
        employees: employeesData.length,
        projects: projectsData.length,
        leave: leaveData.length,
        attendance: attendanceData.length,
        departments: departmentsData.length
      });
      
      // Calculate real metrics
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Employee metrics
      const totalEmployees = employeesData.length;
      const newHiresThisMonth = employeesData.filter(emp => {
        if (!emp.hire_date) return false;
        try {
          const hireDate = new Date(emp.hire_date);
          // Check if date is valid
          if (isNaN(hireDate.getTime())) return false;
          return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
        } catch (error) {
          console.warn('Invalid hire_date for employee:', emp.id, emp.hire_date);
          return false;
        }
      }).length;
      
      // Debug logging for new hires
      console.log('NEW HIRES ANALYSIS:', {
        totalEmployees: employeesData.length,
        currentMonth,
        currentYear,
        newHiresThisMonth,
        hiredThisMonth: employeesData.filter(emp => {
          if (!emp.hire_date) return false;
          try {
            const hireDate = new Date(emp.hire_date);
            return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
          } catch (error) {
            return false;
          }
        }).map(emp => ({ 
          id: emp.id, 
          name: `${emp.first_name} ${emp.last_name}`, 
          hire_date: emp.hire_date 
        }))
      });
      
      // Last month employees for growth rate calculation
      const lastMonthEmployees = employeesData.filter(emp => {
        if (!emp.hire_date) return false;
        try {
          const hireDate = new Date(emp.hire_date);
          if (isNaN(hireDate.getTime())) return false;
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return hireDate.getMonth() === lastMonth && hireDate.getFullYear() === lastMonthYear;
        } catch (error) {
          console.warn('Invalid hire_date for employee:', emp.id, emp.hire_date);
          return false;
        }
      }).length;
      const employeeGrowthRate = lastMonthEmployees > 0 
        ? Math.round(((newHiresThisMonth - lastMonthEmployees) / lastMonthEmployees) * 100)
        : 0;
      
      // Project metrics
      const activeProjects = projectsData.filter(p => {
        const status = p.status?.toString().toLowerCase();
        return status === 'in progress' || status === 'active' || status === 'ongoing';
      }).length;
      const projectsCompleted = projectsData.filter(p => {
        const status = p.status?.toString().toLowerCase();
        return status === 'completed';
      }).length;
      const projectCompletionRate = projectsData.length > 0 
        ? Math.round((projectsCompleted / projectsData.length) * 100)
        : 0;
      
      // Leave and attendance metrics
      const pendingLeaveRequests = leaveData.filter(l => {
        const status = l.status?.toString() || l.approval_status?.toString();
        return status === 'Pending' || status === 'pending';
      }).length;
      const todayAttendance = attendanceData.filter(a => 
        formatDateLocal(a.attendance_date) === today && 
        a.attendance_status === 'Present'
      ).length;
      
      const totalDepartments = departmentsData.length;
      
      // Generate recent activities
      const activities = [];
      
      // Recent hires (most important for HR)
      const recentHires = employeesData
        .filter(emp => emp.hire_date)
        .sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date))
        .slice(0, 3);
      
      recentHires.forEach(emp => {
        const empName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown';
        activities.push({
          type: 'hire',
          message: `New employee ${empName} joined`,
          time: formatDate(emp.hire_date),
          icon: <Users className="w-4 h-4 text-green-600" />
        });
      });
      
      // Pending leave requests (critical for HR action)
      const pendingLeaves = leaveData
        .filter(l => {
          const status = l.status?.toString() || l.approval_status?.toString();
          return status === 'Pending' || status === 'pending';
        })
        .sort((a, b) => new Date(b.created_at || b.applied_date) - new Date(a.created_at || b.applied_date))
        .slice(0, 2);
      
      pendingLeaves.forEach(leave => {
        const empName = leave.employee_name || leave.employee?.name || 'Unknown';
        activities.push({
          type: 'leave',
          message: `${empName} - Leave request pending`,
          time: formatDate(leave.created_at || leave.applied_date),
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />
        });
      });
      
      // Recent project completions (important for productivity tracking)
      const recentCompletions = projectsData
        .filter(p => p.status?.toString().toLowerCase() === 'completed')
        .sort((a, b) => new Date(b.updated_at || b.end_date) - new Date(a.updated_at || a.end_date))
        .slice(0, 1);
      
      recentCompletions.forEach(project => {
        activities.push({
          type: 'project',
          message: `Project "${project.name}" completed`,
          time: formatDate(project.updated_at || project.end_date),
          icon: <CheckCircle className="w-4 h-4 text-blue-600" />
        });
      });
      
      console.log("Calculated HR stats:", {
        totalEmployees,
        activeProjects,
        pendingLeaveRequests,
        todayAttendance,
        newHiresThisMonth,
        projectsCompleted,
        totalDepartments,
        employeeGrowthRate,
        projectCompletionRate
      });
      
      setStats({
        totalEmployees,
        activeProjects,
        pendingLeaveRequests,
        todayAttendance,
        newHiresThisMonth,
        projectsCompleted,
        pendingReviews: 0, // Still static until reviews API is available
        totalDepartments,
        employeeGrowthRate,
        projectCompletionRate
      });
      
      // Store raw data for charts
      setRawData({
        employees: employeesData,
        projects: projectsData,
        leaveRequests: leaveData,
        attendance: attendanceData,
        departments: departmentsData
      });
      
      setRecentActivities(activities.slice(0, 6)); // Show latest 6 activities
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Chart data transformations
  const employeeDistributionData = useMemo(() => {
    if (!rawData.employees.length) return [];
    
    const deptCount = {};
    rawData.employees.forEach(emp => {
      const dept = emp.dept_name || 'Unassigned';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    
    return Object.entries(deptCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rawData.employees]);

  const attendanceTrendData = useMemo(() => {
    if (!rawData.attendance.length) return [];
    
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const presentCount = rawData.attendance.filter(a => {
        const aDate = new Date(a.attendance_date).toISOString().split('T')[0];
        return aDate === dateStr && a.attendance_status === 'Present';
      }).length;
      
      last30Days.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: presentCount
      });
    }
    
    return last30Days;
  }, [rawData.attendance]);

  const leaveTypesData = useMemo(() => {
    if (!rawData.leaveRequests.length) return [];
    
    const typeCount = {};
    rawData.leaveRequests.forEach(leave => {
      const type = leave.leave_type || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rawData.leaveRequests]);

  const hiringTrendData = useMemo(() => {
    if (!rawData.employees.length) return [];
    
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const hiresCount = rawData.employees.filter(emp => {
        if (!emp.hire_date) return false;
        const hireDate = new Date(emp.hire_date);
        return hireDate.getMonth() === month && hireDate.getFullYear() === year;
      }).length;
      
      last12Months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        hires: hiresCount
      });
    }
    
    return last12Months;
  }, [rawData.employees]);

  // Enhanced Stat Card Component with trend indicators
  const StatCard = ({ title, value, icon, color = 'blue', trend, subtitle }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500'
    };

    const bgClasses = {
      blue: 'bg-blue-50',
      green: 'bg-green-50',
      purple: 'bg-purple-50',
      yellow: 'bg-yellow-50',
      red: 'bg-red-50',
      indigo: 'bg-indigo-50'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${bgClasses[color]}`}>
              <div className={`w-6 h-6 ${colorClasses[color]} rounded-full flex items-center justify-center text-white`}>
                {icon}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0 ? 'bg-green-100 text-green-800' : 
              trend < 0 ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : 
               trend < 0 ? <TrendingUp className="w-3 h-3 mr-1 rotate-180" /> : null}
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
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
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name || 'HR'}! 👥‍💼
              </h1>
              <p className="text-blue-100">
                Here's your HR overview and team management insights
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'H'}
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

      {/* HR Dashboard Content */}
      <div>
      {/* KPI Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<Users className="w-6 h-6" />}
            color="blue"
            trend={stats.employeeGrowthRate}
            subtitle="Across all departments"
          />
          <StatCard
            title="Pending Leave Requests"
            value={stats.pendingLeaveRequests}
            icon={<Calendar className="w-6 h-6" />}
            color="yellow"
            subtitle="Awaiting approval"
          />
        </div>
      </div>

      {/* Employee Distribution & Attendance Trend */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartComponent
            data={employeeDistributionData}
            title="Employee Distribution by Department"
            height={250}
          />
          <LineChartComponent
            data={attendanceTrendData}
            dataKey="present"
            xAxisKey="name"
            color="#6366F1"
            title="Attendance Trend (Last 30 Days)"
            height={250}
          />
        </div>
      </div>

      {/* Leave Types & Hiring Trend */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartComponent
            data={leaveTypesData}
            dataKey="value"
            xAxisKey="name"
            color="#8B5CF6"
            title="Leave Types Breakdown"
            height={250}
          />
          <LineChartComponent
            data={hiringTrendData}
            dataKey="hires"
            xAxisKey="name"
            color="#10B981"
            title="Hiring Trend (Last 12 Months)"
            height={250}
          />
        </div>
      </div>

        {/* Quick Actions and Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/employees/add')}
                className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left font-medium flex items-center"
              >
                <Users className="w-4 h-4 mr-3" />
                Add Employee
              </button>
              <button 
                onClick={() => navigate('/employees')}
                className="w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left font-medium flex items-center"
              >
                <Users className="w-4 h-4 mr-3" />
                View All Employees
              </button>
              <button 
                onClick={() => navigate('/leave')}
                className="w-full p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left font-medium flex items-center"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Manage Leave Requests
              </button>
              <button 
                onClick={() => navigate('/positions')}
                className="w-full p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-left font-medium flex items-center"
              >
                <Briefcase className="w-4 h-4 mr-3" />
                Manage Positions
              </button>
            </div>
          </div>

          {/* Recent HR Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">HR Priority Activities</h3>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={`activity-${index}-${activity.type}`} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent activities</p>
                  <p className="text-xs mt-1">Activities will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
