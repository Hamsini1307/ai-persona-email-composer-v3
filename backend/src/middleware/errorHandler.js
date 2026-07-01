/**
 * Catches any error not already handled inside a controller's try/catch,
 * plus malformed JSON bodies from express.json(), and returns a consistent
 * JSON error shape instead of leaking stack traces or crashing the process.
 */
function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Malformed JSON in request body." });
  }

  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || "Internal server error.",
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
}

module.exports = { errorHandler, notFoundHandler };
