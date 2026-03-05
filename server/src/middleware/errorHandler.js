export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  console.error(`[AppError] [${req.method} ${req.originalUrl}]`, err.message);

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error',
    details: err.details || null
  });
};
