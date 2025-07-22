class ApiResponse {
  constructor(status, message = "Success", data = null) {
    this.status = status;
    this.data = data;
    this.message = message;
    this.success = status < 400; // Determine success based on status code
  }
}

export default ApiResponse;
