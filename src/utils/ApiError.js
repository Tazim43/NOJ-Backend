export default class ApiError extends Error {
  constructor(
    status,
    message = "something went wrong!",
    errors = [],
    success = false
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.success = success;
    this.errors = errors;
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      error: this.errors,
      success: this.success,
    };
  }
}
