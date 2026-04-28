import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import ManagerDashboard from '../components/ManagerDashboard';
import HRDashboard from '../components/HRDashboard';
import EmployeeDashboard from '../components/EmployeeDashboard';

const DashboardRouter = () => {
  const { user, isLoading } = useAuth();

  // 🔧 1. Handle loading state correctly
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 🔧 2. Debugging logs (TEMPORARY)
  console.log("User object:", user);
  console.log("User role:", user?.role);

  // 🔧 3. Ensure user exists before role check
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No user found</h2>
          <p className="text-gray-600">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  // 🔧 4. Normalize role value (CRITICAL FIX)
  const role = user.role?.toLowerCase();

  // 🔧 5. Correct Role-Based Rendering
  if (role === "admin") {
    return <DashboardPage />;
  }
  if (role === "manager") {
    return <ManagerDashboard />;
  }
  if (role === "hr") {
    return <HRDashboard />;
  }
  if (role === "employee") {
    return <EmployeeDashboard />;
  }

  // 🔧 6. Improve fallback error (for debugging)
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Not Available</h2>
        <p className="text-gray-600">Role detected: {user.role || "undefined"}</p>
        <p className="text-sm text-gray-500 mt-2">Expected roles: Admin, Manager, HR, Employee</p>
      </div>
    </div>
  );
};

export default DashboardRouter;
