import { useState, useEffect } from "react";

function PositionForm({ onSave, editingPosition }) {

  const [formData, setFormData] = useState({
    position_title: "",
    min_salary: "",
    max_salary: "",
    dept_id: ""
  });

  useEffect(() => {
    if (editingPosition) {
      setFormData(editingPosition);
    } else {
      // Reset form when not editing
      setFormData({
        position_title: "",
        min_salary: "",
        max_salary: "",
        dept_id: ""
      });
    }
  }, [editingPosition]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent decimal input for salary fields
    if (name === 'min_salary' || name === 'max_salary') {
      // Allow only whole numbers
      const wholeNumberValue = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: wholeNumberValue
      });
      return;
    }
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    setFormData({
      position_title: "",
      min_salary: "",
      max_salary: "",
      dept_id: ""
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position Title <span className="text-red-500">*</span>
        </label>
        <input
          name="position_title"
          placeholder="e.g. Software Engineer, Manager"
          value={formData.position_title || ""}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department ID <span className="text-red-500">*</span>
        </label>
        <input
          name="dept_id"
          placeholder="Enter department ID"
          value={formData.dept_id || ""}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Min Salary
        </label>
        <input
          name="min_salary"
          type="text"
          placeholder="e.g. 50000"
          value={formData.min_salary || ""}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "." || e.key === "-") {
              e.preventDefault();
            }
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Salary
        </label>
        <input
          name="max_salary"
          type="text"
          placeholder="e.g. 100000"
          value={formData.max_salary || ""}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "." || e.key === "-") {
              e.preventDefault();
            }
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {editingPosition ? "Update Position" : "Add Position"}
        </button>
      </div>

    </form>
  );
}

export default PositionForm;