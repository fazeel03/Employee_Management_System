import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function DepartmentForm({ onSave, editingDepartment }) {

  const [formData, setFormData] = useState({
    dept_name: "",
    location: "",
    budget: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingDepartment) {
      setFormData({
        dept_name: editingDepartment.dept_name || "",
        location: editingDepartment.location || "",
        budget: editingDepartment.budget ? editingDepartment.budget.toString() : ""
      });
      setErrors({});
    }
  }, [editingDepartment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent decimal input for budget
    if (name === 'budget') {
      // Allow only whole numbers
      const wholeNumberValue = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: wholeNumberValue
      });
      
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: ""
        });
      }
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

  const validateForm = () => {
    const newErrors = {};

    // Department Name validation
    if (!formData.dept_name.trim()) {
      newErrors.dept_name = "Department name is required";
    } else if (formData.dept_name.trim().length < 2) {
      newErrors.dept_name = "Department name must be at least 2 characters";
    }

    // Budget validation (optional but if provided must be positive whole number)
    if (formData.budget && formData.budget.trim()) {
      const budgetValue = parseInt(formData.budget);
      if (isNaN(budgetValue) || budgetValue < 0) {
        newErrors.budget = "Budget must be a positive whole number";
      } else if (!Number.isInteger(budgetValue)) {
        newErrors.budget = "Budget must be a whole number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Prepare data for API
    const submissionData = {
      dept_name: formData.dept_name.trim(),
      location: formData.location.trim() || null,
      budget: formData.budget && parseInt(formData.budget) > 0 ? parseInt(formData.budget) : null
    };

    console.log('SUBMITTING DEPARTMENT DATA:', submissionData);

    onSave(submissionData);

    // Reset form after both add and update
    setFormData({
      dept_name: "",
      location: "",
      budget: ""
    });
    setErrors({});
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="dept_name"
            placeholder="e.g. Finance, HR, Engineering"
            value={formData.dept_name}
            onChange={handleChange}
            required
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dept_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dept_name && (
            <p className="text-red-500 text-sm mt-1">{errors.dept_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            placeholder="e.g. Mumbai, India"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget
          </label>
          <input
            type="text"
            name="budget"
            placeholder="e.g. 50000"
            value={formData.budget}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "." || e.key === "-") {
                e.preventDefault();
              }
            }}
            min="0"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.budget ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.budget && (
            <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            {editingDepartment ? "Update Department" : "Add Department"}
          </button>
        </div>

      </form>
    </div>
  );
}

export default DepartmentForm;