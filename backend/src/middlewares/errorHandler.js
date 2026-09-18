export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  console.error(`[error] [${req.method} ${req.path}] ${statusCode}:`, message);

  const response = {
    error: message,
    message,
  };

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}
