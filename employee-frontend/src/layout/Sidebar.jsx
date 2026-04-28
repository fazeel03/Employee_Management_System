import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { LogOut, LayoutDashboard, Users, Building2, Briefcase, FolderKanban, UserCog, Calendar, DollarSign, FileText, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  console.log("Sidebar rendered, user:", user);
  console.log("Sidebar user role:", user?.role);

  const menuItems = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard, allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.USER] },
    { label: "Employees", to: "/employees", icon: Users, allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER] },
    { label: "Departments", to: "/department", icon: Building2, allowedRoles: [ROLES.ADMIN, ROLES.HR] },
    { label: "Positions", to: "/positions", icon: Briefcase, allowedRoles: [ROLES.ADMIN, ROLES.HR] },
    { label: "Projects", to: "/projects", icon: FolderKanban, allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
    { label: "Employee Projects", to: "/employee-projects", icon: UserCog, allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
    { label: "Attendance", to: "/attendance", icon: Calendar, allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.USER] },
    { label: "Salary History", to: "/salary", icon: DollarSign, allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.USER] },
    { label: "Leave Requests", to: "/leave", icon: FileText, allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.USER] },
    { label: "Reports", to: "/reports", icon: BarChart3, allowedRoles: [ROLES.ADMIN] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.allowedRoles.includes(user.role)
  );

  return (
    <div className={`bg-gradient-to-b from-blue-600 to-blue-800 text-white min-h-screen p-4 flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-60'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-all duration-300 z-10"
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Logo/Title */}
      <div className="mb-6 flex items-center justify-center">
        {isCollapsed ? (
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center font-bold text-lg">
            E
          </div>
        ) : (
          <h2 className="text-xl font-bold">EMS</h2>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white shadow-md' 
                    : 'hover:bg-white hover:bg-opacity-10'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-white border-opacity-20">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;