import { useEffect, useState } from "react";

function SalaryForm({ onSave, editingSalary, employees }) {
  const [formData, setFormData] = useState({
    emp_id: "",
    salary_amount: "",
    effective_from: "",
    effective_to: "",
    change_reason: "",
    status: "Active"
  });

  useEffect(() => {
    if (editingSalary) {
      setFormData({
        emp_id: editingSalary.emp_id ? editingSalary.emp_id.toString() : "",
        salary_amount: editingSalary.salary_amount ? editingSalary.salary_amount.toString() : "",
        effective_from: editingSalary.effective_from?.split("T")[0] || "",
        effective_to: editingSalary.effective_to?.split("T")[0] || "",
        change_reason: editingSalary.change_reason || "",
        status: editingSalary.status || "Active"
      });
    } else {
      // Reset form when not editing
      setFormData({
        emp_id: "",
        salary_amount: "",
        effective_from: "",
        effective_to: "",
        change_reason: "",
        status: "Active"
      });
    }
  }, [editingSalary]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent decimal input for salary amount
    if (name === 'salary_amount') {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Process form data
    const processedData = {
      emp_id: formData.emp_id && !isNaN(parseInt(formData.emp_id)) ? parseInt(formData.emp_id) : 0,
      salary_amount: formData.salary_amount && !isNaN(parseInt(formData.salary_amount)) ? parseInt(formData.salary_amount) : 0,
      effective_from: formData.effective_from || "",
      effective_to: formData.effective_to || null,
      change_reason: formData.change_reason || "",
      status: formData.status || "Active"
    };

    await onSave(processedData);
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
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.emp_id} value={emp.emp_id}>
                {emp.first_name} {emp.last_name} ({emp.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="salary_amount"
              placeholder="e.g. 50000"
              value={formData.salary_amount}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "." || e.key === "-") {
                  e.preventDefault();
                }
              }}
              required
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="effective_from"
              value={formData.effective_from}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective To
            </label>
            <input
              type="date"
              name="effective_to"
              value={formData.effective_to}
              onChange={handleChange}
              min={formData.effective_from}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if currently active</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Change Reason
          </label>
          <textarea
            name="change_reason"
            placeholder="Reason for salary change (if applicable)"
            value={formData.change_reason}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {editingSalary ? "Update Salary Record" : "Add Salary Record"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalaryForm;