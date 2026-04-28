import { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

function ProjectForm({ onSave, editingProject }) {
  const { isAdmin, isManager, user } = useAuth();
  const [managerEmpId, setManagerEmpId] = useState(null);
  const [managerName, setManagerName] = useState('');
  const [managers, setManagers] = useState([]);
  const [formData, setFormData] = useState({
    project_name: "",
    start_date: "",
    end_date: "",
    budget: "",
    status: "Planned",
    project_manager_id: ""
  });

  useEffect(() => {
    if (editingProject) {
      setFormData({
        project_name: editingProject.project_name || "",
        start_date: editingProject.start_date?.split("T")[0] || "",
        end_date: editingProject.end_date?.split("T")[0] || "",
        budget: editingProject.budget ? editingProject.budget.toString() : "",
        status: editingProject.status || "Planned",
        project_manager_id: editingProject.project_manager_id ? editingProject.project_manager_id.toString() : ""
      });
    }
  }, [editingProject]);

  useEffect(() => {
    if (isManager()) {
      // Fetch manager's own employee record
      axiosInstance.get('/employees/me')
        .then(res => {
          const emp = res.data.data;
          setManagerEmpId(emp?.emp_id);
          setManagerName(
            `${emp?.first_name} ${emp?.last_name}` 
          );
        })
        .catch(err => 
          console.error('Could not fetch manager info', err)
        );
    }
    
    if (isAdmin()) {
      // Fetch list of all managers for dropdown
      axiosInstance.get('/employees/managers')
        .then(res => {
          const list = res.data.data || res.data || [];
          setManagers(list);
        })
        .catch(err => 
          console.error('Could not fetch managers', err)
        );
    }
  }, []);

  useEffect(() => {
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent decimal input for budget
    if (name === 'budget') {
      // Allow only whole numbers
      const wholeNumberValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: wholeNumberValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a copy of the data to avoid reset issues
    const dataToSubmit = {
      ...formData,
      budget: formData.budget !== "" ? parseInt(formData.budget) : null,
      project_manager_id: isManager() 
        ? managerEmpId 
        : formData.project_manager_id 
        ? parseInt(formData.project_manager_id) 
        : null
    };
    
    // Call onSave with processed data
    onSave(dataToSubmit);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="project_name"
            placeholder="Enter project name"
            value={formData.project_name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget
            </label>
            <input
              type="text"
              name="budget"
              placeholder="e.g. 100000"
              value={formData.budget}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "." || e.key === "-") {
                  e.preventDefault();
                }
              }}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Planned</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Manager
          </label>
          
          {isAdmin() ? (
            <select
              name="project_manager_id"
              value={formData.project_manager_id || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Project Manager</option>
              {managers.map(mgr => (
                <option key={mgr.emp_id} value={mgr.emp_id}>
                  {mgr.first_name} {mgr.last_name} ({mgr.employee_code})
                </option>
              ))}
            </select>
          ) : isManager() ? (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 text-sm cursor-not-allowed flex items-center justify-between">
              <span>
                {managerName || user?.name || 'You'} 
                <span className="text-gray-400 ml-1">(You)</span>
              </span>
              <span className="text-xs text-gray-400 italic">
                Auto-assigned
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {editingProject ? "Update Project" : "Add Project"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;