import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

function LeaveForm({ onSave, editingLeave, employees, canManageAll }) {
  const [formData, setFormData] = useState({
    emp_id: "",
    leave_type: "Sick",
    start_date: "",
    end_date: "",
    reason: ""
  });
  const [userEmpId, setUserEmpId] = useState(null);

  const leaveTypes = [
    { value: "Sick", label: "Sick Leave", icon: "🤒" },
    { value: "Casual", label: "Casual Leave", icon: "🏖️" },
    { value: "Earned", label: "Earned Leave", icon: "💰" },
    { value: "Maternity", label: "Maternity Leave", icon: "🤱" },
    { value: "Paternity", label: "Paternity Leave", icon: "👨‍👦‍👦" },
    { value: "Unpaid", label: "Unpaid Leave", icon: "📋" }
  ];

  useEffect(() => {
    if (editingLeave) {
      setFormData({
        emp_id: editingLeave.emp_id || "",
        leave_type: editingLeave.leave_type || "Sick",
        start_date: editingLeave.start_date?.split("T")[0] || "",
        end_date: editingLeave.end_date?.split("T")[0] || "",
        reason: editingLeave.reason || ""
        // NOTE: Status is NOT included - should only be changed via approve/reject actions
      });
    }
  }, [editingLeave]);

  useEffect(() => {
    if (!canManageAll) {
      axiosInstance.get('/auth/me')
        .then(res => setUserEmpId(res.data.data?.emp_id))
        .catch(err => console.error('Could not fetch emp_id', err));
    }
  }, [canManageAll]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = canManageAll ? formData : { ...formData, emp_id: userEmpId };
    onSave(submissionData);

    // Reset form
    setFormData({
      emp_id: "",
      leave_type: "Sick",
      start_date: "",
      end_date: "",
      reason: ""
    });
  };

  const handleCancel = () => {
    setFormData({
      emp_id: "",
      leave_type: "Sick",
      start_date: "",
      end_date: "",
      reason: ""
    });
  };

  // Calculate minimum end date (start date + 1 day)
  const getMinEndDate = () => {
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      startDate.setDate(startDate.getDate() + 1);
      return startDate.toISOString().split('T')[0];
    }
    return "";
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {canManageAll && (
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
              {employees.map((emp) => (
                <option key={emp.emp_id} value={emp.emp_id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <select
            name="leave_type"
            value={formData.leave_type}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {leaveTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              min={getMinEndDate()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Reason for leave request"
            maxLength="255"
            rows="3"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {editingLeave ? "Update Request" : "Submit Request"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default LeaveForm;