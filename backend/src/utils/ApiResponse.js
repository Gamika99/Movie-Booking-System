class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.statusCode = statusCode;
        this.status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error';
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();
    }

    static success(data, message = 'Success', statusCode = 200) {
        return new ApiResponse(statusCode, data, message);
    }

    static error(message, statusCode = 500, data = null) {
        return new ApiResponse(statusCode, data, message);
    }
}

module.exports = ApiResponse;