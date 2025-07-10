class ApiErrors extends Error {
  constructor(
    statusCode,
    message = "An error occurred",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false; // Indicates that the operation was not successful
    this.errors = errors; // Array of error details
    this.isOperational = true; // Indicates that this is an operational error
    Error.captureStackTrace(this, this.constructor);
    // Capture the stack trace if not provided
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiErrors;