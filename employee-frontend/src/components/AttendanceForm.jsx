import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function AttendanceForm({ onSave, editingAttendance, employees, canManageAll }) {

  const [formData, setFormData] = useState({
    emp_id: "",
    attendance_date: "",
    check_in: "",
    check_out: "",
    attendance_status: "Present"
  });
  const [userEmpId, setUserEmpId] = useState(null);

  useEffect(() => {
    if (editingAttendance) {
      setFormData({
        emp_id: editingAttendance.emp_id || "",
        attendance_date: editingAttendance.attendance_date?.split("T")[0] || "",
        check_in: editingAttendance.check_in || "",
        check_out: editingAttendance.check_out || "",
        attendance_status: editingAttendance.attendance_status || "Present"
      });
    }
  }, [editingAttendance]);

  useEffect(() => {
    if (!canManageAll) {
      axiosInstance.get('/employees/me')
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

    setFormData({
      emp_id: "",
      attendance_date: "",
      check_in: "",
      check_out: "",
      attendance_status: "Present"
    });
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
            Attendance Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="attendance_date"
            value={formData.attendance_date}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check In
            </label>
            <input
              type="time"
              name="check_in"
              value={formData.check_in}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check Out
            </label>
            <input
              type="time"
              name="check_out"
              value={formData.check_out}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="attendance_status"
            value={formData.attendance_status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {editingAttendance ? "Update Attendance" : "Mark Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AttendanceForm;