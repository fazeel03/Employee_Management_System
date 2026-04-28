import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";

function EmployeeForm({ onEmployeeAdded, editingEmployee }) {

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    hire_date: "",
    status: "Active",
    dept_id: "",
    position_id: "",
    manager_id: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [existingEmployees, setExistingEmployees] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // ===============================
  // FETCH DROPDOWN DATA
  // ===============================
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoadingDropdowns(true);
        console.log("Fetching dropdown data...");
        
        const [deptRes, posRes, mgrRes, empRes] = await Promise.all([
          axiosInstance.get('/departments'),
          axiosInstance.get('/positions'),
          axiosInstance.get('/employees/managers'),
          axiosInstance.get('/employees')
        ]);
        
        console.log("Departments response:", deptRes.data);
        console.log("Positions response:", posRes.data);
        console.log("Managers response:", mgrRes.data);
        console.log("Employees response:", empRes.data);
        
        setDepartments(Array.isArray(deptRes.data.data) ? deptRes.data.data : deptRes.data);
        setPositions(Array.isArray(posRes.data.data) ? posRes.data.data : posRes.data);
        setManagers(Array.isArray(mgrRes.data.data) ? mgrRes.data.data : mgrRes.data);
        setExistingEmployees(Array.isArray(empRes.data.data) ? empRes.data.data : empRes.data);
        
      } catch (error) {
        console.error("Dropdown fetch error:", error);
        // Continue without dropdown data - form will still work
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdowns();
  }, []);

  // ===============================
  // AUTO FILL WHEN EDITING
  // ===============================
  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        first_name: editingEmployee.first_name || "",
        last_name: editingEmployee.last_name || "",
        email: editingEmployee.email || "",
        phone: editingEmployee.phone || "",
        hire_date: editingEmployee.hire_date
          ? editingEmployee.hire_date.split("T")[0]
          : "",
        status: editingEmployee.status || "Active",
        dept_id: editingEmployee.dept_id?.toString() || "",
        position_id: editingEmployee.position_id?.toString() || "",
        manager_id: editingEmployee.manager_id?.toString() || ""
      });
      setErrors({});
    }
  }, [editingEmployee]);

  // ===============================
  // VALIDATE FORM
  // ===============================
  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
    } else if (!/^[A-Za-z ]{2,}$/.test(formData.first_name.trim())) {
      newErrors.first_name = "First name can only contain letters and spaces";
    }

    // Last Name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
    } else if (!/^[A-Za-z ]{2,}$/.test(formData.last_name.trim())) {
      newErrors.last_name = "Last name can only contain letters and spaces";
    }

    // Email validation (STRICT - only .com and .in domains)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address (.com or .in only)";
      }
    }

    // Phone validation (REQUIRED - exactly 10 digits)
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Phone must be exactly 10 digits";
      } else {
        // Check for duplicate phone number
        const duplicatePhone = existingEmployees.find(emp => 
          emp.phone === formData.phone.trim() && 
          emp.emp_id !== parseInt(editingEmployee?.emp_id || '0')
        );
        if (duplicatePhone) {
          newErrors.phone = "Phone number already exists";
        }
      }
    }

    // Department validation (REQUIRED)
    if (!formData.dept_id) {
      newErrors.dept_id = "Department is required";
    }

    // Position validation (REQUIRED)
    if (!formData.position_id) {
      newErrors.position_id = "Position is required";
    }

    // Hire Date validation
    if (!formData.hire_date) {
      newErrors.hire_date = "Hire date is required";
    } else {
      const hireDateObj = new Date(formData.hire_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to END of today so today is always valid
      
      if (hireDateObj > today) {
        newErrors.hire_date = "Hire date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===============================
  // HANDLE INPUT CHANGE
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent employee_code from being added to formData (it's readonly)
    if (name === 'employee_code') {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  // ===============================
  // HANDLE SUBMIT (ADD OR UPDATE)
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const submissionData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        hire_date: formData.hire_date,
        status: formData.status,
        dept_id: formData.dept_id ? parseInt(formData.dept_id) : null,
        position_id: formData.position_id ? parseInt(formData.position_id) : null,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null
      };

      // DEBUG: Log what's being sent
      console.log('SUBMISSION DATA:', submissionData);

      await onEmployeeAdded(submissionData);

      // Reset form after save
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        hire_date: "",
        status: "Active",
        dept_id: "",
        position_id: "",
        manager_id: ""
      });
      setErrors({});

    } catch (error) {
      console.error("Save failed:", error);
      
      // Handle specific error messages
      const errorMessage = error.response?.data?.message || "Failed to save employee. Please try again.";
      
      // Special handling for email already exists error
      if (errorMessage === "Email already exists") {
        toast.error('This email is already registered. Use a different email.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================
  // RESET FORM
  // ===============================
  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      hire_date: "",
      status: "Active",
      dept_id: "",
      position_id: "",
      manager_id: ""
    });
    setErrors({});
  };

  // ===============================
  // CANCEL FORM
  // ===============================
  const handleCancel = () => {
    resetForm();
    if (editingEmployee) {
      // Signal to parent that editing is cancelled
      onEmployeeAdded(null);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1 — Personal Information */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 pb-2 border-b">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Employee Code (Readonly in Edit Mode) */}
            {editingEmployee && (
              <div>
                <label htmlFor="employee_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code
                  <span className="text-xs text-gray-500 ml-2">(cannot be changed)</span>
                </label>
                <input
                  type="text"
                  id="employee_code"
                  name="employee_code"
                  value={editingEmployee.employee_code || ''}
                  disabled
                  style={{ 
                    background: '#f3f4f6', 
                    cursor: 'not-allowed',
                    borderColor: '#d1d5db'
                  }}
                  className="w-full border rounded-md px-3 py-2 text-gray-600"
                  readOnly
                />
              </div>
            )}
            
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                placeholder="Enter first name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                placeholder="Enter last name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Only .com and .in domains allowed</p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={10}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Enter 10-digit phone number</p>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Employment Details */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 pb-2 border-b">Employment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Hire Date */}
            <div>
              <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hire_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hire_date && (
                <p className="text-red-500 text-sm mt-1">{errors.hire_date}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="dept_id" className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="dept_id"
                name="dept_id"
                value={formData.dept_id ? parseInt(formData.dept_id) : ''}
                onChange={handleChange}
                disabled={loadingDropdowns}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dept_id ? 'border-red-500' : 'border-gray-300'
                } disabled:opacity-50`}
              >
                <option value="">
                  {loadingDropdowns ? 'Loading...' : 'Select Department...'}
                </option>
                {departments.map(dept => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
              {errors.dept_id && (
                <p className="text-red-500 text-sm mt-1">{errors.dept_id}</p>
              )}
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position_id" className="block text-sm font-medium text-gray-700 mb-1">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                id="position_id"
                name="position_id"
                value={formData.position_id ? parseInt(formData.position_id) : ''}
                onChange={handleChange}
                disabled={loadingDropdowns}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.position_id ? 'border-red-500' : 'border-gray-300'
                } disabled:opacity-50`}
              >
                <option value="">
                  {loadingDropdowns ? 'Loading...' : 'Select Position...'}
                </option>
                {positions.map(position => (
                  <option key={position.position_id} value={position.position_id}>
                    {position.position_title}
                  </option>
                ))}
              </select>
              {errors.position_id && (
                <p className="text-red-500 text-sm mt-1">{errors.position_id}</p>
              )}
            </div>

            {/* Manager */}
            <div>
              <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700 mb-1">
                Manager
              </label>
              <select
                id="manager_id"
                name="manager_id"
                value={formData.manager_id ? parseInt(formData.manager_id) : ''}
                onChange={handleChange}
                disabled={loadingDropdowns}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
              >
                <option value="">
                  {loadingDropdowns ? 'Loading...' : 'Select Manager...'}
                </option>
                {managers
                  .filter(m => m.emp_id !== parseInt(editingEmployee?.emp_id || '0'))
                  .map(manager => (
                    <option key={manager.emp_id} value={manager.emp_id}>
                      {manager.first_name} {manager.last_name} ({manager.employee_code})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editingEmployee ? "Updating..." : "Adding..."}
              </>
            ) : (
              <span>{editingEmployee ? "Update Employee" : "Add Employee"}</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

export default EmployeeForm;