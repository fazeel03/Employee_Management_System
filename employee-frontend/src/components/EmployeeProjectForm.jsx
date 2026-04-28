import { useState, useEffect } from "react";
import { getEmployees } from "../api/employeeService";
import { getProjects } from "../api/projectService";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

function EmployeeProjectForm({ onSave, editingAssignment, onCancel }) {
  const { isManager } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: "",
    project_id: "",
    role_name: "",
    allocation_percent: 100,
    assigned_on: "",
    released_on: ""
  });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (editingAssignment) {
      setFormData({
        emp_id: editingAssignment.emp_id ? parseInt(editingAssignment.emp_id) : "",
        project_id: editingAssignment.project_id ? parseInt(editingAssignment.project_id) : "",
        role_name: editingAssignment.role_name || "",
        allocation_percent: editingAssignment.allocation_percent || 100,
        assigned_on: editingAssignment.assigned_on?.split("T")[0] || "",
        released_on: editingAssignment.released_on?.split("T")[0] || ""
      });
    } else {
      setFormData({
        emp_id: "",
        project_id: "",
        role_name: "",
        allocation_percent: 100,
        assigned_on: "",
        released_on: ""
      });
    }
  }, [editingAssignment]);

  const fetchDropdowns = async () => {
    try {
      setLoadingEmployees(true);
      let employeeList = [];
      
      if (isManager()) {
        const empRes = await axiosInstance.get('/employees/team');
        employeeList = empRes.data.data || [];
      } else {
        const empRes = await axiosInstance.get('/employees/active');
        employeeList = empRes.data.data || empRes.data || [];
      }
      
      const projRes = await getProjects();
      const projectList = projRes.data.data || [];
      
      setEmployees(employeeList);
      setProjects(projectList);
      
    } catch (error) {
      console.error("Dropdown fetch failed:", error);
      toast.error('Failed to load data');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onSave(formData);

    setFormData({
      emp_id: "",
      project_id: "",
      role_name: "",
      allocation_percent: 100,
      assigned_on: "",
      released_on: ""
    });

    if (onCancel) onCancel();
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee <span className="text-red-500">*</span>
          </label>
          <select
            name="emp_id"
            value={formData.emp_id}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {loadingEmployees ? 'Loading employees...' : 'Select Employee'}
            </option>
            {employees.map((emp) => (
              <option key={emp.emp_id} value={emp.emp_id}>
                {emp.first_name} {emp.last_name}
                {' '}({emp.employee_code}
                {emp.position_title ? ' - ' + emp.position_title : ''})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Project</option>
            {projects.map((proj) => (
              <option key={proj.project_id} value={proj.project_id}>
                {proj.project_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              name="role_name"
              placeholder="e.g. Developer, Designer"
              value={formData.role_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allocation %
            </label>
            <input
              type="number"
              name="allocation_percent"
              placeholder="100"
              value={formData.allocation_percent}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned On <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="assigned_on"
              value={formData.assigned_on}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Released On
            </label>
            <input
              type="date"
              name="released_on"
              value={formData.released_on}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if still active</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {editingAssignment ? "Update Assignment" : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeProjectForm;