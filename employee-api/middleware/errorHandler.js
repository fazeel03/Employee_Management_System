function errorHandler(err, req, res, next) {
  console.error("Global Error:", err);

  res.status(500).json({
    message: "Internal Server Error",
    error: err.message
  });
}

module.exports = errorHandler;
