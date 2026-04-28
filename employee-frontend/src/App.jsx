import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ModalProvider } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Toaster } from "react-hot-toast";
import Layout from "./layout/Layout";
import DashboardRouter from "./components/DashboardRouter";
import EmployeesPage from "./pages/EmployeesPage";
import DepartmentPage from "./pages/DepartmentPage";
import PositionsPage from "./pages/PositionsPage";
import ProjectsPage from "./pages/ProjectsPage";
import EmployeeProjectsPage from "./pages/EmployeeProjectsPage";
import AttendancePage from "./pages/AttendancePage";
import SalaryPage from "./pages/SalaryPage";
import LeavePage from "./pages/LeavePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ModalManager from "./components/ModalManager";
import ProtectedRoute, { AdminRoute, ManagerRoute, UserRoute, HRRoute } from "./components/ProtectedRoute";

// Manager Pages
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import TeamMembersPage from "./pages/TeamMembersPage";
import TeamAttendancePage from "./pages/TeamAttendancePage";
import TeamLeaveRequestsPage from "./pages/TeamLeaveRequestsPage";

// Employee Pages
import MyProfilePage from "./pages/MyProfilePage";
import MyProjectsPage from "./pages/MyProjectsPage";
import MyAttendancePage from "./pages/MyAttendancePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// HR Pages
import EmployeeManagementPage from "./pages/EmployeeManagementPage";
import AttendanceReportsPage from "./pages/AttendanceReportsPage";
import LeaveManagementPage from "./pages/LeaveManagementPage";
import ReportsPage from "./pages/ReportsPage";

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <ToastProvider>
          <Router>
            <ModalManager />
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route path="/" element={
              <ProtectedRoute>
                <Layout> 
                  <DashboardRouter />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRouter />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin, HR, Manager Routes */}
            <Route path="/employees" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <EmployeesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees/add" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <EmployeesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/department" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <DepartmentPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/departments" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <DepartmentPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/positions" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <PositionsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin, Manager Routes */}
            <Route path="/projects" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <Layout>
                  <ProjectsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/projects/create" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <ProjectsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* All Authenticated Users Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <Layout>
                  <AttendancePage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin, HR, User, Manager Routes */}
            <Route path="/salary" element={
              <ProtectedRoute roles={['admin', 'hr', 'employee', 'manager']}>
                <Layout>
                  <SalaryPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin, HR, Manager Routes */}
            <Route path="/employee-projects" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Layout>
                  <EmployeeProjectsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/leave" element={
              <ProtectedRoute>
                <Layout>
                  <LeavePage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={
              <ManagerRoute>
                <Layout>
                  <ManagerDashboardPage />
                </Layout>
              </ManagerRoute>
            } />
            <Route path="/manager/team" element={
              <ManagerRoute>
                <Layout>
                  <TeamMembersPage />
                </Layout>
              </ManagerRoute>
            } />
            <Route path="/manager/team-attendance" element={
              <ManagerRoute>
                <Layout>
                  <TeamAttendancePage />
                </Layout>
              </ManagerRoute>
            } />
            <Route path="/manager/leave-requests" element={
              <ManagerRoute>
                <Layout>
                  <TeamLeaveRequestsPage />
                </Layout>
              </ManagerRoute>
            } />

            {/* Employee Routes */}
            <Route path="/employee/profile" element={
              <UserRoute>
                <Layout>
                  <MyProfilePage />
                </Layout>
              </UserRoute>
            } />
            <Route path="/employee/my-projects" element={
              <UserRoute>
                <Layout>
                  <MyProjectsPage />
                </Layout>
              </UserRoute>
            } />
            <Route path="/employee/my-attendance" element={
              <UserRoute>
                <Layout>
                  <MyAttendancePage />
                </Layout>
              </UserRoute>
            } />

            {/* HR Routes */}
            <Route path="/hr/employees" element={
              <HRRoute>
                <Layout>
                  <EmployeeManagementPage />
                </Layout>
              </HRRoute>
            } />
            <Route path="/hr/attendance-reports" element={
              <HRRoute>
                <Layout>
                  <AttendanceReportsPage />
                </Layout>
              </HRRoute>
            } />
            <Route path="/hr/leave-management" element={
              <HRRoute>
                <Layout>
                  <LeaveManagementPage />
                </Layout>
              </HRRoute>
            } />

            {/* Quick Actions Placeholder Routes */}
            <Route path="/reports" element={
              <AdminRoute>
                <Layout>
                  <ReportsPage />
                </Layout>
              </AdminRoute>
            } />
            <Route path="/payroll/settings" element={
              <AdminRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Payroll Settings</h1>
                    <p className="text-gray-600">Payroll settings page coming soon...</p>
                  </div>
                </Layout>
              </AdminRoute>
            } />
            <Route path="/system/settings" element={
              <AdminRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">System Settings</h1>
                    <p className="text-gray-600">System settings page coming soon...</p>
                  </div>
                </Layout>
              </AdminRoute>
            } />
            <Route path="/leave-requests/new" element={
              <UserRoute>
                <Layout>
                  <LeavePage />
                </Layout>
              </UserRoute>
            } />

            {/* Fallback route */}
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600">Page not found</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ToastProvider>
    </ModalProvider>
    </AuthProvider>
  );
}

export default App;