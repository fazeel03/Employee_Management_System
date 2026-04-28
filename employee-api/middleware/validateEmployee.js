function validateEmployee(req, res, next) {
  const {
    first_name,
    last_name,
    email,
    hire_date,
    dept_id,
    position_id,
    status
  } = req.body;

  // Required fields
  if (!first_name || !last_name || !email || !hire_date) {
    return res.status(400).json({
      message: "All required fields must be provided"
    });
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format"
    });
  }

  // Numeric validation (only if provided)
  if (
    (dept_id !== undefined && dept_id !== null && isNaN(dept_id)) ||
    (position_id !== undefined && position_id !== null && isNaN(position_id))
  ) {
    return res.status(400).json({
      message: "dept_id and position_id must be numbers"
    });
  }

  // Status validation (optional)
  if (status && !["Active", "Inactive"].includes(status)) {
    return res.status(400).json({
      message: "Status must be Active or Inactive"
    });
  }

  next();
}

module.exports = validateEmployee;