class ApiResponse{
    constructor(statusCode, data, message = "Success"){
        this.data = data,
        this.statucCode = statusCode,
        this.message = message,
        this.success = statusCode < 400
    }
}

export {ApiResponse}